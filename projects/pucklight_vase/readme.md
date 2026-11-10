# Pucklight vase

Webapp: a script in an editor places the corners of each layer, and the app puts them on the thread of the pucklight sphere, so the vase screws into the same sockel. Keeps its scripts in named projects. Downloads `.stl`, a solid for a slicer's vase mode. Original description: `readme_hgc.md`.

![the app](preview.png)

![the examples, to scale](examples.png)

| Start | |
|---|---|
| `deno task start` in this folder, then http://localhost:8766 | everything; reachable from this computer only |
| Open `index.html` in a browser | no Deno needed, no projects, the rest works |

The editor comes from the internet; without it a plain text box replaces it.

| File | What |
|---|---|
| `index.html` | layout |
| `app.js` | editor, 3D view, projects, download |
| `vase_mesh.js` | the thread, the collar and a script's layers as one mesh; `.stl` |
| `examples.js` | the scripts the editor offers |
| `server.js` | serves the app and keeps the projects |
| `deno.json` | the `start` task |
| `projects/` | the projects, for git to track: `<name>/script.js` |
| `test_vase_mesh.js` | `node test_vase_mesh.js`; needs `openscad` |
| `stlsculpter/` | inspiration, not in git: a clone of github.com/jonasfrey/stlsculpter |

## The lamp

| Part | From |
|---|---|
| Vase | this app |
| Sockel, screwin, click base | `../pucklight_sphere/pucklight_sphereV3.scad`, `part = "sockel"`, `"screwin"`, `"clickbase"` |

A vase and V3's spheres fit the same sockel.

## Projects

| | Control | On disk |
|---|---|---|
| Create | new: a copy of what is in the editor, under a new name | `projects/<name>/script.js` |
| Read | the project list; the address `#<name>` opens it again after a reload | |
| Update | save; a `*` in the list means unsaved | `script.js` |
| Update | rename | the folder moves |
| Delete | delete, asks first | the folder goes |

- A project holds its script, as it is in the editor. Other files in its folder, such as a `.3mf`, stay.
- example puts an example's script into the editor: in a project that is a change to it, to save, or to keep as a new project with new.
- Without a project, save asks for a name.
- A name has letters, digits, spaces, `_` and `-`, and is the folder's name.
- Opening another project or example, or closing the page, with unsaved changes asks first.
- API: `GET /api/projects`, and `GET`, `POST`, `PUT`, `PATCH`, `DELETE /api/projects/<name>`, the script as `{"code": ...}`.
- The server writes to `projects/` only, listens on localhost only, and refuses requests from other web pages.

## Script

The editor holds the body of a function: it gets `o_thread` and returns `{n_its_layer, n_its_corner, f_o_p}`, with `n_height_dome` for a dome on top.

| Name | Is |
|---|---|
| `n_its_layer` | layers above the thread, from 1 |
| `n_its_corner` | corners of each layer, from 3 |
| `f_o_p(n_it_layer_nor, n_it_corner_nor, n_it_layer, n_it_corner)` | the callback, called for each corner of each layer; returns `{n_x, n_y, n_z}` in mm |
| `n_it_layer`, `n_it_layer_nor` | 1 to `n_its_layer`, and that divided by `n_its_layer`: 1 on the top layer |
| `n_it_corner`, `n_it_corner_nor` | 0 to `n_its_corner - 1`, and that divided by `n_its_corner` |
| `o_thread.n_radius`, `o_thread.n_z` | 33.5 and 6.6: the top ring of what is fixed, as it were layer 0 |
| `n_height_dome` | optional: the app closes the last layer with a dome this high, in mm; 0 or left out, with a flat face |
| `n_overhang_dome` | optional, 60: how far the dome's wall may lean from vertical, in degrees, above 0 and below 90 |

- z = 0 is the print bed. Every `n_z` must be `o_thread.n_z` or more: below is the sockel.
- The app joins the top ring to layer 1 with straight walls. Start on the ring, as `template`, or higher, which makes a cone, as `four_pillars`.
- The two may differ in their number of points: 180 on the ring, 12 in `low_poly`.
- Corners may run either way around the axis and start anywhere; all layers the same way.
- At most 2 000 000 points.
- The last layer is closed with a flat face, which vase mode leaves open, or with a dome.
- Dome: the last layer shrinks towards its centre along an ellipse, so its pattern runs on to the tip. A single wall cannot lie flat: where it leans `n_overhang_dome`, the dome goes on as a straight cone. Lower is safer and more pointed.
- The dome starts upright: a shape that ends upright joins it without a crease.
- A dome lower than its cone alone, the last layer's widest radius / tan(`n_overhang_dome`), is that cone, and steeper than asked: the status shows it.
- `egg` closes by its own formula instead, so a pattern can change all the way up.
- A mistake shows in the status and, with its line, in the editor; the last good vase stays.
- A new example: add an entry to `examples.js`.

## What is fixed

Gold in the view. `f_o_p()` is not called for it.

| Part | z | Is |
|---|---|---|
| Thread | 0 to 4.8 | V3's `vase_sphere`: Ø67, 2 mm pitch, 45° flanks, 180 columns, a row every 0.1 mm |
| Collar | 4.8 to 6.6 | cylinder Ø67; the ribs in the sockel's cup end at 6.19, so a script cannot reach them |

