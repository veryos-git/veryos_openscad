// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// OMM enclosure V7 (the version is also engraved in the parts, see version
// below): V6 without the ESP32 pocket's side wall toward the drivers, which
// hid what wire sits on what pin. V6 put windows under the ESP32 for the
// jumper wires to the drivers, which V5's closed pocket kept in, and made the
// box 10 mm higher, the ESP32 with it, so the wires have room to bend out
// under the dupont housings. V5 put a slot in the front wall for the 5 V
// supply cable, V4 slit the end walls of the power rail's pocket for the 5 V
// cables, V3 put the ESP32 pocket of ../ESP32_S3_WROOM_Case.stl in place of
// the cradle from Espressif's DXF, which the 28 mm wide board did not fit.
// archive/ keeps V1 to V6.
// Box for the electronics of the open microscope motorization. Holds an
// ESP32-S3 WROOM-1 dev board, three ULN2003 driver boards and a breadboard
// power rail. Lid with four M3 screws into the corner posts.
//
// The ESP32 has no mounting holes and its pin headers run under both long
// edges, so it sits in the pocket of the printed case that fits it
// (../ESP32_S3_WROOM_Case.stl, measured in the STL): the board rests on a
// rail beside each header, the headers hang in slots along the side walls and
// the slots' ends locate the board lengthwise. The pocket stands 30 mm above
// the floor and the slots are open to the floor, so the jumper wires plug on
// the pins from below. Toward the drivers the pocket has no side wall beside
// the pins, only a stub at the antenna end: that header, its wires and the
// board's edge above them stay in sight. Windows under the board through
// both rails let the far header's wires out toward the drivers. Four pillars
// on the lid hold the board down: two on
// the module's metal can, two on the USB-C shells, the only flat spots on
// top.
//
// Back wall (y = outer_y): USB-C window for the ESP32, one U slot per driver
// for the motor cable. The lid's tabs close the slots down to the cable and
// only fit one way round, so the pillars always land where they should.
// Front wall (y = 0): the power rail's pocket, with a slit through each end
// wall for the 5 V cables that plug into the rail's end holes, and a U slot
// for the 5 V supply cable between the ESP32's pocket and the rail's, in
// line with the rail's left slit. The lid's tab closes it like the motor
// cable slots.
// The outside of the walls and the lid's edge carry the ribs of the OMM XY
// table (measured in OMM_v2p2.3mf): stadiums 4 wide, 3 proud, 15 apart. They
// match the table and give the first layer more edge to hold on to.
//
// Print the base as is, the lid top face down (the pillars and tabs point up).
// Origin: outer front left bottom corner of the base. Units: mm.

/* [View] */
part = "print_layout"; // [print_layout:Base and lid on the bed,assembly:Assembly with the boards,open:Base with the boards,base:Base,lid:Lid]

/* [Version] */
// Engraved in every part with the project's name. Bump it together with the
// file name, omm_enclosureV7.scad.
version = "V7";
engraving = str("VeryOS OMM enclosure ", version);
text_size = 6;
// The brand's heading font, see the brand section of the workspace readme
text_font = "DejaVu Sans Mono:style=Bold";

/* [Box] */
wall = 2.4;
floor_t = 3;
lid_t = 3;
// Free height inside, floor top to lid underside
inner_h = 40;
outer_corner_r = 3;
// Corner post for the lid screws, square
post = 7;
// M3 thread forming, untested; 45 degree chamfer at the entry
screw_hole = 2.7;
screw_hole_depth = 12;
screw_chamfer = 0.6;
// Clearance hole and counterbore for M3 pan heads in the lid
lid_hole = 3.4;
counterbore_d = 6.5;
counterbore_h = 1.5;
// Lip under the lid, inside the walls
lip_w = 1.2;
lip_h = 2;
lip_gap = 0.3;

/* [Ribs] */
// Vertical ribs on the outside of the walls, as on the XY table: stadiums of
// rib_r radius with a rib_flat long flat, rib_out proud of the wall
rib_r = 4;
rib_flat = 5.4;
rib_out = 3;
rib_pitch = 15;
// Least distance from a corner to a rib's end
rib_margin = 5;

