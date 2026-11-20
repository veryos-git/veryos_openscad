# Table clamp for the Rode PSA-1 microphone arm

Printed table clamp (Tischklemme) for the Rode PSA-1: a C over the table edge with a blind hole for the arm's pin, and a screw with a T bar. Built from the sketch `idee.jpeg` and `readme_hgc.md`. **V3 printed in PLA (2 walls, 15 % infill): tightened hard, the lower jaw split along the layer through the thread, then the screw skipped (`problem_pla_crack.png`). A PETG-CF print with 4 walls is under way. V4's three test screws are not printed yet.**

![all parts](rendered_parts/overview.png)

| File | What |
|---|---|
| `mikrofonarm_tischklemmeV4.scad` | the generator, standalone, no libraries. `part`: both parts on the bed, assembly, each part in its print orientation |
| `mikrofonarm_tischklemmeV4_clamp.stl` | the clamp, as it prints; V3's (mesh compared) |
| `mikrofonarm_tischklemmeV4_screw_0.15.stl`, `_0.1.stl`, `_0.05.stl` | the test screws, `screw_gap` 0.15, 0.1, 0.05 |
| `archive/` | V1 to V3 scripts and STLs |
| `rendered_parts/` | every part under its name; the screw at `screw_gap` 0.1 |
| `idee.jpeg` | the sketch |
| `readme_hgc.md` | original goal |

## V4 against V3

| | V3 | V4 |
|---|---|---|
| screw | Ø16, 0.25 per side from the clamp's thread: skips when tightened hard (print); more likely because the jaw split | Ø16.5 − 2 × `screw_gap`: test 0.15, 0.1, 0.05 per side (Ø16.2, 16.3, 16.4), the gap engraved beside the bar's logo |
| clamp | | unchanged, its thread still 16.5: the printed V3 clamp takes the new screws |

Print all three screws, use the tightest one that still turns in by hand; then set `screw_gap` to it.

## V3 against V2

| | V2 | V3 |
|---|---|---|
| clamp's outer edges | sharp | 45 degree chamfer of `clamp_chamfer` 1, asked by the user: corners of the side view cut, the two side faces stepped in one 0.2 layer at a time |
| clamp's first layer | full side face | 0.9 in from the edge, so its squish does not bulge |
| logo on the block | | 0.5 lower, in the middle of the face the chamfer leaves |
| screw | | unchanged (mesh compared) |

## V2 against V1

| | V1 | V2 |
|---|---|---|
| `pin_x`, pin and screw from the spine | 14: the screw's axis 11 from a sharp table edge, its end 4 from it | 18, set by the user: 15 and 8 |
| top jaw | `top_jaw_length` 45 from the spine; a `pin_x` of 28 or more stopped the render | `top_jaw_reach` 13 beyond the block, so any `pin_x` renders |
| block with the pin far in | the outer slope would cut into the C's corner from `pin_x` 24 on | widens towards the spine; the slope meets it no lower than the top jaw's top |
| screw | | unchanged |

At `pin_x` 14, V2's clamp has V1's vertices (mesh compared).

## Parts

| Part | Qty | Prints | Note |
|---|---|---|---|
| clamp | 1 | lying on its side, 40 high | the layers run around the C, so the screw's force pulls along them, not across (lessons_learned: softbox clamp). Pin hole and thread lie level with the bed |
| screw | 1 (3 to test) | lying on its flat, the logo up | thread cut flat on the bed side, the axis 5.6 above it, as fdm_optimized_screws |

No support: no face is steeper than 45 degrees, except the 1 mm deep ceilings in the engraved logo on the clamp's block and the 0.2 wide crests of the thread at its top; the side chamfers step out 0.2 per 0.2 layer, which is 45 degrees (mesh check). More walls and infill make the C stiffer.

## Sizes

| Parameter | Default | From |
|---|---|---|
| `pin_hole_diameter`, `pin_hole_depth` | 12.6, 32 | readme_hgc.md; the pin is 12.5 × 30, measured |
| `thread_diameter`, `thread_pitch` | 16, 2, 45 degree flanks | sketch; pitch from fdm_optimized_screws |
| `thread_clearance` | 0.25 per side, sets the clamp's thread (16.5) | lessons_learned.md; kept, so the printed clamp stays |
| `screw_gap` | 0.1 per side, the screw 16.3 | test of 0.15, 0.1, 0.05: V3's 0.25 skips (print); the user wants a firmer fit that still screws in |
| `table_max`, `table_min` | 50, 10 | my choice: tables from 10 to 50 thick |
| `clamp_width`, `spine_thickness` | 40, 16 | my choice: about 17 MPa in the spine at 1 kN screw force and `pin_x` 18, estimate; more walls for a larger `pin_x` |
| `pin_x` | 18 | pin and screw axis from the spine's inner face, the screw under the pin as sketched; the user's value |
| `top_jaw_reach` | 13 | my choice, V1's 45 − 32 |
| `clamp_chamfer` | 1 | "chamfer slightly", the user; 1 is my choice, as the screw's bar |

## Design rules in the model

| Rule | Why |
|---|---|
| pin hole is a teardrop, its point up on the bed | prints without support; the round part and the two 45 degree flanks still hold the pin |
| pin hole's lowest line on a 0.2 layer boundary (`pin_y` 20.1, not 20) | the slicer would narrow it by half a layer |
| inner corners of the C rounded, r 3 | less stress at the corners; a sharp table edge then stands 3 off the spine |
| screw under the pin | as sketched; short reach, so less bending in the C |
| the screw's flat end presses on the table's underside | two parts only, so no swivel pad |
| logo in the block's face towards the table and in the bar's top | visible from the desk; on each part |

## Assembly

1. Screw the screw into the lower jaw from below.
2. Slide the clamp over the table edge, top jaw on the table.
3. Tighten with the T bar.
4. Drop the arm's pin into the hole.

## Open

| Question | Note |
|---|---|
| does the lower jaw hold? | PLA, 2 walls, 15 % infill split through the thread: the 45 degree flanks wedge it open across the layers. PETG-CF, 4 walls under way |
| which `screw_gap` holds and still turns? | print the three test screws, if the V3 screw is still loose in a jaw that holds |
| does the 12.5 pin fit the 12.6 hole? | printed holes come out smaller; raise `pin_hole_diameter` if too tight |
| table thickness range | 10 to 50 by default; change `table_max`, `table_min` |
