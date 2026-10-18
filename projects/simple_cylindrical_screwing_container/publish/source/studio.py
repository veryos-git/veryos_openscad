# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Blender studio renders of the actual OpenSCAD meshes; no generated geometry."""
import bpy, json, math, os, sys
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

args=sys.argv[sys.argv.index('--')+1:]
cfg=json.loads(Path(args[0]).read_text())
p=cfg['params']; cache=Path(cfg['cache']); draft='--draft' in args
only=next((a.split('=',1)[1] for a in args if a.startswith('--scene=')),None)
S=.01

def linear(v):
    return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def rgba(code):
    return tuple(linear(int(code[i:i+2],16)/255) for i in (0,2,4))+(1,)
def material(name,color,rough=.31):
    m=bpy.data.materials.new(name); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=rgba(color)
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Specular IOR Level'].default_value=.32
    return m
def aim(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

def setup():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene
    scene.render.engine='CYCLES'; scene.cycles.samples=24 if draft else 64
    scene.cycles.use_denoising=True
    scene.render.resolution_x=1000 if draft else 1800
    scene.render.resolution_y=1000 if draft else 1800
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
    scene.render.film_transparent=True
    scene.view_settings.view_transform='AgX'
    scene.view_settings.look='AgX - Medium High Contrast'
    scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.85,.88,1,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
    for name,position,power,size in [('Key',(-2,-3,4),500,3),('Fill',(2,-1,2),200,2),('Rim',(0,3,3),600,2)]:
        data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.shape='DISK'; data.size=size
        light=bpy.data.objects.new(name,data); scene.collection.objects.link(light); light.location=position; aim(light,(0,0,.35))
    materials={ 'base':material('Graphite polymer','294745'), 'lid':material('Amber polymer','E9AD43'),
                'cut':material('Cut graphite','76938C',.45), 'lidcut':material('Cut amber','F4CA7C',.45),
                'accent':material('Highlighted contact','F08535',.35)}
    return scene,materials

def load(name,mat,loc=(0,0,0),section=False,highlight=False):
    bpy.ops.wm.stl_import(filepath=str(cache/'meshes'/f'{name}.stl'))
    obj=bpy.context.object; obj.name=name
    obj.scale=(S,S,S); obj.location=Vector(loc)*S
    obj.data.materials.append(mat)
    if section:
        obj.data.materials.append(mats['lidcut'] if 'lid' in name else mats['cut'])
        for face in obj.data.polygons:
            if face.normal.y < -.98: face.material_index=1
    if highlight:
        idx=len(obj.data.materials); obj.data.materials.append(mats['accent'])
        for face in obj.data.polygons:
            if p['shoulder']-0.001<=face.center.z<=p['shoulder']+p['external_thread_top_surface_extrusion']+.001:
                face.material_index=idx
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(25),keep_sharp_edges=True)
    return obj

def camera(scene,pos,target,scale):
    data=bpy.data.cameras.new('Camera'); cam=bpy.data.objects.new('Camera',data); scene.collection.objects.link(cam)
    cam.location=Vector(pos)*S; aim(cam,Vector(target)*S)
    data.type='ORTHO'; data.ortho_scale=scale*S; data.lens=50; data.clip_start=.001
    scene.camera=cam
def floor(z=0):
    bpy.ops.mesh.primitive_plane_add(size=20,location=(0,0,z*S-.0001))
    bpy.context.object.is_shadow_catcher=True

def save(name,anchors):
    scene.render.filepath=str(cache/'renders'/f'{name}.png')
    bpy.context.view_layer.update()
    projected={}
    for key,point in anchors.items():
        q=world_to_camera_view(scene,scene.camera,Vector(point)*S)
        projected[key]=[q.x*scene.render.resolution_x,(1-q.y)*scene.render.resolution_y]
    (cache/'renders'/f'{name}.json').write_text(json.dumps(projected))
    bpy.ops.render.render(write_still=True)
    print('FINISHED_SCENE',name,flush=True)

