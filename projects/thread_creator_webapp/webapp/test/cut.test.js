// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The cut: both parts closed, nothing lost, nothing added, their colours kept, and what
// falls apart told apart.

import { assert, assertEquals, assertAlmostEquals, f_check_closed, f_n_mm3 } from './check.js';
import { f_o_mesh__welded, f_o_cut, f_a_o_mesh__body, f_o_bound, f_o_volume, f_n_cnt__around, f_o_frame } from '../cut.module.js';
import { f_a_n_tri__ball, f_a_n_tri__box, f_a_n_tri__ring, f_a_n_tri__joined } from './shape.js';

// Triangles as a mesh: filament 1 where f_n_fil does not say otherwise.
let f_o_mesh = function(a_n_tri, f_n_fil = null){
    let o_welded = f_o_mesh__welded(a_n_tri);
    let n_cnt = o_welded.a_n_idx.length / 3;
    let a_n_fil = new Uint8Array(n_cnt).fill(1);
    if(f_n_fil){
        for(let n_tri = 0; n_tri < n_cnt; n_tri++){
            let a_n = [0, 1, 2].map(function(n_k){
                return (o_welded.a_n_pos[o_welded.a_n_idx[n_tri * 3] * 3 + n_k] + o_welded.a_n_pos[o_welded.a_n_idx[n_tri * 3 + 1] * 3 + n_k] + o_welded.a_n_pos[o_welded.a_n_idx[n_tri * 3 + 2] * 3 + n_k]) / 3;
            });
            a_n_fil[n_tri] = f_n_fil(...a_n);
        }
    }
    return { a_n_pos: o_welded.a_n_pos, a_n_idx: o_welded.a_n_idx, a_n_fil, a_n_face: new Int32Array(n_cnt), a_n_shell: o_welded.a_n_shell };
};

// The area of a mesh's triangles that f_b picks.
let f_n_mm2 = function(o_mesh, f_b){
    let n_sum = 0;
    for(let n_tri = 0; n_tri < o_mesh.a_n_idx.length / 3; n_tri++){
        if(!f_b(n_tri)){ continue; }
        let a = o_mesh.a_n_idx[n_tri * 3] * 3, b = o_mesh.a_n_idx[n_tri * 3 + 1] * 3, c = o_mesh.a_n_idx[n_tri * 3 + 2] * 3, p = o_mesh.a_n_pos;
        let ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
        n_sum += 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    }
    return n_sum;
};

// Both parts of a cut: closed, their faces flat on the plane and looking away from
// their part, their volumes together the mesh's, their painted areas together the mesh's.
let f_check_cut = function(o_mesh, o_cut, a_n_point, a_n_normal, n_face, s_label){
    let n_mm3 = f_n_mm3(o_mesh.a_n_pos, o_mesh.a_n_idx);
    let n_mm3__parts = 0;
    let a_n_mm2__face = [];
    o_cut.a_o_mesh.forEach(function(o_part, n_side){
        f_check_closed(o_part.a_n_pos, o_part.a_n_idx, `${s_label}, part ${n_side}`);
        n_mm3__parts += f_n_mm3(o_part.a_n_pos, o_part.a_n_idx);
        let n_face__side = n_side === 0 ? n_face : -n_face;
        for(let n_tri = 0; n_tri < o_part.a_n_idx.length / 3; n_tri++){
            for(let n_k = 0; n_k < 3; n_k++){
                let n_off = o_part.a_n_idx[n_tri * 3 + n_k] * 3;
                let n_d = (o_part.a_n_pos[n_off] - a_n_point[0]) * a_n_normal[0] + (o_part.a_n_pos[n_off + 1] - a_n_point[1]) * a_n_normal[1] + (o_part.a_n_pos[n_off + 2] - a_n_point[2]) * a_n_normal[2];
                assert(n_side === 0 ? n_d > -2e-4 : n_d < 2e-4, `${s_label}: a point of part ${n_side} is on the other side, ${n_d}`);
                if(o_part.a_n_face[n_tri] === n_face__side){ assert(Math.abs(n_d) < 2e-4, `${s_label}: a point of the face is off the plane, ${n_d}`); }
            }
            if(o_part.a_n_face[n_tri] === n_face__side){ assertEquals(o_part.a_n_fil[n_tri], 0, `${s_label}: the face has no filament`); }
        }
        a_n_mm2__face.push(f_n_mm2(o_part, function(n_tri){ return o_part.a_n_face[n_tri] === n_face__side; }));
    });
    assertAlmostEquals(n_mm3__parts, n_mm3, 1e-5 * n_mm3, `${s_label}: volume`);
    assertAlmostEquals(a_n_mm2__face[0], a_n_mm2__face[1], 1e-5 * a_n_mm2__face[0] + 1e-6, `${s_label}: both faces as large`);
    for(let n_fil = 1; n_fil <= 3; n_fil++){
        let f_n = function(o){ return f_n_mm2(o, function(n_tri){ return o.a_n_fil[n_tri] === n_fil; }); };
        assertAlmostEquals(f_n(o_cut.a_o_mesh[0]) + f_n(o_cut.a_o_mesh[1]), f_n(o_mesh), 1e-5 * (f_n(o_mesh) + 1), `${s_label}: area of filament ${n_fil}`);
    }
    return a_n_mm2__face[0];
};

