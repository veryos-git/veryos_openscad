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
def mm(v): return f'{v:g} mm'
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

def page(title,subtitle,index,portrait=False,footer='VERY OPEN SOURCE  /  PARAMETRIC LIGHTER CASE'):
    global im,d
    W,H=(1800,2400) if portrait else (2400,1800)
    im=Image.new('RGBA',(W,H),BG);d=ImageDraw.Draw(im)
    im.alpha_composite(logo,(112,65)); txt((220,72),'VERYOS',42,INK,True)
    im.alpha_composite(scad,(W-335,61));txt((W-245,80),'OpenSCAD',29,INK)
    d.line((112,155,W-112,155),fill=LINE,width=2)
    if title: txt((112,210),title,78 if len(title)>25 else 88,INK,True)
    if subtitle: txt((116,330),subtitle,33,MUTE)
    d.line((112,H-113,W-112,H-113),fill=LINE,width=2)
    txt((112,H-78),footer,24,MUTE)
    txt((W-112,H-78),index,26,MUTE,anchor='rt')

def render(name,box):
    pic=Image.open(cache/'renders'/f'{name}.png').convert('RGBA')
    raw=json.loads((cache/'renders'/f'{name}.json').read_text())
    # Replace the wide studio shadow-catcher matte with compact contact
    # shadows, keeping the opaque CAD surfaces and the page background clean.
    grounded=any(k.startswith('shadow') for k in raw)
    if grounded:
        pic.putalpha(pic.getchannel('A').point(lambda v:0 if v<235 else round((v-235)*255/20)))
    # Ignore nearly transparent shadow-catcher noise when fitting the image.
    alpha=pic.getchannel('A'); bbox=alpha.point(lambda v:255 if v>10 else 0).getbbox()
    if not bbox: raise ValueError(name+' has no visible render')
    pad=15; bbox=(max(0,bbox[0]-pad),max(0,bbox[1]-pad),min(pic.width,bbox[2]+pad),min(pic.height,bbox[3]+pad))
    crop=pic.crop(bbox); scale=min((box[2]-box[0])/crop.width,(box[3]-box[1])/crop.height)
    size=(round(crop.width*scale),round(crop.height*scale)); crop=crop.resize(size,Image.Resampling.LANCZOS)
    x=round((box[0]+box[2]-size[0])/2);y=round((box[1]+box[3]-size[1])/2)
    points={k:(x+(v[0]-bbox[0])*scale,y+(v[1]-bbox[1])*scale) for k,v in raw.items()}
    if grounded:
        # One soft ellipse per case, from its projected footprint, nudged
        # forward so it shows below the front edge.
        shadow=Image.new('RGBA',im.size,(0,0,0,0)); sd=ImageDraw.Draw(shadow)
        for i in sorted({k[6:-1] for k in points if k.startswith('shadow')}):
            l,r,f,b=(points[f'shadow{i}{k}'] for k in 'lrfb')
            cx=(l[0]+r[0])/2; rx=abs(r[0]-l[0])/2*1.08
            cy=(f[1]+b[1])/2; ry=max(abs(f[1]-b[1])/2,rx*.12)*1.5; cy+=ry*.3
            sd.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=(37,44,43,62))
        im.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(max(10,size[1]*.018))))
    im.alpha_composite(crop,(x,y))
    return points

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
    for pt in [a,b]: d.line((pt[0],pt[1],x+(12 if x>pt[0] else -12),pt[1]),fill=MUTE,width=2)
    arrow((x,a[1]),(x,b[1]),both=True,head=11)
    mid=(a[1]+b[1])/2
    txt((x+22 if side=='right' else x-22,mid),label,size,AMBER,True,'lm' if side=='right' else 'rm')
def horizontal_dim(a,b,y,label,size=36):
    a,b=sorted([a,b],key=lambda q:q[0])
    for pt in [a,b]: d.line((pt[0],pt[1],pt[0],y+10),fill=MUTE,width=2)
    arrow((a[0],y),(b[0],y),both=True,head=11)
    txt(((a[0]+b[0])/2,y+22),label,size,AMBER,True,'mt')
