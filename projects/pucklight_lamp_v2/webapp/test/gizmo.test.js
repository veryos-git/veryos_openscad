// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The gizmo: where an object stands as a matrix, what the eye sees of it, which handle
// is under the pointer, and where a drag of each handle leads.

import { assert, assertEquals, assertAlmostEquals } from './check.js';
import {
    f_o_place__default, f_a_n_rot__of_axis, f_a_n_rot__multiplied, f_a_n_mat4__of_place, f_a_n_tri__moved, f_o_bound__moved,
    f_a_n_px, f_a_n_ray, f_s_handle__at, f_o_place__dragged, f_o_gizmo
} from '../gizmo.module.js';

let f_check_near = function(a_n_a, a_n_b, n_tolerance, s_message = ''){
    assertEquals(a_n_a.length, a_n_b.length, s_message);
    a_n_a.forEach(function(n_val, n_idx){ assertAlmostEquals(n_val, a_n_b[n_idx], n_tolerance, `${s_message} [${n_idx}] of ${[...a_n_a]} against ${[...a_n_b]}`); });
};
// An eye in front of the lamp, at y = -400, 60 above the bed, level: x is to the right, z up.
let o_camera = { a_n_eye: [0, -400, 60], a_n_right: [1, 0, 0], a_n_up: [0, 0, 1], a_n_forward: [0, 1, 0], n_tan: Math.tan(12 * Math.PI / 180), n_scl_x: 900, n_scl_y: 800 };
// So many mm is a pixel, 400 in front of the eye.
let n_mm_per_px = 400 * 2 * o_camera.n_tan / 800;
let o_place = { a_n_trn: [0, 0, 60], a_n_rot: [0, 0, 0, 1], n_scl: 1 };

Deno.test('a place as a matrix: sized, then turned, then moved, around the file\'s middle', function(){
    let a_n_rot = f_a_n_rot__of_axis([0, 0, 1], Math.PI / 2);
    f_check_near(a_n_rot, [0, 0, Math.SQRT1_2, Math.SQRT1_2], 1e-9);
    let a_n_mat4 = f_a_n_mat4__of_place({ a_n_trn: [10, 20, 30], a_n_rot, n_scl: 2 }, [1, 1, 1]);
    // The file's middle goes to where the place is; a point 1 to its right goes 2 to its back.
    f_check_near(f_a_n_tri__moved(new Float32Array([1, 1, 1, 2, 1, 1, 1, 1, 4]), a_n_mat4), [10, 20, 30, 10, 22, 30, 10, 20, 36], 1e-5);
    assertEquals(f_o_bound__moved(new Float32Array([1, 1, 1, 2, 1, 1, 1, 1, 4]), a_n_mat4), { a_n_min: [10, 20, 30], a_n_max: [10, 22, 36] });
    f_check_near(f_a_n_mat4__of_place(f_o_place__default(), [0, 0, 0]), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], 0);
    // Two quarter turns around x are a half turn; a quarter around z after one around x is not the other way round.
    let a_n_x = f_a_n_rot__of_axis([1, 0, 0], Math.PI / 2);
    f_check_near(f_a_n_rot__multiplied(a_n_x, a_n_x), [1, 0, 0, 0], 1e-9);
    let f_a_n_turned = function(a_n_q){ return [...f_a_n_tri__moved(new Float32Array([0, 1, 0]), f_a_n_mat4__of_place({ a_n_trn: [0, 0, 0], a_n_rot: a_n_q, n_scl: 1 }, [0, 0, 0]))]; };
    f_check_near(f_a_n_turned(a_n_x), [0, 0, 1], 1e-6, 'y turns up around x');
    f_check_near(f_a_n_turned(f_a_n_rot__multiplied(a_n_rot, a_n_x)), [0, 0, 1], 1e-6, 'first around x, then around z');
    f_check_near(f_a_n_turned(f_a_n_rot__multiplied(a_n_x, a_n_rot)), [-1, 0, 0], 1e-6, 'first around z, then around x');
});

