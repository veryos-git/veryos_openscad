// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Decorative pillars, after the pictures in inspiration/.
//
// A pillar is a base, a shaft and a capital. There are five shafts (plain,
// fluted, reeded, twisted, lattice) and five orders, each a base and a
// capital (tuscan, ionic, corinthian, egyptian, romanesque). The grid shows
// all 25 pillars: the shafts are the rows, plain in front, and the orders the
// columns, tuscan on the left. The single view shows one of them, to edit and
// export it. Base and capital grow with the diameter; the shaft takes the
// rest of the length.
//
// Print a pillar standing, without support: nothing overhangs more than 45
// degrees. Where a classical form would, it is cut to 45 degrees: the
// underside of each torus, the corners of an abacus over a round capital,
// the volutes under the ionic abacus, the start of each leaf.
// The VeryOS logo is engraved in the front of the base.
// Origin: middle of the base's bottom face. Units: mm.

/* [View] */
view = "grid"; // [grid:All 25 pillars, single:One pillar]

/* [Size] */
// From the bottom of the base to the top of the capital.
length = 200;
// The shaft's diameter at its bottom. Base and capital grow with it.
diameter = 25;

/* [Single pillar] */
shaft = "fluted"; // [plain, fluted, reeded, twisted, lattice]
order = "corinthian"; // [tuscan, ionic, corinthian, egyptian, romanesque]

/* [Shaft] */
// The shaft's diameter at its top, as a fraction of its diameter at the bottom.
taper = 0.85;
// plain: how far the shaft bulges out, a third of the way up, as a fraction of the diameter.
entasis = 0.015;
// fluted: number of flutes.
flutes = 20;
// reeded: number of reeds.
reeds = 12;
// twisted: number of strands.
strands = 4;
// lattice: number of grooves, in each direction.
grooves = 10;
// twisted and lattice: the spirals' angle from vertical at the bottom of the shaft. Up to 45 prints without support.
helix_angle = 40;

/* [Capital] */
// corinthian: leaves in each of its two rows. egyptian: leaves around the bell.
leaves = 8;

/* [Logo] */
logo_depth = 0.6;
// The logo is left out if it would be less high than this.
logo_min_height = 3;

/* [Hidden] */
$fa = 4;
$fs = 0.5;
shafts = ["plain", "fluted", "reeded", "twisted", "lattice"];
orders = ["tuscan", "ionic", "corinthian", "egyptian", "romanesque"];
d = diameter;
r0 = d / 2;
r1 = r0 * taper;
// Distance between the pillars in the grid.
pitch = 2 * d;

// Base and capital are drawn in units of the diameter: R0 and R1 are the
// shaft's radius at its bottom and top. Their round parts are profiles,
// lists of [radius, height] from the bottom up, turned around the axis.
R0 = 0.5;
R1 = R0 * taper;
// The square plinth under every base but the egyptian, and the logo in its
// front.
plinth_w = 1.36;
plinth_h = 0.3;

// Tuscan: a torus on the plinth; astragal, neck, echinus and a square
// abacus. The echinus ends as wide as the abacus' sides; the abacus' corners
// stand on 45 degree slopes from its edge.
tu_base = concat(torus(0.56, 0.3, 0.09), [[0.53, 0.48], [0.53, 0.5]],
                 bezier([0.53, 0.5], [0.5, 0.5], [0.5, 0.53]));
tu_rho = 0.035;
tu_neck = R1 - (sqrt(2) - 1) * tu_rho;
tu_re = 0.55;
tu_e0 = [tu_neck + 0.02, 0.24];
tu_ze = tu_e0[1] + 1.3 * (tu_re - tu_e0[0]);
tu_capital = concat(torus_on(R1, 0, tu_rho), [[tu_neck, 0.2], [tu_neck + 0.02, 0.22], tu_e0],
                    bezier(tu_e0, [tu_re, tu_e0[1] + tu_re - tu_e0[0]], [tu_re, tu_ze]));
tu_c = tu_re * (sqrt(2) - 1);
tu_h = tu_ze + tu_c + 0.1;

