// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Matchbox V2: a tray and a sleeve for matches, in any size. Standalone, no
// libraries. Millimetres, newtons, degrees.
// Print the tray as it lies and the sleeve standing on one end, no support.
//
// Reverse engineered from "Match Box", makerworld.com/models/2369521: the format
// "reference" gives that box, see readme.md for what was measured.
//   - Each long side of the tray has two snap tabs, cut free by a slit, with a
//     bump at the end. The sleeve has a pocket for each bump: closed, the four
//     bumps rest in the four pockets. Pushed out, the rear bumps click into the
//     front pockets and the tray stays open. Pull on and it comes out.
//   - The slits are one layer high and 0.2 wide: break the tabs free after the
//     print, by pushing each bump in once.
//   - Two rails on each narrow side of the sleeve hold a strip of striking
//     surface, pushed in from an end.
//   - Radii and fillets follow the wall's thickness, as in the original.
// The formats are common boxes at their outer size, sources in readme.md. Their
// walls are thinner than the reference's 2, which leaves a small box a third less room.
// The script echoes the sizes and what a beam model says about the tabs.
// V2: print_all lays all formats out for printing, on as many beds as it takes.

/* [1 - Start here] */
part = "print"; // [print:Tray and sleeve as they are printed,tray:Tray,sleeve:Sleeve,assembly:Box with the tray pushed out,sizes:All formats side by side,print_all:All formats laid out for printing - on as many beds as it takes]
// The closed box: length (the way the tray slides) x width x height, and its wall.
format = "pocket"; // [custom:Custom - the sizes and the wall below,pocket:Pocket 50 x 35 x 15 - the usual small box - wall 1.2,gost:GOST 1820 50.5 x 37.5 x 14.5 - Russia - wall 1.2,india:India 51 x 35 x 13 - wall 1.2,nordic:Nordic pocket 58 x 36 x 17 - for 47 mm matches - wall 1.2,japan:Japan namigata 56 x 37 x 17 - wall 1.2,flat:Flat 56 x 35 x 9 - advertising box - wall 1.2 - no rails,long:Long 110 x 65 x 20 - for 95 mm matches - wall 1.6,kitchen:Kitchen 120 x 66 x 26 - Europe - wall 1.6,kitchen_us:US kitchen 120.7 x 66 x 38.1 - for 60 mm matches across - wall 1.2,reference:Reference 59 x 41.4 x 21.4 - the MakerWorld box - wall 2]
// assembly and sizes: 0 closed, 1 pushed out to the open click.
open = 1; // [0:0.05:1]

/* [2 - print_all] */
// Side of the printer's square bed.
bed = 256; // [150:1:400]
// Border of the bed left free, for a brim and the corners a printer keeps for itself.
bed_margin = 10; // [0:1:40]
// 0: all beds side by side. 1, 2, ...: that bed alone, to export it.
print_bed = 0; // [0:1:8]

/* [3 - Custom size] */
// outside: the closed box without the rails. inside: the room for the matches in the tray.
size_is = "outside"; // [outside,inside]
length = 59; // [20:0.5:320]
width = 41.4; // [15:0.2:150]
height = 21.4; // [8:0.2:80]

// Walls of sleeve and tray, and the tray's floor, for custom: a format brings its own. Thinner: more room, softer tabs.
wall = 2; // [1:0.2:3]

/* [4 - Fit] */
// Between tray and sleeve, per side.
clearance = 0.2; // [0.1:0.05:0.5]
// Layer height of the print: the tray's height and the slits lie on its layers.
layer = 0.2; // [0.1:0.02:0.3]