Deno.test('welding: corners at one place are one point, colours by triangle, surfaces told apart', function(){
    let a_n_tri = f_a_n_tri__joined(f_a_n_tri__box([0, 0, 0], [10, 20, 30]), f_a_n_tri__box([50, 0, 0], [60, 5, 5]));
    // The first box red but for one corner of its first triangle, the second by corners.
    let a_n_col = new Uint8Array(a_n_tri.length);
    for(let n_off = 0; n_off < 12 * 9; n_off += 3){ a_n_col.set([255, 0, 0], n_off); }
    a_n_col.set([0, 0, 255], 0);
    for(let n_off = 12 * 9; n_off < a_n_col.length; n_off += 9){ a_n_col.set([30, 0, 0, 60, 30, 0, 90, 60, 3], n_off); }
    // A triangle without area, two corners at one place, is left out.
    let a_n_tri__more = f_a_n_tri__joined(a_n_tri, Float32Array.from([0, 0, 0, 0, 0, 0, 1, 1, 1]));
    let a_n_col__more = new Uint8Array(a_n_tri__more.length);
    a_n_col__more.set(a_n_col);
    let o = f_o_mesh__welded(a_n_tri__more, a_n_col__more);
    assertEquals([o.a_n_pos.length / 3, o.a_n_idx.length / 3, o.n_cnt__shell], [16, 24, 2]);
    assertEquals([...o.a_n_shell], [...new Array(12).fill(0), ...new Array(12).fill(1)]);
    assertEquals([...o.a_n_col__tri.subarray(0, 6)], [255, 0, 0, 255, 0, 0], 'the colour two corners share');
    assertEquals([...o.a_n_col__tri.subarray(36, 39)], [60, 30, 1], 'else the mean');
    f_check_closed(o.a_n_pos, o.a_n_idx, 'welded');
    assertAlmostEquals(f_n_mm3(o.a_n_pos, o.a_n_idx), 6000 + 250, 1e-3);
    assertEquals(f_o_mesh__welded(a_n_tri).a_n_col__tri, null);
    // -0 and 0 are one place.
    assertEquals(f_o_mesh__welded(Float32Array.from([0, 0, 0, 1, 0, 0, 0, 1, 0, -0, -0, -0, 0, 1, 0, 0, 0, 1])).a_n_pos.length / 3, 4);
});

