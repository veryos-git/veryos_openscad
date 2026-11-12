// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// V2. Against V1 the board and the battery are locked in: a bracket, held
// by a printed screw in a block on the base's wall, lies over both. The
// switch gets a cap, and the opening for it is wider.
//
// Turntable for Bambu Lab's Rechargeable Power Kit (ZC003): an N20 gear
// motor, a 500 mAh LiPo battery and a board with a USB-C socket and a push
// switch. Six printed parts, nothing else:
// - base: a round tray. The motor lies in a pocket and snaps under a hook,
//   the board sits behind a flat panel in the wall with openings for the
//   USB-C plug, the switch and the charging light, the battery lies in a
//   fence beside it. A tube in the middle carries the platform.
// - bracket: a plate on a block on the base's wall, between the board and
//   the battery. One arm reaches over the middle of the battery, a thicker
//   one over the socket of the battery's plug on the board, both with a gap:
//   they keep the two in, they do not press on them. The thicker part lies
//   around the block, so the bracket cannot turn with the screw.
// - screw: 5 mm, as fdm_optimized_screws, through the bracket into the
//   block. It prints lying, with its underside cut off.
// - cap: pushed onto the tip of the switch's plunger from outside. It stands
//   far enough off the panel for the switch's whole travel.
// - worm: pushed onto the motor's D-shaft. Its thread is the 45 degree
//   thread of fdm_optimized_screws, so it prints standing without support.
// - platform: a round plate with a pin in the middle, which turns in the
//   base's tube and stands on the floor inside it, and a hoop of teeth
//   underneath, which the worm drives. One turn of the worm moves the hoop
//   one tooth: the platform turns at motor_rpm / teeth.
//
// rpm sets the number of teeth and with it the hoop's diameter; the base is
// as large as the hoop and the kit beside it need. turntable_d only sets the
// platform, which may be wider than the base.
//
// Print the base standing, the platform and the bracket upside down, their
// top faces on the bed, the worm standing on its closed end, the screw
// lying, the cap on its face. No overhang is steeper than 45 degrees;
// nothing needs support. The VeryOS logo is engraved in the front of the
// base's wall, in the platform's top face, in the worm's closed end, in the
// bracket's top face and in the cap's face; the screw has no room for it.
// Origin: centre of the base's bottom face, on the platform's axis. The
// panel with the USB-C socket faces +y, the logo -y.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:All parts on the bed,assembly:Assembly,open:Assembly without the platform,section:Assembly cut through the worm,base:Base,platform:Platform upside down as it prints,worm:Worm standing as it prints,bracket:Bracket upside down as it prints,screw:Screw lying as it prints,cap:Cap on its face as it prints]

/* [Turntable] */
// Diameter of the platform. At least the base, which the script echoes.
turntable_d = 150;
// Wanted turns per minute. The hoop gets motor_rpm / rpm teeth, rounded; the
// script echoes the speed that makes. Slower needs a larger base.
rpm = 6;
platform_thickness = 3;

/* [Gear] */
// The motor's speed, as Bambu Lab states it for the kit. It drops with the
// load and with the battery's charge: count the platform's turns in a
// minute, multiply by the teeth and put the result here.
motor_rpm = 500;
// From tooth to tooth. Smaller gives a smaller hoop and base for the same
// rpm, but finer teeth.
tooth_pitch = 2.5;
// Play between the worm's thread and the teeth, along the hoop. The worm
// only ever pushes one way, so it costs nothing and forgives a print that
// came out 0.2 off.
backlash = 0.35;
// Gap between the worm's crest and the bottom of the teeth.
tip_clearance = 0.25;
// The hoop's teeth reach this far below and above the worm's axis.
face_width = 6;

/* [Kit] */
// All from the CAD model in "Rechargeable Power Kit-ZC003 model".
// The N20 motor: across its round sides and across its flats.
motor_width = 12;
motor_flats = 10;
gearbox_length = 9;
can_length = 15;
// Around the shaft on the gearbox's face.
boss_d = 4;
boss_length = 0.85;
shaft_d = 3;
// Across the shaft's flat.
shaft_flat = 2.7;
// From the gearbox's face to the tip, and the flat from the tip.
shaft_length = 10;
flat_length = 6;
// The board: from the edge with the USB-C socket to the edge with the plugs,
// and along those edges.
board_length = 25.2;
board_width = 25;
board_thickness = 1.2;
// The battery: from the end with the wire to the other, across, and thick.
battery_length = 25.6;
battery_width = 24.5;
battery_thickness = 8.8;
// The tip of the switch's plunger: across, high, long, and its end beyond
// the board's edge.
tip_width = 2.5;
tip_height = 2;
tip_length = 2.5;
tip_reach = 4.4;

/* [Fits] */
// Diameter clearance of the shaft in the worm.
shaft_clearance = 0.2;
// Diameter clearance of the platform's pin in the base's tube.
pin_clearance = 0.3;
// Gap between the platform and the top of the base's wall, two layers. The
// platform leans on the wall only under a load off centre.
tilt_gap = 0.4;
// Radial gap between the screw and the thread in the base, all of it in the
// thread, as the nuts of fdm_optimized_screws.
thread_clearance = 0.25;
// Added to the tip's width and height in the cap's socket. The cap holds by
// friction: lower it if the cap is loose, raise it if it does not go on.
cap_clearance = 0.1;