/* [5 - Snap tabs] */
// Bump's centre from the box's end, at most a fifth of the length. The tray opens by the length less twice this.
detent_inset = 11; // [5:0.5:30]
// Tab from its root to the bump. Shorter boxes get shorter tabs.
tab_arm = 12.5; // [6:0.5:30]
// Height of the tabs, at most 0.47 of the tray's height.
tab_height = 8; // [3:0.2:20]
// Strain the tabs may see, in percent. The bump is 0.4 walls + clearance high, or lower if the tab would strain more. PLA yields near 2.
tab_strain = 1.6; // [0.5:0.1:2.5]
// Width of the slits around the tabs. The level ones lie in one layer, so not above the layer height.
slit = 0.2; // [0.2:0.02:0.6]

/* [6 - Striker rails] */
rails = true;
// Room under the lips for the strip's thickness.
strip_gap = 0.4; // [0.2:0.1:1]
// How far the lips reach over the strip, per side.
lip_overhang = 1; // [0.4:0.1:2]

/* [7 - Logo and model] */
logo = true;
// Friction coefficient plastic on plastic and bending modulus (N/mm², PLA about 3300): for the echoed forces, they do not change the shape.
friction = 0.3; // [0.1:0.05:0.6]
e_modulus = 3300;

/* [Hidden] */
version = "V2";
$fn = 48;
corner_fn = 12;             // segments per quarter circle of a rounded outline
fillet_fn = 6;              // segments per fillet
lip_thickness = 0.7;
rail_top = 0.6;             // flat top of a rail beside its lip
logo_depth = 0.4;
bed_gap = 5;                // between the parts on a bed
label_font = "Liberation Sans:style=Bold";

// key, name, outer length, width, height, wall
formats = [
    ["pocket", "Pocket", 50, 35, 15, 1.2],
    ["gost", "GOST 1820", 50.5, 37.5, 14.5, 1.2],
    ["india", "India", 51, 35, 13, 1.2],
    ["nordic", "Nordic", 58, 36, 17, 1.2],
    ["japan", "Japan", 56, 37, 17, 1.2],
    ["flat", "Flat", 56, 35, 9, 1.2],
    ["reference", "Reference", 59, 41.4, 21.4, 2],
    ["long", "Long", 110, 65, 20, 1.6],
    ["kitchen", "Kitchen", 120, 66, 26, 1.6],
    ["kitchen_us", "US kitchen", 120.7, 66, 38.1, 1.2],
];
function format_of(key) = [for (f = formats) if (f[0] == key) f][0];
// The wall as a special variable: the sizes view gives each format its own.
$wall = format == "custom" ? wall : format_of(format)[5];

// ---- sizes that follow from the box's outer size b = [length, width, height] ----
function snap(z) = round(z / layer + 0.001) * layer;
function box_of(key) = key == "custom"
    ? (size_is == "outside" ? [length, width, height]
       : [length + 2 * wall, width + 4 * wall + 2 * clearance, snap(height) + 3 * wall + 2 * clearance])
    : [for (i = [2 : 4]) format_of(key)[i]];

function tray_w(b) = b[1] - 2 * ($wall + clearance);
function tray_h(b) = floor((b[2] - 2 * ($wall + clearance)) / layer + 0.001) * layer;
function room(b) = [b[0] - 2 * $wall, tray_w(b) - 2 * $wall, tray_h(b) - $wall];

function inset(b) = min(detent_inset, 0.2 * b[0]);
function bump_y(b) = b[0] / 2 - inset(b);
function root_y(b) = max(bump_y(b) - tab_arm, 0.1 * b[0]);
function arm(b) = bump_y(b) - root_y(b);
// How far a bump bends its tab between the clicks, and so the pocket's depth.
function press(b) = min(0.4 * $wall, tab_strain / 100 * pow(arm(b), 2) / (1.5 * $wall));
function bump(b) = press(b) + clearance;
function tab_h(b) = snap(min(tab_height, 0.47 * tray_h(b)));
function tab_z(b) = snap((tray_h(b) - tab_h(b)) / 2);
function travel(b) = b[0] - 2 * inset(b);
function tray_corner(b) = min(2 * $wall, 0.6 * inset(b), 0.25 * tray_w(b));
// The lower slit has to lie above the floor, and matches need some width.
function fits(b) = tab_z(b) - slit >= $wall && room(b)[1] > $wall;

