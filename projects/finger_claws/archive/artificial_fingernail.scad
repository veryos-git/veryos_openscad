// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Artificial fingernail: a long claw that slides onto a fingertip. A base
// model built from primitives, as a starting point for a sculpting program.
// Modelled after the claws in inspiration/other_version/, not copied from them.
//
// - sleeve: a tube over the last phalanx, narrowing towards the tip as the
//   finger does. A slit along the pad side lets it open over the finger, a
//   notch on the nail side frees the knuckle.
// - blade: continues the nail past the fingertip, along a spine that bends
//   towards the nail side. Its cross sections are ellipses that narrow as
//   sqrt(1 - t) along the spine, hulled segment by segment; its underside a
//   scoop: smaller sections on the same spine, swept towards the pad.
// - opening: the fingertip's pad is free, tip_free from the tip down. The
//   sleeve's sides fall away at leg_angle from there, the blade's sides
//   taper on at leg_taper.
//
// The finger's axis is z, the fingertip points up, the nail side is +y, the
// pad side -y. Print it like that: open end on the bed, tip up. Nothing
// overhangs more than 45 degrees. Origin: centre of the open end.
//
// Units: mm. No external files or libraries needed.

/* [Finger] */
// Width of the finger, side to side, at the crease of the last joint.
finger_w = 14; // [8:0.5:25]
// Thickness of the finger, nail to pad, at the same place.
finger_h = 12; // [7:0.5:22]
// From the fingertip to the crease of the last joint, along the finger.
finger_length = 25; // [12:0.5:40]
// The fingertip's width and thickness, about 7 mm from the tip, relative to
// finger_w and finger_h.
fingertip_scale = 0.92; // [0.7:0.01:1]
// Added to width and thickness. Untested; the slit lets the sleeve open.
clearance = 0; // [-1:0.1:2]

/* [Sleeve] */
wall = 1.6; // [0.8:0.1:4]
// The fingertip's pad is free this far down from the tip.
tip_free = 9; // [4:0.5:20]
slit_w = 2; // [0:0.5:6]
// Height of the notch for the knuckle at the open end, on the nail side.
knuckle_notch_h = 7; // [0:0.5:15]

/* [Blade] */
// How far the blade reaches past the fingertip.
claw_length = 40; // [10:1:80]
// How far the blade's direction turns towards the nail side from base to
// tip, degrees: it bends in an arc. Above 45 the tip overhangs when printed.
claw_bend = 20; // [0:1:60]
// How far the tip leans back on top of that, towards the nail side, straight.
claw_lean = 2; // [0:0.5:15]
// Thickness of the blade at the top of its scoop; at the base it is wall.
blade_thickness = 2.5; // [1:0.1:6]
claw_tip_d = 1.2; // [0.4:0.1:4]

/* [Look] */
// 0: smooth. 6 to 12: faceted outside, flat on the nail side.
facets = 0; // [0:1:16]

/* [Logo] */
// Engraved on the nail side of the sleeve, above the notch.
logo_width = 7; // [0:0.5:12]
logo_depth = 0.4; // [0.2:0.1:1]

/* [Hidden] */
$fn = 96;
eps = 0.01;
big = 200;

// Half axes of the cavity in x and y, at the open end and at the top of the
// sleeve. The outside is wall more.
in_a = (finger_w + clearance) / 2;
in_b = (finger_h + clearance) / 2;
top_a = (finger_w * fingertip_scale + clearance) / 2;
top_b = (finger_h * fingertip_scale + clearance) / 2;
// The sleeve ends and the blade begins where the pad gets free.
z_s = finger_length - tip_free;
blade_len = finger_length + claw_length - z_s;
// The spine is the blade's back, t from 0 at the sleeve's top to 1 at the
// tip: an arc of blade_len turning claw_bend, plus the lean. spine_angle is
// its direction off the finger's axis there.
function spine_angle(t) = claw_bend * t;
function spine(t) = let (
        arc = claw_bend == 0 ? [0, blade_len * t]
            : let (r = blade_len / (claw_bend * PI / 180))
              [r * (1 - cos(spine_angle(t))), r * sin(spine_angle(t))])
    [0, top_b + wall + arc[0] + claw_lean * t, z_s + arc[1]];
// The scoop ends round, scoop_end_d wide, at scoop_top of the blade's length,
// blade_thickness under the blade's back there.
scoop_top = 0.75;
scoop_end_d = 2;
// Segments of the blade; the scoop ends on a segment's border.
segments = 16;
// The sleeve's sides fall away at this angle from the horizontal, the
// blade's sides end along this one above them.
leg_angle = 55;
leg_taper = 78;
// A faceted outside has its flats, not its corners, wall off the cavity.
out_fn = facets > 0 ? facets : $fn;
out_k = facets > 0 ? 1 / cos(180 / facets) : 1;
// Where the opening's slope reaches the finger's middle.
z_legs = z_s + (top_b + wall) * out_k * tan(leg_angle);
// The logo, as in pucklight_sphereV3.
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
logo_z = (knuckle_notch_h + z_s) / 2;

