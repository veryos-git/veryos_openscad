// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Builds the bulbs away from the page, so its controls stay smooth, and writes the
// print files. A bulb comes back as a_n_pos, a_n_idx, a_n_nor, a_n_wall in mm and
// a_n_col per point, n_cnt__fixed, the first points, which are the neck's, and o_stat.

import { f_o_mesh__object } from './object.module.js';
import { f_o_object__from_file, f_o_bound } from './mesh_file.module.js';
import { f_a_n_tri__moved } from './gizmo.module.js';
import { f_a_n_col__object, f_o_filament } from './color.module.js';
import { f_a_n_normal } from './neck.module.js';
import { f_o_blob__stl, f_o_blob__obj, f_o_mesh__from_stl, f_o_blob__3mf } from './export.module.js';

// The loaded object's triangles, as its file has them, and its colours if it has any:
// r, g, b for each corner of each triangle.
let a_n_tri__object = null;
let a_n_col__object = null;
let o_bulb = null;

// The width, the height and the volume of a closed mesh on the bed.
let f_o_stat__mesh = function(a_n_pos, a_n_idx){
    let n_r2 = 0, n_z = 0, n_mm3 = 0;
    for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
        n_r2 = Math.max(n_r2, a_n_pos[n_off] * a_n_pos[n_off] + a_n_pos[n_off + 1] * a_n_pos[n_off + 1]);
        n_z = Math.max(n_z, a_n_pos[n_off + 2]);
    }
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let n_a = a_n_idx[n_off] * 3, n_b = a_n_idx[n_off + 1] * 3, n_c = a_n_idx[n_off + 2] * 3;
        n_mm3 += (a_n_pos[n_a] * (a_n_pos[n_b + 1] * a_n_pos[n_c + 2] - a_n_pos[n_b + 2] * a_n_pos[n_c + 1])
            + a_n_pos[n_a + 1] * (a_n_pos[n_b + 2] * a_n_pos[n_c] - a_n_pos[n_b] * a_n_pos[n_c + 2])
            + a_n_pos[n_a + 2] * (a_n_pos[n_b] * a_n_pos[n_c + 1] - a_n_pos[n_b + 1] * a_n_pos[n_c])) / 6;
    }
    return {
        n_cnt__vertex: a_n_pos.length / 3,
        n_cnt__triangle: a_n_idx.length / 3,
        n_mm__scl_x: 2 * Math.sqrt(n_r2),
        n_mm__scl_z: n_z,
        n_mm3
    };
};

// A loaded 3D object, where the page's matrix puts it, joined to the neck and hollowed.
// A coarser grid for the view, the print file's own for a print file. In colours, the
// filaments a 3MF paints it with: as many as the setting allows.
let f_o_built = function(o_data, b_export){
    let o_setting = o_data.o_setting;
    let a_n_tri = a_n_tri__object ? f_a_n_tri__moved(a_n_tri__object, o_data.a_n_mat4) : new Float32Array(0);
    let o_mesh = f_o_mesh__object(a_n_tri, o_setting, o_bulb, b_export ? o_setting.n_mm__voxel : o_data.n_mm__voxel, b_export ? 180 : 90,
        a_n_tri__object ? a_n_col__object : null);
    let o_filament = o_mesh.a_n_col
        ? f_o_filament(o_mesh.a_n_pos, o_mesh.a_n_idx, o_mesh.a_n_col, o_mesh.n_off__shell_from, o_mesh.n_off__shell_to, o_setting.n_cnt__filament)
        : null;
    return {
        a_n_pos: o_mesh.a_n_pos,
        a_n_idx: o_mesh.a_n_idx,
        a_n_nor: b_export ? null : f_a_n_normal(o_mesh.a_n_pos, o_mesh.a_n_idx),
        a_n_wall: o_mesh.a_n_wall,
        a_n_col: o_mesh.a_n_col ?? f_a_n_col__object(o_mesh.a_n_wall.length),
        a_n_filament: o_filament?.a_n_filament ?? null,
        n_cnt__fixed: o_mesh.n_cnt__fixed,
        b_single_wall: false,
        // Which place of the object this is the bulb of: the page's own count.
        n_id__place: o_data.n_id__place,
        o_stat: { ...f_o_stat__mesh(o_mesh.a_n_pos, o_mesh.a_n_idx), ...o_mesh.o_stat, a_a_n_col__filament: o_filament?.a_a_n_col ?? null }
    };
};