/* [Base] */
floor_thickness = 1.6;
wall = 2;
// The platform's pin.
pin_d = 8;

/* [Lock] */
// The screw that holds the bracket. 5 is the smallest that has worked in
// fdm_optimized_screws: 4 bends, 3 broke.
screw_d = 5;
bracket_thickness = 2;
// The cap's head stands this far off the panel: the switch's travel and the
// board's play in its seat.
cap_travel = 3;

/* [Logo] */
// In the front of the base's wall.
base_logo_width = 12;
// In the platform's top face, near its edge.
platform_logo_width = 14;
// In the worm's closed end.
worm_logo_width = 7;
// In the top of the bracket's thicker arm.
bracket_logo_width = 7;
// In the cap's face.
cap_logo_width = 6;
logo_depth = 0.6;

/* [Quality] */
$fn = 180;

/* [Hidden] */
eps = 0.01;
layout_gap = 5;
layer = 0.2;
// The next multiple of the layer height.
function layers(z) = ceil(z / layer - 1e-6) * layer;
function polar(r, a) = [r * cos(a), r * sin(a)];
function turned(p, a) = [p[0] * cos(a) - p[1] * sin(a), p[0] * sin(a) + p[1] * cos(a)];

// The gear. The worm's thread is 0.4 x pitch deep with 45 degree flanks and
// a crest 0.1 x pitch wide, as the screws of fdm_optimized_screws; its root
// is 0.5 wider than the motor, so the hoop's teeth pass the motor.
teeth = round(motor_rpm / rpm);
real_rpm = motor_rpm / teeth;
tooth_depth = 0.4 * tooth_pitch;
worm_root_r = motor_flats / 2 + 0.5;
worm_tip_r = worm_root_r + tooth_depth;
worm_pitch_r = worm_root_r + tooth_depth / 2;
lead_angle = atan(tooth_pitch / (2 * PI * worm_pitch_r));
// The hoop's teeth are involutes with a 45 degree pressure angle, which fit
// the thread's straight flanks. They end 0.2 off the worm's root and stay
// 0.3 wide at the tip.
pitch_r = teeth * tooth_pitch / (2 * PI);
tooth_thickness = tooth_pitch / 2 - backlash;
addendum = min(tooth_depth / 2 - 0.2, (tooth_thickness - 0.3) / 2);
dedendum = min(tooth_depth / 2 + tip_clearance, (tooth_pitch - tooth_thickness - 0.1) / 2);
tip_r = pitch_r + addendum;
root_r = pitch_r - dedendum;
involute_r = pitch_r * cos(45);
function involute(a) = tan(a) - a * PI / 180;
// Half the angle a tooth takes at radius r, in degrees.
function tooth_half_angle(r) =
    (tooth_thickness / (2 * pitch_r) + involute(45) - involute(acos(involute_r / r))) * 180 / PI;
centre_distance = pitch_r + worm_pitch_r;
hoop_wall = 1.6;

// Heights. The worm turns 0.6 above the floor, the motor lies on a pad with
// its flats upright.
floor_z = floor_thickness;
axis_z = floor_z + worm_tip_r + 0.6;
motor_bottom_z = axis_z - motor_width / 2;
motor_top_z = axis_z + motor_width / 2;
// The tab with the hook that holds the motor down.
hook = 0.6;
tab_top_z = motor_top_z + 0.2 + 3 * hook;
// The screw, as fdm_optimized_screws: pitch, the share of its diameter cut
// off its underside as it prints lying, its hex head across the flats with a
// slot for a screwdriver, the thread's depth in the block and the screw's
// reach into it.
screw_pitch = 2;
screw_cut = 0.15;
screw_head_width = 9;
screw_head_height = 3;
screw_slot = 1.4;
thread_depth = 8;
screw_length = bracket_thickness + 6;
// The bracket lies hold_gap, two layers, above the battery, on a block as
// high: it keeps the battery in without pressing on it.
hold_gap = 0.4;
bracket_z = layers(floor_z + battery_thickness + hold_gap);
bracket_top_z = bracket_z + bracket_thickness;
screw_top_z = bracket_top_z + screw_head_height;
// The platform's underside, 0.5 above the highest part under it.
plate_z = layers(max(tab_top_z, axis_z + worm_tip_r, screw_top_z) + 0.5);
wall_z = plate_z - tilt_gap;
top_z = plate_z + platform_thickness;
band_z = axis_z - face_width / 2;
hoop_h = plate_z - band_z;
// The teeth lean by the worm's lead angle, so they lie along its thread.
hoop_twist = -hoop_h * tan(lead_angle) / pitch_r * 180 / PI;
pin_r = pin_d / 2;
tube_r = pin_r + pin_clearance / 2 + 2.4;
tube_z = plate_z - 3.5;

// The motor's pocket, in its own frame: x along the worm's axis, 0 where
// the worm drives the hoop, +y towards the platform's axis.
pocket_wall = 1.2;
worm_length = 10.5;
worm_x0 = -4;
worm_x1 = worm_x0 + worm_length;
// The gearbox's face, behind a wall 1 off the worm, and the motor's rear.
gearbox_x = worm_x0 - 1 - pocket_wall;
motor_x = gearbox_x - gearbox_length - can_length;
pocket_y = motor_flats / 2 + 0.1;
pocket_out_y = pocket_y + pocket_wall;
// The worm's bore from its mouth: round up to 0.4 past where the flat
// starts, D-shaped to 0.3 past the shaft's tip, which the bore's end rests
// on.
bore_depth = gearbox_x + shaft_length + 0.3 - worm_x0;
bore_round = gearbox_x + shaft_length - flat_length + 0.4 - worm_x0;

