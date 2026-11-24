// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The server on a port of its own, with the OpenSCAD it finds (or $OPENSCAD): settings,
// parts in each material, and requests it refuses.
import { assertEquals, assert } from './check.js';
import { f_o_mesh__from_stl } from '../export.module.js';

let n_port = 18774;
let s_url = `http://127.0.0.1:${n_port}`;

let f_n_volume = function(o_mesh){
    let { a_n_pos: p, a_n_idx: a } = o_mesh;
    let n = 0;
    for(let i = 0; i < a.length; i += 3){
        let [x0, y0, z0, x1, y1, z1, x2, y2, z2] = [a[i], a[i + 1], a[i + 2]].flatMap(function(k){ return [p[3 * k], p[3 * k + 1], p[3 * k + 2]]; });
        n += x0 * (y1 * z2 - z1 * y2) - y0 * (x1 * z2 - z1 * x2) + z0 * (x1 * y2 - y1 * x2);
    }
    return n / 6;
};

let f_o_post = async function(o_body){
    let o_response = await fetch(`${s_url}/api/mesh`, { method: 'POST', body: JSON.stringify(o_body) });
    return { n_status: o_response.status, o: await o_response.json() };
};

let f_o_mesh = function(s_stl){
    return f_o_mesh__from_stl(Uint8Array.from(atob(s_stl), function(s){ return s.charCodeAt(0); }).buffer);
};

Deno.test({ name: 'server renders the parts', sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let o_process = new Deno.Command(Deno.execPath(), {
        args: ['run', '--allow-all', new URL('../serve.js', import.meta.url).pathname, String(n_port)],
        stdout: 'piped', stderr: 'inherit'
    }).spawn();
    try{
        // the server prints its line once OpenSCAD is found and it listens
        let o_reader = o_process.stdout.pipeThrough(new TextDecoderStream()).getReader();
        let s_out = '';
        while(!s_out.includes('http://')){ s_out += (await o_reader.read()).value ?? ''; }
        o_reader.releaseLock();

        let o_setting = await (await fetch(`${s_url}/api/setting`)).json();
        assertEquals(o_setting.a_o_group[0].s_title, 'Start here');
        assert(o_setting.s_openscad.startsWith('OpenSCAD version'));

        let o_socket = await f_o_post({ o_setting: { type: 'lip', ball: 6 }, s_part: 'socket', s_material: 'pla' });
        assertEquals(o_socket.n_status, 200);
        // the volume OpenSCAD 2021.01 and 2026.09.16 both give for the default lip socket's PLA
        assert(Math.abs(f_n_volume(f_o_mesh(o_socket.o.s_stl)) - 184.24) < 0.05, 'PLA of the lip socket');
        assert(o_socket.o.a_s_echo.some(function(s){ return s.startsWith('lip: ball 6'); }));

        let o_lip = await f_o_post({ o_setting: { type: 'lip' }, s_part: 'socket', s_material: 'tpu' });
        assert(Math.abs(f_n_volume(f_o_mesh(o_lip.o.s_stl)) - 21.97) < 0.05, 'TPU lip');

        let o_empty = await f_o_post({ o_setting: { type: 'lip' }, s_part: 'ball', s_material: 'tpu' });
        assertEquals([o_empty.n_status, o_empty.o.s_stl], [200, '']);

        for(let o_body of [
            { o_setting: { type: 'lip', part: 'ball' }, s_part: 'socket', s_material: 'pla' },
            { o_setting: { ball: 99 }, s_part: 'socket', s_material: 'pla' },
            { o_setting: {}, s_part: 'socket', s_material: 'gold' },
            { o_setting: { 'x=1;y': 2 }, s_part: 'socket', s_material: 'pla' }
        ]){
            assertEquals((await f_o_post(o_body)).n_status, 400, JSON.stringify(o_body));
        }
        // only files of webapp/ by name: the script beside it is not served
        assertEquals((await (await fetch(`${s_url}/%2e%2e/tpu_pla_ball_joint_veryos_V1.scad`)).text()), 'not found');
        assertEquals((await fetch(`${s_url}/index.html`)).status, 200);
    } finally{
        o_process.kill();
        await o_process.status;
    }
} });
