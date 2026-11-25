// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The page: a loaded 3D object, the planes that cut it, the threads that join the parts,
// and the 3MF with every part and screw on the bed in its filaments. The worker does the
// cutting, the viewer shows it, the gizmo moves the chosen cut.

import { f_o_viewer, f_o_viewer__without_3d } from './viewer.module.js';
import { el } from './dom.module.js';
import { f_el__control, f_el__group, f_el__button } from './control.module.js';
import { f_a_n_rot__of_axis, f_a_n_rot__multiplied, f_o_gizmo } from './gizmo.module.js';
import { o_thread } from './thread.module.js';
import { f_a_n_normal } from './piece.module.js';
import { f_o_frame } from './cut.module.js';

let s_accept = '.stl,.obj,.mtl,.3mf,.glb,.gltf,.bin,.ply,.png,.jpg,.jpeg,.webp';
// The files a 3D object can be, the first of them the object when several are chosen.
let a_s_extension__object = ['3mf', 'glb', 'gltf', 'obj', 'ply', 'stl'];
let n_deg = Math.PI / 180;
// The colours of the cuts' planes: the chosen one, the others.
let a_n_col__plane = [1, 0.72, 0.2];
let a_n_col__plane_other = [0.62, 0.66, 0.68];

let a_o_control__thread = [
    { s_key: 'n_mm__clearance', s_label: 'Clearance', n_min: 0.05, n_max: 0.6, n_step: 0.05, s_unit: ' mm', n_decimal: 2, s_note: 'Between screw and hole, per side, all of it in the hole. 0.25 fits the printed screws of fdm_optimized_screws in PLA and PETG.' },
    { s_key: 'n_mm__depth', s_label: 'Hole depth', n_min: 5, n_max: 40, n_step: 0.5, s_unit: ' mm', n_decimal: 1, s_note: 'At most, in each part; less where the part is thinner.' },
    { s_key: 'n_mm__wall', s_label: 'Wall around a hole', n_min: 0.8, n_max: 5, n_step: 0.1, s_unit: ' mm', n_decimal: 1, s_note: 'The least plastic beside and behind a hole.' },
    { s_key: 'n_deg__line_up', s_label: 'Line-up correction', n_min: -90, n_max: 90, n_step: 5, s_unit: '°', n_decimal: 0, s_note: 'The parts are made to line up when the screw is tight. If a print stops short of that, set by how many degrees; if it turns past, a negative number.' }
];
let a_o_control__print = [
    { s_key: 'n_mm__bed', s_label: 'Bed', n_min: 120, n_max: 400, n_step: 1, s_unit: ' mm', n_decimal: 0, s_note: 'Square; 256 is the Bambu Lab A1 and the Elegoo Centauri Carbon 2.' },
    { s_key: 'n_cnt__filament', s_label: 'Filaments', n_min: 1, n_max: 16, n_step: 1, s_unit: '', n_decimal: 0, s_note: 'At most this many colours: the most used ones, the others joined to the nearest. 4 is one AMS.' }
];
let a_o_view = [
    { s_view: 'together', s_label: 'Together' },
    { s_view: 'apart', s_label: 'Apart' },
    { s_view: 'bed', s_label: 'On the bed' }
];
let a_o_look = [
    { s_look: 'day', s_label: 'Daylight' },
    { s_look: 'edges', s_label: 'Edges' },
    { s_look: 'xray', s_label: 'X-ray' }
];

let o_state = {
    o_setting: { n_mm__clearance: 0.25, n_mm__depth: 12, n_mm__wall: 1.2, n_deg__line_up: 0, n_mm__bed: 256, n_cnt__filament: 4, a_o_cut: [] },
    s_view: 'together',
    s_look: 'day',
    // Which cut the gizmo moves, or -1.
    n_cut: -1,
    // The object as the worker read it: { s_name, n_cnt__triangle, a_n_min, a_n_max, ... }.
    o_object: null,
    o_report: null
};

