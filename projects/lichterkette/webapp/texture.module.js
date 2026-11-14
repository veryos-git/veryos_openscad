// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Colours from pictures: an object whose colours are a picture, a texture, gets them
// as colours of its triangles' corners, which the rest of the app works with. Where a
// triangle spans more of the picture than its corners can show, it is cut into
// smaller ones first, so the bulb's grid finds the picture's colours between them.
//
// A picture is { n_scl_x, n_scl_y, a_n_rgba, s_wrap_x, s_wrap_y }: its pixels row by row
// from the top, r, g, b, a from 0 to 255; wrap 'repeat', 'clamp' or 'mirror'.

// sRGB from 0 to 255 to light from 0 to 1, and back.
let a_n_linear__of_byte = Float32Array.from({ length: 256 }, function(v, n_val){
    let n = n_val / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
});
let f_n_byte__of_linear = function(n){
    n = Math.max(0, Math.min(1, n));
    return Math.round(255 * (n <= 0.0031308 ? n * 12.92 : 1.055 * Math.pow(n, 1 / 2.4) - 0.055));
};

// Triangles this many at most once cut: a picture finer than that is shown coarser.
let n_cnt__triangle_max = 2.5e6;
// A triangle is cut until its corners are this many pixels of its picture apart...
let n_px__corner = 2;
// ...or this much of the object's size, which is finer than a bulb's grid.
let n_nor__corner = 1 / 500;
// And never into more than 4^6 pieces.
let n_depth_max = 6;

let f_n_wrapped = function(n_val, n_scl, s_wrap){
    if(s_wrap === 'clamp'){ return Math.max(0, Math.min(n_scl - 1, n_val)); }
    if(s_wrap === 'mirror'){
        let n_period = 2 * n_scl;
        let n = ((n_val % n_period) + n_period) % n_period;
        return n < n_scl ? n : n_period - 1 - n;
    }
    return ((n_val % n_scl) + n_scl) % n_scl;
};

// The picture's light at u, v, between its pixels; v from its top unless b_flip_v.
let f_sample = function(o_image, n_u, n_v, b_flip_v, a_n_out){
    let n_x = n_u * o_image.n_scl_x - 0.5;
    let n_y = (b_flip_v ? 1 - n_v : n_v) * o_image.n_scl_y - 0.5;
    let n_x0 = Math.floor(n_x), n_y0 = Math.floor(n_y);
    let n_fx = n_x - n_x0, n_fy = n_y - n_y0;
    let a_n_x = [f_n_wrapped(n_x0, o_image.n_scl_x, o_image.s_wrap_x), f_n_wrapped(n_x0 + 1, o_image.n_scl_x, o_image.s_wrap_x)];
    let a_n_y = [f_n_wrapped(n_y0, o_image.n_scl_y, o_image.s_wrap_y), f_n_wrapped(n_y0 + 1, o_image.n_scl_y, o_image.s_wrap_y)];
    for(let n_k = 0; n_k < 3; n_k++){
        let f_n = function(n_ix, n_iy){ return a_n_linear__of_byte[o_image.a_n_rgba[(a_n_y[n_iy] * o_image.n_scl_x + a_n_x[n_ix]) * 4 + n_k]]; };
        a_n_out[n_k] = (f_n(0, 0) * (1 - n_fx) + f_n(1, 0) * n_fx) * (1 - n_fy) + (f_n(0, 1) * (1 - n_fx) + f_n(1, 1) * n_fx) * n_fy;
    }
};

