// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

// Local app for the paper lantern. Requires Node 18+ and OpenSCAD on PATH.
// The model parameters, defaults and ranges are read from the SCAD source so
// the web controls cannot drift away from the actual template.
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const s_directory = dirname(fileURLToPath(import.meta.url));
const s_model = join(s_directory, "paper_folding_lantern.scad");
const s_logo = join(s_directory, "veryos_logo.svg");
const s_source = await readFile(s_model, "utf8");

// Read the OpenSCAD Customizer lines: name = default; // [min:step:max] or
// [choice, choice, ...]. The internal output switch is not a user setting.
export const a_o_parameter = [...s_source.matchAll(
    /^([a-z_]+)\s*=\s*(.+?);\s*\/\/\s*\[([^\]]+)\]/gm,
)].filter((a_s_match) => a_s_match[1] !== "output").map((a_s_match) => {
    const [, s_name, s_default, s_options] = a_s_match;
    const v_default = JSON.parse(s_default);
    return {
        s_name,
        v_default,
        ...(typeof v_default === "number"
            ? { a_n_range: s_options.split(":").map(Number) }
            : { a_s_option: s_options.split(",").map((s) => s.trim()) }),
    };
});

export function f_o_parameters(o_input) {
    if (!o_input || typeof o_input !== "object" || Array.isArray(o_input)) {
        throw new Error("Expected a settings object.");
    }
    for (const s_name of Object.keys(o_input)) {
        if (!a_o_parameter.some((o) => o.s_name === s_name)) {
            throw new Error(`Unknown parameter: ${s_name}`);
        }
    }
    return Object.fromEntries(a_o_parameter.map((o) => {
        const v_value = Object.hasOwn(o_input, o.s_name) ? o_input[o.s_name] : o.v_default;
        if (o.a_n_range) {
            const [n_min, , n_max] = o.a_n_range;
            if (typeof v_value !== "number" || !Number.isFinite(v_value)
                || v_value < n_min || v_value > n_max) {
                throw new Error(`${o.s_name} must be between ${n_min} and ${n_max} mm.`);
            }
        } else if (!o.a_s_option.includes(v_value)) {
            throw new Error(`Invalid choice for ${o.s_name}.`);
        }
        return [o.s_name, v_value];
    }));
}

async function f_render(s_output, s_path, o_parameters, n_timeout = 60000) {
    const a_s_argument = [
        "--hardwarnings",
        "-o", s_path,
        "-D", `output=${JSON.stringify(s_output)}`,
        "-D", `logo_file=${JSON.stringify(s_logo)}`,
    ];
    if (s_path.endsWith(".stl")) a_s_argument.push("--export-format", "binstl");
    for (const [s_name, v_value] of Object.entries(o_parameters)) {
        a_s_argument.push("-D", `${s_name}=${JSON.stringify(v_value)}`);
    }
    a_s_argument.push(s_model);

    const o_process = spawn("openscad", a_s_argument, {
        cwd: s_directory,
        env: { ...process.env, QT_QPA_PLATFORM: "offscreen" },
        stdio: ["ignore", "pipe", "pipe"],
    });
    let s_log = "";
    o_process.stdout.on("data", (o_data) => { s_log += o_data.toString(); });
    o_process.stderr.on("data", (o_data) => { s_log += o_data.toString(); });
    const n_kill = setTimeout(() => {
        try { o_process.kill("SIGKILL"); } catch { /* Already gone. */ }
    }, n_timeout);

    const n_code = await new Promise((f_resolve, f_reject) => {
        o_process.on("error", f_reject);
        o_process.on("close", f_resolve);
    }).finally(() => clearTimeout(n_kill));

    if (n_code !== 0) {
        const s_assertion = s_log.match(/failed: "([^"]+)"/);
        const s_error = s_log.match(/^ERROR: ([^\n]+)/m);
        if (!s_assertion) console.error(s_log);
        throw new Error(s_assertion?.[1] || s_error?.[1]
            || "OpenSCAD could not render these settings. Check the server log.");
    }
}

function f_o_stl(a_n_bytes) {
    const o_view = new DataView(a_n_bytes.buffer, a_n_bytes.byteOffset, a_n_bytes.byteLength);
    if (a_n_bytes.byteLength < 84) throw new Error("OpenSCAD returned an empty 3D model.");
    const n_triangle = o_view.getUint32(80, true);
    if (a_n_bytes.byteLength !== 84 + n_triangle * 50 || n_triangle === 0) {
        throw new Error("Could not read the folded 3D model.");
    }
    const a_n_position = new Float32Array(n_triangle * 9);
    for (let n_face = 0; n_face < n_triangle; n_face++) {
        for (let n_coordinate = 0; n_coordinate < 9; n_coordinate++) {
            a_n_position[n_face * 9 + n_coordinate] =
                o_view.getFloat32(84 + n_face * 50 + 12 + n_coordinate * 4, true);
        }
    }
    return { a_n_position: Array.from(a_n_position), n_triangle };
}

function f_n_svg_size(s_svg) {
    const o_match = s_svg.match(/<svg[^>]*\bwidth="([\d.]+)mm"[^>]*\bheight="([\d.]+)mm"/);
    if (!o_match) throw new Error("Could not read the template dimensions.");
    return [Number(o_match[1]), Number(o_match[2])];
}

