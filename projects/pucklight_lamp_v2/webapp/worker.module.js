// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Builds the lampshades away from the page, so its controls stay smooth, and writes
// the print files. A lampshade of any kind comes back in one form: a_n_pos, a_n_idx,
// a_n_nor or null for one normal per triangle, a_n_wall in mm and a_n_col per point,
// n_cnt__fixed, the first points, which are the thread's, and o_stat.

import { f_o_image__from_png, f_o_image__working, f_o_image__blurred, f_o_tile } from './heightmap.module.js';
import { f_o_mesh__egg, f_a_n_normal, f_o_shape, f_n_mm__tile_scl_x } from './egg.module.js';
import { sphere_mesh, displace, shell, neck_wall, thread_depth } from './sphere.module.js';
import { run_script, error_line, vase_mesh, steepest_walls } from './vase.module.js';
import { f_o_mesh__object } from './object.module.js';
import { f_a_n_tri__from_file, f_o_bound } from './mesh_file.module.js';
import { f_a_n_tri__moved } from './gizmo.module.js';
import { f_a_n_col__sphere, f_a_n_col__vase, f_a_n_col__egg, f_a_n_col__object } from './color.module.js';
import { f_o_blob__stl, f_o_blob__obj, f_o_mesh__from_stl, f_o_blob__3mf } from './export.module.js';

let s_path__tile = '.gitignored/tile';
let n_cnt__image_kept = 8;
// A slicer's vase mode prints one line this wide: the Lit view's wall of a vase.
let n_mm__line = 0.6;
let o_image__by_pattern = new Map();
let o_s_file__by_pattern = null;
let o_tile__cached = null;
let o_sphere__cached = null;
// The vase on screen, and the script it came from.
let o_vase__shown = null;
// The loaded object's triangles, as its file has them.
let a_n_tri__object = null;
let o_lamp = null;

// The width, the height and the volume of a closed mesh on the bed.
let f_o_stat__mesh = function(a_n_pos, a_n_idx){
    let n_r2 = 0, n_z = 0, n_mm3 = 0;
    for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
        n_r2 = Math.max(n_r2, a_n_pos[n_off] * a_n_pos[n_off] + a_n_pos[n_off + 1] * a_n_pos[n_off + 1]);
        n_z = Math.max(n_z, a_n_pos[n_off + 2]);
    }
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        let n_a = a_n_idx[n_off] * 3, n_b = a_n_idx[n_off + 1] * 3, n_c = a_n_idx[n_off + 2] * 3;
        n_mm3 += (a_n_pos[n_a] * (a_n_pos[n_b + 1] * a_n_pos[n_c + 2] - a_n_pos[n_b + 2] * a_n_pos[n_c + 1])
            + a_n_pos[n_a + 1] * (a_n_pos[n_b + 2] * a_n_pos[n_c] - a_n_pos[n_b] * a_n_pos[n_c + 2])
            + a_n_pos[n_a + 2] * (a_n_pos[n_b] * a_n_pos[n_c + 1] - a_n_pos[n_b + 1] * a_n_pos[n_c])) / 6;
    }
    return {
        n_cnt__vertex: a_n_pos.length / 3,
        n_cnt__triangle: a_n_idx.length / 3,
        n_mm__scl_x: 2 * Math.sqrt(n_r2),
        n_mm__scl_z: n_z,
        n_mm3
    };
};

