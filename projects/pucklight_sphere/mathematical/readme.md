# Mathematical spheres

Webapp: a shader, as in Shadertoy, draws a heightmap, from a formula or a loaded texture, and its brightness moves the outside of V3's sphere. Keeps its work in named projects. Downloads `.stl` and `.obj`. Original description: `readme_hgc.md`.

![the app](preview.png)

| Start | |
|---|---|
| `deno task start` in this folder, then http://localhost:8765 | everything; reachable from this computer only |
| Open `index.html` in a browser | no Deno needed, no projects, the rest works |

| File | What |
|---|---|
| `index.html` | layout |
| `app.js` | editor, heightmap, texture, 3D views, colours, projects, downloads |
| `sphere_mesh.js` | `sphere_mesh()` of `../pucklight_sphereV3.scad` in JavaScript; copy changes over by hand |
| `server.js` | serves the app and keeps the projects |
| `deno.json` | the `start` task |
| `projects/` | the projects, tracked by git; the planets come from `../planets/` |
| `test_sphere_mesh.js` | `node test_sphere_mesh.js` compares the mesh with OpenSCAD's export; needs `openscad` |

## Projects

| | Control | On disk |
|---|---|---|
| Create | new: a copy of what is open, under a new name | `projects/<name>/` |
| Read | the project list; the address `#<name>` opens it again after a reload | |
| Update | save; a `*` in the list means unsaved | `project.json`, `texture.png` |
| Update | rename | the folder moves |
| Delete | delete, asks first | the folder goes |

- A project holds its shader, template, sliders, columns, colours and texture.
- A name has letters, digits, spaces, `_` and `-`, and is the folder's name.
- Opening another project or closing the page with unsaved changes asks first.
- API: `GET /api/projects`, and `GET`, `POST`, `PUT`, `PATCH`, `DELETE /api/projects/<name>`; `PUT`, `DELETE /api/projects/<name>/texture`.
- The server writes to `projects/` only, listens on localhost only, and refuses requests from other web pages.

## Controls

| Control | Generator's name | Does |
|---|---|---|
| template | | puts a starting shader in the editor |
| texture | | load: PNG, JPEG, WebP, up to 4096 wide, as `iChannel0`; browsers cannot read TIFF |
| Scale, Seed | | `iScale`, `iSeed`; off if the shader does not read them |
| gamma | | height = brightness ^ gamma, after the shader |
| Depth mm | `surface_depth` | how far 1.0 stands out |
| From lat | `fade_bottom` | where the relief starts, see What moves |
| Columns | `sphere_columns` | mesh resolution, see below |
| Colors | | height to colour: the preview and the `.obj`. Two stops on one place make a hard edge |

3D view: drag to orbit, wheel to zoom, cube to jump to a side, arrow to hide the small views.

- A texture on an unedited template switches to the `texture` template. An edited shader stays; the status says if it does not use the texture.

## Shader

| Name | Is |
|---|---|
| `mainImage(out vec4 fragColor, in vec2 fragCoord)` | as in Shadertoy; a pasted shader compiles as it is, without buffers and `iChannel1` to `3` |
| `fragCoord / iResolution.xy` | longitude and latitude, 0 to 1; x = 0 lies on the mesh's +x side, y = 1 at the top |
| `iChannel0` | the texture; its top is the sphere's top, and it repeats from left to right |
| `sphereDir(uv)` | the point on the unit sphere: no seam, no squeezed cells at the top |
| `iScale`, `iSeed` | the sliders |
| `iTime`, `iFrame`, `iMouse` | always 0 |
| Map | 1024 x 512, 8 bit, brightness = 0.299 r + 0.587 g + 0.114 b |

- Without `sphereDir()`, a pattern must repeat from left to right, or it shows a seam on the +x side.
- A new template: add a line to `templates` in `app.js`.
- With a shader error, the status and the editor show the line, and the last good sphere stays.

## What moves

As `outer_radius()` in the generator, with the map as `surface_height()`: radius = `sphere_r` + depth x `surface_fade(lat)` x height.

