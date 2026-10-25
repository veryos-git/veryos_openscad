// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details

// Three printable parts. All dimensions are millimetres; no libraries required.
// X = width, Y = depth (hinge at +Y), Z = height. See readme.md for assembly.
// V2 adds a 45-degree grip lip, tapered lid seat and selectable exterior patterns.

/* [View] */
// Export this separated layout to keep all three parts splittable in a slicer.
part = "print_layout"; // [print_layout:All parts on bed, assembly:Assembled (inspection only), exploded:Exploded, box:Box, boxcover:Cover, boxcover_lid:Lid, all_patterns:All patterns (preview grid)]
lid_angle = 110; // [0:5:180]
exploded_distance = 25; // [0:1:80]

/* [Box dimensions] */
// Base dimensions before the outward ribs; height excludes the cover and lid.
box_width = 200; // [100:1:350]
box_depth = 120; // [70:1:250]
box_height = 65; // [25:1:200]
wall_thickness = 2.4; // [1.2:0.2:6]
bottom_thickness = 2.4; // [1.2:0.2:6]
corner_radius = 8; // [4:0.5:25]

/* [Exterior pattern] */
// Material is added OUTSIDE the box; the cavity, seat and hinge stay unchanged.
// The maximum footprint is box_width/depth + 2*pattern_depth. "none" is smooth.
exterior_pattern = "ribs"; // [none:Smooth,ribs:Fine round ribs,flutes:Broad rounded flutes,spiral:Spiral/twist ribs,diamond:Diamond knurl,waves:Wavy ribs,chevron:Chevron ribs]
pattern_on_box = true;
pattern_on_cover = true;
// Added outward height; 0 also disables the pattern.
pattern_depth = 1.5; // [0:0.1:4]
// Rib/flute repeats around the whole perimeter. Must be a whole number.
pattern_count = 52; // [8:1:160]
// Smooth band at the top and bottom edge of each part.
pattern_margin = 1.2; // [0:0.1:6]
// Vertical repeat for diamonds, waves and chevrons.
pattern_pitch = 12; // [4:0.5:40]
// Total spiral rotation of the pattern over the box height; negative reverses.
pattern_twist = 90; // [-360:5:360]

/* [Cover and opening] */
cover_thickness = 4; // [2:0.2:10]
// Opening size at the TOP of the tapered seat; the throat is smaller below.
// Zero sizes it automatically with the box: 53% width, 40% depth.
opening_width = 0; // [0:1:250]
opening_depth = 0; // [0:1:150]
lid_overlap = 4; // [2:0.5:10]
lid_thickness = 3.6; // [2:0.2:8]
// Vertical clearance under the flat lid flange; the tapered insert sits below it.
lid_clearance = 0.25; // [0.1:0.05:1]

/* [45-degree lid seat] */
// Depth of the matching bevel in the cover. Both mating faces are 45 degrees.
seat_depth = 2; // [0.5:0.1:5]
// Horizontal clearance PER SIDE at the same Z; zero gives nominal surface contact.
seat_clearance = 0.15; // [0:0.05:0.5]

/* [Inner edge chamfer] */
// Matching 45-degree box rim / cover underside, plus the cover throat bevel.
// Zero disables these chamfers and the cover's locating insert.
inner_edge_chamfer = 1.5; // [0:0.1:4]
// Horizontal clearance per side between the cover insert and box rim.
// Also leaves this vertical gap above the lowered corner posts.
cover_seat_clearance = 0.15; // [0:0.05:0.5]

/* [Grip lip] */
// Projection beyond the front edge of the capsule-shaped lid (toward -Y).
lip_projection = 9; // [7:0.5:20]
// Lip height above the flat flange underside, excluding the tapered insert.
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
// Additional usable depth below the box's chamfered corner-post tops.
box_magnet_extra_depth = 0.5; // [0:0.1:3]

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
outline_half_w = box_width / 2 - corner_radius;
outline_half_d = box_depth / 2 - corner_radius;
outline_corner_length = PI * corner_radius / 2;
outline_quarter_length = outline_half_w + outline_corner_length + outline_half_d;
perimeter_length = 4 * outline_quarter_length;
texture_depth = exterior_pattern != "none" && (pattern_on_box || pattern_on_cover)
    ? pattern_depth : 0;
