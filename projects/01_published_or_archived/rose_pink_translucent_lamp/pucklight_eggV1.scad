// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V1: pucklight_sphereV3.scad for the dragon egg lamp. The sockel, the screwin, the
// click base and the thread are V3's, so the eggs fit V3's parts. The logo is the
// TraceTrove logo V3 instead of the VeryOS logo. The egg itself is built by the
// webapp in dragon_egg_app, from the values this file echoes as part = "info".
//
// Base of an egg lamp for an RGBW puck light (62 mm KC007). Eggs are swapped by
// unscrewing them.
//
// The puck's mount is the holder's, in a round body: the sockel. The puck lies
// in it, the holder's bottom screw (the screwin) screws into it from below,
// and the holder's click base clicks the light when the lamp is pressed down.
// The holder's parameters and modules are copied from
// ../RGBW_pucklight_holder/RGBW_pucklight_holderV3.scad, so this file runs on
// its own; copy changes to the holder over by hand.
//
// The egg's neck has a thread outside and screws into a cup on top of the sockel,
// down to the cup's floor. The cup hides the thick neck, so the whole visible egg
// is the thin shell.
//
// Print every part standing as it is used, bottom on the bed. Nothing is modelled
// as support.
// Origin of each part: centre of its bottom face.
//
// Units: mm. No external files or libraries needed.

/* [View] */
part = "assembly"; // [assembly:Assembly on the click base,section:Assembly cut in half,print_layout:All parts,sockel:Sockel,screwin:Screwin,clickbase:Click base,info:Values for the webapp]

/* [Thread] */
// Major diameter of the thread on the egg's neck.
neck_d = 67;
neck_height = 4;
// Inside the thread's root.
neck_wall = 1.2;
// Radial gap between the threads.
neck_clearance = 0.3;

/* [Sockel] */
sockel_d = 72;

/* [Puck light] */
// The manufacturer's CAD model (rgbw_light_specs) measures 62 x 26.8 mm;
// the spec sheet says 62.2 x 27.6. The Onshape model was built around the
// CAD model.
puck_d = 62;
puck_height = 26.8;
// Height of the flat ring around the dome, at the top of the rounded edge.
puck_edge_height = 21;
puck_edge_radius = 7;
puck_dome_d = 40;
// Radial gap around the puck in the bottom screw.
puck_clearance = 0.5;
// Gap between the dome and the ribs with the puck lifted to lip_height. Together
// with puck_extra_play, how far the puck can move inside the holder.
puck_play = 0.6;

/* [Holder top part] */
// Round window over the dome. The cavity's 45 degree shoulder runs up to its
// edge, so it also sets the height of the cup's floor: wider is lower.
window_d = 54;
rib_width = 2;
// Height of the ribs above the point where they touch the dome.
rib_height = 2;
// The ribs' underside is flat over this diameter and slopes down to the
// window's edge outside it.
rib_contact_d = 30;

/* [Screwin] */
screw_height = 10.4;
// Thread at the top that fully engages the top part's; below it a wider
// flange.
screw_thread_length = 3.5;
// Floor under the puck, and the height of the bar you turn the screw with, both
// less puck_extra_play. The disc reaches up from here.
lip_height = 5;
bar_width = 2;
// Wall between the puck and the thread's root.
screw_wall = 1.2;
// 2 mm prints best (fdm_optimized_screws). Also the egg's thread.
thread_pitch = 2;
// Radial gap between the threads.
thread_clearance = 0.25;
// The screw turns this much deeper than flush. Keep it below puck_play +
// puck_extra_play, or the screw clamps the puck when turned in all the way.
seat_gap = 0.6;
// The screw's floor and bar lie this much below lip_height, so the puck can still
// move with the screw turned in all the way: 0.4 mm there, 1 mm when flush. On the
// click base the puck rests on the disc, so the click does not depend on it.
puck_extra_play = 0.4;
// How far the flange below the thread stands out.
flange_overhang = 0.5;

/* [Click base] */
base_thickness = 1.2;
// Disc that lifts the puck through the bottom screw's opening.
press_d = 50;
// How far the disc reaches above the bottom screw's floor when the holder is
// pressed down onto the base. Must exceed puck_play; the rest is how far it
// pushes the button. The puck's bottom is 0.2 mm hollow inside its foot
// ring, where the disc pushes, so 1.6 pushes the button 0.8 mm. The Onshape model
// pushes it 0.7 mm.
press_height = 1.6;
// Radial gap between the disc and the bottom screw's opening, and on each
// side of the bar in the disc's slot.
slide_clearance = 1;

