// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The app around sphere_mesh.js: a Shadertoy-style shader draws a heightmap, longitude
// from left to right and latitude from bottom to top, and its brightness moves the
// sphere's outside. The colours map the height of each point. A project keeps it all
// under a name, through server.js. See readme.md.

const $ = (id) => document.getElementById(id);

const monaco_url = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min";
// One pixel per column and per row at the largest Columns, 2048.
const map_width = 2048;
const map_height = 1024;
const background = [0.082, 0.106, 0.114];
const view_background = [0.098, 0.133, 0.133];
const view_target = [0, 0, (centre_z + sphere_r) / 2];
// Half the height shown in the front, top and left views, in mm.
const view_half = 58;
// Waits this long after the last key before compiling, in ms.
const typing_pause = 400;

const templates = {
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
};

/* ---- Heightmap ---- */

const gl = $("view").getContext("webgl2", {antialias: true});

function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function link(vertex, fragment) {
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    return program;
}

const fullscreen_vertex = compile(gl.VERTEX_SHADER, `#version 300 es
void main() { gl_Position = vec4(vec2[3](vec2(-1, -1), vec2(3, -1), vec2(-1, 3))[gl_VertexID], 0, 1); }`);

// As in Shadertoy, with the sliders added. #line makes errors count the editor's lines.
const height_prefix = `#version 300 es
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
const height_suffix = `
void main() {
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    mainImage(color, gl_FragCoord.xy);
    float h = clamp(dot(color.rgb, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    height_out = vec4(vec3(pow(h, iGamma)), 1.0);
}`;

let height_program = null;

// Returns the errors, by the editor's lines. With errors the last good shader stays.
function compile_height_shader(code) {
    const fragment = compile(gl.FRAGMENT_SHADER, height_prefix + code + height_suffix);
    const log = gl.getShaderParameter(fragment, gl.COMPILE_STATUS) ? null : gl.getShaderInfoLog(fragment);
    if (log === null) {
        gl.deleteProgram(height_program);
        height_program = link(fullscreen_vertex, fragment);
    }
    gl.deleteShader(fragment);
    if (log === null) return [];
    const last_line = code.split("\n").length;
    return [...log.matchAll(/ERROR: \d+:(\d+): (.*)/g)]
        .map(([, line, message]) => ({line: Math.min(+line, last_line), message}));
}

/* ---- Texture: iChannel0 in the shader ---- */

// The map has 2048 pixels across, so a much wider texture would only cost memory.
const texture_max_width = 4096;
const black_pixel = new Uint8Array([0, 0, 0, 255]);
const channel_texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, channel_texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, black_pixel);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

let texture_blob = null;
// Since the project was last saved or opened.
let texture_changed = false;

async function set_texture(blob) {
    texture_blob = blob;
    gl.bindTexture(gl.TEXTURE_2D, channel_texture);
    if (blob) {
        // The image's top is the sphere's top: y = 1 in the shader.
        const image = await createImageBitmap(blob, {imageOrientation: "flipY", colorSpaceConversion: "none", premultiplyAlpha: "none"});
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        image.close();
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, black_pixel);
    }
    $("texture_remove").disabled = !blob;
}

// Any image the browser can read, as a PNG of a sensible size.
async function texture_png(file) {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, texture_max_width / image.width);
    const canvas = new OffscreenCanvas(Math.round(image.width * scale), Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    return canvas.convertToBlob({type: "image/png"});
}

const map_framebuffer = gl.createFramebuffer();
const map_texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, map_texture);
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, map_width, map_height);
gl.bindFramebuffer(gl.FRAMEBUFFER, map_framebuffer);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, map_texture, 0);
const map_pixels = new Uint8Array(map_width * map_height * 4);
const map_context = $("map").getContext("2d");
const map_image = map_context.createImageData(map_width, map_height);

function render_map() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, map_framebuffer);
    gl.viewport(0, 0, map_width, map_height);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(height_program);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, channel_texture);
    const uniform = (name) => gl.getUniformLocation(height_program, name);
    // A slider the shader does not read would do nothing.
    $("scale").disabled = uniform("iScale") === null;
    $("seed").disabled = uniform("iSeed") === null;
    gl.uniform3f(uniform("iResolution"), map_width, map_height, 1);
    gl.uniform1f(uniform("iScale"), +$("scale").value);
    gl.uniform1f(uniform("iSeed"), +$("seed").value);
    gl.uniform1f(uniform("iGamma"), +$("gamma").value);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, map_width, map_height, gl.RGBA, gl.UNSIGNED_BYTE, map_pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // GL's rows run bottom up, an image's top down.
    const row = map_width * 4;
    for (let y = 0; y < map_height; y++) {
        map_image.data.set(map_pixels.subarray((map_height - 1 - y) * row, (map_height - y) * row), y * row);
    }
    map_context.putImageData(map_image, 0, 0);
}

// The map between its pixels, from 0 to 1. It wraps around in longitude.
function map_height_at(lat, lon) {
    const x = lon / 360 * map_width - 0.5;
    const y = (lat + 90) / 180 * map_height - 0.5;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const xa = (x0 + map_width) % map_width;
    const xb = (x0 + 1 + map_width) % map_width;
    const ya = Math.max(y0, 0) * map_width;
    const yb = Math.min(y0 + 1, map_height - 1) * map_width;
    const low = map_pixels[(ya + xa) * 4] * (1 - fx) + map_pixels[(ya + xb) * 4] * fx;
    const high = map_pixels[(yb + xa) * 4] * (1 - fx) + map_pixels[(yb + xb) * 4] * fx;
    return (low * (1 - fy) + high * fy) / 255;
}

/* ---- The sphere on screen ---- */

const mesh_program = link(compile(gl.VERTEX_SHADER, `#version 300 es
in vec3 a_position;
in vec3 a_color;
uniform mat4 u_view, u_projection;
out vec3 v_position;
out vec3 v_color;
void main() {
    vec4 p = u_view * vec4(a_position, 1.0);
    v_position = p.xyz;
    v_color = a_color;
    gl_Position = u_projection * p;
}`), compile(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
in vec3 v_position;
in vec3 v_color;
out vec4 out_color;
void main() {
    // One normal per triangle: shows the mesh as it will be exported.
    vec3 n = normalize(cross(dFdx(v_position), dFdy(v_position)));
    float light = max(dot(n, normalize(vec3(-0.45, 0.6, 0.65))), 0.0);
    out_color = vec4(v_color * (0.3 + 0.7 * light), 1.0);
}`));

