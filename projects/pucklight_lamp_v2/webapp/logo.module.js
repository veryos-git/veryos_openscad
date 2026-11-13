// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The two brands' logos as distance fields, for engraving without booleans. Each is
// centred, its top towards +y, in the units of its own drawing: CAD units.
//   veryos: the path of veryos_logo.svg in the workspace root, which is logo() in
//       ../pucklight_lamp_v2V5.scad
//   tracetrove: the flat TraceTrove logo V3, its rib towards +y, which is
//       logo(height) in ../pucklight_lamp_v2V5_TraceTrove.scad
// test/mesh.test.js compares both with their .scad files.

let n_tau = Math.PI * 2;
let n_deg = Math.PI / 180;
// Far enough outside the logo for the margin that clears the relief around it.
let n_cad__padding = 14;
let n_cad__step = 0.25;
let n_cnt__arc_step = 24;

// An arc around a centre, as x, y, x, y: counterclockwise for rising angles.
let f_a_n_arc = function(n_x, n_y, n_radius, n_deg__from, n_deg__to){
    let a_n_xy = [];
    for(let n_it = 0; n_it <= n_cnt__arc_step; n_it++){
        let n_rad = (n_deg__from + (n_deg__to - n_deg__from) * n_it / n_cnt__arc_step) * n_deg;
        a_n_xy.push(n_x + n_radius * Math.cos(n_rad), n_y + n_radius * Math.sin(n_rad));
    }
    return a_n_xy;
};

let f_o_polygon__tracetrove = function(){
    let n_cad__tip_y = 17.5 * Math.sin(60 * n_deg) + (17.5 * Math.cos(60 * n_deg) - 7.5) * Math.tan(30 * n_deg);
    let n_deg__a = Math.atan2(7.5, 10) / n_deg;
    // The drawing's middle is 7.5 right of its first arc's centre.
    let f_a_n_arc__centred = function(n_x, n_y, n_radius, n_deg__from, n_deg__to){
        return f_a_n_arc(n_x - 7.5, n_y, n_radius, n_deg__from, n_deg__to);
    };
    return {
        n_cad__scl_x: 20,
        n_cad__scl_y: 2 * n_cad__tip_y,
        a_n_xy__outline: [
            ...f_a_n_arc__centred(0, 0, 17.5, -60, 60),
            0, n_cad__tip_y,
            ...f_a_n_arc__centred(15, 0, 17.5, 120, 240),
            0, -n_cad__tip_y
        ],
        a_a_n_xy__window: [[
            ...f_a_n_arc__centred(0, 0, 12.5, n_deg__a - 90, n_deg__a),
            ...f_a_n_arc__centred(-2.5, 7.5, 12.5, 0, -n_deg__a),
            ...f_a_n_arc__centred(17.5, 7.5, 12.5, 180 + n_deg__a, 180),
            ...f_a_n_arc__centred(15, 0, 12.5, 180 - n_deg__a, 270 - n_deg__a)
        ]]
    };
};

// veryos_logo.svg: its outline, and the two holes the S leaves in the ring. A line is
// [x, y], an arc of a circle [radius, sweep, x, y], as in the path's L and A.
let n_svg__scl_x = 43.9095293518;
let n_svg__scl_y = 31.2528266758;
let a_a_a_n_path__veryos = [
    [
        [7.7528133542, 9.1080260785], [4.6193976626, 1.5432914191], [0, 3.4567085809],
        [11.5135290962, 31.2528266758], [32.3960002556, 31.2528266758], [43.9095293518, 3.4567085809],
        [39.2901316892, 1.5432914191], [36.1567159975, 9.1080260785],
        [15.6264133379, 0, 7.7528133542, 9.1080260785]
    ],
    [
        [30.9694268093, 21.2528266758],
        [10.6264133379, 0, 21.9547646759, 5],
        [4.0632066689, 0, 21.9547646759, 13.1264133379],
        [9.0632066689, 1, 30.9694268093, 21.2528266758]
    ],
    [
        [12.9401025425, 10],
        [9.0632066689, 0, 21.9547646759, 18.1264133379],
        [4.0632066689, 1, 21.9547646759, 26.2528266758],
        [10.6264133379, 1, 12.9401025425, 10]
    ]
];

