// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Paper light box V2: a box with slits in its top. A sheet slides into each
// slit, paper or a thin print with a picture cut out, and a light behind the
// last one shines through them all. Standalone, no libraries. Millimetres.
// Print it upside down, the top wall with the slits on the bed, no support.
//
//   - The sheets stand in grooves of the two side walls and rest on stops at
//     the grooves' lower ends. The bottom is open: lift the box and push a
//     sheet up from below to take it out.
//   - light = "board": Bambu's CMYK backlight board slides into a slit of its
//     own behind the last sheet, its USB plug at the top.
//   - light = "puck": the RGBW puck light KC007 sits in the threaded holder of
//     ../RGBW_pucklight_holder_ringclick. That holder's top part is here a
//     plate, part puck_plate, which slides into a slit behind the last sheet
//     as the board does, its cup through a slot in the back wall. The
//     holder's screwin, the puck lying on it, screws into the cup from
//     behind; its plunger is the button. Print the plate with its front on
//     the bed, as the holder's top part: the thread stands upright.
//   - The sheets and their pictures come from the webapp beside this script;
//     it sets sheet_thicknesses and renders the box with this script.
// The script echoes the box's size and where the slits are.
// V2: the puck in its holder's thread, instead of V1's pocket to drop it in.

/* [1 - Start here] */
part = "print"; // [print:Box as it is printed - the top wall on the bed,box:Box as it stands,puck_plate:Puck plate as it is printed - its front on the bed,placed:Puck plate where it sits in the box,assembly:Box with its sheets and the light,section:Assembly cut in half]
// Width of the sheets.
sheet_x = 120; // [70:0.5:300]
// Height of the sheets.
sheet_y = 156; // [80:0.5:300]
// Number of sheets, if sheet_thicknesses is empty.
sheet_count = 5; // [1:1:20]
// Thickness of the sheets, if sheet_thicknesses is empty.
sheet_thickness = 0.4; // [0.1:0.05:3]
// Thickness of every sheet from the front to the back, as [0.4, 0.4, 0.2]. Empty: sheet_count sheets of sheet_thickness.
sheet_thicknesses = [];
// Free space between two sheets.
sheet_distance = 5; // [2.5:0.5:40]
light = "board"; // [board:Bambu CMYK backlight board 120 x 156,puck:RGBW puck light KC007 in its threaded holder]
// From the last sheet to the light's wall. More spreads the light wider: 30 or more for the puck.
light_distance = 15; // [5:1:100]

/* [2 - Fit] */
// A slit is this much wider than its sheet.
slot_clearance = 0.4; // [0.1:0.05:1]
// No slit is narrower than this: narrower ones close up in the print.
slot_min = 0.8; // [0.4:0.05:1.5]
// The room between the side walls is this much wider than the sheets, both sides together.
side_clearance = 0.5; // [0:0.1:2]
// How far the sheets' edges reach into the grooves of the side walls.
groove_depth = 2.5; // [1:0.5:6]
// Stops under the grooves carry the sheets. A multiple of the layer height.
stop_height = 0.6; // [0.2:0.2:2]

/* [3 - Box] */
// Side walls and back wall.
wall = 2; // [1.2:0.2:4]
// Top wall with the slits, on the bed in the print.
top = 2; // [1:0.2:4]
// Lips in front of the first sheet.
front_lip = 2; // [1.2:0.2:5]
// Ribs beside a slit, where the space between two slits is wide enough to be hollow.
rib = 1.6; // [1.2:0.2:3]
// Chamfer of the slits' mouths.
chamfer = 0.4; // [0:0.1:1]

/* [4 - Backlight board] */
// The board stands upright behind upright sheets and lies behind wide ones.
board_x = 120; // [50:0.5:300]
board_y = 156; // [50:0.5:300]
// The board's slit: the board, its LEDs and play.
board_slot = 3; // [1.5:0.1:6]
// Room behind the board, for the USB socket on its back and for air.
board_back = 6; // [3:0.5:15]
// Opening for the USB plug, at the middle of the board's short edge: in the top wall behind an upright board, in the right side wall beside a lying one. 0: none.
plug_notch = 14; // [0:1:25]
// Slots in the back wall: the board gets warm.
vents = true;

/* [5 - Puck light] */
// The plate that carries the puck's holder, as large as a sheet. Its slit is slot_clearance wider.
plate_thickness = 2; // [1.2:0.2:4]

/* [6 - Logo] */
// Engraved in the back of the box and of the puck plate.
logo = true;
logo_width = 14; // [8:0.5:30]
logo_depth = 0.6; // [0.2:0.2:1.2]

