# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Compose publication layouts with exact labels and projected CAD annotations."""
from pathlib import Path
import io, json, math, sys, zipfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageFilter
import gi, cairo
gi.require_version('Rsvg','2.0')
from gi.repository import Rsvg

cfg=json.loads(Path(sys.argv[1]).read_text()); p=cfg['params']
root=Path(cfg['root']); output=Path(cfg['output']); cache=Path(cfg['cache'])
images=output/'images'; images.mkdir(exist_ok=True)
BG='#F4EFE3'; INK='#252C2B'; MUTE='#65716B'; LINE='#CEC7B8'; AMBER='#BD711F'; PALE='#E9E2D2'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
FONTS={}
def font(size,bold=False):
    key=(size,bold)
    if key not in FONTS: FONTS[key]=ImageFont.truetype(BOLD if bold else FONT,size)
    return FONTS[key]
def num(v): return f'{v:g}'
def txt(pos,text,size=36,fill=INK,bold=False,anchor='lt'):
    d.text(pos,str(text),font=font(size,bold),fill=fill,anchor=anchor,stroke_width=0)
def wrap(pos,text,width,size=34,fill=MUTE,line_height=None):
    line_height=line_height or round(size*1.45)
    words=text.split(); lines=[]; line=''
    for word in words:
        candidate=(line+' '+word).strip()
        if d.textlength(candidate,font=font(size))>width and line:
            lines.append(line); line=word
        else: line=candidate
    if line: lines.append(line)
    for i,line in enumerate(lines): txt((pos[0],pos[1]+i*line_height),line,size,fill)
    return len(lines)*line_height

def svg_logo(width):
    data=(root/'veryos_logo.svg').read_text().replace('#000000',INK)
    h=round(width*31.2528266758/43.9095293518)
    surface=cairo.ImageSurface(cairo.FORMAT_ARGB32,width,h)
    handle=Rsvg.Handle.new_from_data(data.encode()); rect=Rsvg.Rectangle()
    rect.x=0;rect.y=0;rect.width=width;rect.height=h
    handle.render_document(cairo.Context(surface),rect)
    stream=io.BytesIO(); surface.write_to_png(stream);stream.seek(0)
    return Image.open(stream).convert('RGBA')
logo=svg_logo(88)
scad=Image.open(Path(__file__).parent/'assets'/'openscad.png').convert('RGBA')
scad.thumbnail((68,68),Image.Resampling.LANCZOS)

def page(title,subtitle,index,portrait=False):
    global im,d
    W,H=(1800,2400) if portrait else (2400,1800)
    im=Image.new('RGBA',(W,H),BG);d=ImageDraw.Draw(im)
    im.alpha_composite(logo,(112,65)); txt((220,72),'VERYOS',42,INK,True)
    im.alpha_composite(scad,(W-335,61));txt((W-245,80),'OpenSCAD',29,INK)
    d.line((112,155,W-112,155),fill=LINE,width=2)
    if title: txt((112,210),title,78 if len(title)>25 else 88,INK,True)
    if subtitle: txt((116,330),subtitle,33,MUTE)
    d.line((112,H-113,W-112,H-113),fill=LINE,width=2)
    txt((112,H-78),'VERY OPEN SOURCE  /  PARAMETRIC STORAGE',24,MUTE)
    txt((W-112,H-78),index,26,MUTE,anchor='rt')

