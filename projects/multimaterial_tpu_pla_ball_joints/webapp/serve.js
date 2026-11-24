// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// deno task start
//
// Serves this folder and renders the joint's parts with OpenSCAD from the script beside
// the webapp, so that the app makes what the script makes. One request is one part in
// one material: POST /api/mesh { o_setting, s_part, s_material } gives the part's
// binary STL in base64 and the script's echo lines.
// OpenSCAD: $OPENSCAD, else the nightly AppImage in the repo's .gitignored/tools (fast,
// Manifold), else openscad on the PATH.
// Takes an optional port: deno task start 8775

import { join, resolve } from 'node:path';
import { f_a_o_group__from_scad, f_a_s_define } from './setting.module.js';

let n_port = Number(Deno.args[0] ?? 8774);
let s_path__root = resolve(decodeURI(new URL('.', import.meta.url).pathname));
let s_path__scad = join(s_path__root, '..', 'tpu_pla_ball_joint_veryos_V1.scad');
let s_path__render = join(s_path__root, '.render');
let n_cnt__render_max = 4;
let n_cnt__cache_max = 64;
let n_ms__timeout = 120000;
let o_s_type__by_extension = {
    html: 'text/html; charset=utf-8',
    js: 'text/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8',
    png: 'image/png',
    svg: 'image/svg+xml'
};