assert(z_s > knuckle_notch_h + 2, "tip_free is too long for the sleeve: lower it or knuckle_notch_h, or raise finger_length.");
assert(slit_w < top_a, "slit_w is wider than the fingertip.");
assert(blade_thickness > wall, "blade_thickness must be more than wall.");
assert(logo_width == 0 || logo_h(logo_width) + 2 <= z_s - knuckle_notch_h,
       "The logo does not fit between the notch and the opening; lower logo_width.");

fingernail();

module fingernail() {
    difference() {
        union() {
            outer_frustum(in_a + wall, in_b + wall, top_a + wall, top_b + wall, z_s);
            blade();
        }
        translate([0, 0, -1]) frustum(in_a, in_b, in_a, in_b, 1 + eps);
        frustum(in_a, in_b, top_a, top_b, z_s);
        scoop();
        pad_opening();
        slit();
        knuckle_notch();
        if (logo_width > 0) logo_cut();
    }
}

// Half axes of the blade's section at t, from the sleeve's outside down to
// the tip's radius.
function blade_a(t) = max((top_a + wall) * sqrt(1 - t), claw_tip_d / 2);
function blade_b(t) = max((top_b + wall) * sqrt(1 - t), claw_tip_d / 2);

module blade()
    for (i = [0 : segments - 1]) hull() for (t = [i, i + 1] / segments)
        slice(t, blade_a(t), blade_b(t), 0, out_fn, out_k);

// The scoop's section at t: the cavity's top, narrowing to scoop_end_d at
// scoop_top, its back thickness(t) under the blade's back.
function scoop_a(t) = max(top_a * sqrt(1 - t / scoop_top), scoop_end_d / 2);
function scoop_b(t) = max(top_b * sqrt(1 - t / scoop_top), scoop_end_d / 2);
function thickness(t) = wall + (blade_thickness - wall) * t / scoop_top;

// Each segment swept towards the pad, so that the scoop leaves the blade's
// underside and cuts its sides off cleanly.
module scoop()
    for (i = [0 : round(scoop_top * segments) - 1]) hull() for (dy = [0, -big], t = [i, i + 1] / segments)
        translate([0, dy, 0]) slice(t, scoop_a(t), scoop_b(t), thickness(t), $fn, 1);

// An ellipse a by b across the spine at t, its back off under the spine,
// facing along the spine. k and fn facet it like the sleeve's outside.
module slice(t, a, b, off, fn, k)
    translate(spine(t)) rotate([-spine_angle(t), 0, 0]) translate([0, -off - b, 0])
        rotate(180 / fn) scale([a * k, b * k, 1]) cylinder(r = 1, h = eps, center = true, $fn = fn);

// Everything above a slope that rises at leg_angle from the sleeve's top at
// the pad to the finger's middle and at leg_taper from there.
module pad_opening()
    rotate([90, 0, 90]) linear_extrude(big, center = true) polygon([
        [-big, z_s - (big - (top_b + wall) * out_k) * tan(leg_angle)],
        [-(top_b + wall) * out_k, z_s], [0, z_legs],
        [(big - z_legs) / tan(leg_taper), big], [-big, big]]);

module slit() translate([-slit_w / 2, -big, -1]) cube([slit_w, big, z_s + 2]);

// A gable with a 45 degree roof, through the nail side.
module knuckle_notch() {
    w = min(0.7 * in_a, knuckle_notch_h);
    if (knuckle_notch_h > 0)
        mirror([0, 1, 0]) rotate([90, 0, 0]) linear_extrude(big)
            polygon([[-w, -1], [w, -1], [w, knuckle_notch_h - w], [0, knuckle_notch_h],
                     [-w, knuckle_notch_h - w]]);
}

// logo_depth deep into the nail side of the sleeve, as deep everywhere on the
// curve. Reads from +y with its top towards the tip.
module logo_cut()
    difference() {
        translate([0, 0, logo_z]) rotate([90, 0, 180]) linear_extrude(big)
            scale(logo_width / logo_w) translate([0, -logo_r]) logo();
        let (d = wall - logo_depth)
            outer_frustum(in_a + d, in_b + d, top_a + d, top_b + d, z_s);
    }

// The sleeve's outside: a frustum with half axes a0, b0 at the bottom, a1, b1
// at the top, or a faceted one around them.
module outer_frustum(a0, b0, a1, b1, h)
    rotate(180 / out_fn) frustum(a0 * out_k, b0 * out_k, a1 * out_k, b1 * out_k, h, out_fn);

module frustum(a0, b0, a1, b1, h, fn = $fn)
    hull() {
        scale([a0, b0, 1]) cylinder(r = 1, h = eps, $fn = fn);
        translate([0, 0, h - eps]) scale([a1, b1, 1]) cylinder(r = 1, h = eps, $fn = fn);
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
