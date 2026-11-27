// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The page: the home page with the kinds of pattern and the saved projects, and the
// project on screen: the steps and their settings, the sheets as they are drawn and
// printed, the pointer on them, and the pictures' files. What a kind of pattern has of
// its own on the page is its part, see calendar.page.module.js.

import { f_o_picture, f_a_n__px, f_a_n__size, f_n_dpi, f_a_n__from_px, f_a_n__to_px, f_a_n__handle, f_a_n__handle__shown, f_a_n__handle__turn, f_f_b__in, f_o_picture__fitted, f_o_picture__spread, f_o_picture__resized, f_o_picture__turned, f_o_picture__scaled, f_o_picture__cut, f_o_picture__cropped, f_o_picture__stretched, f_o_picture__skewed, f_a_o_picture__split, a_s_name__look, f_b_look } from './picture.module.js';
import {
    f_o_setting__default, f_a_n__size__pattern, f_a_n__pattern, f_a_n__distance, f_a_n__bleed, f_a_n__box__file, f_s_svg, f_a_s_problem, f_a_a_n__anchor, f_a_a_n__spot,
    f_s_picture__sheet, f_s_line__sheet, f_s_svg__page
} from './sheet.module.js';
import { f_a_n_h, f_a_n__mapped, f_s_problem__match, f_a_n__snapped, f_n_px__per_mm, f_a_n__warped } from './match.module.js';
import { f_a_n__png_sized, f_a_v__pdf } from './file.module.js';
import { f_o_panel__project, f_o_response__server, f_s_url__project } from './project.module.js';
import { el } from './dom.module.js';
import { a_o_kind, f_o_kind } from './kind.module.js';
import { o_part as o_part__calendar } from './calendar.page.module.js';
import { o_part as o_part__flextangle } from './flextangle.page.module.js';

// every kind's part of the page, by the kind's name
let o_o_part = { calendar: o_part__calendar, flextangle: o_part__flextangle };
// named from when the app made advent calendars alone: what a browser kept then is still there
let s_key__storage = 'paper_advent_calendar';
// the sheets a pattern can have; which of them it has is its kind's a_o_sheet
let a_s_sheet = ['front', 'back'];
let a_s_name__picture = ['n_mm__x', 'n_mm__y', 'n_mm__size_x', 'n_deg', 'n_deg__skew'];
// a picture's handles: where on its frame, -1, 0 or 1 along x and y
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
// a page of the print as a file is as fine as that, and no larger than this along its longer side
let n_px__page = 8192;
let el_panel = document.getElementById('el_panel');
let el_stage = document.getElementById('el_stage');

// Settings as they were kept, in this browser or in a project: what has come to the
// settings since is as at the first start, what has left them is left out. Their kind is
// the one they name; kept before there were kinds, they are a calendar's.
let f_o_setting__kept = function(o_kept){
    let o = f_o_setting__default(o_kept?.s_kind);
    for(let s_name of Object.keys(o)){
        if(s_name !== 's_kind' && o_kept && typeof o_kept === 'object' && s_name in o_kept){ o[s_name] = structuredClone(o_kept[s_name]); }
    }
    for(let s_sheet of a_s_sheet){
        let s_name = `a_o_picture__${s_sheet}`;
        // kept before a sheet could have several pictures: its one picture, the file under the sheet's name
        let o_picture__alone = o_kept?.[`o_picture__${s_sheet}`];
        if(o_picture__alone && !(s_name in o_kept)){ o[s_name] = [{ ...structuredClone(o_picture__alone), s_file: s_sheet }]; }
        // a place kept before pictures could be stretched and skewed says neither: it is neither
        o[s_name] = (Array.isArray(o[s_name]) ? o[s_name] : []).map(function(o_picture){ return { ...f_o_picture(0, 0), ...o_picture }; });
    }
    return o;
};
// The settings as the page last left them; they stay in this browser.
let o_setting = f_o_setting__kept(null);
try{
    o_setting = f_o_setting__kept(JSON.parse(localStorage.getItem(s_key__storage)));
} catch(o_error){
    console.warn(o_error);
}
// The step whose settings the panel shows: 'paper', 'pattern', 'picture', 'cut' or
// 'output'. It is also what the pointer moves on the sheet: in 'pattern' what the kind's
// part of the page lets it, a calendar's windows; the sheet's picture in 'picture';
// nothing in the others.
let s_step = 'paper';
// the sheet shown, 'front' or 'back': the step 'picture' is about its pictures
let s_sheet__shown = 'front';
// the saved project that is open, by its name, null for none
let s_name__project = null;
try{
    let o_stored = JSON.parse(localStorage.getItem(`${s_key__storage}__page`)) ?? {};
    if(document.querySelector(`.step[data-step="${o_stored.s_step}"]`)){ s_step = o_stored.s_step; }
    if(a_s_sheet.includes(o_stored.s_sheet__shown)){ s_sheet__shown = o_stored.s_sheet__shown; }
    if(typeof o_stored.s_name__project === 'string'){ s_name__project = o_stored.s_name__project; }
} catch(o_error){
    console.warn(o_error);
}
// The home page, or the project on screen: the address says which, '#project' for the
// project. So a reload stays where it is, the browser's back button leads home, and the
// app's bare address opens the home page.
let f_b_home = function(){ return location.hash !== '#project'; };
let f_set_home = function(b_home){
    if(b_home !== f_b_home()){ history.pushState(null, '', b_home ? location.pathname : '#project'); }
};
// what there is to say about the last thing done with the pictures' files, '' for nothing
let s_note__file = '';
// the pictures' files as addresses the page can show, by the names the files are kept under
let o_s_url = {};
// the picture chosen on the sheet shown, the one the pointer and the fields change: its
// place in the sheet's list, null for none
let n_idx__picture = null;
// whether the chosen picture's handles cut it off instead of sizing and stretching it
let b_crop = false;
// whether a picture file of the open project did not get to the server
let b_file__unsaved = false;
// what is being dragged: a sheet's picture as it was when taken, or what the kind's part of the page gave for a press in its step
let o_drag = null;
// a picture being matched to the cut pattern by four points: its sheet, the points
// clicked so far, a_a_n__px on the picture in its file's pixels and a_a_n__mm their
// places on the pattern, the picture's place before, where a click would land now,
// and what there is to say
let o_match = null;
// the picture a match took the place of, to bring it back: its sheet, the file of the
// picture that came of the match, and the picture as it was
let o_undo = null;
let o_s_svg = { front: '', back: '' };
// a page of the print as a file: whether one is being made, and what there is to say about the last
let b_busy__page = false;
let s_note__page = '';

// The pictures' files are too large for the settings' place: they are kept in the
// browser's database, each under its name. s_do: 'get', 'put', 'delete' or 'getAllKeys'.
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

