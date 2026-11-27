// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// deno task check
//
// The page in headless Chrome, used as a person uses it: the steps and what each shows,
// the sheet's size between the bars, fields that are wrong, windows and pictures moved
// with the pointer, a match by four points, the print measured from Chrome's PDF, the
// cutting files. Needs google-chrome and pdftoppm; the app is served on port 8779.
// With a folder as argument the readme's two pictures of the app are saved there:
// deno task check .

import { o_setting__default, f_a_o_window, f_o_door, f_a_n__box as f_a_n__box__path, f_s_svg } from '../calendar.module.js';
import { f_a_n__from_px, f_a_n__to_px, f_a_n__handle, f_a_n__size } from '../picture.module.js';
import { f_o_page, f_a_n__box } from './chrome.js';

let n_check = 0;
let a_s_failed = [];
let f_check = function(s_name, b, v__seen = ''){
    n_check++;
    if(!b){ a_s_failed.push(s_name); }
    console.log(`${b ? 'ok  ' : 'FAIL'} ${s_name}${b ? '' : `: ${JSON.stringify(v__seen)}`}`);
};
let f_b_near = function(v, v__other, n_tolerance){
    return [v].flat().every(function(n, n_idx){ return Math.abs(n - [v__other].flat()[n_idx]) <= n_tolerance; });
};
let f_a_n__round = function(a_n){ return a_n.map(function(n){ return Math.round(n * 100) / 100; }); };

