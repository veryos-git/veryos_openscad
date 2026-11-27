# olympus_hsb_microscope_adapters_addons - reverse-engineering pack

Exported from Onshape document "olympus_hsb_microscope_adapters_addons" (workspace Main) on 2026-11-27.
Purpose: give the team everything needed to rebuild these parts parametrically in OpenSCAD.

## Folder layout
- step/<studio>/        STEP AP242 per part and one ALL_<studio>.step per part studio (exact B-rep, open in FreeCAD/Fusion/etc. to measure)
- stl/<studio>/         Binary STL per part in millimetres; use import() in OpenSCAD as an overlay to check your rebuild
- dxf/<studio>/         One DXF per Onshape sketch, mm, in the sketch's own 2D plane. Layers: GEOMETRY, CONSTRUCTION, SPLINE_APPROX
- screenshots/          Shaded views (isometric, front, top, right) per part studio
- sketch_dimensions_mm.txt  Every sketch entity as numbers (lines, circles, arcs, splines) + the plane->world transform
- data/<studio>/        features_readable.txt (feature tree with parameters), variables, parts, bounding box, mass properties, raw sketch geometry, full feature JSON
- data/raw_onshape_bundle.json  Everything above in one file
- reference/            The reference image stored in the document
- openscad_starter.scad     Skeleton showing how to use the DXF/STL files and the gear parameters

## Units and coordinates
- Files in step/, stl/, dxf/ and *_mm.txt are in millimetres. JSON files under data/ are raw Onshape values in SI (metres / radians).
- Onshape world: Z up. Sketch transform matrices are 4x4 row-major, translation in metres. To place a DXF in OpenSCAD: multmatrix(M) with the translation column multiplied by 1000.
- DXF arcs are written counter-clockwise (DXF convention). Splines are approximated by a polyline through the Onshape interpolation points; take the exact shape from the STEP file if it matters.

## Parts

### z_focus_gear
Large Z-focus spur gear: 42 teeth, module 1 mm, 20 deg pressure angle (pitch diameter 42 mm). Variables: gear_width 10 mm (gear depth = gear_width/2, then mirrored), stol 0.2 mm, tolerance 0.15 mm, spatzig 1 mm, gear_friction_pins 64 (circular pattern count). Extrudes, chamfers, circular pattern and mirror follow the gear feature.
- Parts: Part 1 (JHD)
- Overall bounding box (mm): X -22.0 to 22.0, Y -5.1 to 5.1, Z -22.0 to 22.0
  - Part 1: volume 4119 mm3

### Part Studio 1
Microscope-mount adapter / holder. Contains a reference body of the microscope (sketch "microscope", 111 mm extrude) and focus wheel (30 deg revolve), the holder body (Extrude 2, 50 mm), a cut up to surface, 5 mm x 45 deg chamfer, a derived (imported) part, "Derived 1", most likely the screw thread from the screw studio or another document, moved by Transform 1 (25 mm / 30 deg), point-patterned and boolean-subtracted to make threaded holes, plus a 222 mm through-cut. Variables: comp_angle 2 deg, thick 6 mm, stol 0.2 mm, dia_screw 5 mm, screwtol 0.5 mm.
- Parts: Part 1 (JHD), Part 2 (JID), screw_thread (RJBD)
- Overall bounding box (mm): X -47.0 to 6.2, Y -41.2 to 19.3, Z -17.0 to 50.0
  - Part 2: volume 7808 mm3
  - Part 1: volume 114464 mm3
  - screw_thread: volume 34150 mm3

### Part Studio 2
Small pinion spur gear: 10 teeth, module 1 mm, 20 deg pressure angle (pitch diameter 10 mm), gear depth 7 mm, plus one sketch/extrude and a chamfer. Meshes with z_focus_gear (centre distance = (42+10)/2 = 26 mm).
- Parts: Part 1 (JHD)
- Overall bounding box (mm): X -5.8 to 5.8, Y -7.0 to 0.0, Z -6.0 to 6.0
  - Part 1: volume 416 mm3

### microscope
Reference model of the Olympus HSB microscope body (outline sketches, extrudes, mirrors, chamfer). Mainly used as a fitting reference for the adapters.
- Parts: Part 1 (JHD), Part 2 (JTD)
- Overall bounding box (mm): X -9.5 to 38.0, Y -54.3 to 54.3, Z 20.3 to 88.7
  - Part 1: volume 355117 mm3
  - Part 2: volume 70147 mm3

### screw
Printed thumb screw with plastic thread (Plastic Thread 45 feature). Variables: dia_screw 7 mm, pitch 2 mm, extr 10 mm, screwtol 0.5 mm. Bodies: screw, screw_thread and screwthread_subtractor (the oversized tool used to cut the matching female thread).
- Parts: screw (JHD), screw_thread (JZD), screwthread_subtractor (JsD)
- Overall bounding box (mm): X -8.6 to 8.6, Y -7.5 to 7.5, Z -5.0 to 11.0
  - screw_thread: volume 371 mm3
  - screw: volume 1201 mm3
  - screwthread_subtractor: volume 785 mm3

### camera_tube and Assembly 1
Both are empty in the Onshape document (no features / no instances), so they have no geometry files.

## Suggested OpenSCAD workflow
1. Open the screenshots and features_readable.txt to understand how each part is built (sketch -> extrude/revolve -> booleans/chamfers).
2. Copy the driving variables (data/<studio>/variables.json, also listed above) to the top of your .scad file.
3. Rebuild each sketch as 2D OpenSCAD (polygon/circle/square) using sketch_dimensions_mm.txt, or import() the DXF directly, then linear_extrude / rotate_extrude with the depths from features_readable.txt.
4. Gears: use a gear library (e.g. BOSL2 spur_gear(mod=1, teeth=42, pressure_angle=20, thickness=...)) with the parameters above instead of tracing the involute.
5. Threads: rebuild with BOSL2 threaded_rod / threaded_nut (pitch 2 mm, d 7 mm, plus screwtol 0.5 mm clearance for the female side).
6. Overlay the matching STL with %import("stl/...") to check fit, and measure the STEP in FreeCAD for anything not covered by the sketches (chamfers, booleans).
