// deno test --allow-read --allow-run --allow-write --allow-env test/app.test.js

import { f_o_image__from_png, f_o_image__working, f_o_image__blurred, f_o_tile, f_n_height } from '../heightmap.module.js';
import { f_o_polygon__logo, f_o_field__logo, f_n_field, f_n_area__polygon, n_cad__scl_y } from '../logo.module.js';
import { f_o_param__default, f_o_mesh__egg, f_n_radius__neck } from '../egg.module.js';
import { f_o_blob__stl, f_o_blob__3mf, f_o_mesh__from_stl, f_n_crc32 } from '../export.module.js';

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertEquals = function(v_a, v_b, s_message = ''){
    let s_a = JSON.stringify(v_a), s_b = JSON.stringify(v_b);
    if(s_a !== s_b){ throw new Error(`${s_message} ${s_a} is not ${s_b}`); }
};
let assertAlmostEquals = function(n_a, n_b, n_tolerance, s_message = ''){
    if(!(Math.abs(n_a - n_b) <= n_tolerance)){ throw new Error(`${s_message} ${n_a} is not ${n_b} within ${n_tolerance}`); }
};

let s_url__app = new URL('../', import.meta.url);
let f_s_path = function(s_relative){ return decodeURI(new URL(s_relative, s_url__app).pathname); };
let o_lamp = JSON.parse(Deno.readTextFileSync(f_s_path('part/lamp.json')));
let n_tau = Math.PI * 2;

let f_o_tile__pattern = async function(n_id, n_px__sigma = 0){
    let a_n_u8 = await Deno.readFile(f_s_path(`../Tileable/MG-Tile Scale (${n_id}).png`));
    return f_o_tile(f_o_image__blurred(f_o_image__working(await f_o_image__from_png(a_n_u8)), n_px__sigma));
};

// Every edge is used once in each direction, or the mesh has a hole or a wrong face.
let f_check_watertight = function(a_n_idx, n_cnt__vertex){
    let o_edge = new Map();
    let f_add = function(n_a, n_b){
        assert(n_a !== n_b, 'degenerate triangle');
        let n_key = n_a * n_cnt__vertex + n_b;
        o_edge.set(n_key, (o_edge.get(n_key) || 0) + 1);
    };
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        f_add(a_n_idx[n_off], a_n_idx[n_off + 1]);
        f_add(a_n_idx[n_off + 1], a_n_idx[n_off + 2]);
        f_add(a_n_idx[n_off + 2], a_n_idx[n_off]);
    }
    for(let [n_key, n_cnt] of o_edge){
        let n_a = Math.floor(n_key / n_cnt__vertex), n_b = n_key % n_cnt__vertex;
        assertEquals(n_cnt, 1, `edge ${n_a}-${n_b} used ${n_cnt} times the same way`);
        assertEquals(o_edge.get(n_b * n_cnt__vertex + n_a), 1, `edge ${n_a}-${n_b} has no opposite`);
    }
};

Deno.test('the PNG decoder reads the same values as PIL', async function(){
    let a_n_u8 = await Deno.readFile(f_s_path('../Tileable/MG-Tile Scale (1).png'));
    let o_image = await f_o_image__from_png(a_n_u8);
    assertEquals([o_image.n_scl_x, o_image.n_scl_y], [2000, 2000]);
    let n_sum = 0;
    for(let n_val of o_image.a_n_val){ n_sum += n_val; }
    // numpy on the same file: mean 32896.2649705
    assertAlmostEquals(n_sum / o_image.a_n_val.length, 32896.2649705, 1e-6);
});

