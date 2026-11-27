// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The net: its outline, folds, tabs and logo where they belong, the dashes on their
// folds with their gaps, and a cutting file of the right size with the net at its place
// on the sheet, for the defaults and for the ends of the settings' ranges.

import { o_setting__default as o_setting__default__own, n_mm__logo_min, f_o_net, f_a_a_a_n__dash, f_a_o_line, f_a_a_n__anchor } from '../flextangle.module.js';
import { f_a_n__at, f_n_len } from '../path.module.js';
import { f_o_setting__default, f_a_n__box__file, f_s_svg } from '../sheet.module.js';

// a flextangle's settings: what every project has and the flextangle's own
let o_setting__default = f_o_setting__default('flextangle');

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertAlmostEquals = function(n_a, n_b, n_tolerance, s_message = ''){
    if(!(Math.abs(n_a - n_b) <= n_tolerance)){ throw new Error(`${s_message} ${n_a} is not ${n_b} within ${n_tolerance}`); }
};

let a_o_setting = [
    o_setting__default,
    { ...o_setting__default, n_mm__base: 10, n_mm__tab: 5, n_mm__dash: 0.2, n_mm__gap: 0.2 },
    { ...o_setting__default, n_mm__base: 300, n_ratio__height: 3, n_mm__tab: 150, n_mm__dash: 50, n_mm__gap: 50 },
    { ...o_setting__default, n_ratio__height: 1.37, n_mm__tab: 1, n_mm__dash: 7.3, n_mm__gap: 0.9, b_logo: false }
];

let f_n_area = function(a_a_n){
    return a_a_n.reduce(function(n_sum, a_n, n_idx){
        let a_n_next = a_a_n[(n_idx + 1) % a_a_n.length];
        return n_sum + (a_n[0] * a_n_next[1] - a_n_next[0] * a_n[1]) / 2;
    }, 0);
};
let f_n_distance__segment = function(a_n, a_n_p, a_n_q){
    let n_x = a_n_q[0] - a_n_p[0], n_y = a_n_q[1] - a_n_p[1];
    let n_s = Math.max(0, Math.min(1, ((a_n[0] - a_n_p[0]) * n_x + (a_n[1] - a_n_p[1]) * n_y) / (n_x * n_x + n_y * n_y)));
    return Math.hypot(a_n[0] - a_n_p[0] - n_s * n_x, a_n[1] - a_n_p[1] - n_s * n_y);
};
let f_b_inside = function(a_n, a_a_n){
    let b = false;
    for(let n_idx = 0, n_prev = a_a_n.length - 1; n_idx < a_a_n.length; n_prev = n_idx++){
        let [n_x1, n_y1] = a_a_n[n_idx], [n_x2, n_y2] = a_a_n[n_prev];
        if((n_y1 > a_n[1]) !== (n_y2 > a_n[1]) && a_n[0] < n_x1 + (a_n[1] - n_y1) * (n_x2 - n_x1) / (n_y2 - n_y1)){ b = !b; }
    }
    return b;
};
// How far a point is inside a triangle: its distance to the nearest side, negative outside.
let f_n_depth = function(a_n, a_a_n__tri){
    let n_depth = Math.min(...a_a_n__tri.map(function(a_n_p, n_idx){ return f_n_distance__segment(a_n, a_n_p, a_a_n__tri[(n_idx + 1) % 3]); }));
    return f_b_inside(a_n, a_a_n__tri) ? n_depth : -n_depth;
};

