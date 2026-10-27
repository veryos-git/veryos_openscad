# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Compose publication PNGs from the CAD renders and existing brand assets."""
import hashlib, io, json, os, subprocess, sys, zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

cfg = json.loads(Path(sys.argv[1]).read_text())
ROOT, OUT = Path(cfg['root']), Path(cfg['output'])
BG, INK, MUTE, LINE, AMBER = '#F4EFE4', '#243C3A', '#64726B', '#D5CFC2', '#A15B23'
FONT = os.environ.get('PUBLISH_FONT') or subprocess.check_output(['fc-match','-f','%{file}','Consolas'],text=True)
FAMILY = ImageFont.truetype(FONT,20).getname()[0]
BOLD = os.environ.get('PUBLISH_FONT_BOLD') or subprocess.check_output(['fc-match','-f','%{file}',FAMILY+':style=Bold'],text=True)
ICC = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
fonts = {}

def font(size, bold=False):
    key=(size,bold)
    if key not in fonts: fonts[key]=ImageFont.truetype(BOLD if bold else FONT,size)
    return fonts[key]

def text(x,y,s,size=32,fill=INK,bold=False,maxwidth=None):
    if maxwidth:
        while draw.textlength(s,font=font(size,bold))>maxwidth: size-=1
    draw.text((x,y),s,font=font(size,bold),fill=fill,anchor='lt')

def svg_logo(width):
    h=round(width*31.2528266758/43.9095293518)
    surface=cairo.ImageSurface(cairo.FORMAT_ARGB32,width,h)
    rect=Rsvg.Rectangle(); rect.x=0; rect.y=0; rect.width=width; rect.height=h
    Rsvg.Handle.new_from_data((ROOT/'veryos_logo.svg').read_bytes()).render_document(cairo.Context(surface),rect)
    stream=io.BytesIO(); surface.write_to_png(stream); stream.seek(0)
    return Image.open(stream).convert('RGBA')

logo=svg_logo(86)
scad=Image.open(ROOT/'projects/biclightercase2/publish/source/assets/openscad.png').convert('RGBA')
scad.thumbnail((64,64),Image.Resampling.LANCZOS)
pics={v['id']:Image.open(OUT/'renders'/(v['id']+'.png')).convert('RGBA') for v in cfg['variants']}
pics['print_layout']=Image.open(OUT/'renders/print_layout.png').convert('RGBA')
for name,pic in pics.items():
    assert pic.size==(1800,1500), 'Render at publication resolution first: '+name
    b=pic.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox()
    assert b and b[0]>0 and b[1]>0 and b[2]<pic.width and b[3]<pic.height, 'Clipped render: '+name
assert cfg['source_sha256']==hashlib.sha256((OUT.parent/'cuboid_video_light_softboxV5.scad').read_bytes()).hexdigest()

def union_crop(names):
    boxes=[pics[n].getchannel('A').point(lambda x:255 if x>12 else 0).getbbox() for n in names]
    assert all(boxes), 'Empty render'
    w,h=pics[names[0]].size
    return (max(0,min(b[0] for b in boxes)-18),max(0,min(b[1] for b in boxes)-18),
            min(w,max(b[2] for b in boxes)+18),min(h,max(b[3] for b in boxes)+18))

def picture(name, box, crop=None):
    x,y,w,h=box
    p=pics[name].crop(crop or union_crop([name]))
    factor=min(w/p.width,h/p.height)
    p=p.resize((round(p.width*factor),round(p.height*factor)),Image.Resampling.LANCZOS)
    im.alpha_composite(p,(round(x+(w-p.width)/2),round(y+(h-p.height)/2)))

def new(size=(2400,1800), section='PARAMETRIC VIDEO LIGHT SOFTBOX'):
    global im,draw,W,H
    W,H=size; im=Image.new('RGBA',size,BG); draw=ImageDraw.Draw(im)
    im.alpha_composite(logo,(100,52)); text(210,66,'VERYOS',34,bold=True)
    im.alpha_composite(scad,(W-370,49)); text(W-288,67,'OpenSCAD',30)
    draw.line((100,150,W-100,150),fill=LINE,width=2)
    text(100,194,section,26,AMBER,True,maxwidth=W-200)

