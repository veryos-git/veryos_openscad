# Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
"""Compose the publication PNGs from the CAD renders, the photos and the brand assets."""
import io, json, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageOps
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

OUT = Path(__file__).resolve().parent.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[1]
cfg = json.loads(Path(sys.argv[1]).read_text())
SCENES = {s['id']: s for s in cfg['scenes']}
INFO = {r['id']: r for r in json.loads((OUT/'renders/render-info.json').read_text())}
PHOTOS = PROJECT/'real_images/WhatsApp Unknown 2026-11-20 at 19.48.49'
def photo_path(n): return PHOTOS/f'WhatsApp Image 2026-11-20 at 19.47.57{n}.jpeg'
PHOTO_ARM = photo_path(' (3)')
PHOTO_WIDE = photo_path('')
PHOTO_UNDER = photo_path(' (2)')
PHOTO_LOGO = photo_path(' (1)')
# Brand: ivory background, graphite ink, ochre accent on ivory.
BG, INK, MUTE, LINE, ACCENT = '#F4EFE3', '#151B1D', '#5C6163', '#D8D0BC', '#B77B1E'
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
    h = round(width*31.2528266758/43.9095293518)
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, h)
    rect = Rsvg.Rectangle(); rect.x = 0; rect.y = 0; rect.width = width; rect.height = h
    Rsvg.Handle.new_from_data((ROOT/'veryos_logo.svg').read_bytes()).render_document(cairo.Context(surface), rect)
    stream = io.BytesIO(); surface.write_to_png(stream); stream.seek(0)
    return Image.open(stream).convert('RGBA')

logo = svg_logo(86)
scad = Image.open(ROOT/'projects/01_published_or_archived/fdm_optimized_screws/publish/source/assets/openscad.png').convert('RGBA')
scad.thumbnail((64, 64), Image.Resampling.LANCZOS)
renders = {p.stem: Image.open(p).convert('RGBA') for p in (OUT/'renders').glob('*.png')}

def visible(pic):
    return pic.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()

def tight(name):
    return renders[name].crop(visible(renders[name]))

def picture(name, box):
    """A render cropped tight and fitted into box."""
    x, y, w, h = box
    p = tight(name)
    f = min(w/p.width, h/p.height)
    p = p.resize((round(p.width*f), round(p.height*f)), Image.Resampling.LANCZOS)
    im.alpha_composite(p, (round(x+(w-p.width)/2), round(y+(h-p.height)/2)))

def same_scale(names, boxes):
    """Renders that share a camera scale, each centred in its box and standing
    on its bottom edge, all at one factor so their sizes compare."""
    crops = [tight(n) for n in names]
    f = min(min(b[2]/c.width, b[3]/c.height) for c, b in zip(crops, boxes))
    for c, (x, y, w, h) in zip(crops, boxes):
        c = c.resize((round(c.width*f), round(c.height*f)), Image.Resampling.LANCZOS)
        im.alpha_composite(c, (round(x+(w-c.width)/2), y+h-c.height))

def side(name, origin, mm):
    """A side render (x right, z up) placed so that the table edge at the table
    top, x = z = 0, lands on origin, at mm pixels per millimetre. Returns the
    map from model x, z to image pixels, for dimensions."""
    info = INFO[name]
    rx, ry = info['resolution']; tx, _, tz = info['target_mm']
    k = rx/info['orthographic_width_mm']
    u0, v0 = rx/2-tx*k, ry/2+tz*k
    left, top, right, bottom = visible(renders[name])
    f = mm/k
    crop = renders[name].crop((left, top, right, bottom))
    crop = crop.resize((round(crop.width*f), round(crop.height*f)), Image.Resampling.LANCZOS)
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
    layer.paste(crop, (round(origin[0]-(u0-left)*f), round(origin[1]-(v0-top)*f)))
    im.alpha_composite(layer)
    return lambda x, z: (origin[0]+x*mm, origin[1]-z*mm)

def arrow(tip, back):
    """A filled arrowhead at tip, pointing away from back."""
    (x, y), (bx, by) = tip, back
    d = ((x-bx)**2+(y-by)**2)**.5; ux, uy = (x-bx)/d, (y-by)/d
    draw.polygon([(x, y), (x-18*ux+7*uy, y-18*uy-7*ux), (x-18*ux-7*uy, y-18*uy+7*ux)], fill=ACCENT)

def dimension(a, b, label, side_of=(0, 0), size=28):
    """A dimension line between two pixel points, arrows at both ends, its
    label on a pill beside its middle, shifted by side_of."""
    draw.line((a, b), fill=ACCENT, width=4); arrow(a, b); arrow(b, a)
    x, y = (a[0]+b[0])/2+side_of[0], (a[1]+b[1])/2+side_of[1]
    w = draw.textlength(label, font=font(size, True))
    draw.rounded_rectangle((x-w/2-12, y-size*.75, x+w/2+12, y+size*.75), radius=size*.75, fill=BG, outline=ACCENT, width=2)
    text(x, y, label, size, ACCENT, True, anchor='mm')

