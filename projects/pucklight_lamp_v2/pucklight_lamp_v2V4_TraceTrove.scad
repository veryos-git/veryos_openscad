// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// TraceTrove version of pucklight_lamp_v2V4.scad: the logo is the TraceTrove
// logo V3 instead of the VeryOS logo, in the visible engravings and in the
// fingerprint. Everything else is V4's.
// V4: V3 with the option to engrave the filament's name, PLA or PETG, in the
// top part's top face and in the bottom of the screw's flange, opposite the
// logos (material), as ringclick V8. Off by default; the lampshade's shell
// is too thin for it.
// V3: V2 with the fingerprint of
// ../RGBW_pucklight_holder_ringclick/RGBW_pucklight_holder_ringclickV7.scad:
// the logo twice more in the top part and in the screw ring, as a 0.02 deep
// relief in the face on the bed, which no slicer prints, and as a watermark,
// a sealed logo shaped void inside the solid. The outside is V2's; the
// lampshade's shell is too thin for either.
// V2: the holder of
// ../RGBW_pucklight_holder_ringclick/RGBW_pucklight_holder_ringclickV6.scad
// instead of V3's: the bottom screw and the click base are one part, the
// screwin, printed in place. A plunger in the screw's opening, 0.2 around it
// and held by a lip at its top and its bottom, stands on the desk, and its
// bar turns the screw. It reaches 0.4 higher than V3's tube (tube_raise), as
// V3's barely clicked. The top part and the lampshade are V1's.
// V1: the holder of
// ../RGBW_pucklight_holder_ringclick/RGBW_pucklight_holder_ringclickV3.scad
// with a cup on top, and a simple lampshade that screws into it. The cup's
// female thread is the one of pucklight_sphere's sockel, so its spheres and
// the vases of ../pucklight_vase fit too. Inside the cup the top part stands
// up to the rim around the window, so it still prints upside down: the cup's
// floor bridges the gap between it and the cup's wall.
//
// Lamp with an RGBW puck light (62 mm KC007). The puck lies loose in a
// round top part, on the floor of a ring that screws into the top part from
// below. Its lens pokes up through a round window, whose 45 degree edge sits
// just above the lens near its rim. A plunger slides in the ring's opening
// and stands on the desk; it lifts the puck until the lens touches the
// window's edge, so the lamp floats above the desk. Pressing the lamp down
// onto the desk presses the lens in: click, the light changes. The bar
// across the plunger turns the ring. The lampshade screws into the cup on
// top, down to the cup's floor.
//
// Print the top part upside down, its top face on the bed: the cavity
// narrows from the bottom face up to the window's edge, so every layer sits
// on the one below; the overhangs are the window's 45 degree chamfer and the
// cup's floor, a short bridge.
// Print the screwin standing as it is used, the plunger inside the ring in
// its pressed position, both on the bed; push the plunger down once to free
// it. Print the lampshade on its neck. The threads have 45 degree flanks, as
// in fdm_optimized_screws, so nothing needs support. The TraceTrove logo is
// engraved in the top face of the top part and in the bottom of the screw
// ring; the plunger has no room, the lampshade's shell is too thin.
// Origin: centre of the top part's bottom face, which is also the ring's
// bottom face when it is screwed in flush, and the desk when pressed down.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on bed,assembly:Assembly on the desk,section:Assembly cut in half,lampshade:Lampshade,toppart:Top part,screwin:Screwin with the plunger,slide_test:Slide test with three gaps]

/* [Puck light] */
// The manufacturer's CAD model (../RGBW_pucklight_holder/rgbw_light_specs)
// measures 62 x 26.8 mm; the spec sheet says 62.2 x 27.6. The holders up to
// V4 were built around the CAD model and click.
puck_d = 62;
puck_height = 26.8;
// Height of the flat ring around the lens, at the top of the rounded edge.
puck_edge_height = 21;
puck_edge_radius = 7;
// The lens, a spherical cap on the flat ring. It is the button; it clicks
// wherever it is pressed.
puck_dome_d = 40;
// Radial gap around the puck in the bottom screw.
puck_clearance = 0.5;
// Gap between the lens and the window's edge while the puck lies on the
// bottom screw's floor: how far the puck can move inside the holder.
puck_play = 0.7;