/* [ESP32-S3 WROOM-1 board] */
// The pocket of ../ESP32_S3_WROOM_Case.stl, measured in the STL. Pocket
// coordinates: x across from the left wall's inner face, y from the back
// wall's inner face (USB end) toward the antenna end, z from the floor top.
// Pocket between the side walls and between the back wall and the end wall.
// The side wall at x < 0, toward the drivers, is only a stub at the end wall.
esp_pocket_w = 28.55;
esp_pocket_len = 64.55;
esp_wall = 2;
// Slot for each header along the side wall, from the back wall to
// esp_slot_end short of the end wall: the headers' ends locate the board
esp_slot_w = 3.3;
esp_slot_end = 7;
// Rail beside each slot that the board rests on: width of the top, width
// below the step, height of the top part
esp_rail_w = 0.95;
esp_rail_base_w = 2;
esp_rail_step = 2;
pcb_t = 1.6;
// Floor top to board underside: dupont housings on the pins below (2.5
// header, 14 housing) and room under them for the wires to bend out through
// the windows
esp_under = 30;
// Windows under the board through both rails, for the jumper wires from the
// far header: number, width along the board, pillar between two, height to
// the eaves of the 45 degree roof, which prints without support
esp_window_n = 3;
esp_window_w = 14;
esp_window_gap = 4;
esp_window_h = 14;
// Module can: width, centred on the pocket; height above the board; where
// the lid's pillars press on it, from the end wall
mod_w = 18;
mod_h = 3.1;
mod_pad_y = [10, 14];
// USB-C ports: centres' distance, centred on the pocket; shell height
usb_dx = 12;
usb_h = 3.3;
// Window for both plugs' overmoulds, which together span the board's width
usb_window_w = 27;
usb_window_h = 8;
// Lid pillar to can or shell
pillar_gap = 0.2;

/* [ULN2003 driver boards] */
uln_n = 3;
uln_x = 34.6;
uln_y = 31.8;
uln_hole_dx = 29.6;
uln_hole_dy = 26.6;
// JST XH motor plug, from the board's left edge (IN pins at the left)
uln_jst_x = 22.5;
uln_standoff_d = 6;
uln_standoff_h = 5;
uln_gap = 4;

/* [Breadboard power rail] */
// Pocket for the rail as in the driver board holder of current_setup
// (ULN2003_Driver_Module_board_holder_veryos_stls, measured in its STL): the
// rail's chaining tab at one end, its slot at the other and the dovetail
// bumps on its sides have their places, so it fits one way round only.
// Pocket length between its end walls and width
rail_len = 82.1;
rail_w = 9.7;
rail_pocket_h = 8;
rail_wall = 3;
// Chaining tab and slot, centred on the ends: width, and length, which is
// also the depth of the side jogs
rail_tab_w = 3.6;
rail_tab = 1.2;
// Side jogs: centres from the pocket's ends, length of the bump on the
// drivers' side, length of the notch on the wall side
rail_jog_pos = 14.2;
rail_jog_in = 3.6;
rail_jog_out = 4.4;
// Slit through each end wall, open to the top, down to the pocket's floor,
// centred on the rail: the 5 V cables plugged into the rail's end holes
// leave through it. Takes the chaining tab with it; the side jogs still fix
// the rail's orientation.
rail_slit_w = 4;

/* [Cable slots] */
// U slot in the back wall, open to the top, fits a JST XH 5 pin plug
cable_slot_w = 16;
cable_slot_h = 12;
// Left open under the lid's tab, for the ribbon cable
cable_pass_h = 5;
// U slot in the front wall for the 5 V supply cable, same height and tab
supply_slot_w = 8;

/* [Feet] */
feet_d = 10;
feet_depth = 1;
feet_inset = 10;

/* [Logo] */
logo_depth = 0.6;
lid_logo_w = 40;
floor_logo_w = 15;

/* [Hidden] */
eps = 0.01;
$fn = 48;

