// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Decorative door knob V6 and a backplate for it. Standalone, no libraries.
// The head is one closed mesh: rings sampled along the head's outline, each
// pushed in along the surface normal by the style's relief. Edit
// custom_relief() for your own surface.
// Millimetres. Knob: mounting face at Z=0, blind screw hole along +Z; print it
// standing on that face. Backplate: back at Z=0, the knob's axis on the
// origin; print it on its back. Part "print_all", the default, lays every look
// and both backplates out for one print. The matching JSON file holds the looks
// as Customizer presets, each showing its knob alone.

/* [1 - Start here - part, shape and style] */
part = "print_all"; // [print_all:All looks and both backplates on the bed,knob:Finished knob,backplate:Backplate,assembly:Knob on its backplate,styles:All looks side by side,section:Knob cut in half,body:Knob without the screw hole,cutter:Screw hole with its slots as a solid,hole_profile:Screw hole outline 2D]
// Outline of the head.
head_shape = "ball"; // [mushroom:Mushroom (the original),ball:Ball,drum:Drum,cone:Cone]
// Surface of the head. Custom is custom_relief() in the file.
style = "melon"; // [smooth:Smooth,melon:Melon lobes,flutes:Rounded flutes,ribs:Fine ribs,facets:Facets,diamond:Diamond knurl,scales:Pinecone scales,dimples:Dimples,waves:Wavy ribs,chevron:Chevron ribs,rings:Beehive rings,organic:Organic bumps,custom:Custom formula (advanced)]
// Repeats around the head. Facets: sides. Beehive rings: rings up the head.
pattern_count = 16; // [3:1:72]
// How deep the relief is cut into the head, in mm. Not used by Facets.
pattern_depth = 1.2; // [0:0.1:2]
// Turns of the pattern from the shaft to the crown: 0 is straight.
twist_turns = 0; // [0:0.05:1]
// Reverse the spiral direction.
reverse_twist = false;
// Swap high and low: lobes become scoops, dimples become bumps.
invert_pattern = false;

/* [2 - Head size] */
// Maximum head diameter, independent of the shaft.
head_diameter = 33.495454169735;
// Height above the straight shaft, including the curved shoulder.
head_height = 23;
// Ball and Drum: slope under the head, in degrees from flat. Lower is rounder and harder to print.
overhang_angle = 40; // [25:5:60]
// Drum and Cone: rounding of the edges. Keep it above the pattern depth.
edge_radius = 4; // [2.5:0.5:8]

/* [3 - Shaft size] */
// Length of the straight cylindrical mounting shaft; zero removes it.
shaft_height = 9;
shaft_diameter = 16;

/* [4 - Crown button and logo] */
// Flat button on the crown where the pattern ends; 0 lets the pattern run into the pole.
button_diameter = 10; // [0:0.5:20]
// Height of the button above the crown.
button_rise = 0.6; // [0.6:0.2:3]
// VeryOS logo: in the side of the shaft (8 or longer) and in the backplate's back.
logo = true;

/* [5 - Pattern variations] */
// Height of a pattern cell against its width: Diamond knurl, Pinecone scales, Dimples, Wavy ribs, Chevron ribs.
pattern_stretch = 1; // [0.5:0.1:3]
// Try another number for a different Organic bumps pattern.
noise_seed = 7; // [1:1:100]
// Part of the head's outline over which the relief fades in at the shaft.
shoulder_fade = 0.15; // [0.02:0.01:0.5]

/* [6 - Backplate] */
backplate = "rosette"; // [rosette:Round flower rosette,arch:Tall plate with a fan arch]
// Petals of the rosette, flutes of the arch's fan.
backplate_count = 16; // [6:1:32]
// Rosette: diameter over the petals' tips.
rosette_diameter = 42;
// Tall plate: width, also of its fan.
plate_width = 30;
// Tall plate: height with the fan.
plate_height = 110;
// Tall plate: the knob's centre below the plate's top.
knob_drop = 45;
// Tall plate: a keyhole cut through it.
keyhole = true;
// Keyhole's centre below the knob's.
keyhole_drop = 30;
// Countersunk wood screws in the fan and at the bottom of the tall plate; 0: none.
plate_screw_diameter = 3;
// Thickness under the knob and of the tall plate.
backplate_thickness = 2.4;
// Height of the petals and flutes above the plate's thickness.
relief_height = 1.6;
// Ring around the foot of the shaft: height above the plate.
rose_height = 2;
// Wall of that ring.
rose_wall = 3;
// Gap between the shaft and the ring, per side.
shaft_clearance = 0.3;

