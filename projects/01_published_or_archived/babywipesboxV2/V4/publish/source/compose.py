# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Compose the publication PNGs from the CAD renders, the photos and the brand assets."""
import io, json, os, re, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageOps
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

OUT = Path(__file__).resolve().parent.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[3]
cfg = json.loads(Path(sys.argv[1]).read_text())
PRESETS = json.loads((PROJECT/'babywipesboxV4.json').read_text())['parameterSets']
PHOTOS = PROJECT/'printed/WhatsApp Unknown 2026-11-03 at 00.04.03'
def photo_path(n): return PHOTOS/f'WhatsApp Image 2026-11-03 at {n}.jpeg'
PHOTO_CLOSED = photo_path('00.03.56 (1)')
PHOTO_OPEN = photo_path('00.03.56 (4)')
PHOTO_TOP = photo_path('00.03.57 (3)')
PHOTO_HINGE = photo_path('00.03.57 (4)')
PHOTO_MAGNET = photo_path('00.03.57 (6)')
BG, INK, MUTE, LINE, AMBER = '#F4EFE4', '#243C3A', '#64726B', '#D5CFC2', '#A15B23'
FONT = os.environ.get('PUBLISH_FONT') or subprocess.check_output(['fc-match','-f','%{file}','Consolas'],text=True)
FAMILY = ImageFont.truetype(FONT,20).getname()[0]
BOLD = os.environ.get('PUBLISH_FONT_BOLD') or subprocess.check_output(['fc-match','-f','%{file}',FAMILY+':style=Bold'],text=True)
ICC = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
fonts = {}

def font(size, bold=False):
    if (size,bold) not in fonts: fonts[size,bold] = ImageFont.truetype(BOLD if bold else FONT, size)
    return fonts[size,bold]

def text(x, y, s, size=32, fill=INK, bold=False, maxwidth=None):
    if maxwidth:
        while draw.textlength(s, font=font(size,bold)) > maxwidth: size -= 1
    draw.text((x,y), s, font=font(size,bold), fill=fill, anchor='la')

def svg_logo(width):
    h = round(width*31.2528266758/43.9095293518)
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, h)
    rect = Rsvg.Rectangle(); rect.x = 0; rect.y = 0; rect.width = width; rect.height = h
    Rsvg.Handle.new_from_data((ROOT/'veryos_logo.svg').read_bytes()).render_document(cairo.Context(surface), rect)
    stream = io.BytesIO(); surface.write_to_png(stream); stream.seek(0)
    return Image.open(stream).convert('RGBA')

logo = svg_logo(86)
scad = Image.open(PROJECT.parent/'publish/source/assets/openscad.png').convert('RGBA')
scad.thumbnail((64,64), Image.Resampling.LANCZOS)
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

def photo(path, box, crop):
    """A photo cropped to crop (in its pixels), filling box, with round corners."""
    x, y, w, h = box
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGBA').crop(crop)
    p = ImageOps.fit(p, (w,h), Image.Resampling.LANCZOS)
    mask = Image.new('L', (w,h), 0); ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1), radius=18, fill=255)
    p.putalpha(mask); im.alpha_composite(p, (x,y))

def badge(x, y, label):
    draw.rounded_rectangle((x,y,x+52+draw.textlength(label, font=font(22,True)),y+48), radius=24, fill=INK)
    text(x+26,y+13,label,22,BG,True)

def new(section, size=(2400,1800)):
    global im, draw, W, H
    W, H = size; im = Image.new('RGBA', size, BG); draw = ImageDraw.Draw(im)
    im.alpha_composite(logo, (100,52)); text(210,66,'VERYOS',34,bold=True)
    im.alpha_composite(scad, (W-370,49)); text(W-288,67,'OpenSCAD',30)
    draw.line((100,150,W-100,150), fill=LINE, width=2)
    text(100,194,section,26,AMBER,True,maxwidth=W-200)

def heading(title, subtitle):
    text(95,251,title,84,bold=True,maxwidth=W-190)
    text(100,363,subtitle,31,MUTE,maxwidth=W-200)

def footer(lines, fine):
    y = H-230 if len(lines) > 1 else H-175
    draw.rounded_rectangle((100,y,W-100,H-85), radius=16, fill=INK)
    for i, line in enumerate(lines):
        text(133, y+26+i*49, line, 30, BG, bold=i==0, maxwidth=W-266)
    text(100,H-48,fine,20,MUTE,maxwidth=W-200)

def save(name):
    im.convert('RGB').save(OUT/name, optimize=True, compress_level=9, icc_profile=ICC)
    print('COMPOSED', name, flush=True)