/* [Logo] */
// The flat TraceTrove logo V3, 20 mm wide where it is 31.75 mm tall, so a logo's
// height sets it here. The logos in the bottoms are hidden when the lamp stands on
// a desk.
// In the bottom of the click base.
base_logo_height = 50;
// In the bottom of the screw's flange, beside the bar.
screw_logo_height = 9.5;
logo_depth = 0.6;
// Also one you can see: in the front of the sockel.
front_logo = true;
front_logo_height = 20;

/* [Quality] */
$fn = 128;
// The layer height the fits are made for. The flat faces that set them lie on its
// multiples, so a slicer does not have to round them: the screw's floor and the
// ribs' underside below, and at these defaults the disc, the plate and the rest.
// At 0.28 mm, for quick prototypes, they round by up to 0.14 mm, and still fit.
layer_height = 0.2;

/* [Hidden] */
eps = 0.01;
layout_gap = 10;

// The holder, as in RGBW_pucklight_holderV3.scad.
puck_r = puck_d / 2;
thread_depth = 0.4 * thread_pitch;
function on_layer(z) = round(z / layer_height) * layer_height;
// Half the flat top of a thread's ridge.
thread_tip = 0.05 * thread_pitch;
// Inner wall of the bottom screw around the puck, and its opening for the
// disc.
bore_r = puck_r + puck_clearance;
press_r = press_d / 2;
opening_r = press_r + slide_clearance;
// Major diameters of the screw's thread and of the top part's.
screw_d = 2 * (bore_r + screw_wall + thread_depth);
hole_d = screw_d + 2 * thread_clearance;
hole_minor_r = hole_d / 2 - thread_depth;
// The flange below the screw's thread fills a recess in the bottom of the
// top part, 0.5 mm wider than the flange. Both narrow to the thread in a 45
// degree cone; a flat step would overhang in the top part. The top part's
// cone reaches its thread's crests where screw_thread_length begins, the
// flange's lies seat_gap below it.
flange_r = hole_d / 2 + flange_overhang;
recess_r = flange_r + 0.5;
screw_root_r = screw_d / 2 - thread_depth;
thread_start = screw_height - screw_thread_length;
recess_top = thread_start - (recess_r - hole_minor_r);
flange_h = recess_r + recess_top - seat_gap - flange_r;
// Gap between the cavity and the puck at its highest, pushed up by the disc.
cavity_gap = 0.5;
lift_z = lip_height + press_height;
// The cavity's shoulder is the 45 degree cone r + z = shoulder_c, cavity_gap
// off the puck's rounded edge. It starts at the top of the thread and ends
// at the window's edge on the top surface, so there is no flat ceiling to
// overhang.
shoulder_c = (puck_r - puck_edge_radius) + (lift_z + puck_edge_height - puck_edge_radius)
           + (puck_edge_radius + cavity_gap) * sqrt(2);
shoulder_z = shoulder_c - hole_minor_r;
window_r = window_d / 2;
top_z = shoulder_c - window_r;
// The ribs' underside in the middle, puck_play above the puck lying on the
// floor.
touch_z = on_layer(lip_height + puck_height + puck_play);
rib_top = touch_z + rib_height;
// Beside the window the ribs stand on 45 degree feet.
foot_w = rib_width + 2 * (touch_z - top_z);
// Height of the disc above the base's plate, and the slot in it for the bar.
disc_h = lip_height + press_height;
floor_z = on_layer(lip_height - puck_extra_play);
slot_w = bar_width + 2 * slide_clearance;
// Upper tip of the logo at its original size, where it is 20 mm wide.
logo_tip_y = 17.5 * sin(60) + (17.5 * cos(60) - 7.5) * tan(30);
// Width of a logo of the given height.
function logo_w(height) = height * 20 / (2 * logo_tip_y);
// The screw's logo sits in the middle of the flange's bottom ring.
screw_logo_x = (opening_r + flange_r) / 2;

