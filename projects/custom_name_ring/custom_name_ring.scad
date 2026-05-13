// Copyright (C) 2026 VeryOS - Licensed under MIT.

// Custom name ring: revolves a band cross-section from ring_18.4dia.dxf
// to form a ring, then engraves a name into the outer wall.
//
// The DXF was drawn for a ~18.4 mm inner diameter. Changing ring_diameter
// shifts the profile radially without scaling the cross-section, so the
// band thickness/height stay the same as the size changes.

/* [Ring] */
ring_diameter = 18.4;   // [10:0.1:30]  inner diameter in mm

/* [Name engraving] */
name         = "ANNA";
text_size    = 3.0;     // [1:0.1:6]   mm
text_depth   = 0.6;     // [0.1:0.05:2]  mm into the outer wall
text_font    = "Liberation Sans:style=Bold";
char_spacing = 1.2;     // [0.8:0.05:2]  multiplier of text_size along the arc

/* [DXF profile reference] */
// Measured from ring_18.4dia.dxf — adjust only if the source DXF changes.
profile_inner_radius = 9.285;
profile_outer_radius = 11.664;
band_height          = 5.936;

/* [Hidden] */
$fn = 200;

radial_shift      = ring_diameter / 2 - profile_inner_radius;
ring_outer_radius = profile_outer_radius + radial_shift;

module ring_band() {
    // The DXF also contains a stray line from (9.285, 2.968) to (0, 2.968)
    // that isn't part of the closed loop; OpenSCAD's import ignores it.
    rotate_extrude()
        translate([radial_shift, 0])
            import("ring_18.4dia.dxf");
}

module engraved_name() {
    n = len(name);
    angle_per_char = (text_size * char_spacing) / ring_outer_radius * 180 / PI;

    for (i = [0 : n - 1]) {
        angle = ((n - 1) / 2 - i) * angle_per_char;
        rotate([0, 0, angle])
            translate([ring_outer_radius - text_depth, 0, band_height / 2])
                rotate([90, 0, 90])
                    linear_extrude(text_depth + 0.02)
                        mirror([1, 0, 0])
                            text(name[i],
                                 size   = text_size,
                                 halign = "center",
                                 valign = "center",
                                 font   = text_font);
    }
}

difference() {
    ring_band();
    engraved_name();
}
