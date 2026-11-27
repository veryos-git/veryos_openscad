// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The page: the steps and their settings, both sheets as they are drawn and printed, the
// pointer on them, and the pictures' files.

import { o_setting__default, n_mm__line, f_a_o_window, f_o_door, f_a_s_problem, f_s_d, f_s_svg, f_a_n__box__file } from './calendar.module.js';
import { a_s_side, f_o_picture, f_a_n__px, f_a_n__size, f_n_dpi, f_a_n__from_px, f_a_n__to_px, f_a_n__handle, f_a_n__handle__shown, f_a_n__handle__turn, f_o_picture__fitted, f_o_picture__spread, f_o_picture__resized, f_o_picture__turned, f_o_picture__scaled, f_o_picture__cut, f_o_picture__cropped, f_o_picture__stretched, f_o_picture__skewed } from './picture.module.js';
import { f_a_n__calendar, f_a_n__distance, f_a_n__bleed, f_a_s_problem__sheet, f_s_picture__sheet, f_s_line__sheet } from './sheet.module.js';
import { f_a_n_h, f_a_n__mapped, f_s_problem__match, f_a_a_n__anchor, f_a_n__snapped, f_n_px__per_mm, f_a_n__warped } from './match.module.js';

let s_key__storage = 'paper_advent_calendar';
let a_s_sheet = ['front', 'back'];
let a_s_name__own = ['n_mm__x', 'n_mm__y', 'n_mm__size_x', 'n_mm__size_y', 's_shape', 's_door'];
let a_s_name__picture = ['n_mm__x', 'n_mm__y', 'n_mm__size_x', 'n_deg', 'n_deg__skew'];
// a picture's handles: where on its frame, -1, 0 or 1 along x and y; corners size it,
// sides do what the panel's choice says, by its names
let o_f_o_picture__side = { crop: f_o_picture__cropped, stretch: f_o_picture__stretched, skew: f_o_picture__skewed };
let a_a_n__sign = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, 0], [0, -1], [1, 0], [0, 1]];
let n_px__handle = 6;
// the handle that turns a picture: this far from the handle of the picture's top side
let n_px__turn = 26;
// a picture's frame shows this far around its sheet of paper and no further; a handle
// that sits further out, or out of view, is drawn where that ends, see f_a_n__handle__shown
let n_px__around = 20;
// matching by four points: how large a point is drawn, and from how far a click snaps to a place of the cut pattern
let n_px__match = 9;
let n_px__snap = 8;
// a matched picture is laid anew from no more of its file than this along its longer
// side, and no finer than a print can show
let n_px__work = 4096;
let n_px__per_mm__print = 300 / 25.4;
let el_panel = document.getElementById('el_panel');
let el_stage = document.getElementById('el_stage');

// The settings as the page last left them; they stay in this browser.
let o_setting = structuredClone(o_setting__default);
try{
    let o_stored = JSON.parse(localStorage.getItem(s_key__storage)) ?? {};
    for(let s_name of Object.keys(o_setting__default)){
        if(s_name in o_stored){ o_setting[s_name] = o_stored[s_name]; }
    }
} catch(o_error){
    console.warn(o_error);
}
let n_idx__selected = null;
// The step whose settings the panel shows: 'paper', 'window', 'picture', 'cut' or
// 'output'. It is also what the pointer moves on the sheet: windows in 'window', the
// sheet's picture in 'picture', nothing in the others.
let s_step = 'paper';
// the sheet shown, 'front' or 'back': the step 'picture' is about its picture
let s_sheet__shown = 'front';
try{
    let o_stored = JSON.parse(localStorage.getItem(`${s_key__storage}__page`)) ?? {};
    if(document.querySelector(`.step[data-step="${o_stored.s_step}"]`)){ s_step = o_stored.s_step; }
    if(a_s_sheet.includes(o_stored.s_sheet__shown)){ s_sheet__shown = o_stored.s_sheet__shown; }
} catch(o_error){
    console.warn(o_error);
}
// what there is to say about the last picture file chosen, '' if it was taken
let s_note__file = '';
// the pictures' files as addresses the page can show, '' without one
let o_s_url = { front: '', back: '' };
// what is being dragged: a window, or a sheet's picture as it was when taken
let o_drag = null;
// a picture being matched to the cut pattern by four points: its sheet, the points
// clicked so far, a_a_n__px on the picture in its file's pixels and a_a_n__mm their
// places on the calendar, the picture's place before, where a click would land now,
// and what there is to say
let o_match = null;
// the picture a match took the place of, to bring it back: its sheet, file and place
let o_undo = null;
let o_s_svg = { front: '', back: '' };

// The pictures' files are too large for the settings' place: they are kept in the
// browser's database, a sheet's under the sheet's name. s_do: 'get', 'put' or 'delete'.
let f_v__stored = function(s_do, ...a_v){
    return new Promise(function(f_resolve, f_reject){
        let o_request__open = indexedDB.open(s_key__storage, 1);
        o_request__open.onupgradeneeded = function(){ o_request__open.result.createObjectStore('picture'); };
        o_request__open.onerror = function(){ f_reject(o_request__open.error); };
        o_request__open.onsuccess = function(){
            let o_request = o_request__open.result.transaction('picture', s_do === 'get' ? 'readonly' : 'readwrite').objectStore('picture')[s_do](...a_v);
            o_request.onerror = function(){ f_reject(o_request.error); };
            o_request.onsuccess = function(){ f_resolve(o_request.result); };
        };
    });
};

// The form's fields are the settings but for the seed, the windows' own values and the pictures.
let f_a_el__field = function(s_name){
    let v = el_panel.elements[s_name];
    return v instanceof RadioNodeList ? [...v] : v ? [v] : [];
};
let f_fill_form = function(){
    for(let [s_name, v] of Object.entries(o_setting)){
        for(let el of f_a_el__field(s_name)){
            if(Array.isArray(v)){ el.checked = v.includes(el.value); }
            else if(el.type === 'checkbox'){ el.checked = v; }
            else if(el.type === 'radio'){ el.checked = el.value === v; }
            else { el.value = v; }
        }
    }
};
let f_o_setting__form = function(){
    let o = {};
    for(let [s_name, v] of Object.entries(o_setting__default)){
        let a_el = f_a_el__field(s_name);
        if(!a_el.length){ continue; }
        if(Array.isArray(v)){ o[s_name] = a_el.filter(function(el){ return el.checked; }).map(function(el){ return el.value; }); }
        else if(a_el[0].type === 'checkbox'){ o[s_name] = a_el[0].checked; }
        else if(a_el[0].type === 'radio'){ o[s_name] = a_el.find(function(el){ return el.checked; })?.value ?? v; }
        else if(typeof v === 'string'){ o[s_name] = a_el[0].value; }
        else { o[s_name] = a_el[0].valueAsNumber; }
    }
    return o;
};
let f_s = function(n){ return String(+n.toFixed(2)); };
// A field's name as the page shows it: its step, and its own name or its row's.
let f_s_name = function(el){
    let s_step__field = el.closest('.step').dataset.step;
    return `${document.querySelector(`#el_step [data-step="${s_step__field}"]`).lastChild.textContent}, ${el.getAttribute('aria-label') ?? el.closest('label').firstElementChild.textContent}`;
};
// Sets what an element holds, if it holds something else: a picture left alone is not loaded anew.
let f_set_html = function(el, s_html){
    if(el.s_html !== s_html){
        el.innerHTML = s_html;
        el.s_html = s_html;
    }
};

