// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

// One-piece paper haunted-house lantern. Every dimension is in millimetres.
// The net is one connected sheet: a floor, four walls, a pyramid roof and a
// hanger tab. Fold lines are cut as dashed slits (perforations), not printed
// guides, so the sheet stays connected while the folds become easier.
//
// Layout of the flat net (top face becomes the outside):
//
//     roof 0        roof 1        roof 2        roof 3
//   +--------+    +--------+    +--------+    +--------+
//   | wall 0 |    | wall 1 |    | wall 2 |    | wall 3 |  glue tab
//   +--------+----+--------+----+--------+----+--------+
//   flap 0        | floor  |        flap 2        flap 3
//                 +--------+
//
// Wall 1 carries the floor. The floor folds in, the other three walls fold
// their bottom flaps onto it. Wall 3's end tab closes the fourth corner.

/* [Output] */
output = "flat"; // [flat:Flat 3D model, cut:Cutting template, folded:Folded model, fold_lines:Fold-line overlay]
paper_thickness = 0.3; // [0.1:0.05:0.8]

/* [Lantern] */
// Outside width of the square lantern.
lantern_width = 45; // [38:1:60]
// Wall height from the floor to the eaves.
wall_height = 65; // [55:1:100]
// Height of the pyramid roof above the eaves.
roof_height = 30; // [10:1:60]

/* [Cutouts] */
// generic puts one arched four-pane window on every wall.
window_style = "generic"; // [generic, mixed, bat, web, spider, arch, none]
window_width = 27; // [10:1:45]
window_height = 33; // [10:1:70]
// mixed uses bats on the front/back roof faces and spiders on the sides.
roof_decoration = "mixed"; // [mixed, bat, spider, none]

/* [Hanger] */
// The square opening at the roof apex, and the width of the hanger tab.
hanger_width = 10; // [6:0.5:20]
hanger_height = 16; // [8:1:30]
hanger_hole = 4.5; // [2:0.5:10]

/* [Folds and glue] */
glue_tab = 6; // [3:0.5:10]
fold_slit_width = 0.45; // [0.2:0.05:0.8]
fold_dash_length = 2.6; // [1:0.1:5]
fold_dash_gap = 2; // [1:0.5:5]

/* [Hidden] */
logo_file = "veryos_logo.svg";
logo_width = 18;
logo_line = 0.42;
logo_dash_pitch = 1.35;
logo_dash_width = 0.7;
mullion_width = 2.2;
cap_overlap = 1.2;
fold_lap = paper_thickness;
fold_end_gap = 1.4;
corner_clear = 2.5;
roof_glue_tab = max(3.5, glue_tab * 0.65);
roof_tab_start = max(5, roof_glue_tab * 1.6);
roof_tab_end_gap = 2;
$fn = 48;

// Derived dimensions.
wall_span = 4 * lantern_width;
flat_width = wall_span + glue_tab;
roof_slant = sqrt(pow(lantern_width / 2, 2) + pow(roof_height, 2));
apex_width = hanger_width;
roof_top = roof_slant * (1 - apex_width / lantern_width);
net_top = wall_height + roof_top + apex_width + hanger_height;
net_bottom = -lantern_width;
z_eave = paper_thickness + wall_height;
z_roof_top = z_eave + roof_height * (1 - apex_width / lantern_width);
roof_angle = atan2(lantern_width / 2, roof_height);
window_center = wall_height * 0.47;
mixed_windows = ["bat", "web", "bat", "web"];
mixed_roofs = ["bat", "spider", "bat", "spider"];

function f_wall_style(index) =
    window_style == "mixed" ? mixed_windows[index] : window_style;
function f_roof_style(index) =
    roof_decoration == "mixed" ? mixed_roofs[index] : roof_decoration;
function f_roof_width(n_s) = lantern_width * (1 - n_s / roof_slant);

assert(output == "flat" || output == "cut" || output == "folded" || output == "fold_lines",
       "Choose flat, cut, folded or fold_lines output.");
assert(window_style == "generic" || window_style == "mixed" || window_style == "bat"
       || window_style == "web" || window_style == "spider" || window_style == "arch"
       || window_style == "none", "Unknown window style.");
assert(roof_decoration == "mixed" || roof_decoration == "bat"
       || roof_decoration == "spider" || roof_decoration == "none",
       "Unknown roof decoration.");
