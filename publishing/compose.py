# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Typeset the CAD comparison covers and publication copy; keep exact parameter captions."""
import io, json, os, shlex, subprocess, sys, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms
import cairo, gi
gi.require_version('Rsvg','2.0')
from gi.repository import Rsvg
cfg=json.loads(Path(sys.argv[1]).read_text()); root=Path(cfg['root']); only=sys.argv[2] if len(sys.argv)>2 else None
BG='#F4EFE4'; INK='#273532'; MUTE='#63706A'; LINE='#D1CABD'; ACCENT='#A95D24'
FONT=os.environ.get('PUBLISH_FONT')
if not FONT:
    match=subprocess.check_output(['fc-match','-f','%{family}|%{file}','Consolas'],text=True).split('|')
    FONT=match[1]; FONT_FAMILY=match[0]
else: FONT_FAMILY=ImageFont.truetype(FONT,20).getname()[0]
BOLD=os.environ.get('PUBLISH_FONT_BOLD') or subprocess.check_output(['fc-match','-f','%{file}',FONT_FAMILY+':style=Bold'],text=True)
fonts={}
def font(size,bold=False):
    key=(size,bold)
    if key not in fonts:fonts[key]=ImageFont.truetype(BOLD if bold else FONT,size)
    return fonts[key]
def fit(text,maxwidth,size,bold=False):
    while d.textlength(text,font=font(size,bold))>maxwidth:size-=1
    return size

def logo_svg(width):
    handle=Rsvg.Handle.new_from_data((root/'veryos_logo.svg').read_bytes())
    height=round(width*31.2528266758/43.9095293518)
    surface=cairo.ImageSurface(cairo.FORMAT_ARGB32,width,height); rect=Rsvg.Rectangle()
    rect.x=0;rect.y=0;rect.width=width;rect.height=height
    handle.render_document(cairo.Context(surface),rect)
    stream=io.BytesIO();surface.write_to_png(stream);stream.seek(0)
    return Image.open(stream).convert('RGBA')
logo=logo_svg(90)
scad=Image.open(root/'projects/biclightercase2/publish/source/assets/openscad.png').convert('RGBA')
scad.thumbnail((68,68),Image.Resampling.LANCZOS)
icc=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
def text(x,y,s,size=32,fill=INK,bold=False):d.text((x,y),s,font=font(size,bold),fill=fill,anchor='lt')

