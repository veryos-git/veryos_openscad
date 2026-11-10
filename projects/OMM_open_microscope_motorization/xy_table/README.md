# OMM XY table

Motorised XY stage of the open microscope motorization: moves a standard 76 × 25 × 1 mm glass slide in X and Y with two 28BYJ-48 steppers. `omm_xy_table_v3p0p1.scad` rebuilds the Onshape document OMM_v2 (engraved label v2.3) in OpenSCAD, with the same parts and Onshape's variable names; where a value differs from Onshape, the tables below say so. v2.4 is printed, the later versions not yet. The Y slider's second guide rail, since v2.6, is experimental.

![assembly](preview.png)

![parts on the bed](parts.png)

| File | What |
|---|---|
| `omm_xy_table_v3p0p1.scad` | the generator, standalone, no libraries. `part` picks the assembly, the print layout or one part. `version` is engraved in the table; bump it with the file name |
| `omm_xy_table_v3p0p1_<part>.stl` | every printed part and the cutting ruler, exported from the generator in print orientation with the brand font |
| `archive/` | v2.4 to v3.0.0, script and STLs. Each change to the generator makes a new version file; the old one stays |
| `OMM_v2_rebuild_kit.zip` | Onshape export, source of every dimension: feature trees, sketches, variables, STEP, STL, DXF, renders and the kit's own README |
| `omm_params.scad` | the Onshape Variable Studio, 1:1 from the kit |
| `Onshape_online_CAD_version/` | Onshape print files OMM_v2p2.3mf and OMM_v2p3.3mf |

| Change | Counts, from v3.0.0 |
|---|---|
| small | the third number: v3.0.1, v3.0.2 |
| bigger | the second: v3.1.0, v3.2.0 |
| substantial | the first: v4.0.0 |

## v3.0.1 against v3.0.0

Only the motor shaft adapter and the table's label changed.

| Asked for | v3.0.0 | v3.0.1 |
|---|---|---|
| The shaft adapter's three slight rounded grooves for the O-rings, as in Onshape | plain sleeve | three grooves around the sleeve, 1, 3 and 5 from its open end: R1 for a 2 cord, 0.05 deep, 0.62 wide, bottom Ø6.2. The same as in the Onshape export to 0.001 |

## v3.0.0 against v2.7

Only the table's label changed; the cutting ruler is new.

| Asked for | v2.7 | v3.0.0 |
|---|---|---|
| A ruler to cut the sanding paper strips for the tops of the rails | – | `cutting_ruler`, see sanding paper strips below |
| The two parallel Y guides count as a major version | label v2.7 | label v3.0.0, three numbers from here on |

## v2.7 against v2.6

Only the table and the Y slider changed; the other parts print as in v2.5.

| Asked for | v2.6 | v2.7 |
|---|---|---|
| The Y motor further from the window: it stops the Y slider early | `table_motor_y` = −57.2: Y travel −8 to +33. Moved alone, the bracket leaves the table | `table_motor_y` = −62.2: Y travel −13 to +28. The table's front edge follows the motor, `table_front_margin` = 5.75 in front of the bracket: the table is 135 long, `scl_y_table` is derived |
| Frames 9 wide, set by the user in the script | `thickness_y_slider_frame`, `thickness_table_frame` = 6: windows 88 × 37.7 | 9: windows 82 × 31.7 |
| – | both rails 61.4 long | 69.4 long, from the longer table and the wider frames: nominal yaw play ±0.17° at Y 0, ±0.27 sideways at the back edge |

## v2.6 against v2.5, experimental

Only the table and the Y slider changed; both have to be printed, the other parts print as in v2.5.

| Asked for | v2.5 | v2.6 |
|---|---|---|
| A second guide rail for the Y slider beside the first, against its sideways wiggle | one arm on one table rail | a second arm, same section and length, on a second table rail at `y_rail2_x` = −15: one arm's width between the arms, 5.3 to the label. Both rails 61.4 long, 0.1 clear per side |
| The Y slider fits its rail as in Onshape | the frame's edge scallop at the arm's root cuts a 2.7 × 0.4 slit through the 0.3 roof of the slot | the frame's edge is straight where an arm joins, as in Onshape |

Y guide against Onshape, checked in the meshes:

