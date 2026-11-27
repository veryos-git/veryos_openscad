// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A picture's place: what is left of its file and how large, fitted into a box and over
// it, sized by a corner and around a point, cut off at a side by number and by the
// pointer, stretched and skewed by a side, split into pieces. Throughout, a pixel of the
// file that stays in the picture has to stay where it is on the pattern, turned,
// mirrored, stretched and skewed or not; and the SVG has to put it there too.

import {
    a_s_side, n_mm__size_min, n_deg__skew_max, f_o_picture, f_a_n__px, f_a_n__size, f_n_dpi, f_a_n__pattern, f_a_n__own, f_a_n__from_px, f_a_n__to_px, f_a_n__handle, f_a_n__handle__shown, f_a_n__handle__turn,
    f_f_b__in, f_o_picture__fitted, f_o_picture__spread, f_b_covered, f_o_picture__resized, f_o_picture__turned, f_o_picture__scaled, f_o_picture__cut, f_o_picture__cropped,
    f_o_picture__stretched, f_o_picture__skewed, f_a_o_picture__split, a_s_name__look, f_b_look, f_s_picture
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

// Where a pixel of the file lies on the pattern, reckoned here: its place in what is
// left of the file, a pixel higher than wide by the stretch, mirrored, pushed sideways
// by the skew, to the right above the middle, then turned around the picture's middle.
let f_a_n__of_px = function(o_picture, a_n__px){
    let [n_left, n_top, n_right, n_bottom] = o_picture.a_n_ratio__crop;
    let n_px__x = (1 - n_left - n_right) * o_picture.n_px__x;
    let n_px__y = (1 - n_top - n_bottom) * o_picture.n_px__y;
    let n_mm__per_px = o_picture.n_mm__size_x / n_px__x;
    let n_x = (a_n__px[0] - n_left * o_picture.n_px__x - n_px__x / 2) * n_mm__per_px * (o_picture.b_flip_x ? -1 : 1);
    let n_y = (a_n__px[1] - n_top * o_picture.n_px__y - n_px__y / 2) * n_mm__per_px * o_picture.n_ratio__stretch * (o_picture.b_flip_y ? -1 : 1);
    n_x -= n_y * Math.tan(o_picture.n_deg__skew * Math.PI / 180);
    let n_rad = o_picture.n_deg * Math.PI / 180;
    return [o_picture.n_mm__x + n_x * Math.cos(n_rad) - n_y * Math.sin(n_rad), o_picture.n_mm__y + n_x * Math.sin(n_rad) + n_y * Math.cos(n_rad)];
};
// The same from the picture's SVG: the inner svg's box and viewBox, then the group's scale, skew, turn and move.
let f_a_n__of_px__svg = function(s_svg, a_n__px){
    let [, n_x__move, n_y__move, n_deg, n_deg__skew, n_x__scale, n_y__scale] = s_svg.match(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) skewX\(([-\d.]+)\) scale\(([-\d]+) ([-\d]+)\)">/).map(Number);
    let [, n_x, n_y, n_w, n_h, s_box] = s_svg.match(/<svg x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" viewBox="([^"]+)" preserveAspectRatio="none">/);
    let [n_x__box, n_y__box, n_w__box, n_h__box] = s_box.split(' ').map(Number);
    let n_x__own = (Number(n_x) + (a_n__px[0] - n_x__box) * Number(n_w) / n_w__box) * n_x__scale;
    let n_y__own = (Number(n_y) + (a_n__px[1] - n_y__box) * Number(n_h) / n_h__box) * n_y__scale;
    // skewX: x grows with y by the angle's tangent
    n_x__own += n_y__own * Math.tan(n_deg__skew * Math.PI / 180);
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
    { ...o_picture__plain, b_flip_x: true, b_flip_y: true, a_n_ratio__crop: [0, 0.5, 0.25, 0], n_mm__x: -20.5, n_mm__y: 300 },
    { ...o_picture__plain, n_ratio__stretch: 1.25 },
    { ...o_picture__plain, n_deg__skew: 20 },
    { ...o_picture__plain, n_deg: -37, b_flip_x: true, n_ratio__stretch: 0.6, n_deg__skew: -35, a_n_ratio__crop: [0.1, 0.2, 0.3, 0.05] }
];
let a_a_n__px = [[1500, 1000], [1400, 700], [1800, 1250]];
let f_s_name = function(o_picture){
    return `turned ${o_picture.n_deg}${o_picture.b_flip_x ? ', mirrored x' : ''}${o_picture.b_flip_y ? ', mirrored y' : ''}, cut off ${o_picture.a_n_ratio__crop}, stretched ${o_picture.n_ratio__stretch}, skewed ${o_picture.n_deg__skew}`;
};

Deno.test('what is left of the file, how large it is shown and how fine', function(){
    let o_picture = a_o_picture[3];
    assert(String(f_a_n__px(o_picture).map(Math.round)) === '300,400,1800,1500', String(f_a_n__px(o_picture)));
    let [n_x, n_y] = f_a_n__size(o_picture);
    assertAlmostEquals(n_x, 120, 1e-9, 'width');
    assertAlmostEquals(n_y, 100, 1e-9, 'height');
    assertAlmostEquals(f_n_dpi(o_picture), 1800 / (120 / 25.4), 1e-9, 'pixels per inch');
    assert(String(f_a_n__px(o_picture__plain)) === '0,0,3000,2000' && String(f_a_n__size(o_picture__plain)) === '240,160', 'nothing cut off');
    // stretched to 1.25 of its height: 240 x 200, and as fine as its 2000 pixels on 200 mm are; a skew changes neither
    assert(String(f_a_n__size(a_o_picture[5])) === '240,200', String(f_a_n__size(a_o_picture[5])));
    assertAlmostEquals(f_n_dpi(a_o_picture[5]), 254, 1e-9, 'pixels per inch, stretched');
    assertAlmostEquals(f_n_dpi({ ...o_picture__plain, n_ratio__stretch: 0.5 }), 317.5, 1e-9, 'pixels per inch, pressed flat: the width tells');
    assert(String(f_a_n__size(a_o_picture[6])) === '240,160', 'skewed');
});

Deno.test('the picture\'s own frame: there and back, and where its handles sit', function(){
    for(let o_picture of a_o_picture){
        for(let a_n of [[0, 0], [10, -3], [-55.5, 80]]){
            f_assert_same_place(f_a_n__own(o_picture, f_a_n__pattern(o_picture, a_n)), a_n, f_s_name(o_picture));
        }
        f_assert_same_place(f_a_n__pattern(o_picture, [0, 0]), [o_picture.n_mm__x, o_picture.n_mm__y], 'middle');
    }
    // lying straight: the top left corner up and to the left; a quarter turned with the clock, up and to the right
    f_assert_same_place(f_a_n__handle(a_o_picture[0], [-1, -1]), [140 - 120, 95 - 80], 'corner');
    f_assert_same_place(f_a_n__handle(a_o_picture[0], [1, 0]), [140 + 120, 95], 'side');
    f_assert_same_place(f_a_n__handle(a_o_picture[1], [-1, -1]), [140 + 80, 95 - 120], 'corner, turned');
    f_assert_same_place(f_a_n__handle(a_o_picture[1], [1, 0]), [140, 95 + 120], 'side, turned');
    // skewed by 20: the top side, 80 above the middle, lies 80 tan 20 further right, the bottom side as far left; the sides' middles stay
    f_assert_same_place(f_a_n__handle(a_o_picture[6], [-1, -1]), [20 + 80 * Math.tan(20 * Math.PI / 180), 15], 'corner, skewed');
    f_assert_same_place(f_a_n__handle(a_o_picture[6], [1, 1]), [260 - 80 * Math.tan(20 * Math.PI / 180), 175], 'corner across, skewed');
    f_assert_same_place(f_a_n__handle(a_o_picture[6], [1, 0]), [260, 95], 'side, skewed');
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

Deno.test('a place of the file on the pattern, and the pattern\'s point in the file', function(){
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
    // mirrored left to right, the same point of the pattern shows the file's other half
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
            for(let s_name of ['n_deg', 'b_flip_x', 'b_flip_y', 'n_px__x', 'n_px__y', 'n_ratio__stretch', 'n_deg__skew']){ assert(o_cover[s_name] === o_picture[s_name] && o_contain[s_name] === o_picture[s_name], s_name); }
            assert(String(o_cover.a_n_ratio__crop) === String(o_picture.a_n_ratio__crop), 'what is cut off');
        }
    }
    // 3000 x 2000 over 281 x 194: the height decides; into 277 x 190: the width
    assertAlmostEquals(f_o_picture__fitted(f_o_picture(3000, 2000), [-2, -2, 279, 192], true).n_mm__size_x, 291, 1e-9, 'cover');
    assertAlmostEquals(f_o_picture__fitted(f_o_picture(3000, 2000), [0, 0, 277, 190], false).n_mm__size_x, 277, 1e-9, 'contain');
    // a quarter turned, its width stands upright: as wide as the box is high
    assertAlmostEquals(f_o_picture__fitted({ ...f_o_picture(3000, 2000), n_deg: 90 }, [0, 0, 277, 190], false).n_mm__size_x, 190, 1e-6, 'contain, a quarter turned');
});

Deno.test('spread over a box: stretched along its own two directions until it just covers the box', function(){
    for(let o_picture of a_o_picture){
        for(let a_n__box of [[-2, -2, 279, 192], [30, 40, 60, 200]]){
            let o_spread = f_o_picture__spread(o_picture, a_n__box);
            let s_name = `${f_s_name(o_picture)} over ${a_n__box}`;
            f_assert_same_place([o_spread.n_mm__x, o_spread.n_mm__y], [(a_n__box[0] + a_n__box[2]) / 2, (a_n__box[1] + a_n__box[3]) / 2], `${s_name}: middle`);
            assert(f_b_covered(o_spread, a_n__box), `${s_name}: does not cover it`);
            // neither narrower nor lower would do
            assert(!f_b_covered({ ...o_spread, n_mm__size_x: o_spread.n_mm__size_x * 0.999, n_ratio__stretch: o_spread.n_ratio__stretch / 0.999 }, a_n__box), `${s_name}: covers it with room to spare along x`);
            assert(!f_b_covered({ ...o_spread, n_ratio__stretch: o_spread.n_ratio__stretch * 0.999 }, a_n__box), `${s_name}: covers it with room to spare along y`);
            for(let s_name__same of ['n_deg', 'n_deg__skew', 'b_flip_x', 'b_flip_y', 'n_px__x', 'n_px__y']){ assert(o_spread[s_name__same] === o_picture[s_name__same], s_name__same); }
            assert(String(o_spread.a_n_ratio__crop) === String(o_picture.a_n_ratio__crop), 'what is cut off');
        }
    }
    // lying straight it is the box: 3000 x 2000 pixels on 281 x 194, a little higher than its shape
    let o_spread = f_o_picture__spread(o_picture__plain, [-2, -2, 279, 192]);
    f_assert_same_place(f_a_n__size(o_spread), [281, 194], 'the box\'s size');
    f_assert_same_place(f_a_n__handle(o_spread, [-1, -1]), [-2, -2], 'the box\'s corner');
    f_assert_same_place(f_a_n__handle(o_spread, [1, 1]), [279, 192], 'the box\'s corner across');
    assertAlmostEquals(o_spread.n_ratio__stretch, 194 / (281 * 2 / 3), 1e-12, 'stretch');
    // a quarter turned, its width stands upright: 194 wide, 281 high
    f_assert_same_place(f_a_n__size(f_o_picture__spread(a_o_picture[1], [-2, -2, 279, 192])), [194, 281], 'a quarter turned', 1e-9);
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
                let a_n__beside = f_a_n__pattern(o_picture, [f_a_n__own(o_picture, a_n__pointer)[0] + 3 * a_n__sign[1] * n_y, f_a_n__own(o_picture, a_n__pointer)[1] - 3 * a_n__sign[0] * n_x]);
                assertAlmostEquals(f_o_picture__resized(o_picture, a_n__sign, a_n__beside).n_mm__size_x, n_x * n_scale, 1e-9, `${s_name}: beside the diagonal`);
            }
            // pushed through the corner across, it stays n_mm__size_min high
            let o_small = f_o_picture__resized(o_picture, a_n__sign, f_a_n__pattern(o_picture, [-a_n__sign[0] * n_x * 5, -a_n__sign[1] * n_y * 5]));
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
            let o_cropped = f_o_picture__cropped(o_picture, s_side, f_a_n__pattern(o_picture, a_n__own));
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
            let o_out = f_o_picture__cropped(o_cropped, s_side, f_a_n__pattern(o_picture, [a_n__sign[0] * 5000, a_n__sign[1] * 5000]));
            assertAlmostEquals(o_out.a_n_ratio__crop[n_idx__file], 0, 1e-12, `${s_name}: pulled out`);
            f_assert_same_place(f_a_n__handle(o_out, [-a_n__sign[0], -a_n__sign[1]]), a_n__across, `${s_name}: pulled out, the side across`);
        });
    }
});

