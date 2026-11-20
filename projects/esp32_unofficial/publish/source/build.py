# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Rebuild the ESP32 enclosure V1 publishing images and STL files with OpenSCAD, Blender and Pillow.

Stages: --stage=mesh, --stage=render, --stage=compose; all three without one.
--draft renders at half size with fewer samples, for checking only.
"""
import concurrent.futures, json, os, re, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[1]
NAME = 'esp32_unofficial_enclosureV1'
CACHE = ROOT/'.gitignored/esp32_unofficial_publish'
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
# print_layout, so each piece gets its own colour. The board keeps the
# source's colours through the 3mf.
DIMS = ['wall', 'fit', 'floor_t', 'under', 'pcb_t', 'board_l', 'board_w', 'usb_out', 'pin_row', 'pin_n',
        'pin_x0', 'pins_h', 'top_room', 'wall_top', 'lid_t', 'outer_x', 'outer_y', 'outer_h', 'boss_out',
        'logo_depth', 'support']
WRAPPER = f'''include <{MODEL}>
piece = "";
// Lid and screws raised by lift, the screws in the lid, for the exploded view
lift = 0;
echo(str("DIMS ", [{", ".join(DIMS)}]));
if (piece == "base") base();
else if (piece == "lid") translate([0, 0, wall_top + lift]) lid();
else if (piece == "screws") for (p = fix_pts) translate([p[0], p[1], wall_top + lid_t + lift]) printed_screw();
else if (piece == "board") board();
else if (piece == "print_lid") translate([0, 0, lid_t]) rotate([180, 0, 0]) lid();
else if (piece == "print_screw") screw_lying();
else if (piece == "layout_lid") translate([0, 2 * outer_y + 2 * boss_out + 10, lid_t]) rotate([180, 0, 0]) lid();
else if (piece == "layout_screws") for (i = [0, 1])
    translate([outer_x + 10 + i * (ps_head_w + 6), outer_y / 2, 0]) screw_lying();
'''

FIXES = {'printed': 'Printed screws', 'm3': 'M3 screws', 'push': 'Push-in'}
LIFT = 14
def pieces(fix, lift, lid=True, board=True):
    names = {'base': f'{fix}_base'}
    if lid: names['lid'] = f'{fix}_lid_{lift}'
    if lid and fix == 'printed': names['screws'] = f'printed_screws_{lift}'
    if board: names['board'] = 'board'
    return names

scenes = [dict(id='closed_'+f, fix=f, lift=0, pieces=pieces(f, 0), group='closed') for f in FIXES]
scenes += [dict(id='exploded_'+f, fix=f, lift=LIFT, pieces=pieces(f, LIFT), group='exploded') for f in FIXES]
scenes += [dict(id='top', fix='printed', lift=0, pieces=pieces('printed', 0, lid=False), euler=[0, 0, 0]),
           dict(id='bottom', fix='printed', lift=0, pieces=pieces('printed', 0, lid=False), euler=[0, 180, 0]),
           dict(id='layout', fix='printed', lift=0, direction=[0.35, -1, 2.2],
                pieces={'base': 'printed_base', 'layout_lid': 'printed_layout_lid', 'layout_screws': 'printed_layout_screws'})]

def export(job):
    out = CACHE/'meshes'/(job['name']+'.3mf')
    # The Customizer's presets apply to the main file only, so pass them as -D.
    preset = json.loads(PRESETS.read_text())['parameterSets'][FIXES[job['fix']]]
    command = [SCAD, *PREFIX, '--backend=manifold', '-o', str(out), '-D', 'part="none"',
               *[a for k, v in preset.items() for a in ('-D', f'{k}="{v}"')],
               '-D', f'piece="{job["piece"]}"', '-D', f'lift={job["lift"]}', str(CACHE/'wrapper.scad')]
    log = subprocess.run(command, env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and out.exists(), job['name']+'\n'+log.stderr
    assert not warned(log.stderr), job['name']+'\n'+log.stderr
    dims = json.loads(re.search(r'ECHO: "DIMS (\[.*\])"', log.stderr).group(1))
    outer = re.search(r'ECHO: "outer (.*) mm"', log.stderr).group(1)
    return job['name'], dict(zip(DIMS, dims), outer=[float(v) for v in outer.split(' x ')])

def export_stl(job):
    """The print files: the presets in print orientation."""
    fix, piece = job
    out = OUT/f'{NAME}_{fix}_{piece.replace("print_", "")}.stl'
    preset = json.loads(PRESETS.read_text())['parameterSets'][FIXES[fix]]
    log = subprocess.run([SCAD, *PREFIX, '--backend=manifold', '--export-format', 'binstl', '-o', str(out),
                          '-D', 'part="none"', *[a for k, v in preset.items() for a in ('-D', f'{k}="{v}"')],
                          '-D', f'piece="{piece}"', str(CACHE/'wrapper.scad')], env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and not warned(log.stderr), out.name+'\n'+log.stderr
    return audit(out)

def audit(path):
    """Closed (every edge on exactly two triangles, in opposite directions), positive volume."""
    data = path.read_bytes()
    n = int.from_bytes(data[80:84], 'little')
    tri = np.frombuffer(data[84:84+50*n], dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]))['v']
    _, ids = np.unique(tri.reshape(-1, 3), axis=0, return_inverse=True)
    ids = ids.reshape(-1, 3)
    edges = np.concatenate([ids[:, [0, 1]], ids[:, [1, 2]], ids[:, [2, 0]]])
    keys, counts = np.unique(edges, axis=0, return_counts=True)
    reverse = {tuple(e) for e in keys}
    closed = bool((counts == 1).all() and all((b, a) in reverse for a, b in keys))
    volume = float(np.einsum('ij,ij->i', tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum()/6)
    lo, hi = tri.reshape(-1, 3).min(0), tri.reshape(-1, 3).max(0)
    assert closed and volume > 0 and abs(lo[2]) < 1e-3, f'{path.name}: closed={closed} volume={volume:.1f} z0={lo[2]:.3f}'
    return dict(file=path.name, triangles=n, closed=closed, volume_mm3=round(volume, 1),
                size_mm=[round(float(v), 2) for v in hi-lo])

def marks(d):
    """Points the compose script dimensions, in mm: the board's corners on its
    top face, the pins, the USB-C shell's tip."""
    bx = by = d['wall']+d['fit']
    z = d['floor_t']+d['under']+d['pcb_t']
    m = {'b00': [bx, by, z], 'b10': [bx+d['board_l'], by, z],
         'b01': [bx, by+d['board_w'], z], 'b11': [bx+d['board_l'], by+d['board_w'], z],
         'usb': [bx-d['usb_out'], by+d['board_w']/2, z+1.6],
         'case00': [0, -d['boss_out'], d['wall_top']], 'case11': [d['outer_x'], d['outer_y']+d['boss_out'], d['wall_top']]}
    for r, y in (('A', by+(d['board_w']-d['pin_row'])/2), ('B', by+(d['board_w']+d['pin_row'])/2)):
        for k in range(int(d['pin_n'])):
            m[f'pin{r}{k}'] = [bx+d['pin_x0']+2.54*k, y, z]
    return m

if stage in (None, 'mesh'):
    (CACHE/'wrapper.scad').write_text(WRAPPER)
    jobs = {}
    for scene in scenes:
        for piece, name in scene['pieces'].items():
            jobs[name] = dict(name=name, fix=scene['fix'], piece=piece, lift=scene['lift'])
    stl_jobs = [(f, p) for f in FIXES for p in ['base', 'print_lid']] + [('printed', 'print_screw')]
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PUBLISH_JOBS', 6))) as pool:
        info = dict(pool.map(export, jobs.values()))
        stls = list(pool.map(export_stl, stl_jobs))
    outer = {f: info[f'{f}_base']['outer'] for f in FIXES}
    d = info['printed_base']
    for scene in scenes:
        # Engraving floors that get the logo colour: the base's bottom, the lid's top.
        scene['engrave'] = {'base': d['logo_depth'], 'lid': d['wall_top']+scene['lift']+d['lid_t']-d['logo_depth']}
    cfg = dict(cache=str(CACHE), output=str(OUT), project=str(PROJECT), root=str(ROOT), scenes=scenes,
               dims=d, outer=outer, marks=marks(d))
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
