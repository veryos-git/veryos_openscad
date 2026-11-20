# Mikrofonarm Tischklemme V3: listing for MakerWorld and Printables

Copy the parts below into the upload forms. Images are 2400 × 1800 (4:3),
the portrait cover 1800 × 2400 (3:4), the photos 1200 × 1600 and
1600 × 1200, as taken.

## title

Mic Arm Table Clamp for Rode PSA-1: Customizable, Tables 5 to 80 mm

## summary

A printed table clamp for a microphone arm with a 12.5 mm pin, such as the
Rode PSA-1: a C over the table edge, a blind hole for the pin and a 16 mm
screw with a T bar. Parametric in OpenSCAD: table thickness, pin position
and pin hole.

## description

Slide the clamp over the table edge, tighten the T bar from below and drop
the arm's pin into the hole. The arm turns in it.

**How it works**

- The top jaw lies on the table. The block on it has a blind hole, 12.6 mm
  wide and 32 mm deep, for the arm's 12.5 × 30 mm pin.
- The screw goes through the lower jaw right under the pin and presses on
  the table's underside: 16 mm thread, 2 mm pitch, 45° flanks, a 70 mm T bar.
- The clamp prints on its side, so its layers run around the C and the
  screw's force pulls along them. The pin hole is a teardrop and the thread
  has 45° flanks: nothing needs support.
- The VeryOS logo is engraved in the block's face towards the desk and in
  the T bar.

**Customize**

| parameter | default | options |
| --- | --- | --- |
| `table_max`, `table_min` | 50, 10 mm | the thickest and the thinnest table; the screw is as long as the range needs |
| `pin_x` | 24 mm in the Printed preset, 18 in the script | pin and screw axis from the table edge; the jaws grow with it |
| `pin_hole_diameter`, `pin_hole_depth` | 12.6, 32 mm | for another arm's pin |
| `clamp_width` | 40 mm | along the table edge |
| `thread_clearance` | 0.25 mm per side | 0.25 is a tight fit in PETG-CF: do not go lower |
| `clamp_chamfer` | 1 mm | 45° on every outer edge of the clamp |

The jaws, the block's walls and the screw's bar have their own parameters.
A value that does not fit stops the render with a message.

**Presets**

Four presets in the Customizer, all four in the images at the same scale:

| preset | table | `pin_x` |
| --- | --- | --- |
| Printed | 10 to 50 mm | 24 mm |
| Thin desk | 5 to 30 mm | 24 mm |
| Thick desk | 40 to 80 mm | 24 mm |
| Far from edge | 10 to 50 mm | 40 mm |

Printed is the photographed clamp. The script's own defaults differ from it
only in `pin_x`, 18.

**Files**

- `v3_elegooPETGCF.3mf`: the Printed preset for the Elegoo Centauri Carbon 2
  (ElegooSlicer), with the settings of the photographed print. Both parts on
  one plate.
- `mikrofonarm_tischklemmeV3_clamp.stl`, `mikrofonarm_tischklemmeV3_screw.stl`:
  the Printed preset in print orientation.
- `mikrofonarm_tischklemmeV3.scad` and `mikrofonarm_tischklemmeV3.json`: the
  OpenSCAD source and its four presets.

**Printing**

PETG-CF, 0.4 mm nozzle, 0.2 mm layers, 4 walls, 15% rectilinear infill,
250 °C, bed 70 °C, fan 5 to 40%, no supports, no brim, as in the 3mf.

- Clamp: on its side, 40 mm high.
- Screw: on its flat, the logo up. The thread is cut flat on the bed side.
- Strength: a PLA print with 2 walls and 15% infill split along a layer
  through the thread when the screw was tightened hard. Print it in PETG.
  More walls and infill in the lower jaw should make it stronger; that is
  not tested.

**Assembly**

1. Screw the screw into the lower jaw from below.
2. Slide the clamp over the table edge, the top jaw on the table.
3. Tighten with the T bar: firm, not with all your force.
4. Drop the arm's pin into the hole.

