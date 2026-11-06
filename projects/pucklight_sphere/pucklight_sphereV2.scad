// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V2: pucklight_sphere.scad made smaller and thinner, because print time follows
// the material: a smaller sphere with a thinner shell, and thinner pins, so a
// smaller sockel with thinner walls. The floor under the puck, the screw's flange,
// the click base's plate and the thread are thinner or shorter too. The click
// works as before. New: part = "vase_sphere", a solid for a slicer's vase mode.
//
// Sphere lamp for an RGBW puck light (62 mm KC007). Spheres are swapped by
// unscrewing them. V2's threads do not fit V1's parts.
//
// The puck's mount is the holder's, in a round body: the sockel. The puck lies
// in it, the holder's bottom screw (the screwin) screws into it from below,
// and the holder's click base clicks the light when the lamp is pressed down.
// The holder's parameters and modules are copied from
// ../RGBW_pucklight_holder/RGBW_pucklight_holderV3.scad, so this file runs on
// its own; copy changes to the holder over by hand.
//
// The sphere's neck has a thread outside and screws into a cup on top of the
// sockel, down to the cup's floor. The cup hides the thick neck, so the whole
// visible sphere is the thin shell. The inside is always a smooth sphere. The
// outside is smooth too, or a formula (surface): the shell is shell thick at
// least, thicker on the formula's peaks, and the thin parts glow brighter.
//
// Print every part standing as it is used, bottom on the bed. The sphere stands
// on its neck, and no part of its lower half overhangs more than 45 degrees.
// Its top closes as a thin dome. Nothing is modelled as support.
// Origin of each part: centre of its bottom face.
//
// Units: mm. No external files or libraries needed.

/* [View] */
part = "assembly"; // [assembly:Assembly on the click base,section:Assembly cut in half,print_layout:All parts,sphere:Sphere,vase_sphere:Vase mode sphere,sockel:Sockel,screwin:Screwin,clickbase:Click base]

/* [Sphere] */
sphere_d = 100;
// Thinner glows more and gives more light.
shell = 0.8; // [0.8:0.1:2]

/* [Vase mode sphere] */
// A solid for a slicer's vase mode, which prints it as one wall. One wall can
// lean in only so far and has no top layer, so above this overhang, in degrees,
// the sphere ends in a straight cone to a point. Lower is safer and more pointed.
vase_overhang = 60; // [45:1:75]

/* [Surface formula] */
// The outside of the sphere; see surface_height() for the formulas.
surface = "smooth"; // [smooth:Smooth,ribs:Ribs,twist:Twisted ribs,waves:Waves,lattice:Crossed spirals]
// How far the formula's peaks stand out. The shell is shell + this thick there.
surface_depth = 0.8; // [0.2:0.1:5]
// Ribs, waves or spirals around the sphere.
surface_count = 12; // [2:1:64]
// Twisted ribs: how far a rib turns around the axis from pole to pole, degrees.
surface_twist = 120; // [-360:10:360]
// Columns of the sphere's mesh. Raise it for many or sharp ribs: a rib needs
// about 12 columns.
sphere_columns = 180; // [64:4:720]

/* [Thread] */
// Major diameter of the thread on the sphere's neck.
neck_d = 77;
neck_height = 4;
// Inside the thread's root.
neck_wall = 1.2;
// Radial gap between the threads.
neck_clearance = 0.3;

/* [Sockel] */
sockel_d = 82;

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
screw_height = 8.4;
// Thread at the top that fully engages the top part's; below it a wider
// flange.
screw_thread_length = 3.5;
// Floor under the puck, and the height of the bar you turn the screw with, both
// less puck_extra_play. The disc reaches up from here.
lip_height = 3;
bar_width = 2;
// Wall between the puck and the thread's root.
screw_wall = 1.2;
// 2 mm prints best (fdm_optimized_screws). Also the sphere's thread.
thread_pitch = 2;
// Radial gap between the threads.
thread_clearance = 0.25;
// The screw turns this much deeper than flush, so its bar can be lined up
// with the click base's slot. Keep it below puck_play + puck_extra_play, or the
// screw clamps the puck when turned in all the way.
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
pin_d = 3;
pin_height = 4;
// Radial gap of the pins in their holes.
pin_clearance = 0.3;