outer_width = box_width + 2 * texture_depth;
outer_depth = box_depth + 2 * texture_depth;
opening_w = opening_width == 0 ? box_width * 0.53 : opening_width;
opening_d = opening_depth == 0 ? box_depth * 0.40 : opening_depth;
lid_w = opening_w + 2 * lid_overlap;
lid_d = opening_d + 2 * lid_overlap;
magnet_pocket_d = magnet_diameter + magnet_diameter_clearance;
magnet_pocket_h = magnet_thickness + magnet_depth_clearance;
box_magnet_pocket_h = magnet_pocket_h + box_magnet_extra_depth;
// The rim chamfer lowers the post tops, including the entire bore mouths.
box_magnet_top_z = box_height - inner_edge_chamfer;
cover_insert_depth = max(0, inner_edge_chamfer - cover_seat_clearance);
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
seat_bottom_z = cover_thickness - seat_depth;
seat_throat_w = opening_w - 2 * seat_depth;
seat_throat_d = opening_d - 2 * seat_depth;
seat_insert_h = lid_z - seat_bottom_z;
hinge_z = lid_z + hinge_r;
hinge_length = hinge_middle_length + 2 * (hinge_axial_clearance + hinge_end_length);
hinge_end_x = hinge_middle_length / 2 + hinge_axial_clearance + hinge_end_length / 2;
layout_gap = 15;

assert(part == "assembly" || part == "exploded" || part == "print_layout"
       || part == "box" || part == "boxcover" || part == "boxcover_lid"
       || part == "all_patterns",
       "Unknown part. Choose assembly, exploded, print_layout, box, boxcover, boxcover_lid or all_patterns.");
assert(wall_thickness >= 1.2 && bottom_thickness >= 1.2,
       "Walls and floor must be at least 1.2 mm thick.");
assert(box_width > 2 * corner_radius && box_depth > 2 * corner_radius
       && corner_radius > wall_thickness, "Box/corner dimensions leave no interior.");
assert(exterior_pattern == "none" || exterior_pattern == "ribs"
       || exterior_pattern == "flutes" || exterior_pattern == "spiral"
       || exterior_pattern == "diamond" || exterior_pattern == "waves"
       || exterior_pattern == "chevron", "Unknown exterior pattern.");
assert(pattern_depth >= 0 && pattern_margin >= 0,
       "Pattern depth and edge margin must be nonnegative.");
assert(pattern_count >= 3 && pattern_count == floor(pattern_count),
       "Pattern count must be a whole number of at least three.");
assert(pattern_pitch > 0, "Pattern pitch must be positive.");
assert(pattern_depth < corner_radius,
       "Pattern depth must be smaller than the corner radius.");
assert(box_height > 2 * pattern_margin + 2 * eps,
       "Box is too short for the pattern margin; reduce pattern_margin.");
assert(!(texture_depth > 0 && pattern_on_cover)
       || cover_thickness > 2 * pattern_margin + 2 * eps,
       "Cover is too thin for the pattern margin; reduce pattern_margin.");
assert(magnet_diameter > 0 && magnet_thickness > 0
       && magnet_diameter_clearance >= 0 && magnet_depth_clearance >= 0
       && box_magnet_extra_depth >= 0,
       "Magnet dimensions must be positive and clearances nonnegative.");
assert(post_r <= corner_radius && post_r >= magnet_pocket_d / 2 + 1.2,
       "Increase corner_radius or reduce the magnet diameter to enclose the corner pockets.");
assert(box_magnet_top_z > bottom_thickness + box_magnet_pocket_h + 1.2,
       "Box is too shallow for its floor and magnet pockets.");
assert(cover_thickness >= magnet_pocket_h + 1.2
       && lid_thickness >= magnet_pocket_h + 1.2,
       "Cover and lid need at least 1.2 mm material behind each magnet.");
assert(opening_w >= opening_d && opening_d > 2 * lid_overlap && lid_overlap >= 2,
       "Opening width must be >= depth; increase opening depth or reduce overlap.");