// The colours of triangles' corners, sRGB from 0 to 255, from:
//   a_n_tri: nine numbers a triangle;
//   a_n_light: light a corner, r, g, b from 0 to 1 (a material's colour times the
//     point's own): nine numbers a triangle;
//   a_n_uv: u, v of each corner, six a triangle, or null; a_n_image__tri: for each
//     triangle its picture's number in a_o_image, or -1 for none; b_flip_v: v counts
//     from the picture's bottom (OBJ), not its top (glTF).
// Returns { a_n_tri, a_n_col, b_coarser }: triangles, cut where their picture needs it;
// b_coarser if the picture is finer than the count of triangles allows.
let f_o_baked = function(a_n_tri, a_n_light, a_n_uv, a_n_image__tri, a_o_image, b_flip_v){
    let n_cnt = a_n_tri.length / 9;
    // How many times each triangle is halved along its sides.
    let a_n_depth = new Uint8Array(n_cnt);
    let a_n_want = new Float32Array(n_cnt);
    if(a_n_uv){
        let a_n_min = [Infinity, Infinity, Infinity], a_n_max = [-Infinity, -Infinity, -Infinity];
        for(let n_off = 0; n_off < a_n_tri.length; n_off++){
            a_n_min[n_off % 3] = Math.min(a_n_min[n_off % 3], a_n_tri[n_off]);
            a_n_max[n_off % 3] = Math.max(a_n_max[n_off % 3], a_n_tri[n_off]);
        }
        let n_mm__corner = n_nor__corner * Math.hypot(a_n_max[0] - a_n_min[0], a_n_max[1] - a_n_min[1], a_n_max[2] - a_n_min[2]);
        for(let n_tri = 0; n_tri < n_cnt; n_tri++){
            let o_image = a_o_image[a_n_image__tri[n_tri]];
            if(!o_image){ continue; }
            let n_px = 0, n_mm = 0;
            for(let n_k = 0; n_k < 3; n_k++){
                let n_a = n_k, n_b = (n_k + 1) % 3;
                n_px = Math.max(n_px, Math.hypot((a_n_uv[n_tri * 6 + n_a * 2] - a_n_uv[n_tri * 6 + n_b * 2]) * o_image.n_scl_x, (a_n_uv[n_tri * 6 + n_a * 2 + 1] - a_n_uv[n_tri * 6 + n_b * 2 + 1]) * o_image.n_scl_y));
                n_mm = Math.max(n_mm, Math.hypot(a_n_tri[n_tri * 9 + n_a * 3] - a_n_tri[n_tri * 9 + n_b * 3], a_n_tri[n_tri * 9 + n_a * 3 + 1] - a_n_tri[n_tri * 9 + n_b * 3 + 1], a_n_tri[n_tri * 9 + n_a * 3 + 2] - a_n_tri[n_tri * 9 + n_b * 3 + 2]));
            }
            // As many pieces along a side as the finer of the two asks for.
            a_n_want[n_tri] = Math.min(n_px / n_px__corner, n_mm / Math.max(n_mm__corner, 1e-12));
        }
        // The deepest cut that keeps within the count, by lowering the depth for all.
        let b_fit = false;
        for(let n_depth__cap = n_depth_max; n_depth__cap >= 0 && !b_fit; n_depth__cap--){
            let n_total = 0;
            for(let n_tri = 0; n_tri < n_cnt; n_tri++){
                let n_depth = a_n_want[n_tri] > 1 ? Math.min(n_depth__cap, Math.ceil(Math.log2(a_n_want[n_tri]))) : 0;
                a_n_depth[n_tri] = n_depth;
                n_total += 1 << (2 * n_depth);
            }
            b_fit = n_total <= Math.max(n_cnt__triangle_max, n_cnt);
        }
    }
    let n_cnt__out = 0;
    for(let n_tri = 0; n_tri < n_cnt; n_tri++){ n_cnt__out += 1 << (2 * a_n_depth[n_tri]); }
    let a_n_tri__out = new Float32Array(n_cnt__out * 9);
    let a_n_col = new Uint8Array(n_cnt__out * 9);
    let n_out = 0;
    let a_n_texel = [0, 0, 0];
    let b_coarser = false;
    for(let n_tri = 0; n_tri < n_cnt; n_tri++){
        let n_seg = 1 << a_n_depth[n_tri];
        if(a_n_want[n_tri] > n_seg){ b_coarser = true; }
        let o_image = a_n_uv ? a_o_image[a_n_image__tri[n_tri]] : null;
        // The points of the triangle's grid, n_seg pieces a side, by their shares of its
        // second and third corner: position and colour of each.
        let n_cnt__point = (n_seg + 1) * (n_seg + 2) / 2;
        let a_n_point = new Float32Array(n_cnt__point * 3), a_n_point_col = new Uint8Array(n_cnt__point * 3);
        let f_n_point = function(n_i, n_j){ return n_i * (2 * n_seg + 3 - n_i) / 2 + n_j; };
        for(let n_i = 0; n_i <= n_seg; n_i++){
            for(let n_j = 0; n_j <= n_seg - n_i; n_j++){
                let n_b1 = n_i / n_seg, n_b2 = n_j / n_seg, n_b0 = 1 - n_b1 - n_b2;
                let n_p = f_n_point(n_i, n_j);
                for(let n_k = 0; n_k < 3; n_k++){
                    a_n_point[n_p * 3 + n_k] = n_b0 * a_n_tri[n_tri * 9 + n_k] + n_b1 * a_n_tri[n_tri * 9 + 3 + n_k] + n_b2 * a_n_tri[n_tri * 9 + 6 + n_k];
                }
                if(o_image){
                    let n_u = n_b0 * a_n_uv[n_tri * 6] + n_b1 * a_n_uv[n_tri * 6 + 2] + n_b2 * a_n_uv[n_tri * 6 + 4];
                    let n_v = n_b0 * a_n_uv[n_tri * 6 + 1] + n_b1 * a_n_uv[n_tri * 6 + 3] + n_b2 * a_n_uv[n_tri * 6 + 5];
                    f_sample(o_image, n_u, n_v, b_flip_v, a_n_texel);
                } else {
                    a_n_texel[0] = a_n_texel[1] = a_n_texel[2] = 1;
                }
                for(let n_k = 0; n_k < 3; n_k++){
                    let n_light = n_b0 * a_n_light[n_tri * 9 + n_k] + n_b1 * a_n_light[n_tri * 9 + 3 + n_k] + n_b2 * a_n_light[n_tri * 9 + 6 + n_k];
                    a_n_point_col[n_p * 3 + n_k] = f_n_byte__of_linear(n_light * a_n_texel[n_k]);
                }
            }
        }
        let f_add = function(n_pa, n_pb, n_pc){
            for(let [n_c, n_p] of [[0, n_pa], [1, n_pb], [2, n_pc]]){
                for(let n_k = 0; n_k < 3; n_k++){
                    a_n_tri__out[n_out * 9 + n_c * 3 + n_k] = a_n_point[n_p * 3 + n_k];
                    a_n_col[n_out * 9 + n_c * 3 + n_k] = a_n_point_col[n_p * 3 + n_k];
                }
            }
            n_out++;
        };
        // Facing as the triangle does: each piece's corners in the order of its own.
        for(let n_i = 0; n_i < n_seg; n_i++){
            for(let n_j = 0; n_j < n_seg - n_i; n_j++){
                f_add(f_n_point(n_i, n_j), f_n_point(n_i + 1, n_j), f_n_point(n_i, n_j + 1));
                if(n_i + n_j < n_seg - 1){ f_add(f_n_point(n_i + 1, n_j), f_n_point(n_i + 1, n_j + 1), f_n_point(n_i, n_j + 1)); }
            }
        }
    }
    return { a_n_tri: a_n_tri__out, a_n_col, b_coarser };
};

// A colour as light from 0 to 1: of sRGB bytes, and of a CSS hex colour, #rgb to #rrggbbaa.
let f_a_n_light__of_byte = function(a_n_byte){ return a_n_byte.map(function(n){ return a_n_linear__of_byte[n]; }); };
let f_a_n_byte__of_hex = function(s_hex){
    let s = String(s_hex ?? '').trim().replace(/^#/, '');
    if(s.length === 3 || s.length === 4){ s = s.split('').map(function(c){ return c + c; }).join(''); }
    if(!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(s)){ return null; }
    return [0, 2, 4].map(function(n_off){ return parseInt(s.slice(n_off, n_off + 2), 16); });
};

// One colour alone is none: an object in one colour stays white.
let f_a_n_col__or_null = function(a_n_col){
    if(!a_n_col){ return null; }
    for(let n_off = 3; n_off < a_n_col.length; n_off++){
        if(a_n_col[n_off] !== a_n_col[n_off % 3]){ return a_n_col; }
    }
    return null;
};

export { f_o_baked, a_n_linear__of_byte, f_n_byte__of_linear, f_a_n_light__of_byte, f_a_n_byte__of_hex, f_a_n_col__or_null };
