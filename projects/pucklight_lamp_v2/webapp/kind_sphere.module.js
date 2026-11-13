// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The sphere: a Shadertoy-style shader draws a heightmap, longitude from left to right
// and latitude from bottom to top, from a formula or a loaded texture, and its
// brightness moves the sphere's outside. The colours map the height of each point.

import { el } from './dom.module.js';
import { f_el__control, f_el__group, f_el__button } from './control.module.js';
import { f_a_n_col__of_stop, f_a_n_col__sphere } from './color.module.js';

// One pixel per column and per row at the largest Columns, 2048.
let n_scl_x__map = 2048;
let n_scl_y__map = 1024;
// The map has 2048 pixels across, so a much wider texture would only cost memory.
let n_scl_x__texture_max = 4096;
// Waits this long after the last key before compiling, in ms.
let n_ms__typing = 400;
let n_gram_per_mm3 = 0.00124; // PLA

let o_s_template = {
    voronoi: `// Voronoi cells on the sphere. White stands out by the full depth, so the walls
// are thick and dark when lit, and the thin cells glow.
//
// fragCoord / iResolution.xy is the longitude and the latitude, both from 0 to 1.
// sphereDir() turns them into the point on the sphere, so a pattern made
// from that point has no seam and no squeezed cells at the top.
// iScale and iSeed are the sliders; gamma is applied after this shader.

vec3 random3(float i) {
    return fract(sin(vec3(i + iSeed * 97.0) * vec3(12.9898, 78.233, 37.719)) * 43758.5453) - 0.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec3 p = sphereDir(fragCoord / iResolution.xy);

    // The cells' centres, spread evenly over the sphere, then moved at random.
    int cells = int(iScale * iScale);
    float nearest = 9.0;
    float second = 9.0;
    for (int i = 0; i < cells; i++) {
        float z = 1.0 - (2.0 * float(i) + 1.0) / float(cells);
        float a = 2.39996323 * float(i);
        vec3 centre = vec3(sqrt(1.0 - z * z) * vec2(cos(a), sin(a)), z);
        centre = normalize(centre + random3(float(i)) * 2.0 / iScale);

        float d = distance(p, centre);
        if (d < nearest) {
            second = nearest;
            nearest = d;
        } else if (d < second) {
            second = d;
        }
    }

    // A wall is where the two nearest centres are about as far away.
    float h = 1.0 - smoothstep(0.02, 0.07, second - nearest);
    fragColor = vec4(vec3(h), 1.0);
}
`,
    texture: `// The loaded texture as the heightmap. White stands out by the full depth.
//
// iChannel0 is the texture; its left and right edges wrap around. This turns the
// middle of the map to the sphere's front: change 0.25 to turn it.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture(iChannel0, uv - vec2(0.25, 0.0));
}
`,
    lithophane: `// The loaded texture as a lithophane. Black stands out by the full depth, so the
// dark parts are thick and dark when lit, and the light parts glow: as in the photo.
//
// iChannel0 is the texture; its left and right edges wrap around. This turns the
// middle of the map to the sphere's front: change 0.25 to turn it.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(1.0 - texture(iChannel0, uv - vec2(0.25, 0.0)).rgb, 1.0);
}
`
};

let s_vertex = `#version 300 es
void main() { gl_Position = vec4(vec2[3](vec2(-1, -1), vec2(3, -1), vec2(-1, 3))[gl_VertexID], 0, 1); }`;

// As in Shadertoy, with the sliders added. #line makes errors count the editor's lines.
let s_fragment__prefix = `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iScale, iSeed, iGamma;
uniform sampler2D iChannel0;
const float iTime = 0.0;
const int iFrame = 0;
const vec4 iMouse = vec4(0.0);
out vec4 height_out;
vec3 sphereDir(vec2 uv) {
    float lon = uv.x * 6.28318530718;
    float lat = (uv.y - 0.5) * 3.14159265359;
    return vec3(cos(lat) * cos(lon), cos(lat) * sin(lon), sin(lat));
}
#line 1
`;
let s_fragment__suffix = `
void main() {
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    mainImage(color, gl_FragCoord.xy);
    float h = clamp(dot(color.rgb, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    height_out = vec4(vec3(pow(h, iGamma)), 1.0);
}`;

