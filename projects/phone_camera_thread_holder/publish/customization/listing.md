# Phone mount — Customizable OpenSCAD Model

A hook clamp that holds your phone on a tripod or ball head. Two 1/4"-20 camera threads are printed straight into the slider: the one in its end holds the phone upright in landscape, the one in its back holds it flat or at any angle on a ball head tilted 90°. Push the hooks onto the phone by hand, then a short screw pulls the slider into the body and locks the grip in about five turns.

## What you can customize

Phone width and thickness with case, the clamping range, the hook width, how far the lips reach over the screen and the cavity corner radius. The lock screw is cut to phone_width, so a different phone needs only a new screw. The tripod threads, the guide and the lock screw each have their own fit clearance.

## Four examples shown

| Preset | Caption | Parameter overrides |
| --- | --- | --- |
| Everyday | 75 × 12 mm phone · 30 mm hooks | `phone_width=75`, `phone_thickness=12`, `holder_width=30`, `part="assembly"` |
| Compact phone | 66 × 12 mm phone · 30 mm hooks | `phone_width=66`, `phone_thickness=12`, `holder_width=30`, `grip_min=55`, `grip_max=80`, `part="assembly"` |
| Thick case | 80 × 16 mm phone · 30 mm hooks | `phone_width=80`, `phone_thickness=16`, `holder_width=30`, `grip_min=65`, `grip_max=95`, `part="assembly"` |
| Wide hooks | 75 × 12 mm phone · 44 mm hooks | `phone_width=75`, `phone_thickness=12`, `holder_width=44`, `part="assembly"` |

The four models use the same camera and scale within each comparison image. They are independently regenerated from the source parameters, not stretched copies. Colors are presentation choices.

## Print / assembly notes

Labels show phone_width × phone_thickness and the hook width (holder_width). The renders show the assembly; export part="print_layout" for the three printable parts. Body and slider print lying on their side, with a keel that carries the guide bar on the bed, and the screw lies on a flat cut, all without supports. Print part="thread_test" first to tune the 1/4"-20 fit with tripod_thread_clearance. These variants are digital examples and have not been print-tested.

## Customize and export

Open [`V3/phone_camera_thread_holderV3.scad`](../../V3/phone_camera_thread_holderV3.scad) in OpenSCAD. Apply a preset from the table or edit the parameters directly, render with F6, and export the required part. `presets.json` contains the four Customizer presets. The included `export-variant.mjs` can also reproduce them from `variants.json`.

The example below is run from the project folder and reproduces the first pictured view. An assembled view is for inspection; use the print view or individual part selectors described above for printing.

```sh
openscad -D phone_width=75 -D phone_thickness=12 -D holder_width=30 -D 'part="assembly"' -o example.stl V3/phone_camera_thread_holderV3.scad
```

To export any pictured preset with all values preserved, run the included helper from the project folder:

```sh
node publish/customization/export-variant.mjs Everyday example.stl
```

Append `--view=print` or `--part=print_layout` only where that selector is supported by the source, or choose an individual printable part.

## Tags

phone mount, phone holder, tripod mount, phone tripod adapter, 1/4-20, camera thread, ball head, smartphone, photography, vlogging, OpenSCAD, parametric, customizable, 3D printable

## Publication files

- `thumbnail_4x3.png` — 2400 × 1800 landscape comparison.
- `thumbnail_3x4.png` — 1800 × 2400 portrait comparison.
- `renders/01.png` through `04.png` — separate transparent CAD renders.
- `presets.json`, `variants.json`, `export-variant.mjs` — reusable pictured parameters.
- `provenance.json` — source hashes, tools and typography.

Model licensing remains with the source and repository license; this pack does not assign a new license to existing designs.
