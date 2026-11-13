// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Builds the egg as one watertight mesh, without booleans, from rings around its axis:
// up the thread and the outside, then down the inside, joined by the bottom face.
//
// Printed standing on its neck, z up, neck on z = 0. The front is towards -y.
// o_lamp is part/lamp.json, the values of ../pucklight_lamp_v2V5.scad, so the neck fits
// the lamp's cup.

import { f_o_level, f_n_height } from './heightmap.module.js';
import { f_o_field__logo, f_n_field } from './logo.module.js';

let n_tau = Math.PI * 2;
let n_deg = Math.PI / 180;

// The lower half overhangs this much at most, before the relief.
let n_deg__base = 45;
// Relief fades in above the cup's rim over this distance.
let n_mm__fade = 8;
let n_mm__fade_start = 0.5;
// The scales keep this far from the logo, and fade back in over the next few mm.
let n_mm__logo_margin = 1.5;
let n_mm__logo_fade = 3;
// The inside is smooth, so it needs far fewer triangles than the outside.
let n_mm__inner_cell = 1.2;
let n_mm__inner_row = 1.5;
let n_mm__inner_cap = 1;
// What the logo must leave of the wall.
let n_mm__logo_wall_min = 0.4;
let n_cnt__column_min = 12;
let n_gram_per_mm3 = 0.00124; // PLA

let f_o_param__default = function(){
    return {
        n_id__pattern: 37,
        n_mm__egg_scl_x: 110,
        n_mm__egg_scl_z: 145,
        n_nor__point: 0.1,
        n_mm__shell: 0.8,
        n_deg__tip: 60,
        n_mm__relief: 2,
        n_cnt__repeat: 4,
        n_nor__stretch: 1,
        n_nor__shift: 0,
        n_mm__smooth: 0,
        b_flip: false,
        b_logo: false,
        n_mm__logo_scl_y: 28,
        n_nor__logo_z: 0.3,
        n_mm__logo_depth: 0.4,
        b_vase: false
    };
};

let f_n_smoothstep = function(n_t){
    let n = Math.max(0, Math.min(1, n_t));
    return n * n * (3 - 2 * n);
};

// The neck's radius at height z and angle a: the thread, right-handed, in phase with
// the cup's. A 45 degree chamfer at the bed, and the cone above the thread, which the
// thread runs out into. The same formula as neck_radius() in pucklight_sphereV3.scad.
let f_n_radius__neck = function(o_lamp, n_z, n_rad){
    let n_pitch = o_lamp.n_mm__thread_pitch;
    let n_depth = o_lamp.n_mm__thread_depth;
    let n_u = n_z - n_pitch * n_rad / n_tau;
    let n_m = n_u - n_pitch * Math.floor(n_u / n_pitch);
    let n_d = Math.min(n_m, n_pitch - n_m);
    let n_ridge = Math.max(0, Math.min(n_depth, n_depth + o_lamp.n_mm__thread_tip - n_d));
    let n_root = o_lamp.n_mm__neck_d / 2 - n_depth;
    return n_root + Math.max(Math.min(n_ridge, n_z), n_z - o_lamp.n_mm__neck_scl_z);
};

// The end of the egg: from a point at radius n_r leaning n_rad__from, a curve whose
// bending falls evenly to nothing at the axis, where it leans n_rad__limit. Nothing
// overhangs more than that, and there is no shoulder where a cone would start.
let f_o_tip = function(n_r, n_rad__from, n_rad__limit, n_cnt = 48){
    let n_sum__sin = 0, n_sum__cos = 0;
    for(let n_it = 0; n_it < n_cnt; n_it++){
        let n_t = 1 - (n_it + 0.5) / n_cnt;
        let n_rad = n_rad__from + (n_rad__limit - n_rad__from) * (1 - n_t * n_t);
        n_sum__sin += Math.sin(n_rad);
        n_sum__cos += Math.cos(n_rad);
    }
    let n_mm__len = n_r * n_cnt / n_sum__sin;
    return {
        n_mm__len,
        n_mm__rise: n_mm__len * n_sum__cos / n_cnt,
        n_bend: 2 * (n_rad__limit - n_rad__from) / n_mm__len
    };
};