def heading(title, subtitle):
    text(95,251,title,84,bold=True,maxwidth=W-190)
    text(100,363,subtitle,31,MUTE,maxwidth=W-200)

def footer(lines, fine='V5 CAD RENDERS  /  ILLUSTRATIVE COLORS  /  DIMENSIONS IN MM'):
    y=H-230
    draw.rounded_rectangle((100,y,W-100,H-85),radius=16,fill=INK)
    for i,line in enumerate(lines):text(133,y+(55 if len(lines)==1 else 29)+i*49,line,30,BG,bold=i==0,maxwidth=W-266)
    text(100,H-48,fine,20,MUTE,maxwidth=W-200)

def save(name):
    im.convert('RGB').save(OUT/name,optimize=True,compress_level=9,icc_profile=ICC)
    print('COMPOSED',name,flush=True)

# Hero covers: the full-size standard model and three real parameter variations.
for portrait in [False,True]:
    new((1800,2400) if portrait else (2400,1800),'CHANGE THE PARAMETERS. MAKE IT YOURS.')
    if portrait:
        text(94,270,'VIDEO LIGHT',128,bold=True)
        text(94,426,'SOFTBOX',128,bold=True)
        text(100,603,'Fit your light. Shape your frame.',39,MUTE)
        picture('standard',(135,710,1530,1010))
        text(100,1745,'ONE SOURCE. DIFFERENT PROPORTIONS.',30,AMBER,True)
        y,cw,h=1815,500,290
    else:
        text(94,325,'VIDEO LIGHT',112,bold=True)
        text(94,468,'SOFTBOX',112,bold=True)
        text(100,657,'Fit your light.',41,MUTE)
        text(100,717,'Shape your frame.',41,MUTE)
        for j,label in enumerate(['Light dimensions','Depth + wall angle','Tripod clearance']):
            draw.ellipse((100,839+j*66,114,853+j*66),fill=AMBER)
            text(137,831+j*66,label,32)
        picture('standard',(950,265,1360,900))
        text(100,1100,'ONE SOURCE. DIFFERENT PROPORTIONS.',28,AMBER,True)
        y,cw,h=1170,690,330
    names=['shallow','deep','wide']; crop=union_crop(names)
    gap=(W-200-3*cw)/2
    for i,(name,label) in enumerate(zip(names,['45 mm depth','90 mm depth','35° wall angle'])):
        x=100+i*(cw+gap)
        draw.line((x,y,x+cw,y),fill=LINE,width=2)
        picture(name,(x,y+20,cw,h),crop)
        text(x+12,y+h+28,label,29,bold=True,maxwidth=cw-24)
    footer(['EDIT PARAMETERS  →  RENDER  →  EXPORT'],
           'PARAMETRIC EXAMPLES  /  CAD RENDERS  /  DIFFUSION FABRIC NOT SHOWN')
    save('thumbnail_3x4.png' if portrait else 'thumbnail_4x3.png')

# Four variations, with one common crop, camera and physical scale.
new(section='01 / FOUR SHAPES FROM ONE SOURCE')
heading('A frame that fits your setup.','Same 116 × 67 × 16 mm light. Change the depth and flare in OpenSCAD.')
names=['shallow','standard','deep','wide']; crop=union_crop(names)
labels=[('SHALLOW','depth 45 mm  /  angle 24°'),('STANDARD','depth 60 mm  /  angle 24°'),
        ('DEEP','depth 90 mm  /  angle 24°'),('WIDE FLARE','depth 60 mm  /  angle 35°')]