assert(seat_depth > 0 && seat_bottom_z >= 1.2,
       "Seat depth must be positive and leave at least 1.2 mm of straight opening below it.");
assert(inner_edge_chamfer >= 0 && inner_edge_chamfer < wall_thickness
       && inner_edge_chamfer < seat_bottom_z,
       "Inner edge chamfer must be nonnegative and smaller than the wall thickness and the straight seat throat.");
assert(cover_seat_clearance >= 0
       && (inner_edge_chamfer == 0 || cover_seat_clearance < inner_edge_chamfer),
       "Cover seat clearance must be nonnegative and smaller than the enabled rim chamfer.");
assert(cover_insert_depth == 0
       || corner_radius - wall_thickness >= magnet_pocket_d / 2 + 1.2,
       "Increase corner_radius to leave 1.2 mm around the cover insert's magnet bores.");
assert(seat_clearance >= 0 && seat_clearance < seat_depth
       && seat_throat_d > 2 * seat_clearance,
       "Seat clearance must be nonnegative and smaller than the seat depth and throat radius.");
assert(lid_overlap > lid_clearance - seat_clearance,
       "The tapered insert must fit inside the lid flange.");
assert(-latch_y - magnet_pocket_d / 2 - opening_d / 2 >= 1.2,
       "Leave at least 1.2 mm between the tapered opening and the latch magnet pocket.");
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

echo(str("Box outside including pattern: ", outer_width, " x ", outer_depth,
         " x ", box_height, " mm"));
echo(str("Exterior pattern: ", exterior_pattern, ", depth ", pattern_depth,
         " mm, ", pattern_count, " repeats over a ", perimeter_length,
         " mm perimeter (pitch ", perimeter_length / pattern_count, " mm)."));
echo(str("Interior between flat walls: ", box_width - 2 * wall_thickness,
         " x ", box_depth - 2 * wall_thickness, " x ", box_height - bottom_thickness,
         " mm; corner posts intrude into this space."));
echo(str("Use 10 magnets, diameter ", magnet_diameter, " x ", magnet_thickness, " mm."));
echo(str("Box magnet bores: ", box_magnet_pocket_h,
         " mm usable depth below chamfered post tops; cover/lid bores: ",
         magnet_pocket_h, " mm."));
echo(str("Cover rim seat: 45 degrees, ", cover_insert_depth,
         " mm underside projection, ", cover_seat_clearance, " mm clearance per side."));
echo(str("Hinge bore: ", hinge_bore_d, " mm; filament pin length about ", hinge_length + 2, " mm."));
echo(str("Grip lip: ", lip_projection, " mm projection, ", lip_height,
         " mm total height, ", lip_width, " mm width; 45-degree undercut."));
echo(str("Lid seat: 45 degrees, ", seat_depth, " mm deep, ", seat_clearance,
         " mm clearance per side; throat ", seat_throat_w, " x ", seat_throat_d, " mm."));

module rounded_rectangle(w, d, r) {
    hull()
        for (x = [-w / 2 + r, w / 2 - r])
            for (y = [-d / 2 + r, d / 2 - r])
                translate([x, y]) circle(r = r);
}

// The corner centres stay fixed as the radius grows. Equal height and growth
// give matching 45-degree faces around the straight sides and rounded corners.
module rounded_rectangle_taper(w, d, r, h, growth) {
    hull()
        for (x = [-w / 2 + r, w / 2 - r])
            for (y = [-d / 2 + r, d / 2 - r])
                translate([x, y, 0])
                    cylinder(r1 = r, r2 = r + growth, h = h);
}

// Base point and outward unit normal on the smooth rounded rectangle, walking
// the front-right quarter from the front midpoint by arc length s (0..quarter).
function quarter_base(s) =
    let(a = -90 + 90 * (s - outline_half_w) / outline_corner_length)
    s <= outline_half_w ?
        [[s, -box_depth / 2], [0, -1]] :
    s < outline_half_w + outline_corner_length ?
        [[outline_half_w + corner_radius * cos(a),
          -outline_half_d + corner_radius * sin(a)], [cos(a), sin(a)]] :
        [[box_width / 2,
          -outline_half_d + s - outline_half_w - outline_corner_length], [1, 0]];

