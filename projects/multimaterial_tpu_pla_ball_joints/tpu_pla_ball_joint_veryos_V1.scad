// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// TPU + PLA ball joint V1: small ball joints for multi-material FDM printing,
// for figures put together from parts. Standalone, no libraries. Millimetres, degrees.
//
// The ball and the seat it rests in are PLA, so the joint stays where it is put.
// TPU is the spring that holds it there. TPU stretches and bends but hardly gets
// smaller (it is nearly incompressible), so every TPU part here has a free side to
// give way to, instead of a thin layer squeezed between two hard parts.
//   lip      - PLA cup up to the ball's equator, a TPU lip on its rim reaches over
//              the ball and pulls it into the cup.
//   ring     - PLA cup split into fingers by slits, a TPU ring on the fingers' tips
//              holds them together, as a rubber band would.
//   tpu_ball - TPU skin on a PLA ball, the socket all PLA: only the ball needs TPU.
// material = pla or tpu gives one filament's bodies, to export them one by one; the
// webapp in webapp/ puts both into one 3MF with the filaments set.
// Print the sockets mouth up and the balls standing on their foot, no support.
//
// In other models: use <tpu_pla_ball_joint_veryos_V1.scad>, then joint_ball(),
// joint_socket() and joint_socket_space(), all centred on the ball's centre.
// $material = "pla" or "tpu" set in the calling file picks one filament.

/* [1 - Start here] */
part = "print"; // [print:Socket and ball as printed,test:Test - three sockets in squeeze steps and three balls,socket:Socket,ball:Ball,strip:The test's three sockets alone,assembly:Ball in socket - cut open,types:All three types - cut open]
type = "lip"; // [lip:Lip - TPU lip on a PLA cup,ring:Ring - slit PLA cup held by a TPU ring,tpu_ball:TPU ball - TPU skin on the ball - socket all PLA]
// pla or tpu: only that filament's bodies, to export them one by one. both: all, in colour.
material = "both"; // [both,pla,tpu]
// Diameter of the ball.
ball = 6; // [3:0.5:16]

/* [2 - Fit] */
// Between the PLA ball and its PLA seat, per side. The TPU part holds the ball against the seat.
clearance = 0.1; // [0:0.05:0.4]
// The test's sockets: squeeze less this, squeeze, squeeze plus this.
test_step = 0.1; // [0.05:0.05:0.2]
// Layer height of the print: faces between PLA and TPU lie on its layers.
layer = 0.2; // [0.1:0.02:0.3]

/* [3 - Shape] */
// Neck's diameter as a share of the ball's: thinner moves further, thicker is stronger.
neck = 0.5; // [0.35:0.05:0.7]
// PLA around the seat (lip, tpu_ball).
wall = 1; // [0.8:0.2:3]
// PLA under the seat (lip, tpu_ball).
floor_min = 1; // [0.6:0.2:3]

/* [4 - Lip] */
// How far the lip reaches over the ball: latitude of its top above the equator.
lip_wrap = 30; // [15:1:45]
// The lip's inside is smaller than the ball by this, per side.
lip_squeeze = 0.2; // [0:0.05:0.5]
// TPU, at least two lines.
lip_thickness = 0.8; // [0.6:0.1:2]

/* [5 - Ring] */
ring_wrap = 30; // [15:1:45]
// The cup is smaller than the ball by this, per side: the fingers stay bent open by it.
ring_squeeze = 0.1; // [0:0.05:0.4]
slits = 4; // [3:1:8]
slit_width = 0.4; // [0.3:0.05:1]
// PLA fingers' thickness; the squeeze adds to it, the outside stays.
finger = 0.8; // [0.6:0.1:2]
// TPU ring on the fingers' tips.
ring_height = 1.2; // [0.6:0.2:3]
// Slits reach this far below the cup's bottom: longer fingers bend with less strain.
slit_below = 1.5; // [0:0.25:4]

/* [6 - TPU ball] */
// TPU over the PLA core.
skin = 1; // [0.6:0.1:2]
tpu_ball_wrap = 20; // [10:1:35]
// The socket's mouth is smaller than the ball by this, per side.
tpu_ball_squeeze = 0.15; // [0:0.05:0.5]

/* [7 - Logo] */
logo = true;

