// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Holder for an RGBW puck light (62 mm KC007), after the working Onshape
// model in onshape_model. The puck lies loose in a square top part, on the
// floor of a ring that screws into the top part from below. Its dome pokes
// up through a round window, just under a cross of thin ribs. The holder sits
// on a click base: four pins guide it, and a disc reaches up through the
// ring's opening and lifts the puck until the dome touches the ribs. Pressing
// the holder down onto the base presses the dome against the ribs: click,
// the light changes. A bar across the ring's opening turns the ring; the
// disc has a slot for it.
//
// Print every part standing as it is used, bottom on the bed: the ribs
// bridge the window, the cavity's shoulder is 45 degrees, and the threads
// have 45 degree flanks, as in fdm_optimized_screws, so nothing needs
// support. The VeryOS logo is engraved in the front of the top part, in the
// bottom of the screw ring and in the top of the click base's disc.
// Origin: centre of the top part's bottom face, which is also the ring's
// bottom face when it is screwed in flush.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on bed,assembly:Assembly on the click base,section:Assembly cut in half,toppart:Top part,bottom_screw:Bottom screw,clickbase:Click base]

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
// Gap between the dome and the ribs while the puck lies on the bottom
// screw's floor: how far the puck can move inside the holder.
puck_play = 0.7;

/* [Top part] */
// Round window over the dome.
window_d = 50;
// Thinnest side wall of the square body, beside the bottom screw.
wall = 2.25;
// Between the cavity's ceiling and the top; the window's edge has a 45
// degree chamfer through it.
top_thickness = 1;
rib_width = 1;
// Height of the ribs above the point where they touch the dome.
rib_height = 1.4;
// The ribs' underside is flat over this diameter and slopes down to the
// window's edge outside it.
rib_contact_d = 30;

/* [Bottom screw] */
screw_height = 10.4;
// Threaded part at the top; the rest is a wider flange.
screw_thread_length = 3.5;
// Floor under the puck. Also the height of the bar you turn the screw with.
lip_height = 5;
bar_width = 2;
// Wall between the puck and the thread's root.
screw_wall = 1.2;
// 2 mm prints best (fdm_optimized_screws).
thread_pitch = 2;
// Radial gap between the threads.
thread_clearance = 0.25;
// The screw turns this much deeper than flush, so its bar can be lined up
// with the click base's slot. Keep it below puck_play, or the screw clamps
// the puck when turned in all the way.
seat_gap = 0.6;

/* [Click base] */
base_thickness = 2;
// Disc that lifts the puck through the bottom screw's opening.
press_d = 50;
// How far the disc reaches above the bottom screw's floor when the holder is
// pressed down onto the base. Must exceed puck_play; the rest is how far it
// pushes the button. The puck's bottom is 0.2 mm hollow inside its foot
// ring, where the disc pushes, so 1.6 pushes the button 0.7 mm, as in the
// Onshape model.
press_height = 1.6;
// Radial gap between the disc and the bottom screw's opening, and on each
// side of the bar in the disc's slot.
slide_clearance = 1;
pin_d = 5;
pin_height = 5;
// Radial gap of the pins in their holes.
pin_clearance = 0.3;

/* [Logo] */
// In the front of the top part.
toppart_logo_width = 20;
// In the bottom of the screw's flange, beside the bar.
screw_logo_width = 8;
// In the top of the click base's disc.
base_logo_width = 18;
logo_depth = 1;

/* [Quality] */
$fn = 128;

/* [Hidden] */
eps = 0.01;
layout_gap = 5;
puck_r = puck_d / 2;
thread_depth = 0.4 * thread_pitch;
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
// top part, 0.5 mm wider than the flange.
flange_h = screw_height - screw_thread_length;
flange_r = hole_d / 2 + 1.5;
recess_r = flange_r + 0.5;
recess_top = flange_h + seat_gap;
half = recess_r + wall;
body_w = 2 * half;
// Gap between the cavity and the puck at its highest, pushed up by the disc.
cavity_gap = 0.5;
lift_z = lip_height + press_height;
ceiling_z = lift_z + puck_edge_height + cavity_gap;
top_z = ceiling_z + top_thickness;
// The cavity's shoulder is the 45 degree cone r + z = shoulder_c, cavity_gap
// off the puck's rounded edge. It starts at the top of the thread and ends
// on the ceiling.
shoulder_c = (puck_r - puck_edge_radius) + (lift_z + puck_edge_height - puck_edge_radius)
           + (puck_edge_radius + cavity_gap) * sqrt(2);
