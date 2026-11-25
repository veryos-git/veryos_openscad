// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// A mesh, and the plane that cuts it in two.
//
// A mesh is { a_n_pos, a_n_idx, a_n_fil, a_n_face, a_n_shell }: its points, three
// numbers each, in mm; and for each triangle its three points, its filament from 1 or 0
// for none, the face it is of, and the closed surface of the loaded object it came
// from. A face is 0 for the object's own surface, k for the face that cut k left on the
// part above its plane, -k for the one on the part below, and n_face__thread inside a
// thread.
//
// A cut closes both parts: where the plane went through the object each gets a face,
// of triangles between the points the cut left there and no others, so the parts stay
// closed edge to edge.

import { f_o_loop, f_a_o_polygon, f_a_n_idx__of_polygons } from './polygon.module.js';

let n_face__thread = 0x40000000;
// A point this near a cut's plane is on it.
let n_mm__on = 1e-4;
// Parts of different surfaces whose boxes are this near belong together.
let n_mm__near = 0.05;

let f_a_n_cross = function(a_n_a, a_n_b){
    return [a_n_a[1] * a_n_b[2] - a_n_a[2] * a_n_b[1], a_n_a[2] * a_n_b[0] - a_n_a[0] * a_n_b[2], a_n_a[0] * a_n_b[1] - a_n_a[1] * a_n_b[0]];
};
let f_a_n_unit = function(a_n){
    let n_len = Math.hypot(a_n[0], a_n[1], a_n[2]) || 1;
    return [a_n[0] / n_len, a_n[1] / n_len, a_n[2] / n_len];
};