Deno.test('a box: level, askew, through its corners, and missed', function(){
    let o_box = f_o_mesh(f_a_n_tri__box([0, 0, 0], [10, 20, 30]), function(n_x, n_y, n_z){ return n_x > 9.9 ? 2 : (n_y < 0.1 ? 3 : 1); });
    let o_cut = f_o_cut(o_box, [3, 3, 12], [0, 0, 1], 1);
    assertAlmostEquals(f_check_cut(o_box, o_cut, [3, 3, 12], [0, 0, 1], 1, 'level'), 200, 1e-4);
    assertAlmostEquals(f_n_mm3(o_cut.a_o_mesh[0].a_n_pos, o_cut.a_o_mesh[0].a_n_idx), 3600, 1e-2);
    assertEquals(o_cut.n_cnt__gap, 0);
    assertEquals(f_o_bound(o_cut.a_o_mesh[1].a_n_pos), { a_n_min: [0, 0, 0], a_n_max: [10, 20, 12] });

    let a_n_normal = [0.3, -0.5, 0.8].map(function(n){ return n / Math.hypot(0.3, 0.5, 0.8); });
    f_check_cut(o_box, f_o_cut(o_box, [5, 10, 15], a_n_normal, 4), [5, 10, 15], a_n_normal, 4, 'askew');

    // Through four corners: two wedges, each half the box.
    a_n_normal = [0, -30, 20].map(function(n){ return n / Math.hypot(30, 20); });
    o_cut = f_o_cut(o_box, [0, 0, 0], a_n_normal, 2);
    assertAlmostEquals(f_check_cut(o_box, o_cut, [0, 0, 0], a_n_normal, 2, 'through corners'), 10 * Math.hypot(20, 30), 1e-3);
    assertAlmostEquals(f_n_mm3(o_cut.a_o_mesh[0].a_n_pos, o_cut.a_o_mesh[0].a_n_idx), 3000, 1e-2);

    assertEquals(f_o_cut(o_box, [0, 0, 30], [0, 0, 1], 1), null, 'along its top: nothing above');
    assertEquals(f_o_cut(o_box, [0, 0, 0], [0, 0, 1], 1), null, 'along its bottom: nothing below');
    assertEquals(f_o_cut(o_box, [0, 0, 40], [0, 0, 1], 1), null, 'past it');
});

Deno.test('a ball, and a cut through a cut part', function(){
    let o_ball = f_o_mesh(f_a_n_tri__ball(20, [1, 2, 3], 40), function(n_x, n_y){ return n_y > 2 ? 2 : 1; });
    let a_n_normal = [1, 2, 2].map(function(n){ return n / 3; });
    let o_cut = f_o_cut(o_ball, [1, 2, 3], a_n_normal, 1);
    assertAlmostEquals(f_check_cut(o_ball, o_cut, [1, 2, 3], a_n_normal, 1, 'ball'), Math.PI * 400, 0.01 * Math.PI * 400);
    // The upper half again, level: its first face is cut too and stays what it was.
    let o_half = o_cut.a_o_mesh[0];
    let o_cut2 = f_o_cut(o_half, [1, 2, 8], [0, 0, 1], 2);
    f_check_cut(o_half, o_cut2, [1, 2, 8], [0, 0, 1], 2, 'half ball');
    for(let o_part of o_cut2.a_o_mesh){
        assert(o_part.a_n_face.includes(1), 'both keep some of the first face');
    }
    let f_n_face = function(o){ return f_n_mm2(o, function(n_tri){ return o.a_n_face[n_tri] === 1; }); };
    assertAlmostEquals(f_n_face(o_cut2.a_o_mesh[0]) + f_n_face(o_cut2.a_o_mesh[1]), f_n_face(o_half), 1e-3, 'together as large as it was');
});

