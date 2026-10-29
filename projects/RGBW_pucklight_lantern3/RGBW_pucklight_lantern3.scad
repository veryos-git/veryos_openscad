// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Lantern for an RGBW puck light (62 mm KC007), after the Onshape model in
// inspiration/lantern_onshape_export.
//
// The frame's bottom is the top part of ../RGBW_pucklight_holder: the puck
// lies in it, the holder's bottom screw (the screwin) screws into it from
// below, and the holder's click base clicks the light when the lantern is
// pressed down. Above it four corner pillars lean out to a wider top. Each
// pillar has a slit on both sides; a window slides into the slits of two
// pillars from above and stands in a slit in the bottom rail. At the top a
// band behind the windows carries a round neck with an external thread, and
// the roof screws onto it, covering the slits. The band's underside is a 45
// degree funnel, which shows as an arch behind each window.
//
// The roof continues the frame's sides in a band, then curves in to a ball
// on top. Vertical slits through it let the light out at the top. Above its
// thread it is hollow in a 45 degree cone.
//
// Print every part standing as it is used, bottom on the bed, and the
// windows flat, all without support: the band's funnel, the roof's cone and
// the ball's underside are 45 degrees, and the threads have 45 degree flanks
// as in the holder. The VeryOS logo is engraved in the front of the frame
// (the holder's), in the screwin and the click base (the holder's), in the
// front of the roof's band and in each window.
// Origin: centre of the frame's bottom face.
//
// Units: mm. Needs ../RGBW_pucklight_holder/RGBW_pucklight_holderV2.scad.

/* [View] */
part = "assembly"; // [assembly:Assembly on the click base,section:Assembly cut in half,print_layout:All parts,frame:Frame,roof:Roof,screwin:Screwin,clickbase:Click base,window:Window]

/* [Frame] */
// The frame's bottom is the holder's 76 mm top part. Its sides lean out to
// this width at the top; the windows slide in from there.
top_width = 100;
// From the holder's top to the frame's top.
frame_height = 90;
// Width of a corner pillar on each side, and the frame's depth from the
// outside in.
pillar_width = 8;
frame_depth = 6;
// The rail between the pillars, on the holder's top.
rail_height = 6;

/* [Windows] */
// A window is a flat sheet: printed (part = "window") or cut from film or
// paper of this thickness.
window_thickness = 0.8;
// Gap on each side of a window in its slit, and at its edges.
slot_clearance = 0.3;
// Wall in front of the slits.
slot_lip = 1.2;
// How far a window reaches into a pillar on each side.
window_overlap = 3;
// Under the slit in the rail.
slot_floor = 1;

/* [Roof thread] */
// Major diameter of the neck's thread on top of the frame.
neck_d = 88;
neck_height = 6;
// Inside the thread's root.
neck_wall = 2;
// Radial gap between the threads.
thread_clearance = 0.3;
// When the roof is square to the frame it is this far above the frame's
// top, so it can turn further (72 degrees for 0.4) before it stops: turn it
// back until it lines up.
seat_gap = 0.4;

/* [Roof] */
// Continues the frame's sides above the frame's top.
roof_band_height = 12;
// From the band's top to where the curve would meet the axis.
roof_rise = 60;
// Radius of the curved sides; larger is straighter.
roof_curve_r = 100;
// The curve ends where the roof is this wide, under the ball.
roof_top_width = 5;
finial_d = 12;
// Vertical slits through the roof along each face, and a row of short ones
// along the eaves.
slit_width = 2;
slit_spacing = 1.6;
// Solid along the hips, the eaves and the middle of each face.
slit_margin = 2.5;

/* [Logo] */
// In the front of the roof's band.
roof_logo_width = 12;
// In each window, above the rail, half through the window.
window_logo_width = 20;

/* [Quality] */
$fn = 128;

/* [Hidden] */
use <../RGBW_pucklight_holder/RGBW_pucklight_holderV2.scad>