// ---- layout ----
// ESP32 pocket along y at the left, its left wall on the corner posts, USB-C
// ports at the back wall.
esp_top = esp_under + pcb_t;                 // board top above the floor top
esp_x0 = wall + post;                        // pocket's left wall, inner face
// As V2: keeps the room for the floor logo between the drivers and the rail
inner_y = 71.8;
// Drivers in a row to the right of the ESP32, JST plugs toward the back
uln_x0 = esp_x0 + esp_pocket_w + esp_wall + 1;
uln_pitch = uln_x + uln_gap;
uln_y1 = wall + inner_y - post - 1;          // boards' back edge
uln_y0 = uln_y1 - uln_y;
inner_x = uln_x0 - wall + uln_n * uln_x + (uln_n - 1) * uln_gap + 2;
outer_x = inner_x + 2 * wall;
outer_y = inner_y + 2 * wall;
outer_h = floor_t + inner_h + lid_t;
// Rail along the front wall, under the drivers; its block reaches rail_depth
// into the box
rail_cx = uln_x0 + (uln_n * uln_x + (uln_n - 1) * uln_gap) / 2;
rail_x0 = rail_cx - (rail_len + rail_tab) / 2;
rail_depth = rail_w + rail_tab + 2 * rail_wall;
post_centers = [for (x = [wall + post / 2, outer_x - wall - post / 2])
                for (y = [wall + post / 2, outer_y - wall - post / 2]) [x, y]];
usb_cx = esp_x0 + esp_pocket_w / 2;
usb_cz = floor_t + esp_top + 1.65;
cable_slot_x = [for (k = [0 : uln_n - 1]) uln_x0 + k * uln_pitch + uln_jst_x];
// Between the ESP32 pocket's right wall and the rail block's left end
supply_slot_x = (esp_x0 + esp_pocket_w + esp_wall + rail_x0 - rail_wall) / 2;
// All U slots: x, width, y of the wall's outer face, direction into the box
wall_slots = concat([for (x = cable_slot_x) [x, cable_slot_w, outer_y, -1]],
                    [[supply_slot_x, supply_slot_w, 0, 1]]);

echo(str("outer ", outer_x, " x ", outer_y, " x ", outer_h, " mm, over the ribs ",
         outer_x + 2 * rib_out, " x ", outer_y + 2 * rib_out));

// ---- parts ----
if (part == "print_layout") {
    base();
    translate([outer_x + 2 * rib_out + 10, outer_y, lid_t]) rotate([180, 0, 0]) lid();
} else if (part == "assembly") {
    base();
    translate([0, 0, floor_t + inner_h + 25]) lid();
    %boards();
} else if (part == "open") {
    base();
    %boards();
} else if (part == "base") {
    base();
} else if (part == "lid") {
    lid();
}

module rounded_rect(x, y, r) {
    hull() for (px = [r, x - r], py = [r, y - r]) translate([px, py]) circle(r = r);
}

// The walls' outside with the ribs. Each side gets as many ribs as fit with
// rib_margin to the corners, centred on the side.
module outline() {
    rounded_rect(outer_x, outer_y, outer_corner_r);
    for (s = [[0, 0, 0, outer_x], [outer_x, 0, 90, outer_y],
              [outer_x, outer_y, 180, outer_x], [0, outer_y, 270, outer_y]])
        translate([s[0], s[1]]) rotate(s[2]) ribs(s[3]);
}

// Ribs along a side from the origin along +x, outside toward -y.
module ribs(len) {
    rib_len = rib_flat + 2 * rib_r;
    n = floor((len - 2 * rib_margin - rib_len) / rib_pitch) + 1;
    x0 = (len - (n - 1) * rib_pitch - rib_len) / 2 + rib_r;
    for (i = [0 : n - 1]) hull() for (dx = [0, rib_flat])
        translate([x0 + i * rib_pitch + dx, rib_r - rib_out]) circle(r = rib_r);
}

