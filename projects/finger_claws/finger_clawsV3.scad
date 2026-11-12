// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V3. Against V2 the script makes the claws of a whole hand at once: every
// finger has its own measures, and its sleeve and its claw carry its number
// in dots under the logo, thumb 1 to little finger 5. The claw is two skins,
// its outside and its hollow, instead of hulled segments: it renders in a
// tenth of the time.
//
// Finger claws: long claws that slide onto the fingertips. A base model built
// from primitives and skins, as a starting point for a sculpting program.
// Per finger:
// - sleeve: flexible, TPU. A tube over the last phalanx, narrowing towards
//   the tip as the finger does. It stretches, so it has no slit. On the nail
//   side it reaches up to the fingertip and holds a pocket, closed at the
//   bottom; its sides fall away at leg_angle from there, so the fingertip's
//   pad is free, pad_free of the finger's length from the tip down.
// - claw: hard, PLA. A tongue in the sleeve's pocket, as wide as the
//   fingertip, and the blade above it. The blade continues the nail past the
//   fingertip, along a spine that bends towards the nail side. Its cross
//   sections are ellipses that narrow as sqrt(1 - t) along the spine, with a
//   skin over them and the tongue; its underside a scoop: smaller sections
//   on the same spine, open towards the pad. Above the sleeve it stands wall
//   off the finger.
// - joint: the tongue is pushed into the pocket from the tip and held by
//   friction; the sleeve's cover and the finger in it press on it. With
//   joint_clearance = 0 the two touch, to print them as one in two materials.
//
// A finger's axis is z, the fingertip points up, the nail side is +y, the pad
// side -y. All parts print like that, sleeves and claws each on their own or
// the two as one: the sleeve's open end on the bed, the claw on its tongue's
// end, tip up. Nothing overhangs more than 45 degrees, but the scoop's end, a
// bridge scoop_end_d wide, the logos' strokes and the dots. The VeryOS logo
// is engraved in the nail side of every sleeve and every blade. Origin:
// centre of the sleeve's open end, for sleeve and claw alike; the hand's
// fingers stand in a row along x, pitch apart, the thumb on the origin.
//
// Units: mm. No external files or libraries needed.

/* [View] */
part = "assembly"; // [assembly:Sleeves and claws as worn,section:Sleeves and claws cut along the finger,sleeve:Sleeves of flexible TPU,claw:Claws of hard PLA]
finger = "hand"; // [hand:All five fingers of one hand,thumb:Thumb,index:Index finger,middle:Middle finger,ring:Ring finger,pinky:Little finger]

/* [Thumb] */
// Width of the finger, side to side, at the crease of the last joint.
thumb_w = 19; // [8:0.5:26]
// Thickness of the finger, nail to pad, at the same place. A finger is a flat
// oval: less thick than wide.
thumb_h = 13.5; // [6:0.5:22]
// Width of the fingertip at the middle of the nail, 7 mm from the tip.
thumb_tip_w = 18; // [7:0.5:25]
// Thickness of the fingertip, nail to pad, at the same place.
thumb_tip_h = 11.5; // [5:0.5:20]
// From the fingertip to the crease of the last joint, along the finger.
thumb_length = 28; // [12:0.5:40]
// How far the blade reaches past the fingertip.
thumb_claw = 30; // [10:1:80]

/* [Index finger] */
// The same six measures as the thumb's, for every finger.
index_w = 16.5; // [8:0.5:26]
index_h = 12; // [6:0.5:22]
index_tip_w = 15.5; // [7:0.5:25]
index_tip_h = 10.5; // [5:0.5:20]
index_length = 25; // [12:0.5:40]
index_claw = 40; // [10:1:80]

/* [Middle finger] */
middle_w = 17; // [8:0.5:26]
middle_h = 12.5; // [6:0.5:22]
middle_tip_w = 16; // [7:0.5:25]
middle_tip_h = 11; // [5:0.5:20]
middle_length = 26; // [12:0.5:40]
middle_claw = 45; // [10:1:80]

/* [Ring finger] */
ring_w = 16; // [8:0.5:26]
ring_h = 11.5; // [6:0.5:22]
ring_tip_w = 15; // [7:0.5:25]
ring_tip_h = 10; // [5:0.5:20]
ring_length = 25; // [12:0.5:40]
ring_claw = 42; // [10:1:80]