// Two directions square to a third and to each other, so that the first, the second
// and the third are as x, y and z.
let f_o_frame = function(a_n_z){
    let a_n_w = f_a_n_unit(a_n_z);
    // Away from the axis the third is nearest to.
    let a_n_seed = Math.abs(a_n_w[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    let a_n_v = f_a_n_unit(f_a_n_cross(a_n_w, a_n_seed));
    return { a_n_u: f_a_n_cross(a_n_v, a_n_w), a_n_v, a_n_w };
};

// Which set each of n_cnt things is in, once f_join(a, b) has put pairs of them into one.
let f_o_set = function(n_cnt){
    let a_n_parent = new Int32Array(n_cnt);
    for(let n_it = 0; n_it < n_cnt; n_it++){ a_n_parent[n_it] = n_it; }
    let f_n_root = function(n){
        while(a_n_parent[n] !== n){
            a_n_parent[n] = a_n_parent[a_n_parent[n]];
            n = a_n_parent[n];
        }
        return n;
    };
    return {
        f_n_root,
        f_join: function(n_a, n_b){
            let n_ra = f_n_root(n_a), n_rb = f_n_root(n_b);
            if(n_ra !== n_rb){ a_n_parent[n_rb] = n_ra; }
        }
    };
};

// A file's triangles, nine numbers each, as a mesh's points and triangles: corners at
// the same place become one point, and a triangle with two corners at one place is left
// out. With a_n_col, r, g, b from 0 to 255 for each corner, a_n_col__tri has each
// triangle's colour: the one two of its corners share, else the mean of the three, so on
// the line between two colours a triangle is one of them, not a blend. a_n_shell tells
// for each triangle which of the object's n_cnt__shell surfaces it is of: triangles
// that share a point are of one.
let f_o_mesh__welded = function(a_n_tri, a_n_col = null){
    let n_cnt__corner = a_n_tri.length / 3;
    let n_scl__table = 16;
    while(n_scl__table < n_cnt__corner * 2){ n_scl__table *= 2; }
    let a_n_table = new Int32Array(n_scl__table).fill(-1);
    let a_n_f32 = new Float32Array(3);
    let a_n_bit = new Int32Array(a_n_f32.buffer);
    let a_n_pos = new Float32Array(n_cnt__corner * 3);
    let a_n_corner = new Uint32Array(n_cnt__corner);
    let n_cnt__vertex = 0;
    for(let n_it = 0; n_it < n_cnt__corner; n_it++){
        // Adding 0 makes -0 the same as 0.
        a_n_f32[0] = a_n_tri[n_it * 3] + 0;
        a_n_f32[1] = a_n_tri[n_it * 3 + 1] + 0;
        a_n_f32[2] = a_n_tri[n_it * 3 + 2] + 0;
        let n_slot = ((Math.imul(a_n_bit[0], 73856093) ^ Math.imul(a_n_bit[1], 19349663) ^ Math.imul(a_n_bit[2], 83492791)) >>> 0) & (n_scl__table - 1);
        while(a_n_table[n_slot] >= 0){
            let n_off = a_n_table[n_slot] * 3;
            if(a_n_pos[n_off] === a_n_f32[0] && a_n_pos[n_off + 1] === a_n_f32[1] && a_n_pos[n_off + 2] === a_n_f32[2]){ break; }
            n_slot = (n_slot + 1) & (n_scl__table - 1);
        }
        if(a_n_table[n_slot] < 0){
            a_n_table[n_slot] = n_cnt__vertex;
            a_n_pos.set(a_n_f32, n_cnt__vertex * 3);
            n_cnt__vertex++;
        }
        a_n_corner[n_it] = a_n_table[n_slot];
    }
    let n_cnt__triangle = 0;
    let a_n_idx = new Uint32Array(n_cnt__corner);
    let a_n_col__tri = a_n_col ? new Uint8Array(n_cnt__corner) : null;
    let o_set = f_o_set(n_cnt__vertex);
    for(let n_off = 0; n_off < n_cnt__corner; n_off += 3){
        let n_a = a_n_corner[n_off], n_b = a_n_corner[n_off + 1], n_c = a_n_corner[n_off + 2];
        if(n_a === n_b || n_b === n_c || n_a === n_c){ continue; }
        a_n_idx.set([n_a, n_b, n_c], n_cnt__triangle * 3);
        o_set.f_join(n_a, n_b);
        o_set.f_join(n_a, n_c);
        if(a_n_col){
            let f_n_key = function(n_corner){ return (a_n_col[n_corner * 3] << 16) | (a_n_col[n_corner * 3 + 1] << 8) | a_n_col[n_corner * 3 + 2]; };
            let n_ka = f_n_key(n_off), n_kb = f_n_key(n_off + 1), n_kc = f_n_key(n_off + 2);
            if(n_ka === n_kb || n_ka === n_kc){
                a_n_col__tri.set(a_n_col.subarray(n_off * 3, n_off * 3 + 3), n_cnt__triangle * 3);
            } else if(n_kb === n_kc){
                a_n_col__tri.set(a_n_col.subarray(n_off * 3 + 3, n_off * 3 + 6), n_cnt__triangle * 3);
            } else {
                for(let n_k = 0; n_k < 3; n_k++){
                    a_n_col__tri[n_cnt__triangle * 3 + n_k] = Math.round((a_n_col[n_off * 3 + n_k] + a_n_col[n_off * 3 + 3 + n_k] + a_n_col[n_off * 3 + 6 + n_k]) / 3);
                }
            }
        }
        n_cnt__triangle++;
    }
    let a_n_shell = new Uint32Array(n_cnt__triangle);
    let o_n_shell__by_root = new Map();
    for(let n_tri = 0; n_tri < n_cnt__triangle; n_tri++){
        let n_root = o_set.f_n_root(a_n_idx[n_tri * 3]);
        let n_shell = o_n_shell__by_root.get(n_root);
        if(n_shell === undefined){
            n_shell = o_n_shell__by_root.size;
            o_n_shell__by_root.set(n_root, n_shell);
        }
        a_n_shell[n_tri] = n_shell;
    }
    // A point that only a left out triangle had is left out too.
    let a_n_new = new Int32Array(n_cnt__vertex).fill(-1);
    let n_cnt__used = 0;
    for(let n_it = 0; n_it < n_cnt__triangle * 3; n_it++){
        let n_old = a_n_idx[n_it];
        if(a_n_new[n_old] < 0){
            a_n_new[n_old] = n_cnt__used;
            a_n_pos.copyWithin(n_cnt__used * 3, n_old * 3, n_old * 3 + 3);
            n_cnt__used++;
        }
        a_n_idx[n_it] = a_n_new[n_old];
    }
    n_cnt__vertex = n_cnt__used;
    return {
        a_n_pos: a_n_pos.slice(0, n_cnt__vertex * 3),
        a_n_idx: a_n_idx.slice(0, n_cnt__triangle * 3),
        a_n_col__tri: a_n_col__tri ? a_n_col__tri.slice(0, n_cnt__triangle * 3) : null,
        a_n_shell,
        n_cnt__shell: o_n_shell__by_root.size
    };
};

// The box around a mesh's points.
let f_o_bound = function(a_n_pos){
    let a_n_min = [Infinity, Infinity, Infinity], a_n_max = [-Infinity, -Infinity, -Infinity];
    for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
        for(let n_k = 0; n_k < 3; n_k++){
            let n_val = a_n_pos[n_off + n_k];
            if(n_val < a_n_min[n_k]){ a_n_min[n_k] = n_val; }
            if(n_val > a_n_max[n_k]){ a_n_max[n_k] = n_val; }
        }
    }
    return { a_n_min, a_n_max };
};

// The volume a mesh encloses, above 0 if its faces look outwards, and the middle of
// that volume.
let f_o_volume = function(a_n_pos, a_n_idx){
    let n_mm3 = 0, a_n_sum = [0, 0, 0];
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let n_a = a_n_idx[n_off] * 3, n_b = a_n_idx[n_off + 1] * 3, n_c = a_n_idx[n_off + 2] * 3;
        let n_six = a_n_pos[n_a] * (a_n_pos[n_b + 1] * a_n_pos[n_c + 2] - a_n_pos[n_b + 2] * a_n_pos[n_c + 1])
            + a_n_pos[n_a + 1] * (a_n_pos[n_b + 2] * a_n_pos[n_c] - a_n_pos[n_b] * a_n_pos[n_c + 2])
            + a_n_pos[n_a + 2] * (a_n_pos[n_b] * a_n_pos[n_c + 1] - a_n_pos[n_b + 1] * a_n_pos[n_c]);
        n_mm3 += n_six / 6;
        for(let n_k = 0; n_k < 3; n_k++){ a_n_sum[n_k] += n_six / 24 * (a_n_pos[n_a + n_k] + a_n_pos[n_b + n_k] + a_n_pos[n_c + n_k]); }
    }
    return { n_mm3, a_n_middle: n_mm3 !== 0 ? a_n_sum.map(function(n){ return n / n_mm3; }) : null };
};

