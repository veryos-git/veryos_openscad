// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The object: the bulb of any triangles is closed and right way out, as thick as asked,
// on the neck every bulb has, in the object's colours if it has any; and files of
// triangles are read, an OBJ with its colours.

import { assert, assertEquals, assertAlmostEquals, f_s_path, f_check_closed } from './check.js';
import { f_a_n_tri__ball, f_a_n_tri__box, f_a_n_tri__ring, f_a_n_tri__joined, f_a_n_col__of_tri } from './shape.js';
import { f_o_mesh__object, f_o_param__default, n_mm__base_z } from '../object.module.js';
import { f_n_radius__bore } from '../neck.module.js';
import { f_o_object__from_file as f_o_object__from_file_async, f_o_bound, f_o_buffer__stl_of_tri } from '../mesh_file.module.js';
import { f_o_blob__obj } from '../export.module.js';

let n_tau = Math.PI * 2;
let o_bulb = JSON.parse(Deno.readTextFileSync(f_s_path('part/bulb.json')));
let o_param = f_o_param__default();
let n_r__neck = o_bulb.n_mm__neck_d / 2;
// 71 rings of the bore, a row every 0.1 mm up to 7, and the outside's two, of 180 points.
let n_cnt__neck_row = 70;
let n_cnt__neck = (n_cnt__neck_row + 3) * 180;

// The highest point, the widest radius, and the widest radius below the grid's lowest plane.
let f_o_size = function(o_mesh){
    let n_z = 0, n_r = 0, n_r__low = 0;
    for(let n_off = 0; n_off < o_mesh.a_n_pos.length; n_off += 3){
        let n_r__at = Math.hypot(o_mesh.a_n_pos[n_off], o_mesh.a_n_pos[n_off + 1]);
        n_z = Math.max(n_z, o_mesh.a_n_pos[n_off + 2]);
        n_r = Math.max(n_r, n_r__at);
        if(o_mesh.a_n_pos[n_off + 2] < n_mm__base_z + 1e-3){ n_r__low = Math.max(n_r__low, n_r__at); }
    }
    return { n_z, n_r, n_r__low };
};

let a_n_tri__ball = f_a_n_tri__ball(15, [0, 0, 25]);
// A box with a corner up: turned around z, then around x.
let a_n_tri__tilted = f_a_n_tri__box([-9, -9, -9], [9, 9, 9]);
for(let n_off = 0; n_off < a_n_tri__tilted.length; n_off += 3){
    let [n_x, n_y, n_z] = a_n_tri__tilted.subarray(n_off, n_off + 3);
    [n_x, n_y] = [Math.SQRT1_2 * (n_x - n_y), Math.SQRT1_2 * (n_x + n_y)];
    [n_y, n_z] = [Math.cos(0.9553) * n_y - Math.sin(0.9553) * n_z, Math.sin(0.9553) * n_y + Math.cos(0.9553) * n_z];
    a_n_tri__tilted.set([n_x, n_y, n_z + 24], n_off);
}
// What a file from anywhere may be like.
let a_o_case = [
    { s_label: 'a ball', a_n_tri: a_n_tri__ball },
    { s_label: 'a ball turned inside out', a_n_tri: f_a_n_tri__ball(15, [0, 0, 25], 48, true) },
    { s_label: 'a ball with a gap in its surface', a_n_tri: a_n_tri__ball.slice(0, a_n_tri__ball.length - 9 * 300) },
    { s_label: 'a box on round numbers', a_n_tri: f_a_n_tri__box([-12, -12, 10], [12, 12, 34]) },
    { s_label: 'a box with a corner up', a_n_tri: a_n_tri__tilted },
    { s_label: 'a ring with a hole to look through', a_n_tri: f_a_n_tri__ring(12, 4, 25, 48) },
    { s_label: 'two balls into each other', a_n_tri: f_a_n_tri__joined(f_a_n_tri__ball(11, [-6, 0, 22]), f_a_n_tri__ball(11, [6, 0, 22])) },
    { s_label: 'a pole thinner than the neck', a_n_tri: f_a_n_tri__box([-3, -3, 9], [3, 3, 40]) },
    { s_label: 'a plate thinner than two walls', a_n_tri: f_a_n_tri__box([-15, -0.4, 9], [15, 0.4, 35]) },
    { s_label: 'a ball that reaches below the grid', a_n_tri: f_a_n_tri__ball(17, [0, 0, 10]) },
    { s_label: 'a ball beside the neck', a_n_tri: f_a_n_tri__ball(15, [12, 0, 14]) }
];