def dashed(a, b, dash=14, gap=10, fill=MUTE, width=2):
    (x0, y0), (x1, y1) = a, b
    n = ((x1-x0)**2+(y1-y0)**2)**.5; step = dash+gap; t = 0
    while t < n:
        s, e = t/n, min(t+dash, n)/n
        draw.line((x0+(x1-x0)*s, y0+(y1-y0)*s, x0+(x1-x0)*e, y0+(y1-y0)*e), fill=fill, width=width)
        t += step

def callout(point, at, lines):
    """A leader from a point on the model to a label block at at."""
    x, y = at
    draw.line((point, (x-20, y+20)), fill=ACCENT, width=3); draw.line(((x-20, y+20), (x-6, y+20)), fill=ACCENT, width=3)
    draw.ellipse((point[0]-7, point[1]-7, point[0]+7, point[1]+7), fill=ACCENT)
    for j, line in enumerate(lines):
        text(x, y+j*42, line, 30 if j == 0 else 26, INK if j == 0 else MUTE, bold=j == 0, maxwidth=W-100-x)

def photo(path, box, crop):
    """A photo cropped to crop (in its pixels), filling box, with round corners."""
    x, y, w, h = box
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGBA').crop(crop)
    p = ImageOps.fit(p, (w, h), Image.Resampling.LANCZOS)
    mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, w-1, h-1), radius=18, fill=255)
    p.putalpha(mask); im.alpha_composite(p, (x, y))

def badge(x, y, label):
    draw.rounded_rectangle((x, y, x+52+draw.textlength(label, font=font(22, True)), y+48), radius=24, fill=INK)
    text(x+26, y+13, label, 22, BG, True)

def new(section, size=(2400, 1800)):
    global im, draw, W, H
    W, H = size; im = Image.new('RGBA', size, BG); draw = ImageDraw.Draw(im)
    im.alpha_composite(logo, (100, 52)); text(210, 66, 'VERYOS', 34, bold=True)
    im.alpha_composite(scad, (W-370, 49)); text(W-288, 67, 'OpenSCAD', 30)
    draw.line((100, 150, W-100, 150), fill=LINE, width=2)
    text(100, 194, section, 26, ACCENT, True, maxwidth=W-200)

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

def v(scene, key):
    """A setting of a scene, e.g. v('thin', 'table_max') -> 30."""
    return SCENES[scene]['values'][key]

def d(scene, key):
    """A size OpenSCAD reported for a scene, e.g. d('printed', 'block_top') -> 37."""
    return SCENES[scene]['dims'][key]

def table_range(s): return f"table {v(s, 'table_min'):g}–{v(s, 'table_max'):g}"

VARIANTS = ['printed', 'thin', 'thick', 'far']
NAMES = {'printed': 'PRINTED', 'thin': 'THIN DESK', 'thick': 'THICK DESK', 'far': 'FAR FROM EDGE'}
def short(s): return table_range(s) if s != 'far' else f"pin {v(s, 'pin_x'):g} in"

def lineup(box, label_size=26):
    """The four variants side by side at one scale, labelled under them."""
    x, y, w, h = box
    gap = 60
    crops = [tight(n) for n in VARIANTS]
    f = min((w-gap*3)/sum(c.width for c in crops), h/max(c.height for c in crops))
    x += (w-gap*3-f*sum(c.width for c in crops))/2
    for c, name in zip(crops, VARIANTS):
        c = c.resize((round(c.width*f), round(c.height*f)), Image.Resampling.LANCZOS)
        im.alpha_composite(c, (round(x), y+h-c.height))
        label = short(name)
        text(round(x+c.width/2), y+h+22, label, label_size, bold=True, anchor='ma')
        x += c.width+gap

COVER_FOOTER = 'PHOTO: PRINTED, PETG-CF  /  VARIANTS: CAD RENDERS, SAME SCALE, ILLUSTRATIVE COLORS  /  SIZES IN MM'
# In the photo of the arm in the clamp: the clamp and the arm's joint.
HERO_CROP = (0, 330, 1200, 1597)

# Cover, landscape: the printed clamp holding the arm, and four variants as CAD renders.
new('PARAMETRIC TABLE CLAMP  /  OPENSCAD SOURCE')
text(94, 262, 'MIC ARM', 104, bold=True)
text(94, 392, 'TABLE CLAMP', 104, bold=True)
text(100, 560, 'Holds the 12.5 mm pin', 38, MUTE)
text(100, 616, 'of a microphone arm.', 38, MUTE)
for j, label in enumerate(['Tables 10 to 50 mm thick', '16 mm screw with a T bar', 'Two parts, no supports']):
    draw.ellipse((100, 733+j*64, 114, 747+j*64), fill=ACCENT)
    text(137, 725+j*64, label, 32)