// What only the screen shows of a sheet, as SVG: the printer's margin, where the windows
// open, and what the pointer takes hold of. a_n__view: what of the sheet and around it
// a picture's handles are kept in, in the sheet's mm: left, top, right, bottom.
let f_s_screen = function(s_sheet, a_o_door, n_mm__per_px, a_n__view){
    let n_margin = o_setting.n_mm__printer_margin;
    let a_s = [];
    if(n_margin > 0 && 2 * n_margin < Math.min(o_setting.n_mm__sheet_x, o_setting.n_mm__sheet_y)){
        a_s.push(`<rect class="margin" x="${n_margin}" y="${n_margin}" width="${o_setting.n_mm__sheet_x - 2 * n_margin}" height="${o_setting.n_mm__sheet_y - 2 * n_margin}"/>`);
    }
    a_s.push(`<g transform="translate(${f_a_n__calendar(o_setting).join(' ')})">`);
    if(!o_setting.b_outline){ a_s.push(`<rect class="edge" width="${o_setting.n_mm__calendar_x}" height="${o_setting.n_mm__calendar_y}"/>`); }
    if(s_sheet === 'back'){
        a_s.push(...a_o_door.map(function(o_door){ return `<path class="opening" d="${f_s_d(o_door.a_o_seg__opening)} Z"/>`; }));
    }
    if(s_step === 'window' && !o_match){
        a_s.push(...a_o_door.map(function(o_door, n_idx){
            return `<path class="hit${n_idx === n_idx__selected ? ' selected' : ''}" data-idx="${n_idx}" d="${f_s_d(o_door.a_o_seg__opening)} Z"/>`;
        }));
    }
    a_s.push('</g>');
    let o_picture = o_setting[`o_picture__${s_sheet}`];
    if(o_match && o_match.s_sheet === s_sheet){
        // the picture's points, their places, a line from each point to its place, and where the next click lands
        let n_r = n_px__match * n_mm__per_px;
        let a_a_n__from = o_match.a_a_n__px.map(function(a_n__px){ return f_a_n__from_px(o_picture, a_n__px); });
        let f_s_point = function(s_class, a_n, n_idx){
            return `<circle class="match ${s_class}" cx="${a_n[0]}" cy="${a_n[1]}" r="${n_r}"/><text class="match" x="${a_n[0]}" y="${a_n[1]}" font-size="${1.3 * n_r}">${n_idx + 1}</text>`;
        };
        a_s.push(`<g transform="translate(${f_a_n__calendar(o_setting).join(' ')})">`);
        a_s.push(...o_match.a_a_n__mm.map(function(a_n, n_idx){ return `<line class="match" x1="${a_a_n__from[n_idx][0]}" y1="${a_a_n__from[n_idx][1]}" x2="${a_n[0]}" y2="${a_n[1]}"/>`; }));
        a_s.push(...a_a_n__from.map(function(a_n, n_idx){ return f_s_point('from', a_n, n_idx); }));
        a_s.push(...o_match.a_a_n__mm.map(function(a_n, n_idx){ return f_s_point('to', a_n, n_idx); }));
        if(o_match.a_n__next){ a_s.push(`<circle class="match next" cx="${o_match.a_n__next[0]}" cy="${o_match.a_n__next[1]}" r="${n_r}"/>`); }
        a_s.push('</g>');
    } else if(s_step === 'picture' && o_picture && o_s_url[s_sheet]){
        let n_around = n_px__around * n_mm__per_px;
        a_s.push(`<clipPath id="${s_sheet}_around"><rect x="${-n_around}" y="${-n_around}" width="${o_setting.n_mm__sheet_x + 2 * n_around}" height="${o_setting.n_mm__sheet_y + 2 * n_around}"/></clipPath>`);
        let [n_x__calendar, n_y__calendar] = f_a_n__calendar(o_setting);
        a_s.push(`<g clip-path="url(#${s_sheet}_around)"><g transform="translate(${n_x__calendar} ${n_y__calendar})">`);
        a_s.push(`<polygon class="frame" points="${a_a_n__sign.slice(0, 4).map(function(a_n__sign){ return f_a_n__handle(o_picture, a_n__sign).join(','); }).join(' ')}"/>`);
        // the handles are not cut off with the frame: each is drawn in view, in the calendar's mm
        a_s.push(`</g></g><g transform="translate(${n_x__calendar} ${n_y__calendar})">`);
        let a_n__box = [a_n__view[0] - n_x__calendar, a_n__view[1] - n_y__calendar, a_n__view[2] - n_x__calendar, a_n__view[3] - n_y__calendar];
        // the handle that turns it, on a stem from the top side's
        let a_n__top = f_a_n__handle__shown(o_picture, [0, -1], a_n__box);
        let a_n__turn = f_a_n__handle__turn(o_picture, a_n__box, n_px__turn * n_mm__per_px);
        a_s.push(`<line class="frame" x1="${a_n__top[0]}" y1="${a_n__top[1]}" x2="${a_n__turn[0]}" y2="${a_n__turn[1]}"/>`);
        a_s.push(...a_a_n__sign.map(function(a_n__sign){
            let [n_x, n_y] = f_a_n__handle__shown(o_picture, a_n__sign, a_n__box);
            return `<circle class="handle${a_n__sign.includes(0) ? ' side' : ''}" data-sign="${a_n__sign.join(',')}" cx="${n_x}" cy="${n_y}" r="${n_px__handle * n_mm__per_px}"><title>Drag to ${a_n__sign.includes(0) ? el_panel.elements.s_side.value : 'size'}</title></circle>`;
        }));
        a_s.push(`<circle class="handle turn" cx="${a_n__turn[0]}" cy="${a_n__turn[1]}" r="${n_px__handle * n_mm__per_px}"><title>Drag to turn</title></circle></g>`);
    }
    return a_s.join('');
};

