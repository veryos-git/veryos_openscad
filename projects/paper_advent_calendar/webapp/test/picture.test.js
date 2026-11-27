// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A picture's place: what is left of its file and how large, fitted into a box and over
// it, sized by a corner and around a point, cut off at a side by number and by the
// pointer. Throughout, a pixel of the file that stays in the picture has to stay where
// it is on the calendar, turned and mirrored or not; and the SVG has to put it there too.

import {
    a_s_side, n_mm__size_min, f_o_picture, f_a_n__px, f_a_n__size, f_n_dpi, f_a_n__calendar, f_a_n__own, f_a_n__from_px, f_a_n__to_px, f_a_n__handle, f_a_n__handle__shown, f_a_n__handle__turn,
    f_o_picture__fitted, f_b_covered, f_o_picture__resized, f_o_picture__turned, f_o_picture__scaled, f_o_picture__cut, f_o_picture__cropped, f_s_picture
} from '../picture.module.js';

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertAlmostEquals = function(n_a, n_b, n_tolerance, s_message = ''){
    if(!(Math.abs(n_a - n_b) <= n_tolerance)){ throw new Error(`${s_message} ${n_a} is not ${n_b} within ${n_tolerance}`); }
};
let f_assert_same_place = function(a_n, a_n__other, s_message, n_tolerance = 1e-9){
    assert(Math.hypot(a_n[0] - a_n__other[0], a_n[1] - a_n__other[1]) <= n_tolerance, `${s_message}: ${a_n} is not ${a_n__other}`);
};

