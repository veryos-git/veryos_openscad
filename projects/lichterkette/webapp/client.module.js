// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The page: one bulb at a time, a loaded 3D object joined to the neck that the clip
// screws into. The object kind brings its controls, the worker builds the bulb, the
// viewer shows it with the clip in its neck, the slice shows one layer of it, and the
// project panel keeps the bulbs.

import { f_o_viewer, f_o_viewer__without_3d } from './viewer.module.js';
import { el } from './dom.module.js';
import { f_el__control, f_el__group } from './control.module.js';
import { f_o_panel__project } from './project.module.js';
import { f_o_kind__object } from './kind_object.module.js';

let s_key__storage = 'lichterkette_app_v1';
// The bulb builds coarse while something moves and fine this long after, in ms.
let n_ms__settle = 220;
let n_deg = Math.PI / 180;
// The slicer's layer, for the slice's number.
let n_mm__layer = 0.2;
// The LED shines this far above the neck's top, past the clip's tip.
let n_mm__led_above_neck = 3;

let a_o_look = [
    { s_look: 'day', s_label: 'Daylight' },
    { s_look: 'lit', s_label: 'Lit' },
    { s_look: 'overhang', s_label: 'Overhang' },
    { s_look: 'edges', s_label: 'Edges' },
    { s_look: 'vertices', s_label: 'Vertices' },
    { s_look: 'xray', s_label: 'X-ray' }
];
let a_o_control__view = [
    { s_key: 'n_light', s_label: 'Brightness', n_min: 0.15, n_max: 2, n_step: 0.05, s_unit: '', n_decimal: 2, s_only_look: 'lit' },
    { s_key: 'n_deg__limit', s_label: 'Overhang limit', n_min: 30, n_max: 70, n_step: 1, s_unit: '°', n_decimal: 0, s_only_look: 'overhang' }
];
// The Overhang look's colours, as viewer.module.js mixes them.
let a_o_legend = [
    { s_text: 'overhang past the limit, to red at 90°', s_col: 'linear-gradient(to right, #ffcf5c, #f93a3a)' },
    { s_text: 'a single wall that leans in past it, to dark blue', s_col: 'linear-gradient(to right, #9bcbfa, #3f61e6)' },
    { s_text: 'neck: fixed', s_col: '#6f6f6f' }
];

let o_state = {
    o_setting: null,
    o_view: { s_look: 'day', b_cut: false, b_base: true, b_mini: true, n_nor__section: 1, n_light: 1, n_deg__limit: 45, s_light__col: '#ffd9a0' }
};

// The view is remembered in this browser; the bulbs are the server's.
let f_load_state = function(){
    try{
        let o_saved = JSON.parse(localStorage.getItem(s_key__storage));
        if(o_saved){ Object.assign(o_state.o_view, o_saved.o_view); }
    } catch(o_error){ /* Private window or cleared storage: start from the defaults. */ }
};
let f_save_state = function(){
    try{
        localStorage.setItem(s_key__storage, JSON.stringify({ o_view: o_state.o_view }));
    } catch(o_error){ /* Same: nothing is lost but the convenience. */ }
};

let f_el = function(s_id){ return document.getElementById(s_id); };

let f_o_viewer__or_message = function(){
    try{
        return f_o_viewer(f_el('el_canvas'));
    } catch(o_error){
        let el_no_3d = f_el('el_no_3d');
        el_no_3d.hidden = false;
        el_no_3d.textContent = `No 3D preview: ${o_error.message}. The settings, the numbers, the slice and the print files still work.`;
        return f_o_viewer__without_3d();
    }
};
let o_viewer = f_o_viewer__or_message();
let o_bulb = null;
// Where the bulb's bed is in the view: the clip stands below it in the neck, on the desk.
let n_z__shade = 0;
let o_panel__project = null;
// What the worker built last.
let o_data__built = null;
// Shows the next bulb whole: a new or another one. While it changes, the view stays.
let b_frame = true;

let f_set_status = function(s_text, b_error = false){
    let el_status = f_el('el_status');
    el_status.textContent = s_text;
    el_status.dataset.error = b_error ? '1' : '0';
};

