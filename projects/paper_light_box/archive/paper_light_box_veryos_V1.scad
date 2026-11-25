// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Paper light box V1: a box with slits in its top. A sheet slides into each
// slit, paper or a thin print with a picture cut out, and a light behind the
// last one shines through them all. Standalone, no libraries. Millimetres.
// Print it upside down, the top wall with the slits on the bed, no support.
//
//   - The sheets stand in grooves of the two side walls and rest on stops at
//     the grooves' lower ends. The bottom is open: lift the box and push a
//     sheet up from below to take it out.
//   - light = "board": Bambu's CMYK backlight board slides into a slit of its
//     own behind the last sheet, its USB plug at the top.
//   - light = "puck": the RGBW puck light KC007 drops into a pocket behind the
//     back wall, its lens in a slot of that wall. Pushed from behind through
//     the hole, the lens is pressed against the slot's edge and clicks.
//   - The sheets and their pictures come from the webapp beside this script;
//     it sets sheet_thicknesses and renders the box with this script.
// The script echoes the box's size and where the slits are.

/* [1 - Start here] */
part = "print"; // [print:Box as it is printed - the top wall on the bed,box:Box as it stands,assembly:Box with its sheets and the light,section:Assembly cut in half]
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
light = "board"; // [board:Bambu CMYK backlight board 120 x 156,puck:RGBW puck light KC007]
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
// The manufacturer's CAD model, as in RGBW_pucklight_holder_ringclick: 62 across, the flat ring around the lens 21 high, the lens 40 across and 26.8 high at its top.
puck_d = 62; // [40:0.1:90]
puck_height = 26.8; // [10:0.1:50]
puck_edge_height = 21; // [5:0.1:45]
puck_dome_d = 40; // [20:0.1:80]
// Around the puck in its pocket, per side.
puck_clearance = 0.5; // [0.2:0.1:1.5]
// How far the puck moves in its pocket before the lens meets the slot's edge.
puck_play = 0.7; // [0.2:0.1:2]
// Width of the slot the lens looks through: its edge presses the lens there.
contact_d = 36; // [20:0.5:60]
// Hole in the back to push the puck.
press_d = 30; // [10:1:50]

/* [6 - Logo] */
// Engraved in the back.
logo = true;
logo_width = 14; // [8:0.5:30]
logo_depth = 0.6; // [0.2:0.2:1.2]

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
// The light's wall: an aperture in front of the board, the wall with the puck's slot.
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

// ---- board ----
pocket_b = board[0] + side_clearance;
clear_b = pocket_b - 2 * groove_depth;
w_b = pocket_b + 2 * wall;
jw = is_board ? rib : wall;
y_slit = y_j + jw;
y_room = y_slit + board_slot;
y_back = y_room + board_back;
board_top = stop_height + board[1];
aperture = min(clear_a, clear_b);
aperture_z = min(height - top, sheet_top, board_top);
plug_z = stop_height + board[1] / 2;

// ---- puck ----
puck_r = puck_d / 2;
dome_r = puck_dome_d / 2;
dome_h = puck_height - puck_edge_height;
dome_R = (dome_r * dome_r + dome_h * dome_h) / (2 * dome_h);
// The lens's height above the flat ring around it, at radius r.
function lens_z(r) = sqrt(dome_R * dome_R - r * r) - (dome_R - dome_h);
contact_r = contact_d / 2;
pocket_r = puck_r + puck_clearance;
// From the wall the lens leans on to the pocket's back: the puck and its play.
pocket_depth = lens_z(contact_r) + puck_edge_height + puck_play;
// The puck lies in a V, behind the middle of the sheets if the V has room above the table.
puck_z = max(stop_height + sheet_y / 2, (pocket_r + wall) * sqrt(2));
v_apex = puck_z - pocket_r * sqrt(2);

depth = is_board ? y_back + wall : y_slit + pocket_depth + wall;
width = is_board ? max(w_a, w_b) : w_a;

assert(n >= 1, "at least one sheet");
assert(min([for (i = [0 : n - 1]) tooth(i)]) >= 1.2 + 2 * chamfer,
    "sheet_distance or light_distance too small: less than 1.2 + 2 chamfer stays between two slits");