// A picture's pixels, as texture.module.js takes them: decoded by the browser, its
// colours as they are in the file.
let f_o_image__decoded = async function(a_n_u8){
    let o_bitmap = await createImageBitmap(new Blob([a_n_u8]), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    let o_canvas = new OffscreenCanvas(o_bitmap.width, o_bitmap.height);
    let o_ctx = o_canvas.getContext('2d', { willReadFrequently: true });
    o_ctx.drawImage(o_bitmap, 0, 0);
    return { n_scl_x: o_bitmap.width, n_scl_y: o_bitmap.height, a_n_rgba: o_ctx.getImageData(0, 0, o_bitmap.width, o_bitmap.height).data };
};

// Takes a 3D object's file, or null for none, and tells the page its triangles and
// its colours. Beside it a_o_file__side, the files chosen with it: an OBJ's MTL and
// pictures, a glTF's .bin and pictures; n_item, which object of a 3MF. A bulb's own file
// has no colours: the bulb keeps them beside it, a_n_col.
let f_o_message__object = async function(o_data){
    if(!o_data.a_n_u8){
        a_n_tri__object = null;
        a_n_col__object = null;
        return { o_message: { s_type: 'object_loaded', n_id: o_data.n_id, a_n_tri: null, a_n_col: null, s_note: '' }, a_o_transfer: [] };
    }
    let o_object = await f_o_object__from_file({ s_name: o_data.s_name__file ?? '', a_n_u8: o_data.a_n_u8 }, o_data.a_o_file__side ?? [],
        typeof OffscreenCanvas === 'undefined' ? null : f_o_image__decoded, o_data.n_item ?? 0);
    a_n_tri__object = o_object.a_n_tri;
    a_n_col__object = o_object.a_n_col ?? (o_data.a_n_col?.length === a_n_tri__object.length ? o_data.a_n_col : null);
    let a_n_tri = a_n_tri__object.slice(), a_n_col = a_n_col__object ? a_n_col__object.slice() : null;
    return {
        o_message: { s_type: 'object_loaded', n_id: o_data.n_id, a_n_tri, a_n_col, s_note: o_object.s_note, a_s_item: o_object.a_s_item, n_item: o_object.n_item, ...f_o_bound(a_n_tri) },
        a_o_transfer: a_n_col ? [a_n_tri.buffer, a_n_col.buffer] : [a_n_tri.buffer]
    };
};

let f_o_message__build = function(o_data){
    let o_built = f_o_built(o_data, false);
    // The page needs no filaments of the view's bulb, only their colours.
    delete o_built.a_n_filament;
    let a_o_transfer = [o_built.a_n_pos.buffer, o_built.a_n_idx.buffer, o_built.a_n_wall.buffer, o_built.a_n_col.buffer, o_built.a_n_nor.buffer];
    return { o_message: { s_type: 'built', n_id: o_data.n_id, s_kind: o_data.s_kind, ...o_built }, a_o_transfer };
};

// Starts with the bulb's name, in characters every file system and slicer takes.
let f_s_name__file = function(o_data){
    let s_slug = (o_data.s_name__project ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `${s_slug || 'lichterkette'}_bulb`;
};

// The bulb and the clip as they print, side by side: the bulb on its neck, the clip
// standing on its end.
let f_a_o_object__with_clip = async function(o_built){
    let n_mm__gap = 5;
    let n_r__bulb = o_built.o_stat.n_mm__scl_x / 2;
    let n_r__clip = o_bulb.n_mm__clip_d / 2;
    let o_response = await fetch('part/clip.stl');
    if(!o_response.ok){ throw new Error('part/clip.stl is missing; run: deno task part'); }
    let o_clip = f_o_mesh__from_stl(await o_response.arrayBuffer());
    return [
        { s_name: 'bulb', a_n_pos: o_built.a_n_pos, a_n_idx: o_built.a_n_idx, a_n_filament: o_built.a_n_filament, n_x: n_r__bulb + n_mm__gap, n_y: n_r__bulb + n_mm__gap },
        { s_name: 'clip', ...o_clip, n_x: 2 * n_r__bulb + 2 * n_mm__gap + n_r__clip, n_y: n_r__bulb + n_mm__gap }
    ];
};

let f_o_message__export = async function(o_data){
    let o_built = f_o_built(o_data, true);
    let s_name = f_s_name__file(o_data);
    let o_blob;
    if(o_data.s_format === 'stl'){
        o_blob = f_o_blob__stl(o_built.a_n_pos, o_built.a_n_idx);
        s_name += '.stl';
    } else if(o_data.s_format === 'obj'){
        o_blob = f_o_blob__obj(o_built.a_n_pos, o_built.a_n_idx, o_built.a_n_col);
        s_name += '.obj';
    } else if(o_data.s_format === '3mf'){
        o_blob = await f_o_blob__3mf([{ s_name: 'bulb', a_n_pos: o_built.a_n_pos, a_n_idx: o_built.a_n_idx, a_n_filament: o_built.a_n_filament, n_x: 0, n_y: 0 }]);
        s_name += '.3mf';
    } else {
        o_blob = await f_o_blob__3mf(await f_a_o_object__with_clip(o_built));
        s_name += '_and_clip.3mf';
    }
    return {
        o_message: {
            s_type: 'exported', n_id: o_data.n_id, o_blob, s_name, n_cnt__triangle: o_built.o_stat.n_cnt__triangle,
            a_a_n_col__filament: o_data.s_format === 'stl' || o_data.s_format === 'obj' ? null : o_built.o_stat.a_a_n_col__filament
        },
        a_o_transfer: []
    };
};

self.onmessage = async function(o_event){
    let o_data = o_event.data;
    try{
        if(!o_bulb){
            let o_response = await fetch('part/bulb.json');
            if(!o_response.ok){ throw new Error('part/bulb.json is missing; run: deno task part'); }
            o_bulb = await o_response.json();
        }
        let n_ms__start = performance.now();
        let o_result = o_data.s_type === 'object' ? await f_o_message__object(o_data)
            : (o_data.s_type === 'build' ? f_o_message__build(o_data) : await f_o_message__export(o_data));
        o_result.o_message.n_ms = performance.now() - n_ms__start;
        self.postMessage(o_result.o_message, o_result.a_o_transfer);
    } catch(o_error){
        self.postMessage({ s_type: 'error', n_id: o_data.n_id, s_kind: o_data.s_kind, s_message: o_error.message, n_line: null, s_for: o_data.s_type });
    }
};
