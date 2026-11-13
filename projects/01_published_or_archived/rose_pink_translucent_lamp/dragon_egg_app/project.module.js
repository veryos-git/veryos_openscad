// The saved lamps: create, open, change and delete them, through serve.js.

import { el } from './dom.module.js';
import { f_o_param__default } from './egg.module.js';

let s_url__api = '/api/project';

let f_v_fetched = async function(s_url, o_option = {}){
    let o_response;
    try{
        o_response = await fetch(s_url, o_option);
    } catch(o_error){
        throw new Error('The app’s server is not reachable. Start it with: deno task start');
    }
    if(o_response.status === 204){ return null; }
    if(!(o_response.headers.get('content-type') ?? '').includes('json')){
        throw new Error('Saving needs the app’s own server. Start it with: deno task start');
    }
    let v_data = await o_response.json();
    if(!o_response.ok){ throw new Error(v_data.s_message ?? `Server error ${o_response.status}`); }
    return v_data;
};

let f_o_option__json = function(s_method, o_body){
    return { method: s_method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(o_body) };
};

// Settings saved by an older version get the defaults of what was added since.
let f_o_design__of_project = function(o_project){
    return {
        o_param: { ...f_o_param__default(), ...o_project.o_param },
        n_mm__cell_export: o_project.n_mm__cell_export
    };
};

// For comparing two designs, whatever order their settings are in.
let f_s_design = function(o_design){
    let a_a_v = Object.keys(o_design.o_param).sort().map(function(s_key){ return [s_key, o_design.o_param[s_key]]; });
    return JSON.stringify([a_a_v, o_design.n_mm__cell_export]);
};