// Huegelschaeffer's egg of the given length, blunt end down, cut where it meets the
// neck's cone and where the tip takes over. Its breadth is exact, at a height set by
// n_nor__point.
let f_o_shape__for_length = function(o_param, o_lamp, n_len){
    let n_cnt = 4000;
    let n_shift = o_param.n_nor__point * n_len;
    let n_breadth = o_param.n_mm__egg_scl_x;
    let a_n_r = new Float64Array(n_cnt + 1);
    let a_n_z = new Float64Array(n_cnt + 1);
    for(let n_it = 0; n_it <= n_cnt; n_it++){
        let n_x = -0.5 * n_len * Math.cos(Math.PI * n_it / n_cnt);
        let n_denominator = n_len * n_len + 8 * n_shift * n_x + 4 * n_shift * n_shift;
        a_n_r[n_it] = 0.5 * n_breadth * Math.sqrt(Math.max(0, n_len * n_len - 4 * n_x * n_x) / n_denominator);
        a_n_z[n_it] = n_x + 0.5 * n_len;
    }
    // How far the outline leans outwards going up. Below the widest point this is its
    // overhang; above it, the overhang of the inside.
    let f_n_rad__lean = function(n_idx){
        return Math.atan2(a_n_r[n_idx + 1] - a_n_r[n_idx - 1], a_n_z[n_idx + 1] - a_n_z[n_idx - 1]);
    };
    let n_r__start_min = 0.5 * o_lamp.n_mm__neck_d + 1;
    let n_idx__start = 1;
    while(n_idx__start < n_cnt - 2 && (a_n_r[n_idx__start] < n_r__start_min || f_n_rad__lean(n_idx__start) > n_deg__base * n_deg)){
        n_idx__start++;
    }
    let n_idx__widest = n_idx__start;
    for(let n_idx = n_idx__start; n_idx <= n_cnt; n_idx++){
        if(a_n_r[n_idx] > a_n_r[n_idx__widest]){ n_idx__widest = n_idx; }
    }
    // The tip takes over where it bends as much as the egg, so the bending has no jump.
    let n_rad__limit = o_param.n_deg__tip * n_deg;
    let f_n_bend__egg = function(n_idx){
        let n_a = Math.max(n_idx - 4, 1), n_b = Math.min(n_idx + 4, n_cnt - 1);
        let n_mm = Math.hypot(a_n_r[n_b] - a_n_r[n_a], a_n_z[n_b] - a_n_z[n_a]);
        return (f_n_rad__lean(n_a) - f_n_rad__lean(n_b)) / n_mm;
    };
    let n_idx__low = n_idx__widest + 1;
    let n_idx__high = n_idx__low;
    while(n_idx__high < n_cnt - 2 && -f_n_rad__lean(n_idx__high) < n_rad__limit){ n_idx__high++; }
    while(n_idx__high - n_idx__low > 1){
        let n_idx = (n_idx__low + n_idx__high) >> 1;
        let n_bend__tip = f_o_tip(a_n_r[n_idx], -f_n_rad__lean(n_idx), n_rad__limit).n_bend;
        if(n_bend__tip > f_n_bend__egg(n_idx)){ n_idx__low = n_idx; } else { n_idx__high = n_idx; }
    }
    let n_idx__tip = n_idx__high;
    let n_rad__tip = Math.min(-f_n_rad__lean(n_idx__tip), n_rad__limit);
    let n_root = 0.5 * o_lamp.n_mm__neck_d - o_lamp.n_mm__thread_depth;
    let n_z__start = o_lamp.n_mm__neck_scl_z + a_n_r[n_idx__start] - n_root;
    let n_z__off = n_z__start - a_n_z[n_idx__start];
    return {
        a_n_r,
        a_n_z,
        n_idx__start,
        n_idx__widest,
        n_idx__tip,
        n_z__off,
        n_rad__tip,
        n_rad__limit,
        n_r__widest: a_n_r[n_idx__widest],
        n_z__apex: a_n_z[n_idx__tip] + n_z__off + f_o_tip(a_n_r[n_idx__tip], n_rad__tip, n_rad__limit).n_mm__rise
    };
};

// The egg whose print is as tall as asked for, or as near as its width allows.
let f_o_shape = function(o_param, o_lamp){
    let n_len__min = o_param.n_mm__egg_scl_x * 0.9;
    let n_len__max = o_param.n_mm__egg_scl_x * 4;
    for(let n_it = 0; n_it < 24; n_it++){
        let n_len = 0.5 * (n_len__min + n_len__max);
        if(f_o_shape__for_length(o_param, o_lamp, n_len).n_z__apex < o_param.n_mm__egg_scl_z){
            n_len__min = n_len;
        } else {
            n_len__max = n_len;
        }
    }
    return f_o_shape__for_length(o_param, o_lamp, 0.5 * (n_len__min + n_len__max));
};