## Examples

`template` explains the script. `egg` is a preset to put a pattern on. The others are stlsculpter's, with their formulas and names: the radius starts on the thread's 33.5 instead of `n_radius_base`, or on a cone, and z on `o_thread.n_z`.

| Example | stlsculpter's | Layers × corners | Triangles | High × wide | Steepest wall |
|---|---|---|---|---|---|
| `template` | `template.js`, changed, with a dome | 120 × 180 | 66960 | 141.6 × 105.2 | 60° at z = 131: its dome |
| `egg` | none | 160 × 180 | 75600 | 128.3 × 96.0 | 60° at z = 124: its cone |
| `exponential_twist` | `vase_exponential_twist.js` | 100 × 400 | 98000 | 106.6 × 87.0 | 51° at z = 39 |
| `wild_bend` | `vase_wild_bend.js` | 120 × 300 | 90000 | 126.6 × 97.5 | 49° at z = 7 |
| `four_pillars` | `vase_four_pillars.js` | 120 × 500 | 138000 | 132.6 × 98.6 | 52° at z = 73 |
| `starshape_pow` | `template_starshape_pow_function.js` | 240 × 600 | 306000 | 131.6 × 100.5 | 52° at z = 72 |
| `low_poly` | `vase_long_low_poly_multi_layer.js` | 5 × 12 | 18120 | 156.6 × 86.2 | 26° at z = 137 |

## Printing

Vase mode, as V3's `vase_sphere`: see `../pucklight_sphere/readme.md`, Vase mode.

| Slicer setting | Value | Why |
|---|---|---|
| Spiral vase | on | one wall, no top, no infill |
| **Bottom layers** | **0** | a floor closes the neck: no light, and it hits the sockel's ribs |
| Outer wall line width | 0.6 mm | overlaps the layer below more |
| Layer height | 0.2 mm | |
| Brim | outer, 5 mm | the first layer is one line |

- Steepest wall, in the status: how far a wall of the script leans in or out, from vertical. 45° is safe.
- A dome and `egg` close at 60°, as V3's `vase_sphere` at its `vase_overhang`; `n_overhang_dome` and `egg`'s `n_overhang` change it.
- Beyond 45°, from V3's table, overlap per layer of a 0.6 mm line at 0.2 mm layers: 52% at 55°, 42% at 60°, 29% at 65°, 8% at 70°.
- Screw it in gently: the thread is a single line.
- Hypothesis, not tried: 2 walls, 0 top and bottom layers and 0% infill instead of vase mode give a sturdier thread.

## Logo

| Part | Logo |
|---|---|
| Vase | none: one wall, and the neck has no bottom |
| Click base, screwin | V3's, in their bottoms |
| App | in its header |

## Checks

| Check | Result |
|---|---|
| `test_vase_mesh.js`: the thread against OpenSCAD's `vase_sphere` of V3 | 8821 points within 0.0001 mm, 17460 faces the same way |
| Same: the collar against V3's `rib_top - top_z` | ends 0.41 mm above the ribs |
| Same: every example | closed, the thread not moved, nothing below 6.6 |
| Same: 3 to 500 corners, clockwise and counter-clockwise, starting anywhere | closed, the same volume |
| Same: domes 20 to 300 high, at 45°, 60° and 89°, both ways around, and on a star with a wavy last layer | closed, no face without area, the tip at its height, as steep as asked; lower than its cone, that cone |
| Same: scripts that return nothing, no numbers, a point below the thread, too many points, a dome below 0 or at 90° | refused with a message |
| `template` and `low_poly` `.stl` in V3's sockel, intersections in OpenSCAD 2021.01; a wall as thick as V3's neck stands in for the single wall | seated: only the bottom on the cup's floor, the stop. 0.01 mm higher, half a turn out, 2.5 turns out: no contact |
| Same, pushed 0.5 mm down, and turned half a turn without rising | contact, so the check finds one |
| App in headless Chrome 154: typing, mistakes, examples, the question before discarding a changed script, orbit, zoom, download | works, console clean; the `.stl` has the bytes Node makes |
| Without the internet | the text box replaces the editor, the rest works |
| Projects in headless Chrome: create from an example, save, new, switch with and without unsaved changes, rename, reload on `#<name>`, download, delete down to none | works, console clean; `script.js` holds the editor's text each time |
| Names the server refuses, from the app: taken, `../x`, `a/b`, `.git`, a space | the status says why, nothing touched |
| API with `../..`, `a/b`, `.git`, no script, another site's `Origin` and `Host` | refused, nothing touched |
| Opened as a file | project controls off, the rest works |
| A mistake's line | found in Chrome 154 and Firefox 157 |

## Not tested yet

- Not sliced, not printed. Most open: the thread as a single wall in V3's cup, the examples' walls of up to 52°, and the tips of the dome and the egg.
- Only on software WebGL in Chrome: no real GPU. Firefox: only the mistake's line.

## Not included

- stlsculpter's vases with noise: they need its Perlin noise library.
- A normal mode vase with a thick neck, as V3's `sphere`: the inside would need its own surface.

Licensed under GPL.
