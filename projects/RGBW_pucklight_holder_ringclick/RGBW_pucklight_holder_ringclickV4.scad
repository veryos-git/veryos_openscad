// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V4: V3 with the click base's tube 0.4 higher (tube_raise). V3's printed
// base, 8.0 high, let the holder float only a little and barely click. The
// top part and the bottom screw are V3's.
// V3: V2 with a wider window, 36 instead of 34, for more light, and the
// click base's tube 0.2 higher, since V2's did not click reliably. The ring's
// underside rises to cavity_gap above the flat ring around the lens, pressed
// in; a lip inside the lens's rim reaches down to the window's edge.
// V2: V1 round and with as little material as it needs. The top part is a
// shell, wall thick all over, that follows the recess, the thread and the
// cavity's shoulder, narrowing at 45 degrees, so it still prints upside
// down. The click base is a round plate with a tube instead of the solid
// disc. The top part's logo is in its top face, the base's in its bottom.
// V1:../RGBW_pucklight_holder/RGBW_pucklight_holderV4.scad with a ring
// instead of the cross of ribs, so nothing crosses the light: the window is
// narrower than the lens, and its edge presses the lens all around near its
// rim. The top part prints upside down. No guiding pins: the disc in the
// bottom screw's opening and the bar in the disc's slot are enough, as in
// pucklight_sphere V2.
//
// Holder for an RGBW puck light (62 mm KC007). The puck lies loose in a
// round top part, on the floor of a ring that screws into the top part from
// below. Its lens pokes up through a round window, whose 45 degree edge sits
// just above the lens near its rim. The holder sits on a click base: a tube
// reaches up through the ring's opening and lifts the puck until the lens
// touches the window's edge. Pressing the holder down onto the base presses
// the lens in: click, the light changes. A bar across the ring's opening
// turns the ring; the tube has a slot for it.
//
// Print the top part upside down, its top face on the bed: the cavity
// narrows from the bottom face up to the window's edge, so every layer sits
// on the one below; the only overhang is the window's 45 degree chamfer.
// Print the bottom screw and the click base standing as they are used. The
// threads have 45 degree flanks, as in fdm_optimized_screws, so nothing needs
// support. The VeryOS logo is engraved in the top face of the top part, in
// the bottom of the screw ring and in the bottom of the click base.
// Origin: centre of the top part's bottom face, which is also the ring's
// bottom face when it is screwed in flush.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on bed,assembly:Assembly on the click base,section:Assembly cut in half,toppart:Top part,bottom_screw:Bottom screw,clickbase:Click base]

/* [Puck light] */
// The manufacturer's CAD model (../RGBW_pucklight_holder/rgbw_light_specs)
// measures 62 x 26.8 mm; the spec sheet says 62.2 x 27.6. The holders up to
// V4 were built around the CAD model and click.
puck_d = 62;
puck_height = 26.8;
// Height of the flat ring around the lens, at the top of the rounded edge.
puck_edge_height = 21;
puck_edge_radius = 7;
// The lens, a spherical cap on the flat ring. It is the button; it clicks
// wherever it is pressed.
puck_dome_d = 40;
// Radial gap around the puck in the bottom screw.
puck_clearance = 0.5;
// Gap between the lens and the window's edge while the puck lies on the
// bottom screw's floor: how far the puck can move inside the holder.
puck_play = 0.7;

/* [Top part] */
// Where the window's edge touches the lens. Larger lets more light through
// but narrows the lip that carries the edge, which must stay inside the
// lens's rim.
contact_d = 36;
// Thickness of the ring above the flat ring around the lens. The window
// widens at 45 degrees from its edge to the top face.
ring_thickness = 1.8;
// The round body's wall around the screw's recess, the thread and the
// cavity's shoulder: four 0.4 mm lines.
wall = 1.6;

