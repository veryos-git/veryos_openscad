// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// From an object and its cuts to what prints: the parts, their threaded holes and the
// screws, and where each lies on the bed.
//
// A cut is { a_n_trn, a_n_rot, b_thread, n_mm__d }: a point of its plane, its handle;
// how the plane is turned, a quaternion that turns z into the way it looks; whether the
// parts it makes get a thread; and the screw's diameter, 0 for the largest of 8, 6 and 5
// that fits. A cut splits the part its handle is in, along its whole plane, into the
// bodies that fall apart. Cuts are made one after the other, the threads after all of
// them: where a part above a cut and a part below it lie face on face, each gets a hole
// at the place furthest from the edges of both faces, and the two share a screw.

import {
    n_face__thread, f_a_n_cross, f_o_frame, f_o_bound, f_o_volume, f_n_cnt__around, f_o_outline, f_o_mesh__refaced, f_o_cut, f_a_o_mesh__body
} from './cut.module.js';
import { f_b_in_polygon, f_n_mm__to_loop, f_a_n_idx__of_polygons } from './polygon.module.js';
import {
    o_thread, f_n_mm__hole_r, f_n_mm__hole_min, f_n_mm__screw, f_n_mm__reach, f_o_mesh__hole, f_o_mesh__screw, f_n_mm__free
} from './thread.module.js';

// Without a diameter of its own a cut gets the largest of these that fits.
let a_n_mm__d_auto = [8, 6, 5];
// Between two things on the bed, and from the bed's edge.
let n_mm__gap = 6;
let n_mm__edge = 8;

// The way a cut's plane looks: z, turned by its quaternion.
let f_a_n_normal = function(a_n_rot){
    let [n_x, n_y, n_z, n_w] = a_n_rot;
    return [2 * (n_x * n_z + n_y * n_w), 2 * (n_y * n_z - n_x * n_w), 1 - 2 * (n_x * n_x + n_y * n_y)];
};

// The area of each face of a mesh, by the face's number.
let f_o_n_mm2__by_face = function(o_mesh){
    let { a_n_pos, a_n_idx, a_n_face } = o_mesh;
    let o_n_mm2__by_face = new Map();
    for(let n_tri = 0; n_tri < a_n_face.length; n_tri++){
        let n_face = a_n_face[n_tri];
        if(n_face === 0 || n_face === n_face__thread){ continue; }
        let n_a = a_n_idx[n_tri * 3] * 3, n_b = a_n_idx[n_tri * 3 + 1] * 3, n_c = a_n_idx[n_tri * 3 + 2] * 3;
        let n_ux = a_n_pos[n_b] - a_n_pos[n_a], n_uy = a_n_pos[n_b + 1] - a_n_pos[n_a + 1], n_uz = a_n_pos[n_b + 2] - a_n_pos[n_a + 2];
        let n_vx = a_n_pos[n_c] - a_n_pos[n_a], n_vy = a_n_pos[n_c + 1] - a_n_pos[n_a + 1], n_vz = a_n_pos[n_c + 2] - a_n_pos[n_a + 2];
        o_n_mm2__by_face.set(n_face, (o_n_mm2__by_face.get(n_face) ?? 0) + 0.5 * Math.hypot(n_uy * n_vz - n_uz * n_vy, n_uz * n_vx - n_ux * n_vz, n_ux * n_vy - n_uy * n_vx));
    }
    return o_n_mm2__by_face;
};

