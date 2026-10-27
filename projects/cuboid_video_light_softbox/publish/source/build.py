# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Rebuild the V5 publishing pack with OpenSCAD, Blender and Pillow."""
import concurrent.futures, hashlib, json, os, re, subprocess, sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parent.parent
CACHE = ROOT / '.gitignored/cuboid_softbox_publish'
MODEL = PROJECT / 'cuboid_video_light_softboxV5.scad'
for folder in (CACHE, CACHE / 'meshes', OUT / 'renders', OUT / 'images'):
    folder.mkdir(parents=True, exist_ok=True)
SCAD = os.environ.get('PUBLISH_OPENSCAD', str(ROOT / '.gitignored/tools/OpenSCAD-nightly.AppImage'))
PREFIX = ['--appimage-extract-and-run'] if SCAD.endswith('.AppImage') else []
ENV = dict(os.environ, QT_QPA_PLATFORM='offscreen')
SOURCE_HASH = hashlib.sha256(MODEL.read_bytes()).hexdigest()
defaults = {k: float(v) for k, v in re.findall(r'^(\w+)\s*=\s*(-?[\d.]+)\s*;', MODEL.read_text(), re.M)}

variants = [
    dict(id='shallow', name='Shallow', params={'softbox_depth': 45}),
    dict(id='standard', name='Standard', params={}),
    dict(id='deep', name='Deep', params={'softbox_depth': 90}),
    dict(id='wide', name='Wide flare', params={'wall_angle': 35, 'wallcover_lip_clearance': 1.5}),
    dict(id='narrow', name='Narrow flare', params={'wall_angle': 18}),
    dict(id='small_light', name='Small light', params={'light_length': 90, 'light_width': 55,
         'light_height': 14, 'clamp_length': 18, 'side_notch_width': 38, 'logo_width': 24, 'frame_logo_width': 9}),
    dict(id='large_light', name='Large light', params={'light_length': 150, 'light_width': 90, 'light_height': 22}),
    dict(id='cutout_small', name='Small cutout', params={'side_notch_width': 36,
         'tripod_cutout_depth': 8, 'tripod_cutout_radius': 2}, cover_only=True),
    dict(id='cutout_default', name='Default cutout', params={}, cover_only=True),
    dict(id='cutout_large', name='Large cutout', params={'side_notch_width': 60,
         'tripod_cutout_depth': 20, 'tripod_cutout_radius': 6}, cover_only=True),
]

# These expressions reproduce the source assembly() and print_layout() transforms.
# Separate material groups allow presentation colors without changing the model.
bodies = {
    'frame': 'frame();',
    'covers': '''for (i = [1, 2]) let(f = side_faces[i]) rotate([0, 0, f[0]])
        face_frame(f[2]) translate([0, 0, -wallcover_thickness])
            wallcover(f[1], i == 1, i == 1);''',
    'screws': '''for (i = [1, 2]) let(f = side_faces[i]) rotate([0, 0, f[0]])
        face_frame(f[2]) for (p = cover_screws(f[1]))
            translate([p.x, p.y, -wallcover_thickness - thumb_head_height]) thumb_screw();
        for (s = [-1, 1]) translate([s * clamp_x, 0, light_height + screw_length + screw_head_height])
            rotate([180, 0, 0]) screw();''',
    'panel': 'wallcover(top_x, true, true);',
    'print_frame': 'translate([0, 0, softbox_depth]) frame();',
    'print_covers': '''g = layout_gap;
        big = cover_bottom_half(top_x); small = cover_bottom_half(top_y);
        row_half = big + small + g / 2;
        lip_reach = max(lip_length, (lip_length + lip_width / 2 - chamfer) / sqrt(2));
        for (k = [0, 1]) translate([0, front_half.y + lip_reach + g + cover_bottom_v + k * (cover_bottom_v + g), 0]) {
            translate([big - row_half, 0, 0]) wallcover(top_x, true, k == 0);
            translate([row_half - small, 0, 0]) wallcover(top_y);
        }''',
    'print_screws': '''g = layout_gap; thumb_pitch = thumb_head_width / cos(30) + g;
        for (i = [0:3], j = [0:3])
            translate([(i - 1.5) * thumb_pitch, (j - 1.5) * (thumb_head_height + thumb_screw_length + g), 0])
                thumb_screw_lying();
        for (s = [-1, 1]) translate([s * (2 * thumb_pitch + (g + screw_head_width / cos(30)) / 2), 0, 0]) screw_lying();''',
}
jobs = []
for v in variants:
    for group in (['panel'] if v.get('cover_only') else ['frame', 'covers', 'screws']):
        jobs.append(dict(id=v['id'] + '_' + group, group=group, params=v['params']))
