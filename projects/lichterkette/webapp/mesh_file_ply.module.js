// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Reads a PLY, as text or as numbers either way round: its faces, fanned into
// triangles, in the colours of their points (red, green, blue) or of the faces
// themselves. A PLY of points alone, a scan's cloud or a Gaussian splat, has no surface
// to make a bulb of, and says so.

import { f_a_n_col__or_null } from './texture.module.js';

let o_type__by_name = {
    char: ['getInt8', 1], int8: ['getInt8', 1], uchar: ['getUint8', 1], uint8: ['getUint8', 1],
    short: ['getInt16', 2], int16: ['getInt16', 2], ushort: ['getUint16', 2], uint16: ['getUint16', 2],
    int: ['getInt32', 4], int32: ['getInt32', 4], uint: ['getUint32', 4], uint32: ['getUint32', 4],
    float: ['getFloat32', 4], float32: ['getFloat32', 4], double: ['getFloat64', 8], float64: ['getFloat64', 8]
};
// What a colour's number is at its fullest, by its type.
let o_n_full__by_type = { uchar: 255, uint8: 255, char: 127, int8: 127, ushort: 65535, uint16: 65535, short: 32767, int16: 32767, float: 1, float32: 1, double: 1, float64: 1, int: 255, int32: 255, uint: 255, uint32: 255 };
let a_a_s_col = [['red', 'green', 'blue'], ['r', 'g', 'b'], ['diffuse_red', 'diffuse_green', 'diffuse_blue']];

