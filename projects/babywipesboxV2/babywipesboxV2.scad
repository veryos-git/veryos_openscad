// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details

// Three printable parts. All dimensions are millimetres; no libraries required.
// X = width, Y = depth (hinge at +Y), Z = height. See readme.md for assembly.
// V2 adds a 45-degree grip lip to the hinged lid, as in the 2026-10-18 sketch.

/* [View] */
// Export this separated layout to keep all three parts splittable in a slicer.
part = "print_layout"; // [print_layout:All parts on bed, assembly:Assembled (inspection only), exploded:Exploded, box:Box, boxcover:Cover, boxcover_lid:Lid]
lid_angle = 110; // [0:5:180]
exploded_distance = 25; // [0:1:80]

/* [Box dimensions] */
// Outside dimensions of the box, excluding the cover and lid.
box_width = 200; // [100:1:350]
box_depth = 120; // [70:1:250]
box_height = 85; // [25:1:200]
wall_thickness = 2.4; // [1.2:0.2:6]
bottom_thickness = 2.4; // [1.2:0.2:6]
corner_radius = 8; // [4:0.5:25]

/* [Cover and opening] */
cover_thickness = 4; // [2:0.2:10]
// Zero sizes the opening automatically with the box: 53% width, 40% depth.
opening_width = 0; // [0:1:250]
opening_depth = 0; // [0:1:150]
lid_overlap = 4; // [2:0.5:10]
lid_thickness = 3.6; // [2:0.2:8]
// Vertical clearance between the closed lid and the cover.
lid_clearance = 0.25; // [0.1:0.05:1]

/* [Grip lip] */
// Projection beyond the front edge of the capsule-shaped lid (toward -Y).
lip_projection = 9; // [7:0.5:20]
// Total lip height measured from the lid underside, not added to lid_thickness.
lip_height = 5; // [3.6:0.2:10]
lip_width = 16; // [12:1:30]
// The front undercut is always 45 degrees; the latch magnet pad is retained.

/* [Magnets] */
// Ten disc magnets: four cover/box pairs and one cover/lid pair.
magnet_diameter = 6; // [3:0.5:12]
magnet_thickness = 2; // [1:0.5:5]
// Clearance added to the DIAMETER, not to each side.
magnet_diameter_clearance = 0.2; // [0:0.05:0.8]
magnet_depth_clearance = 0.1; // [0:0.05:0.5]

/* [Filament hinge] */
filament_diameter = 1.75;
// Diametral tolerance: the default circular bore is 1.75 + 0.35 = 2.1 mm.
hinge_tolerance = 0.35; // [0.1:0.05:0.6]
hinge_outer_diameter = 6.4; // [4:0.2:10]
hinge_middle_length = 24; // [10:1:50]
hinge_end_length = 10; // [5:1:25]
hinge_axial_clearance = 0.3; // [0.15:0.05:1]

/* [Quality] */
curve_segments = 64; // [32:16:128]

/* [Hidden] */
$fn = curve_segments;
eps = 0.01;
opening_w = opening_width == 0 ? box_width * 0.53 : opening_width;
opening_d = opening_depth == 0 ? box_depth * 0.40 : opening_depth;
lid_w = opening_w + 2 * lid_overlap;
lid_d = opening_d + 2 * lid_overlap;
magnet_pocket_d = magnet_diameter + magnet_diameter_clearance;
magnet_pocket_h = magnet_thickness + magnet_depth_clearance;
magnet_x = box_width / 2 - corner_radius;
magnet_y = box_depth / 2 - corner_radius;
post_r = max(magnet_pocket_d / 2 + 1.6,
             corner_radius - wall_thickness / 2);
tab_r = magnet_pocket_d / 2 + 2;
latch_y = -lid_d / 2 - 1;
lip_front_y = -lid_d / 2 - lip_projection;
lip_back_y = -lid_d / 2 + lid_overlap;
lip_corner_r = min(3, lip_width / 4, (lip_projection + lid_overlap) / 4);
hinge_r = hinge_outer_diameter / 2;
hinge_bore_d = filament_diameter + hinge_tolerance;
hinge_y = lid_d / 2 + hinge_r + 0.8;
lid_z = cover_thickness + lid_clearance;
hinge_z = lid_z + hinge_r;
hinge_length = hinge_middle_length + 2 * (hinge_axial_clearance + hinge_end_length);
hinge_end_x = hinge_middle_length / 2 + hinge_axial_clearance + hinge_end_length / 2;
layout_gap = 15;

assert(part == "assembly" || part == "exploded" || part == "print_layout"
       || part == "box" || part == "boxcover" || part == "boxcover_lid",
       "Unknown part. Choose assembly, exploded, print_layout, box, boxcover or boxcover_lid.");