for(let o_setting of a_o_setting){
    let s_name = Object.keys(o_setting__default__own).map(function(s_key){ return o_setting[s_key]; }).join(' ');
    let n_a = o_setting.n_mm__base;
    let n_h = n_a * o_setting.n_ratio__height;
    let n_t = o_setting.n_mm__tab;
    let o_net = f_o_net(o_setting);

    Deno.test(`${s_name}: outline is 24 triangles, 6 half triangles of glue tab and 2 end tabs`, function(){
        assertAlmostEquals(f_n_area(o_net.a_a_n__outline), 24 * n_a * n_h / 2 + 6 * n_h * n_a / 4 + 2 * n_t * (n_a - n_t), 1e-6);
        assertAlmostEquals(o_net.n_mm__x, 6 * n_h + n_t, 1e-9);
        assertAlmostEquals(o_net.n_mm__y, 2.5 * n_a, 1e-9);
    });

    Deno.test(`${s_name}: folds are hinges of a base or half and slanted sides, inside the outline`, function(){
        assert(o_net.a_a_a_n__valley.length === 15, 'valley folds');
        assert(o_net.a_a_a_n__mountain.length === 24, 'mountain folds');
        for(let [a_n_p, a_n_q] of o_net.a_a_a_n__valley){
            assert(a_n_p[0] === a_n_q[0], 'valley folds are vertical');
            let n_len = a_n_q[1] - a_n_p[1];
            assert(Math.abs(n_len - n_a) < 1e-9 || Math.abs(n_len - n_a / 2) < 1e-9, `valley fold ${n_len} long`);
        }
        for(let [a_n_p, a_n_q] of o_net.a_a_a_n__mountain){
            assertAlmostEquals(Math.hypot(a_n_q[0] - a_n_p[0], a_n_q[1] - a_n_p[1]), Math.hypot(n_h, n_a / 2), 1e-9, 'mountain fold');
        }
        for(let [a_n_p, a_n_q] of [...o_net.a_a_a_n__valley, ...o_net.a_a_a_n__mountain]){
            for(let n_s of [0.25, 0.5, 0.75]){
                assert(f_b_inside([a_n_p[0] + n_s * (a_n_q[0] - a_n_p[0]), a_n_p[1] + n_s * (a_n_q[1] - a_n_p[1])], o_net.a_a_n__outline), 'fold outside the outline');
            }
        }
    });

    Deno.test(`${s_name}: the end tabs fit inside the triangles they are glued to`, function(){
        // the first column's triangles with their base on the left edge
        for(let n_y of [0, n_a]){
            let a_a_n__tri = [[0, n_y], [n_h, n_y + n_a / 2], [0, n_y + n_a]];
            for(let a_n of o_net.a_a_n__outline.filter(function(a_n){ return a_n[0] > 6 * n_h + 1e-9 && a_n[1] >= n_y && a_n[1] <= n_y + n_a; })){
                assert(f_n_depth([a_n[0] - 6 * n_h, a_n[1]], a_a_n__tri) >= -1e-9, `end tab corner ${a_n} sticks out`);
            }
        }
    });

    Deno.test(`${s_name}: the logo stays a margin inside the first glue tab`, function(){
        let o = o_net.o_logo;
        assert(o.n_w > 0 && Math.abs(o.n_w / o.n_h - 43.9095293518 / 31.2528266758) < 1e-9, 'logo size');
        let a_a_n__tab = [[0, 0], [n_h, 0], [n_h, n_a / 2]];
        let n_min = Math.min(...[[o.n_x, o.n_y], [o.n_x + o.n_w, o.n_y], [o.n_x, o.n_y + o.n_h], [o.n_x + o.n_w, o.n_y + o.n_h]].map(function(a_n){ return f_n_depth(a_n, a_a_n__tab); }));
        assertAlmostEquals(n_min, n_a / 20, 1e-9, 'nearest corner to a side of the tab');
    });

    Deno.test(`${s_name}: dashes lie on their folds, a gap from the ends and from each other`, function(){
        let n_dash = o_setting.n_mm__dash, n_gap = o_setting.n_mm__gap;
        for(let [a_n_p, a_n_q] of [...o_net.a_a_a_n__valley, ...o_net.a_a_a_n__mountain]){
            let n_len = Math.hypot(a_n_q[0] - a_n_p[0], a_n_q[1] - a_n_p[1]);
            let a_a_a_n = f_a_a_a_n__dash(a_n_p, a_n_q, n_dash, n_gap);
            assert(a_a_a_n.length >= 1, 'a fold without dashes');
            let a_n_s = a_a_a_n.flat().map(function(a_n){
                assert(f_n_distance__segment(a_n, a_n_p, a_n_q) < 1e-9, 'dash off its fold');
                return Math.hypot(a_n[0] - a_n_p[0], a_n[1] - a_n_p[1]);
            });
            assert(a_n_s[0] >= n_gap - 1e-9 && n_len - a_n_s.at(-1) >= n_gap - 1e-9, 'no gap at an end');
            assertAlmostEquals(a_n_s[0], n_len - a_n_s.at(-1), 1e-9, 'dashes not in the middle');
            for(let n_idx = 0; n_idx < a_n_s.length; n_idx += 2){
                assert(a_n_s[n_idx + 1] - a_n_s[n_idx] <= n_dash + 1e-9, 'dash too long');
                if(a_a_a_n.length > 1){ assertAlmostEquals(a_n_s[n_idx + 1] - a_n_s[n_idx], n_dash, 1e-9, 'dash'); }
                if(n_idx > 0){ assertAlmostEquals(a_n_s[n_idx] - a_n_s[n_idx - 1], n_gap, 1e-9, 'gap'); }
            }
            // as many as fit: one more would not leave the gaps
            assert((a_a_a_n.length + 1) * n_dash + (a_a_a_n.length + 2) * n_gap > n_len, 'room for another dash');
        }
    });

    let b_logo = o_setting.b_logo && o_net.o_logo.n_w >= n_mm__logo_min;
    let f_n_dash = function(a_a_a_n){
        return a_a_a_n.reduce(function(n, a_a_n){ return n + f_a_a_a_n__dash(a_a_n[0], a_a_n[1], o_setting.n_mm__dash, o_setting.n_mm__gap).length; }, 0);
    };

    Deno.test(`${s_name}: the cutting file without the paper's corners is the net's size in mm with all lines, the outline last`, function(){
        let s_svg = f_s_svg({ ...o_setting, b_sheet_dot: false }, 'front');
        assert(!/NaN|undefined|Infinity/.test(s_svg), 'a number is missing');
        let [, s_x, s_y, s_box] = s_svg.match(/<svg [^>]*width="([\d.]+)mm" height="([\d.]+)mm" viewBox="([^"]+)"/);
        assertAlmostEquals(Number(s_x), o_net.n_mm__x, 1e-4, 'width');
        assertAlmostEquals(Number(s_y), o_net.n_mm__y, 1e-4, 'height');
        assert(s_box === `0 0 ${s_x} ${s_y}`, 'viewBox');
        assert(s_svg.includes('<title>VeryOS flextangle</title>'), 'a file of one sheet names no sheet');
        let a_s_id = [...s_svg.matchAll(/<path id="([a-z_]+)"/g)].map(function(o_found){ return o_found[1]; });
        assert(String(a_s_id) === String(['front_fold_valley', 'front_fold_mountain', ...(b_logo ? ['front_logo'] : []), 'front_outline']), String(a_s_id));
        for(let [s_id, n_m] of [['front_outline', 1], ['front_fold_valley', f_n_dash(o_net.a_a_a_n__valley)], ['front_fold_mountain', f_n_dash(o_net.a_a_a_n__mountain)]]){
            let s_d = s_svg.match(new RegExp(`id="${s_id}"[^>]* d="([^"]*)"`))[1];
            assert((s_d.match(/M/g) || []).length === n_m, `${s_id} has ${n_m} lines`);
        }
        assert(/id="front_outline"[^>]* d="[^"]* Z"/.test(s_svg), 'the outline is closed');
        assert((s_svg.match(/<path /g) || []).length === (s_svg.match(/<path [^>]*fill="none"/g) || []).length, 'a path that is no line');
    });

    Deno.test(`${s_name}: with the paper's corners the file is the sheet of paper, the net in it where the sheet has it from its bottom left`, function(){
        // a sheet the largest net lies on
        let o_setting__placed = { ...o_setting, n_mm__sheet_x: 5800, n_mm__sheet_y: 800, n_mm__left: 12.5, n_mm__bottom: 30 };
        let s_svg = f_s_svg(o_setting__placed, 'front');
        assert(!/NaN|undefined|Infinity/.test(s_svg), 'a number is missing');
        assert(/<svg [^>]*width="5800mm" height="800mm" viewBox="0 0 5800 800"/.test(s_svg), 'the sheet\'s size');
        assert(String(f_a_n__box__file(o_setting__placed, 'front').map(function(n){ return +n.toFixed(9); })) === String([-12.5, 30 + o_net.n_mm__y - 800, 5787.5, 30 + o_net.n_mm__y]), 'the file\'s box is the sheet');
        // the outline, read back: its box lies 12.5 from the file's left and 30 from its bottom
        let a_n = s_svg.match(/id="front_outline"[^>]* d="([^"]*)"/)[1].match(/-?[\d.]+/g).map(Number);
        let a_n_x = a_n.filter(function(n, n_idx){ return n_idx % 2 === 0; });
        let a_n_y = a_n.filter(function(n, n_idx){ return n_idx % 2 === 1; });
        assertAlmostEquals(Math.min(...a_n_x), 12.5, 1e-4, 'from the left');
        assertAlmostEquals(Math.max(...a_n_x), 12.5 + o_net.n_mm__x, 1e-4, 'its width');
        assertAlmostEquals(800 - Math.max(...a_n_y), 30, 1e-4, 'from the bottom');
        assertAlmostEquals(Math.max(...a_n_y) - Math.min(...a_n_y), o_net.n_mm__y, 1e-4, 'its height');
    });

    Deno.test(`${s_name}: the logo is dots in its place on the first glue tab, and left out where the tab is too small`, function(){
        let o_line = f_a_o_line(o_setting).find(function(o_line){ return o_line.s_name === 'logo'; });
        assert(Boolean(o_line) === b_logo, `logo ${o_net.o_logo.n_w} wide`);
        if(!b_logo){ return; }
        let o = o_net.o_logo;
        assert(o_line.a_a_o_seg.length > 20, `${o_line.a_a_o_seg.length} dots`);
        for(let a_o_seg of o_line.a_a_o_seg){
            assertAlmostEquals(a_o_seg.reduce(function(n, o_seg){ return n + f_n_len(o_seg); }, 0), 1, 1e-9, 'a dot\'s length');
            for(let a_n of [f_a_n__at(a_o_seg[0], 0), f_a_n__at(a_o_seg.at(-1), f_n_len(a_o_seg.at(-1)))]){
                assert(a_n[0] >= o.n_x - 1e-6 && a_n[0] <= o.n_x + o.n_w + 1e-6 && a_n[1] >= o.n_y - 1e-6 && a_n[1] <= o.n_y + o.n_h + 1e-6, `a dot at ${a_n} beside the logo's place`);
            }
        }
    });

    Deno.test(`${s_name}: a match snaps to the net's corners, each once, none outside the net's box`, function(){
        let a_a_n = f_a_a_n__anchor(o_setting);
        let f_b_there = function(a_n){ return a_a_n.filter(function(a_n__anchor){ return Math.hypot(a_n__anchor[0] - a_n[0], a_n__anchor[1] - a_n[1]) < 1e-9; }).length === 1; };
        for(let a_n of [...o_net.a_a_n__outline, [n_h, n_a / 2], [3 * n_h, 1.5 * n_a], [6 * n_h, 0]]){ assert(f_b_there(a_n), `${a_n} is not there once`); }
        // 21 corners of triangles, 3 places where a glue tab's fold meets the top edge, and
        // the end tabs' corners: 4, or 2 where a tab of half a base ends in a point
        assert(a_a_n.length === 24 + (n_t === n_a / 2 ? 2 : 4), `${a_a_n.length} places`);
        assert(a_a_n.every(function(a_n){ return a_n[0] >= 0 && a_n[0] <= o_net.n_mm__x && a_n[1] >= 0 && a_n[1] <= o_net.n_mm__y; }), 'a place outside the box');
    });
}

