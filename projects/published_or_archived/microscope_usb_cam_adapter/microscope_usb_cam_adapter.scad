// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Full microscope adapter; print stem-down, camera thread upward.
// Uses the physically tested 0.20 mm thread diameter clearance.

/* [Fit] */
// Reduction of the whole thread diameter, not radial clearance.
diameter_clearance = 0.20;
thread_diameter = 25.4;
thread_pitch = 25.4 / 32;
thread_length = 3.2;

/* [Microscope stem] */
// Assumes the reported 23.5 mm is the receiving tube inside diameter.
microscope_inside_diameter = 23.5;
stem_diameter_clearance = 0.30;
stem_length = 20;
entry_chamfer = 0.6;

/* [Body] */
bore_diameter = 19;
collar_diameter = 28;
collar_height = 4;

/* [Hidden] */
$fn = 160;
segments = 160;
steps = ceil(thread_length / thread_pitch * 48);
depth = 0.61343 * thread_pitch;
crest_radius = (thread_diameter - diameter_clearance) / 2;
root_radius = crest_radius - depth;
lead_in = 0.6;
eps = 0.02;
stem_diameter = microscope_inside_diameter - stem_diameter_clearance;
collar_bevel = (collar_diameter - stem_diameter) / 2;
thread_base = stem_length + collar_height;

assert(diameter_clearance >= 0 && thread_pitch > 0);
assert(root_radius > bore_diameter / 2 + 1);
assert(thread_length > lead_in && stem_length > entry_chamfer);
assert(stem_diameter_clearance >= 0);
assert(stem_diameter > bore_diameter + 2);
assert(collar_diameter > thread_diameter);
assert(collar_height > collar_bevel);

// Single-start right-hand helix with 60-degree flanks and truncated crests.
// Flat roots approximate the rounded roots of a manufactured UN thread.
function radius_at(a, z) =
    let(t = z / thread_pitch - a / 360,
        distance = abs((t - floor(t)) - 0.5) * thread_pitch,
        profile = root_radius + max(0, depth - sqrt(3) *
            max(0, distance - thread_pitch / 16)),
        tip_limit = root_radius + (thread_length - z) * depth / lead_in)
    min(profile, tip_limit);

module threaded_solid() {
    points = concat(
        [for(j = [0:steps], i = [0:segments-1])
            let(a = 360*i/segments, z = thread_length*j/steps,
                r = radius_at(a, z))
            [r*cos(a), r*sin(a), z]],
        [[0,0,0], [0,0,thread_length]]);
    bottom = (steps+1)*segments;
    top = bottom+1;
    faces = concat(
        [for(j = [0:steps-1], i = [0:segments-1])
            let(a=j*segments+i, b=j*segments+(i+1)%segments,
                c=(j+1)*segments+(i+1)%segments) [a,b,c]],
        [for(j = [0:steps-1], i = [0:segments-1])
            let(a=j*segments+i, c=(j+1)*segments+(i+1)%segments,
                d=(j+1)*segments+i) [a,c,d]],
        [for(i = [0:segments-1]) [bottom,(i+1)%segments,i]],
        [for(i = [0:segments-1])
            [top,steps*segments+i,steps*segments+(i+1)%segments]]);
    polyhedron(points=points,
        faces=[for(f=faces) [f[2],f[1],f[0]]], convexity=12);
}

// The underside of the stop collar expands at 45 degrees for support-free printing.
difference() {
    union() {
        cylinder(d1=stem_diameter-2*entry_chamfer,
                 d2=stem_diameter, h=entry_chamfer);
        translate([0,0,entry_chamfer-eps])
            cylinder(d=stem_diameter, h=stem_length-entry_chamfer+2*eps);
        translate([0,0,stem_length])
            cylinder(d1=stem_diameter, d2=collar_diameter, h=collar_bevel);
        translate([0,0,stem_length+collar_bevel-eps])
            cylinder(d=collar_diameter, h=collar_height-collar_bevel+eps);
        translate([0,0,thread_base-eps]) threaded_solid();
    }
    translate([0,0,-eps])
        cylinder(d=bore_diameter, h=thread_base+thread_length+2*eps);
}
