# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Photographic studio lighting on the exact OpenSCAD-exported geometry."""
import bpy, json, math, os, sys
from pathlib import Path
from mathutils import Vector

args = sys.argv[sys.argv.index('--')+1:]
cfg = json.loads(Path(args[0]).read_text())
CACHE, OUT = Path(cfg['cache']), Path(cfg['output'])
only = next((a.split('=')[1].split(',') for a in args if a.startswith('--scene=')), None)
draft = '--draft' in args
S = .01

def color(code):
    rgb = [int(code[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb) + (1,)

def material(name, code):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    bs = mat.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = color(code)
    bs.inputs['Roughness'].default_value = .34
    return mat

def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

def setup():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 16 if draft else 48
    scene.cycles.use_denoising = True; scene.cycles.max_bounces = 6
    scene.render.resolution_x = 900 if draft else 1800
    scene.render.resolution_y = 750 if draft else 1500
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.compression = 100
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = -.25
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.85,.9,1,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .45
    for name, location, power, size in [('Key',(-3,-4,6),800,4),('Fill',(4,-2,3),450,3),('Rim',(0,4,5),950,3)]:
        data = bpy.data.lights.new(name,'AREA'); data.energy=power; data.shape='DISK'; data.size=size
        obj = bpy.data.objects.new(name,data); scene.collection.objects.link(obj)
        obj.location = location; aim(obj,(0,0,.5))
    mats = {'frame':material('Graphite polymer','344948'), 'covers':material('Ivory polymer','E4D9BE'),
            'screws':material('Amber polymer','D78A29'), 'panel':material('Ivory polymer','E4D9BE')}
    return scene, mats

def load(name, mat, offset=(0,0,0), flip=False):
    lines = (CACHE / 'meshes' / (name+'.off')).read_text().splitlines()
    nv,nf,_ = map(int,lines[1].split())
    verts = [tuple(map(float,l.split()[:3])) for l in lines[2:2+nv]]
    faces = [tuple(map(int,l.split()[1:4])) for l in lines[2+nv:2+nv+nf]]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    obj.scale=(S,)*3; obj.location=Vector(offset)*S
    if flip: obj.rotation_euler.y=math.pi
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active=obj; obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(28),keep_sharp_edges=True)
    obj.select_set(False)
    return obj

def camera(scene, target, direction, scale):
    target=Vector(target)*S
    data=bpy.data.cameras.new('Camera'); obj=bpy.data.objects.new('Camera',data)
    scene.collection.objects.link(obj); obj.location=target+Vector(direction).normalized()*10
    aim(obj,target); data.type='ORTHO'; data.ortho_scale=scale*S; data.clip_start=.001
    scene.camera=obj

records=[]
for v in cfg['variants'] + [dict(id='print_layout', params={})]:
    name=v['id']
    if only and name not in only: continue
    scene,mats=setup()
    p=cfg['defaults'] | v['params']
    depth=p['softbox_depth']
    if name=='print_layout':
        for group in ['frame','covers','screws']: load('print_'+group,mats[group])
        direction=(.35,-1,2.5)
        bpy.context.view_layer.update()
        q=Vector(direction).to_track_quat('Z','Y'); inv=q.inverted()
        points=[inv @ (obj.matrix_world @ Vector(corner)) for obj in scene.objects
                if obj.type=='MESH' for corner in obj.bound_box]
        lo=Vector([min(p[a] for p in points) for a in range(3)])
        hi=Vector([max(p[a] for p in points) for a in range(3)])
        target=tuple(q @ ((lo+hi)/2) / S)
        scale=max(hi.x-lo.x,(hi.y-lo.y)*1.2)/S*1.12
    elif v.get('cover_only'):
        load(name+'_panel',mats['panel'],flip=True)
        direction=(0,-.12,1); target=(0,-29,-1); scale=200
    else:
        for group in ['frame','covers','screws']: load(name+'_'+group,mats[group],offset=(0,0,depth))
        direction=(1.05,-1.7,1.05); target=(0,0,62); scale=310
    camera(scene,target,direction,scale)
    scene.render.filepath=str(OUT/'renders'/(name+'.png'))
    bpy.ops.render.render(write_still=True)
    records.append(dict(id=name, camera_direction=direction, camera_target_mm=target,
        orthographic_width_mm=scale, resolution=[scene.render.resolution_x,scene.render.resolution_y]))
    print('FINISHED',name,flush=True)
existing=OUT/'renders/render-info.json'
old=json.loads(existing.read_text()) if only and existing.exists() else []
records=[r for r in old if r['id'] not in only]+records if only else records
existing.write_text(json.dumps(records,indent=2)+'\n')
sys.stdout.flush(); sys.stderr.flush(); os._exit(0)
