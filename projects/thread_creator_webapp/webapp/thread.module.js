// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The thread, the hole that has it and the screw that goes into it, as
// ../../01_published_or_archived/fdm_optimized_screws/fdm_optimized_screws.scad makes
// them: one start, right-handed, 2 mm pitch, 45 degree flanks, a ridge 0.8 high with a
// crest 0.2 wide; all the clearance in the hole; the screw printed lying, 0.15 of its
// diameter cut off its underside. Here the screw has no head: half of it goes into each
// of two parts.
//
// A hole is made around its own axis, z into the part from the cut's face at z = 0:
// a 45 degree lead-in at the face, the thread, and an end that closes at 45 degrees to
// a flat small enough to bridge, as a face on the bed has the hole upright above it.
// It is a surface of its own, with a rim that is a circle: the face is filled around
// that circle, so no mesh has to be cut out of another.

import { f_o_cut } from './cut.module.js';

let n_tau = Math.PI * 2;

let o_thread = {
    n_mm__pitch: 2,
    // The ridge's height, and half its crest's width.
    n_mm__depth: 0.8,
    n_mm__tip: 0.1,
    // The 45 degree chamfer at both ends of a screw.
    n_mm__chamfer: 1,
    // The share of its diameter cut off the underside of a lying screw.
    n_nor__cut: 0.15,
    // The flat at a hole's end is at most this wide: a bridge when the hole stands upright.
    n_mm__bridge: 4,
    // A screw is this much shorter than its two holes take, so the parts meet before it does.
    n_mm__play: 1,
    // The least thread in a part: two turns behind the lead-in.
    n_mm__thread_min: 4,
    // Points around the axis.
    n_cnt__column: 64,
    // The smallest screw that has held, and what the page offers.
    a_n_mm__d: [5, 6, 8, 10, 12, 16]
};

// How far the thread stands above its root at n_u along the axis from the middle of a
// ridge: its full height on the crest, down both flanks at 45 degrees.
let f_n_mm__ridge = function(n_u){
    let n_pitch = o_thread.n_mm__pitch;
    let n_m = n_u - n_pitch * Math.floor(n_u / n_pitch);
    let n_d = Math.min(n_m, n_pitch - n_m);
    return Math.max(0, Math.min(o_thread.n_mm__depth, o_thread.n_mm__depth + o_thread.n_mm__tip - n_d));
};

// A threaded shape's radius at height z and angle rad. o_shape: { n_r, the thread's
// outer radius; n_shift, how far along z its ridge is moved; a_o_floor, a_o_roof: cones
// it is at least and at most as wide as, each { n_r, n_slope }: n_r at z = 0, wider by
// n_slope for each mm of z }.
let f_n_radius = function(o_shape, n_z, n_rad){
    let n_r = o_shape.n_r - o_thread.n_mm__depth + f_n_mm__ridge(n_z - o_thread.n_mm__pitch * n_rad / n_tau - o_shape.n_shift);
    for(let o_floor of o_shape.a_o_floor){ n_r = Math.max(n_r, o_floor.n_r + o_floor.n_slope * n_z); }
    for(let o_roof of o_shape.a_o_roof){ n_r = Math.min(n_r, o_roof.n_r + o_roof.n_slope * n_z); }
    return n_r;
};