/* [Top part] */
// Where the window's edge touches the lens. Larger lets more light through
// but narrows the lip that carries the edge, which must stay inside the
// lens's rim.
contact_d = 36;
// The round body's wall around the screw's recess, the thread, the cup and
// under the cup's floor: four 0.4 mm lines.
wall = 1.6;

/* [Cup] */
// The neck that screws in: the lampshade's, pucklight_sphere V3's and
// pucklight_vase's.
neck_d = 67;
neck_height = 4;
// Radial gap between the threads, as in pucklight_sphere.
neck_clearance = 0.3;
// Inside the cup the top part stands up to the rim. 1 below the bore of the
// necks, 63, and inside the single wall of a vase.
cup_core_d = 62;

/* [Lampshade] */
// A plain shade to test the lamp: from its neck a 45 degree cone out to a
// cylinder, and a 45 degree cone that closes the top. Nothing overhangs more
// than 45 degrees when it stands on its neck.
lampshade_d = 100;
// Height of the cylinder between the two cones.
lampshade_height = 40;
// Two 0.4 mm lines; thinner glows more.
shell = 0.8;
// Inside the neck's thread root, as in pucklight_sphere.
neck_wall = 1.2;

/* [Bottom screw] */
screw_height = 10.4;
// Thread at the top that fully engages the top part's; below it a wider
// flange.
screw_thread_length = 3.5;
// Floor under the puck.
lip_height = 5;
// The bar across the plunger, which turns the screw.
bar_width = 2;
// Wall between the puck and the thread's root.
screw_wall = 1.2;
// 2 mm prints best (fdm_optimized_screws).
thread_pitch = 2;
// Radial gap between the threads.
thread_clearance = 0.25;
// The screw turns this much deeper than flush. Keep it below puck_play, or
// the screw clamps the puck when turned in all the way.
seat_gap = 0.6;

/* [Plunger] */
// The plunger's tube, which lifts the puck through the bottom screw's
// opening.
press_d = 50;
press_wall = 2;
// How far the tube reaches above the bottom screw's floor when the holder is
// pressed down onto the desk. Must exceed puck_play; the rest is how far it
// pushes the button. The puck's bottom is 0.2 mm hollow inside its foot
// ring, where the tube pushes, so 1.8 pushes the button 0.9 mm. V2's 1.6
// (0.7 mm, as in the Onshape model) did not click reliably. The top part's
// cavity is built for it.
press_height = 1.8;
// Raises only the tube: the real puck lifts less than its CAD model. With
// V3's 1.8 alone the holder floats only a little on the base and barely
// clicks (2026-11-11). Each 0.1 takes 0.1 off cavity_gap, so it stays below.
tube_raise = 0.4;
// Radial gap of the print-in-place fit, the plunger in the screw's opening:
// one 0.2 mm layer, as slicers leave between support and model. The bar's
// ends get twice that in the slots.
slide_gap = 0.2;
// How far the plunger can drop below its printed position, the pressed one.
// More than the float plus seat_gap, so the holder rests on the puck, not on
// the plunger's lip.
slide = 2.5;
// How far the plunger's lips reach behind the screw's opening, so it cannot
// fall out: the top one downwards, the bottom one upwards.
lip_overlap = 0.6;
// The gaps of part = "slide_test": a cut-out of the screwin's floor with the
// plunger, once per gap.
slide_test_gaps = [0.2, 0.3, 0.4];

/* [Logo] */
// The flat TraceTrove logo V3, 20 mm wide where it is 31.75 mm tall, so a
// logo's height sets it here. The logos lie along the ring they are in.
// In the top face of the top part, between the window and the cup.
toppart_logo_height = 11;
// In the bottom of the screw's flange, beside the plunger.
screw_logo_height = 9.5;
logo_depth = 0.6;

