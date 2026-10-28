// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V6: the frame prints in two separate parts and has no corner pillars. The
// wall covers are screwed to the frame anyway, so they bridge the two parts
// and take over the pillars' job. frame_top holds the top plate, the two light
// clamps and the upper row of cover screws. frame_front holds the front rim,
// the clothespin lips and the lower row of cover screws. The four corner
// pillars and all side wall between the two screw bands are gone. Covers and
// screws are unchanged from V5; the tripod cutout is now as wide as the cover
// screw heads allow.
//
// V5: one big wall cover has a rounded, open cutout at its light-side edge
// for fitting and turning the tripod ballhead. Fit this cover on the -y
// long side, aligned with the existing notch in the frame's top plate.
// The other three covers, frame and screws keep their V4 geometry.
//
// V4: V3 with the screws set to the tested values of fdm_optimized_screws.
// The cover thumb screws are 5 mm with a 2 mm pitch and a 10 mm head, instead
// of 6 mm with a 1.5 mm pitch and a 13 mm head, and all threads have 0.25 mm
// clearance. The light clamp screws stay 12 mm: their wide tip spreads the
// pressure on the light. The VeryOS logo is engraved in the outside of the
// big wall covers, and small in the top of one light clamp on the back.
//
// V3: softbox frame for a flat cuboid video light (Ulanzi VL120 RGB). Same
// frame and exchangeable wall covers as V2 (cuboid_video_light_softboxV2.scad):
// each cover spans its whole side face and is held by four printed thumb
// screws threaded straight into the frame wall, two above and two below the
// window.
//
// The fabric clamp ring of V2 is gone. Instead flat lips stick out from the
// front edge: one in the middle of each side and one diagonally from each
// corner. Lay the diffusion fabric over the front opening, pull it taut and
// clip it to the eight lips with clothespins (see clothespin/image.png).
// Without the ring's groove and screws the front rim is narrower, so the
// front opening is bigger than in V2.
//
// Print 2 frame parts, 1-2 screws, 1 wallcover_big, 1 wallcover_tripod,
// 2 wallcover_small and 16 thumb screws. Screw the covers to both frame parts
// before tightening; they hold the two parts together. All threads are
// single-start right-hand with 45 degree flanks.
// Origin: centre of the light's underside; the frame opens towards -z.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on bed,assembly:Assembly preview,frame_top:Frame top (print orientation),frame_front:Frame front (print orientation),screw:Light clamp screw,thumb_screw:Thumb screw (covers),wallcover_big:Wall cover big (plain long side),wallcover_tripod:Wall cover with tripod cutout (-y long side),wallcover_small:Wall cover small (short sides)]

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

/* [Tripod clearance] */
// Width across the long cover, centred below the light's 1/4" thread.
// 0 uses the widest cutout that still leaves hole_margin between the cutout
// and the top-row cover screw heads. Set a smaller positive value to narrow it.
tripod_cutout_width = 0;
// Depth from the light-side edge, measured along the sloping cover.
// Estimated from problem2/image.png; increase for a larger ballhead wheel.
tripod_cutout_depth = 12;
// Rounded inside corners; 0 gives a rectangular cutout.
tripod_cutout_radius = 3;

/* [Logo] */
// The VeryOS logo engraved in the outside of the big wall covers, centred on
// the window, where the lip makes the cover twice as thick.
logo_width = 30;
// The small logo in the top of the +x light clamp, beside the screw.
frame_logo_width = 12;
// Both logos.
logo_depth = 1;

/* [Clothespin lips] */
// Flat tab flush with the front face, one in the middle of each side and one
// at each corner, pointing diagonally outwards. The clothespin's jaws grip it
// from the front and the back.
lip_thickness = 3;
// How far the lip sticks out beyond the frame's outer edge; at the corners
// along the diagonal.
lip_length = 12;
// Across the lip; leaves room to slide the clothespin to either side.
lip_width = 20;

/* [Light clamp screw] */
thread_diameter = 12;
thread_pitch = 2;
// Radial gap between all screws and their frame threads. 0.25 has little play
// and is safe on printers that are not perfectly calibrated.
thread_clearance = 0.25;
// Threaded shank below the head.
screw_length = 19;
screw_head_width = 15; // across flats
screw_head_height = 6;