assert(contact_r < dome_r, "contact_d must be smaller than the lens, puck_dome_d");
assert(is_board || puck_z + pocket_r <= height, "sheet_y too small: the puck would stand out of the top");
assert(is_board || w_a >= 2 * (pocket_r + wall), "sheet_x too small for the puck's pocket");

echo(str("box ", width, " x ", depth, " x ", height, " mm (width, depth, height); printed upside down, ", height, " high"));
echo(str(n, " sheets ", sheet_x, " x ", sheet_y, ", seen through a window ", clear_a, " wide and ", apron_z, " high from the table"));
function slit_list(i = 0) = i == n ? "" : str(i > 0 ? ", " : "", c[i], " / ", slot[i], slit_list(i + 1));
echo(str("slits from the front, middle / width: ", slit_list()));
echo(is_board
    ? str("board ", board[0], " x ", board[1], landscape ? ", lying, its plug in the right side wall" : ", upright, its plug in the top wall",
        "; slit ", board_slot, " wide, ", y_slit, " behind the front")
    : str("puck: pocket ", 2 * pocket_r, " wide and ", pocket_depth, " deep, its middle ", puck_z, " above the table; the lens ",
        lens_z(contact_r), " above its flat ring where the slot's edge meets it"));

// ---- parts ----
if (part == "print") translate([0, 0, height]) rotate([180, 0, 0]) box();
else if (part == "box") box();
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
    if (chamfer > 0) hull() {
        translate([-w / 2, y0, height - chamfer]) cube([w, y1 - y0, eps]);
        translate([-w / 2 - chamfer, y0 - chamfer, height]) cube([w + 2 * chamfer, y1 - y0 + 2 * chamfer, 1]);
    }
}

// A pocket half_w to each side of x = 0 up to top_z, its bottom a 90 degree V.
module v_profile(half_w, apex_z, top_z) {
    polygon([[-half_w, top_z], [-half_w, apex_z + half_w], [0, apex_z], [half_w, apex_z + half_w], [half_w, top_z]]);
}

module box() {
    difference() {
        body();
        sheet_cuts();
        if (is_board) board_cuts(); else puck_cuts();
        if (logo) translate([0, depth, logo_z()]) rotate([90, 0, 180]) logo_cut(logo_width);
    }
}

function logo_z() = is_board ? min(0.1 * height, 16) + logo_width / 4 : puck_z + press_d / 2 + 3 + logo_width * logo_r / logo_w;

module body() {
    union() {
        if (is_board) {
            linear_extrude(height) union() {
                translate([-w_a / 2, 0]) square([w_a, y_j + eps]);
                translate([-width / 2, y_j]) square([width, jw]);
                translate([-w_b / 2, y_slit - eps]) square([w_b, depth - y_slit + eps]);
            }
        } else difference() {
            // one block, and all that is not the pocket's tower cut away behind the wall:
            // a tower joined on would leave slivers where its faces lie in the block's
            translate([-w_a / 2, 0, 0]) cube([w_a, depth, height]);
            along_y(y_slit, depth + 1) difference() {
                translate([-w_a / 2 - 1, -1]) square([w_a + 2, height + 2]);
                v_profile(pocket_r + wall, v_apex - wall * sqrt(2), height + 2);
            }
        }
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
    translate([-aperture / 2, y_j - 2 * eps, -1]) cube([aperture, jw + 4 * eps, aperture_z + 1]);
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
    // the lens's slot, open to the top: the puck drops in from there
    along_y(y_j - eps, y_slit + eps) union() {
        translate([0, puck_z]) circle(r = contact_r);
        translate([-contact_r, puck_z]) square([2 * contact_r, height]);
    }
    along_y(y_slit, y_slit + pocket_depth) v_profile(pocket_r, v_apex, height + 1);
    along_y(y_slit + pocket_depth - eps, depth + 1) translate([0, puck_z]) circle(d = press_d);
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
    // the puck, its lens to the front
    else translate([0, y_slit + lens_z(contact_r) + puck_play / 2 + puck_edge_height, puck_z]) rotate([90, 0, 0]) {
        color("#DDDDDD") cylinder(r = puck_r, h = puck_edge_height);
        color("#FFF6D8") intersection() {
            translate([0, 0, puck_height - dome_R]) sphere(r = dome_R);
            translate([0, 0, puck_edge_height]) cylinder(r = dome_r, h = dome_h + 1);
        }
    }
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