/* [Little finger] */
pinky_w = 15; // [8:0.5:26]
pinky_h = 11; // [6:0.5:22]
pinky_tip_w = 14; // [7:0.5:25]
pinky_tip_h = 9; // [5:0.5:20]
pinky_length = 22; // [12:0.5:40]
pinky_claw = 32; // [10:1:80]

/* [Sleeve] */
// Added to all widths and thicknesses. Untested; below 0 the sleeve has to
// stretch and grips.
clearance = 0; // [-2:0.1:2]
wall = 1.2; // [0.8:0.1:3]
// The sleeve's skin over the tongue.
cover = 0.8; // [0.4:0.1:2]
// The fingertip's pad is free this far down from the tip, as a part of the
// finger's length.
pad_free = 0.36; // [0.15:0.01:0.7]

/* [Joint] */
// Thickness of the claw's tongue in the sleeve's pocket.
tongue_t = 3; // [1.2:0.1:4]
// Gap around the tongue, per side. Untested. 0: sleeve and claw touch, for
// one print in two materials.
joint_clearance = 0.1; // [0:0.05:0.4]

/* [Blade] */
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
// Also the depth of the dots under it, the finger's number.
logo_depth = 0.4; // [0.2:0.1:0.6]

/* [Hidden] */
// A multiple of 4: the half sections of the claw's hollow need a middle point.
$fn = 96;
eps = 0.01;

// The fingers and their measures, in this order.
names = ["thumb", "index", "middle", "ring", "pinky"];
finger_w = [thumb_w, index_w, middle_w, ring_w, pinky_w];
finger_h = [thumb_h, index_h, middle_h, ring_h, pinky_h];
fingertip_w = [thumb_tip_w, index_tip_w, middle_tip_w, ring_tip_w, pinky_tip_w];
fingertip_h = [thumb_tip_h, index_tip_h, middle_tip_h, ring_tip_h, pinky_tip_h];
finger_length = [thumb_length, index_length, middle_length, ring_length, pinky_length];
claw_length = [thumb_claw, index_claw, middle_claw, ring_claw, pinky_claw];

// The tip's width and thickness are measured this far from the tip.
tip_at = 7;
// Half axes of the finger's section at z, in x and y: from the crease at
// z = 0 through the middle of the nail, straight on to the tip.
function fa(z) = ($finger_w + ($fingertip_w - $finger_w) * z / ($finger_length - tip_at) + clearance) / 2;
function fb(z) = ($finger_h + ($fingertip_h - $finger_h) * z / ($finger_length - tip_at) + clearance) / 2;
// How far outside the finger the tongue's two faces and the cover's outside
// are. The pocket's inner face is wall outside, joint_clearance under the
// tongue.
d_tongue_in = wall + joint_clearance;
d_tongue_out = d_tongue_in + tongue_t;
d_cover = d_tongue_out + joint_clearance + cover;
// From finger to finger in the hand's row: none is wider than its width at
// the crease plus the cover on both sides.
pitch = max(finger_w) + 2 * d_cover + 4;
// The sleeve is this high under the tongue's end. The end is chamfered, to
// lead it into the pocket and against the first layer's squish: its two
// corners by corner, its two faces by end_chamfer.
floor_h = 2;
tongue_z0 = floor_h + joint_clearance;
corner = 1;
end_chamfer = 0.4;
// Chamfer of the open end's inner edge.
lead_in = 0.6;
// The sleeve's sides fall away at this angle from the horizontal; the
// blade's lower edges rise at leg_taper.
leg_angle = 55;
leg_taper = 78;
// The spine is the blade's back, t from 0 at the sleeve's top to 1 at the
// tip: an arc of the claw's length turning claw_bend, plus the lean.
// spine_angle is its direction off the finger's axis there.
function spine_angle(t) = claw_bend * t;
function spine(t) = let (
        arc = claw_bend == 0 ? [0, $claw_length * t]
            : let (r = $claw_length / (claw_bend * PI / 180))
              [r * (1 - cos(spine_angle(t))), r * sin(spine_angle(t))])
    [0, fb($z_top) + d_tongue_out + arc[0] + claw_lean * t, $z_top + arc[1]];
