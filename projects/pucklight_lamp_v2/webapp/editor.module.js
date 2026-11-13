// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The code editor of the kinds that have one, a sphere's shader and a vase's script:
// Monaco, which comes from the internet, or without it a plain text box.

import { el } from './dom.module.js';

let s_url__monaco = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min';

// f_on_change(s_text) is called when the person types, not when f_set() puts a text
// in. s_declaration tells Monaco what a JavaScript text may use.
let f_o_editor = function(el_root, f_on_change, s_declaration){
    let s_text = '';
    let s_language = 'javascript';
    let a_o_marker = [];
    let o_monaco__editor = null;
    let o_model__by_language = {};
    let el_area = null;
    let b_setting = false;

    let f_show_marker = function(){
        if(!o_monaco__editor){ return; }
        window.monaco.editor.setModelMarkers(o_monaco__editor.getModel(), 'lamp', a_o_marker.map(function(o_marker){
            return {
                severity: window.monaco.MarkerSeverity.Error, message: o_marker.s_message,
                startLineNumber: o_marker.n_line, endLineNumber: o_marker.n_line, startColumn: 1, endColumn: 1000
            };
        }));
    };

    // Puts the text and its language into whichever editor there is.
    let f_show = function(){
        b_setting = true;
        if(o_monaco__editor){
            if(!o_model__by_language[s_language]){
                o_model__by_language[s_language] = window.monaco.editor.createModel('', s_language);
            }
            let o_model = o_model__by_language[s_language];
            if(o_model.getValue() !== s_text){ o_model.setValue(s_text); }
            o_monaco__editor.setModel(o_model);
        } else if(el_area){
            el_area.value = s_text;
        }
        b_setting = false;
        f_show_marker();
    };

    let f_typed = function(s_text__new){
        if(b_setting || s_text__new === s_text){ return; }
        s_text = s_text__new;
        f_on_change(s_text);
    };

    // Without the internet there is no Monaco, but the app still works with this.
    let f_start_area = function(){
        el_area = el('textarea', { spellcheck: false });
        el_area.addEventListener('input', function(){ f_typed(el_area.value); });
        el_root.replaceChildren(el_area);
        f_show();
    };

    let f_start_monaco = function(){
        // The worker comes from another origin, so it has to start through a data URL.
        let s_worker = `self.MonacoEnvironment = {baseUrl: "${s_url__monaco}/"}; importScripts("${s_url__monaco}/vs/base/worker/workerMain.js");`;
        window.MonacoEnvironment = { getWorkerUrl: function(){ return `data:text/javascript;charset=utf-8,${encodeURIComponent(s_worker)}`; } };
        window.require.config({ paths: { vs: `${s_url__monaco}/vs` } });
        window.require(['vs/editor/editor.main'], function(){
            // A vase's script is a function's body: its return is no mistake. Without the
            // browser's own names, of which length is one: a script's length() is the
            // vector's.
            let o_javascript = window.monaco.languages.typescript.javascriptDefaults;
            o_javascript.setDiagnosticsOptions({ diagnosticCodesToIgnore: [1108] });
            o_javascript.setCompilerOptions({ ...o_javascript.getCompilerOptions(), lib: ['esnext'] });
            o_javascript.addExtraLib(s_declaration);
            o_monaco__editor = window.monaco.editor.create(el_root, {
                model: null, theme: 'vs-dark', automaticLayout: true,
                minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, tabSize: 4, lineNumbersMinChars: 3,
                wordWrap: 'on'
            });
            o_monaco__editor.onDidChangeModelContent(function(){ f_typed(o_monaco__editor.getValue()); });
            f_show();
        }, f_start_area);
    };

    if(window.require){ f_start_monaco(); } else { f_start_area(); }

    return {
        // s_language: 'javascript', or 'cpp' for a shader, which Monaco knows closest.
        f_set: function(s_language__new, s_text__new){
            s_language = s_language__new;
            s_text = s_text__new;
            a_o_marker = [];
            f_show();
        },
        f_s_text: function(){ return s_text; },
        // a_o: { n_line, s_message } each, the mistakes to mark.
        f_set_marker: function(a_o){
            a_o_marker = a_o;
            f_show_marker();
        }
    };
};

export { f_o_editor };
