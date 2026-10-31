# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Compose the publication PNGs from the CAD renders, the photos and the brand assets."""
import io, os, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageOps
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

OUT = Path(__file__).resolve().parent.parent
PROJECT = OUT.parent
ROOT = PROJECT.parent.parent
PHOTOS = PROJECT/'images'
PHOTO_PARTS = PHOTOS/'WhatsApp Image 2026-10-31 at 16.25.43.jpeg'
PHOTO_SIDE = PHOTOS/'WhatsApp Image 2026-10-31 at 16.25.43 (1).jpeg'
PHOTO_TILT = PHOTOS/'WhatsApp Image 2026-10-31 at 16.25.43 (2).jpeg'
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
    draw.text((x,y), s, font=font(size,bold), fill=fill, anchor='lt')

def svg_logo(width):
    h = round(width*31.2528266758/43.9095293518)
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, h)
    rect = Rsvg.Rectangle(); rect.x = 0; rect.y = 0; rect.width = width; rect.height = h
    Rsvg.Handle.new_from_data((ROOT/'veryos_logo.svg').read_bytes()).render_document(cairo.Context(surface), rect)
    stream = io.BytesIO(); surface.write_to_png(stream); stream.seek(0)
    return Image.open(stream).convert('RGBA')

logo = svg_logo(86)
scad = Image.open(ROOT/'projects/01_published_or_archived/fdm_optimized_screws/publish/source/assets/openscad.png').convert('RGBA')
scad.thumbnail((64,64), Image.Resampling.LANCZOS)
renders = {p.stem: Image.open(p).convert('RGBA') for p in (OUT/'renders').glob('*.png')}

def visible(pic):
    return pic.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()

def union_crop(names):
    boxes = [visible(renders[n]) for n in names]
    w, h = renders[names[0]].size
    return (max(0, min(b[0] for b in boxes)-18), max(0, min(b[1] for b in boxes)-18),
            min(w, max(b[2] for b in boxes)+18), min(h, max(b[3] for b in boxes)+18))

def picture(name, box, crop=None):
    """A render fitted into box. Renders sharing a crop share a scale."""
    x, y, w, h = box
    p = renders[name].crop(crop or union_crop([name]))
    f = min(w/p.width, h/p.height)
    p = p.resize((round(p.width*f), round(p.height*f)), Image.Resampling.LANCZOS)
    im.alpha_composite(p, (round(x+(w-p.width)/2), round(y+(h-p.height)/2)))

def photo(path, box, crop):
    """A photo cropped to crop (in its pixels), filling box, with round corners."""
    x, y, w, h = box
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGBA').crop(crop)
    p = ImageOps.fit(p, (w,h), Image.Resampling.LANCZOS)
    mask = Image.new('L', (w,h), 0); ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1), radius=18, fill=255)
    p.putalpha(mask); im.alpha_composite(p, (x,y))

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
    y = H-230
    draw.rounded_rectangle((100,y,W-100,H-85), radius=16, fill=INK)
    for i, line in enumerate(lines):
        text(133, y+(55 if len(lines)==1 else 29)+i*49, line, 30, BG, bold=i==0, maxwidth=W-266)
    text(100,H-48,fine,20,MUTE,maxwidth=W-200)

def save(name):
    im.convert('RGB').save(OUT/name, optimize=True, compress_level=9, icc_profile=ICC)
    print('COMPOSED', name, flush=True)

SIZES = ['small','medium','large']
SPECS = {'small': ['14 mm ball', 'M3 mounting holes', '6 mm screw, 40 mm lever', 'plate 28 × 28 mm', 'tilt 42°'],
         'medium': ['20 mm ball', 'M4 mounting holes', '8 mm screw, 50 mm lever', 'plate 36 × 36 mm', 'tilt 45°'],
         'large': ['30 mm ball', 'M5 mounting holes', '10 mm screw, 70 mm lever', 'plate 50 × 50 mm', 'tilt 47°']}

def lineup(names, labels, box, gap=40):
    """Renders side by side, each cropped tight, all at one scale, standing
    on the box's bottom edge, with a label under each."""
    x, y, w, h = box
    crops = [renders[n].crop(visible(renders[n])) for n in names]
    f = min((w-gap*(len(crops)-1))/sum(c.width for c in crops), h/max(c.height for c in crops))
    x += (w-gap*(len(crops)-1)-f*sum(c.width for c in crops))/2
    for c, label in zip(crops, labels):
        c = c.resize((round(c.width*f), round(c.height*f)), Image.Resampling.LANCZOS)
        im.alpha_composite(c, (round(x), y+h-c.height))
        text(round(x+c.width/2-draw.textlength(label, font=font(26,True))/2), y+h+22, label, 26, bold=True)
        x += c.width+gap

# Cover: the printed large size, and the three sizes as CAD renders.
new('PARAMETRIC BALL JOINT  /  OPENSCAD SOURCE')
text(94,262,'BALL SOCKET',104,bold=True)
text(94,392,'BRACKET',104,bold=True)
text(100,560,'Snap it in. Set the angle.',38,MUTE)
text(100,616,'Lock it with the lever.',38,MUTE)
for j, label in enumerate(['Snap-in ball, 45° tilt','Printed clamp screw','Two screw-on plates']):
    draw.ellipse((100,733+j*64,114,747+j*64), fill=AMBER)
    text(137,725+j*64,label,32)