// The two ends of a side of the picture's frame on the pattern: the side at n_sign, -1 or 1, along the frame's axis n_axis.
let f_a_a_n__end = function(o_picture, n_axis, n_sign){
    return [-1, 1].map(function(n_sign__along){
        let a_n__sign = [0, 0];
        a_n__sign[n_axis] = n_sign;
        a_n__sign[1 - n_axis] = n_sign__along;
        return f_a_n__handle(o_picture, a_n__sign);
    });
};

Deno.test('stretched by a side: the side comes to the pointer, the side across stays, along the side nothing changes', function(){
    for(let o_picture of a_o_picture){
        let a_n__size = f_a_n__size(o_picture);
        a_s_side.forEach(function(s_side, n_idx){
            let n_axis = n_idx % 2;
            let n_sign = n_idx < 2 ? -1 : 1;
            let a_a_n__across = f_a_a_n__end(o_picture, n_axis, -n_sign);
            // the file's places that show at the ends of the side across, and in the picture's middle
            let a_a_n__px = [...a_a_n__across, [o_picture.n_mm__x, o_picture.n_mm__y]].map(function(a_n){ return f_a_n__to_px(o_picture, a_n); });
            for(let n_scale of [0.5, 1, 1.8]){
                // the pointer: that many times the picture's size from the side across, and somewhere along the side
                let a_n__own = [0, 0];
                a_n__own[n_axis] = n_sign * a_n__size[n_axis] * (n_scale - 0.5);
                a_n__own[1 - n_axis] = 7;
                let o_stretched = f_o_picture__stretched(o_picture, s_side, f_a_n__pattern(o_picture, a_n__own));
                let s_name = `${f_s_name(o_picture)}: ${s_side} ${n_scale}`;
                assertAlmostEquals(f_a_n__size(o_stretched)[n_axis], a_n__size[n_axis] * n_scale, 1e-9, `${s_name}: across the side`);
                assertAlmostEquals(f_a_n__size(o_stretched)[1 - n_axis], a_n__size[1 - n_axis], 1e-9, `${s_name}: along the side`);
                f_a_a_n__end(o_stretched, n_axis, -n_sign).forEach(function(a_n, n_idx__end){ f_assert_same_place(a_n, a_a_n__across[n_idx__end], `${s_name}: the side across`, 1e-9); });
                // the side taken lies under the pointer: its ends are as far across as the pointer is
                for(let a_n of f_a_a_n__end(o_stretched, n_axis, n_sign)){ assertAlmostEquals(f_a_n__own(o_picture, a_n)[n_axis], a_n__own[n_axis], 1e-9, `${s_name}: the side taken`); }
                // what the file shows at the side across stays there, and what was in the middle is in the middle
                f_assert_same_place(f_a_n__of_px(o_stretched, a_a_n__px[0]), a_a_n__across[0], `${s_name}: the file at the side across`, 1e-8);
                f_assert_same_place(f_a_n__of_px(o_stretched, a_a_n__px[1]), a_a_n__across[1], `${s_name}: the file at the side across`, 1e-8);
                f_assert_same_place(f_a_n__of_px(o_stretched, a_a_n__px[2]), [o_stretched.n_mm__x, o_stretched.n_mm__y], `${s_name}: the file's middle`, 1e-8);
                for(let s_name__same of ['n_deg', 'n_deg__skew', 'b_flip_x', 'b_flip_y']){ assert(o_stretched[s_name__same] === o_picture[s_name__same], `${s_name}: ${s_name__same}`); }
                assert(String(o_stretched.a_n_ratio__crop) === String(o_picture.a_n_ratio__crop), `${s_name}: what is cut off`);
            }
            // pushed through the side across: n_mm__size_min is left, and the side across stays
            let a_n__own = [0, 0];
            a_n__own[n_axis] = -n_sign * a_n__size[n_axis] * 3;
            let o_small = f_o_picture__stretched(o_picture, s_side, f_a_n__pattern(o_picture, a_n__own));
            assertAlmostEquals(f_a_n__size(o_small)[n_axis], n_mm__size_min, 1e-9, 'smallest');
            f_assert_same_place(f_a_a_n__end(o_small, n_axis, -n_sign)[0], a_a_n__across[0], 'smallest: the side across', 1e-9);
        });
    }
    // the plain picture, 240 x 160 from 20 to 260: its right side pulled to 290 makes it 270 wide around 155, its height against that 160 / 180
    let o_stretched = f_o_picture__stretched(o_picture__plain, 'right', [290, 30]);
    assert(o_stretched.n_mm__size_x === 270 && o_stretched.n_mm__x === 155 && o_stretched.n_mm__y === 95, JSON.stringify(o_stretched));
    assertAlmostEquals(o_stretched.n_ratio__stretch, 160 / 180, 1e-12, 'stretch');
});

