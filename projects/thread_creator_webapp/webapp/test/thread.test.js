// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The thread: its shape against the formula and against fdm_optimized_screws.scad, the
// hole and the screw as meshes, the screw in its hole, and how deep a hole can go.

import { assert, assertEquals, assertAlmostEquals, f_check_closed, f_n_mm3, f_s_path, f_b_openscad } from './check.js';
import {
    o_thread, f_n_mm__ridge, f_n_radius, f_a_n_rz__column, f_n_mm__hole_r, f_n_mm__hole_end, f_n_mm__hole_min, f_n_mm__reach, f_n_mm__screw,
    f_o_shape__hole, f_o_shape__rod, f_o_mesh__hole, f_o_mesh__rod, f_o_mesh__screw, f_n_mm__free
} from '../thread.module.js';
import { f_o_mesh__welded, f_o_bound, f_o_frame } from '../cut.module.js';
import { f_a_n_tri__box, f_a_n_tri__ball } from './shape.js';

let n_tau = Math.PI * 2;

// The volume inside a shape, by its radius at many heights and angles.
let f_n_mm3__of_shape = function(o_shape, n_z__to){
    let n_cnt__z = 4000, n_cnt__rad = 360;
    let n_sum = 0;
    for(let n_i = 0; n_i < n_cnt__z; n_i++){
        for(let n_j = 0; n_j < n_cnt__rad; n_j++){
            let n_r = f_n_radius(o_shape, (n_i + 0.5) * n_z__to / n_cnt__z, (n_j + 0.5) * n_tau / n_cnt__rad);
            n_sum += n_r * n_r / 2;
        }
    }
    return n_sum * (n_z__to / n_cnt__z) * (n_tau / n_cnt__rad);
};
// A mesh of 64 flat sides has this share of the round shape's volume.
let n_nor__faceted = o_thread.n_cnt__column / n_tau * Math.sin(n_tau / o_thread.n_cnt__column);

// A hole's mesh closed by a disc over its mouth, so that it is the space the hole takes.
let f_o_closed = function(o_hole){
    let a_n_pos = [...o_hole.a_n_pos, 0, 0, 0];
    let n_middle = a_n_pos.length / 3 - 1;
    // Turned round: a hole looks inwards.
    let a_n_idx = [];
    for(let n_off = 0; n_off < o_hole.a_n_idx.length; n_off += 3){ a_n_idx.push(o_hole.a_n_idx[n_off], o_hole.a_n_idx[n_off + 2], o_hole.a_n_idx[n_off + 1]); }
    o_hole.a_n_rim.forEach(function(n_point, n_it){ a_n_idx.push(n_middle, o_hole.a_n_rim[(n_it + 1) % o_hole.a_n_rim.length], n_point); });
    return { a_n_pos, a_n_idx };
};

Deno.test('the ridge: 0.8 high, a crest 0.2 wide, flanks at 45 degrees, every 2 mm', function(){
    assertEquals([0, 0.1, -0.1, 2, 4.05].map(function(n){ return Number(f_n_mm__ridge(n).toFixed(9)); }), [0.8, 0.8, 0.8, 0.8, 0.8]);
    assertEquals([0.9, 1, 1.1, -0.9, 2.9].map(function(n){ return Number(f_n_mm__ridge(n).toFixed(9)); }), [0, 0, 0, 0, 0]);
    assertAlmostEquals(f_n_mm__ridge(0.5), 0.4, 1e-12);
    assertAlmostEquals(f_n_mm__ridge(0.3) - f_n_mm__ridge(0.4), 0.1, 1e-12, '45 degrees');
    // Right-handed: a quarter turn on, the ridge is a quarter of the pitch higher.
    let o_rod = { n_r: 4, n_shift: 0, a_o_floor: [], a_o_roof: [] };
    assertAlmostEquals(f_n_radius(o_rod, 0.5, n_tau / 4), 4, 1e-12);
    assertAlmostEquals(f_n_radius(o_rod, 1.5, n_tau / 4), 3.2, 1e-12);
});

