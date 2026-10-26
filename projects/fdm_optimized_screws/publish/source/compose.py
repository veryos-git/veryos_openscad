# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Compose publication layouts with exact labels and projected CAD annotations."""
from pathlib import Path
import io, json, math, sys
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

def page(title,subtitle,index,portrait=False,footer='VERY OPEN SOURCE  /  FDM OPTIMIZED SCREWS'):
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

def visible(name):
    """Bounding box of the opaque part of a render."""
    alpha=Image.open(cache/'renders'/f'{name}.png').getchannel('A')
    return alpha.point(lambda v:255 if v>10 else 0).getbbox()
def render(name,box,bbox=None):
    """Fits a render into box; bbox fixes the crop, so renders with one camera keep one scale."""
    pic=Image.open(cache/'renders'/f'{name}.png').convert('RGBA')
    raw=json.loads((cache/'renders'/f'{name}.json').read_text())
    # Replace the wide studio shadow-catcher matte with compact contact
    # shadows, keeping the opaque CAD surfaces and the page background clean.
    grounded=any(k.startswith('shadow') for k in raw)
    if grounded:
        pic.putalpha(pic.getchannel('A').point(lambda v:0 if v<235 else round((v-235)*255/20)))
    if not bbox:
        bbox=pic.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox()
        if not bbox: raise ValueError(name+' has no visible render')
    pad=15; bbox=(max(0,bbox[0]-pad),max(0,bbox[1]-pad),min(pic.width,bbox[2]+pad),min(pic.height,bbox[3]+pad))
    crop=pic.crop(bbox); scale=min((box[2]-box[0])/crop.width,(box[3]-box[1])/crop.height)
    size=(round(crop.width*scale),round(crop.height*scale)); crop=crop.resize(size,Image.Resampling.LANCZOS)
    x=round((box[0]+box[2]-size[0])/2);y=round((box[1]+box[3]-size[1])/2)
    points={k:(x+(v[0]-bbox[0])*scale,y+(v[1]-bbox[1])*scale) for k,v in raw.items()}
    if grounded:
        # One soft ellipse per part, from its projected footprint, nudged
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
def vertical_dim(a,b,x,label,size=34,side='right',color=AMBER):
    a,b=sorted([a,b],key=lambda q:q[1])
    for pt in [a,b]: d.line((pt[0],pt[1],x+(12 if x>pt[0] else -12),pt[1]),fill=MUTE,width=2)
    arrow((x,a[1]),(x,b[1]),color,both=True,head=11)
    mid=(a[1]+b[1])/2
    txt((x+22 if side=='right' else x-22,mid),label,size,color,True,'lm' if side=='right' else 'rm')
def horizontal_dim(a,b,y,label,size=36,above=False,color=AMBER):
    a,b=sorted([a,b],key=lambda q:q[0])
    for pt in [a,b]: d.line((pt[0],pt[1],pt[0],y+(-10 if above else 10)),fill=MUTE,width=2)
    arrow((a[0],y),(b[0],y),color,both=True,head=11)
    txt(((a[0]+b[0])/2,y-20 if above else y+22),label,size,color,True,'mb' if above else 'mt')
def leader(point,end,label,code=None,side='right',size=35):
    bend=(end[0],point[1]);d.line([point,bend,end],fill=AMBER,width=4)
    d.ellipse((point[0]-7,point[1]-7,point[0]+7,point[1]+7),fill=AMBER)
    x,anchor=(end[0]+16,'la') if side=='right' else (end[0]-16,'ra')
    txt((x,end[1]-8),label,size,INK,True,anchor)
    if code: txt((x,end[1]+size+7),code,24,MUTE,anchor=anchor)
