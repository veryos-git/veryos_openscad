// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Parametric lantern for an RGBW puck light (62 mm KC007).
//
// The light's mount is imported from ../RGBW_pucklight_holder: its top part
// and bottom screw. The lantern's base is the holder's plinth: the holder
// drops into it from above, rests on the base's floor and is held by gravity
// and a snug collar. The base's floor has a hole under the bottom screw, so
// the puck can be pressed from below.
//
// The walls are flat panels with an X between a frame, like the inspiration
// image. They plug into 45 degree mitred slots in the base. A continuous
// external thread is formed by all walls at the top; the roof with its
// internal thread screws onto it. Every wall is identical: the thread is
// multi-start, one start per wall. With four walls that is a four-start
// thread: pitch 2 mm between neighbouring ridges, lead 8 mm per turn, 45
// degree flanks (fdm_optimized_screws, as in the holder). A normal one-start
// thread would step a quarter of the pitch at every corner between identical
// walls.
//
// Print every part as set up in print_layout: the walls lie flat on their
// inner face, so their thread ridges and the logo print upwards. The base
// prints as used, the roof with its opening down. Nothing needs support.
//
// Units: mm. Requires OpenSCAD 2021.01 or newer.

/* [View] */
part = "assembly"; // [assembly:Assembly,section:Section,print_layout:Print layout,base:Base,wall:Wall (flat),roof:Roof,holder:Holder parts]

/* [Lantern] */
// Number of walls. Four fills the base around the square puck holder; five
// and more also work because the thread has one start per wall.
sides = 4; // [4:12]
// Length of a wall's outer face, i.e. the side of the polygon at the walls.
wall_side = 100;
wall_thickness = 5;
// Visible height above the base. The wall is wall_insert deeper in the base.
wall_visible_height = 140;
wall_insert = 7;
// Frame and X of a wall.
side_border = 9;
// The bottom border carries the logo.
bottom_border = 20;
x_bar_width = 8;

/* [Base] */
// Floor on which the holder's bottom rests, and dimensions taken from
// RGBW_pucklight_holderV2.scad: the body width, its top (top_z) and the floor
// inside the bottom screw (lip_height).
base_floor = 5;
holder_body_w = 76;
holder_body_top_z = 29.1;
holder_lip_height = 5;
// Lip of the base around the walls, and its outer shell.
base_rim = 6;
base_shell = 3;
// Plate into which the walls' slots are cut. Must be more than wall_insert.
top_plate = 9;
// Radial clearance of the walls in their slots and of the holder in its
// collar.
slot_clearance = 0.15;
holder_clearance = 0.3;
// Under the holder: large enough for the bottom screw's 70.5 mm flange.
holder_bottom_hole_d = 72;

/* [Thread] */
// Axial distance between neighbouring ridges, also on the roof.
thread_pitch = 2;
// 45 degree flanks, as in fdm_optimized_screws.
thread_depth = 0.4 * thread_pitch;
// Half the width of a ridge's crest.
thread_tip = 0.05 * thread_pitch;
// Radial clearance between the walls' ridges and the roof's grooves.
thread_clearance = 0.3;

/* [Roof] */
// How far the eaves stand out over the walls.
roof_overhang = 8;
// Height of the roof above the eave as a fraction of its outer apothem. It is
// proportional so the hollow inside stays steeper than 45 degrees when sides
// grows; a fixed height would make wide roofs unprintable.
roof_rise_ratio = 0.95; // [0.7:0.05:1.2]
// Flat top of the roof.
roof_top_apothem = 6;
// Solid thickness over the roof's cavity, and the small flat inner top. The
// inner top must stay inside the outer top.
roof_top_thickness = 3;
roof_inner_top_apothem = 4;

/* [Logo] */
// Engraved 1 mm deep in the base's front, each wall's bottom border and the
// roof's front.
base_logo_w = 20;
wall_logo_w = 15;
roof_logo_w = 16;

/* [Quality] */
$fn = 128;

/* [Hidden] */
use <../RGBW_pucklight_holder/RGBW_pucklight_holderV2.scad>

