// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The vase's graph: formulas as a script writes them, the grid's steps and numbers, and
// lines that break where a formula jumps or has no number, but not where it is steep.

import { assert, assertEquals, assertAlmostEquals, assertThrows } from './check.js';
import { f_f_formula, f_o_step, f_s_num, f_a_a_n_line } from '../graph.module.js';

let o_view = { n_x_min: -10, n_x_max: 10, n_y_min: -20 / 3, n_y_max: 20 / 3 };

Deno.test('a formula sees what a script sees; y = and ^ as in Desmos', function(){
    assertEquals(f_f_formula('2*x')(3), 6);
    assertAlmostEquals(f_f_formula('sin(x*x)')(1.5), Math.sin(2.25), 1e-12);
    assertEquals(f_f_formula('y = x^2')(3), 9);
    assertEquals(f_f_formula('mix(45, 22, x)')(0.5), 33.5);
    assertEquals(f_f_formula('fract(x) + clamp(x, 0, 1) + smoothstep(0, 1, x)')(2.25), 2.25);
    assertEquals(f_f_formula('PI')(0), Math.PI);
    assert(Math.abs(f_f_formula('noise.simplex2(x, 0.5)')(1.3)) <= 1);
    assertEquals(f_f_formula('x > 0')(2), 1);
    assert(Number.isNaN(f_f_formula('vec2(x, x)')(1)));
    // A comment at the end does not swallow the bracket.
    assertEquals(f_f_formula('x + 1 // one more')(1), 2);
    assertEquals(f_f_formula('  '), null);
    // Its mistakes in its own words, not the ones of the function around it.
    assertThrows(function(){ f_f_formula('sin(x'); }, /missing \) after argument list/);
    assertThrows(function(){ f_f_formula('2 *'); }, /The formula ends too soon/);
    assertThrows(function(){ f_f_formula('n_tau * x')(1); }, /n_tau is not defined/);
});

Deno.test('the grid: 1, 2 or 5 times a power of ten, its numbers short', function(){
    assertEquals(f_o_step(20 / 300, 48), { n_step: 5, n_step__minor: 1 });
    assertEquals(f_o_step(1 / 300, 48), { n_step: 0.2, n_step__minor: 0.05 });
    assertEquals(f_o_step(1000, 48), { n_step: 50000, n_step__minor: 10000 });
    assertEquals(f_s_num(3 * 0.1, 0.1), '0.3');
    assertEquals(f_s_num(-0.0000001, 0.5), '0');
    assertEquals(f_s_num(15, 5), '15');
    assertEquals(f_s_num(0.25 * 3, 0.05), '0.75');
});

Deno.test('a line breaks where it jumps or has no number, not where it is steep', function(){
    let f_n_piece = function(s_formula){
        return f_a_a_n_line(f_f_formula(s_formula), o_view, 300, 200, 600).length;
    };
    assertEquals(f_n_piece('2*x'), 1);
    // Steep: near x = ±10 it goes from -1 to 1 in 5 points.
    assertEquals(f_n_piece('sin(x*x)'), 1);
    assertEquals(f_n_piece('100 * x'), 1);
    // A jump at each whole number from -9 to 10, the last at the right edge.
    assertEquals(f_n_piece('fract(x)'), 21);
    assertEquals(f_n_piece('floor(x)'), 21);
    // Poles at ±π/2, ±3π/2 and ±5π/2.
    assertEquals(f_n_piece('tan(x)'), 7);
    assertEquals(f_n_piece('1 / x'), 2);
    assertEquals(f_n_piece('sqrt(x)'), 1);
    assertEquals(f_n_piece('sqrt(-1)'), 0);
    // From the left edge to the right one, upside down in px: y = 0 in the middle.
    let a_n = f_a_a_n_line(f_f_formula('0'), o_view, 300, 200, 600)[0];
    assertEquals([a_n[0], a_n[1], a_n[a_n.length - 2], a_n[a_n.length - 1]], [0, 100, 300, 100]);
    assertEquals(f_a_a_n_line(f_f_formula('20 / 3'), o_view, 300, 200, 600)[0][1], 0);
    // Far off the canvas a point is held at 10 heights.
    assertEquals(f_a_a_n_line(f_f_formula('1e12'), o_view, 300, 200, 600)[0][1], -2000);
});