for group in ['print_frame', 'print_covers', 'print_screws']:
    jobs.append(dict(id=group, group=group, params={}))
cfg = dict(root=str(ROOT), output=str(OUT), cache=str(CACHE), defaults=defaults, variants=variants,
           source_sha256=SOURCE_HASH)
(CACHE / 'config.json').write_text(json.dumps(cfg, indent=2) + '\n')
(OUT / 'variants.json').write_text(json.dumps(dict(source='../cuboid_video_light_softboxV5.scad', variants=variants), indent=2) + '\n')
presets = {v['name']: {**{k: str(x) for k, x in v['params'].items()},
           'part': 'wallcover_tripod' if v.get('cover_only') else 'assembly'} for v in variants}
(OUT / 'presets.json').write_text(json.dumps(dict(fileFormatVersion='1', parameterSets=presets), indent=2) + '\n')

def run(command, log):
    with log.open('w') as stream:
        p = subprocess.run(command, env=ENV, stdout=stream, stderr=subprocess.STDOUT)
    # Concurrent AppImage launchers can race when creating their temporary symlink.
    # Keep that launcher message in the log; all model warnings remain fatal.
    diagnostic = log.read_text().replace('WARNING: could not create symlink\n', '')
    if p.returncode or re.search(r'ERROR:|WARNING:|Traceback', diagnostic):
        raise RuntimeError(f'Command failed; inspect {log}')

def export(job):
    name = job['id']
    wrapper = CACHE / (name + '.scad')
    body = f'// Copyright (C) Jonas Immanuel Frey - Licensed under GPL\ninclude <{MODEL}>\n' + bodies[job['group']] + '\n'
    wrapper.write_text(body)
    output = CACHE / 'meshes' / (name + '.off')
    stamp = output.with_suffix('.sha256')
    signature = hashlib.sha256((SOURCE_HASH + body + json.dumps(job['params']) + SCAD).encode()).hexdigest()
    if output.exists() and stamp.exists() and stamp.read_text() == signature:
        print('CACHED', name, flush=True)
        return
    args = [SCAD, *PREFIX, '--backend=Manifold', '-D', 'part="publish_none"']
    for key, value in job['params'].items():
        args.extend(['-D', key + '=' + json.dumps(value)])
    print('EXPORT', name, flush=True)
    run([*args, '-o', str(output), str(wrapper)], CACHE / (name + '.log'))
    stamp.write_text(signature)

def audit(job):
    path = CACHE / 'meshes' / (job['id'] + '.off')
    lines = path.read_text().splitlines()
    nv, nf, _ = map(int, lines[1].split())
    vertices = [tuple(map(float, line.split()[:3])) for line in lines[2:2+nv]]
    edges, directed, volume = Counter(), Counter(), 0.0
    for line in lines[2+nv:2+nv+nf]:
        f = list(map(int, line.split()[:4]))
        assert f[0] == 3, 'Expected triangulated OFF'
        a, b, c = [vertices[k] for k in f[1:]]
        volume += (a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0])) / 6
        for u, v in zip(f[1:], [f[2], f[3], f[1]]):
            edges[tuple(sorted((u, v)))] += 1
            directed[u, v] += 1
    watertight = all(n == 2 for n in edges.values())
    winding = all(directed[v, u] == n for (u, v), n in directed.items())
    assert nv and nf and watertight and winding and volume > 0, job['id']
    bounds = [[round(fn(p[i] for p in vertices), 5) for i in range(3)] for fn in (min, max)]
    return dict(mesh=job['id'], vertices=nv, triangles=nf, watertight=watertight,
                winding_consistent=winding, volume_mm3=round(volume, 4), bounds_mm=bounds,
                sha256=hashlib.sha256(path.read_bytes()).hexdigest())

