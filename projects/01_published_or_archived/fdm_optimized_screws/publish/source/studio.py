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
D=p['thread_diameter']; R=D/2; P=p['thread_pitch']; DEP=p['depth']; HT=p['half_tip']
RN=R+p['thread_clearance']; HH=p['screw_head_height']; L=p['length']; W=p['screw_head_width']
HC=W/2/math.cos(math.radians(30))  # hex corner radius of head and nut
AZ=p['axis_z']

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
    scene.view_settings.exposure=-.5  # keeps the small amber parts amber, not peach
    scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.85,.88,1,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
    for name,position,power,size in [('Key',(-2,-3,4),500,3),('Fill',(2,-1,2),200,2),('Rim',(0,3,3),600,2)]:
        data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.shape='DISK'; data.size=size
        light=bpy.data.objects.new(name,data); scene.collection.objects.link(light); light.location=position; aim(light,(0,0,.1))
    # Screws amber, nuts graphite; cut faces in lighter tones of the same.
    materials={'nut':material('Graphite polymer','294745'), 'screw':material('Amber polymer','D8892A'),
               'nutcut':material('Cut graphite','76938C',.45), 'screwcut':material('Cut amber','F4CA7C',.45),
               'band':material('Layer band','5E8F86')}
    return scene,materials

def load(name,mat='nut',loc=(0,0,0),planes=()):
    """planes: (axis, value, sign) section planes whose faces get the cut material."""
    bpy.ops.wm.stl_import(filepath=str(cache/'meshes'/f'{name}.stl'))
    obj=bpy.context.object; obj.name=name
    obj.scale=(S,S,S); obj.location=Vector(loc)*S
    obj.data.materials.append(mats[mat])
    if planes:
        obj.data.materials.append(mats[mat+'cut'])
        for face in obj.data.polygons:
            for axis,value,sign in planes:
                if abs(face.center[axis]-value)<.001 and face.normal[axis]*sign>.98: face.material_index=1
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(25),keep_sharp_edges=True)
    return obj

def split_screws(obj):
    """Splits a test row into its parts and gives the long one, the screw, the screw material."""
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
    for part in bpy.context.selected_objects:
        if part.dimensions.y>15*S: part.data.materials[0]=mats['screw']

def camera(scene,pos,target,scale):
    data=bpy.data.cameras.new('Camera'); cam=bpy.data.objects.new('Camera',data); scene.collection.objects.link(cam)
    cam.location=Vector(pos)*S; aim(cam,Vector(target)*S)
    data.type='ORTHO'; data.ortho_scale=scale*S; data.lens=50; data.clip_start=.001
    scene.camera=cam
def floor(z=0):
    bpy.ops.mesh.primitive_plane_add(size=20,location=(0,0,z*S-.0001))
    bpy.context.object.is_shadow_catcher=True

def foot(anchors,i,x0,x1,y0,y1,n=1):
    """Footprint extremes, from which the layout draws contact shadows; a long
    part is split into n pieces along its length, one shadow each."""
    for k in range(n):
        if x1-x0>=y1-y0: a,b,c,e=x0+(x1-x0)*k/n,x0+(x1-x0)*(k+1)/n,y0,y1
        else: a,b,c,e=x0,x1,y0+(y1-y0)*k/n,y0+(y1-y0)*(k+1)/n
        cx,cy=(a+b)/2,(c+e)/2
        for key,pt in {'l':(a,cy),'r':(b,cy),'f':(cx,c),'b':(cx,e)}.items():
            anchors[f'shadow{i}_{k}{key}']=(pt[0],pt[1],0)

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

