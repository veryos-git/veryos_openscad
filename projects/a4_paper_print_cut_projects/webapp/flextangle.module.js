// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A kind of pattern, see kind.module.js: the net of a flextangle, a ring of six
// tetrahedra (a kaleidocycle) from one sheet.
//
// Each column of the net is one tetrahedron: four triangles with their base on the
// vertical lines, n_mm__base long, the hinges to the neighbouring tetrahedra, and their
// tip n_mm__base * n_ratio__height away. The net's corners sit at column k, row j with
// k + j even, a row being half a base. The glue tabs along the top go behind the bottom
// row, which closes the tube; the two end tabs on the right go into its open end on the
// left, which closes the ring.
//
// The outline is one solid line. The folds are dashes, each a line of its own, so that a
// cutter cuts them as they are drawn; every fold starts and ends with a gap, so no dash
// touches the outline or another fold.

import { f_o_line, f_a_o_seg__real, n_ratio__logo, f_a_a_o_seg__logo_dot } from './path.module.js';

// What a flextangle has of its own, beside what every project has, see sheet.module.js.
let o_setting__default = {
    n_mm__base: 40,
    // Below 1 the tetrahedra run into each other while turning; 1 closes the middle to a
    // point (../flextangle/rotation_check.py).
    n_ratio__height: 1,
    n_mm__tab: 8,
    n_mm__dash: 2,
    n_mm__gap: 1.5,
    b_logo: true
};
let n_column = 6;
// A glue tab that leaves the logo less than this in width goes without it.
let n_mm__logo_min = 8;

// The net in mm, x to the right, y down, the top left corner at 0, 0: the outline, the
// folds as lines from corner to corner, and the logo's place.
let f_o_net = function(o_setting){
    let n_a = o_setting.n_mm__base;
    let n_h = n_a * o_setting.n_ratio__height;
    let n_t = o_setting.n_mm__tab;
    let f_a_n = function(n_k, n_j){ return [n_k * n_h, n_j * n_a / 2]; };

    let a_a_n__outline = [
        f_a_n(0, 0), f_a_n(6, 0),
        // the end tabs, their corners cut at 45 degrees so that they fit inside the
        // triangles they are glued to
        [6 * n_h + n_t, n_t], [6 * n_h + n_t, n_a - n_t], f_a_n(6, 2),
        [6 * n_h + n_t, n_a + n_t], [6 * n_h + n_t, 2 * n_a - n_t], f_a_n(6, 4),
        f_a_n(5, 5), f_a_n(4, 4), f_a_n(3, 5), f_a_n(2, 4), f_a_n(1, 5), f_a_n(0, 4)
    ];

    // Valley folds, the vertical lines, folded face to face: the hinges, one through the
    // glue tabs, and the end tabs' fold.
    let a_a_a_n__valley = [];
    for(let n_k = 1; n_k <= n_column; n_k++){
        let a_n_j = n_k % 2 ? [0, 1, 3, 5] : [0, 2, 4];
        for(let n_idx = 1; n_idx < a_n_j.length; n_idx++){
            a_a_a_n__valley.push([f_a_n(n_k, a_n_j[n_idx - 1]), f_a_n(n_k, a_n_j[n_idx])]);
        }
    }
    // Mountain folds, the slanted lines, folded back to back: each column's zigzag, the
    // first one the glue tab's fold, the last one the outline.
    let a_a_a_n__mountain = [];
    for(let n_c = 0; n_c < n_column; n_c++){
        let a_a_n = [0, 1, 2, 3, 4].map(function(n_j){ return f_a_n((n_c + n_j) % 2 ? n_c + 1 : n_c, n_j); });
        for(let n_idx = 1; n_idx < a_a_n.length; n_idx++){
            a_a_a_n__mountain.push([a_a_n[n_idx - 1], a_a_n[n_idx]]);
        }
    }

    // The logo on the first glue tab, hidden once glued: the tab is the right triangle
    // 0, 0 / h, 0 / h, a/2; the logo sits in its square corner, a margin away from the
    // top, from the fold at x = h and from the slanted fold, as wide as that leaves.
    let n_m = n_a / 20;
    let n_w = (n_a * (n_h - n_m) - 2 * n_h * n_m - n_m * Math.hypot(n_a, 2 * n_h)) / (n_a + 2 * n_h * n_ratio__logo);
    let o_logo = { n_x: n_h - n_m - n_w, n_y: n_m, n_w, n_h: n_w * n_ratio__logo };

    return {
        a_a_n__outline, a_a_a_n__valley, a_a_a_n__mountain, o_logo,
        n_mm__x: 6 * n_h + n_t,
        n_mm__y: 2.5 * n_a
    };
};