def leader(point,end,label,code=None,side='right',size=35):
    bend=(end[0],point[1]);d.line([point,bend,end],fill=AMBER,width=4)
    d.ellipse((point[0]-7,point[1]-7,point[0]+7,point[1]+7),fill=AMBER)
    x,anchor=(end[0]+16,'la') if side=='right' else (end[0]-16,'ra')
    txt((x,end[1]-8),label,size,INK,True,anchor)
    if code: txt((x,end[1]+size+7),code,24,MUTE,anchor=anchor)
def card(y,title,value,code,body,x=1625,width=650):
    d.line((x,y,x+width,y),fill=LINE,width=2)
    txt((x,y+25),title.upper(),29,MUTE,True)
    txt((x,y+78),value,69,INK,True)
    txt((x,y+166),code,25,AMBER)
    wrap((x,y+210),body,width,31)
def dashed_ellipse(c,rx,ry,color=INK,width=3,dash=9):
    steps=360
    pts=[(c[0]+rx*math.cos(2*math.pi*i/steps),c[1]+ry*math.sin(2*math.pi*i/steps)) for i in range(steps+1)]
    perimeter=0; on=True
    for a,b in zip(pts,pts[1:]):
        if on: d.line([a,b],fill=color,width=width)
        perimeter+=math.dist(a,b)
        if perimeter>=dash: perimeter=0; on=not on
def marker(point,letter):
    d.ellipse((point[0]-26,point[1]-26,point[0]+26,point[1]+26),fill=BG,outline=AMBER,width=4)
    txt(point,letter,30,AMBER,True,'mm')
def panel(box,letter,title):
    d.rounded_rectangle(box,radius=20,fill=PALE)
    txt((box[0]+30,box[1]+26),f'{letter}  {title}',28,AMBER,True)

made=[]
icc=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
def save(name):
    pic=im.convert('RGB')
    pic.save(images/(name+'.png'),optimize=True,icc_profile=icc)
    pic.save(images/(name+'.jpg'),quality=95,subsampling=0,optimize=True,icc_profile=icc)
    made.append(name)
    print('COMPOSED',name,flush=True)

cavity=f'{num(p["cavity_width"])} × {num(p["cavity_depth"])} mm'
default=p['exterior_pattern']

# Cover, kept deliberately sparse for the small thumbnail displayed in feeds.
page('',None,'01 / 08')
txt((116,238),'FOR BIC MAXI J26',33,AMBER,True)
txt((106,335),'LIGHTER',117,INK,True)
txt((106,480),'CASE',117,INK,True)
txt((116,710),'Set the fit.',43,INK)
txt((116,780),'Pick the pattern.',43,INK)
render('hero',(790,245,2370,1630))
for y,label in [(1030,'Seven exterior patterns'),(1120,'Adjustable lighter fit'),(1210,'Editable OpenSCAD model')]:
    d.ellipse((116,y+8,132,y+24),fill=AMBER);txt((156,y),label,30,INK)
txt((116,1480),f'{cavity} cavity',34,INK,True)
txt((116,1536),f'{num(p["height"])} mm tall',30,MUTE)
save('01_cover_landscape')

page('Overall size','The case is the lighter cavity plus the wall and the pattern.','02 / 08')
a=render('dimensions',(260,445,1450,1485))
vertical_dim(a['bottom'],a['top'],max(a['bottom'][0],a['top'][0])+95,mm(p['height']),32)
horizontal_dim(a['left'],a['right'],1555,f'{mm(p["relief_width"])} with relief')
card(490,'Case height',mm(p['height']),'height','Sets how far the lighter sinks in and how much of the metal top stays exposed.')
card(850,'Wall and floor',f'{num(p["wall"])} / {mm(p["floor_thickness"])}','wall, floor_thickness','Side wall beneath the pattern, and the floor around the push-out hole.')
card(1210,'Outside footprint',f'{num(p["relief_width"])} × {mm(p["relief_depth"])}','cavity + wall + pattern_depth',
     f'With {mm(p["pattern_depth"])} relief. {num(p["outer_width"])} × {mm(p["outer_depth"])} when the case is smooth.')