// A matrix, its columns one after the other, that turns the direction a_n_from into
// a_n_to, both of length 1.
let f_a_n_mat4__turning = function(a_n_from, a_n_to){
    let a_n_axis = f_a_n_cross(a_n_from, a_n_to);
    let n_cos = a_n_from[0] * a_n_to[0] + a_n_from[1] * a_n_to[1] + a_n_from[2] * a_n_to[2];
    let n_sin2 = a_n_axis[0] * a_n_axis[0] + a_n_axis[1] * a_n_axis[1] + a_n_axis[2] * a_n_axis[2];
    if(n_sin2 < 1e-12){
        if(n_cos > 0){ return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
        // Straight back: half a turn around any direction across.
        let o_frame = f_o_frame(a_n_from);
        let [n_x, n_y, n_z] = o_frame.a_n_u;
        return [2 * n_x * n_x - 1, 2 * n_x * n_y, 2 * n_x * n_z, 0, 2 * n_x * n_y, 2 * n_y * n_y - 1, 2 * n_y * n_z, 0, 2 * n_x * n_z, 2 * n_y * n_z, 2 * n_z * n_z - 1, 0, 0, 0, 0, 1];
    }
    let n_k = (1 - n_cos) / n_sin2;
    let [n_x, n_y, n_z] = a_n_axis;
    return [
        n_cos + n_k * n_x * n_x, n_k * n_x * n_y + n_z, n_k * n_x * n_z - n_y, 0,
        n_k * n_x * n_y - n_z, n_cos + n_k * n_y * n_y, n_k * n_y * n_z + n_x, 0,
        n_k * n_x * n_z + n_y, n_k * n_y * n_z - n_x, n_cos + n_k * n_z * n_z, 0,
        0, 0, 0, 1
    ];
};

// A mesh's points through a matrix.
let f_a_n_pos__moved = function(a_n_pos, a_n_mat4){
    let a_n = new Float32Array(a_n_pos.length);
    for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
        let n_x = a_n_pos[n_off], n_y = a_n_pos[n_off + 1], n_z = a_n_pos[n_off + 2];
        a_n[n_off] = a_n_mat4[0] * n_x + a_n_mat4[4] * n_y + a_n_mat4[8] * n_z + a_n_mat4[12];
        a_n[n_off + 1] = a_n_mat4[1] * n_x + a_n_mat4[5] * n_y + a_n_mat4[9] * n_z + a_n_mat4[13];
        a_n[n_off + 2] = a_n_mat4[2] * n_x + a_n_mat4[6] * n_y + a_n_mat4[10] * n_z + a_n_mat4[14];
    }
    return a_n;
};

// A face of a part as the pole's search needs it: its polygons, and n_flip, by which a
// place's y in the plane's own directions is the face's own y.
let f_o_region = function(o_part, n_face, a_n_origin, o_frame){
    let n_flip = n_face > 0 ? -1 : 1;
    // A face looks away from its part: the one above a cut looks down, against the plane.
    let a_n_v = o_frame.a_n_v.map(function(n){ return n * n_flip; });
    let o_outline = f_o_outline(o_part.o_mesh, function(n_tri){ return o_part.o_mesh.a_n_face[n_tri] === n_face; }, a_n_origin, o_frame.a_n_u, a_n_v);
    let a_n_bound = [Infinity, Infinity, -Infinity, -Infinity];
    for(let o_polygon of o_outline.a_o_polygon){
        for(let n_point of o_polygon.a_n_outer){
            let n_x = o_outline.a_n_xy[n_point * 2], n_y = o_outline.a_n_xy[n_point * 2 + 1] * n_flip;
            a_n_bound = [Math.min(a_n_bound[0], n_x), Math.min(a_n_bound[1], n_y), Math.max(a_n_bound[2], n_x), Math.max(a_n_bound[3], n_y)];
        }
    }
    return { ...o_outline, n_flip, a_n_bound };
};

// How far a place is inside both of two faces: from the nearest edge of either, or
// below 0 where it is not in both.
let f_n_mm__room = function(a_o_region, n_x, n_y){
    let n_room = Infinity;
    for(let o_region of a_o_region){
        let n_y__own = n_y * o_region.n_flip;
        if(!o_region.a_o_polygon.some(function(o_polygon){ return f_b_in_polygon(o_polygon, o_region.a_n_xy, n_x, n_y__own); })){ return -1; }
        for(let o_polygon of o_region.a_o_polygon){
            for(let a_n_loop of [o_polygon.a_n_outer, ...o_polygon.a_a_n_hole]){ n_room = Math.min(n_room, f_n_mm__to_loop(a_n_loop, o_region.a_n_xy, n_x, n_y__own)); }
        }
    }
    return n_room;
};

