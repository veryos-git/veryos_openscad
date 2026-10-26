// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// V2: hook clamp phone holder in the style of V2/inspiration. Two brackets
// hook over the phone's long edges. The slider's guide bar runs in the
// body's sleeve; a star knob screw through the body's end wall threads into
// the bar and pulls the slider in until both hooks grip the phone. The
// slider's outer end has a printed 1/4"-20 UNC thread for a tripod or ball
// head, so the phone stands in landscape with the knob on top.
//
// Print 1 body and 1 slider lying on their side, as in the inspiration
// photo: every layer is the hook profile, and the guide's 45 degree points
// face up and down, so neither needs support. The horizontal holes get a 45
// degree roof on top instead of sagging. Print the lock screw standing on
// its knob.
// Origin: the body's hook, centre of its cavity at y = 0, phone back on z = 0
// with the screen facing +z.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on bed,assembly:Assembly preview,body:Body (sleeve),slider:Slider (guide bar),lock_screw:Lock screw,thread_test:Tripod thread test]

/* [Phone] */
// Smallest and largest phone width (the short side, with case) the hooks
// clamp.
grip_min = 60;
grip_max = 90;
// Diameter of the hook cavities: the thickest phone, with case.
phone_thickness = 12;

/* [Brackets] */
// Along the phone; also the print height. Keep it narrow enough to miss the
// side buttons.
holder_width = 30;
hook_wall = 3;
// Height of the guide bar, which holds the lock screw thread.
guide_height = 12;
// Sleeve wall around the guide.
wall = 2;
// Gap between the guide bar and the sleeve, all round.
slide_clearance = 0.2;
// End wall of the sleeve, under the knob.
end_wall = 5;

/* [Tripod thread] */
// Blind 1/4"-20 UNC hole; must be deeper than the tripod screw is long.
tripod_thread_depth = 9;
// Added to the thread diameter; raise it if the tripod screw is tight.
tripod_thread_clearance = 0.3;

/* [Lock screw] */
lock_thread_diameter = 8;
// Coarse, so the full range takes few turns.
lock_thread_pitch = 2.5;
// Radial gap between the lock screw and the bar's thread.
lock_thread_clearance = 0.15;
// Thread engaged in the bar at grip_max.
min_engagement = 10;
knob_diameter = 24;
knob_height = 10;

/* [Quality] */
$fn = 64;

/* [Hidden] */
eps = 0.01;
// Hook cavity radius.
cavity_r = phone_thickness / 2;
// From a hook's cavity centre to the bracket's outer end.
back = cavity_r + hook_wall;
hook_top = 2 * cavity_r + hook_wall;
// Height of the sleeve and the slider's jaw block, below the phone.
block_h = guide_height + 2 * (slide_clearance + wall);
guide_z = -block_h / 2;
channel_end = back - end_wall;
// The slider's jaw block meets the sleeve at grip_min.
sleeve_start = 2 * cavity_r - grip_min;
bar_length = channel_end - sleeve_start - 1;
// End face of the body to the bar tip at grip_min.
gap_min = back - (sleeve_start + bar_length);
// Shank below the knob.
screw_length = gap_min + grip_max - grip_min + min_engagement;
lock_depth = screw_length - gap_min + 1;
layout_gap = 5;

assert(grip_max > grip_min, "grip_max must be larger than grip_min.");
assert(bar_length - (grip_max - grip_min) >= 15,
       "Less than 15 mm of guide bar stays in the sleeve at grip_max; narrow the grip range.");
