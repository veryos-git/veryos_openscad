// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Loads a seamless greyscale heightmap and prepares it for sampling. Bright is high.
// A canvas would round the 16-bit PNGs down to 8 bits, so they are decoded here.

let f_a_n_u8__inflated = async function(a_a_n_u8__chunk){
    let o_stream = new Blob(a_a_n_u8__chunk).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(o_stream).arrayBuffer());
};

// Undoes the PNG row filters in place. The first byte of each row names its filter.
let f_unfilter = function(a_n_u8, n_stride, n_scl_y, n_bytes_per_pixel){
    let n_stride__with_filter = n_stride + 1;
    for(let n_it_y = 0; n_it_y < n_scl_y; n_it_y++){
        let n_off = n_it_y * n_stride__with_filter + 1;
        let n_off__up = n_off - n_stride__with_filter;
        let n_filter = a_n_u8[n_off - 1];
        for(let n_it_x = 0; n_it_x < n_stride; n_it_x++){
            let n_left = n_it_x >= n_bytes_per_pixel ? a_n_u8[n_off + n_it_x - n_bytes_per_pixel] : 0;
            let n_up = n_it_y > 0 ? a_n_u8[n_off__up + n_it_x] : 0;
            let n_up_left = (n_it_y > 0 && n_it_x >= n_bytes_per_pixel) ? a_n_u8[n_off__up + n_it_x - n_bytes_per_pixel] : 0;
            let n_add = 0;
            if(n_filter === 1){ n_add = n_left; }
            else if(n_filter === 2){ n_add = n_up; }
            else if(n_filter === 3){ n_add = (n_left + n_up) >> 1; }
            else if(n_filter === 4){
                let n_estimate = n_left + n_up - n_up_left;
                let n_dist__left = Math.abs(n_estimate - n_left);
                let n_dist__up = Math.abs(n_estimate - n_up);
                let n_dist__up_left = Math.abs(n_estimate - n_up_left);
                n_add = (n_dist__left <= n_dist__up && n_dist__left <= n_dist__up_left) ? n_left
                    : (n_dist__up <= n_dist__up_left ? n_up : n_up_left);
            }
            a_n_u8[n_off + n_it_x] = (a_n_u8[n_off + n_it_x] + n_add) & 255;
        }
    }
};

// A greyscale PNG of 8 or 16 bits as raw values, 0 to 65535.
let f_o_image__from_png = async function(a_n_u8__png){
    let o_view = new DataView(a_n_u8__png.buffer, a_n_u8__png.byteOffset, a_n_u8__png.byteLength);
    if(o_view.getUint32(0) !== 0x89504e47){ throw new Error('not a PNG'); }
    let n_off = 8;
    let n_scl_x = 0, n_scl_y = 0, n_depth = 0;
    let a_a_n_u8__chunk = [];
    while(n_off < a_n_u8__png.length){
        let n_len = o_view.getUint32(n_off);
        let s_type = String.fromCharCode(...a_n_u8__png.subarray(n_off + 4, n_off + 8));
        if(s_type === 'IHDR'){
            n_scl_x = o_view.getUint32(n_off + 8);
            n_scl_y = o_view.getUint32(n_off + 12);
            n_depth = a_n_u8__png[n_off + 16];
            if(a_n_u8__png[n_off + 17] !== 0 || a_n_u8__png[n_off + 20] !== 0 || (n_depth !== 8 && n_depth !== 16)){
                throw new Error('only greyscale, non-interlaced PNGs of 8 or 16 bits are supported');
            }
        }
        if(s_type === 'IDAT'){ a_a_n_u8__chunk.push(a_n_u8__png.subarray(n_off + 8, n_off + 8 + n_len)); }
        if(s_type === 'IEND'){ break; }
        n_off += 12 + n_len;
    }
    let a_n_u8 = await f_a_n_u8__inflated(a_a_n_u8__chunk);
    let n_bytes_per_pixel = n_depth / 8;
    let n_stride = n_scl_x * n_bytes_per_pixel;
    f_unfilter(a_n_u8, n_stride, n_scl_y, n_bytes_per_pixel);
    let a_n_val = new Float32Array(n_scl_x * n_scl_y);
    for(let n_it_y = 0; n_it_y < n_scl_y; n_it_y++){
        let n_off__row = n_it_y * (n_stride + 1) + 1;
        for(let n_it_x = 0; n_it_x < n_scl_x; n_it_x++){
            a_n_val[n_it_y * n_scl_x + n_it_x] = n_depth === 16
                ? a_n_u8[n_off__row + n_it_x * 2] * 256 + a_n_u8[n_off__row + n_it_x * 2 + 1]
                : a_n_u8[n_off__row + n_it_x] * 257;
        }
    }
    return { n_scl_x, n_scl_y, a_n_val };
};

// Half the size in each direction, wrapping around, so a seamless tile stays seamless.
let f_o_image__halved = function(o_image){
    let n_scl_x = Math.max(1, o_image.n_scl_x >> 1);
    let n_scl_y = Math.max(1, o_image.n_scl_y >> 1);
    let a_n_val = new Float32Array(n_scl_x * n_scl_y);
    for(let n_it_y = 0; n_it_y < n_scl_y; n_it_y++){
        let n_y0 = (n_it_y * 2) % o_image.n_scl_y;
        let n_y1 = (n_y0 + 1) % o_image.n_scl_y;
        for(let n_it_x = 0; n_it_x < n_scl_x; n_it_x++){
            let n_x0 = (n_it_x * 2) % o_image.n_scl_x;
            let n_x1 = (n_x0 + 1) % o_image.n_scl_x;
            a_n_val[n_it_y * n_scl_x + n_it_x] = 0.25 * (
                o_image.a_n_val[n_y0 * o_image.n_scl_x + n_x0] + o_image.a_n_val[n_y0 * o_image.n_scl_x + n_x1] +
                o_image.a_n_val[n_y1 * o_image.n_scl_x + n_x0] + o_image.a_n_val[n_y1 * o_image.n_scl_x + n_x1]
            );
        }
    }
    return { n_scl_x, n_scl_y, a_n_val };
};