// Nothing but the hoop inside sweep_r; a guard wall around it keeps the
// wires out.
sweep_r = tip_r + 0.8;
guard_r = sweep_r + 1;
// The board, in its own frame: x from the platform's axis out through the
// panel, y along the panel. From the guard outwards: 0.5, room for the
// plugs, the board, 0.3 and the panel's wall.
plug_room = 5.5;
panel_half = 15;
bat_y = battery_width / 2 + 0.3;
base_r = ceil(max(
    norm([guard_r + 0.5 + plug_room + board_length + 0.3 + wall, panel_half]),
    norm([guard_r + 0.3 + pocket_wall + battery_length + 0.9, bat_y]) + wall,
    norm([motor_x - 2, centre_distance + pocket_out_y]) + 1 + wall));
inner_r = base_r - wall;
platform_r = turntable_d / 2;
panel_out = sqrt(base_r * base_r - panel_half * panel_half);
panel_in = panel_out - wall;
board_x1 = panel_in - 0.3;
board_x0 = board_x1 - board_length;
board_cx = (board_x0 + board_x1) / 2;
// The board lies on two ledges, its switch's pins 0.4 above the floor.
board_z = floor_z + 1.6;
board_top_z = board_z + board_thickness;
board_side = board_width / 2 + 0.2;
// On the board, from its middle along the panel, and above its underside:
// the USB-C socket, the switch's plunger, the charging light (from the
// photo) and the two plugs, the motor's beside the switch.
usb_y = -7.15;
usb_z = 2.8;
switch_y = 7.9;
switch_z = 4.05;
light_y = 1.5;
motor_plug_y = 7.3;
battery_plug_y = -2.15;
// The middle of the plugs' sockets from the board's middle, towards the
// panel, and their tops above the board's underside.
socket_x = -8.8;
socket_z = 5;

// The board's lane turned as far towards the motor as the pocket allows:
// its side guides stay 2 off every point of the pocket that reaches as far
// out as the plugs.
lane = board_side + pocket_wall + 2;
lane_r = board_x0 - plug_room - 1;
function pocket_point(x) = [x, pocket_out_y - centre_distance];
board_angle = min([for (x = [motor_x - 2 : 1 : gearbox_x + pocket_wall]) let(p = pocket_point(x))
    if (norm(p) >= lane_r) atan2(p[1], p[0]) - asin(min(1, lane / norm(p)))]);
// The base's inside is laid out with the worm at -y, then turned so that the
// panel faces +y.
layout_turn = 90 - board_angle;
// The motor's wires, 30 long: from its rear to its plug on the board.
motor_wire = norm(turned([board_x0 - 3, motor_plug_y], board_angle) - [motor_x - 1, 2 - centre_distance]);
// The battery lies beside the board, on the side of its plug, 1 degree off
// the board's lane.
bat_x1 = sqrt(inner_r * inner_r - bat_y * bat_y) - 0.3;
bat_x0 = bat_x1 - battery_length - 0.6;
// The block with the thread for the bracket's screw stands on the wall,
// half way between the board and the battery; the screw's axis is clamp_r
// from the platform's. The battery is turned at least so far away that the
// block stays 0.8 off the board's guide and off the battery's fence.
block_w = 10;
clamp_r = inner_r - 6.5;
block_x0 = clamp_r - block_w / 2;
block_turn = asin((max(board_side, bat_y) + pocket_wall + 0.8) / norm([block_x0, block_w / 2]))
             + atan(block_w / 2 / block_x0);
battery_turn = max(atan((lane - 2) / (board_x0 - plug_room)) + atan((bat_y + pocket_wall) / (bat_x0 - pocket_wall)) + 1,
                   2 * block_turn);
fence_z = floor_z + 5;
// The bracket, in the clamp's frame: x from the platform's axis through the
// screw. Its arms end over the middle of the battery and over the socket of
// the battery's plug, the thicker one hold_gap above that socket. The
// thicker part lies around the block with a gap of bracket_gap.
battery_tip = turned([(bat_x0 + bat_x1) / 2, 0], -battery_turn / 2);
socket_tip = turned([board_cx + socket_x, battery_plug_y], battery_turn / 2);
arm_w = 10;
pad_z = board_z + socket_z + hold_gap;
bracket_gap = 0.3;
bracket_rim = bracket_gap + pocket_wall;

// The cap, from its face: a head, then a stem with a socket for the
// plunger's tip, 0.2 less deep than the tip is long, so the tip's end
// carries the cap. At rest the head stands cap_travel off the panel.
cap_w = 9;
cap_h = 7;
cap_head = 2.4;
// The stem leaves walls of 0.8 around the socket at a cap_clearance of 0.1.
stem_w = tip_width + 1.7;
stem_h = tip_height + 1.7;
socket_depth = tip_length - 0.2;
// The tip's end in the board's frame.
tip_x = board_x1 + tip_reach;
cap_stem = cap_travel + panel_out - (tip_x - socket_depth);
cap_length = cap_head + cap_stem;