photo(PHOTO_ARM, (1040, 200, 1260, 1330), HERO_CROP)
badge(1070, 1452, 'PRINTED · PETG-CF')
text(100, 1180, 'FOUR VARIANTS. ONE SCRIPT.', 28, ACCENT, True)
draw.line((100, 1228, 1000, 1228), fill=LINE, width=2)
lineup((100, 1255, 880, 270), 22)
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FOOTER)
save('thumbnail_4x3.png')

# Cover, portrait.
new('PARAMETRIC TABLE CLAMP  /  OPENSCAD SOURCE', (1800, 2400))
text(94, 262, 'MIC ARM TABLE CLAMP', 96, bold=True, maxwidth=1600)
text(100, 400, 'Holds the 12.5 mm pin of a microphone arm.', 34, MUTE, maxwidth=1600)
photo(PHOTO_ARM, (100, 480, 1600, 1250), (0, 300, 1200, 1238))
badge(130, 1652, 'PRINTED · PETG-CF')
text(100, 1760, 'FOUR VARIANTS. ONE SCRIPT.', 28, ACCENT, True)
draw.line((100, 1808, W-100, 1808), fill=LINE, width=2)
lineup((100, 1835, 1600, 300), 24)
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FOOTER)
save('thumbnail_3x4.png')

COLUMNS = [100+i*560 for i in range(4)]
CW = 515

new('01 / FOUR VARIANTS')
heading('Four variants, one script.', 'Presets in the Customizer: Printed, Thin desk, Thick desk, Far from edge. Same scale.')
for x, name in zip(COLUMNS, VARIANTS):
    draw.line((x, 460, x+CW, 460), fill=LINE, width=2)
    text(x, 492, NAMES[name], 40, bold=True, maxwidth=CW)
same_scale(VARIANTS, [(x, 580, CW, 640) for x in COLUMNS])
for x, name in zip(COLUMNS, VARIANTS):
    lines = [f"table {v(name, 'table_min'):g} to {v(name, 'table_max'):g} mm",
             f"table_min = {v(name, 'table_min'):g}", f"table_max = {v(name, 'table_max'):g}",
             f"pin_x = {v(name, 'pin_x'):g}"]
    for j, line in enumerate(lines):
        text(x, 1265+j*48, line, 29, INK if j == 0 else MUTE, bold=j == 0, maxwidth=CW)
footer(['Or make your own: measure your table,',
        'then set table_min and table_max. pin_x moves the arm further onto the table.'],
       'SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS: THE ARM\'S PIN IN GREY, LIFTED OUT OF ITS HOLE  /  MM')
save('images/01_four_variants.png')

# Side views: the table edge at x = 0, the screw all the way in.
new('02 / TABLE THICKNESS')
heading('From thin desks to thick tops.', 'table_max sets the gap between the jaws, table_min how far the screw reaches. Same scale.')
MM = 5.8
for i, name in enumerate(['thin', 'printed', 'thick']):
    x = 100+i*745
    draw.line((x, 460, x+690, 460), fill=LINE, width=2)
    text(x, 492, NAMES[name], 40, bold=True)
    text(x, 552, f"table_max = {v(name, 'table_max'):g}   table_min = {v(name, 'table_min'):g}", 27, MUTE, maxwidth=690)
    at = side('side_'+name, (x+40+16*MM, 615+d(name, 'block_top')*MM), MM)
    px = v(name, 'pin_x')
    dimension(at(px+12, 0), at(px+12, -v(name, 'table_max')), f"{v(name, 'table_max'):g}", (60, 0))
    dimension(at(px, 0), at(px, -v(name, 'table_min')), f"{v(name, 'table_min'):g}", (-50, 0))
footer(['The jaw gap is the thickest table. With the screw all the way in,',
        'its tip stops table_min below the top jaw: the thinnest table.'],
       'SIDE VIEWS, SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  pin_x = 24  /  DIMENSIONS IN MM')
save('images/02_table_thickness.png')

new('03 / PIN POSITION')
heading('Arm and screw further onto the table.', 'pin_x: the pin and the screw axis from the table edge. The jaws grow with it. Same scale.')
MM = 7
for i, (name, scene) in enumerate([('14', 'side_pin14'), ('24', 'side_printed'), ('40', 'side_pin40')]):
    x = 100+i*745
    draw.line((x, 460, x+690, 460), fill=LINE, width=2)
    text(x, 492, f'pin_x = {name}', 40, bold=True)
    text(x, 552, 'as printed' if name == '24' else 'close to the edge' if name == '14' else 'Far from edge preset', 27, MUTE)
    at = side(scene, (x+40+16*MM, 650+d('printed', 'block_top')*MM), MM)
    px = float(name); bottom = -v('printed', 'table_min')-d('printed', 'screw_length')-d('printed', 'bar_width')
    dashed(at(px, d('printed', 'block_top')+10), at(px, bottom-6))
    dashed(at(0, 6), at(0, -16))
    dimension(at(0, -5), at(px, -5), name, (0, -34))
