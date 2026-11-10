// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Enclosure V1 for an unofficial ESP32 dev board (ESP32-WROOM-32, USB-C,
// 2 x 15 pins), measured by hand in dimensions.png: board 52 x 28.6, USB-C
// 1 mm proud of one short edge, 13 high from the pin tips to the top of the
// parts. Two parts, no hardware: base and snap-on lid.
//
// The board lies in the base with the pins down. It rests on a block in each
// corner, clear of the headers, and the walls locate it. The mounting holes
// are not used: their distance across the board is not in the drawing. Four
// legs under the lid's corners hold the board down. The lid's lip carries a
// bead on each long side that snaps into a groove in the wall. A notch in
// the wall opposite the USB port lets a fingernail under the lid.
//
// Print the base as is, the lid top face down (lip and legs point up). No
// support. Origin: outer front left bottom corner of the base, USB end at
// x = 0. Units: mm.

/* [View] */
part = "print_layout"; // [print_layout:Base and lid on the bed,assembly:Assembly with the board,base:Base,lid:Lid]

/* [Version] */
// Engraved in the base. Bump it together with the file name.
version = "V1";
engraving = str("ESP32 case ", version);
text_size = 3.5;
// The brand's heading font, see the brand section of the workspace readme
text_font = "DejaVu Sans Mono:style=Bold";

/* [Board, measured] */
board_l = 52;
board_w = 28.6;
pcb_t = 1.6;
// USB-C shell beyond the board's edge
usb_out = 1;
// Board underside to the pin tips: 13 overall less the board and about 3.2 of
// parts on top leaves 8.2
pins_h = 8.2;

/* [Box] */
wall = 2;
floor_t = 2;
lid_t = 2;
outer_corner_r = 3;
// Board to wall, per side
fit = 0.3;
// Floor top to board underside
under = 9;
// Board top to lid underside: the USB-C plug's overmould reaches 4.9 above
// the board
top_room = 5.4;
// Block under each corner of the board, square, from the wall's inner face.
// The headers start about 7 mm from the board's ends.
support = 4.5;

/* [USB window] */
// For the plug's overmould (about 12.4 x 6.5), which enters the wall. Open to
// the wall's top, the lid closes it.
usb_w = 13;
// Window's bottom below the board top
usb_below = 2.2;

/* [Lid] */
// Lip under the lid, inside the walls
lip_w = 1.2;
lip_h = 2.6;
lip_gap = 0.2;
// Leg under each corner, square, from the wall's inner face, down to the
// board less leg_gap
leg = 3.8;
leg_gap = 0.2;
// Snap: bead on the lip's long sides, 45 degree flanks, bead_h proud of the
// lip, centre snap_z below the lid's underside
bead_h = 0.6;
bead_len = 20;
snap_z = 1.6;
// The groove sits this much lower than the bead, so its upper flank lies on
// the bead's and holds the lid down
groove_drop = 0.2;
// Fingernail notch in the wall opposite the USB port
notch_w = 10;
notch_h = 1;
// Vent slots across the lid
vent_n = 5;
vent_w = 1.6;
vent_len = 14;
vent_pitch = 3.6;
// Centre of the slots from the USB end
vent_x = 20;

/* [Logo] */
logo_depth = 0.6;
lid_logo_w = 18;
// Centre of the lid's logo from the USB end
lid_logo_x = 42;
floor_logo_w = 16;

/* [Hidden] */
eps = 0.01;
$fn = 48;

inner_x = board_l + 2 * fit;
inner_y = board_w + 2 * fit;
outer_x = inner_x + 2 * wall;
outer_y = inner_y + 2 * wall;
board_top = floor_t + under + pcb_t;
wall_top = board_top + top_room;
outer_h = wall_top + lid_t;

echo(str("outer ", outer_x, " x ", outer_y, " x ", outer_h, " mm"));

if (part == "print_layout") {
    base();
    translate([0, 2 * outer_y + 10, lid_t]) rotate([180, 0, 0]) lid();
} else if (part == "assembly") {
    base();
    translate([0, 0, wall_top + 15]) lid();
    %board();
} else if (part == "base") {
    base();
} else if (part == "lid") {
    lid();
}

module rounded_rect(x, y, r) {
    hull() for (px = [r, x - r], py = [r, y - r]) translate([px, py]) circle(r = r);
}

// The room inside the walls.
module inner() {
    translate([wall, wall]) rounded_rect(inner_x, inner_y, outer_corner_r - wall);
}

