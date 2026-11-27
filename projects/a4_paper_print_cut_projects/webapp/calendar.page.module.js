// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The advent calendar's part of the page: its fields in the panel, its words, and what
// the pointer does with its windows. A kind's part of the page, o_part:
//   s_step           what step 2 is called, the step of the kind's own settings
//   s_lead__picture  what step 3 says about the kind's pictures
//   o_s_html         its fields, put into the panel's places of these names: size, the
//                    pattern's size in step 1; pattern, step 2; cut, in step 4; and
//                    legend, its lines among the line colours
//   f_start          its fields are in place anew, for a design that came on screen
//   f_limit          sets the limits of its fields that follow from other fields
//   f_s_bad          what is wrong with its fields that no field says itself, in words; '' if nothing
//   f_input          a field of the panel was changed: for those of its own that are no setting
//   f_update         the settings are as the fields have them: its notes, and what it shows of its own
//   f_s_screen       what only the screen shows of the pattern on a sheet, SVG in the pattern's mm
//   f_o_drag         step 2, a press on a sheet at a_n in the pattern's mm: null, or what
//                    the pointer has taken: f_move for where it goes, f_taken for once the page is drawn
// What the page gives it, o_page: el_panel, the form; f_o_setting, the settings as
// they are; f_update, which draws the page anew; f_b_pointer, whether the pointer may
// take hold of the pattern now.

import { f_a_o_window, f_o_door } from './calendar.module.js';
import { f_s_d } from './path.module.js';

let a_s_name__own = ['n_mm__x', 'n_mm__y', 'n_mm__size_x', 'n_mm__size_y', 's_shape', 's_door'];
let o_page = null;
// the window chosen on the sheet, by its place among the windows; null for none
let n_idx__selected = null;
// the windows and their doors as the page shows them now
let a_o_window = [];
let a_o_door = [];

// What the chosen window has of its own, kept beside the grid's settings.
let f_set_own = function(o_own){
    let o_setting = o_page.f_o_setting();
    o_setting.a_o_window__own[n_idx__selected] = { ...o_setting.a_o_window__own[n_idx__selected], ...o_own };
};

