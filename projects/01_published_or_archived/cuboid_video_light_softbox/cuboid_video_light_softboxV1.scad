// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// V1: softbox frame for a flat cuboid video light (Ulanzi VL120 RGB),
// reverse-engineered from the Onshape export in existing/softbox (1).stl and
// existing/screw - Part 1 (1).stl.
//
// The light slides through two clamp tunnels on top of the frame. It rests on
// the top plate and shines down through the opening into a pyramid-frustum
// frame. One or two screws press it down onto the plate. A wall cover
// (reflective foil glued to the inside, lip side) is glued over each side
// window. Origin: centre of the light's underside. The frame opens towards -z.
//
// Differences from the Onshape model:
// - Thread: the STL screw (dia 10.2) barely meets the frame hole (dia 12/10).
//   Their threads overlap by only 0.1 mm radially, and the flanks are
//   22.5 degrees. Here both share one 45 degree flank profile (prints without
//   support) and differ only by thread_clearance.
// - The light-opening sides are a 45 degree chamfer on all four sides, and
//   the small cosmetic bevels on the bottom rim are left out.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "assembly"; // [assembly:Assembly preview,frame:Frame,screw:Screw,wallcover_big:Wall cover big (long sides),wallcover_small:Wall cover small (short sides)]

/* [Video light: Ulanzi VL120 RGB] */
light_length = 117; // x, slides through the clamp tunnels along this axis
light_width = 67;   // y
light_height = 16;  // z
// Gap per side between the light and the clamp tunnel walls. The Onshape
// model used 0; raise it if the light does not slide in.
light_side_clearance = 0;
// Extra tunnel height above the light; the screws take it up.
light_headroom = 1;

/* [Frame] */
// Material around the light at the top of the frame.
light_wall = 4.5;
// Length of each clamp tunnel along the light.
clamp_length = 24;
// Clamp roof above the light; holds the screw thread.
clamp_roof = 8;
// How far the top plate reaches under the light, per side.
plate_overlap_x = 13.5;
plate_overlap_y = 7.5;
// Struts and the bottom rim height measured across the walls, and the top
// plate thickness.
frame_thickness = 6;
// Bottom rim width, measured horizontally.
rail_width = 12;
// From the underside of the light down to the front opening.
softbox_depth = 78;
// Side wall tilt from vertical.
wall_angle = 28.6;
// Notch in the top plate on the -y long side, below the light's 1/4" thread.
side_notch_width = 48.7;
// 45 degree bevel on the clamp edges, frame corners and screw holes.
chamfer = 2;

/* [Wall covers] */
wallcover_thickness = 2;
// How far the cover overlaps the frame around the window (glue area).
wallcover_overlap = 2;
// Gap between the lip and the window edges. Below about 1.1 (thickness *
// tan(wall_angle)) the lip's lower edge hits the bottom rim; Onshape used 1.
wallcover_lip_clearance = 1.2;

/* [Screw] */
thread_diameter = 12;
thread_pitch = 2;
// Radial gap between screw and frame thread; raise it if the fit is tight.
thread_clearance = 0.15;
// Threaded shank below the head.
screw_length = 19;
screw_head_width = 15; // across flats
screw_head_height = 6;

/* [Quality] */
$fn = 64;

/* [Hidden] */
eps = 0.01;
cavity_w = light_width + 2 * light_side_clearance;
cavity_h = light_height + light_headroom;
clamp_h = cavity_h + clamp_roof;
// Outer half sizes of the frame at its top (z = 0).
top_x = light_length / 2 + light_wall;
top_y = cavity_w / 2 + light_wall;
clamp_x = top_x - clamp_length / 2;
// Horizontal growth per mm of depth, and the strut thickness measured
// horizontally.
grow = tan(wall_angle);
strut = frame_thickness / cos(wall_angle);
opening_half = [light_length / 2 - plate_overlap_x, light_width / 2 - plate_overlap_y];
thread_depth = 0.4 * thread_pitch;
crest_flat = 0.1 * thread_pitch;
hole_d = thread_diameter + 2 * thread_clearance;