// One of the path's closed shapes as points. Its arcs are all less than half a turn.
let f_a_n_xy__from_path = function(a_a_n_path){
    let a_n_xy = [];
    let [n_x, n_y] = a_a_n_path[0];
    for(let a_n of a_a_n_path){
        if(a_n.length === 2){
            [n_x, n_y] = a_n;
            a_n_xy.push(n_x, n_y);
            continue;
        }
        let [n_radius, n_sweep, n_x__end, n_y__end] = a_n;
        // The centre lies off the middle of the two ends, on the side the sweep names.
        let n_dx = (n_x - n_x__end) / 2, n_dy = (n_y - n_y__end) / 2;
        let n_off = Math.sqrt(Math.max(0, n_radius * n_radius / (n_dx * n_dx + n_dy * n_dy) - 1)) * (n_sweep ? 1 : -1);
        let n_x__centre = n_off * n_dy + (n_x + n_x__end) / 2;
        let n_y__centre = -n_off * n_dx + (n_y + n_y__end) / 2;
        let n_rad__from = Math.atan2(n_y - n_y__centre, n_x - n_x__centre);
        let n_rad__turn = Math.atan2(n_y__end - n_y__centre, n_x__end - n_x__centre) - n_rad__from;
        if(n_sweep && n_rad__turn < 0){ n_rad__turn += n_tau; }
        if(!n_sweep && n_rad__turn > 0){ n_rad__turn -= n_tau; }
        for(let n_it = 1; n_it <= n_cnt__arc_step; n_it++){
            let n_rad = n_rad__from + n_rad__turn * n_it / n_cnt__arc_step;
            a_n_xy.push(n_x__centre + n_radius * Math.cos(n_rad), n_y__centre + n_radius * Math.sin(n_rad));
        }
        [n_x, n_y] = [n_x__end, n_y__end];
    }
    // A shape that ends where it began has that point twice.
    if(Math.hypot(a_n_xy[0] - n_x, a_n_xy[1] - n_y) < 1e-9){ a_n_xy.length -= 2; }
    // An SVG's y runs down.
    for(let n_off = 0; n_off < a_n_xy.length; n_off += 2){
        a_n_xy[n_off] -= n_svg__scl_x / 2;
        a_n_xy[n_off + 1] = n_svg__scl_y / 2 - a_n_xy[n_off + 1];
    }
    return a_n_xy;
};

let f_o_polygon__veryos = function(){
    let [a_n_xy__outline, ...a_a_n_xy__window] = a_a_a_n_path__veryos.map(f_a_n_xy__from_path);
    return { n_cad__scl_x: n_svg__scl_x, n_cad__scl_y: n_svg__scl_y, a_n_xy__outline, a_a_n_xy__window };
};

let o_f_o_polygon__by_brand = { veryos: f_o_polygon__veryos, tracetrove: f_o_polygon__tracetrove };

// A brand's logo: its size, its outline and the windows in it.
let f_o_polygon__logo = function(s_brand){
    return o_f_o_polygon__by_brand[s_brand]();
};

// Distance to a closed polygon, negative inside.
let f_n_distance__polygon = function(a_n_xy, n_x, n_y){
    let n_cnt = a_n_xy.length / 2;
    let n_distance_squared = Infinity;
    let n_sign = 1;
    for(let n_i = 0, n_j = n_cnt - 1; n_i < n_cnt; n_j = n_i, n_i++){
        let n_ax = a_n_xy[n_i * 2], n_ay = a_n_xy[n_i * 2 + 1];
        let n_ex = a_n_xy[n_j * 2] - n_ax, n_ey = a_n_xy[n_j * 2 + 1] - n_ay;
        let n_wx = n_x - n_ax, n_wy = n_y - n_ay;
        let n_len_squared = n_ex * n_ex + n_ey * n_ey;
        let n_t = n_len_squared > 0 ? Math.max(0, Math.min(1, (n_wx * n_ex + n_wy * n_ey) / n_len_squared)) : 0;
        let n_bx = n_wx - n_ex * n_t, n_by = n_wy - n_ey * n_t;
        let n_dist = n_bx * n_bx + n_by * n_by;
        if(n_dist < n_distance_squared){ n_distance_squared = n_dist; }
        let b_above = n_y >= n_ay;
        let b_below = n_y < n_ay + n_ey;
        let b_side = n_ex * n_wy > n_ey * n_wx;
        if((b_above && b_below && b_side) || (!b_above && !b_below && !b_side)){ n_sign = -n_sign; }
    }
    return n_sign * Math.sqrt(n_distance_squared);
};

