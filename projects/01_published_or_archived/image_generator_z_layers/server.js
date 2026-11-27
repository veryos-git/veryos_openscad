// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Serves the app and runs loop_evolve.py for it. On the first start it creates venv/ and
// installs the Python packages. Every run is the folder runs/<id>/ with params.json,
// log.txt, frames/ and animation.gif.
// Run: deno task start

import {serveDir} from "jsr:@std/http@1/file-server";

const port = 8767;
const runs_dir = "runs";
const windows = Deno.build.os === "windows";
const system_python = windows ? "python" : "python3";
const python = windows ? "venv\\Scripts\\python.exe" : "venv/bin/python";

// name, default, min, max; the frontend reads this table too
const params = {
    prompt: {default: "a closed loop line"},
    frames: {default: 60, min: 1, max: 2000},
    strength: {default: 0.3, min: 0.1, max: 0.95},
    steps: {default: 4, min: 1, max: 20},
    noise: {default: 200, min: 0, max: 20000},
    spread: {default: 15, min: 1, max: 256},
    seed: {default: 0, min: 0, max: 2 ** 31 - 1},
    fps: {default: 8, min: 1, max: 50},
    dry_run: {default: false},
};

function reply(status, body) {
    return new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json"}});
}
const fail = (status, error) => reply(status, {error});

async function exists(path) {
    try {
        await Deno.stat(path);
        return true;
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) return false;
        throw error;
    }
}

async function run_command(cmd, args) {
    const {code} = await new Deno.Command(cmd, {args, stdout: "inherit", stderr: "inherit"}).output();
    if (code !== 0) throw new Error(`${cmd} ${args.join(" ")} failed with code ${code}`);
}

async function has_nvidia_gpu() {
    try {
        return (await new Deno.Command("nvidia-smi", {stdout: "null", stderr: "null"}).output()).code === 0;
    } catch {
        return false;
    }
}

// ---------- install ----------
async function ensure_venv() {
    if (await exists("venv/installed")) return;
    console.log("first start: creating venv/ and installing the Python packages, this takes a while");
    if (!await exists(python)) await run_command(system_python, ["-m", "venv", "venv"]);
    // without a GPU the CPU build of torch is enough and much smaller than the CUDA build
    const index = await has_nvidia_gpu()
        ? []
        : ["--index-url", "https://download.pytorch.org/whl/cpu", "--extra-index-url", "https://pypi.org/simple"];
    await run_command(python, ["-m", "pip", "install", "-r", "requirements.txt", ...index]);
    await Deno.writeTextFile("venv/installed", ""); // a failed install is retried on the next start
}

// ---------- runs ----------
let current = null; // the running job: {id, process, frames, total, log, done, error}

function validate(body) {
    const out = {};
    for (const [name, rule] of Object.entries(params)) {
        let value = body[name] ?? rule.default;
        if (name === "prompt") {
            if (typeof value !== "string" || value.trim() === "") return [null, "prompt is empty"];
            out[name] = value.trim();
        } else if (name === "dry_run") {
            out[name] = value === true;
        } else {
            value = Number(value);
            if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
                return [null, `${name} must be between ${rule.min} and ${rule.max}`];
            }
            out[name] = name === "strength" ? value : Math.round(value);
        }
    }
    return [out, null];
}

function run_id(prompt) {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "_");
    const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32);
    return slug ? `${stamp}_${slug}` : stamp;
}

async function start_run(body) {
    if (current && !current.done) return fail(409, "a run is already going, stop it or wait");
    const [p, error] = validate(body);
    if (error) return fail(400, error);

    const id = run_id(p.prompt);
    const dir = `${runs_dir}/${id}`;
    await Deno.mkdir(`${dir}/frames`, {recursive: true});
    await Deno.writeTextFile(`${dir}/params.json`, JSON.stringify(p, null, 2));

    const args = ["loop_evolve.py",
        "--frames", String(p.frames), "--prompt", p.prompt, "--strength", String(p.strength),
        "--steps", String(p.steps), "--noise", String(p.noise), "--spread", String(p.spread),
        "--seed", String(p.seed), "--fps", String(p.fps),
        "--out-dir", `${dir}/frames`, "--gif", `${dir}/animation.gif`];
    if (p.dry_run) args.push("--dry-run");

    const process = new Deno.Command(python, {args, stdout: "piped", stderr: "piped", env: {PYTHONUNBUFFERED: "1"}}).spawn();
    current = {id, process, frames: 0, total: p.frames, log: [], done: false, error: null};
    const job = current;
    const log_file = await Deno.open(`${dir}/log.txt`, {write: true, create: true, truncate: true});

    const read = async (stream) => {
        const decoder = new TextDecoder();
        let rest = "";
        for await (const chunk of stream) {
            await log_file.write(chunk);
            rest += decoder.decode(chunk, {stream: true});
            const lines = rest.split(/\r?\n/);
            rest = lines.pop();
            for (const line of lines) {
                if (line.trim() === "") continue;
                job.log.push(line);
                if (job.log.length > 50) job.log.shift();
                const m = line.match(/^frame (\d+)\/(\d+)$/);
                if (m) job.frames = Number(m[1]);
            }
        }
        if (rest.trim() !== "") job.log.push(rest);
    };

    (async () => {
        await Promise.all([read(process.stdout), read(process.stderr)]);
        const {code, signal} = await process.status;
        log_file.close();
        await Deno.remove(`${dir}/animation.gif.tmp`).catch(() => {}); // a stop can interrupt a gif write
        job.done = true;
        if (signal) job.error = "stopped";
        else if (code !== 0) job.error = `loop_evolve.py failed with code ${code}, see the log`;
    })();

    return reply(200, {id});
}

