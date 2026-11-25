// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The filaments an object prints with, from the colours of its triangles: at most as
// many as the printer has, the colours that cover the most.

// An object without colours, and filaments the file has no colour for.
let a_n_col__plain = [235, 232, 224];
// A colour below this share of the area is not worth a filament of its own.
let n_share__least = 0.002;

let f_n_dist2 = function(a_n_a, a_n_b){
    return (a_n_a[0] - a_n_b[0]) ** 2 + (a_n_a[1] - a_n_b[1]) ** 2 + (a_n_a[2] - a_n_b[2]) ** 2;
};

// The area of each triangle of a mesh.
let f_a_n_mm2 = function(a_n_pos, a_n_idx){
    let a_n_mm2 = new Float64Array(a_n_idx.length / 3);
    for(let n_tri = 0; n_tri < a_n_mm2.length; n_tri++){
        let n_a = a_n_idx[n_tri * 3] * 3, n_b = a_n_idx[n_tri * 3 + 1] * 3, n_c = a_n_idx[n_tri * 3 + 2] * 3;
        let n_ux = a_n_pos[n_b] - a_n_pos[n_a], n_uy = a_n_pos[n_b + 1] - a_n_pos[n_a + 1], n_uz = a_n_pos[n_b + 2] - a_n_pos[n_a + 2];
        let n_vx = a_n_pos[n_c] - a_n_pos[n_a], n_vy = a_n_pos[n_c + 1] - a_n_pos[n_a + 1], n_vz = a_n_pos[n_c + 2] - a_n_pos[n_a + 2];
        a_n_mm2[n_tri] = 0.5 * Math.hypot(n_uy * n_vz - n_uz * n_vy, n_uz * n_vx - n_ux * n_vz, n_ux * n_vy - n_uy * n_vx);
    }
    return a_n_mm2;
};

// Each triangle's filament from 1, and the filaments' colours, the most used first.
// a_n_col__tri: r, g, b from 0 to 255 for each triangle, or null for none. Colours that
// differ by less than 1/16 in each of r, g and b count as one; more of them than
// n_cnt__max are joined by k-means, weighted by area.
let f_o_filament = function(a_n_col__tri, a_n_mm2, n_cnt__max){
    let n_cnt__triangle = a_n_mm2.length;
    if(!a_n_col__tri){ return { a_a_n_col: [a_n_col__plain], a_n_fil: new Uint8Array(n_cnt__triangle).fill(1) }; }
    // Area by colour, and by bins of 16 steps in each of r, g, b: a bin's colour is
    // the one of it that covers the most.
    let o_n_mm2__by_key = new Map();
    for(let n_tri = 0; n_tri < n_cnt__triangle; n_tri++){
        let n_key = (a_n_col__tri[n_tri * 3] << 16) | (a_n_col__tri[n_tri * 3 + 1] << 8) | a_n_col__tri[n_tri * 3 + 2];
        o_n_mm2__by_key.set(n_key, (o_n_mm2__by_key.get(n_key) ?? 0) + a_n_mm2[n_tri]);
    }
    let o_bin__by_bin = new Map();
    for(let [n_key, n_mm2] of o_n_mm2__by_key){
        let n_bin = ((n_key >> 20) & 15) * 256 + ((n_key >> 12) & 15) * 16 + ((n_key >> 4) & 15);
        let o_bin = o_bin__by_bin.get(n_bin);
        if(!o_bin){
            o_bin = { n_mm2: 0, n_mm2__key: -1, a_n_col: null };
            o_bin__by_bin.set(n_bin, o_bin);
        }
        o_bin.n_mm2 += n_mm2;
        if(n_mm2 > o_bin.n_mm2__key){
            o_bin.n_mm2__key = n_mm2;
            o_bin.a_n_col = [(n_key >> 16) & 255, (n_key >> 8) & 255, n_key & 255];
        }
    }
    let a_o_bin = [...o_bin__by_bin.values()].sort(function(o_a, o_b){ return o_b.n_mm2 - o_a.n_mm2; });
    let n_mm2__all = a_o_bin.reduce(function(n_sum, o_bin){ return n_sum + o_bin.n_mm2; }, 0);
    let a_o_kept = a_o_bin.filter(function(o_bin, n_idx){ return n_idx === 0 || o_bin.n_mm2 >= n_share__least * n_mm2__all; });
    let a_a_n_col;
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
    let a_n_fil = new Uint8Array(n_cnt__triangle);
    let a_n_mm2__used = new Float64Array(a_a_n_col.length);
    for(let n_tri = 0; n_tri < n_cnt__triangle; n_tri++){
        let a_n = a_n_col__tri.subarray(n_tri * 3, n_tri * 3 + 3);
        let n_best = 0;
        for(let n_g = 1; n_g < a_a_n_col.length; n_g++){
            if(f_n_dist2(a_a_n_col[n_g], a_n) < f_n_dist2(a_a_n_col[n_best], a_n)){ n_best = n_g; }
        }
        a_n_fil[n_tri] = n_best + 1;
        a_n_mm2__used[n_best] += a_n_mm2[n_tri];
    }
    let a_n_order = a_a_n_col.map(function(v, n_g){ return n_g; }).filter(function(n_g){ return a_n_mm2__used[n_g] > 0; })
        .sort(function(n_a, n_b){ return a_n_mm2__used[n_b] - a_n_mm2__used[n_a]; });
    let a_n_rank = new Uint8Array(a_a_n_col.length);
    a_n_order.forEach(function(n_g, n_rank){ a_n_rank[n_g] = n_rank + 1; });
    for(let n_tri = 0; n_tri < n_cnt__triangle; n_tri++){ a_n_fil[n_tri] = a_n_rank[a_n_fil[n_tri] - 1]; }
    return { a_a_n_col: a_n_order.map(function(n_g){ return a_a_n_col[n_g].map(Math.round); }), a_n_fil };
};