// Attic base, for ionic and corinthian: torus, scotia, torus.
attic_base = concat(torus(0.59, 0.3, 0.075), [[0.56, 0.45], [0.56, 0.465]],
                    bezier([0.56, 0.465], [0.5, 0.5], [0.54, 0.54]),
                    torus_on(0.54, 0.55, 0.045), [[0.515, 0.64]],
                    bezier([0.515, 0.64], [0.5, 0.64], [0.5, 0.67]));

// Ionic: astragal and echinus, then a block with a volute on each side, seen
// from the front and the back. The block stands on the echinus' top; under
// the volutes it rises 45 degrees from there. A spiral groove runs into each
// volute from the line under the abacus.
io_rho = 0.03;
io_neck = R1 - (sqrt(2) - 1) * io_rho;
io_re = 0.6;
io_ze = 2 * io_rho + 1.3 * (io_re - io_neck);
io_capital = concat(torus_on(R1, 0, io_rho),
                    bezier([io_neck, 2 * io_rho], [io_re, 2 * io_rho + io_re - io_neck], [io_re, io_ze]));
// Half the block's depth, and how far its bottom reaches out on the echinus.
io_dd = 0.35;
io_xa = sqrt(io_re * io_re - io_dd * io_dd);
// The volutes: radius and centre. Below io_xs they stand on the 45 degree
// slope; heights from the echinus' top.
io_rv = 0.15;
io_xv = 0.56;
io_xs = io_xv + io_rv / sqrt(2);
io_zv = io_xs - io_xa + io_rv / sqrt(2);
io_top = io_zv + io_rv;
io_abacus = [io_xv + io_rv + 0.01, io_dd + 0.05];
io_c = max(io_abacus[0] - io_xs, io_abacus[1] - io_dd);
io_h = io_ze + io_top + io_c + 0.07;

// Corinthian: astragal, then a bell with two rows of leaves, under an abacus
// with concave sides. The abacus' corners stand on 45 degree slopes from the
// bell's rim, as the corner volutes would.
co_rho = 0.03;
co_neck = R1 - (sqrt(2) - 1) * co_rho;
// bell: [bottom, height, bottom radius, top radius]
co_bell = [2 * co_rho, 0.7, co_neck, 0.65];
co_capital = concat(torus_on(R1, 0, co_rho), bell_points(co_bell));
co_w = 0.72;
co_c = co_w * sqrt(2) - co_bell[3];
co_h = co_bell[0] + co_bell[1] + co_c + 0.08;

// Egyptian: a round drum as the base; four bands, a bell with leaves and a
// square block on top, narrower than the bell.
eg_base = concat([[0.75, 0], [0.75, 0.24]],
                 [for (a = [15 : 15 : 90]) [0.69 + 0.06 * cos(a), 0.24 + 0.06 * sin(a)]],
                 [[0.5, 0.3]]);
eg_rho = 0.025;
eg_neck = R1 - (sqrt(2) - 1) * eg_rho;
eg_bell = [0.28, 0.7, eg_neck, 0.72];
eg_capital = concat([for (k = [0 : 3]) each concat(torus_on(R1, 0.07 * k, eg_rho), [[eg_neck, 0.07 * k + 0.07]])],
                    bell_points(eg_bell), [[eg_bell[3], 1.02]]);
eg_block = [0.42, 0.22];
eg_h = 1.02 + eg_block[1];

// Romanesque: a torus with a spur on each corner of the plinth; astragal and
// a cushion capital, a cube cut round by a sphere, and an abacus.
ro_base = concat(torus(0.55, 0.3, 0.1), [[0.52, 0.5], [0.52, 0.52]],
                 bezier([0.52, 0.52], [0.5, 0.52], [0.5, 0.55]));
ro_rho = 0.035;
ro_neck = R1 - (sqrt(2) - 1) * ro_rho;
// The cube's half width; the sphere goes through its top corners. Under the
// sphere's 45 degree circle, a 45 degree cone stands on the astragal.
ro_w = 0.6;
ro_rs = ro_w * sqrt(2);
ro_zt = 2 * ro_rho + (ro_w - ro_neck) + ro_w;
ro_capital = concat(torus_on(R1, 0, ro_rho),
                    [for (a = [45 : -5 : 0]) [ro_rs * cos(a), ro_zt - ro_rs * sin(a)]]);
