// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// V2: cylindrical screw container with optional exterior grip patterns. Units: mm.
// Single-start right-hand thread with 45 degree flanks.
// No external libraries. Print the lid open-side up.
// Texture adds material OUTSIDE outer_diameter; maximum diameter is
// outer_diameter + 2*pattern_depth. The cavity, neck, and screw fit stay unchanged.
// Choose "none" to recover the original smooth container.
// The matching JSON file supplies seven Customizer presets; see pattern_preview.png.

/* [Display] */
view = "print"; // [print,container,lid,assembled,section]
quality = 128; // [64,128,192]

/* [Object] */
// Nominal closed height, including the lid roof, before alignment adjustment.
full_height = 80;
outer_diameter = 40;
// Body, neck, floor, lid roof, and minimum lid wall thickness.
wall_thickness = 1.2;
thread_pitch = 2.0;

/* [Base] */
// 0 fits the neck inside the lid automatically; a positive value overrides
// its height above the shoulder, independently of the thread height.
neck_height = 10;
// Axial lead-in length on the external thread and neck rim; 0 disables.
base_thread_entry_chamfer = 1;
// Exterior edge bevel, at 45 degrees; 0 disables.
base_chamfer = 0.5;
// Raise the flat shoulder BELOW the external thread to stop the lid earlier.
// This adds a seating surface; it does not thicken the helical thread flanks.
// 0 disables. Positive values also increase the closed height by this amount.
// Starting estimate: extrusion = thread_pitch * measured_overshoot_degrees / 360.
// Example: 0.10 mm at 1.2 mm pitch stops about 30 degrees earlier. Fine-tune
// against the printed markings, since actual seating depends on print fit.
external_thread_top_surface_extrusion = 0.2;

/* [Lid] */
// Total height of the lid, including its roof.
lid_height = 20;
// Threaded band at the opening AND matching band at the base shoulder.
// The rest of the neck and lid bore are smooth, allowing the lid to slide on.
lid_thread_height = 5;
// Axial lead-in length at the threaded opening; 0 disables.
lid_thread_entry_chamfer = 1;
// Exterior edge bevel, at 45 degrees; 0 disables.
lid_chamfer = 0.5;

/* [Optional outer chamfers] */
// Top/bottom refer to the assembled orientation, on both parts.
top_chamfer_enabled = true;
bottom_chamfer_enabled = true;

/* [Exterior pattern] */
exterior_pattern = "ribs"; // [none:Smooth original,ribs:Fine round ribs,flutes:Broad rounded flutes,spiral:Spiral ribs,diamond:Diamond knurl,waves:Wavy ribs,chevron:Chevron ribs]
pattern_on_container = true;
pattern_on_lid = true;
// Added radial height; 0 also disables the pattern.
pattern_depth = 0.6; // [0:0.1:2]
// Repeats around the circumference. Try 64 for fine ribs or 24 for broad flutes.
pattern_count = 48; // [12:1:96]
// Smooth band at each end, measured from the part edge; respects chamfers.
pattern_margin = 1.2; // [0:0.1:5]
// Vertical repeat for diamonds, waves, and chevrons.
pattern_pitch = 12; // [4:0.5:40]
// Total spiral rotation over full_height; negative reverses the direction.
pattern_twist = 90; // [-360:5:360]

/* [Fit] */
// Radial clearance per side; increase slightly if your printed fit is tight.
radial_clearance = 0.15;
// Total additional groove width, measured along the cylinder axis.
axial_clearance = 0.05;
// Minimum space between the neck rim and the underside of the lid roof.
rim_clearance = 0.2;

/* [Hidden] */
$fn = quality;
eps = 0.02;
thread_depth = 0.4 * thread_pitch;
crest_flat = 0.1 * thread_pitch;
outer_r = outer_diameter / 2;
texture_depth = exterior_pattern != "none" && (pattern_on_container || pattern_on_lid)
    ? pattern_depth : 0;