/* [Bottom screw] */
screw_height = 10.4;
// Thread at the top that fully engages the top part's; below it a wider
// flange.
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
// Round plate under the holder, open inside the tube.
base_thickness = 1.2;
// Tube that lifts the puck through the bottom screw's opening.
press_d = 50;
press_wall = 2;
// How far the tube reaches above the bottom screw's floor when the holder is
// pressed down onto the base. Must exceed puck_play; the rest is how far it
// pushes the button. The puck's bottom is 0.2 mm hollow inside its foot
// ring, where the tube pushes, so 1.8 pushes the button 0.9 mm. V2's 1.6
// (0.7 mm, as in the Onshape model) did not click reliably. The top part's
// cavity is built for it.
press_height = 1.8;
// Raises only the tube: the real puck lifts less than its CAD model. With
// V3's 1.8 alone the holder floats only a little on the base and barely
// clicks (2026-11-11). Each 0.1 takes 0.1 off cavity_gap, so it stays below.
tube_raise = 0.4;
// Radial gap between the tube and the bottom screw's opening, and on each
// side of the bar in the tube's slot.
slide_clearance = 1;

/* [Logo] */
// In the top face of the top part, between the window and the edge.
toppart_logo_width = 9;
// In the bottom of the screw's flange, beside the bar.
screw_logo_width = 8;
// In the bottom of the click base's plate.
base_logo_width = 14;
logo_depth = 0.6;

/* [Quality] */
$fn = 128;

/* [Hidden] */
eps = 0.01;
layout_gap = 5;
puck_r = puck_d / 2;
dome_r = puck_dome_d / 2;
dome_h = puck_height - puck_edge_height;
sphere_r = (dome_r * dome_r + dome_h * dome_h) / (2 * dome_h);
// Height of the lens above the puck's bottom, at radius r.
function lens_z(r) = puck_height - sphere_r + sqrt(sphere_r * sphere_r - r * r);
thread_depth = 0.4 * thread_pitch;
// Inner wall of the bottom screw around the puck, and its opening for the
// tube.
bore_r = puck_r + puck_clearance;
press_r = press_d / 2;
opening_r = press_r + slide_clearance;
// Major diameters of the screw's thread and of the top part's.
screw_d = 2 * (bore_r + screw_wall + thread_depth);
hole_d = screw_d + 2 * thread_clearance;
hole_minor_r = hole_d / 2 - thread_depth;
// The flange below the screw's thread fills a recess in the bottom of the
// top part, 0.5 mm wider than the flange. Both narrow to the thread in a 45
// degree cone. The top part's cone reaches its thread's crests where
// screw_thread_length begins, the flange's lies seat_gap below it.
flange_r = hole_d / 2 + 1.5;
recess_r = flange_r + 0.5;
screw_root_r = screw_d / 2 - thread_depth;
thread_start = screw_height - screw_thread_length;
recess_top = thread_start - (recess_r - hole_minor_r);
flange_h = recess_r + recess_top - seat_gap - flange_r;
// Gap between the cavity and the puck at its highest, pushed up by the tube.
cavity_gap = 0.5;
lift_z = lip_height + press_height;
// The cavity's shoulder is the 45 degree cone r + z = shoulder_c, cavity_gap
// off the puck's rounded edge. It starts at the top of the thread and ends
// at the ring's flat underside.
shoulder_c = (puck_r - puck_edge_radius) + (lift_z + puck_edge_height - puck_edge_radius)
           + (puck_edge_radius + cavity_gap) * sqrt(2);