let f_update = function(){
    // the step that is open and the sheet shown: first, so that a field that is wrong can be got to
    document.body.dataset.step = s_step;
    for(let el of el_panel.querySelectorAll('.step')){ el.hidden = el.dataset.step !== s_step; }
    for(let el of document.querySelectorAll('[name=s_sheet__shown], [name=s_sheet__picture]')){
        el.checked = el.value === s_sheet__shown;
        // while a picture is matched, its sheet stays
        el.disabled = Boolean(o_match);
        el.parentElement.classList.toggle('has', el.name === 's_sheet__picture' && Boolean(o_s_url[el.value]));
    }
    for(let s_sheet of a_s_sheet){ document.getElementById(`el_sheet__${s_sheet}`).classList.toggle('shown', s_sheet === s_sheet__shown); }
    document.getElementById('el_shown_note').textContent = s_sheet__shown === 'back' ? 'as seen from the front' : '';
    try{ localStorage.setItem(`${s_key__storage}__page`, JSON.stringify({ s_step, s_sheet__shown })); } catch(o_error){ console.warn(o_error); }

    let o_form = f_o_setting__form();
    el_panel.elements.n_mm__margin.max = Math.floor(Math.min(o_form.n_mm__calendar_x, o_form.n_mm__calendar_y) / 2 - 1);
    let el_bad = [...el_panel.elements].find(function(el){ return el.name && !el.checkValidity(); });
    let s_bad = el_bad ? `${f_s_name(el_bad)}: ${el_bad.validationMessage}` : '';
    if(!s_bad && !o_form.a_s_shape.length){ s_bad = 'Windows, Shapes: choose one at least'; }
    if(!s_bad && !o_form.a_s_door.length){ s_bad = 'Windows, Doors: choose one at least'; }
    let s_step__bad = el_bad ? el_bad.closest('.step').dataset.step : s_bad ? 'window' : '';
    for(let el of document.querySelectorAll('#el_step button')){
        if(el.dataset.step === s_step){ el.setAttribute('aria-current', 'step'); } else { el.removeAttribute('aria-current'); }
        el.classList.toggle('bad', el.dataset.step === s_step__bad);
    }
    for(let s_id of ['el_print', 'el_download__front', 'el_download__back']){
        document.getElementById(s_id).disabled = Boolean(s_bad);
    }
    if(s_bad){
        document.getElementById('el_status').textContent = s_bad;
        return;
    }
    Object.assign(o_setting, o_form);
    try{ localStorage.setItem(s_key__storage, JSON.stringify(o_setting)); } catch(o_error){ console.warn(o_error); }
    if(n_idx__selected !== null && n_idx__selected >= o_setting.n_window){ n_idx__selected = null; }

    let a_o_window = f_a_o_window(o_setting);
    let a_o_door = a_o_window.map(function(o_window){ return f_o_door(o_window, o_setting); });
    document.body.dataset.print = o_setting.s_print;
    // what a match is waiting for: points 'from' the picture, or the places they go 'to'
    if(o_match){ document.body.dataset.match = o_match.a_a_n__px.length < 4 ? 'from' : 'to'; } else { delete document.body.dataset.match; }
    el_stage.style.setProperty('--n_ratio__sheet', o_setting.n_mm__sheet_x / o_setting.n_mm__sheet_y);
    for(let s_sheet of a_s_sheet){
        o_s_svg[s_sheet] = f_s_svg(o_setting, s_sheet);
        let el_sheet = document.getElementById(`el_sheet__${s_sheet}`);
        let el_svg = el_sheet.firstElementChild;
        el_svg.setAttribute('viewBox', `0 0 ${o_setting.n_mm__sheet_x} ${o_setting.n_mm__sheet_y}`);
        el_svg.setAttribute('width', `${o_setting.n_mm__sheet_x}mm`);
        el_svg.setAttribute('height', `${o_setting.n_mm__sheet_y}mm`);
        el_sheet.classList.toggle('has_picture', Boolean(o_setting[`o_picture__${s_sheet}`] && o_s_url[s_sheet]));
        el_sheet.classList.toggle('matching', o_match?.s_sheet === s_sheet);
        f_set_html(el_svg.querySelector('.picture'), f_s_picture__sheet(o_setting, s_sheet, o_s_url[s_sheet]));
        f_set_html(el_svg.querySelector('.line'), f_s_line__sheet(o_setting, s_sheet));
        // the handles keep their size on the screen whatever the sheet's, and stay whole in
        // what of the sheet and the pixels around it the view shows
        let o_rect = el_svg.getBoundingClientRect();
        let n_mm__per_px = o_rect.width ? o_setting.n_mm__sheet_x / o_rect.width : 0.3;
        let el_scroll = document.getElementById('el_scroll');
        let o_rect__view = el_scroll.getBoundingClientRect();
        let n_px__in = n_px__handle + 2;
        let a_n__view = [
            Math.max(-n_px__around, o_rect__view.left + n_px__in - o_rect.left),
            Math.max(-n_px__around, o_rect__view.top + n_px__in - o_rect.top),
            Math.min(o_rect.width + n_px__around, o_rect__view.left + el_scroll.clientWidth - n_px__in - o_rect.left),
            Math.min(o_rect.height + n_px__around, o_rect__view.top + el_scroll.clientHeight - n_px__in - o_rect.top)
        ].map(function(n){ return n * n_mm__per_px; });
        f_set_html(el_svg.querySelector('.screen'), f_s_screen(s_sheet, a_o_door, n_mm__per_px, a_n__view));
    }

    // where the calendar lies, in the numbers a cutter's software asks for
    let a_n = f_a_n__distance(o_setting);
    let f_s_file = function(s_sheet){
        let a_n__box = f_a_n__box__file(o_setting, s_sheet);
        if(!a_n__box){ return 'empty'; }
        let a_n__file = f_a_n__distance(o_setting, a_n__box);
        // with a dot in each of the sheet's corners a file is the sheet
        return `${f_s(a_n__box[2] - a_n__box[0])} × ${f_s(a_n__box[3] - a_n__box[1])} mm, `
            + (a_n__file.every(function(n){ return Math.abs(n) < 1e-9; }) ? 'the sheet of paper itself, corner on corner' : `${f_s(a_n__file[0])} from the sheet's left, ${f_s(a_n__file[1])} from its bottom`);
    };
    document.getElementById('el_place').textContent = `That leaves ${f_s(a_n[2])} mm to the sheet's right edge and ${f_s(a_n[3])} mm to its top.`;
    document.getElementById('el_file').textContent = 'In the cutter\'s software '
        + (f_s_file('front') === f_s_file('back') ? `both files: ${f_s_file('front')}.` : `the front file: ${f_s_file('front')}; the back file: ${f_s_file('back')}.`);
    // the format's name follows the sheet's size, whichever way it was set
    let el_format = document.getElementById('el_format');
    let s_format = `${o_setting.n_mm__sheet_x} ${o_setting.n_mm__sheet_y}`;
    el_format.value = [...el_format.options].some(function(el){ return el.value === s_format; }) ? s_format : '';
    el_panel.elements.n_mm__mark.disabled = !o_setting.b_mark;

    let b_selected = n_idx__selected !== null;
    document.getElementById('el_own').hidden = !b_selected;
    document.getElementById('el_own_hint').hidden = b_selected;
    document.getElementById('el_own_title').textContent = b_selected ? `Window ${n_idx__selected + 1} of ${o_setting.n_window}` : 'One window';
    if(b_selected){
        let o_window = a_o_window[n_idx__selected];
        let o_door = a_o_door[n_idx__selected];
        for(let s_name of a_s_name__own){
            let el = el_panel.elements[`own__${s_name}`];
            if(el !== document.activeElement){ el.value = o_window[s_name]; }
        }
        document.getElementById('el_own_reset').disabled = !o_setting.a_o_window__own[n_idx__selected];
        // the window close up, in the lines' real width
        let n_mm__around = 3;
        let el_detail = document.getElementById('el_detail');
        el_detail.setAttribute('viewBox', [
            o_window.n_mm__x - o_window.n_mm__size_x / 2 - n_mm__around, o_window.n_mm__y - o_window.n_mm__size_y / 2 - n_mm__around,
            o_window.n_mm__size_x + 2 * n_mm__around, o_window.n_mm__size_y + 2 * n_mm__around
        ].join(' '));
        el_detail.innerHTML = `<g fill="none" stroke-width="${n_mm__line}">`
            + `<path stroke="#000000" d="${o_door.a_a_o_seg__cut.map(function(a_o_seg){ return f_s_d(a_o_seg); }).join(' ')}"/>`
            + `<path stroke="#0000ff" d="${o_door.a_a_o_seg__fold.map(function(a_o_seg){ return f_s_d(a_o_seg); }).join(' ')}"/></g>`;
    }

    let o_picture = o_s_url[s_sheet__shown] ? o_setting[`o_picture__${s_sheet__shown}`] : null;
    document.getElementById('el_picture_title').textContent = `Picture of the ${s_sheet__shown} sheet`;
    document.getElementById('el_picture').hidden = !o_picture || Boolean(o_match);
    let el_load = document.getElementById('el_picture_load');
    el_load.textContent = o_picture ? 'Load another' : 'Load a picture';
    el_load.classList.toggle('main', !o_picture);
    // while a picture is matched, the bar over the sheet says what to click, and the picture is no one else's
    el_load.disabled = Boolean(o_match);
    document.getElementById('el_picture_remove').disabled = !o_picture || Boolean(o_match);
    document.getElementById('el_matching').hidden = !o_match;
    document.getElementById('el_match_bar').hidden = !o_match;
    if(o_match){
        let n_from = o_match.a_a_n__px.length;
        let n_to = o_match.a_a_n__mm.length;
        document.getElementById('el_match_step').textContent = [
            n_from < 4 ? `Point ${n_from + 1} of 4: click it on the picture, on the ${o_match.s_sheet} sheet.`
                : n_to < 4 ? `Place ${n_to + 1} of 4: click where point ${n_to + 1} belongs on the cut pattern.` : '',
            o_match.s_message
        ].filter(Boolean).join(' ');
        document.getElementById('el_match_back').disabled = n_from === 0 || o_match.b_busy;
        document.getElementById('el_match_cancel').disabled = Boolean(o_match.b_busy);
    }
    document.getElementById('el_match_undo').hidden = o_undo?.s_sheet !== s_sheet__shown;
    document.getElementById('el_match_note').textContent = o_undo?.s_sheet === s_sheet__shown ? o_undo.s_note : '';
    let s_note__picture = 'None yet. Without a picture a print shows the sheet\'s cut lines.';
    if(o_picture){
        for(let s_name of a_s_name__picture){
            let el = el_panel.elements[`picture__${s_name}`];
            if(el !== document.activeElement){ el.value = f_s(o_picture[s_name]); }
        }
        o_picture.a_n_ratio__crop.forEach(function(n_ratio, n_idx){
            let el = el_panel.elements[`picture__crop_${n_idx}`];
            if(el !== document.activeElement){ el.value = f_s(n_ratio * 100); }
        });
        let el_stretch = el_panel.elements.picture__stretch;
        if(el_stretch !== document.activeElement){ el_stretch.value = f_s(o_picture.n_ratio__stretch * 100); }
        let [n_x, n_y] = f_a_n__size(o_picture);
        let n_dpi = f_n_dpi(o_picture);
        // stretched, it is finer one way than the other
        s_note__picture = `${o_picture.n_px__x} × ${o_picture.n_px__y} pixels, shown ${f_s(n_x)} × ${f_s(n_y)} mm: ${o_picture.n_ratio__stretch === 1 ? '' : 'at least '}${Math.round(n_dpi)} pixels per inch`
            + (n_dpi < 150 ? ', coarse in print; 300 is sharp.' : '.');
    }
    document.getElementById('el_picture_hint').textContent = [s_note__file, s_note__picture].filter(Boolean).join(' ');

    // print: a page is the sheet of paper, nothing around it; the shift's y points up, a page's down
    document.getElementById('el_style__page').textContent = `@page{ size: ${o_setting.n_mm__sheet_x}mm ${o_setting.n_mm__sheet_y}mm; margin: 0; }`
        + `@media print{ .sheet, .sheet > svg{ width: ${o_setting.n_mm__sheet_x}mm; height: ${o_setting.n_mm__sheet_y}mm; }`
        + ` .printed{ transform: translate(${o_setting.n_mm__print_x}px, ${-o_setting.n_mm__print_y}px); } }`;
    document.getElementById('el_print_note').textContent = `In the print dialog: paper ${f_s(o_setting.n_mm__sheet_x)} × ${f_s(o_setting.n_mm__sheet_y)} mm, scale 100 %, margins none; and no fitting to the page in the printer's own settings.`;

    let n_row = Math.ceil(o_setting.n_window / o_setting.n_column);
    document.getElementById('el_size').textContent = `${o_setting.n_window} windows in ${n_row} ${n_row === 1 ? 'row' : 'rows'}, `
        + `${f_s((o_setting.n_mm__calendar_x - 2 * o_setting.n_mm__margin) / o_setting.n_column)} × ${f_s((o_setting.n_mm__calendar_y - 2 * o_setting.n_mm__margin) / n_row)} mm from one to the next.`;
    let n_bridge = a_o_door.reduce(function(n, o_door){ return n + o_door.a_a_o_seg__cut.length - o_door.a_a_o_seg__chain.length; }, 0);
    document.getElementById('el_bridge').textContent = `${n_bridge} ${n_bridge === 1 ? 'bridge' : 'bridges'} in all.`;
    let a_s_problem = [...f_a_s_problem__sheet(o_setting), ...f_a_s_problem(o_setting)];
    document.getElementById('el_status').textContent = a_s_problem.slice(0, 4).join('\n')
        + (a_s_problem.length > 4 ? `\nand ${a_s_problem.length - 4} more` : '');
};

