// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A picture matched to the cut pattern by four points: four points of the picture are
// laid on four places of the pattern, and the rest of the picture follows the way a
// flat sheet seen at a slant does, straight lines staying straight. A photo of a
// drawing taken at a slant is put right that way, which moving, sizing and turning
// cannot do.
//
// Such a mapping, a homography, is nine numbers a_n_h, row by row: a point x, y goes to
// (h0 x + h1 y + h2) / w, (h3 x + h4 y + h5) / w with w = h6 x + h7 y + h8.

// a b of two mappings: first b, then a
let f_a_n_h__product = function(a_n_h, a_n_h__first){
    return [0, 1, 2].flatMap(function(n_row){
        return [0, 1, 2].map(function(n_col){
            return a_n_h[3 * n_row] * a_n_h__first[n_col] + a_n_h[3 * n_row + 1] * a_n_h__first[3 + n_col] + a_n_h[3 * n_row + 2] * a_n_h__first[6 + n_col];
        });
    });
};
// The mapping that takes each of four points a_a_n__from to its a_a_n__to. No three of
// either four may lie on one line, see f_s_problem__match.
let f_a_n_h = function(a_a_n__from, a_a_n__to){
    // both fours are first brought around 0 and to a size of about 1: pixels by the
    // thousand and mm by the hundred in one set of equations lose digits
    let f_a_n__frame = function(a_a_n){
        let n_x = (a_a_n[0][0] + a_a_n[1][0] + a_a_n[2][0] + a_a_n[3][0]) / 4;
        let n_y = (a_a_n[0][1] + a_a_n[1][1] + a_a_n[2][1] + a_a_n[3][1]) / 4;
        return [n_x, n_y, Math.max(...a_a_n.map(function(a_n){ return Math.hypot(a_n[0] - n_x, a_n[1] - n_y); }))];
    };
    let [n_x__from, n_y__from, n_size__from] = f_a_n__frame(a_a_n__from);
    let [n_x__to, n_y__to, n_size__to] = f_a_n__frame(a_a_n__to);
    // eight equations for h0 to h7 with h8 = 1, solved by elimination, the largest number of a column first
    let a_a_n = [];
    for(let n_idx = 0; n_idx < 4; n_idx++){
        let n_x = (a_a_n__from[n_idx][0] - n_x__from) / n_size__from;
        let n_y = (a_a_n__from[n_idx][1] - n_y__from) / n_size__from;
        let n_u = (a_a_n__to[n_idx][0] - n_x__to) / n_size__to;
        let n_v = (a_a_n__to[n_idx][1] - n_y__to) / n_size__to;
        a_a_n.push([n_x, n_y, 1, 0, 0, 0, -n_u * n_x, -n_u * n_y, n_u]);
        a_a_n.push([0, 0, 0, n_x, n_y, 1, -n_v * n_x, -n_v * n_y, n_v]);
    }
    for(let n_col = 0; n_col < 8; n_col++){
        let n_row__largest = n_col;
        for(let n_row = n_col + 1; n_row < 8; n_row++){
            if(Math.abs(a_a_n[n_row][n_col]) > Math.abs(a_a_n[n_row__largest][n_col])){ n_row__largest = n_row; }
        }
        [a_a_n[n_col], a_a_n[n_row__largest]] = [a_a_n[n_row__largest], a_a_n[n_col]];
        for(let n_row = 0; n_row < 8; n_row++){
            if(n_row === n_col){ continue; }
            let n_factor = a_a_n[n_row][n_col] / a_a_n[n_col][n_col];
            for(let n_idx = n_col; n_idx < 9; n_idx++){ a_a_n[n_row][n_idx] -= n_factor * a_a_n[n_col][n_idx]; }
        }
    }
    let a_n_h = [...a_a_n.map(function(a_n, n_idx){ return a_n[8] / a_n[n_idx]; }), 1];
    // and back out of the two frames
    return f_a_n_h__product(
        [n_size__to, 0, n_x__to, 0, n_size__to, n_y__to, 0, 0, 1],
        f_a_n_h__product(a_n_h, [1 / n_size__from, 0, -n_x__from / n_size__from, 0, 1 / n_size__from, -n_y__from / n_size__from, 0, 0, 1])
    );
};
// The w of a point: where it is 0 the mapping throws a point infinitely far, and beyond that it folds over.
let f_n_w = function(a_n_h, a_n){
    return a_n_h[6] * a_n[0] + a_n_h[7] * a_n[1] + a_n_h[8];
};
// Where a mapping takes a point.
let f_a_n__mapped = function(a_n_h, a_n){
    let n_w = f_n_w(a_n_h, a_n);
    return [(a_n_h[0] * a_n[0] + a_n_h[1] * a_n[1] + a_n_h[2]) / n_w, (a_n_h[3] * a_n[0] + a_n_h[4] * a_n[1] + a_n_h[5]) / n_w];
};

