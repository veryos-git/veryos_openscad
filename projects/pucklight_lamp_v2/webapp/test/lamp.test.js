// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The lamp as a whole: the three kinds' necks are one, the lampshade's of the .scad
// file, and fit the cup of the base parts; the logos are the .scad files'; the print
// files hold the mesh; and the worker builds every kind.

import { assert, assertEquals, assertAlmostEquals, f_s_path, f_n_mm3, f_check_closed, f_a_n_radius__hit, f_b_openscad } from './check.js';
import { sphere_mesh, neck_radius as f_n_radius__sphere, centre_z as n_z__sphere_centre } from '../sphere.module.js';
import { vase_mesh, run_script, neck_radius as f_n_radius__vase } from '../vase.module.js';
import { examples as o_s_example } from '../vase_example.module.js';
import { f_o_param__default, f_o_mesh__egg, f_n_radius__neck } from '../egg.module.js';
import { f_o_polygon__logo, f_n_area__polygon } from '../logo.module.js';
import { f_o_blob__stl, f_o_blob__obj, f_o_blob__3mf, f_o_mesh__from_stl, f_n_crc32 } from '../export.module.js';
import { f_o_param__default as f_o_param__object } from '../object.module.js';
import { f_a_n_mat4__of_place } from '../gizmo.module.js';
import { f_o_buffer__stl_of_tri } from '../mesh_file.module.js';
import { f_a_n_tri__ball, f_a_n_tri__box, f_a_n_col__of_tri, f_s_obj__of_tri } from './shape.js';

let n_tau = Math.PI * 2;
let o_lamp = JSON.parse(Deno.readTextFileSync(f_s_path('part/lamp.json')));
let s_path__scad = f_s_path('../pucklight_lamp_v2V5.scad');
let b_openscad = await f_b_openscad();
if(!b_openscad){ console.log('no OpenSCAD here, skipping the tests that ask the .scad files'); }

let f_o_mesh__from_scad = async function(s_scad, a_s_arg = []){
    let s_path__stl = await Deno.makeTempFile({ suffix: '.stl' });
    let o_output = await new Deno.Command('openscad', { args: ['-o', s_path__stl, '--export-format', 'binstl', ...a_s_arg, s_scad], stdout: 'null', stderr: 'null' }).output();
    assert(o_output.success, 'OpenSCAD failed');
    let o_mesh = f_o_mesh__from_stl((await Deno.readFile(s_path__stl)).buffer);
    await Deno.remove(s_path__stl);
    return o_mesh;
};

Deno.test('the three kinds have one neck', function(){
    for(let n_z = 0; n_z <= 4.8; n_z += 0.1){
        for(let n_deg = 0; n_deg < 360; n_deg += 23){
            let n_r = f_n_radius__neck(o_lamp, n_z, n_deg * n_tau / 360);
            assertAlmostEquals(f_n_radius__sphere(n_z, n_deg), n_r, 1e-9, `sphere, z ${n_z} angle ${n_deg}`);
            assertAlmostEquals(f_n_radius__vase(n_z, n_deg), n_r, 1e-9, `vase, z ${n_z} angle ${n_deg}`);
        }
    }
    // And its points in their meshes: 49 rings of 180 around the thread.
    let o_sphere = sphere_mesh(180);
    let o_vase = vase_mesh(run_script(o_s_example.template));
    let o_egg = f_o_mesh__egg(f_o_param__default(), null, o_lamp, 1.5, 180);
    let n_cnt = 49 * 180;
    assertEquals([o_sphere.rows[0].ring * 180, o_egg.n_cnt__fixed], [n_cnt, n_cnt]);
    for(let n_off = 0; n_off < n_cnt * 3; n_off++){
        assert(o_sphere.positions[n_off] === o_vase.positions[n_off], 'the vase\'s thread is not the sphere\'s');
        assertAlmostEquals(o_egg.a_n_pos[n_off], o_sphere.positions[n_off], 1e-4, 'the egg\'s thread is not the sphere\'s');
    }
});

// Follows rays from the axis to the outside of the neck of the .scad file's own lampshade.
Deno.test({ name: 'the neck is the lampshade\'s of pucklight_lamp_v2V5.scad', ignore: !b_openscad, fn: async function(){
    let o_mesh = await f_o_mesh__from_scad(s_path__scad, ['-D', 'part="lampshade"']);
    let a_n_rad = Array.from({ length: 51 }, function(v, n_idx){ return n_idx * 7 * n_tau / 360; });
    let n_mm__worst = 0;
    // Up to where the .scad file's thread ends: above it only this app's runs out into the cone.
    for(let n_z = 0.3; n_z < 3.95; n_z += 0.2){
        let a_n_r = f_a_n_radius__hit(o_mesh.a_n_pos, o_mesh.a_n_idx, n_z, a_n_rad, 0, true);
        a_n_rad.forEach(function(n_rad, n_idx){
            n_mm__worst = Math.max(n_mm__worst, Math.abs(a_n_r[n_idx] - f_n_radius__neck(o_lamp, n_z, n_rad)));
        });
    }
    console.log(`neck against the .scad file's lampshade: worst ${n_mm__worst.toFixed(4)} mm off`);
    // Its thread has 128 steps a turn: chords and steps of up to 0.03.
    assert(n_mm__worst < 0.04, `the neck is ${n_mm__worst} mm off the lampshade's`);
} });

