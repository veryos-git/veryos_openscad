// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The object: any 3D object as a string light's bulb. Its triangles need not be one clean solid:
// they are sampled on a grid, as a slicer samples them, and the bulb is made anew
// from that grid, so nothing is cut or joined triangle by triangle.
//
//   1. Lines of the grid along x, y and z are followed through the triangles. Where a
//      line is inside the object is counted from the triangles it crosses; the three
//      directions vote, so a hole in the object's surface spoils little.
//   2. The object is joined to a stem: a cylinder on the neck, closed by a 45 degree
//      cone, which shows only where the object is narrower. What does not hang
//      together with the stem is left out.
//   3. Every crossing is a point of the object's surface with its direction. From
//      these each grid point near the surface knows how far it is from it, and each
//      one inside how deep it lies. How far it is from the stem's surface its formula
//      tells. A point is as far from the bulb's surface as from the nearer of both.
//   4. The outside is where that distance is 0, the inside where the depth is the
//      wall: two surfaces of the same numbers, so they cannot cross.
//   5. Both end on a circle on the grid's lowest plane, and are sewn to the neck: the
//      tube with the thread for the clip inside, which every bulb has.
//   6. An object with colours gives each point of the bulb the colour it has at
//      the crossing nearest to it, through the wall, so the inside has the outside's.
//
// Printed standing on its neck, z up, neck on z = 0. a_n_tri is in these coordinates:
// nine numbers a triangle. o_lamp is part/bulb.json.

import { f_n_radius__bore, f_a_n_normal, f_o_stat__mesh } from './neck.module.js';
import { a_n_col__plain } from './color.module.js';

let n_tau = Math.PI * 2;
// The grid starts 1 mm above the neck's top, h2 = 7 in ../lichterketteV3.scad: the neck
// goes on up to there as a plain tube.
let n_mm__base_z = 8;
// More grid points than this are too many for a browser: the grid gets coarser.
let n_cnt__node_max = 16e6;
// Two samples whose directions differ by more than this cosine lie on two sides of an edge.
let n_cos__edge = 0.9;
// What the Lit view takes as the wall where the object leaves no room for a cavity.
let n_mm__solid = 5;
let n_big = 1e6;
let n_gram_per_mm3 = 0.00124; // PLA
let n_bit__object = 1;
let n_bit__stem = 2;
// What a grid point has in place of a sample's number: none, or the stem is nearer.
let n_idx__none = -1;
let n_idx__stem = -2;

let f_o_param__default = function(){
    return { n_mm__wall: 0.5, n_mm__stem: 2 };
};

// A list of numbers that grows.
let f_o_list = function(f_a_n, n_cnt__start = 1 << 14){
    let o_list = { a_n: new f_a_n(n_cnt__start), n_cnt: 0 };
    o_list.f_add = function(n_val){
        if(o_list.n_cnt === o_list.a_n.length){
            let a_n = new f_a_n(o_list.a_n.length * 2);
            a_n.set(o_list.a_n);
            o_list.a_n = a_n;
        }
        o_list.a_n[o_list.n_cnt++] = n_val;
    };
    return o_list;
};

// The grid: points n_h apart, the lowest ones on the collar's top, around the object
// above it and the stem.
let f_o_grid = function(a_n_tri, n_mm__voxel, n_r__stem, n_z__apex){
    let a_n_min = [-n_r__stem, -n_r__stem, n_mm__base_z], a_n_max = [n_r__stem, n_r__stem, n_z__apex];
    for(let n_off = 0; n_off < a_n_tri.length; n_off += 9){
        // A triangle wholly below the grid does not widen it.
        if(Math.max(a_n_tri[n_off + 2], a_n_tri[n_off + 5], a_n_tri[n_off + 8]) <= n_mm__base_z){ continue; }
        for(let n_k = 0; n_k < 9; n_k++){
            let n_val = a_n_tri[n_off + n_k];
            if(n_val < a_n_min[n_k % 3]){ a_n_min[n_k % 3] = n_val; }
            if(n_val > a_n_max[n_k % 3]){ a_n_max[n_k % 3] = n_val; }
        }
    }
    a_n_min[2] = n_mm__base_z;
    let n_h = n_mm__voxel;
    let f_a_n_cnt = function(){
        return [0, 1, 2].map(function(n_k){ return Math.ceil((a_n_max[n_k] - a_n_min[n_k]) / n_h) + (n_k === 2 ? 3 : 6); });
    };
    let a_n_cnt = f_a_n_cnt();
    // The finest step that many grid points allow around this object.
    let n_h__min = n_h * Math.cbrt(a_n_cnt[0] * a_n_cnt[1] * a_n_cnt[2] / n_cnt__node_max) * 1.02;
    if(n_h__min > n_h){
        n_h = n_h__min;
        a_n_cnt = f_a_n_cnt();
    }
    return {
        n_h,
        n_h__min,
        a_n_cnt,
        // Off the round numbers objects are made of, so a line does not run along an edge.
        a_n_origin: [a_n_min[0] - (2 + 0.3183) * n_h, a_n_min[1] - (2 + 0.7071) * n_h, n_mm__base_z],
        a_n_stride: [1, a_n_cnt[0], a_n_cnt[0] * a_n_cnt[1]],
        n_cnt: a_n_cnt[0] * a_n_cnt[1] * a_n_cnt[2]
    };
};