/* [Logo] */
// The logos are in the bottoms, hidden when the lamp stands on a desk. The
// sphere's neck has no room for one.
// In the bottom of the click base.
base_logo_width = 40;
// In the bottom of the sockel, between the recess and the outside.
sockel_logo_width = 5.9;
// In the bottom of the screw's flange, beside the bar.
screw_logo_width = 8;
logo_depth = 0.6;
// Also one you can see: in the lower front of the sphere, half through the
// shell, so it glows brighter, and in the front of the sockel. The sphere then
// is no longer one mesh and renders in 20 s instead of 1 s.
front_logos = false;
front_logo_width = 20;

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
deg_per_rad = 180 / PI;

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
// The ribs end over the recess wall. Beside the window they stand on 45
// degree feet.
rib_r = recess_r;
foot_w = rib_width + 2 * (touch_z - top_z);
// Height of the disc above the base's plate, and the slot in it for the bar.
disc_h = lip_height + press_height;
floor_z = on_layer(lip_height - puck_extra_play);
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
// The screw's logo sits in the middle of the flange's bottom ring.
screw_logo_x = (opening_r + flange_r) / 2;

// The sockel: the holder's top part, round, with the cup on top. A round body
// has no corners for the pins, so they lie halfway between the recess and the
// outside, on the diagonals.
sockel_r = sockel_d / 2;
pin_r = (recess_r + sockel_r) / 2;
pin_pos = pin_r / sqrt(2);
pin_hole_r = pin_d / 2 + pin_clearance;
neck_root_r = neck_d / 2 - thread_depth;
neck_bore_r = neck_root_r - neck_wall;
// The cup's female thread and its 45 degree lead-in. Its rim stands
// thread_depth above the neck, hiding the thread's run-out.
cup_d = neck_d + 2 * neck_clearance;
cup_h = neck_height + thread_depth;
cup_lead_r = cup_d / 2 + thread_depth;
sockel_h = top_z + cup_h;

// The sphere. Above the neck a 45 degree cone leads to the sphere at
// sphere_start, its radius there start_r. It is the point where the sphere
// overhangs 45 degrees, so nothing below it is steeper, or for a small sphere
// the point 1 mm outside the thread.
sphere_r = sphere_d / 2;
inner_r = sphere_r - shell;
start_r = max(sphere_r * cos(45), neck_d / 2 + 1);
sphere_start = -acos(start_r / sphere_r);
start_z = neck_height + start_r - neck_root_r;
centre_z = start_z - sphere_r * sin(sphere_start);
// The inside: the neck's bore, then a 45 degree cone to the inner sphere.
inner_start_r = inner_r * cos(sphere_start);
inner_start_z = centre_z + inner_r * sin(sphere_start);
bore_top = inner_start_z - (inner_start_r - neck_bore_r);
// The mesh: columns around the axis; rows every 0.1 mm over the thread and as
// far apart as the columns over the sphere.
columns = sphere_columns;
thread_rows = ceil((neck_height + thread_depth) / (thread_pitch / 20));
sphere_step = (90 - sphere_start) / ceil((90 - sphere_start) * columns / 360);
sphere_rows = [for (i = [0:round((90 - sphere_start) / sphere_step) - 1]) sphere_start + i * sphere_step];
// The sphere's front logo sits just above the sockel's rim, on the smooth part.
logo_half_lat = deg_per_rad * logo_h(front_logo_width) / 2 / sphere_r;
front_logo_lat = sphere_start + 7 + logo_half_lat;
// A formula fades in above the front logo's place, with or without the logo,
// and out towards the pole, where its columns meet.
fade_bottom = front_logo_lat + logo_half_lat + 2;
fade_width = 15;
// The vase mode sphere's cone starts at the latitude where the sphere overhangs
// vase_overhang, and its tip is where the tangent there meets the axis.
vase_tip_z = centre_z + sphere_r / sin(vase_overhang);
fade_top = part == "vase_sphere" ? vase_overhang : 80;

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
assert(logo_h(screw_logo_width) + 2 <= flange_r - opening_r,
       "The screw's logo is wider than its flange; lower screw_logo_width.");