// The sockel: the holder's top part, round, with the cup on top.
sockel_r = sockel_d / 2;
neck_root_r = neck_d / 2 - thread_depth;
neck_bore_r = neck_root_r - neck_wall;
// The ribs end inside the neck's bore.
rib_r = neck_bore_r - 1.5;
// The cup's female thread and its 45 degree lead-in. Its rim stands
// thread_depth above the neck, hiding the thread's run-out.
cup_d = neck_d + 2 * neck_clearance;
cup_h = neck_height + thread_depth;
cup_lead_r = cup_d / 2 + thread_depth;
sockel_h = top_z + cup_h;

// The holder's checks.
assert(seat_gap < puck_play + puck_extra_play, "seat_gap must stay below puck_play + puck_extra_play, or the bottom screw clamps the puck.");
assert(press_height > puck_play, "press_height must exceed puck_play, or the base never pushes the button.");
assert(window_d > puck_dome_d, "The window must be wider than the dome.");
assert(top_z >= lift_z + puck_edge_height + cavity_gap, "window_d is too wide for the cavity's shoulder.");
assert(touch_z > top_z, "The dome does not reach above the top part.");
assert(rib_contact_d < window_d, "rib_contact_d must be smaller than window_d.");
assert(flange_h >= 1, "screw_thread_length is too long for screw_height: no flange left below the thread.");
assert(shoulder_z >= screw_height + seat_gap, "The cavity's shoulder starts below the bottom screw's top.");
assert(bore_r - opening_r >= 2, "press_d is too large: the bottom screw's floor must be at least 2 mm wide.");
assert(logo_w(screw_logo_height) + 2 <= flange_r - opening_r,
       "The screw's logo is wider than its flange; lower screw_logo_height.");
assert(norm([logo_w(base_logo_height) / 2, base_logo_height / 2]) <= sockel_r - 2,
       "The base's logo does not fit on its bottom; lower base_logo_height.");
assert(logo_depth + 0.5 <= base_thickness, "logo_depth is too deep for the click base's plate, under the bar's slot.");
// The sockel's and the neck's.
assert(sockel_r - recess_r >= 1.2, "sockel_d is too small: the wall around the screw's recess must stay 1.2 mm thick.");
assert(sockel_r - cup_lead_r >= 1, "neck_d is too large for sockel_d: the cup's rim must stay 1 mm wide.");
assert(rib_r >= window_r + 2, "neck_d is too small: the ribs need 2 mm to stand on beside the window.");
assert(norm([rib_r, foot_w / 2]) <= neck_bore_r - 0.5, "The ribs' feet hit the neck; lower window_d or raise neck_d.");
assert(!front_logo || front_logo_height + 2 <= sockel_h - recess_top, "The front logo is too large for the sockel; lower front_logo_height.");

if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "print_layout") print_layout();
else if (part == "sockel") sockel();
else if (part == "screwin") bottom_screw();
else if (part == "clickbase") clickbase();
else if (part == "info") info();

// What the webapp needs to build an egg that fits, as one line of JSON.
module info()
    echo(str("{\"n_mm__neck_d\":", neck_d, ",\"n_mm__neck_scl_z\":", neck_height,
             ",\"n_mm__neck_wall\":", neck_wall, ",\"n_mm__thread_pitch\":", thread_pitch,
             ",\"n_mm__thread_depth\":", thread_depth, ",\"n_mm__thread_tip\":", thread_tip,
             ",\"n_mm__sockel_scl_x\":", sockel_d, ",\"n_mm__sockel_scl_z\":", sockel_h,
             ",\"n_mm__cup_scl_z\":", cup_h, ",\"n_mm__seat_z\":", top_z,
             ",\"n_mm__puck_top_z\":", lip_height + puck_play + puck_height,
             ",\"n_mm__clickbase_z\":", -base_thickness,
             ",\"n_mm__sockel_z\":", press_height - puck_play, "}"));