let o_page = await f_o_page();
try{
    // What the page shows and holds, in one look.
    let f_o_state = function(){
        return o_page.f_v(`(function(){
            let f_b = function(v){ let el = typeof v === 'string' ? document.querySelector(v) : v; return Boolean(el) && el.getClientRects().length > 0; };
            let f_s = function(s_selector, s_name){ return [...document.querySelectorAll(s_selector)].map(function(el){ return el.dataset[s_name]; }).join(); };
            let f_a_n = function(s_selector){ let o = document.querySelector(s_selector).getBoundingClientRect(); return [o.left, o.top, o.right, o.bottom]; };
            return {
                o_setting: JSON.parse(localStorage.getItem('paper_advent_calendar')),
                s_step: document.body.dataset.step,
                s_step__open: [...document.querySelectorAll('.step')].filter(f_b).map(function(el){ return el.dataset.step; }).join(),
                s_step__current: f_s('#el_step [aria-current]', 'step'),
                s_step__bad: f_s('#el_step .bad', 'step'),
                s_sheet: [...document.querySelectorAll('.sheet')].filter(f_b).map(function(el){ return el.dataset.sheet; }).join(),
                s_sheet__checked: [...document.querySelectorAll('[name=s_sheet__shown]:checked, [name=s_sheet__picture]:checked')].map(function(el){ return el.value; }).join(),
                s_sheet__has: [...document.querySelectorAll('.seg .has input')].map(function(el){ return el.value; }).join(),
                s_sheet__picture: [...document.querySelectorAll('.sheet.has_picture')].map(function(el){ return el.dataset.sheet; }).join(),
                s_status: document.getElementById('el_status').textContent,
                b_status: f_b('#el_status'),
                n_hit: document.querySelectorAll('.sheet.shown .hit').length,
                n_hit__selected: document.querySelectorAll('.sheet.shown .hit.selected').length,
                s_own: document.getElementById('el_own_title').textContent,
                b_own: f_b('#el_own'),
                b_picture: f_b('#el_picture'),
                s_load: document.getElementById('el_picture_load').textContent + (document.getElementById('el_picture_load').classList.contains('main') ? ', main' : ''),
                s_hint: document.getElementById('el_picture_hint').textContent,
                s_title: document.getElementById('el_picture_title').textContent,
                n_handle: document.querySelectorAll('.sheet.shown .handle').length,
                b_bar: f_b('#el_match_bar'),
                b_matching: f_b('#el_matching'),
                s_match: document.getElementById('el_match_step').textContent,
                s_match__body: document.body.dataset.match ?? '',
                b_undo: f_b('#el_match_undo'),
                b_disabled: document.getElementById('el_print').disabled && document.getElementById('el_download__front').disabled && document.getElementById('el_download__back').disabled,
                a_n__window: [innerWidth, innerHeight, document.documentElement.scrollWidth, document.documentElement.scrollHeight],
                a_n__view: f_a_n('#el_view'),
                a_n__sheet: f_a_n('.sheet.shown'),
                a_n__panel: f_a_n('#el_side'),
                a_n__status: f_a_n('#el_status'),
                a_n__stage: f_a_n('#el_stage'),
                a_n__panel_scroll: [document.getElementById('el_panel').scrollWidth, document.getElementById('el_panel').clientWidth]
            };
        })()`);
    };
    let f_until = async function(s_expression){
        for(let n_try = 0; n_try < 200; n_try++){
            if(await o_page.f_v(s_expression)){ break; }
            await o_page.f_wait(50);
        }
        await o_page.f_settle();
    };
    let f_step = function(s_step){ return o_page.f_click_on(`#el_step [data-step=${s_step}]`); };
    // A place of the calendar, in its mm, in the window's pixels on the sheet shown; and how many pixels a mm is.
    let f_n_px__per_mm = async function(){
        let o_state = await f_o_state();
        return (o_state.a_n__sheet[2] - o_state.a_n__sheet[0]) / o_state.o_setting.n_mm__sheet_x;
    };
    let f_a_n__px = async function(a_n){
        let { o_setting, a_n__sheet } = await f_o_state();
        let n_px__per_mm = (a_n__sheet[2] - a_n__sheet[0]) / o_setting.n_mm__sheet_x;
        let n_mm__top = o_setting.n_mm__sheet_y - o_setting.n_mm__bottom - o_setting.n_mm__calendar_y;
        return [a_n__sheet[0] + (o_setting.n_mm__left + a_n[0]) * n_px__per_mm, a_n__sheet[1] + (n_mm__top + a_n[1]) * n_px__per_mm];
    };
    // A picture file made by the page's own canvas; s_draw draws on o_context, n_px__x by n_px__y.
    let f_s_path__picture = async function(s_name, n_px__x, n_px__y, s_draw){
        let s_url = await o_page.f_v(`(async function(){
            let el_canvas = document.createElement('canvas');
            el_canvas.width = ${n_px__x};
            el_canvas.height = ${n_px__y};
            let o_context = el_canvas.getContext('2d');
            let [n_px__x, n_px__y] = [${n_px__x}, ${n_px__y}];
            ${s_draw}
            return el_canvas.toDataURL('image/png');
        })()`);
        let s_path = `${o_page.s_path__work}/${s_name}`;
        await Deno.writeFile(s_path, Uint8Array.from(atob(s_url.split(',')[1]), function(s){ return s.charCodeAt(0); }));
        return s_path;
    };
    let f_load = async function(s_path, s_sheet){
        await o_page.f_choose('#el_picture_file', [s_path]);
        await f_until(`document.getElementById('el_sheet__${s_sheet}').classList.contains('has_picture') && Boolean(document.querySelector('#el_sheet__${s_sheet} image'))`);
    };

    await o_page.f_open();

    // ---- the steps
    let o_state = await f_o_state();
    f_check('opens on the first step, the front sheet shown', o_state.s_step === 'paper' && o_state.s_step__open === 'paper' && o_state.s_step__current === 'paper' && o_state.s_sheet === 'front', o_state);
    f_check('five steps in the bar', await o_page.f_v(`[...document.querySelectorAll('#el_step button')].map(function(el){ return el.textContent; }).join()`) === '1Paper,2Windows,3Picture,4Cuts,5Print and cut');
    let a_s_name__missing = await o_page.f_v(`${JSON.stringify(Object.keys(o_setting__default))}.filter(function(s_name){ return !document.getElementById('el_panel').elements[s_name]; })`);
    f_check('every setting has a field but the seed, the pictures and the windows\' own values', String(a_s_name__missing) === 'n_seed,o_picture__front,o_picture__back,a_o_window__own', a_s_name__missing);
    f_check('every field lies in a step', await o_page.f_v(`[...document.getElementById('el_panel').elements].every(function(el){ return el.closest('.step'); })`));
    for(let s_step of ['window', 'picture', 'cut', 'output', 'paper']){
        await f_step(s_step);
        o_state = await f_o_state();
        f_check(`step ${s_step}: its settings alone`, o_state.s_step === s_step && o_state.s_step__open === s_step && o_state.s_step__current === s_step, o_state);
        f_check(`step ${s_step}: the panel needs no scrolling sideways, the page none at all`, o_state.a_n__panel_scroll[0] <= o_state.a_n__panel_scroll[1] && o_state.a_n__window[2] <= o_state.a_n__window[0] && o_state.a_n__window[3] <= o_state.a_n__window[1], o_state.a_n__window);
    }
    for(let s_step of ['window', 'picture', 'cut', 'output']){
        await o_page.f_click_on('.step:not([hidden]) .next button');
        f_check(`Next leads to step ${s_step}`, (await f_o_state()).s_step__open === s_step);
    }
    f_check('the last step has no Next', await o_page.f_v(`!document.querySelector('.step:not([hidden]) .next')`));

    // ---- the sheet between the bars
    let f_check_fit = async function(s_name, n_ratio){
        let { a_n__view, a_n__sheet, a_n__window } = await f_o_state();
        let a_n__around = [a_n__sheet[0] - a_n__view[0], a_n__sheet[1] - a_n__view[1], a_n__view[2] - a_n__sheet[2], a_n__view[3] - a_n__sheet[3]];
        f_check(`${s_name}: the sheet fits its place, 20 pixels and more around it, and touches it along one side`,
            a_n__around.every(function(n){ return n >= 20; }) && Math.min(...a_n__around) <= 29 && f_b_near((a_n__sheet[2] - a_n__sheet[0]) / (a_n__sheet[3] - a_n__sheet[1]), n_ratio, 0.01)
            && a_n__window[2] <= a_n__window[0], [a_n__around, a_n__window]);
    };
    await f_step('paper');
    await f_check_fit('1500 x 950', 297 / 210);
    await o_page.f_fill('el_format', '210 297');
    o_state = await f_o_state();
    f_check('format A4 portrait: the sheet is 210 x 297', o_state.o_setting.n_mm__sheet_x === 210 && o_state.o_setting.n_mm__sheet_y === 297, o_state.o_setting);
    f_check('what is wrong is said under the settings, in view', o_state.s_status.includes('The calendar reaches over the sheet\'s edge: right') && o_state.b_status && o_state.a_n__status[3] - o_state.a_n__status[1] >= 20
        && o_state.a_n__status[3] <= o_state.a_n__window[1] && o_state.a_n__status[2] <= o_state.a_n__view[0] + 1, [o_state.s_status, o_state.a_n__status]);
    await f_check_fit('A4 portrait', 210 / 297);
    await o_page.f_fill('n_mm__sheet_x', 300);
    f_check('a size of its own: the format says so', await o_page.f_v(`document.getElementById('el_format').selectedOptions[0].textContent`) === 'Own size');
    await o_page.f_fill('el_format', '297 210');
    f_check('format A4 landscape again, nothing wrong', (await f_o_state()).s_status === '' && await o_page.f_v(`document.getElementById('el_panel').elements.n_mm__sheet_y.value`) === '210');
    for(let [n_x, n_y] of [[1100, 700], [800, 600]]){
        await o_page.f_size(n_x, n_y);
        await f_check_fit(`${n_x} x ${n_y}`, 297 / 210);
    }
    await o_page.f_size(400, 800);
    for(let s_step of ['paper', 'window', 'picture', 'cut', 'output']){
        await f_step(s_step);
        o_state = await f_o_state();
        f_check(`400 wide, step ${s_step}: the sheet over the settings, nothing wider than the window`, o_state.a_n__stage[3] <= o_state.a_n__panel[1] + 1 && o_state.a_n__window[2] <= 400 && o_state.a_n__panel_scroll[0] <= o_state.a_n__panel_scroll[1]
            && o_state.a_n__sheet[0] >= o_state.a_n__view[0] && o_state.a_n__sheet[2] <= o_state.a_n__view[2] && o_state.a_n__sheet[3] <= o_state.a_n__view[3], o_state);
    }
    await o_page.f_size(1500, 950);
    await f_step('paper');

    // zoom: twice and four times as large, the view's middle stays on its place of the sheet
    let f_a_n_ratio = async function(){
        let { a_n__view, a_n__sheet } = await f_o_state();
        return [((a_n__view[0] + a_n__view[2]) / 2 - a_n__sheet[0]) / (a_n__sheet[2] - a_n__sheet[0]), ((a_n__view[1] + a_n__view[3]) / 2 - a_n__sheet[1]) / (a_n__sheet[3] - a_n__sheet[1])];
    };
    let n_px__fit = (await f_o_state()).a_n__sheet[2] - (await f_o_state()).a_n__sheet[0];
    await o_page.f_click_on('[name=n_zoom][value="2"] + span');
    o_state = await f_o_state();
    f_check('zoom 2: twice as wide, its middle still in the middle', f_b_near(o_state.a_n__sheet[2] - o_state.a_n__sheet[0], 2 * n_px__fit, 1) && f_b_near(await f_a_n_ratio(), [0.5, 0.5], 0.005), await f_a_n_ratio());
    await o_page.f_v(`document.getElementById('el_scroll').scrollBy(-300, 200)`);
    let a_n_ratio = await f_a_n_ratio();
    await o_page.f_click_on('[name=n_zoom][value="4"] + span');
    o_state = await f_o_state();
    f_check('zoom 4: four times as wide, what was in the middle stays there', f_b_near(o_state.a_n__sheet[2] - o_state.a_n__sheet[0], 4 * n_px__fit, 2) && f_b_near(await f_a_n_ratio(), a_n_ratio, 0.005), [a_n_ratio, await f_a_n_ratio()]);
    await o_page.f_click_on('[name=n_zoom][value="1"] + span');
    await f_check_fit('zoom back to fit', 297 / 210);

    // the other sheet, and both kept over a reload
    await o_page.f_click_on('[name=s_sheet__shown][value=back] + span');
    await f_step('cut');
    o_state = await f_o_state();
    f_check('Back: the back sheet alone, said to be seen from the front', o_state.s_sheet === 'back' && o_state.s_sheet__checked === 'back,back' && await o_page.f_v(`document.getElementById('el_shown_note').textContent`) === 'as seen from the front', o_state);
    await o_page.f_open();
    o_state = await f_o_state();
    f_check('a reload keeps the step and the sheet shown', o_state.s_step__open === 'cut' && o_state.s_sheet === 'back', o_state);
    await o_page.f_click_on('[name=s_sheet__shown][value=front] + span');

    // the lines' legend
    await o_page.f_click_on('#el_legend_box summary');
    let a_n__legend = await o_page.f_v(`(function(){ let o = document.getElementById('el_legend').getBoundingClientRect(); return [o.left, o.top, o.right, o.bottom, document.querySelectorAll('#el_legend li').length]; })()`);
    f_check('Line colours: the legend opens in the window, 8 kinds of line', a_n__legend[0] >= 0 && a_n__legend[2] <= 1500 && a_n__legend[3] <= 950 && a_n__legend[3] > a_n__legend[1] && a_n__legend[4] === 8, a_n__legend);
    await o_page.f_click(await f_a_n__px([138, 95]));
    f_check('a press beside it closes it', await o_page.f_v(`!document.getElementById('el_legend_box').open`));

    // ---- fields that are wrong
    await f_step('paper');
    await o_page.f_fill('n_mm__margin', 500);
    o_state = await f_o_state();
    f_check('a field that is wrong in another step: said with its step, the step marked, no print and no files', o_state.s_status.startsWith('Windows, Margin: ') && o_state.s_step__bad === 'window' && o_state.b_disabled, o_state.s_status);
    await f_step('output');
    f_check('the steps still open with it', (await f_o_state()).s_step__open === 'output');
    await o_page.f_fill('n_mm__margin', 15);
    o_state = await f_o_state();
    f_check('put right: nothing said, nothing marked', o_state.s_status === '' && o_state.s_step__bad === '' && !o_state.b_disabled && !o_state.b_status, o_state.s_status);
    await o_page.f_fill('n_mm__sheet_x', 10);
    f_check('one of two fields in a row is named by itself', (await f_o_state()).s_status.startsWith('Paper, Sheet\'s width: '), (await f_o_state()).s_status);
    await o_page.f_fill('n_mm__sheet_x', 297);
    await f_step('window');
    for(let s_shape of ['rect', 'arch', 'round']){ await o_page.f_click_on(`.chips label:has([value=${s_shape}])`); }
    o_state = await f_o_state();
    f_check('no shape chosen: said', o_state.s_status === 'Windows, Shapes: choose one at least' && o_state.s_step__bad === 'window', o_state.s_status);
    for(let s_shape of ['rect', 'round']){ await o_page.f_click_on(`.chips label:has([value=${s_shape}])`); }
    o_state = await f_o_state();
    f_check('shapes chosen by their chips', String(o_state.o_setting.a_s_shape) === 'rect,round' && o_state.s_status === '', o_state.o_setting.a_s_shape);
    await o_page.f_click_on('.chips label:has([value=arch])');
    await o_page.f_click_on('.chips label:has([value=top])');
    f_check('a door chosen by its chip', String((await f_o_state()).o_setting.a_s_door) === 'left,right,top,double');
    await o_page.f_click_on('.chips label:has([value=top])');
    await o_page.f_click_on('#el_shuffle');
    f_check('Shuffle deals anew', (await f_o_state()).o_setting.n_seed === 2);
    await f_step('paper');
    await o_page.f_fill('n_mm__left', 2);
    o_state = await f_o_state();
    f_check('the calendar in the printer\'s margin: said under the settings, the distances with the fields', o_state.s_status.includes('The calendar lies in the printer\'s margin') && await o_page.f_v(`document.getElementById('el_place').textContent`) === 'That leaves 18 mm to the sheet\'s right edge and 10 mm to its top.', o_state.s_status);
    await o_page.f_fill('n_mm__left', 10);

    // ---- windows
    let f_a_n__window = async function(n_idx){
        let o_window = f_a_o_window((await f_o_state()).o_setting)[n_idx];
        return [o_window.n_mm__x, o_window.n_mm__y];
    };
    f_check('step Paper: no window to take hold of', (await f_o_state()).n_hit === 0);
    let s_setting = JSON.stringify((await f_o_state()).o_setting);
    await o_page.f_drag(await f_a_n__px(await f_a_n__window(2)), await f_a_n__px([100, 100]));
    f_check('step Paper: a drag on the sheet changes nothing', JSON.stringify((await f_o_state()).o_setting) === s_setting);
    await f_step('window');
    o_state = await f_o_state();
    f_check('step Windows: 24 to take hold of, none chosen', o_state.n_hit === 24 && o_state.s_own === 'One window' && !o_state.b_own, o_state);
    let a_n__before = await f_a_n__window(2);
    await o_page.f_click(await f_a_n__px(a_n__before));
    o_state = await f_o_state();
    f_check('a click chooses a window and moves nothing', o_state.s_own === 'Window 3 of 24' && o_state.b_own && o_state.n_hit__selected === 1 && !o_state.o_setting.a_o_window__own[2], o_state.s_own);
    f_check('its fields show its place', await o_page.f_v(`[document.getElementById('el_panel').elements.own__n_mm__x.value, document.getElementById('el_panel').elements.own__n_mm__y.value].join()`) === a_n__before.join());
    // Chrome's own box of the close-up's lines, against the window's
    let a_n__detail = await o_page.f_v(`(function(){ let o = document.querySelector('#el_detail g').getBBox(); return [o.x + o.width / 2, o.y + o.height / 2, o.width, o.height]; })()`);
    f_check('its close-up is drawn: the lines lie around its middle, 32 wide and high', f_b_near(a_n__detail.slice(0, 2), a_n__before, 1.5) && f_b_near(a_n__detail.slice(2), [32, 32], 0.01) && !(await o_page.f_v(`document.getElementById('el_detail').innerHTML`)).includes('NaN'), a_n__detail);
    let n_px__per_mm = await f_n_px__per_mm();
    let a_n__from = await f_a_n__px(a_n__before);
    await o_page.f_drag(a_n__from, [a_n__from[0] + 40, a_n__from[1] + 22]);
    let a_n__after = await f_a_n__window(2);
    f_check('a drag moves it, in steps of 0.5 mm', f_b_near(a_n__after, [a_n__before[0] + 40 / n_px__per_mm, a_n__before[1] + 22 / n_px__per_mm], 0.26) && a_n__after.every(function(n){ return n * 2 === Math.round(n * 2); }) && a_n__after[0] !== a_n__before[0], [a_n__before, a_n__after]);
    await o_page.f_size(1500, 600);
    await o_page.f_v(`document.getElementById('el_panel').scrollTop = 0`);
    await o_page.f_click(await f_a_n__px(await f_a_n__window(7)));
    let a_n__own = await o_page.f_v(`(function(){ let o = document.getElementById('el_own_group').getBoundingClientRect(); let o_panel = document.getElementById('el_panel').getBoundingClientRect(); return [o.top - o_panel.top, o_panel.bottom - o.bottom]; })()`);
    f_check('in a low window a chosen window\'s fields come into view', a_n__own[0] >= -1 && a_n__own[1] >= -1 && (await f_o_state()).s_own === 'Window 8 of 24', a_n__own);
    await o_page.f_size(1500, 950);
    await o_page.f_click_on('[name=s_sheet__shown][value=back] + span');
    o_state = await f_o_state();
    f_check('the back sheet has the windows too', o_state.s_sheet === 'back' && o_state.n_hit === 24 && o_state.n_hit__selected === 1, o_state);
    let a_n__opening = await o_page.f_v(`(function(){ let o = document.querySelectorAll('#el_sheet__back .opening')[2].getBBox(); return [o.x, o.y, o.x + o.width, o.y + o.height]; })()`);
    let a_n__opening_module = f_a_n__box__path([f_o_door(f_a_o_window(o_state.o_setting)[2], o_state.o_setting).a_o_seg__opening]);
    f_check('on the back the moved window opens where the front has it', f_b_near(a_n__opening, a_n__opening_module, 0.01) && f_b_near((a_n__opening[1] + a_n__opening[3]) / 2, a_n__after[1], 0.01), [a_n__opening, a_n__opening_module]);
    await o_page.f_click(await f_a_n__px(await f_a_n__window(4)));
    f_check('a click on the back sheet chooses a window as well', (await f_o_state()).s_own === 'Window 5 of 24');
    await o_page.f_click_on('[name=s_sheet__shown][value=front] + span');
    await o_page.f_click(await f_a_n__px(a_n__after));
    await o_page.f_fill('own__n_mm__size_x', 40);
    await o_page.f_fill('own__s_shape', 'round');
    await o_page.f_fill('own__s_door', 'top');
    o_state = await f_o_state();
    f_check('a window\'s own size, shape and door', JSON.stringify(o_state.o_setting.a_o_window__own[2]) === JSON.stringify({ n_mm__x: a_n__after[0], n_mm__y: a_n__after[1], n_mm__size_x: 40, s_shape: 'round', s_door: 'top' }), o_state.o_setting.a_o_window__own[2]);
    await o_page.f_click_on('#el_own_reset');
    f_check('Back to the grid drops them', !(await f_o_state()).o_setting.a_o_window__own[2] && f_b_near(await f_a_n__window(2), a_n__before, 0));
    await o_page.f_click(await f_a_n__px([4, 4]));
    o_state = await f_o_state();
    f_check('a click beside the windows: none chosen', o_state.s_own === 'One window' && !o_state.b_own && o_state.n_hit__selected === 0, o_state.s_own);
    await o_page.f_fill('n_window', 12);
    f_check('12 windows', (await f_o_state()).n_hit === 12 && await o_page.f_v(`document.getElementById('el_size').textContent`) === '12 windows in 2 rows, 41.17 × 80 mm from one to the next.', await o_page.f_v(`document.getElementById('el_size').textContent`));
    await o_page.f_fill('n_window', 24);

    // ---- a picture
    let s_path__front = await f_s_path__picture('front.png', 3000, 2000, `
        let o_gradient = o_context.createLinearGradient(0, 0, n_px__x, n_px__y);
        o_gradient.addColorStop(0, '#31408f'); o_gradient.addColorStop(0.5, '#b0505a'); o_gradient.addColorStop(1, '#e0b040');
        o_context.fillStyle = o_gradient;
        o_context.fillRect(0, 0, n_px__x, n_px__y);
        o_context.strokeStyle = '#ffffff60'; o_context.lineWidth = 3;
        for(let n = 0; n <= n_px__x; n += 100){ o_context.strokeRect(n, -5, 100, n_px__y + 10); o_context.strokeRect(-5, n, n_px__x + 10, 100); }
        o_context.font = 'bold 130px sans-serif'; o_context.textBaseline = 'middle'; o_context.textAlign = 'center';
        for(let [s, s_colour, n_x, n_y] of [['TL', '#ff0000', 0, 0], ['TR', '#00c000', 1, 0], ['BL', '#0040ff', 0, 1], ['BR', '#ffd800', 1, 1]]){
            o_context.fillStyle = s_colour; o_context.fillRect(n_x * (n_px__x - 260), n_y * (n_px__y - 260), 260, 260);
            o_context.fillStyle = '#101010'; o_context.fillText(s, n_x * (n_px__x - 260) + 130, n_y * (n_px__y - 260) + 130);
        }
        o_context.fillStyle = '#ffffff'; o_context.fillText('FRONT PICTURE', n_px__x / 2, n_px__y / 2);`);
    // the back's picture: the calendar and its bleed at 10 pixels a mm, a numbered dot behind every window
    let s_path__back = await f_s_path__picture('back.png', 2810, 1940, `
        o_context.fillStyle = '#f8efcc';
        o_context.fillRect(0, 0, n_px__x, n_px__y);
        o_context.font = 'bold 130px sans-serif'; o_context.textBaseline = 'middle'; o_context.textAlign = 'center';
        ${JSON.stringify(f_a_o_window(o_setting__default).map(function(o_window){ return [o_window.n_mm__x, o_window.n_mm__y]; }))}.forEach(function([n_x, n_y], n_idx){
            o_context.fillStyle = 'hsl(' + (340 - n_idx * 7) + ' 55% 50%)';
            o_context.beginPath(); o_context.arc((n_x + 2) * 10, (n_y + 2) * 10, 150, 0, 7); o_context.fill();
            o_context.fillStyle = '#ffffff'; o_context.fillText(n_idx + 1, (n_x + 2) * 10, (n_y + 2) * 10 + 8);
        });`);
    let s_path__text = `${o_page.s_path__work}/text.txt`;
    await Deno.writeTextFile(s_path__text, 'no picture');
    let f_o_picture = async function(s_sheet = 'front'){ return (await f_o_state()).o_setting[`o_picture__${s_sheet}`]; };

    await f_step('picture');
    o_state = await f_o_state();
    f_check('step Picture, none yet: Load a picture is the thing to press', o_state.s_load === 'Load a picture, main' && !o_state.b_picture && o_state.s_hint.startsWith('None yet.') && o_state.s_title === 'Picture of the front sheet' && o_state.n_hit === 0, o_state);
    await f_load(s_path__front, 'front');
    o_state = await f_o_state();
    let o_picture = o_state.o_setting.o_picture__front;
    f_check('a picture loaded: it fills the calendar and its bleed', o_picture.n_px__x === 3000 && o_picture.n_px__y === 2000 && String([o_picture.n_mm__x, o_picture.n_mm__y, o_picture.n_mm__size_x]) === '138.5,95,291', o_picture);
    f_check('the panel shows its tools, its size, and which sheet has one', o_state.b_picture && o_state.s_load === 'Load another' && o_state.s_hint === '3000 × 2000 pixels, shown 291 × 194 mm: 262 pixels per inch.' && o_state.s_sheet__has === 'front' && o_state.n_handle === 8 && o_state.s_status === '', o_state);
    let f_a_n__image = async function(s_sheet = 'front'){
        // Chrome's own box of the picture, in the sheet's mm
        let a_n = await o_page.f_v(`(function(){ let o = document.querySelector('#el_sheet__${s_sheet} image').getBoundingClientRect(); let o_sheet = document.querySelector('#el_sheet__${s_sheet} > svg').getBoundingClientRect(); return [o.left - o_sheet.left, o.top - o_sheet.top, o.right - o_sheet.left, o.bottom - o_sheet.top]; })()`);
        let n_px__per_mm__now = await f_n_px__per_mm();
        return a_n.map(function(n){ return n / n_px__per_mm__now; });
    };
    f_check('Chrome draws it there', f_b_near(await f_a_n__image(), [3, 8, 294, 202], 0.05), await f_a_n__image());
    a_n__from = await f_a_n__px([100, 60]);
    await o_page.f_drag(a_n__from, [a_n__from[0] + 30, a_n__from[1] - 20]);
    let o_picture__moved = await f_o_picture();
    f_check('a drag moves it', f_b_near([o_picture__moved.n_mm__x, o_picture__moved.n_mm__y], [138.5 + 30 / n_px__per_mm, 95 - 20 / n_px__per_mm], 0.011) && o_picture__moved.n_mm__size_x === 291, o_picture__moved);
    await o_page.f_click_on('[data-picture=contain]');
    o_picture = await f_o_picture();
    f_check('Fit: as large as fits into the calendar, and the calendar is said to stay blank in part', f_b_near([o_picture.n_mm__x, o_picture.n_mm__y, o_picture.n_mm__size_x], [138.5, 95, 277], 1e-9) && (await f_o_state()).s_status === 'The front picture leaves a part of the calendar blank', o_picture);
    a_n__from = await f_a_n__px(f_a_n__handle(o_picture, [1, 1]));
    await o_page.f_drag(a_n__from, [a_n__from[0] - 90, a_n__from[1] - 60]);
    let o_picture__sized = await f_o_picture();
    f_check('a corner sizes it: the corner across stays, nothing is stretched', f_b_near(f_a_n__handle(o_picture__sized, [-1, -1]), f_a_n__handle(o_picture, [-1, -1]), 0.011) && f_b_near(o_picture__sized.n_mm__size_x, 277 - 90 / n_px__per_mm, 0.02)
        && f_b_near(f_a_n__size(o_picture__sized)[0] / f_a_n__size(o_picture__sized)[1], 1.5, 1e-9), o_picture__sized);
    a_n__from = await f_a_n__px(f_a_n__handle(o_picture__sized, [1, 0]));
    await o_page.f_drag(a_n__from, [a_n__from[0] - 50, a_n__from[1]]);
    let o_picture__cropped = await f_o_picture();
    f_check('a side crops it: the other side stays, and what is left stays where it is', f_b_near(f_a_n__handle(o_picture__cropped, [-1, 0]), f_a_n__handle(o_picture__sized, [-1, 0]), 0.011) && f_b_near(o_picture__cropped.a_n_ratio__crop[2], 50 / n_px__per_mm / o_picture__sized.n_mm__size_x, 0.001)
        && f_b_near(f_a_n__from_px(o_picture__cropped, [600, 900]), f_a_n__from_px(o_picture__sized, [600, 900]), 0.011), o_picture__cropped);
    f_check('the crop\'s field shows it in %', f_b_near(Number(await o_page.f_v(`document.getElementById('el_panel').elements.picture__crop_2.value`)), o_picture__cropped.a_n_ratio__crop[2] * 100, 0.006));
    await o_page.f_wheel(await f_a_n__px([60, 70]), -200, 2);
    let o_picture__scaled = await f_o_picture();
    f_check('Ctrl and the wheel size it under the pointer', f_b_near(o_picture__scaled.n_mm__size_x / o_picture__cropped.n_mm__size_x, Math.exp(0.2), 0.001) && f_b_near(f_a_n__to_px(o_picture__scaled, [60, 70]), f_a_n__to_px(o_picture__cropped, [60, 70]), 0.6), [f_a_n__to_px(o_picture__scaled, [60, 70]), f_a_n__to_px(o_picture__cropped, [60, 70])]);
    await o_page.f_click_on('[data-picture=turn_right]');
    await o_page.f_click_on('[data-picture=flip_x]');
    o_picture = await f_o_picture();
    f_check('Turn and Mirror', o_picture.n_deg === 90 && o_picture.b_flip_x && !o_picture.b_flip_y, o_picture);
    await o_page.f_click_on('[data-picture=turn_left]');
    await o_page.f_click_on('[data-picture=flip_x]');
    await o_page.f_click_on('[data-picture=flip_y]');
    o_picture = await f_o_picture();
    f_check('and back, top for bottom', o_picture.n_deg === 0 && !o_picture.b_flip_x && o_picture.b_flip_y, o_picture);
    await o_page.f_click_on('[data-picture=flip_y]');
    await o_page.f_fill('picture__crop_2', 0);
    await o_page.f_fill('picture__crop_1', 10);
    await o_page.f_fill('picture__n_mm__x', 120);
    await o_page.f_fill('picture__n_mm__size_x', 300);
    await o_page.f_fill('picture__n_deg', 15);
    o_picture = await f_o_picture();
    f_check('the fields set middle, width, turn and crop', String(o_picture.a_n_ratio__crop) === '0,0.1,0,0' && o_picture.n_mm__x === 120 && o_picture.n_mm__size_x === 300 && o_picture.n_deg === 15, o_picture);
    await o_page.f_fill('picture__crop_1', 0);
    await o_page.f_fill('picture__n_deg', 0);
    await o_page.f_click_on('[data-picture=cover]');
    o_picture = await f_o_picture();
    f_check('Fill: over the calendar and its bleed again, nothing wrong', String([o_picture.n_mm__x, o_picture.n_mm__y, o_picture.n_mm__size_x]) === '138.5,95,291' && (await f_o_state()).s_status === '', o_picture);
    if(Deno.args[0]){ await o_page.f_screenshot(`${Deno.args[0]}/preview.png`); }
    // the handles stay in view: a picture far larger than the sheet, then a sheet far larger than its place
    let f_a_o_handle = function(){
        return o_page.f_v(`(function(){
            let o_view = document.getElementById('el_scroll').getBoundingClientRect();
            return [...document.querySelectorAll('.sheet.shown .handle')].map(function(el){
                let o = el.getBoundingClientRect();
                let a_n = [(o.left + o.right) / 2, (o.top + o.bottom) / 2];
                return { s_sign: el.dataset.sign, a_n, b_in: o.left >= o_view.left && o.top >= o_view.top && o.right <= o_view.right && o.bottom <= o_view.bottom, b_hit: document.elementFromPoint(a_n[0], a_n[1]) === el };
            });
        })()`);
    };
    // eight of them, each whole in the view, to be taken hold of, and apart from the others
    let f_b_handles = function(a_o_handle){
        return a_o_handle.length === 8 && a_o_handle.every(function(o_handle){ return o_handle.b_in && o_handle.b_hit; })
            && new Set(a_o_handle.map(function(o_handle){ return o_handle.a_n.map(Math.round).join(); })).size === 8;
    };
    let a_o_handle = await f_a_o_handle();
    f_check('a picture in view: its handles sit on its corners and sides', f_b_handles(a_o_handle) && f_b_near(a_o_handle.find(function(o_handle){ return o_handle.s_sign === '1,1'; }).a_n, await f_a_n__px(f_a_n__handle(o_picture, [1, 1])), 0.6), a_o_handle);
    await o_page.f_fill('picture__n_mm__size_x', 900);
    o_picture = await f_o_picture();
    a_o_handle = await f_a_o_handle();
    f_check('a picture of 900 × 600 mm, its corners far outside the sheet: all eight handles in view', f_b_handles(a_o_handle), a_o_handle);
    a_n__from = a_o_handle.find(function(o_handle){ return o_handle.s_sign === '1,1'; }).a_n;
    await o_page.f_drag(a_n__from, [a_n__from[0] - 90, a_n__from[1] - 60]);
    o_picture__sized = await f_o_picture();
    f_check('a corner taken where its handle is drawn sizes the picture by what the pointer moves', f_b_near(o_picture__sized.n_mm__size_x, 900 - 90 / n_px__per_mm, 0.02) && f_b_near(f_a_n__handle(o_picture__sized, [-1, -1]), f_a_n__handle(o_picture, [-1, -1]), 0.011), o_picture__sized);
    await o_page.f_click_on('[name=n_zoom][value="4"] + span');
    await o_page.f_v(`document.getElementById('el_scroll').scrollBy(700, 400)`);
    await o_page.f_settle();
    a_o_handle = await f_a_o_handle();
    f_check('zoom 4, the sheet moved in its place: all eight handles in view', f_b_handles(a_o_handle) && (await f_o_state()).a_n__sheet[0] < -500, a_o_handle);
    await o_page.f_click_on('[name=n_zoom][value="1"] + span');
    await o_page.f_click_on('[data-picture=cover]');
    await o_page.f_choose('#el_picture_file', [s_path__text]);
    o_state = await f_o_state();
    f_check('a file that is no picture: said, the picture stays', o_state.s_hint.startsWith('text.txt is not a picture this browser can show.') && o_state.s_sheet__picture === 'front' && o_state.o_setting.o_picture__front.n_px__x === 3000, o_state.s_hint);
    await f_step('window');
    s_setting = JSON.stringify((await f_o_state()).o_setting);
    await o_page.f_drag(await f_a_n__px([138.5, 95]), await f_a_n__px([150, 100]));
    f_check('step Windows: a drag between the windows leaves the picture alone', JSON.stringify((await f_o_state()).o_setting) === s_setting && (await f_o_state()).n_handle === 0);

    // the back's picture, by the panel's own choice of sheet
    await f_step('picture');
    await o_page.f_click_on('[name=s_sheet__picture][value=back] + span');
    o_state = await f_o_state();
    f_check('Back sheet in the panel: the back sheet shown, no picture yet, the other file\'s note gone', o_state.s_sheet === 'back' && o_state.s_sheet__checked === 'back,back' && o_state.s_title === 'Picture of the back sheet' && o_state.s_hint.startsWith('None yet.') && !o_state.b_picture, o_state);
    await f_load(s_path__back, 'back');
    o_state = await f_o_state();
    f_check('the back\'s picture: both sheets have one, and the marks on the back are said to cut into it', o_state.s_sheet__has === 'front,back' && o_state.s_sheet__picture === 'front,back' && o_state.s_status === 'The marks on the back are cut into its picture: leave them out, under Cuts', o_state.s_status);
    f_check('Chrome draws it on the calendar and its bleed', f_b_near(await f_a_n__image('back'), [8, 8, 289, 202], 0.05), await f_a_n__image('back'));
    await o_page.f_open();
    o_state = await f_o_state();
    f_check('a reload keeps both pictures, their files and their places', o_state.s_sheet__picture === 'front,back' && o_state.s_step__open === 'picture' && o_state.s_sheet === 'back' && o_state.n_handle === 8 && f_b_near(o_state.o_setting.o_picture__front.n_mm__size_x, 291, 1e-9)
        && await o_page.f_v(`Promise.all([...document.querySelectorAll('.sheet image')].map(function(el){ return fetch(el.href.baseVal).then(function(o){ return o.blob(); }).then(function(o){ return o.size; }); })).then(function(a_n){ return a_n.length === 2 && a_n.every(function(n){ return n > 10000; }); })`), o_state);
    await f_step('cut');
    await o_page.f_click_on('[name=b_mark]');
    o_state = await f_o_state();
    f_check('Cuts: the marks switched off, their length with them, nothing wrong', o_state.o_setting.b_mark === false && o_state.s_status === '' && await o_page.f_v(`document.getElementById('el_panel').elements.n_mm__mark.disabled`), o_state.s_status);
    let n_bridge = f_a_o_window(o_state.o_setting).reduce(function(n, o_window){
        let o_door = f_o_door(o_window, o_state.o_setting);
        return n + o_door.a_a_o_seg__cut.length - o_door.a_a_o_seg__chain.length;
    }, 0);
    f_check('the bridges are counted', n_bridge > 50 && await o_page.f_v(`document.getElementById('el_bridge').textContent`) === `${n_bridge} bridges in all.`, await o_page.f_v(`document.getElementById('el_bridge').textContent`));
    await o_page.f_click_on('[name=b_logo]');
    f_check('the logo switched off: not in the back\'s file', (await f_o_state()).o_setting.b_logo === false && !f_s_svg((await f_o_state()).o_setting, 'back').includes('back_logo'));
    await o_page.f_click_on('[name=b_logo]');
    await f_step('picture');
    await o_page.f_click_on('#el_picture_remove');
    await f_until(`!document.getElementById('el_sheet__back').classList.contains('has_picture')`);
    o_state = await f_o_state();
    f_check('Remove it: the back\'s picture is gone, the front\'s stays', o_state.o_setting.o_picture__back === null && o_state.s_sheet__has === 'front' && o_state.s_load === 'Load a picture, main', o_state);

    // ---- a match by four points: a drawing of the calendar with two squares, as a photo taken at a slant
    let a_a_n__corner = [[420, 330], [2650, 250], [2760, 1930], [330, 2020]];
    let s_path__photo = await f_s_path__picture('photo.png', 3000, 2200, `
        let { f_a_n_h, f_a_n__warped } = await import('/match.module.js');
        // the drawing: the calendar, 277 x 190 mm, at 8 pixels a mm
        let el_drawing = document.createElement('canvas');
        el_drawing.width = 2216;
        el_drawing.height = 1520;
        let o_drawing = el_drawing.getContext('2d');
        o_drawing.fillStyle = '#f8f5ea'; o_drawing.fillRect(0, 0, 2216, 1520);
        o_drawing.strokeStyle = '#909090'; o_drawing.lineWidth = 10; o_drawing.strokeRect(5, 5, 2206, 1510);
        o_drawing.strokeStyle = '#d0d4e0'; o_drawing.lineWidth = 2;
        for(let n = 200; n < 2216; n += 200){ o_drawing.strokeRect(n, -5, 200, 1530); o_drawing.strokeRect(-5, n, 2226, 200); }
        o_drawing.fillStyle = '#ff00ff'; o_drawing.fillRect(800, 400, 160, 160);
        o_drawing.fillStyle = '#00ffff'; o_drawing.fillRect(1600, 960, 200, 120);
        let a_n_h = f_a_n_h(${JSON.stringify(a_a_n__corner)}, [[0, 0], [2216, 0], [2216, 1520], [0, 1520]]);
        let el_photo = document.createElement('canvas');
        el_photo.width = n_px__x;
        el_photo.height = n_px__y;
        el_photo.getContext('2d').putImageData(new ImageData(f_a_n__warped(o_drawing.getImageData(0, 0, 2216, 1520).data, 2216, 1520, a_n_h, n_px__x, n_px__y), n_px__x, n_px__y), 0, 0);
        o_context.fillStyle = '#b0b4b8'; o_context.fillRect(0, 0, n_px__x, n_px__y);
        o_context.drawImage(el_photo, 0, 0);`);
    await o_page.f_click_on('[name=s_sheet__picture][value=front] + span');
    await f_load(s_path__photo, 'front');
    await f_until(`JSON.parse(localStorage.getItem('paper_advent_calendar')).o_picture__front.n_px__y === 2200`);
    let o_picture__photo = await f_o_picture();
    await o_page.f_click_on('#el_match');
    o_state = await f_o_state();
    o_picture = o_state.o_setting.o_picture__front;
    f_check('Match 4 points: a bar over the sheet says what to click, the picture is fitted into the calendar, the sheets stay', o_state.b_bar && o_state.s_match === 'Point 1 of 4: click it on the picture, on the front sheet.' && o_state.b_matching && !o_state.b_picture && o_state.s_match__body === 'from'
        && f_b_near(f_a_n__size(o_picture), [190 * 3000 / 2200, 190], 1e-6) && await o_page.f_v(`[...document.querySelectorAll('[name=s_sheet__shown], [name=s_sheet__picture], #el_picture_load, #el_picture_remove')].every(function(el){ return el.disabled; })`), o_state);
    await f_check_fit('with the bar over it', 297 / 210);
    await o_page.f_click(await f_a_n__px([2, 95]));
    f_check('a click beside the picture is no point', (await f_o_state()).s_match === 'Point 1 of 4: click it on the picture, on the front sheet. That is beside the picture.');
    let f_click_point = async function(n_idx){ await o_page.f_click(await f_a_n__px(f_a_n__from_px(o_picture, a_a_n__corner[n_idx]))); };
    await f_click_point(0);
    await f_click_point(1);
    await f_click_point(3);
    f_check('three points clicked', (await f_o_state()).s_match === 'Point 4 of 4: click it on the picture, on the front sheet.' && await o_page.f_v(`document.querySelectorAll('.sheet.shown circle.match.from').length`) === 3);
    await o_page.f_click_on('#el_match_back');
    f_check('One point back', (await f_o_state()).s_match === 'Point 3 of 4: click it on the picture, on the front sheet.');
    await f_click_point(2);
    await f_click_point(3);
    o_state = await f_o_state();
    f_check('four points: now their places', o_state.s_match === 'Place 1 of 4: click where point 1 belongs on the cut pattern.' && o_state.s_match__body === 'to', o_state.s_match);
    // the calendar's corners, each clicked 1.5 mm beside it
    let a_a_n__place = [[1.2, 0.9], [277 - 1.2, 0.9], [277 - 1.2, 190 - 0.9], [1.2, 190 - 0.9]];
    let f_a_n__ring = function(){ return o_page.f_v(`(function(){ let el = document.querySelector('.sheet.shown circle.match.next'); return el ? [Number(el.getAttribute('cx')), Number(el.getAttribute('cy'))] : null; })()`); };
    await o_page.f_move(await f_a_n__px(a_a_n__place[0]));
    await o_page.f_settle();
    f_check('the ring shows where a click lands: on the calendar\'s corner', String(await f_a_n__ring()) === '0,0', await f_a_n__ring());
    await o_page.f_send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: (await f_a_n__px(a_a_n__place[0]))[0] + 1, y: (await f_a_n__px(a_a_n__place[0]))[1], modifiers: 1 });
    await o_page.f_settle();
    f_check('with Alt just where the pointer is', f_b_near(await f_a_n__ring(), a_a_n__place[0], 0.6) && (await f_a_n__ring())[0] > 0.5, await f_a_n__ring());
    for(let n_idx of [0, 1, 3, 2]){ await o_page.f_click(await f_a_n__px(a_a_n__place[n_idx])); }
    o_state = await f_o_state();
    f_check('places in another order than the points: said, nothing laid', o_state.s_match.includes('would fold over') && o_state.b_bar && o_state.o_setting.o_picture__front.n_px__x === 3000, o_state.s_match);
    if(Deno.args[0]){
        await o_page.f_click_on('#el_match_back');
        await o_page.f_move(await f_a_n__px([200, 150]));
        await o_page.f_settle();
        await o_page.f_screenshot(`${Deno.args[0]}/match.png`);
        await o_page.f_click(await f_a_n__px(a_a_n__place[2]));
    }
    await o_page.f_click_on('#el_match_back');
    await o_page.f_click_on('#el_match_back');
    await o_page.f_click(await f_a_n__px(a_a_n__place[2]));
    await o_page.f_click(await f_a_n__px(a_a_n__place[3]));
    await f_until(`!document.getElementById('el_match_bar').getClientRects().length && JSON.parse(localStorage.getItem('paper_advent_calendar')).o_picture__front.n_px__x !== 3000`);
    o_state = await f_o_state();
    o_picture = o_state.o_setting.o_picture__front;
    f_check('the fourth place: the picture is laid anew over the calendar and its bleed, the bar is gone, the match can be undone', !o_state.b_bar && !o_state.b_matching && o_state.b_picture && o_state.b_undo && o_state.s_match__body === ''
        && f_b_near([o_picture.n_mm__x, o_picture.n_mm__size_x], [138.5, 281], 1e-9) && await o_page.f_v(`document.getElementById('el_match_note').textContent`) === 'Matched by four points.', [o_picture, o_state]);
    // where the drawing's magenta square lies now: in the new picture's pixels, drawn from 100 to 120 and 50 to 70 mm
    let a_n__square = await o_page.f_v(`(async function(){
        let el_img = new Image();
        el_img.src = document.querySelector('#el_sheet__front image').href.baseVal;
        await el_img.decode();
        let el_canvas = document.createElement('canvas');
        el_canvas.width = el_img.naturalWidth;
        el_canvas.height = el_img.naturalHeight;
        let o_context = el_canvas.getContext('2d');
        o_context.drawImage(el_img, 0, 0);
        let a_n = o_context.getImageData(0, 0, el_canvas.width, el_canvas.height).data;
        let [n_left, n_top, n_right, n_bottom] = [Infinity, Infinity, -1, -1];
        for(let n_y = 0; n_y < el_canvas.height; n_y++){
            for(let n_x = 0; n_x < el_canvas.width; n_x++){
                let n_at = 4 * (n_y * el_canvas.width + n_x);
                if(a_n[n_at] > 200 && a_n[n_at + 1] < 110 && a_n[n_at + 2] > 200){
                    n_left = Math.min(n_left, n_x); n_right = Math.max(n_right, n_x + 1); n_top = Math.min(n_top, n_y); n_bottom = Math.max(n_bottom, n_y + 1);
                }
            }
        }
        return [n_left, n_top, n_right, n_bottom];
    })()`);
    let a_n__square_mm = [f_a_n__from_px(o_picture, a_n__square.slice(0, 2)), f_a_n__from_px(o_picture, a_n__square.slice(2))].flat();
    f_check('the photo\'s square lies where it was drawn, 100 to 120 and 50 to 70 mm, within 0.15', f_b_near(a_n__square_mm, [100, 50, 120, 70], 0.15), f_a_n__round(a_n__square_mm));
    let a_o_print = await o_page.f_a_o_print();
    let a_n__square_print = f_a_n__box(a_o_print[0], function(n_r, n_g, n_b){ return n_r > 200 && n_g < 110 && n_b > 200; });
    f_check('and in the print 10 mm further on the sheet, within 0.15', f_b_near(a_n__square_print, [110, 60, 130, 80], 0.15), f_a_n__round(a_n__square_print));
    console.log(`     the square: ${f_a_n__round(a_n__square_mm)} in the picture, ${f_a_n__round(a_n__square_print)} in the print`);
    await o_page.f_click_on('#el_match_undo');
    await f_until(`JSON.parse(localStorage.getItem('paper_advent_calendar')).o_picture__front.n_px__x === 3000`);
    o_state = await f_o_state();
    f_check('Undo the match: the photo as it lay before', JSON.stringify(o_state.o_setting.o_picture__front) === JSON.stringify(o_picture__photo) && !o_state.b_undo, o_state.o_setting.o_picture__front);
    // three points on a line, then cancel; Esc
    await o_page.f_click_on('#el_match');
    o_picture = await f_o_picture();
    for(let a_n of [[600, 600], [1500, 600], [2400, 600], [1500, 1600]]){ await o_page.f_click(await f_a_n__px(f_a_n__from_px(o_picture, a_n))); }
    for(let n_idx of [0, 1, 2, 3]){ await o_page.f_click(await f_a_n__px(a_a_n__place[n_idx])); }
    o_state = await f_o_state();
    f_check('three points on a line: said, nothing laid', o_state.s_match.includes('Three of the points lie on one line') && o_state.b_bar, o_state.s_match);
    await o_page.f_click_on('#el_match_cancel');
    o_state = await f_o_state();
    f_check('Cancel: the picture as it lay before, the tools back', !o_state.b_bar && o_state.b_picture && JSON.stringify(o_state.o_setting.o_picture__front) === JSON.stringify(o_picture__photo), o_state);
    await o_page.f_click_on('#el_match');
    for(let s_type of ['keyDown', 'keyUp']){ await o_page.f_send('Input.dispatchKeyEvent', { type: s_type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); }
    await o_page.f_settle();
    o_state = await f_o_state();
    f_check('Esc cancels too', !o_state.b_bar && JSON.stringify(o_state.o_setting.o_picture__front) === JSON.stringify(o_picture__photo), o_state);

    // ---- start over, then the print: a one-coloured picture, measured from Chrome's PDF at 300 dots per inch
    await o_page.f_click_on('#el_reset');
    await f_until(`!document.querySelector('.sheet.has_picture')`);
    o_state = await f_o_state();
    f_check('Start over: the first step, the settings of the first start, no pictures', o_state.s_step__open === 'paper' && o_state.s_sheet === 'front' && JSON.stringify(o_state.o_setting) === JSON.stringify(o_setting__default) && o_state.s_sheet__has === '', o_state);
    let s_path__green = await f_s_path__picture('green.png', 600, 400, `o_context.fillStyle = '#00a050'; o_context.fillRect(0, 0, n_px__x, n_px__y);`);
    // the picture's green, not the green of the dots in the paper's corners
    let f_b_green = function(n_r, n_g, n_b){ return n_r < 40 && n_g > 135 && n_g < 185 && n_b > 60 && n_b < 100; };
    let f_b_red = function(n_r, n_g, n_b){ return n_r > 180 && n_g < 90 && n_b < 90; };
    let f_b_ink = function(n_r, n_g, n_b){ return n_r < 230 || n_g < 230 || n_b < 230; };
    await f_step('picture');
    await f_load(s_path__green, 'front');
    await f_step('output');
    f_check('step Print and cut: the dialog\'s settings and the files\' place are said', await o_page.f_v(`document.getElementById('el_print_note').textContent`) === 'In the print dialog: paper 297 × 210 mm, scale 100 %, margins none; and no fitting to the page in the printer\'s own settings.'
        && await o_page.f_v(`document.getElementById('el_file').textContent`) === 'In the cutter\'s software both files: 297 × 210 mm, the sheet of paper itself, corner on corner.', await o_page.f_v(`document.getElementById('el_file').textContent`));
    a_o_print = await o_page.f_a_o_print();
    f_check('the print: two pages of the sheet\'s size', a_o_print.length === 2 && a_o_print.every(function(o_print){ return f_b_near([o_print.n_px__x, o_print.n_px__y], [297 / 25.4 * 300, 210 / 25.4 * 300], 2); }), a_o_print.map(function(o_print){ return [o_print.n_px__x, o_print.n_px__y]; }));
    let a_n__green = f_a_n__box(a_o_print[0], f_b_green);
    f_check('the pictures: page 1 the picture with 2 of bleed, 8 to 289 and 8 to 202 mm, no cut line on it', f_b_near(a_n__green, [8, 8, 289, 202], 0.1) && !f_a_n__box(a_o_print[0], f_b_red), f_a_n__round(a_n__green));
    console.log(`     the picture: ${f_a_n__round(a_n__green)}`);
    let a_n__red = f_a_n__box(a_o_print[1], f_b_red);
    f_check('page 2, no picture: the back\'s cut lines, the calendar\'s edge 9.9 to 287.1 and 9.9 to 200.1', f_b_near(a_n__red, [9.9, 9.9, 287.1, 200.1], 0.1) && !f_a_n__box(a_o_print[1], f_b_green), f_a_n__round(a_n__red));
    f_check('crop marks and ruler line outside the calendar, from 2 to 295 mm', f_b_near(f_a_n__box(a_o_print[0], f_b_ink), [2, 2, 295, 208], 0.3), f_a_n__round(f_a_n__box(a_o_print[0], f_b_ink)));
    await o_page.f_click_on('.pick label:has([value=both])');
    a_o_print = await o_page.f_a_o_print();
    a_n__red = f_a_n__box(a_o_print[0], f_b_red);
    f_check('pictures with cut lines: the edge on the picture, 9.9 to 287.1 and 9.9 to 200.1', (await f_o_state()).o_setting.s_print === 'both' && f_b_near(a_n__red, [9.9, 9.9, 287.1, 200.1], 0.1) && Boolean(f_a_n__box(a_o_print[0], f_b_green)), f_a_n__round(a_n__red ?? []));
    console.log(`     the edge: ${f_a_n__round(a_n__red ?? [])}`);
    await o_page.f_click_on('.pick label:has([value=cut])');
    a_o_print = await o_page.f_a_o_print();
    f_check('cut lines only: no picture', !f_a_n__box(a_o_print[0], f_b_green) && Boolean(f_a_n__box(a_o_print[0], f_b_red)));
    await o_page.f_click_on('.pick label:has([value=picture])');
    await o_page.f_fill('n_mm__print_x', 1.5);
    await o_page.f_fill('n_mm__print_y', 2.5);
    a_o_print = await o_page.f_a_o_print();
    a_n__green = f_a_n__box(a_o_print[0], f_b_green);
    f_check('shift 1.5 right, 2.5 up: 9.5 to 290.5 and 5.5 to 199.5', f_b_near(a_n__green, [9.5, 5.5, 290.5, 199.5], 0.1), f_a_n__round(a_n__green));
    console.log(`     shifted: ${f_a_n__round(a_n__green)}`);
    await o_page.f_fill('n_mm__print_x', 0);
    await o_page.f_fill('n_mm__print_y', 0);
    await o_page.f_fill('n_mm__bleed', 0);
    await o_page.f_click_on('[name=b_print_guide]');
    a_o_print = await o_page.f_a_o_print();
    f_check('no bleed, no guides: the picture on the calendar and nothing else', f_b_near(f_a_n__box(a_o_print[0], f_b_ink), [10, 10, 287, 200], 0.1) && f_b_near(f_a_n__box(a_o_print[0], f_b_green), [10, 10, 287, 200], 0.1), f_a_n__round(f_a_n__box(a_o_print[0], f_b_ink)));
    await o_page.f_click_on('[name=b_print_guide]');
    await o_page.f_fill('n_mm__bleed', 2);
    await o_page.f_open();
    f_check('a reload keeps what is printed', (await f_o_state()).o_setting.s_print === 'picture' && await o_page.f_v(`document.querySelector('[name=s_print]:checked').value`) === 'picture');
    // A4 standing, the calendar off its middle
    await o_page.f_click_on('.pick label:has([value=both])');
    await f_step('paper');
    await o_page.f_fill('el_format', '210 297');
    for(let [s_name, n] of [['n_mm__calendar_x', 150], ['n_mm__calendar_y', 200], ['n_mm__left', 12.5], ['n_mm__bottom', 30]]){ await o_page.f_fill(s_name, n); }
    await f_check_fit('A4 portrait', 210 / 297);
    a_o_print = await o_page.f_a_o_print();
    a_n__red = f_a_n__box(a_o_print[0], f_b_red);
    f_check('A4 portrait, calendar 150 x 200 at 12.5 / 30: pages 210 x 297, the edge 12.4 to 162.6 and 66.9 to 267.1', f_b_near([a_o_print[0].n_px__x, a_o_print[0].n_px__y], [210 / 25.4 * 300, 297 / 25.4 * 300], 2) && f_b_near(a_n__red, [12.4, 66.9, 162.6, 267.1], 0.1), f_a_n__round(a_n__red));
    console.log(`     the edge: ${f_a_n__round(a_n__red)}`);

    // ---- the cutting files
    await f_step('output');
    o_state = await f_o_state();
    for(let s_sheet of ['front', 'back']){
        await o_page.f_click_on(`#el_download__${s_sheet}`);
        let s_svg = '';
        for(let n_try = 0; n_try < 100 && !s_svg; n_try++){
            await o_page.f_wait(50);
            s_svg = await Deno.readTextFile(`${o_page.s_path__work}/advent_calendar_${s_sheet}_veryos.svg`).catch(function(){ return ''; });
        }
        f_check(`${s_sheet} SVG: the file the module makes of the page's settings, the sheet's size`, s_svg === f_s_svg(o_state.o_setting, s_sheet) && s_svg.includes('width="210mm" height="297mm"'), s_svg.slice(0, 200));
    }

    f_check('nothing went wrong in the page', o_page.a_s_error.length === 0, o_page.a_s_error);
} finally {
    await o_page.f_close();
}
console.log(`${n_check - a_s_failed.length} of ${n_check} checks pass`);
if(a_s_failed.length){
    console.log(`failed:\n${a_s_failed.join('\n')}`);
    Deno.exit(1);
}
