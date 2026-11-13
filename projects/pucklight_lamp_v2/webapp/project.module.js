// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The saved lamps: create, open, change, rename and delete them, through serve.js. A
// lamp is { s_name, s_kind, s_brand, o_setting }, and its name is its folder's.

import { el } from './dom.module.js';

let s_url__api = '/api/project';

let f_v_fetched = async function(s_url, o_option = {}){
    let o_response;
    try{
        o_response = await fetch(s_url, { cache: 'no-store', ...o_option });
    } catch(o_error){
        throw new Error('The app’s server is not reachable. Start it with: deno task start');
    }
    if(o_response.status === 204){ return null; }
    if(!(o_response.headers.get('content-type') ?? '').includes('json')){
        throw new Error('Saving needs the app’s own server. Start it with: deno task start');
    }
    let v_data = await o_response.json();
    if(!o_response.ok){ throw Object.assign(new Error(v_data.s_message ?? `Server error ${o_response.status}`), { n_status: o_response.status }); }
    return v_data;
};

let f_o_option__json = function(s_method, o_body){
    return { method: s_method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(o_body) };
};

let f_s_url__of_name = function(s_name){
    return `${s_url__api}/${encodeURIComponent(s_name)}`;
};

// For comparing two designs, whatever order their settings are in.
let f_s_design = function(o_design){
    return JSON.stringify(o_design, function(s_key, v_val){
        if(v_val === null || typeof v_val !== 'object' || Array.isArray(v_val)){ return v_val; }
        return Object.fromEntries(Object.keys(v_val).sort().map(function(s_k){ return [s_k, v_val[s_k]]; }));
    });
};