assert(clamp_length < light_length / 2, "Clamps must not meet in the middle.");
assert(opening_half.x > 0 && opening_half.y > 0, "Plate overlap is larger than the light.");
assert(wallcover_lip_clearance >= wallcover_thickness * tan(wall_angle),
       "Wall cover lip would hit the bottom rim; raise wallcover_lip_clearance.");

if (part == "assembly") assembly();
else if (part == "frame") translate([0, 0, softbox_depth]) frame();
else if (part == "screw") screw();
else if (part == "wallcover_big") wallcover(top_x);
else if (part == "wallcover_small") wallcover(top_y);

module assembly() {
    color("dimgray") frame();
    // One cover of each size, so the frame stays visible.
    color("silver") on_side_face(top_y) wallcover(top_x);
    color("silver") rotate([0, 0, 90]) on_side_face(top_x) wallcover(top_y);
    for (s = [-1, 1])
        color("orange")
            translate([s * clamp_x, 0, light_height + screw_length + screw_head_height])
                rotate([180, 0, 0]) screw();
    %translate([0, 0, light_height / 2])
        cube([light_length, light_width, light_height], center = true);
}

module frame() {
    pyramid();
    for (s = [-1, 1]) translate([s * clamp_x, 0, 0]) clamp();
}

// Frustum shell with a window in each side, a top plate the light rests on
// and a rim around the front opening.
module pyramid() {
    difference() {
        frustum(0, softbox_depth, 0, chamfer);
        frustum(softbox_depth - frame_thickness, softbox_depth + 1, rail_width);
        windows();
        hull() {
            layer(opening_half - [1, 1], 1);
            layer(opening_half + [1, 1] * (frame_thickness + 1), -frame_thickness - 1);
        }
        r = 2 * top_y;
        translate([0, -cavity_w / 2, -frame_thickness - eps])
            linear_extrude(frame_thickness + 1)
                polygon([[-side_notch_width / 2, 0], [side_notch_width / 2, 0],
                         [side_notch_width / 2 + r, -r], [-side_notch_width / 2 - r, -r]]);
    }
}

// Each window prism runs straight through two opposite walls. Its sides
// follow the inner faces of the adjacent walls, which leaves the corner struts.
module windows() {
    z0 = -frame_thickness;
    z1 = -(softbox_depth - frame_thickness);
    for (k = [0, 1]) {
        half = k == 0 ? top_x : top_y;
        w0 = half - strut - grow * z0;
        w1 = half - strut - grow * z1;
        rotate([90, 0, 90 * k])
            linear_extrude(4 * (top_x + grow * softbox_depth), center = true)
                polygon([[-w0, z0], [w0, z0], [w1, z1], [-w1, z1]]);
    }
}

// Tunnel the light slides through, with a threaded hole in its roof.
module clamp() {
    hole_minor_r = hole_d / 2 - thread_depth;
    difference() {
        translate([0, 0, -eps]) chamfered_block([clamp_length, 2 * top_y, clamp_h + eps], chamfer);
        translate([-clamp_length, -cavity_w / 2, -1]) cube([2 * clamp_length, cavity_w, cavity_h + 1]);
        translate([0, 0, cavity_h - 1]) threaded_rod(hole_d, clamp_roof + 2);
        translate([0, 0, clamp_h - chamfer])
            cylinder(r1 = hole_minor_r, r2 = hole_minor_r + chamfer + 1, h = chamfer + 1);
    }
}

