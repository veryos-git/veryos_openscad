// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Where an object stands, and the gizmo that moves it: arrows to move it along x, y
// and z, rings to turn it around them, an orange ring to make it larger or smaller,
// and its middle to move it across the screen.
//
// A place is { a_n_trn, a_n_rot, n_scl }: where the object's middle is, in mm; how
// it is turned, as a quaternion x, y, z, w; and how many times its size it is.

let n_tau = Math.PI * 2;
// The gizmo's sizes on screen, in pixels, whatever the zoom.
let n_px__arrow = 100;
let n_px__ring = 74;
let n_px__scale = 122;
let n_px__grab = 9;
let a_a_n_axis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
let a_a_n_col__axis = [[0.96, 0.33, 0.3], [0.42, 0.85, 0.4], [0.36, 0.58, 1]];
// The ring that resizes, and the middle: seen on a white object as on the dark ground.
let a_n_col__scale = [1, 0.55, 0.1];
let a_n_col__active = [1, 1, 1];
let a_s_handle__move = ['move_x', 'move_y', 'move_z'];
let a_s_handle__turn = ['turn_x', 'turn_y', 'turn_z'];

let f_n_dot = function(a_n_a, a_n_b){ return a_n_a[0] * a_n_b[0] + a_n_a[1] * a_n_b[1] + a_n_a[2] * a_n_b[2]; };
let f_a_n_sum = function(a_n_a, a_n_b, n_scl = 1){ return [a_n_a[0] + a_n_b[0] * n_scl, a_n_a[1] + a_n_b[1] * n_scl, a_n_a[2] + a_n_b[2] * n_scl]; };
let f_a_n_cross = function(a_n_a, a_n_b){
    return [a_n_a[1] * a_n_b[2] - a_n_a[2] * a_n_b[1], a_n_a[2] * a_n_b[0] - a_n_a[0] * a_n_b[2], a_n_a[0] * a_n_b[1] - a_n_a[1] * a_n_b[0]];
};
let f_a_n_unit = function(a_n){
    let n_len = Math.hypot(a_n[0], a_n[1], a_n[2]) || 1;
    return [a_n[0] / n_len, a_n[1] / n_len, a_n[2] / n_len];
};

let f_o_place__default = function(){
    return { a_n_trn: [0, 0, 0], a_n_rot: [0, 0, 0, 1], n_scl: 1 };
};

// A turn of n_rad around an axis, by the right hand.
let f_a_n_rot__of_axis = function(a_n_axis, n_rad){
    let n_sin = Math.sin(n_rad / 2);
    return [a_n_axis[0] * n_sin, a_n_axis[1] * n_sin, a_n_axis[2] * n_sin, Math.cos(n_rad / 2)];
};

// The turn b, then the turn a.
let f_a_n_rot__multiplied = function(a_n_a, a_n_b){
    let [n_ax, n_ay, n_az, n_aw] = a_n_a, [n_bx, n_by, n_bz, n_bw] = a_n_b;
    let a_n = [
        n_aw * n_bx + n_ax * n_bw + n_ay * n_bz - n_az * n_by,
        n_aw * n_by - n_ax * n_bz + n_ay * n_bw + n_az * n_bx,
        n_aw * n_bz + n_ax * n_by - n_ay * n_bx + n_az * n_bw,
        n_aw * n_bw - n_ax * n_bx - n_ay * n_by - n_az * n_bz
    ];
    let n_len = Math.hypot(...a_n) || 1;
    return a_n.map(function(n_val){ return n_val / n_len; });
};

// A place as a matrix, its columns one after the other: a point of the file goes
// around a_n_pivot, the file's middle, to where the place says.
let f_a_n_mat4__of_place = function(o_place, a_n_pivot){
    let [n_x, n_y, n_z, n_w] = o_place.a_n_rot;
    let n_s = o_place.n_scl;
    let a_n = [
        (1 - 2 * (n_y * n_y + n_z * n_z)) * n_s, 2 * (n_x * n_y + n_z * n_w) * n_s, 2 * (n_x * n_z - n_y * n_w) * n_s, 0,
        2 * (n_x * n_y - n_z * n_w) * n_s, (1 - 2 * (n_x * n_x + n_z * n_z)) * n_s, 2 * (n_y * n_z + n_x * n_w) * n_s, 0,
        2 * (n_x * n_z + n_y * n_w) * n_s, 2 * (n_y * n_z - n_x * n_w) * n_s, (1 - 2 * (n_x * n_x + n_y * n_y)) * n_s, 0,
        0, 0, 0, 1
    ];
    for(let n_row = 0; n_row < 3; n_row++){
        a_n[12 + n_row] = o_place.a_n_trn[n_row] - (a_n[n_row] * a_n_pivot[0] + a_n[4 + n_row] * a_n_pivot[1] + a_n[8 + n_row] * a_n_pivot[2]);
    }
    return new Float32Array(a_n);
};

