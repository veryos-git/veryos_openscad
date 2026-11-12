// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V2. Against V1 (archive/artificial_fingernail.scad) the finger is a flat
// oval, measured in two places, and the claw is two parts in two materials:
// only the flexible one touches the finger.
//
// Finger claw: a long claw that slides onto a fingertip. A base model built
// from primitives, as a starting point for a sculpting program.
// - sleeve: flexible, TPU. A tube over the last phalanx, narrowing towards
//   the tip as the finger does. It stretches, so it has no slit. On the nail
//   side it reaches up to the fingertip and holds a pocket, closed at the
//   bottom; its sides fall away at leg_angle from there, so the fingertip's
//   pad is free, tip_free from the tip down.
// - claw: hard, PLA. A tongue in the sleeve's pocket, as wide as the
//   fingertip, and the blade above it. The blade continues the nail past the
//   fingertip, along a spine that bends towards the nail side. Its cross
//   sections are ellipses that narrow as sqrt(1 - t) along the spine, hulled
//   segment by segment; its underside a scoop: smaller sections on the same
//   spine, swept towards the pad. Above the sleeve it stands wall off the
//   finger.
// - joint: the tongue is pushed into the pocket from the tip and held by
//   friction; the sleeve's cover and the finger in it press on it. With
//   joint_clearance = 0 the two touch, to print them as one in two materials.
//
// The finger's axis is z, the fingertip points up, the nail side is +y, the
// pad side -y. Both parts print like that, each on its own or the two as one:
// the sleeve's open end on the bed, the claw on its tongue's end, tip up.
// Nothing overhangs more than 45 degrees, but the scoop's end, a bridge
// scoop_end_d wide, and the logos' strokes. The VeryOS logo is engraved in
// the nail side of both. Origin: centre of the sleeve's open end, for both
// parts.
//
// Units: mm. No external files or libraries needed.

/* [View] */
part = "assembly"; // [assembly:Sleeve and claw as worn,section:Sleeve and claw cut along the finger,sleeve:Sleeve of flexible TPU,claw:Claw of hard PLA]

/* [Finger] */
// Width of the finger, side to side, at the crease of the last joint.
finger_w = 15; // [8:0.5:26]
// Thickness of the finger, nail to pad, at the same place. A finger is a flat
// oval: less thick than wide.
finger_h = 11; // [6:0.5:22]
// Width of the fingertip at the middle of the nail, 7 mm from the tip.
fingertip_w = 14; // [7:0.5:25]
// Thickness of the fingertip, nail to pad, at the same place.
fingertip_h = 9.5; // [5:0.5:20]
// From the fingertip to the crease of the last joint, along the finger.
finger_length = 25; // [12:0.5:40]
// Added to widths and thicknesses. Untested; below 0 the sleeve has to
// stretch and grips.
clearance = 0; // [-2:0.1:2]

/* [Sleeve] */
wall = 1.2; // [0.8:0.1:3]
// The sleeve's skin over the tongue.
cover = 0.8; // [0.4:0.1:2]
// The fingertip's pad is free this far down from the tip.
tip_free = 9; // [4:0.5:20]

/* [Joint] */
// Thickness of the claw's tongue in the sleeve's pocket.
tongue_t = 3; // [1.2:0.1:4]
// Gap around the tongue, per side. Untested. 0: sleeve and claw touch, for
// one print in two materials.
joint_clearance = 0.1; // [0:0.05:0.4]

/* [Blade] */
// How far the blade reaches past the fingertip.
claw_length = 40; // [10:1:80]
// How far the blade's direction turns towards the nail side from base to
// tip, degrees: it bends in an arc. Above 45 the tip overhangs when printed.
claw_bend = 20; // [0:1:60]
// How far the tip leans back on top of that, towards the nail side, straight.
claw_lean = 2; // [0:0.5:15]
// Thickness of the blade at the top of its scoop; at the base it is tongue_t.
blade_thickness = 3; // [1.2:0.1:6]
claw_tip_d = 1.2; // [0.4:0.1:4]