// What the chosen window has of its own, kept beside the grid's settings.
let f_set_own = function(o_own){
    o_setting.a_o_window__own[n_idx__selected] = { ...o_setting.a_o_window__own[n_idx__selected], ...o_own };
};

el_panel.addEventListener('input', function(o_event){
    let el = o_event.target;
    let v = el.tagName === 'SELECT' ? el.value : el.valueAsNumber;
    if(el.checkValidity() && v === v){
        if(el.name.startsWith('own__')){ f_set_own({ [el.name.slice(5)]: v }); }
        if(el.name.startsWith('picture__crop_')){
            o_setting[`o_picture__${s_sheet__shown}`] = f_o_picture__cut(o_setting[`o_picture__${s_sheet__shown}`], Number(el.name.slice(14)), v / 100);
        } else if(el.name === 'picture__stretch'){
            o_setting[`o_picture__${s_sheet__shown}`] = { ...o_setting[`o_picture__${s_sheet__shown}`], n_ratio__stretch: v / 100 };
        } else if(el.name.startsWith('picture__')){
            o_setting[`o_picture__${s_sheet__shown}`] = { ...o_setting[`o_picture__${s_sheet__shown}`], [el.name.slice(9)]: v };
        }
    }
    f_update();
});
// The sheet's format: a size by its name. On input: before the form hears of it and
// sets the fields as the page has them.
document.getElementById('el_format').addEventListener('input', function(o_event){
    if(!o_event.target.value){ return; }
    [el_panel.elements.n_mm__sheet_x.value, el_panel.elements.n_mm__sheet_y.value] = o_event.target.value.split(' ');
});
document.getElementById('el_shuffle').addEventListener('click', function(){
    o_setting.n_seed++;
    f_update();
});
document.getElementById('el_own_reset').addEventListener('click', function(){
    delete o_setting.a_o_window__own[n_idx__selected];
    f_update();
});

