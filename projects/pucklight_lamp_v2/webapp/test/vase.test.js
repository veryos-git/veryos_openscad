// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The vase: every example, the noise, the functions a script sees, any script, the
// dome, and what a script must not do.

import { assert, assertEquals, assertThrows, f_b_same, f_n_mm3, f_check_closed } from './check.js';
import { noise } from '../noise.module.js';
import { examples as o_s_example } from '../vase_example.module.js';
import { o_thread, script_functions, run_script, error_line, vase_mesh, steepest_walls, collar_top } from '../vase.module.js';

let n_tau = Math.PI * 2;
let o_template = vase_mesh(run_script(o_s_example.template));
let f_n_z__top = function(o_vase){ return o_vase.positions[o_vase.positions.length - 1]; };
let f_n_cnt__without_area = function({ positions: p, indices: t }){
    let n_cnt = 0;
    for(let n_off = 0; n_off < t.length; n_off += 3){
        let a = t[n_off] * 3, b = t[n_off + 1] * 3, c = t[n_off + 2] * 3;
        let u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
        let v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
        if(Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) < 1e-9){ n_cnt++; }
    }
    return n_cnt;
};
// A round vase of radius 40, 60 high, its corners running the given way.
let f_o_script__round = function(o_dome, n_turn = 1){
    return { n_its_layer: 20, n_its_corner: 90, ...o_dome, f_o_p: function(n_it_layer_nor, n_it_corner_nor){
        return { n_x: 40 * Math.cos(n_turn * n_it_corner_nor * n_tau), n_y: 40 * Math.sin(n_turn * n_it_corner_nor * n_tau), n_z: collar_top + 60 * n_it_layer_nor };
    } };
};

Deno.test('every example is closed, on the same thread, and above the collar', function(){
    // The thread's top ring, where a script's shape starts: the neck's radius, on a 0.2 mm layer.
    assertEquals([o_thread.n_radius, o_thread.n_z], [33.5, 6.6]);
    for(let [s_name, s_code] of Object.entries(o_s_example)){
        let o_vase = vase_mesh(run_script(s_code));
        f_check_closed(o_vase.positions, o_vase.indices, s_name);
        assert(f_b_same(o_vase.positions.subarray(0, o_vase.fixed * 3), o_template.positions.subarray(0, o_template.fixed * 3)), `${s_name}: the thread has moved`);
        for(let n_off = o_vase.fixed * 3; n_off < o_vase.positions.length; n_off += 3){
            assert(o_vase.positions[n_off + 2] >= collar_top, `${s_name}: a point is below the collar's top`);
        }
    }
    // Of each example's triangles these are the thread's and the collar's.
    assertEquals(o_template.walls[0] / 3, 17820);
    assertEquals(o_template.indices.length / 3, 18858);
});

Deno.test('noise: from -1 to 1, the same for each run of a script, another with a seed', function(){
    for(let s_name of ['simplex2', 'simplex3', 'perlin2', 'perlin3']){
        let n_low = 0, n_high = 0;
        for(let n_it = 0; n_it < 100000; n_it++){
            let n = noise[s_name](n_it * 0.137, n_it * 0.071 - 50, n_it * 0.053 + 9);
            n_low = Math.min(n_low, n);
            n_high = Math.max(n_high, n);
        }
        assert(n_low >= -1 && n_low < -0.7 && n_high <= 1 && n_high > 0.7, `${s_name}: from ${n_low} to ${n_high}`);
    }
    assertEquals(noise.perlin2(3, -7), 0);
    assertEquals(noise.perlin3(3, -7, 12), 0);
    // A script that does not seed starts on seed 0, whatever the script before it seeded.
    let s_code__unseeded = o_s_example.low_poly_noise.replace('noise.seed(1);', '');
    assert(s_code__unseeded !== o_s_example.low_poly_noise);
    let o_unseeded = vase_mesh(run_script(s_code__unseeded));
    let o_seeded = vase_mesh(run_script(o_s_example.low_poly_noise));
    assert(!f_b_same(o_seeded.positions, o_unseeded.positions), 'a seed makes the same vase');
    assert(f_b_same(vase_mesh(run_script(s_code__unseeded)).positions, o_unseeded.positions), 'a script\'s seed reached the next script');
    assert(f_b_same(vase_mesh(run_script(s_code__unseeded.replace('function f_o_p', 'noise.seed(0);\nfunction f_o_p'))).positions, o_unseeded.positions));
    // The template's examples of noise, without their //: each makes another vase, and
    // with the seed above f_o_p() yet another.
    let a_s_commented = o_s_example.template.match(/^    \/\/ (?:n_\w+ \+= noise|noise\.seed)[^;]*;/gm);
    assertEquals(a_s_commented.length, 4, 'the template\'s examples of noise');
    let f_s_uncommented = function(s){ return s.replace(/^    \/\/ /gm, '    '); };
    for(let s_commented of a_s_commented.slice(0, 3)){
        let s_code = o_s_example.template.replace(s_commented, f_s_uncommented(s_commented));
        let o_vase = vase_mesh(run_script(s_code));
        f_check_closed(o_vase.positions, o_vase.indices, s_commented);
        assert(!f_b_same(o_vase.positions, o_template.positions), `${s_commented}: changes nothing`);
        let o_reseeded = vase_mesh(run_script(s_code.replace('function f_o_p', `${f_s_uncommented(a_s_commented[3])}\nfunction f_o_p`)));
        f_check_closed(o_reseeded.positions, o_reseeded.indices, `${s_commented}, seeded`);
        assert(!f_b_same(o_reseeded.positions, o_vase.positions), `${s_commented}: the seed changes nothing`);
    }
});