// The scoop ends round, scoop_end_d wide, at scoop_top of the blade's length,
// blade_thickness under the blade's back there.
scoop_top = 0.75;
scoop_end_d = 2;
// Sections of the blade's skin; the scoop ends on one of them.
segments = 16;
// The finger's number: dots in a row, their middle this far under the logo.
dot_d = 1.2;
dot_pitch = 2;
dots_under = 1.5;
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

assert(blade_thickness >= tongue_t, "blade_thickness must be at least tongue_t.");

if (finger == "hand") for (i = [0 : 4]) translate([i * pitch, 0, 0]) measures(i) show();
else measures(search([finger], names)[0]) show();

// Everything below makes one finger. This sets its measures for the modules
// and functions under it: the $ variables.
module measures(i) {
    $finger_w = finger_w[i];
    $finger_h = finger_h[i];
    $fingertip_w = fingertip_w[i];
    $fingertip_h = fingertip_h[i];
    $finger_length = finger_length[i];
    $claw_length = claw_length[i];
    $dots = i + 1;
    // Size of the cutting shapes: larger than the claw, but not by much. The
    // preview breaks when the camera is inside one of them.
    $big = $finger_length + $claw_length;
    // The blade starts at the fingertip, $z_top. On the nail side the sleeve
    // ends one layer below it, so that the tongue's end in the pocket stops
    // the claw, not the blade on the sleeve; on the pad side at $z_s, where
    // the pad gets free.
    $z_top = $finger_length;
    $sleeve_top = $z_top - 0.2;
    $z_s = $finger_length * (1 - pad_free);
    // Half the tongue's width: the fingertip's, so that the cover ends within
    // the sleeve's width and the sleeve's sides stay wall thick.
    $tongue_a = fa($z_top);
    // The sleeve's sides fall away as far as $y_legs: wall below the pocket's
    // lower edges at the sleeve's top. The blade's lower edges start at the
    // tongue's, $y_edge.
    $y_legs = (fb($sleeve_top) + wall) * sqrt(1 - pow(($tongue_a + joint_clearance) / (fa($sleeve_top) + wall), 2)) - wall;
    $y_edge = (fb($z_top) + d_tongue_in) * sqrt(1 - pow($tongue_a / (fa($z_top) + d_tongue_in), 2));
    assert($z_s > floor_h + 4, str("pad_free is too long for the ", names[i], "'s sleeve: lower it, or raise its length."));
    assert(max(logo_width, 4 * dot_pitch + dot_d) + 2 <= 2 * $tongue_a && logo_h + 8 <= $sleeve_top - floor_h,
           str("Logo and dots do not fit on the ", names[i], "'s sleeve; lower logo_width."));
    children();
}

module show() {
    if (part == "assembly") assembly();
    else if (part == "section") section();
    else if (part == "sleeve") sleeve();
    else if (part == "claw") claw();
}

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
        translate([0, -$big, -$big]) cube(2 * $big);
    }

module sleeve() {
    difference() {
        sleeve_outer();
        frustum(0, -1, $sleeve_top + 1);
        frustum(lead_in + 1, -1, lead_in, 0);
        pocket();
        pad_opening();
        engrave(fb(0) + wall) {
            marks($sleeve_top / 2 + 1);
            sleeve_outer(logo_depth);
        }
    }
}

module claw() {
    difference() {
        intersection() {
            hard();
            along_y() claw_plan();
        }
        hollow();
        blade_edges();
        engrave(fb($z_top) + d_tongue_in + 1) {
            marks($z_top + 4 + logo_h / 2);
            hard(logo_depth);
        }
    }
}

// The sleeve's outside, inset further in: the tube around the finger and the
// cover over the tongue, with straight flanks between the two.
module sleeve_outer(inset = 0)
    hull() for (z = [0, $sleeve_top - eps]) translate([0, 0, z]) {
        disc(wall - inset, z);
        linear_extrude(eps) cap(fa(z) + d_cover - inset, fb(z) + d_cover - inset,
                                $tongue_a + joint_clearance + wall - inset);
    }