// Stretches the values to 0..1, so the relief slider is the true height of each pattern.
let f_o_image__normalized = function(o_image){
    let n_min = Infinity, n_max = -Infinity;
    for(let n_val of o_image.a_n_val){
        if(n_val < n_min){ n_min = n_val; }
        if(n_val > n_max){ n_max = n_val; }
    }
    let n_scl = 1 / Math.max(n_max - n_min, 1e-6);
    let a_n_val = new Float32Array(o_image.a_n_val.length);
    for(let n_idx = 0; n_idx < a_n_val.length; n_idx++){
        a_n_val[n_idx] = (o_image.a_n_val[n_idx] - n_min) * n_scl;
    }
    return { n_scl_x: o_image.n_scl_x, n_scl_y: o_image.n_scl_y, a_n_val };
};

let f_box_blur_rows = function(a_n_from, a_n_to, n_scl_x, n_scl_y, n_radius){
    let n_scl = 1 / (2 * n_radius + 1);
    for(let n_it_y = 0; n_it_y < n_scl_y; n_it_y++){
        let n_off = n_it_y * n_scl_x;
        let n_sum = 0;
        for(let n_it = -n_radius; n_it <= n_radius; n_it++){
            n_sum += a_n_from[n_off + ((n_it + n_scl_x) % n_scl_x)];
        }
        for(let n_it_x = 0; n_it_x < n_scl_x; n_it_x++){
            a_n_to[n_it_y + n_it_x * n_scl_y] = n_sum * n_scl;
            n_sum += a_n_from[n_off + ((n_it_x + n_radius + 1) % n_scl_x)];
            n_sum -= a_n_from[n_off + ((n_it_x - n_radius + n_scl_x) % n_scl_x)];
        }
    }
};

// Three box passes come close to a Gaussian. Each pass writes rows as columns, so
// two of them blur both directions and bring the image back upright.
let f_o_image__blurred = function(o_image, n_px__sigma){
    let n_radius = Math.round((Math.sqrt(4 * n_px__sigma * n_px__sigma + 1) - 1) / 2);
    if(n_radius < 1){ return o_image; }
    let { n_scl_x, n_scl_y } = o_image;
    let a_n_a = Float32Array.from(o_image.a_n_val);
    let a_n_b = new Float32Array(a_n_a.length);
    for(let n_it = 0; n_it < 3; n_it++){
        f_box_blur_rows(a_n_a, a_n_b, n_scl_x, n_scl_y, n_radius);
        f_box_blur_rows(a_n_b, a_n_a, n_scl_y, n_scl_x, n_radius);
    }
    return { n_scl_x, n_scl_y, a_n_val: a_n_a };
};

// The tile: its picture at several sizes, so a coarse mesh does not alias.
let f_o_tile = function(o_image){
    let a_o_level = [o_image];
    while(a_o_level[a_o_level.length - 1].n_scl_x > 16){
        a_o_level.push(f_o_image__halved(a_o_level[a_o_level.length - 1]));
    }
    return { a_o_level };
};

// The level with about one pixel per mesh column.
let f_o_level = function(o_tile, n_cnt__column_per_tile){
    let n_px_per_column = o_tile.a_o_level[0].n_scl_x / Math.max(n_cnt__column_per_tile, 1);
    let n_idx = Math.floor(Math.log2(Math.max(n_px_per_column, 1)));
    return o_tile.a_o_level[Math.min(n_idx, o_tile.a_o_level.length - 1)];
};

// Bilinear and periodic. u and v are in tiles, v runs down the picture.
let f_n_height = function(o_level, n_u, n_v){
    let { n_scl_x, n_scl_y, a_n_val } = o_level;
    let n_x = (n_u - Math.floor(n_u)) * n_scl_x;
    let n_y = (n_v - Math.floor(n_v)) * n_scl_y;
    let n_x0 = n_x | 0, n_y0 = n_y | 0;
    let n_fx = n_x - n_x0, n_fy = n_y - n_y0;
    n_x0 = n_x0 % n_scl_x;
    n_y0 = n_y0 % n_scl_y;
    let n_x1 = (n_x0 + 1) % n_scl_x;
    let n_y1 = (n_y0 + 1) % n_scl_y;
    let n_top = a_n_val[n_y0 * n_scl_x + n_x0] * (1 - n_fx) + a_n_val[n_y0 * n_scl_x + n_x1] * n_fx;
    let n_bottom = a_n_val[n_y1 * n_scl_x + n_x0] * (1 - n_fx) + a_n_val[n_y1 * n_scl_x + n_x1] * n_fx;
    return n_top * (1 - n_fy) + n_bottom * n_fy;
};

// A 2000 px tile holds more than any printable mesh can show, so it is kept at half
// that, which also makes switching patterns and the blur quicker.
let f_o_image__working = function(o_image__raw){
    let o_image = o_image__raw.n_scl_x >= 1600 ? f_o_image__halved(o_image__raw) : o_image__raw;
    return f_o_image__normalized(o_image);
};

export {
    f_o_image__from_png,
    f_o_image__working,
    f_o_image__blurred,
    f_o_tile,
    f_o_level,
    f_n_height
};