ro_abacus = [0.66, 0.12];
ro_h = ro_zt + (ro_abacus[0] - ro_w) + ro_abacus[1];

function base_profile(o) =
    o == "tuscan" ? tu_base : o == "egyptian" ? eg_base : o == "romanesque" ? ro_base : attic_base;
function capital_profile(o) =
    o == "tuscan" ? tu_capital : o == "ionic" ? io_capital : o == "corinthian" ? co_capital :
    o == "egyptian" ? eg_capital : ro_capital;
// In mm.
function base_h(o) = let (p = base_profile(o)) p[len(p) - 1][1] * d;
function capital_h(o) =
    d * (o == "tuscan" ? tu_h : o == "ionic" ? io_h : o == "corinthian" ? co_h : o == "egyptian" ? eg_h : ro_h);

// ---------------------------------------------------------------------------
// Views

if (view == "grid")
    for (i = [0 : 4], j = [0 : 4])
        translate([j * pitch, i * pitch, 0]) pillar(shafts[i], orders[j]);
else
    pillar(shaft, order);

module pillar(s, o) {
    zb = base_h(o);
    zc = length - capital_h(o);
    assert(zc - zb >= d / 2, str("The ", o, " pillar's shaft is shorter than half its diameter; raise length or lower diameter."));
    core = shaft_core(s, r0);
    base(o, core);
    translate([0, 0, zb]) shaft(s, zc - zb);
    translate([0, 0, zc]) capital(o, core * taper);
}

// ---------------------------------------------------------------------------
// Shafts. Each is a section, extruded from radius r0 at the bottom to r1 at
// the top, except the plain one, which is turned.

module shaft(s, h) {
    // the twist that gives the spirals helix_angle at the bottom
    tw = h * tan(helix_angle) / r0 * 180 / PI;
    sl = ceil(tw / 5);
    if (s == "plain")
        // 0.01 mm into base and capital, so they join
        rotate_extrude() polygon(concat([[0, -0.01], [r0, -0.01]],
            [for (i = [0 : 20]) let (t = i / 20)
                [r0 + (r1 - r0) * t + entasis * d * sin(180 * pow(t, 0.631)), t * h]],
            [[r1, h + 0.01], [0, h + 0.01]]));
    else if (s == "lattice")
        intersection_for (sg = [-1, 1])
            linear_extrude(h, twist = sg * tw, slices = sl, scale = taper) lattice_section(r0, sg > 0 ? 1 : 0.85);
    else if (s == "twisted")
        linear_extrude(h, twist = tw, slices = sl, scale = taper) twisted_section(r0);
    else
        linear_extrude(h, scale = taper) {
            if (s == "fluted") fluted_section(r0);
            if (s == "reeded") reeded_section(r0);
        }
}

// The radius of the section's deepest groove, for its outer radius r. Base
// and capital fill the grooves where they meet the shaft, with a 45 degree
// cone from there.
function shaft_core(s, r) =
    s == "fluted" ? r - 0.8 * flute_rho(r) :
    s == "reeded" ? lobe_valley(r, reed_b(r), reeds) :
    s == "twisted" ? lobe_valley(r, strand_b(r), strands) :
    s == "lattice" ? r - 0.7 * groove_rho(r) :
    r;
// Where two neighbouring circles of radius b, n around with their outside
// on radius r, cross.
function lobe_valley(r, b, n) = let (a = r - b, s = sin(180 / n))
    a * cos(180 / n) + sqrt(b * b - a * a * s * s);

// Round flutes, 0.8 of their radius deep, with a narrow fillet between them.
function flute_rho(r) = 0.4 * 2 * PI * r / flutes;
module fluted_section(r) {
    rho = flute_rho(r);
    difference() {
        circle(r);
        for (i = [0 : flutes - 1]) rotate(i * 360 / flutes) translate([r + 0.2 * rho, 0]) circle(rho);
    }
}

// Round reeds around a core, overlapping a little.
function reed_b(r) = let (s = sin(180 / reeds)) 1.1 * r * s / (1 + s);
module reeded_section(r) {
    b = reed_b(r);
    circle(r - b);
    for (i = [0 : reeds - 1]) rotate(i * 360 / reeds) translate([r - b, 0]) circle(b);
}

