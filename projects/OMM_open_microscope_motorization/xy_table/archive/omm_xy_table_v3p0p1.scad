// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// OMM XY table v3.0.1 (the version is also engraved in the table, see version
// below): the motorised XY microscope stage of the open microscope
// motorization, rebuilt in OpenSCAD from the Onshape document OMM_v2, label
// v2.3 (OMM_v2_rebuild_kit.zip: feature trees, sketches, STLs). Same parts,
// same Onshape variable names and values. v2.4 because the table has its Y
// rail again: in Onshape a failed feature (Extrude 4) had dropped it, the
// v2.3 print file Onshape_online_CAD_version/OMM_v2p3.3mf still has it.
// v2.5 because the printed v2.4 slide holder barely went onto the X slider:
// the mouths of its grooves are rounded now, as in Onshape.
// v2.6, experimental, because the Y slider wiggles sideways on its one rail:
// a second arm on a second table rail beside the first, see y_rail2_x.
// v2.7 because the Y motor stood too close to the window and stopped the Y
// slider early: it is 5 further out, and the table's front edge follows it,
// see table_motor_y.
// v3.0.0 because the two parallel Y guides count as a new major version; new
// in it is the cutting_ruler. From here on: v3.0.1 for a small change, v3.1.0
// for a bigger one, v4.0.0 for a substantial one.
// v3.0.1 because the shaft adapter had lost Onshape's three grooves for the
// O-rings.
//
// Stack, bottom to top, all parts around one optical axis. Origin: centre of
// the windows, z = 0 at each part's sliding face (top of table and y_slider,
// bottom of x_slider and slide_holder).
//   table         base plate: two male rails along Y, bracket for the Y motor
//   y_slider      Y carriage: frame, two arms that are female rails riding on
//                 the table's rails, a male rail along X, bracket for the X motor
//   x_slider      X carriage: ring with a female rail riding on y_slider's rail
//   slide_holder  carrier for a 76 x 25 glass slide; its two grooves drop over
//                 the ring's short walls
// Drive, as read from the geometry: a 28BYJ-48 hangs on each bracket with
// two M3 screws through the slotted uprights, shaft horizontal, 8 mm below
// the motor's axis. The motor_shaft_adapter on the shaft rolls on the top of
// the moving female rail (y_slider's first arm, x_slider's rail) and drives it by
// friction. The slots set the motor's height and so the pressure on the rail.
// As built: O-rings in the grooves of each adapter, and on the top of each
// driven rail a strip of sanding paper, cut with the cutting_ruler.
//
// Print every part as modelled, flat face down, the shaft adapter closed end
// down. No supports. Units: mm.

/* [View] */
part = "assembly"; // [assembly:Assembly with motors,print_layout:All parts on a 256 x 256 bed,table:Table,y_slider:Y slider,x_slider:X slider,slide_holder:Slide holder,motor_shaft_adapter:Motor shaft adapter,washer:Washer,cutting_ruler:Cutting ruler for the sanding paper]
// Y slider on the table, assembly only
y_travel = 0; // [-20:1:35]
// X slider on the Y slider, assembly only
x_travel = 0; // [-40:1:40]

/* [Version] */
// Engraved in the table under VeryOS. Bump it together with the file name.
version = "v3.0.1";
// The brand's heading font, see the brand section of the workspace readme
text_font = "DejaVu Sans Mono:style=Bold";
text_size = 6;
engrave_depth = 0.4;
// Start of the text's baseline, the text reads along +Y as in Onshape
table_text_at = [-35.2, -76.15];
table_text_line = 11;
table_logo_w = 16;
table_logo_at = [37.5, -58];
y_slider_logo_w = 12;

/* [Glass slide] */
scl_x_slide = 76;
scl_y_slide = 25;
scl_z_slide = 1;

/* [Slide holder] */
// Total clearance around the slide
tol_slide_holder = 1;
wall_slide_holder = 3;
// Ledge the slide rests on
wall_inset_slide_holder = 1.2;
// Length of each handle
scl_x_handle_slide_holder = 40;
wall_handle_slideholder = 6;
scl_z_slide_holder = 4;
// Depth of the slide's recess
scl_z_inset_slide_slideholder = 2;
// Depth of the grooves that drop over the X slider's ring
scl_z_inset_slideh = 2;
slide_holder_scallop_pitch = 8.7;