// Where two faces lie on one another, the place with the most room around it: { n_x,
// n_y, n_mm__room }, or null if they do not touch. A grid over what both cover, then
// finer ones around the best place. Of places with as much room, as along the middle of
// a long face, the one nearest the middle of what both cover.
let f_o_pole = function(a_o_region){
    let n_x0 = Math.max(a_o_region[0].a_n_bound[0], a_o_region[1].a_n_bound[0]), n_y0 = Math.max(a_o_region[0].a_n_bound[1], a_o_region[1].a_n_bound[1]);
    let n_x1 = Math.min(a_o_region[0].a_n_bound[2], a_o_region[1].a_n_bound[2]), n_y1 = Math.min(a_o_region[0].a_n_bound[3], a_o_region[1].a_n_bound[3]);
    if(!(n_x1 > n_x0 && n_y1 > n_y0)){ return null; }
    let n_cnt = 40;
    let n_step = Math.max(n_x1 - n_x0, n_y1 - n_y0) / n_cnt;
    let a_o_inside = [];
    for(let n_x = n_x0 + n_step / 2; n_x < n_x1; n_x += n_step){
        for(let n_y = n_y0 + n_step / 2; n_y < n_y1; n_y += n_step){
            let n_mm__room = f_n_mm__room(a_o_region, n_x, n_y);
            if(n_mm__room > 0){ a_o_inside.push({ n_x, n_y, n_mm__room }); }
        }
    }
    if(a_o_inside.length === 0){ return null; }
    let n_cx = a_o_inside.reduce(function(n_sum, o){ return n_sum + o.n_x; }, 0) / a_o_inside.length;
    let n_cy = a_o_inside.reduce(function(n_sum, o){ return n_sum + o.n_y; }, 0) / a_o_inside.length;
    let f_n_score = function(o){ return o.n_mm__room - 0.1 * Math.hypot(o.n_x - n_cx, o.n_y - n_cy); };
    let o_best = null;
    let f_try = function(n_x, n_y){
        let o = { n_x, n_y, n_mm__room: f_n_mm__room(a_o_region, n_x, n_y) };
        if(o.n_mm__room > 0 && (!o_best || f_n_score(o) > f_n_score(o_best))){ o_best = o; }
    };
    for(let o of a_o_inside){
        if(!o_best || f_n_score(o) > f_n_score(o_best)){ o_best = o; }
    }
    for(let n_round = 0; n_round < 4; n_round++){
        let { n_x, n_y } = o_best;
        n_step /= 3;
        for(let n_i = -3; n_i <= 3; n_i++){
            for(let n_j = -3; n_j <= 3; n_j++){ f_try(n_x + n_i * n_step, n_y + n_j * n_step); }
        }
    }
    return o_best;
};

// A part's mesh with a threaded hole in its face n_face: the face filled anew around
// the hole's mouth, and the hole's own surface added. The hole is at a_n_origin, its
// axis along a_n_w into the part, a_n_u and a_n_v across with u x v = w. Where surfaces
// of the object lie in one another, each that has the place in its face gets the hole.
let f_o_mesh__with_hole = function(o_mesh, n_face, a_n_origin, a_n_u, a_n_v, a_n_w, o_hole){
    let f_b_face = function(n_tri){ return o_mesh.a_n_face[n_tri] === n_face; };
    // The face is seen from outside the part, against the axis.
    let a_n_v__face = a_n_v.map(function(n){ return -n; });
    let o_outline = f_o_outline(o_mesh, f_b_face, a_n_origin, a_n_u, a_n_v__face);
    let a_o_polygon__holed = o_outline.a_o_polygon.filter(function(o_polygon){ return f_b_in_polygon(o_polygon, o_outline.a_n_xy, 0, 0); });
    let n_cnt__old = o_mesh.a_n_pos.length / 3, n_cnt__hole = o_hole.a_n_pos.length / 3;
    let a_n_pos = new Float32Array((n_cnt__old + n_cnt__hole * a_o_polygon__holed.length) * 3);
    a_n_pos.set(o_mesh.a_n_pos);
    let a_n_xy = new Float64Array(a_n_pos.length / 3 * 2);
    a_n_xy.set(o_outline.a_n_xy);
    let a_n_idx__thread = [];
    a_o_polygon__holed.forEach(function(o_polygon, n_it){
        let n_first = n_cnt__old + n_it * n_cnt__hole;
        for(let n_point = 0; n_point < n_cnt__hole; n_point++){
            let n_x = o_hole.a_n_pos[n_point * 3], n_y = o_hole.a_n_pos[n_point * 3 + 1], n_z = o_hole.a_n_pos[n_point * 3 + 2];
            for(let n_k = 0; n_k < 3; n_k++){ a_n_pos[(n_first + n_point) * 3 + n_k] = a_n_origin[n_k] + n_x * a_n_u[n_k] + n_y * a_n_v[n_k] + n_z * a_n_w[n_k]; }
            a_n_xy[(n_first + n_point) * 2] = n_x;
            a_n_xy[(n_first + n_point) * 2 + 1] = -n_y;
        }
        // By its angle around the axis the rim runs clockwise as the face sees it: a hole.
        o_polygon.a_a_n_hole.push(o_hole.a_n_rim.map(function(n_point){ return n_first + n_point; }));
        for(let n_point of o_hole.a_n_idx){ a_n_idx__thread.push(n_first + n_point); }
    });
    let n_shell = 0;
    for(let n_tri = 0; n_tri < o_mesh.a_n_face.length; n_tri++){
        if(f_b_face(n_tri)){ n_shell = o_mesh.a_n_shell[n_tri]; break; }
    }
    let o_refaced = f_o_mesh__refaced({ ...o_mesh, a_n_pos }, f_b_face, f_a_n_idx__of_polygons(o_outline.a_o_polygon, a_n_xy), 0, n_face, n_shell);
    return f_o_mesh__refaced(o_refaced, function(){ return false; }, a_n_idx__thread, 0, n_face__thread, n_shell);
};