// Browsers use the nonzero fill rule by default. The net's holes (windows,
// hanger hole, logo slits) are separate contours, so even-odd makes the SVG
// render as cut paper both in the app and in a browser tab.
function f_s_evenodd(s_svg) {
    return s_svg.replace("<path d=\"", "<path fill-rule=\"evenodd\" d=\"");
}

export async function f_o_render(o_input) {
    const o_parameters = f_o_parameters(o_input);
    const s_temp = await mkdtemp(join(tmpdir(), "paper-lantern-"));
    try {
        const a_o_result = await Promise.allSettled([
            f_render("cut", join(s_temp, "cut.svg"), o_parameters),
            f_render("folded", join(s_temp, "folded.stl"), o_parameters),
            f_render("fold_lines", join(s_temp, "fold.svg"), o_parameters),
        ]);
        for (const o_result of a_o_result) {
            if (o_result.status === "rejected") throw o_result.reason;
        }
        const [s_svg_raw, a_n_stl, s_fold_svg] = await Promise.all([
            readFile(join(s_temp, "cut.svg"), "utf8"),
            readFile(join(s_temp, "folded.stl")),
            readFile(join(s_temp, "fold.svg"), "utf8"),
        ]);
        const { a_n_position, n_triangle } = f_o_stl(a_n_stl);
        const s_svg = f_s_evenodd(s_svg_raw);
        const [n_width, n_height] = f_n_svg_size(s_svg_raw);
        return {
            s_svg,
            s_fold_svg,
            s_stl: a_n_stl.toString("base64"),
            n_triangle,
            a_n_position,
            n_width,
            n_height,
            o_parameters,
        };
    } finally {
        await rm(s_temp, { recursive: true, force: true });
    }
}

async function f_o_body(o_request, n_limit = 65536) {
    const a_n_chunk = [];
    let n_size = 0;
    for await (const o_chunk of o_request.body) {
        n_size += o_chunk.byteLength;
        if (n_size > n_limit) throw new Error("The request is too large.");
        a_n_chunk.push(o_chunk);
    }
    return Buffer.concat(a_n_chunk).toString("utf8");
}

const o_file = {
    "/": ["index.html", "text/html"],
    "/index.html": ["index.html", "text/html"],
    "/app.js": ["app.js", "text/javascript"],
    "/veryos_logo.svg": ["veryos_logo.svg", "image/svg+xml"],
};

let b_rendering = false;
export async function f_o_response(o_request) {
    const o_url = new URL(o_request.url);
    if (o_request.method === "GET") {
        if (o_url.pathname === "/api/parameters") {
            return Response.json(a_o_parameter, {
                headers: { "cache-control": "no-store" },
            });
        }
        const a_s_file = o_file[o_url.pathname];
        if (a_s_file) {
            return new Response(await readFile(join(s_directory, a_s_file[0])), {
                headers: {
                    "content-type": `${a_s_file[1]}; charset=utf-8`,
                    "cache-control": "no-store",
                },
            });
        }
    }
    if (o_request.method === "POST" && o_url.pathname === "/api/render") {
        const s_origin = o_request.headers.get("origin");
        if (s_origin && s_origin !== o_url.origin) {
            return new Response("Forbidden", { status: 403 });
        }
        if (b_rendering) {
            return Response.json({ error: "Another render is running. Try again shortly." },
                { status: 503 });
        }
        b_rendering = true;
        try {
            let s_body;
            try {
                s_body = await f_o_body(o_request);
            } catch (o_error) {
                return Response.json({ error: o_error.message }, { status: 413 });
            }
            return Response.json(await f_o_render(JSON.parse(s_body)));
        } catch (o_error) {
            return Response.json({ error: o_error.message }, { status: 400 });
        } finally {
            b_rendering = false;
        }
    }
    return new Response("Not found", { status: 404 });
}

async function f_main() {
    const n_port = Number(process.env.PORT) || 8055;
    const o_server = createServer(async (o_request, o_response) => {
        try {
            const a_n_chunk = [];
            if (!["GET", "HEAD"].includes(o_request.method)) {
                for await (const o_chunk of o_request) a_n_chunk.push(o_chunk);
            }
            const s_url = `http://${o_request.headers.host}${o_request.url}`;
            const o_web_request = new Request(s_url, {
                method: o_request.method,
                headers: o_request.headers,
                body: a_n_chunk.length ? Buffer.concat(a_n_chunk) : undefined,
            });
            const o_web_response = await f_o_response(o_web_request);
            const o_headers = Object.fromEntries(o_web_response.headers.entries());
            o_response.writeHead(o_web_response.status, {
                ...o_headers,
                "x-content-type-options": "nosniff",
            });
            o_response.end(Buffer.from(await o_web_response.arrayBuffer()));
        } catch (o_error) {
            console.error(o_error);
            o_response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
            o_response.end("Internal server error");
        }
    });
    o_server.listen(n_port, "127.0.0.1", () => {
        console.log(`Paper lantern designer: http://127.0.0.1:${n_port}`);
        console.log(JSON.stringify({ url: `http://127.0.0.1:${n_port}` }));
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await f_main();
}
