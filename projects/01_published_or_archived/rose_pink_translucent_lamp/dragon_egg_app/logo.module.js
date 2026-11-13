// The flat TraceTrove logo V3 as a distance field, for engraving without booleans.
// The outline is the one of logo_final_flat in branding/LOGO_V3/tracetrove_logo.scad,
// centred, with its rib towards +y. test/app.test.js compares the two.

let n_deg = Math.PI / 180;
let n_cad__tip_y = 17.5 * Math.sin(60 * n_deg) + (17.5 * Math.cos(60 * n_deg) - 7.5) * Math.tan(30 * n_deg);
let n_cad__scl_x = 20;
let n_cad__scl_y = 2 * n_cad__tip_y;
// Far enough outside the logo for the margin that clears the scales around it.
let n_cad__padding = 14;
let n_cad__step = 0.25;
let n_cnt__arc_step = 24;

let f_a_n_arc = function(n_x, n_y, n_radius, n_deg__from, n_deg__to){
    let a_n_xy = [];
    for(let n_it = 0; n_it <= n_cnt__arc_step; n_it++){
        let n_rad = (n_deg__from + (n_deg__to - n_deg__from) * n_it / n_cnt__arc_step) * n_deg;
        a_n_xy.push(n_x + n_radius * Math.cos(n_rad) - 7.5, n_y + n_radius * Math.sin(n_rad));
    }
    return a_n_xy;
};

let f_o_polygon__logo = function(){
    let n_deg__a = Math.atan2(7.5, 10) / n_deg;
    return {
        a_n_xy__outline: [
            ...f_a_n_arc(0, 0, 17.5, -60, 60),
            0, n_cad__tip_y,
            ...f_a_n_arc(15, 0, 17.5, 120, 240),
            0, -n_cad__tip_y
        ],
        a_n_xy__window: [
            ...f_a_n_arc(0, 0, 12.5, n_deg__a - 90, n_deg__a),
            ...f_a_n_arc(-2.5, 7.5, 12.5, 0, -n_deg__a),
            ...f_a_n_arc(17.5, 7.5, 12.5, 180 + n_deg__a, 180),
            ...f_a_n_arc(15, 0, 12.5, 180 - n_deg__a, 270 - n_deg__a)
        ]
    };
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

let o_field__cached = null;

// Two fields over the logo and its surroundings, in CAD units, where the logo is
// 31.75 tall: the distance to the outline, and to the logo with its window cut out.
let f_o_field__logo = function(){
    if(o_field__cached){ return o_field__cached; }
    let { a_n_xy__outline, a_n_xy__window } = f_o_polygon__logo();
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
            let n_window = f_n_distance__polygon(a_n_xy__window, n_x, n_y);
            a_n_outline[n_it_y * n_scl_x + n_it_x] = n_outline;
            a_n_region[n_it_y * n_scl_x + n_it_x] = Math.max(n_outline, -n_window);
        }
    }
    o_field__cached = { n_x__start, n_y__start, n_scl_x, n_scl_y, n_step: n_cad__step, a_n_outline, a_n_region };
    return o_field__cached;
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
    n_cad__scl_x,
    n_cad__scl_y,
    n_cad__padding,
    f_o_polygon__logo,
    f_o_field__logo,
    f_n_field,
    f_n_area__polygon
};