assert(norm([base_logo_width / 2, logo_h(base_logo_width) / 2]) <= sockel_r - 2,
       "The base's logo does not fit on its bottom; lower base_logo_width.");
assert(logo_depth + 0.5 <= base_thickness, "logo_depth is too deep for the click base's plate, under the bar's slot.");
// The sphere's and the sockel's.
assert(pin_r - pin_hole_r - recess_r >= 1, "sockel_d is too small for the pin holes.");
assert(sockel_r - cup_lead_r >= 1, "neck_d is too large for sockel_d: the cup's rim must stay 1 mm wide.");
assert(neck_bore_r >= rib_r + 1, "neck_d is too small: the neck must clear the ribs.");
assert(sphere_d >= neck_d + 10, "sphere_d is too small for the neck; lower neck_d.");
assert(bore_top >= 0, "shell is too thick for the neck; lower shell or raise neck_wall.");
assert(logo_h(sockel_logo_width) + 2 <= sockel_r - recess_r, "The sockel's logo is wider than its bottom ring; lower sockel_logo_width.");
assert(!front_logos || logo_h(front_logo_width) + 2 <= sockel_h - recess_top, "The front logo is too large for the sockel; lower front_logo_width.");

if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "print_layout") print_layout();
else if (part == "sphere") sphere_part();
else if (part == "vase_sphere") vase_sphere();
else if (part == "sockel") sockel();
else if (part == "screwin") bottom_screw();
else if (part == "clickbase") clickbase();

// The formula: how far the outside stands above the smooth sphere at latitude
// lat and longitude lon, from 0 to 1. Add your own here.
function surface_height(lat, lon) =
    surface == "ribs" ? 0.5 + 0.5 * cos(surface_count * lon) :
    surface == "twist" ? 0.5 + 0.5 * cos(surface_count * (lon + surface_twist * lat / 180)) :
    surface == "waves" ? 0.5 + 0.5 * cos(surface_count * lon) * cos(surface_count * lat) :
    // Two families of ridges along loxodromes, which cross at right angles:
    // the Mercator map turns them into straight lines.
    surface == "lattice" ? let (m = surface_count * deg_per_rad * ln(tan(45 + lat / 2)))
        pow(max(0.5 + 0.5 * cos(surface_count * lon + m), 0.5 + 0.5 * cos(surface_count * lon - m)), 3) :
    0;

function smoothstep(t) = let (s = max(0, min(1, t))) s * s * (3 - 2 * s);

function surface_fade(lat) =
    smoothstep((lat - fade_bottom) / fade_width) * smoothstep((fade_top - lat) / fade_width);

// The outside's radius from the sphere's centre.
function outer_radius(lat, lon) =
    surface == "smooth" ? sphere_r : sphere_r + surface_depth * surface_fade(lat) * surface_height(lat, lon);

// The neck's radius at height z and angle a: the thread, right-handed, in phase
// with the holder's threaded_rod(). A 45 degree chamfer at the bed, and the cone
// above the thread, which the thread runs out into.
function neck_radius(z, a) =
    let (u = z - thread_pitch * a / 360,
         m = u - thread_pitch * floor(u / thread_pitch),
         d = min(m, thread_pitch - m),
         ridge = max(0, min(thread_depth, thread_depth + thread_tip - d)))
    neck_root_r + max(min(ridge, z), z - neck_height);