// Sphere: the page's heightmap, one byte per pixel, its rows bottom up, moves the
// outside of the smooth sphere.
let f_o_built__sphere = function(o_data){
    let o_setting = o_data.o_setting;
    if(!o_sphere__cached || o_sphere__cached.columns !== o_setting.n_cnt__column){
        o_sphere__cached = sphere_mesh(o_setting.n_cnt__column);
    }
    let o_sphere = o_sphere__cached;
    let { a_n_u8__map, n_scl_x__map, n_scl_y__map } = o_data;
    // The map between its pixels, from 0 to 1. It wraps around in longitude.
    let f_n_height = function(n_deg__lat, n_deg__lon){
        let n_x = n_deg__lon / 360 * n_scl_x__map - 0.5;
        let n_y = (n_deg__lat + 90) / 180 * n_scl_y__map - 0.5;
        let n_x0 = Math.floor(n_x), n_y0 = Math.floor(n_y);
        let n_fx = n_x - n_x0, n_fy = n_y - n_y0;
        let n_xa = (n_x0 + n_scl_x__map) % n_scl_x__map;
        let n_xb = (n_x0 + 1 + n_scl_x__map) % n_scl_x__map;
        let n_ya = Math.max(n_y0, 0) * n_scl_x__map;
        let n_yb = Math.min(n_y0 + 1, n_scl_y__map - 1) * n_scl_x__map;
        let n_low = a_n_u8__map[n_ya + n_xa] * (1 - n_fx) + a_n_u8__map[n_ya + n_xb] * n_fx;
        let n_high = a_n_u8__map[n_yb + n_xa] * (1 - n_fx) + a_n_u8__map[n_yb + n_xb] * n_fx;
        return (n_low * (1 - n_fy) + n_high * n_fy) / 255;
    };
    let n_cnt__offset = displace(o_sphere, f_n_height, o_setting.n_mm__depth, o_setting.n_deg__relief_from);
    let n_cnt__fixed = o_sphere.rows[0].ring * o_sphere.columns;
    let a_n_height = o_sphere.heights.slice();
    let a_n_wall = new Float32Array(a_n_height.length);
    for(let n_idx = 0; n_idx < a_n_wall.length; n_idx++){
        a_n_wall[n_idx] = n_idx < n_cnt__fixed ? neck_wall + thread_depth : shell + o_setting.n_mm__depth * a_n_height[n_idx];
    }
    let a_n_pos = o_sphere.positions.slice();
    let a_n_idx = o_sphere.indices.slice();
    return {
        a_n_pos,
        a_n_idx,
        a_n_nor: null,
        a_n_wall,
        a_n_col: f_a_n_col__sphere(a_n_height, o_setting.a_o_stop),
        a_n_height,
        n_cnt__fixed,
        b_single_wall: false,
        o_stat: { ...f_o_stat__mesh(a_n_pos, a_n_idx), n_cnt__offset }
    };
};

// Vase: a script places the corners of the layers above the thread. Each build runs
// the script anew. A print file is of the vase on screen: a script that uses
// Math.random() would make another one.
let f_o_built__vase = function(o_data, b_export){
    let s_code = o_data.o_setting.s_code;
    if(!b_export || o_vase__shown?.s_code !== s_code){
        o_vase__shown = { s_code, o_vase: vase_mesh(run_script(s_code)) };
    }
    let o_vase = o_vase__shown.o_vase;
    let a_n_pos = o_vase.positions.slice();
    let a_n_idx = o_vase.indices.slice();
    let { out: o_out, inward: o_inward } = steepest_walls(o_vase);
    return {
        a_n_pos,
        a_n_idx,
        a_n_nor: null,
        a_n_wall: new Float32Array(a_n_pos.length / 3).fill(n_mm__line),
        a_n_col: f_a_n_col__vase(a_n_pos.length / 3, o_vase.fixed),
        n_cnt__fixed: o_vase.fixed,
        b_single_wall: true,
        o_stat: {
            ...f_o_stat__mesh(a_n_pos, a_n_idx),
            n_deg__out: o_out.angle, n_z__out: o_out.z,
            n_deg__inward: o_inward.angle, n_z__inward: o_inward.z
        }
    };
};

// The heightmaps are not in git: without them an egg is smooth.
let f_o_image__pattern = async function(n_id__pattern){
    if(!o_s_file__by_pattern){
        o_s_file__by_pattern = new Map();
        let o_response = await fetch(`${s_path__tile}/index.json`).catch(function(){ return null; });
        if(o_response?.ok){
            for(let o_pattern of await o_response.json()){ o_s_file__by_pattern.set(o_pattern.n_id, o_pattern.s_file); }
        }
    }
    if(!o_s_file__by_pattern.has(n_id__pattern)){ return null; }
    if(!o_image__by_pattern.has(n_id__pattern)){
        let o_response = await fetch(`${s_path__tile}/${encodeURIComponent(o_s_file__by_pattern.get(n_id__pattern))}`);
        if(!o_response.ok){ return null; }
        let o_image__raw = await f_o_image__from_png(new Uint8Array(await o_response.arrayBuffer()));
        if(o_image__by_pattern.size >= n_cnt__image_kept){
            o_image__by_pattern.delete(o_image__by_pattern.keys().next().value);
        }
        o_image__by_pattern.set(n_id__pattern, f_o_image__working(o_image__raw));
    }
    return o_image__by_pattern.get(n_id__pattern);
};

// The tile for these settings. Smoothing is in mm on the egg, so it depends on the
// tile's size there.
let f_o_tile__for_param = async function(o_param){
    let o_image = await f_o_image__pattern(o_param.n_id__pattern);
    if(!o_image){ return null; }
    let n_mm__tile = f_n_mm__tile_scl_x(f_o_shape(o_param, o_lamp).n_r__widest, o_param.n_cnt__repeat);
    let n_px__sigma = Math.round(2 * o_param.n_mm__smooth * o_image.n_scl_x / n_mm__tile) / 2;
    if(!o_tile__cached || o_tile__cached.n_id__pattern !== o_param.n_id__pattern || o_tile__cached.n_px__sigma !== n_px__sigma){
        o_tile__cached = { n_id__pattern: o_param.n_id__pattern, n_px__sigma, o_tile: f_o_tile(f_o_image__blurred(o_image, n_px__sigma)) };
    }
    return o_tile__cached.o_tile;
};

