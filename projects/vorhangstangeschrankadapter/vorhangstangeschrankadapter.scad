// Open-top curtain / wardrobe rod holder. All dimensions are in mm.
// Print with the flat mounting face on the bed (the default orientation).
// When mounted: +Y is up, +Z points from the cabinet wall along the rod.
// Two identical holders fit opposite cabinet walls; no mirrored part is needed.
// Uses only built-in OpenSCAD geometry; no external libraries required.

/* [Rod] */
rod_shape = "square"; // [square:Square or rectangular, round:Round]
rod_width = 18; // [5:0.1:80]
rod_height = 18; // [5:0.1:80]
rod_diameter = 18; // [5:0.1:80]
// TOTAL clearance: 18 mm becomes 18.5 mm, not 19 mm.
tolerance = 0.5; // [0:0.05:2]

/* [Holder] */
// Length of the supporting socket along the rod, excluding the backplate.
socket_depth = 20; // [8:1:60]
wall_thickness = 4; // [2:0.2:10]
plate_thickness = 4; // [3:0.2:10]
// Small bevel at the two upper lips, easing insertion from above.
entry_chamfer = 0.6; // [0:0.1:2]

/* [Mounting screws] */
// Three accessible through holes, with 90-degree countersinks on the front.
screw_diameter = 4.2; // [2:0.1:8]
screw_head_diameter = 8.2; // [4:0.1:16]
// Material between the screw head and the socket / outside of the plate.
screw_edge_margin = 3; // [2:0.5:8]

/* [Output] */
layout = "single"; // [single:One holder, pair:Two holders for printing]
part_spacing = 8; // [2:1:30]

/* [Hidden] */
$fn = 96;
eps = 0.01;
is_round = rod_shape == "round";
opening_width = (is_round ? rod_diameter : rod_width) + tolerance;
opening_height = (is_round ? rod_diameter : rod_height) + tolerance;
half_width = opening_width / 2;
half_height = opening_height / 2;
outer_half_width = half_width + wall_thickness;
socket_bottom = -half_height - wall_thickness;
socket_top = half_height;
wing_width = screw_head_diameter + 2 * screw_edge_margin;
plate_width = 2 * outer_half_width + 2 * wing_width;
plate_bottom = socket_bottom - wing_width;
// Keep the side screw heads inside the plate even for very small rods.
plate_top = max(socket_top, screw_head_diameter / 2) + screw_edge_margin;
plate_height = plate_top - plate_bottom;
plate_corner_radius = min(3, wing_width / 4, plate_height / 4);
screw_x = outer_half_width + wing_width / 2;
screw_bottom_y = socket_bottom - wing_width / 2;
countersink_depth = (screw_head_diameter - screw_diameter) / 2;

assert(rod_shape == "square" || rod_shape == "round",
       "rod_shape must be square or round.");
assert(layout == "single" || layout == "pair",
       "layout must be single or pair.");
assert(is_round ? rod_diameter > 0 : rod_width > 0 && rod_height > 0,
       "Rod dimensions must be positive.");
assert(tolerance >= 0, "Tolerance must not be negative.");
assert(socket_depth > 0 && wall_thickness >= 2 && plate_thickness >= 2,
       "Use a positive socket depth and at least 2 mm wall / plate thickness.");
assert(screw_diameter > 0 && screw_head_diameter >= screw_diameter,
       "The screw head diameter must be at least the shaft diameter.");
assert(plate_thickness - countersink_depth >= 1.2,
       "Countersink leaves less than 1.2 mm of plate; increase plate_thickness.");
assert(screw_edge_margin >= 2, "Leave at least 2 mm around the screw heads.");
assert(entry_chamfer >= 0 && entry_chamfer <= wall_thickness / 2
       && entry_chamfer < half_height,
       "Entry chamfer must fit within half the wall and the upper socket lip.");
assert(part_spacing > 0, "Part spacing must be positive.");

module mounting_plate_outline() {
    // Rounded corners in the bed plane retain a completely flat rear face.
    hull()
        for (x = [-plate_width / 2 + plate_corner_radius,
                   plate_width / 2 - plate_corner_radius])
            for (y = [plate_bottom + plate_corner_radius,
                      plate_top - plate_corner_radius])
                translate([x, y]) circle(r = plate_corner_radius);
}

module socket_blank_outline() {
    if (is_round) {
        // Semicircular lower saddle plus straight upper sides. The full-width
        // mouth lets a round rod drop in vertically without a snap fit.
        union() {
            intersection() {
                circle(r = outer_half_width);
                translate([-outer_half_width, -outer_half_width])
                    square([2 * outer_half_width, outer_half_width]);
            }
            translate([-outer_half_width, 0])
                square([2 * outer_half_width, socket_top]);
        }
    } else {
        translate([-outer_half_width, socket_bottom])
            square([2 * outer_half_width, socket_top - socket_bottom]);
    }
}

module socket_opening_outline() {
    if (is_round) {
        circle(d = opening_width);
        translate([-half_width, 0])
            square([opening_width, socket_top + eps]);
    } else {
        // Sharp inside corners accommodate an unmodified square wood profile.
        translate([-half_width, -half_height])
            square([opening_width, opening_height + eps]);
    }

    if (entry_chamfer > 0)
        polygon([
            [-half_width, socket_top - entry_chamfer],
            [ half_width, socket_top - entry_chamfer],
            [ half_width + entry_chamfer + eps, socket_top + eps],
            [-half_width - entry_chamfer - eps, socket_top + eps]
        ]);
}

module screw_cutout() {
    translate([0, 0, -eps])
        cylinder(d = screw_diameter, h = plate_thickness + 2 * eps);
    if (countersink_depth > 0)
        translate([0, 0, plate_thickness - countersink_depth])
            cylinder(d1 = screw_diameter, d2 = screw_head_diameter + 2 * eps,
                     h = countersink_depth + eps);
}

module holder() {
    difference() {
        union() {
            linear_extrude(height = plate_thickness)
                mounting_plate_outline();
            // Slight overlap with the plate avoids coplanar joining faces.
            // The solid plate is the axial end stop behind the rod.
            translate([0, 0, plate_thickness - eps])
                linear_extrude(height = socket_depth + eps)
                    difference() {
                        socket_blank_outline();
                        socket_opening_outline();
                    }
        }
        for (position = [[-screw_x, 0], [screw_x, 0], [0, screw_bottom_y]])
            translate([position[0], position[1], 0]) screw_cutout();
    }
}

echo(shape = rod_shape, opening_mm = [opening_width, opening_height],
     overall_mm = [plate_width, plate_height, plate_thickness + socket_depth]);

if (layout == "pair") {
    for (side = [-1, 1])
        translate([side * (plate_width + part_spacing) / 2, 0, 0]) holder();
} else {
    holder();
}