// Where the grid's lines along one axis cross the triangles: for each line its
// crossings in order, with the triangle and whether the line leaves the object there
// by that triangle's direction.
let f_o_dexel = function(a_n_tri, n_axis, o_grid){
    let n_u = (n_axis + 1) % 3, n_v = (n_axis + 2) % 3;
    let n_cnt__u = o_grid.a_n_cnt[n_u], n_cnt__v = o_grid.a_n_cnt[n_v];
    let n_u__origin = o_grid.a_n_origin[n_u], n_v__origin = o_grid.a_n_origin[n_v];
    let n_h = o_grid.n_h;
    let o_line = f_o_list(Int32Array), o_w = f_o_list(Float32Array), o_from = f_o_list(Int32Array);
    for(let n_off = 0; n_off < a_n_tri.length; n_off += 9){
        let n_u0 = a_n_tri[n_off + n_u], n_v0 = a_n_tri[n_off + n_v], n_w0 = a_n_tri[n_off + n_axis];
        let n_u1 = a_n_tri[n_off + 3 + n_u], n_v1 = a_n_tri[n_off + 3 + n_v], n_w1 = a_n_tri[n_off + 3 + n_axis];
        let n_u2 = a_n_tri[n_off + 6 + n_u], n_v2 = a_n_tri[n_off + 6 + n_v], n_w2 = a_n_tri[n_off + 6 + n_axis];
        // Twice the triangle's area as the line sees it; its sign is the direction of
        // the triangle's normal along the line.
        let n_area = (n_u1 - n_u0) * (n_v2 - n_v0) - (n_u2 - n_u0) * (n_v1 - n_v0);
        if(n_area === 0){ continue; }
        let n_iu__from = Math.max(0, Math.ceil((Math.min(n_u0, n_u1, n_u2) - n_u__origin) / n_h));
        let n_iu__to = Math.min(n_cnt__u - 1, Math.floor((Math.max(n_u0, n_u1, n_u2) - n_u__origin) / n_h));
        let n_iv__from = Math.max(0, Math.ceil((Math.min(n_v0, n_v1, n_v2) - n_v__origin) / n_h));
        let n_iv__to = Math.min(n_cnt__v - 1, Math.floor((Math.max(n_v0, n_v1, n_v2) - n_v__origin) / n_h));
        for(let n_iv = n_iv__from; n_iv <= n_iv__to; n_iv++){
            let n_vl = n_v__origin + n_iv * n_h;
            for(let n_iu = n_iu__from; n_iu <= n_iu__to; n_iu++){
                let n_ul = n_u__origin + n_iu * n_h;
                let n_b0 = ((n_u1 - n_ul) * (n_v2 - n_vl) - (n_u2 - n_ul) * (n_v1 - n_vl)) / n_area;
                let n_b1 = ((n_u2 - n_ul) * (n_v0 - n_vl) - (n_u0 - n_ul) * (n_v2 - n_vl)) / n_area;
                let n_b2 = 1 - n_b0 - n_b1;
                if(n_b0 < 0 || n_b1 < 0 || n_b2 < 0){ continue; }
                o_line.f_add(n_iu + n_cnt__u * n_iv);
                o_w.f_add(n_b0 * n_w0 + n_b1 * n_w1 + n_b2 * n_w2);
                // The triangle's number, and in its lowest bit whether its normal points along the line.
                o_from.f_add((n_off / 9) * 2 + (n_area > 0 ? 1 : 0));
            }
        }
    }
    // By line, then along each line.
    let n_cnt__line = n_cnt__u * n_cnt__v;
    let a_n_start = new Int32Array(n_cnt__line + 1);
    for(let n_it = 0; n_it < o_line.n_cnt; n_it++){ a_n_start[o_line.a_n[n_it] + 1]++; }
    for(let n_it = 0; n_it < n_cnt__line; n_it++){ a_n_start[n_it + 1] += a_n_start[n_it]; }
    let a_n_w = new Float32Array(o_line.n_cnt), a_n_from = new Int32Array(o_line.n_cnt);
    let a_n_next = a_n_start.slice(0, n_cnt__line);
    for(let n_it = 0; n_it < o_line.n_cnt; n_it++){
        let n_to = a_n_next[o_line.a_n[n_it]]++;
        a_n_w[n_to] = o_w.a_n[n_it];
        a_n_from[n_to] = o_from.a_n[n_it];
    }
    for(let n_line = 0; n_line < n_cnt__line; n_line++){
        for(let n_it = a_n_start[n_line] + 1; n_it < a_n_start[n_line + 1]; n_it++){
            let n_w = a_n_w[n_it], n_from = a_n_from[n_it];
            let n_to = n_it - 1;
            while(n_to >= a_n_start[n_line] && a_n_w[n_to] > n_w){
                a_n_w[n_to + 1] = a_n_w[n_to];
                a_n_from[n_to + 1] = a_n_from[n_to];
                n_to--;
            }
            a_n_w[n_to + 1] = n_w;
            a_n_from[n_to + 1] = n_from;
        }
    }
    return { n_axis, n_u, n_v, n_cnt__u, n_cnt__v, a_n_start, a_n_w, a_n_from };
};

// Counts for every grid point how many of the three directions find it inside the
// object. A line that does not come out of the object as often as it went in ran
// through a hole in its surface: it has no say.
let f_vote = function(o_dexel, o_grid, a_n_in, a_n_valid){
    let { n_axis, n_u, n_v, n_cnt__u, n_cnt__v, a_n_start, a_n_w, a_n_from } = o_dexel;
    let n_cnt__n = o_grid.a_n_cnt[n_axis];
    let n_stride = o_grid.a_n_stride[n_axis], n_stride__u = o_grid.a_n_stride[n_u], n_stride__v = o_grid.a_n_stride[n_v];
    let n_origin = o_grid.a_n_origin[n_axis], n_h = o_grid.n_h;
    for(let n_iv = 0; n_iv < n_cnt__v; n_iv++){
        for(let n_iu = 0; n_iu < n_cnt__u; n_iu++){
            let n_line = n_iu + n_cnt__u * n_iv;
            let n_from = a_n_start[n_line], n_to = a_n_start[n_line + 1];
            let n_sum = 0;
            for(let n_it = n_from; n_it < n_to; n_it++){ n_sum += (a_n_from[n_it] & 1) ? -1 : 1; }
            if(n_sum !== 0){ continue; }
            let n_idx = n_iu * n_stride__u + n_iv * n_stride__v;
            let n_inside = 0;
            let n_it = n_from;
            for(let n_n = 0; n_n < n_cnt__n; n_n++, n_idx += n_stride){
                let n_w = n_origin + n_n * n_h;
                // A triangle whose normal points against the line lets it in.
                while(n_it < n_to && a_n_w[n_it] <= n_w){ n_inside += (a_n_from[n_it] & 1) ? -1 : 1; n_it++; }
                a_n_valid[n_idx]++;
                if(n_inside !== 0){ a_n_in[n_idx]++; }
            }
        }
    }
};

// The stem on the neck: a cylinder up to n_z__stem, closed by a 45 degree cone, so
// that it prints without support inside where the object is narrower than the neck.
let f_n_r__stem = function(n_r, n_z__stem, n_z){
    return n_z <= n_z__stem ? n_r : n_r - (n_z - n_z__stem);
};

// How far a point is from the stem's surface, below 0 inside it: n_r__at from the
// axis, at the height n_z. The stem has no bottom: it goes on down into the neck.
let f_n_mm__to_stem = function(n_r, n_z__stem, n_r__at, n_z){
    // To the cylinder's wall, which ends at the cone.
    let n_mm__wall = n_z <= n_z__stem ? Math.abs(n_r__at - n_r) : Math.hypot(n_r__at - n_r, n_z - n_z__stem);
    // To the cone, from the cylinder's edge up to its point on the axis.
    let n_along = Math.max(0, Math.min(n_r * Math.SQRT2, ((n_r - n_r__at) + (n_z - n_z__stem)) * Math.SQRT1_2));
    let n_mm__cone = Math.hypot(n_r__at - (n_r - n_along * Math.SQRT1_2), n_z - (n_z__stem + n_along * Math.SQRT1_2));
    let b_inside = n_r__at < n_r && n_r__at + n_z < n_r + n_z__stem;
    return (b_inside ? -1 : 1) * Math.min(n_mm__wall, n_mm__cone);
};

// The corners of the six tetrahedra a grid cell is cut into, around its diagonal: as
// bits, 1 for x, 2 for y, 4 for z. Every cell is cut the same way, so they fit.
let a_a_n_corner__tet = [[0, 1, 3, 7], [0, 1, 5, 7], [0, 2, 3, 7], [0, 2, 6, 7], [0, 4, 5, 7], [0, 4, 6, 7]];