// Egg: a tile of scales as relief on an egg. Coarser cells while a slider moves, the
// print file's own for a print file.
let f_o_built__egg = async function(o_data, b_export){
    let o_param = o_data.o_setting;
    let o_tile = await f_o_tile__for_param(o_param);
    let n_mm__cell = b_export ? o_param.n_mm__cell_export : o_data.n_mm__cell;
    let o_mesh = f_o_mesh__egg(o_param, o_tile, o_lamp, n_mm__cell, b_export ? 360 : 180, o_data.s_brand);
    return {
        a_n_pos: o_mesh.a_n_pos,
        a_n_idx: o_mesh.a_n_idx,
        a_n_nor: b_export ? null : f_a_n_normal(o_mesh.a_n_pos, o_mesh.a_n_idx),
        a_n_wall: o_mesh.a_n_wall,
        a_n_col: f_a_n_col__egg(o_mesh.a_n_wall),
        n_cnt__fixed: o_mesh.n_cnt__fixed,
        b_single_wall: o_param.b_vase,
        o_stat: { ...f_o_stat__mesh(o_mesh.a_n_pos, o_mesh.a_n_idx), ...o_mesh.o_stat, n_mm__cell, b_pattern: o_tile !== null }
    };
};

// Object: a loaded 3D object, where the page's matrix puts it, joined to the neck and
// hollowed. A coarser grid for the view, the print file's own for a print file.
let f_o_built__object = function(o_data, b_export){
    let o_setting = o_data.o_setting;
    let a_n_tri = a_n_tri__object ? f_a_n_tri__moved(a_n_tri__object, o_data.a_n_mat4) : new Float32Array(0);
    let o_mesh = f_o_mesh__object(a_n_tri, o_setting, o_lamp, b_export ? o_setting.n_mm__voxel : o_data.n_mm__voxel, b_export ? 360 : 180);
    return {
        a_n_pos: o_mesh.a_n_pos,
        a_n_idx: o_mesh.a_n_idx,
        a_n_nor: b_export ? null : f_a_n_normal(o_mesh.a_n_pos, o_mesh.a_n_idx),
        a_n_wall: o_mesh.a_n_wall,
        a_n_col: f_a_n_col__object(o_mesh.a_n_wall.length),
        n_cnt__fixed: o_mesh.n_cnt__fixed,
        b_single_wall: false,
        // Which place of the object this is the lampshade of: the page's own count.
        n_id__place: o_data.n_id__place,
        o_stat: { ...f_o_stat__mesh(o_mesh.a_n_pos, o_mesh.a_n_idx), ...o_mesh.o_stat }
    };
};

// Takes a 3D object's file, or null for none, and tells the page its triangles.
let f_o_message__object = function(o_data){
    a_n_tri__object = o_data.a_n_u8 ? f_a_n_tri__from_file(o_data.a_n_u8, o_data.s_name__file) : null;
    if(!a_n_tri__object){ return { o_message: { s_type: 'object_loaded', n_id: o_data.n_id, a_n_tri: null }, a_o_transfer: [] }; }
    let a_n_tri = a_n_tri__object.slice();
    return { o_message: { s_type: 'object_loaded', n_id: o_data.n_id, a_n_tri, ...f_o_bound(a_n_tri) }, a_o_transfer: [a_n_tri.buffer] };
};

let f_o_built = async function(o_data, b_export){
    if(o_data.s_kind === 'sphere'){ return f_o_built__sphere(o_data); }
    if(o_data.s_kind === 'object'){ return f_o_built__object(o_data, b_export); }
    if(o_data.s_kind === 'vase'){ return f_o_built__vase(o_data, b_export); }
    return f_o_built__egg(o_data, b_export);
};

let f_o_message__build = async function(o_data){
    let o_built = await f_o_built(o_data, false);
    let a_o_transfer = [o_built.a_n_pos.buffer, o_built.a_n_idx.buffer, o_built.a_n_wall.buffer, o_built.a_n_col.buffer];
    if(o_built.a_n_nor){ a_o_transfer.push(o_built.a_n_nor.buffer); }
    if(o_built.a_n_height){ a_o_transfer.push(o_built.a_n_height.buffer); }
    return { o_message: { s_type: 'built', n_id: o_data.n_id, s_kind: o_data.s_kind, ...o_built }, a_o_transfer };
};