// The shape's outline at one angle, from z = 0 to n_z__to: r and z of each point where
// it bends, so straight lines between them are the shape itself.
let f_a_n_rz__column = function(o_shape, n_z__to, n_rad){
    let n_pitch = o_thread.n_mm__pitch;
    let n_root = o_shape.n_r - o_thread.n_mm__depth;
    // Where the thread bends: at both edges of the crest and at both feet of the ridge.
    let n_z__ridge = n_pitch * n_rad / n_tau + o_shape.n_shift;
    let a_n_z = [0, n_z__to];
    for(let n_turn = Math.floor(-n_z__ridge / n_pitch) - 1; n_z__ridge + (n_turn - 1) * n_pitch < n_z__to; n_turn++){
        for(let n_u of [-o_thread.n_mm__tip - o_thread.n_mm__depth, -o_thread.n_mm__tip, o_thread.n_mm__tip, o_thread.n_mm__tip + o_thread.n_mm__depth]){
            let n_z = n_z__ridge + n_turn * n_pitch + n_u;
            if(n_z > 0 && n_z < n_z__to){ a_n_z.push(n_z); }
        }
    }
    a_n_z.sort(function(n_a, n_b){ return n_a - n_b; });
    // Between two of these the thread is a straight line, as the cones are: the shape
    // bends where two of the lines cross.
    let a_n_z__all = [...a_n_z];
    for(let n_it = 0; n_it < a_n_z.length - 1; n_it++){
        let n_z0 = a_n_z[n_it], n_z1 = a_n_z[n_it + 1];
        if(n_z1 - n_z0 < 1e-12){ continue; }
        let n_r0 = n_root + f_n_mm__ridge(n_z0 - n_z__ridge), n_r1 = n_root + f_n_mm__ridge(n_z1 - n_z__ridge);
        let n_slope = (n_r1 - n_r0) / (n_z1 - n_z0);
        let a_o_line = [{ n_r: n_r0 - n_slope * n_z0, n_slope }, ...o_shape.a_o_floor, ...o_shape.a_o_roof];
        for(let n_a = 0; n_a < a_o_line.length; n_a++){
            for(let n_b = n_a + 1; n_b < a_o_line.length; n_b++){
                let n_slope__between = a_o_line[n_a].n_slope - a_o_line[n_b].n_slope;
                if(Math.abs(n_slope__between) < 1e-12){ continue; }
                let n_z = (a_o_line[n_b].n_r - a_o_line[n_a].n_r) / n_slope__between;
                if(n_z > n_z0 && n_z < n_z1){ a_n_z__all.push(n_z); }
            }
        }
    }
    a_n_z__all.sort(function(n_a, n_b){ return n_a - n_b; });
    let a_n_rz = [];
    for(let n_z of a_n_z__all){
        let n_cnt = a_n_rz.length;
        if(n_cnt >= 2 && n_z - a_n_rz[n_cnt - 1] < 1e-9){ continue; }
        let n_r = f_n_radius(o_shape, n_z, n_rad);
        // A point on the line between the one before it and this one tells nothing.
        if(n_cnt >= 4){
            let n_r0 = a_n_rz[n_cnt - 4], n_z0 = a_n_rz[n_cnt - 3], n_r1 = a_n_rz[n_cnt - 2], n_z1 = a_n_rz[n_cnt - 1];
            if(Math.abs((n_r1 - n_r0) * (n_z - n_z0) - (n_r - n_r0) * (n_z1 - n_z0)) < 1e-9){ a_n_rz.length = n_cnt - 2; }
        }
        a_n_rz.push(n_r, n_z);
    }
    return a_n_rz;
};

