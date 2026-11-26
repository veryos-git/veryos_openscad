// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A picture printed on a sheet of the calendar: where it lies, and what fitting, sizing
// and cutting it off does to that. The file itself is not in here, only its size.
//
// o_picture:
//   n_px__x, n_px__y      the file's size in pixels
//   a_n_ratio__crop       how much of the file is cut off at its left, top, right and bottom, 0 to 1
//   n_mm__x, n_mm__y      the middle of what is left, in mm from the calendar's top left corner
//   n_mm__size_x          how wide what is left is shown; its height follows, a picture is never stretched
//   n_deg                 turned around its middle, clockwise
//   b_flip_x, b_flip_y    mirrored left to right, top to bottom
//
// The picture's own frame: x and y from its middle along its sides, as it lies turned.
// Mirroring swaps what the frame shows, not the frame.

import { f_s_n } from './calendar.module.js';

let a_s_side = ['left', 'top', 'right', 'bottom'];
// No handle makes a picture smaller than this.
let n_mm__size_min = 5;

// A picture of a file's size, nothing cut off; to be fitted.
let f_o_picture = function(n_px__x, n_px__y){
    return { n_px__x, n_px__y, a_n_ratio__crop: [0, 0, 0, 0], n_mm__x: 0, n_mm__y: 0, n_mm__size_x: n_px__x, n_deg: 0, b_flip_x: false, b_flip_y: false };
};
// What is left of the file, in its pixels: left, top, width, height.
let f_a_n__px = function(o_picture){
    let [n_left, n_top, n_right, n_bottom] = o_picture.a_n_ratio__crop;
    return [n_left * o_picture.n_px__x, n_top * o_picture.n_px__y, (1 - n_left - n_right) * o_picture.n_px__x, (1 - n_top - n_bottom) * o_picture.n_px__y];
};
// Its width and height as shown, in mm.
let f_a_n__size = function(o_picture){
    let [, , n_px__x, n_px__y] = f_a_n__px(o_picture);
    return [o_picture.n_mm__size_x, o_picture.n_mm__size_x * n_px__y / n_px__x];
};
// The file's pixels per inch of print.
let f_n_dpi = function(o_picture){
    return f_a_n__px(o_picture)[2] / (o_picture.n_mm__size_x / 25.4);
};
// A point of the picture's own frame on the calendar, and a point of the calendar in the frame.
let f_a_n__calendar = function(o_picture, a_n){
    let n_rad = o_picture.n_deg * Math.PI / 180;
    return [
        o_picture.n_mm__x + a_n[0] * Math.cos(n_rad) - a_n[1] * Math.sin(n_rad),
        o_picture.n_mm__y + a_n[0] * Math.sin(n_rad) + a_n[1] * Math.cos(n_rad)
    ];
};
let f_a_n__own = function(o_picture, a_n){
    let n_rad = o_picture.n_deg * Math.PI / 180;
    let n_x = a_n[0] - o_picture.n_mm__x;
    let n_y = a_n[1] - o_picture.n_mm__y;
    return [n_x * Math.cos(n_rad) + n_y * Math.sin(n_rad), -n_x * Math.sin(n_rad) + n_y * Math.cos(n_rad)];
};
// Where a handle sits on the calendar: a_n__sign -1, 0 or 1 along the frame's x and y, so
// -1, -1 the frame's top left corner and 1, 0 the middle of its right side.
let f_a_n__handle = function(o_picture, a_n__sign){
    let [n_x, n_y] = f_a_n__size(o_picture);
    return f_a_n__calendar(o_picture, [a_n__sign[0] * n_x / 2, a_n__sign[1] * n_y / 2]);
};

// The picture in the middle of a box (left, top, right, bottom), as large as fits into
// it, or with b_cover as small as covers it.
let f_o_picture__fitted = function(o_picture, a_n__box, b_cover){
    let [n_x, n_y] = f_a_n__size(o_picture);
    let n_box_x = a_n__box[2] - a_n__box[0];
    let n_box_y = a_n__box[3] - a_n__box[1];
    let n_cos = Math.abs(Math.cos(o_picture.n_deg * Math.PI / 180));
    let n_sin = Math.abs(Math.sin(o_picture.n_deg * Math.PI / 180));
    let n_scale = b_cover
        // the box, seen in the picture's frame, lies in the picture
        ? Math.max((n_box_x * n_cos + n_box_y * n_sin) / n_x, (n_box_x * n_sin + n_box_y * n_cos) / n_y)
        // the picture, as it lies turned, lies in the box
        : Math.min(n_box_x / (n_x * n_cos + n_y * n_sin), n_box_y / (n_x * n_sin + n_y * n_cos));
    return { ...o_picture, n_mm__x: (a_n__box[0] + a_n__box[2]) / 2, n_mm__y: (a_n__box[1] + a_n__box[3]) / 2, n_mm__size_x: n_x * n_scale };
};
// Whether the picture covers a box: the box's four corners lie in it.
let f_b_covered = function(o_picture, a_n__box){
    let [n_x, n_y] = f_a_n__size(o_picture);
    return [[0, 1], [2, 1], [2, 3], [0, 3]].every(function([n_idx__x, n_idx__y]){
        let a_n = f_a_n__own(o_picture, [a_n__box[n_idx__x], a_n__box[n_idx__y]]);
        return Math.abs(a_n[0]) <= n_x / 2 + 1e-6 && Math.abs(a_n[1]) <= n_y / 2 + 1e-6;
    });
};

