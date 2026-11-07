# Articulation model creator

Webapp: load a model, lay it flat on the bed, draw its spine from above, and the joints of `../articulation_cutter.scad` are placed along it and cut out, each sized to the model's width and height at that spot. Downloads the articulated model and the cutters. Original description: `readme_hgc.md`, sketch: `coarse_mockup.jpeg`.

| Start | |
|---|---|
| `deno task start` in this folder, then http://localhost:8766 | needs the server: the page is a JavaScript module and loads three.js and Manifold from jsdelivr |
| `deno task test` | `node test_cutter_mesh.js`: compares `cutter_mesh.js` with OpenSCAD's exports; needs `openscad` and the CDN once |

| File | What |
|---|---|
| `index.html` | layout, the three steps |
| `app.js` | views, placing, the curve, the cut, projects, downloads |
| `cutter_mesh.js` | `../articulation_cutter.scad` on Manifold; copy changes over by hand |
| `stl.js` | STL in and out, a mesh as a Manifold |
| `server.js` | serves the app and keeps the projects |
| `projects/` | the projects, tracked by git; `worm` is an example, its model from `worm.scad` |

## Steps

| Step | Do | Happens |
|---|---|---|
| 1 lay flat | scale; turn X, Y, Z; cut mm | the model is centred in x, y and stands on the bed; what is below the cut is gone, so the model has a flat face to print on. A model over 333 mm or under 10 mm is scaled to fit 333 mm when loaded: it was probably saved in other units. The curve scales along |
| 2 curve | click points from head to tail; drag to move, Delete removes the last; parts; flip; joint scale | parts − 1 joints spread evenly along the curve; a tick across the model per joint, an arrow towards the segment that keeps the ring link |
| 3 result | build | each cutter is sized to the model there, all are subtracted with Manifold; the pieces are coloured and counted |

## Joint

| | |
|---|---|
| geometry | `../articulation_cutter.scad`, see `../readme.md`; clearances under "joint clearances" |
| cutter size | per joint: the model's width across the curve within half a link, out to the first 2 mm gap so a part beside it, as across a bend, is left alone; + 2, in 2 mm steps; its height + 1 |
| direction | the cutter's +X, the side that keeps the ring link, points towards the tail; flip turns it |
| scale | scales the whole joint, clearances included; below 1 print a test first |
| warnings | per joint: off the model, too low for the ring (9.3 × scale), too narrow for the loop (9.5 × scale), parts shorter than a link (8.6 × scale) |
| bends | up and down freely, sideways about ±15°, as the chain |

## Projects

| | Control | On disk |
|---|---|---|
| Create | new: a copy of what is open, under a new name | `projects/<name>/` |
| Read | the project list; the address `#<name>` opens it again after a reload | |
| Update | save; a `*` in the list means unsaved | `project.json`, `model.stl` |
| Update | rename | the folder moves |
| Delete | delete, asks first | the folder goes |

- A project holds the scale, the turns, the cut, the curve and the joint settings, and the model as loaded.
- API: `GET /api/projects`, and `GET`, `POST`, `PUT`, `PATCH`, `DELETE /api/projects/<name>`; `PUT`, `DELETE /api/projects/<name>/model`.
- The server writes to `projects/` only, listens on localhost only, and refuses requests from other web pages.

## Limits

- The model must be a closed, watertight mesh; Manifold refuses others and the status says so.
- The cut runs in the page and blocks it meanwhile: seconds for 100 k triangles and ten joints.
- Untested on a print as of 2026-11-07.
