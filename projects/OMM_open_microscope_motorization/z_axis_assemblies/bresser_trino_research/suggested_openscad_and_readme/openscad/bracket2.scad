// ---------------------------------------------------------------------------
// bracket2.scad  -  BEST-EFFORT reconstruction of Onshape part studio "bracket2"
// Coordinates are identical to Onshape (Z up, Top plane = XY, Front plane = XZ),
// so you can overlay the exported reference mesh with  show_reference = true.
//
// Built from the Onshape feature tree (see ../bracket2/feature_tree.txt):
//   1. C-clamp ring  : Sketch 1 (Top) slot path, width #thick = 9, mirrored about XZ,
//                      arms tilted by #angcomp = 1 deg, extruded 20 mm  (z 0..20)
//   2. Block         : Sketch 3 (Top) region x -26.225..25.717, y -67.25..arm, z 0..20
//   3. Motor plate   : Sketch 4 on face y = -67.25, 5 mm thick, two slots 4 mm wide
//                      (10 mm rounded ends) at 35 mm pitch for a 28BYJ-48, D25 cut-out
//   4. Gusset        : Chamfer 2, 30 mm x 45 deg on the concave plate/block edge
//   5. Clamp holes   : Sketch 2 (Front) D7 at x -35.695, z 10.048, through both arm tips
//                      (Onshape cuts these with bodies derived from "screw_long" -
//                       check the STEP for thread / head pocket details)
// Things NOT verified: exact hole geometry (thread / pocket), small edge chamfers.
// ---------------------------------------------------------------------------

show_reference = false;     // true: ghost-overlay the exported Onshape mesh
thick   = 9;                // #thick
angcomp = 1;                // #angcomp (deg) - arm tilt (spring pre-load)
ring_h  = 20;               // Extrude 1 depth

// slot-path centre points (Sketch 1, half - mirrored about y = 0)
back_x   = 21.217;          // centre line of back wall (outer face x = 25.717)
corner_y = 23.922;
tip      = [-39.273, 24.978];   // arm tip cap centre (65 mm from back wall, 1 deg tilt)

// motor plate (Sketch 4, plane y = -67.25, sketch X = world X, sketch Y = world Z)
plate_y0  = -67.25;
plate_t   = 5;
motor_cx  = -5.783;         // mirror line / motor cut-out centre x
slot_dx   = 17.5;           // 35 mm hole pitch / 2
slot_len  = 35;             // slot centre distance (z 0 .. -35)
cutout_d  = 25;

$fn = 64;

module slot2d(a, b, w) hull() { translate(a) circle(d = w); translate(b) circle(d = w); }

module c_ring() {
    linear_extrude(ring_h) for (m = [0, 1]) mirror([0, m, 0]) {
        slot2d([back_x, 0], [back_x, corner_y], thick);
        slot2d([back_x, corner_y], tip, thick);
    }
}

module block() {
    // region between the -Y arm and the plate face (Sketch 3 -> Extrude 2 up to top face)
    translate([-26.225, plate_y0, 0]) cube([25.717 + 26.225, (-corner_y) - plate_y0, ring_h]);
}

module plate2d() {   // in sketch coords: X = world X, Y = world Z
    difference() {
        union() {
            for (s = [-1, 1]) slot2d([motor_cx + s * slot_dx, 0], [motor_cx + s * slot_dx, -slot_len], 10);
            translate([motor_cx - slot_dx, -slot_len]) square([2 * slot_dx, slot_len]);
        }
        for (s = [-1, 1]) slot2d([motor_cx + s * slot_dx, 0], [motor_cx + s * slot_dx, -slot_len], 4);
        translate([motor_cx, -slot_len]) circle(d = cutout_d);
        translate([-100, 0]) square([200, 50]);           // clip slot caps above z = 0
    }
}

module plate() {
    // sketch plane y = -67.25, extruded 5 mm towards +Y
    translate([0, plate_y0, 0]) rotate([90, 0, 0]) mirror([0, 0, 1]) linear_extrude(plate_t) plate2d();
}

module gusset() {
    // 30 x 30 mm 45 deg fill between the inner plate face and the block bottom,
    // between the two 4 mm slots
    x0 = motor_cx - slot_dx + 2; x1 = motor_cx + slot_dx - 2;
    translate([x0, plate_y0 + plate_t, 0]) rotate([90, 0, 90])
        linear_extrude(x1 - x0) polygon([[0, 0], [30, 0], [0, -30]]);
}

module motor_cutout() {   // D25 cut-out, also trims the gusset (as seen in Onshape back view)
    translate([motor_cx, plate_y0 - 1, -slot_len]) rotate([-90, 0, 0]) cylinder(d = cutout_d, h = 40);
}

module clamp_holes() {
    translate([-35.695, 0, 10.048]) rotate([90, 0, 0]) cylinder(d = 7, h = 80, center = true);
}

module bracket2() {
    difference() {
        union() { c_ring(); block(); plate(); gusset(); }
        clamp_holes();
        motor_cutout();
    }
}

bracket2();
if (show_reference) %import("../bracket2/bracket2.stl");