// Released: as in the holder the lamp rests on the puck's dome, which touches
// the ribs, and the puck lies on the disc, so the sockel floats
// press_height - puck_play above the base. Pressing it down that far clicks the
// light. The puck is a ghost.
module assembly() {
    translate([0, 0, -base_thickness]) color("silver") clickbase();
    translate([0, 0, press_height - puck_play]) {
        color("lightskyblue") sockel();
        color("gold") bottom_screw();
        %translate([0, 0, lip_height + puck_play]) puck();
    }
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    translate([0, 0, -base_thickness]) color("silver") half_cut() clickbase();
    translate([0, 0, press_height - puck_play]) {
        color("lightskyblue") half_cut() sockel();
        color("gold") half_cut() bottom_screw();
        color("orange") half_cut() translate([0, 0, lip_height + puck_play]) puck();
    }
}

// Cuts away the half in front of y = 0, rendered so it keeps its colour.
// union() keeps all of a loop's objects with lazy-union.
module half_cut()
    render() difference() {
        union() children();
        translate([-200, -400, -200]) cube(400);
    }

// Every part as it is printed, side by side.
module print_layout() {
    sockel();
    translate([sockel_d + layout_gap, 0, 0]) clickbase();
    translate([-(sockel_d + layout_gap), 0, 0]) bottom_screw();
}

// The holder's top part in a round body, with the cup for the egg on top: its
// cavity, its internal thread and the cross of ribs over the window. The cup's thread starts on its floor, in phase with the neck's. The
// union() keeps it one solid with lazy-union, as in the browser playground.
module sockel() union() {
    difference() {
        cylinder(r = sockel_r, h = sockel_h);
        rotate_extrude() polygon([
            [0, -1], [recess_r, -1], [recess_r, recess_top], [hole_minor_r, thread_start],
            [hole_minor_r, shoulder_z], [window_r - 1, top_z + 1], [0, top_z + 1]]);
        // From z = 0 like the screw's thread, so the bar lies along y when
        // the screw is flush.
        threaded_rod(hole_d, shoulder_z);
        translate([0, 0, top_z]) threaded_rod(cup_d, cup_h + 1);
        // 45 degree lead-in at the rim.
        translate([0, 0, sockel_h - 2 * thread_depth]) cylinder(h = 2 * thread_depth + eps,
            r1 = cup_d / 2 - thread_depth, r2 = cup_lead_r + eps);
        if (front_logo) sockel_front_logo_cut();
    }
    for (a = [0, 90]) rotate(a) rib();
}

// The logo in the sockel's front, logo_depth deep everywhere on the round wall.
module sockel_front_logo_cut()
    difference() {
        translate([0, 0, (recess_top + sockel_h) / 2]) rotate([90, 0, 0]) translate([0, 0, sockel_r - 3])
            linear_extrude(4) logo(front_logo_height);
        translate([0, 0, -1]) cylinder(r = sockel_r - logo_depth, h = sockel_h + 2);
    }

// A rib along x across the window. Its underside rises from the window's
// edge to touch_z and is flat over rib_contact_d, where the dome touches.
// Beside the window it stands on 45 degree feet.
module rib() {
    c = rib_contact_d / 2;
    rotate([90, 0, 0]) linear_extrude(rib_width, center = true) polygon([
        [-rib_r, top_z - eps], [-window_r, top_z - eps], [-c, touch_z], [c, touch_z],
        [window_r, top_z - eps], [rib_r, top_z - eps], [rib_r, rib_top], [-rib_r, rib_top]]);
    for (m = [0, 1]) mirror([m, 0, 0])
        translate([window_r, 0, 0]) rotate([90, 0, 90]) linear_extrude(rib_r - window_r)
            polygon([[-foot_w / 2, top_z - eps], [foot_w / 2, top_z - eps],
                     [rib_width / 2, touch_z], [-rib_width / 2, touch_z]]);
}

// Ring with a flange at the bottom and the thread above it. The puck lies on
// its floor; the bar across the opening turns it.
module bottom_screw() {
    difference() {
        union() {
            rotate_extrude() polygon([[0, 0], [flange_r, 0], [flange_r, flange_h],
                                      [screw_root_r, flange_h + flange_r - screw_root_r],
                                      [0, flange_h + flange_r - screw_root_r]]);
            intersection() {
                threaded_rod(screw_d, screw_height);
                // 45 degree chamfer at the top eases the start into the thread.
                cylinder(h = screw_height, r1 = screw_d / 2 - thread_depth + screw_height,
                         r2 = screw_d / 2 - thread_depth);
            }
        }
        translate([0, 0, floor_z]) cylinder(r = bore_r, h = screw_height);
        translate([0, 0, -1]) cylinder(r = opening_r, h = lip_height + 2);
        // Reads from below, its top along the flange.
        translate([screw_logo_x, 0, 0]) rotate([0, 180, 0]) logo_cut(screw_logo_height);
    }
    translate([-bar_width / 2, -opening_r - 1, 0]) cube([bar_width, 2 * opening_r + 2, floor_z]);
}

