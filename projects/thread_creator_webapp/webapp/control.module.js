// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The rows of the settings panels: sliders, tick boxes and lists, which write into the
// object they are given.

import { el } from './dom.module.js';

// One setting's row. o_control: { s_key, s_label } for a tick box; with n_min, n_max,
// n_step, s_unit and n_decimal a slider; with a_v_option a list. s_note explains it,
// s_id__note leaves room for a note that changes.
let f_el__control = function(o_control, o_target, f_on_change){
    if(o_control.a_v_option){
        let el_select = el('select', {}, o_control.a_v_option.map(function(v_option){
            return el('option', { value: String(v_option), textContent: String(v_option) });
        }));
        el_select.value = String(o_target[o_control.s_key]);
        el_select.setAttribute('aria-label', o_control.s_label);
        el_select.addEventListener('change', function(){
            let v_option = o_control.a_v_option.find(function(v){ return String(v) === el_select.value; });
            o_target[o_control.s_key] = v_option;
            f_on_change();
        });
        let a_el = [el('span', { className: 'row__top' }, [el('span', { textContent: o_control.s_label }), el_select])];
        if(o_control.s_note){ a_el.push(el('small', { className: 'row__note', textContent: o_control.s_note })); }
        return el('label', { className: 'row' }, a_el);
    }
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
    el_input.dataset.key = o_control.s_key;
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
    return el('label', { className: 'row' }, a_el);
};

// A titled group of rows.
let f_el__group = function(s_title, a_el){
    return el('div', { className: 'group' }, [el('h2', { textContent: s_title }), ...a_el]);
};

let f_el__button = function(s_text, f_on_click, s_class = 'small'){
    let el_button = el('button', { type: 'button', textContent: s_text, className: s_class });
    el_button.addEventListener('click', f_on_click);
    return el_button;
};

export { f_el__control, f_el__group, f_el__button };