let f_s_triangle = function(n_cnt){
    return n_cnt >= 1e6 ? `${(n_cnt / 1e6).toFixed(2)} million` : (n_cnt >= 10000 ? `${Math.round(n_cnt / 1000)} thousand` : String(n_cnt));
};
let f_s_hex = function(a_n_col){
    return '#' + a_n_col.map(function(n){ return n.toString(16).padStart(2, '0'); }).join('');
};

/* ---- The worker: one request at a time. Of the builds only the latest waits, and
   a print file and a loaded object's file wait beside it ---- */

let o_worker = new Worker('./worker.module.js', { type: 'module' });
let n_id__next = 1;
let b_busy = false;
let o_post__waiting_by_type = { object: null, build: null, export: null };
// Who waits for the worker to have read an object's file, by the request's number.
let o_o_promise__by_id = new Map();
let n_id__timeout = 0;
let b_exporting = false;

let f_post = function(o_request, a_o_transfer){
    if(b_busy){
        o_post__waiting_by_type[o_request.s_type] = { o_request, a_o_transfer };
        return;
    }
    b_busy = true;
    o_worker.postMessage(o_request, a_o_transfer);
};

// What the worker gets of the bulb on screen.
let f_o_post = function(s_type, b_draft){
    let o_added = o_kind.f_o_request(o_state.o_setting, b_draft);
    return {
        o_request: { s_type, n_id: n_id__next++, s_kind: 'object', o_setting: structuredClone(o_state.o_setting), ...o_added.o_field },
        a_o_transfer: o_added.a_o_transfer
    };
};

// Gives the worker a 3D object's file, or null for none. Resolves to what it read:
// { a_n_tri, a_n_col, s_note, a_n_min, a_n_max }: the triangles, their colours if there
// are any, why not if the file speaks of some, and the box around the triangles.
// o_more: { s_text__mtl }, the text of an OBJ's MTL, or { a_n_col }, the colours a bulb
// keeps beside its object.
let f_o_object = function(a_n_u8, s_name__file, o_more = {}){
    return new Promise(function(f_resolve, f_reject){
        let n_id = n_id__next++;
        o_o_promise__by_id.set(n_id, { f_resolve, f_reject });
        f_post({ s_type: 'object', n_id, a_n_u8, s_name__file, ...o_more }, a_n_u8 ? [a_n_u8.buffer] : []);
    });
};

let f_request_build = function(b_draft){
    let o_post = f_o_post('build', b_draft);
    f_post(o_post.o_request, o_post.a_o_transfer);
};

// The bulb on screen changed without its shape: its name, its print file.
let f_touched = function(){
    if(o_panel__project){ o_panel__project.f_changed(); }
};

// The bulb on screen changed: builds it anew, coarse first and then fine. b_frame__wanted
// shows it whole.
let f_changed = function(b_frame__wanted = false){
    b_frame = b_frame || b_frame__wanted === true;
    f_touched();
    clearTimeout(n_id__timeout);
    f_request_build(true);
    n_id__timeout = setTimeout(function(){ f_request_build(false); }, n_ms__settle);
};

let f_render_stat = function(){
    if(!o_data__built || !o_bulb){ return; }
    let o_stat = o_data__built.o_stat;
    let o_report = o_kind.f_o_report(o_data__built);
    let a_a_s_row = [
        ['Bulb, as printed', `${o_stat.n_mm__scl_x.toFixed(1)} × ${o_stat.n_mm__scl_z.toFixed(1)} mm`],
        ['Hanging, with the clip', `${(o_stat.n_mm__scl_z + n_z__shade).toFixed(0)} mm`],
        ['Triangles', f_s_triangle(o_stat.n_cnt__triangle)],
        ...o_report.a_a_s_row
    ];
    let el_dl = el('dl');
    for(let [s_label, s_val] of a_a_s_row){
        el_dl.append(el('dt', { textContent: s_label }), el('dd', { textContent: s_val }));
    }
    f_el('el_stat').replaceChildren(el('h2', { textContent: 'This bulb' }), el_dl, el('p', { id: 'el_note', textContent: o_report.a_s_note.join(' ') }));
    return o_report;
};

let f_frame = function(){
    b_frame = false;
    o_viewer.f_frame(n_z__shade + o_data__built.o_stat.n_mm__scl_z, 0);
};