/* [7 - Screw fit] */
screw_diameter = 2.8;
// Added to the circumscribed diameter, as in the reference sketch.
diameter_allowance = 0.2;
hole_depth = 25;

/* [8 - Advanced - reinforcement slots] */
slots_enabled = true;
slot_width = 0.1;
slot_length = 1.5;

/* [9 - Advanced - mesh quality] */
// Minimum mesh columns around the head; every pattern repeat gets at least 8.
radial_segments = 144; // [72:24:288]
// Minimum mesh rows along the head; cell patterns get as many as their columns need.
profile_segments = 96; // [32:16:160]

/* [Hidden] */
eps = 0.01;
$fn = radial_segments;
body_height = shaft_height + head_height;
head_r = head_diameter/2;
shaft_r = shaft_diameter/2;
button_r = button_diameter/2;
button_chamfer = 0.4;
top_z = body_height + (button_diameter > 0 ? button_rise : 0);
// Under this radius the mesh rows and the pattern cells stop shrinking towards the pole.
floor_r = head_r/4;
hole_radius = (screw_diameter + diameter_allowance)/2;
// Three mutually tangent circles inscribed in the screw envelope.
corner_radius = hole_radius / (1 + 2/sqrt(3));
corner_pitch = 2*corner_radius/sqrt(3);
// Outer radius of the ring around the shaft's foot.
rose_r = shaft_r + shaft_clearance + rose_wall;
plate_chamfer = 0.6;
plate_corner = 3;
logo_depth = 0.6;
// The logo in the shaft's side: 1 from the backplate's ring and 1 from the head, no
// wider than half the shaft.
shaft_logo_depth = 0.4;
shaft_logo_height = min(shaft_height - rose_height - 2, shaft_diameter/2.8);
text_font = "DejaVu Sans Mono:style=Bold";

// What the mesh reads. Part "styles" sets them for each look.
$shape = head_shape;
$style = style;
$count = pattern_count;
$depth = pattern_depth;
$twist = twist_turns*(reverse_twist ? -1 : 1);
$stretch = pattern_stretch;
$invert = invert_pattern;

// The looks of part "styles", each a preset in the JSON file:
// name, head_shape, style, pattern_count, pattern_depth, twist_turns, pattern_stretch, invert_pattern
a_look = [
    ["Melon",           "ball",     "melon",   16, 1.2, 0,    1,   false],
    ["Fine melon",      "ball",     "melon",   26, 0.8, 0,    1,   false],
    ["Turban",          "ball",     "melon",   12, 1.4, 0.3,  1,   false],
    ["Flower",          "mushroom", "melon",   12, 1.6, 0,    1,   false],
    ["Twisted flutes",  "mushroom", "flutes",  12, 2,   0.2,  1,   false],
    ["Scoops",          "drum",     "melon",   14, 1.2, 0,    1,   true],
    ["Sunburst",        "mushroom", "ribs",    48, 0.6, 0,    1,   false],
    ["Octagon",         "cone",     "facets",   8, 0,   0,    1,   false],
    ["Twisted decagon", "drum",     "facets",  10, 0,   0.1,  1,   false],
    ["Knurl",           "drum",     "diamond", 24, 0.8, 0,    1,   false],
    ["Pinecone",        "ball",     "scales",  12, 1.2, 0,    1,   false],
    ["Dimples",         "ball",     "dimples", 14, 0.8, 0,    1,   false],
    ["Hobnail",         "mushroom", "dimples", 12, 1,   0,    1,   true],
    ["Wavy ribs",       "drum",     "waves",   24, 0.8, 0,    1,   false],
    ["Chevron",         "drum",     "chevron", 24, 0.8, 0,    1,   false],
    ["Beehive",         "ball",     "rings",   10, 0.8, 0,    1,   false],
    ["Organic",         "mushroom", "organic", 16, 1.6, 0,    1,   false],
    ["Smooth original", "mushroom", "smooth",  16, 0,   0,    1,   false]];

