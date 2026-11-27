// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A picture printed on a sheet of the calendar: where it lies, and what fitting, sizing
// and cutting it off does to that. The file itself is not in here, only its size.
//
// o_picture:
//   n_px__x, n_px__y      the file's size in pixels
//   a_n_ratio__crop       how much of the file is cut off at its left, top, right and bottom, 0 to 1
//   n_mm__x, n_mm__y      the middle of what is left, in mm from the calendar's top left corner
//   n_mm__size_x          how wide what is left is shown; its height follows from the file's shape and the stretch
//   n_ratio__stretch      stretched: its height as a multiple of the height the file's shape gives, 1 as the file is
//   n_deg                 turned around its middle, clockwise
//   n_deg__skew           skewed: its upright sides lean by this, to the right at the top; top and bottom lie as before
//   b_flip_x, b_flip_y    mirrored left to right, top to bottom
//
// The picture's own frame: x and y from its middle, as it lies turned: x along its top
// side, y the distance from top to bottom, which a skew leaves as it is.
// Mirroring swaps what the frame shows, not the frame.

import { f_s_n } from './calendar.module.js';

let a_s_side = ['left', 'top', 'right', 'bottom'];
// No handle makes a picture smaller than this.
let n_mm__size_min = 5;
// No handle skews a picture further than this.
let n_deg__skew_max = 80;

