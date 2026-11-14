// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Reads a 3D object's file into triangles: nine numbers each, x, y, z of its three
// corners. STL, binary or text, and OBJ, with an OBJ's colours: nine numbers each too,
// r, g, b from 0 to 255 of its three corners. And writes triangles as a binary STL.

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

// The materials of an MTL's text by their names: { a_n_col, b_picture }. The colour is
// its Kd; a material that takes its colours from a picture says so.
let f_o_material__by_name = function(s_text){
    let o_material__by_name = new Map();
    let o_material = null;
    for(let s_line of s_text.split('\n')){
        let a_s = s_line.trim().split(/\s+/);
        if(a_s[0] === 'newmtl'){
            o_material = { a_n_col: [255, 255, 255], b_picture: false };
            o_material__by_name.set(s_line.trim().slice(6).trim(), o_material);
        } else if(o_material && a_s[0] === 'Kd'){
            o_material.a_n_col = [1, 2, 3].map(function(n_idx){ return Math.round(255 * Math.max(0, Math.min(1, Number(a_s[n_idx]) || 0))); });
        } else if(o_material && a_s[0] === 'map_Kd'){
            o_material.b_picture = true;
        }
    }
    return o_material__by_name;
};

// Faces of more than three corners become a fan of triangles. A corner is v, v/vt or
// v/vt/vn, counted from 1, or from the end if below 0.
// Colours are a point's own, written behind it as r g b or in ZBrush's #MRGB lines,
// or else its face's material's, from s_text__mtl: the text of the OBJ's MTL, or null.
// One colour alone is none. s_note says why colours the file speaks of are not there.
let f_o_object__from_obj = function(s_text, s_text__mtl){
    let a_n_point = [], a_n_col__point = [], a_n_col__mrgb = [];
    // Each triangle's corners as points, and its material's name.
    let a_n_idx = [], a_s_material = [];
    let b_col__point = false;
    let s_material = '', s_file__mtl = '';
    for(let s_line of s_text.split('\n')){
        if(s_line.startsWith('v ')){
            let a_s = s_line.trim().split(/\s+/);
            a_n_point.push(Number(a_s[1]), Number(a_s[2]), Number(a_s[3]));
            if(a_s.length >= 7){
                b_col__point = true;
                a_n_col__point.push(Number(a_s[4]), Number(a_s[5]), Number(a_s[6]));
            } else {
                a_n_col__point.push(NaN, NaN, NaN);
            }
        } else if(s_line.startsWith('#MRGB ')){
            // Eight letters a point, in the points' order: its mask, then r, g, b.
            let s_hex = s_line.slice(6).trim();
            for(let n_off = 0; n_off + 8 <= s_hex.length; n_off += 8){
                for(let n_k = 2; n_k < 8; n_k += 2){ a_n_col__mrgb.push(parseInt(s_hex.slice(n_off + n_k, n_off + n_k + 2), 16)); }
            }
        } else if(s_line.startsWith('usemtl ')){
            s_material = s_line.slice(7).trim();
        } else if(s_line.startsWith('mtllib ')){
            s_file__mtl = s_line.slice(7).trim();
        } else if(s_line.startsWith('f ')){
            let a_n_idx__face = s_line.trim().split(/\s+/).slice(1).map(function(s_corner){
                let n_idx = parseInt(s_corner, 10);
                return n_idx < 0 ? a_n_point.length / 3 + n_idx : n_idx - 1;
            });
            for(let n_it = 1; n_it < a_n_idx__face.length - 1; n_it++){
                for(let n_idx of [a_n_idx__face[0], a_n_idx__face[n_it], a_n_idx__face[n_it + 1]]){
                    if(!(n_idx >= 0 && n_idx < a_n_point.length / 3)){ throw new Error('This OBJ has a face with a corner that is not there.'); }
                    a_n_idx.push(n_idx);
                }
                a_s_material.push(s_material);
            }
        }
    }
    let a_n_tri = new Float32Array(a_n_idx.length * 3);
    for(let n_it = 0; n_it < a_n_idx.length; n_it++){
        for(let n_k = 0; n_k < 3; n_k++){ a_n_tri[n_it * 3 + n_k] = a_n_point[a_n_idx[n_it] * 3 + n_k]; }
    }

    let a_n_col = null, s_note = '';
    if(a_n_col__mrgb.length >= a_n_point.length || b_col__point){
        let b_mrgb = a_n_col__mrgb.length >= a_n_point.length;
        // Written from 0 to 1 by most programs, from 0 to 255 by some.
        let n_scl = b_mrgb || a_n_col__point.some(function(n_val){ return n_val > 1; }) ? 1 : 255;
        a_n_col = new Uint8Array(a_n_idx.length * 3);
        for(let n_it = 0; n_it < a_n_idx.length; n_it++){
            for(let n_k = 0; n_k < 3; n_k++){
                let n_val = (b_mrgb ? a_n_col__mrgb : a_n_col__point)[a_n_idx[n_it] * 3 + n_k];
                // A point without a colour among those with one is white.
                a_n_col[n_it * 3 + n_k] = Number.isFinite(n_val) ? Math.round(Math.max(0, Math.min(255, n_val * n_scl))) : 255;
            }
        }
    } else if(a_s_material.some(function(s){ return s !== ''; })){
        if(s_text__mtl === null){
            s_note = `Its colours are in ${s_file__mtl || 'its .mtl file'}: choose both files together to have them.`;
        } else {
            let o_material__by_name = f_o_material__by_name(s_text__mtl);
            a_n_col = new Uint8Array(a_n_idx.length * 3);
            let b_picture = false;
            for(let n_it = 0; n_it < a_s_material.length; n_it++){
                let o_material = o_material__by_name.get(a_s_material[n_it]);
                b_picture ||= Boolean(o_material?.b_picture);
                for(let n_k = 0; n_k < 9; n_k++){ a_n_col[n_it * 9 + n_k] = o_material ? o_material.a_n_col[n_k % 3] : 255; }
            }
            if(b_picture){ s_note = 'Its colours are a picture, a texture, which is not read: only the colours of points and of materials are.'; }
        }
    }
    if(a_n_col){
        let b_one = true;
        for(let n_off = 3; n_off < a_n_col.length && b_one; n_off++){ b_one = a_n_col[n_off] === a_n_col[n_off % 3]; }
        if(b_one){ a_n_col = null; }
    }
    return { a_n_tri, a_n_col, s_note };
};

