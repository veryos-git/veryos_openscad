# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Compose the publication PNGs from the CAD renders, the photos and the brand assets."""
import io, json, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageOps
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROJECT = OUT.parent
ROOT = PROJECT.parents[3]
cfg = json.loads(Path(sys.argv[1]).read_text())
PRESETS = json.loads((PROJECT/'phone_camera_thread_holderV4.json').read_text())['parameterSets']
PHOTOS = OUT/'WhatsApp Unknown 2026-11-06 at 19.44.53'
def photo_path(n): return PHOTOS/f'WhatsApp Image 2026-11-06 at 19.44.{n}.jpeg'
PHOTO_ARM = photo_path('40 (4)')
PHOTO_END = photo_path('40 (2)')
PHOTO_BACK = photo_path('40 (3)')
# The photos to upload as they are, with what they show. The others show the
# phone's brand, or repeat one of these.
UPLOADS = [(PHOTO_ARM,'photo ball head'), (photo_path('41 (1)'),'photo thread'), (photo_path('40 (1)'),'photo hook grip'),
           (photo_path('43 (1)'),'photo back'), (photo_path('41 (2)'),'photo screw logo'), (photo_path('41 (4)'),'photo bed side')]
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
scad = Image.open(HERE/'assets/openscad.png').convert('RGBA')
scad.thumbnail((64,64), Image.Resampling.LANCZOS)
renders = {p.stem: Image.open(p).convert('RGBA') for p in (OUT/'renders').glob('*.png')}

def visible(pic):
    return pic.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()

def tight(name):
    return renders[name].crop(visible(renders[name]))

def picture(name, box):
    """A render cropped tight and fitted into box. Returns where it landed."""
    x, y, w, h = box
    p = tight(name)
    f = min(w/p.width, h/p.height)
    p = p.resize((round(p.width*f), round(p.height*f)), Image.Resampling.LANCZOS)
    at = (round(x+(w-p.width)/2), round(y+(h-p.height)/2))
    im.alpha_composite(p, at)
    return (*at, p.width, p.height)

def same_scale(names, boxes):
    """Renders that share a camera scale, each centred in its box and standing
    on its bottom edge, all at one factor so their sizes compare."""
    crops = [tight(n) for n in names]
    f = min(min(b[2]/c.width, b[3]/c.height) for c, b in zip(crops, boxes))
    for c, (x, y, w, h) in zip(crops, boxes):
        c = c.resize((round(c.width*f), round(c.height*f)), Image.Resampling.LANCZOS)
        im.alpha_composite(c, (round(x+(w-c.width)/2), y+h-c.height))

def photo(path, box, crop=None):
    """A photo cropped to crop (in its pixels), filling box, with round corners."""
    x, y, w, h = box
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGBA')
    if crop: p = p.crop(crop)
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

SIZES = ['everyday', 'compact_phone', 'thick_case', 'small_tablet']
NAMES = {s: s.replace('_',' ').capitalize() for s in SIZES}
def preset(s): return PRESETS[NAMES[s]]
def device(s): return f"{preset(s)['phone_width']} × {preset(s)['phone_thickness']}"
def screw(s): return next(c['screw'] for c in cfg['scenes'] if c['id'] == s)

def lineup(box, label_size=26):
    """The four sizes side by side at one scale, with their device sizes under them."""
    x, y, w, h = box
    gap = 60
    crops = [tight(n) for n in SIZES]
    f = min((w-gap*3)/sum(c.width for c in crops), h/max(c.height for c in crops))
    x += (w-gap*3-f*sum(c.width for c in crops))/2
    for c, name in zip(crops, SIZES):
        c = c.resize((round(c.width*f), round(c.height*f)), Image.Resampling.LANCZOS)
        im.alpha_composite(c, (round(x), y+h-c.height))
        label = device(name)
        text(round(x+c.width/2-draw.textlength(label, font=font(label_size,True))/2), y+h+22, label, label_size, bold=True)
        x += c.width+gap

COVER_FOOTER = 'PHOTO: PRINTED EVERYDAY PRESET  /  SIZES: CAD RENDERS, SAME SCALE, ILLUSTRATIVE COLORS  /  WIDTH × THICKNESS WITH CASE, IN MM'

# Cover, landscape: the printed holder, and the four sizes as CAD renders.
new('PARAMETRIC PHONE MOUNT  /  OPENSCAD SOURCE')
text(94,262,'PHONE TRIPOD',104,bold=True)
text(94,392,'MOUNT',104,bold=True)
text(100,560,'Two printed 1/4"-20 threads.',38,MUTE)
text(100,616,'Your phone, your size.',38,MUTE)
for j, label in enumerate(['Push on by hand, lock with the screw','Landscape, flat or at any angle','Prints without supports']):
    draw.ellipse((100,733+j*64,114,747+j*64), fill=AMBER)
    text(137,725+j*64,label,32)
