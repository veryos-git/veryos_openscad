# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Studio renders of the OpenSCAD-exported pieces, run inside Blender."""
import bpy, json, math, os, sys, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from mathutils import Euler, Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view

cfg = json.loads(Path(sys.argv[sys.argv.index('--')+1]).read_text())
MESHES, OUT = Path(cfg['cache'])/'meshes', Path(cfg['output'])/'renders'
draft = '--draft' in sys.argv
only = next((a.split('=')[1] for a in sys.argv if a.startswith('--scene=')), None)
S = .004
# Illustrative colours, (colour, roughness, metallic): the printed parts in
# the brand's colours, the kit's parts in metal and board green. Engraving
# floors and cut faces get a second colour, so logos and sections read.
COLORS = {'base': ('344948', .42, 0), 'platform': ('E7A43A', .42, 0), 'hoop': ('E7A43A', .42, 0),
          'worm': ('E4D9BE', .42, 0), 'screws': ('E4D9BE', .42, 0), 'bracket': ('B77B1E', .42, 0),
          'motor_bracket': ('B77B1E', .42, 0), 'cap': ('B77B1E', .42, 0), 'motor': ('C9CDD1', .3, .8),
          'board': ('2F6B4F', .5, 0), 'battery': ('9FAAB5', .4, 0)}
ENGRAVE = {'base': 'F0B750', 'platform': 'F4EFE3', 'bracket': 'F4EFE3', 'motor_bracket': 'F4EFE3'}
NS = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}

def linear(code, lighten=0):
    rgb = [int(code[i:i+2], 16)/255 for i in (0, 2, 4)]
    rgb = [v+(1-v)*lighten for v in rgb]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb) + (1,)

def material(name, code, roughness=.42, metallic=0, lighten=0):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    bs = mat.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = linear(code, lighten)
    bs.inputs['Roughness'].default_value = roughness
    bs.inputs['Metallic'].default_value = metallic
    return mat

def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z', 'Y').to_euler()

def setup(yaw):
    """Three lights, placed for a camera in front (-y) and turned by yaw with it."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 16 if draft else 128
    scene.cycles.use_denoising = True; scene.cycles.max_bounces = 6
    scene.render.resolution_x = 900 if draft else 1800
    scene.render.resolution_y = 750 if draft else 1500
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    # Standard keeps the brand's gold on the brightly lit platform; AgX fades it.
    scene.view_settings.view_transform = 'Standard'; scene.view_settings.exposure = -1.2
    scene.world = bpy.data.worlds.new('World'); scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.85, .9, 1, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .45
    turn = Matrix.Rotation(yaw, 3, 'Z')
    for name, location, power, size in [('Key', (3, -4, 6), 600, 4), ('Fill', (-4, -2, 3), 650, 3), ('Rim', (0, 4, 5), 450, 3)]:
        data = bpy.data.lights.new(name, 'AREA'); data.energy = power; data.shape = 'DISK'; data.size = size
        obj = bpy.data.objects.new(name, data); scene.collection.objects.link(obj)
        obj.location = turn @ Vector(location); aim(obj, (0, 0, .03))
    return scene

def front_light(scene, rot):
    """A light beside the camera, for a section, whose inside the others do not reach."""
    data = bpy.data.lights.new('Front', 'AREA'); data.energy = 250; data.shape = 'DISK'; data.size = 3
    obj = bpy.data.objects.new('Front', data); scene.collection.objects.link(obj)
    obj.location = rot @ Vector((0, 1.5, 6)); aim(obj, (0, 0, .03))

def read_3mf(path):
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read('3D/3dmodel.model'))
    verts, tris = [], []
    for obj in root.iterfind('.//m:object', NS):
        offset = len(verts)
        verts += [(float(v.get('x')), float(v.get('y')), float(v.get('z'))) for v in obj.iterfind('.//m:vertex', NS)]
        tris += [(offset+int(t.get('v1')), offset+int(t.get('v2')), offset+int(t.get('v3'))) for t in obj.iterfind('.//m:triangle', NS)]
    return verts, tris

def paint(mesh, mat, on):
    """Gives the faces whose corners all satisfy on(x, y, z) the material mat."""
    mesh.materials.append(mat)
    for poly in mesh.polygons:
        if all(on(*mesh.vertices[i].co) for i in poly.vertices):
            poly.material_index = len(mesh.materials)-1

def load(name, piece, engrave):
    """One mesh in its piece's colour. Pieces placed as in the assembly get
    their logo's floor in the engraving colour, cut pieces a lighter cut face."""
    part = piece.replace('lay_', '').replace('cut_', '')
    verts, tris = read_3mf(MESHES/(name+'.3mf'))
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts, [], tris); mesh.update()
    obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj)
    obj.scale = (S,)*3
    mesh.materials.append(material(name, *COLORS[part]))
    floor = engrave.get(part)
    if floor and not piece.startswith('lay_'):
        on = (lambda x, y, z: abs(z-floor['z']) < 2e-3) if 'z' in floor else (lambda x, y, z: abs(math.hypot(x, y)-floor['r']) < 2e-3)
        paint(mesh, material(name+' engraving', ENGRAVE[part]), on)
    if piece.startswith('cut_'):
        paint(mesh, material(name+' cut', *COLORS[part], lighten=.2), lambda x, y, z: abs(x) < 2e-3)
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(28), keep_sharp_edges=True)
    obj.select_set(False)

