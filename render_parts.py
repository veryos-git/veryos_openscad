# Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
"""Render the parts of the projects' .scad scripts into <project>/rendered_parts.

One PNG per part, named and captioned as in the script, and overview.png with all of them.
usage: python3 render_parts.py [project ...]   (no argument: every project in PROJECTS)
needs: OpenSCAD with an X display, Pillow, DejaVu Sans Mono
"""
import json, re, subprocess, sys, tempfile, textwrap, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent / "projects"

# project folder: [(scad file, tiles, selector variable = "part"), ...]
# tiles: "a b c" sets the selector to a, b and c; the captions come from its Customizer comment.
#        (name, caption) is the whole model, (name, caption, {variable: value}) sets variables,
#        (name, caption, "module();") calls one module of the script.
PROJECTS = {
    "28byj_minimal_turntable": [("28byj_minimal_turntableV2.scad", "assembly base lid platform")],
    "ball_and_socket_joint_ball_head": [
        ("ball_and_socket_joint_ball_headV3.scad", "assembly ball socket screw")],
    "ball_socket_bracket": [("ball_socket_bracket.scad", "assembly ball socket screw")],
    "basic_fdm_printable_articulation_link": [
        ("articulated_chain.scad", [("chain", "Chain links: ring, foot and loop")]),
        ("articulation_cutter.scad", [
            ("demo", "Test bar with the joints cut", {"part": "demo"}),
            ("cutter", "Cutter, subtracted from a model", {"part": "cutter"}),
            ("keep", "Box minus the cutter", {"part": "keep"})])],
    "decorative_pillars": [("decorative_pillarsV1.scad",
        [("grid", "Shafts in rows, orders in columns", {"view": "grid"})] + [
        (f"{shaft}_{order}", f"shaft = {shaft}, order = {order}",
         {"view": "single", "shaft": shaft, "order": order})
        for shaft, order in zip("plain fluted reeded twisted lattice".split(),
                                "tuscan ionic corinthian egyptian romanesque".split())])],
    "door_knob_generator": [
        ("door_knob.scad", [
            ("knob", "Finished knob: body minus cutter", {"part": "knob"}),
            ("body", "Solid body", {"part": "body"}),
            ("cutter", "Screw hole with its slots, as a solid", {"part": "cutter"}),
            ("section", "Knob cut in half", {"part": "section"})]),
        ("door_knob_decorative.scad", [
            ("knob_decorative", "Finished knob with a decorated head", {"part": "knob"})])],
    "esp32_unofficial": [("esp32_unofficial_enclosureV1.scad", "assembly base lid screw")],
    "finger_claws": [("finger_clawsV3.scad", "assembly sleeve claw")],
    "lichterkette": [("lichterketteV3.scad", "assembly section bulb clip")],
    "logo_branding_stamp": [("logo_stampV1.scad", [
        ("stamp", "Stamp, the mirrored logo on its face")])],
    "OMM_open_microscope_motorization/enclosure": [("omm_enclosureV7.scad", "assembly base lid")],
    "OMM_open_microscope_motorization/xy_table": [("omm_xy_table_v3p0p2.scad",
        "assembly table y_slider x_slider slide_holder motor_shaft_adapter washer cutting_ruler")],
    "papercut_fold_house2": [("papercut_fold_house2_windows_V3.scad", "folded flat", "output")],
    "paper_folding_haunted_house": [("paper_folding_haunted_house.scad", "assembled flat", "output")],
    "paper_folding_lantern": [("paper_folding_lantern.scad", "folded flat", "output")],
    "published_christmas_star": [("star.scad", [
        ("star", "One star (grid_count = 1)", {"grid_count": 1})])],
    "pucklight_lamp_v2": [("pucklight_lamp_v2V5.scad", "assembly lampshade toppart screwin slide_test")],
    "pucklight_sphere": [("pucklight_sphereV3.scad",
        "assembly sphere vase_sphere sockel screwin clickbase")],
    "rechargable_motor_power_kit_turntable": [
        ("rechargable_motor_power_kit_turntableV6.scad",
         "assembly open base platform worm bracket motor_bracket screw cap")],
    "RGBW_pucklight_holder": [("RGBW_pucklight_holderV4.scad", "assembly toppart bottom_screw clickbase")],
    "RGBW_pucklight_holder_ringclick": [
        ("RGBW_pucklight_holder_ringclickV8.scad", "assembly toppart screwin slide_test")],
    "RGBW_pucklight_lantern3": [
        ("RGBW_pucklight_lantern3V8_simple.scad", "assembly frame roof screwin clickbase window")],
    "ring_sizer2": [("ring_sizer2.scad", [("sizer", "Disk with the measuring rings")])],
    "softbox_smallrig_40W": [("softbox_smallrig_40WV1.scad",
        "assembly frame_top frame_front light_clamp screw thumb_screw wallcover_big wallcover_small")],
    "veryos_logo_cube": [("V2/veryos_logo_cubeV2.scad", [
        ("cube", "Logo from the front and from the side")])],
    "vorhangstangeschrankadapter": [("vorhangstangeschrankadapter.scad", [
        ("holder", "Rod holder, two identical ones are needed")])],
    "wind_spinner_project": [("wind_spinner.scad", [
        ("spinner", "Rings, twisted by hand after printing", "spinner();"),
        ("rod", "Rod through the spinner's hooks", "rod();")])],
}

