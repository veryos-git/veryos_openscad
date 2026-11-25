// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A sheet from its picture: the picture is a grid of values from 0 (nothing) to 1
// (material), one per pixel; its outline is traced at the level 0.5 and written as
// the SVG a cutter cuts and OpenSCAD extrudes. No browser needed: the page fills the
// grid from a canvas, the tests fill it by hand.
// A pixel i covers i to i + 1 and holds the value at its middle. Outside the grid is
// nothing, so material up to the grid's edge ends exactly on it. The outline runs
// between the pixels' middles, which cuts every sharp corner by half a pixel.

// The four edges of a cell between four pixel middles, and where they cross in a cell
// of size 1: top, right, bottom, left.
let a_a_n_middle = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
let a_a_n_corner = [[0, 0], [1, 0], [1, 1], [0, 1]];

// Corners as bits: top left 8, top right 4, bottom right 2, bottom left 1.
// Per case the pairs of edges a segment joins, and the corner that tells its direction.
let o_a_a_n_segment__by_case = {
    1: [[3, 2, 3]], 2: [[2, 1, 2]], 3: [[3, 1, 0]], 4: [[0, 1, 1]], 6: [[0, 2, 0]], 7: [[0, 3, 0]],
    8: [[0, 3, 0]], 9: [[0, 2, 0]], 11: [[0, 1, 1]], 12: [[3, 1, 0]], 13: [[2, 1, 2]], 14: [[3, 2, 3]],
    // the two saddles: joined through the cell's middle, or apart
    '5j': [[0, 3, 0], [2, 1, 2]], '5a': [[0, 1, 1], [3, 2, 3]],
    '10j': [[0, 1, 1], [3, 2, 3]], '10a': [[0, 3, 0], [2, 1, 2]]
};

// Every segment directed so that the material lies on the same side of it: outlines and
// the holes in them then run opposite ways.
let o_a_a_n_directed__by_case = (function(){
    let o = {};
    for(let [s_case, a_a_n_segment] of Object.entries(o_a_a_n_segment__by_case)){
        let n_bits = parseInt(s_case);
        o[s_case] = a_a_n_segment.map(function([n_from, n_to, n_corner]){
            let b_inside = (n_bits & (8 >> n_corner)) !== 0;
            let [n_x1, n_y1] = a_a_n_middle[n_from], [n_x2, n_y2] = a_a_n_middle[n_to], [n_xc, n_yc] = a_a_n_corner[n_corner];
            let n_cross = (n_x2 - n_x1) * (n_yc - n_y1) - (n_y2 - n_y1) * (n_xc - n_x1);
            return (n_cross > 0) === b_inside ? [n_from, n_to] : [n_to, n_from];
        });
    }
    return o;
})();

// The closed outlines of the material in the grid, each a flat list x, y, x, y, ... in
// pixels. Outlines of material run one way, holes the other.
let f_a_a_n__outline = function(a_n_value, n_w, n_h, n_level = 0.5){
    let n_w2 = n_w + 2, n_h2 = n_h + 2;
    // the grid with a ring of nothing around it
    let f_n = function(n_i, n_j){
        return n_i < 0 || n_j < 0 || n_i >= n_w || n_j >= n_h ? 0 : a_n_value[n_j * n_w + n_i];
    };
    // An edge between two pixel middles, by the pixel it starts at: 2 * index for the one to
    // the right, 2 * index + 1 for the one down.
    let f_n_edge = function(n_i, n_j, n_side){
        if(n_side === 0){ return 2 * ((n_j + 1) * n_w2 + n_i + 1); }
        if(n_side === 1){ return 2 * ((n_j + 1) * n_w2 + n_i + 2) + 1; }
        if(n_side === 2){ return 2 * ((n_j + 2) * n_w2 + n_i + 1); }
        return 2 * ((n_j + 1) * n_w2 + n_i + 1) + 1;
    };
    let a_n_next = new Int32Array(2 * n_w2 * n_h2).fill(-1);
    for(let n_j = -1; n_j < n_h; n_j++){
        for(let n_i = -1; n_i < n_w; n_i++){
            let n_tl = f_n(n_i, n_j), n_tr = f_n(n_i + 1, n_j), n_br = f_n(n_i + 1, n_j + 1), n_bl = f_n(n_i, n_j + 1);
            let n_bits = (n_tl >= n_level ? 8 : 0) | (n_tr >= n_level ? 4 : 0) | (n_br >= n_level ? 2 : 0) | (n_bl >= n_level ? 1 : 0);
            if(n_bits === 0 || n_bits === 15){ continue; }
            let s_case = String(n_bits);
            // pixels that touch at a corner only are apart: joined they would hang by a hair
            if(n_bits === 5 || n_bits === 10){ s_case += (n_tl + n_tr + n_br + n_bl) / 4 > n_level ? 'j' : 'a'; }
            for(let [n_from, n_to] of o_a_a_n_directed__by_case[s_case]){
                a_n_next[f_n_edge(n_i, n_j, n_from)] = f_n_edge(n_i, n_j, n_to);
            }
        }
    }
    // Where the level lies on an edge, between the two values at its ends.
    let f_push_point = function(a_n, n_edge){
        let n_idx = n_edge >> 1;
        let n_i = n_idx % n_w2 - 1, n_j = Math.floor(n_idx / n_w2) - 1;
        let n_a = f_n(n_i, n_j);
        if(n_edge & 1){
            a_n.push(n_i + 0.5, n_j + 0.5 + (n_level - n_a) / (f_n(n_i, n_j + 1) - n_a));
        } else{
            a_n.push(n_i + 0.5 + (n_level - n_a) / (f_n(n_i + 1, n_j) - n_a), n_j + 0.5);
        }
    };
    let a_a_n = [];
    for(let n_start = 0; n_start < a_n_next.length; n_start++){
        if(a_n_next[n_start] < 0){ continue; }
        let a_n = [];
        let n_edge = n_start;
        while(a_n_next[n_edge] >= 0){
            f_push_point(a_n, n_edge);
            let n_to = a_n_next[n_edge];
            a_n_next[n_edge] = -1;
            n_edge = n_to;
        }
        a_a_n.push(a_n);
    }
    return a_a_n;
};

