// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// backend utility functions

import { s_ds, s_root_dir } from './runtimedata.js';
import { a_o_wsmsg, f_o_model_instance, f_s_name_table__from_o_model, o_model__o_fsnode, o_wsmsg__deno_copy_file, o_wsmsg__deno_mkdir, o_wsmsg__deno_stat, o_wsmsg__f_a_o_fsnode, o_wsmsg__f_delete_table_data, o_wsmsg__f_v_crud__indb, o_wsmsg__logmsg, o_wsmsg__set_state_data, o_wsmsg__syncdata, o_wsmsg__upload_file, o_wsmsg__run_openscad, o_wsmsg__render_thumbnail_3mf } from '../localhost/constructors.js';
import { f_v_crud__indb, f_db_delete_table_data } from './database_functions.js';
import { f_o_run_openscad, f_o_render_thumbnail_3mf } from './cli_functions.js';
import { ensureDir } from "jsr:@std/fs@1/ensure-dir";

let s_path__project_dir = `${s_root_dir}${s_ds}.gitignored${s_ds}project`;

let f_a_o_fsnode = async function(
    s_path,
    b_recursive = false,
    b_store_in_db = false
) {
    let a_o = [];

    if (!s_path) {
        console.error('Invalid path:', s_path);
        return a_o;
    }
    if (!s_path.startsWith(s_ds)) {
        console.error('Path is not absolute:', s_path);
        return a_o;
    }

    try {
        for await (let o_dir_entry of Deno.readDir(s_path)) {
            let s_path_absolute = `${s_path}${s_ds}${o_dir_entry.name}`;

            let o_fsnode = f_o_model_instance(
                o_model__o_fsnode,
                {
                    s_path_absolute,
                    s_name: s_path_absolute.split(s_ds).at(-1),
                    b_folder: o_dir_entry.isDirectory,
                }
            );
            if(b_store_in_db){
                let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
                let o_fsnode__fromdb = (o_wsmsg__syncdata.f_v_sync({s_name_table: s_name_table__fsnode, s_operation: 'read', o_data: { s_path_absolute }}) || []).at(0);
                if (o_fsnode__fromdb) {
                    o_fsnode.n_id = o_fsnode__fromdb.n_id;
                } else {
                    let o_fsnode__created = o_wsmsg__syncdata.f_v_sync({s_name_table: s_name_table__fsnode, s_operation: 'create', o_data: { s_path_absolute, b_folder: o_dir_entry.isDirectory }});
                    o_fsnode.n_id = o_fsnode__created.n_id;
                }
                if (o_dir_entry.isDirectory && b_recursive) {
                    o_fsnode.a_o_fsnode = await f_a_o_fsnode(s_path_absolute, b_recursive);
                }
            }

            a_o.push(o_fsnode);
        }
    } catch (o_error) {
        console.error(`Error reading directory: ${s_path}`, o_error.message);
        console.error(o_error.stack);
    }

    a_o.sort(function(o_a, o_b) {
        if (o_a.b_folder === o_b.b_folder) return (o_a.s_name || '').localeCompare(o_b.s_name || '');
        return o_a.b_folder ? -1 : 1;
    });

    return a_o;
};


// WARNING: the following deno_copy_file, deno_stat, deno_mkdir handlers expose raw Deno APIs
// to any connected WebSocket client with arbitrary arguments. Fine for local dev use,
// but must be restricted or removed before any network-exposed deployment.
o_wsmsg__deno_copy_file.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.copyFile(...a_v_arg);
}
o_wsmsg__deno_stat.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.stat(...a_v_arg);
}
o_wsmsg__deno_mkdir.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.mkdir(...a_v_arg);
}
o_wsmsg__f_v_crud__indb.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_v_crud__indb(...a_v_arg);
}
o_wsmsg__f_delete_table_data.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_db_delete_table_data(...a_v_arg);
}
o_wsmsg__f_a_o_fsnode.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_a_o_fsnode(...a_v_arg);
}
o_wsmsg__logmsg.f_v_server_implementation = function(o_wsmsg){
    let o_logmsg = o_wsmsg.v_data;
    if(o_logmsg.b_consolelog){
        console[o_logmsg.s_type](o_logmsg.s_message);
    }
    return null;
}
o_wsmsg__set_state_data.f_v_server_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    o_state[o_wsmsg.v_data.s_property] = o_wsmsg.v_data.value;
    return null;
}