assert(lantern_width >= 20 && wall_height >= 20 && roof_height > 0 && paper_thickness > 0,
       "The lantern body must be positive and at least 20 mm wide and tall.");
assert(glue_tab > 0 && glue_tab <= lantern_width / 3,
       "The glue tab must be positive and no wider than one third of the wall.");
assert(hanger_width >= 6 && hanger_width <= lantern_width * 0.6,
       "The hanger opening must be 6 mm or wider and narrower than the roof.");
assert(hanger_height >= hanger_hole + 4,
       "The hanger needs at least 2 mm of paper above and below its hole.");
assert(hanger_hole >= 2 && hanger_hole <= hanger_width - 3,
       "The hanging hole must leave 1.5 mm of paper at each side.");
assert(roof_top > roof_slant * 0.25,
       "The hanger opening is too large for this roof; use a smaller hanger_width.");
assert(fold_slit_width > 0 && fold_slit_width < fold_dash_length
       && fold_dash_gap >= fold_slit_width && fold_dash_gap > 0,
       "Fold slits need a positive width, a longer dash and a gap at least as wide as the slit.");
assert(window_style == "none" ||
       (window_width > 0 && window_height > 0
        && window_width <= lantern_width - 2 * (corner_clear + 2)
        && window_height <= wall_height - 2 * 5
        && window_center - window_height / 2 > glue_tab + 2
        && window_center + window_height / 2 < wall_height - 4),
       "The window must leave at least 4 mm of paper at the wall edges and clear the floor fold.");
assert((window_style != "generic" && window_style != "arch")
       || window_height > window_width / 2 + 2,
       "An arched window needs enough height for its round top.");
assert(f_roof_style(0) == "none" ||
       (roof_top > 14 && f_roof_width(roof_top * 0.45) > 12),
       "The roof is too small for the selected decoration.");

echo(str("Flat template: ", flat_width, " x ", (net_top - net_bottom),
         " mm; folded body: ", lantern_width, " x ", lantern_width, " x ",
         (wall_height + roof_height), " mm."));

// ---------------------------------------------------------------------------
// Two-dimensional artwork

// A stylised bat with scalloped wings, in a unit box centred on the origin.
module bat_2d(n_width, n_height) {
    translate([0, -0.155 * n_height])
        scale([n_width, n_height]) {
            translate([0, 0.02]) scale([0.09, 0.25]) circle(d = 1);
            translate([0, 0.27]) scale([0.07, 0.07]) circle(d = 1);
            for (n_side = [-1, 1])
                scale([n_side, 1])
                    polygon([
                        [0.015, 0.29], [0.055, 0.49], [0.095, 0.29],
                        [0.04, 0.20]
                    ]);
            for (n_side = [-1, 1])
                scale([n_side, 1])
                    polygon([
                        [0.025, 0.20], [0.11, 0.28], [0.22, 0.30],
                        [0.32, 0.25], [0.49, 0.34], [0.43, 0.16],
                        [0.49, 0.02], [0.35, 0.05], [0.27, -0.11],
                        [0.19, 0.02], [0.10, -0.16], [0.045, -0.02]
                    ]);
        }
}

// A small spider. Body, head and eight bent legs are all one cutout shape.
module spider_2d(n_width, n_height) {
    scale([n_width, n_height]) {
        translate([0, -0.10]) scale([0.20, 0.26]) circle(d = 1);
        translate([0, 0.16]) scale([0.13, 0.13]) circle(d = 1);
        for (n_side = [-1, 1])
            for (n_leg = [0:3]) {
                n_y = 0.10 - n_leg * 0.14;
                n_knee_y = n_y + (n_leg < 2 ? 0.16 : -0.12);
                scale([n_side, 1])
                    polygon([
                        [0.06, n_y], [0.30, n_knee_y], [0.43, n_knee_y + 0.2],
                        [0.50, n_knee_y + 0.26], [0.46, n_knee_y + 0.30],
                        [0.36, n_knee_y + 0.08], [0.22, n_knee_y - 0.02],
                        [0.10, n_y - 0.04]
                    ]);
            }
    }
}

module arch_2d(n_width, n_height) {
    n_radius = n_width / 2;
    translate([-n_width / 2, -n_height / 2])
        union() {
            square([n_width, n_height - n_radius]);
            translate([n_radius, n_height - n_radius])
                circle(r = n_radius);
        }
}

