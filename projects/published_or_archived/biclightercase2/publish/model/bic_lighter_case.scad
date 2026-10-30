// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Parametric BIC lighter case, reverse-engineered from bic_sleeve_plain.stl,
// with selectable exterior patterns adapted from babywipesboxV2.
//
// The part is a thin elliptical tube, closed at the bottom and open at the top.
// A BIC Maxi (J26, full size) lighter drops in from above and a small hole in
// the floor lets you push it back out with a finger.
//
// What makes a lighter actually slide in and stay put is the INNER cavity, so
// the cavity is the thing this script is built around: it is the lighter size
// plus a fit clearance. The outside is then just the cavity plus the wall. The
// original STL cavity (25.85 x 15.1 mm) is a Maxi (25 x 14.5 mm) plus ~0.4 mm
// per side. The current 0.25 mm default uses a slightly snugger cavity.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "case"; // [case:Single case,all_patterns:All patterns side by side]

/* [Lighter: BIC Maxi J26] */
// Across the wide flat faces of the lighter.
lighter_width = 25.0;
// Front to back of the lighter.
lighter_depth = 14.5;

/* [Fit] */
// Gap per side between the lighter and the inner wall. THIS is the number that
// decides whether the lighter slides in and holds: 0.25 snug, 0.4 standard,
// 0.6 loose. Increase it if your printer tends to over-extrude.
fit_clearance = 0.25;

/* [Case] */
// Side wall and bottom floor thickness.
wall = 1.0;
floor_thickness = 2.0;
// Overall height of the sleeve. The cavity is this minus the floor, so it sets
// how far the lighter sinks in and how much of the metal top stays exposed.
height = 70.9;

/* [Exterior pattern] */
// Adds material OUTSIDE the case; the lighter cavity and fit stay unchanged.
exterior_pattern = "ribs"; // [none:Smooth,ribs:Fine round ribs,flutes:Broad rounded flutes,spiral:Spiral/twist ribs,diamond:Diamond knurl,waves:Wavy ribs,chevron:Chevron ribs]
// Maximum outward relief in mm. Zero also restores the plain case.
pattern_depth = 0.6; // [0:0.05:2]
// Whole-number repeats spaced evenly around the elliptical perimeter.
pattern_count = 24; // [4:1:80]
// Smooth bands at both ends; never smaller than the outer edge chamfer.
pattern_margin = 1.0; // [0:0.1:8]
// Vertical repeat for diamonds, waves and chevrons, in mm.
pattern_pitch = 10; // [2:0.5:30]
// Spiral travel over the full height in perimeter degrees; negative reverses.
pattern_twist = 90; // [-360:5:360]

/* [Details] */
// 45 degree chamfer on the outer top and bottom edges.
edge_chamfer = 0.4;
// Smaller lead-in chamfer at the inner mouth so the lighter starts in easily.
mouth_chamfer = 0.4;
// Diameter of the finger push-out hole through the floor.
hole_diameter = 12.0;

/* [Quality] */
// Facets per full circle.
$fn = 96;

/* [Hidden] */
eps = 0.01;
// The inner cavity is driven by the lighter plus the clearance - the critical
// dimension. Everything outside is derived from it by adding the wall.
in_a  = lighter_width / 2 + fit_clearance;
in_b  = lighter_depth / 2 + fit_clearance;
out_a = in_a + wall;
out_b = in_b + wall;
hole_r = hole_diameter / 2;
pattern_low = max(pattern_margin, edge_chamfer);
// A small arc-length lookup table avoids bunching ribs at the narrow ends.
ellipse_quarter = ellipse_arc_table(max(96, $fn));
perimeter_length = 4 * ellipse_quarter[len(ellipse_quarter) - 1][0];

assert(part == "case" || part == "all_patterns", "Choose case or all_patterns.");
assert(lighter_width > 0 && lighter_depth > 0 && fit_clearance >= 0
       && wall > 0 && floor_thickness > 0 && height > floor_thickness + mouth_chamfer,
       "Use positive dimensions and leave room above the floor for the cavity.");
assert(edge_chamfer >= 0 && mouth_chamfer >= 0 && height > 2 * edge_chamfer,
       "Chamfers must be nonnegative and leave a straight body between them.");