/* [Hidden] */
version = "V1";
$fn = 64;
$squeeze_step = 0;          // the test's sockets add -test_step, 0, test_step
lead = 0.3;                 // 45 degree chamfer at the mouth
key = 0.8;                  // ring: the TPU reaches this far down into the slits
ring_base = 1.6;            // ring: solid PLA under the slits, above the flange
socket_foot = 1.2;          // flange around a socket's bottom, and the strip's plate, at most
foot_h = 1.6;               // a ball's foot
chamfer = 0.4;              // feet's bottom edge, against the first layer's squish
logo_depth = 0.4;
text_depth = 0.4;
gap = 4;                    // between parts on the bed
pla_colour = "Gainsboro";
tpu_colour = "DarkOrange";
label_font = "Liberation Sans:style=Bold";
types = ["lip", "ring", "tpu_ball"];

// ---- sizes ----
// Socket sizes are measured from the ball's centre; base() is the centre's height
// above the socket's bottom.
function mat() = is_undef($material) ? material : $material;
function show(m) = mat() == "both" || mat() == m;
function on_layer(z) = ceil(z / layer - 0.001) * layer;
function r_(d) = d / 2;
function wrap(t) = t == "lip" ? lip_wrap : t == "ring" ? ring_wrap : tpu_ball_wrap;
function squeeze(t) = (t == "lip" ? lip_squeeze : t == "ring" ? ring_squeeze : tpu_ball_squeeze) + $squeeze_step;
// sphere of the seat below the equator, and of the part that holds above it
function seat_r(t, d) = t == "ring" ? r_(d) - squeeze(t) : r_(d) + clearance;
function hold_r(t, d) = r_(d) - squeeze(t);
// the ring's fingers get thicker with the squeeze, its outside stays
function outer_r(t, d) = t == "ring" ? r_(d) + finger : r_(d) + clearance + wall;
// the floor under the seat puts the equator, where lip and cup meet, on a layer
function base(t, d) = on_layer((t == "ring" ? ring_base + slit_below : floor_min) + seat_r(t, d));
function top(t, d) = hold_r(t, d) * sin(wrap(t));
function mouth_r(t, d) = hold_r(t, d) * cos(wrap(t));
// ring: the fingers' tips, where the TPU ring starts, on a layer
function crown(t, d) = max(0, on_layer(base(t, d) + top(t, d) - ring_height) - base(t, d));
function neck_r(d) = neck * d / 2;
// The mouth's edge, where the lead chamfer meets the sphere: [radius, height].
function edge(t, d) = let(a = mouth_r(t, d) + lead, h = top(t, d), r = hold_r(t, d),
    s = ((a + h) - sqrt(pow(a + h, 2) - 2 * (a * a + h * h - r * r))) / 2) [a - s, h - s];
// how far the ball tilts each way before the neck meets the mouth's edge
function tilt(t, d) = 90 - atan2(edge(t, d)[1], edge(t, d)[0]) - asin(neck_r(d) / norm(edge(t, d)));
// The socket's farthest point from the centre above the cup's bottom; a ball's neck is longer.
function reach(t, d) = norm([t == "lip" ? max(outer_r(t, d), hold_r(t, d) + lip_thickness) : outer_r(t, d), top(t, d)]);
function neck_length(t, d) = reach(t, d) + 0.6 - sqrt(pow(r_(d), 2) - pow(neck_r(d), 2));
function socket_r(t, d) = outer_r(t, d) + 1.5;
// The flange stays a layer below the cup's bottom, so that the two never share a face.
function flange_h(t, d) = min(socket_foot, floor((base(t, d) - seat_r(t, d) - layer) / layer + 0.001) * layer);
function ball_foot_r(d) = max(r_(d) + 2, 5);
function fixed(x, n = 1) = round(x * pow(10, n)) / pow(10, n);

// ---- the joint, centred on the ball's centre ----
// Ball with its neck reaching neck_l below the ball: PLA, and for tpu_ball a TPU skin.
module joint_ball(t = type, d = ball, neck_l = undef) {
    if (show("pla")) color(pla_colour) ball_pla(t, d, neck_l);
    if (t == "tpu_ball" && show("tpu")) color(tpu_colour) ball_tpu(t, d);
}