let f_set_export_busy = function(b_on){
    for(let el_button of document.querySelectorAll('[data-export]')){ el_button.disabled = b_on; }
};

o_worker.onmessage = function(o_event){
    let o_data = o_event.data;
    b_busy = false;
    if(o_data.s_type === 'built'){
        o_data__built = o_data;
        o_viewer.f_set_mesh(o_data);
        o_viewer.f_set_view({ b_single_wall: o_data.b_single_wall });
        if(b_frame){ f_frame(); }
        let o_report = f_render_stat();
        f_render_section();
        f_render_export();
        if(o_report.s_error){
            f_set_status(o_report.s_error, true);
        } else {
            f_set_status(`${f_s_triangle(o_data.o_stat.n_cnt__triangle)} triangles · ${Math.round(o_data.n_ms)} ms`);
        }
    } else if(o_data.s_type === 'exported'){
        b_exporting = false;
        let el_link = el('a', { href: URL.createObjectURL(o_data.o_blob), download: o_data.s_name });
        document.body.append(el_link);
        el_link.click();
        el_link.remove();
        setTimeout(function(){ URL.revokeObjectURL(el_link.href); }, 60000);
        let s_filament = o_data.a_a_n_col__filament?.length > 1 ? `, painted for ${o_data.a_a_n_col__filament.length} filaments` : '';
        f_set_status(`Saved ${o_data.s_name}: ${f_s_triangle(o_data.n_cnt__triangle)} triangles${s_filament}, ${(o_data.o_blob.size / 1e6).toFixed(1)} MB, ${(o_data.n_ms / 1000).toFixed(1)} s`);
        f_set_export_busy(false);
    } else if(o_data.s_type === 'object_loaded'){
        o_o_promise__by_id.get(o_data.n_id)?.f_resolve(o_data);
        o_o_promise__by_id.delete(o_data.n_id);
    } else if(o_data.s_type === 'error' && o_data.s_for === 'object'){
        o_o_promise__by_id.get(o_data.n_id)?.f_reject(new Error(o_data.s_message));
        o_o_promise__by_id.delete(o_data.n_id);
    } else if(o_data.s_type === 'error'){
        if(o_data.s_for === 'export'){
            b_exporting = false;
            f_set_export_busy(false);
        }
        // With a mistake the last good bulb stays.
        f_set_status(o_data.s_message, true);
    }
    let o_post = o_post__waiting_by_type.object ?? o_post__waiting_by_type.export ?? o_post__waiting_by_type.build;
    if(o_post){
        o_post__waiting_by_type[o_post.o_request.s_type] = null;
        f_post(o_post.o_request, o_post.a_o_transfer);
    }
};

let f_export = function(s_format){
    if(b_exporting){ return; }
    let o_post = f_o_post('export', false);
    b_exporting = true;
    f_set_export_busy(true);
    f_set_status('Building the print file…');
    Object.assign(o_post.o_request, { s_format, s_name__project: o_panel__project ? o_panel__project.f_s_name() : '' });
    f_post(o_post.o_request, o_post.a_o_transfer);
};

/* ---- The object ---- */

let o_app = {
    el_source: f_el('el_source'),
    el_control: f_el('el_control'),
    o_viewer,
    f_o_object,
    f_changed,
    f_touched,
    f_render_stat,
    // The print files on offer are others once an object has colours.
    f_render_export: function(){ f_render_export(); },
    f_set_status,
    f_when_safe: function(f_action){ o_panel__project.f_when_safe(f_action); },
    f_n_deg__limit: function(){ return o_state.o_view.n_deg__limit; }
};
let o_kind = f_o_kind__object(o_app);
o_state.o_setting = o_kind.f_o_setting__default();

/* ---- The clip, in the neck ---- */

let f_load_part = async function(){
    let o_response = await fetch('part/clip.stl');
    // Screwed in all the way: its tip at the neck's top, its end on the desk.
    if(o_response.ok){ o_viewer.f_set_part([{ o_buffer: await o_response.arrayBuffer(), n_z: 0 }]); }
};

/* ---- The view ---- */

