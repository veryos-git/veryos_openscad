# Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
"""Rebuild the Mikrofonarm Tischklemme V3 publishing images and STL files with OpenSCAD, Blender and Pillow.

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
CACHE = ROOT/'.gitignored/mikrofonarm_tischklemmeV3_publish'
MODEL = PROJECT/'archive/mikrofonarm_tischklemmeV3.scad'
PRESETS = MODEL.with_suffix('.json')
SCAD = os.environ.get('PUBLISH_OPENSCAD', str(ROOT/'.gitignored/tools/OpenSCAD-nightly.AppImage'))
PREFIX = ['--appimage-extract-and-run'] if SCAD.endswith('.AppImage') else []
ENV = dict(os.environ, QT_QPA_PLATFORM='offscreen')
# Parallel AppImage runs race to extract; their symlink notices are not OpenSCAD warnings.
def warned(log): return re.search(r'^WARNING: (?!could not create symlink)', log, re.M)
stage = next((a.split('=')[1] for a in sys.argv if a.startswith('--stage=')), None)
for folder in (CACHE/'meshes', OUT/'renders', OUT/'images'):
    folder.mkdir(parents=True, exist_ok=True)

# Appended to the source, with part = "none": one piece at a time, placed as in
# the source's assembly() and print_layout(), so each piece gets its own colour.
# The arm's pin stands pin_lift out of its hole, so it shows. cut_ pieces keep
# the half behind the clamp's middle, for the section.
DIMS = ['clamp_logo_x', 'screw_logo_y', 'print_screw_logo_z', 'top_jaw_length', 'lower_jaw_length',
        'block_top', 'block_right', 'lower_jaw_top', 'lower_jaw_bottom', 'pin_hole_floor', 'pin_r', 'hole_d',
        'screw_length', 'bar_width', 'cut_y']
PIECES = '''
piece = "clamp";
pin_lift = 0;
table_length = max(70, top_jaw_length + 15);
echo(str("DIMS ", [block_right - logo_depth, clamp_width / 2 + screw_axis_z - logo_depth,
    2 * screw_axis_z - logo_depth, top_jaw_length, lower_jaw_length, block_top, block_right,
    lower_jaw_top, lower_jaw_bottom, pin_hole_floor, pin_r, hole_d, screw_length, bar_width, clamp_width / 2]));
module placed_screw() translate([pin_x, clamp_width / 2, -table_shown - screw_length - bar_width]) screw();
module placed_pin() translate([pin_x, pin_y, block_top - 30 + pin_lift]) cylinder(d = 12.5, h = 30);
module placed_table() translate([inner_radius, 0, -table_shown]) cube([table_length, clamp_width + 30, table_shown]);
module back_half() translate([-500, clamp_width / 2, -500]) cube(1000);
if (piece == "clamp") clamp();
else if (piece == "screw") placed_screw();
else if (piece == "pin") placed_pin();
else if (piece == "table") placed_table();
else if (piece == "print_clamp") clamp_print();
else if (piece == "print_screw") translate([top_jaw_length + 5 + bar_length / 2, 0, 0]) screw_print();
else if (piece == "cut_clamp") intersection() { clamp(); back_half(); }
else if (piece == "cut_screw") intersection() { placed_screw(); back_half(); }
else if (piece == "cut_pin") intersection() { placed_pin(); back_half(); }
else if (piece == "cut_table") intersection() { placed_table(); back_half(); }
'''
source = MODEL.read_text()
P = json.loads(PRESETS.read_text())['parameterSets']

VARIANTS = [('printed', 'Printed'), ('thin', 'Thin desk'), ('thick', 'Thick desk'), ('far', 'Far from edge')]
scenes = [dict(id=i, preset=p, set={'pin_lift': 15}, view='three_quarter', pieces=['clamp', 'screw', 'pin', 'table'])
          for i, p in VARIANTS]
# Side views without the table: the screw all the way in, its tip at the thinnest table.
def side(preset, **values):
    return dict(set={'table_shown': float(P[preset]['table_min']), **values}, preset=preset, view='side',
                pieces=['clamp', 'screw'])
scenes += [dict(id='side_'+i, **side(p)) for i, p in VARIANTS[:3]]
scenes += [dict(id=f'side_pin{x}', **side('Printed', pin_x=x)) for x in (14, 40)]
scenes += [dict(id='section', preset='Printed', set={}, view='side', pieces=['cut_clamp', 'cut_screw', 'cut_pin', 'cut_table']),
           dict(id='print', preset='Printed', set={}, view='print', pieces=['print_clamp', 'print_screw'])]

def piece_set(scene, piece):
    """The scene's settings that change this piece: pin_lift only moves the pin."""
    return {k: v for k, v in scene['set'].items() if k != 'pin_lift' or piece == 'pin'}

