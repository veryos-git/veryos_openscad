// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Files in colours: 3MF painted, by parts and with its own colours; glTF with colours of
// points, materials and pictures; PLY as text and as numbers; OBJ with a picture. Each
// file is made here, so what it holds is known.

import { assert, assertEquals, assertAlmostEquals, f_n_mm3 } from './check.js';
import { f_o_object__from_file } from '../mesh_file.module.js';
import { f_o_paint, f_paint_pieces } from '../mesh_file_3mf.module.js';
import { f_o_blob__zip, f_o_blob__3mf } from '../export.module.js';
import { f_a_n_tri__box } from './shape.js';

let o_encoder = new TextEncoder();
let f_o_read = function(a_n_u8, s_name, a_o_side = [], f_o_image = null, n_item = 0){
    return f_o_object__from_file({ a_n_u8, s_name }, a_o_side, f_o_image, n_item);
};
// The colours a read object has, each with how many triangles' first corners have it.
let f_o_n_cnt__by_col = function(o_object){
    let o = {};
    for(let n_off = 0; n_off < o_object.a_n_col.length; n_off += 9){
        let s = `${o_object.a_n_col[n_off]},${o_object.a_n_col[n_off + 1]},${o_object.a_n_col[n_off + 2]}`;
        o[s] = (o[s] ?? 0) + 1;
    }
    return o;
};
let f_n_area = function(a_n_tri){
    let n_sum = 0;
    for(let n_off = 0; n_off < a_n_tri.length; n_off += 9){
        let u = [0, 1, 2].map((n) => a_n_tri[n_off + 3 + n] - a_n_tri[n_off + n]), v = [0, 1, 2].map((n) => a_n_tri[n_off + 6 + n] - a_n_tri[n_off + n]);
        n_sum += 0.5 * Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]);
    }
    return n_sum;
};
// A closed mesh as points and their triangles' corners, for files that index points.
let f_o_indexed = function(a_n_tri){
    let a_n_pos = [], a_n_idx = [], o_n__by_key = new Map();
    for(let n_off = 0; n_off < a_n_tri.length; n_off += 3){
        let s_key = `${a_n_tri[n_off]},${a_n_tri[n_off + 1]},${a_n_tri[n_off + 2]}`;
        if(!o_n__by_key.has(s_key)){ o_n__by_key.set(s_key, a_n_pos.length / 3); a_n_pos.push(a_n_tri[n_off], a_n_tri[n_off + 1], a_n_tri[n_off + 2]); }
        a_n_idx.push(o_n__by_key.get(s_key));
    }
    return { a_n_pos, a_n_idx };
};
let f_a_n_u8__zip = async function(o_s_text__by_path){
    let o_blob = await f_o_blob__zip(Object.entries(o_s_text__by_path).map(function([s_path, s_text]){ return { s_path, a_a_n_u8: [o_encoder.encode(s_text)] }; }), 'model/3mf');
    return new Uint8Array(await o_blob.arrayBuffer());
};
let s_head__model = '<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">';
let f_s_mesh = function(a_n_tri, f_s_extra = function(){ return ''; }){
    let o = f_o_indexed(a_n_tri);
    let a_s = ['<mesh><vertices>'];
    for(let n_off = 0; n_off < o.a_n_pos.length; n_off += 3){ a_s.push(`<vertex x="${o.a_n_pos[n_off]}" y="${o.a_n_pos[n_off + 1]}" z="${o.a_n_pos[n_off + 2]}"/>`); }
    a_s.push('</vertices><triangles>');
    for(let n_off = 0; n_off < o.a_n_idx.length; n_off += 3){ a_s.push(`<triangle v1="${o.a_n_idx[n_off]}" v2="${o.a_n_idx[n_off + 1]}" v3="${o.a_n_idx[n_off + 2]}"${f_s_extra(n_off / 3)}/>`); }
    a_s.push('</triangles></mesh>');
    return a_s.join('');
};
let s_rels = '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>';

