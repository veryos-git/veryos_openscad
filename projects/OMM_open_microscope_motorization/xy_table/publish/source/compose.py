# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Compose the publication PNGs from the CAD renders and the brand assets."""
import io, json, math, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageCms, ImageOps
import cairo, gi
gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

cfg = json.loads(Path(sys.argv[1]).read_text())
OUT, PROJECT, ROOT = Path(cfg['output']), Path(cfg['project']), Path(cfg['root'])
D = cfg['dims']
# Brand: Ivory background, Graphite ink, Ochre accent on ivory.
BG, INK, MUTE, LINE, OCHRE, PANEL = '#F4EFE3', '#151B1D', '#5D6461', '#D9D2C3', '#B77B1E', '#E6DFCF'
# Movement arrows: red, off the brand's palette, so that they stand out on every part.
RED = '#D62E1F'
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
    """veryos_logo.svg as drawn, filled in Graphite."""
    h = round(width*31.2528266758/43.9095293518)
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, h)
    rect = Rsvg.Rectangle(); rect.x = 0; rect.y = 0; rect.width = width; rect.height = h
    Rsvg.Handle.new_from_data((ROOT/'veryos_logo.svg').read_bytes()).render_document(cairo.Context(surface), rect)
    stream = io.BytesIO(); surface.write_to_png(stream); stream.seek(0)
    mark = Image.new('RGBA', (width, h), INK)
    mark.putalpha(Image.open(stream).getchannel('A'))
    return mark

logo = svg_logo(86)
scad = Image.open(ROOT/'projects/01_published_or_archived/fdm_optimized_screws/publish/source/assets/openscad.png').convert('RGBA')
scad.thumbnail((64, 64), Image.Resampling.LANCZOS)
info = {r['id']: r for r in json.loads((OUT/'renders/render-info.json').read_text())}
renders = {k: Image.open(OUT/'renders'/(k+'.png')).convert('RGBA') for k in info}
# Close-ups fill their frame; every other render shows all of its pieces.
framed = {s['id'] for s in cfg['scenes'] if 'frame' in s}
for name, pic in renders.items():
    assert pic.size == (1800, 1500) or '--draft' in sys.argv, 'Render at publication resolution first: '+name
    b = pic.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
    assert name in framed or b and b[0] > 0 and b[1] > 0 and b[2] < pic.width and b[3] < pic.height, 'Clipped render: '+name

def visible(name):
    return renders[name].getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()

def place(name, box, f=None, bottom=False):
    """A render cropped tight and fitted into box, at factor f if given.
    Returns where a mark of the render lands in the image."""
    x, y, w, h = box
    crop = visible(name)
    p = renders[name].crop(crop)
    f = f or min(w/p.width, h/p.height)
    p = p.resize((round(p.width*f), round(p.height*f)), Image.Resampling.LANCZOS)
    ox, oy = round(x+(w-p.width)/2), round(y+h-p.height if bottom else y+(h-p.height)/2)
    im.alpha_composite(p, (ox, oy))
    marks = info[name]['marks']
    return lambda key: (ox+(marks[key][0]-crop[0])*f, oy+(marks[key][1]-crop[1])*f)

def row(names, box, gap=70):
    """Renders that share a camera scale side by side at one factor, so their
    sizes compare, standing on the bottom of box. Returns each one's left,
    top and right edge and its marks."""
    x, y, w, h = box
    sizes = [(visible(n)[2]-visible(n)[0], visible(n)[3]-visible(n)[1]) for n in names]
    f = min((w-gap*(len(names)-1))/sum(s[0] for s in sizes), h/max(s[1] for s in sizes))
    left = x+(w-f*sum(s[0] for s in sizes)-gap*(len(names)-1))/2
    out = []
    for n, (sw, sh) in zip(names, sizes):
        at = place(n, (round(left), y, round(sw*f), h), f, bottom=True)
        out.append((round(left), round(y+h-sh*f), round(left+sw*f), at))
        left += sw*f+gap
    return out