for(let o_case of a_o_case){
    Deno.test(`the bulb is closed and right way out: ${o_case.s_label}`, function(){
        for(let n_mm__voxel of [0.8, 0.4]){
            let o_mesh = f_o_mesh__object(o_case.a_n_tri, o_param, o_bulb, n_mm__voxel, 180);
            f_check_closed(o_mesh.a_n_pos, o_mesh.a_n_idx, `${o_case.s_label} at ${n_mm__voxel}`);
            assertEquals(o_mesh.a_n_idx.length / 3, o_mesh.o_stat.n_cnt__triangle);
            assertEquals([o_mesh.o_stat.b_object, o_mesh.o_stat.b_touching, o_mesh.o_stat.n_mm__voxel], [true, true, n_mm__voxel]);
            assert(o_mesh.o_stat.n_mm3 > 0 && o_mesh.o_stat.n_mm3__loose === 0);
            // Below the grid's lowest plane there is the neck alone, whatever the object is.
            assertAlmostEquals(f_o_size(o_mesh).n_r__low, n_r__neck, 0.02, 'below the grid');
            for(let n_wall of o_mesh.a_n_wall){ assert(n_wall > 0); }
        }
    });
}

Deno.test('a ball stays a ball, with the wall asked for', function(){
    for(let [n_mm__voxel, n_mm__wall] of [[0.4, 0.5], [0.3, 0.8], [0.4, 1.2]]){
        let o_mesh = f_o_mesh__object(a_n_tri__ball, { ...o_param, n_mm__wall }, o_bulb, n_mm__voxel, 180);
        // Above its middle, away from the stem: each point by how far it is from the ball's middle.
        let n_out__min = Infinity, n_out__max = 0, n_in__min = Infinity, n_in__max = 0;
        for(let n_off = n_cnt__neck * 3; n_off < o_mesh.a_n_pos.length; n_off += 3){
            if(o_mesh.a_n_pos[n_off + 2] < 29){ continue; }
            let n_r = Math.hypot(o_mesh.a_n_pos[n_off], o_mesh.a_n_pos[n_off + 1], o_mesh.a_n_pos[n_off + 2] - 25);
            if(n_r > 15 - n_mm__wall / 2){
                n_out__min = Math.min(n_out__min, n_r); n_out__max = Math.max(n_out__max, n_r);
            } else {
                n_in__min = Math.min(n_in__min, n_r); n_in__max = Math.max(n_in__max, n_r);
            }
        }
        // The ball's own triangles lie up to 0.01 inside its radius.
        assert(n_out__min > 15 - 0.01 - 0.03 && n_out__max < 15 + 0.03, `outside from ${n_out__min} to ${n_out__max}`);
        // The inside, on the same grid.
        assert(n_in__min > 15 - n_mm__wall - 0.3 * n_mm__voxel && n_in__max < 15 - n_mm__wall + 0.3 * n_mm__voxel, `inside from ${n_in__min} to ${n_in__max}, wall ${n_mm__wall}`);
        // As much plastic as a ball's shell, the stem's tube and the neck have, within a tenth.
        let n_mm3__shell = 4 / 3 * Math.PI * (15 ** 3 - (15 - n_mm__wall) ** 3);
        assert(o_mesh.o_stat.n_mm3 > n_mm3__shell && o_mesh.o_stat.n_mm3 < 1.1 * n_mm3__shell + 450, `${o_mesh.o_stat.n_mm3} mm3 against a shell of ${n_mm3__shell}`);
        assertAlmostEquals(f_o_size(o_mesh).n_z, 40, 0.03);
        assertAlmostEquals(o_mesh.o_stat.n_gram, o_mesh.o_stat.n_mm3 * 0.00124, 1e-6);
    }
});

