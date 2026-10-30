// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Run this copy from a project's publish/customization directory (or use its full path).
// node export-variant.mjs "Preset name" output.stl [--view=print] [--part=print_layout]
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(readFileSync(resolve(here,'variants.json'),'utf8'));
const [name,output,...options]=process.argv.slice(2);
const variant=data.variants.find(v=>v.name===name);
if(!variant||!output){console.error('Usage: node export-variant.mjs "Preset name" output.stl [--view=print] [--part=print_layout]');console.error('Presets: '+data.variants.map(v=>v.name).join(', '));process.exit(1);}
const params={...variant.params};
for(const option of options){const match=/^--(view|part)=(.+)$/.exec(option);if(!match)throw Error('Unknown option: '+option);params[match[1]]=match[2];}
const executable=process.env.PUBLISH_OPENSCAD||'openscad';
const args=[...(executable.endsWith('.AppImage')?['--appimage-extract-and-run']:[]),...(process.env.PUBLISH_BACKEND==='Manifold'?['--backend=Manifold']:[]),...Object.entries(params).flatMap(([k,v])=>['-D',`${k}=${JSON.stringify(v)}`]),'-o',resolve(output),resolve(here,data.source)];
console.log('Exporting '+variant.name+' to '+resolve(output));
const result=spawnSync(executable,args,{stdio:'inherit',env:{...process.env,QT_QPA_PLATFORM:process.env.QT_QPA_PLATFORM||'offscreen'}});
console.log(JSON.stringify({ok:result.status===0,preset:variant.name,output:resolve(output),params}));
process.exit(result.status??1);
