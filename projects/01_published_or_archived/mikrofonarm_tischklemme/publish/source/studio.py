# Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
"""Studio renders of the OpenSCAD-exported parts, run inside Blender."""
import bpy, json, math, os, sys
from pathlib import Path
from mathutils import Vector

cfg = json.loads(Path(sys.argv[sys.argv.index('--')+1]).read_text())
MESHES, OUT = Path(cfg['cache'])/'meshes', Path(cfg['output'])/'renders'
draft = '--draft' in sys.argv
only = next((a.split('=')[1] for a in sys.argv if a.startswith('--scene=')), None)
S = .01
COLORS = {'clamp': '344948', 'screw': 'C27A22', 'pin': 'A9AEB2', 'table': 'C9A77A', 'logo': 'E8DCC0'}

def linear(code, lighten=0):
    rgb = [int(code[i:i+2], 16)/255 for i in (0, 2, 4)]
    rgb = [v+(1-v)*lighten for v in rgb]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb) + (1,)

def material(name, code, metallic=0, roughness=.42, lighten=0):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    bs = mat.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = linear(code, lighten)
    bs.inputs['Roughness'].default_value = roughness
    bs.inputs['Metallic'].default_value = metallic
    return mat

def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z', 'Y').to_euler()

def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 16 if draft else 96
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
    for name, location, power, size in [('Key', (-3, -4, 6), 800, 4), ('Fill', (4, -2, 3), 450, 3), ('Rim', (0, 4, 5), 950, 3)]:
        data = bpy.data.lights.new(name, 'AREA'); data.energy = power; data.shape = 'DISK'; data.size = size
        obj = bpy.data.objects.new(name, data); scene.collection.objects.link(obj)
        obj.location = location; aim(obj, (0, 0, -.2))
    return scene

def read_off(path):
    words = [l.split('#')[0].split() for l in path.read_text().splitlines()]
    words = [w for w in words if w][1:]
    nv, nf = int(words[0][0]), int(words[0][1])
    verts = [tuple(map(float, w[:3])) for w in words[1:1+nv]]
    faces = [tuple(map(int, w[1:1+int(w[0])])) for w in words[1+nv:1+nv+nf]]
    return verts, faces

def logo_plane(piece, dims):
    """Axis and position of the floor of a piece's engraved logo, as placed."""
    return {'clamp': (0, dims['clamp_logo_x']), 'print_clamp': (0, dims['clamp_logo_x']),
            'screw': (1, dims['screw_logo_y']), 'print_screw': (2, dims['print_screw_logo_z'])}.get(piece)

def paint(mesh, plane, mat):
    """Gives the faces lying in plane (axis, position) the material mat."""
    mesh.materials.append(mat)
    axis, value = plane
    for poly in mesh.polygons:
        if all(abs(mesh.vertices[i].co[axis]-value) < 1e-3 for i in poly.vertices):
            poly.material_index = len(mesh.materials)-1

def load(name, piece, dims):
    """One mesh in its piece's colour. The floor of a logo engraving gets the
    logo colour so the engraving reads; a cut face a lighter shade, so the
    section reads."""
    color = piece.replace('print_', '').replace('cut_', '')
    verts, faces = read_off(MESHES/(name+'.off'))
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts, [], faces); mesh.update()
    obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj)
    obj.scale = (S,)*3
    metal = color == 'pin'
    mesh.materials.append(material(name, COLORS[color], metallic=.85 if metal else 0, roughness=.3 if metal else .42))
    plane = logo_plane(piece, dims)
    if plane: paint(mesh, plane, material(name+' logo', COLORS['logo']))
    if piece.startswith('cut_'): paint(mesh, (1, dims['cut_y']), material(name+' cut', COLORS[color], lighten=.35))
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(28), keep_sharp_edges=True)
    obj.select_set(False)

def bounds(scene, direction):
    """The meshes' centre and the orthographic width that fits them."""
    bpy.context.view_layer.update()
    q = Vector(direction).to_track_quat('Z', 'Y'); inv = q.inverted()
    points = [inv @ (o.matrix_world @ Vector(c)) for o in scene.objects if o.type == 'MESH' for c in o.bound_box]
    lo = Vector([min(p[a] for p in points) for a in range(3)])
    hi = Vector([max(p[a] for p in points) for a in range(3)])
    aspect = scene.render.resolution_x/scene.render.resolution_y
    return q @ ((lo+hi)/2), max(hi.x-lo.x, (hi.y-lo.y)*aspect)*1.08/S

def camera(scene, direction, target, scale_mm):
    data = bpy.data.cameras.new('Camera'); cam = bpy.data.objects.new('Camera', data)
    scene.collection.objects.link(cam); cam.location = target+Vector(direction).normalized()*20
    aim(cam, target); data.type = 'ORTHO'; data.ortho_scale = scale_mm*S; data.clip_end = 100
    scene.camera = cam

def build(entry):
    scene = setup()
    for piece, name in entry['meshes'].items(): load(name, piece, entry['dims'])
    return scene

# Three quarter: from the front right, above the table, so the C's side face,
# the block's logo and the screw below the table show. Side: along the table
# edge, x to the right, z up, for dimensions.
DIRECTIONS = {'three_quarter': (.8, -1.6, .55), 'side': (0, -1, 0), 'print': (.3, -.9, 2.2)}
# Scenes in one group share one scale: the scale that fits the largest.
GROUPS = [[s['id'] for s in cfg['scenes'] if s['view'] == 'three_quarter'],
          [s['id'] for s in cfg['scenes'] if s['id'].startswith('side_')]]
entries = {s['id']: s for s in cfg['scenes']}
shared = {}
for group in GROUPS:
    scale = max(bounds(build(entries[i]), DIRECTIONS[entries[i]['view']])[1] for i in group)
    shared.update({i: scale for i in group})
records = []
for entry in cfg['scenes']:
    if only and entry['id'] != only: continue
    scene = build(entry)
    direction = DIRECTIONS[entry['view']]
    target, scale = bounds(scene, direction)
    scale = shared.get(entry['id'], scale)
    camera(scene, direction, target, scale)
    scene.render.filepath = str(OUT/(entry['id']+'.png'))
    bpy.ops.render.render(write_still=True)
    records.append(dict(id=entry['id'], meshes=entry['meshes'], camera_direction=direction,
                        target_mm=[round(v/S, 4) for v in target], orthographic_width_mm=round(scale, 4),
                        resolution=[scene.render.resolution_x, scene.render.resolution_y]))
    print('FINISHED', entry['id'], flush=True)
if not only: (OUT/'render-info.json').write_text(json.dumps(records, indent=2)+'\n')
sys.stdout.flush(); sys.stderr.flush(); os._exit(0)
