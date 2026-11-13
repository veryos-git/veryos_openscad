// deno task start
//
// Serves this project's folder, as the app reads its heightmaps from ../Tileable, and
// keeps each saved lamp as a JSON file in project/. Takes an optional port and folder
// for the lamps: deno task start 8766

import { join, normalize, resolve, sep as SEPARATOR } from 'node:path';

let n_port = Number(Deno.args[0] ?? 8765);
let s_path__root = resolve(decodeURI(new URL('..', import.meta.url).pathname));
let s_path__project = resolve(Deno.args[1] ?? join(s_path__root, 'dragon_egg_app', 'project'));
let n_cnt__name_max = 80;
let n_scl__body_max = 200000;
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

let f_s_path__of_project = function(n_id){
    return join(s_path__project, `${n_id}.json`);
};

let f_a_o_project = async function(){
    let a_o_project = [];
    for await (let o_entry of Deno.readDir(s_path__project)){
        if(!/^\d+\.json$/.test(o_entry.name)){ continue; }
        try{
            a_o_project.push(JSON.parse(await Deno.readTextFile(join(s_path__project, o_entry.name))));
        } catch(o_error){
            console.error(`Skipping ${o_entry.name}: ${o_error.message}`);
        }
    }
    return a_o_project.sort(function(o_a, o_b){ return o_b.n_ms__updated - o_a.n_ms__updated; });
};

// Written beside the file and then moved over it, so a crash cannot leave half a lamp.
let f_write_project = async function(o_project){
    let s_path = f_s_path__of_project(o_project.n_id);
    await Deno.writeTextFile(`${s_path}.tmp`, JSON.stringify(o_project, null, 2) + '\n');
    await Deno.rename(`${s_path}.tmp`, s_path);
};

// The fields a request may set, checked. Throws a message for the person using the app.
let f_o_field__checked = function(o_body){
    if(o_body === null || typeof o_body !== 'object' || Array.isArray(o_body)){ throw new Error('Expected an object.'); }
    let o_field = {};
    if('s_name' in o_body){
        if(typeof o_body.s_name !== 'string'){ throw new Error('The name must be text.'); }
        o_field.s_name = o_body.s_name.trim();
        if(o_field.s_name.length === 0){ throw new Error('The lamp needs a name.'); }
        if(o_field.s_name.length > n_cnt__name_max){ throw new Error(`Names can have ${n_cnt__name_max} characters at most.`); }
    }
    if('o_param' in o_body){
        if(o_body.o_param === null || typeof o_body.o_param !== 'object' || Array.isArray(o_body.o_param)){ throw new Error('The settings are missing.'); }
        o_field.o_param = o_body.o_param;
    }
    if('n_mm__cell_export' in o_body){
        if(typeof o_body.n_mm__cell_export !== 'number' || !(o_body.n_mm__cell_export > 0)){ throw new Error('The mesh detail must be a number above 0.'); }
        o_field.n_mm__cell_export = o_body.n_mm__cell_export;
    }
    return o_field;
};

let f_o_body = async function(o_request){
    let s_type = o_request.headers.get('content-type') ?? '';
    if(!s_type.startsWith('application/json')){ throw new Error('Expected JSON.'); }
    let s_body = await o_request.text();
    if(s_body.length > n_scl__body_max){ throw new Error('That is too much data for one lamp.'); }
    try{
        return JSON.parse(s_body);
    } catch(o_error){
        throw new Error('Expected JSON.');
    }
};

let f_o_response__create = async function(o_request){
    let o_field = f_o_field__checked(await f_o_body(o_request));
    if(!o_field.s_name || !o_field.o_param){ throw new Error('A new lamp needs a name and its settings.'); }
    let a_o_project = await f_a_o_project();
    let n_id = a_o_project.reduce(function(n_max, o_project){ return Math.max(n_max, o_project.n_id); }, 0) + 1;
    let n_ms = Date.now();
    let o_project = { n_id, n_mm__cell_export: 0.4, ...o_field, n_ms__created: n_ms, n_ms__updated: n_ms };
    // createNew: two requests at once must not get the same file.
    while(true){
        try{
            await Deno.writeTextFile(f_s_path__of_project(n_id), JSON.stringify(o_project, null, 2) + '\n', { createNew: true });
            return f_o_response__json(o_project, 201);
        } catch(o_error){
            if(!(o_error instanceof Deno.errors.AlreadyExists)){ throw o_error; }
            n_id++;
            o_project.n_id = n_id;
        }
    }
};

let f_o_project = async function(n_id){
    return JSON.parse(await Deno.readTextFile(f_s_path__of_project(n_id)));
};

let f_o_response__update = async function(o_request, n_id){
    let o_field = f_o_field__checked(await f_o_body(o_request));
    let o_project = { ...await f_o_project(n_id), ...o_field, n_id, n_ms__updated: Date.now() };
    await f_write_project(o_project);
    return f_o_response__json(o_project);
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
    let s_method = o_request.method;
    try{
        if(s_path__url === '/api/project'){
            if(s_method === 'GET'){ return f_o_response__json(await f_a_o_project()); }
            if(s_method === 'POST'){ return await f_o_response__create(o_request); }
            return f_o_response__error('Method not allowed.', 405);
        }
        let a_s_match = s_path__url.match(/^\/api\/project\/(\d{1,12})$/);
        if(!a_s_match){ return f_o_response__error('Not found.', 404); }
        let n_id = Number(a_s_match[1]);
        if(s_method === 'GET'){ return f_o_response__json(await f_o_project(n_id)); }
        if(s_method === 'PUT'){ return await f_o_response__update(o_request, n_id); }
        if(s_method === 'DELETE'){
            await Deno.remove(f_s_path__of_project(n_id));
            return new Response(null, { status: 204 });
        }
        return f_o_response__error('Method not allowed.', 405);
    } catch(o_error){
        if(o_error instanceof Deno.errors.NotFound){ return f_o_response__error('That lamp does not exist any more.', 404); }
        if(o_error instanceof Deno.errors.PermissionDenied || o_error instanceof Deno.errors.NotCapable){
            console.error(o_error);
            return f_o_response__error('The server may not write its folder. Start it with: deno task start', 500);
        }
        // Everything else thrown on purpose above is a message about the request.
        return f_o_response__error(o_error.message, 400);
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
        onListen: function(){ console.log(`Dragon egg lamp: http://127.0.0.1:${n_port}/`); }
    }, async function(o_request){
        let s_path__url = decodeURIComponent(new URL(o_request.url).pathname);
        if(s_path__url.startsWith('/api/')){ return f_o_response__api(o_request, s_path__url); }
        if(o_request.method !== 'GET' && o_request.method !== 'HEAD'){ return new Response('method not allowed', { status: 405 }); }
        if(s_path__url === '/'){ return Response.redirect(new URL('/dragon_egg_app/', o_request.url).href, 302); }
        return f_o_response__file(s_path__url);
    });
} catch(o_error){
    if(!(o_error instanceof Deno.errors.AddrInUse)){ throw o_error; }
    console.error(`Port ${n_port} is taken. The app may be running already; or use another port: deno task start ${n_port + 1}`);
    Deno.exit(1);
}