// Socket, mouth up: the cup and what holds the ball in it.
module joint_socket(t = type, d = ball) {
    if (show("pla")) color(pla_colour) socket_pla(t, d);
    if (t != "tpu_ball" && show("tpu")) color(tpu_colour) socket_tpu(t, d);
}

// Room the socket needs in a part it is built into: subtract it, then add joint_socket().
// It keeps the lip free to stretch and leaves a cone for the neck's swing.
module joint_socket_space(t = type, d = ball, depth = 20) {
    e = edge(t, d);
    rotate_extrude() union() {
        translate([0, -base(t, d)]) square([outer_r(t, d), base(t, d) + (t == "lip" ? 0.01 : top(t, d))]);
        if (t == "lip") square([hold_r(t, d) + lip_thickness + 0.6, top(t, d) + 0.6]);
        polygon([[0, 0], e, [e[0] + depth * tan(tilt(t, d) + 5), e[1] + depth], [0, e[1] + depth]]);
    }
}

module ball_pla(t, d, neck_l) {
    l = (is_undef(neck_l) ? neck_length(t, d) : neck_l) + sqrt(pow(r_(d), 2) - pow(neck_r(d), 2));
    rotate_extrude() intersection() {
        union() {
            disc_(t == "tpu_ball" ? r_(d) - skin : r_(d));
            translate([0, -l]) square([neck_r(d), l]);
        }
        translate([0, -l - 1]) square([r_(d) + 1, l + r_(d) + 2]);
    }
}

// The skin is the ball less the PLA, as a 3D cut: a lone rotate_extrude that touches the axis
// keeps zero-area triangles at the pole under Manifold.
module ball_tpu(t, d) {
    difference() {
        rotate_extrude() intersection() {
            disc_(r_(d));
            translate([0, -r_(d) - 1]) square([r_(d) + 1, d + 2]);
        }
        ball_pla(t, d);
    }
}

module socket_pla(t, d) {
    difference() {
        rotate_extrude() if (t == "ring") intersection() {
            socket_profile(t, d);
            translate([0, -base(t, d) - 1]) square([outer_r(t, d) + 1, base(t, d) + 1 + crown(t, d)]);
        } else socket_profile(t, d);
        if (t == "ring") slit_cuts(t, d, ring_base - base(t, d), top(t, d) + 1);
    }
}

// The ring and its keys in the slits are cut from the socket in one cut: two pieces of the
// same revolved solid, unioned, keep zero-area triangles along their shared sphere under Manifold.
module socket_tpu(t, d) {
    // render(): in the preview the cut faces flicker against the PLA's otherwise
    if (t == "ring") render() intersection() {
        rotate_extrude() socket_profile(t, d);
        union() {
            o = outer_r(t, d) + 1;
            translate([-o, -o, crown(t, d)]) cube([2 * o, 2 * o, top(t, d) + 1]);
            slit_cuts(t, d, crown(t, d) - key, crown(t, d) + layer / 2);
        }
    }
    if (t == "lip") rotate_extrude() difference() {
        intersection() {
            disc_(hold_r(t, d) + lip_thickness);
            square([hold_r(t, d) + lip_thickness + 1, top(t, d)]);
        }
        disc_(hold_r(t, d));
        mouth_lead(t, d);
    }
}

// Half section in the x z plane, x >= 0: the socket as one solid, before any material split.
// The lip type's cup ends at the equator, the lip goes on top.
module socket_profile(t, d) {
    difference() {
        translate([0, -base(t, d)]) square([outer_r(t, d), base(t, d) + (t == "lip" ? 0 : top(t, d))]);
        intersection() {
            disc_(seat_r(t, d));
            translate([0, -seat_r(t, d) - 1]) square([seat_r(t, d) + 1, seat_r(t, d) + 1]);
        }
        disc_(hold_r(t, d));
        mouth_lead(t, d);
    }
}

// Circle turned half a corner, so that none of its corners lies next to the axis: clipped at
// x = 0 it ends exactly on the axis. A corner 1e-16 off it gives a fan of zero-area triangles.
module disc_(r) {
    rotate(180 / $fn) circle(r);
}

