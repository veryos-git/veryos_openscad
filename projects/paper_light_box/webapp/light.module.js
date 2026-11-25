// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// How the box looks lit, sheet by sheet from the back to the front. No browser needed.
//   - Through a hole one sees what is behind it, sharp.
//   - Material glows with the light that falls on its back, less by what it lets
//     through: all that the sheet behind sends out, blurred by the space between the
//     two. More space: softer glow.
//   - Each sheet the light passes makes it warmer, as paper and white filament do.
// A model for a preview, not a measurement: no light bounces back and forth.

// What a sheet does to red, green and blue of the light it lets through.
let a_n_tint = [1, 0.88, 0.7];
// How the room's light looks on a sheet's front.
let a_n_paper = [0.92, 0.9, 0.86];

// Three box blurs in a row come close to a Gaussian blur: their widths for a sigma.
let f_a_n__box = function(n_sigma){
    let n_ideal = Math.sqrt(12 * n_sigma * n_sigma / 3 + 1);
    let n_lo = Math.floor(n_ideal);
    if(n_lo % 2 === 0){ n_lo--; }
    let n_cnt__lo = Math.round((12 * n_sigma * n_sigma - 3 * n_lo * n_lo - 12 * n_lo - 9) / (-4 * n_lo - 4));
    return [0, 1, 2].map(function(n_it){ return n_it < n_cnt__lo ? n_lo : n_lo + 2; });
};

// One box blur along rows (n_step 1) or columns (n_step n_w); the edge's value goes on
// beyond the edge, as the box's white walls throw the light back.
let f_blur_line = function(a_n_src, a_n_dst, n_cnt__line, n_len, n_step__line, n_step, n_radius){
    let n_scale = 1 / (2 * n_radius + 1);
    for(let n_line = 0; n_line < n_cnt__line; n_line++){
        let n_off = n_line * n_step__line;
        let n_first = a_n_src[n_off], n_last = a_n_src[n_off + (n_len - 1) * n_step];
        let n_sum = n_first * (n_radius + 1);
        for(let n_it = 0; n_it < n_radius; n_it++){ n_sum += a_n_src[n_off + Math.min(n_it, n_len - 1) * n_step]; }
        for(let n_it = 0; n_it < n_len; n_it++){
            let n_in = n_it + n_radius, n_out = n_it - n_radius - 1;
            n_sum += n_in < n_len ? a_n_src[n_off + n_in * n_step] : n_last;
            n_sum -= n_out >= 0 ? a_n_src[n_off + n_out * n_step] : n_first;
            a_n_dst[n_off + n_it * n_step] = n_sum * n_scale;
        }
    }
};

// a_n blurred by n_sigma pixels, in place; a_n_tmp is working room of the same size.
let f_blur = function(a_n, a_n_tmp, n_w, n_h, n_sigma){
    if(n_sigma < 0.3){ return; }
    for(let n_box of f_a_n__box(n_sigma)){
        let n_radius = (n_box - 1) / 2;
        if(n_radius < 1){ continue; }
        f_blur_line(a_n, a_n_tmp, n_h, n_w, n_w, 1, n_radius);
        f_blur_line(a_n_tmp, a_n, n_w, n_h, 1, n_w, n_radius);
    }
};

// Brightness as a photo of a light box shows it, 0 to 255: the bright parts roll off
// instead of clipping, the dark ones stay dark, as with an exposure set for the light.
// From a table, as it is asked for every pixel of every sheet: 512 steps per 1, up to 8.
let a_n_tone = Float32Array.from({ length: 4097 }, function(n_unused, n_idx){ return 255 * (1 - Math.exp(-n_idx / 512)); });
let f_n_tone = function(n){
    return a_n_tone[n > 0 ? (n < 8 ? Math.round(n * 512) : 4096) : 0];
};

