// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The print's pages as files: what makes a page's pixels a PNG that says how large it
// is on paper, and a PDF of one page of the sheet's size. The pixels themselves are the
// browser's, see page.module.js.

// The check sum a PNG ends each of its chunks with (CRC-32).
let a_n__crc = Uint32Array.from({ length: 256 }, function(v, n_idx){
    let n = n_idx;
    for(let n_bit = 0; n_bit < 8; n_bit++){ n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1; }
    return n;
});
let f_n_crc = function(a_n){
    let n = 0xFFFFFFFF;
    for(let n_byte of a_n){ n = a_n__crc[(n ^ n_byte) & 0xFF] ^ (n >>> 8); }
    return (n ^ 0xFFFFFFFF) >>> 0;
};

// A PNG's bytes with its size on paper written into them, n_px__per_mm pixels a mm: a
// chunk pHYs right behind the first one, which says the size in pixels. A program that
// prints or places a PNG reads it; without it most take 72 or 96 pixels an inch.
let f_a_n__png_sized = function(a_n__png, n_px__per_mm){
    // the file's 8 first bytes and the first chunk's 25
    let n_at = 33;
    let a_n__chunk = new Uint8Array(21);
    let o_view = new DataView(a_n__chunk.buffer);
    // its length, its name, pixels a metre along x and y, 1 for the metre, its check sum
    o_view.setUint32(0, 9);
    a_n__chunk.set([...'pHYs'].map(function(s){ return s.charCodeAt(0); }), 4);
    o_view.setUint32(8, Math.round(n_px__per_mm * 1000));
    o_view.setUint32(12, Math.round(n_px__per_mm * 1000));
    a_n__chunk[16] = 1;
    o_view.setUint32(17, f_n_crc(a_n__chunk.subarray(4, 17)));
    let a_n = new Uint8Array(a_n__png.length + a_n__chunk.length);
    a_n.set(a_n__png.subarray(0, n_at));
    a_n.set(a_n__chunk, n_at);
    a_n.set(a_n__png.subarray(n_at), n_at + a_n__chunk.length);
    return a_n;
};

// A PDF of one page, n_mm__x by n_mm__y, that one picture of n_px__x by n_px__y pixels
// fills. a_n__flate: the pixels, three bytes each for red, green and blue, row by row
// from the top, packed as zlib packs them (CompressionStream 'deflate'). The file in
// parts, for a Blob; all but the pixels is plain text, a letter a byte.
let f_a_v__pdf = function({ n_mm__x, n_mm__y, n_px__x, n_px__y, a_n__flate }){
    // a PDF measures in points, 72 an inch
    let [n_pt__x, n_pt__y] = [n_mm__x, n_mm__y].map(function(n_mm){ return +(n_mm * 72 / 25.4).toFixed(3); });
    let s_draw = `q ${n_pt__x} 0 0 ${n_pt__y} 0 0 cm /Im0 Do Q`;
    let a_a_v__object = [
        ['<< /Type /Catalog /Pages 2 0 R >>'],
        ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>'],
        [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n_pt__x} ${n_pt__y}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`],
        [`<< /Type /XObject /Subtype /Image /Width ${n_px__x} /Height ${n_px__y} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${a_n__flate.length} >>\nstream\n`, a_n__flate, '\nendstream'],
        [`<< /Length ${s_draw.length} >>\nstream\n${s_draw}\nendstream`]
    ];
    let a_v = ['%PDF-1.4\n'];
    let n_at = a_v[0].length;
    // where each object starts, counted in bytes from the file's start: the table at the end names it
    let a_n__at = [];
    a_a_v__object.forEach(function(a_v__object, n_idx){
        a_n__at.push(n_at);
        for(let v of [`${n_idx + 1} 0 obj\n`, ...a_v__object, '\nendobj\n']){
            a_v.push(v);
            n_at += v.length;
        }
    });
    a_v.push(
        `xref\n0 ${a_n__at.length + 1}\n0000000000 65535 f \n`
        + a_n__at.map(function(n){ return `${String(n).padStart(10, '0')} 00000 n \n`; }).join('')
        + `trailer\n<< /Size ${a_n__at.length + 1} /Root 1 0 R >>\nstartxref\n${n_at}\n%%EOF\n`
    );
    return a_v;
};

export { f_n_crc, f_a_n__png_sized, f_a_v__pdf };