/* [7 - Holder as in RGBW_pucklight_holder_ringclick V8] */
// The puck plate's cup is that holder's top part, so that its screwin fits and clicks. These are that script's values: change them there and here together.
puck_d = 62; // [40:0.1:90]
puck_height = 26.8; // [10:0.1:50]
// Height of the flat ring around the lens.
puck_edge_height = 21; // [5:0.1:45]
puck_edge_radius = 7; // [0:0.1:15]
puck_dome_d = 40; // [20:0.1:80]
// Around the puck in the screw, per side.
puck_clearance = 0.5; // [0.2:0.1:1.5]
// How far the puck moves before the lens meets the window's edge.
puck_play = 0.7; // [0.2:0.1:2]
// Where the window's edge touches the lens.
contact_d = 36; // [20:0.5:60]
// The plate over the flat ring around the lens, at the window.
ring_thickness = 1.8; // [1:0.2:4]
// The cup's shell.
holder_wall = 1.6; // [1.2:0.2:3]
screw_height = 10.4; // [6:0.2:20]
screw_thread_length = 3.5; // [2:0.5:10]
// The screw's floor under the puck.
lip_height = 5; // [2:0.2:10]
screw_wall = 1.2; // [0.8:0.2:3]
thread_pitch = 2; // [1:0.5:4]
// Radial gap between the threads.
thread_clearance = 0.25; // [0.1:0.05:0.6]
// How far the plunger lifts the puck off the screw's floor.
press_height = 1.8; // [1:0.1:4]
// Between the cup and the puck at its highest.
cavity_gap = 0.5; // [0.2:0.1:2]

/* [Hidden] */
eps = 0.01;
$fn = 96;

// ---- sheets ----
t = len(sheet_thicknesses) > 0 ? sheet_thicknesses : [for (i = [1 : sheet_count]) sheet_thickness];
n = len(t);
slot = [for (v = t) max(v + slot_clearance, slot_min)];
// Middle of sheet i behind the box's front face.
function centre(i) = i == 0 ? front_lip + slot[0] / 2
    : centre(i - 1) + t[i - 1] / 2 + sheet_distance + t[i] / 2;
c = [for (i = [0 : n - 1]) centre(i)];
// The solid between slit i and the next one, or the light's wall.
function tooth(i) = (i < n - 1 ? c[i + 1] - slot[i + 1] / 2 : y_j) - c[i] - slot[i] / 2;
y_last = c[n - 1] + t[n - 1] / 2;
// The light's wall: a rib thick, open as wide as the window, in front of the light's slit.
y_j = y_last + light_distance;

is_board = light == "board";
landscape = sheet_x > sheet_y;
board = landscape ? [board_y, board_x] : [board_x, board_y];
height = stop_height + max(sheet_y, is_board ? board[1] : 0);
pocket_a = sheet_x + side_clearance;
clear_a = pocket_a - 2 * groove_depth;
w_a = pocket_a + 2 * wall;
sheet_top = stop_height + sheet_y;
// Lower edge of the bar above the window: it hides the sheets' top as the grooves hide their sides.
apron_z = sheet_top - groove_depth;

// ---- the light's slit: the board's, or the puck plate's ----
pocket_b = board[0] + side_clearance;
clear_b = pocket_b - 2 * groove_depth;
w_b = pocket_b + 2 * wall;
light_slot = is_board ? board_slot : max(plate_thickness + slot_clearance, slot_min);
y_slit = y_j + rib;
y_room = y_slit + light_slot;
y_back = y_room + board_back;
board_top = stop_height + board[1];
aperture = min(clear_a, clear_b);
aperture_z = min(height - top, sheet_top, board_top);
plug_z = stop_height + board[1] / 2;

// ---- the puck's holder, in the words of its own script ----
puck_r = puck_d / 2;
dome_r = puck_dome_d / 2;
dome_h = puck_height - puck_edge_height;
sphere_r = (dome_r * dome_r + dome_h * dome_h) / (2 * dome_h);
// Height of the lens above the puck's bottom, at radius r.
function lens_z(r) = puck_height - sphere_r + sqrt(sphere_r * sphere_r - r * r);
thread_depth = 0.4 * thread_pitch;
bore_r = puck_r + puck_clearance;
// Major diameters of the screw's thread and of the cup's.
screw_d = 2 * (bore_r + screw_wall + thread_depth);
hole_d = screw_d + 2 * thread_clearance;
hole_minor_r = hole_d / 2 - thread_depth;
// The screw's flange fills a recess at the cup's open end.
flange_r = hole_d / 2 + 1.5;
recess_r = flange_r + 0.5;
thread_start = screw_height - screw_thread_length;
recess_top = thread_start - (recess_r - hole_minor_r);
lift_z = lip_height + press_height;
// The cavity's shoulder, the 45 degree cone r + z = shoulder_c, and the window's edge.
shoulder_c = (puck_r - puck_edge_radius) + (lift_z + puck_edge_height - puck_edge_radius)
           + (puck_edge_radius + cavity_gap) * sqrt(2);