let f_el = function(s_id){ return document.getElementById(s_id); };
let f_s_hex = function(a_n_col){
    return '#' + a_n_col.map(function(n){ return Math.round(n).toString(16).padStart(2, '0'); }).join('');
};
let f_s_triangle = function(n_cnt){
    return n_cnt >= 1e6 ? `${(n_cnt / 1e6).toFixed(2)} million` : (n_cnt >= 10000 ? `${Math.round(n_cnt / 1000)} thousand` : String(n_cnt));
};
let f_set_status = function(s_text, b_error = false){
    let el_status = f_el('el_status');
    el_status.textContent = s_text;
    el_status.dataset.error = b_error ? '1' : '0';
};

let o_viewer = (function(){
    try{
        return f_o_viewer(f_el('el_canvas'));
    } catch(o_error){
        let el_no_3d = f_el('el_no_3d');
        el_no_3d.hidden = false;
        el_no_3d.textContent = `No 3D preview: ${o_error.message}. The settings, the numbers and the print file still work.`;
        return f_o_viewer__without_3d();
    }
})();

/* ---- The worker: one request at a time. Of the builds only the latest waits, and a
   print file and an object's file wait beside it ---- */

let o_worker = new Worker('./worker.module.js', { type: 'module' });
let n_id__next = 1;
let b_busy = false;
let o_post__waiting_by_type = { object: null, build: null, export: null };
let o_o_promise__by_id = new Map();
let b_exporting = false;
// Shows the next build whole: a new object or another view.
let b_frame = false;

let f_post = function(o_request, a_o_transfer = []){
    if(b_busy){
        o_post__waiting_by_type[o_request.s_type] = { o_request, a_o_transfer };
        return;
    }
    b_busy = true;
    o_worker.postMessage(o_request, a_o_transfer);
};

let f_build = function(b_frame__wanted = false){
    if(!o_state.o_object){ return; }
    b_frame = b_frame || b_frame__wanted;
    f_set_status('Cutting…');
    f_post({ s_type: 'build', n_id: n_id__next++, o_setting: structuredClone(o_state.o_setting), s_view: o_state.s_view });
};

o_worker.onmessage = function(o_event){
    let o_data = o_event.data;
    b_busy = false;
    if(o_data.s_type === 'built'){
        o_viewer.f_set_mesh(o_data);
        o_state.o_report = o_data.o_report;
        if(b_frame){
            b_frame = false;
            f_frame();
        }
        f_render_report();
        f_render_export();
        f_set_status(`${o_data.o_report.a_o_part.length} ${o_data.o_report.a_o_part.length === 1 ? 'part' : 'parts'}, ${o_data.o_report.a_o_screw.length} ${o_data.o_report.a_o_screw.length === 1 ? 'screw' : 'screws'} · ${Math.round(o_data.n_ms)} ms`);
    } else if(o_data.s_type === 'exported'){
        b_exporting = false;
        let el_link = el('a', { href: URL.createObjectURL(o_data.o_blob), download: o_data.s_name });
        document.body.append(el_link);
        el_link.click();
        el_link.remove();
        setTimeout(function(){ URL.revokeObjectURL(el_link.href); }, 60000);
        f_set_status(`Saved ${o_data.s_name}: ${o_data.n_cnt__part} parts, ${o_data.n_cnt__screw} screws, ${(o_data.o_blob.size / 1e6).toFixed(1)} MB, ${(o_data.n_ms / 1000).toFixed(1)} s`);
        f_render_export();
    } else if(o_data.s_type === 'object_loaded'){
        o_o_promise__by_id.get(o_data.n_id)?.f_resolve(o_data);
        o_o_promise__by_id.delete(o_data.n_id);
    } else if(o_data.s_type === 'error'){
        if(o_data.s_for === 'object'){
            o_o_promise__by_id.get(o_data.n_id)?.f_reject(new Error(o_data.s_message));
            o_o_promise__by_id.delete(o_data.n_id);
        } else {
            if(o_data.s_for === 'export'){
                b_exporting = false;
                f_render_export();
            }
            // With a mistake the last good parts stay.
            f_set_status(o_data.s_message, true);
        }
    }
    let o_post = o_post__waiting_by_type.object ?? o_post__waiting_by_type.export ?? o_post__waiting_by_type.build;
    if(o_post){
        o_post__waiting_by_type[o_post.o_request.s_type] = null;
        f_post(o_post.o_request, o_post.a_o_transfer);
    }
};