// The part of an ellipse a by b on the nail side of its chord from -x to x.
module cap(a, b, x)
    polygon([for (i = [0 : $fn / 2])
        let (v = acos(x / a) + i * (180 - 2 * acos(x / a)) / ($fn / 2)) [a * cos(v), b * sin(v)]]);

// The tongue with joint_clearance around it, open at the sleeve's top.
module pocket()
    intersection() {
        difference() {
            frustum(d_tongue_out + joint_clearance, floor_h, $sleeve_top + 1);
            frustum(wall, floor_h - 1, $sleeve_top + 2);
        }
        along_y() offset(delta = joint_clearance) tongue_plan($sleeve_top + 1);
    }

// The tongue seen from the nail side, in x and z, up to top.
module tongue_plan(top)
    polygon([[corner - $tongue_a, tongue_z0], [$tongue_a - corner, tongue_z0],
             [$tongue_a, tongue_z0 + corner], [$tongue_a, top], [-$tongue_a, top],
             [-$tongue_a, tongue_z0 + corner]]);

// The claw seen from the nail side: the tongue, and above the sleeve
// everything between two slopes that widen at 45 degrees from its sides.
module claw_plan() {
    tongue_plan($z_top);
    polygon([[-$tongue_a, $z_top], [$tongue_a, $z_top], [$tongue_a + $big, $z_top + $big],
             [-$tongue_a - $big, $z_top + $big]]);
}

// A shape in x and z, extruded from the finger's middle towards the nail side.
module along_y() rotate([-90, 0, 0]) linear_extrude($big, convexity = 4) mirror([0, 1]) children();

// Everything above a slope that rises at leg_angle from the sleeve's top at
// the pad, as far as $y_legs.
module pad_opening() {
    pad_b = fb($z_s) + wall;
    rotate([90, 0, 90]) linear_extrude($big, center = true) polygon([
        [-$big, $z_s - ($big - pad_b) * tan(leg_angle)], [-pad_b, $z_s],
        [$y_legs, $z_s + ($y_legs + pad_b) * tan(leg_angle)], [$y_legs, $big], [-$big, $big]]);
}

// Half axes of the blade's section at t, from the tongue's outside down to
// the tip's radius.
function blade_a(t) = max((fa($z_top) + d_tongue_out) * sqrt(1 - t), claw_tip_d / 2);
function blade_b(t) = max((fb($z_top) + d_tongue_out) * sqrt(1 - t), claw_tip_d / 2);

// The claw before it is hollowed, its surface inset further in: one skin from
// the tongue's end, chamfered there, up the tongue and along the blade. The
// tongue's sections are smooth, also when the blade is faceted.
module hard(inset = 0)
    skin(concat(
        [level(tongue_z0, d_tongue_out - end_chamfer - inset),
         level(tongue_z0 + end_chamfer, d_tongue_out - inset)],
        [for (i = [0 : segments]) let (t = i / segments)
            ring(t, max(blade_a(t) - inset, eps), max(blade_b(t) - inset, eps), inset, i == 0 ? 0 : facets)]));

// The scoop's section at t: the tongue's inside, narrowing to scoop_end_d at
// scoop_top, its back thickness(t) under the blade's back. It closes at 45
// degrees at most, which is scoop_r, so that it prints without support.
function scoop_r(t) = scoop_end_d / 2 + (scoop_top - t) * $claw_length;
function scoop_a(t) = max(min((fa($z_top) + d_tongue_in) * sqrt(1 - t / scoop_top), scoop_r(t)), scoop_end_d / 2);
function scoop_b(t) = max(min((fb($z_top) + d_tongue_in) * sqrt(1 - t / scoop_top), scoop_r(t)), scoop_end_d / 2);
function thickness(t) = tongue_t + (blade_thickness - tongue_t) * t / scoop_top;

// What is taken out of it: one skin from below the tongue's end, where it
// chamfers the tongue's inner face, up the tongue's inside and along the
// scoop. Each section is open towards the pad, so that the scoop leaves the
// blade's underside and cuts its sides off cleanly.
module hollow()
    skin(concat(
        [open(level(tongue_z0 - 1, d_tongue_in + end_chamfer + 1, true)),
         open(level(tongue_z0 + end_chamfer, d_tongue_in, true))],
        [for (i = [0 : round(scoop_top * segments)]) let (t = i / segments)
            open(arc(t, scoop_a(t), scoop_b(t), thickness(t)))]));