Deno.test('what the eye sees: a point on screen, and the line of sight back through it', function(){
    f_check_near(f_a_n_px(o_camera, [0, 0, 60]), [450, 400], 1e-9, 'straight ahead is the middle');
    f_check_near(f_a_n_px(o_camera, [10, 0, 60]), [450 + 10 / n_mm_per_px, 400], 1e-9, 'to the right');
    f_check_near(f_a_n_px(o_camera, [0, 0, 70]), [450, 400 - 10 / n_mm_per_px], 1e-9, 'up is up on screen');
    f_check_near(f_a_n_px(o_camera, [10, 400, 60]), [450 + 5 / n_mm_per_px, 400], 1e-9, 'twice as far is half as large');
    for(let a_n_point of [[37, -20, 99], [-80, 150, 10]]){
        let a_n_px = f_a_n_px(o_camera, a_n_point);
        let a_n_ray = f_a_n_ray(o_camera, a_n_px[0], a_n_px[1]);
        let a_n_to = a_n_point.map(function(n_val, n_idx){ return n_val - o_camera.a_n_eye[n_idx]; });
        let n_len = Math.hypot(...a_n_to);
        f_check_near(a_n_ray, a_n_to.map(function(n_val){ return n_val / n_len; }), 1e-9);
    }
});

Deno.test('the handle under the pointer', function(){
    let f_s = function(n_dx, n_dy){ return f_s_handle__at(o_camera, o_place.a_n_trn, 450 + n_dx, 400 + n_dy); };
    assertEquals(f_s(0, 0), 'move_view');
    assertEquals(f_s(6, -6), 'move_view');
    // The arrows: x to the right, z up. y points away from this eye, into its own middle.
    assertEquals([f_s(100, 0), f_s(60, 3), f_s(0, -100), f_s(-3, -55)], ['move_x', 'move_x', 'move_z', 'move_z']);
    // The ring around y faces this eye: a circle of 74. Those around x and z are seen from their side, as lines.
    assertEquals([f_s(74 * Math.SQRT1_2, 74 * Math.SQRT1_2), f_s(-74 * Math.SQRT1_2, -74 * Math.SQRT1_2 + 4)], ['turn_y', 'turn_y']);
    assertEquals([f_s(0, 40), f_s(-40, 0)], ['turn_x', 'turn_z']);
    assertEquals([f_s(122, 0), f_s(-86, 86), f_s(0, 126)], ['scale', 'scale', 'scale']);
    assertEquals([f_s(30, 30), f_s(160, 0), f_s(200, 200)], [null, null, null]);
});

Deno.test('where a drag of each handle leads', function(){
    let f_o = function(s_handle, a_n_from, a_n_to){
        return f_o_place__dragged(o_camera, o_place, s_handle, 450 + a_n_from[0], 400 + a_n_from[1], 450 + a_n_to[0], 400 + a_n_to[1]);
    };
    // An arrow moves along its axis alone, as far as the pointer went along it.
    f_check_near(f_o('move_x', [100, 0], [150, 0]).a_n_trn, [50 * n_mm_per_px, 0, 60], 1e-6);
    f_check_near(f_o('move_z', [0, -100], [0, -160]).a_n_trn, [0, 0, 60 + 60 * n_mm_per_px], 1e-6);
    // What the pointer did across counts for nothing, but for what the eye's depth makes of it: under half a pixel.
    f_check_near(f_o('move_x', [100, 0], [150, 40]).a_n_trn, [50 * n_mm_per_px, 0, 60], 0.5 * n_mm_per_px);
    f_check_near(f_o('move_z', [0, -100], [30, -160]).a_n_trn, [0, 0, 60 + 60 * n_mm_per_px], 0.5 * n_mm_per_px);
    // The arrow along y points away from the eye: seen from above it can be dragged.
    let o_camera__above = { ...o_camera, a_n_eye: [0, 0, 460], a_n_up: [0, 1, 0], a_n_forward: [0, 0, -1] };
    f_check_near(f_o_place__dragged(o_camera__above, o_place, 'move_y', 450, 300, 450, 250).a_n_trn, [0, 50 * n_mm_per_px, 60], 1e-6);
    // Along its own line of sight an arrow cannot be dragged: it stays.
    f_check_near(f_o_place__dragged(o_camera, o_place, 'move_y', 450, 400, 450, 400).a_n_trn, [0, 0, 60], 1e-9);
    // The middle moves across the screen, and stays as far from the eye.
    f_check_near(f_o('move_view', [0, 0], [40, -25]).a_n_trn, [40 * n_mm_per_px, 0, 60 + 25 * n_mm_per_px], 1e-6);
    // The ring that faces the eye: the pointer goes around the middle. Around y, which points away from this
    // eye, a turn by the right hand is with the clock.
    let f_a_n_turned = function(o){ return [...f_a_n_tri__moved(new Float32Array([1, 0, 0]), f_a_n_mat4__of_place({ ...o, a_n_trn: [0, 0, 0] }, [0, 0, 0]))]; };
    f_check_near(f_a_n_turned(f_o('turn_y', [74, 0], [0, 74])), [0, 0, -1], 1e-6, 'a quarter with the clock: what pointed right points down');
    f_check_near(f_a_n_turned(f_o('turn_y', [74, 0], [0, -74])), [0, 0, 1], 1e-6, 'a quarter against the clock');
    // A ring seen from its side: the pointer goes across the axis. Around z a drag to the right brings the
    // front to the right; around x a drag down brings the front down.
    let f_a_n_front = function(o){ return [...f_a_n_tri__moved(new Float32Array([0, -1, 0]), f_a_n_mat4__of_place({ ...o, a_n_trn: [0, 0, 0] }, [0, 0, 0]))]; };
    f_check_near(f_a_n_front(f_o('turn_z', [-40, 0], [-40 + 74 * Math.PI / 2, 0])), [1, 0, 0], 1e-6);
    f_check_near(f_a_n_front(f_o('turn_x', [0, 40], [0, 40 + 74 * Math.PI / 2])), [0, 0, -1], 1e-6);
    // A turn is added to how the object was turned before.
    let o_before = { ...o_place, a_n_rot: f_a_n_rot__of_axis([0, 0, 1], Math.PI / 2) };
    f_check_near(f_a_n_front(f_o_place__dragged(o_camera, o_before, 'turn_z', 410, 400, 410 + 74 * Math.PI / 2, 400)), [0, 1, 0], 1e-6);
    // The ring that resizes: as many times larger as the pointer is further from the middle.
    assertAlmostEquals(f_o('scale', [122, 0], [183, 0]).n_scl, 1.5, 1e-9);
    assertAlmostEquals(f_o('scale', [0, -122], [0, -61]).n_scl, 0.5, 1e-9);
    assert(f_o('scale', [122, 0], [0, 0]).n_scl > 0, 'through the middle it does not become nothing');
});