// The outline from the top of the thread to just below the apex, with what the rings
// need: arc length, outward normals and the conformal coordinate q, the integral of
// ds / r. Rings a step of q apart and columns the same step of angle apart make square
// cells at every height, so a tile keeps its shape and just gets smaller towards the
// ends, like the scales of a real egg. This is Mercator's map for an egg.
let f_o_curve = function(o_shape, o_lamp){
    let a_n_r = [];
    let a_n_z = [];
    let n_r__cone_top = o_shape.a_n_r[o_shape.n_idx__start];
    let n_z__cone_top = o_shape.a_n_z[o_shape.n_idx__start] + o_shape.n_z__off;
    let n_r__neck_top = 0.5 * o_lamp.n_mm__neck_d;
    let n_z__neck_top = o_lamp.n_mm__neck_scl_z + o_lamp.n_mm__thread_depth;
    let n_cnt__cone = 64;
    for(let n_it = 0; n_it < n_cnt__cone; n_it++){
        let n_it_nor = n_it / n_cnt__cone;
        a_n_r.push(n_r__neck_top + (n_r__cone_top - n_r__neck_top) * n_it_nor);
        a_n_z.push(n_z__neck_top + (n_z__cone_top - n_z__neck_top) * n_it_nor);
    }
    let n_idx__egg_start = a_n_r.length;
    for(let n_idx = o_shape.n_idx__start; n_idx <= o_shape.n_idx__tip; n_idx++){
        a_n_r.push(o_shape.a_n_r[n_idx]);
        a_n_z.push(o_shape.a_n_z[n_idx] + o_shape.n_z__off);
    }
    // Walks the tip in small steps, keeping points closer together towards the axis,
    // where the rings are too.
    let n_r__tip = o_shape.a_n_r[o_shape.n_idx__tip];
    let n_z__tip = o_shape.a_n_z[o_shape.n_idx__tip] + o_shape.n_z__off;
    let o_tip = f_o_tip(n_r__tip, o_shape.n_rad__tip, o_shape.n_rad__limit);
    let n_cnt__walk = 6000;
    let n_r__walk = n_r__tip, n_z__walk = n_z__tip;
    let n_r__next = n_r__tip * 0.985;
    for(let n_it = 0; n_it < n_cnt__walk; n_it++){
        let n_t = 1 - (n_it + 0.5) / n_cnt__walk;
        let n_rad = o_shape.n_rad__tip + (o_shape.n_rad__limit - o_shape.n_rad__tip) * (1 - n_t * n_t);
        n_r__walk -= Math.sin(n_rad) * o_tip.n_mm__len / n_cnt__walk;
        n_z__walk += Math.cos(n_rad) * o_tip.n_mm__len / n_cnt__walk;
        if(n_r__walk <= n_r__next && n_r__walk > 0.05){
            a_n_r.push(n_r__walk);
            a_n_z.push(n_z__walk);
            n_r__next = n_r__walk * 0.985;
        }
    }
    let n_cnt = a_n_r.length;
    let a_n_s = new Float64Array(n_cnt);
    let a_n_q = new Float64Array(n_cnt);
    let n_q__widest = 0;
    let n_r__max = 0;
    for(let n_idx = 1; n_idx < n_cnt; n_idx++){
        let n_ds = Math.hypot(a_n_r[n_idx] - a_n_r[n_idx - 1], a_n_z[n_idx] - a_n_z[n_idx - 1]);
        a_n_s[n_idx] = a_n_s[n_idx - 1] + n_ds;
        a_n_q[n_idx] = a_n_q[n_idx - 1] + n_ds / (0.5 * (a_n_r[n_idx] + a_n_r[n_idx - 1]));
        if(a_n_r[n_idx] > n_r__max){
            n_r__max = a_n_r[n_idx];
            n_q__widest = a_n_q[n_idx];
        }
    }
    let a_n_nor_r = new Float64Array(n_cnt);
    let a_n_nor_z = new Float64Array(n_cnt);
    for(let n_idx = 0; n_idx < n_cnt; n_idx++){
        let n_a = Math.max(n_idx - 1, 0), n_b = Math.min(n_idx + 1, n_cnt - 1);
        let n_dr = a_n_r[n_b] - a_n_r[n_a], n_dz = a_n_z[n_b] - a_n_z[n_a];
        let n_len = Math.hypot(n_dr, n_dz);
        a_n_nor_r[n_idx] = n_dz / n_len;
        a_n_nor_z[n_idx] = -n_dr / n_len;
    }
    // The relief moves along these. Where a small egg meets the cone at a kink, the
    // raw normals would make the two sides cross, so they are averaged over 3 mm.
    let a_n_nor_r__smooth = new Float64Array(n_cnt);
    let a_n_nor_z__smooth = new Float64Array(n_cnt);
    let n_a = 0, n_b = 0, n_sum_r = 0, n_sum_z = 0;
    for(let n_idx = 0; n_idx < n_cnt; n_idx++){
        while(n_b < n_cnt && a_n_s[n_b] <= a_n_s[n_idx] + 1.5){ n_sum_r += a_n_nor_r[n_b]; n_sum_z += a_n_nor_z[n_b]; n_b++; }
        while(a_n_s[n_a] < a_n_s[n_idx] - 1.5){ n_sum_r -= a_n_nor_r[n_a]; n_sum_z -= a_n_nor_z[n_a]; n_a++; }
        let n_len = Math.hypot(n_sum_r, n_sum_z);
        a_n_nor_r__smooth[n_idx] = n_sum_r / n_len;
        a_n_nor_z__smooth[n_idx] = n_sum_z / n_len;
    }
    return {
        a_n_r, a_n_z, a_n_s, a_n_q, a_n_nor_r, a_n_nor_z, a_n_nor_r__smooth, a_n_nor_z__smooth,
        n_idx__egg_start, n_q__widest, n_r__max, n_cnt
    };
};

