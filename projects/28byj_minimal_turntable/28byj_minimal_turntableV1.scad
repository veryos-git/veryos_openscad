// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V1.
//
// Minimal turntable for the 28BYJ-48 stepper motor. The motor turns the
// platform directly, no gears. Two printed parts and a ring of 6 mm airsoft
// BBs, no screws:
// - base: a round cup. The motor stands on its floor, shaft up on the cup's
//   axis, and drops in through the rim; its ears sit on two pegs, which keep
//   it from turning. The cable leaves through a window in the wall, wide
//   enough for the plug. The rim carries a 90 degree V-groove for the balls
//   on a 45 degree flare.
// - platform: a round plate. It rests on the balls with the same V-groove in
//   a ring on its underside, which centres it. A hub on the underside takes
//   the shaft's flats: the shaft turns the platform but does not carry it.
//
// Print the base standing, the platform upside down, its top face on the
// bed. No overhang is steeper than 45 degrees; nothing needs support. The
// VeryOS logo is engraved in the front of the base's wall and in the
// platform's top face.
// Origin: centre of the base's bottom face, on the motor's shaft axis.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:Both parts on the bed,assembly:Assembly with motor and balls,section:Assembly cut in half,base:Base,platform:Platform upside down as it prints]

/* [Platform] */
// At least the base's rim (74 at the defaults), so it covers the balls.
platform_d = 80;
// The plate above the ring on its underside.
platform_thickness = 3.2;

/* [Balls] */
// 6 mm airsoft BBs measure 5.95.
ball_d = 5.95;
// Between the platform's ring and the base's rim; the balls show in it.
gap = 2;

/* [28BYJ-48] */
// From the datasheet drawing, image copy 2.png.
motor_d = 28;
// Back face to the front of the ears.
motor_height = 19;
// Shaft axis to the can's axis.
shaft_offset = 8;
ear_spacing = 35;
ear_hole_d = 4.2;
ear_r = 3.5;
// Not in the drawing.
ear_thickness = 1;
boss_d = 9;
boss_height = 1.5;
shaft_d = 5;
// Across the flats.
shaft_flats = 3;
// Front of the ears to the tip, +-0.5 by the drawing.
shaft_length = 10;
shaft_length_tolerance = 0.5;
// The flats, from the tip.
flats_length = 6;
// The cable's box on the can, opposite the shaft: 14.6 +0.2 wide, reaching
// 17 from the can's axis.
box_width = 14.8;
box_reach = 17;

/* [Fits] */
// Diameter clearance of the shaft in the platform's hub.
shaft_clearance = 0.2;
// In the ears' 4.2 holes.
peg_d = 3.8;
// Gap around the motor where it drops in.
motor_clearance = 0.5;

/* [Base] */
floor_thickness = 1.6;
// The base's wall, the 45 degree flare under its rim and the platform's hub.
wall = 2;
// The rim's flat between its inner edge and the groove.
land = 1.2;
// Window for the cable, wide enough for its 5 pin JST XH plug (12.4 x 5.8).
// A 45 degree roof above the height.
cable_window_width = 15;
cable_window_height = 6;

/* [Logo] */
// In the front of the base's wall.
base_logo_width = 12;
// In the platform's top face, near its edge.
platform_logo_width = 12;
logo_depth = 0.6;

/* [Quality] */
$fn = 180;

/* [Hidden] */
eps = 0.01;
layout_gap = 5;
layer = 0.2;
// The next multiple of the layer height.
function layers(z) = ceil(z / layer - 1e-6) * layer;
ball_r = ball_d / 2;
platform_r = platform_d / 2;
// A ball touches both 45 degree flanks of each groove, so its centre lies
// ball_r * sqrt(2) above the groove's bottom edge, and gap / 2 above the rim.
groove_depth = ball_r * sqrt(2) - gap / 2;
// How far below the rim the ball touches the flanks.
contact_depth = groove_depth - ball_r / sqrt(2);
// The motor's farthest point from the shaft: the corners of its cable box.
ear_x = ear_spacing / 2;
motor_reach = max(norm([box_width / 2, shaft_offset + box_reach]),
                  norm([ear_x, shaft_offset]) + ear_r, shaft_offset + motor_d / 2);
