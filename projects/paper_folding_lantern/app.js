// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
import { f_o_decorations } from "./decorations.js";

const f_o_element = (s_id) => document.getElementById(s_id);
const o_form = f_o_element("settings");
const o_status = f_o_element("status");
const o_error = f_o_element("error");
const o_viewer = f_o_element("viewer");
const o_canvas = f_o_element("folded-preview");
const o_cut = f_o_element("cut-preview");
const o_cut_sheet = f_o_element("cut-sheet");
const o_fold_overlay = f_o_element("fold-overlay");
const o_download_svg = f_o_element("download-svg");
const o_download_stl = f_o_element("download-stl");
const o_dimensions = f_o_element("dimensions");
const o_surface_editor = f_o_element("surface-editor");
let a_o_parameter = [];
let o_current = null;
let n_revision = 0;
let n_timer;
let b_running = false;
let b_pending = false;
let b_webgl_problem = false;
let o_decorations = null;
let s_view = "folded";

const o_text = {
    paper_thickness: "Paper thickness",
    lantern_width: "Lantern width",
    wall_height: "Wall height",
    roof_height: "Roof height",
    window_width: "Window width",
    window_height: "Window height",
    hanger_width: "Hanger opening",
    hanger_height: "Hanger tab",
    hanger_hole: "Hanging hole",
    glue_tab: "Glue tab",
    fold_slit_width: "Fold slit width",
    fold_dash_length: "Fold dash length",
    fold_dash_gap: "Fold dash gap",
};
const a_o_group = [
    { s_title: "Lantern", a_s_name: ["lantern_width", "wall_height", "roof_height"] },
    { s_title: "Windows", a_s_name: ["window_width", "window_height"] },
    { s_title: "Hanger", a_s_name: ["hanger_width", "hanger_height", "hanger_hole"] },
    { s_title: "Paper, glue & folds", a_s_name: ["paper_thickness", "glue_tab", "fold_slit_width", "fold_dash_length", "fold_dash_gap"] },
];

function f_parameters() {
    return Object.fromEntries(a_o_parameter.map((o) => [
        o.s_name, o.a_n_range
            ? Number(o_form.elements[o.s_name].value)
            : o_form.elements[o.s_name].value,
    ]));
}

