# Patterned wipes box — Customizable OpenSCAD Model

Seven exterior pattern options, a locating cover seat and a hinged dispensing lid. Adjust the body width, depth and height independently in OpenSCAD, from a long refill box to a compact cube or a taller stack holder.

## What you can customize

Body dimensions, opening dimensions, wall thickness, magnet pockets and hinge clearances. The opening follows the box proportions when opening_width and opening_depth are zero.

## Four examples shown

| Preset | Caption | Parameter overrides |
| --- | --- | --- |
| Everyday | 200 × 120 × 65 mm | `box_width=200`, `box_depth=120`, `box_height=65`, `part="assembly"`, `lid_angle=0` |
| Cube | 120 × 120 × 120 mm | `box_width=120`, `box_depth=120`, `box_height=120`, `hinge_middle_length=12`, `opening_width=68`, `part="assembly"`, `lid_angle=0` |
| Long | 260 × 100 × 65 mm | `box_width=260`, `box_depth=100`, `box_height=65`, `part="assembly"`, `lid_angle=0` |
| Tall | 160 × 120 × 145 mm | `box_width=160`, `box_depth=120`, `box_height=145`, `part="assembly"`, `lid_angle=0` |

The four models use the same camera and scale within each comparison image. They are independently regenerated from the source parameters, not stretched copies. Colors are presentation choices.

## Print / assembly notes

Labels show the box_width × box_depth × box_height settings, before exterior relief and the cover/hinge. Measure the refill first: interior space is reduced by walls and magnet posts. The cube and tall examples suit folded wipes or tissues. Export with part="print_layout"; use the project assembly notes for magnets and the filament hinge pin. These new sizes are digital examples, without fit or sealing tests.

## Customize and export

Open [`babywipesboxV2.scad`](../../babywipesboxV2.scad) in OpenSCAD. Apply a preset from the table or edit the parameters directly, render with F6, and export the required part. `presets.json` contains the four Customizer presets. The included `export-variant.mjs` can also reproduce them from `variants.json`.

The example below is run from the project folder and reproduces the first pictured view. An assembled view is for inspection; use the print view or individual part selectors described above for printing.

```sh
openscad -D box_width=200 -D box_depth=120 -D box_height=65 -D 'part="assembly"' -D lid_angle=0 -o example.stl babywipesboxV2.scad
```

To export any pictured preset with all values preserved, run the included helper from the project folder:

```sh
node publish/customization/export-variant.mjs Everyday example.stl
```

Append `--view=print` or `--part=print_layout` only where that selector is supported by the source, or choose an individual printable part.

## Tags

wipes box, tissue holder, magnetic lid, hinged lid, storage, bathroom, OpenSCAD, parametric, customizable, 3D printable

## Publication files

- `thumbnail_4x3.png` — 2400 × 1800 landscape comparison.
- `thumbnail_3x4.png` — 1800 × 2400 portrait comparison.
- `renders/01.png` through `04.png` — separate transparent CAD renders.
- `presets.json`, `variants.json`, `export-variant.mjs` — reusable pictured parameters.
- `provenance.json` — source hashes, tools and typography.

Model licensing remains with the source and repository license; this pack does not assign a new license to existing designs.
