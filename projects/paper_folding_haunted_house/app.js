// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

const f_o_element = (s_id) => document.getElementById(s_id);
const o_form = f_o_element("settings");
const o_status = f_o_element("status");
const o_error = f_o_element("error");
const o_download = f_o_element("download");
const o_viewer = f_o_element("viewer");
const o_canvas = f_o_element("folded-preview");
const o_cut = f_o_element("cut-preview");
let a_o_parameter = [];
let o_current = null;
let n_revision = 0;
let n_timer;
let b_running = false;
let b_pending = false;
let s_view = "folded";

// A small, dependency-free WebGL viewer for the actual OpenSCAD triangle mesh.
function f_o_viewer() {
    const o_gl = o_canvas.getContext("webgl", { antialias: true, alpha: true });
    if (!o_gl) throw new Error("3D preview needs WebGL. You can still view and download the cutting template.");
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
            float light = 0.5 + 0.5 * max(0.0, dot(n, normalize(vec3(-0.6, 0.8, 1.0))));
            gl_FragColor = vec4(vec3(0.39, 0.23, 0.34) * light, 1.0);
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
    if (!o_gl.getProgramParameter(o_program, o_gl.LINK_STATUS)) throw new Error("Could not initialize the 3D preview.");
    o_gl.useProgram(o_program);
    o_gl.enable(o_gl.DEPTH_TEST);
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
    let n_count = 0, n_radius = 60, n_yaw = 2.55, n_pitch = 0.35, n_zoom = 1;
    let a_n_center = [0, 0, 0];
    function f_draw() {
        const n_pixel = Math.min(devicePixelRatio || 1, 2);
        o_canvas.width = Math.max(1, Math.round(o_canvas.clientWidth * n_pixel));
        o_canvas.height = Math.max(1, Math.round(o_canvas.clientHeight * n_pixel));
        o_gl.viewport(0, 0, o_canvas.width, o_canvas.height);
        o_gl.clear(o_gl.COLOR_BUFFER_BIT | o_gl.DEPTH_BUFFER_BIT);
        const n_aspect = o_canvas.width / o_canvas.height;
        const n_scale = 0.82 * n_zoom / n_radius * Math.min(1, n_aspect);
        o_gl.uniform3fv(o_center, a_n_center);
        o_gl.uniform2f(o_angle, n_yaw, n_pitch);
        // Larger camera-space Z is closer to the viewer; WebGL depth is reversed.
        o_gl.uniform3f(o_scale, n_scale / n_aspect, n_scale, -1 / (n_radius * 3));
        o_gl.drawArrays(o_gl.TRIANGLES, 0, n_count);
    }
    function f_set_mesh(a_n_position) {
        const a_n_min = [Infinity, Infinity, Infinity], a_n_max = [-Infinity, -Infinity, -Infinity];
        const a_n_data = [];
        for (let n = 0; n < a_n_position.length; n += 9) {
            const a = a_n_position.slice(n, n + 3), b = a_n_position.slice(n + 3, n + 6), c = a_n_position.slice(n + 6, n + 9);
            const u = b.map((v, i) => v - a[i]), v = c.map((v, i) => v - a[i]);
            const a_n_normal = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
            const n_length = Math.hypot(...a_n_normal) || 1;
            for (const a_n_point of [a, b, c]) {
                a_n_data.push(...a_n_point, ...a_n_normal.map((n) => n / n_length));
                for (let i = 0; i < 3; i++) {
                    a_n_min[i] = Math.min(a_n_min[i], a_n_point[i]);
                    a_n_max[i] = Math.max(a_n_max[i], a_n_point[i]);
                }
            }
        }
        a_n_center = a_n_min.map((n, i) => (n + a_n_max[i]) / 2);
        n_radius = Math.hypot(...a_n_max.map((n, i) => n - a_n_center[i]));
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
    return { f_set_mesh, f_reset: () => { n_yaw = 2.55; n_pitch = 0.35; n_zoom = 1; f_draw(); } };
}

let o_mesh_viewer;
try { o_mesh_viewer = f_o_viewer(); }
catch (o_problem) { o_error.textContent = o_problem.message; o_error.hidden = false; }

function f_set_view(s_next) {
    s_view = s_next;
    o_canvas.hidden = s_view !== "folded";
    o_cut.hidden = s_view !== "cut";
    f_o_element("view-folded").setAttribute("aria-pressed", String(s_view === "folded"));
    f_o_element("view-cut").setAttribute("aria-pressed", String(s_view === "cut"));
    f_o_element("reset-view").hidden = s_view === "cut";
    f_o_element("hint").textContent = s_view === "cut"
        ? "Orange = score by hand · downloaded SVG contains cuts only"
        : "Drag to turn · scroll to zoom";
}
f_o_element("view-folded").onclick = () => f_set_view("folded");
f_o_element("view-cut").onclick = () => f_set_view("cut");
f_o_element("reset-view").onclick = () => o_mesh_viewer?.f_reset();
if (!o_mesh_viewer) f_set_view("cut");

function f_show_cut(s_svg, o) {
    const o_svg = new DOMParser().parseFromString(s_svg, "image/svg+xml").documentElement;
    o_svg.removeAttribute("width");
    o_svg.removeAttribute("height");
    o_svg.setAttribute("role", "img");
    o_svg.setAttribute("aria-label", "Flat cutting template with eight orange fold guides");
    // Score guides are a UI overlay, never inserted into the downloadable SVG.
    const s_ns = "http://www.w3.org/2000/svg";
    for (let i = 0; i < 4; i++) {
        const o_group = document.createElementNS(s_ns, "g");
        o_group.setAttribute("transform", `scale(1,-1) rotate(${i * 90}) translate(${-o.house_size / 2},${o.house_size / 2})`);
        for (const a_n_line of [[0, 0, o.house_size, 0], [o.house_size, o.tab_inset, o.house_size, o.wall_height - o.tab_inset]]) {
            const o_line = document.createElementNS(s_ns, "line");
            ["x1", "y1", "x2", "y2"].forEach((s, i) => o_line.setAttribute(s, a_n_line[i]));
            o_line.setAttribute("stroke", "#ed9a50");
            o_line.setAttribute("stroke-width", "0.55");
            o_line.setAttribute("stroke-dasharray", "2 1.5");
            o_group.append(o_line);
        }
        o_svg.append(o_group);
    }
    o_cut.replaceChildren(document.importNode(o_svg, true));
}

function f_schedule() {
    n_revision++;
    o_download.disabled = true;
    o_viewer.dataset.current = "false";
    o_status.textContent = "Updating preview…";
    clearTimeout(n_timer);
    n_timer = setTimeout(() => { b_pending = true; f_update(); }, 350);
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
        const n_request_revision = n_revision;
        const o_parameters = Object.fromEntries(a_o_parameter.map((o) => [
            o.s_name, o.a_n_range ? Number(o_form.elements[o.s_name].value) : o_form.elements[o.s_name].value,
        ]));
        o_viewer.setAttribute("aria-busy", "true");
        if (o_mesh_viewer) o_error.hidden = true;
        try {
            const o_response = await fetch("/api/render", {
                method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(o_parameters),
            });
            const o_result = await o_response.json();
            if (n_request_revision !== n_revision) continue;
            if (!o_response.ok) throw new Error(o_result.error || "Could not update the preview.");
            o_mesh_viewer?.f_set_mesh(o_result.a_n_position);
            f_show_cut(o_result.s_svg, o_result.o_parameters);
            o_current = o_result;
            const o_svg = new DOMParser().parseFromString(o_result.s_svg, "image/svg+xml").documentElement;
            const n_width = parseFloat(o_svg.getAttribute("width"));
            const n_height = parseFloat(o_svg.getAttribute("height"));
            f_o_element("dimensions").textContent = `${n_width} × ${n_height} mm template`;
            o_status.textContent = Math.min(n_width, n_height) <= 210 && Math.max(n_width, n_height) <= 297
                ? "Fits A4 · check your cutter’s usable area" : "Use a larger sheet than A4";
            o_viewer.dataset.current = "true";
            o_download.disabled = false;
        } catch (o_problem) {
            if (n_request_revision !== n_revision) continue;
            o_error.textContent = o_problem.message;
            o_error.hidden = false;
            o_status.textContent = "Preview not current. Adjust settings or reset to try again.";
        } finally {
            o_viewer.setAttribute("aria-busy", "false");
        }
    }
    b_running = false;
}