photo(PHOTO_ARM, (1040,200,1260,945))
badge(1070,1067,'PRINTED · EVERYDAY PRESET')
text(100,1180,'FOUR SIZES. ONE SCRIPT.',28,AMBER,True)
draw.line((100,1228,W-100,1228), fill=LINE, width=2)
lineup((100,1255,2200,300))
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FOOTER)
save('thumbnail_4x3.png')

# Cover, portrait.
new('PARAMETRIC PHONE MOUNT  /  OPENSCAD SOURCE', (1800,2400))
text(94,262,'PHONE TRIPOD MOUNT',104,bold=True)
text(100,410,'Two printed 1/4"-20 threads. Your phone, your size.',34,MUTE,maxwidth=1600)
photo(PHOTO_ARM, (100,500,1600,1200))
badge(130,1622,'PRINTED · EVERYDAY PRESET')
text(100,1745,'FOUR SIZES. ONE SCRIPT.',28,AMBER,True)
draw.line((100,1793,W-100,1793), fill=LINE, width=2)
lineup((100,1820,1600,330), 24)
footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'], COVER_FOOTER)
save('thumbnail_3x4.png')

COLUMNS = [100+i*560 for i in range(4)]
CW = 515

new('01 / FOUR SIZES')
heading('Four sizes, one script.','Presets Everyday, Compact phone, Thick case and Small tablet in the Customizer. Shown at the same scale.')
for x, name in zip(COLUMNS, SIZES):
    draw.line((x,460,x+CW,460), fill=LINE, width=2)
    text(x,492,NAMES[name].upper(),40,bold=True,maxwidth=CW)
same_scale(['held_'+s for s in SIZES], [(x,560,CW,640) for x in COLUMNS])
for x, name in zip(COLUMNS, SIZES):
    thing = 'tablet' if name == 'small_tablet' else 'phone'
    lines = [f'{device(name)} mm {thing}', f"grips {preset(name)['grip_min']}–{preset(name)['grip_max']} mm",
             f"{preset(name)['holder_width']} mm hooks", f'{screw(name):g} mm lock screw']
    for j, line in enumerate(lines):
        text(x,1235+j*48,line,29,INK if j == 0 else MUTE,bold=j == 0,maxwidth=CW)
footer(['Or make your own size.',
        'Measure your phone with its case, then set phone_width and phone_thickness.'],
       'SAME SCALE  /  CAD RENDERS, PHONE AS A PLAIN BLOCK  /  ILLUSTRATIVE COLORS: LOGO ENGRAVING SHOWN IN AMBER  /  ONLY EVERYDAY IS PRINTED SO FAR')
save('images/01_four_sizes.png')

new('02 / TWO CAMERA THREADS')
heading('Two threads, no inserts.','1/4"-20 UNC, the standard camera thread, printed straight into the slider.')
panels = [(100, PHOTO_END, (100,380,1500,1531), 'IN THE END', ['Phone in landscape, with the screw head on top.']),
          # Cropped to leave out the phone's brand.
          (1230, PHOTO_BACK, (60,140,1420,1258), 'IN THE BACK', ['Phone with its back to the tripod: flat on a tripod,', 'or at any angle on a ball head tilted 90°.'])]
for x, path, crop, title, lines in panels:
    photo(path, (x,460,1070,880), crop)
    text(x,1365,title,40,bold=True)
    for j, line in enumerate(lines): text(x,1423+j*46,line,29,MUTE,maxwidth=1070)
footer(['Print part = "thread_test" first.',
        'A small block with the same thread. If the tripod screw is tight, raise tripod_thread_clearance (0.3 mm). If loose, lower it.'],
       'PHOTOS: PRINTED EVERYDAY PRESET ON A BALL HEAD  /  THE HOLES ARE 9 MM DEEP: THEY HAVE TO BE DEEPER THAN THE TRIPOD SCREW IS LONG')
save('images/02_two_threads.png')

new('03 / HOW IT WORKS')
heading('Push it on. Screw it tight.','A screw through the end wall pulls the slider into the body until both hooks grip the phone.')
picture('exploded', (100,450,1400,460))
x, y, w, h = picture('section', (100,950,1400,420))
# Callouts along the screw axis. The render runs from the slider's outer end to the
# screw head, 94 mm in the model at this preset, so a model y maps to a pixel.
def px(model_y): return x+(model_y+83)/94*w
axis = y+h*.74
text(round(px(-40)-draw.textlength('PHONE', font=font(24,True))/2),round(y+h*.3),'PHONE',24,bold=True)
for i, (model_y, label) in enumerate([(-70,'GUIDE BAR'), (-44,'BAR THREAD'), (-28,'10 MM THREAD'), (-12,'SMOOTH SHANK'), (.5,'END WALL')]):
    # Every other label one row lower, so neighbours do not touch.
    drop = 30 if i%2 else 0
    draw.line((px(model_y),axis,px(model_y),y+h+24+drop), fill=INK, width=2)
    draw.ellipse((px(model_y)-6,axis-6,px(model_y)+6,axis+6), fill=INK)
    text(round(px(model_y)-draw.textlength(label, font=font(20,True))/2),y+h+30+drop,label,20,bold=True)