/* [X slider] */
wall_x_slider = 4;
scl_x_x_slider = 86;
// Clearance of the slide holder's grooves on the ring's 4 mm wall, total
tol_slideh_x_slider = 0.8;
offset_correction = 0.8;
scl_z_x_slider = 3;
// +X end of the X slider's rail, as in Onshape; the rail is scl_z_rail long
x_rail_end = 49.112;
x_slider_scallop_pitch = 7.35;

/* [Rails] */
// Male rail: scl_x_rail wide, scl_y_rail high, 45 degree chamfers up to a
// top flat one extrusion width wide
scl_x_rail = 2;
scl_y_rail = 2;
extr_width = 0.42;
// Clearance of the female slot on the male rail, total
tol_rail = 0.2;
scl_x_rail_outer = 7.5;
scl_y_rail_outer = 4;
scl_z_rail = 100;
// Notches along one side of each female rail
dia_round_remover_rail = 3;
radius_offset_round_remover = dia_round_remover_rail * 0.2;
num_round_remover = 24;
// The slot's mouth is only this much wider than the male rail per side, for
// the first rail_mouth_h, as in the Onshape sketch
workaround_no_space = 0.01;
rail_mouth_h = 0.2;

/* [Y slider] */
scl_z_y_slider = 2.4;
thickness_y_slider_frame = 9;
// Length of the arms, the female rails that run on the table
y_arm_len = 70;
// Axis of the second arm and its table rail, the first is on the optical
// axis. Experimental. One table edge scallop to the left: one arm's width
// between the arms, 5.3 to the label
y_rail2_x = -15;
chamfer_y_slider = 1;
y_slider_scallop_pitch = 7.7;

/* [Table] */
scl_z_table = 3;
table_extra = 20;
thickness_table_frame = 9;
chamfer_table = 1;
// Edge scallops
dia_pin_remover_table = 10;
overlap_remover_ = 3;
table_scallop_pitch = 15.085;
// Centre of the Y motor's bracket, -57.2 in Onshape. Further from the window
// gives that much more Y travel toward the motor and that much less away
// from it
table_motor_y = -62.2;
// From the bracket to the table's front edge: the edge follows the motor
table_front_margin = 5.75;

/* [Motor bracket] */
// Two slotted uprights for the 28BYJ-48's ears, 35 apart
bracket_pitch = 35;
// From the side of the female rail it drives to the uprights
bracket_gap = 0.45;
upright_w = 9.4;
// For the M3 screw
upright_slot = 3.4;
upright_t = 3.6;
upright_h = 29.6;
// 45 degree gusset behind each leg, this high at the upright
gusset = 7.9;
bracket_foot_t = 0.9;
// The Y slider's bracket sits this deep in its plate, as in Onshape
y_bracket_z = -2.3;

/* [Motor shaft adapter] */
// 28BYJ-48 shaft: 5 round, 3 across the flats
dia_motor_shaft = 5;
slot_mshaft = 3;
// Bore depth
scl_z_motor_shaft = 6;
thick_mshaft_adapter = 0.55;
mshaft_tol = 0.1;
// Closed end and the lip around it
adapter_top = 0.772;
adapter_lip = 0.2;
// Grooves for O-rings of this cord diameter, side by side from the open end
// and this deep, as in the Onshape sketch
num_oring = 3;
dia_oring_cord = 2;
oring_groove = 0.05;
// Crush ribs on the flats, 8 per side
rib_d = 0.5;
rib_pitch = 0.7;
rib_protrude = 0.4;

/* [Washer] */
dia_washer_inside = 3.5;
dia_washer_outside = 7;
extr_washer = 0.8;

/* [Cutting ruler] */
// Plate with one window per sanding paper strip: pressed on the paper's
// back, the knife runs along the inside of a window
ruler_h = 3;
// Around the windows
ruler_rim = 12;
// Between the windows
ruler_gap = 16;
ruler_logo_w = 12;

/* [Fillets] */
// Onshape's fillets are curvature continuous, 5 from the corner; a 4 radius
// comes close
fillet_r = 4;

/* [Hidden] */
$fa = 3;
$fs = 0.25;
layer_h = 0.2;
// 28BYJ-48, assembly only
byj_shaft_offset = 8;
byj_shaft_len = 10;