eps = 0.01;
layout_gap = 10;
roof_steps = 30;
// From RGBW_pucklight_holderV2.scad: its top part's width and height (body_w,
// top_z) and, for the assembly, its click base's plate (base_thickness), how
// far the holder floats above it (press_height - puck_play) and the puck's
// height in the holder (lip_height + puck_play).
holder_body_w = 76;
holder_top_z = 29.1;
holder_base_thickness = 2;
holder_float = 0.9;
holder_puck_z = 5.7;
// As threaded_rod() in the holder: 45 degree flanks.
thread_pitch = 2;
thread_depth = 0.4 * thread_pitch;
// Frame: from z0 on the holder's top to z1. Its half width grows from w0 to
// w1, lean per mm of height.
z0 = holder_top_z;
z1 = z0 + frame_height;
w0 = holder_body_w / 2;
w1 = top_width / 2;
lean = (w1 - w0) / frame_height;
function w(z) = w0 + lean * (z - z0);
tilt = atan(lean);
// A slit is slot_w wide behind the lip and reaches window_overlap into the
// pillars, from slot_z up through the top.
slot_w = window_thickness + 2 * slot_clearance;
slot_in = slot_lip + slot_w;
function slot_half(z) = w(z) - pillar_width + window_overlap;
slot_z = z0 + slot_floor;
neck_root_r = neck_d / 2 - thread_depth;
neck_in_r = neck_root_r - neck_wall;
// The band: the frame's top inside the slits, above a 45 degree funnel that
// narrows to the neck's bore at the top. It reaches lowest in the corners.
band_h = (w1 - slot_lip) * sqrt(2) - neck_in_r + 1;
// A window stands on the slits' floor and ends slot_clearance under the top.
win_top_z = z1 - slot_clearance;
win_bot_half = slot_half(slot_z) - slot_clearance;
win_top_half = slot_half(win_top_z) - slot_clearance;
win_len = (win_top_z - slot_z) / cos(tilt);
// The logo 3 mm above the rail.
win_logo_y = (z0 + rail_height - slot_z) / cos(tilt) + 3 + logo_h(window_logo_width) / 2;
// Roof. Its band leans like the frame's sides up to the eaves, a0 from the
// middle.
a0 = w1 + lean * roof_band_height;
roof_thread_d = neck_d + 2 * thread_clearance;
// 1 mm above the neck when the roof is down.
roof_thread_top = neck_height + 1;
// The curve: an arc of radius roof_curve_r from the eave (a0, 0) to the axis
// at roof_rise, its centre [cx, cy] up and out.
chord = sqrt(a0 * a0 + roof_rise * roof_rise);
centre_dist = sqrt(roof_curve_r * roof_curve_r - chord * chord / 4);
cx = a0 / 2 + centre_dist * roof_rise / chord;
cy = roof_rise / 2 + centre_dist * a0 / chord;
function roof_a(h) = cx - sqrt(roof_curve_r * roof_curve_r - (h - cy) * (h - cy));
roof_top_h = cy - sqrt(roof_curve_r * roof_curve_r - pow(cx - roof_top_width / 2, 2));
// The ball stands on a 45 degree cone as wide as the curve's end.
finial_r = finial_d / 2;
finial_z = roof_band_height + roof_top_h + finial_r * sqrt(2) - roof_top_width / 2;
// Between the cone inside and the curve, in the middle of a face.
function roof_wall(h) = roof_a(h) - (roof_thread_d / 2 - (roof_band_height + h - roof_thread_top));
roof_min_wall = min([for (i = [0:50]) roof_wall(i / 50 * roof_top_h)]);
slit_pitch = slit_width + slit_spacing;
// The short slits at the eaves are square.
eave_slit_y = a0 - slit_margin - slit_width;

assert(w1 > w0, "top_width must be more than the holder's 76 mm, or the windows do not slide in from the top.");
assert(slot_in + 1 <= frame_depth, "frame_depth must leave 1 mm behind the slits.");
assert(window_overlap + slot_clearance + 1 <= pillar_width - slot_in,
       "window_overlap is too large: the two slits of a pillar meet.");
assert(slot_floor + 2 <= rail_height, "rail_height must hold a window 2 mm deep.");
assert(neck_d / 2 + 1 <= w1 - slot_in, "neck_d is too large: the neck must stay inside the slits.");
assert(band_h < frame_height - rail_height, "frame_height is too small for the band.");
assert(roof_curve_r > chord / 2 && cy >= roof_rise, "roof_curve_r is too small for the roof's width and rise.");
assert(roof_thread_top + 2 <= roof_band_height, "roof_band_height must be 2 mm more than the thread.");
assert(roof_min_wall >= 2, "The roof is thinner than 2 mm above its cone; raise roof_rise or roof_curve_r.");
assert(logo_h(roof_logo_width) + 2 <= roof_band_height, "The roof's logo does not fit its band; lower roof_logo_width.");
assert(window_logo_width + 4 <= 2 * win_bot_half && win_logo_y + logo_h(window_logo_width) / 2 < win_len,
       "The window's logo does not fit; lower window_logo_width.");