// The base's inside, up to the rim's inner edge.
inner_r = motor_reach + motor_clearance;
outer_r = inner_r + wall;
track_r = inner_r + land + groove_depth;
// The flare is wall thick under the groove's outer flank.
rim_r = track_r + groove_depth + wall * sqrt(2);
// Heights. The motor stands on the floor.
ear_z = floor_thickness + motor_height;
// Tip of the longest shaft.
tip_z = ear_z + shaft_length + shaft_length_tolerance;
// The hub's hole ends 0.5 above the tip, 1.2 under the top face.
hole_z = tip_z + 0.5;
top_z = layers(hole_z + 1.2);
plate_z = top_z - platform_thickness;
// The platform's groove leaves wall above its bottom edge.
ring_z = top_z - layers(groove_depth + wall);
rim_z = ring_z - gap;
flare_z = rim_z - (rim_r - outer_r);
ball_z = rim_z + gap / 2;
// The hub ends 1 above the boss. It is round inside up to 0.4 above where
// the flats start on the longest shaft, which also covers the flats' -0.2,
// double-D above.
hub_z = ear_z + boss_height + 1;
hole_d = shaft_d + shaft_clearance;
hub_r = hole_d / 2 + wall;
flats_z = tip_z - flats_length + 0.4;
// A post under each ear, motor_clearance off the can, 1 below the ear, so
// the motor stands on the floor. Its peg reaches 1 above the ear.
post_r = ear_x - motor_d / 2 - motor_clearance;
post_z = ear_z - ear_thickness - 1;
peg_z = ear_z + 1;
peg_chamfer = 0.6;
// The balls fill the track with a little play.
n_balls = floor(2 * PI * track_r / (ball_d + 0.1));
// The logo at the size of veryos_logo.svg, as in veryos_logo_cube: a ring and
// the two arms of a V, all logo_stroke wide. The arms stand logo_angle off
// vertical, their outer edges tangent to the ring, their inner edges tangent
// to its hole.
logo_r = 15.6264133379; // outer radius of the ring
logo_stroke = 5;
logo_angle = 22.5;
// Half the flat bottom edge, which is tangent to the ring's bottom.
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
// Outer edge of an arm. The middle of its square end is level with the
// middle of the ring's stroke at the top.
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
// The S in the ring: two half rings around half discs, all strokes
// logo_stroke wide.
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;
// Height of a logo of the given width.
function logo_h(width) = width * 2 * logo_r / logo_w;
// The base's logo in the middle of the wall below the flare, the platform's
// 3 inside its edge.
base_logo_z = flare_z / 2;
platform_logo_y = platform_r - logo_h(platform_logo_width) / 2 - 3;

assert(contact_depth >= 0.6, "gap is too large: the balls must touch the grooves' flanks at least 0.6 below their edges.");
assert(platform_r >= rim_r, str("platform_d must be at least the base's rim, ", 2 * rim_r, "."));
assert(post_r >= 2, "motor_clearance is too large: the posts under the ears get thinner than 4.");
assert(floor_thickness + cable_window_height + cable_window_width / 2 <= flare_z - 1,
       "The cable window reaches into the rim's flare; lower cable_window_height or cable_window_width.");
assert(logo_h(base_logo_width) + 2 <= flare_z, "The base's logo is higher than its wall below the flare; lower base_logo_width.");
assert(norm([platform_logo_width / 2, platform_logo_y + logo_h(platform_logo_width) / 2]) <= platform_r - 1,
       "The platform's logo does not fit inside its edge; lower platform_logo_width.");

echo(str(n_balls, " balls of ", ball_d, " on a ", 2 * track_r, " track; base ", 2 * rim_r,
         " across, ", top_z, " high with the platform"));

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "base") base();
else if (part == "platform") translate([0, 0, top_z]) rotate([180, 0, 0]) platform();

module assembly() {
    color("white") base();
    color("silver") motor();
    color("orange") balls();
    color("deepskyblue") platform();
}

// The assembly with the half on +x cut away; look at it from +x. The cut
// runs through the shaft, the hub and the cable window.
module section() {
    color("white") side_cut() base();
    color("silver") side_cut() motor();
    color("orange") side_cut() balls();
    color("deepskyblue") side_cut() platform();
}

// Cuts away the half on +x, rendered so it keeps its colour.
module side_cut()
    render() difference() {
        children();
        translate([0, -platform_d, -1]) cube(2 * platform_d);
    }

// Both parts as they print: the base standing, the platform upside down.
module print_layout() {
    base();
    translate([rim_r + platform_r + layout_gap, 0, top_z]) rotate([180, 0, 0]) platform();
}

// Cup with the floor, the wall, the 45 degree flare and the rim's groove;
// the posts with their pegs, the cable window at the back (+y), behind the
// motor, the logo in the front (-y).
module base() {
    difference() {
        union() {
            rotate_extrude() polygon([
                [0, 0], [outer_r, 0], [outer_r, flare_z], [rim_r, rim_z],
                [track_r + groove_depth, rim_z], [track_r, rim_z - groove_depth],
                [track_r - groove_depth, rim_z], [inner_r, rim_z], [inner_r, floor_thickness],
                [0, floor_thickness]]);
            for (s = [-1, 1]) post(s);
        }
        cable_window();
        base_logo_cut();
    }
}