# These show several parts in the script's colours: OpenSCAD preview. Parts get a full render.
PREVIEW = {"assembly", "assembled", "folded", "grid", "open"}
# OpenSCAD looks from the front right, 35 degrees down. Tiles that hide their shape from there
# get another camera rotation x, y, z.
CAMERA = {
    ("ball_and_socket_joint_ball_head", "ball"): "55,0,205",
    ("ball_and_socket_joint_ball_head", "socket"): "55,0,205",
    ("esp32_unofficial", "screw"): "55,0,115",
    ("papercut_fold_house2", "flat"): "0,0,0",
    ("paper_folding_haunted_house", "flat"): "0,0,0",
    ("paper_folding_lantern", "flat"): "0,0,0",
    ("rechargable_motor_power_kit_turntable", "open"): "45,0,160",
    ("rechargable_motor_power_kit_turntable", "screw"): "55,0,115",
    ("softbox_smallrig_40W", "screw"): "55,0,115",
    ("softbox_smallrig_40W", "thumb_screw"): "55,0,115",
    ("veryos_logo_cube", "cube"): "75,0,45",
}
IVORY, GRAPHITE, GREY, LINE = "#F4EFE3", "#151B1D", "#5C6163", "#D8D0BC"


def font(size, bold=False):
    return ImageFont.truetype("DejaVuSansMono-Bold.ttf" if bold else "DejaVuSansMono.ttf", round(size))


def tiles(project):
    """(scad path, name, caption, how to select it) of every tile of a project."""
    for scad, spec, *selector in PROJECTS[project]:
        path, selector = ROOT / project / scad, (selector or ["part"])[0]
        if isinstance(spec, str):
            options = re.search(rf"^{selector}\s*=.*//\s*\[(.*)\]", path.read_text(), re.M)[1]
            captions = dict((option.strip().split(":", 1) + [""])[:2] for option in options.split(","))
            spec = [(name, captions[name], {selector: name}) for name in spec.split()]
        for name, caption, *how in spec:
            yield path, name, caption, (how or [{}])[0]


