// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Objects for the tests, as a loaded file may hold them: triangles, nine numbers each.

let n_tau = Math.PI * 2;

// A ball around a_n_centre. b_inside_out turns its triangles round.
let f_a_n_tri__ball = function(n_r, a_n_centre, n_cnt = 48, b_inside_out = false){
    let a_n = [];
    let f_a_n = function(n_a, n_b){
        return [a_n_centre[0] + n_r * Math.cos(n_b) * Math.cos(n_a), a_n_centre[1] + n_r * Math.cos(n_b) * Math.sin(n_a), a_n_centre[2] + n_r * Math.sin(n_b)];
    };
    let f_add = function(a_n_p, a_n_q, a_n_r){
        if(b_inside_out){ a_n.push(...a_n_p, ...a_n_r, ...a_n_q); } else { a_n.push(...a_n_p, ...a_n_q, ...a_n_r); }
    };
    for(let n_i = 0; n_i < 2 * n_cnt; n_i++){
        for(let n_j = 0; n_j < n_cnt; n_j++){
            let n_a0 = Math.PI * n_i / n_cnt, n_a1 = Math.PI * (n_i + 1) / n_cnt;
            let n_b0 = -Math.PI / 2 + Math.PI * n_j / n_cnt, n_b1 = -Math.PI / 2 + Math.PI * (n_j + 1) / n_cnt;
            if(n_j > 0){ f_add(f_a_n(n_a0, n_b0), f_a_n(n_a1, n_b0), f_a_n(n_a1, n_b1)); }
            if(n_j < n_cnt - 1){ f_add(f_a_n(n_a0, n_b0), f_a_n(n_a1, n_b1), f_a_n(n_a0, n_b1)); }
        }
    }
    return Float32Array.from(a_n);
};

// A box from one corner to the other: twelve triangles.
let f_a_n_tri__box = function(a_n_min, a_n_max){
    let f_a_n = function(n){ return [(n & 1) ? a_n_max[0] : a_n_min[0], (n & 2) ? a_n_max[1] : a_n_min[1], (n & 4) ? a_n_max[2] : a_n_min[2]]; };
    let a_n = [];
    for(let [n_a, n_b, n_c, n_d] of [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]]){
        a_n.push(...f_a_n(n_a), ...f_a_n(n_b), ...f_a_n(n_c), ...f_a_n(n_a), ...f_a_n(n_c), ...f_a_n(n_d));
    }
    return Float32Array.from(a_n);
};

// A ring standing upright, around the y axis: with a hole to look through.
let f_a_n_tri__ring = function(n_r, n_r__tube, n_z, n_cnt = 48){
    let a_n = [];
    let f_a_n = function(n_a, n_b){
        return [(n_r + n_r__tube * Math.cos(n_b)) * Math.cos(n_a), n_r__tube * Math.sin(n_b), n_z + (n_r + n_r__tube * Math.cos(n_b)) * Math.sin(n_a)];
    };
    for(let n_i = 0; n_i < n_cnt; n_i++){
        for(let n_j = 0; n_j < n_cnt; n_j++){
            let n_a0 = n_tau * n_i / n_cnt, n_a1 = n_tau * (n_i + 1) / n_cnt, n_b0 = n_tau * n_j / n_cnt, n_b1 = n_tau * (n_j + 1) / n_cnt;
            a_n.push(...f_a_n(n_a0, n_b0), ...f_a_n(n_a0, n_b1), ...f_a_n(n_a1, n_b1), ...f_a_n(n_a0, n_b0), ...f_a_n(n_a1, n_b1), ...f_a_n(n_a1, n_b0));
        }
    }
    return Float32Array.from(a_n);
};

let f_a_n_tri__joined = function(...a_a_n_tri){
    let a_n = new Float32Array(a_a_n_tri.reduce(function(n_sum, a_n_tri){ return n_sum + a_n_tri.length; }, 0));
    let n_off = 0;
    for(let a_n_tri of a_a_n_tri){
        a_n.set(a_n_tri, n_off);
        n_off += a_n_tri.length;
    }
    return a_n;
};

export { f_a_n_tri__ball, f_a_n_tri__box, f_a_n_tri__ring, f_a_n_tri__joined };
