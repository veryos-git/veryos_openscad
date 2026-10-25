// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// V3: softbox frame for a flat cuboid video light (Ulanzi VL120 RGB). Same
// frame and exchangeable wall covers as V2 (cuboid_video_light_softboxV2.scad):
// each cover spans its whole side face and is held by four printed thumb
// screws threaded straight into the frame wall, two above and two below the
// window.
//
// The fabric clamp ring of V2 is gone. Instead a flat lip sticks out
// diagonally from each corner of the front edge. Lay the diffusion fabric
// over the front opening, pull it taut and clip its corners to the four lips
// with clothespins (see clothespin/image.png). Without the ring's groove and screws the front
// rim is narrower, so the front opening is bigger than in V2.
//
// Print 1 frame, 1-2 screws, 2 wallcover_big, 2 wallcover_small and 16 thumb
// screws. All threads are single-start right-hand with 45 degree flanks.
// Origin: centre of the light's underside; the frame opens towards -z.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on bed,assembly:Assembly preview,frame:Frame,screw:Light clamp screw,thumb_screw:Thumb screw (covers),wallcover_big:Wall cover big (long sides),wallcover_small:Wall cover small (short sides)]

/* [Video light: Ulanzi VL120 RGB] */
light_length = 116; // x, slides through the clamp tunnels along this axis
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
// General frame thickness: struts and front rim height measured across the
// walls, and the top plate. The thumb screw length follows it.
frame_thickness = 5.5;
// Material left between the thumb screw holes and the inside of the wall or
// the windows.
hole_margin = 0.8;
// Front rim width, measured horizontally.
rail_width = 12;
// From the underside of the light down to the front opening.
softbox_depth = 60;
// Side wall tilt from vertical.
wall_angle = 24;
// Notch in the top plate on the -y long side, below the light's 1/4" thread.
side_notch_width = 48.7;
// 45 degree bevel on the clamp edges, frame corners and screw holes.
chamfer = 2;

/* [Wall covers] */
wallcover_thickness = 2;
// Gap between the lip and the window edges. Below about 1.1 (thickness *
// tan(wall_angle)) the lip's lower edge hits the frame.
wallcover_lip_clearance = 1.2;
// Distance of the thumb screw rows from the cover's top and bottom edges.
wallcover_screw_inset = 8;

/* [Clothespin lips] */
// Flat tab flush with the front face, one at each corner, pointing
// diagonally outwards. The clothespin's jaws grip it from the front and the
// back.
lip_thickness = 3;
// How far the lip sticks out beyond the frame corner, along the diagonal.
lip_length = 12;
// Across the lip; leaves room to slide the clothespin to either side.
lip_width = 20;

/* [Light clamp screw] */
thread_diameter = 12;
thread_pitch = 2;
// Radial gap between all screws and their frame threads; raise it if the fit
// is tight.
thread_clearance = 0.15;
// Threaded shank below the head.
screw_length = 19;
screw_head_width = 15; // across flats
screw_head_height = 6;

/* [Thumb screws] */
thumb_thread_diameter = 7;
thumb_thread_pitch = 1.5;
// 45 degree chamfer at the tip, for an easy start.
thumb_tip_chamfer = 1;
thumb_head_width = 13; // across flats
thumb_head_height = 5;

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
// Outer half sizes at the front rim.
front_half = [top_x, top_y] + [1, 1] * grow * softbox_depth;
opening_half = [light_length / 2 - plate_overlap_x, light_width / 2 - plate_overlap_y];
// Side faces as [rotation about z, half width at the top, distance from the
// centre at the top]. Rotating the +y face by 90 gives the -x face.
side_faces = [[0, top_x, top_y], [180, top_x, top_y], [90, top_y, top_x], [270, top_y, top_x]];
// Positions on a side face are measured along the slope from the frame top.
// Covers end 1 mm above the lips.
cover_bottom_v = (softbox_depth - lip_thickness - 1) / cos(wall_angle);
thumb_hole_r = thumb_thread_diameter / 2 + thread_clearance;
// Depth of the cover screw holes, square to the face.
cover_hole_depth = frame_thickness - hole_margin;
// Threaded shank: wall cover plus hole, 0.5 mm short of the hole's end.
thumb_screw_length = wallcover_thickness + cover_hole_depth - 0.5;
// Windows stop hole_margin short of the cover screw holes. At the top the
// hole runs downwards into the wall, so its inner end decides.
window_top_z = -((wallcover_screw_inset + thumb_hole_r) * cos(wall_angle)
                 + cover_hole_depth * sin(wall_angle) + hole_margin);
window_bottom_z = -(cover_bottom_v - wallcover_screw_inset - thumb_hole_r - hole_margin) * cos(wall_angle);
layout_gap = 5;