// The filament a part's cut faces and holes print with: the one that most of the edge
// of its cut faces borders, so that the seam is in the colour around it; without cut
// faces the one that covers the most of it. o_mesh as cut.module.js has them.
let f_n_fil__seam = function(o_mesh, a_n_mm2){
    let { a_n_pos, a_n_idx, a_n_fil, a_n_face } = o_mesh;
    let n_cnt__vertex = a_n_pos.length / 3;
    // Each edge of the object's own surface, by its filament.
    let o_n_fil__by_edge = new Map();
    for(let n_tri = 0; n_tri < a_n_face.length; n_tri++){
        if(a_n_face[n_tri] !== 0){ continue; }
        for(let n_k = 0; n_k < 3; n_k++){
            let n_a = a_n_idx[n_tri * 3 + n_k], n_b = a_n_idx[n_tri * 3 + (n_k + 1) % 3];
            o_n_fil__by_edge.set(n_b * n_cnt__vertex + n_a, a_n_fil[n_tri]);
        }
    }
    let a_n_mm = new Float64Array(256);
    for(let n_tri = 0; n_tri < a_n_face.length; n_tri++){
        if(a_n_face[n_tri] === 0){ continue; }
        for(let n_k = 0; n_k < 3; n_k++){
            let n_a = a_n_idx[n_tri * 3 + n_k], n_b = a_n_idx[n_tri * 3 + (n_k + 1) % 3];
            let n_fil = o_n_fil__by_edge.get(n_a * n_cnt__vertex + n_b);
            if(n_fil){ a_n_mm[n_fil] += Math.hypot(a_n_pos[n_a * 3] - a_n_pos[n_b * 3], a_n_pos[n_a * 3 + 1] - a_n_pos[n_b * 3 + 1], a_n_pos[n_a * 3 + 2] - a_n_pos[n_b * 3 + 2]); }
        }
    }
    if(a_n_mm.every(function(n){ return n === 0; })){
        for(let n_tri = 0; n_tri < a_n_face.length; n_tri++){ a_n_mm[a_n_fil[n_tri]] += a_n_mm2[n_tri]; }
        a_n_mm[0] = 0;
    }
    let n_best = 1;
    for(let n_fil = 1; n_fil < 256; n_fil++){
        if(a_n_mm[n_fil] > a_n_mm[n_best]){ n_best = n_fil; }
    }
    return n_best;
};

export { a_n_col__plain, f_a_n_mm2, f_o_filament, f_n_fil__seam };