// The surface where the grid's numbers are n_level, as triangles that face the higher
// numbers, or with b_flip the lower ones. Open only on the grid's lowest plane: the
// points there are a_n_idx__bottom. With the grid points' samples, a_n_idx__sample
// tells each point of the surface its own.
let f_o_surface = function(a_n_phi, n_level, o_grid, b_flip, a_n_idx__sample = null){
    let [n_cnt__x, n_cnt__y, n_cnt__z] = o_grid.a_n_cnt;
    let n_h = o_grid.n_h;
    let [n_x__origin, n_y__origin, n_z__origin] = o_grid.a_n_origin;
    let n_cnt__layer = n_cnt__x * n_cnt__y;
    let o_pos = f_o_list(Float32Array, 1 << 16), o_idx = f_o_list(Uint32Array, 1 << 16), o_bottom = f_o_list(Uint32Array, 1 << 10);
    let o_sample = f_o_list(Int32Array, 1 << 16);
    // The points already made on the cell edges, by the edge's lower corner and its
    // direction: in a layer x, y and across; between two layers the four that rise.
    let a_n_point__low = new Int32Array(n_cnt__layer * 3).fill(-1);
    let a_n_point__high = new Int32Array(n_cnt__layer * 3).fill(-1);
    let a_n_point__rise = new Int32Array(n_cnt__layer * 4).fill(-1);
    let a_n_val = new Float64Array(8);
    let a_n_idx__node = new Int32Array(8);
    let a_n_point = new Int32Array(4);

    // The point on the edge between two corners of the cell at n_i, n_j, n_k.
    let f_n_point = function(n_i, n_j, n_k, n_a, n_b){
        if(n_a > n_b){ let n = n_a; n_a = n_b; n_b = n; }
        let n_dir = n_b - n_a;
        let n_ia = n_i + (n_a & 1), n_ja = n_j + ((n_a >> 1) & 1), n_ka = n_k + (n_a >> 2);
        let a_n_cache = n_dir >= 4 ? a_n_point__rise : (n_a >= 4 ? a_n_point__high : a_n_point__low);
        let n_slot = (n_ia + n_cnt__x * n_ja) * (n_dir >= 4 ? 4 : 3) + (n_dir >= 4 ? n_dir - 4 : n_dir - 1);
        if(a_n_cache[n_slot] >= 0){ return a_n_cache[n_slot]; }
        let n_va = a_n_val[n_a], n_vb = a_n_val[n_b];
        let n_t = Math.max(0.001, Math.min(0.999, n_va / (n_va - n_vb)));
        let n_idx = o_pos.n_cnt / 3;
        o_pos.f_add(n_x__origin + (n_ia + n_t * (n_dir & 1)) * n_h);
        o_pos.f_add(n_y__origin + (n_ja + n_t * ((n_dir >> 1) & 1)) * n_h);
        o_pos.f_add(n_z__origin + (n_ka + n_t * (n_dir >> 2)) * n_h);
        if(n_ka === 0 && n_dir < 4){ o_bottom.f_add(n_idx); }
        if(a_n_idx__sample){
            // The sample of the edge's nearer end, or of the other end if that one has none.
            let n_idx__near = a_n_idx__sample[a_n_idx__node[n_t < 0.5 ? n_a : n_b]];
            o_sample.f_add(n_idx__near === n_idx__none ? a_n_idx__sample[a_n_idx__node[n_t < 0.5 ? n_b : n_a]] : n_idx__near);
        }
        a_n_cache[n_slot] = n_idx;
        return n_idx;
    };
    // A triangle, turned so that it faces from the lower numbers to the higher ones:
    // n_dx, n_dy, n_dz points that way.
    let f_add_triangle = function(n_p0, n_p1, n_p2, n_dx, n_dy, n_dz){
        let a_n = o_pos.a_n;
        let n_ux = a_n[n_p1 * 3] - a_n[n_p0 * 3], n_uy = a_n[n_p1 * 3 + 1] - a_n[n_p0 * 3 + 1], n_uz = a_n[n_p1 * 3 + 2] - a_n[n_p0 * 3 + 2];
        let n_vx = a_n[n_p2 * 3] - a_n[n_p0 * 3], n_vy = a_n[n_p2 * 3 + 1] - a_n[n_p0 * 3 + 1], n_vz = a_n[n_p2 * 3 + 2] - a_n[n_p0 * 3 + 2];
        let b_swap = ((n_uy * n_vz - n_uz * n_vy) * n_dx + (n_uz * n_vx - n_ux * n_vz) * n_dy + (n_ux * n_vy - n_uy * n_vx) * n_dz < 0) !== b_flip;
        o_idx.f_add(n_p0);
        o_idx.f_add(b_swap ? n_p2 : n_p1);
        o_idx.f_add(b_swap ? n_p1 : n_p2);
    };

    for(let n_k = 0; n_k < n_cnt__z - 1; n_k++){
        for(let n_j = 0; n_j < n_cnt__y - 1; n_j++){
            let n_idx__row = n_cnt__x * (n_j + n_cnt__y * n_k);
            for(let n_i = 0; n_i < n_cnt__x - 1; n_i++){
                let n_idx = n_idx__row + n_i;
                let n_cnt__below = 0;
                for(let n_c = 0; n_c < 8; n_c++){
                    let n_idx__c = n_idx + (n_c & 1) + ((n_c >> 1) & 1) * n_cnt__x + (n_c >> 2) * n_cnt__layer;
                    a_n_idx__node[n_c] = n_idx__c;
                    let n_val = a_n_phi[n_idx__c] - n_level;
                    // No point of the grid lies on the surface itself.
                    a_n_val[n_c] = n_val === 0 ? 1e-9 : n_val;
                    if(n_val < 0){ n_cnt__below++; }
                }
                if(n_cnt__below === 0 || n_cnt__below === 8){ continue; }
                for(let a_n_corner of a_a_n_corner__tet){
                    // The corners below the surface first.
                    let n_cnt__in = 0, n_cnt__out = 0;
                    let a_n_in = [0, 0, 0, 0], a_n_out = [0, 0, 0, 0];
                    for(let n_c of a_n_corner){
                        if(a_n_val[n_c] < 0){ a_n_in[n_cnt__in++] = n_c; } else { a_n_out[n_cnt__out++] = n_c; }
                    }
                    if(n_cnt__in === 0 || n_cnt__in === 4){ continue; }
                    // From the corners below to those above: the way the triangles face.
                    let n_dx = 0, n_dy = 0, n_dz = 0;
                    for(let n_it = 0; n_it < n_cnt__out; n_it++){
                        n_dx += (a_n_out[n_it] & 1) / n_cnt__out; n_dy += ((a_n_out[n_it] >> 1) & 1) / n_cnt__out; n_dz += (a_n_out[n_it] >> 2) / n_cnt__out;
                    }
                    for(let n_it = 0; n_it < n_cnt__in; n_it++){
                        n_dx -= (a_n_in[n_it] & 1) / n_cnt__in; n_dy -= ((a_n_in[n_it] >> 1) & 1) / n_cnt__in; n_dz -= (a_n_in[n_it] >> 2) / n_cnt__in;
                    }
                    if(n_cnt__in === 1 || n_cnt__in === 3){
                        // One corner alone on its side: a triangle around it.
                        let n_alone = n_cnt__in === 1 ? a_n_in[0] : a_n_out[0];
                        let a_n_other = n_cnt__in === 1 ? a_n_out : a_n_in;
                        for(let n_it = 0; n_it < 3; n_it++){ a_n_point[n_it] = f_n_point(n_i, n_j, n_k, n_alone, a_n_other[n_it]); }
                        f_add_triangle(a_n_point[0], a_n_point[1], a_n_point[2], n_dx, n_dy, n_dz);
                    } else {
                        // Two and two: a square between them.
                        a_n_point[0] = f_n_point(n_i, n_j, n_k, a_n_in[0], a_n_out[0]);
                        a_n_point[1] = f_n_point(n_i, n_j, n_k, a_n_in[0], a_n_out[1]);
                        a_n_point[2] = f_n_point(n_i, n_j, n_k, a_n_in[1], a_n_out[1]);
                        a_n_point[3] = f_n_point(n_i, n_j, n_k, a_n_in[1], a_n_out[0]);
                        f_add_triangle(a_n_point[0], a_n_point[1], a_n_point[2], n_dx, n_dy, n_dz);
                        f_add_triangle(a_n_point[0], a_n_point[2], a_n_point[3], n_dx, n_dy, n_dz);
                    }
                }
            }
        }
        // The layer above becomes the layer below.
        let a_n = a_n_point__low;
        a_n_point__low = a_n_point__high;
        a_n_point__high = a_n;
        a_n_point__high.fill(-1);
        a_n_point__rise.fill(-1);
    }
    return {
        a_n_pos: o_pos.a_n.subarray(0, o_pos.n_cnt),
        a_n_idx: o_idx.a_n.subarray(0, o_idx.n_cnt),
        a_n_idx__bottom: o_bottom.a_n.subarray(0, o_bottom.n_cnt),
        a_n_idx__sample: o_sample.a_n.subarray(0, o_sample.n_cnt)
    };
};