const mesh_vao = gl.createVertexArray();
const position_buffer = gl.createBuffer();
const color_buffer = gl.createBuffer();
const index_buffer = gl.createBuffer();
gl.bindVertexArray(mesh_vao);
gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
gl.enableVertexAttribArray(gl.getAttribLocation(mesh_program, "a_position"));
gl.vertexAttribPointer(gl.getAttribLocation(mesh_program, "a_position"), 3, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.enableVertexAttribArray(gl.getAttribLocation(mesh_program, "a_color"));
gl.vertexAttribPointer(gl.getAttribLocation(mesh_program, "a_color"), 3, gl.UNSIGNED_BYTE, true, 0, 0);
gl.bindVertexArray(null);

let mesh;
let colors;

function set_columns(columns) {
    mesh = sphere_mesh(columns);
    colors = new Uint8Array(mesh.positions.length);
    gl.bindVertexArray(mesh_vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
}
set_columns(+$("columns").value);

// In degrees: az = -90 looks at the front, el = 90 from the top.
const camera = {az: -60, el: 15, distance: 340};

function view_matrix(az, el, distance) {
    const [ca, sa, ce, se] = [cos_d(az), sin_d(az), cos_d(el), sin_d(el)];
    const x = [-sa, ca, 0];
    const y = [-se * ca, -se * sa, ce];
    const z = [ce * ca, ce * sa, se];
    const eye = view_target.map((t, i) => t + z[i] * distance);
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}

function perspective_matrix(aspect, near, far) {
    // 30 degrees over the shorter side.
    const f = 1 / Math.tan(15 / deg_per_rad);
    const fx = aspect < 1 ? f : f / aspect;
    const fy = aspect < 1 ? f * aspect : f;
    return [fx, 0, 0, 0, 0, fy, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
}

function ortho_matrix(half, near, far) {
    return [1 / half, 0, 0, 0, 0, 1 / half, 0, 0, 0, 0, 2 / (near - far), 0, 0, 0, (far + near) / (near - far), 1];
}

function draw_mesh(x, y, width, height, clear_color, view, projection) {
    gl.viewport(x, y, width, height);
    gl.scissor(x, y, width, height);
    gl.clearColor(...clear_color, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(gl.getUniformLocation(mesh_program, "u_view"), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(mesh_program, "u_projection"), false, projection);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_INT, 0);
}

function draw() {
    const canvas = $("view");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    // Setting a canvas's size clears and reallocates it, even to the same size.
    if (canvas.width !== Math.round(rect.width * dpr)) canvas.width = Math.round(rect.width * dpr);
    if (canvas.height !== Math.round(rect.height * dpr)) canvas.height = Math.round(rect.height * dpr);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.SCISSOR_TEST);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(mesh_program);
    gl.bindVertexArray(mesh_vao);

    draw_mesh(0, 0, canvas.width, canvas.height, background, view_matrix(camera.az, camera.el, camera.distance),
        perspective_matrix(canvas.width / canvas.height, Math.max(1, camera.distance - 120), camera.distance + 120));

    if (!$("views").hidden) {
        for (const view of document.querySelectorAll(".view")) {
            const cell = view.getBoundingClientRect();
            draw_mesh(Math.round((cell.left - rect.left) * dpr), Math.round((rect.bottom - cell.bottom) * dpr),
                Math.round(cell.width * dpr), Math.round(cell.height * dpr), view_background,
                view_matrix(+view.dataset.az, +view.dataset.el, 200), ortho_matrix(view_half, 50, 350));
        }
    }
    gl.bindVertexArray(null);
    $("cube").style.transform = `rotateX(${-camera.el}deg) rotateY(${-(camera.az + 90)}deg)`;
}

let draw_pending = false;
function request_draw() {
    if (draw_pending) return;
    draw_pending = true;
    requestAnimationFrame(() => {
        draw_pending = false;
        draw();
    });
}

let drag = null;
$("view").addEventListener("pointerdown", (e) => {
    drag = [e.clientX, e.clientY];
    $("view").setPointerCapture(e.pointerId);
});
$("view").addEventListener("pointermove", (e) => {
    if (!drag) return;
    camera.az -= (e.clientX - drag[0]) * 0.4;
    camera.el = Math.max(-90, Math.min(90, camera.el + (e.clientY - drag[1]) * 0.4));
    drag = [e.clientX, e.clientY];
    request_draw();
});
$("view").addEventListener("pointerup", () => { drag = null; });
$("view").addEventListener("wheel", (e) => {
    e.preventDefault();
    camera.distance = Math.max(130, Math.min(800, camera.distance * Math.exp(e.deltaY * 0.001)));
    request_draw();
}, {passive: false});
for (const face of $("cube").children) {
    face.addEventListener("click", () => {
        camera.az = +face.dataset.az;
        camera.el = +face.dataset.el;
        request_draw();
    });
}
$("toggle_views").addEventListener("click", () => {
    $("views").hidden = !$("views").hidden;
    $("toggle_views").textContent = $("views").hidden ? "▲" : "▼";
    request_draw();
});
new ResizeObserver(request_draw).observe($("right"));

/* ---- Colours ---- */

// t is the height, from 0 to 1, and color is [r, g, b] from 0 to 255.
const stops = [
    {t: 0, color: [56, 65, 52]},
    {t: 0.33, color: [112, 112, 78]},
    {t: 0.66, color: [240, 183, 80]},
    {t: 1, color: [255, 255, 255]},
];

function gradient_color(t) {
    const sorted = [...stops].sort((a, b) => a.t - b.t);
    if (t <= sorted[0].t) return sorted[0].color;
    for (let i = 1; i < sorted.length; i++) {
        const [a, b] = [sorted[i - 1], sorted[i]];
        if (t <= b.t) {
            const f = (t - a.t) / ((b.t - a.t) || 1);
            return a.color.map((x, k) => Math.round(x + (b.color[k] - x) * f));
        }
    }
    return sorted[sorted.length - 1].color;
}

// Paints each point by how far it has moved, so a point that stays gets the colour of 0.0.
function apply_colors() {
    const table = Array.from({length: 256}, (_, i) => gradient_color(i / 255));
    const {heights} = mesh;
    for (let i = 0; i < heights.length; i++) {
        const color = table[Math.round(heights[i] * 255)];
        colors[i * 3] = color[0];
        colors[i * 3 + 1] = color[1];
        colors[i * 3 + 2] = color[2];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, colors);
}

const rgb_css = (c) => `rgb(${c[0]} ${c[1]} ${c[2]})`;
let picked = null;

function paint_gradient() {
    const sorted = [...stops].sort((a, b) => a.t - b.t);
    const parts = sorted.map((s) => `${rgb_css(s.color)} ${s.t * 100}%`);
    $("gradient").style.background = `linear-gradient(to right, ${parts.join(", ")})`;
    for (const handle of $("gradient").children) {
        handle.style.left = `${handle.stop.t * 100}%`;
        handle.style.background = rgb_css(handle.stop.color);
        handle.classList.toggle("picked", handle.stop === picked);
    }
}

function colors_changed() {
    paint_gradient();
    apply_colors();
    request_draw();
    paint_project();
}

function add_handle(stop) {
    const handle = document.createElement("div");
    handle.className = "stop";
    handle.stop = stop;
    let start = null;
    handle.addEventListener("pointerdown", (e) => {
        start = e.clientX;
        handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", (e) => {
        if (start === null || Math.abs(e.clientX - start) < 3) return;
        start = Infinity;
        const bar = $("gradient").getBoundingClientRect();
        stop.t = Math.max(0, Math.min(1, (e.clientX - bar.left) / bar.width));
        colors_changed();
    });
    handle.addEventListener("pointerup", () => {
        if (start !== null && start !== Infinity) open_picker(stop);
        start = null;
    });
    $("gradient").append(handle);
}

$("add_stop").addEventListener("click", () => {
    // In the middle of the largest gap.
    const sorted = [...stops].map((s) => s.t).sort((a, b) => a - b);
    const edges = [0, ...sorted, 1];
    let gap = 0;
    for (let i = 1; i < edges.length; i++) if (edges[i] - edges[i - 1] > edges[gap + 1] - edges[gap]) gap = i - 1;
    const t = (edges[gap] + edges[gap + 1]) / 2;
    const stop = {t, color: [...gradient_color(t)]};
    stops.push(stop);
    add_handle(stop);
    open_picker(stop);
});

/* ---- Colour picker: saturation and value in the square, hue on the slider ---- */

const picker_hsv = {h: 0, s: 0, v: 1};

function hsv_to_rgb({h, s, v}) {
    const channel = (n) => {
        const k = (n + h / 60) % 6;
        return Math.round(255 * v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1))));
    };
    return [channel(5), channel(3), channel(1)];
}