// f_o_design: what is on screen now. f_open_design: puts a design on screen.
// f_new_design: puts the defaults on screen. f_opened: tells which lamp is open.
let f_o_panel__project = function({ el_root, f_o_design, f_open_design, f_new_design, f_opened, f_set_status }){
    let a_o_project = [];
    let n_id__open = null;
    let n_id__deleting = null;
    let o_question = null;
    let s_design__blank = '';
    let s_note = '';

    let el_name = el('input', { type: 'text', id: 'el_name', maxLength: 80, placeholder: 'Name this lamp', autocomplete: 'off' });
    el_name.setAttribute('aria-label', 'Name of this lamp');
    let el_state = el('p', { id: 'el_project_state' });
    let el_tool = el('div', { id: 'el_project_tool' });
    let el_list = el('ul', { id: 'el_project_list' });
    el_root.replaceChildren(el_name, el_state, el_tool, el_list);

    let f_o_project__open = function(){
        return a_o_project.find(function(o_project){ return o_project.n_id === n_id__open; }) ?? null;
    };
    let f_s_name = function(){
        return el_name.value.trim();
    };
    let f_b_dirty = function(){
        let o_open = f_o_project__open();
        if(o_open){
            return f_s_design(f_o_design()) !== f_s_design(f_o_design__of_project(o_open)) || f_s_name() !== o_open.s_name;
        }
        return f_s_design(f_o_design()) !== s_design__blank || f_s_name() !== '';
    };
    let f_set_open = function(n_id){
        n_id__open = n_id;
        f_opened(n_id);
    };

    let f_render_state = function(){
        let b_dirty = f_b_dirty();
        let s_state = f_o_project__open() ? (b_dirty ? 'Unsaved changes' : 'All changes saved') : (b_dirty ? 'Not saved yet' : 'A new lamp');
        el_state.textContent = s_note || s_state;
        el_state.dataset.state = s_note ? 'note' : (b_dirty ? 'dirty' : 'clean');
    };

    // A lamp deleted in the meantime, say in another window, is saved as a new one.
    let f_o_project__stored = async function(o_body){
        if(n_id__open !== null){
            try{
                return await f_v_fetched(`${s_url__api}/${n_id__open}`, f_o_option__json('PUT', o_body));
            } catch(o_error){
                if(!/does not exist/.test(o_error.message)){ throw o_error; }
            }
        }
        return f_v_fetched(s_url__api, f_o_option__json('POST', o_body));
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
            let o_saved = await f_o_project__stored({ s_name, ...f_o_design() });
            a_o_project = [o_saved, ...a_o_project.filter(function(o_project){ return o_project.n_id !== o_saved.n_id; })];
            f_set_open(o_saved.n_id);
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

    let f_open = function(o_project){
        s_note = '';
        o_question = null;
        n_id__deleting = null;
        f_set_open(o_project.n_id);
        el_name.value = o_project.s_name;
        f_open_design(f_o_design__of_project(o_project));
        f_render_all();
    };

    let f_new = function(){
        s_note = '';
        o_question = null;
        n_id__deleting = null;
        f_set_open(null);
        el_name.value = '';
        f_new_design();
        s_design__blank = f_s_design(f_o_design());
        f_render_all();
        el_name.focus();
    };

    let f_copy = async function(){
        s_note = '';
        let s_name = `${f_s_name() || 'Lamp'} copy`.slice(0, 80);
        try{
            let o_saved = await f_v_fetched(s_url__api, f_o_option__json('POST', { s_name, ...f_o_design() }));
            a_o_project = [o_saved, ...a_o_project];
            f_set_open(o_saved.n_id);
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
            await f_v_fetched(`${s_url__api}/${o_project.n_id}`, { method: 'DELETE' });
        } catch(o_error){
            // Gone already, say from another window: what was asked for has happened.
            if(!/does not exist/.test(o_error.message)){
                s_note = o_error.message;
                n_id__deleting = null;
                f_render_all();
                return;
            }
        }
        a_o_project = a_o_project.filter(function(o_other){ return o_other.n_id !== o_project.n_id; });
        n_id__deleting = null;
        // Its settings stay on screen, so a slip can be undone by saving again.
        if(n_id__open === o_project.n_id){
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
                            f_action();
                        }
                    }, 'small--main'),
                    f_el__button('Discard', function(){
                        o_question = null;
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
        if(n_id__open !== null){ a_el.splice(1, 0, f_el__button('Save copy', f_copy)); }
        el_tool.replaceChildren(el('div', { className: 'tool_row' }, a_el));
    };

    let f_el__row = function(o_project){
        if(n_id__deleting === o_project.n_id){
            return el('li', { className: 'project project--deleting' }, [
                el('p', { textContent: `Delete “${o_project.s_name}” for good?` }),
                el('div', { className: 'tool_row' }, [
                    f_el__button('Delete', function(){ f_delete(o_project); }, 'small--danger'),
                    f_el__button('Keep', function(){
                        n_id__deleting = null;
                        f_render_list();
                    })
                ])
            ]);
        }
        let o_design = f_o_design__of_project(o_project);
        let o_param = o_design.o_param;
        let el_open = el('button', { type: 'button', className: 'project__open', title: `Open “${o_project.s_name}”` }, [
            el('img', { src: `thumbnail/${o_param.n_id__pattern}.jpg`, alt: '', width: 40, height: 40 }),
            el('span', { className: 'project__text' }, [
                el('span', { className: 'project__name', textContent: o_project.s_name }),
                el('small', { textContent: `Pattern ${o_param.n_id__pattern} · ${o_param.n_mm__egg_scl_x} × ${o_param.n_mm__egg_scl_z} mm` })
            ])
        ]);
        el_open.addEventListener('click', function(){
            if(o_project.n_id !== n_id__open){ f_when_safe(function(){ f_open(o_project); }); }
        });
        let el_delete = el('button', { type: 'button', className: 'project__delete', textContent: '×', title: `Delete “${o_project.s_name}”` });
        el_delete.setAttribute('aria-label', `Delete ${o_project.s_name}`);
        el_delete.addEventListener('click', function(){
            n_id__deleting = o_project.n_id;
            f_render_list();
        });
        let el_row = el('li', { className: 'project' }, [el_open, el_delete]);
        if(o_project.n_id === n_id__open){ el_row.setAttribute('aria-current', 'true'); }
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
    document.addEventListener('keydown', function(o_evt){
        if((o_evt.ctrlKey || o_evt.metaKey) && o_evt.key.toLowerCase() === 's'){
            o_evt.preventDefault();
            f_b_saved();
        }
    });

    return {
        f_s_name,
        f_changed: function(){
            s_note = '';
            f_render_state();
        },
        // What was open last time opens again, with any changes that were not saved.
        f_start: async function(n_id__last, s_name__last){
            let o_blank = { o_param: f_o_param__default(), n_mm__cell_export: f_o_design().n_mm__cell_export };
            s_design__blank = f_s_design(o_blank);
            el_name.value = s_name__last ?? '';
            try{
                a_o_project = await f_v_fetched(s_url__api);
                if(a_o_project.some(function(o_project){ return o_project.n_id === n_id__last; })){
                    f_set_open(n_id__last);
                } else {
                    f_set_open(null);
                }
            } catch(o_error){
                s_note = o_error.message;
            }
            f_render_all();
        }
    };
};

export { f_o_panel__project };