// Where a pixel of the file lies on the calendar, reckoned here: its place in what is
// left of the file, mirrored, then turned around the picture's middle.
let f_a_n__of_px = function(o_picture, a_n__px){
    let [n_left, n_top, n_right, n_bottom] = o_picture.a_n_ratio__crop;
    let n_px__x = (1 - n_left - n_right) * o_picture.n_px__x;
    let n_px__y = (1 - n_top - n_bottom) * o_picture.n_px__y;
    let n_mm__per_px = o_picture.n_mm__size_x / n_px__x;
    let n_x = (a_n__px[0] - n_left * o_picture.n_px__x - n_px__x / 2) * n_mm__per_px * (o_picture.b_flip_x ? -1 : 1);
    let n_y = (a_n__px[1] - n_top * o_picture.n_px__y - n_px__y / 2) * n_mm__per_px * (o_picture.b_flip_y ? -1 : 1);
    let n_rad = o_picture.n_deg * Math.PI / 180;
    return [o_picture.n_mm__x + n_x * Math.cos(n_rad) - n_y * Math.sin(n_rad), o_picture.n_mm__y + n_x * Math.sin(n_rad) + n_y * Math.cos(n_rad)];
};
// The same from the picture's SVG: the inner svg's box and viewBox, then the group's scale, turn and move.
let f_a_n__of_px__svg = function(s_svg, a_n__px){
    let [, n_x__move, n_y__move, n_deg, n_x__scale, n_y__scale] = s_svg.match(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d]+) ([-\d]+)\)">/).map(Number);
    let [, n_x, n_y, n_w, n_h, s_box] = s_svg.match(/<svg x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" viewBox="([^"]+)" preserveAspectRatio="none">/);
    let [n_x__box, n_y__box, n_w__box, n_h__box] = s_box.split(' ').map(Number);
    let n_x__own = (Number(n_x) + (a_n__px[0] - n_x__box) * Number(n_w) / n_w__box) * n_x__scale;
    let n_y__own = (Number(n_y) + (a_n__px[1] - n_y__box) * Number(n_h) / n_h__box) * n_y__scale;
    let n_rad = n_deg * Math.PI / 180;
    return [n_x__move + n_x__own * Math.cos(n_rad) - n_y__own * Math.sin(n_rad), n_y__move + n_x__own * Math.sin(n_rad) + n_y__own * Math.cos(n_rad)];
};

// A file of 3000 x 2000 as it lies in these ways.
let o_picture__plain = { ...f_o_picture(3000, 2000), n_mm__x: 140, n_mm__y: 95, n_mm__size_x: 240 };
let a_o_picture = [
    o_picture__plain,
    { ...o_picture__plain, n_deg: 90 },
    { ...o_picture__plain, n_deg: -37, b_flip_x: true },
    { ...o_picture__plain, n_deg: 200, b_flip_y: true, a_n_ratio__crop: [0.1, 0.2, 0.3, 0.05], n_mm__size_x: 120 },
    { ...o_picture__plain, b_flip_x: true, b_flip_y: true, a_n_ratio__crop: [0, 0.5, 0.25, 0], n_mm__x: -20.5, n_mm__y: 300 }
];
let a_a_n__px = [[1500, 1000], [1400, 700], [1800, 1250]];
let f_s_name = function(o_picture){
    return `turned ${o_picture.n_deg}${o_picture.b_flip_x ? ', mirrored x' : ''}${o_picture.b_flip_y ? ', mirrored y' : ''}, cut off ${o_picture.a_n_ratio__crop}`;
};

Deno.test('what is left of the file, how large it is shown and how fine', function(){
    let o_picture = a_o_picture[3];
    assert(String(f_a_n__px(o_picture).map(Math.round)) === '300,400,1800,1500', String(f_a_n__px(o_picture)));
    let [n_x, n_y] = f_a_n__size(o_picture);
    assertAlmostEquals(n_x, 120, 1e-9, 'width');
    assertAlmostEquals(n_y, 100, 1e-9, 'height');
    assertAlmostEquals(f_n_dpi(o_picture), 1800 / (120 / 25.4), 1e-9, 'pixels per inch');
    assert(String(f_a_n__px(o_picture__plain)) === '0,0,3000,2000' && String(f_a_n__size(o_picture__plain)) === '240,160', 'nothing cut off');
});

Deno.test('the picture\'s own frame: there and back, and where its handles sit', function(){
    for(let o_picture of a_o_picture){
        for(let a_n of [[0, 0], [10, -3], [-55.5, 80]]){
            f_assert_same_place(f_a_n__own(o_picture, f_a_n__calendar(o_picture, a_n)), a_n, f_s_name(o_picture));
        }
        f_assert_same_place(f_a_n__calendar(o_picture, [0, 0]), [o_picture.n_mm__x, o_picture.n_mm__y], 'middle');
    }
    // lying straight: the top left corner up and to the left; a quarter turned with the clock, up and to the right
    f_assert_same_place(f_a_n__handle(a_o_picture[0], [-1, -1]), [140 - 120, 95 - 80], 'corner');
    f_assert_same_place(f_a_n__handle(a_o_picture[0], [1, 0]), [140 + 120, 95], 'side');
    f_assert_same_place(f_a_n__handle(a_o_picture[1], [-1, -1]), [140 + 80, 95 - 120], 'corner, turned');
    f_assert_same_place(f_a_n__handle(a_o_picture[1], [1, 0]), [140, 95 + 120], 'side, turned');
    // the handles are the corners of what is left of the file
    for(let o_picture of a_o_picture){
        let [n_x, n_y, n_w, n_h] = f_a_n__px(o_picture);
        let n_x__sign = o_picture.b_flip_x ? -1 : 1, n_y__sign = o_picture.b_flip_y ? -1 : 1;
        f_assert_same_place(f_a_n__handle(o_picture, [-n_x__sign, -n_y__sign]), f_a_n__of_px(o_picture, [n_x, n_y]), `${f_s_name(o_picture)}: the file's top left`, 1e-9);
        f_assert_same_place(f_a_n__handle(o_picture, [n_x__sign, n_y__sign]), f_a_n__of_px(o_picture, [n_x + n_w, n_y + n_h]), `${f_s_name(o_picture)}: the file's bottom right`, 1e-9);
    }
});

Deno.test('handles shown: where they sit if that is in view, else where the view ends, every one apart from the others', function(){
    let a_a_n__sign = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, 0], [0, -1], [1, 0], [0, 1]];
    let f_a_a_n = function(o_picture, a_n__box){ return a_a_n__sign.map(function(a_n__sign){ return f_a_n__handle__shown(o_picture, a_n__sign, a_n__box); }); };
    for(let o_picture of a_o_picture){
        // all of the picture in view: nothing moves
        f_a_a_n(o_picture, [-2000, -2000, 2000, 2000]).forEach(function(a_n, n_idx){ f_assert_same_place(a_n, f_a_n__handle(o_picture, a_a_n__sign[n_idx]), `${f_s_name(o_picture)}: handle ${a_a_n__sign[n_idx]}`); });
        // a part of it, or none: every handle in the box
        for(let a_n__box of [[100, 60, 180, 110], [-50, -40, 150, 90], [130, 0, 400, 300], [600, 600, 700, 650]]){
            for(let a_n of f_a_a_n(o_picture, a_n__box)){
                assert(a_n[0] >= a_n__box[0] && a_n[0] <= a_n__box[2] && a_n[1] >= a_n__box[1] && a_n[1] <= a_n__box[3], `${f_s_name(o_picture)}: ${a_n} is not in ${a_n__box}`);
            }
        }
    }
    // the plain picture lies from 20 to 260 and from 15 to 175. A view inside it: the corners' handles in the view's corners, the sides' in the middle of its edges
    [[100, 60], [180, 60], [180, 110], [100, 110], [100, 85], [140, 60], [180, 85], [140, 110]].forEach(function(a_n, n_idx){
        f_assert_same_place(f_a_a_n(o_picture__plain, [100, 60, 180, 110])[n_idx], a_n, `a view inside it: handle ${a_a_n__sign[n_idx]}`);
    });
    // a view inside it and away from its middle: still eight places
    [[30, 20], [90, 20], [90, 60], [30, 60], [30, 40], [60, 20], [90, 40], [60, 60]].forEach(function(a_n, n_idx){
        f_assert_same_place(f_a_a_n(o_picture__plain, [30, 20, 90, 60])[n_idx], a_n, `a view away from its middle: handle ${a_a_n__sign[n_idx]}`);
    });
    // its left part out of view: the left side's handle at the view's edge, the top side's in the middle of what of the side is left, the right side's where it sits
    f_assert_same_place(f_a_n__handle__shown(o_picture__plain, [-1, 0], [100, 0, 300, 200]), [100, 95], 'left side');
    f_assert_same_place(f_a_n__handle__shown(o_picture__plain, [0, -1], [100, 0, 300, 200]), [180, 15], 'top side');
    f_assert_same_place(f_a_n__handle__shown(o_picture__plain, [1, 0], [100, 0, 300, 200]), [260, 95], 'right side');
    f_assert_same_place(f_a_n__handle__shown(o_picture__plain, [-1, -1], [100, 0, 300, 200]), [100, 15], 'top left corner');
    // a quarter turned, its top side stands at the right, at x 220 from -25 down to 215: a view from 0 to 95 shows that much of it
    f_assert_same_place(f_a_n__handle__shown(a_o_picture[1], [0, -1], [0, 0, 300, 95]), [220, 47.5], 'top side, turned');
});