let f_n_cnt__column__for_radius = function(n_cnt__column_at_widest, n_r__max, n_r){
    let n_halvings = Math.max(0, Math.floor(Math.log2(n_r__max / Math.max(n_r, 1e-6))));
    return Math.max(n_cnt__column_min, Math.floor(n_cnt__column_at_widest / Math.pow(2, n_halvings)));
};

// The rings of the outside, a step of q apart.
let f_a_o_row__outside = function(o_curve, n_mm__cell){
    let n_cnt__column_at_widest = Math.max(24, 8 * Math.round(n_tau * o_curve.n_r__max / n_mm__cell / 8));
    let n_r__cap = Math.max(0.3, n_cnt__column_min * n_mm__cell / n_tau);
    let a_o_row = [];
    let n_q = 0;
    let n_idx = 0;
    while(true){
        let n_r__here = o_curve.a_n_r[n_idx];
        n_q += n_tau / f_n_cnt__column__for_radius(n_cnt__column_at_widest, o_curve.n_r__max, n_r__here);
        while(n_idx < o_curve.n_cnt - 1 && o_curve.a_n_q[n_idx + 1] < n_q){ n_idx++; }
        if(n_idx >= o_curve.n_cnt - 1){ break; }
        let n_t = (n_q - o_curve.a_n_q[n_idx]) / (o_curve.a_n_q[n_idx + 1] - o_curve.a_n_q[n_idx]);
        let f_n_mix = function(a_n){ return a_n[n_idx] + (a_n[n_idx + 1] - a_n[n_idx]) * n_t; };
        let n_r = f_n_mix(o_curve.a_n_r);
        if(n_r < n_r__cap){ break; }
        a_o_row.push({
            n_q,
            n_r,
            n_z: f_n_mix(o_curve.a_n_z),
            n_s: f_n_mix(o_curve.a_n_s),
            n_nor_r: f_n_mix(o_curve.a_n_nor_r__smooth),
            n_nor_z: f_n_mix(o_curve.a_n_nor_z__smooth),
            n_cnt__column: f_n_cnt__column__for_radius(n_cnt__column_at_widest, o_curve.n_r__max, n_r)
        });
    }
    return a_o_row;
};

// The rings of the inside: the outline moved inwards by the shell, bottom up.
let f_a_o_row__inside = function(o_curve, n_mm__shell){
    let n_cnt__column_at_widest = Math.max(48, Math.ceil(n_tau * o_curve.n_r__max / n_mm__inner_cell));
    let a_o_row = [];
    let n_s__next = -1;
    for(let n_idx = o_curve.n_idx__egg_start; n_idx < o_curve.n_cnt; n_idx++){
        if(o_curve.a_n_s[n_idx] < n_s__next){ continue; }
        let n_r = o_curve.a_n_r[n_idx] - n_mm__shell * o_curve.a_n_nor_r[n_idx];
        if(n_r < n_mm__inner_cap){ break; }
        a_o_row.push({
            n_r,
            n_z: o_curve.a_n_z[n_idx] - n_mm__shell * o_curve.a_n_nor_z[n_idx],
            n_cnt__column: f_n_cnt__column__for_radius(n_cnt__column_at_widest, o_curve.n_r__max, n_r)
        });
        n_s__next = o_curve.a_n_s[n_idx] + n_mm__inner_row;
    }
    return a_o_row;
};

// Where the brand's logo sits: the point on the front at the given height, and its
// normal.
let f_o_logo_frame = function(o_param, o_curve, n_z__apex, s_brand){
    let n_z = o_param.n_nor__logo_z * n_z__apex;
    let n_idx = 0;
    while(n_idx < o_curve.n_cnt - 2 && o_curve.a_n_z[n_idx + 1] < n_z){ n_idx++; }
    let o_field = f_o_field__logo(s_brand);
    let n_mm__per_cad = o_param.n_mm__logo_scl_y / o_field.n_cad__scl_y;
    return {
        n_r: o_curve.a_n_r[n_idx],
        n_z: o_curve.a_n_z[n_idx],
        n_nor_r: o_curve.a_n_nor_r[n_idx],
        n_nor_z: o_curve.a_n_nor_z[n_idx],
        n_mm__per_cad,
        n_mm__reach: 0.5 * o_param.n_mm__logo_scl_y * 1.5 + n_mm__logo_margin + n_mm__logo_fade,
        o_field
    };
};

