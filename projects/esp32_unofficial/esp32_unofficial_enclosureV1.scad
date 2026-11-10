// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Enclosure V1 for an unofficial ESP32 dev board (ESP32-WROOM-32, USB-C,
// 2 x 15 pins), measured by hand in dimensions.png: board 52 x 28.6, USB-C
// 1 mm proud of one short edge, 13 high from the pin tips to the top of the
// parts. Base and lid; lid_fix chooses how the lid is held: two printed
// screws, two M3 screws, or pushed in with snap beads.
//
// The board lies in the base with the pins down. It rests on a block in each
// corner, clear of the headers, and the walls locate it. The mounting holes
// are not used: their distance across the board is not in the drawing. Four
// legs under the lid's corners hold the board down. A slit in the floor under
// each pin row lets the jumper wires' plugs onto the pins from below. A lip under the lid
// locates it inside the walls. A notch in the wall opposite the USB port lets
// a fingernail under the lid.
// push: the lip carries a bead on each long side that snaps into a groove in
// the wall. m3, printed: the board fills the box, so the screws sit outside
// it, in a boss on the middle of each long wall and an ear on the lid.
//
// The printed screws follow 01_published_or_archived/fdm_optimized_screws and
// its print tests: 5 mm, the smallest that works, 2 mm pitch, 45 degree
// flanks, 0.25 clearance per side in the hole, 1 mm tip chamfer, printed lying
// with the underside cut off, so the layers run along the shank and it does
// not snap between them.
//
// Print the base as is, the lid top face down (lip and legs point up), the
// printed screws lying on their cut. No support. Origin: outer front left bottom corner of the base, USB end at
// x = 0. Units: mm.

/* [View] */
part = "print_layout"; // [print_layout:All parts on the bed,assembly:Assembly with the board,base:Base,lid:Lid,screw:Printed screw]
// How the lid is held
lid_fix = "printed"; // [printed:Printed screws,m3:M3 screws,push:Push in with snap beads]

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
// Pin rows, measured in image.png: distance between the two rows, pins per
// row, first pin's centre from the USB edge
pin_row = 25.4;
pin_n = 15;
pin_x0 = 9.8;

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
// Slit in the floor under each pin row, for the wires' plugs: width from the
// wall's inner face, length beyond the first and last pin's centre
slit_w = 4.2;
slit_over = 2;

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

/* [Screws] */
// Least wall between a screw's hole and the room inside
boss_inner = 0.8;
// M3 thread forming, untested; 45 degree chamfer at the entry
screw_hole = 2.7;
screw_hole_depth = 12;
screw_chamfer = 0.6;
m3_boss_d = 8;
// Clearance hole and counterbore for M3 pan heads in the lid
lid_hole = 3.4;
counterbore_d = 6.5;
counterbore_h = 1;
// Printed screw, as fdm_optimized_screws: major diameter, pitch, radial gap
// to the thread in the boss (all of it in the hole), 45 degree tip chamfer,
// share of the diameter cut off the underside of the lying screw
ps_d = 5;
ps_pitch = 2;
ps_clearance = 0.25;
ps_tip_chamfer = 1;
ps_cut = 0.15;
// Thread in the boss, from the wall's top, and the screw's reach into it.
// lid_t + ps_depth is a whole number of pitches, so the model's screw sits
// in phase with the hole.
ps_depth = 10;
ps_reach = 8;
ps_boss_d = 9.5;
// Hex head, across flats, with a slot for a coin or screwdriver
ps_head_w = 9;
ps_head_h = 3;
ps_slot_w = 1.2;
ps_slot_h = 1.2;

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

// Screws: boss diameter, hole in the boss, and the hole's centre outside the
// wall's outer face
boss_d = lid_fix == "m3" ? m3_boss_d : ps_boss_d;
tap_d = lid_fix == "m3" ? screw_hole : ps_d + 2 * ps_clearance;
boss_c = tap_d / 2 + boss_inner - wall;
boss_out = lid_fix == "push" ? 0 : boss_c + boss_d / 2;
fix_pts = [[outer_x / 2, -boss_c], [outer_x / 2, outer_y + boss_c]];
ps_len = lid_t + ps_reach;