async function count_frames(dir) {
    let n = 0;
    try {
        for await (const entry of Deno.readDir(`${dir}/frames`)) if (entry.name.endsWith(".png")) n++;
    } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
    return n;
}

async function run_info(id) {
    const dir = `${runs_dir}/${id}`;
    if (!await exists(`${dir}/params.json`)) return null;
    const info = {id, params: JSON.parse(await Deno.readTextFile(`${dir}/params.json`))};
    const job = current && current.id === id ? current : null;
    info.frames = job ? job.frames : await count_frames(dir) - 1; // frame_0000 is the sketch
    info.running = job ? !job.done : false;
    info.error = job ? job.error : null;
    info.gif = await exists(`${dir}/animation.gif`);
    info.log = job ? job.log : [];
    return info;
}

async function list_runs() {
    const ids = [];
    for await (const entry of Deno.readDir(runs_dir)) if (entry.isDirectory) ids.push(entry.name);
    ids.sort().reverse();
    const infos = [];
    for (const id of ids) {
        const info = await run_info(id);
        if (info) {
            delete info.log;
            infos.push(info);
        }
    }
    return infos;
}

// This server starts processes. Any web page open in the browser can send requests to
// localhost, so only the app itself may use the API.
function from_this_app(request) {
    const host = request.headers.get("host");
    const origin = request.headers.get("origin");
    return [`localhost:${port}`, `127.0.0.1:${port}`].includes(host) && (origin === null || origin === `http://${host}`);
}

const valid_id = /^[0-9]{8}_[0-9]{6}(_[a-z0-9_]+)?$/;

async function handle_api(request, path) {
    if (!from_this_app(request)) return fail(403, "only the app itself may use the API");
    const {method} = request;
    if (path === "/api/params") return reply(200, params);
    if (path === "/api/runs") {
        if (method === "GET") return reply(200, await list_runs());
        if (method === "POST") return start_run(await request.json().catch(() => ({})));
    }
    const m = path.match(/^\/api\/runs\/([^/]+)(\/stop)?$/);
    if (m) {
        const [, id, stop] = m;
        if (!valid_id.test(id)) return fail(400, "not a run id");
        if (stop) {
            if (method !== "POST") return fail(405, "POST only");
            if (!current || current.id !== id || current.done) return fail(409, "this run is not going");
            current.process.kill("SIGTERM");
            return reply(200, {});
        }
        if (method === "GET") {
            const info = await run_info(id);
            return info ? reply(200, info) : fail(404, `no run "${id}"`);
        }
    }
    return fail(404, "not found");
}

const no_cache = {"cache-control": "no-store"};

async function handle(request) {
    const {pathname} = new URL(request.url);
    if (pathname.startsWith("/api/")) return handle_api(request, pathname);
    if (pathname.startsWith("/runs/")) {
        return serveDir(request, {fsRoot: runs_dir, urlRoot: "runs", quiet: true, headers: ["cache-control: no-store"]});
    }
    const file = pathname === "/" ? "index.html" : pathname.slice(1);
    if (!["index.html", "app.js"].includes(file)) return fail(404, "not found");
    const type = file.endsWith(".js") ? "text/javascript" : "text/html";
    return new Response(await Deno.readFile(file), {headers: {...no_cache, "content-type": `${type}; charset=utf-8`}});
}

// Ctrl-C must take the run down with the server, or it keeps going as an orphan.
for (const signal of ["SIGINT", "SIGTERM"]) {
    Deno.addSignalListener(signal, () => {
        if (current && !current.done) current.process.kill("SIGTERM");
        Deno.exit();
    });
}

await ensure_venv();
await Deno.mkdir(runs_dir, {recursive: true});
Deno.serve({port, hostname: "127.0.0.1"}, handle);