// A sheet's picture: its file goes into the browser's database, its place into the
// settings. Without a place given it fills the calendar and its bleed.
let f_set_picture = async function(s_sheet, o_file, o_picture__given = null){
    let s_url = o_file ? URL.createObjectURL(o_file) : '';
    let o_picture = null;
    if(o_file){
        let el_img = new Image();
        el_img.src = s_url;
        try{
            await el_img.decode();
            if(!el_img.naturalWidth || !el_img.naturalHeight){ throw new Error('no size'); }
        } catch(o_error){
            URL.revokeObjectURL(s_url);
            s_note__file = `${o_file.name} is not a picture this browser can show.`;
            f_update();
            return;
        }
        o_picture = o_picture__given ?? f_o_picture__fitted(f_o_picture(el_img.naturalWidth, el_img.naturalHeight), f_a_n__bleed(o_setting), true);
    }
    try{
        await (o_file ? f_v__stored('put', o_file, s_sheet) : f_v__stored('delete', s_sheet));
    } catch(o_error){
        // without the database the picture is there until the page is left
        console.warn(o_error);
    }
    URL.revokeObjectURL(o_s_url[s_sheet]);
    o_s_url[s_sheet] = s_url;
    o_setting[`o_picture__${s_sheet}`] = o_picture;
    s_note__file = '';
    f_update();
};
document.getElementById('el_picture_load').addEventListener('click', function(){ document.getElementById('el_picture_file').click(); });
document.getElementById('el_picture_file').addEventListener('change', async function(o_event){
    let o_file = o_event.target.files[0];
    o_event.target.value = '';
    if(!o_file){ return; }
    if(o_undo?.s_sheet === s_sheet__shown){ o_undo = null; }
    await f_set_picture(s_sheet__shown, o_file);
});
document.getElementById('el_picture_remove').addEventListener('click', function(){
    if(o_undo?.s_sheet === s_sheet__shown){ o_undo = null; }
    f_set_picture(s_sheet__shown, null);
});
let f_n_deg = function(n_deg){ return ((n_deg + 180) % 360 + 360) % 360 - 180; };
let o_f_o_picture = {
    cover: function(o_picture){ return f_o_picture__fitted(o_picture, f_a_n__bleed(o_setting), true); },
    contain: function(o_picture){ return f_o_picture__fitted(o_picture, [0, 0, o_setting.n_mm__calendar_x, o_setting.n_mm__calendar_y], false); },
    spread: function(o_picture){ return f_o_picture__spread(o_picture, f_a_n__bleed(o_setting)); },
    turn_left: function(o_picture){ return { ...o_picture, n_deg: f_n_deg(o_picture.n_deg - 90) }; },
    turn_right: function(o_picture){ return { ...o_picture, n_deg: f_n_deg(o_picture.n_deg + 90) }; },
    flip_x: function(o_picture){ return { ...o_picture, b_flip_x: !o_picture.b_flip_x }; },
    flip_y: function(o_picture){ return { ...o_picture, b_flip_y: !o_picture.b_flip_y }; }
};
document.getElementById('el_picture').addEventListener('click', function(o_event){
    let f_o_picture__changed = o_f_o_picture[o_event.target.dataset.picture];
    if(!f_o_picture__changed){ return; }
    o_setting[`o_picture__${s_sheet__shown}`] = f_o_picture__changed(o_setting[`o_picture__${s_sheet__shown}`]);
    f_update();
});

