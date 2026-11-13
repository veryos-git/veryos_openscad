// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The egg: its heightmap, its mesh at the ends of every slider, and each brand's logo.
// The scale patterns are not in git, so a small heightmap of the tests' own stands in.

import { assert, assertEquals, assertAlmostEquals, f_s_path, f_check_closed } from './check.js';
import { f_o_image__from_png, f_o_image__working, f_o_image__blurred, f_o_tile, f_n_height } from '../heightmap.module.js';
import { f_o_field__logo, f_n_field } from '../logo.module.js';
import { f_o_param__default, f_o_mesh__egg } from '../egg.module.js';

let o_lamp = JSON.parse(Deno.readTextFileSync(f_s_path('part/lamp.json')));

let f_o_image__test = async function(){
    return f_o_image__from_png(await Deno.readFile(f_s_path('test/tile_16bit.png')));
};
let f_o_tile__test = async function(n_px__sigma = 0){
    return f_o_tile(f_o_image__blurred(f_o_image__working(await f_o_image__test()), n_px__sigma));
};

Deno.test('the PNG decoder reads the same values as PIL', async function(){
    let o_image = await f_o_image__test();
    assertEquals([o_image.n_scl_x, o_image.n_scl_y], [96, 64]);
    let n_sum = 0, n_min = Infinity, n_max = -Infinity;
    for(let n_val of o_image.a_n_val){
        n_sum += n_val;
        n_min = Math.min(n_min, n_val);
        n_max = Math.max(n_max, n_val);
    }
    // numpy on the same file: mean 32000.0, from 3206 to 60794, and 57197 at row 5, column 7.
    assertAlmostEquals(n_sum / o_image.a_n_val.length, 32000, 1e-6);
    assertEquals([n_min, n_max, o_image.a_n_val[5 * 96 + 7]], [3206, 60794, 57197]);
});

Deno.test('the tile is normalized, stays seamless when blurred, and has a pyramid', async function(){
    let o_tile = await f_o_tile__test(2);
    let o_level = o_tile.a_o_level[0];
    assertEquals(o_level.n_scl_x, 96);
    assert(o_tile.a_o_level.length >= 3);
    let n_min = Infinity, n_max = -Infinity;
    for(let n_val of (await f_o_tile__test()).a_o_level[0].a_n_val){
        n_min = Math.min(n_min, n_val);
        n_max = Math.max(n_max, n_val);
    }
    assertEquals([n_min, n_max], [0, 1]);
    assertAlmostEquals(f_n_height(o_level, 0.25, 0.75), f_n_height(o_level, 3.25, -2.25), 1e-6);
    // Across the wrap, neighbours differ about as much as elsewhere.
    let n_seam = 0, n_inside = 0;
    for(let n_it = 0; n_it < 200; n_it++){
        let n_v = n_it / 200;
        n_seam += Math.abs(f_n_height(o_level, 0.9995, n_v) - f_n_height(o_level, 1.0005, n_v));
        n_inside += Math.abs(f_n_height(o_level, 0.4995, n_v) - f_n_height(o_level, 0.5005, n_v));
    }
    assert(n_seam < 3 * n_inside + 0.01, `seam ${n_seam} against ${n_inside}`);
});

let a_o_case = [
    { s_label: 'default', o_change: {} },
    { s_label: 'with the VeryOS logo', o_change: { b_logo: true }, s_brand: 'veryos' },
    { s_label: 'with the TraceTrove logo', o_change: { b_logo: true }, s_brand: 'tracetrove' },
    { s_label: 'vase mode', o_change: { b_vase: true } },
    { s_label: 'smallest', o_change: { n_mm__egg_scl_x: 80, n_mm__egg_scl_z: 95, n_nor__point: 0.02, n_mm__relief: 3 } },
    { s_label: 'largest, sharp', o_change: { n_mm__egg_scl_x: 240, n_mm__egg_scl_z: 340, n_nor__point: 0.2, n_deg__tip: 45, n_mm__shell: 2, n_cnt__repeat: 12 } },
    { s_label: 'round tip', o_change: { n_deg__tip: 75, n_mm__relief: 5, b_flip: true, n_nor__stretch: 0.5, n_nor__shift: 0.37 } },
    { s_label: 'no relief', o_change: { n_mm__relief: 0 } },
    { s_label: 'no pattern', o_change: {}, b_smooth: true },
    { s_label: 'one tile, a large logo high up', o_change: { n_cnt__repeat: 1, b_logo: true, n_nor__logo_z: 0.6, n_mm__logo_scl_y: 45 }, s_brand: 'veryos' }
];