// ---- derived, as in the Onshape Variable Studio ----
scl_y_x_slider = scl_y_slide + wall_slide_holder * 2 + wall_x_slider * 2 - offset_correction; // 38.2
scl_y_x_rail = scl_y_x_slider + wall_x_slider + scl_x_rail_outer; // 49.7
scl_x_x_rail = 100;
// Axis of the Y slider's male rail and the X slider's female rail
rail_y = scl_y_x_rail / 2;
window = [scl_x_x_rail - 2 * thickness_y_slider_frame, scl_y_x_rail - 2 * thickness_y_slider_frame];
table_window = [scl_x_x_rail - 2 * thickness_table_frame, scl_y_x_rail - 2 * thickness_table_frame];
table_y1 = scl_y_x_rail / 2 + table_extra;
// Not a parameter as in Onshape: 130 there, with the motor at -57.2
scl_y_table = table_y1 - table_motor_y + (bracket_pitch + upright_w) / 2 + table_front_margin;
table_cy = table_y1 - scl_y_table / 2;
// The uprights' face toward the rail they drive
table_bracket_x = scl_x_rail_outer / 2 + bracket_gap;
y_bracket_y = rail_y + scl_x_rail_outer / 2 + bracket_gap;
// Back edge of the Y slider: 0.1 beyond the bracket's foot, as in Onshape
y_back = y_bracket_y + upright_t + gusset + 0.1;
y_front = -scl_y_x_rail / 2;
y_arm_end = y_front - y_arm_len;
// Axes of the Y slider's arms and the table's rails; the motor drives the first
y_rails = [0, y_rail2_x];
// Rounded end of the arms
arm_tip_r = min(fillet_r, scl_x_rail_outer / 2);
// Sanding paper strips, [width, length]: the top of the X slider's rail, and
// of the Y slider's first arm up to its rounded end
sand_strips = [[scl_x_rail_outer, scl_z_rail], [scl_x_rail_outer, y_arm_len - arm_tip_r]];
adapter_r = dia_motor_shaft / 2 + mshaft_tol + thick_mshaft_adapter;
adapter_h = scl_z_motor_shaft + adapter_top;
// Motor axis above the sliding face, so the adapter touches the rail's top
motor_z = scl_y_rail_outer + adapter_r + byj_shaft_offset;
notch_c = scl_x_rail_outer / 2 + dia_round_remover_rail / 2 - radius_offset_round_remover;

// ---- view ----
if (part == "assembly") assembly();
else if (part == "print_layout") print_layout();
else if (part == "table") translate([0, 0, scl_z_table]) table();
else if (part == "y_slider") translate([0, 0, scl_z_y_slider]) y_slider();
else if (part == "x_slider") x_slider();
else if (part == "slide_holder") slide_holder();
else if (part == "motor_shaft_adapter") adapter_flipped();
else if (part == "washer") washer();
else if (part == "cutting_ruler") cutting_ruler();

module assembly() {
    color("goldenrod") table();
    translate([table_bracket_x + upright_t, table_motor_y, motor_z]) rotate(-90) byj48();
    translate([0, y_travel, scl_z_y_slider]) {
        color("dimgray") y_slider();
        translate([0, y_bracket_y + upright_t, motor_z]) byj48();
        translate([x_travel, 0, 0]) {
            color("silver") x_slider();
            // the grooves sit on the ring's top
            translate([0, 0, scl_z_x_slider - scl_z_inset_slideh]) {
                color("gainsboro") slide_holder();
                color("lightblue", 0.5)
                    translate([0, 0, scl_z_slide_holder - scl_z_inset_slide_slideholder]) slide();
            }
        }
    }
}

// Bambu A1 bed as in OMM_v2p3.3mf, every part flat face down
module print_layout() {
    translate([5 + table_y1, 200, scl_z_table]) rotate(90) table();
    translate([65 + scl_y_table, 112 - y_arm_end, scl_z_y_slider]) y_slider();
    translate([5 + scl_z_rail - x_rail_end, 82 + scl_y_x_slider / 2 + wall_x_slider / 2, 0]) x_slider();
    translate([86.5, 56, 0]) slide_holder();
    for (i = [0, 1]) translate([190 + 12 * i, 95, 0]) adapter_flipped();
    for (i = [0 : 3]) translate([190 + 12 * i, 80, 0]) washer();
}

