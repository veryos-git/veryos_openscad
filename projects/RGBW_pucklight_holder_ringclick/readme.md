holder for the RGBW puck light (62 mm KC007), as `../RGBW_pucklight_holder`
V4, but a ring presses the lens instead of a cross of ribs, so nothing
crosses the light under a transparent lampshade. The lens clicks wherever it
is pressed, also at its edge (tested by hand, 2026-11-11).

![sketch](image.png)

# OpenSCAD

`RGBW_pucklight_holder_ringclickV3.scad` generates the three parts: top
part, bottom screw, click base. `part` shows all parts on the bed, the
assembly, the assembly cut in half, or one part.

![preview](preview.png)

![section](section.png)

The window's edge on the lens, cut in half:

![ring](section_ring.png)

## V3 against V2

| | V2 | V3 |
|---|---|---|
| window's edge on the lens (`contact_d`) | 34 | 36, 12 % more window |
| ring's underside | flat at the window's edge | cavity_gap 0.5 above the flat ring around the lens, pressed in; a 0.42 high, 0.87 wide lip inside the lens's rim reaches down to the edge |
| tube (`press_height`) | 1.6, button travel 0.7: did not click reliably | 1.8, travel 0.9 |
| top face | 30.2 | 30.1 |
| top part's logo | 10 wide | 9 wide, the top face is narrower |
| solid volume: top part / base | 16.0 / 5.0 cm³ | 15.8 / 5.1 cm³ |

## V2 against V1

| | V1 | V2 |
|---|---|---|
| top part | 76 mm square block, `wall` 2.25 at the thinnest | round shell, `wall` 1.6 all over, 45 degree cones outside |
| click base | 76 mm square plate, 2 thick, solid 50 mm disc | round plate, 1.2 thick (`base_thickness`), 2 mm tube (`press_wall`), open inside |
| top part's logo | 20 wide, in the front | 10 wide, in the top face |
| base's logo | 18 wide, in the top of the disc | 14 wide, in the bottom |
| `logo_depth` | 1 | 0.6 |
| solid volume: top part / screw / base | 74.7 / 11.2 / 22.9 cm³ | 16.0 / 11.2 / 5.0 cm³ |
| all, solid PLA | 135 g | 40 g, −70 % |

## against RGBW_pucklight_holderV4

| | holder V4 | ringclick V3 |
|---|---|---|
| presses the lens | cross of 1.6 × 1.6 ribs, at the centre | the window's 45 degree edge, all around at 36 (`contact_d`) |
| lens covered, seen from above | two 1.6 strips, 10 % | the outer ring from 36 to 40, 19 % |
| top face | 30.2 | 30.1, `ring_thickness` 1.8 above the flat ring around the lens |
| highest point | rib tops, 34.1 | the lens, 32.5 |
| top part prints | standing; the ribs bridge 30 | upside down; no bridges |
| guiding pins | four | none, as pucklight_sphere V2 |
| body | 76 mm square | round, 74.7 mm across at the bottom |

## how it clicks

| state | what touches |
|---|---|
| puck on the screw's floor | the lens is 0.7 (`puck_play`) under the window's edge |
| on the base, released | the tube lifts the puck 0.7 until the lens touches the edge; the holder floats 0.9 above the base (1.1 in the model, which leaves out the 0.2 hollow in the puck's bottom) |
| pressed down | the tube pushes the button 0.9; the ring's underside stays 0.5 (`cavity_gap`) above the flat ring around the lens, the lip 0.5 off its inner edge, also with the puck 0.5 off centre |

- the ring must not reach the flat ring around the lens: that is the puck's housing, which does not move, so the click would stop there. Only the lip, inside the lens's rim, reaches below `cavity_gap` above it; the assert on `contact_d` keeps the lip two lines wide.
- the lens's height at 34 comes from the CAD model's 40 × 5.8 spherical cap; the real lens is unmeasured there.
- without pins the holder can turn on the base. That turns the top part against the screw, whose bar sits in the slot: lift the holder off the base to turn it.

## printing

| part | orientation | overhangs |
|---|---|---|
| `toppart` | upside down, top face on the bed (as `print_layout`) | the window's chamfer and the two outer cones, 45 degrees; the lip's outer 45 degree cone faces up; the cavity narrows from the bottom face up to the window's edge, so every other layer sits on the one below |
| `bottom_screw` | standing as used | 45 degree flange cone and thread |
| `clickbase` | standing as used | none |

## tuning

| problem | change |
|---|---|
| no click, or the click is weak | raise `press_height` and reprint only the click base: each 0.1 above the printed top part's takes 0.1 off its `cavity_gap`; or lower `puck_play` |
| the puck rattles in the holder | lower `puck_play` |
| the lens covers less or more than 40 in the real puck | change `puck_dome_d`: the lip follows the lens's rim |

## assembly

1. Put the puck into the top part from below, lens first.
2. Screw in the bottom screw with its bar until it is flush with the bottom.
3. Put the holder on the click base, the bar in the slot; the base turns freely to meet the bar.

## logo

The VeryOS logo is engraved 0.6 mm deep (`logo_depth`) in every part: 9 wide in the top face of the top part, 8 wide in the bottom of the screw's flange, 14 wide in the bottom of the click base.
