// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Flat shapes: the loops that edges close to, the polygons the loops make, and the
// triangles that fill a polygon. A cut's face is filled with them, and filled again
// around the mouth of a thread.
//
// A loop is a list of points' numbers; a_n_xy has the points' places, two numbers each.
// A polygon is { a_n_outer, a_a_n_hole, n_mm2, b_inverted }: its outline, counter-
// clockwise, and its holes, clockwise.

// Above 0 where the way from p over q to r turns left.
let f_n_turn__xy = function(n_px, n_py, n_qx, n_qy, n_rx, n_ry){
    return (n_qx - n_px) * (n_ry - n_qy) - (n_qy - n_py) * (n_rx - n_qx);
};

// The area a loop goes around: above 0 if counter-clockwise.
let f_n_mm2__loop = function(a_n_loop, a_n_xy){
    let n_sum = 0;
    for(let n_it = 0; n_it < a_n_loop.length; n_it++){
        let n_a = a_n_loop[n_it] * 2, n_b = a_n_loop[(n_it + 1) % a_n_loop.length] * 2;
        n_sum += a_n_xy[n_a] * a_n_xy[n_b + 1] - a_n_xy[n_b] * a_n_xy[n_a + 1];
    }
    return n_sum / 2;
};

// Whether a place is inside a loop: a line from it to the right crosses the loop an odd
// number of times.
let f_b_in_loop = function(a_n_loop, a_n_xy, n_x, n_y){
    let b_in = false;
    for(let n_it = 0; n_it < a_n_loop.length; n_it++){
        let n_a = a_n_loop[n_it] * 2, n_b = a_n_loop[(n_it + 1) % a_n_loop.length] * 2;
        let n_ay = a_n_xy[n_a + 1], n_by = a_n_xy[n_b + 1];
        if((n_ay > n_y) !== (n_by > n_y) && n_x < a_n_xy[n_a] + (n_y - n_ay) * (a_n_xy[n_b] - a_n_xy[n_a]) / (n_by - n_ay)){ b_in = !b_in; }
    }
    return b_in;
};

// Whether a place is inside a polygon: inside its outline, in none of its holes.
let f_b_in_polygon = function(o_polygon, a_n_xy, n_x, n_y){
    if(!f_b_in_loop(o_polygon.a_n_outer, a_n_xy, n_x, n_y)){ return false; }
    for(let a_n_hole of o_polygon.a_a_n_hole){
        if(f_b_in_loop(a_n_hole, a_n_xy, n_x, n_y)){ return false; }
    }
    return true;
};

// How far a place is from a loop's nearest edge.
let f_n_mm__to_loop = function(a_n_loop, a_n_xy, n_x, n_y){
    let n_best = Infinity;
    for(let n_it = 0; n_it < a_n_loop.length; n_it++){
        let n_a = a_n_loop[n_it] * 2, n_b = a_n_loop[(n_it + 1) % a_n_loop.length] * 2;
        let n_ax = a_n_xy[n_a], n_ay = a_n_xy[n_a + 1];
        let n_ex = a_n_xy[n_b] - n_ax, n_ey = a_n_xy[n_b + 1] - n_ay;
        let n_len2 = n_ex * n_ex + n_ey * n_ey;
        let n_t = n_len2 > 0 ? Math.max(0, Math.min(1, ((n_x - n_ax) * n_ex + (n_y - n_ay) * n_ey) / n_len2)) : 0;
        let n_dx = n_x - n_ax - n_ex * n_t, n_dy = n_y - n_ay - n_ey * n_t;
        let n_d2 = n_dx * n_dx + n_dy * n_dy;
        if(n_d2 < n_best){ n_best = n_d2; }
    }
    return Math.sqrt(n_best);
};

// Where a chain of edges ends, one that starts this near goes on from there.
let n_mm__near = 1e-3;

