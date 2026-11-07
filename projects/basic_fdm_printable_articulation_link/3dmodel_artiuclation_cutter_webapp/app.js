// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The articulation model creator: load an STL, lay it flat on the bed, draw its
// spine from the top, cut the joints of ../articulation_cutter.scad along it with
// Manifold, download the pieces.

import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {parse_stl, write_stl, manifold_of_soup} from "./stl.js";
import {defaults, derive, cutter_lib} from "./cutter_mesh.js";

const MANIFOLD_URL = "https://cdn.jsdelivr.net/npm/manifold-3d@3.5.4/manifold.js";
const $ = (id) => document.getElementById(id);
const next_frame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));

/* ---- State ---- */

// What a project saves. The curve is in the placed model's frame: the model centred
// in x and y, the bed at z = 0.
const state = {
    rotate: [0, 0, 0], cut: 0, model_scale: 1,
    parts: 8, flip: false, scale: 1,
    gap: 0.4, bend_angle: 15, link_clearance: 0.4, side_clearance: 1, loop_clearance: 1,
    curve: [],
};
const joint_keys = ["gap", "bend_angle", "link_clearance", "side_clearance", "loop_clearance"];
const D = derive(defaults);
let model = null;   // {name, bytes, positions: the file's triangles, placed: turned, centred, on the bed, size}
let step = 1;
let joints = [];    // computed from the curve: {x, y, angle, width, height, warnings}

/* ---- Status ---- */

function show_status(text, kind = "") {
    $("status").textContent = text;
    $("status").className = kind;
}

/* ---- Scene ---- */

const canvas = $("view");
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151b1d);
scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(0.4, -0.7, 1);
scene.add(sun);

const persp = new THREE.PerspectiveCamera(40, 1, 0.5, 5000);
persp.up.set(0, 0, 1);
const ortho = new THREE.OrthographicCamera(-100, 100, 100, -100, -1000, 1000);
ortho.position.set(0, 0, 500);
ortho.lookAt(0, 0, 0);
const orbit = new OrbitControls(persp, canvas);
const pan = new OrbitControls(ortho, canvas);
pan.enableRotate = false;
pan.mouseButtons = {LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN};
pan.touches = {ONE: null, TWO: THREE.TOUCH.DOLLY_PAN};
pan.enabled = false;

const bed_plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);   // what is below the bed is cut off
let bed = null;
const model_material = new THREE.MeshStandardMaterial({
    color: 0xb8b2a4, roughness: 0.7, side: THREE.DoubleSide, clippingPlanes: [bed_plane],
});
const model_mesh = new THREE.Mesh(new THREE.BufferGeometry(), model_material);
scene.add(model_mesh);
const overlay = new THREE.Group();     // the curve, its points, the joints
scene.add(overlay);
const result_group = new THREE.Group();   // the pieces after the cut
scene.add(result_group);

function resize() {
    const {clientWidth: w, clientHeight: h} = canvas.parentElement;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(devicePixelRatio);
    persp.aspect = w / h;
    persp.updateProjectionMatrix();
    frame_top();
}
new ResizeObserver(resize).observe(canvas.parentElement);

// The top view shows the whole model, a little larger than it.
function frame_top() {
    const {clientWidth: w, clientHeight: h} = canvas.parentElement;
    const half = model ? Math.max(model.size[0], model.size[1]) * 0.6 + 10 : 100;
    const aspect = w / h;
    ortho.left = -half * Math.max(aspect, 1);
    ortho.right = half * Math.max(aspect, 1);
    ortho.top = half / Math.min(aspect, 1);
    ortho.bottom = -half / Math.min(aspect, 1);
    ortho.updateProjectionMatrix();
}

function look(view) {
    const r = model ? Math.max(...model.size) : 100;
    const target = new THREE.Vector3(0, 0, model ? model.size[2] / 2 : 0);
    const from = {iso: [1.1, -1.4, 0.9], top: [0, -0.001, 2], front: [0, -2, 0.2], side: [2, 0, 0.2]}[view];
    persp.position.set(...from.map((k) => k * r)).add(target);
    orbit.target.copy(target);
    orbit.update();
}

function animate() {
    renderer.render(scene, step === 2 ? ortho : persp);
    requestAnimationFrame(animate);
}
animate();

/* ---- Model ---- */