def render(name,box):
    pic=Image.open(cache/'renders'/f'{name}.png').convert('RGBA')
    # Replace the wide studio shadow-catcher matte with compact contact
    # shadows, keeping the opaque CAD surfaces and the page background clean.
    grounded=name in ['hero','dimensions','section','print']
    if grounded:
        pic.putalpha(pic.getchannel('A').point(lambda v:0 if v<235 else round((v-235)*255/20)))
    # Ignore nearly transparent shadow-catcher noise when fitting the image.
    alpha=pic.getchannel('A'); bbox=alpha.point(lambda v:255 if v>10 else 0).getbbox()
    if not bbox: raise ValueError(name+' has no visible render')
    pad=15; bbox=(max(0,bbox[0]-pad),max(0,bbox[1]-pad),min(pic.width,bbox[2]+pad),min(pic.height,bbox[3]+pad))
    crop=pic.crop(bbox); scale=min((box[2]-box[0])/crop.width,(box[3]-box[1])/crop.height)
    size=(round(crop.width*scale),round(crop.height*scale)); crop=crop.resize(size,Image.Resampling.LANCZOS)
    x=round((box[0]+box[2]-size[0])/2);y=round((box[1]+box[3]-size[1])/2)
    if grounded:
        shadow=Image.new('RGBA',im.size,(0,0,0,0)); sd=ImageDraw.Draw(shadow)
        pieces=[(0,size[0])]
        if name in ['hero','print']:
            occupied=(np.asarray(crop.getchannel('A'))>240).any(axis=0)
            edges=np.diff(np.r_[False,occupied,False].astype(int))
            runs=list(zip(np.flatnonzero(edges==1),np.flatnonzero(edges==-1)))
            main=[(int(a),int(b)) for a,b in runs if b-a>size[0]*.12]
            if len(main)==2: pieces=main
        for lo,hi in pieces:
            bound=crop.getchannel('A').crop((lo,0,hi,size[1])).getbbox()
            if bound:
                cx=x+lo+(bound[0]+bound[2])/2; cy=y+bound[3]-8
                rx=(bound[2]-bound[0])*.49; ry=rx*.19
                sd.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=(37,44,43,65))
        im.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(25)))
    im.alpha_composite(crop,(x,y))
    points=json.loads((cache/'renders'/f'{name}.json').read_text())
    return {k:(x+(v[0]-bbox[0])*scale,y+(v[1]-bbox[1])*scale) for k,v in points.items()}

def arrow(a,b,color=AMBER,width=4,head=13,both=False):
    d.line([a,b],fill=color,width=width)
    def tip(t,other):
        angle=math.atan2(t[1]-other[1],t[0]-other[0])
        pts=[t,(t[0]-head*math.cos(angle-.43),t[1]-head*math.sin(angle-.43)),(t[0]-head*math.cos(angle+.43),t[1]-head*math.sin(angle+.43))]
        d.polygon(pts,fill=color)
    tip(b,a)
    if both: tip(a,b)
def vertical_dim(a,b,x,label,size=34,side='right'):
    a,b=sorted([a,b],key=lambda q:q[1])
    for pt in [a,b]: d.line((pt[0],pt[1],x+12,pt[1]),fill=MUTE,width=2)
    arrow((x,a[1]),(x,b[1]),both=True,head=11)
    mid=(a[1]+b[1])/2
    txt((x+22 if side=='right' else x-22,mid),label,size,AMBER,True,'lm' if side=='right' else 'rm')
def horizontal_dim(a,b,y,label):
    a,b=sorted([a,b],key=lambda q:q[0])
    for pt in [a,b]: d.line((pt[0],pt[1],pt[0],y+10),fill=MUTE,width=2)
    arrow((a[0],y),(b[0],y),both=True,head=11)
    txt(((a[0]+b[0])/2,y+22),label,36,AMBER,True,'mt')
def leader(point,end,label,code=None):
    bend=(end[0],point[1]);d.line([point,bend,end],fill=AMBER,width=4)
    d.ellipse((point[0]-7,point[1]-7,point[0]+7,point[1]+7),fill=AMBER)
    txt((end[0]+16,end[1]-8),label,35,INK,True)
    if code: txt((end[0]+16,end[1]+42),code,24,MUTE)
def card(y,title,value,code,body,x=1625,width=650):
    d.line((x,y,x+width,y),fill=LINE,width=2)
    txt((x,y+25),title.upper(),29,MUTE,True)
    txt((x,y+78),value,69,INK,True)
    txt((x,y+166),code,25,AMBER)
    wrap((x,y+210),body,width,31)

made=[]
icc=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
def save(name):
    pic=im.convert('RGB')
    pic.save(images/(name+'.png'),optimize=True,icc_profile=icc)
    pic.save(images/(name+'.jpg'),quality=95,subsampling=0,optimize=True,icc_profile=icc)
    made.append(name)
    print('COMPOSED',name,flush=True)

# Cover, kept deliberately sparse for the small thumbnail displayed in feeds.
page('',None,'01 / 08')
txt((116,238),'PARAMETRIC STORAGE',33,AMBER,True)
txt((106,335),'SCREW-TOP',117,INK,True)
txt((106,480),'CONTAINER',117,INK,True)
txt((116,710),'Set the size.',43,INK)
txt((116,780),'Tune the fit.',43,INK)
render('hero',(790,245,2370,1630))
for y,label in [(1030,'Independent neck + thread'),(1120,'Adjustable lid alignment'),(1210,'Editable OpenSCAD model')]:
    d.ellipse((116,y+8,132,y+24),fill=AMBER);txt((156,y),label,30,INK)