// A file's triangles, by what the file is, not by its name alone: a binary STL is as
// long as its count of triangles says. With them an OBJ's colours, a_n_col, or null,
// and s_note, see above.
let f_o_object__from_file = function(a_n_u8, s_name = '', s_text__mtl = null){
    let o_object;
    let b_stl_binary = a_n_u8.length >= n_scl__stl_head
        && a_n_u8.length === n_scl__stl_head + n_scl__stl_triangle * new DataView(a_n_u8.buffer, a_n_u8.byteOffset, a_n_u8.byteLength).getUint32(80, true);
    if(b_stl_binary){
        o_object = { a_n_tri: f_a_n_tri__from_stl_binary(a_n_u8), a_n_col: null, s_note: '' };
    } else {
        let s_text = new TextDecoder().decode(a_n_u8);
        if(/^\s*solid\b/.test(s_text.slice(0, 200)) && /facet/.test(s_text.slice(0, 4000))){
            o_object = { a_n_tri: f_a_n_tri__from_stl_text(s_text), a_n_col: null, s_note: '' };
        } else if(/\.obj$/i.test(s_name) || /^v\s+\S+\s+\S+\s+\S+/m.test(s_text.slice(0, 20000))){
            o_object = f_o_object__from_obj(s_text, s_text__mtl);
        } else {
            throw new Error(`Cannot read ${s_name || 'this file'}: it is neither an STL nor an OBJ.`);
        }
    }
    if(o_object.a_n_tri.length === 0){ throw new Error(`${s_name || 'This file'} has no triangles.`); }
    for(let n_val of o_object.a_n_tri){
        if(!Number.isFinite(n_val)){ throw new Error(`${s_name || 'This file'} has a corner that is not a number.`); }
    }
    return o_object;
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

// Triangles as a binary STL, to keep a bulb's object beside its settings.
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

export { f_o_object__from_file, f_o_bound, f_o_buffer__stl_of_tri };
