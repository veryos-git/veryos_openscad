# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Rebuild the OMM enclosure V7 publishing images and STL files with OpenSCAD, Blender and Pillow.

Stages: --stage=mesh, --stage=render, --stage=compose; all three without one.
--draft renders at half size with fewer samples, for checking only.
"""
import concurrent.futures, json, os, re, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[2]
NAME = 'omm_enclosureV7'
CACHE = ROOT/'.gitignored/omm_enclosure_publish'
MODEL = PROJECT/(NAME+'.scad')
SCAD = os.environ.get('PUBLISH_OPENSCAD', str(ROOT/'.gitignored/tools/OpenSCAD-nightly.AppImage'))
PREFIX = ['--appimage-extract-and-run'] if SCAD.endswith('.AppImage') else []
ENV = dict(os.environ, QT_QPA_PLATFORM='offscreen')
# Parallel AppImage runs race to extract; their symlink notices are not OpenSCAD warnings.
def warned(log): return re.search(r'^WARNING: (?!could not create symlink)', log, re.M)
stage = next((a.split('=')[1] for a in sys.argv if a.startswith('--stage=')), None)
for folder in (CACHE/'meshes', OUT/'renders', OUT/'images'):
    folder.mkdir(parents=True, exist_ok=True)

# The source's base, lid and the pieces of its boards(), each on its own so
# each gets its own colour. Not in the source, drawn to explain esp_under:
# the jumper wires' housings on the ESP32's pins, 14 long as its comment says.
DIMS = ['wall', 'floor_t', 'lid_t', 'inner_h', 'inner_x', 'inner_y', 'outer_x', 'outer_y', 'outer_h', 'rib_out',
        'post', 'post_centers', 'esp_x0', 'esp_pocket_w', 'esp_pocket_len', 'esp_wall', 'esp_slot_w', 'esp_slot_end',
        'esp_rail_w', 'esp_rail_base_w', 'esp_rail_step', 'pcb_t', 'esp_under', 'esp_top', 'esp_window_n',
        'esp_window_w', 'esp_window_gap', 'esp_window_h', 'mod_w', 'mod_h', 'mod_pad_y', 'usb_dx', 'usb_h',
        'usb_window_w', 'usb_window_h', 'usb_cx', 'usb_cz', 'pillar_gap', 'uln_n', 'uln_x', 'uln_y', 'uln_x0',
        'uln_y0', 'uln_y1', 'uln_pitch', 'uln_jst_x', 'uln_standoff_h', 'rail_len', 'rail_w', 'rail_x0', 'rail_cx',
        'rail_depth', 'rail_wall', 'rail_tab', 'rail_slit_w', 'cable_slot_w', 'cable_slot_h', 'cable_pass_h',
        'cable_slot_x', 'supply_slot_w', 'supply_slot_x', 'screw_hole', 'logo_depth', 'lift', 'rise', 'housing', 'cut_y',
        'cut_x']
BOARDS = ['esp_pcb', 'esp_can', 'esp_usb', 'esp_headers', 'esp_pins', 'uln_pcb', 'uln_jst', 'rail']
WRAPPER = f'''include <{MODEL}>
piece = "";
// The lid lifted off the base, the boards out of their places, by this much
lift = 0;
rise = 0;
// "esp": the slab behind the plane through the lid's pillars on the ESP32's can, toward the back wall
cut = "";
// The jumper wires' housings on the ESP32's pins: 14 long, as the comment on esp_under says
housing = 14;
// The plane: the middle of the can's pillars, in pocket y; the slab's ends in x
cut_y = wall + inner_y - (esp_pocket_len - (mod_pad_y[0] + mod_pad_y[1]) / 2);
cut_x = [-rib_out - 0.5, 56];
echo(str("DIMS ", [{", ".join(DIMS)}]));
// As in boards(): the ESP32 board's corner, its headers
module on_esp() translate([0, 0, floor_t + rise]) at_esp() translate([(esp_pocket_w - 28) / 2, 0.5, esp_under]) children();
module along_headers(z, h) on_esp() for (m = [0, 1]) translate([m ? 28 : 0, 0, 0]) mirror([m, 0, 0])
    translate([0.05, 63.5 - esp_slot_end - 55.88, z]) cube([2.54, 55.88, h]);
module one(p) {{
    if (p == "base") base();
    else if (p == "lid") translate([0, 0, floor_t + inner_h + lift]) lid();
    else if (p == "esp_pcb") on_esp() cube([28, 63.5, pcb_t]);
    else if (p == "esp_can") on_esp() translate([5, 63.5 - 25.5, pcb_t]) cube([mod_w, 25.5, mod_h]);
    else if (p == "esp_usb") on_esp() for (x = [14 - usb_dx / 2, 14 + usb_dx / 2]) translate([x - 4.5, -1.3, pcb_t]) cube([9, 8.3, usb_h]);
    else if (p == "esp_headers") along_headers(-2.5, 2.5);
    else if (p == "esp_pins") on_esp() for (m = [0, 1]) translate([m ? 28 : 0, 0, 0]) mirror([m, 0, 0])
        for (k = [0 : 21]) translate([1.32 - 0.32, 63.5 - esp_slot_end - 1.27 - 2.54 * k - 0.32, -8.5]) cube([0.64, 0.64, 8.5]);
    else if (p == "housings") along_headers(-2.5 - housing, housing);
    else if (p == "uln_pcb") for (k = [0 : uln_n - 1]) translate([uln_x0 + k * uln_pitch, uln_y0, floor_t + rise + uln_standoff_h])
        cube([uln_x, uln_y, pcb_t]);
    else if (p == "uln_jst") for (k = [0 : uln_n - 1]) translate([uln_x0 + k * uln_pitch, uln_y0, floor_t + rise + uln_standoff_h])
        translate([uln_jst_x - 3, uln_y - 18, pcb_t]) cube([6, 14, 7]);
    else if (p == "rail") translate([rail_x0, wall + rail_wall + rail_tab, floor_t + rise]) cube([rail_len, rail_w, 9]);
    // As in the source's print_layout
    else if (p == "lay_base") base();
    else if (p == "lay_lid") translate([outer_x + 2 * rib_out + 10, outer_y, lid_t]) rotate([180, 0, 0]) lid();
    // The print files: the base as it stands, the lid top face down
    else if (p == "print_base") base();
    else if (p == "print_lid") translate([0, outer_y, lid_t]) rotate([180, 0, 0]) lid();
    // The pieces of boards() together, held against boards() itself
    else if (p == "my_boards") for (b = [{", ".join(f'"{b}"' for b in BOARDS)}]) one(b);
    else if (p == "boards") boards();
    else if (p == "lay_all") {{ one("lay_base"); one("lay_lid"); }}
}}
if (cut == "esp") intersection() {{ one(piece); translate([cut_x[0], cut_y, -1]) cube([cut_x[1] - cut_x[0], 100, 100]); }}
else one(piece);
'''

POSES = {'open': dict(rise=45), 'closed': {}, 'cut': dict(cut='"esp"'), 'layout': {}}
INSIDE = ['base', 'lid'] + BOARDS
def pieces(pose, names): return {p: f'{pose}_{p}' for p in names}

# The boards lifted out of the base; the lid has the other views
scenes = [dict(id='inside', pose='open', pieces=pieces('open', ['base']+BOARDS), direction=[.55, -1, 1.25]),
          # The same scale for both: from behind and from the front
          dict(id='back', pose='closed', pieces=pieces('closed', INSIDE), direction=[.45, 1, .5], group='walls'),
          dict(id='front', pose='closed', pieces=pieces('closed', INSIDE), direction=[-.45, -1, .5], group='walls'),
          # The rail and the drivers' plugs lie in front of the plane or beside the slab
          dict(id='cut', pose='cut', direction=[0, -1, 0], front_light=True,
               pieces=pieces('cut', ['base', 'lid', 'esp_pcb', 'esp_can', 'esp_usb', 'esp_headers', 'housings', 'uln_pcb'])),
          dict(id='layout', pose='layout', pieces=pieces('layout', ['lay_base', 'lay_lid']), direction=[-.1, -1, 1.6])]

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
    log = openscad(out, dict(POSES[job['pose']], part='"none"', piece=f'"{job["piece"]}"'), CACHE/'wrapper.scad')
    assert log.returncode == 0 and out.exists(), job['name']+'\n'+log.stderr
    assert not warned(log.stderr), job['name']+'\n'+log.stderr
    dims = json.loads(re.search(r'ECHO: "DIMS (\[.*\])"', log.stderr).group(1))
    return job['name'], dict(zip(DIMS, dims))

def stl(piece, source=None, values=None):
    """A piece of the wrapper, or a part of the source, as triangles."""
    out = CACHE/'meshes'/f'check_{piece}.stl'
    log = openscad(out, values or dict(part='"none"', piece=f'"{piece}"'), source or CACHE/'wrapper.scad')
    assert log.returncode == 0 and not warned(log.stderr), piece+'\n'+log.stderr
    return out

def print_file(part):
    """The print files: the project's STLs in print orientation, the base as
    it is, the lid turned over about x onto the bed. Each is held against a
    fresh export of the source (volume and place) and checked for a closed
    mesh. Manifold's own export of the base is not used: it has edges on four
    triangles where the corner posts meet the walls' inner corners."""
    out = OUT/f'{NAME}_{part}.stl'
    tri = triangles(PROJECT/out.name)
    if part == 'lid': tri = tri*[1, -1, -1]+[0, tri[..., 1].max()+tri[..., 1].min(), tri[..., 2].max()]
    write_stl(out, tri, f'OMM enclosure {NAME[-2:]} {part}')
    (v0, lo0, hi0), (v1, lo1, hi1) = measure(triangles(out)), measure(triangles(stl('print_'+part)))
    assert abs(v0-v1) < 1e-3*v1 and np.abs(np.concatenate([lo0-lo1, hi0-hi1])).max() < 1e-2, \
        f'{out.name} is not the source in print orientation: {v0:.2f} mm3 against {v1:.2f}'
    return audit(out)

