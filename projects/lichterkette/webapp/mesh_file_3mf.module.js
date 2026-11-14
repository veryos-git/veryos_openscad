// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Reads a 3MF: a zip of XML. Its objects' triangles, placed as the file builds them, and
// their colours, the first that a file has of:
//   - painted filaments, Bambu Studio's and Orca's paint_color or PrusaSlicer's
//     slic3rpe:mmu_segmentation: a code per triangle, which may cut it into pieces of
//     different filaments, read as TriangleSelector.cpp of Bambu Studio writes it;
//   - the filament of each part, from Metadata/model_settings.config (Bambu Studio,
//     Orca) or Metadata/Slic3r_PE_model.config (PrusaSlicer);
//   - the 3MF's own colours: basematerials and colorgroup.
// A filament's colour is from Metadata/project_settings.config or Slic3r_PE.config.
// Parts that only change settings, cut away or block supports are left out. Of several
// objects one is read, n_item, the first by default: a bulb is one object.

import { f_a_n_byte__of_hex, f_a_n_col__or_null } from './texture.module.js';

// Stand-ins for filaments whose colours the file does not have.
let a_s_col__stand_in = ['#f2f2f2', '#d93a3a', '#2f6fdb', '#f2c12e', '#2e9e52', '#8e44ad', '#f08a24', '#1f1f1f'];
let o_n_mm__by_unit = { micron: 0.001, millimeter: 1, centimeter: 10, inch: 25.4, foot: 304.8, meter: 1000 };

/* ---- The zip ---- */