// ---- table ----
module table() {
    difference() {
        union() {
            chamfered_slab(scl_z_table, chamfer_table) table_2d();
            // male rails along Y in front of the window, the first as the 2.3 print
            intersection() {
                union() for (x = y_rails)
                    translate([x, -table_window.y / 2, 0]) rotate(-90) rail_male(scl_y_table);
                linear_extrude(scl_y_rail + 1) offset(delta = -chamfer_table) table_2d();
            }
            translate([table_bracket_x, table_motor_y, 0]) rotate(-90) bracket();
        }
        translate([0, 0, -engrave_depth]) linear_extrude(engrave_depth + 1) {
            for (i = [0, 1])
                translate(table_text_at + [i * table_text_line, 0]) rotate(90)
                    text(i == 0 ? "VeryOS" : str("OMM ", version), size = text_size, font = text_font);
            translate(table_logo_at) rotate(90) logo_2d(table_logo_w);
        }
    }
}

module table_2d() {
    difference() {
        translate([0, table_cy]) difference() {
            rrect([scl_x_x_rail, scl_y_table], fillet_r);
            for (s = [-1, 1]) {
                translate([0, s * scl_y_table / 2]) rotate(s > 0 ? 0 : 180)
                    scallop_row(scl_x_x_rail, table_scallop_pitch, 0, dia_pin_remover_table, overlap_remover_);
                translate([s * scl_x_x_rail / 2, 0]) rotate(-s * 90)
                    scallop_row(scl_y_table, table_scallop_pitch, 0.5, dia_pin_remover_table, overlap_remover_);
            }
        }
        rrect(table_window, fillet_r);
    }
}

// ---- y_slider ----
module y_slider() {
    difference() {
        union() {
            translate([0, 0, -scl_z_y_slider]) {
                linear_extrude(scl_z_y_slider) y_slider_2d();
                linear_extrude(scl_y_rail_outer) arms_2d();
            }
            translate([-scl_x_x_rail / 2, rail_y, 0]) rail_male(scl_x_x_rail);
            translate([0, y_bracket_y, y_bracket_z]) bracket();
        }
        // window, chamfered at the top
        translate([0, 0, -scl_z_y_slider - 1]) linear_extrude(scl_z_y_slider + 2) rrect(window, fillet_r);
        steps(chamfer_y_slider) translate([0, 0, -chamfer_y_slider + $z])
            linear_extrude($dz + ($last ? 1 : 0.01)) offset(delta = $off) rrect(window, fillet_r);
        // the arms' slots, from inside the window to past the arms' ends
        for (x = y_rails) translate([x, -window.y / 2 + 1, -scl_z_y_slider]) rotate(-90)
            rail_slot(-window.y / 2 + 2 - y_arm_end);
        // notches along each arm's -X side
        for (x = y_rails, k = [1 : floor((y_arm_len - dia_round_remover_rail) / rail_pitch())])
            translate([x - notch_c, y_front - k * rail_pitch(), -scl_z_y_slider - 1])
                cylinder(d = dia_round_remover_rail, h = scl_y_rail_outer + 2);
        // logo on the back strip, left of the bracket
        translate([-(scl_x_x_rail / 2 + bracket_pitch / 2 + upright_w / 2) / 2,
                   (rail_y + scl_x_rail / 2 + y_back) / 2, -engrave_depth])
            linear_extrude(engrave_depth + 1) logo_2d(y_slider_logo_w);
    }
}

module y_slider_2d() {
    difference() {
        translate([0, (y_back + y_front) / 2]) difference() {
            rrect([scl_x_x_rail, y_back - y_front], fillet_r);
            translate([0, (y_back - y_front) / 2])
                scallop_row(scl_x_x_rail, y_slider_scallop_pitch, 0, 5, 0.4);
            translate([0, -(y_back - y_front) / 2]) rotate(180)
                scallop_row(scl_x_x_rail, y_slider_scallop_pitch, 0, 5, 0.4);
            for (s = [-1, 1]) translate([s * scl_x_x_rail / 2, 0]) rotate(-s * 90)
                scallop_row(y_back - y_front, y_slider_scallop_pitch, 0.5, 5, 0.4);
        }
        rrect(window, fillet_r);
    }
    arms_2d();
    for (x = y_rails) translate([x, y_front]) {
        // the edge stays straight where an arm joins: a scallop there cuts
        // through the 0.3 roof of the arm's slot
        translate([-scl_x_rail_outer / 2, 0]) square([scl_x_rail_outer, 1]);
        // fillet between the arm and the frame on the motor's side
        translate([scl_x_rail_outer / 2, 0]) difference() {
            translate([0, -fillet_r]) square(fillet_r);
            translate([fillet_r, -fillet_r]) circle(fillet_r);
        }
    }
}

