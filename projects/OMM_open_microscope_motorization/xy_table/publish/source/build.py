# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Rebuild the OMM XY table v3.0.4 publishing images and STL files with OpenSCAD, Blender and Pillow.

Stages: --stage=mesh, --stage=render, --stage=compose; all three without one.
--draft renders at half size with fewer samples, for checking only.
"""
import concurrent.futures, json, os, re, shutil, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[2]
NAME = 'omm_xy_table_v3p0p4'
CACHE = ROOT/'.gitignored/omm_xy_table_publish'
MODEL = PROJECT/(NAME+'.scad')
PRESETS = PROJECT/(NAME+'.json')
SCAD = os.environ.get('PUBLISH_OPENSCAD', str(ROOT/'.gitignored/tools/OpenSCAD-nightly.AppImage'))
PREFIX = ['--appimage-extract-and-run'] if SCAD.endswith('.AppImage') else []
ENV = dict(os.environ, QT_QPA_PLATFORM='offscreen')
# Parallel AppImage runs race to extract; their symlink notices are not OpenSCAD warnings.
def warned(log): return re.search(r'^WARNING: (?!could not create symlink)', log, re.M)
stage = next((a.split('=')[1] for a in sys.argv if a.startswith('--stage=')), None)
for folder in (CACHE/'meshes', OUT/'renders', OUT/'images'):
    folder.mkdir(parents=True, exist_ok=True)

# The source's modules one piece at a time, placed as in its assembly and
# print_layout, so each piece gets its own colour. Not in the source, drawn
# to explain the drive as built: the O-rings in the adapters' grooves and the
# sanding paper on the driven rails; the motors stand higher by both.
DIMS = ['x_travel', 'y_travel', 'explode', 'paper_t', 'lift', 'rail_cut_y', 'scl_x_slide', 'scl_y_slide',
        'scl_z_slide', 'tol_slide_holder', 'wall_slide_holder', 'scl_x_handle_slide_holder', 'scl_z_slide_holder',
        'scl_z_inset_slide_slideholder', 'scl_z_inset_slideh', 'wall_x_slider', 'scl_x_x_slider', 'scl_y_x_slider',
        'scl_z_x_slider', 'x_rail_end', 'scl_x_rail', 'scl_y_rail', 'extr_width', 'tol_rail', 'scl_y_rail_outer',
        'scl_z_rail', 'scl_z_y_slider', 'y_rail2_x', 'scl_x_x_rail', 'scl_y_table', 'table_y1', 'table_motor_y',
        'table_rail_y', 'table_bracket_x', 'y_bracket_y', 'y_back', 'y_front', 'y_arm_end', 'rail_y',
        'bracket_pitch', 'upright_w', 'upright_t', 'upright_h', 'motor_z', 'adapter_r', 'adapter_h',
        'dia_oring_cord', 'oring_groove', 'num_oring', 'scl_z_motor_shaft', 'byj_shaft_offset', 'byj_shaft_len',
        'engrave_depth', 'table_text_at', 'table_text_line', 'text_size', 'table_logo_at', 'table_logo_w',
        'y_slider_logo_w']
LAYOUT = ['lay_table', 'lay_y_slider', 'lay_x_slider', 'lay_slide_holder', 'lay_adapters', 'lay_washers', 'lay_ruler']
WRAPPER = f'''include <{MODEL}>
piece = "";
// The exploded view's gaps: under the Y slider, the X slider, the slide holder and the slide
explode = [0, 0, 0, 0];
// "drive": a slab behind the plane through the Y motor's axis; "rail": a slab across the first Y rail
cut = "";
// The sanding paper's thickness is assumed
paper_t = 0.3;
// The O-rings stand this far out of the adapter and roll on the paper
lift = dia_oring_cord - oring_groove + paper_t;
// Between two notches of the arm, behind the table's bracket
rail_cut_y = y_front - 2.5 * rail_pitch();
echo(str("DIMS ", [{", ".join(DIMS)}]));
module on_y() translate([0, y_travel, scl_z_y_slider + explode[0]]) children();
module on_x() on_y() translate([x_travel, 0, explode[1]]) children();
module on_holder() on_x() translate([0, 0, scl_z_x_slider - scl_z_inset_slideh + explode[2]]) children();
module at_motor_y() translate([table_bracket_x + upright_t, table_motor_y, motor_z + lift]) rotate(-90) children();
module at_motor_x() on_y() translate([0, y_bracket_y + upright_t, motor_z + lift]) children();
// The adapter's place in byj48(), its open end at z = 0
module on_shaft() translate([0, scl_z_motor_shaft - byj_shaft_len, -byj_shaft_offset]) rotate([90, 0, 0]) children();
module motor() difference() {{ byj48(); on_shaft() motor_shaft_adapter(); }}
// The cords that motor_shaft_adapter() cuts its grooves with
module orings() on_shaft() for (k = [0 : num_oring - 1]) translate([0, 0, (k + 0.5) * dia_oring_cord])
    rotate_extrude() translate([adapter_r + dia_oring_cord / 2 - oring_groove, 0]) circle(d = dia_oring_cord, $fn = 72);
module drive_y() at_motor_y() {{ motor(); on_shaft() motor_shaft_adapter(); orings(); }}
module drive_x() at_motor_x() {{ motor(); on_shaft() motor_shaft_adapter(); orings(); }}
module carriage() {{ on_x() x_slider(); on_holder() slide_holder(); }}
module both() intersection() {{ children(0); children(1); }}
// As in print_layout()
module lay(p) {{
    if (p == "lay_table") translate([5 + table_y1, 200, scl_z_table]) rotate(90) table();
    else if (p == "lay_y_slider") translate([65 + scl_y_table, 112 - y_arm_end, scl_z_y_slider]) y_slider();
    else if (p == "lay_x_slider") translate([5 + scl_z_rail - x_rail_end, 82 + scl_y_x_slider / 2 + wall_x_slider / 2, 0]) x_slider();
    else if (p == "lay_slide_holder") translate([86.5, 56, 0]) slide_holder();
    else if (p == "lay_adapters") for (i = [0, 1]) translate([190 + 12 * i, 95, 0]) adapter_flipped();
    else if (p == "lay_washers") for (i = [0 : 3]) translate([190 + 12 * i, 80, 0]) washer();
    else if (p == "lay_ruler") translate([5, 14, 0]) cutting_ruler();
}}
module pieces() {{
    if (piece == "table") table();
    // What parts that only touch or pass each other share: nothing
    else if (piece == "overlap") {{
        both() {{ table(); on_y() y_slider(); }}
        both() {{ table(); carriage(); }}
        both() {{ on_y() y_slider(); carriage(); }}
        both() {{ on_x() x_slider(); on_holder() slide_holder(); }}
        both() {{ drive_y(); union() {{ on_y() y_slider(); carriage(); drive_x(); }} }}
        both() {{ drive_x(); union() {{ table(); carriage(); }} }}
    }}
    else if (piece == "y_slider") on_y() y_slider();
    else if (piece == "x_slider") on_x() x_slider();
    else if (piece == "slide_holder") on_holder() slide_holder();
    else if (piece == "slide") on_holder() translate([0, 0, scl_z_slide_holder - scl_z_inset_slide_slideholder + explode[3]]) slide();
    else if (piece == "motor_y") at_motor_y() motor();
    else if (piece == "adapter_y") at_motor_y() on_shaft() motor_shaft_adapter();
    else if (piece == "orings_y") at_motor_y() orings();
    else if (piece == "motor_x") at_motor_x() motor();
    else if (piece == "adapter_x") at_motor_x() on_shaft() motor_shaft_adapter();
    else if (piece == "orings_x") at_motor_x() orings();
    // The strips of sand_strips, on the rails' tops
    else if (piece == "paper_y") on_y() translate([-sand_strips[1].x / 2, y_front - sand_strips[1].y, scl_y_rail_outer - scl_z_y_slider])
        cube([sand_strips[1].x, sand_strips[1].y, paper_t]);
    else if (piece == "paper_x") on_x() translate([x_rail_end - scl_z_rail, rail_y - sand_strips[0].x / 2, scl_y_rail_outer])
        cube([sand_strips[0].y, sand_strips[0].x, paper_t]);
    else if (piece == "lay_all") for (p = [{", ".join(f'"{p}"' for p in LAYOUT)}]) lay(p);
    else lay(piece);
}}
if (cut == "drive") intersection() {{ pieces(); translate([-25, table_motor_y, -50]) cube([56, 30, 200]); }}
else if (cut == "rail") intersection() {{ pieces(); translate([-4.6, rail_cut_y, -1.4]) cube([9.2, 3, 20]); }}
else pieces();
'''

P = json.loads(PRESETS.read_text())['parameterSets']
# The four presets, and the default with a tighter and a looser rail for the tol_rail image.
SETS = {'standard': P['Standard 76 x 25'], 'petro': P['Petrographic 46 x 27'], 'wide': P['Wide 75 x 38'],
        'large': P['Large 75 x 50'], 'rail010': dict(P['Standard 76 x 25'], tol_rail='0.1'),
        'rail040': dict(P['Standard 76 x 25'], tol_rail='0.4')}
# Where the carriages stand, and how far the layers are lifted apart: the X slider above the X motor.
POSES = {'home': {}, 'y': dict(y_travel=25), 'x': dict(x_travel=35), 'apart': dict(explode='[36, 44, 26, 18]'),
         'drive': dict(cut='"drive"'), 'rail': dict(cut='"rail"')}
STAGE = ['table', 'y_slider', 'x_slider', 'slide_holder', 'slide']
DRIVE_Y = ['motor_y', 'adapter_y', 'orings_y', 'paper_y']
DRIVE_X = ['motor_x', 'adapter_x', 'orings_x', 'paper_x']
def pieces(key, pose, names): return {p: f'{key}_{pose}_{p}' for p in names}

# What stays is grey, what moves keeps its colour.
STILL = dict(table='7C8583', y_slider='A9AEAA', x_slider='C4C8C3')
def tint(moving): return {p: c for p, c in STILL.items() if p not in moving}

# From the front: the Y motor in front, the X motor behind, the table's label reading upwards.
VIEW = [-.35, -1, .85]
scenes = [dict(id='stack', set='standard', pose='apart', pieces=pieces('standard', 'apart', STAGE+DRIVE_Y+DRIVE_X),
               direction=[-.35, -1, .5]),
          # From above, the table's label reading from the left.
          *[dict(id='move_'+pose, set='standard', pose=pose, pieces=pieces('standard', pose, STAGE+DRIVE_Y+DRIVE_X),
                 group='move', euler=[0, 0, 0], exposure=-1.9, colors=tint(moving))
            for pose, moving in (('home', STAGE), ('y', ['y_slider', 'x_slider']), ('x', ['x_slider']))],
          dict(id='drive_view', set='standard', pose='home', pieces=pieces('standard', 'home', STAGE+DRIVE_Y+DRIVE_X),
               direction=[-.3, -1, .75], frame=dict(target='drive', width=74)),
          dict(id='drive', set='standard', pose='drive', direction=[0, -1, 0], front_light=True,
               pieces=pieces('standard', 'drive', ['table', 'y_slider']+DRIVE_Y)),
          *[dict(id='rail_'+k, set=k, pose='rail', direction=[0, -1, 0], front_light=True, group='rail',
                 pieces=pieces(k, 'rail', ['table', 'y_slider']))
            for k in ('rail010', 'standard', 'rail040')],
          *[dict(id='format_'+k, set=k, pose='home', pieces=pieces(k, 'home', STAGE+DRIVE_Y+DRIVE_X), group='format',
                 direction=VIEW)
            for k in ('standard', 'petro', 'wide', 'large')],
          dict(id='layout', set='standard', pose='home', pieces=pieces('standard', 'home', LAYOUT), direction=[-.12, 1, 1.5])]

def openscad(out, values, source):
    """Exports source with the values set. Parallel AppImage runs now and then
    take each other's extracted copy away: such a run is tried again."""
    for _ in range(3):
        log = subprocess.run([SCAD, *PREFIX, '--backend=manifold', *(['--export-format', 'binstl'] if out.suffix == '.stl' else []),
                              '-o', str(out), *[a for k, v in values.items() for a in ('-D', f'{k}={v}')], str(source)],
                             env=ENV, capture_output=True, text=True)
        if log.returncode == 0 or 'AppRun' not in log.stderr: break
    return log