shoulder_z = shoulder_c - hole_minor_r;
contact_r = contact_d / 2;
contact_z = lip_height + puck_play + lens_z(contact_r);
underside_z = lift_z + puck_edge_height + cavity_gap;
lip_c = (dome_r - puck_clearance) - (lift_z + puck_edge_height) - cavity_gap * sqrt(2);
// The cup from its open end to the plate's front face: the holder's top_z.
cup_h = underside_z + ring_thickness;
outer_r = recess_r + holder_wall;
thread_outer_r = hole_d / 2 + holder_wall;
lower_cone_c = recess_r + recess_top + holder_wall * sqrt(2);
upper_cone_c = hole_d / 2 + shoulder_z + holder_wall * sqrt(2);

// ---- the puck plate in the box ----
// The slot in the back wall for the cup: the shell around its thread and 1 beside it.
slot_r = thread_outer_r + 1;
// The cup's middle: behind the middle of the sheets, if the slot's V has 6 of wall below it.
puck_z = max(stop_height + sheet_y / 2, slot_r * sqrt(2) + 6);
slot_apex = puck_z - slot_r * sqrt(2);
// The plate's front face behind the box's front, the plate in the middle of its slit.
plate_y = y_slit + (light_slot - plate_thickness) / 2;
with_plate = !is_board || part == "puck_plate" || part == "placed";

depth = is_board ? y_back + wall : y_room + wall;
width = is_board ? max(w_a, w_b) : w_a;

assert(n >= 1, "at least one sheet");
assert(min([for (i = [0 : n - 1]) tooth(i)]) >= 1.2 + 2 * chamfer,
    "sheet_distance or light_distance too small: less than 1.2 + 2 chamfer stays between two slits");
assert(contact_r < dome_r, "contact_d must be smaller than the lens, puck_dome_d");
assert(!with_plate || w_a / 2 - slot_r >= 4, "sheet_x too small for the puck's holder: the back wall needs 4 beside its slot");
assert(!with_plate || sheet_top - puck_z >= outer_r, "sheet_y too small for the puck's holder: its cup would stand out of the plate");

echo(str("box ", width, " x ", depth, " x ", height, " mm (width, depth, height); printed upside down, ", height, " high"));
echo(str(n, " sheets ", sheet_x, " x ", sheet_y, ", seen through a window ", clear_a, " wide and ", apron_z, " high from the table"));
function slit_list(i = 0) = i == n ? "" : str(i > 0 ? ", " : "", c[i], " / ", slot[i], slit_list(i + 1));
echo(str("slits from the front, middle / width: ", slit_list()));
echo(is_board
    ? str("board ", board[0], " x ", board[1], landscape ? ", lying, its plug in the right side wall" : ", upright, its plug in the top wall",
        "; slit ", board_slot, " wide, ", y_slit, " behind the front")
    : str("puck plate ", sheet_x, " x ", sheet_y, " x ", plate_thickness, " in a slit ", light_slot, " wide; the holder, its middle ", puck_z,
        " above the table, reaches ", plate_y + cup_h - depth, " behind the box; thread ", hole_d, " x ", thread_pitch,
        ", for the screwin of RGBW_pucklight_holder_ringclick"));

// ---- parts ----
if (part == "print") translate([0, 0, height]) rotate([180, 0, 0]) box();
else if (part == "box") box();
else if (part == "puck_plate") translate([0, 0, cup_h]) rotate([180, 0, 0]) puck_plate();
else if (part == "placed") placed() puck_plate();
else if (part == "assembly") assembly();
else if (part == "section") difference() {
    union() { assembly(); }
    translate([0, -250, -250]) cube([500, 1000, 1000]);
}

