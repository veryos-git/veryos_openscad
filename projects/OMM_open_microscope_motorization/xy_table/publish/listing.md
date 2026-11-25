# OMM XY table v3.1.0: listing for MakerWorld and Printables

Copy the parts below into the upload forms. Images are 2400 × 1800 (4:3).

**Not ready to upload.** Missing, both from a print of v3.1.0:

| missing | needs |
| --- | --- |
| `thumbnail_4x3.png`, `thumbnail_3x4.png`, photos | a photo of the printed and assembled v3.1.0 |
| `.3mf` | the slicer project of that print; `../xy_table_v3p0p4_veryos.3mf` (Elegoo Centauri Carbon 2) holds v3.0.4, whose Y slider has no bar between the arms; a Bambu `.3mf` for MakerWorld |

## title

Motorised XY Microscope Stage: Printed Rails, Friction Drive, Two 28BYJ-48 Steppers, Parametric

## summary

An XY stage that moves a glass slide with two 28BYJ-48 stepper motors. Four
printed layers slide on printed rails; each motor drives its layer with a
roller of O-rings on sanding paper, without gears or lead screws. Fully
parametric in OpenSCAD: the slide's format, the rails' clearance and the
travel are parameters, four slide formats are presets.

## description

The XY table of the open microscope motorization (OMM). The slide lies in a
holder that lifts off; two small steppers move it in X and Y over a window
that stays on the optical axis.

**How it works**

- Four layers around one optical axis, each with a window: the table, the Y
  slider, the X slider and the slide holder with the glass slide.
- Every layer slides on a printed rail of the layer below: a 2 × 2 mm rail
  with 45° flanks in a slot 0.2 mm wider. The Y slider runs with two arms on
  two rails of the table, 15 mm apart, joined at their tips by a bar; the X
  slider on one rail of the Y slider. The rails' ends are chamfered, so a slot finds its rail again.
- Y carries X: the Y motor stands on the table and moves the Y slider with
  everything on it, the X motor included. The X motor rides on the Y slider
  and moves the X slider with the slide holder.
- The drive is a roller on a rail. A printed sleeve on the motor's shaft
  carries three O-rings; they roll on a strip of sanding paper on the top of
  the rail they drive. No gears, no lead screw.
- Each motor hangs with two M3 screws in two slotted uprights. Pushing the
  motor down in the slots sets the pressure of the roller on the rail.
- Over the O-rings the roller is Ø10.2: one turn of the shaft moves the
  carriage 32 mm, a half step of the 28BYJ-48 about 8 µm (4096 half steps per
  turn). From the geometry, not measured.
- Travel in the model: about 41 mm in Y and 90 mm in X.
- The slide holder sits with two grooves on the X slider's ring and lifts off
  to change the slide.
- The VeryOS logo is on the table, the Y slider and the cutting ruler.

**Customize**

| parameter | default | options |
| --- | --- | --- |
| `scl_x_slide`, `scl_y_slide` | 76, 25 mm | the glass slide; see the presets |
| `tol_slide_holder` | 1.5 mm | clearance of the slide in its recess, total: 77.5 × 26.5 for the default |
| `scl_x_x_slider` | 86 mm | length of the X slider's ring: slide length + 10 |
| `tol_rail` | 0.2 mm | clearance of every slot on its rail, total; less play with less, binds sooner |
| `table_motor_y` | -62.2 mm | the Y motor's place; 1 further from the window is 1 more Y travel toward the motor and 1 less away from it |
| `y_arm_len` | 70 mm | length of the Y slider's arms; longer for more Y travel |
| `y_rail2_x` | -15 mm | place of the second arm and its rail |
| `thickness_y_slider_frame`, `thickness_table_frame` | 9 mm | frames around the windows: 82 × 31.7 for the default |
| `tol_slideh_x_slider` | 0.8 mm | the slide holder's grooves on the X slider's ring |
| `mshaft_tol`, `rib_protrude` | 0.1, 0.4 mm | the shaft adapter's bore on the Ø5 shaft with its flats |
| `dia_oring_cord`, `oring_groove` | 2, 0.05 mm | the adapter's grooves for the O-rings |
| `upright_slot` | 3.4 mm | the uprights' slots for the M3 screws |
| `version` | v3.1.0 | engraved in the table |

Every other dimension is a parameter too, under the name it has in the
Onshape original.

