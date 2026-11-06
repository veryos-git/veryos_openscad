# Mathematical spheres

Webapp: a shader, as in Shadertoy, draws a heightmap, from a formula or a loaded texture, and its brightness moves the outside of V2's sphere. Keeps its work in named projects. Downloads `.stl` and `.obj`. Original description: `readme_hgc.md`.

![the app](preview.png)

| Start | |
|---|---|
| `deno task start` in this folder, then http://localhost:8765 | everything; reachable from this computer only |
| Open `index.html` in a browser | no Deno needed, no projects, the rest works |

| File | What |
|---|---|
| `index.html` | layout |
| `app.js` | editor, heightmap, texture, 3D views, colours, projects, downloads |
| `sphere_mesh.js` | `sphere_mesh()` of `../pucklight_sphereV2.scad` in JavaScript; copy changes over by hand |
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
| Outside, lower part | -37.8 to From lat | no |
| Outside, fading in | From lat, 15 degrees | partly |
| Outside | to 65 | fully |
| Outside, fading out | 65 to 80 | partly |
| Top, pole | 80 to 90 | no |

| From lat | For |
|---|---|
| -12.5 | the default, the generator's `fade_bottom` (-12.497): as its formulas |
| -36 | the planets: a map should reach the neck, or Earth loses most of its south |

Colour follows the movement: a point that stays gets the colour of 0.0, also the neck and the inside.

## Columns

| Columns | Step at the equator | Vertices | Offset at -12.5 | Triangles | `.stl` | Voronoi walls |
|---|---|---|---|---|---|---|
| 180 | 1.75 mm | 32222 | 8280 | 64440 | 3.2 MB | coarse stair-steps |
| 360 | 0.87 mm | 110522 | 33120 | 221040 | 11.1 MB | visible stair-steps |
| **720** | **0.44 mm** | **405362** | **133200** | **810720** | **40.5 MB** | **clean; the default and the generator's maximum** |

## Checks

| Check | Result |
|---|---|
| `test_sphere_mesh.js`: smooth at 64 and 180 columns, `twist` at 180, also from -36 | same points within 0.0001 mm, same faces in the same direction, closed |
| The generator's `twist` typed as a shader, downloaded, against OpenSCAD's `surface = "twist"` | worst point 0.0013 mm off |
| Voronoi, 720 columns, against OpenSCAD's smooth sphere | not one point of the thread, neck or inside moved |
| Same, read back by Blender | `.stl` and `.obj`: 0 non-manifold edges, 26.0 cm3 (smooth: 22.0), 32 g of PLA by volume |
| `.obj` in Blender | vertex colours arrive |
| A test image with a patch at a known place | where it belongs: not mirrored, not upside down, not on the back |
| Every project opened in the app | loads as saved, nothing marked unsaved; saving writes the same bytes, so git stays clean |
| Mars, 720 columns | not one point of the thread, neck or inside moved |
| API with `../..`, `a/b`, `.git`, another site's `Origin` and `Host` | refused, nothing touched |
| Create, read, update, rename, delete, and every other control, in headless Chrome: mouse and typing on the cube, orbit, zoom, stops, picker, buttons and editor; sliders and lists set by script | works, console clean apart from the refused names |
| Without the internet | a plain text box replaces the editor; the rest works |

## Not tested yet

- Not sliced, not printed. Most open: overhang on the lower flank of a wall, and more so below -12.5 (hypothesis: a planet's gentle slopes are fine).
- Only on software WebGL in Chrome: no real GPU, no Firefox. One update took 0.2 to 1.6 s there.

## Not included

- `vase_sphere`: this is V2's normal sphere, whose inside stays smooth, so thickness makes the pattern when lit.
- Logo: none on the sphere, as in V2 by default; the sockel and the click base carry it.

Licensed under GPL. The textures in `projects/` are NASA and USGS data, see `../planets/readme.md`.
