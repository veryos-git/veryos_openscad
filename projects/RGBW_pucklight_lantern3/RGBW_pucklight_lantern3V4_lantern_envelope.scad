// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Lantern for an RGBW puck light (62 mm KC007), after the Onshape model in
// inspiration/lantern_onshape_export.
//
// The frame's bottom is the top part of the puck light holder: the puck lies
// in it, the holder's bottom screw (the screwin) screws into it from below,
// and the holder's click base clicks the light when the lantern is pressed
// down. The holder's parameters and modules are copied from
// ../RGBW_pucklight_holder/RGBW_pucklight_holderV3.scad, without the logos,
// so this file runs on its own; copy changes to the holder over by hand.
// Above the top part four corner pillars lean out to a wider top. Each
// pillar has a slit on both sides; a window slides into the slits of two
// pillars from above and
// stands in a slit in the bottom rail. At the top a band behind the windows
// carries a round neck with an external thread, and the roof screws onto it,
// covering the slits. The band's underside is a 45 degree funnel, which
// shows as an arch behind each window.
//
// V2: each window is a thin plate with a star on its outside, as in
// ../published_christmas_star: the star stands a random number of layers on
// the plate, and random lines are cut into it to different levels, so the
// light shines through in shades. The plate is window_thickness thick,
// slot_clearance thinner on each side than its slits, so it slides in; the
// star stays between the pillars, clear of the slits.
//
// V3: for decoration, without logos.
//
// V4: one envelope for the whole lantern, instead of one per part: the space
// in and around the frame and the roof, as they are assembled, that a
// decoration may fill without hindering the lantern. Outside it is as in V3;
// inside it also takes the pillars' inner faces, the corners, the band's
// underside and the roof's inside. It leaves free the light's straight way
// from the puck to the windows and into the roof, the windows and their
// slits, the holder, and the thread the roof turns on. Sculpt a decoration of
// the whole lantern; decorated_frame() and decorated_roof() cut it to the
// envelope and union it with the parts.
//
// The roof continues the frame's sides in a band, then curves in to a ball
// on top. Vertical slits through it let the light out at the top. It is a
// shell, roof_wall thick; near the eaves, where the curve is flatter than 45
// degrees, its inside stays at 45 degrees, so the shell is thicker there.
//
// Print every part standing as it is used, bottom on the bed, and the
// windows flat, all without support: the band's funnel and the ball's
// underside are 45 degrees, the roof's inside is no flatter, and the threads
// have 45 degree flanks as in the holder.
// Origin: centre of the frame's bottom face.
//
// Units: mm. No external files or libraries needed.

/* [View] */
part = "assembly"; // [assembly:Assembly on the click base,section:Assembly cut in half,print_layout:All parts,frame:Frame,roof:Roof,screwin:Screwin,clickbase:Click base,window:Window,random_windows:Random window patterns,lantern:Lantern in the envelope's place,envelope:Decoration envelope]

/* [Frame] */
// The frame's bottom is the holder's 76 mm top part. Its sides lean out to
// this width at the top; the windows slide in from there.
top_width = 100;
// From the holder's top to the frame's top.
frame_height = 90;
// Width of a corner pillar on each side, and the frame's depth from the
// outside in.
pillar_width = 10;
frame_depth = 6;
// The rail between the pillars, on the holder's top.
rail_height = 6;

/* [Windows] */
// A window is a flat plate: printed (part = "window") or cut from acrylic,
// film or paper of this thickness. The printed window's star stands on it.
window_thickness = 0.4;
// Gap on each side of a window in its slit, and at its edges.
slot_clearance = 0.3;
// Wall in front of the slits.
slot_lip = 1.2;
// How far a window reaches into a pillar on each side.
window_overlap = 3;
// Under the slit in the rail.
slot_floor = 1;