Deno.test('an outline is the shape at its angle: straight between the points where it bends', function(){
    for(let [o_shape, n_z__to] of [
        [f_o_shape__hole(8, 0.25, 12, 0.2), 12], [f_o_shape__hole(5, 0.25, 4.9), 4.9], [f_o_shape__hole(16, 0.4, 30, 1.3), 30],
        [f_o_shape__rod(8, 21.5), 21.5], [f_o_shape__rod(5, 9), 9]
    ]){
        for(let n_column = 0; n_column < 64; n_column += 3){
            let n_rad = n_tau * n_column / 64;
            let a_n_rz = f_a_n_rz__column(o_shape, n_z__to, n_rad);
            assertEquals([a_n_rz[1], a_n_rz.at(-1)], [0, n_z__to], 'from the face to the end');
            let n_worst = 0;
            for(let n_off = 0; n_off < a_n_rz.length - 2; n_off += 2){
                assert(a_n_rz[n_off + 3] > a_n_rz[n_off + 1], 'upwards');
                for(let n_t of [0.25, 0.5, 0.75]){
                    let n_z = a_n_rz[n_off + 1] + n_t * (a_n_rz[n_off + 3] - a_n_rz[n_off + 1]);
                    n_worst = Math.max(n_worst, Math.abs(a_n_rz[n_off] + n_t * (a_n_rz[n_off + 2] - a_n_rz[n_off]) - f_n_radius(o_shape, n_z, n_rad)));
                }
            }
            assert(n_worst < 1e-9, `off the shape by ${n_worst}`);
            // No more points than the shape has bends: four a turn and a few at the ends.
            assert(a_n_rz.length / 2 <= 4 * n_z__to / o_thread.n_mm__pitch + 8, `${a_n_rz.length / 2} points`);
        }
    }
});

Deno.test('a hole: 45 degrees in, the thread, closed at 45 degrees to a flat', function(){
    assertEquals([f_n_mm__hole_r(8, 0.25), f_n_mm__hole_end(8, 0.25), f_n_mm__hole_end(5, 0.25).toFixed(6), f_n_mm__hole_min(8, 0.25)], [4.25, 2.25, '0.800000', 7.05]);
    let o_shape = f_o_shape__hole(8, 0.25, 12);
    // At the face a circle; 0.8 in, the thread's root where there is no ridge.
    for(let n_rad of [0, 1, 2, 3, 4, 5, 6]){
        assertAlmostEquals(f_n_radius(o_shape, 0, n_rad), 4.25, 1e-12);
        assertAlmostEquals(f_n_radius(o_shape, 12, n_rad), 2, 1e-12);
        assertAlmostEquals(f_n_radius(o_shape, 11, n_rad), Math.min(3, 3.45 + f_n_mm__ridge(11 - 2 * n_rad / n_tau)), 1e-12, 'the end');
    }
    assertAlmostEquals(f_n_radius(o_shape, 0.4, n_tau * 0.7), 3.85, 1e-12, 'the lead-in');
    let o_hole = f_o_mesh__hole(8, 0.25, 12);
    assertEquals(o_hole.a_n_rim.length, 64);
    o_hole.a_n_rim.forEach(function(n_point, n_it){
        assertAlmostEquals(o_hole.a_n_pos[n_point * 3], 4.25 * Math.cos(n_tau * n_it / 64), 1e-12);
        assertAlmostEquals(o_hole.a_n_pos[n_point * 3 + 1], 4.25 * Math.sin(n_tau * n_it / 64), 1e-12);
        assertEquals(o_hole.a_n_pos[n_point * 3 + 2], 0);
    });
    let o_closed = f_o_closed(o_hole);
    f_check_closed(o_closed.a_n_pos, o_closed.a_n_idx, 'hole');
    assertAlmostEquals(f_n_mm3(o_closed.a_n_pos, o_closed.a_n_idx), n_nor__faceted * f_n_mm3__of_shape(o_shape, 12), 0.002 * 500, 'the space it takes');
    let o_bound = f_o_bound(o_hole.a_n_pos);
    assertEquals([o_bound.a_n_min[2], o_bound.a_n_max[2]], [0, 12]);
    // Looking inwards, the mesh alone has a volume below 0.
    assert(f_n_mm3(o_closed.a_n_pos, [...o_hole.a_n_idx]) < 0);
    // The smallest: a hole no deeper than its lead-in, two turns and its end.
    let o_small = f_o_closed(f_o_mesh__hole(5, 0.25, f_n_mm__hole_min(5, 0.25)));
    f_check_closed(o_small.a_n_pos, o_small.a_n_idx, 'smallest hole');
});