// In the assembly the hoop is turned so that a gap between two teeth lies
// on a crest of the worm's thread.
crest_x = worm_x1 - tooth_pitch / 4 - tooth_pitch * round((worm_x1 - tooth_pitch / 4) / tooth_pitch);
hoop_turn = 270 + crest_x / pitch_r * 180 / PI - 180 / teeth;

// The logo at the size of veryos_logo.svg, as in veryos_logo_cube: a ring and
// the two arms of a V, all logo_stroke wide. The arms stand logo_angle off
// vertical, their outer edges tangent to the ring, their inner edges tangent
// to its hole.
logo_r = 15.6264133379; // outer radius of the ring
logo_stroke = 5;
logo_angle = 22.5;
// Half the flat bottom edge, which is tangent to the ring's bottom.
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
// Outer edge of an arm. The middle of its square end is level with the
// middle of the ring's stroke at the top.
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
// The S in the ring: two half rings around half discs, all strokes
// logo_stroke wide.
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;
// Height of a logo of the given width.
function logo_h(width) = width * 2 * logo_r / logo_w;
platform_logo_y = platform_r - logo_h(platform_logo_width) / 2 - 4;

assert(teeth >= 30, "rpm is too high: the hoop needs at least 30 teeth.");
assert(platform_r >= base_r + 1, str("turntable_d must be at least ", 2 * base_r + 2,
       " for this rpm and tooth_pitch; raise turntable_d or rpm, or lower tooth_pitch."));
assert(addendum >= 0.15, "tooth_pitch is too small or backlash too large: no tooth left above the pitch circle.");
assert(root_r > involute_r && tooth_half_angle(root_r) < 180 / teeth, "The teeth do not fit; lower backlash.");
assert(motor_wire <= 24, str("The motor's wires do not reach the board (", motor_wire, " of 24); lower rpm."));
assert(logo_h(base_logo_width) + 2 <= wall_z, "The base's logo is higher than its wall; lower base_logo_width.");
assert(norm([platform_logo_width / 2, platform_logo_y + logo_h(platform_logo_width) / 2]) <= platform_r - 1,
       "The platform's logo does not fit inside its edge; lower platform_logo_width.");
assert(norm([worm_logo_width, logo_h(worm_logo_width)]) / 2 <= worm_root_r - 0.5,
       "The worm's logo does not fit in its end; lower worm_logo_width.");
assert(bracket_logo_width <= arm_w - 2, "The bracket's logo is wider than its arm; lower bracket_logo_width.");
assert(cap_logo_width <= cap_w - 2.4 && logo_h(cap_logo_width) <= cap_h - 2.4,
       "The cap's logo does not fit in its face; lower cap_logo_width.");
assert(cap_stem >= socket_depth + 0.6, "cap_travel is too small: nothing left between the cap's socket and its head.");

echo(str(teeth, " teeth: ", real_rpm, " rpm, ", 60 / real_rpm, " s per turn; hoop ", 2 * pitch_r, ", base ",
         2 * base_r, " across, ", top_z, " high"));

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "open") open();
else if (part == "section") section();
else if (part == "base") base();
else if (part == "platform") translate([0, 0, top_z]) rotate([180, 0, 0]) platform();
else if (part == "worm") worm();
else if (part == "bracket") bracket_as_printed();
else if (part == "screw") screw_lying();
else if (part == "cap") cap();

// Moves children from the motor's frame, the board's, the battery's and the
// clamp's to their places in the base.
module at_motor() rotate(layout_turn) translate([0, -centre_distance, 0]) children();
module at_board() rotate(90) children();
module at_battery() rotate(90 - battery_turn) children();
module at_clamp() rotate(90 - battery_turn / 2) children();

module open() {
    color("white") base();
    color("silver") at_motor() motor();
    color("gold") at_motor() worm_in_place();
    color("seagreen") at_board() board();
    color("lightsteelblue") at_battery() battery();
    color("tomato") at_clamp() bracket();
    color("gold") at_clamp() screw_in_place();
    color("tomato") at_board() cap_in_place();
}

module assembly() {
    open();
    color("deepskyblue") platform();
}

// The assembly cut through the platform's axis and the worm, across the
// worm's axis; look at it from +x.
module section() {
    color("white") worm_cut() base();
    color("silver") worm_cut() at_motor() motor();
    color("gold") worm_cut() at_motor() worm_in_place();
    color("deepskyblue") worm_cut() platform();
}

// Turns the worm to -y and cuts away the half on +x, rendered so it keeps
// its colour.
module worm_cut()
    render() difference() {
        rotate(-layout_turn) children();
        translate([0, -turntable_d, -1]) cube(2 * turntable_d);
    }

// Every part as it prints: the base standing, the platform and the bracket
// upside down, the worm on its closed end, the screw lying, the cap on its
// face.
module print_layout() {
    // The bracket's arms stay inside this radius around its screw.
    reach = max(norm(battery_tip - [clamp_r, 0]), norm(socket_tip - [clamp_r, 0])) + arm_w / 2;
    base();
    translate([base_r + layout_gap + platform_r, 0, top_z]) rotate([180, 0, 0]) platform();
    translate([0, -(base_r + layout_gap + worm_tip_r), 0]) {
        worm();
        translate([-worm_tip_r - layout_gap - screw_head_width, 0, 0]) screw_lying();
        translate([-worm_tip_r - 2 * layout_gap - 2 * screw_head_width - cap_w / 2, 0, 0]) cap();
    }
    translate([worm_tip_r + layout_gap + reach, -(base_r + layout_gap + reach), 0]) bracket_as_printed();
}

