/*
 * Parametric Wind Spinner
 *
 * Prints flat on the build plate. After printing:
 * 1. Peel spinner and rod off the bed
 * 2. Twist the spinner rings progressively by hand
 * 3. Thread the rod through the top and bottom hooks
 *    (rod loop catches at top, rod catch catches at bottom)
 * 4. Hang from a string through the rod's top loop
 */

// ==========================================
// Parameters
// ==========================================

/* [Shape] */
sides         = 6;     // Polygon sides (0 = circle)
radius        = 80;    // Outer radius (mm)
num_rings     = 15;    // Number of concentric rings
ring_width    = 1.2;   // Ring wall thickness (mm)
ring_gap      = 2.5;   // Gap between rings (mm)
rotation_step = 3;     // Rotation per ring (degrees)

/* [Print] */
thickness     = 0.6;   // Print height (mm), e.g. 2 layers at 0.3

/* [Spine] */
spine_width   = 3.0;   // Connecting bar width (mm)

/* [Rod] */
rod_width     = 2.0;   // Rod strip width (mm)
rod_clearance = 0.3;   // Fit clearance (mm)

/* [Hooks] */
hook_od       = 10;    // Hook outer diameter (mm)
hook_id       = 4;     // Hook hole diameter (mm)

/* [Render] */
$fn = 64;

// ==========================================
// Derived values
// ==========================================

eff_n = (sides < 3) ? 128 : sides;

// Y extents of the outermost polygon (vertex pointing up)
top_y = radius;
bot_y = radius * min([for (k = [0 : eff_n - 1]) sin(90 + k * 360 / eff_n)]);

// How many rings actually fit
_max_rings = floor((radius - ring_width) / (ring_width + ring_gap)) + 1;
n_rings    = min(num_rings, max(1, _max_rings));

// Ring i outer radius
function ring_r(i) = radius - i * (ring_width + ring_gap);

// Hook Y positions
top_hook_y = top_y + hook_od / 2;
bot_hook_y = bot_y - hook_od / 2;

// ==========================================
// 2D primitives
// ==========================================

// Regular polygon with a vertex pointing straight up
module poly(r) {
    rotate(90) circle(r, $fn = eff_n);
}

// Polygon outline ring
module poly_ring(r, w) {
    difference() {
        poly(r);
        poly(r - w);
    }
}

// ==========================================
// Spinner body (2D profile)
// ==========================================

module all_rings() {
    for (i = [0 : n_rings - 1]) {
        r = ring_r(i);
        if (r > ring_width)
            rotate(i * rotation_step)
                poly_ring(r, ring_width);
    }
}

module spine() {
    h = top_y - bot_y;
    translate([0, bot_y + h / 2])
        square([spine_width, h], center = true);
}

module hook(cy) {
    translate([0, cy])
        difference() {
            circle(d = hook_od);
            circle(d = hook_id);
        }
}

module hook_bridge(cy, spine_end_y) {
    bh = abs(cy - spine_end_y);
    translate([0, (cy + spine_end_y) / 2])
        square([spine_width, bh], center = true);
}

module spinner_2d() {
    all_rings();
    spine();
    hook(top_hook_y);
    hook_bridge(top_hook_y, top_y);
    hook(bot_hook_y);
    hook_bridge(bot_hook_y, bot_y);
}

module spinner() {
    linear_extrude(thickness)
        spinner_2d();
}

// ==========================================
// Rod (2D profile)
// ==========================================

// Rod length: spans hook-to-hook distance + extra for loop and catch
rod_span  = top_hook_y - bot_hook_y;
rod_extra = hook_od / 2 + 5;          // loop protrusion + catch protrusion
rod_len   = rod_span + rod_extra * 2;

catch_d = hook_id + 2;  // bottom catch: wider than hook hole

module rod_2d() {
    // Shaft
    square([rod_width, rod_len], center = true);

    // Top loop (for hanging string; wider than hook hole = catches)
    translate([0, rod_len / 2 + hook_od / 2]) {
        difference() {
            circle(d = hook_od);
            circle(d = hook_id);
        }
    }
    translate([0, rod_len / 2 + hook_od / 4])
        square([rod_width, hook_od / 2], center = true);

    // Bottom catch (circle wider than hook hole)
    translate([0, -rod_len / 2 - catch_d / 2])
        circle(d = catch_d);
    translate([0, -rod_len / 2 - catch_d / 4])
        square([rod_width, catch_d / 2], center = true);
}

module rod() {
    linear_extrude(thickness)
        rod_2d();
}

// ==========================================
// Printable layout
// ==========================================

module wind_spinner() {
    spinner();
    // Place the rod beside the spinner
    translate([radius + 20, 0, 0])
        rod();
}

wind_spinner();
