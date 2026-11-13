// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The sphere: closed, with and without a relief, and only its outside moves; its wall
// is as thick as asked; a lamp saved with a depth is the same sphere.

import { assert, assertEquals, assertAlmostEquals, f_b_same, f_check_closed } from './check.js';
import { sphere_mesh, displace, sphere_r, centre_z, shell, fade_bottom } from '../sphere.module.js';
import { f_a_n_col__sphere, f_a_n_col__of_stop } from '../color.module.js';
import { f_o_setting__default, f_o_setting__of_saved } from '../kind_sphere.module.js';

let f_n_height__wave = function(n_deg__lat, n_deg__lon){
    return 0.5 + 0.5 * Math.sin(n_deg__lat / 7) * Math.cos(n_deg__lon / 11 * 3);
};

Deno.test('the smooth sphere is closed, of V3\'s size', function(){
    for(let [n_cnt__column, n_cnt__vertex] of [[64, 6338], [180, 33662]]){
        let o_sphere = sphere_mesh(n_cnt__column);
        assertEquals(o_sphere.positions.length / 3, n_cnt__vertex);
        f_check_closed(o_sphere.positions, o_sphere.indices, `${n_cnt__column} columns`);
        let n_z__top = 0, n_r__widest = 0;
        for(let n_off = 0; n_off < o_sphere.positions.length; n_off += 3){
            n_z__top = Math.max(n_z__top, o_sphere.positions[n_off + 2]);
            n_r__widest = Math.max(n_r__widest, Math.hypot(o_sphere.positions[n_off], o_sphere.positions[n_off + 1]));
        }
        assertAlmostEquals(n_z__top, centre_z + sphere_r, 1e-4);
        assertAlmostEquals(n_r__widest, sphere_r, 0.05);
    }
    assertEquals([sphere_r, shell], [50, 0.8]);
    assertAlmostEquals(fade_bottom, -19.688, 0.001);
});

Deno.test('a relief moves the outside along its radius, and nothing else', function(){
    for(let [n_cnt__column, n_mm__depth, n_deg__from] of [[64, 0.8, fade_bottom], [180, 3, -43], [180, 5, 10]]){
        let o_sphere = sphere_mesh(n_cnt__column);
        let n_cnt__offset = displace(o_sphere, f_n_height__wave, n_mm__depth, n_deg__from);
        f_check_closed(o_sphere.positions, o_sphere.indices, `${n_cnt__column} columns, ${n_mm__depth} deep`);
        let o_ring__outside = new Set(o_sphere.rows.map(function(o_row){ return o_row.ring; }));
        let n_cnt__moved = 0;
        for(let n_idx = 0; n_idx < o_sphere.heights.length; n_idx++){
            let a_n_pos = o_sphere.positions.subarray(n_idx * 3, n_idx * 3 + 3), a_n_rest = o_sphere.rest.subarray(n_idx * 3, n_idx * 3 + 3);
            let n_mm = Math.hypot(a_n_pos[0], a_n_pos[1], a_n_pos[2] - centre_z) - Math.hypot(a_n_rest[0], a_n_rest[1], a_n_rest[2] - centre_z);
            if(!o_ring__outside.has(Math.floor(n_idx / n_cnt__column))){
                // The thread, the neck, the inside and the poles.
                assert(f_b_same(a_n_pos, a_n_rest), `point ${n_idx} is not the outside's, and moved`);
                assertEquals(o_sphere.heights[n_idx], 0);
                continue;
            }
            assert(n_mm > -1e-4 && n_mm <= n_mm__depth + 1e-4, `point ${n_idx} moved ${n_mm}`);
            assertAlmostEquals(n_mm, n_mm__depth * o_sphere.heights[n_idx], 1e-3, `point ${n_idx}`);
            if(n_mm > 1e-4){ n_cnt__moved++; }
        }
        assert(n_cnt__moved > 0 && n_cnt__moved <= n_cnt__offset, `${n_cnt__moved} moved of ${n_cnt__offset} offset`);
        // Below where the relief starts, and at the top, the sphere stays smooth.
        for(let { ring: n_ring, lat: n_deg__lat } of o_sphere.rows){
            if(n_deg__lat > n_deg__from && n_deg__lat < 80){ continue; }
            assert(f_b_same(o_sphere.positions.subarray(n_ring * n_cnt__column * 3, (n_ring + 1) * n_cnt__column * 3), o_sphere.rest.subarray(n_ring * n_cnt__column * 3, (n_ring + 1) * n_cnt__column * 3)),
                `the ring at latitude ${n_deg__lat} moved`);
        }
        // A relief of nothing puts every point back.
        displace(o_sphere, function(){ return 0; }, n_mm__depth, n_deg__from);
        assert(f_b_same(o_sphere.positions, o_sphere.rest));
    }
});

