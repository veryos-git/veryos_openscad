// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Disc launcher V1: a disc and a one-piece launcher that shoots it when its two
// arms are squeezed. Standalone, no libraries. Millimetres, newtons, degrees.
// Print everything flat as it lies, no support.
//
// How it works, see readme.md for the formulas:
//   - Two cams behind the disc's widest point form a V. Squeezing the arms closes
//     the V and pushes the disc forward, if the cams are steeper than the friction
//     angle atan(friction).
//   - Two noses on thin lips sit in front of the widest point and hold the disc.
//     The closing arms bend the lips open over the disc, the lips store that work
//     and fling the disc once they are more than the friction angle behind its
//     widest point. So: squeeze until the arms touch.
// model() works this out for each launcher and the script echoes the numbers.

/* [1 - Start here] */
part = "plate"; // [plate:All launchers of the plate and the discs for one print,launcher:One launcher with the settings below,disc:Disc,assembly:Launcher with a loaded disc]

/* [2 - Launcher settings] */
// Angle of the cams to the launch direction. Steeper: works with more friction, needs more squeeze travel.
cam_angle = 34; // [28:1:42]
// Thickness of the two lips that hold and fling the disc. Thicker: harder squeeze, faster disc, more strain.
lip_thickness = 1.0; // [0.8:0.1:1.6]
// How far each nose reaches in over the disc's edge: the mouth is 2 x hold narrower than the disc.
hold = 0.5; // [0.2:0.1:1]
// Letter engraved in the launcher's end, to tell the launchers of a plate apart.
label = "B";

/* [3 - Plate: one launcher per cam angle and lip thickness] */
plate_cam_angles = [30, 34, 38];
plate_lip_thicknesses = [1.0, 1.2];
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
height = 5; // [4:0.2:10]
// Lip from the finger pad to the nose.
lip_length = 32; // [20:1:50]
// Finger pads, one on each arm.
pad_length = 12; // [8:1:20]
// Thin part of each arm between the end block and the pad: the hinge.
flexure_length = 20; // [10:1:40]
flexure_thickness = 1.6; // [1.2:0.2:3]
// Arm from the pad to the cam.
jaw_thickness = 2.4; // [1.6:0.2:4]
// Block that joins the arms, with the letter on top and the logo below.
rear_length = 10; // [8:1:20]
logo = true;

/* [7 - Fits] */
// Play of the loaded disc between the cams and the noses.
play = 0.1; // [0:0.05:0.5]
// Room above and below the disc's band in the grooves.
z_clearance = 0.2; // [0.1:0.1:0.6]
// Radius of the noses where the disc touches them, and the collar around their groove.
nose_radius = 1.0; // [0.8:0.1:2]
nose_collar = 0.4; // [0.2:0.1:0.8]

/* [Hidden] */
$fn = 64;
eps = 0.01;
// Rounding of the inner corners. Slots must stay wider than twice this.
fillet = 0.4;
lip_slot = 1.2;             // between the lip's root and the arm
lip_gap = 2 * fillet + 0.2; // between the lip and the cam's outer corner
nose_gap = 2 * fillet + 0.2;// between the cam's end and the nose pushed out
bend_back = 0.4;            // the cam starts this far behind the resting disc
cam_end_thickness = 1.4;
lip_past = 2.0;             // the lip ends this far in front of the nose
label_depth = 0.4;
logo_depth = 0.4;

// ---- geometry: one arm, y > 0, the loaded disc's centre on the origin, +x is forward ----
R = disc_diameter / 2;
Rn = R + nose_radius;
// The nose's centre: `hold` inside the disc's widest point, touching the disc with `play`.
yn = Rn - hold;
xn = sqrt(pow(Rn + play, 2) - yn * yn);
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

x_pad1 = xn - lip_length;
x_pad0 = x_pad1 - pad_length;
x_flex0 = x_pad0 - flexure_length;
x_rear = x_flex0 - rear_length;

