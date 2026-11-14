// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The bulb as a whole: its neck is the .scad file's, the clip screws into it with the
// fit the .scad file gives; the print files hold the mesh, a 3MF with the filaments
// painted as Bambu Studio paints them; and the worker builds and exports bulbs.

import { assert, assertEquals, assertAlmostEquals, f_s_path, f_check_closed, f_a_n_radius__hit, f_b_openscad } from './check.js';
import { f_n_radius__bore, f_n_mm__thread_d } from '../neck.module.js';
import { f_o_blob__stl, f_o_blob__obj, f_o_blob__3mf, f_s_paint, f_o_mesh__from_stl, f_n_crc32 } from '../export.module.js';
import { f_o_param__default, f_o_mesh__object } from '../object.module.js';
import { f_o_filament } from '../color.module.js';
import { f_a_n_mat4__of_place } from '../gizmo.module.js';
import { f_o_buffer__stl_of_tri } from '../mesh_file.module.js';
import { f_a_n_tri__ball, f_a_n_tri__box, f_a_n_col__of_tri, f_s_obj__of_tri } from './shape.js';

let n_tau = Math.PI * 2;
let o_bulb = JSON.parse(Deno.readTextFileSync(f_s_path('part/bulb.json')));
let s_path__scad = f_s_path('../lichterketteV3.scad');
let b_openscad = await f_b_openscad();
if(!b_openscad){ console.log('no OpenSCAD here, skipping the tests that ask the .scad file'); }
let o_clip = f_o_mesh__from_stl((await Deno.readFile(f_s_path('part/clip.stl'))).buffer);

let f_o_mesh__from_scad = async function(s_scad, a_s_arg = []){
    let s_path__stl = await Deno.makeTempFile({ suffix: '.stl' });
    let o_output = await new Deno.Command('openscad', { args: ['-o', s_path__stl, '--export-format', 'binstl', ...a_s_arg, s_scad], stdout: 'null', stderr: 'null' }).output();
    assert(o_output.success, 'OpenSCAD failed');
    let o_mesh = f_o_mesh__from_stl((await Deno.readFile(s_path__stl)).buffer);
    await Deno.remove(s_path__stl);
    return o_mesh;
};

// The clip as the .scad file's assembly has it, its tip n_mm__out below the neck's top:
// moved down and turned so that its thread stays in the neck's.
let f_a_n_pos__clip = function(n_mm__out){
    let n_z = o_bulb.n_mm__neck_scl_z - o_bulb.n_mm__clip_scl_z - n_mm__out;
    let n_rad = n_tau * n_z / o_bulb.n_mm__thread_pitch;
    let a_n_pos = new Float32Array(o_clip.a_n_pos.length);
    for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
        let [n_x, n_y] = [o_clip.a_n_pos[n_off], o_clip.a_n_pos[n_off + 1]];
        a_n_pos.set([n_x * Math.cos(n_rad) - n_y * Math.sin(n_rad), n_x * Math.sin(n_rad) + n_y * Math.cos(n_rad), o_clip.a_n_pos[n_off + 2] + n_z], n_off);
    }
    return a_n_pos;
};

Deno.test({ name: 'the neck is the .scad file\'s: neck_thread() cut from the neck', ignore: !b_openscad, fn: async function(){
    let s_dir = await Deno.makeTempDir();
    await Deno.writeTextFile(`${s_dir}/ask.scad`, `include <${s_path__scad}>\npart = "none";\ndifference(){ cylinder(h = h2, d = d3, $fn = 360); neck_thread(); }\n`);
    let o_mesh = await f_o_mesh__from_scad(`${s_dir}/ask.scad`);
    await Deno.remove(s_dir, { recursive: true });
    let a_n_rad = Array.from({ length: 51 }, function(v, n_idx){ return n_idx * 7 * n_tau / 360; });
    let n_mm__worst = 0;
    for(let n_z = 0.15; n_z < 6.9; n_z += 0.2){
        let a_n_r = f_a_n_radius__hit(o_mesh.a_n_pos, o_mesh.a_n_idx, n_z, a_n_rad, 0);
        a_n_rad.forEach(function(n_rad, n_idx){
            n_mm__worst = Math.max(n_mm__worst, Math.abs(a_n_r[n_idx] - f_n_radius__bore(o_bulb, n_z, n_rad)));
        });
    }
    console.log(`bore against the .scad file's neck: worst ${n_mm__worst.toFixed(4)} mm off`);
    // Its thread has 64 steps a turn: chords and steps of up to 0.03.
    assert(n_mm__worst < 0.04, `the bore is ${n_mm__worst} mm off the .scad file's`);
} });