// Paper strands that remain inside a web window. They join the window edge,
// so every cut region stays supported by the wall.
module web_strands_2d(n_width, n_height) {
    n_x0 = -n_width / 2;
    n_y0 = n_height / 2;
    n_strand = 1.7;
    n_length = sqrt(pow(n_width, 2) + pow(n_height, 2));
    translate([n_x0, n_y0]) {
        for (n_angle = [12:18:84])
            rotate(n_angle)
                translate([-n_strand / 2, -n_length])
                    square([n_strand, n_length + 1]);
        for (n_ring = [1:3])
            difference() {
                circle(r = n_ring * min(n_width, n_height) / 4 + n_strand / 2);
                circle(r = n_ring * min(n_width, n_height) / 4 - n_strand / 2);
            }
    }
}

module window_cutout_2d(index) {
    n_style = f_wall_style(index);
    translate([0, window_center]) {
        if (n_style == "generic")
            difference() {
                arch_2d(window_width, window_height);
                translate([-mullion_width / 2, -window_height / 2])
                    square([mullion_width, window_height]);
                translate([-window_width / 2, -mullion_width / 2])
                    square([window_width, mullion_width]);
            }
        else if (n_style == "arch")
            arch_2d(window_width, window_height);
        else if (n_style == "bat")
            bat_2d(window_width, window_height * 0.86);
        else if (n_style == "spider")
            spider_2d(min(window_width, window_height) * 0.78,
                      min(window_width, window_height) * 0.78);
        else if (n_style == "web") {
            n_rect = [window_width, window_height];
            difference() {
                square(n_rect, center = true);
                intersection() {
                    square(n_rect, center = true);
                    web_strands_2d(n_rect[0], n_rect[1]);
                }
            }
        }
    }
}

// Roof artwork sits in the face's local x/s coordinates.
module roof_cutout_2d(index) {
    n_style = f_roof_style(index);
    if (n_style != "none") {
        n_center = roof_top * 0.46;
        n_max_width = f_roof_width(n_center + 6) - 4;
        if (n_style == "bat")
            translate([0, n_center])
                bat_2d(min(22, n_max_width), min(11, n_max_width * 0.5));
        else if (n_style == "spider")
            translate([0, n_center])
                spider_2d(min(13, n_max_width * 0.7),
                          min(13, n_max_width * 0.7));
    }
}

// A dashed engraving of the VeryOS mark. The outline is broken into small
// slits, so the logo stays attached to the paper instead of falling out.
module logo_outline_2d() {
    difference() {
        resize([logo_width, 0], auto = true)
            import(logo_file, center = true);
        offset(delta = -logo_line)
            resize([logo_width, 0], auto = true)
                import(logo_file, center = true);
    }
}

module logo_engraving_2d() {
    intersection() {
        logo_outline_2d();
        for (n_x = [-logo_width / 2 : logo_dash_pitch : logo_width / 2])
            translate([n_x - logo_dash_width / 2, -logo_width / 2])
                square([logo_dash_width, logo_width]);
    }
}

// ---------------------------------------------------------------------------
// Flat net

module wall_local_2d(index) {
    difference() {
        translate([-lantern_width / 2, 0])
            square([lantern_width, wall_height]);
        if (f_wall_style(index) != "none")
            window_cutout_2d(index);
    }
}

module wall_glue_tab_2d() {
    translate([wall_span, glue_tab * 0.6])
        square([glue_tab, wall_height - 1.2 * glue_tab]);
}

module bottom_flap_2d(index) {
    n_x = index * lantern_width;
    polygon([
        [n_x + corner_clear, 0],
        [n_x + lantern_width - corner_clear, 0],
        [n_x + lantern_width - corner_clear - 1.6, -glue_tab],
        [n_x + corner_clear + 1.6, -glue_tab]
    ]);
}

module floor_2d() {
    translate([lantern_width, -lantern_width]) {
        difference() {
            square([lantern_width, lantern_width]);
            translate([lantern_width / 2, lantern_width / 2])
                logo_engraving_2d();
        }
    }
}

module roof_face_local_2d(index) {
    difference() {
        polygon([
            [-lantern_width / 2, 0],
            [lantern_width / 2, 0],
            [apex_width / 2, roof_top],
            [-apex_width / 2, roof_top]
        ]);
        roof_cutout_2d(index);
    }
}

