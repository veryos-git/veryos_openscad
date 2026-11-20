# ESP32 enclosure V1: listing for MakerWorld and Printables

Copy the parts below into the upload forms. Images are 2400 × 1800 (4:3),
the portrait cover 1800 × 2400 (3:4). The photos are uploaded as they are.

## title

ESP32 Dev Board Case, 30-pin USB-C: Printed Screws, M3 or Push-in Lid, Customizable

## summary

A small case for a 30-pin USB-C ESP32 dev board. The pins stay reachable from
below for jumper wires, the USB-C port stays open. Fully parametric in
OpenSCAD: three lid fixings, and every board measure is a parameter.

## description

The board lies in the base with its pins down. Push the jumper wires' plugs
onto the pins through two slits in the floor, plug in USB-C at the end, and
close the lid.

**How it works**

- The board rests on a block under each corner, clear of the headers; the
  walls locate it. Four legs under the lid hold it down.
- A slit under each pin row: the plugs (14 mm) go onto the pins from below
  and stand about 5.5 mm out of the bottom.
- The USB-C window in the end wall is sized for the plug's overmould.
- Vent slots and the VeryOS logo in the lid; the logo, name and version in
  the bottom. A notch opposite the USB port lets a fingernail under the lid.
- Printed screws: 5 mm, 2 mm pitch, 45° flanks, 0.25 mm clearance per side,
  printed lying on a flat cut, so the layers run along the shank. Hex head
  with a slot for a coin or a screwdriver.

**Customize**

| parameter | default | options |
| --- | --- | --- |
| `lid_fix` | `printed` | `printed`: 2 printed screws, `m3`: 2 × M3 × 10, `push`: snap beads |
| `board_l`, `board_w` | 52 × 28.6 mm | your board's outline |
| `usb_out` | 1 mm | USB-C shell beyond the board's edge |
| `pin_x0`, `pin_row`, `pin_n` | 9.8 mm, 25.4 mm, 15 | first pin from the USB edge, between the rows, pins per row |
| `pins_h` | 8.2 mm | board underside to the pin tips |
| `top_room` | 5.4 mm | board top to the lid; the USB-C plug needs 4.9 |
| `fit` | 0.3 mm | board to wall, per side |
| `vent_n` | 5 | vent slots in the lid |
| `version` | `"V1"` | engraved in the bottom |

Keep `pin_x0 − 1.27 ≥ support − fit` at both ends of the board, so the corner
blocks miss the headers.

**Presets**

Three presets in the Customizer, all three in the images at the same scale:

| preset | `lid_fix` | outside | hardware | status |
| --- | --- | --- | --- | --- |
| Printed screws | `printed` | 56.6 × 45.8 × 20 mm | none | printed |
| M3 screws | `m3` | 56.6 × 41.5 × 20 mm | 2 × M3 × 10, forming their thread in 2.7 mm holes | digital only |
| Push-in | `push` | 56.6 × 33.2 × 20 mm | none | digital only |

Printed screws is the script's default. The screws sit in a boss on the
middle of each long wall, because the board fills the box.

**Files**

- `all_versions_snap_veryos_elegoo.3mf`: Elegoo Centauri Carbon 2, PETG-CF.
  One plate with the base and lid of all three presets and eight printed
  screws.
- `all_versions_snap_veryos.3mf`: the same plate for the Snapmaker U1, PLA.
- `esp32_unofficial_enclosureV1_printed_base.stl`, `_printed_lid.stl`,
  `_printed_screw.stl` (print two), `_m3_base.stl`, `_m3_lid.stl`,
  `_push_base.stl`, `_push_lid.stl`: every part in print orientation.
- `esp32_unofficial_enclosureV1.scad` and `esp32_unofficial_enclosureV1.json`:
  the OpenSCAD source and its three presets.

**Printing**

0.4 mm nozzle, 0.2 mm layers, 2 walls, 15 % infill, as in the 3mf files. No
support: with supports switched on in the Elegoo 3mf (tree, build plate
only), the slicer adds none.

- Base: opening up, as modelled.
- Lid: top face down, lip and legs up.
- Screws: lying on their flat cut.

**Assembly**