// The picture sized by one of its corners, a_n__sign -1 or 1 along its own x and y: the
// corner follows the pointer along the diagonal, the corner across stays where it is.
let f_o_picture__resized = function(o_picture, a_n__sign, a_n__pointer){
    let [n_x, n_y] = f_a_n__size(o_picture);
    let a_n__own = f_a_n__own(o_picture, a_n__pointer);
    // the pointer as seen from the corner across, laid on the diagonal
    let n_scale = ((a_n__own[0] + a_n__sign[0] * n_x / 2) * a_n__sign[0] * n_x + (a_n__own[1] + a_n__sign[1] * n_y / 2) * a_n__sign[1] * n_y) / (n_x * n_x + n_y * n_y);
    n_scale = Math.max(n_scale, n_mm__size_min / Math.min(n_x, n_y));
    let a_n__middle = f_a_n__calendar(o_picture, [a_n__sign[0] * n_x * (n_scale - 1) / 2, a_n__sign[1] * n_y * (n_scale - 1) / 2]);
    return { ...o_picture, n_mm__x: a_n__middle[0], n_mm__y: a_n__middle[1], n_mm__size_x: n_x * n_scale };
};
// The picture n_scale times as large around a point of the calendar: what lies at a_n
// stays there.
let f_o_picture__scaled = function(o_picture, n_scale, a_n){
    n_scale = Math.max(n_scale, n_mm__size_min / Math.min(...f_a_n__size(o_picture)));
    return {
        ...o_picture,
        n_mm__x: a_n[0] + (o_picture.n_mm__x - a_n[0]) * n_scale,
        n_mm__y: a_n[1] + (o_picture.n_mm__y - a_n[1]) * n_scale,
        n_mm__size_x: o_picture.n_mm__size_x * n_scale
    };
};

// The picture with n_ratio of the file cut off at the file's side n_idx, 0 left, 1 top,
// 2 right, 3 bottom: what is left stays where it is and as large as it is. No more is
// cut off than leaves n_mm__size_min.
let f_o_picture__cut = function(o_picture, n_idx, n_ratio){
    let n_axis = n_idx % 2;
    let n_mm__file = o_picture.n_mm__size_x / f_a_n__px(o_picture)[2] * (n_axis ? o_picture.n_px__y : o_picture.n_px__x);
    n_ratio = Math.max(0, Math.min(n_ratio, 1 - o_picture.a_n_ratio__crop[(n_idx + 2) % 4] - n_mm__size_min / n_mm__file));
    let n_mm__in = (n_ratio - o_picture.a_n_ratio__crop[n_idx]) * n_mm__file;
    // the end of the frame's axis the file's side shows at: the other one where it is mirrored
    let n_sign = (n_idx < 2 ? -1 : 1) * ((n_axis ? o_picture.b_flip_y : o_picture.b_flip_x) ? -1 : 1);
    let a_n__own = [0, 0];
    a_n__own[n_axis] = -n_sign * n_mm__in / 2;
    let a_n__middle = f_a_n__calendar(o_picture, a_n__own);
    let a_n_ratio__crop = o_picture.a_n_ratio__crop.slice();
    a_n_ratio__crop[n_idx] = n_ratio;
    return { ...o_picture, a_n_ratio__crop, n_mm__x: a_n__middle[0], n_mm__y: a_n__middle[1], n_mm__size_x: o_picture.n_mm__size_x - (n_axis ? 0 : n_mm__in) };
};
// The picture cut off at one side of its frame, s_side 'left', 'top', 'right' or
// 'bottom' as it lies, up to the pointer. Pulled outwards, what was cut off comes back.
let f_o_picture__cropped = function(o_picture, s_side, a_n__pointer){
    let n_idx__own = a_s_side.indexOf(s_side);
    let n_axis = n_idx__own % 2;
    // the file's side that shows there
    let n_idx = (n_axis ? o_picture.b_flip_y : o_picture.b_flip_x) ? (n_idx__own + 2) % 4 : n_idx__own;
    let n_mm__in = f_a_n__size(o_picture)[n_axis] / 2 - (n_idx__own < 2 ? -1 : 1) * f_a_n__own(o_picture, a_n__pointer)[n_axis];
    let n_mm__file = o_picture.n_mm__size_x / f_a_n__px(o_picture)[2] * (n_axis ? o_picture.n_px__y : o_picture.n_px__x);
    return f_o_picture__cut(o_picture, n_idx, o_picture.a_n_ratio__crop[n_idx] + n_mm__in / n_mm__file);
};

// The picture as SVG in the calendar's mm; s_href its file's address. The inner svg
// shows the part of the file that is left and hides the rest.
let f_s_picture = function(o_picture, s_href){
    let [n_x, n_y] = f_a_n__size(o_picture);
    return `<g transform="translate(${f_s_n(o_picture.n_mm__x)} ${f_s_n(o_picture.n_mm__y)}) rotate(${f_s_n(o_picture.n_deg)}) scale(${o_picture.b_flip_x ? -1 : 1} ${o_picture.b_flip_y ? -1 : 1})">`
        + `<svg x="${f_s_n(-n_x / 2)}" y="${f_s_n(-n_y / 2)}" width="${f_s_n(n_x)}" height="${f_s_n(n_y)}" viewBox="${f_a_n__px(o_picture).map(f_s_n).join(' ')}" preserveAspectRatio="none">`
        + `<image href="${s_href}" width="${o_picture.n_px__x}" height="${o_picture.n_px__y}"/></svg></g>`;
};

export {
    a_s_side, n_mm__size_min, f_o_picture, f_a_n__px, f_a_n__size, f_n_dpi, f_a_n__calendar, f_a_n__own, f_a_n__handle,
    f_o_picture__fitted, f_b_covered, f_o_picture__resized, f_o_picture__scaled, f_o_picture__cut, f_o_picture__cropped, f_s_picture
};
