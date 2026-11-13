// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The vase: a solid for a slicer's vase mode, which prints its outline as one wall. Its
// bottom is fixed: the thread of the lampshade's neck in ../pucklight_lamp_v2V5.scad,
// which is pucklight_sphere V3's, with its names, so the vase screws into the lamp's
// cup, and a collar above it. Copy changes to the thread over by hand; test/mesh.test.js
// compares the two. Everything above the collar is a script's: its f_o_p() is called
// for each corner of each layer. On top the last layer is closed flat, or, if the
// script asks for one, with a dome. A layer may fold back, as long as it does not
// cross itself.
//
// Units: mm and degrees. z = 0 is the print bed, and the floor of the lamp's cup.

import { noise } from './noise.module.js';

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
// The cup's rim is 4.8 above its floor. The collar ends 1.8 above it, on a 0.2 mm
// layer, as in pucklight_vase, where it cleared the ribs in the sockel's cup.
const collar_top = 6.6;
// More points than this in a script's shape only freeze the browser.
const max_points = 2000000;
// A dome has a ring every dome_step degrees along its ellipse.
const dome_step = 3;
// Cutting ears takes the square of a layer's corners in steps: a layer of more keeps its fan.
const max_ear_corners = 20000;

// What a script sees: the fixed part's top ring, where its shape starts.
const o_thread = {n_radius: neck_d / 2, n_z: collar_top};

function neck_radius(z, a) {
    const u = z - thread_pitch * a / 360;
    const m = u - thread_pitch * Math.floor(u / thread_pitch);
    const d = Math.min(m, thread_pitch - m);
    const ridge = Math.max(0, Math.min(thread_depth, thread_depth + thread_tip - d));
    return neck_root_r + Math.max(Math.min(ridge, z), z - neck_height);
}

// What a script sees besides o_thread and noise: Math's functions and constants without
// their "Math.", and a few of a shader's. A vector is {n_x, n_y} or {n_x, n_y, n_z}, as
// f_o_p() returns one.
const script_functions = {
    ...Object.fromEntries(Object.getOwnPropertyNames(Math).map((name) => [name, Math[name]])),
    fract: (n) => n - Math.floor(n),
    mix: (a, b, n) => a + (b - a) * n,
    clamp: (n, low, high) => Math.min(Math.max(n, low), high),
    smoothstep: (low, high, n) => {
        const t = Math.min(Math.max((n - low) / (high - low), 0), 1);
        return t * t * (3 - 2 * t);
    },
    vec2: (n_x, n_y) => ({n_x, n_y}),
    vec3: (n_x, n_y, n_z) => ({n_x, n_y, n_z}),
    length: (o) => Math.hypot(o.n_x, o.n_y, o.n_z ?? 0),
    // n_z counts if both have one: to a vec2 the distance is the one seen from above.
    distance: (o_a, o_b) => Math.hypot(o_a.n_x - o_b.n_x, o_a.n_y - o_b.n_y,
        o_a.n_z === undefined || o_b.n_z === undefined ? 0 : o_a.n_z - o_b.n_z),
};

// Runs a script: the body of a function that returns {n_its_layer, n_its_corner, f_o_p},
// and n_height_dome and n_overhang_dome if it wants a dome. It gets o_thread, and sees
// the noise of noise.module.js, which starts on seed 0 for each script: whatever the
// script before it seeded, a script makes the same vase. It is a function inside the
// one that has script_functions, so its own sin or fract takes the place of these. Its
// first line stays the third, for error_line().
function run_script(code) {
    noise.seed(0);
    return new Function(...Object.keys(script_functions), "noise", `return function (o_thread) {${code}\n}`)(
        ...Object.values(script_functions), noise)({...o_thread});
}

// The script's line an error came from, if its stack tells: Chrome names the script
// <anonymous>, Firefox Function, and both count two lines before its first.
function error_line(error) {
    const found = /(?:<anonymous>|> Function):(\d+):\d+/.exec(error.stack ?? "");
    return found ? +found[1] - 2 : null;
}