// The thread between two parts that lie face on face in cut n_cut, o_above with the
// face n_cut + 1 and o_below with its negative: what the page is told about it, and,
// if it fits, both parts' meshes with their holes.
let f_o_joint = function(o_above, o_below, o_cut, n_cut, o_setting){
    let n_face = n_cut + 1;
    let a_n_normal = f_a_n_normal(o_cut.a_n_rot);
    let o_frame = f_o_frame(a_n_normal);
    let a_o_region = [f_o_region(o_above, n_face, o_cut.a_n_trn, o_frame), f_o_region(o_below, -n_face, o_cut.a_n_trn, o_frame)];
    let o_pole = f_o_pole(a_o_region);
    if(!o_pole){ return null; }
    let o_joint = { n_cut, b_thread: false, n_mm__room: o_pole.n_mm__room, n_mm__d: 0, n_mm__length: 0, a_n_mm__deep: [0, 0], s_why: '' };
    if(!o_cut.b_thread){ return o_joint; }
    let a_n_origin = [0, 1, 2].map(function(n_k){ return o_cut.a_n_trn[n_k] + o_pole.n_x * o_frame.a_n_u[n_k] + o_pole.n_y * o_frame.a_n_v[n_k]; });
    let a_n_down = a_n_normal.map(function(n){ return -n; });
    let a_n_v__down = o_frame.a_n_v.map(function(n){ return -n; });
    let n_mm__clearance = o_setting.n_mm__clearance, n_mm__wall = o_setting.n_mm__wall;
    for(let n_mm__d of (o_cut.n_mm__d > 0 ? [o_cut.n_mm__d] : a_n_mm__d_auto)){
        let n_r = f_n_mm__hole_r(n_mm__d, n_mm__clearance) + n_mm__wall;
        let n_mm__min = f_n_mm__hole_min(n_mm__d, n_mm__clearance);
        if(o_pole.n_mm__room < n_r){
            o_joint.s_why = `No room for a Ø${n_mm__d} thread: the faces have ${(2 * o_pole.n_mm__room).toFixed(1)} mm where they are widest, it needs ${(2 * n_r).toFixed(1)}.`;
            continue;
        }
        // As deep as wanted, or as the part allows with a wall left behind the hole.
        let a_n_mm__deep = [
            f_n_mm__free(o_above.o_mesh, function(n_tri){ return o_above.o_mesh.a_n_face[n_tri] === n_face; }, a_n_origin, o_frame.a_n_u, o_frame.a_n_v, a_n_normal, n_r),
            f_n_mm__free(o_below.o_mesh, function(n_tri){ return o_below.o_mesh.a_n_face[n_tri] === -n_face; }, a_n_origin, o_frame.a_n_u, a_n_v__down, a_n_down, n_r)
        ].map(function(n_mm__free){ return Math.min(o_setting.n_mm__depth, n_mm__free - n_mm__wall); });
        let n_side__shallow = a_n_mm__deep[0] < a_n_mm__deep[1] ? 0 : 1;
        if(a_n_mm__deep[n_side__shallow] < n_mm__min){
            o_joint.s_why = `Too shallow for a Ø${n_mm__d} thread: ${Math.max(0, a_n_mm__deep[n_side__shallow]).toFixed(1)} mm in the part ${n_side__shallow === 0 ? 'above' : 'below'}, it needs ${n_mm__min.toFixed(1)}.`;
            continue;
        }
        // The screw goes into one part until it stops at the hole's end, and lies there
        // against the flanks towards the face; the other part, screwed on, is tight once
        // its thread lies against the screw's other flanks. Between the two the thread is
        // twice the clearance further: the hole above has it moved that far along its
        // axis, so that the parts line up when tight. n_deg__line_up corrects that by
        // what a print shows: by how much the parts stop short of lining up.
        let n_mm__shift = 2 * n_mm__clearance + o_thread.n_mm__pitch * o_setting.n_deg__line_up / 360;
        return {
            ...o_joint, b_thread: true, n_mm__d, a_n_mm__deep, s_why: '', a_n_origin,
            n_mm__length: f_n_mm__screw(n_mm__d, n_mm__clearance, a_n_mm__deep[0], a_n_mm__deep[1]),
            // How far the screw reaches into each part.
            a_n_mm__reach: a_n_mm__deep.map(function(n_mm__deep){ return f_n_mm__reach(n_mm__d, n_mm__clearance, n_mm__deep); }),
            a_o_mesh: [
                f_o_mesh__with_hole(o_above.o_mesh, n_face, a_n_origin, o_frame.a_n_u, o_frame.a_n_v, a_n_normal, f_o_mesh__hole(n_mm__d, n_mm__clearance, a_n_mm__deep[0], n_mm__shift)),
                f_o_mesh__with_hole(o_below.o_mesh, -n_face, a_n_origin, o_frame.a_n_u, a_n_v__down, a_n_down, f_o_mesh__hole(n_mm__d, n_mm__clearance, a_n_mm__deep[1], 0))
            ]
        };
    }
    return o_joint;
};

