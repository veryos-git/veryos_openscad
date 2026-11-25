// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The server's STL for the 3D view, as in the ball joint app.

// A binary STL as an indexed mesh, its identical corners merged. Rounding to 32 bits
// can collapse a sliver's corners into one, and a 3MF must not have those triangles.
let f_o_mesh__from_stl = function(o_buffer){
    let o_view = new DataView(o_buffer);
    let n_cnt__triangle = o_view.getUint32(80, true);
    let a_n_idx = new Uint32Array(n_cnt__triangle * 3);
    let a_n_pos = new Float32Array(n_cnt__triangle * 9);
    let o_map = new Map();
    let n_cnt__vertex = 0;
    let n_cnt__idx = 0;
    let n_off = 84;
    for(let n_it = 0; n_it < n_cnt__triangle; n_it++){
        n_off += 12;
        for(let n_it_corner = 0; n_it_corner < 3; n_it_corner++){
            let n_x = o_view.getFloat32(n_off, true);
            let n_y = o_view.getFloat32(n_off + 4, true);
            let n_z = o_view.getFloat32(n_off + 8, true);
            n_off += 12;
            let s_key = `${n_x},${n_y},${n_z}`;
            let n_idx = o_map.get(s_key);
            if(n_idx === undefined){
                n_idx = n_cnt__vertex++;
                o_map.set(s_key, n_idx);
                a_n_pos[n_idx * 3] = n_x;
                a_n_pos[n_idx * 3 + 1] = n_y;
                a_n_pos[n_idx * 3 + 2] = n_z;
            }
            a_n_idx[n_cnt__idx + n_it_corner] = n_idx;
        }
        n_off += 2;
        let n_a = a_n_idx[n_cnt__idx], n_b = a_n_idx[n_cnt__idx + 1], n_c = a_n_idx[n_cnt__idx + 2];
        if(n_a !== n_b && n_b !== n_c && n_a !== n_c){ n_cnt__idx += 3; }
    }
    return { a_n_pos: a_n_pos.slice(0, n_cnt__vertex * 3), a_n_idx: a_n_idx.slice(0, n_cnt__idx) };
};

let f_a_n_u8__from_base64 = function(s){
    let s_bin = atob(s);
    let a_n_u8 = new Uint8Array(s_bin.length);
    for(let n_it = 0; n_it < s_bin.length; n_it++){ a_n_u8[n_it] = s_bin.charCodeAt(n_it); }
    return a_n_u8;
};

export { f_o_mesh__from_stl, f_a_n_u8__from_base64 };
