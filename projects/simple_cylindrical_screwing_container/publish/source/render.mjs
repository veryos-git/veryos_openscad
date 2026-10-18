// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Run from any directory: node publish/source/render.mjs
import {readFileSync, writeFileSync, mkdirSync, copyFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, '../..');
const root = resolve(project, '../..');
const cache = resolve(root, '.gitignored/container_listing');
const output = resolve(project, 'publish');
for (const p of [cache, resolve(cache,'meshes'), resolve(cache,'renders'), resolve(output,'images'),resolve(output,'model')]) mkdirSync(p,{recursive:true});
const model = readFileSync(resolve(project,'simple_cylindrical_screwing_container.scad'),'utf8');
const modules = model.slice(0,model.indexOf('if (view == "container") container();'));
const names = ['full_height','outer_diameter','wall_thickness','thread_pitch','neck_height','base_thread_entry_chamfer','base_chamfer','external_thread_top_surface_extrusion','lid_height','lid_thread_height','lid_thread_entry_chamfer','lid_chamfer','radial_clearance','axial_clearance','rim_clearance','quality'];
const p = Object.fromEntries(names.map(n=>[n,Number(model.match(new RegExp(`^${n}\\s*=\\s*([\\d.]+)`, 'm'))[1])]));
p.view = model.match(/^view\s*=\s*"([^"]+)"/m)[1];
for (const name of ['top_chamfer_enabled','bottom_chamfer_enabled']) {
  p[name] = model.match(new RegExp(`^${name}\\s*=\\s*(true|false)`, 'm'))[1] === 'true';
}
p.shoulder = p.full_height-p.lid_height;
p.closed_height = p.full_height+p.external_thread_top_surface_extrusion;
p.base_height = p.shoulder+(p.neck_height || p.lid_height-p.wall_thickness-p.rim_clearance);
p.thread_depth = p.thread_pitch*0.4;
p.neck_radius = p.outer_diameter/2-p.wall_thickness-p.radial_clearance-p.thread_depth;
p.angle = 360*p.external_thread_top_surface_extrusion/p.thread_pitch;
p.actual_headroom = p.closed_height-p.wall_thickness-p.base_height;
const config = {root,project,cache,output,params:p};
writeFileSync(resolve(cache,'config.json'),JSON.stringify(config,null,2));
writeFileSync(resolve(output,'parameters.json'),JSON.stringify(p,null,2)+'\n');

function run(cmd,args) {
  const result=spawnSync(cmd,args,{stdio:'inherit',env:{...process.env,QT_QPA_PLATFORM:'offscreen'}});
  if(result.status!==0) throw Error(`${cmd} failed (${result.status})`);
}
const cut = child=>`difference() { ${child} translate([-outer_r-1,-outer_r-1,-1]) cube([outer_diameter+2,outer_r+1,full_height+20]); }`;
const clip = (child,x,y,z,w,d,h)=>`intersection() { ${child} translate([${x},${y},${z}]) cube([${w},${d},${h}]); }`;
const seated='translate([0,0,alignment_stop_z]) rotate([0,0,alignment_stop_angle]) lid();';
const mesh = {
  base:'container();', lid:'print_lid();', lid_closed:'lid();',
  base_cut:cut('container();'), lid_cut:cut('print_lid();'), lid_closed_cut:cut(seated),
  neck:clip('container();',-21,-21,p.shoulder-5,42,42,(p.base_height-p.shoulder)+6),
  fit_base:clip('container();',p.neck_radius-p.wall_thickness-0.2,0,p.shoulder-0.8,4.7,3,p.lid_thread_height+1.8),
  fit_lid:clip(seated,p.neck_radius-p.wall_thickness-0.2,0,p.shoulder-0.8,4.7,3,p.lid_thread_height+1.8),
  stop_base:clip('container();',p.outer_diameter/2-p.wall_thickness-0.7,0,p.shoulder-1.0,2.1,2.5,2.4),
  stop_lid:clip(seated,p.outer_diameter/2-p.wall_thickness-0.7,0,p.shoulder-1.0,2.1,2.5,2.4)
};
if(!process.argv.includes('--compose-only') && !process.argv.includes('--render-only')) {
  for(const [name,body] of Object.entries(mesh)) {
    const file=resolve(cache,`${name}.scad`);
    writeFileSync(file,modules+'\n'+body+'\n');
    console.log(`Exporting ${name}`);
    run(resolve(root,'.gitignored/tools/OpenSCAD-nightly.AppImage'),['--appimage-extract-and-run','--backend=Manifold','--export-format','binstl','-o',resolve(cache,'meshes',name+'.stl'),file]);
  }
}
writeFileSync(resolve(output,'model','simple_cylindrical_screwing_container.scad'),model);
copyFileSync(resolve(cache,'meshes','base.stl'),resolve(output,'model','container.stl'));
copyFileSync(resolve(cache,'meshes','lid.stl'),resolve(output,'model','lid.stl'));
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
