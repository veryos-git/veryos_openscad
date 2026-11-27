// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// deno task start
//
// Serves this folder and keeps each saved project as a folder in project/, for git to
// track: project/<name>/project.json with the settings and, beside it, the pictures'
// files, each under the name the settings have for it and the ending of its kind.
//   GET /api/project                                the saved projects, each with its name
//   GET, POST, PUT, DELETE /api/project/<name>      read one, save a new one, save it again, delete it.
//                                                   A save removes the picture files the settings no longer
//                                                   speak of, and answers with those it has not got
//   GET, PUT /api/project/<name>/<file>             a picture file
// The page makes the SVGs, the print and its files itself: but for the projects any
// static web server does as well.
// Takes an optional port and folder for the projects: deno task start 8779

import { join, resolve } from 'node:path';

let n_port = Number(Deno.args[0] ?? 8778);
let s_path__root = decodeURI(new URL('.', import.meta.url).pathname);
let s_path__project = resolve(Deno.args[1] ?? join(s_path__root, 'project'));
// A project's name is its folder's name, so it must not be able to leave project/.
let o_regex__name = /^[\p{L}\p{N}_](?:[\p{L}\p{N} _-]{0,62}[\p{L}\p{N}_-])?$/u;
let a_s_sheet = ['front', 'back'];
// A picture file's name as the settings have it; its file in the folder has the ending of its kind too.
let o_regex__file = /^[a-z0-9_]{1,40}$/;
let n_scl__body_max = 2e6;
let n_scl__picture_max = 100e6;
let o_s_type__by_extension = {
    html: 'text/html; charset=utf-8',
    js: 'text/javascript; charset=utf-8'
};
// The kinds of picture a project keeps, by the ending its file gets.
let o_s_type__by_extension__picture = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp'
};

