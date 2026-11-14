# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
"""Writes what the webapp loads but does not build itself, from ../lichterketteV3.scad:

    part/bulb.json   the neck's and the clip's numbers
    part/clip.stl    the clip, standing on its end as it prints

    python3 make_part.py     (deno task part)

Run it again after changing the .scad file.
"""

import json
import re
import subprocess
import tempfile
from pathlib import Path

o_path__app = Path(__file__).resolve().parent
o_path__scad = o_path__app.parent / "lichterketteV3.scad"

# What the app needs to know of the bulb, by the .scad file's own names.
o_s_scad__by_key = {
    "n_mm__neck_d": "d3",
    "n_mm__neck_scl_z": "h2",
    "n_mm__thread_d": "thread_d",
    "n_mm__thread_taper": "thread_taper",
    "n_mm__thread_pitch": "thread_pitch",
    "n_mm__thread_depth": "thread_depth",
    "n_mm__thread_tip": "0.05 * thread_pitch",
    "n_mm__lead_in": "lead_in",
    "n_mm__clip_scl_z": "clip_length",
    "n_mm__clip_tip_d": "clip_tip_d",
    "n_mm__clip_d": "clip_end_d",
}


def f_o_bulb():
    """Asks the .scad file itself, through a file that includes it."""
    s_echo = ', ", ", '.join(f'"\\"{s_key}\\": ", {s_scad}' for s_key, s_scad in o_s_scad__by_key.items())
    with tempfile.TemporaryDirectory() as s_path__tmp:
        o_path__ask = Path(s_path__tmp) / "ask.scad"
        o_path__echo = Path(s_path__tmp) / "ask.echo"
        o_path__ask.write_text(f'include <{o_path__scad}>\npart = "none";\necho(str("{{", {s_echo}, "}}"));\n')
        subprocess.run(["openscad", "-o", str(o_path__echo), str(o_path__ask)], check=True)
        s_json = re.search(r'ECHO: "(\{.*\})"', o_path__echo.read_text()).group(1)
    return json.loads(s_json)


o_path__part = o_path__app / "part"
o_path__part.mkdir(exist_ok=True)
(o_path__part / "bulb.json").write_text(json.dumps(f_o_bulb(), indent=2) + "\n")
o_path__clip = o_path__part / "clip.stl"
subprocess.run(["openscad", "-o", str(o_path__clip), "--export-format", "binstl", "-D", 'part="clip"', str(o_path__scad)], check=True)
print("clip", o_path__clip.stat().st_size // 50, "triangles")