assert(wall_thickness >= 1.2 && bottom_thickness >= 1.2,
       "Walls and floor must be at least 1.2 mm thick.");
assert(box_width > 2 * corner_radius && box_depth > 2 * corner_radius
       && corner_radius > wall_thickness, "Box/corner dimensions leave no interior.");
assert(magnet_diameter > 0 && magnet_thickness > 0
       && magnet_diameter_clearance >= 0 && magnet_depth_clearance >= 0,
       "Magnet dimensions must be positive and clearances nonnegative.");
assert(post_r <= corner_radius && post_r >= magnet_pocket_d / 2 + 1.2,
       "Increase corner_radius or reduce the magnet diameter to enclose the corner pockets.");
assert(box_height > bottom_thickness + magnet_pocket_h + 1.2,
       "Box is too shallow for its floor and magnet pockets.");
assert(cover_thickness >= magnet_pocket_h + 1.2
       && lid_thickness >= magnet_pocket_h + 1.2,
       "Cover and lid need at least 1.2 mm material behind each magnet.");
assert(opening_w >= opening_d && opening_d > 2 * lid_overlap && lid_overlap >= 2,
       "Opening width must be >= depth; increase opening depth or reduce overlap.");
assert(lid_w / 2 + wall_thickness < magnet_x - post_r,
       "Opening/lid is too wide: leave room for the corner magnets.");
assert(hinge_y + hinge_r + wall_thickness < box_depth / 2
       && -latch_y + tab_r + wall_thickness < box_depth / 2,
       "Opening/lid is too deep: leave space for the hinge and front magnet tab.");
assert(filament_diameter > 0 && hinge_tolerance > 0
       && hinge_outer_diameter >= hinge_bore_d + 2.4,
       "Hinge tubes need positive pin clearance and at least 1.2 mm walls.");
assert(hinge_middle_length >= 6 && hinge_end_length >= 4
       && hinge_axial_clearance > 0,
       "Hinge knuckles are too short or have no axial clearance.");
assert(hinge_middle_length < lid_w - lid_d && hinge_length < lid_w,
       "Hinge is too wide for the lid; enlarge the opening width or shorten the hinge.");
assert(lid_thickness <= 2 * hinge_r && lid_clearance > 0,
       "Lid must fit within the hinge's vertical envelope and clear the cover.");
assert(lip_height >= lid_thickness && lip_height <= 2 * hinge_r,
       "Lip height must be at least lid_thickness and fit within the hinge's vertical envelope.");
assert(lip_width >= 2 * tab_r && lip_width < lid_w - lid_d,
       "Lip must enclose the latch pad and fit on the lid's straight front edge.");
assert(lip_projection > 1 + tab_r && lip_projection > lip_height,
       "Lip must project beyond the latch pad and leave a base under its 45-degree face.");
assert(-lip_front_y + wall_thickness < box_depth / 2,
       "Lip extends too close to the cover edge; reduce lip_projection or opening_depth.");
assert(lid_angle >= 0 && lid_angle <= 180 && exploded_distance >= 0,
       "Use a lid angle from 0 to 180 degrees and a nonnegative explode distance.");
assert(curve_segments >= 24, "Use at least 24 curve segments.");

echo(str("Box outside: ", box_width, " x ", box_depth, " x ", box_height, " mm"));
echo(str("Interior between flat walls: ", box_width - 2 * wall_thickness,
         " x ", box_depth - 2 * wall_thickness, " x ", box_height - bottom_thickness,
         " mm; corner posts intrude into this space."));
echo(str("Use 10 magnets, diameter ", magnet_diameter, " x ", magnet_thickness, " mm."));
echo(str("Hinge bore: ", hinge_bore_d, " mm; filament pin length about ", hinge_length + 2, " mm."));
echo(str("Grip lip: ", lip_projection, " mm projection, ", lip_height,
         " mm total height, ", lip_width, " mm width; 45-degree undercut."));

module rounded_rectangle(w, d, r) {
    hull()
        for (x = [-w / 2 + r, w / 2 - r])
            for (y = [-d / 2 + r, d / 2 - r])
                translate([x, y]) circle(r = r);
}

module capsule(w, d) {
    hull()
        for (x = [-(w - d) / 2, (w - d) / 2])
            translate([x, 0]) circle(d = d);
}

module corner_positions() {
    for (x = [-magnet_x, magnet_x])
        for (y = [-magnet_y, magnet_y])
            translate([x, y, 0]) children();
}

// Blind pockets. The small epsilon opens the mouth without deepening the seat.
module pocket_from_top(z) {
    translate([0, 0, z - magnet_pocket_h])
        cylinder(d = magnet_pocket_d, h = magnet_pocket_h + eps);
}