Deno.test('a box keeps its flat sides, and inside out or with a gap it is the same bulb', function(){
    let n_mm__voxel = 0.4;
    let o_box = f_o_mesh__object(f_a_n_tri__box([-12, -12, 10], [12, 12, 34]), o_param, o_bulb, n_mm__voxel, 180);
    let n_cnt__top = 0, n_mm__out = 0, n_mm__in = 0;
    let n_z__stem = n_mm__base_z + o_param.n_mm__stem;
    for(let n_off = n_cnt__neck * 3; n_off < o_box.a_n_pos.length; n_off += 3){
        let [n_x, n_y, n_z] = o_box.a_n_pos.subarray(n_off, n_off + 3);
        // How far outside the box a point is; below 0 inside it, by how far from its nearest side.
        let n_mm = Math.max(Math.abs(n_x) - 12, Math.abs(n_y) - 12, n_z - 34);
        if(n_z < n_z__stem + n_r__neck + 1){
            // Down here is the stem too: a tube up to 10, then a cone that narrows as it rises. Where the
            // two meet, the corner between them is filled by less than half a grid step.
            assert(n_mm < 0.2 || Math.hypot(n_x, n_y) - (n_r__neck - Math.max(0, n_z - n_z__stem)) < 0.2, `a point at ${n_x}, ${n_y}, ${n_z}`);
        } else if(n_mm > -0.3){
            // The outside, above the stem: on the box. Its edges are rounded by a fifth of a grid step.
            n_mm__out = Math.max(n_mm__out, n_mm);
            n_mm__in = Math.max(n_mm__in, -n_mm);
            if(n_z > 33.97){ n_cnt__top++; }
        } else {
            // The inside, a wall deeper. The grid rounds its corners: the wall is thicker there.
            assert(n_mm > -o_param.n_mm__wall - 1.1 * n_mm__voxel && n_mm < -o_param.n_mm__wall + 0.45 * n_mm__voxel, `the box's inside is ${-n_mm} deep at ${n_x}, ${n_y}, ${n_z}`);
        }
    }
    assert(n_mm__out < 0.05 && n_mm__in < 0.1, `the box's outside is up to ${n_mm__out} outside the box and ${n_mm__in} inside it`);
    assert(n_cnt__top > 2000, `${n_cnt__top} points on the box's top`);
    let o_ball = f_o_mesh__object(a_n_tri__ball, o_param, o_bulb, 0.4, 180);
    let o_ball__inside_out = f_o_mesh__object(f_a_n_tri__ball(15, [0, 0, 25], 48, true), o_param, o_bulb, 0.4, 180);
    assertAlmostEquals(o_ball__inside_out.o_stat.n_mm3, o_ball.o_stat.n_mm3, 0.5);
    // A gap of three of its 96 gores: the three directions of the grid's lines close it.
    let o_ball__gap = f_o_mesh__object(a_n_tri__ball.slice(0, a_n_tri__ball.length - 9 * 300), o_param, o_bulb, 0.4, 180);
    assert(Math.abs(o_ball__gap.o_stat.n_mm3 / o_ball.o_stat.n_mm3 - 1) < 0.2, `with a gap ${o_ball__gap.o_stat.n_mm3} mm3, without ${o_ball.o_stat.n_mm3}`);
    assertAlmostEquals(f_o_size(o_ball__gap).n_z, 40, 0.3);
});