function rgb_to_hsv([r, g, b]) {
    const v = Math.max(r, g, b) / 255;
    const d = v - Math.min(r, g, b) / 255;
    const s = v ? d / v : 0;
    let h = picker_hsv.h;
    if (d) {
        const [x, y, z] = [r / 255, g / 255, b / 255];
        h = 60 * (v === x ? ((y - z) / d + 6) % 6 : v === y ? (z - x) / d + 2 : (x - y) / d + 4);
    }
    return {h, s, v};
}

function sync_picker() {
    const {h, s, v} = picker_hsv;
    $("picker_square").style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h} 100% 50%))`;
    $("picker_knob").style.left = `${s * 100}%`;
    $("picker_knob").style.top = `${(1 - v) * 100}%`;
    $("picker_hue").value = h;
    ["r", "g", "b"].forEach((name, i) => {
        if (document.activeElement !== $(`picker_${name}`)) $(`picker_${name}`).value = picked.color[i];
    });
    $("picker_remove").disabled = stops.length <= 2;
}

function open_picker(stop) {
    picked = stop;
    Object.assign(picker_hsv, rgb_to_hsv(stop.color));
    $("picker").hidden = false;
    sync_picker();
    paint_gradient();
}

function close_picker() {
    picked = null;
    $("picker").hidden = true;
    paint_gradient();
}

function picker_changed() {
    picked.color = hsv_to_rgb(picker_hsv);
    sync_picker();
    colors_changed();
}

$("picker_hue").addEventListener("input", () => {
    picker_hsv.h = +$("picker_hue").value;
    picker_changed();
});
function pick_on_square(e) {
    const square = $("picker_square").getBoundingClientRect();
    picker_hsv.s = Math.max(0, Math.min(1, (e.clientX - square.left) / square.width));
    picker_hsv.v = 1 - Math.max(0, Math.min(1, (e.clientY - square.top) / square.height));
    picker_changed();
}
$("picker_square").addEventListener("pointerdown", (e) => {
    $("picker_square").setPointerCapture(e.pointerId);
    pick_on_square(e);
});
$("picker_square").addEventListener("pointermove", (e) => {
    if ($("picker_square").hasPointerCapture(e.pointerId)) pick_on_square(e);
});
["r", "g", "b"].forEach((name, i) => {
    $(`picker_${name}`).addEventListener("input", (e) => {
        picked.color = [...picked.color];
        picked.color[i] = Math.max(0, Math.min(255, Math.round(+e.target.value || 0)));
        Object.assign(picker_hsv, rgb_to_hsv(picked.color));
        sync_picker();
        colors_changed();
    });
});
$("picker_remove").addEventListener("click", () => {
    stops.splice(stops.indexOf(picked), 1);
    [...$("gradient").children].find((handle) => handle.stop === picked).remove();
    close_picker();
    colors_changed();
});
document.addEventListener("pointerdown", (e) => {
    if (picked && !$("picker").contains(e.target) && !e.target.closest(".stop, #add_stop")) close_picker();
});

/* ---- Updating ---- */

let code = templates.voronoi;
let compiled_code = null;
let shader_errors = [];
let set_markers = () => {};
let update_pending = false;

function show_status(text, kind = "") {
    $("status").textContent = text;
    $("status").className = kind;
}

let offset_count = 0;

// What the status says when nothing is going on.
function show_result() {
    if (shader_errors.length) {
        show_status(`line ${shader_errors[0].line}: ${shader_errors[0].message}`, "error");
    } else {
        const unused = texture_blob && gl.getUniformLocation(height_program, "iChannel0") === null;
        show_status(`ready: ${mesh.positions.length / 3} vertices, ${offset_count} offset${unused ? "; this shader does not use the texture: iChannel0" : ""}`);
    }
}

function update() {
    if (code !== compiled_code) {
        compiled_code = code;
        shader_errors = compile_height_shader(code);
        set_markers(shader_errors);
    }
    if (+$("columns").value !== mesh.columns) set_columns(+$("columns").value);
    render_map();
    offset_count = displace(mesh, map_height_at, +$("depth").value, +$("relief_from").value);
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.positions);
    apply_colors();
    draw();
    show_result();
    paint_project();
}

// Waits a moment, so the status shows before the work starts.
function schedule_update() {
    show_status("updating, please wait...", "busy");
    if (update_pending) return;
    update_pending = true;
    requestAnimationFrame(() => setTimeout(() => {
        update_pending = false;
        update();
    }));
}

const sliders = ["scale", "seed", "gamma", "depth", "relief_from"];
const show_slider_value = (name) => { $(`${name}_value`).textContent = $(name).value; };
for (const name of sliders) {
    show_slider_value(name);
    $(name).addEventListener("input", () => {
        show_slider_value(name);
        schedule_update();
    });
}
$("columns").addEventListener("change", schedule_update);

/* ---- Editor ---- */

let typing_timer = null;
let latest_code = code;

function code_changed(text) {
    latest_code = text;
    clearTimeout(typing_timer);
    if (text === code) return;
    show_status("updating, please wait...", "busy");
    typing_timer = setTimeout(flush_code, typing_pause);
}

function flush_code() {
    clearTimeout(typing_timer);
    if (latest_code === code) return;
    code = latest_code;
    schedule_update();
}

// Puts other code into the editor, in effect at the next update.
function load_code(text) {
    clearTimeout(typing_timer);
    code = latest_code = text;
    set_code(text);
}

let set_code = (text) => {};

function start_monaco() {
    // The worker comes from another origin, so it has to start through a data URL.
    const worker = `self.MonacoEnvironment = {baseUrl: "${monaco_url}/"}; importScripts("${monaco_url}/vs/base/worker/workerMain.js");`;
    window.MonacoEnvironment = {getWorkerUrl: () => `data:text/javascript;charset=utf-8,${encodeURIComponent(worker)}`};
    require.config({paths: {vs: `${monaco_url}/vs`}});
    require(["vs/editor/editor.main"], () => {
        const editor = monaco.editor.create($("editor"), {
            value: code, language: "cpp", theme: "vs-dark", automaticLayout: true,
            minimap: {enabled: false}, scrollBeyondLastLine: false, fontSize: 13, tabSize: 4, lineNumbersMinChars: 3,
            wordWrap: "on",
        });
        editor.onDidChangeModelContent(() => code_changed(editor.getValue()));
        set_code = (text) => editor.setValue(text);
        set_markers = (errors) => monaco.editor.setModelMarkers(editor.getModel(), "glsl", errors.map((e) => ({
            severity: monaco.MarkerSeverity.Error, message: e.message,
            startLineNumber: e.line, endLineNumber: e.line, startColumn: 1, endColumn: 1000,
        })));
        set_markers(shader_errors);
    }, start_textarea);
}

// Without the internet there is no Monaco, but the app still works with this.
function start_textarea() {
    const area = document.createElement("textarea");
    area.spellcheck = false;
    area.value = code;
    area.addEventListener("input", () => code_changed(area.value));
    $("editor").append(area);
    set_code = (text) => { area.value = text; };
}

for (const name of Object.keys(templates)) $("template").add(new Option(name));
$("template").addEventListener("change", () => {
    load_code(templates[$("template").value]);
    schedule_update();
});

$("texture_load").addEventListener("click", () => $("texture_file").click());
$("texture_file").addEventListener("change", async () => {
    const [file] = $("texture_file").files;
    $("texture_file").value = "";
    if (!file) return;
    show_status("updating, please wait...", "busy");
    try {
        await set_texture(await texture_png(file));
    } catch {
        show_status(`cannot read ${file.name}: browsers read PNG, JPEG and WebP, but not TIFF`, "error");
        return;
    }
    texture_changed = true;
    // A template left as it is cannot show the texture, but this one can.
    if (Object.values(templates).includes(code)) {
        $("template").value = "texture";
        load_code(templates.texture);
    }
    schedule_update();
});
$("texture_remove").addEventListener("click", async () => {
    await set_texture(null);
    texture_changed = true;
    schedule_update();
});

/* ---- Projects: a name, and everything above, kept by server.js ---- */

// The name of the open project.
let project = null;
let project_names = [];
let saved_state = null;

function get_state() {
    const state = {template: $("template").value, code};
    for (const name of sliders) state[name] = +$(name).value;
    state.columns = +$("columns").value;
    state.stops = stops.map(({t, color}) => ({t, color}));
    state.texture = texture_blob !== null;
    return state;
}

function apply_state(state) {
    $("template").value = state.template;
    load_code(state.code);
    for (const name of sliders) {
        $(name).value = state[name];
        show_slider_value(name);
    }
    $("columns").value = state.columns;
    close_picker();
    stops.splice(0, stops.length, ...state.stops);
    $("gradient").replaceChildren();
    stops.forEach(add_handle);
    paint_gradient();
}

function is_dirty() {
    return project !== null && (texture_changed || JSON.stringify(get_state()) !== saved_state);
}

function paint_project() {
    const dirty = is_dirty();
    const selected = $("project").selectedOptions[0];
    if (selected) selected.text = dirty ? `${project} *` : project;
    $("project_save").classList.toggle("dirty", dirty);
    $("project_rename").disabled = project === null;
    $("project_delete").disabled = project === null;
}

async function api(method, path, body) {
    const response = await fetch(`api/projects${path}`, {method, body, cache: "no-store"});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
}

const project_path = (name) => `/${encodeURIComponent(name)}`;

async function refresh_projects() {
    project_names = await api("GET", "");
    $("project").replaceChildren(...project_names.map((name) => new Option(name, name)));
    $("project").value = project;
}

// What is open now is what is on disk.
function mark_saved() {
    saved_state = JSON.stringify(get_state());
    texture_changed = false;
    history.replaceState(null, "", project === null ? location.pathname : `#${encodeURIComponent(project)}`);
    paint_project();
}

