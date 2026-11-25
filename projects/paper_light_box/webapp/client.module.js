// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The page: the sheets with their pictures, the lit box, one sheet flat to place its
// picture, the box in 3D, and a file for each thing: every sheet as SVG and as STL,
// the box as STL, and for the puck light the plate with its holder's thread. The
// sheets and the preview are made here; the box, the plate and the sheets' STL come
// from the server, which runs OpenSCAD.

import { el } from './dom.module.js';
import { f_o_stage } from './stage.module.js';
import { f_o_editor } from './editor.module.js';
import { f_o_viewer } from './viewer.module.js';
import { f_o_mesh__from_stl, f_a_n_u8__from_base64 } from './mesh.module.js';
import { f_o_art, f_a_n__ink } from './art.module.js';
import { f_a_n__material, f_n_cnt__piece, f_a_a_n__sheet, f_s_svg__sheet } from './layer.module.js';
import { f_o_lit, f_a_n__source } from './light.module.js';
import { f_o_box, f_o_light } from './box.module.js';
import { f_a_o_sheet__demo } from './demo.module.js';

// The script's settings that the list of sheets sets.
let a_s_name__from_sheets = ['part', 'sheet_count', 'sheet_thickness', 'sheet_thicknesses'];
// A group of the script that the form leaves out: the puck holder's own values, which
// have to stay those of the holder's script for its screwin to fit.
let s_title__not_shown = 'Holder';
let n_ms__wait = 400;
// Pixels of a sheet: in the lit preview, in the quick one drawn first while something is
// dragged, and traced for its files (10 per mm at most).
let n_cnt__pixel_preview = 300000;
let n_cnt__pixel_quick = 75000;
let n_cnt__pixel_file = 4000000;
let n_ms__sharp = 200;
let n_mm__thickness = 0.4;
// Blur of the light on its way to the next sheet, as a share of the way.
let n_sigma__per_distance = 0.55;
let a_n_colour__box = [0.93, 0.91, 0.86];
let a_n_colour__plate = [0.6, 0.76, 0.9];

let o_state = {
    a_o_group: [],
    o_v__by_name: {},
    // from the front to the back: { s_name, s_mode, n_mm__thickness, o_art, n_mm__x, n_mm__y, n_mm__width }
    a_o_sheet: [],
    o_sheet__selected: null,
    // kept all around every sheet
    n_mm__frame: 6,
    // the preview only: how much light a 0.4 thick sheet lets through, and the light
    n_transmission: 0.45,
    s_colour: '#ffe7c4',
    n_brightness: 4,
    n_room: 0.04,
    n_cnt__render: 0
};

let el_status = el('div', { className: 'status' });
let el_report = el('pre', { className: 'report' });
let el_list = el('div', { className: 'sheets' });
let el_lit = el('div', { className: 'lit' });
let el_canvas__editor = el('canvas', { className: 'editor' });
let el_canvas__view = el('canvas', { className: 'view', hidden: true });
let el_canvas__work = el('canvas');
let el_canvas__material = el('canvas');
let o_stage = null, o_editor = null, o_viewer = null;

let f_set_status = function(s, b_error = false){
    el_status.textContent = s;
    el_status.classList.toggle('error', b_error);
};

let f_save = function(o_blob, s_name){
    let el_link = el('a', { href: URL.createObjectURL(o_blob), download: s_name });
    document.body.append(el_link);
    el_link.click();
    el_link.remove();
    setTimeout(function(){ URL.revokeObjectURL(el_link.href); }, 10000);
};

let f_o_posted = async function(s_path, o_body){
    let o_response = await fetch(s_path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o_body) });
    let o = await o_response.json();
    if(!o_response.ok){ throw new Error(o.s_message); }
    return o;
};

// The script's settings as the server takes them: the sheets' thicknesses from the list.
let f_o_setting = function(){
    return { ...o_state.o_v__by_name, sheet_thicknesses: o_state.a_o_sheet.map(function(o_sheet){ return o_sheet.n_mm__thickness; }) };
};

// The picture as large as fits on the sheet, in its middle.
let f_fit = function(o_sheet){
    let o_v = o_state.o_v__by_name;
    o_sheet.n_mm__width = Math.min(o_v.sheet_x, o_v.sheet_y / o_sheet.o_art.n_ratio);
    o_sheet.n_mm__x = (o_v.sheet_x - o_sheet.n_mm__width) / 2;
    o_sheet.n_mm__y = (o_v.sheet_y - o_sheet.n_mm__width * o_sheet.o_art.n_ratio) / 2;
};

