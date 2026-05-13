# Magnet Wall Mount

A 3D-printable wall bracket that holds a Neodymium magnet flush against a wall with two screws. Useful when you want a magnetic spot on a non-ferrous wall — for keys, tools, planters, signage, etc.

## Features

- Single piece, prints flat, no supports needed
- Counterbored screw holes — heads sit flush with the top face
- Chamfered outer edges
- Parametric: works for **rectangular** *and* **round** magnets
  - 9 rectangular presets (10 × 5 × 1 mm up to 50 × 10 × 3 mm)
  - 21 round presets (Ø 2 × 2 mm up to Ø 25 × 3 mm)
  - Or any custom dimensions
- Default hardware is M4; screw size and counterbore are configurable

## Hardware

- 2 × M4 screws (length depends on wall thickness; ~20–30 mm typical with drywall + anchor)
- 2 × wall anchors / dowels appropriate to your wall
- 1 × Neodymium magnet (matching the chosen preset / dimensions)

## Print settings

| Setting       | Recommended |
|---------------|-------------|
| Layer height  | 0.2 mm |
| Walls         | 3 |
| Top/bottom    | 4 layers |
| Infill        | 20 % |
| Supports      | None |
| Orientation   | Top (counterbored) face on the build plate |

See `slicing_example.png` for the layout used in the slicer (one round-magnet variant and one rectangular-magnet variant printed in the same job).

## Assembly

1. Print the bracket.
2. Drop the magnet into the pocket on the wall-side face.
3. Hold the bracket against the wall with the magnet inside the pocket — the wall closes the pocket and traps the magnet.
4. Drive the screws through the counterbored holes into the wall (or into wall anchors).

## Customization

Open the `.scad` source in OpenSCAD and use the customizer panel:

- **Magnet preset** — pick from the dropdown, or `Custom rectangular` / `Custom round`
- **Custom rectangular magnet** — `length`, `width`, `height`
- **Custom round magnet** — `diameter`, `thickness`
- **Bracket** — wall thicknesses, screw-holder width, edge chamfer
- **Screw** — shaft diameter, head diameter, counterbore depth, minimum floor

## Files in this folder

- `README.md` — this file (also intended as the publication description)
- `slicing_example.png` — slicer layout screenshot
- `*.3mf` — printable model bundle (TODO)
- print photos (TODO)

## License

MIT — see the repository root.
