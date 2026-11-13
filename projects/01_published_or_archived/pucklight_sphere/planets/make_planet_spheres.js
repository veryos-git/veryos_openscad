// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Makes the sphere of each planet project, as its .stl button in the webapp does, without
// a browser: the mesh, displace() and the .stl come from ../mathematical/sphere_mesh.js,
// and the map is made as the app's shader makes it. Prints the overhang of each, as in
// ../mathematical/readme.md, Overhang.
//
// Run: node make_planet_spheres.js [names]
// The spheres, 43 MB each, go to .gitignored/spheres/, out of git.

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const zlib = require("zlib");

const app_dir = path.join(__dirname, "..", "mathematical");
vm.runInThisContext(fs.readFileSync(path.join(app_dir, "sphere_mesh.js"), "utf8"));
const app_js = fs.readFileSync(path.join(app_dir, "app.js"), "utf8");
const template = (name) => app_js.match(new RegExp(`\\n    ${name}: \`([\\s\\S]*?)\``))[1];

// Not moon_light: its own shader is not one of the templates; its .stl comes from the app.
const planets = ["Mercury", "Venus", "Earth", "Moon", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
    "Charon", "Ceres", "Vesta", "Titan"];
const out_dir = path.join(__dirname, ".gitignored", "spheres");
// The app's map.
const map_width = 2048;
const map_height = 1024;

// The grey levels of an 8-bit grey PNG without interlace, as the planets' textures are.
function read_png(file) {
    const data = fs.readFileSync(file);
    let width;
    let height;
    const parts = [];
    for (let o = 8; o < data.length; o += 12 + data.readUInt32BE(o)) {
        const type = data.toString("latin1", o + 4, o + 8);
        const body = data.subarray(o + 8, o + 8 + data.readUInt32BE(o));
        if (type === "IHDR") {
            [width, height] = [body.readUInt32BE(0), body.readUInt32BE(4)];
            assert(body[8] === 8 && body[9] === 0 && body[12] === 0, `${file}: not an 8-bit grey PNG`);
        }
        if (type === "IDAT") parts.push(body);
    }
    const raw = zlib.inflateSync(Buffer.concat(parts));
    const pixels = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (width + 1)];
        for (let x = 0; x < width; x++) {
            const a = x > 0 ? pixels[y * width + x - 1] : 0;
            const b = y > 0 ? pixels[(y - 1) * width + x] : 0;
            const c = x > 0 && y > 0 ? pixels[(y - 1) * width + x - 1] : 0;
            const p = a + b - c;
            const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a
                : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
            pixels[y * width + x] = raw[y * (width + 1) + 1 + x] + [0, a, b, (a + b) >> 1, paeth][filter];
        }
    }
    return {width, height, pixels};
}

// The map as the app's render_map() leaves it in map_pixels, rows from the bottom. Its
// pixel centres fall on the texture's, one texel each; the template moves the map by
// 0.25 and the lithophane turns it over. Then gamma, and 8 bits again.
function make_map(texture, lithophane, gamma) {
    assert(texture.width === map_width && texture.height === map_height, "the texture must be 2048 x 1024");
    const map = new Uint8Array(map_width * map_height);
    for (let row = 0; row < map_height; row++) {
        for (let x = 0; x < map_width; x++) {
            const texel = texture.pixels[(map_height - 1 - row) * map_width + (x - map_width / 4 + map_width) % map_width];
            const h = (lithophane ? 255 - texel : texel) / 255;
            map[row * map_width + x] = Math.round(255 * h ** gamma);
        }
    }
    return map;
}

// As map_height_at() in app.js, for this map.
function height_at(map) {
    return (lat, lon) => {
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
        const low = map[ya + xa] * (1 - fx) + map[ya + xb] * fx;
        const high = map[yb + xa] * (1 - fx) + map[yb + xb] * fx;
        return (low * (1 - fy) + high * fy) / 255;
    };
}

// The outside's lower half, where the relief hangs over: its steepest face, in degrees
// from the vertical, and its area steeper than 45, in mm2.
function overhang(mesh) {
    const {columns, positions: p, indices: t, rows} = mesh;
    const first = rows[0].ring;
    const lower = rows.filter((row) => row.lat < 0).length;
    let steepest = 0;
    let steep = 0;
    for (let i = 0; i < t.length; i += 3) {
        const [a, b, c] = [t[i], t[i + 1], t[i + 2]];
        if ([a, b, c].some((v) => v < first * columns || Math.floor(v / columns) - first >= lower)) continue;
        const u = [p[3 * b] - p[3 * a], p[3 * b + 1] - p[3 * a + 1], p[3 * b + 2] - p[3 * a + 2]];
        const v = [p[3 * c] - p[3 * a], p[3 * c + 1] - p[3 * a + 1], p[3 * c + 2] - p[3 * a + 2]];
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const length = Math.hypot(...n);
        const angle = Math.asin(Math.max(0, -n[2] / length)) * 180 / Math.PI;
        steepest = Math.max(steepest, angle);
        if (angle > 45) steep += length / 2;
    }
    return {steepest, steep};
}

function main(names) {
    fs.mkdirSync(out_dir, {recursive: true});
    console.log("| Project | Depth | From lat | Steepest | Area steeper than 45 |\n|---|---|---|---|---|");
    for (const name of names) {
        const folder = path.join(app_dir, "projects", name);
        const project = JSON.parse(fs.readFileSync(path.join(folder, "project.json"), "utf8"));
        const lithophane = project.code === template("lithophane");
        assert(lithophane || project.code === template("texture"), `${name}: only the texture and lithophane templates`);
        const map = make_map(read_png(path.join(folder, "texture.png")), lithophane, project.gamma);
        const mesh = sphere_mesh(project.columns);
        displace(mesh, height_at(map), project.depth, project.relief_from);
        fs.writeFileSync(path.join(out_dir, `pucklight_sphere_${name.replace(/\s+/g, "_")}.stl`),
            new Uint8Array(mesh_to_stl(mesh)));
        const {steepest, steep} = overhang(mesh);
        console.log(`| ${name} | ${project.depth} | ${project.relief_from} | ${steepest.toFixed(1)} | ${steep.toFixed(0)} mm2 |`);
    }
}

main(process.argv.slice(2).length ? process.argv.slice(2) : planets);
