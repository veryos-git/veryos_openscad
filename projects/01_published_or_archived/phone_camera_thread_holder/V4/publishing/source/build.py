# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Rebuild the phone mount V4 publishing images and STL files with OpenSCAD, Blender and Pillow.

Stages: --stage=mesh, --stage=render, --stage=compose; all three without one.
--draft renders at half size with fewer samples, for checking only.
"""
import concurrent.futures, json, os, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[3]
CACHE = Path(os.environ.get('PUBLISH_CACHE', ROOT/'.gitignored/phone_mount_V4_publish'))
MODEL = PROJECT/'phone_camera_thread_holderV4.scad'
PRESETS = PROJECT/'phone_camera_thread_holderV4.json'
SCAD = os.environ.get('PUBLISH_OPENSCAD', str(ROOT/'.gitignored/tools/OpenSCAD-nightly.AppImage'))
PREFIX = ['--appimage-extract-and-run'] if SCAD.endswith('.AppImage') else []
ENV = dict(os.environ, QT_QPA_PLATFORM='offscreen')
# Parallel AppImage runs race to extract; their symlink notices are not OpenSCAD warnings.
def warned(log): return re.search(r'^WARNING: (?!could not create symlink)', log, re.M)
stage = next((a.split('=')[1] for a in sys.argv if a.startswith('--stage=')), None)
for folder in (CACHE/'meshes', OUT/'renders', OUT/'images'):
    folder.mkdir(parents=True, exist_ok=True)

# The source with its part selector replaced by one piece at a time, placed as
# in the source's assembly() and print_layout(), so each piece gets its own
# colour. LOGO is the plane of a piece's engraving floor, as [axis, value], so
# the render can colour the engraving.
SELECTOR = re.compile(r'^if \(part == "print_layout"\).*?thread_test\(\);\n', re.M | re.S)
PIECES = '''
piece = "body";
// How far the exploded view pulls the slider and the screw off the body.
spread = 0;
// Cut along the lock screw's axis, keeping the side away from the camera.
section = false;
// The phone is a plain block with chamfered edges, which clear the hook fillets.
phone_length = 160;
echo(LOGO = piece == "body" || piece == "slider" ? [2, logo_depth - block_h]
    : piece == "screw" ? [1, back + screw_head_height + spread - logo_depth]
    : piece == "print_body" ? [0, block_h - logo_depth]
    : piece == "print_slider" ? [0, 2 * block_h - logo_depth + hook_top + layout_gap]
    : piece == "print_screw" ? [1, logo_depth - (screw_head_height + screw_length) / 2]
    : [2, 1e6]);
echo(SCREW = screw_length);
module phone_block()
    translate([0, -phone_width / 2, 0]) hull() {
        translate([0, 0, 1.5]) linear_extrude(phone_thickness - 3) offset(r = 8) square([phone_length - 16, phone_width - 16], center = true);
        linear_extrude(phone_thickness) offset(r = 6.5) square([phone_length - 16, phone_width - 16], center = true);
    }
module cut_open()
    if (section) intersection() {
        children();
        translate([-200, -400, -100]) cube([200, 800, 200]);
    }
    else children();
cut_open() {
    if (piece == "body") body();
    else if (piece == "slider") translate([0, -phone_width - spread, 0]) slider();
    else if (piece == "screw") translate([0, back + screw_head_height + spread, guide_z]) rotate([90, 0, 0]) lock_screw();
    else if (piece == "phone") phone_block();
    else if (piece == "print_body") translate([0, -(sleeve_start + back) / 2, 0]) lay() body();
    else if (piece == "print_slider") translate([block_h + hook_top + layout_gap, -(slider_stop + bar_length - back) / 2, 0]) lay() slider();
    else if (piece == "print_screw") translate([-(hook_top + layout_gap + screw_head_width / (2 * cos(30))), 0, 0]) lock_screw_lying();
}
'''
source = MODEL.read_text()
assert len(SELECTOR.findall(source)) == 1, 'part selector not found in '+MODEL.name

SIZES = ['Everyday', 'Compact phone', 'Thick case', 'Small tablet']
# Long side of the plain block shown as the phone or tablet, for scale only.
PHONE_LENGTHS = {'Everyday': 160, 'Compact phone': 140, 'Thick case': 170, 'Small tablet': 200}
ASSEMBLY = ['body', 'slider', 'screw']
# Each parameter on the Everyday preset, its default in the middle.
VARY = {'phone_thickness': [10, 15, 22], 'holder_width': [26, 30, 44], 'lip_length': [3, 5, 9]}
scenes = [dict(id=s.lower().replace(' ', '_'), preset=s, pieces=ASSEMBLY, view='back') for s in SIZES]
scenes += [dict(id='held_'+s.lower().replace(' ', '_'), preset=s, pieces=ASSEMBLY+['phone'], view='back') for s in SIZES]
scenes += [dict(id='exploded', preset='Everyday', spread=40, pieces=ASSEMBLY, view='back'),
           dict(id='section', preset='Everyday', section=True, pieces=ASSEMBLY+['phone'], view='section'),
           dict(id='print', preset='Everyday', pieces=['print_body', 'print_slider', 'print_screw'], view='print')]
scenes += [dict(id=f'{k}_{v}', preset='Everyday', set={k: v}, pieces=ASSEMBLY, view='front') for k, vs in VARY.items() for v in vs]

def mesh_name(scene, piece):
    """Equal settings give equal names, so each mesh is exported once."""
    preset = json.loads(PRESETS.read_text())['parameterSets'][scene['preset']]
    name = scene['preset'].lower().replace(' ', '_')
    name += ''.join(f'_{k}_{v}' for k, v in sorted(scene.get('set', {}).items()) if preset.get(k) != str(v))
    if scene.get('spread'): name += f'_spread_{scene["spread"]}'
    if scene.get('section'): name += '_section'
    return name+'_'+piece

def export(job):
    out = CACHE/'meshes'/(job['name']+'.off')
    command = [SCAD, *PREFIX, '--backend=manifold', '-o', str(out), '-p', str(PRESETS), '-P', job['preset'],
               *[a for k, v in job['set'].items() for a in ('-D', f'{k}={v}')],
               '-D', f'piece="{job["piece"]}"', '-D', f'spread={job["spread"]}', '-D', f'section={str(job["section"]).lower()}',
               '-D', f'phone_length={PHONE_LENGTHS[job["preset"]]}',
               str(CACHE/'wrapper.scad')]
    log = subprocess.run(command, env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and out.exists(), job['name']+'\n'+log.stderr
    assert not warned(log.stderr), job['name']+'\n'+log.stderr
    return job['name'], dict(logo=json.loads(re.search(r'ECHO: LOGO = (\[.*\])', log.stderr).group(1)),
                             screw=float(re.search(r'ECHO: SCREW = ([\d.]+)', log.stderr).group(1)))

def export_stl(part):
    """The print files: the source defaults, as printed in the photos."""
    out = OUT/f'phone_camera_thread_holderV4_{part}.stl'
    log = subprocess.run([SCAD, *PREFIX, '--backend=manifold', '--export-format', 'binstl', '-o', str(out),
                          '-D', f'part="{part}"', str(MODEL)], env=ENV, capture_output=True, text=True)
    assert log.returncode == 0 and not warned(log.stderr), part+'\n'+log.stderr
    return out.name

if stage in (None, 'mesh'):
    (CACHE/'wrapper.scad').write_text(SELECTOR.sub(lambda m: PIECES, source))
    jobs = {}
    for scene in scenes:
        scene['meshes'] = {piece: mesh_name(scene, piece) for piece in scene['pieces']}
        for piece, name in scene['meshes'].items():
            jobs[name] = dict(name=name, preset=scene['preset'], set=scene.get('set', {}), piece=piece,
                              spread=scene.get('spread', 0), section=scene.get('section', False))
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PUBLISH_JOBS', 4))) as pool:
        echoes = dict(pool.map(export, jobs.values()))
        stls = list(pool.map(export_stl, ['body', 'slider', 'lock_screw', 'thread_test']))
    for scene in scenes:
        scene['logo'] = {piece: echoes[name]['logo'] for piece, name in scene['meshes'].items()}
        scene['screw'] = echoes[scene['meshes'][scene['pieces'][0]]]['screw']
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