// Triangles, each corner through a matrix.
let f_a_n_tri__moved = function(a_n_tri, a_n_mat4){
    let a_n = new Float32Array(a_n_tri.length);
    for(let n_off = 0; n_off < a_n_tri.length; n_off += 3){
        let n_x = a_n_tri[n_off], n_y = a_n_tri[n_off + 1], n_z = a_n_tri[n_off + 2];
        a_n[n_off] = a_n_mat4[0] * n_x + a_n_mat4[4] * n_y + a_n_mat4[8] * n_z + a_n_mat4[12];
        a_n[n_off + 1] = a_n_mat4[1] * n_x + a_n_mat4[5] * n_y + a_n_mat4[9] * n_z + a_n_mat4[13];
        a_n[n_off + 2] = a_n_mat4[2] * n_x + a_n_mat4[6] * n_y + a_n_mat4[10] * n_z + a_n_mat4[14];
    }
    return a_n;
};

// The box around triangles that went through a matrix, without making them.
let f_o_bound__moved = function(a_n_tri, a_n_mat4){
    let a_n_min = [Infinity, Infinity, Infinity], a_n_max = [-Infinity, -Infinity, -Infinity];
    for(let n_off = 0; n_off < a_n_tri.length; n_off += 3){
        let n_x = a_n_tri[n_off], n_y = a_n_tri[n_off + 1], n_z = a_n_tri[n_off + 2];
        for(let n_k = 0; n_k < 3; n_k++){
            let n_val = a_n_mat4[n_k] * n_x + a_n_mat4[4 + n_k] * n_y + a_n_mat4[8 + n_k] * n_z + a_n_mat4[12 + n_k];
            if(n_val < a_n_min[n_k]){ a_n_min[n_k] = n_val; }
            if(n_val > a_n_max[n_k]){ a_n_max[n_k] = n_val; }
        }
    }
    return { a_n_min, a_n_max };
};

/* ---- The eye: o_camera is { a_n_eye, a_n_right, a_n_up, a_n_forward, n_tan, n_scl_x,
   n_scl_y }, n_tan the tangent of half the view's angle, the sizes in pixels ---- */

// Where a point is on screen, in pixels from the upper left.
let f_a_n_px = function(o_camera, a_n_point){
    let a_n = [a_n_point[0] - o_camera.a_n_eye[0], a_n_point[1] - o_camera.a_n_eye[1], a_n_point[2] - o_camera.a_n_eye[2]];
    let n_depth = Math.max(f_n_dot(a_n, o_camera.a_n_forward), 1e-6);
    let n_half = 0.5 * o_camera.n_scl_y / o_camera.n_tan;
    return [0.5 * o_camera.n_scl_x + f_n_dot(a_n, o_camera.a_n_right) / n_depth * n_half, 0.5 * o_camera.n_scl_y - f_n_dot(a_n, o_camera.a_n_up) / n_depth * n_half];
};

// The line of sight through a place on screen: from the eye, in this direction.
let f_a_n_ray = function(o_camera, n_x, n_y){
    let n_half = 0.5 * o_camera.n_scl_y / o_camera.n_tan;
    let n_u = (n_x - 0.5 * o_camera.n_scl_x) / n_half, n_v = (0.5 * o_camera.n_scl_y - n_y) / n_half;
    return f_a_n_unit(f_a_n_sum(f_a_n_sum(o_camera.a_n_forward, o_camera.a_n_right, n_u), o_camera.a_n_up, n_v));
};

// How many mm a pixel is, at a point.
let f_n_mm_per_px = function(o_camera, a_n_point){
    let a_n = [a_n_point[0] - o_camera.a_n_eye[0], a_n_point[1] - o_camera.a_n_eye[1], a_n_point[2] - o_camera.a_n_eye[2]];
    return Math.max(f_n_dot(a_n, o_camera.a_n_forward), 1e-6) * 2 * o_camera.n_tan / o_camera.n_scl_y;
};

