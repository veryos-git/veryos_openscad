// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A kind of pattern, see kind.module.js: a paper advent calendar of two sheets of card.
//
// The front sheet carries the windows. Each one is a door: its free edge is cut but for
// bridges, tiny uncut places that hold it shut until it is torn open, and the side it
// turns on is a fold, a row of cut dashes. The back sheet is glued behind the front one
// and carries the pictures, printed or drawn by hand; it gets short cuts only, marks
// that show where each window opens. Both sheets are drawn as seen from the front, so
// one lies on the other as cut.
//
// This module is the calendar itself and its lines, in mm from the calendar's top left
// corner. The sheet of paper it lies on and its cutting files are sheet.module.js, a
// picture printed on it picture.module.js.
//
// Every dash and every piece of a cut between two bridges is a line of its own, so that
// a cutter cuts them as they are drawn.

import {
    f_o_line, f_o_arc, f_n_len, f_n_len__path, f_a_n__at, f_a_n__start, f_a_n__end, f_b_corner, f_a_o_seg__part, f_a_o_seg__real, f_o_seg__moved,
    n_ratio__logo, f_a_a_o_seg__logo_dot
} from './path.module.js';
import { f_b_covered__together } from './picture.module.js';

// What a window's s_shape and s_door can be. round: a circle where width and height are
// equal, else a rectangle with half circles for its short sides. A door is named by the
// side its hinge is on; double: two leaves, hinged left and right, cut apart down the middle.
let a_s_shape = ['rect', 'arch', 'round'];
let a_s_door = ['left', 'right', 'top', 'bottom', 'double'];

// What a calendar has of its own, beside what every project has, see sheet.module.js.
let o_setting__default = {
    // both its sheets: smaller than what a printer prints of the sheet of paper
    n_mm__calendar_x: 277,
    n_mm__calendar_y: 190,
    // the calendar's edge in the cutting files
    b_outline: true,
    n_window: 24,
    n_column: 6,
    n_mm__margin: 15,
    n_mm__window_x: 32,
    n_mm__window_y: 32,
    n_mm__corner: 2,
    // the shapes and doors the windows get, mixed by n_seed
    a_s_shape: ['rect', 'arch', 'round'],
    a_s_door: ['left', 'right', 'double'],
    n_seed: 1,
    n_mm__bridge: 0.5,
    n_mm__bridge_distance: 25,
    n_mm__dash: 3,
    n_mm__gap: 2,
    // short cuts in the back sheet that show where the windows open, for pictures drawn
    // by hand; without them the back's file cuts the calendar's edge and not the windows
    b_mark: false,
    n_mm__mark: 3,
    b_logo: true,
    // what a window has of its own instead of the grid's: a_o_window__own[n_idx] with any
    // of n_mm__x, n_mm__y, n_mm__size_x, n_mm__size_y, s_shape, s_door
    a_o_window__own: []
};
// A hinge is at least this much of its side long: on a round side it lies further in,
// where the window is that wide.
let n_ratio__hinge = 0.5;

// The logo on the back sheet: in the bottom right corner as seen from the front, and
// mirrored: it is read from behind.
let n_mm__logo_x = 12;
let n_mm__logo_edge = 4;

// Dashes about n_dash long along n_len, n_gap apart and from both ends: as many as come
// closest to n_dash and still leave the gaps.
let f_a_a_n__dash = function(n_len, n_dash, n_gap){
    let n_count = Math.max(1, Math.min(Math.round((n_len - n_gap) / (n_dash + n_gap)), Math.ceil(n_len / n_gap) - 2));
    let n_dash__fit = (n_len - (n_count + 1) * n_gap) / n_count;
    if(n_dash__fit <= 0){ return []; }
    return Array.from({ length: n_count }, function(_, n_idx){
        let n_s = n_gap + n_idx * (n_dash__fit + n_gap);
        return [n_s, n_s + n_dash__fit];
    });
};

