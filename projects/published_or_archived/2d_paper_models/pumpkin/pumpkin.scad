// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Paper pumpkin: cut, fold on the vertical centre line, and glue the halves.
// All dimensions are millimetres. No external libraries are required.

/* [Output] */
view = "pattern"; // [pattern:One body pattern, sheet:Repeated body patterns, stem:Separate brown stem, assembly:Assembled preview]
template = "full"; // [full:Cut flat paper then fold, half:Cut paper already folded]
// Enable for STL export of the flat patterns. Leave off for SVG or DXF.
extrude_patterns = false;

/* [Pumpkin shape] */
// Finished width of a full unfolded piece (also the assembled diameter).
body_width = 110; // [20:1:300]
// Finished height, including any flattened base, but excluding the stem.
body_height = 90; // [20:1:300]
// How far the ellipse centre moves away from the fold, in ellipse radii.
// Zero gives an ellipse; larger values give deeper top and bottom dimples.
inset = 0.65; // [0:0.01:0.9]
// Fraction of the ellipse's vertical radius trimmed off the bottom.
// Height is rescaled so body_height remains the finished height.
base_flattening = 0.06; // [0:0.01:0.4]

/* [Paper and layout] */
// Number of full pieces to cut and glue; also the number of assembled ribs.
piece_count = 12; // [3:1:48]
// Number of pieces across in sheet view. The sheet is not limited to A4.
columns = 3; // [1:1:12]
gap = 8; // [1:1:30]
paper_thickness = 0.25; // [0.1:0.05:1]

/* [Stem] */
show_stem = true;
// Height above the centre fold, not above the pumpkin's shoulders.
stem_height = 42; // [10:1:100]
stem_width = 8; // [2:0.5:20]
// Glue tab hidden inside the top of the pumpkin.
stem_tab = 15; // [1:1:40]
// Horizontal offset at the tip; negative values lean left.
stem_lean = 8; // [-30:1:30]
// Set to zero for a simple stalk without a side branch.
branch_length = 15; // [0:1:40]

/* [Quality] */
// Multiple of four, so width and height include the ellipse's extrema.
curve_segments = 180; // [24:4:360]

/* [Hidden] */
$fn = curve_segments;
radius_x = body_width / (2 * (1 + inset));
radius_y = body_height / (2 - base_flattening);
centre_x = inset * radius_x;
centre_y = (1 - base_flattening) * radius_y;
// The chord at x=0 is the fold. Clipping makes its lower end nonnegative.
fold_bottom = max(0, centre_y - radius_y * sqrt(1 - inset * inset));
fold_top = centre_y + radius_y * sqrt(1 - inset * inset);
pattern_width = template == "half" ? body_width / 2 : body_width;
layout_columns = min(columns, piece_count);
layout_rows = ceil(piece_count / layout_columns);

assert(view == "pattern" || view == "sheet" || view == "stem" || view == "assembly",
       "view must be pattern, sheet, stem, or assembly.");
assert(template == "full" || template == "half", "template must be full or half.");
assert(body_width > 0 && body_height > 0, "Body dimensions must be positive.");
assert(inset >= 0 && inset <= 0.9, "inset must be between 0 and 0.9.");
assert(base_flattening >= 0 && base_flattening <= 0.4,
       "base_flattening must be between 0 and 0.4.");
assert(piece_count >= 3 && piece_count == floor(piece_count),
       "piece_count must be an integer of at least 3.");
assert(columns >= 1 && columns == floor(columns), "columns must be a positive integer.");
assert(gap > 0 && paper_thickness > 0, "gap and paper_thickness must be positive.");
assert(curve_segments >= 24 && curve_segments % 4 == 0,
       "curve_segments must be a multiple of 4, at least 24.");
assert(stem_height > 0 && stem_width > 0 && stem_tab > 0 && branch_length >= 0,
       "Stem dimensions must be positive; branch_length may be zero.");
assert(!(show_stem && view == "assembly") || stem_tab < fold_top - fold_bottom,
       "Shorten stem_tab so it fits inside the centre fold.");

// One ellipse cut along the vertical fold and optionally along the ground.
module half_body_2d() {
    intersection() {
        translate([centre_x, centre_y])
            scale([radius_x, radius_y]) circle(r = 1);
        square([body_width / 2, body_height]);
    }
}

module body_2d() {
    union() {
        half_body_2d();
        mirror([1, 0, 0]) half_body_2d();
    }
}

module template_2d() {
    if (template == "half") half_body_2d();
    else body_2d();
}

// Each cell uses the true bounding box, including for a folded half template.
module sheet_2d() {
    for (i = [0 : piece_count - 1])
        translate([
            (i % layout_columns) * (pattern_width + gap)
                + (template == "full" ? body_width / 2 : 0),
            floor(i / layout_columns) * (body_height + gap)
        ]) template_2d();
}

module stem_2d() {
    union() {
        polygon([
            [-stem_width / 2, -stem_tab],
            [ stem_width / 2, -stem_tab],
            [ stem_width / 2, 0],
            [stem_lean * 0.25 + stem_width * 0.4, stem_height * 0.5],
            [stem_lean + stem_width * 0.3, stem_height],
            [stem_lean - stem_width * 0.3, stem_height],
            [stem_lean * 0.25 - stem_width * 0.4, stem_height * 0.5],
            [-stem_width / 2, 0]
        ]);
        if (branch_length > 0)
            hull() {
                translate([stem_lean * 0.25, stem_height * 0.5])
                    circle(r = stem_width * 0.25);
                translate([stem_lean * 0.25 + branch_length, stem_height * 0.75])
                    circle(r = stem_width * 0.1);
            }
    }
}

// Every glued pair of half-pieces makes one rib with two layers of paper.
// The preview approximates the glue joint as a common central axis.
module assembled_pumpkin() {
    color("DarkOrange")
        for (i = [0 : piece_count - 1])
            rotate([0, 0, i * 360 / piece_count])
                rotate([90, 0, 0])
                    linear_extrude(height = 2 * paper_thickness, center = true)
                        half_body_2d();
    if (show_stem)
        color("SaddleBrown")
            translate([0, 0, fold_top])
                rotate([90, 0, 0])
                    linear_extrude(height = paper_thickness, center = true)
                        stem_2d();
}

module flat_pattern() {
    if (view == "pattern") template_2d();
    else if (view == "sheet") sheet_2d();
    else if (view == "stem") stem_2d();
}

if (view == "assembly") {
    assembled_pumpkin();
} else {
    color(view == "stem" ? "SaddleBrown" : "DarkOrange")
        if (extrude_patterns)
            linear_extrude(height = paper_thickness) flat_pattern();
        else flat_pattern();
}

if (view == "sheet")
    echo(str("Sheet bounds: ", layout_columns * pattern_width + (layout_columns - 1) * gap,
             " x ", layout_rows * body_height + (layout_rows - 1) * gap,
             " mm. Cut ", piece_count, " pieces."));
