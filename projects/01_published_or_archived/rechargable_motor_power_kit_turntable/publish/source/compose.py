# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Compose the publication PNGs from the CAD renders, the photos and the brand assets."""
import io, json, os, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageOps
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

cfg = json.loads(Path(sys.argv[1]).read_text())
OUT, PROJECT, ROOT = Path(cfg['output']), Path(cfg['project']), Path(cfg['root'])
D = cfg['dims']
PHOTOS = PROJECT/'real_images/WhatsApp Unknown 2026-11-21 at 17.54.27'
PHOTO_COVER = PHOTOS/'WhatsApp Image 2026-11-20 at 16.53.01.jpeg'
# Uploaded as they are, in this order.
UPLOADS = [('WhatsApp Image 2026-11-20 at 16.53.02 (4).jpeg', 'photo inside'),
           ('WhatsApp Image 2026-11-20 at 16.53.02 (2).jpeg', 'photo worm'),
           ('WhatsApp Image 2026-11-20 at 16.53.02 (1).jpeg', 'photo bracket'),
           ('WhatsApp Image 2026-11-20 at 16.53.02 (3).jpeg', 'photo switch cap'),
           ('WhatsApp Image 2026-11-20 at 16.53.02 (5).jpeg', 'photo teeth'),
           ('WhatsApp Image 2026-11-20 at 16.53.03.jpeg', 'photo graphite')]
# Brand: Ivory background, Graphite ink, Ochre accent on ivory.
BG, INK, MUTE, LINE, OCHRE = '#F4EFE3', '#151B1D', '#5D6461', '#D9D2C3', '#B77B1E'
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

def blur(v, r):
    """Three box blurs of radius r, close to a Gaussian, with nothing beyond the edges."""
    for axis in (0, 1)*3:
        pad = [(r+1, r) if i == axis else (0, 0) for i in (0, 1)]
        c = np.cumsum(np.pad(v, pad), axis=axis)
        n = v.shape[axis]
        v = (np.take(c, range(2*r+1, 2*r+1+n), axis)-np.take(c, range(n), axis))/(2*r+1)
    return v

def cover_photo():
    """The cover's photo, cropped to 4:3. The cutting mat's maker's mark in
    the top left corner, background, is painted over with the mat around it;
    the print is untouched."""
    p = Image.open(PHOTO_COVER).convert('RGB')
    a = np.asarray(p.crop((0, 0, 700, 500)), dtype=np.float64)
    hole = np.zeros(a.shape[:2]); hole[0:175, 135:340] = 1
    # Only the mat around the mark fills it: grey, not the table's or the print's brown, not its white lines.
    mat = (hole == 0)*(a[..., 2]-a[..., 0] > -8)*(a.mean(2) < 170)
    fill = np.stack([blur(a[..., c]*mat, 60) for c in range(3)], -1)/np.maximum(blur(mat*1., 60), 1e-6)[..., None]
    soft = blur(hole, 4)[..., None]
    p.paste(Image.fromarray((a*(1-soft)+fill*soft).round().clip(0, 255).astype(np.uint8)), (0, 0))
    return p.crop((120, 0, 1860, 1305))

def photo(p, box):
    """A photo, cropped only, filling box, with round corners."""
    x, y, w, h = box
    p = ImageOps.fit(ImageOps.exif_transpose(p).convert('RGBA'), (w, h), Image.Resampling.LANCZOS)
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

# Dimension lines: Ochre on an Ivory halo, so they read on the render and beside it.
def line(points, width=3):
    draw.line(points, fill=BG, width=width+6, joint='curve')
    draw.line(points, fill=OCHRE, width=width, joint='curve')

def arrow(tip, direction):
    (x, y), (dx, dy) = tip, direction
    l, s = 22, 8
    pts = [(x, y), (x-dx*l-dy*s, y-dy*l+dx*s), (x-dx*l+dy*s, y-dy*l-dx*s)]
    draw.polygon(pts, fill=OCHRE, outline=BG)