/* [Look] */
// 0: smooth. 6 to 12: the blade is faceted, flat on the nail side.
facets = 0; // [0:1:16]

/* [Logo] */
// Engraved on the nail side: in the sleeve's cover and in the blade above it.
logo_width = 7; // [0:0.5:12]
logo_depth = 0.4; // [0.2:0.1:0.6]

/* [Hidden] */
$fn = 96;
eps = 0.01;
// Size of the cutting shapes: larger than the claw, but not by much. The
// preview breaks when the camera is inside one of them.
big = finger_length + claw_length;

// fingertip_w and fingertip_h are measured this far from the tip.
tip_at = 7;
// Half axes of the finger's section at z, in x and y: from the crease at
// z = 0 through the middle of the nail, straight on to the tip.
function fa(z) = (finger_w + (fingertip_w - finger_w) * z / (finger_length - tip_at) + clearance) / 2;
function fb(z) = (finger_h + (fingertip_h - finger_h) * z / (finger_length - tip_at) + clearance) / 2;
// How far outside the finger the tongue's two faces and the cover's outside
// are. The pocket's inner face is wall outside, joint_clearance under the
// tongue.
d_tongue_in = wall + joint_clearance;
d_tongue_out = d_tongue_in + tongue_t;
d_cover = d_tongue_out + joint_clearance + cover;
// The blade starts at the fingertip, z_top. On the nail side the sleeve ends
// one layer below it, so that the tongue's end in the pocket stops the claw,
// not the blade on the sleeve; on the pad side where the pad gets free.
z_top = finger_length;
sleeve_top = z_top - 0.2;
z_s = finger_length - tip_free;
// Half the tongue's width: the fingertip's, so that the cover ends within the
// sleeve's width and the sleeve's sides stay wall thick.
tongue_a = fa(z_top);
// The sleeve is this high under the tongue's end. The end is chamfered, to
// lead it into the pocket and against the first layer's squish: its two
// corners by corner, its two faces by end_chamfer.
floor_h = 2;
tongue_z0 = floor_h + joint_clearance;
corner = 1;
end_chamfer = 0.4;
// Chamfer of the open end's inner edge.
lead_in = 0.6;
// The sleeve's sides fall away at this angle from the horizontal, down to
// y_legs: wall below the pocket's lower edges at the sleeve's top.
leg_angle = 55;
y_legs = (fb(sleeve_top) + wall) * sqrt(1 - pow((tongue_a + joint_clearance) / (fa(sleeve_top) + wall), 2)) - wall;
// The blade's lower edges start at the tongue's, y_edge, and rise at this
// angle from the horizontal.
leg_taper = 78;
y_edge = (fb(z_top) + d_tongue_in) * sqrt(1 - pow(tongue_a / (fa(z_top) + d_tongue_in), 2));
// The spine is the blade's back, t from 0 at the sleeve's top to 1 at the
// tip: an arc of claw_length turning claw_bend, plus the lean. spine_angle is
// its direction off the finger's axis there.
function spine_angle(t) = claw_bend * t;
function spine(t) = let (
        arc = claw_bend == 0 ? [0, claw_length * t]
            : let (r = claw_length / (claw_bend * PI / 180))
              [r * (1 - cos(spine_angle(t))), r * sin(spine_angle(t))])
    [0, fb(z_top) + d_tongue_out + arc[0] + claw_lean * t, z_top + arc[1]];
// The scoop ends round, scoop_end_d wide, at scoop_top of the blade's length,
// blade_thickness under the blade's back there.
scoop_top = 0.75;
scoop_end_d = 2;
// Segments of the blade; the scoop ends on a segment's border.
segments = 16;
// A faceted blade has its flats, not its corners, on the smooth one's surface.
out_fn = facets > 0 ? facets : $fn;
out_k = facets > 0 ? 1 / cos(180 / facets) : 1;
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
logo_h = logo_width * 2 * logo_r / logo_w;