let f_o_object__from_ply = function(a_n_u8, s_name){
    let n_end = -1;
    for(let n_off = 0; n_off < Math.min(a_n_u8.length, 1 << 16); n_off++){
        // "end_header" and its line's end.
        if(a_n_u8[n_off] === 0x65 && new TextDecoder().decode(a_n_u8.subarray(n_off, n_off + 10)) === 'end_header'){
            n_end = n_off + 10;
            while(n_end < a_n_u8.length && a_n_u8[n_end] !== 0x0a){ n_end++; }
            n_end++;
            break;
        }
    }
    if(n_end < 0){ throw new Error(`${s_name} has no PLY header.`); }
    let a_s_line = new TextDecoder().decode(a_n_u8.subarray(0, n_end)).split(/\r?\n/);
    let s_format = '';
    let a_o_element = [];
    for(let s_line of a_s_line){
        let a_s = s_line.trim().split(/\s+/);
        if(a_s[0] === 'format'){ s_format = a_s[1]; }
        if(a_s[0] === 'element'){ a_o_element.push({ s_name: a_s[1], n_cnt: Number(a_s[2]), a_o_prop: [] }); }
        if(a_s[0] === 'property' && a_o_element.length){
            a_o_element[a_o_element.length - 1].a_o_prop.push(a_s[1] === 'list' ? { s_name: a_s[4], s_count: a_s[2], s_type: a_s[3], b_list: true } : { s_name: a_s[2], s_type: a_s[1], b_list: false });
        }
    }
    if(!['ascii', 'binary_little_endian', 'binary_big_endian'].includes(s_format)){ throw new Error(`${s_name} is a PLY of a kind that is not read: ${s_format || 'no format'}.`); }
    let o_face = a_o_element.find(function(o){ return o.s_name === 'face'; });
    if(!o_face || o_face.n_cnt === 0){
        throw new Error(`${s_name} has points only, no faces: a point cloud or a Gaussian splat has no surface to make a bulb of. Make it a mesh first, in MeshLab, Blender or the program it came from.`);
    }

    // Each element's rows, as numbers, a list as an array.
    let o_view = new DataView(a_n_u8.buffer, a_n_u8.byteOffset, a_n_u8.byteLength);
    let b_little = s_format === 'binary_little_endian';
    let n_off = n_end;
    let a_s_word = s_format === 'ascii' ? new TextDecoder().decode(a_n_u8.subarray(n_end)).split(/\s+/).filter(Boolean) : null;
    let n_word = 0;
    let f_n_read = function(s_type){
        if(a_s_word){ return Number(a_s_word[n_word++]); }
        let o_type = o_type__by_name[s_type];
        if(!o_type){ throw new Error(`${s_name} has numbers of a type that is not read: ${s_type}.`); }
        let n_val = o_view[o_type[0]](n_off, b_little);
        n_off += o_type[1];
        return n_val;
    };
    let o_data__by_element = {};
    for(let o_element of a_o_element){
        let a_a_v = new Array(o_element.a_o_prop.length);
        o_element.a_o_prop.forEach(function(o_prop, n_idx){ a_a_v[n_idx] = o_prop.b_list ? new Array(o_element.n_cnt) : new Float64Array(o_element.n_cnt); });
        for(let n_row = 0; n_row < o_element.n_cnt; n_row++){
            o_element.a_o_prop.forEach(function(o_prop, n_idx){
                if(o_prop.b_list){
                    let n_cnt = f_n_read(o_prop.s_count);
                    let a_n = new Array(n_cnt);
                    for(let n_it = 0; n_it < n_cnt; n_it++){ a_n[n_it] = f_n_read(o_prop.s_type); }
                    a_a_v[n_idx][n_row] = a_n;
                } else {
                    a_a_v[n_idx][n_row] = f_n_read(o_prop.s_type);
                }
            });
        }
        o_data__by_element[o_element.s_name] = { o_element, a_a_v };
        if(o_element.s_name === 'face'){ break; }
        if(!a_s_word && n_off > a_n_u8.length){ throw new Error(`${s_name} ends before its data does.`); }
    }
    let o_vertex = o_data__by_element.vertex;
    if(!o_vertex){ throw new Error(`${s_name} has faces but no points.`); }
    let f_a_v = function(o_data, s_prop){
        let n_idx = o_data.o_element.a_o_prop.findIndex(function(o){ return o.s_name === s_prop; });
        return n_idx < 0 ? null : { a_v: o_data.a_a_v[n_idx], n_full: o_n_full__by_type[o_data.o_element.a_o_prop[n_idx].s_type] ?? 255 };
    };
    let a_o_xyz = ['x', 'y', 'z'].map(function(s){ return f_a_v(o_vertex, s); });
    if(a_o_xyz.some(function(o){ return !o; })){ throw new Error(`${s_name} has points without x, y and z.`); }
    let f_a_o_col = function(o_data){
        for(let a_s of a_a_s_col){
            let a_o = a_s.map(function(s){ return f_a_v(o_data, s); });
            if(a_o.every(Boolean)){ return a_o; }
        }
        return null;
    };
    let a_o_col__vertex = f_a_o_col(o_vertex), a_o_col__face = f_a_o_col(o_data__by_element.face);
    let o_index = f_a_v(o_data__by_element.face, 'vertex_indices') ?? f_a_v(o_data__by_element.face, 'vertex_index');
    if(!o_index){ throw new Error(`${s_name} has faces without their points.`); }
    let n_cnt__point = o_vertex.o_element.n_cnt;
    let a_n_tri = [], a_n_col = [];
    let f_n_byte = function(o_col, n_row){ return Math.round(255 * Math.max(0, Math.min(1, o_col.a_v[n_row] / o_col.n_full))); };
    o_index.a_v.forEach(function(a_n_face, n_face){
        for(let n_it = 1; n_it + 1 < a_n_face.length; n_it++){
            for(let n_v of [a_n_face[0], a_n_face[n_it], a_n_face[n_it + 1]]){
                if(!(n_v >= 0 && n_v < n_cnt__point)){ throw new Error(`${s_name} has a face with a point that is not there.`); }
                a_n_tri.push(a_o_xyz[0].a_v[n_v], a_o_xyz[1].a_v[n_v], a_o_xyz[2].a_v[n_v]);
                if(a_o_col__face){ a_n_col.push(...a_o_col__face.map(function(o){ return f_n_byte(o, n_face); })); }
                else if(a_o_col__vertex){ a_n_col.push(...a_o_col__vertex.map(function(o){ return f_n_byte(o, n_v); })); }
            }
        }
    });
    return { a_n_tri: Float32Array.from(a_n_tri), a_n_col: a_n_col.length ? f_a_n_col__or_null(Uint8Array.from(a_n_col)) : null, s_note: '' };
};

export { f_o_object__from_ply };
