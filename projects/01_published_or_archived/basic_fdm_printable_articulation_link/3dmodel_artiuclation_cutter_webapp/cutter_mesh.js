// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// ../articulation_cutter.scad in JavaScript, on Manifold: the link and one joint's
// cutter. Copy changes over by hand; test_cutter_mesh.js compares the volumes.
// Frames as in the .scad: the link's ring centre at the origin, its axis Y; a
// cutter's bed at z = 0, its pivot above x = y = 0, the ring link kept on +X.

export const defaults = {
    // the link, as in articulated_chain.scad
    ang: 55, w: 3, din: 3, dout: 2, dchain: 0.4,
    R_in: 2.095, R_loop: 3.253, foot_gap: 0.304,
    r_ring_fillet: 1, r_foot_side: 1, r_foot_bottom: 0.4,
    // the joint
    gap: 0.4, bend_angle: 15, link_clearance: 0.4, side_clearance: 1, loop_clearance: 1,
    fn: 64,
};

const sin = (deg) => Math.sin(deg * Math.PI / 180);
const cos = (deg) => Math.cos(deg * Math.PI / 180);
const tan = (deg) => Math.tan(deg * Math.PI / 180);
const add = (a, b, k = 1) => a.map((x, i) => x + k * b[i]);

// The values the .scad derives from the parameters.
export function derive(P) {
    const r_pin = P.din / 2;
    const R_out = P.R_in + P.dout;
    const pitch = 2 * R_out + P.dchain;
    const tilt = 90 - P.ang;
    const u = [cos(tilt), 0, sin(tilt)];
    const v = [-sin(tilt), 0, cos(tilt)];
    const B = [pitch, 0, 0];
    const M = add(B, u, -P.R_loop);
    const A = add(B, u, -2 * P.R_loop);
    const bed_z = A[2] - r_pin;
    return {
        r_pin, R_out, pitch, tilt, u, v, B, M, A, bed_z,
        d_back: -R_out,
        d_front: pitch * cos(tilt) - R_out - P.foot_gap,
        pivot_z: -bed_z,
        link_top: -bed_z + R_out,              // the ring's top above the bed
        link_width: 2 * (P.R_loop + r_pin),    // the loop's swing across, in Y
    };
}