// A sheet's material per pixel of a grid n_w x n_h over the sheet.
let f_a_n__material_of = function(o_sheet, n_w, n_h){
    let n_px = n_w / o_state.o_v__by_name.sheet_x;
    return f_a_n__material(f_a_n__ink(el_canvas__work, o_sheet, n_w, n_h, n_px), n_w, n_h, o_sheet.s_mode, o_state.n_mm__frame * n_px);
};

// ---- lit preview and editor ----

let f_update = function(n_cnt__pixel){
    let o_v = o_state.o_v__by_name, a_o_sheet = o_state.a_o_sheet;
    let o_box = f_o_box(o_v, a_o_sheet.map(function(o_sheet){ return o_sheet.n_mm__thickness; }));
    let n_px = Math.max(1, Math.min(5, Math.sqrt(n_cnt__pixel / (o_v.sheet_x * o_v.sheet_y))));
    let n_w = Math.round(o_v.sheet_x * n_px), n_h = Math.round(o_v.sheet_y * n_px);
    let a_a_n_material = a_o_sheet.map(function(o_sheet){
        // a sheet that did not change keeps its grid: dragging one picture redraws one sheet
        let s_key = JSON.stringify([o_v.sheet_x, o_v.sheet_y, n_w, n_h, o_sheet.s_mode, o_state.n_mm__frame, o_sheet.n_mm__x, o_sheet.n_mm__y, o_sheet.n_mm__width]);
        if(o_sheet.o_grid?.s_key !== s_key || o_sheet.o_grid.o_art !== o_sheet.o_art){
            let a_n_material = f_a_n__material_of(o_sheet, n_w, n_h);
            o_sheet.o_grid = { s_key, o_art: o_sheet.o_art, a_n_material, n_cnt__piece: f_n_cnt__piece(a_n_material, n_w, n_h) };
        }
        o_sheet.o_el.el_note.textContent = o_sheet.o_grid.n_cnt__piece > 1
            ? `${o_sheet.o_grid.n_cnt__piece - 1} loose ${o_sheet.o_grid.n_cnt__piece > 2 ? 'pieces' : 'piece'}: not joined to the rest` : '';
        return o_sheet.o_grid.a_n_material;
    });
    let a_n_colour = [1, 3, 5].map(function(n_off){ return parseInt(o_state.s_colour.slice(n_off, n_off + 2), 16) / 255; });
    let o_lit = f_o_lit({
        n_w,
        n_h,
        a_o_sheet: a_o_sheet.map(function(o_sheet, n_idx){
            let n_mm__behind = n_idx === a_o_sheet.length - 1 ? o_v.light_distance : o_v.sheet_distance;
            return {
                a_n_material: a_a_n_material[n_idx],
                n_transmission: Math.pow(o_state.n_transmission, o_sheet.n_mm__thickness / n_mm__thickness),
                n_px__sigma: n_sigma__per_distance * n_mm__behind * n_px
            };
        }),
        a_n_source: f_a_n__source(f_o_light(o_v, o_box), n_w, n_h, n_px),
        a_n_colour,
        n_brightness: o_state.n_brightness,
        n_room: o_state.n_room
    });
    o_stage.f_set({
        ...o_lit,
        n_w,
        n_h,
        a_n_mm__depth: o_box.a_n_mm__centre,
        n_mm__depth__light: o_box.n_mm__light,
        n_mm__stop: o_v.stop_height,
        n_mm__sheet_x: o_v.sheet_x,
        n_mm__sheet_y: o_v.sheet_y,
        n_mm__width: o_box.n_mm__width__sheets,
        n_mm__height: o_box.n_mm__height,
        n_mm__depth: o_box.n_mm__depth,
        n_mm__window_x: o_box.n_mm__window_x,
        n_mm__hidden_side: o_box.n_mm__hidden_side,
        n_mm__hidden_top: o_box.n_mm__hidden_top,
        n_mm__bar: o_box.n_mm__height - o_v.stop_height - o_v.sheet_y + o_box.n_mm__hidden_top,
        n_room: o_state.n_room,
        a_n_colour
    });
    el_download__plate.hidden = el_note__puck.hidden = o_v.light !== 'puck';
    let o_sheet = o_state.o_sheet__selected;
    o_el__tab.sheet.textContent = `Sheet ${a_o_sheet.indexOf(o_sheet) + 1}`;
    // the selected sheet for the editor: material light, holes see-through
    let a_n_material = o_sheet.o_grid.a_n_material;
    let a_n_rgba = new Uint8ClampedArray(n_w * n_h * 4);
    for(let n_it = 0; n_it < n_w * n_h; n_it++){
        a_n_rgba.set([244, 240, 230, 255 * a_n_material[n_it]], 4 * n_it);
    }
    el_canvas__material.width = n_w;
    el_canvas__material.height = n_h;
    el_canvas__material.getContext('2d').putImageData(new ImageData(a_n_rgba, n_w, n_h), 0, 0);
    o_editor.f_set({
        o_sheet,
        el_canvas__material,
        n_mm__sheet_x: o_v.sheet_x,
        n_mm__sheet_y: o_v.sheet_y,
        n_mm__hidden_side: o_box.n_mm__hidden_side,
        n_mm__hidden_top: o_box.n_mm__hidden_top
    });
    for(let s_name of ['n_mm__x', 'n_mm__y', 'n_mm__width']){
        let el_input = o_sheet.o_el[s_name];
        if(el_input && document.activeElement !== el_input){ el_input.value = Math.round(o_sheet[s_name] * 10) / 10; }
    }
};

