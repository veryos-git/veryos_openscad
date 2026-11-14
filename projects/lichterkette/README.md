# Lichterkette

Printed bulbs for an LED string light (Landi Schweiz). A clip snaps onto the socket behind each LED and screws into the bulb's neck. V2, unprinted.

![parts](rendered_parts/overview.png)

| File | What |
|---|---|
| `lichterketteV2.scad` | the generator, standalone, no libraries. `part`: bulb and clip on the bed, assembly, section, bulb, clip |
| `lichterketteV2_bulb.stl`, `_clip.stl` | exported at the defaults, as they print |
| `rendered_parts/` | every part under its name |
| `lichterketten_standards/landi_schweiz/` | `v1.scad`, the published push-in version (needs BOSL2 and an OpenSCAD newer than 2021.01), and its pictures |
| `readme_hgc.md` | original goal |

## Parts

| Part | Qty | Print |
|---|---|---|
| bulb | 1 per LED | standing on its neck, as v1; its wall is one line, 0.5 |
| clip | 1 per LED | standing on its end, tip up; no support |

1. Snap the clip onto the LED's socket, its tip towards the LED.
2. Hold the clip, screw the bulb on until it is tight: the neck's thread closes the clip's C on the socket.

## V2 against v1

| | v1 | V2 |
|---|---|---|
| print | printed, published | unprinted |
| clip in the bulb | pushed in: six ribs in the neck squeeze the clip from Ø6.0 at the entry to Ø4.8 at the end | screwed in: Ø7 thread, 2 mm pitch, 45° flanks, as fdm_optimized_screws |
| squeeze on the LED | clip Ø5.8 in Ø4.8: its C closes up to 1.0 | the neck's thread narrows from Ø7.5 to Ø6.4: 0.25 gap per side at the entry, the C closes by `clamp` 0.6 at the end |
| clip | C, bore Ø4.2, wall 0.8, 50° open, 9 long, a brim ring Ø7 × 2 at its end | C, bore Ø4.2, wall 0.6 under the thread, 50° open (1.8 at the bore), 9 long, no brim ring |
| neck | Ø10 × 7 | Ø10 × 7 |
| bulb's shape | | unchanged |
| libraries | BOSL2 | none |

## Tune

All by reprinting the clip only.

| Problem | Change |
|---|---|
| bulb loose on the LED | lower `clip_bore` |
| clip stops before the bulb sits | raise `clip_bore` |
| clip cracks when snapped on | raise `clip_gap_angle` |

## Open

- The LED's socket is not measured: V2 keeps v1's bore Ø4.2. The LED passes through the neck's thread, Ø4.8 at its end.
- The thread makes the clip's C stiffer than v1's: it may not snap onto the socket without cracking. Print the clip first.
- No VeryOS logo: the bulb's wall is one line, its neck (Ø10 × 7) is covered by the ribs above 3.7, the clip is Ø7.