module screw() {
    w = screw_head_width / 2;
    h = screw_head_height;
    intersection() {
        cylinder(r = w / cos(30), h = h, $fn = 6);
        rotate_extrude() polygon([[0, 0], [w, 0], [w + 1, 1], [w + 1, h - 1], [w, h], [0, h]]);
    }
    translate([0, 0, h - eps]) intersection() {
        threaded_rod(thread_diameter, screw_length + eps);
        // 45 degree tip chamfer leaves a flat pad that presses on the light.
        cylinder(h = screw_length + eps,
                 r1 = thread_diameter / 2 - chamfer + screw_length, r2 = thread_diameter / 2 - chamfer);
    }
}

// Printed flat, lip up. The plate covers the window plus the overlap, and the
// lip sits inside the window.
module wallcover(top_half) {
    linear_extrude(wallcover_thickness)
        offset(delta = wallcover_overlap) window_outline(top_half);
    translate([0, 0, wallcover_thickness - eps])
        linear_extrude(wallcover_thickness + eps)
            offset(delta = -wallcover_lip_clearance) window_outline(top_half);
}

// Window of a side face, flattened into that face's plane: x along the top
// edge, y up the slope with y = 0 at the frame top. top_half is the face's
// half width at the frame top.
module window_outline(top_half) {
    v0 = frame_thickness / cos(wall_angle);
    v1 = (softbox_depth - frame_thickness) / cos(wall_angle);
    w = top_half - strut;
    s = sin(wall_angle);
    polygon([[-w - v0 * s, -v0], [w + v0 * s, -v0], [w + v1 * s, -v1], [-w - v1 * s, -v1]]);
}

// Lays a wall cover on the +y side face whose top edge is dist from the
// centre, lip pointing inwards.
module on_side_face(dist)
    translate([0, dist + wallcover_thickness * cos(wall_angle), wallcover_thickness * sin(wall_angle)])
        rotate([90 + wall_angle, 0, 0]) children();

// Frame-shaped frustum between two depths below the frame top, inset
// horizontally from the outer walls and with chamfered vertical corners.
module frustum(d0, d1, inset = 0, c = 0)
    hull() {
        layer([top_x, top_y] + [1, 1] * (grow * d0 - inset), -d0, c);
        layer([top_x, top_y] + [1, 1] * (grow * d1 - inset), -d1, c);
    }

// Thin horizontal rectangle with half sizes `half` at height z; hull() cap.
module layer(half, z, c = 0)
    translate([0, 0, z]) linear_extrude(eps, center = true)
        offset(delta = c, chamfer = true) square(2 * half - [2, 2] * c, center = true);

// Box from z = 0 with chamfered vertical and top edges.
module chamfered_block(size, c)
    hull() {
        linear_extrude(size.z - c)
            offset(delta = c, chamfer = true) square([size.x, size.y] - [2, 2] * c, center = true);
        linear_extrude(size.z)
            offset(delta = -c) offset(delta = c, chamfer = true)
                square([size.x, size.y] - [2, 2] * c, center = true);
    }

// Threaded rod of major diameter d from z = 0 to h: the screw shank, and,
// with the clearance added, the shape cut for the frame's threaded holes.
module threaded_rod(d, h) {
    r_root = d / 2 - thread_depth;
    intersection() {
        union() {
            cylinder(r = r_root + eps, h = h);
            thread_ridge(r_root, -thread_pitch, h + thread_pitch);
        }
        cylinder(r = d / 2 + 1, h = h);
    }
}

// Sweeps a trapezoid around a right-handed helix. Equal radial depth and
// axial flank run give 45 degree flanks (90 degree included angle).
module thread_ridge(r_root, z0, z1) {
    steps = ceil((z1 - z0) / thread_pitch * $fn);
    half_tip = crest_flat / 2;
    profile = [[r_root - eps, -half_tip - thread_depth - eps],
               [r_root + thread_depth, -half_tip],
               [r_root + thread_depth, half_tip],
               [r_root - eps, half_tip + thread_depth + eps]];
    points = [for (i = [0:steps])
        let(z = z0 + (z1 - z0) * i / steps, a = 360 * z / thread_pitch)
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