// Striker strip between the rails of a narrow side.
rail_h = strip_gap + lip_thickness;
function strip_w(b) = b[2] - 3.2 * $wall - 2 * (rail_top + rail_h);
function lip(b) = min(lip_overhang, strip_w(b) / 6);
function has_rails(b) = rails && strip_w(b) >= 3;

// ---- model: a tab is a beam held at its root, loaded at the bump ----
function strain(b) = 150 * $wall * press(b) / pow(arm(b), 2);
function tab_force(b) = e_modulus * tab_h(b) * pow($wall, 3) * press(b) / (4 * pow(arm(b), 3));
// Push that lifts the four bumps out of their pockets: each rides up the pocket's rounded mouth.
function open_force(b) = let (p = bump(b), m = 0.75 * p, k = tab_force(b) / press(b))
    4 * max([for (i = [1 : 19]) let (y = press(b) * i / 20, slope = acos((m + clearance + y) / (p + m)))
        k * y * tan(min(slope + atan(friction), 89))]);

function fixed(x, digits = 1) = round(x * pow(10, digits)) / pow(10, digits);
module report(b) {
    r = room(b);
    echo(str("box: ", b[0], " x ", b[1], " x ", b[2], has_rails(b) ? str(", ", b[1] + 2 * rail_h, " wide with the rails") : ""));
    echo(str("tray: ", b[0], " x ", tray_w(b), " x ", tray_h(b), ", room for the matches ", r[0], " x ", r[1], " x ", r[2]));
    echo(str("tabs: ", fixed(arm(b)), " long, ", tab_h(b), " high, bump ", fixed(bump(b), 2), ", strain ", fixed(strain(b), 2),
             " %, ", fixed(tab_force(b)), " N each between the clicks"));
    echo(str("model: about ", fixed(open_force(b), 0), " N to open, ", fixed(4 * friction * tab_force(b), 0),
             " N to slide on, the tray opens by ", travel(b)));
    if (has_rails(b)) echo(str("striker strip: ", fixed(strip_w(b) - 0.1), " wide, up to ", strip_gap - 0.1, " thick, the rails are ", fixed(b[0] - 1.7 * $wall), " long"));
    else if (rails) echo("no room for striker rails on this height");
}

// ---- building blocks ----
// Rounded rectangle 2 hx by 2 hy at the height z, 4 (corner_fn + 1) points, anticlockwise.
function ring(hx, hy, r, z) = [for (q = [0 : 3], i = [0 : corner_fn])
    let (a = 90 * q + 90 * i / corner_fn)
    [(q == 0 || q == 3 ? 1 : -1) * (hx - r) + r * cos(a), (q < 2 ? 1 : -1) * (hy - r) + r * sin(a), z]];

// Quarter circle from the angle a0 to a1 around c.
function fillet(c, r, a0, a1) = [for (i = [0 : fillet_fn]) let (a = a0 + (a1 - a0) * i / fillet_fn) c + r * [cos(a), sin(a)]];

// One solid over rings of the same number of points. A row of rings is closed by
// its first and last ring, a loop of rings is a tube.
module skin(rings, loop = false) {
    k = len(rings);
    m = len(rings[0]);
    polyhedron(points = [for (r = rings) each r], convexity = 6, faces = concat(
        [for (i = [0 : k - (loop ? 1 : 2)], j = [0 : m - 1])
            let (a = i * m, c = ((i + 1) % k) * m, j2 = (j + 1) % m)
            each [[a + j, c + j, c + j2], [a + j, c + j2, a + j2]]],
        loop ? [] : [[for (j = [0 : m - 1]) j], [for (j = [m - 1 : -1 : 0]) (k - 1) * m + j]]));
}

