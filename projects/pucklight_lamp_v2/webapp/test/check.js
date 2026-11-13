// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// What the tests share: the checks, and the paths of the app's files.

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertEquals = function(v_a, v_b, s_message = ''){
    let s_a = JSON.stringify(v_a), s_b = JSON.stringify(v_b);
    if(s_a !== s_b){ throw new Error(`${s_message} ${s_a} is not ${s_b}`); }
};
let assertAlmostEquals = function(n_a, n_b, n_tolerance, s_message = ''){
    if(!(Math.abs(n_a - n_b) <= n_tolerance)){ throw new Error(`${s_message} ${n_a} is not ${n_b} within ${n_tolerance}`); }
};
let assertThrows = function(f, o_regex, s_message = ''){
    try{
        f();
    } catch(o_error){
        assert(o_regex.test(o_error.message), `${s_message} threw “${o_error.message}”, not ${o_regex}`);
        return;
    }
    throw new Error(`${s_message} did not throw ${o_regex}`);
};
let f_b_same = function(a_n_a, a_n_b){
    if(a_n_a.length !== a_n_b.length){ return false; }
    for(let n_idx = 0; n_idx < a_n_a.length; n_idx++){
        if(a_n_a[n_idx] !== a_n_b[n_idx]){ return false; }
    }
    return true;
};

// A file of the app, by its path from webapp/.
let f_s_path = function(s_relative){
    return decodeURI(new URL(`../${s_relative}`, import.meta.url).pathname);
};

// The volume a mesh encloses: above 0 if its faces point outwards.
let f_n_mm3 = function(a_n_pos, a_n_idx){
    let n_mm3 = 0;
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let n_a = a_n_idx[n_off] * 3, n_b = a_n_idx[n_off + 1] * 3, n_c = a_n_idx[n_off + 2] * 3;
        n_mm3 += (a_n_pos[n_a] * (a_n_pos[n_b + 1] * a_n_pos[n_c + 2] - a_n_pos[n_b + 2] * a_n_pos[n_c + 1])
            + a_n_pos[n_a + 1] * (a_n_pos[n_b + 2] * a_n_pos[n_c] - a_n_pos[n_b] * a_n_pos[n_c + 2])
            + a_n_pos[n_a + 2] * (a_n_pos[n_b] * a_n_pos[n_c + 1] - a_n_pos[n_b + 1] * a_n_pos[n_c])) / 6;
    }
    return n_mm3;
};

// Every edge is used once in each direction, or the mesh has a hole or a wrong face;
// and the faces point outwards.
let f_check_closed = function(a_n_pos, a_n_idx, s_label = 'mesh'){
    let n_cnt__vertex = a_n_pos.length / 3;
    let o_edge = new Set();
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        for(let n_k = 0; n_k < 3; n_k++){
            let n_a = a_n_idx[n_off + n_k], n_b = a_n_idx[n_off + (n_k + 1) % 3];
            assert(n_a !== n_b && n_a < n_cnt__vertex, `${s_label}: a triangle without area, or a point that is not there`);
            let n_key = n_a * n_cnt__vertex + n_b;
            assert(!o_edge.has(n_key), `${s_label}: an edge is used twice in one direction`);
            o_edge.add(n_key);
        }
    }
    for(let n_key of o_edge){
        let n_a = Math.floor(n_key / n_cnt__vertex);
        assert(o_edge.has((n_key - n_a * n_cnt__vertex) * n_cnt__vertex + n_a), `${s_label}: an edge has no face on its other side`);
    }
    for(let n_val of a_n_pos){ assert(Number.isFinite(n_val), `${s_label}: a point is not a number`); }
    assert(f_n_mm3(a_n_pos, a_n_idx) > 0, `${s_label}: the faces point inwards`);
};

// Where rays from the axis, level at height n_z, first hit a mesh beyond n_r__from:
// the radius for each angle in a_n_rad, or Infinity. With b_last the farthest hit.
let f_a_n_radius__hit = function(a_n_pos, a_n_idx, n_z, a_n_rad, n_r__from, b_last = false){
    let p = a_n_pos;
    let a_a_n_triangle = [];
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let a = a_n_idx[n_off] * 3, b = a_n_idx[n_off + 1] * 3, c = a_n_idx[n_off + 2] * 3;
        if(Math.min(p[a + 2], p[b + 2], p[c + 2]) <= n_z && Math.max(p[a + 2], p[b + 2], p[c + 2]) >= n_z){ a_a_n_triangle.push([a, b, c]); }
    }
    return a_n_rad.map(function(n_rad){
        let n_dx = Math.cos(n_rad), n_dy = Math.sin(n_rad);
        let n_r = b_last ? -Infinity : Infinity;
        for(let [a, b, c] of a_a_n_triangle){
            // Moeller-Trumbore from the axis.
            let e1x = p[b] - p[a], e1y = p[b + 1] - p[a + 1], e1z = p[b + 2] - p[a + 2];
            let e2x = p[c] - p[a], e2y = p[c + 1] - p[a + 1], e2z = p[c + 2] - p[a + 2];
            let hx = n_dy * e2z, hy = -n_dx * e2z, hz = n_dx * e2y - n_dy * e2x;
            let n_det = e1x * hx + e1y * hy + e1z * hz;
            if(Math.abs(n_det) < 1e-12){ continue; }
            let sx = -p[a], sy = -p[a + 1], sz = n_z - p[a + 2];
            let n_u = (sx * hx + sy * hy + sz * hz) / n_det;
            if(n_u < 0 || n_u > 1){ continue; }
            let qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
            let n_v = (n_dx * qx + n_dy * qy) / n_det;
            if(n_v < 0 || n_u + n_v > 1){ continue; }
            let n_t = (e2x * qx + e2y * qy + e2z * qz) / n_det;
            if(n_t > n_r__from && (b_last ? n_t > n_r : n_t < n_r)){ n_r = n_t; }
        }
        return b_last && n_r === -Infinity ? Infinity : n_r;
    });
};

// Whether OpenSCAD is here: the tests that ask the .scad files skip themselves without it.
let f_b_openscad = async function(){
    try{
        return (await new Deno.Command('openscad', { args: ['--version'], stdout: 'null', stderr: 'null' }).output()).success;
    } catch(o_error){
        return false;
    }
};

export {
    assert, assertEquals, assertAlmostEquals, assertThrows, f_b_same, f_s_path, f_n_mm3, f_check_closed, f_a_n_radius__hit, f_b_openscad
};
