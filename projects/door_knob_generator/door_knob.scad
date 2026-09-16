// Door knob reconstructed from the supplied Onshape STEP and screenshots.
// Millimetres; mounting face at Z=0, blind screw hole along +Z.

/* [1 - Head size] */
// Maximum head diameter, independent of the shaft.
head_diameter = 33.495454169735;
// Height above the straight shaft, including the curved shoulder.
head_height = 23;

/* [2 - Shaft size] */
// Length of the straight cylindrical mounting shaft; zero removes it.
shaft_height = 9;
shaft_diameter = 16;

/* [3 - Screw fit] */
screw_diameter = 2.8;
// Added to the circumscribed diameter, as in the reference sketch.
diameter_allowance = 0.2;
hole_depth = 25;

/* [4 - Advanced - reinforcement slots] */
slots_enabled = true;
slot_width = 0.1;
slot_length = 1.5;

/* [5 - Inspect and export] */
part = "knob"; // [knob,body,cutter,section,hole_profile]

/* [6 - Advanced - mesh quality] */
radial_segments = 144;
profile_segments = 48;

/* [Hidden] */
eps = 0.01;
body_height = shaft_height + head_height;
body_radius = max(head_diameter,shaft_diameter)/2;
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

// The reference profile consists of a cylindrical neck and four tangent arcs:
// neck R8.0416667, lower sphere R20, rim R3, upper sphere R20.
// The resulting envelope is diameter 33.4954542 x height 32, neck diameter 16.
module knob_body() {
    neck_r = 8;
    neck_z = 9;
    blend_r = 193/24;
    blend_c = [neck_r+blend_r, neck_z];
    rim_c = [sqrt(17*17-10*10),22];
    neck_angle = atan2(32-neck_z, -blend_c.x);
    lower_start = atan2(neck_z-32, blend_c.x);
    rim_angle = atan2(10, rim_c.x);
    head_profile = concat(
        arc(blend_c,blend_r,180,neck_angle),
        arc([0,32],20,lower_start,-rim_angle),
        arc(rim_c,3,-rim_angle,rim_angle),
        arc([0,12],20,rim_angle,90)
    );
    rotate_extrude(convexity=10)
        polygon(concat(
            [[0,0],[shaft_diameter/2,0]],
            [for (p=head_profile) head_point(p)],
            [[0,body_height]]
        ));
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
assert(radial_segments>=24 && profile_segments>=8,"Increase mesh resolution.");

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