// How many times a mesh's surface goes around a place: 0 outside, 1 inside a closed
// surface that looks outwards, more where surfaces lie in one another. Counted along a
// line from the place towards x, slightly askew so that it misses edges and points.
let f_n_cnt__around = function(o_mesh, a_n_point){
    let { a_n_pos, a_n_idx } = o_mesh;
    let n_dy = 1.2345e-4, n_dz = 2.3456e-4;
    let n_cnt = 0;
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let n_a = a_n_idx[n_off] * 3, n_b = a_n_idx[n_off + 1] * 3, n_c = a_n_idx[n_off + 2] * 3;
        // The triangle from the place, sheared so that the line is the x axis.
        let n_ax = a_n_pos[n_a] - a_n_point[0], n_bx = a_n_pos[n_b] - a_n_point[0], n_cx = a_n_pos[n_c] - a_n_point[0];
        if(n_ax < 0 && n_bx < 0 && n_cx < 0){ continue; }
        let n_ay = a_n_pos[n_a + 1] - a_n_point[1] - n_dy * n_ax, n_by = a_n_pos[n_b + 1] - a_n_point[1] - n_dy * n_bx, n_cy = a_n_pos[n_c + 1] - a_n_point[1] - n_dy * n_cx;
        if((n_ay < 0 && n_by < 0 && n_cy < 0) || (n_ay > 0 && n_by > 0 && n_cy > 0)){ continue; }
        let n_az = a_n_pos[n_a + 2] - a_n_point[2] - n_dz * n_ax, n_bz = a_n_pos[n_b + 2] - a_n_point[2] - n_dz * n_bx, n_cz = a_n_pos[n_c + 2] - a_n_point[2] - n_dz * n_cx;
        // The axis inside the triangle as seen along it: its three corners' shares.
        let n_w0 = n_by * n_cz - n_bz * n_cy, n_w1 = n_cy * n_az - n_cz * n_ay, n_w2 = n_ay * n_bz - n_az * n_by;
        if((n_w0 < 0 || n_w1 < 0 || n_w2 < 0) && (n_w0 > 0 || n_w1 > 0 || n_w2 > 0)){ continue; }
        let n_sum = n_w0 + n_w1 + n_w2;
        if(n_sum === 0){ continue; }
        if((n_w0 * n_ax + n_w1 * n_bx + n_w2 * n_cx) / n_sum <= 0){ continue; }
        // A face that looks along the line is left through, one that looks back entered.
        n_cnt += n_sum > 0 ? 1 : -1;
    }
    return n_cnt;
};