def mesh_name(scene, piece):
    """Equal settings give equal names, so each mesh is exported once."""
    preset = P[scene['preset']]
    changed = sorted((k, v) for k, v in piece_set(scene, piece).items() if float(preset.get(k, 'nan')) != v)
    return scene['preset'].lower().replace(' ', '_')+''.join(f'_{k}{v:g}' for k, v in changed)+'_'+piece

def export(job):
    out = CACHE/'meshes'/(job['name']+'.off')
    command = [SCAD, *PREFIX, '--backend=manifold', '-o', str(out), '-p', str(PRESETS), '-P', job['preset'],
               *[a for k, v in job['set'].items() for a in ('-D', f'{k}={v}')],
               '-D', 'part="none"', '-D', f'piece="{job["piece"]}"', str(CACHE/'wrapper.scad')]
    log = subprocess.run(command, env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and out.exists(), job['name']+'\n'+log.stderr
    assert not warned(log.stderr), job['name']+'\n'+log.stderr
    dims = json.loads(re.search(r'ECHO: "DIMS (\[.*\])"', log.stderr).group(1))
    return job['name'], dict(zip(DIMS, dims))

def closed(path):
    """Volume of a binary STL, after checking that every edge has two faces."""
    data = path.read_bytes()
    tri = np.frombuffer(data, dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]), offset=84)['v']
    # Exact coordinates: the thread has vertices closer than any rounding.
    keys = np.unique(tri.reshape(-1, 3), axis=0, return_inverse=True)[1].reshape(-1, 3)
    tri = tri.astype(float)
    edges = np.sort(np.concatenate([keys[:, [0, 1]], keys[:, [1, 2]], keys[:, [2, 0]]]), axis=1)
    counts = np.unique(edges, axis=0, return_counts=True)[1]
    assert (counts == 2).all(), f'{path.name}: open or non-manifold edges'
    return np.einsum('ij,ij->i', tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum()/6000

def export_stl(part):
    """The print files: the Printed preset, as in the photos and the 3mf."""
    out = OUT/f'mikrofonarm_tischklemmeV3_{part}.stl'
    log = subprocess.run([SCAD, *PREFIX, '--backend=manifold', '--export-format', 'binstl', '-o', str(out),
                          '-p', str(PRESETS), '-P', 'Printed', '-D', f'part="{part}"', str(MODEL)],
                         env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and not warned(log.stderr), part+'\n'+log.stderr
    volume = closed(out)
    assert volume > 0, out.name
    return f'{out.name} {volume:.1f} cm3'

if stage in (None, 'mesh'):
    (CACHE/'wrapper.scad').write_text(source+PIECES)
    jobs = {}
    for scene in scenes:
        scene['meshes'] = {piece: mesh_name(scene, piece) for piece in scene['pieces']}
        for piece, name in scene['meshes'].items():
            jobs[name] = dict(name=name, preset=scene['preset'], piece=piece, set=piece_set(scene, piece))
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PUBLISH_JOBS', 4))) as pool:
        dims = dict(pool.map(export, jobs.values()))
        stls = list(pool.map(export_stl, ['clamp', 'screw']))
    for scene in scenes:
        scene['dims'] = dims[next(iter(scene['meshes'].values()))]
        scene['values'] = {k: float(v) for k, v in {**P[scene['preset']], **scene['set']}.items()}
    cfg = dict(cache=str(CACHE), output=str(OUT), scenes=scenes)
    (CACHE/'config.json').write_text(json.dumps(cfg, indent=2)+'\n')
    print('MESHES', len(jobs), 'STL', *stls)

if stage in (None, 'render'):
    command = ['blender', '-b', '--factory-startup', '-P', str(HERE/'studio.py'), '--', str(CACHE/'config.json')]
    if '--draft' in sys.argv: command.append('--draft')
    command += [a for a in sys.argv if a.startswith('--scene=')]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    print('RENDERS', len(scenes))

if stage in (None, 'compose'):
    subprocess.run([sys.executable, str(HERE/'compose.py'), str(CACHE/'config.json')], check=True)
