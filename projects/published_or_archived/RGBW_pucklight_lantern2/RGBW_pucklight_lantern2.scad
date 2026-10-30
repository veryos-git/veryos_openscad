// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Lantern for an RGBW puck light (62 mm KC007), after the Onshape model in
// source/lantern_onshape_export.
//
// The light's mount is the holder from ../RGBW_pucklight_holder, derived as
// in the Onshape model: the holder's top part is the bottom of the frame, its
// bottom screw is the screw-in and its click base is the click base. The
// holder's code is copied from RGBW_pucklight_holderV2.scad, so this file
// works on its own; changes to the holder project do not reach it. The puck
// lies loose in the top part, on the floor of the screw-in, its dome under a
// cross of ribs. The click base's disc reaches up through the screw-in and
// lifts the puck; pressing the lantern down onto the click base presses the
// dome against the ribs: click, the light changes.
//
// From the top part the frame widens upwards, 76 mm square at the bottom and
// 100 mm at the top, with a pillar in each corner. The side windows slide
// down into slits in the pillars from the top and stand in a groove in the
// top part. The roof covers the slits: it screws onto a ring on top of the
// frame. Its faces are concave, slotted, and meet in a finial.
//
// Print every part standing as it is used, the windows lying flat. Nothing
// needs support: under the frame's top and inside the roof the overhangs are
// 45 degrees, the threads have 45 degree flanks, as in fdm_optimized_screws,
// and the holder's ribs bridge its window. The VeryOS logo is engraved in
// every part.
// Origin: centre of the frame's bottom face, which is the holder's.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "assembly"; // [assembly:Assembly on the click base,section:Assembly cut in half,print_layout:All parts on bed,frame:Frame,roof:Roof,screwin:Screw-in,clickbase:Click base,window:Window]

/* [Frame] */
// Height of the frame above the holder, up to its top face, on which the roof
// sits.
frame_height = 90;
// Width at the top face. At the bottom the frame is as wide as the holder.
frame_top_w = 100;
// The pillars' wall, from the outside in: the lip in front of the window, the
// window's slit, and the lip behind it.
frame_lip = 1.2;
window_slit = 3;
frame_inner_lip = 2;
// Measured along a face from the corner: the end of the pillar (of the lip
// behind the window), the edge of the window opening in the lip in front
// (bevelled 45 degrees, so it widens outwards) and the end of the slit.
pillar_width = 8.6;
pillar_face = 6.9;
slit_end = 5.6;
// Depth of the groove in the holder's top in which the windows stand.
window_seat = 1;

/* [Roof] */
// Thread of the ring on top of the frame, which the roof screws onto. Its
// pitch is the holder's thread_pitch.
roof_thread_d = 90;
roof_thread_h = 5;
// Between the ring's bore and the thread's root.
ring_wall = 2.2;
// Radial gap between the threads.
roof_thread_clearance = 0.3;
// The band at the bottom of the roof continues the frame's taper.
roof_rim_h = 10;
// The faces are concave circular arcs from the top of the band to the tip.
roof_rise = 59.6;
roof_curve_r = 101.4;
roof_thickness = 1.8;
// A ball on a 45 degree cone, its centre this far above the tip.
finial_d = 12;
finial_z = 2.3;
// Slots through the faces, at right angles to the eaves in plan.
slot_width = 2;
slot_pitch = 3.6;
// Left solid down the middle of each face and along the hips.
center_rib = 5;
hip_rib = 2.5;
// Along the eaves the slots are short: their distance from the eave, their
// length, and the bar between them and the long slots.
eave_margin = 3.9;
dash_length = 1;
eave_bar_width = 1.4;

/* [Window] */
// Printed in clear or white filament, or cut from sheet as thick as the slit
// allows.
window_thickness = 2.6;
// Gap at each side and at the top.
window_clearance = 0.15;

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

/* [Holder top part] */
// Round window over the dome.
window_d = 50;
// Thinnest side wall of the square body, beside the bottom screw.
wall = 2.25;
// Between the cavity's ceiling and the top; the window's edge has a 45
// degree chamfer through it.
top_thickness = 1;
rib_width = 2;
// Height of the ribs above the point where they touch the dome.
rib_height = 2;
// The ribs' underside is flat over this diameter and slopes down to the
// window's edge outside it.
rib_contact_d = 30;

