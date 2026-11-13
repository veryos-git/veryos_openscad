// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Serves the app and keeps its projects as files, so git can track them: a project
// is the folder projects/<name>/, with its script in script.js, as it is in the editor.
// Run: deno task start

import {serveDir} from "jsr:@std/http@1/file-server";

// The sphere's webapp has 8765.
const port = 8766;
const projects_dir = "projects";
// The name is the folder's name, so it must not be able to leave projects/.
const valid_name = /^[\p{L}\p{N}_](?:[\p{L}\p{N} _-]{0,62}[\p{L}\p{N}_-])?$/u;

function reply(status, body) {
    return new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json"}});
}
const fail = (status, error) => reply(status, {error});

async function folder_exists(path) {
    try {
        return (await Deno.stat(path)).isDirectory;
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) return false;
        throw error;
    }
}

async function project_names() {
    const names = [];
    for await (const entry of Deno.readDir(projects_dir)) {
        if (entry.isDirectory && valid_name.test(entry.name)) names.push(entry.name);
    }
    return names.sort((a, b) => a.localeCompare(b));
}

// This server can write files. Any web page open in the browser can send requests to
// localhost, so only the app itself may use the API.
function from_this_app(request) {
    const host = request.headers.get("host");
    const origin = request.headers.get("origin");
    return [`localhost:${port}`, `127.0.0.1:${port}`].includes(host) && (origin === null || origin === `http://${host}`);
}

// The script a request brings, as {code}.
async function sent_script(request) {
    const {code} = await request.json();
    if (typeof code !== "string") throw new SyntaxError("no script");
    return code;
}

async function handle_project(request, name) {
    if (!valid_name.test(name)) return fail(400, `"${name}" is not a valid name: use letters, digits, spaces, _ and -`);
    const dir = `${projects_dir}/${name}`;
    const file = `${dir}/script.js`;
    const {method} = request;

    if (method === "POST") {
        const code = await sent_script(request);
        try {
            await Deno.mkdir(dir);
        } catch (error) {
            if (error instanceof Deno.errors.AlreadyExists) return fail(409, `a project "${name}" already exists`);
            throw error;
        }
        await Deno.writeTextFile(file, code);
        return reply(201, {name});
    }
    if (!await folder_exists(dir)) return fail(404, `no project "${name}"`);
    if (method === "GET") return reply(200, {code: await Deno.readTextFile(file)});
    if (method === "PUT") {
        await Deno.writeTextFile(file, await sent_script(request));
        return reply(200, {name});
    }
    if (method === "PATCH") {
        const {name: new_name} = await request.json();
        if (typeof new_name !== "string" || !valid_name.test(new_name)) {
            return fail(400, `"${new_name}" is not a valid name: use letters, digits, spaces, _ and -`);
        }
        if (new_name !== name && await folder_exists(`${projects_dir}/${new_name}`)) {
            return fail(409, `a project "${new_name}" already exists`);
        }
        await Deno.rename(dir, `${projects_dir}/${new_name}`);
        return reply(200, {name: new_name});
    }
    if (method === "DELETE") {
        await Deno.remove(dir, {recursive: true});
        return reply(200, {});
    }
    return fail(405, "use GET, POST, PUT, PATCH or DELETE");
}

async function handle_api(request, url) {
    if (!from_this_app(request)) return fail(403, "only the app itself may use this");
    const [, , , name, ...rest] = url.pathname.split("/");
    if (rest.length) return fail(404, "not found");
    if (name === undefined) {
        return request.method === "GET" ? reply(200, await project_names()) : fail(405, "use GET");
    }
    try {
        return await handle_project(request, decodeURIComponent(name));
    } catch (error) {
        if (error instanceof SyntaxError || error instanceof URIError) return fail(400, "not readable");
        return fail(500, error.message);
    }
}

await Deno.mkdir(projects_dir, {recursive: true});

Deno.serve({
    hostname: "localhost",
    port,
    onListen: () => console.log(`Listening on http://localhost:${port}`),
}, (request) => {
    const url = new URL(request.url);
    return url.pathname === "/api/projects" || url.pathname.startsWith("/api/projects/")
        ? handle_api(request, url)
        : serveDir(request, {quiet: true});
});