module mouth_lead(t, d) {
    a = mouth_r(t, d);
    h = top(t, d);
    polygon([[0, h + 1], [a + lead + 1, h + 1], [a + lead, h], [a, h - lead], [0, h - lead]]);
}

// The ring's slits as solids between z0 and z1, turned half a slit's angle off the x axis
// so that a section in the x z plane goes through a finger.
module slit_cuts(t, d, z0, z1) {
    union() for (i = [0 : slits - 1]) rotate(180 / slits + i * 360 / slits)
        translate([0, -slit_width / 2, z0]) cube([outer_r(t, d) + 1, slit_width, z1 - z0]);
}

// ---- parts as printed, standing on z = 0 ----
// Socket on a flange, the logo under it.
module socket_part(t = type, d = ball) {
    f = flange_h(t, d);
    if (show("pla")) color(pla_colour) difference() {
        union() {
            above(f / 2, 2 * socket_r(t, d) + base(t, d) + top(t, d)) translate([0, 0, base(t, d)]) socket_pla(t, d);
            foot(socket_r(t, d), f);
        }
        if (logo) logo_under(1.4 * socket_r(t, d));
    }
    if (show("tpu")) color(tpu_colour) translate([0, 0, base(t, d)]) socket_tpu(t, d);
}

// Ball standing on its neck on a foot, the logo under it.
module ball_part(t = type, d = ball) {
    l = neck_length(t, d);
    z = foot_h + l + sqrt(pow(r_(d), 2) - pow(neck_r(d), 2));
    if (show("pla")) color(pla_colour) difference() {
        union() {
            translate([0, 0, z]) ball_pla(t, d, l + 0.01);
            foot(ball_foot_r(d), foot_h);
        }
        if (logo) logo_under(1.4 * ball_foot_r(d));
    }
    if (t == "tpu_ball" && show("tpu")) color(tpu_colour) translate([0, 0, z]) ball_tpu(t, d);
}

function ball_centre(t, d) = foot_h + neck_length(t, d) + sqrt(pow(r_(d), 2) - pow(neck_r(d), 2));

// The children above z, within s of the z axis and below s: a part's foot or plate alone
// ends on the bed, two solids that both end there give zero-area triangles under Manifold.
// Not a huge cutter: the preview frames the view on it.
module above(z, s) {
    intersection() {
        children();
        translate([-s, -s, z]) cube([2 * s, 2 * s, s]);
    }
}

// Disc of radius r, h high, its bottom edge chamfered.
module foot(r, h) {
    rotate_extrude() polygon([[0, 0], [r - chamfer, 0], [r, chamfer], [r, h], [0, h]]);
}

// Logo, width wide, engraved into the face on z = 0 and read from below.
module logo_under(width) {
    mirror([0, 0, 1]) mirror([1, 0, 0]) logo_cut(width);
}

// The test's three sockets on a plate, squeeze less test_step, squeeze, squeeze plus
// test_step from left to right, each value engraved in front of its socket.
module strip(t = type, d = ball) {
    o = outer_r(t, d);
    pitch = 2 * o + gap;
    w = 2 * o + 6;
    f = min([for (i = [-1 : 1]) let($squeeze_step = i * test_step) flange_h(t, d)]);
    if (show("pla")) color(pla_colour) difference() {
        union() {
            above(f / 2, 2 * pitch + base(t, d) + top(t, d)) union() for (i = [-1 : 1]) let($squeeze_step = i * test_step)
                translate([i * pitch, 0, base(t, d)]) socket_pla(t, d);
            translate([-1.5 * pitch, -o - 5, 0]) plate([3 * pitch, w, f]);
        }
        union() for (i = [-1 : 1]) translate([i * pitch, -o - 2.6, f - text_depth]) linear_extrude(1)
            text(str(squeeze(t) + i * test_step), size = 2.6, font = label_font, halign = "center", valign = "center");
        if (logo) translate([-pitch, -2, 0]) logo_under(min(2 * o + 2, w - 3));
        translate([pitch, -2, 0]) mirror([0, 0, 1]) mirror([1, 0, 0]) translate([0, 0, -text_depth])
            linear_extrude(1) text(version, size = 2.6, font = label_font, halign = "center", valign = "center");
    }
    if (show("tpu")) color(tpu_colour)
        for (i = [-1 : 1]) let($squeeze_step = i * test_step)
            translate([i * pitch, 0, base(t, d)]) socket_tpu(t, d);
}

