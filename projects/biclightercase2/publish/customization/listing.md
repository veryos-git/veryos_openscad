# Textured lighter case — Customizable OpenSCAD Model

A slim sleeve designed around the BIC Maxi J26 dimensions, with seven selectable exterior patterns. These four examples use the same cavity and change only the surface geometry.

## What you can customize

Choose the pattern, then adjust repeat count, relief, pitch and twist. Lighter width, depth and fit clearance remain independently editable.

## Four examples shown

| Preset | Caption | Parameter overrides |
| --- | --- | --- |
| Fine ribs | 24 repeats | `exterior_pattern="ribs"`, `pattern_count=24` |
| Broad flutes | 12 repeats | `exterior_pattern="flutes"`, `pattern_count=12` |
| Spiral | 180° twist | `exterior_pattern="spiral"`, `pattern_count=24`, `pattern_twist=180` |
| Diamond | 10 mm pitch | `exterior_pattern="diamond"`, `pattern_count=24` |

The four models use the same camera and scale within each comparison image. They are independently regenerated from the source parameters, not stretched copies. Colors are presentation choices.

## Print / assembly notes

Shown: ribs, broad flutes, spiral and diamond; smooth, waves and chevron are also available. The current source uses 0.22 mm fit clearance per side. Print upright and check the fit on your own printer. BIC/Maxi identify intended compatibility; this is an independent design.

## Customize and export

Open [`bic_lighter_case.scad`](../../bic_lighter_case.scad) in OpenSCAD. Apply a preset from the table or edit the parameters directly, render with F6, and export the required part. `presets.json` contains the four Customizer presets. The included `export-variant.mjs` can also reproduce them from `variants.json`.

The example below is run from the project folder and reproduces the first pictured view. An assembled view is for inspection; use the print view or individual part selectors described above for printing.

```sh
openscad -D 'exterior_pattern="ribs"' -D pattern_count=24 -o example.stl bic_lighter_case.scad
```

To export any pictured preset with all values preserved, run the included helper from the project folder:

```sh
node publish/customization/export-variant.mjs 'Fine ribs' example.stl
```

Append `--view=print` or `--part=print_layout` only where that selector is supported by the source, or choose an individual printable part.

## Tags

BIC Maxi, J26, lighter case, texture, ribs, spiral, diamond, OpenSCAD, parametric, customizable, 3D printable

## Publication files

- `thumbnail_4x3.png` — 2400 × 1800 landscape comparison.
- `thumbnail_3x4.png` — 1800 × 2400 portrait comparison.
- `renders/01.png` through `04.png` — separate transparent CAD renders.
- `presets.json`, `variants.json`, `export-variant.mjs` — reusable pictured parameters.
- `provenance.json` — source hashes, tools and typography.

Model licensing remains with the source and repository license; this pack does not assign a new license to existing designs.
