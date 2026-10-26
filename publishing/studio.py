# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Render source-exported meshes at one orthographic scale per project."""
import bpy, json, math, sys, os
from pathlib import Path
from mathutils import Vector, Euler
args = sys.argv[sys.argv.index('--') + 1:]
cfg = json.loads(Path(args[0]).read_text())
p = next(p for p in cfg['projects'] if p['id'] == args[1])
cache = Path(cfg['cache']) / p['id']
out = Path(cfg['root']) / 'projects' / p['folder'] / 'publish/customization/renders'
out.mkdir(parents=True, exist_ok=True)
W,H = 1200,1000
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
objs=[];source_colors=[]
for i,v in enumerate(p['variants']):
    # OFF preserves indexed topology; STL import can weld distinct contact vertices.
    lines=(cache / f'{i+1}.off').read_text().splitlines()
    nv,nf,_=map(int,lines[1].split())
    vertices=[tuple(map(float,l.split()[:3])) for l in lines[2:2+nv]]
    face_data=[l.split() for l in lines[2+nv:2+nv+nf]]
    faces=[tuple(map(int,f[1:1+int(f[0])])) for f in face_data]
    source_colors.append([tuple(map(float,f[1+int(f[0]):])) for f in face_data])
    mesh=bpy.data.meshes.new(v['name']);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(v['name'],mesh);bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    if p.get('rotation'):
        obj.rotation_euler=Euler([math.radians(a) for a in p['rotation']])
        bpy.ops.object.transform_apply(location=False,rotation=True,scale=False)
    objs.append(obj)
# Normalize all variants with the same factor, never scale them individually.
max_extent=max(max(obj.dimensions) for obj in objs)
unit=2/max_extent
for obj in objs:
    pts=[v.co for v in obj.data.vertices]
    lo=Vector([min(v[a] for v in pts) for a in range(3)])
    hi=Vector([max(v[a] for v in pts) for a in range(3)])
    obj.scale=(unit,)*3
    obj.location=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))*unit
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30),keep_sharp_edges=True)
    obj.hide_render=True
bpy.context.view_layer.update()
direction=Vector(p.get('camera',[1,-1.8,1.3])).normalized()
q=direction.to_track_quat('Z','Y'); inv=q.inverted()
# Use the same camera for each variation, including target and framing.
points=[inv @ (obj.matrix_world @ Vector(corner)) for obj in objs for corner in obj.bound_box]
lo=Vector([min(v[a] for v in points) for a in range(3)])
hi=Vector([max(v[a] for v in points) for a in range(3)])
center=q @ ((lo+hi)/2)
scale=max(hi.x-lo.x,(hi.y-lo.y)*W/H)*1.16
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=12;scene.cycles.adaptive_threshold=.08;scene.cycles.max_bounces=4;scene.cycles.diffuse_bounces=2;scene.cycles.glossy_bounces=2;scene.cycles.use_denoising=True
scene.render.resolution_x=W;scene.render.resolution_y=H;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True
scene.view_settings.exposure=-0.5
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.85,.9,1,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
cam_data=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',cam_data);scene.collection.objects.link(cam)
cam.location=center+direction*10;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
cam_data.type='ORTHO';cam_data.ortho_scale=scale;cam_data.clip_start=.001;scene.camera=cam
for name,pos,power,size in [('Key',(-3,-4,6),650,4),('Fill',(4,-1,3),300,3),('Rim',(0,4,4),700,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    light=bpy.data.objects.new(name,data);scene.collection.objects.link(light);light.location=pos
    light.rotation_euler=(Vector((0,0,.5))-light.location).to_track_quat('-Z','Y').to_euler()
def mat(name,code):
    c=[int(code[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c]
    m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
    bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=.34
    return m
palette=['D8923D','397C7C','BD6A50','718598']
for i,obj in enumerate(objs):
    obj.hide_render=False
    obj.data.materials.clear();obj.data.materials.append(mat('Matte polymer',palette[i]))
    if p.get('family')=='wipes':
        obj.data.materials.append(mat('Cover','E5D6B7'))
        h=p['variants'][i]['params']['box_height']
        for f in obj.data.polygons:
            if f.center.z>=h+.001:f.material_index=1
    scene.render.filepath=str(out/f'{i+1:02d}.png')
    bpy.ops.render.render(write_still=True)
    obj.hide_render=True
    print('FINISHED',p['id'],i+1,flush=True)
metadata={'camera':list(direction),'ortho_scale_model_mm':scale/unit,'same_scale':True,'resolution':[W,H],
          'variants':[{'name':v['name'],'bounds_mm':[list(min(obj.data.vertices,key=lambda v:v.co[a]).co)[a] for a in range(3)]+[list(max(obj.data.vertices,key=lambda v:v.co[a]).co)[a] for a in range(3)],'triangles':len(obj.data.polygons)} for obj,v in zip(objs,p['variants'])]}
(out/'render-info.json').write_text(json.dumps(metadata,indent=2)+'\n')
sys.stdout.flush();sys.stderr.flush();os._exit(0)