// How far along an axis through a_n_point the line of sight passes it nearest.
let f_n_mm__along_axis = function(o_camera, a_n_point, a_n_axis, n_x, n_y){
    let a_n_ray = f_a_n_ray(o_camera, n_x, n_y);
    let a_n = [a_n_point[0] - o_camera.a_n_eye[0], a_n_point[1] - o_camera.a_n_eye[1], a_n_point[2] - o_camera.a_n_eye[2]];
    let n_b = f_n_dot(a_n_axis, a_n_ray);
    let n_under = 1 - n_b * n_b;
    // Seen along the axis itself, no place on screen tells how far.
    if(n_under < 1e-4){ return 0; }
    return (n_b * f_n_dot(a_n_ray, a_n) - f_n_dot(a_n_axis, a_n)) / n_under;
};

// Where the line of sight meets the plane through a_n_point that faces the eye.
let f_a_n_point__facing = function(o_camera, a_n_point, n_x, n_y){
    let a_n_ray = f_a_n_ray(o_camera, n_x, n_y);
    let a_n = [a_n_point[0] - o_camera.a_n_eye[0], a_n_point[1] - o_camera.a_n_eye[1], a_n_point[2] - o_camera.a_n_eye[2]];
    return f_a_n_sum(o_camera.a_n_eye, a_n_ray, f_n_dot(a_n, o_camera.a_n_forward) / Math.max(f_n_dot(a_n_ray, o_camera.a_n_forward), 1e-6));
};

let f_n_px__to_segment = function(a_n_p, a_n_a, a_n_b){
    let n_ex = a_n_b[0] - a_n_a[0], n_ey = a_n_b[1] - a_n_a[1];
    let n_len2 = n_ex * n_ex + n_ey * n_ey;
    let n_t = n_len2 > 0 ? Math.max(0, Math.min(1, ((a_n_p[0] - a_n_a[0]) * n_ex + (a_n_p[1] - a_n_a[1]) * n_ey) / n_len2)) : 0;
    return Math.hypot(a_n_p[0] - a_n_a[0] - n_ex * n_t, a_n_p[1] - a_n_a[1] - n_ey * n_t);
};

// The gizmo's lines and points around a place, as large on screen as its pixels say.
let f_o_shape = function(o_camera, a_n_trn){
    let n_mm = f_n_mm_per_px(o_camera, a_n_trn);
    let a_o_arrow = a_a_n_axis.map(function(a_n_axis){
        return { a_n_from: f_a_n_sum(a_n_trn, a_n_axis, 0.3 * n_px__arrow * n_mm), a_n_to: f_a_n_sum(a_n_trn, a_n_axis, n_px__arrow * n_mm) };
    });
    // A ring around each axis, as a line of 64 pieces.
    let a_a_a_n_ring = a_a_n_axis.map(function(a_n_axis, n_idx){
        let a_n_u = a_a_n_axis[(n_idx + 1) % 3], a_n_v = a_a_n_axis[(n_idx + 2) % 3];
        return Array.from({ length: 65 }, function(v, n_it){
            let n_rad = n_tau * n_it / 64;
            return f_a_n_sum(f_a_n_sum(a_n_trn, a_n_u, Math.cos(n_rad) * n_px__ring * n_mm), a_n_v, Math.sin(n_rad) * n_px__ring * n_mm);
        });
    });
    let a_a_n_scale = Array.from({ length: 65 }, function(v, n_it){
        let n_rad = n_tau * n_it / 64;
        return f_a_n_sum(f_a_n_sum(a_n_trn, o_camera.a_n_right, Math.cos(n_rad) * n_px__scale * n_mm), o_camera.a_n_up, Math.sin(n_rad) * n_px__scale * n_mm);
    });
    return { a_o_arrow, a_a_a_n_ring, a_a_n_scale };
};