Deno.test('skewed by a side: the side slides along itself as far as the pointer goes along it, the side across stays', function(){
    for(let o_picture of a_o_picture){
        a_s_side.forEach(function(s_side, n_idx){
            let n_axis = n_idx % 2;
            let n_sign = n_idx < 2 ? -1 : 1;
            let a_a_n__across = f_a_a_n__end(o_picture, n_axis, -n_sign);
            let a_a_n__taken = f_a_a_n__end(o_picture, n_axis, n_sign);
            let n_mm__side = Math.hypot(a_a_n__taken[1][0] - a_a_n__taken[0][0], a_a_n__taken[1][1] - a_a_n__taken[0][1]);
            let a_n__along = [(a_a_n__taken[1][0] - a_a_n__taken[0][0]) / n_mm__side, (a_a_n__taken[1][1] - a_a_n__taken[0][1]) / n_mm__side];
            let a_a_n__px = a_a_n__across.map(function(a_n){ return f_a_n__to_px(o_picture, a_n); });
            let a_n__side = [0, 0];
            a_n__side[n_axis] = n_sign;
            let a_n__middle = f_a_n__handle(o_picture, a_n__side);
            // the pointer: that far along the side from its middle, and 9 off the side, which does not count
            let f_a_n__pointer = function(n_mm){ return [a_n__middle[0] + n_mm * a_n__along[0] - 9 * a_n__along[1], a_n__middle[1] + n_mm * a_n__along[1] + 9 * a_n__along[0]]; };
            for(let n_mm of [-30, 0, 12.5]){
                let o_skewed = f_o_picture__skewed(o_picture, s_side, f_a_n__pointer(n_mm));
                let s_name = `${f_s_name(o_picture)}: ${s_side} by ${n_mm}`;
                f_a_a_n__end(o_skewed, n_axis, -n_sign).forEach(function(a_n, n_idx__end){ f_assert_same_place(a_n, a_a_n__across[n_idx__end], `${s_name}: the side across`, 1e-9); });
                f_a_a_n__end(o_skewed, n_axis, n_sign).forEach(function(a_n, n_idx__end){
                    f_assert_same_place(a_n, [a_a_n__taken[n_idx__end][0] + n_mm * a_n__along[0], a_a_n__taken[n_idx__end][1] + n_mm * a_n__along[1]], `${s_name}: the side taken`, 1e-9);
                });
                // what the file shows at the side across stays there
                a_a_n__px.forEach(function(a_n__px, n_idx__end){ f_assert_same_place(f_a_n__of_px(o_skewed, a_n__px), a_a_n__across[n_idx__end], `${s_name}: the file at the side across`, 1e-8); });
                for(let s_name__same of ['b_flip_x', 'b_flip_y']){ assert(o_skewed[s_name__same] === o_picture[s_name__same], `${s_name}: ${s_name__same}`); }
                assert(String(o_skewed.a_n_ratio__crop) === String(o_picture.a_n_ratio__crop), `${s_name}: what is cut off`);
                // top or bottom: the skew alone changes
                if(n_axis){
                    assertAlmostEquals(o_skewed.n_deg, o_picture.n_deg, 1e-9, `${s_name}: turn`);
                    f_assert_same_place(f_a_n__size(o_skewed), f_a_n__size(o_picture), `${s_name}: size`, 1e-9);
                }
            }
            // pulled far along: the sides lean to each other by n_deg__skew_max and no more, and the side across still stays
            for(let n_mm of [-5000, 5000]){
                let o_far = f_o_picture__skewed(o_picture, s_side, f_a_n__pointer(n_mm));
                let [a_n__from, a_n__to] = f_a_a_n__end(o_far, n_axis, -n_sign);
                let [a_n__corner] = f_a_a_n__end(o_far, n_axis, n_sign);
                // the corner between the side across and its neighbour: 90 less n_deg__skew_max, or 90 more
                let n_deg__corner = Math.abs(Math.atan2(
                    (a_n__to[0] - a_n__from[0]) * (a_n__corner[1] - a_n__from[1]) - (a_n__to[1] - a_n__from[1]) * (a_n__corner[0] - a_n__from[0]),
                    (a_n__to[0] - a_n__from[0]) * (a_n__corner[0] - a_n__from[0]) + (a_n__to[1] - a_n__from[1]) * (a_n__corner[1] - a_n__from[1])
                )) * 180 / Math.PI;
                assertAlmostEquals(Math.abs(n_deg__corner - 90), n_deg__skew_max, 1e-6, `${f_s_name(o_picture)}: ${s_side} pulled ${n_mm}`);
                f_assert_same_place(a_n__from, a_a_n__across[0], `${f_s_name(o_picture)}: ${s_side} pulled ${n_mm}: the side across`, 1e-8);
            }
        });
    }
    // the plain picture, 160 high: its top side 40 to the right leans its upright sides atan(40 / 160) to the right, and moves its middle by 20
    let o_skewed = f_o_picture__skewed(o_picture__plain, 'top', [180, 0]);
    assertAlmostEquals(o_skewed.n_deg__skew, Math.atan(0.25) * 180 / Math.PI, 1e-9, 'top side: skew');
    assert(o_skewed.n_deg === 0 && o_skewed.n_mm__size_x === 240 && o_skewed.n_ratio__stretch === 1 && o_skewed.n_mm__x === 160 && o_skewed.n_mm__y === 95, JSON.stringify(o_skewed));
    // its right side 30 down: top and bottom lean by atan(30 / 240), a turn; the upright sides, still upright on the pattern, lean as far against the turn
    o_skewed = f_o_picture__skewed(o_picture__plain, 'right', [260, 125]);
    assertAlmostEquals(o_skewed.n_deg, Math.atan(0.125) * 180 / Math.PI, 1e-9, 'right side: turn');
    assertAlmostEquals(o_skewed.n_deg__skew, -Math.atan(0.125) * 180 / Math.PI, 1e-9, 'right side: skew');
    f_assert_same_place(f_a_n__size(o_skewed), [2 * Math.hypot(120, 15), 160 * Math.cos(Math.atan(0.125))], 'right side: size', 1e-9);
    f_assert_same_place([o_skewed.n_mm__x, o_skewed.n_mm__y], [140, 110], 'right side: middle');
});