Deno.test('the neck is every bulb\'s, and both surfaces end on it', function(){
    let o_mesh = f_o_mesh__object(a_n_tri__ball, o_param, o_bulb, 0.4, 180);
    assertEquals(o_mesh.n_cnt__fixed, n_cnt__neck);
    // The bore's rings: the thread of neck.module.js, a row every 0.1 mm.
    for(let n_row = 0; n_row <= n_cnt__neck_row; n_row++){
        for(let n_c = 0; n_c < 180; n_c++){
            let n_idx = n_row * 180 + n_c;
            let n_z = o_mesh.a_n_pos[n_idx * 3 + 2];
            assertAlmostEquals(n_z, n_row * 0.1, 1e-5);
            assertAlmostEquals(Math.hypot(o_mesh.a_n_pos[n_idx * 3], o_mesh.a_n_pos[n_idx * 3 + 1]), f_n_radius__bore(o_bulb, n_z, n_tau * n_c / 180), 1e-5);
        }
    }
    // The outside's two rings, at the bed and at the neck's top.
    for(let n_idx = (n_cnt__neck_row + 1) * 180; n_idx < n_cnt__neck; n_idx++){
        assertAlmostEquals(Math.hypot(o_mesh.a_n_pos[n_idx * 3], o_mesh.a_n_pos[n_idx * 3 + 1]), n_r__neck, 1e-5);
        assert([0, o_bulb.n_mm__neck_scl_z].some(function(n_z){ return Math.abs(o_mesh.a_n_pos[n_idx * 3 + 2] - n_z) < 1e-5; }));
    }
    // On the grid's lowest plane: a circle as wide as the neck, and one a wall inside it.
    let n_cnt__out = 0, n_cnt__in = 0;
    for(let n_idx = n_cnt__neck; n_idx < o_mesh.a_n_pos.length / 3; n_idx++){
        if(Math.abs(o_mesh.a_n_pos[n_idx * 3 + 2] - n_mm__base_z) > 1e-4){ continue; }
        let n_r = Math.hypot(o_mesh.a_n_pos[n_idx * 3], o_mesh.a_n_pos[n_idx * 3 + 1]);
        if(Math.abs(n_r - n_r__neck) < 0.01){ n_cnt__out++; } else if(Math.abs(n_r - (n_r__neck - o_param.n_mm__wall)) < 0.03){ n_cnt__in++; } else { throw new Error(`a point on the grid's lowest plane at radius ${n_r}`); }
    }
    assert(n_cnt__out > 50 && n_cnt__in > 25, `${n_cnt__out} and ${n_cnt__in} points on the grid's lowest plane`);
    assertEquals(n_mm__base_z, o_bulb.n_mm__neck_scl_z + 1, 'the grid starts 1 mm above the neck');
});

Deno.test('what does not hang together with the stem is left out, and the page is told', function(){
    let o_loose = f_o_mesh__object(f_a_n_tri__joined(a_n_tri__ball, f_a_n_tri__ball(3, [0, 0, 46])), o_param, o_bulb, 0.4, 180);
    f_check_closed(o_loose.a_n_pos, o_loose.a_n_idx, 'a ball and a loose one');
    assertAlmostEquals(f_o_size(o_loose).n_z, 40, 0.03, 'the loose ball is still there');
    assertAlmostEquals(o_loose.o_stat.n_mm3__loose, 4 / 3 * Math.PI * 3 ** 3, 25);
    assertEquals(o_loose.o_stat.b_touching, true);

    // The stem alone: a tube closed by a cone, 2 + 5 above the grid's lowest plane.
    let o_none = f_o_mesh__object(new Float32Array(0), o_param, o_bulb, 0.4, 180);
    f_check_closed(o_none.a_n_pos, o_none.a_n_idx, 'nothing');
    assertEquals([o_none.o_stat.b_object, o_none.o_stat.b_touching, o_none.o_stat.n_mm3__loose], [false, false, 0]);
    // Its point is finer than the grid: half a step is missing.
    assertAlmostEquals(f_o_size(o_none).n_z, n_mm__base_z + o_param.n_mm__stem + n_r__neck, 0.25);
    assertAlmostEquals(f_o_size(o_none).n_r, n_r__neck, 0.02);

    // Narrower than the stem, so the grid is the same as without it.
    let o_apart = f_o_mesh__object(f_a_n_tri__ball(4, [0, 0, 40]), o_param, o_bulb, 0.4, 180);
    f_check_closed(o_apart.a_n_pos, o_apart.a_n_idx, 'a ball above the stem');
    assertEquals([o_apart.o_stat.b_object, o_apart.o_stat.b_touching], [true, false]);
    assertAlmostEquals(f_o_size(o_apart).n_z, f_o_size(o_none).n_z, 1e-3);
    assertAlmostEquals(o_apart.o_stat.n_mm3, o_none.o_stat.n_mm3, 0.5);

    // A higher stem reaches it.
    let o_reached = f_o_mesh__object(f_a_n_tri__ball(4, [0, 0, 40]), { ...o_param, n_mm__stem: 30 }, o_bulb, 0.4, 180);
    f_check_closed(o_reached.a_n_pos, o_reached.a_n_idx, 'a ball on a high stem');
    assertEquals(o_reached.o_stat.b_touching, true);
    assertAlmostEquals(f_o_size(o_reached).n_z, 44, 0.03);
});

