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
H=p['height']; IA=p['in_a']; OA=p['out_a']; OB=p['out_b']; PD=p['pattern_depth']

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

def setup(size=(1800,1800)):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene
    scene.render.engine='CYCLES'; scene.cycles.samples=24 if draft else 64
    scene.cycles.use_denoising=True
    scene.render.resolution_x=size[0]//2 if draft else size[0]
    scene.render.resolution_y=size[1]//2 if draft else size[1]
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
    materials={ 'case':material('Graphite polymer','294745'), 'alt':material('Amber polymer','D8892A'),
                'cut':material('Cut graphite','76938C',.45), 'altcut':material('Cut amber','F4CA7C',.45)}
    return scene,materials

def load(name,mat='case',loc=(0,0,0),planes=()):
    """planes: (axis, value, sign) section planes whose faces get the cut material."""
    bpy.ops.wm.stl_import(filepath=str(cache/'meshes'/f'{name}.stl'))
    obj=bpy.context.object; obj.name=name
    obj.scale=(S,S,S); obj.location=Vector(loc)*S
    obj.data.materials.append(mats[mat])
    if planes:
        obj.data.materials.append(mats['altcut' if mat=='alt' else 'cut'])
        for face in obj.data.polygons:
            for axis,value,sign in planes:
                if abs(face.center[axis]-value)<.001 and face.normal[axis]*sign>.98: face.material_index=1
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(25),keep_sharp_edges=True)
    return obj

def camera(scene,pos,target,scale):
    data=bpy.data.cameras.new('Camera'); cam=bpy.data.objects.new('Camera',data); scene.collection.objects.link(cam)
    cam.location=Vector(pos)*S
    if pos[0]==target[0] and pos[1]==target[1]: cam.rotation_euler=(0,0,0)
    else: aim(cam,Vector(target)*S)
    data.type='ORTHO'; data.ortho_scale=scale*S; data.lens=50; data.clip_start=.001
    scene.camera=cam
def floor(z=0):
    bpy.ops.mesh.primitive_plane_add(size=20,location=(0,0,z*S-.0001))
    bpy.context.object.is_shadow_catcher=True

def foot(anchors,i,loc=(0,0,0),turn=0,half=False):
    """Footprint extremes, from which the layout draws one contact shadow per case."""
    c,s=math.cos(math.radians(turn)),math.sin(math.radians(turn))
    for key,(x,y) in {'l':(-OA-PD,0),'r':(OA+PD,0),'f':(0,0 if half else -OB-PD),'b':(0,OB+PD)}.items():
        anchors[f'shadow{i}{key}']=(loc[0]+x*c-y*s,loc[1]+x*s+y*c,0)

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