module roof_seam_tab_2d(index) {
    n_x0 = index * lantern_width;
    n_dx = -lantern_width / (2 * roof_slant);
    n_dy = 1;
    n_length = sqrt(pow(n_dy, 2) + pow(n_dx, 2));
    n_nx = n_dy / n_length;
    n_ny = -n_dx / n_length;
    n_start = roof_tab_start;
    n_end = roof_top - roof_tab_end_gap;
    if (n_end > n_start + 2) {
        n_ax = n_x0 + lantern_width - n_start * lantern_width / (2 * roof_slant);
        n_ay = wall_height + n_start;
        n_bx = n_x0 + lantern_width - n_end * lantern_width / (2 * roof_slant);
        n_by = wall_height + n_end;
        polygon([
            [n_ax, n_ay],
            [n_bx, n_by],
            [n_bx + n_nx * roof_glue_tab, n_by + n_ny * roof_glue_tab],
            [n_ax + n_nx * roof_glue_tab, n_ay + n_ny * roof_glue_tab]
        ]);
    }
}

module roof_cap_2d() {
    n_x = lantern_width / 2;
    n_y = wall_height + roof_top;
    polygon([
        [n_x - apex_width / 2, n_y],
        [n_x + apex_width / 2, n_y],
        [n_x + apex_width / 2 + cap_overlap, n_y + apex_width],
        [n_x - apex_width / 2 - cap_overlap, n_y + apex_width]
    ]);
}

module hanger_tab_2d() {
    n_x = lantern_width / 2;
    n_y = wall_height + roof_top + apex_width;
    difference() {
        translate([n_x - apex_width / 2, n_y])
            square([apex_width, hanger_height]);
        translate([n_x, n_y + hanger_height * 0.55])
            circle(d = hanger_hole);
    }
}

module net_solid_2d() {
    union() {
        for (n_index = [0:3]) {
            translate([n_index * lantern_width + lantern_width / 2, 0])
                wall_local_2d(n_index);
            translate([n_index * lantern_width + lantern_width / 2, wall_height])
                roof_face_local_2d(n_index);
            if (n_index != 1) bottom_flap_2d(n_index);
            roof_seam_tab_2d(n_index);
        }
        floor_2d();
        wall_glue_tab_2d();
        roof_cap_2d();
        hanger_tab_2d();
    }
}

// Dashed perforations. A fold is a line of short slits; paper bridges between
// the slits keep the net in one piece and make the fold easy to crease.
module dash_line_2d(n_x1, n_y1, n_x2, n_y2) {
    n_dx = n_x2 - n_x1;
    n_dy = n_y2 - n_y1;
    n_length = sqrt(pow(n_dx, 2) + pow(n_dy, 2));
    n_usable = n_length - 2 * fold_end_gap;
    n_count = floor((n_usable + fold_dash_gap) / (fold_dash_length + fold_dash_gap));
    if (n_count >= 1) {
        n_angle = atan2(n_dy, n_dx);
        for (n_i = [0:n_count - 1]) {
            n_position = fold_end_gap + fold_dash_length / 2
                + n_i * (fold_dash_length + fold_dash_gap);
            translate([n_x1 + n_dx * n_position / n_length,
                       n_y1 + n_dy * n_position / n_length])
                rotate(n_angle)
                    translate([-fold_dash_length / 2, -fold_slit_width / 2])
                        square([fold_dash_length, fold_slit_width]);
        }
    }
}

module fold_slots_2d() {
    for (n_index = [0:3]) {
        n_x = n_index * lantern_width;
        // Eave fold.
        dash_line_2d(n_x + fold_end_gap, wall_height,
                     n_x + lantern_width - fold_end_gap, wall_height);
        if (n_index > 0)
            dash_line_2d(n_x, fold_end_gap, n_x, wall_height - fold_end_gap);
        if (n_index == 1)
            dash_line_2d(n_x + fold_end_gap, 0,
                         n_x + lantern_width - fold_end_gap, 0);
        else
            dash_line_2d(n_x + corner_clear + fold_end_gap, 0,
                         n_x + lantern_width - corner_clear - fold_end_gap, 0);
        // Roof seam fold along the tab root.
        n_dx = -lantern_width / (2 * roof_slant);
        n_dy = 1;
        n_start = roof_tab_start;
        n_end = roof_top - roof_tab_end_gap;
        if (n_end > n_start + 2) {
            n_a = [n_x + lantern_width - n_start * lantern_width / (2 * roof_slant),
                   wall_height + n_start];
            n_b = [n_x + lantern_width - n_end * lantern_width / (2 * roof_slant),
                   wall_height + n_end];
            dash_line_2d(n_a[0], n_a[1], n_b[0], n_b[1]);
        }
    }
    // Root of the wall glue tab.
    dash_line_2d(wall_span, glue_tab, wall_span, wall_height - glue_tab);
    // Roof cap and hanger folds on the first roof face.
    dash_line_2d(lantern_width / 2 - apex_width / 2 + fold_end_gap,
                 wall_height + roof_top,
                 lantern_width / 2 + apex_width / 2 - fold_end_gap,
                 wall_height + roof_top);
    dash_line_2d(lantern_width / 2 - apex_width / 2 + fold_end_gap,
                 wall_height + roof_top + apex_width,
                 lantern_width / 2 + apex_width / 2 - fold_end_gap,
                 wall_height + roof_top + apex_width);
}