module pocket_from_bottom(z) {
    translate([0, 0, z - eps])
        cylinder(d = magnet_pocket_d, h = magnet_pocket_h + eps);
}

module box() {
    difference() {
        linear_extrude(box_height)
            rounded_rectangle(box_width, box_depth, corner_radius);
        translate([0, 0, bottom_thickness])
            linear_extrude(box_height)
                difference() {
                    rounded_rectangle(box_width - 2 * wall_thickness,
                                      box_depth - 2 * wall_thickness,
                                      corner_radius - wall_thickness);
                    // Leave full-height corner posts connected to the walls.
                    corner_positions() circle(r = post_r);
                }
        corner_positions() pocket_from_top(box_height);
    }
}

// A tube along X. The same axis and bore are used by every knuckle.
module hinge_tube(x, length) {
    translate([x, hinge_y, hinge_z])
        rotate([0, 90, 0])
            cylinder(d = hinge_outer_diameter, h = length, center = true);
}

module hinge_bore() {
    translate([0, hinge_y, hinge_z])
        rotate([0, 90, 0])
            cylinder(d = hinge_bore_d, h = hinge_length + 2, center = true);
}

module boxcover() {
    difference() {
        union() {
            linear_extrude(cover_thickness)
                rounded_rectangle(box_width, box_depth, corner_radius);
            // Two fixed outer knuckles; supports stay behind the moving lid.
            for (x = [-hinge_end_x, hinge_end_x]) {
                hinge_tube(x, hinge_end_length);
                translate([x - hinge_end_length / 2, hinge_y,
                           cover_thickness - eps])
                    cube([hinge_end_length, hinge_r,
                          hinge_z - cover_thickness + eps]);
            }
        }
        translate([0, 0, -eps])
            linear_extrude(cover_thickness + 2 * eps) capsule(opening_w, opening_d);
        // Corner magnets face DOWN toward the box; the latch faces UP.
        corner_positions() pocket_from_bottom(0);
        translate([0, latch_y, 0]) pocket_from_top(cover_thickness);
        hinge_bore();
    }
}

// A rounded finger grip with a true 1:1 rise/run along its front face.
// Intersect a vertical rounded footprint with a trapezoid extruded along X.
// Polygon coordinates are [Y, Z], relative to the closed lid's underside.
module grip_lip() {
    translate([0, 0, lid_z])
        intersection() {
            translate([0, (lip_front_y + lip_back_y) / 2, 0])
                linear_extrude(lip_height)
                    rounded_rectangle(lip_width, lip_back_y - lip_front_y,
                                      lip_corner_r);
            rotate([90, 0, 90])
                linear_extrude(lip_width + 2 * eps, center = true)
                    polygon([
                        [lip_front_y + lip_height, 0],
                        [lip_back_y, 0],
                        [lip_back_y, lip_height],
                        [lip_front_y, lip_height]
                    ]);
        }
}

// Closed position in cover coordinates, so both hinge axes match exactly.
module boxcover_lid() {
    difference() {
        union() {
            translate([0, 0, lid_z])
                linear_extrude(lid_thickness)
                    union() {
                        capsule(lid_w, lid_d);
                        // Keep the original pad beneath the bevel so the blind
                        // magnet pocket retains its full 2 mm radial wall.
                        translate([0, latch_y]) circle(r = tab_r);
                        // Neck overlaps the lid and joins only the middle knuckle.
                        translate([-hinge_middle_length / 2, lid_d / 2 - lid_overlap])
                            square([hinge_middle_length,
                                    hinge_y - lid_d / 2 + lid_overlap]);
                    }
            grip_lip();
            hinge_tube(0, hinge_middle_length);
        }
        translate([0, latch_y, 0]) pocket_from_bottom(lid_z);
        hinge_bore();
    }
}

module moving_lid(angle) {
    translate([0, hinge_y, hinge_z])
        rotate([-angle, 0, 0])
            translate([0, -hinge_y, -hinge_z]) boxcover_lid();
}

module assembly(explode = 0) {
    color([0.30, 0.40, 0.43]) box();
    translate([0, 0, box_height + explode]) {
        color([0.63, 0.74, 0.72]) boxcover();
        translate([0, 0, explode])
            color([0.91, 0.71, 0.42]) moving_lid(lid_angle);
    }
}

// Each export has its lowest surface at Z=0. No printable pin is generated.
if (part == "box") box();
else if (part == "boxcover") boxcover();
else if (part == "boxcover_lid") translate([0, 0, -lid_z]) boxcover_lid();
else if (part == "print_layout") {
    box();
    translate([0, box_depth + layout_gap, 0]) boxcover();
    translate([box_width / 2 + layout_gap + lid_w / 2, 0, -lid_z]) boxcover_lid();
}
else if (part == "exploded") assembly(exploded_distance);
else assembly();