// The form's fields are the settings but for those that have none: the kind, the pictures, a calendar's seed.
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
    for(let [s_name, v] of Object.entries(f_o_setting__default(o_setting.s_kind))){
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
// A sheet's pictures, by default the shown sheet's; and the one chosen on the sheet
// shown, null if none is.
let f_a_o_picture = function(s_sheet = s_sheet__shown){ return o_setting[`a_o_picture__${s_sheet}`]; };
let f_o_picture__chosen = function(){ return n_idx__picture === null ? null : f_a_o_picture()[n_idx__picture] ?? null; };
let f_set_chosen = function(o_picture){ f_a_o_picture()[n_idx__picture] = o_picture; };
// A picture's place in hundredths of a mm, of a degree and of a %: enough, and short in the fields.
let f_o_picture__rounded = function(o_picture){
    let o = { ...o_picture, n_ratio__stretch: Math.round(o_picture.n_ratio__stretch * 1e4) / 1e4 };
    for(let s_name of ['n_mm__x', 'n_mm__y', 'n_mm__size_x', 'n_deg', 'n_deg__skew']){ o[s_name] = Math.round(o[s_name] * 100) / 100; }
    return o;
};
// How fine a sheet's page is as a file, in pixels a mm: as a print shows, less for a very large sheet.
let f_n_px__per_mm__page = function(){
    return Math.min(n_px__per_mm__print, n_px__page / Math.max(o_setting.n_mm__sheet_x, o_setting.n_mm__sheet_y));
};
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

// The kind of pattern on screen, its part of the page, and the sheets it has, by their names.
let f_o_kind__shown = function(){ return f_o_kind(o_setting.s_kind); };
let f_o_part = function(){ return o_o_part[f_o_kind__shown().s_kind]; };
let f_a_s_sheet = function(){ return f_o_kind__shown().a_o_sheet.map(function(o_sheet){ return o_sheet.s_sheet; }); };
// A sheet's name in a sentence or a file's name, with what stands before and behind it:
// nothing where the pattern has one sheet.
let f_s_sheet = function(s_sheet, s_before = '', s_after = ''){
    return f_a_s_sheet().length > 1 ? `${s_before}${s_sheet}${s_after}` : '';
};
// How a sheet's files are named, without their ending.
let f_s_file__name = function(s_sheet){
    return `${f_o_kind__shown().f_s_file(o_setting)}${f_s_sheet(s_sheet, '_')}_veryos`;
};
// What the page gives a kind's part of it.
let o_page = {
    el_panel,
    f_o_setting: function(){ return o_setting; },
    f_update: function(){ f_update(); },
    // whether the pointer takes hold of the pattern now: its step is open, and no picture is being matched
    f_b_pointer: function(){ return s_step === 'pattern' && !o_match; }
};
// The kind's part of the page put in place: its fields and words, and for each of its
// sheets the buttons of the files. With every design that comes on screen, so that
// nothing of the one before stays.
let f_place_kind = function(){
    let o_kind = f_o_kind__shown();
    let o_part = f_o_part();
    let a_o_sheet = o_kind.a_o_sheet;
    for(let el of document.querySelectorAll('[data-slot]')){ el.innerHTML = o_part.o_s_html[el.dataset.slot]; }
    document.getElementById('el_kind').textContent = o_kind.s_name;
    document.getElementById('el_step_name').textContent = o_part.s_step;
    document.getElementById('el_step_next').textContent = `Next: ${o_part.s_step} →`;
    document.getElementById('el_place_title').textContent = o_kind.s_name;
    document.getElementById('el_picture_lead').textContent = o_part.s_lead__picture;
    document.getElementById('el_paper_lead').textContent = `The sheet of paper the ${o_kind.s_noun} is printed on and cut from, and where the ${o_kind.s_noun} lies on it. Print and cut meet if both measure from the sheet's bottom left corner.`;
    document.getElementById('el_output_lead').textContent = `${a_o_sheet.length > 1 ? 'Print both sheets, then cut each with its file.' : 'Print the sheet, then cut it with its file.'} Try it on plain paper first, with the cut lines only: the knife has to follow the printed lines.`;
    document.getElementById('el_print').textContent = a_o_sheet.length > 1 ? 'Print front and back' : 'Print';
    // a pattern of one sheet has no sheet to choose
    for(let el of document.querySelectorAll('.sheet_choice')){ el.hidden = a_o_sheet.length < 2; }
    for(let s_sheet of a_s_sheet){
        let el_sheet = document.getElementById(`el_sheet__${s_sheet}`);
        el_sheet.hidden = !f_a_s_sheet().includes(s_sheet);
        // a sheet this pattern has not keeps nothing of the pattern before
        if(el_sheet.hidden){
            el_sheet.classList.remove('has_picture');
            for(let el of el_sheet.querySelectorAll('.picture, .line, .screen')){ f_set_html(el, ''); }
        }
    }
    let f_s_name = function(o_sheet, s_type){ return `${o_sheet.s_name}${o_sheet.s_name && ' '}${s_type}`; };
    document.getElementById('el_page').innerHTML = ['pdf', 'png'].flatMap(function(s_type){
        return a_o_sheet.map(function(o_sheet){ return `<button type="button" data-page="${o_sheet.s_sheet}" data-type="${s_type}">${f_s_name(o_sheet, s_type.toUpperCase())}</button>`; });
    }).join('');
    let el_download = document.getElementById('el_download');
    el_download.classList.toggle('one', a_o_sheet.length < 2);
    el_download.innerHTML = a_o_sheet.map(function(o_sheet){
        return `<button type="button" class="main" id="el_download__${o_sheet.s_sheet}" data-download="${o_sheet.s_sheet}">${f_s_name(o_sheet, 'SVG')}</button>`;
    }).join('');
    document.getElementById('el_legend').innerHTML = o_part.o_s_html.legend
        + '<li><svg viewBox="0 0 30 10"><path d="M 13 3 L 17 7" stroke="#008000" stroke-width="1.5"/></svg>a dot in each corner of the paper: cut</li>'
        + '<li><svg viewBox="0 0 30 10"><path d="M 0 5 H 30" stroke="#9aa0a0" stroke-width="1.5" stroke-dasharray="5 4"/></svg>the printer\'s margin</li>';
    o_part.f_start(o_page);
};

// What only the screen shows of a sheet, as SVG: the printer's margin, what the kind's
// part of the page shows of the pattern, and what the pointer takes hold of of a
// picture. a_n__view: what of the sheet and around it a picture's handles are kept in,
// in the sheet's mm: left, top, right, bottom.
let f_s_screen = function(s_sheet, n_mm__per_px, a_n__view){
    let n_margin = o_setting.n_mm__printer_margin;
    let a_s = [];
    if(n_margin > 0 && 2 * n_margin < Math.min(o_setting.n_mm__sheet_x, o_setting.n_mm__sheet_y)){
        a_s.push(`<rect class="margin" x="${n_margin}" y="${n_margin}" width="${o_setting.n_mm__sheet_x - 2 * n_margin}" height="${o_setting.n_mm__sheet_y - 2 * n_margin}"/>`);
    }
    a_s.push(`<g transform="translate(${f_a_n__pattern(o_setting).join(' ')})">${f_o_part().f_s_screen(s_sheet)}</g>`);
    let o_picture = s_sheet === s_sheet__shown ? f_o_picture__chosen() : null;
    if(o_match && o_match.s_sheet === s_sheet){
        // the picture's points, their places, a line from each point to its place, and where the next click lands
        let n_r = n_px__match * n_mm__per_px;
        let a_a_n__from = o_match.a_a_n__px.map(function(a_n__px){ return f_a_n__from_px(o_picture, a_n__px); });
        let f_s_point = function(s_class, a_n, n_idx){
            return `<circle class="match ${s_class}" cx="${a_n[0]}" cy="${a_n[1]}" r="${n_r}"/><text class="match" x="${a_n[0]}" y="${a_n[1]}" font-size="${1.3 * n_r}">${n_idx + 1}</text>`;
        };
        a_s.push(`<g transform="translate(${f_a_n__pattern(o_setting).join(' ')})">`);
        a_s.push(...o_match.a_a_n__mm.map(function(a_n, n_idx){ return `<line class="match" x1="${a_a_n__from[n_idx][0]}" y1="${a_a_n__from[n_idx][1]}" x2="${a_n[0]}" y2="${a_n[1]}"/>`; }));
        a_s.push(...a_a_n__from.map(function(a_n, n_idx){ return f_s_point('from', a_n, n_idx); }));
        a_s.push(...o_match.a_a_n__mm.map(function(a_n, n_idx){ return f_s_point('to', a_n, n_idx); }));
        if(o_match.a_n__next){ a_s.push(`<circle class="match next" cx="${o_match.a_n__next[0]}" cy="${o_match.a_n__next[1]}" r="${n_r}"/>`); }
        a_s.push('</g>');
    } else if(s_step === 'picture' && o_picture){
        let n_around = n_px__around * n_mm__per_px;
        a_s.push(`<clipPath id="${s_sheet}_around"><rect x="${-n_around}" y="${-n_around}" width="${o_setting.n_mm__sheet_x + 2 * n_around}" height="${o_setting.n_mm__sheet_y + 2 * n_around}"/></clipPath>`);
        let [n_x__pattern, n_y__pattern] = f_a_n__pattern(o_setting);
        a_s.push(`<g clip-path="url(#${s_sheet}_around)"><g transform="translate(${n_x__pattern} ${n_y__pattern})">`);
        a_s.push(`<polygon class="frame${b_crop ? ' crop' : ''}" points="${a_a_n__sign.slice(0, 4).map(function(a_n__sign){ return f_a_n__handle(o_picture, a_n__sign).join(','); }).join(' ')}"/>`);
        // the handles are not cut off with the frame: each is drawn in view, in the pattern's mm
        a_s.push(`</g></g><g transform="translate(${n_x__pattern} ${n_y__pattern})">`);
        let a_n__box = [a_n__view[0] - n_x__pattern, a_n__view[1] - n_y__pattern, a_n__view[2] - n_x__pattern, a_n__view[3] - n_y__pattern];
        // the handle that turns it, on a stem from the top side's
        let a_n__top = f_a_n__handle__shown(o_picture, [0, -1], a_n__box);
        let a_n__turn = f_a_n__handle__turn(o_picture, a_n__box, n_px__turn * n_mm__per_px);
        a_s.push(`<line class="frame" x1="${a_n__top[0]}" y1="${a_n__top[1]}" x2="${a_n__turn[0]}" y2="${a_n__turn[1]}"/>`);
        a_s.push(...a_a_n__sign.map(function(a_n__sign){
            let [n_x, n_y] = f_a_n__handle__shown(o_picture, a_n__sign, a_n__box);
            return `<circle class="handle${a_n__sign.includes(0) ? ' side' : ''}" data-sign="${a_n__sign.join(',')}" cx="${n_x}" cy="${n_y}" r="${n_px__handle * n_mm__per_px}"><title>${b_crop ? 'Drag to crop' : a_n__sign.includes(0) ? 'Drag to stretch, with Ctrl to skew' : 'Drag to size, with Shift out of its shape'}</title></circle>`;
        }));
        a_s.push(`<circle class="handle turn" cx="${a_n__turn[0]}" cy="${a_n__turn[1]}" r="${n_px__handle * n_mm__per_px}"><title>Drag to turn, with Shift in steps of 15°</title></circle></g>`);
    }
    return a_s.join('');
};

let f_update = function(){
    let o_part = f_o_part();
    let a_s_sheet__kind = f_a_s_sheet();
    // the home page or the project, as the address says; the home page as things are now
    document.body.dataset.view = f_b_home() ? 'home' : 'project';
    if(f_b_home()){ f_draw_home(o_panel__project.f_o_state()); }
    // the step that is open and the sheet shown: first, so that a field that is wrong can be got to
    document.body.dataset.step = s_step;
    for(let el of el_panel.querySelectorAll('.step')){ el.hidden = el.dataset.step !== s_step; }
    if(!a_s_sheet__kind.includes(s_sheet__shown)){ s_sheet__shown = a_s_sheet__kind[0]; }
    for(let el of document.querySelectorAll('[name=s_sheet__shown], [name=s_sheet__picture]')){
        el.checked = el.value === s_sheet__shown;
        // while a picture is matched, its sheet stays
        el.disabled = Boolean(o_match);
        el.parentElement.classList.toggle('has', el.name === 's_sheet__picture' && f_a_o_picture(el.value).length > 0);
    }
    for(let s_sheet of a_s_sheet){ document.getElementById(`el_sheet__${s_sheet}`).classList.toggle('shown', s_sheet === s_sheet__shown); }
    document.getElementById('el_shown_note').textContent = s_sheet__shown === 'back' ? 'as seen from the front' : '';
    try{ localStorage.setItem(`${s_key__storage}__page`, JSON.stringify({ s_step, s_sheet__shown, s_name__project })); } catch(o_error){ console.warn(o_error); }
    // while a picture is matched, what is on screen is neither saved nor replaced
    let el_project_box = document.getElementById('el_project_box');
    el_project_box.inert = Boolean(o_match);
    if(o_match){ el_project_box.open = false; }
    document.getElementById('el_home_open').disabled = Boolean(o_match);

    let o_form = f_o_setting__form();
    o_part.f_limit(o_form);
    let el_bad = [...el_panel.elements].find(function(el){ return el.name && !el.checkValidity(); });
    // what a field cannot say itself, its kind's part of the page says: that is about the pattern
    let s_bad = el_bad ? `${f_s_name(el_bad)}: ${el_bad.validationMessage}` : o_part.f_s_bad(o_form);
    let s_step__bad = el_bad ? el_bad.closest('.step').dataset.step : s_bad ? 'pattern' : '';
    for(let el of document.querySelectorAll('#el_step button')){
        if(el.dataset.step === s_step){ el.setAttribute('aria-current', 'step'); } else { el.removeAttribute('aria-current'); }
        el.classList.toggle('bad', el.dataset.step === s_step__bad);
    }
    for(let el of document.querySelectorAll('#el_print, [data-download]')){ el.disabled = Boolean(s_bad); }
    for(let el of document.querySelectorAll('[data-page]')){ el.disabled = Boolean(s_bad) || b_busy__page; }
    if(s_bad){
        document.getElementById('el_status').textContent = s_bad;
        o_panel__project.f_changed();
        return;
    }
    Object.assign(o_setting, o_form);
    try{ localStorage.setItem(s_key__storage, JSON.stringify(o_setting)); } catch(o_error){ console.warn(o_error); }
    // a sheet's only picture is the chosen one; of several the one clicked
    if(f_a_o_picture().length === 1){ n_idx__picture = 0; }
    if(!f_o_picture__chosen()){ n_idx__picture = null; }
    if(o_undo && !f_a_o_picture(o_undo.s_sheet).some(function(o_picture){ return o_picture.s_file === o_undo.s_file; })){ o_undo = null; }

    o_part.f_update();
    document.body.dataset.print = o_setting.s_print;
    // what a match is waiting for: points 'from' the picture, or the places they go 'to'
    if(o_match){ document.body.dataset.match = o_match.a_a_n__px.length < 4 ? 'from' : 'to'; } else { delete document.body.dataset.match; }
    el_stage.style.setProperty('--n_ratio__sheet', o_setting.n_mm__sheet_x / o_setting.n_mm__sheet_y);
    for(let s_sheet of a_s_sheet__kind){
        o_s_svg[s_sheet] = f_s_svg(o_setting, s_sheet);
        let el_sheet = document.getElementById(`el_sheet__${s_sheet}`);
        let el_svg = el_sheet.firstElementChild;
        el_svg.setAttribute('viewBox', `0 0 ${o_setting.n_mm__sheet_x} ${o_setting.n_mm__sheet_y}`);
        el_svg.setAttribute('width', `${o_setting.n_mm__sheet_x}mm`);
        el_svg.setAttribute('height', `${o_setting.n_mm__sheet_y}mm`);
        el_sheet.classList.toggle('has_picture', f_a_o_picture(s_sheet).length > 0);
        el_sheet.classList.toggle('matching', o_match?.s_sheet === s_sheet);
        // while a picture is matched, it is the only one of its sheet to be seen
        f_set_html(el_svg.querySelector('.picture'), f_s_picture__sheet(o_setting, s_sheet, o_s_url, o_match?.s_sheet === s_sheet ? n_idx__picture : null));
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
        f_set_html(el_svg.querySelector('.screen'), f_s_screen(s_sheet, n_mm__per_px, a_n__view));
    }

    // where the pattern lies, in the numbers a cutter's software asks for
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
    let a_s_file = a_s_sheet__kind.map(f_s_file);
    document.getElementById('el_file').textContent = 'In the cutter\'s software '
        + (a_s_file.length === 1 ? `the file: ${a_s_file[0]}.` : a_s_file[0] === a_s_file[1] ? `both files: ${a_s_file[0]}.` : `the front file: ${a_s_file[0]}; the back file: ${a_s_file[1]}.`);
    // the format's name follows the sheet's size, whichever way it was set
    let el_format = document.getElementById('el_format');
    let s_format = `${o_setting.n_mm__sheet_x} ${o_setting.n_mm__sheet_y}`;
    el_format.value = [...el_format.options].some(function(el){ return el.value === s_format; }) ? s_format : '';

    let a_o_picture = f_a_o_picture();
    let o_picture = f_o_picture__chosen();
    document.getElementById('el_picture_title').textContent = `Pictures${f_s_sheet(s_sheet__shown, ' of the ', ' sheet')}`;
    document.getElementById('el_picture').hidden = !o_picture || Boolean(o_match);
    let el_load = document.getElementById('el_picture_load');
    el_load.textContent = a_o_picture.length ? 'Add pictures' : 'Load pictures';
    el_load.classList.toggle('main', !a_o_picture.length);
    // while a picture is matched, the bar over the sheet says what to click, and the picture is no one else's
    el_load.disabled = Boolean(o_match);
    document.getElementById('el_picture_remove').disabled = !o_picture || Boolean(o_match);
    document.getElementById('el_crop').setAttribute('aria-pressed', String(b_crop));
    for(let el of document.querySelectorAll('[data-order]')){ el.disabled = a_o_picture.length < 2; }
    document.getElementById('el_matching').hidden = !o_match;
    document.getElementById('el_match_bar').hidden = !o_match;
    if(o_match){
        let n_from = o_match.a_a_n__px.length;
        let n_to = o_match.a_a_n__mm.length;
        document.getElementById('el_match_step').textContent = [
            n_from < 4 ? `Point ${n_from + 1} of 4: click it on the picture${f_s_sheet(o_match.s_sheet, ', on the ', ' sheet')}.`
                : n_to < 4 ? `Place ${n_to + 1} of 4: click where point ${n_to + 1} belongs on the cut pattern.` : '',
            o_match.s_message
        ].filter(Boolean).join(' ');
        document.getElementById('el_match_back').disabled = n_from === 0 || o_match.b_busy;
        document.getElementById('el_match_cancel').disabled = Boolean(o_match.b_busy);
    }
    // a match is taken back with the picture that came of it chosen
    let b_undo = Boolean(o_undo) && o_undo.s_sheet === s_sheet__shown && o_picture?.s_file === o_undo.s_file;
    document.getElementById('el_match_undo').hidden = !b_undo;
    document.getElementById('el_match_note').textContent = b_undo ? o_undo.s_note : '';
    let s_note__picture = a_o_picture.length === 0 ? 'None yet. Without a picture a print shows the sheet\'s cut lines.'
        : a_o_picture.length === 1 ? '' : `${a_o_picture.length} pictures${o_picture ? '; the chosen one:' : '. Click one on the sheet to place it.'}`;
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
        // its light and colour: a slider each, in % of the file's
        for(let s_name of a_s_name__look){
            let el = el_panel.elements[`look__${s_name}`];
            el.value = Math.round(o_picture[s_name] * 100);
            el.nextElementSibling.textContent = `${el.value} %`;
        }
        document.getElementById('el_look_plain').disabled = !f_b_look(o_picture);
        let [n_x, n_y] = f_a_n__size(o_picture);
        let n_dpi = f_n_dpi(o_picture);
        // stretched, it is finer one way than the other
        let [, , n_px__x, n_px__y] = f_a_n__px(o_picture);
        s_note__picture += `${s_note__picture && ' '}${Math.round(n_px__x)} × ${Math.round(n_px__y)} pixels, shown ${f_s(n_x)} × ${f_s(n_y)} mm: ${o_picture.n_ratio__stretch === 1 ? '' : 'at least '}${Math.round(n_dpi)} pixels per inch`
            + (n_dpi < 150 ? ', coarse in print; 300 is sharp.' : '.');
    }
    document.getElementById('el_picture_hint').textContent = [s_note__file, s_note__picture].filter(Boolean).join(' ');

    // print: a page is the sheet of paper, nothing around it; the shift's y points up, a page's down
    document.getElementById('el_style__page').textContent = `@page{ size: ${o_setting.n_mm__sheet_x}mm ${o_setting.n_mm__sheet_y}mm; margin: 0; }`
        + `@media print{ .sheet, .sheet > svg{ width: ${o_setting.n_mm__sheet_x}mm; height: ${o_setting.n_mm__sheet_y}mm; }`
        + ` .printed{ transform: translate(${o_setting.n_mm__print_x}px, ${-o_setting.n_mm__print_y}px); } }`;
    document.getElementById('el_print_note').textContent = `In the print dialog: paper ${f_s(o_setting.n_mm__sheet_x)} × ${f_s(o_setting.n_mm__sheet_y)} mm, scale 100 %, margins none; and no fitting to the page in the printer's own settings.`;
    let n_px__per_mm__page = f_n_px__per_mm__page();
    document.getElementById('el_page_note').textContent = `A file is one sheet's page of the print, with what is chosen under Print: the sheet of paper, ${f_s(o_setting.n_mm__sheet_x)} × ${f_s(o_setting.n_mm__sheet_y)} mm, `
        + `as a picture of ${Math.round(o_setting.n_mm__sheet_x * n_px__per_mm__page)} × ${Math.round(o_setting.n_mm__sheet_y * n_px__per_mm__page)} pixels, ${Math.round(n_px__per_mm__page * 25.4)} an inch. Print it at 100 %, without margins.`
        + (s_note__page ? ` ${s_note__page}` : '');

    let a_s_problem = f_a_s_problem(o_setting);
    document.getElementById('el_status').textContent = a_s_problem.slice(0, 4).join('\n')
        + (a_s_problem.length > 4 ? `\nand ${a_s_problem.length - 4} more` : '');
    o_panel__project.f_changed();
};