Deno.test('the SVG puts every pixel where the picture has it', function(){
    assert(
        f_s_picture(a_o_picture[3], 'blob:a') === '<g transform="translate(140 95) rotate(200) skewX(0) scale(1 -1)"><svg x="-60" y="-50" width="120" height="100" viewBox="300 400 1800 1500" preserveAspectRatio="none"><image href="blob:a" width="3000" height="2000"/></svg></g>',
        f_s_picture(a_o_picture[3], 'blob:a')
    );
    // stretched and skewed: the inner svg as high as the stretch makes it, the skew against SVG's own sense, which leans to the left at the top
    assert(
        f_s_picture({ ...a_o_picture[5], n_deg__skew: 20 }, 'blob:a') === '<g transform="translate(140 95) rotate(0) skewX(-20) scale(1 1)"><svg x="-120" y="-100" width="240" height="200" viewBox="0 0 3000 2000" preserveAspectRatio="none"><image href="blob:a" width="3000" height="2000"/></svg></g>',
        f_s_picture({ ...a_o_picture[5], n_deg__skew: 20 }, 'blob:a')
    );
    for(let o_picture of a_o_picture){
        let s_svg = f_s_picture(o_picture, 'blob:a');
        assert(!/NaN|undefined|Infinity/.test(s_svg), 'a number is missing');
        for(let a_n__px of [...a_a_n__px, [0, 0], [3000, 2000]]){
            f_assert_same_place(f_a_n__of_px__svg(s_svg, a_n__px), f_a_n__of_px(o_picture, a_n__px), `${f_s_name(o_picture)}: pixel ${a_n__px}`, 1e-3);
        }
    }
});

