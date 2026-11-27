// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Ball socket bracket: a ball joint that locks with a clamp screw, after
// the sketch in image.png.
//
// Three parts. The ball stands on a neck on a square plate; the neck flares
// into the plate with a fillet. The socket is a ring round the ball with a
// plate on one side and two ears on the other, and a slot splits the ring
// between the ears. The screw goes through the upper ear into a thread in
// the lower ear. Tightening it closes the slot, so the ring squeezes the
// ball. Its head is a post with a big lever on top, high enough to swing
// over the ring and the plates.
//
// The ring's inside is a sphere that reaches cup_angle above the ball's
// equator, so the ball snaps in while the screw is loose. Under the ball
// the ring is open: a solid floor would be a disc that the slot cuts only
// to its centre, and it would not let the slot close.
//
// Printing: the socket lies flat. Its screw holes run level; the clearance
// hole is a teardrop and the thread prints sideways, as tested in
// fdm_optimized_screws. The ball part stands on an edge of its plate with
// the neck level, so the layers run along the neck; it needs the slicer's
// supports under the neck and the ball. The screw lies down with screw_cut
// of its thread diameter cut off its underside, as in fdm_optimized_screws.
//
// The VeryOS logo is engraved in both plates and in the lever.
//
// Origin: the socket's bottom face, centred on the ball. The socket's plate
// is on -x, the ears on +x, and the screw runs along -y.
//
// Units: mm. No external files or libraries needed.

/* [View] */
part = "print_layout"; // [assembly:Assembly,section:Assembly cut through the ball,screw_section:Assembly cut along the screw,print_layout:All parts laid out to print,ball:Ball,socket:Socket,screw:Screw]

/* [Ball] */
ball_d = 20; // [8:1:60]
// Thinned to fit if it does not pass the ring's opening.
neck_d = 10; // [4:0.5:40]
// Free neck between the fillet and the ball.
neck_length = 10; // [0:0.5:50]
// Fillet between the neck and the plate.
neck_fillet = 2; // [0:0.5:10]

/* [Socket] */
// Radial gap between the ball and the ring.
ball_clearance = 0.15;
// The ring reaches this angle above the ball's equator, and the ball snaps
// in past it. At 0 the ball comes out when the screw is loose.
cup_angle = 15; // [0:1:30]
// Under the ball. Raised if the screw holes need more height.
socket_floor = 3;
// Round the ball, at its equator.
ring_wall = 5;
// Tightening the screw closes it. Only about a fifth of the closure reaches
// the ball; at 2 mm the ears met before the small sizes held.
slot_width = 4;
// Each ear, along the screw. The lower one holds the thread.
ear_length = 10;
// The least wall round the screw holes.
ear_wall = 2.5;

/* [Plates] */
// Across the holes. The ball's plate is square.
plate_width = 36;
// The socket's plate, beyond the ring.
socket_plate_length = 14;
plate_thickness = 5;
hole_spacing = 24;
// Countersunk, for M4 screws by default.
screw_hole_d = 4.5;
screw_head_d = 8.5;

/* [Screw] */
// 5 mm is the smallest that worked in fdm_optimized_screws.
thread_d = 8;
thread_pitch = 2;
// Radial gap between the threads, all of it in the socket. 0.25 was the
// safest in the fdm_optimized_screws tests.
thread_clearance = 0.25;
// Share of the thread diameter cut off the underside of the lying screw.
screw_cut = 0.15;
tip_chamfer = 1;
// The post between the ear and the lever.
head_d = 12;
lever_length = 50;
// Along the screw, in the middle. The ends are 0.6 of it.
lever_height = 10;
// At least 0.7 x thread_d, so the lying lever reaches the bed.
lever_thickness = 8;

/* [Logo] */
// Shrunk to fit; left out below 2 mm.
logo_width = 11;
logo_depth = 0.6;

/* [Quality] */
$fn = 64;

/* [Hidden] */
eps = 0.01;
// More than any part's size.
big = 1000;

// Parameters that do not fit are changed to the nearest that do, with a
// warning in the console.
function fit(name, value, fitted) = value == fitted ? fitted
    : echo(str("WARNING: ", name, " changed from ", value, " to ", fitted)) fitted;

