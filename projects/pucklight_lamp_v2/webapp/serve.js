// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// deno task start
//
// Serves this folder and keeps each saved lamp as a folder in project/, for git to
// track: project/<name>/project.json and, for a sphere with a texture, texture.png.
// Takes an optional port and folder for the lamps: deno task start 8769

import { join, normalize, resolve, sep as SEPARATOR } from 'node:path';

let n_port = Number(Deno.args[0] ?? 8768);
let s_path__root = resolve(decodeURI(new URL('.', import.meta.url).pathname));
let s_path__project = resolve(Deno.args[1] ?? join(s_path__root, 'project'));
// The name is the folder's name, so it must not be able to leave project/.
let o_regex__name = /^[\p{L}\p{N}_](?:[\p{L}\p{N} _-]{0,62}[\p{L}\p{N}_-])?$/u;
let a_s_kind = ['sphere', 'vase', 'egg'];
let a_s_brand = ['veryos', 'tracetrove'];
let n_scl__body_max = 2e6;
let n_scl__texture_max = 64e6;
let o_s_type__by_extension = {
    html: 'text/html; charset=utf-8',
    js: 'text/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    stl: 'model/stl'
};

let f_o_response__json = function(v, n_status = 200){
    return new Response(JSON.stringify(v), {
        status: n_status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
};
let f_o_response__error = function(s_message, n_status = 400){
    return f_o_response__json({ s_message }, n_status);
};

// What is wrong with a request, to tell the person using the app.
let f_o_error = function(s_message, n_status = 400){
    return Object.assign(new Error(s_message), { n_status });
};

let f_s_path__of_project = function(s_name){
    return join(s_path__project, s_name);
};

let f_b_folder = async function(s_path){
    try{
        return (await Deno.stat(s_path)).isDirectory;
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
            console.error(`Skipping ${o_entry.name}: ${o_error.message}`);
        }
    }
    return a_o_project.sort(function(o_a, o_b){ return o_a.s_name.localeCompare(o_b.s_name); });
};

// Written beside the file and then moved over it, so a crash cannot leave half a lamp.
// The same lamp makes the same bytes, so saving it again leaves git clean.
let f_write_project = async function(s_name, o_design){
    let s_path = join(f_s_path__of_project(s_name), 'project.json');
    await Deno.writeTextFile(`${s_path}.tmp`, JSON.stringify(o_design, null, 2) + '\n');
    await Deno.rename(`${s_path}.tmp`, s_path);
};

let f_check_name = function(s_name){
    if(typeof s_name !== 'string' || !o_regex__name.test(s_name)){
        throw f_o_error(`“${s_name}” is not a valid name: use letters, digits, spaces, _ and -, 64 at most.`);
    }
};

// The lamp a request brings, checked: its kind of lampshade, its brand and that
// kind's settings.
let f_o_design__sent = async function(o_request){
    let s_body = await o_request.text();
    if(s_body.length > n_scl__body_max){ throw f_o_error('That is too much data for one lamp.', 413); }
    let o_body;
    try{
        o_body = JSON.parse(s_body);
    } catch(o_error){
        throw f_o_error('Expected JSON.');
    }
    if(o_body === null || typeof o_body !== 'object' || Array.isArray(o_body)){ throw f_o_error('Expected an object.'); }
    if(!a_s_kind.includes(o_body.s_kind)){ throw f_o_error(`The lampshade’s kind must be one of: ${a_s_kind.join(', ')}.`); }
    if(!a_s_brand.includes(o_body.s_brand)){ throw f_o_error(`The brand must be one of: ${a_s_brand.join(', ')}.`); }
    if(o_body.o_setting === null || typeof o_body.o_setting !== 'object' || Array.isArray(o_body.o_setting)){ throw f_o_error('The settings are missing.'); }
    return { s_kind: o_body.s_kind, s_brand: o_body.s_brand, o_setting: o_body.o_setting };
};

let f_o_response__texture = async function(o_request, s_name){
    let s_path = join(f_s_path__of_project(s_name), 'texture.png');
    if(!await f_b_folder(f_s_path__of_project(s_name))){ throw f_o_error(`The lamp “${s_name}” does not exist any more.`, 404); }
    if(o_request.method === 'GET'){
        return new Response(await Deno.readFile(s_path), { headers: { 'content-type': 'image/png', 'cache-control': 'no-store' } });
    }
    if(o_request.method === 'PUT'){
        let a_n_u8 = new Uint8Array(await o_request.arrayBuffer());
        if(a_n_u8.length > n_scl__texture_max){ throw f_o_error('That texture is too large.', 413); }
        await Deno.writeFile(s_path, a_n_u8);
        return f_o_response__json({});
    }
    if(o_request.method === 'DELETE'){
        await Deno.remove(s_path).catch(function(o_error){
            if(!(o_error instanceof Deno.errors.NotFound)){ throw o_error; }
        });
        return f_o_response__json({});
    }
    throw f_o_error('Use GET, PUT or DELETE.', 405);
};

let f_o_response__project = async function(o_request, s_name){
    let s_path = f_s_path__of_project(s_name);
    let s_method = o_request.method;
    if(s_method === 'POST'){
        let o_design = await f_o_design__sent(o_request);
        try{
            await Deno.mkdir(s_path);
        } catch(o_error){
            if(o_error instanceof Deno.errors.AlreadyExists){ throw f_o_error(`A lamp “${s_name}” already exists.`, 409); }
            throw o_error;
        }
        await f_write_project(s_name, o_design);
        return f_o_response__json({ s_name, ...o_design }, 201);
    }
    if(!await f_b_folder(s_path)){ throw f_o_error(`The lamp “${s_name}” does not exist any more.`, 404); }
    if(s_method === 'GET'){ return f_o_response__json(await f_o_project(s_name)); }
    if(s_method === 'PUT'){
        let o_design = await f_o_design__sent(o_request);
        await f_write_project(s_name, o_design);
        return f_o_response__json({ s_name, ...o_design });
    }
    if(s_method === 'PATCH'){
        let s_name__new = (await o_request.json().catch(function(){ return {}; }))?.s_name;
        f_check_name(s_name__new);
        if(s_name__new !== s_name){
            if(await f_b_folder(f_s_path__of_project(s_name__new))){ throw f_o_error(`A lamp “${s_name__new}” already exists.`, 409); }
            await Deno.rename(s_path, f_s_path__of_project(s_name__new));
        }
        return f_o_response__json(await f_o_project(s_name__new));
    }
    if(s_method === 'DELETE'){
        await Deno.remove(s_path, { recursive: true });
        return new Response(null, { status: 204 });
    }
    throw f_o_error('Use GET, POST, PUT, PATCH or DELETE.', 405);
};

// This server can write, so other sites must not be able to use it from your browser.
let f_b_from_this_app = function(o_request){
    let s_host = o_request.headers.get('host');
    if(s_host !== `127.0.0.1:${n_port}` && s_host !== `localhost:${n_port}`){ return false; }
    let s_origin = o_request.headers.get('origin');
    return !s_origin || s_origin === `http://${s_host}`;
};

let f_o_response__api = async function(o_request, s_path__url){
    if(!f_b_from_this_app(o_request)){ return f_o_response__error('Only the app itself can use this.', 403); }
    try{
        if(s_path__url === '/api/project'){
            if(o_request.method !== 'GET'){ throw f_o_error('Use GET.', 405); }
            return f_o_response__json(await f_a_o_project());
        }
        // What follows is a lamp's name, or its name and /texture. A name has no /.
        let s_name = s_path__url.slice('/api/project/'.length);
        let b_texture = s_name.endsWith('/texture');
        if(b_texture){ s_name = s_name.slice(0, -'/texture'.length); }
        f_check_name(s_name);
        return b_texture ? await f_o_response__texture(o_request, s_name) : await f_o_response__project(o_request, s_name);
    } catch(o_error){
        if(o_error.n_status){ return f_o_response__error(o_error.message, o_error.n_status); }
        if(o_error instanceof Deno.errors.NotFound){ return f_o_response__error('That does not exist any more.', 404); }
        if(o_error instanceof Deno.errors.PermissionDenied || o_error instanceof Deno.errors.NotCapable){
            console.error(o_error);
            return f_o_response__error('The server may not write its folder. Start it with: deno task start', 500);
        }
        console.error(o_error);
        return f_o_response__error(o_error.message, 500);
    }
};

let f_o_response__file = async function(s_path__url){
    let s_path = normalize(join(s_path__root, s_path__url));
    if(s_path !== s_path__root && !s_path.startsWith(s_path__root + SEPARATOR)){
        return new Response('not found', { status: 404 });
    }
    if(s_path__url.endsWith('/')){ s_path = join(s_path, 'index.html'); }
    try{
        let o_file = await Deno.open(s_path, { read: true });
        let o_stat = await o_file.stat();
        if(!o_stat.isFile){
            o_file.close();
            return new Response('not found', { status: 404 });
        }
        let s_extension = s_path.split('.').pop().toLowerCase();
        return new Response(o_file.readable, {
            headers: {
                'content-type': o_s_type__by_extension[s_extension] ?? 'application/octet-stream',
                'content-length': String(o_stat.size),
                'cache-control': 'no-cache'
            }
        });
    } catch(o_error){
        return new Response('not found', { status: 404 });
    }
};

await Deno.mkdir(s_path__project, { recursive: true });
try{
    Deno.serve({
        port: n_port,
        hostname: '127.0.0.1',
        onListen: function(){ console.log(`Pucklight lamp: http://127.0.0.1:${n_port}/`); }
    }, async function(o_request){
        let s_path__url;
        try{
            s_path__url = decodeURIComponent(new URL(o_request.url).pathname);
        } catch(o_error){
            return new Response('not found', { status: 404 });
        }
        if(s_path__url === '/api/project' || s_path__url.startsWith('/api/project/')){ return f_o_response__api(o_request, s_path__url); }
        if(o_request.method !== 'GET' && o_request.method !== 'HEAD'){ return new Response('method not allowed', { status: 405 }); }
        return f_o_response__file(s_path__url);
    });
} catch(o_error){
    if(!(o_error instanceof Deno.errors.AddrInUse)){ throw o_error; }
    console.error(`Port ${n_port} is taken. The app may be running already; or use another port: deno task start ${n_port + 1}`);
    Deno.exit(1);
}
