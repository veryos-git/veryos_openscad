// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The colours of a bulb's points, r, g, b from 0 to 255 each, as the view and the .obj
// take them; and the filaments a 3MF paints them with.

// An object: white, as the filament it glows through best. An object with colours of
// its own is white where it has none: on the neck and the stem.
let a_n_col__plain = [247, 242, 230];
let f_a_n_col__object = function(n_cnt__vertex){
    let a_n_col = new Uint8Array(n_cnt__vertex * 3);
    for(let n_idx = 0; n_idx < n_cnt__vertex; n_idx++){ a_n_col.set(a_n_col__plain, n_idx * 3); }
    return a_n_col;
};

// A colour group below this share of the area is not worth a filament of its own.
let n_share__least = 0.002;

let f_n_dist2 = function(a_n_a, a_n_b){
    return (a_n_a[0] - a_n_b[0]) ** 2 + (a_n_a[1] - a_n_b[1]) ** 2 + (a_n_a[2] - a_n_b[2]) ** 2;
};

// The filaments for the triangles from n_off__from to n_off__to of a mesh in colours, as
// offsets into a_n_idx: at most n_cnt__max colours, the ones that cover the most. A
// triangle has the colour two of its corners share, else the mean of its corners',
// leaving out plain corners: on the line between two materials it takes one of them,
// not a blend. One with two or three plain corners is the stem's and stays unpainted,
// as the neck. Colours
// that differ by less than 1/16 in each of r, g and b count as one, the one of them
// that covers the most; more of them than filaments are joined by k-means, weighted by
// area. Returns a_a_n_col, the filaments' colours with the most used first, and
// a_n_filament, for each triangle its filament from 1, or 0 for unpainted.
let f_o_filament = function(a_n_pos, a_n_idx, a_n_col, n_off__from, n_off__to, n_cnt__max){
    let n_cnt__triangle = a_n_idx.length / 3;
    let a_n_col__triangle = new Float32Array(n_cnt__triangle * 3);
    let a_n_mm2 = new Float32Array(n_cnt__triangle);
    let a_b_painted = new Uint8Array(n_cnt__triangle);
    // Area by colour, to 1 of 255, and by bins of 16 steps in each of r, g, b.
    let o_n_mm2__by_col = new Map();
    let f_b_plain = function(n_vertex){
        return a_n_col[n_vertex * 3] === a_n_col__plain[0] && a_n_col[n_vertex * 3 + 1] === a_n_col__plain[1] && a_n_col[n_vertex * 3 + 2] === a_n_col__plain[2];
    };
    for(let n_off = n_off__from; n_off < n_off__to; n_off += 3){
        let n_tri = n_off / 3;
        let a_n_corner = [a_n_idx[n_off], a_n_idx[n_off + 1], a_n_idx[n_off + 2]].filter(function(n_vertex){ return !f_b_plain(n_vertex); });
        if(a_n_corner.length < 2){ continue; }
        let n_a = a_n_idx[n_off], n_b = a_n_idx[n_off + 1], n_c = a_n_idx[n_off + 2];
        let n_ux = a_n_pos[n_b * 3] - a_n_pos[n_a * 3], n_uy = a_n_pos[n_b * 3 + 1] - a_n_pos[n_a * 3 + 1], n_uz = a_n_pos[n_b * 3 + 2] - a_n_pos[n_a * 3 + 2];
        let n_vx = a_n_pos[n_c * 3] - a_n_pos[n_a * 3], n_vy = a_n_pos[n_c * 3 + 1] - a_n_pos[n_a * 3 + 1], n_vz = a_n_pos[n_c * 3 + 2] - a_n_pos[n_a * 3 + 2];
        let n_mm2 = 0.5 * Math.hypot(n_uy * n_vz - n_uz * n_vy, n_uz * n_vx - n_ux * n_vz, n_ux * n_vy - n_uy * n_vx);
        a_n_mm2[n_tri] = n_mm2;
        a_b_painted[n_tri] = 1;
        let f_n_key = function(n_vertex){ return (a_n_col[n_vertex * 3] << 16) | (a_n_col[n_vertex * 3 + 1] << 8) | a_n_col[n_vertex * 3 + 2]; };
        let a_n_key = a_n_corner.map(f_n_key);
        let n_key = a_n_key[0] === a_n_key[1] || a_n_key[0] === a_n_key[2] ? a_n_key[0] : (a_n_key[1] === a_n_key[2] ? a_n_key[1] : -1);
        if(n_key < 0){
            n_key = 0;
            for(let n_k = 0; n_k < 3; n_k++){
                n_key = n_key * 256 + Math.round(a_n_corner.reduce(function(n_sum, n_vertex){ return n_sum + a_n_col[n_vertex * 3 + n_k]; }, 0) / a_n_corner.length);
            }
        }
        a_n_col__triangle.set([(n_key >> 16) & 255, (n_key >> 8) & 255, n_key & 255], n_tri * 3);
        o_n_mm2__by_col.set(n_key, (o_n_mm2__by_col.get(n_key) ?? 0) + n_mm2);
    }
    let a_n_mm2__bin = new Float64Array(4096), a_n_key__bin = new Int32Array(4096).fill(-1), a_n_mm2__key = new Float64Array(4096);
    for(let [n_key, n_mm2] of o_n_mm2__by_col){
        let n_bin = ((n_key >> 20) & 15) * 256 + ((n_key >> 12) & 15) * 16 + ((n_key >> 4) & 15);
        a_n_mm2__bin[n_bin] += n_mm2;
        if(n_mm2 > a_n_mm2__key[n_bin]){ a_n_mm2__key[n_bin] = n_mm2; a_n_key__bin[n_bin] = n_key; }
    }
    let n_mm2__all = a_n_mm2__bin.reduce(function(n_sum, n_val){ return n_sum + n_val; }, 0);
    let a_o_bin = [];
    for(let n_bin = 0; n_bin < 4096; n_bin++){
        let n_mm2 = a_n_mm2__bin[n_bin];
        if(n_mm2 <= 0){ continue; }
        let n_key = a_n_key__bin[n_bin];
        a_o_bin.push({ n_mm2, a_n_col: [(n_key >> 16) & 255, (n_key >> 8) & 255, n_key & 255] });
    }
    a_o_bin.sort(function(o_a, o_b){ return o_b.n_mm2 - o_a.n_mm2; });
    let a_o_kept = a_o_bin.filter(function(o_bin, n_idx){ return n_idx === 0 || o_bin.n_mm2 >= n_share__least * n_mm2__all; });
    let a_a_n_col;
    if(a_o_bin.length === 0){
        return { a_a_n_col: [], a_n_filament: new Uint8Array(n_cnt__triangle) };
    }
    if(a_o_kept.length <= n_cnt__max){
        a_a_n_col = a_o_kept.map(function(o_bin){ return o_bin.a_n_col; });
    } else {
        // k-means, starting from the largest colour and then each time the one farthest
        // from those taken, by its area.
        a_a_n_col = [a_o_bin[0].a_n_col];
        while(a_a_n_col.length < n_cnt__max){
            let o_far = null, n_far = -1;
            for(let o_bin of a_o_bin){
                let n_val = o_bin.n_mm2 * Math.min(...a_a_n_col.map(function(a_n){ return f_n_dist2(a_n, o_bin.a_n_col); }));
                if(n_val > n_far){ n_far = n_val; o_far = o_bin; }
            }
            a_a_n_col.push(o_far.a_n_col);
        }
        for(let n_it = 0; n_it < 12; n_it++){
            let a_n_mm2__group = new Float64Array(n_cnt__max), a_n_sum = new Float64Array(n_cnt__max * 3);
            for(let o_bin of a_o_bin){
                let n_best = 0;
                for(let n_g = 1; n_g < n_cnt__max; n_g++){
                    if(f_n_dist2(a_a_n_col[n_g], o_bin.a_n_col) < f_n_dist2(a_a_n_col[n_best], o_bin.a_n_col)){ n_best = n_g; }
                }
                a_n_mm2__group[n_best] += o_bin.n_mm2;
                for(let n_k = 0; n_k < 3; n_k++){ a_n_sum[n_best * 3 + n_k] += o_bin.n_mm2 * o_bin.a_n_col[n_k]; }
            }
            a_a_n_col = a_a_n_col.map(function(a_n, n_g){
                return a_n_mm2__group[n_g] > 0 ? [0, 1, 2].map(function(n_k){ return a_n_sum[n_g * 3 + n_k] / a_n_mm2__group[n_g]; }) : a_n;
            });
        }
    }
    // Each triangle to the nearest; then the most used filament first.
    let a_n_filament = new Uint8Array(n_cnt__triangle);
    let a_n_mm2__used = new Float64Array(a_a_n_col.length);
    for(let n_off = n_off__from; n_off < n_off__to; n_off += 3){
        let n_tri = n_off / 3;
        if(!a_b_painted[n_tri]){ continue; }
        let a_n = a_n_col__triangle.subarray(n_tri * 3, n_tri * 3 + 3);
        let n_best = 0;
        for(let n_g = 1; n_g < a_a_n_col.length; n_g++){
            if(f_n_dist2(a_a_n_col[n_g], a_n) < f_n_dist2(a_a_n_col[n_best], a_n)){ n_best = n_g; }
        }
        a_n_filament[n_tri] = n_best + 1;
        a_n_mm2__used[n_best] += a_n_mm2[n_tri];
    }
    let a_n_order = a_a_n_col.map(function(v, n_g){ return n_g; }).filter(function(n_g){ return a_n_mm2__used[n_g] > 0; })
        .sort(function(n_a, n_b){ return a_n_mm2__used[n_b] - a_n_mm2__used[n_a]; });
    let a_n_rank = new Uint8Array(a_a_n_col.length);
    a_n_order.forEach(function(n_g, n_rank){ a_n_rank[n_g] = n_rank + 1; });
    for(let n_tri = 0; n_tri < n_cnt__triangle; n_tri++){
        if(a_n_filament[n_tri]){ a_n_filament[n_tri] = a_n_rank[a_n_filament[n_tri] - 1]; }
    }
    return {
        a_a_n_col: a_n_order.map(function(n_g){ return a_a_n_col[n_g].map(Math.round); }),
        a_n_filament
    };
};

export { f_a_n_col__object, a_n_col__plain, f_o_filament };