// Starts with the lamp's name, in characters every file system and slicer takes.
let f_s_name__file = function(o_data){
    let s_slug = (o_data.s_name__project ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    let s_mode = o_data.s_kind === 'egg' && o_data.o_setting.b_vase ? '_vase' : '';
    return `${s_slug || 'pucklight_lamp'}_${o_data.s_kind}${s_mode}`;
};

// The top part prints upside down, its top face on the bed: half a turn around x.
let f_o_mesh__upside_down = function(o_mesh){
    let n_z__top = -Infinity;
    for(let n_off = 2; n_off < o_mesh.a_n_pos.length; n_off += 3){ n_z__top = Math.max(n_z__top, o_mesh.a_n_pos[n_off]); }
    let a_n_pos = new Float32Array(o_mesh.a_n_pos.length);
    for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
        a_n_pos[n_off] = o_mesh.a_n_pos[n_off];
        a_n_pos[n_off + 1] = -o_mesh.a_n_pos[n_off + 1];
        a_n_pos[n_off + 2] = n_z__top - o_mesh.a_n_pos[n_off + 2];
    }
    return { a_n_pos, a_n_idx: o_mesh.a_n_idx };
};

// The whole lamp as it prints, side by side: the lampshade on its neck, the top part
// upside down, the screwin standing as it is used.
let f_a_o_object__lamp = async function(o_built, s_brand){
    let n_mm__gap = 8;
    let n_r__shade = o_built.o_stat.n_mm__scl_x / 2;
    let n_r__base = o_lamp.n_mm__body_d / 2;
    let n_x__base = 2 * n_r__shade + 2 * n_mm__gap + n_r__base;
    let a_o_object = [{ s_name: 'lampshade', a_n_pos: o_built.a_n_pos, a_n_idx: o_built.a_n_idx, n_x: n_r__shade + n_mm__gap, n_y: n_r__shade + n_mm__gap }];
    let a_o_place = [
        { s_name: 'toppart', n_x: n_x__base, n_y: n_r__base + n_mm__gap },
        { s_name: 'screwin', n_x: n_x__base, n_y: 3 * n_r__base + 2 * n_mm__gap }
    ];
    for(let o_place of a_o_place){
        let o_response = await fetch(`part/${s_brand}/${o_place.s_name}.stl`);
        if(!o_response.ok){ throw new Error(`part/${s_brand}/${o_place.s_name}.stl is missing; run: deno task part`); }
        let o_mesh = f_o_mesh__from_stl(await o_response.arrayBuffer());
        a_o_object.push({ ...o_place, ...(o_place.s_name === 'toppart' ? f_o_mesh__upside_down(o_mesh) : o_mesh) });
    }
    return a_o_object;
};

let f_o_message__export = async function(o_data){
    let o_built = await f_o_built(o_data, true);
    let s_name = f_s_name__file(o_data);
    let o_blob;
    if(o_data.s_format === 'stl'){
        o_blob = f_o_blob__stl(o_built.a_n_pos, o_built.a_n_idx);
        s_name += '.stl';
    } else if(o_data.s_format === 'obj'){
        o_blob = f_o_blob__obj(o_built.a_n_pos, o_built.a_n_idx, o_built.a_n_col);
        s_name += '.obj';
    } else if(o_data.s_format === '3mf'){
        o_blob = await f_o_blob__3mf([{ s_name: 'lampshade', a_n_pos: o_built.a_n_pos, a_n_idx: o_built.a_n_idx, n_x: 0, n_y: 0 }]);
        s_name += '.3mf';
    } else {
        o_blob = await f_o_blob__3mf(await f_a_o_object__lamp(o_built, o_data.s_brand));
        s_name += '_whole_lamp.3mf';
    }
    return {
        o_message: { s_type: 'exported', n_id: o_data.n_id, o_blob, s_name, n_cnt__triangle: o_built.o_stat.n_cnt__triangle },
        a_o_transfer: []
    };
};

self.onmessage = async function(o_event){
    let o_data = o_event.data;
    try{
        if(!o_lamp){
            let o_response = await fetch('part/lamp.json');
            if(!o_response.ok){ throw new Error('part/lamp.json is missing; run: deno task part'); }
            o_lamp = await o_response.json();
        }
        let n_ms__start = performance.now();
        let o_result = o_data.s_type === 'object' ? f_o_message__object(o_data)
            : (o_data.s_type === 'build' ? await f_o_message__build(o_data) : await f_o_message__export(o_data));
        o_result.o_message.n_ms = performance.now() - n_ms__start;
        self.postMessage(o_result.o_message, o_result.a_o_transfer);
    } catch(o_error){
        // A vase's script names the line its mistake is on.
        let n_line = o_data.s_kind === 'vase' ? error_line(o_error) : null;
        self.postMessage({ s_type: 'error', n_id: o_data.n_id, s_kind: o_data.s_kind, s_message: o_error.message, n_line, s_for: o_data.s_type });
    }
};
