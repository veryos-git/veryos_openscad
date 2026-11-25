// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Loops, polygons and the triangles that fill them.

import { assert, assertEquals, assertAlmostEquals } from './check.js';
import { f_n_mm2__loop, f_b_in_loop, f_n_mm__to_loop, f_o_loop, f_a_o_polygon, f_a_n_idx__ears, f_a_n_idx__of_polygons } from '../polygon.module.js';

// The same numbers every run.
let f_f_n_random = function(n_seed){
    return function(){
        n_seed = (Math.imul(n_seed, 1664525) + 1013904223) >>> 0;
        return n_seed / 4294967296;
    };
};

// Triangles fill a polygon: they cover its area, none is turned round, each edge of
// the polygon is an edge of one triangle, and each other edge is shared by two.
let f_check_filled = function(a_n_idx, a_n_outer, a_a_n_hole, a_n_xy, s_label, n_mm2__zero_max = 0){
    let n_cnt__point = a_n_xy.length / 2;
    let n_mm2 = 0, n_cnt__zero = 0;
    let o_edge = new Set();
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let n_one = f_n_mm2__loop([a_n_idx[n_off], a_n_idx[n_off + 1], a_n_idx[n_off + 2]], a_n_xy);
        assert(n_one >= -1e-9, `${s_label}: a triangle is turned round, ${n_one}`);
        if(n_one <= 1e-12){ n_cnt__zero++; }
        n_mm2 += n_one;
        for(let n_k = 0; n_k < 3; n_k++){
            let n_key = a_n_idx[n_off + n_k] * n_cnt__point + a_n_idx[n_off + (n_k + 1) % 3];
            assert(!o_edge.has(n_key), `${s_label}: an edge is used twice in one direction`);
            o_edge.add(n_key);
        }
    }
    let n_mm2__wanted = f_n_mm2__loop(a_n_outer, a_n_xy) + a_a_n_hole.reduce(function(n_sum, a_n_hole){ return n_sum + f_n_mm2__loop(a_n_hole, a_n_xy); }, 0);
    assertAlmostEquals(n_mm2, n_mm2__wanted, 1e-6 * Math.max(1, n_mm2__wanted), `${s_label}: area`);
    let o_edge__own = new Set();
    for(let a_n_loop of [a_n_outer, ...a_a_n_hole]){
        for(let n_it = 0; n_it < a_n_loop.length; n_it++){ o_edge__own.add(a_n_loop[n_it] * n_cnt__point + a_n_loop[(n_it + 1) % a_n_loop.length]); }
    }
    for(let n_key of o_edge__own){ assert(o_edge.has(n_key), `${s_label}: an edge of the polygon has no triangle`); }
    for(let n_key of o_edge){
        let n_a = Math.floor(n_key / n_cnt__point), n_b = n_key - n_a * n_cnt__point;
        assert(o_edge__own.has(n_key) || o_edge.has(n_b * n_cnt__point + n_a), `${s_label}: an inner edge has one triangle only`);
    }
    assert(n_cnt__zero <= n_mm2__zero_max, `${s_label}: ${n_cnt__zero} triangles without area`);
    let n_cnt = a_n_outer.length + a_a_n_hole.reduce(function(n_sum, a_n_hole){ return n_sum + a_n_hole.length + 2; }, 0) - 2;
    assertEquals(a_n_idx.length / 3, n_cnt, `${s_label}: as many triangles as a polygon of these points has`);
};

// A loop around a middle, its radius changing with the angle.
let f_add_loop = function(a_n_xy, n_cx, n_cy, n_cnt, f_n_r, b_clockwise = false){
    let n_first = a_n_xy.length / 2;
    for(let n_it = 0; n_it < n_cnt; n_it++){
        let n_rad = 2 * Math.PI * n_it / n_cnt * (b_clockwise ? -1 : 1);
        let n_r = f_n_r(n_rad, n_it);
        a_n_xy.push(n_cx + n_r * Math.cos(n_rad), n_cy + n_r * Math.sin(n_rad));
    }
    return Array.from({ length: n_cnt }, function(v, n_it){ return n_first + n_it; });
};