Deno.test('the tile is normalized, stays seamless when blurred, and has a pyramid', async function(){
    let o_tile = await f_o_tile__pattern(2, 6);
    let o_level = o_tile.a_o_level[0];
    assertEquals(o_level.n_scl_x, 1000);
    assert(o_tile.a_o_level.length >= 6);
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

Deno.test('the logo is the V3 logo from the branding folder, not another one', async function(){
    let s_path__scad = f_s_path('../../../branding/LOGO_V3/tracetrove_logo.scad');
    let s_path__stl = await Deno.makeTempFile({ suffix: '.stl' });
    let o_output = await new Deno.Command('openscad', {
        args: ['-o', s_path__stl, '--export-format', 'binstl', '-D', 'part="logo_final_flat"', '-D', 'flat_thickness=1', s_path__scad],
        stderr: 'null', stdout: 'null'
    }).output();
    assert(o_output.success, 'OpenSCAD failed');
    let o_mesh = f_o_mesh__from_stl((await Deno.readFile(s_path__stl)).buffer);
    await Deno.remove(s_path__stl);
    let n_mm3 = 0;
    for(let n_off = 0; n_off < o_mesh.a_n_idx.length; n_off += 3){
        let a = o_mesh.a_n_idx[n_off] * 3, b = o_mesh.a_n_idx[n_off + 1] * 3, c = o_mesh.a_n_idx[n_off + 2] * 3;
        let p = o_mesh.a_n_pos;
        n_mm3 += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) + p[a + 1] * (p[b + 2] * p[c] - p[b] * p[c + 2]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6;
    }
    let { a_n_xy__outline, a_n_xy__window } = f_o_polygon__logo();
    let n_area = f_n_area__polygon(a_n_xy__outline) - f_n_area__polygon(a_n_xy__window);
    assert(Math.abs(n_area / Math.abs(n_mm3) - 1) < 0.003, `area ${n_area} against ${n_mm3}`);
    assertAlmostEquals(n_cad__scl_y, 31.754, 0.01);

    let o_field = f_o_field__logo();
    // The ring is solid, the window is not, and the rib hangs from the top.
    assert(f_n_field(o_field, o_field.a_n_region, 8.5, 0) < 0, 'the ring must be engraved');
    assert(f_n_field(o_field, o_field.a_n_region, 3, -3) > 0, 'the window must stay');
    assert(f_n_field(o_field, o_field.a_n_region, 0, 8) < 0, 'the rib must be engraved');
    assert(f_n_field(o_field, o_field.a_n_region, 0, -8) > 0, 'nothing hangs below the window');
});

Deno.test('the base parts carry no VeryOS logo in the source', async function(){
    let s_scad = await Deno.readTextFile(f_s_path('../pucklight_eggV1.scad'));
    assert(!/logo_stroke|s_hole|veryos_logo/.test(s_scad));
    assert(/module logo\(height\)/.test(s_scad));
    let s_app = '';
    for(let s_file of ['egg.module.js', 'logo.module.js', 'export.module.js']){ s_app += await Deno.readTextFile(f_s_path(s_file)); }
    assert(!/veryos/i.test(s_app));
});

let a_o_case = [
    { s_label: 'default', o_change: {} },
    { s_label: 'with logo', o_change: { b_logo: true } },
    { s_label: 'vase mode', o_change: { b_vase: true } },
    { s_label: 'smallest', o_change: { n_mm__egg_scl_x: 80, n_mm__egg_scl_z: 95, n_nor__point: 0.02, n_mm__relief: 3 } },
    { s_label: 'largest, sharp', o_change: { n_mm__egg_scl_x: 240, n_mm__egg_scl_z: 340, n_nor__point: 0.2, n_deg__tip: 45, n_mm__shell: 2, n_cnt__repeat: 12 } },
    { s_label: 'round tip', o_change: { n_deg__tip: 75, n_mm__relief: 5, b_flip: true, n_nor__stretch: 0.5, n_nor__shift: 0.37 } },
    { s_label: 'no relief', o_change: { n_mm__relief: 0 } },
    { s_label: 'odd pattern', o_change: { n_id__pattern: 13, n_cnt__repeat: 1, b_logo: true, n_nor__logo_z: 0.6, n_mm__logo_scl_y: 45 } }
];

for(let o_case of a_o_case){
    Deno.test(`mesh is closed and right way out: ${o_case.s_label}`, async function(){
        let o_param = { ...f_o_param__default(), ...o_case.o_change };
        let o_tile = await f_o_tile__pattern(o_param.n_id__pattern);
        let o_mesh = f_o_mesh__egg(o_param, o_tile, o_lamp, 1.5, 120);
        let n_cnt__vertex = o_mesh.a_n_pos.length / 3;
        f_check_watertight(o_mesh.a_n_idx, n_cnt__vertex);
        for(let n_val of o_mesh.a_n_idx){ assert(n_val < n_cnt__vertex); }
        for(let n_val of o_mesh.a_n_pos){ assert(Number.isFinite(n_val)); }
        assert(o_mesh.o_stat.n_mm3 > 0, 'the mesh is inside out');
        let n_z__min = Infinity, n_z__max = -Infinity;
        for(let n_off = 2; n_off < o_mesh.a_n_pos.length; n_off += 3){
            n_z__min = Math.min(n_z__min, o_mesh.a_n_pos[n_off]);
            n_z__max = Math.max(n_z__max, o_mesh.a_n_pos[n_off]);
        }
        assertEquals(n_z__min, 0);
        assertAlmostEquals(n_z__max, o_mesh.o_stat.n_mm__scl_z, 1e-3);
        assertAlmostEquals(o_mesh.o_stat.n_mm__scl_z, o_param.n_mm__egg_scl_z, 0.5, 'height asked for');
    });
}

Deno.test('the sliders mean what they say', async function(){
    let o_tile = await f_o_tile__pattern(37);
    let o_param = f_o_param__default();
    let o_smooth = f_o_mesh__egg({ ...o_param, n_mm__relief: 0 }, o_tile, o_lamp, 0.8, 120);
    assertAlmostEquals(o_smooth.o_stat.n_mm__scl_x, o_param.n_mm__egg_scl_x, 0.05);
    assertAlmostEquals(o_smooth.o_stat.n_mm__wall_min, o_param.n_mm__shell, 1e-6);
    assertAlmostEquals(o_smooth.o_stat.n_mm__wall_max, o_param.n_mm__shell, 1e-6);

    let o_relief = f_o_mesh__egg(o_param, o_tile, o_lamp, 0.8, 120);
    // Relief is outward only, at most the height set, on top of the shell.
    assert(o_relief.o_stat.n_mm__wall_max <= o_param.n_mm__shell + o_param.n_mm__relief + 1e-3);
    assert(o_relief.o_stat.n_mm__wall_max > o_param.n_mm__shell + 0.85 * o_param.n_mm__relief);
    assertAlmostEquals(o_relief.o_stat.n_mm__wall_min, o_param.n_mm__shell, 1e-6);
    assert(o_relief.o_stat.n_mm3 > o_smooth.o_stat.n_mm3);

    // The logo goes half way through the shell, and no further.
    let o_logo = f_o_mesh__egg({ ...o_param, b_logo: true }, o_tile, o_lamp, 0.3, 120);
    assertAlmostEquals(o_logo.o_stat.n_mm__wall_min, o_param.n_mm__shell - o_param.n_mm__logo_depth, 0.02);
    let o_deep = f_o_mesh__egg({ ...o_param, b_logo: true, n_mm__logo_depth: 1.2 }, o_tile, o_lamp, 0.3, 120);
    assertAlmostEquals(o_deep.o_stat.n_mm__wall_min, 0.4, 0.02, 'a deep logo still leaves 0.4 mm');
});

Deno.test('without relief, nothing overhangs past the limits that were set', async function(){
    let o_tile = await f_o_tile__pattern(37);
    for(let n_deg__tip of [45, 60, 75]){
        for(let [n_scl_x, n_scl_z, n_nor__point] of [[110, 145, 0.1], [200, 250, 0.2], [100, 170, 0]]){
            let o_param = { ...f_o_param__default(), n_mm__relief: 0, n_deg__tip, n_mm__egg_scl_x: n_scl_x, n_mm__egg_scl_z: n_scl_z, n_nor__point };
            // The thread's columns of a print file: fewer tilt the facets above them further.
            let o_stat = f_o_mesh__egg(o_param, o_tile, o_lamp, 0.5, 360).o_stat;
            let n_mm2__outside = 0, n_mm2__inside = 0;
            // 3 degrees of grace: the flat facets where one ring meets a finer one.
            for(let n_deg = 48; n_deg < 91; n_deg++){ n_mm2__outside += o_stat.a_n_mm2__outside[n_deg]; }
            for(let n_deg = n_deg__tip + 3; n_deg < 91; n_deg++){ n_mm2__inside += o_stat.a_n_mm2__inside[n_deg]; }
            assert(n_mm2__outside < 0.01, `${n_scl_x}x${n_scl_z}: ${n_mm2__outside} mm2 of the outside past 48`);
            assert(n_mm2__inside < 0.5, `${n_scl_x}x${n_scl_z} tip ${n_deg__tip}: ${n_mm2__inside} mm2 of the inside past the tip's limit`);
        }
    }
});

Deno.test('the logo clears the scales and is engraved on the front', async function(){
    let o_tile = await f_o_tile__pattern(37);
    let o_param = { ...f_o_param__default(), b_logo: true };
    let o_mesh = f_o_mesh__egg(o_param, o_tile, o_lamp, 0.4, 120);
    let n_cnt__thin = 0, n_cnt__front = 0;
    for(let n_idx = 0; n_idx < o_mesh.a_n_wall.length; n_idx++){
        if(o_mesh.a_n_wall[n_idx] < o_param.n_mm__shell - 0.2){
            n_cnt__thin++;
            if(o_mesh.a_n_pos[n_idx * 3 + 1] < 0 && Math.abs(o_mesh.a_n_pos[n_idx * 3]) < 12){ n_cnt__front++; }
        }
    }
    assert(n_cnt__thin > 100);
    assertEquals(n_cnt__front, n_cnt__thin);
});

Deno.test('the neck is the thread of pucklight_sphereV3.scad', async function(){
    // Asks the .scad file itself, at heights and angles all over the neck.
    let a_a_n = [];
    for(let n_z = 0; n_z <= 4.8; n_z += 0.1){
        for(let n_deg = 0; n_deg < 360; n_deg += 23){ a_a_n.push([Number(n_z.toFixed(1)), n_deg]); }
    }
    let s_dir = await Deno.makeTempDir();
    await Deno.writeTextFile(`${s_dir}/neck.scad`,
        `use <${f_s_path('../pucklight_sphereV3.scad')}>\n` +
        a_a_n.map(([n_z, n_deg]) => `echo(neck_radius(${n_z}, ${n_deg}));`).join('\n'));
    let o_output = await new Deno.Command('openscad', { args: ['-o', `${s_dir}/neck.echo`, `${s_dir}/neck.scad`], stdout: 'null', stderr: 'null' }).output();
    assert(o_output.success, 'OpenSCAD failed');
    let a_n_scad = (await Deno.readTextFile(`${s_dir}/neck.echo`)).trim().split('\n').map(s => Number(s.replace('ECHO: ', '')));
    await Deno.remove(s_dir, { recursive: true });
    assertEquals(a_n_scad.length, a_a_n.length);
    a_a_n.forEach(function([n_z, n_deg], n_idx){
        assertAlmostEquals(f_n_radius__neck(o_lamp, n_z, n_deg * n_tau / 360), a_n_scad[n_idx], 1e-3, `z ${n_z} angle ${n_deg}`);
    });
});

// Follows rays from the axis to where they first hit the sockel's cup from inside.
Deno.test('the thread fits the real sockel, with the clearance all around', async function(){
    let o_mesh = f_o_mesh__from_stl((await Deno.readFile(f_s_path('part/sockel.stl'))).buffer);
    let p = o_mesh.a_n_pos;
    let n_z__seat = o_lamp.n_mm__seat_z;
    let n_gap__min = Infinity, n_gap__max = -Infinity, n_cnt__ray = 0, n_cnt__ray_sent = 0;
    let a_o_triangle = [];
    for(let n_off = 0; n_off < o_mesh.a_n_idx.length; n_off += 3){
        let a = o_mesh.a_n_idx[n_off] * 3, b = o_mesh.a_n_idx[n_off + 1] * 3, c = o_mesh.a_n_idx[n_off + 2] * 3;
        let n_z__low = Math.min(p[a + 2], p[b + 2], p[c + 2]), n_z__high = Math.max(p[a + 2], p[b + 2], p[c + 2]);
        if(n_z__high < n_z__seat - 0.01){ continue; }
        // Only the cup's wall: not the outside of the sockel.
        if(Math.hypot(p[a], p[a + 1]) > 35 && Math.hypot(p[b], p[b + 1]) > 35 && Math.hypot(p[c], p[c + 1]) > 35){ continue; }
        a_o_triangle.push({ a, b, c, n_z__low, n_z__high });
    }
    // Where the thread is whole: above its chamfer at the bed, below the cup's lead-in.
    for(let n_z__local = 1; n_z__local < 3.1; n_z__local += 0.13){
        let n_z = n_z__seat + n_z__local;
        let a_o_here = a_o_triangle.filter(o => o.n_z__low <= n_z && o.n_z__high >= n_z);
        for(let n_deg = 0; n_deg < 360; n_deg += 7){
            let n_rad = n_deg * n_tau / 360;
            let n_dx = Math.cos(n_rad), n_dy = Math.sin(n_rad);
            let n_r__wall = Infinity;
            for(let { a, b, c } of a_o_here){
                // Moeller-Trumbore from the axis.
                let e1x = p[b] - p[a], e1y = p[b + 1] - p[a + 1], e1z = p[b + 2] - p[a + 2];
                let e2x = p[c] - p[a], e2y = p[c + 1] - p[a + 1], e2z = p[c + 2] - p[a + 2];
                let hx = n_dy * e2z, hy = -n_dx * e2z, hz = n_dx * e2y - n_dy * e2x;
                let n_det = e1x * hx + e1y * hy + e1z * hz;
                if(Math.abs(n_det) < 1e-12){ continue; }
                let sx = -p[a], sy = -p[a + 1], sz = n_z - p[a + 2];
                let n_u = (sx * hx + sy * hy + sz * hz) / n_det;
                if(n_u < 0 || n_u > 1){ continue; }
                let qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
                let n_v = (n_dx * qx + n_dy * qy) / n_det;
                if(n_v < 0 || n_u + n_v > 1){ continue; }
                let n_t = (e2x * qx + e2y * qy + e2z * qz) / n_det;
                // Past the neck's bore, so the cross of ribs inside it does not count.
                if(n_t > 31.5 && n_t < n_r__wall){ n_r__wall = n_t; }
            }
            n_cnt__ray_sent++;
            if(n_r__wall === Infinity){ continue; }
            let n_gap = n_r__wall - f_n_radius__neck(o_lamp, n_z__local, n_rad);
            n_gap__min = Math.min(n_gap__min, n_gap);
            n_gap__max = Math.max(n_gap__max, n_gap);
            n_cnt__ray++;
        }
    }
    assertEquals(n_cnt__ray, n_cnt__ray_sent, 'rays that hit the cup wall');
    console.log(`thread gap ${n_gap__min.toFixed(3)} to ${n_gap__max.toFixed(3)} mm over ${n_cnt__ray} rays`);
    // neck_clearance in the .scad file is 0.3, on the radius. Chords of the mesh eat a little.
    assert(n_gap__min > 0.2, `threads touch: gap ${n_gap__min}`);
    assert(n_gap__max < 0.45, `threads too loose or out of phase: gap ${n_gap__max}`);
});

Deno.test('STL and 3MF hold the same mesh', async function(){
    let o_tile = await f_o_tile__pattern(37);
    let o_mesh = f_o_mesh__egg(f_o_param__default(), o_tile, o_lamp, 1.5, 120);
    let n_cnt = o_mesh.a_n_idx.length / 3;

    let o_buffer = await f_o_blob__stl(o_mesh.a_n_pos, o_mesh.a_n_idx).arrayBuffer();
    assertEquals(o_buffer.byteLength, 84 + 50 * n_cnt);
    let o_back = f_o_mesh__from_stl(o_buffer);
    assertEquals(o_back.a_n_idx.length, o_mesh.a_n_idx.length);
    f_check_watertight(o_back.a_n_idx, o_back.a_n_pos.length / 3);

    let s_dir = await Deno.makeTempDir();
    let o_blob = await f_o_blob__3mf([{ s_name: 'egg', a_n_pos: o_mesh.a_n_pos, a_n_idx: o_mesh.a_n_idx, n_x: 5, n_y: 7 }]);
    let s_path = `${s_dir}/egg.3mf`;
    await Deno.writeFile(s_path, new Uint8Array(await o_blob.arrayBuffer()));
    // A reader that is not this file's writer.
    let o_output = await new Deno.Command('python3', { args: ['-I', '-c', `
import sys, zipfile, re
z = zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None
s = z.read('3D/3dmodel.model').decode()
import xml.etree.ElementTree as E
r = E.fromstring(s)
ns = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
print(sorted(z.namelist()) == ['3D/3dmodel.model', '[Content_Types].xml', '_rels/.rels'], len(r.findall('.//m:vertex', ns)), len(r.findall('.//m:triangle', ns)), r.find('.//m:item', ns).get('transform'))
`, s_path], stdout: 'piped', stderr: 'piped' }).output();
    let s_out = new TextDecoder().decode(o_output.stdout).trim();
    assert(o_output.success, new TextDecoder().decode(o_output.stderr));
    assertEquals(s_out, `True ${o_mesh.a_n_pos.length / 3} ${n_cnt} 1 0 0 0 1 0 0 0 1 5 7 0`);
    await Deno.remove(s_dir, { recursive: true });

    assertEquals(f_n_crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});
