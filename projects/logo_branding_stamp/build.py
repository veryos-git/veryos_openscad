# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Logo branding stamp: logo DXFs, machinability analysis, STEP files and checks.

    python3 build.py dxf       write veryos_logo.dxf and tracetrove_logo.dxf into this folder
    python3 build.py analyze   logo dimensions, corners, what an end mill reaches -> analysis_*.png
    python3 build.py step      logo_stampV1*.scad -> .stl (OpenSCAD) and .step (OpenCascade B-Rep)
    python3 build.py check     checks the .stl and .step of both stamps against the DXF and each other
    python3 build.py images    stamp_*.png and overview.png with the parts named (OpenSCAD needs a display)

The logos are never redrawn: the VeryOS DXF is the workspace's veryos_logo.dxf
without its doubled entities, the TraceTrove DXF is region2d() of
tracetrove_logo.scad (logo V3) written as true lines and arcs.

The STEP file is not a converted mesh: step rebuilds the stamp from the
parameters of the .scad and the DXF's lines and arcs as planes, cylinders and
a cone. check compares it with OpenSCAD's mesh.

Needs numpy and Pillow; step and check also need OpenSCAD and
`pip install cadquery-ocp`.
"""
import ast, math, os, re, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VERYOS_SOURCE = os.path.join(HERE, "..", "..", "veryos_logo.dxf")
LOGOS = {"VeryOS": os.path.join(HERE, "veryos_logo.dxf"),
         "TraceTrove": os.path.join(HERE, "tracetrove_logo.dxf")}
STAMPS = ["logo_stampV1", "logo_stampV1_TraceTrove"]


# ---------------------------------------------------------------- lines and arcs
# A segment is a line (x0, y0, x1, y1) or an arc (cx, cy, r, start, sweep) in
# degrees, sweep > 0 counterclockwise.
def is_arc(s):
    return len(s) == 5


def point(s, t):
    """Point of the segment at t = 0 .. 1."""
    if is_arc(s):
        a = math.radians(s[3] + t * s[4])
        return (s[0] + s[2] * math.cos(a), s[1] + s[2] * math.sin(a))
    return (s[0] + t * (s[2] - s[0]), s[1] + t * (s[3] - s[1]))


def direction(s, t):
    """Unit travel direction at t."""
    if is_arc(s):
        a = math.radians(s[3] + t * s[4]) + math.copysign(math.pi / 2, s[4])
        return (math.cos(a), math.sin(a))
    d = (s[2] - s[0], s[3] - s[1])
    n = math.hypot(*d)
    return (d[0] / n, d[1] / n)


def flipped(s):
    return (s[0], s[1], s[2], s[3] + s[4], -s[4]) if is_arc(s) else (s[2], s[3], s[0], s[1])


def part(s, t0, t1):
    """The segment between t0 and t1."""
    return (s[0], s[1], s[2], s[3] + t0 * s[4], (t1 - t0) * s[4]) if is_arc(s) else point(s, t0) + point(s, t1)


def turn(a, b):
    """Degrees the direction jumps from a's end to b's start, > 0 to the left."""
    d0, d1 = direction(a, 1), direction(b, 0)
    return math.degrees(math.atan2(d0[0] * d1[1] - d0[1] * d1[0], d0[0] * d1[0] + d0[1] * d1[1]))


def read_dxf(path):
    """LINE and ARC entities, each once: Onshape's export holds most of them twice."""
    v = [l.strip() for l in open(path, encoding="latin-1")]
    pairs = list(zip(v[0::2], v[1::2]))
    ents, cur = [], None
    for code, val in pairs[pairs.index(("2", "ENTITIES")) + 1:]:
        if code == "0":
            if val == "ENDSEC":
                break
            cur = {0: val}
            ents.append(cur)
        else:
            cur[int(code)] = float(val) if 10 <= int(code) < 60 else val
    segs, seen = [], set()
    for e in ents:
        if e[0] == "LINE":
            s = (e[10], e[20], e[11], e[21])
            key = tuple(sorted([(round(s[0], 6), round(s[1], 6)), (round(s[2], 6), round(s[3], 6))]))
        elif e[0] == "ARC":
            s = (e[10], e[20], e[40], e[50], (e[51] - e[50]) % 360)
            key = tuple(round(x, 6) for x in s)
        else:
            raise SystemExit("unsupported DXF entity " + e[0])
        if key not in seen:
            seen.add(key)
            segs.append(s)
    return segs, len(ents)