let f_render_section = function(){
    let n_nor = o_state.o_view.n_nor__section;
    let n_mm__scl_z = o_data__built ? o_data__built.o_stat.n_mm__scl_z : 0;
    f_el('el_section_val').textContent = `${n_nor.toFixed(3)}\nz ${(n_nor * n_mm__scl_z).toFixed(1)}`;
    f_render_slice();
};

// The layer at the section's height, as a slicer cuts it: where the plane crosses the
// bulb's triangles, each piece in its triangle's colour, the wall filled between.
let f_render_slice = function(){
    let el_slice = f_el('el_slice');
    let n_nor = o_state.o_view.n_nor__section;
    el_slice.hidden = !o_data__built || n_nor >= 1;
    if(el_slice.hidden){ return; }
    let { a_n_pos, a_n_idx, a_n_col } = o_data__built;
    let n_mm__scl_z = o_data__built.o_stat.n_mm__scl_z;
    // Off the round heights the mesh's points lie on.
    let n_z = Math.min(Math.max(n_nor * n_mm__scl_z, 1e-4), n_mm__scl_z - 1e-4) + 1.234e-5;
    // A piece for each triangle the plane crosses: its two ends, each on an edge of the
    // mesh, which the piece of the triangle on that edge's other side shares.
    let n_cnt__vertex = a_n_pos.length / 3;
    let a_o_piece = [];
    let o_a_n_piece__by_edge = new Map();
    let n_r = 0;
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let a_n_corner = [a_n_idx[n_off], a_n_idx[n_off + 1], a_n_idx[n_off + 2]];
        let a_a_n = [], a_n_edge = [];
        for(let n_k = 0; n_k < 3; n_k++){
            let n_a = a_n_corner[n_k], n_b = a_n_corner[(n_k + 1) % 3];
            let n_za = a_n_pos[n_a * 3 + 2], n_zb = a_n_pos[n_b * 3 + 2];
            if((n_za < n_z) === (n_zb < n_z)){ continue; }
            let n_t = (n_z - n_za) / (n_zb - n_za);
            a_a_n.push([a_n_pos[n_a * 3] + n_t * (a_n_pos[n_b * 3] - a_n_pos[n_a * 3]), a_n_pos[n_a * 3 + 1] + n_t * (a_n_pos[n_b * 3 + 1] - a_n_pos[n_a * 3 + 1])]);
            a_n_edge.push(Math.min(n_a, n_b) * n_cnt__vertex + Math.max(n_a, n_b));
        }
        if(a_a_n.length !== 2){ continue; }
        let a_n_col__piece = [0, 1, 2].map(function(n_k){ return Math.round((a_n_col[a_n_corner[0] * 3 + n_k] + a_n_col[a_n_corner[1] * 3 + n_k] + a_n_col[a_n_corner[2] * 3 + n_k]) / 3); });
        for(let n_edge of a_n_edge){
            if(!o_a_n_piece__by_edge.has(n_edge)){ o_a_n_piece__by_edge.set(n_edge, []); }
            o_a_n_piece__by_edge.get(n_edge).push(a_o_piece.length);
        }
        a_o_piece.push({ a_a_n, a_n_edge, s_col: f_s_hex(a_n_col__piece) });
        n_r = Math.max(n_r, Math.hypot(...a_a_n[0]), Math.hypot(...a_a_n[1]));
    }
    let el_canvas = f_el('el_slice_canvas');
    let n_px = el_canvas.width;
    let o_ctx = el_canvas.getContext('2d');
    o_ctx.fillStyle = '#1b1d22';
    o_ctx.fillRect(0, 0, n_px, n_px);
    // The whole bulb's width, so the layers keep their size while the slider moves.
    let n_px_per_mm = 0.92 * n_px / Math.max(o_data__built.o_stat.n_mm__scl_x, 1);
    let f_a_n_px = function(a_n){ return [n_px / 2 + a_n[0] * n_px_per_mm, n_px / 2 - a_n[1] * n_px_per_mm]; };
    // The wall: the pieces, joined end to end, are its outlines, which close; filled
    // even-odd, what lies between two outlines is plastic.
    let a_b_done = new Uint8Array(a_o_piece.length);
    o_ctx.beginPath();
    for(let n_start = 0; n_start < a_o_piece.length; n_start++){
        if(a_b_done[n_start]){ continue; }
        let n_piece = n_start, n_edge = a_o_piece[n_start].a_n_edge[0];
        o_ctx.moveTo(...f_a_n_px(a_o_piece[n_start].a_a_n[0]));
        while(n_piece !== undefined && !a_b_done[n_piece]){
            a_b_done[n_piece] = 1;
            let o_piece = a_o_piece[n_piece];
            let n_end = o_piece.a_n_edge[0] === n_edge ? 1 : 0;
            o_ctx.lineTo(...f_a_n_px(o_piece.a_a_n[n_end]));
            n_edge = o_piece.a_n_edge[n_end];
            n_piece = o_a_n_piece__by_edge.get(n_edge).find(function(n){ return n !== n_piece; });
        }
        o_ctx.closePath();
    }
    o_ctx.fillStyle = 'rgba(233, 226, 211, 0.55)';
    o_ctx.fill('evenodd');
    o_ctx.lineWidth = Math.max(1, 0.15 * n_px_per_mm);
    o_ctx.lineCap = 'round';
    for(let o_piece of a_o_piece){
        o_ctx.strokeStyle = o_piece.s_col;
        o_ctx.beginPath();
        o_ctx.moveTo(...f_a_n_px(o_piece.a_a_n[0]));
        o_ctx.lineTo(...f_a_n_px(o_piece.a_a_n[1]));
        o_ctx.stroke();
    }
    // 10 mm for the scale.
    o_ctx.strokeStyle = '#d8d0bc';
    o_ctx.lineWidth = 2;
    o_ctx.beginPath();
    o_ctx.moveTo(10, n_px - 12);
    o_ctx.lineTo(10 + 10 * n_px_per_mm, n_px - 12);
    o_ctx.stroke();
    o_ctx.fillStyle = '#d8d0bc';
    o_ctx.font = '12px sans-serif';
    o_ctx.fillText('10 mm', 12, n_px - 18);
    f_el('el_slice_label').textContent = `Layer ${Math.floor(n_z / n_mm__layer) + 1} at ${n_mm__layer} mm · z ${(n_nor * n_mm__scl_z).toFixed(2)} mm · ${n_r > 0 ? `Ø${(2 * n_r).toFixed(1)}` : 'empty'}`;
};