/* [Screw-in] */
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
// In the front of the holder, at the bottom of the frame.
toppart_logo_width = 20;
// In the bottom of the screw's flange, beside the bar.
screw_logo_width = 8;
// In the top of the click base's disc.
base_logo_width = 18;
// In the front of the roof's band.
roof_logo_width = 9;
// In each window, above the holder.
window_logo_width = 16;
logo_depth = 1;

/* [Quality] */
$fn = 128;

/* [Hidden] */
eps = 0.01;
layout_gap = 10;

// The holder, from RGBW_pucklight_holderV2.scad.
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
// top part, 0.5 mm wider than the flange. Both narrow to the thread in a 45
// degree cone; a flat step would overhang in the top part. The top part's
// cone reaches its thread's crests where screw_thread_length begins, the
// flange's lies seat_gap below it.
flange_r = hole_d / 2 + 1.5;
recess_r = flange_r + 0.5;
screw_root_r = screw_d / 2 - thread_depth;
thread_start = screw_height - screw_thread_length;
recess_top = thread_start - (recess_r - hole_minor_r);
flange_h = recess_r + recess_top - seat_gap - flange_r;
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

// The lantern. The frame stands on the holder's top at z0; z1 is its top
// face.
z0 = top_z;
z1 = z0 + frame_height;
bottom_half = half;
top_half = frame_top_w / 2;
taper = (top_half - bottom_half) / frame_height;
tilt = atan(taper);
// Half the frame's width at height z, also beyond its ends.
function half_at(z) = bottom_half + taper * (z - z0);
frame_wall = frame_lip + window_slit + frame_inner_lip;
// The slits' inner face.
function slit_in(z) = half_at(z) - frame_lip - window_slit;
ring_root_r = roof_thread_d / 2 - thread_depth;
ring_bore_r = ring_root_r - ring_wall;
// The roof, from its bottom face. Its thread reaches 0.5 mm above the ring.
roof_bore_d = roof_thread_d + 2 * roof_thread_clearance;
roof_bore_h = roof_thread_h + 0.5;
eave_half = top_half + taper * roof_rim_h;
tip_z = roof_rim_h + roof_rise;
// Centre of the faces' arc, through the eave and the tip, outside the roof.
roof_chord = sqrt(pow(eave_half, 2) + pow(roof_rise, 2));
arc_c = [eave_half / 2, roof_rim_h + roof_rise / 2]
      + sqrt(pow(roof_curve_r, 2) - pow(roof_chord, 2) / 4) / roof_chord * [roof_rise, eave_half];
inner_r = roof_curve_r + roof_thickness;
// The roof's cavity narrows at 45 degrees from the thread, along u + z =
// cavity_line with u the distance from the axis across a face, up to the
// point where the inner arc gets steeper than that.
steep = arc_c - inner_r / sqrt(2) * [1, 1];
cavity_line = steep[0] + steep[1];
// Angles of the arcs' ends, seen from their centre.
eave_a = atan2(roof_rim_h - arc_c[1], eave_half - arc_c[0]);
function axis_a(r) = -180 + acos(arc_c[0] / r);
arc_n = $fn / 4;
// The windows lean with the frame, so their edges' outer corners are the
// lowest. They stand on the groove's floor at window_z and end
// window_clearance below the top face. Their width follows the slits along
// their outer face.
window_z = z0 - window_seat;
window_len = (z1 - window_clearance - window_z - window_thickness * sin(tilt)) / cos(tilt);
function window_half(z) = half_at(z) - slit_end - window_clearance;