shoulder_z = shoulder_c - hole_minor_r;
ceiling_r = shoulder_c - ceiling_z;
window_r = window_d / 2;
// The ribs' underside in the middle, puck_play above the puck lying on the
// floor.
touch_z = lip_height + puck_height + puck_play;
rib_top = touch_z + rib_height;
// The ribs end over the recess wall. Beside the window they stand on 45
// degree feet.
rib_r = recess_r;
foot_w = rib_width + 2 * (touch_z - top_z);
// Height of the disc above the base's plate, and the slot in it for the bar.
disc_h = lip_height + press_height;
slot_w = bar_width + 2 * slide_clearance;
// Pins in the corners: the centre of the largest circle between two sides
// and the recess, so the hole's wall is as thick to both.
pin_pos = half - (half * sqrt(2) - recess_r) / (sqrt(2) + 1);
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
// The screw's logo sits in the middle of the flange's bottom ring, the
// base's between the slot's chamfer and the disc's top edge.
screw_logo_x = (opening_r + flange_r) / 2;
base_logo_x = (slot_w / 2 + 1 + press_r - 1) / 2;

assert(seat_gap < puck_play, "seat_gap must stay below puck_play, or the bottom screw clamps the puck.");
assert(press_height > puck_play, "press_height must exceed puck_play, or the base never pushes the button.");
assert(window_d > puck_dome_d, "The window must be wider than the dome.");
assert(window_r <= ceiling_r, "window_d is too wide for the cavity's shoulder.");
assert(touch_z > top_z, "The dome does not reach above the top part.");
assert(rib_contact_d < window_d, "rib_contact_d must be smaller than window_d.");
assert(screw_thread_length < screw_height, "screw_thread_length must be shorter than screw_height.");
assert(shoulder_z >= screw_height + seat_gap, "The cavity's shoulder starts below the bottom screw's top.");
assert(bore_r - opening_r >= 2, "press_d is too large: the bottom screw's floor must be at least 2 mm wide.");
assert(logo_h(toppart_logo_width) + 2 <= top_z - recess_top && toppart_logo_width + 10 <= body_w,
       "The top part's logo is too large; lower toppart_logo_width.");
assert(logo_h(screw_logo_width) + 2 <= flange_r - opening_r,
       "The screw's logo is wider than its flange; lower screw_logo_width.");
