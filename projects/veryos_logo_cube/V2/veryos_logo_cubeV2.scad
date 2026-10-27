// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// V2: the logo extruded twice, through the front and through the side, and
// only what both extrusions share is kept, like the two sided Star Wars sign
// in ../exampletwoside. Every height of the logo has material in both
// extrusions, so the front and the right side each show the whole logo, its
// holes see-through. The back and the left side show it mirrored.
// The logo is engraved in the bottom face, as in V1.
// The logo is built from circles and rectangles with the measures of
// veryos_logo.svg, so the file needs no external SVG and the curves stay
// smooth at any size.
//
// Print standing on its bottom face. The tops of the holes overhang, like
// the top of a lying hole, most at the top of the ring and under the middle
// of the S; they need supports or a printer that bridges well. Lying on a
// side does not help: the other logo's walls then overhang.
// Origin: centre of the bottom face.
//
// Units: mm. No external libraries needed.

/* [Size] */
// Also the depth, since the side shows the same logo.
logo_width = 50;

/* [Engraving] */
// The logo in the bottom face is as large as fits inside this margin.
engraving_margin = 3;
engraving_depth = 1;

/* [Quality] */
$fn = 128;

/* [Hidden] */
eps = 0.01;
// The logo at the size of veryos_logo.svg: a ring and the two arms of a V,
// all logo_stroke wide. The arms stand logo_angle off vertical, their outer
// edges tangent to the ring, their inner edges tangent to its hole.
logo_r = 15.6264133379; // outer radius of the ring
logo_stroke = 5;
logo_angle = 22.5;
// Half the flat bottom edge, which is tangent to the ring's bottom.
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
// Outer edge of an arm. The middle of its square end is level with the
// middle of the ring's stroke at the top.
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
// The S in the ring: two half rings around half discs, all strokes
// logo_stroke wide.
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;

logo_scale = logo_width / logo_w;
// The bottom face is a square of this side.
bottom_width = 2 * logo_b * logo_scale;
engraving_scale = (bottom_width - 2 * engraving_margin) / logo_w;

// The logo at the size of veryos_logo.svg, bottom edge on y = 0, centred on
// x = 0.
module logo() {
    difference() {
        union() {
            translate([0, logo_r]) circle(r = logo_r);
            for (m = [0, 1]) mirror([m, 0])
                translate([logo_b, 0]) rotate(-logo_angle)
                    translate([-logo_stroke, 0]) square([logo_stroke, logo_arm]);
            // between the arms, below the ring's middle
            polygon([[-logo_b, 0], [logo_b, 0],
                     [logo_b + logo_r * tan(logo_angle), logo_r],
                     [-logo_b - logo_r * tan(logo_angle), logo_r]]);
        }
        translate([0, logo_r]) for (a = [0, 180]) rotate(a) s_hole();
    }
}

// One of the two holes the S leaves in the ring: the right half of the ring's
// hole above the lower half ring, and the upper half disc.
module s_hole() {
    difference() {
        intersection() {
            circle(r = ring_in);
            translate([0, -ring_in]) square(2 * ring_in);
        }
        translate([0, -(ring_in - s_small)]) circle(r = s_big);
    }
    translate([0, ring_in - s_small]) circle(r = s_small);
}

// Longer than the logo is wide, so the cut faces do not coincide.
module logo_extrusion() {
    linear_extrude(logo_width + 1, center = true) scale(logo_scale) logo();
}

difference() {
    intersection() {
        // reads from the front (-y)
        rotate([90, 0, 0]) logo_extrusion();
        // reads from the right side (+x)
        rotate([90, 0, 90]) logo_extrusion();
    }
    // reads from below
    translate([0, 0, -eps]) linear_extrude(engraving_depth + eps)
        mirror([1, 0]) scale(engraving_scale) translate([0, -logo_r]) logo();
}
