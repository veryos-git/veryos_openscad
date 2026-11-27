// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// articulation_cutter.scad
// Turns a model into a print-in-place articulated model with the joint of
// articulated_chain.scad: model minus cutter. Like the Flexi-Cutter, but the
// joint is the chain's ring and loop.
//
// Frame: the model lies on the bed (z = 0) and runs along X. A joint at x = 0:
// its ring sits at y = 0 with its centre (the pivot) at z = -bed_z = 5.231.
// The segment on +X keeps the ring link, the segment on -X keeps the loop.
// Units: mm, degrees. Standalone: the link is copied from articulated_chain.scad.

/* [Output] */
// demo: test bar; cutter: subtract from a model (OpenSCAD difference, slicer
// negative part); keep: box minus cutter, intersect a model with it
part = "demo"; // [demo, cutter, keep]

/* [Joints] */
joints = 4;
joint_spacing = 15;   // at least pitch (8.591), or the links overlap

/* [Joint] */
gap = 0.4;            // between the two segments at the pivot
bend_angle = 15;      // how far a joint bends, in any direction, before the segments touch
link_clearance = 0.4; // around the ring link, where it reaches into the -X segment
side_clearance = 1;   // beside the ring link, along Y
loop_clearance = 1;   // around the loop, where it reaches into the +X segment

/* [Cutter size: covers the model's cross-section] */
cutter_width = 60;    // Y
cutter_height = 40;   // Z above the bed
keep_length = 300;    // X, for part = keep: covers the model's length

/* [Demo bar] */
demo_width = 16;
demo_height = 13;
demo_round = 3;       // radius of the top edges
logo_width = 9;
logo_depth = 0.6;

/* [Link, as in articulated_chain.scad] */
ang    = 55;   // tilt of the loop plane, measured from vertical
w      = 3;    // thickness of ring + foot along Y
din    = 3;    // diameter of the loop tube (the "pin")
dout   = 2;    // radial wall width of the ring
dchain = 0.4;  // gap between the outer circles of neighbouring rings
R_in     = 2.095;   // ring hole radius (gives 0.595 radial clearance to the tube)
R_loop   = 3.253;   // major radius of the loop torus (= half chord A..B)
foot_gap = 0.304;   // gap between foot front face and next link's foot back face, along u
r_ring_fillet = 1;    // all ring edges (w=3, dout=2 -> stadium cross-section)
r_foot_side   = 1;    // the four slanted foot edges
r_foot_bottom = 0.4;  // foot bottom perimeter
$fn = 64;

// ---------- derived, link ----------
r_pin  = din / 2;                          // 1.5
R_out  = R_in + dout;                      // 4.095
pitch  = 2 * R_out + dchain;               // 8.591
tilt   = 90 - ang;                         // 35 deg above horizontal
u      = [cos(tilt), 0, sin(tilt)];        // in-plane direction of the loop chord / foot normal
v      = [-sin(tilt), 0, cos(tilt)];       // loop torus axis
B      = [pitch, 0, 0];                    // next ring's centre (loop passes through its hole along Y)
M      = B - R_loop * u;                   // loop torus centre   ~(5.926, 0, -1.866)
A      = B - 2 * R_loop * u;               // loop anchor in own foot ~(3.262, 0, -3.731)
bed_z  = A[2] - r_pin;                     // -5.231 : tube is tangent to the bed at A
d_back  = -R_out;                          // back face plane  u.p = -R_out (tangent to own ring)
d_front = pitch * cos(tilt) - R_out - foot_gap;  // front face plane u.p = 2.637

// ---------- derived, cutter ----------
half_bend = bend_angle / 2;   // each face of the gap leans this far from the plane x = 0
pivot_z = -bed_z;
joint_x = [for (i = [0 : joints - 1]) (i - (joints - 1) / 2) * joint_spacing];
// The gap is a double cone around the X axis through the pivot. It is clipped
// 1 mm outside the cutter box and 2 mm below the bed, so a model that fills
// the box is cut through. gap_r reaches the clip box's farthest corner.
gap_r = norm([cutter_width / 2 + 1, max(cutter_height + 1 - pivot_z, pivot_z + 2)]);
gap_x = gap / 2 + gap_r * tan(half_bend);

assert(joint_spacing >= pitch, "joint_spacing must be at least pitch");

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

// ---------- link, as in articulated_chain.scad (ring centre at the origin) ----------

// Ring: annulus R_in..R_out, thickness w, all edges rounded r_ring_fillet.
module ring() {
    rotate([90, 0, 0])
        rotate_extrude()
            hull()
                for (rr = [R_in + r_ring_fillet, R_out - r_ring_fillet],
                     yy = [-(w/2 - r_ring_fillet), w/2 - r_ring_fillet])
                    translate([rr, yy]) circle(r = r_ring_fillet);
}

// Foot: slab between two planes perpendicular to u, standing on the bed,
// filling the space under the ring. Rounded: r_foot_side on the 4 slanted edges,
// r_foot_bottom on the bottom perimeter (built as minkowski of a shrunk convex core).
module foot_rounded() {
    rb = r_foot_bottom;
    minkowski() {
        intersection() {
            // slab in the tilted frame: local X = u, local Z = v
            rotate([0, -tilt, 0])
                linear_extrude(height = 40, center = true)
                    translate([(d_back + d_front) / 2, 0])
                        offset(r = r_foot_side - rb)
                            square([d_front - d_back - 2 * r_foot_side,
                                    w - 2 * r_foot_side], center = true);
            // above the bed, top well inside the ring
            translate([-20, -20, bed_z + rb]) cube([40, 40, -bed_z - rb + 1]);
        }
        sphere(r = rb, $fn = 24);
    }
}