shoulder_z = shoulder_c - hole_minor_r;
// The window's edge, puck_play above the lens while the puck lies on the
// floor.
contact_r = contact_d / 2;
contact_z = lip_height + puck_play + lens_z(contact_r);
// The ring's flat underside, cavity_gap above the flat ring around the lens
// at the puck's highest. Inside the lens's rim a lip reaches down from it to
// the window's edge. The lip's outer side is the 45 degree cone r - z =
// lip_c, cavity_gap off the flat ring's inner edge while the puck lies
// puck_clearance off centre.
underside_z = lift_z + puck_edge_height + cavity_gap;
lip_c = (dome_r - puck_clearance) - (lift_z + puck_edge_height) - cavity_gap * sqrt(2);
top_z = underside_z + ring_thickness;
// The window's radius in the top face.
window_r = contact_r + top_z - contact_z;
// The body's outside, wall off the inside: a cylinder around the recess, a
// 45 degree cone parallel to the recess's, a cylinder around the thread and
// a 45 degree cone up to the top face, wall off the thread's top edge.
// Upside down, nothing overhangs more than 45 degrees.
outer_r = recess_r + wall;
thread_outer_r = hole_d / 2 + wall;
lower_cone_c = recess_r + recess_top + wall * sqrt(2);
upper_cone_c = hole_d / 2 + shoulder_z + wall * sqrt(2);
top_r = upper_cone_c - top_z;
body_d = 2 * outer_r;
// Height of the tube above the base's plate, and the slot in it for the bar.
tube_h = lip_height + press_height + tube_raise;
slot_w = bar_width + 2 * slide_clearance;
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
// The logos sit in the middle of the screw flange's bottom ring, of the top
// part's top face and of the base's plate.
screw_logo_x = (opening_r + flange_r) / 2;
toppart_logo_x = (window_r + top_r) / 2;
base_logo_x = (press_r - press_wall + outer_r) / 2;

assert(seat_gap < puck_play, "seat_gap must stay below puck_play, or the bottom screw clamps the puck.");
assert(press_height > puck_play, "press_height must exceed puck_play, or the base never pushes the button.");
assert(tube_raise < cavity_gap, "tube_raise must stay below cavity_gap, or the puck's housing reaches the ring when pressed.");
assert(lip_c + contact_z - contact_r >= 0.8,
       "contact_d is too large: the window's lip must stay inside the lens's rim, at least two 0.4 mm lines wide.");
assert(flange_h >= 1, "screw_thread_length is too long for screw_height: no flange left below the thread.");
assert(shoulder_z >= screw_height + seat_gap, "The cavity's shoulder starts below the bottom screw's top.");
assert(bore_r - opening_r >= 2, "press_d is too large: the bottom screw's floor must be at least 2 mm wide.");
assert(press_wall > 1, "press_wall must exceed the 1 mm chamfer at the tube's top.");
assert(norm([toppart_logo_x + logo_h(toppart_logo_width) / 2, toppart_logo_width / 2]) <= top_r - 0.5
       && toppart_logo_x - logo_h(toppart_logo_width) / 2 >= window_r + 0.5,
       "The top part's logo does not fit on its top face; lower toppart_logo_width.");
assert(logo_h(screw_logo_width) + 2 <= flange_r - opening_r,
       "The screw's logo is wider than its flange; lower screw_logo_width.");