photo(PHOTO_TILT, (1180,200,1120,1320), (400,10,1590,1413))
badge = 'PRINTED · LARGE'
draw.rounded_rectangle((1210,1446,1262+draw.textlength(badge, font=font(22,True)),1494), radius=24, fill=INK)
text(1236,1459,badge,22,BG,True)
text(100,995,'THREE SIZES. ONE SCRIPT.',28,AMBER,True)
draw.line((100,1050,1080,1050), fill=LINE, width=2)
lineup(SIZES, [SPECS[n][0] for n in SIZES], (100,1080,980,330))
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'],
       'PHOTO: PRINTED LARGE SIZE  /  SIZES: CAD RENDERS, SAME SCALE, ILLUSTRATIVE COLORS')
save('thumbnail_4x3.png')

new('01 / THREE SIZES')
heading('Three sizes, one script.','Presets small, medium and large in the Customizer. Shown at the same scale.')
crop = union_crop(SIZES); cw = 690
for i, name in enumerate(SIZES):
    x = 100+i*755
    draw.line((x,460,x+cw,460), fill=LINE, width=2)
    text(x,492,name.upper(),40,bold=True)
    picture(name, (x,570,cw,640), crop)
    for j, line in enumerate(SPECS[name]):
        text(x,1235+j*48,line,29,INK if j == 0 else MUTE,bold=j == 0,maxwidth=cw)
footer(['Or make your own size.',
        'Change ball_d, plate_width, hole_spacing, thread_d or any other value.'],
       'SAME SCALE  /  CAD RENDERS  /  4 MM SLOT, AS IN THE STL FILES  /  DIMENSIONS IN MM')
save('images/01_three_sizes.png')

new('02 / HOW IT WORKS')
heading('Snap. Tilt. Lock.','Medium size. Two of the views are cut open; the cut faces are lighter.')
panels = [('section','1  SNAP IN',['The ring reaches 15° above','the ball\'s equator. The ball','clicks in and stays put.']),
          ('tilt','2  SET THE ANGLE',['About 45° in every direction','before the neck meets','the ring\'s rim.']),
          ('screwcut','3  LOCK',['The lever turns a printed','screw. The slot closes and','the ring grips the ball.'])]
cw = 690
for i, (name, title, lines) in enumerate(panels):
    x = 100+i*755
    draw.line((x,460,x+cw,460), fill=LINE, width=2)
    text(x,492,title,40,bold=True,maxwidth=cw)
    picture(name, (x,570,cw,640))
    for j, line in enumerate(lines): text(x,1235+j*48,line,29,MUTE,maxwidth=cw)
footer(['45° FDM thread, 2 mm pitch, 0.25 mm clearance.',
        'The thread from the VeryOS fdm_optimized_screws tests. No hardware in the joint.'],
       'CAD RENDERS  /  MEDIUM SIZE  /  ILLUSTRATIVE COLORS')
save('images/02_how_it_works.png')

new('03 / PRINT')
heading('Three parts, one plate.','test1_snap.3mf: the medium size, ready for the slicer.')
draw.rounded_rectangle((100,465,1535,1520), radius=18, fill='#BCB9AD')
picture('plate', (130,485,1375,1015))
rows = [('01','SOCKET',['Flat on its plate. No support.','The screw holes print sideways.']),
        ('02','BALL',['On an edge of its plate, so the','layers run along the neck.','Support under neck and ball.']),
        ('03','SCREW',['Lying on its cut flat side.','No support.'])]
for i, (number, title, lines) in enumerate(rows):
    y = 500+i*330
    text(1590,y,number,27,AMBER,True); text(1590,y+44,title,36,bold=True)
    for j, line in enumerate(lines): text(1590,y+100+j*40,line,26,MUTE,maxwidth=710)
footer(['PLA, 2 walls, 15% infill, tree supports: as saved in the 3mf.',
        'STL files for all three sizes come in print orientation.'],
       '3MF: MEDIUM SIZE, 2 MM SLOT  /  STL FILES: 4 MM SLOT  /  CAD RENDER OF THE 3MF')
save('images/03_print.png')

# A review sheet of everything to upload, in upload order.
files = [(OUT/'thumbnail_4x3.png','cover'), (PHOTO_TILT,'photo tilted'), (PHOTO_SIDE,'photo side'),
         (PHOTO_PARTS,'photo parts'), *[(p, p.stem) for p in sorted((OUT/'images').glob('*.png'))]]
sheet = Image.new('RGB', (1600,640), BG); sd = ImageDraw.Draw(sheet)
for i, (path, label) in enumerate(files):
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGB'); p.thumbnail((380,285), Image.Resampling.LANCZOS)
    x = (i%4)*400; y = (i//4)*320
    sheet.paste(p, (x+(400-p.width)//2, y+10))
    sd.text((x+12,y+298), f'{i+1}  {label}', font=font(16), fill=INK)
sheet.save(OUT/'contact-sheet.png', optimize=True, compress_level=9, icc_profile=ICC)
print('FONT', FAMILY)
