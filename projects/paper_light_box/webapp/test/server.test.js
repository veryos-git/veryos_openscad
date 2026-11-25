// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The server on a port of its own, with the OpenSCAD it finds (or $OPENSCAD): the box,
// a sheet, what the page reckons itself held against the script, and requests it refuses.
import { assertEquals, assert } from './check.js';
import { f_o_mesh__from_stl, f_a_n_u8__from_base64 } from '../mesh.module.js';
import { f_a_a_n__sheet, f_s_svg__sheet, f_n_area } from '../layer.module.js';
import { f_o_box } from '../box.module.js';

let n_port = 18777;
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

// Lowest and highest x, y, z of a mesh.
let f_a_n__size = function(o_mesh){
    return [0, 1, 2].map(function(n_axis){
        let a_n = o_mesh.a_n_pos.filter(function(n, n_idx){ return n_idx % 3 === n_axis; });
        return Math.round((Math.max(...a_n) - Math.min(...a_n)) * 1000) / 1000;
    });
};

let f_o_post = async function(s_path, o_body){
    let o_response = await fetch(`${s_url}${s_path}`, { method: 'POST', body: JSON.stringify(o_body) });
    return { n_status: o_response.status, o: await o_response.json() };
};

let f_o_mesh = function(s_stl){
    return f_o_mesh__from_stl(f_a_n_u8__from_base64(s_stl).buffer);
};

