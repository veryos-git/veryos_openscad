// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The bulb's neck, as ../lichterketteV3.scad makes it: a tube, n_mm__neck_d wide and
// n_mm__neck_scl_z high, with the thread for the clip inside. The thread is a cone:
// n_mm__thread_d wide at the neck's top and n_mm__thread_taper wider at its bed, with a
// 45 degree lead-in there. o_bulb is part/bulb.json, which deno task part writes from
// the .scad file.
//
// Also what a mesh's numbers are: its overhangs and volume, and its smooth normals.

let n_tau = Math.PI * 2;
let n_deg = Math.PI / 180;

// The thread's major diameter at height z: the clip's thread fits it there.
let f_n_mm__thread_d = function(o_bulb, n_z){
    return o_bulb.n_mm__thread_d + o_bulb.n_mm__thread_taper * (o_bulb.n_mm__neck_scl_z - n_z) / o_bulb.n_mm__neck_scl_z;
};

// The bore's radius at height z and angle a: the thread, right-handed, in phase with
// the clip's in the .scad file's assembly. The same as the .scad file's thread_ridge()
// on its cone: a ridge 0.4 x pitch deep, 45 degree flanks, its crest 0.1 x pitch wide,
// cut into the neck around a root that narrows upwards. At the bed the lead-in widens
// it.
let f_n_radius__bore = function(o_bulb, n_z, n_rad){
    let n_pitch = o_bulb.n_mm__thread_pitch;
    let n_depth = o_bulb.n_mm__thread_depth;
    // How far z is from the middle of the ridge's nearest turn at this angle.
    let n_u = n_z - n_pitch * n_rad / n_tau;
    let n_m = n_u - n_pitch * Math.floor(n_u / n_pitch);
    let n_d = Math.min(n_m, n_pitch - n_m);
    let n_ridge = Math.max(0, Math.min(n_depth, n_depth + o_bulb.n_mm__thread_tip - n_d));
    let n_root = f_n_mm__thread_d(o_bulb, n_z) / 2 - n_depth;
    let n_lead = f_n_mm__thread_d(o_bulb, 0) / 2 + o_bulb.n_mm__lead_in - n_z;
    return Math.max(n_root + n_ridge, n_lead);
};

// Area by overhang in whole degrees, 0 = wall and 90 = ceiling, and the volume. Only
// the triangles from n_idx__outside_start to n_idx__bottom_start count for the area:
// up to n_idx__inside_start as the outside, from there as the inside.
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
        // Half a degree of grace, so the stem's cone, at exactly 45, is not past 45.
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

export { f_n_mm__thread_d, f_n_radius__bore, f_o_stat__mesh, f_a_n_normal };