// Which of the gizmo's handles is at a place on screen, or null.
let f_s_handle__at = function(o_camera, a_n_trn, n_x, n_y){
    let a_n_p = [n_x, n_y];
    let o_shape = f_o_shape(o_camera, a_n_trn);
    let a_n_middle = f_a_n_px(o_camera, a_n_trn);
    if(Math.hypot(n_x - a_n_middle[0], n_y - a_n_middle[1]) <= n_px__grab + 3){ return 'move_view'; }
    let s_handle = null, n_px__best = n_px__grab;
    let f_try = function(s, n_px){
        if(n_px < n_px__best){ s_handle = s; n_px__best = n_px; }
    };
    o_shape.a_o_arrow.forEach(function(o_arrow, n_idx){
        let a_n_to = f_a_n_px(o_camera, o_arrow.a_n_to);
        // The arrow's head is easier to take than a line.
        f_try(a_s_handle__move[n_idx], Math.hypot(n_x - a_n_to[0], n_y - a_n_to[1]) - 5);
        f_try(a_s_handle__move[n_idx], f_n_px__to_segment(a_n_p, f_a_n_px(o_camera, o_arrow.a_n_from), a_n_to) - 1);
    });
    o_shape.a_a_a_n_ring.forEach(function(a_a_n_ring, n_idx){
        let a_a_n_px = a_a_n_ring.map(function(a_n){ return f_a_n_px(o_camera, a_n); });
        for(let n_it = 0; n_it < a_a_n_px.length - 1; n_it++){ f_try(a_s_handle__turn[n_idx], f_n_px__to_segment(a_n_p, a_a_n_px[n_it], a_a_n_px[n_it + 1])); }
    });
    f_try('scale', Math.abs(Math.hypot(n_x - a_n_middle[0], n_y - a_n_middle[1]) - n_px__scale) + 1);
    return s_handle;
};

// The place a drag of a handle leads to: from o_place, taken at n_x__from, n_y__from,
// to where the pointer is now.
let f_o_place__dragged = function(o_camera, o_place, s_handle, n_x__from, n_y__from, n_x, n_y){
    let a_n_trn = o_place.a_n_trn;
    let a_n_middle = f_a_n_px(o_camera, a_n_trn);
    if(s_handle === 'move_view'){
        let a_n_from = f_a_n_point__facing(o_camera, a_n_trn, n_x__from, n_y__from), a_n_to = f_a_n_point__facing(o_camera, a_n_trn, n_x, n_y);
        return { ...o_place, a_n_trn: [a_n_trn[0] + a_n_to[0] - a_n_from[0], a_n_trn[1] + a_n_to[1] - a_n_from[1], a_n_trn[2] + a_n_to[2] - a_n_from[2]] };
    }
    if(a_s_handle__move.includes(s_handle)){
        let a_n_axis = a_a_n_axis[a_s_handle__move.indexOf(s_handle)];
        let n_mm = f_n_mm__along_axis(o_camera, a_n_trn, a_n_axis, n_x, n_y) - f_n_mm__along_axis(o_camera, a_n_trn, a_n_axis, n_x__from, n_y__from);
        return { ...o_place, a_n_trn: f_a_n_sum(a_n_trn, a_n_axis, n_mm) };
    }
    if(a_s_handle__turn.includes(s_handle)){
        let a_n_axis = a_a_n_axis[a_s_handle__turn.indexOf(s_handle)];
        let n_toward = f_n_dot(a_n_axis, f_a_n_unit([o_camera.a_n_eye[0] - a_n_trn[0], o_camera.a_n_eye[1] - a_n_trn[1], o_camera.a_n_eye[2] - a_n_trn[2]]));
        let n_rad;
        if(Math.abs(n_toward) > 0.35){
            // The ring is seen as a ring: the pointer goes around its middle. Around an
            // axis that points at the eye, against the clock is the turn's own direction.
            let n_rad__from = Math.atan2(a_n_middle[1] - n_y__from, n_x__from - a_n_middle[0]);
            let n_rad__to = Math.atan2(a_n_middle[1] - n_y, n_x - a_n_middle[0]);
            n_rad = (n_rad__to - n_rad__from) * Math.sign(n_toward);
        } else {
            // The ring is seen from its side, as a line: the pointer goes across the axis.
            let a_n_tip = f_a_n_px(o_camera, f_a_n_sum(a_n_trn, a_n_axis, n_px__ring * f_n_mm_per_px(o_camera, a_n_trn)));
            let n_ax = a_n_tip[0] - a_n_middle[0], n_ay = a_n_tip[1] - a_n_middle[1];
            let n_len = Math.hypot(n_ax, n_ay) || 1;
            n_rad = ((n_x - n_x__from) * -n_ay + (n_y - n_y__from) * n_ax) / n_len / n_px__ring;
        }
        return { ...o_place, a_n_rot: f_a_n_rot__multiplied(f_a_n_rot__of_axis(a_n_axis, n_rad), o_place.a_n_rot) };
    }
    // The orange ring: as many times larger as the pointer is further from the middle.
    let n_px__from = Math.max(Math.hypot(n_x__from - a_n_middle[0], n_y__from - a_n_middle[1]), 4);
    let n_nor = Math.hypot(n_x - a_n_middle[0], n_y - a_n_middle[1]) / n_px__from;
    return { ...o_place, n_scl: Math.max(0.001, Math.min(1000, o_place.n_scl * Math.max(n_nor, 0.02))) };
};

