// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The lines a knife follows, for every kind of pattern: paths of straight lines and
// arcs, their lengths, parts and boxes, a path as the d of an SVG path, and the VeryOS
// logo's outlines as dots.

// A path is a list of segments, each starting where the one before ends: a line
// { a_n_p, a_n_q } or an arc { a_n_c, n_r, n_rad__from, n_rad__to } around a_n_c. Angles
// turn from +x to +y, clockwise on the sheet, where y points down.
let f_o_line = function(a_n_p, a_n_q){ return { a_n_p, a_n_q }; };
let f_o_arc = function(a_n_c, n_r, n_rad__from, n_rad__to){ return { a_n_c, n_r, n_rad__from, n_rad__to }; };
let f_n_len = function(o_seg){
    if('n_r' in o_seg){ return o_seg.n_r * Math.abs(o_seg.n_rad__to - o_seg.n_rad__from); }
    return Math.hypot(o_seg.a_n_q[0] - o_seg.a_n_p[0], o_seg.a_n_q[1] - o_seg.a_n_p[1]);
};
let f_n_len__path = function(a_o_seg){
    return a_o_seg.reduce(function(n, o_seg){ return n + f_n_len(o_seg); }, 0);
};
// The point n_s along a segment.
let f_a_n__at = function(o_seg, n_s){
    if('n_r' in o_seg){
        let n_rad = o_seg.n_rad__from + Math.sign(o_seg.n_rad__to - o_seg.n_rad__from) * n_s / o_seg.n_r;
        return [o_seg.a_n_c[0] + o_seg.n_r * Math.cos(n_rad), o_seg.a_n_c[1] + o_seg.n_r * Math.sin(n_rad)];
    }
    let n_t = n_s / f_n_len(o_seg);
    return [o_seg.a_n_p[0] + (o_seg.a_n_q[0] - o_seg.a_n_p[0]) * n_t, o_seg.a_n_p[1] + (o_seg.a_n_q[1] - o_seg.a_n_p[1]) * n_t];
};
let f_a_n__start = function(a_o_seg){ return f_a_n__at(a_o_seg[0], 0); };
let f_a_n__end = function(a_o_seg){ return f_a_n__at(a_o_seg.at(-1), f_n_len(a_o_seg.at(-1))); };
// The direction a segment runs in at n_s.
let f_n_rad__direction = function(o_seg, n_s){
    if('n_r' in o_seg){
        let n_sign = Math.sign(o_seg.n_rad__to - o_seg.n_rad__from);
        return o_seg.n_rad__from + n_sign * (n_s / o_seg.n_r + Math.PI / 2);
    }
    return Math.atan2(o_seg.a_n_q[1] - o_seg.a_n_p[1], o_seg.a_n_q[0] - o_seg.a_n_p[0]);
};
// Whether a path turns a corner from one segment into the next, instead of running on smoothly.
let f_b_corner = function(o_seg, o_seg__next){
    let n_rad = f_n_rad__direction(o_seg__next, 0) - f_n_rad__direction(o_seg, f_n_len(o_seg));
    return Math.abs(Math.sin(n_rad)) > 1e-6 || Math.cos(n_rad) < 0;
};
// The part of a path between two lengths along it.
let f_a_o_seg__part = function(a_o_seg, n_s__from, n_s__to){
    let a_o_seg__part = [];
    let n_s = 0;
    for(let o_seg of a_o_seg){
        let n_len = f_n_len(o_seg);
        let n_from = Math.max(n_s__from - n_s, 0);
        let n_to = Math.min(n_s__to - n_s, n_len);
        if(n_to - n_from > 1e-9){
            if('n_r' in o_seg){
                let n_sign = Math.sign(o_seg.n_rad__to - o_seg.n_rad__from);
                a_o_seg__part.push(f_o_arc(o_seg.a_n_c, o_seg.n_r, o_seg.n_rad__from + n_sign * n_from / o_seg.n_r, o_seg.n_rad__from + n_sign * n_to / o_seg.n_r));
            } else {
                a_o_seg__part.push(f_o_line(f_a_n__at(o_seg, n_from), f_a_n__at(o_seg, n_to)));
            }
        }
        n_s += n_len;
    }
    return a_o_seg__part;
};
// A path without its segments of no length.
let f_a_o_seg__real = function(a_o_seg){
    return a_o_seg.filter(function(o_seg){ return f_n_len(o_seg) > 1e-9; });
};
// A segment turned by quarter turns around 0, 0, clockwise on the sheet, and moved by a_n.
let f_o_seg__moved = function(o_seg, n_turn, a_n){
    let n_cos = [1, 0, -1, 0][n_turn];
    let n_sin = [0, 1, 0, -1][n_turn];
    let f_a_n = function(a_n_p){
        return [a_n[0] + a_n_p[0] * n_cos - a_n_p[1] * n_sin, a_n[1] + a_n_p[0] * n_sin + a_n_p[1] * n_cos];
    };
    if('n_r' in o_seg){
        return f_o_arc(f_a_n(o_seg.a_n_c), o_seg.n_r, o_seg.n_rad__from + n_turn * Math.PI / 2, o_seg.n_rad__to + n_turn * Math.PI / 2);
    }
    return f_o_line(f_a_n(o_seg.a_n_p), f_a_n(o_seg.a_n_q));
};

