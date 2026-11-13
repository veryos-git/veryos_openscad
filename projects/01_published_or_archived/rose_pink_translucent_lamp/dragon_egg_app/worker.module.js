// Builds meshes away from the page, so its sliders stay smooth.

import { f_o_image__from_png, f_o_image__working, f_o_image__blurred, f_o_tile } from './heightmap.module.js';
import { f_o_mesh__egg, f_a_n_normal, f_o_shape, f_n_mm__tile_scl_x } from './egg.module.js';
import { f_o_blob__stl, f_o_mesh__from_stl, f_o_blob__3mf } from './export.module.js';

let n_cnt__image_kept = 8;
let o_image__by_pattern = new Map();
let o_tile__cached = null;
let o_lamp = null;

let f_s_url__pattern = function(n_id__pattern){
    return encodeURI(`../Tileable/MG-Tile Scale (${n_id__pattern}).png`);
};

let f_o_image__pattern = async function(n_id__pattern){
    if(!o_image__by_pattern.has(n_id__pattern)){
        let o_response = await fetch(f_s_url__pattern(n_id__pattern));
        if(!o_response.ok){ throw new Error(`pattern ${n_id__pattern} not found`); }
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
    let n_mm__tile = f_n_mm__tile_scl_x(f_o_shape(o_param, o_lamp).n_r__widest, o_param.n_cnt__repeat);
    let n_px__sigma = Math.round(2 * o_param.n_mm__smooth * o_image.n_scl_x / n_mm__tile) / 2;
    if(!o_tile__cached || o_tile__cached.n_id__pattern !== o_param.n_id__pattern || o_tile__cached.n_px__sigma !== n_px__sigma){
        o_tile__cached = { n_id__pattern: o_param.n_id__pattern, n_px__sigma, o_tile: f_o_tile(f_o_image__blurred(o_image, n_px__sigma)) };
    }
    return o_tile__cached.o_tile;
};

// Starts with the lamp's name, in characters every file system and slicer takes.
let f_s_name__file = function(o_param, s_name__project){
    let s_slug = (s_name__project ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    let s_mode = o_param.b_vase ? '_vase' : '';
    return `${s_slug || 'dragon_egg'}_p${o_param.n_id__pattern}_${o_param.n_mm__egg_scl_x}x${o_param.n_mm__egg_scl_z}_r${o_param.n_mm__relief}${s_mode}`;
};

let f_o_message__build = async function(o_data){
    let o_tile = await f_o_tile__for_param(o_data.o_param);
    let o_mesh = f_o_mesh__egg(o_data.o_param, o_tile, o_lamp, o_data.n_mm__cell, o_data.n_cnt__neck_column);
    let a_n_nor = f_a_n_normal(o_mesh.a_n_pos, o_mesh.a_n_idx);
    return {
        o_message: {
            s_type: 'built',
            n_id: o_data.n_id,
            n_mm__cell: o_data.n_mm__cell,
            a_n_pos: o_mesh.a_n_pos,
            a_n_nor,
            a_n_wall: o_mesh.a_n_wall,
            a_n_idx: o_mesh.a_n_idx,
            o_stat: o_mesh.o_stat
        },
        a_o_transfer: [o_mesh.a_n_pos.buffer, a_n_nor.buffer, o_mesh.a_n_wall.buffer, o_mesh.a_n_idx.buffer]
    };
};

let f_a_o_object__lamp = async function(o_mesh, n_r__widest){
    let n_mm__gap = 8;
    let n_r__base = o_lamp.n_mm__sockel_scl_x / 2;
    let n_x__egg = n_r__widest + n_mm__gap;
    let n_x__base = 2 * n_r__widest + 2 * n_mm__gap + n_r__base;
    let a_o_object = [{ s_name: 'egg', a_n_pos: o_mesh.a_n_pos, a_n_idx: o_mesh.a_n_idx, n_x: n_x__egg, n_y: n_x__egg }];
    let a_o_place = [
        { s_name: 'sockel', n_x: n_x__base, n_y: n_r__base + n_mm__gap },
        { s_name: 'screwin', n_x: n_x__base, n_y: 3 * n_r__base + 2 * n_mm__gap },
        { s_name: 'clickbase', n_x: n_x__base, n_y: 5 * n_r__base + 3 * n_mm__gap }
    ];
    for(let o_place of a_o_place){
        let o_response = await fetch(`part/${o_place.s_name}.stl`);
        if(!o_response.ok){ throw new Error(`part/${o_place.s_name}.stl is missing; run make_asset.py part`); }
        a_o_object.push({ ...o_place, ...f_o_mesh__from_stl(await o_response.arrayBuffer()) });
    }
    return a_o_object;
};

let f_o_message__export = async function(o_data){
    let o_tile = await f_o_tile__for_param(o_data.o_param);
    let o_mesh = f_o_mesh__egg(o_data.o_param, o_tile, o_lamp, o_data.n_mm__cell, 360);
    let s_name = f_s_name__file(o_data.o_param, o_data.s_name__project);
    let o_blob;
    if(o_data.s_format === 'stl'){
        o_blob = f_o_blob__stl(o_mesh.a_n_pos, o_mesh.a_n_idx);
        s_name += '.stl';
    } else if(o_data.s_format === '3mf'){
        o_blob = await f_o_blob__3mf([{ s_name: 'egg', a_n_pos: o_mesh.a_n_pos, a_n_idx: o_mesh.a_n_idx, n_x: 0, n_y: 0 }]);
        s_name += '.3mf';
    } else {
        let a_o_object = await f_a_o_object__lamp(o_mesh, o_mesh.o_stat.n_mm__scl_x / 2);
        o_blob = await f_o_blob__3mf(a_o_object);
        s_name += '_whole_lamp.3mf';
    }
    return {
        o_message: { s_type: 'exported', o_blob, s_name, n_cnt__triangle: o_mesh.o_stat.n_cnt__triangle },
        a_o_transfer: []
    };
};

self.onmessage = async function(o_event){
    let o_data = o_event.data;
    try{
        if(!o_lamp){
            let o_response = await fetch('part/lamp.json');
            if(!o_response.ok){ throw new Error('part/lamp.json is missing; run make_asset.py part'); }
            o_lamp = await o_response.json();
        }
        let n_ms__start = performance.now();
        let o_result = o_data.s_type === 'build' ? await f_o_message__build(o_data) : await f_o_message__export(o_data);
        o_result.o_message.n_ms = performance.now() - n_ms__start;
        self.postMessage(o_result.o_message, o_result.a_o_transfer);
    } catch(o_error){
        self.postMessage({ s_type: 'error', n_id: o_data.n_id, s_message: o_error.message, s_for: o_data.s_type });
    }
};