/* [Fingerprint] */
// The logo twice more in the top part and in the screw ring, as proof of
// where a copy of the file comes from. Neither shows on the print.
// Relief: the logo recessed this little into the face that lies on the bed.
// Slicers cut the first layer at half its height, so it is in the file but
// not in the G-code.
relief_depth = 0.02;
// Watermark: the logo as a sealed void inside the solid, two layers high,
// this far above the bed. It prints as a hidden chamber; a section or the
// slicer's layer view shows it.
watermark_height = 0.4;
watermark_z = 0.8;

/* [Material] */
// Engraves the filament's name, so a print tells what it is made of: in the
// top part's top face and in the bottom of the screw's flange, opposite the
// visible logo.
material = "none"; // [none, PLA, PETG]

/* [Quality] */
$fn = 128;

/* [Hidden] */
eps = 0.01;
layout_gap = 5;
puck_r = puck_d / 2;
dome_r = puck_dome_d / 2;
dome_h = puck_height - puck_edge_height;
sphere_r = (dome_r * dome_r + dome_h * dome_h) / (2 * dome_h);
// Height of the lens above the puck's bottom, at radius r.
function lens_z(r) = puck_height - sphere_r + sqrt(sphere_r * sphere_r - r * r);
thread_depth = 0.4 * thread_pitch;
// Inner wall of the bottom screw around the puck, and its opening for the
// plunger.
bore_r = puck_r + puck_clearance;
press_r = press_d / 2;
opening_r = press_r + slide_gap;
// Major diameters of the screw's thread and of the top part's.
screw_d = 2 * (bore_r + screw_wall + thread_depth);
hole_d = screw_d + 2 * thread_clearance;
hole_minor_r = hole_d / 2 - thread_depth;
// The flange below the screw's thread fills a recess in the bottom of the
// top part, 0.5 mm wider than the flange. Both narrow to the thread in a 45
// degree cone. The top part's cone reaches its thread's crests where
// screw_thread_length begins, the flange's lies seat_gap below it.
flange_r = hole_d / 2 + 1.5;
recess_r = flange_r + 0.5;
screw_root_r = screw_d / 2 - thread_depth;
thread_start = screw_height - screw_thread_length;
recess_top = thread_start - (recess_r - hole_minor_r);
flange_h = recess_r + recess_top - seat_gap - flange_r;
// Gap between the cavity and the puck at its highest, pushed up by the tube.
cavity_gap = 0.5;
lift_z = lip_height + press_height;
// The cavity's shoulder is the 45 degree cone r + z = shoulder_c, cavity_gap
// off the puck's rounded edge. It starts at the top of the thread and ends
// at the ring's flat underside.
shoulder_c = (puck_r - puck_edge_radius) + (lift_z + puck_edge_height - puck_edge_radius)
           + (puck_edge_radius + cavity_gap) * sqrt(2);