if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "print_layout") print_layout();
else if (part == "frame") frame();
else if (part == "roof") roof();
else if (part == "screwin") bottom_screw();
else if (part == "clickbase") clickbase();
else if (part == "window") window();

// The lantern on the click base, released: as in the holder it floats on
// the puck's dome, and pressing it down clicks the light. The roof is lined
// up, seat_gap above the frame. The puck is a ghost.
module assembly() {
    translate([0, 0, -holder_base_thickness]) color("silver") clickbase();
    translate([0, 0, holder_float]) {
        color("lightskyblue") frame();
        color("gold") bottom_screw();
        color("darkorange") translate([0, 0, z1 + seat_gap]) roof();
        color("white", 0.6) for (a = [0:90:270]) rotate(a) placed_window();
        %translate([0, 0, holder_puck_z]) puck();
    }
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    translate([0, 0, -holder_base_thickness]) color("silver") half_cut() clickbase();
    translate([0, 0, holder_float]) {
        color("lightskyblue") half_cut() frame();
        color("gold") half_cut() bottom_screw();
        color("darkorange") half_cut() translate([0, 0, z1 + seat_gap]) roof();
        color("white") half_cut() for (a = [0:90:270]) rotate(a) placed_window();
        color("white") half_cut() translate([0, 0, holder_puck_z]) puck();
    }
}

// Cuts away the half in front of y = 0, rendered so it keeps its colour.
module half_cut()
    render() difference() {
        children();
        translate([-200, -400, -200]) cube(400);
    }

// Every part as it is printed, side by side.
module print_layout() {
    frame();
    translate([w1 + a0 + layout_gap, 0, 0]) roof();
    translate([0, -(w1 + w0 + layout_gap), 0]) bottom_screw();
    translate([w1 + a0 + layout_gap, -(w1 + w0 + layout_gap), 0]) clickbase();
    for (i = [0:3]) translate([(i - 1) * (2 * win_top_half + layout_gap), w1 + layout_gap, 0]) window();
}

// The holder's top part with the pillars and the rail, and the band with the
// neck on top; the slits are cut through all of them.
module frame() {
    difference() {
        union() {
            toppart();
            frame_sides();
            band();
        }
        for (a = [0:90:270]) rotate(a) slit();
    }
}

// The frame's sides, frame_depth deep, from 1 mm inside the holder's top to
// the frame's top, open between the pillars above the rail.
module frame_sides() {
    difference() {
        frustum(0, z0 - 1, z1);
        frustum(frame_depth, z0 - 2, z1 + 1);
        for (a = [0:90:270]) rotate(a) hull() for (z = [z0 + rail_height, z1 + 1])
            slab(w(z) - pillar_width, 0, w1 + 1, z);
    }
}

// The frame's top inside the slits, with the neck the roof screws onto,
// hollowed by a 45 degree funnel that narrows to the neck's bore at the
// frame's top. The neck's thread is in phase with one starting at the
// frame's top and the roof's is cut to match, so the roof lines up with the
// frame seat_gap above it. The neck has a 45 degree chamfer at the top.
module band()
    difference() {
        union() {
            frustum(slot_lip, z1 - band_h, z1);
            // One turn lower, inside the band, so the two are one solid.
            translate([0, 0, z1 - thread_pitch]) intersection() {
                threaded_rod(neck_d, neck_height + thread_pitch);
                cylinder(h = neck_height + thread_pitch, r1 = neck_root_r + neck_height + thread_pitch,
                         r2 = neck_root_r);
            }
        }
        rotate_extrude() polygon([[0, z1 - band_h - 1], [neck_in_r + band_h + 1, z1 - band_h - 1],
                                  [neck_in_r, z1], [neck_in_r, z1 + neck_height + 1],
                                  [0, z1 + neck_height + 1]]);
    }

// The slit in the +y side: behind the lip, from the rail's floor up through
// the top, into the pillars on both sides.
module slit()
    hull() for (z = [slot_z, z1 + 1])
        slab(slot_half(z), w(z) - slot_in, w(z) - slot_lip, z);

// From za to zb, its sections squares w(z) - inset from the middle. Built
// down from zb, so its top is exactly there, where the neck stands.
module frustum(inset, za, zb)
    translate([0, 0, zb]) mirror([0, 0, 1])
        linear_extrude(zb - za, scale = (w(za) - inset) / (w(zb) - inset))
            square(2 * (w(zb) - inset), center = true);