// The bulb of an object. n_mm__voxel is the grid's step, n_cnt__neck_column the
// thread's columns. a_n_col__corner: the object's colours, r, g, b from 0 to 255 for
// each corner of each triangle, or null; with them the bulb has a_n_col.
let f_o_mesh__object = function(a_n_tri, o_param, o_lamp, n_mm__voxel, n_cnt__neck_column, a_n_col__corner = null){
    let n_r = o_lamp.n_mm__neck_d / 2;
    let n_z__ring = o_lamp.n_mm__neck_scl_z;
    let n_z__stem = n_mm__base_z + o_param.n_mm__stem;
    let n_mm__wall = o_param.n_mm__wall;
    let o_grid = f_o_grid(a_n_tri, n_mm__voxel, n_r, n_z__stem + n_r);
    // The grid's planes are at round heights above its lowest one, where an object's flat
    // top often is too: a face through grid points counts as inside along two directions
    // and as outside along the third, and the outside stood half a step too high. The
    // grid is offset in x and y for that; in z it cannot be, so the object is lifted by
    // a part of a step that no round number makes: 0.004 mm at 0.3.
    let n_mm__lift = 0.0137 * o_grid.n_h;
    a_n_tri = a_n_tri.map(function(n_val, n_idx){ return n_idx % 3 === 2 ? n_val + n_mm__lift : n_val; });
    let n_h = o_grid.n_h;
    let [n_cnt__x, n_cnt__y, n_cnt__z] = o_grid.a_n_cnt;
    let [n_x__origin, n_y__origin, n_z__origin] = o_grid.a_n_origin;
    let n_cnt__layer = n_cnt__x * n_cnt__y;

    // 1. Inside or outside the object, by the vote of the three directions.
    let a_o_dexel = [0, 1, 2].map(function(n_axis){ return f_o_dexel(a_n_tri, n_axis, o_grid); });
    let a_n_in = new Uint8Array(o_grid.n_cnt), a_n_valid = new Uint8Array(o_grid.n_cnt);
    for(let o_dexel of a_o_dexel){ f_vote(o_dexel, o_grid, a_n_in, a_n_valid); }

    // 2. With the stem. On the lowest plane there is the stem alone, so both surfaces
    // end there on a circle. a_n_flag says what a grid point is in.
    let a_n_flag = a_n_valid;
    let a_n_queue = new Int32Array(o_grid.n_cnt);
    let n_cnt__queue = 0;
    let n_cnt__object = 0;
    for(let n_k = 0; n_k < n_cnt__z; n_k++){
        let n_z = n_z__origin + n_k * n_h;
        let n_r__here = f_n_r__stem(n_r, n_z__stem, n_z);
        for(let n_j = 0; n_j < n_cnt__y; n_j++){
            let n_y = n_y__origin + n_j * n_h;
            for(let n_i = 0; n_i < n_cnt__x; n_i++){
                let n_idx = n_i + n_cnt__x * (n_j + n_cnt__y * n_k);
                let n_x = n_x__origin + n_i * n_h;
                let b_object = n_k >= 1 && 2 * a_n_in[n_idx] > a_n_valid[n_idx];
                let b_stem = n_r__here > 0 && n_x * n_x + n_y * n_y < n_r__here * n_r__here;
                a_n_flag[n_idx] = (b_object ? n_bit__object : 0) | (b_stem ? n_bit__stem : 0);
                if(b_object){ n_cnt__object++; }
                // Kept is what hangs together with the stem: marked by a bit of its own.
                if(b_stem){ a_n_flag[n_idx] |= 4; a_n_queue[n_cnt__queue++] = n_idx; }
            }
        }
    }
    for(let n_it = 0; n_it < n_cnt__queue; n_it++){
        let n_idx = a_n_queue[n_it];
        let n_i = n_idx % n_cnt__x, n_j = Math.floor(n_idx / n_cnt__x) % n_cnt__y, n_k = Math.floor(n_idx / n_cnt__layer);
        for(let n_dir = 0; n_dir < 6; n_dir++){
            let n_axis = n_dir >> 1, n_step = (n_dir & 1) ? 1 : -1;
            let n_at = (n_axis === 0 ? n_i : (n_axis === 1 ? n_j : n_k)) + n_step;
            if(n_at < 0 || n_at >= o_grid.a_n_cnt[n_axis]){ continue; }
            let n_idx__next = n_idx + n_step * o_grid.a_n_stride[n_axis];
            if(a_n_flag[n_idx__next] !== 0 && !(a_n_flag[n_idx__next] & 4)){
                a_n_flag[n_idx__next] |= 4;
                a_n_queue[n_cnt__queue++] = n_idx__next;
            }
        }
    }
    let n_cnt__kept = 0, n_cnt__loose = 0;
    for(let n_idx = 0; n_idx < o_grid.n_cnt; n_idx++){
        if(a_n_flag[n_idx] & 4){
            a_n_flag[n_idx] &= 3;
            if(a_n_flag[n_idx] & n_bit__object){ n_cnt__kept++; }
        } else if(a_n_flag[n_idx] !== 0){
            a_n_flag[n_idx] = 0;
            n_cnt__loose++;
        }
    }

    // 3. Each crossing of the object's surface is a point with its direction. A grid
    // point takes the nearest one, and its distance from that point's plane: exact
    // where the surface is flat. Next to an edge it takes a second one, from the
    // edge's other side. Outside is above 0, inside below.
    let a_n_phi = new Float32Array(o_grid.n_cnt);
    for(let n_idx = 0; n_idx < o_grid.n_cnt; n_idx++){ a_n_phi[n_idx] = (a_n_flag[n_idx] & n_bit__object) ? -n_big : n_big; }
    let a_n_idx__sample = new Int32Array(o_grid.n_cnt).fill(n_idx__none);
    let a_n_idx__sample_2 = new Int32Array(o_grid.n_cnt).fill(n_idx__none);
    let o_sample = f_o_list(Float32Array, 1 << 16);
    // The triangle a sample has its colour from.
    let o_tri__sample = f_o_list(Int32Array, 1 << 14);
    // How far a grid point is from a sample: by its plane where the point lies in
    // front of it, no further to the side than the samples are apart; by the sample
    // itself where it lies far to its side, as beyond an edge.
    let f_n_mm__to_sample = function(n_idx__sample, n_x, n_y, n_z){
        let a_n = o_sample.a_n, n_off = n_idx__sample * 6;
        let n_dx = n_x - a_n[n_off], n_dy = n_y - a_n[n_off + 1], n_dz = n_z - a_n[n_off + 2];
        let n_mm2 = n_dx * n_dx + n_dy * n_dy + n_dz * n_dz;
        let n_mm__plane = Math.abs(n_dx * a_n[n_off + 3] + n_dy * a_n[n_off + 4] + n_dz * a_n[n_off + 5]);
        let n_mm__aside = Math.sqrt(Math.max(0, n_mm2 - n_mm__plane * n_mm__plane));
        let n_nor = Math.max(0, Math.min(1, n_mm__aside / n_h - 1));
        return n_mm__plane + (Math.sqrt(n_mm2) - n_mm__plane) * n_nor;
    };
    let f_n_mm2__to_sample = function(n_idx__sample, n_x, n_y, n_z){
        let a_n = o_sample.a_n, n_off = n_idx__sample * 6;
        let n_dx = n_x - a_n[n_off], n_dy = n_y - a_n[n_off + 1], n_dz = n_z - a_n[n_off + 2];
        return n_dx * n_dx + n_dy * n_dy + n_dz * n_dz;
    };
    // Whether two samples lie on two sides of an edge: their directions differ.
    let f_b_edge = function(n_idx__a, n_idx__b){
        let a_n = o_sample.a_n, n_a = n_idx__a * 6, n_b = n_idx__b * 6;
        return a_n[n_a + 3] * a_n[n_b + 3] + a_n[n_a + 4] * a_n[n_b + 4] + a_n[n_a + 5] * a_n[n_b + 5] < n_cos__edge;
    };
    // Gives a grid point near the surface a sample: as its nearest, or as the nearest
    // from another side of an edge.
    let f_take_near = function(n_idx, n_x, n_y, n_z, n_idx__sample){
        let n_idx__first = a_n_idx__sample[n_idx];
        if(n_idx__first < 0){
            a_n_idx__sample[n_idx] = n_idx__sample;
            return;
        }
        let n_mm2 = f_n_mm2__to_sample(n_idx__sample, n_x, n_y, n_z);
        let n_idx__second = a_n_idx__sample_2[n_idx];
        if(n_mm2 < f_n_mm2__to_sample(n_idx__first, n_x, n_y, n_z)){
            a_n_idx__sample[n_idx] = n_idx__sample;
            // The one that was nearest may be the nearest of the other side now.
            if(f_b_edge(n_idx__sample, n_idx__first)){
                a_n_idx__sample_2[n_idx] = n_idx__first;
            } else if(n_idx__second >= 0 && !f_b_edge(n_idx__sample, n_idx__second)){
                a_n_idx__sample_2[n_idx] = -1;
            }
        } else if(f_b_edge(n_idx__first, n_idx__sample) && (n_idx__second < 0 || n_mm2 < f_n_mm2__to_sample(n_idx__second, n_x, n_y, n_z))){
            a_n_idx__sample_2[n_idx] = n_idx__sample;
        }
    };
    // How far a point is from the surface by a sample's plane: above 0 in front of it.
    let f_n_mm__to_plane = function(n_idx__sample, n_x, n_y, n_z){
        let a_n = o_sample.a_n, n_off = n_idx__sample * 6;
        return (n_x - a_n[n_off]) * a_n[n_off + 3] + (n_y - a_n[n_off + 1]) * a_n[n_off + 4] + (n_z - a_n[n_off + 2]) * a_n[n_off + 5];
    };
    // The distance of a grid point near the surface, from the samples it took. At an
    // edge that sticks out, the solid is behind both planes: a point is outside by the
    // plane it is further in front of, or, in front of both, by the edge itself.
    let f_set_near = function(n_idx, n_x, n_y, n_z){
        let n_idx__first = a_n_idx__sample[n_idx], n_idx__second = a_n_idx__sample_2[n_idx];
        let b_in = (a_n_flag[n_idx] & n_bit__object) !== 0;
        let n_mm = f_n_mm__to_sample(n_idx__first, n_x, n_y, n_z);
        if(n_idx__second >= 0){
            let a_n = o_sample.a_n, n_a = n_idx__first * 6, n_b = n_idx__second * 6;
            // It sticks out if each sample lies behind the other's plane.
            let b_out = f_n_mm__to_plane(n_idx__first, a_n[n_b], a_n[n_b + 1], a_n[n_b + 2]) < 0
                && f_n_mm__to_plane(n_idx__second, a_n[n_a], a_n[n_a + 1], a_n[n_a + 2]) < 0;
            if(b_out){
                let n_s1 = f_n_mm__to_plane(n_idx__first, n_x, n_y, n_z), n_s2 = f_n_mm__to_plane(n_idx__second, n_x, n_y, n_z);
                let n_cos = a_n[n_a + 3] * a_n[n_b + 3] + a_n[n_a + 4] * a_n[n_b + 4] + a_n[n_a + 5] * a_n[n_b + 5];
                let n_signed = Math.max(n_s1, n_s2);
                if(n_s1 > n_cos * n_s2 && n_s2 > n_cos * n_s1 && n_s1 > 0 && n_s2 > 0){
                    n_signed = Math.sqrt((n_s1 * n_s1 + n_s2 * n_s2 - 2 * n_cos * n_s1 * n_s2) / Math.max(1 - n_cos * n_cos, 1e-6));
                }
                // If the planes say the other side than the grid's lines did, the point is all but on the surface.
                n_mm = b_in === (n_signed < 0) ? Math.abs(n_signed) : 0;
            }
        }
        n_mm = Math.max(n_mm, 1e-4 * n_h);
        a_n_phi[n_idx] = b_in ? -n_mm : n_mm;
    };
    // Gives the grid point at n_x, n_y, n_z a sample, if it is nearer than the one it has.
    let f_b_taken = function(n_idx, n_x, n_y, n_z, n_idx__sample){
        let n_idx__before = a_n_idx__sample[n_idx];
        if(n_idx__before >= 0 && f_n_mm2__to_sample(n_idx__before, n_x, n_y, n_z) <= f_n_mm2__to_sample(n_idx__sample, n_x, n_y, n_z)){ return false; }
        a_n_idx__sample[n_idx] = n_idx__sample;
        let n_mm = Math.max(f_n_mm__to_sample(n_idx__sample, n_x, n_y, n_z), 1e-4 * n_h);
        a_n_phi[n_idx] = (a_n_flag[n_idx] & n_bit__object) ? -n_mm : n_mm;
        return true;
    };
    let a_n_point = [0, 0, 0], a_n_dir = [0, 0, 0], a_n_at = [0, 0, 0];
    for(let o_dexel of a_o_dexel){
        let { n_axis, n_u, n_v, n_cnt__u, n_cnt__v, a_n_start, a_n_w, a_n_from } = o_dexel;
        let n_cnt__n = o_grid.a_n_cnt[n_axis];
        let n_stride = o_grid.a_n_stride[n_axis], n_stride__u = o_grid.a_n_stride[n_u], n_stride__v = o_grid.a_n_stride[n_v];
        for(let n_iv = 0; n_iv < n_cnt__v; n_iv++){
            for(let n_iu = 0; n_iu < n_cnt__u; n_iu++){
                let n_line = n_iu + n_cnt__u * n_iv;
                let n_it = a_n_start[n_line], n_to = a_n_start[n_line + 1];
                let n_idx__line = n_iu * n_stride__u + n_iv * n_stride__v;
                // Where this line is, in the two directions across it.
                let n_ul = o_grid.a_n_origin[n_u] + n_iu * n_h, n_vl = o_grid.a_n_origin[n_v] + n_iv * n_h;
                for(let n_n = 0; n_n < n_cnt__n - 1; n_n++){
                    let n_idx = n_idx__line + n_n * n_stride;
                    let b_in = (a_n_flag[n_idx] & n_bit__object) !== 0;
                    let n_w = o_grid.a_n_origin[n_axis] + n_n * n_h;
                    while(n_it < n_to && a_n_w[n_it] <= n_w){ n_it++; }
                    if(b_in === ((a_n_flag[n_idx + n_stride] & n_bit__object) !== 0)){ continue; }
                    // Which way is out, along the line.
                    let n_sign = b_in ? 1 : -1;
                    // Half way, where no crossing is found: on the collar's top, where the
                    // object is cut off, and where the three directions did not agree.
                    let n_w__best = n_w + 0.5 * n_h;
                    a_n_dir[0] = 0; a_n_dir[1] = 0; a_n_dir[2] = 0;
                    a_n_dir[n_axis] = n_sign;
                    let n_tri = -1;
                    if(n_it < n_to && a_n_w[n_it] <= n_w + n_h){
                        n_tri = a_n_from[n_it] >> 1;
                        let n_off = n_tri * 9;
                        let n_ux = a_n_tri[n_off + 3] - a_n_tri[n_off], n_uy = a_n_tri[n_off + 4] - a_n_tri[n_off + 1], n_uz = a_n_tri[n_off + 5] - a_n_tri[n_off + 2];
                        let n_vx = a_n_tri[n_off + 6] - a_n_tri[n_off], n_vy = a_n_tri[n_off + 7] - a_n_tri[n_off + 1], n_vz = a_n_tri[n_off + 8] - a_n_tri[n_off + 2];
                        let n_nx = n_uy * n_vz - n_uz * n_vy, n_ny = n_uz * n_vx - n_ux * n_vz, n_nz = n_ux * n_vy - n_uy * n_vx;
                        let n_len = Math.hypot(n_nx, n_ny, n_nz);
                        if(n_len > 0){
                            n_w__best = a_n_w[n_it];
                            a_n_dir[0] = n_nx / n_len; a_n_dir[1] = n_ny / n_len; a_n_dir[2] = n_nz / n_len;
                            // The direction points out of the object, whatever way the triangle was turned.
                            if(a_n_dir[n_axis] * n_sign < 0){ a_n_dir[0] = -a_n_dir[0]; a_n_dir[1] = -a_n_dir[1]; a_n_dir[2] = -a_n_dir[2]; }
                        }
                    }
                    a_n_point[n_axis] = n_w__best; a_n_point[n_u] = n_ul; a_n_point[n_v] = n_vl;
                    let n_idx__sample = o_sample.n_cnt / 6;
                    o_sample.f_add(a_n_point[0]); o_sample.f_add(a_n_point[1]); o_sample.f_add(a_n_point[2]);
                    o_sample.f_add(a_n_dir[0]); o_sample.f_add(a_n_dir[1]); o_sample.f_add(a_n_dir[2]);
                    o_tri__sample.f_add(n_tri);
                    // The edge's two ends, and their neighbours across the line.
                    for(let n_dn = 0; n_dn <= 1; n_dn++){
                        a_n_at[n_axis] = n_w + n_dn * n_h;
                        for(let n_dv = -1; n_dv <= 1; n_dv++){
                            if(n_iv + n_dv < 0 || n_iv + n_dv >= n_cnt__v){ continue; }
                            a_n_at[n_v] = n_vl + n_dv * n_h;
                            for(let n_du = -1; n_du <= 1; n_du++){
                                if(n_iu + n_du < 0 || n_iu + n_du >= n_cnt__u){ continue; }
                                a_n_at[n_u] = n_ul + n_du * n_h;
                                f_take_near(n_idx + n_dn * n_stride + n_du * n_stride__u + n_dv * n_stride__v, a_n_at[0], a_n_at[1], a_n_at[2], n_idx__sample);
                            }
                        }
                    }
                }
            }
        }
    }
    // Inwards, as deep as the wall and as far beyond it as the inside's coarser grid
    // looks: a point takes the sample of a neighbour, if it has none nearer.
    let n_mm__reach = n_mm__wall + 4 * n_h;
    let n_cnt__front = 0;
    for(let n_idx = 0; n_idx < o_grid.n_cnt; n_idx++){
        if(a_n_idx__sample[n_idx] < 0){ continue; }
        f_set_near(n_idx, n_x__origin + (n_idx % n_cnt__x) * n_h, n_y__origin + (Math.floor(n_idx / n_cnt__x) % n_cnt__y) * n_h, n_z__origin + Math.floor(n_idx / n_cnt__layer) * n_h);
        if(a_n_flag[n_idx] & n_bit__object){ a_n_queue[n_cnt__front++] = n_idx; }
    }
    for(let n_it = 0; n_it < n_cnt__front; n_it++){
        let n_idx = a_n_queue[n_it];
        if(-a_n_phi[n_idx] > n_mm__reach){ continue; }
        a_n_point[0] = n_idx % n_cnt__x; a_n_point[1] = Math.floor(n_idx / n_cnt__x) % n_cnt__y; a_n_point[2] = Math.floor(n_idx / n_cnt__layer);
        for(let n_dir = 0; n_dir < 6; n_dir++){
            let n_axis = n_dir >> 1, n_step = (n_dir & 1) ? 1 : -1;
            if(a_n_point[n_axis] + n_step < 0 || a_n_point[n_axis] + n_step >= o_grid.a_n_cnt[n_axis]){ continue; }
            let n_idx__next = n_idx + n_step * o_grid.a_n_stride[n_axis];
            if(!(a_n_flag[n_idx__next] & n_bit__object)){ continue; }
            a_n_at[0] = n_x__origin + a_n_point[0] * n_h; a_n_at[1] = n_y__origin + a_n_point[1] * n_h; a_n_at[2] = n_z__origin + a_n_point[2] * n_h;
            a_n_at[n_axis] += n_step * n_h;
            if(f_b_taken(n_idx__next, a_n_at[0], a_n_at[1], a_n_at[2], a_n_idx__sample[n_idx])){
                // The list is as long as the grid: a point that is in it more often waits its turn.
                if(n_cnt__front < a_n_queue.length){ a_n_queue[n_cnt__front++] = n_idx__next; }
            }
        }
    }
    // With the stem, whose surface is known by its formula: of the two the nearer.
    // Deep inside either, a point is deep inside the bulb. On the lowest plane
    // there is the stem alone, so both surfaces end there on a true circle.
    for(let n_k = 0; n_k < n_cnt__z; n_k++){
        let n_z = n_z__origin + n_k * n_h;
        if(n_z > n_z__stem + n_r + n_mm__reach){ break; }
        for(let n_j = 0; n_j < n_cnt__y; n_j++){
            let n_y = n_y__origin + n_j * n_h;
            for(let n_i = 0; n_i < n_cnt__x; n_i++){
                let n_idx = n_i + n_cnt__x * (n_j + n_cnt__y * n_k);
                let n_mm = f_n_mm__to_stem(n_r, n_z__stem, Math.hypot(n_x__origin + n_i * n_h, n_y), n_z);
                if(n_k === 0 || n_mm < a_n_phi[n_idx]){
                    a_n_phi[n_idx] = n_mm === 0 ? 1e-4 * n_h : n_mm;
                    a_n_idx__sample[n_idx] = n_idx__stem;
                }
            }
        }
    }

    // For the colours: where the object's surface has a hole, a sample has no triangle.
    // A grid point with such a sample takes the sample of the nearest grid point that
    // has one.
    if(a_n_col__corner){
        let a_n_idx__bare = [];
        for(let n_idx = 0; n_idx < o_grid.n_cnt; n_idx++){
            if(a_n_idx__sample[n_idx] >= 0 && o_tri__sample.a_n[a_n_idx__sample[n_idx]] < 0){ a_n_idx__bare.push(n_idx); }
        }
        for(let n_cnt__before = -1; a_n_idx__bare.length !== n_cnt__before;){
            n_cnt__before = a_n_idx__bare.length;
            a_n_idx__bare = a_n_idx__bare.filter(function(n_idx){
                a_n_point[0] = n_idx % n_cnt__x; a_n_point[1] = Math.floor(n_idx / n_cnt__x) % n_cnt__y; a_n_point[2] = Math.floor(n_idx / n_cnt__layer);
                for(let n_dir = 0; n_dir < 6; n_dir++){
                    let n_axis = n_dir >> 1, n_step = (n_dir & 1) ? 1 : -1;
                    if(a_n_point[n_axis] + n_step < 0 || a_n_point[n_axis] + n_step >= o_grid.a_n_cnt[n_axis]){ continue; }
                    let n_idx__sample = a_n_idx__sample[n_idx + n_step * o_grid.a_n_stride[n_axis]];
                    if(n_idx__sample >= 0 && o_tri__sample.a_n[n_idx__sample] >= 0){
                        a_n_idx__sample[n_idx] = n_idx__sample;
                        return false;
                    }
                }
                return true;
            });
        }
    }

    // 4. The outside, and the inside one wall deeper, on the same grid: a bulb's wall is
    // thin enough that a coarser inside would show, lit, as thicker and thinner places.
    let o_outside = f_o_surface(a_n_phi, 0, o_grid, false, a_n_col__corner && a_n_idx__sample);
    let o_inside = f_o_surface(a_n_phi, -n_mm__wall, o_grid, true, a_n_col__corner && a_n_idx__sample);

    // 5. The neck, as every bulb's: the bore's rings with the thread, a row about every
    // 0.1 mm, then the outside's two rings. The two surfaces are sewn to its top rings:
    // the outside to the outside's, the inside to the bore's.
    let n_cnt__neck_row = Math.ceil(n_z__ring / (o_lamp.n_mm__thread_pitch / 20) - 1e-6);
    let n_cnt__column = n_cnt__neck_column;
    let n_cnt__neck = (n_cnt__neck_row + 3) * n_cnt__column;
    let n_cnt__outside = o_outside.a_n_pos.length / 3, n_cnt__inside = o_inside.a_n_pos.length / 3;
    let n_cnt__vertex = n_cnt__neck + n_cnt__outside + n_cnt__inside;
    let a_n_pos = new Float32Array(n_cnt__vertex * 3);
    let a_n_wall = new Float32Array(n_cnt__vertex);
    for(let n_row = 0; n_row <= n_cnt__neck_row + 2; n_row++){
        for(let n_c = 0; n_c < n_cnt__column; n_c++){
            let n_rad = n_tau * n_c / n_cnt__column;
            let n_z = n_row <= n_cnt__neck_row ? n_z__ring * n_row / n_cnt__neck_row : (n_row === n_cnt__neck_row + 1 ? 0 : n_z__ring);
            let n_r__bore = f_n_radius__bore(o_lamp, n_z, n_rad);
            let n_r__here = n_row <= n_cnt__neck_row ? n_r__bore : n_r;
            a_n_pos.set([n_r__here * Math.cos(n_rad), n_r__here * Math.sin(n_rad), n_z], (n_row * n_cnt__column + n_c) * 3);
            a_n_wall[n_row * n_cnt__column + n_c] = n_r - n_r__bore;
        }
    }
    a_n_pos.set(o_outside.a_n_pos, n_cnt__neck * 3);
    a_n_pos.set(o_inside.a_n_pos, (n_cnt__neck + n_cnt__outside) * 3);

    // The wall for the Lit view: where there is a cavity behind the outside, the wall;
    // where the object is too thin for one, more.
    let a_n_nor = f_a_n_normal(o_outside.a_n_pos, o_outside.a_n_idx);
    for(let n_it = 0; n_it < n_cnt__outside; n_it++){
        let n_mm = n_mm__wall + 1.5 * n_h;
        let n_i = Math.round((o_outside.a_n_pos[n_it * 3] - a_n_nor[n_it * 3] * n_mm - n_x__origin) / n_h);
        let n_j = Math.round((o_outside.a_n_pos[n_it * 3 + 1] - a_n_nor[n_it * 3 + 1] * n_mm - n_y__origin) / n_h);
        let n_k = Math.round((o_outside.a_n_pos[n_it * 3 + 2] - a_n_nor[n_it * 3 + 2] * n_mm - n_z__origin) / n_h);
        let b_cavity = n_i >= 0 && n_j >= 0 && n_k >= 0 && n_i < n_cnt__x && n_j < n_cnt__y && n_k < n_cnt__z
            && a_n_phi[n_i + n_cnt__x * (n_j + n_cnt__y * n_k)] < -n_mm__wall;
        a_n_wall[n_cnt__neck + n_it] = b_cavity ? n_mm__wall : n_mm__solid;
    }
    a_n_wall.fill(n_mm__wall, n_cnt__neck + n_cnt__outside);

    // 6. The colours: a point of the bulb has its sample's, which is the object's
    // where the sample lies in its triangle. The neck, the stem and what has no
    // sample are plain.
    let a_n_col = null;
    if(a_n_col__corner){
        a_n_col = new Uint8Array(n_cnt__vertex * 3);
        for(let n_it = 0; n_it < n_cnt__vertex; n_it++){ a_n_col.set(a_n_col__plain, n_it * 3); }
        let f_set_col = function(n_idx__vertex, n_idx__sample){
            let n_tri = n_idx__sample >= 0 ? o_tri__sample.a_n[n_idx__sample] : -1;
            if(n_tri < 0){ return; }
            let n_off = n_tri * 9, n_at = n_idx__sample * 6;
            let a_n = o_sample.a_n;
            let n_ux = a_n_tri[n_off + 3] - a_n_tri[n_off], n_uy = a_n_tri[n_off + 4] - a_n_tri[n_off + 1], n_uz = a_n_tri[n_off + 5] - a_n_tri[n_off + 2];
            let n_vx = a_n_tri[n_off + 6] - a_n_tri[n_off], n_vy = a_n_tri[n_off + 7] - a_n_tri[n_off + 1], n_vz = a_n_tri[n_off + 8] - a_n_tri[n_off + 2];
            let n_dx = a_n[n_at] - a_n_tri[n_off], n_dy = a_n[n_at + 1] - a_n_tri[n_off + 1], n_dz = a_n[n_at + 2] - a_n_tri[n_off + 2];
            let n_uu = n_ux * n_ux + n_uy * n_uy + n_uz * n_uz, n_uv = n_ux * n_vx + n_uy * n_vy + n_uz * n_vz, n_vv = n_vx * n_vx + n_vy * n_vy + n_vz * n_vz;
            let n_du = n_dx * n_ux + n_dy * n_uy + n_dz * n_uz, n_dv = n_dx * n_vx + n_dy * n_vy + n_dz * n_vz;
            let n_det = n_uu * n_vv - n_uv * n_uv;
            // The shares of the triangle's second and third corner; the first has the rest.
            let n_b1 = n_det > 0 ? Math.max(0, Math.min(1, (n_vv * n_du - n_uv * n_dv) / n_det)) : 0;
            let n_b2 = n_det > 0 ? Math.max(0, Math.min(1 - n_b1, (n_uu * n_dv - n_uv * n_du) / n_det)) : 0;
            for(let n_k = 0; n_k < 3; n_k++){
                a_n_col[n_idx__vertex * 3 + n_k] = Math.round((1 - n_b1 - n_b2) * a_n_col__corner[n_off + n_k] + n_b1 * a_n_col__corner[n_off + 3 + n_k] + n_b2 * a_n_col__corner[n_off + 6 + n_k]);
            }
        };
        for(let n_it = 0; n_it < n_cnt__outside; n_it++){ f_set_col(n_cnt__neck + n_it, o_outside.a_n_idx__sample[n_it]); }
        for(let n_it = 0; n_it < n_cnt__inside; n_it++){ f_set_col(n_cnt__neck + n_cnt__outside + n_it, o_inside.a_n_idx__sample[n_it]); }
    }

    // A surface's points on the lowest plane, in order around the axis: a circle.
    let f_a_n_idx__loop = function(o_surface, n_off__vertex, n_r__expected, s_which){
        let a_o_point = Array.from(o_surface.a_n_idx__bottom, function(n_idx){
            let n_x = o_surface.a_n_pos[n_idx * 3], n_y = o_surface.a_n_pos[n_idx * 3 + 1];
            if(Math.abs(Math.hypot(n_x, n_y) - n_r__expected) > 4 * n_h){ throw new Error(`The ${s_which} of the bulb does not end on the neck: this should not happen.`); }
            let n_rad = Math.atan2(n_y, n_x);
            return { n_idx: n_idx + n_off__vertex, n_rad: n_rad < 0 ? n_rad + n_tau : n_rad };
        });
        if(a_o_point.length < 3){ throw new Error(`The ${s_which} of the bulb does not reach the neck: this should not happen.`); }
        return a_o_point.sort(function(o_a, o_b){ return o_a.n_rad - o_b.n_rad; });
    };
    let a_o_loop__outside = f_a_n_idx__loop(o_outside, n_cnt__neck, n_r, 'outside');
    let a_o_loop__inside = f_a_n_idx__loop(o_inside, n_cnt__neck + n_cnt__outside, n_r - n_mm__wall, 'inside');

    let n_cnt__triangle = 2 * n_cnt__neck_row * n_cnt__column
        + (n_cnt__column + a_o_loop__outside.length) + o_outside.a_n_idx.length / 3
        + o_inside.a_n_idx.length / 3 + (n_cnt__column + a_o_loop__inside.length)
        + 2 * n_cnt__column + 2 * n_cnt__column;
    let a_n_idx = new Uint32Array(n_cnt__triangle * 3);
    let n_off = 0;
    let f_add = function(n_a, n_b, n_c, b_flip){
        a_n_idx[n_off++] = n_a;
        a_n_idx[n_off++] = b_flip ? n_c : n_b;
        a_n_idx[n_off++] = b_flip ? n_b : n_c;
    };
    // Between two of the neck's rings, the lower one first: faces outwards.
    let f_add_strip = function(n_row__low, n_row__high, b_flip){
        for(let n_c = 0; n_c < n_cnt__column; n_c++){
            let n_a = n_row__low * n_cnt__column + n_c, n_a1 = n_row__low * n_cnt__column + (n_c + 1) % n_cnt__column;
            let n_b = n_row__high * n_cnt__column + n_c, n_b1 = n_row__high * n_cnt__column + (n_c + 1) % n_cnt__column;
            f_add(n_a, n_a1, n_b1, b_flip);
            f_add(n_a, n_b1, n_b, b_flip);
        }
    };
    // Between a ring of the neck and a surface's circle above it: they differ in their
    // number of points, so each step goes on along the one whose next point comes first.
    let f_add_seam = function(n_row, a_o_loop, b_flip){
        let n_cnt__loop = a_o_loop.length;
        for(let n_c = 0, n_l = 0; n_c < n_cnt__column || n_l < n_cnt__loop;){
            let n_a = n_row * n_cnt__column + n_c % n_cnt__column;
            let n_b = a_o_loop[n_l % n_cnt__loop].n_idx;
            let n_rad__ring = n_tau * (n_c + 1) / n_cnt__column;
            let n_rad__loop = n_l + 1 < n_cnt__loop ? a_o_loop[n_l + 1].n_rad : a_o_loop[0].n_rad + n_tau;
            if(n_l >= n_cnt__loop || (n_c < n_cnt__column && n_rad__ring <= n_rad__loop)){
                f_add(n_a, n_row * n_cnt__column + (n_c + 1) % n_cnt__column, n_b, b_flip);
                n_c++;
            } else {
                f_add(n_a, a_o_loop[(n_l + 1) % n_cnt__loop].n_idx, n_b, b_flip);
                n_l++;
            }
        }
    };
    // The neck first: the bore, facing the axis, and the outside. It is fixed, and
    // its overhangs do not count.
    for(let n_row = 0; n_row < n_cnt__neck_row; n_row++){ f_add_strip(n_row, n_row + 1, true); }
    f_add_strip(n_cnt__neck_row + 1, n_cnt__neck_row + 2, false);
    let n_idx__outside_start = n_off;
    f_add_seam(n_cnt__neck_row + 2, a_o_loop__outside, false);
    for(let n_it = 0; n_it < o_outside.a_n_idx.length; n_it++){ a_n_idx[n_off++] = o_outside.a_n_idx[n_it] + n_cnt__neck; }
    let n_idx__inside_start = n_off;
    for(let n_it = 0; n_it < o_inside.a_n_idx.length; n_it++){ a_n_idx[n_off++] = o_inside.a_n_idx[n_it] + n_cnt__neck + n_cnt__outside; }
    f_add_seam(n_cnt__neck_row, a_o_loop__inside, true);
    let n_idx__bottom_start = n_off;
    f_add_strip(0, n_cnt__neck_row + 1, false);

    let o_stat = f_o_stat__mesh(a_n_pos, a_n_idx, n_idx__outside_start, n_idx__inside_start, n_idx__bottom_start);
    return {
        a_n_pos,
        a_n_idx,
        a_n_wall,
        // Each point's colour, r, g, b from 0 to 255, if the object has colours.
        a_n_col,
        // The neck's points, which no setting moves.
        n_cnt__fixed: n_cnt__neck,
        // Where in a_n_idx the shell's triangles are, the object's and the stem's: the
        // rest is the neck.
        n_off__shell_from: n_idx__outside_start,
        n_off__shell_to: n_idx__bottom_start,
        o_stat: {
            ...o_stat,
            n_cnt__triangle,
            n_mm__voxel: n_h,
            // The finest grid a bulb of this size can have.
            n_mm__voxel_min: o_grid.n_h__min,
            // What of the object is above the collar, and what of that hangs together with the stem.
            b_object: n_cnt__object > 0,
            b_touching: n_cnt__kept > 0,
            n_mm3__loose: n_cnt__loose * n_h * n_h * n_h,
            n_gram: o_stat.n_mm3 * n_gram_per_mm3
        }
    };
};

export { f_o_param__default, f_o_mesh__object, n_mm__base_z };