// ---- tray: as printed, floor on the bed, its length along y ----
// The wall's outline as [distance in from the outside, height]: up the outside, over the rim, down to the floor.
function tray_outline(b) = let (h = tray_h(b), rb = 0.8 * $wall, rt = 0.4 * $wall, rf = 0.5 * $wall) concat(
    fillet([rb, rb], rb, 270, 180),
    fillet([rt, h - rt], rt, 180, 90),
    fillet([$wall - rt, h - rt], rt, 90, 0),
    fillet([$wall + rf, $wall + rf], rf, 180, 270));

module tray_body(b) {
    rc = tray_corner(b);
    skin([for (p = tray_outline(b))
        ring(tray_w(b) / 2 - p[0], b[0] / 2 - p[0], max(rc - p[0], 0.1 * $wall), p[1])]);
}

// The slit around one tab as a ring of points in the wall's plane x: a U lying
// on its side, w around its middle line, from the root y0 to the end y1.
function slit_ring(x, y0, y1, z0, z1, w) = concat(
    [for (i = [0 : fillet_fn]) let (a = 90 + 180 * i / fillet_fn) [x, y0 + w * cos(a), z1 + w * sin(a)]],
    [[x, y1 - w, z1 - w], [x, y1 - w, z0 + w]],
    [for (i = [0 : fillet_fn]) let (a = 90 + 180 * i / fillet_fn) [x, y0 + w * cos(a), z0 + w * sin(a)]],
    [for (i = [0 : fillet_fn]) let (a = 270 + 90 * i / fillet_fn) [x, y1 + w * cos(a), z0 + w * sin(a)]],
    [for (i = [0 : fillet_fn]) let (a = 90 * i / fillet_fn) [x, y1 + w * cos(a), z1 + w * sin(a)]]);

// Cuts the tab of the side x > 0, y > 0 free. The slit widens with a fillet
// towards both faces of the wall, so that only its middle has to break free.
module slit_cut(b) {
    r = 0.3 * $wall;
    xm = tray_w(b) / 2 - $wall / 2;
    y1 = bump_y(b) + bump(b) + slit / 2;
    z0 = tab_z(b) - slit / 2;
    z1 = tab_z(b) + tab_h(b) + slit / 2;
    // [across the wall, half width of the slit], inwards through the floor's fillet too
    mouth = concat([[-$wall, slit / 2 + r]],
        fillet([-$wall / 2 + r, slit / 2 + r], r, 180, 270),
        fillet([$wall / 2 - r, slit / 2 + r], r, 270, 360),
        [[$wall / 2 + 0.2, slit / 2 + r]]);
    skin([for (p = mouth) slit_ring(xm + p[0], root_y(b), y1, z0, z1, p[1])]);
}

module bumps(b) {
    p = bump(b);
    for (sx = [-1, 1], sy = [-1, 1])
        hull() for (z = [tab_z(b) + p, tab_z(b) + tab_h(b) - p])
            translate([sx * tray_w(b) / 2, sy * bump_y(b), z]) sphere(r = p);
}

module tray(b) {
    assert(fits(b), "too flat or too narrow for this wall: thinner wall or bigger box");
    w = min(0.4 * tray_w(b), 0.3 * b[0]);
    union() {
        difference() {
            tray_body(b);
            union() for (mx = [0, 1], my = [0, 1]) mirror([mx, 0, 0]) mirror([0, my, 0]) slit_cut(b);
            // logo and version below, read from below
            if (logo) translate([0, 0.3 * w, 0]) mirror([0, 0, 1]) mirror([1, 0, 0]) logo_cut(w);
            translate([0, -0.55 * w, -1]) linear_extrude(1 + logo_depth) mirror([1, 0, 0])
                text(version, size = 0.3 * w, font = label_font, halign = "center", valign = "center");
        }
        // after the slits: their widened mouths would cut into the bumps
        bumps(b);
    }
}

