// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Artificial fingernail: a claw that slides onto a fingertip. A base model
// built from primitives, as a starting point for a sculpting program.
// Modelled after the demon nails in inspiration/, not copied from them.
//
// Three parts, all from the finger's measurements:
// - ring: a closed elliptic band at the open end, it holds the nail on.
// - hood: the sleeve over the last phalanx, open on the pad side, so it
//   grips the fingertip like a C and leaves the pad free. It narrows towards
//   the tip, as the finger does.
// - claw: the hull of the hood's top and a small sphere at the claw's tip.
//
// The finger's axis is z, the fingertip points up, the nail side is +y, the
// pad side -y. Print it like that: ring on the bed, claw up. Nothing
// overhangs more than 45 degrees: the cavity ends in a cone and the pad
// window in a gable. Origin: centre of the ring's bottom face.
//
// Units: mm. No external files or libraries needed.

/* [Finger] */
// Width of the finger, side to side, where the ring's open end sits.
finger_w = 14; // [8:0.5:25]
// Thickness of the finger, nail to pad, at the same place.
finger_h = 12; // [7:0.5:22]
// From the fingertip to the ring's open end, along the finger. The ring ends
// at the last joint's crease.
finger_length = 24; // [12:0.5:40]
// The fingertip's width and thickness, about 7 mm from the tip, relative to
// finger_w and finger_h. The original's hood is 0.92 of its ring.
fingertip_scale = 0.92; // [0.7:0.01:1]
// Added to width and thickness. Untested; the hood's C grips with less.
clearance = 0.4; // [0:0.1:2]

/* [Shape] */
wall = 1.6; // [0.8:0.1:4]
// Axial length of the closed ring.
ring_length = 6; // [3:0.5:15]
// Width of the opening on the pad side. Narrower grips harder.
pad_window_w = 9; // [4:0.5:20]

/* [Claw] */
// How far the claw reaches past the fingertip, along the finger.
claw_length = 38; // [10:1:80]
// How far the claw tip bends toward the pad, degrees, seen from the fingertip.
// Above 30 the claw's nail side cuts into the cavity's top.
claw_angle = 17; // [0:1:30]
claw_tip_d = 1.2; // [0.4:0.1:4]

/* [Logo] */
// Engraved on the nail side of the hood.
logo_width = 7; // [0:0.5:12]
logo_depth = 0.4; // [0.2:0.1:1]

/* [Hidden] */
$fn = 96;
eps = 0.01;

// Half axes of the cavity in x and y, at the ring and at the top of its
// straight part. The outside is wall more.
in_a = (finger_w + clearance) / 2;
in_b = (finger_h + clearance) / 2;
top_a = (finger_w * fingertip_scale + clearance) / 2;
top_b = (finger_h * fingertip_scale + clearance) / 2;
out_b = in_b + wall;
// The cavity ends in a cone that rises 45 degrees or steeper on every side.
tip_len = max(top_a, top_b);
// Top of the cavity's straight part; the cone sits on it.
z_c = finger_length - tip_len;
claw_tip = [0, -claw_length * tan(claw_angle), finger_length + claw_length];
// The logo, centred on the hood's straight part, as in pucklight_sphereV3.
logo_r = 15.6264133379; // outer radius of the ring
logo_stroke = 5;
logo_angle = 22.5;
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;
function logo_h(width) = width * 2 * logo_r / logo_w;
logo_z = z_c / 2;

assert(z_c > ring_length, "finger_length is too short for the ring: raise it or lower ring_length.");
assert(pad_window_w < finger_w * fingertip_scale,
       "pad_window_w must be narrower than the fingertip, or the hood cannot grip.");
assert(logo_width == 0 || logo_h(logo_width) + 2 <= z_c,
       "The logo is taller than the hood's straight part; lower logo_width.");

fingernail();

module fingernail() {
    difference() {
        union() {
            elliptic_frustum(in_a + wall, in_b + wall, top_a + wall, top_b + wall, z_c);
            claw();
        }
        cavity();
        pad_window();
        if (logo_width > 0) logo_cut();
    }
}

// The hood's top, a thin slice at z_c, hulled with the tip.
module claw() {
    hull() {
        translate([0, 0, z_c - eps]) scale([top_a + wall, top_b + wall, 1]) cylinder(r = 1, h = eps);
        translate(claw_tip) sphere(d = claw_tip_d, $fn = 24);
    }
}

// The finger: an elliptic frustum, a cone on top whose tip is the fingertip.
module cavity() {
    translate([0, 0, -1]) elliptic_frustum(in_a, in_b, in_a, in_b, 1 + eps);
    elliptic_frustum(in_a, in_b, top_a, top_b, z_c);
    translate([0, 0, z_c]) scale([top_a, top_b, tip_len]) cylinder(r1 = 1, r2 = 0, h = 1);
}

// Through the pad side from the ring to the cone, with a 45 degree gable.
module pad_window() {
    w = pad_window_w / 2;
    rotate([90, 0, 0]) linear_extrude(out_b + claw_length)
        polygon([[-w, ring_length], [w, ring_length], [w, z_c], [0, z_c + w], [-w, z_c]]);
}

// logo_depth deep into the nail side of the hood, as deep everywhere on the
// curve. Reads from +y with its top towards the claw.
module logo_cut()
    difference() {
        translate([0, 0, logo_z]) rotate([90, 0, 180]) linear_extrude(out_b + 1)
            scale(logo_width / logo_w) translate([0, -logo_r]) logo();
        let (d = wall - logo_depth) elliptic_frustum(in_a + d, in_b + d, top_a + d, top_b + d, z_c);
    }

module elliptic_frustum(a0, b0, a1, b1, h)
    hull() {
        scale([a0, b0, 1]) cylinder(r = 1, h = eps);
        translate([0, 0, h - eps]) scale([a1, b1, 1]) cylinder(r = 1, h = eps);
    }

// The VeryOS logo at the size of veryos_logo.svg, bottom edge on y = 0,
// centred on x = 0, as in veryos_logo_cube.
module logo() {
    difference() {
        union() {
            translate([0, logo_r]) circle(r = logo_r);
            for (m = [0, 1]) mirror([m, 0])
                translate([logo_b, 0]) rotate(-logo_angle)
                    translate([-logo_stroke, 0]) square([logo_stroke, logo_arm]);
            // between the arms, below the ring's middle
            polygon([[-logo_b, 0], [logo_b, 0],
                     [logo_b + logo_r * tan(logo_angle), logo_r],
                     [-logo_b - logo_r * tan(logo_angle), logo_r]]);
        }
        translate([0, logo_r]) for (a = [0, 180]) rotate(a) s_hole();
    }
}

// One of the two holes the S leaves in the ring: the right half of the ring's
// hole above the lower half ring, and the upper half disc.
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