assert(bar_length - lock_depth >= 2, "The lock screw thread runs through the bar; narrow the grip range.");
assert(lock_thread_diameter / 2 + 1.5 <= guide_height / 2, "The lock screw is too thick for the guide bar.");
assert(tripod_thread_depth <= back, "The tripod thread reaches into the guide bar.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "body") body();
else if (part == "slider") slider();
else if (part == "lock_screw") lock_screw();
else if (part == "thread_test") thread_test();

// Slider halfway between grip_min and grip_max, with a phone ghost.
module assembly() {
    grip = (grip_min + grip_max) / 2;
    color("dodgerblue") body();
    color("deepskyblue") translate([0, 2 * cavity_r - grip, 0]) slider();
    color("orange") translate([0, back + knob_height, guide_z]) rotate([90, 0, 0]) lock_screw();
    %translate([-75, cavity_r - grip, 0]) cube([150, grip, phone_thickness]);
}

// Every part in its print orientation, side by side.
module print_layout() {
    translate([0, -(sleeve_start + back) / 2, 0]) lay() body();
    translate([block_h + hook_top + layout_gap, -(bar_length - back) / 2, 0]) lay() slider();
    translate([-(hook_top + layout_gap + knob_diameter / 2), 0, 0]) lock_screw();
}

// Lays a bracket on its -x side, x upwards.
module lay() translate([0, 0, holder_width / 2]) rotate([0, -90, 0]) children();

// Hook with the sleeve, open towards -y; the knob sits on the end wall.
module body() {
    difference() {
        bracket(sleeve_start);
        translate([0, sleeve_start - 1, guide_z]) rotate([-90, 0, 0])
            linear_extrude(channel_end - sleeve_start + 1) guide_section();
        d = lock_thread_diameter + 0.6;
        translate([0, back + 1, guide_z]) rotate([90, 0, 0]) {
            cylinder(d = d, h = end_wall + 2);
            roof(d / 2, end_wall + 2);
        }
    }
}

// Hook open towards +y with the guide bar. Origin at its cavity centre.
module slider() {
    difference() {
        union() {
            mirror([0, 1, 0]) bracket(0);
            translate([0, -eps, guide_z]) rotate([-90, 0, 0])
                linear_extrude(bar_length + eps) offset(delta = -slide_clearance) guide_section();
        }
        translate([0, -back, guide_z]) rotate([-90, 0, 0]) tripod_thread_hole();
        translate([0, bar_length, guide_z]) rotate([90, 0, 0]) lock_thread_hole(lock_depth);
    }
}

// Hook profile plus a block below the phone from y = start to the outer end,
// extruded across the holder width, with rounded outer corners.
module bracket(start)
    rotate([90, 0, 90]) linear_extrude(holder_width, center = true)
        offset(r = 1) offset(delta = -1) {
            hook_profile();
            translate([start, -block_h]) square([back - start, block_h]);
        }

// Cavity centred on y = 0 and tangent to the phone back, open towards -y,
// with a flat back, a 45 degree bevel on the outer top corner and a round tip
// over the screen.
module hook_profile() {
    difference() {
        polygon([[0, 0], [back, 0], [back, hook_top - hook_wall], [back - hook_wall, hook_top],
                 [0, hook_top]]);
        translate([0, cavity_r]) circle(cavity_r);
    }
    translate([0, hook_top - hook_wall / 2]) circle(d = hook_wall);
}

// Sleeve channel: flat towards the phone and the back, 45 degree points
// towards the sides, which face up and down on the print bed.
module guide_section() {
    w = holder_width / 2 - wall;
    h = guide_height / 2 + slide_clearance;
    polygon([[-w, 0], [h - w, h], [w - h, h], [w, 0], [w - h, -h], [h - w, -h]]);
}

// Star knob on z = 0, shank upwards.
module lock_screw() {
    r = knob_diameter / 2;
    lobe = 0.18 * knob_diameter;
    linear_extrude(knob_height) offset(r = -1.5) offset(delta = 1.5) {
        circle(r - lobe);
        for (i = [0:5]) rotate(i * 60) translate([r - lobe, 0]) circle(lobe);
    }
    translate([0, 0, knob_height - eps]) intersection() {
        lock_thread(lock_thread_diameter, screw_length + eps);
        // 45 degree tip chamfer eases the start into the thread.
        cylinder(h = screw_length + eps, r1 = lock_thread_diameter / 2 - 1 + screw_length,
                 r2 = lock_thread_diameter / 2 - 1);
    }
}

// A short block with the tripod thread, lying like the slider, to check the
// fit before printing the brackets.
module thread_test()
    translate([0, 0, 8]) rotate([0, -90, 0]) difference() {
        translate([-8, 0, -8]) cube([16, tripod_thread_depth + wall, 16]);
        rotate([-90, 0, 0]) tripod_thread_hole();
    }

// 45 degree roof over a hole of radius r along z, pointing towards +x (up on
// the print bed), from z = 0 to h.
module roof(r, h)
    linear_extrude(h) polygon([[0, 0], [r / sqrt(2), r / sqrt(2)], [r * sqrt(2), 0], [r / sqrt(2), -r / sqrt(2)]]);

// Threaded hole for the lock screw, from z = 0 to depth, with a 45 degree
// lead-in at z = 0.
module lock_thread_hole(depth) {
    d = lock_thread_diameter + 2 * lock_thread_clearance;
    thread_h = 0.4 * lock_thread_pitch;
    translate([0, 0, -1]) {
        lock_thread(d, depth + 1);
        cylinder(r1 = d / 2 + 1, r2 = d / 2 - thread_h, h = 1 + thread_h);
        roof(d / 2, depth + 1);
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
        roof(d / 2, tripod_thread_depth + 1);
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