// Under the ear on side s, joined to the wall, with a peg through the ear's
// hole.
module post(s) {
    intersection() {
        hull() for (x = [ear_x, outer_r]) translate([s * x, shaft_offset, 0]) cylinder(r = post_r, h = post_z);
        cylinder(r = inner_r + wall / 2, h = post_z);
    }
    translate([s * ear_x, shaft_offset, 0]) {
        cylinder(d = peg_d, h = peg_z - peg_chamfer);
        translate([0, 0, peg_z - peg_chamfer]) cylinder(d1 = peg_d, d2 = peg_d - 2 * peg_chamfer, h = peg_chamfer);
    }
}

// Through the wall behind the motor's cable box, from the floor up, with a
// 45 degree roof.
module cable_window() {
    w = cable_window_width;
    h = cable_window_height;
    translate([0, inner_r - 3, floor_thickness]) rotate([90, 0, 180]) linear_extrude(wall + 6)
        polygon([[-w / 2, 0], [w / 2, 0], [w / 2, h], [0, h + w / 2], [-w / 2, h]]);
}

// Upright in the front of the wall (-y), opposite the cable window,
// logo_depth deep all across the curve.
module base_logo_cut() {
    intersection() {
        translate([0, 0, base_logo_z]) rotate([90, 0, 0]) linear_extrude(outer_r + 1)
            scale(base_logo_width / logo_w) translate([0, -logo_r]) logo();
        difference() {
            cylinder(r = outer_r + 1, h = flare_z);
            translate([0, 0, -1]) cylinder(r = outer_r - logo_depth, h = flare_z + 2);
        }
    }
}

// Plate with the ring and its groove on the underside, the hub at the centre
// and the logo in the top face, in the assembly's place.
module platform() {
    difference() {
        rotate_extrude() polygon([
            [0, hub_z], [hub_r, hub_z], [hub_r, plate_z], [inner_r, plate_z], [inner_r, ring_z],
            [track_r - groove_depth, ring_z], [track_r, ring_z + groove_depth],
            [track_r + groove_depth, ring_z], [rim_r, ring_z], [rim_r, plate_z],
            [platform_r, plate_z], [platform_r, top_z], [0, top_z]]);
        shaft_hole();
        // In the front, its top pointing at the centre, so it reads upright
        // as it passes the front.
        translate([0, -platform_logo_y, top_z]) logo_cut(platform_logo_width);
    }
}

// Round where the round part of the shaft can reach, double-D around the
// flats above.
module shaft_hole() {
    translate([0, 0, hub_z - 1]) cylinder(d = hole_d + 0.4, h = flats_z - hub_z + 1);
    translate([0, 0, flats_z - eps]) linear_extrude(hole_z - flats_z + eps) intersection() {
        circle(d = hole_d);
        square([shaft_flats + shaft_clearance, hole_d], center = true);
    }
}

// The 28BYJ-48 standing on the floor, simplified from the datasheet drawing,
// with the nominal shaft. The cable box's height is a guess.
module motor() {
    translate([0, shaft_offset, floor_thickness]) {
        cylinder(d = motor_d, h = motor_height);
        translate([0, 0, motor_height - ear_thickness]) linear_extrude(ear_thickness) difference() {
            hull() for (s = [-1, 1]) translate([s * ear_x, 0]) circle(ear_r);
            union() for (s = [-1, 1]) translate([s * ear_x, 0]) circle(d = ear_hole_d);
        }
        translate([-box_width / 2, 0, 0]) cube([box_width, box_reach, motor_height - 4]);
    }
    translate([0, 0, ear_z]) {
        cylinder(d = boss_d, h = boss_height);
        intersection() {
            cylinder(d = shaft_d, h = shaft_length);
            union() {
                cylinder(d = shaft_d, h = shaft_length - flats_length);
                translate([-shaft_flats / 2, -shaft_d / 2, 0]) cube([shaft_flats, shaft_d, shaft_length]);
            }
        }
    }
}

module balls()
    for (i = [0 : n_balls - 1]) rotate(i * 360 / n_balls) translate([track_r, 0, ball_z]) sphere(d = ball_d, $fn = 24);

// The logo, width wide and centred on the origin, to cut logo_depth deep
// into a face on z = 0 from above. It reads from +z with its top at +y.
module logo_cut(width)
    translate([0, 0, -logo_depth]) linear_extrude(logo_depth + 1)
        scale(width / logo_w) translate([0, -logo_r]) logo();

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
