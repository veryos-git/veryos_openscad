// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The doors of every shape and hinge side: the opening closed and in its window's box,
// hinges long enough, cuts and bridges on the free edge, folds on the hinges, the back
// sheet's marks on the same opening. The grid, the mix, a window's own values, the
// logo, and the SVGs read back by a path reader of their own.

import {
    a_s_shape, a_s_door, o_setting__default, n_ratio__hinge,
    f_n_len, f_n_len__path, f_a_n__at, f_b_corner, f_a_o_seg__part, f_s_d, f_a_a_n__dash, f_a_a_n__bridge,
    f_o_door, f_a_o_window, f_a_n__logo, f_a_a_o_seg__logo, f_a_a_o_seg__logo_dot, f_a_s_problem, f_s_svg
} from '../calendar.module.js';

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertAlmostEquals = function(n_a, n_b, n_tolerance, s_message = ''){
    if(!(Math.abs(n_a - n_b) <= n_tolerance)){ throw new Error(`${s_message} ${n_a} is not ${n_b} within ${n_tolerance}`); }
};

let f_n_distance = function(a_n, a_n__other){ return Math.hypot(a_n[0] - a_n__other[0], a_n[1] - a_n__other[1]); };
// How far a point is from a segment, reckoned here and not by the module.
let f_n_distance__seg = function(a_n, o_seg){
    if('n_r' in o_seg){
        let n_from = Math.min(o_seg.n_rad__from, o_seg.n_rad__to);
        let n_turn = Math.abs(o_seg.n_rad__to - o_seg.n_rad__from);
        let n_rad = Math.atan2(a_n[1] - o_seg.a_n_c[1], a_n[0] - o_seg.a_n_c[0]);
        let n_past = ((n_rad - n_from) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        if(n_past <= n_turn + 1e-12){ return Math.abs(f_n_distance(a_n, o_seg.a_n_c) - o_seg.n_r); }
        return Math.min(...[o_seg.n_rad__from, o_seg.n_rad__to].map(function(n_rad__end){
            return f_n_distance(a_n, [o_seg.a_n_c[0] + o_seg.n_r * Math.cos(n_rad__end), o_seg.a_n_c[1] + o_seg.n_r * Math.sin(n_rad__end)]);
        }));
    }
    let n_x = o_seg.a_n_q[0] - o_seg.a_n_p[0], n_y = o_seg.a_n_q[1] - o_seg.a_n_p[1];
    let n_t = Math.max(0, Math.min(1, ((a_n[0] - o_seg.a_n_p[0]) * n_x + (a_n[1] - o_seg.a_n_p[1]) * n_y) / (n_x * n_x + n_y * n_y)));
    return f_n_distance(a_n, [o_seg.a_n_p[0] + n_t * n_x, o_seg.a_n_p[1] + n_t * n_y]);
};
let f_n_distance__path = function(a_n, a_o_seg){
    return Math.min(...a_o_seg.map(function(o_seg){ return f_n_distance__seg(a_n, o_seg); }));
};
// Points along a path: every segment's ends and n_count between them.
let f_a_a_n__sample = function(a_o_seg, n_count = 7){
    return a_o_seg.flatMap(function(o_seg){
        return Array.from({ length: n_count + 2 }, function(_, n_idx){ return f_a_n__at(o_seg, f_n_len(o_seg) * n_idx / (n_count + 1)); });
    });
};
let f_a_a_n__end = function(a_o_seg){ return [f_a_n__at(a_o_seg[0], 0), f_a_n__at(a_o_seg.at(-1), f_n_len(a_o_seg.at(-1)))]; };
let f_assert_connected = function(a_o_seg, b_closed, s_message){
    a_o_seg.forEach(function(o_seg, n_idx){
        let o_seg__next = a_o_seg[n_idx + 1] ?? (b_closed ? a_o_seg[0] : null);
        if(o_seg__next){ assert(f_n_distance(f_a_n__at(o_seg, f_n_len(o_seg)), f_a_n__at(o_seg__next, 0)) < 1e-9, `${s_message}: segment ${n_idx} does not meet the next`); }
    });
};
// The area a closed path runs around, positive clockwise on the sheet: lines and arcs exactly.
let f_n_area = function(a_o_seg){
    return a_o_seg.reduce(function(n, o_seg){
        if('n_r' in o_seg){
            let [n_cx, n_cy] = o_seg.a_n_c, n_r = o_seg.n_r, n_0 = o_seg.n_rad__from, n_1 = o_seg.n_rad__to;
            return n + (n_cx * n_r * (Math.sin(n_1) - Math.sin(n_0)) - n_cy * n_r * (Math.cos(n_1) - Math.cos(n_0)) + n_r * n_r * (n_1 - n_0)) / 2;
        }
        return n + (o_seg.a_n_p[0] * o_seg.a_n_q[1] - o_seg.a_n_q[0] * o_seg.a_n_p[1]) / 2;
    }, 0);
};

// An SVG path's d read by the SVG specification's own rules (F.6.5 for arcs): its
// subpaths as lists of points, the ends of every command and the middle of every arc.
let f_a_a_a_n__read = function(s_d){
    return s_d.split('M').slice(1).map(function(s_subpath){
        let a_s = s_subpath.trim().split(/\s+/);
        let a_n_p = [Number(a_s[0]), Number(a_s[1])];
        let a_a_n = [a_n_p];
        for(let n_idx = 2; n_idx < a_s.length;){
            if(a_s[n_idx] === 'L'){
                a_n_p = [Number(a_s[n_idx + 1]), Number(a_s[n_idx + 2])];
                n_idx += 3;
            } else if(a_s[n_idx] === 'A'){
                let [n_rx, n_ry, n_turn, n_large, n_sweep, n_x, n_y] = a_s.slice(n_idx + 1, n_idx + 8).map(Number);
                assert(n_rx === n_ry && n_turn === 0, 'an arc that is not a circle\'s');
                let n_x1 = (a_n_p[0] - n_x) / 2, n_y1 = (a_n_p[1] - n_y) / 2;
                let n_root = Math.sqrt(Math.max(0, (n_rx * n_rx - n_x1 * n_x1 - n_y1 * n_y1) / (n_x1 * n_x1 + n_y1 * n_y1))) * (n_large === n_sweep ? -1 : 1);
                let a_n_c = [n_root * n_y1 + (a_n_p[0] + n_x) / 2, -n_root * n_x1 + (a_n_p[1] + n_y) / 2];
                let n_rad__from = Math.atan2(a_n_p[1] - a_n_c[1], a_n_p[0] - a_n_c[0]);
                let n_rad = Math.atan2(n_y - a_n_c[1], n_x - a_n_c[0]) - n_rad__from;
                if(n_sweep && n_rad < 0){ n_rad += 2 * Math.PI; }
                if(!n_sweep && n_rad > 0){ n_rad -= 2 * Math.PI; }
                a_a_n.push([a_n_c[0] + n_rx * Math.cos(n_rad__from + n_rad / 2), a_n_c[1] + n_rx * Math.sin(n_rad__from + n_rad / 2)]);
                a_n_p = [n_x, n_y];
                n_idx += 8;
            } else {
                throw new Error(`command ${a_s[n_idx]}`);
            }
            a_a_n.push(a_n_p);
        }
        return a_a_n;
    });
};
let f_s_d__of = function(s_svg, s_id){ return s_svg.match(new RegExp(`id="${s_id}"[^>]* d="([^"]*)"`))?.[1]; };

Deno.test('a path\'s d: lines, and arcs with their two flags', function(){
    let o_arc = { a_n_c: [0, 0], n_r: 1, n_rad__from: 0, n_rad__to: Math.PI / 2 };
    assert(f_s_d([o_arc]) === 'M 1 0 A 1 1 0 0 1 0 1', f_s_d([o_arc]));
    assert(f_s_d([{ ...o_arc, n_rad__from: Math.PI / 2, n_rad__to: 0 }]) === 'M 0 1 A 1 1 0 0 0 1 0', 'the other way round');
    assert(f_s_d([{ ...o_arc, n_rad__to: 3 * Math.PI / 2 }]) === 'M 1 0 A 1 1 0 1 1 0 -1', 'three quarters');
    assert(f_s_d([{ a_n_p: [1, 2], a_n_q: [3, 4] }, { a_n_p: [3, 4], a_n_q: [5, 4] }]) === 'M 1 2 L 3 4 L 5 4', 'lines');
    // read back, an arc's middle lies where the arc has it
    for(let n_rad__to of [0.3, Math.PI / 2, 3, 4, -0.3, -3, -4]){
        let o = { a_n_c: [5, -2], n_r: 7, n_rad__from: 1, n_rad__to: 1 + n_rad__to };
        let a_a_n = f_a_a_a_n__read(f_s_d([o]))[0];
        assert(f_n_distance(a_a_n[1], f_a_n__at(o, f_n_len(o) / 2)) < 1e-3, `arc of ${n_rad__to}`);
    }
});

Deno.test('a part of a path is as long as asked for and lies on it', function(){
    let a_o_seg = f_o_door({ n_mm__x: 50, n_mm__y: 40, n_mm__size_x: 32, n_mm__size_y: 32, s_shape: 'arch', s_door: 'left' }, o_setting__default).a_o_seg__opening;
    let n_len = f_n_len__path(a_o_seg);
    for(let [n_from, n_to] of [[0, n_len], [3, 9], [20, 70], [n_len - 5, n_len]]){
        let a_o_seg__part = f_a_o_seg__part(a_o_seg, n_from, n_to);
        assertAlmostEquals(f_n_len__path(a_o_seg__part), n_to - n_from, 1e-9);
        f_assert_connected(a_o_seg__part, false, 'part');
        for(let a_n of f_a_a_n__sample(a_o_seg__part)){ assert(f_n_distance__path(a_n, a_o_seg) < 1e-9, 'part off its path'); }
    }
});

Deno.test('dashes: a gap at both ends and between, all the same length, the number that comes closest', function(){
    for(let [n_len, n_dash, n_gap, n_count] of [[32, 3, 2, 6], [16, 3, 2, 3], [16, 16, 2, 1], [100, 0.3, 0.2, 200], [5, 3, 2, 1], [4, 3, 2, 0], [45, 7.3, 0.9, 5], [180, 0.2, 50, 2]]){
        let a_a_n = f_a_a_n__dash(n_len, n_dash, n_gap);
        assert(a_a_n.length === n_count, `${n_len} ${n_dash} ${n_gap}: ${a_a_n.length} dashes`);
        if(!n_count){ continue; }
        assertAlmostEquals(a_a_n[0][0], n_gap, 1e-9, 'gap at the start');
        assertAlmostEquals(n_len - a_a_n.at(-1)[1], n_gap, 1e-9, 'gap at the end');
        a_a_n.forEach(function(a_n, n_idx){
            assert(a_n[1] > a_n[0], 'a dash without length');
            assertAlmostEquals(a_n[1] - a_n[0], a_a_n[0][1] - a_a_n[0][0], 1e-9, 'dash');
            if(n_idx){ assertAlmostEquals(a_n[0] - a_a_n[n_idx - 1][1], n_gap, 1e-9, 'gap'); }
        });
    }
});

// Every door is tried in these sizes with these cut settings.
let a_a_n__size = [[32, 32], [60, 40], [20, 45], [12, 12], [50, 14], [5, 8]];
let a_o_setting__cut = [
    o_setting__default,
    { ...o_setting__default, n_mm__corner: 0 },
    { ...o_setting__default, n_mm__corner: 8, n_mm__bridge: 0.2, n_mm__bridge_distance: 9, n_mm__dash: 1, n_mm__gap: 0.5, n_mm__mark: 1.5 },
    { ...o_setting__default, n_mm__bridge: 1.5, n_mm__bridge_distance: 60, n_mm__dash: 8, n_mm__gap: 4, n_mm__mark: 6 }
];
let a_s_side__all = ['left', 'top', 'right', 'bottom'];
// 0 the x axis, 1 the y axis: the one a hinge on this side runs along
let f_n_axis = function(s_side){ return s_side === 'left' || s_side === 'right' ? 1 : 0; };

for(let s_shape of a_s_shape){
    for(let s_door of a_s_door){
        let a_s_side = s_door === 'double' ? ['left', 'right'] : [s_door];
        // f for every size and cut setting: the door, its size, its box left, top, right, bottom, its settings, and the cut down a double door's middle
        let f_each = function(f){
            for(let [n_x, n_y] of a_a_n__size){
                a_o_setting__cut.forEach(function(o_setting, n_idx__setting){
                    let o_door = f_o_door({ n_mm__x: 100, n_mm__y: 70, n_mm__size_x: n_x, n_mm__size_y: n_y, s_shape, s_door }, o_setting);
                    let a_n__box = [100 - n_x / 2, 70 - n_y / 2, 100 + n_x / 2, 70 + n_y / 2];
                    let a_o_seg__middle = s_door === 'double' ? [{ a_n_p: [100, a_n__box[1]], a_n_q: [100, a_n__box[3]] }] : [];
                    try{
                        f(o_door, n_x, n_y, a_n__box, o_setting, a_o_seg__middle);
                    } catch(o_error){
                        throw new Error(`${n_x} × ${n_y}, cut settings ${n_idx__setting}: ${o_error.message}`);
                    }
                });
            }
        };

        Deno.test(`${s_shape}, ${s_door}: the opening is closed, in the window's box, and reaches every side without a hinge`, function(){
            f_each(function(o_door, n_x, n_y, a_n__box){
                let a_o_seg = o_door.a_o_seg__opening;
                f_assert_connected(a_o_seg, true, 'opening');
                let a_a_n = f_a_a_n__sample(a_o_seg, 40);
                for(let a_n of a_a_n){
                    assert(a_n[0] >= a_n__box[0] - 1e-9 && a_n[0] <= a_n__box[2] + 1e-9 && a_n[1] >= a_n__box[1] - 1e-9 && a_n[1] <= a_n__box[3] + 1e-9, `${a_n} outside the box`);
                }
                for(let s_side of a_s_side__all.filter(function(s){ return !a_s_side.includes(s); })){
                    let f = s_side === 'left' || s_side === 'top' ? Math.min : Math.max;
                    assertAlmostEquals(f(...a_a_n.map(function(a_n){ return a_n[1 - f_n_axis(s_side)]; })), a_n__box[a_s_side__all.indexOf(s_side)], 1e-9, s_side);
                }
                let n_area = f_n_area(a_o_seg);
                assert(n_area > 0.5 * n_x * n_y && n_area <= n_x * n_y + 1e-9, `area ${n_area}`);
            });
        });

        Deno.test(`${s_shape}, ${s_door}: every hinge is straight along its side and at least half of it long`, function(){
            f_each(function(o_door, n_x, n_y, a_n__box){
                assert(o_door.a_a_n__hinge.length === a_s_side.length, 'hinges');
                o_door.a_a_n__hinge.forEach(function([a_n_p, a_n_q], n_idx){
                    let s_side = a_s_side[n_idx];
                    let n_axis = f_n_axis(s_side);
                    assertAlmostEquals(a_n_p[1 - n_axis], a_n_q[1 - n_axis], 1e-9, 'a slanted hinge');
                    let n_side = n_axis ? n_y : n_x;
                    let n_len = f_n_distance(a_n_p, a_n_q);
                    // how far inside its side: not at all where the side is straight for long enough, else no further than needed
                    let n_inset = Math.abs(a_n_p[1 - n_axis] - a_n__box[a_s_side__all.indexOf(s_side)]);
                    assert(n_len >= n_ratio__hinge * n_side - 1e-9 && n_len <= n_side + 1e-9, `hinge ${n_len} on a side of ${n_side}`);
                    assert(n_inset < Math.min(n_x, n_y) / 2, `hinge ${n_inset} inside`);
                    if(n_inset > 1e-9){ assertAlmostEquals(n_len, n_ratio__hinge * n_side, 1e-6, 'a hinge further inside than needed'); }
                    if(s_shape === 'rect'){ assertAlmostEquals(n_len, n_side, 1e-9, 'a rectangle\'s hinge is its whole side'); }
                });
            });
        });

        Deno.test(`${s_shape}, ${s_door}: the free edge runs from hinge to hinge, or to the cut down the middle`, function(){
            f_each(function(o_door, n_x, n_y, a_n__box, o_setting, a_o_seg__middle){
                let a_a_n__meeting = o_door.a_a_n__hinge.flat().concat(a_o_seg__middle.flatMap(function(o_seg){ return [o_seg.a_n_p, o_seg.a_n_q]; }));
                assert(o_door.a_a_o_seg__chain.length === (s_door === 'double' ? 5 : 1), 'chains');
                for(let a_o_seg of o_door.a_a_o_seg__chain){
                    f_assert_connected(a_o_seg, false, 'chain');
                    for(let a_n of f_a_a_n__end(a_o_seg)){
                        assert(a_a_n__meeting.some(function(a_n__meeting){ return f_n_distance(a_n, a_n__meeting) < 1e-9; }), `a chain ends at ${a_n}`);
                    }
                }
                for(let a_n__meeting of a_a_n__meeting){
                    assert(o_door.a_a_o_seg__chain.some(function(a_o_seg){
                        return f_a_a_n__end(a_o_seg).some(function(a_n){ return f_n_distance(a_n, a_n__meeting) < 1e-9; });
                    }), `nothing ends at ${a_n__meeting}`);
                }
            });
        });

        Deno.test(`${s_shape}, ${s_door}: the cuts are the free edge less its bridges, spread evenly and off the corners`, function(){
            f_each(function(o_door, n_x, n_y, a_n__box, o_setting){
                let n_mm__bridge = o_setting.n_mm__bridge;
                let n_piece = 0;
                for(let a_o_seg of o_door.a_a_o_seg__chain){
                    let a_a_n = f_a_a_n__bridge(a_o_seg, o_setting);
                    // where the chain turns a corner, along it, and its two ends
                    let a_n_s__corner = [0];
                    let n_s = 0;
                    a_o_seg.forEach(function(o_seg, n_idx){
                        n_s += f_n_len(o_seg);
                        if(n_idx === a_o_seg.length - 1 || f_b_corner(o_seg, a_o_seg[n_idx + 1])){ a_n_s__corner.push(n_s); }
                    });
                    let n_bridge = 0;
                    for(let n_idx = 1; n_idx < a_n_s__corner.length; n_idx++){
                        let [n_from, n_to] = [a_n_s__corner[n_idx - 1], a_n_s__corner[n_idx]];
                        let a_a_n__here = a_a_n.filter(function(a_n){ return a_n[0] > n_from && a_n[1] < n_to; });
                        n_bridge += a_a_n__here.length;
                        if(n_to - n_from >= 4 * n_mm__bridge){ assert(a_a_n__here.length >= 1, `no bridge on a stretch of ${n_to - n_from}`); }
                        let n_step = (n_to - n_from) / (a_a_n__here.length + 1);
                        a_a_n__here.forEach(function(a_n, n_idx__bridge){
                            assertAlmostEquals(a_n[1] - a_n[0], n_mm__bridge, 1e-9, 'bridge');
                            assertAlmostEquals((a_n[0] + a_n[1]) / 2, n_from + (n_idx__bridge + 1) * n_step, 1e-9, 'bridge\'s place');
                        });
                        // cuts stay longer than a bridge, and no longer than asked for
                        assert(!a_a_n__here.length || (n_step - n_mm__bridge >= n_mm__bridge - 1e-9 && n_step < o_setting.n_mm__bridge_distance), `bridges ${n_step} apart`);
                    }
                    assert(n_bridge === a_a_n.length, 'a bridge on a corner');
                    n_piece += a_a_n.length + 1;
                    assertAlmostEquals(
                        f_n_len__path(o_door.a_a_o_seg__cut.flat().filter(function(o_seg){ return f_n_distance__path(f_a_n__at(o_seg, f_n_len(o_seg) / 2), a_o_seg) < 1e-9; })),
                        f_n_len__path(a_o_seg) - a_a_n.length * n_mm__bridge, 1e-9, 'cut length of a chain'
                    );
                }
                assert(o_door.a_a_o_seg__cut.length === n_piece, `${o_door.a_a_o_seg__cut.length} cuts, ${n_piece} expected`);
                for(let a_o_seg of o_door.a_a_o_seg__cut){ f_assert_connected(a_o_seg, false, 'cut'); }
            });
        });

        Deno.test(`${s_shape}, ${s_door}: the folds are dashes on the hinges, a gap from their ends`, function(){
            f_each(function(o_door, n_x, n_y, a_n__box, o_setting){
                let n_dash = 0;
                for(let [a_n_p, a_n_q] of o_door.a_a_n__hinge){
                    let n_len = f_n_distance(a_n_p, a_n_q);
                    let a_n_s = o_door.a_a_o_seg__fold.flat().filter(function(o_seg){
                        return f_n_distance__seg(o_seg.a_n_p, { a_n_p, a_n_q }) < 1e-9 && f_n_distance__seg(o_seg.a_n_q, { a_n_p, a_n_q }) < 1e-9;
                    }).flatMap(function(o_seg){ return [f_n_distance(o_seg.a_n_p, a_n_p), f_n_distance(o_seg.a_n_q, a_n_p)]; });
                    n_dash += a_n_s.length / 2;
                    assert(a_n_s.length >= 2 || n_len <= 2 * o_setting.n_mm__gap, 'a hinge without a dash');
                    if(a_n_s.length){
                        assertAlmostEquals(a_n_s[0], o_setting.n_mm__gap, 1e-9, 'gap at the hinge\'s start');
                        assertAlmostEquals(n_len - a_n_s.at(-1), o_setting.n_mm__gap, 1e-9, 'gap at the hinge\'s end');
                    }
                    for(let n_idx = 2; n_idx < a_n_s.length; n_idx += 2){ assertAlmostEquals(a_n_s[n_idx] - a_n_s[n_idx - 1], o_setting.n_mm__gap, 1e-9, 'gap'); }
                }
                assert(o_door.a_a_o_seg__fold.length === n_dash, 'a dash off the hinges');
            });
        });

        Deno.test(`${s_shape}, ${s_door}: the back's marks lie on the opening, take in its corners and touch nowhere`, function(){
            f_each(function(o_door){
                let a_o_seg = o_door.a_o_seg__opening;
                let a_a_o_seg = o_door.a_a_o_seg__mark;
                for(let a_o_seg__mark of a_a_o_seg){
                    f_assert_connected(a_o_seg__mark, false, 'mark');
                    for(let a_n of f_a_a_n__sample(a_o_seg__mark)){ assert(f_n_distance__path(a_n, a_o_seg) < 1e-9, `mark at ${a_n} off the opening`); }
                }
                // a corner lies inside a mark, where two of its segments meet
                a_o_seg.forEach(function(o_seg, n_idx){
                    if(!f_b_corner(a_o_seg[(n_idx + a_o_seg.length - 1) % a_o_seg.length], o_seg)){ return; }
                    let a_n = f_a_n__at(o_seg, 0);
                    assert(a_a_o_seg.some(function(a_o_seg__mark){
                        return a_o_seg__mark.slice(1).some(function(o_seg__mark){ return f_n_distance(f_a_n__at(o_seg__mark, 0), a_n) < 1e-9; });
                    }), `no mark around the corner at ${a_n}`);
                });
                // no mark touches another, so nothing is cut free
                a_a_o_seg.forEach(function(a_o_seg__mark, n_idx){
                    for(let a_o_seg__other of a_a_o_seg.slice(0, n_idx)){
                        for(let a_n of f_a_a_n__sample(a_o_seg__mark)){ assert(f_n_distance__path(a_n, a_o_seg__other) > 0.1, `two marks meet at ${a_n}`); }
                    }
                });
                let n_len = a_a_o_seg.reduce(function(n, a_o_seg__mark){ return n + f_n_len__path(a_o_seg__mark); }, 0);
                assert(a_a_o_seg.length >= 2 && n_len < 0.8 * f_n_len__path(a_o_seg), `marks ${n_len} of ${f_n_len__path(a_o_seg)}`);
            });
        });

        Deno.test(`${s_shape}, ${s_door}: front and back show the same opening`, function(){
            f_each(function(o_door, n_x, n_y, a_n__box, o_setting, a_o_seg__middle){
                let a_o_seg = o_door.a_o_seg__opening.concat(a_o_seg__middle);
                for(let a_o_seg__drawn of [...o_door.a_a_o_seg__cut, ...o_door.a_a_o_seg__fold]){
                    for(let a_n of f_a_a_n__sample(a_o_seg__drawn)){ assert(f_n_distance__path(a_n, a_o_seg) < 1e-9, `front at ${a_n} off the opening`); }
                }
            });
        });
    }
}

Deno.test('openings of a known area', function(){
    let f_n = function(s_shape, s_door, n_x, n_y){
        return f_n_area(f_o_door({ n_mm__x: 0, n_mm__y: 0, n_mm__size_x: n_x, n_mm__size_y: n_y, s_shape, s_door }, o_setting__default).a_o_seg__opening);
    };
    // what a chord of half the diameter cuts off a disc of 32
    let n_beyond = 256 * Math.PI / 6 - Math.sqrt(192) * 8;
    // a rectangle less two rounded corners of 2
    assertAlmostEquals(f_n('rect', 'left', 32, 32), 32 * 32 - 2 * (1 - Math.PI / 4) * 4, 1e-9, 'rectangle');
    assertAlmostEquals(f_n('rect', 'double', 60, 40), 60 * 40, 1e-9, 'double rectangle');
    // half a disc on a rectangle, the foot sharp at the hinges
    assertAlmostEquals(f_n('arch', 'double', 32, 32), 32 * 16 + Math.PI * 128, 1e-9, 'arch');
    assertAlmostEquals(f_n('arch', 'top', 32, 32), 32 * 16 + Math.PI * 128 - n_beyond - 2 * (1 - Math.PI / 4) * 4, 1e-6, 'arch, hinge on top');
    assertAlmostEquals(f_n('round', 'left', 32, 32), Math.PI * 256 - n_beyond, 1e-6, 'circle');
    assertAlmostEquals(f_n('round', 'top', 32, 32), f_n('round', 'left', 32, 32), 1e-9, 'circle, hinge on top');
    assertAlmostEquals(f_n('round', 'double', 32, 32), Math.PI * 256 - 2 * n_beyond, 1e-6, 'circle, double');
});

Deno.test('the grid: 24 windows in the middle of their cells, nothing wrong', function(){
    let a_o_window = f_a_o_window(o_setting__default);
    assert(a_o_window.length === 24, 'windows');
    a_o_window.forEach(function(o_window, n_idx){
        assertAlmostEquals(o_window.n_mm__x, 15 + (n_idx % 6 + 0.5) * 260 / 6, 1e-9, 'x');
        assertAlmostEquals(o_window.n_mm__y, 15 + (Math.floor(n_idx / 6) + 0.5) * 180 / 4, 1e-9, 'y');
        assert(o_window.n_mm__size_x === 32 && o_window.n_mm__size_y === 32, 'size');
    });
    assert(f_a_s_problem(o_setting__default).length === 0, f_a_s_problem(o_setting__default).join());
});

Deno.test('the grid: a last row that is not full stands in the middle', function(){
    let a_o_window = f_a_o_window({ ...o_setting__default, n_window: 26 });
    assert(a_o_window.length === 26, 'windows');
    assertAlmostEquals(a_o_window[24].n_mm__x + a_o_window[25].n_mm__x, 290, 1e-9, 'last row');
    assertAlmostEquals(a_o_window[25].n_mm__x - a_o_window[24].n_mm__x, 260 / 6, 1e-9, 'last row\'s step');
    assertAlmostEquals(a_o_window[25].n_mm__y, 15 + 4.5 * 180 / 5, 1e-9, 'last row\'s height');
});

Deno.test('the mix: only what is ticked, each about as often, the same for the same seed', function(){
    for(let [a_s_shape__ticked, a_s_door__ticked, n_window] of [[a_s_shape, a_s_door, 24], [['arch'], ['top', 'double'], 7], [['rect', 'round'], ['left'], 100]]){
        let o_setting = { ...o_setting__default, a_s_shape: a_s_shape__ticked, a_s_door: a_s_door__ticked, n_window };
        let a_o_window = f_a_o_window(o_setting);
        for(let [s_name, a_s] of [['s_shape', a_s_shape__ticked], ['s_door', a_s_door__ticked]]){
            let a_n_count = a_s.map(function(s){ return a_o_window.filter(function(o_window){ return o_window[s_name] === s; }).length; });
            assert(a_n_count.reduce(function(n, n_count){ return n + n_count; }) === n_window, `${s_name}: a value that is not ticked`);
            assert(Math.max(...a_n_count) - Math.min(...a_n_count) <= 1, `${s_name}: ${a_n_count}`);
        }
        assert(JSON.stringify(f_a_o_window(o_setting)) === JSON.stringify(a_o_window), 'the same seed, another mix');
    }
    let f_s = function(n_seed){ return f_a_o_window({ ...o_setting__default, n_seed }).map(function(o){ return o.s_shape + o.s_door; }).join(); };
    assert(f_s(1) !== f_s(2) && f_s(2) !== f_s(3), 'another seed, the same mix');
});

Deno.test('a window\'s own values replace the grid\'s, for that window alone', function(){
    let a_o_window__own = [];
    a_o_window__own[7] = { n_mm__x: 100.5, s_shape: 'round' };
    a_o_window__own[30] = { n_mm__size_x: 60 };
    let a_o_window = f_a_o_window({ ...o_setting__default, a_o_window__own });
    let a_o_window__grid = f_a_o_window(o_setting__default);
    assert(JSON.stringify(a_o_window[7]) === JSON.stringify({ ...a_o_window__grid[7], n_mm__x: 100.5, s_shape: 'round' }), 'window 8');
    assert(JSON.stringify(a_o_window.filter(function(o, n_idx){ return n_idx !== 7; })) === JSON.stringify(a_o_window__grid.filter(function(o, n_idx){ return n_idx !== 7; })), 'the others');
    // kept through JSON, as the page stores it, and for a window that comes back
    let o_setting = JSON.parse(JSON.stringify({ ...o_setting__default, a_o_window__own, n_window: 31 }));
    assert(f_a_o_window(o_setting)[7].n_mm__x === 100.5 && f_a_o_window(o_setting)[30].n_mm__size_x === 60 && f_a_o_window(o_setting)[29].n_mm__size_x === 32, 'after JSON');
});

Deno.test('what is wrong is said: over the edge, on another window, on the logo', function(){
    let f_a_s = function(a_o, o_more = {}){ return f_a_s_problem({ ...o_setting__default, a_o_window__own: a_o, ...o_more }); };
    assert(f_a_s([{ n_mm__x: 15.5 }]).join() === 'Window 1 reaches over the calendar\'s edge', f_a_s([{ n_mm__x: 15.5 }]).join());
    assert(f_a_s([{ n_mm__x: 16 }]).length === 0, 'at the edge');
    let a_o_window = f_a_o_window(o_setting__default);
    assert(f_a_s([null, { n_mm__x: a_o_window[0].n_mm__x + 31.5 }]).join() === 'Windows 1 and 2 overlap', 'overlap');
    assert(f_a_s([null, { n_mm__x: a_o_window[0].n_mm__x + 32 }]).length === 0, 'side by side');
    let a_n = f_a_n__logo(o_setting__default);
    let a_o = [];
    a_o[23] = { n_mm__x: a_n[0] - 15.5, n_mm__y: a_n[1] - 15.5 };
    assert(f_a_s(a_o).join() === 'Window 24 lies on the logo', f_a_s(a_o).join());
    assert(f_a_s(a_o, { b_logo: false }).length === 0, 'without the logo');
    assert(f_a_s([], { n_mm__window_x: 50, b_logo: false }).length === 20, 'windows wider than their cells');
});

Deno.test('the logo: three closed outlines of its size, dotted and mirrored in the back\'s bottom right corner', function(){
    let a_a_o_seg = f_a_a_o_seg__logo();
    assert(a_a_o_seg.length === 3, 'outlines');
    let a_a_n = [];
    for(let a_o_seg of a_a_o_seg){
        f_assert_connected(a_o_seg, true, 'logo');
        a_a_n.push(...f_a_a_n__sample(a_o_seg, 2000));
    }
    for(let [n_axis, n_size] of [[0, 43.9095293518], [1, 31.2528266758]]){
        assertAlmostEquals(Math.min(...a_a_n.map(function(a_n){ return a_n[n_axis]; })), 0, 1e-5, 'logo starts at 0');
        assertAlmostEquals(Math.max(...a_a_n.map(function(a_n){ return a_n[n_axis]; })), n_size, 1e-5, 'logo size');
    }
    // the two inner outlines are the same shape, turned; the outer one runs around far more
    assertAlmostEquals(Math.abs(f_n_area(a_a_o_seg[1])), Math.abs(f_n_area(a_a_o_seg[2])), 1e-6, 'the two inner outlines');
    assert(Math.abs(f_n_area(a_a_o_seg[0])) > 4 * Math.abs(f_n_area(a_a_o_seg[1])), 'outer outline');

    let a_n__box = f_a_n__logo(o_setting__default);
    // 12 wide, 4 from the right and the bottom edge of 290 x 210
    assert(JSON.stringify(a_n__box.map(function(n){ return +n.toFixed(6); })) === JSON.stringify([274, +(206 - 12 * 31.2528266758 / 43.9095293518).toFixed(6), 286, 206]), `logo at ${a_n__box}`);
    let a_a_o_seg__dot = f_a_a_o_seg__logo_dot(o_setting__default);
    let n_scale = 12 / 43.9095293518;
    for(let a_o_seg of a_a_o_seg__dot){
        assert(f_n_len__path(a_o_seg) <= 1 + 1e-9 && f_n_len__path(a_o_seg) > 0.5, `a dot of ${f_n_len__path(a_o_seg)}`);
        for(let a_n of f_a_a_n__sample(a_o_seg)){
            assert(a_n[0] >= a_n__box[0] - 1e-9 && a_n[0] <= a_n__box[2] + 1e-9 && a_n[1] >= a_n__box[1] - 1e-9 && a_n[1] <= a_n__box[3] + 1e-9, `dot at ${a_n} outside the logo's place`);
            // mirrored: a dot's point, mirrored back, lies on the logo
            let a_n__logo = [(a_n__box[2] - a_n[0]) / n_scale, (a_n[1] - a_n__box[1]) / n_scale];
            assert(Math.min(...a_a_o_seg.map(function(a_o_seg__logo){ return f_n_distance__path(a_n__logo, a_o_seg__logo); })) < 1e-9, `dot at ${a_n} off the logo`);
        }
    }
    // about as many dots as the outlines' length gives, one per 1.6 mm
    let n_len = a_a_o_seg.reduce(function(n, a_o_seg){ return n + f_n_len__path(a_o_seg); }, 0) * n_scale;
    assert(Math.abs(a_a_o_seg__dot.length - n_len / 1.6) <= 2, `${a_a_o_seg__dot.length} dots on ${n_len}`);
});

let a_o_window__own = [{ n_mm__x: 40, n_mm__y: 30, n_mm__size_x: 55, n_mm__size_y: 20, s_shape: 'round', s_door: 'bottom' }, null, { s_shape: 'arch', s_door: 'top' }];
let a_o_setting = [
    o_setting__default,
    { ...o_setting__default, a_s_door: a_s_door, n_seed: 5, n_mm__corner: 6, a_o_window__own },
    { ...o_setting__default, n_mm__calendar_x: 210, n_mm__calendar_y: 297, n_column: 4, n_window: 25, b_outline: false, b_logo: false, n_mm__bridge: 0 },
    { ...o_setting__default, n_mm__calendar_x: 100.5, n_mm__calendar_y: 60, n_window: 3, n_column: 3, n_mm__margin: 5, n_mm__window_x: 20, n_mm__window_y: 30, a_s_shape: ['arch'], a_s_door: ['double'] }
];

a_o_setting.forEach(function(o_setting, n_idx__setting){
    let a_o_door = f_a_o_window(o_setting).map(function(o_window){ return f_o_door(o_window, o_setting); });
    let f_n = function(s_name){ return a_o_door.reduce(function(n, o_door){ return n + o_door[s_name].length; }, 0); };

    for(let s_sheet of ['front', 'back']){
        Deno.test(`calendar ${n_idx__setting}, ${s_sheet}: the SVG is the calendar's size in mm with its lines`, function(){
            let s_svg = f_s_svg(o_setting, s_sheet);
            assert(!/NaN|undefined|Infinity/.test(s_svg), 'a number is missing');
            let [, s_x, s_y, s_box] = s_svg.match(/<svg [^>]*width="([\d.]+)mm" height="([\d.]+)mm" viewBox="([^"]+)"/);
            assert(Number(s_x) === o_setting.n_mm__calendar_x && Number(s_y) === o_setting.n_mm__calendar_y, 'size');
            assert(s_box === `0 0 ${s_x} ${s_y}`, 'viewBox');
            let a_a_v = s_sheet === 'front'
                ? [['cut', f_n('a_a_o_seg__cut')], ['fold', f_n('a_a_o_seg__fold')], ['mark', null], ['logo', null]]
                : [['cut', null], ['fold', null], ['mark', f_n('a_a_o_seg__mark')], ['logo', o_setting.b_logo ? f_a_a_o_seg__logo_dot(o_setting).length : null]];
            for(let [s_name, n_line] of a_a_v){
                let s_d = f_s_d__of(s_svg, `${s_sheet}_${s_name}`);
                assert((s_d === undefined) === (n_line === null), `${s_name} is there or not`);
                if(s_d !== undefined){ assert((s_d.match(/M/g) || []).length === n_line, `${s_name}: ${n_line} lines`); }
            }
            assert((f_s_d__of(s_svg, `${s_sheet}_outline`) === `M 0 0 L ${s_x} 0 L ${s_x} ${s_y} L 0 ${s_y} Z`) === o_setting.b_outline, 'outline');
            assert((s_svg.match(/ id="/g) || []).length === new Set(s_svg.match(/ id="[^"]*"/g)).size, 'an id twice');
            // the settings can be read back from the file
            let s_setting = s_svg.match(/Settings: (.*)<\/desc>/)[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            assert(s_setting === JSON.stringify(o_setting), 'settings in the file');
        });
    }

    Deno.test(`calendar ${n_idx__setting}: every line of both SVGs, read back, lies on a window's opening`, function(){
        let a_o_seg = a_o_door.flatMap(function(o_door){ return o_door.a_o_seg__opening.concat(o_door.a_a_o_seg__chain.flat()); });
        let s_svg__front = f_s_svg(o_setting, 'front'), s_svg__back = f_s_svg(o_setting, 'back');
        let n_len = 0;
        for(let s_d of [f_s_d__of(s_svg__front, 'front_cut'), f_s_d__of(s_svg__front, 'front_fold'), f_s_d__of(s_svg__back, 'back_mark')]){
            for(let a_a_n of f_a_a_a_n__read(s_d)){
                for(let a_n of a_a_n){ assert(f_n_distance__path(a_n, a_o_seg) < 1e-3, `a line through ${a_n}`); }
                n_len += a_a_n.slice(1).reduce(function(n, a_n, n_idx){ return n + f_n_distance(a_n, a_a_n[n_idx]); }, 0);
            }
        }
        assert(n_len > 0, 'no lines');
    });
});