// Gives the worker a 3D object's file; resolves to what it read.
let f_o_object = function(a_n_u8, s_name__file, a_o_file__side, n_item){
    return new Promise(function(f_resolve, f_reject){
        let n_id = n_id__next++;
        o_o_promise__by_id.set(n_id, { f_resolve, f_reject });
        f_post({ s_type: 'object', n_id, a_n_u8, s_name__file, a_o_file__side, n_item }, [a_n_u8.buffer]);
    });
};

/* ---- The object ---- */

// The files last chosen, kept to read another object of a 3MF.
let o_file__last = null;

let f_frame = function(){
    let o_object = o_state.o_object;
    if(!o_object){ return; }
    if(o_state.s_view === 'bed'){
        let n_mm = o_state.o_setting.n_mm__bed;
        o_viewer.f_frame([0, 0, 0], [n_mm, n_mm, 0.3 * n_mm]);
        return;
    }
    let n_grow = o_state.s_view === 'apart' ? 1.5 : 1;
    let a_n_middle = o_object.a_n_min.map(function(n, n_k){ return (n + o_object.a_n_max[n_k]) / 2; });
    o_viewer.f_frame(...[o_object.a_n_min, o_object.a_n_max].map(function(a_n){ return a_n.map(function(n, n_k){ return a_n_middle[n_k] + (n - a_n_middle[n_k]) * n_grow; }); }));
};

let f_load = async function(n_item){
    let o_main = o_file__last.a_o_read.find(function(o){ return o.s_name === o_file__last.s_name; });
    f_set_status(`Reading ${o_main.s_name}…`);
    try{
        let o_loaded = await f_o_object(o_main.a_n_u8.slice(), o_main.s_name, o_file__last.a_o_read.filter(function(o){ return o !== o_main; }), n_item);
        o_state.o_object = { s_name: o_main.s_name, ...o_loaded };
    } catch(o_error){
        f_set_status(o_error.message, true);
        return;
    }
    let o_object = o_state.o_object;
    // A first cut through its middle, level.
    o_state.o_setting.a_o_cut = [f_o_cut__new()];
    o_state.n_cut = 0;
    f_render_object();
    f_render_cut();
    f_build(true);
    if(o_object.a_n_max[2] - o_object.a_n_min[2] < 1 || Math.max(o_object.a_n_max[0] - o_object.a_n_min[0], o_object.a_n_max[1] - o_object.a_n_min[1]) > 2000){
        f_set_status('Its size in the file may not be mm: this app takes the numbers as mm.', true);
    }
};

// The files chosen or dropped: the object's, and what comes with it.
let f_load_files = async function(a_o_file){
    let f_n_rank = function(o){ let n = a_s_extension__object.indexOf(o.name.split('.').pop().toLowerCase()); return n < 0 ? Infinity : n; };
    let o_file = [...a_o_file].sort(function(o_a, o_b){ return f_n_rank(o_a) - f_n_rank(o_b); })[0];
    if(!o_file || f_n_rank(o_file) === Infinity){
        if(a_o_file.length){ f_set_status(`${a_o_file.map(function(o){ return o.name; }).join(', ')}: none of them is a 3D object.`, true); }
        return;
    }
    o_file__last = { s_name: o_file.name, a_o_read: await Promise.all(a_o_file.map(async function(o){ return { s_name: o.name, a_n_u8: new Uint8Array(await o.arrayBuffer()) }; })) };
    await f_load(0);
};