module arms_2d() {
    for (x = y_rails) translate([x, 0]) hull() {
        translate([-scl_x_rail_outer / 2, y_front - 0.01]) square([scl_x_rail_outer, 0.02]);
        for (s = [-1, 1]) translate([s * (scl_x_rail_outer / 2 - arm_tip_r), y_arm_end + arm_tip_r])
            circle(arm_tip_r);
    }
}

// ---- x_slider ----
module x_slider() {
    o = [scl_x_x_slider + wall_x_slider, scl_y_x_slider + wall_x_slider];
    i = [scl_x_x_slider - wall_x_slider, scl_y_x_slider - wall_x_slider];
    x0 = x_rail_end - scl_z_rail;
    difference() {
        union() {
            linear_extrude(scl_z_x_slider) difference() {
                union() {
                    rrect(o, wall_x_slider / 2);
                    // into the rail block, so both fuse
                    translate([0, o.y / 2]) square([o.x - wall_x_slider, 2 * workaround_no_space], center = true);
                }
                rrect(i, fillet_r);
                // the back edge is under the rail
                translate([0, -o.y / 2]) rotate(180)
                    scallop_row(o.x, x_slider_scallop_pitch, 0.5, 5, 0.4);
                for (s = [-1, 1]) translate([s * o.x / 2, 0]) rotate(-s * 90)
                    scallop_row(o.y, x_slider_scallop_pitch, 0, 5, 0.4);
            }
            translate([x0, rail_y, 0]) rail_female(scl_z_rail);
        }
        // notches along the rail's back side, a half notch at each end
        for (k = [0 : num_round_remover - 1])
            translate([x0 + k * rail_pitch(), rail_y + notch_c, -1])
                cylinder(d = dia_round_remover_rail, h = scl_y_rail_outer + 2);
    }
}

// ---- slide_holder ----
module slide_holder() {
    L = 2 * (scl_x_slide / 2 + tol_slide_holder / 2 + wall_slide_holder + scl_x_handle_slide_holder);
    W = scl_y_slide + tol_slide_holder + 2 * wall_slide_holder;
    recess = [scl_x_slide + tol_slide_holder, scl_y_slide + tol_slide_holder];
    win = recess - 2 * [wall_inset_slide_holder, wall_inset_slide_holder];
    handle = [scl_x_handle_slide_holder - 2 * wall_handle_slideholder, W - 2 * wall_handle_slideholder];
    handle_x = L / 2 - wall_handle_slideholder - handle.x / 2;
    groove_w = wall_x_slider + tol_slideh_x_slider;
    difference() {
        linear_extrude(scl_z_slide_holder) difference() {
            rrect([L, W], fillet_r);
            rrect(win, fillet_r);
            for (s = [-1, 1]) translate([s * handle_x, 0]) rrect(handle, fillet_r);
            for (s = [-1, 1]) {
                translate([0, s * W / 2]) rotate(s > 0 ? 0 : 180)
                    scallop_row(L, slide_holder_scallop_pitch, 0, 5, 0.5);
                translate([s * L / 2, 0]) rotate(-s * 90)
                    scallop_row(W, slide_holder_scallop_pitch, 0, 5, 0.5);
            }
        }
        translate([0, 0, scl_z_slide_holder - scl_z_inset_slide_slideholder])
            linear_extrude(scl_z_inset_slide_slideholder + 1) square(recess, center = true);
        // grooves over the X slider's ring
        for (s = [-1, 1]) translate([s * scl_x_x_slider / 2, 0, -1])
            linear_extrude(scl_z_inset_slideh + 1) groove_2d(groove_w, W);
    }
}

// One groove across the holder, W wide. Its mouths on the long edges are
// rounded as in Onshape: square ones run into the rounded inner corners of
// the X slider's ring.
module groove_2d(w, W) {
    square([w, W + 2], center = true);
    for (i = [0, 1], j = [0, 1]) mirror([i, 0]) mirror([0, j])
        translate([w / 2, W / 2]) difference() {
            translate([0, -fillet_r]) square([fillet_r, fillet_r + 1]);
            translate([fillet_r, -fillet_r]) circle(fillet_r);
        }
}

module slide() {
    translate([0, 0, scl_z_slide / 2]) cube([scl_x_slide, scl_y_slide, scl_z_slide], center = true);
}