let o_field__by_brand = new Map();

// Two fields over a brand's logo and its surroundings, in CAD units: the distance to
// the outline, and to the logo with its windows cut out.
let f_o_field__logo = function(s_brand){
    if(o_field__by_brand.has(s_brand)){ return o_field__by_brand.get(s_brand); }
    let { n_cad__scl_x, n_cad__scl_y, a_n_xy__outline, a_a_n_xy__window } = f_o_polygon__logo(s_brand);
    let n_x__start = -n_cad__scl_x / 2 - n_cad__padding;
    let n_y__start = -n_cad__scl_y / 2 - n_cad__padding;
    let n_scl_x = Math.ceil((n_cad__scl_x + 2 * n_cad__padding) / n_cad__step) + 1;
    let n_scl_y = Math.ceil((n_cad__scl_y + 2 * n_cad__padding) / n_cad__step) + 1;
    let a_n_outline = new Float32Array(n_scl_x * n_scl_y);
    let a_n_region = new Float32Array(n_scl_x * n_scl_y);
    for(let n_it_y = 0; n_it_y < n_scl_y; n_it_y++){
        let n_y = n_y__start + n_it_y * n_cad__step;
        for(let n_it_x = 0; n_it_x < n_scl_x; n_it_x++){
            let n_x = n_x__start + n_it_x * n_cad__step;
            let n_outline = f_n_distance__polygon(a_n_xy__outline, n_x, n_y);
            let n_window = Infinity;
            for(let a_n_xy of a_a_n_xy__window){ n_window = Math.min(n_window, f_n_distance__polygon(a_n_xy, n_x, n_y)); }
            a_n_outline[n_it_y * n_scl_x + n_it_x] = n_outline;
            a_n_region[n_it_y * n_scl_x + n_it_x] = Math.max(n_outline, -n_window);
        }
    }
    let o_field = { n_cad__scl_x, n_cad__scl_y, n_x__start, n_y__start, n_scl_x, n_scl_y, n_step: n_cad__step, a_n_outline, a_n_region };
    o_field__by_brand.set(s_brand, o_field);
    return o_field;
};

// Bilinear lookup. Outside the field it returns a value far away from the logo.
let f_n_field = function(o_field, a_n_val, n_x, n_y){
    let n_gx = (n_x - o_field.n_x__start) / o_field.n_step;
    let n_gy = (n_y - o_field.n_y__start) / o_field.n_step;
    if(n_gx < 0 || n_gy < 0 || n_gx >= o_field.n_scl_x - 1 || n_gy >= o_field.n_scl_y - 1){ return n_cad__padding; }
    let n_x0 = n_gx | 0, n_y0 = n_gy | 0;
    let n_fx = n_gx - n_x0, n_fy = n_gy - n_y0;
    let n_off = n_y0 * o_field.n_scl_x + n_x0;
    let n_top = a_n_val[n_off] * (1 - n_fx) + a_n_val[n_off + 1] * n_fx;
    let n_bottom = a_n_val[n_off + o_field.n_scl_x] * (1 - n_fx) + a_n_val[n_off + o_field.n_scl_x + 1] * n_fx;
    return n_top * (1 - n_fy) + n_bottom * n_fy;
};

let f_n_area__polygon = function(a_n_xy){
    let n_area = 0;
    let n_cnt = a_n_xy.length / 2;
    for(let n_i = 0, n_j = n_cnt - 1; n_i < n_cnt; n_j = n_i, n_i++){
        n_area += a_n_xy[n_j * 2] * a_n_xy[n_i * 2 + 1] - a_n_xy[n_i * 2] * a_n_xy[n_j * 2 + 1];
    }
    return Math.abs(n_area) / 2;
};

export {
    n_cad__padding,
    f_o_polygon__logo,
    f_o_field__logo,
    f_n_field,
    f_n_area__polygon
};