Deno.test('a screw: a rod chamfered at both ends, lying on the flat cut off its underside', function(){
    let o_shape = f_o_shape__rod(8, 20);
    let o_rod = f_o_mesh__rod(8, 20);
    f_check_closed(o_rod.a_n_pos, o_rod.a_n_idx, 'rod');
    assertAlmostEquals(f_n_mm3(o_rod.a_n_pos, o_rod.a_n_idx), n_nor__faceted * f_n_mm3__of_shape(o_shape, 20), 0.002 * 800);
    assertAlmostEquals(f_n_radius(o_shape, 0, 1), 3, 1e-12);
    assertAlmostEquals(f_n_radius(o_shape, 20, 2), 3, 1e-12);
    for(let [n_mm__d, n_mm__length] of [[8, 20], [5, 8.6], [16, 40]]){
        let o_screw = f_o_mesh__screw(n_mm__d, n_mm__length);
        f_check_closed(o_screw.a_n_pos, o_screw.a_n_idx, `screw ${n_mm__d}`);
        let o_bound = f_o_bound(o_screw.a_n_pos);
        assertAlmostEquals(o_bound.a_n_min[0], -n_mm__length / 2, 1e-5);
        assertAlmostEquals(o_bound.a_n_max[0], n_mm__length / 2, 1e-5);
        assertAlmostEquals(o_bound.a_n_min[2], 0, 1e-6, 'stands on the bed');
        assertAlmostEquals(o_bound.a_n_max[2], 0.85 * n_mm__d, 1e-5, '0.15 of its diameter is cut off');
        let n_mm3 = f_n_mm3(o_screw.a_n_pos, o_screw.a_n_idx), n_mm3__rod = f_n_mm3(f_o_mesh__rod(n_mm__d, n_mm__length).a_n_pos, f_o_mesh__rod(n_mm__d, n_mm__length).a_n_idx);
        assert(n_mm3 < n_mm3__rod && n_mm3 > 0.9 * n_mm3__rod, `${n_mm3} of ${n_mm3__rod}`);
        // What lies on the bed: more than the crests alone once the cut reaches the root.
        let n_mm2 = 0;
        for(let n_off = 0; n_off < o_screw.a_n_idx.length; n_off += 3){
            let [a, b, c] = [0, 1, 2].map(function(n_k){ return o_screw.a_n_idx[n_off + n_k] * 3; });
            let p = o_screw.a_n_pos;
            if(p[a + 2] < 1e-6 && p[b + 2] < 1e-6 && p[c + 2] < 1e-6){ n_mm2 += 0.5 * Math.abs((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])); }
        }
        assert(n_mm2 > 0.25 * n_mm__d * n_mm__length, `${n_mm2} mm² on the bed`);
    }
});

