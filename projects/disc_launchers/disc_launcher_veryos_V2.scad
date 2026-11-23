// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Disc launcher V2: a disc and a one-piece launcher that shoots it when its two
// rails are squeezed. Standalone, no libraries. Millimetres, newtons, degrees.
// Print everything flat as it lies, no support.
//
// How it works, see readme.md for the formulas:
//   - Two cams behind the disc's widest point form a V. Squeezing closes the V and
//     pushes the disc forward, if the cams are steeper than the friction angle
//     atan(friction).
//   - Two noses on tapered lips sit in front of the widest point and hold the disc.
//     The closing arms bend the lips open over the disc, the lips store that work
//     and fling the disc once they are more than the friction angle behind its
//     widest point. So: squeeze until the arms touch.
//   - Each side is a fork from one block: the arm with the cam inside, the lip in
//     the middle, the rail for the finger outside. A bar across the rear joins the
//     two blocks and bends as their hinge.
// model() works this out for each launcher and the script echoes the numbers.
// The blocks carry the settings: c cam angle, t lip thickness, L lip length, h hold.

/* [1 - Start here] */
part = "plate"; // [plate:All launchers of the plate and the discs for one print,launcher:One launcher with the settings below,disc:Disc,assembly:Launcher with a loaded disc]

/* [2 - Launcher settings] */
// Angle of the cams to the launch direction. Steeper: more squeeze travel, the lips bend further and fling harder.
cam_angle = 38; // [30:1:42]
// Thickness of the two lips at the block. Thicker: harder squeeze, faster disc, more strain.
lip_thickness = 1.7; // [1.2:0.1:2.4]
// How far each nose reaches in over the disc's edge: the mouth is 2 x hold narrower than the disc.
hold = 0.6; // [0.3:0.1:1]
// How far each nose presses into the loaded disc, so that it does not rattle. Less than hold.
preload = 0.2; // [0:0.05:0.4]

/* [3 - Plate: one launcher per cam angle and lip thickness] */
plate_cam_angles = [34, 38];
plate_lip_thicknesses = [1.4, 1.7, 2.0];
plate_discs = 6; // [0:1:12]

/* [4 - Disc] */
disc_diameter = 18; // [12:0.5:40]
disc_thickness = 3; // [2:0.2:6]
// Height of the upright band around the disc that the cams and noses touch.
rim_land = 1; // [0.6:0.2:3]
// Slope of the disc's edge above and below the band, from the bed. 45 or more prints without support.
rim_angle = 60; // [45:5:75]

/* [5 - Friction and material: for the model, they do not change the shape] */
// Friction coefficient plastic on plastic. Printed PLA on PLA: 0.12 to 0.38 static, 0.35 to 0.55 sliding under load.
friction = 0.35; // [0.1:0.05:0.8]
// Bending modulus of the plastic, N/mm². PLA about 3300, PETG about 2000.
e_modulus = 3300;
// Strain the springs may see, in percent. PLA yields near 2.
strain_max = 1.2; // [0.5:0.1:3]
// Density of the disc, g/cm³, printed solid.
density = 1.24;

/* [6 - Launcher sizes] */
// Taller: stiffer and faster by the same factor, no more strain.
height = 7; // [4:0.2:10]
// Lip from the block to the nose. Longer: softer, less strain, longer launcher.
lip_length = 30; // [20:1:50]
// Thickness of the lips at the nose.
lip_tip = 0.8; // [0.6:0.1:1.6]
// Blocks behind the lips, with the settings on top and the logo below.
block_length = 8; // [5:1:16]
// Rails for the fingers: how far along the lips they reach, and their thickness at the end.
rail_reach = 0.4; // [0.2:0.05:0.6]
rail_thickness = 3.5; // [2.4:0.1:6]
// Bar across the rear: the hinge. Thicker: harder squeeze, firmer hold, more strain.
bar_thickness = 1.8; // [1.2:0.2:3]
// Arm from the block to the cam.
jaw_thickness = 3; // [2:0.2:4]
logo = true;
// Settings and version engraved in the blocks.
labels = true;

