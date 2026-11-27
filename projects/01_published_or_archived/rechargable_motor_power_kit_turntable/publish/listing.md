# Rechargeable Power Kit turntable V6: listing for MakerWorld and Printables

Copy the parts below into the upload forms. Images are 2400 × 1800 (4:3),
the portrait cover 1800 × 2400 (3:4). The photos are uploaded as they are.

## title

Turntable for the Bambu Lab Rechargeable Power Kit: Printed Worm Drive, Your Speed and Size, Customizable

## summary

A turntable for Bambu Lab's Rechargeable Power Kit (ZC003): a printed worm on
the kit's motor turns a hoop of teeth under the platform, charged over USB-C.
Seven printed parts and the kit, no other hardware. Fully parametric in
OpenSCAD: `rpm` sets the teeth and with them the size, `turntable_d` the
platform.

## description

Push the button and the platform turns. The kit's N20 gear motor, its board
with the USB-C socket and the push switch, and its 500 mAh battery sit in the
base; the platform lifts off.

**How it works**

- A printed worm on the motor's D-shaft drives a hoop of teeth under the
  platform. One turn of the worm moves the hoop one tooth, so the number of
  teeth sets the speed: 83 teeth for 6 turns per minute at the 500 rpm the kit
  states for its motor.
- The platform lies on a rail, a narrow ridge on top of the base's wall, the
  widest circle the base has, so it does not wobble. Its pin in the middle
  only centres it.
- The motor lies in a pocket under a snap hook. A motor bracket with a printed
  screw presses it down and away from the teeth.
- The board sits behind a flat panel with openings for the USB-C plug, the
  switch and the charging light; the battery lies in a fence beside it. One
  bracket with two spring arms and a second printed screw presses both down.
- A cap on the push switch stands off the panel, so the switch can be pressed
  all the way.
- The worm's thread and the screws have 45° flanks: everything prints without
  support. The VeryOS logo is on every part but the screws.

**Customize**

| parameter | default | options |
| --- | --- | --- |
| `rpm` | 6 | wanted turns per minute, 3 to 12; slower needs more teeth and a larger base |
| `turntable_d` | 150 mm | the platform's diameter, at least the base + 2 |
| `motor_rpm` | 500 | the motor's speed; count the platform's turns in a minute, multiply by the teeth, enter the result |
| `tooth_pitch` | 2.5 mm | 2: a base 14 smaller with finer teeth; 3: 12 larger with coarser ones |
| `platform_thickness` | 3 mm | |
| `worm_oversize` | 0.3 mm | 0 to 0.4, how deep the worm reaches between the teeth |
| `hold_press`, `motor_press` | 0.4 mm | how far the brackets' pads press on battery, board and motor |
| `cap_travel`, `cap_clearance` | 3 mm, 0.1 mm | the cap's distance from the panel, its grip on the switch |
| `thread_clearance` | 0.25 mm | the printed screws in their threads, per side |

One turn of the worm is one tooth, so the base grows as the speed drops. At
`motor_rpm` 500 and `tooth_pitch` 2.5:

| `rpm` | teeth | seconds per turn | base | smallest `turntable_d` |
| --- | --- | --- | --- | --- |
| 3 | 167 | 20 | Ø208 | 210 |
| 4 | 125 | 15 | Ø174 | 176 |
| 5 | 100 | 12 | Ø154 | 156 |
| 6 | 83 | 10 | Ø142 | 144 |
| 8 | 63 | 7.6 | Ø126 | 128 |
| 10 | 50 | 6 | Ø116 | 118 |
| 12 | 42 | 5 | Ø112 | 114 |

**Presets**

Four presets in the Customizer, all four in the images at the same scale:

| preset | `rpm` | `turntable_d` | teeth | base | per turn | status |
| --- | --- | --- | --- | --- | --- | --- |
| Compact | 12 | 120 mm | 42 | Ø112 | 5 s | digital only |
| Printed | 6 | 150 mm | 83 | Ø142 | 10 s | printed |
| Large | 4 | 180 mm | 125 | Ø174 | 15 s | digital only |
| Extra large | 3 | 210 mm | 167 | Ø208 | 20 s | digital only |

Printed is the script's default. All four are 20.2 mm high. The times are for
a motor at 500 rpm; it was not measured.

**Files**