def rotation(entry):
    if 'euler' in entry: return Euler([math.radians(a) for a in entry['euler']]).to_quaternion()
    return (-Vector(entry['direction'])).to_track_quat('-Z', 'Y')

def yaw(entry):
    """How far the camera stands turned from the front, around z."""
    if 'euler' in entry: return math.radians(entry['euler'][2])
    return math.atan2(entry['direction'][1], entry['direction'][0])+math.pi/2

def bounds(scene, rot):
    """The meshes' centre and the orthographic width that fits them, seen
    through a camera turned by rot."""
    bpy.context.view_layer.update()
    inv = rot.inverted()
    points = [inv @ (o.matrix_world @ Vector(c)) for o in scene.objects if o.type == 'MESH' for c in o.bound_box]
    lo = Vector([min(p[a] for p in points) for a in range(3)])
    hi = Vector([max(p[a] for p in points) for a in range(3)])
    aspect = scene.render.resolution_x/scene.render.resolution_y
    return rot @ ((lo+hi)/2), max(hi.x-lo.x, (hi.y-lo.y)*aspect)*1.08/S

def camera(scene, rot, target, scale_mm):
    data = bpy.data.cameras.new('Camera'); cam = bpy.data.objects.new('Camera', data)
    scene.collection.objects.link(cam)
    cam.location = target + rot @ Vector((0, 0, 20))
    cam.rotation_mode = 'QUATERNION'; cam.rotation_quaternion = rot
    data.type = 'ORTHO'; data.ortho_scale = scale_mm*S; data.clip_end = 100
    scene.camera = cam
    return cam

def build(entry):
    scene = setup(yaw(entry))
    for piece, name in entry['pieces'].items(): load(name, piece, entry['engrave'])
    if entry.get('front_light'): front_light(scene, rotation(entry))
    return scene

entries = {s['id']: s for s in cfg['scenes']}
# Scenes in one group share one scale: the scale that fits the largest.
shared = {}
for group in {s['group'] for s in cfg['scenes'] if 'group' in s}:
    ids = [s['id'] for s in cfg['scenes'] if s.get('group') == group]
    scale = max(bounds(build(entries[i]), rotation(entries[i]))[1] for i in ids)
    shared.update({i: scale for i in ids})
info = OUT/'render-info.json'
records = {r['id']: r for r in json.loads(info.read_text())} if only and info.exists() else {}
for entry in cfg['scenes']:
    if only and entry['id'] != only: continue
    scene = build(entry)
    rot = rotation(entry)
    target, scale = bounds(scene, rot)
    scale = shared.get(entry['id'], scale)
    cam = camera(scene, rot, target, scale)
    bpy.context.view_layer.update()
    w, h = scene.render.resolution_x, scene.render.resolution_y
    points = dict(entry['marks'])
    # A circle around the axis is widest along the camera's right.
    right = rot @ Vector((1, 0, 0))
    for key, (r, z) in entry['circles'].items():
        points[key+'_l'] = Vector((0, 0, z))-r*right
        points[key+'_r'] = Vector((0, 0, z))+r*right
    marks = {}
    for key, p in points.items():
        u = world_to_camera_view(scene, cam, Vector(p)*S)
        marks[key] = [round(u.x*w, 2), round((1-u.y)*h, 2)]
    scene.render.filepath = str(OUT/(entry['id']+'.png'))
    bpy.ops.render.render(write_still=True)
    records[entry['id']] = dict(id=entry['id'], meshes=entry['pieces'], camera_rotation=list(rot),
                                orthographic_width_mm=round(scale, 2), px_per_mm=round(w/scale, 4),
                                resolution=[w, h], marks=marks)
    print('FINISHED', entry['id'], flush=True)
info.write_text(json.dumps(list(records.values()), indent=2)+'\n')
sys.stdout.flush(); sys.stderr.flush(); os._exit(0)
