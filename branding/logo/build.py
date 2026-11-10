# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
"""Build the VeryOS logo variants from veryos_logo.svg (path is copied, never redrawn)."""
import os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "..", "veryos_logo.svg")
src = open(SRC).read()
W, H = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src).groups())
D = " ".join(re.search(r'\sd="([^"]+)"', src).group(1).split())

OUTLINE = 0.8          # mm, drawn inside the shape so the outer size stays the same
PAD = 0.10 * W         # "padded" files: 10 % of the logo width on every side
PX_PER_MM = 50
COLORS = {"black": "#000000", "white": "#FFFFFF"}

for ink, bg in (("black", "white"), ("white", "black")):
    for style in ("filled", "outline"):
        for back in (bg, None):
            for crop, pad in (("tight", 0), ("padded", PAD)):
                w, h = W + 2 * pad, H + 2 * pad
                name = f"veryos_logo_{ink}_{style}_{'on_' + back if back else 'transparent'}_{crop}"
                if style == "filled":
                    mark = f'<path fill="{COLORS[ink]}" fill-rule="evenodd" d="{D}"/>'
                else:
                    mark = (f'<clipPath id="in"><path clip-rule="evenodd" d="{D}"/></clipPath>'
                            f'<path clip-path="url(#in)" fill="none" stroke="{COLORS[ink]}" '
                            f'stroke-width="{2 * OUTLINE}" d="{D}"/>')
                rect = f'<rect width="{w:.4f}" height="{h:.4f}" fill="{COLORS[back]}"/>\n' if back else ""
                svg = (f'<?xml version="1.0" encoding="UTF-8"?>\n'
                       f'<!-- Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details -->\n'
                       f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.4f}mm" height="{h:.4f}mm" viewBox="0 0 {w:.4f} {h:.4f}">\n'
                       f'<title>VeryOS logo</title>\n{rect}'
                       f'<g transform="translate({pad:.4f} {pad:.4f})">{mark}</g>\n</svg>\n')
                path = os.path.join(HERE, name)
                open(path + ".svg", "w").write(svg)
                # Chrome renders mm at 96 dpi, so the PNG is shot from a copy sized in px
                px = svg.replace(f'width="{w:.4f}mm" height="{h:.4f}mm"',
                                 f'width="{round(w * PX_PER_MM)}" height="{round(h * PX_PER_MM)}"')
                open(path + ".tmp.svg", "w").write(px)
                subprocess.run(["google-chrome", "--headless", "--disable-gpu", "--hide-scrollbars",
                                "--default-background-color=00000000",
                                f"--window-size={round(w * PX_PER_MM)},{round(h * PX_PER_MM)}",
                                f"--screenshot={path}.png", "file://" + path + ".tmp.svg"],
                               check=True, capture_output=True)
                os.remove(path + ".tmp.svg")
                print(name)
