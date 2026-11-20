# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Compose the publication PNGs from the CAD renders, the photos and the brand assets."""
import io, json, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageOps
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

cfg = json.loads(Path(sys.argv[1]).read_text())
OUT, PROJECT, ROOT = Path(cfg['output']), Path(cfg['project']), Path(cfg['root'])
D = cfg['dims']
PHOTOS = PROJECT/'real_images/WhatsApp Unknown 2026-11-20 at 19.55.25'
PHOTO_LID = PHOTOS/'image.png'
PHOTO_USB = PHOTOS/'WhatsApp Image 2026-11-20 at 19.55.08 (1).jpeg'
PHOTO_BOTTOM = PHOTOS/'WhatsApp Image 2026-11-20 at 19.55.08.jpeg'
# Brand: Ivory background, Graphite ink, Ochre accent on ivory, Gold.
BG, INK, MUTE, LINE, OCHRE, GOLD = '#F4EFE3', '#151B1D', '#5D6461', '#D9D2C3', '#B77B1E', '#F0B750'
FONT = os.environ.get('PUBLISH_FONT') or subprocess.check_output(['fc-match', '-f', '%{file}', 'DejaVu Sans Mono'], text=True)
FAMILY = ImageFont.truetype(FONT, 20).getname()[0]
BOLD = os.environ.get('PUBLISH_FONT_BOLD') or subprocess.check_output(['fc-match', '-f', '%{file}', FAMILY+':style=Bold'], text=True)
ICC = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
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

def same_scale(names, boxes):
    """Renders that share a camera scale, at one factor so their sizes compare,
    each standing on the bottom of its box."""
    f = min(min(b[2]/(visible(n)[2]-visible(n)[0]), b[3]/(visible(n)[3]-visible(n)[1])) for n, b in zip(names, boxes))
    for n, b in zip(names, boxes): place(n, b, f, bottom=True)

def photo(path, box, crop=None):
    """A photo, cropped only, filling box, with round corners."""
    x, y, w, h = box
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGBA')
    if crop: p = p.crop(crop)
    p = ImageOps.fit(p, (w, h), Image.Resampling.LANCZOS)
    mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, w-1, h-1), radius=18, fill=255)
    p.putalpha(mask); im.alpha_composite(p, (x, y))

def badge(x, y, label, filled=True):
    w = 52+draw.textlength(label, font=font(22, True))
    draw.rounded_rectangle((x, y, x+w, y+48), radius=24, fill=INK if filled else BG, outline=INK, width=3)
    text(x+26, y+13, label, 22, BG if filled else INK, True)

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
    for i, line in enumerate(lines):
        text(133, y+26+i*49, line, 30, BG, bold=i == 0, maxwidth=W-266)
    text(100, H-48, fine, 20, MUTE, maxwidth=W-200)

def save(name):
    im.convert('RGB').save(OUT/name, optimize=True, compress_level=9, icc_profile=ICC)
    print('COMPOSED', name, flush=True)

def mm(values):
    return ' × '.join(f'{v:g}' for v in values)

# Dimension lines: Ochre on an Ivory halo, so they read on the render and beside it.
def line(points, width=3):
    draw.line(points, fill=BG, width=width+6, joint='curve')
    draw.line(points, fill=OCHRE, width=width, joint='curve')

def arrow(tip, direction):
    (x, y), (dx, dy) = tip, direction
    l, s = 22, 8
    pts = [(x, y), (x-dx*l-dy*s, y-dy*l+dx*s), (x-dx*l+dy*s, y-dy*l-dx*s)]
    draw.polygon(pts, fill=OCHRE, outline=BG)