names=['hero','dimensions','neck','lid','fit','alignment','section','print']
for name in names:
    if only and name!=only: continue
    scene,mats=setup()
    if name=='hero':
        load('base',mats['base'],(-20,0,0)); load('lid',mats['lid'],(35,-8,0)); floor()
        camera(scene,(150,-260,175),(5,0,33),115)
        anchors={}
    elif name=='dimensions':
        load('base',mats['base']); cap=load('lid_closed',mats['lid'],(0,0,p['shoulder']+p['external_thread_top_surface_extrusion']))
        cap.rotation_euler.z=math.radians(p['angle']); floor()
        camera(scene,(0,-220,65),(0,0,40),100)
        anchors={'bottom':(20,0,0),'top':(20,0,p['closed_height']),'left':(-20,0,0),'right':(20,0,0),'seam':(20,0,p['shoulder']+.2)}
    elif name=='neck':
        load('neck',mats['base'])
        camera(scene,(90,-150,135),(0,0,p['shoulder']+3),55)
        anchors={'neck_bottom':(-20,0,p['shoulder']),'neck_top':(-20,0,p['base_height']),
                 'thread_bottom':(20,0,p['shoulder']),'thread_top':(20,0,p['shoulder']+p['lid_thread_height']),
                 'entry':(p['neck_radius']-.4,-4,p['base_height']-.5),
                 'shoulder':(19.5,-3,p['shoulder']),'thread':(p['neck_radius']+.6,-2,p['shoulder']+2)}
    elif name=='lid':
        load('lid_cut',mats['lid'],section=True)
        camera(scene,(60,-130,90),(0,0,10),53)
        anchors={'bottom':(-20,0,0),'top':(-20,0,20),'band_bottom':(20,0,p['lid_height']-p['lid_thread_height']),
                 'band_top':(20,0,p['lid_height']), 'entry':(18.3,0,19.6),
                 'roof':(0,0,.6),'wall':(19.4,0,10),'edge':(-19.6,0,.2)}
    elif name=='fit':
        load('fit_base',mats['base'],section=True); load('fit_lid',mats['lid'],section=True)
        camera(scene,(25,-60,p['shoulder']+22),(18.25,0,p['shoulder']+2.5),9)
        anchors={'pitch_lo':(p['neck_radius']+p['thread_depth'],0,p['shoulder']+p['thread_pitch']),
                 'pitch_hi':(p['neck_radius']+p['thread_depth'],0,p['shoulder']+2*p['thread_pitch']),
                 'radial_a':(p['neck_radius']+p['thread_depth'],0,p['shoulder']+p['thread_pitch']),
                 'radial_b':(20-p['wall_thickness'],0,p['shoulder']+p['thread_pitch']),
                 'axial':(18.3,0,p['shoulder']+1.5)}
    elif name=='alignment':
        load('stop_base',mats['base'],section=True,highlight=True); load('stop_lid',mats['lid'],section=True)
        camera(scene,(23,-40,p['shoulder']+20),(19,0,p['shoulder']+.3),4.3)
        anchors={'lower':(19.5,0,p['shoulder']),'upper':(19.5,0,p['shoulder']+p['external_thread_top_surface_extrusion']),
                 'stop':(19.0,0,p['shoulder']+.1)}
    elif name=='section':
        load('base_cut',mats['base'],section=True); load('lid_closed_cut',mats['lid'],section=True); floor()
        camera(scene,(45,-200,100),(0,0,40),100)
        anchors={'wall':(-19.4,0,25),'floor':(0,0,.6),'roof':(0,0,p['closed_height']-.6),
                 'headroom':(0,0,p['base_height']+p['actual_headroom']/2),
                 'base_edge':(-19.6,0,.25),'lid_edge':(19.7,0,p['closed_height']-.25),
                 'rim':(-17.4,0,p['base_height']-.5)}
    else:
        load('base',mats['base'],(-25,0,0)); load('lid',mats['lid'],(30,0,0)); floor()
        camera(scene,(110,-180,220),(0,0,28),115)
        anchors={'base':(-25,0,70),'lid':(30,0,20),'floor':(-25,0,0)}
    save(name,anchors)

# All render and annotation files are closed by this point. The rendering
# host can hang in PulseAudio teardown even with -noaudio, so exit the batch
# process directly after flushing its progress log.
sys.stdout.flush()
sys.stderr.flush()
os._exit(0)