Deno.test('the screw in its hole: 0.25 of air all around, and its end stops in the hole\'s end', function(){
    for(let n_mm__d of o_thread.a_n_mm__d){
        let n_mm__clearance = 0.25, n_mm__deep = f_n_mm__hole_min(n_mm__d, n_mm__clearance) + 3;
        let n_mm__reach = f_n_mm__reach(n_mm__d, n_mm__clearance, n_mm__deep);
        let n_mm__length = f_n_mm__screw(n_mm__d, n_mm__clearance, n_mm__deep, n_mm__deep);
        assertAlmostEquals(n_mm__length, 2 * n_mm__reach - 1, 1e-12, 'a screw is 1 shorter than its holes take');
        // The screw as far in as it goes: its end at the reach. Its ridge is where the
        // hole's thread is, so the hole's thread is moved as the screw's is.
        let o_rod = f_o_shape__rod(n_mm__d, n_mm__length);
        let n_z__rod = n_mm__reach - n_mm__length;
        let o_hole = f_o_shape__hole(n_mm__d, n_mm__clearance, n_mm__deep, n_z__rod);
        let n_least = Infinity, n_least__thread = Infinity;
        for(let n_i = 0; n_i <= 600; n_i++){
            let n_z = n_mm__reach * n_i / 600;
            for(let n_j = 0; n_j < 90; n_j++){
                let n_rad = n_tau * n_j / 90;
                let n_gap = f_n_radius(o_hole, n_z, n_rad) - f_n_radius(o_rod, n_z - n_z__rod, n_rad);
                n_least = Math.min(n_least, n_gap);
                if(n_z > 1 && n_z < n_mm__deep - f_n_mm__hole_end(n_mm__d, n_mm__clearance) - 1.5){ n_least__thread = Math.min(n_least__thread, n_gap); }
            }
        }
        assert(n_least > -1e-9, `Ø${n_mm__d}: the screw is ${-n_least} into the hole's wall`);
        assertAlmostEquals(n_least__thread, n_mm__clearance, 1e-9, `Ø${n_mm__d}: clearance along the thread`);
        // A small hole's end is shorter than the screw's chamfer: the screw stands on its flat.
        if(f_n_mm__hole_end(n_mm__d, n_mm__clearance) < n_mm__clearance + o_thread.n_mm__chamfer){
            assertEquals(n_mm__reach, n_mm__deep, `Ø${n_mm__d}: to the hole's flat`);
            continue;
        }
        assert(n_least < 0.02, `Ø${n_mm__d}: the screw's end is ${n_least} short of the hole's end`);
        // A hair further in, it would be in the wall.
        let n_worse = Infinity;
        for(let n_j = 0; n_j < 90; n_j++){
            for(let n_i = 0; n_i <= 100; n_i++){
                let n_z = n_mm__reach + 0.05 - 2 * n_i / 100;
                n_worse = Math.min(n_worse, f_n_radius(f_o_shape__hole(n_mm__d, n_mm__clearance, n_mm__deep, n_z__rod + 0.05), n_z, n_tau * n_j / 90) - f_n_radius(o_rod, n_z - n_z__rod - 0.05, n_tau * n_j / 90));
            }
        }
        assert(n_worse < 0, `Ø${n_mm__d}: 0.05 further in it still fits, by ${n_worse}`);
    }
});

Deno.test({ name: 'the rod and the hole against fdm_optimized_screws.scad, in OpenSCAD', ignore: !await f_b_openscad(), fn: async function(){
    let s_dir = await Deno.makeTempDir();
    let f_a_n_tri = async function(s_part){
        let o_output = await new Deno.Command('openscad', { args: ['-o', `${s_dir}/${s_part}.stl`, '-D', `part="${s_part}"`, f_s_path('test/thread_reference.scad')], stdout: 'null', stderr: 'piped' }).output();
        assert(o_output.success, new TextDecoder().decode(o_output.stderr));
        let a_n = [];
        for(let a_s of (await Deno.readTextFile(`${s_dir}/${s_part}.stl`)).matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)){ a_n.push(Number(a_s[1]), Number(a_s[2]), Number(a_s[3])); }
        return Float32Array.from(a_n);
    };
    try{
        for(let [s_part, o_shape, n_z__to, o_mine] of [
            ['rod', f_o_shape__rod(8, 20), 20, f_o_mesh__rod(8, 20)],
            ['hole', f_o_shape__hole(8, 0.25, 12), 12, f_o_closed(f_o_mesh__hole(8, 0.25, 12))]
        ]){
            let a_n_tri = await f_a_n_tri(s_part);
            let o_theirs = f_o_mesh__welded(a_n_tri);
            // Every point of OpenSCAD's mesh is on the shape, or inside it by the 0.01 that
            // the .scad file lets its parts overlap: its faces' corners are not at this
            // app's angles, but on the same surface.
            let n_worst = 0;
            for(let n_off = 0; n_off < o_theirs.a_n_pos.length; n_off += 3){
                let n_x = o_theirs.a_n_pos[n_off], n_y = o_theirs.a_n_pos[n_off + 1], n_z = o_theirs.a_n_pos[n_off + 2];
                let n_r = Math.hypot(n_x, n_y);
                // A point of an end's disc lies anywhere inside.
                if(n_r < 1e-6){ continue; }
                let n_rad = Math.atan2(n_y, n_x);
                n_worst = Math.max(n_worst, Math.abs(n_r - f_n_radius(o_shape, Math.max(0, Math.min(n_z__to, n_z)), n_rad)));
            }
            assert(n_worst < 0.012, `${s_part}: a point of OpenSCAD's is ${n_worst} off this app's shape`);
            let n_mm3__theirs = f_n_mm3(o_theirs.a_n_pos, o_theirs.a_n_idx), n_mm3__mine = f_n_mm3(o_mine.a_n_pos, o_mine.a_n_idx);
            assertAlmostEquals(n_mm3__mine, n_mm3__theirs, 0.003 * n_mm3__theirs, `${s_part}: volume`);
            console.log(`    ${s_part}: OpenSCAD's points at most ${n_worst.toFixed(4)} mm off, volume ${n_mm3__mine.toFixed(1)} against ${n_mm3__theirs.toFixed(1)} mm³`);
        }
    } finally {
        await Deno.remove(s_dir, { recursive: true });
    }
} });