def label(x, y, s, size=28, rotate=False):
    """A value in a pill centred on (x, y)."""
    f = font(size, True)
    w, h = round(draw.textlength(s, font=f))+30, size+20
    pill = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(pill)
    d.rounded_rectangle((0, 0, w-1, h-1), radius=h//2, fill=BG, outline=OCHRE, width=3)
    d.text((w/2, h/2), s, font=f, fill=INK, anchor='mm')
    if rotate: pill = pill.rotate(90, expand=True, resample=Image.Resampling.BICUBIC)
    im.alpha_composite(pill, (round(x-pill.width/2), round(y-pill.height/2)))

def hdim(a, b, y, s, above=False):
    """Horizontal dimension between points a and b, its line at y, the
    value on the line or above it where the line is short."""
    for p in (a, b): line([(p[0], p[1]), (p[0], y+(14 if y > p[1] else -14))], 2)
    line([(a[0], y), (b[0], y)])
    arrow((a[0], y), (-1, 0)); arrow((b[0], y), (1, 0))
    label((a[0]+b[0])/2, y-48 if above else y, s)

def vdim(a, b, x, s, extend=True):
    """Vertical dimension between points a and b, its line at x."""
    if extend:
        for p in (a, b): line([(p[0], p[1]), (x+(14 if x > p[0] else -14), p[1])], 2)
    line([(x, a[1]), (x, b[1])])
    up = -1 if a[1] < b[1] else 1
    arrow((x, a[1]), (0, up)); arrow((x, b[1]), (0, -up))
    label(x, (a[1]+b[1])/2, s, rotate=True)

FIXES = ['printed', 'm3', 'push']
NAMES = {'printed': 'PRINTED SCREWS', 'm3': 'M3 SCREWS', 'push': 'PUSH-IN'}
SHORT = {'printed': 'printed screws', 'm3': 'M3 screws', 'push': 'push-in'}
OUTER = {f: mm(cfg['outer'][f]) for f in FIXES}

COVER_FINE = 'PHOTO: PRINTED V1 WITH PRINTED SCREWS  /  LID FIXINGS: CAD RENDERS, SAME SCALE, ILLUSTRATIVE COLORS'

def strip(x, y, w, h, vertical=False):
    """The three lid fixings, closed, at one scale, with their names."""
    if vertical:
        boxes = [(x, y+i*(h//3), w, h//3-70) for i in range(3)]
    else:
        cw = (w-2*40)//3
        boxes = [(x+i*(cw+40), y, cw, h-60) for i in range(3)]
    same_scale(['closed_'+f for f in FIXES], boxes)
    for f, (bx, by, bw, bh) in zip(FIXES, boxes):
        text(bx+bw/2, by+bh+18, SHORT[f], 28, bold=True, anchor='ma')

# Cover, landscape: the printed case, and the three lid fixings as CAD renders.
new('PARAMETRIC ESP32 ENCLOSURE  /  OPENSCAD SOURCE')
text(94, 262, 'ESP32', 128, bold=True)
text(94, 410, 'CASE', 128, bold=True)
text(100, 590, 'For a 30-pin USB-C dev board.', 38, MUTE)
text(100, 646, 'Pins reachable from below.', 38, MUTE)
for j, s in enumerate(['USB-C open, vents in the lid', 'Slits for the jumper wires', 'Three ways to hold the lid']):
    draw.ellipse((100, 763+j*64, 114, 777+j*64), fill=OCHRE)
    text(137, 755+j*64, s, 32)
photo(PHOTO_LID, (1300, 194, 1000, 1312))
badge(1330, 1428, 'PRINTED · PRINTED SCREWS')
text(100, 1050, 'THREE LID FIXINGS. ONE SCRIPT.', 28, OCHRE, True)
draw.line((100, 1098, 1200, 1098), fill=LINE, width=2)
strip(100, 1130, 1100, 400)
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FINE)
save('thumbnail_4x3.png')

# Cover, portrait.
new('PARAMETRIC ESP32 ENCLOSURE  /  OPENSCAD SOURCE', (1800, 2400))
text(94, 262, 'ESP32 CASE', 120, bold=True)
text(100, 410, 'For a 30-pin USB-C dev board. Pins reachable from below.', 32, MUTE, maxwidth=1600)
photo(PHOTO_LID, (100, 490, 1000, 1312))
badge(130, 1724, 'PRINTED · PRINTED SCREWS')
text(1170, 490, 'THREE LID', 28, OCHRE, True)
text(1170, 528, 'FIXINGS.', 28, OCHRE, True)
text(1170, 566, 'ONE SCRIPT.', 28, OCHRE, True)
strip(1170, 640, 530, 1160, vertical=True)
for j, s in enumerate(['USB-C open, vents in the lid', 'Slits for the jumper wires', 'Printed screws, M3 screws or push-in']):
    draw.ellipse((100, 1903+j*70, 114, 1917+j*70), fill=OCHRE)
    text(137, 1895+j*70, s, 34)
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FINE)
save('thumbnail_3x4.png')

COLUMNS = [100+i*755 for i in range(3)]
CW = 690

new('01 / THREE LID FIXINGS')
heading('Three ways to close it.', 'lid_fix in the Customizer: presets Printed screws, M3 screws and Push-in. Shown at the same scale.')
lines = {'printed': [f'outside {OUTER["printed"]} mm', '2 printed 5 mm screws', 'in threads in the bosses'],
         'm3': [f'outside {OUTER["m3"]} mm', '2 × M3 × 10 screws, not included', 'forming their thread in 2.7 mm holes'],
         'push': [f'outside {OUTER["push"]} mm', 'no screws: a bead on the lid\'s lip', 'snaps into a groove in each wall']}
for x, f in zip(COLUMNS, FIXES):
    draw.line((x, 460, x+CW, 460), fill=LINE, width=2)
    text(x, 492, NAMES[f], 40, bold=True)
    text(x, 548, f'lid_fix = "{f}"', 28, MUTE)
same_scale(['exploded_'+f for f in FIXES], [(x, 610, CW, 640) for x in COLUMNS])
for x, f in zip(COLUMNS, FIXES):
    for j, s in enumerate(lines[f]):
        text(x, 1290+j*48, s, 29, INK if j == 0 else MUTE, bold=j == 0, maxwidth=CW)
    badge(x, 1440, 'PRINTED' if f == 'printed' else 'DIGITAL ONLY', f == 'printed')
footer(['One parameter: lid_fix.',
        'Board seat, USB-C window, pin slits, vents and logo stay the same.'],
       'SAME SCALE  /  CAD RENDERS, LID RAISED  /  ILLUSTRATIVE COLORS  /  BOARD NOT INCLUDED  /  ONLY PRINTED SCREWS IS PRINTED')
save('images/01_three_lid_fixings.png')

def v(key): return f'{key} = {D[key]:g}'

new('02 / FIT YOUR BOARD')
heading('Measure your board.', 'The defaults fit the hand-measured 30-pin USB-C clone board. Enter yours, the box follows.')
at = place('top', (330, 600, 1070, 790))
c0, c1 = at('case00'), at('case11')
left, right, top, bottom = c0[0], c1[0], c1[1], c0[1]
# Pin holes, drawn where the pins are: the render shows the board from above.
r = 0.5*info['top']['px_per_mm']*(at('pinA1')[0]-at('pinA0')[0])/(2.54*info['top']['px_per_mm'])
for key in cfg['marks']:
    if key.startswith('pin'):
        x, y = at(key)
        draw.ellipse((x-r*1.6, y-r*1.6, x+r*1.6, y+r*1.6), fill='#D9A93A', outline=INK, width=2)
        draw.ellipse((x-r*.6, y-r*.6, x+r*.6, y+r*.6), fill=INK)
hdim(at('b00'), at('b10'), bottom+70, v('board_l'))
vdim(at('b10'), at('b11'), right+75, v('board_w'))
hdim(at('b01'), at('pinB0'), top-40, v('pin_x0'), above=True)
vdim(at('pinA2'), at('pinB2'), at('pinA2')[0], v('pin_row'), extend=False)
last = at(f'pinB{int(D["pin_n"])-1}')
line([last, (last[0], top-88)], 2)
label(last[0], top-88, f'pin_n = {D["pin_n"]:g}')
usb = at('usb')
line([usb, (left-40, usb[1])], 2)
text(left-50, usb[1], v('usb_out'), 28, INK, True, anchor='rm')
X = 1660
rows = [('board_l', 'board length'), ('board_w', 'board width'), ('usb_out', 'USB-C beyond the edge'),
        ('pin_x0', 'USB edge to first pin'), ('pin_row', 'between the pin rows'), ('pin_n', 'pins per row'),
        ('pins_h', 'underside to pin tips'), ('top_room', 'board top to the lid')]
for j, (key, s) in enumerate(rows):
    y = 470+j*54
    text(X, y, v(key), 28, INK, True)
    text(X+300, y+2, s, 25, MUTE)
draw.line((X, 920, W-100, 920), fill=LINE, width=2)
place('bottom', (X, 950, W-100-X, 470))
text(X, 1440, 'From below: the jumper wires\' plugs', 25, MUTE)
text(X, 1474, 'go onto the pins through the slits.', 25, MUTE)
footer(['Measure your board, enter the values, render.',
        'Keep pin_x0 − 1.27 ≥ support − fit at both ends, so the corner blocks miss the headers.'],
       'CAD RENDERS  /  V1 DEFAULTS IN MM  /  PIN HOLES DRAWN OVER THE RENDER  /  ILLUSTRATIVE COLORS')
save('images/02_fit_your_board.png')

new('03 / PRINT')
heading('Four parts, no support.', 'part = "print_layout": base, lid and two screws on the bed. Printed screws preset, as printed.')
draw.rounded_rectangle((100, 465, 1535, 1520), radius=18, fill='#C9C4B6')
place('layout', (140, 495, 1355, 995))
rows = [('01', 'BASE', ['Opening up, as modelled.', 'USB window open to the top.']),
        ('02', 'LID', ['Top face down.', 'Lip and legs point up.']),
        ('03', 'SCREWS × 2', ['Lying on their flat cut,', 'layers along the shank.']),
        ('04', 'NOT PRINTED', ['ESP32 board, jumper wires.', 'm3 preset: 2 × M3 × 10.'])]
for i, (number, title, lines) in enumerate(rows):
    y = 480+i*262
    text(1590, y, number, 27, OCHRE, True); text(1590, y+44, title, 36, bold=True)
    for j, s in enumerate(lines): text(1590, y+100+j*40, s, 26, MUTE, maxwidth=710)
footer(['0.4 mm nozzle, 0.2 mm layers, 2 walls, 15 % infill.',
        'Both 3mf files hold all three lid fixings; the slicer adds no support, even with supports on.'],
       'CAD RENDER OF THE PRINT LAYOUT  /  ILLUSTRATIVE COLORS  /  3MF FOR ELEGOO CENTAURI CARBON 2 AND SNAPMAKER U1')
save('images/03_print.png')

# A review sheet of everything to upload, in upload order.
files = [(OUT/'thumbnail_4x3.png', 'cover'), (PHOTO_LID, 'photo lid'), (PHOTO_USB, 'photo USB-C'),
         (PHOTO_BOTTOM, 'photo bottom'), *[(p, p.stem) for p in sorted((OUT/'images').glob('*.png'))],
         (OUT/'thumbnail_3x4.png', 'portrait cover')]
sheet = Image.new('RGB', (1600, 640), BG); sd = ImageDraw.Draw(sheet)
for i, (path, name) in enumerate(files):
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGB'); p.thumbnail((380, 285), Image.Resampling.LANCZOS)
    x = (i % 4)*400; y = (i//4)*320
    sheet.paste(p, (x+(400-p.width)//2, y+10))
    sd.text((x+12, y+298), f'{i+1}  {name}', font=font(16), fill=INK)
sheet.save(OUT/'contact-sheet.png', optimize=True, compress_level=9, icc_profile=ICC)
print('FONT', FAMILY)
