// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The page: one lamp at a time, which is the base of a brand and a lampshade of one
// kind with that kind's settings. The kinds bring their own controls, the worker
// builds the lampshade, the viewer shows it, and the project panel keeps the lamps.

import { f_o_viewer, f_o_viewer__without_3d } from './viewer.module.js';
import { el } from './dom.module.js';
import { f_el__control, f_el__group } from './control.module.js';
import { f_o_editor } from './editor.module.js';
import { f_o_panel__project } from './project.module.js';
import { f_o_kind__sphere } from './kind_sphere.module.js';
import { f_o_kind__vase, s_declaration } from './kind_vase.module.js';
import { f_o_kind__egg } from './kind_egg.module.js';
import { f_o_kind__object } from './kind_object.module.js';

let s_key__storage = 'pucklight_lamp_app_v1';
// A kind that builds a coarse lampshade while a slider moves builds the fine one this
// long after it stopped, in ms.
let n_ms__settle = 220;
let n_deg = Math.PI / 180;

let a_o_look = [
    { s_look: 'day', s_label: 'Daylight' },
    { s_look: 'lit', s_label: 'Lit' },
    { s_look: 'overhang', s_label: 'Overhang' },
    { s_look: 'edges', s_label: 'Edges' },
    { s_look: 'vertices', s_label: 'Vertices' },
    { s_look: 'xray', s_label: 'X-ray' }
];
let a_o_brand = [
    { s_brand: 'veryos', s_label: 'VeryOS' },
    { s_brand: 'tracetrove', s_label: 'TraceTrove' }
];
let a_s_part = ['toppart', 'screwin'];
let a_o_control__view = [
    { s_key: 'n_light', s_label: 'Brightness', n_min: 0.15, n_max: 2, n_step: 0.05, s_unit: '', n_decimal: 2, s_only_look: 'lit' },
    { s_key: 'n_deg__limit', s_label: 'Overhang limit', n_min: 30, n_max: 70, n_step: 1, s_unit: '°', n_decimal: 0, s_only_look: 'overhang' }
];
// The Overhang look's colours, as viewer.module.js mixes them.
let a_o_legend = [
    { s_text: 'overhang past the limit, to red at 90°', s_col: 'linear-gradient(to right, #ffcf5c, #f93a3a)' },
    { s_text: 'a single wall that leans in past it, to dark blue', s_col: 'linear-gradient(to right, #9bcbfa, #3f61e6)' },
    { s_text: 'thread: fixed', s_col: '#6f6f6f' }
];

let o_state = {
    s_kind: 'sphere',
    s_brand: 'veryos',
    // Each kind's settings stay while the page is open, so a look at another kind loses nothing.
    o_setting__by_kind: {},
    o_view: { s_look: 'day', b_cut: false, b_base: true, b_mini: true, n_nor__section: 1, n_light: 1, n_deg__limit: 45, s_light__col: '#ffdcb4' }
};

// The kind and the view are remembered in this browser; the lamps are the server's.
let f_load_state = function(){
    try{
        let o_saved = JSON.parse(localStorage.getItem(s_key__storage));
        if(o_saved){
            Object.assign(o_state.o_view, o_saved.o_view);
            if(o_kind__by_name[o_saved.s_kind]){ o_state.s_kind = o_saved.s_kind; }
        }
    } catch(o_error){ /* Private window or cleared storage: start from the defaults. */ }
};
let f_save_state = function(){
    try{
        localStorage.setItem(s_key__storage, JSON.stringify({ s_kind: o_state.s_kind, o_view: o_state.o_view }));
    } catch(o_error){ /* Same: nothing is lost but the convenience. */ }
};

let f_el = function(s_id){ return document.getElementById(s_id); };

let f_o_viewer__or_message = function(){
    try{
        return f_o_viewer(f_el('el_canvas'));
    } catch(o_error){
        let el_no_3d = f_el('el_no_3d');
        el_no_3d.hidden = false;
        el_no_3d.textContent = `No 3D preview: ${o_error.message}. The settings, the numbers and the print files still work.`;
        return f_o_viewer__without_3d();
    }
};
let o_viewer = f_o_viewer__or_message();
let o_lamp = null;
let o_panel__project = null;
// What the worker built last, of the kind on screen.
let o_data__built = null;
// Shows the next lampshade whole: a new or another lamp. While it changes, the view stays.
let b_frame = true;

