# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Writes what the webapp loads but does not build itself.

    python3 make_asset.py part        the base parts of both brands, from ../pucklight_lamp_v2V5*.scad
    python3 make_asset.py thumbnail   one shaded picture per heightmap in .gitignored/tile

Run it again after changing the .scad files or adding heightmaps.
"""

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

o_path__app = Path(__file__).resolve().parent
o_path__tile = o_path__app / ".gitignored" / "tile"
o_s_scad__by_brand = {
    "veryos": o_path__app.parent / "pucklight_lamp_v2V5.scad",
    "tracetrove": o_path__app.parent / "pucklight_lamp_v2V5_TraceTrove.scad",
}
n_scl__thumbnail = 160
a_s_part = ["toppart", "screwin"]

# What the app needs to know of the lamp, by the .scad file's own names.
o_s_scad__by_key = {
    "n_mm__neck_d": "neck_d",
    "n_mm__neck_scl_z": "neck_height",
    "n_mm__neck_wall": "neck_wall",
    "n_mm__thread_pitch": "thread_pitch",
    "n_mm__thread_depth": "thread_depth",
    "n_mm__thread_tip": "0.05 * thread_pitch",
    "n_mm__cup_floor_z": "cup_floor_z",
    "n_mm__top_z": "top_z",
    "n_mm__float_z": "float_h",
    "n_mm__body_d": "body_d",
    "n_mm__flange_d": "2 * flange_r",
    "n_mm__puck_top_z": "lip_height + puck_play + puck_height",
}


def f_o_lamp(o_path__scad):
    """Asks the .scad file itself, through a file that includes it."""
    s_echo = ', ", ", '.join(f'"\\"{s_key}\\": ", {s_scad}' for s_key, s_scad in o_s_scad__by_key.items())
    with tempfile.TemporaryDirectory() as s_path__tmp:
        o_path__ask = Path(s_path__tmp) / "ask.scad"
        o_path__echo = Path(s_path__tmp) / "ask.echo"
        o_path__ask.write_text(f'include <{o_path__scad}>\necho(str("{{", {s_echo}, "}}"));\n')
        subprocess.run(["openscad", "-o", str(o_path__echo), "-D", 'part="none"', str(o_path__ask)], check=True)
        s_json = re.search(r'ECHO: "(\{.*\})"', o_path__echo.read_text()).group(1)
    return json.loads(s_json)


def f_make_part():
    o_lamp = f_o_lamp(o_s_scad__by_brand["veryos"])
    # The brands differ by their logos only: one lamp.json is for both.
    assert o_lamp == f_o_lamp(o_s_scad__by_brand["tracetrove"]), "the two brands' lamps differ"
    (o_path__app / "part" / "lamp.json").write_text(json.dumps(o_lamp, indent=2) + "\n")
    for s_brand, o_path__scad in o_s_scad__by_brand.items():
        for s_part in a_s_part:
            o_path = o_path__app / "part" / s_brand / f"{s_part}.stl"
            subprocess.run(
                ["openscad", "-o", str(o_path), "--export-format", "binstl", "-D", f'part="{s_part}"', str(o_path__scad)],
                check=True,
            )
            print(s_brand, s_part, o_path.stat().st_size // 50, "triangles")


def f_a_a_n_shaded(a_a_n_height):
    """Light from the upper left, as a print looks on a desk, tinted like the filament."""
    import numpy as np

    a_a_n_dy, a_a_n_dx = np.gradient(a_a_n_height)
    n_steep = 14.0
    a_a_n_light = (-a_a_n_dx * -0.62 + -a_a_n_dy * -0.62) * n_steep + 0.48
    a_a_n_tone = np.clip(a_a_n_light, 0.0, 1.0)[..., None] * 0.72 + a_a_n_height[..., None] * 0.28
    a_n_dark, a_n_light = np.array([70.0, 24.0, 40.0]), np.array([255.0, 214.0, 224.0])
    return (a_n_dark + (a_n_light - a_n_dark) * a_a_n_tone).clip(0, 255).astype(np.uint8)


def f_make_thumbnail():
    import numpy as np
    from PIL import Image

    # A pattern's number is the one in its file's name, or its place among the files.
    a_o_path = sorted(o_path__tile.glob("*.png"))
    a_o_pattern = []
    for n_idx, o_path in enumerate(a_o_path):
        o_match = re.search(r"(\d+)\D*$", o_path.stem)
        a_o_pattern.append({"n_id": int(o_match.group(1)) if o_match else n_idx + 1, "s_file": o_path.name})
    assert len({o["n_id"] for o in a_o_pattern}) == len(a_o_pattern), "two heightmaps have the same number"
    a_o_pattern.sort(key=lambda o: o["n_id"])
    (o_path__tile / "thumbnail").mkdir(exist_ok=True)
    for o_pattern in a_o_pattern:
        a_a_n = np.asarray(Image.open(o_path__tile / o_pattern["s_file"]), dtype=np.float32)
        a_a_n = (a_a_n - a_a_n.min()) / max(float(a_a_n.max() - a_a_n.min()), 1.0)
        o_image = Image.fromarray(a_a_n, mode="F").resize((n_scl__thumbnail, n_scl__thumbnail), Image.BOX)
        Image.fromarray(f_a_a_n_shaded(np.asarray(o_image))).save(
            o_path__tile / "thumbnail" / f"{o_pattern['n_id']}.jpg", quality=86
        )
    (o_path__tile / "index.json").write_text(json.dumps(a_o_pattern) + "\n")
    print(f"{len(a_o_pattern)} thumbnails")


if __name__ == "__main__":
    {"thumbnail": f_make_thumbnail, "part": f_make_part}[sys.argv[1]]()
