// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Reads the object, cuts it, threads it and writes the print file away from the page,
// so its controls stay smooth. The page gets what to draw: triangles, nine numbers
// each, and their corners' colours; and what to say about the parts.

import { f_o_object__from_file } from './mesh_file.module.js';
import { n_face__thread, f_o_mesh__welded, f_o_bound } from './cut.module.js';
import { a_n_col__plain, f_a_n_mm2, f_o_filament, f_n_fil__seam } from './color.module.js';
import { f_o_built, f_a_n_pos__moved } from './piece.module.js';
import { f_o_blob__3mf } from './export.module.js';

// The object as read: its points, moved to stand on z = 0 around the z axis, its
// triangles, their colours or null, which of its surfaces each is of, their areas.
let o_object = null;
// Its filaments, for how many at most.
let o_filament = null;
// The last build, and of which settings.
let o_built = null;
let s_setting__built = '';

let a_n_mat4__identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
// How the view colours what a cut made: faces lighter, holes darker than their filament.
let f_a_n_col__mixed = function(a_n_col, a_n_with, n_share){
    return a_n_col.map(function(n, n_k){ return Math.round(n + (a_n_with[n_k] - n) * n_share); });
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

let f_o_message__object = async function(o_data){
    let o_read = await f_o_object__from_file({ s_name: o_data.s_name__file ?? '', a_n_u8: o_data.a_n_u8 }, o_data.a_o_file__side ?? [],
        typeof OffscreenCanvas === 'undefined' ? null : f_o_image__decoded, o_data.n_item ?? 0);
    let o_welded = f_o_mesh__welded(o_read.a_n_tri, o_read.a_n_col);
    if(o_welded.a_n_idx.length === 0){ throw new Error(`${o_data.s_name__file} has no triangles with an area.`); }
    let o_bound = f_o_bound(o_welded.a_n_pos);
    let a_n_shift = [-(o_bound.a_n_min[0] + o_bound.a_n_max[0]) / 2, -(o_bound.a_n_min[1] + o_bound.a_n_max[1]) / 2, -o_bound.a_n_min[2]];
    for(let n_off = 0; n_off < o_welded.a_n_pos.length; n_off += 3){
        for(let n_k = 0; n_k < 3; n_k++){ o_welded.a_n_pos[n_off + n_k] += a_n_shift[n_k]; }
    }
    o_object = { ...o_welded, a_n_mm2: f_a_n_mm2(o_welded.a_n_pos, o_welded.a_n_idx) };
    o_filament = null;
    o_built = null;
    s_setting__built = '';
    return {
        s_type: 'object_loaded', n_id: o_data.n_id, s_note: o_read.s_note, a_s_item: o_read.a_s_item, n_item: o_read.n_item,
        n_cnt__triangle: o_welded.a_n_idx.length / 3, n_cnt__shell: o_welded.n_cnt__shell, b_color: o_welded.a_n_col__tri !== null,
        ...f_o_bound(o_object.a_n_pos)
    };
};

// The parts and screws of these settings, built anew only if they changed.
let f_o_built__of = function(o_setting){
    if(!o_filament || o_filament.n_cnt__max !== o_setting.n_cnt__filament){
        o_filament = { n_cnt__max: o_setting.n_cnt__filament, ...f_o_filament(o_object.a_n_col__tri, o_object.a_n_mm2, o_setting.n_cnt__filament) };
        s_setting__built = '';
    }
    let s_setting = JSON.stringify(o_setting);
    if(s_setting === s_setting__built){ return o_built; }
    o_built = f_o_built({ a_n_pos: o_object.a_n_pos, a_n_idx: o_object.a_n_idx, a_n_fil: o_filament.a_n_fil, a_n_shell: o_object.a_n_shell }, o_setting);
    for(let o_part of o_built.a_o_part){ o_part.n_fil = f_n_fil__seam(o_part.o_mesh, f_a_n_mm2(o_part.o_mesh.a_n_pos, o_part.o_mesh.a_n_idx)); }
    for(let o_screw of o_built.a_o_screw){ o_screw.n_fil = 1; }
    s_setting__built = s_setting;
    return o_built;
};

// What the page draws, as s_view says: the parts together, apart, or on the bed.
let f_o_view = function(o_built, s_view){
    let o_bound = f_o_bound(o_object.a_n_pos);
    let n_mm__apart = 0.18 * Math.hypot(o_bound.a_n_max[0] - o_bound.a_n_min[0], o_bound.a_n_max[1] - o_bound.a_n_min[1], o_bound.a_n_max[2] - o_bound.a_n_min[2]);
    let f_a_n_mat4__apart = function(a_n_apart){
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, a_n_apart[0] * n_mm__apart, a_n_apart[1] * n_mm__apart, a_n_apart[2] * n_mm__apart, 1];
    };
    let f_a_n_mat4__times = function(a, b){
        let a_n = new Array(16);
        for(let n_col = 0; n_col < 4; n_col++){
            for(let n_row = 0; n_row < 4; n_row++){
                a_n[n_col * 4 + n_row] = a[n_row] * b[n_col * 4] + a[n_row + 4] * b[n_col * 4 + 1] + a[n_row + 8] * b[n_col * 4 + 2] + a[n_row + 12] * b[n_col * 4 + 3];
            }
        }
        return a_n;
    };
    let a_o_draw = [];
    for(let o_part of o_built.a_o_part){
        let a_n_mat4 = s_view === 'bed' ? o_part.a_n_mat4__bed : (s_view === 'apart' ? f_a_n_mat4__apart(o_part.a_n_apart) : a_n_mat4__identity);
        a_o_draw.push({ o_mesh: o_part.o_mesh, n_fil: o_part.n_fil, a_n_mat4 });
    }
    for(let o_screw of o_built.a_o_screw){
        let a_n_mat4 = o_screw.a_n_mat4__bed;
        if(s_view !== 'bed'){
            a_n_mat4 = o_screw.a_n_mat4__in;
            if(s_view === 'apart'){
                let a_n_apart = [0, 1, 2].map(function(n_k){ return (o_built.a_o_part[o_screw.a_n_part[0]].a_n_apart[n_k] + o_built.a_o_part[o_screw.a_n_part[1]].a_n_apart[n_k]) / 2; });
                a_n_mat4 = f_a_n_mat4__times(f_a_n_mat4__apart(a_n_apart), a_n_mat4);
            }
        }
        a_o_draw.push({ o_mesh: o_screw.o_mesh, n_fil: o_screw.n_fil, a_n_mat4 });
    }
    let n_cnt = a_o_draw.reduce(function(n_sum, o_draw){ return n_sum + o_draw.o_mesh.a_n_idx.length / 3; }, 0);
    let a_n_pos = new Float32Array(n_cnt * 9), a_n_col = new Uint8Array(n_cnt * 9);
    let a_a_n_col = o_filament.a_a_n_col;
    let n_tri__at = 0;
    for(let o_draw of a_o_draw){
        let { a_n_idx, a_n_fil, a_n_face } = o_draw.o_mesh;
        let a_n_moved = f_a_n_pos__moved(o_draw.o_mesh.a_n_pos, o_draw.a_n_mat4);
        let a_n_col__seam = a_a_n_col[o_draw.n_fil - 1] ?? a_n_col__plain;
        let a_n_col__face = f_a_n_col__mixed(a_n_col__seam, [150, 150, 150], 0.45), a_n_col__hole = f_a_n_col__mixed(a_n_col__seam, [20, 20, 20], 0.55);
        for(let n_tri = 0; n_tri < a_n_idx.length / 3; n_tri++, n_tri__at++){
            let a_n = a_n_fil[n_tri] > 0 ? a_a_n_col[a_n_fil[n_tri] - 1] : (a_n_face[n_tri] === n_face__thread ? a_n_col__hole : (a_n_face[n_tri] === 0 ? a_n_col__seam : a_n_col__face));
            for(let n_k = 0; n_k < 3; n_k++){
                let n_off = a_n_idx[n_tri * 3 + n_k] * 3;
                a_n_pos.set(a_n_moved.subarray(n_off, n_off + 3), n_tri__at * 9 + n_k * 3);
                a_n_col.set(a_n, n_tri__at * 9 + n_k * 3);
            }
        }
    }
    return { a_n_pos, a_n_col };
};

