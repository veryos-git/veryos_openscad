// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Serves the app and keeps its projects as files, so git can track them: a project
// is the folder projects/<name>/, with project.json and, if it has one, model.stl.
// Run: deno task start

import {serveDir} from "jsr:@std/http@1/file-server";

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

async function handle_project(request, name, part) {
    if (!valid_name.test(name)) return fail(400, `"${name}" is not a valid name: use letters, digits, spaces, _ and -`);
    const dir = `${projects_dir}/${name}`;
    const file = `${dir}/project.json`;
    const {method} = request;

    if (part === "model") {
        if (!await folder_exists(dir)) return fail(404, `no project "${name}"`);
        if (method === "PUT") {
            await Deno.writeFile(`${dir}/model.stl`, new Uint8Array(await request.arrayBuffer()));
            return reply(200, {});
        }
        if (method === "DELETE") {
            await Deno.remove(`${dir}/model.stl`).catch((error) => {
                if (!(error instanceof Deno.errors.NotFound)) throw error;
            });
            return reply(200, {});
        }
        return fail(405, "use PUT or DELETE");
    }
    if (part !== undefined) return fail(404, "not found");

    if (method === "POST") {
        const body = JSON.stringify(await request.json(), null, 2);
        try {
            await Deno.mkdir(dir);
        } catch (error) {
            if (error instanceof Deno.errors.AlreadyExists) return fail(409, `a project "${name}" already exists`);
            throw error;
        }
        await Deno.writeTextFile(file, body + "\n");
        return reply(201, {name});
    }
    if (!await folder_exists(dir)) return fail(404, `no project "${name}"`);
    if (method === "GET") return reply(200, JSON.parse(await Deno.readTextFile(file)));
    if (method === "PUT") {
        await Deno.writeTextFile(file, JSON.stringify(await request.json(), null, 2) + "\n");
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
    const [, , , name, part, ...rest] = url.pathname.split("/");
    if (rest.length) return fail(404, "not found");
    if (name === undefined) {
        return request.method === "GET" ? reply(200, await project_names()) : fail(405, "use GET");
    }
    try {
        return await handle_project(request, decodeURIComponent(name), part);
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
        : serveDir(request, {quiet: true, headers: ["cache-control: no-cache"]});   // edits show on a plain reload
});