// o_scene:
//   n_w, n_h        the sheets in pixels
//   a_o_sheet       from the front to the back, each { a_n_material (0 to 1 per pixel),
//                   n_transmission (0 to 1), n_px__sigma: blur of the space behind it }
//   a_n_source      the light itself, per pixel, as seen from the front
//   a_n_colour      the light's red, green, blue, 0 to 1
//   n_brightness    exposure
//   n_room          the room's light on the sheets' fronts, 0 dark
// Gives a picture per sheet (RGBA, a hole is see-through) and one of the light behind.
let f_o_lit = function(o_scene){
    let { n_w, n_h, a_o_sheet, a_n_source, a_n_colour, n_brightness, n_room } = o_scene;
    let n_cnt = n_w * n_h;
    // what leaves towards the front behind the sheet at work, per colour
    let a_a_n_light = a_n_colour.map(function(n_colour){
        let a_n = new Float32Array(n_cnt);
        for(let n_it = 0; n_it < n_cnt; n_it++){ a_n[n_it] = a_n_source[n_it] * n_colour; }
        return a_n;
    });
    let a_n_rgba__back = new Uint8ClampedArray(n_cnt * 4);
    for(let n_it = 0; n_it < n_cnt; n_it++){
        for(let n_c = 0; n_c < 3; n_c++){
            a_n_rgba__back[4 * n_it + n_c] = f_n_tone(n_brightness * a_a_n_light[n_c][n_it] + n_room * 0.2 * a_n_paper[n_c]);
        }
        a_n_rgba__back[4 * n_it + 3] = 255;
    }
    let a_n_glow = new Float32Array(n_cnt);
    let a_n_tmp = new Float32Array(n_cnt);
    let a_a_n_rgba = [];
    for(let n_idx = a_o_sheet.length - 1; n_idx >= 0; n_idx--){
        let { a_n_material, n_transmission, n_px__sigma } = a_o_sheet[n_idx];
        let a_n_rgba = new Uint8ClampedArray(n_cnt * 4);
        // the room's light reaches the sheets further back less
        let n_front = n_room * Math.pow(0.75, n_idx);
        for(let n_c = 0; n_c < 3; n_c++){
            let a_n_light = a_a_n_light[n_c];
            a_n_glow.set(a_n_light);
            f_blur(a_n_glow, a_n_tmp, n_w, n_h, n_px__sigma);
            let n_through = n_transmission * a_n_tint[n_c];
            for(let n_it = 0; n_it < n_cnt; n_it++){
                let n_material = a_n_material[n_it];
                // a hole: nothing to draw, and the light behind goes on as it is
                if(n_material === 0){ continue; }
                let n_sheet = n_through * a_n_glow[n_it];
                a_n_rgba[4 * n_it + n_c] = f_n_tone(n_brightness * n_sheet + n_front * a_n_paper[n_c]);
                a_n_light[n_it] = n_material * n_sheet + (1 - n_material) * a_n_light[n_it];
            }
        }
        for(let n_it = 0; n_it < n_cnt; n_it++){ a_n_rgba[4 * n_it + 3] = 255 * a_o_sheet[n_idx].a_n_material[n_it]; }
        a_a_n_rgba[n_idx] = a_n_rgba;
    }
    return { a_a_n_rgba, a_n_rgba__back };
};

// The light as seen from the front, per pixel of a sheet. Both lights send about the
// same in all, so that one brightness suits both.
//   o_light: { s_kind: 'board', n_mm__x, n_mm__y: the board's middle on the sheet,
//              n_mm__w, n_mm__h: its field of LEDs, n_cnt__x, n_cnt__y: LEDs in it }
//         or { s_kind: 'puck', n_mm__x, n_mm__y: the lens's middle, n_mm__r: its radius }
let f_a_n__source = function(o_light, n_w, n_h, n_px__per_mm){
    // what is not the light itself throws some of the box's light back: more of it the
    // white board between its LEDs, less the wall around the puck's lens
    let a_n = new Float32Array(n_w * n_h).fill(o_light.s_kind === 'board' ? 0.12 : 0.04);
    if(o_light.s_kind === 'board'){
        let n_x0 = (o_light.n_mm__x - o_light.n_mm__w / 2) * n_px__per_mm, n_y0 = (o_light.n_mm__y - o_light.n_mm__h / 2) * n_px__per_mm;
        let n_px__x = o_light.n_mm__w / o_light.n_cnt__x * n_px__per_mm, n_px__y = o_light.n_mm__h / o_light.n_cnt__y * n_px__per_mm;
        // an LED is a dot of 2 x 2 pixels that sends what its share of the board would at 1
        let n_led = n_px__x * n_px__y / 4;
        for(let n_j = 0; n_j < o_light.n_cnt__y; n_j++){
            for(let n_i = 0; n_i < o_light.n_cnt__x; n_i++){
                let n_px = Math.round(n_x0 + (n_i + 0.5) * n_px__x), n_py = Math.round(n_y0 + (n_j + 0.5) * n_px__y);
                for(let [n_dx, n_dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]){
                    let n_x = n_px + n_dx, n_y = n_py + n_dy;
                    if(n_x >= 0 && n_y >= 0 && n_x < n_w && n_y < n_h){ a_n[n_y * n_w + n_x] = n_led; }
                }
            }
        }
        return a_n;
    }
    // the lens: as much light as a board 108 x 144 sends, from its small disc
    let n_px__r = o_light.n_mm__r * n_px__per_mm;
    let n_lens = 108 * 144 / (Math.PI * o_light.n_mm__r * o_light.n_mm__r);
    for(let n_y = 0; n_y < n_h; n_y++){
        for(let n_x = 0; n_x < n_w; n_x++){
            let n_dist = Math.hypot(n_x + 0.5 - o_light.n_mm__x * n_px__per_mm, n_y + 0.5 - o_light.n_mm__y * n_px__per_mm);
            a_n[n_y * n_w + n_x] += n_lens * Math.max(0, Math.min(1, n_px__r - n_dist + 0.5));
        }
    }
    return a_n;
};

export { f_o_lit, f_a_n__source, f_blur, f_a_n__box };