module look(l) {
    $shape = l[1]; $style = l[2]; $count = l[3]; $depth = l[4];
    $twist = l[5]; $stretch = l[6]; $invert = l[7];
    children();
}

function arc(c, r, a, b, n=48) =
    [for (i=[0:n]) c + r*[cos(a+(b-a)*i/n), sin(a+(b-a)*i/n)]];

// ---- head outlines: [r, z] from the shaft's top to the pole ----

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
function mushroom_outline() =
    let(neck_r = 8, neck_z = 9, blend_r = 193/24,
        blend_c = [neck_r+blend_r, neck_z],
        rim_c = [sqrt(17*17-10*10),22],
        neck_angle = atan2(32-neck_z, -blend_c.x),
        lower_start = atan2(neck_z-32, blend_c.x),
        rim_angle = atan2(10, rim_c.x))
    [for (p = concat(
        arc(blend_c,blend_r,180,neck_angle),
        arc([0,32],20,lower_start,-rim_angle),
        arc(rim_c,3,-rim_angle,rim_angle),
        arc([0,12],20,rim_angle,90))) head_point(p)];

// An ellipsoid on a cone that leaves the shaft at overhang_angle and touches the
// ellipsoid u degrees under its equator: tan(45 + u/2) = (height/tan(angle) + shaft r)/head r.
function ball_outline() =
    let(slope = tan(overhang_angle),
        u = 2*(atan((head_height/slope + shaft_r)/head_r) - 45),
        c = head_r*slope*tan(u),
        zc = body_height - c)
    assert(u > 0, "The head is too low for a ball: raise head_height or lower overhang_angle.")
    concat([[shaft_r, shaft_height]],
           [for (i = [0:96]) let(f = -u + (90+u)*i/96) [head_r*cos(f), zc + c*sin(f)]]);

// A cone from the shaft at the given angle, a straight wall and a flat top, the two
// edges rounded with edge_radius.
function drum_outline(angle) =
    let(run = (head_r - edge_radius*(1 - sin(angle)) - shaft_r)/cos(angle),
        z1 = shaft_height + run*sin(angle) + edge_radius*cos(angle),
        z2 = body_height - edge_radius)
    assert(run > 0 && z1 <= z2 + eps,
           "The head is too low or too narrow for a drum or cone: raise head_height or overhang_angle, or lower edge_radius.")
    assert(edge_radius > $depth, "Keep edge_radius above the pattern depth.")
    concat([[shaft_r, shaft_height]],
           arc([head_r-edge_radius, z1], edge_radius, angle-90, 0),
           arc([head_r-edge_radius, z2], edge_radius, 0, 90),
           [[0, body_height]]);

// The drum whose wall has no length: its cone runs up to the rounded top edge.
function cone_angle() =
    let(a = head_r - edge_radius - shaft_r, h = head_height - edge_radius)
    acos(edge_radius/norm([a, h])) - atan2(a, h);

function head_outline() =
    $shape == "ball" ? ball_outline() :
    $shape == "drum" ? drum_outline(overhang_angle) :
    $shape == "cone" ? drum_outline(cone_angle()) : mushroom_outline();

// The outline up to where it last crosses radius r on its way to the pole.
function cut_at(outline, r) =
    let(i = max([for (k = [0:len(outline)-2]) if (outline[k].x >= r) k]),
        f = (outline[i].x - r)/(outline[i].x - outline[i+1].x))
    concat([for (k = [0:i]) outline[k]], [outline[i] + f*(outline[i+1] - outline[i])]);

// ---- relief ----

