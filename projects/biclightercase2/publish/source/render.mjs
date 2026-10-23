// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Run from any directory: node publish/source/render.mjs
import {readFileSync, writeFileSync, mkdirSync, copyFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, '../..');
const root = resolve(project, '../..');
const cache = resolve(root, '.gitignored/bic_case_listing');
const output = resolve(project, 'publish');
for (const p of [cache, resolve(cache,'meshes'), resolve(cache,'renders'), resolve(output,'images'),resolve(output,'model')]) mkdirSync(p,{recursive:true});
const model = readFileSync(resolve(project,'bic_lighter_case.scad'),'utf8');
const modules = model.slice(0,model.indexOf('if (part == "all_patterns")'));
const names = ['lighter_width','lighter_depth','fit_clearance','wall','floor_thickness','height','pattern_depth','pattern_count','pattern_margin','pattern_pitch','pattern_twist','edge_chamfer','mouth_chamfer','hole_diameter','$fn'];
const p = Object.fromEntries(names.map(n=>[n.replace('$',''),Number(model.match(new RegExp(`^${n.replace('$','\\$')}\\s*=\\s*(-?[\\d.]+)`, 'm'))[1])]));
p.exterior_pattern = model.match(/^exterior_pattern\s*=\s*"([^"]+)"/m)[1];
p.patterns = ['none','ribs','flutes','spiral','diamond','waves','chevron'];
p.in_a = p.lighter_width/2+p.fit_clearance;
p.in_b = p.lighter_depth/2+p.fit_clearance;
p.out_a = p.in_a+p.wall;
p.out_b = p.in_b+p.wall;
p.cavity_width = 2*p.in_a;
p.cavity_depth = 2*p.in_b;
p.cavity_height = p.height-p.floor_thickness;
p.outer_width = 2*p.out_a;
p.outer_depth = 2*p.out_b;
p.relief_width = 2*(p.out_a+p.pattern_depth);
p.relief_depth = 2*(p.out_b+p.pattern_depth);
p.pattern_low = Math.max(p.pattern_margin,p.edge_chamfer);
// Ramanujan's ellipse perimeter; the SCAD file uses an arc-length table.
const [a,b] = [p.out_a,p.out_b];
p.perimeter = Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)));
p.pattern_spacing = p.perimeter/p.pattern_count;
// Pattern variations shown beside the defaults on the tuning page.
p.variant_count = 12; p.variant_twist = -180; p.variant_pitch = 20;
const config = {root,project,cache,output,params:p};
writeFileSync(resolve(cache,'config.json'),JSON.stringify(config,null,2));
writeFileSync(resolve(output,'parameters.json'),JSON.stringify(p,null,2)+'\n');

function run(cmd,args) {
  const result=spawnSync(cmd,args,{stdio:'inherit',env:{...process.env,QT_QPA_PLATFORM:'offscreen'}});
  if(result.status!==0) throw Error(`${cmd} failed (${result.status})`);
}
const clip = (x,y,z,w,d,h)=>`intersection() { lighter_case(); translate([${x},${y},${z}]) cube([${w},${d},${h}]); }`;
const outer = p.out_a+p.pattern_depth;
const mesh = {
  ...Object.fromEntries(p.patterns.map(n=>[n,[`lighter_case("${n}");`]])),
  cut:[`difference() { lighter_case(); translate([-50,-50,-1]) cube([100,50,height+2]); }`],
  mouth:[clip(p.in_a-2.2,0,p.height-4.5,outer-p.in_a+3.4,3,5)],
  floor:[clip(-p.hole_diameter/2-1.6,0,-1,outer+p.hole_diameter/2+2.6,3,6.5)],
  slab:[clip(-50,-50,30,100,100,4)],
  relief:[clip(3,-50,-1,50,100,15)],
  ribs_count:['lighter_case("ribs");',`pattern_count=${p.variant_count}`],
  spiral_twist:['lighter_case("spiral");',`pattern_twist=${p.variant_twist}`],
  waves_pitch:['lighter_case("waves");',`pattern_pitch=${p.variant_pitch}`]
};
if(!process.argv.includes('--compose-only') && !process.argv.includes('--render-only')) {
  for(const [name,[body,define]] of Object.entries(mesh)) {
    const file=resolve(cache,`${name}.scad`);
    writeFileSync(file,modules+'\n'+body+'\n');
    console.log(`Exporting ${name}`);
    run(resolve(root,'.gitignored/tools/OpenSCAD-nightly.AppImage'),['--appimage-extract-and-run','--backend=Manifold','--export-format','binstl',
      ...(define?['-D',define]:[]),'-o',resolve(cache,'meshes',name+'.stl'),file]);
  }
}
writeFileSync(resolve(output,'model','bic_lighter_case.scad'),model);
for (const n of p.patterns) copyFileSync(resolve(cache,'meshes',n+'.stl'),resolve(output,'model',`bic_lighter_case_${n}.stl`));
copyFileSync(resolve(root,'LICENSE'),resolve(output,'model','LICENSE'));
if(process.argv.includes('--prepare-only')) process.exit(0);
if(!process.argv.includes('--compose-only')) {
  const args=['-b','-noaudio','-t','8','--factory-startup','--python',resolve(here,'studio.py'),'--',resolve(cache,'config.json')];
  const scene=process.argv.find(a=>a.startsWith('--scene='));
  if(scene) args.push(scene);
  if(process.argv.includes('--draft')) args.push('--draft');
  run('blender',args);
}
if(!process.argv.includes('--render-only')) run('python3',[resolve(here,'compose.py'),resolve(cache,'config.json')]);
console.log(JSON.stringify({ok:true,output,params:p}));
