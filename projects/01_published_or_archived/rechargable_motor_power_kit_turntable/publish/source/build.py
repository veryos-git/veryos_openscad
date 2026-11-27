# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Rebuild the Rechargeable Power Kit turntable V6 publishing images and STL files with OpenSCAD, Blender and Pillow.

Stages: --stage=mesh, --stage=render, --stage=compose; all three without one.
--draft renders at half size with fewer samples, for checking only.
"""
import concurrent.futures, json, math, os, re, shutil, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[1]
NAME = 'rechargable_motor_power_kit_turntableV6'
CACHE = ROOT/'.gitignored/power_kit_turntableV6_publish'
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

# The source's modules one piece at a time, placed as in its assembly,
# section and print_layout, so each piece gets its own colour.
DIMS = ['teeth', 'real_rpm', 'pitch_r', 'base_r', 'platform_r', 'floor_z', 'axis_z', 'plate_z', 'wall_z', 'top_z',
        'wall', 'layout_turn', 'centre_distance', 'worm_x0', 'worm_x1', 'worm_tip_r', 'worm_oversize', 'mount_x',
        'mount_screw_y', 'mount_top_z', 'mount_arm_y', 'mount_arm_z1', 'clamp_r', 'battery_turn', 'battery_tip',
        'socket_tip', 'bracket_top_z', 'screw_top_z', 'screw_head_height', 'board_z', 'switch_y', 'switch_z',
        'tip_x', 'cap_length', 'socket_depth', 'tube_z', 'pin_gap', 'pin_clearance', 'logo_depth', 'tooth_pitch',
        'rail_width', 'hold_press', 'motor_press', 'cap_travel', 'thread_clearance', 'motor_rpm', 'rpm',
        'turntable_d']
WRAPPER = f'''include <{MODEL}>
piece = "";
// The platform turned on by this many teeth, so its logo shows beside the panel
turn_teeth = 0;
echo(str("DIMS ", [{", ".join(DIMS)}]));
// As in print_layout()
reach = max(norm(battery_tip - [clamp_r, 0]), norm(socket_tip - [clamp_r, 0])) + arm_w / 2;
module row(x) translate([-worm_tip_r - x, -(base_r + layout_gap + worm_tip_r), 0]) children();
if (piece == "base") base();
else if (piece == "platform") pushed() rotate(turn_teeth * 360 / teeth) platform();
else if (piece == "hoop") pushed() rotate(layout_turn + hoop_turn) hoop();
else if (piece == "worm") at_motor() worm_in_place();
else if (piece == "motor") at_motor() motor();
else if (piece == "board") at_board() board();
else if (piece == "battery") at_battery() battery();
else if (piece == "bracket") at_clamp() bracket(0);
else if (piece == "motor_bracket") at_motor() motor_bracket(0);
else if (piece == "screws") {{
    at_clamp() screw_in_place();
    at_motor() screw_in_place([mount_x, mount_screw_y, mount_top_z + screw_head_height]);
}}
else if (piece == "cap") at_board() cap_in_place();
else if (piece == "cut_base") worm_cut() base();
else if (piece == "cut_platform") worm_cut() pushed() platform();
else if (piece == "cut_worm") worm_cut() at_motor() worm_in_place();
else if (piece == "cut_motor") worm_cut() at_motor() motor();
else if (piece == "lay_platform") translate([base_r + layout_gap + platform_r, 0, top_z]) rotate([180, 0, 0]) platform();
else if (piece == "lay_worm") row(-worm_tip_r) worm();
else if (piece == "lay_screws") {{
    row(layout_gap + screw_head_width) screw_lying();
    row(3 * layout_gap + 3 * screw_head_width + cap_w) screw_lying();
}}
else if (piece == "lay_cap") row(2 * layout_gap + 2 * screw_head_width + cap_w / 2) cap();
else if (piece == "lay_motor_bracket")
    row(4 * layout_gap + 4 * screw_head_width + cap_w + (mount_arm_z1 - mount_z + 2)) motor_bracket_lying();
else if (piece == "lay_bracket")
    translate([worm_tip_r + layout_gap + reach, -(base_r + layout_gap + reach), 0]) bracket_as_printed();
'''

P = json.loads(PRESETS.read_text())['parameterSets']
# The four presets, and two wider platforms on the printed base for the turntable_d image.
SETS = {'printed': P['Printed'], 'compact': P['Compact'], 'large': P['Large'], 'xlarge': P['Extra large'],
        'wide180': dict(P['Printed'], turntable_d='180'), 'wide200': dict(P['Printed'], turntable_d='200')}
# Pieces that turntable_d does not change come from the printed set.
def mesh(key, piece): return ('printed' if key.startswith('wide') and piece != 'platform' else key)+'_'+piece
def pieces(key, names): return {p: mesh(key, p) for p in names}

CLOSED = ['base', 'platform', 'board', 'cap']
INSIDE = ['base', 'worm', 'motor', 'board', 'battery', 'bracket', 'motor_bracket', 'screws', 'cap']
# The camera stands on the panel's side (+y), a little towards the switch, as in the photo.
scenes = [dict(id='closed_'+k, set=k, pieces=pieces(k, CLOSED), group='closed', direction=[-.45, 1, .75])
          for k in ('compact', 'printed', 'large', 'xlarge')]
# From above, the panel towards the viewer, the platform's plate left away: the hoop on the worm.
scenes += [dict(id='gear_'+k, set=k, pieces=pieces(k, INSIDE+['hoop']), group='gear', euler=[0, 0, 180])
           for k in ('compact', 'printed', 'xlarge')]
scenes += [dict(id='wide_'+k, set=k, pieces=pieces(k, CLOSED), group='wide', direction=[-.45, 1, .4])
           for k in ('printed', 'wide180', 'wide200')]
scenes += [dict(id='open', set='printed', pieces=pieces('printed', INSIDE), direction=[-.5, 1, 1.15]),
           dict(id='section', set='printed', direction=[1, 0, 0], front_light=True,
                pieces=pieces('printed', ['cut_base', 'cut_platform', 'cut_worm', 'cut_motor'])),
           dict(id='layout', set='printed', direction=[.12, -1, 1.5],
                pieces=pieces('printed', ['base', 'lay_platform', 'lay_worm', 'lay_screws', 'lay_cap',
                                          'lay_motor_bracket', 'lay_bracket']))]
# The closed platforms are turned back by about 130 degrees: the logo beside the panel, as in the photo.
def turn_teeth(teeth): return -round(teeth*130/360)

def export(job):
    out = CACHE/'meshes'/(job['name']+'.3mf')
    command = [SCAD, *PREFIX, '--backend=manifold', '-o', str(out), '-D', 'part="none"',
               *[a for k, v in SETS[job['set']].items() for a in ('-D', f'{k}={v}')],
               '-D', f'piece="{job["piece"]}"', '-D', f'turn_teeth={job["turn"]}', str(CACHE/'wrapper.scad')]
    log = subprocess.run(command, env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and out.exists(), job['name']+'\n'+log.stderr
    assert not warned(log.stderr), job['name']+'\n'+log.stderr
    dims = json.loads(re.search(r'ECHO: "DIMS (\[.*\])"', log.stderr).group(1))
    return job['name'], dict(zip(DIMS, dims))

PARTS = ['base', 'platform', 'worm', 'bracket', 'motor_bracket', 'screw', 'cap']
def print_file(part):
    """The print files: the project's exported STLs, which are in print
    orientation. Each is held against a fresh export of the source at the
    defaults (volume and size), copied here and checked for a closed mesh."""
    source, fresh = PROJECT/f'{NAME}_{part}.stl', CACHE/'meshes'/f'check_{part}.stl'
    log = subprocess.run([SCAD, *PREFIX, '--backend=manifold', '--export-format', 'binstl', '-o', str(fresh),
                          '-D', f'part="{part}"', str(MODEL)], env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and not warned(log.stderr), source.name+'\n'+log.stderr
    (v0, lo0, hi0), (v1, lo1, hi1) = measure(triangles(source)), measure(triangles(fresh))
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

def turned(p, a):
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
    return [p[0]*c-p[1]*s, p[0]*s+p[1]*c, p[2]]

def marks(scene, d):
    """Points the compose script labels and dimensions, in mm, and circles
    [radius, z] around the axis, whose left and right ends the render adds."""
    def at_motor(x, y, z): return turned([x, y-d['centre_distance'], z], d['layout_turn'])
    def at_clamp(x, y, z): return turned([x, y, z], 90-d['battery_turn']/2)
    circles = {'platform': [d['platform_r'], d['top_z']], 'base': [d['base_r'], 0],
               'hoop': [d['pitch_r'], d['plate_z']], 'rim': [d['base_r'], d['wall_z']]}
    if scene['id'] == 'section':
        # Turned as worm_cut() turns it: the worm at -y, seen from +x.
        rail = d['base_r']-d['wall']/2
        points = {'worm': [0, -d['centre_distance'], d['axis_z']], 'mesh': [0, -d['pitch_r'], d['axis_z']],
                  'pin': [0, 0, d['floor_z']+d['pin_gap']], 'rail_l': [0, -rail, d['wall_z']],
                  'rail_r': [0, rail, d['wall_z']], 'top': [0, 0, d['top_z']], 'bottom': [0, 0, 0],
                  'hoop_r': [0, d['pitch_r'], d['axis_z']]}
        return points, {}
    worm_x = (d['worm_x0']+d['worm_x1'])/2
    points = {'worm': at_motor(worm_x, 0, d['axis_z']+d['worm_tip_r']+d['worm_oversize']),
              'motor_pad': at_motor(d['mount_x'], d['mount_arm_y']-3, d['mount_arm_z1']),
              'pad_battery': at_clamp(*d['battery_tip'], d['bracket_top_z']),
              'pad_socket': at_clamp(*d['socket_tip'], d['bracket_top_z']),
              'screw_bracket': at_clamp(d['clamp_r'], 0, d['screw_top_z']),
              'screw_motor': at_motor(d['mount_x'], d['mount_screw_y'], d['mount_top_z']+d['screw_head_height']),
              'cap': turned([d['tip_x']+d['cap_length']-d['socket_depth'], d['switch_y'], d['board_z']+d['switch_z']], 90),
              'rail': turned([d['base_r']-d['wall']/2, 0, d['wall_z']], 215),
              'tube': [0, 0, d['tube_z']]}
    return points, circles

if stage in (None, 'mesh'):
    (CACHE/'wrapper.scad').write_text(WRAPPER)
    teeth = {k: round(float(v.get('motor_rpm', 500))/float(v['rpm'])) for k, v in SETS.items()}
    jobs = {}
    for scene in scenes:
        for piece, name in scene['pieces'].items():
            key = name[:-len(piece)-1]
            jobs[name] = dict(name=name, set=key, piece=piece, turn=turn_teeth(teeth[key]) if piece == 'platform' else 0)
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PUBLISH_JOBS', 6))) as pool:
        info = dict(pool.map(export, jobs.values()))
        stls = list(pool.map(print_file, PARTS))
    dims = {k: info[k+'_platform'] for k in SETS}
    for k in SETS: assert dims[k]['teeth'] == teeth[k], k
    for scene in scenes:
        d = dims[scene['set']]
        scene['marks'], scene['circles'] = marks(scene, d)
        # Engraving floors that get the logo colour: a height, or a radius around the axis.
        scene['engrave'] = {'platform': {'z': d['top_z']-d['logo_depth']}, 'base': {'r': d['base_r']-d['logo_depth']},
                            'bracket': {'z': d['bracket_top_z']-d['logo_depth']},
                            'motor_bracket': {'z': d['mount_arm_z1']-d['logo_depth']}}
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