/* [7 - Fits] */
// Room above and below the disc's band in the grooves.
z_clearance = 0.2; // [0.1:0.1:0.6]
// Radius of the noses where the disc touches them, and the collar around their groove.
nose_radius = 1.0; // [0.8:0.1:2]
nose_collar = 0.4; // [0.2:0.1:0.8]

/* [Hidden] */
version = "V2";
$fn = 64;
eps = 0.01;
// Rounding of the inner corners. Slots must stay wider than twice this.
fillet = 0.4;
lip_slot = 1.2;             // between the lip's root and the arm
rail_slot = 2 * fillet + 0.2;// between the lip's root and the rail
bar_slot = 1.2;             // between the bar and the blocks: it narrows as the sides close
lip_gap = 2 * fillet + 0.2; // between the lip and the cam's outer corner
nose_gap = 2 * fillet + 0.2;// between the cam's end and the nose pushed out
bar_corner = 2.4;           // each end of the bar is joined to its block over this width
recess = 1.5;               // the blocks and the bar stand back from the rails: the fingers find the rails
rail_chamfer = 1.0;
lip_room = 8;               // a lip may bend this far at the nose before it meets its rail
bend_back = 0.4;            // the cam starts this far behind the resting disc
cam_end_thickness = 1.4;
lip_past = 2.0;             // the lip ends this far in front of the nose
label_depth = 0.4;
label_font = "Liberation Sans:style=Bold";
logo_depth = 0.4;

// ---- geometry: one side, y > 0, the loaded disc's centre on the origin, +x is forward ----
R = disc_diameter / 2;
Rn = R + nose_radius;
// The nose's centre as printed: `hold` inside the disc's widest point, `preload` into the loaded disc.
yn = Rn - hold;
xn = sqrt(pow(Rn - preload, 2) - yn * yn);
nose_out = nose_radius + nose_collar;
groove_half = rim_land / 2 + z_clearance;
// Width of the disc's sloped edge. The cams' groove is as deep, so that the disc's flat faces pass it.
bevel = (disc_thickness - rim_land) / 2 / tan(rim_angle);
groove_depth = max(0.6, bevel + 0.02);

function tc(b) = [cos(b), sin(b)];   // along the cam, forward and outward
function nc(b) = [-sin(b), cos(b)];  // into the cam
// The cam's wall is groove_depth nearer to the disc than the groove's bottom, which the disc touches.
function wall0(b) = (R - groove_depth) * nc(b);
function bend(b) = wall0(b) - bend_back * tc(b);
// The cam ends where the nose needs room when the disc pushes it out.
function cam_length(b) = bend_back + (xn - nose_out - nose_gap - wall0(b)[0]) / cos(b);
function cam_end(b) = bend(b) + cam_length(b) * tc(b);
function cam_corner(b) = cam_end(b) + cam_end_thickness * nc(b);
// End of the groove's bottom: the corner that pushes the disc after the cam.
function groove_end(b) = R * nc(b) + (cam_length(b) - bend_back) * tc(b);

x_root = xn - lip_length;                 // front of the blocks: arm, lip and rail start here
x_rail = x_root + rail_reach * lip_length;
x_block = x_root - block_length;
x_bar = x_block - bar_slot - bar_thickness / 2;
x_rear = x_bar - bar_thickness / 2;
x_front = xn + lip_past + lip_tip / 2;

function lip_root(b, lt) = [x_root, bend(b)[1] + jaw_thickness + lip_slot + lt / 2];
// The lip tapers from lt at the block to lip_tip at the nose.
function lip_at(lt, x) = lt + (lip_tip - lt) * max(0, min(1, (x - x_root) / lip_length));
// Its centre line is straight and passes the cam's outer corner at lip_gap.
function lip_slope(b, lt, s = 0, n = 3) =
    n == 0 ? s
    : lip_slope(b, lt, (cam_corner(b)[1] + (lip_gap + lip_at(lt, cam_corner(b)[0]) / 2) / cos(atan(s))
                        - lip_root(b, lt)[1]) / (cam_corner(b)[0] - x_root), n - 1);