// The modules of the .scad, on a loaded Manifold module. The link is built once.
export function cutter_lib(wasm, P = defaults) {
    const {Manifold, CrossSection} = wasm;
    const D = derive(P);
    const {r_pin, R_out, pitch, tilt, u, v, M, bed_z, d_back, d_front} = D;
    wasm.setCircularSegments(P.fn);
    const polygon = (points) => new CrossSection([points], "EvenOdd");
    // OpenSCAD's rotate([90, 0, 0]) linear_extrude(h, center = true) of an XZ outline.
    // scaleTop must be a pair: a number is read as [n, 0] and tapers the extrusion.
    const extrude_xz = (section, h) => section.extrude(h, 1, 0, [1, 1], true).rotate([90, 0, 0]);
    const torus = (R, r) => Manifold.revolve(CrossSection.circle(r).translate([R, 0]), 96);

    // Ring: annulus R_in..R_out, thickness w, all edges rounded r_ring_fillet.
    function ring() {
        const f = P.r_ring_fillet;
        const circles = [];
        for (const rr of [P.R_in + f, R_out - f])
            for (const yy of [-(P.w / 2 - f), P.w / 2 - f]) circles.push(CrossSection.circle(f).translate([rr, yy]));
        return CrossSection.hull(circles).revolve(P.fn).rotate([90, 0, 0]);
    }

    // Foot: slab between two planes perpendicular to u, standing on the bed, filling
    // the space under the ring. Rounded: r_foot_side on the 4 slanted edges,
    // r_foot_bottom on the bottom perimeter (a shrunk convex core, grown by a sphere).
    function foot_rounded() {
        const rb = P.r_foot_bottom, rs = P.r_foot_side;
        const core = CrossSection.square([d_front - d_back - 2 * rs, P.w - 2 * rs], true)
            .offset(rs - rb, "Round")
            .translate([(d_back + d_front) / 2, 0])
            .extrude(40, 1, 0, [1, 1], true)
            .rotate([0, -tilt, 0])
            .trimByPlane([0, 0, 1], bed_z + rb)   // above the bed
            .trimByPlane([0, 0, -1], -1);        // top well inside the ring
        return core.minkowskiSum(Manifold.sphere(rb, 24));
    }

    // Keeps only the foot region below the polyline T-O-F: the lower sector of the
    // ring between the back tangent point T and F, where the front face meets the ring.
    function foot_mask() {
        const T = u.map((x) => x * d_back);
        const s = d_front, t = -Math.sqrt(R_out * R_out - s * s);
        const F = add(u.map((x) => x * s), v, t);
        const k = 4;
        return extrude_xz(polygon([
            [T[0] - k * u[0], T[2] - k * u[2]], [0, 0], [F[0] + k * F[0], F[2] + k * F[2]],
            [F[0] + k * F[0], bed_z - 5], [T[0] - k * u[0], bed_z - 5],
        ]), P.w + 2);
    }

    function foot() {
        const r = P.R_in + P.r_ring_fillet;   // the ring's hole fillet zone stays free
        return Manifold.difference(
            Manifold.intersection(foot_rounded(), foot_mask()),
            Manifold.cylinder(P.w + 2, r, r, P.fn, true).rotate([90, 0, 0]));
    }

    // Loop: full torus through A, in its own foot, and B, the next ring's hole.
    const loop = () => torus(P.R_loop, r_pin).rotate([0, -tilt, 0]).translate(M);

    let the_link = null;
    function link() {
        if (!the_link) the_link = Manifold.union([ring(), foot(), loop()]);
        return the_link;
    }

    // The gap between the segments: a double cone around the X axis through the
    // pivot, clipped 1 mm outside the cutter box and 2 mm below the bed.
    function split_gap(width, height) {
        const gap_r = Math.hypot(width / 2 + 1, Math.max(height + 1 - D.pivot_z, D.pivot_z + 2));
        const gap_x = P.gap / 2 + gap_r * tan(P.bend_angle / 2);
        const cone = Manifold.revolve(polygon([[0, -P.gap / 2], [gap_r, -gap_x], [gap_r, gap_x], [0, P.gap / 2]]), P.fn)
            .rotate([0, 90, 0]);
        return Manifold.intersection(cone,
            Manifold.cube([2 * gap_x, width + 2, height + 3]).translate([-gap_x, -width / 2 - 1, bed_z - 2]));
    }

    // Room around the part of the ring link on -X: its outline seen along Y, the
    // ring's circle and the foot, the foot's faces running on 1 mm below the bed.
    function ring_link_clearance() {
        const s = d_front, t = -Math.sqrt(R_out * R_out - s * s);
        const F = add(u.map((x) => x * s), v, t);
        const T = u.map((x) => x * d_back);
        const zb = bed_z - 1;
        const outline = CrossSection.union(CrossSection.circle(R_out), polygon([
            [T[0], T[2]], [(d_back - u[2] * zb) / u[0], zb], [(d_front - u[2] * zb) / u[0], zb], [F[0], F[2]],
        ]));
        return Manifold.intersection(
            extrude_xz(outline.offset(P.link_clearance, "Round"), P.w + 2 * P.side_clearance),
            Manifold.cube([2 * R_out, 2 * P.w, R_out - bed_z + 3]).translate([-2 * R_out, -P.w, bed_z - 2]));
    }

    // Room around the loop on +X; the loop turning in the ring keeps to this torus.
    function loop_clearance_body() {
        return Manifold.intersection(
            torus(P.R_loop, r_pin + P.loop_clearance).rotate([0, -tilt, 0]).translate(M).translate([-pitch, 0, 0]),
            Manifold.cube(4 * P.R_loop).translate([-P.gap / 2, -2 * P.R_loop, -2 * P.R_loop]));
    }

    // One joint's cutter, bed at z = 0, for a model up to width across and height
    // high at the joint. The two links are left out of it: the ring link on +X,
    // the loop link on -X.
    function joint_cutter(width, height) {
        return Manifold.difference(
            Manifold.union([split_gap(width, height), ring_link_clearance(), loop_clearance_body()]),
            Manifold.union(link(), link().translate([-pitch, 0, 0])),
        ).translate([0, 0, D.pivot_z]);
    }

    // The demo bar of the .scad, without logos: joints cutters in a row.
    function demo(joints, spacing, bar_w = 16, bar_h = 13, bar_r = 3) {
        const len = (joints + 1) * spacing;
        const profile = CrossSection.hull([
            CrossSection.square([bar_w, 1]).translate([-bar_w / 2, 0]),
            CrossSection.circle(bar_r).translate([-(bar_w / 2 - bar_r), bar_h - bar_r]),
            CrossSection.circle(bar_r).translate([bar_w / 2 - bar_r, bar_h - bar_r]),
        ]);
        const bar = profile.extrude(len, 1, 0, [1, 1], true).rotate([90, 0, 90]);
        const cutters = [];
        for (let i = 0; i < joints; i++)
            cutters.push(joint_cutter(60, 40).translate([(i - (joints - 1) / 2) * spacing, 0, 0]));
        return Manifold.difference(bar, Manifold.union(cutters));
    }

    return {D, link, joint_cutter, demo};
}