Deno.test('the lines are the ones the flextangle app drew before it was a kind of pattern here: a file cut with dash 1.4 and gap 3.9', function(){
    let s_svg = f_s_svg({ ...o_setting__default, n_mm__dash: 1.4, n_mm__gap: 3.9, n_mm__line: 0.45, b_logo: false, b_sheet_dot: false }, 'front');
    // that file's numbers less its margin of 5 mm, which the place on the sheet has taken the place of
    assert(s_svg.includes('<path id="front_outline" fill="none" stroke="#000000" stroke-width="0.45" d="M 0 0 L 240 0 L 248 8 L 248 32 L 240 40 L 248 48 L 248 72 L 240 80 L 200 100 L 160 80 L 120 100 L 80 80 L 40 100 L 0 80 Z"/>'), 'the outline');
    assert(s_svg.includes('<path id="front_fold_valley" fill="none" stroke="#0000ff" stroke-width="0.45" d="M 40 4 L 40 5.4 M 40 9.3 L 40 10.7 M 40 14.6 L 40 16 M 40 26.05 L 40 27.45 M 40 31.35 L 40 32.75 M 40 36.65 L 40 38.05 M 40 41.95 L 40 43.35 M 40 47.25 L 40 48.65 M 40 52.55 L 40 53.95 M 40 66.05 L 40 67.45 '), 'the first valley folds');
});