// Follows rays from the axis to where they first hit the cup's wall from inside.
for(let s_brand of ['veryos', 'tracetrove']){
    Deno.test(`the thread fits the cup of the ${s_brand} top part, with the clearance all around`, async function(){
        let o_mesh = f_o_mesh__from_stl((await Deno.readFile(f_s_path(`part/${s_brand}/toppart.stl`))).buffer);
        let a_n_rad = Array.from({ length: 51 }, function(v, n_idx){ return n_idx * 7 * n_tau / 360; });
        let n_gap__min = Infinity, n_gap__max = -Infinity, n_gap__min_all = Infinity;
        for(let n_z = 0.1; n_z < 4.75; n_z += 0.13){
            // Past the core inside the cup, which reaches radius 31.
            let a_n_r = f_a_n_radius__hit(o_mesh.a_n_pos, o_mesh.a_n_idx, o_lamp.n_mm__cup_floor_z + n_z, a_n_rad, 31.5);
            a_n_rad.forEach(function(n_rad, n_idx){
                assert(a_n_r[n_idx] < 40, `no cup wall at z ${n_z}`);
                let n_gap = a_n_r[n_idx] - f_n_radius__neck(o_lamp, n_z, n_rad);
                n_gap__min_all = Math.min(n_gap__min_all, n_gap);
                // Where the thread is whole: above its chamfer at the bed, below the cup's lead-in.
                if(n_z > 1 && n_z < 3.1){
                    n_gap__min = Math.min(n_gap__min, n_gap);
                    n_gap__max = Math.max(n_gap__max, n_gap);
                }
            });
        }
        console.log(`${s_brand}: thread gap ${n_gap__min.toFixed(3)} to ${n_gap__max.toFixed(3)} mm, ${n_gap__min_all.toFixed(3)} at the least over the whole neck`);
        // neck_clearance in the .scad file is 0.3, on the radius. Chords of the mesh eat a little.
        assert(n_gap__min > 0.2 && n_gap__min_all > 0.2, `threads touch: gap ${n_gap__min_all}`);
        assert(n_gap__max < 0.45, `threads too loose or out of phase: gap ${n_gap__max}`);
        // The neck's bore clears the core.
        assert(o_lamp.n_mm__neck_d / 2 - o_lamp.n_mm__thread_depth - o_lamp.n_mm__neck_wall > 31.4);
    });
}

Deno.test({ name: 'both logos are their .scad files\'', ignore: !b_openscad, fn: async function(){
    let s_dir = await Deno.makeTempDir();
    for(let [s_brand, s_file, s_call] of [['veryos', 'pucklight_lamp_v2V5.scad', 'logo()'], ['tracetrove', 'pucklight_lamp_v2V5_TraceTrove.scad', 'logo(31.75426480542942)']]){
        await Deno.writeTextFile(`${s_dir}/ask.scad`, `include <${f_s_path(`../${s_file}`)}>\nlinear_extrude(1) ${s_call};\n`);
        let o_mesh = await f_o_mesh__from_scad(`${s_dir}/ask.scad`, ['-D', 'part="none"']);
        let o_polygon = f_o_polygon__logo(s_brand);
        let n_area = f_n_area__polygon(o_polygon.a_n_xy__outline) - o_polygon.a_a_n_xy__window.reduce(function(n_sum, a_n_xy){ return n_sum + f_n_area__polygon(a_n_xy); }, 0);
        // 1 thick, so its volume is its area. The polygons' arcs are chords.
        assert(Math.abs(n_area / f_n_mm3(o_mesh.a_n_pos, o_mesh.a_n_idx) - 1) < 0.003, `${s_brand}: area ${n_area} against ${f_n_mm3(o_mesh.a_n_pos, o_mesh.a_n_idx)}`);
        let a_n_min = [Infinity, Infinity], a_n_max = [-Infinity, -Infinity];
        for(let n_off = 0; n_off < o_mesh.a_n_pos.length; n_off += 3){
            for(let n_k = 0; n_k < 2; n_k++){
                a_n_min[n_k] = Math.min(a_n_min[n_k], o_mesh.a_n_pos[n_off + n_k]);
                a_n_max[n_k] = Math.max(a_n_max[n_k], o_mesh.a_n_pos[n_off + n_k]);
            }
        }
        assertAlmostEquals(o_polygon.n_cad__scl_x, a_n_max[0] - a_n_min[0], 0.01, `${s_brand}: width`);
        assertAlmostEquals(o_polygon.n_cad__scl_y, a_n_max[1] - a_n_min[1], 0.01, `${s_brand}: height`);
    }
    await Deno.remove(s_dir, { recursive: true });
} });