assert(seat_gap < puck_play, "seat_gap must stay below puck_play, or the bottom screw clamps the puck.");
assert(press_height > puck_play, "press_height must exceed puck_play, or the base never pushes the button.");
assert(window_d > puck_dome_d, "The window must be wider than the dome.");
assert(window_r <= ceiling_r, "window_d is too wide for the cavity's shoulder.");
assert(touch_z > top_z, "The dome does not reach above the top part.");
assert(rib_contact_d < window_d, "rib_contact_d must be smaller than window_d.");
assert(flange_h >= 1, "screw_thread_length is too long for screw_height: no flange left below the thread.");
assert(shoulder_z >= screw_height + seat_gap, "The cavity's shoulder starts below the bottom screw's top.");
assert(bore_r - opening_r >= 2, "press_d is too large: the bottom screw's floor must be at least 2 mm wide.");
assert(logo_h(toppart_logo_width) + 2 <= top_z - recess_top && toppart_logo_width + 10 <= body_w,
       "The top part's logo is too large; lower toppart_logo_width.");
assert(logo_h(screw_logo_width) + 2 <= flange_r - opening_r,
       "The screw's logo is wider than its flange; lower screw_logo_width.");
assert(norm([base_logo_x + logo_h(base_logo_width) / 2, base_logo_width / 2]) <= press_r - 1.5
       && base_logo_x - logo_h(base_logo_width) / 2 >= slot_w / 2 + 1.5,
       "The base's logo does not fit on the disc; lower base_logo_width.");
assert(slit_end < pillar_face && pillar_face + frame_lip <= pillar_width,
       "The lips must overlap the window's edge: slit_end < pillar_face <= pillar_width - frame_lip.");
assert(window_thickness < window_slit * cos(tilt), "window_thickness is too thick for window_slit.");
assert(slit_in(window_z) + window_z >= shoulder_c + 1, "The windows' groove reaches into the holder's cavity.");
assert(roof_thread_d / 2 < slit_in(z1), "The roof's thread ring reaches into the window slits; lower roof_thread_d.");
assert(top_half - roof_bore_d / 2 >= 3, "The roof's band is too thin around its thread; lower roof_thread_d.");
assert(steep[1] >= roof_rim_h && steep[0] > 0,
       "The roof's faces must be flatter than 45 degrees at the eave and steeper at the tip; change roof_curve_r.");
assert(cavity_line - roof_bore_h >= roof_bore_d / 2,
       "The roof's cavity does not clear its thread; raise roof_rim_h or lower roof_thread_h.");
assert(logo_h(roof_logo_width) + 2 <= roof_rim_h, "The roof's logo does not fit its band; lower roof_logo_width.");

if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "print_layout") print_layout();
else if (part == "frame") frame();
else if (part == "roof") roof();
else if (part == "screwin") bottom_screw();
else if (part == "clickbase") clickbase();
else if (part == "window") window();

// The lantern pressed down onto its click base, as when it clicks. The puck
// is a ghost.
module assembly() {
    translate([0, 0, -base_thickness]) color("silver") clickbase();
    color("lightskyblue") frame();
    color("gold") bottom_screw();
    translate([0, 0, z1]) color("darkorange") roof();
    color("white", 0.5) windows();
    %translate([0, 0, lift_z]) puck();
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    translate([0, 0, -base_thickness]) color("silver") front_cut() clickbase();
    color("lightskyblue") front_cut() frame();
    color("gold") front_cut() bottom_screw();
    translate([0, 0, z1]) color("darkorange") front_cut() roof();
    color("white") front_cut() windows();
    color("ivory") front_cut() translate([0, 0, lift_z]) puck();
}

// Cuts away the half in front of y = 0, rendered so it keeps its colour.
module front_cut()
    render() difference() {
        children();
        translate([-2 * frame_top_w, -2 * frame_top_w, -frame_top_w]) cube(4 * frame_top_w * [1, 0.5, 1]);
    }

// Every part as printed: the frame, roof, screw-in and click base standing,
// the windows lying flat. A catalogue, not one build plate.
module print_layout() {
    frame();
    translate([top_half + layout_gap + eave_half, 0, 0]) roof();
    translate([0, -(top_half + layout_gap + bottom_half), 0]) {
        clickbase();
        translate([body_w + layout_gap, 0, 0]) bottom_screw();
    }
    for (i = [0:3])
        translate([(i - 1.5) * (2 * top_half + layout_gap),
                   -(top_half + body_w + 2 * layout_gap + window_len), 0]) window();
}