def pinned(names, boxes, key):
    """Renders that share a camera scale, one per box, at one factor and with
    the mark key at the same height in every box: what moved up between them shows."""
    crops = [visible(n) for n in names]
    ys = [info[n]['marks'][key][1] for n in names]
    above, below = max(y-c[1] for c, y in zip(crops, ys)), max(c[3]-y for c, y in zip(crops, ys))
    f = min(boxes[0][2]/max(c[2]-c[0] for c in crops), boxes[0][3]/(above+below))
    out = []
    for n, c, my, (x, y, w, h) in zip(names, crops, ys, boxes):
        p = renders[n].crop(c)
        p = p.resize((round(p.width*f), round(p.height*f)), Image.Resampling.LANCZOS)
        ox, oy = round(x+(w-p.width)/2), round(y+(h-(above+below)*f)/2+(above-(my-c[1]))*f)
        im.alpha_composite(p, (ox, oy))
        out.append(lambda k, n=n, c=c, ox=ox, oy=oy: (ox+(info[n]['marks'][k][0]-c[0])*f, oy+(info[n]['marks'][k][1]-c[1])*f))
    return out

def picture(name, box):
    """A close-up that fills its frame, on a panel with round corners."""
    x, y, w, h = box
    p = Image.new('RGBA', renders[name].size, PANEL); p.alpha_composite(renders[name])
    f = w/p.width
    p = p.resize((w, h), Image.Resampling.LANCZOS)
    mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, w-1, h-1), radius=18, fill=255)
    p.putalpha(mask); im.alpha_composite(p, (x, y))
    marks = info[name]['marks']
    return lambda key: (x+marks[key][0]*f, y+marks[key][1]*f)

def badge(x, y, label, filled=True):
    w = 52+draw.textlength(label, font=font(22, True))
    draw.rounded_rectangle((x, y, x+w, y+48), radius=24, fill=INK if filled else BG, outline=INK, width=3)
    text(x+26, y+13, label, 22, BG if filled else INK, True)

def new(section, size=(2400, 1800)):
    global im, draw, W, H
    W, H = size; im = Image.new('RGBA', size, BG); draw = ImageDraw.Draw(im)
    im.alpha_composite(logo, (100, 52))
    text(210, 64, 'Very', 38, bold=True)
    text(210+draw.textlength('Very', font=font(38, True)), 64, 'OS', 38, OCHRE, True)
    im.alpha_composite(scad, (W-370, 49)); text(W-288, 67, 'OpenSCAD', 30)
    draw.line((100, 150, W-100, 150), fill=LINE, width=2)
    text(100, 194, section, 26, OCHRE, True, maxwidth=W-200)

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

# Dimension lines: Ochre on an Ivory halo, so they read on the render and beside it.
def line(points, width=3):
    draw.line(points, fill=BG, width=width+6, joint='curve')
    draw.line(points, fill=OCHRE, width=width, joint='curve')

def along(pts, dist):
    """The polyline pts without its first dist px."""
    for i in range(len(pts)-1):
        n = math.dist(pts[i], pts[i+1])
        if dist <= n:
            t = dist/n
            return [(pts[i][0]+(pts[i+1][0]-pts[i][0])*t, pts[i][1]+(pts[i+1][1]-pts[i][1])*t)]+pts[i+1:]
        dist -= n
    return pts[-1:]

