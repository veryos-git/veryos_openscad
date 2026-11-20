# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Studio renders of the OpenSCAD-exported pieces, run inside Blender."""
import bpy, json, math, os, sys, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from mathutils import Euler, Vector
from bpy_extras.object_utils import world_to_camera_view

cfg = json.loads(Path(sys.argv[sys.argv.index('--')+1]).read_text())
MESHES, OUT = Path(cfg['cache'])/'meshes', Path(cfg['output'])/'renders'
draft = '--draft' in sys.argv
only = next((a.split('=')[1] for a in sys.argv if a.startswith('--scene=')), None)
S = .01
# Illustrative colours: base dark, lid light, screws in the brand's gold,
# engraving floors in ochre or gold so the logo reads.
COLORS = {'base': '344948', 'lid': 'E4D9BE', 'screws': 'E7A43A', 'base_engrave': 'F0B750', 'lid_engrave': 'B77B1E'}
# The board's colours from the source, as OpenSCAD writes them into the 3mf.
BOARD = {'#000000': ('17181A', .85, 0), '#C0C0C0': ('C9CDD1', .3, .8), '#696969': ('55595C', .5, 0),
         '#FFD700': ('D9A93A', .3, .9)}
NS = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}

def linear(code):
    rgb = [int(code[i:i+2], 16)/255 for i in (0, 2, 4)]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb) + (1,)

def material(name, code, roughness=.42, metallic=0):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    bs = mat.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = linear(code)
    bs.inputs['Roughness'].default_value = roughness
    bs.inputs['Metallic'].default_value = metallic
    return mat

def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z', 'Y').to_euler()

def setup(from_below):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 16 if draft else 128
    scene.cycles.use_denoising = True; scene.cycles.max_bounces = 6
    scene.render.resolution_x = 900 if draft else 1800
    scene.render.resolution_y = 750 if draft else 1500
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = -.25
    scene.world = bpy.data.worlds.new('World'); scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.85, .9, 1, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .45
    flip = -1 if from_below else 1
    for name, (x, y, z), power, size in [('Key', (3, -4, 6), 800, 4), ('Fill', (-4, -2, 3), 450, 3), ('Rim', (0, 4, 5), 950, 3)]:
        data = bpy.data.lights.new(name, 'AREA'); data.energy = power; data.shape = 'DISK'; data.size = size
        obj = bpy.data.objects.new(name, data); scene.collection.objects.link(obj)
        obj.location = (x, y, flip*z); aim(obj, (.28, .2, .1*flip))
    return scene

def read_3mf(path):
    """Vertices, triangles and each triangle's display colour."""
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read('3D/3dmodel.model'))
    colors = {}
    for group in root.iterfind('.//m:basematerials', NS):
        for i, base in enumerate(group.iterfind('m:base', NS)):
            colors[group.get('id'), str(i)] = base.get('displaycolor')[:7].upper()
    verts, tris, tcolors = [], [], []
    for obj in root.iterfind('.//m:object', NS):
        offset = len(verts)
        verts += [(float(v.get('x')), float(v.get('y')), float(v.get('z'))) for v in obj.iterfind('.//m:vertex', NS)]
        for t in obj.iterfind('.//m:triangle', NS):
            tris.append((offset+int(t.get('v1')), offset+int(t.get('v2')), offset+int(t.get('v3'))))
            tcolors.append(colors.get((t.get('pid') or obj.get('pid'), t.get('p1') or obj.get('pindex'))))
    return verts, tris, tcolors

def load(name, piece, engrave):
    """One mesh in its piece's colour, the board in its own colours. Faces
    that lie on an engraving's floor get the engraving colour."""
    color = piece.replace('layout_', '')
    verts, tris, tcolors = read_3mf(MESHES/(name+'.3mf'))
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts, [], tris); mesh.update()
    obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj)
    obj.scale = (S,)*3
    if color == 'board':
        keys = sorted(set(tcolors))
        for k in keys:
            code, rough, metal = BOARD.get(k, BOARD['#000000'])
            mesh.materials.append(material(name+k, code, rough, metal))
        for poly, k in zip(mesh.polygons, tcolors):
            poly.material_index = keys.index(k)
    else:
        mesh.materials.append(material(name, COLORS[color]))
        if piece in engrave:
            mesh.materials.append(material(name+' engraving', COLORS[color+'_engrave']))
            for poly in mesh.polygons:
                if all(abs(mesh.vertices[i].co.z-engrave[piece]) < 1e-3 for i in poly.vertices):
                    poly.material_index = 1
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(28), keep_sharp_edges=True)
    obj.select_set(False)

def rotation(entry):
    if 'euler' in entry: return Euler([math.radians(a) for a in entry['euler']]).to_quaternion()
    return (-Vector(entry.get('direction', ASSEMBLY))).to_track_quat('-Z', 'Y')

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
    scene = setup(entry['id'] == 'bottom')
    for piece, name in entry['pieces'].items(): load(name, piece, entry.get('engrave', {}))
    return scene

# USB end (x = 0) to the left, the front boss (y < 0) towards the camera, seen from above.
ASSEMBLY = (-.95, -1.5, .8)
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
    marks = {}
    for key, p in cfg['marks'].items():
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
