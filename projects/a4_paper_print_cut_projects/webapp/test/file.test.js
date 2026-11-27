// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The print's pages as files: a PNG's check sum and the chunk that says its size on
// paper; a PDF's table of where its parts start, its page and its pixels read back.

import { f_n_crc, f_a_n__png_sized, f_a_v__pdf } from '../file.module.js';

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let f_a_n__of_text = function(s){ return new TextEncoder().encode(s); };
// The check sum bit by bit, as the PNG specification describes it, without a table.
let f_n_crc__slow = function(a_n){
    let n = 0xFFFFFFFF;
    for(let n_byte of a_n){
        n ^= n_byte;
        for(let n_bit = 0; n_bit < 8; n_bit++){ n = n & 1 ? (n >>> 1) ^ 0xEDB88320 : n >>> 1; }
    }
    return (n ^ 0xFFFFFFFF) >>> 0;
};
// A PNG's chunks: s_name, a_n its data, and whether its check sum is right.
let f_a_o_chunk = function(a_n__png){
    let o_view = new DataView(a_n__png.buffer, a_n__png.byteOffset, a_n__png.byteLength);
    let a_o_chunk = [];
    for(let n_at = 8; n_at < a_n__png.length;){
        let n_length = o_view.getUint32(n_at);
        a_o_chunk.push({
            s_name: new TextDecoder().decode(a_n__png.subarray(n_at + 4, n_at + 8)),
            a_n: a_n__png.subarray(n_at + 8, n_at + 8 + n_length),
            b_crc: o_view.getUint32(n_at + 8 + n_length) === f_n_crc__slow(a_n__png.subarray(n_at + 4, n_at + 8 + n_length))
        });
        n_at += 12 + n_length;
    }
    return a_o_chunk;
};
// a PNG of one pixel
let a_n__png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), function(s){ return s.charCodeAt(0); });

Deno.test('the check sum: the known ones, and the same as counted bit by bit', function(){
    assert(f_n_crc(f_a_n__of_text('123456789')) === 0xCBF43926, f_n_crc(f_a_n__of_text('123456789')).toString(16));
    // every PNG ends with this chunk and this sum
    assert(f_n_crc(f_a_n__of_text('IEND')) === 0xAE426082, 'IEND');
    assert(f_n_crc(new Uint8Array(0)) === 0, 'of nothing');
    let a_n = Uint8Array.from({ length: 1000 }, function(v, n_idx){ return (n_idx * 73 + 5) % 256; });
    assert(f_n_crc(a_n) === f_n_crc__slow(a_n), 'a thousand bytes');
});

Deno.test('a PNG that says its size: pixels a metre in a chunk of its own behind the first, all else as it was', function(){
    let a_o_chunk__before = f_a_o_chunk(a_n__png);
    assert(a_o_chunk__before.map(function(o){ return o.s_name; }).join() === 'IHDR,IDAT,IEND' && a_o_chunk__before.every(function(o){ return o.b_crc; }), 'the test\'s own PNG');
    for(let [n_px__per_mm, n_px__per_m] of [[300 / 25.4, 11811], [3508 / 297, 11811], [8192 / 1500, 5461], [1, 1000]]){
        let a_n = f_a_n__png_sized(a_n__png, n_px__per_mm);
        let a_o_chunk = f_a_o_chunk(a_n);
        assert(a_o_chunk.map(function(o){ return o.s_name; }).join() === 'IHDR,pHYs,IDAT,IEND', a_o_chunk.map(function(o){ return o.s_name; }).join());
        assert(a_o_chunk.every(function(o){ return o.b_crc; }), 'a check sum is wrong');
        let o_view = new DataView(a_o_chunk[1].a_n.buffer, a_o_chunk[1].a_n.byteOffset, 9);
        assert(o_view.getUint32(0) === n_px__per_m && o_view.getUint32(4) === n_px__per_m && o_view.getUint8(8) === 1, `${o_view.getUint32(0)} a metre`);
        assert(a_n.length === a_n__png.length + 21 && String(a_n.subarray(0, 33)) === String(a_n__png.subarray(0, 33)) && String(a_n.subarray(54)) === String(a_n__png.subarray(33)), 'the rest changed');
    }
    assert(String(f_a_o_chunk(a_n__png).map(function(o){ return o.s_name; })) === 'IHDR,IDAT,IEND', 'the PNG handed in is left alone');
});

Deno.test('a PDF of one page: the sheet\'s size in points, every part where the table says, the pixels as they were packed', async function(){
    // 3 by 2 pixels: red, green, blue; white, grey, black
    let a_n__rgb = Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 128, 128, 128, 0, 0, 0]);
    let a_n__flate = new Uint8Array(await new Response(new Blob([a_n__rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    let a_n = new Uint8Array(await new Blob(f_a_v__pdf({ n_mm__x: 297, n_mm__y: 210, n_px__x: 3, n_px__y: 2, a_n__flate })).arrayBuffer());
    // a byte a letter, also where the pixels are
    let s = String.fromCharCode(...a_n);
    assert(s.startsWith('%PDF-1.4\n') && s.endsWith('%%EOF\n'), 'start and end');
    assert(s.includes('/MediaBox [0 0 841.89 595.276]'), 'A4 lying is 841.89 by 595.276 points');
    assert(s.includes('q 841.89 0 0 595.276 0 0 cm /Im0 Do Q'), 'the picture fills the page');
    assert(s.includes(`/Width 3 /Height 2 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${a_n__flate.length} >>`), 'the picture\'s size');
    // the table: where it starts, how many parts, and each part at its place
    let n_at__xref = Number(s.match(/startxref\n(\d+)\n%%EOF\n$/)[1]);
    assert(s.slice(n_at__xref).startsWith('xref\n0 6\n0000000000 65535 f \n'), s.slice(n_at__xref, n_at__xref + 40));
    let a_s_row = s.slice(n_at__xref).split('\n').slice(3, 8);
    a_s_row.forEach(function(s_row, n_idx){
        assert(/^\d{10} 00000 n $/.test(s_row), s_row);
        assert(s.slice(Number(s_row.slice(0, 10))).startsWith(`${n_idx + 1} 0 obj\n`), `part ${n_idx + 1} is not at ${s_row.slice(0, 10)}`);
    });
    assert(s.includes('trailer\n<< /Size 6 /Root 1 0 R >>'), 'the trailer');
    // every stream as long as it says
    for(let o_found of s.matchAll(/\/Length (\d+) >>\nstream\n/g)){
        assert(s.slice(o_found.index + o_found[0].length + Number(o_found[1])).startsWith('\nendstream\nendobj\n'), `a stream is not ${o_found[1]} long`);
    }
    // the pixels, unpacked again
    let n_at = s.indexOf('stream\n') + 7;
    let a_n__back = new Uint8Array(await new Response(new Blob([a_n.subarray(n_at, n_at + a_n__flate.length)]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    assert(String(a_n__back) === String(a_n__rgb), String(a_n__back));
    // a sheet of another size
    let s_other = await new Blob(f_a_v__pdf({ n_mm__x: 215.9, n_mm__y: 279.4, n_px__x: 3, n_px__y: 2, a_n__flate })).text().catch(function(){ return ''; });
    assert(s_other.includes('/MediaBox [0 0 612 792]'), 'Letter standing is 612 by 792 points');
});
