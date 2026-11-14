// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Runs the real viewer on Mesa's software renderer and looks at the pictures it draws.
// Skips itself where Mesa cannot start.

import { assert, assertEquals, f_s_path } from './check.js';
import { f_o_gl } from './gl_shim.js';
import { f_a_n_normal } from '../neck.module.js';
import { f_a_n_col__object } from '../color.module.js';
import { f_o_mesh__object, f_o_param__default as f_o_param__object } from '../object.module.js';
import { f_a_n_mat4__of_place, f_a_n_tri__moved, f_a_n_px, f_o_gizmo } from '../gizmo.module.js';
import { f_a_n_tri__ball, f_a_n_col__of_tri } from './shape.js';

let n_scl_x = 360, n_scl_y = 460;

let o_shim = null;
try{
    o_shim = f_o_gl(n_scl_x, n_scl_y);
} catch(o_error){
    console.log(`no software GL here, skipping the viewer's tests: ${o_error.message}`);
}

Deno.test({ name: 'the viewer draws the bulb on its clip, in every look', ignore: !o_shim, sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let f_raf = null;
    globalThis.window = { devicePixelRatio: 1 };
    globalThis.requestAnimationFrame = function(f){ f_raf = f; };
    globalThis.ResizeObserver = class { observe(){} };
    let { f_o_viewer, s_vertex, s_fragment, o_look__by_name } = await import('../viewer.module.js');
    // GLSL reserves names with two underscores in a row, unlike this project's JS.
    assert(!/__/.test(s_vertex + s_fragment), 'a shader name has two underscores in a row');
    assertEquals(Object.keys(o_look__by_name), ['day', 'lit', 'overhang', 'edges', 'vertices', 'xray']);

    let o_f__by_event = {};
    let o_viewer = f_o_viewer({
        clientWidth: n_scl_x, clientHeight: n_scl_y, width: 0, height: 0,
        getContext: function(){ return o_shim.o_gl; },
        addEventListener: function(s_event, f){ o_f__by_event[s_event] = f; },
        setPointerCapture: function(){},
        getBoundingClientRect: function(){ return { left: 0, top: 0, right: n_scl_x, bottom: n_scl_y, width: n_scl_x, height: n_scl_y }; }
    });
    // As the page has it: the clip's end on the desk, the bulb's bed as high as the clip
    // stands out of the neck, the LED 3 above the neck's top.
    let o_bulb = JSON.parse(await Deno.readTextFile(f_s_path('part/bulb.json')));
    let n_z__shade = o_bulb.n_mm__clip_scl_z - o_bulb.n_mm__neck_scl_z;
    o_viewer.f_set_shade_z(n_z__shade);
    o_viewer.f_set_view({ a_n_light__pos: [0, 0, n_z__shade + o_bulb.n_mm__neck_scl_z + 3], a_n_absorb: [0.36, 0.4, 0.46] });
    let a_o_stl = [{ o_buffer: (await Deno.readFile(f_s_path('part/clip.stl'))).buffer, n_z: 0 }];
    // Twice: the second set takes the first's place.
    o_viewer.f_set_part(a_o_stl);
    o_viewer.f_set_part(a_o_stl);
    // Rows come back from the bottom up; this turns them to run from the top down.
    let f_a_n_picture = function(o_view){
        o_viewer.f_set_view({ s_look: 'day', b_cut: false, b_base: true, n_nor__section: 1, n_deg__limit: 45, ...o_view });
        f_raf();
        let n_error = o_shim.n_error();
        assert(n_error === 0, `GL error 0x${n_error.toString(16)}`);
        let a_n = o_shim.f_pixels();
        let a_n__flipped = new Uint8Array(a_n.length);
        for(let n_y = 0; n_y < n_scl_y; n_y++){
            a_n__flipped.set(a_n.subarray((n_scl_y - 1 - n_y) * n_scl_x * 4, (n_scl_y - n_y) * n_scl_x * 4), n_y * n_scl_x * 4);
        }
        return a_n__flipped;
    };
    let f_n_cnt = function(a_n, f_b){
        let n_cnt = 0;
        for(let n_off = 0; n_off < a_n.length; n_off += 4){
            if(f_b(a_n[n_off], a_n[n_off + 1], a_n[n_off + 2], a_n[n_off + 3])){ n_cnt++; }
        }
        return n_cnt;
    };
    let f_b_drawn = (r, g, b, a) => a > 0;
    let f_o_row = function(a_n, n_y){
        let n_x__min = Infinity, n_x__max = -1;
        for(let n_x = 0; n_x < n_scl_x; n_x++){
            if(a_n[(n_y * n_scl_x + n_x) * 4 + 3] > 0){
                n_x__min = Math.min(n_x__min, n_x);
                n_x__max = Math.max(n_x__max, n_x);
            }
        }
        return { n_x__min, n_x__max, n_scl_x: n_x__max - n_x__min + 1 };
    };

    /* ---- A bulb: a ball of 15 on the neck, red to the right and blue to the left ---- */

    let a_n_tri__bulb = f_a_n_tri__ball(15, [0, 0, 25], 48);
    let o_mesh = f_o_mesh__object(a_n_tri__bulb, f_o_param__object(), o_bulb, 0.8, 90,
        f_a_n_col__of_tri(a_n_tri__bulb, function(n_x){ return n_x > 0 ? [230, 40, 40] : [40, 60, 230]; }));
    o_viewer.f_set_mesh({ ...o_mesh, a_n_nor: f_a_n_normal(o_mesh.a_n_pos, o_mesh.a_n_idx) });
    o_viewer.f_set_view({ b_single_wall: false });
    o_viewer.f_frame(n_z__shade + 40, 0);
    o_viewer.f_look_from(-Math.PI / 2, Math.PI / 2);
    let a_n_day = f_a_n_picture({});
    let n_cnt__drawn = f_n_cnt(a_n_day, f_b_drawn);
    assert(n_cnt__drawn > n_scl_x * n_scl_y * 0.12, `only ${n_cnt__drawn} pixels drawn`);
    assert(a_n_day[3] === 0, 'the corner must show the page behind the canvas');
    let f_n_cnt__half = function(a_n, b_right, f_b){
        let n_cnt = 0;
        for(let n_off = 0; n_off < a_n.length; n_off += 4){
            if(((n_off / 4) % n_scl_x > n_scl_x / 2) === b_right && f_b(a_n[n_off], a_n[n_off + 1], a_n[n_off + 2], a_n[n_off + 3])){ n_cnt++; }
        }
        return n_cnt;
    };
    let f_b_red = (r, g, b, a) => a > 0 && r > 2 * g && r > 2 * b;
    let f_b_blue = (r, g, b, a) => a > 0 && b > 2 * g && b > 2 * r;
    assert(f_n_cnt__half(a_n_day, true, f_b_red) > 0.25 * n_cnt__drawn && f_n_cnt__half(a_n_day, false, f_b_blue) > 0.25 * n_cnt__drawn,
        `the bulb is not red to the right and blue to the left: ${f_n_cnt__half(a_n_day, true, f_b_red)}, ${f_n_cnt__half(a_n_day, false, f_b_blue)} of ${n_cnt__drawn}`);
    // Upright: the neck and the clip narrow at the bottom, the ball wide above, centred.
    let n_y__last = n_scl_y - 1;
    while(f_o_row(a_n_day, n_y__last).n_scl_x <= 0){ n_y__last--; }
    let n_y__first = 0;
    while(f_o_row(a_n_day, n_y__first).n_scl_x <= 0){ n_y__first++; }
    let o_row__low = f_o_row(a_n_day, n_y__last - 3);
    let o_row__mid = f_o_row(a_n_day, Math.round(n_y__first + 0.3 * (n_y__last - n_y__first)));
    assert(o_row__low.n_scl_x < 0.4 * o_row__mid.n_scl_x, `the bulb stands on its head: ${o_row__low.n_scl_x} wide at the bottom, ${o_row__mid.n_scl_x} above`);
    assert(Math.abs(o_row__mid.n_x__min + o_row__mid.n_x__max - n_scl_x) < 8, 'the bulb is off centre');
    // Without the clip, less is drawn at the bottom; with a section too; cut open as well.
    let n_cnt__without_clip = f_n_cnt(f_a_n_picture({ b_base: false }), f_b_drawn);
    assert(n_cnt__without_clip < n_cnt__drawn - 100, `the clip did not go away: ${n_cnt__without_clip} of ${n_cnt__drawn}`);
    let n_cnt__half = f_n_cnt(f_a_n_picture({ n_nor__section: 0.5 }), f_b_drawn);
    assert(n_cnt__half < 0.8 * n_cnt__drawn && n_cnt__half > 0.2 * n_cnt__drawn, `the section at half: ${n_cnt__half} of ${n_cnt__drawn}`);
    assert(f_n_cnt(f_a_n_picture({ b_cut: true }), f_b_drawn) < n_cnt__drawn, 'nothing was cut');
    // Lit by the LED inside: the thin wall glows, the neck stays dark.
    let a_n_lit = f_a_n_picture({ s_look: 'lit' });
    let n_cnt__bright = f_n_cnt(a_n_lit, (r, g, b, a) => a > 0 && g > 150);
    assert(n_cnt__bright > 0.3 * n_cnt__drawn, `lit, the bulb does not glow: ${n_cnt__bright} of ${n_cnt__drawn}`);
    // Overhang: a ball's underside, past a low limit.
    let f_b_hot = (r, g, b, a) => a > 0 && r > 150 && g < r * 0.8 && b < 60;
    assert(f_n_cnt(f_a_n_picture({ s_look: 'overhang', n_deg__limit: 30 }), f_b_hot) > 300, 'no overhang shown at a low limit');
    // Edges, vertices and x-ray.
    let f_b_mark = (r, g, b, a) => a > 0 && r < 40 && g < 45 && b < 50;
    assert(f_n_cnt(f_a_n_picture({ s_look: 'edges' }), f_b_mark) > f_n_cnt(a_n_day, f_b_mark) + 1500, 'no edges');
    assert(f_n_cnt(f_a_n_picture({ s_look: 'xray' }), (r, g, b, a) => a > 0 && a < 250) > 0.5 * n_cnt__drawn, 'x-ray is not seen through');

    /* ---- An object: its bulb, the object itself while it is placed, the gizmo over both ---- */

    let a_n_tri = f_a_n_tri__ball(10, [0, 0, 0], 24);
    let o_place = { a_n_trn: [0, 0, 20], a_n_rot: [0, 0, 0, 1], n_scl: 1 };
    let o_object = f_o_mesh__object(f_a_n_tri__moved(a_n_tri, f_a_n_mat4__of_place(o_place, [0, 0, 0])), f_o_param__object(), o_bulb, 0.8, 90);
    o_viewer.f_set_mesh({ ...o_object, a_n_nor: f_a_n_normal(o_object.a_n_pos, o_object.a_n_idx), a_n_col: f_a_n_col__object(o_object.a_n_wall.length) });
    o_viewer.f_frame(n_z__shade + 50, 0);
    o_viewer.f_look_from(-Math.PI / 2, Math.PI / 2);
    // The bulb is a warm white, the object as its file has it a cool grey.
    let f_b_white = (r, g, b, a) => a > 0 && r > 150 && r >= b && r - b < 45;
    let f_b_ghost = (r, g, b, a) => a > 0 && b > r + 12 && b > 70 && r > 40;
    let a_n_object = f_a_n_picture({ b_base: false });
    assert(f_n_cnt(a_n_object, f_b_white) > 0.8 * f_n_cnt(a_n_object, f_b_drawn) && f_n_cnt(a_n_object, f_b_ghost) === 0,
        `the object's bulb is not white: ${f_n_cnt(a_n_object, f_b_white)} of ${f_n_cnt(a_n_object, f_b_drawn)}`);
    // While it is placed: the object as its file has it, where the matrix puts it, and no bulb.
    o_viewer.f_set_ghost(a_n_tri);
    o_viewer.f_set_ghost_place(f_a_n_mat4__of_place(o_place, [0, 0, 0]), true);
    let a_n_ghost = f_a_n_picture({ b_base: false, b_shade: false });
    let n_cnt__ghost = f_n_cnt(a_n_ghost, f_b_drawn);
    assert(f_n_cnt(a_n_ghost, f_b_ghost) > 0.5 * n_cnt__ghost && n_cnt__ghost > 6000 && f_n_cnt(a_n_ghost, f_b_white) === 0,
        `the object while it is placed: ${f_n_cnt(a_n_ghost, f_b_ghost)} of ${n_cnt__ghost} pixels in its colour, ${f_n_cnt(a_n_ghost, f_b_white)} in the bulb's`);
    // Nothing else is drawn now: where its pixels are is where it is.
    let f_n_x__middle = function(a_n){
        let n_sum = 0, n_cnt = 0;
        for(let n_off = 0; n_off < a_n.length; n_off += 4){
            if(a_n[n_off + 3] > 0){ n_sum += (n_off / 4) % n_scl_x; n_cnt++; }
        }
        return n_sum / n_cnt;
    };
    assert(Math.abs(f_n_x__middle(a_n_ghost) - n_scl_x / 2) < 2, `the object is not in the middle: ${f_n_x__middle(a_n_ghost)}`);
    // Twice as large and 7 to the right.
    o_viewer.f_set_ghost_place(f_a_n_mat4__of_place({ ...o_place, a_n_trn: [7, 0, 20], n_scl: 2 }, [0, 0, 0]), true);
    let a_n_ghost__moved = f_a_n_picture({ b_base: false, b_shade: false });
    assert(Math.abs(f_n_cnt(a_n_ghost__moved, f_b_drawn) / n_cnt__ghost - 4) < 0.25, `twice as large is not four times the pixels: ${f_n_cnt(a_n_ghost__moved, f_b_drawn)} after ${n_cnt__ghost}`);
    assert(f_n_x__middle(a_n_ghost__moved) > n_scl_x / 2 + 15, `the object did not move to the right: ${f_n_x__middle(a_n_ghost__moved)}`);
    // An object with colours of its own shows them while it is placed: red to the right, blue to the left.
    o_viewer.f_set_ghost(a_n_tri, f_a_n_col__of_tri(a_n_tri, function(n_x){ return n_x > 0 ? [255, 40, 40] : [40, 40, 255]; }));
    o_viewer.f_set_ghost_place(f_a_n_mat4__of_place(o_place, [0, 0, 0]), true);
    let a_n_ghost__colored = f_a_n_picture({ b_base: false, b_shade: false });
    let f_b_blue__ghost = (r, g, b, a) => a > 0 && b > 2 * g && b > 2 * r;
    let a_n_cnt__colored = [f_n_cnt__half(a_n_ghost__colored, true, f_b_red), f_n_cnt__half(a_n_ghost__colored, false, f_b_blue__ghost), f_n_cnt__half(a_n_ghost__colored, false, f_b_red), f_n_cnt__half(a_n_ghost__colored, true, f_b_blue__ghost)];
    assert(a_n_cnt__colored[0] > 0.4 * n_cnt__ghost && a_n_cnt__colored[1] > 0.4 * n_cnt__ghost && a_n_cnt__colored[2] + a_n_cnt__colored[3] < 0.01 * n_cnt__ghost,
        `the object in its colours: ${a_n_cnt__colored} pixels red right, blue left, red left, blue right, of ${n_cnt__ghost}`);
    assertEquals(f_n_cnt(a_n_ghost__colored, f_b_drawn), n_cnt__ghost, 'colours changed its outline');
    // Another object without colours is grey again.
    o_viewer.f_set_ghost(a_n_tri);
    assert(f_n_cnt(f_a_n_picture({ b_base: false, b_shade: false }), f_b_ghost) > 0.5 * n_cnt__ghost, 'the colours of the object before stayed');
    // With the bulb again, and the object hidden.
    o_viewer.f_set_ghost_place(f_a_n_mat4__of_place(o_place, [0, 0, 0]), false);
    assertEquals(f_n_cnt(f_a_n_picture({ b_base: false, b_shade: true }), f_b_ghost), 0, 'the hidden object is drawn');

    // The gizmo: over the bulb, its middle where the object stands, its arrows in the axes' colours.
    let n_cnt__done = 0;
    let o_gizmo = f_o_gizmo({
        f_o_place: function(){ return o_place; },
        f_set_place: function(o){ o_place = o; },
        f_done: function(){ n_cnt__done++; }
    });
    let o_camera__seen = null;
    o_viewer.f_set_tool({ ...o_gizmo, f_a_o_shape: function(o_camera){
        o_camera__seen = o_camera;
        return o_gizmo.f_a_o_shape(o_camera);
    } });
    let a_n_tool = f_a_n_picture({ b_base: false });
    let a_n_px = f_a_n_px(o_camera__seen, o_place.a_n_trn);
    assert(Math.abs(a_n_px[0] - n_scl_x / 2) < 1 && a_n_px[1] > 0 && a_n_px[1] < n_scl_y, `the object's middle on screen: ${a_n_px}`);
    // The colour [right, down] of the object's middle, as the gizmo's own: 0 to 1.
    let f_check_at = function(a_n, n_dx, n_dy, a_n_col, s_what){
        let n_off = (Math.round(a_n_px[1] + n_dy) * n_scl_x + Math.round(a_n_px[0] + n_dx)) * 4;
        let a_n_seen = [...a_n.subarray(n_off, n_off + 4)];
        assert(a_n_seen[3] === 255 && a_n_col.every(function(n_val, n_idx){ return Math.abs(a_n_seen[n_idx] - n_val * 255) <= 1; }), `${s_what}: ${a_n_seen} is not ${a_n_col}`);
    };
    // The middle, the arrows' heads along x and z, the ring that resizes, the ring around y.
    f_check_at(a_n_tool, 0, 0, [1, 0.55, 0.1], 'the middle');
    f_check_at(a_n_tool, 100, 0, [0.96, 0.33, 0.3], 'the arrow along x');
    f_check_at(a_n_tool, 0, -100, [0.36, 0.58, 1], 'the arrow along z');
    f_check_at(a_n_tool, -122, 0, [1, 0.55, 0.1], 'the ring that resizes');
    // The ring around y faces the eye: a circle of 74 px, its line 2 px wide. At 30 degrees,
    // where no other ring crosses it and the rounding of the middle cannot miss it.
    f_check_at(a_n_tool, 74 * Math.cos(Math.PI / 6), 74 * Math.sin(Math.PI / 6), [0.42, 0.85, 0.4], 'the ring around y');
    // The pointer over a handle lights it up; down on it, it moves the object and not the eye.
    let n_cnt__turned = 0;
    o_viewer.f_set_on_camera(function(){ n_cnt__turned++; });
    n_cnt__turned = 0;
    let f_o_evt = function(n_dx, n_dy, o_more = {}){ return { pointerId: 1, button: 0, shiftKey: false, clientX: a_n_px[0] + n_dx, clientY: a_n_px[1] + n_dy, ...o_more }; };
    o_f__by_event.pointermove(f_o_evt(100, 0));
    f_check_at(f_a_n_picture({ b_base: false }), 100, 0, [1, 1, 1], 'the arrow under the pointer');
    o_f__by_event.pointerdown(f_o_evt(100, 0));
    o_f__by_event.pointermove(f_o_evt(140, 0));
    o_f__by_event.pointerup(f_o_evt(140, 0));
    // A pixel at the object's depth along the view, which is its distance only on the view's axis.
    let n_depth = [0, 0, 20].reduce(function(n_sum, n_val, n_idx){ return n_sum + (n_val - o_camera__seen.a_n_eye[n_idx]) * o_camera__seen.a_n_forward[n_idx]; }, 0);
    let n_mm_per_px = n_depth * 2 * o_camera__seen.n_tan / n_scl_y;
    assert(Math.abs(o_place.a_n_trn[0] - 40 * n_mm_per_px) < 1e-3 && o_place.a_n_trn[1] === 0 && o_place.a_n_trn[2] === 20, `the object after the drag: ${o_place.a_n_trn}`);
    assertEquals([n_cnt__done, n_cnt__turned], [1, 0]);
    // The gizmo went with it.
    a_n_px = f_a_n_px(o_camera__seen, o_place.a_n_trn);
    f_check_at(f_a_n_picture({ b_base: false }), 0, 0, [1, 0.55, 0.1], 'the middle after the drag');
    // Beside the handles the pointer turns the bulb, as without a tool; with shift it never takes a handle.
    o_f__by_event.pointerdown(f_o_evt(40, 40));
    o_f__by_event.pointermove(f_o_evt(60, 40));
    o_f__by_event.pointerup(f_o_evt(60, 40));
    o_f__by_event.pointerdown(f_o_evt(100, 0, { shiftKey: true }));
    o_f__by_event.pointermove(f_o_evt(120, 0, { shiftKey: true }));
    o_f__by_event.pointerup(f_o_evt(120, 0, { shiftKey: true }));
    assertEquals([n_cnt__done, n_cnt__turned], [1, 2]);
    // Without the tool nothing of it is left.
    o_viewer.f_set_tool(null);
    o_viewer.f_look_from(-Math.PI / 2, Math.PI / 2);
    let a_n_bare = f_a_n_picture({ b_base: false });
    assertEquals(f_n_cnt(a_n_bare, (r, g, b, a) => a > 0 && r === 255 && g === 140 && b === 26), 0, 'the gizmo is still drawn');
} });