// The loops that edges close to. a_n_from, a_n_to: each edge's two points, the shape
// it bounds on its left. Where several edges leave a point, two loops touch there, and
// each goes on with the edge that turns left the most, so neither crosses the other.
// Where a chain ends, it goes on at the loop's start or at an edge that starts a hair
// away, as where triangles of a surface meet another's edge midway: a painted 3MF has
// them where its paint cut triangles. A chain that ends with nothing near is closed all
// the same: n_cnt__gap counts those, the sign of a surface that has a hole.
let f_o_loop = function(a_n_from, a_n_to, a_n_xy){
    let n_cnt = a_n_from.length;
    let o_a_n_edge__by_from = new Map();
    for(let n_edge = 0; n_edge < n_cnt; n_edge++){
        let a_n_edge = o_a_n_edge__by_from.get(a_n_from[n_edge]);
        if(a_n_edge){ a_n_edge.push(n_edge); } else { o_a_n_edge__by_from.set(a_n_from[n_edge], [n_edge]); }
    }
    let a_b_used = new Uint8Array(n_cnt);
    let a_a_n_loop = [];
    let n_cnt__gap = 0;
    // A chain is walked from the edge that no other leads to, a loop from any.
    let o_end = new Set(a_n_to);
    let a_n_start = [];
    for(let n_edge = 0; n_edge < n_cnt; n_edge++){
        if(!o_end.has(a_n_from[n_edge])){ a_n_start.push(n_edge); }
    }
    for(let n_edge = 0; n_edge < n_cnt; n_edge++){ a_n_start.push(n_edge); }
    for(let n_start of a_n_start){
        if(a_b_used[n_start]){ continue; }
        let a_n_loop = [a_n_from[n_start]];
        let n_edge = n_start;
        while(true){
            a_b_used[n_edge] = 1;
            let n_at = a_n_to[n_edge];
            if(n_at === a_n_loop[0]){ break; }
            a_n_loop.push(n_at);
            let a_n_next = (o_a_n_edge__by_from.get(n_at) ?? []).filter(function(n){ return !a_b_used[n]; });
            if(a_n_next.length === 0){
                let n_x = a_n_xy[n_at * 2], n_y = a_n_xy[n_at * 2 + 1];
                if(Math.hypot(a_n_xy[a_n_loop[0] * 2] - n_x, a_n_xy[a_n_loop[0] * 2 + 1] - n_y) <= n_mm__near){ break; }
                let n_near = -1, n_mm__best = n_mm__near;
                for(let n_other = 0; n_other < n_cnt; n_other++){
                    if(a_b_used[n_other]){ continue; }
                    let n_mm = Math.hypot(a_n_xy[a_n_from[n_other] * 2] - n_x, a_n_xy[a_n_from[n_other] * 2 + 1] - n_y);
                    if(n_mm <= n_mm__best){ n_mm__best = n_mm; n_near = n_other; }
                }
                if(n_near < 0){
                    n_cnt__gap++;
                    break;
                }
                a_n_loop.push(a_n_from[n_near]);
                n_edge = n_near;
                continue;
            }
            if(a_n_next.length === 1){
                n_edge = a_n_next[0];
                continue;
            }
            // From the way it came, the edge that turns left the most.
            let n_fx = a_n_xy[a_n_from[n_edge] * 2], n_fy = a_n_xy[a_n_from[n_edge] * 2 + 1];
            let n_ax = a_n_xy[n_at * 2], n_ay = a_n_xy[n_at * 2 + 1];
            let n_rad__in = Math.atan2(n_ay - n_fy, n_ax - n_fx);
            let n_best = -Infinity;
            for(let n_next of a_n_next){
                let n_rad = Math.atan2(a_n_xy[a_n_to[n_next] * 2 + 1] - n_ay, a_n_xy[a_n_to[n_next] * 2] - n_ax) - n_rad__in;
                n_rad -= 2 * Math.PI * Math.round(n_rad / (2 * Math.PI));
                // Straight back is the last choice.
                if(n_rad >= Math.PI - 1e-12){ n_rad = -Math.PI; }
                if(n_rad > n_best){ n_best = n_rad; n_edge = n_next; }
            }
        }
        if(a_n_loop.length >= 3){ a_a_n_loop.push(a_n_loop); }
    }
    return { a_a_n_loop, n_cnt__gap };
};

