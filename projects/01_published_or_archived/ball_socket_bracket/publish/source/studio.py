# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Studio renders of the OpenSCAD-exported parts, run inside Blender."""
import bpy, bmesh, json, math, os, sys
from pathlib import Path
from mathutils import Vector

cfg = json.loads(Path(sys.argv[sys.argv.index('--')+1]).read_text())
MESHES, OUT = Path(cfg['cache'])/'meshes', Path(cfg['output'])/'renders'
draft = '--draft' in sys.argv
S = .025
COLORS = {'socket':'344948', 'ball':'E4D9BE', 'screw':'D78A29'}

def linear(code, lighten=0):
    rgb = [int(code[i:i+2],16)/255 for i in (0,2,4)]
    rgb = [v+(1-v)*lighten for v in rgb]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb) + (1,)

def material(name, code, lighten=0):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    bs = mat.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = linear(code, lighten)
    bs.inputs['Roughness'].default_value = .38
    return mat

def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 16 if draft else 64
    scene.cycles.use_denoising = True; scene.cycles.max_bounces = 6
    scene.render.resolution_x = 900 if draft else 1800
    scene.render.resolution_y = 750 if draft else 1500
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = -.25
    scene.world = bpy.data.worlds.new('World'); scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.85,.9,1,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .45
    for name, location, power, size in [('Key',(-3,-4,6),800,4),('Fill',(4,-2,3),450,3),('Rim',(0,4,5),950,3)]:
        data = bpy.data.lights.new(name,'AREA'); data.energy=power; data.shape='DISK'; data.size=size
        obj = bpy.data.objects.new(name,data); scene.collection.objects.link(obj)
        obj.location = location; aim(obj,(0,0,.5))
    return scene

def read_off(path):
    words = [l.split('#')[0].split() for l in path.read_text().splitlines()]
    words = [w for w in words if w][1:]
    nv, nf = int(words[0][0]), int(words[0][1])
    verts = [tuple(map(float, w[:3])) for w in words[1:1+nv]]
    faces = [tuple(map(int, w[1:1+int(w[0])])) for w in words[1+nv:1+nv+nf]]
    return verts, faces

def load(name, color, cut=None):
    """One mesh in one color. Faces lying in the cut plane get a lighter
    shade so the section reads. cut = (axis, value in mm)."""
    verts, faces = read_off(MESHES/(name+'.off'))
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts, [], faces); mesh.update()
    obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj)
    obj.scale = (S,)*3
    mesh.materials.append(material(name, COLORS[color]))
    if cut:
        mesh.materials.append(material(name+' cut', COLORS[color], .45))
        axis, value = cut
        for poly in mesh.polygons:
            if all(abs(mesh.vertices[i].co[axis]-value) < 1e-3 for i in poly.vertices):
                poly.material_index = 1
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(28), keep_sharp_edges=True)
    obj.select_set(False)
    return obj

def split_plate(name):
    """The 3mf is one mesh with three loose parts. Colour them by size:
    the tallest is the ball part, the larger of the others the socket."""
    verts, faces = read_off(MESHES/(name+'.off'))
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts, [], faces); mesh.update()
    obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    def volume(o):
        bm = bmesh.new(); bm.from_mesh(o.data); v = bm.calc_volume(); bm.free(); return v
    parts.sort(key=volume, reverse=True)
    main = parts[:3]
    ball = max(main, key=lambda o: max(v.co.z for v in o.data.vertices))
    rest = sorted([o for o in main if o is not ball], key=volume, reverse=True)
    for o, color in [(ball,'ball'), (rest[0],'socket'), (rest[1],'screw')] + [(o,'socket') for o in parts[3:]]:
        o.data.materials.clear(); o.data.materials.append(material(o.name, COLORS[color]))
        o.scale = (S,)*3
        bpy.context.view_layer.objects.active = o; o.select_set(True)
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(28), keep_sharp_edges=True)
        o.select_set(False)

def bounds(scene, direction):
    """The meshes' centre and the orthographic width that fits them."""
    bpy.context.view_layer.update()
    q = Vector(direction).to_track_quat('Z','Y'); inv = q.inverted()
    points = [inv @ (o.matrix_world @ Vector(c)) for o in scene.objects if o.type=='MESH' for c in o.bound_box]
    lo = Vector([min(p[a] for p in points) for a in range(3)])
    hi = Vector([max(p[a] for p in points) for a in range(3)])
    aspect = scene.render.resolution_x/scene.render.resolution_y
    return q @ ((lo+hi)/2), max(hi.x-lo.x, (hi.y-lo.y)*aspect)*1.12/S

def camera(scene, direction, target, scale_mm):
    data = bpy.data.cameras.new('Camera'); cam = bpy.data.objects.new('Camera', data)
    scene.collection.objects.link(cam); cam.location = target+Vector(direction).normalized()*20
    aim(cam, target); data.type='ORTHO'; data.ortho_scale=scale_mm*S; data.clip_end=100
    scene.camera = cam

def assembly(scene_id, cut=None):
    for piece in ['socket','ball','screw']:
        mesh = scene_id+'_'+piece
        if not (MESHES/(mesh+'.off')).exists(): mesh = 'medium_'+piece
        load(mesh, piece, cut)

ASSEMBLY = (.75,-1,.8)
DIRECTIONS = {'plate':(.3,-1,2.2), 'section':(.2,-1,.25), 'screwcut':(1,-.55,.35)}
SIZES = ('small','medium','large')
# The three sizes share the large one's scale.
scene = setup(); assembly('large'); size_scale = bounds(scene, ASSEMBLY)[1]
records = []
for scene_id in cfg['scenes']:
    scene = setup()
    if scene_id == 'plate': split_plate('plate')
    else: assembly(scene_id, cfg['cuts'].get(scene_id))
    direction = DIRECTIONS.get(scene_id, ASSEMBLY)
    target, scale = bounds(scene, direction)
    if scene_id in SIZES: scale = size_scale
    camera(scene, direction, target, scale)
    scene.render.filepath = str(OUT/(scene_id+'.png'))
    bpy.ops.render.render(write_still=True)
    records.append(dict(id=scene_id, camera_direction=direction, orthographic_width_mm=round(scale, 2),
                        resolution=[scene.render.resolution_x, scene.render.resolution_y]))
    print('FINISHED', scene_id, flush=True)
(OUT/'render-info.json').write_text(json.dumps(records, indent=2)+'\n')
sys.stdout.flush(); sys.stderr.flush(); os._exit(0)