function lip_y(b, lt, x) = lip_root(b, lt)[1] + lip_slope(b, lt) * (x - x_root);
// Inner face of the rail: rail_slot from the lip at the block, at its end the room for a lip bent lip_room
// at the nose. There a lip of constant thickness has (3 r² - r³) / 2 of that bend, a tapered one less.
function rail_in0(b, lt) = lip_root(b, lt)[1] + lt / 2 + rail_slot;
function rail_in1(b, lt) = lip_y(b, lt, x_rail) + lip_at(lt, x_rail) / 2
    + (3 * pow(rail_reach, 2) - pow(rail_reach, 3)) / 2 * lip_room + 0.3;
function half_width(b, lt) = rail_in1(b, lt) + rail_thickness;
// Half of the bar's free length, between the launcher's axis and the corner that joins it to the block.
function bar_half(b, lt) = half_width(b, lt) - recess - bar_corner;

// ---- model: what holds the disc and what launches it ----
function rad(a) = a * PI / 180;
function sum(v, i = 0) = i >= len(v) ? 0 : v[i] + sum(v, i + 1);
function most(v) = len(v) == 0 ? 0 : max(v);
function unit(s) = max(-1, min(1, s));

disc_volume = PI * R * R * disc_thickness
    - 2 * PI * (R - bevel / 3) * bevel * (disc_thickness - rim_land) / 2;
disc_mass = disc_volume * density / 1000; // g

// Tapered lip with the force at the nose. Its bend against a beam of constant thickness lt: 1/3 without taper.
function lip_taper(lt) = lip_tip / lt;
function lip_shape(lt) =
    let (a = lip_taper(lt), c = 1 - a)
    c < 0.001 ? 1 / 3 : (2 * a - a * a / 2 - ln(a) - 1.5) / pow(c, 3);
function lip_stiffness(lt) = e_modulus * height * pow(lt, 3) / (12 * lip_shape(lt) * pow(lip_length, 3));
// Strain in percent at a bend u. With a tip thinner than half the root the peak leaves the root.
function lip_strain(lt, u) =
    let (a = lip_taper(lt))
    50 * lt * u * (a >= 0.5 ? 1 : 1 / (4 * a * (1 - a))) / (lip_shape(lt) * pow(lip_length, 2));
// A bent lip turns its end about a point behind the nose, 2/3 of its length without taper:
// the nose moves forward too, by this much per mm outward.
function nose_drift(b, lt) =
    let (x = xn - 2 * lip_taper(lt) * lip_shape(lt) * lip_length)
    (lip_y(b, lt, x) - yn) / (xn - x);

// The bar bends evenly between the blocks: each side turns about the middle of its half of the bar.
function pivot(b, lt) = [x_bar, bar_half(b, lt) / 2];
function bar_stiffness(b, lt) = e_modulus * height * pow(bar_thickness, 3) / 12 / bar_half(b, lt); // N mm per rad
// The fingers press on the middle of the rails.
finger_arm = (x_root + x_rail) / 2 - x_bar;

model_steps = 300;
turn_min = -12;
turn_max = 17;
function turned(q, p, th) =
    let (r = q - p)
    p + [r[0] * cos(th) + r[1] * sin(th), r[1] * cos(th) - r[0] * sin(th)];
// [gap between the disc at x and the cam, past the cam's end its corner; wedge angle there], the side turned th.
function cam_gap(x, th, b, p) =
    let (q = turned(R * nc(b), p, th))
    ([x, 0] - q) * tc(b - th) <= cam_length(b) - bend_back
        ? [(q - [x, 0]) * nc(b - th) - R, b - th]
        : let (g = turned(groove_end(b), p, th), d = norm(g - [x, 0]))
          [d - R, asin(unit((x - g[0]) / d))];
// First turn, from the open side in steps of a degree, at which the cam is at the disc at x or in it.
function turn_over(x, b, p, th = turn_min) =
    th > turn_max ? undef : cam_gap(x, th, b, p)[0] <= 0 ? th : turn_over(x, b, p, th + 1);