function lip_root(b, lt) = [x_pad1, bend(b)[1] + jaw_thickness + lip_slot + lt / 2];
// The lip is straight and passes the cam's outer corner at lip_gap.
function lip_slope(b, lt, c) = (cam_corner(b)[1] + c - lip_root(b, lt)[1]) / (cam_corner(b)[0] - x_pad1);
function lip_end(b, lt) =
    let (c0 = lip_gap + lt / 2, c = c0 / cos(atan(lip_slope(b, lt, c0))), x = xn + lip_past)
    [x, lip_root(b, lt)[1] + lip_slope(b, lt, c) * (x - x_pad1)];

// ---- model: what holds the disc and what launches it ----
function rad(a) = a * PI / 180;
function deg(a) = a * 180 / PI;
function sum(v, i = 0) = i >= len(v) ? 0 : v[i] + sum(v, i + 1);

disc_volume = PI * R * R * disc_thickness
    - 2 * PI * (R - bevel / 3) * bevel * (disc_thickness - rim_land) / 2;
disc_mass = disc_volume * density / 1000; // g

// The arm turns about the middle of its flexure.
x_pivot = x_flex0 + flexure_length / 2;
arm_pad = x_pad0 + pad_length / 2 - x_pivot;
arm_nose = xn - x_pivot;
function arm_cam(b) = -R * sin(b) - x_pivot;
// The arms can close until the two bends meet.
function turn_max(b) = deg(bend(b)[1] / (bend(b)[0] - x_pivot));
flexure_stiffness = e_modulus * height * pow(flexure_thickness, 3) / 12 / flexure_length; // N mm per rad
function lip_stiffness(lt) = e_modulus * height * pow(lt, 3) / (4 * pow(lip_length, 3));
// A bent lip turns at its tip, about a point 2/3 of its length behind: the nose moves forward too.
function nose_drift(b, lt) =
    let (c = lip_end(b, lt) - 2 / 3 * (lip_end(b, lt) - lip_root(b, lt)))
    (c[1] - yn) / (xn - c[0]);

// Turn of the arm, in degrees, that lays the cam on a disc x in front of its rest.
// On the cam: sin(b - turn) = sin(b) exp(-x / arm). Past its end the corner pushes.
function turn_cam(x, b) = b - asin(sin(b) * exp(-x / arm_cam(b)));
function on_cam(x, b) = x - R * sin(b - turn_cam(x, b)) <= groove_end(b)[0];
function turn_corner(x, b) =
    let (g = groove_end(b))
    deg((g[1] - sqrt(max(0, R * R - pow(x - g[0], 2)))) / (g[0] - x_pivot));
function turn(x, b) = on_cam(x, b) ? turn_cam(x, b) : turn_corner(x, b);
function cam_now(x, b) = on_cam(x, b) ? b - turn_cam(x, b) : asin(min(1, (x - groove_end(b)[0]) / R));
// How far the disc pushes the nose out, the arm's nose `closed` nearer to the axis.
function lip_bend(x, closed, k) =
    let (a = xn - x, c = yn - closed, p = a * k + c,
         d = p * p - (1 + k * k) * (a * a + c * c - Rn * Rn))
    d <= 0 ? 0 : max(0, (sqrt(d) - p) / (1 + k * k));
// Angle of the nose behind the disc's widest point; negative: in front, it holds.
function nose_angle(x, u, k) = asin(max(-1, min(1, (x - xn - k * u) / Rn)));