Deno.test('3MF: its own colours, base materials by triangle and by object, in cm', async function(){
    let a_n_tri = f_a_n_tri__box([0, 0, 0], [1, 2, 3]);
    // The first six triangles, bottom, top and front, the second colour, the rest the object's.
    let s_model = `${s_head__model.replace('millimeter', 'centimeter')}<resources><basematerials id="1"><base name="red" displaycolor="#FF0000"/><base name="blue" displaycolor="#0000FFFF"/></basematerials>`
        + `<object id="2" type="model" pid="1" pindex="0">${f_s_mesh(a_n_tri, (n_tri) => n_tri < 6 ? ' pid="1" p1="1"' : '')}</object></resources>`
        + '<build><item objectid="2" transform="1 0 0 0 1 0 0 0 1 5 0 0"/></build></model>';
    let o = await f_o_read(await f_a_n_u8__zip({ '_rels/.rels': s_rels, '3D/3dmodel.model': s_model }), 'box.3mf');
    assertEquals([o.a_n_tri.length / 9, o.a_s_item, o.s_note], [12, null, '']);
    assertEquals(f_o_n_cnt__by_col(o), { '0,0,255': 6, '255,0,0': 6 });
    // In cm, moved 5 cm along x.
    let a_n_x = [...o.a_n_tri].filter((v, n) => n % 3 === 0), a_n_z = [...o.a_n_tri].filter((v, n) => n % 3 === 2);
    assertEquals([Math.min(...a_n_x), Math.max(...a_n_x), Math.max(...a_n_z)], [50, 60, 30]);
});

