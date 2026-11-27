// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Ball head: a ball and socket joint that locks with a screw-on ring, after
// inspiration/image.png.
//
// Three parts. The ball stands on a neck on a round plate. The socket is a
// round plate with a cup on it; the cup holds the ball's lower half and has
// an external thread. The screw is a knurled ring with the female thread
// below and a lip above, whose inside is a sphere of the ball's radius from
// the ball's equator up to lip_angle above it. Screwing it down presses the
// lip onto the ball and the ball into the cup, which locks the joint. A slot
// in the lip lets the neck tilt to 90 degrees in one direction. Both plates
// have 3 countersunk screw holes.
//
// Print every part standing as it is used, plate or ring bottom on the bed,
// without support. The thread has 45 degree flanks, as in
// fdm_optimized_screws, and the lip's inside is no flatter than 45 degrees
// while lip_angle is at most 45. The ball's underside overhangs where it
// meets the neck; set ball_cone to fill it with a 45 degree cone, which
// costs tilt. The VeryOS logo is engraved in both plates and in the top of
// the screw.
//
// Origin: centre of the part's bottom face. Assembly: on the socket's.
//
// Units: mm. No external files or libraries needed.

/* [View] */
part = "assembly"; // [assembly:Assembly,section:Assembly cut in half,print_layout:All parts,ball:Ball,socket:Socket,screw:Screw]

/* [Ball] */
ball_d = 30;
neck_d = 12;
// From the ball plate's top to the ball's centre.
neck_length = 25;
// Fills the ball's underside with a 45 degree cone to the neck, so it
// prints cleanly, but the cone hits the lip earlier.
ball_cone = false;

/* [Plates] */
plate_thickness = 4;
// Countersunk, for M4 screws by default.
screw_hole_d = 4.5;
screw_head_d = 8.5;

/* [Socket] */
// Wall of the cup inside the thread's root.
cup_wall = 2;
// Under the ball.
cup_floor = 2;
// Radial gap between the ball and the cup and the ring's bore.
ball_clearance = 0.2;

/* [Thread] */
thread_pitch = 2;
// Radial gap between the threads.
thread_clearance = 0.3;

/* [Screw] */
// The lip covers the ball from its equator up to this angle above it.
// More holds better but lets the neck tilt less.
lip_angle = 30;
// Outside the female thread.
screw_wall = 3;
// Gap under the ring when it touches the ball: how far it can still turn
// down to lock.
screw_travel = 2;
knurl_count = 24;
knurl_r = 1.5;
// Slot in the lip for a 90 degree tilt.
tilt_slot = true;

/* [Logo] */
plate_logo_width = 8;
screw_logo_width = 7;
logo_depth = 0.6;

/* [Quality] */
$fn = 96;

/* [Hidden] */
eps = 0.01;

ball_r = ball_d / 2;
neck_r = neck_d / 2;
thread_depth = 0.4 * thread_pitch;
// The cup's thread.
thread_d = 2 * (ball_r + ball_clearance + cup_wall + thread_depth);
// The ball's centre in the socket.
ball_z = plate_thickness + cup_floor + ball_r;
// The cup ends below the neck when it lies in the slot.
cup_top = ball_z - neck_r - 1;
screw_bottom = plate_thickness + screw_travel;
screw_top = ball_z + ball_r * sin(lip_angle);
// The screw's female thread and bore. Above the thread a 45 degree cone
// narrows to the bore.
hole_r = thread_d / 2 + thread_clearance;
bore_r = ball_r + ball_clearance;
thread_top = cup_top + screw_travel;
screw_r = hole_r + screw_wall;
// Screw holes: outside the ball and the ring, so a screwdriver reaches them.
ball_holes_r = ball_r + screw_head_d / 2 + 1;
ball_plate_r = ball_holes_r + screw_head_d / 2 + 2;
socket_holes_r = screw_r + knurl_r + screw_head_d / 2 + 1;
socket_plate_r = socket_holes_r + screw_head_d / 2 + 2;

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

assert(neck_d < ball_d, "The neck must be thinner than the ball.");
assert(lip_angle <= 45, "Above 45 degrees the lip's inside overhangs.");
assert(thread_top + hole_r - bore_r <= ball_z, "The cup is too high for the screw; raise cup_floor.");
assert(neck_length > ball_r, "The ball must clear its plate; raise neck_length.");
assert(logo_h(screw_logo_width) + 1 <= screw_r - ball_r * cos(lip_angle),
       "The screw's logo is too large; lower screw_logo_width.");

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
    translate([socket_plate_r + g + screw_r + knurl_r, 0, 0]) screw();
    translate([0, socket_plate_r + g + ball_plate_r, 0]) ball_part();
}

