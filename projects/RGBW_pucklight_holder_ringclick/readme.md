holder for the RGBW puck light (62 mm KC007), as `../RGBW_pucklight_holder`
V4, but a ring presses the lens instead of a cross of ribs, so nothing
crosses the light under a transparent lampshade. The lens clicks wherever it
is pressed, also at its edge (tested by hand, 2026-11-11).

![sketch](image.png)

# OpenSCAD

`RGBW_pucklight_holder_ringclickV2.scad` generates the three parts: top
part, bottom screw, click base. `part` shows all parts on the bed, the
assembly, the assembly cut in half, or one part.

![preview](preview.png)

![section](section.png)

The window's edge on the lens, cut in half:

![ring](section_ring.png)

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

| | holder V4 | ringclick V2 |
|---|---|---|
| presses the lens | cross of 1.6 × 1.6 ribs, at the centre | the window's 45 degree edge, all around at 34 (`contact_d`) |
| lens covered, seen from above | two 1.6 strips, 10 % | the outer ring from 34 to 40, 28 % |
| top face | 30.2 | 30.2, `ring_thickness` 1.8 above the edge |
| highest point | rib tops, 34.1 | the lens, 32.5 |
| top part prints | standing; the ribs bridge 30 | upside down; no bridges |
| guiding pins | four | none, as pucklight_sphere V2 |
| body | 76 mm square | round, 74.7 mm across at the bottom |

## how it clicks

| state | what touches |
|---|---|
| puck on the screw's floor | the lens is 0.7 (`puck_play`) under the window's edge |
| on the base, released | the tube lifts the puck 0.7 until the lens touches the edge; the holder floats 0.9 above the base |
| pressed down | the tube pushes the button 0.7; the ring's flat underside stays 0.81 above the flat ring around the lens |

- the ring must not reach the flat ring around the lens: that is the puck's housing, which does not move, so the click would stop there. The assert on `contact_d` checks it.
- the lens's height at 34 comes from the CAD model's 40 × 5.8 spherical cap; the real lens is unmeasured there.
- without pins the holder can turn on the base. That turns the top part against the screw, whose bar sits in the slot: lift the holder off the base to turn it.

## printing

| part | orientation | overhangs |
|---|---|---|
| `toppart` | upside down, top face on the bed (as `print_layout`) | the window's chamfer and the two outer cones, 45 degrees; the cavity narrows from the bottom face up to the window's edge, so every other layer sits on the one below |
| `bottom_screw` | standing as used | 45 degree flange cone and thread |
| `clickbase` | standing as used | none |

## tuning

| problem | change |
|---|---|
| no click, or the click is weak | lower `puck_play`, or raise `press_height` and reprint only the click base |
| the puck rattles in the holder | lower `puck_play` |
| the lens covers less or more than 40 in the real puck | set `contact_d` at least 1 below the lens's diameter: the puck shifts 0.5 sideways |

## assembly

1. Put the puck into the top part from below, lens first.
2. Screw in the bottom screw with its bar until it is flush with the bottom.
3. Put the holder on the click base, the bar in the slot; the base turns freely to meet the bar.

## logo

The VeryOS logo is engraved 0.6 mm deep (`logo_depth`) in every part: 10 wide in the top face of the top part, 8 wide in the bottom of the screw's flange, 14 wide in the bottom of the click base.
