// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Ball head V2: a snap-fit ball and socket joint with a locking nut, after
// the inspiration pictures and STLs (Spherical snap-fit ball joint with
// locking nut).
//
// Three parts. The ball stands on a neck on a round plate; the neck flares
// into the plate with a fillet. The socket is a round plate with a cup on
// it. The cup's inside is a sphere that reaches cup_angle above the ball's
// equator, so the ball snaps in, and slits split its top into fingers. The
// cup has an external thread and a 45 degree chamfer at its top. The screw
// is a knurled nut with the female thread and, at its top, a 45 degree cone
// that meets the chamfer. Screwing it down presses the fingers onto the ball
// and locks the joint. Both plates have the same circular pattern of
// countersunk screw holes, between the cup and the plate's edge, so the nut
// covers the socket's screws: mount the socket first.
//
// Print every part standing, plate or nut bottom on the bed, without
// support. The thread has 45 degree flanks, as in fdm_optimized_screws, the
// cone in the nut is 45 degrees and the cup's inside above the equator is
// no flatter than 45 degrees while cup_angle is at most 45. The VeryOS logo
// is engraved in the top of both plates, between the holes. The nut's top
// is too narrow for a readable logo at the default size, so it has none.
//
// Origin: centre of the part's bottom face. Assembly: on the socket's.
//
// Units: mm. No external files or libraries needed.

/* [View] */
part = "assembly"; // [assembly:Assembly,section:Assembly cut in half,print_layout:All parts,ball:Ball,socket:Socket,screw:Screw]

/* [Ball] */
// The head.
ball_d = 10; // [4:0.5:60]
// Thinned to fit if it does not pass the cup's opening.
neck_d = 5; // [2:0.5:40]
// Free neck between the fillet and the ball.
neck_length = 3; // [0:0.5:50]
// Fillet between the neck and the plate.
neck_fillet = 2; // [0:0.5:10]

/* [Plates] */
// Grown to fit if the screw heads do not fit between the cup and the edge.
plate_d = 30; // [10:1:150]
plate_thickness = 3; // [1:0.5:10]
// On a circle midway between the cup and the plate's edge.
hole_count = 3; // [0:1:8]
// Countersunk, for M3 screws by default.
screw_hole_d = 3.4;
screw_head_d = 6.5;

/* [Socket] */
// Wall of the cup inside the thread's root.
cup_wall = 1.2;
// Under the ball. Raised if the nut would get less than a turn of thread.
cup_floor = 1.5;
// Radial gap between the ball and the cup.
ball_clearance = 0.15;
// The cup reaches this angle above the ball's equator; more snaps harder.
cup_angle = 25; // [0:1:45]
// Flat top of the cup, inside its chamfer. Narrowed to leave a chamfer.
cup_top_width = 1;
slit_count = 4; // [0:1:8]
slit_width = 0.8;
// The slits reach down to this share of the ball's radius below its centre.
slit_depth = 0.5;

/* [Thread] */
thread_pitch = 2;
// Radial gap between the threads.
thread_clearance = 0.3;

/* [Screw] */
// Outside the female thread.
screw_wall = 2;
// Gap under the nut when its cone touches the cup: how far it can still
// turn down to lock.
screw_travel = 1.5;
knurl_count = 30;
knurl_r = 0.8;

/* [Logo] */
// Shrunk to fit between the holes; left out below 2 mm.
plate_logo_width = 5;
logo_depth = 0.6;

/* [Quality] */
$fn = 96;

/* [Hidden] */
eps = 0.01;
// Less than the threads' axial play, 0.3 mm at the default clearance.
assembly_gap = 0.2;

// Parameters that do not fit are changed to the nearest that do, with a
// warning in the console.
function fit(name, value, fitted) = value == fitted ? fitted
    : echo(str("WARNING: ", name, " changed from ", value, " to ", fitted)) fitted;

ball_r = ball_d / 2;
thread_depth = 0.4 * thread_pitch;
// The cup.
cavity_r = ball_r + ball_clearance;
thread_d = 2 * (cavity_r + cup_wall + thread_depth);
opening_r = cavity_r * cos(cup_angle);
top_width = fit("cup_top_width", cup_top_width, min(cup_top_width, thread_d / 2 - opening_r - 0.5));
chamfer = thread_d / 2 - opening_r - top_width;
neck_r = fit("neck_d", neck_d, min(neck_d, 2 * floor(5 * 0.9 * opening_r) / 5)) / 2;
// From the ball plate's top to the ball's centre.
ball_h = neck_fillet + neck_length + sqrt(ball_r * ball_r - neck_r * neck_r);
plate_r = fit("plate_d", plate_d, max(plate_d, 2 * ceil(thread_d / 2 + screw_head_d + 0.6))) / 2;
// Enough for a turn of thread in the nut.
floor_h = fit("cup_floor", cup_floor, max(cup_floor, ceil(10 * (thread_pitch + screw_travel + thread_clearance
    + chamfer - ball_r - cavity_r * sin(cup_angle))) / 10));
