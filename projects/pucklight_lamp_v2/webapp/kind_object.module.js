// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The object: a loaded 3D object, an STL or an OBJ, as a lampshade. It is moved,
// turned and resized with a gizmo in the view; the app joins it to a stem on the neck
// and hollows it. Nothing here needs writing code.

import { el } from './dom.module.js';
import { f_el__control, f_el__group, f_el__button } from './control.module.js';
import { f_o_param__default, n_mm__base_z } from './object.module.js';
import { f_o_buffer__stl_of_tri } from './mesh_file.module.js';
import { f_o_place__default, f_a_n_rot__of_axis, f_a_n_rot__multiplied, f_a_n_mat4__of_place, f_o_bound__moved, f_o_gizmo } from './gizmo.module.js';

// The grid's step for the view: while something moves, then once settled. A print
// file has the lamp's own.
let n_mm__voxel_draft = 1.6;
let n_mm__voxel_settled = 0.8;
// How deep an object stands in the stem, so the two are one.
let n_mm__sunk = 2;
// An object whose size in its file cannot be mm is made this large.
let n_mm__size_fitted = 120;
let n_mm__size_min = 20;
let n_mm__size_max = 300;
let n_cm2__inside_warn = 3;

let a_o_control__shade = [
    { s_key: 'n_mm__wall', s_label: 'Wall', n_min: 0.8, n_max: 3, n_step: 0.1, s_unit: ' mm', n_decimal: 1, s_note: 'Thinner glows more. 0.8 is two lines of a 0.4 mm nozzle.' },
    { s_key: 'n_mm__stem', s_label: 'Stem', n_min: 0, n_max: 40, n_step: 1, s_unit: ' mm', n_decimal: 0, s_note: 'How high the neck goes on as a tube before it closes to a point. It shows only where the object is narrower.' }
];
let o_control__voxel = { s_key: 'n_mm__voxel', s_label: 'Detail', n_min: 0.3, n_max: 1.5, n_step: 0.05, s_unit: ' mm', n_decimal: 2, s_id__note: 'el_note__voxel' };

let f_o_setting__default = function(){
    return { ...f_o_param__default(), n_mm__voxel: 0.6, s_file: '', b_object: false, o_place: f_o_place__default() };
};

let f_s_triangle = function(n_cnt){
    return n_cnt >= 1e6 ? `${(n_cnt / 1e6).toFixed(2)} million` : (n_cnt >= 10000 ? `${Math.round(n_cnt / 1000)} thousand` : String(n_cnt));
};

// The area past the limit, of an area by whole degrees of overhang.
let f_n_mm2__past = function(a_n_mm2, n_deg__limit){
    let n_sum = 0;
    for(let n_deg = Math.ceil(n_deg__limit); n_deg < a_n_mm2.length; n_deg++){ n_sum += a_n_mm2[n_deg]; }
    return n_sum;
};

