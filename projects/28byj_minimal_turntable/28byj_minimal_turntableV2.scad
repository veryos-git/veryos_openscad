// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V2: no balls, every part is printed. V1's platform rolled on 32 airsoft
// BBs between two V-grooves. Now a lid screws onto the base, over the motor,
// and the platform's hub slides on the lid right around the shaft: that
// close to the axis, friction makes little torque. A ring under the
// platform, one layer above the lid, keeps it from tipping. The lid's
// thread is the 45 degree thread of fdm_optimized_screws.
// V1: archive/28byj_minimal_turntableV1.scad.
//
// Minimal turntable for the 28BYJ-48 stepper motor. The motor turns the
// platform directly, no gears. Three printed parts, nothing else:
// - base: a round cup. The motor stands on its floor, shaft up on the cup's
//   axis, and drops in from above; its ears sit on two pegs, which keep it
//   from turning. The cable leaves through a window in the wall, wide enough
//   for the plug. The top of the wall carries the thread for the lid.
// - lid: a disc with a threaded rim. It screws onto the base until it stops
//   on the base's rim; the shaft pokes up through a hole in its middle. Its
//   flat top is the bearing.
// - platform: a round plate. Its hub stands on the lid around the shaft and
//   takes the shaft's flats: the shaft turns the platform but does not carry
//   it.
//
// Print the base standing, the lid and the platform upside down, their top
// faces on the bed. No overhang is steeper than 45 degrees; nothing needs
// support. The VeryOS logo is engraved in the front of the base's wall and
// in the top faces of the lid and the platform.
// Origin: centre of the base's bottom face, on the motor's shaft axis.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on the bed,assembly:Assembly with the motor,section:Assembly cut in half,base:Base,lid:Lid upside down as it prints,platform:Platform upside down as it prints]

/* [Platform] */
// At least the lid (60.8 at the defaults).
platform_d = 80;
// The plate above the hub and the ring on its underside.
platform_thickness = 3.2;
// The hub's face slides on the lid. Friction brakes with its coefficient x
// load x radius: a narrower hub turns easier, a wider one lets the load sit
// further off centre before the platform leans on its ring.
hub_d = 12;
// Gap between the ring under the platform and the lid, one layer. The
// platform leans on the ring only under a load off centre.
tilt_gap = 0.2;

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
// Radial gap between the threads, as the nuts of fdm_optimized_screws.
thread_clearance = 0.25;
// Radial gap around the shaft and its boss in the lid: the motor sits up to
// 0.2 off centre on its pegs, the lid up to thread_clearance on its thread.
shaft_gap = 0.8;

/* [Base] */
floor_thickness = 1.6;
// The base's wall. The thread is cut into its top, 0.4 x thread_pitch deep.
wall = 2;
// Window for the cable, wide enough for its 5 pin JST XH plug (12.4 x 5.8).
// A 45 degree roof above the height.
cable_window_width = 15;
cable_window_height = 6;

/* [Lid] */
// The disc over the motor.
lid_thickness = 2.4;
// The lid's rim around the thread.
lid_wall = 1.6;
// 2 mm prints best (fdm_optimized_screws).
thread_pitch = 2;
// Thread at the top of the base's wall.
thread_length = 6;

/* [Logo] */
// In the front of the base's wall.
base_logo_width = 12;
// In the lid's top face, between the hub and the ring.
lid_logo_width = 12;
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
platform_r = platform_d / 2;
hub_r = hub_d / 2;
// The motor's farthest point from the shaft: the corners of its cable box.
ear_x = ear_spacing / 2;
motor_reach = max(norm([box_width / 2, shaft_offset + box_reach]),
                  norm([ear_x, shaft_offset]) + ear_r, shaft_offset + motor_d / 2);