// 2D mask (XZ) keeping only the foot region below the polyline T-O-F,
// i.e. the lower sector of the ring between the back tangent point and F.
module foot_mask() {
    T = d_back * u;                       // back tangent point (-3.354, -2.349)
    // F = intersection of the front plane with the outer ring circle (lower one)
    s = d_front;  t = -sqrt(R_out * R_out - s * s);
    F = s * u + t * v;                    // (3.957, -1.054)
    k = 4;
    rotate([90, 0, 0])
        linear_extrude(height = w + 2, center = true)
            polygon([[T[0] - k*u[0], T[2] - k*u[2]], [0, 0],
                     [F[0] + k*F[0], F[2] + k*F[2]],
                     [F[0] + k*F[0], bed_z - 5], [T[0] - k*u[0], bed_z - 5]]);
}

module foot() {
    difference() {
        intersection() { foot_rounded(); foot_mask(); }
        // keep the ring's hole fillet zone free (flat side faces start at r = R_in + fillet)
        rotate([90, 0, 0]) cylinder(r = R_in + r_ring_fillet, h = w + 2, center = true);
    }
}

// Loop: full torus, tube r_pin, through A (anchored in own foot) and B (through next ring's hole).
module loop() {
    translate(M) rotate([0, -tilt, 0])
        rotate_extrude($fn = 96) translate([R_loop, 0]) circle(r = r_pin);
}

module link() {
    union() { ring(); foot(); loop(); }
}

// ---------- joint, in the link's frame (ring centre at the origin) ----------

// The gap between the segments: |x| <= gap/2 + tan(half_bend) * distance from
// the X axis, so one segment turns bend_angle about the pivot, in any
// direction, before its face meets the other's.
module split_gap() {
    intersection() {
        rotate([0, 90, 0]) rotate_extrude()
            polygon([[0, -gap / 2], [gap_r, -gap_x], [gap_r, gap_x], [0, gap / 2]]);
        translate([-gap_x, -cutter_width / 2 - 1, bed_z - 2])
            cube([2 * gap_x, cutter_width + 2, cutter_height + 3]);
    }
}

// The ring link's outline seen along Y: the ring's outer circle and the foot,
// whose faces run on 1 mm below the bed so the cut goes through the bottom.
module link_outline() {
    s = d_front;  t = -sqrt(R_out * R_out - s * s);
    F = s * u + t * v;                    // front face meets the ring, as in foot_mask()
    T = d_back * u;                       // back face touches the ring
    zb = bed_z - 1;
    circle(r = R_out);
    polygon([[T[0], T[2]], [(d_back - u[2] * zb) / u[0], zb],
             [(d_front - u[2] * zb) / u[0], zb], [F[0], F[2]]]);
}

// Room around the part of the ring link on -X, so it stays free of the -X
// segment. On +X the link is part of its own segment.
module ring_link_clearance() {
    intersection() {
        rotate([90, 0, 0])
            linear_extrude(height = w + 2 * side_clearance, center = true)
                offset(r = link_clearance) link_outline();
        translate([-2 * R_out, -w, bed_z - 2]) cube([2 * R_out, 2 * w, R_out - bed_z + 3]);
    }
}

// Room around the loop on +X, so it stays free of the +X segment. The loop
// turning in the ring keeps to this torus.
module loop_clearance_body() {
    intersection() {
        translate([-pitch, 0, 0]) translate(M) rotate([0, -tilt, 0])
            rotate_extrude($fn = 96) translate([R_loop, 0]) circle(r = r_pin + loop_clearance);
        translate([-gap / 2, -2 * R_loop, -2 * R_loop]) cube(4 * R_loop);
    }
}

// One joint's cutter, bed at z = 0. The two links are left out of it, so they
// keep the model's material: the ring link on +X, the loop link on -X.
module joint_cutter() {
    translate([0, 0, pivot_z]) difference() {
        union() { split_gap(); ring_link_clearance(); loop_clearance_body(); }
        link();
        translate([-pitch, 0, 0]) link();
    }
}

module cutters() {
    for (x = joint_x) translate([x, 0, 0]) joint_cutter();
}

// ---------- demo bar ----------

module demo_bar() {
    len = (joints + 1) * joint_spacing;
    rotate([90, 0, 90]) translate([0, 0, -len / 2]) linear_extrude(height = len)
        hull() {
            translate([-demo_width / 2, 0]) square([demo_width, 1]);
            for (m = [-1, 1])
                translate([m * (demo_width / 2 - demo_round), demo_height - demo_round])
                    circle(r = demo_round);
        }
}

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

// A logo on the top of each segment, readable from -Y.
module logo_cuts() {
    for (k = [0 : joints])
        translate([joint_x[0] + (k - 0.5) * joint_spacing, 0, demo_height - logo_depth])
            linear_extrude(logo_depth + 1)
                scale(logo_width / logo_w) translate([0, -logo_r]) logo();
}

if (part == "demo")
    difference() { demo_bar(); cutters(); logo_cuts(); }
else if (part == "cutter")
    cutters();
else if (part == "keep")
    difference() {
        translate([-keep_length / 2, -cutter_width / 2, -1])
            cube([keep_length, cutter_width, cutter_height + 1]);
        cutters();
    }