Deno.test('a point in the picture: in what is left of it, as its own frame has it', function(){
    for(let o_picture of a_o_picture){
        let [n_x, n_y] = f_a_n__size(o_picture);
        let f_b__in = f_f_b__in(o_picture);
        // points of the frame and around it, by their place in the frame
        for(let n_x__own of [-0.6, -0.49, 0, 0.3, 0.49, 0.6]){
            for(let n_y__own of [-0.6, -0.49, 0.1, 0.49, 0.6]){
                let a_n = f_a_n__pattern(o_picture, [n_x__own * n_x, n_y__own * n_y]);
                assert(f_b__in(a_n) === (Math.abs(n_x__own) < 0.5 && Math.abs(n_y__own) < 0.5), `${f_s_name(o_picture)}: ${n_x__own}, ${n_y__own}`);
            }
        }
        // the pixels of the file: those that are left are in it, those cut off are not
        let [n_px__left, n_px__top, n_px__x, n_px__y] = f_a_n__px(o_picture);
        for(let a_n__px of [[10, 10], [1500, 1100], [2990, 1990], [200, 1950], [2500, 300]]){
            let b_left = a_n__px[0] > n_px__left && a_n__px[0] < n_px__left + n_px__x && a_n__px[1] > n_px__top && a_n__px[1] < n_px__top + n_px__y;
            assert(f_b__in(f_a_n__of_px(o_picture, a_n__px)) === b_left, `${f_s_name(o_picture)}: pixel ${a_n__px}`);
        }
    }
});

