// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A picture matched by four points: the mapping takes every one of the four exactly to
// its place and is the one mapping that does; fours that cannot be matched are named;
// a clicked point snaps to the cut pattern's places; and the picture's pixels, laid
// anew, show the old picture's colour of the place each one comes from.

import { f_a_o_window } from '../calendar.module.js';
import { f_o_setting__default, f_a_a_n__anchor } from '../sheet.module.js';
import { f_a_n_h, f_n_w, f_a_n__mapped, f_s_problem__match, f_a_n__snapped, f_n_px__per_mm, f_a_n__warped } from '../match.module.js';

// a calendar's settings: what every project has and the calendar's own
let o_setting__default = f_o_setting__default('calendar');

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertAlmostEquals = function(n_a, n_b, n_tolerance, s_message = ''){
    if(!(Math.abs(n_a - n_b) <= n_tolerance)){ throw new Error(`${s_message} ${n_a} is not ${n_b} within ${n_tolerance}`); }
};
let f_assert_same_place = function(a_n, a_n__other, s_message, n_tolerance = 1e-9){
    assert(Math.hypot(a_n[0] - a_n__other[0], a_n[1] - a_n__other[1]) <= n_tolerance, `${s_message}: ${a_n} is not ${a_n__other}`);
};

// Four points of a photo of 4000 x 3000 pixels, and fours of places on a calendar of
// 277 x 190 mm they are matched to: the calendar's corners, a slanted patch, the same
// mirrored, and the points themselves moved and sized without a slant.
let a_a_n__px = [[412, 350], [3611, 205], [3790, 2740], [280, 2610]];
let a_a_a_n__mm = [
    [[0, 0], [277, 0], [277, 190], [0, 190]],
    [[19.6, 19], [257.4, 21.5], [250, 171], [35, 160.2]],
    [[257.4, 21.5], [19.6, 19], [35, 160.2], [250, 171]],
    a_a_n__px.map(function(a_n){ return [a_n[0] * 0.07 - 3, a_n[1] * 0.07 + 11]; })
];

Deno.test('the mapping takes each of the four points to its place, there and back', function(){
    for(let a_a_n__mm of a_a_a_n__mm){
        let a_n_h = f_a_n_h(a_a_n__px, a_a_n__mm);
        let a_n_h__back = f_a_n_h(a_a_n__mm, a_a_n__px);
        a_a_n__px.forEach(function(a_n__px, n_idx){
            f_assert_same_place(f_a_n__mapped(a_n_h, a_n__px), a_a_n__mm[n_idx], `point ${n_idx}`, 1e-9);
            f_assert_same_place(f_a_n__mapped(a_n_h__back, a_a_n__mm[n_idx]), a_n__px, `point ${n_idx} back`, 1e-8);
        });
        // any other point comes back to itself
        for(let a_n of [[0, 0], [2000, 1500], [4000, 3000], [123.4, 2876.5]]){
            f_assert_same_place(f_a_n__mapped(a_n_h__back, f_a_n__mapped(a_n_h, a_n)), a_n, `point ${a_n} there and back`, 1e-6);
        }
    }
    // without a slant the mapping is the moving and sizing the points were made by
    f_assert_same_place(f_a_n__mapped(f_a_n_h(a_a_n__px, a_a_a_n__mm[3]), [1000, 2000]), [67, 151], 'moved and sized', 1e-9);
});