def render(project, path, name, how, folder):
    """The part on an ivory background, cropped to its outline."""
    png = Path(folder) / f"{path.stem}_{name}.png"
    camera = CAMERA.get((project, name), "55,0,25")
    args = ["openscad", "--autocenter", "--viewall", "--imgsize=2400,1800", f"--camera=0,0,0,{camera},0"]
    # before -o: --render would take a file name after it as its value
    args += ["-o", png] if name in PREVIEW else ["--render", "-o", png]
    if isinstance(how, str):
        wrapper = png.with_suffix(".scad")
        wrapper.write_text(f"use <{path}>\n{how}\n")
        path = wrapper
    else:
        for variable, value in how.items():
            args += ["-D", f"{variable}={json.dumps(value)}"]
    start = time.time()
    run = subprocess.run(args + [path], capture_output=True, text=True)
    if run.returncode or not png.stat().st_size:
        raise RuntimeError(f"{path.name} {name}:\n{run.stderr[-2000:]}")
    print(f"{time.time() - start:6.0f} s  {path.name} {name}", flush=True)
    image = Image.open(png).convert("RGB")
    background = Image.new("RGB", image.size, image.getpixel((0, 0)))
    r, g, b = ImageChops.difference(image, background).split()
    part = ImageChops.lighter(ImageChops.lighter(r, g), b).point(lambda v: 255 if v else 0)
    image.paste(IVORY, mask=ImageChops.invert(part))
    return image.crop(part.getbbox())


def tile(image, name, caption, width, height, size):
    """The picture fitted into width x height, its name and caption below."""
    small = font(0.62 * size)
    lines = textwrap.wrap(caption, int((width - size) / small.getlength("x")))[:2]
    out = Image.new("RGB", (width, height + round(4.4 * size)), IVORY)
    picture = image.copy()
    picture.thumbnail((width - 2 * size, height - size), Image.LANCZOS)
    out.paste(picture, ((width - picture.width) // 2, size + (height - size - picture.height) // 2))
    draw = ImageDraw.Draw(out)
    draw.text((width / 2, height + 0.9 * size), name, GRAPHITE, font(size, True), anchor="mm")
    draw.multiline_text((width / 2, height + 1.8 * size), "\n".join(lines), GREY, small,
                        anchor="ma", align="center")
    return out


def overview(project, pictures):
    """All tiles of a project in a grid under its name."""
    width, height, size, gap = 640, 480, 28, 16
    count = len(pictures)
    columns = count if count <= 4 else min(4, -(-count // 2))
    cells = [tile(image, name, caption, width, height, size) for name, caption, image in pictures]
    title = project
    scads = ", ".join(scad for scad, *_ in PROJECTS[project]) + "  |  CAD renders, each scaled to fit"
    head = 5 * size
    sheet = Image.new("RGB", (max(gap + columns * (width + gap),
                                  2 * gap + round(max(font(1.4 * size, True).getlength(title),
                                                      font(0.7 * size).getlength(scads)))),
                              head + -(-count // columns) * (cells[0].height + gap)), IVORY)
    draw = ImageDraw.Draw(sheet)
    draw.text((gap, 1.6 * size), title, GRAPHITE, font(1.4 * size, True), anchor="lm")
    draw.text((gap, 3.4 * size), scads, GREY, font(0.7 * size), anchor="lm")
    for index, cell in enumerate(cells):
        x = gap + index % columns * (width + gap)
        y = head + index // columns * (cell.height + gap)
        sheet.paste(cell, (x, y))
        draw.rectangle([x, y, x + width - 1, y + cell.height - 1], outline=LINE, width=2)
    return sheet


projects = sys.argv[1:] or list(PROJECTS)
jobs = [(project, *job) for project in projects for job in tiles(project)]
with tempfile.TemporaryDirectory() as folder, ThreadPoolExecutor(6) as pool:
    images = list(pool.map(lambda job: render(job[0], job[1], job[2], job[4], folder), jobs))
for project in projects:
    out = ROOT / project / "rendered_parts"
    out.mkdir(exist_ok=True)
    for old in out.glob("*.png"):
        old.unlink()
    pictures = [(job[2], job[3], image) for job, image in zip(jobs, images) if job[0] == project]
    for name, caption, image in pictures:
        tile(image, name, caption, 1200, 900, 44).quantize(256).save(out / f"{name}.png", optimize=True)
    overview(project, pictures).quantize(256).save(out / "overview.png", optimize=True)
    print(out)
