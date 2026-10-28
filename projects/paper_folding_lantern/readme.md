# Foldable paper haunted-house lantern

A parametric, one-piece paper lantern for a cutting machine, with a small local
web app that previews the folded lantern and the flat cutting template. The
template is an SVG; the folded model is rendered by OpenSCAD and can be
downloaded as STL.

![Folded lantern preview](preview-folded.png)

The default lantern is a 45 × 45 mm square house with 65 mm walls, a 30 mm
pyramid roof and a **generic four-pane window on every side**. The flat net is
**186 × 166 mm**, so it fits on A4 at 100 % scale. All dimensions are in
millimetres. The bat and spiderweb windows from the inspiration are included as
optional `window_style` choices.

## What makes the template special

- **One connected sheet.** The net contains a floor, four walls, four roof
  faces, a hanger tab, a wall glue tab, three bottom flaps and four roof seam
  tabs. There is nothing to assemble from loose parts.
- **Cut-out fold lines.** Every fold is marked with a dashed line and the dashes
  are cut as thin slits. The small paper bridges between the slits keep the net
  connected while making the folds easy and accurate. There are no printed
  score guides that a cutter would ignore.
- **One generic window per side.** Every wall gets an arched four-pane window
  with a paper cross mullion by default. The `mixed`, `bat`, `web` and `spider`
  styles are optional interpretations of the inspiration; the roof faces keep
  their bat and spider cutouts.
- **A real hanger.** The top of the pyramid has a square cap and a vertical tab
  with a round hanging hole.
- **VeryOS engraved.** A dashed engraving of the VeryOS mark is cut into the
  floor. Because the outline is broken into dashes, the logo remains attached
  and does not fall out. It can project a faint mark when a light is inside.

![Cutting template preview](preview-template.png)

## Run the web app

Requirements:

- **Node 18 or newer** (Node 22 is used for development)
- **OpenSCAD 2021 or newer** on your `PATH`

No packages, CDN assets, API keys or network access are needed. From this
project directory:

```sh
node server.js
```

Open **http://127.0.0.1:8055**. The server binds to loopback only. To use a
different port:

```sh
PORT=8060 node server.js
```

The app shows the folded model rendered from the real OpenSCAD mesh and the
cutting template generated from the same source. The controls, defaults and
ranges are read from [paper_folding_lantern.scad](paper_folding_lantern.scad);
the browser does not keep a second copy of the geometry.

- **Folded lantern** — drag to rotate, scroll to zoom. With the canvas focused,
  the arrow keys rotate and `+`/`-` zoom. **Reset view** restores the camera.
- **Cutting template** — cream paper, dark cutouts and orange perforated fold
  lines. The **Show fold lines** checkbox hides the orange overlay; the slits
  are still part of the cut SVG.
- **Download SVG** saves the current flat cutting file. **Download 3D model**
  saves the folded mesh as STL. Both are disabled while the preview is out of
  date.
- **Reset settings** restores every OpenSCAD default.

The cursor and controls update automatically, but OpenSCAD is a real external
process: a full update takes a few seconds.

## Fold and glue

1. **Cut.** Import the SVG at 100 % scale in millimetres. Cut the outline, the
   window and roof cutouts, and the dashed fold slits. Keep the bridges between
   the slits; they hold the net together. The logo on the floor is also a set of
   dashed slits, not a loose insert.
2. **Pre-fold.** Gently fold every perforated line in both directions. The floor
   fold is the line between wall 1 and the square floor. The three other bottom
   lines are the bottom flaps. The four eave lines and the roof seam lines make
   the pyramid. The short lines at the top are the cap and hanger folds.
3. **Floor.** Fold the floor under wall 1 so it sits flat. Fold the bottom flaps
   of walls 0, 2 and 3 inward and glue them on top of the floor. The flaps are
   inset from the corners so they do not fight each other.
4. **Walls.** Fold the four walls up around the floor. The tab on the right edge
   of wall 3 folds inside wall 0 and glues there to close the fourth corner. Work
   around the corners and keep the last one open until the others are set.
5. **Roof.** Fold the four roof faces inward at the eaves. Each face has a glue
   tab on its right slant edge; fold it inside and glue it to the neighbouring
   face. The four truncated top edges form a small square opening. Fold the cap
   down over that opening and glue it to the top edges. Finally fold the hanger
   tab up so it stands vertically, with the round hole above the roof.
6. **Light.** Put a small battery-powered LED inside and hang the lantern by the
   tab. The cutouts and the floor engraving let the light out. **Use LEDs only;
   paper lanterns are not suitable for candles or other hot light sources.**

Start with a scrap-paper test to check your cutter’s kerf, the fold slits and the
glue clearance for your cardstock.

## OpenSCAD parameters

Open the `.scad` file in OpenSCAD and use the Customizer, or edit the top-level
parameters. No libraries are required.