Deno.test('3MF of Bambu Studio: parts in their filaments, a negative part left out, paint whole and cut', async function(){
    let a_n_tri = f_a_n_tri__box([0, 0, 0], [10, 10, 10]);
    // Triangle 0 painted with filament 3, whole; triangle 1 cut once along its side
    // opposite its first corner: the half with its first two corners filament 1,
    // the other filament 2. Children are written last first, nibbles read from the end.
    let s_object = `${s_head__model}<resources>`
        + `<object id="1" type="model">${f_s_mesh(a_n_tri, (n_tri) => n_tri === 0 ? ' paint_color="0C"' : (n_tri === 1 ? ' paint_color="481"' : ''))}</object>`
        + `<object id="2" type="model">${f_s_mesh(a_n_tri)}</object><object id="3" type="model">${f_s_mesh(a_n_tri)}</object></resources></model>`;
    let s_root = `${s_head__model}<resources><object id="4" type="model"><components>`
        + '<component p:path="/3D/Objects/object_1.model" objectid="1" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>'
        + '<component p:path="/3D/Objects/object_1.model" objectid="2" transform="1 0 0 0 1 0 0 0 1 20 0 0"/>'
        + '<component p:path="/3D/Objects/object_1.model" objectid="3" transform="1 0 0 0 1 0 0 0 1 40 0 0"/>'
        + '</components></object><object id="6" type="model"><components><component p:path="/3D/Objects/object_1.model" objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0"/></components></object></resources>'
        + '<build><item objectid="4" transform="1 0 0 0 1 0 0 0 1 100 100 5" printable="1"/><item objectid="6" printable="1"/></build></model>';
    let s_setting = '<?xml version="1.0" encoding="UTF-8"?>\n<config><object id="4"><metadata key="name" value="Box"/><metadata key="extruder" value="1"/>'
        + '<part id="1" subtype="normal_part"><metadata key="extruder" value="1"/></part><part id="2" subtype="normal_part"><metadata key="extruder" value="2"/></part>'
        + '<part id="3" subtype="negative_part"><metadata key="extruder" value="3"/></part></object><object id="6"><metadata key="name" value="Lid"/><metadata key="extruder" value="3"/></object></config>';
    let o_s_file = {
        '_rels/.rels': s_rels, '3D/3dmodel.model': s_root, '3D/Objects/object_1.model': s_object,
        'Metadata/model_settings.config': s_setting, 'Metadata/project_settings.config': JSON.stringify({ filament_colour: ['#FF0000', '#00FF00', '#0000FF'] })
    };
    let a_n_u8 = await f_a_n_u8__zip(o_s_file);
    let o = await f_o_read(a_n_u8, 'box.3mf');
    assertEquals([o.a_s_item, o.n_item], [['Box', 'Lid'], 0]);
    assert(/2 objects: choose which one/.test(o.s_note), o.s_note);
    // Part 1: 11 triangles red (one cut in two halves, one of them green), 1 blue; part 2 all 12 green; the negative part not there.
    assertEquals(o.a_n_tri.length / 9, 12 + 1 + 12);
    assertEquals(f_o_n_cnt__by_col(o), { '0,0,255': 1, '255,0,0': 11, '0,255,0': 13 });
    assertAlmostEquals(f_n_area(o.a_n_tri), 2 * 600, 1e-6, 'two boxes, the cut one whole');
    // The cut triangle: its halves, first two corners and the middle of the other two.
    let a_n_x = [...o.a_n_tri].filter((v, n) => n % 3 === 0);
    assertEquals([Math.min(...a_n_x), Math.max(...a_n_x)], [100, 130]);
    // The second object, the lid, all in filament 3.
    let o_lid = await f_o_read(a_n_u8, 'box.3mf', [], null, 1);
    assertEquals([o_lid.n_item, o_lid.a_n_tri.length / 9, o_lid.a_n_col], [1, 12, null]);

    // The cut, piece by piece: a code's tree, and where its pieces lie.
    let o_tree = f_o_paint('481');
    assertEquals([o_tree.b_whole, o_tree.o_root.n_split, o_tree.o_root.n_special, o_tree.o_root.a_o_child.map((o) => o.n_state)], [true, 1, 0, [1, 2]]);
    let a_o_piece = [];
    f_paint_pieces([[0, 0, 0], [4, 0, 0], [0, 4, 0]], o_tree.o_root, (a, b, c, n_state) => a_o_piece.push({ a_a_n: [a, b, c], n_state }));
    assertEquals(a_o_piece, [{ a_a_n: [[0, 0, 0], [4, 0, 0], [2, 2, 0]], n_state: 1 }, { a_a_n: [[2, 2, 0], [0, 4, 0], [0, 0, 0]], n_state: 2 }]);
    // Cut on three sides, its last piece cut again on three: seven pieces as large as asked, facing as their triangle.
    let o_deep = f_o_paint('484484433');
    assert(o_deep.b_whole);
    a_o_piece = [];
    f_paint_pieces([[0, 0, 0], [8, 0, 0], [0, 8, 0]], o_deep.o_root, (a, b, c, n_state) => a_o_piece.push({ a, b, c, n_state }));
    assertEquals(a_o_piece.length, 7);
    let a_n_area = a_o_piece.map((o) => 0.5 * ((o.b[0] - o.a[0]) * (o.c[1] - o.a[1]) - (o.b[1] - o.a[1]) * (o.c[0] - o.a[0])));
    assertEquals(a_n_area.slice().sort((a, b) => a - b), [2, 2, 2, 2, 8, 8, 8]);
    // States 18 and more take more nibbles; a code cut short is refused, one too long not whole.
    assertEquals([f_o_paint('1FC').o_root.n_state, f_o_paint('0FFC').o_root.n_state, f_o_paint('1C').o_root.n_state], [19, 33, 4]);
    let s_message = '';
    try{ f_o_paint('3'); } catch(o_error){ s_message = o_error.message; }
    assertEquals([s_message, f_o_paint('44').b_whole], ['cut short', false]);

    // Without the slicer's settings: stand-in colours, and the page told.
    delete o_s_file['Metadata/project_settings.config'];
    let o_stand_in = await f_o_read(await f_a_n_u8__zip(o_s_file), 'box.3mf');
    assert(/stand-in colours/.test(o_stand_in.s_note), o_stand_in.s_note);
    assertEquals(Object.keys(f_o_n_cnt__by_col(o_stand_in)).length, 3);
});

Deno.test('3MF of this app: its painted filaments read back', async function(){
    let o_mesh = f_o_indexed(f_a_n_tri__box([0, 0, 0], [10, 10, 10]));
    let a_n_filament = Uint8Array.from({ length: 12 }, (v, n_tri) => n_tri < 4 ? 2 : 1);
    let o_blob = await f_o_blob__3mf([{ s_name: 'bulb', a_n_pos: Float32Array.from(o_mesh.a_n_pos), a_n_idx: Uint32Array.from(o_mesh.a_n_idx), a_n_filament, n_x: 0, n_y: 0 }]);
    let o = await f_o_read(new Uint8Array(await o_blob.arrayBuffer()), 'bulb.3mf');
    assertEquals(Object.values(f_o_n_cnt__by_col(o)).sort(), [4, 8]);
});

