// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// puppentheater_magnet.scad
//
// Magnetic puppet theatre for print-in-place articulated models, after the
// sketch in image.png: a thin stage on four legs, an arm that slides under it
// with a magnet in its head, and a base with the matching magnet under the
// puppet. The magnets are the only coupling, so their faces must sit close to
// the stage: the play area is the magnet's reach, not the arm's.
//
// Print, no supports on any part:
//   stage        flipped, play face on the bed
//   arm_grip     laid on its side, use Y up (rotate 90 about X)
//   arm_tip      laid on its side, use Y up (rotate 90 about X)
//   puppet_base  as modelled, pocket up
//
// Coordinate frame: X = stage width, Y = stage depth (front is -Y),
// Z = up from the desk. The arm is modelled along +X and placed along +Y in
// the assembly. Units: mm, degrees.

/* [Part] */
part = "assembly"; // [assembly:Stage and arm in use with the puppet base, section:Cut through the magnets, stage:Stage with the play top and four legs, arm_grip:Near arm segment with the grip, arm_tip:Far arm segment with the magnet head, puppet_base:Base for the puppet with the magnet pocket]

/* [Magnets] */
magnet_d = 15;                // disc diameter, N42 or stronger
magnet_h = 3;                 // disc height
magnet_hole_clearance = 0.4;  // added to the hole diameter, not per side
magnet_glue_gap = 0.4;        // room above the magnet in the puppet base
magnet_floor = 0.6;           // material between the puppet's magnet and the stage

/* [Stage] */
stage_x = 240;   // width; the print bed is the limit, one piece only
stage_y = 180;   // depth
stage_t = 2.0;   // play top; thinner = stronger coupling
stage_h = 110;   // height of the play face over the desk
stage_leg = 16;  // square leg
stage_rim_w = 4; // stiffening rim under the top, along the edge
stage_rim_d = 8; // rim depth

/* [Arm] */
arm_grip_len = 130;  // near segment
arm_tip_len = 155;   // far segment, including the lap and the head
arm_w = 24;          // width, one width over the whole arm so it lays flat when printed
arm_t = 8;           // handle thickness
lap_len = 25;        // the two segments overlap this much
arm_pad_x = 34;      // magnet head; its width is arm_w
arm_pad_t = 5;
arm_recess = 0.2;    // the arm's magnet sits this far behind the pad's face
arm_clearance = 0.4; // pad below the stage at rest, the magnet lifts it
arm_riser_x = 14;    // width of the riser in X
knob_len = 26;       // grip; its width is arm_w
knob_h = 24;

/* [Puppet base] */
base_x = 40;
base_y = 28;
base_r = 6;      // corner radius
base_chamfer = 0.6; // around the face that lies on the stage

/* [Quality] */
$fn = 64;

// ---------- derived ----------
assembly_gap = 0.02;               // keeps coincident faces of two colours apart
stage_under = stage_h - stage_t;   // 108
pad_top = stage_under - arm_clearance;
pad_bot = pad_top - arm_pad_t;
hole_d = magnet_d + magnet_hole_clearance;
hole_r = hole_d / 2;
base_t = magnet_floor + magnet_h + magnet_glue_gap;
pocket_d = magnet_h + magnet_glue_gap;
tip_x0 = arm_grip_len - lap_len;
tip_x1 = tip_x0 + arm_tip_len;
pad_cx = tip_x1 - arm_pad_x / 2;
pad_x0 = pad_cx - arm_pad_x / 2;
riser_x0 = pad_cx - arm_riser_x / 2;
riser_x1 = pad_cx + arm_riser_x / 2;
lap_t = arm_t / 2;
base_y_pos = 60;                   // where the base sits on the stage
arm_y0 = base_y_pos - pad_cx;      // the arm's local x = 0 in the assembly
logo_width = 14;
logo_depth = 0.8;

arm_color = "#E0A33E";
stage_color = "#C8A27A";
base_color = "#2A3134";

assert(arm_pad_x >= hole_d + 10, "arm_pad_x is too small for the magnet");
assert(arm_w/2 >= hole_r * sqrt(2) + 1, "arm_w is too small for the teardrop");
assert(base_x >= hole_d + 12, "base_x is too small for the magnet");
assert(base_y >= hole_d + 12, "base_y is too small for the magnet");
assert(stage_h > stage_t + arm_pad_t + 20, "stage_h leaves no room for the arm");

// ---------- 2D helpers ----------
// Rounded rectangle, centred.
module roundrect_2d(w, h, r) {
    translate([-w/2 + r, -h/2 + r])
        hull()
            for (x = [0, w - 2*r], y = [0, h - 2*r])
                translate([x, y]) circle(r = r);
}

// A round hole with a 45 degree roof, printable when its axis lies in the bed.
// Points up in +Y, which is up when the arm is printed on its side.
module teardrop_2d(r) {
    union() {
        circle(r = r);
        polygon([[r * cos(45), r * sin(45)],
                 [0, r * sqrt(2)],
                 [-r * cos(45), r * sin(45)]]);
    }
}

// The VeryOS logo as veryos_logo.svg, bottom edge on y = 0, centred on x = 0,
// as in veryos_logo_cube and 28byj_minimal_turntableV2.
logo_r = 15.6264133379;
logo_stroke = 5;
logo_angle = 22.5;
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;

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
}

