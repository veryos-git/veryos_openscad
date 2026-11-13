// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The colours of a lampshade's points, r, g, b from 0 to 255 each, as the view and the
// .obj take them.

// The colour of a height from 0 to 1. A stop is {n_t, a_n_col}; two stops on one place
// make a hard edge.
let f_a_n_col__of_stop = function(a_o_stop, n_t){
    let a_o_sorted = [...a_o_stop].sort(function(o_a, o_b){ return o_a.n_t - o_b.n_t; });
    if(n_t <= a_o_sorted[0].n_t){ return a_o_sorted[0].a_n_col; }
    for(let n_idx = 1; n_idx < a_o_sorted.length; n_idx++){
        let o_a = a_o_sorted[n_idx - 1], o_b = a_o_sorted[n_idx];
        if(n_t <= o_b.n_t){
            let n_nor = (n_t - o_a.n_t) / ((o_b.n_t - o_a.n_t) || 1);
            return o_a.a_n_col.map(function(n_col, n_k){ return Math.round(n_col + (o_b.a_n_col[n_k] - n_col) * n_nor); });
        }
    }
    return a_o_sorted[a_o_sorted.length - 1].a_n_col;
};

// A sphere: each point by how far it has moved, so a point that stays gets the colour
// of 0.0, also the neck and the inside.
let f_a_n_col__sphere = function(a_n_height, a_o_stop){
    let a_a_n_col = Array.from({ length: 256 }, function(v, n_idx){ return f_a_n_col__of_stop(a_o_stop, n_idx / 255); });
    let a_n_col = new Uint8Array(a_n_height.length * 3);
    for(let n_idx = 0; n_idx < a_n_height.length; n_idx++){
        a_n_col.set(a_a_n_col[Math.round(a_n_height[n_idx] * 255)], n_idx * 3);
    }
    return a_n_col;
};

// A vase: what is fixed in gold, what the script makes in white.
let f_a_n_col__vase = function(n_cnt__vertex, n_cnt__fixed){
    let a_n_col = new Uint8Array(n_cnt__vertex * 3);
    for(let n_idx = 0; n_idx < n_cnt__vertex; n_idx++){
        a_n_col.set(n_idx < n_cnt__fixed ? [240, 184, 79] : [247, 242, 230], n_idx * 3);
    }
    return a_n_col;
};

// An egg: translucent rose pink, paler where the wall is thin.
let f_a_n_col__egg = function(a_n_wall){
    let a_n_thick = [0.79, 0.17, 0.27], a_n_thin = [0.97, 0.52, 0.60];
    let a_n_col = new Uint8Array(a_n_wall.length * 3);
    for(let n_idx = 0; n_idx < a_n_wall.length; n_idx++){
        let n_thin = Math.exp(-Math.max(a_n_wall[n_idx], 0) * 0.85);
        for(let n_k = 0; n_k < 3; n_k++){
            // The view takes sRGB and shades in linear light, which these two are in.
            a_n_col[n_idx * 3 + n_k] = Math.round(255 * Math.pow(a_n_thick[n_k] + (a_n_thin[n_k] - a_n_thick[n_k]) * n_thin, 1 / 2.2));
        }
    }
    return a_n_col;
};

// An object: white, as the filament it glows through best. An object with colours of
// its own is white where it has none: on the neck and the stem.
let a_n_col__plain = [247, 242, 230];
let f_a_n_col__object = function(n_cnt__vertex){
    let a_n_col = new Uint8Array(n_cnt__vertex * 3);
    for(let n_idx = 0; n_idx < n_cnt__vertex; n_idx++){ a_n_col.set(a_n_col__plain, n_idx * 3); }
    return a_n_col;
};

export { f_a_n_col__of_stop, f_a_n_col__sphere, f_a_n_col__vase, f_a_n_col__egg, f_a_n_col__object, a_n_col__plain };