// Rays from the axis to the outside of the clip, and the bore's radius there: the gap,
// below 0 where the clip is wider and its C closes.
let f_o_gap = function(n_mm__out){
    let a_n_pos = f_a_n_pos__clip(n_mm__out);
    // Away from the C's opening, which is around +x with the clip at its own place.
    let n_rad__turn = n_tau * (o_bulb.n_mm__neck_scl_z - o_bulb.n_mm__clip_scl_z - n_mm__out) / o_bulb.n_mm__thread_pitch;
    let a_n_rad = Array.from({ length: 40 }, function(v, n_idx){ return n_rad__turn + (40 + n_idx * 7) * n_tau / 360; });
    let n_min = Infinity, n_max = -Infinity;
    // Above the lead-in, below where the clip's thread starts on its tip's chamfer.
    for(let n_z = 1.4; n_z < 6.0 - n_mm__out; n_z += 0.13){
        let a_n_r = f_a_n_radius__hit(a_n_pos, o_clip.a_n_idx, n_z, a_n_rad, 2.5, true);
        a_n_rad.forEach(function(n_rad, n_idx){
            assert(Number.isFinite(a_n_r[n_idx]), `no clip at z ${n_z}`);
            let n_gap = f_n_radius__bore(o_bulb, n_z, n_rad) - a_n_r[n_idx];
            n_min = Math.min(n_min, n_gap);
            n_max = Math.max(n_max, n_gap);
        });
    }
    return { n_min, n_max };
};

Deno.test('the clip screws in: loose at first, tight over its last turn, the C closing by clamp all along', function(){
    let n_clamp = o_bulb.n_mm__clip_tip_d - o_bulb.n_mm__thread_d;
    let n_taper = o_bulb.n_mm__thread_taper;
    assertAlmostEquals(n_clamp, 0.4, 1e-9);
    // All the way in: the clip is clamp / 2 wider than the bore on every side.
    let o_in = f_o_gap(0);
    console.log(`clip all the way in: gap ${o_in.n_min.toFixed(3)} to ${o_in.n_max.toFixed(3)} mm`);
    assert(o_in.n_min > -n_clamp / 2 - 0.04 && o_in.n_max < -n_clamp / 2 + 0.04, `gap ${o_in.n_min} to ${o_in.n_max}`);
    // Out by clamp / taper of the neck's length: the two threads touch.
    let o_touch = f_o_gap(n_clamp / n_taper * o_bulb.n_mm__neck_scl_z);
    console.log(`clip ${(n_clamp / n_taper * o_bulb.n_mm__neck_scl_z).toFixed(2)} out: gap ${o_touch.n_min.toFixed(3)} to ${o_touch.n_max.toFixed(3)} mm`);
    assert(o_touch.n_min > -0.04 && o_touch.n_max < 0.04, `gap ${o_touch.n_min} to ${o_touch.n_max}`);
    // Its first turn, at the neck's entry: (taper - clamp) / 2 loose.
    assertAlmostEquals((f_n_mm__thread_d(o_bulb, 0) - o_bulb.n_mm__clip_tip_d) / 2, (n_taper - n_clamp) / 2, 1e-9);
    // The LED passes through the neck's end.
    assertAlmostEquals(o_bulb.n_mm__thread_d - 2 * o_bulb.n_mm__thread_depth, 4.8, 1e-9);
});