Deno.test('a place of the file on the calendar, and the calendar\'s point in the file', function(){
    for(let o_picture of a_o_picture){
        for(let a_n__px of [...a_a_n__px, [0, 0], [3000, 2000], [-40, 2500.5]]){
            let a_n = f_a_n__from_px(o_picture, a_n__px);
            f_assert_same_place(a_n, f_a_n__of_px(o_picture, a_n__px), `${f_s_name(o_picture)}: pixel ${a_n__px}`);
            f_assert_same_place(f_a_n__to_px(o_picture, a_n), a_n__px, `${f_s_name(o_picture)}: pixel ${a_n__px} and back`, 1e-8);
        }
    }
    // lying straight, 240 mm for 3000 pixels: the file's middle at the picture's, a pixel 0.08 mm
    f_assert_same_place(f_a_n__to_px(o_picture__plain, [140, 95]), [1500, 1000], 'middle');
    f_assert_same_place(f_a_n__to_px(o_picture__plain, [140 + 8, 95 - 4]), [1600, 950], 'beside the middle');
    // mirrored left to right, the same point of the calendar shows the file's other half
    f_assert_same_place(f_a_n__to_px({ ...o_picture__plain, b_flip_x: true }, [140 + 8, 95 - 4]), [1400, 950], 'mirrored');
});