// The triangles of a mesh that a_n_label gives the number n_label, as a mesh of their
// own with only their points.
let f_o_mesh__picked = function(o_mesh, a_n_label, n_label){
    let { a_n_pos, a_n_idx } = o_mesh;
    let a_n_vertex__by_old = new Int32Array(a_n_pos.length / 3).fill(-1);
    let n_cnt__triangle = 0;
    for(let n_tri = 0; n_tri < a_n_label.length; n_tri++){
        if(a_n_label[n_tri] === n_label){ n_cnt__triangle++; }
    }
    let o_picked = {
        a_n_pos: null, a_n_idx: new Uint32Array(n_cnt__triangle * 3), a_n_fil: new Uint8Array(n_cnt__triangle),
        a_n_face: new Int32Array(n_cnt__triangle), a_n_shell: new Uint32Array(n_cnt__triangle)
    };
    let a_n_old = [];
    let n_to = 0;
    for(let n_tri = 0; n_tri < a_n_label.length; n_tri++){
        if(a_n_label[n_tri] !== n_label){ continue; }
        for(let n_k = 0; n_k < 3; n_k++){
            let n_old = a_n_idx[n_tri * 3 + n_k];
            if(a_n_vertex__by_old[n_old] < 0){
                a_n_vertex__by_old[n_old] = a_n_old.length;
                a_n_old.push(n_old);
            }
            o_picked.a_n_idx[n_to * 3 + n_k] = a_n_vertex__by_old[n_old];
        }
        o_picked.a_n_fil[n_to] = o_mesh.a_n_fil[n_tri];
        o_picked.a_n_face[n_to] = o_mesh.a_n_face[n_tri];
        o_picked.a_n_shell[n_to] = o_mesh.a_n_shell[n_tri];
        n_to++;
    }
    o_picked.a_n_pos = new Float32Array(a_n_old.length * 3);
    for(let n_it = 0; n_it < a_n_old.length; n_it++){
        for(let n_k = 0; n_k < 3; n_k++){ o_picked.a_n_pos[n_it * 3 + n_k] = a_n_pos[a_n_old[n_it] * 3 + n_k]; }
    }
    return o_picked;
};

// Where a face of a mesh ends: the edges of its triangles that no other triangle of the
// face shares, as loops, and the polygons these make as seen against a_n_w, the way the
// face looks. a_n_xy has every point's place across the face, from a_n_origin along
// a_n_u and a_n_v. f_b_tri tells which triangles are the face's.
let f_o_outline = function(o_mesh, f_b_tri, a_n_origin, a_n_u, a_n_v){
    let { a_n_pos, a_n_idx } = o_mesh;
    let n_cnt__vertex = a_n_pos.length / 3;
    let o_edge = new Set();
    for(let n_tri = 0; n_tri < a_n_idx.length / 3; n_tri++){
        if(!f_b_tri(n_tri)){ continue; }
        for(let n_k = 0; n_k < 3; n_k++){ o_edge.add(a_n_idx[n_tri * 3 + n_k] * n_cnt__vertex + a_n_idx[n_tri * 3 + (n_k + 1) % 3]); }
    }
    let a_n_from = [], a_n_to = [];
    for(let n_key of o_edge){
        let n_a = Math.floor(n_key / n_cnt__vertex), n_b = n_key - n_a * n_cnt__vertex;
        if(!o_edge.has(n_b * n_cnt__vertex + n_a)){
            a_n_from.push(n_a);
            a_n_to.push(n_b);
        }
    }
    let a_n_xy = new Float64Array(n_cnt__vertex * 2);
    for(let n_vertex of new Set([...a_n_from, ...a_n_to])){
        let n_x = a_n_pos[n_vertex * 3] - a_n_origin[0], n_y = a_n_pos[n_vertex * 3 + 1] - a_n_origin[1], n_z = a_n_pos[n_vertex * 3 + 2] - a_n_origin[2];
        a_n_xy[n_vertex * 2] = n_x * a_n_u[0] + n_y * a_n_u[1] + n_z * a_n_u[2];
        a_n_xy[n_vertex * 2 + 1] = n_x * a_n_v[0] + n_y * a_n_v[1] + n_z * a_n_v[2];
    }
    let o_loop = f_o_loop(a_n_from, a_n_to, a_n_xy);
    return { a_o_polygon: f_a_o_polygon(o_loop.a_a_n_loop, a_n_xy), a_n_xy, n_cnt__gap: o_loop.n_cnt__gap };
};

// A mesh with the triangles that f_b_tri names left out and others put in: a_n_idx__new
// their points, and each with the filament, face and surface given.
let f_o_mesh__refaced = function(o_mesh, f_b_tri, a_n_idx__new, n_fil, n_face, n_shell){
    let n_cnt__old = o_mesh.a_n_idx.length / 3;
    let a_n_kept = [];
    for(let n_tri = 0; n_tri < n_cnt__old; n_tri++){
        if(!f_b_tri(n_tri)){ a_n_kept.push(n_tri); }
    }
    let n_cnt = a_n_kept.length + a_n_idx__new.length / 3;
    let o_new = { a_n_pos: o_mesh.a_n_pos, a_n_idx: new Uint32Array(n_cnt * 3), a_n_fil: new Uint8Array(n_cnt), a_n_face: new Int32Array(n_cnt), a_n_shell: new Uint32Array(n_cnt) };
    a_n_kept.forEach(function(n_tri, n_to){
        for(let n_k = 0; n_k < 3; n_k++){ o_new.a_n_idx[n_to * 3 + n_k] = o_mesh.a_n_idx[n_tri * 3 + n_k]; }
        o_new.a_n_fil[n_to] = o_mesh.a_n_fil[n_tri];
        o_new.a_n_face[n_to] = o_mesh.a_n_face[n_tri];
        o_new.a_n_shell[n_to] = o_mesh.a_n_shell[n_tri];
    });
    o_new.a_n_idx.set(a_n_idx__new, a_n_kept.length * 3);
    o_new.a_n_fil.fill(n_fil, a_n_kept.length);
    o_new.a_n_face.fill(n_face, a_n_kept.length);
    o_new.a_n_shell.fill(n_shell, a_n_kept.length);
    return o_new;
};