// What the page says about the parts: their sizes and filaments, the screws, and each
// cut's threads or why it has none.
let f_o_report = function(o_built){
    return {
        a_o_part: o_built.a_o_part.map(function(o_part){
            let o_bound = f_o_bound(f_a_n_pos__moved(o_part.o_mesh.a_n_pos, o_part.a_n_mat4__bed));
            return {
                n_mm3: o_part.n_mm3, n_fil: o_part.n_fil, a_n_step: o_part.a_o_step.map(function(o_step){ return (o_step.n_cut + 1) * (o_step.n_side === 0 ? 1 : -1); }),
                a_n_scl: [0, 1, 2].map(function(n_k){ return o_bound.a_n_max[n_k] - o_bound.a_n_min[n_k]; }),
                a_n_fil__used: [...new Set(o_part.o_mesh.a_n_fil)].filter(function(n){ return n > 0; }).sort()
            };
        }),
        a_o_screw: o_built.a_o_screw.map(function(o_screw){ return { n_cut: o_screw.n_cut, a_n_part: o_screw.a_n_part, n_mm__d: o_screw.n_mm__d, n_mm__length: o_screw.n_mm__length }; }),
        a_o_cut: o_built.a_o_cut,
        b_fits: o_built.b_fits,
        a_a_n_col__filament: o_filament.a_a_n_col
    };
};