let f_set_status = function(s_text, b_error = false){
    let el_status = f_el('el_status');
    el_status.textContent = s_text;
    el_status.dataset.error = b_error ? '1' : '0';
};

let f_s_triangle = function(n_cnt){
    return n_cnt >= 1e6 ? `${(n_cnt / 1e6).toFixed(2)} million` : (n_cnt >= 10000 ? `${Math.round(n_cnt / 1000)} thousand` : String(n_cnt));
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

// What the worker gets of the lamp on screen. A kind adds what it has to: a sphere its
// heightmap. Returns null if the kind cannot tell yet, with the reason in the status.
let f_o_post = function(s_type, b_draft){
    let o_kind = o_kind__by_name[o_state.s_kind];
    let o_setting = o_state.o_setting__by_kind[o_state.s_kind];
    let o_added;
    try{
        o_added = o_kind.f_o_request(o_setting, b_draft);
    } catch(o_error){
        f_set_status(o_error.message, true);
        return null;
    }
    return {
        o_request: {
            s_type, n_id: n_id__next++, s_kind: o_state.s_kind, s_brand: o_state.s_brand,
            o_setting: structuredClone(o_setting), ...o_added.o_field
        },
        a_o_transfer: o_added.a_o_transfer
    };
};

// Gives the worker a 3D object's file, or null for none. Resolves to what it read:
// { a_n_tri, a_n_col, s_note, a_n_min, a_n_max }: the triangles, their colours if there
// are any, why not if the file speaks of some, and the box around the triangles.
// o_more: { s_text__mtl }, the text of an OBJ's MTL, or { a_n_col }, the colours a lamp
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
    if(o_post){ f_post(o_post.o_request, o_post.a_o_transfer); }
};

// The lamp on screen changed without its lampshade: its colours, its name, its print file.
let f_touched = function(){
    if(o_panel__project){ o_panel__project.f_changed(); }
};

// The lampshade on screen changed: builds it anew. b_frame__wanted shows it whole.
let f_changed = function(b_frame__wanted = false){
    b_frame = b_frame || b_frame__wanted === true;
    f_touched();
    let o_kind = o_kind__by_name[o_state.s_kind];
    clearTimeout(n_id__timeout);
    f_request_build(o_kind.b_draft);
    if(o_kind.b_draft){
        n_id__timeout = setTimeout(function(){ f_request_build(false); }, n_ms__settle);
    }
};

let f_render_stat = function(){
    if(!o_data__built || !o_lamp){ return; }
    let o_kind = o_kind__by_name[o_state.s_kind];
    let o_stat = o_data__built.o_stat;
    let o_report = o_kind.f_o_report(o_data__built);
    let a_a_s_row = [
        ['Lampshade, as printed', `${o_stat.n_mm__scl_x.toFixed(1)} × ${o_stat.n_mm__scl_z.toFixed(1)} mm`],
        ['Whole lamp, on the desk', `${(o_stat.n_mm__scl_z + o_lamp.n_mm__cup_floor_z + o_lamp.n_mm__float_z).toFixed(0)} mm`],
        ['Triangles', f_s_triangle(o_stat.n_cnt__triangle)],
        ...o_report.a_a_s_row
    ];
    let el_dl = el('dl');
    for(let [s_label, s_val] of a_a_s_row){
        el_dl.append(el('dt', { textContent: s_label }), el('dd', { textContent: s_val }));
    }
    f_el('el_stat').replaceChildren(el('h2', { textContent: 'This lampshade' }), el_dl, el('p', { id: 'el_note', textContent: o_report.a_s_note.join(' ') }));
    return o_report;
};

let f_frame = function(){
    b_frame = false;
    o_viewer.f_frame(o_lamp.n_mm__cup_floor_z + o_data__built.o_stat.n_mm__scl_z, 0);
};