let f_render_object = function(){
    let o_object = o_state.o_object;
    let el_info = f_el('el_object_info');
    if(!o_object){
        el_info.textContent = 'No object loaded yet.';
        return;
    }
    let a_n_scl = o_object.a_n_max.map(function(n, n_k){ return n - o_object.a_n_min[n_k]; });
    let a_el = [el('p', { textContent: `${o_object.s_name} · ${f_s_triangle(o_object.n_cnt__triangle)} triangles · ${a_n_scl.map(function(n){ return n.toFixed(0); }).join(' × ')} mm${o_object.b_color ? ' · in colours' : ''}` })];
    if(o_object.a_s_item){
        let el_item = el('select', { id: 'el_object_item' }, o_object.a_s_item.map(function(s_item, n_idx){ return el('option', { value: String(n_idx), textContent: `${n_idx + 1}. ${s_item}` }); }));
        el_item.value = String(o_object.n_item);
        el_item.setAttribute('aria-label', 'Object in the file');
        el_item.addEventListener('change', function(){ f_load(Number(el_item.value)); });
        a_el.push(el('label', { className: 'row' }, [el('span', { className: 'row__top' }, [el('span', { textContent: 'Object in the file' }), el_item])]));
    }
    if(o_object.s_note){ a_el.push(el('p', { className: 'row__note', textContent: o_object.s_note })); }
    el_info.replaceChildren(...a_el);
};

/* ---- The cuts ---- */

// A cut through the object's middle, level.
let f_o_cut__new = function(){
    let o_object = o_state.o_object;
    return { a_n_trn: [0, 1, 2].map(function(n_k){ return Number(((o_object.a_n_min[n_k] + o_object.a_n_max[n_k]) / 2).toFixed(1)); }), a_n_rot: [0, 0, 0, 1], b_thread: true, n_mm__d: 0 };
};

let o_gizmo = f_o_gizmo({
    b_scale: false,
    f_o_place: function(){ return o_state.o_setting.a_o_cut[o_state.n_cut] ?? null; },
    f_set_place: function(o_place){
        Object.assign(o_state.o_setting.a_o_cut[o_state.n_cut], { a_n_trn: o_place.a_n_trn, a_n_rot: o_place.a_n_rot });
        f_render_place();
    },
    // The cut is made once the handle is let go.
    f_done: function(){
        f_render_place();
        f_build();
    }
});

// The planes as squares as large as the object, the chosen one filled; on the bed, the
// bed's edge.
let f_a_o_shape__plane = function(){
    let o_object = o_state.o_object;
    if(o_object && o_state.s_view === 'bed'){
        let n_mm = o_state.o_setting.n_mm__bed;
        return [{ s_type: 'line', a_n_pos: new Float32Array([0, 0, 0, n_mm, 0, 0, n_mm, 0, 0, n_mm, n_mm, 0, n_mm, n_mm, 0, 0, n_mm, 0, 0, n_mm, 0, 0, 0, 0]), a_n_col: a_n_col__plane_other }];
    }
    if(!o_object || o_state.s_view !== 'together'){ return []; }
    let n_half = 0.6 * Math.hypot(...o_object.a_n_max.map(function(n, n_k){ return n - o_object.a_n_min[n_k]; }));
    let a_o = [];
    o_state.o_setting.a_o_cut.forEach(function(o_cut, n_cut){
        let o_frame = f_o_frame(f_a_n_normal(o_cut.a_n_rot));
        let a_a_n = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function([n_a, n_b]){
            return [0, 1, 2].map(function(n_k){ return o_cut.a_n_trn[n_k] + n_half * (n_a * o_frame.a_n_u[n_k] + n_b * o_frame.a_n_v[n_k]); });
        });
        let b_chosen = n_cut === o_state.n_cut;
        let a_n_col = b_chosen ? a_n_col__plane : a_n_col__plane_other;
        a_o.push({ s_type: 'line', a_n_pos: new Float32Array([0, 1, 1, 2, 2, 3, 3, 0].flatMap(function(n){ return a_a_n[n]; })), a_n_col });
        if(b_chosen){
            a_o.push({ s_type: 'fill', a_n_pos: new Float32Array([0, 1, 2, 0, 2, 3].flatMap(function(n){ return a_a_n[n]; })), a_n_col, n_alpha: 0.22 });
            // The way it looks: the part above it.
            let a_n_normal = o_frame.a_n_w;
            a_o.push({ s_type: 'line', a_n_pos: new Float32Array([...o_cut.a_n_trn, ...o_cut.a_n_trn.map(function(n, n_k){ return n + 0.35 * n_half * a_n_normal[n_k]; })]), a_n_col: [1, 1, 1] });
        }
    });
    return a_o;
};
o_viewer.f_set_tool({
    f_a_o_shape: function(o_camera){ return [...f_a_o_shape__plane(), ...(o_state.s_view === 'together' ? o_gizmo.f_a_o_shape(o_camera) : [])]; },
    f_b_down: function(n_x, n_y, o_camera){ return o_state.s_view === 'together' && o_gizmo.f_b_down(n_x, n_y, o_camera); },
    f_move: function(n_x, n_y){ o_gizmo.f_move(n_x, n_y); },
    f_up: function(){ o_gizmo.f_up(); },
    f_b_hover: function(n_x, n_y, o_camera){ return o_state.s_view === 'together' && o_gizmo.f_b_hover(n_x, n_y, o_camera); }
});

