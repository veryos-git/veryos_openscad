// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The 3MF: objects made of parts, each part on its filament, a shared mesh written once.
import { assertEquals, assert } from './check.js';
import { f_o_blob__3mf, f_o_mesh__from_stl } from '../export.module.js';
import { f_o_s__unzipped } from './zip.js';

// A tetrahedron as a binary STL, moved by x.
let f_a_n_u8__stl = function(n_x){
    let a_a_n = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]].map(function(a_n){ return [a_n[0] + n_x, a_n[1], a_n[2]]; });
    let a_a_n_idx = [[0, 2, 1], [0, 1, 3], [1, 2, 3], [0, 3, 2]];
    let o_buffer = new ArrayBuffer(84 + 50 * 4);
    let o_view = new DataView(o_buffer);
    o_view.setUint32(80, 4, true);
    a_a_n_idx.forEach(function(a_n_idx, n_it){
        a_n_idx.forEach(function(n_idx, n_corner){
            a_a_n[n_idx].forEach(function(n, n_axis){ o_view.setFloat32(84 + 50 * n_it + 12 + 12 * n_corner + 4 * n_axis, n, true); });
        });
    });
    return o_buffer;
};

Deno.test('STL to an indexed mesh', function(){
    let o_mesh = f_o_mesh__from_stl(f_a_n_u8__stl(0));
    assertEquals(o_mesh.a_n_pos.length, 12);
    assertEquals(o_mesh.a_n_idx.length, 12);
});

Deno.test('3MF: a socket of two materials and two balls sharing one mesh', async function(){
    let o_pla = f_o_mesh__from_stl(f_a_n_u8__stl(0));
    let o_tpu = f_o_mesh__from_stl(f_a_n_u8__stl(2));
    let o_ball = f_o_mesh__from_stl(f_a_n_u8__stl(4));
    let a_o_part__ball = [{ s_name: 'ball PLA', n_filament: 1, ...o_ball }];
    let o_blob = await f_o_blob__3mf([
        { s_name: 'socket', n_x: 120, n_y: 128, a_o_part: [{ s_name: 'socket PLA', n_filament: 1, ...o_pla }, { s_name: 'socket TPU', n_filament: 2, ...o_tpu }] },
        { s_name: 'ball 1', n_x: 130, n_y: 128, a_o_part: a_o_part__ball },
        { s_name: 'ball 2', n_x: 140, n_y: 128, a_o_part: a_o_part__ball }
    ], [{ s_name: 'PLA', s_colour: '#E8E8E8' }, { s_name: 'TPU', s_colour: '#FF8C00' }]);
    let o_s = await f_o_s__unzipped(new Uint8Array(await o_blob.arrayBuffer()));
    assertEquals(Object.keys(o_s), ['[Content_Types].xml', '_rels/.rels', '3D/3dmodel.model', 'Metadata/model_settings.config']);
    let s_model = o_s['3D/3dmodel.model'];
    // three meshes: socket PLA, socket TPU and one ball for both balls
    assertEquals((s_model.match(/<mesh>/g) ?? []).length, 3);
    assertEquals([...s_model.matchAll(/<object id="(\d+)" name="([^"]+)" type="model"( pid="1" pindex="(\d)")?>/g)].map(function(a){ return [a[1], a[2], a[4] ?? '']; }), [
        ['2', 'socket PLA', '0'], ['3', 'socket TPU', '1'], ['4', 'socket', ''], ['5', 'ball PLA', '0'], ['6', 'ball 1', ''], ['7', 'ball 2', '']
    ]);
    assert(s_model.includes('<object id="4" name="socket" type="model"><components><component objectid="2"/><component objectid="3"/></components></object>'));
    assert(s_model.includes('<object id="7" name="ball 2" type="model"><components><component objectid="5"/></components></object>'));
    assert(s_model.includes('<item objectid="4" transform="1 0 0 0 1 0 0 0 1 120 128 0" printable="1"/>'));
    assert(s_model.includes('<base name="TPU" displaycolor="#FF8C00"/>'));
    let s_config = o_s['Metadata/model_settings.config'];
    let a_a_s__part = [...s_config.matchAll(/<part id="(\d+)" subtype="normal_part"><metadata key="name" value="([^"]+)"\/>.*?<metadata key="extruder" value="(\d)"\/><\/part>/g)];
    assertEquals(a_a_s__part.map(function(a){ return [a[1], a[2], a[3]]; }), [
        ['2', 'socket PLA', '1'], ['3', 'socket TPU', '2'], ['5', 'ball PLA', '1'], ['5', 'ball PLA', '1']
    ]);
    assertEquals([...s_config.matchAll(/<object id="(\d+)">/g)].map(function(a){ return a[1]; }), ['4', '6', '7']);
});