Deno.test('the gizmo as the viewer\'s tool', function(){
    let o_place__now = structuredClone(o_place);
    let n_cnt__done = 0;
    let o_gizmo = f_o_gizmo({
        f_o_place: function(){ return o_place__now; },
        f_set_place: function(o){ o_place__now = o; },
        f_done: function(){ n_cnt__done++; }
    });
    let a_o_shape = o_gizmo.f_a_o_shape(o_camera);
    // Three rings, three arrows with a head each, the ring that resizes, the middle.
    assertEquals(a_o_shape.map(function(o){ return o.s_type; }), ['line', 'line', 'line', 'line', 'point', 'line', 'point', 'line', 'point', 'line', 'point']);
    for(let o_shape of a_o_shape){
        assert(o_shape.a_n_pos instanceof Float32Array && o_shape.a_n_pos.length % (o_shape.s_type === 'line' ? 6 : 3) === 0 && o_shape.a_n_col.length === 3);
    }
    // As large on screen from far as from near.
    let o_camera__far = { ...o_camera, a_n_eye: [0, -1600, 60] };
    let a_n_tip = o_gizmo.f_a_o_shape(o_camera__far)[4].a_n_pos;
    f_check_near(f_a_n_px(o_camera__far, [...a_n_tip]), [550, 400], 1e-3);
    // Beside the handles the pointer is the viewer's; on one, a drag moves the object and ends with a word.
    assertEquals(o_gizmo.f_b_down(450 + 200, 400 + 200, o_camera), false);
    assertEquals(o_gizmo.f_b_hover(450 + 100, 400, o_camera), true, 'another handle lights up');
    assertEquals(o_gizmo.f_b_hover(450 + 99, 400, o_camera), false, 'the same handle again');
    assertEquals(o_gizmo.f_a_o_shape(o_camera)[3].a_n_col, [1, 1, 1], 'the handle under the pointer is white');
    assertEquals(o_gizmo.f_b_down(450 + 100, 400, o_camera), true);
    o_gizmo.f_move(450 + 130, 400);
    o_gizmo.f_move(450 + 150, 400);
    f_check_near(o_place__now.a_n_trn, [50 * n_mm_per_px, 0, 60], 1e-6, 'measured from where the drag began');
    assertEquals(n_cnt__done, 0);
    o_gizmo.f_up();
    o_gizmo.f_up();
    assertEquals(n_cnt__done, 1);
    // Without an object there is nothing to draw or to take.
    o_place__now = null;
    assertEquals([o_gizmo.f_a_o_shape(o_camera), o_gizmo.f_b_down(450, 400, o_camera)], [[], false]);
});