// o_app: what the page gives a kind, see client.module.js.
let f_o_kind__object = function(o_app){
    let o_setting = null;
    // The object's triangles as its file has them, and the middle of the box around them.
    let a_n_tri = null;
    let a_n_pivot = [0, 0, 0];
    // Since the lamp was last saved or opened, and under which name its file is kept.
    let b_object_changed = false;
    let s_name__stored = null;
    // Counts the places the object has had: a lampshade is shown once it is of the last one.
    let n_id__place = 0;
    let b_dragging = false;
    let b_shown = false;

    let f_a_n_mat4 = function(){
        return f_a_n_mat4__of_place(o_setting.o_place, a_n_pivot);
    };
    // The top of the stem's tube: an object stands a little below it.
    let f_n_z__stem = function(){
        return n_mm__base_z + o_setting.n_mm__stem;
    };

    /* ---- Controls ---- */

    let el_file = el('input', { type: 'file', accept: '.stl,.obj', hidden: true });
    let el_info = el('p', { id: 'el_object_info' });
    let el_tool = el('div', { id: 'el_object_tool', hidden: true });
    let el_source = el('div', { className: 'source source--object', hidden: true }, [
        el('header', { className: 'panel__head' }, [el('h2', { textContent: '3D object' })]),
        el('div', { className: 'source__body' }, [
            f_el__button('Load a 3D object…', function(){ el_file.click(); }, 'action action--main'),
            el_file,
            el('p', { className: 'row__note', textContent: 'An STL or an OBJ. Or drop the file onto this page.' }),
            el_info,
            el_tool
        ])
    ]);
    let el_control = el('div', { hidden: true });
    let el_slider = el('div');
    // The object's size and place as numbers, for who wants them exact.
    let f_el__number = function(s_label, n_step){
        let el_input = el('input', { type: 'number', step: n_step });
        el_input.setAttribute('aria-label', s_label);
        return el_input;
    };
    let el_size = f_el__number('Size', 1);
    let a_el_trn = ['Left and right', 'Front and back', 'Up and down'].map(function(s_label){ return f_el__number(s_label, 1); });
    let el_group__place = f_el__group('Object', [
        el('label', { className: 'row row--pair' }, [el('span', { textContent: 'Size, its longest side' }), el('span', { className: 'number' }, [el_size, ' mm'])]),
        ...a_el_trn.map(function(el_input, n_idx){
            return el('label', { className: 'row row--pair' }, [el('span', { textContent: `${el_input.getAttribute('aria-label')} (${'xyz'[n_idx]})` }), el('span', { className: 'number' }, [el_input, ' mm'])]);
        }),
        el('small', { className: 'row__note row', textContent: 'Where the object’s middle is, from the middle of the neck’s bottom.' })
    ]);
    el_control.append(el_group__place, f_el__group('Lampshade', [el_slider]));
    o_app.el_source.append(el_source);
    o_app.el_control.append(el_control);

    // The box around the object where it stands.
    let f_o_bound = function(){
        return f_o_bound__moved(a_n_tri, f_a_n_mat4());
    };
    let f_render_number = function(){
        el_group__place.hidden = !a_n_tri;
        el_tool.hidden = !a_n_tri;
        if(!a_n_tri){
            el_info.textContent = 'No object loaded yet: what shows is the stem alone.';
            return;
        }
        let o_bound = f_o_bound();
        let a_n_scl = o_bound.a_n_max.map(function(n_max, n_idx){ return n_max - o_bound.a_n_min[n_idx]; });
        el_info.textContent = `${o_setting.s_file} · ${f_s_triangle(a_n_tri.length / 9)} triangles · ${a_n_scl.map(function(n){ return n.toFixed(0); }).join(' × ')} mm`;
        if(document.activeElement !== el_size){ el_size.value = Math.max(...a_n_scl).toFixed(1); }
        a_el_trn.forEach(function(el_input, n_idx){
            if(document.activeElement !== el_input){ el_input.value = o_setting.o_place.a_n_trn[n_idx].toFixed(1); }
        });
    };

    // The object has another place: it shows as it is until its lampshade is made,
    // which happens once the place is final.
    let f_placed = function(b_final){
        n_id__place++;
        if(a_n_tri){
            o_app.o_viewer.f_set_ghost_place(f_a_n_mat4(), true);
            o_app.o_viewer.f_set_view({ b_shade: false });
        }
        o_app.f_touched();
        if(b_final){
            f_render_number();
            o_app.f_changed();
        }
    };
    let f_stand = function(){
        o_setting.o_place.a_n_trn[2] += f_n_z__stem() - n_mm__sunk - f_o_bound().a_n_min[2];
    };
    let f_centre = function(){
        let o_bound = f_o_bound();
        o_setting.o_place.a_n_trn[0] -= 0.5 * (o_bound.a_n_min[0] + o_bound.a_n_max[0]);
        o_setting.o_place.a_n_trn[1] -= 0.5 * (o_bound.a_n_min[1] + o_bound.a_n_max[1]);
    };
    // As it came: not turned, in the middle, standing on the stem. A file's numbers
    // are taken as mm, unless that would be no size for a lampshade.
    let f_fit = function(){
        o_setting.o_place = f_o_place__default();
        let o_bound = f_o_bound();
        let n_mm__size = Math.max(...o_bound.a_n_max.map(function(n_max, n_idx){ return n_max - o_bound.a_n_min[n_idx]; }));
        if(n_mm__size < n_mm__size_min || n_mm__size > n_mm__size_max){ o_setting.o_place.n_scl = n_mm__size_fitted / Math.max(n_mm__size, 1e-9); }
        f_centre();
        f_stand();
    };
    let f_turn = function(a_n_axis){
        o_setting.o_place.a_n_rot = f_a_n_rot__multiplied(f_a_n_rot__of_axis(a_n_axis, Math.PI / 2), o_setting.o_place.a_n_rot);
        f_stand();
        f_placed(true);
    };
    el_tool.append(
        el('p', { className: 'row__note', textContent: 'In the view: drag an arrow to move the object, a ring to turn it, the orange ring to resize it, its middle to move it freely.' }),
        el('div', { className: 'tool_row' }, [
            f_el__button('Turn around x', function(){ f_turn([1, 0, 0]); }),
            f_el__button('around y', function(){ f_turn([0, 1, 0]); }),
            f_el__button('around z', function(){ f_turn([0, 0, 1]); })
        ]),
        el('div', { className: 'tool_row' }, [
            f_el__button('Stand on the stem', function(){ f_stand(); f_placed(true); }),
            f_el__button('To the middle', function(){ f_centre(); f_placed(true); }),
            f_el__button('As loaded', function(){ f_fit(); f_placed(true); })
        ])
    );
    el_size.addEventListener('change', function(){
        let o_bound = f_o_bound();
        let n_mm__size = Math.max(...o_bound.a_n_max.map(function(n_max, n_idx){ return n_max - o_bound.a_n_min[n_idx]; }));
        let n_mm__wanted = Math.max(5, Math.min(1000, Number(el_size.value) || n_mm__size));
        o_setting.o_place.n_scl *= n_mm__wanted / n_mm__size;
        f_stand();
        f_placed(true);
    });
    a_el_trn.forEach(function(el_input, n_idx){
        el_input.addEventListener('change', function(){
            o_setting.o_place.a_n_trn[n_idx] = Number(el_input.value) || 0;
            f_placed(true);
        });
    });

    let o_gizmo = f_o_gizmo({
        f_o_place: function(){ return a_n_tri && o_setting ? o_setting.o_place : null; },
        f_set_place: function(o_place){
            b_dragging = true;
            o_setting.o_place = o_place;
            f_placed(false);
        },
        f_done: function(){
            b_dragging = false;
            f_placed(true);
        }
    });

    // Takes an object's triangles from the worker, or null for none.
    let f_take = function(o_loaded){
        a_n_tri = o_loaded.a_n_tri;
        if(a_n_tri){ a_n_pivot = o_loaded.a_n_min.map(function(n_min, n_idx){ return 0.5 * (n_min + o_loaded.a_n_max[n_idx]); }); }
        o_app.o_viewer.f_set_ghost(a_n_tri);
        if(!a_n_tri){
            o_app.o_viewer.f_set_ghost_place(f_a_n_mat4__of_place(f_o_place__default(), [0, 0, 0]), false);
            o_app.o_viewer.f_set_view({ b_shade: true });
        }
    };
    let f_load_file = async function(o_file){
        o_app.f_set_status(`Reading ${o_file.name}…`);
        try{
            f_take(await o_app.f_o_object(new Uint8Array(await o_file.arrayBuffer()), o_file.name));
        } catch(o_error){
            o_app.f_set_status(o_error.message, true);
            return;
        }
        o_setting.s_file = o_file.name;
        o_setting.b_object = true;
        b_object_changed = true;
        f_fit();
        n_id__place++;
        o_app.o_viewer.f_set_ghost_place(f_a_n_mat4(), true);
        o_app.o_viewer.f_set_view({ b_shade: false });
        f_render_number();
        o_app.f_changed(true);
    };
    el_file.addEventListener('change', function(){
        let [o_file] = el_file.files;
        el_file.value = '';
        if(o_file){ f_load_file(o_file); }
    });
    // A file dropped anywhere on the page, while this kind is on screen.
    document.addEventListener('dragover', function(o_evt){
        if(b_shown){ o_evt.preventDefault(); }
    });
    document.addEventListener('drop', function(o_evt){
        if(!b_shown){ return; }
        o_evt.preventDefault();
        let [o_file] = o_evt.dataTransfer?.files ?? [];
        if(o_file){ f_load_file(o_file); }
    });

    let f_s_url__object = function(s_name){
        return `/api/project/${encodeURIComponent(s_name)}/object`;
    };

    return {
        s_kind: 'object',
        s_title: 'Object',
        s_note: 'A 3D object from a file, joined to the neck and hollowed: no code needed.',
        // White filament.
        a_n_absorb: [0.36, 0.4, 0.46],
        b_draft: true,
        b_editor: false,
        f_o_setting__default,
        // A lamp saved by an older version gets the defaults of what was added since.
        f_o_setting__of_saved: function(o_saved){
            return { ...f_o_setting__default(), ...structuredClone(o_saved) };
        },
        // Puts a lamp's settings on screen: from here on they are the ones it changes.
        f_show: function(o_setting__shown){
            o_setting = o_setting__shown;
            b_shown = true;
            el_slider.replaceChildren(
                ...a_o_control__shade.map(function(o_control){
                    return f_el__control(o_control, o_setting, function(){
                        // The object stays where it is; the next lampshade is of the same place.
                        o_app.f_changed();
                    });
                }),
                f_el__control(o_control__voxel, o_setting, function(){
                    // The print file's detail does not change the lampshade on screen.
                    o_app.f_touched();
                    o_app.f_render_stat();
                })
            );
            f_render_number();
            o_app.o_viewer.f_set_tool(o_gizmo);
            n_id__place++;
            if(a_n_tri){
                o_app.o_viewer.f_set_ghost_place(f_a_n_mat4(), true);
                o_app.o_viewer.f_set_view({ b_shade: false });
            }
            el_source.hidden = false;
            el_control.hidden = false;
        },
        f_hide: function(){
            b_shown = false;
            b_dragging = false;
            o_app.o_viewer.f_set_tool(null);
            o_app.o_viewer.f_set_ghost_place(f_a_n_mat4__of_place(f_o_place__default(), [0, 0, 0]), false);
            o_app.o_viewer.f_set_view({ b_shade: true });
            el_source.hidden = true;
            el_control.hidden = true;
        },
        // What the worker needs besides the settings: where the object stands.
        f_o_request: function(o_setting__built, b_draft){
            return {
                o_field: {
                    a_n_mat4: f_a_n_mat4(),
                    n_mm__voxel: Math.max(o_setting.n_mm__voxel, b_draft ? n_mm__voxel_draft : n_mm__voxel_settled),
                    n_id__place
                },
                a_o_transfer: []
            };
        },
        // What to say about a lampshade the worker built. It is of the object's last
        // place, unless the object has moved on since: then the object itself still shows.
        f_o_report: function(o_data){
            if(o_data.n_id__place === n_id__place && !b_dragging){
                o_app.o_viewer.f_set_ghost_place(f_a_n_mat4(), false);
                o_app.o_viewer.f_set_view({ b_shade: true });
            }
            let o_stat = o_data.o_stat;
            let n_deg__limit = o_app.f_n_deg__limit();
            let n_cm2__inside = f_n_mm2__past(o_stat.a_n_mm2__inside, n_deg__limit) / 100;
            let a_a_s_row = [
                ['Filament', `${o_stat.n_gram.toFixed(0)} g`],
                ['Wall', `${o_setting.n_mm__wall.toFixed(1)} mm`],
                [`Outside past ${n_deg__limit}°`, `${(100 * f_n_mm2__past(o_stat.a_n_mm2__outside, n_deg__limit) / Math.max(o_stat.n_mm2__outside, 1)).toFixed(1)} %`],
                [`Inside past ${n_deg__limit}°`, `${n_cm2__inside.toFixed(0)} cm²`]
            ];
            let a_s_note = [];
            if(!a_n_tri){
                a_s_note.push('Load a 3D object to make a lampshade of it.');
            } else if(!o_stat.b_touching){
                a_s_note.push('The object does not touch the stem, so it is left out: move it down, or make the stem higher.');
            } else if(o_stat.n_mm3__loose > 50){
                a_s_note.push(`${(o_stat.n_mm3__loose / 1000).toFixed(1)} cm³ of the object do not hang together with the rest and are left out.`);
            }
            if(o_stat.b_touching && n_cm2__inside > n_cm2__inside_warn){
                a_s_note.push(`${n_cm2__inside.toFixed(0)} cm² of the inside overhang past ${n_deg__limit}°: turn the object, or let the slicer put supports inside. The Overhang look, cut open, shows where.`);
            }
            let el_note__voxel = document.getElementById('el_note__voxel');
            if(el_note__voxel){
                // A large object's grid cannot be as fine as a small one's.
                let n_mm__voxel = Math.max(o_setting.n_mm__voxel, o_stat.n_mm__voxel_min);
                // Triangles grow with the square of the grid getting finer.
                let n_cnt__export = o_stat.n_cnt__triangle * Math.pow(o_stat.n_mm__voxel / n_mm__voxel, 2);
                el_note__voxel.textContent = `Of the print file: what is finer than this is smoothed away. `
                    + (n_mm__voxel > o_setting.n_mm__voxel + 0.005 ? `An object this large gets ${n_mm__voxel.toFixed(2)} mm at the finest. ` : '')
                    + `The view has ${o_stat.n_mm__voxel.toFixed(1)} mm. About ${f_s_triangle(n_cnt__export)} triangles, an STL of ${Math.round(n_cnt__export * 50 / 1e6)} MB.`;
            }
            return { a_a_s_row, a_s_note, s_error: '' };
        },
        f_s_summary: function(o_saved){
            return `Object · ${o_saved.s_file || 'no file yet'}`;
        },
        f_s_src__thumbnail: function(){ return null; },
        // The object is a file of its own beside the lamp's settings.
        f_load_extra: async function(s_name, o_saved){
            let o_loaded = { a_n_tri: null };
            if(o_saved.b_object){
                let o_response = await fetch(f_s_url__object(s_name), { cache: 'no-store' });
                if(o_response.ok){ o_loaded = await o_app.f_o_object(new Uint8Array(await o_response.arrayBuffer()), o_saved.s_file); }
            }
            if(!o_loaded.a_n_tri){ await o_app.f_o_object(null, ''); }
            f_take(o_loaded);
            b_object_changed = false;
            s_name__stored = s_name;
        },
        // Written only if it is not there already: an object can be a large file.
        f_save_extra: async function(s_name){
            if(!a_n_tri){
                await fetch(f_s_url__object(s_name), { method: 'DELETE' });
            } else if(b_object_changed || s_name__stored !== s_name){
                let o_response = await fetch(f_s_url__object(s_name), { method: 'PUT', body: f_o_buffer__stl_of_tri(a_n_tri) });
                if(!o_response.ok){
                    let o_answer = await o_response.json().catch(function(){ return {}; });
                    throw new Error(o_answer.s_message ?? 'The object could not be saved: the app’s server has to be started anew for this kind of lamp.');
                }
            }
            b_object_changed = false;
            s_name__stored = s_name;
        },
        // A lamp that is no object any more gives up its file.
        f_drop_extra: async function(s_name){
            await fetch(f_s_url__object(s_name), { method: 'DELETE' });
        },
        f_reset_extra: async function(){
            f_take(await o_app.f_o_object(null, ''));
            b_object_changed = false;
            s_name__stored = null;
        },
        f_b_extra_dirty: function(){ return b_object_changed; }
    };
};

export { f_o_kind__object };