eps = 0.01;
layout_gap = 20;
// Apothem of the wall polygon: the distance from the centre to a wall's
// outer face. The wall's side is wall_side.
wall_apothem = wall_side / (2 * tan(180 / sides));
wall_height = wall_insert + wall_visible_height;
// More sides need a taller solid band above the X for the thread.
top_border = max(18, sides * thread_pitch + 10);
// Base.
base_top = base_floor + holder_body_top_z;
cavity_top = base_top - top_plate;
slot_floor = base_top - wall_insert;
wall_top = slot_floor + wall_height;
base_outer_apothem = wall_apothem + base_rim;
base_inner_apothem = base_outer_apothem - base_shell;
holder_half = holder_body_w / 2 + holder_clearance;
collar_half = holder_half + 2;
// Thread. One start per wall keeps identical walls in phase at the corners.
// Centre of the lowest start at the +x end of a wall. The highest ridge at
// the -x end stays 1.1 mm below the wall's top.
thread_z0 = wall_height - 2 - sides * thread_pitch;
roof_z0 = thread_z0 - wall_height;
// The roof's skirt covers the thread and reaches 5.1 mm below it.
roof_skirt_h = sides * thread_pitch + 8;
roof_outer_apothem = wall_apothem + roof_overhang;
roof_rise = roof_rise_ratio * roof_outer_apothem;
roof_cavity_apothem = wall_apothem + thread_clearance;
roof_ledge_inner = wall_apothem - wall_thickness;
// Wall plan miter. A wall is a trapezoid with its outer face on y =
// wall_apothem and its ends cut along the radial planes to the polygon's
// corners. A positive offset moves all four edges outwards, keeping the
// miters parallel; it is used for the base's slots and for trimming the
// thread at the corners.
miter_l = sqrt(1 + pow(wall_side / (2 * wall_apothem), 2));
miter_k = wall_side / (2 * wall_apothem);
function miter_outer(offset) =
    wall_side / 2 + offset * (miter_l + miter_k);
function miter_inner(offset) =
    wall_side / 2 + offset * miter_l - miter_k * (wall_thickness + offset);
function miter_plan(offset) = [
    [ miter_outer(offset), wall_apothem + offset],
    [ miter_inner(offset), wall_apothem - wall_thickness - offset],
    [-miter_inner(offset), wall_apothem - wall_thickness - offset],
    [-miter_outer(offset), wall_apothem + offset]];
// A regular polygon with the given apothem and a horizontal face on +y.
function ngon_pts(apothem) =
    let (r = apothem / cos(180 / sides))
    [for (i = [0:sides - 1])
        let (a = 90 - 180 / sides + i * 360 / sides)
        [r * cos(a), r * sin(a)]];
// The wall's logo sits in the visible part of the bottom border.
wall_logo_z = (wall_insert + bottom_border) / 2;

assert(sides >= 4, "The square puck holder does not fit a triangle.");
assert(roof_cavity_apothem > wall_apothem, "The roof must clear the walls.");
assert(holder_half + base_shell < base_inner_apothem,
       "The holder's collar does not fit inside the base; increase wall_side.");
assert(top_plate > wall_insert, "top_plate must be thicker than wall_insert.");
assert(logo_h(wall_logo_w) + 2 <= bottom_border - wall_insert,
       "The wall's logo does not fit above the base; lower wall_logo_w.");
assert(logo_h(roof_logo_w) + 4 <= roof_skirt_h,
       "The roof's logo does not fit its skirt; lower roof_logo_w.");
assert(logo_h(base_logo_w) + 4 <= base_top,
       "The base's logo is too tall; lower base_logo_w.");
assert(base_logo_w + 8 <= 2 * base_outer_apothem * tan(180 / sides),
       "The base's logo is too wide; lower base_logo_w.");
assert(roof_rise > roof_top_thickness + 5, "The roof is too flat.");
assert(roof_inner_top_apothem < roof_top_apothem,
       "The roof's inner top must stay inside its outer top.");
assert(roof_ledge_inner - roof_inner_top_apothem
       <= roof_rise - roof_top_thickness,
       "The roof's inside overhangs more than 45 degrees; increase roof_rise_ratio.");

if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "print_layout") print_layout();
else if (part == "base") base();
else if (part == "wall") wall_flat();
else if (part == "roof") translate([0, 0, roof_skirt_h]) roof();
else if (part == "holder") holder_parts();