Deno.test('ears: a square, an L, a comb, a circle', function(){
    let a_n_xy = [0, 0, 10, 0, 10, 10, 0, 10];
    f_check_filled(f_a_n_idx__ears([0, 1, 2, 3], [], a_n_xy), [0, 1, 2, 3], [], a_n_xy, 'square');
    a_n_xy = [0, 0, 10, 0, 10, 4, 4, 4, 4, 10, 0, 10];
    f_check_filled(f_a_n_idx__ears([0, 1, 2, 3, 4, 5], [], a_n_xy), [0, 1, 2, 3, 4, 5], [], a_n_xy, 'L');
    // A comb: teeth up from a back, every corner a right angle, many points in a line.
    a_n_xy = [0, 0];
    for(let n_it = 0; n_it < 12; n_it++){ a_n_xy.push(n_it + 1, 0); }
    for(let n_it = 11; n_it >= 0; n_it--){ a_n_xy.push(n_it + 1, n_it % 2 ? 1 : 5, n_it, n_it % 2 ? 1 : 5); }
    let a_n_comb = Array.from({ length: a_n_xy.length / 2 }, function(v, n){ return n; });
    f_check_filled(f_a_n_idx__ears(a_n_comb, [], a_n_xy), a_n_comb, [], a_n_xy, 'comb');
    a_n_xy = [];
    let a_n_circle = f_add_loop(a_n_xy, 3, 4, 500, function(){ return 20; });
    f_check_filled(f_a_n_idx__ears(a_n_circle, [], a_n_xy), a_n_circle, [], a_n_xy, 'circle');
});

Deno.test('ears: holes, one and many, round and jagged', function(){
    let a_n_xy = [];
    let a_n_outer = f_add_loop(a_n_xy, 0, 0, 64, function(){ return 30; });
    let a_n_hole = f_add_loop(a_n_xy, 0, 0, 72, function(){ return 4.25; }, true);
    f_check_filled(f_a_n_idx__ears(a_n_outer, [a_n_hole], a_n_xy), a_n_outer, [a_n_hole], a_n_xy, 'ring');

    let f_n_random = f_f_n_random(7);
    for(let n_run = 0; n_run < 60; n_run++){
        a_n_xy = [];
        let n_cnt = 8 + Math.floor(f_n_random() * 120);
        let n_wave = Math.floor(f_n_random() * 7), n_deep = f_n_random() * 0.6;
        a_n_outer = f_add_loop(a_n_xy, 0, 0, n_cnt, function(n_rad){ return 100 * (1 + n_deep * Math.sin(n_wave * n_rad)) * (0.9 + 0.2 * f_n_random()); });
        // Holes on a ring well inside, apart from one another.
        let n_cnt__hole = Math.floor(f_n_random() * 6);
        let a_a_n_hole = [];
        for(let n_it = 0; n_it < n_cnt__hole; n_it++){
            let n_rad = 2 * Math.PI * (n_it + f_n_random() * 0.3) / n_cnt__hole;
            let n_far = n_cnt__hole === 1 ? 0 : 18;
            a_a_n_hole.push(f_add_loop(a_n_xy, n_far * Math.cos(n_rad), n_far * Math.sin(n_rad), 3 + Math.floor(f_n_random() * 40), function(){ return 2 + 5 * f_n_random(); }, true));
        }
        f_check_filled(f_a_n_idx__ears(a_n_outer, a_a_n_hole, a_n_xy), a_n_outer, a_a_n_hole, a_n_xy, `run ${n_run}`);
    }
});

Deno.test('ears: a hole in a square of many points in a line, as a cut through a box leaves it', function(){
    let a_n_xy = [];
    let a_n_outer = [];
    let f_add = function(n_x, n_y){ a_n_outer.push(a_n_xy.length / 2); a_n_xy.push(n_x, n_y); };
    for(let n_it = 0; n_it < 20; n_it++){ f_add(n_it, 0); }
    for(let n_it = 0; n_it < 20; n_it++){ f_add(20, n_it); }
    for(let n_it = 0; n_it < 20; n_it++){ f_add(20 - n_it, 20); }
    for(let n_it = 0; n_it < 20; n_it++){ f_add(0, 20 - n_it); }
    let a_n_hole = f_add_loop(a_n_xy, 10, 10, 72, function(){ return 4.25; }, true);
    f_check_filled(f_a_n_idx__ears(a_n_outer, [a_n_hole], a_n_xy), a_n_outer, [a_n_hole], a_n_xy, 'square with a hole');
    f_check_filled(f_a_n_idx__ears(a_n_outer, [], a_n_xy), a_n_outer, [], a_n_xy, 'square');
});