for(let o_case of a_o_case){
    Deno.test(`the egg is closed and right way out: ${o_case.s_label}`, async function(){
        let o_param = { ...f_o_param__default(), ...o_case.o_change };
        let o_mesh = f_o_mesh__egg(o_param, o_case.b_smooth ? null : await f_o_tile__test(), o_lamp, 1.5, 120, o_case.s_brand);
        f_check_closed(o_mesh.a_n_pos, o_mesh.a_n_idx, o_case.s_label);
        assert(o_mesh.o_stat.n_mm3 > 0, 'the mesh is inside out');
        let n_z__min = Infinity, n_z__max = -Infinity;
        for(let n_off = 2; n_off < o_mesh.a_n_pos.length; n_off += 3){
            n_z__min = Math.min(n_z__min, o_mesh.a_n_pos[n_off]);
            n_z__max = Math.max(n_z__max, o_mesh.a_n_pos[n_off]);
        }
        assertEquals(n_z__min, 0);
        assertAlmostEquals(n_z__max, o_mesh.o_stat.n_mm__scl_z, 1e-3);
        assertAlmostEquals(o_mesh.o_stat.n_mm__scl_z, o_param.n_mm__egg_scl_z, 0.5, 'height asked for');
        // The thread's points come first, and no setting moves them.
        let o_other = f_o_mesh__egg(f_o_param__default(), null, o_lamp, 1.5, 120);
        assertEquals(o_mesh.n_cnt__fixed, o_other.n_cnt__fixed);
        for(let n_off = 0; n_off < o_mesh.n_cnt__fixed * 3; n_off++){ assert(o_mesh.a_n_pos[n_off] === o_other.a_n_pos[n_off], 'the thread has moved'); }
    });
}

Deno.test('the sliders mean what they say', async function(){
    let o_tile = await f_o_tile__test();
    let o_param = f_o_param__default();
    let o_smooth = f_o_mesh__egg({ ...o_param, n_mm__relief: 0 }, o_tile, o_lamp, 0.8, 120);
    assertAlmostEquals(o_smooth.o_stat.n_mm__scl_x, o_param.n_mm__egg_scl_x, 0.05);
    assertAlmostEquals(o_smooth.o_stat.n_mm__wall_min, o_param.n_mm__shell, 1e-6);
    assertAlmostEquals(o_smooth.o_stat.n_mm__wall_max, o_param.n_mm__shell, 1e-6);

    let o_relief = f_o_mesh__egg(o_param, o_tile, o_lamp, 0.8, 120);
    // Relief is outward only, at most the height set, on top of the shell.
    assert(o_relief.o_stat.n_mm__wall_max <= o_param.n_mm__shell + o_param.n_mm__relief + 1e-3);
    assert(o_relief.o_stat.n_mm__wall_max > o_param.n_mm__shell + 0.85 * o_param.n_mm__relief);
    assertAlmostEquals(o_relief.o_stat.n_mm__wall_min, o_param.n_mm__shell, 1e-3);
    assert(o_relief.o_stat.n_mm3 > o_smooth.o_stat.n_mm3);

    // The logo goes half way through the shell, and no further.
    for(let s_brand of ['veryos', 'tracetrove']){
        let o_logo = f_o_mesh__egg({ ...o_param, n_mm__relief: 0, b_logo: true }, o_tile, o_lamp, 0.3, 120, s_brand);
        assertAlmostEquals(o_logo.o_stat.n_mm__wall_min, o_param.n_mm__shell - o_param.n_mm__logo_depth, 0.02, s_brand);
        let o_deep = f_o_mesh__egg({ ...o_param, n_mm__relief: 0, b_logo: true, n_mm__logo_depth: 1.2 }, o_tile, o_lamp, 0.3, 120, s_brand);
        assertAlmostEquals(o_deep.o_stat.n_mm__wall_min, 0.4, 0.02, `${s_brand}: a deep logo still leaves 0.4 mm`);
    }
});

