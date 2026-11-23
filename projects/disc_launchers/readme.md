# Disc launcher

A small disc and a one-piece launcher that shoots it when its two arms are squeezed, as OpenSCAD script. Goal and inspiration: `readme_hgc.md`, `inspiration/`. **V1 is not printed. Every force, speed and friction range below comes from the script's model, not from a print.**

![all parts](rendered_parts/overview.png)

| File | What |
|---|---|
| `disc_launcher_veryos_V1.scad` | the generator, standalone, no libraries. `part`: `plate` (default), `launcher`, `disc`, `assembly` |
| `disc_launcher_veryos_V1_plate.3mf` | the default plate: launchers A to F and 6 discs, 157 × 120 × 5, 12 bodies in one object |
| `rendered_parts/` | every part under its name |
| `inspiration/`, `readme_hgc.md` | the two launchers looked at, the goal |

## Use

- Push a disc in from the front until it sits behind the two noses.
- Hold the launcher at the two pads, thumb and finger, and squeeze quickly until the arms touch.
- A disc that stays stuck between the noses was not squeezed far enough: the lips only fling it at the end of the travel.

## Names

| Name | Where | Job |
|---|---|---|
| block | the end, letter on top, logo below | joins the two arms |
| flexure | thin part of each arm behind the pad | hinge of the arm |
| pad | thick part of each arm | where the fingers squeeze |
| cam | angled end of each arm, behind the disc's widest point | closes in on the disc and pushes it forward |
| lip | thin beam outside each arm, from the pad forward | spring: bends open, then flings |
| nose | round end of each lip, in front of the disc's widest point | holds the disc, later pushes it |
| groove | in both cams and both noses | keeps the disc's edge in the launcher's plane |
| band, slope | the disc's edge: upright band between two slopes | the band is what cams and noses touch |

## Research