// f_o_design: what is on screen now, { s_kind, s_brand, o_setting }.
// f_o_design__blank: a new lamp of the kind on screen.
// f_o_design__of_project: a saved lamp's design, with the defaults of what was added
//     since it was saved.
// f_open_design, f_new_design: put a saved or a new lamp on screen.
// f_save_extra: saves what a lamp keeps beside its settings, under a name.
// f_b_extra_dirty: whether that has changed.
// f_o_row: a saved lamp's { s_summary, s_src__thumbnail, s_badge } for the list.
// f_opened: tells which lamp is open, by its name or null.
let f_o_panel__project = function({
    el_root, f_o_design, f_o_design__blank, f_o_design__of_project, f_open_design, f_new_design,
    f_save_extra, f_b_extra_dirty, f_o_row, f_opened, f_set_status
}){
    let a_o_project = [];
    let s_name__open = null;
    let s_name__deleting = null;
    let o_question = null;
    let s_note = '';

    let el_name = el('input', { type: 'text', id: 'el_name', maxLength: 64, placeholder: 'Name this lamp', autocomplete: 'off' });
    el_name.setAttribute('aria-label', 'Name of this lamp');
    let el_state = el('p', { id: 'el_project_state' });
    let el_tool = el('div', { id: 'el_project_tool' });
    let el_list = el('ul', { id: 'el_project_list' });
    el_root.replaceChildren(el_name, el_state, el_tool, el_list);

    let f_o_project__open = function(){
        return a_o_project.find(function(o_project){ return o_project.s_name === s_name__open; }) ?? null;
    };
    let f_s_name = function(){
        return el_name.value.trim();
    };
    let f_b_dirty = function(){
        let o_open = f_o_project__open();
        if(o_open){
            return f_s_design(f_o_design()) !== f_s_design(f_o_design__of_project(o_open)) || f_s_name() !== o_open.s_name || f_b_extra_dirty();
        }
        return f_s_design(f_o_design()) !== f_s_design(f_o_design__blank()) || f_s_name() !== '' || f_b_extra_dirty();
    };
    let f_set_open = function(s_name){
        s_name__open = s_name;
        f_opened(s_name);
    };

    let f_render_state = function(){
        let b_dirty = f_b_dirty();
        let s_state = f_o_project__open() ? (b_dirty ? 'Unsaved changes' : 'All changes saved') : (b_dirty ? 'Not saved yet' : 'A new lamp');
        el_state.textContent = s_note || s_state;
        el_state.dataset.state = s_note ? 'note' : (b_dirty ? 'dirty' : 'clean');
    };

    let f_sort = function(){
        a_o_project.sort(function(o_a, o_b){ return o_a.s_name.localeCompare(o_b.s_name); });
    };

    // Saves what is on screen under the name in the box: a new lamp, the open one, or
    // the open one under its new name. A lamp deleted in the meantime, say in another
    // window, is saved as a new one.
    let f_o_project__stored = async function(s_name){
        let o_design = f_o_design();
        if(s_name__open !== null){
            try{
                if(s_name !== s_name__open){ await f_v_fetched(f_s_url__of_name(s_name__open), f_o_option__json('PATCH', { s_name })); }
                return await f_v_fetched(f_s_url__of_name(s_name), f_o_option__json('PUT', o_design));
            } catch(o_error){
                if(o_error.n_status !== 404){ throw o_error; }
            }
        }
        return f_v_fetched(f_s_url__of_name(s_name), f_o_option__json('POST', o_design));
    };

    let f_b_saved = async function(){
        s_note = '';
        let s_name = f_s_name();
        if(!s_name){
            s_note = 'Give this lamp a name first.';
            f_render_state();
            el_name.focus();
            return false;
        }
        try{
            let o_saved = await f_o_project__stored(s_name);
            await f_save_extra(o_saved.s_name);
            a_o_project = [o_saved, ...a_o_project.filter(function(o_project){ return o_project.s_name !== o_saved.s_name && o_project.s_name !== s_name__open; })];
            f_sort();
            f_set_open(o_saved.s_name);
            el_name.value = o_saved.s_name;
            f_render_all();
            f_set_status(`Saved “${o_saved.s_name}”.`);
            return true;
        } catch(o_error){
            s_note = o_error.message;
            f_render_state();
            return false;
        }
    };

    // Runs an action that would replace what is on screen, asking first if that loses work.
    let f_when_safe = function(f_action){
        if(!f_b_dirty()){
            f_action();
            return;
        }
        o_question = { f_action };
        f_render_tool();
    };

    let f_open = async function(o_project){
        s_note = '';
        o_question = null;
        s_name__deleting = null;
        f_set_open(o_project.s_name);
        el_name.value = o_project.s_name;
        await f_open_design(o_project);
        f_render_all();
    };

    let f_new = async function(){
        s_note = '';
        o_question = null;
        s_name__deleting = null;
        f_set_open(null);
        el_name.value = '';
        await f_new_design();
        f_render_all();
        el_name.focus();
    };

    // A copy under the first free name: "x copy", "x copy 2", and so on.
    let f_copy = async function(){
        s_note = '';
        let s_base = `${f_s_name() || 'Lamp'} copy`.slice(0, 60);
        try{
            let o_saved = null;
            for(let n_it = 1; o_saved === null; n_it++){
                let s_name = n_it === 1 ? s_base : `${s_base} ${n_it}`;
                try{
                    o_saved = await f_v_fetched(f_s_url__of_name(s_name), f_o_option__json('POST', f_o_design()));
                } catch(o_error){
                    if(o_error.n_status !== 409 || n_it > 50){ throw o_error; }
                }
            }
            await f_save_extra(o_saved.s_name);
            a_o_project = [o_saved, ...a_o_project];
            f_sort();
            f_set_open(o_saved.s_name);
            el_name.value = o_saved.s_name;
            f_render_all();
            f_set_status(`Saved a copy as “${o_saved.s_name}”.`);
        } catch(o_error){
            s_note = o_error.message;
            f_render_state();
        }
    };

    let f_delete = async function(o_project){
        try{
            await f_v_fetched(f_s_url__of_name(o_project.s_name), { method: 'DELETE' });
        } catch(o_error){
            // Gone already, say from another window: what was asked for has happened.
            if(o_error.n_status !== 404){
                s_note = o_error.message;
                s_name__deleting = null;
                f_render_all();
                return;
            }
        }
        a_o_project = a_o_project.filter(function(o_other){ return o_other.s_name !== o_project.s_name; });
        s_name__deleting = null;
        // Its settings stay on screen, so a slip can be undone by saving again.
        if(s_name__open === o_project.s_name){
            f_set_open(null);
            s_note = `Deleted “${o_project.s_name}”. Save brings it back.`;
        }
        f_render_all();
        f_set_status(`Deleted “${o_project.s_name}”.`);
    };

    let f_el__button = function(s_text, f_on_click, s_class = ''){
        let el_button = el('button', { type: 'button', textContent: s_text, className: `small ${s_class}` });
        el_button.addEventListener('click', f_on_click);
        return el_button;
    };

    let f_render_tool = function(){
        if(o_question){
            let f_action = o_question.f_action;
            el_tool.replaceChildren(el('div', { className: 'question', role: 'alert' }, [
                el('p', { textContent: f_o_project__open() ? `“${f_o_project__open().s_name}” has unsaved changes.` : 'This lamp is not saved yet.' }),
                el('div', { className: 'tool_row' }, [
                    f_el__button('Save first', async function(){
                        if(await f_b_saved()){
                            o_question = null;
                            f_render_tool();
                            f_action();
                        }
                    }, 'small--main'),
                    f_el__button('Discard', function(){
                        o_question = null;
                        f_render_tool();
                        f_action();
                    }),
                    f_el__button('Cancel', function(){
                        o_question = null;
                        f_render_tool();
                    })
                ])
            ]));
            return;
        }
        let a_el = [
            f_el__button('Save', f_b_saved, 'small--main'),
            f_el__button('New', function(){ f_when_safe(f_new); })
        ];
        if(s_name__open !== null){ a_el.splice(1, 0, f_el__button('Save copy', f_copy)); }
        el_tool.replaceChildren(el('div', { className: 'tool_row' }, a_el));
    };

    let f_el__row = function(o_project){
        if(s_name__deleting === o_project.s_name){
            return el('li', { className: 'project project--deleting' }, [
                el('p', { textContent: `Delete “${o_project.s_name}” for good, with its folder?` }),
                el('div', { className: 'tool_row' }, [
                    f_el__button('Delete', function(){ f_delete(o_project); }, 'small--danger'),
                    f_el__button('Keep', function(){
                        s_name__deleting = null;
                        f_render_list();
                    })
                ])
            ]);
        }
        let o_row = f_o_row(o_project);
        let el_open = el('button', { type: 'button', className: 'project__open', title: `Open “${o_project.s_name}”` }, [
            o_row.s_src__thumbnail
                ? el('img', { src: o_row.s_src__thumbnail, alt: '', width: 40, height: 40, loading: 'lazy' })
                : el('span', { className: 'project__badge', textContent: o_row.s_badge }),
            el('span', { className: 'project__text' }, [
                el('span', { className: 'project__name', textContent: o_project.s_name }),
                el('small', { textContent: o_row.s_summary })
            ])
        ]);
        el_open.addEventListener('click', function(){
            if(o_project.s_name !== s_name__open){ f_when_safe(function(){ f_open(o_project); }); }
        });
        let el_delete = el('button', { type: 'button', className: 'project__delete', textContent: '×', title: `Delete “${o_project.s_name}”` });
        el_delete.setAttribute('aria-label', `Delete ${o_project.s_name}`);
        el_delete.addEventListener('click', function(){
            s_name__deleting = o_project.s_name;
            f_render_list();
        });
        let el_row = el('li', { className: 'project' }, [el_open, el_delete]);
        if(o_project.s_name === s_name__open){ el_row.setAttribute('aria-current', 'true'); }
        return el_row;
    };

    let f_render_list = function(){
        if(a_o_project.length === 0){
            el_list.replaceChildren(el('li', { className: 'project_empty', textContent: 'No saved lamps yet.' }));
            return;
        }
        el_list.replaceChildren(...a_o_project.map(f_el__row));
    };

    let f_render_all = function(){
        f_render_state();
        f_render_tool();
        f_render_list();
    };

    el_name.addEventListener('input', function(){
        s_note = '';
        f_render_state();
    });
    el_name.addEventListener('keydown', function(o_evt){
        if(o_evt.key === 'Enter'){
            o_evt.preventDefault();
            f_b_saved();
        }
    });
    // Ctrl+S, or Cmd+S on a Mac, saves, in the editor too, and not the browser's own save.
    document.addEventListener('keydown', function(o_evt){
        if((o_evt.ctrlKey || o_evt.metaKey) && o_evt.key.toLowerCase() === 's'){
            o_evt.preventDefault();
            f_b_saved();
        }
    });

    return {
        f_s_name,
        f_b_dirty,
        f_when_safe,
        // Something on screen changed: the line under the name follows.
        f_changed: function(){
            s_note = '';
            f_render_state();
        },
        // Opens the lamp of that name, if there is one. Returns whether it did.
        f_b_started: async function(s_name__wanted){
            try{
                a_o_project = await f_v_fetched(s_url__api);
            } catch(o_error){
                s_note = o_error.message;
            }
            let o_project = a_o_project.find(function(o){ return o.s_name === s_name__wanted; });
            if(o_project){
                await f_open(o_project);
                return true;
            }
            f_render_all();
            return false;
        }
    };
};

export { f_o_panel__project };
