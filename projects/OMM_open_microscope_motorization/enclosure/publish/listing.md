# OMM enclosure V7: listing for MakerWorld and Printables

Copy the parts below into the upload forms. Images are 2400 × 1800 (4:3).

**Not ready to upload.** Missing, both from a print of V7:

| missing | needs |
| --- | --- |
| `thumbnail_4x3.png`, `thumbnail_3x4.png`, photos | a photo of the printed V7 with the boards in it |
| `.3mf` | the slicer project of that print; `../omm_enclosure_v2pdontknow.3mf` holds an earlier version; a Bambu `.3mf` for MakerWorld |

## title

Electronics Box for an ESP32-S3 and Three ULN2003 Stepper Drivers, Screwless ESP32 Pocket, Parametric

## summary

A box for the electronics of the open microscope motorization (OMM): an
ESP32-S3 dev board, three ULN2003 driver boards for the X, Y and Z motors
and a breadboard power rail. The ESP32 needs no screws, every cable has its
slot. Fully parametric in OpenSCAD: the boards' pockets, the slots and the
box are parameters.

## description

The electronics of the OMM, the XY table and the microscope's own Z axis,
each driven by a 28BYJ-48, in one printed box with the ribs of the XY table.

**What goes where**

- ESP32-S3 WROOM-1 dev board, 28 wide: at the left, its USB-C ports at the
  back wall. It rests on two rails in a pocket 30 mm above the floor, its pin
  headers hang in slots open to the floor, and the slots' ends stop it
  lengthwise. No screws: four pillars under the lid hold it down, two on the
  module's can and two on the USB-C shells, 0.2 above them.
- The pocket is that of a printed case that fits the board; the board itself
  is not measured. Toward the drivers it has no side wall, so that header,
  its wires and the board's edge stay in sight.
- Jumper wires plug onto the pins from below: 30 mm under the board leave
  2.5 for the header, 14 for the housing and 13.5 for the wires to bend out.
  Three windows under the board, with 45° roofs, let the far header's wires
  out toward the drivers.
- 3 × ULN2003 driver board in a row to the right, one each for X, Y and Z,
  on Ø6 standoffs with M3 × 6 thread forming screws, the motor plugs toward
  the back.
- Breadboard power rail along the front wall, under the drivers, in a
  pocket with its tab, notch and side jogs: it fits one way round. A 4 mm
  slit through each end wall lets the 5 V cables out of the rail's end holes.
- Back wall: a 27 × 8 window for both USB-C ports, a 16 wide slot behind
  each driver's plug for its motor cable. Front wall: an 8 wide slot for the
  5 V supply cable. The slots are open to the top; the lid's tabs close them
  to 5 mm and let the lid on one way round only.
- Lid: a lip inside the walls, four M3 × 10 into the corner posts.
- Outside 157.15 × 76.6 × 46 mm, 163.15 × 82.6 over the ribs. Ø10 × 1
  recesses for stick-on feet in the bottom.
- The VeryOS logo is on the lid and on the floor; name and version on the
  lid and on the bottom.

**Customize**

| parameter | default | options |
| --- | --- | --- |
| `rail_len`, `rail_w` | 82.1, 9.7 mm | the pocket of your power rail |
| `rail_slit_w` | 4 mm | slit in the rail pocket's end walls: two jumper wires side by side |
| `esp_pocket_len`, `esp_pocket_w` | 64.55, 28.55 mm | the ESP32's pocket between its walls |
| `esp_slot_w`, `esp_rail_w` | 3.3, 0.95 mm | the headers' slots and the rails the board rests on |
| `mod_h`, `usb_h` | 3.1, 3.3 mm | the module's can and the USB-C shells above the board: the lid's pillars stop `pillar_gap` 0.2 above them, measure yours |
| `esp_under` | 30 mm | room under the board for the jumper wires |
| `esp_window_n`, `esp_window_w`, `esp_window_h` | 3, 14, 14 mm | the wire windows; keep the roof's peak, `esp_window_h` + `esp_window_w` / 2, below `esp_under` − 2 |
| `cable_slot_w`, `supply_slot_w` | 16, 8 mm | the motor cables' and the supply cable's slots |
| `cable_pass_h` | 5 mm | what the lid's tabs leave open: a cable up to 5 mm, a plug goes in first |
| `screw_hole` | 2.7 mm | M3 thread forming, untested |
| `inner_h` | 40 mm | free height inside |

No presets: the box is made for one set of boards.

**Files**

- `omm_enclosureV7_base.stl`, `omm_enclosureV7_lid.stl`: both parts in print
  orientation, the lid turned over.
