// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// From an object and its cuts to the parts, their threaded holes, the screws and the
// bed; and the 3MF of it read back.

import { assert, assertEquals, assertAlmostEquals, f_check_closed, f_n_mm3 } from './check.js';
import { f_o_built, f_a_n_normal, f_a_n_mat4__turning, f_a_n_pos__moved, f_o_layout } from '../piece.module.js';
import { n_face__thread, f_o_mesh__welded, f_o_bound, f_o_frame } from '../cut.module.js';
import { o_thread, f_n_radius, f_o_shape__hole, f_n_mm__hole_min, f_n_mm__hole_r, f_n_mm__screw } from '../thread.module.js';
import { f_a_n_mm2, f_o_filament, f_n_fil__seam } from '../color.module.js';
import { f_o_blob__3mf } from '../export.module.js';
import { f_o_object__from_file } from '../mesh_file.module.js';
import { f_a_n_tri__box, f_a_n_tri__joined } from './shape.js';

let n_tau = Math.PI * 2;
let o_setting__default = { n_mm__clearance: 0.25, n_mm__depth: 12, n_mm__wall: 1.2, n_deg__line_up: 0, n_mm__bed: 256 };
// A level cut at height z: its plane looks up.
let f_o_cut__level = function(n_z, o_more = {}){
    return { a_n_trn: [0, 0, n_z], a_n_rot: [0, 0, 0, 1], b_thread: true, n_mm__d: 0, ...o_more };
};
let f_o_object = function(a_n_tri, f_n_fil = null){
    let o = f_o_mesh__welded(a_n_tri);
    let a_n_fil = new Uint8Array(o.a_n_idx.length / 3).fill(1);
    if(f_n_fil){
        for(let n_tri = 0; n_tri < a_n_fil.length; n_tri++){
            let a_n = [0, 1, 2].map(function(n_k){ return [0, 1, 2].reduce(function(n_sum, n_c){ return n_sum + o.a_n_pos[o.a_n_idx[n_tri * 3 + n_c] * 3 + n_k]; }, 0) / 3; });
            a_n_fil[n_tri] = f_n_fil(...a_n);
        }
    }
    return { a_n_pos: o.a_n_pos, a_n_idx: o.a_n_idx, a_n_fil, a_n_shell: o.a_n_shell };
};

// Where a screw's hole is in the cut's plane through a_n_point: its matrix has the axis
// a little below the screw's middle, where its flat is.
let f_a_n_origin = function(o_screw, a_n_point, a_n_normal){
    let o_frame = f_o_frame(a_n_normal);
    let n_mm__axis = o_screw.n_mm__d * (0.5 - o_thread.n_nor__cut);
    let a_n_on_axis = [0, 1, 2].map(function(n_k){ return o_screw.a_n_mat4__in[12 + n_k] + n_mm__axis * o_frame.a_n_v[n_k]; });
    let n_off = [0, 1, 2].reduce(function(n_sum, n_k){ return n_sum + (a_n_on_axis[n_k] - a_n_point[n_k]) * a_n_normal[n_k]; }, 0);
    return a_n_on_axis.map(function(n, n_k){ return n - n_off * a_n_normal[n_k]; });
};

// Every point of a part's holes lies on the hole's shape, as the cut's frame sees it.
let f_n_mm__off_shape = function(o_mesh, a_n_origin, o_frame, b_above, o_shape){
    let n_worst = 0, n_cnt = 0;
    for(let n_tri = 0; n_tri < o_mesh.a_n_face.length; n_tri++){
        if(o_mesh.a_n_face[n_tri] !== n_face__thread){ continue; }
        for(let n_k = 0; n_k < 3; n_k++){
            let n_off = o_mesh.a_n_idx[n_tri * 3 + n_k] * 3;
            let a_n_p = [0, 1, 2].map(function(n_j){ return o_mesh.a_n_pos[n_off + n_j] - a_n_origin[n_j]; });
            let f_n_dot = function(a_n){ return a_n_p[0] * a_n[0] + a_n_p[1] * a_n[1] + a_n_p[2] * a_n[2]; };
            // Below the cut the hole's own frame is u, -v, -w.
            let n_x = f_n_dot(o_frame.a_n_u), n_y = f_n_dot(o_frame.a_n_v) * (b_above ? 1 : -1), n_z = f_n_dot(o_frame.a_n_w) * (b_above ? 1 : -1);
            let n_r = Math.hypot(n_x, n_y);
            if(n_r < 1e-6){ continue; }
            n_worst = Math.max(n_worst, Math.abs(n_r - f_n_radius(o_shape, Math.max(0, n_z), Math.atan2(n_y, n_x))));
            n_cnt++;
        }
    }
    assert(n_cnt > 100, 'the part has a hole');
    return n_worst;
};

