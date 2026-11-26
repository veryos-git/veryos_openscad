// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The page: the settings' form, both sheets as they are drawn and printed, the pointer
// on them, and the pictures' files.

import { o_setting__default, n_mm__line, f_a_o_window, f_o_door, f_a_s_problem, f_s_d, f_s_svg, f_a_n__box__file } from './calendar.module.js';
import { a_s_side, f_o_picture, f_a_n__size, f_n_dpi, f_a_n__handle, f_o_picture__fitted, f_o_picture__resized, f_o_picture__scaled, f_o_picture__cut, f_o_picture__cropped } from './picture.module.js';
import { f_a_n__calendar, f_a_n__distance, f_a_n__bleed, f_a_s_problem__sheet, f_s_picture__sheet, f_s_line__sheet } from './sheet.module.js';

let s_key__storage = 'paper_advent_calendar';
let a_s_sheet = ['front', 'back'];
let a_s_name__own = ['n_mm__x', 'n_mm__y', 'n_mm__size_x', 'n_mm__size_y', 's_shape', 's_door'];
let a_s_name__picture = ['n_mm__x', 'n_mm__y', 'n_mm__size_x', 'n_deg'];
// a picture's handles: where on its frame, -1, 0 or 1 along x and y; corners size it, sides cut it off
let a_a_n__sign = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, 0], [0, -1], [1, 0], [0, 1]];
let n_px__handle = 6;
// a picture's frame and handles show this far around their sheet of paper and no further: not on the other sheet
let n_px__around = 20;
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
// what the pointer moves on the sheets: 'window' or 'picture'
let s_mode = 'window';
// the sheet whose picture the panel shows
let s_sheet__picture = 'front';
// the pictures' files as addresses the page can show, '' without one
let o_s_url = { front: '', back: '' };
// what is being dragged: a window, or a sheet's picture as it was when taken
let o_drag = null;
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
        else if(typeof v === 'string'){ o[s_name] = a_el[0].value; }
        else { o[s_name] = a_el[0].valueAsNumber; }
    }
    return o;
};
let f_s = function(n){ return String(+n.toFixed(2)); };
// Sets what an element holds, if it holds something else: a picture left alone is not loaded anew.
let f_set_html = function(el, s_html){
    if(el.s_html !== s_html){
        el.innerHTML = s_html;
        el.s_html = s_html;
    }
};

// What only the screen shows of a sheet, as SVG: the printer's margin, where the windows
// open, and what the pointer takes hold of.
let f_s_screen = function(s_sheet, a_o_door, n_mm__per_px){
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
    if(s_sheet === 'front' && s_mode === 'window'){
        a_s.push(...a_o_door.map(function(o_door, n_idx){
            return `<path class="hit${n_idx === n_idx__selected ? ' selected' : ''}" data-idx="${n_idx}" d="${f_s_d(o_door.a_o_seg__opening)} Z"/>`;
        }));
    }
    a_s.push('</g>');
    let o_picture = o_setting[`o_picture__${s_sheet}`];
    if(s_mode === 'picture' && s_sheet === s_sheet__picture && o_picture && o_s_url[s_sheet]){
        let n_around = n_px__around * n_mm__per_px;
        a_s.push(`<clipPath id="${s_sheet}_around"><rect x="${-n_around}" y="${-n_around}" width="${o_setting.n_mm__sheet_x + 2 * n_around}" height="${o_setting.n_mm__sheet_y + 2 * n_around}"/></clipPath>`);
        a_s.push(`<g clip-path="url(#${s_sheet}_around)"><g transform="translate(${f_a_n__calendar(o_setting).join(' ')})">`);
        a_s.push(`<polygon class="frame" points="${a_a_n__sign.slice(0, 4).map(function(a_n__sign){ return f_a_n__handle(o_picture, a_n__sign).join(','); }).join(' ')}"/>`);
        a_s.push(...a_a_n__sign.map(function(a_n__sign){
            let [n_x, n_y] = f_a_n__handle(o_picture, a_n__sign);
            return `<circle class="handle${a_n__sign.includes(0) ? ' side' : ''}" data-sign="${a_n__sign.join(',')}" cx="${n_x}" cy="${n_y}" r="${n_px__handle * n_mm__per_px}"/>`;
        }));
        a_s.push('</g></g>');
    }
    return a_s.join('');
};

