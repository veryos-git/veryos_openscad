// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The sphere of pucklight_sphere V3, part = "sphere", with a heightmap as its surface
// formula: the points and faces of its sphere_mesh(), at its defaults and with its
// names. Its neck is the lampshade's in ../pucklight_lamp_v2V5.scad, so it screws into
// the lamp's cup; test/mesh.test.js compares the two.
//
// As in V3's outer_radius(), only the outside above the fade's bottom and below fade_top
// moves, away from the sphere's centre. The thread, the neck, the inside and the poles
// stay. V3's fade_bottom is the default; a planet can reach lower.
//
// Units: mm and degrees.

const deg_per_rad = 180 / Math.PI;
const sin_d = (a) => Math.sin(a / deg_per_rad);
const cos_d = (a) => Math.cos(a / deg_per_rad);

// The generator's parameters.
const sphere_d = 100;
const shell = 0.8;
const neck_d = 67;
const neck_height = 4;
const neck_wall = 1.2;
const thread_pitch = 2;
const front_logo_width = 20;
const logo_r = 15.6264133379;
const logo_stroke = 5;
const logo_angle = 22.5;
const fade_width = 15;
const fade_top = 80;

// What the generator derives from them.
const thread_depth = 0.4 * thread_pitch;
const thread_tip = 0.05 * thread_pitch;
const logo_b = logo_r * (1 - sin_d(logo_angle)) / cos_d(logo_angle);
const logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin_d(logo_angle))) / cos_d(logo_angle);
const logo_w = 2 * (logo_b + logo_arm * sin_d(logo_angle));
const neck_root_r = neck_d / 2 - thread_depth;
const neck_bore_r = neck_root_r - neck_wall;
const sphere_r = sphere_d / 2;
const inner_r = sphere_r - shell;
const start_r = Math.max(sphere_r * cos_d(45), neck_d / 2 + 1);
const sphere_start = -Math.acos(start_r / sphere_r) * deg_per_rad;
const start_z = neck_height + start_r - neck_root_r;
const centre_z = start_z - sphere_r * sin_d(sphere_start);
const inner_start_r = inner_r * cos_d(sphere_start);
const inner_start_z = centre_z + inner_r * sin_d(sphere_start);
const bore_top = inner_start_z - (inner_start_r - neck_bore_r);
const logo_half_lat = deg_per_rad * (front_logo_width * 2 * logo_r / logo_w) / 2 / sphere_r;
const front_logo_lat = sphere_start + 7 + logo_half_lat;
const fade_bottom = front_logo_lat + logo_half_lat + 2;

function smoothstep(t) {
    const s = Math.max(0, Math.min(1, t));
    return s * s * (3 - 2 * s);
}

function surface_fade(lat, bottom = fade_bottom) {
    return smoothstep((lat - bottom) / fade_width) * smoothstep((fade_top - lat) / fade_width);
}

function neck_radius(z, a) {
    const u = z - thread_pitch * a / 360;
    const m = u - thread_pitch * Math.floor(u / thread_pitch);
    const d = Math.min(m, thread_pitch - m);
    const ridge = Math.max(0, Math.min(thread_depth, thread_depth + thread_tip - d));
    return neck_root_r + Math.max(Math.min(ridge, z), z - neck_height);
}

