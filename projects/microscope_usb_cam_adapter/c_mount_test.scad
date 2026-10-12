// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Short hollow fit gauge; print with the grip on the bed, without supports.

/* [Fit] */
// Reduction of the whole thread diameter, not radial clearance.
diameter_clearance = 0.20;
thread_diameter = 25.4;
thread_pitch = 25.4 / 32;
thread_length = 3.2;

/* [Body] */
bore_diameter = 19;
grip_diameter = 32;
grip_height = 3;

/* [Hidden] */
$fn = 160;
segments = 160;
steps = ceil(thread_length / thread_pitch * 48);
depth = 0.61343 * thread_pitch;
crest_radius = (thread_diameter - diameter_clearance) / 2;
root_radius = crest_radius - depth;
lead_in = 0.6;
eps = 0.02;

assert(diameter_clearance >= 0 && thread_pitch > 0);
assert(root_radius > bore_diameter / 2 + 1);
assert(thread_length > lead_in && grip_height > 0);
assert(grip_diameter > thread_diameter);

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

difference() {
    union() {
        cylinder(d=grip_diameter, h=grip_height);
        translate([0,0,grip_height-eps]) threaded_solid();
    }
    translate([0,0,-eps])
        cylinder(d=bore_diameter, h=grip_height+thread_length+2*eps);
}