// Turn of the side that lays the cam on the disc, between lo, clear of it, and hi.
function turn(x, b, p, lo, hi, n = 24) =
    n == 0 ? (lo + hi) / 2
    : let (mid = (lo + hi) / 2)
      cam_gap(x, mid, b, p)[0] > 0 ? turn(x, b, p, mid, hi, n - 1) : turn(x, b, p, lo, mid, n - 1);
// How far the disc at x pushes a nose out, the nose's centre at pn without the disc.
function lip_bend(x, pn, k) =
    let (ax = pn[0] - x, q = ax * k + pn[1],
         d = q * q - (1 + k * k) * (ax * ax + pn[1] * pn[1] - Rn * Rn))
    d <= 0 ? 0 : max(0, (sqrt(d) - q) / (1 + k * k));
// Angle of the nose behind the disc's widest point; negative: in front, it holds.
function nose_angle(x, pn, u, k) = asin(unit((x - pn[0] - k * u) / Rn));

// Friction does not enter here. For each position x of the disc:
// [x, turn of the side, wedge angle of the cam, nose's centre, lip's bend, nose's angle, the cam's bend above the axis]
function kinematics(b, lt) =
    let (p = pivot(b, lt), k = nose_drift(b, lt))
    [for (i = [0 : model_steps])
        let (x = -1 + i * (xn + Rn + 1) / model_steps, hi = turn_over(x, b, p))
        if (!is_undef(hi) && hi > turn_min)
            let (th = turn(x, b, p, hi - 1, hi), pn = turned([xn, yn], p, th), u = lip_bend(x, pn, k))
            [x, th, cam_gap(x, th, b, p)[1], pn, u, nose_angle(x, pn, u, k), turned(bend(b), p, th)[1]]];

// Force of the disc on a part it slides past, the contact a degrees behind the disc's widest point.
// Its first number is what holds the disc back; negative: the part pushes the disc.
function contact_force(f, a, mu) = f * [mu * cos(a) - sin(a), cos(a) + mu * sin(a)];
function moment(q, f, p) = (q[0] - p[0]) * f[1] - (q[1] - p[1]) * f[0];
// Normal force of a nose on a lip bent u.
function nose_force(u, a, lt, k, phi) =
    lip_stiffness(lt) * u * cos(atan(k)) * cos(phi) / cos(a + atan(k) - phi);

// [state, friction angle, squeeze N per finger, finger travel, room left between the arms, lip bend,
//  lip strain %, bar strain %, lip energy mJ, fling mJ, speed m/s]
function model(b, lt, mu = friction, kin = undef) =
    let (rows = is_undef(kin) ? kinematics(b, lt) : kin, n = len(rows), phi = atan(mu),
         p = pivot(b, lt), k = nose_drift(b, lt), ks = bar_stiffness(b, lt),
         // per row: [squeeze, force of a cam, force along the bar]
         f = [for (r = rows)
             let (c = [r[0], 0], fn = contact_force(nose_force(r[4], r[5], lt, k, phi), r[5], mu),
                  // the cams push as hard as the noses hold back
                  cam = fn[0] <= 0 ? 0 : r[2] - phi > 0.5 ? fn[0] / (sin(r[2]) - mu * cos(r[2])) : 1e6,
                  fk = contact_force(cam, r[2], mu),
                  squeeze = (ks * rad(r[1]) + moment(c + R * nc(r[2]), fk, p) + moment(c + R * nc(r[5]), fn, p))
                      / finger_arm)
             [squeeze, cam, squeeze - fk[1] - fn[1]]],
         start = [for (i = [0 : 1 : n - 1]) if (f[i][0] >= 0) i],
         i0 = len(start) == 0 ? n : start[0],
         // the lips take over where the noses are the friction angle behind the widest point
         over = [for (i = [i0 : 1 : n - 1]) if (rows[i][5] >= phi) i],
         jam = [for (i = [i0 : 1 : n - 1]) if (f[i][1] >= 1e5) i],
         touch = [for (i = [i0 : 1 : n - 1]) if (rows[i][6] <= 0.1) i],
         i_over = len(over) == 0 ? n : over[0],
         i_jam = len(jam) == 0 ? n : jam[0],
         i_touch = len(touch) == 0 ? n : touch[0],
         state = i_over < n && i_over <= min(i_jam, i_touch) ? "ok"
             : i_jam < n && i_jam <= i_touch ? "jams: friction"
             : i_touch < n ? "jams: arms touch first" : "no launch",
         last = state == "ok" ? i_over - 1 : min(i_jam, i_touch, n - 1),
         used = [for (i = [i0 : 1 : last]) i],
         u_max = most([for (i = used) rows[i][4]]),
         // where the lips take over, or where it jams
         go = n == 0 ? [0, 0, 0, [xn, yn], 0, 0, 0] : rows[state == "ok" ? i_over : max(0, last)],
         dx = (xn + Rn + 1) / model_steps,
         // the side stays where it is, the lips push the disc out
         fling = state != "ok" ? 0 : dx * sum([for (i = [0 : 400])
             let (x = go[0] + i * dx, u = lip_bend(x, go[3], k), a = nose_angle(x, go[3], u, k))
             if (u > 0 && a + atan(k) - phi < 85) -2 * contact_force(nose_force(u, a, lt, k, phi), a, mu)[0]]))
    [state, phi, most([for (i = used) f[i][0]]), rad(go[1]) * finger_arm, go[6], u_max,
     lip_strain(lt, u_max),
     // even bending by the turn, and what the squeeze along the bowed bar adds
     most([for (i = used) 100 * bar_thickness * rad(rows[i][1]) / (2 * bar_half(b, lt))
                              * (1 + max(0, f[i][2]) * bar_half(b, lt) / (2 * ks))]),
     lip_stiffness(lt) * pow(go[4], 2), fling, sqrt(max(0, 2 * fling / disc_mass))];