// Rectangle s[0] x s[1], s[2] high, from the origin, its bottom edge chamfered.
module plate(s) {
    hull() for (x = [chamfer, s[0] - chamfer], y = [chamfer, s[1] - chamfer]) translate([x, y, 0]) {
        cylinder(r1 = 0.01, r2 = chamfer, h = chamfer, $fn = 16);
        cylinder(r = chamfer, h = s[2], $fn = 16);
    }
}

// ---- views ----
module print_parts(t = type, d = ball) {
    translate([-socket_r(t, d) - gap / 2, 0, 0]) socket_part(t, d);
    translate([ball_foot_r(d) + gap / 2, 0, 0]) ball_part(t, d);
}

module test_parts(t = type, d = ball) {
    o = outer_r(t, d);
    pitch = 2 * o + gap;
    strip(t, d);
    for (i = [-1 : 1]) translate([i * pitch, o + 1 + gap + ball_foot_r(d), 0]) ball_part(t, d);
}

// Ball in its socket, the near half cut away; one colour per material.
module assembly(t = type, d = ball) {
    for (m = ["pla", "tpu"]) if (show(m)) let($material = m)
        color(m == "pla" ? pla_colour : tpu_colour) render() intersection() {
            s = 2 * (socket_r(t, d) + ball_centre(t, d));
            translate([-s / 2, 0, -1]) cube(s);
            union() {
                socket_part(t, d);
                translate([0, 0, base(t, d)]) rotate([180, 0, 0])
                    translate([0, 0, -ball_centre(t, d)]) ball_part(t, d);
            }
        }
}

module all_types(d = ball) {
    pitch = 2 * socket_r("lip", d) + 3 * gap;
    for (i = [0 : 2]) translate([(i - 1) * pitch, 0, 0]) {
        assembly(types[i], d);
        color("Black") translate([0, 0, -2]) rotate([90, 0, 0]) linear_extrude(0.1)
            text(types[i], size = 2.4, font = label_font, halign = "center", valign = "top");
    }
}

// ---- report ----
module report(t, d) {
    e = edge(t, d);
    r = r_(d);
    echo(str(t, ": ball ", d, ", neck ", fixed(2 * neck_r(d), 2), ", socket ", fixed(2 * outer_r(t, d), 2),
        " across, ", fixed(base(t, d) + top(t, d), 2), " high, mouth ", fixed(2 * e[0], 2),
        ", tilts ", fixed(tilt(t, d), 0), " degrees each way"));
    if (e[0] >= r) echo(str("WARNING: the mouth is not smaller than the ball, nothing holds it"));
    if (t == "lip") echo(str("lip: ", fixed(100 * squeeze(t) / hold_r(t, d)), " % stretched at rest, ",
        fixed(100 * (r - e[0]) / e[0]), " % to let the ball through"));
    if (t == "ring") let(l = crown(t, d) + base(t, d) - ring_base,
            open = r - sqrt(pow(hold_r(t, d), 2) - pow(crown(t, d), 2)))
        echo(str("ring: fingers ", fixed(l), " long, bent open ", fixed(squeeze(t), 2), " at rest, strain ",
            fixed(150 * finger * squeeze(t) / (l * l), 2), " %; to let the ball through ", fixed(open, 2),
            ", strain ", fixed(150 * finger * open / (l * l), 2), " % (PLA yields near 2), the TPU ring stretches ",
            fixed(100 * (r - e[0]) / e[0]), " %"));
    if (t == "tpu_ball") echo(str("tpu_ball: the mouth presses ", fixed(squeeze(t), 2), " into the ", skin,
        " skin at rest, ", fixed(r - e[0], 2), " (", fixed(100 * (r - e[0]) / skin, 0), " %) to let the ball through"));
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

// ---- main ----
if (part == "types") for (t = types) report(t, ball);
else report(type, ball);

if (part == "print") print_parts();
else if (part == "test") test_parts();
else if (part == "socket") socket_part();
else if (part == "ball") ball_part();
else if (part == "strip") strip();
else if (part == "assembly") assembly();
else if (part == "types") all_types();