module base() {
    difference() {
        union() {
            difference() {
                linear_extrude(outer_h - lid_t) outline();
                translate([wall, wall, floor_t]) cube([inner_x, inner_y, inner_h + 1]);
            }
            for (p = post_centers) translate([p[0] - post / 2, p[1] - post / 2, floor_t - eps])
                cube([post, post, inner_h + eps]);
            translate([0, 0, floor_t - eps]) {
                at_esp() difference() { esp_cradle(); esp_windows(); }
                uln_standoffs();
                rail_tray();
            }
        }
        for (p = post_centers) translate([p[0], p[1], floor_t + inner_h]) screw_hole_cut(screw_hole_depth);
        // USB-C window
        translate([usb_cx - usb_window_w / 2, outer_y - wall - eps, usb_cz - usb_window_h / 2])
            cube([usb_window_w, wall + rib_out + 1, usb_window_h]);
        // motor cable slots and the supply cable's slot
        for (s = wall_slots)
            translate([s[0] - s[1] / 2, s[2] + (s[3] < 0 ? -wall - 1 : -rib_out - 1), floor_t + inner_h - cable_slot_h])
                cube([s[1], wall + rib_out + 2, cable_slot_h + 1]);
        // feet
        for (x = [feet_inset, outer_x - feet_inset], y = [feet_inset, outer_y - feet_inset])
            translate([x, y, -1]) cylinder(d = feet_d, h = feet_depth + 1);
        // logo in the floor, between the drivers and the rail
        translate([rail_cx, (wall + rail_depth + uln_y0) / 2, floor_t])
            logo_cut(floor_logo_w);
        // name and version in the bottom, reading from below
        translate([outer_x / 2, outer_y / 2, 0]) mirror([0, 0, 1]) mirror([1, 0, 0]) text_cut();
    }
}

// The engraving, centred on the origin, logo_depth into z < 0.
module text_cut() {
    translate([0, 0, -logo_depth]) linear_extrude(logo_depth + 1)
        text(engraving, size = text_size, font = text_font, halign = "center", valign = "center");
}

// Pocket coordinates of the ESP32 (x across from the left wall's inner face,
// y from the back wall's inner face, z from the floor top) into the box.
module at_esp() {
    translate([esp_x0 + esp_pocket_w, wall + inner_y, 0]) rotate(180) children();
}

// The pocket, in pocket coordinates: side walls and end wall, a rail beside
// each slot and the slots' end blocks. The slots stay open to the floor.
module esp_cradle() {
    // end wall across the pocket
    translate([-esp_wall, esp_pocket_len, 0])
        cube([esp_pocket_w + 2 * esp_wall, esp_wall, esp_top + 2]);
    for (m = [0, 1]) translate([m ? esp_pocket_w : 0, 0, 0]) mirror([m, 0, 0]) {
        // side wall; at x < 0, toward the drivers, only beside the slot's end
        // block, so nothing stands in front of that header's pins
        side_y0 = m ? 0 : esp_pocket_len - esp_slot_end;
        translate([-esp_wall, side_y0, 0])
            cube([esp_wall, esp_pocket_len + esp_wall - side_y0, esp_top + 2]);
        // rail: the board rests on its top, the step clears parts under the board
        translate([esp_slot_w, 0, 0]) cube([esp_rail_w, esp_pocket_len + eps, esp_under]);
        translate([esp_slot_w, 0, 0]) cube([esp_rail_base_w, esp_pocket_len + eps, esp_under - esp_rail_step]);
        // slot's end: stops the header's antenna end
        translate([0, esp_pocket_len - esp_slot_end, 0])
            cube([esp_slot_w + esp_rail_base_w, esp_slot_end + eps, esp_under]);
    }
}

// The windows, in pocket coordinates: through both rails, not the far side
// wall; centred between the back wall and the slots' end blocks.
module esp_windows() {
    span = esp_window_n * esp_window_w + (esp_window_n - 1) * esp_window_gap;
    y0 = (esp_pocket_len - esp_slot_end - span) / 2;
    for (i = [0 : esp_window_n - 1])
        translate([-1, y0 + i * (esp_window_w + esp_window_gap), 0])
            rotate([90, 0, 90]) linear_extrude(esp_pocket_w - esp_slot_w + 2)
                polygon([[0, -1], [esp_window_w, -1], [esp_window_w, esp_window_h],
                          [esp_window_w / 2, esp_window_h + esp_window_w / 2], [0, esp_window_h]]);
}