// Mirror the quarter into all four sides. The perimeter fraction f (0..1) runs
// counterclockwise by arc length, so patterns repeat evenly around the box and
// each side midpoint stays a crest. Returns [point, outward unit normal].
function base_point_normal(f) =
    let(q = min(3, floor(f * 4)),
        t = f * 4 - q,
        pn = quarter_base((q % 2 == 0 ? t : 1 - t) * outline_quarter_length),
        p = pn[0], n = pn[1])
    q == 0 ? [p, n] :
    q == 1 ? [[p[0], -p[1]], [n[0], -n[1]]] :
    q == 2 ? [[-p[0], -p[1]], [-n[0], -n[1]]] :
             [[-p[0], p[1]], [-n[0], n[1]]];

// Pattern phase helpers, ported from simple_cylindrical_screwing_containerV2.
// Here "angle" is the perimeter position in degrees (fraction * 360).
function triangle_wave(a) = 1 - acos(cos(a)) / 180;
function fraction(x) = x - floor(x);
function pattern_shift(z, pattern = exterior_pattern) =
    pattern == "spiral" ? pattern_twist * z / box_height :
    pattern == "waves" ? 360 / pattern_count * sin(360 * z / pattern_pitch) :
    pattern == "chevron" ? 360 / pattern_count * (4 * abs(fraction(z / pattern_pitch) - 0.5) - 1) : 0;

// All profiles range from 0 to 1. The diamond is a field of raised pyramids,
// with alternating rows offset by half a cell, like a conventional knurl.
function pattern_profile(a, z, pattern = exterior_pattern) =
    let(phase = a * pattern_count)
    pattern == "diamond" ?
        min(triangle_wave(phase + 360 * z / pattern_pitch),
            triangle_wave(phase - 360 * z / pattern_pitch)) :
    pattern == "flutes" ? (1 + cos(phase)) / 2 :
    max(0, cos(phase - pattern_count * pattern_shift(z, pattern)));

// A single closed mesh wraps the perimeter, adding relief OUTSIDE the smooth
// blank that stays underneath, so texture never removes wall material. Vertices
// follow the ribs (via pattern_shift) to avoid stair-stepping on curved
// patterns. z_origin places the cover's texture in the assembled coordinate so
// its pattern continues from the box across the closed seam.
module exterior_relief(h, enabled, z_origin = 0, pattern = exterior_pattern) {
    if (enabled && pattern != "none" && pattern_depth > 0) {
        low = pattern_margin;
        high = h - pattern_margin;
        assert(high - low > 2 * eps,
               "Pattern margin leaves no textured area; reduce pattern_margin.");
        fade = min(pattern_depth, (high - low) / 3);
        samples = max(12, ceil(curve_segments / 32) * 4);
        segments = max(4 * curve_segments, pattern_count * samples);
        // Constant profiles need only the two end ramps and a straight middle.
        straight = pattern == "ribs" || pattern == "flutes" ||
                   (pattern == "spiral" && pattern_twist == 0);
        step = pattern == "spiral"
            ? box_height * 360 / (max(abs(pattern_twist), eps) * pattern_count * samples)
            : pattern_pitch / (2 * samples);
        rows = max(1, ceil((high - low - 2 * fade) / step));
        levels = straight ? [low, low + fade, high - fade, high] :
            concat([low], [for (i = [0:rows]) low + fade + (high - low - 2 * fade) * i / rows], [high]);
        // Sink the relief root just inside the faceted blank so the union is
        // watertight even at the rounded corners' facet midpoints.
        inset = corner_radius * (1 - cos(180 / curve_segments)) + 0.1;
        points = [for (z = levels, j = [0:segments-1])
            let(a = j * 360 / segments + pattern_shift(z + z_origin, pattern),
                pn = base_point_normal(fraction(a / 360)),
                p = pn[0], nrm = pn[1],
                taper = min(1, (z - low) / fade, (high - z) / fade),
                d = -inset + (pattern_depth + inset) * taper *
                    pattern_profile(a, z + z_origin, pattern))
            [p[0] + nrm[0] * d, p[1] + nrm[1] * d, z]];
        faces = concat(
            [[for (j = [0:segments-1]) j]],
            [for (i = [0:len(levels)-2], j = [0:segments-1])
                [i*segments+j, (i+1)*segments+j, (i+1)*segments+(j+1)%segments]],
            [for (i = [0:len(levels)-2], j = [0:segments-1])
                [i*segments+j, (i+1)*segments+(j+1)%segments, i*segments+(j+1)%segments]],
            [[for (j = [segments-1:-1:0]) (len(levels)-1)*segments+j]]);
        polyhedron(points = points, faces = faces, convexity = 16);
    }
}