assert(z_s > floor_h + 4, "tip_free is too long for the sleeve: lower it, or raise finger_length.");
assert(blade_thickness >= tongue_t, "blade_thickness must be at least tongue_t.");
assert(logo_width + 2 <= 2 * tongue_a && logo_h + 2 <= sleeve_top - floor_h,
       "The logo does not fit on the sleeve's cover; lower logo_width.");

if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "sleeve") sleeve();
else if (part == "claw") claw();

module assembly() {
    color("dimgray") sleeve();
    color("gold") claw();
}

// Rendered in full, which takes a while: the preview's own cut lets the
// claw's colour show on the sleeve.
module section() {
    color("dimgray") render() half() sleeve();
    color("gold") render() half() claw();
}

module half()
    difference() {
        children();
        translate([0, -big, -big]) cube(2 * big);
    }

module sleeve() {
    difference() {
        sleeve_outer();
        frustum(0, -1, sleeve_top + 1);
        frustum(lead_in + 1, -1, lead_in, 0);
        pocket();
        pad_opening();
        if (logo_width > 0) logo_cut(sleeve_top / 2) sleeve_outer(logo_depth);
    }
}

module claw() {
    difference() {
        intersection() {
            union() {
                frustum(d_tongue_out - end_chamfer, tongue_z0, tongue_z0 + end_chamfer, d_tongue_out);
                frustum(d_tongue_out, tongue_z0 + end_chamfer, z_top);
                blade();
            }
            along_y() claw_plan();
        }
        frustum(d_tongue_in + end_chamfer + 1, tongue_z0 - 1, tongue_z0 + end_chamfer, d_tongue_in);
        frustum(d_tongue_in, tongue_z0 + end_chamfer, z_top);
        scoop();
        blade_edges();
        if (logo_width > 0) logo_cut(z_top + 2 + logo_h / 2) blade(logo_depth);
    }
}

// The sleeve's outside, inset further in: the tube around the finger and the
// cover over the tongue, with straight flanks between the two.
module sleeve_outer(inset = 0)
    hull() for (z = [0, sleeve_top - eps]) translate([0, 0, z]) {
        disc(wall - inset, z);
        linear_extrude(eps) cap(fa(z) + d_cover - inset, fb(z) + d_cover - inset,
                                tongue_a + joint_clearance + wall - inset);
    }

// The part of an ellipse a by b on the nail side of its chord from -x to x.
module cap(a, b, x)
    polygon([for (i = [0 : $fn / 2])
        let (v = acos(x / a) + i * (180 - 2 * acos(x / a)) / ($fn / 2)) [a * cos(v), b * sin(v)]]);

// The tongue with joint_clearance around it, open at the sleeve's top.
module pocket()
    intersection() {
        difference() {
            frustum(d_tongue_out + joint_clearance, floor_h, sleeve_top + 1);
            frustum(wall, floor_h - 1, sleeve_top + 2);
        }
        along_y() offset(delta = joint_clearance) tongue_plan(sleeve_top + 1);
    }

// The tongue seen from the nail side, in x and z, up to top.
module tongue_plan(top)
    polygon([[corner - tongue_a, tongue_z0], [tongue_a - corner, tongue_z0],
             [tongue_a, tongue_z0 + corner], [tongue_a, top], [-tongue_a, top],
             [-tongue_a, tongue_z0 + corner]]);

// The claw seen from the nail side: the tongue, and above the sleeve
// everything between two slopes that widen at 45 degrees from its sides.
module claw_plan() {
    tongue_plan(z_top);
    polygon([[-tongue_a, z_top], [tongue_a, z_top], [tongue_a + big, z_top + big],
             [-tongue_a - big, z_top + big]]);
}

// A shape in x and z, extruded from the finger's middle towards the nail side.
module along_y() rotate([-90, 0, 0]) linear_extrude(big, convexity = 4) mirror([0, 1]) children();