def label(x, y, s, size=28):
    """A value in a pill centred on (x, y)."""
    f = font(size, True)
    w, h = round(draw.textlength(s, font=f))+30, size+20
    pill = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(pill)
    d.rounded_rectangle((0, 0, w-1, h-1), radius=h//2, fill=BG, outline=OCHRE, width=3)
    d.text((w/2, h/2), s, font=f, fill=INK, anchor='mm')
    im.alpha_composite(pill, (round(x-pill.width/2), round(y-pill.height/2)))

def hdim(a, b, y, s):
    """Horizontal dimension between points a and b, its line at y."""
    for p in (a, b): line([(p[0], p[1]), (p[0], y+(14 if y > p[1] else -14))], 2)
    line([(a[0], y), (b[0], y)])
    arrow((a[0], y), (-1, 0)); arrow((b[0], y), (1, 0))
    label((a[0]+b[0])/2, y, s)

def dot(p):
    draw.ellipse((p[0]-9, p[1]-9, p[0]+9, p[1]+9), fill=OCHRE, outline=BG, width=3)

SIZES = ['compact', 'printed', 'large', 'xlarge']
NAMES = {'compact': 'COMPACT', 'printed': 'PRINTED', 'large': 'LARGE', 'xlarge': 'EXTRA LARGE'}
def seconds(k): return f'{60/D[k]["real_rpm"]:.0f} s'
def dia(k, r): return f'Ø{2*D[k][r]:g}'
def v(key): return f'{key} = {D["printed"][key]:g}'

COVER_FINE = 'PHOTO: PRINTED V6, Ø150  /  SIZES: CAD RENDERS, SAME SCALE, ILLUSTRATIVE COLORS  /  PLATFORM DIAMETERS IN MM'
picture = cover_photo()

def strip(box, size=28):
    """The four presets, closed, at one scale, with their platform and rpm."""
    for k, (left, top, right, at) in zip(SIZES, row(['closed_'+k for k in SIZES], box)):
        text((left+right)/2, box[1]+box[3]+16, f'{dia(k, "platform_r")} · rpm = {D[k]["rpm"]:g}', size, bold=True, anchor='ma')

# Cover, landscape: the printed turntable, and the four presets as CAD renders.
new('PARAMETRIC TURNTABLE  /  OPENSCAD SOURCE')
text(94, 262, 'RECHARGEABLE', 120, bold=True)
text(94, 400, 'TURNTABLE', 120, bold=True)
text(100, 582, 'For the Bambu Lab Rechargeable', 38, MUTE)
text(100, 638, 'Power Kit. Your speed, your size.', 38, MUTE)
for j, s in enumerate(['Printed worm drive, USB-C charging', 'Brackets lock motor, board and battery', 'Seven printed parts, no other hardware']):
    draw.ellipse((100, 753+j*64, 114, 767+j*64), fill=OCHRE)
    text(137, 745+j*64, s, 32)
photo(picture, (1040, 200, 1260, 945))
badge(1070, 1067, 'PRINTED · Ø150 PRESET')
text(100, 1183, 'FOUR SIZES. ONE SCRIPT.', 28, OCHRE, True)
draw.line((100, 1228, W-100, 1228), fill=LINE, width=2)
strip((250, 1262, 1900, 290))
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FINE)
save('thumbnail_4x3.png')

# Cover, portrait.
new('PARAMETRIC TURNTABLE  /  OPENSCAD SOURCE', (1800, 2400))
text(94, 262, 'RECHARGEABLE TURNTABLE', 120, bold=True, maxwidth=1610)
text(100, 412, 'For the Bambu Lab Rechargeable Power Kit. Your speed, your size.', 32, MUTE, maxwidth=1600)
photo(picture, (100, 490, 1600, 1200))
badge(130, 1612, 'PRINTED · Ø150 PRESET')
text(100, 1752, 'FOUR SIZES. ONE SCRIPT.', 28, OCHRE, True)
draw.line((100, 1797, W-100, 1797), fill=LINE, width=2)
strip((100, 1840, 1600, 270), 24)
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FINE)
save('thumbnail_3x4.png')

new('01 / FOUR SIZES')
heading('Slower turns, larger table.', 'Presets in the Customizer. rpm sets the teeth under the platform, the teeth set the size. Shown at the same scale.')
for k, (left, top, right, at) in zip(SIZES, row(['closed_'+k for k in SIZES], (100, 470, 2200, 520))):
    d = D[k]
    w = right-left
    draw.line((left, 1040, right, 1040), fill=LINE, width=2)
    text(left, 1068, NAMES[k], 40, bold=True, maxwidth=w)
    text(left, 1128, f'rpm = {d["rpm"]:g}', 28, MUTE)
    text(left, 1168, f'turntable_d = {d["turntable_d"]:g}', 28, MUTE, maxwidth=w)
    text(left, 1238, f'{d["teeth"]} teeth', 29, bold=True)
    text(left, 1282, f'{seconds(k)} per turn', 27, MUTE)
    text(left, 1322, f'base {dia(k, "base_r")}', 27, MUTE)
    badge(left, 1390, 'PRINTED' if k == 'printed' else 'DIGITAL ONLY', k == 'printed')
