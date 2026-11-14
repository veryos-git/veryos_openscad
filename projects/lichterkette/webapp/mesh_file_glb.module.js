// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Reads glTF 2.0: a .glb, or a .gltf with its .bin and pictures beside it. Every mesh of
// the scene where its nodes put it, in colours: a material's base colour, times the
// points' own (COLOR_0), times its base colour picture. glTF is in metres with y up;
// the object comes out in mm with z up, as a 3D printer has it.

import { f_o_baked, f_a_n_col__or_null } from './texture.module.js';

let o_n_size__by_type = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
let o_wrap__by_code = { 33071: 'clamp', 33648: 'mirror', 10497: 'repeat' };

let f_a_n_mat4__identity = function(){ return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; };
// Column-major 4 x 4 matrices, as glTF writes them: a times b.
let f_a_n_mat4__times = function(a, b){
    let a_n = new Array(16).fill(0);
    for(let n_c = 0; n_c < 4; n_c++){
        for(let n_r = 0; n_r < 4; n_r++){
            for(let n_k = 0; n_k < 4; n_k++){ a_n[n_c * 4 + n_r] += a[n_k * 4 + n_r] * b[n_c * 4 + n_k]; }
        }
    }
    return a_n;
};
let f_a_n_mat4__of_node = function(o_node){
    if(Array.isArray(o_node.matrix) && o_node.matrix.length === 16){ return o_node.matrix.slice(); }
    let [x, y, z, w] = o_node.rotation ?? [0, 0, 0, 1];
    let [sx, sy, sz] = o_node.scale ?? [1, 1, 1];
    let [tx, ty, tz] = o_node.translation ?? [0, 0, 0];
    return [
        (1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
        2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
        2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
        tx, ty, tz, 1
    ];
};

let f_a_n_u8__of_data_uri = function(s_uri){
    let n_comma = s_uri.indexOf(',');
    let s_data = s_uri.slice(n_comma + 1);
    if(/;base64$/i.test(s_uri.slice(0, n_comma))){
        let s_bin = atob(s_data);
        return Uint8Array.from(s_bin, function(c){ return c.charCodeAt(0); });
    }
    return new TextEncoder().encode(decodeURIComponent(s_data));
};

// Reads a .glb or a .gltf. a_o_file__side: { s_name, a_n_u8 } of the files beside a
// .gltf; f_o_image: async (a_n_u8, s_name) to a picture, see texture.module.js, or null.
// Returns { a_n_tri, a_n_col, s_note }.
let f_o_object__from_gltf = async function(a_n_u8, s_name, a_o_file__side, f_o_image){
    let o_view = new DataView(a_n_u8.buffer, a_n_u8.byteOffset, a_n_u8.byteLength);
    let o_gltf, a_n_u8__bin = null;
    if(a_n_u8.length >= 12 && o_view.getUint32(0, true) === 0x46546c67){
        if(o_view.getUint32(4, true) !== 2){ throw new Error(`${s_name} is glTF ${o_view.getUint32(4, true)}: only glTF 2 is read.`); }
        for(let n_off = 12; n_off + 8 <= a_n_u8.length;){
            let n_scl = o_view.getUint32(n_off, true), n_type = o_view.getUint32(n_off + 4, true);
            let a_n_chunk = a_n_u8.subarray(n_off + 8, n_off + 8 + n_scl);
            if(n_type === 0x4e4f534a){ o_gltf = JSON.parse(new TextDecoder().decode(a_n_chunk)); }
            if(n_type === 0x004e4942 && a_n_u8__bin === null){ a_n_u8__bin = a_n_chunk; }
            n_off += 8 + n_scl;
        }
    } else {
        o_gltf = JSON.parse(new TextDecoder().decode(a_n_u8));
    }
    if(!o_gltf?.asset){ throw new Error(`${s_name} is not glTF.`); }
    let a_s_required = o_gltf.extensionsRequired ?? [];
    for(let s_ext of ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_meshopt_compression']){
        if(a_s_required.includes(s_ext)){ throw new Error(`${s_name} is packed with ${s_ext}, which is not read: export it again without compression.`); }
    }
    let f_o_file__side = function(s_uri){
        let s_base = decodeURIComponent(s_uri).split(/[\\/]/).pop().toLowerCase();
        return a_o_file__side.find(function(o){ return o.s_name.split(/[\\/]/).pop().toLowerCase() === s_base; }) ?? null;
    };
    let a_s_missing = [];
    let a_a_n_u8__buffer = (o_gltf.buffers ?? []).map(function(o_buffer, n_idx){
        if(o_buffer.uri === undefined){ return n_idx === 0 ? a_n_u8__bin : null; }
        if(o_buffer.uri.startsWith('data:')){ return f_a_n_u8__of_data_uri(o_buffer.uri); }
        let o_file = f_o_file__side(o_buffer.uri);
        if(!o_file){ a_s_missing.push(o_buffer.uri); }
        return o_file?.a_n_u8 ?? null;
    });
    if(a_s_missing.length){ throw new Error(`${s_name}'s data is in ${a_s_missing.join(', ')}: choose it together with ${s_name}.`); }

    let f_a_n_u8__view = function(n_view){
        let o_bv = o_gltf.bufferViews[n_view];
        let a_n = a_a_n_u8__buffer[o_bv.buffer];
        if(!a_n){ throw new Error(`${s_name} lacks a buffer it needs.`); }
        return a_n.subarray(o_bv.byteOffset ?? 0, (o_bv.byteOffset ?? 0) + o_bv.byteLength);
    };
    // An accessor's numbers, n_size a row, as floats; integers that are marked
    // normalised from 0 to 1 (or -1 to 1).
    let f_o_accessor = function(n_accessor){
        let o_acc = o_gltf.accessors[n_accessor];
        let n_size = o_n_size__by_type[o_acc.type];
        let a_n = new Float32Array(o_acc.count * n_size);
        // n_cnt rows of n_width numbers from a buffer, each to f_set(row, column, number):
        // an integer as stored, or from 0 to 1 when marked so.
        let f_read = function(a_n_u8__src, n_off__src, n_stride, n_component, n_cnt, n_width, f_set){
            let o_dv = new DataView(a_n_u8__src.buffer, a_n_u8__src.byteOffset, a_n_u8__src.byteLength);
            let o_get = {
                5120: [1, (n) => o_dv.getInt8(n), 127], 5121: [1, (n) => o_dv.getUint8(n), 255],
                5122: [2, (n) => o_dv.getInt16(n, true), 32767], 5123: [2, (n) => o_dv.getUint16(n, true), 65535],
                5125: [4, (n) => o_dv.getUint32(n, true), 4294967295], 5126: [4, (n) => o_dv.getFloat32(n, true), 1]
            }[n_component];
            let n_step = n_stride || o_get[0] * n_width;
            for(let n_it = 0; n_it < n_cnt; n_it++){
                for(let n_k = 0; n_k < n_width; n_k++){
                    let n_val = o_get[1](n_off__src + n_it * n_step + n_k * o_get[0]);
                    f_set(n_it, n_k, o_acc.normalized && n_component !== 5126 ? Math.max(n_val / o_get[2], -1) : n_val);
                }
            }
        };
        if(o_acc.bufferView !== undefined){
            let o_bv = o_gltf.bufferViews[o_acc.bufferView];
            f_read(f_a_n_u8__view(o_acc.bufferView), o_acc.byteOffset ?? 0, o_bv.byteStride ?? 0, o_acc.componentType, o_acc.count, n_size, function(n_it, n_k, n_val){ a_n[n_it * n_size + n_k] = n_val; });
        }
        if(o_acc.sparse){
            let o_sp = o_acc.sparse;
            let a_n_index = new Uint32Array(o_sp.count);
            f_read(f_a_n_u8__view(o_sp.indices.bufferView), o_sp.indices.byteOffset ?? 0, 0, o_sp.indices.componentType, o_sp.count, 1, function(n_it, n_k, n_val){ a_n_index[n_it] = n_val; });
            f_read(f_a_n_u8__view(o_sp.values.bufferView), o_sp.values.byteOffset ?? 0, 0, o_acc.componentType, o_sp.count, n_size, function(n_it, n_k, n_val){ a_n[a_n_index[n_it] * n_size + n_k] = n_val; });
        }
        return { a_n, n_size, n_cnt: o_acc.count };
    };

    // Pictures, decoded once, by their image's number.
    let o_image__by_idx = new Map();
    let a_s_note = [];
    let f_o_texture = async function(o_info){
        if(!o_info || !f_o_image){ return null; }
        let o_texture = o_gltf.textures?.[o_info.index];
        let n_source = o_texture?.source ?? o_texture?.extensions?.EXT_texture_webp?.source;
        let o_img = o_gltf.images?.[n_source];
        if(!o_img){ return null; }
        if(!o_image__by_idx.has(n_source)){
            let a_n_u8__img = o_img.bufferView !== undefined ? f_a_n_u8__view(o_img.bufferView)
                : (o_img.uri?.startsWith('data:') ? f_a_n_u8__of_data_uri(o_img.uri) : f_o_file__side(o_img.uri ?? '')?.a_n_u8);
            let o_image = null;
            if(!a_n_u8__img){
                a_s_note.push(`Its picture ${o_img.uri} is missing: choose it together with ${s_name}.`);
            } else {
                try{
                    o_image = await f_o_image(a_n_u8__img, o_img.uri ?? o_img.name ?? 'picture');
                } catch(o_error){
                    a_s_note.push(`A picture of it could not be read (${o_img.mimeType ?? o_img.uri}).`);
                }
            }
            o_image__by_idx.set(n_source, o_image);
        }
        let o_image = o_image__by_idx.get(n_source);
        if(!o_image){ return null; }
        let o_sampler = o_gltf.samplers?.[o_texture.sampler] ?? {};
        return { ...o_image, s_wrap_x: o_wrap__by_code[o_sampler.wrapS ?? 10497], s_wrap_y: o_wrap__by_code[o_sampler.wrapT ?? 10497], n_texcoord: o_info.texCoord ?? 0 };
    };

    // Each primitive's triangles, with light at their corners and, with a picture, uv.
    let a_o_part = [];
    let n_cnt__tri = 0;
    let f_add_mesh = async function(n_mesh, a_n_mat4){
        let o_mesh = o_gltf.meshes?.[n_mesh];
        for(let o_prim of o_mesh?.primitives ?? []){
            let n_mode = o_prim.mode ?? 4;
            if(n_mode < 4 || o_prim.attributes?.POSITION === undefined){ continue; }
            if(o_prim.extensions?.KHR_draco_mesh_compression){ throw new Error(`${s_name} is packed with Draco, which is not read: export it again without compression.`); }
            let o_pos = f_o_accessor(o_prim.attributes.POSITION);
            let a_n_idx = o_prim.indices !== undefined ? Uint32Array.from(f_o_accessor(o_prim.indices).a_n) : Uint32Array.from({ length: o_pos.n_cnt }, (v, n) => n);
            // Strips and fans as plain triangles, each facing as the first.
            if(n_mode === 5 || n_mode === 6){
                let a_n = [];
                for(let n_it = 2; n_it < a_n_idx.length; n_it++){
                    if(n_mode === 5){ a_n.push(...(n_it % 2 ? [a_n_idx[n_it - 1], a_n_idx[n_it - 2], a_n_idx[n_it]] : [a_n_idx[n_it - 2], a_n_idx[n_it - 1], a_n_idx[n_it]])); }
                    else { a_n.push(a_n_idx[0], a_n_idx[n_it - 1], a_n_idx[n_it]); }
                }
                a_n_idx = Uint32Array.from(a_n);
            }
            let o_material = o_gltf.materials?.[o_prim.material] ?? {};
            let o_pbr = o_material.pbrMetallicRoughness ?? {};
            let o_spec_gloss = o_material.extensions?.KHR_materials_pbrSpecularGlossiness;
            let a_n_factor = (o_spec_gloss?.diffuseFactor ?? o_pbr.baseColorFactor ?? [1, 1, 1, 1]).slice(0, 3);
            let o_image = await f_o_texture(o_spec_gloss?.diffuseTexture ?? o_pbr.baseColorTexture);
            let o_uv = o_image ? (o_prim.attributes[`TEXCOORD_${o_image.n_texcoord}`] !== undefined ? f_o_accessor(o_prim.attributes[`TEXCOORD_${o_image.n_texcoord}`]) : null) : null;
            let o_color = o_prim.attributes.COLOR_0 !== undefined ? f_o_accessor(o_prim.attributes.COLOR_0) : null;
            let n_cnt = Math.floor(a_n_idx.length / 3);
            let a_n_tri = new Float32Array(n_cnt * 9), a_n_light = new Float32Array(n_cnt * 9), a_n_uv = o_uv ? new Float32Array(n_cnt * 6) : null;
            let m = a_n_mat4;
            for(let n_it = 0; n_it < n_cnt * 3; n_it++){
                let n_v = a_n_idx[n_it];
                if(!(n_v < o_pos.n_cnt)){ throw new Error(`${s_name} has a triangle with a corner that is not there.`); }
                let x = o_pos.a_n[n_v * 3], y = o_pos.a_n[n_v * 3 + 1], z = o_pos.a_n[n_v * 3 + 2];
                let wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14];
                // y up in metres to z up in mm: x stays, y is -z, z is y.
                a_n_tri[n_it * 3] = 1000 * wx;
                a_n_tri[n_it * 3 + 1] = -1000 * wz;
                a_n_tri[n_it * 3 + 2] = 1000 * wy;
                for(let n_k = 0; n_k < 3; n_k++){
                    a_n_light[n_it * 3 + n_k] = a_n_factor[n_k] * (o_color && n_k < o_color.n_size ? o_color.a_n[n_v * o_color.n_size + n_k] : 1);
                }
                if(a_n_uv){
                    a_n_uv[n_it * 2] = o_uv.a_n[n_v * 2];
                    a_n_uv[n_it * 2 + 1] = o_uv.a_n[n_v * 2 + 1];
                }
            }
            // A matrix that mirrors turns the triangles inside out: turned back.
            let n_det = m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
            if(n_det < 0){
                for(let n_tri = 0; n_tri < n_cnt; n_tri++){
                    for(let [a_n, n_w] of [[a_n_tri, 3], [a_n_light, 3], [a_n_uv, 2]]){
                        if(!a_n){ continue; }
                        let n_off = n_tri * 3 * n_w;
                        for(let n_k = 0; n_k < n_w; n_k++){ [a_n[n_off + n_w + n_k], a_n[n_off + 2 * n_w + n_k]] = [a_n[n_off + 2 * n_w + n_k], a_n[n_off + n_w + n_k]]; }
                    }
                }
            }
            a_o_part.push({ a_n_tri, a_n_light, a_n_uv, o_image: a_n_uv ? o_image : null });
            n_cnt__tri += n_cnt;
        }
    };
    let f_add_node = async function(n_node, a_n_mat4__parent, n_depth){
        let o_node = o_gltf.nodes?.[n_node];
        if(!o_node || n_depth > 64){ return; }
        let a_n_mat4 = f_a_n_mat4__times(a_n_mat4__parent, f_a_n_mat4__of_node(o_node));
        if(o_node.mesh !== undefined){ await f_add_mesh(o_node.mesh, a_n_mat4); }
        for(let n_child of o_node.children ?? []){ await f_add_node(n_child, a_n_mat4, n_depth + 1); }
    };
    let o_scene = o_gltf.scenes?.[o_gltf.scene ?? 0];
    if(o_scene){
        for(let n_node of o_scene.nodes ?? []){ await f_add_node(n_node, f_a_n_mat4__identity(), 0); }
    } else {
        for(let n_mesh = 0; n_mesh < (o_gltf.meshes ?? []).length; n_mesh++){ await f_add_mesh(n_mesh, f_a_n_mat4__identity()); }
    }
    if(n_cnt__tri === 0){ throw new Error(`${s_name} has no triangles.`); }

    // All parts together; the pictures into colours of corners.
    let a_n_tri = new Float32Array(n_cnt__tri * 9), a_n_light = new Float32Array(n_cnt__tri * 9);
    let b_uv = a_o_part.some(function(o){ return o.a_n_uv; });
    let a_n_uv = b_uv ? new Float32Array(n_cnt__tri * 6) : null;
    let a_n_image__tri = new Int32Array(n_cnt__tri).fill(-1);
    let a_o_image = [];
    let n_off = 0;
    for(let o_part of a_o_part){
        let n_cnt = o_part.a_n_tri.length / 9;
        a_n_tri.set(o_part.a_n_tri, n_off * 9);
        a_n_light.set(o_part.a_n_light, n_off * 9);
        if(o_part.a_n_uv){
            a_n_uv.set(o_part.a_n_uv, n_off * 6);
            let n_image = a_o_image.indexOf(o_part.o_image);
            if(n_image < 0){ n_image = a_o_image.push(o_part.o_image) - 1; }
            a_n_image__tri.fill(n_image, n_off, n_off + n_cnt);
        }
        n_off += n_cnt;
    }
    let o_baked = f_o_baked(a_n_tri, a_n_light, a_n_uv, a_n_image__tri, a_o_image, false);
    if(o_baked.b_coarser){ a_s_note.push('Its picture is finer than the triangles this app works with: it shows a little blurred.'); }
    return { a_n_tri: o_baked.a_n_tri, a_n_col: f_a_n_col__or_null(o_baked.a_n_col), s_note: [...new Set(a_s_note)].join(' ') };
};

export { f_o_object__from_gltf };
