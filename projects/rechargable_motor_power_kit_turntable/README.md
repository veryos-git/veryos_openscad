# Rechargeable Power Kit turntable

Turntable for Bambu Lab's Rechargeable Power Kit (ZC003): an N20 gear motor, a 500 mAh LiPo battery and a board with a USB-C socket and a push switch. A printed worm on the motor turns a hoop of teeth under the platform; the number of teeth sets the speed. Three printed parts and the kit, nothing else. V1, not printed yet.

![assembly](preview.png)

| File | What |
|---|---|
| `rechargable_motor_power_kit_turntableV1.scad` | the generator, standalone, no libraries. `part`: all parts on the bed, assembly, assembly without the platform, section, base, platform, worm |
| `rechargable_motor_power_kit_turntableV1_base.stl`, `_platform.stl`, `_worm.stl` | exported at the defaults, as they print |
| `readme_hgc.md` | original goal |
| `image.png`, `image copy.png` | the kit and its wiring, Bambu Lab's pictures |
| `Rechargeable Power Kit-ZC003 model/` | Bambu Lab's CAD model of the kit, source of every kit dimension in the script; not committed |

## Parts

| Part | Qty | Note |
|---|---|---|
| base, platform, worm | 1 each | printed, 44.3 / 58.7 / 1.1 cm³ solid at the defaults |
| Bambu Lab Rechargeable Power Kit ZC003 | 1 | motor, battery, board; its five screws are not used |
| USB-C cable | 1 | to charge |

## Size and speed

| Parameter | Default | Does |
|---|---|---|
| `turntable_d` | 150 | the platform's diameter; at least the base + 2 |
| `rpm` | 6 | wanted turns per minute. The hoop gets `motor_rpm` / `rpm` teeth, rounded; the script echoes the real speed |
| `motor_rpm` | 500 | the motor's speed, as Bambu Lab states it for the kit |
| `tooth_pitch` | 2.5 | from tooth to tooth. 2 gives a base 14 smaller for the same speed, with finer teeth; 3 a base 12 larger, with coarser ones |
| `platform_thickness` | 3 | |

One turn of the worm moves the hoop one tooth, so slower means more teeth, a larger hoop and a larger base. The base is always as small as the hoop and the kit beside it allow; a larger `turntable_d` only widens the platform. At `motor_rpm` 500 and `tooth_pitch` 2.5:

| `rpm` | Teeth | Real rpm | Seconds per turn | Hoop | Base | Smallest `turntable_d` |
|---|---|---|---|---|---|---|
| 3 | 167 | 2.99 | 20.0 | 132.9 | 208 | 210 |
| 4 | 125 | 4.00 | 15.0 | 99.5 | 174 | 176 |
| 5 | 100 | 5.00 | 12.0 | 79.6 | 154 | 156 |
| 6 | 83 | 6.02 | 10.0 | 66.0 | 142 | 144 |
| 8 | 63 | 7.94 | 7.6 | 50.1 | 126 | 128 |
| 10 | 50 | 10.00 | 6.0 | 39.8 | 116 | 118 |
| 12 | 42 | 11.90 | 5.0 | 33.4 | 110 | 112 |

The speed is not exact: a DC motor slows down under load and as the battery empties. To correct it, count the platform's turns in a minute, multiply by the teeth and put the result in `motor_rpm`.

## How it works

![section through the worm](section.png)

![base with the kit](open.png)