save('02_overall_dimensions')

page('Built around the lighter','Horizontal section: the cavity is the lighter plus the fit clearance.','03 / 08')
a=render('fit',(160,470,1480,1460))
c=a['center']; rx=a['lit_r'][0]-c[0]; ry=c[1]-a['lit_b'][1]
dashed_ellipse(c,rx,ry,MUTE)
arrow(a['cav_l'],a['cav_r'],both=True,head=11); arrow(a['cav_f'],a['cav_b'],both=True,head=11)
txt((c[0]-rx*.5,c[1]-18),mm(p['cavity_width']),34,AMBER,True,'md')
txt((c[0]+22,c[1]-ry*.55),mm(p['cavity_depth']),34,AMBER,True,'lm')
txt((c[0]-rx*.5,c[1]+ry*.42),f'LIGHTER {num(p["lighter_width"])} × {mm(p["lighter_depth"])}',26,MUTE,True,'mm')
leader(a['gap'],(a['gap'][0],1560),f'{p["fit_clearance"]:.2f} mm per side','fit_clearance','left')
card(490,'Lighter width',mm(p['lighter_width']),'lighter_width','Across the wide flat faces of the lighter.')
card(850,'Lighter depth',mm(p['lighter_depth']),'lighter_depth','Front to back. The defaults match a BIC Maxi J26.')
card(1210,'Fit clearance',f'{p["fit_clearance"]:.2f} mm','fit_clearance','Gap per side: 0.25 snug, 0.4 standard, 0.6 loose. Increase it if your printer over-extrudes.')
save('03_lighter_fit')

page('Inside the case','Cutaway, with enlarged sections of the mouth and the floor.','04 / 08')
a=render('cutaway',(400,450,860,1620))
vertical_dim(a['top'],a['cavity_bottom'],min(a['top'][0],a['cavity_bottom'][0])-55,f'{mm(p["cavity_height"])} deep',30,'left')
marker(a['mouth'],'A'); marker(a['floor'],'B')
panel((910,440,1555,1010),'A','MOUTH')
m=render('mouth',(1030,520,1430,880))
leader(m['mouth'],(1060,720),mm(p['mouth_chamfer']),'lead-in','left',28)
leader(m['edge'],(1410,720),mm(p['edge_chamfer']),'edge chamfer','right',28)
horizontal_dim(m['wall_in'],m['wall_out'],925,f'{mm(p["wall"])} wall',28)
panel((910,1050,1555,1620),'B','FLOOR')
f=render('floor',(950,1150,1515,1410))
horizontal_dim(f['hole_l'],f['hole_r'],1460,f'Ø{mm(p["hole_diameter"])} hole',28)
mid=((f['floor_lo'][0]+f['floor_hi'][0])/2,(f['floor_lo'][1]+f['floor_hi'][1])/2)
leader(mid,(mid[0]+40,1130),f'{mm(p["floor_thickness"])} floor',None,'left',28)
card(490,'Push-out hole',mm(p['hole_diameter']),'hole_diameter','Push the lighter back out with a finger through the floor.')
card(850,'Mouth lead-in',mm(p['mouth_chamfer']),'mouth_chamfer','Inner chamfer at the opening so the lighter starts in easily.')
card(1210,'Edge chamfer',mm(p['edge_chamfer']),'edge_chamfer','45° bevel on the outer top and bottom edges. Both chamfers together must stay below the wall.')
save('04_inside_the_case')

page('Seven exterior patterns','Relief is added outside the wall; the cavity and the fit stay the same.','05 / 08')
a=render('patterns',(112,430,2288,1390))
for pattern in p['patterns']:
    x,y=a[pattern]
    txt((x,y+45),'smooth' if pattern=='none' else pattern,36,INK,True,'mt')
    txt((x,y+98),f'"{pattern}"',25,MUTE,anchor='mt')
    if pattern==default: txt((x,y+140),'DEFAULT',23,AMBER,True,'mt')
