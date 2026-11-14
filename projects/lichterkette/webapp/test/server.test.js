// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Runs the real server against a folder of its own, and goes through what it can do.

import { assert, assertEquals, f_s_path } from './check.js';

let n_port = 18771;
let s_url = `http://127.0.0.1:${n_port}`;

let f_o_server = async function(s_dir){
    let o_process = new Deno.Command('deno', {
        args: ['run', '--no-lock', '--allow-net=127.0.0.1', '--allow-read', `--allow-write=${s_dir}`, 'serve.js', String(n_port), s_dir],
        cwd: f_s_path(''),
        stdout: 'null', stderr: 'null', env: { NO_PROXY: '127.0.0.1' }
    }).spawn();
    for(let n_it = 0; n_it < 100; n_it++){
        try{
            await (await fetch(`${s_url}/api/project`)).body?.cancel();
            return o_process;
        } catch(o_error){
            await new Promise(function(f){ setTimeout(f, 100); });
        }
    }
    throw new Error('the server did not start');
};

// v_body: an object is sent as JSON, bytes as they are.
let f_o_call = async function(s_method, s_path, v_body, o_header = {}){
    let b_bytes = v_body instanceof Uint8Array || typeof v_body === 'string';
    let o_response = await fetch(`${s_url}${s_path}`, {
        method: s_method,
        headers: v_body === undefined || b_bytes ? o_header : { 'content-type': 'application/json', ...o_header },
        body: v_body === undefined ? undefined : (b_bytes ? v_body : JSON.stringify(v_body))
    });
    let b_json = (o_response.headers.get('content-type') ?? '').includes('json');
    return { n_status: o_response.status, v: b_json ? await o_response.json() : new Uint8Array(await o_response.arrayBuffer()) };
};

// What the bulbs' list answers to a request that names another host: fetch() does not
// let a page set that, but a name that points to this machine does it.
let f_n_status__with_host = async function(s_host){
    let o_connection = await Deno.connect({ hostname: '127.0.0.1', port: n_port });
    await o_connection.write(new TextEncoder().encode(`GET /api/project HTTP/1.1\r\nHost: ${s_host}\r\nConnection: close\r\n\r\n`));
    let a_n_u8 = new Uint8Array(64);
    await o_connection.read(a_n_u8);
    o_connection.close();
    return Number(new TextDecoder().decode(a_n_u8).split(' ')[1]);
};