let o_s_html = {
    size: `
        <div class="row"><span title="Both sheets of the calendar have this size, width × height. Smaller than the sheet of paper, and than what the printer prints of it">Size</span><span class="field"><input type="number" name="n_mm__calendar_x" aria-label="Calendar's width" min="50" max="1000" step="0.5" required><b>×</b><input type="number" name="n_mm__calendar_y" aria-label="Calendar's height" min="50" max="1000" step="0.5" required><i>mm</i></span></div>`,
    pattern: `
        <p class="lead">How many windows, how large, with which shapes and doors. On the sheet, click a window to change it alone, drag it to move it.</p>
        <div class="group">
            <h2>Grid</h2>
            <label class="row"><span>Number</span><span class="field"><input type="number" name="n_window" min="1" max="100" step="1" required><i></i></span></label>
            <label class="row"><span title="Windows in a row; the rows follow from the number">Columns</span><span class="field"><input type="number" name="n_column" min="1" max="20" step="1" required><i></i></span></label>
            <label class="row"><span title="From the calendar's edge to the field the windows are spread over">Margin</span><span class="field"><input type="number" name="n_mm__margin" min="0" step="0.5" required><i>mm</i></span></label>
            <div class="row"><span title="Every window's width × height">Size</span><span class="field"><input type="number" name="n_mm__window_x" aria-label="Windows' width" min="5" max="300" step="0.5" required><b>×</b><input type="number" name="n_mm__window_y" aria-label="Windows' height" min="5" max="300" step="0.5" required><i>mm</i></span></div>
            <label class="row"><span title="Of a rectangle's corners and an arch's foot; a corner a hinge ends in stays sharp">Corner radius</span><span class="field"><input type="number" name="n_mm__corner" min="0" max="50" step="0.5" required><i>mm</i></span></label>
            <p class="note" id="el_size"></p>
        </div>
        <div class="group">
            <h2>Shapes and doors</h2>
            <fieldset class="chips">
                <legend title="The windows get the chosen shapes, each about as often as the others. Round is a circle where width and height are equal">Shapes</legend>
                <div>
                    <label><input type="checkbox" name="a_s_shape" value="rect"><svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/></svg>Rectangle</label>
                    <label><input type="checkbox" name="a_s_shape" value="arch"><svg viewBox="0 0 16 16"><path d="M 2.5 13.5 V 8 A 5.5 5.5 0 0 1 13.5 8 V 13.5 Z"/></svg>Arch</label>
                    <label><input type="checkbox" name="a_s_shape" value="round"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5"/></svg>Round</label>
                </div>
            </fieldset>
            <fieldset class="chips">
                <legend title="The side a door turns on. Double: two leaves, hinged left and right, cut apart down the middle">Doors, hinge on the</legend>
                <div>
                    <label><input type="checkbox" name="a_s_door" value="left"><svg viewBox="0 0 16 16"><path d="M 3 2.5 H 13.5 V 13.5 H 3"/><path d="M 3.5 1.5 V 14.5" stroke-width="3"/></svg>Left</label>
                    <label><input type="checkbox" name="a_s_door" value="right"><svg viewBox="0 0 16 16"><path d="M 13 2.5 H 2.5 V 13.5 H 13"/><path d="M 12.5 1.5 V 14.5" stroke-width="3"/></svg>Right</label>
                    <label><input type="checkbox" name="a_s_door" value="top"><svg viewBox="0 0 16 16"><path d="M 2.5 3 V 13.5 H 13.5 V 3"/><path d="M 1.5 3.5 H 14.5" stroke-width="3"/></svg>Top</label>
                    <label><input type="checkbox" name="a_s_door" value="bottom"><svg viewBox="0 0 16 16"><path d="M 2.5 13 V 2.5 H 13.5 V 13"/><path d="M 1.5 12.5 H 14.5" stroke-width="3"/></svg>Bottom</label>
                    <label><input type="checkbox" name="a_s_door" value="double"><svg viewBox="0 0 16 16"><path d="M 3 2.5 H 13 M 3 13.5 H 13 M 8 2.5 V 13.5"/><path d="M 3.5 1.5 V 14.5 M 12.5 1.5 V 14.5" stroke-width="3"/></svg>Double</label>
                </div>
            </fieldset>
            <button type="button" id="el_shuffle" title="Deals the chosen shapes and doors out anew">Shuffle</button>
        </div>
        <div class="group" id="el_own_group">
            <h2 id="el_own_title">One window</h2>
            <p class="note" id="el_own_hint">None chosen. Click a window on the sheet to give it a place, size, shape and door of its own.</p>
            <fieldset id="el_own" hidden>
                <svg id="el_detail" role="img" aria-label="The window close up"></svg>
                <!-- step any: a window's place in the grid is no multiple of a step -->
                <div class="row"><span title="The window's middle, from the calendar's left edge and from its top edge">Middle</span><span class="field"><input type="number" name="own__n_mm__x" aria-label="Window's middle x" step="any"><b>/</b><input type="number" name="own__n_mm__y" aria-label="Window's middle y" step="any"><i>mm</i></span></div>
                <div class="row"><span title="This window's width × height">Size</span><span class="field"><input type="number" name="own__n_mm__size_x" aria-label="Window's width" min="5" max="300" step="0.5"><b>×</b><input type="number" name="own__n_mm__size_y" aria-label="Window's height" min="5" max="300" step="0.5"><i>mm</i></span></div>
                <label class="row"><span>Shape</span><select name="own__s_shape">
                    <option value="rect">Rectangle</option>
                    <option value="arch">Arch</option>
                    <option value="round">Round</option>
                </select></label>
                <label class="row"><span>Door, hinge</span><select name="own__s_door">
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="double">Double</option>
                </select></label>
                <button type="button" id="el_own_reset" title="Drops what this window has of its own: place, size, shape and door as the grid gives them">Back to the grid</button>
            </fieldset>
        </div>`,
    cut: `
        <p class="lead">What the knife cuts. A bridge is a tiny uncut place that holds a door shut until it is torn open; a row of cut dashes is the fold a door turns on.</p>
        <div class="group">
            <h2>Doors, front sheet</h2>
            <label class="row"><span title="Width of the uncut places that hold a door shut; 0: none">Bridge</span><span class="field"><input type="number" name="n_mm__bridge" min="0" max="5" step="0.05" required><i>mm</i></span></label>
            <label class="row"><span title="Along a door's free edge: one bridge per this length of every stretch between two corners, and one at least">A bridge every</span><span class="field"><input type="number" name="n_mm__bridge_distance" min="2" max="500" step="1" required><i>mm</i></span></label>
            <label class="row"><span title="Length of the cut dashes of the fold a door turns on; they are fitted to the fold's length">Fold dash</span><span class="field"><input type="number" name="n_mm__dash" min="0.2" max="50" step="0.1" required><i>mm</i></span></label>
            <label class="row"><span title="Uncut between the dashes of a fold, and at both its ends">Fold gap</span><span class="field"><input type="number" name="n_mm__gap" min="0.2" max="50" step="0.1" required><i>mm</i></span></label>
            <p class="note" id="el_bridge"></p>
        </div>
        <div class="group">
            <h2>Back sheet</h2>
            <label class="row"><span title="Short cuts in the back sheet that show where the windows open, for pictures drawn by hand. Off: the back's file cuts the calendar's edge and not the windows. Leave them out where the back's picture is printed: they would cut into it">Marks on the back</span><input type="checkbox" class="switch" name="b_mark"></label>
            <label class="row"><span title="How far a mark runs from a window's corner along both edges, and the length of the dashes along a curve">Mark's length</span><span class="field"><input type="number" name="n_mm__mark" min="0.5" max="20" step="0.5" required><i>mm</i></span></label>
            <label class="row"><span title="Bottom right as seen from the front: dotted and mirrored, to be read from behind">VeryOS logo on the back</span><input type="checkbox" class="switch" name="b_logo"></label>
        </div>
        <div class="group">
            <h2>Both sheets</h2>
            <label class="row"><span title="A red rectangle of the calendar's size in both files: the cut that takes the calendar out of the sheet">Calendar's edge in the files</span><input type="checkbox" class="switch" name="b_outline"></label>
        </div>`,
    legend: `
        <li><svg viewBox="0 0 30 10"><path d="M 0 5 H 13 M 15 5 H 30" stroke="#000000" stroke-width="1.5"/></svg>front: cut, the gaps are bridges</li>
        <li><svg viewBox="0 0 30 10"><path d="M 2 5 H 30" stroke="#0000ff" stroke-width="1.5" stroke-dasharray="6 4"/></svg>front: cut, the dashes of a fold</li>
        <li><svg viewBox="0 0 30 10"><path d="M 5 9 V 3 H 11 M 19 3 H 25 V 9" fill="none" stroke="#000000" stroke-width="1.5"/></svg>back: cut, marks at the windows</li>
        <li><svg viewBox="0 0 30 10"><path d="M 2 5 H 30" stroke="#808080" stroke-width="1.5" stroke-dasharray="2 2"/></svg>back: cut, the logo in dots</li>
        <li><svg viewBox="0 0 30 10"><path d="M 0 5 H 30" stroke="#ff0000" stroke-width="1.5"/></svg>the calendar's edge: cut</li>
        <li><svg viewBox="0 0 30 10"><path d="M 2 5 H 30" stroke="#303838" stroke-width="1.5" stroke-dasharray="4 3"/></svg>back: where a window opens, not cut</li>`
};