// A model larger than fit_mm or smaller than small_mm was probably saved in other
// units: it is scaled to fit a cube of fit_mm when loaded.
const fit_mm = 333, small_mm = 10;
const fit_scale = (extent) => extent > fit_mm || extent < small_mm ? fit_mm / extent : 1;
const format_scale = (k) => k >= 100 ? k.toFixed(0) : k.toPrecision(3);

function paint_model_scale() {
    $("model_scale").value = Math.log10(state.model_scale).toFixed(2);
    $("model_scale_value").value = format_scale(state.model_scale);
}

function set_model(bytes, name, fit = false) {
    const positions = parse_stl(bytes);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i++) {
        min[i % 3] = Math.min(min[i % 3], positions[i]);
        max[i % 3] = Math.max(max[i % 3], positions[i]);
    }
    const extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
    model = {name, bytes, positions, placed: new Float32Array(positions.length), size: [0, 0, 0]};
    state.model_scale = fit ? fit_scale(extent) : 1;
    paint_model_scale();
    model_mesh.geometry.dispose();
    model_mesh.geometry = new THREE.BufferGeometry();
    model_mesh.geometry.setAttribute("position", new THREE.BufferAttribute(model.placed, 3));
    $("model_info").textContent = `${name}, ${positions.length / 9} triangles`;
    place_model();
    look("iso");
    frame_top();
    clear_result();
}

// Scales and turns the model, centres it in x and y and puts it on the bed, the
// cut below it.
function place_model() {
    if (!model) return;
    const euler = new THREE.Euler(...state.rotate.map((d) => THREE.MathUtils.degToRad(d)), "XYZ");
    const e = new THREE.Matrix4().makeRotationFromEuler(euler).elements.map((v) => v * state.model_scale);
    const src = model.positions, out = model.placed;
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < src.length; i += 3) {
        const x = src[i], y = src[i + 1], z = src[i + 2];
        const p = [e[0] * x + e[4] * y + e[8] * z, e[1] * x + e[5] * y + e[9] * z, e[2] * x + e[6] * y + e[10] * z];
        for (let k = 0; k < 3; k++) {
            out[i + k] = p[k];
            if (p[k] < min[k]) min[k] = p[k];
            if (p[k] > max[k]) max[k] = p[k];
        }
    }
    const shift = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, min[2] + state.cut];
    for (let i = 0; i < out.length; i += 3) for (let k = 0; k < 3; k++) out[i + k] -= shift[k];
    model.size = [max[0] - min[0], max[1] - min[1], max[2] - min[2] - state.cut];
    model_mesh.geometry.attributes.position.needsUpdate = true;
    model_mesh.geometry.computeVertexNormals();
    model_mesh.geometry.computeBoundingSphere();
    $("cut").max = Math.max(0, max[2] - min[2] - 1).toFixed(1);
    $("size_info").textContent = `on the bed: ${model.size.map((s) => s.toFixed(1)).join(" × ")} mm`;
    if (bed) scene.remove(bed);
    const extent = Math.ceil((Math.max(model.size[0], model.size[1]) + 40) / 20) * 20;
    bed = new THREE.GridHelper(extent, extent / 10, 0x4a5a5a, 0x2a3434);
    bed.rotateX(Math.PI / 2);
    scene.add(bed);
    update_curve();
}

$("model_load").addEventListener("click", () => $("model_file").click());
$("model_file").addEventListener("change", async () => {
    const file = $("model_file").files[0];
    if (!file) return;
    try {
        set_model(await file.arrayBuffer(), file.name, true);
        model_changed = true;
        show_status(`loaded ${file.name}` + (state.model_scale === 1 ? "" : `, scaled × ${format_scale(state.model_scale)} to fit ${fit_mm} mm`));
    } catch (error) {
        show_status(error.message, "error");
    }
    $("model_file").value = "";
    paint_project();
});

for (const button of document.querySelectorAll(".turns button")) {
    button.addEventListener("click", () => {
        const axis = +button.dataset.axis;
        state.rotate[axis] = ((state.rotate[axis] + +button.dataset.by) % 360 + 540) % 360 - 180;
        $(`rot${axis}`).value = state.rotate[axis];
        place_model();
        paint_project();
    });
}
for (const axis of [0, 1, 2]) {
    $(`rot${axis}`).addEventListener("change", () => {
        state.rotate[axis] = +$(`rot${axis}`).value || 0;
        place_model();
        paint_project();
    });
}
$("cut").addEventListener("input", () => {
    state.cut = +$("cut").value;
    $("cut_value").value = state.cut.toFixed(1);
    place_model();
    paint_project();
});
// The curve scales along, so a drawn spine stays on the model.
$("model_scale").addEventListener("input", () => {
    const k = Math.pow(10, +$("model_scale").value);
    state.curve = state.curve.map(([x, y]) => [x * k / state.model_scale, y * k / state.model_scale]);
    state.model_scale = k;
    $("model_scale_value").value = format_scale(k);
    place_model();
    paint_project();
});