// [state, friction angle, hold N, squeeze N per finger, pad travel, cam travel, cam travel left,
//  lip bend, lip strain %, flexure strain %, lip energy mJ, fling mJ, speed m/s]
function model(b, lt, mu = friction, n = 400) =
    let (phi = atan(mu), k = nose_drift(b, lt), kl = lip_stiffness(lt), dx = (xn + Rn) / n,
         rows = [for (i = [0 : n])
             let (x = i * dx, t = turn(x, b), u = lip_bend(x, rad(t) * arm_nose, k),
                  a = nose_angle(x, u, k), beta = cam_now(x, b),
                  drag = kl * u * tan(phi - a),
                  push = drag <= 0 ? 0 : beta > phi ? drag / tan(beta - phi) : 1e9)
             [x, t, beta, u, a,
              (push * arm_cam(b) + kl * u * arm_nose + flexure_stiffness * rad(t)) / arm_pad]],
         // the lips take over where they are the friction angle behind the widest point
         run = [for (i = [0 : n]) if (rows[i][4] >= phi) i],
         last = len(run) == 0 ? n : run[0],
         before = [for (i = [0 : last]) rows[i]],
         t_run = before[last][1],
         u_max = max([for (r = before) r[3]]),
         state = len(run) == 0 ? "no launch"
             : min([for (r = before) r[2]]) <= phi + 0.5 ? "jams: friction"
             : t_run > turn_max(b) ? "jams: arms touch first" : "ok",
         closed = rad(t_run) * arm_nose,
         fling = dx * sum([for (i = [last : n])
             let (x = i * dx, u = lip_bend(x, closed, k))
             2 * kl * u * tan(nose_angle(x, u, k) - phi)]),
         hold_force = max([for (i = [0 : n])
             let (x = i * dx, u = lip_bend(x, 0, k))
             x > xn ? 0 : 2 * kl * u * tan(phi - nose_angle(x, u, k))]))
    [state, phi, hold_force, max([for (r = before) r[5]]), rad(t_run) * arm_pad,
     rad(t_run) * arm_cam(b), rad(turn_max(b) - t_run) * arm_cam(b), u_max,
     150 * lt * u_max / pow(lip_length, 2),
     // twice the mean of a flexure bent by a moment: the force at its end adds to the root
     100 * flexure_thickness * rad(t_run) / flexure_length,
     kl * pow(before[last][3], 2), fling, sqrt(max(0, 2 * fling / disc_mass))];

// Friction range in which the model launches, in steps of 0.05.
function friction_range(b, lt) =
    let (ok = [for (mu = [0.1 : 0.05 : 0.801]) if (model(b, lt, mu, 200)[0] == "ok") mu])
    len(ok) == 0 ? [0, 0] : [ok[0], ok[len(ok) - 1]];

function fixed(x, d = 2) = let (p = pow(10, d)) round(x * p) / p;

module report(name, b, lt) {
    m = model(b, lt);
    range = friction_range(b, lt);
    echo(str("launcher ", name, ": cam ", b, " deg, lip ", lt, " mm | ", m[0],
             " at friction ", friction, " (friction angle ", fixed(m[1], 1), " deg)",
             " | hold ", fixed(m[2], 3), " N = ", fixed(m[2] / (disc_mass * 0.00981), 1), " x the disc's weight",
             " | squeeze ", fixed(m[3], 1), " N per finger, pads ", fixed(m[4], 1), " mm each",
             " | cams close ", fixed(m[5], 1), " mm each, ", fixed(m[6], 1), " mm left",
             " | lips bend ", fixed(m[7], 1), " mm, strain ", fixed(m[8]), " %, flexure ", fixed(m[9]), " %",
             " | lips store ", fixed(m[10], 1), " mJ, fling ", fixed(m[11], 1), " mJ, about ", fixed(m[12], 1), " m/s",
             " | launches from friction ", range[0], " to ", range[1]));
    if (m[0] != "ok")
        echo(str("WARNING launcher ", name, ": ", m[0], " at friction ", friction));
    if (m[8] > strain_max || m[9] > strain_max)
        echo(str("WARNING launcher ", name, ": strain above strain_max = ", strain_max, " %"));
}

// ---- checks ----
assert(height / 2 - groove_half - groove_depth * tan(rim_angle) >= 0.4,
       str("height is too small for this disc's edge: at least ",
           2 * (groove_half + groove_depth * tan(rim_angle) + 0.4), "."));
assert(nose_collar <= groove_depth, "nose_collar must not be more than the cams' groove is deep.");
assert(lip_slot > 2 * fillet, "lip_slot must be wider than twice the fillet.");