// The outline of the base, round with the flat panel at +y, r wide and
// panel_y from the axis to the panel.
module outline(r, panel_y, h)
    intersection() {
        cylinder(r = r, h = h);
        translate([-r, -r, 0]) cube([2 * r, r + panel_y, h]);
    }

// Tray with the floor, the wall and the panel; inside the tube for the
// platform's pin, the guard around the hoop, the motor's pocket, the board's
// seat, the battery's fence and the block with the thread for the bracket's
// screw.
module base() {
    difference() {
        union() {
            difference() {
                outline(base_r, panel_out, wall_z);
                translate([0, 0, floor_z]) outline(inner_r, panel_in, wall_z);
            }
            cylinder(r = tube_r, h = tube_z);
            guard();
            at_motor() motor_pocket();
            at_board() board_seat();
            at_battery() battery_fence();
            // into the wall
            at_clamp() translate([block_x0, -block_w / 2, 0]) cube([inner_r + 1 - block_x0, block_w, bracket_z]);
        }
        translate([0, 0, floor_z]) cylinder(d = pin_d + pin_clearance, h = wall_z);
        at_board() panel_openings();
        at_clamp() translate([clamp_r, 0, bracket_z - thread_depth]) thread_hole(thread_depth);
        base_logo_cut();
    }
}

// Wall around the hoop, open where the motor and the worm are.
module guard()
    difference() {
        rotate_extrude() translate([sweep_r, 0]) square([guard_r - sweep_r, plate_z - 1]);
        at_motor() translate([motor_x - 2.5, -pocket_out_y - 0.5, floor_z])
            cube([worm_x1 + 3 - motor_x + 2.5, 2 * pocket_out_y + 1.5, plate_z]);
    }

// In the motor's frame. The motor drops in between two walls, its flats
// upright, the wires towards the platform's axis: a pad under it, a wall in
// front of the gearbox with a slot for the shaft, a rib behind the rear
// beside the terminals, and a tab with a hook that snaps over the gearbox.
// A block behind the worm's closed end keeps it on the shaft. Where the
// hoop's teeth pass, all of it is cut away.
module motor_pocket() {
    wall_h = axis_z + 3;
    difference() {
        union() {
            translate([motor_x - 1.8, -pocket_out_y, 0])
                cube([gearbox_x + pocket_wall - motor_x + 1.8, 2 * pocket_out_y, motor_bottom_z]);
            // towards the platform's axis
            translate([motor_x, pocket_y, 0]) cube([gearbox_x + pocket_wall - motor_x, pocket_wall, wall_h]);
            // away from it, along the can
            translate([motor_x - 1.8, -pocket_out_y, 0]) cube([can_length + 1.3, pocket_wall, wall_h]);
            translate([motor_x - 1.8, -pocket_out_y, 0]) cube([1.6, pocket_out_y - 2.5, wall_h]);
            translate([gearbox_x, -pocket_out_y, 0]) cube([pocket_wall, 2 * pocket_out_y, axis_z + 4]);
            // 0.5 off the walls before and behind it, so it can bend
            translate([gearbox_x - gearbox_length + 0.5, 0, 0]) rotate([90, 0, 90])
                linear_extrude(gearbox_length - 1) polygon([
                    [-pocket_out_y, 0], [-pocket_y, 0], [-pocket_y, motor_top_z + 0.2],
                    [hook - pocket_y, motor_top_z + 0.2 + hook], [hook - pocket_y, tab_top_z - hook],
                    [-pocket_y, tab_top_z], [-pocket_out_y, tab_top_z]]);
            translate([worm_x1 + 0.8, -4, 0]) cube([1.6, 8, axis_z + 2]);
        }
        translate([gearbox_x - 1, 0, axis_z]) hull() for (z = [0, motor_width])
            translate([0, 0, z]) rotate([0, 90, 0]) cylinder(d = boss_d + 0.6, h = pocket_wall + 2, $fn = 32);
        translate([0, centre_distance, band_z - 0.8]) cylinder(r = sweep_r, h = plate_z);
    }
}

// In the board's frame. Two ledges under the board's ends, a guide along
// each side, two stops behind the corners beside the plugs, and a wedge on
// the panel that holds the front edge down: the board goes in tilted, front
// edge first.
module board_seat() {
    guide_y = board_side + pocket_wall;
    stop_z = board_top_z + 1;
    translate([board_x1 - 1.4, -guide_y, 0]) cube([panel_in - board_x1 + 1.4 + eps, 2 * guide_y, board_z]);
    translate([board_x0 - 1.9, -guide_y, 0]) cube([3.3, 2 * guide_y, board_z]);
    for (m = [0, 1]) mirror([0, m, 0])
        translate([board_x0 - 1.9, board_side, 0]) cube([panel_in - board_x0 + 1.9 + eps, pocket_wall, stop_z]);
    translate([board_x0 - 1.9, -guide_y, 0]) cube([1.6, guide_y - 6.3, stop_z]);
    translate([board_x0 - 1.9, 10.9, 0]) cube([1.6, guide_y - 10.9, stop_z]);
    // between the charging light's slit and the switch, 0.4 off the switch
    translate([0, 4.6, 0]) rotate([90, 0, 0]) linear_extrude(1.6) polygon([
        [panel_in + eps, board_top_z + 0.1], [panel_in - 0.8, board_top_z + 0.9],
        [panel_in - 0.8, board_top_z + 1.5], [panel_in + eps, board_top_z + 1.5]]);
}