module fold_overlay_2d() {
    union() {
        fold_slots_2d();
        // Invisible corner specks keep the overlay's SVG canvas identical to
        // the cut template so the browser can stack the two files exactly.
        translate([0, net_bottom]) square([0.01, 0.01]);
        translate([flat_width - 0.01, net_top - 0.01]) square([0.01, 0.01]);
    }
}

module net_2d() {
    difference() {
        net_solid_2d();
        fold_slots_2d();
    }
}

// ---------------------------------------------------------------------------
// Folded model

module wall_3d(index) {
    rotate([0, 0, index * 90])
        translate([0, -lantern_width / 2, paper_thickness])
            rotate([90, 0, 0])
                linear_extrude(paper_thickness)
                    offset(delta = fold_lap)
                        wall_local_2d(index);
}

module bottom_flap_3d(index) {
    rotate([0, 0, index * 90])
        translate([-(lantern_width - 2 * corner_clear) / 2,
                   -lantern_width / 2 - fold_lap, 0])
            cube([lantern_width - 2 * corner_clear, glue_tab + fold_lap,
                  2 * paper_thickness]);
}

module wall_glue_tab_3d() {
    translate([-lantern_width / 2, -lantern_width / 2 - fold_lap,
               paper_thickness + glue_tab])
        cube([glue_tab, 2 * paper_thickness, wall_height - 2 * glue_tab]);
}

module roof_3d(index) {
    rotate([0, 0, index * 90])
        translate([0, -lantern_width / 2, z_eave])
            rotate([roof_angle, 0, 0])
                linear_extrude(paper_thickness)
                    offset(delta = fold_lap)
                        roof_face_local_2d(index);
}

module roof_cap_3d() {
    translate([0, -apex_width / 2, z_roof_top - fold_lap])
        linear_extrude(2 * paper_thickness)
            polygon([
                [-apex_width / 2, 0],
                [apex_width / 2, 0],
                [apex_width / 2 + cap_overlap, apex_width],
                [-apex_width / 2 - cap_overlap, apex_width]
            ]);
}

module hanger_tab_3d() {
    difference() {
        translate([-apex_width / 2, apex_width / 2 - paper_thickness,
                   z_roof_top - fold_lap])
            cube([apex_width, paper_thickness, hanger_height + fold_lap]);
        translate([0, apex_width / 2 - paper_thickness - 0.5,
                   z_roof_top + hanger_height * 0.55])
            rotate([-90, 0, 0])
                cylinder(d = hanger_hole, h = paper_thickness + 1);
    }
}

module assembled() {
    color("#5b3560") {
        difference() {
            translate([-lantern_width / 2 - fold_lap,
                       -lantern_width / 2 - fold_lap, 0])
                cube([lantern_width + 2 * fold_lap,
                      lantern_width + 2 * fold_lap, paper_thickness]);
            translate([0, 0, -0.1])
                linear_extrude(paper_thickness + 0.2)
                    logo_engraving_2d();
        }
        for (n_index = [0:3]) {
            wall_3d(n_index);
            roof_3d(n_index);
            if (n_index != 1) bottom_flap_3d(n_index);
        }
        wall_glue_tab_3d();
        roof_cap_3d();
        hanger_tab_3d();
    }
}

// ---------------------------------------------------------------------------

if (output == "cut")
    net_2d();
else if (output == "fold_lines")
    fold_overlay_2d();
else if (output == "folded")
    assembled();
else {
    color("#5b3560") linear_extrude(paper_thickness) net_2d();
    if ($preview)
        color("#e9923f") translate([0, 0, paper_thickness + 0.01])
            linear_extrude(0.01) fold_slots_2d();
}