// Round plate with the disc that lifts the puck, slotted for the bottom screw's
// bar. The disc also centres the lamp. Bottom on z = 0.
module clickbase() {
    difference() {
        union() {
            cylinder(r = sockel_r, h = base_thickness);
            translate([0, 0, base_thickness - eps]) rotate_extrude()
                polygon([[0, 0], [press_r, 0], [press_r, disc_h - 1], [press_r - 1, disc_h + eps], [0, disc_h + eps]]);
        }
        // With 45 degree chamfers along the top, so the bar finds its way in.
        translate([0, 0, base_thickness]) rotate([90, 0, 0]) linear_extrude(press_d + 2, center = true)
            polygon([[-slot_w / 2, 0], [slot_w / 2, 0], [slot_w / 2, disc_h - 1], [slot_w / 2 + 2, disc_h + 1],
                     [-slot_w / 2 - 2, disc_h + 1], [-slot_w / 2, disc_h - 1]]);
        // In the bottom, on the desk. Reads from below.
        rotate([0, 180, 0]) logo_cut(base_logo_height);
    }
}

// The puck light, simplified from its CAD model: a cylinder with a rounded
// top edge and a spherical dome. Bottom on z = 0.
module puck() {
    dome_r = puck_dome_d / 2;
    dome_h = puck_height - puck_edge_height;
    sphere_r = (dome_r * dome_r + dome_h * dome_h) / (2 * dome_h);
    rotate_extrude() {
        square([puck_r, puck_edge_height - puck_edge_radius]);
        square([puck_r - puck_edge_radius, puck_edge_height]);
        translate([puck_r - puck_edge_radius, puck_edge_height - puck_edge_radius]) circle(puck_edge_radius);
        intersection() {
            translate([0, puck_height - sphere_r]) circle(sphere_r);
            translate([0, puck_edge_height - eps]) square([dome_r, dome_h + eps]);
        }
    }
}

// The logo, height tall and centred on the origin, to cut logo_depth deep
// into a face on z = 0 from above. It reads from +z with its rib towards +y.
module logo_cut(height)
    translate([0, 0, -logo_depth]) linear_extrude(logo_depth + 1) logo(height);

function logo_arc(centre, radius, from, to, steps = 96) =
    [for (i = [0:steps]) let(a = from + (to - from) * i / steps)
        [centre[0] + radius * cos(a), centre[1] + radius * sin(a)]];

// The flat TraceTrove logo V3, centred, with its rib towards +y. This is the outline
// of logo_final_flat in branding/LOGO_V3/tracetrove_logo.scad, copied so this file
// still needs no libraries.
module logo(height) {
    a = atan2(7.5, 10);
    scale(height / (2 * logo_tip_y))
        translate([-7.5, 0])
            difference() {
                polygon(concat(logo_arc([0, 0], 17.5, -60, 60),
                               [[7.5, logo_tip_y]],
                               logo_arc([15, 0], 17.5, 120, 240),
                               [[7.5, -logo_tip_y]]));
                polygon(concat(logo_arc([0, 0], 12.5, a - 90, a),
                               logo_arc([-2.5, 7.5], 12.5, 0, -a),
                               logo_arc([17.5, 7.5], 12.5, 180 + a, 180),
                               logo_arc([15, 0], 12.5, 180 - a, 270 - a)));
            }
}

// The holder's thread: 45 degree flanks, as in fdm_optimized_screws. Major
// diameter d from z = 0 to h: the screw's thread, and, with the clearance
// added, the shape cut for the top part's. render() keeps the preview working
// with this many threads.
module threaded_rod(d, h) {
    r_root = d / 2 - thread_depth;
    render(convexity = 4) intersection() {
        union() {
            cylinder(r = r_root + eps, h = h);
            thread_ridge(r_root, -thread_pitch, h + thread_pitch, thread_pitch, thread_depth,
                         thread_tip, 45);
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
