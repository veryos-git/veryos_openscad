import { f_o_viewer, f_o_viewer__without_3d } from './viewer.module.js';
import { f_o_param__default } from './egg.module.js';
import { el } from './dom.module.js';
import { f_o_panel__project } from './project.module.js';

let s_key__storage = 'dragon_egg_app_v1';
// Cell size of the mesh at the widest point: while dragging, then once settled.
let n_mm__cell_draft = 1.1;
let n_mm__cell_settled = 0.45;
let n_ms__settle = 220;
let n_pct__steep_warn = 2.5;

let a_o_group = [
    {
        s_title: 'Egg',
        a_o_control: [
            { s_key: 'n_mm__egg_scl_x', s_label: 'Width', n_min: 80, n_max: 240, n_step: 1, s_unit: ' mm', n_decimal: 0 },
            { s_key: 'n_mm__egg_scl_z', s_label: 'Height, as printed', n_min: 90, n_max: 340, n_step: 1, s_unit: ' mm', n_decimal: 0 },
            { s_key: 'n_nor__point', s_label: 'Pointed end', n_min: 0, n_max: 0.2, n_step: 0.005, s_unit: '', n_decimal: 3 },
            { s_key: 'n_mm__shell', s_label: 'Thinnest wall', n_min: 0.8, n_max: 2, n_step: 0.1, s_unit: ' mm', n_decimal: 1, s_note: 'Thinner glows more.' },
            { s_key: 'n_deg__tip', s_label: 'Steepest overhang at the top', n_min: 45, n_max: 75, n_step: 1, s_unit: '°', n_decimal: 0, s_note: 'The inside overhangs this much at the very top. Lower is safer and more pointed.' }
        ]
    },
    {
        s_title: 'Scales',
        a_o_control: [
            { s_key: 'n_mm__relief', s_label: 'Relief height', n_min: 0, n_max: 5, n_step: 0.1, s_unit: ' mm', n_decimal: 1 },
            { s_key: 'n_cnt__repeat', s_label: 'Tiles around', n_min: 1, n_max: 12, n_step: 1, s_unit: '', n_decimal: 0, s_id__note: 'el_note__tile' },
            { s_key: 'n_nor__stretch', s_label: 'Stretch', n_min: 0.5, n_max: 2, n_step: 0.01, s_unit: ' ×', n_decimal: 2, s_note: 'Above 1 the rows lie closer together.' },
            { s_key: 'n_nor__shift', s_label: 'Slide up or down', n_min: 0, n_max: 1, n_step: 0.01, s_unit: '', n_decimal: 2 },
            { s_key: 'n_mm__smooth', s_label: 'Smooth fine detail', n_min: 0, n_max: 1.5, n_step: 0.05, s_unit: ' mm', n_decimal: 2, s_note: 'Softens what a 0.4 mm nozzle cannot print anyway.' },
            { s_key: 'b_flip', s_label: 'Flip the pattern upside down' }
        ]
    },
    {
        s_title: 'TraceTrove logo',
        a_o_control: [
            { s_key: 'b_logo', s_label: 'Engrave logo V3 in the front' },
            { s_key: 'n_mm__logo_scl_y', s_label: 'Size', n_min: 14, n_max: 45, n_step: 1, s_unit: ' mm', n_decimal: 0 },
            { s_key: 'n_nor__logo_z', s_label: 'Height on the egg', n_min: 0.15, n_max: 0.8, n_step: 0.01, s_unit: '', n_decimal: 2 },
            { s_key: 'n_mm__logo_depth', s_label: 'Depth', n_min: 0.2, n_max: 1.2, n_step: 0.05, s_unit: ' mm', n_decimal: 2, s_note: 'It glows brighter the deeper it is, and leaves at least 0.4 mm of wall.' }
        ]
    }
];

let a_o_control__view = [
    { s_key: 'n_light', s_label: 'Brightness', n_min: 0.15, n_max: 2, n_step: 0.05, s_unit: '', n_decimal: 2, s_only_mode: 1 },
    { s_key: 'n_deg__limit', s_label: 'Overhang limit', n_min: 30, n_max: 70, n_step: 1, s_unit: '°', n_decimal: 0, s_only_mode: 2 }
];

