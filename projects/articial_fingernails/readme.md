# Artificial fingernail

A long claw that slides onto a fingertip, built from OpenSCAD primitives. It is a base model: functional, deliberately plain, made to be decorated in a sculpting program.

![index preset](preview.png)

![five presets](fingers.png)

![the original next to this script](compare.png)

| File | What |
|---|---|
| `artificial_fingernail.scad` | the generator, standalone, no libraries |
| `artificial_fingernail.json` | Customizer presets: thumb, index, middle, ring, pinky |
| `stl/` | one STL per preset, the starting point for sculpting |
| `readme_hgc.md` | original description |
| `inspiration/` | photos of a printed demon nail; `other_version/` (not in git) holds the claws this is modelled after |

## Parts

| Part | Does | Made of |
|---|---|---|
| sleeve | tube over the last phalanx, narrows by `fingertip_scale` | elliptic frustum, `wall` thick |
| slit | lets the sleeve open over the finger, on the pad side | `slit_w` wide, whole sleeve |
| knuckle notch | frees the knuckle at the open end, nail side | gable, 45° roof, `knuckle_notch_h` high |
| pad opening | the fingertip's pad is free `tip_free` from the tip down | slope at 55°, then the blade's sides taper at 78° |
| blade | continues the nail `claw_length` past the tip, bends `claw_bend`° towards the nail side in an arc, leans back `claw_lean` on top | ellipses across a spine, narrowing as √(1 − t), hulled segment by segment |
| scoop | hollows the blade's underside; the blade is `wall` thick at its base, `blade_thickness` at the scoop's round end ¾ up | smaller ellipses on the same spine, swept towards the pad |
| facets | `facets` = 6…16 makes the outside a prism, flat on the nail side; 0 is smooth | `$fn` of the outside only; the cavity stays smooth |
| logo | VeryOS logo, 0.4 deep on the nail side of the sleeve, above the notch | `linear_extrude()` minus an inset frustum |

## Against the original

Measured on `inspiration/other_version/…/obj_4_Top.obj(2).stl`, the set for an 18 mm middle finger. The first version of this script followed `demon nails` instead, a ring and a hood with a solid cone: it looked like a cone on a tube, see git history.

| | Original | This script, index preset |
|---|---|---|
| sleeve | round, 1.2–1.6 thick, inside Ø13.4 at the open end, Ø12.8 at the top | elliptic 14 × 12 at the open end, × 0.92 at the top, wall 1.6 |
| pad side | slit 2.5 wide, legs fall away at about 55° from z = 28 | slit 2, legs fall away at 55° from `tip_free` |
| knuckle | notch 8 high on the nail side | notch 7 high, 45° roof |
| blade | hollow, 3.5 thick at its back, bends towards the nail | hollow, scoop ends ¾ up, bends 20°, leans 2 |
| surface | hand-sculpted facets | smooth, or a prism with `facets` |
| size, w × d × h | 18.5 × 23.9 × 73.4 | 17.2 × 25.1 × 64.4 |

## Fit

Not printed yet. All fits are untested.

| Parameter | Measure |
|---|---|
| `finger_length` | fingertip to the crease of the last joint, along the finger |
| `finger_w` | finger's width at that crease |
| `finger_h` | finger's thickness, nail to pad, at that crease |
| `fingertip_scale` | finger's width about 7 mm from the tip ÷ `finger_w` |
| `clearance` | added to width and thickness; default 0, the slit lets the sleeve open |
| `tip_free` | how much of the pad is free; longer frees more, grips less |

## Print

- Standing as worn: open end on the bed, tip up. No supports: nothing overhangs more than 45°.
- 0.2 mm layers.
- The thin blade prints slowly at minimum layer time; a second part on the bed gives each layer time to cool.

## Sculpting

- Import the STL, voxel remesh it first: OpenSCAD's long thin triangles do not sculpt.
- Keep the cavity, the slit and the pad opening as they are: they set the fit.
- Keep the walls 1.2 mm or more.
- Keep 45° or less on overhangs, or plan supports.