/* ---- Curve and joints ---- */

const curve_material = new THREE.LineBasicMaterial({color: 0xf0b750, depthTest: false});
const joint_material = new THREE.LineBasicMaterial({color: 0x7fd4ff, depthTest: false});
const point_material = new THREE.MeshBasicMaterial({color: 0xf0b750, depthTest: false});
const picked_material = new THREE.MeshBasicMaterial({color: 0xffffff, depthTest: false});
let dragging = null;

const mm_per_px = () => (ortho.top - ortho.bottom) / ortho.zoom / canvas.clientHeight;

// The model's extent across and up at a joint: the vertices within half a link
// along the curve, measured across it and above the bed.
function local_size(x, y, tx, ty) {
    const half = D.pitch * state.scale / 2 + 2;
    const p = model.placed;
    let across = 0, up = 0, seen = false;
    for (let i = 0; i < p.length; i += 3) {
        const z = p[i + 2];
        if (z < 0) continue;
        const dx = p[i] - x, dy = p[i + 1] - y;
        if (Math.abs(dx * tx + dy * ty) > half) continue;
        seen = true;
        across = Math.max(across, Math.abs(-dx * ty + dy * tx));
        up = Math.max(up, z);
    }
    return {seen, across, up};
}

function compute_joints() {
    joints = [];
    if (!model || state.curve.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(state.curve.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, "centripetal");
    curve.arcLengthDivisions = 400;
    const s = state.scale;
    const spacing = curve.getLength() / state.parts;
    for (let i = 1; i < state.parts; i++) {
        const point = curve.getPointAt(i / state.parts);
        const tangent = curve.getTangentAt(i / state.parts).setZ(0).normalize();
        if (state.flip) tangent.negate();
        const {seen, across, up} = local_size(point.x, point.y, tangent.x, tangent.y);
        const warnings = [];
        if (!seen) warnings.push("off the model");
        else {
            if (up < D.link_top * s) warnings.push(`only ${up.toFixed(1)} high, the ring needs ${(D.link_top * s).toFixed(1)}`);
            if (across < D.link_width * s / 2) warnings.push(`only ${(2 * across).toFixed(1)} wide, the loop swings ${(D.link_width * s).toFixed(1)}`);
        }
        if (spacing < D.pitch * s) warnings.push(`parts ${spacing.toFixed(1)} long, a link is ${(D.pitch * s).toFixed(1)}`);
        joints.push({
            x: point.x, y: point.y, tx: tangent.x, ty: tangent.y,
            angle: Math.atan2(tangent.y, tangent.x) * 180 / Math.PI,
            width: Math.ceil((2 * across + 2) / 2) * 2, height: Math.ceil(up + 1), warnings,
        });
    }
    return curve;
}

function update_curve() {
    overlay.clear();
    const curve = compute_joints();
    paint_joint_list();
    if (!model) return;
    const z = model.size[2] + 1;
    const r = 5 * mm_per_px();
    state.curve.forEach(([x, y], i) => {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(r, 24), i === dragging ? picked_material : point_material);
        dot.position.set(x, y, z);
        overlay.add(dot);
    });
    if (!curve) return;
    overlay.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(200).map((p) => p.setZ(z))), curve_material));
    const segments = [];
    for (const j of joints) {
        const nx = -j.ty, ny = j.tx, half = j.width / 2;
        segments.push(j.x - nx * half, j.y - ny * half, z, j.x + nx * half, j.y + ny * half, z);
        // towards the ring link: a short arrow
        const ax = j.x + j.tx * 5, ay = j.y + j.ty * 5;
        segments.push(j.x, j.y, z, ax, ay, z);
        segments.push(ax, ay, z, ax - j.tx * 2 + nx * 1.5, ay - j.ty * 2 + ny * 1.5, z);
        segments.push(ax, ay, z, ax - j.tx * 2 - nx * 1.5, ay - j.ty * 2 - ny * 1.5, z);
    }
    const lines = new THREE.LineSegments(new THREE.BufferGeometry(), joint_material);
    lines.geometry.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
    overlay.add(lines);
    overlay.traverse((o) => { o.renderOrder = 10; });
}