def covers(p,output):
    global im,d
    pics=[Image.open(output/'renders'/f'{i+1:02d}.png').convert('RGBA') for i in range(4)]
    boxes=[pic.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox() for pic in pics]
    if any(b is None for b in boxes):raise ValueError('Empty render '+p['id'])
    crop=(max(0,min(b[0] for b in boxes)-18),max(0,min(b[1] for b in boxes)-18),min(pics[0].width,max(b[2] for b in boxes)+18),min(pics[0].height,max(b[3] for b in boxes)+18))
    for portrait in (False,True):
        W,H=(1800,2400) if portrait else (2400,1800)
        im=Image.new('RGBA',(W,H),BG);d=ImageDraw.Draw(im)
        margin=100 if portrait else 120
        im.alpha_composite(logo,(margin,42));text(margin+114,59,'VERYOS',36,bold=True)
        im.alpha_composite(scad,(W-margin-286,45));text(W-margin-202,64,'OpenSCAD',29)
        d.line((margin,145,W-margin,145),fill=LINE,width=2)
        text(margin,183,'ONE SOURCE. FOUR VARIATIONS.',26,ACCENT,True)
        title_size=fit(p['title'],W-margin*2,82 if portrait else 88,True)
        text(margin-4,240,p['title'],title_size,bold=True)
        text(margin,240+title_size+25,p['subtitle'],fit(p['subtitle'],W-margin*2,34),MUTE)
        top=425 if portrait else 425
        bottom=H-215
        gap=60 if portrait else 90
        cw=(W-2*margin-gap)//2;ch=(bottom-top-42)//2
        for i,v in enumerate(p['variants']):
            x=margin+(i%2)*(cw+gap); y=top+(i//2)*(ch+42)
            d.line((x,y,x+cw,y),fill=LINE,width=2)
            text(x,y+22,f'0{i+1}',26,ACCENT,True)
            text(x+66,y+18,v['name'],fit(v['name'],cw-66,38,True),INK,True)
            text(x,y+73,v['label'],fit(v['label'],cw,28),MUTE)
            pic=pics[i].crop(crop)
            scale=min(cw/pic.width,(ch-135)/pic.height)
            size=(round(pic.width*scale),round(pic.height*scale))
            pic=pic.resize(size,Image.Resampling.LANCZOS)
            im.alpha_composite(pic,(round(x+(cw-size[0])/2),round(y+125+(ch-135-size[1])/2)))
        band_y=H-180
        d.rounded_rectangle((margin,band_y,W-margin,band_y+84),radius=12,fill=INK)
        label='EDIT PARAMETERS  →  RENDER  →  EXPORT'
        sz=fit(label,W-margin*2-65,35,True)
        tw=d.textlength(label,font=font(sz,True));text((W-tw)/2,band_y+27,label,sz,BG,True)
        foot='SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS'
        text(margin,H-57,foot,fit(foot,W-margin*2,20),MUTE)
        path=output/('thumbnail_3x4.png' if portrait else 'thumbnail_4x3.png')
        im.convert('RGB').save(path,icc_profile=icc,optimize=True)
    return crop

def listing(p,output):
    source=root/'projects'/p['folder']/p['source']
    body=f"# {p['title']} — Customizable OpenSCAD Model\n\n{p['description']}\n\n## What you can customize\n\n{p['customize']}\n\n## Four examples shown\n\n| Preset | Caption | Parameter overrides |\n| --- | --- | --- |\n"
    for v in p['variants']:
        values=', '.join(f'`{k}={json.dumps(x,ensure_ascii=False)}`' for k,x in v['params'].items())
        body+=f"| {v['name']} | {v['label']} | {values} |\n"
    body+='\nThe four models use the same camera and scale within each comparison image. They are independently regenerated from the source parameters, not stretched copies. Colors are presentation choices.\n'
    body+=f"\n## Print / assembly notes\n\n{p['notes']}\n"
    body+=f"\n## Customize and export\n\nOpen [`{p['source']}`](../../{p['source']}) in OpenSCAD. Apply a preset from the table or edit the parameters directly, render with F6, and export the required part. `presets.json` contains the four Customizer presets. The included `export-variant.mjs` can also reproduce them from `variants.json`.\n\nThe example below is run from the project folder and reproduces the first pictured view. An assembled view is for inspection; use the print view or individual part selectors described above for printing.\n\n```sh\n"
    v=p['variants'][0]
    cmd=['openscad']
    for k,x in v['params'].items():cmd+=['-D',k+'='+json.dumps(x,separators=(',',':'),ensure_ascii=False)]
    cmd+=['-o','example.stl',p['source']]
    body+=shlex.join(cmd)+'\n```\n'
    body+='\nTo export any pictured preset with all values preserved, run the included helper from the project folder:\n\n```sh\n'+shlex.join(['node','publish/customization/export-variant.mjs',p['variants'][0]['name'],'example.stl'])+'\n```\n\nAppend `--view=print` or `--part=print_layout` only where that selector is supported by the source, or choose an individual printable part.\n'
    body+='\n## Tags\n\n'+p['tags']+', OpenSCAD, parametric, customizable, '+'3D printable'+'\n'
    body+='\n## Publication files\n\n- `thumbnail_4x3.png` — 2400 × 1800 landscape comparison.\n- `thumbnail_3x4.png` — 1800 × 2400 portrait comparison.\n- `renders/01.png` through `04.png` — separate transparent CAD renders.\n- `presets.json`, `variants.json`, `export-variant.mjs` — reusable pictured parameters.\n- `provenance.json` — source hashes, tools and typography.\n'
    body+='\nModel licensing remains with the source and repository license; this pack does not assign a new license to existing designs.\n'
    (output/'listing.md').write_text(body)
    export_records=[json.loads((Path(cfg['cache'])/p['id']/f'{i+1}.source.json').read_text()) for i in range(4)]
    current_sha=hashlib.sha256(source.read_bytes()).hexdigest()
    if any(r['source_sha256']!=current_sha for r in export_records):raise ValueError('Source changed after export: '+p['id'])
    provenance={'source':str(source.relative_to(root)),'source_sha256':current_sha,'tools':export_records[0]['tools'],'exports':export_records,'font':FONT_FAMILY,'requested_font':'Consolas','font_substitution':FONT_FAMILY.lower()!='consolas','geometry':'OpenSCAD-exported meshes; no AI-generated or scaled surrogate geometry','scale':'same orthographic scale for all four variants within a project','preset_notes':'Dimensions describe the named source parameters; see listing for external relief and allowances.'}
    (output/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    (output/'UPLOAD.txt').write_text('Suggested order: thumbnail_4x3.png, then thumbnail_3x4.png if useful.\nUse listing.md for title, description and tags.\nOffer the linked original SCAD source with its dependencies and license, plus presets.json/variants.json.\nRenders are digital previews. Assembly STL files are not included in this publication pack.\n')

ready=[];missing=[]
for p in cfg['projects']:
    output=root/'projects'/p['folder']/'publish/customization'
    if only and only!=p['id']:
        if (output/'thumbnail_4x3.png').exists():ready.append(p)
        continue
    if not all((output/'renders'/f'{i+1:02d}.png').exists() for i in range(4)):
        missing.append(p['id']);continue
    covers(p,output);listing(p,output);ready.append(p);print('COMPOSED',p['id'],flush=True)
# A browsable Markdown index and a contact sheet, without touching older packs.
lines=['# Customization publishing pack','',f'{len(ready)} model packs, with four actual CAD variants each. Both cover orientations keep the variants at the same scale.','',
       'Open the overview image to review the collection; follow a project link for copy, individual renders and presets.','',
       '[Full collection contact sheet](overview.png)','','| Project | Landscape | Portrait | Listing |','| --- | --- | --- | --- |']
for p in ready:
    base='../projects/'+p['folder']+'/publish/customization/'
    lines.append(f"| {p['title']} | [4:3]({base}thumbnail_4x3.png) | [3:4]({base}thumbnail_3x4.png) | [Copy + presets]({base}listing.md) |")
lines+=['','Only the latest lighter case, wipes box, screw-top container and phone mount are included, as requested.','']
lines+=['','## Typography and source fidelity','',f'The requested typeface is Consolas. This machine resolves it to **{FONT_FAMILY}**, which is used consistently here. Set `PUBLISH_FONT` and `PUBLISH_FONT_BOLD` to local Consolas font files and rerun the composition stage to replace it. The VeryOS mark is rendered from the root `veryos_logo.svg`; the OpenSCAD logo comes from the existing publishing assets.', '',
       'Every pictured variant was exported from the named source. The source hash, parameter overrides and camera scale accompany each pack. New dimensional combinations are digital examples, not claims of print testing or fit. Older publishing material is preserved.', '',
       'Rebuild instructions are in [README.md](README.md).']
if missing:lines+=['','## Pending renders','',', '.join(missing)]
(root/'publishing/index.md').write_text('\n'.join(lines)+'\n')
if ready:
    cols=3;tilew=700;tileh=600;rows=(len(ready)+cols-1)//cols
    sheet=Image.new('RGB',(cols*tilew,rows*tileh),BG);sd=ImageDraw.Draw(sheet)
    for i,p in enumerate(ready):
        thumb=Image.open(root/'projects'/p['folder']/'publish/customization/thumbnail_4x3.png');thumb.thumbnail((tilew-28,504),Image.Resampling.LANCZOS)
        x=(i%cols)*tilew;y=(i//cols)*tileh
        sheet.paste(thumb,(x+14,y+12));sd.text((x+18,y+530),p['title'],font=font(23,True),fill=INK)
    sheet.save(root/'publishing/overview.png',optimize=True,icc_profile=icc)
print(json.dumps({'ok':not missing,'composed':len(ready),'missing':missing,'font':FONT_FAMILY}))
if missing:sys.exit(1)