// The ball upside down in the cup, the screw where it touches the ball,
// turned so its thread lines up with the cup's.
module assembly() {
    socket();
    translate([0, 0, screw_bottom]) rotate(360 * (screw_bottom - plate_thickness) / thread_pitch) screw();
    translate([0, 0, ball_z]) rotate([180, 0, 0]) translate([0, 0, -plate_thickness - neck_length])
        ball_part();
}

module ball_part() {
    z = plate_thickness + neck_length;
    difference() {
        plate(ball_plate_r);
        holes(ball_holes_r);
        translate([0, 0, plate_thickness]) logo_on_ring(ball_holes_r, 60, plate_logo_width);
    }
    translate([0, 0, plate_thickness - eps]) cylinder(r = neck_r, h = neck_length + eps);
    translate([0, 0, z]) sphere(r = ball_r);
    if (ball_cone) {
        c = ball_r * sin(45);
        translate([0, 0, z - c - (c - neck_r)]) cylinder(r1 = neck_r, r2 = c, h = c - neck_r + eps);
    }
}

module socket() {
    difference() {
        union() {
            plate(socket_plate_r);
            // The thread with a 45 degree chamfer at the top.
            h = cup_top - plate_thickness;
            translate([0, 0, plate_thickness - eps]) intersection() {
                threaded_rod(thread_d, h + eps, thread_pitch);
                cylinder(h = h + eps, r1 = thread_d / 2 + h, r2 = thread_d / 2 - thread_depth);
            }
        }
        translate([0, 0, ball_z]) sphere(r = bore_r);
        holes(socket_holes_r);
        translate([0, 0, plate_thickness]) logo_on_ring(socket_holes_r, 60, plate_logo_width);
    }
}

// From z = 0 to screw_top - screw_bottom. The slot faces +x.
module screw() {
    h = screw_top - screw_bottom;
    t = thread_top - screw_bottom;
    c = ball_z - screw_bottom;
    difference() {
        linear_extrude(h) knurl();
        // The female thread, starting a whole pitch below z = 0 so it is in
        // phase with the cup's, with a 45 degree lead-in at the bottom.
        translate([0, 0, -thread_pitch]) threaded_rod(2 * hole_r, t + thread_pitch, thread_pitch);
        translate([0, 0, -1]) cylinder(r1 = hole_r + 1, r2 = hole_r - thread_depth, h = 1 + thread_depth);
        translate([0, 0, t - eps]) cylinder(r1 = hole_r, r2 = bore_r, h = hole_r - bore_r + eps);
        translate([0, 0, t]) cylinder(r = bore_r, h = c - t);
        translate([0, 0, c]) sphere(r = ball_r);
        if (tilt_slot)
            translate([0, -(neck_r + 0.5), c - neck_r - 0.5]) cube([screw_r + knurl_r + 1, neck_d + 1, h]);
        translate([0, 0, h]) logo_on_ring((ball_r * cos(lip_angle) + screw_r) / 2, 180, screw_logo_width);
    }
}

// Ring with knurl_count round ribs.
module knurl() {
    circle(r = screw_r);
    for (i = [0:knurl_count - 1]) rotate(360 * i / knurl_count) translate([screw_r, 0]) circle(r = knurl_r, $fn = 24);
}

module plate(r) {
    cylinder(r = r, h = plate_thickness);
}

// 3 countersunk holes at radius r, from the plate's top.
module holes(r) {
    for (a = [0:120:240]) rotate(a) translate([r, 0, 0]) {
        translate([0, 0, -1]) cylinder(d = screw_hole_d, h = plate_thickness + 2);
        translate([0, 0, plate_thickness - (screw_head_d - screw_hole_d) / 2])
            cylinder(d1 = screw_hole_d, d2 = screw_head_d + 2 * eps, h = (screw_head_d - screw_hole_d) / 2 + eps);
    }
}

// The logo at radius r and angle a in a face on z = 0, its top outwards.
module logo_on_ring(r, a, width) {
    rotate(a) translate([r, 0, 0]) rotate(-90) logo_cut(width);
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
// shape cut for the screw's. render() keeps the preview working with this
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