// All angles are DEGREES.
function smooth01(x) = let(q=min(1,max(0,x))) q*q*(3-2*q);
function fract(x) = x - floor(x);
// 1 at 0, 0 at 180.
function tri(a) = 1 - acos(cos(a))/180;
// A round lobe per unit, with a sharp groove at x = 0.5.
function lobe(x) = sqrt(abs(cos(180*x)));
// A ramp per unit that falls back within one mesh column.
function saw(x) = let(f = fract(x), top = 1 - 1/per_repeat()) min(f/top, (1-f)/(1-top));

// Repeatable, periodic trigonometric texture, NOT simplex noise.
function organic_noise(angle,t) =
    (sin(3*angle + 617*t + noise_seed*13)
    + 0.5*sin(7*angle - 913*t + noise_seed*29)
    + 0.25*cos(11*angle + 1291*t + noise_seed*43))/1.75;

// CALLBACK-STYLE EDIT POINT: return the relief from 0 (pattern_depth deep) to 1
// (on the head's surface). angle runs around the head, t from 0 at the shaft to 1
// at the crown. Keep angular terms periodic over 360 degrees.
function custom_relief(angle,t) =
    (1 + sin(5*angle + 360*t)*cos(720*t))/2;

function cell_style() = $style == "diamond" || $style == "scales" || $style == "dimples"
                        || $style == "waves" || $style == "chevron";
function around_style() = cell_style() || $style == "melon" || $style == "flutes"
                          || $style == "ribs" || $style == "facets";

// Relief from 0 (pattern_depth deep) to 1 (on the head's surface). u counts the
// pattern's repeats around the head, w its cell rows up the head.
function relief(u, w, t, angle) =
    $style == "melon" ? lobe(u) :
    $style == "flutes" ? (1 + cos(360*u))/2 :
    $style == "diamond" ? min(tri(360*(u+w)), tri(360*(u-w))) :
    $style == "scales" ? min(saw(u+w), saw(w-u)) :
    $style == "dimples" ?
        let(row = floor(w), du = fract(u + row/2) - 0.5, dw = w - row - 0.5)
        1 - pow(max(0, 1 - (du*du + dw*dw)/0.2), 2) :
    $style == "rings" ? lobe($count*t) :
    $style == "organic" ? (1 + organic_noise(angle,t))/2 :
    $style == "custom" ? custom_relief(angle,t) :
    max(0, cos(360*u)); // ribs, waves, chevron

// Wavy and chevron ribs are straight ribs on rings turned to and fro, in repeats.
function meander(w) =
    $style == "waves" ? sin(180*w)/2 :
    $style == "chevron" ? 2*abs(fract(w/2) - 0.5) - 0.5 : 0;

// ---- mesh ----

// Mesh columns per pattern repeat, and around the head. The grooves lie on columns.
function per_repeat() = max(8, ceil(radial_segments/$count));
function columns() = around_style() ? $count*per_repeat() : radial_segments;

function cumsum(v, i=0, sums=[0]) =
    i == len(v) ? sums : cumsum(v, i+1, concat(sums, [sums[i]+v[i]]));

// The head's rings from the shaft to the button or the pole, a row each:
// [r, z, normal r, normal z, turn in degrees, relief depth, shoulder fade, t, w]
// The rows are evenly spaced in v, the height on a map of the head that keeps
// shapes: pattern cells and mesh rows shrink with the head's radius.
function ring_table() =
    let(outline = button_diameter > 0 ? cut_at(head_outline(), button_r) : head_outline(),
        last = len(outline)-1,
        ds = [for (i = [0:last-1]) norm(outline[i+1] - outline[i])],
        s = cumsum(ds),
        v = cumsum([for (i = [0:last-1])
            ds[i]/max((outline[i].x + outline[i+1].x)/2, floor_r)]),
        cell_rows = v[last]*$count/(2*PI*$stretch),
        rows = cell_style() ? ceil(per_repeat()*cell_rows) :
               $style == "rings" ? max(profile_segments, 12*$count) : profile_segments,
        r_of = [for (i = [0:last]) [v[i], outline[i].x]],
        z_of = [for (i = [0:last]) [v[i], outline[i].y]],
        t_of = [for (i = [0:last]) [v[i], s[i]/s[last]]],
        p = [for (k = [0:rows]) let(at = v[last]*k/rows) [lookup(at, r_of), lookup(at, z_of)]])
    [for (k = [0:rows])
        let(tangent = p[min(k+1,rows)] - p[max(k-1,0)],
            t = lookup(v[last]*k/rows, t_of),
            w = k/per_repeat(),
            fade = smooth01(t/shoulder_fade))
        [p[k].x, p[k].y, tangent.y/norm(tangent), -tangent.x/norm(tangent),
         360*$twist*t + 360/$count*meander(w),
         fade*min(1, 2*p[k].x/head_r), fade, t, w]];