/* [Window star] */
// Change this for a different star.
decoration_seed = 41.1; // [0:0.1:100]
// The layer height you print the windows with. The star's height and the
// levels of its lines are whole layers.
layer_step = 0.2; // [0.08:0.04:0.4]
// The star stands on the plate a random height between these.
star_height_min = 0.2;
star_height_max = 1.4;
// Points of the star; with random_points, 3 to 8 at random.
star_points = 5; // [3:12]
random_points = false;
// Depth of the valleys between the points (0 shallow, 2 deep).
star_inner_factor = 0.5; // [0:0.05:2]
// How pointed the points are (0 round, 1 sharp).
star_angle_bias = 0.35; // [0:0.01:1]
// How far each point's sector is moved past the middle, as a share of its
// length; there the sectors overlap in a smaller star.
star_sector_shift = 0.375; // [0:0.01:1]
// Random lines in each half of a sector, cut into the star to different
// levels, at least one layer above the plate.
lines_per_sector = 6; // [1:20]
line_width_min = 0.42; // [0.3:0.01:5]
line_width_max = 3; // [0.3:0.1:20]
// Between the star and the window's visible edges.
decoration_border = 2;

/* [Decoration envelope] */
// How far a decoration may stand out from the frame's and the roof's
// outside.
envelope_thickness = 10;
// How far the envelope reaches into the parts' faces, so a decoration fuses
// with them instead of only touching.
envelope_overlap = 0.2;

/* [Roof thread] */
// Major diameter of the neck's thread on top of the frame.
neck_d = 88;
neck_height = 6;
// Inside the thread's root.
neck_wall = 2;
// Radial gap between the threads.
roof_thread_clearance = 0.3;
// When the roof is square to the frame it is this far above the frame's
// top, so it can turn further (72 degrees for 0.4) before it stops: turn it
// back until it lines up.
roof_seat_gap = 0.4;

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
// The roof is a shell this thick, square to its surface, on a floor as
// thick. Where the curve is flatter than 45 degrees, near the eaves, the
// inside stays at 45 degrees, so it prints without support.
roof_wall = 2;
// Vertical slits through the roof along each face, and a row of short ones
// along the eaves.
slit_width = 2;
slit_spacing = 1.6;
// Solid along the hips, the eaves and the middle of each face.
slit_margin = 2.5;

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
// Round window over the dome. The cavity's 45 degree shoulder runs up to its
// edge, so it also sets the height of the top surface: wider is lower.
window_d = 50;
// Thinnest side wall of the square body, beside the bottom screw.
wall = 2.25;
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
// Floor under the puck. Also the height of the bar you turn the screw with.
lip_height = 5;
bar_width = 2;
// Wall between the puck and the thread's root.
screw_wall = 1.2;
// 2 mm prints best (fdm_optimized_screws). Also the roof's thread.
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

/* [Quality] */
$fn = 128;

/* [Hidden] */
eps = 0.01;
layout_gap = 10;
roof_steps = 30;

// The holder, as in RGBW_pucklight_holderV3.scad.
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

// The lantern. Frame: from z0 on the holder's top part to z1. Its half width
// grows from w0 to w1, lean per mm of height.
z0 = top_z;
z1 = z0 + frame_height;
w0 = half;
w1 = top_width / 2;
lean = (w1 - w0) / frame_height;
function w(z) = w0 + lean * (z - z0);
tilt = atan(lean);
// A slit is window_slot_w wide behind the lip and reaches window_overlap
// into the pillars, from slot_z up through the top.
window_slot_w = window_thickness + 2 * slot_clearance;
slot_in = slot_lip + window_slot_w;
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
// The rail's top.
win_rail_y = (z0 + rail_height - slot_z) / cos(tilt);
// The star, in the part of the window seen between the pillars, above the
// rail, decoration_border in from its edges. The pillars cover
// window_overlap - slot_clearance of each side.
function win_half(y) = win_bot_half + (win_top_half - win_bot_half) * y / win_len;
function deco_half(y) = win_half(y) - (window_overlap - slot_clearance) - decoration_border;
deco_y0 = win_rail_y + decoration_border;
deco_y1 = win_len - decoration_border;
// The star fills the largest circle in there: as high as the space, or
// touching its top and its sides, which lean out deco_slope per mm.
deco_slope = (win_top_half - win_bot_half) / win_len;
star_fit_r = min((deco_y1 - deco_y0) / 2,
                 deco_half(deco_y1) / (sqrt(1 + deco_slope * deco_slope) + deco_slope));