for i,name in enumerate(names):
    x=100+(i%2)*1140; y=455+(i//2)*530
    draw.line((x,y,x+1060,y),fill=LINE,width=2)
    text(x,y+21,labels[i][0],32,bold=True)
    text(x,y+67,labels[i][1],27,MUTE)
    picture(name,(x,y+113,1060,402),crop)
footer(['Change softbox_depth and wall_angle.',
        'The 35° preset also sets wallcover_lip_clearance = 1.5 mm.'],
       'SAME SCALE  /  TWO COVERS REMOVED FOR VISIBILITY  /  CAD RENDERS')
save('images/01_four_shapes.png')

def compare(section,title,subtitle,names,labels,params,notes,filename):
    new(section=section); heading(title,subtitle)
    crop=union_crop(names); cw=690
    for i,name in enumerate(names):
        x=100+i*755
        draw.line((x,460,x+cw,460),fill=LINE,width=2)
        text(x,492,labels[i],40,bold=True,maxwidth=cw)
        if name.startswith('cutout_'):
            draw.rounded_rectangle((x-10,650,x+cw+10,1210),radius=18,fill=INK)
        picture(name,(x,580,cw,700),crop)
        for j,line in enumerate(params[i]):text(x,1340+j*51,line,29,MUTE,maxwidth=cw)
    footer(notes,'SAME SCALE WITHIN THIS COMPARISON  /  V5 CAD RENDERS  /  DIMENSIONS IN MM')
    save('images/'+filename)

compare('02 / ADJUST THE DEPTH','Choose your depth.',
    'Only softbox_depth changes. Light size and 24° wall angle stay fixed.',
    ['shallow','standard','deep'],['45 mm','60 mm','90 mm'],
    [['softbox_depth = 45'],['softbox_depth = 60','V5 default'],['softbox_depth = 90']],
    ['A deeper frame also widens the front at a fixed wall angle.',
     'Front opening, covers and frame geometry follow the parameter.'],'02_depth.png')

compare('03 / ADJUST THE WALL ANGLE','Choose your flare.',
    'Same light, same 60 mm depth. Wall angle is measured from vertical.',
    ['narrow','standard','wide'],['18°','24°','35°'],
    [['wall_angle = 18','lip clearance = 1.2'],['wall_angle = 24','lip clearance = 1.2'],
     ['wall_angle = 35','lip clearance = 1.5']],
    ['A wider wall angle increases the front opening.',
     'Keep wallcover_lip_clearance ≥ wallcover_thickness × tan(wall_angle).'],'03_wall_angle.png')

compare('04 / ADAPT TO YOUR VIDEO LIGHT','Start with your light.',
    'Set light_length, light_width and light_height. Shown at 60 mm depth / 24°.',
    ['small_light','standard','large_light'],['SMALL LIGHT','V5 DEFAULT','LARGE LIGHT'],
    [['90 × 55 × 14 mm','clamp_length = 18'],['116 × 67 × 16 mm','clamp_length = 24'],
     ['150 × 90 × 22 mm','clamp_length = 24']],
    ['Measure the light body; check controls, ports and tripod position.',
     'Small preset also adjusts the notch and logos. Exact values: presets.json.'],'04_light_fit.png')

compare('05 / V5 TRIPOD CLEARANCE','Make room for the ballhead.',
    'The open cutout sits at the light-side edge of one long cover.',
    ['cutout_small','cutout_default','cutout_large'],['36 × 8 mm','48.7 × 12 mm','60 × 20 mm'],
    [['width 36 / depth 8','inside radius 2'],['width 48.7 / depth 12','inside radius 3'],
     ['width 60 / depth 20','inside radius 6']],
    ['Adjust tripod_cutout_width, tripod_cutout_depth and tripod_cutout_radius.',
     'Depth is along the panel. Presets use side_notch_width to set the linked width.'],'05_tripod_clearance.png')

new(section='06 / PRINT THE PARTS. ASSEMBLE YOUR SOFTBOX.')
heading('Built from printable parts.','V5 print layout, shown in the source print orientations.')
draw.rounded_rectangle((100,465,1535,1520),radius=18,fill='#BCB9AD')
picture('print_layout',(90,465,1460,1065))
rows=[('01','1 FRAME','Light clamps + eight fabric tabs'),
      ('02','4 WALL COVERS','1 plain long / 1 tripod / 2 short'),
      ('03','16 THUMB SCREWS','Attach the removable covers'),
      ('04','1–2 CLAMP SCREWS','Hold the light in its tunnels')]
for i,(number,title,caption) in enumerate(rows):
    y=540+i*221
    text(1590,y,number,27,AMBER,True); text(1590,y+47,title,34,bold=True,maxwidth=700)
    # Wrap just the longer captions into predictable, readable lines.
    parts=caption.split(' / ') if '/' in caption else [caption]
    for j,line in enumerate(parts):text(1590,y+103+j*37,line,25,MUTE,maxwidth=700)
footer(['Add reflective lining, diffusion fabric and clothespins separately.',
        'Export individual parts if the complete layout exceeds your print bed.'],
       'SOURCE PRINT ORIENTATIONS  /  CAD RENDER  /  TWO CLAMP SCREWS SHOWN')
save('images/06_printable_parts.png')

# A small review sheet makes the complete pack easy to inspect.
files=[OUT/'thumbnail_4x3.png',OUT/'thumbnail_3x4.png',*sorted((OUT/'images').glob('*.png'))]
sheet=Image.new('RGB',(1600,1200),BG)
sd=ImageDraw.Draw(sheet)
for i,path in enumerate(files):
    p=Image.open(path); p.thumbnail((380,520),Image.Resampling.LANCZOS)
    x=(i%4)*400; y=(i//4)*600
    sheet.paste(p,(x+(400-p.width)//2,y+10))
    sd.text((x+12,y+552),path.stem,font=font(16),fill=INK)
sheet.save(OUT/'contact-sheet.png',optimize=True,compress_level=9,icc_profile=ICC)
provenance=json.loads((OUT/'provenance.json').read_text())
provenance.update(font_used=FAMILY,font_substitution=FAMILY.lower()!='consolas',
    veryos_logo='../../../veryos_logo.svg',
    openscad_logo='../../biclightercase2/publish/source/assets/openscad.png',
    blender=subprocess.check_output(['blender','--version'],text=True).splitlines()[0])
(OUT/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
audit=[]
for path in [*files,OUT/'contact-sheet.png',*sorted((OUT/'renders').glob('*.png'))]:
    pic=Image.open(path)
    record=dict(file=str(path.relative_to(OUT)),size=list(pic.size),mode=pic.mode,bytes=path.stat().st_size)
    if pic.mode=='RGBA':
        record['visible_bounds']=list(pic.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox())
    audit.append(record)
(OUT/'image-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
assets=[*files,OUT/'contact-sheet.png',*sorted((OUT/'renders').glob('*.png')),
        OUT/'renders/render-info.json',*sorted((OUT/'source').glob('*.py')),
        *[OUT/name for name in ['listing.md','README.md','variants.json','presets.json',
                              'mesh-audit.json','preset-audit.json','image-audit.json','provenance.json']],
        OUT.parent/'cuboid_video_light_softboxV5.scad',ROOT/'LICENSE',ROOT/'veryos_logo.svg',
        ROOT/'projects/biclightercase2/publish/source/assets/openscad.png']
manifest={str(path.relative_to(ROOT)):hashlib.sha256(path.read_bytes()).hexdigest() for path in assets}
(OUT/'assets-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
archive=OUT/'veryos_softbox_v5_publishing_pack.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    z.writestr('START_HERE.md','# VeryOS video light softbox V5\n\n'
        'The original repository folder structure is preserved so source and asset links work.\n\n'
        'Open [the publishing guide](projects/cuboid_video_light_softbox/publish/README.md) for upload order, '
        'or [the contact sheet](projects/cuboid_video_light_softbox/publish/contact-sheet.png) for a preview.\n\n'
        'Title, description, tags and usage notes: '
        '[listing.md](projects/cuboid_video_light_softbox/publish/listing.md).\n')
    for path in assets+[OUT/'assets-manifest.json']:z.write(path,path.relative_to(ROOT))
print('PACKAGED',archive.name,round(archive.stat().st_size/1048576,1),'MiB')
print('FONT',FAMILY)