// The base's inside, up to its rim. Its outside is the thread's major
// radius.
inner_r = motor_reach + motor_clearance;
outer_r = inner_r + wall;
thread_depth = 0.4 * thread_pitch;
thread_root_r = outer_r - thread_depth;
lid_hole_r = outer_r + thread_clearance;
lid_r = lid_hole_r + lid_wall;
// Heights. The motor stands on the floor.
ear_z = floor_thickness + motor_height;
// A post under each ear, motor_clearance off the can, 1 below the ear, so
// the motor stands on the floor. Its peg reaches 1 above the ear.
post_r = ear_x - motor_d / 2 - motor_clearance;
post_z = ear_z - ear_thickness - 1;
peg_z = ear_z + 1;
peg_chamfer = 0.6;
// The base's rim, where the lid stops, one layer above the pegs.
rim_z = layers(peg_z + layer);
thread_z = rim_z - thread_length;
// The lid's rim ends 0.4 above the end of the base's thread.
skirt_z = thread_z + 0.4;
// The lid's top face, which the hub slides on.
deck_z = rim_z + lid_thickness;
// The boss sits in a recess in the lid's underside, the shaft in a hole
// above it.
recess_r = boss_d / 2 + shaft_gap;
recess_z = ear_z + boss_height + 0.5;
shaft_hole_r = shaft_d / 2 + shaft_gap;
// Tip of the longest shaft.
tip_z = ear_z + shaft_length + shaft_length_tolerance;
// The hub's hole ends 0.5 above the tip, 1.2 under the top face.
hole_z = tip_z + 0.5;
top_z = layers(hole_z + 1.2);
plate_z = top_z - platform_thickness;
// The hub is round inside up to 0.4 above where the flats start on the
// longest shaft, which also covers the flats' -0.2, double-D above.
hole_d = shaft_d + shaft_clearance;
flats_z = tip_z - flats_length + 0.4;
hub_chamfer = 0.4;
// The ring under the platform runs 1 inside the lid's edge.
ring_r = lid_r - 1;
ring_width = 1.6;
ring_z = deck_z + tilt_gap;
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
// The base's logo in the middle of the wall below the thread, the lid's in
// the middle between the hub and the ring, the platform's 3 inside its edge.
base_logo_z = thread_z / 2;
lid_logo_y = (hub_r + ring_r - ring_width) / 2;
platform_logo_y = platform_r - logo_h(platform_logo_width) / 2 - 3;

assert(platform_r >= lid_r, str("platform_d must be at least the lid, ", 2 * lid_r, "."));
assert(post_r >= 2, "motor_clearance is too large: the posts under the ears get thinner than 4.");
assert(wall - thread_depth >= 1.2 - eps, "wall is too thin: the thread must leave 1.2 of it.");
assert(floor_thickness + cable_window_height + cable_window_width / 2 <= thread_z - 0.5,
       "The cable window reaches into the thread; lower cable_window_height or cable_window_width.");
assert(deck_z - recess_z >= 1, "lid_thickness is too thin: 1 must stay above the shaft's boss.");
assert(hub_r - hub_chamfer >= shaft_hole_r + 1.5, "hub_d is too small: its face must reach 1.5 beyond the lid's hole.");
assert(tilt_gap > 0, "tilt_gap must be above 0, or the platform slides on its ring.");
assert(plate_z >= ring_z + 1, "platform_thickness is too thick: no room for the hub and the ring under the plate.");
assert(logo_h(base_logo_width) + 2 <= thread_z, "The base's logo is higher than its wall below the thread; lower base_logo_width.");
assert(lid_logo_y - logo_h(lid_logo_width) / 2 >= hub_r + 1
       && norm([lid_logo_width / 2, lid_logo_y + logo_h(lid_logo_width) / 2]) <= ring_r - ring_width - 1,
       "The lid's logo does not fit between the hub and the ring; lower lid_logo_width.");
assert(norm([platform_logo_width / 2, platform_logo_y + logo_h(platform_logo_width) / 2]) <= platform_r - 1,
       "The platform's logo does not fit inside its edge; lower platform_logo_width.");

echo(str("base ", 2 * outer_r, " across, lid ", 2 * lid_r, ", ", top_z, " high with the platform"));

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "base") base();
else if (part == "lid") translate([0, 0, deck_z]) rotate([180, 0, 0]) lid();
else if (part == "platform") translate([0, 0, top_z]) rotate([180, 0, 0]) platform();

module assembly() {
    color("white") base();
    color("silver") motor();
    color("gold") lid();
    color("deepskyblue") platform();
}

// The assembly with the half on +x cut away; look at it from +x. The cut
// runs through the shaft, the hub and the cable window.
module section() {
    color("white") side_cut() base();
    color("silver") side_cut() motor();
    color("gold") side_cut() lid();
    color("deepskyblue") side_cut() platform();
}