Deno.test('the smooth sphere\'s wall is as thick as asked: the inside moves, the outside and the neck stay', function(){
    let o_default = sphere_mesh(180);
    assertEquals(o_default.shell, 0.8);
    assert(f_b_same(sphere_mesh(180, 0.8).positions, o_default.positions), 'V3\'s shell asked for by its number is another sphere');
    let n_cnt__outside = (o_default.rows[o_default.rows.length - 1].ring + 1) * 180;
    for(let n_mm__wall of [0.4, 0.5, 1.2, 2]){
        let o_sphere = sphere_mesh(180, n_mm__wall);
        f_check_closed(o_sphere.positions, o_sphere.indices, `a wall of ${n_mm__wall}`);
        assertEquals([o_sphere.shell, o_sphere.positions.length, [...o_sphere.indices]], [n_mm__wall, o_default.positions.length, [...o_default.indices]]);
        // The thread and the outside, up to the pole.
        assert(f_b_same(o_sphere.positions.subarray(0, n_cnt__outside * 3), o_default.positions.subarray(0, n_cnt__outside * 3)), `a wall of ${n_mm__wall} moved the outside`);
        // The inside: a sphere that much smaller, down to where it meets the bore's cone.
        let n_cnt__inside = 0;
        let n_z__cone = Infinity;
        for(let n_idx = n_cnt__outside; n_idx < o_sphere.positions.length / 3; n_idx++){
            let [n_x, n_y, n_z] = o_sphere.positions.subarray(n_idx * 3, n_idx * 3 + 3);
            let n_r = Math.hypot(n_x, n_y);
            if(Math.abs(n_r - 31.5) < 1e-3){
                // The bore's two rings.
                n_z__cone = Math.min(n_z__cone, n_z > 0 ? n_z : Infinity);
                continue;
            }
            if(n_r < 1e-6 && n_z > centre_z + sphere_r - 1e-3){ continue; }
            assertAlmostEquals(Math.hypot(n_x, n_y, n_z - centre_z), sphere_r - n_mm__wall, 1e-3, `the inside at ${n_x}, ${n_y}, ${n_z}`);
            n_cnt__inside++;
        }
        assert(n_cnt__inside > 180 * 60, `${n_cnt__inside} points inside`);
        // The cone from the bore up to the inside leans 45 degrees, as the outside's from the thread
        // does: the wall between the two is as thick as the sphere's.
        let n_z__inside_start = centre_z - (sphere_r - n_mm__wall) * Math.SQRT1_2, n_r__inside_start = (sphere_r - n_mm__wall) * Math.SQRT1_2;
        assertAlmostEquals(n_z__inside_start - n_z__cone, n_r__inside_start - 31.5, 1e-3, 'the cone\'s lean');
        // A thinner wall lets the cone start lower, inside the thread's top turn: between it and the
        // thread's root, 32.7 from the axis at z = 4, the wall is no thinner than the sphere's.
        assertAlmostEquals((32.7 - (31.5 + 4 - n_z__cone)) * Math.SQRT1_2, n_mm__wall, 1e-3, 'the wall at the thread\'s root');
        assert(n_z__cone > 3, `the cone starts at ${n_z__cone}`);
    }
});

Deno.test('a lamp saved with a depth opens as the same sphere, a new one has a lithophane\'s wall', function(){
    let o_new = f_o_setting__default();
    assertEquals([o_new.n_mm__wall_min, o_new.n_mm__wall_max, o_new.n_mm__depth], [0.5, 3.2, undefined]);
    // As saved by the app before: the wall was 0.8, and the depth more where white.
    for(let [n_mm__depth, n_mm__wall_max] of [[3, 3.8], [0.8, 1.6], [2.1, 2.9], [3.2, 4], [0.2, 1], [5, 5.8]]){
        let o_saved = { s_template: 'texture', s_code: 'void mainImage(){}', n_gamma: 1.34, n_mm__depth, n_deg__relief_from: -43, n_cnt__column: 720, b_texture: true };
        let o_setting = f_o_setting__of_saved(o_saved);
        assertEquals([o_setting.n_mm__wall_min, o_setting.n_mm__wall_max, 'n_mm__depth' in o_setting], [0.8, n_mm__wall_max, false], `a depth of ${n_mm__depth}`);
        assertEquals([o_setting.n_gamma, o_setting.n_deg__relief_from, o_setting.b_texture, o_setting.n_seed], [1.34, -43, true, o_new.n_seed], 'what else it had, and what it had not');
        assertEquals(o_saved.n_mm__depth, n_mm__depth, 'the saved lamp itself was changed');
        // The relief it had, to the last bit of a point's place.
        let o_before = sphere_mesh(64), o_now = sphere_mesh(64, o_setting.n_mm__wall_min);
        displace(o_before, f_n_height__wave, n_mm__depth, -43);
        displace(o_now, f_n_height__wave, o_setting.n_mm__wall_max - o_setting.n_mm__wall_min, -43);
        assert(f_b_same(o_now.positions, o_before.positions), `a depth of ${n_mm__depth} is another sphere now`);
    }
    // Saved the new way, it is as saved; opened twice, it is the same.
    let o_saved = { ...o_new, n_mm__wall_min: 0.6, n_mm__wall_max: 2.4 };
    assertEquals(f_o_setting__of_saved(o_saved), o_saved);
    assertEquals(f_o_setting__of_saved(f_o_setting__of_saved({ n_mm__depth: 3 })), f_o_setting__of_saved({ n_mm__depth: 3 }));
});

Deno.test('the colours follow the stops', function(){
    let a_o_stop = [{ n_t: 0, a_n_col: [0, 0, 0] }, { n_t: 0.5, a_n_col: [100, 200, 50] }, { n_t: 0.5, a_n_col: [255, 0, 0] }, { n_t: 1, a_n_col: [255, 255, 255] }];
    assertEquals(f_a_n_col__of_stop(a_o_stop, 0.25), [50, 100, 25]);
    assertEquals(f_a_n_col__of_stop(a_o_stop, 0.75), [255, 128, 128]);
    assertEquals(f_a_n_col__of_stop(a_o_stop.slice(1, 3), 0), [100, 200, 50], 'below the first stop');
    assertEquals(f_a_n_col__of_stop(a_o_stop.slice(0, 2), 1), [100, 200, 50], 'above the last stop');
    assertEquals([...f_a_n_col__sphere(new Float32Array([0, 1, 0.25]), a_o_stop)], [0, 0, 0, 255, 255, 255, 50, 100, 25]);
});