assert(norm([base_logo_x + logo_h(base_logo_width) / 2, base_logo_width / 2]) <= outer_r - 0.5
       && base_logo_x - logo_h(base_logo_width) / 2 >= press_r - press_wall + 0.5,
       "The base's logo does not fit on its plate; lower base_logo_width.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "toppart") toppart();
else if (part == "bottom_screw") bottom_screw();
else if (part == "clickbase") clickbase();

// Released: the holder rests on the lens, which touches the window's edge,
// and the puck lies on the tube, so the holder floats press_height +
// tube_raise - puck_play above the base. Pressing it down that far clicks
// the light. The puck is a ghost.
module assembly() {
    translate([0, 0, -base_thickness]) color("silver") clickbase();
    translate([0, 0, press_height + tube_raise - puck_play]) {
        color("lightskyblue") toppart();
        color("gold") bottom_screw();
        %translate([0, 0, lip_height + puck_play]) puck();
    }
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    translate([0, 0, -base_thickness]) color("silver") front_cut() clickbase();
    translate([0, 0, press_height + tube_raise - puck_play]) {
        color("lightskyblue") front_cut() toppart();
        color("gold") front_cut() bottom_screw();
        color("white") front_cut() translate([0, 0, lip_height + puck_play]) puck();
    }
}

// Cuts away the half in front of y = 0, rendered so it keeps its colour.
module front_cut()
    render() difference() {
        children();
        translate([-body_d, -2 * body_d, -body_d]) cube(2 * body_d);
    }

// Every part as it prints, side by side: the top part upside down, the
// others standing as they are used.
module print_layout() {
    translate([0, 0, top_z]) rotate([180, 0, 0]) toppart();
    translate([body_d + layout_gap, 0, 0]) clickbase();
    translate([0, -(outer_r + layout_gap + flange_r), 0]) bottom_screw();
}

// Round shell with the cavity, the internal thread and the window. The
// cavity's shoulder runs up to the ring's flat underside, the lip down to
// the window's edge, which presses the lens; the window widens at 45 degrees
// from its edge to the top face.
module toppart() {
    difference() {
        rotate_extrude() polygon([
            [0, 0], [outer_r, 0], [outer_r, lower_cone_c - outer_r],
            [thread_outer_r, lower_cone_c - thread_outer_r], [thread_outer_r, upper_cone_c - thread_outer_r],
            [top_r, top_z], [0, top_z]]);
        rotate_extrude() polygon([
            [0, -1], [recess_r, -1], [recess_r, recess_top], [hole_minor_r, thread_start],
            [hole_minor_r, shoulder_z], [shoulder_c - underside_z, underside_z],
            [lip_c + underside_z, underside_z], [lip_c + contact_z, contact_z], [contact_r, contact_z],
            [contact_r + top_z + 1 - contact_z, top_z + 1], [0, top_z + 1]]);
        // From z = 0 like the screw's thread, so the bar lies along y when
        // the screw is flush.
        threaded_rod(hole_d, shoulder_z);
        // Its top pointing outwards.
        translate([toppart_logo_x, 0, top_z]) rotate(-90) logo_cut(toppart_logo_width);
    }
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
        translate([0, 0, lip_height]) cylinder(r = bore_r, h = screw_height);
        translate([0, 0, -1]) cylinder(r = opening_r, h = lip_height + 2);
        // Reads from below, its top pointing outwards.
        translate([screw_logo_x, 0, 0]) rotate(-90) rotate([0, 180, 0]) logo_cut(screw_logo_width);
    }
    translate([-bar_width / 2, -opening_r - 1, 0]) cube([bar_width, 2 * opening_r + 2, lip_height]);
}

// Round plate under the holder with the tube that lifts the puck, slotted
// for the bottom screw's bar. Both are open inside. Bottom on z = 0.
module clickbase() {
    difference() {
        rotate_extrude() polygon([
            [press_r - press_wall, 0], [outer_r, 0], [outer_r, base_thickness], [press_r, base_thickness],
            [press_r, base_thickness + tube_h - 1], [press_r - 1, base_thickness + tube_h],
            [press_r - press_wall, base_thickness + tube_h]]);
        // With 45 degree chamfers along the top, so the bar finds its way in.
        translate([0, 0, base_thickness]) rotate([90, 0, 0]) linear_extrude(press_d + 2, center = true)
            polygon([[-slot_w / 2, 0], [slot_w / 2, 0], [slot_w / 2, tube_h - 1], [slot_w / 2 + 2, tube_h + 1],
                     [-slot_w / 2 - 2, tube_h + 1], [-slot_w / 2, tube_h - 1]]);
        // In the bottom, on the desk. Reads from below, its top pointing
        // outwards.
        translate([base_logo_x, 0, 0]) rotate(-90) rotate([0, 180, 0]) logo_cut(base_logo_width);
    }
}

// The puck light, simplified from its CAD model: a cylinder with a rounded
// top edge and a spherical lens. Bottom on z = 0.
module puck() {
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