let a_s_mode = ['Daylight', 'Lit', 'Overhang'];

let o_state = {
    n_id__project: null,
    s_name__project: '',
    o_param: f_o_param__default(),
    o_view: { n_mode: 0, b_cut: false, b_base: true, n_light: 1, n_deg__limit: 45, s_light__col: '#ffdcb4', n_mm__cell_export: 0.4 }
};

let f_load_state = function(){
    try{
        let o_saved = JSON.parse(localStorage.getItem(s_key__storage));
        if(o_saved){
            Object.assign(o_state.o_param, o_saved.o_param);
            Object.assign(o_state.o_view, o_saved.o_view);
            o_state.n_id__project = o_saved.n_id__project ?? null;
            o_state.s_name__project = o_saved.s_name__project ?? '';
        }
    } catch(o_error){ /* Private window or cleared storage: start from the defaults. */ }
};
let f_save_state = function(){
    if(o_panel__project){ o_state.s_name__project = o_panel__project.f_s_name(); }
    try{
        localStorage.setItem(s_key__storage, JSON.stringify(o_state));
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
let o_stat__last = null;
let o_panel__project = null;

// The worker: one build at a time, and only the latest request waits.
let o_worker = new Worker('./worker.module.js', { type: 'module' });
let n_id__next = 1;
let b_busy = false;
let o_request__waiting = null;
let n_id__timeout = 0;
let b_exporting = false;

let f_send = function(o_request){
    b_busy = true;
    o_worker.postMessage(o_request);
};
let f_request_build = function(n_mm__cell){
    let o_request = {
        s_type: 'build',
        n_id: n_id__next++,
        o_param: { ...o_state.o_param },
        n_mm__cell,
        n_cnt__neck_column: 180
    };
    if(b_busy){ o_request__waiting = o_request; } else { f_send(o_request); }
};
let f_changed = function(){
    f_save_state();
    if(o_panel__project){ o_panel__project.f_changed(); }
    f_request_build(n_mm__cell_draft);
    clearTimeout(n_id__timeout);
    n_id__timeout = setTimeout(function(){ f_request_build(n_mm__cell_settled); }, n_ms__settle);
};

let f_set_status = function(s_text, b_error = false){
    let el_status = f_el('el_status');
    el_status.textContent = s_text;
    el_status.dataset.error = b_error ? '1' : '0';
};

let f_s_triangle = function(n_cnt){
    return n_cnt >= 1e6 ? `${(n_cnt / 1e6).toFixed(2)} million` : `${Math.round(n_cnt / 1000)} thousand`;
};

// Share of the outside past the limit, and the same in mm2 for the inside.
let f_n_mm2__past = function(a_n_mm2, n_deg__limit){
    let n_sum = 0;
    for(let n_deg = Math.ceil(n_deg__limit); n_deg < a_n_mm2.length; n_deg++){ n_sum += a_n_mm2[n_deg]; }
    return n_sum;
};

let f_render_stat = function(){
    if(!o_stat__last || !o_lamp){ return; }
    let o_stat = o_stat__last;
    let n_deg__limit = o_state.o_view.n_deg__limit;
    let n_mm2__outside = f_n_mm2__past(o_stat.a_n_mm2__outside, n_deg__limit);
    let n_mm2__inside = f_n_mm2__past(o_stat.a_n_mm2__inside, n_deg__limit);
    let n_pct__outside = 100 * n_mm2__outside / Math.max(o_stat.n_mm2__outside, 1);
    // Scales' lips are short, so a few percent past 45 degrees is normal, on every
    // pattern. What droops is what goes well past it.
    let n_pct__steep = 100 * f_n_mm2__past(o_stat.a_n_mm2__outside, 60) / Math.max(o_stat.n_mm2__outside, 1);
    let b_steep = n_pct__steep > n_pct__steep_warn;
    let n_mm__lamp = o_stat.n_mm__scl_z + o_lamp.n_mm__seat_z + o_lamp.n_mm__sockel_z - o_lamp.n_mm__clickbase_z;
    let a_a_s_row = [
        ['Egg, as printed', `${o_stat.n_mm__scl_x.toFixed(1)} × ${o_stat.n_mm__scl_z.toFixed(1)} mm`],
        ['Whole lamp, height', `${n_mm__lamp.toFixed(0)} mm`],
        ['Filament for the egg', `${o_stat.n_gram.toFixed(0)} g`]
    ];
    if(o_stat.n_mm__wall_min !== null){
        a_a_s_row.push(['Wall', `${o_stat.n_mm__wall_min.toFixed(2)} to ${o_stat.n_mm__wall_max.toFixed(2)} mm`]);
    }
    a_a_s_row.push([`Outside past ${n_deg__limit}°`, `${n_pct__outside.toFixed(1)} %`]);
    if(!o_state.o_param.b_vase){
        a_a_s_row.push([`Inside past ${n_deg__limit}°`, `${(n_mm2__inside / 100).toFixed(0)} cm²`]);
    }
    let el_dl = el('dl');
    for(let [s_label, s_val] of a_a_s_row){
        el_dl.append(el('dt', { textContent: s_label }), el('dd', { textContent: s_val }));
    }
    let a_s_note = [];
    if(Math.abs(o_stat.n_mm__scl_z - o_state.o_param.n_mm__egg_scl_z) > 0.5){
        a_s_note.push(`This width allows ${o_stat.n_mm__scl_z.toFixed(0)} mm of height at the least.`);
    }
    if(b_steep){
        a_s_note.push(`${n_pct__steep.toFixed(1)} % of the outside overhangs past 60\u00b0, so the scales\u2019 lips may droop. Flip the pattern, lower the relief or use fewer tiles.`);
    }
    f_el('el_stat').replaceChildren(el('h2', { textContent: 'This egg' }), el_dl, el('p', { id: 'el_note', textContent: a_s_note.join(' ') }));
    let el_note__tile = f_el('el_note__tile');
    if(el_note__tile){
        el_note__tile.textContent = `One tile is ${o_stat.n_mm__tile_scl_x.toFixed(0)} mm wide at the widest point.`;
    }
    // Triangles grow with the square of the cells getting finer.
    let n_cnt__export = o_stat.n_cnt__triangle * Math.pow(o_stat.n_mm__cell / o_state.o_view.n_mm__cell_export, 2);
    let el_note__detail = f_el('el_note__detail');
    if(el_note__detail){
        el_note__detail.textContent = `About ${f_s_triangle(n_cnt__export)} triangles, an STL of ${Math.round(n_cnt__export * 50 / 1e6)} MB.`;
    }
};

o_worker.onmessage = function(o_event){
    let o_data = o_event.data;
    if(o_data.s_type === 'built'){
        b_busy = false;
        o_viewer.f_set_egg(o_data.a_n_pos, o_data.a_n_nor, o_data.a_n_wall, o_data.a_n_idx);
        o_stat__last = { ...o_data.o_stat, n_mm__cell: o_data.n_mm__cell };
        f_set_status(`Pattern ${o_state.o_param.n_id__pattern} · preview ${f_s_triangle(o_data.o_stat.n_cnt__triangle)} triangles · ${Math.round(o_data.n_ms)} ms`);
        f_render_stat();
    } else if(o_data.s_type === 'exported'){
        b_busy = false;
        b_exporting = false;
        let el_link = el('a', { href: URL.createObjectURL(o_data.o_blob), download: o_data.s_name });
        document.body.append(el_link);
        el_link.click();
        el_link.remove();
        setTimeout(function(){ URL.revokeObjectURL(el_link.href); }, 60000);
        f_set_status(`Saved ${o_data.s_name}: ${f_s_triangle(o_data.n_cnt__triangle)} triangles, ${(o_data.o_blob.size / 1e6).toFixed(1)} MB, ${(o_data.n_ms / 1000).toFixed(1)} s`);
        f_set_export_busy(false);
    } else if(o_data.s_type === 'error'){
        b_busy = false;
        if(o_data.s_for === 'export'){
            b_exporting = false;
            f_set_export_busy(false);
        }
        f_set_status(o_data.s_message, true);
    }
    if(!b_busy && o_request__waiting){
        let o_request = o_request__waiting;
        o_request__waiting = null;
        f_send(o_request);
    }
};

let f_set_export_busy = function(b_on){
    for(let el_button of document.querySelectorAll('[data-export]')){ el_button.disabled = b_on; }
};

let f_export = function(s_format){
    if(b_exporting){ return; }
    b_exporting = true;
    f_set_export_busy(true);
    f_set_status('Building the print file…');
    let o_request = {
        s_type: 'export',
        n_id: n_id__next++,
        s_format,
        o_param: { ...o_state.o_param },
        s_name__project: o_panel__project ? o_panel__project.f_s_name() : '',
        n_mm__cell: o_state.o_view.n_mm__cell_export
    };
    if(b_busy){ o_request__waiting = o_request; } else { f_send(o_request); }
};

// One setting's row. Sliders and tick boxes write into the object they are given.
let f_el__control = function(o_control, o_target, f_on_change){
    if(o_control.n_min === undefined){
        let el_input = el('input', { type: 'checkbox', checked: Boolean(o_target[o_control.s_key]) });
        el_input.addEventListener('change', function(){
            o_target[o_control.s_key] = el_input.checked;
            f_on_change();
        });
        return el('label', { className: 'row row--check' }, [el_input, el('span', { textContent: o_control.s_label })]);
    }
    let f_s_val = function(){ return o_target[o_control.s_key].toFixed(o_control.n_decimal) + o_control.s_unit; };
    let el_val = el('span', { className: 'row__val', textContent: f_s_val() });
    let el_input = el('input', { type: 'range', min: o_control.n_min, max: o_control.n_max, step: o_control.n_step, value: o_target[o_control.s_key] });
    el_input.setAttribute('aria-label', o_control.s_label);
    el_input.addEventListener('input', function(){
        o_target[o_control.s_key] = Number(el_input.value);
        el_val.textContent = f_s_val();
        f_on_change();
    });
    let a_el = [
        el('span', { className: 'row__top' }, [el('span', { textContent: o_control.s_label }), el_val]),
        el_input
    ];
    if(o_control.s_note){ a_el.push(el('small', { className: 'row__note', textContent: o_control.s_note })); }
    if(o_control.s_id__note){ a_el.push(el('small', { className: 'row__note', id: o_control.s_id__note })); }
    let el_row = el('label', { className: 'row' }, a_el);
    return el_row;
};

let f_apply_view = function(){
    let o_view = o_state.o_view;
    let s_hex = o_view.s_light__col;
    // sRGB to linear, as the shader works in linear light.
    let a_n_col = [1, 3, 5].map(n_off => Math.pow(parseInt(s_hex.slice(n_off, n_off + 2), 16) / 255, 2.2));
    o_viewer.f_set_view({
        n_mode: o_view.n_mode,
        b_cut: o_view.b_cut,
        b_base: o_view.b_base,
        n_light: o_view.n_light,
        n_deg__limit: o_view.n_deg__limit,
        a_n_light__col: a_n_col
    });
    f_el('el_stage').dataset.mode = String(o_view.n_mode);
    for(let el_row of document.querySelectorAll('[data-only-mode]')){
        el_row.hidden = Number(el_row.dataset.onlyMode) !== o_view.n_mode;
    }
};

let f_render_controls = function(){
    let el_control = f_el('el_control');
    el_control.replaceChildren();
    for(let o_group of a_o_group){
        el_control.append(el('div', { className: 'group' }, [
            el('h2', { textContent: o_group.s_title }),
            ...o_group.a_o_control.map(o_control => f_el__control(o_control, o_state.o_param, f_changed))
        ]));
    }
    let el_group__view = el('div', { className: 'group' }, [el('h2', { textContent: 'View' })]);
    for(let o_control of a_o_control__view){
        let el_row = f_el__control(o_control, o_state.o_view, function(){
            f_apply_view();
            f_render_stat();
            f_save_state();
        });
        el_row.dataset.onlyMode = String(o_control.s_only_mode);
        el_group__view.append(el_row);
    }
    let el_color = el('input', { type: 'color', value: o_state.o_view.s_light__col });
    el_color.addEventListener('input', function(){
        o_state.o_view.s_light__col = el_color.value;
        f_apply_view();
        f_save_state();
    });
    let el_row__color = el('label', { className: 'row row--pair' }, [el('span', { textContent: 'Colour of the puck light' }), el_color]);
    el_row__color.dataset.onlyMode = '1';
    el_group__view.append(el_row__color);
    let el_note__daylight = el('small', { className: 'row__note row', textContent: 'The Lit view shows what the wall’s thickness does to the light. Overhang shows the faces past the limit, orange to red.' });
    el_group__view.append(el_note__daylight);
    el_control.append(el_group__view);

    let o_control__vase = { s_key: 'b_vase', s_label: 'Solid egg for a slicer’s vase mode' };
    let o_control__cell = { s_key: 'n_mm__cell_export', s_label: 'Mesh detail', n_min: 0.15, n_max: 0.6, n_step: 0.01, s_unit: ' mm', n_decimal: 2, s_id__note: 'el_note__detail' };
    let el_export = f_el('el_export');
    let el_button__stl = el('button', { className: 'action action--main', textContent: 'Download egg (STL)' });
    let el_button__3mf = el('button', { className: 'action', textContent: 'Download egg (3MF, smaller file)' });
    let el_button__lamp = el('button', { className: 'action', textContent: 'Download whole lamp (3MF, 4 parts)' });
    el_button__stl.dataset.export = '1';
    el_button__3mf.dataset.export = '1';
    el_button__lamp.dataset.export = '1';
    el_button__stl.addEventListener('click', function(){ f_export('stl'); });
    el_button__3mf.addEventListener('click', function(){ f_export('3mf'); });
    el_button__lamp.addEventListener('click', function(){ f_export('lamp'); });
    let el_reset = el('button', { id: 'el_reset', className: 'action', textContent: 'Back to the defaults' });
    el_reset.addEventListener('click', function(){
        let n_id__pattern = o_state.o_param.n_id__pattern;
        o_state.o_param = { ...f_o_param__default(), n_id__pattern };
        f_render_controls();
        f_apply_view();
        f_changed();
    });
    el_export.replaceChildren(
        el('h2', { textContent: 'Print files' }),
        f_el__control(o_control__vase, o_state.o_param, f_changed),
        f_el__control(o_control__cell, o_state.o_view, function(){
            f_render_stat();
            f_save_state();
            if(o_panel__project){ o_panel__project.f_changed(); }
        }),
        el_button__stl,
        el_button__3mf,
        el_button__lamp,
        el('p', { className: 'row__note', textContent: 'The base parts alone, as they are in every lamp:' }),
        el('div', { className: 'action_row' }, ['sockel', 'screwin', 'clickbase'].map(s_part =>
            el('a', { className: 'action', href: `part/${s_part}.stl`, download: `dragon_egg_${s_part}.stl`, textContent: s_part })
        )),
        el_reset
    );
};

// Puts a whole design on screen, as saved or as new.
let f_set_design = function(o_design){
    o_state.o_param = o_design.o_param;
    o_state.o_view.n_mm__cell_export = o_design.n_mm__cell_export;
    f_render_controls();
    f_apply_view();
    f_select_pattern(o_state.o_param.n_id__pattern);
    f_render_stat();
};

let f_select_pattern = function(n_id, b_focus = false){
    o_state.o_param.n_id__pattern = n_id;
    for(let el_tile of f_el('el_gallery').children){
        let b_selected = Number(el_tile.dataset.id) === n_id;
        el_tile.setAttribute('aria-selected', String(b_selected));
        if(b_selected){
            el_tile.scrollIntoView({ block: 'nearest' });
            if(b_focus){ el_tile.focus(); }
        }
    }
    f_set_status(`Loading pattern ${n_id}…`);
    f_changed();
};

let f_render_gallery = async function(){
    let o_response = await fetch('thumbnail/index.json');
    let a_n_id = await o_response.json();
    f_el('el_gallery').replaceChildren(...a_n_id.map(function(n_id){
        let el_tile = el('button', { className: 'tile', type: 'button', title: `Pattern ${n_id}` }, [
            el('img', { src: `thumbnail/${n_id}.jpg`, alt: `Pattern ${n_id}`, loading: 'lazy', width: 80, height: 80 }),
            el('span', { textContent: String(n_id) })
        ]);
        el_tile.dataset.id = String(n_id);
        el_tile.setAttribute('role', 'option');
        el_tile.addEventListener('click', function(){ f_select_pattern(n_id); });
        return el_tile;
    }));
    document.addEventListener('keydown', function(o_evt){
        if(o_evt.target.closest?.('input') || (o_evt.key !== 'ArrowLeft' && o_evt.key !== 'ArrowRight')){ return; }
        o_evt.preventDefault();
        let n_idx = a_n_id.indexOf(o_state.o_param.n_id__pattern);
        let n_step = o_evt.key === 'ArrowRight' ? 1 : -1;
        f_select_pattern(a_n_id[(n_idx + n_step + a_n_id.length) % a_n_id.length], Boolean(o_evt.target.closest?.('.tile')));
    });
    return a_n_id;
};

let f_render_mode = function(){
    f_el('el_mode').replaceChildren(...a_s_mode.map(function(s_mode, n_idx){
        let el_button = el('button', { type: 'button', textContent: s_mode });
        el_button.setAttribute('aria-pressed', String(o_state.o_view.n_mode === n_idx));
        el_button.addEventListener('click', function(){
            o_state.o_view.n_mode = n_idx;
            f_render_mode();
            f_apply_view();
            f_save_state();
        });
        return el_button;
    }));
};

let f_start = async function(){
    f_load_state();
    f_render_mode();
    f_render_controls();
    f_el('el_cut').checked = o_state.o_view.b_cut;
    f_el('el_base').checked = o_state.o_view.b_base;
    f_el('el_cut').addEventListener('change', function(o_evt){
        o_state.o_view.b_cut = o_evt.target.checked;
        f_apply_view();
        f_save_state();
    });
    f_el('el_base').addEventListener('change', function(o_evt){
        o_state.o_view.b_base = o_evt.target.checked;
        f_apply_view();
        f_save_state();
    });
    f_apply_view();

    let a_n_id = await f_render_gallery();
    if(!a_n_id.includes(o_state.o_param.n_id__pattern)){ o_state.o_param.n_id__pattern = a_n_id[0]; }

    o_panel__project = f_o_panel__project({
        el_root: f_el('el_project'),
        f_o_design: function(){
            return { o_param: o_state.o_param, n_mm__cell_export: o_state.o_view.n_mm__cell_export };
        },
        f_open_design: f_set_design,
        f_new_design: function(){
            f_set_design({ o_param: f_o_param__default(), n_mm__cell_export: 0.4 });
        },
        f_opened: function(n_id){
            o_state.n_id__project = n_id;
            f_save_state();
        },
        f_set_status
    });
    await o_panel__project.f_start(o_state.n_id__project, o_state.s_name__project);

    try{
        let o_response = await fetch('part/lamp.json');
        if(!o_response.ok){ throw new Error('part/lamp.json is missing. Run: python3 make_asset.py part'); }
        o_lamp = await o_response.json();
        o_viewer.f_set_egg_z(o_lamp.n_mm__sockel_z + o_lamp.n_mm__seat_z);
        o_viewer.f_set_view({ a_n_light__pos: [0, 0, o_lamp.n_mm__sockel_z + o_lamp.n_mm__puck_top_z] });
        o_viewer.f_frame(o_lamp.n_mm__sockel_z + o_lamp.n_mm__seat_z + o_state.o_param.n_mm__egg_scl_z, o_lamp.n_mm__clickbase_z);
        for(let [s_part, n_z] of [['sockel', o_lamp.n_mm__sockel_z], ['screwin', o_lamp.n_mm__sockel_z], ['clickbase', o_lamp.n_mm__clickbase_z]]){
            let o_part = await fetch(`part/${s_part}.stl`);
            if(o_part.ok){ o_viewer.f_add_part(await o_part.arrayBuffer(), n_z); }
        }
    } catch(o_error){
        f_set_status(o_error.message, true);
        return;
    }
    f_select_pattern(o_state.o_param.n_id__pattern);
};

f_start();