// The triangles that close a layer which folds back, so that its centre does not see
// all of it and a fan around the centre closes more than the layer. They come from
// cutting off the layer's ears one by one: a corner that sticks out, with no other
// corner in the triangle of it and its two neighbours. ring lists the layer's points
// counter-clockwise, seen from above. Returns null for a layer that has no ear left to
// cut: one that crosses itself, or runs the other way.
function ear_triangles(positions, ring) {
    const count = ring.length;
    const x = (i) => positions[ring[i] * 3];
    const y = (i) => positions[ring[i] * 3 + 1];
    // Above 0 where the way from a over b to c turns left.
    const turn = (a, b, c) => (x(b) - x(a)) * (y(c) - y(a)) - (x(c) - x(a)) * (y(b) - y(a));
    const same = (a, b) => x(a) === x(b) && y(a) === y(b);
    const next = Array.from({length: count}, (_, i) => (i + 1) % count);
    const prev = Array.from({length: count}, (_, i) => (i + count - 1) % count);
    // Only a corner that does not stick out can lie in another corner's triangle.
    const bent = Array.from({length: count}, (_, i) => turn(prev[i], i, next[i]) <= 0);
    const ear = (b) => {
        const [a, c] = [prev[b], next[b]];
        if (bent[b]) return false;
        for (let p = next[c]; p !== a; p = next[p]) {
            if (!bent[p] || same(p, a) || same(p, b) || same(p, c)) continue;
            if (turn(a, b, p) >= 0 && turn(b, c, p) >= 0 && turn(c, a, p) >= 0) return false;
        }
        return true;
    };
    const triangles = [];
    let b = 0;
    for (let left = count, missed = 0; left > 3;) {
        if (!ear(b)) {
            b = next[b];
            if (++missed > left) return null;
            continue;
        }
        const [a, c] = [prev[b], next[b]];
        triangles.push(ring[a], ring[b], ring[c]);
        next[a] = c;
        prev[c] = a;
        bent[a] = turn(prev[a], a, c) <= 0;
        bent[c] = turn(a, c, next[c]) <= 0;
        b = a;
        left--;
        missed = 0;
    }
    triangles.push(ring[prev[b]], ring[b], ring[next[b]]);
    return triangles;
}