// Loops as polygons: a loop that runs counter-clockwise is an outline, one that runs
// clockwise a hole of the smallest outline around it. A clockwise loop with no outline
// around it bounds a surface that is inside out: its polygon is b_inverted, and its
// triangles are to be turned round.
let f_a_o_polygon = function(a_a_n_loop, a_n_xy){
    let a_o_polygon = [], a_o_hole = [];
    for(let a_n_loop of a_a_n_loop){
        let n_mm2 = f_n_mm2__loop(a_n_loop, a_n_xy);
        if(n_mm2 >= 0){
            a_o_polygon.push({ a_n_outer: a_n_loop, a_a_n_hole: [], n_mm2, n_mm2__hole: 0, b_inverted: false });
        } else {
            a_o_hole.push({ a_n_loop, n_mm2: -n_mm2 });
        }
    }
    a_o_polygon.sort(function(o_a, o_b){ return o_a.n_mm2 - o_b.n_mm2; });
    let a_o_inverted = [];
    for(let o_hole of a_o_hole){
        // A point of the hole that is not on the outline tells.
        let o_around = a_o_polygon.find(function(o_polygon){
            if(o_polygon.n_mm2 < o_hole.n_mm2){ return false; }
            let n_cnt__in = 0;
            let n_cnt__tried = Math.min(o_hole.a_n_loop.length, 5);
            for(let n_it = 0; n_it < n_cnt__tried; n_it++){
                let n_point = o_hole.a_n_loop[Math.floor(n_it * o_hole.a_n_loop.length / n_cnt__tried)];
                if(f_b_in_loop(o_polygon.a_n_outer, a_n_xy, a_n_xy[n_point * 2], a_n_xy[n_point * 2 + 1])){ n_cnt__in++; }
            }
            return n_cnt__in * 2 > n_cnt__tried;
        });
        if(o_around){
            o_around.a_a_n_hole.push(o_hole.a_n_loop);
            o_around.n_mm2__hole += o_hole.n_mm2;
        } else {
            a_o_inverted.push({ a_n_outer: [...o_hole.a_n_loop].reverse(), a_a_n_hole: [], n_mm2: o_hole.n_mm2, n_mm2__hole: 0, b_inverted: true });
        }
    }
    // What a polygon covers is its outline's area less its holes'.
    return [...a_o_polygon, ...a_o_inverted].map(function(o_polygon){
        return { a_n_outer: o_polygon.a_n_outer, a_a_n_hole: o_polygon.a_a_n_hole, n_mm2: o_polygon.n_mm2 - o_polygon.n_mm2__hole, b_inverted: o_polygon.b_inverted };
    });
};