No hardware.

**Make your own size**

Open `mikrofonarm_tischklemmeV3.scad` in OpenSCAD and pick a preset in the
Customizer, or change any value. Use the same settings for both parts.
`part = "print_layout"` puts both on the bed; `clamp` and `screw` export one
each, `assembly` shows them on a table. The script needs no libraries.

```sh
openscad -p mikrofonarm_tischklemmeV3.json -P "Thick desk" -D 'part="clamp"' -o clamp.stl mikrofonarm_tischklemmeV3.scad
```

**Status**

The photos show the Printed preset in PETG-CF, holding a Rode PSA-1 on a
desk; the screw goes in tightly. A PLA print split at the lower jaw, see
Printing. The other presets export as closed meshes but are not printed.
A version with a stronger thread and a thicker lower jaw (V5) is in the
repository, not printed yet.

Very open source: the source is GPL-2.0, like everything from VeryOS.

## tags

microphone arm, mic arm, boom arm, table clamp, desk clamp, C clamp, Rode
PSA-1, PSA1, mic stand, podcast, streaming, home studio, desk mount, T
handle, screw clamp, parametric, customizable, OpenSCAD, FDM, VeryOS

## files to upload

- MakerWorld: there is no Bambu `.3mf` yet: the photographed print was
  sliced in ElegooSlicer. Upload the two STL files, the `.scad` and the
  `.json` as model files.
- Printables: the two STL files, `v3_elegooPETGCF.3mf`, the `.scad` and the
  `.json`.

The STL files are in this folder; the 3mf is in the project folder, one
level up; the `.scad` and the `.json` are in `../archive/`.

License: GPL-2.0 (see `LICENSE` in the repository root). Choose a GPL
license where the site offers one.

## images, in upload order

Photos are in `../real_images/WhatsApp Unknown 2026-11-20 at 19.48.49/`.
No brand marks show on the arm in them.

| file | caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | Mic arm table clamp: photo of the printed clamp holding the arm's joint, and CAD renders of four variants at the same scale. |
| `WhatsApp Image 2026-11-20 at 19.47.57 (3).jpeg` | The printed clamp on a desk, the arm's pin in its hole; the VeryOS logo on the block. |
| `WhatsApp Image 2026-11-20 at 19.47.57.jpeg` | The arm standing in the clamp at the desk's edge. |
| `WhatsApp Image 2026-11-20 at 19.47.57 (2).jpeg` | From below: the C around the desk top, the screw pressing on its underside, the T bar with the logo. |
| `WhatsApp Image 2026-11-20 at 19.47.57 (1).jpeg` | The engraved VeryOS logo on the block, close up. |
| `images/01_four_variants.png` | Four presets at the same scale: Printed, Thin desk, Thick desk and Far from edge, with their table ranges and pin positions. |
| `images/02_table_thickness.png` | Side views of tables 5 to 30, 10 to 50 and 40 to 80 mm: table_max is the jaw gap, table_min the screw's reach. |
| `images/03_pin_position.png` | Side views with pin_x 14, 24 and 40 mm: the pin and the screw further onto the table. |
| `images/04_fit.png` | A section through the middle: the pin in its 12.6 mm hole, the 16 mm thread and its 0.25 mm clearance. |
| `images/05_print.png` | The print layout: clamp on its side and screw on its flat, no supports, no hardware. |
| `thumbnail_3x4.png` | Portrait cover, where a vertical image is needed. |

`contact-sheet.png` shows all eleven in this order.

## rebuild

The images and STL files come from the source with OpenSCAD (nightly,
Manifold backend), Blender and Pillow:

```sh
python3 projects/mikrofonarm_tischklemme/publish/source/build.py
```

`--stage=mesh`, `--stage=render` or `--stage=compose` runs one stage;
`--draft` renders quickly at half size. Meshes go to
`.gitignored/mikrofonarm_tischklemmeV3_publish/`. The transparent renders
are in `renders/`. The mesh stage checks that both STL files are closed.
