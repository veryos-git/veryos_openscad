// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details

// Drill-bit adapter sleeves for a self-centering doweling jig that uses a
// 608 bearing (8 mm ID, 7 mm height) as the drill guide.
//
// Each sleeve drops into the bearing's inner race; a centered through-hole
// guides a smaller drill bit. The head sits above the bearing as a finger
// grip and stop.
//
// This file lays out a full set of adapters in a grid, sorted by bit size.

/* [Quality] */
$fn = 128;

/* [Bearing fit] */
bearing_id = 8;                // 608 bearing inner diameter
bearing_height = 7;            // 608 bearing height (= shaft length)
shaft_clearance = 0.15;        // subtracted from bearing_id for slip fit

/* [Drill] */
drill_clearance = 0.15;        // added to drill_diameter for the guide hole

/* [Head] */
head_diameter = 14;            // finger-grip outer diameter
head_height = 5;               // grip height above bearing top face

/* [Layout] */
columns = 5;                   // adapters per row
gap = 2;                       // gap between heads

// ---------- Derived ----------
shaft_d = bearing_id - shaft_clearance;
total_h = bearing_height + head_height;
drill_sizes = [for (i = [0:13]) 1.0 + i * 0.5];   // 1.0 .. 7.5 mm step 0.5
spacing = head_diameter + gap;

// ---------- Part ----------
module adapter(drill_d) {
    difference() {
        union() {
            cylinder(d = shaft_d,       h = bearing_height);
            translate([0, 0, bearing_height])
                cylinder(d = head_diameter, h = head_height);
        }
        translate([0, 0, -1])
            cylinder(d = drill_d + drill_clearance, h = total_h + 2);
    }
}

// ---------- Layout ----------
for (i = [0:len(drill_sizes)-1]) {
    col = i % columns;
    row = floor(i / columns);
    translate([col * spacing, row * spacing, 0])
        adapter(drill_sizes[i]);
}