// Matching by four points. The picture is first fitted into the calendar, so that all of
// it can be clicked; then four clicks on it, four on the cut pattern, and it is laid anew.
document.getElementById('el_match').addEventListener('click', function(){
    let o_picture = o_setting[`o_picture__${s_sheet__shown}`];
    o_match = { s_sheet: s_sheet__shown, a_a_n__px: [], a_a_n__mm: [], o_picture, a_n__next: null, s_message: '', b_busy: false };
    o_setting[`o_picture__${s_sheet__shown}`] = f_o_picture__fitted(o_picture, [0, 0, o_setting.n_mm__calendar_x, o_setting.n_mm__calendar_y], false);
    f_update();
});
let f_cancel_match = function(){
    if(!o_match || o_match.b_busy){ return; }
    o_setting[`o_picture__${o_match.s_sheet}`] = o_match.o_picture;
    o_match = null;
    f_update();
};
document.getElementById('el_match_cancel').addEventListener('click', f_cancel_match);
window.addEventListener('keydown', function(o_event){
    if(o_event.key === 'Escape'){ f_cancel_match(); }
});
document.getElementById('el_match_back').addEventListener('click', function(){
    (o_match.a_a_n__mm.length ? o_match.a_a_n__mm : o_match.a_a_n__px).pop();
    o_match.s_message = '';
    f_update();
});
// The place a click at a_n, in the calendar's mm, means while matching: null beside the
// picture as long as its points are asked for, then the cut pattern's nearest place
// within reach, or with b_free just where it is.
let f_a_n__match = function(a_n, b_free){
    let o_picture = o_setting[`o_picture__${o_match.s_sheet}`];
    if(o_match.a_a_n__px.length < 4){
        let a_n__px = f_a_n__to_px(o_picture, a_n);
        let [n_x, n_y, n_px__x, n_px__y] = f_a_n__px(o_picture);
        return a_n__px[0] >= n_x && a_n__px[1] >= n_y && a_n__px[0] <= n_x + n_px__x && a_n__px[1] <= n_y + n_px__y ? a_n : null;
    }
    if(b_free){ return a_n; }
    let n_mm__per_px = o_setting.n_mm__sheet_x / document.getElementById(`el_sheet__${o_match.s_sheet}`).firstElementChild.getBoundingClientRect().width;
    return f_a_n__snapped(a_n, f_a_a_n__anchor(o_setting), n_px__snap * n_mm__per_px);
};
// A sheet's picture laid anew by four points, a_a_n__px in its file and a_a_n__mm their
// places on the calendar: a new picture file over the calendar and its bleed, its
// place, and whether the old picture reached everywhere.
let f_o_matched = async function(s_sheet, a_a_n__px, a_a_n__mm){
    let el_img = new Image();
    el_img.src = o_s_url[s_sheet];
    await el_img.decode();
    // what is left of the file, and the points counted from that part's corner
    let [n_x, n_y, n_px__x, n_px__y] = f_a_n__px(o_setting[`o_picture__${s_sheet}`]);
    let a_a_n__part = a_a_n__px.map(function(a_n){ return [a_n[0] - n_x, a_n[1] - n_y]; });
    // the new picture's pixels: as fine as the old picture comes to lie in the calendar's
    // middle, a third of what a print shows at least and no finer than that; the same
    // along x and y, so the last row may reach a little over the bleed
    let [n_left, n_top, n_right, n_bottom] = f_a_n__bleed(o_setting);
    let n_px__per_mm__old = f_n_px__per_mm(f_a_n_h(a_a_n__mm, a_a_n__part), [o_setting.n_mm__calendar_x / 2, o_setting.n_mm__calendar_y / 2]);
    let n_px__x__new = Math.round((n_right - n_left) * Math.min(n_px__per_mm__print, Math.max(n_px__per_mm__print / 3, n_px__per_mm__old)));
    let n_px__per_mm = n_px__x__new / (n_right - n_left);
    let n_px__y__new = Math.ceil((n_bottom - n_top) * n_px__per_mm);
    // the old picture's pixels, made smaller first where they are much finer than the
    // new ones: the browser does that better than picking a pixel here and there
    let n_scale = Math.min(1, n_px__work / Math.max(n_px__x, n_px__y), 1.25 * n_px__per_mm / n_px__per_mm__old);
    let n_px__x__old = Math.max(1, Math.round(n_px__x * n_scale));
    let n_px__y__old = Math.max(1, Math.round(n_px__y * n_scale));
    let el_canvas = document.createElement('canvas');
    el_canvas.width = n_px__x__old;
    el_canvas.height = n_px__y__old;
    let o_context = el_canvas.getContext('2d', { willReadFrequently: true });
    o_context.imageSmoothingQuality = 'high';
    o_context.drawImage(el_img, n_x, n_y, n_px__x, n_px__y, 0, 0, n_px__x__old, n_px__y__old);
    let a_n__rgba = o_context.getImageData(0, 0, n_px__x__old, n_px__y__old).data;
    // from a place of the new picture, in its pixels, to the place of the old one it shows
    let a_n_h = f_a_n_h(
        a_a_n__mm.map(function(a_n){ return [(a_n[0] - n_left) * n_px__per_mm, (a_n[1] - n_top) * n_px__per_mm]; }),
        a_a_n__part.map(function(a_n){ return [a_n[0] * n_px__x__old / n_px__x, a_n[1] * n_px__y__old / n_px__y]; })
    );
    el_canvas.width = n_px__x__new;
    el_canvas.height = n_px__y__new;
    o_context.putImageData(new ImageData(f_a_n__warped(a_n__rgba, n_px__x__old, n_px__y__old, a_n_h, n_px__x__new, n_px__y__new), n_px__x__new, n_px__y__new), 0, 0);
    return {
        o_file: await new Promise(function(f_resolve){ el_canvas.toBlob(f_resolve, 'image/png'); }),
        o_picture: { ...f_o_picture(n_px__x__new, n_px__y__new), n_mm__x: (n_left + n_right) / 2, n_mm__y: n_top + n_px__y__new / n_px__per_mm / 2, n_mm__size_x: n_right - n_left },
        b_covered: [[0, 0], [n_px__x__new, 0], [n_px__x__new, n_px__y__new], [0, n_px__y__new]].every(function(a_n){
            let [n_x__old, n_y__old] = f_a_n__mapped(a_n_h, a_n);
            return n_x__old >= 0 && n_y__old >= 0 && n_x__old <= n_px__x__old && n_y__old <= n_px__y__old;
        })
    };
};
// A click while matching: a point more; with the fourth place, the match itself.
let f_add_match = async function(a_n){
    let { s_sheet, a_a_n__px, a_a_n__mm } = o_match;
    if(o_match.b_busy || a_a_n__mm.length === 4){ return; }
    if(!a_n){
        o_match.s_message = 'That is beside the picture.';
        f_update();
        return;
    }
    o_match.s_message = '';
    o_match.a_n__next = null;
    if(a_a_n__px.length < 4){
        a_a_n__px.push(f_a_n__to_px(o_setting[`o_picture__${s_sheet}`], a_n));
        f_update();
        return;
    }
    a_a_n__mm.push(a_n);
    if(a_a_n__mm.length < 4){
        f_update();
        return;
    }
    let s_problem = f_s_problem__match(a_a_n__px, a_a_n__mm, f_a_n__bleed(o_setting));
    if(s_problem){
        o_match.s_message = `${s_problem} Take a point back, or cancel.`;
        f_update();
        return;
    }
    o_match.b_busy = true;
    o_match.s_message = 'Laying the picture anew …';
    f_update();
    // the words first, then the work
    await new Promise(function(f_resolve){ setTimeout(f_resolve, 30); });
    try{
        let o_file__before = await (await fetch(o_s_url[s_sheet])).blob();
        let o_matched = await f_o_matched(s_sheet, a_a_n__px, a_a_n__mm);
        o_undo = {
            s_sheet, o_file: o_file__before, o_picture: o_match.o_picture,
            s_note: `Matched by four points${o_matched.b_covered ? '.' : '; the picture does not reach all of the calendar, which stays blank where it ends.'}`
        };
        o_match = null;
        await f_set_picture(s_sheet, o_matched.o_file, o_matched.o_picture);
    } catch(o_error){
        console.warn(o_error);
        o_match.b_busy = false;
        o_match.s_message = 'The picture could not be laid anew. Take a point back, or cancel.';
        f_update();
    }
};
document.getElementById('el_match_undo').addEventListener('click', async function(){
    let { s_sheet, o_file, o_picture } = o_undo;
    o_undo = null;
    await f_set_picture(s_sheet, o_file, o_picture);
});

