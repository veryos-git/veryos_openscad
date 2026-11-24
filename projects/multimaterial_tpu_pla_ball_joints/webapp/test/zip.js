// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Reads a zip back, for the tests: { path: text } of each file, by the central directory.
let f_o_s__unzipped = async function(a_n_u8){
    let o_view = new DataView(a_n_u8.buffer, a_n_u8.byteOffset, a_n_u8.byteLength);
    let n_end = a_n_u8.length - 22;
    while(o_view.getUint32(n_end, true) !== 0x06054b50){ n_end--; }
    let n_cnt = o_view.getUint16(n_end + 10, true);
    let n_off = o_view.getUint32(n_end + 16, true);
    let o_s = {};
    for(let n_it = 0; n_it < n_cnt; n_it++){
        let n_method = o_view.getUint16(n_off + 10, true);
        let n_scl = o_view.getUint32(n_off + 20, true);
        let n_scl__name = o_view.getUint16(n_off + 28, true);
        let n_scl__extra = o_view.getUint16(n_off + 30, true);
        let n_scl__comment = o_view.getUint16(n_off + 32, true);
        let n_off__local = o_view.getUint32(n_off + 42, true);
        let s_path = new TextDecoder().decode(a_n_u8.subarray(n_off + 46, n_off + 46 + n_scl__name));
        let n_off__data = n_off__local + 30 + o_view.getUint16(n_off__local + 26, true) + o_view.getUint16(n_off__local + 28, true);
        let a_n_u8__data = a_n_u8.subarray(n_off__data, n_off__data + n_scl);
        if(n_method === 8){
            let o_stream = new Blob([a_n_u8__data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
            a_n_u8__data = new Uint8Array(await new Response(o_stream).arrayBuffer());
        }
        o_s[s_path] = new TextDecoder().decode(a_n_u8__data);
        n_off += 46 + n_scl__name + n_scl__extra + n_scl__comment;
    }
    return o_s;
};

export { f_o_s__unzipped };