let f_apply_view = function(){
    let o_view = o_state.o_view;
    let s_hex = o_view.s_light__col;
    // sRGB to linear, as the shader works in linear light.
    let a_n_col = [1, 3, 5].map(n_off => Math.pow(parseInt(s_hex.slice(n_off, n_off + 2), 16) / 255, 2.2));
    o_viewer.f_set_view({
        s_look: o_view.s_look,
        b_cut: o_view.b_cut,
        b_base: o_view.b_base,
        n_nor__section: o_view.n_nor__section,
        n_light: o_view.n_light,
        n_deg__limit: o_view.n_deg__limit,
        a_n_light__col: a_n_col
    });
    o_viewer.f_set_mini(o_view.b_mini ? [...document.querySelectorAll('.mini')].map(function(el_mini){
        return { el: el_mini, n_rad__azimuth: Number(el_mini.dataset.az) * n_deg, n_rad__polar: (90 - Number(el_mini.dataset.el)) * n_deg };
    }) : []);
    f_el('el_mini').hidden = !o_view.b_mini;
    f_el('el_mini_toggle').textContent = o_view.b_mini ? '▼' : '▲';
    f_el('el_stage').dataset.look = o_view.s_look;
    f_el('el_legend').hidden = o_view.s_look !== 'overhang';
    for(let el_row of document.querySelectorAll('[data-only-look]')){
        el_row.hidden = el_row.dataset.onlyLook !== o_view.s_look;
    }
    f_render_section();
};

let f_render_look = function(){
    f_el('el_look').replaceChildren(...a_o_look.map(function(o_look){
        let el_button = el('button', { type: 'button', textContent: o_look.s_label });
        el_button.setAttribute('aria-pressed', String(o_state.o_view.s_look === o_look.s_look));
        el_button.addEventListener('click', function(){
            o_state.o_view.s_look = o_look.s_look;
            f_render_look();
            f_apply_view();
            f_save_state();
        });
        return el_button;
    }));
};