Deno.test('the mapping is the one that made the points: a known slant is found again', function(){
    // a mapping with a slant, as a camera held askew gives it
    let a_n_h__known = [0.071, 0.004, -9.5, -0.006, 0.068, 4.2, 0.000011, -0.000023, 1];
    let a_a_n__mm = a_a_n__px.map(function(a_n){ return f_a_n__mapped(a_n_h__known, a_n); });
    let a_n_h = f_a_n_h(a_a_n__px, a_a_n__mm);
    for(let n_x = 0; n_x <= 4000; n_x += 500){
        for(let n_y = 0; n_y <= 3000; n_y += 500){
            f_assert_same_place(f_a_n__mapped(a_n_h, [n_x, n_y]), f_a_n__mapped(a_n_h__known, [n_x, n_y]), `pixel ${n_x}, ${n_y}`, 1e-8);
        }
    }
    // straight lines stay straight: the middle of two points lies on the line between their places
    let [a_n_p, a_n_q, a_n_r] = [[500, 400], [2100, 1500], [3700, 2600]].map(function(a_n){ return f_a_n__mapped(a_n_h, a_n); });
    assertAlmostEquals((a_n_q[0] - a_n_p[0]) * (a_n_r[1] - a_n_p[1]) - (a_n_r[0] - a_n_p[0]) * (a_n_q[1] - a_n_p[1]), 0, 1e-9, 'three points of a line');
    // and the picture is as fine as the mapping makes it: 4000 pixels on about 280 mm
    let n_px = f_n_px__per_mm(f_a_n_h(a_a_n__mm, a_a_n__px), [138.5, 95]);
    assert(n_px > 13 && n_px < 16, `${n_px} pixels per mm`);
    assertAlmostEquals(f_n_px__per_mm([300 / 25.4, 0, 5, 0, 300 / 25.4, -7, 0, 0, 1], [40, 60]), 300 / 25.4, 1e-9, 'sized only');
});

Deno.test('fours that cannot be matched are named', function(){
    let a_n__box = [-2, -2, 279, 192];
    for(let a_a_n__mm of a_a_a_n__mm.slice(0, 3)){
        assert(f_s_problem__match(a_a_n__px, a_a_n__mm, a_n__box) === '', f_s_problem__match(a_a_n__px, a_a_n__mm, a_n__box));
    }
    // three on one line, on either side; two on one spot
    let s_line = 'Three of the points lie on one line, or two on one spot: the picture cannot be laid by them.';
    assert(f_s_problem__match([[0, 0], [100, 0], [200, 0.5], [50, 300]], a_a_a_n__mm[0], a_n__box) === s_line, 'a line on the picture');
    assert(f_s_problem__match(a_a_n__px, [[0, 0], [277, 0], [138, 0], [0, 190]], a_n__box) === s_line, 'a line on the pattern');
    assert(f_s_problem__match(a_a_n__px, [[0, 0], [277, 0], [277, 190], [277, 190]], a_n__box) === s_line, 'one spot twice');
    // the second and third place swapped: the patch crosses itself, the picture folds over
    let s_fold = 'Laid by these points the picture would fold over. Are they in the same order on the picture and on the pattern?';
    assert(f_s_problem__match(a_a_n__px, [[0, 0], [277, 190], [277, 0], [0, 190]], a_n__box) === s_fold, f_s_problem__match(a_a_n__px, [[0, 0], [277, 190], [277, 0], [0, 190]], a_n__box));
    // a small patch whose slant throws a part of the box beyond the horizon
    assert(f_s_problem__match([[1000, 1000], [1400, 1000], [1300, 1100], [1100, 1100]], [[100, 80], [140, 80], [140, 90], [100, 90]], a_n__box) === s_fold, 'a horizon on the calendar');
    // where nothing is wrong, w keeps its sign over the whole box
    let a_n_h = f_a_n_h(a_a_a_n__mm[1], a_a_n__px);
    assert([[-2, -2], [279, -2], [279, 192], [-2, 192]].every(function(a_n){ return f_n_w(a_n_h, a_n) * f_n_w(a_n_h, [138, 95]) > 0; }), 'w over the box');
});