def red_arrow(pts, both=False, width=16, head=54):
    """A fat red arrow along the polyline pts, on an Ivory halo, its head at
    the last point and at the first too if both; drawn three times larger and
    scaled down, so its edges are smooth."""
    k, pad = 3, head+20
    x0, y0 = min(p[0] for p in pts)-pad, min(p[1] for p in pts)-pad
    pts = [((p[0]-x0)*k, (p[1]-y0)*k) for p in pts]
    width, head = width*k, head*k
    ends, shaft = [pts], along(pts[::-1], head*.8)[::-1]
    if both: ends.append(pts[::-1]); shaft = along(shaft, head*.8)
    heads = []
    for end in ends:
        tip, base = end[-1], along(end[::-1], head)[0]
        dx, dy = (tip[0]-base[0])/math.dist(tip, base), (tip[1]-base[1])/math.dist(tip, base)
        b = (tip[0]-dx*head, tip[1]-dy*head)
        heads.append([tip, (b[0]-dy*head*.48, b[1]+dx*head*.48), (b[0]+dy*head*.48, b[1]-dx*head*.48)])
    size = (round(max(p[0] for p in pts)+pad*k), round(max(p[1] for p in pts)+pad*k))
    layer = Image.new('RGBA', size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    for fill, grow in ((BG, 6*k), (RED, 0)):
        d.line(shaft, fill=fill, width=width+2*grow, joint='curve')
        for h in heads:
            d.polygon(h, fill=fill)
            if grow: d.line(h+[h[0]], fill=fill, width=2*grow, joint='curve')
    layer = layer.resize((size[0]//k, size[1]//k), Image.Resampling.LANCZOS)
    im.alpha_composite(layer, (round(x0), round(y0)))

def label(x, y, s, size=28):
    """A value in a pill centred on (x, y)."""
    f = font(size, True)
    w, h = round(draw.textlength(s, font=f))+30, size+20
    pill = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(pill)
    d.rounded_rectangle((0, 0, w-1, h-1), radius=h//2, fill=BG, outline=OCHRE, width=3)
    d.text((w/2, h/2), s, font=f, fill=INK, anchor='mm')
    im.alpha_composite(pill, (round(x-pill.width/2), round(y-pill.height/2)))

def span(a, b, y, s):
    """A width too small for arrows: lines from a and b to y, the value between them."""
    for p in (a, b): line([(p[0], p[1]), (p[0], y)], 2)
    label((a[0]+b[0])/2, y, s)

def dot(p):
    draw.ellipse((p[0]-9, p[1]-9, p[0]+9, p[1]+9), fill=OCHRE, outline=BG, width=3)

def callouts(at, side, x, edge, step=170, top=470, bottom=1330, width=440):
    """Titles with their lines in a column at x, each with a line from the
    column's edge to its mark, in the order of the marks' heights."""
    side = sorted(side, key=lambda c: at(c[0])[1])
    ys = [at(key)[1] for key, *_ in side]
    y0 = min(max(sum(ys)/len(ys)-step*(len(side)-1)/2, top+50), bottom-step*(len(side)-1))
    for i, (key, title, lines) in enumerate(side):
        y = y0+i*step
        text(x, y-44, title, 27, bold=True, maxwidth=width)
        for j, s in enumerate(lines): text(x, y-4+j*32, s, 22, MUTE, maxwidth=width)
        line([(edge, y-28), (edge+(60 if x < edge else -60), y-28), at(key)], 2)
        dot(at(key))

S = D['standard']
def v(key, k='standard'): return f'{key} = {D[k][key]:g}'
def size(k):
    """A preset's slide, table and slide holder, in mm."""
    d = D[k]
    return (f'{d["scl_x_slide"]:g} × {d["scl_y_slide"]:g}', f'{d["scl_x_x_rail"]:g} × {d["scl_y_table"]:g}',
            f'{d["scl_x_slide"]+d["tol_slide_holder"]+2*d["wall_slide_holder"]+2*d["scl_x_handle_slide_holder"]:g} × '
            f'{d["scl_y_slide"]+d["tol_slide_holder"]+2*d["wall_slide_holder"]:g}')
ROLLER = 2*(S['adapter_r']-S['oring_groove']+S['dia_oring_cord'])
NOT_PRINTED = 'O-RINGS AND SANDING PAPER ARE NOT PRINTED AND NOT IN THE SCRIPT, PAPER THICKNESS ASSUMED'

new('01 / HOW IT WORKS: THE STACK')
heading('Four layers, one optical axis.', 'Each layer slides on a printed rail of the layer below. The light passes through the windows. Shown lifted apart.')
at = place('stack', (580, 450, 1240, 1110))
text(at('axis_top')[0]+18, at('axis_top')[1]-6, 'OPTICAL AXIS', 22, OCHRE, True)
callouts(at, [('glass', 'GLASS SLIDE', [f'{size("standard")[0]} × {S["scl_z_slide"]:g} mm, not printed.']),
              ('holder', 'SLIDE HOLDER', ['Lifts off to change the slide.', 'Its grooves sit on the X slider.']),
              ('x_slider', 'X SLIDER', ['Moves in X on the rail', 'of the Y slider.']),
              ('y_slider', 'Y SLIDER', ['Moves in Y on the table\'s two', 'rails. Carries the X motor.']),
              ('table', 'TABLE', ['Stays. Two rails along Y,', 'the bracket of the Y motor.'])], 1900, 1880, 190, bottom=1530)
callouts(at, [('motor_x', 'X MOTOR', ['28BYJ-48 on the Y slider.', 'Its roller drives the X slider.']),
              ('arm', 'SANDING PAPER', ['On the top of each driven rail,', 'under the motor\'s roller.']),
              ('motor_y', 'Y MOTOR', ['28BYJ-48 on the table.', 'Its roller drives the Y slider.'])], 100, 540, 230, bottom=1530)
footer(['The table\'s window stays on the optical axis. The motors move the slide over it.'],
       f'CAD RENDER, LAYERS LIFTED APART  /  ILLUSTRATIVE COLORS  /  MOTORS SIMPLIFIED  /  {NOT_PRINTED}  /  MM')
save('images/01_stack.png')

new('02 / HOW IT WORKS: TWO AXES')
heading('Y carries X.', 'Seen from above. What stays is grey. The cross is the optical axis, fixed over the table\'s window.')
# Where the slide's centre stands in each view: [x_travel, y_travel].
moved = {s['id']: s['marks']['slide'] for s in cfg['scenes'] if s.get('group') == 'move'}
MOVES = [('move_home', 'HOME', 'x_travel = 0, y_travel = 0', ['The slide\'s centre', 'on the optical axis.']),
         ('move_y', 'Y MOTOR TURNS', f'y_travel = {moved["move_y"][1]:g}', ['Y slider, X slider, slide holder', 'and the X motor move together.']),
         ('move_x', 'X MOTOR TURNS', f'x_travel = {moved["move_x"][0]:g}', ['Only the X slider and', 'the slide holder move.'])]
boxes = [(100+i*750, 700, 700, 800) for i in range(3)]
for (name, title, value, lines), (x, y, w, h), at in zip(MOVES, boxes, pinned([m[0] for m in MOVES], boxes, 'axis')):
    draw.line((x, 460, x+w, 460), fill=LINE, width=2)
    text(x, 488, title, 40, bold=True)
    text(x, 546, value, 28, MUTE)
    for j, s in enumerate(lines): text(x, 600+j*36, s, 26, MUTE)
    (ax, ay), (sx, sy) = at('axis'), at('slide')
    if math.dist((ax, ay), (sx, sy)) > 1:
        n = math.dist((ax, ay), (sx, sy))
        red_arrow([(ax+(sx-ax)/n*26, ay+(sy-ay)/n*26), (sx, sy)])
    line([(ax-34, ay), (ax+34, ay)], 3); line([(ax, ay-34), (ax, ay+34)], 3)
    draw.ellipse((ax-20, ay-20, ax+20, ay+20), outline=OCHRE, width=3)
footer(['Travel in the model: about 41 mm in Y (-13 to +28) and 90 mm in X (-45 to +45).',
        'The Y slider runs on two rails 15 mm apart. Only the first is driven, the second guides.'],
       f'TOP VIEWS, SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  TRAVEL READ FROM THE MODEL, NOT MEASURED  /  {NOT_PRINTED}  /  MM')
save('images/02_two_axes.png')

new('03 / HOW IT WORKS: THE DRIVE')
heading('A roller on a rail.', 'No gears, no lead screw. Each motor turns a printed sleeve with three O-rings; they roll on sanding paper on the rail\'s top.')
at = picture('drive_view', (100, 470, 840, 700))
# The roller turns both ways, the Y slider's arm moves with it.
red_arrow([at(f'turn_{i}') for i in range(sum(k.startswith('turn_') for k in info['drive_view']['marks']))], both=True, width=12, head=42)
for k in 'bf': red_arrow([at(f'move_{k}0'), at(f'move_{k}1')])
badge(130, 500, 'Y DRIVE')
text(1000, 470, 'CUT THROUGH THE Y MOTOR\'S AXIS', 26, OCHRE, True)
draw.line((1000, 510, W-100, 510), fill=LINE, width=2)
cut = place('drive', (1380, 640, 920, 520))
callouts(cut, [('oring', f'{S["num_oring"]:g} O-RINGS', [f'{S["dia_oring_cord"]:g} mm cord, in grooves.']), ('adapter', 'SHAFT ADAPTER', ['Printed sleeve', 'on the motor\'s shaft.']),
               ('paper', 'SANDING PAPER', ['On the rail\'s top.'])], 1000, 1310, 135, 560, 1130, 300)
for key, s, anchor, dx in (('upright', 'UPRIGHT WITH SLOT', 'ra', 40), ('motor', '28BYJ-48', 'ma', 0)):
    p = cut(key)
    line([(p[0], 600), p], 2); dot(p)
    text(p[0]+dx, 560, s, 24, INK, True, anchor=anchor)
for key, s, y, anchor, dx in (('arm2', 'SECOND ARM: GUIDE ONLY', 1206, 'ra', 14), ('rail', 'TABLE\'S RAIL IN THE ARM\'S SLOT', 1250, 'ra', 14),
                              ('arm', 'DRIVEN ARM OF THE Y SLIDER', 1294, 'la', -14)):
    p = cut(key)
    line([(p[0], y-8), p], 2); dot(p)
    text(p[0]+dx, y, s, 24, INK, True, anchor=anchor)
for i, (title, s) in enumerate([('GRIP', f'O-rings with a {S["dia_oring_cord"]:g} mm cord in the sleeve\'s grooves, on sanding paper.'),
                                ('PRESSURE', 'Two M3 screws hold the motor in the uprights\' slots: push it down, tighten.'),
                                ('STEP', f'Ø{ROLLER:.1f} over the O-rings: {math.pi*ROLLER:.0f} mm per turn, about {math.pi*ROLLER/4096*1000:.0f} µm per half step.')]):
    text(100, 1372+i*56, title, 26, OCHRE, True)
    text(290, 1372+i*56, s, 27, maxwidth=2010)
footer(['The X drive is the same: the X motor on the Y slider, its roller on the X slider\'s rail.'],
       f'CAD RENDERS  /  ILLUSTRATIVE COLORS  /  MOTOR SIMPLIFIED  /  {NOT_PRINTED}  /  STEP FROM THE GEOMETRY, 4096 HALF STEPS PER TURN, NOT MEASURED')
save('images/03_drive.png')

FORMATS = [('standard', 'STANDARD'), ('petro', 'PETROGRAPHIC'), ('wide', 'WIDE'), ('large', 'LARGE')]
new('04 / FOUR SLIDE FORMATS')
heading('Four slide formats. One script.', 'Presets in the Customizer. The slide\'s size sets holder, ring and table. Shown at the same scale.')
for (k, name), (left, top, right, at) in zip(FORMATS, row(['format_'+k for k, _ in FORMATS], (100, 470, 2200, 520))):
    slide, table, holder = size(k)
    draw.line((left, 1040, right, 1040), fill=LINE, width=2)
    text(left, 1068, name, 40, bold=True, maxwidth=right-left)
    text(left, 1128, v('scl_x_slide', k), 28, MUTE)
    text(left, 1168, v('scl_y_slide', k), 28, MUTE)
    text(left, 1238, f'slide {slide}', 29, bold=True)
    text(left, 1282, f'table {table}', 27, MUTE)
    text(left, 1322, f'holder {holder}', 27, MUTE)
    badge(left, 1390, 'DEFAULT' if k == 'standard' else 'DIGITAL ONLY', k == 'standard')
footer(['Each preset also sets scl_x_x_slider, table_motor_y and the label\'s place, so the travel stays the same.',
        'For another format: scl_x_x_slider = slide length + 10; move table_motor_y and the label by half the change in width.'],
       'SAME SCALE  /  CAD RENDERS  /  ILLUSTRATIVE COLORS  /  v3.1.0 IS NOT PRINTED YET, NO PRESET IS  /  SLIDES AND MOTORS NOT INCLUDED  /  MM')
save('images/04_slide_formats.png')

new('05 / TOL_RAIL')
heading('tol_rail sets the play.', 'Cut through a rail of the table in the slot of the Y slider\'s arm. All rails share this profile. Shown at the same scale.')
RAILS = ['rail010', 'standard', 'rail040']
guided = S['table_rail_y'][1]-S['table_rail_y'][0]
for k, (left, top, right, at) in zip(RAILS, row(['rail_'+k for k in RAILS], (100, 700, 2200, 460), 90)):
    d = D[k]
    draw.line((left, 460, right, 460), fill=LINE, width=2)
    text(left, 488, v('tol_rail', k), 40, bold=True)
    text(left, 546, f'{d["tol_rail"]/2:g} mm per side and above', 28, MUTE, maxwidth=right-left)
    text(left, 586, f'yaw play ±{math.degrees(d["tol_rail"]/guided):.2f}°', 28, MUTE, maxwidth=right-left)
    span(at('slot_l'), at('slot_r'), top-64, f'slot {d["scl_x_rail"]+d["tol_rail"]:g}')
    span(at('rail_l'), at('rail_r'), 1222, f'rail {d["scl_x_rail"]:g}')
    text(*at('arm'), 'arm', 26, INK, True, anchor='mm'); text(*at('table'), 'table', 26, BG, True, anchor='mm')
    # A thin line without a halo, which would hide the lip
    (mx, my), (tx, ty) = at('mouth'), at('mouth_text')
    draw.line([(tx+8, ty), (mx-2, my)], fill=INK, width=2)
    text(tx, ty, 'mouth', 26, INK, True, anchor='rm')
    badge(left, 1290, 'DEFAULT' if k == 'standard' else 'DIGITAL ONLY', k == 'standard')
text(100, 1392, 'MOUTH', 26, OCHRE, True)
for j, s in enumerate([f'The slot\'s first layer, rail_mouth_h = {S["rail_mouth_h"]:g}, is only workaround_no_space = {S["workaround_no_space"]:g} per side wider than the rail,',
                       'for every tol_rail. The lip makes up for the slicer\'s elephant foot compensation (often 0.15 mm by default),',
                       'which shrinks the first layer and so widens the slot there.']):
    text(290, 1392+j*44, s, 27, maxwidth=2010)
footer([f'Slot = rail + tol_rail. Yaw play of the Y slider = tol_rail / guided length, here {guided:.0f} mm.',
        f'The rail is {S["scl_x_rail"]:g} × {S["scl_y_rail"]:g} with 45° flanks and a top one line wide: {v("extr_width")}. Tight binds, loose wiggles.'],
       'SAME SCALE  /  CAD RENDERS, CUT  /  ILLUSTRATIVE COLORS  /  PLAY FROM THE GEOMETRY, NOT MEASURED  /  v3.1.0 IS NOT PRINTED YET  /  MM')
save('images/05_tol_rail.png')

new('06 / PRINT')
heading('All parts on one bed.', 'part = "print_layout": every part as it prints, on 256 × 256 mm. Made for 0.2 mm layers, without support.')
draw.rounded_rectangle((100, 465, 1535, 1520), radius=18, fill='#C9C4B6')
at = place('layout', (140, 495, 1355, 995))
rows = [('table', 'TABLE', ['Plate down, rails and bracket up.']),
        ('y_slider', 'Y SLIDER', ['Plate down, the arms\' slots open to the bed.']),
        ('x_slider', 'X SLIDER', ['Slot open to the bed.']),
        ('slide_holder', 'SLIDE HOLDER', ['Grooves open to the bed.']),
        ('adapters', 'SHAFT ADAPTER × 2, WASHER × 4', ['Adapters on their closed end.']),
        ('ruler', 'CUTTING RULER', ['Two bars to trace the paper strips around.'])]
for i, (key, title, lines) in enumerate(rows):
    y = 470+i*142
    p = at(key)
    draw.ellipse((p[0]-26, p[1]-26, p[0]+26, p[1]+26), fill=BG, outline=OCHRE, width=3)
    text(p[0], p[1], f'{i+1:02}', 24, INK, True, anchor='mm')
    text(1590, y, f'{i+1:02}', 27, OCHRE, True); text(1650, y-4, title, 32, bold=True, maxwidth=650)
    for j, s in enumerate(lines): text(1650, y+44+j*36, s, 25, MUTE, maxwidth=650)
y = 470+len(rows)*142
text(1590, y, 'NOT PRINTED', 27, OCHRE, True)
for j, s in enumerate(['2 × 28BYJ-48 with ULN2003 driver', '4 × M3 screw and nut', f'{2*S["num_oring"]:g} × O-ring, {S["dia_oring_cord"]:g} mm cord',
                       'sanding paper, glass slides']):
    text(1590, y+44+j*36, s, 25, MUTE, maxwidth=710)
footer(['Seven STL files. Print the shaft adapter twice and the washer four times.',
        'The cutting ruler\'s bars are 0.5 mm smaller than the strips all around: the pencil\'s line makes up for it.'],
       'CAD RENDER OF THE PRINT LAYOUT, SEEN FROM BEHIND  /  ILLUSTRATIVE COLORS  /  v3.1.0 IS NOT PRINTED YET  /  MM')
save('images/06_print.png')

# A review sheet of everything to upload, in upload order.
files = [(p, p.stem) for p in sorted((OUT/'images').glob('*.png'))]
sheet = Image.new('RGB', (1600, 320*-(-len(files)//4)), BG); sd = ImageDraw.Draw(sheet)
for i, (path, name) in enumerate(files):
    p = ImageOps.exif_transpose(Image.open(path)).convert('RGB'); p.thumbnail((380, 285), Image.Resampling.LANCZOS)
    x = (i % 4)*400; y = (i//4)*320
    sheet.paste(p, (x+(400-p.width)//2, y+10))
    sd.text((x+12, y+298), f'{i+1}  {name}', font=font(16), fill=INK)
sheet.save(OUT/'contact-sheet.png', optimize=True, compress_level=9, icc_profile=ICC)
print('FONT', FAMILY)