async function open_project(name) {
    const state = await api("GET", project_path(name));
    const texture = state.texture
        ? await (await fetch(`projects/${encodeURIComponent(name)}/texture.png`, {cache: "no-store"})).blob()
        : null;
    await set_texture(texture);
    project = name;
    apply_state(state);
    $("project").value = name;
    mark_saved();
    schedule_update();
}

async function store(name, method) {
    flush_code();
    await api(method, project_path(name), JSON.stringify(get_state()));
    if (texture_blob) await api("PUT", `${project_path(name)}/texture`, texture_blob);
    else if (method === "PUT") await api("DELETE", `${project_path(name)}/texture`);
}

async function new_project() {
    const name = prompt("Name of the new project? It starts as a copy of this one.");
    if (!name) return;
    await store(name, "POST");
    project = name;
    await refresh_projects();
    mark_saved();
    show_status(`created ${name}`);
}

async function save_project() {
    if (project === null) return new_project();
    await store(project, "PUT");
    mark_saved();
    show_status(`saved ${project}`);
}

async function rename_project() {
    const wanted = prompt("New name?", project);
    if (!wanted || wanted === project) return;
    const {name} = await api("PATCH", project_path(project), JSON.stringify({name: wanted}));
    project = name;
    await refresh_projects();
    history.replaceState(null, "", `#${encodeURIComponent(name)}`);
    paint_project();
}