Deno.test('a box cut level: two closed parts, a thread in each, one screw, all on the bed', function(){
    let o_object = f_o_object(f_a_n_tri__box([-20, -15, 0], [20, 15, 60]));
    let o_setting = { ...o_setting__default, a_o_cut: [f_o_cut__level(30)] };
    let o = f_o_built(o_object, o_setting);
    assertEquals([o.a_o_part.length, o.a_o_screw.length], [2, 1]);
    let o_joint = o.a_o_cut[0].a_o_joint[0];
    assertEquals([o_joint.b_thread, o_joint.n_mm__d, o_joint.a_n_mm__deep, o_joint.a_n_part], [true, 8, [12, 12], [0, 1]]);
    assertAlmostEquals(o_joint.n_mm__room, 15, 0.05, 'the hole in the middle of the 40 x 30 face');
    assertAlmostEquals(o.a_o_screw[0].n_mm__length, f_n_mm__screw(8, 0.25, 12, 12), 1e-12);
    let n_mm3 = 0;
    for(let o_part of o.a_o_part){
        f_check_closed(o_part.o_mesh.a_n_pos, o_part.o_mesh.a_n_idx, 'part');
        n_mm3 += f_n_mm3(o_part.o_mesh.a_n_pos, o_part.o_mesh.a_n_idx);
        assert(o_part.o_mesh.a_n_face.includes(n_face__thread));
    }
    assert(n_mm3 < 72000 - 2 * 400 && n_mm3 > 72000 - 2 * 800, `the two holes take ${72000 - n_mm3} mm³`);
    f_check_closed(o.a_o_screw[0].o_mesh.a_n_pos, o.a_o_screw[0].o_mesh.a_n_idx, 'screw');
    // The holes are where the shapes say, the upper one's thread moved by twice the clearance.
    let o_frame = f_o_frame([0, 0, 1]);
    let a_n_origin = f_a_n_origin(o.a_o_screw[0], [0, 0, 30], [0, 0, 1]);
    assert(Math.hypot(a_n_origin[0], a_n_origin[1]) < 0.05, `the hole in the face's middle, not at ${a_n_origin}`);
    assert(f_n_mm__off_shape(o.a_o_part[0].o_mesh, a_n_origin, o_frame, true, f_o_shape__hole(8, 0.25, 12, 0.5)) < 1e-4);
    assert(f_n_mm__off_shape(o.a_o_part[1].o_mesh, a_n_origin, o_frame, false, f_o_shape__hole(8, 0.25, 12, 0)) < 1e-4);
    // On the bed: both parts on their cut faces, nothing below the bed or over another.
    let a_o_bound = [...o.a_o_part, ...o.a_o_screw].map(function(o_thing){ return f_o_bound(f_a_n_pos__moved(o_thing.o_mesh.a_n_pos, o_thing.a_n_mat4__bed)); });
    assertEquals(o.a_o_part.map(function(o_part){ return o_part.n_face__bed; }), [1, -1]);
    for(let n_a = 0; n_a < a_o_bound.length; n_a++){
        assertAlmostEquals(a_o_bound[n_a].a_n_min[2], 0, 1e-4);
        assert(a_o_bound[n_a].a_n_min[0] >= 8 - 1e-4 && a_o_bound[n_a].a_n_max[0] <= 248 + 1e-4 && a_o_bound[n_a].a_n_min[1] >= 8 - 1e-4 && a_o_bound[n_a].a_n_max[1] <= 248 + 1e-4, 'on the bed');
        for(let n_b = n_a + 1; n_b < a_o_bound.length; n_b++){
            let b_apart = [0, 1].some(function(n_k){ return a_o_bound[n_a].a_n_max[n_k] + 5.9 < a_o_bound[n_b].a_n_min[n_k] || a_o_bound[n_b].a_n_max[n_k] + 5.9 < a_o_bound[n_a].a_n_min[n_k]; });
            assert(b_apart, 'two things overlap on the bed');
        }
    }
    assertEquals(a_o_bound.map(function(o_bound){ return Number((o_bound.a_n_max[2] - o_bound.a_n_min[2]).toFixed(3)); }), [30, 30, 6.8]);
    assert(o.b_fits);
    // The parts move apart along the cut's way.
    assertEquals(o.a_o_part.map(function(o_part){ return o_part.a_n_apart; }), [[0, 0, 1], [0, 0, -1]]);
});