// Where a chain of cuts stays uncut, as stretches along it: bridges n_mm__bridge wide,
// spread evenly over every stretch between two corners, one per n_mm__bridge_distance
// and one at least; none where a stretch is too short to stay a cut beside them.
let f_a_a_n__bridge = function(a_o_seg, o_setting){
    let n_mm__bridge = o_setting.n_mm__bridge;
    let a_a_n = [];
    let n_s = 0;
    let n_s__corner = 0;
    a_o_seg.forEach(function(o_seg, n_idx){
        n_s += f_n_len(o_seg);
        let o_seg__next = a_o_seg[n_idx + 1];
        if(o_seg__next && !f_b_corner(o_seg, o_seg__next)){ return; }
        let n_len = n_s - n_s__corner;
        let n_count = n_mm__bridge > 0 ? Math.min(Math.max(1, Math.round(n_len / o_setting.n_mm__bridge_distance)), Math.floor(n_len / (2 * n_mm__bridge)) - 1) : 0;
        for(let n_idx__bridge = 0; n_idx__bridge < n_count; n_idx__bridge++){
            let n_middle = n_s__corner + n_len * (n_idx__bridge + 1) / (n_count + 1);
            a_a_n.push([n_middle - n_mm__bridge / 2, n_middle + n_mm__bridge / 2]);
        }
        n_s__corner = n_s;
    });
    return a_a_n;
};
// The parts of a path that are left between the stretches a_a_n.
let f_a_a_o_seg__between = function(a_o_seg, a_a_n){
    let a_n_s = [0, ...a_a_n.flat(), f_n_len__path(a_o_seg)];
    let a_a_o_seg = [];
    for(let n_idx = 0; n_idx < a_n_s.length; n_idx += 2){
        a_a_o_seg.push(f_a_o_seg__part(a_o_seg, a_n_s[n_idx], a_n_s[n_idx + 1]));
    }
    return a_a_o_seg.filter(function(a_o_seg__part){ return a_o_seg__part.length; });
};

// The marks on the back sheet along a window's opening, a closed path: at every corner
// n_mm__mark of both edges that meet there, a third of an edge at most; a rounded corner
// between two straight edges whole; along any other curve dashes of n_mm__mark, about
// two of them apart and half the curve at most. Straight edges are marked by their
// corners only. No mark touches the next, so nothing is cut free.
let f_a_a_o_seg__mark = function(a_o_seg, n_mm__mark){
    let n_count = a_o_seg.length;
    let n_len__all = f_n_len__path(a_o_seg);
    // whether the opening turns a corner where segment n_idx starts
    let a_b_corner = a_o_seg.map(function(o_seg, n_idx){ return f_b_corner(a_o_seg[(n_idx + n_count - 1) % n_count], o_seg); });
    let f_n_leg = function(n_idx){ return Math.min(n_mm__mark, f_n_len(a_o_seg[n_idx]) / 3); };
    // stretches along the opening; one over the start begins below 0
    let a_a_n = [];
    let n_s = 0;
    a_o_seg.forEach(function(o_seg, n_idx){
        let n_len = f_n_len(o_seg);
        let b_corner__end = a_b_corner[(n_idx + 1) % n_count];
        if(a_b_corner[n_idx]){
            a_a_n.push([n_s - f_n_leg((n_idx + n_count - 1) % n_count), n_s + f_n_leg(n_idx)]);
        }
        if('n_r' in o_seg){
            let n_from = a_b_corner[n_idx] ? f_n_leg(n_idx) : 0;
            let n_free = n_len - n_from - (b_corner__end ? f_n_leg(n_idx) : 0);
            let b_smooth = !a_b_corner[n_idx] && !b_corner__end;
            let b_between_lines = [n_idx + n_count - 1, n_idx + 1].every(function(n_idx__beside){ return !('n_r' in a_o_seg[n_idx__beside % n_count]); });
            if(b_smooth && b_between_lines && n_len <= 2 * n_mm__mark){
                a_a_n.push([n_s, n_s + n_len]);
            } else {
                let n_dash = Math.max(b_smooth ? 1 : 0, Math.round(n_free / (3 * n_mm__mark)));
                let n_half = Math.min(n_mm__mark, n_free / n_dash / 2) / 2;
                for(let n_idx__dash = 0; n_idx__dash < n_dash; n_idx__dash++){
                    let n_middle = n_s + n_from + n_free * (n_idx__dash + 0.5) / n_dash;
                    a_a_n.push([n_middle - n_half, n_middle + n_half]);
                }
            }
        }
        n_s += n_len;
    });
    let a_o_seg__twice = a_o_seg.concat(a_o_seg);
    return a_a_n.map(function(a_n){
        let n_shift = a_n[0] < 0 ? n_len__all : 0;
        return f_a_o_seg__part(a_o_seg__twice, a_n[0] + n_shift, a_n[1] + n_shift);
    });
};