let f_update_shown = function(n_cnt__pixel){
    try{
        f_update(n_cnt__pixel);
    } catch(o_error){
        console.error(o_error);
        f_set_status(o_error.message, true);
    }
};

// Every change shows at once in a quick preview, a quarter of the pixels, and sharp as
// soon as nothing has changed for a moment: a dragged picture follows the hand.
let b_update_asked = false;
let n_timeout__sharp = 0;
let f_update_soon = function(){
    clearTimeout(n_timeout__sharp);
    n_timeout__sharp = setTimeout(function(){ f_update_shown(n_cnt__pixel_preview); }, n_ms__sharp);
    if(b_update_asked){ return; }
    b_update_asked = true;
    requestAnimationFrame(function(){
        b_update_asked = false;
        f_update_shown(n_cnt__pixel_quick);
    });
};

// ---- the box, from the server ----

let f_render_box = async function(b_frame){
    let n_render = ++o_state.n_cnt__render;
    f_set_status('OpenSCAD renders the box …');
    try{
        // with the puck light also its plate, where it sits in the box
        let a_s_part = o_state.o_v__by_name.light === 'puck' ? ['box', 'placed'] : ['box'];
        let a_o = await Promise.all(a_s_part.map(function(s_part){ return f_o_posted('/api/mesh', { o_setting: f_o_setting(), s_part }); }));
        if(n_render !== o_state.n_cnt__render){ return; }
        o_viewer.f_set_mesh(a_o.map(function(o, n_idx){
            return { ...f_o_mesh__from_stl(f_a_n_u8__from_base64(o.s_stl).buffer), a_n_colour: n_idx ? a_n_colour__plate : a_n_colour__box, n_x: 0, n_y: 0 };
        }), b_frame);
        el_report.textContent = a_o[0].a_s_echo.join('\n');
        f_set_status('');
    } catch(o_error){
        if(n_render === o_state.n_cnt__render){ f_set_status(o_error.message, true); }
    }
};

let n_timeout = 0;
let b_frame__next = true;
let f_render_box_soon = function(b_frame = false){
    b_frame__next = b_frame__next || b_frame;
    clearTimeout(n_timeout);
    n_timeout = setTimeout(function(){
        f_render_box(b_frame__next);
        b_frame__next = false;
    }, n_ms__wait);
};

// ---- files ----

let f_s_name__file = function(o_sheet){
    let s_name = o_sheet.s_name.trim().replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '');
    return `sheet_${String(o_state.a_o_sheet.indexOf(o_sheet) + 1).padStart(2, '0')}${s_name ? '_' + s_name : ''}`;
};