ball_z = plate_thickness + floor_h + ball_r;
cup_top = ball_z + cavity_r * sin(cup_angle);
// The nut, where its cone just touches the chamfer. Its cone is the
// chamfer's surface, r + z = cone_k, and it ends at the cup's top.
hole_r = thread_d / 2 + thread_clearance;
screw_bottom = plate_thickness + screw_travel;
cone_k = thread_d / 2 + cup_top - chamfer;
screw_r = hole_r + screw_wall;
holes_r = (thread_d / 2 + plate_r) / 2;

// The logo at the size of veryos_logo.svg, as in veryos_logo_cube.
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
// Between two holes, and between the cup and the plate's edge.
logo_width = fit("plate_logo_width", plate_logo_width, min(plate_logo_width,
    hole_count < 2 ? plate_logo_width : 2 * holes_r * sin(180 / hole_count) - screw_head_d - 1,
    (plate_r - thread_d / 2 - 1) * logo_w / (2 * logo_r)));

if (part == "assembly") assembly();
else if (part == "section") difference() {
    assembly();
    translate([-100, -200, -100]) cube([200, 200, 200]);
}
else if (part == "print_layout") print_layout();
else if (part == "ball") ball_part();
else if (part == "socket") socket();
else if (part == "screw") screw();

module print_layout() {
    g = 5;
    socket();
    translate([plate_r + g + screw_r + knurl_r, 0, 0]) screw();
    translate([0, 2 * plate_r + g, 0]) ball_part();
}

// The ball upside down in the cup, the nut assembly_gap above where its cone
// touches the cup, turned so its thread lines up with the cup's. The gap
// keeps the parts apart, so a slicer can split them.
module assembly() {
    socket();
    translate([0, 0, screw_bottom + assembly_gap]) rotate(360 * screw_travel / thread_pitch) screw();
    translate([0, 0, ball_z]) rotate([180, 0, 0]) translate([0, 0, -plate_thickness - ball_h])
        ball_part();
}

module ball_part() {
    difference() {
        plate();
        plate_cuts();
    }
    translate([0, 0, plate_thickness - eps]) {
        cylinder(r = neck_r, h = ball_h + eps);
        rotate_extrude() difference() {
            square([neck_r + neck_fillet, neck_fillet]);
            translate([neck_r + neck_fillet, neck_fillet]) circle(r = neck_fillet);
        }
    }
    translate([0, 0, plate_thickness + ball_h]) sphere(r = ball_r);
}

module socket() {
    h = cup_top - plate_thickness;
    difference() {
        union() {
            plate();
            translate([0, 0, plate_thickness - eps]) intersection() {
                threaded_rod(thread_d, h + eps, thread_pitch);
                cylinder(h = h + eps, r1 = cone_k - plate_thickness + eps, r2 = opening_r + top_width);
            }
        }
        plate_cuts();
        translate([0, 0, ball_z]) sphere(r = cavity_r);
        z = ball_z - slit_depth * ball_r;
        for (i = [0:1:slit_count - 1]) rotate(360 * i / slit_count)
            translate([0, -slit_width / 2, z]) cube([thread_d, slit_width, cup_top - z + 1]);
    }
}

// From z = 0 to cup_top - screw_bottom.
module screw() {
    h = cup_top - screw_bottom;
    k = cone_k - screw_bottom;
    difference() {
        linear_extrude(h) knurl();
        // The female thread, starting a whole pitch below z = 0 so it is in
        // phase with the cup's, with a 45 degree lead-in at the bottom. The
        // cone above it presses on the cup's chamfer.
        translate([0, 0, -thread_pitch]) threaded_rod(2 * hole_r, k - hole_r + thread_pitch, thread_pitch);
        translate([0, 0, -1]) cylinder(r1 = hole_r + 1, r2 = hole_r - thread_depth, h = 1 + thread_depth);
        translate([0, 0, k - hole_r - eps]) cylinder(r1 = hole_r, r2 = k - h - 1, h = hole_r - (k - h) + 1);
    }
}

// Ring with knurl_count round ribs.
module knurl() {
    circle(r = screw_r);
    for (i = [0:knurl_count - 1]) rotate(360 * i / knurl_count) translate([screw_r, 0]) circle(r = knurl_r, $fn = 16);
}

module plate() {
    cylinder(r = plate_r, h = plate_thickness);
}

// The screw holes, countersunk from the plate's top, and the logo between
// two of them.
module plate_cuts() {
    for (i = [0:1:hole_count - 1]) rotate(360 * i / hole_count) translate([holes_r, 0, 0]) {
        translate([0, 0, -1]) cylinder(d = screw_hole_d, h = plate_thickness + 2);
        translate([0, 0, plate_thickness - (screw_head_d - screw_hole_d) / 2])
            cylinder(d1 = screw_hole_d, d2 = screw_head_d + 2 * eps, h = (screw_head_d - screw_hole_d) / 2 + eps);
    }
    if (logo_width >= 2)
        rotate(hole_count > 0 ? 180 / hole_count : 0) translate([holes_r, 0, plate_thickness]) rotate(-90)
            logo_cut(logo_width);
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
// fdm_optimized_screws: the cup's thread, and, with the clearance added, the
// shape cut for the nut's. render() keeps the preview working with this
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