// Starts with the object's name, in characters every file system and slicer takes.
let f_s_name__file = function(s_name){
    let s_slug = (s_name ?? '').replace(/\.[^.]*$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `${s_slug || 'object'}_threaded.3mf`;
};

let f_o_message__export = async function(o_data){
    let o_built = f_o_built__of(o_data.o_setting);
    let a_o_thing = [
        ...o_built.a_o_part.map(function(o_part, n_idx){ return { s_name: `part ${n_idx + 1}`, ...o_part.o_mesh, a_n_pos: f_a_n_pos__moved(o_part.o_mesh.a_n_pos, o_part.a_n_mat4__bed), n_fil: o_part.n_fil }; }),
        ...o_built.a_o_screw.map(function(o_screw, n_idx){
            return { s_name: `screw ${n_idx + 1} M${o_screw.n_mm__d} x ${o_screw.n_mm__length.toFixed(1)}`, ...o_screw.o_mesh, a_n_pos: f_a_n_pos__moved(o_screw.o_mesh.a_n_pos, o_screw.a_n_mat4__bed), n_fil: o_screw.n_fil };
        })
    ];
    let o_blob = await f_o_blob__3mf(a_o_thing, o_filament.a_a_n_col);
    return { s_type: 'exported', n_id: o_data.n_id, o_blob, s_name: f_s_name__file(o_data.s_name__file), n_cnt__part: o_built.a_o_part.length, n_cnt__screw: o_built.a_o_screw.length, a_a_n_col__filament: o_filament.a_a_n_col };
};

self.onmessage = async function(o_event){
    let o_data = o_event.data;
    try{
        let n_ms__start = performance.now();
        let o_message, a_o_transfer = [];
        if(o_data.s_type === 'object'){
            o_message = await f_o_message__object(o_data);
        } else if(!o_object){
            throw new Error('Load a 3D object first.');
        } else if(o_data.s_type === 'build'){
            let o_view = f_o_view(f_o_built__of(o_data.o_setting), o_data.s_view);
            o_message = { s_type: 'built', n_id: o_data.n_id, ...o_view, o_report: f_o_report(o_built) };
            a_o_transfer = [o_view.a_n_pos.buffer, o_view.a_n_col.buffer];
        } else {
            o_message = await f_o_message__export(o_data);
        }
        o_message.n_ms = performance.now() - n_ms__start;
        self.postMessage(o_message, a_o_transfer);
    } catch(o_error){
        self.postMessage({ s_type: 'error', n_id: o_data.n_id, s_message: o_error.message, s_for: o_data.s_type });
    }
};
