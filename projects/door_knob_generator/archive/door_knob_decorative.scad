// Decorative door knob: sampled rings inspired by complex.js.
// Standalone file. Edit decorative_radius() for your own mathematical surface.
// Millimetres; mounting face at Z=0, blind screw hole along +Z.

/* [1 - Start here - pattern and twist] */
// Pick a look. Flutes are spiral grooves; waves add ripples up the head.
decoration = "twisted_flutes"; // [twisted_flutes:Spiral grooves,waves:Wavy grooves,organic:Organic bumps,plain:Smooth,custom:Custom formula (advanced)]
// Number of grooves around the head. Used by Spiral grooves and Wavy grooves.
wave_count = 12; // [3:1:24]
// Number of turns from bottom to top: 0 is straight, 0.5 is half a turn.
twist_turns = 0.208333333333; // [0:0.05:1]
// Groove depth in mm: 0 is smooth, 1 is subtle, 3 is bold.
decoration_depth = 1.5; // [0:0.1:3]
// Reverse the spiral direction.
reverse_twist = false;

/* [2 - Head size] */
// Maximum head diameter, independent of the shaft.
head_diameter = 33.495454169735;
// Height above the straight shaft, including the curved shoulder.
head_height = 23;

/* [3 - Shaft size] */
// Length of the straight cylindrical mounting shaft; zero removes it.
shaft_height = 9;
shaft_diameter = 16;

/* [4 - Pattern variations] */
// Number of ripples up the head. Used only by Wavy grooves.
vertical_waves = 3; // [1:1:8]
// Try another number for a different Organic bumps pattern.
noise_seed = 7; // [1:1:100]

/* [5 - Screw fit] */
screw_diameter = 2.8;
// Added to the circumscribed diameter, as in the reference sketch.
diameter_allowance = 0.2;
hole_depth = 25;

/* [6 - Advanced - reinforcement slots] */
slots_enabled = true;
slot_width = 0.1;
slot_length = 1.5;

/* [7 - Advanced - shoulder blend] */
// Fraction of head height over which the texture fades in at the shaft.
shoulder_fade = 0.25; // [0.05:0.05:1]

/* [8 - Inspect and export] */
part = "knob"; // [knob,body,cutter,section,hole_profile]

/* [9 - Advanced - mesh quality] */
// Minimum mesh quality; extra detail automatically adds samples.
radial_segments = 144; // [72:24:288]
// Number of sampled rings along the decorative head.
profile_segments = 64; // [32:16:128]

/* [Hidden] */
eps = 0.01;
twist_degrees = twist_turns*360*(reverse_twist ? -1 : 1);
patterned = decoration=="twisted_flutes" || decoration=="waves";
mesh_segments = patterned ? max(radial_segments,wave_count*8) : radial_segments;
mesh_levels = patterned ? max(profile_segments,ceil(8*(wave_count*abs(twist_turns)
              + (decoration=="waves" ? vertical_waves : 0)))) : profile_segments;
body_height = shaft_height + head_height;
body_radius = max(head_diameter,shaft_diameter)/2 + 2*decoration_depth;
$fn = radial_segments;
hole_radius = (screw_diameter + diameter_allowance)/2;
// Three mutually tangent circles inscribed in the screw envelope.
corner_radius = hole_radius / (1 + 2/sqrt(3));
corner_pitch = 2*corner_radius/sqrt(3);

function arc(c, r, a, b, n=profile_segments) =
    [for (i=[0:n]) c + r*[cos(a+(b-a)*i/n), sin(a+(b-a)*i/n)]];

// Smoothly blend independent shaft/head widths along the shoulder.
function head_point(p) =
    let(t = min(1,max(0,(p.y-9)/13)),
        blend = t*t*(3-2*t),
        width_scale = (1-blend)*shaft_diameter/16
                      + blend*head_diameter/33.495454169735)
    [p.x*width_scale, shaft_height+(p.y-9)*head_height/23];

// All angles are DEGREES. t runs from 0 at the shoulder to 1 at the crown.
function smooth01(x) = let(q=min(1,max(0,x))) q*q*(3-2*q);
function texture_envelope(t) = smooth01(t/shoulder_fade)*pow(sin(180*t),2);

// Repeatable, periodic trigonometric texture, NOT simplex noise.
function organic_noise(angle,t) =
    (sin(3*angle + 617*t + noise_seed*13)
    + 0.5*sin(7*angle - 913*t + noise_seed*29)
    + 0.25*cos(11*angle + 1291*t + noise_seed*43))/1.75;

// CALLBACK-STYLE EDIT POINT: return a radial displacement in millimetres.
// Keep angular terms periodic over 360 degrees (integer angular frequencies).
function custom_displacement(angle,t) =
    decoration_depth * sin(5*angle + 360*t) * cos(720*t);

// CALLBACK-STYLE EDIT POINT: return the surface radius in millimetres.
// The envelope keeps the shaft joint and crown smooth. Preserve it when editing.
// A positive radius and fixed ring heights avoid folds and self-intersections.
function decorative_radius(angle,t,base_radius) =
    let(phase=angle-twist_degrees*t,
        displacement =
            decoration=="plain" ? 0 :
            decoration=="twisted_flutes" ? decoration_depth*cos(wave_count*phase) :
            decoration=="waves" ? decoration_depth*cos(wave_count*phase)*cos(360*vertical_waves*t) :
            decoration=="organic" ? decoration_depth*organic_noise(phase,t) :
            custom_displacement(angle,t))
    base_radius + texture_envelope(t)*displacement;