Deno.test('a plane through points and faces of the mesh', function(){
    // A ball has rings of points at round heights: its equator is one.
    let o_ball = f_o_mesh(f_a_n_tri__ball(10, [0, 0, 0], 24));
    let o_cut = f_o_cut(o_ball, [0, 0, 0], [0, 0, 1], 1);
    f_check_cut(o_ball, o_cut, [0, 0, 0], [0, 0, 1], 1, 'ball at its equator');
    assertAlmostEquals(f_n_mm3(o_cut.a_o_mesh[0].a_n_pos, o_cut.a_o_mesh[0].a_n_idx), f_n_mm3(o_cut.a_o_mesh[1].a_n_pos, o_cut.a_o_mesh[1].a_n_idx), 1e-3);
    for(let o_part of o_cut.a_o_mesh){
        assertEquals(f_n_mm2(o_part, function(n_tri){
            let a = o_part.a_n_idx[n_tri * 3], b = o_part.a_n_idx[n_tri * 3 + 1], c = o_part.a_n_idx[n_tri * 3 + 2];
            return a === b || b === c || a === c;
        }), 0);
    }
    // A tower on a block, two surfaces: cut where the tower stands, the plane lies in
    // the block's top. The block keeps its top, the tower gets a bottom.
    let o_tower = f_o_mesh(f_a_n_tri__joined(f_a_n_tri__box([0, 0, 0], [20, 20, 10]), f_a_n_tri__box([5, 5, 10], [15, 15, 20])));
    o_cut = f_o_cut(o_tower, [10, 10, 10], [0, 0, 1], 1);
    assertEquals(o_cut.n_cnt__gap, 0);
    f_check_closed(o_cut.a_o_mesh[0].a_n_pos, o_cut.a_o_mesh[0].a_n_idx, 'tower');
    f_check_closed(o_cut.a_o_mesh[1].a_n_pos, o_cut.a_o_mesh[1].a_n_idx, 'block');
    assertAlmostEquals(f_n_mm3(o_cut.a_o_mesh[0].a_n_pos, o_cut.a_o_mesh[0].a_n_idx), 1000, 1e-3);
    assertAlmostEquals(f_n_mm3(o_cut.a_o_mesh[1].a_n_pos, o_cut.a_o_mesh[1].a_n_idx), 4000, 1e-3);
    assertEquals(f_o_bound(o_cut.a_o_mesh[0].a_n_pos), { a_n_min: [5, 5, 10], a_n_max: [15, 15, 20] });
    // One step higher than a point's nearness to the plane counts for.
    o_cut = f_o_cut(o_ball, [0, 0, 5e-5], [0, 0, 1], 1);
    f_check_cut(o_ball, o_cut, [0, 0, 0], [0, 0, 1], 1, 'ball a hair above its equator');
});