// The sheet as it is cut: traced from a grid fine enough for a cutter, at most 10 pixels
// per mm and an even number of them, so that sizes in half millimetres fit the grid.
let f_s_svg__of = function(o_sheet){
    let o_v = o_state.o_v__by_name;
    let n_px = Math.max(4, Math.min(10, 2 * Math.floor(Math.sqrt(n_cnt__pixel_file / (o_v.sheet_x * o_v.sheet_y)) / 2)));
    let n_w = Math.round(o_v.sheet_x * n_px), n_h = Math.round(o_v.sheet_y * n_px);
    return f_s_svg__sheet(f_a_a_n__sheet(f_a_n__material_of(o_sheet, n_w, n_h), n_w, n_h, o_v.sheet_x, o_v.sheet_y), o_v.sheet_x, o_v.sheet_y);
};

// A button that is off while its file is made, and says what went wrong.
let f_el__download = function(s_text, s_title, f_download){
    let el_button = el('button', { textContent: s_text, title: s_title });
    el_button.addEventListener('click', async function(o_event){
        o_event.stopPropagation();
        el_button.disabled = true;
        try{
            await f_download();
            f_set_status('');
        } catch(o_error){
            console.error(o_error);
            f_set_status(o_error.message, true);
        } finally{
            el_button.disabled = false;
        }
    });
    return el_button;
};

let el_download__box = f_el__download('Box STL', 'The box as it is printed: upside down, the top wall with the slits on the bed', async function(){
    f_set_status('OpenSCAD renders the box …');
    let o = await f_o_posted('/api/mesh', { o_setting: f_o_setting(), s_part: 'print' });
    f_save(new Blob([f_a_n_u8__from_base64(o.s_stl)], { type: 'model/stl' }), `paper_light_box_${o_state.o_v__by_name.light}_${o_state.a_o_sheet.length}_sheets.stl`);
});
// For the puck light only.
let el_download__plate = f_el__download('Puck plate STL', 'The plate with the thread for the puck\'s holder, as it is printed: its front on the bed', async function(){
    f_set_status('OpenSCAD renders the puck plate …');
    let o = await f_o_posted('/api/mesh', { o_setting: f_o_setting(), s_part: 'puck_plate' });
    f_save(new Blob([f_a_n_u8__from_base64(o.s_stl)], { type: 'model/stl' }), `paper_light_box_puck_plate_${o_state.o_v__by_name.sheet_x}x${o_state.o_v__by_name.sheet_y}.stl`);
});
let el_note__puck = el('p', { className: 'lead', textContent: 'The puck lies on the screwin of RGBW_pucklight_holder_ringclick (or of pucklight_lamp_v2), which screws into the plate from behind: print it from that project. Its plunger is the button.' });

// ---- the list of sheets ----

let f_el__number = function(o, s_name, o_prop, f_changed){
    let el_input = el('input', { type: 'number', value: Math.round(o[s_name] * 100) / 100, ...o_prop });
    el_input.addEventListener('change', function(){
        let n = Number(el_input.value);
        let b_fine = el_input.value !== '' && Number.isFinite(n) && (o_prop.min === undefined || n >= o_prop.min) && (o_prop.max === undefined || n <= o_prop.max);
        el_input.classList.toggle('error', !b_fine);
        if(!b_fine){ return; }
        o[s_name] = n;
        f_changed();
    });
    el_input.addEventListener('click', function(o_event){ o_event.stopPropagation(); });
    return el_input;
};

let f_select = function(o_sheet){
    o_state.o_sheet__selected = o_sheet;
    for(let o_other of o_state.a_o_sheet){ o_other.o_el.el_card.classList.toggle('selected', o_other === o_sheet); }
    f_show('sheet');
    f_update_soon();
};

let f_load = async function(o_sheet, o_file){
    try{
        o_sheet.o_art = await f_o_art(await o_file.text());
        o_sheet.s_name = o_file.name.replace(/\.svg$/i, '');
        f_fit(o_sheet);
        o_state.o_sheet__selected = o_sheet;
        f_build_list();
        f_update_soon();
        f_set_status('');
    } catch(o_error){
        f_set_status(`${o_file.name}: ${o_error.message}`, true);
    }
};

