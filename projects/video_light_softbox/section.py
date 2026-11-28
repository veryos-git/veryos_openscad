# Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
"""Draws section.png: the cut through a light clamp, seen along the light, one colour per part.

usage: python3 section.py [script.scad]   (default: the newest video_light_softbox_veryos_V*.scad here)
needs: OpenSCAD with an X display (sandbox off), Pillow, DejaVu Sans Mono
"""
import subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
SCRIPT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else max(
    HERE.glob("video_light_softbox_veryos_V*.scad"), key=lambda p: int(p.stem.rsplit("V", 1)[1]))
# x here is the frame's y, y its z. The screw is turned half a turn so that its thread
# lies in the clamp's at this depth.
SCAD = """
include <%s>
part = "none";
show = "labels";
module cut() intersection() {
    projection(cut = true) rotate([0, -90, -90]) translate([-clamp_x, 0, 0]) children();
    translate([-200, -34]) square([400, 200]);
}
module covers() union() { for (i = [0, 1]) let(f = side_faces[i]) rotate([0, 0, f[0]]) face_frame(f[2])
    translate([0, 0, -wallcover_thickness]) wallcover(f[1], true, true); }
if (show == "frame_top") cut() frame_top();
if (show == "covers") cut() covers();
if (show == "light_clamp") cut() translate([clamp_x, 0, 0]) light_clamp();
if (show == "screw") cut() translate([clamp_x, 0, light_height + screw_length + screw_head_height])
    rotate([180, 0, 180]) screw();
if (show == "light") cut() translate([0, 0, light_height / 2]) cube([128, 80, light_height], center = true);
module label(name, at, to, anchor = "left") if (show == "labels") {
    translate(at) text(name, size = 3.6, font = "DejaVu Sans Mono:style=Bold", halign = anchor, valign = "center");
    hull() for (p = [at + [anchor == "left" ? -1 : 1, 0], to]) translate(p) circle(0.2, $fn = 8);
}
top = cavity_h + clamp_roof;
label("light_clamp", [66, top - 5], [50, top - 8]);
label("screw", [14, top + 11], [8, top + 10]);
label("thread", [-64, top + 5], [-6.5, top - 9], "right");
label("foot", [66, 12], [50, 5]);
label("rail", [66, 3], [51, -2.5]);
label("hook", [66, -7], [52, -7]);
label("frame_top", [-64, -3], [-45, -3], "right");
label("wallcover_big", [-64, -24], [-58, -24], "right");
if (show == "light_name") translate([0, light_height / 2]) text("light", size = 3.6,
    font = "DejaVu Sans Mono:style=Bold", halign = "center", valign = "center");
"""
LAYERS = [("frame_top", "#5C6163"), ("covers", "#B9B4A6"), ("light", "#151B1D"), ("light_clamp", "#3F7CAC"),
          ("screw", "#E8910C"), ("labels", "#151B1D"), ("light_name", "#F4EFE3")]


def mask(folder, layer):
    """Where one layer of the picture is drawn."""
    png = Path(folder) / f"{layer}.png"
    run = subprocess.run(["openscad", "--imgsize=3000,1900", "--projection=ortho", "--camera=0,22,0,0,0,0,360",
                          "-D", f'show="{layer}"', "-o", png, Path(folder) / "section.scad"],
                         capture_output=True, text=True)
    if run.returncode or not png.stat().st_size:
        sys.exit(f"{layer}:\n{run.stderr[-1500:]}")
    image = Image.open(png).convert("RGB")
    background = Image.new("RGB", image.size, image.getpixel((0, 0)))
    return ImageChops.difference(image, background).convert("L").point(lambda v: 255 if v else 0)


with tempfile.TemporaryDirectory() as folder:
    (Path(folder) / "section.scad").write_text(SCAD % SCRIPT)
    with ThreadPoolExecutor(len(LAYERS)) as pool:
        masks = list(pool.map(lambda layer: mask(folder, layer[0]), LAYERS))
sheet = Image.new("RGB", masks[0].size, "#F4EFE3")
boxes = []
for (name, colour), layer in zip(LAYERS, masks):
    sheet.paste(colour, mask=layer)
    boxes.append(layer.getbbox())
box = (min(b[0] for b in boxes) - 40, min(b[1] for b in boxes) - 40, max(b[2] for b in boxes) + 40, max(b[3] for b in boxes) + 40)
sheet = sheet.crop(box)
sheet.thumbnail((1600, 1600), Image.LANCZOS)
sheet.quantize(64).save(HERE / "section.png", optimize=True)
print(HERE / "section.png", sheet.size, "from", SCRIPT.name)
