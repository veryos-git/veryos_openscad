# Textured screw-top jars — Customizable OpenSCAD Model

A cylindrical container and matching screw lid generated from editable OpenSCAD dimensions. Change the body proportions while preserving the wall and thread settings. Seven exterior patterns add another way to customize the result.

## What you can customize

Outer diameter, overall height, lid height, neck and thread dimensions, fit clearance, surface pattern and relief.

## Four examples shown

| Preset | Caption | Parameter overrides |
| --- | --- | --- |
| Pocket | Ø32 × 50 mm | `outer_diameter=32`, `full_height=50`, `lid_height=15`, `view="assembled"`, `exterior_pattern="ribs"`, `pattern_count=36` |
| Everyday | Ø40 × 80 mm | `view="assembled"`, `exterior_pattern="flutes"`, `pattern_count=36` |
| Wide | Ø70 × 50 mm | `outer_diameter=70`, `full_height=50`, `lid_height=15`, `view="assembled"`, `exterior_pattern="diamond"`, `pattern_count=36` |
| Tall | Ø45 × 120 mm | `outer_diameter=45`, `full_height=120`, `view="assembled"`, `exterior_pattern="spiral"`, `pattern_count=36` |

The four models use the same camera and scale within each comparison image. They are independently regenerated from the source parameters, not stretched copies. Colors are presentation choices.

## Print / assembly notes

Labels show nominal outer diameter × full_height, before any pattern relief or alignment-stop allowance. Renders show assemblies; use view="print" for separate printable parts. Check thread fit with a small print. No verified airtight or liquid-tight seal is claimed.

## Customize and export

Open [`simple_cylindrical_screwing_containerV2.scad`](../../simple_cylindrical_screwing_containerV2.scad) in OpenSCAD. Apply a preset from the table or edit the parameters directly, render with F6, and export the required part. `presets.json` contains the four Customizer presets. The included `export-variant.mjs` can also reproduce them from `variants.json`.

The example below is run from the project folder and reproduces the first pictured view. An assembled view is for inspection; use the print view or individual part selectors described above for printing.

```sh
openscad -D outer_diameter=32 -D full_height=50 -D lid_height=15 -D 'view="assembled"' -D 'exterior_pattern="ribs"' -D pattern_count=36 -o example.stl simple_cylindrical_screwing_containerV2.scad
```

To export any pictured preset with all values preserved, run the included helper from the project folder:

```sh
node publish/customization/export-variant.mjs Pocket example.stl
```

Append `--view=print` or `--part=print_layout` only where that selector is supported by the source, or choose an individual printable part.

## Tags

container, screw lid, storage, jar, parametric box, OpenSCAD, parametric, customizable, 3D printable

## Publication files

- `thumbnail_4x3.png` — 2400 × 1800 landscape comparison.
- `thumbnail_3x4.png` — 1800 × 2400 portrait comparison.
- `renders/01.png` through `04.png` — separate transparent CAD renders.
- `presets.json`, `variants.json`, `export-variant.mjs` — reusable pictured parameters.
- `provenance.json` — source hashes, tools and typography.

Model licensing remains with the source and repository license; this pack does not assign a new license to existing designs.