// A window's corner radii as it stands: top left, top right, bottom right, bottom left.
// A rectangle's corner is sharp where a hinge ends in it, and so is an arch's at its foot.
let f_a_n_r = function(o_window, o_setting){
    let n_x = o_window.n_mm__size_x;
    let n_y = o_window.n_mm__size_y;
    if(o_window.s_shape === 'round'){ return Array(4).fill(Math.min(n_x, n_y) / 2); }
    let n_top = o_window.s_shape === 'arch' ? Math.min(n_x / 2, n_y) : Math.min(o_setting.n_mm__corner, n_x / 2, n_y / 2);
    let n_bottom = Math.min(o_setting.n_mm__corner, n_x / 2, o_window.s_shape === 'arch' ? n_y - n_top : n_y / 2);
    let a_s_side__hinge = o_window.s_door === 'double' ? ['left', 'right'] : [o_window.s_door];
    return [['top', 'left'], ['top', 'right'], ['bottom', 'right'], ['bottom', 'left']].map(function(a_s_side, n_idx){
        let b_round = o_window.s_shape === 'arch' && n_idx < 2;
        let b_hinge = a_s_side.some(function(s_side){ return a_s_side__hinge.includes(s_side); });
        return !b_round && b_hinge ? 0 : (n_idx < 2 ? n_top : n_bottom);
    });
};