// Strands: overlapping circles, the valleys between them rounded. One strand
// is a circle off the axis, which winds as a wave.
function strand_b(r) = let (s = sin(180 / strands))
    strands == 1 ? 0.85 * r : r * min(0.85, 1.25 * s / (1 + s));
module twisted_section(r) {
    b = strand_b(r);
    offset(r = -0.15 * r) offset(r = 0.15 * r)
        for (i = [0 : strands - 1]) rotate(i * 360 / strands) translate([r - b, 0]) circle(b);
}

// Round grooves, 0.7 of their radius deep, twisted both ways; where they
// cross they leave diamonds. The grooves one way are k (0.85) as wide and
// deep as the other way, and the outside of that section is 2 % larger, so
// the two only cross and never touch: the shaft's outside is the other's.
function groove_rho(r) = 0.25 * 2 * PI * r / grooves;
module lattice_section(r, k) {
    rho = k * groove_rho(r);
    difference() {
        circle(k < 1 ? 1.02 * r : r);
        for (i = [0 : grooves - 1]) rotate(i * 360 / grooves) translate([r + 0.3 * rho, 0]) circle(rho);
    }
}

// ---------------------------------------------------------------------------
// Bases. core: the shaft's core radius at its bottom, mm.

module base(o, core) {
    p = base_profile(o);
    zb = p[len(p) - 1][1];
    difference() {
        union() {
            if (o != "egyptian")
                translate([-plinth_w / 2 * d, -plinth_w / 2 * d, 0]) cube([plinth_w * d, plinth_w * d, plinth_h * d + 0.01]);
            revolve(core < r0 - 0.01 ? concat(p, [[core / d, zb + R0 - core / d]]) : p);
        }
        if (o == "egyptian") logo_engraving(-0.75 * d, 0.12 * d, 0.65 * 0.24 * d);
        else logo_engraving(-plinth_w / 2 * d, plinth_h / 2 * d, 0.65 * plinth_h * d);
    }
    if (o == "romanesque") spurs();
}

// A leaf on each corner of the plinth, from near the corner up onto the
// torus, widening towards it.
module spurs()
    for (a = [45 : 90 : 315]) rotate(a) hull() {
        translate([0.88 * d, 0, plinth_h * d - 0.01]) cylinder(r = 0.03 * d, h = 0.02);
        translate([0.62 * d, 0, plinth_h * d - 0.01]) cylinder(r = 0.14 * d, h = 0.02);
        translate([0.6 * d, 0, (plinth_h + 0.1) * d]) sphere(0.05 * d);
    }

// ---------------------------------------------------------------------------
// Capitals, from the shaft's top at z = 0. core: the shaft's core radius at
// its top, mm.

module capital(o, core) {
    p = capital_profile(o);
    q = core < r1 - 0.01 ? concat([[core / d, core / d - R1]], p) : p;
    if (o == "romanesque")
        intersection() {
            revolve(q);
            translate([-ro_w * d, -ro_w * d, -d]) cube([2 * ro_w * d, 2 * ro_w * d, ro_zt * d + 2 * d]);
        }
    else
        revolve(q);

    if (o == "tuscan")
        translate([0, 0, tu_ze * d]) corbel(tu_c * d, 0.1 * d) {
            circle(tu_re * d);
            square(2 * tu_re * d, center = true);
        }
    if (o == "ionic") ionic_top();
    if (o == "corinthian") {
        b = co_bell * d;
        w = 1.15 * 2 * PI * bell_r(b, b[0] + b[1] / 2) / leaves;
        for (k = [0 : leaves - 1]) {
            leaf(k * 360 / leaves, b[0], 0.4 * d, w, 0.05 * d, b);
            leaf((k + 0.5) * 360 / leaves, b[0] + 0.14 * d, 0.5 * d, w, 0.05 * d, b);
        }
        translate([0, 0, b[0] + b[1]]) corinthian_abacus();
    }
    if (o == "egyptian") {
        b = eg_bell * d;
        w = 2 * PI * bell_r(b, b[0] + b[1] / 2) / leaves;
        for (k = [0 : leaves - 1]) leaf(k * 360 / leaves, b[0], 0.62 * d, w, 0.035 * d, b);
        translate([-eg_block[0] * d, -eg_block[0] * d, 1.02 * d - 0.01])
            cube([2 * eg_block[0] * d, 2 * eg_block[0] * d, eg_block[1] * d + 0.01]);
    }
    if (o == "romanesque")
        translate([0, 0, ro_zt * d]) corbel((ro_abacus[0] - ro_w) * d, ro_abacus[1] * d) {
            square(2 * ro_w * d, center = true);
            square(2 * ro_abacus[0] * d, center = true);
        }
}