// The whole lantern. The holder's top part and bottom screw are the
// imported parts; the bottom screw is flush with the holder's bottom. The
// puck rests on the bottom screw's floor, 0.7 mm under the ribs.
module assembly() {
    color("saddlebrown") base();
    color("wheat") for (i = [0:sides - 1])
        rotate([0, 0, i * 360 / sides]) translate([0, 0, slot_floor]) wall();
    color("sienna") translate([0, 0, wall_top]) roof();
    translate([0, 0, base_floor]) {
        color("gold") toppart();
        color("darkgoldenrod") bottom_screw();
        color("white") translate([0, 0, holder_lip_height]) puck();
    }
}

// The assembly cut in half along y = 0, seen from the front (+y). The puck is
// shown too.
module section() {
    difference() {
        assembly();
        translate([-3 * base_outer_apothem, 0, -20])
            cube([6 * base_outer_apothem, 4 * base_outer_apothem,
                  2 * wall_top + roof_rise + 40]);
    }
}

// Base, roof, all walls lying flat, the holder's top part and its bottom
// screw. The base and roof are shown as used.
module print_layout() {
    base();
    translate([2 * base_outer_apothem + layout_gap, 0, roof_skirt_h]) roof();
    translate([2 * base_outer_apothem + layout_gap + 2 * roof_outer_apothem
               + layout_gap, 0, 0]) bottom_screw();
    translate([0, base_outer_apothem + layout_gap + holder_half + 5, 0])
        toppart();
    for (i = [0:sides - 1])
        translate([(i - (sides - 1) / 2) * (wall_side + 5),
                   -(base_outer_apothem + layout_gap), 0]) wall_flat();
}

// The imported holder as two parts on the bed.
module holder_parts() {
    toppart();
    translate([holder_body_w + 15, 0, 0]) bottom_screw();
}

// The base: a plinth with the holder's collar, a floor under the holder and
// mitred slots for the walls. The floor's hole lets the bottom screw's
// flange through.
module base() {
    difference() {
        union() {
            difference() {
                linear_extrude(base_top) polygon(ngon_pts(base_outer_apothem));
                translate([0, 0, base_floor - eps])
                    linear_extrude(cavity_top - base_floor + eps)
                        polygon(ngon_pts(base_inner_apothem));
            }
            // Collar around the holder, from the floor to the top plate.
            translate([0, 0, base_floor - eps])
                linear_extrude(cavity_top - base_floor + 2 * eps)
                    square_ring(holder_half, collar_half);
        }
        translate([0, 0, -1])
            cylinder(d = holder_bottom_hole_d, h = base_floor + 2);
        translate([-holder_half, -holder_half, cavity_top - eps])
            cube([2 * holder_half, 2 * holder_half,
                  base_top - cavity_top + 2 * eps]);
        for (i = [0:sides - 1])
            rotate([0, 0, i * 360 / sides])
                translate([0, 0, slot_floor])
                    linear_extrude(wall_insert + 1)
                        polygon(miter_plan(slot_clearance));
        front_logo_cut(base_logo_w, base_outer_apothem, base_top / 2);
    }
}

// A wall panel as used. Origin at the middle of its bottom edge, outer face
// on +y, x along the wall, z up. The bottom wall_insert is the tenon in the
// base.
module wall() {
    difference() {
        union() {
            intersection() {
                linear_extrude(wall_height) polygon(miter_plan(0));
                translate([0, wall_apothem, 0]) rotate([90, 0, 0])
                    linear_extrude(wall_thickness) wall_elevation();
            }
            thread_ridges(thread_z0, wall_apothem, thread_depth, thread_tip,
                          thread_depth, 0, wall_height,
                          0, sides - 1);
        }
        front_logo_cut(wall_logo_w, wall_apothem, wall_logo_z);
    }
}

// One wall as printed: inner face on the bed, outer face and thread up. It
// extends from y = 0 to -wall_height.
module wall_flat() {
    translate([0, 0, -(wall_apothem - wall_thickness)])
        rotate([90, 0, 0]) wall();
}

// The wall's elevation: a frame with an X, cut out of the full rectangle.
module wall_elevation() {
    inner_w = wall_side - 2 * side_border;
    inner_h = wall_height - top_border - bottom_border;
    difference() {
        translate([-wall_side / 2, 0]) square([wall_side, wall_height]);
        translate([-inner_w / 2, bottom_border])
            difference() {
                square([inner_w, inner_h]);
                x_bars(inner_w, inner_h);
            }
    }
}