let f_render_view = function(){
    let f_changed_view = function(){
        f_apply_view();
        f_render_stat();
        f_save_state();
    };
    let el_group = f_el__group('View', []);
    for(let o_control of a_o_control__view){
        let el_row = f_el__control(o_control, o_state.o_view, f_changed_view);
        el_row.dataset.onlyLook = o_control.s_only_look;
        el_group.append(el_row);
    }
    let el_color = el('input', { type: 'color', value: o_state.o_view.s_light__col });
    el_color.addEventListener('input', function(){
        o_state.o_view.s_light__col = el_color.value;
        f_changed_view();
    });
    let el_row__color = el('label', { className: 'row row--pair' }, [el('span', { textContent: 'Colour of the LED' }), el_color]);
    el_row__color.dataset.onlyLook = 'lit';
    el_group.append(el_row__color, el('small', { className: 'row__note row', textContent: 'Lit shows what the wall’s thickness does to the LED’s light: an estimate. Overhang shows the faces past the limit. Edges, Vertices and X-ray show the mesh as it is exported. The slider beside the view cuts it: below the top, the layer there shows as a slicer cuts it.' }));
    f_el('el_view').replaceChildren(el_group);
    f_el('el_legend').replaceChildren(...a_o_legend.map(function(o_legend){
        let el_swatch = el('i');
        el_swatch.style.background = o_legend.s_col;
        return el('div', {}, [el_swatch, o_legend.s_text]);
    }));
};

/* ---- The print files ---- */

let f_render_export = function(){
    let f_el__export = function(s_text, s_format, s_class = 'action'){
        let el_button = el('button', { type: 'button', className: s_class, textContent: s_text });
        el_button.dataset.export = '1';
        el_button.disabled = b_exporting;
        el_button.addEventListener('click', function(){ f_export(s_format); });
        return el_button;
    };
    let a_a_n_col = o_kind.f_b_color() && o_data__built ? o_data__built.o_stat.a_a_n_col__filament : null;
    let a_el = [el('h2', { textContent: 'Print files' })];
    if(a_a_n_col){
        a_el.push(
            f_el__export(`Download bulb and clip (3MF, ${a_a_n_col.length} ${a_a_n_col.length === 1 ? 'colour' : 'colours'} for Bambu Studio)`, 'bulb_clip', 'action action--main'),
            f_el__export('Download bulb (3MF, its colours painted)', '3mf'),
            el('p', { className: 'row__note', textContent: 'Bambu Studio reads the painted filaments. Put these colours in its filament slots, in this order, before opening the file:' }),
            el('ol', { className: 'filament' }, a_a_n_col.map(function(a_n_col){
                let el_swatch = el('i');
                el_swatch.style.background = f_s_hex(a_n_col);
                return el('li', {}, [el_swatch, f_s_hex(a_n_col)]);
            })),
            f_el__export('Download bulb (OBJ, a colour per point)', 'obj'),
            f_el__export('Download bulb (STL, no colours)', 'stl')
        );
    } else {
        a_el.push(
            f_el__export('Download bulb and clip (3MF)', 'bulb_clip', 'action action--main'),
            f_el__export('Download bulb (STL)', 'stl'),
            f_el__export('Download bulb (3MF, smaller file)', '3mf')
        );
    }
    a_el.push(
        el('p', { className: 'row__note', textContent: 'The clip alone, the same for every bulb:' }),
        el('div', { className: 'action_row' }, [el('a', { className: 'action', href: 'part/clip.stl', download: 'lichterkette_clip.stl', textContent: 'clip' })])
    );
    f_el('el_export').replaceChildren(...a_el);
};

/* ---- The bulbs ---- */

// Puts a whole bulb on screen.
let f_set_design = async function(o_design, s_name){
    o_state.o_setting = o_design.o_setting;
    if(s_name === null){ await o_kind.f_reset_extra(); } else { await o_kind.f_load_extra(s_name, o_design.o_setting); }
    o_kind.f_show(o_state.o_setting);
    f_render_export();
    f_changed(true);
};

let f_o_design__of_project = function(o_project){
    return { s_kind: 'object', o_setting: o_kind.f_o_setting__of_saved(o_project.o_setting) };
};

