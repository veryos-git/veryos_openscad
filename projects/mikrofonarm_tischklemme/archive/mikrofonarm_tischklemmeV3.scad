// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Table clamp for the Rode PSA-1 microphone arm, as sketched in idee.jpeg.
//
// V3: every outer edge of the clamp has a 45 degree chamfer of
// clamp_chamfer: the corners of the side view are cut, and the two side
// faces, which lie on the bed and on top, step in by one 0.2 layer per layer.
// The bed side's first layer is 0.9 in, so its squish does not bulge. The
// logo on the block moves 0.5 down, to the middle of what the chamfer leaves.
// The screw is V2's.
//
// V2: pin_x moves the pin and the screw further into the table without
// limit. The top jaw now reaches top_jaw_reach beyond the block, instead of a
// fixed top_jaw_length that a pin_x of 28 or more ran past. With the pin
// more than 23 in, the block widens towards the spine, so the outer slope
// never cuts into the corner of the C below the top jaw's top. pin_x is 18
// instead of 14, as set by the user. With pin_x 14 the clamp is V1's; the
// screw is V1's.
//
// V1: two printed parts.
// - clamp: a C over the table edge. The top jaw lies on the table and carries
//   a block with the blind hole for the arm's pin, with a 45 degree slope on
//   its outer side; the lower jaw holds the thread for the screw, right below
//   the pin. It prints lying on its side, so the layers run around the C and
//   the screw's force pulls along them, not across. The pin hole is a
//   teardrop with its point up on the bed, so it prints without support.
// - screw: 16 mm thread, 2 mm pitch, 45 degree flanks (fdm_optimized_screws),
//   with a T bar to turn it, as on Rode's own clamp. It prints lying, its
//   underside cut flat. Its flat end presses on the table's underside.
// The VeryOS logo is engraved in the block's face towards the table and in
// the bar's top as printed.
// Origin: the table's top edge; x into the table, y along the edge, z up.
//
// Units: mm. No external libraries needed.

/* [View] */
part = "print_layout"; // [print_layout:Both parts on the bed,assembly:Assembly on a table,clamp:Clamp (print orientation),screw:Screw (print orientation)]

/* [Pin of the arm: Rode PSA-1] */
// The pin is 12.5 thick and 30 long, measured.
pin_hole_diameter = 12.6;
pin_hole_depth = 32;
// Pin axis from the table edge.
pin_x = 18;

/* [Table] */
// Gap between the jaws: the thickest table.
table_max = 50;
// Thinnest table the screw still reaches.
table_min = 10;
// Table shown in the assembly.
table_shown = 30;

/* [Clamp] */
// Along the table edge; the clamp's height on the bed.
clamp_width = 40;
spine_thickness = 16;
top_jaw_thickness = 12;
// Also the thread's length: 8 turns.
lower_jaw_thickness = 16;
// Reach of the top jaw beyond the block, further into the table.
top_jaw_reach = 13;
// Wall of the block on the table side of the pin hole.
block_wall = 11.7;
// Wall of the block on the outer side, at its top; more with a large pin_x.
block_top_wall = 7.7;
// Material between the pin hole's bottom and the table.
pin_hole_floor = 5;
// Wall of the lower jaw beyond the thread.
lower_jaw_wall = 7.75;
// Rounds the C's inner corners.
inner_radius = 3;
// 45 degree chamfer on all outer edges of the clamp.
clamp_chamfer = 1;

/* [Screw] */
thread_diameter = 16;
thread_pitch = 2;
// Radial gap between the screw and the clamp's thread (lessons_learned.md).
thread_clearance = 0.25;
// 45 degree chamfer at the screw's tip.
tip_chamfer = 1;
// Share of the thread diameter cut off the screw's underside, through shank
// and bar, so both stand on the bed (fdm_optimized_screws).
screw_cut = 0.15;
bar_length = 70;
// Along the screw's axis.
bar_width = 14;
bar_chamfer = 1;

/* [Logo] */
clamp_logo_height = 19;
bar_logo_height = 10;
logo_depth = 1;

/* [Hidden] */
$fn = 96;
eps = 0.01;
layer = 0.2;