// The gizmo as the viewer's tool. f_o_place: where the object is now, or null if
// there is none. f_set_place: called while a handle is dragged. f_done: called when
// it is let go. The viewer gives it the eye in the lampshade's own coordinates.
let f_o_gizmo = function({ f_o_place, f_set_place, f_done }){
    let o_drag = null;
    let s_handle__hover = null;
    return {
        // What to draw: lines as pairs of points, and points, each with a colour.
        f_a_o_shape: function(o_camera){
            let o_place = f_o_place();
            if(!o_place){ return []; }
            let o_shape = f_o_shape(o_camera, o_place.a_n_trn);
            let s_handle = o_drag ? o_drag.s_handle : s_handle__hover;
            let f_a_n_col = function(s, a_n_col){ return s === s_handle ? a_n_col__active : a_n_col; };
            let f_a_n_line = function(a_a_n){
                let a_n = [];
                for(let n_it = 0; n_it < a_a_n.length - 1; n_it++){ a_n.push(...a_a_n[n_it], ...a_a_n[n_it + 1]); }
                return new Float32Array(a_n);
            };
            let a_o = [];
            o_shape.a_a_a_n_ring.forEach(function(a_a_n_ring, n_idx){
                a_o.push({ s_type: 'line', a_n_pos: f_a_n_line(a_a_n_ring), a_n_col: f_a_n_col(a_s_handle__turn[n_idx], a_a_n_col__axis[n_idx]) });
            });
            o_shape.a_o_arrow.forEach(function(o_arrow, n_idx){
                let a_n_col = f_a_n_col(a_s_handle__move[n_idx], a_a_n_col__axis[n_idx]);
                a_o.push({ s_type: 'line', a_n_pos: f_a_n_line([o_arrow.a_n_from, o_arrow.a_n_to]), a_n_col });
                a_o.push({ s_type: 'point', a_n_pos: new Float32Array(o_arrow.a_n_to), a_n_col, n_px: 13 });
            });
            a_o.push({ s_type: 'line', a_n_pos: f_a_n_line(o_shape.a_a_n_scale), a_n_col: f_a_n_col('scale', a_n_col__scale) });
            a_o.push({ s_type: 'point', a_n_pos: new Float32Array(o_place.a_n_trn), a_n_col: f_a_n_col('move_view', a_n_col__scale), n_px: 15 });
            return a_o;
        },
        // The pointer went down: whether it took a handle.
        f_b_down: function(n_x, n_y, o_camera){
            let o_place = f_o_place();
            let s_handle = o_place ? f_s_handle__at(o_camera, o_place.a_n_trn, n_x, n_y) : null;
            if(!s_handle){ return false; }
            // The whole drag is measured from where it began, with the eye as it was then.
            o_drag = { s_handle, n_x, n_y, o_camera, o_place: structuredClone(o_place) };
            return true;
        },
        f_move: function(n_x, n_y){
            if(o_drag){ f_set_place(f_o_place__dragged(o_drag.o_camera, o_drag.o_place, o_drag.s_handle, o_drag.n_x, o_drag.n_y, n_x, n_y)); }
        },
        f_up: function(){
            if(o_drag){
                o_drag = null;
                f_done();
            }
        },
        // The pointer moved over the view without a button: whether another handle lights up.
        f_b_hover: function(n_x, n_y, o_camera){
            let o_place = f_o_place();
            let s_handle = o_place ? f_s_handle__at(o_camera, o_place.a_n_trn, n_x, n_y) : null;
            let b_changed = s_handle !== s_handle__hover;
            s_handle__hover = s_handle;
            return b_changed;
        }
    };
};

export {
    f_o_place__default,
    f_a_n_rot__of_axis,
    f_a_n_rot__multiplied,
    f_a_n_mat4__of_place,
    f_a_n_tri__moved,
    f_o_bound__moved,
    f_a_n_px,
    f_a_n_ray,
    f_s_handle__at,
    f_o_place__dragged,
    f_o_gizmo
};
