// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import {
    f_o_property,
    f_o_model,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__params,
    f_a_s_error__invalid_model_instance,
    f_o_model__from_params,
    f_o_model_prop__default_id,
    f_o_model_prop__timestamp_default,
    f_o_model_instance,
    f_o_example_instance_connected_cricular_from_o_model,
    f_apply_crud_to_a_o,
    f_o_logmsg,
    f_o_wsmsg_def,
    f_o_wsmsg,
    f_o_relation_map__from_a_o_model,
    f_denormalize_o_state,
    f_denormalize_o_instance,
} from "@apn/websersocketgui/constructors_framework"

let s_name_prop_ts_created = 'n_ts_ms_created';
let s_name_prop_ts_updated = 'n_ts_ms_updated';
let s_name_prop_id = 'n_id';


let o_model__o_project = f_o_model({
    s_name: 'o_project',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('s_title', 'string', (s)=>{return s!==''}),
        f_o_property('s_description', 'string'),
        f_o_property('s_hashtag', 'string'),
        f_o_property('s_status', 'string'),
        f_o_property('s_path__scad', 'string'),
        f_o_property('s_path__3mf', 'string'),
        f_o_property('s_path__stl', 'string'),
        f_o_property('s_path__thumbnail', 'string'),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

let o_model__o_wsclient = f_o_model({
    s_name: 'o_wsclient',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('s_ip', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})
let o_model__o_fsnode = f_o_model({
    s_name: 'o_fsnode',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_model_prop__default_id('n_o_fsnode_n_id'),
        f_o_property('n_bytes', 'number'),
        f_o_property('s_name', 'string', (s)=>{return s!==''}),
        f_o_property('s_path_absolute', 'string', (s)=>{return s!==''}),
        f_o_property('b_folder', 'boolean', (b)=>{return typeof b === 'boolean'}),
        f_o_property('b_image', 'boolean'),
        f_o_property('b_video', 'boolean'),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});
let o_model__o_keyvalpair = f_o_model({
    // a generic key-value pair model that ca be used for
    // config data
    // temporary data storage
    s_name: 'o_keyvalpair',
    a_o_property: [
        f_o_model_prop__default_id('n_id'),
        f_o_property('s_key', 'string', (s)=>{return s!==''}, true),
        f_o_property('s_value', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});


let s_o_logmsg_s_type__log = 'log';
let s_o_logmsg_s_type__error = 'error';
let s_o_logmsg_s_type__warn = 'warn';
let s_o_logmsg_s_type__info = 'info';
let s_o_logmsg_s_type__debug = 'debug';
let s_o_logmsg_s_type__table = 'table';


let a_o_model = [
    o_model__o_project,
    o_model__o_wsclient,
    o_model__o_fsnode,
    o_model__o_keyvalpair,
];



// message type definitions
let o_wsmsg__deno_copy_file = f_o_wsmsg_def('deno_copy_file', false);
let o_wsmsg__deno_stat = f_o_wsmsg_def('deno_stat', false);
let o_wsmsg__deno_mkdir = f_o_wsmsg_def('deno_mkdir', false);
let o_wsmsg__f_v_crud__indb = f_o_wsmsg_def('f_v_crud__indb', true);
let o_wsmsg__f_delete_table_data = f_o_wsmsg_def('f_delete_table_data', true);
let o_wsmsg__f_a_o_fsnode = f_o_wsmsg_def('f_a_o_fsnode', true);
let o_wsmsg__logmsg = f_o_wsmsg_def('logmsg', false);
let o_wsmsg__set_state_data = f_o_wsmsg_def('set_state_data', false);
let o_wsmsg__syncdata = f_o_wsmsg_def('syncdata', true);
let o_wsmsg__upload_file = f_o_wsmsg_def('upload_file', true);
let o_wsmsg__run_openscad = f_o_wsmsg_def('run_openscad', true);
let o_wsmsg__render_thumbnail_3mf = f_o_wsmsg_def('render_thumbnail_3mf', true);

// client implementations
o_wsmsg__logmsg.f_v_client_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    let o_logmsg = o_wsmsg.v_data;
    if(o_logmsg.b_consolelog){
        console[o_logmsg.s_type](o_logmsg.s_message);
    }
    if(o_logmsg.b_guilog){
        o_logmsg.n_ts_ms_created = o_logmsg.n_ts_ms_created || Date.now();
        o_logmsg.n_ttl_ms = o_logmsg.n_ttl_ms || 5000;
        o_state.a_o_logmsg.push(o_logmsg);
    }
}
o_wsmsg__set_state_data.f_v_client_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    o_state[o_wsmsg.v_data.s_property] = o_wsmsg.v_data.value;
    // denormalize newly arrived array if relation map is available on o_state
    if (o_state.o_relation_map) {
        let o_model = f_o_model__from_params(o_wsmsg.v_data.s_property, a_o_model);
        if (o_model) {
            let a_o_relation = o_state.o_relation_map[o_model.s_name];
            if (a_o_relation && a_o_relation.length > 0) {
                let a_o = o_state[o_wsmsg.v_data.s_property];
                for (let o_instance of a_o) {
                    f_denormalize_o_instance(o_instance, o_model, o_state, s_name_prop_id, o_state.o_relation_map);
                }
            }
        }
    }
}

let a_o_wsmsg = [
    o_wsmsg__deno_copy_file,
    o_wsmsg__deno_stat,
    o_wsmsg__deno_mkdir,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_delete_table_data,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__logmsg,
    o_wsmsg__set_state_data,
    o_wsmsg__syncdata,
    o_wsmsg__upload_file,
    o_wsmsg__run_openscad,
    o_wsmsg__render_thumbnail_3mf,
]

export {
    o_model__o_project,
    o_model__o_wsclient,
    o_model__o_fsnode,
    o_model__o_keyvalpair,
    a_o_model,
    f_o_property,
    f_o_model,
    f_o_model_prop__default_id,
    f_o_model_prop__timestamp_default,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__params,
    f_o_model_instance,
    f_o_model__from_params,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
    f_a_s_error__invalid_model_instance,
    s_name_prop_id,
    f_o_logmsg,
    a_o_wsmsg,
    o_wsmsg__deno_copy_file,
    o_wsmsg__deno_stat,
    o_wsmsg__deno_mkdir,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__set_state_data,
    o_wsmsg__f_delete_table_data,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__logmsg,
    o_wsmsg__syncdata,
    o_wsmsg__upload_file,
    o_wsmsg__run_openscad,
    o_wsmsg__render_thumbnail_3mf,
    f_o_wsmsg_def,
    f_o_wsmsg,
    s_o_logmsg_s_type__log,
    s_o_logmsg_s_type__error,
    s_o_logmsg_s_type__warn,
    s_o_logmsg_s_type__info,
    s_o_logmsg_s_type__debug,
    s_o_logmsg_s_type__table,
    f_o_example_instance_connected_cricular_from_o_model,
    f_apply_crud_to_a_o,
    f_o_relation_map__from_a_o_model,
    f_denormalize_o_state,
    f_denormalize_o_instance,
}
