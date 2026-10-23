# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Photo covers from a real print: the print is cut out with GrabCut and only
white-balanced; the backdrop lighting is divided out so the studio paper
becomes the page colour, keeping the contact shadow under the print.
Run from any directory: python3 publish/source/photo_covers.py"""
from pathlib import Path
import io
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageFilter
import gi, cairo
gi.require_version('Rsvg','2.0')
from gi.repository import Rsvg

here=Path(__file__).resolve().parent
output=here.parent; root=output.parent.parent.parent
images=output/'images'; images.mkdir(exist_ok=True)
PHOTO=output/'WhatsApp Unknown 2026-10-23 at 17.14.49'/'WhatsApp Image 2026-10-23 at 17.14.04 (5).jpeg'
# Sure-foreground seed inside the white wipe, in photo pixels. The wipe is too
# close to the backdrop in colour to be found by thresholds alone.
WIPE=[(530,520),(610,430),(720,385),(770,380),(840,470),(950,590),(1000,660),
      (1010,720),(850,715),(650,715),(550,690),(500,620),(495,570)]
BG='#F4EFE3'; INK='#252C2B'; MUTE='#65716B'; LINE='#CEC7B8'; AMBER='#BD711F'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
def font(size,bold=False): return ImageFont.truetype(BOLD if bold else FONT,size)
def txt(pos,text,size=36,fill=INK,bold=False):
    d.text(pos,text,font=font(size,bold),fill=fill)

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
scad=Image.open(here/'assets'/'openscad.png').convert('RGBA')
scad.thumbnail((68,68),Image.Resampling.LANCZOS)

def page(portrait):
    global im,d
    W,H=(1800,2400) if portrait else (2400,1800)
    im=Image.new('RGBA',(W,H),BG);d=ImageDraw.Draw(im)
    im.alpha_composite(logo,(112,65)); txt((220,72),'VERYOS',42,INK,True)
    im.alpha_composite(scad,(W-335,61));txt((W-245,80),'OpenSCAD',29,INK)
    d.line((112,155,W-112,155),fill=LINE,width=2)
    d.line((112,H-113,W-112,H-113),fill=LINE,width=2)
    txt((112,H-78),'EDITABLE OPENSCAD MODEL',24,MUTE)

def flatten(path,passes=3,threshold=14):
    """Return the print on the page colour, and the print's bounding box."""
    pic=Image.open(path).convert('RGB'); W,H=pic.size
    photo=np.asarray(pic,float)
    # Smooth backdrop: fit, drop everything that departs from it, fit again.
    small=np.asarray(pic.reduce(8),float); h,w,_=small.shape
    def terms(w,h):
        yy,xx=np.mgrid[0:h,0:w]; X=xx/w*2-1; Y=yy/h*2-1
        return [X**i*Y**j for i in range(4) for j in range(6)]
    A=np.stack([t.ravel() for t in terms(w,h)],1)
    light=small.mean(2)
    keep=(light>120)&(small.max(2)-small.min(2)<70)
    for _ in range(passes):
        coef=np.linalg.lstsq(A[keep.ravel()],small.reshape(-1,3)[keep.ravel()],rcond=None)[0]
        away=(np.abs(small-(A@coef).reshape(h,w,3)).max(2)>threshold).astype(np.uint8)
        keep=(cv2.dilate(away,np.ones((7,7),np.uint8))==0)&(light>120)
    backdrop=sum(t[...,None]*c for t,c in zip(terms(W,H),coef))
    # Cut out the print at half resolution: the dark print and the wipe seed
    # are certain, a band around them is left for GrabCut to decide.
    half=cv2.resize(np.asarray(pic)[...,::-1],(W//2,H//2),interpolation=cv2.INTER_AREA)
    disk=lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*r+1,2*r+1))
    dark=cv2.morphologyEx((half.mean(2)<90).astype(np.uint8),cv2.MORPH_OPEN,disk(2))
    core=cv2.morphologyEx(dark,cv2.MORPH_CLOSE,disk(20))
    wipe=np.zeros_like(core); cv2.fillPoly(wipe,[np.array(WIPE)//2],1)
    mask=np.full(core.shape,cv2.GC_BGD,np.uint8)
    mask[cv2.dilate(core|wipe,disk(35))>0]=cv2.GC_PR_BGD
    mask[cv2.dilate(core,disk(6))|cv2.dilate(wipe,disk(20))>0]=cv2.GC_PR_FGD
    mask[cv2.erode(core,disk(4))|wipe>0]=cv2.GC_FGD
    cv2.grabCut(half,mask,None,np.zeros((1,65)),np.zeros((1,65)),6,cv2.GC_INIT_WITH_MASK)
    subject=((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD)).astype(np.uint8)
    # Fill small enclosed holes (a mislabelled patch of the lid); larger
    # openings are real backdrop seen through the gap under the raised lid.
    n,label,stats,_=cv2.connectedComponentsWithStats(1-subject,connectivity=4)
    for i in range(1,n):
        x,y,cw,ch,area=stats[i]
        if area<.002*subject.size and x>0 and y>0 and x+cw<subject.shape[1] and y+ch<subject.shape[0]:
            subject[label==i]=1
    alpha=cv2.GaussianBlur(cv2.resize(subject.astype(np.float32),(W,H)),(0,0),1.2)[...,None]
    ys,xs=np.nonzero(subject); box=(xs.min()*2,ys.min()*2,(xs.max()+1)*2,(ys.max()+1)*2)
    # Keep the photo's shading in a contact band under each column of the
    # print; shadows elsewhere on the backdrop fade to the page colour.
    low=cv2.resize(subject,(w,h),interpolation=cv2.INTER_AREA)>0
    bottom=np.where(low.any(0),h-1-np.argmax(low[::-1],0),-99)
    rows=np.arange(h)[:,None]
    contact=((rows>=bottom-4)&(rows<=bottom+10)).astype(np.float32)
    weight=cv2.GaussianBlur(cv2.resize(contact,(W,H)),(0,0),16)[...,None]
    page_color=np.array([int(BG[i:i+2],16) for i in (1,3,5)],float)
    # Backdrop: divide out its lighting; light bounce is capped at the page colour.
    paper=page_color*np.clip(photo/backdrop,1e-3,1)**weight
    # Print: neutralise the colour cast against the white wipe; no exposure push.
    white=np.median(photo[cv2.resize(wipe,(W,H),interpolation=cv2.INTER_NEAREST)>0],0)
    printed=photo*white.mean()/white
    out=alpha*printed+(1-alpha)*paper
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8)),box

