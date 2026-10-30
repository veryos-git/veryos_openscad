// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Parametric reconstruction of the BIC J5/J25 mini lighter case (bicj5j25).
//
// The original is an Onshape model, and its feature tree is parameter driven:
//   #thickshell 1.2, #height 50.8, #bottom_thick 1.2, #bot_inside_wall_thick 1.2,
//   #top_chamfer 0.2 (applied twice), #r_circle 0.8 (labelled as a diameter),
//   #overlap -0.05, #num_pattern 24.
// The pattern sketch is the lighter itself, 22.2 x 12.7 mm.
//
// The case is a thin oval tube, open at the top. Its floor is a 1.2 mm ring
// sized so the lighter rests on a 2 mm ledge; the hole in the middle lets you
// push the lighter back out with a finger. Because a smooth tube that fits this
// tightly is hard to push in and pull out, the inner wall carries a ring of
// small round ribs that grip the lighter. Fewer ribs slide more easily but hold
// less; more ribs hold better but are harder to insert.
//
// Units: mm. No external libraries required.

/* [Lighter (BIC J5 / J25 mini, 6 cm)] */
// Across the flat faces of the lighter.
lighter_width = 22.2;
// Front to back of the lighter.
lighter_depth = 12.7;
// Plastic body height, which is how much of the lighter the case covers. The
// metal top stays exposed.
lighter_height = 50.8;

/* [Case] */
// Wall thickness of the tube where there is no rib. Onshape: #thickshell.
wall_thickness = 1.2;
// Radial gap between the rib tips and the lighter. Onshape: #overlap.
fit_clearance = 0.05;
// Height of the floor ring at the bottom of the case.
floor_thickness = 1.2;
// The floor hole is this much smaller than the lighter on every side, so this
// is the width of the ledge the lighter stands on.
floor_lip = 2.0;
// 45 degree chamfer on the outer bottom edge and on the cavity mouth. Onshape
// applies two 0.2 chamfers at the mouth, so 0.4 overall.
edge_chamfer = 0.4;

/* [Ribs] */
// Number of ribs around the case; 0 gives a plain shell. Onshape: #num_pattern.
rib_count = 24; // [0:96]
// Diameter of the round rib raised from the inner wall. Its radius is also the
// rib height, so 0.8 gives 0.4 mm of grip. Onshape: #r_circle.
rib_diameter = 0.8;

/* [Display] */
// Cut the case in half so the ribs and the floor ledge are visible.
cutaway = false;
// Facets per full circle.
quality = 96; // [48,64,96,128]

/* [Hidden] */
$fn = quality;
eps = 0.01;
// Slices used to approximate the 45 degree flare at the cavity mouth. The
// cavity profile is not convex, so it cannot be chamfered with hull().
chamfer_steps = 8;
// A rib is much smaller than the case, so it needs far fewer facets. Keep its
// facets about 0.1 mm long to stop the 2D booleans from filling up with slivers.
rib_facets = max(8, min(quality, ceil(PI * rib_diameter / 0.1)));

half_width = lighter_width / 2;
half_depth = lighter_depth / 2;
rib_radius = rib_diameter / 2;
// The inner wall the ribs stand on. Adding the rib height gives the profile the
// rib tips describe, and adding the wall gives the outside of the case.
cav_a = half_width + fit_clearance + rib_radius;
cav_b = half_depth + fit_clearance + rib_radius;
out_a = cav_a + wall_thickness;
out_b = cav_b + wall_thickness;
// Pushing the hole in by floor_lip leaves a ledge the lighter can rest on.
hole_a = half_width - floor_lip;
hole_b = half_depth - floor_lip;
total_height = floor_thickness + lighter_height;

assert(edge_chamfer < wall_thickness, "The mouth flare would break through the wall.");
assert(hole_a > eps && hole_b > eps, "floor_lip is larger than the lighter.");

// ---------------------------------------------------------------------------
// 2D profiles
// ---------------------------------------------------------------------------

// Ellipse with the given semi axes.
module oval(a, b) {
    scale([a, b]) circle(r = 1);
}

