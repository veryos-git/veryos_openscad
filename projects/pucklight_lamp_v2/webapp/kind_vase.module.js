// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The vase: the editor holds a script, whose f_o_p() places the corners of the layers
// above the thread. A solid for a slicer's vase mode.

import { el } from './dom.module.js';
import { f_el__group } from './control.module.js';
import { examples as o_s_example } from './vase_example.module.js';

// Waits this long after the last key before running the script, in ms.
let n_ms__typing = 400;

// What a script gets and sees, for the editor to offer and to explain: o_thread, noise,
// and vase.module.js's script_functions. And console, to look at a number.
let s_declaration = `
declare const console: {log(...data: any[]): void};
declare const o_thread: {n_radius: number, n_z: number};
declare const noise: {seed(n_seed: number): void, simplex2(x: number, y: number): number,
    simplex3(x: number, y: number, z: number): number, perlin2(x: number, y: number): number,
    perlin3(x: number, y: number, z: number): number};
${Object.getOwnPropertyNames(Math).map(function(s_name){ return `declare const ${s_name}: typeof Math.${s_name};`; }).join('\n')}
/** n - floor(n): fract(3.25) is 0.25 */
declare function fract(n: number): number;
/** From a at n = 0 to b at n = 1. */
declare function mix(a: number, b: number, n: number): number;
/** n, but not below low and not above high. */
declare function clamp(n: number, low: number, high: number): number;
/** 0 up to low, 1 from high on, smooth between. */
declare function smoothstep(low: number, high: number, n: number): number;
/** A vector: {n_x, n_y}. */
declare function vec2(n_x: number, n_y: number): {n_x: number, n_y: number};
/** A vector: {n_x, n_y, n_z}, as f_o_p() returns one. */
declare function vec3(n_x: number, n_y: number, n_z: number): {n_x: number, n_y: number, n_z: number};
/** A vector's length. */
declare function length(o: {n_x: number, n_y: number, n_z?: number}): number;
/** From one point to another. If one is a vec2, in x and y only: as seen from above. */
declare function distance(o_a: {n_x: number, n_y: number, n_z?: number}, o_b: {n_x: number, n_y: number, n_z?: number}): number;
`;

let f_o_setting__default = function(){
    return { s_code: o_s_example.template };
};

// o_app: what the page gives a kind, see client.module.js.
let f_o_kind__vase = function(o_app){
    let o_setting = null;
    let n_id__typing = 0;

    let el_control = el('div', { hidden: true });
    // The empty entry shows while the script is no example's.
    let el_example = el('select', { title: 'Puts an example’s script into the editor' }, [
        el('option', { value: '', hidden: true }),
        ...Object.keys(o_s_example).map(function(s_name){ return el('option', { value: s_name, textContent: s_name }); })
    ]);
    el_example.setAttribute('aria-label', 'Example');
    let f_s_example = function(){
        return Object.keys(o_s_example).find(function(s_name){ return o_s_example[s_name] === o_setting.s_code; }) ?? '';
    };
    el_example.addEventListener('change', function(){
        let s_name = el_example.value;
        el_example.value = f_s_example();
        // In a saved lamp the example is a change to it, to save or not.
        o_app.f_when_safe(function(){
            clearTimeout(n_id__typing);
            o_setting.s_code = o_s_example[s_name];
            el_example.value = s_name;
            o_app.o_editor.f_set('javascript', o_setting.s_code);
            o_app.f_changed(true);
        });
    });
    el_control.append(f_el__group('Script', [
        el('label', { className: 'row' }, [
            el('span', { className: 'row__top' }, [el('span', { textContent: 'Example' }), el_example]),
            el('small', { className: 'row__note', textContent: 'The script returns {n_its_layer, n_its_corner, f_o_p}: f_o_p() is called for each corner of each layer above the thread, and returns {n_x, n_y, n_z} in mm. template explains it.' })
        ])
    ]));
    o_app.el_control.append(el_control);

    return {
        s_kind: 'vase',
        s_title: 'Vase',
        s_note: 'A script places the corners of each layer: geometric shapes, for a slicer’s vase mode.',
        // White filament.
        a_n_absorb: [0.36, 0.4, 0.46],
        b_draft: false,
        b_editor: true,
        f_o_setting__default,
        f_o_setting__of_saved: function(o_saved){
            return { ...f_o_setting__default(), ...structuredClone(o_saved) };
        },
        // Puts a lamp's settings on screen: from here on they are the ones it changes.
        f_show: function(o_setting__shown){
            o_setting = o_setting__shown;
            el_example.value = f_s_example();
            o_app.o_editor.f_set('javascript', o_setting.s_code);
            el_control.hidden = false;
        },
        f_hide: function(){
            clearTimeout(n_id__typing);
            el_control.hidden = true;
        },
        // The person typed: the text is the lamp's at once, the vase follows after a pause.
        f_typed: function(s_code){
            o_setting.s_code = s_code;
            el_example.value = f_s_example();
            o_app.f_touched();
            o_app.f_set_status('Updating…');
            clearTimeout(n_id__typing);
            n_id__typing = setTimeout(o_app.f_changed, n_ms__typing);
        },
        f_o_request: function(){
            return { o_field: {}, a_o_transfer: [] };
        },
        // What to say about a vase the worker built.
        f_o_report: function(o_data){
            let o_stat = o_data.o_stat;
            o_app.o_editor.f_set_marker([]);
            return {
                a_a_s_row: [
                    ['Overhang up to', `${o_stat.n_deg__out.toFixed(0)}° at z = ${o_stat.n_z__out.toFixed(0)}`],
                    ['Leans in up to', `${o_stat.n_deg__inward.toFixed(0)}° at z = ${o_stat.n_z__inward.toFixed(0)}`]
                ],
                a_s_note: [],
                s_error: ''
            };
        },
        // A mistake in the script, with its line if the worker found it: the last good
        // vase stays.
        f_s_error: function(o_data){
            o_app.o_editor.f_set_marker(o_data.n_line ? [{ n_line: o_data.n_line, s_message: o_data.s_message }] : []);
            return `${o_data.n_line ? `line ${o_data.n_line}: ` : ''}${o_data.s_message}`;
        },
        f_s_summary: function(o_saved){
            return `Vase · script of ${o_saved.s_code.split('\n').length} lines`;
        },
        f_s_src__thumbnail: function(){ return null; }
    };
};

export { f_o_kind__vase, s_declaration };