def export(job):
    out = CACHE/'meshes'/(job['name']+'.3mf')
    values = dict(SETS[job['set']], **POSES[job['pose']], part='"none"', piece=f'"{job["piece"]}"')
    log = openscad(out, values, CACHE/'wrapper.scad')
    assert log.returncode == 0 and out.exists(), job['name']+'\n'+log.stderr
    assert not warned(log.stderr), job['name']+'\n'+log.stderr
    dims = json.loads(re.search(r'ECHO: "DIMS (\[.*\])"', log.stderr).group(1))
    return job['name'], dict(zip(DIMS, dims))

# The carriages' places [x_travel, y_travel] at which every preset is checked: the pictured ones and the corners of the travel.
TRAVEL = [(0, 0), (0, 25), (35, 0), (0, -13), (0, 28), (45, -13), (-45, -13), (45, 28), (-45, 28)]
def overlap(job):
    """Asserts that no two parts share a volume with the carriages at x, y."""
    key, x, y = job
    out = CACHE/'meshes'/f'overlap_{key}_{x}_{y}.stl'
    out.unlink(missing_ok=True)
    log = openscad(out, dict(SETS[key], x_travel=x, y_travel=y, part='"none"', piece='"overlap"'), CACHE/'wrapper.scad')
    volume = measure(triangles(out))[0] if out.exists() else 0
    assert volume < 1e-2 and (out.exists() or 'is empty' in log.stderr), f'{key} at x {x}, y {y}: {volume:.3f} mm3 shared\n'+log.stderr

