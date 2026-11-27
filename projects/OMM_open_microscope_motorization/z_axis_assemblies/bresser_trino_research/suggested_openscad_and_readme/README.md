# mircoscpe_z_axis_motor – reverse-engineering package

Exported from Onshape document **mircoscpe_z_axis_motor** (workspace *Main*) on 2026-11-27.
This is a motorised Z-axis (focus) drive for a microscope: a 28BYJ-48 stepper on a clamp bracket
drives the focus knob through module-1 spur gears.

## Folder layout

| Folder | Contents |
|---|---|
| `<part>/<part>.step` | Exact B-rep (STEP AP242). **The authoritative geometry.** Open in FreeCAD/Fusion/etc. to measure |
| `<part>/<part>.stl` | Mesh in **mm** – can be used directly in OpenSCAD with `import()` as a reference overlay |
| `<part>/screenshots/` | Shaded renders: iso, front, back, top, bottom, right |
| `<part>/dxf/sketch_*.dxf` | The original Onshape sketches (true lines/arcs/circles, mm, sketch-local 2D coordinates). Layer `PROFILE` = geometry, `CONSTRUCTION` = construction lines |
| `<part>/dxf/projection_*_wireframe.dxf` | All model edges projected onto XY (top), XZ (front), YZ (right). Wireframe (hidden edges included), polylines, mm |
| `<part>/feature_tree.txt` | Complete Onshape feature list with every parameter, sketch entity and dimension |
| `metadata.json` | Bounding boxes, volumes, part names, sketch-plane transforms (to place sketch DXFs in 3D) |
| `openscad/` | Parametric OpenSCAD reconstructions (see status below) |

Coordinate system everywhere = Onshape: **Z up**, Top plane = XY, Front plane = XZ, Right plane = YZ.
`metadata.json → sketches[].transformMatrix_world_from_sketch_meters` is a row-major 4×4 matrix
(translation in metres) that maps sketch-DXF coordinates into the 3D part.

## Parts

| Part studio | What it is | Key dimensions | OpenSCAD status |
|---|---|---|---|
| `bracket2` | Clamp bracket + motor plate | C-clamp: wall 9 mm (`#thick`), height 20 mm, arms 65 mm long tilted 1° (`#angcomp`, clamp pre-load), clamp screw holes Ø7 at x −35.7 / z 10.0. Motor plate 5 mm, two 4 mm slots (10 mm wide rounded ends) at **35 mm pitch** (28BYJ-48 ears), 35 mm adjustment travel, Ø25 cut-out. 30 mm × 45° gusset. Overall 69.5 × 97.4 × 60 mm | `bracket2.scad` – best-effort, matches renders; verify hole details against STEP |
| `gear_medium` | 42-tooth ring gear | m = 1, z = 42, PA 20°, 10 mm thick, bore Ø36, 1 mm chamfer | `gear_medium.scad` – exact parameters |
| `gear_olympus` | 32-tooth gear for the focus knob | m = 1, z = 32, PA 20°, 10 mm thick, bore Ø17.5, 1 mm chamfer | `gear_olympus.scad` – exact parameters |
| `gear_byj48` | 12-tooth pinion for the stepper | m = 1, z = 12, PA 20°, 10 mm thick, double-D bore Ø5.2 / 3.2 across flats (28BYJ-48 shaft 5 / 3 mm + 0.2 clearance), 0.2 mm chamfer | `gear_byj48.scad` – exact parameters |
| `unterlagsscheibe` | Washer | Ø7 / Ø3.5 × 1 mm | `unterlagsscheibe.scad` – exact |
| `screw_long` | Hex-head screw + cutting-tool bodies | Hex head 10.2 AF × 6 mm, shank Ø6 × 50 mm (studio extends to z = 66), modelled thread (Thread Creator FS, pitch parameter 2 mm). Variable `#screwtol = 0.7 mm`. Contains 4 bodies: `screw`, `subtractr`, `Part 3`, `holesubtractor` | `screw_long.scad` – approximation, no thread (BOSL2 hint inside) |

Gear centre distances (module 1): pinion 12T ↔ 32T = **22 mm**, 12T ↔ 42T = **27 mm**.
The slotted motor plate gives the travel to set the mesh.

### How bracket2 was built in Onshape (order of features)
1. Variables `#thick = 9 mm`, `#angcomp = 1 deg`
2. Sketch 1 (Top): 9 mm slot path – back wall at x = 21.217 (outer face x = 25.717), arm to tip cap at (−39.273, 24.978), arm 1° off-parallel; Extrude 1 → 20 mm; Mirror 1 about Front plane → full C-clamp
3. Sketch 2 (Front): Ø7 circle at (x −35.695, z 10.048) = clamp-screw axis
4. Derived 1 imports `screw_long`; Transform 2 (mate connectors) + Transform 1 (40 mm along Y) place the tool bodies; Boolean 2 subtracts them → clamp-screw holes through both arm tips (Boolean 1 / Chamfer 1 are suppressed)
5. Sketch 3 (Top) → Extrude 2 (up to top face): solid block between the −Y arm and y = −67.25
6. Sketch 4 (on face y = −67.25): plate with 2 × 35 mm adjustment slots and Ø25 cut-out centred x −5.783 / z −35 → Extrude 3 (5 mm) → Mirror 2
7. Chamfer 2: 30 mm × 45° on the concave plate/block edges → gusset

## Suggested OpenSCAD workflow
1. Open `openscad/<part>.scad`. Each file is parametric; values at the top come straight from the Onshape feature tree.
2. For `bracket2.scad` set `show_reference = true` – the original mesh is ghost-overlaid (`%import`) in the same coordinates, so any deviation is visible immediately.
3. For 2D profiles use the sketch DXFs: `linear_extrude(h) import("../bracket2/dxf/sketch_Sketch_4.dxf");`
   (sketch DXFs contain every sketch curve; delete construction / overlapping curves in a DXF editor if OpenSCAD complains about open loops).
4. Measure anything uncertain from the STEP files.

## Known limitations
- The Onshape Assembly ("Assembly 1") is empty, so there is no assembly layout / mates to export.
- Gear teeth come from the Onshape "Spur Gear" FeatureScript; the OpenSCAD involute generator uses the same module / tooth count / pressure angle but may differ slightly in root fillet shape (compare with `projection_front_XZ_wireframe.dxf`).
- Wireframe projection DXFs are made of short line segments (tessellated) – good for measuring and tracing, not for direct extrusion.
- `screw_long` thread geometry and the bracket's screw-hole details (thread / head pocket) should be taken from the STEP files.
