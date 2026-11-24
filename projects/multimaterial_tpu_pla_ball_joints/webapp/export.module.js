// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Writes the joints as a 3MF: each printed piece one object, made of a part for each
// material, and each part set to its filament for Bambu Studio and the Orca slicers
// (OrcaSlicer, SnapmakerOrca, ElegooSlicer) in Metadata/model_settings.config.
// A 3MF is a zip holding XML; browsers can deflate but not zip, so the small zip
// writer is here, as in the Lichterkette app.

// A binary STL as an indexed mesh, its identical corners merged. Rounding to 32 bits
// can collapse a sliver's corners into one, and a 3MF must not have those triangles.
let f_o_mesh__from_stl = function(o_buffer){
    let o_view = new DataView(o_buffer);
    let n_cnt__triangle = o_view.getUint32(80, true);
    let a_n_idx = new Uint32Array(n_cnt__triangle * 3);
    let a_n_pos = new Float32Array(n_cnt__triangle * 9);
    let o_map = new Map();
    let n_cnt__vertex = 0;
    let n_cnt__idx = 0;
    let n_off = 84;
    for(let n_it = 0; n_it < n_cnt__triangle; n_it++){
        n_off += 12;
        for(let n_it_corner = 0; n_it_corner < 3; n_it_corner++){
            let n_x = o_view.getFloat32(n_off, true);
            let n_y = o_view.getFloat32(n_off + 4, true);
            let n_z = o_view.getFloat32(n_off + 8, true);
            n_off += 12;
            let s_key = `${n_x},${n_y},${n_z}`;
            let n_idx = o_map.get(s_key);
            if(n_idx === undefined){
                n_idx = n_cnt__vertex++;
                o_map.set(s_key, n_idx);
                a_n_pos[n_idx * 3] = n_x;
                a_n_pos[n_idx * 3 + 1] = n_y;
                a_n_pos[n_idx * 3 + 2] = n_z;
            }
            a_n_idx[n_cnt__idx + n_it_corner] = n_idx;
        }
        n_off += 2;
        let n_a = a_n_idx[n_cnt__idx], n_b = a_n_idx[n_cnt__idx + 1], n_c = a_n_idx[n_cnt__idx + 2];
        if(n_a !== n_b && n_b !== n_c && n_a !== n_c){ n_cnt__idx += 3; }
    }
    return { a_n_pos: a_n_pos.slice(0, n_cnt__vertex * 3), a_n_idx: a_n_idx.slice(0, n_cnt__idx) };
};

let a_n_crc_table = (function(){
    let a_n = new Uint32Array(256);
    for(let n_it = 0; n_it < 256; n_it++){
        let n_c = n_it;
        for(let n_bit = 0; n_bit < 8; n_bit++){ n_c = n_c & 1 ? 0xedb88320 ^ (n_c >>> 1) : n_c >>> 1; }
        a_n[n_it] = n_c >>> 0;
    }
    return a_n;
})();

let f_n_crc32 = function(a_n_u8, n_crc__previous = 0){
    let n_crc = ~n_crc__previous;
    for(let n_it = 0; n_it < a_n_u8.length; n_it++){
        n_crc = a_n_crc_table[(n_crc ^ a_n_u8[n_it]) & 255] ^ (n_crc >>> 8);
    }
    return ~n_crc >>> 0;
};

let f_a_n_u8__deflated = async function(a_a_n_u8){
    let o_stream = new Blob(a_a_n_u8).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(o_stream).arrayBuffer());
};