// The shape as a mesh around the z axis: { a_n_pos, a_n_idx, a_n_rim }. Its side is
// sewn between the outlines of neighbouring angles. A screw, b_hole false, looks
// outwards and is closed by a disc at both ends. A hole looks inwards, is closed at its
// far end and open at z = 0: a_n_rim are the points around its mouth, by their angle.
let f_o_mesh__turned = function(o_shape, n_z__to, b_hole){
    let n_cnt__column = o_thread.n_cnt__column;
    let a_n_pos = [], a_n_idx = [];
    // Each column's points' numbers, from z = 0 up.
    let a_a_n_point = [], a_a_n_z = [];
    for(let n_column = 0; n_column < n_cnt__column; n_column++){
        let n_rad = n_tau * n_column / n_cnt__column;
        let a_n_rz = f_a_n_rz__column(o_shape, n_z__to, n_rad);
        let a_n_point = [], a_n_z = [];
        for(let n_off = 0; n_off < a_n_rz.length; n_off += 2){
            a_n_point.push(a_n_pos.length / 3);
            a_n_z.push(a_n_rz[n_off + 1]);
            a_n_pos.push(a_n_rz[n_off] * Math.cos(n_rad), a_n_rz[n_off] * Math.sin(n_rad), a_n_rz[n_off + 1]);
        }
        a_a_n_point.push(a_n_point);
        a_a_n_z.push(a_n_z);
    }
    let f_add = function(n_a, n_b, n_c){
        if(b_hole){ a_n_idx.push(n_a, n_c, n_b); } else { a_n_idx.push(n_a, n_b, n_c); }
    };
    for(let n_column = 0; n_column < n_cnt__column; n_column++){
        let n_next = (n_column + 1) % n_cnt__column;
        let a_n_p = a_a_n_point[n_column], a_n_q = a_a_n_point[n_next], a_n_zp = a_a_n_z[n_column], a_n_zq = a_a_n_z[n_next];
        let n_p = 0, n_q = 0;
        // Up both outlines at once, the lower next point first.
        while(n_p < a_n_p.length - 1 || n_q < a_n_q.length - 1){
            if(n_q === a_n_q.length - 1 || (n_p < a_n_p.length - 1 && a_n_zp[n_p + 1] <= a_n_zq[n_q + 1])){
                f_add(a_n_p[n_p], a_n_q[n_q], a_n_p[n_p + 1]);
                n_p++;
            } else {
                f_add(a_n_p[n_p], a_n_q[n_q], a_n_q[n_q + 1]);
                n_q++;
            }
        }
    }
    // The discs: around a point on the axis.
    let f_add_disc = function(n_end, n_z, b_up){
        let n_middle = a_n_pos.length / 3;
        a_n_pos.push(0, 0, n_z);
        for(let n_column = 0; n_column < n_cnt__column; n_column++){
            let n_a = a_a_n_point[n_column].at(n_end), n_b = a_a_n_point[(n_column + 1) % n_cnt__column].at(n_end);
            if(b_up){ a_n_idx.push(n_middle, n_a, n_b); } else { a_n_idx.push(n_middle, n_b, n_a); }
        }
    };
    f_add_disc(-1, n_z__to, !b_hole);
    if(!b_hole){ f_add_disc(0, 0, false); }
    return {
        a_n_pos: Float64Array.from(a_n_pos), a_n_idx: Uint32Array.from(a_n_idx),
        a_n_rim: a_a_n_point.map(function(a_n_point){ return a_n_point[0]; })
    };
};

// A hole's radius at the cut's face: the screw's and the clearance.
let f_n_mm__hole_r = function(n_mm__d, n_mm__clearance){
    return n_mm__d / 2 + n_mm__clearance;
};
// How much of a hole's depth its end takes: from the thread's full width at 45
// degrees to the flat.
let f_n_mm__hole_end = function(n_mm__d, n_mm__clearance){
    let n_r = f_n_mm__hole_r(n_mm__d, n_mm__clearance);
    return n_r - Math.min(o_thread.n_mm__bridge / 2, n_r - o_thread.n_mm__depth);
};
// The least a hole has to be deep to hold: lead-in, two turns, its end.
let f_n_mm__hole_min = function(n_mm__d, n_mm__clearance){
    return o_thread.n_mm__depth + o_thread.n_mm__thread_min + f_n_mm__hole_end(n_mm__d, n_mm__clearance);
};
// How far a screw goes into a hole n_mm__deep: its chamfered end goes on into the
// hole's end until the two cones meet.
let f_n_mm__reach = function(n_mm__d, n_mm__clearance, n_mm__deep){
    return n_mm__deep - Math.max(0, f_n_mm__hole_end(n_mm__d, n_mm__clearance) - n_mm__clearance - o_thread.n_mm__chamfer);
};
// The screw for two holes.
let f_n_mm__screw = function(n_mm__d, n_mm__clearance, n_mm__deep_a, n_mm__deep_b){
    return f_n_mm__reach(n_mm__d, n_mm__clearance, n_mm__deep_a) + f_n_mm__reach(n_mm__d, n_mm__clearance, n_mm__deep_b) - o_thread.n_mm__play;
};

// A hole for a screw of n_mm__d, n_mm__deep in all, its thread moved n_mm__shift along
// its axis.
let f_o_shape__hole = function(n_mm__d, n_mm__clearance, n_mm__deep, n_mm__shift = 0){
    let n_r = f_n_mm__hole_r(n_mm__d, n_mm__clearance);
    return {
        n_r, n_shift: n_mm__shift,
        // The lead-in: as wide as the thread at the face, down to its root.
        a_o_floor: [{ n_r, n_slope: -1 }],
        // The end: closes to the flat at the hole's depth.
        a_o_roof: [{ n_r: n_r - f_n_mm__hole_end(n_mm__d, n_mm__clearance) + n_mm__deep, n_slope: -1 }]
    };
};
let f_o_mesh__hole = function(n_mm__d, n_mm__clearance, n_mm__deep, n_mm__shift = 0){
    return f_o_mesh__turned(f_o_shape__hole(n_mm__d, n_mm__clearance, n_mm__deep, n_mm__shift), n_mm__deep, true);
};

