// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// A very simple BIC lighter case, reverse-engineered from bic_sleeve_plain.stl.
//
// The part is a thin elliptical tube, closed at the bottom and open at the top.
// A BIC J5/J25 mini lighter drops in from above and a small hole in the floor
// lets you push it back out with a finger. Every number below was measured off
// the STL: outer 29.85 x 19.1 mm, 70.9 mm tall, 2 mm wall, 2 mm floor,
// 1 mm chamfers on the outer edges, 0.5 mm lead-in at the mouth, 3 mm hole.
//
// Units: mm. No external libraries needed.

/* [Case] */
// Outer size across the wide faces and front-to-back.
outer_width = 29.85;
outer_depth = 19.1;
// Overall height of the sleeve.
height = 70.9;
// Thickness of the side wall and of the bottom floor.
wall = 2.0;
floor_thickness = 2.0;

/* [Details] */
// 45 degree chamfer on the outer top and bottom edges.
edge_chamfer = 1.0;
// Smaller lead-in chamfer at the inner mouth so the lighter drops in easily.
mouth_chamfer = 0.5;
// Diameter of the finger push-out hole through the floor.
hole_diameter = 3.0;

/* [Quality] */
// Facets per full circle.
$fn = 96;

/* [Hidden] */
eps = 0.01;
out_a = outer_width / 2;
out_b = outer_depth / 2;
in_a  = out_a - wall;
in_b  = out_b - wall;
hole_r = hole_diameter / 2;

// An ellipse with the given semi-axes.
module oval(a, b) scale([a, b]) circle(r = 1);

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

module lighter_case() {
    difference() {
        outer_body();
        cavity();
        push_hole();
    }
}

lighter_case();
