# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Rebuild the baby wipes box V4 publishing images and STL files with OpenSCAD, Blender and Pillow.

Stages: --stage=mesh, --stage=render, --stage=compose; all three without one.
--draft renders at half size with fewer samples, for checking only.
"""
import concurrent.futures, json, os, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[3]
CACHE = ROOT/'.gitignored/babywipesboxV4_publish'
MODEL = PROJECT/'babywipesboxV4.scad'
PRESETS = PROJECT/'babywipesboxV4.json'
SCAD = os.environ.get('PUBLISH_OPENSCAD', str(ROOT/'.gitignored/tools/OpenSCAD-nightly.AppImage'))
PREFIX = ['--appimage-extract-and-run'] if SCAD.endswith('.AppImage') else []
ENV = dict(os.environ, QT_QPA_PLATFORM='offscreen')
# Parallel AppImage runs race to extract; their symlink notices are not OpenSCAD warnings.
def warned(log): return re.search(r'^WARNING: (?!could not create symlink)', log, re.M)
stage = next((a.split('=')[1] for a in sys.argv if a.startswith('--stage=')), None)
for folder in (CACHE/'meshes', OUT/'renders', OUT/'images'):
    folder.mkdir(parents=True, exist_ok=True)

# The source with its part selector replaced by one piece at a time, placed as
# in the source's assembly() and print_layout, so each piece gets its own colour.
MARKER = '// Each export has its lowest surface at Z=0.'
PIECES = '''
piece = "box";
if (piece == "box") box();
else if (piece == "cover") translate([0, 0, box_height]) boxcover();
else if (piece == "lid") translate([0, 0, box_height]) moving_lid(lid_angle);
else if (piece == "print_cover") translate([0, outer_depth + layout_gap, cover_insert_depth]) boxcover();
else if (piece == "print_lid") translate([outer_width / 2 + layout_gap + lid_w / 2, 0, -seat_bottom_z]) boxcover_lid();
'''
source = MODEL.read_text()
assert source.count(MARKER) == 1, 'part selector not found in '+MODEL.name

SIZES = ['Everyday', 'Cube', 'Long', 'Tall']
PATTERNS = ['none', 'ribs', 'flutes', 'spiral', 'diamond', 'waves', 'chevron']
ASSEMBLY = ['box', 'cover', 'lid']
scenes = [dict(id=s.lower(), preset=s, lid=0, pieces=ASSEMBLY) for s in SIZES]
scenes += [dict(id='pattern_'+p, preset='Everyday', set={'exterior_pattern': p}, lid=0, pieces=ASSEMBLY) for p in PATTERNS]
scenes += [dict(id=c, preset='Everyday', set={'corner_style': c}, lid=110, pieces=ASSEMBLY) for c in ['rectangular', 'rounded']]
scenes += [dict(id='logo', preset='Everyday', pieces=['box']),
           dict(id='print', preset='Everyday', pieces=['box', 'print_cover', 'print_lid'])]

def mesh_name(scene, piece):
    """Equal settings give equal names, so each mesh is exported once."""
    preset = json.loads(PRESETS.read_text())['parameterSets'][scene['preset']]
    name = scene['preset'].lower()+''.join(f'_{v}' for k, v in sorted(scene.get('set', {}).items()) if preset.get(k) != v)
    return name+'_'+piece+(f'_{scene["lid"]}' if piece == 'lid' else '')

def export(job):
    out = CACHE/'meshes'/(job['name']+'.off')
    command = [SCAD, *PREFIX, '--backend=manifold', '-o', str(out), '-p', str(PRESETS), '-P', job['preset'],
               *[a for k, v in job['set'].items() for a in ('-D', f'{k}="{v}"')],
               '-D', f'piece="{job["piece"]}"', '-D', f'lid_angle={job["lid"]}', str(CACHE/'wrapper.scad')]
    log = subprocess.run(command, env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and out.exists(), job['name']+'\n'+log.stderr
    assert not warned(log.stderr), job['name']+'\n'+log.stderr
    return job['name'], re.findall(r'ECHO: "(.*)"', log.stderr)

def export_stl(part):
    """The print files: the source defaults, as printed in the photos."""
    out = OUT/f'babywipesboxV4_{part}.stl'
    log = subprocess.run([SCAD, *PREFIX, '--backend=manifold', '--export-format', 'binstl', '-o', str(out),
                          '-D', f'part="{part}"', str(MODEL)], env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and not warned(log.stderr), part+'\n'+log.stderr
    return out.name

if stage in (None, 'mesh'):
    (CACHE/'wrapper.scad').write_text(source.split(MARKER)[0]+PIECES)
    jobs = {}
    for scene in scenes:
        scene['meshes'] = {piece: mesh_name(scene, piece) for piece in scene['pieces']}
        for piece, name in scene['meshes'].items():
            jobs[name] = dict(name=name, preset=scene['preset'], set=scene.get('set', {}), piece=piece, lid=scene.get('lid', 0))
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PUBLISH_JOBS', 4))) as pool:
        echoes = dict(pool.map(export, jobs.values()))
        stls = list(pool.map(export_stl, ['box', 'boxcover', 'boxcover_lid']))
    for scene in scenes:
        scene['echo'] = echoes[scene['meshes']['box']]
    defaults = {k: float(re.search(rf'^{k} = ([\d.]+);', source, re.M).group(1)) for k in ['bottom_thickness', 'logo_depth']}
    cfg = dict(cache=str(CACHE), output=str(OUT), scenes=scenes,
               logo_z=round(defaults['bottom_thickness']-defaults['logo_depth'], 4))
    (CACHE/'config.json').write_text(json.dumps(cfg, indent=2)+'\n')
    print('MESHES', len(jobs), 'STL', *stls)

if stage in (None, 'render'):
    command = ['blender', '-b', '--factory-startup', '-P', str(HERE/'studio.py'), '--', str(CACHE/'config.json')]
    if '--draft' in sys.argv: command.append('--draft')
    if '--scene' in ' '.join(sys.argv): command += [a for a in sys.argv if a.startswith('--scene=')]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    print('RENDERS', len(scenes))

if stage in (None, 'compose'):
    subprocess.run([sys.executable, str(HERE/'compose.py'), str(CACHE/'config.json')], check=True)
