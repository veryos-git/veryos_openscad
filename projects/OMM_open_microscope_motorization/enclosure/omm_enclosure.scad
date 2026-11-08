// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// OMM enclosure V1: box for the electronics of the open microscope
// motorization. Holds an ESP32-S3-DevKitC-1, three ULN2003 driver boards and
// a breadboard power rail. Lid with four M3 screws into the corner posts.
//
// The ESP32 has no mounting holes and its pin headers run under both long
// edges to the antenna end, so it lies on a bar between the headers at the
// antenna end and on two pads beside the USB-C legs at the USB end, 20 mm
// above the floor: the jumper wires plug on the pins from below. An end stop
// under the module's overhang, posts against the headers' ends and posts
// beside the headers locate it. Four pillars on the lid hold it down: two on
// the module's metal can, two on the USB-C shells, the only flat spots on top.
// Board geometry per Espressif's DXF_ESP32-S3-DevKitC-1_V1.1_20220429.dxf.
//
// Back wall (y = outer_y): USB-C window for the ESP32, one U slot per driver
// for the motor cable. The lid's tabs close the slots down to the cable and
// only fit one way round, so the pillars always land where they should.
// Front wall (y = 0): the power rail's tray.
//
// Print the base as is, the lid top face down (the pillars and tabs point up).
// Origin: outer front left bottom corner of the base. Units: mm.

/* [View] */
part = "print_layout"; // [print_layout:Base and lid on the bed,assembly:Assembly with the boards,open:Base with the boards,base:Base,lid:Lid]

/* [Box] */
wall = 2.4;
floor_t = 3;
lid_t = 3;
// Free height inside, floor top to lid underside
inner_h = 30;
outer_corner_r = 3;
// Corner post for the lid screws, square
post = 7;
// M3 thread forming, untested
screw_hole = 2.6;
screw_hole_depth = 12;
// Clearance hole and counterbore for M3 pan heads in the lid
lid_hole = 3.4;
counterbore_d = 6.5;
counterbore_h = 1.5;
// Lip under the lid, inside the walls
lip_w = 1.2;
lip_h = 2;
lip_gap = 0.3;

/* [ESP32-S3-DevKitC-1] */
// Board coordinates as in the DXF: x from the left edge, y from the USB-C end.
esp_len = 62.8;
esp_w = 25.4;
pcb_t = 1.6;
// Around the board and its headers
esp_gap = 0.4;
// Floor top to board underside: dupont housings on the pins below
esp_under = 20;
// Pin headers under both long edges: past the edge, in from the edge, y range
hdr_out = 0.25;
hdr_in = 2.8;
hdr_y = [6.44, 62.82];
// Module: x range, overhang past the antenna end, height above the board
mod_x = [3.75, 21.75];
mod_overhang = 6.3;
mod_h = 3.1;
// Where the lid's pillars press on the module's can, y range
mod_pad_y = [48, 52];
// USB-C ports: shell centres, shell height, legs' solder on the underside at
// x 2.1-2.75, 9.25-9.9, 15.5-16.15, 22.65-23.3, y 1.55-5.77
usb_x = [6.0, 19.4];
usb_h = 3.3;
// Window for both plugs' overmoulds, which together span the board's width
usb_window_w = 27;
usb_window_h = 8;
// Lid pillar to can or shell
pillar_gap = 0.2;
// Board's USB end to the back wall
esp_wall_gap = 1;

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
// Measure yours: a half size breadboard's rail is about 84 x 10 x 9
rail_len = 84;
rail_w = 10;
rail_gap = 0.4;
rail_tray_wall = 1.2;
rail_tray_h = 3;