// Twice the area inside a closed outline; its sign tells which way it runs.
let f_n_area2 = function(a_n){
    let n = 0;
    for(let n_off = 0; n_off < a_n.length; n_off += 2){
        let n_off2 = (n_off + 2) % a_n.length;
        n += a_n[n_off] * a_n[n_off2 + 1] - a_n[n_off2] * a_n[n_off + 1];
    }
    return n;
};

// The material's area: outlines and holes run opposite ways, so the holes subtract.
let f_n_area = function(a_a_n){
    return Math.abs(a_a_n.reduce(function(n, a_n){ return n + f_n_area2(a_n); }, 0)) / 2;
};

// A closed outline with fewer points, none of the left out ones further than n_tolerance
// from it (Douglas-Peucker, from the first point and the one furthest from it).
let f_a_n__simplified = function(a_n, n_tolerance){
    let n_cnt = a_n.length / 2;
    if(n_cnt < 4){ return a_n.slice(); }
    let n_far = 0, n_dist__far = -1;
    for(let n_it = 1; n_it < n_cnt; n_it++){
        let n_dist = Math.hypot(a_n[2 * n_it] - a_n[0], a_n[2 * n_it + 1] - a_n[1]);
        if(n_dist > n_dist__far){ n_dist__far = n_dist; n_far = n_it; }
    }
    let a_b_keep = new Uint8Array(n_cnt + 1);
    a_b_keep[0] = a_b_keep[n_far] = a_b_keep[n_cnt] = 1;
    // point n_cnt is the first point again, which closes the outline
    let f_n_x = function(n_it){ return a_n[2 * (n_it % n_cnt)]; };
    let f_n_y = function(n_it){ return a_n[2 * (n_it % n_cnt) + 1]; };
    let a_a_n_span = [[0, n_far], [n_far, n_cnt]];
    while(a_a_n_span.length){
        let [n_from, n_to] = a_a_n_span.pop();
        let n_x = f_n_x(n_from), n_y = f_n_y(n_from);
        let n_dx = f_n_x(n_to) - n_x, n_dy = f_n_y(n_to) - n_y;
        let n_len = Math.hypot(n_dx, n_dy);
        let n_idx = -1, n_dist__max = n_tolerance;
        for(let n_it = n_from + 1; n_it < n_to; n_it++){
            let n_px = f_n_x(n_it) - n_x, n_py = f_n_y(n_it) - n_y;
            let n_dist = n_len > 0 ? Math.abs(n_dx * n_py - n_dy * n_px) / n_len : Math.hypot(n_px, n_py);
            if(n_dist > n_dist__max){ n_dist__max = n_dist; n_idx = n_it; }
        }
        if(n_idx >= 0){
            a_b_keep[n_idx] = 1;
            a_a_n_span.push([n_from, n_idx], [n_idx, n_to]);
        }
    }
    let a_n_out = [];
    for(let n_it = 0; n_it < n_cnt; n_it++){
        if(a_b_keep[n_it]){ a_n_out.push(a_n[2 * n_it], a_n[2 * n_it + 1]); }
    }
    return a_n_out;
};

