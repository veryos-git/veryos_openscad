// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The saved projects: save, open, change and delete them, through serve.js, as in the
// pucklight lamp and paper light box apps. A project is { s_name, o_setting }, and its
// name is its folder's.

import { el } from './dom.module.js';

let s_url__api = '/api/project';

let f_s_url__project = function(s_name){
    return `${s_url__api}/${encodeURIComponent(s_name)}`;
};

// The server's answer to a request, whatever it says.
let f_o_response__server = async function(s_url, o_option = {}){
    try{
        return await fetch(s_url, { cache: 'no-store', ...o_option });
    } catch(o_error){
        throw new Error('The app’s server is not reachable. Start it with: deno task start');
    }
};

let f_v_fetched = async function(s_url, o_option = {}){
    let o_response = await f_o_response__server(s_url, o_option);
    if(o_response.status === 204){ return null; }
    // another web server, or this app's own started before it kept projects, answers with a page, not with JSON
    if(!(o_response.headers.get('content-type') ?? '').includes('json')){
        throw new Error('Projects need the app’s own server. Stop the one that runs and start it with: deno task start');
    }
    let v_data = await o_response.json();
    if(!o_response.ok){ throw Object.assign(new Error(v_data.s_message ?? `Server error ${o_response.status}`), { n_status: o_response.status }); }
    return v_data;
};

let f_o_option__json = function(s_method, o_body){
    return { method: s_method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(o_body) };
};

// For comparing two designs, whatever order their settings are in.
let f_s_design = function(o_design){
    return JSON.stringify(o_design, function(s_key, v_val){
        if(v_val === null || typeof v_val !== 'object' || Array.isArray(v_val)){ return v_val; }
        return Object.fromEntries(Object.keys(v_val).sort().map(function(s_k){ return [s_k, v_val[s_k]]; }));
    });
};