// One side of a cut while it is made: the triangles that fall to it, and its own
// numbers for the points they use.
let f_o_side = function(n_cnt__vertex){
    return {
        a_n_pos: [], a_n_idx: [], a_n_fil: [], a_n_face: [], a_n_shell: [],
        // Whether a point is on the plane.
        a_b_on: [],
        a_n_vertex__by_old: new Int32Array(n_cnt__vertex).fill(-1),
        o_n_vertex__by_cut: new Map()
    };
};

// Cuts a mesh along the plane through a_n_point that looks along a_n_normal. Returns
// null if the plane does not go through it, else { a_o_mesh, n_cnt__gap }: the part
// above the plane and the part below, each closed by a face with the number n_face, and
// below with its negative. n_cnt__gap counts where the object's surface was open along
// the cut, and the face closed as well as it could be.
let f_o_cut = function(o_mesh, a_n_point, a_n_normal, n_face){
    let { a_n_pos, a_n_idx } = o_mesh;
    let n_cnt__vertex = a_n_pos.length / 3;
    let [n_nx, n_ny, n_nz] = f_a_n_unit(a_n_normal);
    let n_offset = n_nx * a_n_point[0] + n_ny * a_n_point[1] + n_nz * a_n_point[2];
    // How far above the plane each point is. One that counts as on it is moved onto it
    // by a_n_off, in both parts alike, so that their faces are flat.
    let a_n_d = new Float64Array(n_cnt__vertex);
    let a_n_off = new Float32Array(n_cnt__vertex);
    let b_above = false, b_below = false;
    for(let n_vertex = 0; n_vertex < n_cnt__vertex; n_vertex++){
        let n_d = n_nx * a_n_pos[n_vertex * 3] + n_ny * a_n_pos[n_vertex * 3 + 1] + n_nz * a_n_pos[n_vertex * 3 + 2] - n_offset;
        if(Math.abs(n_d) < n_mm__on){
            a_n_off[n_vertex] = n_d;
            n_d = 0;
        }
        a_n_d[n_vertex] = n_d;
        if(n_d > 0){ b_above = true; } else if(n_d < 0){ b_below = true; }
    }
    if(!b_above || !b_below){ return null; }

    // The points the plane leaves on the edges it crosses, one for each edge: numbered
    // on from the mesh's own points.
    let a_n_pos__cut = [];
    let o_n_cut__by_edge = new Map();
    let f_n_cut = function(n_a, n_b){
        let n_lo = Math.min(n_a, n_b), n_hi = Math.max(n_a, n_b);
        let n_key = n_lo * n_cnt__vertex + n_hi;
        let n_cut = o_n_cut__by_edge.get(n_key);
        if(n_cut === undefined){
            let n_t = a_n_d[n_lo] / (a_n_d[n_lo] - a_n_d[n_hi]);
            n_cut = a_n_pos__cut.length / 3;
            for(let n_k = 0; n_k < 3; n_k++){ a_n_pos__cut.push(a_n_pos[n_lo * 3 + n_k] + n_t * (a_n_pos[n_hi * 3 + n_k] - a_n_pos[n_lo * 3 + n_k])); }
            o_n_cut__by_edge.set(n_key, n_cut);
        }
        return n_cnt__vertex + n_cut;
    };
    let a_o_side = [f_o_side(n_cnt__vertex), f_o_side(n_cnt__vertex)];
    let f_n_vertex = function(o_side, n_old){
        let n_vertex;
        if(n_old < n_cnt__vertex){
            n_vertex = o_side.a_n_vertex__by_old[n_old];
            if(n_vertex < 0){
                n_vertex = o_side.a_b_on.length;
                o_side.a_n_vertex__by_old[n_old] = n_vertex;
                let n_off = a_n_off[n_old];
                o_side.a_n_pos.push(a_n_pos[n_old * 3] - n_off * n_nx, a_n_pos[n_old * 3 + 1] - n_off * n_ny, a_n_pos[n_old * 3 + 2] - n_off * n_nz);
                o_side.a_b_on.push(a_n_d[n_old] === 0 ? 1 : 0);
            }
        } else {
            let n_cut = n_old - n_cnt__vertex;
            n_vertex = o_side.o_n_vertex__by_cut.get(n_cut);
            if(n_vertex === undefined){
                n_vertex = o_side.a_b_on.length;
                o_side.o_n_vertex__by_cut.set(n_cut, n_vertex);
                o_side.a_n_pos.push(a_n_pos__cut[n_cut * 3], a_n_pos__cut[n_cut * 3 + 1], a_n_pos__cut[n_cut * 3 + 2]);
                o_side.a_b_on.push(1);
            }
        }
        return n_vertex;
    };
    let f_add = function(o_side, n_tri, n_a, n_b, n_c){
        o_side.a_n_idx.push(f_n_vertex(o_side, n_a), f_n_vertex(o_side, n_b), f_n_vertex(o_side, n_c));
        o_side.a_n_fil.push(o_mesh.a_n_fil[n_tri]);
        o_side.a_n_face.push(o_mesh.a_n_face[n_tri]);
        o_side.a_n_shell.push(o_mesh.a_n_shell[n_tri]);
    };

    for(let n_tri = 0; n_tri < a_n_idx.length / 3; n_tri++){
        let n_a = a_n_idx[n_tri * 3], n_b = a_n_idx[n_tri * 3 + 1], n_c = a_n_idx[n_tri * 3 + 2];
        let n_da = a_n_d[n_a], n_db = a_n_d[n_b], n_dc = a_n_d[n_c];
        if(n_da >= 0 && n_db >= 0 && n_dc >= 0){
            let n_side = 0;
            if(n_da === 0 && n_db === 0 && n_dc === 0){
                // A triangle in the plane: one that looks up is the top of the part below.
                let n_ux = a_n_pos[n_b * 3] - a_n_pos[n_a * 3], n_uy = a_n_pos[n_b * 3 + 1] - a_n_pos[n_a * 3 + 1], n_uz = a_n_pos[n_b * 3 + 2] - a_n_pos[n_a * 3 + 2];
                let n_vx = a_n_pos[n_c * 3] - a_n_pos[n_a * 3], n_vy = a_n_pos[n_c * 3 + 1] - a_n_pos[n_a * 3 + 1], n_vz = a_n_pos[n_c * 3 + 2] - a_n_pos[n_a * 3 + 2];
                if((n_uy * n_vz - n_uz * n_vy) * n_nx + (n_uz * n_vx - n_ux * n_vz) * n_ny + (n_ux * n_vy - n_uy * n_vx) * n_nz >= 0){ n_side = 1; }
            }
            f_add(a_o_side[n_side], n_tri, n_a, n_b, n_c);
        } else if(n_da <= 0 && n_db <= 0 && n_dc <= 0){
            f_add(a_o_side[1], n_tri, n_a, n_b, n_c);
        } else {
            // Across the plane: what of it is above, and what below, a corner on the
            // plane being of both, as is the point where an edge goes through.
            let a_n_corner = [n_a, n_b, n_c];
            let a_a_n_part = [[], []];
            for(let n_k = 0; n_k < 3; n_k++){
                let n_p = a_n_corner[n_k], n_q = a_n_corner[(n_k + 1) % 3];
                if(a_n_d[n_p] >= 0){ a_a_n_part[0].push(n_p); }
                if(a_n_d[n_p] <= 0){ a_a_n_part[1].push(n_p); }
                if(a_n_d[n_p] * a_n_d[n_q] < 0){
                    let n_cut = f_n_cut(n_p, n_q);
                    a_a_n_part[0].push(n_cut);
                    a_a_n_part[1].push(n_cut);
                }
            }
            for(let n_side = 0; n_side < 2; n_side++){
                let a_n_part = a_a_n_part[n_side];
                for(let n_it = 1; n_it < a_n_part.length - 1; n_it++){ f_add(a_o_side[n_side], n_tri, a_n_part[0], a_n_part[n_it], a_n_part[n_it + 1]); }
            }
        }
    }

    // Each side's face: its edges on the plane that no second triangle shares are where
    // it is open, and the face's triangles take them the other way round.
    let n_cnt__gap = 0;
    let a_o_mesh = a_o_side.map(function(o_side, n_side){
        let n_cnt__point = o_side.a_b_on.length;
        // The part above is closed by a face that looks down, the one below by one that looks up.
        let o_frame = f_o_frame(n_side === 0 ? [-n_nx, -n_ny, -n_nz] : [n_nx, n_ny, n_nz]);
        let o_n_shell__by_edge = new Map();
        for(let n_off = 0; n_off < o_side.a_n_idx.length; n_off += 3){
            for(let n_k = 0; n_k < 3; n_k++){
                let n_p = o_side.a_n_idx[n_off + n_k], n_q = o_side.a_n_idx[n_off + (n_k + 1) % 3];
                if(o_side.a_b_on[n_p] && o_side.a_b_on[n_q]){ o_n_shell__by_edge.set(n_p * n_cnt__point + n_q, o_side.a_n_shell[n_off / 3]); }
            }
        }
        let a_n_from = [], a_n_to = [];
        let o_n_shell__by_point = new Map();
        for(let [n_key, n_shell] of o_n_shell__by_edge){
            let n_p = Math.floor(n_key / n_cnt__point), n_q = n_key - n_p * n_cnt__point;
            if(!o_n_shell__by_edge.has(n_q * n_cnt__point + n_p)){
                a_n_from.push(n_q);
                a_n_to.push(n_p);
                o_n_shell__by_point.set(n_q, n_shell);
            }
        }
        let a_n_xy = new Float64Array(n_cnt__point * 2);
        for(let n_vertex of new Set([...a_n_from, ...a_n_to])){
            let n_x = o_side.a_n_pos[n_vertex * 3] - a_n_point[0], n_y = o_side.a_n_pos[n_vertex * 3 + 1] - a_n_point[1], n_z = o_side.a_n_pos[n_vertex * 3 + 2] - a_n_point[2];
            a_n_xy[n_vertex * 2] = n_x * o_frame.a_n_u[0] + n_y * o_frame.a_n_u[1] + n_z * o_frame.a_n_u[2];
            a_n_xy[n_vertex * 2 + 1] = n_x * o_frame.a_n_v[0] + n_y * o_frame.a_n_v[1] + n_z * o_frame.a_n_v[2];
        }
        let o_loop = f_o_loop(a_n_from, a_n_to, a_n_xy);
        n_cnt__gap += o_loop.n_cnt__gap;
        for(let o_polygon of f_a_o_polygon(o_loop.a_a_n_loop, a_n_xy)){
            let a_n_idx__face = f_a_n_idx__of_polygons([o_polygon], a_n_xy);
            let n_shell = o_n_shell__by_point.get(o_polygon.a_n_outer[0]) ?? 0;
            for(let n_off = 0; n_off < a_n_idx__face.length; n_off += 3){
                o_side.a_n_idx.push(a_n_idx__face[n_off], a_n_idx__face[n_off + 1], a_n_idx__face[n_off + 2]);
                o_side.a_n_fil.push(0);
                o_side.a_n_face.push(n_side === 0 ? n_face : -n_face);
                o_side.a_n_shell.push(n_shell);
            }
        }
        return {
            a_n_pos: Float32Array.from(o_side.a_n_pos), a_n_idx: Uint32Array.from(o_side.a_n_idx), a_n_fil: Uint8Array.from(o_side.a_n_fil),
            a_n_face: Int32Array.from(o_side.a_n_face), a_n_shell: Uint32Array.from(o_side.a_n_shell)
        };
    });
    return { a_o_mesh, n_cnt__gap };
};

