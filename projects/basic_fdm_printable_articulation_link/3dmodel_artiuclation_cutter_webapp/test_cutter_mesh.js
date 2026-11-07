// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Compares cutter_mesh.js with the OpenSCAD exports of ../articulated_chain.scad and
// ../articulation_cutter.scad: same volumes for the link, a cutter and the demo bar,
// and the demo bar falls into the right number of pieces.
// Run: node test_cutter_mesh.js (needs openscad; downloads Manifold from the CDN once)

const assert = require("assert");
const {execFileSync} = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {pathToFileURL} = require("url");

const MANIFOLD = "https://cdn.jsdelivr.net/npm/manifold-3d@3.5.4/";
const here = __dirname;
const temp = path.join(os.tmpdir(), "cutter_mesh_test");
fs.mkdirSync(temp, {recursive: true});

async function fetch_once(name) {
    const file = path.join(temp, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(await (await fetch(MANIFOLD + name)).arrayBuffer()));
    return file;
}

// Volume of an OpenSCAD export, from the ASCII STL it writes.
function openscad_volume(scad, defines, name) {
    const file = path.join(temp, `${name}.stl`);
    execFileSync("openscad", [...defines.flatMap((d) => ["-D", d]), "-o", file, path.join(here, "..", scad)], {stdio: "ignore"});
    const text = fs.readFileSync(file, "utf8");
    const v = [];
    for (const m of text.matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)) v.push(+m[1], +m[2], +m[3]);
    let volume = 0;
    for (let i = 0; i < v.length; i += 9) {
        const [ax, ay, az, bx, by, bz, cx, cy, cz] = v.slice(i, i + 9);
        volume += (ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx)) / 6;
    }
    return volume;
}

function assert_close(actual, expected, name) {
    const off = Math.abs(actual - expected) / expected;
    assert(off < 0.01, `${name}: ${actual.toFixed(2)} mm³ against OpenSCAD's ${expected.toFixed(2)}, ${(off * 100).toFixed(2)}% off`);
    console.log(`${name}: ${actual.toFixed(2)} mm³, OpenSCAD ${expected.toFixed(2)}, ${(off * 100).toFixed(2)}% off`);
}

(async () => {
    const js = await fetch_once("manifold.js");
    await fetch_once("manifold.wasm");
    const wasm = await (await import(pathToFileURL(js).href)).default();
    wasm.setup();
    const {cutter_lib} = await import(pathToFileURL(path.join(here, "cutter_mesh.js")).href);
    const lib = cutter_lib(wasm);

    assert_close(lib.link().volume(), openscad_volume("articulated_chain.scad", ["n_links=1"], "link"), "link");
    assert_close(lib.joint_cutter(60, 40).volume(),
        openscad_volume("articulation_cutter.scad", ['part="cutter"', "joints=1"], "cutter"), "cutter");

    const demo = lib.demo(2, 15);
    assert_close(demo.volume(), openscad_volume("articulation_cutter.scad", ["joints=2", "logo_depth=0"], "demo"), "demo bar");
    assert.equal(demo.decompose().length, 3, "the demo bar with 2 joints is 3 pieces");
    console.log("demo bar: 3 pieces");
    console.log("ok");
})().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