// a_o_file: { s_path, a_a_n_u8 }, each file's bytes in pieces.
let f_o_blob__zip = async function(a_o_file, s_type){
    let o_encoder = new TextEncoder();
    let a_v_part = [];
    let a_o_entry = [];
    let n_off = 0;
    for(let o_file of a_o_file){
        let a_n_u8__path = o_encoder.encode(o_file.s_path);
        let n_crc = 0;
        let n_scl__raw = 0;
        for(let a_n_u8 of o_file.a_a_n_u8){
            n_crc = f_n_crc32(a_n_u8, n_crc);
            n_scl__raw += a_n_u8.length;
        }
        let a_n_u8__deflated = await f_a_n_u8__deflated(o_file.a_a_n_u8);
        let a_n_u8__head = new Uint8Array(30 + a_n_u8__path.length);
        let o_view = new DataView(a_n_u8__head.buffer);
        o_view.setUint32(0, 0x04034b50, true);
        o_view.setUint16(4, 20, true);
        o_view.setUint16(8, 8, true);
        o_view.setUint32(14, n_crc, true);
        o_view.setUint32(18, a_n_u8__deflated.length, true);
        o_view.setUint32(22, n_scl__raw, true);
        o_view.setUint16(26, a_n_u8__path.length, true);
        a_n_u8__head.set(a_n_u8__path, 30);
        a_v_part.push(a_n_u8__head, a_n_u8__deflated);
        a_o_entry.push({ a_n_u8__path, n_crc, n_scl__deflated: a_n_u8__deflated.length, n_scl__raw, n_off });
        n_off += a_n_u8__head.length + a_n_u8__deflated.length;
    }
    let n_off__directory = n_off;
    let n_scl__directory = 0;
    for(let o_entry of a_o_entry){
        let a_n_u8 = new Uint8Array(46 + o_entry.a_n_u8__path.length);
        let o_view = new DataView(a_n_u8.buffer);
        o_view.setUint32(0, 0x02014b50, true);
        o_view.setUint16(4, 20, true);
        o_view.setUint16(6, 20, true);
        o_view.setUint16(10, 8, true);
        o_view.setUint32(16, o_entry.n_crc, true);
        o_view.setUint32(20, o_entry.n_scl__deflated, true);
        o_view.setUint32(24, o_entry.n_scl__raw, true);
        o_view.setUint16(28, o_entry.a_n_u8__path.length, true);
        o_view.setUint32(42, o_entry.n_off, true);
        a_n_u8.set(o_entry.a_n_u8__path, 46);
        a_v_part.push(a_n_u8);
        n_scl__directory += a_n_u8.length;
    }
    let a_n_u8__end = new Uint8Array(22);
    let o_view__end = new DataView(a_n_u8__end.buffer);
    o_view__end.setUint32(0, 0x06054b50, true);
    o_view__end.setUint16(8, a_o_entry.length, true);
    o_view__end.setUint16(10, a_o_entry.length, true);
    o_view__end.setUint32(12, n_scl__directory, true);
    o_view__end.setUint32(16, n_off__directory, true);
    a_v_part.push(a_n_u8__end);
    return new Blob(a_v_part, { type: s_type });
};

let f_s_xml = function(s){
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

// One mesh as an object of the 3MF, in pieces, as a single string could get too long. Its
// material is its filament's entry in the base materials, of id 1.
let f_add_mesh_xml = function(a_a_n_u8, o_encoder, n_id, s_name, n_filament, a_n_pos, a_n_idx){
    let n_cnt__per_piece = 40000;
    a_a_n_u8.push(o_encoder.encode(
        `<object id="${n_id}" name="${f_s_xml(s_name)}" type="model" pid="1" pindex="${n_filament - 1}"><mesh><vertices>`
    ));
    let a_s = [];
    for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
        a_s.push(`<vertex x="${a_n_pos[n_off].toFixed(4)}" y="${a_n_pos[n_off + 1].toFixed(4)}" z="${a_n_pos[n_off + 2].toFixed(4)}"/>`);
        if(a_s.length === n_cnt__per_piece){ a_a_n_u8.push(o_encoder.encode(a_s.join(''))); a_s = []; }
    }
    a_s.push('</vertices><triangles>');
    for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
        a_s.push(`<triangle v1="${a_n_idx[n_off]}" v2="${a_n_idx[n_off + 1]}" v3="${a_n_idx[n_off + 2]}"/>`);
        if(a_s.length === n_cnt__per_piece){ a_a_n_u8.push(o_encoder.encode(a_s.join(''))); a_s = []; }
    }
    a_s.push('</triangles></mesh></object>');
    a_a_n_u8.push(o_encoder.encode(a_s.join('')));
};

