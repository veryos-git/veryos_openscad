# OMM enclosure

Box for the electronics of the open microscope motorization: an ESP32-S3 WROOM-1 dev board, three ULN2003 driver boards and a breadboard power rail. Replaces the food box in `current_setup/`. V5, not printed yet.

![assembly](preview.png)

![base with the boards](open.png)

![base and lid on the bed](parts.png)

| File | What |
|---|---|
| `omm_enclosureV5.scad` | the generator, standalone, no libraries. `version` at its top is engraved in every part with the project's name; bump it with the file name |
| `omm_enclosureV5_base.stl`, `omm_enclosureV5_lid.stl` | exported from the generator with the brand font, for slicers and viewers without DejaVu |
| `archive/` | every earlier version, script and STLs. Each change to the generator makes a new version file; the old one stays |
| `readme_hgc.md` | original goal |
| `current_setup/` | photos of the setup it replaces |
| `image*.png` | the boards, with the ULN2003 drawing |
| `../ESP32_S3_WROOM_Case.stl` | printed case that fits the ESP32 board, source of the pocket in the generator |
| `DXF_ESP32-S3-DevKitC-1_V1.1_20220429.dxf` | Espressif's drawing of the official board, source of V1 and V2's cradle, which the board did not fit |

## V5 against V4

| Asked for | V4 | V5 |
|---|---|---|
| An entry for the 5 V supply cable | none, cables leave through the motor slots | 8 mm U slot in the front wall between the ESP32 pocket and the rail pocket, in line with the rail's left slit, closed to 5 mm by a lid tab |

## V4 against V3

| Asked for | V3 | V4 |
|---|---|---|
| A slit for the 5 V cables at each end of the power rail | closed end walls | 4 mm slit through each end wall, open to the top, down to the pocket's floor |

## V3 against V2

| Asked for | V2 | V3 |
|---|---|---|
| The ESP32 does not fit | cradle from Espressif's DXF: 25.4 wide board between posts, bar and pads under it | the pocket of `ESP32_S3_WROOM_Case.stl`: 64.55 × 28.55 between walls, the board on two rails beside the header slots, the slots' ends locate it |

## V2 against V1

| Asked for | V1 | V2 |
|---|---|---|
| Better fit for the power rail | plain tray 84 × 10, 3 high, 0.4 clearance | the pocket of the printed driver board holder, 82.1 × 9.7, 8 deep, with tab, notch and side jogs |
| Screw holes | 2.8 | 2.7 |

## Layout

Outer 157.15 × 76.6 × 36 mm over the walls, 163.15 × 82.6 over the ribs. Front wall y = 0; the motor cables leave through the back wall, the 5 V supply cable comes in through the front wall.

The walls and the lid's edge carry the ribs of the XY table (`current_setup/xy_table_omm/`), measured in `OMM_v2p2.3mf`: stadiums of radius 4 with a 5.4 flat, 3 proud of the wall, 15 apart, centred on each side. They match the table and give the first layer more edge.

| Part | Where | Held by |
|---|---|---|
| ESP32-S3 WROOM-1 board | left, along the depth, USB-C ports at the back wall | the pocket of `ESP32_S3_WROOM_Case.stl`, 64.55 × 28.55 between 2 mm walls, 20 mm above the floor: the board rests on a 0.95 wide rail beside each header, the headers hang in 3.3 wide slots along the walls, open to the floor so the jumper wires fit on the pins below; the slots end 7 mm before the end wall and stop the headers; the lid's four pillars press on the module's can and the USB-C shells, the only flat spots on top |
| 3 × ULN2003 | row at the right, JST plugs toward the back, IN pins toward the ESP32 | Ø6 × 5 standoffs on the 29.6 × 26.6 hole pattern, M3 × 6 thread forming |
| power rail | along the front wall, under the drivers | the pocket of the driver board holder in `current_setup/`, measured in its STL: 82.1 × 9.7, 8 deep, with a notch for the rail's chaining tab and the side jogs for its dovetails, so it fits one way round only; a 4 mm slit through each end wall, open to the top, lets the 5 V cables out of the rail's end holes |
| lid | 4 × M3 × 10 into the corner posts | lip inside the walls, tabs in the four cable slots: fits one way round only |

| Opening | Where | Size |
|---|---|---|
| USB-C window | back wall, both ports | 27 × 8: both plugs' overmoulds together span the board's width |
| motor cable slot | back wall, behind each JST plug | 16 wide, open to the top for the plug; the lid's tab closes it to 5 mm |
| supply cable slot | front wall, between the ESP32 pocket and the rail pocket, in line with the rail's left slit | 8 wide, open to the top; the lid's tab closes it to 5 mm |
| feet | bottom, four corners | Ø10 × 1 recess for stick-on feet |
| logo | lid top 40 wide, floor 15 wide between the drivers and the rail | 0.6 deep |
| name and version | lid top under the logo, base bottom reading from below | 6 mm DejaVu Sans Mono Bold, the brand's heading font, 0.6 deep |

## Print

| Part | Orientation | Why |
|---|---|---|
| base | as is | no supports; the window bridges 27 mm |
| lid | top face down | pillars and tabs point up; the logo is engraved in the bed face |

0.2 mm layers, no supports.

## Check before printing

| What | Set to | Note |
|---|---|---|
| `rail_len`, `rail_w` | 82.1 × 9.7 | the pocket of your printed holder, which fits the rail |
| `rail_slit_w` | 4 | the slit in the pocket's end walls: two jumper wires side by side, not a dupont housing |
| `supply_slot_w`, `cable_pass_h` | 8, 5 | the supply cable's slot and what the lid's tab leaves open: fits a 2-core cable up to 5 mm; a plug or strain relief must go in before the lid |
| `esp_pocket_len`, `esp_pocket_w`, `esp_slot_w`, `esp_slot_end` | 64.55 × 28.55, 3.3, 7 | the pocket of `ESP32_S3_WROOM_Case.stl`, which fits the board; the board itself is not measured |
| `mod_pad_y`, `usb_dx` | 10–14 from the end wall, 12 | where the lid's pillars land: on the can, which the case vents 7.6–24.4 from its end wall, and on the two USB-C shells, whose windows in the case are 12 apart |
| `mod_h`, `usb_h` | 3.1, 3.3 | height of the module's can and of the USB-C shells above the board: the lid's pillars stop 0.2 above them, measure yours |
| `esp_under` | 20 | room under the board for the dupont housings on the pins: 2.5 header, 14 housing, wire bend |
| `screw_hole` | 2.7 | M3 thread forming, 0.6 chamfer at the entry, untested, see `lessons_learned.md` |

Pocket, slots, rails and the USB-C windows come from `ESP32_S3_WROOM_Case.stl` (pocket 64.55 × 28.55 inside 2 mm walls; slots 3.3 wide from the USB end wall to 7 before the antenna end wall; rails 0.95 wide, 7 above the case floor; two 9 × 3.7 windows 12 apart, centred). The official DXF (62.74 × 25.4) does not describe this board.