let f_update = function(){
    let o_form = f_o_setting__form();
    el_panel.elements.n_mm__margin.max = Math.floor(Math.min(o_form.n_mm__calendar_x, o_form.n_mm__calendar_y) / 2 - 1);
    let el_bad = [...el_panel.elements].find(function(el){ return el.name && !el.checkValidity(); });
    let s_bad = el_bad ? `${el_bad.closest('label').textContent.trim()}: ${el_bad.validationMessage}` : '';
    if(!s_bad && !o_form.a_s_shape.length){ s_bad = 'Shapes: tick one at least'; }
    if(!s_bad && !o_form.a_s_door.length){ s_bad = 'Doors: tick one at least'; }
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
    document.body.dataset.mode = s_mode;
    document.body.dataset.print = o_setting.s_print;
    el_stage.style.setProperty('--n_ratio__sheet', o_setting.n_mm__sheet_x / o_setting.n_mm__sheet_y);
    for(let s_sheet of a_s_sheet){
        o_s_svg[s_sheet] = f_s_svg(o_setting, s_sheet);
        let el_sheet = document.getElementById(`el_sheet__${s_sheet}`);
        let el_svg = el_sheet.firstElementChild;
        el_svg.setAttribute('viewBox', `0 0 ${o_setting.n_mm__sheet_x} ${o_setting.n_mm__sheet_y}`);
        el_svg.setAttribute('width', `${o_setting.n_mm__sheet_x}mm`);
        el_svg.setAttribute('height', `${o_setting.n_mm__sheet_y}mm`);
        el_sheet.classList.toggle('has_picture', Boolean(o_setting[`o_picture__${s_sheet}`] && o_s_url[s_sheet]));
        f_set_html(el_svg.querySelector('.picture'), f_s_picture__sheet(o_setting, s_sheet, o_s_url[s_sheet]));
        f_set_html(el_svg.querySelector('.line'), f_s_line__sheet(o_setting, s_sheet));
        // the handles keep their size on the screen whatever the sheet's
        let n_px = el_svg.getBoundingClientRect().width;
        f_set_html(el_svg.querySelector('.screen'), f_s_screen(s_sheet, a_o_door, n_px ? o_setting.n_mm__sheet_x / n_px : 0.3));
    }

    // where the calendar lies, in the numbers a cutter's software asks for
    let a_n = f_a_n__distance(o_setting);
    let f_s_file = function(s_sheet){
        let a_n__box = f_a_n__box__file(o_setting, s_sheet);
        if(!a_n__box){ return 'empty'; }
        let a_n__file = f_a_n__distance(o_setting, a_n__box);
        return `${f_s(a_n__box[2] - a_n__box[0])} × ${f_s(a_n__box[3] - a_n__box[1])} mm, ${f_s(a_n__file[0])} from the sheet's left, ${f_s(a_n__file[1])} from its bottom`;
    };
    document.getElementById('el_place').textContent = `${f_s(a_n[2])} from the sheet's right, ${f_s(a_n[3])} from its top. In the cutter's software `
        + (f_s_file('front') === f_s_file('back') ? `both files: ${f_s_file('front')}.` : `the front file: ${f_s_file('front')}; the back file: ${f_s_file('back')}.`);

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
            + `<path stroke="#000000" d="${o_door.a_a_o_seg__cut.map(f_s_d).join(' ')}"/>`
            + `<path stroke="#0000ff" d="${o_door.a_a_o_seg__fold.map(f_s_d).join(' ')}"/></g>`;
    }

    let o_picture = o_s_url[s_sheet__picture] ? o_setting[`o_picture__${s_sheet__picture}`] : null;
    document.getElementById('el_picture_sheet').value = s_sheet__picture;
    document.getElementById('el_picture').hidden = !o_picture;
    document.getElementById('el_picture_hint').hidden = Boolean(o_picture);
    document.getElementById('el_picture_remove').disabled = !o_picture;
    for(let el of document.querySelectorAll('[name=s_mode]')){ el.checked = el.value === s_mode; }
    if(o_picture){
        for(let s_name of a_s_name__picture){
            let el = el_panel.elements[`picture__${s_name}`];
            if(el !== document.activeElement){ el.value = f_s(o_picture[s_name]); }
        }
        o_picture.a_n_ratio__crop.forEach(function(n_ratio, n_idx){
            let el = el_panel.elements[`picture__crop_${n_idx}`];
            if(el !== document.activeElement){ el.value = f_s(n_ratio * 100); }
        });
        let [n_x, n_y] = f_a_n__size(o_picture);
        let n_dpi = f_n_dpi(o_picture);
        document.getElementById('el_picture_info').textContent = `${o_picture.n_px__x} × ${o_picture.n_px__y} pixels, shown ${f_s(n_x)} × ${f_s(n_y)} mm: ${Math.round(n_dpi)} pixels per inch`
            + (n_dpi < 150 ? ', coarse in print; 300 is sharp.' : '.');
    }

    // print: a page is the sheet of paper, nothing around it; the shift's y points up, a page's down
    document.getElementById('el_style__page').textContent = `@page{ size: ${o_setting.n_mm__sheet_x}mm ${o_setting.n_mm__sheet_y}mm; margin: 0; }`
        + `@media print{ .sheet, .sheet > svg{ width: ${o_setting.n_mm__sheet_x}mm; height: ${o_setting.n_mm__sheet_y}mm; }`
        + ` .printed{ transform: translate(${o_setting.n_mm__print_x}px, ${-o_setting.n_mm__print_y}px); } }`;

    let n_row = Math.ceil(o_setting.n_window / o_setting.n_column);
    document.getElementById('el_size').textContent = `${o_setting.n_window} windows in ${n_row} ${n_row === 1 ? 'row' : 'rows'}, `
        + `${f_s((o_setting.n_mm__calendar_x - 2 * o_setting.n_mm__margin) / o_setting.n_column)} × ${f_s((o_setting.n_mm__calendar_y - 2 * o_setting.n_mm__margin) / n_row)} mm from one to the next. `
        + `${a_o_door.reduce(function(n, o_door){ return n + o_door.a_a_o_seg__cut.length - o_door.a_a_o_seg__chain.length; }, 0)} bridges.`;
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
            o_setting[`o_picture__${s_sheet__picture}`] = f_o_picture__cut(o_setting[`o_picture__${s_sheet__picture}`], Number(el.name.slice(14)), v / 100);
        } else if(el.name.startsWith('picture__')){
            o_setting[`o_picture__${s_sheet__picture}`] = { ...o_setting[`o_picture__${s_sheet__picture}`], [el.name.slice(9)]: v };
        }
    }
    f_update();
});
document.getElementById('el_shuffle').addEventListener('click', function(){
    o_setting.n_seed++;
    f_update();
});
document.getElementById('el_own_reset').addEventListener('click', function(){
    delete o_setting.a_o_window__own[n_idx__selected];
    f_update();
});