PARTS = ['table', 'y_slider', 'x_slider', 'slide_holder', 'motor_shaft_adapter', 'washer', 'cutting_ruler']
def fresh(part):
    """A part exported from the source, as triangles."""
    out = CACHE/'meshes'/f'check_{part}.stl'
    log = openscad(out, dict(part=f'"{part}"'), MODEL)
    assert log.returncode == 0 and not warned(log.stderr), part+'\n'+log.stderr
    return triangles(out)

def print_file(part):
    """The print files: the project's exported STLs, which are in print
    orientation. Each is held against a fresh export of the source at the
    defaults (volume and size), copied here and checked for a closed mesh."""
    source = PROJECT/f'{NAME}_{part}.stl'
    (v0, lo0, hi0), (v1, lo1, hi1) = measure(triangles(source)), measure(fresh(part))
    assert abs(v0-v1) < 1e-4*v1 and np.abs(np.concatenate([lo0-lo1, hi0-hi1])).max() < 1e-3, \
        f'{source.name} is not the source at its defaults: {v0:.2f} mm3 against {v1:.2f}'
    shutil.copyfile(source, OUT/source.name)
    return audit(OUT/source.name)

def triangles(path):
    data = path.read_bytes()
    n = int.from_bytes(data[80:84], 'little')
    return np.frombuffer(data[84:84+50*n], dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]))['v'].astype(float)