let f_el__sheet = function(o_sheet, n_idx){
    let a_o_sheet = o_state.a_o_sheet;
    let f_el__button = function(s_text, s_title, b_disabled, f){
        let el_button = el('button', { className: 'small', textContent: s_text, title: s_title, disabled: b_disabled });
        el_button.addEventListener('click', function(o_event){
            o_event.stopPropagation();
            f();
            f_build_list();
            f_update_soon();
            f_render_box_soon();
        });
        return el_button;
    };
    let f_move = function(n_to){
        a_o_sheet.splice(n_idx, 1);
        a_o_sheet.splice(n_to, 0, o_sheet);
    };
    let el_name = el('input', { type: 'text', className: 'name', value: o_sheet.s_name, title: 'Name of the sheet, in its files\' names' });
    el_name.addEventListener('input', function(){ o_sheet.s_name = el_name.value; });
    el_name.addEventListener('click', function(o_event){ o_event.stopPropagation(); });
    let el_file = el('input', { type: 'file', accept: '.svg,image/svg+xml', hidden: true });
    el_file.addEventListener('change', function(){
        if(el_file.files[0]){ f_load(o_sheet, el_file.files[0]); }
    });
    let el_load = el('button', { className: 'small', textContent: o_sheet.o_art ? 'Other SVG …' : 'Load SVG …', title: 'The sheet\'s picture: an SVG file, dark on white or on nothing' });
    el_load.addEventListener('click', function(o_event){
        o_event.stopPropagation();
        el_file.click();
    });
    let el_mode = el('select', { title: 'What the picture is on this sheet' }, [
        el('option', { value: 'solid', textContent: 'picture stays', selected: o_sheet.s_mode === 'solid' }),
        el('option', { value: 'cut', textContent: 'picture is cut out', selected: o_sheet.s_mode === 'cut' })
    ]);
    el_mode.addEventListener('change', function(){
        o_sheet.s_mode = el_mode.value;
        f_update_soon();
    });
    el_mode.addEventListener('click', function(o_event){ o_event.stopPropagation(); });
    let el_note = el('span', { className: 'note' });
    o_sheet.o_el = { el_note };
    let a_el__place = [];
    if(o_sheet.o_art){
        for(let [s_name, s_label, s_title] of [['n_mm__x', 'x', 'The picture\'s left edge from the sheet\'s'], ['n_mm__y', 'y', 'The picture\'s top edge from the sheet\'s'], ['n_mm__width', 'width', 'Width of the picture']]){
            o_sheet.o_el[s_name] = f_el__number(o_sheet, s_name, { step: 0.5, title: s_title, ...(s_name === 'n_mm__width' ? { min: 1, max: 3000 } : {}) }, f_update_soon);
            a_el__place.push(el('label', {}, [s_label, o_sheet.o_el[s_name]]));
        }
        let el_fit = el('button', { className: 'small', textContent: 'Fit', title: 'As large as fits on the sheet, in its middle' });
        el_fit.addEventListener('click', function(o_event){
            o_event.stopPropagation();
            f_fit(o_sheet);
            f_update_soon();
        });
        a_el__place.push(el_fit);
    }
    let el_card = el('div', { className: `sheet${o_sheet === o_state.o_sheet__selected ? ' selected' : ''}` }, [
        el('div', { className: 'row' }, [
            el('b', { textContent: String(n_idx + 1), title: n_idx === 0 ? 'The front sheet' : (n_idx === a_o_sheet.length - 1 ? 'The last sheet, before the light' : '') }),
            el_name,
            f_el__button('↑', 'Towards the front', n_idx === 0, function(){ f_move(n_idx - 1); }),
            f_el__button('↓', 'Towards the back', n_idx === a_o_sheet.length - 1, function(){ f_move(n_idx + 1); }),
            f_el__button('✕', 'Remove this sheet', a_o_sheet.length === 1, function(){
                a_o_sheet.splice(n_idx, 1);
                if(o_state.o_sheet__selected === o_sheet){ o_state.o_sheet__selected = a_o_sheet[Math.min(n_idx, a_o_sheet.length - 1)]; }
            })
        ]),
        el('div', { className: 'row' }, [
            el_load, el_file, el_mode,
            el('label', { title: 'Thickness of this sheet: its slit in the box follows' }, ['thick', f_el__number(o_sheet, 'n_mm__thickness', { step: 0.05, min: 0.05, max: 3 }, function(){
                f_update_soon();
                f_render_box_soon();
            })])
        ]),
        a_el__place.length ? el('div', { className: 'row place' }, a_el__place) : '',
        el('div', { className: 'row' }, [
            f_el__download('SVG', 'This sheet for a cutter or a laser, 1 : 1 in mm', async function(){
                f_save(new Blob([f_s_svg__of(o_sheet)], { type: 'image/svg+xml' }), `${f_s_name__file(o_sheet)}.svg`);
            }),
            f_el__download('STL', 'This sheet for a 3D printer, as thick as set here', async function(){
                f_set_status('OpenSCAD makes the sheet …');
                let o = await f_o_posted('/api/sheet', { s_svg: f_s_svg__of(o_sheet), n_mm__thickness: o_sheet.n_mm__thickness });
                f_save(new Blob([f_a_n_u8__from_base64(o.s_stl)], { type: 'model/stl' }), `${f_s_name__file(o_sheet)}_${o_sheet.n_mm__thickness}mm.stl`);
            }),
            el_note
        ])
    ]);
    el_card.addEventListener('click', function(){ f_select(o_sheet); });
    o_sheet.o_el.el_card = el_card;
    return el_card;
};