def write_stl(path, tri, header):
    """Binary STL, normals of length 1."""
    n = np.cross(tri[:, 1]-tri[:, 0], tri[:, 2]-tri[:, 0])
    n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
    rec = np.zeros(len(tri), dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]))
    rec['n'], rec['v'] = n, tri
    path.write_bytes(header.encode().ljust(80)+len(tri).to_bytes(4, 'little')+rec.tobytes())

def triangles(path):
    """Binary or ASCII STL."""
    data = path.read_bytes()
    if data[:5] == b'solid' and b'facet' in data[:300]:
        return np.array(re.findall(rb'vertex\s+(\S+)\s+(\S+)\s+(\S+)', data), dtype=float).reshape(-1, 3, 3)
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
    def esp(px, py, pz):
        """A point in the source's pocket coordinates, in the box."""
        return [d['esp_x0']+d['esp_pocket_w']-px, d['wall']+d['inner_y']-py, d['floor_t']+pz]
    def board(bx, by, bz): return esp((d['esp_pocket_w']-28)/2+bx, .5+by, d['esp_under']+d['rise']+bz)
    top, slot = d['floor_t']+d['inner_h'], d['floor_t']+d['inner_h']-d['cable_pass_h']/2
    if scene['id'] == 'inside':
        k = d['uln_n']-1
        return {'esp': board(14, 20, d['pcb_t']), 'can': board(14, 52, d['pcb_t']+d['mod_h']),
                'uln': [d['uln_x0']+k*d['uln_pitch']+8, d['uln_y0']+6, d['floor_t']+d['rise']+d['uln_standoff_h']+d['pcb_t']],
                'rail': [d['rail_cx']+24, d['wall']+d['rail_depth']/2, d['floor_t']+d['rise']+9],
                'pocket': esp(d['esp_pocket_w']/2, 40, d['esp_under']), 'standoffs': [d['uln_x0']+k*d['uln_pitch']+2.5, d['uln_y0']+2.6, d['floor_t']+d['uln_standoff_h']],
                'rail_pocket': [d['rail_x0']+10, d['wall']+d['rail_depth']-d['rail_wall'], d['floor_t']+8],
                'post': [*d['post_centers'][2], top]}
    if scene['id'] in ('back', 'front'):
        return {'usb': [d['usb_cx'], d['outer_y'], d['usb_cz']], 'supply': [d['supply_slot_x'], 0, slot],
                **{f'slot_{i}': [x, d['outer_y'], slot] for i, x in enumerate(d['cable_slot_x'])}, 'lid': [d['outer_x']/2, d['outer_y']/2, top+d['lid_t']]}
    if scene['id'] == 'cut':
        y, s, w = d['cut_y'], d['esp_slot_w'], d['esp_pocket_w']
        pillar = (w-d['mod_w'])/2+.5+2
        can = d['esp_top']+d['mod_h']
        housing = (w-28)/2+.05+1.27
        def at(px, pz): return [esp(px, 0, pz)[0], y, d['floor_t']+pz]
        return {'floor': at(w/2, 0), 'under': at(w/2, d['esp_under']), 'pillar': at(pillar, can+d['pillar_gap']+2.5),
                'gap': at(pillar-1, can+d['pillar_gap']/2), 'can': at(w/2+3, can-d['mod_h']/2), 'pcb': at(w/2-8, d['esp_under']+d['pcb_t']/2),
                # The slot's mark above the rail's, so that their leaders do not cross
                'rail_l': at(w-s-d['esp_rail_w']/2, d['esp_under']-1.6), 'slot_l': at(w-s/2, d['esp_under']-.7),
                'housing_l': at(w-housing, d['esp_under']-2.5-d['housing']/2),
                # Its bend beside esp_under's line, which stands in the pocket's middle
                'wire_0': at(w-housing, d['esp_under']-2.5-d['housing']-1), 'wire_1': at(w-housing, 8), 'wire_2': at(w/2+6, 5),
                'wire_3': at(-8, 5), 'window': at(w-s-1, d['esp_window_h']/2), 'open': at(-1.5, d['esp_under']-10),
                'uln': [d['uln_x0']+6, y, d['floor_t']+d['uln_standoff_h']+d['pcb_t']]}
    if scene['id'] == 'layout':
        gap = d['outer_x']+2*d['rib_out']+10
        return {'base': [d['outer_x']/2, d['outer_y']/2, d['floor_t']], 'lid': [gap+d['outer_x']/2, d['outer_y']/2, d['lid_t']+3]}