function polar(r, a, z) = [r * cos(a), r * sin(a), z];
function column_angle(c) = c * 360 / columns;
function ring(r, z) = [for (c = [0:columns - 1]) polar(r, column_angle(c), z)];

// A ring of the sphere's outside at latitude lat.
function sphere_ring(lat) = [for (c = [0:columns - 1]) let (r = outer_radius(lat, column_angle(c)))
    polar(r * cos(lat), column_angle(c), centre_z + r * sin(lat))];

// The rings of the outside, bottom up: the neck, then the sphere up to top_lat.
function outer_rings(top_lat) = concat(
    [for (i = [0:thread_rows]) let (z = i * thread_pitch / 20)
        [for (c = [0:columns - 1]) polar(neck_radius(z, column_angle(c)), column_angle(c), z)]],
    [for (lat = sphere_rows) if (lat < top_lat) sphere_ring(lat)]);

function ring_id(k, c) = k * columns + c % columns;

// The faces between rings k and k1. Clockwise as viewed from outside the solid,
// as required by OpenSCAD.
function ring_strip(k, k1) = [for (c = [0:columns - 1], t = [0, 1])
    t == 0 ? [ring_id(k, c), ring_id(k1, c), ring_id(k1, c + 1)]
           : [ring_id(k, c), ring_id(k1, c + 1), ring_id(k, c + 1)]];

// The sphere with its neck as it is printed, neck on the bed, as one mesh. No
// union is needed, so it renders in seconds. Its rings run up the outside and
// down the inside, with a point on each pole, and the last ring is joined to
// the first by the bottom face.
module sphere_mesh() {
    outer = outer_rings(90);
    inner = concat(
        [for (i = [len(sphere_rows) - 1:-1:0]) let (lat = sphere_rows[i])
            ring(inner_r * cos(lat), centre_z + inner_r * sin(lat))],
        [ring(neck_bore_r, bore_top), ring(neck_bore_r, 0)]);
    rings = concat(outer, inner);
    n_outer = len(outer);
    n_rings = len(rings);
    points = concat([for (r = rings, p = r) p],
                    [[0, 0, centre_z + sphere_r], [0, 0, centre_z + inner_r]]);
    pole_out = n_rings * columns;
    pole_in = pole_out + 1;
    faces = concat(
        [for (k = [0:n_outer - 2], f = ring_strip(k, k + 1)) f],
        [for (c = [0:columns - 1]) [ring_id(n_outer - 1, c), pole_out, ring_id(n_outer - 1, c + 1)]],
        [for (c = [0:columns - 1]) [pole_in, ring_id(n_outer, c), ring_id(n_outer, c + 1)]],
        [for (k = [n_outer:n_rings - 2], f = ring_strip(k, k + 1)) f],
        ring_strip(n_rings - 1, 0));
    polyhedron(points = points, faces = faces, convexity = 8);
}

// The sphere for a slicer's vase mode: the same outside, thread and formula, but
// solid, so each layer has one outline for the nozzle to follow, ending in the
// cone. The slicer hollows it. Set its bottom layers to 0, or the print has a
// floor, which hits the sockel's ribs. It has no logo: the wall is one line.
module vase_sphere() {
    rings = concat(outer_rings(vase_overhang), [sphere_ring(vase_overhang)]);
    n = len(rings);
    points = concat([for (r = rings, p = r) p], [[0, 0, 0], [0, 0, vase_tip_z]]);
    faces = concat(
        [for (c = [0:columns - 1]) [n * columns, ring_id(0, c), ring_id(0, c + 1)]],
        [for (k = [0:n - 2], f = ring_strip(k, k + 1)) f],
        [for (c = [0:columns - 1]) [ring_id(n - 1, c), n * columns + 1, ring_id(n - 1, c + 1)]]);
    polyhedron(points = points, faces = faces, convexity = 4);
}

// The sphere, with its front logo if there is one.
module sphere_part() {
    if (front_logos)
        difference() {
            sphere_mesh();
            sphere_logo_cut();
        }
    else
        sphere_mesh();
}

