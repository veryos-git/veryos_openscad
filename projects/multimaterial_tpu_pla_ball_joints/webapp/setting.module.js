// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The settings of the joint script, read from its Customizer comments, so that the app
// follows the script: a group per /* [title] */, a setting per assignment in it, the
// comment lines above an assignment its help, // [..] after it its range or choices.
// Everything from /* [Hidden] */ on is left out.

let f_v__from_scad = function(s){
    s = s.trim();
    if(s === 'true' || s === 'false'){ return s === 'true'; }
    if(/^"(?:[^"\\]|\\.)*"$/.test(s)){ return JSON.parse(s); }
    let n = Number(s);
    return Number.isFinite(n) && s !== '' ? n : undefined;
};

// [3:0.5:16] or [3:16] is a range; [a:Label A,b] are choices, each value with an optional label.
let f_o_spec = function(s_spec, v_default){
    let a_s = s_spec.split(':');
    if(typeof v_default === 'number' && (a_s.length === 2 || a_s.length === 3) && a_s.every(function(s){ return f_v__from_scad(s) !== undefined; })){
        let a_n = a_s.map(Number);
        return { s_kind: 'number', n_min: a_n[0], n_step: a_n.length === 3 ? a_n[1] : 1, n_max: a_n[a_n.length - 1] };
    }
    let a_o_option = s_spec.split(',').map(function(s_option){
        let n_idx = s_option.indexOf(':');
        let s_value = n_idx < 0 ? s_option.trim() : s_option.slice(0, n_idx).trim();
        return { v: typeof v_default === 'number' ? Number(s_value) : s_value, s_label: n_idx < 0 ? s_value : s_option.slice(n_idx + 1).trim() };
    });
    return { s_kind: 'choice', a_o_option };
};

let f_a_o_group__from_scad = function(s_scad){
    let a_o_group = [];
    let a_s__help = [];
    for(let s_line of s_scad.split('\n')){
        let s = s_line.trim();
        let a_s__group = s.match(/^\/\*\s*\[(.+?)\]\s*\*\/$/);
        if(a_s__group){
            if(a_s__group[1] === 'Hidden'){ break; }
            a_o_group.push({ s_title: a_s__group[1].replace(/^\d+\s*-\s*/, ''), a_o_setting: [] });
            a_s__help = [];
            continue;
        }
        if(!a_o_group.length){ continue; }
        let a_s__comment = s.match(/^\/\/\s?(.*)$/);
        if(a_s__comment){ a_s__help.push(a_s__comment[1]); continue; }
        let a_s__set = s.match(/^([A-Za-z_]\w*)\s*=\s*([^;]+);\s*(?:\/\/\s*\[(.*)\])?\s*$/);
        if(a_s__set){
            let v_default = f_v__from_scad(a_s__set[2]);
            if(v_default !== undefined){
                let o_spec = a_s__set[3] !== undefined ? f_o_spec(a_s__set[3], v_default)
                    : { s_kind: typeof v_default === 'boolean' ? 'bool' : (typeof v_default === 'number' ? 'number' : 'text') };
                a_o_group[a_o_group.length - 1].a_o_setting.push({ s_name: a_s__set[1], v_default, s_help: a_s__help.join(' '), ...o_spec });
            }
        }
        a_s__help = [];
    }
    return a_o_group;
};

// The value checked against its setting: the value, or a message saying what is wrong.
let f_o_checked = function(o_setting, v){
    if(o_setting.s_kind === 'bool'){
        return typeof v === 'boolean' ? { v } : { s_error: `${o_setting.s_name} must be true or false` };
    }
    if(o_setting.s_kind === 'choice'){
        return o_setting.a_o_option.some(function(o_option){ return o_option.v === v; })
            ? { v } : { s_error: `${o_setting.s_name} must be one of ${o_setting.a_o_option.map(function(o){ return o.v; }).join(', ')}` };
    }
    if(o_setting.s_kind === 'number'){
        if(typeof v !== 'number' || !Number.isFinite(v)){ return { s_error: `${o_setting.s_name} must be a number` }; }
        if(o_setting.n_min !== undefined && (v < o_setting.n_min - 1e-9 || v > o_setting.n_max + 1e-9)){
            return { s_error: `${o_setting.s_name} must be from ${o_setting.n_min} to ${o_setting.n_max}` };
        }
        return { v };
    }
    return { s_error: `${o_setting.s_name} cannot be set here` };
};

// OpenSCAD's -D arguments for the settings in o_v__by_name; the others keep the script's
// defaults. Throws on a name the script does not have or a value out of its range.
let f_a_s_define = function(a_o_group, o_v__by_name){
    let o_setting__by_name = {};
    for(let o_group of a_o_group){
        for(let o_setting of o_group.a_o_setting){ o_setting__by_name[o_setting.s_name] = o_setting; }
    }
    let a_s = [];
    for(let [s_name, v] of Object.entries(o_v__by_name)){
        let o_setting = o_setting__by_name[s_name];
        if(!o_setting){ throw new Error(`the script has no setting ${s_name}`); }
        let o_checked = f_o_checked(o_setting, v);
        if(o_checked.s_error){ throw new Error(o_checked.s_error); }
        a_s.push('-D', `${s_name}=${typeof v === 'string' ? JSON.stringify(v) : String(v)}`);
    }
    return a_s;
};

export {
    f_a_o_group__from_scad,
    f_o_checked,
    f_a_s_define
};