module uln_standoffs() {
    for (k = [0 : uln_n - 1], dx = [-1, 1], dy = [-1, 1])
        translate([uln_x0 + k * uln_pitch + uln_x / 2 + dx * uln_hole_dx / 2,
                   (uln_y0 + uln_y1) / 2 + dy * uln_hole_dy / 2, 0])
            difference() {
                cylinder(d = uln_standoff_d, h = uln_standoff_h);
                translate([0, 0, uln_standoff_h]) screw_hole_cut(uln_standoff_h + 2);
            }
}

// Thread forming hole, depth deep from z = 0 downwards, chamfered at the top.
module screw_hole_cut(depth) {
    translate([0, 0, -depth]) cylinder(d = screw_hole, h = depth + 1);
    translate([0, 0, -screw_chamfer]) cylinder(d1 = screw_hole, d2 = screw_hole + 2 * screw_chamfer + 2, h = screw_chamfer + 1);
}

// Block against the front wall with the rail's pocket; the pocket's wall side
// faces the front wall, its bump side the drivers.
module rail_tray() {
    translate([rail_x0, wall, 0]) difference() {
        translate([-rail_wall, 0, 0])
            cube([rail_len + rail_tab + 2 * rail_wall, rail_depth, rail_pocket_h]);
        translate([0, rail_depth - rail_wall, -1]) mirror([0, 1, 0])
            linear_extrude(rail_pocket_h + 2) rail_pocket_2d();
        // slits through the end walls
        for (x = [-rail_wall - 1, rail_len - eps])
            translate([x, rail_depth - rail_wall - (rail_w + rail_slit_w) / 2, -1])
                cube([rail_wall + rail_tab + 1 + eps, rail_slit_w, rail_pocket_h + 2]);
    }
}

// The pocket, x along the rail from the slot end, y across from the bump side.
module rail_pocket_2d() {
    jogs = [rail_jog_pos, rail_len - rail_jog_pos];
    difference() {
        union() {
            square([rail_len, rail_w]);
            // notch for the rail's chaining tab
            translate([rail_len - eps, (rail_w - rail_tab_w) / 2]) square([rail_tab + eps, rail_tab_w]);
            for (x = jogs) translate([x - rail_jog_out / 2, rail_w - eps]) square([rail_jog_out, rail_tab + eps]);
        }
        // tab into the rail's chaining slot
        translate([-1, (rail_w - rail_tab_w) / 2]) square([rail_tab + 1, rail_tab_w]);
        for (x = jogs) translate([x - rail_jog_in / 2, -1]) square([rail_jog_in, rail_tab + 1]);
    }
}

// Top face on z = lid_t, pillars and tabs hang below z = 0.
module lid() {
    difference() {
        union() {
            linear_extrude(lid_t) outline();
            // lip
            translate([0, 0, -lip_h]) linear_extrude(lip_h + eps) difference() {
                translate([wall + lip_gap, wall + lip_gap])
                    square([inner_x - 2 * lip_gap, inner_y - 2 * lip_gap]);
                translate([wall + lip_gap + lip_w, wall + lip_gap + lip_w])
                    square([inner_x - 2 * lip_gap - 2 * lip_w, inner_y - 2 * lip_gap - 2 * lip_w]);
                for (p = post_centers) translate([p[0], p[1]])
                    square(post + 2 * lip_gap, center = true);
            }
            // tabs into the cable slots
            for (s = wall_slots)
                translate([s[0] - s[1] / 2 + 0.3, s[2] + (s[3] < 0 ? -wall + 0.2 : 0.2), -(cable_slot_h - cable_pass_h)])
                    cube([s[1] - 0.6, wall - 0.4, cable_slot_h - cable_pass_h + eps]);
            at_esp() esp_pillars();
        }
        for (p = post_centers) translate([p[0], p[1], -1]) {
            cylinder(d = lid_hole, h = lid_t + 2);
            translate([0, 0, lid_t + 1 - counterbore_h]) cylinder(d = counterbore_d, h = counterbore_h + 1);
        }
        translate([outer_x / 2, outer_y / 2, lid_t]) logo_cut(lid_logo_w);
        // name and version under the logo
        translate([outer_x / 2, outer_y / 2 - lid_logo_w * logo_r / logo_w - text_size, lid_t]) text_cut();
    }
}

