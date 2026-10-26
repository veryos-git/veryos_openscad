// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// node publishing/build.mjs [--only=project_id] [--stage=mesh|render|compose|all]
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync,copyFileSync,createWriteStream} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import catalog from './catalog.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const cache=resolve(root,'.gitignored/publishing'); mkdirSync(cache,{recursive:true});
const stage=process.argv.find(v=>v.startsWith('--stage='))?.split('=')[1]||'all';
const only=process.argv.find(v=>v.startsWith('--only='))?.split('=')[1];
const selected=catalog.filter(p=>!only||p.id===only);
if(!selected.length) throw Error('No project matches --only');
const sha=x=>createHash('sha256').update(x).digest('hex');
const serialize=x=>JSON.stringify(x);
const openscad=process.env.PUBLISH_OPENSCAD||'openscad';
const prefix=openscad.endsWith('.AppImage')?['--appimage-extract-and-run']:[];
const backend=process.env.PUBLISH_BACKEND||'CGAL';
const tools={format:'OFF',backend,openscad:spawnSync(openscad,[...prefix,'--version'],{encoding:'utf8'}).stderr.trim(),blender:spawnSync('blender',['--version'],{encoding:'utf8'}).stdout.split('\n')[0]};
const previous=existsSync(resolve(cache,'config.json'))?JSON.parse(readFileSync(resolve(cache,'config.json'),'utf8')):{};
const config={root,cache,projects:catalog,tools:(stage==='mesh'||stage==='all')?tools:(previous.tools||tools)};
writeFileSync(resolve(cache,'config.json'),JSON.stringify(config,null,2));
const configPath=resolve(cache,'config.json');
for(const p of selected) {
 p.output=resolve(root,'projects',p.folder,'publish/customization');
 for(const dir of [p.output,resolve(p.output,'renders'),resolve(cache,p.id)]) mkdirSync(dir,{recursive:true});
 const parameterSets=Object.fromEntries(p.variants.filter(v=>!Object.values(v.params).some(Array.isArray)).map(v=>[v.name,Object.fromEntries(Object.entries(v.params).map(([k,x])=>[k,typeof x==='string'?x:serialize(x)]))]));
 writeFileSync(resolve(p.output,'presets.json'),JSON.stringify({fileFormatVersion:'1',parameterSets},null,2)+'\n');
 // Structured parameters retain array types; use these to reproduce command-line renders.
 copyFileSync(resolve(root,'publishing/export-variant.mjs'),resolve(p.output,'export-variant.mjs'));
 writeFileSync(resolve(p.output,'variants.json'),JSON.stringify({source:'../../'+p.source,variants:p.variants},null,2)+'\n');
}
const activeChildren=new Set();
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{
 for(const child of activeChildren) child.kill('SIGTERM');
 process.exit(signal==='SIGINT'?130:143);
});
function run(cmd,args,logPath) {
 return new Promise((done,reject)=>{
  const child=spawn(cmd,args,{cwd:root,env:{...process.env,QT_QPA_PLATFORM:'offscreen',OPENSCADPATH:process.env.OPENSCADPATH||'/home/legion5pro/.local/share/OpenSCAD/libraries'}});
  activeChildren.add(child);
  let output=''; const log=createWriteStream(logPath); const record=d=>{output+=d;log.write(d);}; child.stdout.on('data',record);child.stderr.on('data',record);
  child.on('error',reject);child.on('close',code=>{activeChildren.delete(child);log.end();if(code||/ERROR:|WARNING:|EXPORT-WARNING:/.test(output))reject(Error(`${cmd} failed or warned (${code}); ${logPath}`));else done(output);});
 });
}
const failed=[];
if(stage==='mesh'||stage==='all') {
 const jobs=selected.flatMap(p=>p.variants.map((v,i)=>({p,v,i})));
 let next=0;
 await Promise.all(Array.from({length:Number(process.env.PUBLISH_JOBS||4)},async()=>{
  while(next<jobs.length){
   const {p,v,i}=jobs[next++];const stem=resolve(cache,p.id,String(i+1));
   const source=resolve(root,'projects',p.folder,p.source);
   const dependencies=Buffer.alloc(0);
   const sourceBytes=readFileSync(source);
   const hash=sha(Buffer.concat([sourceBytes,dependencies,Buffer.from(serialize(v.params)+tools.openscad+backend+'OFF')]));
   const provenance={source:p.folder+'/'+p.source,source_sha256:sha(sourceBytes),dependencies_sha256:sha(dependencies),params:v.params,tools};
   if(existsSync(stem+'.hash')&&readFileSync(stem+'.hash','utf8')===hash&&existsSync(stem+'.off')){writeFileSync(stem+'.source.json',JSON.stringify(provenance,null,2));console.log('CACHED',p.id,v.name);continue;}
   const args=[...prefix,...(backend==='Manifold'?['--backend=Manifold']:[]),...Object.entries(v.params).flatMap(([k,x])=>['-D',`${k}=${serialize(x)}`]),'-o',stem+'.off',source];
   try{console.log('EXPORT',p.id,v.name);await run(openscad,args,stem+'.log');if(!existsSync(stem+'.off')||statSync(stem+'.off').size<134)throw Error('empty mesh');if(sha(readFileSync(source))!==provenance.source_sha256)throw Error('Source changed during export');writeFileSync(stem+'.source.json',JSON.stringify(provenance,null,2));writeFileSync(stem+'.hash',hash);console.log('EXPORTED',p.id,v.name);}
   catch(e){console.error(String(e));failed.push({project:p.id,variant:v.name,error:String(e)});}
  }
 }));
 writeFileSync(resolve(cache,'failures.json'),JSON.stringify(failed,null,2));
 if(failed.length){console.error(JSON.stringify({ok:false,stage:'mesh',failed}));process.exit(1);}
}
if(stage==='render'||stage==='all') {
 let nextRender=0;
 await Promise.all(Array.from({length:Number(process.env.PUBLISH_RENDER_JOBS||2)},async()=>{
  while(nextRender<selected.length) {
   const p=selected[nextRender++];
   if(p.variants.some((v,i)=>!existsSync(resolve(cache,p.id,`${i+1}.hash`)))){failed.push({project:p.id,error:'Missing verified meshes'});continue;}
   const signature=sha(readFileSync(resolve(root,'publishing/studio.py'))+serialize(p)+p.variants.map((v,i)=>readFileSync(resolve(cache,p.id,`${i+1}.hash`),'utf8')).join(''));
   const stamp=resolve(cache,p.id,'render.hash');
   if(existsSync(stamp)&&readFileSync(stamp,'utf8')===signature&&p.variants.every((v,i)=>existsSync(resolve(p.output,'renders',`${String(i+1).padStart(2,'0')}.png`)))){console.log('CACHED RENDER',p.id);continue;}
   try{console.log('RENDER',p.id);await run('blender',['-b','-noaudio','-t','6','--factory-startup','--python',resolve(root,'publishing/studio.py'),'--',configPath,p.id],resolve(cache,p.id,'blender.log'));writeFileSync(stamp,signature);console.log('RENDERED',p.id);}
   catch(e){console.error(String(e));failed.push({project:p.id,error:String(e)});}
  }
 }));
}
if(stage==='compose'||stage==='all') {
 const result=spawnSync('/usr/bin/python3',[resolve(root,'publishing/compose.py'),configPath,...(only?[only]:[])],{stdio:'inherit'});
 if(result.status)failed.push({error:'Composition failed'});
}
console.log(JSON.stringify({ok:!failed.length,stage,projects:selected.length,failed}));
if(failed.length)process.exitCode=1;