ball_r = ball_d / 2;
cavity_r = ball_r + ball_clearance;
neck_r = fit("neck_d", neck_d, min(neck_d, 2 * floor(5 * 0.9 * cavity_r * cos(cup_angle)) / 5)) / 2;
// From the ball plate's top to the ball's centre.
ball_h = neck_fillet + neck_length + sqrt(ball_r * ball_r - neck_r * neck_r);
thread_depth = 0.4 * thread_pitch;
// The thread in the lower ear, and the clearance hole in the upper one.
hole_r = thread_d / 2 + thread_clearance;
clear_r = thread_d / 2 + 0.5;
// The socket is tall enough for the ball and for the screw holes with
// ear_wall above and below. The screw runs at half its height.
floor_h = fit("socket_floor", socket_floor, max(socket_floor,
    ceil(10 * (2 * (clear_r + ear_wall) - cavity_r * (1 + sin(cup_angle)))) / 10));
ball_z = floor_h + cavity_r;
socket_h = ball_z + cavity_r * sin(cup_angle);
screw_z = socket_h / 2;
ring_r = cavity_r + ring_wall;
// The ears reach ear_y each way from the slot's middle. The screw's axis
// keeps ear_wall from the cavity and is far enough out for the post to
// stand on the ear beside the ring.
ear_y = slot_width / 2 + ear_length;
head_r = head_d / 2;
screw_x = max(cavity_r + ear_wall + clear_r,
    sqrt(max(0, ring_r * ring_r - ear_y * ear_y)) + head_r + 0.5);
ear_x = screw_x + max(clear_r + ear_wall, head_r);
// The shank reaches through both ears. The lever swings 2 mm above the
// ring and the plates.
shank_len = 2 * ear_y;
post_len = max(2, max(ring_r, plate_width / 2) + 2 - ear_y);
socket_hole_x = -ring_r - socket_plate_length / 2;

// The logo at the size of veryos_logo.svg, as in veryos_logo_cube.
logo_r = 15.6264133379; // outer radius of the ring
logo_stroke = 5;
logo_angle = 22.5;
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
function logo_fit(height) = height * logo_w / (2 * logo_r);
// Between the socket's holes; between the ball's neck and its plate's
// edge; on the lever.
socket_logo = fit("logo_width", logo_width, min(logo_width,
    hole_spacing - screw_head_d - 2, logo_fit(socket_plate_length - 2)));
ball_logo = fit("logo_width", logo_width, min(logo_width,
    plate_width - 8, logo_fit(plate_width / 2 - neck_r - neck_fillet - 2)));
lever_logo = fit("logo_width", logo_width, min(logo_width, logo_fit(lever_height - 2)));

if (part == "assembly") assembly();
else if (part == "section") difference() {
    assembly();
    translate([-big / 2, -big, -big / 2]) cube(big);
}
else if (part == "screw_section") difference() {
    assembly();
    translate([screw_x, -big / 2, -big / 2]) cube(big);
}
else if (part == "print_layout") print_layout();
else if (part == "ball") ball_print();
else if (part == "socket") socket();
else if (part == "screw") screw_print();

// The socket flat, the ball part behind it on the edge of its plate, and
// the screw lying beside it.
module print_layout() {
    g = 5;
    socket();
    translate([0, -plate_width / 2 - g, 0]) ball_print();
    translate([ear_x + g + post_len + lever_height, 0, 0]) screw_print();
}

// The ball part standing on an edge of its plate, logo up, neck along -y.
module ball_print() translate([0, 0, plate_width / 2]) rotate([90, 0, 0]) ball_part();

// The screw lying along +x with the lever flat, cut off below
// screw_cut * thread_d above the shank's lowest point. The cut is the bed.
module screw_print() difference() {
    translate([0, 0, thread_d * (0.5 - screw_cut)]) rotate([90, 0, 90]) screw();
    translate([-big / 2, -big / 2, -big]) cube(big);
}

// The ball upside down in the ring, and the screw with its post on the
// upper ear and its lever along x. The screw's thread is in phase with the
// socket's.
module assembly() {
    socket();
    translate([0, 0, ball_z]) rotate([180, 0, 0]) translate([0, 0, -plate_thickness - ball_h])
        ball_part();
    translate([screw_x, ear_y, screw_z]) rotate([90, 0, 0]) screw();
}

module ball_part() {
    difference() {
        linear_extrude(plate_thickness) offset(r = 3) offset(delta = -3)
            square(plate_width, center = true);
        for (s = [-1, 1]) translate([s * hole_spacing / 2, 0, 0]) countersunk_hole();
        if (ball_logo >= 2)
            translate([0, (neck_r + neck_fillet + plate_width / 2) / 2, plate_thickness])
                logo_cut(ball_logo);
    }
    rotate_extrude() right_half() ball_profile();
}

// The outline of the neck, its fillet and the ball about the axis on x = 0,
// from the plate's top up.
module ball_profile() translate([0, plate_thickness - eps]) {
    square([neck_r, ball_h + eps]);
    difference() {
        square([neck_r + neck_fillet, neck_fillet]);
        translate([neck_r + neck_fillet, neck_fillet]) circle(r = neck_fillet);
    }
    translate([0, ball_h + eps]) circle(r = ball_r);
}