footer(['One worm turn moves the platform one tooth: teeth = motor_rpm / rpm.',
        'Times per turn are for the 500 rpm the kit states for its motor. Count your turns, then correct motor_rpm.'],
       'SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  KIT NOT INCLUDED  /  ONLY THE PRINTED PRESET IS PRINTED  /  MM')
save('images/01_four_sizes.png')

new('02 / RPM')
heading('rpm sets the teeth.', 'From above, the platform\'s plate left away: its hoop of teeth on the worm. The base grows with the hoop. Same scale.')
GEARS = ['compact', 'printed', 'xlarge']
for k, (left, top, right, at) in zip(GEARS, row(['gear_'+k for k in GEARS], (100, 640, 2200, 760), 110)):
    d = D[k]
    draw.line((left, 460, right, 460), fill=LINE, width=2)
    text(left, 488, f'rpm = {d["rpm"]:g}', 40, bold=True)
    text(left, 546, f'{d["teeth"]} teeth, hoop Ø{2*d["pitch_r"]:.1f}', 28, MUTE, maxwidth=right-left)
    text(left, 586, f'{d["real_rpm"]:.1f} rpm, {seconds(k)} per turn', 28, MUTE, maxwidth=right-left)
    hdim((at('rim_l')[0], 1400), (at('rim_r')[0], 1400), 1462, f'base {dia(k, "base_r")}')
footer(['teeth = round(motor_rpm / rpm). The hoop sets the base, the base the smallest turntable_d: base + 2.',
        'The script reports teeth, speed and base, and stops if turntable_d is too small.'],
       f'TOP VIEWS, SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  {v("motor_rpm")}, {v("tooth_pitch")}  /  KIT PARTS SIMPLIFIED  /  MM')
save('images/02_rpm.png')

new('03 / TURNTABLE_D')
heading('A wider platform on the same base.', f'turntable_d only sets the platform. The base follows rpm: here {v("rpm")}, base {dia("printed", "base_r")}. Shown at the same scale.')
WIDE = ['printed', 'wide180', 'wide200']
for k, (left, top, right, at) in zip(WIDE, row(['wide_'+k for k in WIDE], (100, 760, 2200, 420), 90)):
    d = D[k]
    over = d['platform_r']-d['base_r']
    draw.line((left, 460, right, 460), fill=LINE, width=2)
    text(left, 488, f'turntable_d = {d["turntable_d"]:g}', 40, bold=True, maxwidth=right-left)
    text(left, 546, f'{over:g} mm beyond the base, all round', 28, MUTE, maxwidth=right-left)
    hdim(at('platform_l'), at('platform_r'), top-70, dia(k, 'platform_r'))
    hdim(at('base_l'), at('base_r'), 1262, dia(k, 'base_r'))
    badge(left, 1340, 'PRINTED' if k == 'printed' else 'DIGITAL ONLY', k == 'printed')
footer(['turntable_d: at least the base + 2. Only the platform changes; every other part stays.',
        'Only its weight holds the platform down: far beyond the base, a load on its edge tips it.'],
       'SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  ONLY turntable_d = 150 IS PRINTED  /  MM')
save('images/03_turntable_d.png')

new('04 / FIT')
heading('Tune the fit.', 'The parameters behind the parts that drive and hold. The defaults are the printed ones. Most changes reprint one small part.')
at = place('open', (560, 450, 1280, 800))
LEFT = [('tube', v('pin_clearance'), ['The platform\'s pin in the', 'base\'s tube only centres it.']),
        ('pad_battery', v('hold_press'), ['The bracket\'s pads press', 'battery and board down.']),
        ('screw_bracket', v('thread_clearance'), ['Two printed 5 mm screws', 'in threads in the base.']),
        ('cap', v('cap_travel'), ['The cap on the push switch', 'stands this far off the panel.'])]
RIGHT = [('rail', v('rail_width'), ['The ridge the platform', 'slides on: one line wide.']),
         ('worm', v('worm_oversize'), ['Teeth skip under a load: 0.4.', 'Runs rough: 0.2.']),
         ('motor_pad', v('motor_press'), ['The motor bracket\'s pad', 'presses the motor down.'])]