let f_o_response__json = function(v, n_status = 200){
    return new Response(JSON.stringify(v), {
        status: n_status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
};

let f_b_runs = async function(s_bin){
    try{
        let o_output = await new Deno.Command(s_bin, { args: ['--version'], stdout: 'piped', stderr: 'piped' }).output();
        return o_output.success;
    } catch(o_error){
        return false;
    }
};

// The OpenSCAD to use and its arguments: Manifold where the build has it.
let f_o_openscad = async function(){
    let a_s_bin = [
        Deno.env.get('OPENSCAD'),
        join(s_path__root, '..', '..', '..', '.gitignored', 'tools', 'OpenSCAD-nightly.AppImage'),
        'openscad'
    ].filter(Boolean);
    for(let s_bin of a_s_bin){
        if(!(await f_b_runs(s_bin))){ continue; }
        let o_output = await new Deno.Command(s_bin, { args: ['--help'], stdout: 'piped', stderr: 'piped' }).output();
        let s_help = new TextDecoder().decode(o_output.stdout) + new TextDecoder().decode(o_output.stderr);
        let o_version = await new Deno.Command(s_bin, { args: ['--version'], stdout: 'piped', stderr: 'piped' }).output();
        let s_version = (new TextDecoder().decode(o_version.stdout) + new TextDecoder().decode(o_version.stderr)).trim().split('\n').pop();
        return { s_bin, s_version, a_s_arg: s_help.includes('--backend') ? ['--backend=manifold'] : [] };
    }
    throw new Error('no OpenSCAD found: set OPENSCAD to its path');
};

let o_openscad = await f_o_openscad();
let a_o_group = f_a_o_group__from_scad(await Deno.readTextFile(s_path__scad));
await Deno.mkdir(s_path__render, { recursive: true });
console.log(`${o_openscad.s_version} (${o_openscad.s_bin}), http://127.0.0.1:${n_port}/`);

// At most n_cnt__render_max OpenSCAD runs at a time, the others wait.
let n_cnt__running = 0;
let a_f__waiting = [];
let f_run_limited = async function(f){
    if(n_cnt__running >= n_cnt__render_max){ await new Promise(function(f_go){ a_f__waiting.push(f_go); }); }
    n_cnt__running++;
    try{
        return await f();
    } finally{
        n_cnt__running--;
        a_f__waiting.shift()?.();
    }
};

let f_s_base64 = function(a_n_u8){
    let a_s = [];
    for(let n_off = 0; n_off < a_n_u8.length; n_off += 0x8000){
        a_s.push(String.fromCharCode.apply(null, a_n_u8.subarray(n_off, n_off + 0x8000)));
    }
    return btoa(a_s.join(''));
};

// A part with nothing in a material (the lip's ball in TPU) gives an empty s_stl.
let f_o_mesh = async function(o_setting, s_part, s_material){
    let a_s_define = f_a_s_define(a_o_group, { ...o_setting, part: s_part, material: s_material });
    let s_path__out = join(s_path__render, `${crypto.randomUUID()}.stl`);
    let o_command = new Deno.Command(o_openscad.s_bin, {
        args: [...o_openscad.a_s_arg, '--export-format', 'binstl', '-o', s_path__out, ...a_s_define, s_path__scad],
        stdout: 'piped',
        stderr: 'piped',
        signal: AbortSignal.timeout(n_ms__timeout)
    });
    let o_output = await o_command.output();
    let s_log = new TextDecoder().decode(o_output.stderr) + new TextDecoder().decode(o_output.stdout);
    let a_s_echo = [...s_log.matchAll(/^ECHO: "(.*)"$/gm)].map(function(a_s){ return a_s[1]; });
    let a_n_u8 = null;
    try{
        a_n_u8 = await Deno.readFile(s_path__out);
        await Deno.remove(s_path__out);
    } catch(o_error){
        if(!(o_error instanceof Deno.errors.NotFound)){ throw o_error; }
    }
    if(!a_n_u8 || a_n_u8.length <= 84){
        if(/top level object is empty|Current top level object is empty|No top level geometry/i.test(s_log)){ return { a_s_echo, s_stl: '' }; }
        throw new Error(`OpenSCAD made no mesh: ${s_log.split('\n').filter(function(s){ return /ERROR|WARNING/.test(s); }).join(' ') || s_log.slice(-400)}`);
    }
    return { a_s_echo, s_stl: f_s_base64(a_n_u8) };
};

let o_o_mesh__by_key = new Map();
let f_o_mesh__cached = function(o_setting, s_part, s_material){
    let s_key = JSON.stringify([o_setting, s_part, s_material]);
    if(!o_o_mesh__by_key.has(s_key)){
        let o_promise = f_run_limited(function(){ return f_o_mesh(o_setting, s_part, s_material); });
        o_promise.catch(function(){ o_o_mesh__by_key.delete(s_key); });
        o_o_mesh__by_key.set(s_key, o_promise);
        if(o_o_mesh__by_key.size > n_cnt__cache_max){ o_o_mesh__by_key.delete(o_o_mesh__by_key.keys().next().value); }
    }
    return o_o_mesh__by_key.get(s_key);
};

let f_o_response__file = async function(s_path__url){
    let s_name = s_path__url === '/' ? 'index.html' : s_path__url.slice(1);
    // only files of this folder, by name, no paths
    if(!/^[\w.-]+$/.test(s_name)){ return new Response('not found', { status: 404 }); }
    let s_type = o_s_type__by_extension[s_name.split('.').pop()];
    if(!s_type){ return new Response('not found', { status: 404 }); }
    try{
        return new Response(await Deno.readFile(join(s_path__root, s_name)), {
            headers: { 'content-type': s_type, 'cache-control': 'no-store' }
        });
    } catch(o_error){
        if(o_error instanceof Deno.errors.NotFound){ return new Response('not found', { status: 404 }); }
        throw o_error;
    }
};

Deno.serve({ hostname: '127.0.0.1', port: n_port }, async function(o_request){
    let o_url = new URL(o_request.url);
    try{
        if(o_url.pathname === '/api/setting' && o_request.method === 'GET'){
            return f_o_response__json({ a_o_group, s_openscad: o_openscad.s_version });
        }
        if(o_url.pathname === '/api/mesh' && o_request.method === 'POST'){
            let s_body = await o_request.text();
            if(s_body.length > 20000){ return f_o_response__json({ s_message: 'request too big' }, 413); }
            let { o_setting, s_part, s_material } = JSON.parse(s_body);
            if(typeof o_setting !== 'object' || o_setting === null || 'part' in o_setting || 'material' in o_setting){
                return f_o_response__json({ s_message: 'o_setting must be an object without part and material' }, 400);
            }
            try{
                f_a_s_define(a_o_group, { ...o_setting, part: s_part, material: s_material });
            } catch(o_error){
                return f_o_response__json({ s_message: o_error.message }, 400);
            }
            return f_o_response__json(await f_o_mesh__cached(o_setting, s_part, s_material));
        }
        if(o_request.method === 'GET'){ return await f_o_response__file(o_url.pathname); }
        return new Response('not found', { status: 404 });
    } catch(o_error){
        console.error(o_error);
        return f_o_response__json({ s_message: o_error.message }, 500);
    }
});