// The ionic volute block on the echinus, with its abacus.
module ionic_top() {
    translate([0, 0, io_ze * d]) {
        difference() {
            rotate([90, 0, 0]) linear_extrude(2 * io_dd * d, center = true) ionic_face();
            for (y = [-1, 1]) translate([0, y * io_dd * d, 0])
                rotate([90, 0, 0]) linear_extrude(0.04 * d, center = true) volute_grooves();
        }
        translate([0, 0, io_top * d]) corbel(io_c * d, 0.07 * d) {
            square([2 * io_xs * d, 2 * io_dd * d], center = true);
            square(2 * io_abacus * d, center = true);
        }
    }
}

// The volute block seen from the front: x across, y up from the echinus,
// 0.01 mm into it.
module ionic_face() {
    xa = io_xa * d;
    xs = io_xs * d;
    polygon([[xa, -0.01], [xs, xs - xa], [xs, io_top * d], [-xs, io_top * d], [-xs, xs - xa], [-xa, -0.01]]);
    for (m = [0, 1]) mirror([m, 0]) translate([io_xv * d, io_zv * d]) circle(io_rv * d);
}

// The spirals, each from its volute's upper inner side round over the top
// and in to the eye, and the line between them.
module volute_grooves() {
    gw = 0.02 * d;
    ro = (io_rv - 0.03) * d;
    ri = 0.035 * d;
    turns = 1.75;
    n = 80;
    function sp(r) = [for (i = [0 : n]) let (t = i / n, a = 135 - t * turns * 360, rr = r + (ri - ro) * t)
                      [rr * cos(a), rr * sin(a)]];
    for (m = [0, 1]) mirror([m, 0]) translate([io_xv * d, io_zv * d])
        polygon(concat(sp(ro + gw / 2), [for (p = [n : -1 : 0]) sp(ro - gw / 2)[p]]));
    x = (io_xv - (io_rv - 0.03) / sqrt(2)) * d;
    translate([-x, (io_zv + (io_rv - 0.03) / sqrt(2)) * d - gw / 2]) square([2 * x, gw]);
}

// Square, with concave sides and cut corners, on 45 degree slopes from the
// bell's rim.
module corinthian_abacus() {
    w = co_w * d;
    h = (co_c + 0.08) * d;
    difference() {
        intersection() {
            corbel(co_c * d, 0.08 * d) {
                circle(co_bell[3] * d);
                square(2 * w, center = true);
            }
            rotate(45) translate([-0.95 * d, -0.95 * d, 0]) cube([1.9 * d, 1.9 * d, h]);
        }
        for (a = [0 : 90 : 270]) rotate(a) translate([w + 0.42 * d, 0, -1]) cylinder(r = 0.5 * d, h = h + 2);
    }
}

// ---------------------------------------------------------------------------
// Helpers

// A profile in units of the diameter, turned around the axis. Wherever it
// would reach out faster than 45 degrees, it is cut back to 45 degrees.
module revolve(p) {
    q = support45(p) * d;
    rotate_extrude() polygon(concat([[0, q[0][1]]], q, [[0, q[len(q) - 1][1]]]));
}
function support45(p) =
    [for (i = 0, r = p[0][0]; i < len(p);
          r = i + 1 < len(p) ? min(p[i + 1][0], r + p[i + 1][1] - p[i][1]) : 0, i = i + 1)
        [r, p[i][1]]];

// A torus of radius rho around radius rc, standing on z0. Below 45 degrees
// it goes on along its tangent down to z0, its foot. torus_on: the same with
// its foot on radius r.
function torus(rc, z0, rho) = concat([[rc + (sqrt(2) - 1) * rho, z0]],
    [for (a = [-45 : 15 : 90]) [rc + rho * cos(a), z0 + rho + rho * sin(a)]]);