// A 2D shape in x and z, made a solid from y0 to y1.
module along_y(y0, y1) {
    translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

// A slit through the top wall down to z0, its mouth chamfered.
module slit(w, y0, y1, z0) {
    translate([-w / 2, y0, z0]) cube([w, y1 - y0, height - z0 + 1]);
    slit_mouth(w, y0, y1);
}

module slit_mouth(w, y0, y1) {
    if (chamfer > 0) hull() {
        translate([-w / 2, y0, height - chamfer]) cube([w, y1 - y0, eps]);
        translate([-w / 2 - chamfer, y0 - chamfer, height]) cube([w + 2 * chamfer, y1 - y0 + 2 * chamfer, 1]);
    }
}

// A slot half_w to each side of x = 0 up to top_z, its lower end a 90 degree V.
module v_profile(half_w, apex_z, top_z) {
    polygon([[-half_w, top_z], [-half_w, apex_z + half_w], [0, apex_z], [half_w, apex_z + half_w], [half_w, top_z]]);
}

module box() {
    difference() {
        body();
        sheet_cuts();
        if (is_board) board_cuts(); else puck_cuts();
        if (logo && len(logo_xz()) == 2) translate([logo_xz()[0], depth, logo_xz()[1]]) rotate([90, 0, 180]) logo_cut(logo_width);
    }
}

// The logo's middle in the back wall, x and z: under the board's vents; under the V of
// the holder's slot, or beside the slot where the V leaves no room. []: no room.
function logo_xz() = is_board ? [0, min(0.1 * height, 16) + logo_width / 4]
    : slot_apex >= logo_h + 6 ? [0, slot_apex / 2]
    : w_a / 2 - slot_r >= logo_width + 6 ? [(w_a / 2 + slot_r) / 2, min(0.1 * height, 16) + logo_width / 4]
    : [];

// One outline for all of it: solids joined along a face would leave slivers there.
module body() {
    linear_extrude(height) union() {
        translate([-w_a / 2, 0]) square([w_a, y_j + eps]);
        if (is_board) {
            translate([-width / 2, y_j]) square([width, rib]);
            translate([-w_b / 2, y_slit - eps]) square([w_b, depth - y_slit + eps]);
        } else translate([-w_a / 2, y_j]) square([w_a, depth - y_j]);
    }
}

// The window, the slits with their grooves, and the hollows between them.
module sheet_cuts() {
    translate([-clear_a / 2, -1, -1]) cube([clear_a, front_lip + 1 + eps, apron_z + 1]);
    translate([-clear_a / 2, front_lip, -1]) cube([clear_a, y_j - front_lip + eps, height - top + 1]);
    union() for (i = [0 : n - 1]) {
        slit(pocket_a, c[i] - slot[i] / 2, c[i] + slot[i] / 2, stop_height);
        // a wide tooth is hollow between two ribs; the light's wall needs no rib
        if (tooth(i) - (i < n - 1 ? 2 : 1) * rib >= 4)
            translate([-pocket_a / 2, c[i] + slot[i] / 2 + rib, -1])
                cube([pocket_a, tooth(i) - (i < n - 1 ? 2 : 1) * rib + (i < n - 1 ? 0 : eps), height - top + 1]);
    }
}

module board_cuts() {
    translate([-aperture / 2, y_j - 2 * eps, -1]) cube([aperture, rib + 4 * eps, aperture_z + 1]);
    slit(pocket_b, y_slit, y_room, stop_height);
    // the room behind the board, and the way under its slit: the stops stay at the sides only
    translate([-clear_b / 2, y_slit - eps, -1]) cube([clear_b, board_slot + board_back + eps, height - top + 1]);
    if (plug_notch > 0 && !landscape)
        translate([-plug_notch / 2, y_slit, height - top - eps]) cube([plug_notch, y_back - y_slit, top + 1]);
    if (plug_notch > 0 && landscape) {
        // the socket's way down behind the board's right edge, and the plug's window
        translate([pocket_b / 2 - 10, y_slit, plug_z - plug_notch / 2]) cube([10, y_back - y_slit, height]);
        translate([pocket_b / 2 - eps, y_slit, plug_z - plug_notch / 2]) cube([wall + 1, y_back - y_slit, plug_notch]);
    }
    if (vents) union() for (x = [-floor((clear_b / 2 - 10) / 9) * 9 : 9 : clear_b / 2 - 10])
        translate([x - 1.5, y_back - eps, 0.22 * height]) cube([3, wall + 1, 0.6 * height]);
}

module puck_cuts() {
    translate([-clear_a / 2, y_j - 2 * eps, -1]) cube([clear_a, rib + 4 * eps, height - top + 1]);
    // the plate's slit with its grooves and the way under it, in one shape: two would
    // both end in the back wall's face
    along_y(y_slit, y_room) union() {
        translate([-pocket_a / 2, stop_height]) square([pocket_a, height + 1 - stop_height]);
        translate([-clear_a / 2, -1]) square([clear_a, height - top + 1]);
    }
    slit_mouth(pocket_a, y_slit, y_room);
    // the cup's way down behind the plate: a slot through the back wall and the top,
    // its lower end a V, which is a roof in the print
    along_y(y_room - eps, depth + 1) v_profile(slot_r, slot_apex, height + 2);
}

// Where the puck plate sits in the box, for what is given in the holder's own
// place: the cup's open end on z = 0, its axis z, the plate's upper edge towards +y.
module placed() {
    translate([0, plate_y + cup_h, puck_z]) rotate([90, 0, 0]) children();
}

// The holder's top part with a plate as large as a sheet for its top face: the cavity,
// the internal thread and the window, whose edge presses the lens, are the holder's.
// Open end of the cup on z = 0, the plate's front face on cup_h. Printed upside down,
// the front on the bed, nothing overhangs more than 45 degrees.
module puck_plate() {
    $fn = 128;
    plate_y0 = stop_height - puck_z;
    difference() {
        // cup and plate reach past the front face by different heights and are cut to it
        // in one cut: ending in one plane each on its own, they would leave slivers
        union() {
            rotate_extrude() polygon([
                [0, 0], [outer_r, 0], [outer_r, lower_cone_c - outer_r],
                [thread_outer_r, lower_cone_c - thread_outer_r], [thread_outer_r, upper_cone_c - thread_outer_r],
                [upper_cone_c - cup_h - 1, cup_h + 1], [0, cup_h + 1]]);
            translate([-sheet_x / 2, plate_y0, cup_h - plate_thickness]) cube([sheet_x, sheet_y, plate_thickness + 2]);
        }
        translate([-sheet_x, plate_y0 - sheet_y, cup_h]) cube([2 * sheet_x, 3 * sheet_y, 10]);
        rotate_extrude() polygon([
            [0, -1], [recess_r, -1], [recess_r, recess_top], [hole_minor_r, thread_start],
            [hole_minor_r, shoulder_z], [shoulder_c - underside_z, underside_z],
            [lip_c + underside_z, underside_z], [lip_c + contact_z, contact_z], [contact_r, contact_z],
            [contact_r + cup_h + 5 - contact_z, cup_h + 5], [0, cup_h + 5]]);
        threaded_rod(hole_d, shoulder_z);
        // in the back, in a lower corner: behind the box's back wall once the plate is in
        if (logo) translate([-sheet_x / 2 + groove_depth + 3 + logo_width / 2, plate_y0 + 4 + logo_h / 2, cup_h - plate_thickness])
            rotate([0, 180, 0]) logo_cut(logo_width);
    }
}

// The puck light, simplified from its CAD model as in the holder's script. Bottom on z = 0.
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

module assembly() {
    color("#F4EFE3") box();
    for (i = [0 : n - 1]) color("#FFFFFF", 0.7)
        translate([-sheet_x / 2, c[i] - t[i] / 2, stop_height]) difference() {
            cube([sheet_x, t[i], sheet_y]);
            // a window, as a sheet with a frame has one
            if (i < n - 1) translate([8 + 2 * i, -1, 8 + 2 * i]) cube([sheet_x - 16 - 4 * i, t[i] + 2, sheet_y - 16 - 4 * i]);
        }
    if (is_board) color("#3A7D5A") translate([-board[0] / 2, y_slit + 0.7, stop_height]) cube([board[0], 1.6, board[1]]);
    else {
        color("lightskyblue") placed() puck_plate();
        // the puck on the holder's screwin, which is a plain ring here
        color("white") placed() translate([0, 0, lip_height + puck_play]) puck();
        color("gold") placed() difference() {
            cylinder(r = flange_r, h = lip_height);
            translate([0, 0, -1]) cylinder(r = puck_r - 6, h = lip_height + 2);
        }
    }
}

// The holder's thread: 45 degree flanks, as in fdm_optimized_screws. Major
// diameter d from z = 0 to h; with the clearance added, the shape cut for the
// cup's thread. From the holder's script, unchanged.
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

// ---- logo ----
// The VeryOS logo at the size of veryos_logo.svg, as in veryos_logo_cube: a
// ring and the two arms of a V, all logo_stroke wide.
logo_r = 15.6264133379;
logo_stroke = 5;
logo_angle = 22.5;
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;
// Height of the logo at logo_width.
logo_h = logo_width * 2 * logo_r / logo_w;

// Engraving, width wide, centred on the origin, logo_depth into z < 0.
module logo_cut(width) {
    translate([0, 0, -logo_depth]) linear_extrude(logo_depth + 1)
        scale(width / logo_w) translate([0, -logo_r]) logo();
}

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
        translate([0, logo_r]) union() for (a = [0, 180]) rotate(a) s_hole();
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