Deno.test('what falls apart: a ring, an arch, a hollow ball, a box in a box', function(){
    // The ring stands upright around y, its middle at z 30: level through the middle
    // it is two arches, each one body with two faces.
    let o_ring = f_o_mesh(f_a_n_tri__ring(20, 4, 30, 32));
    let o_cut = f_o_cut(o_ring, [0, 0, 30], [0, 0, 1], 1);
    f_check_cut(o_ring, o_cut, [0, 0, 30], [0, 0, 1], 1, 'ring');
    assertEquals(f_a_o_mesh__body(o_cut.a_o_mesh[0], 1, [0, 0, 30], [0, 0, 1]).length, 1);
    // The upper arch cut again, 10 higher: its top, and below it two legs.
    let o_arch = o_cut.a_o_mesh[0];
    let o_cut2 = f_o_cut(o_arch, [0, 0, 40], [0, 0, 1], 2);
    f_check_cut(o_arch, o_cut2, [0, 0, 40], [0, 0, 1], 2, 'arch');
    assertEquals(f_a_o_mesh__body(o_cut2.a_o_mesh[0], 2, [0, 0, 40], [0, 0, 1]).length, 1, 'the top');
    let a_o_leg = f_a_o_mesh__body(o_cut2.a_o_mesh[1], -2, [0, 0, 40], [0, 0, 1]);
    assertEquals(a_o_leg.length, 2, 'two legs');
    let n_mm3 = 0;
    for(let o_leg of a_o_leg){
        f_check_closed(o_leg.a_n_pos, o_leg.a_n_idx, 'leg');
        n_mm3 += f_n_mm3(o_leg.a_n_pos, o_leg.a_n_idx);
        assertEquals([1, -1, 2, -2].map(function(n_face){ return o_leg.a_n_face.includes(n_face); }), [true, false, false, true], 'a leg has a face of each cut: above the first, below the second');
    }
    assertAlmostEquals(n_mm3, f_n_mm3(o_cut2.a_o_mesh[1].a_n_pos, o_cut2.a_o_mesh[1].a_n_idx), 1e-3);
    assert(f_o_bound(a_o_leg[0].a_n_pos).a_n_max[0] < 0 !== f_o_bound(a_o_leg[1].a_n_pos).a_n_max[0] < 0, 'one left, one right');

    // A hollow ball: its two surfaces are joined by the face, a ring.
    let o_hollow = f_o_mesh(f_a_n_tri__joined(f_a_n_tri__ball(20, [0, 0, 0], 32), f_a_n_tri__ball(12, [0, 0, 0], 24, true)));
    assertEquals(new Set(o_hollow.a_n_shell).size, 2);
    o_cut = f_o_cut(o_hollow, [0, 0, 1], [0, 0, 1], 1);
    let n_mm2 = f_check_cut(o_hollow, o_cut, [0, 0, 1], [0, 0, 1], 1, 'hollow ball');
    assertAlmostEquals(n_mm2, Math.PI * (400 - 1 - 144 + 1), 0.02 * Math.PI * 256, 'a ring of a face');
    assertEquals(f_a_o_mesh__body(o_cut.a_o_mesh[0], 1, [0, 0, 1], [0, 0, 1]).length, 1);

    // A small box in a large one, as an eye in a head: both cut, one body. And one
    // beside them that the cut misses: another surface near enough to belong.
    let o_boxes = f_o_mesh(f_a_n_tri__joined(f_a_n_tri__box([0, 0, 0], [30, 30, 30]), f_a_n_tri__box([10, 10, 10], [20, 20, 20]), f_a_n_tri__box([30, 10, 20], [34, 20, 28])));
    o_cut = f_o_cut(o_boxes, [0, 0, 15], [0, 0, 1], 1);
    f_check_cut(o_boxes, o_cut, [0, 0, 15], [0, 0, 1], 1, 'boxes');
    assertEquals(f_a_o_mesh__body(o_cut.a_o_mesh[0], 1, [0, 0, 15], [0, 0, 1]).length, 1);
    assertEquals(f_a_o_mesh__body(o_cut.a_o_mesh[1], -1, [0, 0, 15], [0, 0, 1]).length, 1);
    // Two boxes far apart are two bodies.
    let o_apart = f_o_mesh(f_a_n_tri__joined(f_a_n_tri__box([0, 0, 0], [10, 10, 30]), f_a_n_tri__box([40, 0, 0], [50, 10, 30])));
    o_cut = f_o_cut(o_apart, [0, 0, 15], [0, 0, 1], 1);
    assertEquals(f_a_o_mesh__body(o_cut.a_o_mesh[0], 1, [0, 0, 15], [0, 0, 1]).length, 2);
});

