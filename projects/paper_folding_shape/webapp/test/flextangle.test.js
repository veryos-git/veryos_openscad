// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The net: its outline, folds, tabs and logo where they belong, the dashes on their
// folds with their gaps, and an SVG of the right size, for the defaults and for the
// ends of the settings' ranges.

import { o_setting__default, n_mm__margin, f_o_net, f_a_a_a_n__dash, f_s_svg } from '../flextangle.module.js';

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
    let s_name = Object.values(o_setting).join(' ');
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

    Deno.test(`${s_name}: the SVG is the net's size in mm with all lines`, function(){
        let s_svg = f_s_svg(o_setting);
        assert(!/NaN|undefined|Infinity/.test(s_svg), 'a number is missing');
        let n_x = o_net.n_mm__x + 2 * n_mm__margin, n_y = o_net.n_mm__y + 2 * n_mm__margin;
        let [, s_x, s_y, s_box] = s_svg.match(/<svg [^>]*width="([\d.]+)mm" height="([\d.]+)mm" viewBox="([^"]+)"/);
        assertAlmostEquals(Number(s_x), n_x, 1e-4, 'width');
        assertAlmostEquals(Number(s_y), n_y, 1e-4, 'height');
        assert(s_box === `0 0 ${s_x} ${s_y}`, 'viewBox');
        let f_n_dash = function(a_a_a_n){
            return a_a_a_n.reduce(function(n, a_a_n){ return n + f_a_a_a_n__dash(a_a_n[0], a_a_n[1], o_setting.n_mm__dash, o_setting.n_mm__gap).length; }, 0);
        };
        for(let [s_id, n_m] of [['outline', 1], ['fold_valley', f_n_dash(o_net.a_a_a_n__valley)], ['fold_mountain', f_n_dash(o_net.a_a_a_n__mountain)]]){
            let s_d = s_svg.match(new RegExp(`id="${s_id}"[^>]* d="([^"]*)"`))[1];
            assert((s_d.match(/M/g) || []).length === n_m, `${s_id} has ${n_m} lines`);
        }
        assert(s_svg.includes('id="logo"') === o_setting.b_logo, 'logo');
        assert((s_svg.match(/<g\b/g) || []).length === (s_svg.match(/<\/g>/g) || []).length, 'groups closed');
    });
}
