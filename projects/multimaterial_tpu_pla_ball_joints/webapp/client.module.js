// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The page: the script's settings as a form, the bed in a 3D view, and the 3MF to
// download. Every part comes from the server, rendered by OpenSCAD in each material;
// in the 3MF each printed piece is one object, its PLA part on filament 1, its TPU
// part on filament 2.

import { el } from './dom.module.js';
import { f_o_viewer } from './viewer.module.js';
import { f_o_mesh__from_stl, f_o_blob__3mf } from './export.module.js';

let a_o_filament = [
    { s_name: 'PLA', s_material: 'pla', s_colour: '#E8E8E8', a_n_colour: [0.86, 0.86, 0.84] },
    { s_name: 'TPU', s_material: 'tpu', s_colour: '#FF8C00', a_n_colour: [1, 0.55, 0.1] }
];
// What lies on the bed for each plate: the script's parts and how many of each.
let o_a_o_piece__by_plate = {
    print: [{ s_part: 'socket', n_cnt: 1 }, { s_part: 'ball', n_cnt: 1 }],
    test: [{ s_part: 'strip', n_cnt: 1 }, { s_part: 'ball', n_cnt: 3 }]
};
let n_mm__gap = 6;
let n_mm__bed_centre = 128;
let n_ms__wait = 350;

let o_state = {
    a_o_group: [],
    o_v__by_name: {},
    s_plate: 'print',
    a_o_object: [],
    n_cnt__render: 0,
    b_busy: false
};

let el_status = el('div', { className: 'status' });
let el_report = el('pre', { className: 'report' });
let el_download = el('button', { textContent: 'Download 3MF', disabled: true });
let el_canvas = el('canvas', { className: 'view' });
let o_viewer = null;

let f_set_status = function(s, b_error = false){
    el_status.textContent = s;
    el_status.classList.toggle('error', b_error);
};

let f_s_name__file = function(){
    let o_v = o_state.o_v__by_name;
    return `tpu_pla_ball_joint_${o_v.type}_${o_v.ball}mm_${o_state.s_plate}.3mf`;
};

let f_a_n_u8__from_base64 = function(s){
    let s_bin = atob(s);
    let a_n_u8 = new Uint8Array(s_bin.length);
    for(let n_it = 0; n_it < s_bin.length; n_it++){ a_n_u8[n_it] = s_bin.charCodeAt(n_it); }
    return a_n_u8;
};

let f_o_mesh__from_server = async function(s_part, s_material){
    let o_response = await fetch('/api/mesh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ o_setting: o_state.o_v__by_name, s_part, s_material })
    });
    let o_body = await o_response.json();
    if(!o_response.ok){ throw new Error(o_body.s_message); }
    return {
        a_s_echo: o_body.a_s_echo,
        o_mesh: o_body.s_stl ? f_o_mesh__from_stl(f_a_n_u8__from_base64(o_body.s_stl).buffer) : null
    };
};

// The pieces in a row along x, gap apart, the row centred on x = 0; each piece keeps
// its own y, where the script puts its axis on y = 0.
let f_lay_out = function(a_o_object){
    let a_n_box = a_o_object.map(function(o_object){
        let n_lo = Infinity, n_hi = -Infinity;
        for(let o_part of o_object.a_o_part){
            for(let n_off = 0; n_off < o_part.a_n_pos.length; n_off += 3){
                n_lo = Math.min(n_lo, o_part.a_n_pos[n_off]);
                n_hi = Math.max(n_hi, o_part.a_n_pos[n_off]);
            }
        }
        return [n_lo, n_hi];
    });
    let n_x = 0;
    a_o_object.forEach(function(o_object, n_idx){
        o_object.n_x = n_x - a_n_box[n_idx][0];
        o_object.n_y = 0;
        n_x += a_n_box[n_idx][1] - a_n_box[n_idx][0] + n_mm__gap;
    });
    let n_shift = (n_x - n_mm__gap) / 2;
    for(let o_object of a_o_object){ o_object.n_x -= n_shift; }
};

let f_render = async function(b_frame){
    let n_render = ++o_state.n_cnt__render;
    el_download.disabled = true;
    f_set_status('OpenSCAD renders the parts …');
    try{
        let a_o_piece = o_a_o_piece__by_plate[o_state.s_plate];
        let a_a_o = await Promise.all(a_o_piece.map(function(o_piece){
            return Promise.all(a_o_filament.map(function(o_filament){ return f_o_mesh__from_server(o_piece.s_part, o_filament.s_material); }));
        }));
        if(n_render !== o_state.n_cnt__render){ return; }
        let a_s_echo = [];
        let a_o_object = [];
        a_o_piece.forEach(function(o_piece, n_idx){
            let a_o_part = [];
            a_a_o[n_idx].forEach(function(o_result, n_idx__filament){
                for(let s of o_result.a_s_echo){ if(!a_s_echo.includes(s)){ a_s_echo.push(s); } }
                if(!o_result.o_mesh){ return; }
                let o_filament = a_o_filament[n_idx__filament];
                a_o_part.push({ s_name: `${o_piece.s_part} ${o_filament.s_name}`, n_filament: n_idx__filament + 1, ...o_result.o_mesh });
            });
            for(let n_copy = 0; n_copy < o_piece.n_cnt; n_copy++){
                a_o_object.push({ s_name: o_piece.n_cnt > 1 ? `${o_piece.s_part} ${n_copy + 1}` : o_piece.s_part, a_o_part });
            }
        });
        f_lay_out(a_o_object);
        o_state.a_o_object = a_o_object;
        o_viewer.f_set_mesh(a_o_object.flatMap(function(o_object){
            return o_object.a_o_part.map(function(o_part){
                return { ...o_part, a_n_colour: a_o_filament[o_part.n_filament - 1].a_n_colour, n_x: o_object.n_x, n_y: o_object.n_y };
            });
        }), b_frame);
        el_report.textContent = a_s_echo.join('\n');
        el_download.disabled = false;
        let n_cnt__part = a_o_object.reduce(function(n, o_object){ return n + o_object.a_o_part.length; }, 0);
        f_set_status(`${a_o_object.length} pieces, ${n_cnt__part} parts. In the slicer: filament 1 PLA, filament 2 TPU.`);
    } catch(o_error){
        if(n_render === o_state.n_cnt__render){ f_set_status(o_error.message, true); }
    }
};