// A thin slab at height z, from -half to half in x and from ya to yb in y.
// The hull of two is a piece of the frame's leaning sides.
module slab(half, ya, yb, z)
    translate([-half, ya, z]) cube([2 * half, yb - ya, eps]);

// The roof as it is printed: the band, the curved sides and the ball,
// hollowed by the thread and the 45 degree cone above it. The slits reach
// from the cone through the sides; outside the cone they end in the band.
module roof() {
    difference() {
        union() {
            square_loft(concat([[w1, 0], [a0, roof_band_height]],
                [for (i = [1:roof_steps]) let (h = i / roof_steps * roof_top_h)
                    [roof_a(h), roof_band_height + h]]));
            translate([0, 0, finial_z]) {
                sphere(r = finial_r);
                translate([0, 0, -finial_r * sqrt(2)])
                    cylinder(h = finial_r / sqrt(2), r1 = 0, r2 = finial_r / sqrt(2));
            }
        }
        // In phase with the neck's thread seat_gap higher.
        translate([0, 0, -seat_gap - thread_pitch])
            threaded_rod(roof_thread_d, roof_thread_top + seat_gap + thread_pitch);
        // 45 degree lead-in at the bottom.
        translate([0, 0, -eps]) cylinder(h = 2 * thread_depth, r1 = roof_thread_d / 2 + thread_depth,
                                         r2 = roof_thread_d / 2 - thread_depth);
        translate([0, 0, roof_thread_top - eps])
            cylinder(h = roof_thread_d / 2, r1 = roof_thread_d / 2, r2 = 0);
        translate([0, 0, roof_thread_top])
            linear_extrude(roof_band_height + roof_top_h, convexity = 60) slit_pattern();
        // In the leaning front of the band.
        translate([0, -(w1 + lean * roof_band_height / 2), roof_band_height / 2])
            rotate([90 + tilt, 0, 0]) logo_cut(roof_logo_width);
    }
}

// The roof's slits seen from above. On each face, columns slit_width wide
// beside a solid middle, each a long slit and a short one at the eave, kept
// slit_margin inside the face's edges and away from the ball.
module slit_pattern()
    difference() {
        for (a = [0:90:270]) rotate(a) intersection() {
            offset(delta = -slit_margin) polygon([[0, 0], [a0, a0], [-a0, a0]]);
            for (s = [-1, 1], i = [0:ceil(a0 / slit_pitch)])
                translate([s * (slit_margin + slit_width / 2 + i * slit_pitch) - slit_width / 2, 0]) {
                    square([slit_width, eave_slit_y - slit_spacing]);
                    translate([0, eave_slit_y]) square([slit_width, a0]);
                }
        }
        circle(r = finial_r + slit_margin);
    }

// A solid whose sections are squares: half width l[0] at height l[1] for
// each level l, bottom up.
module square_loft(levels) {
    n = len(levels);
    corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    polyhedron(
        points = [for (l = levels, c = corners) [c[0] * l[0], c[1] * l[0], l[1]]],
        faces = concat(
            [[0, 1, 2, 3]],
            [for (i = [0:n - 2], j = [0:3])
                [4 * (i + 1) + j, 4 * (i + 1) + (j + 1) % 4, 4 * i + (j + 1) % 4, 4 * i + j]],
            [[4 * n - 1, 4 * n - 2, 4 * n - 3, 4 * n - 4]]),
        convexity = 4);
}

// A window lying flat, its outside up: the trapezoid between the slits, the
// logo engraved half through above the rail. Origin: middle of its bottom
// edge.
module window()
    difference() {
        linear_extrude(window_thickness) polygon([[-win_bot_half, 0], [win_bot_half, 0],
                                                  [win_top_half, win_len], [-win_top_half, win_len]]);
        // logo_cut() cuts the holder's logo_depth, 1 mm.
        translate([0, win_logo_y, window_thickness]) scale([1, 1, window_thickness / 2])
            logo_cut(window_logo_width);
    }

// A window in the slits of the +y side, standing on their floor with its
// lower bottom edge, its outside out.
module placed_window()
    translate([0, w(slot_z) - slot_lip - slot_w / 2, slot_z + window_thickness / 2 * sin(tilt)])
        rotate([90 - tilt, 0, 0]) rotate([0, 180, 0])
            translate([0, 0, -window_thickness / 2]) window();