// What a cut left on one side, as the bodies it is: a mesh each. Triangles that share
// a point are of one body. Of bodies that share none, two are one all the same where
// their faces of this cut lie on one another, as those of a surface inside another do;
// and where they are of different surfaces of the loaded object and their boxes meet,
// as an eye that sits in a head: what the object's maker put together stays together.
let f_a_o_mesh__body = function(o_mesh, n_face, a_n_point, a_n_normal){
    let { a_n_pos, a_n_idx } = o_mesh;
    let n_cnt__triangle = a_n_idx.length / 3;
    let o_set = f_o_set(a_n_pos.length / 3);
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        o_set.f_join(a_n_idx[n_off], a_n_idx[n_off + 1]);
        o_set.f_join(a_n_idx[n_off], a_n_idx[n_off + 2]);
    }
    let a_n_label = new Int32Array(n_cnt__triangle);
    let o_n_label__by_root = new Map();
    for(let n_tri = 0; n_tri < n_cnt__triangle; n_tri++){
        let n_root = o_set.f_n_root(a_n_idx[n_tri * 3]);
        let n_label = o_n_label__by_root.get(n_root);
        if(n_label === undefined){
            n_label = o_n_label__by_root.size;
            o_n_label__by_root.set(n_root, n_label);
        }
        a_n_label[n_tri] = n_label;
    }
    let n_cnt__piece = o_n_label__by_root.size;
    if(n_cnt__piece === 1){ return [o_mesh]; }

    // Each piece's box, its surfaces, and its triangles of the cut's face, flat.
    let o_frame = f_o_frame(a_n_normal);
    let a_o_piece = Array.from({ length: n_cnt__piece }, function(){
        return { a_n_min: [Infinity, Infinity, Infinity], a_n_max: [-Infinity, -Infinity, -Infinity], o_shell: new Set(), a_n_xy: [] };
    });
    for(let n_tri = 0; n_tri < n_cnt__triangle; n_tri++){
        let o_piece = a_o_piece[a_n_label[n_tri]];
        o_piece.o_shell.add(o_mesh.a_n_shell[n_tri]);
        for(let n_k = 0; n_k < 3; n_k++){
            let n_off = a_n_idx[n_tri * 3 + n_k] * 3;
            for(let n_axis = 0; n_axis < 3; n_axis++){
                if(a_n_pos[n_off + n_axis] < o_piece.a_n_min[n_axis]){ o_piece.a_n_min[n_axis] = a_n_pos[n_off + n_axis]; }
                if(a_n_pos[n_off + n_axis] > o_piece.a_n_max[n_axis]){ o_piece.a_n_max[n_axis] = a_n_pos[n_off + n_axis]; }
            }
            if(o_mesh.a_n_face[n_tri] === n_face){
                let n_x = a_n_pos[n_off] - a_n_point[0], n_y = a_n_pos[n_off + 1] - a_n_point[1], n_z = a_n_pos[n_off + 2] - a_n_point[2];
                o_piece.a_n_xy.push(n_x * o_frame.a_n_u[0] + n_y * o_frame.a_n_u[1] + n_z * o_frame.a_n_u[2], n_x * o_frame.a_n_v[0] + n_y * o_frame.a_n_v[1] + n_z * o_frame.a_n_v[2]);
            }
        }
    }
    // Whether a corner of one's face lies in a triangle of the other's.
    let f_b_face_on_face = function(o_a, o_b){
        for(let n_p = 0; n_p < o_a.a_n_xy.length; n_p += 2){
            let n_x = o_a.a_n_xy[n_p], n_y = o_a.a_n_xy[n_p + 1];
            for(let n_t = 0; n_t < o_b.a_n_xy.length; n_t += 6){
                let n_w0 = (o_b.a_n_xy[n_t + 2] - n_x) * (o_b.a_n_xy[n_t + 5] - n_y) - (o_b.a_n_xy[n_t + 3] - n_y) * (o_b.a_n_xy[n_t + 4] - n_x);
                let n_w1 = (o_b.a_n_xy[n_t + 4] - n_x) * (o_b.a_n_xy[n_t + 1] - n_y) - (o_b.a_n_xy[n_t + 5] - n_y) * (o_b.a_n_xy[n_t] - n_x);
                let n_w2 = (o_b.a_n_xy[n_t] - n_x) * (o_b.a_n_xy[n_t + 3] - n_y) - (o_b.a_n_xy[n_t + 1] - n_y) * (o_b.a_n_xy[n_t + 2] - n_x);
                if((n_w0 > 0 && n_w1 > 0 && n_w2 > 0) || (n_w0 < 0 && n_w1 < 0 && n_w2 < 0)){ return true; }
            }
        }
        return false;
    };
    let o_set__body = f_o_set(n_cnt__piece);
    for(let n_a = 0; n_a < n_cnt__piece; n_a++){
        for(let n_b = n_a + 1; n_b < n_cnt__piece; n_b++){
            let o_a = a_o_piece[n_a], o_b = a_o_piece[n_b];
            if(o_set__body.f_n_root(n_a) === o_set__body.f_n_root(n_b)){ continue; }
            let b_boxes = [0, 1, 2].every(function(n_axis){ return o_a.a_n_min[n_axis] <= o_b.a_n_max[n_axis] + n_mm__near && o_b.a_n_min[n_axis] <= o_a.a_n_max[n_axis] + n_mm__near; });
            if(!b_boxes){ continue; }
            let b_other_surfaces = [...o_a.o_shell].every(function(n_shell){ return !o_b.o_shell.has(n_shell); });
            if(b_other_surfaces || f_b_face_on_face(o_a, o_b) || f_b_face_on_face(o_b, o_a)){ o_set__body.f_join(n_a, n_b); }
        }
    }
    let a_n_body__by_piece = new Int32Array(n_cnt__piece);
    let o_n_body__by_root = new Map();
    for(let n_piece = 0; n_piece < n_cnt__piece; n_piece++){
        let n_root = o_set__body.f_n_root(n_piece);
        if(!o_n_body__by_root.has(n_root)){ o_n_body__by_root.set(n_root, o_n_body__by_root.size); }
        a_n_body__by_piece[n_piece] = o_n_body__by_root.get(n_root);
    }
    if(o_n_body__by_root.size === 1){ return [o_mesh]; }
    for(let n_tri = 0; n_tri < n_cnt__triangle; n_tri++){ a_n_label[n_tri] = a_n_body__by_piece[a_n_label[n_tri]]; }
    return Array.from({ length: o_n_body__by_root.size }, function(v, n_body){ return f_o_mesh__picked(o_mesh, a_n_label, n_body); });
};

export {
    n_face__thread,
    f_a_n_cross,
    f_a_n_unit,
    f_o_frame,
    f_o_mesh__welded,
    f_o_bound,
    f_o_volume,
    f_n_cnt__around,
    f_o_outline,
    f_o_mesh__refaced,
    f_o_cut,
    f_a_o_mesh__body
};