Deno.test('split into pieces: each shows its part of the file where that part lay, together all that was left, row by row as the picture lies', function(){
    for(let o_picture of a_o_picture){
        let s_name = f_s_name(o_picture);
        let [n_px__left, n_px__top, n_px__x, n_px__y] = f_a_n__px(o_picture);
        let a_o_piece = f_a_o_picture__split(o_picture, 3, 2);
        assert(a_o_piece.length === 6, `${s_name}: ${a_o_piece.length} pieces`);
        let n_px__area = 0;
        a_o_piece.forEach(function(o_piece, n_idx){
            let [n_px__left__piece, n_px__top__piece, n_px__x__piece, n_px__y__piece] = f_a_n__px(o_piece);
            // a third of the width and half the height of what was left, inside it
            assertAlmostEquals(n_px__x__piece, n_px__x / 3, 1e-6, `${s_name}: piece ${n_idx}'s pixels across`);
            assertAlmostEquals(n_px__y__piece, n_px__y / 2, 1e-6, `${s_name}: piece ${n_idx}'s pixels down`);
            assert(n_px__left__piece >= n_px__left - 1e-6 && n_px__top__piece >= n_px__top - 1e-6 && n_px__left__piece + n_px__x__piece <= n_px__left + n_px__x + 1e-6 && n_px__top__piece + n_px__y__piece <= n_px__top + n_px__y + 1e-6, `${s_name}: piece ${n_idx} reaches over what was left`);
            n_px__area += n_px__x__piece * n_px__y__piece;
            // its pixels lie where the whole picture had them: its corners and its middle
            for(let [n_ratio__x, n_ratio__y] of [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0.2, 0.9]]){
                let a_n__px = [n_px__left__piece + n_ratio__x * n_px__x__piece, n_px__top__piece + n_ratio__y * n_px__y__piece];
                f_assert_same_place(f_a_n__of_px(o_piece, a_n__px), f_a_n__of_px(o_picture, a_n__px), `${s_name}: piece ${n_idx}, pixel ${a_n__px}`, 1e-8);
                f_assert_same_place(f_a_n__from_px(o_piece, a_n__px), f_a_n__of_px(o_picture, a_n__px), `${s_name}: piece ${n_idx} by the module, pixel ${a_n__px}`, 1e-8);
            }
            // row by row from the top left, as the whole picture lies: its middle in the whole's own frame
            let [n_x, n_y] = f_a_n__size(o_picture);
            let a_n__own = f_a_n__own(o_picture, [o_piece.n_mm__x, o_piece.n_mm__y]);
            assertAlmostEquals(a_n__own[0], ((n_idx % 3 + 0.5) / 3 - 0.5) * n_x, 1e-8, `${s_name}: piece ${n_idx} lies in another column`);
            assertAlmostEquals(a_n__own[1], ((Math.floor(n_idx / 3) + 0.5) / 2 - 0.5) * n_y, 1e-8, `${s_name}: piece ${n_idx} lies in another row`);
            // all else as the whole's
            for(let s_key of ['s_file', 'n_px__x', 'n_px__y', 'n_ratio__stretch', 'n_deg', 'n_deg__skew', 'b_flip_x', 'b_flip_y']){ assert(o_piece[s_key] === o_picture[s_key], `${s_name}: piece ${n_idx}'s ${s_key}`); }
        });
        // no two share a pixel: six parts of a sixth each, each inside, at six different places
        assertAlmostEquals(n_px__area, n_px__x * n_px__y, 1e-3, `${s_name}: the pieces' pixels together`);
        assert(new Set(a_o_piece.map(function(o_piece){ return f_a_n__px(o_piece).slice(0, 2).map(Math.round).join(); })).size === 6, `${s_name}: two pieces show the same part`);
    }
    // one piece is the picture itself
    let [o_same] = f_a_o_picture__split(a_o_picture[7], 1, 1);
    for(let n_idx = 0; n_idx < 4; n_idx++){ assertAlmostEquals(o_same.a_n_ratio__crop[n_idx], a_o_picture[7].a_n_ratio__crop[n_idx], 1e-12, 'one piece: cut off'); }
    f_assert_same_place([o_same.n_mm__x, o_same.n_mm__y], [a_o_picture[7].n_mm__x, a_o_picture[7].n_mm__y], 'one piece: its middle');
    // no piece smaller than the smallest a picture can be: 240 x 160 mm gives 48 by 32 at most
    assert(n_mm__size_min === 5 && f_a_o_picture__split(o_picture__plain, 100, 100).length === 48 * 32, String(f_a_o_picture__split(o_picture__plain, 100, 100).length));
    assert(f_a_o_picture__split(o_picture__plain, 0, 2).length === 2, 'none across is one across');
    // the picture handed in is left alone
    assert(String(o_picture__plain.a_n_ratio__crop) === '0,0,0,0' && o_picture__plain.n_mm__size_x === 240, 'the whole was changed');
});

