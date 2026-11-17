// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// A small graph of formulas of x, as Desmos draws them: to see what a vase script's
// sin(), mix(), fract() or noise do before they shape a vase. A formula sees what a
// script sees, so it can be copied over. The formulas and the view are this browser's,
// not the lamp's.

import { el } from './dom.module.js';
import { script_functions } from './vase.module.js';
import { noise } from './noise.module.js';

let s_key__storage = 'pucklight_lamp_graph_v1';
// One colour per row, on the panel's dark ground.
let a_s_col = ['#f0b750', '#6cb4ff', '#7bd88f', '#ff7ab2', '#b892ff', '#ff9d3c'];
// A grid line every so many px at least.
let n_px__grid = 48;
// Where y changes by more than this many px from one point to the next, the line is
// checked for a jump.
let n_px__steep = 2;

// x from -10 to 10, y as far in the canvas's 3 : 2.
let f_o_view__default = function(){
    return { n_x_min: -10, n_x_max: 10, n_y_min: -20 / 3, n_y_max: 20 / 3 };
};

// A formula as a function of x, or null for an empty one. It sees what a script sees:
// Math's functions without their "Math.", fract, mix and the others, and noise, which
// is seeded 0 before each line is drawn. "y =" in front is left out, and ^ is a power,
// as in Desmos: in a script it is ** or pow(). Throws a mistake in the formula.
let f_f_formula = function(s_formula){
    let s_expr = s_formula.replace(/^\s*y\s*=/, '').replaceAll('^', '**');
    if(!s_expr.trim()){ return null; }
    let f;
    try{
        f = new Function(...Object.keys(script_functions), 'noise', 'x', `return ${s_expr}`).bind(null, ...Object.values(script_functions), noise);
    } catch(o_error){
        // The browser closes the body with a }, which is not in the formula.
        throw new SyntaxError(o_error.message.replace("Unexpected token '}'", 'The formula ends too soon'));
    }
    // true and false count as 1 and 0, a vector as no number.
    return function(n_x){ return +f(n_x); };
};

// The grid's step for n_unit_per_px: 1, 2 or 5 times a power of ten, n_px__min px or
// more apart. And the faint lines' step between them.
let f_o_step = function(n_unit_per_px, n_px__min){
    let n_raw = n_px__min * n_unit_per_px;
    let n_pow = 10 ** Math.floor(Math.log10(n_raw));
    let n_mul = [1, 2, 5, 10].find(function(n){ return n * n_pow >= n_raw * (1 - 1e-9); });
    return { n_step: n_mul * n_pow, n_step__minor: n_mul * n_pow / (n_mul === 2 ? 4 : 5) };
};

// A number of the grid as short as its step allows: 0.30000000000000004 as 0.3.
let f_s_num = function(n, n_step){
    let n_decimal = Math.min(20, Math.max(0, -Math.floor(Math.log10(n_step) + 1e-9)));
    return String(Number(n.toFixed(n_decimal)));
};

// Whether f_n jumps between x_a and x_b instead of running steeply: halved 40 times
// towards where it changes more, a steep line comes down to nothing, a jump stays.
let f_b_jump = function(f_n, n_x_a, n_y_a, n_x_b, n_y_b, n_px_per_y){
    for(let n_it = 0; n_it < 40; n_it++){
        let n_x_mid = (n_x_a + n_x_b) / 2;
        let n_y_mid = f_n(n_x_mid);
        if(!Number.isFinite(n_y_mid)){ return true; }
        if(Math.abs(n_y_mid - n_y_a) > Math.abs(n_y_b - n_y_mid)){
            n_x_b = n_x_mid; n_y_b = n_y_mid;
        } else {
            n_x_a = n_x_mid; n_y_a = n_y_mid;
        }
    }
    return Math.abs(n_y_b - n_y_a) * n_px_per_y > 1;
};