// The smooth sphere, neck on the bed. positions has x, y, z per point; indices has
// three per triangle, counter-clockwise from outside; rest has the positions before
// any displace(); heights has each point's height from 0 to 1, as last set by
// displace(); rows lists the outside's rings, which can move.
function sphere_mesh(columns) {
    const thread_rows = Math.ceil((neck_height + thread_depth) / (thread_pitch / 20));
    const row_count = Math.ceil((90 - sphere_start) * columns / 360);
    const sphere_step = (90 - sphere_start) / row_count;
    const sphere_rows = Array.from({length: row_count}, (_, i) => sphere_start + i * sphere_step);
    // The rings run up the outside and down the inside.
    const n_outer = thread_rows + 1 + row_count;
    const n_rings = n_outer + row_count + 2;
    const pole_out = n_rings * columns;
    const pole_in = pole_out + 1;

    const positions = new Float32Array((pole_in + 1) * 3);
    const place = (k, c, r, z) => {
        const a = c * 360 / columns;
        positions.set([r * cos_d(a), r * sin_d(a), z], (k * columns + c) * 3);
    };
    for (let c = 0; c < columns; c++) {
        for (let i = 0; i <= thread_rows; i++) {
            const z = i * thread_pitch / 20;
            place(i, c, neck_radius(z, c * 360 / columns), z);
        }
        sphere_rows.forEach((lat, i) => {
            place(thread_rows + 1 + i, c, sphere_r * cos_d(lat), centre_z + sphere_r * sin_d(lat));
            place(n_outer + row_count - 1 - i, c, inner_r * cos_d(lat), centre_z + inner_r * sin_d(lat));
        });
        place(n_rings - 2, c, neck_bore_r, bore_top);
        place(n_rings - 1, c, neck_bore_r, 0);
    }
    positions.set([0, 0, centre_z + sphere_r], pole_out * 3);
    positions.set([0, 0, centre_z + inner_r], pole_in * 3);

    const indices = new Uint32Array(2 * (pole_in + 1 - 2) * 3);
    let n = 0;
    const ring_id = (k, c) => k * columns + c % columns;
    // The generator's faces are clockwise from outside; here they are the other way round.
    const face = (a, b, c) => {
        indices[n++] = a;
        indices[n++] = c;
        indices[n++] = b;
    };
    const ring_strip = (k, k1) => {
        for (let c = 0; c < columns; c++) {
            face(ring_id(k, c), ring_id(k1, c), ring_id(k1, c + 1));
            face(ring_id(k, c), ring_id(k1, c + 1), ring_id(k, c + 1));
        }
    };
    for (let k = 0; k < n_outer - 1; k++) ring_strip(k, k + 1);
    for (let c = 0; c < columns; c++) face(ring_id(n_outer - 1, c), pole_out, ring_id(n_outer - 1, c + 1));
    for (let c = 0; c < columns; c++) face(pole_in, ring_id(n_outer, c), ring_id(n_outer, c + 1));
    for (let k = n_outer; k < n_rings - 1; k++) ring_strip(k, k + 1);
    ring_strip(n_rings - 1, 0);

    const rows = sphere_rows.map((lat, i) => ({ring: thread_rows + 1 + i, lat}));
    return {columns, positions, rest: positions.slice(), indices, heights: new Float32Array(pole_in + 1), rows};
}

// Moves the outside to height(lat, lon), from 0 to 1, times depth above the smooth
// sphere, as outer_radius() does with surface_height(lat, lon). Returns how many
// points were offset; the others are back on the smooth sphere.
function displace(mesh, height, depth, bottom = fade_bottom) {
    const {columns, positions, rest, heights} = mesh;
    let offset = 0;
    for (const {ring, lat} of mesh.rows) {
        const fade = surface_fade(lat, bottom);
        if (fade === 0) {
            positions.set(rest.subarray(ring * columns * 3, (ring + 1) * columns * 3), ring * columns * 3);
            heights.fill(0, ring * columns, (ring + 1) * columns);
            continue;
        }
        offset += columns;
        const ring_r = cos_d(lat);
        const ring_z = sin_d(lat);
        for (let c = 0; c < columns; c++) {
            const lon = c * 360 / columns;
            const i = ring * columns + c;
            const h = fade * height(lat, lon);
            const r = sphere_r + depth * h;
            heights[i] = h;
            positions[3 * i] = r * ring_r * cos_d(lon);
            positions[3 * i + 1] = r * ring_r * sin_d(lon);
            positions[3 * i + 2] = centre_z + r * ring_z;
        }
    }
    return offset;
}

export { sphere_mesh, displace, neck_radius, sphere_r, centre_z, shell, neck_wall, thread_depth, fade_bottom };
