# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Compose the publication PNGs from the CAD renders and the brand assets."""
import io, json, math, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageOps
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

cfg = json.loads(Path(sys.argv[1]).read_text())
OUT, ROOT = Path(cfg['output']), Path(cfg['root'])
D = cfg['dims']
# Brand: Ivory background, Graphite ink, Ochre accent on ivory.
BG, INK, MUTE, LINE, OCHRE = '#F4EFE3', '#151B1D', '#5D6461', '#D9D2C3', '#B77B1E'
FONT = os.environ.get('PUBLISH_FONT') or subprocess.check_output(['fc-match', '-f', '%{file}', 'DejaVu Sans Mono'], text=True)
FAMILY = ImageFont.truetype(FONT, 20).getname()[0]
BOLD = os.environ.get('PUBLISH_FONT_BOLD') or subprocess.check_output(['fc-match', '-f', '%{file}', FAMILY+':style=Bold'], text=True)
ICC = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
NOT_PRINTED = 'V7 IS NOT PRINTED YET'
fonts = {}

def font(size, bold=False):
    if (size, bold) not in fonts: fonts[size, bold] = ImageFont.truetype(BOLD if bold else FONT, size)
    return fonts[size, bold]

def text(x, y, s, size=32, fill=INK, bold=False, maxwidth=None, anchor='la'):
    if maxwidth:
        while draw.textlength(s, font=font(size, bold)) > maxwidth: size -= 1
    draw.text((x, y), s, font=font(size, bold), fill=fill, anchor=anchor)

def svg_logo(width):
    """veryos_logo.svg as drawn, filled in Graphite."""
    h = round(width*31.2528266758/43.9095293518)
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, h)
    rect = Rsvg.Rectangle(); rect.x = 0; rect.y = 0; rect.width = width; rect.height = h
    Rsvg.Handle.new_from_data((ROOT/'veryos_logo.svg').read_bytes()).render_document(cairo.Context(surface), rect)
    stream = io.BytesIO(); surface.write_to_png(stream); stream.seek(0)
    mark = Image.new('RGBA', (width, h), INK)
    mark.putalpha(Image.open(stream).getchannel('A'))
    return mark

logo = svg_logo(86)
scad = Image.open(ROOT/'projects/01_published_or_archived/fdm_optimized_screws/publish/source/assets/openscad.png').convert('RGBA')
scad.thumbnail((64, 64), Image.Resampling.LANCZOS)
info = {r['id']: r for r in json.loads((OUT/'renders/render-info.json').read_text())}
renders = {k: Image.open(OUT/'renders'/(k+'.png')).convert('RGBA') for k in info}
for name, pic in renders.items():
    assert pic.size == (1800, 1500) or '--draft' in sys.argv, 'Render at publication resolution first: '+name
    b = pic.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
    assert b and b[0] > 0 and b[1] > 0 and b[2] < pic.width and b[3] < pic.height, 'Clipped render: '+name

def visible(name):
    return renders[name].getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()

def place(name, box, f=None, bottom=False):
    """A render cropped tight and fitted into box, at factor f if given.
    Returns where a mark of the render lands in the image."""
    x, y, w, h = box
    crop = visible(name)
    p = renders[name].crop(crop)
    f = f or min(w/p.width, h/p.height)
    p = p.resize((round(p.width*f), round(p.height*f)), Image.Resampling.LANCZOS)
    ox, oy = round(x+(w-p.width)/2), round(y+h-p.height if bottom else y+(h-p.height)/2)
    im.alpha_composite(p, (ox, oy))
    marks = info[name]['marks']
    return lambda key: (ox+(marks[key][0]-crop[0])*f, oy+(marks[key][1]-crop[1])*f)

def row(names, box, gap=70):
    """Renders that share a camera scale side by side at one factor, so their
    sizes compare, standing on the bottom of box. Returns each one's left,
    top and right edge and its marks."""
    x, y, w, h = box
    sizes = [(visible(n)[2]-visible(n)[0], visible(n)[3]-visible(n)[1]) for n in names]
    f = min((w-gap*(len(names)-1))/sum(s[0] for s in sizes), h/max(s[1] for s in sizes))
    left = x+(w-f*sum(s[0] for s in sizes)-gap*(len(names)-1))/2
    out = []
    for n, (sw, sh) in zip(names, sizes):
        at = place(n, (round(left), y, round(sw*f), h), f, bottom=True)
        out.append((round(left), round(y+h-sh*f), round(left+sw*f), at))
        left += sw*f+gap
    return out