Deno.test('STL, OBJ and 3MF hold the same mesh; a 3MF its painted filaments', async function(){
    let o_mesh = f_o_mesh__object(f_a_n_tri__ball(15, [0, 0, 25], 24), f_o_param__default(), o_bulb, 0.8, 90);
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
    assertEquals(a_s_line[0], `v ${o_mesh.a_n_pos[0].toFixed(4)} ${o_mesh.a_n_pos[1].toFixed(4)} ${o_mesh.a_n_pos[2].toFixed(4)} 1.000 0.000 0.400`);

    // Bambu Studio's codes for a whole triangle of a filament.
    assertEquals([1, 2, 3, 4, 5, 16].map(f_s_paint), ['4', '8', '0C', '1C', '2C', 'DC']);
    // Filaments 1, 2 and 3 in turn: the first unpainted, the others painted.
    let a_n_filament = Uint8Array.from({ length: n_cnt }, function(v, n_tri){ return 1 + n_tri % 3; });
    let s_dir = await Deno.makeTempDir();
    let o_blob = await f_o_blob__3mf([{ s_name: 'bulb', a_n_pos: o_mesh.a_n_pos, a_n_idx: o_mesh.a_n_idx, a_n_filament, n_x: 5, n_y: 7 }, { s_name: 'clip', ...o_clip, n_x: 40, n_y: 7 }]);
    let s_path = `${s_dir}/bulb.3mf`;
    await Deno.writeFile(s_path, new Uint8Array(await o_blob.arrayBuffer()));
    // A reader that is not this file's writer.
    let o_output = await new Deno.Command('python3', { args: ['-I', '-c', `
import sys, zipfile, collections
z = zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None
import xml.etree.ElementTree as E
r = E.fromstring(z.read('3D/3dmodel.model').decode())
ns = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
print(sorted(z.namelist()) == ['3D/3dmodel.model', '[Content_Types].xml', '_rels/.rels'])
for o in r.findall('.//m:object', ns):
    a = collections.Counter(t.get('paint_color', '-') for t in o.findall('.//m:triangle', ns))
    print(o.get('name'), len(o.findall('.//m:vertex', ns)), sorted(a.items()))
print(' '.join(i.get('transform') for i in r.findall('.//m:item', ns)))
`, s_path], stdout: 'piped', stderr: 'piped' }).output();
    await Deno.remove(s_dir, { recursive: true });
    assert(o_output.success, new TextDecoder().decode(o_output.stderr));
    let n_cnt__third = Math.ceil(n_cnt / 3);
    assertEquals(new TextDecoder().decode(o_output.stdout).trim().split('\n'), [
        'True',
        `bulb ${o_mesh.a_n_pos.length / 3} [('-', ${n_cnt__third}), ('0C', ${Math.floor(n_cnt / 3)}), ('8', ${n_cnt - n_cnt__third - Math.floor(n_cnt / 3)})]`,
        `clip ${o_clip.a_n_pos.length / 3} [('-', ${o_clip.a_n_idx.length / 3})]`,
        '1 0 0 0 1 0 0 0 1 5 7 0 1 0 0 0 1 0 0 0 1 40 7 0'
    ]);
    assertEquals(f_n_crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

Deno.test('the filaments are the colours that cover the most, the most used first, the neck unpainted', function(){
    // A box with its right half red and the rest blue, a little green on top.
    let a_n_tri = f_a_n_tri__box([-12, -12, 10], [12, 12, 34]);
    let a_n_col__corner = f_a_n_col__of_tri(a_n_tri, function(n_x, n_y, n_z, n_tri){ return [[0, 0, 255], [0, 200, 0], [0, 0, 255], [0, 0, 255], [0, 0, 255], [255, 0, 0]][n_tri >> 1]; });
    let o_mesh = f_o_mesh__object(a_n_tri, f_o_param__default(), o_bulb, 0.8, 90, a_n_col__corner);
    let o_three = f_o_filament(o_mesh.a_n_pos, o_mesh.a_n_idx, o_mesh.a_n_col, o_mesh.n_off__shell_from, o_mesh.n_off__shell_to, 4);
    // Blue covers four sides, red and green one each: exactly theirs, not blends of their
    // edges, and not the stem's white.
    assertEquals(o_three.a_a_n_col.length, 3, JSON.stringify(o_three.a_a_n_col));
    assertEquals(o_three.a_a_n_col[0], [0, 0, 255]);
    assertEquals(o_three.a_a_n_col.slice(1).map(function(a_n){ return a_n.join(); }).sort(), ['0,200,0', '255,0,0']);
    // Painted: the shell, but for the stem; the neck and the stem print with filament 1.
    let n_cnt__painted = 0, n_cnt__stem = 0;
    for(let n_tri = 0; n_tri < o_mesh.a_n_idx.length / 3; n_tri++){
        let b_shell = n_tri * 3 >= o_mesh.n_off__shell_from && n_tri * 3 < o_mesh.n_off__shell_to;
        if(!b_shell){ assertEquals(o_three.a_n_filament[n_tri], 0, `neck triangle ${n_tri}`); continue; }
        if(o_three.a_n_filament[n_tri] > 0){ n_cnt__painted++; } else { n_cnt__stem++; }
    }
    assert(n_cnt__painted > 10 * n_cnt__stem && n_cnt__stem > 50, `${n_cnt__painted} painted, ${n_cnt__stem} of the stem not`);
    // Only two allowed: blue, and red or green, which takes the other.
    let o_two = f_o_filament(o_mesh.a_n_pos, o_mesh.a_n_idx, o_mesh.a_n_col, o_mesh.n_off__shell_from, o_mesh.n_off__shell_to, 2);
    assertEquals([o_two.a_a_n_col.length, Math.max(...o_two.a_n_filament)], [2, 2]);
    // One colour alone: one filament.
    let o_one = f_o_filament(o_mesh.a_n_pos, o_mesh.a_n_idx, o_mesh.a_n_col, o_mesh.n_off__shell_from, o_mesh.n_off__shell_to, 1);
    assertEquals(o_one.a_a_n_col.length, 1);
});

// The worker as the page runs it, with what the page sends.
Deno.test({ name: 'the worker takes an object\'s file and builds and exports its bulb where the page puts it', sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let o_worker = new Worker(new URL('../worker.module.js', import.meta.url).href, { type: 'module' });
    let n_id = 0;
    let f_o_answer = function(o_request){
        return new Promise(function(f_resolve){
            o_worker.onmessage = function(o_event){ f_resolve(o_event.data); };
            o_worker.postMessage({ n_id: ++n_id, s_kind: 'object', ...o_request });
        });
    };
    let o_setting = { ...f_o_param__default(), n_mm__voxel: 0.4, n_cnt__filament: 4 };
    let f_a_n_mat4 = function(n_z, n_scl){ return f_a_n_mat4__of_place({ a_n_trn: [0, 0, n_z], a_n_rot: [0, 0, 0, 1], n_scl }, [5, 6, 7]); };
    let f_check_built = function(o_built){
        assertEquals([o_built.s_type, o_built.n_id], ['built', n_id], JSON.stringify(o_built.s_message));
        f_check_closed(o_built.a_n_pos, o_built.a_n_idx, 'the bulb');
        let n_cnt__vertex = o_built.a_n_pos.length / 3;
        assertEquals([o_built.a_n_wall.length, o_built.a_n_col.length, o_built.a_n_nor.length], [n_cnt__vertex, n_cnt__vertex * 3, n_cnt__vertex * 3]);
        assertEquals([o_built.b_single_wall, o_built.n_cnt__fixed, o_built.o_stat.n_cnt__triangle], [false, 73 * 90, o_built.a_n_idx.length / 3]);
        for(let n_wall of o_built.a_n_wall){ assert(n_wall > 0); }
    };
    try{
        // Without a file: the neck and the stem alone, closed and printable, and told so.
        let o_bare = await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(25, 1), n_mm__voxel: 0.8, n_id__place: 1 });
        f_check_built(o_bare);
        assertEquals(o_bare.o_stat.b_object, false);

        // A ball of 15 around a middle of its own, as a binary STL.
        let a_n_tri = f_a_n_tri__ball(15, [5, 6, 7], 24);
        let o_loaded = await f_o_answer({ s_type: 'object', a_n_u8: new Uint8Array(f_o_buffer__stl_of_tri(a_n_tri)), s_name__file: 'ball.stl' });
        assertEquals([o_loaded.s_type, o_loaded.n_id, [...o_loaded.a_n_tri]], ['object_loaded', n_id, [...a_n_tri]], JSON.stringify(o_loaded.s_message));

        // Its middle 25 above the neck's foot: a bulb 40 high.
        let o_built = await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(25, 1), n_mm__voxel: 0.8, n_id__place: 7 });
        f_check_built(o_built);
        assertEquals([o_built.n_id__place, o_built.o_stat.b_object, o_built.o_stat.b_touching, o_built.o_stat.a_a_n_col__filament], [7, true, true, null]);
        assertAlmostEquals(o_built.o_stat.n_mm__scl_z, 40, 0.05);

        // A print file is on its own, finer grid, of the object where it stands.
        let o_stl = await f_o_answer({ s_type: 'export', s_format: 'stl', s_name__project: 'A ball', o_setting, a_n_mat4: f_a_n_mat4(25, 1) });
        assertEquals([o_stl.s_type, o_stl.s_name], ['exported', 'a_ball_bulb.stl'], JSON.stringify(o_stl.s_message));
        let o_mesh = f_o_mesh__from_stl(await o_stl.o_blob.arrayBuffer());
        f_check_closed(o_mesh.a_n_pos, o_mesh.a_n_idx, 'the print file');
        assert(o_stl.n_cnt__triangle > 2 * o_built.o_stat.n_cnt__triangle, `the print file has ${o_stl.n_cnt__triangle} triangles, the view ${o_built.o_stat.n_cnt__triangle}`);

        // An OBJ in colours as materials give them, a colour a triangle: red to the right of
        // its middle and blue to the left.
        let a_n_col = f_a_n_col__of_tri(a_n_tri, function(n_x, n_y, n_z, n_tri){
            return a_n_tri[n_tri * 9] + a_n_tri[n_tri * 9 + 3] + a_n_tri[n_tri * 9 + 6] > 15 ? [255, 0, 0] : [0, 0, 255];
        });
        let o_colored = await f_o_answer({ s_type: 'object', a_n_u8: new TextEncoder().encode(f_s_obj__of_tri(a_n_tri, a_n_col)), s_name__file: 'ball.obj' });
        assertEquals([o_colored.s_type, o_colored.s_note], ['object_loaded', '']);
        let o_built__colored = await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(25, 1), n_mm__voxel: 0.8, n_id__place: 8 });
        f_check_built(o_built__colored);
        // Red and blue, each half.
        let a_s_col = o_built__colored.o_stat.a_a_n_col__filament.map(function(a_n){ return a_n.join(); });
        assertEquals(a_s_col.sort(), ['0,0,255', '255,0,0']);

        // The bulb and the clip in one 3MF, the bulb's colours painted.
        let o_both = await f_o_answer({ s_type: 'export', s_format: 'bulb_clip', s_name__project: '', o_setting, a_n_mat4: f_a_n_mat4(25, 1) });
        assertEquals([o_both.s_type, o_both.s_name, o_both.a_a_n_col__filament.length], ['exported', 'lichterkette_bulb_and_clip.3mf', 2], JSON.stringify(o_both.s_message));
        let s_path = await Deno.makeTempFile({ suffix: '.3mf' });
        await Deno.writeFile(s_path, new Uint8Array(await o_both.o_blob.arrayBuffer()));
        let o_output = await new Deno.Command('python3', { args: ['-I', '-c', `
import sys, zipfile, collections
import xml.etree.ElementTree as E
r = E.fromstring(zipfile.ZipFile(sys.argv[1]).read('3D/3dmodel.model'))
ns = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
for o in r.findall('.//m:object', ns):
    a = [float(v.get('z')) for v in o.findall('.//m:vertex', ns)]
    p = collections.Counter(t.get('paint_color', '-') for t in o.findall('.//m:triangle', ns))
    print(o.get('name'), len(o.findall('.//m:triangle', ns)), min(a), round(max(a), 2), sorted(p))
`, s_path], stdout: 'piped', stderr: 'piped' }).output();
        await Deno.remove(s_path);
        assert(o_output.success, new TextDecoder().decode(o_output.stderr));
        let a_s_line = new TextDecoder().decode(o_output.stdout).trim().split('\n');
        assertEquals(a_s_line.length, 2);
        let [s_name, s_cnt, s_z__low, s_z__top, ...a_s_paint] = a_s_line[0].split(' ');
        assertEquals([s_name, Number(s_z__low), a_s_paint.join(' ')], ['bulb', 0, "['-', '8']"]);
        assertAlmostEquals(Number(s_z__top), 40, 0.05);
        assertEquals(a_s_line[1], `clip ${o_clip.a_n_idx.length / 3} 0.0 ${o_bulb.n_mm__clip_scl_z.toFixed(1)} ['-']`);

        // A file that is none is told, and the object before it stays.
        let o_wrong = await f_o_answer({ s_type: 'object', a_n_u8: new TextEncoder().encode('not a 3D object'), s_name__file: 'notes.stl' });
        assertEquals([o_wrong.s_type, o_wrong.s_for, o_wrong.n_id], ['error', 'object', n_id]);
        assertEquals((await f_o_answer({ s_type: 'build', o_setting, a_n_mat4: f_a_n_mat4(25, 1), n_mm__voxel: 0.8, n_id__place: 9 })).o_stat.b_object, true);
    } finally {
        o_worker.terminate();
    }
} });
