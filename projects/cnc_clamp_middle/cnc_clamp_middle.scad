// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details

include <BOSL2/std.scad>

// Middle metal-style plate of a CNC hold-down clamp.
// Rectangular extrusion with rounded corners, a chamfered round hole at
// one end (bolt to T-track) and an adjustment slot at the other end
// (bolt that clamps the workpiece).

/* [Quality] */
$fn = 96;

/* [Plate] */
length        = 35;
width         = 15;
thickness     = 5;
corner_radius = 2;

/* [Round hole] */
hole_d        = 5;
hole_chamfer  = 1;
hole_offset   = 7.5;   // distance from short edge to hole centre

/* [Slot] */
slot_length   = 10;    // travel of the slot (centre-to-centre of end arcs)
slot_width    = 5.5;
slot_offset   = 22.5;  // distance from same short edge to slot centre

module rounded_plate() {
    cuboid([length, width, thickness],
           rounding = corner_radius,
           edges    = "Z",
           anchor   = BOTTOM);
}

module chamfered_hole() {
    translate([-length/2 + hole_offset, 0, 0]) {
        translate([0, 0, -0.01])
            cylinder(d = hole_d, h = thickness + 0.02);
        // 45° countersink that widens the top opening
        translate([0, 0, thickness - hole_chamfer])
            cylinder(d1 = hole_d,
                     d2 = hole_d + 2 * hole_chamfer,
                     h  = hole_chamfer + 0.01);
    }
}

module adjustment_slot() {
    translate([-length/2 + slot_offset, 0, -0.01])
        hull() {
            for (dx = [-slot_length/2, slot_length/2])
                translate([dx, 0, 0])
                    cylinder(d = slot_width, h = thickness + 0.02);
        }
}

difference() {
    rounded_plate();
    chamfered_hole();
    adjustment_slot();
}