def new(section, size=(2400, 1800)):
    global im, draw, W, H
    W, H = size; im = Image.new('RGBA', size, BG); draw = ImageDraw.Draw(im)
    im.alpha_composite(logo, (100, 52))
    text(210, 64, 'Very', 38, bold=True)
    text(210+draw.textlength('Very', font=font(38, True)), 64, 'OS', 38, OCHRE, True)
    im.alpha_composite(scad, (W-370, 49)); text(W-288, 67, 'OpenSCAD', 30)
    draw.line((100, 150, W-100, 150), fill=LINE, width=2)
    text(100, 194, section, 26, OCHRE, True, maxwidth=W-200)

def heading(title, subtitle):
    text(95, 251, title, 84, bold=True, maxwidth=W-190)
    text(100, 363, subtitle, 31, MUTE, maxwidth=W-200)

def footer(lines, fine):
    y = H-230 if len(lines) > 1 else H-175
    draw.rounded_rectangle((100, y, W-100, H-85), radius=16, fill=INK)
    for i, s in enumerate(lines):
        text(133, y+26+i*49, s, 30, BG, bold=i == 0, maxwidth=W-266)
    text(100, H-48, fine, 20, MUTE, maxwidth=W-200)

def save(name):
    im.convert('RGB').save(OUT/name, optimize=True, compress_level=9, icc_profile=ICC)
    print('COMPOSED', name, flush=True)

# Dimension lines: Ochre on an Ivory halo, so they read on the render and beside it.
def line(points, width=3):
    draw.line(points, fill=BG, width=width+6, joint='curve')
    draw.line(points, fill=OCHRE, width=width, joint='curve')

