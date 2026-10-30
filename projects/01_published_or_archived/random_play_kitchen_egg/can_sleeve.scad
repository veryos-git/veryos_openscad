// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
//
// Parametric beverage can sleeve (koozie) for FDM 3D printing.
// Prints upright without supports. Requires OpenSCAD 2021.01+ (for textmetrics).

/* [Can Size] */
can_preset = "330ml_standard"; // [250ml_standard, 330ml_standard, 355ml_standard, 473ml_standard, 500ml_standard, 330ml_sleek, 355ml_sleek, custom]
can_diameter = 66.1; // [40:0.1:100]
can_height = 115.2;  // [50:0.1:250]

/* [Sleeve Geometry] */
wall_thickness = 2.0; // [1:0.5:6]
base_thickness = 2.0; // [1:0.5:6]
tolerance = 0.4;      // [0.1:0.05:1.5]

/* [Insulation Ribs] */
ribs_enabled = true;
rib_count = 8;   // [0:24]
rib_depth = 0.8; // [0.2:0.1:2]
rib_width = 1.5; // [0.5:0.5:5]

/* [Text] */
custom_text = "DRINK";
text_mode = "engraved"; // [engraved, embossed]
text_font = "Arial:style=Bold";
text_size = 12;      // [6:1:30]
text_depth = 1.0;    // [0.5:0.1:2]
text_position = "vertical"; // [vertical, horizontal]

/* [Hidden] */
$fn = 128;
chamfer_h = 1.5;
chamfer_w = 1.0;

// ---- Can size lookup -------------------------------------------
function get_can_d(p) =
    p == "250ml_standard" ? 66.1 :
    p == "330ml_standard" ? 66.1 :
    p == "355ml_standard" ? 66.1 :
    p == "473ml_standard" ? 66.1 :
    p == "500ml_standard" ? 66.1 :
    p == "330ml_sleek"    ? 57.4 :
    p == "355ml_sleek"    ? 57.4 : can_diameter;

function get_can_h(p) =
    p == "250ml_standard" ? 91.0  :
    p == "330ml_standard" ? 115.2 :
    p == "355ml_standard" ? 122.2 :
    p == "473ml_standard" ? 152.0 :
    p == "500ml_standard" ? 167.8 :
    p == "330ml_sleek"    ? 146.1 :
    p == "355ml_sleek"    ? 156.2 : can_height;

// ---- Derived dimensions ----------------------------------------
c_d = get_can_d(can_preset);
c_h = get_can_h(can_preset);
inner_r = c_d / 2 + tolerance;
outer_r = inner_r + wall_thickness;
sleeve_h = c_h + base_thickness;

// ---- Main assembly ---------------------------------------------
module can_sleeve() {
    difference() {
        // Solid outer body
        cylinder(h = sleeve_h, r = outer_r);

        // Hollow out the inside, leaving a solid base
        translate([0, 0, base_thickness])
        cylinder(h = c_h + 0.01, r = inner_r);

        // Chamfer the top inner lip to guide can insertion
        translate([0, 0, sleeve_h - chamfer_h])
        cylinder(h = chamfer_h + 0.01, r1 = inner_r, r2 = inner_r + chamfer_w);

        // Engraved text — cut into outer wall
        if (custom_text != "" && text_mode == "engraved") {
            text_on_cylinder();
        }
    }

    // Inner ribs — create air channels between can and wall for insulation
    if (ribs_enabled && rib_count > 0) {
        inner_ribs();
    }

    // Embossed text — raised on outer wall
    if (custom_text != "" && text_mode == "embossed") {
        text_on_cylinder();
    }
}

// ---- Text placement --------------------------------------------
module text_on_cylinder() {
    if (text_position == "vertical") {
        vertical_text();
    } else {
        wrapped_text();
    }
}

// Text reads top-to-bottom along the can axis, centered on the front face.
// Automatically scales down if the text width exceeds 85% of the can height.
module vertical_text() {
    m = textmetrics(custom_text, size = text_size, font = text_font);
    avail = c_h * 0.85;
    s = m.x > avail ? avail / m.x : 1;

    translate([outer_r, 0, sleeve_h / 2])
    rotate([0, 90, 0])
    scale([s, s, 1])
    linear_extrude(text_depth, center = true)
    text(custom_text, size = text_size, font = text_font,
         halign = "center", valign = "center");
}

// Text wrapped around the cylinder circumference, centered front-to-back.
// Each character is positioned individually using textmetrics() for accurate
// spacing. If the full string exceeds ~90% of the half-circumference, it is
// scaled down uniformly to keep it readable.
module wrapped_text() {
    full = textmetrics(custom_text, size = text_size, font = text_font);
    max_arc = PI * outer_r * 0.9;
    scale_f = full.x > max_arc ? max_arc / full.x : 1;
    scaled_total = full.x * scale_f;

    cum_x = 0;
    for (i = [0 : len(custom_text) - 1]) {
        cm = textmetrics(custom_text[i], size = text_size, font = text_font);
        char_center = (cum_x + cm.x / 2) * scale_f;
        angle_rad = (char_center - scaled_total / 2) / outer_r;

        rotate([0, 0, angle_rad * 180 / PI])
        translate([outer_r, 0, sleeve_h / 2])
        rotate([90, 0, 90])
        scale([scale_f, scale_f, 1])
        linear_extrude(text_depth, center = true)
        text(custom_text[i], size = text_size, font = text_font,
             halign = "center", valign = "center");

        cum_x = cum_x + cm.x;
    }
}

// ---- Inner insulation ribs -------------------------------------
// Thin vertical ribs on the inner wall. The can contacts only these ribs,
// creating air channels around the can for improved thermal insulation.
// If rib_depth > tolerance, the ribs will create a slight interference fit
// against the can surface for a snug grip.
module inner_ribs() {
    rib_h = c_h - 6;  // 3 mm clearance at top and bottom
    rib_z = base_thickness + 3 + rib_h / 2;

    for (i = [0 : rib_count - 1]) {
        rotate([0, 0, i * 360 / rib_count])
        translate([inner_r - rib_depth / 2, 0, rib_z])
        cube([rib_depth, rib_width, rib_h], center = true);
    }
}

// ---- Render ----------------------------------------------------
can_sleeve();