// [force to pull the loaded disc out, force of each nose on the loaded disc]. The noses give way with
// the lips and with the bar, one behind the other: share is what is left of the lips' stiffness.
function hold_force(b, lt, mu = friction) =
    let (k = nose_drift(b, lt), phi = atan(mu),
         share = 1 / (1 + lip_stiffness(lt) * pow(xn - x_bar, 2) / bar_stiffness(b, lt)))
    [share * max([for (i = [0 : 100])
        let (x = i * xn / 100, u = lip_bend(x, [xn, yn], k), a = nose_angle(x, [xn, yn], u, k))
        2 * contact_force(nose_force(u, a, lt, k, phi), a, mu)[0]]),
     share * lip_stiffness(lt) * lip_bend(0, [xn, yn], k)];

// Friction range in which the model launches, in steps of 0.05.
function friction_range(b, lt, kin) =
    let (ok = [for (mu = [0.1 : 0.05 : 0.801]) if (model(b, lt, mu, kin)[0] == "ok") mu])
    len(ok) == 0 ? [0, 0] : [ok[0], ok[len(ok) - 1]];

function fixed(x, d = 2) = let (p = pow(10, d)) round(x * p) / p;
function name(b, lt) = str("c", b, " t", lt);

module report(b, lt) {
    kin = kinematics(b, lt);
    m = model(b, lt, friction, kin);
    h = hold_force(b, lt);
    range = friction_range(b, lt, kin);
    echo(str("launcher ", name(b, lt), ": ", fixed(x_front - x_rear, 1), " x ", fixed(2 * half_width(b, lt), 1),
             " x ", height, " mm | ", m[0], " at friction ", friction, " (friction angle ", fixed(m[1], 1), " deg)",
             " | hold ", fixed(h[0], 3), " N = ", fixed(h[0] / (disc_mass * 0.00981), 1), " x the disc's weight",
             ", each nose presses ", fixed(h[1], 3), " N",
             " | squeeze ", fixed(m[2], 1), " N per finger, rails ", fixed(m[3], 1), " mm each",
             ", ", fixed(m[4], 1), " mm left between each arm and the middle",
             " | lips bend ", fixed(m[5], 1), " mm, strain ", fixed(m[6]), " %, bar ", fixed(m[7]), " %",
             " | lips store ", fixed(m[8], 1), " mJ, fling ", fixed(m[9], 1), " mJ, about ", fixed(m[10], 1), " m/s",
             " | launches from friction ", range[0], " to ", range[1]));
    if (m[0] != "ok")
        echo(str("WARNING launcher ", name(b, lt), ": ", m[0], " at friction ", friction));
    if (m[6] > strain_max || m[7] > strain_max)
        echo(str("WARNING launcher ", name(b, lt), ": strain above strain_max = ", strain_max, " %"));
    if (m[5] > lip_room)
        echo(str("WARNING launcher ", name(b, lt), ": the lips meet the rails, they bend more than ", lip_room, " mm"));
}