txt((116,1480),f'{num(p["outer_diameter"])} mm diameter',34,INK,True)
txt((116,1536),f'{num(p["full_height"])} mm nominal height',30,MUTE)
save('01_cover_landscape')

page('Choose the overall size','The main dimensions set the proportions of your container.','02 / 08')
a=render('dimensions',(260,445,1450,1485))
vertical_dim(a['bottom'],a['top'],max(a['bottom'][0],a['top'][0])+95,f'{num(p["closed_height"])} mm',32)
horizontal_dim(a['left'],a['right'],1555,f'{num(p["outer_diameter"])} mm diameter')
card(490,'Nominal closed height',f'{num(p["full_height"])} mm','full_height','Includes the lid roof, before the alignment adjustment.')
card(850,'Outside diameter',f'{num(p["outer_diameter"])} mm','outer_diameter','Sets the cylindrical footprint of both parts.')
card(1210,'Wall thickness',f'{num(p["wall_thickness"])} mm','wall_thickness','Controls the body, neck, floor, lid roof and minimum lid wall.')
save('02_overall_dimensions')

page('Neck and thread, independently','A smooth neck guides the lid; only the short band is threaded.','03 / 08')
a=render('neck',(190,500,1460,1320))
vertical_dim(a['neck_bottom'],a['neck_top'],200,f'{num(p["neck_height"])} mm',34,'left')
vertical_dim(a['thread_bottom'],a['thread_top'],1390,f'{num(p["lid_thread_height"])} mm',34)
leader(a['entry'],(360,1430),f'{num(p["base_thread_entry_chamfer"])} mm entry taper','base_thread_entry_chamfer')
card(490,'Neck height',f'{num(p["neck_height"])} mm','neck_height','Changes the smooth guide height independently of the threaded band.')
card(850,'Threaded band',f'{num(p["lid_thread_height"])} mm','lid_thread_height','Sets matching short thread bands on the base and at the lid opening.')
card(1210,'Thread pitch',f'{p["thread_pitch"]:.1f} mm','thread_pitch','Axial travel per complete turn. Single-start, right-handed thread.')
save('03_neck_and_thread')

page('Inside the lid','Cutaway shown open-side up, in the printing orientation.','04 / 08')
a=render('lid',(190,530,1450,1440))
vertical_dim(a['bottom'],a['top'],190,f'{num(p["lid_height"])} mm',34,'left')
vertical_dim(a['band_bottom'],a['band_top'],1390,f'{num(p["lid_thread_height"])} mm',32)
leader(a['roof'],(420,1510),f'{num(p["wall_thickness"])} mm roof','Flat face on the print bed')
card(490,'Lid height',f'{num(p["lid_height"])} mm','lid_height','Total lid height, including the roof. Independent of the thread length.')
card(850,'Internal thread band',f'{num(p["lid_thread_height"])} mm','lid_thread_height','Only the opening is threaded. The cavity behind it stays smooth.')
card(1210,'Thread entry taper',f'{num(p["lid_thread_entry_chamfer"])} mm','lid_thread_entry_chamfer','Axial lead-in length to help the two parts engage. Set 0 to disable.')
save('04_lid_cutaway')

page('Fine-tune the fit','Enlarged section of the two mating threads.','05 / 08')
a=render('fit',(200,450,1460,1535))
vertical_dim(a['pitch_lo'],a['pitch_hi'],280,f'{p["thread_pitch"]:.1f} mm',32,'left')
mid=tuple((x+y)/2 for x,y in zip(a['radial_a'],a['radial_b']))
leader(mid,(850,1510),f'{p["radial_clearance"]:.2f} mm per side','45° flanks / 90° included angle')
card(490,'Radial clearance',f'{p["radial_clearance"]:.2f} mm','radial_clearance','Clearance per side. Increase for a looser fit; decrease for a closer fit.')
card(850,'Axial clearance',f'{p["axial_clearance"]:.2f} mm','axial_clearance','Total extra groove width along the axis. Adjust independently of radial clearance.')
card(1210,'Minimum rim clearance',f'{p["rim_clearance"]:.1f} mm','rim_clearance',f'Minimum space below the lid roof. Actual space with these defaults: {p["actual_headroom"]:.1f} mm.')
save('05_thread_fit')