// Radius of the original circular-arc profile at a given reference height.
function reference_radius(z) =
    let(blend_r=193/24, blend_x=8+blend_r,
        join_z=9+blend_r*23/(20+blend_r),
        rim_x=sqrt(189), lower_rim_z=32-200/17,
        upper_rim_z=12+200/17)
    z<join_z ? blend_x-sqrt(max(0,blend_r*blend_r-pow(z-9,2))) :
    z<lower_rim_z ? sqrt(max(0,400-pow(z-32,2))) :
    z<upper_rim_z ? rim_x+sqrt(max(0,9-pow(z-22,2))) :
    sqrt(max(0,400-pow(z-12,2)));

function surface_point(angle,t) =
    let(p=head_point([reference_radius(9+23*t),9+23*t]),
        r=decorative_radius(angle,t,p.x))
    assert(r>0,"Surface radius must stay positive; reduce decoration depth or fix callback.")
    [r*cos(angle),r*sin(angle),p.y];

// Sample rings, connect neighbouring samples with triangles, then close the ends.
// The seam wraps its indices; the crown uses one pole, not a degenerate ring.
module knob_body() {
    n=mesh_segments;
    levels=mesh_levels;
    shaft_rings=shaft_height>0 ? 1 : 0;
    ring_count=levels+shaft_rings;
    points=concat(
        shaft_height>0 ? [for(j=[0:n-1])
            [shaft_diameter/2*cos(360*j/n),shaft_diameter/2*sin(360*j/n),0]] : [],
        [for(i=[0:levels-1],j=[0:n-1]) surface_point(360*j/n,i/levels)],
        [[0,0,0],[0,0,body_height]]
    );
    bottom=ring_count*n;
    top=bottom+1;
    faces=concat(
        [for(j=[0:n-1]) [bottom,j,(j+1)%n]],
        [for(i=[0:ring_count-2],j=[0:n-1])
            each let(a=i*n+j, b=i*n+(j+1)%n, c=(i+1)*n+j, d=(i+1)*n+(j+1)%n)
                [[a,d,b],[a,c,d]]],
        [for(j=[0:n-1]) [(ring_count-1)*n+j,top,(ring_count-1)*n+(j+1)%n]]
    );
    polyhedron(points=points,faces=faces,convexity=20);
}

// Hull supplies the common tangent lines between the three corner circles.
module rounded_triangle_2d() {
    hull()
        for (a=[-90,30,150])
            translate(corner_pitch*[cos(a),sin(a)])
                circle(r=corner_radius, $fn=72);
}

module slot_2d(start, end) {
    hull() {
        translate(start) circle(d=slot_width,$fn=24);
        translate(end) circle(d=slot_width,$fn=24);
    }
}

// Three parallel branches on each flat and one at each rounded corner.
// Each slot overlaps the hole: no isolated ring cutting the core loose.
module hole_profile_2d() {
    union() {
        rounded_triangle_2d();
        if (slots_enabled)
            for (a=[0,120,240]) rotate(a) {
                side_y = corner_pitch/2 + corner_radius;
                for (x=[-corner_radius,0,corner_radius])
                    slot_2d([x,side_y-slot_width/4],
                            [x,side_y+slot_length]);
                slot_2d([0,-hole_radius+slot_width/4],
                        [0,-hole_radius-slot_length]);
            }
    }
}

// Positive removal solid, independently inspectable with part="cutter".
module screw_hole_remover() {
    translate([0,0,-eps])
        linear_extrude(height=hole_depth+eps,convexity=20)
            hole_profile_2d();
}

module door_knob() {
    difference() {
        knob_body();
        screw_hole_remover();
    }
}

assert(head_diameter>0 && head_height>0 && shaft_diameter>0 && shaft_height>=0,
       "Head dimensions and shaft diameter must be positive; shaft height may be zero.");
assert(shaft_diameter<head_diameter,"Shaft diameter must be smaller than the head.");
assert(screw_diameter>0 && hole_radius>0,"Screw envelope must be positive.");
assert(hole_depth>0 && hole_depth<body_height,"Keep the screw hole blind.");
assert(!slots_enabled || (slot_width>0 && slot_length>0),"Slots must have positive dimensions.");
assert(hole_radius+(slots_enabled ? slot_length+slot_width/2 : 0)<shaft_diameter/2,
       "Hole and slots must fit inside the neck.");
assert(radial_segments>=24 && profile_segments>=8
       && radial_segments==floor(radial_segments) && profile_segments==floor(profile_segments),
       "Use integer sample counts: at least 24 around and 8 along the head.");
assert(decoration_depth>=0 && shoulder_fade>0 && shoulder_fade<=1,
       "Depth must be nonnegative; shoulder fade must be in (0,1].");
assert(wave_count>=1 && wave_count==floor(wave_count),"Use an integer wave count for a closed seam.");
assert(twist_turns>=0 && vertical_waves>=1,"Use nonnegative turns and at least one vertical wave.");
assert(decoration=="plain" || decoration=="twisted_flutes" || decoration=="waves"
       || decoration=="organic" || decoration=="custom","Unknown decoration.");

if (part=="knob") door_knob();
else if (part=="body") knob_body();
else if (part=="cutter") screw_hole_remover();
else if (part=="hole_profile") hole_profile_2d();
else if (part=="section") difference() {
    door_knob();
    translate([-body_radius-1,-body_radius-1,-1])
        cube([2*body_radius+2,body_radius+1,body_height+2]);
}
else assert(false,"Unknown part selection.");
