// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Lantern for an RGBW puck light (62 mm KC007), after the Onshape model in
// source/lantern_onshape_export.
//
// The light's mount is the holder from ../RGBW_pucklight_holder, derived as
// in the Onshape model: the holder's top part is the bottom of the frame, its
// bottom screw is the screw-in and its click base is the click base. From the
// top part the frame widens upwards, 76 mm square at the bottom and 100 mm at
// the top, with a pillar in each corner. The side windows slide down into
// slits in the pillars from the top and stand in a groove in the top part.
// The roof covers the slits: it screws onto a ring on top of the frame. Its
// faces are concave, slotted, and meet in a finial.
//
// Print every part standing as it is used, the windows lying flat. Nothing
// needs support: under the frame's top and inside the roof the overhangs are
// 45 degrees, and the threads have 45 degree flanks, as in the holder. The
// VeryOS logo comes with the holder's parts; it is also engraved in the front
// of the roof's band and in each window.
// Origin: centre of the frame's bottom face, which is the holder's.
//
// Units: mm. Needs ../RGBW_pucklight_holder/RGBW_pucklight_holderV2.scad.

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
// Thread of the ring on top of the frame, which the roof screws onto.
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
bar_width = 1.4;

/* [Window] */
// Printed in clear or white filament, or cut from sheet as thick as the slit
// allows.
window_thickness = 2.6;
// Gap at each side and at the top.
window_clearance = 0.15;

/* [Logo] */
// In the front of the roof's band.
roof_logo_width = 9;
// In each window, above the holder.
window_logo_width = 16;

/* [Quality] */
$fn = 128;

/* [Hidden] */
use <../RGBW_pucklight_holder/RGBW_pucklight_holderV2.scad>

// From RGBW_pucklight_holderV2.scad, whose variables use<> does not import:
// the top part's width and height, the click base's plate, the puck's bottom
// when the holder is pressed down onto the click base, and its threads.
holder_body_w = 76;
holder_top_z = 29.1;
holder_base_thickness = 2;
holder_puck_z = 6.6;
thread_pitch = 2;
thread_depth = 0.8;

eps = 0.01;
layout_gap = 10;
// The frame stands on the holder's top at z0; z1 is its top face.
z0 = holder_top_z;
z1 = z0 + frame_height;
bottom_half = holder_body_w / 2;
top_half = frame_top_w / 2;
taper = (top_half - bottom_half) / frame_height;
tilt = atan(taper);
// Half the frame's width at height z, also beyond its ends.
function half_at(z) = bottom_half + taper * (z - z0);
wall = frame_lip + window_slit + frame_inner_lip;
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

assert(slit_end < pillar_face && pillar_face + frame_lip <= pillar_width,
       "The lips must overlap the window's edge: slit_end < pillar_face <= pillar_width - frame_lip.");
assert(window_thickness < window_slit * cos(tilt), "window_thickness is too thick for window_slit.");
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
    translate([0, 0, -holder_base_thickness]) color("silver") clickbase();
    color("lightskyblue") frame();
    color("gold") bottom_screw();
    translate([0, 0, z1]) color("darkorange") roof();
    color("white", 0.5) windows();
    %translate([0, 0, holder_puck_z]) puck();
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    translate([0, 0, -holder_base_thickness]) color("silver") front_cut() clickbase();
    color("lightskyblue") front_cut() frame();
    color("gold") front_cut() bottom_screw();
    translate([0, 0, z1]) color("darkorange") front_cut() roof();
    color("white") front_cut() windows();
    color("ivory") front_cut() translate([0, 0, holder_puck_z]) puck();
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
        translate([holder_body_w + layout_gap, 0, 0]) bottom_screw();
    }
    for (i = [0:3])
        translate([(i - 1.5) * (2 * top_half + layout_gap),
                   -(top_half + holder_body_w + 2 * layout_gap + window_len), 0]) window();
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
            translate([h - pillar_width, h - wall]) square([pillar_width, wall]);
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
        translate([-y_out, y_out - dash_length - bar_width]) square([2 * y_out, bar_width]);
    }
}

// Points on the circle around c with radius r, from angle a0 to a1.
function arc(c, r, a0, a1) = [for (i = [0:arc_n]) let(a = a0 + (a1 - a0) * i / arc_n) c + r * [cos(a), sin(a)]];

// The points with x >= 0, then their mirror images in reverse, leaving out
// those on the axis: a polygon symmetric about x = 0.
function mirrored(pts) = concat(pts, [for (i = [len(pts) - 1:-1:0]) if (pts[i][0] > eps) [-pts[i][0], pts[i][1]]]);