assert(clamp_length < light_length / 2, "Clamps must not meet in the middle.");
assert(opening_half.x > 0 && opening_half.y > 0, "Plate overlap is larger than the light.");
assert(wallcover_lip_clearance >= wallcover_thickness * tan(wall_angle),
       "Wall cover lip would hit the frame; raise wallcover_lip_clearance.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "frame") translate([0, 0, softbox_depth]) frame();
else if (part == "screw") screw();
else if (part == "thumb_screw") thumb_screw_lying();
else if (part == "wallcover_big") wallcover(top_x);
else if (part == "wallcover_small") wallcover(top_y);

module assembly() {
    color("dimgray") frame();
    // One cover of each size, so the frame stays visible.
    for (f = [side_faces[0], side_faces[2]]) rotate([0, 0, f[0]]) face_frame(f[2]) {
        color("silver") translate([0, 0, -wallcover_thickness]) wallcover(f[1]);
        for (p = cover_screws(f[1]))
            color("orange")
                translate([p.x, p.y, -wallcover_thickness - thumb_head_height]) thumb_screw();
    }
    for (s = [-1, 1])
        color("orange")
            translate([s * clamp_x, 0, light_height + screw_length + screw_head_height])
                rotate([180, 0, 0]) screw();
    %translate([0, 0, light_height / 2])
        cube([light_length, light_width, light_height], center = true);
}

// Every part in its print orientation: the frame on its front rim, the rest
// as noted at their modules. All screws print inside the frame, the thumb
// screws lying, and the covers in two rows behind it. About 300 x 290 mm with
// the default sizes.
module print_layout() {
    g = layout_gap;
    thumb_pitch = thumb_head_width / cos(30) + g;
    translate([0, 0, softbox_depth]) frame();
    for (i = [0:3], j = [0:3])
        translate([(i - 1.5) * thumb_pitch, (j - 1.5) * (thumb_head_height + thumb_screw_length + g), 0])
            thumb_screw_lying();
    for (s = [-1, 1])
        translate([s * (2 * thumb_pitch + (g + screw_head_width / cos(30)) / 2), 0, 0]) screw();
    // Covers span y from -cover_bottom_v to 0; one big and one small per row.
    big = cover_bottom_half(top_x);
    small = cover_bottom_half(top_y);
    row_half = big + small + g / 2;
    // How far the corner lips reach beyond the frame sides.
    lip_reach = (lip_length + lip_width / 2 - chamfer) / sqrt(2);
    for (k = [0, 1])
        translate([0, front_half.y + lip_reach + g + cover_bottom_v + k * (cover_bottom_v + g), 0]) {
            translate([big - row_half, 0, 0]) wallcover(top_x);
            translate([row_half - small, 0, 0]) wallcover(top_y);
        }
}

module frame() {
    pyramid();
    for (s = [-1, 1]) translate([s * clamp_x, 0, 0]) clamp();
    for (i = [-1, 1], j = [-1, 1])
        translate([i * front_half.x, j * front_half.y, -softbox_depth]) rotate(atan2(j, i) - 90)
            linear_extrude(lip_thickness) lip_outline();
}

// Frustum shell with a window in each side, a top plate the light rests on
// and a rim around the front opening.
module pyramid() {
    difference() {
        frustum(0, softbox_depth, 0, chamfer);
        frustum(frame_thickness, softbox_depth - frame_thickness, strut);
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
        for (f = side_faces) rotate([0, 0, f[0]]) face_frame(f[2])
            for (p = cover_screws(f[1])) translate([p.x, p.y, 0]) thumb_thread_hole(cover_hole_depth);
    }
}

// Each window prism runs straight through two opposite walls. Its sides
// follow the inner faces of the adjacent walls, which leaves the corner struts.
module windows() {
    z0 = window_top_z;
    z1 = window_bottom_z;
    for (k = [0, 1]) {
        half = k == 0 ? top_x : top_y;
        w0 = half - strut - grow * z0;
        w1 = half - strut - grow * z1;
        rotate([90, 0, 90 * k])
            linear_extrude(4 * front_half.x, center = true)
                polygon([[-w0, z0], [w0, z0], [w1, z1], [-w1, z1]]);
    }
}

// Tunnel the light slides through, with a threaded hole in its roof.
module clamp() {
    hole_d = thread_diameter + 2 * thread_clearance;
    hole_minor_r = hole_d / 2 - 0.4 * thread_pitch;
    difference() {
        translate([0, 0, -eps]) chamfered_block([clamp_length, 2 * top_y, clamp_h + eps], chamfer);
        translate([-clamp_length, -cavity_w / 2, -1]) cube([2 * clamp_length, cavity_w, cavity_h + 1]);
        translate([0, 0, cavity_h - 1]) threaded_rod(hole_d, clamp_roof + 2, thread_pitch);
        translate([0, 0, clamp_h - chamfer])
            cylinder(r1 = hole_minor_r, r2 = hole_minor_r + chamfer + 1, h = chamfer + 1);
    }
}

// Threaded hole for a thumb screw, from z = 0 to `depth`, with a 45 degree
// lead-in at z = 0.
module thumb_thread_hole(depth) {
    thread_h = 0.4 * thumb_thread_pitch;
    translate([0, 0, -1]) {
        threaded_rod(2 * thumb_hole_r, depth + 1, thumb_thread_pitch);
        cylinder(r1 = thumb_hole_r + 1, r2 = thumb_hole_r - thread_h, h = 1 + thread_h);
    }
}

// Printed head down.
module screw()
    hex_screw(thread_diameter, thread_pitch, screw_length, screw_head_width, screw_head_height,
              chamfer);

module thumb_screw()
    hex_screw(thumb_thread_diameter, thumb_thread_pitch, thumb_screw_length,
              thumb_head_width, thumb_head_height, thumb_tip_chamfer);

// Lies on a flat of the head, centred on the origin, so the layers run along
// the shank and it does not snap between them. The shank needs support.
module thumb_screw_lying()
    translate([0, -(thumb_head_height + thumb_screw_length) / 2, thumb_head_width / 2])
        rotate([-90, 0, 0]) thumb_screw();

// Hex head with bevelled corners on z = 0, shank upwards.
module hex_screw(d, pitch, length, head_width, head_height, tip) {
    w = head_width / 2;
    h = head_height;
    intersection() {
        cylinder(r = w / cos(30), h = h, $fn = 6);
        rotate_extrude() polygon([[0, 0], [w, 0], [w + 1, 1], [w + 1, h - 1], [w, h], [0, h]]);
    }
    translate([0, 0, h - eps]) intersection() {
        threaded_rod(d, length + eps, pitch);
        // 45 degree tip chamfer eases the start into the thread. On the light
        // clamp screw it also leaves a flat pad that presses on the light.
        cylinder(h = length + eps, r1 = d / 2 - tip + length, r2 = d / 2 - tip);
    }
}

// Printed flat, lip up. The plate covers the whole side face and the lip sits
// inside the window.
module wallcover(top_half) {
    difference() {
        union() {
            linear_extrude(wallcover_thickness) cover_outline(top_half);
            translate([0, 0, wallcover_thickness - eps])
                linear_extrude(wallcover_thickness + eps)
                    offset(delta = -wallcover_lip_clearance) window_outline(top_half);
        }
        for (p = cover_screws(top_half))
            translate([p.x, p.y, -1]) cylinder(d = thumb_thread_diameter + 0.6, h = wallcover_thickness + 2);
    }
}

// Shapes in a side face's plane: x along the top edge, y up the slope with
// y = 0 at the frame top. top_half is the face's half width at the frame top.

// Up to the corner bevels, minus 0.5 mm.
module cover_outline(top_half) {
    w = top_half - chamfer - 0.5;
    s = sin(wall_angle);
    v = cover_bottom_v;
    polygon([[-w, 0], [w, 0], [w + v * s, -v], [-w - v * s, -v]]);
}

// Half width of the cover outline at its bottom edge.
function cover_bottom_half(top_half) = top_half - chamfer - 0.5 + cover_bottom_v * sin(wall_angle);

module window_outline(top_half) {
    v0 = -window_top_z / cos(wall_angle);
    v1 = -window_bottom_z / cos(wall_angle);
    w = top_half - strut;
    s = sin(wall_angle);
    polygon([[-w - v0 * s, -v0], [w + v0 * s, -v0], [w + v1 * s, -v1], [-w - v1 * s, -v1]]);
}

// Two rows above and below the window, set in from its corners.
function cover_screws(top_half) =
    [for (v = [wallcover_screw_inset, cover_bottom_v - wallcover_screw_inset], s = [-1, 1])
        [s * (top_half - strut + v * sin(wall_angle) - thumb_hole_r - 3), -v]];

// Puts a side face's plane on the +y face whose top edge is dist from the
// centre: local z = 0 on the face, +z pointing into the frame.
module face_frame(dist)
    translate([0, dist, 0]) rotate([90 + wall_angle, 0, 0]) children();

// A clothespin lip in the front plane: y outwards along the diagonal from the
// frame corner, x across it. Its back edge cuts across the corner just inside
// the frame's outer edges, so it ends in the rim. The outer corners are
// bevelled so they do not snag the fabric.
module lip_outline() {
    w = lip_width / 2;
    l = lip_length;
    c = chamfer;
    polygon([[-w, -w - 1], [w, -w - 1], [w, l - c], [w - c, l], [c - w, l], [-w, l - c]]);
}

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

// Threaded rod of major diameter d from z = 0 to h: a screw shank, and, with
// the clearance added, the shape cut for a threaded hole. render() keeps the
// preview working with this many threads.
module threaded_rod(d, h, pitch) {
    r_root = d / 2 - 0.4 * pitch;
    render(convexity = 4) intersection() {
        union() {
            cylinder(r = r_root + eps, h = h);
            thread_ridge(r_root, -pitch, h + pitch, pitch);
        }
        cylinder(r = d / 2 + 1, h = h);
    }
}

// Sweeps a trapezoid around a right-handed helix. Equal radial depth and
// axial flank run give 45 degree flanks (90 degree included angle).
module thread_ridge(r_root, z0, z1, pitch) {
    depth = 0.4 * pitch;
    half_tip = 0.05 * pitch;
    steps = ceil((z1 - z0) / pitch * $fn);
    profile = [[r_root - eps, -half_tip - depth - eps],
               [r_root + depth, -half_tip],
               [r_root + depth, half_tip],
               [r_root - eps, half_tip + depth + eps]];
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