// A window with its door: what is cut, where it folds and what the back sheet shows of it.
//   a_a_o_seg__chain    the door's free edge, each chain one run of the knife but for its bridges
//   a_a_n__hinge        the lines the door turns on
//   a_o_seg__opening    the opening's edge, closed: free edge and hinges
//   a_a_o_seg__cut      front sheet: the chains without their bridges
//   a_a_o_seg__fold     front sheet: the hinges' dashes
//   a_a_o_seg__mark     back sheet: marks along the opening
let f_o_door = function(o_window, o_setting){
    let b_double = o_window.s_door === 'double';
    // The door is built around 0, 0 with its hinge on the left, then turned by quarter
    // turns to the hinge's side: its half size and corner radii as built.
    let n_turn = b_double ? 0 : ['left', 'top', 'right', 'bottom'].indexOf(o_window.s_door);
    let n_a = (n_turn % 2 ? o_window.n_mm__size_y : o_window.n_mm__size_x) / 2;
    let n_b = (n_turn % 2 ? o_window.n_mm__size_x : o_window.n_mm__size_y) / 2;
    let a_n_r__window = f_a_n_r(o_window, o_setting);
    let a_n_r = [0, 1, 2, 3].map(function(n_idx){ return a_n_r__window[(n_idx + n_turn) % 4]; });
    let [n_tl, n_tr, n_br, n_bl] = a_n_r;
    let a_a_n_c = [[-n_a + n_tl, -n_b + n_tl], [n_a - n_tr, -n_b + n_tr], [n_a - n_br, n_b - n_br], [-n_a + n_bl, n_b - n_bl]];
    // A corner's quarter arc, clockwise around the window, or a part of it: n_from and
    // n_to are angles along it, from 0 to PI / 2.
    let f_o_arc__corner = function(n_idx, n_from, n_to){
        let n_rad = Math.PI * (1 + n_idx / 2);
        return f_o_arc(a_a_n_c[n_idx], a_n_r[n_idx], n_rad + n_from, n_rad + n_to);
    };
    // How far inside its side a hinge lies, between corners of the radii n_r1 and n_r2: 0
    // where the side is straight for n_ratio__hinge of its length, else where the window
    // is that wide.
    let f_n_inset = function(n_r1, n_r2){
        let f_b_long = function(n_inset){
            return [n_r1, n_r2].reduce(function(n_len, n_r){
                return n_len - (n_inset < n_r ? n_r - Math.sqrt(n_r * n_r - (n_r - n_inset) * (n_r - n_inset)) : 0);
            }, 2 * n_b) >= n_ratio__hinge * 2 * n_b;
        };
        if(f_b_long(0)){ return 0; }
        let n_short = 0;
        let n_long = Math.max(n_r1, n_r2);
        for(let n_idx = 0; n_idx < 50; n_idx++){
            let n_inset = (n_short + n_long) / 2;
            if(f_b_long(n_inset)){ n_long = n_inset; } else { n_short = n_inset; }
        }
        return n_long;
    };
    // How far along a corner's arc, counted from the hinge's side, the hinge crosses it.
    let f_n_rad = function(n_r, n_inset){ return n_inset < n_r ? Math.acos((n_r - n_inset) / n_r) : Math.PI / 2; };
    let n_quarter = Math.PI / 2;

    let n_left = f_n_inset(n_tl, n_bl);
    let a_a_o_seg__chain;
    let a_a_n__hinge;
    let a_o_seg__opening;
    if(b_double){
        // two leaves: a hinge on the right too, and a cut down the middle; the cuts along
        // the top and the bottom end at it, so that no bridge lies where they meet
        let n_right = f_n_inset(n_tr, n_br);
        let a_o_seg__top_left = f_a_o_seg__real([
            f_o_arc__corner(0, f_n_rad(n_tl, n_left), n_quarter),
            f_o_line([-n_a + Math.max(n_left, n_tl), -n_b], [0, -n_b])
        ]);
        let a_o_seg__top_right = f_a_o_seg__real([
            f_o_line([0, -n_b], [n_a - Math.max(n_right, n_tr), -n_b]),
            f_o_arc__corner(1, 0, n_quarter - f_n_rad(n_tr, n_right))
        ]);
        let a_o_seg__bottom_right = f_a_o_seg__real([
            f_o_arc__corner(2, f_n_rad(n_br, n_right), n_quarter),
            f_o_line([n_a - Math.max(n_right, n_br), n_b], [0, n_b])
        ]);
        let a_o_seg__bottom_left = f_a_o_seg__real([
            f_o_line([0, n_b], [-n_a + Math.max(n_left, n_bl), n_b]),
            f_o_arc__corner(3, 0, n_quarter - f_n_rad(n_bl, n_left))
        ]);
        a_a_o_seg__chain = [a_o_seg__top_left, a_o_seg__top_right, [f_o_line([0, -n_b], [0, n_b])], a_o_seg__bottom_right, a_o_seg__bottom_left];
        a_a_n__hinge = [
            [f_a_n__start(a_o_seg__top_left), f_a_n__end(a_o_seg__bottom_left)],
            [f_a_n__end(a_o_seg__top_right), f_a_n__start(a_o_seg__bottom_right)]
        ];
        a_o_seg__opening = [
            ...a_o_seg__top_left, ...a_o_seg__top_right, f_o_line(a_a_n__hinge[1][0], a_a_n__hinge[1][1]),
            ...a_o_seg__bottom_right, ...a_o_seg__bottom_left, f_o_line(a_a_n__hinge[0][1], a_a_n__hinge[0][0])
        ];
    } else {
        // the free edge clockwise from the hinge's top end to its bottom end
        let a_o_seg__free = f_a_o_seg__real([
            f_o_arc__corner(0, f_n_rad(n_tl, n_left), n_quarter),
            f_o_line([-n_a + Math.max(n_left, n_tl), -n_b], [n_a - n_tr, -n_b]),
            f_o_arc__corner(1, 0, n_quarter),
            f_o_line([n_a, -n_b + n_tr], [n_a, n_b - n_br]),
            f_o_arc__corner(2, 0, n_quarter),
            f_o_line([n_a - n_br, n_b], [-n_a + Math.max(n_left, n_bl), n_b]),
            f_o_arc__corner(3, 0, n_quarter - f_n_rad(n_bl, n_left))
        ]);
        a_a_o_seg__chain = [a_o_seg__free];
        a_a_n__hinge = [[f_a_n__start(a_o_seg__free), f_a_n__end(a_o_seg__free)]];
        a_o_seg__opening = [...a_o_seg__free, f_o_line(a_a_n__hinge[0][1], a_a_n__hinge[0][0])];
    }

    let a_n__middle = [o_window.n_mm__x, o_window.n_mm__y];
    let f_a_o_seg__moved = function(a_o_seg){
        return a_o_seg.map(function(o_seg){ return f_o_seg__moved(o_seg, n_turn, a_n__middle); });
    };
    a_a_o_seg__chain = a_a_o_seg__chain.map(f_a_o_seg__moved);
    a_a_n__hinge = a_a_n__hinge.map(function(a_a_n){
        let o_seg = f_o_seg__moved(f_o_line(a_a_n[0], a_a_n[1]), n_turn, a_n__middle);
        return [o_seg.a_n_p, o_seg.a_n_q];
    });
    a_o_seg__opening = f_a_o_seg__moved(a_o_seg__opening);

    return {
        a_a_o_seg__chain, a_a_n__hinge, a_o_seg__opening,
        a_a_o_seg__cut: a_a_o_seg__chain.flatMap(function(a_o_seg){
            return f_a_a_o_seg__between(a_o_seg, f_a_a_n__bridge(a_o_seg, o_setting));
        }),
        a_a_o_seg__fold: a_a_n__hinge.flatMap(function(a_a_n){
            let a_o_seg = [f_o_line(a_a_n[0], a_a_n[1])];
            return f_a_a_n__dash(f_n_len(a_o_seg[0]), o_setting.n_mm__dash, o_setting.n_mm__gap).map(function(a_n){
                return f_a_o_seg__part(a_o_seg, a_n[0], a_n[1]);
            });
        }),
        a_a_o_seg__mark: f_a_a_o_seg__mark(a_o_seg__opening, o_setting.n_mm__mark)
    };
};

