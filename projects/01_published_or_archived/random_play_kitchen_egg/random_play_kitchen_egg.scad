// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details

// Stylized sunny-side-up fried egg for a children's play kitchen.
// Each seed produces a different, but plausibly egg-shaped, result.

/* [Seed] */
seed             = 42;

/* [Outline] */
n_points         = 12;
base_radius      = 70;     // mm
radius_jitter    = 0.40;   // fractional, clamped to (0, 0.95)
angle_jitter     = 8;      // degrees

/* [White] */
white_height     = 2;
edge_round       = 2;

/* [Yolk] */
yolk_radius      = 20;
yolk_offset_max  = 8;
yolk_sink        = 2.5;

/* [Quality] */
$fn              = 128;
SAMPLES_PER_SEG  = 12;     // spline samples per control segment
ROUND_LAYERS     = 10;      // layers used to approximate the top edge round

// ---------- Helpers ----------

// Jittered control points around a circle. Deterministic in `s`.
function outline_points(s, n, r, rj, aj) =
    let (rj_safe = min(rj, 0.95))
    [ for (i = [0 : n - 1])
        let (
            ba  = i * 360 / n,
            dr  = rands(-rj_safe, rj_safe, 1, s + i)[0],
            da  = rands(-aj,      aj,      1, s + 1000 + i)[0],
            rad = r * (1 + dr),
            ang = ba + da
        )
        [ rad * cos(ang), rad * sin(ang) ]
    ];

// Standard centripetal-style Catmull-Rom with uniform tension 0.5.
// Returns the [x,y] point on the segment p1->p2 at parameter t in [0,1].
function cr_point(p0, p1, p2, p3, t) =
    let (t2 = t * t, t3 = t2 * t)
    [ for (k = [0, 1])
        0.5 * (
            (2 * p1[k]) +
            (-p0[k] + p2[k]) * t +
            (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
            (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3
        )
    ];

// Closed Catmull-Rom: indices wrap so the spline returns to its start.
function cr_spline_closed(pts, samples) =
    let (n = len(pts))
    [ for (i = [0 : n - 1], s = [0 : samples - 1])
        cr_point(
            pts[(i + n - 1) % n],
            pts[i],
            pts[(i + 1) % n],
            pts[(i + 2) % n],
            s / samples
        )
    ];

function min_radius(pts) =
    min([ for (p = pts) sqrt(p[0] * p[0] + p[1] * p[1]) ]);

// Yolk centre offset, clamped so the yolk + edge round + safety margin
// always fits inside the white outline.
function yolk_offset(s, max_mag, min_r, yolk_r, er) =
    let (
        safe = min(max_mag, max(0, min_r - yolk_r - er - 2)),
        ang  = rands(0, 360,  1, s + 7777)[0],
        mag  = rands(0, safe, 1, s + 8888)[0]
    )
    [ mag * cos(ang), mag * sin(ang) ];

// ---------- Geometry ----------

module rounded_top_slab(profile) {
    // Flat skirt: untouched profile from z = 0 to the start of the round.
    linear_extrude(height = white_height - edge_round)
        polygon(points = profile);

    // Crown: stack thin layers whose 2D inset traces a quarter-arc to
    // approximate a rounded top edge. Bottom of the crown is the full
    // profile; top is offset(-edge_round).
    for (i = [0 : ROUND_LAYERS - 1]) {
        a_lo  = i       * 90 / ROUND_LAYERS;
        a_hi  = (i + 1) * 90 / ROUND_LAYERS;
        z_lo  = (white_height - edge_round) + edge_round * sin(a_lo);
        z_hi  = (white_height - edge_round) + edge_round * sin(a_hi);
        inset = edge_round * (1 - cos(a_hi));
        translate([0, 0, z_lo])
            linear_extrude(height = z_hi - z_lo)
                offset(r = -inset)
                    polygon(points = profile);
    }
}

module yolk_dome(center_xy) {
    translate([center_xy[0], center_xy[1], white_height - yolk_sink])
        intersection() {
            sphere(r = yolk_radius);
            // Half-space z >= white_height in world coords. In this
            // translated frame that is local z >= yolk_sink, so a tall
            // cylinder placed at z = yolk_sink keeps only the upper cap.
            translate([0, 0, yolk_sink])
                cylinder(r = yolk_radius + 1, h = yolk_radius + 1);
        }
}

module fried_egg(seed = 42) {
    pts     = outline_points(seed, n_points, base_radius,
                             radius_jitter, angle_jitter);
    profile = cr_spline_closed(pts, SAMPLES_PER_SEG);
    yxy     = yolk_offset(seed, yolk_offset_max,
                          min_radius(pts), yolk_radius, edge_round);
    union() {
        rounded_top_slab(profile);
        yolk_dome(yxy);
    }
}

fried_egg(seed);