| Source | Says | Read |
|---|---|---|
| [Inclined-plane test of printed PLA on PLA](https://api.crossref.org/works/10.1177/1464420720978997) | static friction 0.12 to 0.38, by the angle between the two parts' lines | search summary |
| [Pin-on-disc test of printed PLA](https://yadda.icm.edu.pl/baztech/element/bwmeta1.element.baztech-8fe00cc3-68fd-45bf-be4c-e0712e79c308/c/PAWLAKWIELEBA.pdf) | sliding friction 0.35 to 0.55 | search summary |
| [Printed PLA at 18 N, by infill](https://www.emerald.com/insight/content/doi/10.1108/RPJ-03-2022-0081/full/html) | sliding friction 0.57 falling to 0.38 within an hour | search summary |
| Snap-fit design: [Fictiv](https://www.fictiv.com/articles/how-to-design-snap-fit-components), [guide at MIT](https://fab.cba.mit.edu/classes/S62.12/people/vernelle.noel/Plastic_Snap_fit_design.pdf) | force to push a part past a spring's ramp: `P (μ + tan α) / (1 − μ tan α)`; strain of a beam bent by `y`: `1.5 t y / L²` | search summary |
| [Kanoka disk launcher](https://en.brickimedia.org/wiki/Kanoka_disk_launcher) | fired by squeezing its two sides together | search summary |
| `inspiration/bionicle/Lego_Disk_Singer_v4.stl` | 71 × 50 × 9.5 measured; by eye from its top view: arms 10 apart, claws opening like a V of about 45 degrees | mesh |
| `inspiration/printables_disc_launcher/` | U spring, the disc in two slots at its ends; comments: shoots for some, not for others, "squeezing hard launched it", two broke | all |

## What holds, what launches

`φ = atan(μ)` is the friction angle. Angles of a contact are measured around the disc from its widest point, backwards positive. `F` is the force of one jaw across the launcher.

| Rule | Formula |
|---|---|
| a contact pushes the disc forward only when it lies more than φ behind the widest point | forward force of two contacts: `2 F tan(a − φ)` |
| a contact in front of the widest point, or less than φ behind it, holds: squeezing harder only clamps | force against the disc: `2 F tan(φ − a)` |
| so the hold must be a shape in front of the widest point, and the push a wedge steeper than φ | noses in front, cams at `cam_angle` behind |
| noses and cams sit on the same arm: closing the cams drives the noses into the disc's way | the lips bend by about the cams' travel, 5 to 6 mm at Ø18 |
| the bent lips are the launch spring: they push once the noses are φ behind the widest point | work `∫ 2 k u tan(a − φ) dx`, about a third of the stored `k u²` |
| before that point the cams must carry the disc: if the arms touch first, the disc stays clamped | cam travel left must be positive |
| lip as spring | `k = E h t³ / (4 L³)`, strain `1.5 t u / L²` |
| squeeze per finger | `(F_cam × arm to cam + k u × arm to nose + flexure) / arm to pad` |
| speed | `√(2 × work / mass)`, the fingers' own speed comes on top |

Friction μ 0.2, 0.35, 0.5 gives φ 11.3, 19.3, 26.6 degrees.

## The plate, by the model

Friction 0.35, PLA with E 3300 N/mm², disc Ø18 × 3 of 0.91 g, lips 32 long, launcher 5 high.

| | cam angle | lip | hold, × disc's weight | squeeze per finger | pad travel | cams close, of | lips bend | strain lip / flexure % | lips store → fling mJ | speed m/s | launches at friction |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 30 | 1.0 | 0.05 N, 6 × | 4.8 N | 1.5 | 4.2 of 7.1 | 4.9 | 0.71 / 0.73 | 3.0 → 1.0 | 1.5 | 0.1 to 0.45 |
| B | 34 | 1.0 | 0.05 N, 6 × | 4.8 N | 1.7 | 4.7 of 6.7 | 5.5 | 0.81 / 0.83 | 3.8 → 1.3 | 1.7 | 0.1 to 0.5 |
| C | 38 | 1.0 | 0.05 N, 6 × | 5.1 N | 1.9 | 5.3 of 6.4 | 6.3 | 0.93 / 0.95 | 5.0 → 1.8 | 2.0 | 0.1 to 0.4 |
| D | 30 | 1.2 | 0.09 N, 10 × | 7.7 N | 1.5 | 4.2 of 7.1 | 4.9 | 0.86 / 0.74 | 5.2 → 1.7 | 2.0 | 0.1 to 0.45 |
| E | 34 | 1.2 | 0.09 N, 10 × | 7.4 N | 1.7 | 4.7 of 6.7 | 5.6 | 0.98 / 0.83 | 6.7 → 2.3 | 2.3 | 0.1 to 0.5 |
| F | 38 | 1.2 | 0.09 N, 10 × | 7.7 N | 1.9 | 5.4 of 6.4 | 6.4 | 1.12 / 0.95 | 8.8 → 3.1 | 2.6 | 0.1 to 0.4 |

| Limit | Which launcher |
|---|---|
| low cam angle: the cams get close to the friction angle, the squeeze grows steeply | A and D need 12 and 20 N at friction 0.45, and jam above it |
| high cam angle: the arms touch before the lips take over | C and F from friction 0.45 on |
| strain above `strain_max` 1.2 % | F from friction 0.45 on: 1.31 % |

Not in the model: the fingers' speed and their force after the peak, friction changing with speed and wear, the lips' mass, the parts' tolerances, air. 1.2 % as limit for PLA springs is my choice, about 60 % of its yield strain.

## Settings

| Parameter | Default | Does |
|---|---|---|
| `cam_angle` | 34 | steeper: more squeeze travel and lip bend, more fling; shallower: nearer to the friction angle |
| `lip_thickness` | 1.0 | squeeze force, hold and stored energy go with its cube, strain with it |
| `hold` | 0.5 | each nose's reach over the disc's edge: the mouth is 1 narrower than the disc |
| `plate_cam_angles`, `plate_lip_thicknesses` | 30, 34, 38 and 1.0, 1.2 | one launcher for each pair, lettered in this order |
| `disc_diameter`, `disc_thickness` | 18, 3 | the launcher follows, except `lip_length` and `height`: the script warns or stops when they are too small |
| `rim_land`, `rim_angle` | 1, 60 | the disc's band and slopes; the grooves follow |
| `friction`, `e_modulus`, `strain_max`, `density` | 0.35, 3300, 1.2, 1.24 | the model only: the script echoes the table above for the current settings and warns |
| `play`, `z_clearance` | 0.1, 0.2 | disc between cams and noses; band in the grooves, above and below |

## Print

| | |
|---|---|
| orientation | as exported, flat, no support; the grooves' roofs are 60 degrees from the bed |
| layers | 0.2: the band, the grooves and the disc's faces lie on multiples of it |
| walls | lips 1.0 and 1.2, flexures 1.6 wide; not sliced yet |
| disc | solid, or enough top and bottom layers to fill its 3 mm |
| logo | 0.4 deep in the block's underside and in the disc's underside |
| mesh | each part closed, one body, the same volume from OpenSCAD 2021.01 and from 2026.09.16 with lazy union and Manifold |

## To find out with the print

| Question | Look at |
|---|---|
| which letters launch, and how far | all six, the same squeeze |
| does the disc stay in when the launcher is shaken | `hold`, 0.05 to 0.09 N by the model |
| do the lips survive a full squeeze, also without a disc | C and F bend most |
| does the disc slide in the grooves, or bind | `play`, `z_clearance` |
| a disc stuck between the noses after a full squeeze | friction above the launcher's range: lower `cam_angle` |