let f_s_n = function(n){ return String(+n.toFixed(4)); };
let f_s_xy = function(a_n){ return `${f_s_n(a_n[0])} ${f_s_n(a_n[1])}`; };
// A path as the d of an SVG path, moved by a_n__move.
let f_s_d = function(a_o_seg, a_n__move = [0, 0]){
    let f_s_xy__moved = function(a_n){ return f_s_xy([a_n[0] + a_n__move[0], a_n[1] + a_n__move[1]]); };
    return a_o_seg.map(function(o_seg, n_idx){
        let s_start = n_idx === 0 ? `M ${f_s_xy__moved(f_a_n__at(o_seg, 0))} ` : '';
        if('n_r' in o_seg){
            let n_rad = o_seg.n_rad__to - o_seg.n_rad__from;
            return `${s_start}A ${f_s_n(o_seg.n_r)} ${f_s_n(o_seg.n_r)} 0 ${Math.abs(n_rad) > Math.PI ? 1 : 0} ${n_rad > 0 ? 1 : 0} ${f_s_xy__moved(f_a_n__at(o_seg, f_n_len(o_seg)))}`;
        }
        return `${s_start}L ${f_s_xy__moved(o_seg.a_n_q)}`;
    }).join(' ');
};

// The box around paths: left, top, right, bottom; null around none.
let f_a_n__box = function(a_a_o_seg){
    let a_a_n = a_a_o_seg.flat().flatMap(function(o_seg){
        let a_a_n__seg = [f_a_n__at(o_seg, 0), f_a_n__at(o_seg, f_n_len(o_seg))];
        if('n_r' in o_seg){
            // an arc reaches furthest where it runs level or upright
            let n_quarter__to = Math.max(o_seg.n_rad__from, o_seg.n_rad__to) / (Math.PI / 2);
            for(let n_quarter = Math.ceil(Math.min(o_seg.n_rad__from, o_seg.n_rad__to) / (Math.PI / 2)); n_quarter <= n_quarter__to; n_quarter++){
                a_a_n__seg.push([o_seg.a_n_c[0] + o_seg.n_r * [1, 0, -1, 0].at(n_quarter % 4), o_seg.a_n_c[1] + o_seg.n_r * [0, 1, 0, -1].at(n_quarter % 4)]);
            }
        }
        return a_a_n__seg;
    });
    if(!a_a_n.length){ return null; }
    return [0, 1].map(function(n_axis){ return Math.min(...a_a_n.map(function(a_n){ return a_n[n_axis]; })); })
        .concat([0, 1].map(function(n_axis){ return Math.max(...a_a_n.map(function(a_n){ return a_n[n_axis]; })); }));
};

// veryos_logo.svg, 43.9095293518 x 31.2528266758. A cutter would cut a filled logo out
// with its islands: in a pattern it is dots along its outlines, so that nothing falls out.
let s_d__logo = 'M 7.7528133542 9.1080260785 L 4.6193976626 1.5432914191 L 0 3.4567085809 L 11.5135290962 31.2528266758 L 32.3960002556 31.2528266758 L 43.9095293518 3.4567085809 L 39.2901316892 1.5432914191 L 36.1567159975 9.1080260785 A 15.6264133379 15.6264133379 0 0 0 7.7528133542 9.1080260785 Z M 30.9694268093 21.2528266758 A 10.6264133379 10.6264133379 0 0 0 21.9547646759 5 A 4.0632066689 4.0632066689 0 0 0 21.9547646759 13.1264133379 A 9.0632066689 9.0632066689 0 0 1 30.9694268093 21.2528266758 Z M 12.9401025425 10 A 9.0632066689 9.0632066689 0 0 0 21.9547646759 18.1264133379 A 4.0632066689 4.0632066689 0 0 1 21.9547646759 26.2528266758 A 10.6264133379 10.6264133379 0 0 1 12.9401025425 10 Z';
let n_ratio__logo = 31.2528266758 / 43.9095293518;
let n_mm__logo_dash = 1;
let n_mm__logo_gap = 0.6;