// ---- checks ----
assert(height / 2 - groove_half - groove_depth * tan(rim_angle) >= 0.4,
       str("height is too small for this disc's edge: at least ",
           2 * (groove_half + groove_depth * tan(rim_angle) + 0.4), "."));
assert(nose_collar <= groove_depth, "nose_collar must not be more than the cams' groove is deep.");
assert(preload < hold, "preload must be less than hold.");
assert(min(lip_slot, rail_slot, bar_slot) > 2 * fillet, "The slots must be wider than twice the fillet.");

// ---- parts ----
module side_2d(b, lt) {
    g = bend(b)[1];
    root = lip_root(b, lt);
    over_nose = [xn, lip_y(b, lt, xn)];
    hw = half_width(b, lt);
    assert(g > 2, "The arms are too close: lower cam_angle.");
    assert(cam_corner(b)[0] - x_root > 5 && cam_length(b) > bend_back + 1,
           "The lip is too short for this cam: raise lip_length.");
    assert(lt >= lip_tip, "lip_thickness must not be less than lip_tip.");
    assert(bar_half(b, lt) > 5, "The bar is too short to bend: lower recess or bar_corner.");
    // corner that joins the bar to the block
    translate([x_rear, hw - recess - bar_corner]) square([x_block - x_rear + eps, bar_corner]);
    // block, with a ramp out to the rail
    polygon([[x_block, g], [x_root, g], [x_root, hw], [x_root - recess, hw - recess], [x_block, hw - recess]]);
    // rail
    polygon([[x_root - eps, rail_in0(b, lt)], [x_rail, rail_in1(b, lt)], [x_rail, hw - rail_chamfer],
             [x_rail - rail_chamfer, hw], [x_root - eps, hw]]);
    // arm to the cam, cam
    translate([x_root - eps, g]) square([bend(b)[0] - x_root + eps, jaw_thickness]);
    polygon([bend(b), cam_end(b), cam_corner(b), bend(b) + jaw_thickness * nc(b)]);
    // lip, and the nose on its end
    hull() {
        translate(root) circle(d = lt);
        translate(over_nose) circle(d = lip_tip);
    }
    hull() {
        translate(over_nose) circle(d = lip_tip);
        translate([xn + lip_past, lip_y(b, lt, xn + lip_past)]) circle(d = lip_tip);
        translate([xn, yn]) circle(r = nose_out);
    }
}

module launcher_2d(b, lt) {
    w = half_width(b, lt) - recess;
    offset(r = -fillet) offset(delta = fillet) union() {
        translate([x_rear, -w]) square([bar_thickness, 2 * w]);
        for (m = [0, 1]) mirror([0, m]) side_2d(b, lt);
    }
}

// Groove for the disc's edge, seen along it: x into the wall, y up, from `out` in front of the wall.
module groove_2d(depth, out = 0.3) {
    polygon([[-out, -groove_half - (depth + out) * tan(rim_angle)], [depth, -groove_half],
             [depth, groove_half], [-out, groove_half + (depth + out) * tan(rim_angle)]]);
}