let f_build_list = function(){
    el_list.replaceChildren(...o_state.a_o_sheet.map(f_el__sheet));
};

// ---- settings ----

// One control for one setting of the script, as in the ball joint app.
let f_el__setting = function(o_setting){
    let f_set = function(v){
        o_state.o_v__by_name[o_setting.s_name] = v;
        f_update_soon();
        f_render_box_soon(['sheet_x', 'sheet_y', 'light'].includes(o_setting.s_name));
    };
    let el_input;
    if(o_setting.s_kind === 'choice'){
        el_input = el('select', {}, o_setting.a_o_option.map(function(o_option){
            return el('option', { value: String(o_option.v), textContent: o_option.s_label, selected: o_option.v === o_setting.v_default });
        }));
        el_input.addEventListener('change', function(){
            f_set(o_setting.a_o_option.find(function(o_option){ return String(o_option.v) === el_input.value; }).v);
        });
    } else if(o_setting.s_kind === 'bool'){
        el_input = el('input', { type: 'checkbox', checked: o_setting.v_default });
        el_input.addEventListener('change', function(){ f_set(el_input.checked); });
    } else{
        let el_range = el('input', { type: 'range', min: o_setting.n_min, max: o_setting.n_max, step: o_setting.n_step, value: o_setting.v_default });
        let el_number = el('input', { type: 'number', min: o_setting.n_min, max: o_setting.n_max, step: o_setting.n_step, value: o_setting.v_default });
        let f_take = function(el_from, el_to){
            let n = Number(el_from.value);
            if(el_from.value === '' || !Number.isFinite(n) || n < o_setting.n_min || n > o_setting.n_max){ el_from.classList.add('error'); return; }
            el_from.classList.remove('error');
            el_to.value = el_from.value;
            f_set(n);
        };
        el_range.addEventListener('input', function(){ f_take(el_range, el_number); });
        el_number.addEventListener('change', function(){ f_take(el_number, el_range); });
        el_input = el('span', { className: 'number' }, [el_range, el_number]);
    }
    return el('label', { className: 'setting', title: o_setting.s_help }, [
        el('span', { className: 'name', textContent: o_setting.s_name.replace(/_/g, ' ') }),
        el_input,
        o_setting.s_help ? el('small', { textContent: o_setting.s_help }) : ''
    ]);
};

// A slider for one of the page's own numbers.
let f_el__own = function(s_label, s_help, s_name, n_min, n_max, n_step){
    let el_range = el('input', { type: 'range', min: n_min, max: n_max, step: n_step, value: o_state[s_name] });
    let el_value = el('output', { textContent: String(o_state[s_name]) });
    el_range.addEventListener('input', function(){
        o_state[s_name] = Number(el_range.value);
        el_value.textContent = el_range.value;
        f_update_soon();
    });
    return el('label', { className: 'setting', title: s_help }, [
        el('span', { className: 'name', textContent: s_label }),
        el('span', { className: 'number' }, [el_range, el_value]),
        el('small', { textContent: s_help })
    ]);
};

// ---- the page ----

let o_el__tab = {};
let el_hint = el('span', { className: 'hint', textContent: 'orange: hidden by the box' });
let f_show = function(s_tab){
    el_canvas__editor.hidden = el_hint.hidden = s_tab !== 'sheet';
    el_canvas__view.hidden = s_tab !== 'box';
    for(let [s_name, el_tab] of Object.entries(o_el__tab)){ el_tab.classList.toggle('on', s_name === s_tab); }
    if(s_tab === 'box'){ o_viewer.f_draw(); } else{ o_editor.f_draw(); }
};