neck_r = outer_r - wall_thickness - radial_clearance - thread_depth;
inner_r = neck_r - wall_thickness;
body_inner_r = outer_r - wall_thickness;
shoulder_z = full_height - lid_height;
alignment_stop_z = shoulder_z + external_thread_top_surface_extrusion;
// Raising the lid by one pitch corresponds to one counterclockwise turn,
// viewed from above. Applying both transforms preserves the thread phase.
alignment_stop_angle = 360*external_thread_top_surface_extrusion/thread_pitch;
lid_cavity_height = lid_height - wall_thickness;
neck_h = neck_height == 0 ? lid_cavity_height-rim_clearance : neck_height;
container_height = shoulder_z + neck_h;
// A 45 degree inner transition keeps the body wall at the requested size
// while supporting the smaller neck above it.
inner_transition = body_inner_r - inner_r;
base_top_chamfer = top_chamfer_enabled ? base_chamfer : 0;
base_bottom_chamfer = bottom_chamfer_enabled ? base_chamfer : 0;
lid_top_chamfer = top_chamfer_enabled ? lid_chamfer : 0;
lid_bottom_chamfer = bottom_chamfer_enabled ? lid_chamfer : 0;
// Limit radial relief to the thread depth so a 1 mm lead-in does not
// consume the thin neck or lid wall. The lead-in length is measured axially.
base_entry_relief = min(base_thread_entry_chamfer, thread_depth);
lid_entry_relief = min(lid_thread_entry_chamfer, thread_depth);
// Keep the rim bevel above the thread band, including for very short necks.
neck_rim_chamfer = min(base_thread_entry_chamfer, max(0, neck_h-lid_thread_height));
neck_rim_relief = base_thread_entry_chamfer > 0
    ? base_entry_relief*neck_rim_chamfer/base_thread_entry_chamfer : 0;

assert(inner_r > 0 && wall_thickness > 0, "Diameter is too small for these walls");
assert(shoulder_z > wall_thickness+inner_transition,
       "Full height must leave enough base below the lid for the floor and neck transition");
assert(lid_cavity_height > 0 && rim_clearance >= 0);
assert(thread_pitch > 0 && lid_thread_height >= 2*thread_pitch,
       "Thread height must accommodate at least two pitches");
assert(neck_height >= 0 && neck_h >= lid_thread_height &&
       neck_h+rim_clearance <= lid_cavity_height+eps,
       "Neck must cover the thread band and fit below the lid roof");
assert(radial_clearance > 0 && radial_clearance < thread_depth,
       "Radial clearance must be positive and smaller than the thread depth");
assert(axial_clearance >= 0 && axial_clearance < 0.1 * thread_pitch,
       "Axial clearance must be less than 10% of the pitch");
assert(base_thread_entry_chamfer >= 0 && base_thread_entry_chamfer < lid_thread_height &&
       base_entry_relief < wall_thickness,
       "Base lead-in must leave a thread band and material at the neck rim");
assert(lid_thread_entry_chamfer >= 0 && lid_thread_entry_chamfer+thread_depth < lid_thread_height,
       "Lid lead-in and thread exit must leave an engaging thread band");
assert(external_thread_top_surface_extrusion >= 0 &&
       external_thread_top_surface_extrusion < thread_pitch,
       "Alignment extrusion must be nonnegative and less than one thread pitch");
assert(external_thread_top_surface_extrusion == 0 ||
       external_thread_top_surface_extrusion+base_thread_entry_chamfer+lid_thread_entry_chamfer < lid_thread_height,
       "Alignment extrusion must leave overlap between the full-depth thread bands");
assert(base_chamfer >= 0 && base_chamfer < wall_thickness);
assert(lid_chamfer >= 0 && lid_chamfer < wall_thickness);
assert(base_top_chamfer+base_bottom_chamfer < shoulder_z &&
       lid_top_chamfer+lid_bottom_chamfer < lid_height);
assert(quality >= 32 && quality == floor(quality));
assert(view == "print" || view == "container" || view == "lid" ||
       view == "assembled" || view == "section", "Unknown view");
assert(exterior_pattern == "none" || exterior_pattern == "ribs" ||
       exterior_pattern == "flutes" || exterior_pattern == "spiral" ||
       exterior_pattern == "diamond" || exterior_pattern == "waves" ||
       exterior_pattern == "chevron", "Unknown exterior pattern");
assert(pattern_depth >= 0 && pattern_margin >= 0,
       "Pattern depth and edge margin must be nonnegative");
assert(pattern_count >= 3 && pattern_count == floor(pattern_count),
       "Pattern count must be a whole number of at least three");
assert(pattern_pitch > 0, "Pattern pitch must be positive");