// Writes the triangles between two rings, in order around them, whatever their
// column counts. Ring a lies below ring b: from outside, a is below and the columns
// run to the right, which makes the triangles counterclockwise, as STL and 3MF want.
let f_n_off__stitched = function(a_n_idx, n_off__idx, o_ring__a, o_ring__b, b_flip){
    let n_cnt__a = o_ring__a.n_cnt, n_cnt__b = o_ring__b.n_cnt;
    let n_i = 0, n_j = 0;
    let n_off = n_off__idx;
    while(n_i < n_cnt__a || n_j < n_cnt__b){
        let n_a = o_ring__a.n_off + (n_i % n_cnt__a);
        let n_b = o_ring__b.n_off + (n_j % n_cnt__b);
        let n_v0 = n_a, n_v1, n_v2 = n_b;
        if(n_j >= n_cnt__b || (n_i < n_cnt__a && (n_i + 1) * n_cnt__b <= (n_j + 1) * n_cnt__a)){
            n_v1 = o_ring__a.n_off + ((n_i + 1) % n_cnt__a);
            n_i++;
        } else {
            n_v1 = o_ring__b.n_off + ((n_j + 1) % n_cnt__b);
            n_j++;
        }
        a_n_idx[n_off] = n_v0;
        a_n_idx[n_off + 1] = b_flip ? n_v2 : n_v1;
        a_n_idx[n_off + 2] = b_flip ? n_v1 : n_v2;
        n_off += 3;
    }
    return n_off;
};

let f_n_off__fan = function(a_n_idx, n_off__idx, o_ring, n_idx__point, b_flip){
    let n_off = n_off__idx;
    for(let n_it = 0; n_it < o_ring.n_cnt; n_it++){
        let n_a = o_ring.n_off + n_it;
        let n_b = o_ring.n_off + (n_it + 1) % o_ring.n_cnt;
        a_n_idx[n_off] = b_flip ? n_b : n_a;
        a_n_idx[n_off + 1] = b_flip ? n_a : n_b;
        a_n_idx[n_off + 2] = n_idx__point;
        n_off += 3;
    }
    return n_off;
};

let o_table__unit_circle = new Map();
let f_o_table__unit_circle = function(n_cnt){
    if(!o_table__unit_circle.has(n_cnt)){
        let a_n_cos = new Float64Array(n_cnt);
        let a_n_sin = new Float64Array(n_cnt);
        for(let n_it = 0; n_it < n_cnt; n_it++){
            a_n_cos[n_it] = Math.cos(n_tau * n_it / n_cnt);
            a_n_sin[n_it] = Math.sin(n_tau * n_it / n_cnt);
        }
        o_table__unit_circle.set(n_cnt, { a_n_cos, a_n_sin });
    }
    return o_table__unit_circle.get(n_cnt);
};

let f_n_mm__tile_scl_x = function(n_r__widest, n_cnt__repeat){
    return n_tau * n_r__widest / n_cnt__repeat;
};

// Area by overhang in whole degrees, 0 = wall and 90 = ceiling, and the volume.
let f_o_stat__mesh = function(a_n_pos, a_n_idx, n_idx__outside_start, n_idx__inside_start, n_idx__bottom_start){
    let a_n_mm2__outside = new Float64Array(91);
    let a_n_mm2__inside = new Float64Array(91);
    let n_mm2__outside = 0;
    let n_mm3 = 0;
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let n_a = a_n_idx[n_off] * 3, n_b = a_n_idx[n_off + 1] * 3, n_c = a_n_idx[n_off + 2] * 3;
        let n_ax = a_n_pos[n_a], n_ay = a_n_pos[n_a + 1], n_az = a_n_pos[n_a + 2];
        let n_bx = a_n_pos[n_b], n_by = a_n_pos[n_b + 1], n_bz = a_n_pos[n_b + 2];
        let n_cx = a_n_pos[n_c], n_cy = a_n_pos[n_c + 1], n_cz = a_n_pos[n_c + 2];
        let n_ux = n_bx - n_ax, n_uy = n_by - n_ay, n_uz = n_bz - n_az;
        let n_vx = n_cx - n_ax, n_vy = n_cy - n_ay, n_vz = n_cz - n_az;
        let n_nx = n_uy * n_vz - n_uz * n_vy;
        let n_ny = n_uz * n_vx - n_ux * n_vz;
        let n_nz = n_ux * n_vy - n_uy * n_vx;
        n_mm3 += (n_ax * (n_by * n_cz - n_bz * n_cy) + n_ay * (n_bz * n_cx - n_bx * n_cz) + n_az * (n_bx * n_cy - n_by * n_cx)) / 6;
        if(n_off < n_idx__outside_start || n_off >= n_idx__bottom_start){ continue; }
        let n_len = Math.hypot(n_nx, n_ny, n_nz);
        if(n_len === 0){ continue; }
        let n_mm2 = 0.5 * n_len;
        let n_deg__overhang = n_nz < 0 ? Math.asin(Math.min(1, -n_nz / n_len)) / n_deg : 0;
        // Half a degree of grace, so the neck's cone, at exactly 45, is not past 45.
        let n_idx = Math.max(0, Math.floor(n_deg__overhang - 0.5));
        if(n_off < n_idx__inside_start){
            a_n_mm2__outside[n_idx] += n_mm2;
            n_mm2__outside += n_mm2;
        } else {
            a_n_mm2__inside[n_idx] += n_mm2;
        }
    }
    return { a_n_mm2__outside, a_n_mm2__inside, n_mm2__outside, n_mm3 };
};