// In the board's frame, through the panel: the opening for the USB-C plug,
// wide enough for its grip, the hole for the switch's plunger, 0.6 wider
// than the cap's stem on each side, and the slit that shows the charging
// light.
module panel_openings() {
    translate([panel_in - 0.3, 0, board_z]) rotate([90, 0, 90]) linear_extrude(wall + 1.3) {
        translate([usb_y, usb_z]) polygon([[-6.5, -3.7], [6.5, -3.7], [6.5, 1.7], [4.5, 3.7], [-4.5, 3.7], [-6.5, 1.7]]);
        translate([switch_y - stem_w / 2 - 0.6, switch_z - stem_h / 2 - 0.6])
            square([stem_w + 1.2, stem_h / 2 + 0.6 + 2.85]);
        translate([light_y - 1.2, board_thickness + 0.3]) square([2.4, 5]);
    }
}

// In the battery's frame. Walls 5 high around the battery, open at the
// corner where its wire leaves, towards the board.
module battery_fence() {
    fence_y = bat_y + pocket_wall;
    translate([bat_x0 - pocket_wall, -fence_y, 0]) cube([pocket_wall, 2 * fence_y, fence_z]);
    translate([bat_x0 - pocket_wall, -fence_y, 0]) cube([bat_x1 - bat_x0 + 1.8, pocket_wall, fence_z]);
    translate([bat_x0 + 7, bat_y, 0]) cube([bat_x1 - bat_x0 - 6.4, pocket_wall, fence_z]);
}

// Upright in the front of the wall (-y), opposite the panel, logo_depth deep
// all across the curve.
module base_logo_cut() {
    intersection() {
        translate([0, 0, wall_z / 2]) rotate([90, 0, 0]) linear_extrude(base_r + 1)
            scale(base_logo_width / logo_w) translate([0, -logo_r]) logo();
        difference() {
            cylinder(r = base_r + 1, h = wall_z);
            translate([0, 0, -1]) cylinder(r = base_r - logo_depth, h = wall_z + 2);
        }
    }
}

// Plate with the pin and the hoop of teeth on its underside and the logo in
// its top face, in the assembly's place.
module platform() {
    difference() {
        union() {
            translate([0, 0, plate_z]) cylinder(r = platform_r, h = platform_thickness);
            // It stands on the floor inside the base's tube; a cone joins
            // it to the plate.
            rotate_extrude() polygon([[0, floor_z], [pin_r - 1, floor_z], [pin_r, floor_z + 1],
                                      [pin_r, plate_z - 2], [pin_r + 2, plate_z + eps], [0, plate_z + eps]]);
            rotate(layout_turn + hoop_turn) hoop();
        }
        // In the front, its top pointing at the centre.
        translate([0, -platform_logo_y, top_z]) logo_cut(platform_logo_width);
    }
}

// Ring with the teeth outside, from band_z up to the plate, turned so that
// the profile of gear_2d lies at the height of the worm's axis. The teeth's
// lower ends are chamfered at 45 degrees, so they find their way into the
// worm.
module hoop()
    translate([0, 0, band_z]) difference() {
        intersection() {
            rotate(hoop_twist * (axis_z - band_z) / hoop_h)
                linear_extrude(hoop_h + eps, twist = hoop_twist, slices = ceil(hoop_h)) gear_2d();
            cylinder(r1 = root_r, r2 = root_r + hoop_h, h = hoop_h + eps);
        }
        translate([0, 0, -1]) cylinder(r = root_r - hoop_wall, h = hoop_h + 2);
    }

// The hoop's teeth, the first on the x axis.
module gear_2d() {
    n = 6;
    radii = [for (i = [0 : n]) root_r + (tip_r - root_r) * i / n];
    polygon([for (t = [0 : teeth - 1]) let(c = t * 360 / teeth) each concat(
        [for (r = radii) polar(r, c - tooth_half_angle(r))],
        [for (i = [n : -1 : 0]) polar(radii[i], c + tooth_half_angle(radii[i]))])]);
}

// Standing on its closed end, as it prints: the thread, chamfered at both
// ends, and the bore for the shaft, D-shaped at the bottom, with the logo in
// the closed end.
module worm() {
    flat_y = shaft_flat - shaft_d / 2 + shaft_clearance / 2;
    difference() {
        intersection() {
            threaded_rod(2 * worm_tip_r, worm_length, tooth_pitch);
            rotate_extrude() polygon([[0, 0], [worm_root_r, 0], [worm_tip_r, tooth_depth],
                                      [worm_tip_r, worm_length - tooth_depth], [worm_root_r, worm_length],
                                      [0, worm_length]]);
        }
        translate([0, 0, worm_length - bore_depth]) linear_extrude(bore_depth) intersection() {
            circle(d = shaft_d + shaft_clearance, $fn = 48);
            translate([-shaft_d, -flat_y]) square(2 * shaft_d);
        }
        translate([0, 0, worm_length - bore_round]) cylinder(d = shaft_d + shaft_clearance, h = bore_round + 1, $fn = 48);
        // lead-in for the shaft
        translate([0, 0, worm_length - 0.5]) cylinder(d1 = shaft_d + shaft_clearance, d2 = shaft_d + shaft_clearance + 1.2, h = 0.6, $fn = 48);
        // Reads from below.
        rotate([0, 180, 0]) translate([0, 0, 0.2]) logo_cut(worm_logo_width);
    }
}