module capsule(w, d) {
    hull()
        for (x = [-(w - d) / 2, (w - d) / 2])
            translate([x, 0]) circle(d = d);
}

// Counterclockwise capsule outline with matching vertices at every height.
function capsule_points(w, d) =
    let(steps = ceil(curve_segments / 2))
    concat(
        [for (i = [0:steps])
            let(a = -90 + 180 * i / steps)
            [(w - d) / 2 + d / 2 * cos(a), d / 2 * sin(a)]],
        [for (i = [0:steps])
            let(a = 90 + 180 * i / steps)
            [-(w - d) / 2 + d / 2 * cos(a), d / 2 * sin(a)]]);

// Sections are [Z, radial growth]. Equal growth and rise give a 45-degree
// perimeter, including the rounded ends, without scaling the straight span.
// One mesh avoids coincident faces at the straight-throat / bevel transition.
module capsule_loft(w, d, sections) {
    n = len(capsule_points(w, d));
    levels = len(sections);
    polyhedron(
        points = [for (s = sections)
            for (p = capsule_points(w + 2 * s[1], d + 2 * s[1]))
                [p[0], p[1], s[0]]],
        faces = concat(
            [[for (i = [0:n - 1]) i]],
            [for (j = [0:levels - 2]) for (i = [0:n - 1])
                [j * n + i, (j + 1) * n + i,
                 (j + 1) * n + (i + 1) % n, j * n + (i + 1) % n]],
            [[for (i = [n - 1:-1:0]) (levels - 1) * n + i]]),
        convexity = 4);
}

module corner_positions() {
    for (x = [-magnet_x, magnet_x])
        for (y = [-magnet_y, magnet_y])
            translate([x, y, 0]) children();
}

// Blind pockets. The small epsilon opens the mouth without deepening the seat.
module pocket_from_top(z, depth = magnet_pocket_h) {
    translate([0, 0, z - depth])
        cylinder(d = magnet_pocket_d, h = depth + eps);
}

module pocket_from_bottom(z) {
    translate([0, 0, z - eps])
        cylinder(d = magnet_pocket_d, h = magnet_pocket_h + eps);
}

// 45-degree chamfer cut for the box's inner top rim: a frustum that matches the
// cavity at box_height - c and widens outward by c at the open top.
module top_rim_chamfer() {
    c = inner_edge_chamfer;
    translate([0, 0, box_height - c])
        rounded_rectangle_taper(box_width - 2 * wall_thickness,
                                box_depth - 2 * wall_thickness,
                                corner_radius - wall_thickness,
                                c + eps, c + eps);
}

// Male underside seat fits the rim frustum at the SAME assembled Z. Its bottom
// clears the lowered posts; the plate above still rests on the flat outer rim.
module cover_rim_insert() {
    if (cover_insert_depth > 0)
        translate([0, 0, -cover_insert_depth])
            rounded_rectangle_taper(box_width - 2 * wall_thickness,
                                    box_depth - 2 * wall_thickness,
                                    corner_radius - wall_thickness,
                                    cover_insert_depth + eps,
                                    cover_insert_depth + eps);
}

