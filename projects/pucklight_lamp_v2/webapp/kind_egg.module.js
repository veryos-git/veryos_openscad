// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The egg: a seamless tile of scales as relief on an egg, with the brand's logo
// engraved if wanted. Thick scales and thin grooves glow differently.

import { el } from './dom.module.js';
import { f_el__control, f_el__group, f_el__button } from './control.module.js';
import { f_o_param__default } from './egg.module.js';

let s_path__tile = '.gitignored/tile';
// Cell size of the mesh at the widest point: while dragging, then once settled.
let n_mm__cell_draft = 1.1;
let n_mm__cell_settled = 0.45;
let n_pct__steep_warn = 2.5;

let a_o_group = [
    {
        s_title: 'Egg',
        a_o_control: [
            { s_key: 'n_mm__egg_scl_x', s_label: 'Width', n_min: 80, n_max: 240, n_step: 1, s_unit: ' mm', n_decimal: 0 },
            { s_key: 'n_mm__egg_scl_z', s_label: 'Height, as printed', n_min: 90, n_max: 340, n_step: 1, s_unit: ' mm', n_decimal: 0 },
            { s_key: 'n_nor__point', s_label: 'Pointed end', n_min: 0, n_max: 0.2, n_step: 0.005, s_unit: '', n_decimal: 3 },
            { s_key: 'n_mm__shell', s_label: 'Thinnest wall', n_min: 0.8, n_max: 2, n_step: 0.1, s_unit: ' mm', n_decimal: 1, s_note: 'Thinner glows more.' },
            { s_key: 'n_deg__tip', s_label: 'Steepest overhang at the top', n_min: 45, n_max: 75, n_step: 1, s_unit: '°', n_decimal: 0, s_note: 'The inside overhangs this much at the very top. Lower is safer and more pointed.' }
        ]
    },
    {
        s_title: 'Scales',
        a_o_control: [
            { s_key: 'n_mm__relief', s_label: 'Relief height', n_min: 0, n_max: 5, n_step: 0.1, s_unit: ' mm', n_decimal: 1 },
            { s_key: 'n_cnt__repeat', s_label: 'Tiles around', n_min: 1, n_max: 12, n_step: 1, s_unit: '', n_decimal: 0, s_id__note: 'el_note__tile' },
            { s_key: 'n_nor__stretch', s_label: 'Stretch', n_min: 0.5, n_max: 2, n_step: 0.01, s_unit: ' ×', n_decimal: 2, s_note: 'Above 1 the rows lie closer together.' },
            { s_key: 'n_nor__shift', s_label: 'Slide up or down', n_min: 0, n_max: 1, n_step: 0.01, s_unit: '', n_decimal: 2 },
            { s_key: 'n_mm__smooth', s_label: 'Smooth fine detail', n_min: 0, n_max: 1.5, n_step: 0.05, s_unit: ' mm', n_decimal: 2, s_note: 'Softens what a 0.4 mm nozzle cannot print anyway.' },
            { s_key: 'b_flip', s_label: 'Flip the pattern upside down' }
        ]
    },
    {
        s_title: 'Logo',
        a_o_control: [
            { s_key: 'b_logo', s_label: 'Engrave the brand’s logo in the front' },
            { s_key: 'n_mm__logo_scl_y', s_label: 'Size', n_min: 14, n_max: 45, n_step: 1, s_unit: ' mm', n_decimal: 0 },
            { s_key: 'n_nor__logo_z', s_label: 'Height on the egg', n_min: 0.15, n_max: 0.8, n_step: 0.01, s_unit: '', n_decimal: 2 },
            { s_key: 'n_mm__logo_depth', s_label: 'Depth', n_min: 0.2, n_max: 1.2, n_step: 0.05, s_unit: ' mm', n_decimal: 2, s_note: 'It glows brighter the deeper it is, and leaves at least 0.4 mm of wall.' }
        ]
    },
    {
        s_title: 'Print file',
        a_o_control: [
            { s_key: 'b_vase', s_label: 'Solid egg for a slicer’s vase mode' },
            { s_key: 'n_mm__cell_export', s_label: 'Mesh detail', n_min: 0.15, n_max: 0.6, n_step: 0.01, s_unit: ' mm', n_decimal: 2, s_id__note: 'el_note__detail' }
        ]
    }
];

let f_o_setting__default = function(){
    return { ...f_o_param__default(), n_mm__cell_export: 0.4 };
};

let f_s_triangle = function(n_cnt){
    return n_cnt >= 1e6 ? `${(n_cnt / 1e6).toFixed(2)} million` : `${Math.round(n_cnt / 1000)} thousand`;
};