let f_start = async function(){
    let { a_o_group, s_openscad } = await (await fetch('/api/setting')).json();
    o_state.a_o_group = a_o_group;
    let el_form = el('div', { className: 'form' });
    a_o_group.forEach(function(o_group, n_idx){
        let a_o_setting = o_group.a_o_setting.filter(function(o_setting){ return !a_s_name__from_sheets.includes(o_setting.s_name); });
        for(let o_setting of a_o_setting){ o_state.o_v__by_name[o_setting.s_name] = o_setting.v_default; }
        if(o_group.s_title.startsWith(s_title__not_shown)){ return; }
        el_form.append(el('details', { open: n_idx === 0 }, [el('summary', { textContent: o_group.s_title }), ...a_o_setting.map(f_el__setting)]));
    });
    for(let o_demo of f_a_o_sheet__demo()){
        let o_sheet = { ...o_demo, n_mm__thickness, o_art: o_demo.s_svg ? await f_o_art(o_demo.s_svg) : null, n_mm__x: 0, n_mm__y: 0, n_mm__width: 0 };
        if(o_sheet.o_art){ f_fit(o_sheet); }
        o_state.a_o_sheet.push(o_sheet);
    }
    o_state.o_sheet__selected = o_state.a_o_sheet[0];
    let el_colour = el('input', { type: 'color', value: o_state.s_colour });
    el_colour.addEventListener('input', function(){
        o_state.s_colour = el_colour.value;
        f_update_soon();
    });
    let el_add = el('button', { textContent: 'Add a sheet', title: 'A new sheet behind the others' });
    el_add.addEventListener('click', function(){
        let o_sheet = { s_name: 'sheet', s_mode: 'solid', n_mm__thickness, o_art: null, n_mm__x: 0, n_mm__y: 0, n_mm__width: 0 };
        o_state.a_o_sheet.push(o_sheet);
        o_state.o_sheet__selected = o_sheet;
        f_build_list();
        f_update_soon();
        f_render_box_soon();
    });
    for(let [s_tab, s_text] of [['sheet', 'Sheet'], ['box', 'Box']]){
        o_el__tab[s_tab] = el('button', { className: 'tab', textContent: s_text });
        o_el__tab[s_tab].addEventListener('click', function(){ f_show(s_tab); });
    }
    document.body.append(
        el('aside', {}, [
            el('h1', { textContent: 'Paper light box' }),
            el('p', { className: 'lead', textContent: 'Sheets with a picture cut out, one behind the other in a printed box, and a light behind them.' }),
            el('details', { open: true }, [
                el('summary', { textContent: 'Sheets, from the front to the back' }),
                el_list,
                el('div', { className: 'actions' }, [el_add]),
                f_el__own('frame', 'Kept all around every sheet, in mm: it holds the sheet together and sits in the box\'s grooves.', 'n_mm__frame', 0, 20, 0.5)
            ]),
            el_form,
            el('details', {}, [
                el('summary', { textContent: 'Light in the preview' }),
                el('label', { className: 'setting' }, [el('span', { className: 'name', textContent: 'colour' }), el_colour]),
                f_el__own('brightness', 'Of the light, as a camera\'s exposure.', 'n_brightness', 0, 12, 0.1),
                f_el__own('room', 'The room\'s own light on the sheets: 0 is a dark room.', 'n_room', 0, 1, 0.01),
                f_el__own('lets through', 'How much light a 0.4 thick sheet lets through: about 0.45 for white paper and white PLA, less for thick card.', 'n_transmission', 0.05, 0.9, 0.05)
            ]),
            el('div', { className: 'actions' }, [el_download__box, el_download__plate]),
            el_note__puck,
            el_status,
            el_report,
            el('footer', { textContent: `VeryOS - very open source. ${s_openscad}` })
        ]),
        el('main', {}, [
            el_lit,
            el('div', { className: 'work' }, [
                el('div', { className: 'tabs' }, [o_el__tab.sheet, o_el__tab.box, el_hint]),
                el_canvas__editor,
                el_canvas__view
            ])
        ])
    );
    o_stage = f_o_stage(el_lit);
    o_editor = f_o_editor(el_canvas__editor, f_update_soon);
    o_viewer = f_o_viewer(el_canvas__view);
    f_build_list();
    f_show('sheet');
    f_update_soon();
    f_render_box(true);
};

f_start().catch(function(o_error){ document.body.append(el('pre', { className: 'error', textContent: o_error.stack })); });
