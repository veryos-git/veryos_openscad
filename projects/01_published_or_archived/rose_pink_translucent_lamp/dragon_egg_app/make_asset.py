"""Writes what the webapp loads but does not build itself.

    python3 make_asset.py thumbnail   one shaded picture per heightmap in ../Tileable
    python3 make_asset.py part        the base parts from ../pucklight_eggV1.scad

Run it again after adding heightmaps or changing the .scad file.
"""

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

o_path__app = Path(__file__).resolve().parent
o_path__tileable = o_path__app.parent / "Tileable"
o_path__scad = o_path__app.parent / "pucklight_eggV1.scad"
n_scl__thumbnail = 160
a_s_part = ["sockel", "screwin", "clickbase"]


def f_a_a_n_shaded(a_a_n_height):
    """Light from the upper left, as a print looks on a desk, tinted like the filament."""
    a_a_n_dy, a_a_n_dx = np.gradient(a_a_n_height)
    n_steep = 14.0
    a_a_n_light = (-a_a_n_dx * -0.62 + -a_a_n_dy * -0.62) * n_steep + 0.48
    a_a_n_tone = np.clip(a_a_n_light, 0.0, 1.0)[..., None] * 0.72 + a_a_n_height[..., None] * 0.28
    a_n_dark, a_n_light = np.array([70.0, 24.0, 40.0]), np.array([255.0, 214.0, 224.0])
    return (a_n_dark + (a_n_light - a_n_dark) * a_a_n_tone).clip(0, 255).astype(np.uint8)


def f_make_thumbnail():
    a_o_path = sorted(o_path__tileable.glob("*.png"), key=lambda o: int(re.search(r"\((\d+)\)", o.name).group(1)))
    a_n_id = []
    for o_path in a_o_path:
        n_id = int(re.search(r"\((\d+)\)", o_path.name).group(1))
        a_a_n = np.asarray(Image.open(o_path), dtype=np.float32)
        a_a_n = (a_a_n - a_a_n.min()) / max(float(a_a_n.max() - a_a_n.min()), 1.0)
        o_image = Image.fromarray(a_a_n, mode="F").resize((n_scl__thumbnail, n_scl__thumbnail), Image.BOX)
        Image.fromarray(f_a_a_n_shaded(np.asarray(o_image))).save(o_path__app / "thumbnail" / f"{n_id}.jpg", quality=86)
        a_n_id.append(n_id)
    (o_path__app / "thumbnail" / "index.json").write_text(json.dumps(a_n_id) + "\n")
    print(f"{len(a_n_id)} thumbnails")


def f_make_part():
    with tempfile.TemporaryDirectory() as s_path__tmp:
        o_path__echo = Path(s_path__tmp) / "info.echo"
        subprocess.run(["openscad", "-o", str(o_path__echo), "-D", 'part="info"', str(o_path__scad)], check=True)
        s_echo = o_path__echo.read_text()
    s_json = re.search(r'ECHO: "(\{.*\})"', s_echo).group(1)
    (o_path__app / "part" / "lamp.json").write_text(json.dumps(json.loads(s_json), indent=2) + "\n")
    for s_part in a_s_part:
        o_path = o_path__app / "part" / f"{s_part}.stl"
        subprocess.run(
            ["openscad", "-o", str(o_path), "--export-format", "binstl", "-D", f'part="{s_part}"', str(o_path__scad)],
            check=True,
        )
        print(s_part, o_path.stat().st_size // 50, "triangles")


if __name__ == "__main__":
    {"thumbnail": f_make_thumbnail, "part": f_make_part}[sys.argv[1]]()