Deno.test('the functions a script sees: Math\'s without Math, a shader\'s, and a script\'s own win', function(){
    assertEquals(run_script('return [sin(1), atan2(1, 2), max(1, 2), PI];'), [Math.sin(1), Math.atan2(1, 2), 2, Math.PI]);
    for(let [s_code, n_val] of [
        ['fract(3.25)', 0.25], ['fract(-0.25)', 0.75], ['mix(10, 20, 0.25)', 12.5],
        ['clamp(5, 0, 1)', 1], ['clamp(-5, 0, 1)', 0], ['clamp(0.5, 0, 1)', 0.5],
        ['smoothstep(0, 10, -1)', 0], ['smoothstep(0, 10, 2.5)', 0.15625], ['smoothstep(0, 10, 5)', 0.5], ['smoothstep(0, 10, 11)', 1],
        ['length(vec2(3, 4))', 5], ['length(vec3(2, 3, 6))', 7], ['distance(vec3(1, 2, 3), vec3(3, 5, 9))', 7],
        // With a vec2 the height does not count, whichever of the two it is.
        ['distance(vec3(1, 2, 3), vec2(4, 6))', 5], ['distance(vec2(4, 6), vec3(1, 2, 3))', 5], ['distance(vec2(1, 2), vec2(4, 6))', 5]
    ]){ assertEquals(run_script(`return ${s_code};`), n_val, s_code); }
    assertEquals(run_script('return [vec2(1, 2), vec3(1, 2, 3)];'), [{ n_x: 1, n_y: 2 }, { n_x: 1, n_y: 2, n_z: 3 }]);
    assert(Object.keys(script_functions).includes('smoothstep') && Object.keys(script_functions).includes('hypot'));
    // A script's own names take their place: scripts from before there were any have them.
    assertEquals(run_script('const sin = () => 7; const fract = 1; let length = 2;\nfunction distance() { return 3; }\nreturn sin() + fract + length + distance();'), 13);
    // The template uses them: without, with Math's own, it is the same vase.
    let s_code__math = o_s_example.template.replace('PI * 2', 'Math.PI * 2').replace(/ (sin|cos)\(/g, ' Math.$1(')
        .replace('mix(n_radius_bottom, n_radius_top, n_it_layer_nor)', 'n_radius_bottom + (n_radius_top - n_radius_bottom) * n_it_layer_nor');
    assert(!/(?<![.\w])(sin|cos|mix|PI)\b/.test(s_code__math.replace(/^\s*\/\/.*$/gm, '')), 'the template still uses one');
    assert(f_b_same(vase_mesh(run_script(s_code__math)).positions, o_template.positions));
});

Deno.test('3 to 500 corners, clockwise and counter-clockwise, starting anywhere: closed, the same volume', function(){
    for(let n_its_corner of [3, 5, 180, 500]){
        let f_o_script = function(n_turn, n_rad__start){
            return { n_its_layer: 3, n_its_corner, f_o_p: function(n_it_layer_nor, n_it_corner_nor){
                return { n_x: 40 * Math.cos(n_turn * n_it_corner_nor * n_tau + n_rad__start), n_y: 40 * Math.sin(n_turn * n_it_corner_nor * n_tau + n_rad__start), n_z: collar_top + 30 * n_it_layer_nor };
            } };
        };
        let o_plain = vase_mesh(f_o_script(1, 0));
        for(let n_turn of [1, -1]){
            let o_vase = vase_mesh(f_o_script(n_turn, 1));
            f_check_closed(o_vase.positions, o_vase.indices, `${n_its_corner} corners, turning ${n_turn}`);
            assert(Math.abs(f_n_mm3(o_vase.positions, o_vase.indices) - f_n_mm3(o_plain.positions, o_plain.indices)) < 10, `${n_its_corner} corners, turning ${n_turn}: another volume`);
        }
    }
});

Deno.test('the dome: round up to its overhang, then a cone to the tip at its height', function(){
    let o_flat = vase_mesh(f_o_script__round({}));
    assertEquals(f_n_z__top(o_flat), Math.fround(collar_top + 60));
    assert(f_b_same(vase_mesh(f_o_script__round({ n_height_dome: 0 })).positions, o_flat.positions), 'a dome of 0 is no dome');
    // The cone alone, from radius 40 at 60 degrees, is 23.09 high: lower than that, a dome is a steeper cone.
    for(let [n_height, n_overhang, n_cnt__ring, n_deg__steepest] of [[40, 60, 19, 60], [40, 45, 0, 45], [30, 45, 0, 53.13], [20, 60, 0, 63.43],
        [23.1, 60, 1, 60], [30, 89, 30, 89], [300, 60, 29, 60]]){
        for(let n_turn of [1, -1]){
            let s_label = `dome ${n_height} high, ${n_overhang} degrees, turning ${n_turn}`;
            let o_vase = vase_mesh(f_o_script__round({ n_height_dome: n_height, n_overhang_dome: n_overhang }, n_turn));
            f_check_closed(o_vase.positions, o_vase.indices, s_label);
            assertEquals(f_n_cnt__without_area(o_vase), 0, `${s_label}: a face without area`);
            assertEquals((o_vase.indices.length - o_flat.indices.length) / 3, n_cnt__ring * 90 * 2, `${s_label}: rings`);
            assert(Math.abs(f_n_z__top(o_vase) - (collar_top + 60 + n_height)) < 1e-4, `${s_label}: the tip's height`);
            // Of the dome alone: its faces follow the vase's. The steepest lies between two
            // corners, so it is a little less steep than at a corner.
            assertEquals(o_vase.walls[1], o_vase.indices.length, `${s_label}: the dome counts as a wall`);
            let { out: o_out, inward: o_inward } = steepest_walls({ ...o_vase, walls: [o_flat.walls[1], o_vase.indices.length] });
            assert(o_inward.angle <= n_deg__steepest + 0.01 && o_inward.angle > n_deg__steepest - 0.2, `${s_label}: steepest wall ${o_inward.angle}`);
            assertEquals(o_out.angle, 0, `${s_label}: a dome leans in only`);
            let a_n_pos__below = vase_mesh(f_o_script__round({}, n_turn)).positions;
            assert(f_b_same(o_vase.positions.subarray(0, a_n_pos__below.length - 3), a_n_pos__below.subarray(0, a_n_pos__below.length - 3)), `${s_label}: the dome moved the vase below it`);
        }
    }
    // Without an overhang the default is 60. A flat top does not count as a wall.
    assert(f_b_same(vase_mesh(f_o_script__round({ n_height_dome: 40 })).positions, vase_mesh(f_o_script__round({ n_height_dome: 40, n_overhang_dome: 60 })).positions));
    assertEquals(o_flat.walls[1], o_flat.indices.length - 90 * 3);
    // The round vase goes out from the thread's ring, at 33.5, to radius 40, 3 higher: an
    // overhang, whichever way its corners run. Above that it is upright. With a dome it
    // leans in as well.
    for(let n_turn of [1, -1]){
        let { out: o_out, inward: o_inward } = steepest_walls(vase_mesh(f_o_script__round({}, n_turn)));
        assert(Math.abs(o_out.angle - Math.atan(6.5 / 3) * 360 / n_tau) < 0.1 && o_out.z > collar_top && o_out.z < collar_top + 3);
        assertEquals(o_inward.angle, 0);
        let o_domed = steepest_walls(vase_mesh(f_o_script__round({ n_height_dome: 40 }, n_turn)));
        assertEquals(o_domed.out, o_out);
        assert(o_domed.inward.angle > 59.8 && o_domed.inward.z > collar_top + 60);
    }
    // On a shape that is not round, with a last layer that is not flat: closed.
    let o_star = vase_mesh({ n_its_layer: 4, n_its_corner: 10, n_height_dome: 30, f_o_p: function(n_it_layer_nor, n_it_corner_nor, n_it_layer, n_it_corner){
        let n_radius = n_it_corner % 2 ? 20 : 45;
        return { n_x: 7 + n_radius * Math.cos(n_it_corner_nor * n_tau), n_y: n_radius * Math.sin(n_it_corner_nor * n_tau), n_z: collar_top + 40 * n_it_layer_nor + (n_it_corner % 2 ? 4 : 0) };
    } });
    f_check_closed(o_star.positions, o_star.indices, 'dome on a star');
    assertEquals(f_n_cnt__without_area(o_star), 0);
});

Deno.test('scripts with mistakes are refused, with a message and their line', function(){
    let o_good = { n_its_layer: 2, n_its_corner: 4, f_o_p: function(n_it_layer_nor, n_it_corner_nor){
        return { n_x: 30 * Math.cos(n_it_corner_nor * n_tau), n_y: 30 * Math.sin(n_it_corner_nor * n_tau), n_z: 10 * n_it_layer_nor + collar_top };
    } };
    let o_square = vase_mesh(o_good);
    f_check_closed(o_square.positions, o_square.indices, 'a square');
    for(let [v_bad, o_regex] of [
        [undefined, /must return/],
        [{ ...o_good, f_o_p: 1 }, /must return/],
        [{ ...o_good, n_its_layer: 0 }, /n_its_layer/],
        [{ ...o_good, n_its_layer: 1.5 }, /n_its_layer/],
        [{ ...o_good, n_its_corner: 2 }, /n_its_corner/],
        [{ ...o_good, n_its_layer: 2000, n_its_corner: 2000 }, /more than/],
        [{ ...o_good, f_o_p: function(){ return { n_x: 1, n_y: NaN, n_z: 10 }; } }, /n_y = NaN/],
        [{ ...o_good, f_o_p: function(){ return undefined; } }, /n_x = undefined/],
        [{ ...o_good, f_o_p: function(){ return { n_x: 1, n_y: 1, n_z: 6 }; } }, /below o_thread.n_z/],
        [{ ...o_good, n_height_dome: -1 }, /n_height_dome/],
        [{ ...o_good, n_height_dome: '5' }, /n_height_dome/],
        [{ ...o_good, n_height_dome: NaN }, /n_height_dome/],
        [{ ...o_good, n_height_dome: 5, n_overhang_dome: 0 }, /n_overhang_dome/],
        [{ ...o_good, n_height_dome: 5, n_overhang_dome: 90 }, /n_overhang_dome/],
        [{ ...o_good, n_overhang_dome: 'steep' }, /n_overhang_dome/]
    ]){ assertThrows(function(){ vase_mesh(v_bad); }, o_regex); }
    assertThrows(function(){ run_script('return {'); }, /./);
    // A script cannot change what the next one sees.
    run_script('o_thread.n_z = 0;');
    assertEquals(run_script('return o_thread.n_z;'), collar_top);
    // A mistake's line: at the script's start, and inside f_o_p(), also with a name of its own.
    for(let [s_code, n_line] of [
        ['n_not_there;\nreturn {};', 1],
        ['const sin = 1;\n\nlet n = n_not_there;', 3],
        ['return { n_its_layer: 1, n_its_corner: 3, f_o_p: function(){\n    return n_not_there;\n} };', 2]
    ]){
        let o_error = null;
        try{ vase_mesh(run_script(s_code)); } catch(o){ o_error = o; }
        assert(o_error && /n_not_there/.test(o_error.message), s_code);
        assertEquals(error_line(o_error), n_line, s_code);
    }
    assertEquals(error_line(new Error('not a script\'s')), null);
});