Deno.test({ name: 'server renders the box and a sheet', sanitizeResources: false, sanitizeOps: false, fn: async function(){
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
        let o_v = Object.fromEntries(o_setting.a_o_group.flatMap(function(o_group){
            return o_group.a_o_setting.map(function(o){ return [o.s_name, o.v_default]; });
        }));

        // the script's own five sheets: the volume OpenSCAD 2021.01 and 2026.09.16 both give
        let o_board = await f_o_post('/api/mesh', { o_setting: {}, s_part: 'box' });
        assertEquals(o_board.n_status, 200);
        assert(Math.abs(f_n_volume(f_o_mesh(o_board.o.s_stl)) - 96984.6) < 0.5, `box ${f_n_volume(f_o_mesh(o_board.o.s_stl))}`);
        assertEquals(f_a_n__size(f_o_mesh(o_board.o.s_stl)), [124.5, 51.8, 156.6]);
        let o_print = await f_o_post('/api/mesh', { o_setting: {}, s_part: 'print' });
        assert(Math.abs(f_n_volume(f_o_mesh(o_print.o.s_stl)) - 96984.6) < 0.5, 'the same box upside down');
        // the puck's plate with its holder's cup, lying on its front and standing in the box
        let o_plate = await f_o_post('/api/mesh', { o_setting: { light: 'puck' }, s_part: 'puck_plate' });
        assert(Math.abs(f_n_volume(f_o_mesh(o_plate.o.s_stl)) - 47801.0) < 0.5, `plate ${f_n_volume(f_o_mesh(o_plate.o.s_stl))}`);
        assertEquals(f_a_n__size(f_o_mesh(o_plate.o.s_stl)), [120, 156, 30.1]);
        let o_placed = await f_o_post('/api/mesh', { o_setting: { light: 'puck' }, s_part: 'placed' });
        assertEquals(f_a_n__size(f_o_mesh(o_placed.o.s_stl)), [120, 30.1, 156]);

        // what the page reckons for its preview is what the script builds, for both lights
        for(let o_change of [
            { light: 'board', sheet_thicknesses: [0.4, 0.2, 1.2, 0.4] },
            { light: 'puck', sheet_thicknesses: [0.4, 0.15, 0.4], sheet_distance: 8, light_distance: 30 },
            { light: 'board', sheet_x: 200, sheet_y: 110, sheet_thicknesses: [0.4, 0.4] },
            { light: 'puck', sheet_x: 90, sheet_y: 100, sheet_thicknesses: [0.4] }
        ]){
            let o = await f_o_post('/api/mesh', { o_setting: o_change, s_part: 'box' });
            assertEquals(o.n_status, 200, JSON.stringify(o.o));
            let o_box = f_o_box({ ...o_v, ...o_change }, o_change.sheet_thicknesses);
            let a_n_size = f_a_n__size(f_o_mesh(o.o.s_stl));
            for(let [n_idx, n] of [o_box.n_mm__width, o_box.n_mm__depth, o_box.n_mm__height].entries()){
                assert(Math.abs(n - a_n_size[n_idx]) < 0.002, `${JSON.stringify(o_change)}: size ${a_n_size}, reckoned ${[o_box.n_mm__width, o_box.n_mm__depth, o_box.n_mm__height]}`);
            }
            let s_slits = o.o.a_s_echo.find(function(s){ return s.startsWith('slits'); }).split(': ')[1];
            assertEquals(s_slits.split(', ').map(function(s){ return s.split(' / ').map(Number); }),
                o_box.a_n_mm__centre.map(function(n, n_idx){ return [Math.round(n * 1e4) / 1e4, o_box.a_n_mm__slot[n_idx]]; }));
            if(o_change.light === 'puck'){
                let n_z = Number(o.o.a_s_echo.find(function(s){ return s.startsWith('puck'); }).match(/its middle ([0-9.]+) above/)[1]);
                assert(Math.abs(n_z - o_v.stop_height - o_box.n_mm__puck_z) < 0.001, 'the puck\'s height');
            }
        }

        // a sheet 30 x 20 with a hole 10 x 10, 0.4 thick
        let a_n = new Float32Array(300 * 200).fill(1);
        for(let n_y = 50; n_y < 150; n_y++){
            for(let n_x = 100; n_x < 200; n_x++){ a_n[n_y * 300 + n_x] = 0; }
        }
        let a_a_n = f_a_a_n__sheet(a_n, 300, 200, 30, 20);
        let o_sheet = await f_o_post('/api/sheet', { s_svg: f_s_svg__sheet(a_a_n, 30, 20), n_mm__thickness: 0.4 });
        assertEquals(o_sheet.n_status, 200, JSON.stringify(o_sheet.o));
        assert(Math.abs(f_n_volume(f_o_mesh(o_sheet.o.s_stl)) - 0.4 * f_n_area(a_a_n)) < 0.001, 'the sheet\'s volume is its area by its thickness');
        assert(Math.abs(f_n_area(a_a_n) - 500) < 0.1);
        assertEquals(f_a_n__size(f_o_mesh(o_sheet.o.s_stl)), [30, 20, 0.4]);

        for(let [s_path, o_body, s_message] of [
            ['/api/mesh', { o_setting: { part: 'box' }, s_part: 'box' }, 'without part'],
            ['/api/mesh', { o_setting: { sheet_x: 9 }, s_part: 'box' }, 'from 70 to 300'],
            ['/api/mesh', { o_setting: {}, s_part: 'lid' }, 'one of'],
            ['/api/mesh', { o_setting: { 'x=1;y': 2 }, s_part: 'box' }, 'no setting'],
            // the script's own word on settings that do not go together
            ['/api/mesh', { o_setting: { sheet_distance: 3, chamfer: 1 }, s_part: 'box' }, 'sheet_distance or light_distance too small'],
            ['/api/mesh', { o_setting: { light: 'puck', sheet_x: 70 }, s_part: 'box' }, 'sheet_x too small for the puck'],
            ['/api/sheet', { s_svg: '<svg xmlns="http://www.w3.org/2000/svg"><image href="/etc/passwd"/></svg>', n_mm__thickness: 0.4 }, 'as the page writes it'],
            ['/api/sheet', { s_svg: f_s_svg__sheet(a_a_n, 30, 20), n_mm__thickness: 0 }, 'from 0.05 to 10'],
            ['/api/sheet', { s_svg: f_s_svg__sheet(a_a_n, 30, 20), n_mm__thickness: '1) cube(9); translate(0' }, 'from 0.05 to 10']
        ]){
            let o = await f_o_post(s_path, o_body);
            assertEquals(o.n_status, 400, JSON.stringify(o_body));
            assert(o.o.s_message.includes(s_message), `${o.o.s_message} has no ${s_message}`);
        }
        // only files of webapp/ by name: the script beside it is not served
        assertEquals((await (await fetch(`${s_url}/%2e%2e/paper_light_box_veryos_V2.scad`)).text()), 'not found');
        assertEquals((await fetch(`${s_url}/index.html`)).status, 200);
    } finally{
        o_process.kill();
        await o_process.status;
    }
} });
