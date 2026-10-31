# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Rebuild the ball socket bracket publishing images with OpenSCAD, Blender and Pillow.

Stages: --stage=mesh, --stage=render, --stage=compose; all three without one.
--draft renders at half size with fewer samples, for checking only.
"""
import concurrent.futures, json, os, re, subprocess, sys, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parent.parent
CACHE = ROOT/'.gitignored/ball_socket_bracket_publish'
MODEL = PROJECT/'ball_socket_bracket.scad'
PRESETS = PROJECT/'ball_socket_bracket.json'
PRINT_FILE = PROJECT/'test1_snap.3mf'
SCAD = os.environ.get('PUBLISH_OPENSCAD', str(ROOT/'.gitignored/tools/OpenSCAD-nightly.AppImage'))
PREFIX = ['--appimage-extract-and-run'] if SCAD.endswith('.AppImage') else []
ENV = dict(os.environ, QT_QPA_PLATFORM='offscreen')
stage = next((a.split('=')[1] for a in sys.argv if a.startswith('--stage=')), None)
for folder in (CACHE/'meshes', OUT/'renders', OUT/'images'):
    folder.mkdir(parents=True, exist_ok=True)

# The pieces of the source's assembly(), each on its own for its own colour.
# The ball can tilt about its centre, and a cut takes away the half that
# part = "section" or "screw_section" takes away.
WRAPPER = f'''include <{MODEL}>
piece = "";
tilt = [0, 0, 0];
cut = "";
echo(str("SCREW_X=", screw_x));
difference() {{
    if (piece == "socket") socket();
    else if (piece == "ball") translate([0, 0, ball_z]) rotate(tilt) rotate([180, 0, 0])
        translate([0, 0, -plate_thickness - ball_h]) ball_part();
    else if (piece == "screw") translate([screw_x, ear_y, screw_z]) rotate([90, 0, 0]) screw();
    if (cut == "ball") translate([-big / 2, -big, -big / 2]) cube(big);
    else if (cut == "screw") translate([screw_x, -big / 2, -big / 2]) cube(big);
}}
'''
TILT = 40
jobs = [dict(id=f'{size}_{piece}', preset=size, piece=piece) for size in ['small','medium','large']
        for piece in ['socket','ball','screw']]
jobs.append(dict(id='tilt_ball', preset='medium', piece='ball', tilt=f'[0, {-TILT}, 0]'))
jobs += [dict(id=f'{name}_{piece}', preset='medium', piece=piece, cut=cut)
         for name, cut in [('section','ball'), ('screwcut','screw')] for piece in ['socket','ball','screw']]

def export(job):
    out = CACHE/'meshes'/(job['id']+'.off')
    # The Customizer's presets apply to the main file only, so pass them as -D.
    preset = json.loads(PRESETS.read_text())['parameterSets'][job['preset']]
    command = [SCAD, *PREFIX, '--backend=manifold', '-o', str(out), '-D', 'part="none"',
               *[a for k, v in preset.items() for a in ('-D', f'{k}={v}')], '-D', f'piece="{job["piece"]}"', '-D', f'cut="{job.get("cut", "")}"',
               '-D', f'tilt={job.get("tilt", "[0, 0, 0]")}', '-D', '$fn=96', str(CACHE/'wrapper.scad')]
    log = subprocess.run(command, env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and out.exists(), job['id']+'\n'+log.stderr
    assert 'WARNING' not in log.stderr, job['id']+'\n'+log.stderr
    return job['id'], float(re.search(r'SCREW_X=([\d.]+)', log.stderr).group(1))

def plate_mesh():
    """The 3mf's one object, as OFF, for the print plate render."""
    with zipfile.ZipFile(PRINT_FILE) as z:
        name = next(n for n in z.namelist() if n.startswith('3D/Objects/') and n.endswith('.model'))
        tree = ET.fromstring(z.read(name))
    ns = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
    verts = [v.attrib for v in tree.iterfind('.//m:vertex', ns)]
    tris = [t.attrib for t in tree.iterfind('.//m:triangle', ns)]
    lines = ['OFF', f'{len(verts)} {len(tris)} 0']
    lines += [f"{v['x']} {v['y']} {v['z']}" for v in verts]
    lines += [f"3 {t['v1']} {t['v2']} {t['v3']}" for t in tris]
    (CACHE/'meshes/plate.off').write_text('\n'.join(lines)+'\n')

scenes = ['small', 'medium', 'large', 'tilt', 'section', 'screwcut', 'plate']
if stage in (None, 'mesh'):
    (CACHE/'wrapper.scad').write_text(WRAPPER)
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PUBLISH_JOBS', 4))) as pool:
        screw_x = dict(pool.map(export, jobs))
    plate_mesh()
    cfg = dict(cache=str(CACHE), output=str(OUT), scenes=scenes,
               cuts={'section': [1, 0.0], 'screwcut': [0, screw_x['screwcut_socket']]})
    (CACHE/'config.json').write_text(json.dumps(cfg, indent=2)+'\n')
    print('MESHES', len(jobs)+1)

if stage in (None, 'render'):
    command = ['blender', '-b', '--factory-startup', '-P', str(HERE/'studio.py'), '--', str(CACHE/'config.json')]
    if '--draft' in sys.argv: command.append('--draft')
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    print('RENDERS', len(scenes))

if stage in (None, 'compose'):
    subprocess.run([sys.executable, str(HERE/'compose.py')], check=True)