// The chosen cut's place, as numbers.
let a_el_trn = ['x', 'y', 'z'].map(function(s_axis){
    let el_input = el('input', { type: 'number', step: 0.5 });
    el_input.setAttribute('aria-label', s_axis);
    return el_input;
});
a_el_trn.forEach(function(el_input, n_k){
    el_input.addEventListener('change', function(){
        let o_cut = o_state.o_setting.a_o_cut[o_state.n_cut];
        if(!o_cut){ return; }
        o_cut.a_n_trn[n_k] = Number(el_input.value) || 0;
        o_viewer.f_set_dirty();
        f_build();
    });
});
let f_render_place = function(){
    let o_cut = o_state.o_setting.a_o_cut[o_state.n_cut];
    if(o_cut){
        a_el_trn.forEach(function(el_input, n_k){
            if(document.activeElement !== el_input){ el_input.value = o_cut.a_n_trn[n_k].toFixed(1); }
        });
        let a_n_normal = f_a_n_normal(o_cut.a_n_rot);
        f_el('el_cut_normal').textContent = `Looks towards ${a_n_normal.map(function(n){ return n.toFixed(2); }).join(', ')}: the part on that side is above it.`;
    }
    o_viewer.f_set_dirty();
};

let f_render_cut = function(){
    let a_o_cut = o_state.o_setting.a_o_cut;
    let el_list = el('ul', { id: 'el_cut_list' }, a_o_cut.map(function(o_cut, n_cut){
        let el_open = el('button', { type: 'button', className: 'cut__open', textContent: `Cut ${n_cut + 1}${o_cut.b_thread ? '' : ' · no thread'}` });
        el_open.addEventListener('click', function(){
            o_state.n_cut = n_cut;
            f_render_cut();
            o_viewer.f_set_dirty();
        });
        let el_delete = el('button', { type: 'button', className: 'cut__delete', textContent: '×', title: `Remove cut ${n_cut + 1}` });
        el_delete.setAttribute('aria-label', `Remove cut ${n_cut + 1}`);
        el_delete.addEventListener('click', function(){
            a_o_cut.splice(n_cut, 1);
            o_state.n_cut = Math.min(o_state.n_cut, a_o_cut.length - 1);
            f_render_cut();
            f_build();
        });
        let el_row = el('li', { className: 'cut' }, [el_open, el_delete]);
        if(n_cut === o_state.n_cut){ el_row.setAttribute('aria-current', 'true'); }
        return el_row;
    }));
    let el_add = f_el__button('Add a cut', function(){
        a_o_cut.push(f_o_cut__new());
        o_state.n_cut = a_o_cut.length - 1;
        f_render_cut();
        f_build();
    }, 'action');
    el_add.disabled = !o_state.o_object;
    let a_el = [el_list, el_add];
    let o_cut = a_o_cut[o_state.n_cut];
    if(o_cut){
        let f_turn = function(a_n_rot){
            o_cut.a_n_rot = a_n_rot;
            f_render_place();
            f_build();
        };
        let el_thread = el('input', { type: 'checkbox', checked: o_cut.b_thread });
        el_thread.addEventListener('change', function(){
            o_cut.b_thread = el_thread.checked;
            f_render_cut();
            f_build();
        });
        let el_d = el('select', {}, [el('option', { value: '0', textContent: 'as large as fits' }), ...o_thread.a_n_mm__d.map(function(n_mm){ return el('option', { value: String(n_mm), textContent: `Ø${n_mm} mm` }); })]);
        el_d.value = String(o_cut.n_mm__d);
        el_d.setAttribute('aria-label', 'Screw');
        el_d.addEventListener('change', function(){
            o_cut.n_mm__d = Number(el_d.value);
            f_build();
        });
        a_el.push(f_el__group(`Cut ${o_state.n_cut + 1}`, [
            el('small', { className: 'row__note row', textContent: 'In the view: drag an arrow to move the plane, a ring to turn it, its middle to move it freely. It cuts the part its middle is in.' }),
            ...a_el_trn.map(function(el_input, n_k){
                return el('label', { className: 'row row--pair' }, [el('span', { textContent: `Middle, ${'xyz'[n_k]}` }), el('span', { className: 'number' }, [el_input, ' mm'])]);
            }),
            el('div', { className: 'tool_row' }, [
                f_el__button('Level', function(){ f_turn([0, 0, 0, 1]); }),
                f_el__button('Upright, x', function(){ f_turn(f_a_n_rot__of_axis([0, 1, 0], Math.PI / 2)); }),
                f_el__button('Upright, y', function(){ f_turn(f_a_n_rot__of_axis([1, 0, 0], -Math.PI / 2)); }),
                f_el__button('Flip', function(){ f_turn(f_a_n_rot__multiplied(o_cut.a_n_rot, f_a_n_rot__of_axis([1, 0, 0], Math.PI))); })
            ]),
            el('small', { className: 'row__note row', id: 'el_cut_normal' }),
            el('label', { className: 'row row--check' }, [el_thread, el('span', { textContent: 'Thread and screw' })]),
            el('label', { className: 'row' }, [el('span', { className: 'row__top' }, [el('span', { textContent: 'Screw' }), el_d])])
        ]));
    }
    f_el('el_cut').replaceChildren(...a_el);
    f_render_place();
};

