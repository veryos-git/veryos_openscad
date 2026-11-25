// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The saved projects: save, open, change and delete them, through serve.js, as in the
// pucklight lamp app. A project is all that is on screen, under a name, which is its
// folder's name.

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
    // a server started before it could keep projects answers with a page, not with JSON
    if(!(o_response.headers.get('content-type') ?? '').includes('json')){
        throw new Error('The app’s server is an older one. Stop it and start it again with: deno task start');
    }
    let v_data = await o_response.json();
    if(!o_response.ok){ throw Object.assign(new Error(v_data.s_message ?? `Server error ${o_response.status}`), { n_status: o_response.status }); }
    return v_data;
};

let f_s_url__of_name = function(s_name){
    return `${s_url__api}/${encodeURIComponent(s_name)}`;
};

// f_o_design: what is on screen now, as the project to save.
// f_show_design: puts a project on screen.
// o_design__new: the project the app opens with.
// f_opened: tells which project is open, by its name or null.
let f_o_panel__project = function({ el_root, f_o_design, f_show_design, o_design__new, f_opened }){
    let a_s_name = [];
    let s_name__open = null;
    // what is on screen, as it was when it was opened or saved last
    let s_design__saved = JSON.stringify(f_o_design());
    let s_name__deleting = null;
    let o_question = null;
    let s_note = '';

    let el_name = el('input', { type: 'text', className: 'project_name', maxLength: 64, placeholder: 'Name this project', autocomplete: 'off' });
    el_name.setAttribute('aria-label', 'Name of this project');
    let el_state = el('p', { className: 'project_state' });
    let el_tool = el('div');
    let el_list = el('ul', { className: 'project_list' });
    el_root.replaceChildren(el_name, el_state, el_tool, el_list);

    let f_s_name = function(){
        return el_name.value.trim();
    };
    let f_b_dirty = function(){
        return JSON.stringify(f_o_design()) !== s_design__saved || f_s_name() !== (s_name__open ?? '');
    };
    // s_design is what is saved under s_name, or what a new project starts with for null.
    let f_set_open = function(s_name, s_design){
        s_name__open = s_name;
        s_design__saved = s_design;
        f_opened(s_name);
    };

    let f_render_state = function(){
        let b_dirty = f_b_dirty();
        let s_state = s_name__open !== null ? (b_dirty ? 'Unsaved changes' : 'All changes saved') : (b_dirty ? 'Not saved yet' : 'A new project');
        if(s_name__open !== null && f_s_name() && f_s_name() !== s_name__open){
            s_state = a_s_name.includes(f_s_name())
                ? `“${f_s_name()}” is another project’s name`
                : `Save makes a new project, “${s_name__open}” stays as saved`;
        }
        el_state.textContent = s_note || s_state;
        el_state.dataset.state = s_note ? 'note' : (b_dirty ? 'dirty' : 'clean');
    };

    // Saves what is on screen under the name in the box: the open project under its own
    // name, else a new project, and the open one stays as it was saved. A project deleted
    // in the meantime, say in another window, is saved as a new one.
    let f_store = async function(s_name, s_design){
        let o_option = { headers: { 'content-type': 'application/json' }, body: s_design };
        if(s_name === s_name__open){
            try{
                return await f_v_fetched(f_s_url__of_name(s_name), { method: 'PUT', ...o_option });
            } catch(o_error){
                if(o_error.n_status !== 404){ throw o_error; }
            }
        }
        return f_v_fetched(f_s_url__of_name(s_name), { method: 'POST', ...o_option });
    };

    let f_b_saved = async function(){
        s_note = '';
        let s_name = f_s_name();
        if(!s_name){
            s_note = 'Give this project a name first.';
            f_render_state();
            el_name.focus();
            return false;
        }
        let s_design = JSON.stringify(f_o_design());
        try{
            await f_store(s_name, s_design);
        } catch(o_error){
            s_note = o_error.message;
            f_render_state();
            return false;
        }
        a_s_name = [...new Set([...a_s_name, s_name])].sort(function(s_a, s_b){ return s_a.localeCompare(s_b); });
        el_name.value = s_name;
        f_set_open(s_name, s_design);
        f_render_all();
        return true;
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

    // Puts a saved project on screen, or a new one for null.
    let f_open = async function(s_name){
        s_note = '';
        o_question = null;
        s_name__deleting = null;
        try{
            await f_show_design(s_name === null ? o_design__new : await f_v_fetched(f_s_url__of_name(s_name)));
            el_name.value = s_name ?? '';
            f_set_open(s_name, JSON.stringify(f_o_design()));
        } catch(o_error){
            s_note = o_error.message;
        }
        f_render_all();
    };

    let f_delete = async function(s_name){
        try{
            await f_v_fetched(f_s_url__of_name(s_name), { method: 'DELETE' });
        } catch(o_error){
            // Gone already, say from another window: what was asked for has happened.
            if(o_error.n_status !== 404){
                s_note = o_error.message;
                s_name__deleting = null;
                f_render_all();
                return;
            }
        }
        a_s_name = a_s_name.filter(function(s_other){ return s_other !== s_name; });
        s_name__deleting = null;
        // It stays on screen, so a slip can be undone by saving again.
        if(s_name__open === s_name){
            s_name__open = null;
            f_opened(null);
            s_note = `Deleted “${s_name}”. Save brings it back.`;
        }
        f_render_all();
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
                el('p', { textContent: s_name__open !== null ? `“${s_name__open}” has unsaved changes.` : 'This project is not saved yet.' }),
                el('div', { className: 'tool_row' }, [
                    f_el__button('Save first', async function(){
                        if(await f_b_saved()){
                            o_question = null;
                            f_render_tool();
                            f_action();
                        }
                    }),
                    f_el__button('Discard', function(){
                        o_question = null;
                        f_render_tool();
                        f_action();
                    }, 'plain'),
                    f_el__button('Cancel', function(){
                        o_question = null;
                        f_render_tool();
                    }, 'plain')
                ])
            ]));
            return;
        }
        el_tool.replaceChildren(el('div', { className: 'tool_row' }, [
            f_el__button('Save', f_b_saved),
            f_el__button('New', function(){ f_when_safe(function(){ f_open(null).then(function(){ el_name.focus(); }); }); }, 'plain')
        ]));
    };

    let f_el__row = function(s_name){
        if(s_name__deleting === s_name){
            return el('li', { className: 'project deleting' }, [
                el('p', { textContent: `Delete “${s_name}” for good, with its folder?` }),
                el('div', { className: 'tool_row' }, [
                    f_el__button('Delete', function(){ f_delete(s_name); }, 'danger'),
                    f_el__button('Keep', function(){
                        s_name__deleting = null;
                        f_render_list();
                    }, 'plain')
                ])
            ]);
        }
        let el_open = el('button', { type: 'button', className: 'open', textContent: s_name, title: `Open “${s_name}”` });
        el_open.addEventListener('click', function(){
            if(s_name !== s_name__open){ f_when_safe(function(){ f_open(s_name); }); }
        });
        let el_delete = el('button', { type: 'button', className: 'delete', textContent: '✕', title: `Delete “${s_name}”` });
        el_delete.setAttribute('aria-label', `Delete ${s_name}`);
        el_delete.addEventListener('click', function(){
            s_name__deleting = s_name;
            f_render_list();
        });
        let el_row = el('li', { className: 'project' }, [el_open, el_delete]);
        if(s_name === s_name__open){ el_row.setAttribute('aria-current', 'true'); }
        return el_row;
    };

    let f_render_list = function(){
        if(a_s_name.length === 0){
            el_list.replaceChildren(el('li', { className: 'project_empty', textContent: 'No saved projects yet.' }));
            return;
        }
        el_list.replaceChildren(...a_s_name.map(f_el__row));
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
    el_name.addEventListener('keydown', function(o_event){
        if(o_event.key === 'Enter'){
            o_event.preventDefault();
            f_b_saved();
        }
    });
    // Ctrl+S, or Cmd+S on a Mac, saves, and not the browser's own save.
    document.addEventListener('keydown', function(o_event){
        if((o_event.ctrlKey || o_event.metaKey) && o_event.key.toLowerCase() === 's'){
            o_event.preventDefault();
            f_b_saved();
        }
    });

    return {
        f_b_dirty,
        // Something on screen changed: the line under the name follows.
        f_changed: f_render_state,
        // Opens the project of that name, if there is one. Returns whether it did.
        f_b_started: async function(s_name__wanted){
            try{
                a_s_name = await f_v_fetched(s_url__api);
            } catch(o_error){
                s_note = o_error.message;
            }
            if(a_s_name.includes(s_name__wanted)){ await f_open(s_name__wanted); } else{ f_render_all(); }
            return s_name__open !== null;
        }
    };
};

export { f_o_panel__project };