def angle_arc(v,a,b,radius,label,color=INK):
    """Arc at vertex v between the rays to a and b, with a dashed ray to b."""
    ang=lambda q:math.degrees(math.atan2(q[1]-v[1],q[0]-v[0]))
    s,e=sorted([ang(a),ang(b)])
    if e-s>180: s,e=e,s+360
    end=(v[0]+(b[0]-v[0])*1.6,v[1]+(b[1]-v[1])*1.6)
    n=int(math.dist(v,end)//14)
    for i in range(0,n,2): d.line([(v[0]+(end[0]-v[0])*i/n,v[1]+(end[1]-v[1])*i/n),(v[0]+(end[0]-v[0])*(i+1)/n,v[1]+(end[1]-v[1])*(i+1)/n)],fill=color,width=3)
    d.arc((v[0]-radius,v[1]-radius,v[0]+radius,v[1]+radius),s,e,fill=color,width=5)
    m=math.radians((s+e)/2)
    txt((v[0]+(radius+18)*math.cos(m),v[1]+(radius+18)*math.sin(m)),label,46,color,True,'lm')
def card(y,title,value,code,body,x=1625,width=650):
    d.line((x,y,x+width,y),fill=LINE,width=2)
    txt((x,y+25),title.upper(),29,MUTE,True)
    txt((x,y+78),value,69,INK,True)
    txt((x,y+166),code,25,AMBER)
    wrap((x,y+210),body,width,31)
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

dia=mm(p['thread_diameter']); nut=mm(p['nut_thread']); gap=mm(p['thread_clearance']); pitch=mm(p['thread_pitch'])
N='07'

# Cover, kept deliberately sparse for the small thumbnail displayed in feeds.
page('',None,f'01 / {N}')
txt((116,238),'NO SUPPORT STRUCTURES',33,AMBER,True)
txt((106,335),'SMALLEST',117,INK,True)
txt((106,480),'FDM SCREW',117,INK,True)
txt((116,710),'The dimensions that',43,INK)
txt((116,780),'make it work.',43,INK)
render('hero',(800,245,2370,1630))
for y,label in [(1030,f'Ø{dia} screw, Ø{nut} nut thread'),(1120,f'45° thread, {pitch} pitch'),(1210,'Printed lying flat on a cut')]:
    d.ellipse((116,y+8,132,y+24),fill=AMBER);txt((156,y),label,30,INK)
txt((116,1480),'Test and demonstration models',34,INK,True)
txt((116,1536),'Editable OpenSCAD source',30,MUTE)
save('01_cover_landscape')

page('The 45° thread','Section through screw and nut. No flank overhangs more than 45°.',f'02 / {N}')
a=render('section',(112,420,1555,790))
marker(a['A'],'A')
panel((112,830,1555,1640),'A','THREAD PROFILE')
f=render('profile',(190,960,1340,1510))
txt((f['p1'][0]-170,960+20),'NUT',26,MUTE,True)
txt((f['p1'][0]-170,1510-50),'SCREW',26,MUTE,True)
angle_arc(f['ang_v'],f['ang_f'],f['ang_h'],95,'45°')
horizontal_dim(f['p1'],f['p2'],925,f'{pitch} pitch',32,above=True)
x=f['right'][0]+40
vertical_dim(f['dep_lo'],f['dep_hi'],x,mm(p['depth']),30)
txt((x+22,(f['dep_lo'][1]+f['dep_hi'][1])/2+40),'deep',26,MUTE,anchor='lm')
leader(f['gap'],(f['gap'][0]-120,1585),f'{gap} gap','thread_clearance','left',30)
card(490,'Thread angle','45°','both flanks','Each flank leans 45° from the axis. Nothing overhangs more than 45°.')
card(850,'Pitch',pitch,'thread_pitch',f'From one thread to the next; printed best. Depth 0.4 × pitch = {mm(p["depth"])}.')
card(1210,'Clearance',gap,'thread_clearance','Gap on every side between screw and nut. All of it is in the nut.')
save('02_thread_angle')

page('Screw and nut','The smallest screw that held up in the tests, and its nut.',f'03 / {N}')
a=render('sizes',(150,640,1530,1420))
vertical_dim(a['d_top'],a['d_bot'],a['tip'][0]+45,f'Ø{dia}',32)
nx=(a['n_top'][0]+a['n_bot'][0])/2
arrow((nx,a['n_top'][1]),(nx,a['n_bot'][1]),both=True,head=11)
for q in ['n_top','n_bot']: d.line((a[q][0],a[q][1],nx,a[q][1]),fill=AMBER,width=3)
txt((nx,a['n_bot'][1]+150),f'Ø{nut}',34,AMBER,True,'mt'); txt((nx,a['n_bot'][1]+200),'nut thread',26,MUTE,anchor='mt')
leader(a['cham'],(a['cham'][0]-60,a['cham'][1]-230),f'{mm(p["tip_chamfer"])} chamfer','tip_chamfer','left',30)
horizontal_dim(a['shank'],a['end'],a['end'][1]+70,mm(p['screw_length']),32)
card(490,'Screw diameter',dia,'thread_diameter','Smallest stable size. In the tests a 3 mm screw broke and a 4 mm screw twisted.')
card(850,'Nut thread',nut,f'{num(p["thread_diameter"])} + 2 × {num(p["thread_clearance"])}',f'The nut is cut {gap} bigger on every side, so the screw turns freely.')
card(1210,'Tip chamfer',mm(p['tip_chamfer']),'tip_chamfer','45° chamfer on the tip, so the screw finds the thread easily.')
save('03_screw_and_nut')

page('Print it lying flat','The most important rule. Layer lines drawn 0.4 mm thick to show them.',f'04 / {N}')
a=render('layers',(112,430,1555,1520))
txt((a['up_base'][0],a['up_base'][1]+70),'UPRIGHT',36,INK,True,'mt')
txt((a['up_base'][0],a['up_base'][1]+120),'breaks between layers',28,MUTE,anchor='mt')
txt((a['lie_base'][0],a['lie_base'][1]+70),'LYING FLAT',36,AMBER,True,'mt')
txt((a['lie_base'][0],a['lie_base'][1]+120),'layers along the thread',28,MUTE,anchor='mt')
leader(a['up_weak'],(a['up_weak'][0]+230,a['up_weak'][1]-160),'snaps here',None,'right',30)
up=lambda q:(q[0],q[1]-170)  # clear of the head
arrow(up(a['lie_a']),up(a['lie_b']),both=True,head=13)
mid=up(((a['lie_a'][0]+a['lie_b'][0])/2,(a['lie_a'][1]+a['lie_b'][1])/2))
txt((mid[0],mid[1]-22),'one layer, full length',26,AMBER,True,'mb')
card(490,'Print orientation','LYING','part = "print_layout"','The screw lies on a flat of its head, with the thread along the bed.')
card(850,'Upright','BREAKS','short layers','Each layer is a small disc. Screwing it in twists the thread, and it snaps between two layers.')
card(1210,'Lying flat','HOLDS','long layers','The extrusion lines run along the whole thread and carry the twist.')
save('04_print_lying_flat')

page('Cut off the underside','The head is wider than the thread, so a lying screw would float.',f'05 / {N}')
v=[visible('nocut'),visible('cut')]
crop=(min(b[0] for b in v),min(b[1] for b in v),max(b[2] for b in v),max(b[3] for b in v))
for y0,name,label in [(430,'nocut','WITHOUT CUT'),(1020,'cut','WITH CUT')]:
    a=render(name,(330,y0+20,1555,y0+560),crop)
    d.line((a['bed_l'],a['bed_r']),fill=INK,width=4)
    txt((116,y0+40),label,32,AMBER if name=='cut' else INK,True)
    if name=='nocut':
        vertical_dim(a['gap_hi'],a['gap_lo'],a['gap_hi'][0]+40,f'{mm(p["float_gap"])} gap',30)
        txt((116,y0+95),'needs support',28,MUTE)
    else:
        leader(a['thread_cut'],(a['thread_cut'][0]-80,a['thread_cut'][1]+70),f'{mm(p["cut"])} off the thread',None,'right',28)
        leader(a['head_cut'],(a['head_cut'][0]-110,a['head_cut'][1]+60),f'{mm(p["head_cut"])} off the head',None,'left',28)
        txt((116,y0+95),'no support',28,MUTE)
card(490,'Floating gap',mm(p['float_gap']),'(head − thread) / 2','Lying on its head, the thread would hang this high above the bed and need support.')
card(850,'The cut',mm(p['cut']),f'screw_cut = {num(p["screw_cut"])} × diameter','Cut off the underside of thread and head. Both stand on one flat on the bed.')
card(1210,'Still a screw','WORKS','no support needed','Only the thread tips on the underside are lost. It still turns and holds.')
save('05_cut_off_the_underside')

page('Clearance test set','One screw per diameter, and nuts with 0.15, 0.2 and 0.25 mm clearance.',f'06 / {N}')
a=render('testing',(112,420,1555,1660))
results={3:'broke',4:'twists',5:'best with 0.25'}
for dd in p['test_diameters']:
    x,y=a[f'row{dd}']
    txt((x-30,y-22),f'{dd} mm',32,AMBER if dd==5 else INK,True,'rm')
    if dd in results: txt((x-30,y+20),results[dd],25,AMBER if dd==5 else MUTE,dd==5,'rm')
card(490,'Smallest stable',dia,'thread_diameter','3 mm broke while screwing it in. 4 mm turned easily but twisted and deformed under load.')
card(850,'Best clearance',gap,'thread_clearance',f'The {dia} screw ran best in the {gap} nut: a {nut} nut thread.')
card(1210,'Test your printer','20 PARTS','part = "testing"','The nuts lie on their side to test the thread overhang. Diameter and clearance are engraved.')
save('06_clearance_test_set')

page('Print and customize','Screw lying on its cut, nut flat on the bed.',f'07 / {N}')
render('print',(120,435,1500,1480))
txt((810,1535),'PRINT LAYOUT, NO SUPPORTS',29,INK,True,'mt')
card(490,'Supports','NONE','part = "print_layout"','The 45° thread and the flat cut let both parts print without support.')
card(850,'Test models','DEMO','not finished hardware','These models show which dimensions work. Use them as a starting point for your own screws.')
card(1210,'Customize in OpenSCAD','EDIT → RENDER','F6 → Export STL','Change diameter, pitch, clearance and cut in the Customizer.')
save('07_print_and_customize')

page('',None,'COVER / PORTRAIT',portrait=True)
txt((116,235),'NO SUPPORT STRUCTURES',33,AMBER,True)
txt((106,330),'SMALLEST',125,INK,True)
txt((106,485),'FDM SCREW',125,INK,True)
txt((116,690),'The dimensions that make it work.',40,INK)
render('hero',(90,800,1710,2010))
txt((116,2110),f'Ø{dia} screw, 45° thread, {pitch} pitch',34,INK,True)
txt((116,2170),'Test and demonstration models',34,INK)
save('08_cover_portrait')

# A review sheet is deliberately separate from the upload images.
sheet=Image.new('RGB',(1800,18+480*math.ceil(len(made)/3)),BG)
draw=ImageDraw.Draw(sheet)
for i,name in enumerate(made):
    pic=Image.open(images/(name+'.jpg'));pic.thumbnail((566,420),Image.Resampling.LANCZOS)
    x=18+(i%3)*600; y=18+(i//3)*480
    sheet.paste(pic,(x+(566-pic.width)//2,y))
    draw.text((x,y+430),name,font=font(20),fill=INK)
sheet.save(output/'contact-sheet.jpg',quality=93,icc_profile=icc)
print(json.dumps({'images':made,'output':str(images)}))