async function delete_project() {
    if (!confirm(`Delete the project ${project} and its texture?`)) return;
    await api("DELETE", project_path(project));
    const deleted = project;
    project = null;
    await refresh_projects();
    if (project_names.length) await open_project(project_names[0]);
    else mark_saved();
    show_status(`deleted ${deleted}`);
}

async function switch_project() {
    const name = $("project").value;
    if (is_dirty() && !confirm(`Discard the changes in ${project}?`)) {
        $("project").value = project;
        return;
    }
    await open_project(name);
}

// Without a server, as when opening index.html as a file, there are no projects.
async function start_projects() {
    if (location.protocol === "file:") {
        for (const id of ["project", "project_new", "project_save", "project_rename", "project_delete"]) {
            $(id).disabled = true;
            $(id).title = "Projects need the server: deno task start";
        }
        return;
    }
    await refresh_projects();
    const wanted = decodeURIComponent(location.hash.slice(1));
    const first = project_names.includes(wanted) ? wanted : project_names[0];
    if (first) await open_project(first);
    else mark_saved();
}

// Shows what went wrong, as the server said it.
const project_action = (action) => async () => {
    try {
        await action();
    } catch (error) {
        show_status(error.message, "error");
    }
};

$("project").addEventListener("change", project_action(switch_project));
$("project_new").addEventListener("click", project_action(new_project));
$("project_save").addEventListener("click", project_action(save_project));
$("project_rename").addEventListener("click", project_action(rename_project));
$("project_delete").addEventListener("click", project_action(delete_project));
addEventListener("beforeunload", (e) => {
    if (is_dirty()) e.preventDefault();
});

/* ---- Download ---- */

function save(data, extension) {
    const link_element = document.createElement("a");
    link_element.href = URL.createObjectURL(new Blob([data]));
    link_element.download = `pucklight_sphere_${(project ?? $("template").value).replace(/\s+/g, "_")}.${extension}`;
    link_element.click();
    setTimeout(() => URL.revokeObjectURL(link_element.href), 4000);
}

function download(extension, make) {
    show_status(`writing .${extension}, please wait...`, "busy");
    requestAnimationFrame(() => setTimeout(() => {
        save(make(), extension);
        show_result();
    }));
}

$("download_obj").addEventListener("click", () => download("obj", () => mesh_to_obj(mesh, colors)));
$("download_stl").addEventListener("click", () => download("stl", () => mesh_to_stl(mesh)));

/* ---- Start ---- */

stops.forEach(add_handle);
paint_gradient();
$("texture_remove").disabled = true;
if (window.require) start_monaco();
else start_textarea();
project_action(start_projects)().finally(schedule_update);