1. Put the board in the base, pins down, the USB-C port in the window.
2. Push the jumper wires' plugs onto the pins through the slits in the floor.
3. Put the lid on, its lip inside the walls. Printed screws: turn them in by
   hand or with a coin. M3: two M3 × 10 screws form their own thread. Push-in:
   press until the beads snap into the walls.
4. To open: a fingernail in the notch opposite the USB port lifts the lid.

The ESP32 board, the jumper wires and the M3 screws are not included.

**Make your own size**

Open `esp32_unofficial_enclosureV1.scad` in OpenSCAD and pick a preset in
the Customizer, or measure your board and enter its values
(`images/02_fit_your_board.png` shows which). Use the same settings for all parts. `part = "print_layout"` puts all
parts on the bed; `base`, `lid` and `screw` export one each, `assembly` shows
the case with the board. `part = "lid"` exports the lid top face up: turn it
over for printing. The console reports the outside size. The script needs no
libraries.

```sh
openscad -p esp32_unofficial_enclosureV1.json -P "M3 screws" -D 'part="base"' -o base.stl esp32_unofficial_enclosureV1.scad
```

**Status**

The photos show V1 with printed screws, printed: the board inside, the lid
screwed on, jumper wires on the pins. The M3 and push-in presets export as
closed meshes but are not printed yet. The board was measured by hand on one
30-pin USB-C clone board; other boards need their own values.

Not in V1: no opening for the onboard LED (its light shows through the
vents), and EN and BOOT cannot be pressed with the lid on.

Very open source: the source is GPL-2.0, like everything from VeryOS.

## tags

ESP32, ESP32 case, ESP32 enclosure, ESP-WROOM-32, dev board case,
microcontroller case, electronics enclosure, project box, USB-C, 30 pin,
jumper wires, IoT, printed screws, snap fit, M3, parametric, customizable,
OpenSCAD, FDM, VeryOS

## files to upload

- MakerWorld: needs a Bambu Studio `.3mf` as the print profile; there is none
  yet, the photographed print is from the Elegoo 3mf. Model files: the seven
  STL files, the `.scad` and the `.json`.
- Printables: the seven STL files, both 3mf files, the `.scad` and the
  `.json`.

The STL files are in this folder; the 3mf files, the `.scad` and the `.json`
are in the project folder, one level up.

License: GPL-2.0 (see `LICENSE` in the repository root). Choose a GPL
license where the site offers one.

## images, in upload order

Photos are in `../real_images/WhatsApp Unknown 2026-11-20 at 19.55.25/`.

| file | caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | ESP32 case: photo of the printed case with printed screws, and CAD renders of the three lid fixings at the same scale. |
| `image.png` | The printed case, closed with two printed screws: VeryOS logo and vent slots in the lid, the board's LED glowing through the vents. |
| `WhatsApp Image 2026-11-20 at 19.55.08 (1).jpeg` | The USB-C end: the board's port in the window, the lid on top, a printed screw on each side. |
| `WhatsApp Image 2026-11-20 at 19.55.08.jpeg` | The bottom: jumper wires on the pins through the slits, the VeryOS logo and "ESP32 case V1" engraved. |
| `images/01_three_lid_fixings.png` | Three lid fixings at the same scale, lid raised: printed screws, M3 screws and push-in, with outside sizes and hardware. |
| `images/02_fit_your_board.png` | The board's measures as parameters: board_l, board_w, usb_out, pin_x0, pin_row and pin_n drawn on the top view, and the pins seen through the slits from below. |
| `images/03_print.png` | The print layout: base, lid and two screws on the bed, no support; the board, wires and M3 screws are not printed. |
| `thumbnail_3x4.png` | Portrait cover, where a vertical image is needed. |

`contact-sheet.png` shows all eight in this order.

## rebuild

The images and STL files come from the source with OpenSCAD (nightly,
Manifold backend), Blender and Pillow:

```sh
python3 projects/esp32_unofficial/publish/source/build.py
```

`--stage=mesh`, `--stage=render` or `--stage=compose` runs one stage;
`--draft` renders quickly at half size. Meshes go to
`.gitignored/esp32_unofficial_publish/`. The transparent renders and their
cameras are in `renders/`, the STL checks in `mesh-audit.json`.