module grooves(b, lt) {
    // directions from the nose to the lip's two circles of its hull, and where the hull leaves the nose
    to_lip = [0, lip_y(b, lt, xn) - yn];
    to_end = [lip_past, lip_y(b, lt, xn + lip_past) - yn];
    leaves_a = atan2(to_lip[1], to_lip[0]) + 90 - asin((nose_out - lip_tip / 2) / norm(to_lip));
    leaves_b = atan2(to_end[1], to_end[0]) - 90 + asin((nose_out - lip_tip / 2) / norm(to_end));
    // along the cam
    translate([bend(b)[0], bend(b)[1], height / 2]) rotate(b) translate([-1, 0, 0])
        rotate([90, 0, 90]) linear_extrude(cam_length(b) + 2) groove_2d(groove_depth);
    // around the nose, on the side away from the lip; turned half a facet, so that its
    // edges do not run along the nose's
    translate([xn, yn, height / 2]) intersection() {
        rotate(180 / $fn) rotate_extrude() translate([nose_out, 0]) mirror([1, 0]) groove_2d(nose_collar);
        rotate((leaves_a + leaves_b) / 2 + 180)
            translate([-0.2, -2 * nose_out, -height]) cube([2 * nose_out + 0.2, 4 * nose_out, 2 * height]);
    }
}

// Text engraved from above at z, read from the rear; from below with flip.
module label(string, at, size, z, flip = false) {
    translate([at[0], at[1], z]) linear_extrude(label_depth + 1)
        rotate(-90) mirror([flip ? 1 : 0, 0]) translate([0, -size / 2])
            text(string, size = size, font = label_font, halign = "center", valign = "baseline");
}

module launcher(b = cam_angle, lt = lip_thickness) {
    g = bend(b)[1];
    block_width = half_width(b, lt) - recess - g;
    x_mid = x_block + block_length / 2;
    y_mid = g + block_width / 2;
    size = min(0.38 * block_length, 0.3 * block_width);
    difference() {
        linear_extrude(height) launcher_2d(b, lt);
        union() for (m = [0, 1]) mirror([0, m, 0]) grooves(b, lt);
        // settings on top: two lines on each block
        if (labels) union() {
            label(str("c", b), [x_block + 0.75 * block_length, y_mid], size, height - label_depth);
            label(str("t", lt), [x_block + 0.25 * block_length, y_mid], size, height - label_depth);
            label(str("L", lip_length), [x_block + 0.75 * block_length, -y_mid], size, height - label_depth);
            label(str("h", hold), [x_block + 0.25 * block_length, -y_mid], size, height - label_depth);
            // version below
            label(version, [x_mid, -y_mid], min(0.6 * block_length, 0.5 * block_width), -1, true);
        }
        // logo below, read from below
        if (logo)
            translate([x_mid, y_mid, 0]) rotate(-90) mirror([0, 0, 1]) mirror([1, 0, 0])
                logo_cut(min(0.9 * block_width, 1.15 * block_length));
    }
}

module disc() {
    t = disc_thickness;
    difference() {
        rotate_extrude($fn = 128)
            polygon([[0, 0], [R - bevel, 0], [R, (t - rim_land) / 2], [R, (t + rim_land) / 2], [R - bevel, t], [0, t]]);
        if (logo) mirror([0, 0, 1]) mirror([1, 0, 0]) logo_cut(0.6 * 2 * (R - bevel));
    }
}

function plate_variants() = [for (lt = plate_lip_thicknesses) for (b = plate_cam_angles) [b, lt]];

module plate() {
    variants = plate_variants();
    columns = len(plate_cam_angles);
    w = max([for (v = variants) half_width(v[0], v[1])]);
    pitch = [x_front - x_rear + 4, 2 * w + 4];
    for (i = [0 : len(variants) - 1])
        translate([floor(i / columns) * pitch[0], i % columns * pitch[1], 0])
            launcher(variants[i][0], variants[i][1]);
    for (i = [0 : 1 : plate_discs - 1])
        translate([x_rear + R + i * (2 * R + 3), -w - R - 3, 0]) disc();
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

// ---- views ----
echo(str("disc: ", disc_diameter, " x ", disc_thickness, " mm, ", fixed(disc_mass), " g"));
if (part == "plate") {
    for (v = plate_variants()) report(v[0], v[1]);
    plate();
} else if (part == "launcher") {
    report(cam_angle, lip_thickness);
    launcher();
} else if (part == "disc") {
    disc();
} else if (part == "assembly") {
    report(cam_angle, lip_thickness);
    color("Gainsboro") launcher();
    color("Orange") translate([0, 0, (height - disc_thickness) / 2]) disc();
}