pin_r = pin_hole_diameter / 2;
// The pin hole's lowest line on the bed is on a layer boundary, so the slicer
// does not narrow it by half a layer.
pin_y = round((clamp_width / 2 - pin_r) / layer) * layer + pin_r;
block_top = pin_hole_floor + pin_hole_depth;
block_right = pin_x + pin_r + block_wall;
top_jaw_length = block_right + top_jaw_reach;
// The slope meets the spine no lower than the top jaw's top.
block_left = min(pin_x - pin_r - block_top_wall, block_top - top_jaw_thickness - spine_thickness);
// The outer slope meets the spine's outer face here.
slope_bottom = block_top - (block_left + spine_thickness);
hole_d = thread_diameter + 2 * thread_clearance;
lower_jaw_top = -table_max;
lower_jaw_bottom = lower_jaw_top - lower_jaw_thickness;
lower_jaw_length = pin_x + hole_d / 2 + lower_jaw_wall;
screw_length = table_max + lower_jaw_thickness - table_min;
// Height of the screw's axis above the bed; the bar is twice as thick.
screw_axis_z = thread_diameter * (0.5 - screw_cut);
bar_thickness = 2 * screw_axis_z;

// The logo at the size of veryos_logo.svg, as in veryos_logo_cube: a ring and
// the two arms of a V, all logo_stroke wide. The arms stand logo_angle off
// the vertical.
logo_r = 15.6264133379; // outer radius of the ring
logo_stroke = 5;
logo_angle = 22.5;
// Half the distance between the arms' outer edges at the bottom.
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
// Arm length along its centre line: its top corner touches the ring's top.
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
// The S that splits the ring's hole: two half rings, logo_stroke wide.
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;

assert(slope_bottom > lower_jaw_bottom + inner_radius, "Block too wide for the spine; lower block_top_wall.");
assert(pin_hole_floor < top_jaw_thickness, "Pin hole floor above the top jaw.");
assert(screw_length > lower_jaw_thickness, "Screw shorter than the lower jaw.");

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "clamp") clamp_print();
else if (part == "screw") screw_print();

module print_layout() {
    clamp_print();
    translate([top_jaw_length + 5 + bar_length / 2, 0, 0]) screw_print();
}

module assembly() {
    color("Gainsboro") clamp();
    color("DimGray") translate([pin_x, clamp_width / 2, -table_shown - screw_length - bar_width])
        screw();
    // The arm's pin, the arm resting on the block.
    color("Silver") translate([pin_x, pin_y, block_top - 30]) cylinder(d = 12.5, h = 30);
    // A sharp table edge stands off the spine by the inner rounding.
    color("BurlyWood", 0.5) translate([inner_radius, -20, -table_shown])
        cube([120, clamp_width + 40, table_shown]);
}

// Lying on its y = 0 side.
module clamp_print()
    translate([0, (block_top + lower_jaw_bottom) / 2, 0]) rotate([90, 0, 0]) clamp();

// Lying on its flat, the bar's logo up, centred on the origin.
module screw_print()
    translate([0, (screw_length + bar_width) / 2, screw_axis_z]) rotate([90, 0, 0]) screw();

module clamp() {
    difference() {
        rotate([90, 0, 0]) translate([0, 0, -clamp_width]) chamfered_extrude(clamp_width, clamp_chamfer)
            profile();
        // Pin hole: a teardrop pointing +y, which is up on the bed, with a
        // 45 degree lead-in at the top.
        translate([pin_x, pin_y, pin_hole_floor]) {
            linear_extrude(pin_hole_depth + 1) teardrop(pin_r);
            translate([0, 0, pin_hole_depth - 1]) cylinder(r1 = pin_r, r2 = pin_r + 2, h = 2);
        }
        translate([pin_x, clamp_width / 2, lower_jaw_bottom]) thread_hole(lower_jaw_thickness);
        // Logo in the block's face towards the table, upright as seen from
        // the table.
        translate([block_right - logo_depth, clamp_width / 2,
                   (top_jaw_thickness + inner_radius + block_top - clamp_chamfer) / 2])
            rotate([90, 0, 90]) linear_extrude(logo_depth + 1) logo_sized(clamp_logo_height);
    }
}