// Places on the bed for things of these sizes, [x, y] each: rows from the front, the
// deepest things first, the whole in the bed's middle. Returns each thing's lower left
// corner, and whether all of them are on the bed.
let f_o_layout = function(a_a_n_scl, n_mm__bed){
    let n_mm__row = n_mm__bed - 2 * n_mm__edge;
    let a_n_order = a_a_n_scl.map(function(v, n_idx){ return n_idx; }).sort(function(n_a, n_b){ return a_a_n_scl[n_b][1] - a_a_n_scl[n_a][1] || n_a - n_b; });
    let a_a_n_at = new Array(a_a_n_scl.length);
    let n_x = 0, n_y = 0, n_mm__deep = 0, n_mm__wide = 0;
    for(let n_idx of a_n_order){
        let [n_scl_x, n_scl_y] = a_a_n_scl[n_idx];
        if(n_x > 0 && n_x + n_scl_x > n_mm__row){
            n_x = 0;
            n_y += n_mm__deep + n_mm__gap;
            n_mm__deep = 0;
        }
        a_a_n_at[n_idx] = [n_x, n_y];
        n_x += n_scl_x + n_mm__gap;
        n_mm__deep = Math.max(n_mm__deep, n_scl_y);
        n_mm__wide = Math.max(n_mm__wide, n_x - n_mm__gap);
    }
    let n_mm__scl_y = n_y + n_mm__deep;
    let b_fits = n_mm__wide <= n_mm__row && n_mm__scl_y <= n_mm__row;
    // In the middle; what is too large for the bed starts at its edge.
    let n_x0 = Math.max(n_mm__edge, (n_mm__bed - n_mm__wide) / 2), n_y0 = Math.max(n_mm__edge, (n_mm__bed - n_mm__scl_y) / 2);
    return { a_a_n_at: a_a_n_at.map(function(a_n){ return [a_n[0] + n_x0, a_n[1] + n_y0]; }), b_fits };
};