// a_o_object: { s_name, n_x, n_y, a_o_part: [{ s_name, n_filament, a_n_pos, a_n_idx }] }, each
// object placed on the bed at x and y, its parts in its own coordinates.
// a_o_filament: { s_name, s_colour } for filament 1, 2, ...: written as the 3MF's materials
// too, so that slicers without Bambu's metadata at least show the parts in their colours.
// Parts that share a mesh (the test's three balls) are written once.
let f_o_blob__3mf = async function(a_o_object, a_o_filament){
    let o_encoder = new TextEncoder();
    let a_a_n_u8 = [o_encoder.encode(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">' +
        '<metadata name="Application">VeryOS tpu_pla_ball_joint webapp</metadata><resources>' +
        '<basematerials id="1">' + a_o_filament.map(function(o_filament){
            return `<base name="${f_s_xml(o_filament.s_name)}" displaycolor="${o_filament.s_colour}"/>`;
        }).join('') + '</basematerials>'
    )];
    let n_id = 2;
    let o_n_id__by_mesh = new Map();
    let a_s__config = ['<?xml version="1.0" encoding="UTF-8"?>\n<config>'];
    let a_s__item = [];
    for(let o_object of a_o_object){
        let a_n_id__part = [];
        for(let o_part of o_object.a_o_part){
            let n_id__mesh = o_n_id__by_mesh.get(o_part.a_n_idx);
            if(n_id__mesh === undefined){
                n_id__mesh = n_id++;
                o_n_id__by_mesh.set(o_part.a_n_idx, n_id__mesh);
                f_add_mesh_xml(a_a_n_u8, o_encoder, n_id__mesh, o_part.s_name, o_part.n_filament, o_part.a_n_pos, o_part.a_n_idx);
            }
            a_n_id__part.push(n_id__mesh);
        }
        let n_id__object = n_id++;
        a_a_n_u8.push(o_encoder.encode(
            `<object id="${n_id__object}" name="${f_s_xml(o_object.s_name)}" type="model"><components>` +
            a_n_id__part.map(function(n_id__part){ return `<component objectid="${n_id__part}"/>`; }).join('') +
            '</components></object>'
        ));
        a_s__item.push(`<item objectid="${n_id__object}" transform="1 0 0 0 1 0 0 0 1 ${o_object.n_x} ${o_object.n_y} 0" printable="1"/>`);
        a_s__config.push(
            `<object id="${n_id__object}"><metadata key="name" value="${f_s_xml(o_object.s_name)}"/>` +
            `<metadata key="extruder" value="${o_object.a_o_part[0].n_filament}"/>` +
            o_object.a_o_part.map(function(o_part, n_idx){
                return `<part id="${a_n_id__part[n_idx]}" subtype="normal_part">` +
                    `<metadata key="name" value="${f_s_xml(o_part.s_name)}"/>` +
                    '<metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>' +
                    `<metadata key="extruder" value="${o_part.n_filament}"/></part>`;
            }).join('') + '</object>'
        );
    }
    a_s__config.push('</config>\n');
    a_a_n_u8.push(o_encoder.encode(`</resources><build>${a_s__item.join('')}</build></model>`));
    return f_o_blob__zip([
        {
            s_path: '[Content_Types].xml',
            a_a_n_u8: [o_encoder.encode(
                '<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>' +
                '<Default Extension="config" ContentType="text/xml"/></Types>'
            )]
        },
        {
            s_path: '_rels/.rels',
            a_a_n_u8: [o_encoder.encode(
                '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                '<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'
            )]
        },
        { s_path: '3D/3dmodel.model', a_a_n_u8 },
        { s_path: 'Metadata/model_settings.config', a_a_n_u8: [o_encoder.encode(a_s__config.join(''))] }
    ], 'model/3mf');
};

export {
    f_o_mesh__from_stl,
    f_o_blob__3mf,
    f_o_blob__zip,
    f_n_crc32
};
