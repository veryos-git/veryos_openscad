// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Phone holder with a printed 1/4"-20 UNC camera thread in its base, to screw
// onto a tripod or ball head. The phone sits in landscape between a fixed
// bottom jaw and a sliding top jaw. The top jaw hangs on a bar that slides in
// a tube behind the phone: push it down onto the phone and tighten the lock
// screw in the back of the tube, which presses the bar against the tube's
// front wall.
//
// Print 1 body (standing on its base, so the tripod thread prints upright),
// 1 slider (on the top face of its jaw) and 1 lock screw (on its knob).
// Origin: x centred on the holder, z = 0 on the underside of the base. The
// phone's back rests on y = 0 and its screen faces -y.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on bed,assembly:Assembly preview,body:Body,slider:Slider (top jaw),lock_screw:Lock screw,thread_test:Tripod thread test]

/* [Phone] */
// Smallest and largest phone width (the short side, with case) the jaws clamp.
grip_min = 60;
grip_max = 90;
// Depth of the jaw channels: the thickest phone, with case.
phone_thickness = 12;

/* [Holder] */
// Width of the jaws along the phone. Keep it narrow enough to miss the side
// buttons.
holder_width = 30;
// Lips at the front of the jaws keep the phone from tipping out.
lip_height = 3;
// Lips, tube walls and the floor above the tripod thread.
wall = 2.4;
// Plate of the top jaw.
jaw_thickness = 6;

/* [Slider] */
bar_width = 16; // x
bar_depth = 8;  // y
// Gap per side between the bar and the tube.
slide_clearance = 0.25;

/* [Tripod thread] */
// Blind 1/4"-20 UNC hole; must be deeper than the tripod screw is long.
tripod_thread_depth = 9;
// Added to the thread diameter; raise it if the tripod screw is tight.
tripod_thread_clearance = 0.3;

/* [Lock screw] */
lock_thread_diameter = 8;
lock_thread_pitch = 1.5;
// Radial gap between the lock screw and its thread in the tube.
lock_thread_clearance = 0.15;
// Back wall of the tube, which holds the lock thread.
lock_wall = 7;
// Lock screw axis below the top of the tube.
lock_drop = 10;
knob_diameter = 20;
knob_height = 7;

/* [Quality] */
$fn = 64;

/* [Hidden] */
eps = 0.01;
// Bottom jaw face, where the phone stands.
floor_z = tripod_thread_depth + wall;
// The top jaw rests on the tube at grip_min.
tube_top = floor_z + grip_min;
bore = [bar_width, bar_depth] + [2, 2] * slide_clearance;
tube_w = bore.x + 2 * wall;
// Back of the tube and of both jaws.
tube_d = wall + bore.y + lock_wall;
// Front of the lips.
jaw_front = -phone_thickness - wall;
// The bar ends 2 mm above the tube floor at grip_min.
bar_length = grip_min - 2;
// Lowest bar end, at grip_max.
bar_end_max = floor_z + grip_max - bar_length;
lock_z = tube_top - lock_drop;
// Lock screw shank: through the back wall and the gap behind the bar, plus
// 1.5 mm to press the bar against the front wall.
lock_length = lock_wall + 2 * slide_clearance + 1.5;
// Centre of the base footprint.
tripod_y = (jaw_front + tube_d) / 2;
layout_gap = 5;

assert(grip_max > grip_min, "grip_max must be larger than grip_min.");
assert(bar_end_max < lock_z - lock_thread_diameter / 2,
       "At grip_max the bar ends above the lock screw; raise grip_min or lower grip_max.");
