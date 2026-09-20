// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Version 5: v4's ribbed lid and engraved labels plus a thread that fades in
// and out instead of starting at full depth. The thread region is longer
// (5 mm) so a lead-in and lead-out can ramp the thread depth to zero, which
// removes the hard overhang FDM printers saw at the start of the helix.
// Parametric reconstruction of basic_container_and_lid.step. Units: mm.
// Capacity is the hemispherical bowl PLUS the cylindrical neck, to the rim.
// No external libraries required.

/* [Capacity and display] */
volume_ml = 20; // [5,10,15,20,25,50,100]
view = "grid"; // [grid,print,container,lid,lid_section,assembled,exploded,section]
quality = 128; // [64,128,192,256]

/* [Grid] */
grid_columns = 2; // [1:7]
grid_include_lids = true;
grid_gap = 10;

/* [Engraved text] */
bottom_text_enabled = true;
// Leave empty to label each part with its own capacity, e.g. "20ml".
bottom_text = "";
top_text_enabled = true;
top_text = "";
// Engraving depth into the flat face, in mm.
text_depth = 0.2;
text_font = "Liberation Sans:style=Bold";

/* [Dimensions] */
// Neck and lid thread height; the two must match so the tapers align.
neck_height = 5;
neck_wall_at_crest = 3;
lid_wall = 3;
bottom_thickness = 1.6;
lid_top_thickness = 1.6;
// Total exterior lid height, including the threaded opening and roof.
lid_height = 10;
lid_thread_height = 5;
edge_chamfer = 1;

/* [Ribs] */
container_ribs = true;
rib_count = 36; // [1:120]
rib_cutoff_diameter = 10;
// Radial penetration into the exterior of each ribbed part, in mm.
rib_cutoff_overlap = 0.4;

/* [45 degree flank / 90 degree included thread] */
thread_pitch = 2;
// Small crest/root flats; flank radial depth equals flank axial run.
thread_depth = 0.9;
// Diametral clearance: 0.5 gives 0.25 mm radial clearance.
thread_tolerance = 0.5;
// Additional vertical play in the female profile.
axial_clearance = 0.10;
// Decay constants of the thread depth fade at the opening and at the inner
// end. Without a fade the helix is cut off at full depth and its end face is
// a flat, unsupported overhang. Keep both >= thread_depth: the exponential
// fade then adds no more slope than the flank's own 45 degrees.
thread_lead_in = 1.0;
thread_lead_out = 1.0;

/* [Display spacing] */
exploded_gap = 5;
print_gap = 8;

/* [Hidden] */
$fn = quality;
eps = 0.01;
// The container's thread solid starts this far below the shoulder so the
// union with the body overlaps instead of leaving coincident faces.
thread_root_embed = 0.5;
// Fractions of the free face diameter used for the label width, height and
// bounding-box corner radius, so the text always stays inside the round face.
text_width_fill = 0.80;
text_height_fill = 0.38;
text_fit_fill = 0.90;
// One text line spans this much height (ascender to descender) per unit of
// text size.
text_line_ratio = 1.20;
// Advance used for characters missing from the table below, per 1000 units.
text_fallback = 700;
// Clearance between the label and the chamfered or ribbed rim of the face.
text_margin = 2;
// Advance widths per 1000 units of text size for the default Liberation Sans
// Bold font (ASCII 32..126), measured from OpenSCAD's own text rendering. The
// label is sized from this table because textmetrics() is not available in
// released OpenSCAD builds.
a_advance__font = [
    386,463,658,772,772,1235,1003,330,463,463,540,811,
    386,463,386,386,772,772,772,772,772,772,772,772,
    772,772,463,463,811,811,811,848,1354,1003,1003,1003,
    1003,926,848,1080,1003,386,772,1003,848,1157,1003,1080,
    926,1080,1003,926,848,1003,926,1311,926,926,848,463,
    386,463,811,772,463,772,848,772,848,772,463,848,
    848,386,386,772,386,1235,848,848,848,848,540,772,
    463,848,772,1080,772,772,694,540,389,540,811];
function advance(c) =
    let(code = ord(c))
    code >= 32 && code <= 126 ? a_advance__font[code-32] : text_fallback;