Deno.test('a very large object gets a coarser grid than asked for', function(){
    let o_mesh = f_o_mesh__object(f_a_n_tri__ball(150, [0, 0, 160], 24), o_param, o_bulb, 0.3, 180);
    f_check_closed(o_mesh.a_n_pos, o_mesh.a_n_idx, 'a ball of 300');
    assert(o_mesh.o_stat.n_mm__voxel > 0.9 && o_mesh.o_stat.n_mm__voxel < 1.3, `a grid of ${o_mesh.o_stat.n_mm__voxel}`);
    assertEquals(o_mesh.o_stat.n_mm__voxel, o_mesh.o_stat.n_mm__voxel_min);
    assert(f_o_mesh__object(a_n_tri__ball, o_param, o_bulb, 0.4, 180).o_stat.n_mm__voxel_min < 0.2);
});

Deno.test('an object\'s colours are its bulb\'s, through the wall', function(){
    let f_a_n_col__at = function(o_mesh, n_idx){ return [...o_mesh.a_n_col.subarray(n_idx * 3, n_idx * 3 + 3)]; };
    // A box on the stem, each of its six sides in a colour of its own: two triangles a side.
    let a_a_n_col__side = [[0, 255, 255], [255, 0, 255], [255, 255, 0], [0, 0, 255], [0, 255, 0], [255, 0, 0]];
    let a_n_tri = f_a_n_tri__box([-12, -12, 10], [12, 12, 34]);
    let a_n_col__corner = f_a_n_col__of_tri(a_n_tri, function(n_x, n_y, n_z, n_tri){ return a_a_n_col__side[n_tri >> 1]; });
    for(let n_mm__voxel of [0.8, 0.4]){
        let o_mesh = f_o_mesh__object(a_n_tri, o_param, o_bulb, n_mm__voxel, 180, a_n_col__corner);
        f_check_closed(o_mesh.a_n_pos, o_mesh.a_n_idx, 'a box in colours');
        assertEquals(o_mesh.a_n_col.length, o_mesh.a_n_pos.length);
        // The same bulb as without colours.
        let o_mesh__plain = f_o_mesh__object(a_n_tri, o_param, o_bulb, n_mm__voxel, 180);
        assertEquals([o_mesh__plain.a_n_col, o_mesh__plain.a_n_pos.length, o_mesh__plain.a_n_idx.length], [null, o_mesh.a_n_pos.length, o_mesh.a_n_idx.length]);
        let n_cnt__side = 0, n_cnt__inside = 0, n_cnt__stem = 0;
        for(let n_idx = 0; n_idx < o_mesh.a_n_pos.length / 3; n_idx++){
            let [n_x, n_y, n_z] = o_mesh.a_n_pos.subarray(n_idx * 3, n_idx * 3 + 3);
            if(n_idx < n_cnt__neck){
                assertEquals(f_a_n_col__at(o_mesh, n_idx), [247, 242, 230], 'the neck is plain');
            } else if(n_z > 14 && n_z < 30 && Math.abs(n_y) < 9 && Math.abs(n_x) > 10){
                // The sides to the right and to the left, away from their edges: on the outside, and one wall deeper.
                assertEquals(f_a_n_col__at(o_mesh, n_idx), n_x > 0 ? [255, 0, 0] : [0, 255, 0], `at ${n_x}, ${n_y}, ${n_z}`);
                if(Math.abs(n_x) > 11.8){ n_cnt__side++; } else { n_cnt__inside++; }
            } else if(n_z > 33.5 && Math.abs(n_x) < 9 && Math.abs(n_y) < 9){
                assertEquals(f_a_n_col__at(o_mesh, n_idx), [255, 0, 255], `on top, at ${n_x}, ${n_y}, ${n_z}`);
            } else if(n_z < 9 && Math.hypot(n_x, n_y) > 4.8){
                // Below the box the stem shows: here, between the neck and the box, away from the box's bottom.
                assertEquals(f_a_n_col__at(o_mesh, n_idx), [247, 242, 230], 'the stem is plain');
                n_cnt__stem++;
            }
        }
        assert(n_cnt__side > 100 && n_cnt__inside > 20 && n_cnt__stem > 20, `${n_cnt__side} points on the sides, ${n_cnt__inside} inside, ${n_cnt__stem} on the stem`);
    }

    // A ball that goes from blue on the left to red on the right, and is the greener the higher.
    let f_a_n_col = function(n_x, n_y, n_z){ return [255 * (n_x + 15) / 30, 255 * (n_z - 10) / 30, 255 * (15 - n_x) / 30]; };
    let o_ball = f_o_mesh__object(a_n_tri__ball, o_param, o_bulb, 0.4, 180, f_a_n_col__of_tri(a_n_tri__ball, f_a_n_col));
    let n_off__worst = 0, n_off__worst_inside = 0;
    for(let n_idx = n_cnt__neck; n_idx < o_ball.a_n_pos.length / 3; n_idx++){
        let [n_x, n_y, n_z] = o_ball.a_n_pos.subarray(n_idx * 3, n_idx * 3 + 3);
        // Above where the stem and the ball meet.
        if(n_z < 17){ continue; }
        let n_r = Math.hypot(n_x, n_y, n_z - 25);
        // What the ball has there, on its surface straight outwards.
        let a_n_col = f_a_n_col(n_x * 15 / n_r, n_y * 15 / n_r, 25 + (n_z - 25) * 15 / n_r);
        let n_off = Math.max(...a_n_col.map(function(n_val, n_k){ return Math.abs(n_val - o_ball.a_n_col[n_idx * 3 + n_k]); }));
        if(n_r > 14.8){ n_off__worst = Math.max(n_off__worst, n_off); } else { n_off__worst_inside = Math.max(n_off__worst_inside, n_off); }
    }
    // A step of the grid is 3.4 of 255 here.
    assert(n_off__worst < 7 && n_off__worst_inside < 14, `colours off by up to ${n_off__worst} of 255 outside, ${n_off__worst_inside} inside`);

    // Where its surface has a hole the bulb is closed over it, in the colour around the hole.
    let a_n_hole = [12, 9, 25];
    let a_n_tri__hole = Float32Array.from(Array.from({ length: a_n_tri__ball.length / 9 }, function(v, n_tri){ return a_n_tri__ball.subarray(n_tri * 9, n_tri * 9 + 9); }).filter(function(a_n){
        return Math.hypot(...a_n_hole.map(function(n_val, n_k){ return (a_n[n_k] + a_n[3 + n_k] + a_n[6 + n_k]) / 3 - n_val; })) > 2.5;
    }).flatMap(function(a_n){ return [...a_n]; }));
    assert(a_n_tri__hole.length < a_n_tri__ball.length - 9 * 10, 'no hole was made');
    let o_hole = f_o_mesh__object(a_n_tri__hole, o_param, o_bulb, 0.4, 180, f_a_n_col__of_tri(a_n_tri__hole, function(){ return [200, 30, 30]; }));
    f_check_closed(o_hole.a_n_pos, o_hole.a_n_idx, 'a ball in one colour with a hole');
    let n_cnt__over_hole = 0;
    for(let n_idx = n_cnt__neck; n_idx < o_hole.a_n_pos.length / 3; n_idx++){
        let a_n = o_hole.a_n_pos.subarray(n_idx * 3, n_idx * 3 + 3);
        if(a_n[2] < 17){ continue; }
        if(Math.hypot(a_n[0] - a_n_hole[0], a_n[1] - a_n_hole[1], a_n[2] - a_n_hole[2]) < 1.5){ n_cnt__over_hole++; }
        assertEquals([...o_hole.a_n_col.subarray(n_idx * 3, n_idx * 3 + 3)], [200, 30, 30], `at ${[...a_n]}`);
    }
    assert(n_cnt__over_hole > 20, `only ${n_cnt__over_hole} points over the hole`);
});