// ---- sleeve: as printed, standing, the box's length along z, its width along x ----
// The wall's outline as [distance in from the outside, height]: up the outside and down the inside.
function sleeve_outline(b) = let (l = b[0], r = 0.35 * $wall) concat(
    fillet([r, r], r, 270, 180),
    fillet([r, l - r], r, 180, 90),
    fillet([$wall - r, l - r], r, 90, 0),
    fillet([$wall - r, r], r, 360, 270));

// Across a bump: the sleeve's inner face on the x axis, the wall above it. The
// bump's own circle, with a rounded mouth for it to ride out on.
module pocket_shape(b) {
    p = bump(b);
    m = 0.75 * p;
    intersection() {
        offset(r = -m) offset(r = m) union() {
            translate([0, -clearance]) circle(r = p);
            translate([-4 * p, -4 * p]) square([8 * p, 4 * p]);
        }
        translate([-4 * p, -0.01]) square([8 * p, 2 * p]);
    }
}

// One rail of the side x > 0, at y > 0: a ridge with slopes at both ends and outside, and the lip over the strip.
module rail(b) {
    y0 = strip_w(b) / 2;
    z0 = 0.85 * $wall;
    z1 = b[0] - z0;
    translate([b[1] / 2, 0, 0]) {
        hull() {
            translate([-0.3, y0, z0]) cube([0.3, rail_top + rail_h, z1 - z0]);
            translate([rail_h - 0.01, y0, z0 + rail_h]) cube([0.01, rail_top, z1 - z0 - 2 * rail_h]);
        }
        hull() {
            translate([strip_gap, y0 - 0.01, z0 + rail_h]) cube([lip_thickness, 0.3, z1 - z0 - 2 * rail_h]);
            translate([strip_gap + lip_thickness / 2, y0 - lip(b) + lip_thickness / 2, z0 + rail_h + lip(b)])
                cylinder(d = lip_thickness, h = z1 - z0 - 2 * rail_h - 2 * lip(b), $fn = 16);
        }
    }
}