// A glTF, as a .glb: a box of 0.01 m, its first half of triangles in a material, the
// second in points' colours; a node moves it and scales it.
let f_a_n_u8__glb = function(o_gltf, a_n_u8__bin){
    let a_n_json = o_encoder.encode(JSON.stringify(o_gltf));
    let n_json = Math.ceil(a_n_json.length / 4) * 4, n_bin = Math.ceil(a_n_u8__bin.length / 4) * 4;
    let a_n = new Uint8Array(12 + 8 + n_json + 8 + n_bin).fill(0x20, 20, 20 + n_json);
    let o_view = new DataView(a_n.buffer);
    o_view.setUint32(0, 0x46546c67, true); o_view.setUint32(4, 2, true); o_view.setUint32(8, a_n.length, true);
    o_view.setUint32(12, n_json, true); o_view.setUint32(16, 0x4e4f534a, true); a_n.set(a_n_json, 20);
    o_view.setUint32(20 + n_json, n_bin, true); o_view.setUint32(24 + n_json, 0x004e4942, true);
    a_n.fill(0, 28 + n_json); a_n.set(a_n_u8__bin, 28 + n_json);
    return a_n;
};
let f_o_gltf__box = function(o_more = {}){
    let o_mesh = f_o_indexed(f_a_n_tri__box([0, 0, 0], [0.01, 0.02, 0.03]));
    let n_cnt = o_mesh.a_n_pos.length / 3;
    let a_n_pos = Float32Array.from(o_mesh.a_n_pos), a_n_idx = Uint16Array.from(o_mesh.a_n_idx);
    // Points' colours: red where x is 0, white elsewhere, as normalised bytes.
    let a_n_color = Uint8Array.from({ length: n_cnt * 4 }, (v, n) => (n % 4 === 3 || o_mesh.a_n_pos[Math.floor(n / 4) * 3] > 0 || n % 4 === 0) ? 255 : 0);
    let a_n_bin = new Uint8Array(a_n_pos.byteLength + a_n_color.byteLength + a_n_idx.byteLength);
    a_n_bin.set(new Uint8Array(a_n_pos.buffer), 0);
    a_n_bin.set(a_n_color, a_n_pos.byteLength);
    a_n_bin.set(new Uint8Array(a_n_idx.buffer), a_n_pos.byteLength + a_n_color.byteLength);
    let o_gltf = {
        asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
        nodes: [{ translation: [0.1, 0, 0], scale: [2, 2, 2], children: [1] }, { mesh: 0 }],
        buffers: [{ byteLength: a_n_bin.length }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: a_n_pos.byteLength }, { buffer: 0, byteOffset: a_n_pos.byteLength, byteLength: a_n_color.byteLength },
            { buffer: 0, byteOffset: a_n_pos.byteLength + a_n_color.byteLength, byteLength: a_n_idx.byteLength }],
        accessors: [{ bufferView: 0, componentType: 5126, count: n_cnt, type: 'VEC3' }, { bufferView: 1, componentType: 5121, normalized: true, count: n_cnt, type: 'VEC4' },
            { bufferView: 2, componentType: 5123, count: 18, type: 'SCALAR' }, { bufferView: 2, byteOffset: 36, componentType: 5123, count: 18, type: 'SCALAR' }],
        materials: [{ pbrMetallicRoughness: { baseColorFactor: [0, 0, 1, 1] } }, {}],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 2, material: 0 }, { attributes: { POSITION: 0, COLOR_0: 1 }, indices: 3, material: 1 }] }],
        ...o_more
    };
    return { o_gltf, a_n_bin };
};