footer(['The screw sits right under the pin, as on the arm\'s own clamp.',
        'Further in, the C bends more: give it more walls and infill.'],
       'SIDE VIEWS, SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  DASHED: PIN AND SCREW AXIS, TABLE EDGE  /  MM')
save('images/03_pin_position.png')

new('04 / FIT')
heading('Pin hole and thread.', 'Cut through the middle: the Printed preset, the arm\'s pin in its hole, the screw against a 30 mm table.')
MM = 7.2
at = side('section', (215, 470+d('printed', 'block_top')*MM), MM)
px, top, floor = v('printed', 'pin_x'), d('printed', 'block_top'), d('printed', 'pin_hole_floor')
r, hole_r, jaw = d('printed', 'pin_r'), d('printed', 'hole_d')/2, d('printed', 'lower_jaw_bottom')
callout(at(px+r, top-8), (1000, 470), ['pin_hole_diameter = 12.6', 'the arm\'s pin: 12.5, measured', 'a teardrop: prints lying, no support'])
callout(at(px, floor), (1000, 700), ['pin_hole_depth = 32', 'the pin is 30 long'])
callout(at(-8, -20), (1000, 890), ['spine_thickness = 16', 'printed on its side: the layers run around the C'])
callout(at(px+hole_r, jaw+10), (1000, 1080), ['thread_diameter = 16, thread_pitch = 2', '45° flanks: print lying, no support'])
callout(at(px-hole_r, jaw+4), (1000, 1270), ['thread_clearance = 0.25 per side', 'PETG-CF: a tight fit, so not less'])
footer(['A metal pin in a printed hole: a printed hole comes out smaller.',
        'If the pin is too tight, raise pin_hole_diameter by 0.1 or 0.2.'],
       'SECTION, CAD RENDER  /  ILLUSTRATIVE COLORS: THE ARM\'S PIN IN GREY  /  SIZES IN MM')
save('images/04_fit.png')

new('05 / PRINT AND ASSEMBLE')
heading('Two parts. No supports. No hardware.', 'part = "print_layout": clamp and screw on the bed. Printed preset, as in the photos.')
draw.rounded_rectangle((100, 465, 1535, 1520), radius=18, fill='#BCB9AD')
picture('print', (130, 485, 1375, 1015))
rows = [('01', 'CLAMP', ['On its side, 40 high.', 'The layers run around the C.']),
        ('02', 'SCREW', ['On its flat, the logo up.', 'Thread cut flat on the bed side.']),
        ('03', 'ASSEMBLE', ['Screw in from below, slide over', 'the edge, tighten, drop the pin in.']),
        ('04', 'HARDWARE', ['None.', ''])]
for i, (number, title, lines) in enumerate(rows):
    y = 480+i*262
    text(1590, y, number, 27, ACCENT, True); text(1590, y+44, title, 36, bold=True)
    for j, line in enumerate(lines): text(1590, y+100+j*40, line, 26, MUTE, maxwidth=710)
footer(['PETG-CF, 0.2 mm layers, 4 walls, 15% infill, no supports: as in the 3mf.',
        'A PLA print with 2 walls split at the thread when tightened hard: use PETG.'],
       'CAD RENDER OF THE PRINT LAYOUT  /  ILLUSTRATIVE COLORS  /  3MF FOR THE ELEGOO CENTAURI CARBON 2')
save('images/05_print.png')

# A review sheet of everything to upload, in upload order.
files = [(OUT/'thumbnail_4x3.png', 'cover'), (PHOTO_ARM, 'photo arm'), (PHOTO_WIDE, 'photo wide'),
         (PHOTO_UNDER, 'photo underside'), (PHOTO_LOGO, 'photo logo'),
         *[(p, p.stem) for p in sorted((OUT/'images').glob('*.png'))], (OUT/'thumbnail_3x4.png', 'portrait cover')]
sheet = Image.new('RGB', (1600, 960), BG); sd = ImageDraw.Draw(sheet)
for i, (path, label) in enumerate(files):
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGB'); p.thumbnail((380, 285), Image.Resampling.LANCZOS)
    x = (i % 4)*400; y = (i//4)*320
    sheet.paste(p, (x+(400-p.width)//2, y+10))
    sd.text((x+12, y+298), f'{i+1}  {label}', font=font(16), fill=INK)
sheet.save(OUT/'contact-sheet.png', optimize=True, compress_level=9, icc_profile=ICC)
print('FONT', FAMILY)
