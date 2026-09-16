// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details

// =====================================================================
// Lithophane thickness calibration print (step wedge)
// ---------------------------------------------------------------------
// A lithophane prints FLAT and modulates brightness with thickness:
//   thin  -> more light passes -> brighter
//   thick -> less light passes -> darker
// This part is a staircase of tiles, each a whole number of layers
// thick, so you can backlight it and pick the min/max thickness that
// give you good contrast on YOUR filament + light source.
//
// PRINTING
//   - Print flat on the bed, no supports.
//   - Set the slicer layer height equal to `step` (see below) so every
//     tile is an exact integer number of layers.
//   - Use the same filament/colour you will use for the real lithophane.
//   - Backlight the finished print to evaluate each step.
// =====================================================================

/* [Thickness range] */
// Thickness / layer-height increment between steps (mm).
// Set this to your slicer layer height. 0.2 nozzle -> 0.2,
// wider extrusion -> 0.3, 0.4, ... regenerates the whole wedge.
step = 0.2;          // [0.1:0.05:0.6]
// Thinnest section = brightest (mm)
min_thickness = 0.2; // [0.1:0.1:2]
// Thickest section = darkest (mm)
max_thickness = 4.0; // [0.4:0.1:6]

/* [Tile size] */
// X size of each thickness section (mm)
tile_width = 15;
// Y depth of each thickness section (mm)
tile_depth = 25;
// Gap between tiles. 0 = solid staircase (recommended for handling)
gap = 0;

/* [Labels] */
// Emboss the thickness value in front of each tile
show_labels = true;
// Y depth of the label strip in front of the tiles (mm)
label_depth = 9;
// Base thickness of the label strip (mm)
label_thickness = 0.6;
// Height of the raised text above the label strip (mm)
text_emboss = 0.4;
// Text size (mm)
font_size = 4;
// Font
font = "Liberation Sans:style=Bold";

/* [Hidden] */
$fn = 32;
eps = 0.01;

// ---- Derived ----------------------------------------------------------
// Number of steps, inclusive of both ends.
n_steps = floor((max_thickness - min_thickness) / step + 0.5) + 1;
pitch   = tile_width + gap;

echo(str("Steps: ", n_steps,
         "  from ", min_thickness, "mm to ",
         min_thickness + (n_steps - 1) * step, "mm",
         "  (step ", step, "mm)"));

// One-decimal label, e.g. 0.2 -> "0.2", 2 -> "2.0"
function fmt(x) = let(t = round(x * 10)) str(floor(t / 10), ".", t % 10);

// ---- Geometry ---------------------------------------------------------
module wedge() {
    for (i = [0 : n_steps - 1]) {
        t = min_thickness + i * step;
        translate([i * pitch, 0, 0])
            cube([tile_width, tile_depth, t]);
    }
}

module labels() {
    for (i = [0 : n_steps - 1]) {
        t = min_thickness + i * step;
        translate([i * pitch, -label_depth, 0]) {
            // label base strip
            cube([tile_width, label_depth + eps, label_thickness]);
            // raised thickness value, centred on the strip
            translate([tile_width / 2, label_depth / 2, label_thickness - eps])
                linear_extrude(text_emboss + eps)
                    text(fmt(t), size = font_size, font = font,
                         halign = "center", valign = "center");
        }
    }
}

wedge();
if (show_labels) labels();