assert(edge_chamfer + mouth_chamfer < wall,
       "Chamfers would eat through the top rim; reduce them or thicken the wall.");
assert(exterior_pattern == "none" || exterior_pattern == "ribs"
       || exterior_pattern == "flutes" || exterior_pattern == "spiral"
       || exterior_pattern == "diamond" || exterior_pattern == "waves"
       || exterior_pattern == "chevron", "Unknown exterior pattern.");
assert(pattern_depth >= 0 && pattern_margin >= 0 && pattern_pitch > 0,
       "Pattern depth/margin must be nonnegative and pitch must be positive.");
assert(pattern_count >= 3 && pattern_count == floor(pattern_count),
       "Pattern count must be a whole number of at least three.");
assert(pattern_depth == 0 || (part == "case" && exterior_pattern == "none")
       || height > 2 * pattern_low + 2 * eps,
       "Pattern margins leave no textured area; reduce pattern_margin.");
assert($fn >= 24 && $fn == floor($fn), "Use a whole-number $fn of at least 24.");

echo(str("Lighter cavity: ", 2 * in_a, " x ", 2 * in_b,
         " mm; smooth outside: ", 2 * out_a, " x ", 2 * out_b, " x ", height, " mm."));
echo(str("Exterior pattern: ", exterior_pattern, ", depth ", pattern_depth,
         " mm, ", pattern_count, " repeats, approximately ",
         perimeter_length / pattern_count, " mm apart along the perimeter."));

// An ellipse with the given semi-axes.
module oval(a, b) scale([a, b]) circle(r = 1);

// Entries are [cumulative arc length, ellipse parameter in degrees]. Only one
// quarter is needed; the other three mirror it. Chord sampling at <=0.94 degrees
// is finer than the visible polygon and is independent of the pattern count.
function ellipse_arc_table(n, i = 0, length = 0) =
    let(a = i * 90 / n, b = (i + 1) * 90 / n,
        step = norm([out_a * (cos(b) - cos(a)), out_b * (sin(b) - sin(a))]))
    i == n ? [[length, a]] :
    concat([[length, a]], ellipse_arc_table(n, i + 1, length + step));

function ellipse_parameter(s, lo = 0, hi = len(ellipse_quarter) - 1) =
    hi - lo <= 1 ?
        let(p = ellipse_quarter[lo], q = ellipse_quarter[hi])
        p[1] + (q[1] - p[1]) * (s - p[0]) / (q[0] - p[0]) :
        let(mid = floor((lo + hi) / 2))
        s < ellipse_quarter[mid][0] ? ellipse_parameter(s, lo, mid) :
                                    ellipse_parameter(s, mid, hi);

function fraction(x) = x - floor(x);

// Return the ellipse point and its outward unit normal at perimeter fraction f.
// Offsetting along this normal gives the same relief depth on every side.
function perimeter_point_normal(f) =
    let(q = min(3, floor(f * 4)), t = f * 4 - q,
        a = ellipse_parameter((q % 2 == 0 ? t : 1 - t) * perimeter_length / 4),
        p = [out_a * cos(a) * (q == 1 || q == 2 ? -1 : 1),
             out_b * sin(a) * (q >= 2 ? -1 : 1)],
        n = [p[0] / (out_a * out_a), p[1] / (out_b * out_b)])
    [p, n / norm(n)];

// Same pattern functions and controls as babywipesboxV2. Angles describe the
// fraction of perimeter travelled, not the ellipse's polar angle.
function triangle_wave(a) = 1 - acos(cos(a)) / 180;
function pattern_shift(z, pattern) =
    pattern == "spiral" ? pattern_twist * z / height :
    pattern == "waves" ? 360 / pattern_count * sin(360 * z / pattern_pitch) :
    pattern == "chevron" ? 360 / pattern_count * (4 * abs(fraction(z / pattern_pitch) - 0.5) - 1) : 0;

function pattern_profile(a, z, pattern) =
    let(phase = a * pattern_count)
    pattern == "diamond" ?
        min(triangle_wave(phase + 360 * z / pattern_pitch),
            triangle_wave(phase - 360 * z / pattern_pitch)) :
    pattern == "flutes" ? (1 + cos(phase)) / 2 :
    max(0, cos(phase - pattern_count * pattern_shift(z, pattern)));