function triangle_wave(a) = 1-acos(cos(a))/180;
function fraction(x) = x-floor(x);
function pattern_shift(z) =
    exterior_pattern == "spiral" ? pattern_twist*z/full_height :
    exterior_pattern == "waves" ? 360/pattern_count*sin(360*z/pattern_pitch) :
    exterior_pattern == "chevron" ? 360/pattern_count*(4*abs(fraction(z/pattern_pitch)-0.5)-1) : 0;

// All profiles range from 0 to 1. The diamond is a field of raised pyramids,
// with alternating rows offset by half a cell, like a conventional knurl.
function pattern_profile(a, z) =
    let(phase = a*pattern_count)
    exterior_pattern == "diamond" ?
        min(triangle_wave(phase+360*z/pattern_pitch),
            triangle_wave(phase-360*z/pattern_pitch)) :
    exterior_pattern == "flutes" ? (1+cos(phase))/2 :
    max(0, cos(phase-pattern_count*pattern_shift(z)));

// A single closed mesh avoids hundreds of overlapping rib solids. Its core
// sits inside the original wall; only the raised relief protrudes. The original
// body/lid blank remains underneath, so texture never removes wall material.
module exterior_relief(h, bottom_bevel, top_bevel, enabled, z_origin = 0, angle_origin = 0) {
    if (enabled && exterior_pattern != "none" && pattern_depth > 0) {
        low = max(pattern_margin, bottom_bevel);
        high = h-max(pattern_margin, top_bevel);
        assert(high-low > 2*eps,
               "Pattern margin/chamfers leave no textured area; reduce the margin or disable this part's pattern");
        fade = min(pattern_depth, (high-low)/3);
        samples = max(12, ceil(quality/32)*4);
        segments = max(quality, pattern_count*samples);
        // Constant profiles need only the two end ramps and a straight middle.
        straight = exterior_pattern == "ribs" || exterior_pattern == "flutes" ||
                   (exterior_pattern == "spiral" && pattern_twist == 0);
        step = exterior_pattern == "spiral"
            ? full_height*360/(max(abs(pattern_twist), eps)*pattern_count*samples)
            : pattern_pitch/(2*samples);
        rows = max(1, ceil((high-low-2*fade)/step));
        levels = straight ? [low, low+fade, high-fade, high] :
            concat([low], [for (i = [0:rows]) low+fade+(high-low-2*fade)*i/rows], [high]);
        // The overlap exceeds the core cylinder's facet sagitta even at low quality.
        root_r = outer_r*cos(180/quality)-eps;
        // Follow the ribs with the mesh vertices, avoiding stair-stepped edges
        // on curved patterns and preserving the lid's full peak depth.
        points = [for (z = levels, j = [0:segments-1])
            let(a = j*360/segments+pattern_shift(z+z_origin)-angle_origin,
                taper = min(1, (z-low)/fade, (high-z)/fade),
                r = root_r+(outer_r+pattern_depth-root_r)*taper*
                    pattern_profile(a+angle_origin, z+z_origin))
            [r*cos(a), r*sin(a), z]];
        faces = concat(
            [[for (j = [0:segments-1]) j]],
            [for (i = [0:len(levels)-2], j = [0:segments-1])
                [i*segments+j, (i+1)*segments+j, (i+1)*segments+(j+1)%segments]],
            [for (i = [0:len(levels)-2], j = [0:segments-1])
                [i*segments+j, (i+1)*segments+(j+1)%segments, i*segments+(j+1)%segments]],
            [[for (j = [segments-1:-1:0]) (len(levels)-1)*segments+j]]);
        polyhedron(points = points, faces = faces, convexity = 16);
    }
}