Y0=(1,0,-1)   # the vertical y = 0 section, seen from -y
FRONT=lambda cx,cz:((cx,-200,cz),(cx,0,cz))
c1=p['head_cut']
names=['hero','section','profile','sizes','layers','nocut','cut','testing','print']
for name in names:
    if only and name!=only: continue
    wide=name in ['section','profile','sizes','nocut','cut']
    scene,mats=setup((3000,1500) if wide else (1800,1800))
    anchors={}
    if name=='hero':
        load('asm_screw','screw',(-16,12,0)); load('asm_nut','nut',(-16,12,0)); foot(anchors,0,-16-HC,-16+HC,7,17)
        load('lying_x','screw',(4,-9,0)); foot(anchors,1,4-L/2,4+L/2,-9-HC,-9+HC,3)
        load('nut','nut',(20,10,0)); foot(anchors,2,20-HC,20+HC,5,15)
        floor()
        camera(scene,(120,-260,150),(2,2,7),64)
    elif name=='section':
        # Screw axis along x, head at x = 0..HH; the nut sits at the tip.
        load('sec_screw','screw',planes=[Y0]); load('sec_nut','nut',planes=[Y0])
        camera(scene,*FRONT(L/2,0),L+3)
        anchors={'A':(21,0,RN+.2)}
    elif name=='profile':
        # Close-up of the upper half: screw crests at x = HH + P/2 + k P.
        load('prof_screw','screw',planes=[Y0]); load('prof_nut','nut',planes=[Y0])
        camera(scene,*FRONT(21,2.4),5)
        rr=R-DEP
        anchors={'ang_v':(22-HT-DEP,0,rr),'ang_f':(22-HT,0,R),'ang_h':(22+HT+DEP,0,rr),
                 'p1':(20,0,R),'p2':(22,0,R),'dep_lo':(22+HT+DEP,0,rr),'dep_hi':(22+HT,0,R),
                 'gap':(20,0,(R+RN)/2),'right':(23.5,0,2.4)}
    elif name=='sizes':
        # Screw side view, and the nut cut in half beside it (grooves at x = 2k - 1).
        nx=L+6
        load('side_screw','screw'); load('half_nut','nut',(nx,0,0),planes=[Y0])
        camera(scene,*FRONT((L+6+p['nut_height'])/2,0),L+6+p['nut_height']+3)
        anchors={'d_top':(L-3,0,R),'d_bot':(L-2,0,-R),'tip':(L,0,0),'cham':(L-p['tip_chamfer']/2,0,R-p['tip_chamfer']/2),
                 'n_top':(nx+3,0,RN),'n_bot':(nx+4,0,-RN),'head':(0,0,-HC),'shank':(HH,0,-HC),'end':(L,0,-HC)}
    elif name=='layers':
        ux,lx,ly=-20,14,10
        load('up_even','nut',(ux,0,0)); load('up_odd','band',(ux,0,0)); foot(anchors,0,ux-HC,ux+HC,-W/2,W/2)
        load('lie_even','nut',(lx,ly,0)); load('lie_odd','band',(lx,ly,0)); foot(anchors,1,lx-L/2,lx+L/2,ly-HC,ly+HC,3)
        floor()
        camera(scene,(110,-250,120),(0,4,9),62)
        anchors.update({'up_weak':(ux,-R,HH+.3),'up_base':(ux,-HC,0),'lie_base':(lx,ly-HC,0),
                        'lie_a':(lx-L/2+HH+1,ly,AZ+R),'lie_b':(lx+L/2-1,ly,AZ+R)})
    elif name in ['nocut','cut']:
        # Side view from +x: head on the left, tip on the right.
        if name=='nocut':
            load('nocut','screw')
            anchors={'gap_hi':(0,4,W/2-R),'gap_lo':(0,4,0)}
        else:
            load('screw_lying','screw'); load('removed','screwcut',(0,0,-2))
            anchors={'thread_cut':(0,4,-2-p['cut']/2),'head_cut':(0,-L/2+HH/2,-2-c1/2)}
        anchors.update({'bed_l':(0,-L/2-3,0),'bed_r':(0,L/2+3,0)})
        camera(scene,(200,0,W/2-2),(0,0,W/2-2),L+8)
    elif name=='testing':
        rows=p['test_diameters']; step=p['test_step']; x0=-1.5*step
        for j,d in enumerate(rows):
            y=(j-(len(rows)-1)/2)*p['test_row']
            split_screws(load(f'test{d}','nut',(0,y,0)))
            anchors[f'row{d}']=(x0-p['test_width']/2/math.cos(math.radians(30))-2,y,0)
            hc=p['test_width']/2/math.cos(math.radians(30))
            foot(anchors,f'{j}s',x0-hc,x0+hc,y-L/2,y+L/2,3)
            for i in range(1,4): foot(anchors,f'{j}n{i}',x0+i*step-hc,x0+i*step+hc,y-p['nut_height']/2,y+p['nut_height']/2)
        floor()
        camera(scene,(100,-220,260),(0,0,0),150)
    else:
        nx=(W+p['nut_width'])/(2*math.cos(math.radians(30)))+5
        # As part = "print_layout" lays them out.
        load('screw_lying','screw'); foot(anchors,0,-HC,HC,-L/2,L/2,3)
        load('nut','nut',(nx,0,0)); foot(anchors,1,nx-HC,nx+HC,-W/2,W/2)
        floor()
        camera(scene,(110,-230,150),(nx/2,0,4),48)
    save(name,anchors)

# All render and annotation files are closed by this point. The rendering
# host can hang in PulseAudio teardown even with -noaudio, so exit the batch
# process directly after flushing its progress log.
sys.stdout.flush()
sys.stderr.flush()
os._exit(0)