module socket() {
    difference() {
        union() {
            linear_extrude(socket_h) {
                circle(r = ring_r);
                translate([0, -ear_y]) offset(r = 1) offset(delta = -1) square([ear_x, 2 * ear_y]);
            }
            // The plate flares from the ring to its far end.
            linear_extrude(plate_thickness) hull() {
                circle(r = ring_r);
                translate([-ring_r - socket_plate_length, -plate_width / 2]) offset(r = 3) offset(delta = -3)
                    square([socket_plate_length, plate_width]);
            }
        }
        translate([0, 0, ball_z]) sphere(r = cavity_r);
        translate([0, 0, -1]) cylinder(r = cavity_r * cos(45), h = ball_z + 1);
        translate([0, -slot_width / 2, -1]) cube([big, slot_width, socket_h + 2]);
        // The upper ear's clearance hole, roof up.
        translate([screw_x, ear_y + 1, screw_z]) rotate([90, 0, 0]) linear_extrude(ear_length + 2)
            teardrop(clear_r);
        // The lower ear's thread, with a 45 degree lead-in at both ends. It
        // starts at the upper ear's top, in phase with the screw.
        translate([screw_x, -slot_width / 2, screw_z]) rotate([90, 0, 0]) {
            translate([0, 0, -ear_length - slot_width])
                threaded_rod(2 * hole_r, 2 * ear_length + slot_width + 1, thread_pitch);
            for (m = [0, 1]) translate([0, 0, m * ear_length]) mirror([0, 0, m])
                translate([0, 0, -1]) cylinder(r1 = hole_r + 1, r2 = hole_r - thread_depth, h = 1 + thread_depth);
        }
        for (s = [-1, 1]) translate([socket_hole_x, s * hole_spacing / 2, 0]) countersunk_hole();
        if (socket_logo >= 2)
            translate([socket_hole_x, 0, plate_thickness]) rotate(90) logo_cut(socket_logo);
    }
}

// Axis on z, the post's bearing face on z = 0, the shank along +z and the
// head along -z. The lever lies along x and is thick along y; the logo is
// in its +y face.
module screw() {
    intersection() {
        threaded_rod(thread_d, shank_len, thread_pitch);
        cylinder(h = shank_len, r1 = thread_d / 2 - tip_chamfer + shank_len, r2 = thread_d / 2 - tip_chamfer);
    }
    translate([0, 0, -post_len]) cylinder(r = head_r, h = post_len + eps);
    difference() {
        translate([0, 0, -post_len + eps]) rotate([90, 0, 0])
            linear_extrude(lever_thickness, center = true) lever_shape();
        if (lever_logo >= 2)
            translate([0, lever_thickness / 2, -post_len - lever_height / 2]) rotate([-90, 0, 0])
                logo_cut(lever_logo);
    }
}

// The lever's outline along x, from y = 0 down: flat towards the post,
// highest over it and lower towards the ends, with rounded corners.
module lever_shape() offset(r = 1.5) offset(delta = -1.5) polygon([
    [-lever_length / 2, 0], [lever_length / 2, 0],
    [lever_length / 2, -0.6 * lever_height], [head_r, -lever_height],
    [-head_r, -lever_height], [-lever_length / 2, -0.6 * lever_height]]);

// A circle with a 45 degree roof towards +y, cut flat at the circle's top
// so the bridge is short. Prints level without support.
module teardrop(r) intersection() {
    hull() {
        circle(r = r);
        rotate(45) square(r);
    }
    square(2 * r, center = true);
}

// Through a plate from z = 0, countersunk from its top.
module countersunk_hole() {
    sink = (screw_head_d - screw_hole_d) / 2;
    translate([0, 0, -1]) cylinder(d = screw_hole_d, h = plate_thickness + 2);
    translate([0, 0, plate_thickness - sink])
        cylinder(d1 = screw_hole_d, d2 = screw_head_d + 2 * eps, h = sink + eps);
}

// The part of the child on x >= 0, for rotate_extrude().
module right_half() intersection() {
    children();
    translate([0, -big / 2]) square(big);
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
        translate([0, -(ring_in - s_small)]) circle(r = s_small);
    }
    translate([0, ring_in - s_small]) circle(r = s_small);
}

// Threaded rod of major diameter d from z = 0 to h, as in
// fdm_optimized_screws: the screw's shank, and, with the clearance added,
// the shape cut for the socket's thread. render() keeps the preview
// working with this many threads.
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