// A screw without a head, n_mm__length long, both ends chamfered.
let f_o_shape__rod = function(n_mm__d, n_mm__length){
    let n_r__end = n_mm__d / 2 - o_thread.n_mm__chamfer;
    return { n_r: n_mm__d / 2, n_shift: 0, a_o_floor: [], a_o_roof: [{ n_r: n_r__end, n_slope: 1 }, { n_r: n_r__end + n_mm__length, n_slope: -1 }] };
};
let f_o_mesh__rod = function(n_mm__d, n_mm__length){
    return f_o_mesh__turned(f_o_shape__rod(n_mm__d, n_mm__length), n_mm__length, false);
};

// The screw as it prints: lying along x, its middle above the origin, standing on the
// flat that the cut leaves at z = 0. A mesh as cut.module.js has them.
let f_o_mesh__screw = function(n_mm__d, n_mm__length){
    let o_rod = f_o_mesh__rod(n_mm__d, n_mm__length);
    let n_cnt = o_rod.a_n_idx.length / 3;
    let n_mm__axis = n_mm__d * (0.5 - o_thread.n_nor__cut);
    let o_cut = f_o_cut({
        a_n_pos: Float32Array.from(o_rod.a_n_pos), a_n_idx: o_rod.a_n_idx, a_n_fil: new Uint8Array(n_cnt), a_n_face: new Int32Array(n_cnt), a_n_shell: new Uint32Array(n_cnt)
    }, [0, -n_mm__axis, 0], [0, 1, 0], 1);
    let o_screw = o_cut.a_o_mesh[0];
    // Along z and cut at its -y becomes along x and standing on z = 0.
    let a_n_pos = new Float32Array(o_screw.a_n_pos.length);
    for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
        a_n_pos[n_off] = o_screw.a_n_pos[n_off + 2] - n_mm__length / 2;
        a_n_pos[n_off + 1] = o_screw.a_n_pos[n_off];
        a_n_pos[n_off + 2] = o_screw.a_n_pos[n_off + 1] + n_mm__axis;
    }
    o_screw.a_n_pos = a_n_pos;
    o_screw.a_n_face.fill(0);
    return o_screw;
};