shoulder_z = shoulder_c - hole_minor_r;
// The window's edge, puck_play above the lens while the puck lies on the
// floor.
contact_r = contact_d / 2;
contact_z = lip_height + puck_play + lens_z(contact_r);
// The ring's flat underside, cavity_gap above the flat ring around the lens
// at the puck's highest. Inside the lens's rim a lip reaches down from it to
// the window's edge. The lip's outer side is the 45 degree cone r - z =
// lip_c, cavity_gap off the flat ring's inner edge while the puck lies
// puck_clearance off centre.
underside_z = lift_z + puck_edge_height + cavity_gap;
lip_c = (dome_r - puck_clearance) - (lift_z + puck_edge_height) - cavity_gap * sqrt(2);
// The cup's female thread and its 45 degree lead-in, as in pucklight_sphere.
// Its rim, the top face, stands thread_depth above the neck. The cup's floor
// lies wall off the cavity's shoulder, where the core inside the cup meets
// it.
cup_d = neck_d + 2 * neck_clearance;
cup_h = neck_height + thread_depth;
cup_lead_r = cup_d / 2 + thread_depth;
cup_core_r = cup_core_d / 2;
cup_floor_z = shoulder_c + wall * sqrt(2) - cup_core_r;
top_z = cup_floor_z + cup_h;
// The window's radius in the top face.
window_r = contact_r + top_z - contact_z;
// The body's outside, wall off the inside: a cylinder around the recess, a
// 45 degree cone parallel to the recess's, and a cylinder around the thread
// and the cup. Upside down, nothing overhangs more than 45 degrees.
outer_r = recess_r + wall;
thread_outer_r = max(hole_d, cup_d) / 2 + wall;
lower_cone_c = recess_r + recess_top + wall * sqrt(2);
body_d = 2 * outer_r;
// The lampshade's neck, and its outside: the 45 degree cone r - z =
// neck_root_r - neck_height from the neck's root, the cylinder from
// lampshade_cyl_z to lampshade_top_z and the 45 degree cone up to the tip.
// The inside lies shell inside it.
neck_root_r = neck_d / 2 - thread_depth;
neck_bore_r = neck_root_r - neck_wall;
lampshade_r = lampshade_d / 2;
lampshade_cyl_z = neck_height + lampshade_r - neck_root_r;
lampshade_top_z = lampshade_cyl_z + lampshade_height;
lampshade_tip_z = lampshade_top_z + lampshade_r;
// Larger than the whole lamp, for cutting it in half.
view_size = 2 * (lampshade_d + top_z + lampshade_tip_z);
// The plunger at its printed position, its bottom on the bed with the
// screw's: its height, and how far the holder floats above the desk when
// released.
plunger_h = lip_height + press_height + tube_raise;
float_h = press_height + tube_raise - puck_play;
// The plunger's lip, for a fit with gap g: a 45 degree cone out of the tube
// from lip_z(g), then 0.4 straight up to the top. When the lamp is lifted it
// rests on the screw's opening, whose top edge lies in a counterbore at
// counterbore_z, slide below where the lip's cone passes it when printed.
function lip_r(g) = press_r + g + lip_overlap;
function lip_z(g) = plunger_h - 0.4 - (g + lip_overlap);
counterbore_z = lip_z(slide_gap) + slide_gap - slide;
// The bar fills the slots up to the counterbore.
bar_h = counterbore_z;
// Chamfer on the plunger's bottom edge, so the first layer's squish does not
// close the gap.
first_layer_chamfer = 0.4;
// The bottom lip, for a fit with gap g: from the chamfer 45 degrees out to
// lip_r(g), then 45 degrees back in to the tube. Above it the screw's opening
// widens in a 45 degree chamfer, g off the lip's upper cone r + z =
// bottom_lip_c(g), which stops the plunger just above its printed position.
function bottom_lip_c(g) = lip_r(g) + first_layer_chamfer;
// Each test piece: the screwin inside this radius.
slide_test_r = lip_r(max(slide_test_gaps)) + 3;
// Upper tip of the logo at its original size, where it is 20 mm wide.
logo_tip_y = 17.5 * sin(60) + (17.5 * cos(60) - 7.5) * tan(30);
// Width of a logo of the given height.
function logo_w(height) = height * 20 / (2 * logo_tip_y);
// The logos sit in the middle of the screw flange's bottom ring and of the
// top part's top face inside the cup.
screw_logo_x = (opening_r + flange_r) / 2;
toppart_logo_x = (window_r + cup_core_r) / 2;
// The fingerprint's logos sit on the radius of the visible ones, a third and
// two thirds of a turn further.
relief_angle = 120;
watermark_angle = 240;
// The material's letters: their height, their pitch along the ring, which is
// the font's, and the font, as in the other VeryOS scripts.
material_size = 4.5;
material_pitch = 0.84 * material_size;
material_font = "DejaVu Sans Mono:style=Bold";

assert(seat_gap < puck_play, "seat_gap must stay below puck_play, or the bottom screw clamps the puck.");
assert(press_height > puck_play, "press_height must exceed puck_play, or the plunger never pushes the button.");
assert(slide >= float_h + seat_gap + 0.2,
       "slide is too short: the holder would hang on the plunger's lip instead of resting on the puck.");