Deno.test('the SVG of a piece names its file instead of holding it', function(){
    let o_picture = { ...a_o_picture[3], s_file: 'abc' };
    let s_svg = f_s_picture(o_picture, '#front_file_abc', true);
    assert(s_svg === f_s_picture(o_picture, 'x').replace('<image href="x" width="3000" height="2000"/>', '<use href="#front_file_abc"/>'), s_svg);
    assert(f_s_picture(o_picture, 'x').includes('<image href="x" width="3000" height="2000"/>'), 'without it the file\'s address');
});

Deno.test('light and colour: a filter over the picture\'s frame, its steps in their order, none for a picture as its file is', function(){
    let o_picture = a_o_picture[3];
    let s_plain = f_s_picture(o_picture, '#front_file_abc', true);
    assert(String(a_s_name__look) === 'n_ratio__light,n_ratio__contrast,n_ratio__saturation' && a_s_name__look.every(function(s_name){ return f_o_picture(10, 10)[s_name] === 1; }), 'a new picture is as its file is');
    assert(!f_b_look(o_picture) && f_s_picture(o_picture, '#front_file_abc', true, 'front_look_0') === s_plain, 'as its file is: no filter, whatever name there is for one');
    // each alone: its one step; the picture is drawn through the filter and is the same otherwise
    let f_s_step = function(n_slope, n_intercept){ return `<feComponentTransfer>${['R', 'G', 'B'].map(function(s){ return `<feFunc${s} type="linear" slope="${n_slope}" intercept="${n_intercept}"/>`; }).join('')}</feComponentTransfer>`; };
    // the frame of that picture is 120 x 100 mm around its middle; the filter reaches 1 mm further
    let s_head = '<filter id="front_look_0" filterUnits="userSpaceOnUse" x="-61" y="-51" width="122" height="102" color-interpolation-filters="sRGB">';
    for(let [s_name, n_ratio, s_step] of [
        ['n_ratio__light', 1.5, f_s_step(1.5, 0)],
        ['n_ratio__light', 0, f_s_step(0, 0)],
        // contrast turns around middle grey: 0.5 stays 0.5
        ['n_ratio__contrast', 0.5, f_s_step(0.5, 0.25)],
        ['n_ratio__contrast', 2, f_s_step(2, -0.5)],
        ['n_ratio__saturation', 0, '<feColorMatrix type="saturate" values="0"/>'],
        ['n_ratio__saturation', 1.3, '<feColorMatrix type="saturate" values="1.3"/>']
    ]){
        let o_changed = { ...o_picture, [s_name]: n_ratio };
        let s_svg = f_s_picture(o_changed, '#front_file_abc', true, 'front_look_0');
        assert(f_b_look(o_changed), `${s_name} ${n_ratio}: not as its file is`);
        assert(s_svg === `${s_head}${s_step}</filter>${s_plain.replace('<g ', '<g filter="url(#front_look_0)" ')}`, s_svg);
        // without a name for the filter: as its file is
        assert(f_s_picture(o_changed, '#front_file_abc', true) === s_plain, `${s_name}: a filter without a name`);
    }
    // all three: lightness, then contrast, then saturation
    let s_svg = f_s_picture({ ...o_picture, n_ratio__light: 1.2, n_ratio__contrast: 0.8, n_ratio__saturation: 0.5 }, '#front_file_abc', true, 'back_look_7');
    assert(s_svg.startsWith(`${s_head.replace('front_look_0', 'back_look_7')}${f_s_step(1.2, 0)}${f_s_step(0.8, 0.1)}<feColorMatrix type="saturate" values="0.5"/></filter><g filter="url(#back_look_7)" transform=`), s_svg);
    // a picture of another size, stretched: the filter follows its frame
    let o_other = { ...a_o_picture[5], n_ratio__light: 0.5 };
    let [n_x, n_y] = f_a_n__size(o_other);
    assert(f_s_picture(o_other, 'blob:a', false, 'a').startsWith(`<filter id="a" filterUnits="userSpaceOnUse" x="${-n_x / 2 - 1}" y="${-n_y / 2 - 1}" width="${n_x + 2}" height="${n_y + 2}" `), f_s_picture(o_other, 'blob:a', false, 'a'));
    // pieces of a split picture keep its light and colour
    assert(f_a_o_picture__split({ ...o_picture__plain, n_ratio__contrast: 1.4 }, 2, 2).every(function(o_piece){ return o_piece.n_ratio__contrast === 1.4 && o_piece.n_ratio__light === 1; }), 'pieces');
});