// The vase of what a script returns. positions has x, y, z per point; indices has three
// per triangle, counter-clockwise from outside. The first fixed points are the thread's
// and the collar's. walls is the range in indices of the script's walls and its dome,
// without a flat top.
function vase_mesh(script) {
    const {n_its_layer: layers, n_its_corner: corners, f_o_p: point,
        n_height_dome: dome_height = 0, n_overhang_dome: dome_overhang = 60} = script ?? {};
    if (typeof point !== "function") throw new Error("the script must return {n_its_layer, n_its_corner, f_o_p}");
    if (!Number.isInteger(layers) || layers < 1) throw new Error(`n_its_layer must be a whole number from 1, not ${layers}`);
    if (!Number.isInteger(corners) || corners < 3) throw new Error(`n_its_corner must be a whole number from 3, not ${corners}`);
    if (layers * corners > max_points) throw new Error(`n_its_layer x n_its_corner is ${layers * corners}: more than ${max_points} points`);
    if (!Number.isFinite(dome_height) || dome_height < 0) throw new Error(`n_height_dome must be 0 or more, not ${dome_height}`);
    if (!(dome_overhang > 0 && dome_overhang < 90)) throw new Error(`n_overhang_dome must be above 0 and below 90, not ${dome_overhang}`);

    // The fixed rings, the bottom's centre, the script's rings, the dome's rings, the top's
    // centre. How many rings the dome has shows only below: this holds the most there are.
    const fixed_rings = thread_rows + 2;
    const bottom = fixed_rings * columns;
    const fixed = bottom + 1;
    const last = fixed + (layers - 1) * corners;
    const positions = new Float32Array((last + (1 + 90 / dome_step) * corners + 1) * 3);

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
            if (p.n_z < collar_top) throw new Error(`${called} returned n_z = ${p.n_z}: below o_thread.n_z, ${collar_top}, is the lamp's cup`);
            positions.set([p.n_x, p.n_y, p.n_z], (fixed + (layer - 1) * corners + corner) * 3);
        }
    }

    // The top: the last layer's centre, or the tip of a dome above it. In a dome the last
    // layer shrinks towards its centre along an ellipse, up to where its wall leans
    // dome_overhang from vertical. A single wall cannot lie flat, so from there a straight
    // cone goes on to the tip. cone is the height of that cone alone, from the last
    // layer's farthest corner: a dome lower than it is a cone, and steeper.
    const centre = [0, 0, 0];
    for (let corner = 0; corner < corners; corner++) {
        for (let k = 0; k < 3; k++) centre[k] += positions[(last + corner) * 3 + k] / corners;
    }
    let radius = 0;
    for (let corner = 0; corner < corners; corner++) {
        radius = Math.max(radius, Math.hypot(positions[(last + corner) * 3] - centre[0], positions[(last + corner) * 3 + 1] - centre[1]));
    }
    const cone = radius / Math.tan(dome_overhang / deg_per_rad);
    const ellipse = Math.sqrt(Math.max(0, dome_height ** 2 - cone ** 2));
    const sweep = Math.atan2(ellipse, cone) * deg_per_rad;
    const dome_rows = Math.ceil(sweep / dome_step);
    for (let row = 1; row <= dome_rows; row++) {
        const a = row * sweep / dome_rows;
        for (let corner = 0; corner < corners; corner++) {
            for (let k = 0; k < 3; k++) {
                positions[(last + row * corners + corner) * 3 + k] = centre[k]
                    + (positions[(last + corner) * 3 + k] - centre[k]) * cos_d(a) + (k === 2 ? ellipse * sin_d(a) : 0);
            }
        }
    }
    // The dome's rings count as layers from here on.
    const rings = layers + dome_rows;
    const top = fixed + rings * corners;
    positions.set([centre[0], centre[1], centre[2] + dome_height], top * 3);

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

    // A flat top is a fan around the last layer's centre, if the centre sees every corner:
    // each of the fan's triangles then faces up. A layer that folds back has some that
    // face down, and gets the triangles of its ears instead, two fewer, without the centre.
    const ring = Array.from({length: corners}, (_, j) => corner_id(rings, j));
    const faces_down = (j) => {
        const [a, b] = [ring[j] * 3, ring[(j + 1) % corners] * 3];
        return (positions[a] - centre[0]) * (positions[b + 1] - centre[1]) - (positions[b] - centre[0]) * (positions[a + 1] - centre[1]) < -1e-9;
    };
    const ears = dome_height === 0 && corners <= max_ear_corners && ring.some((_, j) => faces_down(j)) ? ear_triangles(positions, ring) : null;

    const indices = new Uint32Array((columns * fixed_rings + corners * rings) * 2 * 3 - (ears ? 2 * 3 : 0));
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
    for (let layer = 1; layer < rings; layer++) {
        for (let j = 0; j < corners; j++) {
            face(corner_id(layer, j), corner_id(layer + 1, j + 1), corner_id(layer + 1, j));
            face(corner_id(layer, j), corner_id(layer, j + 1), corner_id(layer + 1, j + 1));
        }
    }
    const walls_end = dome_height > 0 ? indices.length : n;
    if (ears) indices.set(ears, n);
    else for (let j = 0; j < corners; j++) face(corner_id(rings, j), corner_id(rings, j + 1), top);

    return {positions: positions.subarray(0, (ears ? top : top + 1) * 3), indices, fixed, walls: [walls_start, walls_end]};
}

// The script's walls that lean most from vertical, with their angle and height: out, the
// one that leans outwards, so that it faces down, an overhang, and inward, the one that
// leans in. A single wall has as little under it either way, and prints up to 45 degrees
// safely; see readme.md for more.
function steepest_walls({positions: p, indices: t, walls}) {
    const steepest = {out: {angle: 0, z: 0}, inward: {angle: 0, z: 0}};
    for (let i = walls[0]; i < walls[1]; i += 3) {
        const [a, b, c] = [t[i] * 3, t[i + 1] * 3, t[i + 2] * 3];
        const u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
        const v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
        const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const length = Math.hypot(...normal);
        // Two points in one place make a face without a direction.
        if (length < 1e-9) continue;
        const angle = Math.asin(Math.abs(normal[2]) / length) * deg_per_rad;
        const way = normal[2] < 0 ? "out" : "inward";
        if (angle > steepest[way].angle) steepest[way] = {angle, z: (p[a + 2] + p[b + 2] + p[c + 2]) / 3};
    }
    return steepest;
}

export { o_thread, script_functions, run_script, error_line, vase_mesh, steepest_walls, neck_radius, collar_top };