assert(counterbore_z >= 2, "slide is too long: the screw's floor below the counterbore must stay 2 mm high.");
assert(tube_raise < cavity_gap, "tube_raise must stay below cavity_gap, or the puck's housing reaches the ring when pressed.");
assert(lip_c + contact_z - contact_r >= 0.8,
       "contact_d is too large: the window's lip must stay inside the lens's rim, at least two 0.4 mm lines wide.");
assert(flange_h >= 1, "screw_thread_length is too long for screw_height: no flange left below the thread.");
assert(shoulder_z >= screw_height + seat_gap, "The cavity's shoulder starts below the bottom screw's top.");
assert(bore_r - lip_r(slide_gap) - 1 >= 2, "press_d is too large: the bottom screw's floor beside the counterbore must be at least 2 mm wide.");
assert(press_wall > first_layer_chamfer, "press_wall must exceed the chamfer at the plunger's bottom.");
assert(cup_core_d <= 2 * neck_bore_r - 1, "cup_core_d must stay 0.5 inside the bore of the lampshade's neck.");
assert(lampshade_d >= neck_d + 10, "lampshade_d is too small for the neck; lower neck_d.");
assert(norm([toppart_logo_x + logo_w(toppart_logo_height) / 2, toppart_logo_height / 2]) <= cup_core_r - 0.5
       && toppart_logo_x - logo_w(toppart_logo_height) / 2 >= window_r + 0.5,
       "The top part's logo does not fit on its top face; lower toppart_logo_height.");
assert(logo_w(screw_logo_height) + 2 <= flange_r - opening_r,
       "The screw's logo is wider than its flange; lower screw_logo_height.");