// A point of a ring, h its relief. Facets are cut level, towards the axis, as deep
// as a polygon needs; all other styles along the normal.
function ring_point(ring, j, n, h) =
    let(d = $style == "facets"
            ? [-ring[0]*ring[6]*(1 - cos(180/$count)/cos((fract(j*$count/n)-0.5)*360/$count)), 0]
            : -$depth*ring[5]*($invert ? h : 1-h)*[ring[2], ring[3]],
        r = ring[0] + d.x,
        a = 360*j/n + ring[4])
    [r*cos(a), r*sin(a), ring[1] + d.y];

// Sample rings, connect neighbouring samples with triangles, then close the ends.
// The seam wraps its indices; bottom and crown each use one pole, not a degenerate ring.
module knob_body() {
    table = ring_table();
    n = columns();
    button = button_diameter > 0;
    // Without a button the table's last row is the pole.
    crown = len(table) - (button ? 1 : 2);
    turn = table[crown][4];
    rings = concat(
        shaft_height > 0 ? [[shaft_r, 0, 1, 0, table[0][4], 0, 0, 0, 0]] : [],
        [for (k = [0:crown]) table[k]],
        button ? [[button_r, top_z-button_chamfer, 1, 0, turn, 0, 0, 1, 0],
                  [button_r-button_chamfer, top_z, 0, 1, turn, 0, 0, 1, 0]] : []);
    ring_count = len(rings);
    // relief of every point; where there is none, the value that leaves the point in place
    h = [for (ring = rings) [for (j = [0:n-1])
        ring[5] == 0 || $style == "smooth" || $style == "facets" ? ($invert ? 0 : 1)
        : relief(j*$count/n, ring[8], ring[7], 360*j/n)]];
    points = concat(
        [for (i = [0:ring_count-1], j = [0:n-1]) ring_point(rings[i], j, n, h[i][j])],
        [[0,0,0],[0,0,top_z]]);
    bottom = ring_count*n;
    top = bottom+1;
    // The edges of diamonds, scales and dimples cross the mesh diagonally: their quads
    // are split along the diagonal whose middle is closer to the relief there.
    crossed = $style == "diamond" || $style == "scales" || $style == "dimples";
    faces = concat(
        [for (j=[0:n-1]) [bottom,j,(j+1)%n]],
        [for (i=[0:ring_count-2],j=[0:n-1])
            each let(k=(j+1)%n, a=i*n+j, b=i*n+k, c=(i+1)*n+j, d=(i+1)*n+k,
                     middle = crossed ? 2*relief((j+0.5)*$count/n,
                         (rings[i][8]+rings[i+1][8])/2, (rings[i][7]+rings[i+1][7])/2,
                         360*(j+0.5)/n) : 0)
                !crossed || abs(h[i][j]+h[i+1][k]-middle) <= abs(h[i][k]+h[i+1][j]-middle)
                    ? [[a,d,b],[a,c,d]] : [[a,c,b],[c,d,b]]],
        [for (j=[0:n-1]) [(ring_count-1)*n+j,top,(ring_count-1)*n+(j+1)%n]]);
    polyhedron(points=points,faces=faces,convexity=20);
}

// ---- screw hole ----

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