Deno.test('triangles that meet another\'s edge midway, as paint cuts them: no gap', function(){
    // A box whose side at y 0 is split along its diagonal in one triangle only.
    let a_n_tri = [...f_a_n_tri__box([0, 0, 0], [10, 10, 10])];
    let n_side = -1;
    for(let n_off = 0; n_off < a_n_tri.length; n_off += 9){
        if([1, 4, 7].every(function(n_k){ return a_n_tri[n_off + n_k] === 0; })){ n_side = n_off; break; }
    }
    let a_n = a_n_tri.slice(n_side, n_side + 9);
    // The triangle's longest edge, and its middle.
    let a_n_len = [0, 1, 2].map(function(n_k){ let n_j = (n_k + 1) % 3; return Math.hypot(a_n[n_k * 3] - a_n[n_j * 3], a_n[n_k * 3 + 2] - a_n[n_j * 3 + 2]); });
    let n_k = a_n_len.indexOf(Math.max(...a_n_len)), n_j = (n_k + 1) % 3, n_i = (n_k + 2) % 3;
    let a_n_mid = [0, 1, 2].map(function(n_c){ return Math.fround((a_n[n_k * 3 + n_c] + a_n[n_j * 3 + n_c]) / 2 + (n_c === 0 ? 1e-6 : 0)); });
    let f_a_n = function(n){ return a_n.slice(n * 3, n * 3 + 3); };
    a_n_tri.splice(n_side, 9, ...f_a_n(n_k), ...a_n_mid, ...f_a_n(n_i), ...a_n_mid, ...f_a_n(n_j), ...f_a_n(n_i));
    let o_box = f_o_mesh(Float32Array.from(a_n_tri));
    let o_cut = f_o_cut(o_box, [5, 5, 3], [0, 0, 1], 1);
    assertEquals(o_cut.n_cnt__gap, 0);
    for(let o_part of o_cut.a_o_mesh){
        assertAlmostEquals(f_n_mm2(o_part, function(n_tri){ return o_part.a_n_face[n_tri] !== 0; }), 100, 1e-3);
    }
});

Deno.test('a surface with a hole is closed as well as it can be, and told', function(){
    let a_n_tri = f_a_n_tri__box([0, 0, 0], [10, 10, 10]);
    // Without the two triangles of the side at y 0.
    let o_open = f_o_mesh(f_a_n_tri__joined(a_n_tri.subarray(0, 36), a_n_tri.subarray(54)));
    let o_cut = f_o_cut(o_open, [5, 5, 5], [0, 0, 1], 1);
    assertEquals(o_cut.n_cnt__gap, 2, 'once for each part');
    assertAlmostEquals(f_n_mm2(o_cut.a_o_mesh[0], function(n_tri){ return o_cut.a_o_mesh[0].a_n_face[n_tri] === 1; }), 100, 1e-6);
});

Deno.test('inside and outside, the middle, a frame', function(){
    let o_hollow = f_o_mesh(f_a_n_tri__joined(f_a_n_tri__ball(20, [0, 0, 0], 32), f_a_n_tri__ball(12, [0, 0, 0], 24, true), f_a_n_tri__box([-2, -2, -2], [2, 2, 2])));
    assertEquals([[0, 0, 0], [0, 5, 0], [15, 0, 0], [0, 0, -16], [30, 0, 0], [-30, 1, 1]].map(function(a_n){ return f_n_cnt__around(o_hollow, a_n); }), [1, 0, 1, 1, 0, 0]);
    let o_box = f_o_mesh(f_a_n_tri__box([0, 0, 0], [10, 20, 30]));
    let o_volume = f_o_volume(o_box.a_n_pos, o_box.a_n_idx);
    assertAlmostEquals(o_volume.n_mm3, 6000, 1e-6);
    assertEquals(o_volume.a_n_middle.map(Math.round), [5, 10, 15]);
    for(let a_n_w of [[0, 0, 1], [0, 0, -1], [1, 0, 0], [0.6, 0.8, 0], [1, 2, 3].map(function(n){ return n / Math.hypot(1, 2, 3); })]){
        let o = f_o_frame(a_n_w);
        let a_n = [o.a_n_u[1] * o.a_n_v[2] - o.a_n_u[2] * o.a_n_v[1], o.a_n_u[2] * o.a_n_v[0] - o.a_n_u[0] * o.a_n_v[2], o.a_n_u[0] * o.a_n_v[1] - o.a_n_u[1] * o.a_n_v[0]];
        for(let n_k = 0; n_k < 3; n_k++){ assertAlmostEquals(a_n[n_k], a_n_w[n_k], 1e-12, 'u × v is w'); }
    }
});