function paint_joint_list() {
    $("joints").replaceChildren(...joints.map((j, i) => {
        const line = document.createElement("div");
        line.textContent = `joint ${i + 1}: ${j.width} wide, ${j.height} high` + (j.warnings.length ? ` — ${j.warnings.join("; ")}` : "");
        if (j.warnings.length) line.className = "warn";
        return line;
    }));
}

// Where a pointer event hits the bed.
function bed_point(event) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, ortho);
    const hit = new THREE.Vector3();
    return ray.ray.intersectPlane(bed_plane, hit) ? hit : null;
}

canvas.addEventListener("pointerdown", (event) => {
    if (step !== 2 || event.button !== 0 || !model) return;
    const p = bed_point(event);
    if (!p) return;
    const tolerance = 8 * mm_per_px();
    dragging = state.curve.findIndex(([x, y]) => Math.hypot(x - p.x, y - p.y) < tolerance);
    if (dragging < 0) {
        state.curve.push([p.x, p.y]);
        dragging = state.curve.length - 1;
    }
    canvas.setPointerCapture(event.pointerId);
    update_curve();
});
canvas.addEventListener("pointermove", (event) => {
    if (dragging === null || step !== 2) return;
    const p = bed_point(event);
    if (!p) return;
    state.curve[dragging] = [p.x, p.y];
    update_curve();
});
canvas.addEventListener("pointerup", () => {
    if (dragging === null) return;
    dragging = null;
    update_curve();
    paint_project();
});
addEventListener("keydown", (event) => {
    if (step !== 2 || !["Delete", "Backspace"].includes(event.key) || event.target.matches("input")) return;
    state.curve.pop();
    update_curve();
    paint_project();
});
pan.addEventListener("change", () => { if (step === 2) update_curve(); });
$("curve_clear").addEventListener("click", () => {
    state.curve = [];
    update_curve();
    paint_project();
});

for (const key of ["parts", "scale", ...joint_keys]) {
    $(key).addEventListener("change", () => {
        state[key] = +$(key).value;
        update_curve();
        paint_project();
    });
}
$("flip").addEventListener("change", () => {
    state.flip = $("flip").checked;
    update_curve();
    paint_project();
});

/* ---- Steps ---- */

function set_step(n) {
    step = n;
    for (const button of $("steps").children) button.classList.toggle("current", +button.dataset.step === n);
    for (const k of [1, 2, 3]) $(`step${k}`).hidden = k !== n;
    orbit.enabled = n !== 2;
    pan.enabled = n === 2;
    canvas.classList.toggle("draw", n === 2);
    for (const button of $("cameras").children) button.disabled = n === 2;
    const built = result_group.children.length > 0;
    model_mesh.visible = !(n === 3 && built);
    result_group.visible = n === 3;
    overlay.visible = n !== 3;
    $("download").hidden = !(n === 3 && built);
    if (n === 2) { frame_top(); update_curve(); }
}
for (const button of $("steps").children) button.addEventListener("click", () => set_step(+button.dataset.step));
for (const button of $("cameras").children) button.addEventListener("click", () => look(button.dataset.view));

/* ---- Cutting ---- */

let wasm = null, lib = null, lib_key = "";
let placed_manifold = null, placed_key = "";
let result_mesh = null, cutters_mesh = null;

async function ensure_manifold() {
    if (wasm) return;
    show_status("loading Manifold...", "busy");
    const Module = (await import(MANIFOLD_URL)).default;
    wasm = await Module();
    wasm.setup();
}

function get_lib() {
    const P = {...defaults};
    for (const key of joint_keys) P[key] = state[key];
    const key = JSON.stringify(P);
    if (key !== lib_key) {
        lib = cutter_lib(wasm, P);
        lib_key = key;
    }
    return lib;
}

// The placed model as a Manifold, the part above the bed. Kept until the placement changes.
function model_manifold() {
    const key = JSON.stringify([model.name, model.positions.length, state.rotate, state.cut]);
    if (key !== placed_key) {
        placed_manifold?.delete();
        placed_manifold = manifold_of_soup(wasm, model.placed).trimByPlane([0, 0, 1], 0);
        placed_key = key;
    }
    return placed_manifold;
}

function clear_result() {
    result_group.clear();
    result_mesh = cutters_mesh = null;
    $("result_info").textContent = "";
    if (step === 3) set_step(3);
}