// The logo in the shaft's side, seen from -y, its top towards the head.
module shaft_logo_cut() {
    difference() {
        translate([0, 0, (shaft_height+rose_height)/2]) rotate([90,0,0])
            linear_extrude(shaft_r+1)
                scale(shaft_logo_height/(2*logo_r)) translate([0,-logo_r]) logo();
        cylinder(r=shaft_r-shaft_logo_depth, h=shaft_height);
    }
}

module door_knob() {
    difference() {
        knob_body();
        screw_hole_remover();
        // under 4 high it would not print: left out on a short shaft
        if (logo && shaft_logo_height >= 4) shaft_logo_cut();
    }
}

// ---- backplate ----

// count rounded ribs side by side, fanning out from the origin over sweep degrees
// from the x axis: the rosette's petals, the arch's flutes. Each is 3 % wider than
// its share, so that neighbours cut into each other instead of touching in a line.
function rib_k(count, sweep) = 1.03*sin(sweep/count/2);
function rib_end(count, sweep, r_out) = r_out/(1 + rib_k(count, sweep));

module rib_fan_2d(count, sweep, r_in, r_out) {
    k = rib_k(count, sweep);
    end = rib_end(count, sweep, r_out);
    for (i = [0:count-1]) rotate(sweep*(i+0.5)/count) hull() {
        translate([r_in,0]) circle(r=r_in*k, $fn=24);
        translate([end,0]) circle(r=end*k, $fn=32);
    }
}

// The ribs as whole bodies, their middles on z = 0, height high above it at their
// outer ends. What lies below is buried in a plate or cut off at the bed.
module rib_fan(count, sweep, r_in, r_out, height) {
    k = rib_k(count, sweep);
    end = rib_end(count, sweep, r_out);
    for (i = [0:count-1]) rotate(sweep*(i+0.5)/count)
        scale([1, 1, height/(end*k)]) hull() {
            translate([r_in,0,0]) sphere(r=r_in*k, $fn=24);
            translate([end,0,0]) sphere(r=end*k, $fn=32);
        }
}

// The petals lie on the door, as high at their ends as plate and relief together;
// a 1 mm plate under them closes the grooves. Both reach below z = 0, where
// backplate() cuts everything off in one cut.
module rosette() {
    translate([0,0,-1]) linear_extrude(2)
        rib_fan_2d(backplate_count, 360, rose_r-1, rosette_diameter/2);
    rib_fan(backplate_count, 360, rose_r-1, rosette_diameter/2, backplate_thickness+relief_height);
}

// The tall plate under its fan, the edges chamfered but for the top one.
module plate_body_2d(inset) {
    bottom = knob_drop - plate_height;
    hull() {
        for (x = [-1,1])
            translate([x*(plate_width/2-plate_corner), bottom+plate_corner])
                circle(r=plate_corner-inset, $fn=32);
        translate([-plate_width/2+inset, knob_drop-plate_width/2-1])
            square([plate_width-2*inset, 1]);
    }
}

module arch_plate() {
    fan_r = plate_width/2;
    hub_r = 0.38*fan_r;
    hull() {
        linear_extrude(backplate_thickness-plate_chamfer) plate_body_2d(0);
        linear_extrude(backplate_thickness) plate_body_2d(plate_chamfer);
    }
    translate([0, knob_drop-fan_r, 0]) {
        linear_extrude(backplate_thickness) {
            circle(r=rib_end(backplate_count, 180, fan_r), $fn=96);
            rib_fan_2d(backplate_count, 180, hub_r, fan_r);
        }
        // no higher than round; the lower halves lie in the plate
        translate([0,0,backplate_thickness])
            rib_fan(backplate_count, 180, hub_r, fan_r,
                    min(relief_height, rib_end(backplate_count, 180, fan_r)*rib_k(backplate_count, 180)));
    }
}

// A countersunk hole through the plate, for a wood screw from the front.
module plate_screw_hole() {
    hole = plate_screw_diameter + 0.4;
    sink = plate_screw_diameter - hole/2;
    translate([0,0,-eps]) cylinder(d=hole, h=backplate_thickness+2*eps, $fn=32);
    translate([0,0,backplate_thickness-sink])
        cylinder(d1=hole, d2=2*plate_screw_diameter+2*eps, h=sink+eps, $fn=32);
}