module x_bars(w, h) {
    bar([-w / 2, 0], [w / 2, h], x_bar_width, 6);
    bar([-w / 2, h], [w / 2, 0], x_bar_width, 6);
}

// A bar of width w from A to B, extended by ext at both ends.
module bar(A, B, w, ext) {
    d = [B[0] - A[0], B[1] - A[1]];
    l = norm(d);
    u = [d[0] / l, d[1] / l];
    n = [-u[1] * w / 2, u[0] * w / 2];
    A2 = [A[0] - u[0] * ext, A[1] - u[1] * ext];
    B2 = [B[0] + u[0] * ext, B[1] + u[1] * ext];
    polygon([[A2[0] + n[0], A2[1] + n[1]],
             [B2[0] + n[0], B2[1] + n[1]],
             [B2[0] - n[0], B2[1] - n[1]],
             [A2[0] - n[0], A2[1] - n[1]]]);
}

// The roof: a skirt with the internal thread, and a hollow pyramid. Its ledge
// rests on the walls' top edges. Printed with the skirt's opening down.
module roof() {
    difference() {
        union() {
            translate([0, 0, -roof_skirt_h])
                linear_extrude(roof_skirt_h + eps)
                    difference() {
                        polygon(ngon_pts(roof_outer_apothem));
                        polygon(ngon_pts(roof_cavity_apothem));
                    }
            linear_extrude(height = roof_rise,
                           scale = roof_top_apothem / roof_outer_apothem,
                           convexity = 8)
                polygon(ngon_pts(roof_outer_apothem));
        }
        translate([0, 0, -eps])
            linear_extrude(height = roof_rise - roof_top_thickness + eps,
                           scale = roof_inner_top_apothem / roof_ledge_inner,
                           convexity = 8)
                polygon(ngon_pts(roof_ledge_inner));
        for (i = [0:sides - 1])
            rotate([0, 0, i * 360 / sides])
                thread_ridges(roof_z0, roof_cavity_apothem, thread_depth,
                              thread_tip, thread_clearance + thread_depth,
                              -roof_skirt_h - 2, 2,
                              -sides, sides - 1);
        front_logo_cut(roof_logo_w, roof_outer_apothem, -roof_skirt_h / 2);
    }
}

// The thread's ridges for one wall, in the wall's frame. One start per wall:
// at the +x end the start k is at z0 + k*pitch and at the -x end one pitch
// higher, so the next wall's identical pattern continues it. The ridges are
// cut by the offset miter planes, so neighbouring walls meet at the corners.
// Used for the walls' ridges and, moved out by thread_clearance, as the
// roof's grooves. The roof adds starts below the engaged band so its grooves
// are open at the skirt's bottom edge and can catch the walls' ridges.
module thread_ridges(z0, face_y, depth, tip_half, miter_offset, z_from, z_to,
                     k_from, k_to) {
    base_half = depth + tip_half;
    for (k = [k_from:k_to])
        intersection() {
            hull() {
                for (x = [-wall_side / 2, wall_side / 2])
                    let (zc = z0 + k * thread_pitch
                              + (x < 0 ? thread_pitch : 0))
                        for (p = [[face_y, zc - base_half],
                                  [face_y, zc + base_half],
                                  [face_y + depth, zc - tip_half],
                                  [face_y + depth, zc + tip_half]])
                            translate([x, p[0], p[1]])
                                cube(0.002, center = true);
            }
            translate([0, 0, z_from])
                linear_extrude(z_to - z_from)
                    polygon(miter_plan(miter_offset));
        }
}

// A square tube: collar around the holder.
module square_ring(inner, outer) {
    difference() {
        translate([-outer, -outer]) square(2 * outer);
        translate([-inner, -inner]) square(2 * inner);
    }
}

// Engraves the VeryOS logo into a face on +y, centred at z_centre. The logo
// is left/right symmetric, so the mirror used to get its top up is invisible.
module front_logo_cut(width, face_y, z_centre) {
    translate([0, face_y, z_centre - logo_h(width) / 2])
        rotate([0, 0, 180]) rotate([90, 0, 0]) logo_cut(width);
}
