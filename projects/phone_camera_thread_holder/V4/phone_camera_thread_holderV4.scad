// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V4: V3 with the VeryOS logo engraved in every part: in the back of the body
// and of the slider, the face away from the phone, and in the end of the lock
// screw's head. The two in the back read from behind with their top towards
// the screw head, the top of the holder in landscape on a tripod.
//
// V3: V2 with the lock screw set to the tested fdm_optimized_screws values:
// 0.25 mm thread clearance, a 0.15 cut so the smooth shank stands on the bed,
// and no roof over the bar's thread, since 45 degree threads print sideways
// without one. A keel under the guide bar reaches the print bed, so the bar
// no longer hangs in the air, and a second tripod thread sits in the back of
// the slider.
//
// Hook clamp phone holder in the style of V2/inspiration. Two brackets
// hook over the phone's long edges. The slider's guide bar runs in the
// body's sleeve; a hex head screw through the body's end wall threads into
// the bar and pulls the slider in until both hooks grip the phone. The
// slider's outer end has a printed 1/4"-20 UNC thread for a tripod or ball
// head, so the phone stands in landscape with the screw head on top. A second
// one in the slider's back holds the phone with its back to the tripod:
// lying flat on a tripod, or turned to any angle on a ball head tilted 90
// degrees.
//
// Print 1 body and 1 slider lying on their side, as in the inspiration
// photo: every layer is the hook profile, the guide's 45 degree points face
// up and down, and the keel runs from the bar's lower point down to the bed,
// so neither needs support. The tripod threads and the end wall hole get a
// 45 degree roof on top instead of sagging; the lock screw thread in the bar
// needs none. The logos are engraved in standing walls, as in
// veryos_logo_cube. The lock screw prints lying on a
// flat of its head with its underside cut off, as in fdm_optimized_screws,
// so the layers run along the shank.
// Origin: the body's hook, back of its cavity at y = 0, phone back on z = 0
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
// Height of the hook cavities: the thickest phone, with case.
phone_thickness = 15;
// Your phone's width, with case. Sets the lock screw's length: its thread
// reaches the bar just as the hooks touch the phone. Narrower phones take
// more turns; for a wider one, print a screw for its width.
phone_width = 80;

/* [Brackets] */
// Along the phone; also the print height. Keep it narrow enough to miss the
// side buttons.
holder_width = 30;
hook_wall = 3;
// How far the hooks reach over the phone's front, from the cavity back.
lip_length = 5;
// Radius in the two inner corners of each hook cavity. Small, so the phone's
// edge sits square against the back of the hook and cannot ride out.
cavity_rounding = 1.5;
// Height of the guide bar, which holds the lock screw thread.
guide_height = 12;
// Sleeve wall around the guide, and the wall between the tripod thread and
// the guide bar.
wall = 3;
// Gap between the guide bar and the sleeve, all round.
slide_clearance = 0.2;
// Keel from the guide bar's lower point to the side the parts print on, so
// the bar stands on the bed. The sleeve has a slot for it.
keel_width = 6;
// End wall of the sleeve, under the screw head.
end_wall = 5;

/* [Logo] */
// The VeryOS logo engraved in every part. In the back of the body, centred
// on it, across the holder width.
body_logo_width = 20;
// In the back of the slider's jaw block, behind the tripod thread in its end.
slider_logo_width = 12;
// In the end of the lock screw's head.
screw_logo_width = 10;
// Into the walls; keep it below wall.
logo_depth = 1;

/* [Tripod thread] */
// Blind 1/4"-20 UNC hole; must be deeper than the tripod screw is long.
tripod_thread_depth = 9;
// Added to the thread diameter; raise it if the tripod screw is tight.
tripod_thread_clearance = 0.3;

/* [Lock screw] */
lock_thread_diameter = 8;
// 2 mm prints best (fdm_optimized_screws).
lock_thread_pitch = 2;
// Radial gap between the lock screw and the bar's thread. 0.25 has little
// play and is safe on printers that are not perfectly calibrated.
lock_thread_clearance = 0.25;
// Threaded part at the screw's tip, all of it in the bar when the screw
// seats; screw_thread_length / lock_thread_pitch turns from first bite to
// tight. The rest of the shank is smooth.
screw_thread_length = 10;
screw_head_width = 16; // across flats
screw_head_height = 8;
// This share of the thread diameter is cut off the underside of the lying
// screw, through the shank and the head. 0.15 has printed well. The smooth
// shank is as thick as the thread's root, so at 0.1 it would only touch the
// bed along a line.
screw_cut = 0.15;

/* [Quality] */
$fn = 64;

