// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Run from any directory: node publish/source/render.mjs [--draft] [--scene=name]
// [--mesh-only] [--compose-only] [--render-only]. Exports the meshes from the real OpenSCAD
// source, renders them in Blender (studio.py) and lays out the pages (compose.py).
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, '../..');
const root = resolve(project, '../..');
const cache = resolve(root, '.gitignored/fdm_screws_listing');
const output = resolve(project, 'publish');
const source = resolve(project, 'fdm_optimized_screws.scad');
for (const p of [cache, resolve(cache, 'meshes'), resolve(cache, 'renders'), resolve(output, 'images')]) mkdirSync(p, {recursive: true});

// Defaults from the SCAD file, then the tested smallest screw: 5 mm thread,
// 0.25 mm clearance, with a 10 mm head and nut.
const model = readFileSync(source, 'utf8');
const names = ['thread_pitch', 'screw_length', 'screw_head_height', 'tip_chamfer', 'screw_cut', 'nut_height', 'test_width'];
const p = Object.fromEntries(names.map(n => [n, Number(model.match(new RegExp(`^${n}\\s*=\\s*(-?[\\d.]+)`, 'm'))[1])]));
Object.assign(p, {thread_diameter: 5, thread_clearance: 0.25, screw_head_width: 10, nut_width: 10});
p.test_diameters = [3, 4, 5, 6, 7];
p.test_clearances = [0.15, 0.2, 0.25];
p.depth = 0.4 * p.thread_pitch;
p.half_tip = 0.05 * p.thread_pitch;
p.core = p.thread_diameter - 2 * p.depth;
p.nut_thread = p.thread_diameter + 2 * p.thread_clearance;
p.cut = p.screw_cut * p.thread_diameter;
p.axis_z = p.thread_diameter * (0.5 - p.screw_cut);
p.float_gap = (p.screw_head_width - p.thread_diameter) / 2;
p.head_cut = p.screw_head_width / 2 - p.axis_z;
p.length = p.screw_head_height + p.screw_length;
p.nut_z = p.screw_head_height + p.thread_pitch * Math.floor((p.screw_length - p.nut_height) / p.thread_pitch);
p.test_step = p.test_width / Math.cos(Math.PI / 6) + 5;
p.test_row = p.screw_head_height + p.screw_length + 5;
p.layer = 0.4;  // drawn layer height on the orientation page, thicker than real
const config = {root, project, cache, output, params: p};
writeFileSync(resolve(cache, 'config.json'), JSON.stringify(config, null, 2));

const defines = ['thread_diameter', 'thread_clearance', 'screw_head_width', 'nut_width'].map(n => `${n}=${p[n]}`)
    .concat(['part="none"', '$fn=96']);
// Keeps y >= 0, so the cut face is the plane y = 0, seen from -y.
const half = s => `difference() { ${s} translate([-100, -200, -100]) cube([300, 200, 200]); }`;
// A thin slice of the section, so the gap between screw and nut shows through.
const clip = (s, x, z, w, h) => `intersection() { ${half(s)} translate([${x}, -1, ${z}]) cube([${w}, 1.3, ${h}]); }`;
const bands = (s, odd) => `intersection() { ${s} for (z = [${odd ? p.layer : 0}:${2 * p.layer}:40]) translate([-60, -60, z]) cube([120, 120, ${p.layer}]); }`;
const lying_x = 'rotate([0, 0, -90]) screw_lying();';
const sec_screw = 'rotate([0, 90, 0]) screw();';
const sec_nut = `rotate([0, 90, 0]) translate([0, 0, ${p.nut_z}]) nut();`;
const mesh = {
  screw_lying: ['screw_lying();'],
  lying_x: [lying_x],
  nut: ['nut();'],
  asm_screw: ['screw();'],
  asm_nut: [`translate([0, 0, ${p.nut_z}]) nut();`],
  sec_screw: [half(sec_screw)],
  sec_nut: [half(sec_nut)],
  prof_screw: [clip(sec_screw, 18.5, 1.2, 5, 2.4)],
  prof_nut: [clip(sec_nut, 18.5, 1.2, 5, 2.4)],
  side_screw: [sec_screw],
  half_nut: [half('rotate([0, 90, 0]) nut();')],
  up_even: [bands('screw();', false)],
  up_odd: [bands('screw();', true)],
  lie_even: [bands(lying_x, false)],
  lie_odd: [bands(lying_x, true)],
  nocut: [`translate([0, ${-p.length / 2}, ${p.screw_head_width / 2}]) rotate([-90, 0, 0]) screw();`],
  removed: [`translate([0, ${-p.length / 2}, ${p.axis_z}]) intersection() { rotate([-90, 0, 0]) screw();
      translate([${-p.screw_head_width}, -1, ${-p.axis_z - p.screw_head_width}]) cube([${2 * p.screw_head_width}, ${p.length + 2}, ${p.screw_head_width}]); }`],
  ...Object.fromEntries(p.test_diameters.map(d => [`test${d}`, ['testing();', `test_diameters=[${d}]`]])),
};

function run(cmd, args) {
  const result = spawnSync(cmd, args, {stdio: 'inherit', env: {...process.env, QT_QPA_PLATFORM: 'offscreen'}});
  if (result.status !== 0) throw Error(`${cmd} failed (${result.status})`);
}
const flag = f => process.argv.includes(f);
if (!flag('--compose-only') && !flag('--render-only')) {
  for (const [name, [body, define]] of Object.entries(mesh)) {
    const file = resolve(cache, `${name}.scad`);
    writeFileSync(file, `include <${source}>\n${body}\n`);
    console.log(`Exporting ${name}`);
    run(resolve(root, '.gitignored/tools/OpenSCAD-2026.10.25.AppImage'), ['--appimage-extract-and-run', '--backend=Manifold',
      '--export-format', 'binstl', ...defines.concat(define ? [define] : []).flatMap(d => ['-D', d]),
      '-o', resolve(cache, 'meshes', name + '.stl'), file]);
  }
}
if (flag('--mesh-only')) process.exit(0);
if (!flag('--compose-only')) {
  const args = ['-b', '-noaudio', '-t', '12', '--factory-startup', '--python', resolve(here, 'studio.py'), '--', resolve(cache, 'config.json')];
  const scene = process.argv.find(a => a.startsWith('--scene='));
  if (scene) args.push(scene);
  if (flag('--draft')) args.push('--draft');
  run('blender', args);
}
// The system Python has the Cairo and Rsvg bindings compose.py needs.
if (!flag('--render-only')) run('/usr/bin/python3', [resolve(here, 'compose.py'), resolve(cache, 'config.json')]);
console.log(JSON.stringify({ok: true, output}));