o_form.addEventListener("input", f_schedule);
o_form.addEventListener("submit", (o_event) => { o_event.preventDefault(); f_schedule(); });
o_form.addEventListener("reset", () => setTimeout(f_schedule, 0));
o_download.onclick = () => {
    if (!o_current || o_download.disabled) return;
    const s_url = URL.createObjectURL(new Blob([o_current.s_svg], { type: "image/svg+xml" }));
    const o_link = document.createElement("a");
    o_link.href = s_url;
    o_link.download = "haunted_house.svg";
    o_link.click();
    setTimeout(() => URL.revokeObjectURL(s_url), 1000);
};

try {
    const o_response = await fetch("/api/parameters");
    if (!o_response.ok) throw new Error("Could not load settings.");
    a_o_parameter = await o_response.json();
    const a_o_group = [
        { s_title: "House", a_s_name: ["house_size", "wall_height", "roof_height", "roof_style"] },
        { s_title: "Windows", a_s_name: ["window_style", "window_width", "window_height", "window_bar"] },
        { s_title: "Paper & glue", a_s_name: ["paper_thickness", "glue_tab_width", "tab_inset"] },
    ];
    for (const o_group of a_o_group) {
        const o_fieldset = document.createElement("fieldset");
        const o_legend = document.createElement("legend");
        o_legend.textContent = o_group.s_title;
        o_fieldset.append(o_legend);
        for (const s_name of o_group.a_s_name) {
            const o = a_o_parameter.find((o) => o.s_name === s_name);
            const o_label = document.createElement("label");
            o_label.className = "control";
            o_label.append(s_name.replaceAll("_", " ").replace(/^./, (s) => s.toUpperCase()));
            const o_input = document.createElement(o.a_n_range ? "input" : "select");
            o_input.name = s_name;
            if (o.a_n_range) {
                o_input.type = "number";
                [o_input.min, o_input.step, o_input.max] = o.a_n_range;
                o_input.required = true;
                o_input.defaultValue = o.v_default;
            } else {
                for (const s_option of o.a_s_option) {
                    const o_option = new Option(s_option[0].toUpperCase() + s_option.slice(1), s_option, s_option === o.v_default, s_option === o.v_default);
                    o_input.append(o_option);
                }
            }
            o_label.append(o_input);
            o_fieldset.append(o_label);
        }
        f_o_element("controls").append(o_fieldset);
    }
    f_schedule();
} catch (o_problem) {
    o_error.textContent = `${o_problem.message} Start the local server and reload this page.`;
    o_error.hidden = false;
    o_status.textContent = "Could not connect to the designer.";
    o_viewer.setAttribute("aria-busy", "false");
}