def measure(tri):
    """Volume and bounding box."""
    volume = float(np.einsum('ij,ij->i', tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum()/6)
    return volume, tri.reshape(-1, 3).min(0), tri.reshape(-1, 3).max(0)

def audit(path):
    """Closed (every edge on exactly two triangles, in opposite directions), positive volume, on the bed."""
    tri = triangles(path)
    _, ids = np.unique(tri.reshape(-1, 3), axis=0, return_inverse=True)
    ids = ids.reshape(-1, 3)
    edges = np.concatenate([ids[:, [0, 1]], ids[:, [1, 2]], ids[:, [2, 0]]])
    keys, counts = np.unique(edges, axis=0, return_counts=True)
    reverse = {tuple(e) for e in keys}
    closed = bool((counts == 1).all() and all((b, a) in reverse for a, b in keys))
    volume, lo, hi = measure(tri)
    assert closed and volume > 0 and abs(lo[2]) < 1e-3, f'{path.name}: closed={closed} volume={volume:.1f} z0={lo[2]:.3f}'
    return dict(file=path.name, triangles=len(tri), closed=closed, volume_mm3=round(volume, 1),
                size_mm=[round(float(v), 2) for v in hi-lo])

def marks(scene, d):
    """Points the compose script labels and dimensions, in mm."""
    zy = d['scl_z_y_slider']+d['explode'][0]
    zx = zy+d['explode'][1]
    zh = zx+d['scl_z_x_slider']-d['scl_z_inset_slideh']+d['explode'][2]
    zs = zh+d['scl_z_slide_holder']-d['scl_z_inset_slide_slideholder']+d['explode'][3]
    x, y = d['x_travel'], d['y_travel']
    half = d['scl_x_x_rail']/2
    holder = d['scl_x_slide']/2+d['tol_slide_holder']/2+d['wall_slide_holder']+d['scl_x_handle_slide_holder']
    face = d['table_bracket_x']+d['upright_t']
    mz = d['motor_z']+d['lift']
    shaft = mz-d['byj_shaft_offset']
    ring = d['adapter_r']+d['dia_oring_cord']/2-d['oring_groove']
    top = d['scl_y_rail_outer']
    if scene['pose'] == 'drive':
        yc = d['table_motor_y']
        middle = face-d['byj_shaft_len']+d['scl_z_motor_shaft']-1.5*d['dia_oring_cord']
        return {'motor': [face+14, yc, mz+4], 'adapter': [face-d['byj_shaft_len']-.4, yc, shaft], 'oring': [middle, yc, shaft+ring],
                'paper': [-2.9, yc, top+d['paper_t']/2], 'arm': [2.4, yc, 1.6], 'rail': [0, yc, 1],
                'arm2': [d['y_rail2_x']+2.4, yc, 1.6], 'upright': [d['table_bracket_x']+d['upright_t']/2, yc, d['upright_h']-6]}
    if scene['pose'] == 'rail':
        yc, a, t = d['rail_cut_y'], d['scl_x_rail']/2, d['tol_rail']/2
        return {'rail_l': [-a, yc, .6], 'rail_r': [a, yc, .6], 'slot_l': [-a-t, yc, 1], 'slot_r': [a+t, yc, 1],
                'arm': [2.6, yc, 3.1], 'table': [-3, yc, -.7]}
    if scene['id'] == 'layout':
        return {'table': [5+d['scl_y_table']/2, 200, 3], 'y_slider': [65+d['scl_y_table'], 112-d['y_arm_end']+(d['y_back']+d['y_front'])/2-12, 2.4],
                'x_slider': [5+d['scl_z_rail']-d['x_rail_end'], 82+d['scl_y_x_slider']/2+d['wall_x_slider']/2+d['rail_y'], 4],
                'slide_holder': [86.5-holder+10, 56, 4], 'adapters': [196, 95, d['adapter_h']], 'ruler': [54.5, 17.25, 3]}
    return {'axis': [0, 0, zs+d['scl_z_slide']], 'axis_top': [0, 0, zs+16], 'axis_bottom': [0, 0, -30],
            'slide': [x, y, zs+d['scl_z_slide']], 'table': [half, d['table_y1']-12, 0], 'y_slider': [half, y+d['y_back']-4, zy],
            'arm': [0, y+d['y_arm_end']+8, zy-d['scl_z_y_slider']+top],
            'x_slider': [x+d['scl_x_x_slider']/2+d['wall_x_slider']/2, y, zx+d['scl_z_x_slider']],
            'holder': [x+holder, y, zh+d['scl_z_slide_holder']], 'glass': [x+d['scl_x_slide']/2-6, y, zs+d['scl_z_slide']],
            'motor_y': [face+10, d['table_motor_y'], mz+14], 'motor_x': [0, y+d['y_bracket_y']+d['upright_t'], zy+mz+6],
            'drive': [face-5, d['table_motor_y'], shaft]}

def engraving(d):
    """The engravings' floors, which get a second colour: a height and the boxes [x0, y0, x1, y1] around them."""
    (tx, ty), (lx, ly) = d['table_text_at'], d['table_logo_at']
    w, cy = d['table_logo_w'], d['y_slider_logo_w']
    sx = -(d['scl_x_x_rail']/2+d['bracket_pitch']/2+d['upright_w']/2)/2
    sy = (d['rail_y']+d['scl_x_rail']/2+d['y_back'])/2+d['y_travel']
    return {'table': dict(z=-d['engrave_depth'], boxes=[[tx-d['text_size']-2, ty-1, tx+d['table_text_line']+1, ty+11*d['text_size']],
                                                         [lx-w/2, ly-w/2-1, lx+w/2, ly+w/2+1]]),
            'y_slider': dict(z=d['scl_z_y_slider']+d['explode'][0]-d['engrave_depth'], boxes=[[sx-cy/2-1, sy-cy/2, sx+cy/2+1, sy+cy/2]])}

if stage in (None, 'mesh'):
    (CACHE/'wrapper.scad').write_text(WRAPPER)
    jobs = {name: dict(name=name, set=scene['set'], pose=scene['pose'], piece=piece)
            for scene in scenes for piece, name in scene['pieces'].items()}
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PUBLISH_JOBS', 6))) as pool:
        info = dict(pool.map(export, jobs.values()))
        stls = list(pool.map(print_file, PARTS))
        list(pool.map(overlap, [(k, x, y) for k in SETS for x, y in TRAVEL]))
    # The pieces of the layout together are the source's print_layout().
    log = openscad(CACHE/'meshes/check_lay_all.stl', dict(part='"none"', piece='"lay_all"'), CACHE/'wrapper.scad')
    assert log.returncode == 0, log.stderr
    mine, its = [np.unique(t.reshape(-1, 3), axis=0) for t in (triangles(CACHE/'meshes/check_lay_all.stl'), fresh('print_layout'))]
    assert mine.shape == its.shape and np.abs(mine-its).max() < 1e-3, 'print_layout() has changed'
    for scene in scenes:
        d = info[next(iter(scene['pieces'].values()))]
        scene['marks'], scene['engrave'] = marks(scene, d), engraving(d)
        if 'frame' in scene: scene['frame']['target'] = scene['marks'][scene['frame']['target']]
    dims = {k: info[f'{k}_{"rail" if k.startswith("rail") else "home"}_table'] for k in SETS}
    cfg = dict(cache=str(CACHE), output=str(OUT), project=str(PROJECT), root=str(ROOT), scenes=scenes, dims=dims)
    (CACHE/'config.json').write_text(json.dumps(cfg, indent=2)+'\n')
    (OUT/'mesh-audit.json').write_text(json.dumps(stls, indent=2)+'\n')
    print('MESHES', len(jobs), 'STL', *[s['file'] for s in stls])

if stage in (None, 'render'):
    command = ['blender', '-b', '--factory-startup', '-P', str(HERE/'studio.py'), '--', str(CACHE/'config.json')]
    if '--draft' in sys.argv: command.append('--draft')
    command += [a for a in sys.argv if a.startswith('--scene=')]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    print('RENDERS', len(scenes))

if stage in (None, 'compose'):
    subprocess.run([sys.executable, str(HERE/'compose.py'), str(CACHE/'config.json'), *[a for a in sys.argv if a == '--draft']], check=True)