txt((1200,1600),'exterior_pattern  —  choose one in the OpenSCAD Customizer',29,MUTE,anchor='mt')
save('05_seven_patterns')

page('Pattern relief','Raised texture outside, faded into smooth bands at both ends.','06 / 08')
a=render('relief',(170,470,1400,1560))
leader(a['peak'],(a['peak'][0]+30,420+80),f'{mm(p["pattern_depth"])} relief','pattern_depth','left')
vertical_dim(a['base'],a['band_hi'],a['base'][0]+70,f'{mm(p["pattern_low"])}',30)
card(490,'Pattern depth',mm(p['pattern_depth']),'pattern_depth','Maximum outward relief, along the surface normal. Set 0 for a smooth case.')
card(850,'Pattern count',str(p['pattern_count']),'pattern_count',f'Whole-number repeats around the perimeter, about {p["pattern_spacing"]:.2f} mm apart.')
card(1210,'Pattern margin',mm(p['pattern_margin']),'pattern_margin','Smooth band at each end; never smaller than the edge chamfer.')
save('06_pattern_relief')

page('Tune the pattern','Each pair: the default, and the same pattern with one value changed.','07 / 08')
a=render('variants',(112,430,2288,1330))
values=[(str(p['pattern_count']),str(p['variant_count'])),
        (f'{num(p["pattern_twist"])}°',f'{num(p["variant_twist"])}°'.replace('-','−')),
        (mm(p['pattern_pitch']),mm(p['variant_pitch']))]
captions=[('pattern_count','Repeats around the case'),('pattern_twist','Spiral travel over the height'),
          ('pattern_pitch','Vertical repeat: waves, diamond, chevron')]
for k in range(3):
    for j in range(2):
        x,y=a[f'{k}{j}']; txt((x,y+45),values[k][j],36,AMBER if j else INK,True,'mt')
    cx=(a[f'{k}0'][0]+a[f'{k}1'][0])/2; y=a[f'{k}0'][1]+150
    d.line((cx-300,y,cx+300,y),fill=LINE,width=2)
    txt((cx,y+30),captions[k][0],32,AMBER,True,'mt'); txt((cx,y+85),captions[k][1],28,MUTE,anchor='mt')
save('07_tune_the_pattern')

page('Print and customize','Each case stands upright on its flat bottom, open end up.','08 / 08')
render('print',(120,435,1500,1480))
txt((810,1535),'ALL SEVEN PATTERNS, UPRIGHT ON THE BED',29,INK,True,'mt')
card(490,'Print orientation','UPRIGHT','no supports','Flat bottom on the bed. The relief fades in at both ends, clear of the edge chamfers.')
card(850,'Compare patterns','ALL SEVEN','part = "all_patterns"','Lays out all seven cases side by side. Use part = "case" to export one pattern.')
card(1210,'Customize in OpenSCAD','EDIT → RENDER','F6 → Export STL','Set your fit and pattern in the Customizer. Check the fit with one case first.')
save('08_print_and_customize')

page('',None,'COVER / PORTRAIT',portrait=True)
txt((116,235),'FOR BIC MAXI J26',33,AMBER,True)
txt((106,330),'LIGHTER CASE',125,INK,True)
txt((116,520),'Set the fit. Pick the pattern.',40,INK)
render('hero',(90,640,1710,2010))
txt((116,2110),'Seven exterior patterns',34,INK,True)
txt((116,2170),f'{cavity} cavity',34,INK)
save('09_cover_portrait')