// Sweep a trapezoid around a right-handed helix. Equal radial depth and
// axial flank run give 45 degree flanks (90 degree included angle).
// Both sweeps extend beyond the band and are clipped by their callers.
// Their height depends only on the thread band, never on neck or lid height.
module thread_ridge(female = false) {
    start_z = -thread_pitch;
    end_z = lid_thread_height + thread_pitch;
    steps = ceil((end_z - start_z) / thread_pitch * quality);
    root = neck_r + (female ? radial_clearance : 0);
    play = female ? axial_clearance / 2 : 0;
    points = [for (i = [0:steps])
        let(z = start_z + (end_z - start_z) * i / steps,
            a = 360 * z / thread_pitch,
            depth = thread_depth,
            half_tip = crest_flat / 2 + play,
            profile = [[root - eps, -half_tip - depth - eps],
                       [root + depth, -half_tip],
                       [root + depth, half_tip],
                       [root - eps, half_tip + depth + eps]])
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

module container() {
    difference() {
        union() {
            rotate_extrude() polygon([
                [0, 0], [outer_r-base_bottom_chamfer, 0],
                [outer_r, base_bottom_chamfer], [outer_r, shoulder_z-base_top_chamfer],
                [outer_r-base_top_chamfer, shoulder_z],
                // Extend the existing flat shoulder upward, keeping the
                // original neck and helix position. It meets the lid rim.
                if (external_thread_top_surface_extrusion > 0)
                    [outer_r-base_top_chamfer, alignment_stop_z],
                [0, alignment_stop_z]]);
            exterior_relief(shoulder_z, base_bottom_chamfer, base_top_chamfer,
                            pattern_on_container);
            translate([0, 0, shoulder_z]) {
                // Smooth neck slides through the lid's threaded opening.
                rotate_extrude() polygon([
                    [0, -eps], [neck_r, -eps],
                    [neck_r, neck_h-neck_rim_chamfer],
                    [neck_r-neck_rim_relief, neck_h], [0, neck_h]]);
                intersection() {
                    thread_ridge();
                    // Taper only the upper end of the short external band.
                    // Keep its lower end embedded in the shoulder.
                    rotate_extrude() polygon([
                        [0, -eps], [neck_r+thread_depth+eps, -eps],
                        [neck_r+thread_depth+eps, lid_thread_height-base_thread_entry_chamfer],
                        [neck_r+thread_depth-base_entry_relief, lid_thread_height],
                        [0, lid_thread_height]]);
                }
            }
        }
        rotate_extrude() polygon([
            [0, wall_thickness], [body_inner_r, wall_thickness],
            [body_inner_r, shoulder_z-inner_transition],
            [inner_r, shoulder_z], [inner_r, container_height+eps],
            [0, container_height+eps]]);
    }
}

// Defined open-side down with its opening at z=0. In this orientation the
// lid and the neck use exactly the same helical phase.
module lid() {
    difference() {
        union() {
            rotate_extrude() polygon([
                [0, 0], [outer_r-lid_bottom_chamfer, 0],
                [outer_r, lid_bottom_chamfer], [outer_r, lid_height-lid_top_chamfer],
                [outer_r-lid_top_chamfer, lid_height], [0, lid_height]]);
            // Sample the same assembled coordinates as the body, compensating
            // for the lid's seating rotation so patterns align when screwed shut.
            exterior_relief(lid_height, lid_bottom_chamfer, lid_top_chamfer,
                            pattern_on_lid, alignment_stop_z, alignment_stop_angle);
        }
        // Short threaded bore, then a 45 degree transition to the smooth
        // cavity. The transition supports the internal ridge when printed.
        rotate_extrude() polygon([
            [0, -eps], [neck_r+radial_clearance+lid_entry_relief, -eps],
            [neck_r+radial_clearance+lid_entry_relief, 0],
            [neck_r+radial_clearance, lid_thread_entry_chamfer],
            [neck_r+radial_clearance, lid_thread_height-thread_depth],
            [body_inner_r, lid_thread_height],
            [body_inner_r, lid_cavity_height], [0, lid_cavity_height]]);
        // Only the opening is threaded; the lid roof is outside this cutter.
        intersection() {
            thread_ridge(female = true);
            translate([0, 0, -eps])
                cylinder(r = outer_r+eps, h = lid_thread_height+eps);
        }
    }
}

module print_lid() {
    translate([0, 0, lid_height]) rotate([180, 0, 0]) lid();
}

module assembled() {
    color("LightSkyBlue") container();
    color("Wheat") translate([0, 0, alignment_stop_z])
        rotate([0, 0, alignment_stop_angle]) lid();
}

if (view == "container") container();
else if (view == "lid") print_lid();
else if (view == "assembled") assembled();
else if (view == "section") difference() {
    assembled();
    translate([-outer_r-texture_depth-1, -outer_r-texture_depth-1, -1])
        cube([outer_diameter+2*texture_depth+2, outer_r+texture_depth+1, container_height+lid_height+2]);
}
else {
    color("LightSkyBlue") container();
    color("Wheat") translate([outer_diameter+2*texture_depth+10, 0, 0]) print_lid();
}