// The holder's top part with the frame on it: the corner pillars and the top
// with the ring for the roof. The slits go through all of it, into the top
// part's top and the ends of its ribs.
module frame() {
    difference() {
        union() {
            toppart();
            for (a = [0:90:270]) rotate(a) pillar();
            top();
        }
        for (a = [0:90:270]) rotate(a) slit();
    }
}

// The pillar in the corner at +x +y. Its section moves out along the
// diagonal with the frame's sides.
module pillar()
    multmatrix([[1, 0, taper, 0], [0, 1, taper, 0], [0, 0, 1, z0], [0, 0, 0, 1]])
        linear_extrude(frame_height) pillar_section();

// The pillar's section at the bottom of the frame: a strip along each face,
// less the slits and the window openings in the lips in front.
module pillar_section() {
    h = bottom_half;
    difference() {
        for (m = [0, 1]) mirror([m, -m, 0])
            translate([h - pillar_width, h - frame_wall]) square([pillar_width, frame_wall]);
        for (m = [0, 1]) mirror([m, -m, 0]) {
            translate([-h, h - frame_lip - window_slit]) square([2 * h - slit_end, window_slit]);
            polygon([[-h, h - frame_lip], [h - pillar_face - frame_lip, h - frame_lip],
                     [h - pillar_face + 1, h + 1], [-h, h + 1]]);
        }
    }
}

// The slit for the window in the face at +y, from the groove in the holder's
// top to above the top face.
module slit()
    hull() for (z = [window_z, z1 + 1]) translate([0, 0, z]) linear_extrude(eps)
        translate([-(half_at(z) - slit_end), slit_in(z)])
            square([2 * (half_at(z) - slit_end), window_slit]);

// The top of the frame inside the windows, with the ring that the roof
// screws onto, and through both the ring's bore. Below the top face the bore
// widens at 45 degrees down to the pillars, so the top prints without
// support. Seen through a window this funnel is an arch.
module top() {
    depth = top_half * sqrt(2) + 1 - ring_bore_r;
    difference() {
        union() {
            intersection() {
                hull() for (z = [z0, z1 + 1]) translate([0, 0, z]) linear_extrude(eps)
                    square(2 * slit_in(z), center = true);
                // Mirrored, so its top is exactly on z1 like the pillars'.
                translate([0, 0, z1]) mirror([0, 0, 1]) cylinder(h = depth, r = ring_bore_r + depth);
            }
            ring();
        }
        rotate_extrude() polygon([[0, z1 - depth - 1], [ring_bore_r + depth + 1, z1 - depth - 1],
                                  [ring_bore_r, z1], [ring_bore_r, z1 + roof_thread_h + 1],
                                  [0, z1 + roof_thread_h + 1]]);
    }
}

// The ring, without its bore. Its thread is in phase with the top face, as
// the roof's is with its bottom face, so the roof's sides line up with the
// frame's when it is screwed down. It starts a pitch lower, inside the top.
module ring()
    translate([0, 0, z1 - thread_pitch]) intersection() {
        threaded_rod(roof_thread_d, roof_thread_h + thread_pitch);
        // 45 degree chamfer at the top eases the start into the roof.
        cylinder(h = roof_thread_h + thread_pitch, r1 = ring_root_r + roof_thread_h + thread_pitch,
                 r2 = ring_root_r);
    }

// The four windows in their slits.
module windows()
    for (a = [0:90:270]) rotate(a)
        multmatrix([[1, 0, 0, 0],
                    [0, sin(tilt), -cos(tilt), slit_in(window_z) + window_slit / 2],
                    [0, cos(tilt), sin(tilt), window_z],
                    [0, 0, 0, 1]])
            translate([0, window_thickness / 2 * tan(tilt), -window_thickness / 2]) window();

// A side window as printed, its bottom edge on y = 0. It narrows towards the
// bottom like the frame.
module window() {
    bottom = window_half(window_z);
    top = window_half(window_z + window_len * cos(tilt));
    difference() {
        linear_extrude(window_thickness)
            polygon([[-bottom, 0], [bottom, 0], [top, window_len], [-top, window_len]]);
        translate([0, window_seat + 8 + logo_h(window_logo_width) / 2, window_thickness])
            logo_cut(window_logo_width);
    }
}