// Bead or groove: prism along x, centred on the origin, h proud toward +y.
module snap(len, h) {
    rotate([90, 0, 90]) linear_extrude(len, center = true)
        polygon([[-0.1, -h - 0.1], [h, 0], [-0.1, h + 0.1]]);
}

// The snap on both long walls: bead toward the wall, or groove into it.
module snaps(len, y_in, z) {
    for (m = [0, 1])
        translate([outer_x / 2, m ? outer_y - wall - y_in : wall + y_in, z])
            mirror([0, m ? 0 : 1, 0]) snap(len, bead_h);
}

module base() {
    difference() {
        union() {
            difference() {
                linear_extrude(wall_top) rounded_rect(outer_x, outer_y, outer_corner_r);
                translate([0, 0, floor_t]) linear_extrude(wall_top) inner();
            }
            // corner blocks under the board
            for (x = [wall - eps, outer_x - wall - support], y = [wall - eps, outer_y - wall - support])
                translate([x, y, floor_t - eps]) cube([support + eps, support + eps, under + eps]);
        }
        // USB window
        translate([-1, (outer_y - usb_w) / 2, board_top - usb_below])
            cube([wall + 2, usb_w, wall_top]);
        // grooves for the lid's beads
        snaps(bead_len + 1, 0, wall_top - snap_z - groove_drop);
        // fingernail notch
        translate([outer_x - wall + 0.8, (outer_y - notch_w) / 2, wall_top - notch_h])
            cube([wall, notch_w, notch_h + 1]);
        // logo, name and version in the bottom, reading from below
        translate([outer_x / 2, outer_y / 2, 0]) mirror([0, 0, 1]) mirror([1, 0, 0]) {
            translate([0, 4.5, 0]) logo_cut(floor_logo_w);
            translate([0, -7, -logo_depth]) linear_extrude(logo_depth + 1)
                text(engraving, size = text_size, font = text_font, halign = "center", valign = "center");
        }
    }
}

// Top face on z = lid_t, lip and legs hang below z = 0.
module lid() {
    difference() {
        union() {
            linear_extrude(lid_t) rounded_rect(outer_x, outer_y, outer_corner_r);
            // lip along the long sides and round the corners, open at both
            // ends: above the USB port and above the module's can
            translate([0, 0, -lip_h]) linear_extrude(lip_h + eps) difference() {
                offset(delta = -lip_gap) inner();
                offset(delta = -lip_gap - lip_w) inner();
                translate([0, (outer_y - usb_w) / 2 - 1]) square([outer_x, usb_w + 2]);
            }
            // legs onto the board's corners
            translate([0, 0, -(top_room - leg_gap)]) linear_extrude(top_room - leg_gap + eps)
                intersection() {
                    offset(delta = -lip_gap) inner();
                    for (x = [wall, outer_x - wall - leg], y = [wall, outer_y - wall - leg])
                        translate([x, y]) square(leg);
                }
            snaps(bead_len, lip_gap, -snap_z);
        }
        for (i = [0 : vent_n - 1])
            translate([vent_x + (i - (vent_n - 1) / 2) * vent_pitch - vent_w / 2, (outer_y - vent_len) / 2, -1])
                cube([vent_w, vent_len, lid_t + 2]);
        translate([lid_logo_x, outer_y / 2, lid_t]) logo_cut(lid_logo_w);
    }
}

// The board, for the assembly view.
module board() {
    translate([wall + fit, wall + fit, floor_t + under]) {
        color("black") cube([board_l, board_w, pcb_t]);
        // ESP32-WROOM-32 module: can, and the antenna at the far end
        color("silver") translate([board_l - 25.5, (board_w - 18) / 2, pcb_t]) cube([19.3, 18, 3.1]);
        color("dimgray") translate([board_l - 6.2, (board_w - 18) / 2, pcb_t]) cube([6.2, 18, 0.8]);
        // USB-C
        color("silver") translate([-usb_out, (board_w - 9) / 2, pcb_t]) cube([7.4, 9, 3.2]);
        // headers, 2 x 15
        for (y = [0.2, board_w - 2.74]) {
            color("black") translate([(board_l - 38.1) / 2, y, -2.5]) cube([38.1, 2.54, 2.5]);
            for (k = [0 : 14]) color("gold")
                translate([(board_l - 38.1) / 2 + 0.95 + 2.54 * k, y + 0.95, -pins_h]) cube([0.64, 0.64, pins_h]);
        }
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