// The worm on the shaft, in the motor's frame.
module worm_in_place() translate([worm_x1, 0, axis_z]) rotate([0, -90, 0]) worm();

// In the clamp's frame, in its place: a plate on the block, with an arm
// over the middle of the battery and a thicker one over the socket of the
// battery's plug. The thicker part also lies around the block, so the
// bracket cannot turn with the screw. The logo is in the top of the thicker
// arm, its top towards the arm's end.
module bracket() {
    to_socket = socket_tip - [clamp_r, 0];
    difference() {
        union() {
            translate([0, 0, bracket_z]) linear_extrude(bracket_thickness) bracket_2d();
            translate([0, 0, pad_z]) linear_extrude(bracket_z - pad_z + eps) difference() {
                intersection() {
                    bracket_2d();
                    union() {
                        arm_2d(socket_tip);
                        translate([block_x0 - bracket_rim, -block_w / 2 - bracket_rim])
                            square([block_w + bracket_rim, block_w + 2 * bracket_rim]);
                    }
                }
                translate([block_x0 - bracket_gap, -block_w / 2 - bracket_gap])
                    square([inner_r, block_w + 2 * bracket_gap]);
            }
        }
        translate([clamp_r, 0, pad_z - 1]) cylinder(d = screw_d + 0.6, h = bracket_top_z, $fn = 48);
        translate([clamp_r, 0, bracket_top_z]) rotate(atan2(to_socket[1], to_socket[0]) - 90)
            translate([0, (screw_head_width / cos(30) / 2 + norm(to_socket) + arm_w / 2) / 2, 0])
                logo_cut(bracket_logo_width);
    }
}

// The bracket's outline: the plate over the block and the two arms, the
// corners between them filleted, the others rounded.
module bracket_2d()
    offset(r = 1) offset(delta = -1) offset(r = -2) offset(delta = 2) {
        translate([block_x0 - bracket_rim, -block_w / 2 - bracket_rim])
            square([block_w + bracket_rim, block_w + 2 * bracket_rim]);
        arm_2d(battery_tip);
        arm_2d(socket_tip);
    }

// An arm from the screw to tip.
module arm_2d(tip)
    hull() {
        translate([clamp_r, 0]) circle(d = arm_w);
        translate(tip) circle(d = arm_w);
    }

// Upside down, its top face on the bed, the screw's hole on the origin.
module bracket_as_printed() translate([0, 0, bracket_top_z]) rotate([180, 0, 0]) translate([-clamp_r, 0, 0]) bracket();

// The screw standing on its head: a hex head with a slot for a screwdriver
// in its end face, the thread and a 45 degree chamfer at the tip.
module screw() {
    difference() {
        hex(screw_head_width, screw_head_height);
        translate([-screw_slot / 2, -screw_head_width, -1]) cube([screw_slot, 2 * screw_head_width, screw_slot + 1]);
    }
    translate([0, 0, screw_head_height - eps]) intersection() {
        threaded_rod(screw_d, screw_length + eps, screw_pitch, $fn = 72);
        cylinder(h = screw_length + eps, r1 = screw_d / 2 - 1 + screw_length, r2 = screw_d / 2 - 1);
    }
}

// As it prints: lying along y on a flat of its head, centred on the origin,
// everything below screw_cut x screw_d above the thread's lowest point cut
// off. The cut is the bed. The slot stands upright.
module screw_lying() {
    axis = screw_d * (0.5 - screw_cut);
    length = screw_head_height + screw_length;
    translate([0, -length / 2, axis]) difference() {
        rotate([-90, 0, 0]) screw();
        translate([-screw_head_width, -1, -axis - screw_head_width]) cube([2 * screw_head_width, length + 2, screw_head_width]);
    }
}

// The screw in the bracket, in the clamp's frame, turned so that its thread
// lies in the block's.
module screw_in_place()
    translate([clamp_r, 0, screw_top_z]) rotate(360 * (bracket_thickness + thread_depth) / screw_pitch)
        rotate([180, 0, 0]) screw();

// Threaded blind hole for the screw from z = 0 up to h, with a 45 degree
// lead-in at the top.
module thread_hole(h) {
    hole_r = screw_d / 2 + thread_clearance;
    thread_h = 0.4 * screw_pitch;
    threaded_rod(2 * hole_r, h + screw_pitch, screw_pitch, $fn = 72);
    translate([0, 0, h - thread_h]) cylinder(r1 = hole_r - thread_h, r2 = hole_r + 1, h = 1 + thread_h, $fn = 72);
}

// Hex prism with bevelled corners, from z = 0 to h.
module hex(width, h) {
    w = width / 2;
    intersection() {
        cylinder(r = w / cos(30), h = h, $fn = 6);
        rotate_extrude() polygon([[0, 0], [w, 0], [w + 1, 1], [w + 1, h - 1], [w, h], [0, h]]);
    }
}