| Part | Latitude | Moves |
|---|---|---|
| Thread, neck, inside | | no |
| Outside, lower part | -45 to From lat | no |
| Outside, fading in | From lat, 15 degrees | partly |
| Outside | to 65 | fully |
| Outside, fading out | 65 to 80 | partly |
| Top, pole | 80 to 90 | no |

| From lat | For |
|---|---|
| -19.7 | the default, the generator's `fade_bottom` (-19.688): as its formulas |
| -36 | the planets: Earth keeps most of its south, little overhang, see below |
| -43 | the slider's lowest; V3's sphere starts at -45. More of the south, more overhang |

Colour follows the movement: a point that stays gets the colour of 0.0, also the neck and the inside.

## Overhang

The lower half of the mesh, 720 columns, depth 0.8 mm: its steepest face in degrees, and its area steeper than 45, of about 11400 mm2. The smooth sphere's steepest is 44.8.

| Project | From -36 | From -43 |
|---|---|---|
| Mercury | 56.7, 6 mm2 | 61.7, 73 mm2 |
| Venus | 55.9, 2 mm2 | 55.9, 4 mm2 |
| Earth | 56.7, 5 mm2 | 59.2, 16 mm2 |
| Moon | 45.9, 1 mm2 | 51.3, 19 mm2 |
| Pluto | 50.5, 1 mm2 | 63.4, 38 mm2 |
| Ceres | none | 49.3, 8 mm2 |
| Mars, Charon, Vesta, Titan | none | none |
| Voronoi | 62.4, 186 mm2 | 70.2, 398 mm2 |

- Saved: the planets at -36, Voronoi at -19.7, where it has none.
- More depth makes it worse; what a print tolerates is not tested.

## Columns

| Columns | Step at the equator | Vertices | Offset at -19.7 | Triangles | `.stl` | Voronoi walls |
|---|---|---|---|---|---|---|
| 180 | 1.75 mm | 33662 | 9000 | 67320 | 3.4 MB | coarse stair-steps |
| 360 | 0.87 mm | 115562 | 35640 | 231120 | 11.6 MB | visible stair-steps |
| **720** | **0.44 mm** | **425522** | **143280** | **851040** | **42.6 MB** | **clean; the default and the generator's maximum** |

## Checks

| Check | Result |
|---|---|
| `test_sphere_mesh.js`: smooth at 64 and 180 columns, `twist` at 180, also from -36 | same points within 0.0001 mm, same faces in the same direction, closed |
| The generator's `twist` typed as a shader, downloaded, against OpenSCAD's `surface = "twist"` | worst point 0.0015 mm off |
| Voronoi, 720 columns, against OpenSCAD's smooth sphere | not one point of the thread, neck or inside moved |
| Same, read back by Blender | `.stl` and `.obj`: 0 non-manifold edges, 27.6 cm3 (smooth: 23.1), 34 g of PLA by volume |
| `.obj` in Blender | vertex colours arrive |
| A test image with a patch at a known place | where it belongs: not mirrored, not upside down, not on the back |
| Every project opened in the app | loads as saved, nothing marked unsaved; saving writes the same bytes, so git stays clean |
| Mars, 720 columns | not one point of the thread, neck or inside moved |
| API with `../..`, `a/b`, `.git`, another site's `Origin` and `Host` | refused, nothing touched |
| Create, read, update, rename, delete, and every other control, in headless Chrome: mouse and typing on the cube, orbit, zoom, stops, picker, buttons and editor; sliders and lists set by script | works, console clean apart from the refused names |
| Without the internet | a plain text box replaces the editor; the rest works |

All on V3's sphere, which differs here in `neck_d` only, except the API and internet rows: those are from V2's and do not depend on the sphere.

## Not tested yet

- Not sliced, not printed. Most open: what the overhang above does to a print (hypothesis: a few mm2 on a planet's slopes are fine).
- Only on software WebGL in Chrome: no real GPU, no Firefox. One update took 0.2 to 1.6 s there.

## Not included

- `vase_sphere`: this is V3's normal sphere, whose inside stays smooth, so thickness makes the pattern when lit.
- Logo: none on the sphere, as in V3 by default; the screwin and the click base carry it.

Licensed under GPL. The textures in `projects/` are NASA and USGS data, see `../planets/readme.md`.
