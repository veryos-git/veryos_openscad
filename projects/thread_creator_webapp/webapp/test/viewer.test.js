// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Runs the real viewer on Mesa's software renderer and looks at the pictures it draws.
// Skips itself where Mesa cannot start.

import { assert, assertEquals } from './check.js';
import { f_o_gl } from './gl_shim.js';
import { f_a_n_tri__box } from './shape.js';

let n_scl_x = 320, n_scl_y = 240;

let o_shim = null;
try{
    o_shim = f_o_gl(n_scl_x, n_scl_y);
} catch(o_error){
    console.log(`no software GL here, skipping the viewer's tests: ${o_error.message}`);
}

Deno.test({ name: 'the viewer draws parts in their colours, in every look, with a tool over them', ignore: !o_shim, sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let f_raf = null;
    globalThis.window = { devicePixelRatio: 1 };
    globalThis.requestAnimationFrame = function(f){ f_raf = f; };
    globalThis.ResizeObserver = class { observe(){} };
    let { f_o_viewer, s_vertex, s_fragment, s_vertex__overlay, s_fragment__overlay, o_look__by_name } = await import('../viewer.module.js');
    // GLSL reserves names with two underscores in a row, unlike this project's JS.
    assert(!/__/.test(s_vertex + s_fragment + s_vertex__overlay + s_fragment__overlay), 'a shader name has two underscores in a row');
    assertEquals(Object.keys(o_look__by_name), ['day', 'edges', 'xray']);
    let o_viewer = f_o_viewer({
        clientWidth: n_scl_x, clientHeight: n_scl_y, width: 0, height: 0,
        getContext: function(){ return o_shim.o_gl; },
        addEventListener: function(){},
        setPointerCapture: function(){},
        getBoundingClientRect: function(){ return { left: 0, top: 0, right: n_scl_x, bottom: n_scl_y, width: n_scl_x, height: n_scl_y }; }
    });
    // A red box beside a blue one.
    let a_n_pos = Float32Array.from([...f_a_n_tri__box([-30, -10, 0], [-5, 10, 20]), ...f_a_n_tri__box([5, -10, 0], [30, 10, 20])]);
    let a_n_col = new Uint8Array(a_n_pos.length);
    for(let n_off = 0; n_off < a_n_col.length; n_off += 3){ a_n_col.set(n_off < a_n_col.length / 2 ? [220, 30, 30] : [30, 60, 220], n_off); }
    o_viewer.f_set_mesh({ a_n_pos, a_n_col });
    o_viewer.f_frame([-30, -10, 0], [30, 10, 20]);
    let f_a_n_picture = function(){
        f_raf();
        let n_error = o_shim.n_error();
        assert(n_error === 0, `GL error 0x${n_error.toString(16)}`);
        return o_shim.f_pixels();
    };
    let f_n_cnt = function(a_n, f_b){
        let n_cnt = 0;
        for(let n_off = 0; n_off < a_n.length; n_off += 4){
            if(f_b(a_n[n_off], a_n[n_off + 1], a_n[n_off + 2], a_n[n_off + 3])){ n_cnt++; }
        }
        return n_cnt;
    };
    let a_n = f_a_n_picture();
    let n_red = f_n_cnt(a_n, (r, g, b, a) => a > 0 && r > 2 * g && r > 2 * b), n_blue = f_n_cnt(a_n, (r, g, b, a) => a > 0 && b > 2 * r && b > g);
    assert(n_red > 2000 && n_blue > 2000, `red ${n_red}, blue ${n_blue}`);
    // Red on the left of the picture, blue on the right.
    let f_n_x = function(f_b){
        let n_sum = 0, n_cnt = 0;
        for(let n_off = 0; n_off < a_n.length; n_off += 4){
            if(f_b(a_n[n_off], a_n[n_off + 1], a_n[n_off + 2], a_n[n_off + 3])){ n_sum += (n_off / 4) % n_scl_x; n_cnt++; }
        }
        return n_sum / n_cnt;
    };
    assert(f_n_x((r, g, b, a) => a > 0 && r > 2 * g) < f_n_x((r, g, b, a) => a > 0 && b > 2 * r));
    o_viewer.f_set_view({ s_look: 'edges' });
    let n_dark = f_n_cnt(f_a_n_picture(), (r, g, b, a) => a > 0 && r < 30 && g < 30 && b < 30);
    assert(n_dark > 100, `edges ${n_dark}`);
    o_viewer.f_set_view({ s_look: 'xray' });
    assert(f_n_cnt(f_a_n_picture(), (r, g, b, a) => a > 0) > 2000);
    o_viewer.f_set_view({ s_look: 'day' });
    // A tool: a yellow face across the boxes, a white line, a point.
    o_viewer.f_set_tool({
        f_a_o_shape: function(){
            return [
                { s_type: 'fill', a_n_pos: Float32Array.from([-40, -20, 10, 40, -20, 10, 40, 20, 10, -40, -20, 10, 40, 20, 10, -40, 20, 10]), a_n_col: [1, 0.9, 0], n_alpha: 0.5 },
                { s_type: 'line', a_n_pos: Float32Array.from([0, 0, 0, 0, 0, 30]), a_n_col: [1, 1, 1] },
                { s_type: 'point', a_n_pos: Float32Array.from([0, 0, 30]), a_n_col: [0, 1, 0], n_px: 9 }
            ];
        },
        f_b_down: () => false, f_move: () => {}, f_up: () => {}, f_b_hover: () => false
    });
    a_n = f_a_n_picture();
    assert(f_n_cnt(a_n, (r, g, b, a) => a > 0 && r > 200 && g > 200 && b > 200) > 20, 'the line');
    assert(f_n_cnt(a_n, (r, g, b, a) => a > 0 && g > 200 && r < 60 && b < 60) > 20, 'the point');
    assert(f_n_cnt(a_n, (r, g, b, a) => a > 0 && r > 150 && g > 120 && b < 90) > 200, 'the face');
} });
