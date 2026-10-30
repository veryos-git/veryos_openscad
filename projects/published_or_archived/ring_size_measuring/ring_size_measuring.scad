// Copyright (C) 2026 VeryOS - Licensed under MIT. 

// Ring size measuring rings: each ring has a small tag stamped with
// its inner diameter in mm. Diameters come from the standard ring
// size table — each value corresponds to an integer EU/Germany size.

// --- Sizes (inner diameter in mm) ---
// diameters = [
//     14.0, 14.3, 14.6, 15.0, 15.3, 15.6, 15.9, 16.2, 16.6, 16.9,
//     17.2, 17.5, 17.8, 18.1, 18.5, 18.8, 19.1, 19.4, 19.7, 20.1,
//     20.4, 20.7, 21.0, 21.3, 21.6, 22.0, 22.3
// ];

diameters = [
    14,15,16,17,18,19,20,21,22,23
];

// --- Geometry ---
band_thickness = 1.6;   // radial wall thickness of the ring
band_height    = 5.0;   // axial height of the ring

// --- Text engraved on the ring's outer wall ---
text_size      = 3.0;
text_depth     = 0.6;   // engraving depth into the band wall
text_thicken   = 0.05;   // offset() to widen strokes so the slicer cuts them cleanly
text_font      = "Liberation Sans:style=Bold";

// --- Print layout ---
grid_cols    = 6;
grid_spacing = 3;

$fn = 96;

// Format a diameter: "14" for whole mm, "14.3" for fractional mm.
function fmt1(x) =
    let (i = floor(x), f = round((x - i) * 10))
    f == 0 ? str(i) : str(i, ".", f);

module sized_ring(id) {
    od     = id + 2 * band_thickness;
    band_r = od / 2;

    difference() {
        // Band
        difference() {
            cylinder(h = band_height, d = od);
            translate([0, 0, -0.1])
                cylinder(h = band_height + 0.2, d = id);
        }
        // Engraved size on the outer wall (+Y side).
        // mirror([1,0,0]) cancels the apparent mirroring you'd otherwise
        // see when looking at the engraved face from outside.
        translate([0, band_r + 0.01, band_height / 2])
            rotate([90, 0, 0])
                linear_extrude(text_depth + 0.02)
                    mirror([1, 0, 0])
                        offset(delta = text_thicken)
                            text(fmt1(id),
                                 size   = text_size,
                                 halign = "center",
                                 valign = "center",
                                 font   = text_font);
    }
}

module ring_grid() {
    od_max = diameters[len(diameters) - 1] + 2 * band_thickness;
    cell   = od_max + grid_spacing;
    for (i = [0 : len(diameters) - 1]) {
        col = i % grid_cols;
        row = floor(i / grid_cols);
        translate([col * cell, row * cell, 0])
            sized_ring(diameters[i]);
    }
}

ring_grid();
