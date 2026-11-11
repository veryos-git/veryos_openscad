# 28BYJ minimal turntable

Turntable for the 28BYJ-48 stepper motor: the shaft turns the platform directly, no gears. Two printed parts, 32 airsoft BBs, no screws. An ESP32 sets the speed from a web page on its own open WiFi. V1, not printed yet.

![assembly](preview.png)

| File | What |
|---|---|
| `28byj_minimal_turntableV1.scad` | the generator, standalone, no libraries. `part`: both parts on the bed, assembly, section, base, platform |
| `28byj_minimal_turntableV1_base.stl`, `28byj_minimal_turntableV1_platform.stl` | exported at the defaults, as they print |
| `firmware/turntable/turntable.ino` | ESP32 firmware: open WiFi, web page, stepper |
| `readme_hgc.md` | original goal |
| `image.png`, `image copy 2.png` | the motor and its datasheet drawing, source of the motor's numbers |

## Parts

| Part | Qty | Note |
|---|---|---|
| base, platform | 1 each | printed, 19.2 / 18.9 cm³ solid at the defaults |
| 28BYJ-48 5 V with ULN2003 driver board | 1 | |
| 6 mm airsoft BBs | 32 | 5.95 (`ball_d`); the script echoes the count |
| ESP32 DevKit, ESP32-WROOM-32 | 1 | |
| female-female jumper wires | 6 | |
| USB cable and 5 V supply | 1 | powers the ESP32 and the motor |

## How it works

![section](section.png)

| | |
|---|---|
| motor | stands on the base's floor, shaft on the axis, and drops in through the rim, 0.5 around its widest point, the cable box. Its ears sit on two Ø3.8 pegs, which keep it from turning; the posts under the ears stay 1 below them |
| balls | in a 90° V-groove in the rim, track Ø62. The platform rests on them with the same groove in a ring on its underside, which centres it. 2 gap between the ring and the rim |
| platform | its hub takes the shaft's flats in a 5.2 × 3.2 double-D hole, round below where the flats start and 0.5 above the longest shaft's tip: the shaft turns the platform but does not carry it |
| cable | through a 15 wide window at the back, 45° roof; the 5 pin plug (12.4 × 5.8) passes |
| logo | engraved in the front of the base's wall and near the front edge of the platform's top face |

## Sizes at the defaults

| | |
|---|---|
| base | Ø57.1 at the floor, Ø74.0 at the rim, 25.4 high |
| platform | Ø80 (`platform_d`, at least the rim), 3.2 plate (`platform_thickness`) |
| height | 32.8 to the platform's top |

## Assembly

1. Push the motor's plug out through the cable window from the inside.
2. Lower the motor in, cable box toward the window, ears onto the pegs.
3. Put the 32 balls in the rim's groove.
4. Set the platform on and turn it until the shaft's flats drop into the hub.

## Printing

![parts on the bed](parts.png)

| Part | Orientation | Overhangs |
|---|---|---|
| base | standing | the rim's flare and the window's roof, 45°; the groove opens upward |
| platform | upside down, top face on the bed, as the STL | none: ring, groove and hub face up |

Made for 0.2 mm layers: the heights that set the gap and the hub are multiples of 0.2.

## Firmware

| | |
|---|---|
| build | Arduino IDE or arduino-cli, board "ESP32 Dev Module", ESP32 core 3.x, no libraries. Compiles with core 3.3.12 for ESP32 and ESP32-S3; not run on a board yet |
| WiFi | open network `veryos-turntable`, page at http://192.168.4.1; phones show it as the network's sign-in page |
| wiring | ULN2003 IN1 IN2 IN3 IN4 → GPIO 14 27 26 25, + → VIN, − → GND, all on one side of the DevKit |
| other boards | change `PINS`; on an ESP32-S3, 25 to 27 are not free, e.g. 4 5 6 7 |
| stepping | half steps, timed apart from the web server; starts at up to 5 rpm and speeds up by 10 rpm/s; coils off when stopped |
| settings | kept in flash |

![web page](firmware/ui.png)

| Control | Does |
|---|---|
| speed | 0.1 to 15 rpm, also shown as seconds per turn |
| start / stop | turns until stopped |
| direction | clockwise or counterclockwise, seen from above |
| degrees, turn | turns that angle in the set direction, then stops; 15 gives 24 photos per turn |
| steps per turn | 4076 for the usual 63.68:1 gearbox, 4096 for 64:1. Check: turn 360 degrees |
| turn when powered on | starts at the saved speed, without a phone |

## Open points

| | |
|---|---|
| ear thickness | not in the drawing; 1 assumed |
| cable box | its height and whether it is flush with the motor's back are not in the drawing; the motor must stand on its back |
| direction | the labels follow the datasheet's sequence on the usual ULN2003 board; untested |
| load | only its weight holds the platform down: keep the load's centre inside the Ø62 track |
| speed | the 28BYJ-48 may stall above about 10 rpm at 5 V under load |