- `omm_enclosureV7.scad`: the generator, standalone, no libraries. `part`
  exports `base` and `lid`, `assembly` and `open` show the boards in place.

**Printing**

Made for 0.2 mm layers, without support.

- Base: as it stands. The USB-C window bridges 27 mm, the wire windows have
  45° roofs.
- Lid: top face down; the pillars and tabs point up, the logo lies on the bed.

**Assembly**

Not printed: the ESP32-S3 WROOM-1 dev board, 3 × ULN2003 driver board, a
breadboard power rail, 4 × M3 × 10 for the lid, 12 × M3 × 6 thread forming
for the drivers, 4 stick-on feet up to Ø10, jumper wires.

- Power rail into its pocket, the 5 V cables through the slits at its ends.
- Drivers onto their standoffs, four screws each, the motor plugs toward the
  back.
- ESP32 into its pocket, the headers in the slots; the jumper wires onto the
  pins from below, the far header's through the windows.
- Motor cables into the back wall's slots, the supply cable into the front
  wall's slot; a plug goes through before the lid is on.
- Lid on, its tabs in the slots, four screws into the corner posts.

**Make your own**

Open `omm_enclosureV7.scad` in OpenSCAD, measure your power rail and your
ESP32's can and USB-C shells, and set the values in the Customizer.

```sh
openscad -D 'part="base"' -o base.stl omm_enclosureV7.scad
```

**Status**

V7 is not printed yet. The images are CAD renders.

| what | status |
| --- | --- |
| V2, a cradle from Espressif's drawing | printed; the 28 wide board did not fit, V3 took the pocket of a printed case that fits it |
| the ESP32's pocket, the same since V3 | the ESP32 fits it in an earlier print |
| the open side toward the drivers (V7), the wire windows and the 40 mm height (V6), the supply slot (V5), the rail's slits (V4) | no print result yet |
| the screw holes, 2.7 for M3 thread forming | untested |

Very open source: the source is GPL-2.0, like everything from VeryOS.

## tags

electronics enclosure, project box, ESP32, ESP32-S3, ULN2003, stepper
driver, 28BYJ-48, microscope, microscope motorization, open hardware, lab
equipment, DIY microscope, cable slots, screwless, power rail, parametric,
customizable, OpenSCAD, FDM, VeryOS

## files to upload

- MakerWorld: a Bambu `.3mf` as the print profile (missing). Model files: the
  two STL files and the `.scad`.
- Printables: the two STL files, the `.3mf` of a printed V7 and the `.scad`.

The STL files are in this folder; the `.scad` is in the project folder, one
level up.

License: GPL-2.0 (see `LICENSE` in the repository root). Choose a GPL
license where the site offers one.

## images, in upload order

| file | caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | missing |
| photos | missing |
| `images/01_inside.png` | What goes where: the ESP32-S3, three ULN2003 drivers and the power rail lifted out of the base, above their pocket, standoffs and pocket. |
| `images/02_cables.png` | The box closed, from behind and from the front: the USB-C window, three motor cable slots and the supply cable's slot, closed to 5 mm by the lid's tabs. |
| `images/03_esp32_pocket.png` | A cut across the ESP32's pocket: the board on two rails, its headers in slots, the lid's pillars on the can, 30 mm under the board for the jumper wires, a wire window and the open side toward the drivers. |
| `images/04_print.png` | The print layout: the base as it stands, the lid top face down; what is not printed and what to measure before printing. |
| `thumbnail_3x4.png` | missing |

`contact-sheet.png` shows the four images in this order.

The jumper wires' housings in `03_esp32_pocket.png` are not in the script:
they are drawn 14 long, as the script's comment on `esp_under` says. The
boards are the script's simplified boards.

## rebuild

The images come from the source with OpenSCAD (nightly, Manifold backend),
Blender and Pillow:

```sh
python3 projects/OMM_open_microscope_motorization/enclosure/publish/source/build.py
```

`--stage=mesh`, `--stage=render` or `--stage=compose` runs one stage;
`--draft` renders quickly at half size. Meshes go to
`.gitignored/omm_enclosure_publish/`. The transparent renders and their
cameras are in `renders/`. The mesh stage checks that the boards' pieces are
the script's `boards()` and the layout its `print_layout`. The STL files are
the project's, the lid turned over onto the bed, checked against a fresh
export of the source (volume and place) and for closed meshes:
`mesh-audit.json`. Manifold's own export of the base is not used: it has
edges on four triangles where the corner posts meet the walls' inner corners.
