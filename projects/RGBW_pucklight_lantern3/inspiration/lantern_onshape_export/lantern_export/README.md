# Lantern – Onshape export for OpenSCAD reverse engineering

Source document: big_rgb_modular_lamp_approach_body_first_45deg_threads (Onshape, workspace "Main")
Exported: 2026-10-29T10:25 — units: **mm** everywhere.

## Folder contents
- `step/` – one STEP (AP242) per part studio with all its parts. Hidden helper bodies (removers etc.) may be included; they are marked in the feature list below. "Assembly 1" contains no geometry and was skipped.
- `dxf/` – every active sketch as 2D DXF (LINE/CIRCLE/ARC, mm), in the sketch's own plane coordinates. **Construction geometry is included** (Onshape's API doesn't flag it), so ignore helper lines that don't form closed profiles. Use the plane table below to place each profile in 3D (OpenSCAD: `multmatrix` or translate/rotate, then `linear_extrude`/`import("x.dxf")`).
- `images/` – shaded renders of every part studio: iso, front, top, right.
- `features_raw/` – complete Onshape feature trees as JSON (every sketch constraint, dimension expression, extrude depth, pattern count, chamfer size…). Search for "expression" to find exact numbers.
- This README – summary of variables, sketch planes and feature trees.

## Global variables (Variable Studio 1)
| Name | Value |
|---|---|
| sltop | 100 mm |
| slbot | 76 mm |
| height | 90 mm |
| led_tealight_bracket_opening | 55 mm |