star_y = deco_y1 - star_fit_r;
// The star's height in whole layers.
star_layers_min = max(1, round(star_height_min / layer_step));
star_layers_max = max(star_layers_min, round(star_height_max / layer_step));
// Roof. Its band leans like the frame's sides up to the eaves, a0 from the
// middle.
a0 = w1 + lean * roof_band_height;
roof_thread_d = neck_d + 2 * roof_thread_clearance;
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
// The shell's inside: the band's lean roof_wall in, and the arc of radius
// in_r around the curve's centre. Below in_t above the band that arc is
// flatter than 45 degrees, so there the inside is the 45 degree plane
// tangent to it, r + h = in_c. roof_in(z) is its half width at z above the
// roof's bottom.
in_r = roof_curve_r + roof_wall;
in_t = cy - in_r / sqrt(2);
in_c = cx + cy - in_r * sqrt(2);
function roof_in(z) = let (h = z - roof_band_height)
    min(w1 + lean * z - roof_wall / cos(tilt),
        h < in_t ? in_c - h : cx - sqrt(in_r * in_r - (h - cy) * (h - cy)));
// The inside reaches from the floor up to the tip of the ball's cone.
roof_in_top = finial_z - finial_r * sqrt(2);
// Around the thread a ring, which meets the band's inside in the middle of
// each face; in the corners the inside reaches down to the floor.
roof_ring_r = w1 + lean * roof_thread_top - roof_wall / cos(tilt);
slit_pitch = slit_width + slit_spacing;
// The short slits at the eaves are square.
eave_slit_y = a0 - slit_margin - slit_width;
// The envelope lies within env_r of the axis.
env_r = a0 + envelope_thickness + 1;

// The holder's checks.
assert(seat_gap < puck_play, "seat_gap must stay below puck_play, or the bottom screw clamps the puck.");
assert(press_height > puck_play, "press_height must exceed puck_play, or the base never pushes the button.");
assert(window_d > puck_dome_d, "The window must be wider than the dome.");
assert(top_z >= lift_z + puck_edge_height + cavity_gap, "window_d is too wide for the cavity's shoulder.");
assert(touch_z > top_z, "The dome does not reach above the top part.");
assert(rib_contact_d < window_d, "rib_contact_d must be smaller than window_d.");
assert(flange_h >= 1, "screw_thread_length is too long for screw_height: no flange left below the thread.");
assert(shoulder_z >= screw_height + seat_gap, "The cavity's shoulder starts below the bottom screw's top.");
assert(bore_r - opening_r >= 2, "press_d is too large: the bottom screw's floor must be at least 2 mm wide.");
// The lantern's.
assert(w1 > w0, "top_width must be more than the holder's body_w, or the windows do not slide in from the top.");
assert(slot_in + 1 <= frame_depth, "frame_depth must leave 1 mm behind the slits.");
assert(window_overlap + slot_clearance + 1 <= pillar_width - slot_in,
       "window_overlap is too large: the two slits of a pillar meet.");
assert(slot_floor + 2 <= rail_height, "rail_height must hold a window 2 mm deep.");
assert(neck_d / 2 + 1 <= w1 - slot_in, "neck_d is too large: the neck must stay inside the slits.");
assert(band_h < frame_height - rail_height, "frame_height is too small for the band.");
assert(roof_curve_r > chord / 2 && cy >= roof_rise, "roof_curve_r is too small for the roof's width and rise.");
assert(roof_thread_top + 2 <= roof_band_height, "roof_band_height must be 2 mm more than the thread.");
assert(roof_in(roof_thread_top) >= roof_thread_d / 2, "The roof's inside is narrower than its thread; lower roof_wall.");
assert(roof_in(roof_in_top) >= 0.5, "roof_wall is too thick for the roof's top; lower roof_wall.");
assert(star_height_min <= star_height_max, "star_height_min must not exceed star_height_max.");
assert(line_width_min <= line_width_max, "line_width_min must not exceed line_width_max.");
assert(star_fit_r >= 5, "There is no room for the star; lower decoration_border.");

if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "print_layout") print_layout();
else if (part == "frame") frame();
else if (part == "roof") roof();
else if (part == "screwin") bottom_screw();
else if (part == "clickbase") clickbase();
else if (part == "window") decorative_window();
else if (part == "random_windows") random_windows();
else if (part == "lantern") lantern();
else if (part == "envelope") envelope();