Deno.test('the two threads are one helix, the upper moved by what tightening takes up', function(){
    let o_object = f_o_object(f_a_n_tri__box([-20, -20, 0], [20, 20, 40]));
    let a_n_normal = [1, -2, 2].map(function(n){ return n / 3; });
    // Turned from z to the normal, around the axis across both.
    let a_n_axis = [0 * 2 - 1 * -2, 1 * 1 - 0 * 2, 0].map(function(n){ return n; });
    let n_len = Math.hypot(...a_n_axis), n_rad = Math.acos(a_n_normal[2]);
    let a_n_rot = [...a_n_axis.map(function(n){ return n / n_len * Math.sin(n_rad / 2); }), Math.cos(n_rad / 2)];
    f_a_n_normal(a_n_rot).forEach(function(n, n_k){ assertAlmostEquals(n, a_n_normal[n_k], 1e-12); });
    for(let n_deg__line_up of [0, 30]){
        let o = f_o_built(o_object, { ...o_setting__default, n_deg__line_up, n_mm__clearance: 0.2, a_o_cut: [{ a_n_trn: [1, 2, 20], a_n_rot, b_thread: true, n_mm__d: 6 }] });
        let o_joint = o.a_o_cut[0].a_o_joint[0];
        assertEquals(o_joint.n_mm__d, 6);
        let o_frame = f_o_frame(a_n_normal);
        let a_n_origin = f_a_n_origin(o.a_o_screw[0], [1, 2, 20], a_n_normal);
        let n_mm__shift = 0.4 + 2 * n_deg__line_up / 360;
        assert(f_n_mm__off_shape(o.a_o_part[0].o_mesh, a_n_origin, o_frame, true, f_o_shape__hole(6, 0.2, o_joint.a_n_mm__deep[0], n_mm__shift)) < 1e-4, 'above');
        assert(f_n_mm__off_shape(o.a_o_part[1].o_mesh, a_n_origin, o_frame, false, f_o_shape__hole(6, 0.2, o_joint.a_n_mm__deep[1], 0)) < 1e-4, 'below');
        // Both shapes seen from the cut: below, a place's angle and height are turned round.
        // Without the shift the groove of one goes on into the other's.
        for(let n_it = 0; n_it < 50; n_it++){
            let n_rad = n_tau * n_it / 50;
            let n_h = 3 + 0.37 * n_it % 2;
            let n_above = f_n_radius(f_o_shape__hole(6, 0.2, 30, 0), n_h, n_rad);
            let n_below = f_n_radius(f_o_shape__hole(6, 0.2, 30, 0), n_h, -n_rad + 0) ;
            // The thread repeats every pitch along the axis: h above is -h below.
            let n_mirror = f_n_radius(f_o_shape__hole(6, 0.2, 30, 0), -n_h + 2 * o_thread.n_mm__pitch * 3, -n_rad);
            assertAlmostEquals(n_above, n_mirror, 1e-9, 'one helix through the cut');
            assert(n_below > 0);
        }
    }
});