// What is wrong with a match of four points a_a_n__from to four a_a_n__to that is to
// fill the box a_n__box (left, top, right, bottom, where the a_a_n__to lie), in words;
// '' if nothing. Three points on one line leave the mapping open; points in another
// order on one side than on the other fold the picture over inside the box.
let f_s_problem__match = function(a_a_n__from, a_a_n__to, a_n__box){
    for(let a_a_n of [a_a_n__from, a_a_n__to]){
        for(let n_idx = 0; n_idx < 4; n_idx++){
            let [a_n, a_n_p, a_n_q] = a_a_n.filter(function(a_n__other, n_idx__other){ return n_idx__other !== n_idx; });
            let n_area = Math.abs((a_n_p[0] - a_n[0]) * (a_n_q[1] - a_n[1]) - (a_n_q[0] - a_n[0]) * (a_n_p[1] - a_n[1]));
            let n_len = Math.max(Math.hypot(a_n_p[0] - a_n[0], a_n_p[1] - a_n[1]), Math.hypot(a_n_q[0] - a_n[0], a_n_q[1] - a_n[1]), Math.hypot(a_n_q[0] - a_n_p[0], a_n_q[1] - a_n_p[1]));
            if(!(n_area > 0.01 * n_len * n_len)){ return 'Three of the points lie on one line, or two on one spot: the picture cannot be laid by them.'; }
        }
    }
    let a_n_h = f_a_n_h(a_a_n__to, a_a_n__from);
    let a_n_w = [...a_a_n__to, [a_n__box[0], a_n__box[1]], [a_n__box[2], a_n__box[1]], [a_n__box[2], a_n__box[3]], [a_n__box[0], a_n__box[3]]].map(function(a_n){ return f_n_w(a_n_h, a_n); });
    if(!a_n_w.every(function(n_w){ return n_w * a_n_w[0] > 0; })){
        return 'Laid by these points the picture would fold over. Are they in the same order on the picture and on the pattern?';
    }
    return '';
};

// A point, or the nearest of the places a_a_n__anchor if one lies within n_mm__reach of it.
let f_a_n__snapped = function(a_n, a_a_n__anchor, n_mm__reach){
    let a_n__nearest = a_n;
    let n_mm__nearest = n_mm__reach;
    for(let a_n__anchor of a_a_n__anchor){
        let n_mm = Math.hypot(a_n__anchor[0] - a_n[0], a_n__anchor[1] - a_n[1]);
        if(n_mm <= n_mm__nearest){
            n_mm__nearest = n_mm;
            a_n__nearest = a_n__anchor;
        }
    }
    return a_n__nearest;
};

// How many of the picture's pixels a mapping from mm to pixels puts on a mm, at a_n.
let f_n_px__per_mm = function(a_n_h, a_n){
    let a_n_p = f_a_n__mapped(a_n_h, a_n);
    let a_n_q = f_a_n__mapped(a_n_h, [a_n[0] + 1, a_n[1]]);
    let a_n_r = f_a_n__mapped(a_n_h, [a_n[0], a_n[1] + 1]);
    return Math.sqrt(Math.abs((a_n_q[0] - a_n_p[0]) * (a_n_r[1] - a_n_p[1]) - (a_n_r[0] - a_n_p[0]) * (a_n_q[1] - a_n_p[1])));
};

// A picture's pixels laid anew: a_n__rgba its four numbers per pixel, row by row,
// n_px__x wide and n_px__y high; a_n_h takes a place of the new picture to the place of
// the old one it shows, both counted in pixels from the top left corner. Every new
// pixel gets the old picture's colour at the place its middle comes from, mixed from
// the four pixels around it; where it comes from beside the old picture it stays clear.
let f_a_n__warped = function(a_n__rgba, n_px__x, n_px__y, a_n_h, n_px__x__new, n_px__y__new){
    let a_n__new = new Uint8ClampedArray(n_px__x__new * n_px__y__new * 4);
    let [n_h0, n_h1, n_h2, n_h3, n_h4, n_h5, n_h6, n_h7, n_h8] = a_n_h;
    for(let n_y = 0; n_y < n_px__y__new; n_y++){
        for(let n_x = 0; n_x < n_px__x__new; n_x++){
            let n_w = n_h6 * (n_x + 0.5) + n_h7 * (n_y + 0.5) + n_h8;
            let n_x__old = (n_h0 * (n_x + 0.5) + n_h1 * (n_y + 0.5) + n_h2) / n_w;
            let n_y__old = (n_h3 * (n_x + 0.5) + n_h4 * (n_y + 0.5) + n_h5) / n_w;
            if(!(n_x__old >= 0 && n_y__old >= 0 && n_x__old <= n_px__x && n_y__old <= n_px__y)){ continue; }
            // counted from the pixels' middles; at the picture's edge its last pixel goes on
            let n_x__left = Math.floor(n_x__old - 0.5);
            let n_y__top = Math.floor(n_y__old - 0.5);
            let n_x__part = n_x__old - 0.5 - n_x__left;
            let n_y__part = n_y__old - 0.5 - n_y__top;
            let n_r = 0, n_g = 0, n_b = 0, n_a = 0;
            for(let n_idx = 0; n_idx < 4; n_idx++){
                let n_idx__old = 4 * (Math.min(Math.max(n_y__top + (n_idx >> 1), 0), n_px__y - 1) * n_px__x + Math.min(Math.max(n_x__left + (n_idx & 1), 0), n_px__x - 1));
                // a clear pixel has no colour to give: each one counts by how solid it is
                let n_part = (n_idx & 1 ? n_x__part : 1 - n_x__part) * (n_idx >> 1 ? n_y__part : 1 - n_y__part) * a_n__rgba[n_idx__old + 3];
                n_r += n_part * a_n__rgba[n_idx__old];
                n_g += n_part * a_n__rgba[n_idx__old + 1];
                n_b += n_part * a_n__rgba[n_idx__old + 2];
                n_a += n_part;
            }
            if(n_a > 0){
                let n_idx__new = 4 * (n_y * n_px__x__new + n_x);
                a_n__new[n_idx__new] = n_r / n_a;
                a_n__new[n_idx__new + 1] = n_g / n_a;
                a_n__new[n_idx__new + 2] = n_b / n_a;
                a_n__new[n_idx__new + 3] = n_a;
            }
        }
    }
    return a_n__new;
};

export { f_a_n_h, f_n_w, f_a_n__mapped, f_s_problem__match, f_a_n__snapped, f_n_px__per_mm, f_a_n__warped };