// The lantern on the click base, released: as in the holder it floats on
// the puck's dome, and pressing it down clicks the light. The roof is lined
// up, roof_seat_gap above the frame. The puck is a ghost.
module assembly() {
    translate([0, 0, -base_thickness]) color("silver") clickbase();
    translate([0, 0, press_height - puck_play]) {
        color("lightskyblue") frame();
        color("gold") bottom_screw();
        color("darkorange") translate([0, 0, z1 + roof_seat_gap]) roof();
        color("white", 0.6) for (a = [0:90:270]) rotate(a) placed_window();
        %translate([0, 0, lip_height + puck_play]) puck();
    }
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    translate([0, 0, -base_thickness]) color("silver") half_cut() clickbase();
    translate([0, 0, press_height - puck_play]) {
        color("lightskyblue") half_cut() frame();
        color("gold") half_cut() bottom_screw();
        color("darkorange") half_cut() translate([0, 0, z1 + roof_seat_gap]) roof();
        color("white") half_cut() for (a = [0:90:270]) rotate(a) placed_window();
        color("white") half_cut() translate([0, 0, lip_height + puck_play]) puck();
    }
}

// Cuts away the half in front of y = 0, rendered so it keeps its colour.
// union() keeps all of a loop's objects with lazy-union.
module half_cut()
    render() difference() {
        union() children();
        translate([-200, -400, -200]) cube(400);
    }

// 25 windows lying flat in a 5 x 5 grid, each with its own pattern: the first
// (bottom left) with decoration_seed, the others 1000 apart from it.
module random_windows()
    for (x = [0:4], y = [0:4])
        translate([(x - 2) * (2 * win_top_half + layout_gap), (y - 2) * (win_len + layout_gap), 0])
            decorative_window(decoration_seed + 1000 * (5 * y + x));