echo(str("outer ", outer_x, " x ", outer_y + 2 * boss_out, " x ", outer_h, " mm"));

if (part == "print_layout") {
    base();
    translate([0, 2 * outer_y + 2 * boss_out + 10, lid_t]) rotate([180, 0, 0]) lid();
    if (lid_fix == "printed") for (i = [0, 1])
        translate([outer_x + 10 + i * (ps_head_w + 6), outer_y / 2, 0]) screw_lying();
} else if (part == "assembly") {
    base();
    translate([0, 0, wall_top + 15]) lid();
    if (lid_fix == "printed") for (p = fix_pts)
        translate([p[0], p[1], wall_top + 30 + lid_t]) printed_screw();
    %board();
} else if (part == "base") {
    base();
} else if (part == "lid") {
    lid();
} else if (part == "screw") {
    screw_lying();
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
            rotate(m ? 0 : 180) snap(len, bead_h);
}

// Outline of the screw bosses on both long walls, also the lid's ears.
module bosses() {
    difference() {
        for (m = [0, 1]) translate([outer_x / 2, m ? outer_y : 0]) rotate(m * 180) hull() {
            translate([0, -boss_c]) circle(d = boss_d);
            translate([-boss_d / 2, 0]) square([boss_d, 0.1]);
        }
        // not into the room inside
        translate([wall / 2, wall / 2]) square([outer_x - wall, outer_y - wall]);
    }
}

// Thread forming hole, depth deep from z = 0 downwards, chamfered at the top.
module screw_hole_cut(depth) {
    translate([0, 0, -depth]) cylinder(d = screw_hole, h = depth + 1);
    translate([0, 0, -screw_chamfer]) cylinder(d1 = screw_hole, d2 = screw_hole + 2 * screw_chamfer + 2, h = screw_chamfer + 1);
}

// Printed screw, head down: slot in the head's end face on z = 0, shank up.
module screw_up() {
    difference() {
        hex(ps_head_w, ps_head_h);
        translate([-ps_slot_w / 2, -ps_head_w, -1]) cube([ps_slot_w, 2 * ps_head_w, ps_slot_h + 1]);
    }
    translate([0, 0, ps_head_h - eps]) intersection() {
        threaded_rod(ps_d, ps_len + eps, ps_pitch);
        cylinder(h = ps_len + eps, r1 = ps_d / 2 - ps_tip_chamfer + ps_len, r2 = ps_d / 2 - ps_tip_chamfer);
    }
}

// Printed screw as it sits in the lid: head's underside on z = 0, slot on top.
module printed_screw() {
    translate([0, 0, ps_head_h]) rotate([180, 0, 0]) screw_up();
}

// Printed screw as it prints: lying along y on a flat of its head, centred on
// the origin, everything below ps_cut * ps_d above the shank's lowest point
// cut off. The cut is the bed. The slot stands upright.
module screw_lying() {
    axis_z = ps_d * (0.5 - ps_cut);
    length = ps_head_h + ps_len;
    translate([0, -length / 2, axis_z]) difference() {
        rotate([-90, 0, 0]) screw_up();
        translate([-ps_head_w, -1, -axis_z - ps_head_w]) cube([2 * ps_head_w, length + 2, ps_head_w]);
    }
}

// Threaded blind hole from z = 0 up to h, 45 degree lead-in at the top.
module thread_hole(h) {
    hole_r = ps_d / 2 + ps_clearance;
    thread_h = 0.4 * ps_pitch;
    threaded_rod(2 * hole_r, h + ps_pitch, ps_pitch);
    translate([0, 0, h - thread_h]) cylinder(r1 = hole_r - thread_h, r2 = hole_r + 1, h = 1 + thread_h);
}

// Hex prism with bevelled corners, from z = 0 to h.
module hex(width, h) {
    w = width / 2;
    intersection() {
        cylinder(r = w / cos(30), h = h, $fn = 6);
        rotate_extrude() polygon([[0, 0], [w, 0], [w + 1, 1], [w + 1, h - 1], [w, h], [0, h]]);
    }
}