## Sketches and their planes
| Part studio | Sketch | DXF | # entities | Sketch plane (world) | Used by |
|---|---|---|---|---|---|
| body | frame_stuff | `dxf/body__frame_stuff.dxf` | 18 | origin (0.00, -90.00, 0.00) mm, normal (0.000, -1.000, 0.000), x-dir (1.000, 0.000, 0.000) | window, window_extension, frame_remover |
| body | body_top_shape | `dxf/body__body_top_shape.dxf` | 6 | origin (0.00, -90.00, 0.00) mm, normal (0.000, -1.000, 0.000), x-dir (1.000, 0.000, 0.000) |  |
| body | roof_addition | `dxf/body__roof_addition.dxf` | 5 | origin (0.00, 0.00, -49.61) mm, normal (0.000, 0.000, -1.000), x-dir (1.000, 0.000, 0.000) | roof_addition |
| body | top_bridge_sweep_path | `dxf/body__top_bridge_sweep_path.dxf` | 1 | origin (0.00, -0.00, 0.00) mm, normal (0.707, -0.000, 0.707), x-dir (0.000, 1.000, 0.000) | top_bridge_remover |
| body | roof_placer_helper | `dxf/body__roof_placer_helper.dxf` | 0 | origin (0.00, -91.00, 0.00) mm, normal (0.000, -1.000, 0.000), x-dir (1.000, 0.000, 0.000) |  |
| body | body_bot_shape | `dxf/body__body_bot_shape.dxf` | 6 | origin (0.00, 0.00, 0.00) mm, normal (0.000, -1.000, 0.000), x-dir (1.000, 0.000, 0.000) | body |
| roof | roof_base | `dxf/roof__roof_base.dxf` | 6 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | roof_base, thread_male |
| roof | screw_fine_tuning_ring_so_that_it_aligns | `dxf/roof__screw_fine_tuning_ring_so_that_it_aligns.dxf` | 2 | origin (0.00, 0.00, -0.60) mm, normal (0.000, 0.000, -1.000), x-dir (1.000, 0.000, 0.000) | screw_fine_tuning_ring_so_that_it_aligns |
| roof | thread_female | `dxf/roof__thread_female.dxf` | 6 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 1, Extrude 2 |
| roof | Sketch 2 | `dxf/roof__Sketch_2.dxf` | 3 | origin (0.00, 0.00, 1.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 5 |
| roof_2_with_handle | roof_base | `dxf/roof_2_with_handle__roof_base.dxf` | 6 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | roof_base, thread_male |
| roof_2_with_handle | screw_fine_tuning_ring_so_that_it_aligns | `dxf/roof_2_with_handle__screw_fine_tuning_ring_so_that_it_aligns.dxf` | 2 | origin (0.00, 0.00, -0.60) mm, normal (0.000, 0.000, -1.000), x-dir (1.000, 0.000, 0.000) | screw_fine_tuning_ring_so_that_it_aligns |
| roof_2_with_handle | thread_female | `dxf/roof_2_with_handle__thread_female.dxf` | 6 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 1, Extrude 2 |
| cutout_star | Sketch 1 | `dxf/cutout_star__Sketch_1.dxf` | 9 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 1, Extrude 2 |
| cutout_lines | Sketch 1 | `dxf/cutout_lines__Sketch_1.dxf` | 7 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 1, Extrude 2 |
| cutout_lines | Sketch 2 | `dxf/cutout_lines__Sketch_2.dxf` | 1 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 3 |
| roof_cutout_2 | Sketch 1 | `dxf/roof_cutout_2__Sketch_1.dxf` | 28 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 1, Extrude 2, Point Pattern 1 |
| roof_top | Sketch 2 | `dxf/roof_top__Sketch_2.dxf` | 4 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Sweep 1 |
| roof_top | Sketch 1 | `dxf/roof_top__Sketch_1.dxf` | 4 | origin (0.00, 0.00, 0.00) mm, normal (0.000, -1.000, 0.000), x-dir (1.000, 0.000, 0.000) |  |
| roof_top_bent | Sketch 2 | `dxf/roof_top_bent__Sketch_2.dxf` | 4 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Sweep 1 |
| roof_top_bent | Sketch 1 | `dxf/roof_top_bent__Sketch_1.dxf` | 9 | origin (0.00, 0.00, 0.00) mm, normal (0.000, -1.000, 0.000), x-dir (1.000, 0.000, 0.000) |  |
| window | w1 | `dxf/window__w1.dxf` | 8 | origin (0.00, 0.00, -0.00) mm, normal (0.000, -0.000, 1.000), x-dir (1.000, 0.000, 0.000) |  |
| window | window_measured | `dxf/window__window_measured.dxf` | 6 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 1 |
| window | boundary_thin | `dxf/window__boundary_thin.dxf` | 9 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | window_object_thin |
| click_sockel | Sketch 1 | `dxf/click_sockel__Sketch_1.dxf` | 5 | origin (0.00, 0.00, 0.00) mm, normal (0.000, 0.000, 1.000), x-dir (1.000, 0.000, 0.000) | Extrude 1, Extrude 2 |

## Feature trees (in order)

### body
Parts: window (hidden helper), front_remover (hidden helper), core_remover (hidden helper), Part 4 (hidden helper), bottom_part, clickbase, frame, roof_top

1. **Plane 1** `cPlane` — entities: [1 sel], cplaneType: OFFSET, offset: #height, width: 150 mm, height: 150 mm
2. **Variable** `assignVariable` — #window_thick = 3 mm
3. **Variable** `assignVariable` — #framethick = 3 mm
4. **Variable** `assignVariable` — #overlap_frame = 1 mm
5. **body_top_shape** `newSketch` — sketchPlane: [1 sel]
6. **Variable** `assignVariable` — #topbridgde_thick = 2 mm
7. **Variable** `assignVariable` — #top_bridge_height = 3 mm
8. **Variable** `assignVariable` — #frame_inside_width = 1 mm
9. **Variable** `assignVariable` — #frame_thick2 = 1.2 mm
10. **frame_stuff** `newSketch` — sketchPlane: [1 sel]
11. **body_bot_shape** `newSketch` — sketchPlane: [1 sel]
12. **body** `loft` — bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, sheetProfilesArray: [2 items], thickness1: 5 mm, thickness: 5 mm, startCondition: DEFAULT, startMagnitude: 1, endCondition: DEFAULT, endMagnitude: 1, sectionCount: 5, curveCount: 10
13. **window** `sweep` — bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, profiles: [4 sel], thickness1: 5 mm, thickness: 5 mm, path: [1 sel], profileControl: NONE, twistType: TURNS, turns: 1, pitch: 25 mm, scaleFactor: 1, booleanScope: [1 sel]
14. **window_extension** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [4 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 25 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, second
15. **window_extension_slit** `mirror` — patternType: PART, operationType: ADD, entities: [1 sel], mirrorPlane: [1 sel], booleanScope: [1 sel]
16. **frame_remover** `sweep` — bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, profiles: [5 sel], thickness1: 5 mm, thickness: 5 mm, path: [1 sel], profileControl: NONE, twistType: TURNS, turns: 1, pitch: 25 mm, scaleFactor: 1
17. **top_bridge_sweep_path** `newSketch` — sketchPlane: [1 sel]
18. **top_bridge_remover** `sweep` — bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, profiles: [3 sel], thickness1: 5 mm, thickness: 5 mm, path: [1 sel], profileControl: NONE, twistType: TURNS, turns: 1, pitch: 25 mm, scaleFactor: 1
19. **Boolean 1** `booleanBodies` — operationType: SUBTRACTION, tools: [3 sel], targets: [1 sel], offsetDistance: 5 mm
20. **Mirror 1** `mirror` — patternType: PART, operationType: NEW, entities: [2 sel], mirrorPlane: [1 sel]
21. **Circular pattern 1** `circularPattern` — patternType: PART, operationType: ADD, entities: [2 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
22. **window_mirro** `mirror` — patternType: PART, operationType: ADD, entities: [1 sel], mirrorPlane: [1 sel], booleanScope: [1 sel]
23. **window_copy** `transform` — entities: [1 sel], transformType: TRANSLATION_3D, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg
24. **derived_led_halterung** `importDerived` — placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
25. **position_tealight_holder** `transform` — entities: [3 sel], transformType: TRANSFORM_MATE_CONNECTORS, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, baseConnector: [1 sel], destinationConnector: [1 sel], secondaryAxisType: PLUS_X, angle: 30 deg
26. **Circular pattern 7** `circularPattern` — patternType: PART, operationType: REMOVE, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
27. **body** `booleanBodies` — operationType: UNION, tools: [5 sel], offsetDistance: 5 mm
28. **position_roof_female_thread** `importDerived` — location: [1 sel], placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
29. **extend_top_window_cutter** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 25 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, second
30. **Circular pattern 2** `circularPattern` — patternType: PART, operationType: REMOVE, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
31. **Boolean 2** `booleanBodies` — operationType: UNION, tools: [2 sel], offsetDistance: 5 mm
32. **Extrude 2** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 6 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondD
33. **Chamfer 1** `chamfer` — entities: [1 sel], chamferMethod: FACE_OFFSET, chamferType: OFFSET_ANGLE, width: 6 mm, width1: 5 mm, width2: 5 mm, angle: 71 deg
34. **windowcopy** `transform` — entities: [1 sel], transformType: TRANSLATION_3D, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg
35. **Circular pattern 4** `circularPattern` — patternType: PART, operationType: REMOVE, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
36. **Boolean 3** `booleanBodies` — operationType: UNION, tools: [2 sel], offsetDistance: 5 mm
37. **Chamfer 2** `chamfer` — entities: [16 sel], chamferMethod: FACE_OFFSET, chamferType: OFFSET_ANGLE, width: 6 mm, width1: 5 mm, width2: 5 mm, angle: 30 deg
38. **derived_roof** `importDerived` — placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
39. **roof_placer_helper** `newSketch` — sketchPlane: [1 sel]
40. **place_roof** `transform` — entities: [1 sel], transformType: TRANSFORM_MATE_CONNECTORS, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, baseConnector: [1 sel], destinationConnector: [1 sel], secondaryAxisType: PLUS_X, angle: 30 deg
41. **roof_addition** `newSketch` — sketchPlane: [1 sel]
42. **roof_addition** `sweep` — bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, profiles: [2 sel], thickness1: 5 mm, thickness: 5 mm, path: [4 sel], profileControl: NONE, twistType: TURNS, turns: 1, pitch: 25 mm, scaleFactor: 1, booleanScope: [1 sel]

### roof
Parts: roof_male_thread, screw_fine_tuning_ring_so_that_it_aligns, cutout_honey, roof_top, roof_top, roof_top, roof_top

1. **Variable** `assignVariable` — #threadthick = 3 mm
2. **Variable** `assignVariable` — #thread_margin = 5 mm
3. **roof_base** `newSketch` — sketchPlane: [1 sel]
4. **roof_base** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [5 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 1 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondD
5. **Variable** `assignVariable` — #threadheight = 5 mm
6. **thread_male** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: #threadheight, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm
7. **Variable** `assignVariable` — #thread_pitch = 2 mm
8. **#screwfriendlyname** `threadCreator` (SUPPRESSED) — refChoice: [1 sel], threadProfile: ANSI_STD, screwfriendlyname: 3.1496-12.7, majorDiameter: 25 mm, diameterType: MAJOR, p: #thread_pitch, numStarts: 1, lengthType: FULL, numTurns: 1, length: 25 mm, taperFirstEndAngle: 60 deg, leadInPitches: 1
9. **Chamfer 1** `chamfer` — entities: [1 sel], chamferMethod: FACE_OFFSET, chamferType: OFFSET_ANGLE, width: 2 mm, width1: 5 mm, width2: 5 mm, angle: 45 deg
10. **Variable** `assignVariable` — #thread_tol = 0.5 mm
11. **thread_female** `newSketch` — sketchPlane: [1 sel]
12. **Extrude 1** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [5 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 1 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondD
13. **Extrude 2** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: #threadheight, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm
14. **Plastic Thread 45 1** `plasticThreads45` — selectedFaces: [1 sel], pitch: #thread_pitch, numberStarts: 1, threadLength: 25 mm, layerThickness: 0.003937007874015749 in
15. **Plastic Thread 45 2** `plasticThreads45` — selectedFaces: [1 sel], pitch: #thread_pitch, numberStarts: 1, threadLength: 25 mm, layerThickness: 0.003937007874015749 in
16. **#screwfriendlyname** `threadCreator` (SUPPRESSED) — refChoice: [1 sel], threadProfile: ANSI_STD, screwfriendlyname: 3.5827-15-7/8, majorDiameter: 25 mm, diameterType: MAJOR, p: #thread_pitch, numStarts: 1, lengthType: FULL, numTurns: 1, length: 25 mm, taperFirstEndAngle: 45 deg, leadInPitches: 1
17. **Derived 1** `importDerived` — placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
18. **Transform 1** `transform` — entities: [1 sel], transformType: TRANSFORM_MATE_CONNECTORS, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, baseConnector: [1 sel], destinationConnector: [1 sel], secondaryAxisType: PLUS_X, angle: 30 deg
19. **Extrude 3** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: UP_TO_SURFACE, depth: 25 mm, endBoundEntityFace: [1 sel], offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND
20. **extension_for_screwin_fit_alignment** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 0.6 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secon
21. **screw_fine_tuning_ring_so_that_it_aligns** `newSketch` — sketchPlane: [1 sel]
22. **screw_fine_tuning_ring_so_that_it_aligns** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 0.2 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secon
23. **transform_roof** `transform` — entities: [1 sel], transformType: TRANSFORM_MATE_CONNECTORS, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, baseConnector: [1 sel], destinationConnector: [1 sel], secondaryAxisType: PLUS_X, angle: 30 deg
24. **Sketch 1** `newSketch` (SUPPRESSED) — sketchPlane: [1 sel]
25. **Extrude 4** `extrude` (SUPPRESSED) — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [6 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 0.5 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secon
26. **Transform 3** `transform` (SUPPRESSED) — entities: [1 sel], transformType: TRANSLATION_3D, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg
27. **Transform 4** `transform` (SUPPRESSED) — entities: [1 sel], transformType: SCALE_UNIFORMLY, distance: 25 mm, scale: 1.2, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg, scalePoint: [1 sel]
28. **Chamfer 2** `chamfer` (SUPPRESSED) — entities: [1 sel], chamferMethod: FACE_OFFSET, chamferType: OFFSET_ANGLE, width: 0.42 mm, width1: 5 mm, width2: 5 mm, angle: 66 deg
29. **Circular pattern 2** `circularPattern` (SUPPRESSED) — patternType: PART, operationType: ADD, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
30. **Circular pattern 3** `circularPattern` (SUPPRESSED) — patternType: PART, operationType: REMOVE, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
31. **cutout_honeycomb** `importDerived` — placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
32. **cutout_hexastart** `importDerived` — location: [1 sel], placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
33. **Transform 2** `transform` — entities: [1 sel], transformType: TRANSLATION_DISTANCE, transformDirection: [1 sel], distance: 5 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg
34. **Circular pattern 1** `circularPattern` — patternType: PART, operationType: REMOVE, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
35. **Variable** `assignVariable` — #alignment_friction_ring = 0.5 mm
36. **Variable** `assignVariable` — #alignment_friction_ring_extr = 0.4 mm
37. **Variable** `assignVariable` — #alignment_friction_ring_slot = 2 mm
38. **Sketch 2** `newSketch` — sketchPlane: [1 sel]
39. **Extrude 5** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [2 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: #alignment_friction_ring_extr, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirec

### roof_2_with_handle
Parts: roof_male_thread, roof_top, screw_fine_tuning_ring_so_that_it_aligns (hidden helper)

1. **Variable** `assignVariable` — #threadthick = 3 mm
2. **Variable** `assignVariable` — #thread_margin = 5 mm
3. **roof_base** `newSketch` — sketchPlane: [1 sel]
4. **roof_base** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [5 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 1 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondD
5. **Variable** `assignVariable` — #threadheight = 5 mm
6. **thread_male** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: #threadheight, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm
7. **Variable** `assignVariable` — #thread_pitch = 2 mm
8. **Chamfer 1** `chamfer` — entities: [1 sel], chamferMethod: FACE_OFFSET, chamferType: OFFSET_ANGLE, width: 2 mm, width1: 5 mm, width2: 5 mm, angle: 45 deg
9. **Variable** `assignVariable` — #thread_tol = 0.5 mm
10. **thread_female** `newSketch` — sketchPlane: [1 sel]
11. **Extrude 1** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [5 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 1 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondD
12. **Extrude 2** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: #threadheight, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm
13. **Plastic Thread 45 1** `plasticThreads45` — selectedFaces: [1 sel], pitch: #thread_pitch, numberStarts: 1, threadLength: 25 mm, layerThickness: 0.003937007874015749 in
14. **Plastic Thread 45 2** `plasticThreads45` — selectedFaces: [1 sel], pitch: #thread_pitch, numberStarts: 1, threadLength: 25 mm, layerThickness: 0.003937007874015749 in
15. **Derived 1** `importDerived` — placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
16. **Transform 1** `transform` — entities: [1 sel], transformType: TRANSFORM_MATE_CONNECTORS, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, baseConnector: [1 sel], destinationConnector: [1 sel], secondaryAxisType: PLUS_X, angle: 30 deg
17. **Extrude 3** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: UP_TO_SURFACE, depth: 25 mm, endBoundEntityFace: [1 sel], offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND
18. **extension_for_screwin_fit_alignment** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 0.6 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secon
19. **screw_fine_tuning_ring_so_that_it_aligns** `newSketch` — sketchPlane: [1 sel]
20. **screw_fine_tuning_ring_so_that_it_aligns** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 0.2 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secon
21. **transform_roof** `transform` — entities: [1 sel], transformType: TRANSFORM_MATE_CONNECTORS, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg
22. **Sketch 1** `newSketch` (SUPPRESSED) — sketchPlane: [1 sel]
23. **Extrude 4** `extrude` (SUPPRESSED) — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [6 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 0.5 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secon
24. **Transform 3** `transform` (SUPPRESSED) — entities: [1 sel], transformType: TRANSLATION_3D, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg
25. **Transform 4** `transform` (SUPPRESSED) — entities: [1 sel], transformType: SCALE_UNIFORMLY, distance: 25 mm, scale: 1.2, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg, scalePoint: [1 sel]
26. **Chamfer 2** `chamfer` (SUPPRESSED) — entities: [1 sel], chamferMethod: FACE_OFFSET, chamferType: OFFSET_ANGLE, width: 0.42 mm, width1: 5 mm, width2: 5 mm, angle: 66 deg
27. **Circular pattern 2** `circularPattern` (SUPPRESSED) — patternType: PART, operationType: ADD, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
28. **Circular pattern 3** `circularPattern` (SUPPRESSED) — patternType: PART, operationType: REMOVE, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]
29. **cutout_honeycomb** `importDerived` — placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
30. **Transform 2** `transform` — entities: [1 sel], transformType: TRANSLATION_DISTANCE, transformDirection: [1 sel], distance: 58 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, secondaryAxisType: PLUS_X, angle: 30 deg
31. **Circular pattern 1** `circularPattern` — patternType: PART, operationType: REMOVE, entities: [1 sel], axis: [1 sel], angle: 360 deg, instanceCount: 4, booleanScope: [1 sel]

### cutout_star
Parts: Part 1

1. **Sketch 1** `newSketch` — sketchPlane: [1 sel]
2. **Extrude 1** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 50 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, second
3. **Extrude 2** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [2 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 1 mm, offsetDistance: 25 mm, startOffsetBound: ENTITY, startOffsetDistance: 25 mm, startOffsetEntity: [1 sel], draftAngle: 3 deg, secondDirectionBound: BLIND, secondD
4. **Grid extrude 1** `gridExtrude` — operationType: ADD, entities: [1 sel], endBound: BLIND, depth: 50 mm, offsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondDirectionOffsetDistance: 25 mm, secondDirectionDraftAngle: 3 deg, GridShapeType: Hexagon, width: 5 mm, length: 40 mm, ribThickness: 2 mm, boundaryThickness1: 2.5 mm, boundary
5. **Mirror 1** `mirror` — patternType: PART, operationType: ADD, entities: [1 sel], mirrorPlane: [1 sel], booleanScope: [1 sel]

### cutout_lines
Parts: Part 1

1. **Sketch 1** `newSketch` — sketchPlane: [1 sel]
2. **Extrude 1** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 50 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, second
3. **Extrude 2** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [2 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 1 mm, offsetDistance: 25 mm, startOffsetBound: ENTITY, startOffsetDistance: 25 mm, startOffsetEntity: [1 sel], draftAngle: 3 deg, secondDirectionBound: BLIND, secondD
4. **Grid extrude 1** `gridExtrude` — operationType: ADD, entities: [1 sel], endBound: BLIND, depth: 50 mm, offsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondDirectionOffsetDistance: 25 mm, secondDirectionDraftAngle: 3 deg, GridShapeType: Rectangle, width: 2 mm, length: 40 mm, ribThickness: 1.6 mm, boundaryThickness1: 2.5 mm, boun
5. **Mirror 1** `mirror` — patternType: PART, operationType: ADD, entities: [1 sel], mirrorPlane: [1 sel], booleanScope: [1 sel]
6. **Sketch 2** `newSketch` — sketchPlane: [1 sel]
7. **Extrude 3** `extrude` — domain: MODEL, bodyType: SOLID, operationType: REMOVE, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 222 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, se

### roof_cutout_2
Parts: Part 1

1. **Sketch 1** `newSketch` — sketchPlane: [1 sel]
2. **Extrude 1** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [8 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 50 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, second
3. **Extrude 2** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [9 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 1 mm, offsetDistance: 25 mm, startOffsetBound: ENTITY, startOffsetDistance: 25 mm, startOffsetEntity: [1 sel], draftAngle: 3 deg, secondDirectionBound: BLIND, secondD
4. **Point Pattern 1** `pointPattern` — patternType: PART, operationType: NEW, entities: [1 sel], reference: [1 sel], locations: [9 sel]
5. **Boolean 1** `booleanBodies` — operationType: UNION, tools: [11 sel], offsetDistance: 5 mm
6. **Mirror 1** `mirror` — patternType: PART, operationType: ADD, entities: [1 sel], mirrorPlane: [1 sel], booleanScope: [1 sel]

### roof_top
Parts: roof_top

1. **Variable** `assignVariable` — #rooftop_thick = 1.6 mm
2. **Sketch 1** `newSketch` — sketchPlane: [1 sel]
3. **Sketch 2** `newSketch` — sketchPlane: [1 sel]
4. **Sweep 1** `sweep` — bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, profiles: [1 sel], thickness1: 5 mm, thickness: 5 mm, path: [4 sel], profileControl: NONE, twistType: TURNS, turns: 1, pitch: 25 mm, scaleFactor: 1

### roof_top_bent
Parts: roof_top

1. **Variable** `assignVariable` — #rooftop_thick = 1.8 mm
2. **Sketch 1** `newSketch` — sketchPlane: [1 sel]
3. **Sketch 2** `newSketch` — sketchPlane: [1 sel]
4. **Sweep 1** `sweep` — bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, profiles: [4 sel], thickness1: 5 mm, thickness: 5 mm, path: [4 sel], profileControl: NONE, twistType: TURNS, turns: 1, pitch: 25 mm, scaleFactor: 1
5. **Extrude 1** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 5 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondD

### window
Parts: window (hidden helper), window_thin (hidden helper), window_measured

1. **Derived 1** `importDerived` — placement: AT_ORIGIN, mateConnectorIndex: -1, mateConnectorIndexInFeature: -1
2. **Transform 1** `transform` — entities: [1 sel], transformType: TRANSFORM_MATE_CONNECTORS, distance: 25 mm, scale: 1, scaleX: 1, scaleY: 1, scaleZ: 1, baseConnector: [1 sel], destinationConnector: [1 sel], secondaryAxisType: MINUS_X, angle: 30 deg
3. **Variable** `assignVariable` — #windowtol = 0.15 mm
4. **w1** `newSketch` — sketchPlane: [1 sel]
5. **Variable** `assignVariable` — #overshoot = 1 mm
6. **boundary_thin** `newSketch` — sketchPlane: [1 sel]
7. **window_object_thin** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 0.2 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secon
8. **window_measured** `newSketch` — sketchPlane: [1 sel]
9. **Extrude 1** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 0.2 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secon

### click_sockel
Parts: click_sockel

1. **Variable** `assignVariable` — #stol = 0.3 mm
2. **Sketch 1** `newSketch` — sketchPlane: [1 sel]
3. **Extrude 1** `extrude` — domain: MODEL, bodyType: SOLID, operationType: NEW, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [2 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 3 mm, offsetDistance: 25 mm, startOffsetBound: BLIND, startOffsetDistance: 25 mm, draftAngle: 3 deg, secondDirectionBound: BLIND, secondDirectionDepth: 25 mm, secondD
4. **Extrude 2** `extrude` — domain: MODEL, bodyType: SOLID, operationType: ADD, surfaceOperationType: NEW, flatOperationType: REMOVE, entities: [1 sel], thickness1: 5 mm, thickness: 5 mm, endBound: BLIND, depth: 7.5 mm, offsetDistance: 25 mm, startOffsetBound: ENTITY, startOffsetDistance: 25 mm, startOffsetEntity: [1 sel], draftAngle: 3 deg, secondDirectionBound: BLIND, secon
5. **Chamfer 1** `chamfer` — entities: [1 sel], chamferMethod: FACE_OFFSET, chamferType: OFFSET_ANGLE, width: 0.4 mm, width1: 5 mm, width2: 5 mm, angle: 45 deg