/* [Cable slots] */
// U slot in the back wall, open to the top, fits a JST XH 5 pin plug
cable_slot_w = 16;
cable_slot_h = 12;
// Left open under the lid's tab, for the ribbon cable
cable_pass_h = 5;

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
// ESP32 along y at the left, USB-C ports at the back wall. Its side posts
// stand esp_side past the board's edges.
esp_side = hdr_out + esp_gap + wall;
esp_top = esp_under + pcb_t;                 // board top above the floor top
esp_x = wall + post + 1 + esp_gap;           // board's left edge
inner_y = esp_len + esp_wall_gap + mod_overhang + 1.7;
esp_y1 = wall + inner_y - esp_wall_gap;      // board's USB end
esp_y0 = esp_y1 - esp_len;                   // board's antenna end
// Drivers in a row to the right of the ESP32, JST plugs toward the back
uln_x0 = esp_x + esp_w + esp_side + 1;
uln_pitch = uln_x + uln_gap;
uln_y1 = wall + inner_y - post - 1;          // boards' back edge
uln_y0 = uln_y1 - uln_y;
inner_x = uln_x0 - wall + uln_n * uln_x + (uln_n - 1) * uln_gap + 2;
outer_x = inner_x + 2 * wall;
outer_y = inner_y + 2 * wall;
outer_h = floor_t + inner_h + lid_t;
// Rail along the front wall, under the drivers
rail_cx = uln_x0 + (uln_n * uln_x + (uln_n - 1) * uln_gap) / 2;
rail_y0 = wall + 2 + rail_tray_wall;
post_centers = [for (x = [wall + post / 2, outer_x - wall - post / 2])
                for (y = [wall + post / 2, outer_y - wall - post / 2]) [x, y]];
usb_cx = esp_x + esp_w / 2;
usb_cz = floor_t + esp_top + 1.65;
cable_slot_x = [for (k = [0 : uln_n - 1]) uln_x0 + k * uln_pitch + uln_jst_x];

echo(str("outer ", outer_x, " x ", outer_y, " x ", outer_h, " mm"));