def echo(scene, key):
    """The numbers OpenSCAD reported for a scene, e.g. 'Opening' -> [106, 48]."""
    line = next(l for l in next(s for s in cfg['scenes'] if s['id'] == scene)['echo'] if key in l)
    return [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', line.split(key)[1])]

def mm(values):
    return ' × '.join(f'{v:g}' for v in values)

SIZES = ['everyday', 'cube', 'long', 'tall']
NAMES = {s: s.capitalize() for s in SIZES}
def nominal(s): return [float(PRESETS[NAMES[s]][k]) for k in ('box_width','box_depth','box_height')]
def style(s): return f"{PRESETS[NAMES[s]]['corner_style']}, {PRESETS[NAMES[s]]['exterior_pattern']}"
# In the photo of the closed box, the box with a margin, at 4:3.
HERO_CROP = (90, 60, 1970, 1470)

def lineup(box, label_size=26):
    """The four sizes side by side at one scale, with their box sizes under them."""
    x, y, w, h = box
    gap = 60
    crops = [tight(n) for n in SIZES]
    f = min((w-gap*3)/sum(c.width for c in crops), h/max(c.height for c in crops))
    x += (w-gap*3-f*sum(c.width for c in crops))/2
    for c, name in zip(crops, SIZES):
        c = c.resize((round(c.width*f), round(c.height*f)), Image.Resampling.LANCZOS)
        im.alpha_composite(c, (round(x), y+h-c.height))
        label = mm(nominal(name))
        text(round(x+c.width/2-draw.textlength(label, font=font(label_size,True))/2), y+h+22, label, label_size, bold=True)
        x += c.width+gap

COVER_FOOTER = 'PHOTO: PRINTED EVERYDAY PRESET  /  SIZES: CAD RENDERS, SAME SCALE, ILLUSTRATIVE COLORS  /  BOX SIZES IN MM'

# Cover, landscape: the printed box, and the four sizes as CAD renders.
new('PARAMETRIC WIPES BOX  /  OPENSCAD SOURCE')
text(94,262,'BABY WIPES',104,bold=True)
text(94,392,'BOX',104,bold=True)
text(100,560,'Magnetic cover. Flip lid.',38,MUTE)
text(100,616,'Your size, your pattern.',38,MUTE)
for j, label in enumerate(['Rectangular or rounded corners','Seven exterior patterns','Filament hinge, ten magnets']):
    draw.ellipse((100,733+j*64,114,747+j*64), fill=AMBER)
    text(137,725+j*64,label,32)
photo(PHOTO_CLOSED, (1040,200,1260,945), HERO_CROP)
badge(1070,1067,'PRINTED · EVERYDAY PRESET')
text(100,1180,'FOUR SIZES. ONE SCRIPT.',28,AMBER,True)
draw.line((100,1228,W-100,1228), fill=LINE, width=2)
lineup((100,1255,2200,300))
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FOOTER)
save('thumbnail_4x3.png')

# Cover, portrait.
new('PARAMETRIC WIPES BOX  /  OPENSCAD SOURCE', (1800,2400))
text(94,262,'BABY WIPES BOX',104,bold=True)
text(100,410,'Magnetic cover. Flip lid. Your size, your pattern.',34,MUTE,maxwidth=1600)
photo(PHOTO_CLOSED, (100,500,1600,1200), HERO_CROP)
badge(130,1622,'PRINTED · EVERYDAY PRESET')
text(100,1745,'FOUR SIZES. ONE SCRIPT.',28,AMBER,True)
draw.line((100,1793,W-100,1793), fill=LINE, width=2)
lineup((100,1820,1600,330), 24)
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FOOTER)
save('thumbnail_3x4.png')

COLUMNS = [100+i*560 for i in range(4)]
CW = 515

new('01 / FOUR SIZES')
heading('Four sizes, one script.','Presets Everyday, Cube, Long and Tall in the Customizer. Shown at the same scale.')
for x, name in zip(COLUMNS, SIZES):
    draw.line((x,460,x+CW,460), fill=LINE, width=2)
    text(x,492,NAMES[name].upper(),40,bold=True)
same_scale(SIZES, [(x,580,CW,600) for x in COLUMNS])
for x, name in zip(COLUMNS, SIZES):
    lines = [mm(nominal(name))+' mm', 'outside '+mm(echo(name,'including pattern:')), style(name),
             'opening '+mm(echo(name,'Opening:')[:2])]
    for j, line in enumerate(lines):
        text(x,1235+j*48,line,29,INK if j == 0 else MUTE,bold=j == 0,maxwidth=CW)
footer(['Or make your own size.',
        'Measure your refill pack, then set box_width, box_depth and box_height.'],
       'SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  FIRST LINE: BOX SETTINGS IN MM, OUTSIDE ADDS THE PATTERN')
save('images/01_four_sizes.png')