Deno.test('no room, too shallow, without a thread, and a diameter chosen', function(){
    // A slab 4 thick, cut across: no hole fits its 4 mm.
    let o_slab = f_o_object(f_a_n_tri__box([-30, -2, 0], [30, 2, 40]));
    let o = f_o_built(o_slab, { ...o_setting__default, a_o_cut: [f_o_cut__level(20)] });
    assertEquals([o.a_o_part.length, o.a_o_screw.length], [2, 0]);
    assert(/No room for a Ø5 thread/.test(o.a_o_cut[0].a_o_joint[0].s_why), o.a_o_cut[0].a_o_joint[0].s_why);
    // A wide plate 6 high cut in its middle: 3 each side is too shallow.
    let o_plate = f_o_object(f_a_n_tri__box([-30, -30, 0], [30, 30, 6]));
    o = f_o_built(o_plate, { ...o_setting__default, a_o_cut: [f_o_cut__level(3)] });
    assert(/Too shallow for a Ø5 thread: 1\.8 mm in the part (above|below)/.test(o.a_o_cut[0].a_o_joint[0].s_why), o.a_o_cut[0].a_o_joint[0].s_why);
    // Without a thread: parts, no hole.
    o = f_o_built(f_o_object(f_a_n_tri__box([-20, -20, 0], [20, 20, 40])), { ...o_setting__default, a_o_cut: [f_o_cut__level(20, { b_thread: false })] });
    assertEquals([o.a_o_part.length, o.a_o_screw.length, o.a_o_cut[0].a_o_joint[0].b_thread], [2, 0, false]);
    assert(!o.a_o_part[0].o_mesh.a_n_face.includes(n_face__thread));
    // Ø12 asked for, deep enough.
    o = f_o_built(f_o_object(f_a_n_tri__box([-20, -20, 0], [20, 20, 40])), { ...o_setting__default, n_mm__depth: 16, a_o_cut: [f_o_cut__level(20, { n_mm__d: 12 })] });
    assertEquals([o.a_o_screw[0].n_mm__d, o.a_o_cut[0].a_o_joint[0].a_n_mm__deep], [12, [16, 16]]);
    // A cut beside the object cuts nothing.
    o = f_o_built(o_slab, { ...o_setting__default, a_o_cut: [f_o_cut__level(50)] });
    assertEquals([o.a_o_part.length, o.a_o_cut[0].b_cut], [1, false]);
});

Deno.test('two cuts: three parts; the second hole stops before the first', function(){
    let o_object = f_o_object(f_a_n_tri__box([-20, -20, 0], [20, 20, 60]));
    let o = f_o_built(o_object, { ...o_setting__default, a_o_cut: [f_o_cut__level(20), f_o_cut__level(40)] });
    assertEquals([o.a_o_part.length, o.a_o_screw.length], [3, 2]);
    // The middle part: above the first cut, below the second.
    assertEquals(o.a_o_part.map(function(o_part){ return o_part.a_o_step.map(function(o){ return (o.n_cut + 1) * (o.n_side ? -1 : 1); }); }), [[1, 2], [1, -2], [-1]]);
    let n_middle = 1;
    for(let o_part of o.a_o_part){ f_check_closed(o_part.o_mesh.a_n_pos, o_part.o_mesh.a_n_idx, 'part'); }
    let o_second = o.a_o_cut[1].a_o_joint[0];
    // 12 deep from 20 ends at 32; from 40 down there are 8, less the wall.
    assertEquals(o.a_o_cut[0].a_o_joint[0].a_n_mm__deep, [12, 12]);
    assertAlmostEquals(o_second.a_n_mm__deep[1], 40 - 32 - 1.2, 1e-4);
    assertEquals(o_second.n_mm__d, 6, 'Ø8 needs 7.05');
    assert(f_n_mm__hole_min(8, 0.25) > o_second.a_n_mm__deep[1] && f_n_mm__hole_min(6, 0.25) <= o_second.a_n_mm__deep[1]);
    // The middle part lies on its larger face; both are as large, the first one found.
    assertEquals(Math.abs(o.a_o_part[n_middle].n_face__bed) > 0, true);
});