/* [Thumb screws] */
// 5 mm is the smallest stable size (fdm_optimized_screws).
thumb_thread_diameter = 5;
thumb_thread_pitch = 2;
// 45 degree chamfer at the tip, for an easy start.
thumb_tip_chamfer = 1;
thumb_head_width = 10; // across flats
thumb_head_height = 5;

/* [Screw printing] */
// All screws print lying on a flat of the head, so the layers run along the
// shank and it does not snap between them. This share of the thread diameter
// is cut off their underside, through the shank and the head, which leaves a
// flat they both stand on, so they print without support. 0.1 has printed
// well on the light clamp screw, 0.15 on small screws like the thumb screws.
screw_cut = 0.1;
thumb_screw_cut = 0.15;

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
// The wall cover lip and logo stop hole_margin short of the cover screw
// holes. At the top the hole runs downwards into the wall, so its inner end
// decides.
window_top_z = -((wallcover_screw_inset + thumb_hole_r) * cos(wall_angle)
                 + cover_hole_depth * sin(wall_angle) + hole_margin);
window_bottom_z = -(cover_bottom_v - wallcover_screw_inset - thumb_hole_r - hole_margin) * cos(wall_angle);
// The frame is cut at the old window edges. Each part keeps a solid band
// around the whole perimeter for its row of cover screws, and the corner
// pillars between the bands are gone.
frame_split_top = window_top_z;
frame_split_front = window_bottom_z;
// Large enough to clip the whole frame at either split plane.
clip = 2 * front_half.x + softbox_depth;
layout_gap = 4;
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
// Widest tripod cutout that keeps the top-row cover screw heads fully seated.
tripod_cutout_width_max = 2 * (abs(cover_screws(top_x)[0].x)
                               - thumb_head_width / (2 * cos(30))
                               - hole_margin - eps);
tripod_cutout_width_actual = tripod_cutout_width > 0
                             ? tripod_cutout_width
                             : tripod_cutout_width_max;

assert(clamp_length < light_length / 2, "Clamps must not meet in the middle.");
assert(opening_half.x > 0 && opening_half.y > 0, "Plate overlap is larger than the light.");
assert(wallcover_lip_clearance >= wallcover_thickness * tan(wall_angle),
       "Wall cover lip would hit the frame; raise wallcover_lip_clearance.");
assert(tripod_cutout_width_actual > 0 &&
       tripod_cutout_width_actual / 2 + hole_margin <
           abs(cover_screws(top_x)[0].x) - thumb_head_width / (2 * cos(30)),
       "Tripod cutout must leave room for the cover screws and their heads.");
assert(tripod_cutout_depth > 0 &&
       tripod_cutout_depth < cover_bottom_v - wallcover_screw_inset - thumb_hole_r - hole_margin,
       "Tripod cutout must leave the front screw row and cover edge intact.");