assert(relief_depth < 0.05, "relief_depth must stay below half of a 0.1 mm first layer, or the relief gets printed.");
assert(watermark_z >= 0.4 && top_z - underside_z - watermark_z - watermark_height >= 0.4
       && min(flange_h, lip_height) - watermark_z - watermark_height >= 0.4,
       "The watermark needs 0.4 of solid on both sides, in the top part and in the screw's flange; change watermark_z or watermark_height.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "lampshade") lampshade();
else if (part == "toppart") toppart();
else if (part == "screwin") screwin();
else if (part == "slide_test") slide_test();

// Released: the holder rests on the lens, which touches the window's edge,
// and the puck lies on the plunger, which stands on the desk, so the holder
// floats float_h above the desk. Pressing it down that far clicks the light.
// The lampshade sits on the cup's floor. The puck is a ghost.
module assembly() {
    color("silver") plunger();
    translate([0, 0, float_h]) {
        color("lightskyblue") toppart();
        color("gold") screw_ring();
        color("white", 0.6) translate([0, 0, cup_floor_z]) lampshade();
        %translate([0, 0, lip_height + puck_play]) puck();
    }
}

// The assembly with its front half cut away; look at it from the front.
module section() {
    color("silver") front_cut() plunger();
    translate([0, 0, float_h]) {
        color("lightskyblue") front_cut() toppart();
        color("gold") front_cut() screw_ring();
        color("white") front_cut() translate([0, 0, lip_height + puck_play]) puck();
        color("white") front_cut() translate([0, 0, cup_floor_z]) lampshade();
    }
}

// Cuts away the half in front of y = 0, rendered so it keeps its colour.
module front_cut()
    render() difference() {
        children();
        translate([-view_size / 2, -view_size, -view_size / 2]) cube(view_size);
    }

// Every part as it prints, side by side: the lampshade on its neck, the top
// part upside down, the screwin standing as it is used.
module print_layout() {
    lampshade();
    translate([lampshade_r + outer_r + layout_gap, 0, 0]) {
        translate([0, 0, top_z]) rotate([180, 0, 0]) toppart();
        translate([0, -(outer_r + layout_gap + flange_r), 0]) screwin();
    }
}

// The lampshade as it prints, on its neck. The neck's thread starts at its
// bottom, in phase with the cup's, with a 45 degree chamfer at the bed; the
// shell reaches 1 down into the neck. The union() keeps it one solid with
// lazy union, as in pucklight_sphere.
module lampshade() union() {
    difference() {
        intersection() {
            threaded_rod(neck_d, neck_height);
            cylinder(h = neck_height, r1 = neck_root_r, r2 = neck_root_r + neck_height);
        }
        translate([0, 0, -1]) cylinder(r = neck_bore_r, h = neck_height + 2);
    }
    rotate_extrude() polygon([
        [neck_bore_r, neck_height - 1], [neck_root_r, neck_height - 1], [neck_root_r, neck_height],
        [lampshade_r, lampshade_cyl_z], [lampshade_r, lampshade_top_z], [0, lampshade_tip_z],
        [0, lampshade_tip_z - shell * sqrt(2)],
        [lampshade_r - shell, lampshade_top_z - shell * (sqrt(2) - 1)],
        [lampshade_r - shell, lampshade_cyl_z + shell * (sqrt(2) - 1)],
        [neck_bore_r, neck_height - neck_wall + shell * sqrt(2)]]);
}

// Round shell with the cavity, the internal thread, the window and the cup.
// The cavity's shoulder runs up to the ring's flat underside, the lip down to
// the window's edge, which presses the lens; the window widens at 45 degrees
// from its edge to the top face.
module toppart() {
    difference() {
        rotate_extrude() polygon([
            [0, 0], [outer_r, 0], [outer_r, lower_cone_c - outer_r],
            [thread_outer_r, lower_cone_c - thread_outer_r], [thread_outer_r, top_z], [0, top_z]]);
        rotate_extrude() polygon([
            [0, -1], [recess_r, -1], [recess_r, recess_top], [hole_minor_r, thread_start],
            [hole_minor_r, shoulder_z], [shoulder_c - underside_z, underside_z],
            [lip_c + underside_z, underside_z], [lip_c + contact_z, contact_z], [contact_r, contact_z],
            [contact_r + top_z + 1 - contact_z, top_z + 1], [0, top_z + 1]]);
        // From z = 0 like the screw's thread, so the bar lies along y when
        // the screw is flush.
        threaded_rod(hole_d, shoulder_z);
        // The cup around the core. Its thread starts on its floor, in phase
        // with the neck's, as in pucklight_sphere.
        difference() {
            union() {
                translate([0, 0, cup_floor_z]) threaded_rod(cup_d, cup_h + 1);
                // 45 degree lead-in at the rim.
                translate([0, 0, top_z - 2 * thread_depth]) cylinder(h = 2 * thread_depth + eps,
                    r1 = cup_d / 2 - thread_depth, r2 = cup_lead_r + eps);
            }
            translate([0, 0, cup_floor_z - 1]) cylinder(r = cup_core_r, h = cup_h + 3);
        }
        // Along the ring, its rib pointing counterclockwise.
        translate([toppart_logo_x, 0, top_z]) logo_cut(toppart_logo_height);
        // The fingerprint: the relief in the top face, which lies on the bed,
        // and the watermark below it.
        rotate(relief_angle) translate([toppart_logo_x, 0, top_z])
            logo_cut(toppart_logo_height, relief_depth);
        rotate(watermark_angle) translate([toppart_logo_x, 0, top_z - watermark_z])
            watermark(toppart_logo_height);
        // Opposite the logo, the letters' tops pointing outwards.
        if (material != "none") rotate(180) translate([0, 0, top_z]) material_cut(toppart_logo_x);
    }
}

// The screwin as it prints: the screw ring with the plunger inside it, two
// separate bodies, for a fit with gap g.
module screwin(g = slide_gap) union() {
    screw_ring(g);
    plunger(g);
}

// Ring with a flange at the bottom and the thread above it. The puck lies on
// its floor. The opening for the plunger has a counterbore at the top, where
// the plunger's top lip rests when the lamp is lifted, a 45 degree chamfer at
// the bottom over its bottom lip, and two slots along y for the plunger's
// bar.
module screw_ring(g = slide_gap) {
    slot_r = lip_r(g) + 2 * g;
    chamfer_r = bottom_lip_c(g) + g * sqrt(2);
    difference() {
        union() {
            rotate_extrude() polygon([[0, 0], [flange_r, 0], [flange_r, flange_h],
                                      [screw_root_r, flange_h + flange_r - screw_root_r],
                                      [0, flange_h + flange_r - screw_root_r]]);
            intersection() {
                threaded_rod(screw_d, screw_height);
                // 45 degree chamfer at the top eases the start into the thread.
                cylinder(h = screw_height, r1 = screw_d / 2 - thread_depth + screw_height,
                         r2 = screw_d / 2 - thread_depth);
            }
        }
        translate([0, 0, lip_height]) cylinder(r = bore_r, h = screw_height);
        translate([0, 0, -1]) cylinder(r = press_r + g, h = lip_height + 2);
        translate([0, 0, counterbore_z]) cylinder(r = lip_r(g) + 1, h = lip_height);
        translate([0, 0, -1]) cylinder(h = chamfer_r - press_r + 1, r1 = chamfer_r + 1, r2 = press_r);
        translate([-(bar_width / 2 + 2 * g), -slot_r, -1]) cube([bar_width + 4 * g, 2 * slot_r, counterbore_z + 1]);
        // Reads from below, along the ring.
        translate([screw_logo_x, 0, 0]) rotate([0, 180, 0]) logo_cut(screw_logo_height);
        // The fingerprint: the relief in the bottom, which lies on the bed,
        // and the watermark above it.
        rotate(relief_angle) translate([screw_logo_x, 0, 0]) rotate([0, 180, 0])
            logo_cut(screw_logo_height, relief_depth);
        rotate(watermark_angle) translate([screw_logo_x, 0, watermark_z + watermark_height])
            watermark(screw_logo_height);
        // Opposite the logo; reads from below.
        if (material != "none") rotate([0, 180, 0]) material_cut(screw_logo_x);
    }
}

// The click base as a plunger at its printed position, the pressed one: its
// bottom on z = 0 with the screw ring's. A tube that lifts the puck, open
// inside, with a lip at its top and at its bottom and the bar across its
// bottom, whose ends reach into the screw ring's slots. Its bottom edges are
// chamfered.
module plunger(g = slide_gap) {
    rotate_extrude() polygon([
        [press_r - press_wall, 0], [lip_r(g) - first_layer_chamfer, 0], [lip_r(g), first_layer_chamfer],
        [press_r, bottom_lip_c(g) - press_r],
        [press_r, lip_z(g)], [lip_r(g), lip_z(g) + lip_r(g) - press_r], [lip_r(g), plunger_h],
        [press_r - press_wall, plunger_h]]);
    intersection() {
        translate([-bar_width / 2, -lip_r(g), 0]) cube([bar_width, 2 * lip_r(g), bar_h]);
        cylinder(h = bar_h, r1 = lip_r(g) - first_layer_chamfer, r2 = lip_r(g) - first_layer_chamfer + bar_h);
    }
}

// A quick print to find the gap: the screwin inside slide_test_r, once per
// gap in slide_test_gaps, side by side. Notches in the ring's top edge count
// the gap in tenths.
module slide_test() {
    for (i = [0:len(slide_test_gaps) - 1]) let(g = slide_test_gaps[i])
        translate([i * (2 * slide_test_r + layout_gap), 0, 0]) difference() {
            intersection() {
                screwin(g);
                cylinder(r = slide_test_r, h = plunger_h + 1);
            }
            for (k = [1:round(10 * g)]) rotate(45 + 10 * k)
                translate([slide_test_r - 0.8, -0.5, lip_height - 0.8]) cube([2, 1, 1]);
        }
}

// The puck light, simplified from its CAD model: a cylinder with a rounded
// top edge and a spherical lens. Bottom on z = 0.
module puck() {
    rotate_extrude() {
        square([puck_r, puck_edge_height - puck_edge_radius]);
        square([puck_r - puck_edge_radius, puck_edge_height]);
        translate([puck_r - puck_edge_radius, puck_edge_height - puck_edge_radius]) circle(puck_edge_radius);
        intersection() {
            translate([0, puck_height - sphere_r]) circle(sphere_r);
            translate([0, puck_edge_height - eps]) square([dome_r, dome_h + eps]);
        }
    }
}

// The logo, height tall and centred on the origin, to cut depth deep into a
// face on z = 0 from above. It reads from +z with its rib towards +y.
module logo_cut(height, depth = logo_depth)
    translate([0, 0, -depth]) linear_extrude(depth + 1) logo(height);

// The logo as a void inside a solid, watermark_height high, its top on
// z = 0.
module watermark(height)
    translate([0, 0, -watermark_height]) linear_extrude(watermark_height) logo(height);

// The material's name along a ring of radius r, centred on +x, to cut
// logo_depth deep into a face on z = 0 from above. The letters' tops point
// outwards, so it reads clockwise. The union() keeps the letters one child
// with lazy union.
module material_cut(r)
    union() for (i = [0:len(material) - 1])
        rotate((len(material) - 1 - 2 * i) / 2 * material_pitch / r * 180 / PI)
            translate([r, 0, -logo_depth]) rotate(-90) linear_extrude(logo_depth + 1)
                translate([0, -material_size / 2])
                    text(material[i], size = material_size, font = material_font, halign = "center");

function logo_arc(centre, radius, from, to, steps = 96) =
    [for (i = [0:steps]) let(a = from + (to - from) * i / steps)
        [centre[0] + radius * cos(a), centre[1] + radius * sin(a)]];

// The flat TraceTrove logo V3, centred, with its rib towards +y. This is the
// outline of logo_final_flat in tracetrove_branding's
// branding/LOGO_V3/tracetrove_logo.scad, copied so this file still needs no
// libraries.
module logo(height) {
    a = atan2(7.5, 10);
    scale(height / (2 * logo_tip_y))
        translate([-7.5, 0])
            difference() {
                polygon(concat(logo_arc([0, 0], 17.5, -60, 60),
                               [[7.5, logo_tip_y]],
                               logo_arc([15, 0], 17.5, 120, 240),
                               [[7.5, -logo_tip_y]]));
                polygon(concat(logo_arc([0, 0], 12.5, a - 90, a),
                               logo_arc([-2.5, 7.5], 12.5, 0, -a),
                               logo_arc([17.5, 7.5], 12.5, 180 + a, 180),
                               logo_arc([15, 0], 12.5, 180 - a, 270 - a)));
            }
}

// The holder's thread: 45 degree flanks, as in fdm_optimized_screws. Major
// diameter d from z = 0 to h: the screw's thread, and, with the clearance
// added, the shape cut for the top part's. render() keeps the preview working
// with this many threads.
module threaded_rod(d, h) {
    r_root = d / 2 - thread_depth;
    render(convexity = 4) intersection() {
        union() {
            cylinder(r = r_root + eps, h = h);
            thread_ridge(r_root, -thread_pitch, h + thread_pitch, thread_pitch, thread_depth,
                         0.05 * thread_pitch, 45);
        }
        cylinder(r = d / 2 + 1, h = h);
    }
}

// Sweeps a trapezoid around a right-handed helix.
module thread_ridge(r_root, z0, z1, pitch, depth, half_tip, flank) {
    run = depth * tan(flank);
    base = half_tip + run + eps * tan(flank);
    steps = ceil((z1 - z0) / pitch * $fn);
    profile = [[r_root - eps, -base],
               [r_root + depth, -half_tip],
               [r_root + depth, half_tip],
               [r_root - eps, base]];
    points = [for (i = [0:steps])
        let(z = z0 + (z1 - z0) * i / steps, a = 360 * z / pitch)
        for (p = profile) [p[0] * cos(a), p[0] * sin(a), z + p[1]]];
    // Clockwise winding as viewed from outside, as required by OpenSCAD.
    faces = concat(
        [[3, 2, 1, 0]],
        [for (i = [0:steps-1], j = [0:3])
            [4*i+j, 4*i+(j+1)%4, 4*(i+1)+(j+1)%4]],
        [for (i = [0:steps-1], j = [0:3])
            [4*i+j, 4*(i+1)+(j+1)%4, 4*(i+1)+j]],
        [[4*steps, 4*steps+1, 4*steps+2, 4*steps+3]]);
    polyhedron(points = points, faces = faces, convexity = 16);
}