Deno.test('legs: a cut through two legs makes three parts and a screw for each leg', function(){
    let o_object = f_o_object(f_a_n_tri__joined(
        f_a_n_tri__box([-20, -5, 0], [-10, 5, 30.5]), f_a_n_tri__box([10, -5, 0], [20, 5, 30.5]), f_a_n_tri__box([-20, -5, 30], [20, 5, 40])
    ));
    // Three boxes overlapping: three surfaces of the object.
    assertEquals(new Set(o_object.a_n_shell).size, 3);
    let o = f_o_built(o_object, { ...o_setting__default, a_o_cut: [f_o_cut__level(15, { a_n_trn: [-15, 0, 15] })] });
    assertEquals([o.a_o_part.length, o.a_o_screw.length], [3, 2]);
    assertEquals(o.a_o_cut[0].a_o_joint.map(function(o_joint){ return [o_joint.n_mm__d, o_joint.a_n_part.length]; }), [[6, 2], [6, 2]]);
    for(let o_part of o.a_o_part){ f_check_closed(o_part.o_mesh.a_n_pos, o_part.o_mesh.a_n_idx, 'part'); }
    // The legs' holes are in the legs' middles.
    let a_n_x = o.a_o_screw.map(function(o_screw){ return Math.round(o_screw.a_n_mat4__in[12]); }).sort(function(a, b){ return a - b; });
    assertEquals(a_n_x, [-15, 15]);
});

Deno.test('colours: kept where they were, a cut face in the colour around it', function(){
    // A white block, z 0 to 25.5, and a red one on it, 25 to 40.
    let o_object = f_o_object(f_a_n_tri__joined(f_a_n_tri__box([-20, -20, 0], [20, 20, 25.5]), f_a_n_tri__box([-20, -20, 25], [20, 20, 40])),
        function(n_x, n_y, n_z){ return n_z > 25.2 ? 2 : 1; });
    // Cut in the red, the seam is red on both parts; in the white, white.
    for(let [n_z, n_fil] of [[30, 2], [10, 1]]){
        let o = f_o_built(o_object, { ...o_setting__default, a_o_cut: [f_o_cut__level(n_z)] });
        for(let o_part of o.a_o_part){
            let a_n_mm2 = f_a_n_mm2(o_part.o_mesh.a_n_pos, o_part.o_mesh.a_n_idx);
            // The object's own triangles keep their filament, what the cut made has none.
            for(let n_tri = 0; n_tri < a_n_mm2.length; n_tri++){
                assertEquals(o_part.o_mesh.a_n_fil[n_tri] > 0, o_part.o_mesh.a_n_face[n_tri] === 0);
            }
            assertEquals(f_n_fil__seam(o_part.o_mesh, a_n_mm2), n_fil, `cut at ${n_z}`);
        }
    }
    // Filaments by area: the most used first.
    let o_filament = f_o_filament(Uint8Array.from([255, 0, 0, 255, 0, 0, 250, 2, 3, 255, 255, 255, 200, 200, 255]), Float64Array.from([5, 5, 1, 4, 0.001]), 4);
    assertEquals(o_filament.a_a_n_col, [[255, 0, 0], [255, 255, 255]], 'near colours are one, a speck is none');
    assertEquals([...o_filament.a_n_fil], [1, 1, 1, 2, 2]);
    o_filament = f_o_filament(Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255]), Float64Array.from([3, 2, 1]), 2);
    assertEquals(o_filament.a_a_n_col.length, 2);
    assertEquals(f_o_filament(null, Float64Array.from([1, 2]), 4).a_n_fil, Uint8Array.from([1, 1]));
});