// A file's bytes and name, and an MTL's text beside it if given.
let f_o_object__from_file = function(a_n_u8, s_name, s_mtl = null){
    return f_o_object__from_file_async({ a_n_u8, s_name }, s_mtl === null ? [] : [{ s_name: 'model.mtl', a_n_u8: new TextEncoder().encode(s_mtl) }]);
};

Deno.test('files of triangles are read: STL as numbers and as text, OBJ with its colours; and written as STL', async function(){
    let a_n_tri = f_a_n_tri__box([0, 0, 0], [10, 20, 30]);
    let a_n_u8__stl = new Uint8Array(f_o_buffer__stl_of_tri(a_n_tri));
    assertEquals(a_n_u8__stl.length, 84 + 50 * 12);
    let o_stl = await f_o_object__from_file(a_n_u8__stl, 'box.stl');
    assertEquals([...o_stl.a_n_tri], [...a_n_tri]);
    assertEquals([o_stl.a_n_col, o_stl.s_note, o_stl.a_s_item], [null, '', null]);
    // The normal of the first triangle, which lies in the box's bottom and faces down.
    assertEquals([0, 4, 8].map(function(n_off){ return new DataView(a_n_u8__stl.buffer).getFloat32(84 + n_off, true); }), [0, 0, -1]);
    assertEquals(f_o_bound(a_n_tri), { a_n_min: [0, 0, 0], a_n_max: [10, 20, 30] });

    let s_text = 'solid box\n' + Array.from({ length: 12 }, function(v, n_it){
        let a_n = a_n_tri.subarray(n_it * 9, n_it * 9 + 9);
        return ` facet normal 0 0 0\n  outer loop\n   vertex ${a_n[0]} ${a_n[1]} ${a_n[2]}\n   vertex ${a_n[3]} ${a_n[4]} ${a_n[5]}\n   vertex ${a_n[6].toExponential()} ${a_n[7]} ${a_n[8]}\n  endloop\n endfacet\n`;
    }).join('') + 'endsolid box\n';
    assertEquals([...(await f_o_object__from_file(new TextEncoder().encode(s_text), 'box.stl')).a_n_tri], [...a_n_tri]);

    // Squares become two triangles each; a corner may have more than a point, and may count from the end.
    let s_obj = '# a box\nv 0 0 0\nv 10 0 0\nv 10 20 0\nv 0 20 0\nv 0 0 30\nv 10 0 30\nv 10 20 30\nv 0 20 30\nvn 0 0 1\n'
        + 'f 1 4 3 2\nf 5/1/1 6/2/1 7/3/1 8/4/1\nf 1//1 2//1 6//1 5//1\nf 2 3 7 6\nf 3 4 8 7\nf -5 -8 -4 -1\n';
    let o_object = await f_o_object__from_file(new TextEncoder().encode(s_obj), 'box.obj');
    assertEquals([o_object.a_n_col, o_object.s_note], [null, ''], 'an OBJ without colours');
    let a_n_tri__obj = o_object.a_n_tri;
    assertEquals(a_n_tri__obj.length, 12 * 9);
    assertEquals(f_o_bound(a_n_tri__obj), { a_n_min: [0, 0, 0], a_n_max: [10, 20, 30] });
    assertEquals([...a_n_tri__obj.subarray(0, 18)], [0, 0, 0, 0, 20, 0, 10, 20, 0, 0, 0, 0, 10, 20, 0, 10, 0, 0]);
    assertEquals([...a_n_tri__obj.subarray(-18)], [0, 20, 0, 0, 0, 0, 0, 0, 30, 0, 20, 0, 0, 0, 30, 0, 20, 30], 'corners counted from the end');
    let o_mesh = f_o_mesh__object(a_n_tri__obj.map(function(n_val, n_idx){ return n_idx % 3 === 2 ? n_val + 9 : n_val - 5; }), o_param, o_bulb, 0.8, 180);
    f_check_closed(o_mesh.a_n_pos, o_mesh.a_n_idx, 'the bulb of an OBJ');

    // An OBJ's colours: a point's own, from 0 to 1 or from 0 to 255, or in ZBrush's lines; else its material's.
    let f_o_read = async function(s_obj, s_mtl = null){
        let o = await f_o_object__from_file(new TextEncoder().encode(s_obj), 'model.obj', s_mtl);
        return { n_cnt: o.a_n_tri.length / 9, a_n_col: o.a_n_col && [...o.a_n_col], s_note: o.s_note };
    };
    let s_point = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nv 1 1 0\n';
    assertEquals(await f_o_read('v 0 0 0 1 0 0\nv 1 0 0 0 1.0 0\nv 0 1 0 0 0 0.5\nf 1 2 3\n'), { n_cnt: 1, a_n_col: [255, 0, 0, 0, 255, 0, 0, 0, 128], s_note: '' });
    assertEquals((await f_o_read('v 0 0 0 255 0 0\nv 1 0 0 0 128 0\nv 0 1 0\nf 3 2 1\n')).a_n_col, [255, 255, 255, 0, 128, 0, 255, 0, 0], 'a point without a colour is white');
    assertEquals((await f_o_read(s_point + '#MRGB ffff0000ff00ff00\n#MRGB ff0000ff00102030\nf 1 2 3 4\n')).a_n_col, [255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 0, 0, 0, 0, 255, 16, 32, 48]);
    let s_material = 'mtllib two colours.mtl\n' + s_point + 'usemtl red one\nf 1 2 3\nusemtl blue\nf 2 4 3\n';
    assertEquals(await f_o_read(s_material), { n_cnt: 2, a_n_col: null, s_note: 'Its colours are in two colours.mtl: choose both files together to have them.' });
    assertEquals(await f_o_read(s_material, '# two\nnewmtl red one\nKa 0 0 0\nKd 1 0 0\n\nnewmtl blue\r\nKd 0 0.2 1.000\r\n'),
        { n_cnt: 2, a_n_col: [255, 0, 0, 255, 0, 0, 255, 0, 0, 0, 51, 255, 0, 51, 255, 0, 51, 255], s_note: '' });
    assertEquals((await f_o_read(s_material, 'newmtl blue\nKd 0 0 1\n')).a_n_col.slice(0, 9), Array(9).fill(255), 'a material the MTL does not have is white');
    // A point's own colour goes before its material's.
    assertEquals((await f_o_read('v 0 0 0 0 1 0\nv 1 0 0 0 1 0\nv 0 1 0 1 1 0\nusemtl blue\nf 1 2 3\n', 'newmtl blue\nKd 0 0 1\n')).a_n_col, [0, 255, 0, 0, 255, 0, 255, 255, 0]);
    // One colour alone is none, and neither is a picture.
    assertEquals(await f_o_read('v 0 0 0 0.5 0.5 0.5\nv 1 0 0 0.5 0.5 0.5\nv 0 1 0 0.5 0.5 0.5\nf 1 2 3\n'), { n_cnt: 1, a_n_col: null, s_note: '' });
    assertEquals(await f_o_read(s_point + 'usemtl skin\nf 1 2 3\nf 2 4 3\n', 'newmtl skin\nKd 0.8 0.8 0.8\n'), { n_cnt: 2, a_n_col: null, s_note: '' });
    // A picture that is not chosen with it: said so, and its material's colour meanwhile.
    let o_picture = await f_o_read(s_material, 'newmtl red one\nKd 1 1 1\nmap_Kd -s 1 1 1 skin.png\nnewmtl blue\nKd 1 1 1\n');
    assert(o_picture.a_n_col === null && /Its colours are in a picture, skin\.png: choose it together/.test(o_picture.s_note), o_picture.s_note);
    // The OBJ this app writes of a bulb is read with the colours it had.
    let a_n_col__written = Uint8Array.from([255, 0, 0, 0, 128, 255, 1, 2, 3, 247, 242, 230]);
    let o_blob = f_o_blob__obj(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]), new Uint32Array([0, 1, 2, 0, 2, 3]), a_n_col__written);
    let o_again = await f_o_object__from_file(new Uint8Array(await o_blob.arrayBuffer()), 'bulb.obj');
    assertEquals([...o_again.a_n_col], [255, 0, 0, 0, 128, 255, 1, 2, 3, 255, 0, 0, 1, 2, 3, 247, 242, 230]);

    for(let [s_what, a_n_u8, o_regex] of [
        ['no model', new TextEncoder().encode('this is no model at all'), /none of STL, OBJ, 3MF, GLB, glTF and PLY/],
        ['an empty OBJ', new TextEncoder().encode('v 0 0 0\nv 1 0 0\nv 0 1 0\n'), /no triangles/],
        ['an OBJ with a corner that is not there', new TextEncoder().encode('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 9\n'), /corner that is not there/],
        ['an STL of text cut short', new TextEncoder().encode('solid x\n facet normal 0 0 1\n  outer loop\n   vertex 0 0 0\n   vertex 1 0 0\n'), /middle of a triangle/],
        ['an STL with a corner that is no number', new TextEncoder().encode('solid x\n facet normal 0 0 1\n  outer loop\n   vertex 0 0 0\n   vertex 1 0 0\n   vertex 0 nan 0\n  endloop\n endfacet\n'), /not a number/],
        ['a file that is empty', new Uint8Array(0), /none of STL, OBJ, 3MF, GLB, glTF and PLY/]
    ]){
        let s_message = null;
        try{ await f_o_object__from_file(a_n_u8, 'model.stl'); } catch(o_error){ s_message = o_error.message; }
        assert(s_message !== null && o_regex.test(s_message), `${s_what}: ${s_message}`);
    }
});
