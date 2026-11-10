// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The vase: a solid for a slicer's vase mode, which prints its outline as one wall. Its
// bottom is fixed: the thread of ../pucklight_sphere/pucklight_sphereV3.scad, part =
// "vase_sphere", with its names, so the vase screws into V3's sockel, and a collar that
// reaches past the ribs in the sockel's cup. Copy changes to the thread over by hand;
// test_vase_mesh.js compares the two. Everything above the collar is a script's: its
// f_o_p() is called for each corner of each layer.
//
// Units: mm and degrees. z = 0 is the print bed, and the floor of the sockel's cup.

const deg_per_rad = 180 / Math.PI;
const sin_d = (a) => Math.sin(a / deg_per_rad);
const cos_d = (a) => Math.cos(a / deg_per_rad);

// The generator's parameters.
const neck_d = 67;
const neck_height = 4;
const thread_pitch = 2;

// What the generator derives from them.
const thread_depth = 0.4 * thread_pitch;
const thread_tip = 0.05 * thread_pitch;
const neck_root_r = neck_d / 2 - thread_depth;

// The fixed part's mesh: columns around the axis, a row every 0.1 mm over the thread.
const columns = 180;
const thread_rows = Math.ceil((neck_height + thread_depth) / (thread_pitch / 20));
// The ribs in the sockel's cup end 6.19 above its floor. The collar ends 0.4 above them,
// on a 0.2 mm layer, so a script's shape cannot reach them.
const collar_top = 6.6;
// More points than this in a script's shape only freeze the browser.
const max_points = 2000000;

// What a script sees: the fixed part's top ring, where its shape starts.
const o_thread = {n_radius: neck_d / 2, n_z: collar_top};

function neck_radius(z, a) {
    const u = z - thread_pitch * a / 360;
    const m = u - thread_pitch * Math.floor(u / thread_pitch);
    const d = Math.min(m, thread_pitch - m);
    const ridge = Math.max(0, Math.min(thread_depth, thread_depth + thread_tip - d));
    return neck_root_r + Math.max(Math.min(ridge, z), z - neck_height);
}

// Runs a script: the body of a function that returns {n_its_layer, n_its_corner, f_o_p}.
function run_script(code) {
    return new Function("o_thread", code)({...o_thread});
}