// Every part as it is printed, side by side.
module print_layout() {
    frame();
    translate([w1 + a0 + layout_gap, 0, 0]) roof();
    translate([0, -(w1 + w0 + layout_gap), 0]) bottom_screw();
    translate([w1 + a0 + layout_gap, -(w1 + w0 + layout_gap), 0]) clickbase();
    for (i = [0:3]) translate([(i - 1) * (2 * win_top_half + layout_gap), w1 + layout_gap, 0]) decorative_window();
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
// frame roof_seat_gap above it. The neck has a 45 degree chamfer at the top.
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

// The roof as it is printed: the band, the curved sides and the ball, a
// shell around the inside (roof_in) on a floor, with a ring around the
// thread. The slits reach from the thread's top through the sides; at the
// eaves they end in the band.
module roof() {
    difference() {
        union() {
            difference() {
                square_loft(concat([[w1, 0], [a0, roof_band_height]],
                    [for (i = [1:roof_steps]) let (h = i / roof_steps * roof_top_h)
                        [roof_a(h), roof_band_height + h]]));
                square_loft([for (i = [0:2 * roof_steps])
                    let (z = roof_wall + i / (2 * roof_steps) * (roof_in_top - roof_wall)) [roof_in(z), z]]);
            }
            cylinder(r = roof_ring_r, h = roof_thread_top);
            translate([0, 0, finial_z]) {
                sphere(r = finial_r);
                translate([0, 0, -finial_r * sqrt(2)])
                    cylinder(h = finial_r / sqrt(2), r1 = 0, r2 = finial_r / sqrt(2));
            }
        }
        // In phase with the neck's thread roof_seat_gap higher.
        translate([0, 0, -roof_seat_gap - thread_pitch])
            threaded_rod(roof_thread_d, roof_thread_top + roof_seat_gap + thread_pitch);
        // 45 degree lead-in at the bottom.
        translate([0, 0, -eps]) cylinder(h = 2 * thread_depth, r1 = roof_thread_d / 2 + thread_depth,
                                         r2 = roof_thread_d / 2 - thread_depth);
        translate([0, 0, roof_thread_top])
            linear_extrude(roof_band_height + roof_top_h, convexity = 60) slit_pattern();
    }
}

// The roof's slits seen from above. On each face, columns slit_width wide
// beside a solid middle, each a long slit and a short one at the eave, kept
// slit_margin inside the face's edges and away from the ball. The loops are
// in union(), as in decorative_window(), so they work with lazy-union too.
module slit_pattern()
    difference() {
        union() for (a = [0:90:270]) rotate(a) intersection() {
            offset(delta = -slit_margin) polygon([[0, 0], [a0, a0], [-a0, a0]]);
            union() for (s = [-1, 1], i = [0:ceil(a0 / slit_pitch)])
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

// The frame and the roof, lined up roof_seat_gap above it, and the windows,
// without the click base: the frame's bottom on z = 0, as in the envelope.
// Sculpt the decoration around this.
module lantern() {
    frame();
    translate([0, 0, z1 + roof_seat_gap]) roof();
    for (a = [0:90:270]) rotate(a) placed_window();
}

// The space a decoration may fill, in and around the lantern() as it is
// assembled. Below the frame's top it is the frame's, from the roof's bottom
// up the roof's, so a decoration of the whole lantern falls apart into the
// two at the gap between them, and the roof still turns. Both reach
// envelope_thickness out from the parts' outside and envelope_overlap into
// their faces, inside and out.
module envelope()
    union() {
        envelope_frame_part();
        translate([0, 0, z1 + roof_seat_gap]) envelope_roof_part();
    }

// The frame's part of the envelope: from the frame's bottom, which stands on
// the bed and the click base, to its top, above which the roof turns. The
// light's way and the frame itself are free.
module envelope_frame_part()
    difference() {
        intersection() {
            square_solid(frame_profile(0), envelope_thickness);
            zone(0, z1);
        }
        frame_core();
        light_path();
    }

// The roof's part of the envelope, as the roof is printed: from its bottom,
// which turns above the frame, up. The roof itself, the space its thread
// turns in around the neck, and the columns straight up from its slits,
// inside and out, are free.
module envelope_roof_part()
    difference() {
        intersection() {
            union() {
                square_solid(roof_profile(0), envelope_thickness);
                rotate_extrude() finial_profile(envelope_thickness);
            }
            zone(0, finial_z + finial_r + envelope_thickness + 1);
        }
        roof_core();
        translate([0, 0, -1]) cylinder(r = roof_thread_d / 2 + thread_depth, h = roof_thread_top + 1);
        translate([0, 0, roof_thread_top])
            linear_extrude(finial_z + finial_r + envelope_thickness, convexity = 60) slit_pattern();
    }

// The frame with a decoration of the whole lantern, its children in the
// envelope's place: the part of the decoration in the envelope below the
// frame's top, unioned with the frame, as it is printed.
module decorated_frame()
    union() {
        frame();
        intersection() {
            union() children();
            envelope_frame_part();
        }
    }

// The roof with the part of the decoration in the envelope above the roof's
// bottom, as the roof is printed.
module decorated_roof()
    union() {
        roof();
        intersection() {
            translate([0, 0, -(z1 + roof_seat_gap)]) union() children();
            envelope_roof_part();
        }
    }

// Everything from height za to zb within env_r of the axis.
module zone(za, zb)
    translate([-env_r, -env_r, za]) cube([2 * env_r, 2 * env_r, zb - za]);

// The light's way: straight from the holder's round window to the neck's
// bore, which lets it into the roof, and to each window opening between the
// pillars above the rail, and from there straight out. The hull of the round
// window and an opening holds every straight line between them.
module light_path() {
    hull() {
        holder_window();
        translate([0, 0, z1]) cylinder(r = neck_in_r, h = eps);
    }
    for (a = [0:90:270]) rotate(a) {
        hull() {
            holder_window();
            for (z = [z0 + rail_height, z1])
                slab(w(z) - pillar_width, w(z) - frame_depth - eps, w(z) - frame_depth, z);
        }
        hull() for (z = [z0 + rail_height, z1 + 1])
            slab(w(z) - pillar_width, w(z) - frame_depth, env_r, z);
    }
}

// The holder's round window in its top, where the light comes out.
module holder_window()
    translate([0, 0, z0 - eps]) cylinder(r = window_r, h = eps);

// The frame, envelope_overlap inside its faces: the holder's body, the
// frame's sides and the band above the funnel. The holder's ribs stand on it
// in the light's way. It fills the window openings and the slits too, which
// are inside the sides or in the light's way: the envelope leaves them free
// either way. The sides lean by tilt, the funnel is 45 degrees, so the
// insets across are larger.
module frame_core() {
    inset = envelope_overlap / cos(tilt);
    funnel_r = neck_in_r + envelope_overlap * sqrt(2);
    translate([-half + envelope_overlap, -half + envelope_overlap, -1])
        cube([body_w - 2 * envelope_overlap, body_w - 2 * envelope_overlap, z0 - envelope_overlap + 1]);
    difference() {
        frustum(inset, z0 - 1, z1 + 1);
        frustum(frame_depth - inset, z0 - 2, z1 + 2);
    }
    difference() {
        frustum(inset, z1 - band_h, z1 + 1);
        rotate_extrude() polygon([[0, z1 - band_h - 1], [funnel_r + band_h + 1, z1 - band_h - 1],
                                  [funnel_r, z1], [funnel_r, z1 + 2], [0, z1 + 2]]);
    }
}

// The roof, envelope_overlap inside its faces, its slits and thread filled:
// the outside shrunk, the inside (roof_in) grown, the ring around the thread
// and the ball. The inside is grown across by envelope_overlap * sqrt(2),
// which is at least envelope_overlap square to it, as it is nowhere flatter
// than 45 degrees.
module roof_core() {
    grow = envelope_overlap * sqrt(2);
    inside = [for (i = [0:2 * roof_steps])
        let (z = roof_wall + i / (2 * roof_steps) * (roof_in_top - roof_wall)) [roof_in(z) + grow, z]];
    difference() {
        square_solid(roof_profile(1), -envelope_overlap);
        square_loft(concat([[inside[0][0], roof_wall - envelope_overlap]], inside,
                           [[inside[2 * roof_steps][0], roof_in_top + envelope_overlap]]));
    }
    cylinder(r = roof_ring_r - envelope_overlap, h = roof_thread_top - envelope_overlap);
    rotate_extrude() finial_profile(-envelope_overlap);
}

// The frame's outside seen from the front: the holder's sides, then the
// pillars' lean. ext mm longer at the bottom and the top.
function frame_profile(ext) =
    [[-w0, -ext], [w0, -ext], [w0, z0], [w(z1 + ext), z1 + ext], [-w(z1 + ext), z1 + ext], [-w0, z0]];

// The roof's outside seen from the front, without the ball: the band, then
// the curve up to its end. ext mm longer at the bottom.
function roof_profile(ext) =
    let (side = concat([[w1 - lean * ext, -ext], [a0, roof_band_height]],
                       [for (i = [1:roof_steps]) let (h = i / roof_steps * roof_top_h)
                           [roof_a(h), roof_band_height + h]]))
    concat(side, [for (i = [len(side) - 1:-1:0]) [-side[i][0], side[i][1]]]);

// The right half of the ball and its cone seen from the front, grown by grow
// (shrunk if negative), to rotate_extrude.
module finial_profile(grow)
    intersection() {
        offset(r = grow) {
            translate([0, finial_z]) circle(r = finial_r);
            polygon([[0, finial_z - finial_r * sqrt(2)], [finial_r / sqrt(2), finial_z - finial_r / sqrt(2)],
                     [-finial_r / sqrt(2), finial_z - finial_r / sqrt(2)]]);
        }
        translate([0, -1]) square([env_r, finial_z + env_r]);
    }

// A solid whose sections are squares, its sides the polygon points in the
// x-z plane, symmetric about x = 0, grown by grow (shrunk if negative). Each
// side is the polygon grown in its own plane, so it is grow away from the
// side it grows from, and sharp along the corners.
module square_solid(points, grow)
    intersection() {
        rotate([90, 0, 0]) linear_extrude(2 * env_r, center = true) offset(r = grow) polygon(points);
        rotate([90, 0, 90]) linear_extrude(2 * env_r, center = true) offset(r = grow) polygon(points);
    }

// A window lying flat, its outside up: the trapezoid between the slits.
// Origin: middle of its bottom edge.
module window()
    linear_extrude(window_thickness) polygon([[-win_bot_half, 0], [win_bot_half, 0],
                                              [win_top_half, win_len], [-win_top_half, win_len]]);

// The window with a star on its outside, as in the Christmas star: the
// largest that fits above the rail, a random number of layers between
// star_height_min and star_height_max high. seed picks the star.
module decorative_window(seed = decoration_seed) {
    r = rands(0, 1, 2 + 4 * lines_per_sector, seed);
    n = random_points ? 3 + floor(r[0] * 6) : star_points;
    layers = min(star_layers_max, star_layers_min + floor(r[1] * (star_layers_max - star_layers_min + 1)));
    window();
    translate([0, star_y, window_thickness])
        star(n, star_fit_r / star_extent(n), layers, [for (i = [2:len(r) - 1]) r[i]]);
}

// Half of a star's sector for a radius of 1, as in the Christmas star: the
// middle, the point and the valley towards the next point.
function star_sector(n) =
    let (p1 = [sin(360 / n), cos(360 / n)],
         p2 = [0, 1] + star_angle_bias * (p1 - [0, 1]),
         a = atan2(p2[0], p2[1]))
    [[0, 0], [0, 1], star_inner_factor * norm(p2) * [sin(a), cos(a)]];

// How far a star of radius 1 reaches from its middle, its sectors moved.
function star_extent(n) = max([for (p = star_sector(n)) norm(p - [0, star_sector_shift])]);

// The Christmas star's mandala, layers high on z = 0 and eps into the plate
// below: n sectors of the given radius, each moved star_sector_shift of it
// past the middle, so they overlap there. Each half sector has a hole near
// its point and lines_per_sector lines from the randoms r, 4 per line:
// through a random point of the half sector, at a random angle and width.
// Line j is cut down to 1 + floor(j * (layers - 1) / lines_per_sector)
// layers: 1 to lines_per_sector layers in the highest star, as in the
// Christmas star. A star one layer high has no lines. Every half sector has
// the same lines, so the star is symmetric.
module star(n, radius, layers, r) {
    t = radius * star_sector(n);
    h = layers * layer_step;
    line_len = max(norm(t[1] - t[0]), norm(t[2] - t[1]), norm(t[0] - t[2]));
    for (i = [0:n - 1]) rotate(i * 360 / n) translate([0, -star_sector_shift * radius])
        for (m = [0, 1]) mirror([m, 0, 0]) difference() {
            translate([0, 0, -eps]) linear_extrude(h + eps) polygon(t);
            for (j = [0:lines_per_sector - 1])
                let (u = r[4 * j], v = r[4 * j + 1], fold = u + v > 1,
                     p = t[0] + (fold ? 1 - u : u) * (t[1] - t[0]) + (fold ? 1 - v : v) * (t[2] - t[0]),
                     level = 1 + floor(j * (layers - 1) / lines_per_sector),
                     width = line_width_min + r[4 * j + 3] * (line_width_max - line_width_min))
                if (level < layers) translate([p[0], p[1], level * layer_step])
                    rotate(r[4 * j + 2] * 360) translate([-line_len / 2, -width / 2, 0])
                        cube([line_len, width, h]);
            translate([0, 0.6 * radius, -1]) linear_extrude(h + 2) scale(0.2) polygon(t);
        }
}

// A window in the slits of the +y side, standing on their floor with its
// lower bottom edge, its outside out.
module placed_window()
    translate([0, w(slot_z) - slot_lip - window_slot_w / 2, slot_z + window_thickness / 2 * sin(tilt)])
        rotate([90 - tilt, 0, 0]) rotate([0, 180, 0])
            translate([0, 0, -window_thickness / 2]) decorative_window();

// The holder's modules, as in RGBW_pucklight_holderV3.scad.

// Square body with the cavity, the internal thread, the pin holes and the
// cross of ribs over the window.
module toppart() {
    difference() {
        translate([-half, -half, 0]) cube([body_w, body_w, top_z]);
        rotate_extrude() polygon([
            [0, -1], [recess_r, -1], [recess_r, recess_top], [hole_minor_r, thread_start],
            [hole_minor_r, shoulder_z], [window_r - 1, top_z + 1], [0, top_z + 1]]);
        // From z = 0 like the screw's thread, so the bar lies along y when
        // the screw is flush.
        threaded_rod(hole_d, shoulder_z);
        for (x = [-1, 1], y = [-1, 1]) translate([x * pin_pos, y * pin_pos, -1])
            cylinder(d = pin_d + 2 * pin_clearance, h = pin_height + 1.5);
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
        translate([0, 0, lip_height]) cylinder(r = bore_r, h = screw_height);
        translate([0, 0, -1]) cylinder(r = opening_r, h = lip_height + 2);
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