// The area past the limit, of an area by whole degrees of overhang.
let f_n_mm2__past = function(a_n_mm2, n_deg__limit){
    let n_sum = 0;
    for(let n_deg = Math.ceil(n_deg__limit); n_deg < a_n_mm2.length; n_deg++){ n_sum += a_n_mm2[n_deg]; }
    return n_sum;
};

// o_app: what the page gives a kind, see client.module.js.
let f_o_kind__egg = function(o_app){
    let o_setting = null;
    let a_n_id__pattern = [];

    let el_gallery = el('div', { id: 'el_gallery', role: 'listbox' });
    el_gallery.setAttribute('aria-label', 'Scale patterns');
    let el_note__gallery = el('p', { className: 'row__note', innerHTML: '<kbd>&larr;</kbd> <kbd>&rarr;</kbd> step through them.' });
    let el_source = el('div', { className: 'source', hidden: true }, [
        el('header', { className: 'panel__head' }, [el('h2', { textContent: 'Scale pattern' }), el_note__gallery]),
        el_gallery
    ]);
    let el_control = el('div', { hidden: true });
    o_app.el_source.append(el_source);
    o_app.el_control.append(el_control);

    let f_select_pattern = function(n_id, b_focus = false){
        o_setting.n_id__pattern = n_id;
        for(let el_tile of el_gallery.children){
            let b_selected = Number(el_tile.dataset.id) === n_id;
            el_tile.setAttribute('aria-selected', String(b_selected));
            if(b_selected){
                el_tile.scrollIntoView({ block: 'nearest' });
                if(b_focus){ el_tile.focus(); }
            }
        }
    };

    // The heightmaps are not in git: without them there is nothing to choose from.
    let f_load_gallery = async function(){
        let o_response = await fetch(`${s_path__tile}/index.json`).catch(function(){ return null; });
        if(!o_response?.ok){
            el_note__gallery.textContent = 'No scale patterns here: the height maps are not in git. Put seamless greyscale PNGs into webapp/.gitignored/tile and run: deno task thumbnail. Without them an egg is smooth.';
            return;
        }
        a_n_id__pattern = (await o_response.json()).map(function(o_pattern){ return o_pattern.n_id; });
        el_gallery.replaceChildren(...a_n_id__pattern.map(function(n_id){
            let el_tile = el('button', { className: 'tile', type: 'button', title: `Pattern ${n_id}` }, [
                el('img', { src: `${s_path__tile}/thumbnail/${n_id}.jpg`, alt: `Pattern ${n_id}`, loading: 'lazy', width: 80, height: 80 }),
                el('span', { textContent: String(n_id) })
            ]);
            el_tile.dataset.id = String(n_id);
            el_tile.setAttribute('role', 'option');
            el_tile.addEventListener('click', function(){
                f_select_pattern(n_id);
                o_app.f_changed();
            });
            return el_tile;
        }));
        if(o_setting){ f_select_pattern(o_setting.n_id__pattern); }
    };
    document.addEventListener('keydown', function(o_evt){
        if(el_source.hidden || a_n_id__pattern.length === 0 || o_evt.target.closest?.('input, select, textarea')
            || (o_evt.key !== 'ArrowLeft' && o_evt.key !== 'ArrowRight')){ return; }
        o_evt.preventDefault();
        let n_idx = a_n_id__pattern.indexOf(o_setting.n_id__pattern);
        let n_step = o_evt.key === 'ArrowRight' ? 1 : -1;
        f_select_pattern(a_n_id__pattern[(n_idx + n_step + a_n_id__pattern.length) % a_n_id__pattern.length], Boolean(o_evt.target.closest?.('.tile')));
        o_app.f_changed();
    });

    // The print file's detail does not change the egg on screen.
    let f_changed_detail = function(){
        o_app.f_touched();
        o_app.f_render_stat();
    };

    let f_render_control = function(){
        let el_reset = f_el__button('Back to the defaults', function(){
            Object.assign(o_setting, f_o_setting__default(), { n_id__pattern: o_setting.n_id__pattern });
            f_render_control();
            o_app.f_changed();
        }, 'action action--quiet');
        el_control.replaceChildren(
            ...a_o_group.map(function(o_group){
                return f_el__group(o_group.s_title, o_group.a_o_control.map(function(o_control){
                    return f_el__control(o_control, o_setting, o_control.s_key === 'n_mm__cell_export' ? f_changed_detail : o_app.f_changed);
                }));
            }),
            el('div', { className: 'group' }, [el_reset])
        );
    };

    return {
        s_kind: 'egg',
        s_title: 'Egg',
        s_note: 'A tile of scales as relief on an egg: a dragon egg.',
        // Translucent rose pink filament.
        a_n_absorb: [0.10, 0.70, 0.46],
        b_draft: true,
        b_editor: false,
        f_o_setting__default,
        f_o_setting__of_saved: function(o_saved){
            return { ...f_o_setting__default(), ...structuredClone(o_saved) };
        },
        f_start: f_load_gallery,
        // Puts a lamp's settings on screen: from here on they are the ones it changes.
        f_show: function(o_setting__shown){
            o_setting = o_setting__shown;
            f_render_control();
            f_select_pattern(o_setting.n_id__pattern);
            el_source.hidden = false;
            el_control.hidden = false;
        },
        f_hide: function(){
            el_source.hidden = true;
            el_control.hidden = true;
        },
        f_o_request: function(o_setting__built, b_draft){
            return { o_field: { n_mm__cell: b_draft ? n_mm__cell_draft : n_mm__cell_settled }, a_o_transfer: [] };
        },
        // What to say about an egg the worker built.
        f_o_report: function(o_data){
            let o_stat = o_data.o_stat;
            let n_deg__limit = o_app.f_n_deg__limit();
            let n_pct__outside = 100 * f_n_mm2__past(o_stat.a_n_mm2__outside, n_deg__limit) / Math.max(o_stat.n_mm2__outside, 1);
            // Scales' lips are short, so a few percent past 45 degrees is normal, on every
            // pattern. What droops is what goes well past it.
            let n_pct__steep = 100 * f_n_mm2__past(o_stat.a_n_mm2__outside, 60) / Math.max(o_stat.n_mm2__outside, 1);
            let a_a_s_row = [];
            if(o_stat.n_mm__wall_min !== null){
                a_a_s_row.push(['Filament', `${o_stat.n_gram.toFixed(0)} g`]);
                a_a_s_row.push(['Wall', `${o_stat.n_mm__wall_min.toFixed(2)} to ${o_stat.n_mm__wall_max.toFixed(2)} mm`]);
            }
            a_a_s_row.push([`Outside past ${n_deg__limit}°`, `${n_pct__outside.toFixed(1)} %`]);
            if(!o_setting.b_vase){
                a_a_s_row.push([`Inside past ${n_deg__limit}°`, `${(f_n_mm2__past(o_stat.a_n_mm2__inside, n_deg__limit) / 100).toFixed(0)} cm²`]);
            }
            let a_s_note = [];
            if(Math.abs(o_stat.n_mm__scl_z - o_setting.n_mm__egg_scl_z) > 0.5){
                a_s_note.push(`This width allows ${o_stat.n_mm__scl_z.toFixed(0)} mm of height at the least.`);
            }
            if(n_pct__steep > n_pct__steep_warn){
                a_s_note.push(`${n_pct__steep.toFixed(1)} % of the outside overhangs past 60°, so the scales’ lips may droop. Flip the pattern, lower the relief or use fewer tiles.`);
            }
            if(!o_stat.b_pattern && o_setting.n_mm__relief > 0){
                a_s_note.push(`Pattern ${o_setting.n_id__pattern} is not in webapp/.gitignored/tile: this egg is smooth.`);
            }
            let el_note__tile = document.getElementById('el_note__tile');
            if(el_note__tile){ el_note__tile.textContent = `One tile is ${o_stat.n_mm__tile_scl_x.toFixed(0)} mm wide at the widest point.`; }
            // Triangles grow with the square of the cells getting finer.
            let n_cnt__export = o_stat.n_cnt__triangle * Math.pow(o_stat.n_mm__cell / o_setting.n_mm__cell_export, 2);
            let el_note__detail = document.getElementById('el_note__detail');
            if(el_note__detail){ el_note__detail.textContent = `About ${f_s_triangle(n_cnt__export)} triangles, an STL of ${Math.round(n_cnt__export * 50 / 1e6)} MB.`; }
            return { a_a_s_row, a_s_note, s_error: '' };
        },
        f_s_summary: function(o_saved){
            return `Egg · pattern ${o_saved.n_id__pattern} · ${o_saved.n_mm__egg_scl_x} × ${o_saved.n_mm__egg_scl_z} mm`;
        },
        f_s_src__thumbnail: function(o_saved){
            return a_n_id__pattern.includes(o_saved.n_id__pattern) ? `${s_path__tile}/thumbnail/${o_saved.n_id__pattern}.jpg` : null;
        }
    };
};

export { f_o_kind__egg };