Deno.test('glTF: materials and points\' colours, nodes, metres to mm and y up to z up', async function(){
    let { o_gltf, a_n_bin } = f_o_gltf__box();
    let o = await f_o_read(f_a_n_u8__glb(o_gltf, a_n_bin), 'box.glb');
    assertEquals(o.a_n_tri.length / 9, 12);
    assert(f_n_mm3(Float32Array.from(o.a_n_tri), Uint32Array.from({ length: 36 }, (v, n) => n)) > 0, 'turned inside out');
    // 10 x 20 x 30 mm, twice as large, 100 mm along x; y up became z up.
    let a_n_min = [0, 1, 2].map((n_k) => Math.min(...[...o.a_n_tri].filter((v, n) => n % 3 === n_k)));
    let a_n_max = [0, 1, 2].map((n_k) => Math.max(...[...o.a_n_tri].filter((v, n) => n % 3 === n_k)));
    a_n_min.forEach((n, n_k) => assertAlmostEquals(n, [100, -60, 0][n_k], 1e-3));
    a_n_max.forEach((n, n_k) => assertAlmostEquals(n, [120, 0, 40][n_k], 1e-3));
    // The material's blue; red and white of the points.
    let o_cnt = f_o_n_cnt__by_col(o);
    assertEquals(o_cnt['0,0,255'], 6);
    assert(o.a_n_col.some((v, n) => n % 3 === 1 && v === 0 && o.a_n_col[n - 1] === 255) && o.a_n_col.some((v, n) => n % 3 === 0 && v === 255 && o.a_n_col[n + 1] === 255), 'no red and no white points');

    // A node that mirrors: still right way out.
    let o_mirror = f_o_gltf__box();
    o_mirror.o_gltf.nodes[0].scale = [-2, 2, 2];
    let o_m = await f_o_read(f_a_n_u8__glb(o_mirror.o_gltf, o_mirror.a_n_bin), 'box.glb');
    assert(f_n_mm3(Float32Array.from(o_m.a_n_tri), Uint32Array.from({ length: 36 }, (v, n) => n)) > 0, 'a mirroring node turned it inside out');

    // Packed with Draco: told what to do.
    let o_draco = f_o_gltf__box({ extensionsRequired: ['KHR_draco_mesh_compression'] });
    let s_message = '';
    try{ await f_o_read(f_a_n_u8__glb(o_draco.o_gltf, o_draco.a_n_bin), 'packed.glb'); } catch(o_error){ s_message = o_error.message; }
    assert(/Draco|draco/.test(s_message) && /without compression/.test(s_message), s_message);
});

Deno.test('glTF and OBJ with a picture: its colours on the corners, a large triangle cut to show it', async function(){
    // A picture of 4 x 1: red, green, blue, white, from left to right.
    let o_picture = { n_scl_x: 4, n_scl_y: 1, a_n_rgba: Uint8Array.from([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]) };
    let f_o_image = async function(a_n_u8){ assertEquals([...a_n_u8], [1, 2, 3]); return o_picture; };
    // One triangle of 40 x 40 mm whose u runs across the picture.
    let a_n_pos = Float32Array.from([0, 0, 0, 0.04, 0, 0, 0, 0.04, 0]), a_n_uv = Float32Array.from([0, 0.5, 1, 0.5, 0, 0.5]), a_n_png = Uint8Array.from([1, 2, 3, 0]);
    let a_n_bin = new Uint8Array(36 + 24 + 4);
    a_n_bin.set(new Uint8Array(a_n_pos.buffer), 0); a_n_bin.set(new Uint8Array(a_n_uv.buffer), 36); a_n_bin.set(a_n_png, 60);
    let o_gltf = {
        asset: { version: '2.0' }, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], buffers: [{ byteLength: 64 }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 24 }, { buffer: 0, byteOffset: 60, byteLength: 3 }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }, { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' }],
        images: [{ bufferView: 2, mimeType: 'image/png' }], textures: [{ source: 0, sampler: 0 }], samplers: [{ wrapS: 33071, wrapT: 33071 }],
        materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 }] }]
    };
    let o = await f_o_read(f_a_n_u8__glb(o_gltf, a_n_bin), 'picture.glb', [], f_o_image);
    // Cut until its corners are 2 pixels apart: its side across the 4 pixels in 2 pieces, 4 triangles.
    assertEquals(o.a_n_tri.length / 9, 4);
    assertAlmostEquals(f_n_area(o.a_n_tri), 800, 1e-3);
    // Along u: red at 0, the picture's middle between green and blue, white at the end.
    let f_a_n_col__at_x = function(n_x){
        for(let n_off = 0; n_off < o.a_n_tri.length; n_off += 3){
            if(Math.abs(o.a_n_tri[n_off] - n_x) < 1e-3 && Math.abs(o.a_n_tri[n_off + 1]) < 1e-3){ return [...o.a_n_col.subarray(n_off, n_off + 3)]; }
        }
        return null;
    };
    assertEquals(f_a_n_col__at_x(0), [255, 0, 0]);
    assertEquals(f_a_n_col__at_x(40), [255, 255, 255]);
    let a_n_mid = f_a_n_col__at_x(20);
    assert(a_n_mid[0] < 10 && a_n_mid[1] > 150 && a_n_mid[2] > 150, `the middle is not between green and blue: ${a_n_mid}`);

    // The same as an OBJ, its v from the picture's bottom, with its MTL and its picture;
    // an OBJ's picture repeats, so its corners lie on the middles of pixels.
    let s_obj = 'mtllib a.mtl\nv 0 0 0\nv 40 0 0\nv 0 40 0\nvt 0.125 0.5\nvt 0.875 0.5\nvt 0.125 0.5\nusemtl pic\nf 1/1 2/2 3/3\n';
    let o_obj = await f_o_read(o_encoder.encode(s_obj), 'a.obj', [{ s_name: 'a.mtl', a_n_u8: o_encoder.encode('newmtl pic\nKd 0.8 0.8 0.8\nmap_Kd textures/Pic.PNG\n') }, { s_name: 'pic.png', a_n_u8: Uint8Array.from([1, 2, 3]) }], f_o_image);
    assertEquals([o_obj.a_n_tri.length / 9, o_obj.s_note], [4, '']);
    // Red at its first corner, the middle of the first pixel; white at its second, the last pixel's middle.
    let n_off__far = [...Array(o_obj.a_n_tri.length / 3).keys()].find((n) => Math.abs(o_obj.a_n_tri[n * 3] - 40) < 1e-3) * 3;
    assertEquals([[...o_obj.a_n_col.subarray(0, 3)], [...o_obj.a_n_col.subarray(n_off__far, n_off__far + 3)]], [[255, 0, 0], [255, 255, 255]]);
    // Without the picture: said so.
    let o_without = await f_o_read(o_encoder.encode(s_obj), 'a.obj', [{ s_name: 'a.mtl', a_n_u8: o_encoder.encode('newmtl pic\nmap_Kd Pic.png\n') }], f_o_image);
    assert(/Its colours are in a picture, Pic\.png/.test(o_without.s_note), o_without.s_note);
});