def write_dxf(path, segs):
    out = ["0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1009",
           "9", "$INSUNITS", "70", "4", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES"]
    for s in segs:
        if is_arc(s):
            a0, a1 = (s[3], s[3] + s[4]) if s[4] > 0 else (s[3] + s[4], s[3])
            vals = [(10, s[0]), (20, s[1]), (40, s[2]), (50, a0 % 360), (51, a1 % 360)]
        else:
            vals = [(10, s[0]), (20, s[1]), (11, s[2]), (21, s[3])]
        out += ["0", "ARC" if is_arc(s) else "LINE", "8", "logo"]
        for code, x in vals:
            out += [str(code), repr(round(x, 10))]
    open(path, "w").write("\n".join(out + ["0", "ENDSEC", "0", "EOF", ""]))


def tracetrove_segments():
    """region2d() of tracetrove_logo.scad, logo V3, with its numbers."""
    pw = 5
    r, R = pw / 2, 3 * pw
    ro, ri = R + r, R - r
    tip_y = ro * math.sin(math.radians(60)) + (ro * math.cos(math.radians(60)) - R / 2) * math.tan(math.radians(30))
    a_in = math.degrees(math.atan2(R / 2, R / 2 + r))
    outline = [(0, 0, ro, -60, 120), (R, 0, ro, 120, 120)]
    for arc, tip in ((outline[0], tip_y), (outline[1], -tip_y)):      # tangent run-outs to the tips
        other = outline[1] if arc is outline[0] else outline[0]
        outline += [point(arc, 1) + (R / 2, tip), (R / 2, tip) + point(other, 0)]
    window = [(0, 0, ri, a_in - 90, 90), (R / 2 - ri + r, R / 2, ri, 0, -a_in),
              (R / 2 + ri - r, R / 2, ri, 180 + a_in, -a_in), (R, 0, ri, 180 - a_in, 90)]
    return outline + window


def loops(segs, tol=1e-4):
    """Closed loops of directed segments; the outline first and counterclockwise,
    the holes clockwise, so the logo is always on the left."""
    left, out = list(segs), []
    while left:
        loop = [left.pop(0)]
        while math.dist(point(loop[-1], 1), point(loop[0], 0)) > tol or len(loop) < 2:
            end = point(loop[-1], 1)
            for i, s in enumerate(left):
                if math.dist(point(s, 0), end) < tol or math.dist(point(s, 1), end) < tol:
                    loop.append(s if math.dist(point(s, 0), end) < tol else flipped(s))
                    del left[i]
                    break
            else:
                raise SystemExit("open contour at %s" % (end,))
        out.append(loop)
    out.sort(key=lambda l: -abs(area(l)))
    return [l if (area(l) > 0) == (i == 0) else [flipped(s) for s in reversed(l)] for i, l in enumerate(out)]


def polyline(loop, step=0.02):
    """Points along a loop, arcs in steps of at most `step`."""
    pts = []
    for s in loop:
        n = max(1, math.ceil(abs(math.radians(s[4])) * s[2] / step)) if is_arc(s) else 1
        pts += [point(s, i / n) for i in range(n)]
    return pts


def area(loop):
    p = np.array(polyline(loop, 0.005))
    return float(np.sum(p[:, 0] * np.roll(p[:, 1], -1) - np.roll(p[:, 0], -1) * p[:, 1]) / 2)


def bbox(all_loops):
    p = np.array(polyline(all_loops[0], 0.005))
    return p.min(0), p.max(0)


def corners(all_loops):
    """(point, turn) where the direction jumps; turn > 0: the logo has an outer
    corner, turn < 0: an inner one, which a round tool cannot reach."""
    return [(point(b, 0), turn(a, b)) for loop in all_loops
            for a, b in zip(loop, loop[1:] + loop[:1]) if abs(turn(a, b)) > 0.5]


# ---------------------------------------------------------------- inner corner radius
def offset_curve(s, r):
    """The segment moved r to its right, away from the logo: a line as (point,
    direction), an arc as (centre, radius)."""
    if is_arc(s):
        return (s[0], s[1]), s[2] + math.copysign(r, s[4])
    d = direction(s, 0)
    return (s[0] + r * d[1], s[1] - r * d[0]), d


def crossings(a, b):
    """Points where two offset curves cross."""
    line_a, line_b = isinstance(a[1], tuple), isinstance(b[1], tuple)
    if line_a and line_b:
        (p, d), (q, e) = a, b
        t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / (d[0] * e[1] - d[1] * e[0])
        return [(p[0] + t * d[0], p[1] + t * d[1])]
    if line_a or line_b:
        (p, d), (c, r) = (a, b) if line_a else (b, a)
        f = (p[0] - c[0], p[1] - c[1])
        half_b = f[0] * d[0] + f[1] * d[1]
        root = math.sqrt(max(0.0, half_b ** 2 - (f[0] ** 2 + f[1] ** 2 - r * r)))
        return [(p[0] + t * d[0], p[1] + t * d[1]) for t in (-half_b - root, -half_b + root)]
    (c0, r0), (c1, r1) = a, b
    dist = math.dist(c0, c1)
    along = (dist * dist + r0 * r0 - r1 * r1) / (2 * dist)
    h = math.sqrt(max(0.0, r0 * r0 - along * along))
    u = ((c1[0] - c0[0]) / dist, (c1[1] - c0[1]) / dist)
    return [(c0[0] + along * u[0] + k * h * u[1], c0[1] + along * u[1] - k * h * u[0]) for k in (-1, 1)]


def foot(s, p):
    """t of the segment's point nearest to p."""
    if is_arc(s):
        return ((math.degrees(math.atan2(p[1] - s[1], p[0] - s[0])) - s[3]) * (1 if s[4] > 0 else -1) % 360) / abs(s[4])
    d = (s[2] - s[0], s[3] - s[1])
    return ((p[0] - s[0]) * d[0] + (p[1] - s[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2)


def rounded(loop, r):
    """The loop with every inner corner of the logo replaced by an arc of radius
    r, tangent to both sides: what an end mill of that radius leaves."""
    n, joins = len(loop), []
    for a, b in zip(loop, loop[1:] + loop[:1]):
        if turn(a, b) > -0.5:
            joins.append(None)
            continue
        corner = point(a, 1)
        c = min(crossings(offset_curve(a, r), offset_curve(b, r)), key=lambda p: math.dist(p, corner))
        ta, tb = foot(a, c), foot(b, c)
        pa, pb = point(a, ta), point(b, tb)
        start = math.degrees(math.atan2(pa[1] - c[1], pa[0] - c[0]))
        sweep = -((start - math.degrees(math.atan2(pb[1] - c[1], pb[0] - c[0]))) % 360)
        joins.append((ta, tb, (c[0], c[1], r, start, sweep)))
    out = []
    for i, s in enumerate(loop):
        t0 = joins[i - 1][1] if joins[i - 1] else 0
        t1 = joins[i][0] if joins[i] else 1
        if not 0 <= t0 < t1 <= 1:
            raise SystemExit("an inner radius of %g does not fit at %s" % (r, point(s, 0)))
        out.append(part(s, t0, t1))
        if joins[i]:
            out.append(joins[i][2])
    return out


# ---------------------------------------------------------------- the .scad's parameters
def scad_params(name):
    """Top level values of a .scad and of the files it includes, later ones win."""
    text = open(os.path.join(HERE, name)).read()
    p = {}
    for inc in re.findall(r"^include <(.+?)>", text, re.M):
        p.update(scad_params(inc))
    for key, val in re.findall(r"^(\w+|\$fn)\s*=\s*([^;]+);", text, re.M):
        try:
            p[key] = ast.literal_eval(val.strip().replace("true", "True").replace("false", "False"))
        except (ValueError, SyntaxError):
            pass                                   # derived values, recomputed in derived()
    return p


def derived(p):
    """The derived values of logo_stampV1.scad."""
    thread = p["mount"] == "thread"
    d = dict(p)
    d["logo_scale"] = p["logo_width"] / p["logo_dxf_size"][0]
    d["hole_diameter"] = p["thread_diameter"] - p["thread_pitch"] if thread else p["bore_diameter"] + p["bore_clearance"]
    d["hole_depth"] = p["thread_depth"] + p["thread_diameter"] / 2 if thread else p["bore_depth"]
    d["hole_point"] = d["hole_diameter"] / 2 / math.tan(math.radians(59)) if thread else 0
    d["neck_diameter"] = (p["thread_diameter"] if thread else p["bore_diameter"]) + 2 * p["neck_wall"]
    d["face_z"] = p["neck_length"] + p["head_thickness"]
    return d


def stamp_loops(p, mirror=None, radius=None):
    """The logo as it lies on the stamp face: scaled, centred, mirrored, inner
    corners rounded."""
    mirror = p["logo_mirror"] if mirror is None else mirror
    radius = p["logo_inner_radius"] if radius is None else radius
    k, (cx, cy), m = p["logo_scale"], p["logo_dxf_center"], -1 if mirror else 1
    segs = []
    for s in read_dxf(os.path.join(HERE, p["logo_dxf"]))[0]:
        if is_arc(s):
            segs.append((m * (s[0] - cx) * k, (s[1] - cy) * k, s[2] * k, s[3] if m > 0 else 180 - s[3], m * s[4]))
        else:
            segs.append((m * (s[0] - cx) * k, (s[1] - cy) * k, m * (s[2] - cx) * k, (s[3] - cy) * k))
    return [rounded(l, radius) if radius > 0 else l for l in loops(segs)]


# ---------------------------------------------------------------- raster analysis
PX = 0.005      # mm per pixel on the stamp


def raster(all_loops, size_mm, scale=1.0, center=(0, 0)):
    """Loops as a boolean image, y up, `scale` times their size and centred."""
    from PIL import Image, ImageDraw
    n = round(size_mm / PX)
    img = Image.new("1", (n, n), 0)
    draw = ImageDraw.Draw(img)
    for i, loop in enumerate(all_loops):
        p = [((x - center[0]) * scale / PX + n / 2, n / 2 - (y - center[1]) * scale / PX)
             for x, y in polyline(loop, 0.002 / scale)]
        draw.polygon(p, fill=1 if i == 0 else 0)
    return np.array(img, dtype=bool)


def disc_sum(mask, radius_mm):
    """Per pixel: how many pixels of mask lie within radius; and the disc's pixel count."""
    n0, n1 = mask.shape
    i = np.minimum(np.arange(n0), n0 - np.arange(n0))[:, None]
    j = np.minimum(np.arange(n1), n1 - np.arange(n1))[None, :]
    k = (i * i + j * j <= (radius_mm / PX) ** 2)
    conv = np.fft.irfft2(np.fft.rfft2(mask.astype(np.float32)) * np.fft.rfft2(k.astype(np.float32)), mask.shape)
    return conv, k.sum()


def opened(mask, radius_mm):
    """What a disc of that radius covers while it stays inside mask."""
    conv, full = disc_sum(mask, radius_mm)
    conv, _ = disc_sum(conv > full - 0.5, radius_mm)
    return conv > 0.5


def widest(test, hi=5.0):
    """Largest diameter for which test(diameter) holds, by bisection."""
    lo = 0.0
    for _ in range(9):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if test(mid) else (lo, mid)
    return lo


def analyze(name, path, widths, tools, head=10.0):
    from PIL import Image, ImageDraw, ImageFont
    ls = loops(read_dxf(path)[0])
    lo, hi = bbox(ls)
    size, center = hi - lo, (lo + hi) / 2
    cs = corners(ls)
    print("\n== %s: %s" % (name, os.path.basename(path)))
    print("loops %d (1 outline, %d holes), %d lines, %d arcs" % (
        len(ls), len(ls) - 1, sum(not is_arc(s) for l in ls for s in l), sum(is_arc(s) for l in ls for s in l)))
    print("size %.4f x %.4f, centre (%.4f, %.4f), area %.3f" % (
        size[0], size[1], center[0], center[1], sum(area(l) for l in ls)))
    for p, t in cs:
        print("  corner (%8.3f, %8.3f)  %s, %5.1f degrees of %s" % (
            p[0], p[1], "outer" if t > 0 else "INNER", 180 - abs(t), "logo" if t > 0 else "gap"))
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 26)
    bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 30)
    cell, pad, top = 560, 24, 150
    sheet = Image.new("RGB", (pad + len(widths) * (cell + pad), top + len(tools) * (cell + 44 + pad)), "#F4EFE3")
    draw = ImageDraw.Draw(sheet)
    draw.text((pad, 16), "%s logo, as its impression reads: what an end mill reaches" % name, font=bold, fill="#151B1D")
    draw.text((pad, 58), "dark: raised logo   light: milled away   red: the tool cannot enter, stays raised",
              font=font, fill="#151B1D")
    for col, width in enumerate(widths):
        scale = width / size[0]
        span = max(head, width, size[1] * scale) + 2.4
        logo = raster(ls, span, scale, center)
        n = logo.shape[0]
        g = (np.arange(n) - n / 2 + 0.5) * PX
        fits = "fits" if max(width, size[1] * scale) <= head - 2 else "DOES NOT FIT"
        # thinnest stroke: the largest disc that, kept inside the logo, still covers 90 % of it
        stroke = widest(lambda d: opened(logo, d / 2).sum() > 0.9 * logo.sum())
        holes = [raster([[flipped(s) for s in reversed(l)]], span, scale, center) for l in ls[1:]]
        hole_d = min(widest(lambda d: (lambda c: (c[0] > c[1] - 0.5).any())(disc_sum(h, d / 2))) for h in holes)
        print("-- logo width %g: %.2f x %.2f, scale %.4f, strokes %.2f, widest disc in a hole %.2f, %s a %g head with 1 clearance" % (
            width, width, size[1] * scale, scale, stroke, hole_d, fits, head))
        draw.text((pad + col * (cell + pad), 104), "logo %.2f x %.2f, strokes %.2f" % (width, size[1] * scale, stroke),
                  font=font, fill="#151B1D")
        for row, tool in enumerate(tools):
            free = ~logo
            reach = opened(free, tool / 2)
            miss = free & ~reach
            retreat = []
            for p, t in cs:
                if t < 0:
                    cx, cy = (p[0] - center[0]) * scale, (p[1] - center[1]) * scale
                    retreat.append(np.hypot(g[None, :] - cx, -g[:, None] - cy)[reach].min())
            print("   tool %.1f (R%.2f): %.3f mm2 not reached = %.1f %% of the logo's area; inner corners filled up to %s" % (
                tool, tool / 2, miss.sum() * PX * PX, 100 * miss.sum() / logo.sum(),
                ", ".join("%.2f" % r for r in retreat)))
            rgb = np.empty(logo.shape + (3,), np.uint8)
            rgb[:] = (244, 239, 227)
            rgb[logo] = (21, 27, 29)
            rgb[miss] = (214, 40, 40)
            c = round(max(width, size[1] * scale) * 1.15 / PX / 2)
            im = Image.fromarray(rgb[n // 2 - c:n // 2 + c, n // 2 - c:n // 2 + c]).resize((cell, cell), Image.LANCZOS)
            x, y = pad + col * (cell + pad), top + row * (cell + 44 + pad)
            sheet.paste(im, (x, y + 40))
            draw.text((x, y), "tool %.1f, corners R%.2f: %.1f %% lost" % (tool, tool / 2, 100 * miss.sum() / logo.sum()),
                      font=font, fill="#151B1D")
    out = os.path.join(HERE, "analysis_%s.png" % name.lower())
    sheet.save(out, optimize=True)
    print("wrote", out)


# ---------------------------------------------------------------- STEP
def step_shape(p):
    """The stamp as a B-Rep solid, built like stamp() in logo_stampV1.scad."""
    from OCP.gp import gp_Pnt, gp_Vec, gp_Ax2, gp_Dir
    from OCP.GC import GC_MakeArcOfCircle
    from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire, BRepBuilderAPI_MakeFace
    from OCP.BRepPrimAPI import BRepPrimAPI_MakePrism, BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakeCone
    from OCP.BRepAlgoAPI import BRepAlgoAPI_Fuse, BRepAlgoAPI_Cut
    from OCP.ShapeUpgrade import ShapeUpgrade_UnifySameDomain

    def wire(loop, z):
        w = BRepBuilderAPI_MakeWire()
        for s in loop:
            a, b = gp_Pnt(*point(s, 0), z), gp_Pnt(*point(s, 1), z)
            if is_arc(s):
                w.Add(BRepBuilderAPI_MakeEdge(GC_MakeArcOfCircle(a, gp_Pnt(*point(s, 0.5), z), b).Value()).Edge())
            else:
                w.Add(BRepBuilderAPI_MakeEdge(a, b).Edge())
        return w.Wire()

    def prism(all_loops, z, height):
        face = BRepBuilderAPI_MakeFace(wire(all_loops[0], z))
        for hole in all_loops[1:]:
            face.Add(wire(hole, z))
        return BRepPrimAPI_MakePrism(face.Face(), gp_Vec(0, 0, height)).Shape()

    def cylinder(origin, axis, diameter, height):
        return BRepPrimAPI_MakeCylinder(gp_Ax2(gp_Pnt(*origin), gp_Dir(*axis)), diameter / 2, height).Shape()

    w, d, c = p["head_width"] / 2, p["head_depth"] / 2, p["orientation_chamfer"]
    side = 1 if p["logo_mirror"] else -1
    head = [(-side * w, d), (-side * w, -d), (side * w, -d)] + (
        [(side * w, d - c), (side * (w - c), d)] if c > 0 else [(side * w, d)])
    head = head if side < 0 else head[::-1]                     # counterclockwise
    head = [a + b for a, b in zip(head, head[1:] + head[:1])]
    solid = prism([head], p["neck_length"], p["head_thickness"])
    solid = BRepAlgoAPI_Fuse(solid, prism(stamp_loops(p), p["face_z"], p["logo_relief"])).Shape()
    if p["neck_length"] > 0:
        solid = BRepAlgoAPI_Fuse(solid, cylinder((0, 0, 0), (0, 0, 1), p["neck_diameter"], p["neck_length"])).Shape()
    solid = BRepAlgoAPI_Cut(solid, cylinder((0, 0, 0), (0, 0, 1), p["hole_diameter"], p["hole_depth"])).Shape()
    if p["hole_point"] > 0:
        cone = BRepPrimAPI_MakeCone(gp_Ax2(gp_Pnt(0, 0, p["hole_depth"]), gp_Dir(0, 0, 1)),
                                    p["hole_diameter"] / 2, 0, p["hole_point"]).Shape()
        solid = BRepAlgoAPI_Cut(solid, cone).Shape()
    if p["mount"] == "bore" and p["set_screw_diameter"] > 0:
        solid = BRepAlgoAPI_Cut(solid, cylinder((0, 0, p["neck_length"] / 2), (0, 1, 0),
                                                p["set_screw_diameter"] - p["set_screw_pitch"],
                                                max(p["head_width"], p["head_depth"]))).Shape()
    unify = ShapeUpgrade_UnifySameDomain(solid, True, True, False)
    unify.Build()
    return unify.Shape()


def write_step(shape, path):
    from OCP.STEPControl import STEPControl_Writer, STEPControl_AsIs
    from OCP.Interface import Interface_Static
    from OCP.IFSelect import IFSelect_RetDone
    from OCP.Message import Message
    Message.DefaultMessenger_s().ChangePrinters().Clear()        # no transfer statistics on the terminal
    writer = STEPControl_Writer()                                # first: it defines the settings below
    Interface_Static.SetCVal_s("write.step.schema", "AP214IS")
    Interface_Static.SetIVal_s("write.surfacecurve.mode", 0)     # 3D lines and circles only, no spline pcurves
    Interface_Static.SetCVal_s("write.step.product.name", os.path.splitext(os.path.basename(path))[0])
    writer.Transfer(shape, STEPControl_AsIs)
    if writer.Write(path) != IFSelect_RetDone:
        raise SystemExit("could not write " + path)


def export(name):
    """name.scad -> name.stl with OpenSCAD and name.step with OpenCascade."""
    subprocess.run(["openscad", "-o", name + ".stl", name + ".scad"], cwd=HERE, check=True, capture_output=True)
    write_step(step_shape(derived(scad_params(name + ".scad"))), os.path.join(HERE, name + ".step"))
    print("wrote %s.stl and %s.step" % (name, name))


# ---------------------------------------------------------------- checks
def read_stl(path):
    t = open(path).read()
    return np.array(re.findall(r"vertex\s+(\S+)\s+(\S+)\s+(\S+)", t), float).reshape(-1, 3, 3)


def mesh_report(tri):
    """Volume, bounding box, open edges and number of separate bodies of a mesh."""
    pts, idx = np.unique(tri.reshape(-1, 3).round(5), axis=0, return_inverse=True)
    f = idx.reshape(-1, 3)
    edges = np.concatenate([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    _, counts = np.unique(np.sort(edges, axis=1), axis=0, return_counts=True)
    _, directed = np.unique(edges, axis=0, return_counts=True)
    parent = np.arange(len(pts))
    for _ in range(64):                                           # bodies: vertices joined by faces
        low = parent[f].min(axis=1)
        new = parent.copy()
        np.minimum.at(new, f.ravel(), np.repeat(low, 3))
        new = new[new]
        if (new == parent).all():
            break
        parent = new
    volume = np.einsum("ij,ij->i", tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum() / 6
    return volume, pts.min(0), pts.max(0), int((counts != 2).sum() + (directed != 1).sum()), len(np.unique(parent))


def step_report(path):
    """What a CAD program finds in the STEP file."""
    from OCP.STEPControl import STEPControl_Reader
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.GProp import GProp_GProps
    from OCP.BRepGProp import BRepGProp
    from OCP.Bnd import Bnd_Box
    from OCP.BRepBndLib import BRepBndLib
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopAbs import TopAbs_SOLID, TopAbs_FACE, TopAbs_EDGE
    from OCP.TopoDS import TopoDS
    from OCP.BRepAdaptor import BRepAdaptor_Surface, BRepAdaptor_Curve
    from OCP.GeomAbs import GeomAbs_Plane, GeomAbs_Cylinder, GeomAbs_Cone, GeomAbs_Line, GeomAbs_Circle
    reader = STEPControl_Reader()
    reader.ReadFile(path)
    reader.TransferRoots()
    shape = reader.OneShape()

    def kinds(what, cast, adaptor, names):
        out, ex = {}, TopExp_Explorer(shape, what)
        while ex.More():
            k = names.get(adaptor(cast(ex.Current())).GetType(), "other")
            out[k] = out.get(k, 0) + 1
            ex.Next()
        return out

    solids, ex = 0, TopExp_Explorer(shape, TopAbs_SOLID)
    while ex.More():
        solids += 1
        ex.Next()
    props, box = GProp_GProps(), Bnd_Box()
    BRepGProp.VolumeProperties_s(shape, props)
    BRepBndLib.AddOptimal_s(shape, box, False, False)
    as_face = getattr(TopoDS, "Face_s", None) or TopoDS.Face     # the name differs between OCP versions
    as_edge = getattr(TopoDS, "Edge_s", None) or TopoDS.Edge
    faces = kinds(TopAbs_FACE, as_face, BRepAdaptor_Surface,
                  {GeomAbs_Plane: "plane", GeomAbs_Cylinder: "cylinder", GeomAbs_Cone: "cone"})
    edges = kinds(TopAbs_EDGE, as_edge, BRepAdaptor_Curve, {GeomAbs_Line: "line", GeomAbs_Circle: "circle"})
    lo, hi = box.CornerMin(), box.CornerMax()
    return (solids, BRepCheck_Analyzer(shape).IsValid(), props.Mass(),
            (lo.X(), lo.Y(), lo.Z(), hi.X(), hi.Y(), hi.Z()), faces, edges)


def check(name):
    from PIL import Image, ImageDraw
    p = derived(scad_params(name + ".scad"))
    tri = read_stl(os.path.join(HERE, name + ".stl"))
    volume, lo, hi, open_edges, bodies = mesh_report(tri)
    top = p["face_z"] + p["logo_relief"]
    ok = True

    def line(label, value, good):
        nonlocal ok
        ok &= bool(good)
        print("  %-32s %s  %s" % (label, value, "ok" if good else "FAILED"))

    print("\n== %s: logo %g wide, %s" % (name, p["logo_width"], p["logo_dxf"]))
    line("mesh closed, one body", "%d open edges, %d bodies" % (open_edges, bodies), open_edges == 0 and bodies == 1)
    line("size", "%.3f x %.3f x %.3f" % tuple(hi - lo),
         np.allclose(hi - lo, [p["head_width"], p["head_depth"], top], atol=1e-3))
    # the logo's top face in the mesh, seen from above
    cap = tri[np.all(np.abs(tri[:, :, 2] - top) < 1e-4, axis=1)][:, :, :2]
    c_lo, c_hi = cap.reshape(-1, 2).min(0), cap.reshape(-1, 2).max(0)
    edge = min(p["head_width"] / 2 - np.abs([c_lo[0], c_hi[0]]).max(), p["head_depth"] / 2 - np.abs([c_lo[1], c_hi[1]]).max())
    height = p["logo_dxf_size"][1] * p["logo_scale"]
    line("logo on the stamp", "%.3f x %.3f, %.2f above the face" % (*(c_hi - c_lo), top - p["face_z"]),
         np.allclose(c_hi - c_lo, [p["logo_width"], height], atol=5e-3))
    line("logo centred", "centre %.3f, %.3f; %.3f to the head's edge" % (*((c_lo + c_hi) / 2 + 0.0), edge),
         np.allclose(c_lo + c_hi, 0, atol=2e-3) and edge >= p["logo_edge_clearance"] - 1e-3)
    u, v = cap[:, 1] - cap[:, 0], cap[:, 2] - cap[:, 0]
    cap_area = np.abs(u[:, 0] * v[:, 1] - u[:, 1] * v[:, 0]).sum() / 2
    drawn = stamp_loops(p, mirror=False, radius=0)                # the DXF, as the impression should read
    dxf_area, step_area = sum(area(l) for l in drawn), sum(area(l) for l in stamp_loops(p))
    line("raised area", "%.3f mm2; lines and arcs of the STEP %.3f; DXF %.3f, +%.1f %% in the inner corners" % (
        cap_area, step_area, dxf_area, 100 * (step_area / dxf_area - 1)), abs(cap_area / step_area - 1) < 3e-3)
    span = max(p["head_width"], p["head_depth"]) + 2
    n = round(span / PX)
    img = Image.new("1", (n, n), 0)
    draw = ImageDraw.Draw(img)
    for t in cap:
        draw.polygon([(x / PX + n / 2, n / 2 - y / PX) for x, y in t], fill=1)
    face = np.array(img, dtype=bool)

    def overlap(a, b):
        return (a & b).sum() / (a | b).sum()

    mirrored, plain = overlap(face[:, ::-1], raster(drawn, span)), overlap(face, raster(drawn, span))
    line("impression reads as the DXF", "overlap %.3f mirrored back, %.3f as it lies on the stamp" % (mirrored, plain),
         mirrored > 0.97 and mirrored >= plain)
    solids, valid, s_volume, box, faces, edges = step_report(os.path.join(HERE, name + ".step"))
    line("STEP: one valid solid", "%d solid, valid: %s" % (solids, valid), solids == 1 and valid)
    line("STEP: faces", ", ".join("%d %s" % (v, k) for k, v in sorted(faces.items())), "other" not in faces)
    line("STEP: edges", ", ".join("%d %s" % (v, k) for k, v in sorted(edges.items())), "other" not in edges)
    line("STEP size", "%.3f x %.3f x %.3f" % (box[3] - box[0], box[4] - box[1], box[5] - box[2]),
         np.allclose([box[3] - box[0], box[4] - box[1], box[5] - box[2]], hi - lo, atol=2e-3))
    line("volume", "STEP %.3f mm3, mesh %.3f; %.2f g of brass" % (s_volume, volume, s_volume * 8.5e-3),
         abs(s_volume / volume - 1) < 2e-3)
    return ok


# ---------------------------------------------------------------- images
# OpenSCAD cameras: looked at point, rotation, distance; orthographic.
FACE_VIEW = (0, 0, 5.2, 50, 0, 20, 48)
MOUNT_VIEW = (0, 0, 5.2, 125, 0, 20, 48)
VIEW_PX = 800


def render(name, cam, out):
    """OpenSCAD's preview of name.scad; needs a display."""
    subprocess.run(["openscad", "-o", out, "--projection=ortho", "--camera=" + ",".join(map(str, cam)),
                    "--imgsize=%d,%d" % (VIEW_PX, VIEW_PX), "--colorscheme=Tomorrow", name + ".scad"],
                   cwd=HERE, check=True, capture_output=True)


def on_screen(pt, cam):
    """Pixel of a point of the model in a render with that camera."""
    x, y, z = pt[0] - cam[0], pt[1] - cam[1], pt[2] - cam[2]
    rx, rz = math.radians(cam[3]), math.radians(cam[5])
    x, y = x * math.cos(rz) + y * math.sin(rz), -x * math.sin(rz) + y * math.cos(rz)
    k = VIEW_PX / 2 / (cam[6] * math.tan(math.radians(22.5 / 2)))
    return (VIEW_PX / 2 + k * x, VIEW_PX / 2 - k * (y * math.cos(rx) + z * math.sin(rx)))


def images():
    """A picture of each stamp and overview.png with the parts and their features named."""
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 24)
    bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 28)
    p = derived(scad_params(STAMPS[0] + ".scad"))
    top, toward = p["face_z"] + p["logo_relief"], (math.sin(math.radians(20)), -math.cos(math.radians(20)))
    neck = (p["neck_diameter"] / 2 * toward[0], p["neck_diameter"] / 2 * toward[1])
    thread = "M%g thread, %g deep" % (p["thread_diameter"], p["thread_depth"]) if p["mount"] == "thread" else "bore"
    # panel: .scad, picture kept beside the overview, title, camera, labels as
    # (text, point on the model, where the text starts)
    panels = [
        (STAMPS[0], "stamp_veryos.png", "stamp, VeryOS logo", FACE_VIEW, [
            ("logo, mirrored, %g high" % p["logo_relief"], (-3.23, 1.55, top), (20, 40)),
            ("cut corner", (4.6, 4.6, p["face_z"]), (600, 40)),
            ("stamp face", (-4.2, -3.6, p["face_z"]), (10, 190)),
            ("head", (-1.5, -p["head_depth"] / 2, p["neck_length"] + 2), (40, 600)),
            ("neck", (neck[0], neck[1], 1.5), (560, 720))]),
        (STAMPS[1], "stamp_tracetrove.png", "stamp, TraceTrove logo", FACE_VIEW, [
            ("logo, mirrored, %g high" % p["logo_relief"], (-2.1, 0, top), (20, 40))]),
        (STAMPS[0], None, "mount side, the same on both", MOUNT_VIEW, [
            ("head", (-1.5, -p["head_depth"] / 2, p["neck_length"] + 3), (40, 40)),
            ("neck", (neck[0], neck[1], 3), (620, 300)),
            ("end face", (-2.7, -1, 0), (40, 650)),
            ("mount hole, " + thread, (0.6, -0.6, 0), (330, 745))]),
    ]
    head, foot = 110, 20
    sheet = Image.new("RGB", (len(panels) * VIEW_PX, head + VIEW_PX + foot), "#F8F8F8")
    draw = ImageDraw.Draw(sheet)
    for i, (name, keep, title, cam, labels) in enumerate(panels):
        shot = os.path.join(HERE, keep or "overview.png")
        render(name, cam, shot)
        sheet.paste(Image.open(shot).convert("RGB"), (i * VIEW_PX, head))
        draw.text((i * VIEW_PX + 24, 20), title, font=bold, fill="#151B1D")
        draw.text((i * VIEW_PX + 24, 62), name + ".scad" if keep else "", font=font, fill="#151B1D")
        for text, pt, at in labels:
            x, y = on_screen(pt, cam)
            x, y, tx, ty = x + i * VIEW_PX, y + head, at[0] + i * VIEW_PX, at[1] + head
            box = draw.textbbox((tx, ty), text, font=font)
            start = (min(max(x, box[0]), box[2]), box[3] + 4 if y > box[3] else box[1] - 4)
            draw.line([start, (x, y)], fill="#151B1D", width=2)
            draw.ellipse([x - 5, y - 5, x + 5, y + 5], fill="#151B1D")
            draw.text((tx, ty), text, font=font, fill="#151B1D")
    sheet.save(os.path.join(HERE, "overview.png"), optimize=True)
    print("wrote overview.png, stamp_veryos.png, stamp_tracetrove.png")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "dxf":
        segs, n = read_dxf(VERYOS_SOURCE)
        write_dxf(LOGOS["VeryOS"], segs)
        print("VeryOS: %d entities in the source, %d without the doubled ones" % (n, len(segs)))
        write_dxf(LOGOS["TraceTrove"], tracetrove_segments())
        print("TraceTrove: %d entities" % len(tracetrove_segments()))
    elif cmd == "analyze":
        analyze("VeryOS", LOGOS["VeryOS"], [5, 8, 12], [1.0, 0.5, 0.3])
        analyze("TraceTrove", LOGOS["TraceTrove"], [5], [1.0, 0.5, 0.3])
    elif cmd == "step":
        for name in STAMPS:
            export(name)
    elif cmd == "images":
        images()
    elif cmd == "check":
        sys.exit(0 if all([check(name) for name in STAMPS]) else 1)
    else:
        print(__doc__)