Y0=(1,0,-1)  # the vertical y=0 section, seen from the front
spacing=2*(OA+PD)+8
names=['hero','dimensions','fit','cutaway','mouth','floor','relief','patterns','variants','print']
for name in names:
    if only and name!=only: continue
    wide=name in ['patterns','variants']
    scene,mats=setup((3000,1500) if wide else (1800,1800))
    anchors={}
    if name=='hero':
        for i,(pattern,mat,loc,turn) in enumerate([('spiral','case',(-46,18,0),-8),('ribs','alt',(-15,-8,0),4),
                                                   ('diamond','case',(17,16,0),10),('waves','case',(46,-10,0),-4)]):
            load(pattern,mat,loc).rotation_euler.z=math.radians(turn); foot(anchors,i,loc,turn)
        floor()
        camera(scene,(150,-300,170),(2,0,30),150)
    elif name=='dimensions':
        load('ribs'); floor(); foot(anchors,0)
        camera(scene,(0,-220,60),(0,0,H/2),90)
        anchors.update({'bottom':(OA,0,0),'top':(OA,0,H),
                        'left':(-OA-PD,0,p['pattern_low']+PD+.5),'right':(OA+PD,0,p['pattern_low']+PD+.5)})
    elif name=='fit':
        z=34
        load('slab',planes=[(2,z,1)])
        camera(scene,(0,0,z+100),(0,0,z),36)
        lw,ld=p['lighter_width']/2,p['lighter_depth']/2
        anchors={'center':(0,0,z),'cav_r':(IA,0,z),'cav_b':(0,p['in_b'],z),'cav_l':(-IA,0,z),'cav_f':(0,-p['in_b'],z),
                 'lit_r':(lw,0,z),'lit_b':(0,ld,z),'gap':(IA-p['fit_clearance']/2,0,z)}
    elif name=='cutaway':
        load('cut',planes=[Y0]); floor(); foot(anchors,0,half=True)
        camera(scene,(70,-170,120),(0,0,H/2),95)
        anchors.update({'mouth':(IA+.5,0,H-.6),'floor':(p['hole_diameter']/2+3,0,p['floor_thickness']/2),
                        'top':(-OA,0,H),'cavity_bottom':(-IA,0,p['floor_thickness'])})
    elif name=='mouth':
        load('mouth',planes=[Y0])
        cx,cz=(IA+OA)/2,H-2.2
        camera(scene,(cx,-100,cz+25),(cx,0,cz),6.6)
        mc,ec=p['mouth_chamfer'],p['edge_chamfer']
        anchors={'mouth':(IA+mc/2,0,H-mc/2),'edge':(OA-ec/2,0,H-ec/2),
                 'wall_in':(IA,0,H-3.6),'wall_out':(OA,0,H-3.6),'relief':(OA+PD,0,H-3.6)}
    elif name=='floor':
        load('floor',planes=[Y0])
        hr=p['hole_diameter']/2; ft=p['floor_thickness']
        camera(scene,(4,-100,30),(4,0,2.5),23)
        anchors={'hole_l':(-hr,0,ft),'hole_r':(hr,0,ft),'floor_lo':(hr+3.5,0,0),'floor_hi':(hr+3.5,0,ft)}
    elif name=='relief':
        load('relief',planes=[(2,14,1),(0,3,-1)])
        camera(scene,(OA+60,-110,70),(8.5,0,7),27)
        anchors={'peak':(OA+PD,0,14),'band_hi':(OA,0,p['pattern_low']),'base':(OA,0,0)}
    elif name=='patterns':
        for i,pattern in enumerate(p['patterns']):
            x=(i-3)*spacing; load(pattern,'alt' if pattern==p['exterior_pattern'] else 'case',(x,0,0))
            anchors[pattern]=(x,-OB,0); foot(anchors,i,(x,0,0))
        floor()
        camera(scene,(0,-400,150),(0,0,H/2-4),7*spacing+6)
    elif name=='variants':
        pairs=[('ribs','ribs_count'),('spiral','spiral_twist'),('waves','waves_pitch')]
        for k,(default,variant) in enumerate(pairs):
            for j,(mesh,mat) in enumerate([(default,'case'),(variant,'alt')]):
                x=(k-1)*(2*spacing+30)+(j-.5)*spacing
                load(mesh,mat,(x,0,0)); anchors[f'{k}{j}']=(x,-OB,0); foot(anchors,2*k+j,(x,0,0))
        floor()
        camera(scene,(0,-400,150),(0,0,H/2-4),3*(2*spacing+30))
    else:
        for i,pattern in enumerate(p['patterns']):
            row=i//4; loc=((i%4-1.5)*(2*OB+7)+row*(OB+3.5),row*(2*OA+7)-OA,0)
            obj=load(pattern,'alt' if pattern==p['exterior_pattern'] else 'case',loc)
            obj.rotation_euler.z=math.radians(90); foot(anchors,i,loc,90)
        floor()
        camera(scene,(140,-220,260),(0,6,H/2-10),165)
    save(name,anchors)

# All render and annotation files are closed by this point. The rendering
# host can hang in PulseAudio teardown even with -noaudio, so exit the batch
# process directly after flushing its progress log.
sys.stdout.flush()
sys.stderr.flush()
os._exit(0)