let n_timeout = 0;
let f_render_soon = function(b_frame = false){
    clearTimeout(n_timeout);
    n_timeout = setTimeout(function(){ f_render(b_frame); }, n_ms__wait);
};

el_download.addEventListener('click', async function(){
    let a_o_object = o_state.a_o_object.map(function(o_object){
        return { ...o_object, n_x: n_mm__bed_centre + o_object.n_x, n_y: n_mm__bed_centre + o_object.n_y };
    });
    let o_blob = await f_o_blob__3mf(a_o_object, a_o_filament);
    let el_link = el('a', { href: URL.createObjectURL(o_blob), download: f_s_name__file() });
    document.body.append(el_link);
    el_link.click();
    el_link.remove();
    setTimeout(function(){ URL.revokeObjectURL(el_link.href); }, 10000);
});

// One control for one setting of the script; part and material are the app's.
let f_el__setting = function(o_setting){
    let f_set = function(v){
        o_state.o_v__by_name[o_setting.s_name] = v;
        f_render_soon(o_setting.s_name === 'ball');
    };
    let el_input;
    if(o_setting.s_kind === 'choice'){
        el_input = el('select', {}, o_setting.a_o_option.map(function(o_option){
            return el('option', { value: String(o_option.v), textContent: o_option.s_label, selected: o_option.v === o_setting.v_default });
        }));
        el_input.addEventListener('change', function(){
            let o_option = o_setting.a_o_option.find(function(o){ return String(o.v) === el_input.value; });
            f_set(o_option.v);
        });
    } else if(o_setting.s_kind === 'bool'){
        el_input = el('input', { type: 'checkbox', checked: o_setting.v_default });
        el_input.addEventListener('change', function(){ f_set(el_input.checked); });
    } else{
        let el_range = el('input', { type: 'range', min: o_setting.n_min, max: o_setting.n_max, step: o_setting.n_step, value: o_setting.v_default });
        let el_number = el('input', { type: 'number', min: o_setting.n_min, max: o_setting.n_max, step: o_setting.n_step, value: o_setting.v_default });
        let f_take = function(el_from, el_to){
            let n = Number(el_from.value);
            if(!Number.isFinite(n) || n < o_setting.n_min || n > o_setting.n_max){ el_from.classList.add('error'); return; }
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

let f_start = async function(){
    o_viewer = f_o_viewer(el_canvas);
    let o_response = await fetch('/api/setting');
    let { a_o_group, s_openscad } = await o_response.json();
    o_state.a_o_group = a_o_group;
    let o_setting__part = null;
    let el_form = el('div', { className: 'form' });
    a_o_group.forEach(function(o_group, n_idx){
        let a_o_setting = o_group.a_o_setting.filter(function(o_setting){
            if(o_setting.s_name === 'part'){ o_setting__part = o_setting; }
            return o_setting.s_name !== 'part' && o_setting.s_name !== 'material';
        });
        for(let o_setting of a_o_setting){ o_state.o_v__by_name[o_setting.s_name] = o_setting.v_default; }
        el_form.append(el('details', { open: n_idx === 0 }, [el('summary', { textContent: o_group.s_title }), ...a_o_setting.map(f_el__setting)]));
    });
    let el_plate = el('select', {}, Object.keys(o_a_o_piece__by_plate).map(function(s_plate){
        let o_option = o_setting__part?.a_o_option.find(function(o){ return o.v === s_plate; });
        return el('option', { value: s_plate, textContent: o_option ? o_option.s_label : s_plate });
    }));
    el_plate.addEventListener('change', function(){ o_state.s_plate = el_plate.value; f_render_soon(true); });
    let el_cut = el('input', { type: 'checkbox' });
    el_cut.addEventListener('change', function(){ o_viewer.f_set_cut(el_cut.checked); });
    document.body.append(
        el('aside', {}, [
            el('h1', { textContent: 'TPU + PLA ball joints' }),
            el('label', { className: 'setting' }, [el('span', { className: 'name', textContent: 'plate' }), el_plate]),
            el_form,
            el('div', { className: 'actions' }, [el_download, el('label', { className: 'cut' }, [el_cut, ' cut open'])]),
            el_status,
            el_report,
            el('footer', { textContent: `VeryOS - very open source. ${s_openscad}` })
        ]),
        el('main', {}, [el_canvas])
    );
    f_render(true);
};

f_start().catch(function(o_error){ document.body.append(el('pre', { className: 'error', textContent: o_error.stack })); });