**Presets**

Four presets in the Customizer, all four in the images at the same scale:

| preset | `scl_x_slide` | `scl_y_slide` | `scl_x_x_slider` | `table_motor_y` | table | slide holder | `print_layout` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Standard 76 x 25 | 76 | 25 | 86 | -62.2 | 100 × 135 | 163.5 × 32.5 | fits 256 × 256 |
| Petrographic 46 x 27 | 46 | 27 | 56 | -63.2 | 100 × 137 | 133.5 × 34.5 | fits 256 × 256 |
| Wide 75 x 38 | 75 | 38 | 85 | -68.7 | 100 × 148 | 162.5 × 45.5 | 263 × 261: place the parts yourself |
| Large 75 x 50 | 75 | 50 | 85 | -74.7 | 100 × 160 | 162.5 × 57.5 | parts overlap: place the parts yourself |

Standard is the script's default; its recess of 77.5 × 26.5 is also larger
than a 75 × 25 and a 76 × 26 slide. Each preset moves the Y motor and the
table's label along with the window, so the travel is the same for all four.
In the model no two parts share a volume at the corners of that travel.

**Files**

- `omm_xy_table_v3p1p0_table.stl`, `_y_slider.stl`, `_x_slider.stl`,
  `_slide_holder.stl`, `_motor_shaft_adapter.stl` (print two), `_washer.stl`
  (print four), `_cutting_ruler.stl` (two bars in one file): every part of
  the Standard preset in print orientation.
- `omm_xy_table_v3p1p0.scad` and `omm_xy_table_v3p1p0.json`: the OpenSCAD
  source and its four presets.

**Printing**

Made for 0.2 mm layers, without support. `part = "print_layout"` puts all
parts of the Standard preset on a 256 × 256 mm bed. `xy_table_v3p0p4_veryos.3mf`
holds v3.0.4's plate for the Elegoo Centauri Carbon 2: PLA, 0.4 mm nozzle,
0.2 mm layers, 2 walls, 15 % infill, support off; its Y slider has no bar
between the arms.

- Table: plate down, rails and bracket up.
- Y slider: plate down; the arms' slots are open to the bed.
- X slider: slot open to the bed.
- Slide holder: grooves open to the bed.
- Shaft adapter, twice: on its closed end.
- Washer, four times: flat.
- Cutting ruler: both bars flat.

Not printed: 2 × 28BYJ-48 with their ULN2003 drivers and a controller, 4 × M3
screw and nut, 6 × O-ring with a 2 mm cord for a groove of Ø6.2, sanding
paper, glass slides. Electronics and firmware are not part of this model.

**Assembly**

1. Push a shaft adapter on each motor's shaft, flat on flat, and three
   O-rings into its grooves.
2. Lay the cutting ruler's bars on the back of the sanding paper, trace
   around them with a pencil and cut along the lines: bar X for the X
   slider's rail, bar Y for the Y slider's arm.
3. Stick the X strip on the top of the X slider's rail and the Y strip on the
   top of the Y slider's first arm, the one beside the table's bracket.
4. Set the Y slider on the table, both arms on the two rails.
5. Set the X slider on the Y slider, its slot on the rail.
6. Hang the Y motor in the table's bracket and the X motor in the Y
   slider's: an M3 screw with a printed washer and a nut through each ear and
   each upright's slot. Push the motor down until the O-rings sit on the
   paper, then tighten.
7. Lay the slide holder on the X slider's ring, the slide in its recess.

**Tuning**

Which parameter belongs to which problem. None of these changes is printed.

| problem | change | reprint |
| --- | --- | --- |
| a slider binds on its rail | `tol_rail` up | the part with the slot |
| the Y slider wiggles sideways | `tol_rail` down | Y slider |
| the roller slips | push the motor down in the slots | nothing |
| the slide does not fit | `tol_slide_holder` up | slide holder |
| the slide holder does not go onto the ring | `tol_slideh_x_slider` up | slide holder |
| the adapter is loose or too tight on the shaft | `mshaft_tol`, `rib_protrude` | shaft adapter |
| the Y motor stops the Y slider too early | `table_motor_y` further from the window | table |

**Make your own format**