let o_part = {
    s_step: 'Windows',
    s_lead__picture: 'Pictures for each sheet, printed where the cuts will fall: the front\'s are the calendar\'s face, the back\'s show through the opened doors.',
    o_s_html,
    f_start: function(o_page__new){
        o_page = o_page__new;
        n_idx__selected = null;
        document.getElementById('el_shuffle').addEventListener('click', function(){
            o_page.f_o_setting().n_seed++;
            o_page.f_update();
        });
        document.getElementById('el_own_reset').addEventListener('click', function(){
            delete o_page.f_o_setting().a_o_window__own[n_idx__selected];
            o_page.f_update();
        });
    },
    f_limit: function(o_form){
        o_page.el_panel.elements.n_mm__margin.max = Math.floor(Math.min(o_form.n_mm__calendar_x, o_form.n_mm__calendar_y) / 2 - 1);
    },
    f_s_bad: function(o_form){
        if(!o_form.a_s_shape.length){ return 'Windows, Shapes: choose one at least'; }
        if(!o_form.a_s_door.length){ return 'Windows, Doors: choose one at least'; }
        return '';
    },
    f_input: function(el, v){
        if(el.name.startsWith('own__')){ f_set_own({ [el.name.slice(5)]: v }); }
    },
    f_update: function(){
        let o_setting = o_page.f_o_setting();
        let el_panel = o_page.el_panel;
        if(n_idx__selected !== null && n_idx__selected >= o_setting.n_window){ n_idx__selected = null; }
        a_o_window = f_a_o_window(o_setting);
        a_o_door = a_o_window.map(function(o_window){ return f_o_door(o_window, o_setting); });
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
            el_detail.innerHTML = `<g fill="none" stroke-width="${o_setting.n_mm__line}">`
                + `<path stroke="#000000" d="${o_door.a_a_o_seg__cut.map(function(a_o_seg){ return f_s_d(a_o_seg); }).join(' ')}"/>`
                + `<path stroke="#0000ff" d="${o_door.a_a_o_seg__fold.map(function(a_o_seg){ return f_s_d(a_o_seg); }).join(' ')}"/></g>`;
        }

        let f_s = function(n){ return String(+n.toFixed(2)); };
        let n_row = Math.ceil(o_setting.n_window / o_setting.n_column);
        document.getElementById('el_size').textContent = `${o_setting.n_window} windows in ${n_row} ${n_row === 1 ? 'row' : 'rows'}, `
            + `${f_s((o_setting.n_mm__calendar_x - 2 * o_setting.n_mm__margin) / o_setting.n_column)} × ${f_s((o_setting.n_mm__calendar_y - 2 * o_setting.n_mm__margin) / n_row)} mm from one to the next.`;
        let n_bridge = a_o_door.reduce(function(n, o_door){ return n + o_door.a_a_o_seg__cut.length - o_door.a_a_o_seg__chain.length; }, 0);
        document.getElementById('el_bridge').textContent = `${n_bridge} ${n_bridge === 1 ? 'bridge' : 'bridges'} in all.`;
    },
    // the calendar's edge where the files have none, where the windows open on the back
    // sheet, and the windows to take hold of
    f_s_screen: function(s_sheet){
        let o_setting = o_page.f_o_setting();
        let a_s = [];
        if(!o_setting.b_outline){ a_s.push(`<rect class="edge" width="${o_setting.n_mm__calendar_x}" height="${o_setting.n_mm__calendar_y}"/>`); }
        if(s_sheet === 'back'){
            a_s.push(...a_o_door.map(function(o_door){ return `<path class="opening" d="${f_s_d(o_door.a_o_seg__opening)} Z"/>`; }));
        }
        if(o_page.f_b_pointer()){
            a_s.push(...a_o_door.map(function(o_door, n_idx){
                return `<path class="hit${n_idx === n_idx__selected ? ' selected' : ''}" data-idx="${n_idx}" d="${f_s_d(o_door.a_o_seg__opening)} Z"/>`;
            }));
        }
        return a_s.join('');
    },
    // a click on a window chooses it, a drag moves it in steps of 0.5 mm
    f_o_drag: function(o_event, s_sheet, a_n){
        let el_hit = o_event.target.closest('.hit');
        n_idx__selected = el_hit ? Number(el_hit.dataset.idx) : null;
        if(!el_hit){ return null; }
        o_event.preventDefault();
        let a_n__window = [a_o_window[n_idx__selected].n_mm__x, a_o_window[n_idx__selected].n_mm__y];
        let b_moved = false;
        return {
            s_sheet,
            // a window chosen: its fields into view
            f_taken: function(){ document.getElementById('el_own_group').scrollIntoView({ block: 'nearest' }); },
            f_move: function(a_n__now){
                let [n_mm__x, n_mm__y] = [0, 1].map(function(n_idx){
                    return Math.round((a_n__window[n_idx] + a_n__now[n_idx] - a_n[n_idx]) * 2) / 2;
                });
                let o_window = a_o_window[n_idx__selected];
                if(n_mm__x === o_window.n_mm__x && n_mm__y === o_window.n_mm__y){ return; }
                // a window is not moved by a click: the pointer has to move it half a millimetre first
                if(!b_moved && Math.hypot(a_n__now[0] - a_n[0], a_n__now[1] - a_n[1]) < 0.5){ return; }
                b_moved = true;
                f_set_own({ n_mm__x, n_mm__y });
                o_page.f_update();
            }
        };
    }
};

export { o_part };