function show_pieces(pieces) {
    result_group.clear();
    pieces.forEach((piece, i) => {
        const mesh = piece.getMesh();
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(mesh.vertProperties, mesh.numProp));
        geometry.setIndex(new THREE.BufferAttribute(mesh.triVerts, 1));
        const flat = geometry.toNonIndexed();
        flat.computeVertexNormals();
        const color = new THREE.Color().setHSL((i * 0.618) % 1, 0.5, 0.6);
        result_group.add(new THREE.Mesh(flat, new THREE.MeshStandardMaterial({color, roughness: 0.7})));
    });
}

async function build() {
    if (!model) return show_status("load a model first", "error");
    compute_joints();
    if (!joints.length) return show_status("draw a curve with at least two points first", "error");
    try {
        await ensure_manifold();
        show_status(`cutting ${joints.length} joints, please wait...`, "busy");
        await next_frame();
        const {Manifold} = wasm;
        const lib = get_lib();
        const s = state.scale;
        const cutters = joints.map((j) => lib.joint_cutter(j.width / s, j.height / s).scale(s).rotate([0, 0, j.angle]).translate([j.x, j.y, 0]));
        const all = Manifold.union(cutters);
        const result = Manifold.difference(model_manifold(), all);
        const pieces = result.decompose();
        show_pieces(pieces);
        result_mesh = result.getMesh();
        cutters_mesh = all.getMesh();
        const ok = pieces.length === state.parts;
        $("result_info").textContent = `${pieces.length} pieces` + (ok ? "" : `, ${state.parts} parts wanted: a joint is off the model, or a part is cut through by a cutter`);
        show_status(ok ? `${pieces.length} pieces` : `${pieces.length} pieces instead of ${state.parts}`, ok ? "" : "error");
        set_step(3);
    } catch (error) {
        show_status(error.message, "error");
    }
}
$("build").addEventListener("click", build);

/* ---- Download ---- */

function save(mesh, suffix) {
    const base = (project ?? model.name.replace(/\.stl$/i, "")).replace(/\s+/g, "_");
    const link_element = document.createElement("a");
    link_element.href = URL.createObjectURL(new Blob([write_stl(mesh, `veryos ${base}`)]));
    link_element.download = `${base}_${suffix}.stl`;
    link_element.click();
    setTimeout(() => URL.revokeObjectURL(link_element.href), 4000);
}
$("download_result").addEventListener("click", () => save(result_mesh, "articulated"));
$("download_cutters").addEventListener("click", () => save(cutters_mesh, "cutters"));

/* ---- Projects ---- */

let project = null, project_names = [], saved_state = "", model_changed = false;

function get_state() {
    return {...state, model: model?.name ?? null};
}

function apply_state(s) {
    for (const key of Object.keys(state)) if (key in s) state[key] = structuredClone(s[key]);
    place_model();   // sets the cut slider's range
    for (const axis of [0, 1, 2]) $(`rot${axis}`).value = state.rotate[axis];
    $("cut").value = state.cut;
    $("cut_value").value = state.cut.toFixed(1);
    paint_model_scale();
    for (const key of ["parts", "scale", ...joint_keys]) $(key).value = state[key];
    $("flip").checked = state.flip;
    clear_result();
}

function is_dirty() {
    return project !== null && (model_changed || JSON.stringify(get_state()) !== saved_state);
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
    model_changed = false;
    history.replaceState(null, "", project === null ? location.pathname : `#${encodeURIComponent(project)}`);
    paint_project();
}

async function open_project(name) {
    const s = await api("GET", project_path(name));
    if (s.model) {
        const response = await fetch(`projects/${encodeURIComponent(name)}/model.stl`, {cache: "no-store"});
        if (!response.ok) throw new Error(`${name} has no model.stl`);
        set_model(await response.arrayBuffer(), s.model);
    }
    project = name;
    apply_state(s);
    $("project").value = name;
    mark_saved();
    set_step(1);
}

async function store(name, method) {
    await api(method, project_path(name), JSON.stringify(get_state()));
    if (model && (model_changed || method === "POST")) await api("PUT", `${project_path(name)}/model`, model.bytes);
    else if (!model && method === "PUT") await api("DELETE", `${project_path(name)}/model`);
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
    if (!confirm(`Delete the project ${project} and its model?`)) return;
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

async function start_projects() {
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

/* ---- Start ---- */

$("cut_value").value = "0.0";
resize();
set_step(1);
show_status("load a model, or open a project");
project_action(start_projects)();