function text_width(txt, i=0) =
    i >= len(txt) ? 0 : advance(txt[i]) + text_width(txt, i+1);
function capacity(r) = PI * (2*r*r*r/3 + neck_height*r*r);
function solve_radius(v, lo=0, hi=100, n=60) =
    n == 0 ? (lo+hi)/2 :
    capacity((lo+hi)/2) > v
        ? solve_radius(v,lo,(lo+hi)/2,n-1)
        : solve_radius(v,(lo+hi)/2,hi,n-1);
// Each instance owns its dimensions and thread functions, so every grid cell
// is rebuilt at its requested capacity rather than scaling the thread.
module model(volume_ml, view) {
bowl_radius = solve_radius(volume_ml*1000);
shoulder_z = bottom_thickness + bowl_radius;
rim_z = shoulder_z + neck_height;
crest_r = bowl_radius + neck_wall_at_crest;
root_r = crest_r - thread_depth;
outer_r = crest_r + thread_tolerance/2 + lid_wall;
lid_cavity_height = lid_height - lid_top_thickness;
flat = (thread_pitch-2*thread_depth)/2;
// Label used when the matching text field is left empty in the Customizer.
capacity_label = str(volume_ml,"ml");

assert(volume_ml > 0 && volume_ml <= 1000, "Capacity must be positive and <= 1000 ml");
assert(quality >= 32 && quality == floor(quality), "Use integer quality >= 32");
assert(thread_pitch > 0 && thread_depth > 0 && 2*thread_depth < thread_pitch,
       "Thread depth must be less than half the pitch");
assert(neck_wall_at_crest > thread_depth && neck_height > 0);
assert(thread_tolerance >= 0 && axial_clearance >= 0 && axial_clearance < 2*flat);
assert(thread_lead_in >= thread_depth && thread_lead_out >= thread_depth,
       "Thread fade constants must be at least the thread depth to stay under 45 degrees");
assert(thread_lead_in + thread_lead_out < neck_height,
       "Thread fade must leave a near-full-depth section in the middle");
assert(lid_thread_height == neck_height,
       "Lid thread height must equal the neck height so the tapers align");
assert(thread_root_embed > 0 && thread_root_embed < shoulder_z,
       "Thread root embed must be positive and shallower than the body");
assert(rib_count >= 1 && rib_count == floor(rib_count), "Rib count must be a positive integer");
assert(rib_cutoff_diameter > 0);
assert(rib_cutoff_overlap > 0 && rib_cutoff_overlap < min(lid_wall,rib_cutoff_diameter/2),
       "Rib overlap must be positive and smaller than the lid wall and cutter radius");
assert(lid_height > lid_top_thickness);
assert(lid_thread_height > 0 && lid_thread_height <= lid_cavity_height);
assert(bottom_thickness > 0 && lid_top_thickness > 0 && lid_wall > 0);
assert(edge_chamfer >= 0 && edge_chamfer < min(lid_top_thickness,lid_wall));
assert(text_depth > 0 && text_depth < min(bottom_thickness,lid_top_thickness),
       "Engraving depth must be positive and thinner than the base and lid roof");

echo(capacity_ml=capacity(bowl_radius)/1000, bowl_radius_mm=bowl_radius,
     outside_diameter_mm=2*outer_r, container_height_mm=rim_z,
     lid_height_mm=lid_height, lid_thread_height_mm=lid_thread_height,
     thread_lead_in_mm=thread_lead_in, thread_lead_out_mm=thread_lead_out);

// Right-handed, single-start thread. In an axial section, each sloping
// flank has |dr/dz|=1: 45 degrees, giving a 90 degree included angle.
// Slight crest/root flats avoid fragile knife edges.
// Depth factor: zero at both ends of the thread region, one in between, so
// the helix fades in at the opening and out at the inner end. The exponential
// shape matters: its slope never exceeds (1-s)/thread_depth, so adding it to
// the 45 degree flank keeps every surface at or below 45 degrees. A straight
// chamfer would instead add to the flank and become a steeper overhang.
function thread_depth_factor(z,height,lead_in,lead_out) =
    min(1-exp(-max(0,z)/lead_in), 1-exp(-max(0,height-z)/lead_out));
// Male ridge radius at angle a and height z, with the depth faded by the
// factor above. z is measured from the container shoulder in both parts.
function thread_r(a,z,play=0,height=0,lead_in=0,lead_out=0) =
    let(t=(z-thread_pitch*a/360)/thread_pitch,
        phase=(t-floor(t))*thread_pitch,
        distance=abs(phase-thread_pitch/2),
        s=thread_depth_factor(z,height,lead_in,lead_out))
    root_r + s * max(0,min(thread_depth,
        thread_pitch/2-flat/2-distance+play/2));
// Female bore radius. Where the thread is at full depth this is the male
// ridge plus the radial clearance. Where the thread has faded out it returns
// to the nominal bore crest_r+clearance, so the cavity above stays flush and
// the groove roof ends in a shallow ramp rather than a flat overhang.
function thread_bore_r(a,z,play,clearance,height,lead_in,lead_out) =
    thread_r(a,z,play,height,lead_in,lead_out) + clearance
    + (1-thread_depth_factor(z,height,lead_in,lead_out)) * thread_depth;

// Closed radial solid with a sampled helical boundary. Shared vertices and
// triangulated faces avoid non-planar quad faces and coincident helix seams.
// Set female=true for the mating bore profile.
module thread_solid(height, clearance=0, play=0, start_z=0,
                    lead_in=0, lead_out=0, female=false) {
    nz = ceil((height-start_z)/thread_pitch*quality);
    points = concat(
        [for(j=[0:nz], i=[0:quality-1])
            let(a=360*i/quality, z=start_z+(height-start_z)*j/nz,
                r=(female
                    ? thread_bore_r(a,z,play,clearance,height,lead_in,lead_out)
                    : thread_r(a,z,play,height,lead_in,lead_out)+clearance))
            [r*cos(a),r*sin(a),z]],
        [[0,0,start_z],[0,0,height]]);
    bottom = (nz+1)*quality;
    top = bottom+1;
    faces = concat(
        [for(j=[0:nz-1],i=[0:quality-1])
            let(a=j*quality+i,b=j*quality+(i+1)%quality,
                c=(j+1)*quality+(i+1)%quality) [a,b,c]],
        [for(j=[0:nz-1],i=[0:quality-1])
            let(a=j*quality+i,c=(j+1)*quality+(i+1)%quality,
                d=(j+1)*quality+i) [a,c,d]],
        [for(i=[0:quality-1]) [bottom,(i+1)%quality,i]],
        [for(i=[0:quality-1]) [top,nz*quality+i,nz*quality+(i+1)%quality]]);
    // OpenSCAD expects clockwise faces as seen from outside (left-hand rule).
    // Reversed faces render incorrectly in F5/OpenCSG subtraction previews.
    polyhedron(points=points,
        faces=[for(f=faces) [f[2],f[1],f[0]]],convexity=12);
}

// One line of engraved text, sized so that the whole block fits inside a circle
// of radius avail_r: width, height and bounding-box corner radius are each
// capped at a fraction of the free diameter. The size therefore follows the
// free face area of every capacity and shrinks for longer custom text.
module fitted_text(txt, avail_r) {
    w = text_width(txt)/1000;
    if (w > 0)
        text(txt,
             size = min(text_width_fill*2*avail_r/w,
                        min(text_height_fill*2*avail_r/text_line_ratio,
                            text_fit_fill*2*avail_r/
                                sqrt(w*w+text_line_ratio*text_line_ratio))),
             halign = "center", valign = "center", font = text_font);
}

// Engraved into the flat base. Mirrored across Y so the label reads correctly
// once the container is tipped towards the viewer to expose its base.
module bottom_label_cut(txt, avail_r) {
    translate([0,0,-eps])
        linear_extrude(text_depth+eps)
            mirror([0,1,0]) fitted_text(txt, avail_r);
}

// Engraved down into the lid roof, readable from above with the lid fitted.
module top_label_cut(txt, avail_r) {
    translate([0,0,lid_height-text_depth])
        linear_extrude(text_depth+eps)
            fitted_text(txt, avail_r);
}

module container() {
    difference() {
        union() {
            // Cylindrical exterior with the reference's lower edge chamfer.
            rotate_extrude() polygon([
                [0,0],[outer_r-edge_chamfer,0],
                [outer_r,edge_chamfer],[outer_r,shoulder_z],[0,shoulder_z]]);
            // The tapered thread starts as a root_r cylinder below the
            // shoulder, so it overlaps the body instead of meeting it on a
            // coincident face.
            translate([0,0,shoulder_z])
                thread_solid(neck_height,0,0,-thread_root_embed,
                             thread_lead_in,thread_lead_out);
        }
        if(container_ribs) rib_cutoffs(shoulder_z);
        if(bottom_text_enabled)
            bottom_label_cut(bottom_text != "" ? bottom_text : capacity_label,
                             outer_r-text_margin);
        translate([0,0,shoulder_z]) sphere(r=bowl_radius);
        translate([0,0,shoulder_z]) cylinder(r=bowl_radius,h=neck_height+eps);
    }
}

// Cylindrical cuts parallel to the part axis, repeated around the perimeter.
// Cutter's nearest point is outer_r - rib_cutoff_overlap (0.4 mm deep).
module rib_cutoffs(height) {
    for(i=[0:rib_count-1])
        rotate([0,0,i*360/rib_count])
            translate([outer_r+rib_cutoff_diameter/2-rib_cutoff_overlap,0,-eps])
                cylinder(d=rib_cutoff_diameter,h=height+2*eps);
}

// Lid is defined open-side down at z=0, matching shoulder-relative phase.
module lid() {
    difference() {
        rotate_extrude(convexity=12) polygon([
            [0,0],[outer_r,0],[outer_r,lid_height-edge_chamfer],
            [outer_r-edge_chamfer,lid_height],[0,lid_height]]);
        rib_cutoffs(lid_height);
        if(top_text_enabled)
            top_label_cut(top_text != "" ? top_text : capacity_label,
                          outer_r-text_margin);
        // Bore with the mating thread, faded in at the opening and out at the
        // inner end; both ends meet the nominal bore radius, so the cutters
        // join the smooth cavity without a step.
        thread_solid(lid_thread_height,thread_tolerance/2,axial_clearance,-eps,
                     thread_lead_in,thread_lead_out,true);
        // Smooth cavity above the threaded opening.
        if(lid_cavity_height > lid_thread_height)
            translate([0,0,lid_thread_height])
                cylinder(r=crest_r+thread_tolerance/2,
                         h=lid_cavity_height-lid_thread_height);
    }
}

module assembled(gap=0) {
    color("LightSkyBlue") container();
    color("Wheat") translate([0,0,shoulder_z+gap]) lid();
}

if(view=="container") container();
else if(view=="lid") translate([0,0,lid_height]) rotate([180,0,0]) lid();
else if(view=="lid_section") difference() {
    lid();
    translate([-outer_r-1,-outer_r-1,-eps])
        cube([2*outer_r+2,outer_r+1,lid_height+2*eps]);
}
else if(view=="print") {
    container();
    translate([2*outer_r+print_gap,0,lid_height]) rotate([180,0,0]) lid();
}
else if(view=="assembled") assembled();
else if(view=="exploded") assembled(exploded_gap);
else if(view=="section") difference() {
    assembled(exploded_gap);
    translate([-outer_r-1,-outer_r-1,-1])
        cube([2*outer_r+2,outer_r+1,rim_z+lid_height+exploded_gap+2]);
}
else assert(false,"Unknown view");
}

module all_sizes() {
    sizes = [5,10,15,20,25,50,100];
    max_r = solve_radius(max(sizes)*1000)
        + neck_wall_at_crest + thread_tolerance/2 + lid_wall;
    cell_width = (grid_include_lids ? 4*max_r+print_gap : 2*max_r) + grid_gap;
    cell_depth = 2*max_r + grid_gap;
    assert(grid_columns >= 1 && grid_columns <= 7 && grid_columns == floor(grid_columns));
    assert(grid_gap > 0 && print_gap > 0);
    // Increasing capacities across columns, then along +Y. All bases at z=0.
    for(i=[0:len(sizes)-1])
        translate([(i%grid_columns)*cell_width,floor(i/grid_columns)*cell_depth,0])
            model(sizes[i],grid_include_lids ? "print" : "container");
}

if(view=="grid") all_sizes();
else model(volume_ml,view);
