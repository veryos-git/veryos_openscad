// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The flextangle's net as an SVG to print or cut: a ring of six tetrahedra (a
// kaleidocycle) from one sheet.
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

let o_setting__default = {
    n_mm__base: 40,
    // Below 1 the tetrahedra run into each other while turning; 1 closes the middle to a
    // point (../rotation_check.py).
    n_ratio__height: 1,
    n_mm__tab: 8,
    n_mm__dash: 2,
    n_mm__gap: 1.5,
    n_mm__line: 0.2,
    b_logo: true
};
let n_mm__margin = 5;
let n_column = 6;

// veryos_logo.svg, 43.9095293518 x 31.2528266758.
let s_d__logo = 'M 7.7528133542 9.1080260785 L 4.6193976626 1.5432914191 L 0 3.4567085809 L 11.5135290962 31.2528266758 L 32.3960002556 31.2528266758 L 43.9095293518 3.4567085809 L 39.2901316892 1.5432914191 L 36.1567159975 9.1080260785 A 15.6264133379 15.6264133379 0 0 0 7.7528133542 9.1080260785 Z M 30.9694268093 21.2528266758 A 10.6264133379 10.6264133379 0 0 0 21.9547646759 5 A 4.0632066689 4.0632066689 0 0 0 21.9547646759 13.1264133379 A 9.0632066689 9.0632066689 0 0 1 30.9694268093 21.2528266758 Z M 12.9401025425 10 A 9.0632066689 9.0632066689 0 0 0 21.9547646759 18.1264133379 A 4.0632066689 4.0632066689 0 0 1 21.9547646759 26.2528266758 A 10.6264133379 10.6264133379 0 0 1 12.9401025425 10 Z';
let n_mm__logo_x = 43.9095293518;
let n_mm__logo_y = 31.2528266758;

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
    let n_aspect = n_mm__logo_x / n_mm__logo_y;
    let n_w = (n_a * (n_h - n_m) - 2 * n_h * n_m - n_m * Math.hypot(n_a, 2 * n_h)) / (n_a + 2 * n_h / n_aspect);
    let o_logo = { n_x: n_h - n_m - n_w, n_y: n_m, n_w, n_h: n_w / n_aspect };

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

let f_s_n = function(n){ return String(+n.toFixed(4)); };

let f_s_svg = function(o_setting){
    let o_net = f_o_net(o_setting);
    let f_s_xy = function(a_n){ return `${f_s_n(a_n[0] + n_mm__margin)} ${f_s_n(a_n[1] + n_mm__margin)}`; };
    let f_s_d__fold = function(a_a_a_n){
        return a_a_a_n.flatMap(function(a_a_n){
            return f_a_a_a_n__dash(a_a_n[0], a_a_n[1], o_setting.n_mm__dash, o_setting.n_mm__gap);
        }).map(function(a_a_n){ return `M ${f_s_xy(a_a_n[0])} L ${f_s_xy(a_a_n[1])}`; }).join(' ');
    };
    let n_mm__x = o_net.n_mm__x + 2 * n_mm__margin;
    let n_mm__y = o_net.n_mm__y + 2 * n_mm__margin;
    let o_logo = o_net.o_logo;
    let a_s = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<svg xmlns="http://www.w3.org/2000/svg" width="${f_s_n(n_mm__x)}mm" height="${f_s_n(n_mm__y)}mm" viewBox="0 0 ${f_s_n(n_mm__x)} ${f_s_n(n_mm__y)}">`,
        '<title>VeryOS flextangle</title>',
        `<desc>${Object.entries(o_setting).map(function(a_v){ return `${a_v[0]} ${a_v[1]}`; }).join(', ')}. Cut the outline, fold the valley folds face to face and the mountain folds back to back.</desc>`,
        `<g fill="none" stroke-width="${f_s_n(o_setting.n_mm__line)}">`,
        `<path id="outline" stroke="#000000" stroke-linejoin="round" d="M ${o_net.a_a_n__outline.map(f_s_xy).join(' L ')} Z"/>`,
        `<path id="fold_valley" stroke="#0000ff" d="${f_s_d__fold(o_net.a_a_a_n__valley)}"/>`,
        `<path id="fold_mountain" stroke="#ff0000" d="${f_s_d__fold(o_net.a_a_a_n__mountain)}"/>`,
        '</g>'
    ];
    if(o_setting.b_logo){
        a_s.push(`<path id="logo" fill="#808080" fill-rule="evenodd" transform="translate(${f_s_n(o_logo.n_x + n_mm__margin)} ${f_s_n(o_logo.n_y + n_mm__margin)}) scale(${f_s_n(o_logo.n_w / n_mm__logo_x)})" d="${s_d__logo}"/>`);
    }
    a_s.push('</svg>', '');
    return a_s.join('\n');
};

export { o_setting__default, n_mm__margin, f_o_net, f_a_a_a_n__dash, f_s_svg };