let f_o_response__json = function(v, n_status = 200){
    return new Response(JSON.stringify(v), {
        status: n_status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
};

// What is wrong with a request, to tell the person using the app.
let f_o_error = function(s_message, n_status = 400){
    return Object.assign(new Error(s_message), { n_status });
};

let f_s_path__of_project = function(s_name){
    return join(s_path__project, s_name);
};

let f_b_there = async function(s_path, s_kind){
    try{
        return (await Deno.stat(s_path))[s_kind];
    } catch(o_error){
        if(o_error instanceof Deno.errors.NotFound){ return false; }
        throw o_error;
    }
};

let f_o_project = async function(s_name){
    return { s_name, ...JSON.parse(await Deno.readTextFile(join(f_s_path__of_project(s_name), 'project.json'))) };
};

let f_a_o_project = async function(){
    let a_o_project = [];
    for await (let o_entry of Deno.readDir(s_path__project)){
        if(!o_entry.isDirectory || !o_regex__name.test(o_entry.name)){ continue; }
        try{
            a_o_project.push(await f_o_project(o_entry.name));
        } catch(o_error){
            // a folder without its file, or with one that is no JSON, is no project
            console.error(`Skipping ${o_entry.name}: ${o_error.message}`);
        }
    }
    return a_o_project.sort(function(o_a, o_b){ return o_a.s_name.localeCompare(o_b.s_name); });
};

// Written beside the file and then moved over it, so a crash cannot leave half a file.
// The same project makes the same bytes, so saving it again leaves git clean.
let f_write_project = async function(s_name, o_design){
    let s_path = join(f_s_path__of_project(s_name), 'project.json');
    await Deno.writeTextFile(`${s_path}.tmp`, JSON.stringify(o_design, null, 2) + '\n');
    await Deno.rename(`${s_path}.tmp`, s_path);
};

// The names of the picture files a project's settings speak of.
let f_a_s_file = function(o_setting){
    return [...new Set(a_s_sheet.flatMap(function(s_sheet){
        let a_o_picture = o_setting[`a_o_picture__${s_sheet}`];
        return (Array.isArray(a_o_picture) ? a_o_picture : []).map(function(o_picture){ return o_picture?.s_file; });
    }))].filter(function(s_file){ return typeof s_file === 'string' && o_regex__file.test(s_file); });
};
// The picture files in a project's folder: each one's ending by its name.
let f_o_s_extension__by_file = async function(s_name){
    let o_s_extension = {};
    for await (let o_entry of Deno.readDir(f_s_path__of_project(s_name))){
        let [s_file, s_extension] = o_entry.name.split('.');
        if(o_entry.isFile && o_entry.name === `${s_file}.${s_extension}` && o_regex__file.test(s_file) && s_extension in o_s_type__by_extension__picture){ o_s_extension[s_file] = s_extension; }
    }
    return o_s_extension;
};
// A saved project's folder put in order: the picture files its settings no longer speak
// of leave. Says which of those they do speak of are not there.
let f_a_s_file__missing = async function(s_name, o_setting){
    let a_s_file = f_a_s_file(o_setting);
    let o_s_extension = await f_o_s_extension__by_file(s_name);
    for(let [s_file, s_extension] of Object.entries(o_s_extension)){
        if(!a_s_file.includes(s_file)){ await Deno.remove(join(f_s_path__of_project(s_name), `${s_file}.${s_extension}`)); }
    }
    return a_s_file.filter(function(s_file){ return !(s_file in o_s_extension); });
};

// The project a request brings, checked: its settings. What else it sent is not kept.
let f_o_design__sent = async function(o_request){
    let s_body = await o_request.text();
    if(s_body.length > n_scl__body_max){ throw f_o_error('That is too much data for one project.', 413); }
    let o_body;
    try{
        o_body = JSON.parse(s_body);
    } catch(o_error){
        throw f_o_error('Expected JSON.');
    }
    if(o_body === null || typeof o_body !== 'object' || o_body.o_setting === null || typeof o_body.o_setting !== 'object' || Array.isArray(o_body.o_setting)){
        throw f_o_error('The settings are missing.');
    }
    return { o_setting: o_body.o_setting };
};

let f_o_response__project = async function(o_request, s_name){
    let s_path = f_s_path__of_project(s_name);
    let s_method = o_request.method;
    if(s_method === 'POST'){
        let o_design = await f_o_design__sent(o_request);
        try{
            await Deno.mkdir(s_path);
        } catch(o_error){
            if(o_error instanceof Deno.errors.AlreadyExists){ throw f_o_error(`A project “${s_name}” already exists.`, 409); }
            throw o_error;
        }
        await f_write_project(s_name, o_design);
        return f_o_response__json({ s_name, ...o_design, a_s_file__missing: f_a_s_file(o_design.o_setting) }, 201);
    }
    if(!await f_b_there(s_path, 'isDirectory')){ throw f_o_error(`The project “${s_name}” does not exist any more.`, 404); }
    if(s_method === 'GET'){ return f_o_response__json(await f_o_project(s_name)); }
    if(s_method === 'PUT'){
        let o_design = await f_o_design__sent(o_request);
        await f_write_project(s_name, o_design);
        return f_o_response__json({ s_name, ...o_design, a_s_file__missing: await f_a_s_file__missing(s_name, o_design.o_setting) });
    }
    if(s_method === 'DELETE'){
        await Deno.remove(s_path, { recursive: true });
        return new Response(null, { status: 204 });
    }
    throw f_o_error('Use GET, POST, PUT or DELETE.', 405);
};

// A picture file, beside the project's settings: under its name, with the ending of
// its kind.
let f_o_response__picture = async function(o_request, s_name, s_file){
    let s_path = f_s_path__of_project(s_name);
    if(!await f_b_there(s_path, 'isDirectory')){ throw f_o_error(`The project “${s_name}” does not exist any more.`, 404); }
    let s_extension__there = (await f_o_s_extension__by_file(s_name))[s_file];
    if(o_request.method === 'GET'){
        if(!s_extension__there){ throw f_o_error(`“${s_name}” has no picture file ${s_file}.`, 404); }
        return new Response(await Deno.readFile(join(s_path, `${s_file}.${s_extension__there}`)), {
            headers: { 'content-type': o_s_type__by_extension__picture[s_extension__there], 'cache-control': 'no-store' }
        });
    }
    if(o_request.method === 'PUT'){
        let s_type = (o_request.headers.get('content-type') ?? '').split(';')[0].trim();
        let s_extension = Object.keys(o_s_type__by_extension__picture).find(function(s){ return o_s_type__by_extension__picture[s] === s_type; });
        if(!s_extension){ throw f_o_error('One of the pictures is a file of a kind a project does not keep. It keeps PNG, JPEG, WebP, GIF, AVIF, SVG and BMP.', 415); }
        let a_n_u8 = new Uint8Array(await o_request.arrayBuffer());
        if(a_n_u8.length > n_scl__picture_max){ throw f_o_error(`One of the pictures is too large a file for a project: ${n_scl__picture_max / 1e6} MB at most.`, 413); }
        let s_path__file = join(s_path, `${s_file}.${s_extension}`);
        await Deno.writeFile(`${s_path__file}.tmp`, a_n_u8);
        await Deno.rename(`${s_path__file}.tmp`, s_path__file);
        // a file of another kind was there under the name: it is replaced
        if(s_extension__there && s_extension__there !== s_extension){ await Deno.remove(join(s_path, `${s_file}.${s_extension__there}`)); }
        return f_o_response__json({});
    }
    throw f_o_error('Use GET or PUT.', 405);
};

// This server writes and deletes here, so other sites must not be able to use it from
// your browser.
let f_b_from_this_app = function(o_request){
    let s_host = o_request.headers.get('host');
    if(s_host !== `127.0.0.1:${n_port}` && s_host !== `localhost:${n_port}`){ return false; }
    let s_origin = o_request.headers.get('origin');
    return !s_origin || s_origin === `http://${s_host}`;
};

// s_path__url: /api/project, or /api/project/ and a project's name, or that, / and a
// picture file's name; as the address has it, a / in a name written %2F.
let f_o_response__api = async function(o_request, s_path__url){
    try{
        if(!f_b_from_this_app(o_request)){ throw f_o_error('Only the app itself can use this.', 403); }
        if(s_path__url === '/api/project'){
            if(o_request.method !== 'GET'){ throw f_o_error('Use GET.', 405); }
            return f_o_response__json(await f_a_o_project());
        }
        let a_s_part;
        try{
            a_s_part = s_path__url.slice('/api/project/'.length).split('/').map(decodeURIComponent);
        } catch(o_error){
            throw f_o_error('That is no name.');
        }
        let [s_name, s_file] = a_s_part;
        if(!o_regex__name.test(s_name)){ throw f_o_error(`“${s_name}” is not a valid name: use letters, digits, spaces, _ and -, 64 at most.`); }
        if(a_s_part.length === 1){ return await f_o_response__project(o_request, s_name); }
        if(a_s_part.length > 2 || !o_regex__file.test(s_file)){ throw f_o_error('That is no picture file\'s name.'); }
        return await f_o_response__picture(o_request, s_name, s_file);
    } catch(o_error){
        if(o_error.n_status){ return f_o_response__json({ s_message: o_error.message }, o_error.n_status); }
        if(o_error instanceof Deno.errors.NotFound){ return f_o_response__json({ s_message: 'That does not exist any more.' }, 404); }
        console.error(o_error);
        if(o_error instanceof Deno.errors.PermissionDenied || o_error instanceof Deno.errors.NotCapable){
            return f_o_response__json({ s_message: 'The server may not write its folder. Start it with: deno task start' }, 500);
        }
        return f_o_response__json({ s_message: o_error.message }, 500);
    }
};

await Deno.mkdir(s_path__project, { recursive: true });
Deno.serve({ hostname: '127.0.0.1', port: n_port }, async function(o_request){
    let s_path = new URL(o_request.url).pathname;
    if(s_path === '/api/project' || s_path.startsWith('/api/project/')){ return f_o_response__api(o_request, s_path); }
    if(s_path === '/'){ s_path = '/index.html'; }
    let s_type = o_s_type__by_extension[s_path.split('.').pop()];
    try{
        if(!s_type){ throw new Deno.errors.NotFound(); }
        return new Response(await Deno.readFile(join(s_path__root, s_path)), { headers: { 'content-type': s_type, 'cache-control': 'no-store' } });
    } catch(o_error){
        if(o_error instanceof Deno.errors.NotFound){ return new Response('Not found', { status: 404 }); }
        throw o_error;
    }
});
