# phone tripod mount V4: listing for MakerWorld and Printables

Copy the parts below into the upload forms. Images are 2400 × 1800 (4:3),
the portrait cover 1800 × 2400 (3:4), the photos 2000 × 1500 or 1500 × 2000.

## before you publish

| check | why |
| --- | --- |
| Add the link to the original model to the credit line, or remove the line | The design follows `../../V2/inspiration`, whose photo is marked IK-MultiMount. Its link and license are not recorded here. |
| Do not upload `../../V2/inspiration/stls` | They are another creator's files. |

## title

Phone Tripod Mount with Printed 1/4"-20 Threads: Customizable, No Supports

## summary

A hook clamp that holds your phone on a tripod or ball head. Two camera
threads printed into the part, no inserts. Prints without supports. Fully
parametric in OpenSCAD.

## description

Push the hooks onto your phone by hand, lock them with the printed screw and
screw the holder onto a tripod or ball head with a standard 1/4"-20 screw.
All three parts are printed: no inserts, nuts or other hardware.

**How it works**

- Two hooks grip the phone's long edges. The slider's guide bar runs in the
  body's sleeve.
- A printed screw through the body's end wall threads into the bar and pulls
  the hooks together.
- The 1/4"-20 thread in the slider's end holds the phone in landscape, with
  the screw head on top.
- The 1/4"-20 thread in the slider's back holds the phone with its back to the
  tripod: flat on a tripod, or at any angle on a ball head tilted 90°.
- The VeryOS logo is engraved in all three parts.

**Fit of the ready-made files**

| | |
| --- | --- |
| phone width, with case | 60 to 90 mm |
| phone thickness, with case | up to 15 mm |
| lock screw | cut for an 80 mm phone: 5 turns from first bite to tight |
| narrower phone | more turns: 10 at 70 mm, 15 at 60 mm |
| wider than 80 mm | print a longer screw with `phone_width` set to your phone; the body and slider stay the same |
| hook width | 30 mm; check that the hooks miss your phone's side buttons |
| tripod screw | shorter than the 9 mm deep thread holes |

**Customize**

| parameter | default | what it does |
| --- | --- | --- |
| `phone_width` | 80 mm | your phone's width, with case; sets the lock screw's length |
| `phone_thickness` | 15 mm | height of the hook cavities |
| `grip_min`, `grip_max` | 60, 90 mm | clamping range; sets the guide bar and sleeve lengths |
| `holder_width` | 30 mm | hook width, along the phone |
| `lip_length` | 5 mm | how far the hooks reach over the screen |
| `cavity_rounding` | 1.5 mm | radius in the hook's inner corners |
| `tripod_thread_clearance` | 0.3 mm | fit of the 1/4"-20 threads, on the diameter |
| `tripod_thread_depth` | 9 mm | depth of the 1/4"-20 thread holes |
| `lock_thread_clearance` | 0.25 mm | fit of the lock screw, per side |
| `slide_clearance` | 0.2 mm | gap between guide bar and sleeve, all round |

Walls, guide bar, keel, screw head and logo sizes have their own parameters.
Checks in the script stop the render with a message when key values do not
fit together.

**Presets**

Four presets in the Customizer, all four in the images at the same scale:

| preset | device, with case | grip range | hooks | lip | lock screw |
| --- | --- | --- | --- | --- | --- |
| Everyday | 80 × 15 mm phone | 60–90 mm | 30 mm | 5 mm | 36 mm |
| Compact phone | 66 × 10 mm phone | 55–80 mm | 26 mm | 5 mm | 27 mm |
| Thick case | 88 × 20 mm phone | 70–100 mm | 36 mm | 7 mm | 34 mm |
| Small tablet | 135 × 12 mm tablet | 115–155 mm | 44 mm | 8 mm | 36 mm |

Everyday is the script's defaults.

**Files**

- `phone_threaded_mount_V4_veryos.3mf`: the Everyday preset for the Bambu Lab
  A1, all three parts on one plate, with the print settings below.
- `phone_camera_thread_holderV4_body.stl`, `_slider.stl`, `_lock_screw.stl`:
  the Everyday preset in print orientation.
- `phone_camera_thread_holderV4_thread_test.stl`: a small block with the
  1/4"-20 thread, to check the fit first.
- `phone_camera_thread_holderV4.scad` and `phone_camera_thread_holderV4.json`:
  the OpenSCAD source and its four presets.

**Printing**

PLA, 0.4 mm nozzle, 0.2 mm layers, 2 walls, 15% grid infill, auto brim,
textured PEI plate, no supports, as in the 3mf.

- Thread test first. If the tripod screw is tight, raise
  `tripod_thread_clearance`. If it is loose, lower it.
- Body and slider: on their side, so every layer is the hook profile. A keel
  carries the guide bar on the bed. The thread holes have a 45° roof on top.
- Lock screw: on a flat cut, so the layers run along the shank.
- The logos on the slider and the screw have strokes of about 1.1–1.4 mm. Use
  a 0.4 mm nozzle or finer.

**Use**