// A sheet's picture: its file goes into the browser's database, its place into the settings.
let f_set_picture = async function(s_sheet, o_file){
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
            document.getElementById('el_picture_hint').textContent = `${o_file.name} is not a picture this browser can show.`;
            return;
        }
        o_picture = f_o_picture__fitted(f_o_picture(el_img.naturalWidth, el_img.naturalHeight), f_a_n__bleed(o_setting), true);
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
    document.getElementById('el_picture_hint').textContent = 'Without a picture a print shows the sheet\'s cut lines.';
    f_update();
};
document.getElementById('el_picture_sheet').addEventListener('change', function(o_event){
    s_sheet__picture = o_event.target.value;
    f_update();
});
document.getElementById('el_picture_load').addEventListener('click', function(){ document.getElementById('el_picture_file').click(); });
document.getElementById('el_picture_file').addEventListener('change', async function(o_event){
    let o_file = o_event.target.files[0];
    o_event.target.value = '';
    if(!o_file){ return; }
    await f_set_picture(s_sheet__picture, o_file);
    // a new picture is there to be placed
    if(o_s_url[s_sheet__picture]){ s_mode = 'picture'; }
    f_update();
});
document.getElementById('el_picture_remove').addEventListener('click', function(){ f_set_picture(s_sheet__picture, null); });
let f_n_deg = function(n_deg){ return ((n_deg + 180) % 360 + 360) % 360 - 180; };
let o_f_o_picture = {
    cover: function(o_picture){ return f_o_picture__fitted(o_picture, f_a_n__bleed(o_setting), true); },
    contain: function(o_picture){ return f_o_picture__fitted(o_picture, [0, 0, o_setting.n_mm__calendar_x, o_setting.n_mm__calendar_y], false); },
    turn_left: function(o_picture){ return { ...o_picture, n_deg: f_n_deg(o_picture.n_deg - 90) }; },
    turn_right: function(o_picture){ return { ...o_picture, n_deg: f_n_deg(o_picture.n_deg + 90) }; },
    flip_x: function(o_picture){ return { ...o_picture, b_flip_x: !o_picture.b_flip_x }; },
    flip_y: function(o_picture){ return { ...o_picture, b_flip_y: !o_picture.b_flip_y }; }
};
document.getElementById('el_picture').addEventListener('click', function(o_event){
    let f_o_picture__changed = o_f_o_picture[o_event.target.dataset.picture];
    if(!f_o_picture__changed){ return; }
    o_setting[`o_picture__${s_sheet__picture}`] = f_o_picture__changed(o_setting[`o_picture__${s_sheet__picture}`]);
    f_update();
});

document.getElementById('el_reset').addEventListener('click', async function(){
    if(!confirm('Start over with the settings of the first start? Windows moved or changed alone go back to the grid, and the pictures are removed.')){ return; }
    o_setting = structuredClone(o_setting__default);
    n_idx__selected = null;
    s_mode = 'window';
    f_fill_form();
    for(let s_sheet of a_s_sheet){ await f_set_picture(s_sheet, null); }
});