// One closed relief mesh overlaps the original blank. The unchanged cavity is
// subtracted AFTER their union, preserving the fit and floor push-out hole.
module exterior_relief(pattern = exterior_pattern) {
    if (pattern != "none" && pattern_depth > 0) {
        low = pattern_low;
        high = height - pattern_low;
        fade = min(pattern_depth, (high - low) / 3);
        samples = max(12, ceil($fn / 32) * 4);
        segments = max(4 * $fn, pattern_count * samples);
        straight = pattern == "ribs" || pattern == "flutes"
                   || (pattern == "spiral" && pattern_twist == 0);
        step = pattern == "spiral"
            ? height * 360 / (max(abs(pattern_twist), eps) * pattern_count * samples)
            : pattern_pitch / (2 * samples);
        rows = max(1, ceil((high - low - 2 * fade) / step));
        levels = straight ? [low, low + fade, high - fade, high] :
            concat([low], [for (i = [0:rows])
                low + fade + (high - low - 2 * fade) * i / rows], [high]);
        // Sink valleys into the faceted blank to avoid detached relief slivers.
        inset = min(wall / 4, max(out_a, out_b) * (1 - cos(180 / $fn)) + 0.05);
        points = [for (z = levels, j = [0:segments - 1])
            let(a = j * 360 / segments + pattern_shift(z, pattern),
                pn = perimeter_point_normal(fraction(a / 360)),
                taper = min(1, (z - low) / fade, (high - z) / fade),
                d = -inset + (pattern_depth + inset) * taper * pattern_profile(a, z, pattern),
                p = pn[0] + pn[1] * d)
            [p[0], p[1], z]];
        faces = concat(
            [[for (j = [0:segments - 1]) j]],
            [for (i = [0:len(levels) - 2], j = [0:segments - 1])
                [i * segments + j, (i + 1) * segments + j,
                 (i + 1) * segments + (j + 1) % segments]],
            [for (i = [0:len(levels) - 2], j = [0:segments - 1])
                [i * segments + j, (i + 1) * segments + (j + 1) % segments,
                 i * segments + (j + 1) % segments]],
            [[for (j = [segments - 1:-1:0]) (len(levels) - 1) * segments + j]]);
        polyhedron(points = points, faces = faces, convexity = 12);
    }
}

// Outer body: a full-size tube whose top and bottom outer edges are chamfered.
// hull() between the inset end caps and the full-size middle makes the 45 slopes.
module outer_body() {
    c = edge_chamfer;
    hull() {
        linear_extrude(eps)                oval(out_a - c, out_b - c);
        translate([0, 0, c])               linear_extrude(height - 2 * c) oval(out_a, out_b);
        translate([0, 0, height - eps])    linear_extrude(eps) oval(out_a - c, out_b - c);
    }
}

// Cavity to hollow out: an elliptical bore from the floor up and out the top,
// plus a flared lead-in at the mouth.
module cavity() {
    translate([0, 0, floor_thickness])
        linear_extrude(height) oval(in_a, in_b);
    c = mouth_chamfer;
    translate([0, 0, height - c])
        hull() {
            linear_extrude(eps) oval(in_a, in_b);
            translate([0, 0, c]) linear_extrude(eps) oval(in_a + c, in_b + c);
        }
}

// Finger push-out hole with a small countersink on the underside.
module push_hole() {
    cs = 0.5;
    translate([0, 0, -eps]) cylinder(h = floor_thickness + 2 * eps, r = hole_r);
    translate([0, 0, -eps]) cylinder(h = cs + eps, r1 = hole_r + cs, r2 = hole_r);
}

module lighter_case(pattern = exterior_pattern) {
    difference() {
        union() {
            outer_body();
            exterior_relief(pattern);
        }
        cavity();
        push_hole();
    }
}

// All parts stay upright with their original flat bottom at Z=0.
module all_patterns() {
    patterns = ["none", "ribs", "flutes", "spiral", "diamond", "waves", "chevron"];
    spacing = 2 * (out_a + pattern_depth) + 6;
    for (i = [0:len(patterns) - 1])
        translate([(i - (len(patterns) - 1) / 2) * spacing, 0, 0])
            lighter_case(patterns[i]);
}

if (part == "all_patterns") all_patterns();
else lighter_case();