document.getElementById('el_reset').addEventListener('click', async function(){
    if(!confirm('Start over with the settings of the first start? Windows moved or changed alone go back to the grid, and the pictures are removed.')){ return; }
    o_setting = structuredClone(o_setting__default);
    n_idx__selected = null;
    s_step = 'paper';
    s_sheet__shown = 'front';
    o_match = null;
    o_undo = null;
    f_fill_form();
    for(let s_sheet of a_s_sheet){ await f_set_picture(s_sheet, null); }
});

// The steps: the bar's buttons, and at each step's end the one to the next.
for(let el of document.querySelectorAll('button[data-step]')){
    el.addEventListener('click', function(){
        s_step = el.dataset.step;
        f_update();
        el_panel.scrollTop = 0;
    });
}
// The sheet shown, over the sheet and in the step 'picture'. On input: before the form
// hears of it and sets the fields as the page has them.
for(let el of document.querySelectorAll('[name=s_sheet__shown], [name=s_sheet__picture]')){
    el.addEventListener('input', function(){
        s_sheet__shown = el.value;
        s_note__file = '';
        f_update();
    });
}
// Zoom: what was in the middle of the view stays there.
for(let el of document.querySelectorAll('[name=n_zoom]')){
    el.addEventListener('change', function(){
        let el_scroll = document.getElementById('el_scroll');
        let el_sheet = document.getElementById(`el_sheet__${s_sheet__shown}`);
        let o_rect__view = el_scroll.getBoundingClientRect();
        let a_n__middle = [o_rect__view.left + o_rect__view.width / 2, o_rect__view.top + o_rect__view.height / 2];
        let o_rect = el_sheet.getBoundingClientRect();
        let a_n_ratio = [(a_n__middle[0] - o_rect.left) / o_rect.width, (a_n__middle[1] - o_rect.top) / o_rect.height];
        el_stage.style.setProperty('--n_zoom', el.value);
        o_rect = el_sheet.getBoundingClientRect();
        el_scroll.scrollBy(o_rect.left + a_n_ratio[0] * o_rect.width - a_n__middle[0], o_rect.top + a_n_ratio[1] * o_rect.height - a_n__middle[1]);
        f_update();
    });
}
// A sheet is as large as its place between the bars; what is drawn in the screen's pixels follows.
new ResizeObserver(function(){ requestAnimationFrame(f_update); }).observe(document.getElementById('el_view'));
// A picture's handles stay in view: they follow where a zoomed sheet is moved to.
document.getElementById('el_scroll').addEventListener('scroll', function(){ f_update(); });
// The lines' legend closes with a press beside it.
window.addEventListener('pointerdown', function(o_event){
    let el_legend_box = document.getElementById('el_legend_box');
    if(!el_legend_box.contains(o_event.target)){ el_legend_box.open = false; }
});