// f_n's line on a canvas of n_w by n_h px that shows o_view, from n_cnt + 1 points
// across: pieces of [px, py, px, py, ...], broken where f_n has no number or jumps,
// as tan() and fract() do. Far off the canvas a point is held at 10 heights.
let f_a_a_n_line = function(f_n, o_view, n_w, n_h, n_cnt){
    let n_px_per_y = n_h / (o_view.n_y_max - o_view.n_y_min);
    let a_a_n = [];
    let a_n = [];
    let n_x__prev = 0, n_y__prev = 0;
    for(let n_it = 0; n_it <= n_cnt; n_it++){
        let n_x = o_view.n_x_min + (o_view.n_x_max - o_view.n_x_min) * n_it / n_cnt;
        let n_y = f_n(n_x);
        let b_break = !Number.isFinite(n_y) || (a_n.length > 0
            && Math.abs(n_y - n_y__prev) * n_px_per_y > n_px__steep
            && f_b_jump(f_n, n_x__prev, n_y__prev, n_x, n_y, n_px_per_y));
        if(b_break && a_n.length > 0){
            a_a_n.push(a_n);
            a_n = [];
        }
        if(!Number.isFinite(n_y)){ continue; }
        let n_py = Math.min(Math.max((o_view.n_y_max - n_y) * n_px_per_y, -10 * n_h), 11 * n_h);
        a_n.push(n_w * n_it / n_cnt, n_py);
        n_x__prev = n_x;
        n_y__prev = n_y;
    }
    if(a_n.length > 0){ a_a_n.push(a_n); }
    return a_a_n;
};

let f_o_saved = function(){
    try{
        let o_saved = JSON.parse(localStorage.getItem(s_key__storage));
        if(o_saved && Array.isArray(o_saved.a_s_formula) && o_saved.o_view){ return o_saved; }
    } catch(o_error){ /* Private window or cleared storage: start from the defaults. */ }
    return { a_s_formula: ['2*x', 'sin(x*x)'], o_view: f_o_view__default(), b_open: true };
};