/* [Hidden] */
eps = 0.01;
// From a hook's cavity back to the bracket's outer end.
back = hook_wall;
hook_top = phone_thickness + hook_wall;
// Height of the sleeve and the slider's jaw block, below the phone.
block_h = guide_height + 2 * (slide_clearance + wall);
guide_z = -block_h / 2;
channel_end = back - end_wall;
// The slider's jaw block holds the tripod thread. Its inner face, where the
// guide bar starts, meets the sleeve at grip_min.
slider_stop = tripod_thread_depth + wall - back;
sleeve_start = slider_stop - grip_min;
bar_length = channel_end - sleeve_start - 1;
// End face of the body to the bar tip at grip_min.
gap_min = back - (sleeve_start + bar_length);
// Shank below the head: smooth through the end wall and up to the bar tip
// at phone_width, then threaded.
screw_length = gap_min + phone_width - grip_min + screw_thread_length;
// Deep enough for the screw down to grip_min.
lock_depth = screw_length - gap_min + 1;
// The end and back tripod holes sit this far either side of the middle, so
// the back hole's roof stays `wall` clear of the end hole.
tripod_r = (25.4 / 4 + tripod_thread_clearance) / 2;
tripod_offset = (tripod_r * (1 + sqrt(2)) + wall) / 2;
// Height of the lying lock screw's axis above the bed. The cut is this far
// from the axis, at +y of the upright screw.
screw_axis_z = lock_thread_diameter * (0.5 - screw_cut);
// The screw's logo sits midway between the cut and the far edge of the
// head's end.
screw_logo_y = (screw_axis_z - screw_head_width / 2) / 2;
layout_gap = 5;
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

assert(grip_max > grip_min, "grip_max must be larger than grip_min.");
assert(phone_width >= grip_min && phone_width <= grip_max, "phone_width must lie between grip_min and grip_max.");
assert(bar_length - (grip_max - grip_min) >= 15,
       "Less than 15 mm of guide bar stays in the sleeve at grip_max; narrow the grip range.");
assert(bar_length - lock_depth >= 2, "The lock screw thread runs through the bar; narrow the grip range.");
assert(lock_thread_diameter / 2 + 1.5 <= guide_height / 2, "The lock screw is too thick for the guide bar.");
assert(keel_width <= guide_height - 4, "The keel is too wide; the sleeve's slot would not hold the bar.");
assert(body_logo_width + 4 <= holder_width, "The logo is wider than the back of the body; lower body_logo_width.");
assert(slider_logo_width * 2 * logo_r / logo_w + 2 <= slider_stop + back,
       "The slider's logo is longer than its jaw block; lower slider_logo_width.");
assert(norm([screw_logo_width / 2, screw_logo_y - screw_logo_width * logo_r / logo_w]) <= screw_head_width / 2,
       "The screw's logo is larger than the end of its head; lower screw_logo_width.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "body") lay() body();
else if (part == "slider") lay() slider();
else if (part == "lock_screw") lock_screw_lying();
else if (part == "thread_test") thread_test();

// Clamped on a phone_width phone, shown as a ghost.
module assembly() {
    grip = phone_width;
    color("dodgerblue") body();
    color("deepskyblue") translate([0, -grip, 0]) slider();
    color("orange") translate([0, back + screw_head_height, guide_z]) rotate([90, 0, 0]) lock_screw();
    %translate([-75, -grip, 0]) cube([150, grip, phone_thickness]);
}

// Every part in its print orientation, side by side.
module print_layout() {
    translate([0, -(sleeve_start + back) / 2, 0]) lay() body();
    translate([block_h + hook_top + layout_gap, -(slider_stop + bar_length - back) / 2, 0]) lay() slider();
    translate([-(hook_top + layout_gap + screw_head_width / (2 * cos(30))), 0, 0]) lock_screw_lying();
}

// Lays a bracket on its -x side, x upwards.
module lay() translate([0, 0, holder_width / 2]) rotate([0, -90, 0]) children();

// Hook with the sleeve, open towards -y; the screw head sits on the end wall.
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
        translate([0, (sleeve_start + back) / 2, -block_h]) logo_cut(body_logo_width);
    }
}