Deno.test('STL, OBJ and 3MF hold the same mesh', async function(){
    let o_mesh = f_o_mesh__egg(f_o_param__default(), null, o_lamp, 1.5, 120);
    let n_cnt = o_mesh.a_n_idx.length / 3;

    let o_buffer = await f_o_blob__stl(o_mesh.a_n_pos, o_mesh.a_n_idx).arrayBuffer();
    assertEquals(o_buffer.byteLength, 84 + 50 * n_cnt);
    let o_back = f_o_mesh__from_stl(o_buffer);
    assertEquals(o_back.a_n_idx.length, o_mesh.a_n_idx.length);
    f_check_closed(o_back.a_n_pos, o_back.a_n_idx, 'the .stl read back');

    let a_n_col = new Uint8Array(o_mesh.a_n_pos.length).fill(51);
    a_n_col.set([255, 0, 102], 0);
    let a_s_line = (await f_o_blob__obj(o_mesh.a_n_pos, o_mesh.a_n_idx, a_n_col).text()).trimEnd().split('\n');
    assertEquals(a_s_line.filter(function(s){ return s.startsWith('v '); }).length, o_mesh.a_n_pos.length / 3);
    assertEquals(a_s_line.filter(function(s){ return s.startsWith('f '); }).length, n_cnt);
    assertEquals(a_s_line.length, o_mesh.a_n_pos.length / 3 + n_cnt);
    assertEquals(a_s_line[0], `v ${o_mesh.a_n_pos[0].toFixed(4)} ${o_mesh.a_n_pos[1].toFixed(4)} ${o_mesh.a_n_pos[2].toFixed(4)} 1.000 0.000 0.400`);
    assertEquals(a_s_line[1].split(' ').slice(4).join(' '), '0.200 0.200 0.200');
    assertEquals(a_s_line[o_mesh.a_n_pos.length / 3], `f ${o_mesh.a_n_idx[0] + 1} ${o_mesh.a_n_idx[1] + 1} ${o_mesh.a_n_idx[2] + 1}`);

    let s_dir = await Deno.makeTempDir();
    let o_blob = await f_o_blob__3mf([{ s_name: 'lampshade', a_n_pos: o_mesh.a_n_pos, a_n_idx: o_mesh.a_n_idx, n_x: 5, n_y: 7 }]);
    let s_path = `${s_dir}/lampshade.3mf`;
    await Deno.writeFile(s_path, new Uint8Array(await o_blob.arrayBuffer()));
    // A reader that is not this file's writer.
    let o_output = await new Deno.Command('python3', { args: ['-I', '-c', `
import sys, zipfile
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

// The worker as the page runs it, with what the page sends.
Deno.test({ name: 'the worker builds every kind, and says what is wrong with a script', sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let o_worker = new Worker(new URL('../worker.module.js', import.meta.url).href, { type: 'module' });
    let n_id = 0;
    let f_o_answer = function(o_request){
        return new Promise(function(f_resolve){
            o_worker.onmessage = function(o_event){ f_resolve(o_event.data); };
            o_worker.postMessage({ s_type: 'build', n_id: ++n_id, s_brand: 'veryos', ...o_request });
        });
    };
    let f_check_built = function(o_built, s_kind){
        assertEquals([o_built.s_type, o_built.s_kind, o_built.n_id], ['built', s_kind, n_id], JSON.stringify(o_built.s_message));
        f_check_closed(o_built.a_n_pos, o_built.a_n_idx, s_kind);
        let n_cnt__vertex = o_built.a_n_pos.length / 3;
        assertEquals([o_built.a_n_wall.length, o_built.a_n_col.length], [n_cnt__vertex, n_cnt__vertex * 3]);
        assertEquals([o_built.o_stat.n_cnt__vertex, o_built.o_stat.n_cnt__triangle], [n_cnt__vertex, o_built.a_n_idx.length / 3]);
        assert(o_built.n_cnt__fixed > 0 && o_built.n_cnt__fixed < n_cnt__vertex && o_built.o_stat.n_mm3 > 0 && o_built.o_stat.n_mm__scl_z > 0);
        for(let n_wall of o_built.a_n_wall){ assert(n_wall > 0); }
    };
    try{
        let o_vase = await f_o_answer({ s_kind: 'vase', o_setting: { s_code: o_s_example.template } });
        f_check_built(o_vase, 'vase');
        assertEquals([o_vase.b_single_wall, o_vase.a_n_nor, o_vase.n_cnt__fixed, o_vase.o_stat.n_cnt__triangle], [true, null, 49 * 180 + 180 + 1, 18858]);
        assertEquals([Math.round(o_vase.o_stat.n_deg__out), Math.round(o_vase.o_stat.n_z__out), Math.round(o_vase.o_stat.n_deg__inward), Math.round(o_vase.o_stat.n_z__inward)], [41, 11, 41, 151]);
        assertEquals([[...o_vase.a_n_col.subarray(0, 3)], [...o_vase.a_n_col.subarray(-3)]], [[240, 184, 79], [247, 242, 230]], 'the thread in gold, the script\'s in white');

        let o_wrong = await f_o_answer({ s_kind: 'vase', o_setting: { s_code: 'let n = 1;\nn_not_there;' } });
        assertEquals([o_wrong.s_type, o_wrong.s_kind, o_wrong.s_for, o_wrong.n_line], ['error', 'vase', 'build', 2]);
        assert(/n_not_there/.test(o_wrong.s_message));

        // A heightmap that is white in its upper half: a sphere that is 3 thicker there.
        let n_scl_x__map = 64, n_scl_y__map = 32;
        let a_n_u8__map = new Uint8Array(n_scl_x__map * n_scl_y__map).fill(255, n_scl_x__map * n_scl_y__map / 2);
        let a_o_stop = [{ n_t: 0, a_n_col: [10, 20, 30] }, { n_t: 1, a_n_col: [250, 240, 230] }];
        let o_sphere = await f_o_answer({ s_kind: 'sphere', a_n_u8__map, n_scl_x__map, n_scl_y__map,
            o_setting: { n_cnt__column: 64, n_mm__wall_min: 0.8, n_mm__wall_max: 3.8, n_deg__relief_from: -43, a_o_stop } });
        f_check_built(o_sphere, 'sphere');
        assertEquals([o_sphere.b_single_wall, o_sphere.a_n_nor, o_sphere.n_cnt__fixed, o_sphere.a_n_height.length], [false, null, 49 * 64, o_sphere.a_n_pos.length / 3]);
        let n_wall__min = Infinity, n_wall__max = 0, n_r__max = 0;
        for(let n_idx = o_sphere.n_cnt__fixed; n_idx < o_sphere.a_n_wall.length; n_idx++){
            n_wall__min = Math.min(n_wall__min, o_sphere.a_n_wall[n_idx]);
            n_wall__max = Math.max(n_wall__max, o_sphere.a_n_wall[n_idx]);
            let n_r = Math.hypot(o_sphere.a_n_pos[n_idx * 3], o_sphere.a_n_pos[n_idx * 3 + 1]);
            if(n_r > n_r__max){ n_r__max = n_r; }
        }
        assertAlmostEquals(n_wall__min, 0.8, 1e-6);
        assertAlmostEquals(n_wall__max, 3.8, 1e-3);
        // Above the equator it is 53 wide, below it 50.
        assert(n_r__max > 52.5 && n_r__max < 53.01, `widest radius ${n_r__max}`);
        assertEquals([[...o_sphere.a_n_col.subarray(0, 3)], Math.max(...o_sphere.a_n_height)], [[10, 20, 30], 1]);
        assert(o_sphere.o_stat.n_cnt__offset > 0);
        // A lithophane's wall: 0.5 where the map is black, 3.2 where it is white. The inside is
        // 0.5 under the smooth sphere's Ø100, the outside 2.7 above it where white.
        let f_o_wall = function(o_built){
            let o_wall = { n_min: Infinity, n_max: 0, n_r__in: Infinity, n_r__out: 0 };
            for(let n_idx = o_built.n_cnt__fixed; n_idx < o_built.a_n_wall.length; n_idx++){
                o_wall.n_min = Math.min(o_wall.n_min, o_built.a_n_wall[n_idx]);
                o_wall.n_max = Math.max(o_wall.n_max, o_built.a_n_wall[n_idx]);
                let [n_x, n_y, n_z] = o_built.a_n_pos.subarray(n_idx * 3, n_idx * 3 + 3);
                // Above the equator, where no neck is.
                if(n_z < 45){ continue; }
                let n_r = Math.hypot(n_x, n_y, n_z - n_z__sphere_centre);
                o_wall.n_r__in = Math.min(o_wall.n_r__in, n_r);
                o_wall.n_r__out = Math.max(o_wall.n_r__out, n_r);
            }
            return o_wall;
        };
        let o_wall__before = f_o_wall(o_sphere);
        assertAlmostEquals(o_wall__before.n_r__in, 49.2, 1e-3);
        assertAlmostEquals(o_wall__before.n_r__out, 53, 1e-2);
        let o_setting__thin = { n_cnt__column: 64, n_mm__wall_min: 0.5, n_mm__wall_max: 3.2, n_deg__relief_from: -43, a_o_stop };
        let o_thin = await f_o_answer({ s_kind: 'sphere', a_n_u8__map: a_n_u8__map.slice(), n_scl_x__map, n_scl_y__map, o_setting: o_setting__thin });
        f_check_built(o_thin, 'sphere');
        let o_wall = f_o_wall(o_thin);
        assertAlmostEquals(o_wall.n_min, 0.5, 1e-6);
        assertAlmostEquals(o_wall.n_max, 3.2, 1e-3);
        assertAlmostEquals(o_wall.n_r__in, 49.5, 1e-3);
        assertAlmostEquals(o_wall.n_r__out, 52.7, 1e-2);
        assert(o_thin.o_stat.n_mm3 < o_sphere.o_stat.n_mm3, 'a thinner wall is not less plastic');
        // A thickest wall below the thinnest is no relief, not one that goes inwards.
        let o_smooth = await f_o_answer({ s_kind: 'sphere', a_n_u8__map: a_n_u8__map.slice(), n_scl_x__map, n_scl_y__map, o_setting: { ...o_setting__thin, n_mm__wall_min: 1.5, n_mm__wall_max: 1 } });
        f_check_built(o_smooth, 'sphere');
        let o_wall__smooth = f_o_wall(o_smooth);
        assertEquals([o_wall__smooth.n_min, o_wall__smooth.n_max], [1.5, 1.5]);
        assertAlmostEquals(o_wall__smooth.n_r__in, 48.5, 1e-3);
        assertAlmostEquals(o_wall__smooth.n_r__out, 50, 1e-3);

        let o_egg = await f_o_answer({ s_kind: 'egg', n_mm__cell: 1.5, o_setting: { ...f_o_param__default(), n_mm__cell_export: 0.4 } });
        f_check_built(o_egg, 'egg');
        assertEquals([o_egg.b_single_wall, o_egg.a_n_nor.length, o_egg.n_cnt__fixed, o_egg.o_stat.n_mm__cell], [false, o_egg.a_n_pos.length, 49 * 180, 1.5]);
        assertAlmostEquals(o_egg.o_stat.n_mm__scl_z, 145, 0.5);
        let o_egg__vase = await f_o_answer({ s_kind: 'egg', n_mm__cell: 1.5, o_setting: { ...f_o_param__default(), n_mm__cell_export: 0.4, b_vase: true } });
        f_check_built(o_egg__vase, 'egg');
        assertEquals(o_egg__vase.b_single_wall, true);

        // A script that uses Math.random(): each build makes another vase, and a print
        // file is of the one built last, the one on screen.
        let o_setting__random = { s_code: 'const n_height = 20 + Math.random() * 100;\nreturn { n_its_layer: 1, n_its_corner: 3, f_o_p: function(n_a, n_b){\n'
            + '    return { n_x: 40 * cos(n_b * 2 * PI), n_y: 40 * sin(n_b * 2 * PI), n_z: o_thread.n_z + n_height };\n} };' };
        let o_first = await f_o_answer({ s_kind: 'vase', o_setting: o_setting__random });
        let o_second = await f_o_answer({ s_kind: 'vase', o_setting: o_setting__random });
        f_check_built(o_second, 'vase');
        assert(o_first.o_stat.n_mm__scl_z !== o_second.o_stat.n_mm__scl_z, 'two builds of a random script made the same vase');
        let o_stl = await f_o_answer({ s_type: 'export', s_format: 'stl', s_kind: 'vase', s_name__project: 'A random vase!', o_setting: o_setting__random });
        assertEquals([o_stl.s_type, o_stl.s_name, o_stl.n_cnt__triangle], ['exported', 'a_random_vase_vase.stl', o_second.o_stat.n_cnt__triangle], JSON.stringify(o_stl.s_message));
        let o_mesh__stl = f_o_mesh__from_stl(await o_stl.o_blob.arrayBuffer());
        let n_z__stl = 0;
        for(let n_off = 2; n_off < o_mesh__stl.a_n_pos.length; n_off += 3){ n_z__stl = Math.max(n_z__stl, o_mesh__stl.a_n_pos[n_off]); }
        assertEquals(n_z__stl, o_second.o_stat.n_mm__scl_z, 'the print file is not the vase built last');

        // The whole lamp: the lampshade, the top part upside down on the bed, the screwin.
        let o_whole = await f_o_answer({ s_type: 'export', s_format: 'lamp', s_kind: 'vase', s_brand: 'tracetrove', s_name__project: '', o_setting: o_setting__random });
        assertEquals([o_whole.s_type, o_whole.s_name], ['exported', 'pucklight_lamp_vase_whole_lamp.3mf'], JSON.stringify(o_whole.s_message));
        let s_path = await Deno.makeTempFile({ suffix: '.3mf' });
        await Deno.writeFile(s_path, new Uint8Array(await o_whole.o_blob.arrayBuffer()));
        let o_output = await new Deno.Command('python3', { args: ['-I', '-c', `
import sys, zipfile
import xml.etree.ElementTree as E
r = E.fromstring(zipfile.ZipFile(sys.argv[1]).read('3D/3dmodel.model'))
ns = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
for o in r.findall('.//m:object', ns):
    a = [float(v.get('z')) for v in o.findall('.//m:vertex', ns)]
    print(o.get('name'), len(o.findall('.//m:triangle', ns)), min(a), max(a))
print(len(r.findall('.//m:item', ns)))
`, s_path], stdout: 'piped', stderr: 'piped' }).output();
        await Deno.remove(s_path);
        assert(o_output.success, new TextDecoder().decode(o_output.stderr));
        let a_s_line = new TextDecoder().decode(o_output.stdout).trim().split('\n');
        let n_cnt__toppart = f_o_mesh__from_stl((await Deno.readFile(f_s_path('part/tracetrove/toppart.stl'))).buffer).a_n_idx.length / 3;
        let n_cnt__screwin = f_o_mesh__from_stl((await Deno.readFile(f_s_path('part/tracetrove/screwin.stl'))).buffer).a_n_idx.length / 3;
        assertEquals(a_s_line.length, 4);
        assertEquals(a_s_line[3], '3', 'parts on the bed');
        // [its name, its triangles, its lowest point, its highest]: all three stand on the bed.
        [['lampshade', o_second.o_stat.n_cnt__triangle, o_second.o_stat.n_mm__scl_z], ['toppart', n_cnt__toppart, o_lamp.n_mm__top_z], ['screwin', n_cnt__screwin, 10.4]].forEach(function([s_name, n_cnt, n_z__top], n_idx){
            let [s_name__read, s_cnt, s_z__low, s_z__top] = a_s_line[n_idx].split(' ');
            assertEquals([s_name__read, Number(s_cnt), Number(s_z__low)], [s_name, n_cnt, 0]);
            assertAlmostEquals(Number(s_z__top), n_z__top, 0.002, s_name);
        });
    } finally {
        o_worker.terminate();
    }
} });

// A loaded object: its file goes to the worker once, where it stands with every build.
Deno.test({ name: 'the worker takes an object\'s file and builds its lampshade where the page puts it', sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let o_worker = new Worker(new URL('../worker.module.js', import.meta.url).href, { type: 'module' });
    let n_id = 0;
    let f_o_answer = function(o_request){
        return new Promise(function(f_resolve){
            o_worker.onmessage = function(o_event){ f_resolve(o_event.data); };
            o_worker.postMessage({ n_id: ++n_id, s_kind: 'object', s_brand: 'veryos', ...o_request });
        });
    };
    let o_setting = { ...f_o_param__object(), n_mm__voxel: 0.8 };
    let f_a_n_mat4 = function(n_z, n_scl){ return f_a_n_mat4__of_place({ a_n_trn: [0, 0, n_z], a_n_rot: [0, 0, 0, 1], n_scl }, [5, 6, 7]); };
    try{
        // Without a file: the stem alone, closed and printable, and told so.
        let o_bare = await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(60, 1), n_mm__voxel: 1.6, n_id__place: 1 });
        assertEquals([o_bare.s_type, o_bare.o_stat.b_object], ['built', false], JSON.stringify(o_bare.s_message));
        f_check_closed(o_bare.a_n_pos, o_bare.a_n_idx, 'no object');

        // A ball of 30 around a middle of its own, as a binary STL.
        let a_n_tri = f_a_n_tri__ball(30, [5, 6, 7], 24);
        let o_loaded = await f_o_answer({ s_type: 'object', a_n_u8: new Uint8Array(f_o_buffer__stl_of_tri(a_n_tri)), s_name__file: 'ball.stl' });
        assertEquals([o_loaded.s_type, o_loaded.n_id, [...o_loaded.a_n_tri]], ['object_loaded', n_id, [...a_n_tri]], JSON.stringify(o_loaded.s_message));
        o_loaded.a_n_min.forEach(function(n_val, n_idx){ assertAlmostEquals(n_val, [5, 6, 7][n_idx] - 30, 0.01); });
        o_loaded.a_n_max.forEach(function(n_val, n_idx){ assertAlmostEquals(n_val, [5, 6, 7][n_idx] + 30, 0.01); });

        // Its middle 60 above the neck's foot: a lampshade 90 high, on the view's grid.
        let o_built = await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(60, 1), n_mm__voxel: 1.6, n_id__place: 7 });
        assertEquals([o_built.s_type, o_built.s_kind, o_built.n_id, o_built.n_id__place], ['built', 'object', n_id, 7], JSON.stringify(o_built.s_message));
        f_check_closed(o_built.a_n_pos, o_built.a_n_idx, 'object');
        let n_cnt__vertex = o_built.a_n_pos.length / 3;
        assertEquals([o_built.a_n_wall.length, o_built.a_n_col.length, o_built.a_n_nor.length], [n_cnt__vertex, n_cnt__vertex * 3, n_cnt__vertex * 3]);
        assertEquals([o_built.b_single_wall, o_built.n_cnt__fixed, o_built.o_stat.n_mm__voxel, o_built.o_stat.b_object, o_built.o_stat.b_touching, o_built.o_stat.n_cnt__triangle],
            [false, 49 * 180, 1.6, true, true, o_built.a_n_idx.length / 3]);
        assertAlmostEquals(o_built.o_stat.n_mm__scl_z, 90, 0.3);
        assertEquals([...o_built.a_n_col.subarray(-3)], [247, 242, 230]);
        // Half as large again, and 20 higher.
        let o_larger = await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(80, 1.5), n_mm__voxel: 1.6, n_id__place: 8 });
        assertEquals(o_larger.n_id__place, 8);
        assertAlmostEquals(o_larger.o_stat.n_mm__scl_z, 125, 0.3);

        // A print file is on its own, finer grid, of the object where it stands.
        let o_stl = await f_o_answer({ s_type: 'export', s_format: 'stl', s_name__project: 'A ball', o_setting, a_n_mat4: f_a_n_mat4(60, 1) });
        assertEquals([o_stl.s_type, o_stl.s_name], ['exported', 'a_ball_object.stl'], JSON.stringify(o_stl.s_message));
        assert(o_stl.n_cnt__triangle > 2 * o_built.o_stat.n_cnt__triangle, `the print file has ${o_stl.n_cnt__triangle} triangles, the view ${o_built.o_stat.n_cnt__triangle}`);
        let o_mesh = f_o_mesh__from_stl(await o_stl.o_blob.arrayBuffer());
        assertEquals(o_mesh.a_n_idx.length / 3, o_stl.n_cnt__triangle);
        f_check_closed(o_mesh.a_n_pos, o_mesh.a_n_idx, 'the print file');
        let n_z__top = 0;
        for(let n_off = 2; n_off < o_mesh.a_n_pos.length; n_off += 3){ n_z__top = Math.max(n_z__top, o_mesh.a_n_pos[n_off]); }
        assertAlmostEquals(n_z__top, 90, 0.1);

        // An OBJ in colours, red to the right of its middle and blue to the left: the
        // lampshade has them, and so has its OBJ.
        let a_n_col = f_a_n_col__of_tri(a_n_tri, function(n_x){ return n_x > 5 ? [255, 0, 0] : [0, 0, 255]; });
        let o_colored = await f_o_answer({ s_type: 'object', a_n_u8: new TextEncoder().encode(f_s_obj__of_tri(a_n_tri, a_n_col)), s_name__file: 'ball.obj' });
        assertEquals([o_colored.s_type, o_colored.s_note, [...o_colored.a_n_col]], ['object_loaded', '', [...a_n_col]], JSON.stringify(o_colored.s_message));
        let f_check_red_and_blue = function(a_n_pos, f_a_n_col, s_what){
            let n_cnt__red = 0, n_cnt__blue = 0;
            for(let n_idx = 0; n_idx < a_n_pos.length / 3; n_idx++){
                // Above the stem, and away from where the two colours meet.
                if(a_n_pos[n_idx * 3 + 2] < 45 || Math.abs(a_n_pos[n_idx * 3]) < 4){ continue; }
                assertEquals(f_a_n_col(n_idx), a_n_pos[n_idx * 3] > 0 ? [255, 0, 0] : [0, 0, 255], `${s_what} at ${[...a_n_pos.subarray(n_idx * 3, n_idx * 3 + 3)]}`);
                if(a_n_pos[n_idx * 3] > 0){ n_cnt__red++; } else { n_cnt__blue++; }
            }
            assert(n_cnt__red > 1000 && n_cnt__blue > 1000, `${s_what}: ${n_cnt__red} red and ${n_cnt__blue} blue points`);
        };
        let o_built__colored = await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(60, 1), n_mm__voxel: 1.6, n_id__place: 11 });
        f_check_closed(o_built__colored.a_n_pos, o_built__colored.a_n_idx, 'an object in colours');
        assertEquals([[...o_built__colored.a_n_pos], [...o_built__colored.a_n_col.subarray(0, 3)]], [[...o_built.a_n_pos], [247, 242, 230]], 'the same lampshade, on a plain neck');
        f_check_red_and_blue(o_built__colored.a_n_pos, function(n_idx){ return [...o_built__colored.a_n_col.subarray(n_idx * 3, n_idx * 3 + 3)]; }, 'the view');
        let o_obj = await f_o_answer({ s_type: 'export', s_format: 'obj', s_name__project: 'A ball', o_setting: { ...o_setting, n_mm__voxel: 1.2 }, a_n_mat4: f_a_n_mat4(60, 1) });
        assertEquals([o_obj.s_type, o_obj.s_name], ['exported', 'a_ball_object.obj'], JSON.stringify(o_obj.s_message));
        let a_a_n__point = (await o_obj.o_blob.text()).split('\n').filter(function(s_line){ return s_line.startsWith('v '); }).map(function(s_line){ return s_line.split(' ').slice(1).map(Number); });
        assert(a_a_n__point.every(function(a_n){ return a_n.length === 6; }), 'a point of the OBJ without a colour');
        f_check_red_and_blue(Float32Array.from(a_a_n__point.flatMap(function(a_n){ return a_n.slice(0, 3); })), function(n_idx){ return a_a_n__point[n_idx].slice(3).map(function(n_val){ return Math.round(n_val * 255); }); }, 'the print file');

        // A lamp's own file has no colours: they come beside it, and count if they are the object's.
        let a_n_u8__stl = new Uint8Array(f_o_buffer__stl_of_tri(a_n_tri));
        let o_again = await f_o_answer({ s_type: 'object', a_n_u8: a_n_u8__stl.slice(), s_name__file: 'ball.obj', a_n_col: a_n_col.slice() });
        assertEquals([...o_again.a_n_col], [...a_n_col]);
        assertEquals((await f_o_answer({ s_type: 'object', a_n_u8: a_n_u8__stl.slice(), s_name__file: 'ball.obj', a_n_col: a_n_col.slice(9) })).a_n_col, null, 'colours of another object');
        assertEquals((await f_o_answer({ s_type: 'object', a_n_u8: a_n_u8__stl.slice(), s_name__file: 'ball.obj', a_n_col: null })).a_n_col, null);
        assertEquals((await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(60, 1), n_mm__voxel: 1.6, n_id__place: 12 })).a_n_col.every(function(n_val, n_idx){ return n_val === [247, 242, 230][n_idx % 3]; }), true, 'without colours it is plain');

        // An OBJ whose colours are its materials': with its MTL it has them, without it says where they are.
        let a_n_tri__box = f_a_n_tri__box([-30, -30, 0], [30, 30, 60]);
        let s_obj__material = 'mtllib box.mtl\n' + f_s_obj__of_tri(a_n_tri__box).replace('f 1 2 3', 'usemtl down\nf 1 2 3').replace('f 7 8 9', 'usemtl rest\nf 7 8 9');
        let o_material = await f_o_answer({ s_type: 'object', a_n_u8: new TextEncoder().encode(s_obj__material), s_name__file: 'box.obj', s_text__mtl: 'newmtl down\nKd 0 1 0\nnewmtl rest\nKd 1 1 0\n' });
        assertEquals([[...o_material.a_n_col.subarray(0, 3)], [...o_material.a_n_col.subarray(18, 21)], [...o_material.a_n_col.subarray(-3)], o_material.s_note], [[0, 255, 0], [255, 255, 0], [255, 255, 0], '']);
        let o_alone = await f_o_answer({ s_type: 'object', a_n_u8: new TextEncoder().encode(s_obj__material), s_name__file: 'box.obj' });
        assertEquals([o_alone.a_n_col, o_alone.s_note], [null, 'Its colours are in box.mtl: choose both files together to have them.']);
        await f_o_answer({ s_type: 'object', a_n_u8: a_n_u8__stl.slice(), s_name__file: 'ball.stl' });

        // A file that is none is told, and the object before it stays.
        let o_wrong = await f_o_answer({ s_type: 'object', a_n_u8: new TextEncoder().encode('not a 3D object'), s_name__file: 'notes.stl' });
        assertEquals([o_wrong.s_type, o_wrong.s_for, o_wrong.n_id], ['error', 'object', n_id]);
        assert(/neither an STL nor an OBJ/.test(o_wrong.s_message), o_wrong.s_message);
        assertEquals((await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(60, 1), n_mm__voxel: 1.6, n_id__place: 9 })).o_stat.b_object, true);
        // And it can be taken away.
        assertEquals((await f_o_answer({ s_type: 'object', a_n_u8: null })).a_n_tri, null);
        assertEquals((await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(60, 1), n_mm__voxel: 1.6, n_id__place: 10 })).o_stat.b_object, false);
    } finally {
        o_worker.terminate();
    }
} });