// Threaded rod of major diameter d from z = 0 to h: the screw shank, and, with
// the clearance added, the shape cut for the hole.
module threaded_rod(d, h, pitch) {
    r_root = d / 2 - 0.4 * pitch;
    render(convexity = 4) intersection() {
        union() {
            cylinder(r = r_root + eps, h = h);
            thread_ridge(r_root, -pitch, h + pitch, pitch);
        }
        cylinder(r = d / 2 + 1, h = h);
    }
}

// Sweeps a trapezoid around a right-handed helix. Equal radial depth and
// axial flank run give 45 degree flanks.
module thread_ridge(r_root, z0, z1, pitch) {
    depth = 0.4 * pitch;
    half_tip = 0.05 * pitch;
    steps = ceil((z1 - z0) / pitch * $fn);
    profile = [[r_root - eps, -half_tip - depth - eps],
               [r_root + depth, -half_tip],
               [r_root + depth, half_tip],
               [r_root - eps, half_tip + depth + eps]];
    points = [for (i = [0:steps])
        let(z = z0 + (z1 - z0) * i / steps, a = 360 * z / pitch)
        for (p = profile) [p[0] * cos(a), p[0] * sin(a), z + p[1]]];
    faces = concat(
        [[3, 2, 1, 0]],
        [for (i = [0:steps-1], j = [0:3])
            [4*i+j, 4*i+(j+1)%4, 4*(i+1)+(j+1)%4]],
        [for (i = [0:steps-1], j = [0:3])
            [4*i+j, 4*(i+1)+(j+1)%4, 4*(i+1)+j]],
        [[4*steps, 4*steps+1, 4*steps+2, 4*steps+3]]);
    polyhedron(points = points, faces = faces, convexity = 16);
}

module base() {
    difference() {
        union() {
            if (lid_fix != "push") linear_extrude(wall_top) bosses();
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
        if (lid_fix == "push") snaps(bead_len + 1, 0, wall_top - snap_z - groove_drop);
        for (p = fix_pts) translate([p[0], p[1], wall_top]) {
            if (lid_fix == "m3") screw_hole_cut(screw_hole_depth);
            if (lid_fix == "printed") translate([0, 0, -ps_depth]) thread_hole(ps_depth);
        }
        // slits under the pin rows
        for (y = [wall, outer_y - wall - slit_w])
            translate([wall + fit + pin_x0 - slit_over, y, -1])
                cube([(pin_n - 1) * 2.54 + 2 * slit_over, slit_w, floor_t + 1 + eps]);
        // fingernail notch
        translate([outer_x - wall + 0.8, (outer_y - notch_w) / 2, wall_top - notch_h])
            cube([wall, notch_w, notch_h + 1]);
        // logo, name and version in the bottom, reading from below
        translate([outer_x / 2, outer_y / 2, 0]) mirror([0, 0, 1]) mirror([1, 0, 0]) {
            translate([0, 3.9, 0]) logo_cut(floor_logo_w);
            translate([0, -7.6, -logo_depth]) linear_extrude(logo_depth + 1)
                text(engraving, size = text_size, font = text_font, halign = "center", valign = "center");
        }
    }
}

// Top face on z = lid_t, lip and legs hang below z = 0.
module lid() {
    difference() {
        union() {
            linear_extrude(lid_t) rounded_rect(outer_x, outer_y, outer_corner_r);
            if (lid_fix != "push") linear_extrude(lid_t) bosses();
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
            if (lid_fix == "push") snaps(bead_len, lip_gap, -snap_z);
        }
        for (p = fix_pts) translate([p[0], p[1], -1]) {
            if (lid_fix == "m3") {
                cylinder(d = lid_hole, h = lid_t + 2);
                translate([0, 0, lid_t + 1 - counterbore_h]) cylinder(d = counterbore_d, h = counterbore_h + 1);
            }
            if (lid_fix == "printed") cylinder(d = ps_d + 2 * ps_clearance + 0.2, h = lid_t + 2);
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
        // headers
        for (y = [(board_w - pin_row) / 2, (board_w + pin_row) / 2]) {
            color("black") translate([pin_x0 - 1.27, y - 1.27, -2.5]) cube([pin_n * 2.54, 2.54, 2.5]);
            for (k = [0 : pin_n - 1]) color("gold")
                translate([pin_x0 + 2.54 * k - 0.32, y - 0.32, -pins_h]) cube([0.64, 0.64, pins_h]);
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