// The zip's files by their paths, each to be inflated when asked for.
let f_o_zip = function(a_n_u8){
    let o_view = new DataView(a_n_u8.buffer, a_n_u8.byteOffset, a_n_u8.byteLength);
    let n_end = -1;
    for(let n_off = a_n_u8.length - 22; n_off >= Math.max(0, a_n_u8.length - 65557); n_off--){
        if(o_view.getUint32(n_off, true) === 0x06054b50){ n_end = n_off; break; }
    }
    if(n_end < 0){ throw new Error('This 3MF is not a zip, or is cut short.'); }
    let n_cnt = o_view.getUint16(n_end + 10, true);
    let n_off__dir = o_view.getUint32(n_end + 16, true);
    // A zip64 directory, where the numbers did not fit.
    if(n_off__dir === 0xffffffff && n_end >= 20 && o_view.getUint32(n_end - 20, true) === 0x07064b50){
        let n_off__end64 = Number(o_view.getBigUint64(n_end - 12, true));
        n_cnt = Number(o_view.getBigUint64(n_off__end64 + 32, true));
        n_off__dir = Number(o_view.getBigUint64(n_off__end64 + 48, true));
    }
    let o_entry__by_path = new Map();
    let o_decoder = new TextDecoder();
    for(let n_it = 0, n_off = n_off__dir; n_it < n_cnt; n_it++){
        if(o_view.getUint32(n_off, true) !== 0x02014b50){ throw new Error('This 3MF\'s zip directory is broken.'); }
        let n_method = o_view.getUint16(n_off + 10, true);
        let n_scl__packed = o_view.getUint32(n_off + 20, true);
        let n_scl__name = o_view.getUint16(n_off + 28, true), n_scl__extra = o_view.getUint16(n_off + 30, true), n_scl__comment = o_view.getUint16(n_off + 32, true);
        let n_off__local = o_view.getUint32(n_off + 42, true);
        let s_path = o_decoder.decode(a_n_u8.subarray(n_off + 46, n_off + 46 + n_scl__name));
        // Zip64: sizes and offset that did not fit come in an extra field, in this order.
        for(let n_x = n_off + 46 + n_scl__name; n_x < n_off + 46 + n_scl__name + n_scl__extra;){
            let n_id = o_view.getUint16(n_x, true), n_scl = o_view.getUint16(n_x + 2, true);
            if(n_id === 1){
                let n_at = n_x + 4;
                if(o_view.getUint32(n_off + 24, true) === 0xffffffff){ n_at += 8; }
                if(n_scl__packed === 0xffffffff){ n_scl__packed = Number(o_view.getBigUint64(n_at, true)); n_at += 8; }
                if(n_off__local === 0xffffffff){ n_off__local = Number(o_view.getBigUint64(n_at, true)); }
            }
            n_x += 4 + n_scl;
        }
        o_entry__by_path.set(s_path.replace(/^\/+/, ''), { n_method, n_scl__packed, n_off__local });
        n_off += 46 + n_scl__name + n_scl__extra + n_scl__comment;
    }
    return {
        f_b_has: function(s_path){ return o_entry__by_path.has(s_path.replace(/^\/+/, '')); },
        a_s_path: [...o_entry__by_path.keys()],
        f_a_n_u8: async function(s_path){
            let o_entry = o_entry__by_path.get(s_path.replace(/^\/+/, ''));
            if(!o_entry){ return null; }
            let n_off = o_entry.n_off__local;
            let n_start = n_off + 30 + o_view.getUint16(n_off + 26, true) + o_view.getUint16(n_off + 28, true);
            let a_n_packed = a_n_u8.subarray(n_start, n_start + o_entry.n_scl__packed);
            if(o_entry.n_method === 0){ return a_n_packed; }
            if(o_entry.n_method !== 8){ throw new Error(`${s_path} in this 3MF is packed in a way that is not read.`); }
            let o_stream = new Blob([a_n_packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
            return new Uint8Array(await new Response(o_stream).arrayBuffer());
        },
        f_s_text: async function(s_path){
            let a_n = await this.f_a_n_u8(s_path);
            return a_n === null ? null : new TextDecoder().decode(a_n);
        }
    };
};

/* ---- XML, as far as 3MF needs it: tags and their attributes ---- */

let f_o_attribute = function(s_text){
    let o = {};
    for(let a_s of s_text.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)){ o[a_s[1]] = a_s[2]; }
    return o;
};
// One attribute, without reading the others: for the millions of points and triangles.
let f_s_get = function(s_text, s_key){
    let s_find = s_key + '="';
    let n_at = s_text.indexOf(s_find);
    while(n_at > 0 && s_text.charCodeAt(n_at - 1) > 32){ n_at = s_text.indexOf(s_find, n_at + 1); }
    if(n_at < 0){ return undefined; }
    let n_from = n_at + s_find.length;
    return s_text.slice(n_from, s_text.indexOf('"', n_from));
};
// A list of numbers that grows, typed.
let f_o_list = function(f_a_n){
    return {
        a_n: new f_a_n(1 << 16), n_cnt: 0,
        f_add: function(n_val){
            if(this.n_cnt === this.a_n.length){
                let a_n = new f_a_n(this.a_n.length * 2);
                a_n.set(this.a_n);
                this.a_n = a_n;
            }
            this.a_n[this.n_cnt++] = n_val;
        },
        f_a_n: function(){ return this.a_n.slice(0, this.n_cnt); }
    };
};
// Calls f_tag(s_name without its prefix, s_attribute text, b_close, b_self) for each tag.
let f_scan = function(s_xml, f_tag){
    let o_regex = /<(\/?)([A-Za-z_][\w.:-]*)([^>]*?)(\/?)>/g;
    let a_s;
    while((a_s = o_regex.exec(s_xml)) !== null){
        f_tag(a_s[2].slice(a_s[2].indexOf(':') + 1), a_s[3], a_s[1] === '/', a_s[4] === '/');
    }
};

// 3MF's matrix, twelve numbers, a point as a row times it; as the same twelve.
let a_n_mat__identity = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
let f_a_n_mat = function(s_text){
    let a_n = String(s_text ?? '').trim().split(/\s+/).map(Number);
    return a_n.length === 12 && a_n.every(Number.isFinite) ? a_n : a_n_mat__identity;
};
// First a, then b.
let f_a_n_mat__then = function(a, b){
    let f = function(n_r, n_c){ return a[n_r * 3] * b[n_c] + a[n_r * 3 + 1] * b[3 + n_c] + a[n_r * 3 + 2] * b[6 + n_c] + (n_r === 3 ? b[9 + n_c] : 0); };
    return [0, 1, 2, 3].flatMap(function(n_r){ return [0, 1, 2].map(function(n_c){ return f(n_r, n_c); }); });
};

// A model file's objects, colour groups, build items and unit.
let f_o_model = function(s_xml){
    let o_model = { o_object__by_id: new Map(), o_group__by_id: new Map(), a_o_item: [], n_mm: 1, b_texture: false };
    let o_object = null, o_group = null;
    f_scan(s_xml, function(s_tag, s_attr, b_close, b_self){
        if(b_close){
            if(s_tag === 'object' && o_object){
                o_object.a_n_pos = o_object.o_pos.f_a_n();
                o_object.a_n_idx = o_object.o_idx.f_a_n();
                delete o_object.o_pos;
                delete o_object.o_idx;
                o_object = null;
            }
            if(s_tag === 'basematerials' || s_tag === 'colorgroup'){ o_group = null; }
            return;
        }
        if(s_tag === 'vertex' && o_object){
            o_object.o_pos.f_add(Number(f_s_get(s_attr, 'x')));
            o_object.o_pos.f_add(Number(f_s_get(s_attr, 'y')));
            o_object.o_pos.f_add(Number(f_s_get(s_attr, 'z')));
        } else if(s_tag === 'triangle' && o_object){
            for(let s_key of ['v1', 'v2', 'v3']){ o_object.o_idx.f_add(Number(f_s_get(s_attr, s_key))); }
            let s_paint = f_s_get(s_attr, 'paint_color') ?? f_s_get(s_attr, 'slic3rpe:mmu_segmentation') ?? '';
            let s_pid = f_s_get(s_attr, 'pid');
            if(s_pid !== undefined || s_paint){
                o_object.o_extra__by_tri.set(o_object.o_idx.n_cnt / 3 - 1, { n_pid: s_pid === undefined ? null : Number(s_pid),
                    a_n_p: ['p1', 'p2', 'p3'].map(function(s_key){ let s = f_s_get(s_attr, s_key); return s === undefined ? null : Number(s); }), s_paint });
            }
        } else if(s_tag === 'object'){
            let o = f_o_attribute(s_attr);
            o_object = { n_id: Number(o.id), s_type: o.type ?? 'model', s_name: o.name ?? '', n_pid: o.pid === undefined ? null : Number(o.pid), n_pindex: Number(o.pindex ?? 0),
                o_pos: f_o_list(Float64Array), o_idx: f_o_list(Int32Array), o_extra__by_tri: new Map(), a_o_component: [] };
            o_model.o_object__by_id.set(o_object.n_id, o_object);
            if(b_self){
                o_object.a_n_pos = new Float64Array(0);
                o_object.a_n_idx = new Int32Array(0);
                o_object = null;
            }
        } else if(s_tag === 'component' && o_object){
            let o = f_o_attribute(s_attr);
            o_object.a_o_component.push({ n_id: Number(o.objectid), a_n_mat: f_a_n_mat(o.transform), s_path: (o['p:path'] ?? '').replace(/^\/+/, '') });
        } else if(s_tag === 'basematerials' || s_tag === 'colorgroup'){
            let o = f_o_attribute(s_attr);
            o_group = [];
            o_model.o_group__by_id.set(Number(o.id), o_group);
            if(b_self){ o_group = null; }
        } else if((s_tag === 'base' || s_tag === 'color') && o_group){
            let o = f_o_attribute(s_attr);
            o_group.push(f_a_n_byte__of_hex(o.displaycolor ?? o.color) ?? [255, 255, 255]);
        } else if(s_tag === 'texture2dgroup'){
            o_model.b_texture = true;
        } else if(s_tag === 'item'){
            let o = f_o_attribute(s_attr);
            o_model.a_o_item.push({ n_id: Number(o.objectid), a_n_mat: f_a_n_mat(o.transform), b_printable: o.printable !== '0', s_path: (o['p:path'] ?? '').replace(/^\/+/, '') });
        } else if(s_tag === 'model'){
            o_model.n_mm = o_n_mm__by_unit[f_o_attribute(s_attr).unit ?? 'millimeter'] ?? 1;
        }
    });
    return o_model;
};

/* ---- Paint ---- */

// A paint code as its tree: a leaf { n_state }, or { n_split, n_special, a_o_child }.
// Its letters are read from the last, each letter's bits from its lowest; a node's first
// four bits are its number of split sides and, split, its special side, else its
// filament, 3 meaning more nibbles follow. Children come last first.
let f_o_paint = function(s_code){
    let n_pos = s_code.length - 1;
    let f_n_nibble = function(){
        if(n_pos < 0){ throw new Error('cut short'); }
        let n = parseInt(s_code[n_pos--], 16);
        if(!(n >= 0)){ throw new Error('not hex'); }
        return n;
    };
    let f_o_node = function(){
        let n_code = f_n_nibble();
        let n_split = n_code & 3;
        if(n_split === 0){
            let n_state = n_code >> 2;
            if(n_state === 3){
                let n_next = f_n_nibble(), n_15 = 0;
                while(n_next === 15){ n_15++; n_next = f_n_nibble(); }
                n_state = n_next + 15 * n_15 + 3;
            }
            return { n_state };
        }
        let a_o_child = new Array(n_split + 1);
        for(let n_child = n_split; n_child >= 0; n_child--){ a_o_child[n_child] = f_o_node(); }
        return { n_split, n_special: n_code >> 2, a_o_child };
    };
    let o_root = f_o_node();
    return { o_root, b_whole: n_pos === -1 };
};

let f_a_n_mid = function(a, b){ return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; };
// Calls f_leaf(a, b, c, n_state) for each piece of a triangle a, b, c that a paint tree
// cuts it into: perform_split() of Bambu Studio's TriangleSelector.cpp.
let f_paint_pieces = function(a_a_n, o_node, f_leaf){
    if(!o_node.a_o_child){ f_leaf(a_a_n[0], a_a_n[1], a_a_n[2], o_node.n_state); return; }
    let n_s = o_node.n_special;
    let v = [a_a_n[n_s % 3], a_a_n[(n_s + 1) % 3], a_a_n[(n_s + 2) % 3]];
    let a_a_a_n_child;
    if(o_node.n_split === 1){
        let m = f_a_n_mid(v[2], v[1]);
        a_a_a_n_child = [[v[0], v[1], m], [m, v[2], v[0]]];
    } else if(o_node.n_split === 2){
        let m01 = f_a_n_mid(v[1], v[0]), m02 = f_a_n_mid(v[0], v[2]);
        a_a_a_n_child = [[v[0], m01, m02], [m01, v[1], m02], [v[1], v[2], m02]];
    } else {
        let m01 = f_a_n_mid(v[1], v[0]), m12 = f_a_n_mid(v[2], v[1]), m20 = f_a_n_mid(v[0], v[2]);
        a_a_a_n_child = [[v[0], m01, m20], [m01, v[1], m12], [m12, v[2], m20], [m01, m12, m20]];
    }
    a_a_a_n_child.forEach(function(a_a_n_child, n_child){ f_paint_pieces(a_a_n_child, o_node.a_o_child[n_child], f_leaf); });
};

/* ---- Filaments and parts ---- */

// The filaments' colours, as sRGB, from the slicer's settings in the file.
let f_a_a_n_col__filament = async function(o_zip){
    let s_bambu = await o_zip.f_s_text('Metadata/project_settings.config');
    if(s_bambu){
        try{
            let a_s = JSON.parse(s_bambu).filament_colour;
            if(Array.isArray(a_s) && a_s.length > 0){ return { a_a_n_col: a_s.map(function(s){ return f_a_n_byte__of_hex(s) ?? [255, 255, 255]; }), b_known: true }; }
        } catch(o_error){ /* Not JSON: other settings, other colours. */ }
    }
    let s_prusa = await o_zip.f_s_text('Metadata/Slic3r_PE.config');
    if(s_prusa){
        let f_a_s = function(s_key){
            let a_s = s_prusa.match(new RegExp(`^;\\s*${s_key}\\s*=\\s*(.*)$`, 'm'));
            return a_s ? a_s[1].trim().replace(/^"|"$/g, '').split(';') : [];
        };
        let a_s__extruder = f_a_s('extruder_colour'), a_s__filament = f_a_s('filament_colour');
        let n_cnt = Math.max(a_s__extruder.length, a_s__filament.length);
        if(n_cnt > 0){
            return { a_a_n_col: Array.from({ length: n_cnt }, function(v, n_idx){
                return f_a_n_byte__of_hex(a_s__extruder[n_idx]) ?? f_a_n_byte__of_hex(a_s__filament[n_idx]) ?? [255, 255, 255];
            }), b_known: true };
        }
    }
    return { a_a_n_col: a_s_col__stand_in.map(f_a_n_byte__of_hex), b_known: false };
};

// Per object of the root model: its filament, its name, and its parts by their ids:
// { n_filament, b_print }. Bambu Studio and Orca.
let f_o_setting__bambu = async function(o_zip){
    let s_xml = await o_zip.f_s_text('Metadata/model_settings.config');
    let o_object__by_id = new Map();
    if(!s_xml){ return o_object__by_id; }
    let o_object = null, o_part = null;
    f_scan(s_xml, function(s_tag, s_attr, b_close, b_self){
        if(b_close){
            if(s_tag === 'object'){ o_object = null; }
            if(s_tag === 'part'){ o_part = null; }
            return;
        }
        let o = f_o_attribute(s_attr);
        if(s_tag === 'object'){
            o_object = { n_filament: 0, s_name: '', o_part__by_id: new Map() };
            o_object__by_id.set(Number(o.id), o_object);
        } else if(s_tag === 'part' && o_object){
            o_part = { n_filament: 0, b_print: (o.subtype ?? 'normal_part') === 'normal_part' };
            o_object.o_part__by_id.set(Number(o.id), o_part);
            if(b_self){ o_part = null; }
        } else if(s_tag === 'metadata' && o_object){
            if(o.key === 'extruder'){ (o_part ?? o_object).n_filament = Number(o.value) || 0; }
            if(o.key === 'name' && !o_part){ o_object.s_name = o.value ?? ''; }
        }
    });
    return o_object__by_id;
};

// Per object: its filament and its volumes as ranges of its triangles. PrusaSlicer.
let f_o_setting__prusa = async function(o_zip){
    let s_xml = await o_zip.f_s_text('Metadata/Slic3r_PE_model.config');
    let o_object__by_id = new Map();
    if(!s_xml){ return o_object__by_id; }
    let o_object = null, o_volume = null;
    f_scan(s_xml, function(s_tag, s_attr, b_close){
        if(b_close){
            if(s_tag === 'object'){ o_object = null; }
            if(s_tag === 'volume'){ o_volume = null; }
            return;
        }
        let o = f_o_attribute(s_attr);
        if(s_tag === 'object'){
            o_object = { n_filament: 0, s_name: '', a_o_volume: [] };
            o_object__by_id.set(Number(o.id), o_object);
        } else if(s_tag === 'volume' && o_object){
            o_volume = { n_from: Number(o.firstid), n_to: Number(o.lastid), n_filament: 0, b_print: true };
            o_object.a_o_volume.push(o_volume);
        } else if(s_tag === 'metadata' && o_object){
            if(o.key === 'extruder'){ (o_volume ?? o_object).n_filament = Number(o.value) || 0; }
            if(o.key === 'name' && !o_volume){ o_object.s_name = o.value ?? ''; }
            if(o_volume && ((o.key === 'modifier' && o.value === '1') || (o.key === 'volume_type' && o.value !== 'ModelPart'))){ o_volume.b_print = false; }
        }
    });
    return o_object__by_id;
};

/* ---- The object ---- */

// Reads a 3MF's n_item-th object to print. Returns { a_n_tri, a_n_col, s_note,
// a_s_item }: a_s_item names the objects to choose from if there are several.
let f_o_object__from_3mf = async function(a_n_u8, n_item = 0){
    let o_zip = f_o_zip(a_n_u8);
    let s_path__root = '3D/3dmodel.model';
    let s_rels = await o_zip.f_s_text('_rels/.rels');
    let a_s_target = s_rels?.match(/Target="\/?([^"]+\.model)"/);
    if(a_s_target && o_zip.f_b_has(a_s_target[1])){ s_path__root = a_s_target[1]; }
    let o_model__by_path = new Map();
    let f_o_model__of = async function(s_path){
        if(!o_model__by_path.has(s_path)){
            let s_xml = await o_zip.f_s_text(s_path);
            if(s_xml === null){ throw new Error(`This 3MF lacks ${s_path}.`); }
            o_model__by_path.set(s_path, f_o_model(s_xml));
        }
        return o_model__by_path.get(s_path);
    };
    let o_root = await f_o_model__of(s_path__root);
    let a_o_item = o_root.a_o_item.filter(function(o){ return o.b_printable; });
    if(a_o_item.length === 0){ throw new Error('This 3MF has nothing to print.'); }
    let o_bambu = await f_o_setting__bambu(o_zip);
    let o_prusa = await f_o_setting__prusa(o_zip);
    let o_filament = await f_a_a_n_col__filament(o_zip);
    let f_a_n_col__filament = function(n_filament){
        let a_a_n = o_filament.a_a_n_col;
        return a_a_n[Math.max(0, (n_filament || 1) - 1) % a_a_n.length];
    };
    let a_s_item = a_o_item.map(function(o_item, n_idx){
        let o_object = o_root.o_object__by_id.get(o_item.n_id);
        return (o_bambu.get(o_item.n_id)?.s_name || o_prusa.get(o_item.n_id)?.s_name || o_object?.s_name || `object ${n_idx + 1}`);
    });
    let o_item = a_o_item[Math.max(0, Math.min(a_o_item.length - 1, n_item))];

    let o_tri = f_o_list(Float32Array), o_col = f_o_list(Uint8Array);
    let b_paint = false, b_color = false, b_paint_broken = false;
    // An object with its mesh or its components, where a_n_mat puts it; n_filament its
    // part's or object's filament, b_print whether it is a part to print.
    let f_add_object = async function(o_model, n_id, a_n_mat, n_filament, o_part__by_id, n_depth){
        let o_object = o_model.o_object__by_id.get(n_id);
        if(!o_object || n_depth > 16 || (o_object.s_type !== 'model' && o_object.s_type !== 'solidsupport')){ return; }
        for(let o_component of o_object.a_o_component){
            let o_part = o_part__by_id?.get(o_component.n_id);
            if(o_part && !o_part.b_print){ continue; }
            let o_model__component = o_component.s_path ? await f_o_model__of(o_component.s_path) : o_model;
            await f_add_object(o_model__component, o_component.n_id, f_a_n_mat__then(o_component.a_n_mat, a_n_mat), o_part?.n_filament || n_filament, null, n_depth + 1);
        }
        if(o_object.a_n_idx.length === 0){ return; }
        let n_mm__unit = o_root.n_mm;
        let f_a_n_world = function(n_v){
            let x = o_object.a_n_pos[n_v * 3], y = o_object.a_n_pos[n_v * 3 + 1], z = o_object.a_n_pos[n_v * 3 + 2];
            return [0, 1, 2].map(function(n_c){ return n_mm__unit * (x * a_n_mat[n_c] + y * a_n_mat[3 + n_c] + z * a_n_mat[6 + n_c] + a_n_mat[9 + n_c]); });
        };
        // PrusaSlicer keeps an object's volumes as ranges of its triangles.
        let o_prusa__object = n_depth === 0 ? o_prusa.get(n_id) : null;
        let n_cnt__tri = o_object.a_n_idx.length / 3;
        for(let n_tri = 0; n_tri < n_cnt__tri; n_tri++){
            let n_filament__tri = n_filament;
            if(o_prusa__object?.a_o_volume.length){
                let o_volume = o_prusa__object.a_o_volume.find(function(o){ return n_tri >= o.n_from && n_tri <= o.n_to; });
                if(o_volume && !o_volume.b_print){ continue; }
                n_filament__tri = o_volume?.n_filament || o_prusa__object.n_filament || n_filament__tri;
            }
            let a_n_v = [o_object.a_n_idx[n_tri * 3], o_object.a_n_idx[n_tri * 3 + 1], o_object.a_n_idx[n_tri * 3 + 2]];
            if(a_n_v.some(function(n_v){ return !(n_v >= 0 && n_v < o_object.a_n_pos.length / 3); })){ throw new Error('This 3MF has a triangle with a corner that is not there.'); }
            let a_a_n = a_n_v.map(f_a_n_world);
            let o_extra = o_object.o_extra__by_tri.get(n_tri);
            // The triangle's colour by the 3MF's own groups, corner by corner.
            let a_a_n_col__corner = null;
            let n_pid = o_extra?.n_pid ?? o_object.n_pid;
            let a_col__group = n_pid === null || n_pid === undefined ? null : (o_model.o_group__by_id.get(n_pid) ?? o_root.o_group__by_id.get(n_pid));
            if(a_col__group){
                let a_n_p = o_extra?.n_pid !== null && o_extra?.n_pid !== undefined ? o_extra.a_n_p : [o_object.n_pindex, null, null];
                let n_p1 = a_n_p[0] ?? o_object.n_pindex;
                a_a_n_col__corner = [n_p1, a_n_p[1] ?? n_p1, a_n_p[2] ?? n_p1].map(function(n_p){ return a_col__group[n_p] ?? [255, 255, 255]; });
                b_color = true;
            }
            let a_n_col__unpainted = f_a_n_col__filament(n_filament__tri);
            let f_add = function(a, b, c, a_a_n_col){
                for(let a_n of [a, b, c]){ o_tri.f_add(a_n[0]); o_tri.f_add(a_n[1]); o_tri.f_add(a_n[2]); }
                for(let a_n of a_a_n_col){ o_col.f_add(a_n[0]); o_col.f_add(a_n[1]); o_col.f_add(a_n[2]); }
            };
            let s_paint = o_extra?.s_paint;
            if(s_paint){
                let o_paint = null;
                try{
                    o_paint = f_o_paint(s_paint);
                } catch(o_error){ /* A broken code: the triangle unpainted. */ }
                if(o_paint?.b_whole){
                    b_paint = true;
                    f_paint_pieces(a_a_n, o_paint.o_root, function(a, b, c, n_state){
                        let a_n = n_state > 0 ? f_a_n_col__filament(n_state) : a_n_col__unpainted;
                        f_add(a, b, c, [a_n, a_n, a_n]);
                    });
                    continue;
                }
                b_paint_broken = true;
            }
            f_add(a_a_n[0], a_a_n[1], a_a_n[2], a_a_n_col__corner ?? [a_n_col__unpainted, a_n_col__unpainted, a_n_col__unpainted]);
        }
    };
    let o_model__item = o_item.s_path ? await f_o_model__of(o_item.s_path) : o_root;
    let o_bambu__object = o_bambu.get(o_item.n_id);
    await f_add_object(o_model__item, o_item.n_id, o_item.a_n_mat, o_bambu__object?.n_filament || 0, o_bambu__object?.o_part__by_id ?? null, 0);
    if(o_tri.n_cnt === 0){ throw new Error(`${a_s_item[a_o_item.indexOf(o_item)]} in this 3MF has no triangles to print.`); }

    let a_s_note = [];
    let b_filament = b_paint || o_bambu.size > 0 || o_prusa.size > 0;
    let a_n_col__out = f_a_n_col__or_null(o_col.f_a_n());
    if(a_n_col__out && b_filament && !o_filament.b_known && !b_color){ a_s_note.push('The filaments\' colours are not in the file: they show in stand-in colours.'); }
    if(b_paint_broken){ a_s_note.push('Some painted triangles have a code that is not read: they show in their part\'s colour.'); }
    if(o_root.b_texture || [...o_model__by_path.values()].some(function(o){ return o.b_texture; })){ a_s_note.push('Colours from a picture in a 3MF are not read.'); }
    if(a_o_item.length > 1){ a_s_note.push(`This 3MF has ${a_o_item.length} objects: choose which one below.`); }
    return { a_n_tri: o_tri.f_a_n(), a_n_col: a_n_col__out, s_note: a_s_note.join(' '), a_s_item: a_o_item.length > 1 ? a_s_item : null, n_item: a_o_item.indexOf(o_item) };
};

export { f_o_object__from_3mf, f_o_zip, f_o_paint, f_paint_pieces };
