// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Checks vase_mesh.js against ../pucklight_sphere/pucklight_sphereV3.scad: its thread is
// the vase mode sphere's, as OpenSCAD exports it, and its collar ends above the ribs in
// the sockel's cup. Then every example: closed, on the same thread.
// Run: node test_vase_mesh.js

const assert = require("assert");
const {execFileSync} = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

for (const file of ["vase_mesh.js", "examples.js"]) {
    vm.runInThisContext(fs.readFileSync(path.join(__dirname, file), "utf8"), {filename: file});
}
const scad = path.join(__dirname, "..", "pucklight_sphere", "pucklight_sphereV3.scad");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "vase_mesh_"));

// The same triangle always gives the same key, keeping its direction.
function face_key(a, b, c) {
    const low = Math.min(a, b, c);
    return low === a ? `${a} ${b} ${c}` : low === b ? `${b} ${c} ${a}` : `${c} ${a} ${b}`;
}

function signed_volume({positions: p, indices: t}) {
    let volume = 0;
    for (let i = 0; i < t.length; i += 3) {
        const [a, b, c] = [t[i] * 3, t[i + 1] * 3, t[i + 2] * 3];
        volume += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
            + p[a + 1] * (p[b + 2] * p[c] - p[b] * p[c + 2])
            + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6;
    }
    return volume;
}

// Every edge is used once in each direction: closed, and the faces agree on what is outside.
function assert_closed(mesh, name) {
    const t = mesh.indices;
    const edges = new Set();
    const n = mesh.positions.length / 3;
    assert.equal(t.length % 3, 0);
    for (let i = 0; i < t.length; i += 3) {
        for (const [a, b] of [[t[i], t[i + 1]], [t[i + 1], t[i + 2]], [t[i + 2], t[i]]]) {
            const edge = a * n + b;
            assert(!edges.has(edge), `${name}: an edge is used twice in one direction`);
            edges.add(edge);
        }
    }
    for (const edge of edges) {
        const a = Math.floor(edge / n);
        assert(edges.has((edge - a * n) * n + a), `${name}: an edge has no face on its other side`);
    }
    assert(signed_volume(mesh) > 0, `${name}: the faces point inwards`);
}

/* ---- The thread is V3's ---- */

const off = path.join(temp, "vase_sphere.off");
execFileSync("openscad", ["-D", 'part="vase_sphere"', "-D", `sphere_columns=${columns}`, "-o", off, scad], {stdio: "ignore"});
const numbers = fs.readFileSync(off, "utf8").replace("OFF", "").trim().split(/\s+/).map(Number);
const [n_points, n_faces] = numbers;
const points = numbers.slice(3, 3 + n_points * 3);
const openscad_faces = new Set();
for (let f = 0, i = 3 + n_points * 3; f < n_faces; f++, i += 4) {
    assert.equal(numbers[i], 3, "OpenSCAD's faces are triangles");
    openscad_faces.add(face_key(...numbers.slice(i + 1, i + 4)));
}

const template = vase_mesh(run_script(examples.template));
// The thread's rings and the bottom's centre. The collar's ring is not in V3.
const thread_points = (thread_rows + 1) * columns;
const is_thread = (i) => i < thread_points || i === template.fixed - 1;

const cell = 0.05;
const key = (x, y, z) => `${Math.round(x / cell)} ${Math.round(y / cell)} ${Math.round(z / cell)}`;
const grid = new Map();
for (let i = 0; i < n_points; i++) grid.set(key(points[i * 3], points[i * 3 + 1], points[i * 3 + 2]), i);
const to_openscad = new Map();
let worst = 0;
for (let i = 0; i < template.fixed; i++) {
    if (!is_thread(i)) continue;
    const [x, y, z] = template.positions.subarray(i * 3, i * 3 + 3);
    let best = Infinity;
    for (const dx of [-cell, 0, cell]) for (const dy of [-cell, 0, cell]) for (const dz of [-cell, 0, cell]) {
        const j = grid.get(key(x + dx, y + dy, z + dz));
        if (j === undefined) continue;
        const d = Math.hypot(points[j * 3] - x, points[j * 3 + 1] - y, points[j * 3 + 2] - z);
        if (d < best) { best = d; to_openscad.set(i, j); }
    }
    worst = Math.max(worst, best);
}
// OFF has 6 significant digits or so, hence the tolerance.
assert(worst <= 0.001, `a point of the thread is ${worst} mm off`);
assert.equal(new Set(to_openscad.values()).size, thread_points + 1, "two points match the same point");

let thread_faces = 0;
for (let i = 0; i < template.walls[0]; i += 3) {
    const face = [...template.indices.subarray(i, i + 3)];
    if (!face.every(is_thread)) continue;
    thread_faces++;
    assert(openscad_faces.has(face_key(...face.map((v) => to_openscad.get(v)))),
        `face ${i / 3} of the thread is not in OpenSCAD's mesh, or runs the other way`);
}
assert.equal(thread_faces, columns + 2 * thread_rows * columns);
console.log(`ok  thread: ${thread_points + 1} points, ${thread_faces} faces as in V3, worst point ${worst.toFixed(6)} mm off`);

/* ---- The collar ---- */