// Hook open towards +y with the guide bar. Origin at its cavity back.
module slider() {
    difference() {
        union() {
            mirror([0, 1, 0]) bracket(-slider_stop);
            translate([0, slider_stop - eps, guide_z]) rotate([-90, 0, 0])
                linear_extrude(bar_length + eps) bar_section();
        }
        translate([tripod_offset, -back, guide_z]) rotate([-90, 0, 0]) tripod_thread_hole();
        // In the back, in the middle of the jaw block.
        translate([-tripod_offset, (slider_stop - back) / 2, -block_h]) tripod_thread_hole();
        // Behind the tripod thread in the end, beside the one in the back.
        translate([tripod_offset, (slider_stop - back) / 2, -block_h]) logo_cut(slider_logo_width);
        translate([0, slider_stop + bar_length, guide_z]) rotate([90, 0, 0]) lock_thread_hole(lock_depth);
    }
}

// Hook profile plus a block below the phone from y = start to the outer end,
// extruded across the holder width, with 1 mm rounded outer corners.
module bracket(start)
    rotate([90, 0, 90]) linear_extrude(holder_width, center = true)
        offset(r = 1) offset(delta = -1) {
            hook_profile();
            translate([start, -block_h]) square([back - start, block_h]);
        }

// Back wall and a lip over the phone's front around a square cavity, open
// towards -y, with a 45 degree bevel on the outer top corner.
module hook_profile() {
    t = phone_thickness;
    r = cavity_rounding;
    polygon([[0, 0], [back, 0], [back, hook_top - hook_wall], [back - hook_wall, hook_top],
             [-lip_length, hook_top], [-lip_length, t], [0, t]]);
    // Fillets in the cavity's corners at the phone's back and front.
    for (z = [0, t - r]) translate([-r, z]) difference() {
        square(r);
        translate([0, z == 0 ? r : 0]) circle(r);
    }
}

// Sleeve channel: flat towards the phone and the back, 45 degree points
// towards the sides, which face up and down on the print bed, and the slot
// for the keel through the -x side, the one on the bed.
module guide_section() {
    w = holder_width / 2 - wall;
    h = guide_height / 2 + slide_clearance;
    polygon([[-w, 0], [h - w, h], [w - h, h], [w, 0], [w - h, -h], [h - w, -h]]);
    translate([-holder_width / 2 - 1, -keel_width / 2 - slide_clearance])
        square([holder_width / 2 + 1, keel_width + 2 * slide_clearance]);
}

// The guide bar with its keel, ending flush with the -x side.
module bar_section()
    intersection() {
        offset(delta = -slide_clearance) guide_section();
        translate([-holder_width / 2, -guide_height]) square([holder_width, 2 * guide_height]);
    }

// The logo, width wide and centred on the origin, to cut logo_depth deep
// into a face on z = 0 from below. Mirrored, so it reads correctly from
// outside, from -z, with its top at +y.
module logo_cut(width)
    translate([0, 0, -1]) linear_extrude(logo_depth + 1) mirror([1, 0])
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

// Hex head on z = 0, shank upwards.
module lock_screw() {
    d = lock_thread_diameter;
    smooth = screw_length - screw_thread_length;
    difference() {
        hex(screw_head_width, screw_head_height);
        // In the end of the head, upright on the lying screw: its top away
        // from the cut.
        translate([0, screw_logo_y, 0]) rotate(180) logo_cut(screw_logo_width);
    }
    // At the thread's root diameter, so it passes through the bar's thread.
    translate([0, 0, screw_head_height - eps]) cylinder(d = d - 0.8 * lock_thread_pitch, h = smooth + 2 * eps);
    translate([0, 0, screw_head_height + smooth]) intersection() {
        lock_thread(d, screw_thread_length);
        // 45 degree tip chamfer eases the start into the thread.
        cylinder(h = screw_thread_length, r1 = d / 2 - 1 + screw_thread_length, r2 = d / 2 - 1);
    }
}

// Lays the screw on a flat of its head, centred on the origin, and cuts off
// everything below screw_cut * d above the shank's lowest point. The cut is
// the print bed, z = 0.
module lock_screw_lying() {
    length = screw_head_height + screw_length;
    w = screw_head_width;
    translate([0, -length / 2, screw_axis_z]) difference() {
        rotate([-90, 0, 0]) lock_screw();
        translate([-w, -1, -screw_axis_z - w]) cube([2 * w, length + 2, w]);
    }
}

// Hex prism with bevelled corners, from z = 0 to h.
module hex(width, h) {
    w = width / 2;
    intersection() {
        cylinder(r = w / cos(30), h = h, $fn = 6);
        rotate_extrude() polygon([[0, 0], [w, 0], [w + 1, 1], [w + 1, h - 1], [w, h], [0, h]]);
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
// lead-in at z = 0. No roof: the 45 degree flanks print sideways, so the
// thread goes all the way round.
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
        roof(d / 2, tripod_thread_depth + 1);
    }
}

// The lock screw's thread: 45 degree flanks, as in fdm_optimized_screws.
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