// ---- parts ----
if (part == "print_layout") {
    base();
    translate([outer_x + 10, outer_y, lid_t]) rotate([180, 0, 0]) lid();
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

module base() {
    difference() {
        union() {
            difference() {
                linear_extrude(outer_h - lid_t) rounded_rect(outer_x, outer_y, outer_corner_r);
                translate([wall, wall, floor_t]) cube([inner_x, inner_y, inner_h + 1]);
            }
            for (p = post_centers) translate([p[0] - post / 2, p[1] - post / 2, floor_t - eps])
                cube([post, post, inner_h + eps]);
            translate([0, 0, floor_t - eps]) {
                at_esp() esp_cradle();
                uln_standoffs();
                rail_tray();
            }
        }
        for (p = post_centers) translate([p[0], p[1], floor_t + inner_h - screw_hole_depth])
            cylinder(d = screw_hole, h = screw_hole_depth + 1);
        // USB-C window
        translate([usb_cx - usb_window_w / 2, outer_y - wall - 1, usb_cz - usb_window_h / 2])
            cube([usb_window_w, wall + 2, usb_window_h]);
        // motor cable slots
        for (x = cable_slot_x)
            translate([x - cable_slot_w / 2, outer_y - wall - 1, floor_t + inner_h - cable_slot_h])
                cube([cable_slot_w, wall + 2, cable_slot_h + 1]);
        // feet
        for (x = [feet_inset, outer_x - feet_inset], y = [feet_inset, outer_y - feet_inset])
            translate([x, y, -1]) cylinder(d = feet_d, h = feet_depth + 1);
        // logo in the floor, between the drivers and the rail
        translate([rail_cx, (rail_y0 + rail_w + rail_gap + rail_tray_wall + uln_y0) / 2, floor_t])
            logo_cut(floor_logo_w);
    }
}

// Board coordinates of the ESP32 (x from its left edge, y from its USB end,
// z from the floor top) into the box: USB end at the back.
module at_esp() {
    translate([esp_x + esp_w, esp_y1, 0]) rotate(180) children();
}

// Everything that locates the ESP32, in board coordinates.
module esp_cradle() {
    // antenna end: stop across the full width, below the module's overhang
    translate([-esp_side, esp_len + esp_gap, 0])
        cube([esp_w + 2 * esp_side, wall, esp_top - 0.2]);
    // bar between the headers under the antenna end
    translate([hdr_in + esp_gap, esp_len - 3, 0])
        cube([esp_w - 2 * (hdr_in + esp_gap), 3 + esp_gap + eps, esp_under]);
    for (m = [0, 1]) translate([m ? esp_w : 0, 0, 0]) mirror([m, 0, 0]) {
        // side posts beside the headers, at both ends
        translate([-esp_side, esp_len - 8, 0]) cube([wall, 8 + esp_gap + wall, esp_top + 2]);
        translate([-esp_side, -esp_wall_gap, 0]) cube([wall, 8 + esp_wall_gap, esp_top + 2]);
        // stop against the header's USB end, beside the USB-C leg's solder
        translate([-esp_side, hdr_y[0] - esp_gap - wall, 0])
            cube([esp_side + 1.5, wall, esp_under - 0.3]);
        // pad under the USB-C port, between its legs
        translate([usb_x[0] - 2, -esp_wall_gap, 0]) cube([4, esp_wall_gap + 6, esp_under]);
    }
}

module uln_standoffs() {
    for (k = [0 : uln_n - 1], dx = [-1, 1], dy = [-1, 1])
        translate([uln_x0 + k * uln_pitch + uln_x / 2 + dx * uln_hole_dx / 2,
                   (uln_y0 + uln_y1) / 2 + dy * uln_hole_dy / 2, 0])
            difference() {
                cylinder(d = uln_standoff_d, h = uln_standoff_h);
                translate([0, 0, -2]) cylinder(d = screw_hole, h = uln_standoff_h + 3);
            }
}

module rail_tray() {
    ix = rail_len + 2 * rail_gap;
    iy = rail_w + 2 * rail_gap;
    translate([rail_cx - ix / 2, rail_y0 - rail_gap, 0]) difference() {
        translate([-rail_tray_wall, -rail_tray_wall, 0])
            cube([ix + 2 * rail_tray_wall, iy + 2 * rail_tray_wall, rail_tray_h]);
        translate([0, 0, -1]) cube([ix, iy, rail_tray_h + 2]);
    }
}

// Top face on z = lid_t, pillars and tabs hang below z = 0.
module lid() {
    difference() {
        union() {
            linear_extrude(lid_t) rounded_rect(outer_x, outer_y, outer_corner_r);
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
            for (x = cable_slot_x)
                translate([x - cable_slot_w / 2 + 0.3, outer_y - wall + 0.2, -(cable_slot_h - cable_pass_h)])
                    cube([cable_slot_w - 0.6, wall - 0.4, cable_slot_h - cable_pass_h + eps]);
            at_esp() esp_pillars();
        }
        for (p = post_centers) translate([p[0], p[1], -1]) {
            cylinder(d = lid_hole, h = lid_t + 2);
            translate([0, 0, lid_t + 1 - counterbore_h]) cylinder(d = counterbore_d, h = counterbore_h + 1);
        }
        translate([outer_x / 2, outer_y / 2, lid_t]) logo_cut(lid_logo_w);
    }
}

// Four pillars from the lid's underside, in board coordinates: on the can at
// both edges of the module, on both USB-C shells.
module esp_pillars() {
    for (m = [0, 1]) translate([m ? esp_w : 0, 0, 0]) mirror([m, 0, 0]) {
        pillar([mod_x[0] + 0.5, mod_pad_y[0]], [4, mod_pad_y[1] - mod_pad_y[0]], esp_top + mod_h);
        pillar([usb_x[0] - 1.5, 2], [3, 3], esp_top + usb_h);
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
        at_esp() translate([0, 0, esp_under]) {
            color("darkgreen") cube([esp_w, esp_len, pcb_t]);
            color("silver") translate([mod_x[0], esp_len + mod_overhang - 25.5, pcb_t])
                cube([mod_x[1] - mod_x[0], 25.5, mod_h]);
            for (x = usb_x) color("silver") translate([x - 4.5, -1.3, pcb_t]) cube([9, 8.3, usb_h]);
            for (m = [0, 1]) translate([m ? esp_w : 0, 0, 0]) mirror([m, 0, 0]) {
                color("black") translate([-hdr_out, hdr_y[0], -2.5]) cube([hdr_in + hdr_out, hdr_y[1] - hdr_y[0], 2.5]);
                for (k = [0 : 21]) color("gold") translate([1.27 - 0.32, 7.96 + 2.54 * k - 0.32, -8.5]) cube([0.64, 0.64, 8.5]);
            }
        }
        for (k = [0 : uln_n - 1]) translate([uln_x0 + k * uln_pitch, uln_y0, uln_standoff_h]) {
            color("green") cube([uln_x, uln_y, pcb_t]);
            color("white") translate([uln_jst_x - 3, uln_y - 18, pcb_t]) cube([6, 14, 7]);
        }
        color("white") translate([rail_cx - rail_len / 2, rail_y0, 0]) cube([rail_len, rail_w, 9]);
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
