// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// articulated_chain.scad
// Parametric OpenSCAD recreation of Onshape part studio "most_simple_and_robust"
// (document "articulated_chain_long"). Print-in-place FDM articulated chain.
//
// Coordinate frame (same as Onshape):
//   X = chain direction, Z = up (print bed is the plane z = bed_z), Y = across.
//   Each link's ring centre sits at (i*pitch, 0, 0); the ring axis is Y.
// Units: mm, degrees.

/* [Onshape variables] */
ang    = 55;   // #ang    : tilt of the loop plane, measured from vertical
w      = 3;    // #w      : thickness of ring + foot along Y
din    = 3;    // #din    : diameter of the loop tube (the "pin")
dout   = 2;    // #dout   : radial wall width of the ring
dchain = 0.4;  // #dchain : gap between the outer circles of neighbouring rings

/* [Values solved in Onshape sketches, not driven by named variables] */
R_in     = 2.095;   // ring hole radius (gives 0.595 radial clearance to the tube)
R_loop   = 3.253;   // major radius of the loop torus (= half chord A..B)
foot_gap = 0.304;   // gap between foot front face and next link's foot back face, measured along u

/* [Fillets] */
r_ring_fillet = 1;    // Fillet 1: all ring edges (w=3, dout=2 -> stadium cross-section)
r_foot_side   = 1;    // Fillet 2: the four slanted foot edges
r_foot_bottom = 0.4;  // Fillet 3: foot bottom perimeter

/* [Chain] */
n_links = 2;          // Onshape had 2 (Point Pattern 1, one copy at -pitch)
$fn = 64;

// ---------- derived ----------
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

echo(pitch = pitch, bed_z = bed_z, M = M, A = A, d_front = d_front);

// ---------- parts ----------

// Ring: annulus R_in..R_out, thickness w, all edges rounded r_ring_fillet.
// With w=3, dout=2, r=1 the cross-section is a 2 x 3 stadium.
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
    // solve |p| = R_out, u.p = d_front
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

// Onshape Point Pattern placed the copy at -pitch; link i's loop threads link i+1's ring.
for (i = [0 : n_links - 1]) translate([-i * pitch, 0, 0]) link();