assert(tripod_cutout_radius >= 0 &&
       tripod_cutout_radius <= min(tripod_cutout_width_actual / 2, tripod_cutout_depth),
       "Tripod corner radius must fit within the cutout width and depth.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "frame_top") translate([0, 0, -frame_split_top]) frame_top();
else if (part == "frame_front") translate([0, 0, softbox_depth]) frame_front();
else if (part == "screw") screw_lying();
else if (part == "thumb_screw") thumb_screw_lying();
else if (part == "wallcover_big") wallcover(top_x, true);
else if (part == "wallcover_tripod") wallcover(top_x, true, true);
else if (part == "wallcover_small") wallcover(top_y);

module assembly() {
    frame();
    // Show the notched -y cover and one short cover, leaving the frame visible.
    for (i = [1, 2]) let(f = side_faces[i]) rotate([0, 0, f[0]]) face_frame(f[2]) {
        color("silver") translate([0, 0, -wallcover_thickness])
            wallcover(f[1], i == 1, i == 1);
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

// Every part in its print orientation: the front frame on its front face,
// the top frame on its split face beside it, and the screws inside the front
// opening. The covers lie in two rows behind. About 298 x 288 mm with the
// default sizes.
module print_layout() {
    g = layout_gap;
    thumb_pitch = thumb_head_width / cos(30) + g;
    big = cover_bottom_half(top_x);
    small = cover_bottom_half(top_y);
    row_half = big + small + g / 2;
    // How far the side and corner lips reach beyond the front frame's sides.
    lip_reach = max(lip_length, (lip_length + lip_width / 2 - chamfer) / sqrt(2));
    // Lay the two frame parts side by side. The top frame is turned 90 degrees
    // so its long side runs along y, which keeps the pair within 300 mm.
    front_reach = front_half.x + lip_reach;
    top_half_x = top_y + grow * (-frame_split_top);
    layout_width = 2 * front_reach + g + 2 * top_half_x;
    front_x = front_reach - layout_width / 2;
    top_frame_x = layout_width / 2 - top_half_x;
    translate([front_x, 0, softbox_depth]) frame_front();
    translate([top_frame_x, 0, -frame_split_top]) rotate([0, 0, 90]) frame_top();
    // Screws lie inside the front frame's opening.
    for (i = [0:3], j = [0:3])
        translate([front_x + (i - 1.5) * thumb_pitch,
                   (j - 1.5) * (thumb_head_height + thumb_screw_length + g), 0])
            thumb_screw_lying();
    for (s = [-1, 1])
        translate([front_x + s * (2 * thumb_pitch + (g + screw_head_width / cos(30)) / 2), 0, 0])
            screw_lying();
    // Covers span y from -cover_bottom_v to 0; one big and one small per row.
    for (k = [0, 1])
        translate([0, front_half.y + lip_reach + g + cover_bottom_v + k * (cover_bottom_v + g), 0]) {
            // Exactly one long cover has tripod clearance; the other is plain.
            translate([big - row_half, 0, 0]) wallcover(top_x, true, k == 0);
            translate([row_half - small, 0, 0]) wallcover(top_y);
        }
}

// Both frame parts in place, as the screwed-on covers hold them.
module frame() {
    color("dimgray") frame_top();
    color("gray") frame_front();
}

// Unsplit frame shell: top plate, clamp towers, front rim, lips and all
// cover screw threads. Each printable part is a horizontal slice of it.
module frame_whole() {
    pyramid();
    for (s = [-1, 1]) translate([s * clamp_x, 0, 0]) clamp(s == 1);
    for (f = side_faces) rotate([0, 0, f[0]])
        translate([0, f[2] + grow * softbox_depth, -softbox_depth])
            linear_extrude(lip_thickness) lip_outline(rail_width / 2);
    for (i = [-1, 1], j = [-1, 1])
        translate([i * front_half.x, j * front_half.y, -softbox_depth]) rotate(atan2(j, i) - 90)
            linear_extrude(lip_thickness) lip_outline(lip_width / 2 + 1);
}

// Top part: top plate, both light clamps and the band with the upper row of
// cover screws. It prints standing on the split face.
module frame_top() {
    intersection() {
        frame_whole();
        translate([-clip, -clip, frame_split_top])
            cube([2 * clip, 2 * clip, 2 * clip]);
    }
}

// Front part: front rim, clothespin lips and the band with the lower row of
// cover screws. It prints on its front face, like the V5 frame.
module frame_front() {
    intersection() {
        frame_whole();
        translate([-clip, -clip, -clip])
            cube([2 * clip, 2 * clip, clip + frame_split_front]);
    }
}

// Frustum shell with a top plate the light rests on and a rim around the
// front opening.
module pyramid() {
    difference() {
        frustum(0, softbox_depth, 0, chamfer);
        frustum(frame_thickness, softbox_depth - frame_thickness, strut);
        frustum(softbox_depth - frame_thickness, softbox_depth + 1, rail_width);
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

// Tunnel the light slides through, with a threaded hole in its roof.
// If with_logo, the small logo is engraved in the top, on the +y side of the
// screw, midway to the bevel. +y is up when the light hangs from its 1/4"
// thread, so it reads correctly from behind.
module clamp(with_logo = false) {
    hole_d = thread_diameter + 2 * thread_clearance;
    hole_minor_r = hole_d / 2 - 0.4 * thread_pitch;
    difference() {
        translate([0, 0, -eps]) chamfered_block([clamp_length, 2 * top_y, clamp_h + eps], chamfer);
        translate([-clamp_length, -cavity_w / 2, -1]) cube([2 * clamp_length, cavity_w, cavity_h + 1]);
        translate([0, 0, cavity_h - 1]) threaded_rod(hole_d, clamp_roof + 2, thread_pitch);
        translate([0, 0, clamp_h - chamfer])
            cylinder(r1 = hole_minor_r, r2 = hole_minor_r + chamfer + 1, h = chamfer + 1);
        if (with_logo)
            translate([0, (hole_minor_r + top_y) / 2, clamp_h - logo_depth])
                linear_extrude(logo_depth + 1)
                    scale(frame_logo_width / logo_w) translate([0, -logo_r]) logo();
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

// Light clamp screw.
module screw()
    hex_screw(thread_diameter, thread_pitch, screw_length, screw_head_width, screw_head_height,
              chamfer);

module thumb_screw()
    hex_screw(thumb_thread_diameter, thumb_thread_pitch, thumb_screw_length,
              thumb_head_width, thumb_head_height, thumb_tip_chamfer);

module screw_lying()
    lying(thread_diameter, screw_length, screw_head_width, screw_head_height, screw_cut) screw();

module thumb_screw_lying()
    lying(thumb_thread_diameter, thumb_screw_length, thumb_head_width, thumb_head_height, thumb_screw_cut)
        thumb_screw();

// Lays a screw (the children, upright as hex_screw makes it) on a flat of its
// head, centred on the origin, and cuts off everything below cut * d above
// the shank's lowest point. The cut is the print bed, z = 0.
module lying(d, length, head_width, head_height, cut) {
    axis_z = d * (0.5 - cut);
    translate([0, -(head_height + length) / 2, axis_z]) difference() {
        rotate([-90, 0, 0]) children();
        translate([-head_width, -1, -axis_z - head_width])
            cube([2 * head_width, head_height + length + 2, head_width]);
    }
}

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
// inside the window. If with_logo, the VeryOS logo is engraved in the
// outside, the face on the bed, mirrored so it reads correctly from outside.
// with_tripod_cutout opens the light-side edge through both plate and lip.
module wallcover(top_half, with_logo = false, with_tripod_cutout = false) {
    difference() {
        union() {
            linear_extrude(wallcover_thickness) cover_outline(top_half);
            translate([0, 0, wallcover_thickness - eps])
                linear_extrude(wallcover_thickness + eps)
                    offset(delta = -wallcover_lip_clearance) window_outline(top_half);
        }
        for (p = cover_screws(top_half))
            translate([p.x, p.y, -1]) cylinder(d = thumb_thread_diameter + 0.6, h = wallcover_thickness + 2);
        if (with_tripod_cutout) tripod_cutout();
        if (with_logo)
            translate([0, (window_top_z + window_bottom_z) / (2 * cos(wall_angle)), -1])
                linear_extrude(logo_depth + 1) mirror([1, 0])
                    scale(logo_width / logo_w) translate([0, -logo_r]) logo();
    }
}

// Open U-shaped notch at y = 0. Only the two inside corners are rounded;
// the cutter extends beyond the edge and through the full lip thickness.
module tripod_cutout() {
    w = tripod_cutout_width_actual;
    d = tripod_cutout_depth;
    r = tripod_cutout_radius;
    translate([0, 0, -eps]) linear_extrude(2 * wallcover_thickness + 2 * eps)
        hull() {
            translate([-w / 2, -d + r]) square([w, d - r + eps]);
            if (r > 0)
                for (s = [-1, 1]) translate([s * (w / 2 - r), -d + r]) circle(r = r);
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

// Two rows above and below the window, set in from its corners.
function cover_screws(top_half) =
    [for (v = [wallcover_screw_inset, cover_bottom_v - wallcover_screw_inset], s = [-1, 1])
        [s * (top_half - strut + v * sin(wall_angle) - thumb_hole_r - 3), -v]];

// Puts a side face's plane on the +y face whose top edge is dist from the
// centre: local z = 0 on the face, +z pointing into the frame.
module face_frame(dist)
    translate([0, dist, 0]) rotate([90 + wall_angle, 0, 0]) children();

// A clothespin lip in the front plane: y outwards from the frame's outer edge,
// or along the diagonal from a frame corner, x across it. It reaches `back`
// into the frame so it ends in the rim; at a corner that puts its back edge
// just inside the frame's outer edges. The outer corners are bevelled so they
// do not snag the fabric.
module lip_outline(back) {
    w = lip_width / 2;
    l = lip_length;
    c = chamfer;
    polygon([[-w, -back], [w, -back], [w, l - c], [w - c, l], [c - w, l], [-w, l - c]]);
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
