// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The lit preview's model.
import { assert, assertEquals } from './check.js';
import { f_o_lit, f_a_n__source, f_blur, f_a_n__box } from '../light.module.js';

let n_w = 60, n_h = 80;
let f_a_n__full = function(n_value){ return new Float32Array(n_w * n_h).fill(n_value); };
let f_o_scene = function(a_o_sheet){
    return { n_w, n_h, a_o_sheet, a_n_source: f_a_n__full(1), a_n_colour: [1, 1, 1], n_brightness: 1, n_room: 0 };
};

Deno.test('three boxes for a blur, and a blur keeps what there is', function(){
    assertEquals(f_a_n__box(4), [7, 7, 9]);
    let a_n = new Float32Array(n_w * n_h);
    a_n[40 * n_w + 30] = 100;
    f_blur(a_n, new Float32Array(n_w * n_h), n_w, n_h, 3);
    let n_sum = a_n.reduce(function(n, n_value){ return n + n_value; }, 0);
    assert(Math.abs(n_sum - 100) < 1e-3, `sum ${n_sum}`);
    assert(a_n[40 * n_w + 30] < 3 && a_n[40 * n_w + 33] > 0.5 * a_n[40 * n_w + 30]);
    let a_n_even = f_a_n__full(2);
    f_blur(a_n_even, new Float32Array(n_w * n_h), n_w, n_h, 5);
    assert(a_n_even.every(function(n){ return Math.abs(n - 2) < 1e-5; }), 'even light stays even to the edge');
});

Deno.test('each sheet in front is darker and warmer', function(){
    let o_lit = f_o_lit(f_o_scene([0, 1, 2].map(function(){
        return { a_n_material: f_a_n__full(1), n_transmission: 0.5, n_px__sigma: 4 };
    })));
    let n_off = 4 * (40 * n_w + 30);
    let a_n_red = o_lit.a_a_n_rgba.map(function(a_n){ return a_n[n_off]; });
    assert(a_n_red[2] > a_n_red[1] && a_n_red[1] > a_n_red[0], `red ${a_n_red}`);
    let a_n_warm = o_lit.a_a_n_rgba.map(function(a_n){ return a_n[n_off + 2] / a_n[n_off]; });
    assert(a_n_warm[2] > a_n_warm[1] && a_n_warm[1] > a_n_warm[0], `blue to red ${a_n_warm}`);
    assertEquals(o_lit.a_a_n_rgba[0][n_off + 3], 255);
    assert(o_lit.a_n_rgba__back[n_off] > a_n_red[2]);
});

Deno.test('a hole is see-through and lights the sheet in front of it', function(){
    let a_n_hole = f_a_n__full(1);
    for(let n_y = 30; n_y < 50; n_y++){
        for(let n_x = 20; n_x < 40; n_x++){ a_n_hole[n_y * n_w + n_x] = 0; }
    }
    let f_o = function(a_n_back){
        return f_o_lit(f_o_scene([
            { a_n_material: f_a_n__full(1), n_transmission: 0.5, n_px__sigma: 3 },
            { a_n_material: a_n_back, n_transmission: 0.5, n_px__sigma: 3 }
        ]));
    };
    let o_lit = f_o(a_n_hole), o_lit__closed = f_o(f_a_n__full(1));
    assertEquals([o_lit.a_a_n_rgba[1][4 * (40 * n_w + 30) + 3], o_lit.a_a_n_rgba[1][4 * (10 * n_w + 5) + 3]], [0, 255]);
    let n_off = 4 * (40 * n_w + 30), n_off__far = 4 * (5 * n_w + 5);
    assert(o_lit.a_a_n_rgba[0][n_off] > o_lit__closed.a_a_n_rgba[0][n_off] + 20, 'brighter in front of the hole');
    assert(Math.abs(o_lit.a_a_n_rgba[0][n_off__far] - o_lit__closed.a_a_n_rgba[0][n_off__far]) < 3, 'the same far from it');
});

Deno.test('the room\'s light shows the sheets with the light off', function(){
    let o_scene = f_o_scene([{ a_n_material: f_a_n__full(1), n_transmission: 0.5, n_px__sigma: 3 }]);
    o_scene.a_n_source = f_a_n__full(0);
    assertEquals(f_o_lit(o_scene).a_a_n_rgba[0][0], 0);
    o_scene.n_room = 0.5;
    assert(f_o_lit(o_scene).a_a_n_rgba[0][0] > 60);
});

Deno.test('board and puck send about the same in all', function(){
    let n_px = 4;
    let a_n_board = f_a_n__source({ s_kind: 'board', n_mm__x: 60, n_mm__y: 78, n_mm__w: 108, n_mm__h: 144, n_cnt__x: 9, n_cnt__y: 11 }, 480, 624, n_px);
    let a_n_puck = f_a_n__source({ s_kind: 'puck', n_mm__x: 60, n_mm__y: 78, n_mm__r: 18 }, 480, 624, n_px);
    let f_n_sum = function(a_n, n_base){ return a_n.reduce(function(n, n_value){ return n + n_value - n_base; }, 0) / (n_px * n_px); };
    assert(Math.abs(f_n_sum(a_n_board, 0.12) / (108 * 144) - 1) < 0.02, `board ${f_n_sum(a_n_board, 0.12)}`);
    assert(Math.abs(f_n_sum(a_n_puck, 0.04) / (108 * 144) - 1) < 0.02, `puck ${f_n_sum(a_n_puck, 0.04)}`);
    assertEquals(a_n_board.filter(function(n){ return n > 1; }).length, 99 * 4);
});