// ---- small parts ----
// Sleeve on the 28BYJ-48 shaft: open end at z = 0
module motor_shaft_adapter() {
    rib_tip = slot_mshaft / 2 + mshaft_tol;
    flat = rib_tip + rib_protrude;
    difference() {
        union() {
            cylinder(r = adapter_r, h = scl_z_motor_shaft);
            translate([0, 0, scl_z_motor_shaft])
                cylinder(r1 = adapter_r, r2 = adapter_r + adapter_lip, h = adapter_top);
        }
        translate([0, 0, -1]) linear_extrude(scl_z_motor_shaft + 1) difference() {
            intersection() {
                circle(d = dia_motor_shaft + 2 * mshaft_tol);
                square([2 * flat, dia_motor_shaft + 1], center = true);
            }
            for (s = [-1, 1], k = [0 : 7])
                translate([s * (rib_tip + rib_d / 2), (k - 3.5) * rib_pitch]) circle(d = rib_d);
        }
        // the O-rings' cords, touching each other
        for (k = [0 : num_oring - 1]) translate([0, 0, (k + 0.5) * dia_oring_cord])
            rotate_extrude() translate([adapter_r + dia_oring_cord / 2 - oring_groove, 0])
                circle(d = dia_oring_cord, $fn = 72);
    }
}

module adapter_flipped() {
    translate([0, 0, adapter_h]) rotate([180, 0, 0]) motor_shaft_adapter();
}

module washer() {
    linear_extrude(extr_washer) difference() {
        circle(d = dia_washer_outside);
        circle(d = dia_washer_inside);
    }
}

// Template for the sanding paper strips: the X strip's window on the left,
// the Y strip's on the right, both from the same end. Corner at the origin.
module cutting_ruler() {
    x = [ruler_rim, ruler_rim + sand_strips[0].x + ruler_gap];
    size = [x[1] + sand_strips[1].x + ruler_rim, max(sand_strips[0].y, sand_strips[1].y) + 2 * ruler_rim];
    difference() {
        linear_extrude(ruler_h) difference() {
            translate(size / 2) rrect(size, fillet_r);
            for (i = [0, 1]) translate([x[i], ruler_rim]) square(sand_strips[i]);
        }
        translate([0, 0, ruler_h - engrave_depth]) linear_extrude(engrave_depth + 1) {
            for (i = [0, 1]) translate([x[i] + sand_strips[i].x / 2, ruler_rim / 2])
                text(i == 0 ? "X" : "Y", size = text_size, font = text_font, halign = "center", valign = "center");
            translate([x[1] - ruler_gap / 2, size.y / 2]) logo_2d(ruler_logo_w);
        }
    }
}

// ---- rails ----
// Profiles in (across, up); rails run along +X from x = 0.
function rail_pitch() = scl_z_rail / (num_round_remover - 1);

// The male rail reaches workaround_no_space into the plate it stands on
function male_profile() = let(a = scl_x_rail / 2, f = extr_width / 2, c = a - f, h = scl_y_rail,
    e = workaround_no_space)
    [[-a, -e], [a, -e], [a, h - c], [f, h], [-f, h], [-a, h - c]];

// The male profile grown by tol_rail / 2, its mouth narrowed for rail_mouth_h
function slot_profile() =
    let(a = scl_x_rail / 2, f = extr_width / 2, c = a - f, h = scl_y_rail, t = tol_rail / 2,
        k = t * (sqrt(2) - 1), m = a + workaround_no_space, e = workaround_no_space)
    [[-m, -e], [m, -e], [m, 0], [a + t, rail_mouth_h], [a + t, h - c + k], [f + k, h + t],
     [-f - k, h + t], [-a - t, h - c + k], [-a - t, rail_mouth_h], [-m, 0]];

module along_x(len) rotate([90, 0, 90]) linear_extrude(len) children();

module rail_male(len) along_x(len) polygon(male_profile());

module rail_slot(len) along_x(len) polygon(slot_profile());

module rail_female(len) along_x(len) difference() {
    translate([-scl_x_rail_outer / 2, 0]) square([scl_x_rail_outer, scl_y_rail_outer]);
    polygon(slot_profile());
}

// ---- motor bracket ----
// Two uprights bracket_pitch apart along X, their face toward the driven rail
// at y = 0, gussets and the motor toward +Y, foot at z = 0.
module bracket() {
    foot = [bracket_pitch + upright_w, upright_t + gusset];
    for (s = [-1, 1]) translate([s * bracket_pitch / 2, 0, 0]) upright();
    translate([-foot.x / 2, 0, 0]) along_x(foot.x)
        polygon([[0, 0], [foot.y, 0], [foot.y - bracket_foot_t, bracket_foot_t], [0, bracket_foot_t]]);
}

