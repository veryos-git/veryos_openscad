// Parametric Turntable
//
// Two revolved profiles around the central Z axis:
//   - Bottom plate: floor + central boss that locates the bearing's inner ring
//   - Top plate:    disc + downward bearing-housing ring + downward outer skirt
//
// The bearing itself is NOT generated. Source a stock bearing matching the
// outer_diameter_bearing / inner_diameter_bearing / height_bearing parameters.
// Assembled view: bottom plate sits on the table, top plate rests on the
// outer ring of the bearing and rotates freely.

/* [Quality] */
$fn = 128;

/* [Overall] */
radius = 120;                  // outer radius of the turntable

/* [Plate geometry] */
hbot = 2;                      // bottom plate floor thickness
thick_top_plate = 2;           // top plate disc thickness
thicko = 2;                    // top plate outer skirt thickness
thick_bearing_housing = 3;     // top plate bearing housing wall thickness

/* [Bearing] */
outer_diameter_bearing = 22;
inner_diameter_bearing = 8;
height_bearing = 7;
overlap_bearing = 1;           // axial depth the housing wall grips the bearing OD

/* [Tolerance] */
small_tollerance = 0.2;        // total clearance, split half on each side

/* [Render] */
part = "both"; // [bottom, top, both, section]

// ---------- Derived ----------
or_b        = outer_diameter_bearing / 2;
ir_b        = inner_diameter_bearing / 2;

boss_r      = ir_b - small_tollerance/2;
boss_h      = height_bearing - small_tollerance/2;

z_top_und   = hbot + height_bearing;            // top plate underside
z_top_top   = z_top_und + thick_top_plate;

r_bottom    = radius - thicko - small_tollerance*4;  // bottom plate outer radius

housing_in  = or_b + small_tollerance/2;
housing_out = housing_in + thick_bearing_housing;
z_housing_b = z_top_und - overlap_bearing;

z_skirt_bot = small_tollerance;                 // tiny gap from the table surface

// ---------- 2D Profiles (revolved around X = 0) ----------
module bottom_profile() {
    polygon([
        [0,        0],
        [r_bottom, 0],
        [r_bottom, hbot],
        [boss_r,   hbot],
        [boss_r,   hbot + boss_h],
        [0,        hbot + boss_h],
    ]);
}

module top_profile() {
    polygon([
        [0,               z_top_und],
        [housing_in,      z_top_und],
        [housing_in,      z_housing_b],
        [housing_out,     z_housing_b],
        [housing_out,     z_top_und],
        [radius - thicko, z_top_und],
        [radius - thicko, z_skirt_bot],
        [radius,          z_skirt_bot],
        [radius,          z_top_top],
        [0,               z_top_top],
    ]);
}

// ---------- 3D Parts ----------
module bottom_plate() { rotate_extrude() bottom_profile(); }
module top_plate()    { rotate_extrude() top_profile(); }

// ---------- Render ----------
if (part == "bottom") {
    bottom_plate();
} else if (part == "top") {
    top_plate();
} else if (part == "both") {
    color("steelblue") bottom_plate();
    color("tomato", 0.6) top_plate();
} else if (part == "section") {
    difference() {
        union() {
            color("steelblue") bottom_plate();
            color("tomato")    top_plate();
        }
        translate([-radius - 1, 0, -10])
            cube([2*radius + 2, radius + 10, z_top_top + 20]);
    }
}