Deno.test({ name: 'bulbs can be created, read, changed, renamed and deleted', sanitizeResources: false, sanitizeOps: false, fn: async function(t){
    let s_dir = await Deno.makeTempDir();
    let o_server = await f_o_server(s_dir);
    let f_a_s_file = function(s_path = ''){ return [...Deno.readDirSync(`${s_dir}/${s_path}`)].map(o => o.name).sort(); };
    let o_vase = { s_kind: 'object', o_setting: { n_mm__wall: 0.5, s_file: '', b_object: false } };
    let o_sphere = { s_kind: 'object', o_setting: { n_mm__wall: 0.8, s_file: 'planet.obj', b_object: true, b_color: true } };
    try{
        await t.step('starts empty', async function(){
            assertEquals(await f_o_call('GET', '/api/project'), { n_status: 200, v: [] });
        });
        await t.step('create', async function(){
            let o = await f_o_call('POST', '/api/project/Up%20and%20down', { ...o_vase, v_more: 'is not kept' });
            assertEquals(o, { n_status: 201, v: { s_name: 'Up and down', ...o_vase } });
            assertEquals(f_a_s_file(), ['Up and down']);
            assertEquals(Deno.readTextFileSync(`${s_dir}/Up and down/project.json`), JSON.stringify(o_vase, null, 2) + '\n', 'it is on disk, as text git can track');
            assertEquals((await f_o_call('POST', '/api/project/Up%20and%20down', o_vase)).n_status, 409, 'a name is taken once');
            assertEquals((await f_o_call('POST', '/api/project/Planet', o_sphere)).n_status, 201);
        });
        await t.step('read', async function(){
            assertEquals(await f_o_call('GET', '/api/project/Planet'), { n_status: 200, v: { s_name: 'Planet', ...o_sphere } });
            assertEquals((await f_o_call('GET', '/api/project')).v.map(o => o.s_name), ['Planet', 'Up and down'], 'the list is by name');
            assertEquals((await f_o_call('GET', '/api/project/Nothing')).n_status, 404);
        });
        await t.step('update, with the same bytes for the same bulb', async function(){
            let o_changed = { ...o_vase, o_setting: { n_mm__wall: 0.6, s_file: '', b_object: false } };
            assertEquals(await f_o_call('PUT', '/api/project/Up%20and%20down', o_changed), { n_status: 200, v: { s_name: 'Up and down', ...o_changed } });
            let s_first = Deno.readTextFileSync(`${s_dir}/Up and down/project.json`);
            await f_o_call('PUT', '/api/project/Up%20and%20down', o_changed);
            assertEquals(Deno.readTextFileSync(`${s_dir}/Up and down/project.json`), s_first);
            assertEquals(f_a_s_file('Up and down'), ['project.json'], 'nothing is left beside it');
            assertEquals((await f_o_call('PUT', '/api/project/Nothing', o_vase)).n_status, 404);
        });
        await t.step('a 3D object beside a bulb', async function(){
            let o_object = { s_kind: 'object', o_setting: { n_mm__wall: 1.2, s_file: 'cat.stl', b_object: true } };
            assertEquals(await f_o_call('POST', '/api/project/Cat', o_object), { n_status: 201, v: { s_name: 'Cat', ...o_object } });
            // Larger than a bulb's settings may be.
            let a_n_u8 = new Uint8Array(3e6).map(function(n_val, n_idx){ return n_idx % 251; });
            assertEquals((await f_o_call('GET', '/api/project/Cat/object')).n_status, 404);
            assertEquals((await f_o_call('PUT', '/api/project/Cat/object', a_n_u8)).n_status, 200);
            assertEquals(Deno.statSync(`${s_dir}/Cat/object.stl`).size, a_n_u8.length);
            let o_response = await fetch(`${s_url}/api/project/Cat/object`);
            assertEquals([o_response.status, o_response.headers.get('content-type')], [200, 'model/stl']);
            let a_n_u8__read = new Uint8Array(await o_response.arrayBuffer());
            assert(a_n_u8__read.length === a_n_u8.length && a_n_u8__read.every(function(n_val, n_idx){ return n_val === a_n_u8[n_idx]; }), 'the object came back as another');
            assertEquals((await f_o_call('PUT', '/api/project/Nothing/object', a_n_u8)).n_status, 404);
            // Its colours, three numbers for each corner of each triangle, in a file of their own.
            let a_n_u8__color = new Uint8Array([255, 0, 0, 0, 128, 255, 1, 2, 3]);
            assertEquals((await f_o_call('GET', '/api/project/Cat/color')).n_status, 404);
            assertEquals((await f_o_call('PUT', '/api/project/Cat/color', a_n_u8__color)).n_status, 200);
            assertEquals([...Deno.readFileSync(`${s_dir}/Cat/object_color.bin`)], [...a_n_u8__color]);
            assertEquals([...(await f_o_call('GET', '/api/project/Cat/color')).v], [...a_n_u8__color]);
            assertEquals(Deno.statSync(`${s_dir}/Cat/object.stl`).size, a_n_u8.length, 'the object is as it was');
            assertEquals((await f_o_call('DELETE', '/api/project/Cat/color')).n_status, 200);
            assertEquals((await f_o_call('DELETE', '/api/project/Cat/color')).n_status, 200, 'gone already is no mistake');
            // A bulb keeps no texture.
            assertEquals((await f_o_call('PUT', '/api/project/Cat/texture', new Uint8Array([1, 2, 3]))).n_status, 400);
            assertEquals(f_a_s_file('Cat'), ['object.stl', 'project.json']);
            assertEquals((await f_o_call('DELETE', '/api/project/Cat/object')).n_status, 200);
            assertEquals((await f_o_call('DELETE', '/api/project/Cat/object')).n_status, 200, 'gone already is no mistake');
            assertEquals(f_a_s_file('Cat'), ['project.json']);
            // With the bulb goes its object.
            await f_o_call('PUT', '/api/project/Cat/object', a_n_u8);
            assertEquals((await f_o_call('DELETE', '/api/project/Cat')).n_status, 204);
            assertEquals(f_a_s_file(), ['Planet', 'Up and down']);
            await f_o_call('PUT', '/api/project/Planet/object', new Uint8Array([1, 2, 3]));
        });
        await t.step('rename: the folder moves, with what lies in it', async function(){
            assertEquals(await f_o_call('PATCH', '/api/project/Planet', { s_name: 'Mars 2' }), { n_status: 200, v: { s_name: 'Mars 2', ...o_sphere } });
            assertEquals(f_a_s_file(), ['Mars 2', 'Up and down']);
            assertEquals(f_a_s_file('Mars 2'), ['object.stl', 'project.json']);
            assertEquals((await f_o_call('PATCH', '/api/project/Mars%202', { s_name: 'Up and down' })).n_status, 409, 'not onto another bulb');
            assertEquals((await f_o_call('PATCH', '/api/project/Mars%202', { s_name: '../out' })).n_status, 400);
            assertEquals((await f_o_call('PATCH', '/api/project/Mars%202', {})).n_status, 400);
            assertEquals((await f_o_call('PATCH', '/api/project/Mars%202', { s_name: 'Mars 2' })).n_status, 200, 'its own name is no change');
        });
        await t.step('what is refused, and that nothing is touched by it', async function(){
            for(let s_name of ['..', '..%2F..', 'a%2Fb', '.git', '%20x', 'x%20', 'a'.repeat(65), 'a%00b', '%E0%A4%A']){
                for(let s_method of ['GET', 'POST', 'PUT', 'DELETE']){
                    let o = await f_o_call(s_method, `/api/project/${s_name}`, s_method === 'GET' || s_method === 'DELETE' ? undefined : o_vase);
                    // Not a name, or, where the address itself leaves the bulbs, not theirs at all.
                    assert([400, 404, 405].includes(o.n_status), `${s_method} ${s_name}: ${o.n_status}`);
                }
            }
            for(let [v_body, s_what] of [
                [{ ...o_vase, s_kind: 'cube' }, 'a kind that is none'], [{ ...o_vase, s_kind: 'sphere' }, 'a kind of the pucklight lamp'],
                [{ s_kind: 'object' }, 'no settings'], [{ ...o_vase, o_setting: [1] }, 'settings that are a list'],
                ['{', 'no JSON'], ['[]', 'a list'], ['null', 'nothing']
            ]){
                assertEquals((await f_o_call('POST', '/api/project/Wrong', v_body, { 'content-type': 'application/json' })).n_status, 400, s_what);
                assertEquals((await f_o_call('PUT', '/api/project/Up%20and%20down', v_body, { 'content-type': 'application/json' })).n_status, 400, s_what);
            }
            assertEquals((await f_o_call('POST', '/api/project/Wrong', { ...o_vase, o_setting: { s_file: 'x'.repeat(2e6) } })).n_status, 413, 'too much');
            assertEquals((await f_o_call('POST', '/api/project')).n_status, 405);
            assertEquals((await f_o_call('PATCH', '/api/project/Mars%202/object', {})).n_status, 405);
            assertEquals((await f_o_call('GET', '/api/project/Mars%202/other')).n_status, 400, 'nothing else lies beside a bulb');
            // Another website's page in the same browser, and a name that points here.
            assertEquals((await f_o_call('GET', '/api/project', undefined, { origin: 'http://evil.example' })).n_status, 403);
            assertEquals((await f_o_call('DELETE', '/api/project/Mars%202', undefined, { origin: 'http://evil.example' })).n_status, 403);
            assertEquals(await f_n_status__with_host(`evil.example:${n_port}`), 403);
            assertEquals(await f_n_status__with_host(`localhost:${n_port}`), 200);
            assertEquals((await f_o_call('GET', '/api/project', undefined, { origin: `http://127.0.0.1:${n_port}` })).n_status, 200, 'the app itself');
            assertEquals(f_a_s_file(), ['Mars 2', 'Up and down']);
            assertEquals(f_a_s_file('Up and down'), ['project.json']);
        });
        await t.step('the app\'s files, and nothing outside its folder', async function(){
            for(let [s_path, s_type] of [['/', 'text/html'], ['/client.module.js', 'text/javascript'], ['/style.css', 'text/css'], ['/part/bulb.json', 'application/json'], ['/part/clip.stl', 'model/stl']]){
                let o_response = await fetch(`${s_url}${s_path}`);
                await o_response.body?.cancel();
                assert(o_response.status === 200 && o_response.headers.get('content-type').startsWith(s_type), `${s_path}: ${o_response.status} ${o_response.headers.get('content-type')}`);
            }
            // The generator lies one folder up, beside this app's.
            for(let s_path of ['/..%2FlichterketteV3.scad', '/%2e%2e/lichterketteV3.scad', '/..%252FlichterketteV3.scad', '/part/..%2F..%2FREADME.md', '/nothing.js', '/part']){
                let o_response = await fetch(`${s_url}${s_path}`);
                await o_response.body?.cancel();
                assertEquals(o_response.status, 404, s_path);
            }
            assertEquals((await f_o_call('POST', '/index.html', {})).n_status, 405);
        });
        await t.step('delete', async function(){
            assertEquals((await f_o_call('DELETE', '/api/project/Mars%202')).n_status, 204);
            assertEquals((await f_o_call('DELETE', '/api/project/Mars%202')).n_status, 404);
            assertEquals(f_a_s_file(), ['Up and down']);
            assertEquals((await f_o_call('GET', '/api/project')).v.map(o => o.s_name), ['Up and down']);
        });
    } finally {
        o_server.kill();
        await o_server.status;
        await Deno.remove(s_dir, { recursive: true });
    }
} });

Deno.test({ name: 'a second server on the same port says so and stops', sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let s_dir = await Deno.makeTempDir();
    let o_server = await f_o_server(s_dir);
    try{
        let o_output = await new Deno.Command('deno', {
            args: ['run', '--no-lock', '--allow-net=127.0.0.1', '--allow-read', `--allow-write=${s_dir}`, 'serve.js', String(n_port), s_dir],
            cwd: f_s_path(''), stdout: 'piped', stderr: 'piped'
        }).output();
        assertEquals(o_output.code, 1);
        assert(/Port 18771 is taken/.test(new TextDecoder().decode(o_output.stderr)));
    } finally {
        o_server.kill();
        await o_server.status;
        await Deno.remove(s_dir, { recursive: true });
    }
} });