Deno.test('without relief, nothing overhangs past the limits that were set', function(){
    for(let n_deg__tip of [45, 60, 75]){
        for(let [n_scl_x, n_scl_z, n_nor__point] of [[110, 145, 0.1], [200, 250, 0.2], [100, 170, 0]]){
            let o_param = { ...f_o_param__default(), n_mm__relief: 0, n_deg__tip, n_mm__egg_scl_x: n_scl_x, n_mm__egg_scl_z: n_scl_z, n_nor__point };
            // The thread's columns of a print file: fewer tilt the facets above them further.
            let o_stat = f_o_mesh__egg(o_param, null, o_lamp, 0.5, 360).o_stat;
            let n_mm2__outside = 0, n_mm2__inside = 0;
            // 3 degrees of grace: the flat facets where one ring meets a finer one.
            for(let n_deg = 48; n_deg < 91; n_deg++){ n_mm2__outside += o_stat.a_n_mm2__outside[n_deg]; }
            for(let n_deg = n_deg__tip + 3; n_deg < 91; n_deg++){ n_mm2__inside += o_stat.a_n_mm2__inside[n_deg]; }
            assert(n_mm2__outside < 0.01, `${n_scl_x}x${n_scl_z}: ${n_mm2__outside} mm2 of the outside past 48`);
            assert(n_mm2__inside < 0.5, `${n_scl_x}x${n_scl_z} tip ${n_deg__tip}: ${n_mm2__inside} mm2 of the inside past the tip's limit`);
        }
    }
});

Deno.test('each brand\'s logo clears the relief, is engraved on the front, and stands upright', async function(){
    let o_tile = await f_o_tile__test();
    // [the brand, half its logo's width at the default height of 28, a place that is engraved, one that is not]
    for(let [s_brand, n_mm__half, a_n_xy__in, a_n_xy__out] of [['veryos', 19.7, [19, 12], [19, -12]], ['tracetrove', 8.9, [0, 8], [0, -8]]]){
        let o_param = { ...f_o_param__default(), b_logo: true };
        let o_mesh = f_o_mesh__egg(o_param, o_tile, o_lamp, 0.4, 120, s_brand);
        let n_cnt__thin = 0, n_cnt__front = 0;
        for(let n_idx = 0; n_idx < o_mesh.a_n_wall.length; n_idx++){
            if(o_mesh.a_n_wall[n_idx] < o_param.n_mm__shell - 0.2){
                n_cnt__thin++;
                if(o_mesh.a_n_pos[n_idx * 3 + 1] < 0 && Math.abs(o_mesh.a_n_pos[n_idx * 3]) < n_mm__half + 1){ n_cnt__front++; }
            }
        }
        assert(n_cnt__thin > 100, `${s_brand}: nothing engraved`);
        assertEquals(n_cnt__front, n_cnt__thin, `${s_brand}: engraved beside the front`);
        // In CAD units: the V's arms end at the top, where it is widest; TraceTrove's rib
        // hangs from the top.
        let o_field = f_o_field__logo(s_brand);
        assert(f_n_field(o_field, o_field.a_n_region, ...a_n_xy__in) < 0, `${s_brand}: ${a_n_xy__in} must be engraved`);
        assert(f_n_field(o_field, o_field.a_n_region, ...a_n_xy__out) > 0, `${s_brand}: ${a_n_xy__out} must stay`);
    }
});
