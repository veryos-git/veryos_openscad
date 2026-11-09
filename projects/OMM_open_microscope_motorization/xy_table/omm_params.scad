// =====================================================================
// OMM_v2 (VeryOS "OMM v2.3") – global parameters
// Transcribed 1:1 from the Onshape Variable Studio "variables"
// (document OMM_v2, workspace "Main", exported 2026-11-09). Units: mm / deg.
// Plus the local #variables defined inside individual part studios.
// =====================================================================

// ---- microscope slide (standard 76 x 25 x 1 mm glass slide) ----------
scl_x_slide = 76;
scl_y_slide = 25;
scl_z_slide = 1;

// ---- slide_holder ----------------------------------------------------
tol_slide_holder              = 1;    // total clearance around the slide (0.5 per side)
wall_slide_holder             = 3;
wall_inset_slide_holder       = 1.2;  // ledge that the slide rests on
scl_x_handle_slide_holder     = 40;   // length of each handle wing
wall_handle_slideholder       = 6;
scl_z_slide_holder            = 4;    // plate thickness
scl_z_inset_slide_slideholder = 2;    // depth of slide recess
scl_z_inset_slideh            = 2;    // depth of the locating groove on the underside
fillet_radius_small           = 5;

// ---- x_slider --------------------------------------------------------
wall_x_slider       = 4;
scl_x_x_slider      = 86;
tol_slideh_x_slider = 0.8;   // clearance between slide_holder groove and x_slider ring
offset_correction   = 0.8;
scl_y_x_slider      = scl_y_slide + wall_slide_holder*2 + wall_x_slider*2 - offset_correction; // = 38.2
scl_z_x_slider      = 3;
// wall_x_slider_0 : empty expression in Onshape (unused)

// ---- dovetail-ish rails (rail part studio) ---------------------------
scl_x_rail        = 2;     // male rail width
scl_y_rail        = 2;     // male rail height
ang_rail          = 45;    // chamfer angle
extr_width        = 0.42;  // printer extrusion width
tol_rail          = 0.2;   // total clearance male/female
scl_x_rail_outer  = 7.5;   // female rail block width
scl_y_rail_outer  = 4;     // female rail block height
scl_z_rail        = 100;   // rail length
dia_round_remover_rail      = 3;                          // scallop/rack notch diameter
radius_offset_round_remover = dia_round_remover_rail*0.2; // = 0.6 (notch depth)
num_round_remover           = 24;                         // notches along one rail
workaround_no_space         = 0.01;                       // local var in "rail"

scl_y_x_rail = scl_y_x_slider + wall_x_slider + scl_x_rail_outer; // = 49.7  (rail centre-to-centre in x_slider)
scl_x_x_rail = 100;

// ---- y_slider --------------------------------------------------------
scl_z_y_slider           = 2.4;
thickness_y_slider_frame = 6;
btol                     = 0.3;   // local var in y_slider (motor bracket tolerance)

// ---- table (base plate) ----------------------------------------------
dia_hole_table        = 24;
scl_z_table           = 3;
table_extra           = 20;
scl_y_table           = 130;
thickness_table_frame = 6;
chamfer_table         = 1;    // local var in table
dia_pin_remover_table = 10;   // local var in table (edge scallops)
overlap_remover_      = 3;    // local var in table

// ---- washer ----------------------------------------------------------
dia_washer_inside  = 3.5;
dia_washer_outside = 7;
extr_washer        = 0.8;

// ---- motor_shaft_adapter (28BYJ-48 shaft sleeve) ---------------------
dia_motor_shaft      = 5;     // 28BYJ-48 shaft
scl_z_motor_shaft    = 6;
thick_mshaft_adapter = 0.55;
slot_mshaft          = 3;     // width across the shaft flats

// ---- local variable in "slide" part studio ---------------------------
scl_y = 40.04981;  // measured value, not used by geometry