| | |
|---|---|
| worm | on the motor's D-shaft, Ø13 over the thread, 10.5 long. Its thread is the 45° thread of `fdm_optimized_screws` at 2.5 pitch, 1.0 deep, so it prints standing without support. Its root is 0.5 wider than the motor, so the hoop's teeth pass the motor |
| hoop | 83 teeth under the platform, pitch Ø66.0: involutes with a 45° pressure angle, which fit the thread's straight flanks, leaning 3.8° like the thread. Their lower ends are chamfered, so they find their way into the worm |
| play | 0.35 along the hoop (`backlash`), 0.25 between the thread's crest and the bottom of the teeth (`tip_clearance`). The worm only ever pushes one way, so the play costs nothing |
| bearing | the platform's Ø8 pin turns in a tube in the middle of the base and stands on the floor inside it: the load slides on a Ø6 face, close to the axis |
| tipping | the platform's underside runs 0.4 (`tilt_gap`) above the top of the base's wall; a load off centre leans it onto the wall |
| motor | lies in a pocket, flats upright, on a pad that puts the worm 0.6 above the floor. A wall in front of the gearbox with a slot for the shaft, a rib behind the rear beside the terminals, a wall on each side, and a tab whose hook snaps 0.5 over the gearbox. A block 0.8 behind the worm's closed end keeps it on the shaft |
| board | lies on two ledges, 1.6 above the floor, behind a flat panel in the wall: two guides along its sides, two stops behind its corners, a wedge on the panel over its front edge. The panel has an opening for the USB-C plug (13 × 7.4, for the plug's grip), a hole for the switch's plunger, which stands 2 proud of the panel, and a slit that shows the charging light |
| battery | lies loose in a fence 5 high beside the board, open at the corner where its wire leaves |
| guard | a wall around the hoop keeps the wires out of the teeth |
| logo | engraved in the front of the base's wall, in the platform's top face and in the worm's closed end |

## Sizes at the defaults

| | |
|---|---|
| base | Ø142, 16.8 high, flat panel 30 wide at the back |
| platform | Ø150, 3 thick |
| height | 20.2 to the platform's top |

## Assembly

1. Push the worm onto the motor's shaft, flat on flat, until the shaft's tip stops in it.
2. Press the motor into its pocket: flats upright, the side where the wires leave towards the middle of the base, the shaft down the slot, until the hook snaps over the gearbox.
3. Plug the motor into the board's socket beside the switch (CN-MOTO) and the battery into the one beside it (CN-BAT). The plugs only fit one way.
4. Put the board in tilted, front edge first: USB-C socket and switch into their openings, the front edge under the wedge, then lower the rear behind the two stops.
5. Lay the battery in its fence, the wire towards the board.
6. Lower the platform, pin into the tube, and turn it a little until the teeth drop into the worm.
7. Press the switch.

The worm cannot be driven backwards: do not turn the platform by hand, lift it off instead.

## Printing

![parts on the bed](parts.png)

| Part | Orientation | Overhangs |
|---|---|---|
| base | standing | the hook and the wedge, 45°; flat bridges over the three openings in the panel, 9, 4.6 and 2.4 long |
| platform | upside down, top face on the bed, as the STL | none: pin and hoop face up |
| worm | standing on its closed end, bore up, as the STL | the thread's flanks, 45° |

Made for 0.2 mm layers: the base's wall, its floor and the pin's end are on multiples of 0.2.

## Tuning

| Problem | Change |
|---|---|
| too fast or too slow | `motor_rpm` = counted turns per minute × teeth |
| the teeth bind | `backlash` 0.45 |
| the teeth skip under load | `pin_clearance` 0.2, `backlash` 0.25 |
| worm tight or loose on the shaft | `shaft_clearance`, 0.2 |
| platform rubs on the base's wall | `tilt_gap` 0.6 |

## Checked in the model

| Check | Result |
|---|---|
| worm turned through a full turn in five steps, hoop advanced one tooth per turn | never touch |
| hoop shifted 0.4 × `backlash` either way | free |
| hoop shifted 0.65 × `backlash` either way | the flanks touch |
| motor, worm, board, battery and platform in their places | touch nothing they should not |
| motor pushed straight down into its pocket | only the hook is in its way, 0.5 |
| board tilted 6°, 0.6 back, then pushed forward | free |
| board in its place, front edge lifted 0.6 | the wedge holds it |
| collisions and the gear's play again at `rpm` 3, 4 and 10 and at `tooth_pitch` 2 and 3 | the same |

## Open points

| | |
|---|---|
| motor speed | 500 rpm is Bambu Lab's number for the kit; at which voltage is not stated, and the board feeds the motor from the battery, 3.7 V. Expect to correct `motor_rpm` |
| direction | set by the plugs; unknown which way the platform turns |
| torque | a worm with 45° flanks loses most of the motor's power to friction, about 85 to 90 % by estimate. Untested how much load it turns |
| run time | unknown |
| shaft | 2.7 across the flat by the CAD model; N20 shafts usually have 2.5. The bore follows the CAD model, which fits both |
| charging light | its place on the board is read from the photo, not from the CAD model |
| USB-C plug | the opening is for a grip up to 13 × 7.4 |
| load | only its weight holds the platform down; a platform much wider than the base tips with a load on its edge |