// The child grown outwards by delta. offset(0) is a no-op that still rebuilds
// the profile, and stacking identical faces upsets the boolean engine, so skip
// it when there is nothing to grow.
module grown(delta = 0) {
    if (delta == 0) children();
    else offset(delta = delta) children();
}

// Arc length of an ellipse, measured from parameter 0 to t (degrees). The
// midpoint rule is enough here: the result is only used to space the ribs.
function ellipse_arc(t, a, b, n = 48) = ellipse_arc_sum(n, t / n, a, b, 0, 0);

function ellipse_arc_sum(n, dt, a, b, i, acc) =
    i >= n
        ? acc
        : let (m = (i + 0.5) * dt,
               dx = a * sin(m),
               dy = b * cos(m))
          ellipse_arc_sum(n, dt, a, b, i + 1, acc + sqrt(dx * dx + dy * dy) * dt);

// Ellipse parameter at which the arc length from 0 reaches s, by bisection.
function ellipse_param(s, a, b, lo = 0, hi = 360, i = 0) =
    i >= 24
        ? (lo + hi) / 2
        : let (mid = (lo + hi) / 2)
          ellipse_arc(mid, a, b) < s
              ? ellipse_param(s, a, b, mid, hi, i + 1)
              : ellipse_param(s, a, b, lo, mid, i + 1);

// The ribs sit at equal distances along the curve, which is what Onshape's
// curve pattern does. On an oval that is not the same as equal angles.
function rib_angles() =
    let (perimeter = ellipse_arc(360, cav_a, cav_b))
    [for (i = [0 : rib_count - 1]) ellipse_param(i * perimeter / rib_count, cav_a, cav_b)];

// Cross section of the cavity: the oval inner wall with the ribs raised from
// it. Each rib is a round bump whose centre sits on the wall, so its radius is
// also how far it reaches into the cavity.
module ribbed_2d() {
    difference() {
        oval(cav_a, cav_b);
        for (t = rib_angles())
            translate([cav_a * cos(t), cav_b * sin(t)])
                circle(r = rib_radius, $fn = rib_facets);
    }
}

// Cavity cross section with the mouth flare. Offsetting the whole ribbed
// profile outwards is what turns the 45 degree chamfer into a lead-in: the
// plain wall moves out by grow and the ribs are cut back by the same amount,
// so the ribs are gone once grow reaches rib_radius.
module cavity_2d(grow = 0) {
    grown(grow) ribbed_2d();
}

// ---------------------------------------------------------------------------
// Solids
// ---------------------------------------------------------------------------

// Outer prism with a 45 degree chamfer on the top and bottom rim.
module outer_solid() {
    hull() {
        translate([0, 0, 0]) linear_extrude(eps) grown(-edge_chamfer) oval(out_a, out_b);
        translate([0, 0, edge_chamfer]) linear_extrude(eps) oval(out_a, out_b);
        translate([0, 0, total_height - edge_chamfer]) linear_extrude(eps) oval(out_a, out_b);
        translate([0, 0, total_height]) linear_extrude(eps) grown(-edge_chamfer) oval(out_a, out_b);
    }
}

// Cavity with a 45 degree lead-in at the mouth, laid down as a stack of slices.
module cavity_solid() {
    linear_extrude(height = lighter_height - edge_chamfer) cavity_2d();
    if (edge_chamfer > 0)
        for (i = [0 : chamfer_steps - 1])
            translate([0, 0, lighter_height - edge_chamfer + i * edge_chamfer / chamfer_steps])
                linear_extrude(height = edge_chamfer / chamfer_steps + eps)
                    cavity_2d(grow = edge_chamfer * (i + 1) / chamfer_steps);
}

module lighter_case() {
    difference() {
        outer_solid();
        translate([0, 0, floor_thickness]) cavity_solid();
        // Push out hole through the floor ring.
        translate([0, 0, -eps]) linear_extrude(floor_thickness + 2 * eps) oval(hole_a, hole_b);
        if (cutaway) translate([-out_a - 1, 0, -1]) cube([2 * out_a + 2, out_a + 1, total_height + 2]);
    }
}

lighter_case();