// The roof, origin at the centre of its bottom face: the band, the faces and
// the finial, hollow, with the thread inside the band and the slots.
module roof() {
    difference() {
        square_sweep() roof_profile();
        // Starts on the bottom face like the ring's thread.
        translate([0, 0, -thread_pitch]) threaded_rod(roof_bore_d, roof_bore_h + thread_pitch);
        square_sweep() cavity_profile();
        for (a = [0:90:270]) rotate(a)
            translate([0, 0, roof_bore_h]) linear_extrude(tip_z) face_slots();
        // On the band's front face, which leans out like the frame's.
        translate([0, -(top_half + taper * roof_rim_h / 2), roof_rim_h / 2])
            rotate([tilt, 0, 0]) rotate([90, 0, 0]) logo_cut(roof_logo_width);
    }
}

// The solid whose horizontal sections are squares as wide as the 2D profile
// (symmetric about x = 0, y up) at that height: the profile swept along a
// square, as in the Onshape model.
module square_sweep() {
    l = 2 * eave_half + 2;
    intersection() {
        rotate([90, 0, 0]) linear_extrude(l, center = true) children();
        rotate([90, 0, 90]) linear_extrude(l, center = true) children();
    }
}

// The roof's section through its middle: the band, the faces' arcs to the
// tip, and the finial.
module roof_profile() {
    polygon(mirrored(concat([[top_half, 0]],
        arc(arc_c, roof_curve_r, eave_a, axis_a(roof_curve_r)))));
    hull() {
        translate([0, tip_z + finial_z]) circle(d = finial_d);
        translate([0, tip_z + finial_z - finial_d / sqrt(2)]) square(eps, center = true);
    }
}

// The roof's cavity above the thread: it narrows at 45 degrees up to the
// point where the inner arc is that steep, then follows the arc. Near the
// eaves the roof is thicker than roof_thickness, so it needs no support.
module cavity_profile()
    polygon(mirrored(concat([[cavity_line - roof_bore_h + eps, roof_bore_h - eps]],
        arc(arc_c, inner_r, -135, axis_a(inner_r)))));

// The slots in the face at +y, in plan: strips at right angles to the eave,
// cut off along the hips, around the finial and by the bar.
module face_slots() {
    y_out = eave_half - eave_margin;
    y_in = finial_d / 2 + hip_rib;
    n = floor((y_out - center_rib / 2) / slot_pitch);
    difference() {
        intersection() {
            polygon([[0, hip_rib * sqrt(2)], [y_out - hip_rib * sqrt(2), y_out],
                     [-(y_out - hip_rib * sqrt(2)), y_out]]);
            translate([-y_out, y_in]) square([2 * y_out, y_out - y_in]);
            for (m = [0, 1]) mirror([m, 0, 0]) for (i = [0:n])
                translate([center_rib / 2 + i * slot_pitch, 0]) square([slot_width, y_out]);
        }
        translate([-y_out, y_out - dash_length - eave_bar_width]) square([2 * y_out, eave_bar_width]);
    }
}

// Points on the circle around c with radius r, from angle a0 to a1.
function arc(c, r, a0, a1) = [for (i = [0:arc_n]) let(a = a0 + (a1 - a0) * i / arc_n) c + r * [cos(a), sin(a)]];

// The points with x >= 0, then their mirror images in reverse, leaving out
// those on the axis: a polygon symmetric about x = 0.
function mirrored(pts) = concat(pts, [for (i = [len(pts) - 1:-1:0]) if (pts[i][0] > eps) [-pts[i][0], pts[i][1]]]);

// The holder's modules, from RGBW_pucklight_holderV2.scad.

// Square body with the cavity, the internal thread, the pin holes and the
// cross of ribs over the window.
module toppart() {
    difference() {
        translate([-half, -half, 0]) cube([body_w, body_w, top_z]);
        rotate_extrude() polygon([
            [0, -1], [recess_r, -1], [recess_r, recess_top], [hole_minor_r, thread_start],
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

// The holder's thread, also the roof's: 45 degree flanks, as in
// fdm_optimized_screws. Major diameter d from z = 0 to h: a screw's thread,
// and, with the clearance added, the shape cut for its nut's. render() keeps
// the preview working with this many threads.
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