Deno.test('fitted: in the box\'s middle, as small as covers it or as large as fits into it', function(){
    let a_a_n__box = [[0, 0, 277, 190], [-2, -2, 279, 192], [30, 40, 60, 200]];
    for(let o_picture of a_o_picture){
        for(let a_n__box of a_a_n__box){
            let a_n__middle = [(a_n__box[0] + a_n__box[2]) / 2, (a_n__box[1] + a_n__box[3]) / 2];
            let o_cover = f_o_picture__fitted(o_picture, a_n__box, true);
            f_assert_same_place([o_cover.n_mm__x, o_cover.n_mm__y], a_n__middle, 'cover, middle');
            assert(f_b_covered(o_cover, a_n__box), `${f_s_name(o_picture)}: does not cover ${a_n__box}`);
            assert(!f_b_covered({ ...o_cover, n_mm__size_x: o_cover.n_mm__size_x * 0.999 }, a_n__box), `${f_s_name(o_picture)}: covers ${a_n__box} with room to spare`);
            let o_contain = f_o_picture__fitted(o_picture, a_n__box, false);
            f_assert_same_place([o_contain.n_mm__x, o_contain.n_mm__y], a_n__middle, 'contain, middle');
            // its corners in the box, and one of them out of it were it any larger
            let f_b_inside = function(o){
                return [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(function(a_n__sign){
                    let a_n = f_a_n__handle(o, a_n__sign);
                    return a_n[0] >= a_n__box[0] - 1e-6 && a_n[0] <= a_n__box[2] + 1e-6 && a_n[1] >= a_n__box[1] - 1e-6 && a_n[1] <= a_n__box[3] + 1e-6;
                });
            };
            assert(f_b_inside(o_contain), `${f_s_name(o_picture)}: does not fit into ${a_n__box}`);
            assert(!f_b_inside({ ...o_contain, n_mm__size_x: o_contain.n_mm__size_x * 1.001 }), `${f_s_name(o_picture)}: fits into ${a_n__box} with room to spare`);
            // nothing else changes
            for(let s_name of ['n_deg', 'b_flip_x', 'b_flip_y', 'n_px__x', 'n_px__y']){ assert(o_cover[s_name] === o_picture[s_name] && o_contain[s_name] === o_picture[s_name], s_name); }
            assert(String(o_cover.a_n_ratio__crop) === String(o_picture.a_n_ratio__crop), 'what is cut off');
        }
    }
    // 3000 x 2000 over 281 x 194: the height decides; into 277 x 190: the width
    assertAlmostEquals(f_o_picture__fitted(f_o_picture(3000, 2000), [-2, -2, 279, 192], true).n_mm__size_x, 291, 1e-9, 'cover');
    assertAlmostEquals(f_o_picture__fitted(f_o_picture(3000, 2000), [0, 0, 277, 190], false).n_mm__size_x, 277, 1e-9, 'contain');
    // a quarter turned, its width stands upright: as wide as the box is high
    assertAlmostEquals(f_o_picture__fitted({ ...f_o_picture(3000, 2000), n_deg: 90 }, [0, 0, 277, 190], false).n_mm__size_x, 190, 1e-6, 'contain, a quarter turned');
});

Deno.test('covered: every corner of the box in the picture', function(){
    assert(f_b_covered(o_picture__plain, [20, 15, 260, 175]), 'the picture\'s own box');
    assert(!f_b_covered(o_picture__plain, [19.99, 15, 260, 175]), 'a little over at the left');
    assert(!f_b_covered(o_picture__plain, [20, 15, 260, 175.01]), 'a little over at the bottom');
    assert(!f_b_covered({ ...o_picture__plain, n_deg: 5 }, [20, 15, 260, 175]), 'turned a little');
    assert(f_b_covered({ ...o_picture__plain, n_deg: 180, b_flip_x: true }, [20, 15, 260, 175]), 'turned half and mirrored');
});

Deno.test('sized by a corner: the corner across stays, the shape stays, the corner follows the pointer along the diagonal', function(){
    for(let o_picture of a_o_picture){
        let [n_x, n_y] = f_a_n__size(o_picture);
        for(let a_n__sign of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){
            let a_n__across = f_a_n__handle(o_picture, [-a_n__sign[0], -a_n__sign[1]]);
            for(let n_scale of [0.5, 1, 1.7]){
                // the pointer on the diagonal, n_scale of the way from the corner across
                let a_n__corner = f_a_n__handle(o_picture, a_n__sign);
                let a_n__pointer = [a_n__across[0] + (a_n__corner[0] - a_n__across[0]) * n_scale, a_n__across[1] + (a_n__corner[1] - a_n__across[1]) * n_scale];
                let o_resized = f_o_picture__resized(o_picture, a_n__sign, a_n__pointer);
                let s_name = `${f_s_name(o_picture)}, corner ${a_n__sign}, ${n_scale}`;
                assertAlmostEquals(o_resized.n_mm__size_x, n_x * n_scale, 1e-9, s_name);
                assertAlmostEquals(f_a_n__size(o_resized)[1], n_y * n_scale, 1e-9, s_name);
                f_assert_same_place(f_a_n__handle(o_resized, [-a_n__sign[0], -a_n__sign[1]]), a_n__across, `${s_name}: corner across`);
                f_assert_same_place(f_a_n__handle(o_resized, a_n__sign), a_n__pointer, `${s_name}: corner taken`);
                // beside the diagonal the pointer counts as far as it is along it
                let a_n__beside = f_a_n__calendar(o_picture, [f_a_n__own(o_picture, a_n__pointer)[0] + 3 * a_n__sign[1] * n_y, f_a_n__own(o_picture, a_n__pointer)[1] - 3 * a_n__sign[0] * n_x]);
                assertAlmostEquals(f_o_picture__resized(o_picture, a_n__sign, a_n__beside).n_mm__size_x, n_x * n_scale, 1e-9, `${s_name}: beside the diagonal`);
            }
            // pushed through the corner across, it stays n_mm__size_min high
            let o_small = f_o_picture__resized(o_picture, a_n__sign, f_a_n__calendar(o_picture, [-a_n__sign[0] * n_x * 5, -a_n__sign[1] * n_y * 5]));
            assertAlmostEquals(Math.min(...f_a_n__size(o_small)), n_mm__size_min, 1e-9, 'smallest');
            f_assert_same_place(f_a_n__handle(o_small, [-a_n__sign[0], -a_n__sign[1]]), a_n__across, 'smallest: corner across');
        }
    }
});

Deno.test('turned by the pointer: as far as the pointer goes around the middle, which stays; and where the handle for it is drawn', function(){
    for(let o_picture of a_o_picture){
        let a_n__middle = [o_picture.n_mm__x, o_picture.n_mm__y];
        for(let [n_deg__from, n_mm__from, n_deg__by, n_mm__to] of [[0, 100, 5, 100], [-80, 30, 0.4, 250], [170, 60, -75, 60], [20, 90, 200, 10]]){
            let f_a_n = function(n_deg, n_mm){ return [a_n__middle[0] + n_mm * Math.cos(n_deg * Math.PI / 180), a_n__middle[1] + n_mm * Math.sin(n_deg * Math.PI / 180)]; };
            let o_turned = f_o_picture__turned(o_picture, f_a_n(n_deg__from, n_mm__from), f_a_n(n_deg__from + n_deg__by, n_mm__to));
            let s_name = `${f_s_name(o_picture)}, by ${n_deg__by}`;
            // the same turn, whichever way around the number came out
            assertAlmostEquals(Math.cos((o_turned.n_deg - o_picture.n_deg - n_deg__by) * Math.PI / 180), 1, 1e-12, s_name);
            assertAlmostEquals(Math.sin((o_turned.n_deg - o_picture.n_deg - n_deg__by) * Math.PI / 180), 0, 1e-9, s_name);
            f_assert_same_place([o_turned.n_mm__x, o_turned.n_mm__y], a_n__middle, `${s_name}: middle`);
            assert(o_turned.n_mm__size_x === o_picture.n_mm__size_x && String(o_turned.a_n_ratio__crop) === String(o_picture.a_n_ratio__crop), `${s_name}: size and what is cut off`);
            // every pixel goes around the middle by as much
            for(let a_n__px of a_a_n__px){
                let a_n = f_a_n__of_px(o_picture, a_n__px);
                let n_rad = n_deg__by * Math.PI / 180;
                f_assert_same_place(f_a_n__of_px(o_turned, a_n__px), [
                    a_n__middle[0] + (a_n[0] - a_n__middle[0]) * Math.cos(n_rad) - (a_n[1] - a_n__middle[1]) * Math.sin(n_rad),
                    a_n__middle[1] + (a_n[0] - a_n__middle[0]) * Math.sin(n_rad) + (a_n[1] - a_n__middle[1]) * Math.cos(n_rad)
                ], `${s_name}: pixel ${a_n__px}`, 1e-9);
            }
        }
    }
    // the plain picture's top side lies at y 15, its middle at x 140: the handle 10 over it; into the picture where the view ends at y 10
    f_assert_same_place(f_a_n__handle__turn(o_picture__plain, [-2000, -2000, 2000, 2000], 10), [140, 5], 'over the top side');
    f_assert_same_place(f_a_n__handle__turn(o_picture__plain, [0, 10, 300, 200], 10), [140, 25], 'no room over it');
    // the top side itself out of view: from where its handle is drawn
    f_assert_same_place(f_a_n__handle__turn(o_picture__plain, [0, 40, 300, 200], 10), [140, 50], 'top side out of view');
    // a quarter turned, the top side stands at the right, x 220
    f_assert_same_place(f_a_n__handle__turn(a_o_picture[1], [-2000, -2000, 2000, 2000], 10), [230, 95], 'turned');
});

Deno.test('sized around a point: what lies there stays there', function(){
    for(let o_picture of a_o_picture){
        for(let a_n__px of a_a_n__px){
            let a_n = f_a_n__of_px(o_picture, a_n__px);
            for(let n_scale of [0.8, 1, 2.5]){
                let o_scaled = f_o_picture__scaled(o_picture, n_scale, a_n);
                assertAlmostEquals(o_scaled.n_mm__size_x, o_picture.n_mm__size_x * n_scale, 1e-9, 'size');
                f_assert_same_place(f_a_n__of_px(o_scaled, a_n__px), a_n, `${f_s_name(o_picture)}: pixel ${a_n__px} at ${n_scale}`);
            }
            // never smaller than n_mm__size_min
            let o_small = f_o_picture__scaled(o_picture, 1e-6, a_n);
            assertAlmostEquals(Math.min(...f_a_n__size(o_small)), n_mm__size_min, 1e-9, 'smallest');
            f_assert_same_place(f_a_n__of_px(o_small, a_n__px), a_n, 'smallest: the pixel');
        }
    }
});

Deno.test('cut off by number: the file\'s side, what is left stays where and as large as it is', function(){
    for(let o_picture of a_o_picture){
        let n_mm__per_px = o_picture.n_mm__size_x / f_a_n__px(o_picture)[2];
        for(let n_idx = 0; n_idx < 4; n_idx++){
            for(let n_ratio of [0, 0.07, 0.31]){
                let o_cut = f_o_picture__cut(o_picture, n_idx, n_ratio);
                let s_name = `${f_s_name(o_picture)}: ${a_s_side[n_idx]} ${n_ratio}`;
                assert(o_cut.a_n_ratio__crop[n_idx] === n_ratio, s_name);
                assert(o_cut.a_n_ratio__crop.every(function(n, n_idx__other){ return n_idx__other === n_idx || n === o_picture.a_n_ratio__crop[n_idx__other]; }), `${s_name}: another side`);
                assertAlmostEquals(o_cut.n_mm__size_x / f_a_n__px(o_cut)[2], n_mm__per_px, 1e-12, `${s_name}: mm per pixel`);
                for(let a_n__px of a_a_n__px){ f_assert_same_place(f_a_n__of_px(o_cut, a_n__px), f_a_n__of_px(o_picture, a_n__px), `${s_name}: pixel ${a_n__px}`); }
            }
            // no less than nothing, no more than leaves n_mm__size_min
            assert(f_o_picture__cut(o_picture, n_idx, -0.2).a_n_ratio__crop[n_idx] === 0, 'below 0');
            let o_all = f_o_picture__cut(o_picture, n_idx, 1);
            assertAlmostEquals(f_a_n__size(o_all)[n_idx % 2], n_mm__size_min, 1e-9, `${f_s_name(o_picture)}: all cut off at the ${a_s_side[n_idx]}`);
            for(let a_n__px of a_a_n__px){ f_assert_same_place(f_a_n__of_px(o_all, a_n__px), f_a_n__of_px(o_picture, a_n__px), 'all cut off: pixel'); }
        }
    }
});

Deno.test('cut off by the pointer: the side taken comes to the pointer, the side across stays, the rest too', function(){
    let a_a_n__sign = [[-1, 0], [0, -1], [1, 0], [0, 1]];
    for(let o_picture of a_o_picture){
        let a_n__size = f_a_n__size(o_picture);
        a_s_side.forEach(function(s_side, n_idx){
            let n_axis = n_idx % 2;
            let a_n__sign = a_a_n__sign[n_idx];
            let a_n__across = f_a_n__handle(o_picture, [-a_n__sign[0], -a_n__sign[1]]);
            // a quarter of the way in from the side, and somewhere along it
            let a_n__own = [a_n__sign[0] * a_n__size[0] / 4, a_n__sign[1] * a_n__size[1] / 4];
            a_n__own[1 - n_axis] = 7;
            let o_cropped = f_o_picture__cropped(o_picture, s_side, f_a_n__calendar(o_picture, a_n__own));
            let s_name = `${f_s_name(o_picture)}: ${s_side}`;
            assertAlmostEquals(f_a_n__own(o_picture, f_a_n__handle(o_cropped, a_n__sign))[n_axis], a_n__own[n_axis], 1e-9, `${s_name}: the side taken`);
            f_assert_same_place(f_a_n__handle(o_cropped, [-a_n__sign[0], -a_n__sign[1]]), a_n__across, `${s_name}: the side across`);
            assertAlmostEquals(f_a_n__size(o_cropped)[n_axis], a_n__size[n_axis] * 0.75, 1e-9, `${s_name}: three quarters left`);
            assertAlmostEquals(f_a_n__size(o_cropped)[1 - n_axis], a_n__size[1 - n_axis], 1e-9, `${s_name}: the other way`);
            for(let a_n__px of a_a_n__px){ f_assert_same_place(f_a_n__of_px(o_cropped, a_n__px), f_a_n__of_px(o_picture, a_n__px), `${s_name}: pixel ${a_n__px}`); }
            // one side of the file alone is cut: the one that shows there
            let n_idx__file = (n_axis ? o_picture.b_flip_y : o_picture.b_flip_x) ? (n_idx + 2) % 4 : n_idx;
            o_cropped.a_n_ratio__crop.forEach(function(n_ratio, n_idx__side){
                assert((n_ratio > o_picture.a_n_ratio__crop[n_idx__side] + 1e-9) === (n_idx__side === n_idx__file), `${s_name}: the file's ${a_s_side[n_idx__side]}`);
            });
            // pulled far out, all the file has at that side is back, and no more
            let o_out = f_o_picture__cropped(o_cropped, s_side, f_a_n__calendar(o_picture, [a_n__sign[0] * 5000, a_n__sign[1] * 5000]));
            assertAlmostEquals(o_out.a_n_ratio__crop[n_idx__file], 0, 1e-12, `${s_name}: pulled out`);
            f_assert_same_place(f_a_n__handle(o_out, [-a_n__sign[0], -a_n__sign[1]]), a_n__across, `${s_name}: pulled out, the side across`);
        });
    }
});

Deno.test('the SVG puts every pixel where the picture has it', function(){
    assert(
        f_s_picture(a_o_picture[3], 'blob:a') === '<g transform="translate(140 95) rotate(200) scale(1 -1)"><svg x="-60" y="-50" width="120" height="100" viewBox="300 400 1800 1500" preserveAspectRatio="none"><image href="blob:a" width="3000" height="2000"/></svg></g>',
        f_s_picture(a_o_picture[3], 'blob:a')
    );
    for(let o_picture of a_o_picture){
        let s_svg = f_s_picture(o_picture, 'blob:a');
        assert(!/NaN|undefined|Infinity/.test(s_svg), 'a number is missing');
        for(let a_n__px of [...a_a_n__px, [0, 0], [3000, 2000]]){
            f_assert_same_place(f_a_n__of_px__svg(s_svg, a_n__px), f_a_n__of_px(o_picture, a_n__px), `${f_s_name(o_picture)}: pixel ${a_n__px}`, 1e-3);
        }
    }
});
