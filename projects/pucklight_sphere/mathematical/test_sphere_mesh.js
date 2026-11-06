// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Compares sphere_mesh.js with the sphere OpenSCAD exports from
// ../pucklight_sphereV2.scad: same points, same faces, also with a surface formula.
// Run: node test_sphere_mesh.js

const assert = require("assert");
const {execFileSync} = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

vm.runInThisContext(fs.readFileSync(path.join(__dirname, "sphere_mesh.js"), "utf8"));
const scad = path.join(__dirname, "..", "pucklight_sphereV2.scad");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sphere_mesh_"));

function openscad_mesh(columns, surface) {
    const file = path.join(temp, `${surface}_${columns}.off`);
    execFileSync("openscad", ["-D", 'part="sphere"', "-D", `sphere_columns=${columns}`,
        "-D", `surface="${surface}"`, "-o", file, scad], {stdio: "ignore"});
    const numbers = fs.readFileSync(file, "utf8").replace("OFF", "").trim().split(/\s+/).map(Number);
    const [n_points, n_faces] = numbers;
    const points = numbers.slice(3, 3 + n_points * 3);
    const faces = [];
    for (let f = 0, i = 3 + n_points * 3; f < n_faces; f++, i += 4) {
        assert.equal(numbers[i], 3, "OpenSCAD's faces are triangles");
        faces.push(numbers.slice(i + 1, i + 4));
    }
    return {points, faces};
}

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

// Same points, each within tolerance mm, and the same faces in the same direction.
function assert_same_mesh(mesh, {points, faces}, tolerance, name) {
    const n = mesh.positions.length / 3;
    assert.equal(points.length / 3, n, `${name}: number of points`);
    assert.equal(faces.length, mesh.indices.length / 3, `${name}: number of faces`);

    const cell = 0.05;
    const key = (x, y, z) => `${Math.round(x / cell)} ${Math.round(y / cell)} ${Math.round(z / cell)}`;
    const grid = new Map();
    for (let i = 0; i < n; i++) grid.set(key(points[i * 3], points[i * 3 + 1], points[i * 3 + 2]), i);

    const to_openscad = new Int32Array(n).fill(-1);
    let worst = 0;
    for (let i = 0; i < n; i++) {
        const [x, y, z] = mesh.positions.subarray(i * 3, i * 3 + 3);
        let best = Infinity;
        for (const dx of [-cell, 0, cell]) for (const dy of [-cell, 0, cell]) for (const dz of [-cell, 0, cell]) {
            const j = grid.get(key(x + dx, y + dy, z + dz));
            if (j === undefined) continue;
            const d = Math.hypot(points[j * 3] - x, points[j * 3 + 1] - y, points[j * 3 + 2] - z);
            if (d < best) { best = d; to_openscad[i] = j; }
        }
        worst = Math.max(worst, best);
    }
    assert(worst <= tolerance, `${name}: a point is ${worst} mm off`);
    assert.equal(new Set(to_openscad).size, n, `${name}: two points match the same point`);

    const openscad_faces = new Set(faces.map(([a, b, c]) => face_key(a, b, c)));
    const t = mesh.indices;
    for (let i = 0; i < t.length; i += 3) {
        const k = face_key(to_openscad[t[i]], to_openscad[t[i + 1]], to_openscad[t[i + 2]]);
        assert(openscad_faces.has(k), `${name}: face ${i / 3} is not in OpenSCAD's mesh, or runs the other way`);
    }
    console.log(`ok  ${name}: ${n} points, ${faces.length} faces, worst point ${worst.toFixed(6)} mm off`);
}

// Every edge is used once in each direction: closed, and the faces agree on what is outside.
function assert_closed(mesh, name) {
    const t = mesh.indices;
    const edges = new Set();
    const n = mesh.positions.length / 3;
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
    console.log(`ok  ${name}: closed, ${(signed_volume(mesh) / 1000).toFixed(2)} cm3`);
}

// The generator's surface_height() for "twist" at its defaults.
const twist = (lat, lon) => 0.5 + 0.5 * cos_d(12 * (lon + 120 * lat / 180));

// OFF has 6 significant digits or so, hence the tolerance.
const tolerance = 0.001;

for (const columns of [180, 64]) {
    const smooth = sphere_mesh(columns);
    assert_same_mesh(smooth, openscad_mesh(columns, "smooth"), tolerance, `smooth, ${columns} columns`);
    assert_closed(smooth, `smooth, ${columns} columns`);
}

const twisted = sphere_mesh(180);
const rest = twisted.positions.slice();
displace(twisted, twist, 0.8);
assert_same_mesh(twisted, openscad_mesh(180, "twist"), tolerance, "twist, 180 columns");
assert_closed(twisted, "twist, 180 columns");

// Only the rings in moving have moved, and they have moved along their line from the centre.
const moved = new Set();
for (const {ring} of twisted.moving) for (let c = 0; c < twisted.columns; c++) moved.add(ring * twisted.columns + c);
let changed = 0;
for (let i = 0; i < rest.length / 3; i++) {
    const same = rest[i * 3] === twisted.positions[i * 3] && rest[i * 3 + 1] === twisted.positions[i * 3 + 1]
        && rest[i * 3 + 2] === twisted.positions[i * 3 + 2];
    assert(same || moved.has(i), `point ${i} moved, but is not in a moving ring`);
    if (!same) {
        changed++;
        const from = [rest[i * 3], rest[i * 3 + 1], rest[i * 3 + 2] - centre_z];
        const to = [twisted.positions[i * 3], twisted.positions[i * 3 + 1], twisted.positions[i * 3 + 2] - centre_z];
        const cross = Math.hypot(from[1] * to[2] - from[2] * to[1], from[2] * to[0] - from[0] * to[2],
            from[0] * to[1] - from[1] * to[0]);
        assert(cross / Math.hypot(...from) < 0.001, `point ${i} did not move away from the centre`);
    }
}
console.log(`ok  moved ${changed} of ${rest.length / 3} points, all away from the centre`);

// The exports hold the mesh.
const stl = new DataView(mesh_to_stl(twisted));
assert.equal(stl.getUint32(80, true), twisted.indices.length / 3);
assert.equal(stl.byteLength, 84 + 50 * twisted.indices.length / 3);
const obj = mesh_to_obj(twisted, new Uint8Array(twisted.positions.length).fill(255)).trim().split("\n");
assert.equal(obj.length, twisted.positions.length / 3 + twisted.indices.length / 3);
assert.match(obj[0], /^v (-?[\d.]+ ){5}1\.000$/);
console.log("ok  stl and obj hold every point and face");

fs.rmSync(temp, {recursive: true});