module box(pattern = exterior_pattern, show = pattern_on_box) {
    difference() {
        union() {
            linear_extrude(box_height)
                rounded_rectangle(box_width, box_depth, corner_radius);
            exterior_relief(box_height, show, 0, pattern);
        }
        translate([0, 0, bottom_thickness])
            linear_extrude(box_height)
                difference() {
                    rounded_rectangle(box_width - 2 * wall_thickness,
                                      box_depth - 2 * wall_thickness,
                                      corner_radius - wall_thickness);
                    // Leave full-height corner posts connected to the walls.
                    corner_positions() circle(r = post_r);
                }
        corner_positions()
            pocket_from_top(box_height, inner_edge_chamfer + box_magnet_pocket_h);
        if (inner_edge_chamfer > 0) top_rim_chamfer();
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

module boxcover(pattern = exterior_pattern, show = pattern_on_cover) {
    difference() {
        union() {
            linear_extrude(cover_thickness)
                rounded_rectangle(box_width, box_depth, corner_radius);
            cover_rim_insert();
            // Sample the assembled Z so the cover's pattern continues from the
            // box across the closed seam.
            exterior_relief(cover_thickness, show, box_height, pattern);
            // Two fixed outer knuckles; supports stay behind the moving lid.
            for (x = [-hinge_end_x, hinge_end_x]) {
                hinge_tube(x, hinge_end_length);
                translate([x - hinge_end_length / 2, hinge_y,
                           cover_thickness - eps])
                    cube([hinge_end_length, hinge_r,
                          hinge_z - cover_thickness + eps]);
            }
        }
        // Female seat widens to the original opening size at the cover top.
        // Keeping that top outline preserves the wall around the latch magnet.
        // Extend the opening through the insert and start its 45-degree throat
        // chamfer at the new underside. The upper hinged-lid seat stays at its Z.
        capsule_loft(seat_throat_w, seat_throat_d,
                     concat(inner_edge_chamfer > 0
                                ? [[-cover_insert_depth - eps, inner_edge_chamfer + eps],
                                   [inner_edge_chamfer - cover_insert_depth, 0]]
                                : [[-eps, 0]],
                            [[seat_bottom_z, 0],
                             [cover_thickness + eps, seat_depth + eps]]));
        // Corner magnets face DOWN toward the box; the latch faces UP.
        corner_positions() pocket_from_bottom(-cover_insert_depth);
        translate([0, latch_y, 0]) pocket_from_top(cover_thickness);
        hinge_bore();
    }
}

// A rounded finger grip with a true 1:1 rise/run along its front face.
// Intersect a vertical rounded footprint with a trapezoid extruded along X.
// Polygon coordinates are [Y, Z], relative to the closed flange's underside.
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
            // Male insert extends below the flange and narrows toward the box.
            // Its profile is offset from the female seat at the SAME Z, so the
            // flange gap does not accidentally increase the mating clearance.
            translate([0, 0, seat_bottom_z])
                capsule_loft(seat_throat_w - 2 * seat_clearance,
                             seat_throat_d - 2 * seat_clearance,
                             [[0, 0], [seat_insert_h + eps, seat_insert_h + eps]]);
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

// Preview every pattern at the current dimensions. One row per pattern, box on
// the left and its cover on the right; parts keep their print orientation.
module all_patterns() {
    patterns = ["none", "ribs", "flutes", "spiral", "diamond", "waves", "chevron"];
    col_gap = box_width + 2 * pattern_depth + layout_gap;
    row_gap = box_depth + 2 * pattern_depth + layout_gap;
    for (i = [0:len(patterns) - 1])
        translate([0, (i - (len(patterns) - 1) / 2) * row_gap, 0]) {
            color([0.30, 0.40, 0.43]) box(patterns[i], true);
            translate([col_gap, 0, cover_insert_depth])
                color([0.63, 0.74, 0.72]) boxcover(patterns[i], true);
        }
}

// Each export has its lowest surface at Z=0. No printable pin is generated.
if (part == "box") box();
else if (part == "boxcover") translate([0, 0, cover_insert_depth]) boxcover();
else if (part == "boxcover_lid") translate([0, 0, -seat_bottom_z]) boxcover_lid();
else if (part == "all_patterns") all_patterns();
else if (part == "print_layout") {
    box();
    translate([0, outer_depth + layout_gap, cover_insert_depth]) boxcover();
    translate([outer_width / 2 + layout_gap + lid_w / 2, 0, -seat_bottom_z]) boxcover_lid();
}
else if (part == "exploded") assembly(exploded_distance);
else assembly();