// Where the pointer is on a sheet, in the calendar's mm.
let f_a_n__mm = function(o_event, s_sheet){
    let o_rect = document.getElementById(`el_sheet__${s_sheet}`).firstElementChild.getBoundingClientRect();
    let n_mm__per_px = o_setting.n_mm__sheet_x / o_rect.width;
    let [n_x, n_y] = f_a_n__calendar(o_setting);
    return [(o_event.clientX - o_rect.left) * n_mm__per_px - n_x, (o_event.clientY - o_rect.top) * n_mm__per_px - n_y];
};
// Step 'window': a click on a window chooses it, a drag moves it in steps of 0.5 mm.
// Step 'picture': a drag anywhere on the sheet moves its picture, a drag of a handle
// sizes it, turns it, or cuts it off, stretches or skews it by a side. In the other steps the pointer moves nothing.
el_stage.addEventListener('pointerdown', function(o_event){
    let el_sheet = o_event.target.closest('.sheet');
    if(!el_sheet){ return; }
    let s_sheet = el_sheet.dataset.sheet;
    let a_n = f_a_n__mm(o_event, s_sheet);
    if(o_match){
        if(s_sheet === o_match.s_sheet){
            o_event.preventDefault();
            f_add_match(f_a_n__match(a_n, o_event.altKey));
        }
        return;
    }
    if(s_step === 'picture'){
        let o_picture = o_s_url[s_sheet] ? o_setting[`o_picture__${s_sheet}`] : null;
        if(o_picture){
            let el_handle = o_event.target.closest('.handle');
            // the handle that turns has no place on the frame
            let a_n__sign = el_handle?.dataset.sign ? el_handle.dataset.sign.split(',').map(Number) : null;
            // a handle is rarely taken by its middle: what the pointer is off, it stays off
            let a_n__handle = a_n__sign ? f_a_n__handle(o_picture, a_n__sign) : a_n;
            o_drag = { s_sheet, o_picture, a_n__sign, b_turn: Boolean(el_handle) && !a_n__sign, a_n__pointer: a_n, a_n__off: [a_n[0] - a_n__handle[0], a_n[1] - a_n__handle[1]] };
            o_event.preventDefault();
        }
    } else if(s_step === 'window'){
        let el_hit = o_event.target.closest('.hit');
        n_idx__selected = el_hit ? Number(el_hit.dataset.idx) : null;
        if(el_hit){
            let o_window = f_a_o_window(o_setting)[n_idx__selected];
            o_drag = { s_sheet, a_n__pointer: a_n, a_n__window: [o_window.n_mm__x, o_window.n_mm__y] };
            o_event.preventDefault();
        }
    }
    f_update();
    // a window chosen: its fields into view
    if(o_drag?.a_n__window){ document.getElementById('el_own_group').scrollIntoView({ block: 'nearest' }); }
});
window.addEventListener('pointermove', function(o_event){
    if(o_match && !o_match.b_busy && o_match.a_a_n__mm.length < 4){
        // a ring where a click would land: on the picture, or on the pattern's place it snaps to
        let b_on_sheet = o_event.target instanceof Element && o_event.target.closest('.sheet')?.dataset.sheet === o_match.s_sheet;
        let a_n__next = b_on_sheet ? f_a_n__match(f_a_n__mm(o_event, o_match.s_sheet), o_event.altKey) : null;
        if(String(a_n__next) !== String(o_match.a_n__next)){
            o_match.a_n__next = a_n__next;
            f_update();
        }
        return;
    }
    if(!o_drag){ return; }
    let a_n = f_a_n__mm(o_event, o_drag.s_sheet);
    if(o_drag.o_picture){
        let a_n__on = [a_n[0] - o_drag.a_n__off[0], a_n[1] - o_drag.a_n__off[1]];
        let o_picture;
        if(o_drag.b_turn){
            o_picture = f_o_picture__turned(o_drag.o_picture, o_drag.a_n__pointer, a_n);
            o_picture.n_deg = f_n_deg(o_picture.n_deg);
        } else if(!o_drag.a_n__sign){
            o_picture = { ...o_drag.o_picture, n_mm__x: o_drag.o_picture.n_mm__x + a_n[0] - o_drag.a_n__pointer[0], n_mm__y: o_drag.o_picture.n_mm__y + a_n[1] - o_drag.a_n__pointer[1] };
        } else if(o_drag.a_n__sign.includes(0)){
            o_picture = o_f_o_picture__side[el_panel.elements.s_side.value](o_drag.o_picture, a_s_side[a_a_n__sign.findIndex(function(a_n__sign){ return String(a_n__sign) === String(o_drag.a_n__sign); }) - 4], a_n__on);
        } else {
            o_picture = f_o_picture__resized(o_drag.o_picture, o_drag.a_n__sign, a_n__on);
        }
        // hundredths of a mm, of a degree and of a % are enough, and short in the fields
        for(let s_name of ['n_mm__x', 'n_mm__y', 'n_mm__size_x', 'n_deg', 'n_deg__skew']){ o_picture[s_name] = Math.round(o_picture[s_name] * 100) / 100; }
        o_picture.n_ratio__stretch = Math.round(o_picture.n_ratio__stretch * 1e4) / 1e4;
        o_setting[`o_picture__${o_drag.s_sheet}`] = o_picture;
        f_update();
        return;
    }
    let [n_mm__x, n_mm__y] = [0, 1].map(function(n_idx){
        return Math.round((o_drag.a_n__window[n_idx] + a_n[n_idx] - o_drag.a_n__pointer[n_idx]) * 2) / 2;
    });
    let o_window = f_a_o_window(o_setting)[n_idx__selected];
    if(n_mm__x === o_window.n_mm__x && n_mm__y === o_window.n_mm__y){ return; }
    // a window is not moved by a click: the pointer has to move it half a millimetre first
    if(!o_drag.b_moved && Math.hypot(a_n[0] - o_drag.a_n__pointer[0], a_n[1] - o_drag.a_n__pointer[1]) < 0.5){ return; }
    o_drag.b_moved = true;
    f_set_own({ n_mm__x, n_mm__y });
    f_update();
});
for(let s_event of ['pointerup', 'pointercancel']){
    window.addEventListener(s_event, function(){ o_drag = null; });
}
// Ctrl and the wheel, or two fingers spread on a touchpad, size a sheet's picture under
// the pointer: its handles may lie far outside the sheet.
el_stage.addEventListener('wheel', function(o_event){
    let s_sheet = o_event.target.closest('.sheet')?.dataset.sheet;
    if(s_step !== 'picture' || o_match || !o_event.ctrlKey || !s_sheet || !o_s_url[s_sheet]){ return; }
    o_event.preventDefault();
    let o_picture = f_o_picture__scaled(o_setting[`o_picture__${s_sheet}`], Math.exp(-o_event.deltaY / 1000), f_a_n__mm(o_event, s_sheet));
    for(let s_name of ['n_mm__x', 'n_mm__y', 'n_mm__size_x']){ o_picture[s_name] = Math.round(o_picture[s_name] * 100) / 100; }
    o_setting[`o_picture__${s_sheet}`] = o_picture;
    f_update();
}, { passive: false });

document.getElementById('el_print').addEventListener('click', function(){ window.print(); });
for(let s_sheet of a_s_sheet){
    document.getElementById(`el_download__${s_sheet}`).addEventListener('click', function(){
        let el_a = document.createElement('a');
        el_a.href = URL.createObjectURL(new Blob([o_s_svg[s_sheet]], { type: 'image/svg+xml' }));
        el_a.download = `advent_calendar_${s_sheet}_veryos.svg`;
        el_a.click();
        setTimeout(function(){ URL.revokeObjectURL(el_a.href); }, 1000);
    });
}

// A picture's place without its file is of no use: the file may be gone with the browser's data.
for(let s_sheet of a_s_sheet){
    if(!o_setting[`o_picture__${s_sheet}`]){ continue; }
    // a place kept before pictures could be stretched and skewed says neither: it is neither
    o_setting[`o_picture__${s_sheet}`] = { ...f_o_picture(0, 0), ...o_setting[`o_picture__${s_sheet}`] };
    let o_file = await f_v__stored('get', s_sheet).catch(function(o_error){ console.warn(o_error); });
    if(o_file){ o_s_url[s_sheet] = URL.createObjectURL(o_file); } else { o_setting[`o_picture__${s_sheet}`] = null; }
}
f_fill_form();
f_update();