// The cap as it prints, its face on the bed: the head, its face's edge
// chamfered, and the stem with the socket for the plunger's tip, which has a
// lead-in. The logo is in the face.
module cap() {
    socket = [tip_width + cap_clearance, tip_height + cap_clearance];
    difference() {
        union() {
            hull() {
                linear_extrude(eps) offset(delta = -0.4) cap_2d();
                translate([0, 0, 0.4]) linear_extrude(cap_head - 0.4) cap_2d();
            }
            translate([0, 0, cap_head - eps]) linear_extrude(cap_stem + eps) square([stem_w, stem_h], center = true);
        }
        translate([0, 0, cap_length - socket_depth]) linear_extrude(socket_depth + 1) square(socket, center = true);
        translate([0, 0, cap_length - 0.3])
            linear_extrude(0.3 + eps, scale = [1 + 0.6 / socket[0], 1 + 0.6 / socket[1]]) square(socket, center = true);
        // Reads from below.
        rotate([0, 180, 0]) translate([0, 0, 0.2]) logo_cut(cap_logo_width);
    }
}

// The head's outline, its corners rounded.
module cap_2d() offset(r = 1.5) square([cap_w - 3, cap_h - 3], center = true);

// The cap on the plunger's tip, in the board's frame.
module cap_in_place()
    translate([tip_x + cap_length - socket_depth, switch_y, board_z + switch_z]) rotate([90, 0, -90]) cap();

// The kit's motor in the motor's frame, simplified: gearbox, can, boss and
// shaft.
module motor()
    translate([gearbox_x, 0, axis_z]) rotate([0, -90, 0]) {
        translate([-motor_width / 2, -motor_flats / 2, 0]) cube([motor_width, motor_flats, gearbox_length]);
        translate([0, 0, gearbox_length]) intersection() {
            cylinder(d = motor_width, h = can_length);
            translate([-motor_width / 2, -motor_flats / 2, 0]) cube([motor_width, motor_flats, can_length]);
        }
        translate([0, 0, -boss_length]) cylinder(d = boss_d, h = boss_length);
        difference() {
            translate([0, 0, -shaft_length]) cylinder(d = shaft_d, h = shaft_length);
            translate([-shaft_d, -shaft_d - shaft_flat + shaft_d / 2, -shaft_length - 1])
                cube([2 * shaft_d, shaft_d, flat_length + 1]);
        }
    }

// The kit's board in the board's frame, simplified: the USB-C socket, the
// switch, its plunger with the collar and the tip, and the two sockets for
// the plugs.
module board() {
    translate([board_x0, -board_width / 2, board_z]) cube([board_length, board_width, board_thickness]);
    translate([board_cx, 0, board_z]) {
        translate([6.7, -11.6, 1.2]) cube([6.9, 8.9, 3.2]);
        translate([6.6, 5, 1.2]) cube([5.4, 5.8, 5.7]);
        translate([12, switch_y - 1.725, switch_z - 1.425]) cube([2.5, 3.45, 2.85]);
        translate([board_length / 2 + tip_reach - tip_length, switch_y - tip_width / 2, switch_z - tip_height / 2])
            cube([tip_length, tip_width, tip_height]);
        for (y = [motor_plug_y, battery_plug_y])
            translate([socket_x - 3, y - 3, board_thickness]) cube([6, 6, socket_z - board_thickness]);
    }
}

// The kit's battery in the battery's frame.
module battery()
    translate([bat_x0 + 0.3, -battery_width / 2, floor_z]) cube([battery_length, battery_width, battery_thickness]);

// The logo, width wide and centred on the origin, to cut logo_depth deep
// into a face on z = 0 from above. It reads from +z with its top at +y.
module logo_cut(width)
    translate([0, 0, -logo_depth]) linear_extrude(logo_depth + 1)
        scale(width / logo_w) translate([0, -logo_r]) logo();

// The VeryOS logo at the size of veryos_logo.svg, bottom edge on y = 0,
// centred on x = 0, as in veryos_logo_cube.
module logo() {
    difference() {
        union() {
            translate([0, logo_r]) circle(r = logo_r);
            for (m = [0, 1]) mirror([m, 0])
                translate([logo_b, 0]) rotate(-logo_angle)
                    translate([-logo_stroke, 0]) square([logo_stroke, logo_arm]);
            // between the arms, below the ring's middle
            polygon([[-logo_b, 0], [logo_b, 0],
                     [logo_b + logo_r * tan(logo_angle), logo_r],
                     [-logo_b - logo_r * tan(logo_angle), logo_r]]);
        }
        translate([0, logo_r]) for (a = [0, 180]) rotate(a) s_hole();
    }
}

// One of the two holes the S leaves in the ring: the right half of the ring's
// hole above the lower half ring, and the upper half disc.
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

// Threaded rod of major diameter d from z = 0 to h, as in
// fdm_optimized_screws: the worm. render() keeps the preview working with
// this many threads.
module threaded_rod(d, h, pitch) {
    r_root = d / 2 - 0.4 * pitch;
    render(convexity = 4) intersection() {
        union() {
            cylinder(r = r_root + eps, h = h);
            thread_ridge(r_root, -pitch, h + pitch, pitch);
        }
        cylinder(r = d / 2 + 1, h = h);
    }
}

// Sweeps a trapezoid around a right-handed helix. Equal radial depth and
// axial flank run give 45 degree flanks (90 degree included angle).
module thread_ridge(r_root, z0, z1, pitch) {
    depth = 0.4 * pitch;
    half_tip = 0.05 * pitch;
    steps = ceil((z1 - z0) / pitch * $fn);
    profile = [[r_root - eps, -half_tip - depth - eps],
               [r_root + depth, -half_tip],
               [r_root + depth, half_tip],
               [r_root - eps, half_tip + depth + eps]];
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