// Extrudes the children from z = 0 to h with a 45 degree chamfer of c at both
// ends, in steps of one layer, each inset as at its middle.
module chamfered_extrude(h, c) {
    n = round(c / layer);
    union() {
        translate([0, 0, n * layer]) linear_extrude(h - 2 * n * layer) children();
        for (i = [0 : 1 : n - 1], z = [i * layer, h - (i + 1) * layer])
            translate([0, 0, z]) linear_extrude(layer) offset(delta = -(c - (i + 0.5) * layer)) children();
    }
}

// Side view of the clamp in the xz plane, x = 0 at the table edge, z = 0 on
// the table. The inner corners are rounded, the outer ones chamfered.
module profile() {
    s = spine_thickness;
    offset(r = -inner_radius) offset(delta = inner_radius) polygon(chamfer_corners([
        [-s, lower_jaw_bottom], [lower_jaw_length, lower_jaw_bottom],
        [lower_jaw_length, lower_jaw_top], [0, lower_jaw_top],
        [0, 0], [top_jaw_length, 0], [top_jaw_length, top_jaw_thickness],
        [block_right, top_jaw_thickness], [block_right, block_top],
        [block_left, block_top], [-s, slope_bottom]], clamp_chamfer));
}

// A counterclockwise polygon with each convex corner cut c along both edges.
function chamfer_corners(p, c) = [for (i = [0 : len(p) - 1])
    let(a = p[(i + len(p) - 1) % len(p)], b = p[i], d = p[(i + 1) % len(p)])
    each (cross(b - a, d - b) > 0 ? [b + c * (a - b) / norm(a - b), b + c * (d - b) / norm(d - b)] : [b])];

// Circle with a 45 degree point towards +y.
module teardrop(r)
    hull() {
        circle(r = r);
        translate([0, r * sqrt(2) - eps]) square(2 * eps, center = true);
    }

// Thread for the screw from z = 0 to depth, with a 45 degree lead-in at both
// ends.
module thread_hole(depth) {
    r = hole_d / 2;
    thread_h = 0.4 * thread_pitch;
    translate([0, 0, -1]) threaded_rod(hole_d, depth + 2, thread_pitch);
    for (end = [[0, 0], [depth, 180]]) translate([0, 0, end[0]]) rotate([end[1], 0, 0])
        translate([0, 0, -1]) cylinder(r1 = r + 1, r2 = r - thread_h, h = 1 + thread_h);
}

// Upright: the bar from z = 0 to bar_width, the thread above it. The side
// towards -y is cut flat; it is the underside on the bed.
module screw() {
    difference() {
        union() {
            bar();
            translate([0, 0, bar_width - eps]) intersection() {
                threaded_rod(thread_diameter, screw_length + eps, thread_pitch);
                cylinder(h = screw_length + eps, r1 = thread_diameter / 2 - tip_chamfer + screw_length,
                         r2 = thread_diameter / 2 - tip_chamfer);
            }
        }
        translate([-bar_length, -thread_diameter - screw_axis_z, -1])
            cube([2 * bar_length, thread_diameter, bar_width + screw_length + 2]);
        // Logo on the bar's +y face, its top towards the thread.
        translate([0, screw_axis_z - logo_depth, bar_width / 2])
            rotate([90, 0, 180]) linear_extrude(logo_depth + 1) logo_sized(bar_logo_height);
    }
}

// Along x, from z = 0 to bar_width, rounded ends, bar_thickness thick in y,
// its edges on both faces chamfered.
module bar()
    translate([0, bar_thickness / 2, bar_width / 2]) rotate([90, 0, 0]) hull() {
        linear_extrude(bar_thickness) offset(delta = -bar_chamfer) stadium();
        translate([0, 0, bar_chamfer]) linear_extrude(bar_thickness - 2 * bar_chamfer) stadium();
    }

// Bar outline seen along y, centred: x along the bar, y along the screw's axis.
module stadium()
    hull() for (s = [-1, 1]) translate([s * (bar_length - bar_width) / 2, 0]) circle(d = bar_width);

// The logo centred on the origin, `height` tall.
module logo_sized(height)
    scale(height / (2 * logo_r)) translate([0, -logo_r]) logo();

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

// Threaded rod of major diameter d from z = 0 to h: the screw's shank, and,
// with the clearance added, the shape cut for the thread. render() keeps the
// preview working with this many threads.
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