// How deep a round hole of radius n_r could go into a mesh before it met the mesh's
// surface: the least height above the face, along a_n_w, of all the surface that is
// within n_r of the axis through a_n_origin. a_n_u, a_n_v: two directions across the
// axis. f_b_skip names the triangles that do not count: the face itself.
let f_n_mm__free = function(o_mesh, f_b_skip, a_n_origin, a_n_u, a_n_v, a_n_w, n_r){
    let { a_n_pos, a_n_idx } = o_mesh;
    let n_r2 = n_r * n_r;
    let n_mm__free = Infinity;
    let a_n_x = [0, 0, 0], a_n_y = [0, 0, 0], a_n_h = [0, 0, 0];
    for(let n_tri = 0; n_tri < a_n_idx.length / 3; n_tri++){
        if(f_b_skip(n_tri)){ continue; }
        for(let n_k = 0; n_k < 3; n_k++){
            let n_off = a_n_idx[n_tri * 3 + n_k] * 3;
            let n_px = a_n_pos[n_off] - a_n_origin[0], n_py = a_n_pos[n_off + 1] - a_n_origin[1], n_pz = a_n_pos[n_off + 2] - a_n_origin[2];
            a_n_x[n_k] = n_px * a_n_u[0] + n_py * a_n_u[1] + n_pz * a_n_u[2];
            a_n_y[n_k] = n_px * a_n_v[0] + n_py * a_n_v[1] + n_pz * a_n_v[2];
            a_n_h[n_k] = n_px * a_n_w[0] + n_py * a_n_w[1] + n_pz * a_n_w[2];
        }
        if(Math.min(a_n_h[0], a_n_h[1], a_n_h[2]) >= n_mm__free){ continue; }
        if(Math.min(a_n_x[0], a_n_x[1], a_n_x[2]) > n_r || Math.max(a_n_x[0], a_n_x[1], a_n_x[2]) < -n_r
            || Math.min(a_n_y[0], a_n_y[1], a_n_y[2]) > n_r || Math.max(a_n_y[0], a_n_y[1], a_n_y[2]) < -n_r){ continue; }
        // The lowest of what the triangle has within the radius is at one of its
        // corners, where one of its edges crosses the circle, or on the circle itself.
        for(let n_k = 0; n_k < 3; n_k++){
            if(a_n_x[n_k] * a_n_x[n_k] + a_n_y[n_k] * a_n_y[n_k] <= n_r2 && a_n_h[n_k] < n_mm__free){ n_mm__free = a_n_h[n_k]; }
            let n_q = (n_k + 1) % 3;
            let n_ex = a_n_x[n_q] - a_n_x[n_k], n_ey = a_n_y[n_q] - a_n_y[n_k];
            let n_a = n_ex * n_ex + n_ey * n_ey;
            if(n_a === 0){ continue; }
            let n_b = a_n_x[n_k] * n_ex + a_n_y[n_k] * n_ey;
            let n_under = n_b * n_b - n_a * (a_n_x[n_k] * a_n_x[n_k] + a_n_y[n_k] * a_n_y[n_k] - n_r2);
            if(n_under < 0){ continue; }
            for(let n_sign of [-1, 1]){
                let n_t = (-n_b + n_sign * Math.sqrt(n_under)) / n_a;
                if(n_t >= 0 && n_t <= 1){
                    let n_h = a_n_h[n_k] + n_t * (a_n_h[n_q] - a_n_h[n_k]);
                    if(n_h < n_mm__free){ n_mm__free = n_h; }
                }
            }
        }
        // Across the triangle its height is h0 + gx * x + gy * y: lowest, within the
        // circle, where the circle is furthest down that slope, if the triangle is there.
        let n_det = (a_n_x[1] - a_n_x[0]) * (a_n_y[2] - a_n_y[0]) - (a_n_x[2] - a_n_x[0]) * (a_n_y[1] - a_n_y[0]);
        if(n_det === 0){ continue; }
        let n_gx = ((a_n_h[1] - a_n_h[0]) * (a_n_y[2] - a_n_y[0]) - (a_n_h[2] - a_n_h[0]) * (a_n_y[1] - a_n_y[0])) / n_det;
        let n_gy = ((a_n_x[1] - a_n_x[0]) * (a_n_h[2] - a_n_h[0]) - (a_n_x[2] - a_n_x[0]) * (a_n_h[1] - a_n_h[0])) / n_det;
        let n_len = Math.hypot(n_gx, n_gy);
        let n_x = n_len > 0 ? -n_r * n_gx / n_len : 0, n_y = n_len > 0 ? -n_r * n_gy / n_len : 0;
        let n_w1 = ((n_x - a_n_x[0]) * (a_n_y[2] - a_n_y[0]) - (a_n_x[2] - a_n_x[0]) * (n_y - a_n_y[0])) / n_det;
        let n_w2 = ((a_n_x[1] - a_n_x[0]) * (n_y - a_n_y[0]) - (n_x - a_n_x[0]) * (a_n_y[1] - a_n_y[0])) / n_det;
        if(n_w1 >= 0 && n_w2 >= 0 && n_w1 + n_w2 <= 1){
            let n_h = a_n_h[0] + n_w1 * (a_n_h[1] - a_n_h[0]) + n_w2 * (a_n_h[2] - a_n_h[0]);
            if(n_h < n_mm__free){ n_mm__free = n_h; }
        }
    }
    return n_mm__free;
};

export {
    o_thread,
    f_n_mm__ridge,
    f_n_radius,
    f_a_n_rz__column,
    f_n_mm__hole_r,
    f_n_mm__hole_end,
    f_n_mm__hole_min,
    f_n_mm__reach,
    f_n_mm__screw,
    f_o_shape__hole,
    f_o_shape__rod,
    f_o_mesh__hole,
    f_o_mesh__rod,
    f_o_mesh__screw,
    f_n_mm__free
};