Open `omm_xy_table_v3p1p0.scad` in OpenSCAD and pick a preset in the
Customizer. For another slide set `scl_x_slide` and `scl_y_slide`, then
`scl_x_x_slider` to the slide's length + 10, and move `table_motor_y`,
`table_text_at` and `table_logo_at` by half the change in the slide's width.
`part` exports `table`, `y_slider`, `x_slider`, `slide_holder`,
`motor_shaft_adapter`, `washer` and `cutting_ruler` one each, as they print;
`assembly` shows it built, with `x_travel` and `y_travel` moving the
carriages. The script needs no libraries.

```sh
openscad -p omm_xy_table_v3p1p0.json -P "Large 75 x 50" -D 'part="table"' -o table.stl omm_xy_table_v3p1p0.scad
```

**Status**

v3.1.0 is not printed yet. The images are CAD renders.

| what | status |
| --- | --- |
| the Onshape original with one Y rail | printed and motorised; it slides, its Y slider wiggles sideways |
| v2.4 of this script | printed; its slide holder barely went onto the X slider, changed in v2.5 |
| recess of 77 × 26, up to v3.0.2 | some slides did not fit in; 77.5 × 26.5 since v3.0.3 |
| two Y rails, the bar joining the Y slider's arms, the rails' chamfered ends, the O-ring grooves, the wider recess, the cutting ruler's bars | no print result yet |
| presets Petrographic, Wide and Large | digital only |
| travel, step size, yaw play | from the geometry, not measured |

Very open source: the source is GPL-2.0, like everything from VeryOS.

## tags

microscope, microscopy, XY stage, XY table, motorized stage, microscope
slide, slide holder, 28BYJ-48, stepper motor, friction drive, printed rails,
linear guide, open hardware, lab equipment, DIY microscope, petrographic,
parametric, customizable, OpenSCAD, FDM, VeryOS

## files to upload

- MakerWorld: a Bambu `.3mf` as the print profile (missing). Model files: the
  seven STL files, the `.scad` and the `.json`.
- Printables: the seven STL files, the `.3mf` of a printed v3.1.0, the
  `.scad` and the `.json`.

The STL files are in this folder; the `.3mf`, the `.scad` and the `.json` are
in the project folder, one level up.

License: GPL-2.0 (see `LICENSE` in the repository root). Choose a GPL
license where the site offers one.

## images, in upload order

| file | caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | missing |
| photos | missing |
| `images/01_stack.png` | How it works, the stack: table, Y slider, X slider, slide holder and glass slide lifted apart around the optical axis, the two motors and the sanding paper. |
| `images/02_two_axes.png` | How it works, two axes: top views at home, with the Y slider moved by 25 and with the X slider moved by 35; what stays is grey. |
| `images/03_drive.png` | How it works, the drive: the Y motor in its slotted uprights, its sleeve with three O-rings on the sanding paper of the Y slider's arm, and a cut through the motor's axis. |
| `images/04_slide_formats.png` | Four presets at the same scale: Standard 76 × 25, Petrographic 46 × 27, Wide 75 × 38, Large 75 × 50, with slide, table and slide holder sizes. |
| `images/05_tol_rail.png` | tol_rail 0.1, 0.2 and 0.4: a cut through a rail in its slot, slot width and yaw play. |
| `images/06_print.png` | The print layout: table, Y slider, X slider, slide holder, two shaft adapters, four washers, the cutting ruler's two bars; motors, screws, O-rings, sanding paper and slides are not printed. |
| `thumbnail_3x4.png` | missing |

`contact-sheet.png` shows the six images in this order.

The O-rings and the sanding paper in the images are not in the script: they
are drawn from its values (`dia_oring_cord`, `sand_strips`), the paper 0.3
thick, an assumed value, and the motors stand higher by both.

## rebuild

The images come from the source with OpenSCAD (nightly, Manifold backend),
Blender and Pillow:

```sh
python3 projects/OMM_open_microscope_motorization/xy_table/publish/source/build.py
```

`--stage=mesh`, `--stage=render` or `--stage=compose` runs one stage;
`--draft` renders quickly at half size. Meshes go to
`.gitignored/omm_xy_table_publish/`. The transparent renders and their
cameras are in `renders/`. The mesh stage also checks every preset at nine
places of the carriages for parts that share a volume. The STL files are the
project's, copied here after a check against a fresh export of the source
(volume and size) and for closed meshes: `mesh-audit.json`.