- `v6_elegoo.3mf`: Elegoo Centauri Carbon 2, PLA. One plate with all parts of
  the Printed preset, the screw twice. The photographed print.
- `v6_bambu_veryos.3mf`: the same plate for the Bambu Lab A1, Bambu PLA Basic;
  not printed.
- `rechargable_motor_power_kit_turntableV6_base.stl`, `_platform.stl`,
  `_worm.stl`, `_bracket.stl`, `_motor_bracket.stl`, `_screw.stl` (print two),
  `_cap.stl`: every part of the Printed preset in print orientation.
- `rechargable_motor_power_kit_turntableV6.scad` and
  `rechargable_motor_power_kit_turntableV6.json`: the OpenSCAD source and its
  four presets.

**Printing**

0.4 mm nozzle, 0.2 mm layers, 2 walls, 15 % infill, as in the 3mf files: 104 g
of PLA and 2 h 48 min by ElegooSlicer for the Centauri Carbon 2. No support:
with supports switched on in the Elegoo 3mf, the slicer adds none. The heights
are made for 0.2 mm layers.

- Base: standing, as modelled.
- Platform: top face down, pin and teeth up.
- Worm: standing on its closed end.
- Bracket: top face down, pads up.
- Motor bracket: on its side.
- Screws: lying on their flat cut.
- Cap: on its face.

The rail's last layer is a single 0.42 mm line. With `Detect thin wall` off,
as in both 3mf files, the slicer leaves most of it out (20 of 440 mm in the
G-code of `v6_elegoo.3mf`): the platform then lies on the 0.62 mm wide layer
below. The photographed print was made that way and runs. `Detect thin wall`
on prints the line all round; that is sliced, not printed.

**Assembly**

1. Push the worm onto the motor's shaft, flat on flat.
2. Press the motor into its pocket, shaft down the slot, until the hook snaps
   over the gearbox.
3. Set the motor bracket on the block beside the motor, its arm across the
   motor, and turn a screw in with a flat screwdriver.
4. Plug motor and battery into the board. Put the board in tilted, USB-C
   socket and switch into their openings, then lower its rear.
5. Lay the battery in its fence. Set the bracket on the block between the two,
   the arm with the logo over the board, and turn the second screw in.
6. Push the cap onto the switch from outside.
7. Graphite, as in the photos: brush powder on the rail, the teeth and the
   pin, or rub a soft pencil on the rail.
8. Lower the platform, pin into the tube, and turn it a little until the
   teeth drop into the worm. Press the cap.

The worm cannot be driven backwards: do not turn the platform by hand, lift it
off instead.

The Rechargeable Power Kit (ZC003), a USB-C cable and the graphite are not
included. The kit's own five screws are not used.

**Tuning**

| problem | change | reprint |
| --- | --- | --- |
| too fast or too slow | `motor_rpm` = counted turns per minute × teeth | platform, base, bracket |
| teeth skip under a load | `worm_oversize` 0.4 | worm |
| runs rough or not at all without a load | `worm_oversize` 0.2 | worm |
| board or battery loose under the bracket | `hold_press` 0.8 | bracket |
| motor loose under the motor bracket | `motor_press` 0.6 | motor bracket |
| a bracket does not come down on its block | `hold_press` or `motor_press` 0.2 | that bracket |
| cap falls off / does not go on | `cap_clearance` 0 / 0.2 | cap |
| screw tight or loose | `thread_clearance` | base |

**Make your own size**

Open `rechargable_motor_power_kit_turntableV6.scad` in OpenSCAD and pick a
preset in the Customizer, or set `rpm` and `turntable_d`. The console reports
the teeth, the speed and the base's diameter, and the script stops with a
message if `turntable_d` is smaller than the base + 2. `part = "print_layout"`
puts all parts on the bed; `base`, `platform`, `worm`, `bracket`,
`motor_bracket`, `screw` and `cap` export one each, as they print; `assembly`,
`open` and `section` show it built. Use the same settings for all parts: the
base, the platform and the bracket change with `rpm`. The script needs no
libraries.

```sh
openscad -p rechargable_motor_power_kit_turntableV6.json -P "Large" -D 'part="base"' -o base.stl rechargable_motor_power_kit_turntableV6.scad
```

**Status**

The photos show V6, the Printed preset, printed in PLA on the Elegoo Centauri
Carbon 2 with `v6_elegoo.3mf` and built with the kit. Tested: it turns, the
teeth do not skip with the load tried, the motor bracket holds the motor
firmly, the bracket locks board and battery, the cap stays on the switch and
switches.