Deno.test('turning a direction into another, rows on the bed', function(){
    for(let a_n_from of [[0, 0, 1], [0, 0, -1], [1, 0, 0], [0.6, 0, 0.8], [1, 2, 2].map(function(n){ return n / 3; })]){
        let a_n_mat4 = f_a_n_mat4__turning(a_n_from, [0, 0, -1]);
        let a_n = f_a_n_pos__moved(Float32Array.from(a_n_from), a_n_mat4);
        [0, 0, -1].forEach(function(n, n_k){ assertAlmostEquals(a_n[n_k], n, 1e-6); });
        // A turn: no mirror, no stretch.
        let n_det = a_n_mat4[0] * (a_n_mat4[5] * a_n_mat4[10] - a_n_mat4[9] * a_n_mat4[6]) - a_n_mat4[4] * (a_n_mat4[1] * a_n_mat4[10] - a_n_mat4[9] * a_n_mat4[2]) + a_n_mat4[8] * (a_n_mat4[1] * a_n_mat4[6] - a_n_mat4[5] * a_n_mat4[2]);
        assertAlmostEquals(n_det, 1, 1e-9);
    }
    let o = f_o_layout([[100, 50], [100, 80], [100, 20], [30, 30]], 256);
    assert(o.b_fits);
    // The deepest first, a row 240 wide, the whole in the bed's middle.
    assertEquals(o.a_a_n_at, [[131, 70], [25, 70], [61, 156], [25, 156]]);
    assert(!f_o_layout([[300, 50]], 256).b_fits);
});

Deno.test('the 3MF: every part and screw an object of its own, its paint read back', async function(){
    let o_object = f_o_object(f_a_n_tri__box([-20, -20, 0], [20, 20, 40]), function(n_x){ return n_x > 19.9 ? 2 : 1; });
    let o = f_o_built(o_object, { ...o_setting__default, a_o_cut: [f_o_cut__level(20)] });
    let a_o_thing = [...o.a_o_part, ...o.a_o_screw].map(function(o_thing, n_idx){
        return { s_name: `thing ${n_idx + 1}`, ...o_thing.o_mesh, a_n_pos: f_a_n_pos__moved(o_thing.o_mesh.a_n_pos, o_thing.a_n_mat4__bed), n_fil: 1 };
    });
    let o_blob = await f_o_blob__3mf(a_o_thing, [[240, 240, 240], [200, 30, 30]]);
    let a_n_u8 = new Uint8Array(await o_blob.arrayBuffer());
    let o_read = await f_o_object__from_file({ a_n_u8, s_name: 'x.3mf' });
    assertEquals(o_read.a_s_item, ['thing 1', 'thing 2', 'thing 3']);
    for(let n_item = 0; n_item < 2; n_item++){
        let o_part = await f_o_object__from_file({ a_n_u8, s_name: 'x.3mf' }, [], null, n_item);
        let o_welded = f_o_mesh__welded(o_part.a_n_tri, o_part.a_n_col);
        f_check_closed(o_welded.a_n_pos, o_welded.a_n_idx, `part ${n_item + 1} read back`);
        // Its painted side, 40 x 20, in filament 2; the rest of it in filament 1, as are
        // its cut face and its hole.
        let a_n_mm2 = f_a_n_mm2(o_welded.a_n_pos, o_welded.a_n_idx);
        let o_n_mm2__by_col = new Map();
        for(let n_tri = 0; n_tri < a_n_mm2.length; n_tri++){
            let s_col = [...o_welded.a_n_col__tri.subarray(n_tri * 3, n_tri * 3 + 3)].join();
            o_n_mm2__by_col.set(s_col, (o_n_mm2__by_col.get(s_col) ?? 0) + a_n_mm2[n_tri]);
        }
        assertEquals(o_n_mm2__by_col.size, 2);
        assertAlmostEquals(Math.min(...o_n_mm2__by_col.values()), 800, 1e-2);
        let o_bound = f_o_bound(o_welded.a_n_pos);
        assertAlmostEquals(o_bound.a_n_min[2], 0, 1e-3, 'on the bed');
    }
    let s_config = new TextDecoder().decode(a_n_u8);
    assert(s_config.includes('model_settings.config'));
});