Deno.test('how deep a hole can go: to the nearest surface within its radius', function(){
    let f_o_mesh = function(a_n_tri){
        let o = f_o_mesh__welded(a_n_tri);
        return { a_n_pos: o.a_n_pos, a_n_idx: o.a_n_idx };
    };
    let f_b_none = function(){ return false; };
    // Into a box from its top, the face left out: down to its bottom.
    let o_box = f_o_mesh(f_a_n_tri__box([0, 0, 0], [20, 20, 30]));
    let o_frame = f_o_frame([0, 0, -1]);
    let f_b_top = function(n_tri){ return [0, 1, 2].every(function(n_k){ return o_box.a_n_pos[o_box.a_n_idx[n_tri * 3 + n_k] * 3 + 2] === 30; }); };
    assertAlmostEquals(f_n_mm__free(o_box, f_b_top, [10, 10, 30], o_frame.a_n_u, o_frame.a_n_v, o_frame.a_n_w, 5), 30, 1e-9);
    assertAlmostEquals(f_n_mm__free(o_box, f_b_top, [10, 10, 30], o_frame.a_n_u, o_frame.a_n_v, o_frame.a_n_w, 9.99), 30, 1e-9);
    // Wider than the box, or too near a wall: the wall begins at the face.
    assertAlmostEquals(f_n_mm__free(o_box, f_b_top, [10, 10, 30], o_frame.a_n_u, o_frame.a_n_v, o_frame.a_n_w, 10.01), 0, 1e-9);
    assertAlmostEquals(f_n_mm__free(o_box, f_b_top, [3, 10, 30], o_frame.a_n_u, o_frame.a_n_v, o_frame.a_n_w, 5), 0, 1e-9);
    assertEquals(f_n_mm__free(o_box, f_b_top, [50, 10, 30], o_frame.a_n_u, o_frame.a_n_v, o_frame.a_n_w, 5), Infinity, 'beside the box: nothing in the way');
    // Into a ball from its middle: to where a cylinder of the radius meets the sphere.
    let o_ball = f_o_mesh(f_a_n_tri__ball(20, [0, 0, 0], 96));
    o_frame = f_o_frame([0, 0, 1]);
    for(let n_r of [2, 5.85, 12]){
        let n_mm = f_n_mm__free(o_ball, function(n_tri){ return [0, 1, 2].every(function(n_k){ return o_ball.a_n_pos[o_ball.a_n_idx[n_tri * 3 + n_k] * 3 + 2] < 0; }); }, [0, 0, 0], o_frame.a_n_u, o_frame.a_n_v, o_frame.a_n_w, n_r);
        assertAlmostEquals(n_mm, Math.sqrt(400 - n_r * n_r), 0.02, `radius ${n_r}`);
        assert(n_mm <= Math.sqrt(400 - n_r * n_r) + 1e-9, 'never deeper than the round ball allows');
    }
    // A roof that slopes over the hole: lowest where the hole's edge is under its low side.
    let o_roof = { a_n_pos: Float32Array.from([-50, -50, 10, 50, -50, 20, 0, 80, 15 + 80 * 0]), a_n_idx: Uint32Array.from([0, 1, 2]) };
    // Its height is 15 + 0.1 x where y is -50; the third corner keeps that slope.
    o_roof.a_n_pos[8] = 15;
    assertAlmostEquals(f_n_mm__free(o_roof, f_b_none, [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], 5), 14.5, 1e-9);
    // A wall that stands beside the axis, 3 away, from 7 up: met at 7 by a hole of radius 5, missed by one of 2.
    let o_wall = { a_n_pos: Float32Array.from([3, -40, 7, 3, 40, 7, 3, 0, 60]), a_n_idx: Uint32Array.from([0, 1, 2]) };
    assertAlmostEquals(f_n_mm__free(o_wall, f_b_none, [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], 5), 7, 1e-9);
    assertEquals(f_n_mm__free(o_wall, f_b_none, [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], 2), Infinity);
});