// file upload handler: receive base64 file data, write to project directory
o_wsmsg__upload_file.f_v_server_implementation = async function(o_wsmsg){
    let v_data = o_wsmsg.v_data;
    let n_id = v_data.n_o_project_n_id;
    let s_type = v_data.s_type; // 'scad', '3mf', 'thumbnail'
    let s_name_file = v_data.s_name_file;
    let s_base64 = v_data.s_base64;

    // create project directory
    let s_dir__project = `${s_path__project_dir}${s_ds}${n_id}`;
    await ensureDir(s_dir__project);

    // determine subdirectory by type
    let s_subdir = s_type;
    let s_dir__target = `${s_dir__project}${s_ds}${s_subdir}`;
    await ensureDir(s_dir__target);

    let s_path__file = `${s_dir__target}${s_ds}${s_name_file}`;

    // decode base64 and write file
    let a_n_byte = Uint8Array.from(atob(s_base64), c => c.charCodeAt(0));
    await Deno.writeFile(s_path__file, a_n_byte);

    console.log(`[upload] wrote ${a_n_byte.length} bytes to ${s_path__file}`);
    return { s_path: s_path__file };
}

// openscad: generate .stl from .scad
o_wsmsg__run_openscad.f_v_server_implementation = async function(o_wsmsg){
    let v_data = o_wsmsg.v_data;
    let n_id = v_data.n_o_project_n_id;
    let s_path__scad = v_data.s_path__scad;

    // output .stl next to the .scad file
    let s_name__stl = s_path__scad.split(s_ds).at(-1).replace(/\.scad$/i, '.stl');
    let s_dir__project = `${s_path__project_dir}${s_ds}${n_id}`;
    let s_dir__stl = `${s_dir__project}${s_ds}stl`;
    await ensureDir(s_dir__stl);
    let s_path__stl = `${s_dir__stl}${s_ds}${s_name__stl}`;

    let o_result = await f_o_run_openscad(s_path__scad, s_path__stl);
    return { s_path__stl: o_result.s_path__stl };
}

// 3mf: render thumbnail from .3mf file
o_wsmsg__render_thumbnail_3mf.f_v_server_implementation = async function(o_wsmsg){
    let v_data = o_wsmsg.v_data;
    let n_id = v_data.n_o_project_n_id;
    let s_path__3mf = v_data.s_path__3mf;

    let s_dir__project = `${s_path__project_dir}${s_ds}${n_id}`;
    let s_dir__thumb = `${s_dir__project}${s_ds}thumbnail`;
    await ensureDir(s_dir__thumb);
    let s_path__thumbnail = `${s_dir__thumb}${s_ds}preview_3mf.png`;

    let o_result = await f_o_render_thumbnail_3mf(s_path__3mf, s_path__thumbnail);
    return { s_path__thumbnail: o_result.s_path__thumbnail };
}

let f_v_result_from_o_wsmsg = async function(
    o_wsmsg,
    o_state,
    o_socket__sender
){
    let o_wsmsg__existing = a_o_wsmsg.find(o=>o.s_name === o_wsmsg.s_name);
    if(!o_wsmsg__existing){
        console.error('No such wsmsg:', o_wsmsg.s_name);
        return null;
    }
    if(!o_wsmsg__existing.f_v_server_implementation) {
        console.error('No server implementation for wsmsg:', o_wsmsg.s_name);
        return null;
    }
    return o_wsmsg__existing.f_v_server_implementation(
        o_wsmsg,
        o_wsmsg__existing,
        o_state,
        o_socket__sender
    );

}

export {
    f_a_o_fsnode,
    f_v_result_from_o_wsmsg
};