el_panel.addEventListener('input', function(o_event){
    let el = o_event.target;
    let v = el.tagName === 'SELECT' ? el.value : el.valueAsNumber;
    if(el.checkValidity() && v === v){
        f_o_part().f_input(el, v);
        let o_picture = f_o_picture__chosen();
        if(!o_picture){
            // the fields of a picture are there with one chosen only
        } else if(el.name.startsWith('picture__crop_')){
            f_set_chosen(f_o_picture__cut(o_picture, Number(el.name.slice(14)), v / 100));
        } else if(el.name === 'picture__stretch'){
            f_set_chosen({ ...o_picture, n_ratio__stretch: v / 100 });
        } else if(el.name.startsWith('look__')){
            f_set_chosen({ ...o_picture, [el.name.slice(6)]: v / 100 });
        } else if(el.name.startsWith('picture__')){
            f_set_chosen({ ...o_picture, [el.name.slice(9)]: v });
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
// A picture file taken in: kept in the browser's database under a name, s_file or a
// new one, and to be shown by an address. A picture of its size, to be placed; null for
// a file that is no picture.
let f_o_picture__of_file = async function(o_file, s_file = null){
    let s_url = URL.createObjectURL(o_file);
    let el_img = new Image();
    el_img.src = s_url;
    try{
        await el_img.decode();
        if(!el_img.naturalWidth || !el_img.naturalHeight){ throw new Error('no size'); }
    } catch(o_error){
        URL.revokeObjectURL(s_url);
        return null;
    }
    while(s_file === null || (s_file in o_s_url)){ s_file = `p${Math.random().toString(36).slice(2, 10)}`; }
    try{
        await f_v__stored('put', o_file, s_file);
    } catch(o_error){
        // without the database the picture is there until the page is left
        console.warn(o_error);
    }
    o_s_url[s_file] = s_url;
    return { ...f_o_picture(el_img.naturalWidth, el_img.naturalHeight), s_file };
};
// The files no picture shows any more leave the page and the browser's database; the one
// a match can be taken back to stays.
let f_drop_files = async function(){
    let a_s_file = a_s_sheet.flatMap(function(s_sheet){ return f_a_o_picture(s_sheet).map(function(o_picture){ return o_picture.s_file; }); });
    if(o_undo){ a_s_file.push(o_undo.o_picture.s_file); }
    for(let s_file of Object.keys(o_s_url)){
        if(a_s_file.includes(s_file)){ continue; }
        URL.revokeObjectURL(o_s_url[s_file]);
        delete o_s_url[s_file];
    }
    try{
        for(let s_file of await f_v__stored('getAllKeys')){
            if(!a_s_file.includes(s_file)){ await f_v__stored('delete', s_file); }
        }
    } catch(o_error){
        console.warn(o_error);
    }
};
document.getElementById('el_picture_load').addEventListener('click', function(){ document.getElementById('el_picture_file').click(); });
// Picture files chosen, one or many. The sheet's first picture lies over the pattern
// and its bleed; one more comes into the pattern's middle, a third of it at most;
// several at once come to lie where the pattern's kind has places for them, a
// calendar's on its windows, each as large as fits into its place.
document.getElementById('el_picture_file').addEventListener('change', async function(o_event){
    let a_o_file = [...o_event.target.files];
    o_event.target.value = '';
    if(!a_o_file.length){ return; }
    let a_o_picture__new = [];
    let a_s_name__bad = [];
    for(let o_file of a_o_file){
        let o_picture = await f_o_picture__of_file(o_file);
        if(o_picture){ a_o_picture__new.push(o_picture); } else { a_s_name__bad.push(o_file.name); }
    }
    let a_o_picture = f_a_o_picture();
    let a_a_n__spot = f_a_a_n__spot(o_setting, a_o_picture__new.length);
    let [n_x, n_y] = f_a_n__size__pattern(o_setting);
    a_o_picture__new.forEach(function(o_picture, n_idx){
        if(a_o_picture__new.length > 1){
            a_o_picture.push(f_o_picture__rounded(f_o_picture__fitted(o_picture, a_a_n__spot[n_idx], false)));
        } else if(a_o_picture.length){
            a_o_picture.push(f_o_picture__rounded(f_o_picture__fitted(o_picture, [n_x / 3, n_y / 3, 2 * n_x / 3, 2 * n_y / 3], false)));
        } else {
            a_o_picture.push(f_o_picture__fitted(o_picture, f_a_n__bleed(o_setting), true));
        }
    });
    // one picture added is the chosen one; of several the one clicked next
    if(a_o_picture__new.length){ n_idx__picture = a_o_picture__new.length === 1 ? a_o_picture.length - 1 : null; }
    s_note__file = a_s_name__bad.length === 0 ? '' : `${a_s_name__bad.join(', ')} ${a_s_name__bad.length === 1 ? 'is not a picture' : 'are not pictures'} this browser can show.`;
    f_update();
});
document.getElementById('el_picture_remove').addEventListener('click', async function(){
    if(!f_o_picture__chosen()){ return; }
    f_a_o_picture().splice(n_idx__picture, 1);
    n_idx__picture = null;
    s_note__file = '';
    f_update();
    await f_drop_files();
});
let f_n_deg = function(n_deg){ return ((n_deg + 180) % 360 + 360) % 360 - 180; };
let o_f_o_picture = {
    cover: function(o_picture){ return f_o_picture__fitted(o_picture, f_a_n__bleed(o_setting), true); },
    contain: function(o_picture){ return f_o_picture__fitted(o_picture, [0, 0, ...f_a_n__size__pattern(o_setting)], false); },
    spread: function(o_picture){ return f_o_picture__spread(o_picture, f_a_n__bleed(o_setting)); },
    turn_left: function(o_picture){ return { ...o_picture, n_deg: f_n_deg(o_picture.n_deg - 90) }; },
    turn_right: function(o_picture){ return { ...o_picture, n_deg: f_n_deg(o_picture.n_deg + 90) }; },
    flip_x: function(o_picture){ return { ...o_picture, b_flip_x: !o_picture.b_flip_x }; },
    flip_y: function(o_picture){ return { ...o_picture, b_flip_y: !o_picture.b_flip_y }; },
    // light and colour as its file has them
    plain: function(o_picture){ return { ...o_picture, ...Object.fromEntries(a_s_name__look.map(function(s_name){ return [s_name, 1]; })) }; }
};
document.getElementById('el_picture').addEventListener('click', function(o_event){
    let f_o_picture__changed = o_f_o_picture[o_event.target.dataset.picture];
    let s_order = o_event.target.dataset.order;
    let o_picture = f_o_picture__chosen();
    if(!o_picture || !(f_o_picture__changed || s_order)){ return; }
    if(s_order){
        // over or under all other pictures of its sheet
        let a_o_picture = f_a_o_picture();
        a_o_picture.splice(n_idx__picture, 1);
        n_idx__picture = s_order === 'front' ? a_o_picture.length : 0;
        a_o_picture.splice(n_idx__picture, 0, o_picture);
    } else {
        f_set_chosen(f_o_picture__changed(o_picture));
    }
    f_update();
});
document.getElementById('el_crop').addEventListener('click', function(){
    b_crop = !b_crop;
    f_update();
});
// The chosen picture split into pieces, each a picture of its own where it lay; the
// first of them is the chosen one, so that its frame shows that there are pieces now.
document.getElementById('el_split').addEventListener('click', function(){
    let o_picture = f_o_picture__chosen();
    let [n_column, n_row] = [el_panel.elements.split__n_column.valueAsNumber, el_panel.elements.split__n_row.valueAsNumber];
    if(!o_picture || !(n_column >= 1 && n_row >= 1)){ return; }
    let a_o_piece = f_a_o_picture__split(o_picture, n_column, n_row).map(f_o_picture__rounded);
    f_a_o_picture().splice(n_idx__picture, 1, ...a_o_piece);
    if(o_undo?.s_file === o_picture.s_file){ o_undo = null; }
    s_note__file = a_o_piece.length === 1 ? 'One piece is the picture as it was.' : `Split into ${a_o_piece.length} pictures: drag each to its place.`
        + (a_o_piece.length < n_column * n_row ? ' More would be smaller than 5 mm.' : '');
    f_update();
});

// Matching by four points. The picture is first fitted into the pattern, so that all of
// it can be clicked; then four clicks on it, four on the cut pattern, and it is laid anew.
document.getElementById('el_match').addEventListener('click', function(){
    let o_picture = f_o_picture__chosen();
    o_match = { s_sheet: s_sheet__shown, a_a_n__px: [], a_a_n__mm: [], o_picture, a_n__next: null, s_message: '', b_busy: false };
    f_set_chosen(f_o_picture__fitted(o_picture, [0, 0, ...f_a_n__size__pattern(o_setting)], false));
    f_update();
});
let f_cancel_match = function(){
    if(!o_match || o_match.b_busy){ return; }
    f_set_chosen(o_match.o_picture);
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
// The place a click at a_n, in the pattern's mm, means while matching: null beside the
// picture as long as its points are asked for, then the cut pattern's nearest place
// within reach, or with b_free just where it is.
let f_a_n__match = function(a_n, b_free){
    let o_picture = f_o_picture__chosen();
    if(o_match.a_a_n__px.length < 4){
        let a_n__px = f_a_n__to_px(o_picture, a_n);
        let [n_x, n_y, n_px__x, n_px__y] = f_a_n__px(o_picture);
        return a_n__px[0] >= n_x && a_n__px[1] >= n_y && a_n__px[0] <= n_x + n_px__x && a_n__px[1] <= n_y + n_px__y ? a_n : null;
    }
    if(b_free){ return a_n; }
    let n_mm__per_px = o_setting.n_mm__sheet_x / document.getElementById(`el_sheet__${o_match.s_sheet}`).firstElementChild.getBoundingClientRect().width;
    return f_a_n__snapped(a_n, f_a_a_n__anchor(o_setting), n_px__snap * n_mm__per_px);
};
// A picture laid anew by four points, a_a_n__px in its file and a_a_n__mm their
// places on the pattern: a new picture file over the pattern and its bleed, its
// place, and whether the old picture reached everywhere.
let f_o_matched = async function(o_picture, a_a_n__px, a_a_n__mm){
    let el_img = new Image();
    el_img.src = o_s_url[o_picture.s_file];
    await el_img.decode();
    // what is left of the file, and the points counted from that part's corner
    let [n_x, n_y, n_px__x, n_px__y] = f_a_n__px(o_picture);
    let a_a_n__part = a_a_n__px.map(function(a_n){ return [a_n[0] - n_x, a_n[1] - n_y]; });
    // the new picture's pixels: as fine as the old picture comes to lie in the pattern's
    // middle, a third of what a print shows at least and no finer than that; the same
    // along x and y, so the last row may reach a little over the bleed
    let [n_left, n_top, n_right, n_bottom] = f_a_n__bleed(o_setting);
    let n_px__per_mm__old = f_n_px__per_mm(f_a_n_h(a_a_n__mm, a_a_n__part), f_a_n__size__pattern(o_setting).map(function(n){ return n / 2; }));
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
        a_a_n__px.push(f_a_n__to_px(f_o_picture__chosen(), a_n));
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
        let o_matched = await f_o_matched(f_o_picture__chosen(), a_a_n__px, a_a_n__mm);
        let o_picture__file = await f_o_picture__of_file(o_matched.o_file);
        // laid anew from the file as it is: its light and colour stay with the picture
        f_set_chosen({ ...o_matched.o_picture, s_file: o_picture__file.s_file, ...Object.fromEntries(a_s_name__look.map(function(s_name){ return [s_name, o_match.o_picture[s_name]]; })) });
        o_undo = {
            s_sheet, s_file: o_picture__file.s_file, o_picture: o_match.o_picture,
            s_note: `Matched by four points${o_matched.b_covered ? '.' : `; the picture does not reach all of the ${f_o_kind__shown().s_noun}, which stays blank where it ends.`}`
        };
        o_match = null;
        f_update();
        await f_drop_files();
    } catch(o_error){
        console.warn(o_error);
        o_match.b_busy = false;
        o_match.s_message = 'The picture could not be laid anew. Take a point back, or cancel.';
        f_update();
    }
};
document.getElementById('el_match_undo').addEventListener('click', async function(){
    // the chosen picture is the one that came of the match: the one it was takes its place again
    f_set_chosen(o_undo.o_picture);
    o_undo = null;
    f_update();
    await f_drop_files();
});

// ---- the saved projects, see project.module.js. What is on screen stays in this
// browser as before; a project is that, saved under a name by the app's server.

// Puts settings on screen, a saved project's with its pictures' files, s_name its
// name, or those of a new one, null, which has no pictures.
let f_show_design = async function(o_design, s_name){
    // the files first: if the server does not answer, the screen stays as it is
    let a_s_file = [...new Set(a_s_sheet.flatMap(function(s_sheet){ return o_design.o_setting[`a_o_picture__${s_sheet}`].map(function(o_picture){ return o_picture.s_file; }); }))];
    let a_o_file = [];
    for(let s_file of a_s_file){
        let o_response = await f_o_response__server(`${f_s_url__project(s_name)}/${encodeURIComponent(s_file)}`);
        if(o_response.ok){ a_o_file.push(await o_response.blob()); }
        else if(o_response.status === 404){ a_o_file.push(null); }
        else { throw new Error('A picture of the project could not be read.'); }
    }
    // the files that were on screen leave; the project's come under the names it has for them
    for(let s_file of Object.keys(o_s_url)){
        URL.revokeObjectURL(o_s_url[s_file]);
        delete o_s_url[s_file];
    }
    for(let n_idx = 0; n_idx < a_s_file.length; n_idx++){
        if(a_o_file[n_idx]){ await f_o_picture__of_file(a_o_file[n_idx], a_s_file[n_idx]); }
    }
    // the settings, their kind's part of the page and the form's fields without a wait
    // between them: drawn in between, the page would read the new settings from the
    // fields of the old
    o_setting = o_design.o_setting;
    n_idx__picture = null;
    o_undo = null;
    s_note__file = '';
    b_file__unsaved = false;
    // a picture without its file, or with a file that is no picture, is of no use
    for(let s_sheet of a_s_sheet){
        o_setting[`a_o_picture__${s_sheet}`] = f_a_o_picture(s_sheet).filter(function(o_picture){ return o_s_url[o_picture.s_file]; });
    }
    // a design that comes on screen is what the page shows, from the home page too
    f_set_home(false);
    f_place_kind();
    f_fill_form();
    f_update();
    await f_drop_files();
};
// A project keeps its pictures' files beside its settings. The server says which of
// them it has not got: those are sent.
let f_save_files = async function(o_saved){
    b_file__unsaved = true;
    for(let s_file of o_saved.a_s_file__missing){
        if(!o_s_url[s_file]){ continue; }
        let o_response = await f_o_response__server(`${f_s_url__project(o_saved.s_name)}/${encodeURIComponent(s_file)}`, { method: 'PUT', body: await (await fetch(o_s_url[s_file])).blob() });
        if(!o_response.ok){ throw new Error((await o_response.json()).s_message); }
    }
    b_file__unsaved = false;
};
// A saved project in a few words: its kind, what it is in a few numbers, its pictures.
let f_s_summary = function(o_project){
    let o = f_o_setting__kept(o_project.o_setting);
    let a_s = a_s_sheet.filter(function(s_sheet){ return o[`a_o_picture__${s_sheet}`].length; }).map(function(s_sheet){ return `${o[`a_o_picture__${s_sheet}`].length} ${s_sheet}`; });
    let o_kind = f_o_kind(o.s_kind);
    return `${o_kind.s_name} · ${o_kind.f_s_summary(o)}`
        + (a_s.length ? ` · pictures: ${o_kind.a_o_sheet.length > 1 ? a_s.join(', ') : o.a_o_picture__front.length}` : '');
};

// ---- the home page: what is on screen, a new project of each kind, the saved projects.
// A card for each: the pattern in small, its first sheet with its lines, a name and a
// line about it.
let f_el__card = function(o, s_name, s_about, f_on_click){
    let el_card = el('button', { type: 'button', className: 'card' }, [el('b', { textContent: s_name }), el('small', { textContent: s_about })]);
    // without the names the lines have in a cutting file: on this page those are the sheets' lines
    el_card.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 ${o.n_mm__sheet_x} ${o.n_mm__sheet_y}" aria-hidden="true">`
        + `${f_s_line__sheet({ ...o, b_print_guide: false }, f_o_kind(o.s_kind).a_o_sheet[0].s_sheet).replace(/ id="[^"]*"/g, '')}</svg>`);
    el_card.addEventListener('click', f_on_click);
    return el('li', {}, [el_card]);
};
// o_state: what the projects' panel has, see project.module.js.
let f_draw_home = function(o_state){
    // what is on screen, to go on with: a saved project, or one that is more than new
    let b_screen = o_state.s_name__open !== null || o_state.b_dirty;
    document.getElementById('el_home_screen').hidden = !b_screen;
    document.getElementById('el_home_now').replaceChildren(...(b_screen ? [f_el__card(
        o_setting, o_state.s_name__open ?? 'Not saved yet',
        f_s_summary({ o_setting }) + (o_state.s_name__open !== null && o_state.b_dirty ? ' · unsaved changes' : ''),
        function(){
            f_set_home(false);
            f_update();
        }
    )] : []));
    document.getElementById('el_home_kind').replaceChildren(...a_o_kind.map(function(o_kind, n_idx){
        return f_el__card(f_o_setting__default(o_kind.s_kind), o_kind.s_name, o_kind.s_about, function(){ o_panel__project.f_new(n_idx); });
    }));
    document.getElementById('el_home_note').textContent = o_state.s_note || (o_state.a_o_project.length ? '' : 'None yet. Project, in the bar of a project on screen, saves it under a name.');
    document.getElementById('el_home_project').replaceChildren(...o_state.a_o_project.map(function(o_project){
        return f_el__card(f_o_setting__kept(o_project.o_setting), o_project.s_name, f_s_summary(o_project), function(){
            // the open one as it is on screen: there is nothing to open
            if(o_project.s_name === o_state.s_name__open && !o_state.b_dirty){
                f_set_home(false);
                f_update();
            } else {
                o_panel__project.f_open(o_project.s_name);
            }
        });
    }));
};
// The view follows the address: after Home in the bar, and after the browser's back and
// forward. Coming home ends a match.
let f_show_view = function(){
    if(f_b_home()){ f_cancel_match(); }
    f_update();
};
document.getElementById('el_home_open').addEventListener('click', function(){
    f_set_home(true);
    f_show_view();
});
window.addEventListener('popstate', f_show_view);

let o_panel__project = f_o_panel__project({
    el_box: document.getElementById('el_project_box'),
    el_title: document.getElementById('el_project_title'),
    el_root: document.getElementById('el_project'),
    f_o_design: function(){ return { o_setting }; },
    // a new project of the kind on screen
    f_o_design__blank: function(){ return { o_setting: f_o_setting__kept({ s_kind: o_setting.s_kind }) }; },
    // what a new project can be: the kinds of pattern
    a_o_new: a_o_kind.map(function(o_kind){ return { s_name: o_kind.s_name, s_about: o_kind.s_about }; }),
    f_o_design__of_project: function(o_project){ return { o_setting: f_o_setting__kept(o_project.o_setting) }; },
    f_open_design: function(o_project){ return f_show_design({ o_setting: f_o_setting__kept(o_project.o_setting) }, o_project.s_name); },
    // a new project, of the kind chosen by its place in a_o_new, starts with that kind's
    // settings of the first start, at the first step
    f_new_design: async function(n_idx){
        // the step first: the project comes on screen at it, and a press that follows at once is not taken back
        s_step = 'paper';
        s_sheet__shown = 'front';
        el_panel.scrollTop = 0;
        await f_show_design({ o_setting: f_o_setting__kept({ s_kind: a_o_kind[n_idx].s_kind }) }, null);
    },
    f_save_extra: f_save_files,
    f_b_extra_dirty: function(){ return b_file__unsaved; },
    f_s_summary,
    f_b_ready: function(){ return !o_match; },
    f_opened: function(s_name){
        s_name__project = s_name;
        f_update();
    },
    el_ask: document.getElementById('el_home_ask'),
    // the panel opens to say something: it is in the bar of the project on screen
    f_show: function(){
        f_set_home(false);
        f_update();
    },
    f_listed: function(o_state){
        if(f_b_home()){ f_draw_home(o_state); }
    }
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
        n_idx__picture = null;
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
// The lines' legend and the projects close with a press beside them.
window.addEventListener('pointerdown', function(o_event){
    for(let s_id of ['el_legend_box', 'el_project_box']){
        let el_box = document.getElementById(s_id);
        if(!el_box.contains(o_event.target)){ el_box.open = false; }
    }
});

// Where the pointer is on a sheet, in the pattern's mm.
let f_a_n__mm = function(o_event, s_sheet){
    let o_rect = document.getElementById(`el_sheet__${s_sheet}`).firstElementChild.getBoundingClientRect();
    let n_mm__per_px = o_setting.n_mm__sheet_x / o_rect.width;
    let [n_x, n_y] = f_a_n__pattern(o_setting);
    return [(o_event.clientX - o_rect.left) * n_mm__per_px - n_x, (o_event.clientY - o_rect.top) * n_mm__per_px - n_y];
};
// Step 'pattern': what the kind's part of the page does with a press, a calendar's
// chooses a window and lets a drag move it.
// Step 'picture': a press on a picture chooses it, the topmost under the pointer, and a
// drag moves it; a drag of one of the chosen picture's handles sizes, stretches, skews,
// turns or crops it, see the pointer's move. In the other steps the pointer moves nothing.
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
        let el_handle = o_event.target.closest('.handle');
        if(!el_handle){
            // beside all pictures: none chosen
            let a_o_picture = f_a_o_picture();
            n_idx__picture = null;
            for(let n_idx = a_o_picture.length - 1; n_idx >= 0 && n_idx__picture === null; n_idx--){
                if(f_f_b__in(a_o_picture[n_idx])(a_n)){ n_idx__picture = n_idx; }
            }
        }
        let o_picture = f_o_picture__chosen();
        if(o_picture){
            // the handle that turns has no place on the frame
            let a_n__sign = el_handle?.dataset.sign ? el_handle.dataset.sign.split(',').map(Number) : null;
            // a handle is rarely taken by its middle: what the pointer is off, it stays off
            let a_n__handle = a_n__sign ? f_a_n__handle(o_picture, a_n__sign) : a_n;
            o_drag = { s_sheet, n_idx: n_idx__picture, o_picture, a_n__sign, b_turn: Boolean(el_handle) && !a_n__sign, a_n__pointer: a_n, a_n__off: [a_n[0] - a_n__handle[0], a_n[1] - a_n__handle[1]] };
            o_event.preventDefault();
        }
    } else if(s_step === 'pattern'){
        o_drag = f_o_part().f_o_drag(o_event, s_sheet, a_n);
    }
    f_update();
    if(o_drag?.f_taken){ o_drag.f_taken(); }
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
        // the sides the handle sits on: a side's own, a corner's two
        let a_s_side = o_drag.a_n__sign ? [o_drag.a_n__sign[0] && (o_drag.a_n__sign[0] < 0 ? 'left' : 'right'), o_drag.a_n__sign[1] && (o_drag.a_n__sign[1] < 0 ? 'top' : 'bottom')].filter(Boolean) : [];
        let f_o_picture__by_sides = function(f_o_picture__by_side){
            return a_s_side.reduce(function(o_picture, s_side){ return f_o_picture__by_side(o_picture, s_side, a_n__on); }, o_drag.o_picture);
        };
        if(o_drag.b_turn){
            // the ring: turned, with Shift in steps of 15 degrees
            o_picture = f_o_picture__turned(o_drag.o_picture, o_drag.a_n__pointer, a_n);
            o_picture.n_deg = f_n_deg(o_event.shiftKey ? Math.round(o_picture.n_deg / 15) * 15 : o_picture.n_deg);
        } else if(!o_drag.a_n__sign){
            o_picture = { ...o_drag.o_picture, n_mm__x: o_drag.o_picture.n_mm__x + a_n[0] - o_drag.a_n__pointer[0], n_mm__y: o_drag.o_picture.n_mm__y + a_n[1] - o_drag.a_n__pointer[1] };
        } else if(b_crop){
            // with Crop on every handle cuts off, a corner's at both its sides
            o_picture = f_o_picture__by_sides(f_o_picture__cropped);
        } else if(a_s_side.length === 1){
            // a side: stretched, with Ctrl skewed
            o_picture = f_o_picture__by_sides(o_event.ctrlKey || o_event.metaKey ? f_o_picture__skewed : f_o_picture__stretched);
        } else if(o_event.shiftKey){
            // a corner with Shift: both its sides follow the pointer, out of the picture's shape
            o_picture = f_o_picture__by_sides(f_o_picture__stretched);
        } else {
            o_picture = f_o_picture__resized(o_drag.o_picture, o_drag.a_n__sign, a_n__on);
        }
        f_a_o_picture(o_drag.s_sheet)[o_drag.n_idx] = f_o_picture__rounded(o_picture);
        f_update();
        return;
    }
    // a part of the pattern, taken in its step
    o_drag.f_move(a_n);
});
for(let s_event of ['pointerup', 'pointercancel']){
    window.addEventListener(s_event, function(){ o_drag = null; });
}
// Ctrl and the wheel, or two fingers spread on a touchpad, size the chosen picture under
// the pointer: its handles may lie far outside the sheet.
el_stage.addEventListener('wheel', function(o_event){
    let s_sheet = o_event.target.closest('.sheet')?.dataset.sheet;
    if(s_step !== 'picture' || o_match || !o_event.ctrlKey || !s_sheet || !f_o_picture__chosen()){ return; }
    o_event.preventDefault();
    let o_picture = f_o_picture__scaled(f_o_picture__chosen(), Math.exp(-o_event.deltaY / 1000), f_a_n__mm(o_event, s_sheet));
    for(let s_name of ['n_mm__x', 'n_mm__y', 'n_mm__size_x']){ o_picture[s_name] = Math.round(o_picture[s_name] * 100) / 100; }
    f_set_chosen(o_picture);
    f_update();
}, { passive: false });

document.getElementById('el_print').addEventListener('click', function(){ window.print(); });
let f_download = function(o_blob, s_name){
    let el_a = document.createElement('a');
    el_a.href = URL.createObjectURL(o_blob);
    el_a.download = s_name;
    el_a.click();
    setTimeout(function(){ URL.revokeObjectURL(el_a.href); }, 1000);
};
// the cutting files' buttons, one for each sheet of the pattern, see f_place_kind
document.getElementById('el_download').addEventListener('click', function(o_event){
    let s_sheet = o_event.target.dataset.download;
    if(s_sheet){ f_download(new Blob([o_s_svg[s_sheet]], { type: 'image/svg+xml' }), `${f_s_file__name(s_sheet)}.svg`); }
});

// A sheet's page of the print as a file, a PDF or a PNG. The browser draws the page's
// SVG; the pictures' files go into it as text, each once, since an SVG drawn as a
// picture sees no other file.
let f_el_canvas__page = async function(s_sheet){
    let o_s_href = {};
    for(let { s_file } of f_a_o_picture(s_sheet)){
        if(s_file in o_s_href || !o_s_url[s_file]){ continue; }
        let o_file = await (await fetch(o_s_url[s_file])).blob();
        o_s_href[s_file] = await new Promise(function(f_resolve, f_reject){
            let o_reader = new FileReader();
            o_reader.onload = function(){ f_resolve(o_reader.result); };
            o_reader.onerror = function(){ f_reject(o_reader.error); };
            o_reader.readAsDataURL(o_file);
        });
    }
    let s_url = URL.createObjectURL(new Blob([f_s_svg__page(o_setting, s_sheet, o_s_href, f_n_px__per_mm__page())], { type: 'image/svg+xml' }));
    try{
        let el_img = new Image();
        await new Promise(function(f_resolve, f_reject){
            el_img.onload = f_resolve;
            el_img.onerror = f_reject;
            el_img.src = s_url;
        });
        let el_canvas = document.createElement('canvas');
        el_canvas.width = el_img.naturalWidth;
        el_canvas.height = el_img.naturalHeight;
        el_canvas.getContext('2d').drawImage(el_img, 0, 0);
        return el_canvas;
    } finally {
        URL.revokeObjectURL(s_url);
    }
};
let f_o_blob__page = async function(s_sheet, s_type){
    let el_canvas = await f_el_canvas__page(s_sheet);
    if(s_type === 'png'){
        let o_blob = await new Promise(function(f_resolve){ el_canvas.toBlob(f_resolve, 'image/png'); });
        return new Blob([f_a_n__png_sized(new Uint8Array(await o_blob.arrayBuffer()), el_canvas.width / o_setting.n_mm__sheet_x)], { type: 'image/png' });
    }
    // the PDF holds the same pixels, without loss: red, green and blue of each, packed
    let a_n__rgba = el_canvas.getContext('2d').getImageData(0, 0, el_canvas.width, el_canvas.height).data;
    let a_n__rgb = new Uint8Array(a_n__rgba.length / 4 * 3);
    for(let n_at = 0, n_to = 0; n_at < a_n__rgba.length; n_at += 4, n_to += 3){
        a_n__rgb[n_to] = a_n__rgba[n_at];
        a_n__rgb[n_to + 1] = a_n__rgba[n_at + 1];
        a_n__rgb[n_to + 2] = a_n__rgba[n_at + 2];
    }
    let a_n__flate = new Uint8Array(await new Response(new Blob([a_n__rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    return new Blob(f_a_v__pdf({ n_mm__x: o_setting.n_mm__sheet_x, n_mm__y: o_setting.n_mm__sheet_y, n_px__x: el_canvas.width, n_px__y: el_canvas.height, a_n__flate }), { type: 'application/pdf' });
};
document.getElementById('el_page').addEventListener('click', async function(o_event){
    let el = o_event.target.closest('[data-page]');
    if(el){
        b_busy__page = true;
        s_note__page = 'Making the file …';
        f_update();
        // the words first, then the work
        await new Promise(function(f_resolve){ setTimeout(f_resolve, 30); });
        try{
            f_download(await f_o_blob__page(el.dataset.page, el.dataset.type), `${f_s_file__name(el.dataset.page)}.${el.dataset.type}`);
            s_note__page = '';
        } catch(o_error){
            console.warn(o_error);
            s_note__page = 'The file could not be made.';
        }
        b_busy__page = false;
        f_update();
    }
});

// the kind's part of the page and the fields first: from here on the page can be drawn
// at any time, as while the pictures' files are fetched
f_place_kind();
f_fill_form();
// A picture without its file is of no use: the file may be gone with the browser's data.
for(let s_sheet of a_s_sheet){
    for(let { s_file } of f_a_o_picture(s_sheet)){
        if(s_file in o_s_url){ continue; }
        let o_file = await f_v__stored('get', s_file).catch(function(o_error){ console.warn(o_error); });
        if(o_file){ o_s_url[s_file] = URL.createObjectURL(o_file); }
    }
    o_setting[`a_o_picture__${s_sheet}`] = f_a_o_picture(s_sheet).filter(function(o_picture){ return o_s_url[o_picture.s_file]; });
}
f_update();
// the saved projects come when the server answers; the page does not wait for them
o_panel__project.f_start(s_name__project);