Deno.test('PLY: as text and as numbers, colours of points and of faces; points alone refused', async function(){
    let s_head = 'ply\nformat ascii 1.0\ncomment a square\nelement vertex 4\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nelement face 1\nproperty list uchar int vertex_indices\nend_header\n';
    let o_text = await f_o_read(o_encoder.encode(s_head + '0 0 0 255 0 0\n1 0 0 255 0 0\n1 1 0 0 0 255\n0 1 0 0 0 255\n4 0 1 2 3\n'), 'square.ply');
    assertEquals([...o_text.a_n_tri], [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0]);
    assertEquals([...o_text.a_n_col], [255, 0, 0, 255, 0, 0, 0, 0, 255, 255, 0, 0, 0, 0, 255, 0, 0, 255]);
    // As numbers, both ways round, with a colour of the face as floats.
    for(let b_little of [true, false]){
        let s_bin = `ply\nformat binary_${b_little ? 'little' : 'big'}_endian 1.0\nelement vertex 3\nproperty double x\nproperty double y\nproperty double z\nelement face 1\nproperty list uchar uint vertex_indices\nproperty float red\nproperty float green\nproperty float blue\nend_header\n`;
        let a_n_head = o_encoder.encode(s_bin);
        let a_n = new Uint8Array(a_n_head.length + 9 * 8 + 1 + 12 + 12);
        a_n.set(a_n_head);
        let o_view = new DataView(a_n.buffer);
        let n_off = a_n_head.length;
        for(let n_val of [0, 0, 0, 2, 0, 0, 0, 3, 0]){ o_view.setFloat64(n_off, n_val, b_little); n_off += 8; }
        o_view.setUint8(n_off++, 3);
        for(let n_val of [0, 1, 2]){ o_view.setUint32(n_off, n_val, b_little); n_off += 4; }
        for(let n_val of [0, 0.5, 1]){ o_view.setFloat32(n_off, n_val, b_little); n_off += 4; }
        let o_bin = await f_o_read(a_n, 'tri.ply');
        assertEquals([...o_bin.a_n_tri], [0, 0, 0, 2, 0, 0, 0, 3, 0]);
        // One colour alone is none.
        assertEquals(o_bin.a_n_col, null);
    }
    let s_message = '';
    try{ await f_o_read(o_encoder.encode('ply\nformat ascii 1.0\nelement vertex 1\nproperty float x\nproperty float y\nproperty float z\nproperty float f_dc_0\nend_header\n0 0 0 0.5\n'), 'splat.ply'); } catch(o_error){ s_message = o_error.message; }
    assert(/points only/.test(s_message) && /Gaussian splat/.test(s_message), s_message);
});