// The triangles that fill a polygon, three points' numbers each, counter-clockwise: by
// cutting ears, after each hole is joined to the outline by a bridge. Only the
// polygon's own points are used, each of them, so the triangles fit the mesh around the
// polygon edge to edge. After Mapbox's earcut.
let f_a_n_idx__ears = function(a_n_outer, a_a_n_hole, a_n_xy){
    let a_n_vertex = [], a_n_x = [], a_n_y = [], a_n_prev = [], a_n_next = [];
    let f_n_node = function(n_vertex){
        a_n_vertex.push(n_vertex);
        a_n_x.push(a_n_xy[n_vertex * 2]);
        a_n_y.push(a_n_xy[n_vertex * 2 + 1]);
        a_n_prev.push(-1);
        a_n_next.push(-1);
        return a_n_vertex.length - 1;
    };
    // A loop as a ring of nodes: its first.
    let f_n_ring = function(a_n_loop){
        let n_first = a_n_vertex.length;
        for(let n_it = 0; n_it < a_n_loop.length; n_it++){
            let n_node = f_n_node(a_n_loop[n_it]);
            a_n_prev[n_node] = n_first + (n_it + a_n_loop.length - 1) % a_n_loop.length;
            a_n_next[n_node] = n_first + (n_it + 1) % a_n_loop.length;
        }
        return n_first;
    };
    let f_n_turn = function(n_p, n_q, n_r){
        return f_n_turn__xy(a_n_x[n_p], a_n_y[n_p], a_n_x[n_q], a_n_y[n_q], a_n_x[n_r], a_n_y[n_r]);
    };
    // Inside the counter-clockwise triangle a, b, c, or on its edge.
    let f_b_in_triangle = function(n_ax, n_ay, n_bx, n_by, n_cx, n_cy, n_px, n_py){
        return (n_cx - n_px) * (n_ay - n_py) >= (n_ax - n_px) * (n_cy - n_py)
            && (n_ax - n_px) * (n_by - n_py) >= (n_bx - n_px) * (n_ay - n_py)
            && (n_bx - n_px) * (n_cy - n_py) >= (n_cx - n_px) * (n_by - n_py);
    };
    // Whether the way from node a to node b starts inside the ring at a.
    let f_b_locally_inside = function(n_a, n_b){
        return f_n_turn(a_n_prev[n_a], n_a, a_n_next[n_a]) > 0
            ? f_n_turn(n_a, n_b, a_n_next[n_a]) <= 0 && f_n_turn(n_a, a_n_prev[n_a], n_b) <= 0
            : f_n_turn(n_a, n_b, a_n_prev[n_a]) > 0 || f_n_turn(n_a, a_n_next[n_a], n_b) > 0;
    };

    let n_start = f_n_ring(a_n_outer);

    // The holes, the leftmost first: from its leftmost point a hole is joined to the
    // point of the ring that it sees to its left.
    let a_n_hole = a_a_n_hole.filter(function(a_n_loop){ return a_n_loop.length >= 3; }).map(function(a_n_loop){
        let n_first = f_n_ring(a_n_loop);
        let n_leftmost = n_first;
        for(let n_node = n_first; n_node < n_first + a_n_loop.length; n_node++){
            if(a_n_x[n_node] < a_n_x[n_leftmost] || (a_n_x[n_node] === a_n_x[n_leftmost] && a_n_y[n_node] < a_n_y[n_leftmost])){ n_leftmost = n_node; }
        }
        return n_leftmost;
    }).sort(function(n_a, n_b){ return a_n_x[n_a] - a_n_x[n_b] || a_n_y[n_a] - a_n_y[n_b]; });
    for(let n_hole of a_n_hole){
        let n_hx = a_n_x[n_hole], n_hy = a_n_y[n_hole];
        // The ring's edge that a line from the hole's point to the left meets first, and
        // of that edge the end further left.
        let n_qx = -Infinity, n_m = -1;
        let n_p = n_start;
        do {
            let n_q = a_n_next[n_p];
            if(n_hy <= a_n_y[n_p] && n_hy >= a_n_y[n_q] && a_n_y[n_q] !== a_n_y[n_p]){
                let n_x = a_n_x[n_p] + (n_hy - a_n_y[n_p]) * (a_n_x[n_q] - a_n_x[n_p]) / (a_n_y[n_q] - a_n_y[n_p]);
                if(n_x <= n_hx && n_x > n_qx){
                    n_qx = n_x;
                    n_m = a_n_x[n_p] < a_n_x[n_q] ? n_p : n_q;
                }
            }
            n_p = n_q;
        } while(n_p !== n_start);
        if(n_m < 0){ continue; }
        // A point of the ring between the two hides that end: then the one nearest
        // to the line is seen instead.
        if(n_qx !== n_hx){
            let n_stop = n_m;
            let n_mx = a_n_x[n_m], n_my = a_n_y[n_m];
            let n_tan__min = Infinity;
            n_p = n_m;
            do {
                if(n_hx >= a_n_x[n_p] && a_n_x[n_p] >= n_mx && n_hx !== a_n_x[n_p]
                    && f_b_in_triangle(n_hy < n_my ? n_hx : n_qx, n_hy, n_mx, n_my, n_hy < n_my ? n_qx : n_hx, n_hy, a_n_x[n_p], a_n_y[n_p])){
                    let n_tan = Math.abs(n_hy - a_n_y[n_p]) / (n_hx - a_n_x[n_p]);
                    if(f_b_locally_inside(n_p, n_hole) && (n_tan < n_tan__min || (n_tan === n_tan__min && (a_n_x[n_p] > a_n_x[n_m]
                        || (a_n_x[n_p] === a_n_x[n_m] && f_n_turn(a_n_prev[n_m], n_m, a_n_prev[n_p]) > 0 && f_n_turn(a_n_next[n_p], n_m, a_n_next[n_m]) > 0))))){
                        n_m = n_p;
                        n_tan__min = n_tan;
                    }
                }
                n_p = a_n_next[n_p];
            } while(n_p !== n_stop);
        }
        // The bridge: from the ring's point around the hole and back, both points twice.
        let n_m2 = f_n_node(a_n_vertex[n_m]), n_hole2 = f_n_node(a_n_vertex[n_hole]);
        let n_after = a_n_next[n_m], n_before = a_n_prev[n_hole];
        a_n_next[n_m] = n_hole; a_n_prev[n_hole] = n_m;
        a_n_next[n_m2] = n_after; a_n_prev[n_after] = n_m2;
        a_n_next[n_hole2] = n_m2; a_n_prev[n_m2] = n_hole2;
        a_n_next[n_before] = n_hole2; a_n_prev[n_hole2] = n_before;
    }
    let n_cnt__left = 0;
    for(let n_node = n_start, b_first = true; b_first || n_node !== n_start; n_node = a_n_next[n_node]){
        b_first = false;
        n_cnt__left++;
    }

    // An ear is a corner that turns left with no other point in its triangle: cutting
    // it off leaves a polygon. A point at the same place as one of its corners, as a
    // bridge leaves them, does not count. n_pass loosens the rule when no ear is left:
    // 1 lets points on the triangle's edge pass, 2 takes a straight corner, a triangle
    // without area, 3 any corner that turns left, 4 any corner at all.
    let f_b_ear = function(n_ear, n_pass){
        let n_a = a_n_prev[n_ear], n_c = a_n_next[n_ear];
        let n_turn = f_n_turn(n_a, n_ear, n_c);
        if(n_pass >= 4){ return true; }
        if(n_turn < 0 || (n_turn === 0 && n_pass < 2)){ return false; }
        if(n_pass >= 3){ return true; }
        let n_ax = a_n_x[n_a], n_ay = a_n_y[n_a], n_bx = a_n_x[n_ear], n_by = a_n_y[n_ear], n_cx = a_n_x[n_c], n_cy = a_n_y[n_c];
        let n_x0 = Math.min(n_ax, n_bx, n_cx), n_x1 = Math.max(n_ax, n_bx, n_cx), n_y0 = Math.min(n_ay, n_by, n_cy), n_y1 = Math.max(n_ay, n_by, n_cy);
        for(let n_p = a_n_next[n_c]; n_p !== n_a; n_p = a_n_next[n_p]){
            let n_px = a_n_x[n_p], n_py = a_n_y[n_p];
            if(n_px < n_x0 || n_px > n_x1 || n_py < n_y0 || n_py > n_y1){ continue; }
            if((n_px === n_ax && n_py === n_ay) || (n_px === n_bx && n_py === n_by) || (n_px === n_cx && n_py === n_cy)){ continue; }
            if(!f_b_in_triangle(n_ax, n_ay, n_bx, n_by, n_cx, n_cy, n_px, n_py)){ continue; }
            if(n_pass >= 1){
                // On the edge: one of the three turns is none.
                if(f_n_turn__xy(n_ax, n_ay, n_bx, n_by, n_px, n_py) === 0 || f_n_turn__xy(n_bx, n_by, n_cx, n_cy, n_px, n_py) === 0
                    || f_n_turn__xy(n_cx, n_cy, n_ax, n_ay, n_px, n_py) === 0){ continue; }
            }
            // A point that turns left itself lies inside only if another one does.
            if(f_n_turn(a_n_prev[n_p], n_p, a_n_next[n_p]) <= 0){ return false; }
        }
        return true;
    };

    let a_n_idx = [];
    let f_add = function(n_a, n_b, n_c){
        let n_va = a_n_vertex[n_a], n_vb = a_n_vertex[n_b], n_vc = a_n_vertex[n_c];
        if(n_va !== n_vb && n_vb !== n_vc && n_va !== n_vc){ a_n_idx.push(n_va, n_vb, n_vc); }
    };
    let n_ear = n_start, n_stop = n_start, n_pass = 0;
    while(n_cnt__left > 3){
        let n_a = a_n_prev[n_ear], n_c = a_n_next[n_ear];
        if(f_b_ear(n_ear, n_pass)){
            f_add(n_a, n_ear, n_c);
            a_n_next[n_a] = n_c;
            a_n_prev[n_c] = n_a;
            n_cnt__left--;
            // Going on with the corner after the next leaves fewer slivers.
            n_ear = a_n_next[n_c];
            n_stop = n_ear;
            n_pass = 0;
            continue;
        }
        n_ear = n_c;
        if(n_ear === n_stop){ n_pass++; }
    }
    if(n_cnt__left === 3){ f_add(a_n_prev[n_ear], n_ear, a_n_next[n_ear]); }
    return a_n_idx;
};

// The triangles for polygons, those of an inside out one turned round.
let f_a_n_idx__of_polygons = function(a_o_polygon, a_n_xy){
    let a_n_idx = [];
    for(let o_polygon of a_o_polygon){
        let a_n = f_a_n_idx__ears(o_polygon.a_n_outer, o_polygon.a_a_n_hole, a_n_xy);
        for(let n_off = 0; n_off < a_n.length; n_off += 3){
            if(o_polygon.b_inverted){ a_n_idx.push(a_n[n_off], a_n[n_off + 2], a_n[n_off + 1]); } else { a_n_idx.push(a_n[n_off], a_n[n_off + 1], a_n[n_off + 2]); }
        }
    }
    return a_n_idx;
};

export {
    f_n_mm2__loop,
    f_b_in_loop,
    f_b_in_polygon,
    f_n_mm__to_loop,
    f_o_loop,
    f_a_o_polygon,
    f_a_n_idx__ears,
    f_a_n_idx__of_polygons
};