// Cuts away the half on +x, rendered so it keeps its colour.
module side_cut()
    render() difference() {
        children();
        translate([0, -platform_d, -1]) cube(2 * platform_d);
    }

// Every part as it prints: the base standing, the lid and the platform
// upside down.
module print_layout() {
    base();
    translate([0, -(outer_r + layout_gap + lid_r), deck_z]) rotate([180, 0, 0]) lid();
    translate([lid_r + layout_gap + platform_r, -(outer_r + layout_gap + lid_r) / 2, top_z])
        rotate([180, 0, 0]) platform();
}

// Cup with the floor and the wall, the lid's thread around its top; the
// posts with their pegs, the cable window at the back (+y), behind the
// motor, the logo in the front (-y).
module base() {
    difference() {
        union() {
            rotate_extrude() polygon([[0, 0], [outer_r, 0], [outer_r, thread_z], [inner_r, thread_z],
                                      [inner_r, floor_thickness], [0, floor_thickness]]);
            translate([0, 0, thread_z - eps]) difference() {
                intersection() {
                    threaded_rod(2 * outer_r, thread_length + eps, thread_pitch);
                    // 45 degree chamfer at the rim eases the start into the
                    // lid's thread.
                    cylinder(h = thread_length + eps, r1 = thread_root_r + thread_length + eps, r2 = thread_root_r);
                }
                translate([0, 0, -1]) cylinder(r = inner_r, h = thread_length + 2);
            }
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
            cylinder(r = outer_r + 1, h = thread_z);
            translate([0, 0, -1]) cylinder(r = outer_r - logo_depth, h = thread_z + 2);
        }
    }
}

// Disc with the threaded rim, in the assembly's place, screwed down onto the
// base's rim. The recess for the boss and the hole for the shaft in the
// middle, the logo in the top face.
module lid() {
    difference() {
        translate([0, 0, skirt_z]) cylinder(r = lid_r, h = deck_z - skirt_z);
        // A whole pitch below the base's thread, in phase with it.
        translate([0, 0, thread_z - eps - thread_pitch])
            threaded_rod(2 * lid_hole_r, rim_z - thread_z + eps + thread_pitch, thread_pitch);
        // 45 degree lead-in at the rim's open end.
        translate([0, 0, skirt_z - 1])
            cylinder(r1 = lid_hole_r + 1, r2 = lid_hole_r - thread_depth, h = 1 + thread_depth);
        translate([0, 0, rim_z - eps]) cylinder(r = recess_r, h = recess_z - rim_z + eps);
        translate([0, 0, rim_z]) cylinder(r = shaft_hole_r, h = lid_thickness + 1);
        translate([0, -lid_logo_y, deck_z]) logo_cut(lid_logo_width);
    }
}

// Plate with the hub at the centre and the ring on the underside, the logo
// in the top face, in the assembly's place: the hub stands on the lid.
module platform() {
    difference() {
        rotate_extrude() polygon([
            [0, deck_z], [hub_r - hub_chamfer, deck_z], [hub_r, deck_z + hub_chamfer], [hub_r, plate_z],
            [ring_r - ring_width, plate_z], [ring_r - ring_width, ring_z], [ring_r, ring_z], [ring_r, plate_z],
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
    translate([0, 0, deck_z - 1]) cylinder(d = hole_d + 0.4, h = flats_z - deck_z + 1);
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

// Threaded rod of major diameter d from z = 0 to h, as in
// fdm_optimized_screws: the base's thread, and, with the clearance added,
// the shape cut for the lid's. render() keeps the preview working with this
// many threads.
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
// axial flank run give 45 degree flanks (90 degree included angle).
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
    // Clockwise winding as viewed from outside, as required by OpenSCAD.
    faces = concat(
        [[3, 2, 1, 0]],
        [for (i = [0:steps-1], j = [0:3])
            [4*i+j, 4*i+(j+1)%4, 4*(i+1)+(j+1)%4]],
        [for (i = [0:steps-1], j = [0:3])
            [4*i+j, 4*(i+1)+(j+1)%4, 4*(i+1)+j]],
        [[4*steps, 4*steps+1, 4*steps+2, 4*steps+3]]);
    polyhedron(points = points, faces = faces, convexity = 16);
}