// A dependency-free WebGL viewer for the actual OpenSCAD triangle mesh.
function f_o_viewer() {
    const o_gl = o_canvas.getContext("webgl", { antialias: true, alpha: true });
    if (!o_gl) throw new Error("3D preview needs WebGL. You can still inspect and download the cutting template.");
    const s_vertex = `
        attribute vec3 a_position;
        attribute vec3 a_normal;
        uniform vec3 u_center;
        uniform vec2 u_angle;
        uniform vec3 u_scale;
        varying vec3 v_normal;
        vec3 turn(vec3 p) {
            p = vec3(p.x, p.z, -p.y);
            float c = cos(u_angle.x), s = sin(u_angle.x);
            p = vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
            c = cos(u_angle.y); s = sin(u_angle.y);
            return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);
        }
        void main() {
            gl_Position = vec4(turn(a_position - u_center) * u_scale, 1.0);
            v_normal = turn(a_normal);
        }`;
    const s_fragment = `
        precision mediump float;
        varying vec3 v_normal;
        void main() {
            vec3 n = normalize(v_normal) * (gl_FrontFacing ? 1.0 : -1.0);
            float key = max(0.0, dot(n, normalize(vec3(-0.55, 0.72, 1.0))));
            float fill = max(0.0, dot(n, normalize(vec3(0.65, -0.65, 0.4))));
            float light = 0.48 + 0.65 * key + 0.20 * fill;
            gl_FragColor = vec4(vec3(0.40, 0.23, 0.44) * light, 1.0);
        }`;
    const o_program = o_gl.createProgram();
    for (const [n_type, s_source] of [[o_gl.VERTEX_SHADER, s_vertex], [o_gl.FRAGMENT_SHADER, s_fragment]]) {
        const o_shader = o_gl.createShader(n_type);
        o_gl.shaderSource(o_shader, s_source);
        o_gl.compileShader(o_shader);
        if (!o_gl.getShaderParameter(o_shader, o_gl.COMPILE_STATUS)) throw new Error(o_gl.getShaderInfoLog(o_shader));
        o_gl.attachShader(o_program, o_shader);
    }
    o_gl.linkProgram(o_program);
    if (!o_gl.getProgramParameter(o_program, o_gl.LINK_STATUS)) {
        throw new Error(`Could not initialize the 3D preview: ${o_gl.getProgramInfoLog(o_program)}`);
    }
    o_gl.useProgram(o_program);
    o_gl.enable(o_gl.DEPTH_TEST);
    o_gl.clearColor(0, 0, 0, 0);
    const o_buffer = o_gl.createBuffer();
    o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_buffer);
    for (const [s_name, n_offset] of [["a_position", 0], ["a_normal", 12]]) {
        const n_location = o_gl.getAttribLocation(o_program, s_name);
        o_gl.enableVertexAttribArray(n_location);
        o_gl.vertexAttribPointer(n_location, 3, o_gl.FLOAT, false, 24, n_offset);
    }
    const o_center = o_gl.getUniformLocation(o_program, "u_center");
    const o_angle = o_gl.getUniformLocation(o_program, "u_angle");
    const o_scale = o_gl.getUniformLocation(o_program, "u_scale");
    let n_count = 0, n_radius = 60, n_yaw = 2.55, n_pitch = 0.28, n_zoom = 1;
    let a_n_center = [0, 0, 0];

    function f_draw() {
        const n_pixel = Math.min(devicePixelRatio || 1, 2);
        const n_width = Math.max(1, Math.round(o_canvas.clientWidth * n_pixel));
        const n_height = Math.max(1, Math.round(o_canvas.clientHeight * n_pixel));
        if (o_canvas.width !== n_width || o_canvas.height !== n_height) {
            o_canvas.width = n_width;
            o_canvas.height = n_height;
        }
        o_gl.viewport(0, 0, n_width, n_height);
        o_gl.clear(o_gl.COLOR_BUFFER_BIT | o_gl.DEPTH_BUFFER_BIT);
        const n_aspect = n_width / n_height;
        const n_scale = 0.78 * n_zoom / n_radius * Math.min(1, n_aspect);
        o_gl.uniform3fv(o_center, a_n_center);
        o_gl.uniform2f(o_angle, n_yaw, n_pitch);
        o_gl.uniform3f(o_scale, n_scale / n_aspect, n_scale, -1 / (n_radius * 3));
        o_gl.drawArrays(o_gl.TRIANGLES, 0, n_count);
    }

    function f_set_mesh(a_n_position) {
        const a_n_min = [Infinity, Infinity, Infinity], a_n_max = [-Infinity, -Infinity, -Infinity];
        const a_n_data = [];
        for (let n = 0; n < a_n_position.length; n += 9) {
            const a = a_n_position.slice(n, n + 3);
            const b = a_n_position.slice(n + 3, n + 6);
            const c = a_n_position.slice(n + 6, n + 9);
            const u = b.map((v, i) => v - a[i]);
            const v = c.map((v, i) => v - a[i]);
            const a_n_normal = [
                u[1] * v[2] - u[2] * v[1],
                u[2] * v[0] - u[0] * v[2],
                u[0] * v[1] - u[1] * v[0],
            ];
            const n_length = Math.hypot(...a_n_normal) || 1;
            for (const a_n_point of [a, b, c]) {
                a_n_data.push(...a_n_point, ...a_n_normal.map((n_value) => n_value / n_length));
                for (let i = 0; i < 3; i++) {
                    a_n_min[i] = Math.min(a_n_min[i], a_n_point[i]);
                    a_n_max[i] = Math.max(a_n_max[i], a_n_point[i]);
                }
            }
        }
        if (!a_n_data.length) return;
        a_n_center = a_n_min.map((n, i) => (n + a_n_max[i]) / 2);
        n_radius = Math.hypot(...a_n_max.map((n, i) => n - a_n_center[i])) || 60;
        n_count = a_n_position.length / 3;
        o_gl.bufferData(o_gl.ARRAY_BUFFER, new Float32Array(a_n_data), o_gl.STATIC_DRAW);
        f_draw();
    }

    let o_pointer = null;
    o_canvas.addEventListener("pointerdown", (o_event) => {
        o_pointer = { x: o_event.clientX, y: o_event.clientY };
        o_canvas.setPointerCapture(o_event.pointerId);
    });
    o_canvas.addEventListener("pointermove", (o_event) => {
        if (!o_pointer) return;
        n_yaw += (o_event.clientX - o_pointer.x) * 0.01;
        n_pitch = Math.max(-1.4, Math.min(1.4, n_pitch + (o_event.clientY - o_pointer.y) * 0.01));
        o_pointer = { x: o_event.clientX, y: o_event.clientY };
        f_draw();
    });
    for (const s_event of ["pointerup", "pointercancel", "lostpointercapture"]) {
        o_canvas.addEventListener(s_event, () => { o_pointer = null; });
    }
    o_canvas.addEventListener("wheel", (o_event) => {
        o_event.preventDefault();
        n_zoom = Math.max(0.5, Math.min(2.5, n_zoom * Math.exp(-o_event.deltaY * 0.001)));
        f_draw();
    }, { passive: false });
    o_canvas.addEventListener("keydown", (o_event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"].includes(o_event.key)) return;
        o_event.preventDefault();
        if (o_event.key === "ArrowLeft") n_yaw -= 0.1;
        if (o_event.key === "ArrowRight") n_yaw += 0.1;
        if (o_event.key === "ArrowUp") n_pitch = Math.max(-1.4, n_pitch - 0.1);
        if (o_event.key === "ArrowDown") n_pitch = Math.min(1.4, n_pitch + 0.1);
        if (o_event.key === "+" || o_event.key === "=") n_zoom = Math.min(2.5, n_zoom * 1.1);
        if (o_event.key === "-") n_zoom = Math.max(0.5, n_zoom / 1.1);
        f_draw();
    });
    new ResizeObserver(f_draw).observe(o_canvas);
    return {
        f_set_mesh,
        f_reset: () => { n_yaw = 2.55; n_pitch = 0.28; n_zoom = 1; f_draw(); },
    };
}