let a_o_control = [
    { s_key: 'n_scale', s_label: 'Scale', n_min: 2, n_max: 24, n_step: 0.1, s_unit: '', n_decimal: 1 },
    { s_key: 'n_seed', s_label: 'Seed', n_min: 0, n_max: 100, n_step: 1, s_unit: '', n_decimal: 0 },
    { s_key: 'n_gamma', s_label: 'Gamma', n_min: 0.3, n_max: 3, n_step: 0.05, s_unit: '', n_decimal: 2, s_note: 'Height = brightness ^ gamma, after the shader.' },
    { s_key: 'n_mm__depth', s_label: 'Depth', n_min: 0.2, n_max: 5, n_step: 0.1, s_unit: ' mm', n_decimal: 1, s_note: 'How far white stands out.' },
    { s_key: 'n_deg__relief_from', s_label: 'From latitude', n_min: -43, n_max: 10, n_step: 0.1, s_unit: '°', n_decimal: 1, s_note: 'Where the relief starts; below it the sphere stays smooth. A planet can reach down to the neck.' },
    { s_key: 'n_cnt__column', s_label: 'Columns', a_v_option: [180, 360, 720, 1024, 1440, 2048], s_note: 'The mesh’s resolution around the sphere.' }
];

let f_o_setting__default = function(){
    return {
        s_template: 'voronoi',
        s_code: o_s_template.voronoi,
        n_scale: 12,
        n_seed: 3,
        n_gamma: 1,
        n_mm__depth: 0.8,
        n_deg__relief_from: -19.7,
        n_cnt__column: 720,
        // n_t is the height, from 0 to 1, and a_n_col is r, g, b from 0 to 255.
        a_o_stop: [
            { n_t: 0, a_n_col: [56, 65, 52] },
            { n_t: 0.33, a_n_col: [112, 112, 78] },
            { n_t: 0.66, a_n_col: [240, 183, 80] },
            { n_t: 1, a_n_col: [255, 255, 255] }
        ],
        b_texture: false
    };
};

let f_s_rgb = function(a_n_col){ return `rgb(${a_n_col[0]} ${a_n_col[1]} ${a_n_col[2]})`; };

let f_a_n_rgb__of_hsv = function({ n_h, n_s, n_v }){
    let f_n = function(n){
        let n_k = (n + n_h / 60) % 6;
        return Math.round(255 * n_v * (1 - n_s * Math.max(0, Math.min(n_k, 4 - n_k, 1))));
    };
    return [f_n(5), f_n(3), f_n(1)];
};

// A grey has no hue: it keeps the one it had.
let f_o_hsv__of_rgb = function([n_r, n_g, n_b], n_h__before){
    let n_v = Math.max(n_r, n_g, n_b) / 255;
    let n_d = n_v - Math.min(n_r, n_g, n_b) / 255;
    let n_s = n_v ? n_d / n_v : 0;
    let n_h = n_h__before;
    if(n_d){
        let [n_x, n_y, n_z] = [n_r / 255, n_g / 255, n_b / 255];
        n_h = 60 * (n_v === n_x ? ((n_y - n_z) / n_d + 6) % 6 : n_v === n_y ? (n_z - n_x) / n_d + 2 : (n_x - n_y) / n_d + 4);
    }
    return { n_h, n_s, n_v };
};