assert(norm([base_logo_x + logo_h(base_logo_width) / 2, base_logo_width / 2]) <= press_r - 1.5
       && base_logo_x - logo_h(base_logo_width) / 2 >= slot_w / 2 + 1.5,
       "The base's logo does not fit on the disc; lower base_logo_width.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "toppart") toppart();
else if (part == "bottom_screw") bottom_screw();
else if (part == "clickbase") clickbase();

// Released: the holder rests on the dome, which touches the ribs, and the
// puck lies on the disc, so the holder floats press_height - puck_play above
// the base. Pressing it down that far clicks the light. The puck is a ghost.
module assembly() {
    translate([0, 0, -base_thickness]) color("silver") clickbase();
    translate([0, 0, press_height - puck_play]) {
        color("lightskyblue") toppart();
        color("gold") bottom_screw();
        %translate([0, 0, lip_height + puck_play]) puck();
    }
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    translate([0, 0, -base_thickness]) color("silver") front_cut() clickbase();
    translate([0, 0, press_height - puck_play]) {
        color("lightskyblue") front_cut() toppart();
        color("gold") front_cut() bottom_screw();
        color("white") front_cut() translate([0, 0, lip_height + puck_play]) puck();
    }
}

// Cuts away the half in front of y = 0, rendered so it keeps its colour.
module front_cut()
    render() difference() {
        children();
        translate([-body_w, -2 * body_w, -body_w]) cube(2 * body_w);
    }

// Every part standing as it is used, side by side.
module print_layout() {
    toppart();
    translate([body_w + layout_gap, 0, 0]) clickbase();
    translate([0, -(half + layout_gap + flange_r), 0]) bottom_screw();
}

// Square body with the cavity, the internal thread, the pin holes and the
// cross of ribs over the window.
module toppart() {
    difference() {
        translate([-half, -half, 0]) cube([body_w, body_w, top_z]);
        rotate_extrude() polygon([
            [0, -1], [recess_r, -1], [recess_r, recess_top], [hole_minor_r, recess_top],
            [hole_minor_r, shoulder_z], [ceiling_r, ceiling_z], [window_r, ceiling_z],
            [window_r + top_thickness + 1, top_z + 1], [0, top_z + 1]]);
        // From z = 0 like the screw's thread, so the bar lies along y when
        // the screw is flush.
        threaded_rod(hole_d, shoulder_z);
        for (x = [-1, 1], y = [-1, 1]) translate([x * pin_pos, y * pin_pos, -1])
            cylinder(d = pin_d + 2 * pin_clearance, h = pin_height + 1.5);
        translate([0, -half, (recess_top + top_z) / 2]) rotate([90, 0, 0])
            logo_cut(toppart_logo_width);
    }
    for (a = [0, 90]) rotate(a) rib();
}

// A rib along x across the window. Its underside rises from the window's
// edge to touch_z and is flat over rib_contact_d, where the dome touches.
// Beside the window it stands on 45 degree feet.
module rib() {
    c = rib_contact_d / 2;
    rotate([90, 0, 0]) linear_extrude(rib_width, center = true) polygon([
        [-rib_r, top_z - eps], [-window_r, top_z - eps], [-c, touch_z], [c, touch_z],
        [window_r, top_z - eps], [rib_r, top_z - eps], [rib_r, rib_top], [-rib_r, rib_top]]);
    foot_start = window_r + top_thickness;
    for (m = [0, 1]) mirror([m, 0, 0])
        translate([foot_start, 0, 0]) rotate([90, 0, 90]) linear_extrude(rib_r - foot_start)
            polygon([[-foot_w / 2, top_z - eps], [foot_w / 2, top_z - eps],
                     [rib_width / 2, touch_z], [-rib_width / 2, touch_z]]);
}

// Ring with a flange at the bottom and the thread above it. The puck lies on
// its floor; the bar across the opening turns it.
module bottom_screw() {
    difference() {
        union() {
            cylinder(r = flange_r, h = flange_h);
            intersection() {
                threaded_rod(screw_d, screw_height);
                // 45 degree chamfer at the top eases the start into the thread.
                cylinder(h = screw_height, r1 = screw_d / 2 - thread_depth + screw_height,
                         r2 = screw_d / 2 - thread_depth);
            }
        }
        translate([0, 0, lip_height]) cylinder(r = bore_r, h = screw_height);
        translate([0, 0, -1]) cylinder(r = opening_r, h = lip_height + 2);
        // Reads from below, its top pointing outwards.
        translate([screw_logo_x, 0, 0]) rotate(-90) rotate([0, 180, 0]) logo_cut(screw_logo_width);
    }
    translate([-bar_width / 2, -opening_r - 1, 0]) cube([bar_width, 2 * opening_r + 2, lip_height]);
}

// Plate with the guide pins and the disc that lifts the puck, slotted for
// the bottom screw's bar. Bottom on z = 0.
module clickbase() {
    difference() {
        union() {
            translate([-half, -half, 0]) cube([body_w, body_w, base_thickness]);
            translate([0, 0, base_thickness - eps]) rotate_extrude()
                polygon([[0, 0], [press_r, 0], [press_r, disc_h - 1], [press_r - 1, disc_h + eps], [0, disc_h + eps]]);
            for (x = [-1, 1], y = [-1, 1]) translate([x * pin_pos, y * pin_pos, base_thickness - eps])
                rotate_extrude() polygon([[0, 0], [pin_d / 2, 0], [pin_d / 2, pin_height - 1],
                                          [pin_d / 2 - 1, pin_height + eps], [0, pin_height + eps]]);
        }
        // With 45 degree chamfers along the top, so the bar finds its way in.
        translate([0, 0, base_thickness]) rotate([90, 0, 0]) linear_extrude(press_d + 2, center = true)
            polygon([[-slot_w / 2, 0], [slot_w / 2, 0], [slot_w / 2, disc_h - 1], [slot_w / 2 + 2, disc_h + 1],
                     [-slot_w / 2 - 2, disc_h + 1], [-slot_w / 2, disc_h - 1]]);
        // Its top pointing outwards.
        translate([base_logo_x, 0, base_thickness + disc_h]) rotate(-90) logo_cut(base_logo_width);
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
                         0.05 * thread_pitch, 45);
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