| What | Onshape | SCAD, v2.4 to v2.6 |
|---|---|---|
| rail profile | 2.0 × 2.0, top flat 0.42, in `OMM_v2p3.3mf` | the same to 0.001 |
| slot profile | 2.2 wide, 2.1 high, mouth 2.02 | the same to 0.001 |
| rail length | 63.0 in `OMM_v2p3.3mf`; 69.2 in `OMM_v2p2.3mf`, which has round windows | 61.4: the rail ends at the chamfers of the front edge's scallop and of the window |
| Y slider seated on the table | – | no overlap at Y −8, 0, +15, +33; 0.1 per side and 0.1 above each rail |

Wiggle to expect, from the geometry, with `tol_rail` = 0.2. Not confirmed by a print.

| Guide | Guided length | Yaw play | Sideways at the back edge |
|---|---|---|---|
| one rail, up to v2.5 | 61.4 at Y 0, 41.8 at Y +33 | ±0.19° to ±0.27° | ±0.30 to ±0.55 |
| two rails beside each other, v2.6 | the same | the same: play / guided length, whatever the rails' spacing | the same; gain only from two arms bending less than one |
| second rail behind the window in line with the first, not built | 122 at Y 0 | ±0.09° | ±0.10 at Y 0; that rail is in its slot for Y −10 to +20 |

## v2.5 against v2.4

Only the slide holder and the table's label changed; the other parts print as in v2.4.

| Asked for | v2.4 | v2.5 |
|---|---|---|
| The slide holder goes onto the X slider; the printed v2.4 one barely did | the grooves end square on the long edges: seated, each of their four inner corners overlaps the rounded inner corner of the ring by 0.85 × 1.15 | the grooves' mouths are rounded with `fillet_r` on all eight corners, as in Onshape: no overlap, 0.4 clear all round, the same as along the grooves |

## v2.4 against Onshape's v2.3

| What | Onshape v2.3 | v2.4 |
|---|---|---|
| table's Y rail | missing: the feature that trims it (Extrude 4) fails in Onshape; `OMM_v2p3.3mf` still has it | male rail from the front edge to the window, as in `OMM_v2p3.3mf` |
| windows | 88 × 37.7 in the current model, smaller in `OMM_v2p3.3mf` | 88 × 37.7, from the variables |
| fillets | curvature continuous, 5 from the corner | R4 arcs |
| edge scallops | phase set by Onshape's curve patterns; the table's are Ø10.826, a sketch literal | same depth and pitch, evenly spaced from each edge's centre; the table's are Ø10, `dia_pin_remover_table` |
| Y slider's arm | 17 notches, the first half in the frame's edge; the tip rounded on the motor's side only | 15 notches; the tip rounded on both sides |
| adapter's crush ribs | pitch 0.695, the rows 0.2 off centre | pitch 0.7, centred |
| label | Onshape font | DejaVu Sans Mono Bold, same size and place, 0.4 deep |
| VeryOS logo | none | table (16 wide) and Y slider (12 wide); no room on the X slider, slide holder, adapter and washer |
| 0.2–0.6 edge chamfers on the rails | yes | left out |
| three 0.05 deep grooves on the adapter | yes | left out up to v3.0.0, in since v3.0.1 |

Volumes against Onshape: Y slider −0.3 %, X slider +0.1 %, slide holder +0.7 %, adapter and washer equal, table +0.2 % with its rail.

## How it works

All parts share one optical axis. Each carriage slides on the part below on a printed rail: a 2 × 2 male rail with 45° chamfers up to a top flat one extrusion width wide, in a slot 0.1 wider per side and 0.1 higher.

| Part | Moves | Rides on |
|---|---|---|
| table | – | the bench; carries the Y motor's bracket |
| Y slider | Y | the table's two rails, with its two arms: 7.5 × 4 female rails, 70 long, 15 apart, the motor drives the first; carries a male rail along X and the X motor's bracket |
| X slider | X | the Y slider's rail, with its 100 long female rail |
| slide holder | with the X slider | the ring's two short walls, in its 4.8 wide grooves; lifts off to change the slide |

Drive, as read from the geometry (the Onshape document does not describe it): a 28BYJ-48 hangs on each bracket with two M3 screws through the slotted uprights, 35 apart like the motor's ears. Its shaft is horizontal, 8 below the motor's axis. The shaft adapter rolls on the top of the moving female rail and drives it by friction; the slots set the motor's height and with it the pressure. `part = "assembly"` shows both motors in place, the motor's axis 15.15 above the sliding face. As built: O-rings in the grooves of each shaft adapter and a strip of sanding paper on the top of each driven rail; neither the rings nor the paper are in the model.