// The logo in the sphere's front, half through the shell, as deep everywhere.
module sphere_logo_cut()
    translate([0, 0, centre_z]) difference() {
        rotate([-front_logo_lat, 0, 0]) rotate([90, 0, 0]) translate([0, 0, 0.8 * sphere_r])
            linear_extrude(0.2 * sphere_r + 2) scale(front_logo_width / logo_w) translate([0, -logo_r]) logo();
        sphere(r = sphere_r - shell / 2);
    }

// Released: as in the holder the lamp rests on the puck's dome, which touches
// the ribs, and the puck lies on the disc, so the sockel floats
// press_height - puck_play above the base. Pressing it down that far clicks the
// light. The puck is a ghost.
module assembly() {
    translate([0, 0, -base_thickness]) color("silver") clickbase();
    translate([0, 0, press_height - puck_play]) {
        color("lightskyblue") sockel();
        color("gold") bottom_screw();
        color("white") translate([0, 0, top_z]) sphere_part();
        %translate([0, 0, lip_height + puck_play]) puck();
    }
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    translate([0, 0, -base_thickness]) color("silver") half_cut() clickbase();
    translate([0, 0, press_height - puck_play]) {
        color("lightskyblue") half_cut() sockel();
        color("gold") half_cut() bottom_screw();
        color("white") half_cut() translate([0, 0, top_z]) sphere_part();
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
    sphere_part();
    translate([sphere_r + sockel_r + layout_gap, 0, 0]) sockel();
    translate([sphere_r + sockel_r + layout_gap, -(sockel_d + layout_gap), 0]) clickbase();
    translate([sphere_r + sockel_r + layout_gap, sockel_d + layout_gap, 0]) bottom_screw();
}

// The holder's top part in a round body, with the cup for the sphere on top: its
// cavity, its internal thread, the pin holes and the cross of ribs over the
// window. The cup's thread starts on its floor, in phase with the neck's. The
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
        for (x = [-1, 1], y = [-1, 1]) translate([x * pin_pos, y * pin_pos, -1])
            cylinder(d = pin_d + 2 * pin_clearance, h = pin_height + 1.6);
        translate([0, 0, top_z]) threaded_rod(cup_d, cup_h + 1);
        // 45 degree lead-in at the rim.
        translate([0, 0, sockel_h - 2 * thread_depth]) cylinder(h = 2 * thread_depth + eps,
            r1 = cup_d / 2 - thread_depth, r2 = cup_lead_r + eps);
        // Reads from below, its top pointing outwards.
        translate([0, -pin_r, 0]) rotate(180) rotate([0, 180, 0]) logo_cut(sockel_logo_width);
        if (front_logos) sockel_front_logo_cut();
    }
    for (a = [0, 90]) rotate(a) rib();
}

// The logo in the sockel's front, logo_depth deep everywhere on the round wall.
module sockel_front_logo_cut()
    difference() {
        translate([0, 0, (recess_top + sockel_h) / 2]) rotate([90, 0, 0]) translate([0, 0, sockel_r - 3])
            linear_extrude(4) scale(front_logo_width / logo_w) translate([0, -logo_r]) logo();
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
        // Reads from below, its top pointing outwards.
        translate([screw_logo_x, 0, 0]) rotate(-90) rotate([0, 180, 0]) logo_cut(screw_logo_width);
    }
    translate([-bar_width / 2, -opening_r - 1, 0]) cube([bar_width, 2 * opening_r + 2, floor_z]);
}

// Round plate with the guide pins and the disc that lifts the puck, slotted for
// the bottom screw's bar. Bottom on z = 0.
module clickbase() {
    difference() {
        union() {
            cylinder(r = sockel_r, h = base_thickness);
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
        // In the bottom, on the desk. Reads from below.
        rotate([0, 180, 0]) logo_cut(base_logo_width);
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
