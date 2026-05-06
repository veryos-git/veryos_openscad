// ================================================================
// "Now Playing" Vinyl Record Display Stand
// ================================================================
// Title:    Now Playing - Vinyl Display Stand
// Author:   <your name here>
// License:  CC0 1.0 (public domain dedication)
//
// Two printable part types, all flat on the bed, letters facing up:
//     * baseplate  - rectangular stand with two full-width grooves
//     * text_plate - underline bar + "Now Playing" (print TWO copies,
//                    one for each groove)
// A 12" record sleeve stands upright in the gap between the two plates.
//
// Recommended slicer settings:
//     Layer height : 0.2 mm
//     Infill       : 20%
//     Walls        : 3 perimeters
//     Supports     : none required in the default orientation
//
// Listing available fonts:
//     `openscad --info` on the command line, or Help > Font List
//     inside the OpenSCAD GUI.
// ================================================================

/* [Text] */
display_text      = "NOW PLAYING";
font_family       = "Liberation Sans:style=Bold";
font_size         = 40;
letter_spacing    = 1.0;   // passed to text(spacing = ...)
text_thickness    = 5;     // extrusion height of both letters and bar
bar_height        = 6;     // visible bar height above the baseplate
extra_bar_overlap = 3;     // how far the bar reaches up into glyphs.
                           // Some fonts draw rounded caps (O, G, C)
                           // slightly above the reported baseline, so
                           // a generous overlap guarantees every glyph
                           // fuses with the bar. Raise further if any
                           // letter still shows a gap.

/* [Baseplate] */
base_thickness     = 8;
base_depth         = 40;   // front-to-back dimension (Y)
vinyl_gap          = 18;   // clear space between grooves (sleeve ~3-6 mm)
base_margin        = 20;   // extra base length past the text on each side
base_corner_radius = 3;    // rounded baseplate corners

/* [Fit / Print] */
tolerance    = 0.15;       // single knob - propagates everywhere
groove_depth = 4;          // clamped internally to at most base_thickness/2
$fa = 2;
$fs = 0.4;

/* [Advanced] */
// OpenSCAD cannot measure rendered text, so the base length is estimated
// from a generous per-character factor (option (a) in the design spec).
// If the estimate looks too loose or too tight for your chosen font,
// measure the text in the preview and set this value > 0 to force an
// exact plate length.
text_width_override = 0;

/* [Output] */
// Render a single part, or lay them out flat on the bed for a visual
// check (this is NOT an assembly view). Both text plates are identical,
// so the single "text_plate" option is what you print twice.
part = "all"; // [all, baseplate, text_plate]

// ---------------------------------------------------------------
// Derived values - do not edit, change the parameters above instead
// ---------------------------------------------------------------
groove_width  = text_thickness + 2 * tolerance;         // 5.30 by default
safe_groove_d = min(groove_depth, base_thickness / 2);  // never > half base
eps           = 0.02;                                   // cleanup fudge

function est_text_width(txt) =
    text_width_override > 0
        ? text_width_override
        : len(txt) * font_size * 0.65 + 8;

// Baseplate runs the full length; both grooves span it edge-to-edge.
function base_length() = est_text_width(display_text) + 2 * base_margin;

// Each text plate is slightly shorter than the groove so it drops in
// with a little play along its length.
function plate_length() = base_length() - 2 * tolerance;

// ---------------------------------------------------------------
// Modules
// ---------------------------------------------------------------

// Underline bar unioned with extruded letters into a single body.
// Local frame:
//     X : plate length, centered on 0 (matches base_length - play)
//     Y : bar bottom at -safe_groove_d, bar top at +bar_height
//     Z : 0 up to text_thickness (lies flat on the bed)
//
// The lowest safe_groove_d of the plate is letter-free by construction:
// letters are placed with baseline at (bar_height - extra_bar_overlap)
// and then intersected with y >= 0 so no descender leaks into the
// groove region, guaranteeing a predictable rectangular press-fit.
module text_plate() {
    w = plate_length();
    linear_extrude(height = text_thickness) {
        union() {
            // -------- underline bar (full plate footprint) --------
            translate([-w/2, -safe_groove_d])
                square([w, safe_groove_d + bar_height]);

            // -------- letters, clipped above the groove line ------
            intersection() {
                translate([0, bar_height - extra_bar_overlap])
                    text(display_text,
                         size    = font_size,
                         font    = font_family,
                         spacing = letter_spacing,
                         halign  = "center",
                         valign  = "baseline");
                // Keep only the portion above y = 0 (above the groove).
                translate([-w, 0])
                    square([2*w, font_size * 3]);
            }
        }
    }
}

// A full-width groove cut - positive solid, subtracted from the base.
// Runs the entire length of the baseplate (edge to edge).
module groove_cutter() {
    L = base_length();
    translate([-(L/2 + eps),
               -groove_width/2,
                base_thickness - safe_groove_d])
        cube([L + 2*eps, groove_width, safe_groove_d + eps]);
}

// Rounded rectangular slab with two parallel full-width grooves.
module baseplate() {
    L = base_length();
    W = base_depth;
    r = min(base_corner_radius, min(L, W)/2 - 0.1);

    difference() {
        linear_extrude(height = base_thickness)
            offset(r = r)
                square([L - 2*r, W - 2*r], center = true);

        // Groove A - on the -Y side of the base
        translate([0, -(vinyl_gap/2 + groove_width/2), 0])
            groove_cutter();

        // Groove B - on the +Y side of the base
        translate([0,  (vinyl_gap/2 + groove_width/2), 0])
            groove_cutter();
    }
}

// ---------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------

if (part == "baseplate") {
    baseplate();
} else if (part == "text_plate") {
    text_plate();
} else {
    // "all" - flat preview: baseplate plus TWO identical text plates
    // stacked above it in Y. Print both plates from the same STL.
    gap         = 15;
    plate_h_y   = safe_groove_d + bar_height + font_size * 1.1;

    baseplate();

    translate([0, base_depth/2 + gap + safe_groove_d, 0])
        text_plate();

    translate([0, base_depth/2 + gap + safe_groove_d + plate_h_y + gap, 0])
        text_plate();
}