Deno.test('the pattern\'s places a point snaps to: the calendar\'s and every window\'s', function(){
    let a_a_n = f_a_a_n__anchor(o_setting__default);
    let f_b_there = function(a_n){ return a_a_n.some(function(a_n__anchor){ return Math.hypot(a_n__anchor[0] - a_n[0], a_n__anchor[1] - a_n[1]) < 1e-9; }); };
    for(let a_n of [[0, 0], [277, 0], [277, 190], [0, 190], [138.5, 95]]){ assert(f_b_there(a_n), `the calendar's ${a_n}`); }
    for(let o_window of f_a_o_window(o_setting__default)){
        assert(f_b_there([o_window.n_mm__x, o_window.n_mm__y]), 'a window\'s middle');
        assert(f_b_there([o_window.n_mm__x - 16, o_window.n_mm__y - 16]) && f_b_there([o_window.n_mm__x + 16, o_window.n_mm__y + 16]), 'a window\'s box');
        // where its sides meet its foot, at the least
        assert(f_b_there([o_window.n_mm__x - 16, o_window.n_mm__y + 16]) || o_window.s_shape === 'round', 'a window\'s foot');
    }
    assert(a_a_n.length > 5 + 24 * 7 && a_a_n.every(function(a_n){ return a_n[0] >= 0 && a_n[0] <= 277 && a_n[1] >= 0 && a_n[1] <= 190; }), `${a_a_n.length} places`);

    let a_a_n__few = [[0, 0], [10, 0], [10, 3]];
    assert(String(f_a_n__snapped([9, 1], a_a_n__few, 2)) === '10,0', 'the one in reach');
    assert(String(f_a_n__snapped([9, 2], a_a_n__few, 2)) === '10,3', 'the other one in reach');
    assert(String(f_a_n__snapped([9.5, 1], a_a_n__few, 3)) === '10,0' && String(f_a_n__snapped([9.5, 2], a_a_n__few, 3)) === '10,3', 'the nearer of two in reach');
    assert(String(f_a_n__snapped([5, 1], a_a_n__few, 2)) === '5,1', 'none in reach: where it is');
    assert(String(f_a_n__snapped([2, 0], a_a_n__few, 2)) === '0,0', 'at the reach\'s end');
});

// A picture of 40 x 30 pixels whose colours rise evenly: red with x, green with y; solid.
let n_px__x = 40;
let n_px__y = 30;
let a_n__rgba = new Uint8ClampedArray(n_px__x * n_px__y * 4);
for(let n_y = 0; n_y < n_px__y; n_y++){
    for(let n_x = 0; n_x < n_px__x; n_x++){
        a_n__rgba.set([6 * n_x, 8 * n_y, 77, 255], 4 * (n_y * n_px__x + n_x));
    }
}

Deno.test('pixels laid anew: left as they are, moved, and beside the picture clear', function(){
    let a_n__same = f_a_n__warped(a_n__rgba, n_px__x, n_px__y, [1, 0, 0, 0, 1, 0, 0, 0, 1], n_px__x, n_px__y);
    assert(a_n__same.every(function(n, n_idx){ return n === a_n__rgba[n_idx]; }), 'left as it is');
    // the new picture shows the old one from 3 pixels further right and 2 further up: its content moves 3 left, 2 down
    let a_n__moved = f_a_n__warped(a_n__rgba, n_px__x, n_px__y, [1, 0, 3, 0, 1, -2, 0, 0, 1], n_px__x, n_px__y);
    for(let n_y = 0; n_y < n_px__y; n_y++){
        for(let n_x = 0; n_x < n_px__x; n_x++){
            let a_n = [...a_n__moved.slice(4 * (n_y * n_px__x + n_x), 4 * (n_y * n_px__x + n_x) + 4)];
            let b_inside = n_x + 3 < n_px__x && n_y - 2 >= 0;
            assert(String(a_n) === (b_inside ? String([6 * (n_x + 3), 8 * (n_y - 2), 77, 255]) : '0,0,0,0'), `pixel ${n_x}, ${n_y}: ${a_n}`);
        }
    }
    // another size: 80 x 60 from the same picture, every old pixel four new ones' worth
    let a_n__large = f_a_n__warped(a_n__rgba, n_px__x, n_px__y, [0.5, 0, 0, 0, 0.5, 0, 0, 0, 1], 80, 60);
    assert(a_n__large.length === 80 * 60 * 4, 'size');
    assert(String([...a_n__large.slice(0, 4)]) === '0,0,77,255' && String([...a_n__large.slice(-4)]) === String([6 * 39, 8 * 29, 77, 255]), 'the corners keep their colour');
});