assert(tube_w <= holder_width, "The tube is wider than the holder.");
assert(lock_thread_diameter + 2 < tube_w, "The lock screw is too wide for the tube.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "body") body();
else if (part == "slider") slider();
else if (part == "lock_screw") lock_screw();
else if (part == "thread_test") thread_test();

// Slider halfway between grip_min and grip_max, with a phone ghost.
module assembly() {
    grip = (grip_min + grip_max) / 2;
    color("dimgray") body();
    color("silver") translate([0, 0, floor_z + grip + jaw_thickness]) mirror([0, 0, 1]) slider();
    // Tip touching the bar.
    color("orange")
        translate([0, tube_d + 1.5 + slide_clearance + knob_height, lock_z]) rotate([90, 0, 0])
            lock_screw();
    %translate([-75, -phone_thickness, floor_z]) cube([150, phone_thickness, grip]);
}

// Every part in its print orientation, side by side.
module print_layout() {
    body();
    translate([holder_width + layout_gap, 0, 0]) slider();
    translate([-(holder_width / 2 + layout_gap + knob_diameter / 2), tripod_y, 0]) lock_screw();
}

// Bottom jaw with the tube on its back half, the tripod thread from below
// and the lock thread through the tube's back wall.
module body() {
    difference() {
        union() {
            jaw(floor_z);
            translate([-tube_w / 2, 0, floor_z - eps]) cube([tube_w, tube_d, grip_min + eps]);
        }
        translate([-bore.x / 2, wall, floor_z]) cube([bore.x, bore.y, grip_min + 1]);
        translate([0, tube_d, lock_z]) rotate([90, 0, 0]) lock_thread_hole(lock_wall + 1);
        translate([0, tripod_y, 0]) tripod_thread_hole();
    }
}

// Printed on the top face of its jaw, bar up. Flipped over in use.
module slider() {
    jaw(jaw_thickness);
    // Bevelled edges keep the bar clear of the rounded corners of the bore.
    translate([0, wall + bore.y / 2, jaw_thickness - eps])
        linear_extrude(bar_length + eps)
            offset(delta = 0.6, chamfer = true) square([bar_width, bar_depth] - [1.2, 1.2], center = true);
}

// Jaw across the holder width with its contact face at z = plate: a plate
// under the phone's edge and the tube, and a lip in front of the phone. The
// lip's inner edge is bevelled so the phone slides in.
module jaw(plate) {
    c = 1;
    rotate([90, 0, 90]) linear_extrude(holder_width, center = true)
        polygon([[jaw_front, 0], [tube_d, 0], [tube_d, plate], [-phone_thickness, plate],
                 [-phone_thickness, plate + lip_height - c], [-phone_thickness - c, plate + lip_height],
                 [jaw_front, plate + lip_height]]);
}

// Fluted knob with bevelled edges on z = 0, shank upwards.
module lock_screw() {
    r = knob_diameter / 2;
    h = knob_height;
    difference() {
        rotate_extrude() polygon([[0, 0], [r - 1, 0], [r, 1], [r, h - 1], [r - 1, h], [0, h]]);
        for (i = [0:7]) rotate(i * 45) translate([r + 1, 0, -1]) cylinder(r = 2.5, h = h + 2);
    }
    translate([0, 0, h - eps]) intersection() {
        lock_thread(lock_thread_diameter, lock_length + eps);
        // 45 degree tip chamfer eases the start into the thread and leaves a
        // flat pad that presses on the bar.
        cylinder(h = lock_length + eps, r1 = lock_thread_diameter / 2 - 1 + lock_length,
                 r2 = lock_thread_diameter / 2 - 1);
    }
}

// A short piece of the base around the tripod thread, to check the fit
// before printing the body.
module thread_test()
    difference() {
        cylinder(d = 16, h = floor_z);
        tripod_thread_hole();
    }

// Threaded hole for the lock screw, from z = 0 to depth, with a 45 degree
// lead-in at z = 0.
module lock_thread_hole(depth) {
    d = lock_thread_diameter + 2 * lock_thread_clearance;
    thread_h = 0.4 * lock_thread_pitch;
    translate([0, 0, -1]) {
        lock_thread(d, depth + 1);
        cylinder(r1 = d / 2 + 1, r2 = d / 2 - thread_h, h = 1 + thread_h);
    }
}

// 1/4"-20 UNC hole from z = 0 up to tripod_thread_depth, with a 45 degree
// lead-in at z = 0. The cutter is the basic screw profile: 60 degree flanks,
// 5/8 of the sharp V deep, with a P/8 flat at the major diameter.
module tripod_thread_hole() {
    p = 25.4 / 20;
    d = 25.4 / 4 + tripod_thread_clearance;
    thread_h = 5 / 8 * sqrt(3) / 2 * p;
    translate([0, 0, -1]) {
        threaded_rod(d, tripod_thread_depth + 1, p, thread_h, p / 16, 30);
        cylinder(r1 = d / 2 + 1, r2 = d / 2 - thread_h, h = 1 + thread_h);
    }
}

// The lock screw's thread: 45 degree flanks, as in the softbox screws.
module lock_thread(d, h)
    threaded_rod(d, h, lock_thread_pitch, 0.4 * lock_thread_pitch, 0.05 * lock_thread_pitch, 45);

// Threaded rod of major diameter d from z = 0 to h: a screw shank, and, with
// the clearance added, the shape cut for a threaded hole. depth is the radial
// thread depth, half_tip half the crest flat and flank the angle between a
// flank and the radial plane. render() keeps the preview working with this
// many threads.
module threaded_rod(d, h, pitch, depth, half_tip, flank) {
    r_root = d / 2 - depth;
    render(convexity = 4) intersection() {
        union() {
            cylinder(r = r_root + eps, h = h);
            thread_ridge(r_root, -pitch, h + pitch, pitch, depth, half_tip, flank);
        }
        cylinder(r = d / 2 + 1, h = h);
    }
}

// Sweeps a trapezoid around a right-handed helix.
module thread_ridge(r_root, z0, z1, pitch, depth, half_tip, flank) {
    run = depth * tan(flank);
    base = half_tip + run + eps * tan(flank);
    steps = ceil((z1 - z0) / pitch * $fn);
    profile = [[r_root - eps, -base],
               [r_root + depth, -half_tip],
               [r_root + depth, half_tip],
               [r_root - eps, base]];
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