// The graph's panel: the formulas, the canvas, and what the pointer points at.
let f_el__graph = function(){
    let o_saved = f_o_saved();
    let o_view = o_saved.o_view;
    // Per row: its text, its function or null, its mistake.
    let a_o_row = [];
    // The pointer's x over the canvas, or null.
    let n_x__hover = null;
    let o_drag = null;

    let el_list = el('div');
    let el_canvas = el('canvas');
    let el_readout = el('p', { className: 'graph__readout' });
    let o_ctx = el_canvas.getContext('2d');

    let f_save = function(){
        try{
            localStorage.setItem(s_key__storage, JSON.stringify({
                a_s_formula: a_o_row.map(function(o_row){ return o_row.s_formula; }), o_view, b_open: el_root.open
            }));
        } catch(o_error){ /* Same: nothing is lost but the convenience. */ }
    };

    let f_compile = function(o_row){
        try{
            o_row.f_n = f_f_formula(o_row.s_formula);
            o_row.s_error = '';
        } catch(o_error){
            o_row.f_n = null;
            o_row.s_error = o_error.message;
        }
    };

    // Draws the grid, the lines and the pointer's points, and says their numbers.
    let f_draw = function(){
        let n_w = el_canvas.clientWidth, n_h = el_canvas.clientHeight;
        if(!n_w || !n_h){ return; }
        let n_dpr = window.devicePixelRatio || 1;
        if(el_canvas.width !== Math.round(n_w * n_dpr) || el_canvas.height !== Math.round(n_h * n_dpr)){
            el_canvas.width = Math.round(n_w * n_dpr);
            el_canvas.height = Math.round(n_h * n_dpr);
        }
        o_ctx.setTransform(n_dpr, 0, 0, n_dpr, 0, 0);
        o_ctx.clearRect(0, 0, n_w, n_h);
        let n_px_per_x = n_w / (o_view.n_x_max - o_view.n_x_min);
        let n_px_per_y = n_h / (o_view.n_y_max - o_view.n_y_min);
        let f_n_px_x = function(n_x){ return (n_x - o_view.n_x_min) * n_px_per_x; };
        let f_n_px_y = function(n_y){ return (o_view.n_y_max - n_y) * n_px_per_y; };
        let o_step_x = f_o_step(1 / n_px_per_x, n_px__grid);
        let o_step_y = f_o_step(1 / n_px_per_y, n_px__grid);

        let f_grid = function(n_step__x, n_step__y, s_col){
            o_ctx.strokeStyle = s_col;
            o_ctx.lineWidth = 1;
            o_ctx.beginPath();
            for(let n_k = Math.ceil(o_view.n_x_min / n_step__x); n_k * n_step__x <= o_view.n_x_max; n_k++){
                let n_px = Math.round(f_n_px_x(n_k * n_step__x)) + 0.5;
                o_ctx.moveTo(n_px, 0);
                o_ctx.lineTo(n_px, n_h);
            }
            for(let n_k = Math.ceil(o_view.n_y_min / n_step__y); n_k * n_step__y <= o_view.n_y_max; n_k++){
                let n_py = Math.round(f_n_px_y(n_k * n_step__y)) + 0.5;
                o_ctx.moveTo(0, n_py);
                o_ctx.lineTo(n_w, n_py);
            }
            o_ctx.stroke();
        };
        f_grid(o_step_x.n_step__minor, o_step_y.n_step__minor, '#1d2829');
        f_grid(o_step_x.n_step, o_step_y.n_step, '#344040');

        // The axes.
        let n_px__axis_x = Math.round(f_n_px_x(0)) + 0.5;
        let n_py__axis_y = Math.round(f_n_px_y(0)) + 0.5;
        o_ctx.strokeStyle = '#b9bcb0';
        o_ctx.beginPath();
        o_ctx.moveTo(n_px__axis_x, 0);
        o_ctx.lineTo(n_px__axis_x, n_h);
        o_ctx.moveTo(0, n_py__axis_y);
        o_ctx.lineTo(n_w, n_py__axis_y);
        o_ctx.stroke();

        o_ctx.lineWidth = 2;
        o_ctx.lineJoin = 'round';
        let a_el__value = [];
        a_o_row.forEach(function(o_row, n_idx){
            if(!o_row.f_n){ return; }
            let s_col = a_s_col[n_idx % a_s_col.length];
            let a_a_n;
            try{
                noise.seed(0);
                a_a_n = f_a_a_n_line(o_row.f_n, o_view, n_w, n_h, Math.round(n_w * n_dpr));
                if(n_x__hover !== null){
                    let n_y = o_row.f_n(n_x__hover);
                    a_el__value.push(el('span', { textContent: `y${n_idx + 1} ${Number.isFinite(n_y) ? Number(n_y.toPrecision(4)) : '–'}`, style: `color: ${s_col}` }));
                    if(Number.isFinite(n_y)){
                        o_ctx.fillStyle = s_col;
                        o_ctx.beginPath();
                        o_ctx.arc(f_n_px_x(n_x__hover), f_n_px_y(n_y), 4, 0, Math.PI * 2);
                        o_ctx.fill();
                    }
                }
            } catch(o_error){
                // A name the formula does not know shows only when it runs.
                if(o_row.s_error !== o_error.message){
                    o_row.s_error = o_error.message;
                    o_row.f_show_error();
                }
                return;
            }
            if(o_row.s_error){
                o_row.s_error = '';
                o_row.f_show_error();
            }
            o_ctx.strokeStyle = s_col;
            o_ctx.beginPath();
            for(let a_n of a_a_n){
                o_ctx.moveTo(a_n[0], a_n[1]);
                for(let n_off = 2; n_off < a_n.length; n_off += 2){ o_ctx.lineTo(a_n[n_off], a_n[n_off + 1]); }
            }
            o_ctx.stroke();
        });

        // The axes' numbers, over the lines in a rim of the ground, beside the axis or at
        // the canvas's edge when the axis is off it.
        o_ctx.font = '11px system-ui, sans-serif';
        o_ctx.lineWidth = 3;
        o_ctx.strokeStyle = '#101517';
        o_ctx.fillStyle = '#b9bcb0';
        let f_label = function(s_text, n_px, n_py){
            o_ctx.strokeText(s_text, n_px, n_py);
            o_ctx.fillText(s_text, n_px, n_py);
        };
        o_ctx.textAlign = 'center';
        o_ctx.textBaseline = 'top';
        let n_py__label = Math.min(Math.max(n_py__axis_y + 3, 2), n_h - 14);
        for(let n_k = Math.ceil(o_view.n_x_min / o_step_x.n_step); n_k * o_step_x.n_step <= o_view.n_x_max; n_k++){
            if(n_k === 0){ continue; }
            f_label(f_s_num(n_k * o_step_x.n_step, o_step_x.n_step), f_n_px_x(n_k * o_step_x.n_step), n_py__label);
        }
        let b_left = n_px__axis_x > n_w - 30;
        o_ctx.textAlign = b_left ? 'right' : 'left';
        o_ctx.textBaseline = 'middle';
        let n_px__label = b_left ? n_w - 3 : Math.max(n_px__axis_x + 4, 3);
        for(let n_k = Math.ceil(o_view.n_y_min / o_step_y.n_step); n_k * o_step_y.n_step <= o_view.n_y_max; n_k++){
            if(n_k === 0){ continue; }
            f_label(f_s_num(n_k * o_step_y.n_step, o_step_y.n_step), n_px__label, f_n_px_y(n_k * o_step_y.n_step));
        }

        if(n_x__hover === null){
            el_readout.replaceChildren();
        } else {
            el_readout.replaceChildren(el('span', { textContent: `x ${Number(n_x__hover.toPrecision(4))}` }), ...a_el__value);
        }
    };

    let f_render_list = function(n_idx__focus = -1){
        el_list.replaceChildren(...a_o_row.map(function(o_row, n_idx){
            let el_input = el('input', { value: o_row.s_formula, spellcheck: false, placeholder: 'sin(x)' });
            el_input.setAttribute('aria-label', `Formula ${n_idx + 1}`);
            let el_error = el('small', { className: 'graph__error' });
            o_row.f_show_error = function(){
                el_error.textContent = o_row.s_error;
                el_input.setAttribute('aria-invalid', o_row.s_error ? 'true' : 'false');
            };
            o_row.f_show_error();
            el_input.addEventListener('input', function(){
                o_row.s_formula = el_input.value;
                f_compile(o_row);
                o_row.f_show_error();
                f_draw();
                f_save();
            });
            let el_remove = el('button', { type: 'button', className: 'graph__remove', textContent: '×', title: 'Remove this formula' });
            el_remove.addEventListener('click', function(){
                a_o_row.splice(n_idx, 1);
                f_render_list();
                f_draw();
                f_save();
            });
            if(n_idx === n_idx__focus){ requestAnimationFrame(function(){ el_input.focus(); }); }
            return el('div', {}, [
                el('div', { className: 'graph__row' }, [
                    el('i', { className: 'graph__swatch', style: `background: ${a_s_col[n_idx % a_s_col.length]}` }),
                    el('span', { textContent: `y${n_idx + 1} =` }),
                    el_input,
                    el_remove
                ]),
                el_error
            ]);
        }));
    };

    let el_add = el('button', { type: 'button', className: 'small', textContent: '+ Formula' });
    el_add.addEventListener('click', function(){
        a_o_row.push({ s_formula: '', f_n: null, s_error: '' });
        f_render_list(a_o_row.length - 1);
        f_save();
    });

    let el_root = el('details', { className: 'group graph', open: o_saved.b_open !== false }, [
        el('summary', {}, [el('h2', { textContent: 'Graph' })]),
        el_list,
        el_add,
        el_canvas,
        el_readout,
        el('small', { className: 'row__note', textContent: 'Formulas of x, with what a script has: sin(), mix(), fract(), smoothstep(), noise.simplex2() and the others. ^ is a power here, ** in a script. Drag moves, the wheel zooms, with Shift x only, with Ctrl y only; a double click goes back.' })
    ]);
    el_root.addEventListener('toggle', function(){
        f_save();
        f_draw();
    });

    // The pointer's place on the canvas as x and y.
    let f_n_x = function(n_px){ return o_view.n_x_min + (o_view.n_x_max - o_view.n_x_min) * n_px / el_canvas.clientWidth; };
    let f_n_y = function(n_py){ return o_view.n_y_max - (o_view.n_y_max - o_view.n_y_min) * n_py / el_canvas.clientHeight; };

    el_canvas.addEventListener('pointerdown', function(o_evt){
        if(o_evt.button !== 0){ return; }
        el_canvas.setPointerCapture(o_evt.pointerId);
        o_drag = { n_px: o_evt.offsetX, n_py: o_evt.offsetY, o_view: { ...o_view } };
        n_x__hover = null;
        f_draw();
    });
    el_canvas.addEventListener('pointermove', function(o_evt){
        if(o_drag){
            let n_dx = (o_evt.offsetX - o_drag.n_px) / el_canvas.clientWidth * (o_drag.o_view.n_x_max - o_drag.o_view.n_x_min);
            let n_dy = (o_evt.offsetY - o_drag.n_py) / el_canvas.clientHeight * (o_drag.o_view.n_y_max - o_drag.o_view.n_y_min);
            o_view.n_x_min = o_drag.o_view.n_x_min - n_dx;
            o_view.n_x_max = o_drag.o_view.n_x_max - n_dx;
            o_view.n_y_min = o_drag.o_view.n_y_min + n_dy;
            o_view.n_y_max = o_drag.o_view.n_y_max + n_dy;
        } else {
            n_x__hover = f_n_x(o_evt.offsetX);
        }
        f_draw();
    });
    let f_end_drag = function(){
        if(!o_drag){ return; }
        o_drag = null;
        f_save();
    };
    el_canvas.addEventListener('pointerup', f_end_drag);
    el_canvas.addEventListener('pointercancel', f_end_drag);
    el_canvas.addEventListener('pointerleave', function(){
        n_x__hover = null;
        f_draw();
    });
    // Zooms around the pointer. Chrome turns Shift + wheel into a sideways wheel.
    el_canvas.addEventListener('wheel', function(o_evt){
        o_evt.preventDefault();
        let n_delta = (o_evt.deltaY || o_evt.deltaX) * (o_evt.deltaMode === 1 ? 16 : 1);
        let n_factor = Math.exp(Math.max(-1, Math.min(1, n_delta * 0.002)));
        let n_x = f_n_x(o_evt.offsetX), n_y = f_n_y(o_evt.offsetY);
        let o_view__new = { ...o_view };
        if(!o_evt.ctrlKey){
            o_view__new.n_x_min = n_x + (o_view.n_x_min - n_x) * n_factor;
            o_view__new.n_x_max = n_x + (o_view.n_x_max - n_x) * n_factor;
        }
        if(!o_evt.shiftKey){
            o_view__new.n_y_min = n_y + (o_view.n_y_min - n_y) * n_factor;
            o_view__new.n_y_max = n_y + (o_view.n_y_max - n_y) * n_factor;
        }
        // Not so far in or out that the numbers lose their meaning.
        for(let [s_min, s_max] of [['n_x_min', 'n_x_max'], ['n_y_min', 'n_y_max']]){
            let n_range = o_view__new[s_max] - o_view__new[s_min];
            if(!(n_range > 1e-9 && n_range < 1e9)){ return; }
        }
        Object.assign(o_view, o_view__new);
        n_x__hover = n_x;
        f_draw();
        f_save();
    }, { passive: false });
    el_canvas.addEventListener('dblclick', function(){
        Object.assign(o_view, f_o_view__default());
        f_draw();
        f_save();
    });
    // Draws when the canvas gets a size: when the vase or the graph opens, or the panel changes.
    new ResizeObserver(f_draw).observe(el_canvas);

    a_o_row = o_saved.a_s_formula.map(function(s_formula){
        let o_row = { s_formula, f_n: null, s_error: '' };
        f_compile(o_row);
        return o_row;
    });
    f_render_list();
    return el_root;
};

export { f_el__graph, f_f_formula, f_o_step, f_s_num, f_a_a_n_line };