module upright() {
    r = upright_w / 2;
    leg = (upright_w - upright_slot) / 2;
    rotate([90, 0, 0]) mirror([0, 0, 1]) linear_extrude(upright_t) difference() {
        hull() {
            translate([-r, 0]) square([upright_w, 0.01]);
            translate([0, upright_h - r]) circle(r);
        }
        hull() {
            translate([-upright_slot / 2, bracket_foot_t]) square([upright_slot, 0.01]);
            translate([0, upright_h - r]) circle(d = upright_slot);
        }
    }
    for (s = [-1, 1]) translate([s * (upright_slot + leg) / 2 - leg / 2, 0, 0]) along_x(leg)
        polygon([[upright_t - 0.01, 0], [upright_t + gusset, 0], [upright_t - 0.01, gusset]]);
}

// 28BYJ-48 for the assembly: mounting face at y = 0, body toward +Y, the
// shaft toward -Y byj_shaft_offset below the axis, with its adapter.
module byj48() {
    color("steelblue") rotate([-90, 0, 0]) cylinder(d = 28, h = 19);
    color("lightgray") difference() {
        hull() for (s = [-1, 1]) translate([s * 17.5, 0, 0]) rotate([-90, 0, 0]) cylinder(d = 7, h = 0.8);
        for (s = [-1, 1]) translate([s * 17.5, -1, 0]) rotate([-90, 0, 0]) cylinder(d = 4.2, h = 3);
    }
    translate([0, 0, -byj_shaft_offset]) {
        color("lightgray") rotate([90, 0, 0]) {
            cylinder(d = 9, h = 1.5);
            cylinder(d = dia_motor_shaft, h = byj_shaft_len);
        }
        color("black") translate([0, scl_z_motor_shaft - byj_shaft_len, 0]) rotate([90, 0, 0])
            motor_shaft_adapter();
    }
}

// ---- helpers ----
module rrect(size, r) offset(r) offset(-r) square(size, center = true);

// Circles along an edge on the X axis, material at y < 0, each cutting depth
// deep; at (k + phase) * pitch from the edge's centre, up to its ends.
module scallop_row(len, pitch, phase, d, depth) {
    n = ceil(len / pitch);
    for (k = [-n : n]) let(p = (k + phase) * pitch)
        if (abs(p) <= len / 2) translate([p, d / 2 - depth]) circle(d = d);
}

// Calls its children once per layer_h step of a c high 45 degree chamfer,
// with $z the step's bottom (0 = chamfer bottom), $dz its height, $off the
// outline's offset at the step's middle and $last on the top step.
module steps(c) {
    n = max(1, round(c / layer_h));
    for (i = [0 : n - 1]) let($z = i * c / n, $dz = c / n, $off = (i + 0.5) * c / n, $last = i == n - 1)
        children();
}

// The 2D child extruded h down from z = 0, its top edges chamfered c
module chamfered_slab(h, c) {
    translate([0, 0, -h]) linear_extrude(h - c) children();
    steps(c) translate([0, 0, -c + $z]) linear_extrude($dz) offset(delta = -$off) children();
}

// ---- logo ----
// The VeryOS logo at the size of veryos_logo.svg, as in veryos_logo_cube and
// the OMM enclosure: a ring and the two arms of a V, all logo_stroke wide.
logo_r = 15.6264133379;
logo_stroke = 5;
logo_angle = 22.5;
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;

// width wide, centred on the origin
module logo_2d(width) scale(width / logo_w) translate([0, -logo_r]) logo();

module logo() {
    difference() {
        union() {
            translate([0, logo_r]) circle(r = logo_r);
            for (m = [0, 1]) mirror([m, 0])
                translate([logo_b, 0]) rotate(-logo_angle)
                    translate([-logo_stroke, 0]) square([logo_stroke, logo_arm]);
            polygon([[-logo_b, 0], [logo_b, 0],
                     [logo_b + logo_r * tan(logo_angle), logo_r],
                     [-logo_b - logo_r * tan(logo_angle), logo_r]]);
        }
        translate([0, logo_r]) for (a = [0, 180]) rotate(a) s_hole();
    }
}

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