// ---- parts ----
module arm_2d(b, lt) {
    g = bend(b)[1];
    root = lip_root(b, lt);
    tip = lip_end(b, lt);
    assert(g > 2, "The arms are too close: lower cam_angle.");
    assert(cam_corner(b)[0] - x_pad1 > 5 && cam_length(b) > bend_back + 1,
           "The lip is too short for this cam: raise lip_length.");
    // flexure, pad, arm to the cam
    translate([x_flex0 - eps, g]) square([flexure_length + 2 * eps, flexure_thickness]);
    translate([x_pad0, g]) square([pad_length, root[1] + lt / 2 - g]);
    translate([x_pad1 - eps, g]) square([bend(b)[0] - x_pad1 + eps, jaw_thickness]);
    // cam
    polygon([bend(b), cam_end(b), cam_corner(b), bend(b) + jaw_thickness * nc(b)]);
    // lip, and the nose on its end
    hull() {
        translate(root) circle(d = lt);
        translate(tip) circle(d = lt);
    }
    hull() {
        translate(tip) circle(d = lt);
        translate([xn, yn]) circle(r = nose_out);
    }
}

// Groove for the disc's edge, seen along it: x into the wall, y up, from `out` in front of the wall.
module groove_2d(depth, out = 0.3) {
    polygon([[-out, -groove_half - (depth + out) * tan(rim_angle)], [depth, -groove_half],
             [depth, groove_half], [-out, groove_half + (depth + out) * tan(rim_angle)]]);
}

module grooves(b, lt) {
    tip = lip_end(b, lt);
    // along the cam
    translate([bend(b)[0], bend(b)[1], height / 2]) rotate(b) translate([-1, 0, 0])
        rotate([90, 0, 90]) linear_extrude(cam_length(b) + 2) groove_2d(groove_depth);
    // around the nose, on the side away from the lip; turned half a facet, so that its
    // edges do not run along the nose's
    translate([xn, yn, height / 2]) intersection() {
        rotate(180 / $fn) rotate_extrude() translate([nose_out, 0]) mirror([1, 0]) groove_2d(nose_collar);
        rotate(atan2(tip[1] - yn, tip[0] - xn))
            translate([-2 * nose_out, -2 * nose_out, -height]) cube([2 * nose_out + 0.2, 4 * nose_out, 2 * height]);
    }
}

module launcher(b = cam_angle, lt = lip_thickness, name = label) {
    w = bend(b)[1] + flexure_thickness;
    x_mid = x_rear + rear_length / 2;
    difference() {
        linear_extrude(height) offset(r = -fillet) offset(delta = fillet) union() {
            translate([x_rear, -w]) square([rear_length, 2 * w]);
            for (m = [0, 1]) mirror([0, m]) arm_2d(b, lt);
        }
        union() for (m = [0, 1]) mirror([0, m, 0]) grooves(b, lt);
        // letter on top, read with the disc's end up
        translate([x_mid, 0, height - label_depth]) linear_extrude(label_depth + 1)
            rotate(-90) text(name, size = min(0.6 * rear_length, 1.2 * w), halign = "center", valign = "center");
        // logo below, read from below
        if (logo)
            translate([x_mid, 0, 0]) rotate(-90) mirror([0, 0, 1]) mirror([1, 0, 0])
                logo_cut(min(1.5 * w, 1.1 * rear_length));
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

module plate() {
    variants = [for (lt = plate_lip_thicknesses) for (b = plate_cam_angles) [b, lt]];
    columns = len(plate_cam_angles);
    half_width = max([for (v = variants) lip_end(v[0], v[1])[1] + v[1] / 2]);
    front = xn + lip_past + max(plate_lip_thicknesses) / 2;
    pitch = [front - x_rear + 4, 2 * half_width + 3];
    for (i = [0 : len(variants) - 1])
        translate([floor(i / columns) * pitch[0], i % columns * pitch[1], 0])
            launcher(variants[i][0], variants[i][1], chr(65 + i));
    for (i = [0 : 1 : plate_discs - 1])
        translate([x_rear + R + i * (2 * R + 3), -half_width - R - 3, 0]) disc();
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
    variants = [for (lt = plate_lip_thicknesses) for (b = plate_cam_angles) [b, lt]];
    for (i = [0 : len(variants) - 1]) report(chr(65 + i), variants[i][0], variants[i][1]);
    plate();
} else if (part == "launcher") {
    report(label, cam_angle, lip_thickness);
    launcher();
} else if (part == "disc") {
    disc();
} else if (part == "assembly") {
    report(label, cam_angle, lip_thickness);
    color("Gainsboro") launcher();
    color("Orange") translate([0, 0, (height - disc_thickness) / 2]) disc();
}