// Four pillars from the lid's underside, in pocket coordinates: on the can at
// both edges of the module, on both USB-C shells.
module esp_pillars() {
    for (m = [0, 1]) translate([m ? esp_pocket_w : 0, 0, 0]) mirror([m, 0, 0]) {
        pillar([(esp_pocket_w - mod_w) / 2 + 0.5, esp_pocket_len - mod_pad_y[1]],
               [4, mod_pad_y[1] - mod_pad_y[0]], esp_top + mod_h);
        pillar([(esp_pocket_w - usb_dx) / 2 - 1.5, 2], [3, 3], esp_top + usb_h);
    }
}

// Pad at, size pad, standing on height z above the floor top; root 1 mm wider
// all round.
module pillar(at, pad, z) {
    len = inner_h - z - pillar_gap;
    hull() {
        translate([at[0], at[1], -len]) cube([pad[0], pad[1], eps]);
        translate([at[0] - 1, at[1] - 1, -3]) cube([pad[0] + 2, pad[1] + 2, 3 + eps]);
    }
}

// The boards, for the assembly view.
module boards() {
    translate([0, 0, floor_t]) {
        // a 28 x 63.5 board with 2 x 22 pins, as far as the case tells
        at_esp() translate([(esp_pocket_w - 28) / 2, 0.5, esp_under]) {
            color("darkgreen") cube([28, 63.5, pcb_t]);
            color("silver") translate([5, 63.5 - 25.5, pcb_t]) cube([mod_w, 25.5, mod_h]);
            for (x = [14 - usb_dx / 2, 14 + usb_dx / 2])
                color("silver") translate([x - 4.5, -1.3, pcb_t]) cube([9, 8.3, usb_h]);
            for (m = [0, 1]) translate([m ? 28 : 0, 0, 0]) mirror([m, 0, 0]) {
                color("black") translate([0.05, 63.5 - esp_slot_end - 55.88, -2.5]) cube([2.54, 55.88, 2.5]);
                for (k = [0 : 21]) color("gold")
                    translate([1.32 - 0.32, 63.5 - esp_slot_end - 1.27 - 2.54 * k - 0.32, -8.5]) cube([0.64, 0.64, 8.5]);
            }
        }
        for (k = [0 : uln_n - 1]) translate([uln_x0 + k * uln_pitch, uln_y0, uln_standoff_h]) {
            color("green") cube([uln_x, uln_y, pcb_t]);
            color("white") translate([uln_jst_x - 3, uln_y - 18, pcb_t]) cube([6, 14, 7]);
        }
        color("white") translate([rail_x0, wall + rail_wall + rail_tab, 0]) cube([rail_len, rail_w, 9]);
    }
}

// ---- logo ----
// The VeryOS logo at the size of veryos_logo.svg, as in veryos_logo_cube: a
// ring and the two arms of a V, all logo_stroke wide.
logo_r = 15.6264133379;
logo_stroke = 5;
logo_angle = 22.5;
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;

// Engraving, width wide, centred on the origin, logo_depth into z < 0.
module logo_cut(width) {
    translate([0, 0, -logo_depth]) linear_extrude(logo_depth + 1)
        scale(width / logo_w) translate([0, -logo_r]) logo();
}

module logo() {
    difference() {
        union() {
            translate([0, logo_r]) circle(r = logo_r);
            for (m = [0, 1]) mirror([m, 0])
                translate([logo_b, 0]) rotate(-logo_angle)
                    translate([-logo_stroke, 0]) square([logo_stroke, logo_arm]);
            polygon([[-logo_b, 0], [logo_b, 0],
                     [logo_b + logo_r * tan(logo_angle), logo_r],
                     [-logo_b - logo_r * tan(logo_angle), logo_r]]);
        }
        translate([0, logo_r]) for (a = [0, 180]) rotate(a) s_hole();
    }
}

module s_hole() {
    difference() {
        intersection() {
            circle(r = ring_in);
            translate([0, -ring_in]) square(2 * ring_in);
        }
        translate([0, -(ring_in - s_small)]) circle(r = s_big);
    }
    translate([0, ring_in - s_small]) circle(r = s_small);
}