// Everything above a slope that rises at leg_angle from the sleeve's top at
// the pad, as far as y_legs.
module pad_opening() {
    pad_b = fb(z_s) + wall;
    rotate([90, 0, 90]) linear_extrude(big, center = true) polygon([
        [-big, z_s - (big - pad_b) * tan(leg_angle)], [-pad_b, z_s],
        [y_legs, z_s + (y_legs + pad_b) * tan(leg_angle)], [y_legs, big], [-big, big]]);
}

// Half axes of the blade's section at t, from the tongue's outside down to
// the tip's radius.
function blade_a(t) = max((fa(z_top) + d_tongue_out) * sqrt(1 - t), claw_tip_d / 2);
function blade_b(t) = max((fb(z_top) + d_tongue_out) * sqrt(1 - t), claw_tip_d / 2);

// The blade, its surface inset further in. Its first section is the tongue's:
// smooth, also when the blade is faceted.
module blade(inset = 0)
    for (i = [0 : segments - 1]) hull() for (t = [i, i + 1] / segments)
        slice(t, max(blade_a(t) - inset, eps), max(blade_b(t) - inset, eps), inset,
              t == 0 ? $fn : out_fn, t == 0 ? 1 : out_k);

// The scoop's section at t: the tongue's inside, narrowing to scoop_end_d at
// scoop_top, its back thickness(t) under the blade's back. It closes at 45
// degrees at most, which is scoop_r, so that it prints without support.
function scoop_r(t) = scoop_end_d / 2 + (scoop_top - t) * claw_length;
function scoop_a(t) = max(min((fa(z_top) + d_tongue_in) * sqrt(1 - t / scoop_top), scoop_r(t)), scoop_end_d / 2);
function scoop_b(t) = max(min((fb(z_top) + d_tongue_in) * sqrt(1 - t / scoop_top), scoop_r(t)), scoop_end_d / 2);
function thickness(t) = tongue_t + (blade_thickness - tongue_t) * t / scoop_top;

// Each segment swept towards the pad, so that the scoop leaves the blade's
// underside and cuts its sides off cleanly.
module scoop()
    for (i = [0 : round(scoop_top * segments) - 1]) hull() for (dy = [0, -big], t = [i, i + 1] / segments)
        translate([0, dy, 0]) slice(t, scoop_a(t), scoop_b(t), thickness(t), $fn, 1);

// An ellipse a by b across the spine at t, its back off under the spine,
// facing along the spine. k and fn facet it.
module slice(t, a, b, off, fn, k)
    translate(spine(t)) rotate([-spine_angle(t), 0, 0]) translate([0, -off - b, 0])
        scale([a * k, b * k, 1]) rotate(180 / fn) cylinder(r = 1, h = eps, center = true, $fn = fn);

// What the blade loses above the sleeve: everything on the pad side of its
// lower edges, which start at the tongue's and rise at leg_taper. It starts
// below the sleeve's top, where the tongue is all on the nail side of it.
module blade_edges()
    rotate([90, 0, 90]) linear_extrude(big, center = true) polygon([
        [-big, z_top - 1], [y_edge, z_top - 1], [y_edge, z_top],
        [y_edge + big / tan(leg_taper), z_top + big], [-big, z_top + big]]);

// logo_depth deep into the nail side at the height z, as deep everywhere on
// the curve: the logo's prism minus the children, the surface it is cut into
// inset by logo_depth. Reads from +y with its top towards the tip.
module logo_cut(z)
    difference() {
        translate([0, 0, z]) rotate([90, 0, 180]) linear_extrude(big)
            scale(logo_width / logo_w) translate([0, -logo_r]) logo();
        children();
    }

// A cone around the finger from z0 to z1: d outside of it at z0, d1 at z1.
module frustum(d, z0, z1, d1)
    hull() {
        translate([0, 0, z0]) disc(d, z0);
        translate([0, 0, z1 - eps]) disc(d1 == undef ? d : d1, z1);
    }

// The finger's section at z, d outside of it.
module disc(d, z) scale([fa(z) + d, fb(z) + d, 1]) cylinder(r = 1, h = eps);

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