// el_box: what opens and closes around the panel; el_title: where the open project's
//     name is shown while it is closed.
// f_o_design: what is on screen now, { o_setting }.
// f_o_design__blank: a new project.
// f_o_design__of_project: a saved project's design, with the defaults of what was added
//     since it was saved.
// f_open_design, f_new_design: put a saved or a new project on screen.
// f_save_extra: saves what a project keeps beside its settings; it gets the project as
//     the server answered the save.
// f_b_extra_dirty: whether some of that is not saved.
// f_s_summary: a saved project in a few words, for the list.
// f_b_ready: whether what is on screen can be saved or replaced now.
// f_opened: tells which project is open, by its name or null.
let f_o_panel__project = function({
    el_box, el_title, el_root, f_o_design, f_o_design__blank, f_o_design__of_project, f_open_design, f_new_design,
    f_save_extra, f_b_extra_dirty, f_s_summary, f_b_ready, f_opened
}){
    let a_o_project = [];
    let s_name__open = null;
    let s_name__deleting = null;
    let o_question = null;
    let b_saving = false;
    // how often the list was changed from here: the server's list from before that is out of date
    let n_cnt__change = 0;
    let s_note = '';

    let el_name = el('input', { type: 'text', id: 'el_project_name', maxLength: 64, placeholder: 'Name this project', autocomplete: 'off' });
    el_name.setAttribute('aria-label', 'Name of this project');
    let el_state = el('p', { id: 'el_project_state' });
    let el_tool = el('div', { id: 'el_project_tool' });
    let el_list = el('ul', { id: 'el_project_list' });
    el_root.replaceChildren(el_name, el_state, el_tool, el('h2', { textContent: 'Saved projects' }), el_list);

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
        return f_s_design(f_o_design()) !== f_s_design(f_o_design__blank()) || f_s_name() !== '';
    };
    let f_set_open = function(s_name){
        s_name__open = s_name;
        f_opened(s_name);
    };
    let f_set_saved = function(o_saved){
        n_cnt__change++;
        a_o_project = [o_saved, ...a_o_project.filter(function(o_project){ return o_project.s_name !== o_saved.s_name; })];
        a_o_project.sort(function(o_a, o_b){ return o_a.s_name.localeCompare(o_b.s_name); });
    };

    let f_render_state = function(){
        let b_dirty = f_b_dirty();
        let o_open = f_o_project__open();
        let s_state = o_open ? (b_dirty ? 'Unsaved changes' : 'All changes saved') : (b_dirty ? 'Not saved yet' : 'A new project');
        if(o_open && f_s_name() && f_s_name() !== o_open.s_name){
            s_state = a_o_project.some(function(o_project){ return o_project.s_name === f_s_name(); })
                ? `“${f_s_name()}” is another project’s name`
                : `Save makes a new project, “${o_open.s_name}” stays as saved`;
        }
        el_state.textContent = s_note || s_state;
        el_state.dataset.state = s_note ? 'note' : (b_dirty ? 'dirty' : 'clean');
        el_title.textContent = o_open ? o_open.s_name : (b_dirty ? 'not saved' : 'new');
        el_title.dataset.state = b_dirty ? 'dirty' : 'clean';
    };

    // Saves what is on screen under the name in the box: the open project under its own
    // name, else a new project, and the open one stays as it was saved. A project deleted
    // in the meantime, say in another window, is saved as a new one.
    let f_b_saved = async function(){
        if(b_saving || !f_b_ready()){ return false; }
        s_note = '';
        let s_name = f_s_name();
        if(!s_name){
            s_note = 'Give this project a name first.';
            el_box.open = true;
            f_render_state();
            el_name.focus();
            return false;
        }
        b_saving = true;
        try{
            let o_saved = null;
            if(s_name === s_name__open){
                try{
                    o_saved = await f_v_fetched(f_s_url__project(s_name), f_o_option__json('PUT', f_o_design()));
                } catch(o_error){
                    if(o_error.n_status !== 404){ throw o_error; }
                }
            }
            if(o_saved === null){ o_saved = await f_v_fetched(f_s_url__project(s_name), f_o_option__json('POST', f_o_design())); }
            // open from here on: if what it keeps beside its settings fails, Save tries that again
            f_set_saved(o_saved);
            f_set_open(o_saved.s_name);
            el_name.value = o_saved.s_name;
            await f_save_extra(o_saved);
        } catch(o_error){
            s_note = o_error.message;
            el_box.open = true;
        }
        b_saving = false;
        f_render_all();
        return !s_note;
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

    // Puts a saved project on screen, as the server has it now.
    let f_open = async function(s_name){
        s_note = '';
        o_question = null;
        s_name__deleting = null;
        try{
            let o_project = await f_v_fetched(f_s_url__project(s_name));
            await f_open_design(o_project);
            f_set_saved(o_project);
            el_name.value = o_project.s_name;
            f_set_open(o_project.s_name);
            el_box.open = false;
        } catch(o_error){
            s_note = o_error.message;
        }
        f_render_all();
    };

    let f_new = async function(){
        s_note = '';
        o_question = null;
        s_name__deleting = null;
        el_name.value = '';
        await f_new_design();
        f_set_open(null);
        el_box.open = false;
        f_render_all();
    };

    let f_delete = async function(o_project){
        try{
            await f_v_fetched(f_s_url__project(o_project.s_name), { method: 'DELETE' });
        } catch(o_error){
            // Gone already, say from another window: what was asked for has happened.
            if(o_error.n_status !== 404){
                s_note = o_error.message;
                s_name__deleting = null;
                f_render_all();
                return;
            }
        }
        n_cnt__change++;
        a_o_project = a_o_project.filter(function(o_other){ return o_other.s_name !== o_project.s_name; });
        s_name__deleting = null;
        // It stays on screen, so a slip can be undone by saving again.
        if(s_name__open === o_project.s_name){
            f_set_open(null);
            s_note = `Deleted “${o_project.s_name}”. Save brings it back.`;
        }
        f_render_all();
    };

    // The saved projects as the server has them now; the open one may be gone from them.
    let f_refresh = async function(){
        let n_cnt__before = n_cnt__change;
        let a_o_project__now;
        try{
            a_o_project__now = await f_v_fetched(s_url__api);
        } catch(o_error){
            s_note = o_error.message;
            f_render_all();
            return;
        }
        if(n_cnt__change !== n_cnt__before){ return; }
        a_o_project = a_o_project__now;
        if(s_name__open !== null && !f_o_project__open()){
            s_note = `“${s_name__open}” is not among the saved projects any more. Save brings it back.`;
            f_set_open(null);
        }
        f_render_all();
    };

    let f_el__button = function(s_text, f_on_click, s_class = ''){
        let el_button = el('button', { type: 'button', textContent: s_text, className: s_class });
        el_button.addEventListener('click', f_on_click);
        return el_button;
    };

    let f_render_tool = function(){
        if(o_question){
            let f_action = o_question.f_action;
            el_tool.replaceChildren(el('div', { className: 'question', role: 'alert' }, [
                el('p', { textContent: f_o_project__open() ? `“${f_o_project__open().s_name}” has unsaved changes.` : 'This project is not saved yet.' }),
                el('div', { className: 'tool_row' }, [
                    f_el__button('Save first', async function(){
                        if(await f_b_saved()){
                            o_question = null;
                            f_render_tool();
                            f_action();
                        }
                    }, 'main'),
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
        el_tool.replaceChildren(el('div', { className: 'tool_row' }, [
            f_el__button('Save', f_b_saved, 'main'),
            f_el__button('New', function(){ f_when_safe(f_new); })
        ]));
    };

    let f_el__row = function(o_project){
        if(s_name__deleting === o_project.s_name){
            return el('li', { className: 'project project--deleting' }, [
                el('p', { textContent: `Delete “${o_project.s_name}” for good, with its folder?` }),
                el('div', { className: 'tool_row' }, [
                    f_el__button('Delete', function(){ f_delete(o_project); }, 'danger'),
                    f_el__button('Keep', function(){
                        s_name__deleting = null;
                        f_render_list();
                    })
                ])
            ]);
        }
        let b_open = o_project.s_name === s_name__open;
        let el_open = el('button', { type: 'button', className: 'project__open', title: b_open ? `“${o_project.s_name}” as it was saved` : `Open “${o_project.s_name}”` }, [
            el('span', { className: 'project__name', textContent: o_project.s_name }),
            el('small', { textContent: f_s_summary(o_project) })
        ]);
        el_open.addEventListener('click', function(){
            // the open one again: back to what was saved
            if(!b_open || f_b_dirty()){ f_when_safe(function(){ f_open(o_project.s_name); }); }
        });
        let el_delete = el('button', { type: 'button', className: 'project__delete', textContent: '×', title: `Delete “${o_project.s_name}”` });
        el_delete.setAttribute('aria-label', `Delete ${o_project.s_name}`);
        el_delete.addEventListener('click', function(){
            s_name__deleting = o_project.s_name;
            f_render_list();
        });
        let el_row = el('li', { className: 'project' }, [el_open, el_delete]);
        if(b_open){ el_row.setAttribute('aria-current', 'true'); }
        return el_row;
    };

    let f_render_list = function(){
        if(a_o_project.length === 0){
            el_list.replaceChildren(el('li', { className: 'project_empty', textContent: 'None yet.' }));
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
    // Opened, the list is the server's of that moment: another window may have saved or deleted.
    el_box.addEventListener('toggle', function(){
        if(el_box.open){ f_refresh(); }
    });
    f_render_all();

    return {
        // Something on screen changed: the line under the name follows.
        f_changed: f_render_state,
        // The page starts with what it kept in the browser: the project of that name is
        // the open one, if it is still among the saved ones.
        f_start: function(s_name){
            s_name__open = s_name;
            el_name.value = s_name ?? '';
            return f_refresh();
        }
    };
};

export { f_o_panel__project, f_o_response__server, f_s_url__project };