module keyhole_2d() {
    circle(d=0.22*plate_width, $fn=48);
    polygon([[-0.05*plate_width,0], [0.05*plate_width,0],
             [0.075*plate_width,-0.4*plate_width], [-0.075*plate_width,-0.4*plate_width]]);
}

// The knob stands in the ring on the plate's top; its screw comes through the plate.
module backplate(kind = backplate) {
    pocket_r = shaft_r + shaft_clearance;
    hole_r = (screw_diameter + 0.6)/2;
    // The logo lies between the hole and the edge of the ring, where the plate is thick.
    logo_height = rose_r - hole_r - 1.5;
    // Under the rosette the ring reaches through the petals to below the bed: their centre.
    ring_sunk = kind == "arch" ? eps : backplate_thickness + 1;
    bed_depth = backplate_thickness + relief_height + 1;
    assert(backplate_thickness>logo_depth+1 && relief_height>0
           && (kind!="arch" || relief_height<backplate_thickness),
           "The backplate must be 1 mm thicker than the logo is deep, the tall plate thicker than its relief.");
    assert(kind=="arch" ? plate_width/2>=rose_r : rosette_diameter/2>rose_r+2,
           "The backplate must be wider than the ring around the shaft.");
    assert(kind!="arch" || (knob_drop>plate_width/2+rose_r
           && plate_height>knob_drop+rose_r+plate_corner
           && (!keyhole || (keyhole_drop>rose_r+0.11*plate_width+2
               && plate_height>knob_drop+keyhole_drop+0.4*plate_width+14))),
           "Knob, keyhole and bottom screw must lie below the fan and inside the plate.");
    difference() {
        union() {
            if (kind == "arch") arch_plate();
            else rosette();
            translate([0,0,backplate_thickness]) rotate_extrude($fn=96) polygon([
                [0,-ring_sunk], [rose_r,-ring_sunk], [rose_r,rose_height-plate_chamfer],
                [rose_r-plate_chamfer,rose_height], [0,rose_height]]);
        }
        // the bed under the rosette
        if (kind != "arch")
            translate([0,0,-bed_depth]) cylinder(r=rosette_diameter/2+1, h=bed_depth, $fn=32);
        // seat of the shaft, with a lead-in
        translate([0,0,backplate_thickness]) rotate_extrude($fn=96) polygon([
            [0,0], [pocket_r,0], [pocket_r,rose_height-0.4],
            [pocket_r+0.4+eps,rose_height+eps], [0,rose_height+eps]]);
        translate([0,0,-eps])
            cylinder(r=hole_r, h=backplate_thickness+2*eps, $fn=32);
        if (kind == "arch") {
            if (plate_screw_diameter > 0)
                for (y = [knob_drop-plate_width/2, knob_drop-plate_height+8])
                    translate([0,y,0]) plate_screw_hole();
            if (keyhole)
                translate([0,-keyhole_drop,-eps])
                    linear_extrude(backplate_thickness+2*eps) keyhole_2d();
        }
        // logo in the back, reading from behind
        if (logo)
            translate([0, -hole_r-1-logo_height/2, 0])
                mirror([0,0,1]) mirror([1,0,0]) logo_cut(logo_height*logo_w/(2*logo_r));
    }
}

// ---- logo ----
// The VeryOS logo at the size of veryos_logo.svg, as in veryos_logo_cube: a
// ring and the two arms of a V, all logo_stroke wide.
logo_r = 15.6264133379;
logo_stroke = 5;
logo_angle = 22.5;
logo_b = logo_r * (1 - sin(logo_angle)) / cos(logo_angle);
logo_arm = (2 * logo_r - logo_stroke / 2 * (1 + sin(logo_angle))) / cos(logo_angle);
logo_w = 2 * (logo_b + logo_arm * sin(logo_angle));
ring_in = logo_r - logo_stroke;
s_small = (2 * ring_in - logo_stroke) / 4;
s_big = s_small + logo_stroke;