// o_app: what the page gives a kind, see client.module.js.
let f_o_kind__sphere = function(o_app){
    let o_setting = null;
    let a_n_height = null;

    /* ---- Heightmap: the shader draws it into the map's own canvas ---- */

    let el_map = el('canvas', { id: 'el_map', width: n_scl_x__map, height: n_scl_y__map, title: 'The heightmap: longitude from left to right, the top of the sphere at the top' });
    let o_gl = el_map.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    let o_program = null;
    let s_code__compiled = null;
    let a_o_error = [];
    let a_n_u8__pixel = new Uint8Array(n_scl_x__map * n_scl_y__map * 4);
    let o_texture = null;
    let a_n_u8__black = new Uint8Array([0, 0, 0, 255]);
    let o_blob__texture = null;
    // Since the lamp was last saved or opened.
    let b_texture_changed = false;

    let f_o_shader = function(n_type, s_source){
        let o_shader = o_gl.createShader(n_type);
        o_gl.shaderSource(o_shader, s_source);
        o_gl.compileShader(o_shader);
        return o_shader;
    };
    if(o_gl){
        o_texture = o_gl.createTexture();
        o_gl.bindTexture(o_gl.TEXTURE_2D, o_texture);
        o_gl.texImage2D(o_gl.TEXTURE_2D, 0, o_gl.RGBA8, 1, 1, 0, o_gl.RGBA, o_gl.UNSIGNED_BYTE, a_n_u8__black);
        o_gl.texParameteri(o_gl.TEXTURE_2D, o_gl.TEXTURE_MIN_FILTER, o_gl.LINEAR_MIPMAP_LINEAR);
        o_gl.texParameteri(o_gl.TEXTURE_2D, o_gl.TEXTURE_WRAP_S, o_gl.REPEAT);
        o_gl.texParameteri(o_gl.TEXTURE_2D, o_gl.TEXTURE_WRAP_T, o_gl.CLAMP_TO_EDGE);
    }

    // Finds the mistakes, by the editor's lines. With mistakes the last good shader stays.
    let f_compile = function(s_code){
        s_code__compiled = s_code;
        let o_fragment = f_o_shader(o_gl.FRAGMENT_SHADER, s_fragment__prefix + s_code + s_fragment__suffix);
        let s_log = o_gl.getShaderParameter(o_fragment, o_gl.COMPILE_STATUS) ? null : o_gl.getShaderInfoLog(o_fragment);
        if(s_log === null){
            o_gl.deleteProgram(o_program);
            o_program = o_gl.createProgram();
            o_gl.attachShader(o_program, f_o_shader(o_gl.VERTEX_SHADER, s_vertex));
            o_gl.attachShader(o_program, o_fragment);
            o_gl.linkProgram(o_program);
            a_o_error = [];
        } else {
            let n_line__last = s_code.split('\n').length;
            a_o_error = [...s_log.matchAll(/ERROR: \d+:(\d+): (.*)/g)].map(function([, s_line, s_message]){
                return { n_line: Math.min(Number(s_line), n_line__last), s_message };
            });
            if(a_o_error.length === 0){ a_o_error = [{ n_line: 1, s_message: s_log }]; }
        }
        o_gl.deleteShader(o_fragment);
        o_app.o_editor.f_set_marker(a_o_error);
    };

    let f_set_texture = async function(o_blob){
        o_blob__texture = o_blob;
        if(!o_gl){ return; }
        o_gl.bindTexture(o_gl.TEXTURE_2D, o_texture);
        if(o_blob){
            // The image's top is the sphere's top: y = 1 in the shader.
            let o_image = await createImageBitmap(o_blob, { imageOrientation: 'flipY', colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
            o_gl.texImage2D(o_gl.TEXTURE_2D, 0, o_gl.RGBA8, o_gl.RGBA, o_gl.UNSIGNED_BYTE, o_image);
            o_gl.generateMipmap(o_gl.TEXTURE_2D);
            o_image.close();
        } else {
            o_gl.texImage2D(o_gl.TEXTURE_2D, 0, o_gl.RGBA8, 1, 1, 0, o_gl.RGBA, o_gl.UNSIGNED_BYTE, a_n_u8__black);
        }
        el_remove.disabled = !o_blob;
    };

    // Any image the browser can read, as a PNG of a sensible size.
    let f_o_blob__png = async function(o_file){
        let o_image = await createImageBitmap(o_file);
        let n_scl = Math.min(1, n_scl_x__texture_max / o_image.width);
        let o_canvas = new OffscreenCanvas(Math.round(o_image.width * n_scl), Math.round(o_image.height * n_scl));
        o_canvas.getContext('2d').drawImage(o_image, 0, 0, o_canvas.width, o_canvas.height);
        o_image.close();
        return o_canvas.convertToBlob({ type: 'image/png' });
    };

    // Draws the map, and returns its heights: a byte per pixel, the rows bottom up.
    let f_a_n_u8__map = function(){
        o_gl.viewport(0, 0, n_scl_x__map, n_scl_y__map);
        o_gl.useProgram(o_program);
        o_gl.bindTexture(o_gl.TEXTURE_2D, o_texture);
        let f_o_uniform = function(s_name){ return o_gl.getUniformLocation(o_program, s_name); };
        // A slider the shader does not read would do nothing.
        for(let [s_key, s_uniform] of [['n_scale', 'iScale'], ['n_seed', 'iSeed']]){
            let el_input = el_control.querySelector(`[data-key="${s_key}"]`);
            if(el_input){ el_input.disabled = f_o_uniform(s_uniform) === null; }
        }
        o_gl.uniform3f(f_o_uniform('iResolution'), n_scl_x__map, n_scl_y__map, 1);
        o_gl.uniform1f(f_o_uniform('iScale'), o_setting.n_scale);
        o_gl.uniform1f(f_o_uniform('iSeed'), o_setting.n_seed);
        o_gl.uniform1f(f_o_uniform('iGamma'), o_setting.n_gamma);
        o_gl.drawArrays(o_gl.TRIANGLES, 0, 3);
        o_gl.readPixels(0, 0, n_scl_x__map, n_scl_y__map, o_gl.RGBA, o_gl.UNSIGNED_BYTE, a_n_u8__pixel);
        let a_n_u8 = new Uint8Array(n_scl_x__map * n_scl_y__map);
        for(let n_idx = 0; n_idx < a_n_u8.length; n_idx++){ a_n_u8[n_idx] = a_n_u8__pixel[n_idx * 4]; }
        return a_n_u8;
    };

    /* ---- Controls ---- */

    let el_source = el('div', { className: 'source', hidden: true }, [el_map]);
    let el_control = el('div', { hidden: true });
    let el_template = el('select', {}, Object.keys(o_s_template).map(function(s_name){ return el('option', { value: s_name, textContent: s_name }); }));
    el_template.setAttribute('aria-label', 'Template');
    let el_file = el('input', { type: 'file', accept: 'image/*', hidden: true });
    let el_remove = f_el__button('Remove', async function(){
        await f_set_texture(null);
        b_texture_changed = true;
        o_setting.b_texture = false;
        o_app.f_changed();
    });
    el_remove.disabled = true;
    let el_slider = el('div');
    let el_gradient = el('div', { id: 'el_gradient' });
    let el_picker = el('div', { id: 'el_picker', hidden: true });
    o_app.el_source.append(el_source);
    o_app.el_control.append(el_control);

    // A new text for the editor, in effect at once.
    let f_load_code = function(s_code){
        clearTimeout(n_id__typing);
        o_setting.s_code = s_code;
        o_app.o_editor.f_set('cpp', s_code);
    };

    el_template.addEventListener('change', function(){
        o_setting.s_template = el_template.value;
        f_load_code(o_s_template[el_template.value]);
        o_app.f_changed();
    });
    el_file.addEventListener('change', async function(){
        let [o_file] = el_file.files;
        el_file.value = '';
        if(!o_file){ return; }
        o_app.f_set_status('Reading the texture…');
        try{
            await f_set_texture(await f_o_blob__png(o_file));
        } catch(o_error){
            o_app.f_set_status(`Cannot read ${o_file.name}: browsers read PNG, JPEG and WebP, but not TIFF.`, true);
            return;
        }
        b_texture_changed = true;
        o_setting.b_texture = true;
        // A template left as it is, without iChannel0, cannot show the texture, but this one can.
        if(Object.values(o_s_template).includes(o_setting.s_code) && !o_setting.s_code.includes('iChannel0')){
            el_template.value = o_setting.s_template = 'texture';
            f_load_code(o_s_template.texture);
        }
        o_app.f_changed();
    });

    /* ---- Colours: the gradient's stops, and the picker of one ---- */

    let o_stop__picked = null;
    let o_hsv = { n_h: 0, n_s: 0, n_v: 1 };
    let el_square = el('div', { id: 'el_picker_square' });
    let el_knob = el('div', { id: 'el_picker_knob' });
    let el_hue = el('input', { type: 'range', id: 'el_picker_hue', min: 0, max: 360, step: 1 });
    let a_el_rgb = ['r', 'g', 'b'].map(function(){ return el('input', { type: 'number', min: 0, max: 255 }); });
    let el_remove_stop = f_el__button('Remove', function(){
        o_setting.a_o_stop.splice(o_setting.a_o_stop.indexOf(o_stop__picked), 1);
        f_close_picker();
        f_render_stop();
        f_recolor();
    });
    el_square.append(el_knob);
    el_picker.append(
        el_square,
        el('div', { id: 'el_picker_rgb' }, [
            ...['r', 'g', 'b'].map(function(s_name, n_idx){ return el('label', {}, [s_name + ' ', a_el_rgb[n_idx]]); }),
            el_remove_stop
        ]),
        el('div', { id: 'el_picker_hue_row' }, [el('span', { textContent: '0' }), el_hue, el('span', { textContent: '360' })])
    );

    let f_paint_gradient = function(){
        let a_o_sorted = [...o_setting.a_o_stop].sort(function(o_a, o_b){ return o_a.n_t - o_b.n_t; });
        el_gradient.style.background = `linear-gradient(to right, ${a_o_sorted.map(function(o_stop){ return `${f_s_rgb(o_stop.a_n_col)} ${o_stop.n_t * 100}%`; }).join(', ')})`;
        for(let el_handle of el_gradient.children){
            el_handle.style.left = `${el_handle.o_stop.n_t * 100}%`;
            el_handle.style.background = f_s_rgb(el_handle.o_stop.a_n_col);
            el_handle.classList.toggle('picked', el_handle.o_stop === o_stop__picked);
        }
    };

    // Paints the points anew, without building the sphere again.
    let f_recolor = function(){
        f_paint_gradient();
        if(a_n_height){ o_app.f_recolored(f_a_n_col__sphere(a_n_height, o_setting.a_o_stop)); }
        o_app.f_touched();
    };

    let f_sync_picker = function(){
        el_square.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${o_hsv.n_h} 100% 50%))`;
        el_knob.style.left = `${o_hsv.n_s * 100}%`;
        el_knob.style.top = `${(1 - o_hsv.n_v) * 100}%`;
        el_hue.value = o_hsv.n_h;
        a_el_rgb.forEach(function(el_input, n_idx){
            if(document.activeElement !== el_input){ el_input.value = o_stop__picked.a_n_col[n_idx]; }
        });
        el_remove_stop.disabled = o_setting.a_o_stop.length <= 2;
    };
    let f_open_picker = function(o_stop){
        o_stop__picked = o_stop;
        o_hsv = f_o_hsv__of_rgb(o_stop.a_n_col, o_hsv.n_h);
        el_picker.hidden = false;
        f_sync_picker();
        f_paint_gradient();
    };
    let f_close_picker = function(){
        o_stop__picked = null;
        el_picker.hidden = true;
        f_paint_gradient();
    };
    let f_picked = function(){
        o_stop__picked.a_n_col = f_a_n_rgb__of_hsv(o_hsv);
        f_sync_picker();
        f_recolor();
    };
    el_hue.addEventListener('input', function(){
        o_hsv.n_h = Number(el_hue.value);
        f_picked();
    });
    let f_pick_on_square = function(o_evt){
        let o_rect = el_square.getBoundingClientRect();
        o_hsv.n_s = Math.max(0, Math.min(1, (o_evt.clientX - o_rect.left) / o_rect.width));
        o_hsv.n_v = 1 - Math.max(0, Math.min(1, (o_evt.clientY - o_rect.top) / o_rect.height));
        f_picked();
    };
    el_square.addEventListener('pointerdown', function(o_evt){
        el_square.setPointerCapture(o_evt.pointerId);
        f_pick_on_square(o_evt);
    });
    el_square.addEventListener('pointermove', function(o_evt){
        if(el_square.hasPointerCapture(o_evt.pointerId)){ f_pick_on_square(o_evt); }
    });
    a_el_rgb.forEach(function(el_input, n_idx){
        el_input.addEventListener('input', function(){
            o_stop__picked.a_n_col = [...o_stop__picked.a_n_col];
            o_stop__picked.a_n_col[n_idx] = Math.max(0, Math.min(255, Math.round(Number(el_input.value) || 0)));
            o_hsv = f_o_hsv__of_rgb(o_stop__picked.a_n_col, o_hsv.n_h);
            f_sync_picker();
            f_recolor();
        });
    });
    document.addEventListener('pointerdown', function(o_evt){
        if(o_stop__picked && !el_picker.contains(o_evt.target) && !o_evt.target.closest('.stop, #el_add_stop')){ f_close_picker(); }
    });

    // A stop's handle: a drag moves it, a click opens its picker.
    let f_el__handle = function(o_stop){
        let el_handle = el('div', { className: 'stop' });
        el_handle.o_stop = o_stop;
        let n_x__start = null;
        el_handle.addEventListener('pointerdown', function(o_evt){
            n_x__start = o_evt.clientX;
            el_handle.setPointerCapture(o_evt.pointerId);
        });
        el_handle.addEventListener('pointermove', function(o_evt){
            if(n_x__start === null || Math.abs(o_evt.clientX - n_x__start) < 3){ return; }
            n_x__start = Infinity;
            let o_rect = el_gradient.getBoundingClientRect();
            o_stop.n_t = Math.max(0, Math.min(1, (o_evt.clientX - o_rect.left) / o_rect.width));
            f_recolor();
        });
        el_handle.addEventListener('pointerup', function(){
            if(n_x__start !== null && n_x__start !== Infinity){ f_open_picker(o_stop); }
            n_x__start = null;
        });
        return el_handle;
    };
    let f_render_stop = function(){
        el_gradient.replaceChildren(...o_setting.a_o_stop.map(f_el__handle));
        f_paint_gradient();
    };
    let el_add_stop = f_el__button('+', function(){
        // In the middle of the largest gap.
        let a_n_t = [0, ...o_setting.a_o_stop.map(function(o_stop){ return o_stop.n_t; }).sort(function(n_a, n_b){ return n_a - n_b; }), 1];
        let n_idx__gap = 0;
        for(let n_idx = 1; n_idx < a_n_t.length; n_idx++){
            if(a_n_t[n_idx] - a_n_t[n_idx - 1] > a_n_t[n_idx__gap + 1] - a_n_t[n_idx__gap]){ n_idx__gap = n_idx - 1; }
        }
        let n_t = (a_n_t[n_idx__gap] + a_n_t[n_idx__gap + 1]) / 2;
        let o_stop = { n_t, a_n_col: [...f_a_n_col__of_stop(o_setting.a_o_stop, n_t)] };
        o_setting.a_o_stop.push(o_stop);
        f_render_stop();
        f_open_picker(o_stop);
        f_recolor();
    });
    el_add_stop.id = 'el_add_stop';
    el_add_stop.title = 'Add a colour';

    el_control.append(
        f_el__group('Shader', [
            el('label', { className: 'row' }, [el('span', { className: 'row__top' }, [el('span', { textContent: 'Template' }), el_template])]),
            el('div', { className: 'row' }, [
                el('span', { className: 'row__top' }, [
                    el('span', { textContent: 'Texture' }),
                    el('span', { className: 'tool_row' }, [f_el__button('Load', function(){ el_file.click(); }), el_remove, el_file])
                ]),
                el('small', { className: 'row__note', textContent: 'A picture the browser can read: the shader gets it as iChannel0.' })
            ]),
            el_slider
        ]),
        f_el__group('Colours', [
            el('div', { id: 'el_gradient_end' }, [el('span', { textContent: '0.0' }), el('span', { textContent: '1.0' })]),
            el('div', { id: 'el_gradient_row' }, [el_gradient, el_add_stop]),
            el('small', { className: 'row__note row', textContent: 'Height to colour: the view and the .obj. Two stops on one place make a hard edge.' }),
            el_picker
        ])
    );

    let n_id__typing = 0;

    return {
        s_kind: 'sphere',
        s_title: 'Sphere',
        s_note: 'A shader or a picture as relief on a sphere: planets, lithophanes, patterns.',
        // White filament.
        a_n_absorb: [0.36, 0.4, 0.46],
        b_draft: false,
        b_editor: true,
        f_o_setting__default,
        // A lamp saved by an older version gets the defaults of what was added since.
        f_o_setting__of_saved: function(o_saved){
            return { ...f_o_setting__default(), ...structuredClone(o_saved) };
        },
        // Puts a lamp's settings on screen: from here on they are the ones it changes.
        f_show: function(o_setting__shown){
            o_setting = o_setting__shown;
            a_n_height = null;
            f_close_picker();
            el_template.value = o_setting.s_template;
            el_slider.replaceChildren(...a_o_control.map(function(o_control){ return f_el__control(o_control, o_setting, o_app.f_changed); }));
            f_render_stop();
            o_app.o_editor.f_set('cpp', o_setting.s_code);
            // Compiled anew, so the editor shows this text's mistakes.
            s_code__compiled = null;
            el_source.hidden = false;
            el_control.hidden = false;
        },
        f_hide: function(){
            clearTimeout(n_id__typing);
            // Hidden before it was ever shown, it has no stops to paint yet.
            if(o_setting){ f_close_picker(); }
            el_source.hidden = true;
            el_control.hidden = true;
        },
        // The person typed: the text is the lamp's at once, the sphere follows after a pause.
        f_typed: function(s_code){
            o_setting.s_code = s_code;
            o_app.f_touched();
            o_app.f_set_status('Updating…');
            clearTimeout(n_id__typing);
            n_id__typing = setTimeout(o_app.f_changed, n_ms__typing);
        },
        // What the worker needs besides the settings: the heightmap.
        f_o_request: function(){
            if(!o_gl){ throw new Error('This browser has no WebGL2, which draws the heightmap.'); }
            if(o_setting.s_code !== s_code__compiled){ f_compile(o_setting.s_code); }
            if(!o_program){ throw new Error(`line ${a_o_error[0].n_line}: ${a_o_error[0].s_message}`); }
            let a_n_u8__map = f_a_n_u8__map();
            return { o_field: { a_n_u8__map, n_scl_x__map, n_scl_y__map }, a_o_transfer: [a_n_u8__map.buffer] };
        },
        // What to say about a sphere the worker built.
        f_o_report: function(o_data){
            a_n_height = o_data.a_n_height;
            let o_stat = o_data.o_stat;
            let a_s_note = [];
            if(o_blob__texture && o_gl.getUniformLocation(o_program, 'iChannel0') === null){
                a_s_note.push('This shader does not use the texture: iChannel0.');
            }
            return {
                a_a_s_row: [
                    ['Vertices', String(o_stat.n_cnt__vertex)],
                    ['Moved by the relief', String(o_stat.n_cnt__offset)],
                    ['Filament', `${(o_stat.n_mm3 * n_gram_per_mm3).toFixed(0)} g`]
                ],
                a_s_note,
                s_error: a_o_error.length ? `line ${a_o_error[0].n_line}: ${a_o_error[0].s_message}` : ''
            };
        },
        f_s_summary: function(o_saved){
            return `Sphere · ${o_saved.s_template}${o_saved.b_texture ? ' · texture' : ''} · ${o_saved.n_cnt__column} columns`;
        },
        f_s_src__thumbnail: function(o_saved, s_name){
            return o_saved.b_texture ? `/api/project/${encodeURIComponent(s_name)}/texture` : null;
        },
        // The texture is a file of its own beside the lamp's settings.
        f_load_extra: async function(s_name, o_saved){
            let o_blob = null;
            if(o_saved.b_texture){
                let o_response = await fetch(`/api/project/${encodeURIComponent(s_name)}/texture`, { cache: 'no-store' });
                if(o_response.ok){ o_blob = await o_response.blob(); }
            }
            await f_set_texture(o_blob);
            b_texture_changed = false;
        },
        f_save_extra: async function(s_name){
            let s_url = `/api/project/${encodeURIComponent(s_name)}/texture`;
            let o_response = o_blob__texture ? await fetch(s_url, { method: 'PUT', body: o_blob__texture }) : await fetch(s_url, { method: 'DELETE' });
            if(!o_response.ok){ throw new Error((await o_response.json()).s_message); }
            b_texture_changed = false;
        },
        // A lamp that is no sphere any more gives up its texture.
        f_drop_extra: async function(s_name){
            await fetch(`/api/project/${encodeURIComponent(s_name)}/texture`, { method: 'DELETE' });
        },
        f_reset_extra: async function(){
            await f_set_texture(null);
            b_texture_changed = false;
        },
        f_b_extra_dirty: function(){ return b_texture_changed; }
    };
};

export { f_o_kind__sphere };