let o_mesh_viewer;
try {
    o_mesh_viewer = f_o_viewer();
} catch (o_problem) {
    b_webgl_problem = true;
    o_error.textContent = o_problem.message;
    o_error.hidden = false;
}

function f_o_svg(s_svg, s_label) {
    const o_document = new DOMParser().parseFromString(s_svg, "image/svg+xml");
    const o_svg = o_document.documentElement;
    if (!o_svg || o_svg.nodeName.toLowerCase() !== "svg" || o_document.querySelector("parsererror")) {
        throw new Error("Could not display the cutting template.");
    }
    o_svg.removeAttribute("width");
    o_svg.removeAttribute("height");
    o_svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    o_svg.setAttribute("role", "img");
    o_svg.setAttribute("aria-label", s_label);
    for (const o_forbidden of o_svg.querySelectorAll("script")) o_forbidden.remove();
    for (const o_path of o_svg.querySelectorAll("path")) {
        o_path.setAttribute("fill-rule", "evenodd");
        o_path.setAttribute("stroke", "none");
    }
    return document.importNode(o_svg, true);
}

function f_show_cut(s_svg, s_fold_svg, n_width, n_height) {
    const o_cut = f_o_svg(s_svg,
        `Flat cutting template, ${Math.round(n_width)} by ${Math.round(n_height)} millimetres. Orange dashes are perforated fold lines.`);
    const o_fold = f_o_svg(s_fold_svg, "Perforated fold lines");
    o_fold.setAttribute("aria-hidden", "true");
    o_cut_sheet.replaceChildren(o_cut);
    o_fold_overlay.replaceChildren(o_fold);
    o_fold_overlay.hidden = !f_o_element("show-folds").checked;
}