Not measured: the real speed (the 500 rpm are Bambu Lab's number for the
kit), the direction, how much load it turns, the run time per charge.

Digital only: the presets Compact, Large and Extra large, other values of
`tooth_pitch`, and platforms wider than 150 mm. They export without errors but
are not printed. A platform far wider than its base tips with a load on its
edge.

Very open source: the source is GPL-2.0, like everything from VeryOS.

## tags

turntable, rotating display, display stand, product photography, 3D scanning,
Bambu Lab, Rechargeable Power Kit, ZC003, N20 motor, worm gear, USB-C,
rechargeable, battery powered, printed screws, no supports, parametric,
customizable, OpenSCAD, FDM, VeryOS

## files to upload

- MakerWorld: `v6_bambu_veryos.3mf` as the print profile. Model files: the
  seven STL files, the `.scad` and the `.json`.
- Printables: the seven STL files, `v6_elegoo.3mf`, `v6_bambu_veryos.3mf`, the
  `.scad` and the `.json`.

The STL files are in this folder; the 3mf files, the `.scad` and the `.json`
are in the project folder, one level up.

License: GPL-2.0 (see `LICENSE` in the repository root). Choose a GPL
license where the site offers one.

## images, in upload order

Photos are in `../real_images/WhatsApp Unknown 2026-11-21 at 17.54.27/`.

| file | caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | Rechargeable turntable: photo of the printed V6 with its USB-C opening and switch cap, and CAD renders of the four presets at the same scale. |
| `WhatsApp Image 2026-11-20 at 16.53.02 (4).jpeg` | The printed base with the kit, platform off: worm on the motor, motor bracket, board, bracket and battery, the switch cap outside. |
| `WhatsApp Image 2026-11-20 at 16.53.02 (2).jpeg` | The printed worm on the motor's shaft, the motor under its bracket and printed screw. |
| `WhatsApp Image 2026-11-20 at 16.53.02 (1).jpeg` | The bracket's two arms on the battery and the board, held by a printed screw. |
| `WhatsApp Image 2026-11-20 at 16.53.02 (3).jpeg` | The panel from outside: the cap on the push switch, the opening for the USB-C plug. |
| `WhatsApp Image 2026-11-20 at 16.53.02 (5).jpeg` | The hoop of teeth under the platform, graphite powder brushed on. |
| `WhatsApp Image 2026-11-20 at 16.53.03.jpeg` | The platform's underside with pin and hoop, and the graphite powder. |
| `images/01_four_sizes.png` | Four presets at the same scale: Compact, Printed, Large, Extra large, with rpm, turntable_d, teeth, time per turn and base. |
| `images/02_rpm.png` | rpm sets the teeth: top views without the platform's plate at rpm 12, 6 and 3, the hoop on the worm, the base's diameter. |
| `images/03_turntable_d.png` | turntable_d 150, 180 and 200 on the same Ø142 base. |
| `images/04_fit.png` | The fit parameters on the open assembly: pin_clearance, hold_press, thread_clearance, cap_travel, rail_width, worm_oversize, motor_press; a cut through the worm. |
| `images/05_print.png` | The print layout: seven parts, the screw twice, no support; the kit, a USB-C cable and graphite are not printed. |
| `thumbnail_3x4.png` | Portrait cover, where a vertical image is needed. |

`contact-sheet.png` shows all thirteen in this order.

On the cover the cutting mat's maker's mark, in the photo's top left corner,
is painted over with the mat around it; the print is untouched. The photo
itself (`WhatsApp Image 2026-11-20 at 16.53.01.jpeg`) shows the mark and is
left out of the upload for that.

## rebuild

The images come from the source with OpenSCAD (nightly, Manifold backend),
Blender and Pillow:

```sh
python3 projects/rechargable_motor_power_kit_turntable/publish/source/build.py
```

`--stage=mesh`, `--stage=render` or `--stage=compose` runs one stage;
`--draft` renders quickly at half size. Meshes go to
`.gitignored/power_kit_turntableV6_publish/`. The transparent renders and
their cameras are in `renders/`. The STL files are the project's, copied here
after a check against a fresh export of the source (volume and size) and for
closed meshes: `mesh-audit.json`.