// The half of a section on the nail side with two more points: its two ends
// moved in the section's plane to 1 beyond the finger's middle, y = -1. The
// claw has nothing there: claw_plan and blade_edges end it before.
function open(half) = let (n = len(half) - 1, up = half[n / 2] - (half[0] + half[n]) / 2)
    concat(half, [for (p = [half[n], half[0]]) p - up * (p[1] + 1) / up[1]]);

// The points of a section across the spine at t, anticlockwise seen from the
// tip: an ellipse a by b, its back off under the spine. flat > 0 makes it a
// polygon of as many flat sides around that ellipse, one on the nail side.
function ring(t, a, b, off, flat) = [for (j = [0 : $fn - 1]) spoke(t, a, b, off, flat, j * 360 / $fn)];

// The half of such an ellipse on the nail side, both ends included.
function arc(t, a, b, off) = [for (j = [0 : $fn / 2]) spoke(t, a, b, off, 0, j * 360 / $fn)];

// The finger's section at z, d outside of it, as such points: all of it, or
// only its half on the nail side, both ends included.
function level(z, d, half = false) = [for (j = [0 : half ? $fn / 2 : $fn - 1])
    let (v = j * 360 / $fn) [(fa(z) + d) * cos(v), (fb(z) + d) * sin(v), z]];

function spoke(t, a, b, off, flat, v) = let (
        k = flat > 0 ? 1 / cos((v + 270 + 180 / flat) % (360 / flat) - 180 / flat) : 1)
    across(t, [a * k * cos(v), b * k * sin(v) - off - b]);

// A point in the plane across the spine at t: x beside the spine, y towards
// the nail side of it.
function across(t, p) = let (c = spine(t), w = spine_angle(t))
    [p[0], c[1] + p[1] * cos(w), c[2] - p[1] * sin(w)];

// A closed skin over rings of as many points each, the first ring at the
// bottom, all anticlockwise seen from the top. Each four-sided patch between
// two rings is two triangles, split along the diagonal that stands out: a
// skin over rings of different shapes has no dents then.
module skin(rings) {
    n = len(rings[0]);
    last = (len(rings) - 1) * n;
    points = [for (ring = rings) each ring];
    polyhedron(
        points = points,
        faces = concat(
            [for (j = [1 : n - 2]) [0, j, j + 1]],
            [for (j = [1 : n - 2]) [last, last + j + 1, last + j]],
            [for (i = [0 : n : last - n], j = [0 : n - 1])
                let (a = i + j, b = i + (j + 1) % n, c = b + n, d = a + n,
                     out = cross(points[d] - points[a], points[c] - points[a]) * (points[b] - points[a]) > 0)
                each out ? [[a, d, c], [a, c, b]] : [[a, d, b], [d, c, b]]]),
        convexity = 4);
}

// What the blade loses above the sleeve: everything on the pad side of its
// lower edges, which start at the tongue's and rise at leg_taper. It starts
// below the sleeve's top, where the tongue is all on the nail side of it.
module blade_edges()
    rotate([90, 0, 90]) linear_extrude($big, center = true) polygon([
        [-$big, $z_top - 1], [$y_edge, $z_top - 1], [$y_edge, $z_top],
        [$y_edge + $big / tan(leg_taper), $z_top + $big], [-$big, $z_top + $big]]);

// logo_depth deep into the nail side, as deep everywhere on the curve: the
// prism of the first child, a flat shape in x and z, minus the second, the
// surface it is cut into, inset by logo_depth. The prism starts at y, inside
// the part's wall. The shape reads from +y.
module engrave(y)
    difference() {
        translate([0, y, 0]) rotate([90, 0, 180]) linear_extrude($big) children(0);
        children(1);
    }

// What is engraved: the logo, its middle at the height z, and under it the
// finger's number as dots in a row: thumb 1, little finger 5.
module marks(z) {
    if (logo_width > 0) translate([0, z]) scale(logo_width / logo_w) translate([0, -logo_r]) logo();
    for (j = [0 : $dots - 1])
        translate([(j - ($dots - 1) / 2) * dot_pitch, z - logo_h / 2 - dots_under]) circle(d = dot_d, $fn = 16);
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