function f_set_view(s_next) {
    s_view = s_next;
    o_canvas.hidden = s_view !== "folded";
    o_cut.hidden = s_view !== "cut";
    o_surface_editor.hidden = s_view !== "decorate";
    o_fold_overlay.hidden = s_view !== "cut" || !f_o_element("show-folds").checked;
    f_o_element("view-folded").setAttribute("aria-pressed", String(s_view === "folded"));
    f_o_element("view-cut").setAttribute("aria-pressed", String(s_view === "cut"));
    f_o_element("view-decorate").setAttribute("aria-pressed", String(s_view === "decorate"));
    f_o_element("reset-view").hidden = s_view !== "folded";
    f_o_element("fold-toggle").hidden = s_view !== "cut";
    f_o_element("hint").hidden = s_view === "decorate";
    f_o_element("hint").textContent = s_view === "cut"
        ? "Orange dashes are cut through the paper as dashed slits · download the SVG at 100%"
        : "Drag to turn · scroll to zoom";
}

f_o_element("view-folded").onclick = () => f_set_view("folded");
f_o_element("view-cut").onclick = () => f_set_view("cut");
f_o_element("view-decorate").onclick = () => f_set_view("decorate");
f_o_element("reset-view").onclick = () => o_mesh_viewer?.f_reset();
f_o_element("show-folds").onchange = () => {
    o_fold_overlay.hidden = !f_o_element("show-folds").checked;
};
const s_initial_view = new URLSearchParams(location.search).get("view");
if (!o_mesh_viewer) {
    f_o_element("view-folded").disabled = true;
    f_set_view(s_initial_view === "decorate" ? "decorate" : "cut");
} else {
    f_set_view(["cut", "decorate"].includes(s_initial_view) ? s_initial_view : "folded");
}

function f_schedule() {
    n_revision++;
    o_download_svg.disabled = true;
    o_download_stl.disabled = true;
    o_viewer.dataset.current = "false";
    o_status.textContent = "Updating preview…";
    clearTimeout(n_timer);
    n_timer = setTimeout(() => { b_pending = true; f_update(); }, 320);
}

async function f_update() {
    if (b_running) return;
    b_running = true;
    while (b_pending) {
        b_pending = false;
        if (!o_form.checkValidity()) {
            o_status.textContent = "Check the highlighted settings.";
            o_viewer.setAttribute("aria-busy", "false");
            o_form.reportValidity();
            continue;
        }
        if (o_decorations && !o_decorations.f_valid()) {
            o_status.textContent = "Check the pattern width and position fields.";
            o_viewer.setAttribute("aria-busy", "false");
            continue;
        }
        const n_request_revision = n_revision;
        o_viewer.setAttribute("aria-busy", "true");
        o_status.textContent = "Rendering the folded lantern and cutting template…";
        try {
            const o_response = await fetch("/api/render", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ ...f_parameters(), ...(o_decorations ? o_decorations.f_payload() : {}) }),
            });
            const o_result = await o_response.json();
            if (n_request_revision !== n_revision) continue;
            if (!o_response.ok) throw new Error(o_result.error || "Could not update the preview.");
            o_mesh_viewer?.f_set_mesh(o_result.a_n_position);
            f_show_cut(o_result.s_svg, o_result.s_fold_svg, o_result.n_width, o_result.n_height);
            o_current = o_result;
            const n_width = Math.round(o_result.n_width);
            const n_height = Math.round(o_result.n_height);
            o_dimensions.textContent = `${n_width} × ${n_height} mm cutting sheet`;
            const b_fits = (n_width <= 210 && n_height <= 297)
                || (n_width <= 297 && n_height <= 210);
            o_status.textContent = b_fits
                ? "Fits A4 · one connected sheet · dashed folds are cut as slits"
                : "Needs a sheet larger than A4 · reduce the lantern or use bigger paper";
            if (!b_webgl_problem) o_error.hidden = true;
            o_viewer.dataset.current = "true";
            o_download_svg.disabled = false;
            o_download_stl.disabled = false;
        } catch (o_problem) {
            if (n_request_revision !== n_revision) continue;
            o_current = null;
            o_error.textContent = o_problem.message;
            o_error.hidden = false;
            o_viewer.dataset.current = "false";
            o_status.textContent = "Preview not current. Adjust the settings or reset to try again.";
        } finally {
            o_viewer.setAttribute("aria-busy", "false");
        }
    }
    b_running = false;
}