for(let el of document.querySelectorAll('[name=s_mode]')){
    el.addEventListener('change', function(){
        s_mode = el.value;
        f_update();
    });
}
document.getElementById('el_zoom').addEventListener('change', function(o_event){
    el_stage.style.setProperty('--n_zoom', o_event.target.value);
    f_update();
});
window.addEventListener('resize', f_update);

// Where the pointer is on a sheet, in the calendar's mm.
let f_a_n__mm = function(o_event, s_sheet){
    let o_rect = document.getElementById(`el_sheet__${s_sheet}`).firstElementChild.getBoundingClientRect();
    let n_mm__per_px = o_setting.n_mm__sheet_x / o_rect.width;
    let [n_x, n_y] = f_a_n__calendar(o_setting);
    return [(o_event.clientX - o_rect.left) * n_mm__per_px - n_x, (o_event.clientY - o_rect.top) * n_mm__per_px - n_y];
};
// Windows: a click on one chooses it, a drag moves it in steps of 0.5 mm. Picture: a
// drag anywhere on a sheet moves its picture, a drag of a handle sizes it or cuts it off.
el_stage.addEventListener('pointerdown', function(o_event){
    let el_sheet = o_event.target.closest('.sheet');
    if(!el_sheet){ return; }
    let s_sheet = el_sheet.dataset.sheet;
    let a_n = f_a_n__mm(o_event, s_sheet);
    if(s_mode === 'picture'){
        s_sheet__picture = s_sheet;
        let o_picture = o_s_url[s_sheet] ? o_setting[`o_picture__${s_sheet}`] : null;
        if(o_picture){
            let el_handle = o_event.target.closest('.handle');
            let a_n__sign = el_handle ? el_handle.dataset.sign.split(',').map(Number) : null;
            // a handle is rarely taken by its middle: what the pointer is off, it stays off
            let a_n__handle = a_n__sign ? f_a_n__handle(o_picture, a_n__sign) : a_n;
            o_drag = { s_sheet, o_picture, a_n__sign, a_n__pointer: a_n, a_n__off: [a_n[0] - a_n__handle[0], a_n[1] - a_n__handle[1]] };
            o_event.preventDefault();
        }
    } else if(s_sheet === 'front'){
        let el_hit = o_event.target.closest('.hit');
        n_idx__selected = el_hit ? Number(el_hit.dataset.idx) : null;
        if(el_hit){
            let o_window = f_a_o_window(o_setting)[n_idx__selected];
            o_drag = { s_sheet, a_n__pointer: a_n, a_n__window: [o_window.n_mm__x, o_window.n_mm__y] };
            o_event.preventDefault();
        }
    }
    f_update();
});
window.addEventListener('pointermove', function(o_event){
    if(!o_drag){ return; }
    let a_n = f_a_n__mm(o_event, o_drag.s_sheet);
    if(o_drag.o_picture){
        let a_n__on = [a_n[0] - o_drag.a_n__off[0], a_n[1] - o_drag.a_n__off[1]];
        let o_picture;
        if(!o_drag.a_n__sign){
            o_picture = { ...o_drag.o_picture, n_mm__x: o_drag.o_picture.n_mm__x + a_n[0] - o_drag.a_n__pointer[0], n_mm__y: o_drag.o_picture.n_mm__y + a_n[1] - o_drag.a_n__pointer[1] };
        } else if(o_drag.a_n__sign.includes(0)){
            o_picture = f_o_picture__cropped(o_drag.o_picture, a_s_side[a_a_n__sign.findIndex(function(a_n__sign){ return String(a_n__sign) === String(o_drag.a_n__sign); }) - 4], a_n__on);
        } else {
            o_picture = f_o_picture__resized(o_drag.o_picture, o_drag.a_n__sign, a_n__on);
        }
        // hundredths of a mm are enough, and short in the fields
        for(let s_name of ['n_mm__x', 'n_mm__y', 'n_mm__size_x']){ o_picture[s_name] = Math.round(o_picture[s_name] * 100) / 100; }
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
    if(s_mode !== 'picture' || !o_event.ctrlKey || !s_sheet || !o_s_url[s_sheet]){ return; }
    o_event.preventDefault();
    let o_picture = f_o_picture__scaled(o_setting[`o_picture__${s_sheet}`], Math.exp(-o_event.deltaY / 1000), f_a_n__mm(o_event, s_sheet));
    for(let s_name of ['n_mm__x', 'n_mm__y', 'n_mm__size_x']){ o_picture[s_name] = Math.round(o_picture[s_name] * 100) / 100; }
    o_setting[`o_picture__${s_sheet}`] = o_picture;
    s_sheet__picture = s_sheet;
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
    let o_file = await f_v__stored('get', s_sheet).catch(function(o_error){ console.warn(o_error); });
    if(o_file){ o_s_url[s_sheet] = URL.createObjectURL(o_file); } else { o_setting[`o_picture__${s_sheet}`] = null; }
}
f_fill_form();
f_update();