// Numbers from 0 to 1 that follow from n_seed (mulberry32).
let f_f_n__random = function(n_seed){
    return function(){
        n_seed = (n_seed + 0x6D2B79F5) | 0;
        let n = Math.imul(n_seed ^ (n_seed >>> 15), 1 | n_seed);
        n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
        return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
};
// n_count of the values a_v, each about as often as the others, in a mixed order.
let f_a_v__mixed = function(a_v, n_count, f_n__random){
    let a_v__mixed = Array.from({ length: n_count }, function(_, n_idx){ return a_v[n_idx % a_v.length]; });
    for(let n_idx = n_count - 1; n_idx > 0; n_idx--){
        let n_idx__other = Math.floor(f_n__random() * (n_idx + 1));
        [a_v__mixed[n_idx], a_v__mixed[n_idx__other]] = [a_v__mixed[n_idx__other], a_v__mixed[n_idx]];
    }
    return a_v__mixed;
};

// The windows: n_mm__x, n_mm__y their middle, n_mm__size_x, n_mm__size_y, s_shape,
// s_door. They stand in a grid, row by row from the top left, each in the middle of its
// cell of the calendar less the margin; a last row that is not full stands in the
// middle. What a window has of its own replaces the grid's.
let f_a_o_window = function(o_setting){
    let n_row = Math.ceil(o_setting.n_window / o_setting.n_column);
    let n_mm__cell_x = (o_setting.n_mm__calendar_x - 2 * o_setting.n_mm__margin) / o_setting.n_column;
    let n_mm__cell_y = (o_setting.n_mm__calendar_y - 2 * o_setting.n_mm__margin) / n_row;
    let f_n__random = f_f_n__random(o_setting.n_seed);
    let a_s_shape__mixed = f_a_v__mixed(o_setting.a_s_shape, o_setting.n_window, f_n__random);
    let a_s_door__mixed = f_a_v__mixed(o_setting.a_s_door, o_setting.n_window, f_n__random);
    return Array.from({ length: o_setting.n_window }, function(_, n_idx){
        let n_idx__row = Math.floor(n_idx / o_setting.n_column);
        let n_window__row = Math.min(o_setting.n_column, o_setting.n_window - n_idx__row * o_setting.n_column);
        let n_idx__column = n_idx % o_setting.n_column + (o_setting.n_column - n_window__row) / 2;
        return {
            n_mm__x: o_setting.n_mm__margin + (n_idx__column + 0.5) * n_mm__cell_x,
            n_mm__y: o_setting.n_mm__margin + (n_idx__row + 0.5) * n_mm__cell_y,
            n_mm__size_x: o_setting.n_mm__window_x,
            n_mm__size_y: o_setting.n_mm__window_y,
            s_shape: a_s_shape__mixed[n_idx],
            s_door: a_s_door__mixed[n_idx],
            ...o_setting.a_o_window__own[n_idx]
        };
    });
};

// The logo's place on the back sheet: left, top, right, bottom.
let f_a_n__logo = function(o_setting){
    let n_right = o_setting.n_mm__calendar_x - n_mm__logo_edge;
    let n_bottom = o_setting.n_mm__calendar_y - n_mm__logo_edge;
    return [n_right - n_mm__logo_x, n_bottom - n_mm__logo_x * n_ratio__logo, n_right, n_bottom];
};

// Every window's box: left, top, right, bottom.
let f_a_a_n__window_box = function(o_setting){
    return f_a_o_window(o_setting).map(function(o_window){
        return [
            o_window.n_mm__x - o_window.n_mm__size_x / 2, o_window.n_mm__y - o_window.n_mm__size_y / 2,
            o_window.n_mm__x + o_window.n_mm__size_x / 2, o_window.n_mm__y + o_window.n_mm__size_y / 2
        ];
    });
};
// What is wrong with the pictures and with the windows' places, in words. The front's
// pictures are the calendar's face: they have to cover it and its bleed. Of the back
// only what the windows show is seen: its pictures have to cover those.
let f_a_s_problem = function(o_setting){
    let a_a_n = f_a_a_n__window_box(o_setting);
    let a_s_problem = [];
    if(o_setting.a_o_picture__back.length && o_setting.b_mark){ a_s_problem.push('The marks on the back are cut into its picture: leave them out, under Cuts'); }
    let a_o_picture = o_setting.a_o_picture__front;
    if(a_o_picture.length){
        let s_picture = a_o_picture.length === 1 ? 'picture' : 'pictures';
        let n_bleed = o_setting.n_mm__bleed;
        if(!f_b_covered__together(a_o_picture, [0, 0, o_setting.n_mm__calendar_x, o_setting.n_mm__calendar_y])){
            a_s_problem.push(`The front ${s_picture} ${a_o_picture.length === 1 ? 'leaves' : 'leave'} a part of the calendar blank`);
        } else if(!f_b_covered__together(a_o_picture, [-n_bleed, -n_bleed, o_setting.n_mm__calendar_x + n_bleed, o_setting.n_mm__calendar_y + n_bleed])){
            a_s_problem.push(`The front ${s_picture} ${a_o_picture.length === 1 ? 'does' : 'do'} not reach ${n_bleed} mm over the calendar's edge all around: a cut beside the edge shows white`);
        }
    }
    a_o_picture = o_setting.a_o_picture__back;
    if(a_o_picture.length){
        // the windows whose box the back's pictures do not cover, by their numbers
        let a_n = a_a_n.map(function(a_n__box, n_idx){ return f_b_covered__together(a_o_picture, a_n__box) ? 0 : n_idx + 1; }).filter(Boolean);
        if(a_n.length){
            a_s_problem.push(`The back ${a_o_picture.length === 1 ? 'picture leaves' : 'pictures leave'} ${a_n.length === 1 ? 'window' : 'windows'} ${a_n.slice(0, 6).join(', ')}${a_n.length > 6 ? ` and ${a_n.length - 6} more` : ''} blank in part`);
        }
    }
    let f_b_overlap = function(a_n, a_n__other){
        return a_n[0] < a_n__other[2] && a_n__other[0] < a_n[2] && a_n[1] < a_n__other[3] && a_n__other[1] < a_n[3];
    };
    a_a_n.forEach(function(a_n, n_idx){
        if(a_n[0] < 0 || a_n[1] < 0 || a_n[2] > o_setting.n_mm__calendar_x || a_n[3] > o_setting.n_mm__calendar_y){
            a_s_problem.push(`Window ${n_idx + 1} reaches over the calendar's edge`);
        }
        if(o_setting.b_logo && f_b_overlap(a_n, f_a_n__logo(o_setting))){
            a_s_problem.push(`Window ${n_idx + 1} lies on the logo`);
        }
        a_a_n.slice(0, n_idx).forEach(function(a_n__other, n_idx__other){
            if(f_b_overlap(a_n, a_n__other)){ a_s_problem.push(`Windows ${n_idx__other + 1} and ${n_idx + 1} overlap`); }
        });
    });
    return a_s_problem;
};

// The lines of one sheet's cutting file, s_sheet 'front' or 'back', kind by kind in the
// file's order: s_name, s_colour and the paths a_a_o_seg; b_closed where a path ends
// where it starts. In the calendar's mm.
let f_a_o_line = function(o_setting, s_sheet){
    let n_x = o_setting.n_mm__calendar_x;
    let n_y = o_setting.n_mm__calendar_y;
    let a_o_door = f_a_o_window(o_setting).map(function(o_window){ return f_o_door(o_window, o_setting); });
    let f_a_a_o_seg = function(s_name){ return a_o_door.flatMap(function(o_door){ return o_door[s_name]; }); };
    let a_o_line = [];
    if(s_sheet === 'front'){
        a_o_line.push({ s_name: 'cut', s_colour: '#000000', a_a_o_seg: f_a_a_o_seg('a_a_o_seg__cut') });
        a_o_line.push({ s_name: 'fold', s_colour: '#0000ff', a_a_o_seg: f_a_a_o_seg('a_a_o_seg__fold') });
    } else {
        if(o_setting.b_mark){ a_o_line.push({ s_name: 'mark', s_colour: '#000000', a_a_o_seg: f_a_a_o_seg('a_a_o_seg__mark') }); }
        if(o_setting.b_logo){
            let [n_left, n_top] = f_a_n__logo(o_setting);
            a_o_line.push({ s_name: 'logo', s_colour: '#808080', a_a_o_seg: f_a_a_o_seg__logo_dot([n_left, n_top], n_mm__logo_x, true) });
        }
    }
    // last: a cutter that keeps the file's order cuts the windows before the sheet comes loose
    if(o_setting.b_outline){
        a_o_line.push({ s_name: 'outline', s_colour: '#ff0000', b_closed: true, a_a_o_seg: [[
            f_o_line([0, 0], [n_x, 0]), f_o_line([n_x, 0], [n_x, n_y]), f_o_line([n_x, n_y], [0, n_y])
        ]] });
    }
    return a_o_line;
};

// The places of the calendar a picture's point snaps to in a match, beside its corners
// and middle: of every window its middle, the corners of its box and every point where
// its opening's edge goes from one line or curve to the next.
let f_a_a_n__anchor = function(o_setting){
    return f_a_o_window(o_setting).flatMap(function(o_window){
        let n_x__half = o_window.n_mm__size_x / 2;
        let n_y__half = o_window.n_mm__size_y / 2;
        return [
            [o_window.n_mm__x, o_window.n_mm__y],
            [o_window.n_mm__x - n_x__half, o_window.n_mm__y - n_y__half], [o_window.n_mm__x + n_x__half, o_window.n_mm__y - n_y__half],
            [o_window.n_mm__x + n_x__half, o_window.n_mm__y + n_y__half], [o_window.n_mm__x - n_x__half, o_window.n_mm__y + n_y__half],
            ...f_o_door(o_window, o_setting).a_o_seg__opening.map(function(o_seg){ return f_a_n__at(o_seg, f_n_len(o_seg)); })
        ];
    });
};
// Where pictures loaded together come to lie, the first on window 1: every window's box
// and 2 mm around it.
let f_a_a_n__spot = function(o_setting){
    return f_a_a_n__window_box(o_setting).map(function(a_n){ return [a_n[0] - 2, a_n[1] - 2, a_n[2] + 2, a_n[3] + 2]; });
};

let o_kind = {
    s_kind: 'calendar',
    s_name: 'Advent calendar',
    s_noun: 'calendar',
    s_about: 'Two sheets of card: a front with windows and doors, a back behind it',
    a_o_sheet: [{ s_sheet: 'front', s_name: 'Front' }, { s_sheet: 'back', s_name: 'Back' }],
    o_setting__default,
    f_a_n__size: function(o_setting){ return [o_setting.n_mm__calendar_x, o_setting.n_mm__calendar_y]; },
    f_a_o_line,
    f_s_desc: function(s_sheet){
        return (s_sheet === 'front'
            ? 'Front sheet. Black: cut; the gaps are bridges that hold a door shut. Blue: cut, the dashes of the folds the doors turn on.'
            : 'Back sheet, as seen from the front; it is glued behind the front sheet. Black: cut, marks that show where the windows open. Grey: cut, the logo in dots, mirrored to be read from behind.')
            + ' Red: the calendar\'s edge; cut it where the calendar is smaller than the sheet.';
    },
    f_a_s_problem,
    f_a_a_n__anchor,
    f_a_a_n__spot,
    f_s_file: function(){ return 'advent_calendar'; },
    f_s_summary: function(o_setting){
        return `${o_setting.n_window} ${o_setting.n_window === 1 ? 'window' : 'windows'} · ${o_setting.n_mm__calendar_x} × ${o_setting.n_mm__calendar_y} mm`;
    }
};

export {
    a_s_shape, a_s_door, o_setting__default, n_ratio__hinge, n_mm__logo_x,
    f_a_a_n__dash, f_a_a_n__bridge, f_o_door, f_a_o_window, f_a_n__logo, f_a_s_problem, f_a_o_line, f_a_a_n__anchor, f_a_a_n__spot, o_kind
};