// ---------- stage ----------
module stage() {
    plate_z = stage_under;
    difference() {
        union() {
            // play top
            translate([-stage_x/2, -stage_y/2, plate_z])
                cube([stage_x, stage_y, stage_t]);
            // rim under the top, around the edge: stiffens the thin top and
            // leaves the middle open for the arm
            translate([-stage_x/2, -stage_y/2, plate_z - stage_rim_d])
                difference() {
                    cube([stage_x, stage_y, stage_rim_d]);
                    translate([stage_rim_w, stage_rim_w, -1])
                        cube([stage_x - 2*stage_rim_w,
                              stage_y - 2*stage_rim_w, stage_rim_d + 2]);
                }
            // four legs
            for (sx = [-1, 1], sy = [-1, 1])
                translate([sx*(stage_x/2 - stage_leg/2) - stage_leg/2,
                           sy*(stage_y/2 - stage_leg/2) - stage_leg/2, 0])
                    cube([stage_leg, stage_leg, plate_z]);
        }
        // logo on the outer face of the front left leg
        translate([-(stage_x/2) + stage_leg/2, -stage_y/2 + logo_depth, 34])
            rotate([90, 0, 0])
                linear_extrude(logo_depth + 0.1)
                    scale(logo_width / logo_w) logo();
    }
}

// ---------- arm ----------
// The two segments lap over lap_len: the tip's half is the lower 4 mm from
// tip_x0, the grip's is the upper 4 mm. The step at each end of the lap stops
// the two from sliding in X, and both are the same width, so the joint needs
// no key and prints flat.
module arm_tip() {
    difference() {
        union() {
            // lap, lower half
            translate([tip_x0, -arm_w/2, 0])
                cube([lap_len, arm_w, lap_t]);
            // handle
            translate([tip_x0 + lap_len, -arm_w/2, 0])
                cube([riser_x1 - tip_x0 - lap_len, arm_w, arm_t]);
            // riser
            translate([riser_x0, -arm_w/2, arm_t])
                cube([arm_riser_x, arm_w, pad_bot - arm_t]);
            // magnet head
            translate([pad_x0, -arm_w/2, pad_bot])
                cube([arm_pad_x, arm_w, arm_pad_t]);
        }
        // magnet pocket, open at the head's face, 0.2 behind it
        translate([pad_cx, 0, pad_top - magnet_h - arm_recess])
            linear_extrude(magnet_h + arm_recess + 0.1)
                teardrop_2d(hole_r);
    }
}

module arm_grip() {
    difference() {
        union() {
            // handle, full thickness
            translate([0, -arm_w/2, 0])
                cube([arm_grip_len, arm_w, arm_t]);
            // grip knob, rounded in the side view
            translate([8 + knob_len/2, arm_w/2, arm_t + knob_h/2])
                rotate([90, 0, 0])
                    linear_extrude(arm_w)
                        roundrect_2d(knob_len, knob_h, 5);
        }
        // lap, upper half only from tip_x0
        translate([tip_x0, -arm_w/2 - 1, -1])
            cube([lap_len, arm_w + 2, lap_t + 1]);
    }
}

// ---------- puppet base ----------
module puppet_base() {
    difference() {
        hull() {
            linear_extrude(0.01)
                roundrect_2d(base_x - 2*base_chamfer,
                             base_y - 2*base_chamfer, base_r - base_chamfer);
            translate([0, 0, base_chamfer])
                linear_extrude(base_t - base_chamfer)
                    roundrect_2d(base_x, base_y, base_r);
        }
        // magnet pocket from the top, floor magnet_floor thick
        translate([0, 0, base_t - pocket_d])
            cylinder(d = hole_d, h = pocket_d + 0.1);
        // chamfer at the pocket's mouth
        translate([0, 0, base_t - 0.6])
            cylinder(d1 = hole_d, d2 = hole_d + 1.2, h = 0.61);
    }
}

// ---------- assembly ----------
module arm_placed() {
    translate([0, arm_y0, arm_clearance - assembly_gap])
        rotate([0, 0, 90])
            union() { arm_grip(); arm_tip(); }
}

module base_placed() {
    translate([0, base_y_pos, stage_h + assembly_gap]) puppet_base();
}

// The two magnets, not printed, for the section.
module magnets() {
    // puppet's magnet, face down 0.6 above the play face
    translate([0, base_y_pos,
               stage_h + assembly_gap + base_t - magnet_glue_gap - magnet_h/2])
        cylinder(d = magnet_d, h = magnet_h, center = true);
    // arm's magnet, face up 0.2 behind the pad's face
    translate([0, base_y_pos,
               arm_clearance - assembly_gap + pad_top - arm_recess - magnet_h/2])
        cylinder(d = magnet_d, h = magnet_h, center = true);
}

module cut() {
    translate([0.5, -400, -50]) cube([400, 800, 400]);
}

// ---------- output ----------
if (part == "stage") {
    color(stage_color) stage();
} else if (part == "arm_grip") {
    color(arm_color) arm_grip();
} else if (part == "arm_tip") {
    color(arm_color) arm_tip();
} else if (part == "puppet_base") {
    color(base_color) puppet_base();
} else if (part == "assembly") {
    color(stage_color) stage();
    color(arm_color) arm_placed();
    color(base_color) base_placed();
} else if (part == "section") {
    // each part cut on its own, so the difference keeps its colour
    color(stage_color) difference() { stage(); cut(); }
    color(arm_color) difference() { arm_placed(); cut(); }
    color(base_color) difference() { base_placed(); cut(); }
    color("Silver") difference() { magnets(); cut(); }
}