let f_start = async function(){
    f_load_state();
    f_render_look();
    f_render_view();
    f_el('el_cut').checked = o_state.o_view.b_cut;
    f_el('el_base').checked = o_state.o_view.b_base;
    f_el('el_section_range').value = o_state.o_view.n_nor__section;
    for(let [s_id, s_key] of [['el_cut', 'b_cut'], ['el_base', 'b_base']]){
        f_el(s_id).addEventListener('change', function(o_evt){
            o_state.o_view[s_key] = o_evt.target.checked;
            f_apply_view();
            f_save_state();
        });
    }
    f_el('el_section_range').addEventListener('input', function(o_evt){
        o_state.o_view.n_nor__section = Number(o_evt.target.value);
        f_apply_view();
        f_save_state();
    });
    f_el('el_mini_toggle').addEventListener('click', function(){
        o_state.o_view.b_mini = !o_state.o_view.b_mini;
        f_apply_view();
        f_save_state();
    });
    // The cube turns with the eye, and a click on a side looks from there.
    for(let el_face of f_el('el_cube').children){
        el_face.addEventListener('click', function(){
            o_viewer.f_look_from(Number(el_face.dataset.az) * n_deg, (90 - Number(el_face.dataset.el)) * n_deg);
        });
    }
    o_viewer.f_set_on_camera(function(n_rad__azimuth, n_rad__polar){
        f_el('el_cube').style.transform = `rotateX(${n_rad__polar / n_deg - 90}deg) rotateY(${-(n_rad__azimuth / n_deg + 90)}deg)`;
    });
    f_apply_view();

    try{
        let o_response = await fetch('part/bulb.json');
        if(!o_response.ok){ throw new Error('part/bulb.json is missing. Run: deno task part'); }
        o_bulb = await o_response.json();
    } catch(o_error){
        f_set_status(o_error.message, true);
        return;
    }
    // The clip's end is on the desk, the bulb's bed as high as the clip stands out of it.
    n_z__shade = o_bulb.n_mm__clip_scl_z - o_bulb.n_mm__neck_scl_z;
    o_viewer.f_set_shade_z(n_z__shade);
    o_viewer.f_set_view({ a_n_light__pos: [0, 0, n_z__shade + o_bulb.n_mm__neck_scl_z + n_mm__led_above_neck], a_n_absorb: o_kind.a_n_absorb });
    f_load_part();

    o_panel__project = f_o_panel__project({
        el_root: f_el('el_project'),
        f_o_design: function(){
            return { s_kind: 'object', o_setting: o_state.o_setting };
        },
        f_o_design__blank: function(){
            return { s_kind: 'object', o_setting: o_kind.f_o_setting__default() };
        },
        f_o_design__of_project,
        f_open_design: function(o_project){ return f_set_design(f_o_design__of_project(o_project), o_project.s_name); },
        f_new_design: function(){
            return f_set_design({ s_kind: 'object', o_setting: o_kind.f_o_setting__default() }, null);
        },
        // A bulb keeps its object's file beside its settings.
        f_save_extra: function(s_name){ return o_kind.f_save_extra(s_name); },
        f_b_extra_dirty: function(){ return o_kind.f_b_extra_dirty(); },
        f_o_row: function(o_project){
            return {
                s_summary: o_kind.f_s_summary(o_project.o_setting),
                s_src__thumbnail: null,
                s_badge: 'B'
            };
        },
        // The address names the open bulb, so a reload opens it again.
        f_opened: function(s_name){
            history.replaceState(null, '', s_name === null ? location.pathname : `#${encodeURIComponent(s_name)}`);
        },
        f_set_status
    });
    let s_name__wanted = null;
    try{
        s_name__wanted = decodeURIComponent(location.hash.slice(1)) || null;
    } catch(o_error){ /* Not a name: a new bulb. */ }
    if(!await o_panel__project.f_b_started(s_name__wanted)){
        o_kind.f_show(o_state.o_setting);
        f_render_export();
        f_changed(true);
    }
    // Closing the page with unsaved changes asks first.
    window.addEventListener('beforeunload', function(o_evt){
        if(o_panel__project.f_b_dirty()){ o_evt.preventDefault(); }
    });
};

f_start();