// A picture of a file's size, nothing cut off; to be fitted.
let f_o_picture = function(n_px__x, n_px__y){
    return { n_px__x, n_px__y, a_n_ratio__crop: [0, 0, 0, 0], n_mm__x: 0, n_mm__y: 0, n_mm__size_x: n_px__x, n_ratio__stretch: 1, n_deg: 0, n_deg__skew: 0, b_flip_x: false, b_flip_y: false };
};
// What is left of the file, in its pixels: left, top, width, height.
let f_a_n__px = function(o_picture){
    let [n_left, n_top, n_right, n_bottom] = o_picture.a_n_ratio__crop;
    return [n_left * o_picture.n_px__x, n_top * o_picture.n_px__y, (1 - n_left - n_right) * o_picture.n_px__x, (1 - n_top - n_bottom) * o_picture.n_px__y];
};
// Its width and height as shown, in mm.
let f_a_n__size = function(o_picture){
    let [, , n_px__x, n_px__y] = f_a_n__px(o_picture);
    return [o_picture.n_mm__size_x, o_picture.n_mm__size_x * n_px__y / n_px__x * o_picture.n_ratio__stretch];
};
// How large a pixel of the file is shown along the picture's x and y, in mm: the same
// along both unless the picture is stretched.
let f_a_n__mm_per_px = function(o_picture){
    let [, , n_px__x, n_px__y] = f_a_n__px(o_picture);
    let [n_x, n_y] = f_a_n__size(o_picture);
    return [n_x / n_px__x, n_y / n_px__y];
};
// The file's pixels per inch of print; of a stretched picture the fewer, along the way it is stretched more.
let f_n_dpi = function(o_picture){
    return 25.4 / Math.max(...f_a_n__mm_per_px(o_picture));
};
// A point of the picture's own frame on the calendar, and a point of the calendar in the frame.
let f_a_n__calendar = function(o_picture, a_n){
    let n_rad = o_picture.n_deg * Math.PI / 180;
    // skewed: the further up in the frame, the further to the right
    let n_x = a_n[0] - a_n[1] * Math.tan(o_picture.n_deg__skew * Math.PI / 180);
    return [
        o_picture.n_mm__x + n_x * Math.cos(n_rad) - a_n[1] * Math.sin(n_rad),
        o_picture.n_mm__y + n_x * Math.sin(n_rad) + a_n[1] * Math.cos(n_rad)
    ];
};
let f_a_n__own = function(o_picture, a_n){
    let n_rad = o_picture.n_deg * Math.PI / 180;
    let n_x = a_n[0] - o_picture.n_mm__x;
    let n_y = a_n[1] - o_picture.n_mm__y;
    let n_y__own = -n_x * Math.sin(n_rad) + n_y * Math.cos(n_rad);
    return [n_x * Math.cos(n_rad) + n_y * Math.sin(n_rad) + n_y__own * Math.tan(o_picture.n_deg__skew * Math.PI / 180), n_y__own];
};
// Where a place of the file, given in its pixels from its top left corner, lies on the
// calendar; and which place of the file lies at a point of the calendar.
let f_a_n__from_px = function(o_picture, a_n__px){
    let [n_x, n_y, n_px__x, n_px__y] = f_a_n__px(o_picture);
    let [n_mm__per_px_x, n_mm__per_px_y] = f_a_n__mm_per_px(o_picture);
    return f_a_n__calendar(o_picture, [
        (a_n__px[0] - n_x - n_px__x / 2) * n_mm__per_px_x * (o_picture.b_flip_x ? -1 : 1),
        (a_n__px[1] - n_y - n_px__y / 2) * n_mm__per_px_y * (o_picture.b_flip_y ? -1 : 1)
    ]);
};
let f_a_n__to_px = function(o_picture, a_n){
    let [n_x, n_y, n_px__x, n_px__y] = f_a_n__px(o_picture);
    let [n_mm__per_px_x, n_mm__per_px_y] = f_a_n__mm_per_px(o_picture);
    let a_n__own = f_a_n__own(o_picture, a_n);
    return [
        n_x + n_px__x / 2 + a_n__own[0] / n_mm__per_px_x * (o_picture.b_flip_x ? -1 : 1),
        n_y + n_px__y / 2 + a_n__own[1] / n_mm__per_px_y * (o_picture.b_flip_y ? -1 : 1)
    ];
};
// Where a handle sits on the calendar: a_n__sign -1, 0 or 1 along the frame's x and y, so
// -1, -1 the frame's top left corner and 1, 0 the middle of its right side.
let f_a_n__handle = function(o_picture, a_n__sign){
    let [n_x, n_y] = f_a_n__size(o_picture);
    return f_a_n__calendar(o_picture, [a_n__sign[0] * n_x / 2, a_n__sign[1] * n_y / 2]);
};
// Where a handle is drawn while no more of the calendar is in view than a box, left, top,
// right, bottom: a corner's as near to the corner as the box reaches; a side's in the
// middle of what of the side lies along the box, and from there as near as the box
// reaches. A handle of a picture that is in view as a whole is drawn where it sits.
let f_a_n__handle__shown = function(o_picture, a_n__sign, a_n__box){
    let f_a_n__in = function(a_n){
        return a_n.map(function(n, n_idx){ return Math.min(Math.max(n, a_n__box[n_idx]), a_n__box[n_idx + 2]); });
    };
    if(!a_n__sign.includes(0)){ return f_a_n__in(f_a_n__handle(o_picture, a_n__sign)); }
    // the side from its one end to its other, and how far along it the box's corners lie: 0 at the one end, 1 at the other
    let a_n__from = f_a_n__handle(o_picture, a_n__sign.map(function(n){ return n || -1; }));
    let a_n__to = f_a_n__handle(o_picture, a_n__sign.map(function(n){ return n || 1; }));
    let a_n__side = [a_n__to[0] - a_n__from[0], a_n__to[1] - a_n__from[1]];
    let a_n_part = [[0, 1], [2, 1], [2, 3], [0, 3]].map(function([n_idx__x, n_idx__y]){
        let n_part = ((a_n__box[n_idx__x] - a_n__from[0]) * a_n__side[0] + (a_n__box[n_idx__y] - a_n__from[1]) * a_n__side[1]) / (a_n__side[0] * a_n__side[0] + a_n__side[1] * a_n__side[1]);
        return Math.min(Math.max(n_part, 0), 1);
    });
    let n_part = (Math.min(...a_n_part) + Math.max(...a_n_part)) / 2;
    return f_a_n__in([a_n__from[0] + n_part * a_n__side[0], a_n__from[1] + n_part * a_n__side[1]]);
};
// Where the handle that turns the picture is drawn: n_mm from where the top side's
// handle is drawn, straight out of the frame; into the frame where that is out of view.
let f_a_n__handle__turn = function(o_picture, a_n__box, n_mm){
    let a_n = f_a_n__handle__shown(o_picture, [0, -1], a_n__box);
    let n_rad = o_picture.n_deg * Math.PI / 180;
    let a_n__out = [a_n[0] + n_mm * Math.sin(n_rad), a_n[1] - n_mm * Math.cos(n_rad)];
    let b_in = a_n__out[0] >= a_n__box[0] && a_n__out[1] >= a_n__box[1] && a_n__out[0] <= a_n__box[2] && a_n__out[1] <= a_n__box[3];
    return b_in ? a_n__out : [2 * a_n[0] - a_n__out[0], 2 * a_n[1] - a_n__out[1]];
};