// The outlines in mm of a sheet n_mm__x by n_mm__y, which the grid covers: simplified,
// and without the specks a cutter or a nozzle cannot make.
let f_a_a_n__sheet = function(a_n_value, n_w, n_h, n_mm__x, n_mm__y, n_mm__tolerance = 0.03, n_mm2__speck = 0.05){
    let a_a_n = [];
    for(let a_n of f_a_a_n__outline(a_n_value, n_w, n_h)){
        let a_n_mm = f_a_n__simplified(a_n.map(function(n, n_idx){ return n_idx % 2 ? n * n_mm__y / n_h : n * n_mm__x / n_w; }), n_mm__tolerance);
        if(a_n_mm.length >= 6 && Math.abs(f_n_area2(a_n_mm)) / 2 >= n_mm2__speck){ a_a_n.push(a_n_mm); }
    }
    return a_a_n;
};

let f_s_number = function(n){
    return String(Math.round(n * 1000) / 1000);
};

// The sheet as an SVG in mm, 1 : 1, one path of all outlines, filled by the even-odd
// rule. The server checks for exactly this form before it hands a file to OpenSCAD.
let f_s_svg__sheet = function(a_a_n, n_mm__x, n_mm__y){
    let s_path = a_a_n.map(function(a_n){
        let a_s = [];
        for(let n_off = 0; n_off < a_n.length; n_off += 2){
            a_s.push(`${n_off ? 'L' : 'M'}${f_s_number(a_n[n_off])} ${f_s_number(a_n[n_off + 1])}`);
        }
        return a_s.join('') + 'Z';
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${f_s_number(n_mm__x)}mm" height="${f_s_number(n_mm__y)}mm" viewBox="0 0 ${f_s_number(n_mm__x)} ${f_s_number(n_mm__y)}"><path fill-rule="evenodd" d="${s_path}"/></svg>`;
};
let o_regex__svg_sheet = /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="[0-9.]+mm" height="[0-9.]+mm" viewBox="0 0 [0-9.]+ [0-9.]+"><path fill-rule="evenodd" d="[MLZ0-9. -]*"\/><\/svg>$/;

// How many pieces the material falls into once it is cut: pixels at or above 0.5 that
// touch along an edge are one piece. More than one: the others are loose.
let f_n_cnt__piece = function(a_n_value, n_w, n_h, n_cnt__pixel_min = 4){
    let a_n_seen = new Uint8Array(n_w * n_h);
    let a_n_stack = new Int32Array(n_w * n_h);
    let n_cnt = 0;
    for(let n_start = 0; n_start < n_w * n_h; n_start++){
        if(a_n_seen[n_start] || a_n_value[n_start] < 0.5){ continue; }
        let n_cnt__pixel = 0, n_top = 0;
        a_n_stack[n_top++] = n_start;
        a_n_seen[n_start] = 1;
        while(n_top){
            let n_idx = a_n_stack[--n_top];
            n_cnt__pixel++;
            let n_i = n_idx % n_w;
            for(let n_idx2 of [n_i > 0 ? n_idx - 1 : -1, n_i < n_w - 1 ? n_idx + 1 : -1, n_idx - n_w, n_idx + n_w]){
                if(n_idx2 < 0 || n_idx2 >= n_w * n_h || a_n_seen[n_idx2] || a_n_value[n_idx2] < 0.5){ continue; }
                a_n_seen[n_idx2] = 1;
                a_n_stack[n_top++] = n_idx2;
            }
        }
        if(n_cnt__pixel >= n_cnt__pixel_min){ n_cnt++; }
    }
    return n_cnt;
};

// The material of a sheet from the ink of its picture: a frame all around, n_px__frame
// wide, and inside it the picture itself (solid) or all but the picture (cut).
let f_a_n__material = function(a_n_ink, n_w, n_h, s_mode, n_px__frame){
    let a_n = new Float32Array(n_w * n_h);
    for(let n_j = 0; n_j < n_h; n_j++){
        for(let n_i = 0; n_i < n_w; n_i++){
            let n_idx = n_j * n_w + n_i;
            // how much of the pixel lies in the frame: 1 in it, 0 inside the window
            let n_edge = Math.min(n_i, n_j, n_w - 1 - n_i, n_h - 1 - n_j) + 1;
            let n_frame = Math.max(0, Math.min(1, n_px__frame - n_edge + 1));
            let n_inside = s_mode === 'cut' ? 1 - a_n_ink[n_idx] : a_n_ink[n_idx];
            a_n[n_idx] = Math.max(n_frame, n_inside);
        }
    }
    return a_n;
};

export {
    f_a_a_n__outline,
    f_a_n__simplified,
    f_a_a_n__sheet,
    f_n_area,
    f_n_area2,
    f_s_svg__sheet,
    o_regex__svg_sheet,
    f_n_cnt__piece,
    f_a_n__material
};