def check_presets(records):
    checks = []
    for v in variants:
        group = 'panel' if v.get('cover_only') else 'frame'
        part = 'wallcover_tripod' if v.get('cover_only') else 'frame'
        name = 'preset_' + v['id']
        path = CACHE / 'meshes' / (name + '.off')
        run([SCAD, *PREFIX, '--backend=Manifold', '-p', str(OUT / 'presets.json'), '-P', v['name'],
             '-D', 'part=' + json.dumps(part), '-o', str(path), str(MODEL)], CACHE / (name + '.log'))
        result = audit(dict(id=name))
        reference = next(r for r in records if r['mesh'] == v['id'] + '_' + group)
        expected = [p[:] for p in reference['bounds_mm']]
        if group == 'frame':
            # The printable frame selector translates the assembly frame up by its depth.
            depth = v['params'].get('softbox_depth', defaults['softbox_depth'])
            for p in expected: p[2] += depth
        delta = max(abs(a-b) for p,q in zip(expected,result['bounds_mm']) for a,b in zip(p,q))
        volume_delta = abs(result['volume_mm3']-reference['volume_mm3'])/reference['volume_mm3']
        assert delta < .002 and volume_delta < .0001, 'Preset mismatch: ' + v['name']
        checks.append(dict(preset=v['name'], part=part, bounds_max_error_mm=round(delta,6),
                           relative_volume_error=volume_delta, passed=True))
    (OUT / 'preset-audit.json').write_text(json.dumps(checks,indent=2)+'\n')
    print('VERIFIED',len(checks),'direct preset exports',flush=True)

stage = next((a.split('=')[1] for a in sys.argv if a.startswith('--stage=')), 'all')
if stage in ('all', 'mesh'):
    with concurrent.futures.ThreadPoolExecutor(max_workers=int(os.environ.get('PUBLISH_JOBS', '3'))) as pool:
        list(pool.map(export, jobs))
    assert SOURCE_HASH == hashlib.sha256(MODEL.read_bytes()).hexdigest(), 'Source changed during export'
    records = [audit(job) for job in jobs]
    (OUT / 'mesh-audit.json').write_text(json.dumps(records, indent=2) + '\n')
    print('AUDITED', len(records), 'watertight meshes', flush=True)
    version = subprocess.run([SCAD, *PREFIX, '--version'], env=ENV, capture_output=True, text=True)
    provenance = dict(source='../cuboid_video_light_softboxV5.scad', source_sha256=SOURCE_HASH,
        openscad=(version.stdout + version.stderr).strip(), backend='Manifold',
        geometry='Original V5 modules and source assembly/print-layout transforms. No mesh scaling between variants.',
        presentation='Graphite frame, ivory covers and amber screws. Assembly previews have two covers removed, as in the source.',
        font_requested='Consolas', validation='Digital geometry checks only; pictured variants are not fit-tested.')
    (OUT / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    check_presets(records)
if stage == 'presets':
    check_presets(json.loads((OUT / 'mesh-audit.json').read_text()))
if stage in ('all', 'render'):
    args = ['blender', '-b', '-noaudio', '-t', '8', '--factory-startup', '--python', str(HERE / 'studio.py'), '--', str(CACHE / 'config.json')]
    args += [a for a in sys.argv if a.startswith('--scene=') or a == '--draft']
    print('RENDERING; progress in', CACHE / 'blender.log', flush=True)
    run(args, CACHE / 'blender.log')
if stage in ('all', 'compose'):
    subprocess.run(['/usr/bin/python3', str(HERE / 'compose.py'), str(CACHE / 'config.json')], check=True)
