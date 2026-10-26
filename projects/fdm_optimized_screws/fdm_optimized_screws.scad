// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Hex head screw and nut that print on an FDM printer without support.
//
// The screw prints lying on a flat of its head, so the layers run along the
// shank and it does not snap between them. A share of the thread diameter is
// cut off its underside, through the shank and the head, which leaves a flat
// they both stand on. The nut prints flat. The thread is single-start
// right-hand with 45 degree flanks (90 degree included angle). Thread and
// screw code as in cuboid_video_light_softbox/cuboid_video_light_softboxV3.scad.
//
// part = "testing" lays out a screw and a nut for every test diameter and
// clearance. The clearance is engraved on the screw head and on a side of
// the nut, so the pairs can be told apart.
//
// part = "dodecahedron" is a nut shaped like a regular dodecahedron, with a
// threaded hole from each face to the opposite one, and a screw to test them.
// The holes run in six directions, so it shows how the thread prints at
// different angles to the bed.
//
// Origin: screw axis on z, underside of the head on z = 0.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:Screw and nut on bed,assembly:Assembly preview,screw:Screw (lying),nut:Nut,testing:Clearance test set,dodecahedron:Dodecahedron thread direction test]

/* [Thread] */
// Major diameter. 5 mm is the smallest that has worked so far.
thread_diameter = 8;
// 2 mm prints best.
thread_pitch = 2;
// Radial gap between the screw and the nut thread; raise it if the fit is
// too tight.
thread_clearance = 0.15;

/* [Screw] */
// Threaded shank below the head.
screw_length = 20;
screw_head_width = 13; // across flats
screw_head_height = 5;
// 45 degree chamfer on the shank tip; eases the start into the nut.
tip_chamfer = 1;
// This share of the thread diameter is cut off the underside of the lying
// screw. 0.1 has printed well.
screw_cut = 0.1;

/* [Nut] */
nut_width = 13; // across flats
nut_height = 8;

/* [Testing] */
test_diameters = [3, 4, 5, 6, 7];
// Radial gap between screw and nut, all of it in the nut, as thread_clearance.
test_clearances = [0.15, 0.2, 0.25];
// Head and nut width (across flats) of all test parts; wide enough for the
// labels.
test_width = 15;
label_size = 2.5;
label_depth = 0.6;
font = "Liberation Sans:style=Bold";

/* [Dodecahedron test] */
// Distance between opposite faces. The holes cross in the middle, so the
// thread only starts about 1.1 x thread_diameter from the centre.
dodecahedron_size = 36;

/* [Quality] */
$fn = 64;

/* [Hidden] */
eps = 0.01;

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "screw") screw_lying();
else if (part == "nut") nut();
else if (part == "testing") testing();
else if (part == "dodecahedron") dodecahedron_test();

module print_layout() {
    g = 5;
    screw_lying();
    translate([(screw_head_width + nut_width) / (2 * cos(30)) + g, 0, 0]) nut();
}

// One row per diameter, one screw and nut pair per clearance.
module testing() {
    g = 5;
    corners = test_width / cos(30);
    cols = len(test_clearances);
    rows = len(test_diameters);
    for (i = [0:cols - 1], j = [0:rows - 1])
        translate([(i - (cols - 1) / 2) * 2 * (corners + g),
                   (j - (rows - 1) / 2) * (screw_head_height + screw_length + g), 0]) {
            screw_lying(test_diameters[j], test_width, str(test_clearances[i]));
            translate([corners + g, 0, 0])
                nut(test_diameters[j], test_clearances[i], test_width, str(test_clearances[i]));
        }
}