// A fold from p to q as dashes: as many as fit with a gap at both ends, in the middle.
let f_a_a_a_n__dash = function(a_n_p, a_n_q, n_mm__dash, n_mm__gap){
    let n_len = Math.hypot(a_n_q[0] - a_n_p[0], a_n_q[1] - a_n_p[1]);
    // 1e-9: 4.8 / 0.4 is 11.999...; an exact fit keeps its last dash
    let n_count = Math.max(1, Math.floor((n_len - n_mm__gap) / (n_mm__dash + n_mm__gap) + 1e-9));
    let n_dash = Math.min(n_mm__dash, (n_len - (n_count + 1) * n_mm__gap) / n_count);
    if(n_dash <= 0){ return []; }
    let n_start = (n_len - n_count * n_dash - (n_count - 1) * n_mm__gap) / 2;
    let f_a_n = function(n_s){
        return [a_n_p[0] + (a_n_q[0] - a_n_p[0]) * n_s / n_len, a_n_p[1] + (a_n_q[1] - a_n_p[1]) * n_s / n_len];
    };
    let a_a_a_n = [];
    for(let n_idx = 0; n_idx < n_count; n_idx++){
        let n_s = n_start + n_idx * (n_dash + n_mm__gap);
        a_a_a_n.push([f_a_n(n_s), f_a_n(n_s + n_dash)]);
    }
    return a_a_a_n;
};

// The lines of the cutting file, kind by kind in the file's order: s_name, s_colour and
// the paths a_a_o_seg; b_closed where a path ends where it starts. In the net's mm.
let f_a_o_line = function(o_setting){
    let o_net = f_o_net(o_setting);
    let f_a_a_o_seg__fold = function(a_a_a_n){
        return a_a_a_n.flatMap(function(a_a_n){
            return f_a_a_a_n__dash(a_a_n[0], a_a_n[1], o_setting.n_mm__dash, o_setting.n_mm__gap);
        }).map(function(a_a_n){ return [f_o_line(a_a_n[0], a_a_n[1])]; });
    };
    let a_o_line = [
        { s_name: 'fold_valley', s_colour: '#0000ff', a_a_o_seg: f_a_a_o_seg__fold(o_net.a_a_a_n__valley) },
        { s_name: 'fold_mountain', s_colour: '#ff0000', a_a_o_seg: f_a_a_o_seg__fold(o_net.a_a_a_n__mountain) }
    ];
    if(o_setting.b_logo && o_net.o_logo.n_w >= n_mm__logo_min){
        a_o_line.push({ s_name: 'logo', s_colour: '#808080', a_a_o_seg: f_a_a_o_seg__logo_dot([o_net.o_logo.n_x, o_net.o_logo.n_y], o_net.o_logo.n_w, false) });
    }
    // last: a cutter that keeps the file's order cuts the folds before the net comes loose.
    // An end tab of half a base ends in a point: two of the outline's corners are one.
    a_o_line.push({ s_name: 'outline', s_colour: '#000000', b_closed: true, a_a_o_seg: [
        f_a_o_seg__real(o_net.a_a_n__outline.slice(1).map(function(a_n, n_idx){ return f_o_line(o_net.a_a_n__outline[n_idx], a_n); }))
    ] });
    return a_o_line;
};

// The places of the net a picture's point snaps to in a match, beside its box's corners
// and middle: every corner of its outline and every end of a fold.
let f_a_a_n__anchor = function(o_setting){
    let o_net = f_o_net(o_setting);
    let a_a_n = [...o_net.a_a_n__outline, ...o_net.a_a_a_n__valley.flat(), ...o_net.a_a_a_n__mountain.flat()];
    return a_a_n.filter(function(a_n, n_idx){
        return a_a_n.findIndex(function(a_n__other){ return Math.hypot(a_n__other[0] - a_n[0], a_n__other[1] - a_n[1]) < 1e-6; }) === n_idx;
    });
};

let o_kind = {
    s_kind: 'flextangle',
    s_name: 'Flextangle',
    s_noun: 'flextangle',
    s_about: 'One sheet: a ring of six tetrahedra that turns through its own middle',
    a_o_sheet: [{ s_sheet: 'front', s_name: '' }],
    o_setting__default,
    f_a_n__size: function(o_setting){
        let o_net = f_o_net(o_setting);
        return [o_net.n_mm__x, o_net.n_mm__y];
    },
    f_a_o_line,
    f_s_desc: function(){
        return 'Blue: valley folds, dashes to cut; fold them face to face. Red: mountain folds, dashes to cut; fold them back to back. Grey: cut, the logo in dots on a glue tab, hidden once glued. Black: the outline, cut.';
    },
    f_a_s_problem: function(){ return []; },
    f_a_a_n__anchor,
    // pictures loaded together are spread over the net
    f_a_a_n__spot: null,
    f_s_file: function(o_setting){ return `flextangle_${o_setting.n_mm__base}mm`; },
    f_s_summary: function(o_setting){
        let o_net = f_o_net(o_setting);
        return `base ${o_setting.n_mm__base} mm · ${+o_net.n_mm__x.toFixed(1)} × ${+o_net.n_mm__y.toFixed(1)} mm`;
    }
};

export { o_setting__default, n_mm__logo_min, f_o_net, f_a_a_a_n__dash, f_a_o_line, f_a_a_n__anchor, o_kind };
