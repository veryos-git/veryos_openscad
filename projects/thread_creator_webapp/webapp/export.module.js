// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Writes the parts and the screws as one 3MF, each where it lies on the bed, in its
// filaments: an object's own filament for the triangles it does not paint, and Bambu
// Studio's paint for the others. A 3MF is a zip holding XML, and browsers can deflate
// but not zip, so the small zip writer is here. The zip writer and the paint codes are
// the Lichterkette app's.

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

// A filament as Bambu Studio paints a whole triangle with it, from 1: its own
// TriangleSelector's code, as its 3MF files have it: 1 is 4, 2 is 8, 3 is 0C, 4 is 1C.
let f_s_paint = function(n_filament){
    return n_filament === 1 ? '4' : (n_filament === 2 ? '8' : `${(n_filament - 3).toString(16).toUpperCase()}C`);
};

let f_s_xml = function(s){
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
let f_s_hex = function(a_n_col){
    return '#' + a_n_col.map(function(n){ return n.toString(16).padStart(2, '0'); }).join('').toUpperCase();
};

// One mesh as an object of the 3MF, its points around its own middle, in pieces, as a
// single string could get too long. A triangle of another filament than the object's
// own is painted with it; 0 is the object's own.
let f_add_mesh_xml = function(a_a_n_u8, o_encoder, n_id, o_thing, a_n_middle){
    let n_cnt__per_piece = 40000;
    a_a_n_u8.push(o_encoder.encode(
        `<object id="${n_id}" name="${f_s_xml(o_thing.s_name)}" type="model" pid="1" pindex="${o_thing.n_fil - 1}"><mesh><vertices>`
    ));
    let a_s = [];
    for(let n_off = 0; n_off < o_thing.a_n_pos.length; n_off += 3){
        a_s.push(`<vertex x="${(o_thing.a_n_pos[n_off] - a_n_middle[0]).toFixed(4)}" y="${(o_thing.a_n_pos[n_off + 1] - a_n_middle[1]).toFixed(4)}" z="${(o_thing.a_n_pos[n_off + 2] - a_n_middle[2]).toFixed(4)}"/>`);
        if(a_s.length === n_cnt__per_piece){ a_a_n_u8.push(o_encoder.encode(a_s.join(''))); a_s = []; }
    }
    a_s.push('</vertices><triangles>');
    for(let n_tri = 0; n_tri < o_thing.a_n_idx.length / 3; n_tri++){
        let n_fil = o_thing.a_n_fil[n_tri];
        let s_paint = n_fil > 0 && n_fil !== o_thing.n_fil ? ` paint_color="${f_s_paint(n_fil)}"` : '';
        a_s.push(`<triangle v1="${o_thing.a_n_idx[n_tri * 3]}" v2="${o_thing.a_n_idx[n_tri * 3 + 1]}" v3="${o_thing.a_n_idx[n_tri * 3 + 2]}"${s_paint}/>`);
        if(a_s.length === n_cnt__per_piece){ a_a_n_u8.push(o_encoder.encode(a_s.join(''))); a_s = []; }
    }
    a_s.push('</triangles></mesh></object>');
    a_a_n_u8.push(o_encoder.encode(a_s.join('')));
};

// a_o_thing: { s_name, a_n_pos, a_n_idx, a_n_fil, n_fil }, each as it lies on the bed:
// its points where they are on it, its triangles' filaments and its own. a_a_n_col: the
// filaments' colours, r, g, b from 0 to 255, filament 1 first: written as the 3MF's
// materials, so that slicers without Bambu's metadata show the parts in their colours.
// Each object's own filament is in Metadata/model_settings.config too, as Bambu Studio
// and the Orca slicers read it.
let f_o_blob__3mf = async function(a_o_thing, a_a_n_col){
    let o_encoder = new TextEncoder();
    let a_a_n_u8 = [o_encoder.encode(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">' +
        '<metadata name="Application">VeryOS thread creator webapp</metadata><resources>' +
        '<basematerials id="1">' + a_a_n_col.map(function(a_n_col, n_idx){
            return `<base name="Filament ${n_idx + 1}" displaycolor="${f_s_hex(a_n_col)}"/>`;
        }).join('') + '</basematerials>'
    )];
    let a_s__config = ['<?xml version="1.0" encoding="UTF-8"?>\n<config>'];
    let a_s__item = [];
    let n_id = 2;
    for(let o_thing of a_o_thing){
        // Its middle above the bed: the object's own origin, where the slicer turns it.
        let a_n_min = [Infinity, Infinity, Infinity], a_n_max = [-Infinity, -Infinity, -Infinity];
        for(let n_off = 0; n_off < o_thing.a_n_pos.length; n_off += 3){
            for(let n_k = 0; n_k < 3; n_k++){
                a_n_min[n_k] = Math.min(a_n_min[n_k], o_thing.a_n_pos[n_off + n_k]);
                a_n_max[n_k] = Math.max(a_n_max[n_k], o_thing.a_n_pos[n_off + n_k]);
            }
        }
        let a_n_middle = [(a_n_min[0] + a_n_max[0]) / 2, (a_n_min[1] + a_n_max[1]) / 2, a_n_min[2]];
        let n_id__mesh = n_id++, n_id__object = n_id++;
        f_add_mesh_xml(a_a_n_u8, o_encoder, n_id__mesh, o_thing, a_n_middle);
        a_a_n_u8.push(o_encoder.encode(
            `<object id="${n_id__object}" name="${f_s_xml(o_thing.s_name)}" type="model"><components><component objectid="${n_id__mesh}"/></components></object>`
        ));
        a_s__item.push(`<item objectid="${n_id__object}" transform="1 0 0 0 1 0 0 0 1 ${a_n_middle[0].toFixed(4)} ${a_n_middle[1].toFixed(4)} ${a_n_middle[2].toFixed(4)}" printable="1"/>`);
        a_s__config.push(
            `<object id="${n_id__object}"><metadata key="name" value="${f_s_xml(o_thing.s_name)}"/><metadata key="extruder" value="${o_thing.n_fil}"/>` +
            `<part id="${n_id__mesh}" subtype="normal_part"><metadata key="name" value="${f_s_xml(o_thing.s_name)}"/>` +
            `<metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/><metadata key="extruder" value="${o_thing.n_fil}"/></part></object>`
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

export { f_s_paint, f_s_hex, f_o_blob__zip, f_o_blob__3mf };