def place(pic,box,target,clip):
    """Scale the print's bounding box into target (right-aligned, centred
    vertically); the photo's edges fade into the page inside clip."""
    scale=min((target[2]-target[0])/(box[2]-box[0]),(target[3]-target[1])/(box[3]-box[1]))
    xy=(round(target[2]-box[2]*scale),round((target[1]+target[3])/2-(box[1]+box[3])/2*scale))
    pic=pic.resize((round(pic.width*scale),round(pic.height*scale)),Image.Resampling.LANCZOS)
    x0,y0=max(clip[0],xy[0]),max(clip[1],xy[1]); x1,y1=min(clip[2],xy[0]+pic.width),min(clip[3],xy[1]+pic.height)
    crop=pic.crop((x0-xy[0],y0-xy[1],x1-xy[0],y1-xy[1]))
    mask=Image.new('L',crop.size,0); ImageDraw.Draw(mask).rectangle((30,30,crop.width-31,crop.height-31),fill=255)
    im.paste(crop,(x0,y0),mask.filter(ImageFilter.GaussianBlur(15)))

icc=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
def save(name):
    pic=im.convert('RGB')
    pic.save(images/(name+'.png'),optimize=True,icc_profile=icc)
    pic.save(images/(name+'.jpg'),quality=95,subsampling=0,optimize=True,icc_profile=icc)
    print('COMPOSED',name,flush=True)

shot,box=flatten(PHOTO)
page(False)
place(shot,box,(700,250,2230,1640),(0,165,2400,1680))
txt((116,238),'PARAMETRIC STORAGE',33,AMBER,True)
txt((106,335),'BABY WIPES',117,INK,True)
txt((106,480),'BOX',117,INK,True)
txt((116,710),'Pick the pattern.',43,INK)
txt((116,780),'Flip the lid.',43,INK)
save('photo_landscape')

page(True)
place(shot,box,(112,820,1688,2250),(0,165,1800,2280))
txt((116,235),'PARAMETRIC STORAGE',33,AMBER,True)
txt((106,330),'BABY WIPES',125,INK,True)
txt((106,485),'BOX',125,INK,True)
txt((116,690),'Pick the pattern. Flip the lid.',40,INK)
save('photo_portrait')