Deno.test('pixels laid anew at a slant: every one the colour of the place it comes from', function(){
    // the new picture, 120 x 90, takes its corners from four places of the old one
    let a_n_h = f_a_n_h([[0, 0], [120, 0], [120, 90], [0, 90]], [[3, 2], [36, 5], [31, 27], [6, 22]]);
    let a_n__new = f_a_n__warped(a_n__rgba, n_px__x, n_px__y, a_n_h, 120, 90);
    let n_checked = 0;
    for(let n_y = 0; n_y < 90; n_y++){
        for(let n_x = 0; n_x < 120; n_x++){
            let [n_x__old, n_y__old] = f_a_n__mapped(a_n_h, [n_x + 0.5, n_y + 0.5]);
            // red is 6 times the old pixel's number, counted at its middle: 6 (x - 0.5) at the place x
            let n_idx = 4 * (n_y * 120 + n_x);
            assertAlmostEquals(a_n__new[n_idx], 6 * (n_x__old - 0.5), 0.51, `red of ${n_x}, ${n_y}`);
            assertAlmostEquals(a_n__new[n_idx + 1], 8 * (n_y__old - 0.5), 0.51, `green of ${n_x}, ${n_y}`);
            assert(a_n__new[n_idx + 2] === 77 && a_n__new[n_idx + 3] === 255, `blue and solid at ${n_x}, ${n_y}`);
            n_checked++;
        }
    }
    assert(n_checked === 120 * 90, 'all pixels');
    // a wider view: what comes from beside the old picture is clear, the rest solid
    let a_n_h__wide = f_a_n_h([[0, 0], [120, 0], [120, 90], [0, 90]], [[-10, -6], [52, 2], [44, 35], [-4, 31]]);
    let a_n__wide = f_a_n__warped(a_n__rgba, n_px__x, n_px__y, a_n_h__wide, 120, 90);
    let a_n_count = [0, 0];
    for(let n_y = 0; n_y < 90; n_y++){
        for(let n_x = 0; n_x < 120; n_x++){
            let [n_x__old, n_y__old] = f_a_n__mapped(a_n_h__wide, [n_x + 0.5, n_y + 0.5]);
            let b_inside = n_x__old >= 0 && n_y__old >= 0 && n_x__old <= n_px__x && n_y__old <= n_px__y;
            assert(a_n__wide[4 * (n_y * 120 + n_x) + 3] === (b_inside ? 255 : 0), `solid or clear at ${n_x}, ${n_y}`);
            a_n_count[b_inside ? 1 : 0]++;
        }
    }
    assert(a_n_count[0] > 500 && a_n_count[1] > 5000, `clear and solid: ${a_n_count}`);
});

Deno.test('pixels laid anew: a clear pixel gives no colour to its neighbours', function(){
    // two pixels side by side: solid red, and clear with a green that must not show
    let a_n__two = new Uint8ClampedArray([200, 0, 0, 255, 0, 255, 0, 0]);
    // eight new pixels across the two old ones
    let a_n__new = f_a_n__warped(a_n__two, 2, 1, [0.25, 0, 0, 0, 1, 0, 0, 0, 1], 8, 1);
    for(let n_x = 0; n_x < 8; n_x++){
        let [n_r, n_g, n_b, n_a] = a_n__new.slice(4 * n_x, 4 * n_x + 4);
        assert(n_g === 0 && n_b === 0, `green shows at ${n_x}: ${n_g}`);
        assert(n_a === 0 || n_r === 200, `red fades at ${n_x}: ${n_r}`);
    }
    // from solid to clear, step by step
    assert(String([0, 1, 2, 3, 4, 5, 6, 7].map(function(n_x){ return a_n__new[4 * n_x + 3]; })) === '255,255,223,159,96,32,0,0', String([0, 1, 2, 3, 4, 5, 6, 7].map(function(n_x){ return a_n__new[4 * n_x + 3]; })));
});