// Engraving, width wide, centred on the origin, logo_depth into z < 0.
module logo_cut(width) {
    translate([0, 0, -logo_depth]) linear_extrude(logo_depth + 1)
        scale(width / logo_w) translate([0, -logo_r]) logo();
}

module logo() {
    difference() {
        union() {
            translate([0, logo_r]) circle(r = logo_r);
            for (m = [0, 1]) mirror([m, 0])
                translate([logo_b, 0]) rotate(-logo_angle)
                    translate([-logo_stroke, 0]) square([logo_stroke, logo_arm]);
            polygon([[-logo_b, 0], [logo_b, 0],
                     [logo_b + logo_r * tan(logo_angle), logo_r],
                     [-logo_b - logo_r * tan(logo_angle), logo_r]]);
        }
        translate([0, logo_r]) for (a = [0, 180]) rotate(a) s_hole();
    }
}

module s_hole() {
    difference() {
        intersection() {
            circle(r = ring_in);
            translate([0, -ring_in]) square(2 * ring_in);
        }
        translate([0, -(ring_in - s_small)]) circle(r = s_big);
    }
    translate([0, ring_in - s_small]) circle(r = s_small);
}

// ---- views ----

// Where look i stands: six in a row, the rows towards the front.
looks_per_row = 6;
function look_place(i, across, back) =
    [(i%looks_per_row)*across, -floor(i/looks_per_row)*back, 0];

// Every look as a solid body, its name below. For looking, not for printing.
module styles() {
    pitch = head_diameter + 14;
    for (i = [0:len(a_look)-1])
        translate(look_place(i, pitch, pitch+26)) {
            color("Goldenrod") look(a_look[i]) knob_body();
            color("DimGray") translate([0, -head_r-4, 0]) linear_extrude(0.6)
                text(a_look[i][0], size=4, font=text_font, halign="center", valign="top");
        }
}

// Every look as a finished knob, in the order of part "styles", and both backplates
// in front of them, the tall one lying across: one print.
module print_all() {
    gap = 6;
    pitch = head_diameter + gap;
    rows = ceil(len(a_look)/looks_per_row);
    front = -(rows-1)*pitch - head_r - gap - max(rosette_diameter, plate_width)/2;
    echo(print_all_bed=[(looks_per_row-1)*pitch + head_diameter,
                        head_r - front + max(rosette_diameter, plate_width)/2]);
    color("Goldenrod") for (i = [0:len(a_look)-1])
        translate(look_place(i, pitch, pitch)) look(a_look[i]) door_knob();
    color("DimGray") {
        translate([rosette_diameter/2-head_r, front, 0]) backplate("rosette");
        translate([rosette_diameter-head_r+gap+plate_height-knob_drop, front, 0])
            rotate(-90) backplate("arch");
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
assert(pattern_depth>=0 && shoulder_fade>0 && shoulder_fade<=1,
       "Depth must be nonnegative; shoulder fade must be in (0,1].");
assert(pattern_count>=3 && pattern_count==floor(pattern_count),
       "Use a whole pattern count of at least three for a closed seam.");
assert(twist_turns>=0 && pattern_stretch>0,"Use nonnegative turns and a positive stretch.");
assert(button_diameter==0 || (button_r>button_chamfer && button_r<0.6*head_r
       && button_rise>button_chamfer),
       "The button must be narrower than 0.6 of the head and rise more than its 0.4 chamfer.");

echo(knob_height=top_z, knob_width=head_diameter);

if (part=="knob") door_knob();
else if (part=="body") knob_body();
else if (part=="cutter") screw_hole_remover();
else if (part=="hole_profile") hole_profile_2d();
else if (part=="backplate") backplate();
else if (part=="assembly") {
    color("DimGray") backplate();
    color("Goldenrod") translate([0,0,backplate_thickness]) door_knob();
}
else if (part=="styles") styles();
else if (part=="print_all") print_all();
else if (part=="section") difference() {
    door_knob();
    translate([-head_r-1,-head_r-1,-1])
        cube([head_diameter+2,head_r+1,top_z+2]);
}
else assert(false,"Unknown part selection.");