// An arc from a_n_p to a_n_q as an SVG path gives it: its radius and the two flags.
let f_o_arc__between = function(a_n_p, a_n_q, n_r, b_large, b_sweep){
    let n_x = (a_n_q[0] - a_n_p[0]) / 2;
    let n_y = (a_n_q[1] - a_n_p[1]) / 2;
    let n_half = Math.hypot(n_x, n_y);
    let n_sign = b_large === b_sweep ? -1 : 1;
    let n_far = n_sign * Math.sqrt(Math.max(0, n_r * n_r - n_half * n_half)) / n_half;
    let a_n_c = [a_n_p[0] + n_x - n_far * n_y, a_n_p[1] + n_y + n_far * n_x];
    let n_rad__from = Math.atan2(a_n_p[1] - a_n_c[1], a_n_p[0] - a_n_c[0]);
    let n_rad__to = Math.atan2(a_n_q[1] - a_n_c[1], a_n_q[0] - a_n_c[0]);
    if(b_sweep && n_rad__to < n_rad__from){ n_rad__to += 2 * Math.PI; }
    if(!b_sweep && n_rad__to > n_rad__from){ n_rad__to -= 2 * Math.PI; }
    return f_o_arc(a_n_c, n_r, n_rad__from, n_rad__to);
};
// The logo's three outlines as closed paths, in the logo's own size.
let f_a_a_o_seg__logo = function(){
    return s_d__logo.split('M').slice(1).map(function(s_d){
        let a_s = s_d.trim().split(/\s+/);
        let f_a_n = function(n_idx){ return [Number(a_s[n_idx]), Number(a_s[n_idx + 1])]; };
        let a_n__start = f_a_n(0);
        let a_n_p = a_n__start;
        let a_o_seg = [];
        for(let n_idx = 2; n_idx < a_s.length;){
            if(a_s[n_idx] === 'L'){
                a_o_seg.push(f_o_line(a_n_p, f_a_n(n_idx + 1)));
                n_idx += 3;
            } else if(a_s[n_idx] === 'A'){
                a_o_seg.push(f_o_arc__between(a_n_p, f_a_n(n_idx + 6), Number(a_s[n_idx + 1]), a_s[n_idx + 4] === '1', a_s[n_idx + 5] === '1'));
                n_idx += 8;
            } else {
                a_o_seg.push(f_o_line(a_n_p, a_n__start));
                n_idx += 1;
            }
            a_n_p = f_a_n__end(a_o_seg);
        }
        return f_a_o_seg__real(a_o_seg);
    });
};
// The logo's outlines as dots, n_mm__x wide, its top left corner at a_n. b_mirror: left
// for right, to be read from behind.
let f_a_a_o_seg__logo_dot = function(a_n, n_mm__x, b_mirror){
    let n_scale = n_mm__x / 43.9095293518;
    let f_a_n = function(a_n__own){
        return [a_n[0] + (b_mirror ? n_mm__x - a_n__own[0] * n_scale : a_n__own[0] * n_scale), a_n[1] + a_n__own[1] * n_scale];
    };
    return f_a_a_o_seg__logo().flatMap(function(a_o_seg){
        let a_o_seg__placed = a_o_seg.map(function(o_seg){
            if(!('n_r' in o_seg)){ return f_o_line(f_a_n(o_seg.a_n_p), f_a_n(o_seg.a_n_q)); }
            if(b_mirror){ return f_o_arc(f_a_n(o_seg.a_n_c), o_seg.n_r * n_scale, Math.PI - o_seg.n_rad__from, Math.PI - o_seg.n_rad__to); }
            return f_o_arc(f_a_n(o_seg.a_n_c), o_seg.n_r * n_scale, o_seg.n_rad__from, o_seg.n_rad__to);
        });
        let n_len = f_n_len__path(a_o_seg__placed);
        let n_count = Math.round(n_len / (n_mm__logo_dash + n_mm__logo_gap));
        return Array.from({ length: n_count }, function(_, n_idx){
            let n_s = n_idx * n_len / n_count + n_mm__logo_gap / 2;
            return f_a_o_seg__part(a_o_seg__placed, n_s, n_s + n_mm__logo_dash);
        });
    });
};

export {
    f_o_line, f_o_arc, f_n_len, f_n_len__path, f_a_n__at, f_a_n__start, f_a_n__end, f_b_corner, f_a_o_seg__part, f_a_o_seg__real, f_o_seg__moved,
    f_s_n, f_s_d, f_a_n__box, n_ratio__logo, f_a_a_o_seg__logo, f_a_a_o_seg__logo_dot
};
