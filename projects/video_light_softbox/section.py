# Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
"""Draws the cuts with names, one colour per part: section.png through a light clamp, seen
along the light, and section_fabric_clamp.png through the fabric clamp on the +y side's lip.

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
COMMON = """
include <%s>
part = "none";
show = "labels";
module label(name, at, to, anchor = "left") if (show == "labels") {
    translate(at) text(name, size = label_size, font = "DejaVu Sans Mono:style=Bold", halign = anchor,
                       valign = "center");
    hull() for (p = [at + [anchor == "left" ? -1 : 1, 0] * label_size / 3.6, to])
        translate(p) circle(label_size / 18, $fn = 8);
}
"""
# x here is the frame's y, y its z. The screw is turned half a turn so that its thread
# lies in the clamp's at this depth.
LIGHT_CLAMP = """
label_size = 3.6;
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
# x here is the lip's u, outwards from the frame's edge, y its v, up from the front face.
FABRIC_CLAMP = """
label_size = 1.3;
module cut() intersection() {
    projection(cut = true) rotate([0, -90, -90]) translate([0, -front_half.y, softbox_depth]) children();
    translate([-20, -9]) square([38, 25]);
}
if (show == "frame_front") cut() frame_front();
if (show == "covers") cut() rotate([0, 0, side_faces[0][0]]) face_frame(side_faces[0][2])
    translate([0, 0, -wallcover_thickness]) wallcover(side_faces[0][1], true, true);
if (show == "fabric_clamp") cut() at_lips() fabric_clamp();
if (show == "thumb_screw") cut() at_lips()
    translate([0, fc_screw, lip_thickness + thumb_screw_length + thumb_head_height]) rotate([180, 0, 0]) thumb_screw();
label("thumb_screw", [21, 14], [11, 12.5]);
label("back jaw", [21, 9.5], [12, 6]);
label("roof", [21, 3], [16.5, 3]);
label("bar", [21, -7], [15, -4.5]);
label("bead", [11, -9.5], [fc_screw + 0.6, -0.3]);
label("slit", [5, -9.5], [3, -2.6]);
label("tongue", [-3, -9.5], [-1, -1.6]);
label("lip", [-12, -1], [5, 1.5], "right");
label("frame_front", [-12, 9], [-7, 4], "right");
label("wallcover_big", [-12, 14.5], [-3.6, 11], "right");
"""
SECTIONS = {
    "section.png": (LIGHT_CLAMP, "0,22,0,0,0,0,360",
                    [("frame_top", "#5C6163"), ("covers", "#B9B4A6"), ("light", "#151B1D"), ("light_clamp", "#3F7CAC"),
                     ("screw", "#E8910C"), ("labels", "#151B1D"), ("light_name", "#F4EFE3")]),
    "section_fabric_clamp.png": (FABRIC_CLAMP, "0,3.5,0,0,0,0,105",
                                 [("frame_front", "#5C6163"), ("covers", "#B9B4A6"), ("fabric_clamp", "#3F7CAC"),
                                  ("thumb_screw", "#E8910C"), ("labels", "#151B1D")]),
}


def mask(folder, camera, layer):
    """Where one layer of the picture is drawn."""
    png = Path(folder) / f"{layer}.png"
    run = subprocess.run(["openscad", "--imgsize=3000,1900", "--projection=ortho", f"--camera={camera}",
                          "-D", f'show="{layer}"', "-o", png, Path(folder) / "section.scad"],
                         capture_output=True, text=True)
    if run.returncode or not png.stat().st_size:
        sys.exit(f"{layer}:\n{run.stderr[-1500:]}")
    image = Image.open(png).convert("RGB")
    background = Image.new("RGB", image.size, image.getpixel((0, 0)))
    return ImageChops.difference(image, background).convert("L").point(lambda v: 255 if v else 0)


for name, (scad, camera, layers) in SECTIONS.items():
    with tempfile.TemporaryDirectory() as folder:
        (Path(folder) / "section.scad").write_text(COMMON % SCRIPT + scad)
        with ThreadPoolExecutor(len(layers)) as pool:
            masks = list(pool.map(lambda layer: mask(folder, camera, layer[0]), layers))
    sheet = Image.new("RGB", masks[0].size, "#F4EFE3")
    boxes = []
    for (layer, colour), drawn in zip(layers, masks):
        sheet.paste(colour, mask=drawn)
        boxes.append(drawn.getbbox())
    box = (min(b[0] for b in boxes) - 40, min(b[1] for b in boxes) - 40, max(b[2] for b in boxes) + 40,
           max(b[3] for b in boxes) + 40)
    sheet = sheet.crop(box)
    sheet.thumbnail((1600, 1600), Image.LANCZOS)
    sheet.quantize(64).save(HERE / name, optimize=True)
    print(HERE / name, sheet.size, "from", SCRIPT.name)