o_form.addEventListener("input", () => { o_decorations?.f_parameters_changed(); f_schedule(); });
o_form.addEventListener("submit", (o_event) => { o_event.preventDefault(); f_schedule(); });
o_form.addEventListener("reset", () => setTimeout(() => { o_decorations?.f_reset(); f_schedule(); }, 0));

function f_o_download(o_blob, s_name) {
    const s_url = URL.createObjectURL(o_blob);
    const o_link = document.createElement("a");
    o_link.href = s_url;
    o_link.download = s_name;
    o_link.click();
    setTimeout(() => URL.revokeObjectURL(s_url), 1000);
}

o_download_svg.onclick = () => {
    if (!o_current || o_download_svg.disabled) return;
    f_o_download(new Blob([o_current.s_svg], { type: "image/svg+xml" }), "paper_lantern.svg");
};
o_download_stl.onclick = () => {
    if (!o_current || o_download_stl.disabled) return;
    const s_binary = atob(o_current.s_stl);
    const a_n_byte = new Uint8Array(s_binary.length);
    for (let n = 0; n < s_binary.length; n++) a_n_byte[n] = s_binary.charCodeAt(n);
    f_o_download(new Blob([a_n_byte], { type: "model/stl" }), "paper_lantern.stl");
};

function f_build_controls() {
    for (const o_group of a_o_group) {
        const o_fieldset = document.createElement("fieldset");
        const o_legend = document.createElement("legend");
        o_legend.textContent = o_group.s_title;
        o_fieldset.append(o_legend);
        for (const s_name of o_group.a_s_name) {
            const o = a_o_parameter.find((o_parameter) => o_parameter.s_name === s_name);
            if (!o) continue;
            const o_label = document.createElement("label");
            o_label.className = "control";
            const o_name = document.createElement("span");
            o_name.textContent = o_text[s_name] || s_name.replaceAll("_", " ");
            o_label.append(o_name);
            const o_input = document.createElement(o.a_n_range ? "input" : "select");
            o_input.name = s_name;
            if (o.a_n_range) {
                o_input.type = "number";
                [o_input.min, o_input.step, o_input.max] = o.a_n_range;
                o_input.required = true;
                o_input.defaultValue = o.v_default;
                o_input.inputMode = "decimal";
                o_name.textContent = `${o_name.textContent} (mm)`;
            } else {
                for (const s_option of o.a_s_option) {
                    const o_option = new Option(
                        s_option[0].toUpperCase() + s_option.slice(1),
                        s_option,
                        s_option === o.v_default,
                        s_option === o.v_default,
                    );
                    o_input.append(o_option);
                }
            }
            o_label.append(o_input);
            o_fieldset.append(o_label);
        }
        f_o_element("controls").append(o_fieldset);
    }
}

try {
    const o_response = await fetch("/api/parameters");
    if (!o_response.ok) throw new Error("Could not load settings.");
    a_o_parameter = await o_response.json();
    f_build_controls();
    o_decorations = f_o_decorations(f_schedule, f_parameters);
    o_decorations.f_parameters_changed();
    f_schedule();
} catch (o_problem) {
    o_error.textContent = `${o_problem.message} Start the local server and reload this page.`;
    o_error.hidden = false;
    o_status.textContent = "Could not connect to the designer.";
    o_viewer.setAttribute("aria-busy", "false");
}