rows = [('01','PULL OUT',['Push the bar into the sleeve,','pull it out to fit the phone.']),
        ('02','PUSH ON',['Lay the phone in the hooks, push','in by hand until they touch.']),
        ('03','LOCK',['Screw through the end wall','into the bar: about 5 turns.']),
        ('04','MOUNT',['Screw the slider onto your','tripod or ball head.'])]
for i, (number, title, lines) in enumerate(rows):
    y2 = 470+i*265
    text(1590,y2,number,27,AMBER,True); text(1590,y2+44,title,36,bold=True)
    for j, line in enumerate(lines): text(1590,y2+100+j*40,line,26,MUTE,maxwidth=710)
footer(['The screw is cut to your phone: phone_width sets its length.',
        'At that width it takes 5 turns: 10 mm of thread at 2 mm pitch. A narrower phone takes more; for a wider one, print a longer screw.'],
       'CAD RENDERS  /  ILLUSTRATIVE COLORS  /  EVERYDAY PRESET, CUT ALONG THE LOCK SCREW, WITH THE PHONE AS A PLAIN BLOCK')
save('images/03_how_it_works.png')

new('04 / ONE NUMBER AT A TIME')
heading('Change a number, get a new mount.','One parameter at a time on the Everyday preset, all at the same scale. The middle column is the default.')
ROWS = [('phone_thickness',[10,15,22],'Hook height',['The thickest phone,','with its case.']),
        ('holder_width',[26,30,44],'Hook width',['Along the phone. Narrow','enough to miss its buttons.']),
        ('lip_length',[3,5,9],'Lip over the screen',['How far the hooks reach','over the front.'])]
GRID = [640+i*570 for i in range(3)]
for i, (parameter, values, title, lines) in enumerate(ROWS):
    y = 460+i*365
    draw.line((100,y,W-100,y), fill=LINE, width=2)
    text(100,y+26,title,36,bold=True,maxwidth=500)
    text(100,y+80,parameter,27,AMBER,True)
    for j, line in enumerate(lines): text(100,y+135+j*40,line,26,MUTE,maxwidth=500)
    for x, value in zip(GRID, values):
        text(x,y+26,f'{value} mm',29,bold=True)
    same_scale([f'{parameter}_{v}' for v in values], [(x,y+70,530,280) for x in GRID])
footer(['Also in the Customizer: grip range, walls, guide bar, clearances, thread and logo sizes.',
        'Checks in the script stop the render with a message when key values do not fit together.'],
       'SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  THESE VARIANTS ARE NOT PRINTED YET')
save('images/04_customize.png')

new('05 / PRINT')
heading('Three parts. No supports.','part = "print_layout": body, slider and lock screw on the bed, as printed.')
draw.rounded_rectangle((100,465,1535,1520), radius=18, fill='#D9D5C8')
picture('print', (130,495,1375,995))
rows = [('01','BODY',['On its side: every layer is','the hook profile.']),
        ('02','SLIDER',['On its side, on a keel that','carries the guide bar.']),
        ('03','LOCK SCREW',['On a flat cut, so the layers','run along the shank.']),
        ('04','LOGO',['Engraved in every part,','1 mm deep, in standing walls.'])]
for i, (number, title, lines) in enumerate(rows):
    y = 480+i*262
    text(1590,y,number,27,AMBER,True); text(1590,y+44,title,36,bold=True)
    for j, line in enumerate(lines): text(1590,y+100+j*40,line,26,MUTE,maxwidth=710)
footer(['PLA, 0.4 mm nozzle, 0.2 mm layers, 2 walls, 15% infill, no supports: as in the 3mf.',
        'No hardware needed: the lock screw is printed too.'],
       'CAD RENDER OF THE PRINT LAYOUT  /  ILLUSTRATIVE COLORS: LOGO ENGRAVING SHOWN IN AMBER AND CREAM  /  3MF FOR BAMBU LAB A1')
save('images/05_print.png')

# A review sheet of everything to upload, in upload order.
files = [(OUT/'thumbnail_4x3.png','cover'), *UPLOADS, *[(p, p.stem) for p in sorted((OUT/'images').glob('*.png'))],
         (OUT/'thumbnail_3x4.png','portrait cover')]
rows = (len(files)+3)//4
sheet = Image.new('RGB', (1600,rows*320), BG); sd = ImageDraw.Draw(sheet)
for i, (path, label) in enumerate(files):
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGB'); p.thumbnail((380,285), Image.Resampling.LANCZOS)
    x = (i%4)*400; y = (i//4)*320
    sheet.paste(p, (x+(400-p.width)//2, y+10))
    sd.text((x+12,y+298), f'{i+1}  {label}', font=font(16), fill=INK)
sheet.save(OUT/'contact-sheet.png', optimize=True, compress_level=9, icc_profile=ICC)
print('FONT', FAMILY)