def label(x, y, s, size=28):
    """A value in a pill centred on (x, y)."""
    f = font(size, True)
    w, h = round(draw.textlength(s, font=f))+30, size+20
    pill = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(pill)
    d.rounded_rectangle((0, 0, w-1, h-1), radius=h//2, fill=BG, outline=OCHRE, width=3)
    d.text((w/2, h/2), s, font=f, fill=INK, anchor='mm')
    im.alpha_composite(pill, (round(x-pill.width/2), round(y-pill.height/2)))

def dot(p):
    draw.ellipse((p[0]-9, p[1]-9, p[0]+9, p[1]+9), fill=OCHRE, outline=BG, width=3)

def number(p, n):
    """A numbered marker on a render."""
    draw.ellipse((p[0]-26, p[1]-26, p[0]+26, p[1]+26), fill=BG, outline=OCHRE, width=3)
    text(p[0], p[1], str(n), 24, INK, True, anchor='mm')

def arrowhead(tip, base, size=26):
    dx, dy = (tip[0]-base[0])/math.dist(tip, base), (tip[1]-base[1])/math.dist(tip, base)
    b = (tip[0]-dx*size, tip[1]-dy*size)
    draw.polygon([tip, (b[0]-dy*size*.45, b[1]+dx*size*.45), (b[0]+dy*size*.45, b[1]-dx*size*.45)], fill=OCHRE, outline=BG)

def callouts(at, side, x, edge, step=170, top=470, bottom=1330, width=440):
    """Titles with their lines in a column at x, each with a line from the
    column's edge to its mark, in the order of the marks' heights."""
    side = sorted(side, key=lambda c: at(c[0])[1])
    ys = [at(key)[1] for key, *_ in side]
    y0 = min(max(sum(ys)/len(ys)-step*(len(side)-1)/2, top+50), bottom-step*(len(side)-1))
    for i, (key, title, lines) in enumerate(side):
        y = y0+i*step
        text(x, y-44, title, 27, bold=True, maxwidth=width)
        for j, s in enumerate(lines): text(x, y-4+j*32, s, 22, MUTE, maxwidth=width)
        line([(edge, y-28), (edge+(60 if x < edge else -60), y-28), at(key)], 2)
        dot(at(key))

def rows(entries, y, x=100, indent=290, step=56):
    """Topic and line, one row each."""
    for i, (title, s) in enumerate(entries):
        text(x, y+i*step, title, 26, OCHRE, True)
        text(x+indent, y+i*step, s, 27, maxwidth=W-100-x-indent)

def v(key): return f'{key} = {D[key]:g}'

new('01 / WHAT GOES WHERE')
heading('One box for the electronics.', 'An ESP32-S3, three ULN2003 drivers for the X, Y and Z motors and a power rail. Shown lifted out of the base.')
at = place('inside', (600, 450, 1200, 1080))
# Each mark to the column on its side
marks = [('esp', 'ESP32-S3 WROOM-1', ['Dev board, 28 wide. Rests on', 'two rails, no screws.']),
         ('pocket', 'ESP32 POCKET', [f'Its rails stand {D["esp_under"]:g} above the floor.', 'Open toward the drivers.']),
         ('uln', f'{D["uln_n"]:g} × ULN2003', ['One driver each for X, Y, Z.', 'Motor plugs toward the back.']),
         ('standoffs', 'STANDOFFS', ['Four per driver, for', 'M3 × 6 thread forming screws.']),
         ('rail', 'POWER RAIL', ['A breadboard rail in its pocket', 'along the front wall, one way round.']),
         ('post', 'CORNER POSTS', ['The lid\'s four M3 × 10.'])]
middle = at('rail')[0]
callouts(at, [m for m in marks if at(m[0])[0] < middle], 100, 560, 180, bottom=1530)
callouts(at, [m for m in marks if at(m[0])[0] >= middle], 1880, 1840, 180, bottom=1530)
footer(['The lid closes it: its four pillars hold the ESP32 down, its tabs close the cable slots.'],
       f'CAD RENDER, BOARDS LIFTED OUT  /  ILLUSTRATIVE COLORS  /  BOARDS SIMPLIFIED  /  {NOT_PRINTED}  /  MM')
save('images/01_inside.png')

new('02 / WHERE THE CABLES GO')
heading('Every cable has its slot.', 'The box closed, from behind and from the front, at the same scale. The slots are open to the top: lay the cables in, then put the lid on.')
views = row(['back', 'front'], (100, 470, 2200, 640), 160)
(bl, bt, br, back), (fl, ft, fr, front) = views
number(back('usb'), 1)
for i in range(int(D['uln_n'])): number(back(f'slot_{i}'), 2)
number(front('supply'), 3)
for (left, right, title, entries) in ((bl, br, 'FROM BEHIND', [(1, 'USB-C WINDOW', [f'{D["usb_window_w"]:g} × {D["usb_window_h"]:g}, both USB-C ports of the ESP32.']),
                                                                (2, 'MOTOR CABLE SLOTS', [f'{D["uln_n"]:g} × {D["cable_slot_w"]:g} wide, one behind each driver\'s plug.',
                                                                                          f'The lid\'s tab leaves {D["cable_pass_h"]:g} high for the cable.'])]),
                                      (fl, fr, 'FROM THE FRONT', [(3, 'SUPPLY CABLE SLOT', [f'{D["supply_slot_w"]:g} wide, for the 5 V cable.',
                                                                                            f'The lid\'s tab leaves {D["cable_pass_h"]:g} high: a plug goes in first.'])])):
    draw.line((left, 1160, right, 1160), fill=LINE, width=2)
    text(left, 1188, title, 40, bold=True)
    y = 1260
    for n, s, lines in entries:
        text(left, y, f'{n}', 28, OCHRE, True); text(left+50, y, s, 28, bold=True)
        for j, t in enumerate(lines): text(left+50, y+42+j*34, t, 25, MUTE, maxwidth=right-left-50)
        y += 42+34*len(lines)+30
footer([f'Inside, a {D["rail_slit_w"]:g} mm slit through each end wall of the rail\'s pocket lets the 5 V cables out of the rail\'s',
        f'end holes, and {D["esp_window_n"]:g} windows under the ESP32 let the far header\'s wires out toward the drivers.'],
       f'CAD RENDERS, SAME SCALE  /  ILLUSTRATIVE COLORS  /  CABLES NOT SHOWN  /  {NOT_PRINTED}  /  MM')
save('images/02_cables.png')

new('03 / THE ESP32\'S POCKET')
heading('Held without screws.', 'Cut across the ESP32\'s pocket at the lid\'s pillars, seen from the front. Names and values as in the script.')
at = place('cut', (640, 450, 1120, 820))
# esp_under, from the floor to the board's underside, in the pocket's middle
(fx, fy), (ux, uy) = at('floor'), at('under')
line([(fx, fy), (ux, uy)], 3)
for p, q in (((ux, uy), (fx, fy)), ((fx, fy), (ux, uy))): arrowhead(p, q)
label(fx, (fy+uy)/2, v('esp_under'))
# The far header's wires: down from their housings, under the board through the windows, out toward the drivers
path = [at(f'wire_{i}') for i in range(4)]
draw.line(path, fill=BG, width=12, joint='curve'); draw.line(path, fill=OCHRE, width=5, joint='curve')
arrowhead(path[-1], path[-2], 30)
text(path[-1][0]-40, path[-1][1]+16, 'TO THE DRIVERS', 22, OCHRE, True, anchor='ra')
callouts(at, [('housing_l', 'JUMPER WIRE HOUSINGS', [f'On the pins, {D["housing"]:g} long as the', 'script assumes. Not printed.']),
              ('slot_l', 'HEADER SLOT', [v('esp_slot_w'), 'Open to the floor.']),
              ('rail_l', 'RAIL', [v('esp_rail_w'), 'The board rests on its top.']),
              ('window', 'WIRE WINDOW', [f'{v("esp_window_h")} to the roof\'s', 'eaves, under the board.'])], 100, 600, 170, top=450, bottom=1290)
callouts(at, [('pillar', 'LID PILLAR', [f'{v("pillar_gap")} above the can.']),
              ('can', 'MODULE CAN', [f'{v("mod_h")} above the board.']),
              ('open', 'OPEN SIDE', ['No wall toward the drivers:', 'pins and wires in sight.']),
              ('uln', 'FIRST ULN2003', ['Its IN pins face the ESP32.'])], 1880, 1800, 170, top=450, bottom=1290)
rows([('BOARD', 'Rests on two rails; its headers hang in slots, whose ends stop it lengthwise.'),
      ('HOLD-DOWN', f'Four pillars under the lid: two on the can, two on the USB-C shells, {D["pillar_gap"]:g} above them.'),
      ('WIRES', f'{v("esp_under")}: 2.5 header, {D["housing"]:g} housing, {D["esp_under"]-2.5-D["housing"]:g} for the wires to bend out.')], 1330)
footer(['The pocket is that of a printed case that fits the board. Measure mod_h and usb_h on yours.'],
       f'CAD RENDER, CUT  /  ILLUSTRATIVE COLORS  /  BOARD SIMPLIFIED  /  HOUSINGS NOT PRINTED AND NOT IN THE SCRIPT  /  {NOT_PRINTED}  /  MM')
save('images/03_esp32_pocket.png')

new('04 / PRINT')
heading('Two parts, no support.', 'part = "print_layout": the base as it stands, the lid top face down. Made for 0.2 mm layers.')
draw.rounded_rectangle((100, 465, W-100, 1010), radius=18, fill='#C9C4B6')
at = place('layout', (160, 500, W-320, 475))
for i, key in enumerate(('base', 'lid')): number(at(key), f'{i+1:02}')
columns = [(100, [('01', 'BASE', ['As it stands. The USB-C window', f'bridges {D["usb_window_w"]:g} mm, the wire windows', 'have 45° roofs.']),
                  ('02', 'LID', ['Top face down: pillars and tabs', 'point up, the logo lies on the bed.'])]),
           (870, [('', 'NOT PRINTED', ['ESP32-S3 WROOM-1 dev board, 28 wide', f'{D["uln_n"]:g} × ULN2003 driver board', 'breadboard power rail',
                                       '4 × M3 × 10, the lid', f'{4*D["uln_n"]:g} × M3 × 6 thread forming, the drivers', '4 × stick-on foot up to Ø10',
                                       'jumper wires'])]),
           (1640, [('', 'CHECK BEFORE PRINTING', [f'rail_len × rail_w = {D["rail_len"]:g} × {D["rail_w"]:g}', '  your power rail\'s pocket',
                                                  f'{v("mod_h")}, {v("usb_h")}', '  your ESP32\'s can and shells',
                                                  f'{v("screw_hole")}', '  M3 thread forming, untested'])])]
for x, blocks in columns:
    y = 1060
    for n, title, lines in blocks:
        if n: text(x, y, n, 27, OCHRE, True)
        text(x+(60 if n else 0), y-4, title, 32, bold=True, maxwidth=700)
        for j, s in enumerate(lines): text(x+(60 if n else 0), y+44+j*36, s, 25, MUTE, maxwidth=700)
        y += 44+36*len(lines)+40
footer(['Two STL files, the base and the lid, each in print orientation.'],
       f'CAD RENDER OF THE PRINT LAYOUT  /  ILLUSTRATIVE COLORS  /  {NOT_PRINTED}  /  MM')
save('images/04_print.png')

# A review sheet of everything to upload, in upload order.
files = [(p, p.stem) for p in sorted((OUT/'images').glob('*.png'))]
sheet = Image.new('RGB', (1600, 320*-(-len(files)//4)), BG); sd = ImageDraw.Draw(sheet)
for i, (path, name) in enumerate(files):
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGB'); p.thumbnail((380, 285), Image.Resampling.LANCZOS)
    x = (i % 4)*400; y = (i//4)*320
    sheet.paste(p, (x+(400-p.width)//2, y+10))
    sd.text((x+12, y+298), f'{i+1}  {name}', font=font(16), fill=INK)
sheet.save(OUT/'contact-sheet.png', optimize=True, compress_level=9, icc_profile=ICC)
print('FONT', FAMILY)
