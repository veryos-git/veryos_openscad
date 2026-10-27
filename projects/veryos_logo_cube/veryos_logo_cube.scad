// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// VeryOS logo cube: the VeryOS logo (veryos_logo.svg) extruded into a solid
// block, with a smaller logo engraved in its flat bottom face, the face it
// stands on.
// The logo is built from circles and rectangles with the measures of
// veryos_logo.svg, so the file needs no external SVG and the curves stay
// smooth at any size.
//
// Print lying on its back: every layer is the logo outline, so nothing
// overhangs and needs support. The top face is the front; the bed side shows
// the logo mirrored. The engraving sits on a wall and reads correctly from
// outside.
// Origin: middle of the logo's flat bottom edge, back face on z = 0.
//
// Units: mm. No external libraries needed.

/* [Size] */
logo_width = 50;
// From the back face to the front face; also the print height.
depth = 50;

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
logo_h = 2 * logo_r;
// The S in the ring: two half rings around half discs, all strokes
// logo_stroke wide.
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;

logo_scale = logo_width / logo_w;
bottom_width = 2 * logo_b * logo_scale;
// The engraved logo lies with its width along the depth.
engraving_scale = min((bottom_width - 2 * engraving_margin) / logo_h,
                      (depth - 2 * engraving_margin) / logo_w);

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

difference() {
    linear_extrude(depth) scale(logo_scale) logo();
    // into the flat bottom face (y = 0), centred on it
    translate([0, engraving_depth, depth / 2]) rotate([90, 0, 0])
        linear_extrude(engraving_depth + eps) rotate(-90) scale(engraving_scale)
            translate([0, -logo_r]) logo();
}