page('Tune the stopping angle','A raised shoulder makes the lid seat earlier.','06 / 08')
a=render('alignment',(200,500,1460,1390))
vertical_dim(a['lower'],a['upper'],220,f'{p["external_thread_top_surface_extrusion"]:.1f} mm',32,'left')
leader(a['stop'],(620,1460),'Raised seating shoulder','The lid rim stops here')
card(490,'Shoulder extrusion',f'{p["external_thread_top_surface_extrusion"]:.1f} mm','external_thread_top_surface_extrusion','Raises the flat shoulder beneath the thread. Set 0 to disable.')
card(850,'Estimated correction',f'{num(p["angle"])}° earlier','360 × extrusion / pitch','Use your measured overshoot as a starting point, then fine-tune against the printed markings.')
card(1240,'Resulting closed height',f'{num(p["closed_height"])} mm','full_height + extrusion','The alignment adjustment adds the same amount to the closed height.')
save('06_lid_alignment')

page('Walls and edge details','A cutaway makes the thickness and finishing features visible.','07 / 08')
a=render('section',(250,450,1450,1520))
leader(a['wall'],(200,1150),f'{num(p["wall_thickness"])} mm wall','wall_thickness')
leader(a['headroom'],(1160,500),f'{p["actual_headroom"]:.1f} mm','Actual headroom')
card(490,'Base edge chamfer',f'{num(p["base_chamfer"])} mm','base_chamfer','45° bevels on the outer shoulder and bottom edge of the base.')
card(850,'Lid edge chamfer',f'{num(p["lid_chamfer"])} mm','lid_chamfer','45° bevels on the lid top and outside edge of its opening.')
card(1210,'Optional outer edges','ON / OFF','top_chamfer_enabled','Top and bottom chamfers can be switched independently. Use bottom_chamfer_enabled for the lower edges.')
save('07_walls_and_chamfers')

page('Print and customize','Two parts, both with a flat face on the print bed.','08 / 08')
a=render('print',(120,435,1500,1480))
txt((260,1535),'BASE: OPEN-SIDE UP',29,INK,True)
txt((940,1535),'LID: OPEN-SIDE UP',29,INK,True)
card(490,'Display and export','PRINT','view = "print"','Shows both parts beside each other. Select container or lid to export one part.')
card(850,'Mesh quality',str(p['quality']),'quality','Controls curve tessellation, not the physical dimensions.')
card(1210,'Customize in OpenSCAD','EDIT → RENDER','F6 → Export STL','Change the values in the Customizer. Check the thread fit with a small test print.')
save('08_print_and_customize')

page('',None,'COVER / PORTRAIT',portrait=True)
txt((116,235),'PARAMETRIC STORAGE',33,AMBER,True)
txt((106,330),'SCREW-TOP',125,INK,True)
txt((106,485),'CONTAINER',125,INK,True)
txt((116,690),'Set the size. Tune the fit.',40,INK)
render('hero',(90,820,1710,2020))
txt((116,2110),'Independent thread height',34,INK,True)
txt((116,2170),'Adjustable lid alignment',34,INK)
save('09_cover_portrait')

# A review sheet is deliberately separate from the upload images.
sheet=Image.new('RGB',(1800,1450),BG)
draw=ImageDraw.Draw(sheet)
for i,name in enumerate(made):
    pic=Image.open(images/(name+'.jpg'));pic.thumbnail((566,420),Image.Resampling.LANCZOS)
    x=18+(i%3)*600; y=18+(i//3)*480
    sheet.paste(pic,(x+(566-pic.width)//2,y))
    draw.text((x,y+430),name,font=font(20),fill=INK)
sheet.save(output/'contact-sheet.jpg',quality=93,icc_profile=icc)

# Keep upload files compact; the lossless masters stay in the images folder.
archive=output/'veryos_screw_top_container_upload_pack.zip'
files=[images/(name+'.jpg') for name in made]
files += [output/name for name in ['listing.md','UPLOAD.txt','parameters.json']]
files += sorted((output/'model').iterdir())
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for path in files: z.write(path,path.relative_to(output))
print(json.dumps({'images':made,'output':str(images),'archive':str(archive)}))
