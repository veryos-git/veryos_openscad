# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Studio renders of the OpenSCAD-exported parts, run inside Blender."""
import bpy, json, math, os, sys
from pathlib import Path
from mathutils import Vector

cfg = json.loads(Path(sys.argv[sys.argv.index('--')+1]).read_text())
MESHES, OUT = Path(cfg['cache'])/'meshes', Path(cfg['output'])/'renders'
draft = '--draft' in sys.argv
only = next((a.split('=')[1] for a in sys.argv if a.startswith('--scene=')), None)
S = .01
COLORS = {'body':'344948', 'slider':'8FA79C', 'screw':'C06A1C', 'phone':'AEB2AC'}
LOGOS = {'body':'C06A1C', 'slider':'C06A1C', 'screw':'E4D9BE'}

def linear(code):
    rgb = [int(code[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb) + (1,)

def material(name, code):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    bs = mat.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = linear(code)
    bs.inputs['Roughness'].default_value = .42
    return mat

def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

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

def load(name, piece, plane, lay):
    """One mesh in its piece's colour. The floor of its logo engraving gets the
    logo colour so the engraving reads."""
    color = piece.replace('print_', '')
    verts, faces = read_off(MESHES/(name+'.off'))
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts, [], faces); mesh.update()
    obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj)
    obj.scale = (S,)*3
    # On its bed side with its back to the camera, as on the table in the photos.
    if lay: obj.rotation_euler = (0, -math.pi/2, 0)
    mesh.materials.append(material(name, COLORS[color]))
    if color in LOGOS:
        mesh.materials.append(material(name+' logo', LOGOS[color]))
        axis, value = plane
        for poly in mesh.polygons:
            if all(abs(mesh.vertices[i].co[axis]-value) < 1e-3 for i in poly.vertices):
                poly.material_index = 1
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(28), keep_sharp_edges=True)
    obj.select_set(False)

def bounds(scene, direction):
    """The meshes' centre and the orthographic width that fits them."""
    bpy.context.view_layer.update()
    q = Vector(direction).to_track_quat('Z','Y'); inv = q.inverted()
    points = [inv @ (o.matrix_world @ Vector(c)) for o in scene.objects if o.type=='MESH' for c in o.bound_box]
    lo = Vector([min(p[a] for p in points) for a in range(3)])
    hi = Vector([max(p[a] for p in points) for a in range(3)])
    aspect = scene.render.resolution_x/scene.render.resolution_y
    return q @ ((lo+hi)/2), max(hi.x-lo.x, (hi.y-lo.y)*aspect)*1.08/S

def camera(scene, direction, target, scale_mm):
    data = bpy.data.cameras.new('Camera'); cam = bpy.data.objects.new('Camera', data)
    scene.collection.objects.link(cam); cam.location = target+Vector(direction).normalized()*20
    aim(cam, target); data.type='ORTHO'; data.ortho_scale=scale_mm*S; data.clip_end=100
    scene.camera = cam

# Camera direction from the model, and whether the holder lies on its bed side.
# The slider is to the left and the screw head to the right in all but the print layout.
VIEWS = {'back':((1,-.38,.62),True), 'front':((1,-.55,.85),False), 'section':((1,0,.1),False), 'print':((.7,-1,1.9),False)}

def build(entry):
    scene = setup()
    for piece, name in entry['meshes'].items(): load(name, piece, entry['logo'][piece], VIEWS[entry['view']][1])
    return scene

# Scenes in one group share one scale: the scale that fits the largest.
GROUPS = [[s['id'] for s in cfg['scenes'] if s['id'] in ('everyday','compact_phone','thick_case','small_tablet')],
          [s['id'] for s in cfg['scenes'] if s['id'].startswith('held_')],
          [s['id'] for s in cfg['scenes'] if s['id'].startswith(('phone_thickness_','holder_width_','lip_length_'))]]
entries = {s['id']: s for s in cfg['scenes']}
shared = {}
for group in GROUPS:
    if only and only not in group: continue
    scale = max(bounds(build(entries[i]), VIEWS[entries[i]['view']][0])[1] for i in group)
    shared.update({i: scale for i in group})
records = []
for entry in cfg['scenes']:
    if only and entry['id'] != only: continue
    scene = build(entry)
    direction = VIEWS[entry['view']][0]
    target, scale = bounds(scene, direction)
    scale = shared.get(entry['id'], scale)
    camera(scene, direction, target, scale)
    scene.render.filepath = str(OUT/(entry['id']+'.png'))
    bpy.ops.render.render(write_still=True)
    records.append(dict(id=entry['id'], meshes=entry['meshes'], camera_direction=direction,
                        orthographic_width_mm=round(scale, 2),
                        resolution=[scene.render.resolution_x, scene.render.resolution_y]))
    print('FINISHED', entry['id'], flush=True)
if not only: (OUT/'render-info.json').write_text(json.dumps(records, indent=2)+'\n')
sys.stdout.flush(); sys.stderr.flush(); os._exit(0)