Deno.test('loops: edges close to loops, two that touch stay two, a chain that ends is closed', function(){
    // Two squares that share a corner, at point 2.
    let a_n_xy = [0, 0, 10, 0, 10, 10, 0, 10, 20, 10, 20, 20, 10, 20];
    let a_a_n_edge = [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6], [6, 2]];
    let o = f_o_loop(a_a_n_edge.map(function(a){ return a[0]; }), a_a_n_edge.map(function(a){ return a[1]; }), a_n_xy);
    assertEquals(o.n_cnt__gap, 0);
    assertEquals(o.a_a_n_loop.map(function(a_n){ return a_n.length; }), [4, 4]);
    for(let a_n_loop of o.a_a_n_loop){ assertAlmostEquals(f_n_mm2__loop(a_n_loop, a_n_xy), 100, 1e-9); }
    // In another order, starting at the shared corner.
    a_a_n_edge = [[2, 4], [6, 2], [1, 2], [2, 3], [3, 0], [0, 1], [4, 5], [5, 6]];
    o = f_o_loop(a_a_n_edge.map(function(a){ return a[0]; }), a_a_n_edge.map(function(a){ return a[1]; }), a_n_xy);
    assertEquals(o.a_a_n_loop.map(function(a_n){ return a_n.length; }), [4, 4]);
    // A square without its last edge.
    o = f_o_loop([0, 1, 2], [1, 2, 3], a_n_xy);
    assertEquals([o.n_cnt__gap, o.a_a_n_loop.length, o.a_a_n_loop[0].length], [1, 1, 4]);
    // A square in two chains that meet a hair apart, at 7 and 8: one loop, no gap.
    let a_n_xy__hair = [0, 0, 10, 0, 10, 10, 0, 10, 5, 0, 5.00001, 0];
    o = f_o_loop([0, 5, 1, 2, 3], [4, 1, 2, 3, 0], a_n_xy__hair);
    assertEquals([o.n_cnt__gap, o.a_a_n_loop.length, o.a_a_n_loop[0].length], [0, 1, 6]);
    assertAlmostEquals(f_n_mm2__loop(o.a_a_n_loop[0], a_n_xy__hair), 100, 1e-6);
});

Deno.test('polygons: outlines, holes, an island in a hole, a loop that is inside out', function(){
    let a_n_xy = [];
    let a_n_big = f_add_loop(a_n_xy, 0, 0, 40, function(){ return 50; });
    let a_n_hole = f_add_loop(a_n_xy, 0, 0, 30, function(){ return 30; }, true);
    let a_n_island = f_add_loop(a_n_xy, 0, 0, 20, function(){ return 10; });
    let a_n_other = f_add_loop(a_n_xy, 200, 0, 12, function(){ return 10; });
    let a_n_lone = f_add_loop(a_n_xy, -200, 0, 12, function(){ return 10; }, true);
    let a_o_polygon = f_a_o_polygon([a_n_hole, a_n_island, a_n_lone, a_n_other, a_n_big], a_n_xy);
    assertEquals(a_o_polygon.map(function(o){ return [o.a_n_outer.length, o.a_a_n_hole.map(function(a){ return a.length; }), o.b_inverted]; }),
        [[12, [], false], [20, [], false], [40, [30], false], [12, [], true]], 'the smallest first, the inside out one last');
    assertAlmostEquals(a_o_polygon[2].n_mm2, f_n_mm2__loop(a_n_big, a_n_xy) + f_n_mm2__loop(a_n_hole, a_n_xy), 1e-9, 'what the ring covers');
    let a_n_idx = f_a_n_idx__of_polygons(a_o_polygon, a_n_xy);
    let n_mm2 = 0;
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){ n_mm2 += f_n_mm2__loop([a_n_idx[n_off], a_n_idx[n_off + 1], a_n_idx[n_off + 2]], a_n_xy); }
    let n_mm2__wanted = [a_n_big, a_n_hole, a_n_island, a_n_other, a_n_lone].reduce(function(n_sum, a_n){ return n_sum + f_n_mm2__loop(a_n, a_n_xy); }, 0);
    assertAlmostEquals(n_mm2, n_mm2__wanted, 1e-6, 'the inside out one counts against');
    assert(f_b_in_loop(a_n_big, a_n_xy, 40, 0) && !f_b_in_loop(a_n_big, a_n_xy, 60, 0));
    assertAlmostEquals(f_n_mm__to_loop([0, 1, 2, 3], [0, 0, 10, 0, 10, 10, 0, 10], 5, 3), 3, 1e-12);
});