// The vase of what a script returns. positions has x, y, z per point; indices has three
// per triangle, counter-clockwise from outside. The first fixed points are the thread's
// and the collar's. walls is the range in indices of the script's walls, without the top.
function vase_mesh(script) {
    const {n_its_layer: layers, n_its_corner: corners, f_o_p: point} = script ?? {};
    if (typeof point !== "function") throw new Error("the script must return {n_its_layer, n_its_corner, f_o_p}");
    if (!Number.isInteger(layers) || layers < 1) throw new Error(`n_its_layer must be a whole number from 1, not ${layers}`);
    if (!Number.isInteger(corners) || corners < 3) throw new Error(`n_its_corner must be a whole number from 3, not ${corners}`);
    if (layers * corners > max_points) throw new Error(`n_its_layer x n_its_corner is ${layers * corners}: more than ${max_points} points`);

    // The fixed rings, the bottom's centre, the script's rings, the top's centre.
    const fixed_rings = thread_rows + 2;
    const bottom = fixed_rings * columns;
    const fixed = bottom + 1;
    const top = fixed + layers * corners;
    const positions = new Float32Array((top + 1) * 3);

    for (let c = 0; c < columns; c++) {
        const a = c * 360 / columns;
        for (let i = 0; i <= thread_rows; i++) {
            const z = i * thread_pitch / 20;
            const r = neck_radius(z, a);
            positions.set([r * cos_d(a), r * sin_d(a), z], (i * columns + c) * 3);
        }
        positions.set([o_thread.n_radius * cos_d(a), o_thread.n_radius * sin_d(a), collar_top], ((thread_rows + 1) * columns + c) * 3);
    }

    for (let layer = 1; layer <= layers; layer++) {
        for (let corner = 0; corner < corners; corner++) {
            const p = point(layer / layers, corner / corners, layer, corner);
            const called = `f_o_p(${layer} / ${layers}, ${corner} / ${corners})`;
            for (const name of ["n_x", "n_y", "n_z"]) {
                if (!Number.isFinite(p?.[name])) throw new Error(`${called} returned ${name} = ${p?.[name]}`);
            }
            if (p.n_z < collar_top) throw new Error(`${called} returned n_z = ${p.n_z}: below o_thread.n_z, ${collar_top}, is the sockel`);
            positions.set([p.n_x, p.n_y, p.n_z], (fixed + (layer - 1) * corners + corner) * 3);
        }
    }
    const last = fixed + (layers - 1) * corners;
    for (let corner = 0; corner < corners; corner++) {
        for (let k = 0; k < 3; k++) positions[top * 3 + k] += positions[(last + corner) * 3 + k] / corners;
    }

    // The thread's columns run counter-clockwise, seen from above. A script's corners may
    // run either way and start anywhere: corner_id() counts them counter-clockwise from
    // the one nearest to column 0.
    const distance2 = (i, j) => (positions[i * 3] - positions[j * 3]) ** 2
        + (positions[i * 3 + 1] - positions[j * 3 + 1]) ** 2 + (positions[i * 3 + 2] - positions[j * 3 + 2]) ** 2;
    const ring_id = (k, c) => k * columns + c % columns;
    const collar = fixed_rings - 1;
    let area = 0;
    let start = 0;
    for (let corner = 0; corner < corners; corner++) {
        const [a, b] = [(fixed + corner) * 3, (fixed + (corner + 1) % corners) * 3];
        area += positions[a] * positions[b + 1] - positions[b] * positions[a + 1];
        if (distance2(ring_id(collar, 0), fixed + corner) < distance2(ring_id(collar, 0), fixed + start)) start = corner;
    }
    const turn = area < 0 ? corners - 1 : 1;
    const corner_id = (layer, j) => fixed + (layer - 1) * corners + (start + turn * j) % corners;

    const indices = new Uint32Array((columns * fixed_rings + corners * layers) * 2 * 3);
    let n = 0;
    const face = (a, b, c) => {
        indices[n++] = a;
        indices[n++] = b;
        indices[n++] = c;
    };
    for (let c = 0; c < columns; c++) face(bottom, ring_id(0, c + 1), ring_id(0, c));
    for (let k = 0; k < fixed_rings - 1; k++) {
        for (let c = 0; c < columns; c++) {
            face(ring_id(k, c), ring_id(k + 1, c + 1), ring_id(k + 1, c));
            face(ring_id(k, c), ring_id(k, c + 1), ring_id(k + 1, c + 1));
        }
    }
    const walls_start = n;
    // The collar's ring to the script's first layer: they differ in their number of
    // points, so each step goes on along the ring where that makes the shorter edge.
    for (let i = 0, j = 0; i < columns || j < corners;) {
        const [a, a1, b, b1] = [ring_id(collar, i), ring_id(collar, i + 1), corner_id(1, j), corner_id(1, j + 1)];
        if (j === corners || (i < columns && distance2(a1, b) <= distance2(a, b1))) {
            face(a, a1, b);
            i++;
        } else {
            face(a, b1, b);
            j++;
        }
    }
    for (let layer = 1; layer < layers; layer++) {
        for (let j = 0; j < corners; j++) {
            face(corner_id(layer, j), corner_id(layer + 1, j + 1), corner_id(layer + 1, j));
            face(corner_id(layer, j), corner_id(layer, j + 1), corner_id(layer + 1, j + 1));
        }
    }
    const walls_end = n;
    for (let j = 0; j < corners; j++) face(corner_id(layers, j), corner_id(layers, j + 1), top);

    return {positions, indices, fixed, walls: [walls_start, walls_end]};
}

// The script's wall that leans most, in or out: its angle from vertical, and its height.
// A single wall prints up to 45 degrees safely; see readme.md for more.
function steepest_wall({positions: p, indices: t, walls}) {
    let steepest = {angle: 0, z: 0};
    for (let i = walls[0]; i < walls[1]; i += 3) {
        const [a, b, c] = [t[i] * 3, t[i + 1] * 3, t[i + 2] * 3];
        const u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
        const v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
        const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const length = Math.hypot(...normal);
        // Two points in one place make a face without a direction.
        if (length < 1e-9) continue;
        const angle = Math.asin(Math.abs(normal[2]) / length) * deg_per_rad;
        if (angle > steepest.angle) steepest = {angle, z: (p[a + 2] + p[b + 2] + p[c + 2]) / 3};
    }
    return steepest;
}

// Binary STL, as an ArrayBuffer.
function mesh_to_stl(mesh) {
    const {positions: p, indices: t} = mesh;
    const buffer = new ArrayBuffer(84 + 50 * t.length / 3);
    const out = new DataView(buffer);
    out.setUint32(80, t.length / 3, true);
    let o = 84;
    for (let i = 0; i < t.length; i += 3) {
        const [a, b, c] = [t[i] * 3, t[i + 1] * 3, t[i + 2] * 3];
        const u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
        const v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
        const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const length = Math.hypot(...normal) || 1;
        for (const x of normal) { out.setFloat32(o, x / length, true); o += 4; }
        for (const j of [a, b, c]) {
            for (let k = 0; k < 3; k++) { out.setFloat32(o, p[j + k], true); o += 4; }
        }
        o += 2;
    }
    return buffer;
}
