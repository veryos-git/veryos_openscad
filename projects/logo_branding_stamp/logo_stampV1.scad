// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Logo branding stamp V1: a brass stamp that screws onto a temperature
// controlled soldering iron, like a tip for heat-set inserts, and presses the
// logo into FDM prints (PLA, PETG). Made for CNC milling at JLCCNC.
//
// The logo comes from a DXF and stands logo_relief proud of the stamp face,
// mirrored, so its impression reads the right way round. A square head carries
// it; a round neck on the back holds the mount: a blind hole for a thread
// (the stamp screws onto a male stud) or a bore with a set screw (the stamp
// slips over a plain round tip).
//
// The thread is not modelled: the hole has the tap drill's diameter, and the
// thread goes into the order as a note, as JLCCNC asks for.
//
// logo_stampV1_TraceTrove.scad is this file with the TraceTrove logo.
// build.py writes the DXFs, the STEP file and the checks.
//
// Origin: on the axis, at the neck's end face. The logo points to +z.
// Units: mm. No external libraries needed.

/* [Logo] */
// Lines and arcs only, closed contours, no doubled entities (build.py dxf).
logo_dxf = "veryos_logo.dxf";
// Size and centre of the logo in the DXF, from build.py analyze.
logo_dxf_size = [43.9095, 31.2528];
logo_dxf_center = [0, 0];
// The height follows from the DXF's proportions.
logo_width = 8;
// How far the logo stands above the stamp face.
logo_relief = 0.4;
// Least distance from the logo to the head's edges.
logo_edge_clearance = 1;
// Inner corners of the logo get this radius, the radius of the end mill that
// cuts them; gaps narrower than twice the radius stay closed. 0 = as drawn.
logo_inner_radius = 0.25;
// true for the stamp; false shows the logo as the impression will read.
logo_mirror = true;

/* [Head] */
head_width = 10;
head_depth = 10;
head_thickness = 5;
// One corner of the head is cut off, to tell where the logo's top is without
// looking at the face: it is the impression's top left corner. 0 = none.
orientation_chamfer = 1;

/* [Mount] */
// thread: blind hole for a thread, the stamp screws onto a male stud.
// bore: plain bore, the stamp slips over a round tip.
mount = "thread"; // [thread, bore]
// Round neck on the back of the head. 0 = the hole is in the head only.
neck_length = 5;
// Wall around the hole; the neck is as thick as the hole plus two walls.
neck_wall = 2;

/* [Mount: thread] */
// M4 x 0.7, as chosen for the iron's stud. M5 is 5 and 0.8.
thread_diameter = 4;
thread_pitch = 0.7;
// Depth of the full thread. Not less than the stud is long.
thread_depth = 5;

/* [Mount: bore] */
// Diameter of the tip the stamp slips over. Placeholder: measure the tip.
bore_diameter = 6;
// Added to the bore's diameter.
bore_clearance = 0.05;
bore_depth = 8;
// Thread of the set screw in the neck's side, M3 x 0.5. 0 = no set screw.
set_screw_diameter = 3;
set_screw_pitch = 0.5;

/* [Quality] */
$fn = 128;

/* [Hidden] */
eps = 0.01;
logo_scale = logo_width / logo_dxf_size[0];
logo_height = logo_dxf_size[1] * logo_scale;
// The hole as it is machined: a tap drill is the thread's diameter less its
// pitch (3.3 for M4, 4.2 for M5).
hole_nominal = mount == "thread" ? thread_diameter : bore_diameter;
hole_diameter = mount == "thread" ? thread_diameter - thread_pitch : bore_diameter + bore_clearance;
// A blind thread ends half a diameter above the hole's bottom (JLCCNC's
// threaded hole guideline). The drill's 118 degree point comes below that.
thread_runout = thread_diameter / 2;
hole_depth = mount == "thread" ? thread_depth + thread_runout : bore_depth;
hole_point = mount == "thread" ? hole_diameter / 2 / tan(59) : 0;
neck_diameter = hole_nominal + 2 * neck_wall;
face_z = neck_length + head_thickness;
// Solid brass between the hole and the stamp face.
floor_thickness = face_z - hole_depth - hole_point;

assert(logo_width + 2 * logo_edge_clearance <= head_width + eps
       && logo_height + 2 * logo_edge_clearance <= head_depth + eps,
       "The logo is closer to the head's edge than logo_edge_clearance; lower logo_width or enlarge the head.");
assert(neck_length == 0 || neck_diameter <= min(head_width, head_depth),
       "The neck is thicker than the head; lower neck_wall.");
assert(floor_thickness >= 1,
       "Less than 1 mm of brass between the hole and the stamp face; lengthen the neck or shorten the hole.");
assert(mount != "thread" || thread_depth <= 3 * thread_diameter,
       "JLCCNC taps a thread at most three diameters deep.");
assert(mount != "bore" || set_screw_diameter == 0 || neck_length >= set_screw_diameter + 2,
       "The neck is too short for the set screw.");

// The logo as it lies on the stamp face: centred, logo_width wide, mirrored.
module logo_2d() {
    offset(r = -logo_inner_radius) offset(r = logo_inner_radius)
        scale([logo_mirror ? -logo_scale : logo_scale, logo_scale])
            translate(-logo_dxf_center) import(logo_dxf);
}

module logo() {
    translate([0, 0, face_z - eps]) linear_extrude(logo_relief + eps) logo_2d();
}

// Head and neck. The cut corner is at the impression's top left, which is
// the top right when looking at the mirrored logo.
module stamp_body() {
    side = logo_mirror ? 1 : -1;
    translate([0, 0, neck_length]) linear_extrude(head_thickness) difference() {
        square([head_width, head_depth], center = true);
        translate([side * head_width / 2, head_depth / 2]) rotate(45)
            square(orientation_chamfer * sqrt(2), center = true);
    }
    if (neck_length > 0) cylinder(d = neck_diameter, h = neck_length + eps);
}

// What the mount removes: the hole from the neck's end, and for the bore the
// set screw's tap hole through the neck's wall, halfway along the neck.
module mount_cut() {
    translate([0, 0, -eps]) cylinder(d = hole_diameter, h = hole_depth + eps);
    if (hole_point > 0)
        translate([0, 0, hole_depth - eps]) cylinder(d1 = hole_diameter, d2 = 0, h = hole_point + eps);
    if (mount == "bore" && set_screw_diameter > 0)
        translate([0, 0, neck_length / 2]) rotate([-90, 0, 0])
            cylinder(d = set_screw_diameter - set_screw_pitch, h = max(head_width, head_depth));
}

// The colours only tell the logo from the stamp face in the preview.
module stamp() {
    difference() {
        union() {
            color("goldenrod") stamp_body();
            color("saddlebrown") logo();
        }
        color("goldenrod") mount_cut();
    }
}

stamp();
