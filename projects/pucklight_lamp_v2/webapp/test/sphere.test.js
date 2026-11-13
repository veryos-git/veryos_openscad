// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The sphere: closed, with and without a relief, and only its outside moves.

import { assert, assertEquals, assertAlmostEquals, f_b_same, f_check_closed } from './check.js';
import { sphere_mesh, displace, sphere_r, centre_z, shell, fade_bottom } from '../sphere.module.js';
import { f_a_n_col__sphere, f_a_n_col__of_stop } from '../color.module.js';

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

Deno.test('the colours follow the stops', function(){
    let a_o_stop = [{ n_t: 0, a_n_col: [0, 0, 0] }, { n_t: 0.5, a_n_col: [100, 200, 50] }, { n_t: 0.5, a_n_col: [255, 0, 0] }, { n_t: 1, a_n_col: [255, 255, 255] }];
    assertEquals(f_a_n_col__of_stop(a_o_stop, 0.25), [50, 100, 25]);
    assertEquals(f_a_n_col__of_stop(a_o_stop, 0.75), [255, 128, 128]);
    assertEquals(f_a_n_col__of_stop(a_o_stop.slice(1, 3), 0), [100, 200, 50], 'below the first stop');
    assertEquals(f_a_n_col__of_stop(a_o_stop.slice(0, 2), 1), [100, 200, 50], 'above the last stop');
    assertEquals([...f_a_n_col__sphere(new Float32Array([0, 1, 0.25]), a_o_stop)], [0, 0, 0, 255, 255, 255, 50, 100, 25]);
});