/* ---- The settings, the report, the print file ---- */

let f_render_setting = function(){
    let f_changed = function(){ f_build(); };
    f_el('el_setting').replaceChildren(
        f_el__group('Thread', a_o_control__thread.map(function(o_control){ return f_el__control(o_control, o_state.o_setting, f_changed); })),
        f_el__group('Print', a_o_control__print.map(function(o_control){ return f_el__control(o_control, o_state.o_setting, f_changed); }))
    );
};

let f_render_report = function(){
    let o_report = o_state.o_report;
    if(!o_report){
        f_el('el_report').replaceChildren();
        return;
    }
    let a_a_n_col = o_report.a_a_n_col__filament;
    let f_el__swatch = function(n_fil){
        let el_swatch = el('i', { className: 'swatch', title: `Filament ${n_fil}` });
        el_swatch.style.background = f_s_hex(a_a_n_col[n_fil - 1] ?? [200, 200, 200]);
        return el_swatch;
    };
    let el_dl = el('dl');
    o_report.a_o_part.forEach(function(o_part, n_idx){
        el_dl.append(
            el('dt', {}, [`Part ${n_idx + 1}`, el('small', { textContent: o_part.a_n_step.length ? ` · ${o_part.a_n_step.map(function(n){ return `${n > 0 ? 'above' : 'below'} cut ${Math.abs(n)}`; }).join(', ')}` : '' })]),
            el('dd', {}, [`${(o_part.n_mm3 / 1000).toFixed(1)} cm³ · ${o_part.a_n_scl.map(function(n){ return n.toFixed(0); }).join(' × ')} `, ...o_part.a_n_fil__used.map(f_el__swatch)])
        );
    });
    o_report.a_o_screw.forEach(function(o_screw, n_idx){
        el_dl.append(el('dt', { textContent: `Screw ${n_idx + 1}` }), el('dd', { textContent: `Ø${o_screw.n_mm__d} × ${o_screw.n_mm__length.toFixed(1)} · parts ${o_screw.a_n_part[0] + 1} and ${o_screw.a_n_part[1] + 1}` }));
    });
    let a_s_note = [];
    o_report.a_o_cut.forEach(function(o_cut, n_cut){
        if(!o_cut.b_cut){ a_s_note.push(`Cut ${n_cut + 1} misses the part its middle is in: move it into the object.`); }
        if(o_cut.n_cnt__gap > 0){ a_s_note.push(`Cut ${n_cut + 1}: the object's surface is open where it cuts, so its faces are closed as well as could be. Check them in the slicer.`); }
        for(let o_joint of o_cut.a_o_joint){
            if(o_joint.s_why){ a_s_note.push(`Cut ${n_cut + 1}, parts ${o_joint.a_n_part[0] + 1} and ${o_joint.a_n_part[1] + 1}: ${o_joint.s_why}`); }
        }
    });
    if(!o_report.b_fits){ a_s_note.push(`Not everything fits on a bed of ${o_state.o_setting.n_mm__bed} mm: the slicer can put it on more plates.`); }
    f_el('el_report').replaceChildren(el('h2', { textContent: 'Parts' }), el_dl, ...a_s_note.map(function(s_note){ return el('p', { className: 'note', textContent: s_note }); }));
};