// Smooth normals for the preview, weighted by triangle area.
let f_a_n_normal = function(a_n_pos, a_n_idx){
    let a_n_nor = new Float32Array(a_n_pos.length);
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let n_a = a_n_idx[n_off] * 3, n_b = a_n_idx[n_off + 1] * 3, n_c = a_n_idx[n_off + 2] * 3;
        let n_ux = a_n_pos[n_b] - a_n_pos[n_a], n_uy = a_n_pos[n_b + 1] - a_n_pos[n_a + 1], n_uz = a_n_pos[n_b + 2] - a_n_pos[n_a + 2];
        let n_vx = a_n_pos[n_c] - a_n_pos[n_a], n_vy = a_n_pos[n_c + 1] - a_n_pos[n_a + 1], n_vz = a_n_pos[n_c + 2] - a_n_pos[n_a + 2];
        let n_nx = n_uy * n_vz - n_uz * n_vy;
        let n_ny = n_uz * n_vx - n_ux * n_vz;
        let n_nz = n_ux * n_vy - n_uy * n_vx;
        a_n_nor[n_a] += n_nx; a_n_nor[n_a + 1] += n_ny; a_n_nor[n_a + 2] += n_nz;
        a_n_nor[n_b] += n_nx; a_n_nor[n_b + 1] += n_ny; a_n_nor[n_b + 2] += n_nz;
        a_n_nor[n_c] += n_nx; a_n_nor[n_c + 1] += n_ny; a_n_nor[n_c + 2] += n_nz;
    }
    for(let n_off = 0; n_off < a_n_nor.length; n_off += 3){
        let n_len = Math.hypot(a_n_nor[n_off], a_n_nor[n_off + 1], a_n_nor[n_off + 2]) || 1;
        a_n_nor[n_off] /= n_len;
        a_n_nor[n_off + 1] /= n_len;
        a_n_nor[n_off + 2] /= n_len;
    }
    return a_n_nor;
};

