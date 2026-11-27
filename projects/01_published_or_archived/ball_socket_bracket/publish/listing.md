# ball socket bracket: listing for MakerWorld and Printables

Copy the parts below into the upload forms. Images are 2400 x 1800 (4:3),
the photos 2000 x 1500 (4:3); both sites take 4:3.

## title

Ball Socket Bracket: Snap-In Ball Joint with Clamp Lever

## summary

A printable ball joint with two screw-on plates. The ball snaps in, tilts
about 45 degrees and locks with a printed clamp screw. Three sizes, fully
parametric in OpenSCAD.

## description

A ball joint for mounting things at an angle: a light, a camera, a sensor,
a sign. Both halves have a plate with two countersunk holes. Screw the
socket's plate to a wall or a desk, screw your device to the ball's plate,
set the angle and lock it.

**How it works**

- The ring round the ball reaches 15 degrees above the ball's equator. The
  ball snaps in and stays in while the clamp screw is loose.
- The ball tilts about 45 degrees in every direction before the neck meets
  the ring's rim.
- A slot splits the ring. The clamp screw pulls the ring's two ears
  together, the slot closes and the ring grips the ball. A lever on the
  screw turns it by hand, no tools.
- The clamp screw is printed too. It has the 45 degree, 2 mm pitch thread
  of the VeryOS FDM optimized screws, with 0.25 mm clearance.

**Sizes**

| | small | medium | large |
| --- | --- | --- | --- |
| ball | 14 mm | 20 mm | 30 mm |
| mounting holes | 2 x M3, countersunk | 2 x M4, countersunk | 2 x M5, countersunk |
| hole spacing | 18 mm | 24 mm | 34 mm |
| ball plate | 28 x 28 mm | 36 x 36 mm | 50 x 50 mm |
| socket | 40 x 28 x 12 mm | 53 x 36 x 16 mm | 73 x 50 x 22 mm |
| clamp screw | 6 mm, 40 mm lever | 8 mm, 50 mm lever | 10 mm, 70 mm lever |
| tilt | 42 degrees | 45 degrees | 47 degrees |

You need two countersunk screws per plate to mount it, four in all.

**Files**

- `test1_snap.3mf`: the medium size, all three parts on one plate, with
  supports set up.
- `ball_socket_bracket_<size>_ball.stl`, `_socket.stl` and `_screw.stl`
  for small, medium and large, already in print orientation.
- `ball_socket_bracket.scad` and `ball_socket_bracket.json`: the OpenSCAD
  source and its three presets.

**Printing**

PLA, 2 walls, 15% infill, as in the 3mf.

- Socket: flat on its plate, no support. The screw holes print sideways.
- Ball: standing on an edge of its plate, so the layers run along the neck
  and not across it. It needs support under the neck and the ball. The
  plate stands on a 4 to 6 mm edge; use a brim if it does not stay put.
- Screw: lying on its flat side, no support. The underside is cut flat so
  the thread, the post and the lever all stand on the bed.

**Assembly**

1. Screw the socket's plate down.
2. Push the ball into the ring, with the clamp screw out or loose. It snaps
   in.
3. Put the clamp screw in, set the angle and tighten the lever.

**Make your own size**

Open `ball_socket_bracket.scad` in OpenSCAD and pick a preset in the
Customizer, or change any value: ball and neck diameter, plate size, hole
spacing and screw size, thread diameter and clearance, lever length, slot
width, snap-in angle. A value that does not fit is changed to the nearest
one that does, with a `WARNING` in the console. The script needs no
libraries.

**Status**

The photos show a printed large size. Test prints with a 2 mm slot: the
large size held the ball firmly, the small and medium sizes did not. The
STL files have a 4 mm slot, so the ring can close further before the ears
meet; they are not printed yet. The 3mf is the medium size with the 2 mm
slot.

Very open source: the source is GPL-2.0, like everything from VeryOS. The
VeryOS logo is engraved in both plates and in the lever.

## tags

ball joint, ball and socket, ball head, swivel mount, adjustable mount,
bracket, wall mount, camera mount, light mount, clamp, printed screw,
printed thread, lever, snap fit, parametric, customizable, OpenSCAD, FDM,
VeryOS

## files to upload

- MakerWorld: `../test1_snap.3mf` as the print profile. The STL files, the
  `.scad` and the `.json` as model files.
- Printables: the STL files, `../test1_snap.3mf`, the `.scad` and the
  `.json`.

License: GPL-2.0 (see `LICENSE` in the repository root). Choose a GPL
license where the site offers one.

## images, in upload order

| file | caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | Ball socket bracket: photo of the printed large size, tilted, and CAD renders of the small, medium and large sizes at the same scale. |
| `../images/WhatsApp Image 2026-10-31 at 16.25.43 (2).jpeg` | The printed large size, ball tilted, clamp lever in front. |
| `../images/WhatsApp Image 2026-10-31 at 16.25.43 (1).jpeg` | The printed large size from the side, ball plate up. |
| `../images/WhatsApp Image 2026-10-31 at 16.25.43.jpeg` | The three printed parts: ball with plate, socket with split ring, clamp screw with lever. |
| `images/01_three_sizes.png` | Small, medium and large at the same scale: 14, 20 and 30 mm balls, M3, M4 and M5 mounting holes. |
| `images/02_how_it_works.png` | Snap in, set the angle, lock: a cut through the ball, the ball tilted 40 degrees, and a cut along the clamp screw. |
| `images/03_print.png` | The 3mf print plate: socket flat, ball part standing on its plate's edge, screw lying on its flat side. |

`contact-sheet.png` shows all seven in this order.

## rebuild

The images come from the source and the 3mf with OpenSCAD (nightly, Manifold
backend), Blender and Pillow:

```sh
python3 projects/ball_socket_bracket/publish/source/build.py
```

`--stage=mesh`, `--stage=render` or `--stage=compose` runs one stage;
`--draft` renders quickly at half size. Meshes go to
`.gitignored/ball_socket_bracket_publish/`. The transparent renders are in
`renders/`.