let f_render_export = function(){
    let o_report = o_state.o_report;
    let el_button = f_el__button('Download 3MF: parts and screws on the bed', function(){
        if(b_exporting || !o_state.o_object){ return; }
        b_exporting = true;
        f_render_export();
        f_set_status('Writing the 3MF…');
        f_post({ s_type: 'export', n_id: n_id__next++, o_setting: structuredClone(o_state.o_setting), s_name__file: o_state.o_object.s_name });
    }, 'action action--main');
    el_button.disabled = b_exporting || !o_report;
    let a_el = [el('h2', { textContent: 'Print file' }), el_button];
    if(o_report){
        a_el.push(
            el('p', { className: 'row__note', textContent: 'Bambu Studio and the Orca slicers read each part’s filaments. Put these colours in the filament slots, in this order:' }),
            el('ol', { className: 'filament' }, o_report.a_a_n_col__filament.map(function(a_n_col){
                let el_swatch = el('i');
                el_swatch.style.background = f_s_hex(a_n_col);
                return el('li', {}, [el_swatch, f_s_hex(a_n_col)]);
            })),
            el('p', { className: 'row__note', textContent: 'The screws print in filament 1, lying on their flat side. Screw one into a part until it stops, then screw the other part on: the parts line up when it is tight.' })
        );
    }
    f_el('el_export').replaceChildren(...a_el);
};

let f_render_bar = function(){
    let f_el__segment = function(a_o, s_key, f_changed){
        return a_o.map(function(o){
            let el_button = el('button', { type: 'button', textContent: o.s_label });
            el_button.setAttribute('aria-pressed', String(o_state[s_key] === o[s_key]));
            el_button.addEventListener('click', function(){
                o_state[s_key] = o[s_key];
                f_render_bar();
                f_changed();
            });
            return el_button;
        });
    };
    f_el('el_view_mode').replaceChildren(...f_el__segment(a_o_view, 's_view', function(){ f_build(true); }));
    f_el('el_look').replaceChildren(...f_el__segment(a_o_look, 's_look', function(){ o_viewer.f_set_view({ s_look: o_state.s_look }); }));
};

let f_start = function(){
    let el_file = f_el('el_file');
    f_el('el_load').addEventListener('click', function(){ el_file.click(); });
    el_file.accept = s_accept;
    el_file.addEventListener('change', function(){
        let a_o_file = [...el_file.files];
        el_file.value = '';
        f_load_files(a_o_file);
    });
    document.addEventListener('dragover', function(o_evt){ o_evt.preventDefault(); });
    document.addEventListener('drop', function(o_evt){
        o_evt.preventDefault();
        f_load_files([...(o_evt.dataTransfer?.files ?? [])]);
    });
    for(let el_face of f_el('el_side').children){
        el_face.addEventListener('click', function(){
            o_viewer.f_look_from(Number(el_face.dataset.az) * n_deg, (90 - Number(el_face.dataset.el)) * n_deg);
        });
    }
    f_render_bar();
    f_render_object();
    f_render_cut();
    f_render_setting();
    f_render_export();
};

f_start();