for side, x, edge in ((LEFT, 100, 540), (RIGHT, 1900, 1880)):
    ys = [at(key)[1] for key, *_ in side]
    step = 190
    y0 = min(max(sum(ys)/len(ys)-step*(len(side)-1)/2, 500), 1130-step*(len(side)-1))
    for i, (key, title, lines) in enumerate(side):
        y = y0+i*step
        text(x, y-44, title, 27, bold=True, maxwidth=420)
        for j, s in enumerate(lines): text(x, y-4+j*32, s, 22, MUTE, maxwidth=420)
        elbow = (edge+(60 if x < edge else -60), y-28)
        line([(edge, y-28), elbow, at(key)], 2)
        dot(at(key))
text(100, 1268, 'CUT THROUGH THE WORM', 26, OCHRE, True)
draw.line((100, 1308, W-100, 1308), fill=LINE, width=2)
cut = place('section', (100, 1380, 2200, 190))
for key, s, anchor in (('worm', 'worm on the shaft', 'ma'), ('pin', v('pin_gap'), 'ma'),
                       ('hoop_r', f'hoop, {D["printed"]["teeth"]} teeth', 'ma'), ('rail_r', 'rail', 'ra')):
    p = cut(key)
    line([(p[0], 1362), p], 2); dot(p)
    text(p[0]+(12 if anchor == 'ra' else 0), 1326, s, 24, INK, True, anchor=anchor)
footer(['Printed with these defaults. The listing\'s tuning table says which parameter answers which problem.'],
       'CAD RENDERS: ASSEMBLY WITHOUT THE PLATFORM, CUT THROUGH THE WORM  /  ILLUSTRATIVE COLORS  /  KIT PARTS SIMPLIFIED  /  MM')
save('images/04_fit.png')

new('05 / PRINT')
heading('Seven parts, no support.', 'part = "print_layout": every part as it prints, the screw twice. Printed preset, as printed.')
draw.rounded_rectangle((100, 465, 1535, 1520), radius=18, fill='#C9C4B6')
place('layout', (140, 495, 1355, 995))
rows = [('01', 'BASE', ['Standing, as modelled.', 'Hook and wedge at 45°, short bridges.']),
        ('02', 'PLATFORM', ['Top face down.', 'Pin and teeth point up.']),
        ('03', 'WORM, BRACKETS, CAP', ['Worm on its closed end, bracket top down,', 'motor bracket on its side, cap on its face.']),
        ('04', 'SCREWS × 2', ['Lying on their flat cut,', 'layers along the shank.']),
        ('05', 'NOT PRINTED', ['Rechargeable Power Kit ZC003,', 'USB-C cable, graphite powder.'])]
for i, (number, title, lines) in enumerate(rows):
    y = 470+i*212
    text(1590, y, number, 27, OCHRE, True); text(1590, y+40, title, 34, bold=True, maxwidth=710)
    for j, s in enumerate(lines): text(1590, y+92+j*38, s, 26, MUTE, maxwidth=710)
# Weight and time: v6_elegoo.3mf sliced with ElegooSlicer 1.5.3.5.
footer(['0.4 mm nozzle, 0.2 mm layers, 2 walls, 15 % infill: 104 g of PLA, 2 h 48 min by the slicer.',
        'The 3mf files hold them on one 256 × 256 plate. With supports switched on, the slicer adds none.'],
       'CAD RENDER OF THE PRINT LAYOUT  /  ILLUSTRATIVE COLORS  /  WEIGHT AND TIME: v6_elegoo.3mf SLICED FOR THE ELEGOO CENTAURI CARBON 2')
save('images/05_print.png')

# A review sheet of everything to upload, in upload order.
files = [(OUT/'thumbnail_4x3.png', 'cover'), *[(PHOTOS/name, title) for name, title in UPLOADS],
         *[(p, p.stem) for p in sorted((OUT/'images').glob('*.png'))], (OUT/'thumbnail_3x4.png', 'portrait cover')]
sheet = Image.new('RGB', (1600, 320*-(-len(files)//4)), BG); sd = ImageDraw.Draw(sheet)
for i, (path, name) in enumerate(files):
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGB'); p.thumbnail((380, 285), Image.Resampling.LANCZOS)
    x = (i % 4)*400; y = (i//4)*320
    sheet.paste(p, (x+(400-p.width)//2, y+10))
    sd.text((x+12, y+298), f'{i+1}  {name}', font=font(16), fill=INK)
sheet.save(OUT/'contact-sheet.png', optimize=True, compress_level=9, icc_profile=ICC)
print('FONT', FAMILY)