1. Push the slider's bar into the sleeve and pull it out far enough for the
   phone.
2. Lay the phone between the hooks and push the slider in by hand until both
   hooks touch the phone's edges.
3. Put the screw through the end wall and screw it into the bar.
4. Screw the slider onto the tripod. Tighten by hand: the threads are printed
   plastic.

To take the phone out, loosen the screw and pull the slider out.

**Make your own size**

Open `phone_camera_thread_holderV4.scad` in OpenSCAD and pick a preset in the
Customizer, or change any value. `part = "print_layout"` puts all three parts
on the bed; `body`, `slider`, `lock_screw` and `thread_test` export one each.
The script needs no libraries.

```sh
openscad -p phone_camera_thread_holderV4.json -P "Thick case" -D 'part="print_layout"' -o thick_case.stl phone_camera_thread_holderV4.scad
```

**Status**

The photos show the Everyday preset printed, on a ball head, in both threads.
The other presets and variants export as closed meshes but are not printed
yet.

Inspired by the IK-MultiMount phone clamp. The geometry here is new OpenSCAD
code, with no imported meshes.

Very open source: the source is GPL-2.0, like everything from VeryOS.

## tags

phone mount, phone holder, tripod mount, phone tripod adapter, 1/4-20, camera
thread, printed thread, ball head, smartphone, tablet mount, photography,
vlogging, clamp, no supports, parametric, customizable, OpenSCAD, FDM, VeryOS

## files to upload

- MakerWorld: `phone_threaded_mount_V4_veryos.3mf` as the print profile. The
  four STL files, the `.scad` and the `.json` as model files.
- Printables: the four STL files, the 3mf, the `.scad` and the `.json`.

The STL files are in this folder; the 3mf, the `.scad` and the `.json` are in
the V4 folder, one level up.

License: GPL-2.0 (see `LICENSE` in the repository root). Choose a GPL license
where the site offers one.

## images, in upload order

Photos are in `WhatsApp Unknown 2026-11-06 at 19.44.53/`, named
`WhatsApp Image 2026-11-06 at 19.44.<name>.jpeg`.

| file | caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | Phone tripod mount: photo of the printed holder with a phone on a ball head arm, and CAD renders of four sizes at the same scale. |
| `40 (4)` | The printed Everyday preset on a ball head arm. The thread in the slider's end holds the phone in landscape. |
| `41 (1)` | The slider's end with its printed 1/4"-20 thread, the hook's lip over the screen, and the ball head's 1/4"-20 screw beside it. |
| `40 (1)` | From the side: the hook around the phone's edge, and the ball head on the slider's end. |
| `43 (1)` | The printed holder from behind: logos on the body and the slider, and the thread in the slider's back. |
| `41 (2)` | The printed holder from above, with the logo in the end of the lock screw's head. |
| `41 (4)` | The side that printed on the bed: textured first layer, keel and hook profile. |
| `images/01_four_sizes.png` | Four presets at the same scale, each on a plain block for the device: Everyday 80 × 15, Compact phone 66 × 10, Thick case 88 × 20 and Small tablet 135 × 12 mm. |
| `images/02_two_threads.png` | The two printed threads in use on a ball head: in the slider's end for landscape, in its back for flat or any angle. |
| `images/03_how_it_works.png` | The three parts pulled apart, a cut along the lock screw, and the four steps from pulling the slider out to mounting. |
| `images/04_customize.png` | Hook height, hook width and lip length, each at three values on the Everyday preset, at the same scale. |
| `images/05_print.png` | The print layout: body, slider and lock screw on the bed, no supports. |
| `thumbnail_3x4.png` | Portrait cover, where a vertical image is needed. |

`contact-sheet.png` shows all thirteen in this order.

| optional | note |
| --- | --- |
| `WhatsApp Video 2026-11-06 at 19.44.42.mp4` | 7 s, 848 × 478: the printed holder on a mirror turntable, for sites that take video. |

| left out | why |
| --- | --- |
| `40 (3)`, `41` | The phone's brand is clearly readable. `40 (3)` is the only photo of the back thread in use, so `images/02_two_threads.png` shows it cropped without the brand. |
| `40 (2)` as a separate photo | A blurred part of the brand shows left of the slider. It is in `images/02_two_threads.png`, where it is smaller; no crop removes it without cutting the holder. |
| the others | They repeat the views above. |

`40 (4)` keeps two blurred letters of the brand behind the ball head.

## rebuild

The images and STL files come from the source with OpenSCAD (nightly, Manifold
backend), Blender and Pillow:

```sh
python3 projects/01_published_or_archived/phone_camera_thread_holder/V4/publishing/source/build.py
```

`--stage=mesh`, `--stage=render` or `--stage=compose` runs one stage;
`--draft` renders quickly at half size. Meshes go to
`.gitignored/phone_mount_V4_publish/`, or to `PUBLISH_CACHE` if set. The
transparent renders are in `renders/`. Font: DejaVu Sans Mono, as Consolas is
not installed; set `PUBLISH_FONT` and `PUBLISH_FONT_BOLD` to use Consolas.
