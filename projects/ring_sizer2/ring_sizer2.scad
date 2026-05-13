// Copyright (C) [2026] VeryOS [Jonas Immanuel Frey] - Licensed under GPL. See LICENSE file for details`

// Ring sizer 2: a fan of measuring rings (ID 14-21.5 mm) sized to the
// common US / EU / JP standards. Small rings are arranged around a
// central disk; each small ring's inner edge is tangent to the disk's
// outer edge, so the small ring's band overlaps the disk's band by
// band_thickness mm and welds to it.

// --- Sizes: [inner_diameter_mm, US, EU, JP] ---
sizes = [
    [14.0, "3",    "44", "4"],
    [14.9, "4",    "47", "7"],
    [15.5, "4.75", "49", "9"],
    [15.8, "5",    "50", "9"],
    [16.5, "6",    "52", "12"],
    [17.3, "7",    "54", "14"],
    [18.2, "8",    "57", "17"],
    [19.0, "9",    "59", "19"],
    [19.8, "10",   "62", "22"],
    [20.6, "11",   "65", "24"],
    [21.5, "12",   "68", "27"],
];

// --- Geometry ---
big_outer_d    = 130;   // outer diameter of the central disk
big_inner_d    = 30;    // inner-hole diameter (set to 0 for a solid disk)
band_thickness = 1.2;   // radial wall thickness of each small ring
band_height    = 5.0;   // axial height of all parts

// --- Engraved label (5 lines per ring) ---
text_size      = 5.0;
text_line_gap  = 1.15;  // line spacing as a multiple of text_size
text_depth     = 2.0;
text_thicken   = 0.05;  // widens strokes so the slicer cuts them cleanly
text_font      = "Liberation Sans:style=Bold";

$fn = 96;

// Format a diameter with one decimal: 14 -> "14.0", 15.5 -> "15.5".
function fmt1(x) =
    let (i = floor(x), f = round((x - i) * 10))
    str(i, ".", f);

module big_disk() {
    difference() {
        cylinder(h = band_height, d = big_outer_d);
        if (big_inner_d > 0)
            translate([0, 0, -0.1])
                cylinder(h = band_height + 0.2, d = big_inner_d);
    }
}

module small_ring(id) {
    od = id + 2 * band_thickness;
    difference() {
        cylinder(h = band_height, d = od);
        translate([0, 0, -0.1])
            cylinder(h = band_height + 0.2, d = id);
    }
}

// Stack lines vertically along local Y, centred at origin. Line 0 sits
// at the top; the outer rotations place the top line at the smallest
// radius (closest to the disk's centre hole).
module label_lines(lines) {
    n     = len(lines);
    pitch = text_size * text_line_gap;
    for (i = [0 : n - 1]) {
        y = (n - 1) * pitch / 2 - i * pitch;
        translate([0, y])
            text(lines[i],
                 size   = text_size,
                 halign = "center",
                 valign = "center",
                 font   = text_font);
    }
}

module sizer() {
    n     = len(sizes);
    big_r = big_outer_d / 2;
    // Mid-radius of the disk's band: where the label block sits.
    lr    = (big_inner_d + big_outer_d) / 4;

    difference() {
        union() {
            big_disk();
            for (i = [0 : n - 1]) {
                id = sizes[i][0];
                cr = big_r + id / 2;       // small ring inner edge tangent to disk outer edge
                a  = 360 * i / n;
                rotate([0, 0, a])
                    translate([cr, 0, 0])
                        small_ring(id);
            }
        }
        // Labels read tangentially, with character tops pointing toward
        // the disk's centre (matches the orientation in the reference
        // photo: rotate the disk to bring each label upright).
        for (i = [0 : n - 1]) {
            s     = sizes[i];
            a     = 360 * i / n;
            lines = [
                fmt1(s[0]),
                "mm",
                str("US ", s[1]),
                str("EU ", s[2]),
                str("JP ", s[3]),
            ];
            rotate([0, 0, a])
                translate([lr, 0, band_height - text_depth + 0.01])
                    rotate([0, 0, 90])
                        linear_extrude(text_depth + 0.02)
                            offset(delta = text_thicken)
                                label_lines(lines);
        }
    }
}

sizer();