# Photo covers: the real print, with the backdrop lighting divided out so the
# studio paper becomes the page colour. The cases themselves are not retouched.
PHOTO=output/'WhatsApp Unknown 2026-10-23 at 17.14.52'/'thumb.jpeg'
def flatten(path,passes=3,threshold=14):
    pic=Image.open(path).convert('RGB'); W,H=pic.size
    small=np.asarray(pic.reduce(8),float); h,w,_=small.shape
    def terms(w,h):
        yy,xx=np.mgrid[0:h,0:w]; X=xx/w*2-1; Y=yy/h*2-1
        return [X**i*Y**j for i in range(4) for j in range(6)]
    A=np.stack([t.ravel() for t in terms(w,h)],1)
    light=small.mean(2)
    keep=(light>120)&(small.max(2)-small.min(2)<70)
    # Fit a smooth backdrop, then drop everything that departs from it
    # (prints, lighter, contact shadows) and fit again.
    for _ in range(passes):
        coef=np.linalg.lstsq(A[keep.ravel()],small.reshape(-1,3)[keep.ravel()],rcond=None)[0]
        away=np.abs(small-(A@coef).reshape(h,w,3)).max(2)>threshold
        away=np.asarray(Image.fromarray((away*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)))>0
        keep=~away&(light>120)
    backdrop=sum(t[...,None]*c for t,c in zip(terms(W,H),coef))
    page_color=np.array([int(BG[i:i+2],16) for i in (1,3,5)],float)
    # Light bounce next to the prints sits above the fitted backdrop; capping at
    # the page colour removes that halo without touching the dark prints.
    return Image.fromarray(np.clip(np.asarray(pic,float)/backdrop*page_color,0,page_color).astype(np.uint8))
def place(pic,scale,xy,box):
    pic=pic.resize((round(pic.width*scale),round(pic.height*scale)),Image.Resampling.LANCZOS)
    x0,y0=max(box[0],xy[0]),max(box[1],xy[1]); x1,y1=min(box[2],xy[0]+pic.width),min(box[3],xy[1]+pic.height)
    crop=pic.crop((x0-xy[0],y0-xy[1],x1-xy[0],y1-xy[1]))
    mask=Image.new('L',crop.size,0); ImageDraw.Draw(mask).rectangle((30,30,crop.width-31,crop.height-31),fill=255)
    im.paste(crop,(x0,y0),mask.filter(ImageFilter.GaussianBlur(15)))

if PHOTO.exists():
    shot=flatten(PHOTO)
    page('',None,'',footer='EDITABLE OPENSCAD MODEL')
    place(shot,1.083,(117,15),(0,165,2400,1680))
    txt((116,238),'FOR BIC MAXI J26',33,AMBER,True)
    txt((106,300),'LIGHTER CASE',117,INK,True)
    txt((116,470),'Set the fit. Pick the pattern.',43,INK)
    save('10_photo_landscape')
    page('',None,'',portrait=True,footer='EDITABLE OPENSCAD MODEL')
    place(shot,.916,(7,640),(0,165,1800,2280))
    txt((116,235),'FOR BIC MAXI J26',33,AMBER,True)
    txt((106,330),'LIGHTER',125,INK,True)
    txt((106,485),'CASE',125,INK,True)
    txt((116,690),'Set the fit. Pick the pattern.',40,INK)
    save('11_photo_portrait')

# A review sheet is deliberately separate from the upload images.
sheet=Image.new('RGB',(1800,1450+480*max(0,math.ceil(len(made)/3)-3)),BG)
draw=ImageDraw.Draw(sheet)
for i,name in enumerate(made):
    pic=Image.open(images/(name+'.jpg'));pic.thumbnail((566,420),Image.Resampling.LANCZOS)
    x=18+(i%3)*600; y=18+(i//3)*480
    sheet.paste(pic,(x+(566-pic.width)//2,y))
    draw.text((x,y+430),name,font=font(20),fill=INK)
sheet.save(output/'contact-sheet.jpg',quality=93,icc_profile=icc)

# Keep upload files compact; the lossless masters stay in the images folder.
archive=output/'veryos_bic_lighter_case_upload_pack.zip'
files=[images/(name+'.jpg') for name in made]
files += [output/name for name in ['listing.md','UPLOAD.txt','parameters.json'] if (output/name).exists()]
files += sorted((output/'model').iterdir())
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for path in files: z.write(path,path.relative_to(output))
print(json.dumps({'images':made,'output':str(images),'archive':str(archive)}))
