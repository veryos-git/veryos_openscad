// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Reads a 3D object's file into triangles: nine numbers each, x, y, z of its three
// corners. STL, binary or text, and OBJ. And writes triangles as a binary STL.

let n_scl__stl_head = 84;
let n_scl__stl_triangle = 50;

let f_a_n_tri__from_stl_binary = function(a_n_u8){
    let o_view = new DataView(a_n_u8.buffer, a_n_u8.byteOffset, a_n_u8.byteLength);
    let n_cnt = o_view.getUint32(80, true);
    let a_n_tri = new Float32Array(n_cnt * 9);
    for(let n_it = 0; n_it < n_cnt; n_it++){
        // After the triangle's normal, which is made anew where it is needed.
        let n_off = n_scl__stl_head + n_it * n_scl__stl_triangle + 12;
        for(let n_k = 0; n_k < 9; n_k++){ a_n_tri[n_it * 9 + n_k] = o_view.getFloat32(n_off + n_k * 4, true); }
    }
    return a_n_tri;
};

let f_a_n_tri__from_stl_text = function(s_text){
    let a_n = [];
    for(let a_s of s_text.matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)){
        a_n.push(Number(a_s[1]), Number(a_s[2]), Number(a_s[3]));
    }
    if(a_n.length % 9 !== 0){ throw new Error('This STL ends in the middle of a triangle.'); }
    return Float32Array.from(a_n);
};

// Faces of more than three corners become a fan of triangles. A corner is v, v/vt or
// v/vt/vn, counted from 1, or from the end if below 0.
let f_a_n_tri__from_obj = function(s_text){
    let a_n_point = [];
    let a_n = [];
    for(let s_line of s_text.split('\n')){
        if(s_line.startsWith('v ')){
            let a_s = s_line.trim().split(/\s+/);
            a_n_point.push(Number(a_s[1]), Number(a_s[2]), Number(a_s[3]));
        } else if(s_line.startsWith('f ')){
            let a_n_idx = s_line.trim().split(/\s+/).slice(1).map(function(s_corner){
                let n_idx = parseInt(s_corner, 10);
                return n_idx < 0 ? a_n_point.length / 3 + n_idx : n_idx - 1;
            });
            for(let n_it = 1; n_it < a_n_idx.length - 1; n_it++){
                for(let n_idx of [a_n_idx[0], a_n_idx[n_it], a_n_idx[n_it + 1]]){
                    if(!(n_idx >= 0 && n_idx < a_n_point.length / 3)){ throw new Error('This OBJ has a face with a corner that is not there.'); }
                    a_n.push(a_n_point[n_idx * 3], a_n_point[n_idx * 3 + 1], a_n_point[n_idx * 3 + 2]);
                }
            }
        }
    }
    return Float32Array.from(a_n);
};

// A file's triangles, by what the file is, not by its name alone: a binary STL is as
// long as its count of triangles says.
let f_a_n_tri__from_file = function(a_n_u8, s_name = ''){
    let a_n_tri;
    let b_stl_binary = a_n_u8.length >= n_scl__stl_head
        && a_n_u8.length === n_scl__stl_head + n_scl__stl_triangle * new DataView(a_n_u8.buffer, a_n_u8.byteOffset, a_n_u8.byteLength).getUint32(80, true);
    if(b_stl_binary){
        a_n_tri = f_a_n_tri__from_stl_binary(a_n_u8);
    } else {
        let s_text = new TextDecoder().decode(a_n_u8);
        if(/^\s*solid\b/.test(s_text.slice(0, 200)) && /facet/.test(s_text.slice(0, 4000))){
            a_n_tri = f_a_n_tri__from_stl_text(s_text);
        } else if(/\.obj$/i.test(s_name) || /^v\s+\S+\s+\S+\s+\S+/m.test(s_text.slice(0, 20000))){
            a_n_tri = f_a_n_tri__from_obj(s_text);
        } else {
            throw new Error(`Cannot read ${s_name || 'this file'}: it is neither an STL nor an OBJ.`);
        }
    }
    if(a_n_tri.length === 0){ throw new Error(`${s_name || 'This file'} has no triangles.`); }
    for(let n_val of a_n_tri){
        if(!Number.isFinite(n_val)){ throw new Error(`${s_name || 'This file'} has a corner that is not a number.`); }
    }
    return a_n_tri;
};

// The box around triangles: its lowest and its highest corner.
let f_o_bound = function(a_n_tri){
    let a_n_min = [Infinity, Infinity, Infinity], a_n_max = [-Infinity, -Infinity, -Infinity];
    for(let n_off = 0; n_off < a_n_tri.length; n_off += 3){
        for(let n_k = 0; n_k < 3; n_k++){
            let n_val = a_n_tri[n_off + n_k];
            if(n_val < a_n_min[n_k]){ a_n_min[n_k] = n_val; }
            if(n_val > a_n_max[n_k]){ a_n_max[n_k] = n_val; }
        }
    }
    return { a_n_min, a_n_max };
};

// Triangles as a binary STL, to keep a lamp's object beside its settings.
let f_o_buffer__stl_of_tri = function(a_n_tri){
    let n_cnt = a_n_tri.length / 9;
    let o_buffer = new ArrayBuffer(n_scl__stl_head + n_cnt * n_scl__stl_triangle);
    let o_view = new DataView(o_buffer);
    o_view.setUint32(80, n_cnt, true);
    for(let n_it = 0; n_it < n_cnt; n_it++){
        let n_off = n_scl__stl_head + n_it * n_scl__stl_triangle;
        let a_n = a_n_tri.subarray(n_it * 9, n_it * 9 + 9);
        let n_ux = a_n[3] - a_n[0], n_uy = a_n[4] - a_n[1], n_uz = a_n[5] - a_n[2];
        let n_vx = a_n[6] - a_n[0], n_vy = a_n[7] - a_n[1], n_vz = a_n[8] - a_n[2];
        let n_nx = n_uy * n_vz - n_uz * n_vy, n_ny = n_uz * n_vx - n_ux * n_vz, n_nz = n_ux * n_vy - n_uy * n_vx;
        let n_len = Math.hypot(n_nx, n_ny, n_nz) || 1;
        o_view.setFloat32(n_off, n_nx / n_len, true);
        o_view.setFloat32(n_off + 4, n_ny / n_len, true);
        o_view.setFloat32(n_off + 8, n_nz / n_len, true);
        for(let n_k = 0; n_k < 9; n_k++){ o_view.setFloat32(n_off + 12 + n_k * 4, a_n[n_k], true); }
    }
    return o_buffer;
};

export { f_a_n_tri__from_file, f_o_bound, f_o_buffer__stl_of_tri };