// What V3 derives: the ribs' top above the cup's floor, and the neck's radius.
const echo = path.join(temp, "collar.echo");
fs.writeFileSync(path.join(temp, "collar.scad"), `include <${scad}>\necho(rib_top - top_z, neck_d / 2);\n`);
execFileSync("openscad", ["-D", 'part="none"', "-o", echo, path.join(temp, "collar.scad")], {stdio: "ignore"});
const [ribs, neck_r] = fs.readFileSync(echo, "utf8").match(/ECHO: (.*)/)[1].split(",").map(Number);
assert(collar_top - ribs >= 0.4, `the collar ends ${collar_top - ribs} mm above the ribs`);
assert(Math.abs(collar_top / 0.2 - Math.round(collar_top / 0.2)) < 1e-9, "the collar's top is not on a 0.2 mm layer");
assert.equal(o_thread.n_radius, neck_r);
for (let c = 0; c < columns; c++) {
    const [x, y, z] = template.positions.subarray((thread_points + c) * 3, (thread_points + c) * 3 + 3);
    assert(Math.abs(Math.hypot(x, y) - neck_r) < 1e-4 && Math.abs(z - collar_top) < 1e-4);
}
console.log(`ok  collar: radius ${neck_r}, ends ${(collar_top - ribs).toFixed(2)} mm above the ribs, at ${ribs.toFixed(2)}`);

/* ---- The examples ---- */

for (const [name, code] of Object.entries(examples)) {
    const mesh = vase_mesh(run_script(code));
    assert_closed(mesh, name);
    assert.deepEqual(mesh.positions.subarray(0, mesh.fixed * 3), template.positions.subarray(0, template.fixed * 3),
        `${name}: the thread has moved`);
    const p = mesh.positions;
    let height = 0;
    let width = 0;
    for (let i = mesh.fixed * 3; i < p.length; i += 3) {
        assert(p[i + 2] >= collar_top, `${name}: a point is below the collar's top`);
        height = Math.max(height, p[i + 2]);
        width = Math.max(width, 2 * Math.hypot(p[i], p[i + 1]));
    }
    const {angle, z} = steepest_wall(mesh);
    const stl = new DataView(mesh_to_stl(mesh));
    assert.equal(stl.getUint32(80, true), mesh.indices.length / 3);
    assert.equal(stl.byteLength, 84 + 50 * mesh.indices.length / 3);
    console.log(`ok  ${name}: closed, ${mesh.indices.length / 3} triangles, ${height.toFixed(1)} high, ${width.toFixed(1)} wide, `
        + `${(signed_volume(mesh) / 1000).toFixed(0)} cm3, steepest wall ${angle.toFixed(1)} degrees at z = ${z.toFixed(1)}`);
}

/* ---- Any script ---- */

// Few corners or many, running either way, starting anywhere: closed, outside out.
for (const corners of [3, 5, 180, 500]) {
    for (const turn of [1, -1]) {
        const mesh = vase_mesh({n_its_layer: 3, n_its_corner: corners, f_o_p: (layer, corner) => ({
            n_x: 40 * Math.cos(turn * corner * 2 * Math.PI + 1), n_y: 40 * Math.sin(turn * corner * 2 * Math.PI + 1),
            n_z: collar_top + 30 * layer,
        })});
        assert_closed(mesh, `${corners} corners, turning ${turn}`);
        assert(Math.abs(signed_volume(mesh) / 1000 - signed_volume(vase_mesh({n_its_layer: 3, n_its_corner: corners,
            f_o_p: (layer, corner) => ({n_x: 40 * Math.cos(corner * 2 * Math.PI), n_y: 40 * Math.sin(corner * 2 * Math.PI),
                n_z: collar_top + 30 * layer})})) / 1000) < 0.01, `${corners} corners, turning ${turn}: another volume`);
    }
}
console.log("ok  3 to 500 corners, clockwise and counter-clockwise: closed, the same volume");

// What a script must not do.
const good = {n_its_layer: 2, n_its_corner: 4, f_o_p: (layer, corner) => ({
    n_x: 30 * Math.cos(corner * 2 * Math.PI), n_y: 30 * Math.sin(corner * 2 * Math.PI), n_z: 10 * layer + collar_top})};
assert_closed(vase_mesh(good), "a square");
for (const [bad, message] of [
    [undefined, /must return/],
    [{...good, f_o_p: 1}, /must return/],
    [{...good, n_its_layer: 0}, /n_its_layer/],
    [{...good, n_its_layer: 1.5}, /n_its_layer/],
    [{...good, n_its_corner: 2}, /n_its_corner/],
    [{...good, n_its_layer: 2000, n_its_corner: 2000}, /more than/],
    [{...good, f_o_p: () => ({n_x: 1, n_y: NaN, n_z: 10})}, /n_y = NaN/],
    [{...good, f_o_p: () => undefined}, /n_x = undefined/],
    [{...good, f_o_p: () => ({n_x: 1, n_y: 1, n_z: 6})}, /below o_thread.n_z/],
]) assert.throws(() => vase_mesh(bad), message);
assert.throws(() => run_script("return {"), SyntaxError);
// A script cannot change what the next one sees.
run_script("o_thread.n_z = 0;");
assert.equal(run_script("return o_thread.n_z;"), collar_top);
console.log("ok  scripts with mistakes are refused");

fs.rmSync(temp, {recursive: true});