function torus_on(r, z0, rho) = torus(r - (sqrt(2) - 1) * rho, z0, rho);

// A quadratic Bezier curve from p0 (left out) through p2.
function bezier(p0, p1, p2, n = 8) =
    [for (i = [1 : n]) let (t = i / n) (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2];

// A bell [bottom, height, bottom radius, top radius]: its radius grows with
// the square of the height. bell_points leaves out its bottom.
function bell_r(b, z) = let (u = (z - b[0]) / b[1]) b[2] + (b[3] - b[2]) * u * u;
function bell_points(b) = [for (i = [1 : 10]) let (z = b[0] + b[1] * i / 10) [bell_r(b, z), z]];

// The shape top (2D) extruded h high, c above its support (2D) at z = 0, and
// the hull between them. Its underside rises at most 45 degrees if c is at
// least as large as top reaches out over support. It reaches 0.01 mm down
// into what it stands on, so the two join.
module corbel(c, h) hull() {
    translate([0, 0, -0.01]) linear_extrude(0.02) children(0);
    translate([0, 0, c]) linear_extrude(h) children(1);
}

// A leaf in relief on the bell b (mm), around angle a: from z0 to z0 + h, w
// wide at its widest and t thick, with a rib in its middle. Its back is
// inside the bell. Its thickness grows from nothing at its bottom over 2.5 t,
// so it leans out no more than 0.6 further than the bell and prints without
// support.
module leaf(a, z0, h, w, t, b) {
    nu = 24;
    nv = 12;
    pts = [for (i = [0 : nu], s = [0, 1], j = [0 : nv])
        let (u = i / nu, z = z0 + u * h, r = bell_r(b, z), v = 2 * j / nv - 1,
             phi = a + v * w / 2 * leaf_width(u) / r * 180 / PI,
             rr = s == 0 ? r + t * smooth(u * h / (2.5 * t)) * leaf_thickness(v) : r - 0.3)
        [rr * cos(phi), rr * sin(phi), z]];
    function f(i, j) = 2 * i * (nv + 1) + j;
    function k(i, j) = (2 * i + 1) * (nv + 1) + j;
    polyhedron(pts, concat(
        [for (i = [0 : nu - 1], j = [0 : nv - 1]) [f(i, j), f(i + 1, j), f(i + 1, j + 1), f(i, j + 1)]],
        [for (i = [0 : nu - 1], j = [0 : nv - 1]) [k(i, j), k(i, j + 1), k(i + 1, j + 1), k(i + 1, j)]],
        [for (i = [0 : nu - 1]) [f(i + 1, 0), f(i, 0), k(i, 0), k(i + 1, 0)]],
        [for (i = [0 : nu - 1]) [f(i, nv), f(i + 1, nv), k(i + 1, nv), k(i, nv)]],
        [for (j = [0 : nv - 1]) [f(0, j), f(0, j + 1), k(0, j + 1), k(0, j)]],
        [for (j = [0 : nv - 1]) [f(nu, j + 1), f(nu, j), k(nu, j), k(nu, j + 1)]]));
}
// The leaf's half width along its height u (0 to 1), as a fraction of its
// widest, and its thickness across it v (-1 to 1), as a fraction of t.
function leaf_width(u) = max(0.04, sin(180 * (0.12 + 0.88 * u)));
function leaf_thickness(v) = 0.65 * (1 - v * v) + 0.35 * exp(-pow(v / 0.15, 2));
function smooth(x) = let (c = min(1, max(0, x))) c * c * (3 - 2 * c);

// ---------------------------------------------------------------------------
// Logo

// The logo engraved logo_depth into a face at y, standing, h high, its middle
// at height z. Left out below logo_min_height.
module logo_engraving(y, z, h)
    if (h >= logo_min_height)
        translate([0, y, z]) rotate([90, 0, 0]) translate([0, 0, -logo_depth]) linear_extrude(logo_depth + 1)
            scale(h / (2 * logo_r)) translate([0, -logo_r]) logo();

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
// The S in the ring: two half rings around half discs, all strokes
// logo_stroke wide.
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;

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
        translate([0, -(ring_in - s_small)]) circle(r = s_small);
    }
    translate([0, ring_in - s_small]) circle(r = s_small);
}