def engraving(scene, d):
    """The heights of the engravings' floors, which get a second colour."""
    if scene['pose'] == 'layout': return {}
    return {'base': [d['floor_t']-d['logo_depth']], 'lid': [d['floor_t']+d['inner_h']+d['lift']+d['lid_t']-d['logo_depth']]}

if stage in (None, 'mesh'):
    (CACHE/'wrapper.scad').write_text(WRAPPER)
    jobs = {name: dict(name=name, pose=scene['pose'], piece=piece) for scene in scenes for piece, name in scene['pieces'].items()}
    with concurrent.futures.ThreadPoolExecutor(int(os.environ.get('PUBLISH_JOBS', 6))) as pool:
        info = dict(pool.map(export, jobs.values()))
        stls = list(pool.map(print_file, ['base', 'lid']))
        # The pieces are the source's boards() and print_layout
        checks = list(pool.map(lambda a: measure(triangles(stl(*a))), [('my_boards',), ('boards',), ('lay_all',),
                                                                        ('print_layout', MODEL, dict(part='"print_layout"'))]))
    for (va, loa, hia), (vb, lob, hib) in (checks[:2], checks[2:]):
        assert abs(va-vb) < 1e-3*vb and np.abs(np.concatenate([loa-lob, hia-hib])).max() < 1e-3, 'boards() or print_layout has changed'
    for scene in scenes:
        d = info[next(iter(scene['pieces'].values()))]
        scene['marks'], scene['engrave'] = marks(scene, d), engraving(scene, d)
        if scene['pose'] == 'cut': scene['cut_y'] = d['cut_y']
    cfg = dict(cache=str(CACHE), output=str(OUT), project=str(PROJECT), root=str(ROOT), scenes=scenes, dims=info['closed_base'])
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