module sleeve(b) {
    assert(fits(b), "too flat or too narrow for this wall: thinner wall or bigger box");
    w = min(0.35 * b[1], 0.3 * b[0]);
    difference() {
        union() {
            skin([for (p = sleeve_outline(b))
                ring(b[1] / 2 - p[0], b[2] / 2 - p[0], max(1.4 * $wall - p[0], 0.1 * $wall), p[1])], loop = true);
            if (has_rails(b)) for (mx = [0, 1], my = [0, 1]) mirror([mx, 0, 0]) mirror([0, my, 0]) rail(b);
        }
        // pockets: 2D x along the box, 2D y into the wall, as high as the tabs and a clearance more
        union() for (mx = [0, 1], z = [inset(b), b[0] - inset(b)]) mirror([mx, 0, 0])
            translate([b[1] / 2 - $wall, tab_z(b) + tab_h(b) / 2 - tray_h(b) / 2, z])
                multmatrix([[0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0]])
                    linear_extrude(tab_h(b) + 2 * clearance, center = true) pocket_shape(b);
        // logo on the back, the face under the tray's floor
        if (logo) translate([0, -b[2] / 2, b[0] / 2]) rotate([90, 0, 0]) logo_cut(w);
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

// ---- views ----
// The box lying on its back, its front end on y = 0, the tray pushed out towards -y.
module assembly(b) {
    color("Gainsboro") translate([0, b[0], b[2] / 2]) rotate([90, 0, 0]) sleeve(b);
    color("Orange") translate([0, b[0] / 2 - open * travel(b), (b[2] - tray_h(b)) / 2]) tray(b);
}

// Every format, its name and outer size in front of it.
module sizes() {
    gap = 16;
    for (i = [0 : len(formats) - 1]) {
        f = formats[i];
        b = [f[2], f[3], f[4]];
        $wall = f[5];
        x = gap * i + b[1] / 2 + (i == 0 ? 0 : [for (j = [0 : i - 1]) formats[j][3]] * [for (j = [0 : i - 1]) 1]);
        echo(str("--- ", f[1], ", wall ", f[5]));
        report(b);
        translate([x, 0, 0]) {
            assembly(b);
            color("DimGray") translate([0, -open * travel(b) - 4, 0]) linear_extrude(0.4) {
                text(f[1], size = 6, font = label_font, halign = "center", valign = "top");
                translate([0, -9]) text(str(b[0], " x ", b[1], " x ", b[2]), size = 4.5, font = label_font, halign = "center", valign = "top");
            }
        }
    }
}

// Where parts [width, depth] go: [bed, x, y] of each one's lower left corner. Rows
// fill the bed's free width from the left, beds its free depth from the front.
function place(parts, i = 0, k = 0, x = 0, y = 0, depth = 0) = let (free = bed - 2 * bed_margin)
    i == len(parts) ? []
    : x > 0 && x + parts[i][0] > free ? place(parts, i, k, 0, y + depth + bed_gap, 0)
    : y > 0 && y + parts[i][1] > free ? place(parts, i, k + 1, 0, 0, 0)
    : concat([[k, x, y]], place(parts, i + 1, k, x + parts[i][0] + bed_gap, y, max(depth, parts[i][1])));

// Every format's tray as it lies, then every format's sleeve standing, the biggest
// first, each bed's parts centred on it. The beds and the names show in the preview only.
module print_all() {
    n = len(formats);
    // [format, is it the sleeve]
    list = [for (sleeve = [false, true], i = [n - 1 : -1 : 0]) [formats[i], sleeve]];
    parts = [for (p = list) let (f = p[0], b = [f[2], f[3], f[4]], $wall = f[5])
        p[1] ? [b[1] + (has_rails(b) ? 2 * rail_h : 0), b[2]] : [tray_w(b) + 2 * bump(b), b[0]]];
    at = place(parts);
    beds = at[len(at) - 1][0] + 1;
    assert(print_bed <= beds, str("print_bed: there are ", beds, " beds"));
    for (k = [0 : beds - 1]) if (print_bed == 0 || print_bed == k + 1) {
        mine = [for (i = [0 : len(at) - 1]) if (at[i][0] == k) i];
        size = [max([for (i = mine) at[i][1] + parts[i][0]]), max([for (i = mine) at[i][2] + parts[i][1]])];
        echo(str("bed ", k + 1, " of ", beds, ": ", len(mine), " parts on ", fixed(size[0]), " x ", fixed(size[1])));
        translate([print_bed == 0 ? k * (bed + 20) : 0, 0, 0]) {
            if ($preview) color("Gainsboro") translate([0, 0, -0.5]) cube([bed, bed, 0.3]);
            for (i = mine) {
                f = list[i][0];
                b = [f[2], f[3], f[4]];
                $wall = f[5];
                translate([(bed - size[0]) / 2 + at[i][1] + parts[i][0] / 2, (bed - size[1]) / 2 + at[i][2] + parts[i][1] / 2, 0]) {
                    if (list[i][1]) sleeve(b); else tray(b);
                    if ($preview) color("Black") translate([0, 0, list[i][1] ? b[0] : $wall]) rotate(list[i][1] ? 0 : 90)
                        linear_extrude(0.4) text(f[1], size = min(5, 0.4 * b[2], b[1] / len(f[1])), font = label_font, halign = "center", valign = "center");
                }
            }
        }
    }
}

box = box_of(format);
if (part == "sizes") {
    sizes();
} else if (part == "print_all") {
    print_all();
} else {
    report(box);
    if (part == "print") {
        tray(box);
        translate([tray_w(box) / 2 + 8 + box[1] / 2 + rail_h, 0, 0]) sleeve(box);
    } else if (part == "tray") {
        tray(box);
    } else if (part == "sleeve") {
        sleeve(box);
    } else if (part == "assembly") {
        assembly(box);
    }
}