Travel in the model: Y from −13, where the fillet at the first arm's root meets the table's bracket, to about +28, where the arm's end passes the adapter. `table_motor_y` shifts this range, `y_arm_len` widens it. X about ±45 before the rail's end passes the adapter.

## Sanding paper strips

![cutting ruler](cutting_ruler.png)

`part = "cutting_ruler"`: a 55 × 124 × 3 plate with one window per strip. The windows are the tops of the driven rails, without allowance.

| Window | Size | Strip for |
|---|---|---|
| X, left | 7.5 × 100 | the top of the X slider's rail |
| Y, right | 7.5 × 66.25 | the top of the Y slider's first arm, from the frame to the arm's rounded end; the second arm is not driven |

| Step | What |
|---|---|
| 1 | sanding paper grit down on a cutting mat |
| 2 | ruler on the paper's back, pressed down with the flat hand |
| 3 | knife along all four walls of a window, the blade flat against the wall |

Expected, not tried yet: a strip about 0.5 smaller than its window, half the blade's thickness per side, so it stays inside the rail's top.

## Print

| Part | Count | Orientation |
|---|---|---|
| table | 1 | as is, plate down |
| Y slider | 1 | as is, plate down: the arms' slots are open to the bed and bridged by 0.3 under the frame's front strip |
| X slider | 1 | as is, slot open to the bed |
| slide holder | 1 | as is, grooves open to the bed |
| motor shaft adapter | 2 | closed end down |
| washer | 4 | flat |
| cutting ruler | 1 | flat; a tool, not in the print layout |

`part = "print_layout"` puts all parts on a 256 × 256 bed (Bambu A1, as `OMM_v2p3.3mf`). 0.2 mm layers, no supports. The table's 1 mm top chamfer is built in 0.2 steps, one per layer.

Not printed: 2 × 28BYJ-48 with their ULN2003 drivers (in the enclosure, `../enclosure/`), 4 × M3 screw and nut through the motor's ears and the slots, length not given by Onshape, a 76 × 25 × 1 glass slide, O-rings with a 2 cord for the shaft adapters' grooves, sanding paper.

## Check before printing

Onshape's values. Printed in v2.4: the slide holder on the X slider, see `lessons_learned.md`. No results yet for the other fits.

| What | Set to | Note |
|---|---|---|
| `tol_rail` | 0.2 | slot 2.2 on the 2.0 rail; for the first `rail_mouth_h` = 0.2 the mouth is only 2.02 wide (`workaround_no_space`), as in the Onshape sketch, and it prints on the bed. An Onshape print with one rail slides, but its Y slider wiggles sideways. v2.6: both arms have to go onto their rails at once, untested |
| `tol_slideh_x_slider` | 0.8 | slide holder's grooves 4.8 on the ring's 4 wall. v2.4 barely went on, because of the grooves' square mouths, not this width; v2.5's rounded mouths are untested |
| `tol_slide_holder` | 1 | recess 77 × 26 for the 76 × 25 slide, on a 1.2 ledge |
| `mshaft_tol`, `rib_protrude` | 0.1, 0.4 | adapter's bore 5.2 on the Ø5 shaft, flats 4.0 apart with crush ribs 3.2 apart on its 3.0 flats |
| `dia_oring_cord`, `oring_groove` | 2, 0.05 | the adapter's three grooves for O-rings with a 2 cord, bottom Ø6.2. 0.05 is a quarter of a layer; untested in a print of this script |
| `bracket_gap` | 0.45 | between the moving female rail and the uprights |
| `upright_slot` | 3.4 | for the M3 screws |

## Customize

Every Onshape variable is a Customizer parameter with its Onshape name, grouped by part, except `scl_y_table`, which follows the Y motor. The slide's size sets the slide holder; `scl_y_slide` also sets the X slider's ring and the distance of the rails from the axis, as in Onshape. `thickness_y_slider_frame` and `thickness_table_frame` set the windows, the `[Rails]` group all rails and their clearance, `[Motor bracket]` the uprights. `y_rail2_x` places the Y slider's second arm and its table rail: keep it clear of the first arm and of the label. `table_motor_y` places the Y motor: 1 further from the window is 1 more Y travel toward the motor and 1 less away from it. The table's front edge follows; the print layout fits the 256 bed down to −68. `x_rail_end` is a measured position, not derived: check it after changing sizes. The cutting ruler's windows follow `scl_x_rail_outer`, `scl_z_rail` and `y_arm_len`.