| Parameter | Default | Range / options | Purpose |
| --- | ---: | --- | --- |
| `paper_thickness` | 0.3 | 0.1–0.8 | Thickness of the folded 3D model; does not change the SVG |
| `lantern_width` | 45 | 38–60 | Outside width of the square footprint |
| `wall_height` | 65 | 55–100 | Wall height from floor to eaves |
| `roof_height` | 30 | 10–60 | Height of the pyramid above the eaves |
| `window_style` | `generic` | `generic`, `mixed`, `bat`, `web`, `spider`, `arch`, `none` | One arched four-pane window per wall by default; `mixed` alternates bats and webs |
| `window_width` | 27 | 10–45 | Window envelope width |
| `window_height` | 33 | 10–70 | Window envelope height |
| `roof_decoration` | `mixed` | `mixed`, `bat`, `spider`, `none` | Roof cutouts |
| `hanger_width` | 10 | 6–20 | Side of the square roof opening and hanger tab width |
| `hanger_height` | 16 | 8–30 | Height of the vertical hanger tab |
| `hanger_hole` | 4.5 | 2–10 | Diameter of the hanging hole |
| `glue_tab` | 6 | 3–10 | Width of the wall tab, bottom flaps and roof seam tabs |
| `fold_slit_width` | 0.45 | 0.2–0.8 | Width of each fold slit; adjust for your cutter |
| `fold_dash_length` | 2.6 | 1–5 | Length of each fold dash |
| `fold_dash_gap` | 2 | 1–5 | Paper bridge between dashes |

`output` is internal: `flat` for a thin flat STL, `cut` for the 2D SVG/DXF,
`folded` for the assembled model, and `fold_lines` for the orange overlay. The
web app sets it automatically.

Some individually valid settings are incompatible together. The app shows the
OpenSCAD assertion message when, for example, a window would eat through a
corner or a hanger hole would leave too little paper. Increasing the lantern,
wall or roof dimensions also increases the sheet size; the app reports whether
the template still fits A4.

## Export without the web app

Run from this project directory so the logo import resolves:

```sh
# Flat cutting template (the required SVG).
openscad -o lantern.svg -D 'output="cut"' paper_folding_lantern.scad
openscad -o lantern.dxf -D 'output="cut"' paper_folding_lantern.scad

# Folded visualization model.
openscad -o lantern.stl -D 'output="folded"' paper_folding_lantern.scad

# Thin flat solid, useful for an STL-to-vector workflow.
openscad -o lantern_flat.stl -D 'output="flat"' paper_folding_lantern.scad
```

If you run from another directory, pass the logo explicitly:

```sh
openscad -o lantern.svg -D 'output="cut"' \
  -D 'logo_file="/absolute/path/to/veryos_logo.svg"' \
  /absolute/path/to/paper_folding_lantern.scad
```

For GUI export, press **F6 / Render** before exporting. The SVG/DXF contain the
cut slits for every fold. The orange guide overlay exists only in the app and in
the `fold_lines` debug output; it is never part of the downloaded cut file.

### Notes on the exports

- The **SVG/DXF are the authoritative cutting files.** They use millimetres and
  the exact net outline, including the perforated folds and the VeryOS engraving.
- The **folded STL is a visualization model**, not a paper-cut file. It uses
  ideal folds and small overlaps at the glue joints so the result looks like a
  finished, glued lantern. It does not model paper bend radius or the thickness
  of glue.
- The **flat STL** is a thin extrusion of the same net and may help an
  STL-to-vector workflow. Preserve the window holes if you convert it.
- Do not scale the template in the cutter software. At the default settings the
  sheet is 186 × 166 mm; verify that size before cutting.

## Verify changes

The tests render the real OpenSCAD model, check the default A4 template, verify
the dashed slits and SVG dimensions, parse the folded mesh, exercise an
alternative style and resized lantern, check a few invalid settings, and test
the API’s validation and same-origin rule.

```sh
npm test
# equivalent:
node --test server_test.js
```

Requirements for the tests are the same as for the app: Node 18+ and OpenSCAD on
`PATH`. A run takes a few seconds because OpenSCAD actually renders the folded
model and the cutting template.

## Limitations

- **No physical cardstock assembly has been tested yet.** The geometry, cut file
  and folded mesh have been verified; cut a scrap-paper test before using good
  paper.
- The roof and floor use ideal folds. Real cardstock has a bend radius, and thick
  paper may need slightly wider glue tabs or a larger hanger opening.
- The fold slit width is a compromise: too narrow and the slits may not cut;
  too wide and the bridges become weak. `fold_slit_width = 0.45 mm` works in the
  default template preview; tune it for your machine and material.
- The generic window is an arched four-pane window. The bat, web, spider and
  plain arch styles are included as alternatives; they are not required by the
  default design.
- The app is a local workshop tool, not a hosted service. It binds to
  `127.0.0.1`, writes only temporary files and keeps no database.

## Files

| File | Purpose |
| --- | --- |
| [paper_folding_lantern.scad](paper_folding_lantern.scad) | Parametric net, folded assembly, fold slits and logo import |
| [server.js](server.js) | Local Node server, OpenSCAD invocation, SVG/mesh API |
| [index.html](index.html), [app.js](app.js) | Web interface and the WebGL folded preview |
| [veryos_logo.svg](veryos_logo.svg) | VeryOS mark, engraved into the floor |
| [server_test.js](server_test.js) | Integration tests against the real OpenSCAD model |
| [image.png](image.png) | Inspiration for the lantern shapes and cutouts |

## License and brand

veryos stands for very open source: share the knowledge, the files and the
improvements openly. The project is licensed under the **GPL**. Every source file
starts with the project copyright line. The VeryOS logo is engraved into the
paper part as a dashed floor mark; no separate loose inlay is needed.

Inspiration: [image.png](image.png).