// The egg. o_tile may be null for a smooth one. n_mm__cell is the size of the mesh's
// cells at the widest point, n_cnt__neck_column the thread's columns, and s_brand the
// brand whose logo b_logo engraves.
let f_o_mesh__egg = function(o_param, o_tile, o_lamp, n_mm__cell, n_cnt__neck_column, s_brand = 'veryos'){
    let o_shape = f_o_shape(o_param, o_lamp);
    let o_curve = f_o_curve(o_shape, o_lamp);
    let a_o_row__outside = f_a_o_row__outside(o_curve, n_mm__cell);
    let b_shell = !o_param.b_vase;
    let a_o_row__inside = b_shell ? f_a_o_row__inside(o_curve, o_param.n_mm__shell) : [];
    let n_mm__shell = o_param.n_mm__shell;
    let n_root = 0.5 * o_lamp.n_mm__neck_d - o_lamp.n_mm__thread_depth;
    let n_r__bore = n_root - o_lamp.n_mm__neck_wall;

    // The neck's rows are 0.1 mm apart, as in the .scad file, which keeps the thread's
    // flanks straight, and its top ring is a plain circle.
    let n_mm__neck_row = o_lamp.n_mm__thread_pitch / 20;
    let n_cnt__neck_row = Math.ceil((o_lamp.n_mm__neck_scl_z + o_lamp.n_mm__thread_depth) / n_mm__neck_row);

    let n_cnt__vertex = (n_cnt__neck_row + 1) * n_cnt__neck_column + 1;
    let n_cnt__triangle = 2 * n_cnt__neck_row * n_cnt__neck_column;
    let n_cnt__previous = n_cnt__neck_column;
    for(let o_row of a_o_row__outside){
        n_cnt__vertex += o_row.n_cnt__column;
        n_cnt__triangle += n_cnt__previous + o_row.n_cnt__column;
        n_cnt__previous = o_row.n_cnt__column;
    }
    n_cnt__triangle += n_cnt__previous;
    if(b_shell){
        // bore bottom, bore top, the rows, the point; and the bottom face.
        n_cnt__vertex += 2 * n_cnt__neck_column + 1;
        n_cnt__triangle += 2 * n_cnt__neck_column;
        n_cnt__previous = n_cnt__neck_column;
        for(let o_row of a_o_row__inside){
            n_cnt__vertex += o_row.n_cnt__column;
            n_cnt__triangle += n_cnt__previous + o_row.n_cnt__column;
            n_cnt__previous = o_row.n_cnt__column;
        }
        n_cnt__triangle += n_cnt__previous;
        n_cnt__triangle += 2 * n_cnt__neck_column;
    } else {
        n_cnt__vertex += 1;
        n_cnt__triangle += n_cnt__neck_column;
    }

    let a_n_pos = new Float32Array(n_cnt__vertex * 3);
    let a_n_wall = new Float32Array(n_cnt__vertex);
    let a_n_idx = new Uint32Array(n_cnt__triangle * 3);
    let n_idx__vertex = 0;
    let n_off__idx = 0;

    let f_set_vertex = function(n_x, n_y, n_z, n_wall){
        a_n_pos[n_idx__vertex * 3] = n_x;
        a_n_pos[n_idx__vertex * 3 + 1] = n_y;
        a_n_pos[n_idx__vertex * 3 + 2] = n_z;
        a_n_wall[n_idx__vertex] = n_wall;
        n_idx__vertex++;
    };
    let f_o_ring__circle = function(n_r, n_z, n_cnt, n_wall){
        let o_ring = { n_off: n_idx__vertex, n_cnt };
        let { a_n_cos, a_n_sin } = f_o_table__unit_circle(n_cnt);
        for(let n_it = 0; n_it < n_cnt; n_it++){
            f_set_vertex(n_r * a_n_cos[n_it], n_r * a_n_sin[n_it], n_z, n_wall);
        }
        return o_ring;
    };

    // The thread.
    let n_wall__neck = o_lamp.n_mm__neck_wall + o_lamp.n_mm__thread_depth;
    let o_ring__bottom_outside = null;
    let o_ring__previous = null;
    let { a_n_cos: a_n_cos__neck, a_n_sin: a_n_sin__neck } = f_o_table__unit_circle(n_cnt__neck_column);
    for(let n_it = 0; n_it <= n_cnt__neck_row; n_it++){
        let n_z = n_it * n_mm__neck_row;
        let o_ring = { n_off: n_idx__vertex, n_cnt: n_cnt__neck_column };
        for(let n_it_column = 0; n_it_column < n_cnt__neck_column; n_it_column++){
            let n_r = f_n_radius__neck(o_lamp, n_z, n_tau * n_it_column / n_cnt__neck_column);
            f_set_vertex(n_r * a_n_cos__neck[n_it_column], n_r * a_n_sin__neck[n_it_column], n_z, n_wall__neck);
        }
        if(o_ring__previous){ n_off__idx = f_n_off__stitched(a_n_idx, n_off__idx, o_ring__previous, o_ring, false); }
        if(!o_ring__bottom_outside){ o_ring__bottom_outside = o_ring; }
        o_ring__previous = o_ring;
    }
    let n_idx__outside_start = n_off__idx;
    let n_cnt__fixed = n_idx__vertex;

    // The outside.
    let o_frame = (o_param.b_logo && b_shell) ? f_o_logo_frame(o_param, o_curve, o_shape.n_z__apex, s_brand) : null;
    let n_mm__bevel = Math.max(0.35, n_mm__cell * 1.2);
    let n_mm__logo_depth = Math.min(o_param.n_mm__logo_depth, n_mm__shell - n_mm__logo_wall_min);
    let n_relief = o_tile ? o_param.n_mm__relief : 0;
    let n_cnt__repeat = o_param.n_cnt__repeat;
    let n_v_per_q = o_param.n_nor__stretch * n_cnt__repeat / n_tau;
    let n_sign__v = o_param.b_flip ? 1 : -1;
    let n_mm__wall_min = Infinity, n_mm__wall_max = -Infinity;
    let n_r__widest_with_relief = 0;
    for(let o_row of a_o_row__outside){
        let n_cnt = o_row.n_cnt__column;
        let o_ring = { n_off: n_idx__vertex, n_cnt };
        let { a_n_cos, a_n_sin } = f_o_table__unit_circle(n_cnt);
        // The height shrinks with the scales, so their slopes are the same everywhere.
        let n_scl__relief = n_relief * f_n_smoothstep((o_row.n_s - n_mm__fade_start) / n_mm__fade) * Math.min(1, o_row.n_r / o_curve.n_r__max);
        let n_v = n_sign__v * (o_param.n_nor__shift + n_v_per_q * (o_row.n_q - o_curve.n_q__widest));
        let o_level = o_tile ? f_o_level(o_tile, n_cnt / n_cnt__repeat) : null;
        let b_logo_row = o_frame && Math.abs(o_row.n_z - o_frame.n_z) < o_frame.n_mm__reach;
        for(let n_it = 0; n_it < n_cnt; n_it++){
            let n_height = n_scl__relief > 0 ? n_scl__relief * f_n_height(o_level, n_cnt__repeat * n_it / n_cnt, n_v) : 0;
            let n_cos = a_n_cos[n_it], n_sin = a_n_sin[n_it];
            if(b_logo_row && n_sin < 0){
                let n_x = o_row.n_r * n_cos;
                let n_y = o_row.n_r * n_sin;
                let n_along = (n_y + o_frame.n_r) * o_frame.n_nor_z + (o_row.n_z - o_frame.n_z) * o_frame.n_nor_r;
                if(Math.abs(n_x) < o_frame.n_mm__reach && Math.abs(n_along) < o_frame.n_mm__reach){
                    let n_cad_x = n_x / o_frame.n_mm__per_cad, n_cad_y = n_along / o_frame.n_mm__per_cad;
                    let n_mm__to_outline = f_n_field(o_frame.o_field, o_frame.o_field.a_n_outline, n_cad_x, n_cad_y) * o_frame.n_mm__per_cad;
                    n_height *= f_n_smoothstep((n_mm__to_outline - n_mm__logo_margin) / n_mm__logo_fade);
                    let n_mm__to_region = f_n_field(o_frame.o_field, o_frame.o_field.a_n_region, n_cad_x, n_cad_y) * o_frame.n_mm__per_cad;
                    n_height -= n_mm__logo_depth * Math.max(0, Math.min(1, 0.5 - n_mm__to_region / n_mm__bevel));
                }
            }
            let n_r = o_row.n_r + o_row.n_nor_r * n_height;
            let n_wall = n_mm__shell + n_height;
            if(n_wall < n_mm__wall_min){ n_mm__wall_min = n_wall; }
            if(n_wall > n_mm__wall_max){ n_mm__wall_max = n_wall; }
            if(n_r > n_r__widest_with_relief){ n_r__widest_with_relief = n_r; }
            f_set_vertex(n_r * n_cos, n_r * n_sin, o_row.n_z + o_row.n_nor_z * n_height, n_wall);
        }
        n_off__idx = f_n_off__stitched(a_n_idx, n_off__idx, o_ring__previous, o_ring, false);
        o_ring__previous = o_ring;
    }
    let n_idx__apex = n_idx__vertex;
    f_set_vertex(0, 0, o_shape.n_z__apex, n_mm__shell);
    n_off__idx = f_n_off__fan(a_n_idx, n_off__idx, o_ring__previous, n_idx__apex, false);
    let n_idx__inside_start = n_off__idx;
    let n_idx__bottom_start = n_off__idx;

    if(b_shell){
        // The neck's bore, then a 45 degree cone to the inside of the egg.
        let n_r__inner_start = a_o_row__inside[0].n_r;
        let n_z__inner_start = a_o_row__inside[0].n_z;
        let n_z__bore_top = n_z__inner_start - (n_r__inner_start - n_r__bore);
        let o_ring__bore_bottom = f_o_ring__circle(n_r__bore, 0, n_cnt__neck_column, n_mm__shell);
        let o_ring__bore_top = f_o_ring__circle(n_r__bore, n_z__bore_top, n_cnt__neck_column, n_mm__shell);
        n_off__idx = f_n_off__stitched(a_n_idx, n_off__idx, o_ring__bore_bottom, o_ring__bore_top, true);
        o_ring__previous = o_ring__bore_top;
        for(let o_row of a_o_row__inside){
            let o_ring = f_o_ring__circle(o_row.n_r, o_row.n_z, o_row.n_cnt__column, n_mm__shell);
            n_off__idx = f_n_off__stitched(a_n_idx, n_off__idx, o_ring__previous, o_ring, true);
            o_ring__previous = o_ring;
        }
        let n_idx__apex_inside = n_idx__vertex;
        let o_row__last = a_o_row__inside[a_o_row__inside.length - 1];
        f_set_vertex(0, 0, o_row__last.n_z + o_row__last.n_r / Math.tan(o_shape.n_rad__limit), n_mm__shell);
        n_off__idx = f_n_off__fan(a_n_idx, n_off__idx, o_ring__previous, n_idx__apex_inside, true);
        n_idx__bottom_start = n_off__idx;
        n_off__idx = f_n_off__stitched(a_n_idx, n_off__idx, o_ring__bore_bottom, o_ring__bottom_outside, false);
    } else {
        // Solid, for a slicer's vase mode.
        let n_idx__bottom = n_idx__vertex;
        f_set_vertex(0, 0, 0, n_mm__shell);
        n_off__idx = f_n_off__fan(a_n_idx, n_off__idx, o_ring__bottom_outside, n_idx__bottom, true);
    }

    let o_stat = f_o_stat__mesh(a_n_pos, a_n_idx, n_idx__outside_start, n_idx__inside_start, n_idx__bottom_start);
    return {
        a_n_pos,
        a_n_idx,
        a_n_wall,
        // The thread's points, which no setting moves.
        n_cnt__fixed,
        o_stat: {
            ...o_stat,
            n_cnt__triangle,
            n_mm__scl_z: o_shape.n_z__apex,
            n_mm__scl_x: 2 * n_r__widest_with_relief,
            n_mm__tile_scl_x: f_n_mm__tile_scl_x(o_curve.n_r__max, n_cnt__repeat),
            n_mm__wall_min: b_shell ? n_mm__wall_min : null,
            n_mm__wall_max: b_shell ? n_mm__wall_max : null,
            n_gram: o_stat.n_mm3 * n_gram_per_mm3
        }
    };
};

export {
    f_o_param__default,
    f_n_radius__neck,
    f_o_shape,
    f_o_mesh__egg,
    f_a_n_normal,
    f_n_mm__tile_scl_x
};