// The dodecahedron on a face, with the screw beside it. Each pair of opposite
// faces is a slab; the first lies flat, the other five are tilted by the
// dihedral angle and turned 72 degrees apart. Each slab's axis is a hole.
// Lying on a face, one hole stands upright and the other five rise at 26.6
// degrees from the bed.
module dodecahedron_test() {
    s = dodecahedron_size;
    g = 5;
    slabs = concat([[0, 0, 0]], [for (i = [0:4]) [180 - atan(2), 0, 72 * i]]);
    translate([0, 0, s / 2]) difference() {
        intersection_for (r = slabs) rotate(r) cube([2 * s, 2 * s, s], center = true);
        for (r = slabs) rotate(r) translate([0, 0, -s / 2])
            thread_hole(thread_diameter, thread_clearance, s);
        // Clears the loose scraps of thread where the holes cross. The
        // intact thread starts further out.
        sphere(r = thread_diameter);
    }
    // The corners are 1.26 x the face distance from the centre.
    translate([1.26 * s / 2 + g + screw_head_width / (2 * cos(30)), 0, 0]) screw_lying();
}

// Nut on the shank, a whole number of pitches above the head so the threads
// line up.
module assembly() {
    screw();
    translate([0, 0, screw_head_height + thread_pitch * floor((screw_length - nut_height) / thread_pitch)])
        nut();
}

module screw(d = thread_diameter, head_width = screw_head_width) {
    hex(head_width, screw_head_height);
    translate([0, 0, screw_head_height - eps]) intersection() {
        threaded_rod(d, screw_length + eps, thread_pitch);
        cylinder(h = screw_length + eps, r1 = d / 2 - tip_chamfer + screw_length,
                 r2 = d / 2 - tip_chamfer);
    }
}

// Lays the screw on a flat of its head, centred on the origin, and cuts off
// everything below screw_cut * d above the shank's lowest point. The cut is
// the print bed, z = 0. The label goes in the end face of the head, centred
// on what the cut leaves of it.
module screw_lying(d = thread_diameter, head_width = screw_head_width, label = "") {
    axis_z = d * (0.5 - screw_cut);
    length = screw_head_height + screw_length;
    translate([0, -length / 2, axis_z]) difference() {
        rotate([-90, 0, 0]) screw(d, head_width);
        translate([-head_width, -1, -axis_z - head_width])
            cube([2 * head_width, length + 2, head_width]);
        translate([0, label_depth, (head_width / 2 - axis_z) / 2]) rotate([90, 0, 0]) label(label);
    }
}

// From z = 0 to nut_height. The label goes in the side facing -y.
module nut(d = thread_diameter, clearance = thread_clearance, width = nut_width, label = "") {
    difference() {
        hex(width, nut_height);
        thread_hole(d, clearance, nut_height);
        translate([0, label_depth - width / 2, nut_height / 2]) rotate([90, 0, 0]) label(label);
    }
}

// Threaded hole from z = 0 to h, with a 45 degree lead-in at both ends. The
// thread starts a whole pitch below z = 0, in phase with the screw's.
module thread_hole(d, clearance, h) {
    hole_r = d / 2 + clearance;
    thread_h = 0.4 * thread_pitch;
    translate([0, 0, -thread_pitch]) threaded_rod(2 * hole_r, h + 2 * thread_pitch, thread_pitch);
    for (m = [0, 1]) translate([0, 0, m * h]) mirror([0, 0, m])
        translate([0, 0, -1]) cylinder(r1 = hole_r + 1, r2 = hole_r - thread_h, h = 1 + thread_h);
}

// Text for engraving, from z = 0 to label_depth + 1.
module label(s)
    linear_extrude(label_depth + 1)
        text(s, size = label_size, font = font, halign = "center", valign = "center");

// Hex prism with bevelled corners, from z = 0 to h.
module hex(width, h) {
    w = width / 2;
    intersection() {
        cylinder(r = w / cos(30), h = h, $fn = 6);
        rotate_extrude() polygon([[0, 0], [w, 0], [w + 1, 1], [w + 1, h - 1], [w, h], [0, h]]);
    }
}

// Threaded rod of major diameter d from z = 0 to h: the screw shank, and, with
// the clearance added, the shape cut for the nut's hole. render() keeps the
// preview working with this many threads.
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