// What prints, of an object's mesh and its settings: { a_o_part, a_o_screw, a_o_cut,
// b_fits }.
//   a_o_part: each { o_mesh, a_o_step, a_n_apart, n_face__bed, a_n_mat4__bed, a_n_min,
//     a_n_max, n_mm3 }: its steps are the cuts that made it, { n_cut, n_side } each, 0
//     above; a_n_apart is the way it moves when the parts are shown apart; n_face__bed
//     the face it lies on, its largest, or 0 for a part no cut made; a_n_mat4__bed puts
//     it on the bed.
//   a_o_screw: each { o_mesh, n_cut, a_n_part, n_mm__d, n_mm__length, a_n_mat4__in,
//     a_n_mat4__bed }: lying as it prints, and the matrix that puts it into its holes.
//   a_o_cut: for each cut { b_cut, n_cnt__gap, a_o_joint }: whether it cut anything,
//     where the surface was open, and between which parts it left a thread, or why not.
let f_o_built = function(o_object, o_setting){
    let n_cnt__triangle = o_object.a_n_idx.length / 3;
    let a_o_part = [{
        o_mesh: { a_n_pos: o_object.a_n_pos, a_n_idx: o_object.a_n_idx, a_n_fil: o_object.a_n_fil, a_n_face: new Int32Array(n_cnt__triangle), a_n_shell: o_object.a_n_shell },
        a_o_step: []
    }];
    let a_o_cut = [];
    o_setting.a_o_cut.forEach(function(o_cut, n_cut){
        let a_n_normal = f_a_n_normal(o_cut.a_n_rot);
        // The part the handle is in; outside all of them, the one a point of which is nearest.
        let n_part = a_o_part.findIndex(function(o_part){ return f_n_cnt__around(o_part.o_mesh, o_cut.a_n_trn) !== 0; });
        if(n_part < 0){
            let n_best = Infinity;
            a_o_part.forEach(function(o_part, n_idx){
                let a_n_pos = o_part.o_mesh.a_n_pos;
                for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
                    let n_d2 = (a_n_pos[n_off] - o_cut.a_n_trn[0]) ** 2 + (a_n_pos[n_off + 1] - o_cut.a_n_trn[1]) ** 2 + (a_n_pos[n_off + 2] - o_cut.a_n_trn[2]) ** 2;
                    if(n_d2 < n_best){ n_best = n_d2; n_part = n_idx; }
                }
            });
        }
        let o_part = a_o_part[n_part];
        let o_split = f_o_cut(o_part.o_mesh, o_cut.a_n_trn, a_n_normal, n_cut + 1);
        a_o_cut.push({ b_cut: Boolean(o_split), n_cnt__gap: o_split ? o_split.n_cnt__gap : 0, a_o_joint: [] });
        if(!o_split){ return; }
        let a_o_new = [];
        o_split.a_o_mesh.forEach(function(o_mesh, n_side){
            for(let o_body of f_a_o_mesh__body(o_mesh, n_side === 0 ? n_cut + 1 : -n_cut - 1, o_cut.a_n_trn, a_n_normal)){
                a_o_new.push({ o_mesh: o_body, a_o_step: [...o_part.a_o_step, { n_cut, n_side }] });
            }
        });
        a_o_part.splice(n_part, 1, ...a_o_new);
    });

    // The threads, once every cut is made: a hole never ends in a later cut's face.
    let a_o_screw = [];
    o_setting.a_o_cut.forEach(function(o_cut, n_cut){
        if(!a_o_cut[n_cut].b_cut){ return; }
        let n_face = n_cut + 1;
        let f_a_n_part = function(n_face__wanted){
            return a_o_part.map(function(o_part, n_idx){ return o_part.o_mesh.a_n_face.includes(n_face__wanted) ? n_idx : -1; }).filter(function(n_idx){ return n_idx >= 0; });
        };
        let a_n_normal = f_a_n_normal(o_cut.a_n_rot);
        for(let n_above of f_a_n_part(n_face)){
            for(let n_below of f_a_n_part(-n_face)){
                let o_joint = f_o_joint(a_o_part[n_above], a_o_part[n_below], o_cut, n_cut, o_setting);
                if(!o_joint){ continue; }
                let { a_o_mesh, a_n_origin, a_n_mm__reach, ...o_told } = o_joint;
                a_o_cut[n_cut].a_o_joint.push({ ...o_told, a_n_part: [n_above, n_below] });
                if(!o_joint.b_thread){ continue; }
                a_o_part[n_above].o_mesh = a_o_mesh[0];
                a_o_part[n_below].o_mesh = a_o_mesh[1];
                // In its holes the screw's axis is the plane's way, its middle where
                // it has the same play at both ends.
                let o_frame = f_o_frame(a_n_normal);
                let n_mm__middle = (a_n_mm__reach[0] - a_n_mm__reach[1]) / 2;
                let n_mm__axis = o_joint.n_mm__d * (0.5 - o_thread.n_nor__cut);
                a_o_screw.push({
                    o_mesh: f_o_mesh__screw(o_joint.n_mm__d, o_joint.n_mm__length),
                    n_cut, a_n_part: [n_above, n_below], n_mm__d: o_joint.n_mm__d, n_mm__length: o_joint.n_mm__length,
                    a_n_mat4__in: [
                        ...a_n_normal, 0, ...o_frame.a_n_u, 0, ...o_frame.a_n_v, 0,
                        ...[0, 1, 2].map(function(n_k){ return a_n_origin[n_k] + n_mm__middle * a_n_normal[n_k] - n_mm__axis * o_frame.a_n_v[n_k]; }), 1
                    ]
                });
            }
        }
    });

    // On the bed: each part on its largest face, the screws as they are.
    for(let o_part of a_o_part){
        let n_face__bed = 0, n_mm2__bed = 0;
        for(let [n_face, n_mm2] of f_o_n_mm2__by_face(o_part.o_mesh)){
            if(n_mm2 > n_mm2__bed){ n_mm2__bed = n_mm2; n_face__bed = n_face; }
        }
        let a_n_mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        if(n_face__bed !== 0){
            // The face above a cut looks against the plane's way, the one below along it.
            let a_n_normal = f_a_n_normal(o_setting.a_o_cut[Math.abs(n_face__bed) - 1].a_n_rot);
            a_n_mat4 = f_a_n_mat4__turning(a_n_normal.map(function(n){ return n_face__bed > 0 ? -n : n; }), [0, 0, -1]);
        }
        o_part.n_face__bed = n_face__bed;
        o_part.a_n_mat4__bed = a_n_mat4;
        o_part.a_n_apart = [0, 0, 0];
        for(let o_step of o_part.a_o_step){
            let a_n_normal = f_a_n_normal(o_setting.a_o_cut[o_step.n_cut].a_n_rot);
            for(let n_k = 0; n_k < 3; n_k++){ o_part.a_n_apart[n_k] += o_step.n_side === 0 ? a_n_normal[n_k] : -a_n_normal[n_k]; }
        }
        Object.assign(o_part, f_o_bound(o_part.o_mesh.a_n_pos), { n_mm3: f_o_volume(o_part.o_mesh.a_n_pos, o_part.o_mesh.a_n_idx).n_mm3 });
    }
    let a_o_thing = [...a_o_part, ...a_o_screw];
    let a_o_bound = a_o_thing.map(function(o_thing){ return f_o_bound(f_a_n_pos__moved(o_thing.o_mesh.a_n_pos, o_thing.a_n_mat4__bed ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])); });
    let o_layout = f_o_layout(a_o_bound.map(function(o_bound){ return [o_bound.a_n_max[0] - o_bound.a_n_min[0], o_bound.a_n_max[1] - o_bound.a_n_min[1]]; }), o_setting.n_mm__bed);
    a_o_thing.forEach(function(o_thing, n_idx){
        let a_n_mat4 = [...(o_thing.a_n_mat4__bed ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])];
        a_n_mat4[12] = o_layout.a_a_n_at[n_idx][0] - a_o_bound[n_idx].a_n_min[0];
        a_n_mat4[13] = o_layout.a_a_n_at[n_idx][1] - a_o_bound[n_idx].a_n_min[1];
        a_n_mat4[14] = -a_o_bound[n_idx].a_n_min[2];
        o_thing.a_n_mat4__bed = a_n_mat4;
    });
    return { a_o_part, a_o_screw, a_o_cut, b_fits: o_layout.b_fits };
};

export { f_a_n_normal, f_a_n_mat4__turning, f_a_n_pos__moved, f_o_pole, f_o_layout, f_o_built };