let f_set_export_busy = function(b_on){
    for(let el_button of document.querySelectorAll('[data-export]')){ el_button.disabled = b_on; }
};

o_worker.onmessage = function(o_event){
    let o_data = o_event.data;
    b_busy = false;
    if(o_data.s_type === 'built'){
        // A lampshade of the kind that was on screen when it was asked for.
        if(o_data.s_kind === o_state.s_kind){
            o_data__built = o_data;
            o_viewer.f_set_mesh(o_data);
            o_viewer.f_set_view({ b_single_wall: o_data.b_single_wall });
            if(b_frame){ f_frame(); }
            let o_report = f_render_stat();
            f_render_section();
            if(o_report.s_error){
                f_set_status(o_report.s_error, true);
            } else {
                f_set_status(`${o_kind__by_name[o_data.s_kind].s_title} · ${f_s_triangle(o_data.o_stat.n_cnt__triangle)} triangles · ${Math.round(o_data.n_ms)} ms`);
            }
        }
    } else if(o_data.s_type === 'exported'){
        b_exporting = false;
        let el_link = el('a', { href: URL.createObjectURL(o_data.o_blob), download: o_data.s_name });
        document.body.append(el_link);
        el_link.click();
        el_link.remove();
        setTimeout(function(){ URL.revokeObjectURL(el_link.href); }, 60000);
        f_set_status(`Saved ${o_data.s_name}: ${f_s_triangle(o_data.n_cnt__triangle)} triangles, ${(o_data.o_blob.size / 1e6).toFixed(1)} MB, ${(o_data.n_ms / 1000).toFixed(1)} s`);
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
        // With a mistake the last good lampshade stays.
        if(o_data.s_kind === o_state.s_kind){
            let o_kind = o_kind__by_name[o_data.s_kind];
            f_set_status(o_kind.f_s_error ? o_kind.f_s_error(o_data) : o_data.s_message, true);
        }
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
    if(!o_post){ return; }
    b_exporting = true;
    f_set_export_busy(true);
    f_set_status('Building the print file…');
    Object.assign(o_post.o_request, { s_format, s_name__project: o_panel__project ? o_panel__project.f_s_name() : '' });
    f_post(o_post.o_request, o_post.a_o_transfer);
};

/* ---- The kinds ---- */

let el_editor = f_el('el_editor');
let o_app = {
    el_source: f_el('el_source'),
    el_control: f_el('el_control'),
    o_viewer,
    f_o_object,
    o_editor: f_o_editor(el_editor, function(s_text){ o_kind__by_name[o_state.s_kind].f_typed?.(s_text); }, s_declaration),
    f_changed,
    f_touched,
    f_render_stat,
    // The print files on offer are others once an object has colours.
    f_render_export: function(){ f_render_export(); },
    f_set_status,
    // Other colours for the lampshade on screen.
    f_recolored: function(a_n_col){ o_viewer.f_set_color(a_n_col); },
    f_when_safe: function(f_action){ o_panel__project.f_when_safe(f_action); },
    f_n_deg__limit: function(){ return o_state.o_view.n_deg__limit; }
};
let o_kind__by_name = Object.fromEntries([f_o_kind__sphere, f_o_kind__vase, f_o_kind__egg, f_o_kind__object].map(function(f_o_kind){
    let o_kind = f_o_kind(o_app);
    return [o_kind.s_kind, o_kind];
}));
for(let o_kind of Object.values(o_kind__by_name)){
    o_state.o_setting__by_kind[o_kind.s_kind] = o_kind.f_o_setting__default();
}

// Puts the kind of the lamp on screen: its controls, and its entry in the lists.
let f_show_kind = function(){
    let o_kind = o_kind__by_name[o_state.s_kind];
    for(let o_other of Object.values(o_kind__by_name)){
        if(o_other !== o_kind){ o_other.f_hide(); }
    }
    o_data__built = null;
    f_el('el_app').dataset.kind = o_state.s_kind;
    el_editor.hidden = !o_kind.b_editor;
    o_kind.f_show(o_state.o_setting__by_kind[o_state.s_kind]);
    o_viewer.f_set_view({ a_n_absorb: o_kind.a_n_absorb });
    f_el('el_kind').replaceChildren(...Object.values(o_kind__by_name).map(function(o_other){
        let el_button = el('button', { type: 'button', textContent: o_other.s_title, title: o_other.s_note });
        el_button.setAttribute('aria-pressed', String(o_other === o_kind));
        el_button.addEventListener('click', function(){
            if(o_other === o_kind){ return; }
            o_state.s_kind = o_other.s_kind;
            f_save_state();
            f_show_kind();
            f_changed(true);
        });
        return el_button;
    }));
    f_el('el_kind_note').textContent = o_kind.s_note;
    f_render_export();
};

/* ---- The base: the parts of the brand ---- */

let o_a_o_stl__by_brand = {};

let f_load_part = async function(){
    let s_brand = o_state.s_brand;
    if(!o_a_o_stl__by_brand[s_brand]){
        o_a_o_stl__by_brand[s_brand] = [];
        for(let s_part of a_s_part){
            let o_response = await fetch(`part/${s_brand}/${s_part}.stl`);
            // The lamp as it is pressed down onto the desk: every part on the desk.
            if(o_response.ok){ o_a_o_stl__by_brand[s_brand].push({ o_buffer: await o_response.arrayBuffer(), n_z: 0 }); }
        }
    }
    if(s_brand === o_state.s_brand){ o_viewer.f_set_part(o_a_o_stl__by_brand[s_brand]); }
};

/* ---- The view ---- */

let f_render_section = function(){
    let n_nor = o_state.o_view.n_nor__section;
    let n_mm__scl_z = o_data__built ? o_data__built.o_stat.n_mm__scl_z : 0;
    f_el('el_section_val').textContent = `${n_nor.toFixed(3)}\nz ${(n_nor * n_mm__scl_z).toFixed(1)}`;
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
    let el_row__color = el('label', { className: 'row row--pair' }, [el('span', { textContent: 'Colour of the puck light' }), el_color]);
    el_row__color.dataset.onlyLook = 'lit';
    el_group.append(el_row__color, el('small', { className: 'row__note row', textContent: 'Lit shows what the wall’s thickness does to the light: an estimate. Overhang shows the faces past the limit. Edges, Vertices and X-ray show the mesh as it is exported.' }));
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
    let el_brand = el('select', {}, a_o_brand.map(function(o_brand){ return el('option', { value: o_brand.s_brand, textContent: o_brand.s_label }); }));
    el_brand.value = o_state.s_brand;
    el_brand.setAttribute('aria-label', 'Brand');
    el_brand.addEventListener('change', function(){
        o_state.s_brand = el_brand.value;
        f_render_export();
        f_load_part();
        // Only an egg carries the brand's logo itself.
        if(o_state.s_kind === 'egg'){ f_changed(); } else { f_touched(); }
    });
    let a_el = [
        el('h2', { textContent: 'Print files' }),
        el('label', { className: 'row' }, [
            el('span', { className: 'row__top' }, [el('span', { textContent: 'Brand' }), el_brand]),
            el('small', { className: 'row__note', textContent: 'Whose logo the base parts carry, and an egg if it has one engraved.' })
        ]),
        f_el__export('Download lampshade (STL)', 'stl', 'action action--main'),
        f_el__export('Download lampshade (3MF, smaller file)', '3mf')
    ];
    if(o_kind__by_name[o_state.s_kind].f_b_color?.()){ a_el.push(f_el__export('Download lampshade (OBJ, with its colours)', 'obj')); }
    a_el.push(
        f_el__export('Download whole lamp (3MF, 3 parts)', 'lamp'),
        el('p', { className: 'row__note', textContent: 'The base parts alone, as they are in every lamp of the brand:' }),
        el('div', { className: 'action_row' }, a_s_part.map(function(s_part){
            return el('a', { className: 'action', href: `part/${o_state.s_brand}/${s_part}.stl`, download: `pucklight_lamp_${o_state.s_brand}_${s_part}.stl`, textContent: s_part });
        }))
    );
    f_el('el_export').replaceChildren(...a_el);
};

/* ---- The lamps ---- */

let f_o_design__of_project = function(o_project){
    return {
        s_kind: o_project.s_kind,
        s_brand: o_project.s_brand,
        o_setting: o_kind__by_name[o_project.s_kind].f_o_setting__of_saved(o_project.o_setting)
    };
};

// Puts a whole lamp on screen: its kind, its brand and that kind's settings.
let f_set_design = async function(o_design, s_name){
    o_state.s_kind = o_design.s_kind;
    o_state.s_brand = o_design.s_brand;
    o_state.o_setting__by_kind[o_design.s_kind] = o_design.o_setting;
    let o_kind = o_kind__by_name[o_design.s_kind];
    if(s_name === null){ await o_kind.f_reset_extra?.(); } else { await o_kind.f_load_extra?.(s_name, o_design.o_setting); }
    f_save_state();
    f_show_kind();
    f_load_part();
    f_changed(true);
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
        let o_response = await fetch('part/lamp.json');
        if(!o_response.ok){ throw new Error('part/lamp.json is missing. Run: deno task part'); }
        o_lamp = await o_response.json();
    } catch(o_error){
        f_set_status(o_error.message, true);
        return;
    }
    // The lampshade stands on the floor of the cup, the puck's lens shines below it.
    o_viewer.f_set_shade_z(o_lamp.n_mm__cup_floor_z);
    o_viewer.f_set_view({ a_n_light__pos: [0, 0, o_lamp.n_mm__puck_top_z] });
    for(let o_kind of Object.values(o_kind__by_name)){ await o_kind.f_start?.(); }

    o_panel__project = f_o_panel__project({
        el_root: f_el('el_project'),
        f_o_design: function(){
            return { s_kind: o_state.s_kind, s_brand: o_state.s_brand, o_setting: o_state.o_setting__by_kind[o_state.s_kind] };
        },
        f_o_design__blank: function(){
            return { s_kind: o_state.s_kind, s_brand: 'veryos', o_setting: o_kind__by_name[o_state.s_kind].f_o_setting__default() };
        },
        f_o_design__of_project,
        f_open_design: function(o_project){ return f_set_design(f_o_design__of_project(o_project), o_project.s_name); },
        f_new_design: function(){
            return f_set_design({ s_kind: o_state.s_kind, s_brand: 'veryos', o_setting: o_kind__by_name[o_state.s_kind].f_o_setting__default() }, null);
        },
        // A sphere keeps a file beside its settings, its texture, and an object its
        // object: a lamp that is of another kind now gives them up.
        f_save_extra: async function(s_name){
            for(let o_kind of Object.values(o_kind__by_name)){
                if(o_kind.s_kind === o_state.s_kind){ await o_kind.f_save_extra?.(s_name); } else { await o_kind.f_drop_extra?.(s_name); }
            }
        },
        f_b_extra_dirty: function(){ return o_kind__by_name[o_state.s_kind].f_b_extra_dirty?.() ?? false; },
        f_o_row: function(o_project){
            let o_kind = o_kind__by_name[o_project.s_kind];
            return {
                s_summary: o_kind.f_s_summary(o_project.o_setting),
                s_src__thumbnail: o_kind.f_s_src__thumbnail(o_project.o_setting, o_project.s_name),
                s_badge: o_kind.s_title[0]
            };
        },
        // The address names the open lamp, so a reload opens it again.
        f_opened: function(s_name){
            history.replaceState(null, '', s_name === null ? location.pathname : `#${encodeURIComponent(s_name)}`);
        },
        f_set_status
    });
    let s_name__wanted = null;
    try{
        s_name__wanted = decodeURIComponent(location.hash.slice(1)) || null;
    } catch(o_error){ /* Not a name: a new lamp. */ }
    if(!await o_panel__project.f_b_started(s_name__wanted)){
        f_show_kind();
        f_load_part();
        f_changed(true);
    }
    // Closing the page with unsaved changes asks first.
    window.addEventListener('beforeunload', function(o_evt){
        if(o_panel__project.f_b_dirty()){ o_evt.preventDefault(); }
    });
};

f_start();