PATTERNS = ['none','ribs','flutes','spiral','diamond','waves','chevron']
new('02 / SEVEN PATTERNS')
heading('Seven patterns, one parameter.','exterior_pattern on the Everyday box: 200 × 120 × 65 mm, rectangular corners. Same scale.')
cells = [(COLUMNS[i%4], 455+(i//4)*530) for i in range(8)]
for i, ((x, y), name) in enumerate(zip(cells, PATTERNS)):
    draw.line((x,y,x+CW,y), fill=LINE, width=2)
    text(x,y+24,f'{i+1:02d}',27,AMBER,True); text(x+56,y+20,name if name != 'none' else 'none (smooth)',34,bold=True)
same_scale(['pattern_'+p for p in PATTERNS], [(x,y+90,CW,385) for x, y in cells[:7]])
x, y = cells[7]
draw.line((x,y,x+CW,y), fill=LINE, width=2)
text(x,y+20,'TUNE IT',34,AMBER,True)
for j, line in enumerate(['pattern_depth  3 mm','pattern_count  52','pattern_pitch  12 mm','pattern_twist  90°','pattern_on_box / _cover']):
    text(x,y+100+j*56,line,29,MUTE,maxwidth=CW)
footer(['The pattern runs on across the closed seam.',
        'It adds material outside the wall: the inside, the seats and the fit stay the same.'],
       'SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  DEFAULT PATTERN SETTINGS')
save('images/02_patterns.png')

new('03 / CORNERS AND LOGO')
heading('Rectangular or rounded.','corner_style changes the box, the opening, the lid and the corner posts. Lid open at 110°.')
panels = [('rectangular','RECTANGULAR',['Sharp-edged cuboid','Rectangular opening and lid','Square corner posts']),
          ('rounded','ROUNDED',['corner_radius = 8 mm','Capsule-shaped opening and lid','Round corner posts']),
          ('logo','LOGO INSIDE',['VeryOS logo in the floor, 40 mm','Visible through the opening','engrave_logo = false: off'])]
cw = 690
for i, (name, title, lines) in enumerate(panels):
    x = 100+i*755
    draw.line((x,460,x+cw,460), fill=LINE, width=2)
    text(x,492,title,40,bold=True,maxwidth=cw)
    for j, line in enumerate(lines): text(x,1235+j*48,line,29,MUTE,maxwidth=cw)
same_scale(['rectangular','rounded'], [(100+i*755,570,cw,620) for i in range(2)])
picture('logo', (100+2*755,570,cw,620))
footer(['Every pattern works with both corner styles.',
        'Seats, magnets, hinge and grip lip stay the same.'],
       'CAD RENDERS  /  EVERYDAY PRESET  /  ILLUSTRATIVE COLORS: LOGO ENGRAVING SHOWN IN AMBER, PRINTS IN THE BOX COLOUR')
save('images/03_corners.png')

new('04 / PRINT AND ASSEMBLE')
heading('Three parts. Ten magnets. One pin.','part = "print_layout": box, cover and lid on the bed. Everyday preset, as printed.')
draw.rounded_rectangle((100,465,1535,1520), radius=18, fill='#BCB9AD')
picture('print', (130,485,1375,1015))
rows = [('01','BOX',['Opening up. No supports.','Brim against lifting corners.']),
        ('02','COVER',['Top up, on its locating rim.','No supports.']),
        ('03','LID',['On its tapered insert.','No supports.']),
        ('04','HARDWARE',['10 disc magnets, 6 × 2 mm','47 mm of 1.75 mm filament'])]
for i, (number, title, lines) in enumerate(rows):
    y = 480+i*262
    text(1590,y,number,27,AMBER,True); text(1590,y+44,title,36,bold=True)
    for j, line in enumerate(lines): text(1590,y+100+j*40,line,26,MUTE,maxwidth=710)
footer(['PLA, 0.28 mm layers, 2 walls, 15% infill, no supports: as in the 3mf.',
        'Glue the magnets in, polarity first. The hinge pin is a piece of 1.75 mm filament.'],
       'CAD RENDER OF THE PRINT LAYOUT  /  ILLUSTRATIVE COLORS  /  3MF FOR BAMBU LAB A1 AND SNAPMAKER U1')
save('images/04_print.png')

# A review sheet of everything to upload, in upload order.
files = [(OUT/'thumbnail_4x3.png','cover'), (PHOTO_CLOSED,'photo closed'), (PHOTO_OPEN,'photo open'),
         (PHOTO_TOP,'photo lid'), (PHOTO_HINGE,'photo hinge pin'), (PHOTO_MAGNET,'photo magnets'),
         *[(p, p.stem) for p in sorted((OUT/'images').glob('*.png'))], (OUT/'thumbnail_3x4.png','portrait cover')]
sheet = Image.new('RGB', (1600,960), BG); sd = ImageDraw.Draw(sheet)
for i, (path, label) in enumerate(files):
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGB'); p.thumbnail((380,285), Image.Resampling.LANCZOS)
    x = (i%4)*400; y = (i//4)*320
    sheet.paste(p, (x+(400-p.width)//2, y+10))
    sd.text((x+12,y+298), f'{i+1}  {label}', font=font(16), fill=INK)
sheet.save(OUT/'contact-sheet.png', optimize=True, compress_level=9, icc_profile=ICC)
print('FONT', FAMILY)
