// ---------------------------------------------------------------
// involute_gear.scad  -  minimal involute spur gear library
// Matches the Onshape "Spur Gear" FeatureScript parameters used in
// the mircoscpe_z_axis_motor document (module, teeth, 20 deg PA).
// No dependencies.  Units: mm.
// ---------------------------------------------------------------

function _inv(a) = tan(a) - a * PI / 180;          // involute function (a in deg) -> rad
function _polar(r, a_rad) = [r * cos(a_rad * 180 / PI), r * sin(a_rad * 180 / PI)];

// 2D outline of an involute spur gear, centred at origin
module spur_gear_2d(teeth = 20, mod = 1, pressure_angle = 20, clearance = 0.25, steps = 8) {
    rp = mod * teeth / 2;                 // pitch radius
    rb = rp * cos(pressure_angle);        // base radius
    ra = rp + mod;                        // addendum (tip) radius
    rf = rp - (1 + clearance) * mod;      // dedendum (root) radius
    half = PI / (2 * teeth) + _inv(pressure_angle);   // half tooth angle at base circle (rad)
    r0 = max(rb, rf);
    flank = [for (i = [0:steps]) let(r = r0 + (ra - r0) * i / steps) [r, half - _inv(acos(min(1, rb / r)))]];
    pts = [for (t = [0:teeth - 1]) let(c = 2 * PI * t / teeth) each concat(
              [_polar(rf, c - half)],
              [for (f = flank) _polar(f[0], c - f[1])],
              [for (i = [len(flank) - 1:-1:0]) _polar(flank[i][0], c + flank[i][1])],
              [_polar(rf, c + half)]
          )];
    polygon(pts);
}

// 3D gear.  bore: diameter (0 = none).  d_flat: across-flats for a D/double-D bore (0 = round)
module spur_gear(teeth = 20, mod = 1, thickness = 10, bore = 0, d_flat = 0,
                 pressure_angle = 20, bore_chamfer = 0) {
    difference() {
        linear_extrude(thickness) spur_gear_2d(teeth, mod, pressure_angle);
        if (bore > 0) {
            translate([0, 0, -1]) linear_extrude(thickness + 2)
                intersection() {
                    circle(d = bore, $fn = 96);
                    if (d_flat > 0) square([bore + 2, d_flat], center = true);
                }
            if (bore_chamfer > 0 && d_flat == 0) for (z = [0, thickness])
                translate([0, 0, z]) mirror([0, 0, z > 0 ? 1 : 0])
                    translate([0, 0, -0.01]) cylinder(d1 = bore + 2 * bore_chamfer + 0.02, d2 = bore, h = bore_chamfer + 0.01, $fn = 96);
        }
    }
}
