// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The app around vase_mesh.js: the editor holds a script, whose f_o_p() places the
// corners of the layers above the thread, and the view shows the vase it makes. A
// project keeps a script under a name, through server.js. See readme.md.

const $ = (id) => document.getElementById(id);

const monaco_url = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min";
const background = [0.082, 0.106, 0.114];
// The fixed part, and what the script makes.
const thread_color = [0.94, 0.72, 0.31];
const shape_color = [0.97, 0.95, 0.9];
// Waits this long after the last key before running the script, in ms.
const typing_pause = 400;

/* ---- The vase on screen ---- */

const gl = $("view").getContext("webgl2", {antialias: true});

function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const mesh_program = gl.createProgram();
gl.attachShader(mesh_program, compile(gl.VERTEX_SHADER, `#version 300 es
in vec3 a_position;
uniform mat4 u_view, u_projection;
uniform int u_fixed;
uniform vec3 u_thread_color, u_shape_color;
out vec3 v_position;
flat out vec3 v_color;
void main() {
    vec4 p = u_view * vec4(a_position, 1.0);
    v_position = p.xyz;
    v_color = gl_VertexID < u_fixed ? u_thread_color : u_shape_color;
    gl_Position = u_projection * p;
}`));
gl.attachShader(mesh_program, compile(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
in vec3 v_position;
flat in vec3 v_color;
out vec4 out_color;
void main() {
    // One normal per triangle: shows the mesh as it will be exported.
    vec3 n = normalize(cross(dFdx(v_position), dFdy(v_position)));
    float light = max(dot(n, normalize(vec3(-0.45, 0.6, 0.65))), 0.0);
    out_color = vec4(v_color * (0.3 + 0.7 * light), 1.0);
}`));
gl.linkProgram(mesh_program);

const mesh_vao = gl.createVertexArray();
const position_buffer = gl.createBuffer();
const index_buffer = gl.createBuffer();
gl.bindVertexArray(mesh_vao);
gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
gl.enableVertexAttribArray(gl.getAttribLocation(mesh_program, "a_position"));
gl.vertexAttribPointer(gl.getAttribLocation(mesh_program, "a_position"), 3, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bindVertexArray(null);

// The last vase a script made.
let mesh = null;
// In degrees: az = -90 looks at the front, el = 90 from the top. The view turns around
// target, the middle of the vase, and radius reaches from there to its farthest point.
const camera = {az: -60, el: 15, distance: 0, target: [0, 0, 0], radius: 1};
// 30 degrees over the shorter side.
const half_view = 15;

function set_mesh(made) {
    mesh = made;
    gl.bindVertexArray(mesh_vao);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

    const p = mesh.positions;
    mesh.height = 0;
    mesh.width = 0;
    for (let i = 0; i < p.length; i += 3) {
        mesh.height = Math.max(mesh.height, p[i + 2]);
        mesh.width = Math.max(mesh.width, 2 * Math.hypot(p[i], p[i + 1]));
    }
    camera.target = [0, 0, mesh.height / 2];
    camera.radius = Math.hypot(mesh.width / 2, mesh.height / 2);
}

function fit_view() {
    camera.distance = 1.05 * camera.radius / sin_d(half_view);
}

function view_matrix(az, el, distance) {
    const [ca, sa, ce, se] = [cos_d(az), sin_d(az), cos_d(el), sin_d(el)];
    const x = [-sa, ca, 0];
    const y = [-se * ca, -se * sa, ce];
    const z = [ce * ca, ce * sa, se];
    const eye = camera.target.map((t, i) => t + z[i] * distance);
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}

function perspective_matrix(aspect, near, far) {
    const f = 1 / Math.tan(half_view / deg_per_rad);
    const fx = aspect < 1 ? f : f / aspect;
    const fy = aspect < 1 ? f * aspect : f;
    return [fx, 0, 0, 0, 0, fy, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
}

function draw() {
    const canvas = $("view");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    // Setting a canvas's size clears and reallocates it, even to the same size.
    if (canvas.width !== Math.round(rect.width * dpr)) canvas.width = Math.round(rect.width * dpr);
    if (canvas.height !== Math.round(rect.height * dpr)) canvas.height = Math.round(rect.height * dpr);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...background, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!mesh) return;
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(mesh_program);
    gl.bindVertexArray(mesh_vao);
    const uniform = (name) => gl.getUniformLocation(mesh_program, name);
    gl.uniformMatrix4fv(uniform("u_view"), false, view_matrix(camera.az, camera.el, camera.distance));
    gl.uniformMatrix4fv(uniform("u_projection"), false, perspective_matrix(canvas.width / canvas.height,
        Math.max(1, camera.distance - camera.radius), camera.distance + camera.radius));
    gl.uniform1i(uniform("u_fixed"), mesh.fixed);
    gl.uniform3fv(uniform("u_thread_color"), thread_color);
    gl.uniform3fv(uniform("u_shape_color"), shape_color);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
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
    camera.distance = Math.max(1.5 * camera.radius, Math.min(12 * camera.radius, camera.distance * Math.exp(e.deltaY * 0.001)));
    request_draw();
}, {passive: false});
new ResizeObserver(request_draw).observe($("right"));

/* ---- Updating ---- */

let code = examples.template;
let set_markers = () => {};
let update_pending = false;
// A new example shows whole; while typing the view stays as it is.
let fit_pending = true;

function show_status(text, kind = "") {
    $("status").textContent = text;
    $("status").className = kind;
}

// What the status says when nothing is going on.
function show_result() {
    const {angle, z} = steepest_wall(mesh);
    show_status(`ready: ${mesh.indices.length / 3} triangles; ${mesh.height.toFixed(1)} mm high, ${mesh.width.toFixed(1)} mm wide; `
        + `steepest wall ${angle.toFixed(0)} degrees from vertical, at z = ${z.toFixed(0)}`);
}

// The script's line an error came from, if its stack tells: Chrome names the script
// <anonymous>, Firefox Function, and both count two lines before its first.
function error_line(error) {
    const found = /(?:<anonymous>|> Function):(\d+):\d+/.exec(error.stack ?? "");
    return found ? +found[1] - 2 : null;
}

// With an error the last good vase stays.
function update() {
    try {
        set_mesh(vase_mesh(run_script(code)));
    } catch (error) {
        const line = error_line(error);
        set_markers(line ? [{line, message: error.message}] : []);
        show_status(`${line ? `line ${line}: ` : ""}${error.message}`, "error");
        return;
    }
    set_markers([]);
    if (fit_pending) fit_view();
    fit_pending = false;
    draw();
    show_result();
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

/* ---- Editor ---- */

let typing_timer = null;

function code_changed(text) {
    paint_project();
    clearTimeout(typing_timer);
    if (text === code) return;
    show_status("updating, please wait...", "busy");
    typing_timer = setTimeout(() => {
        code = text;
        schedule_update();
    }, typing_pause);
}

let get_code = () => code;
let set_code = (text) => {};

function start_monaco() {
    // The worker comes from another origin, so it has to start through a data URL.
    const worker = `self.MonacoEnvironment = {baseUrl: "${monaco_url}/"}; importScripts("${monaco_url}/vs/base/worker/workerMain.js");`;
    window.MonacoEnvironment = {getWorkerUrl: () => `data:text/javascript;charset=utf-8,${encodeURIComponent(worker)}`};
    require.config({paths: {vs: `${monaco_url}/vs`}});
    require(["vs/editor/editor.main"], () => {
        // A script is a function's body: its return is no mistake, and it gets o_thread.
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({diagnosticCodesToIgnore: [1108]});
        monaco.languages.typescript.javascriptDefaults.addExtraLib("declare const o_thread: {n_radius: number, n_z: number};");
        const editor = monaco.editor.create($("editor"), {
            value: code, language: "javascript", theme: "vs-dark", automaticLayout: true,
            minimap: {enabled: false}, scrollBeyondLastLine: false, fontSize: 13, tabSize: 4, lineNumbersMinChars: 3,
            wordWrap: "on",
        });
        editor.onDidChangeModelContent(() => code_changed(editor.getValue()));
        get_code = () => editor.getValue();
        set_code = (text) => editor.setValue(text);
        set_markers = (errors) => monaco.editor.setModelMarkers(editor.getModel(), "script", errors.map((e) => ({
            severity: monaco.MarkerSeverity.Error, message: e.message,
            startLineNumber: e.line, endLineNumber: e.line, startColumn: 1, endColumn: 1000,
        })));
    }, start_textarea);
}

// Without the internet there is no Monaco, but the app still works with this.
function start_textarea() {
    const area = document.createElement("textarea");
    area.spellcheck = false;
    area.value = code;
    area.addEventListener("input", () => code_changed(area.value));
    $("editor").append(area);
    get_code = () => area.value;
    set_code = (text) => { area.value = text; };
}

/* ---- Examples ---- */

// The example the script came from, or "" for a project's script. saved_code is that
// script as it came, or as it is on disk: leaving a changed one asks first.
let example = "template";
let saved_code = code;
const is_dirty = () => get_code() !== saved_code;

// Puts another script into the editor, and shows its vase whole.
function load_code(text) {
    clearTimeout(typing_timer);
    code = text;
    set_code(text);
    fit_pending = true;
    schedule_update();
}

for (const name of Object.keys(examples)) $("example").add(new Option(name));
$("example").value = example;
$("example").addEventListener("change", () => {
    if (is_dirty() && !confirm(`Discard the changes in ${project ?? example}?`)) {
        $("example").value = example;
        return;
    }
    example = $("example").value;
    load_code(examples[example]);
    // In a project the example is a change to it, to save or not.
    if (project === null) saved_code = code;
    paint_project();
});
addEventListener("beforeunload", (e) => {
    if (is_dirty()) e.preventDefault();
});

/* ---- Projects: a name and its script, kept by server.js ---- */

// The name of the open project.
let project = null;
let project_names = [];

function paint_project() {
    const dirty = is_dirty();
    for (const option of $("project").options) option.text = dirty && option.value === project ? `${project} *` : option.value;
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

// What is in the editor now is what is on disk.
function mark_saved() {
    saved_code = get_code();
    history.replaceState(null, "", project === null ? location.pathname : `#${encodeURIComponent(project)}`);
    paint_project();
}

// The editor's script belongs to this project now, not to an example.
function set_project(name) {
    project = name;
    example = "";
    $("example").value = "";
}

async function open_project(name) {
    const {code: script} = await api("GET", project_path(name));
    set_project(name);
    $("project").value = name;
    load_code(script);
    mark_saved();
}

const store = (name, method) => api(method, project_path(name), JSON.stringify({code: get_code()}));

async function new_project() {
    const name = prompt("Name of the new project? It starts as a copy of this one.");
    if (!name) return;
    await store(name, "POST");
    set_project(name);
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
    if (!confirm(`Delete the project ${project}?`)) return;
    await api("DELETE", project_path(project));
    const deleted = project;
    project = null;
    await refresh_projects();
    if (project_names.length) {
        await open_project(project_names[0]);
    } else {
        // Without a project the editor holds an example.
        example = "template";
        $("example").value = example;
        load_code(examples[example]);
        mark_saved();
    }
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

/* ---- Download ---- */

$("download_stl").addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([mesh_to_stl(mesh)]));
    link.download = `pucklight_vase_${(project ?? example).replace(/\s+/g, "_")}.stl`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
});

/* ---- Start ---- */

if (window.require) start_monaco();
else start_textarea();
project_action(start_projects)().finally(schedule_update);
