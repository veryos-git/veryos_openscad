# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
# Makes the project moon_light of the webapp: the Moon as it looks in the night sky, as a
# lamp. See ../mathematical/projects/moon_light/readme.md. A project that already exists
# stays as it is; delete its project.json to make it again.
#
# Run: python3 make_moon_light.py
# Needs numpy, Pillow, tifffile and curl. The download, 59 MB, stays in .gitignored/raw/.

import json
import subprocess
from pathlib import Path

import numpy as np
import tifffile
from PIL import Image

here = Path(__file__).resolve().parent
folder = here.parent / "mathematical" / "projects" / "moon_light"
url = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_4k.tif"
source = here / ".gitignored" / "raw" / "moon_light" / url.rsplit("/", 1)[1]

code = """// The Moon as it looks in the night sky, as a lamp. iChannel0 is its picture, not its height.
//
// A thick wall lets less light through, so the picture is inverted: a dark sea stands
// out, a bright ray stays thin. Light falls exponentially with thickness, so the height
// is a logarithm, not 1 - brightness. gamma and Depth change the contrast.

const float brightest = %.3f; // height 0: the thinnest wall
const float darkest = %.3f;   // height 1: stands out by the full depth

// Turns the Moon's face up, in degrees. Tycho, at -43, leaves the fade at the neck, and
// the lamp stands below the eye, so it looks at you. 0 is the Moon's own north.
const float tilt = 18.0;

// How soft the picture is. A pixel is 0.15 mm at the equator and each step doubles it, so 1
// is about what a 0.42 mm line can draw. 0 is sharper, with twice the overhang: readme.md.
const float blur = 1.0;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec3 p = sphereDir(fragCoord / iResolution.xy);
    float c = cos(radians(tilt));
    float s = sin(radians(tilt));
    vec3 m = vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);

    // The picture's middle, longitude 0, is on the sphere's front. textureLod, because
    // the jump in atan at the back would draw a line with texture.
    vec2 uv = vec2(0.5 + atan(m.x, -m.y) / 6.28318530718, 0.5 + asin(clamp(m.z, -1.0, 1.0)) / 3.14159265359);
    float v = textureLod(iChannel0, uv, blur).r;
    fragColor = vec4(vec3(log(v / brightest) / log(darkest / brightest)), 1.0);
}
"""


def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def lit_picture(grey, brightest, darkest, tilt=18, el=15):
    """An estimate, not a photo: the shader and the app's fade in numpy. brightness = light
    x exp(-1.2 x wall), with the light on the axis, level with the neck's bottom. Left the
    picture as it is, right the lamp."""
    grey = grey.reshape(grey.shape[0] // 2, 2, grey.shape[1] // 2, 2).mean(axis=(1, 3))

    def sample(mx, my, mz):
        rows, columns = grey.shape
        u = 0.5 + np.arctan2(mx, -my) / (2 * np.pi)
        v = 0.5 + np.arcsin(np.clip(mz, -1, 1)) / np.pi
        return grey[np.clip(((1 - v) * rows).astype(int), 0, rows - 1), (u * columns).astype(int) % columns]

    x, z = np.meshgrid(np.linspace(-1, 1, 900), np.linspace(1, -1, 900))
    inside = x ** 2 + z ** 2 < 1
    y = -np.sqrt(np.clip(1 - x ** 2 - z ** 2, 0, 1))
    picture = sample(x, y, z)

    # Seen from el degrees above, then turned up by tilt, as in the shader.
    e, t = np.radians(el), np.radians(tilt)
    py, pz = z * np.sin(e) + y * np.cos(e), z * np.cos(e) - y * np.sin(e)
    lat = np.degrees(np.arcsin(np.clip(pz, -1, 1)))
    height = np.clip(np.log(sample(x, np.cos(t) * py - np.sin(t) * pz, np.sin(t) * py + np.cos(t) * pz) / brightest)
                     / np.log(darkest / brightest), 0, 1)
    fade = smoothstep((lat + 43) / 15) * smoothstep((80 - lat) / 15)
    wall = 0.8 + 2 * fade * height
    # The sphere's centre lies 42 mm above the neck's bottom; radius 50 mm.
    ax, ay, az = 50 * x, 50 * py, 42 + 50 * pz
    distance = np.sqrt(ax ** 2 + ay ** 2 + az ** 2)
    light = np.clip((ax * x + ay * py + az * pz) / distance, 0, 1) / distance ** 2
    lit = light * np.exp(-1.2 * wall)
    lit[lat < -45] = 0
    lit = np.clip(lit / np.percentile(lit[inside & (lat > -20) & (lat < 60)], 99), 0, 1) ** (1 / 2.2)
    return Image.fromarray((np.hstack([picture * inside, lit * inside]) * 255).astype(np.uint8))


def main():
    if (folder / "project.json").exists():
        print("moon_light: the project exists, skipped")
        return
    if not source.exists():
        source.parent.mkdir(parents=True, exist_ok=True)
        part = source.with_name(source.name + ".part")
        subprocess.run(["curl", "-sSL", "--fail", "--retry", "5", "-C", "-", "-o", part, url], check=True)
        part.rename(source)

    # Grey by the app's weights, then each 2 x 2 pixels as one: the app's map is 2048 wide.
    grey = tifffile.imread(source) / 65535 @ np.array([0.299, 0.587, 0.114])
    rows, columns = grey.shape
    grey = grey.reshape(rows // 2, 2, columns // 2, 2).mean(axis=(1, 3))
    darkest, brightest = np.percentile(grey, (0.1, 99.9))
    print(f"moon_light: brightness {darkest:.3f} to {brightest:.3f}")

    folder.mkdir(parents=True, exist_ok=True)
    Image.fromarray((grey * 255 + 0.5).astype(np.uint8)).save(folder / "texture.png", optimize=True)
    lit_picture(grey, brightest, darkest).save(folder / "lit.png", optimize=True)
    # A colour shows what the height does when lit, so the 3D view looks like the lamp.
    stops = [{"t": t, "color": [round(255 * brightest * (darkest / brightest) ** t)] * 3} for t in (0, 0.5, 1)]
    # As the app writes it.
    project = {"template": "texture", "code": code % (brightest, darkest), "scale": 12, "seed": 3, "gamma": 1, "depth": 2,
               "relief_from": -43, "columns": 1440, "stops": stops, "texture": True}
    (folder / "project.json").write_text(json.dumps(project, indent=2) + "\n")


if __name__ == "__main__":
    main()