// The picture shown n_x by n_y mm, stretched as that takes.
let f_o_picture__sized = function(o_picture, n_x, n_y){
    let [, , n_px__x, n_px__y] = f_a_n__px(o_picture);
    return { ...o_picture, n_mm__size_x: n_x, n_ratio__stretch: n_y / n_x * n_px__x / n_px__y };
};
// How far a box of n_x by n_y around 0 reaches along x and y once f_a_n has laid its
// corners anew: two neighbouring corners tell, the other two lie as far the other way.
let f_a_n__reach = function(n_x, n_y, f_a_n){
    let a_a_n = [f_a_n([n_x / 2, n_y / 2]), f_a_n([n_x / 2, -n_y / 2])];
    return [0, 1].map(function(n_axis){ return Math.max(Math.abs(a_a_n[0][n_axis]), Math.abs(a_a_n[1][n_axis])); });
};
// The picture in the middle of a box (left, top, right, bottom), as large as fits into
// it, or with b_cover as small as covers it.
let f_o_picture__fitted = function(o_picture, a_n__box, b_cover){
    let [n_x, n_y] = f_a_n__size(o_picture);
    let n_box_x = a_n__box[2] - a_n__box[0];
    let n_box_y = a_n__box[3] - a_n__box[1];
    let o_middle = { ...o_picture, n_mm__x: 0, n_mm__y: 0 };
    let n_scale;
    if(b_cover){
        // the box, seen in the picture's frame, lies in the picture
        let a_n = f_a_n__reach(n_box_x, n_box_y, function(a_n){ return f_a_n__own(o_middle, a_n); });
        n_scale = Math.max(2 * a_n[0] / n_x, 2 * a_n[1] / n_y);
    } else {
        // the picture, as it lies turned and skewed, lies in the box
        let a_n = f_a_n__reach(n_x, n_y, function(a_n){ return f_a_n__calendar(o_middle, a_n); });
        n_scale = Math.min(n_box_x / (2 * a_n[0]), n_box_y / (2 * a_n[1]));
    }
    return { ...o_picture, n_mm__x: (a_n__box[0] + a_n__box[2]) / 2, n_mm__y: (a_n__box[1] + a_n__box[3]) / 2, n_mm__size_x: n_x * n_scale };
};
// The picture in the middle of a box, stretched along its own two directions until it
// just covers the box: lying straight it is the box, and all of it shows.
let f_o_picture__spread = function(o_picture, a_n__box){
    let o_middle = { ...o_picture, n_mm__x: 0, n_mm__y: 0 };
    let a_n = f_a_n__reach(a_n__box[2] - a_n__box[0], a_n__box[3] - a_n__box[1], function(a_n){ return f_a_n__own(o_middle, a_n); });
    return { ...f_o_picture__sized(o_picture, 2 * a_n[0], 2 * a_n[1]), n_mm__x: (a_n__box[0] + a_n__box[2]) / 2, n_mm__y: (a_n__box[1] + a_n__box[3]) / 2 };
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
// The picture turned around its middle by as much as the pointer goes around it, from
// a_n__from to a_n__to: far from the middle a pointer turns it by little.
let f_o_picture__turned = function(o_picture, a_n__from, a_n__to){
    let f_n_rad = function(a_n){ return Math.atan2(a_n[1] - o_picture.n_mm__y, a_n[0] - o_picture.n_mm__x); };
    return { ...o_picture, n_deg: o_picture.n_deg + (f_n_rad(a_n__to) - f_n_rad(a_n__from)) * 180 / Math.PI };
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
    let n_mm__file = f_a_n__mm_per_px(o_picture)[n_axis] * (n_axis ? o_picture.n_px__y : o_picture.n_px__x);
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
    let n_mm__file = f_a_n__mm_per_px(o_picture)[n_axis] * (n_axis ? o_picture.n_px__y : o_picture.n_px__x);
    return f_o_picture__cut(o_picture, n_idx, o_picture.a_n_ratio__crop[n_idx] + n_mm__in / n_mm__file);
};

// The picture stretched by one side of its frame, s_side 'left', 'top', 'right' or
// 'bottom' as it lies: the side follows the pointer, the side across stays where it is,
// and along the side nothing changes. No smaller than n_mm__size_min.
let f_o_picture__stretched = function(o_picture, s_side, a_n__pointer){
    let n_idx = a_s_side.indexOf(s_side);
    let n_axis = n_idx % 2;
    let n_sign = n_idx < 2 ? -1 : 1;
    let a_n__size = f_a_n__size(o_picture);
    let n_mm = Math.max(n_mm__size_min, a_n__size[n_axis] / 2 + n_sign * f_a_n__own(o_picture, a_n__pointer)[n_axis]);
    let a_n__own = [0, 0];
    a_n__own[n_axis] = n_sign * (n_mm - a_n__size[n_axis]) / 2;
    let a_n__middle = f_a_n__calendar(o_picture, a_n__own);
    a_n__size[n_axis] = n_mm;
    return { ...f_o_picture__sized(o_picture, a_n__size[0], a_n__size[1]), n_mm__x: a_n__middle[0], n_mm__y: a_n__middle[1] };
};
// The picture with its frame laid anew: its middle, and from there the way to the
// middle of its right side and to the middle of its bottom side. Turn, size, stretch
// and skew follow from these.
let f_o_picture__framed = function(o_picture, a_n__middle, a_n__right, a_n__bottom){
    let n_rad = Math.atan2(a_n__right[1], a_n__right[0]);
    // the way to the bottom side as the turned frame has it: sideways by the skew, down by half the height
    let n_x = a_n__bottom[0] * Math.cos(n_rad) + a_n__bottom[1] * Math.sin(n_rad);
    let n_y = -a_n__bottom[0] * Math.sin(n_rad) + a_n__bottom[1] * Math.cos(n_rad);
    // the turn as the number nearest to the one the picture had: 200 stays 200, not -160
    let n_deg = n_rad * 180 / Math.PI;
    return {
        ...f_o_picture__sized(o_picture, 2 * Math.hypot(a_n__right[0], a_n__right[1]), 2 * n_y),
        n_mm__x: a_n__middle[0], n_mm__y: a_n__middle[1],
        n_deg: n_deg + 360 * Math.round((o_picture.n_deg - n_deg) / 360),
        n_deg__skew: Math.atan2(-n_x, n_y) * 180 / Math.PI
    };
};
// The picture skewed by one side of its frame: the side slides along itself as far as
// the pointer goes along it, the side across stays where it is. Top or bottom: the
// upright sides lean, n_deg__skew alone changes. Left or right: top and bottom lean,
// which in the picture's numbers is a turn, a skew against it and another size at once.
// The sides lean no further to each other than n_deg__skew_max.
let f_o_picture__skewed = function(o_picture, s_side, a_n__pointer){
    let n_idx = a_s_side.indexOf(s_side);
    let n_axis = n_idx % 2;
    let n_sign = n_idx < 2 ? -1 : 1;
    let [n_x, n_y] = f_a_n__size(o_picture);
    let o_middle = { ...o_picture, n_mm__x: 0, n_mm__y: 0 };
    // from the picture's middle to the middle of its right side and of its bottom side
    let a_a_n = [f_a_n__calendar(o_middle, [n_x / 2, 0]), f_a_n__calendar(o_middle, [0, n_y / 2])];
    // of these two the way across to the side taken, or away from it, and the way the side runs, 1 long
    let a_n__across = a_a_n[n_axis];
    let n_mm__side = Math.hypot(a_a_n[1 - n_axis][0], a_a_n[1 - n_axis][1]);
    let a_n__along = [a_a_n[1 - n_axis][0] / n_mm__side, a_a_n[1 - n_axis][1] / n_mm__side];
    // how far along the side the pointer is from the side's middle
    let n_mm = (a_n__pointer[0] - o_picture.n_mm__x - n_sign * a_n__across[0]) * a_n__along[0] + (a_n__pointer[1] - o_picture.n_mm__y - n_sign * a_n__across[1]) * a_n__along[1];
    // how far the way across leans along the side: now, and at most
    let n_lean = a_n__across[0] * a_n__along[0] + a_n__across[1] * a_n__along[1];
    let n_lean__max = Math.abs(a_n__across[0] * a_n__along[1] - a_n__across[1] * a_n__along[0]) * Math.tan(n_deg__skew_max * Math.PI / 180);
    // the side's middle goes with the pointer, the picture's middle half as far
    let n_mm__half = n_sign * (Math.min(Math.max(n_lean + n_sign * n_mm / 2, -n_lean__max), n_lean__max) - n_lean);
    a_a_n[n_axis] = [a_n__across[0] + n_sign * n_mm__half * a_n__along[0], a_n__across[1] + n_sign * n_mm__half * a_n__along[1]];
    return f_o_picture__framed(o_picture, [o_picture.n_mm__x + n_mm__half * a_n__along[0], o_picture.n_mm__y + n_mm__half * a_n__along[1]], a_a_n[0], a_a_n[1]);
};

// The picture as SVG in the calendar's mm; s_href its file's address. The inner svg
// shows the part of the file that is left, stretched to its size, and hides the rest.
let f_s_picture = function(o_picture, s_href){
    let [n_x, n_y] = f_a_n__size(o_picture);
    return `<g transform="translate(${f_s_n(o_picture.n_mm__x)} ${f_s_n(o_picture.n_mm__y)}) rotate(${f_s_n(o_picture.n_deg)}) skewX(${f_s_n(-o_picture.n_deg__skew)}) scale(${o_picture.b_flip_x ? -1 : 1} ${o_picture.b_flip_y ? -1 : 1})">`
        + `<svg x="${f_s_n(-n_x / 2)}" y="${f_s_n(-n_y / 2)}" width="${f_s_n(n_x)}" height="${f_s_n(n_y)}" viewBox="${f_a_n__px(o_picture).map(f_s_n).join(' ')}" preserveAspectRatio="none">`
        + `<image href="${s_href}" width="${o_picture.n_px__x}" height="${o_picture.n_px__y}"/></svg></g>`;
};

export {
    a_s_side, n_mm__size_min, n_deg__skew_max, f_o_picture, f_a_n__px, f_a_n__size, f_n_dpi, f_a_n__calendar, f_a_n__own, f_a_n__from_px, f_a_n__to_px, f_a_n__handle, f_a_n__handle__shown, f_a_n__handle__turn,
    f_o_picture__fitted, f_o_picture__spread, f_b_covered, f_o_picture__resized, f_o_picture__turned, f_o_picture__scaled, f_o_picture__cut, f_o_picture__cropped,
    f_o_picture__stretched, f_o_picture__skewed, f_s_picture
};
