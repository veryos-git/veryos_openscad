// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
/**
 * Stringlights generator
 *
 * Author: veryos
 * Version: 2.0
 *
 * License:
 *    Licensed under the GNU General Public License v3.0 or later.
 *
 * Opensource credits:
 * - openscad 'language': https://openscad.org/
 * - online openscad playground: https://ochafik.com/openscad2
 * - free image editor : https://rawtherapee.com/
 * - free source code hosting: https://github.com/
 * - online photo collage: https://pixlr.com/photo-collage/
 * - thumbnail designer: https://tools.datmt.com/tools/thumb-maker
 *
 * Changelog:
 * [v1.0] Initial release
 * [v2.0] The clip screws into the bulb instead of being pushed in. The clip
 *        keeps its C, which snaps onto the LED's socket, and gets a thread
 *        outside; the bulb's neck gets the thread inside instead of the
 *        squeeze ribs. The neck's thread narrows towards the bulb, so
 *        screwing the clip in closes its C on the socket, as the ribs did.
 *        No libraries any more: BOSL2 was only needed for the ribs and the
 *        clip's arced slots.
 */

/* [View] */
part = "print_layout"; // [print_layout:Bulb and clip on the bed,assembly:Clip screwed into the bulb as it hangs,section:Assembly cut in half,bulb:Bulb standing on its neck as it prints,clip:Clip standing on its end as it prints]

/* [Screw] */
// Diameter of the clip's bore, around the LED's socket, as v1's clip. The
// clip's thread stays, so this changes the clip only: lower it if the bulb
// sits loose on the LED, raise it if the clip stops too early.
clip_bore = 4.2;
// Opening of the clip's C, in degrees around its axis, as v1's clip. It
// snaps onto the LED's socket through it.
clip_gap_angle = 50;
// Length of the clip, as v1's clip; h2 of it goes into the neck.
clip_length = 9;
// Major diameter of the clip's thread.
thread_d = 7;
// Pitch of the thread, 45 degree flanks, as fdm_optimized_screws.
thread_pitch = 2;
// Radial gap between the clip's thread and the neck's at the neck's entry,
// as the nuts of fdm_optimized_screws.
thread_clearance = 0.25;
// At its end the neck's thread is this much narrower in diameter than the
// clip's: screwed in all the way, the clip's C closes by this much on the
// LED's socket.
clamp = 0.6;

/* [Bulb] */
ntau = 360*1;

ribs = 12;
// 'resolution' of ribs
corner_modulo = 8;
// 360/12ribs = 30deg, in this case this is one 'rib' offset
rotation_offset_ribs = 30;
// in mm
height = 40;
heightdiffusor = height;


d = 5*1;
d2 = 0.8*1;
h = 18*1;
fn = 32*1;
$fn = fn*1;

d3 = 10*1;
stol = 0.2*1;
d4 = d + d2 + stol;
h2 = 7*1;


function rtclr(seed) = [
    rands(0,1,1,seed+234.2)[0],
    rands(0,1,1,seed+123443.23)[0],
    rands(0,1,1,seed+545.23)[0],
    0.6
];

module ahp(
    length = 100
){

    color([1,0,0,0.2])
    cube([length,length, 0.2], center = true);
    color([1,0,0,0.4])
    cube([length,2, 0.2], center = true);
    rotate([90,0,0])
    color([0,1,0,0.2])
    cube([length,length, 0.2], center = true);
    color([0,1,0,0.4])
    cube([length,2, 0.2], center = true);
    rotate([0,90,0])
    color([0,0,1,0.2])
    cube([length,length, 0.2], center = true);
    color([0,0,1,0.4])
    cube([length,2, 0.2], center = true);
}

module diffusor_polygon(
    itnor_layer = 0
) {
    polygon(points=[
        for (i = [0:cornersdiffusor-1])
            let(
                x = itnor_layer,
                n = -4*pow(x-0.5, 2)+1,
                angle =  i * 360 /  cornersdiffusor,
                a = angle +itnor_layer*rotation_offset_ribs,
                radius = n * radiusdiffusor*radius_factor_bulb,
                r = (i % corner_modulo > (corner_modulo/2)-1) ? radius*radius_factor_ribs : radius
            )
            [ r * cos(a), r * sin(a) ]
    ]);
}

module diffusor_outline(
    itnor_layer = 0
) {
    linear_extrude(layerheightdiffusor)
        difference() {
            offset(delta = linewidthdiffusor/2)
                diffusor_polygon(itnor_layer);
            offset(delta = -linewidthdiffusor/2)
                diffusor_polygon(itnor_layer);
        }
}

module diffusor(
    height = 30,
    layerheight = 0.2,
    thick = 0.5,
    radius = 10,
    corners = 6
){

    let(
        its_layer = height / layerheight,
        ntau = 360 // openscad angle is in degrees
    ){
        union(){
            for (it_layer=[0:its_layer]) {
                let(
                    itnor_layer = it_layer / its_layer
                    //https://www.desmos.com/calculator/wivyajlrtf?lang=de
                ){

                    translate([0,0,it_layer * layerheight])
                    color(rtclr(it_layer*23))
                    diffusor_outline(itnor_layer);
                }
            }
        }
    }
}

radiusdiffusor = d3/2;
radius_factor_bulb = 2.;
radius_factor_ribs = 1.5;
thicknessdiffusor = 2;
layerheightdiffusor = 0.28;

// [* Advanced *]
cornersdiffusor = ribs*corner_modulo;
// should not be smaller than extrusion width
linewidthdiffusor = 0.5;


eps = 0.01*1;
thread_fn = 64*1;
// The thread is 0.4 x pitch deep with a crest 0.1 x pitch wide, as the
// screws of fdm_optimized_screws.
thread_depth = 0.4*thread_pitch;
clip_wall = (thread_d - 2*thread_depth - clip_bore) / 2;
// The neck's thread: major diameter at the entry (z = 0), narrowing by
// neck_taper over h2.
neck_thread_d = thread_d + 2*thread_clearance;
neck_taper = 2*thread_clearance + clamp;
function neck_thread_d_at(z) = neck_thread_d - neck_taper * z / h2;
// 45 degree lead-in at the neck's entry, radially beyond the thread.
lead_in = 0.4*1;

assert(clip_wall >= 0.4, "The clip's wall under its thread is thinner than 0.4; raise thread_d or lower clip_bore.");
assert((d3 - neck_thread_d) / 2 - lead_in >= 0.8, "The neck's wall is thinner than 0.8 at its entry; lower thread_d.");
assert(clip_gap_angle < 150, "clip_gap_angle must stay below 150.");
assert(clip_length >= h2, "The clip is shorter than the neck's thread; raise clip_length.");
echo(str("clip: wall ", clip_wall, " under the thread; neck: thread Ø", neck_thread_d,
         " at its entry, Ø", neck_thread_d_at(h2), " at its end, smallest opening Ø",
         neck_thread_d_at(h2) - 2*thread_depth));


// The bulb, standing on its neck as it prints: v1's diffusor and a neck, d3
// wide and h2 long, with the thread for the clip.
module diffusorwithfemale(){

    union(){

        difference(){

            diffusor(
                height = heightdiffusor,
                layerheight = layerheightdiffusor,
                thick = thicknessdiffusor,
                radius = radiusdiffusor,
                corners = cornersdiffusor
            );
            cylinder(h = h2, d = d3);

        }
        difference(){
            cylinder(h = h2, d = d3);
            neck_thread();
        }

    }

}

// The neck's thread as a solid, to cut from the neck: thread_clearance
// around the clip's thread at the entry, clamp narrower than it at h2. It
// runs a pitch beyond both ends, so its helix stays in step with the clip's.
module neck_thread(){
    translate([0, 0, -thread_pitch])
    threaded_rod(neck_thread_d_at(-thread_pitch), neck_thread_d_at(h2 + thread_pitch),
                 h2 + 2*thread_pitch, thread_pitch, $fn = thread_fn);
    translate([0, 0, -1])
    cylinder(h = 1 + eps, r = neck_thread_d/2 + lead_in, $fn = thread_fn);
    cylinder(h = lead_in + thread_depth, r1 = neck_thread_d/2 + lead_in,
             r2 = neck_thread_d/2 - thread_depth, $fn = thread_fn);
}

// The clip, standing on the end that stays outside the bulb, its tip up: a
// C around the LED's socket with the thread outside, which starts on a 45
// degree chamfer at the tip. The C opens towards +x.
module clippart(){
    difference(){
        intersection(){
            threaded_rod(thread_d, thread_d, clip_length, thread_pitch, $fn = thread_fn);
            cylinder(h = clip_length, r1 = thread_d/2 - thread_depth + clip_length,
                     r2 = thread_d/2 - thread_depth, $fn = thread_fn);
        }
        translate([0, 0, -1])
        cylinder(h = clip_length + 2, d = clip_bore);
        translate([0, 0, -1])
        linear_extrude(clip_length + 2)
        polygon([[0, 0],
                 [2*thread_d*cos(clip_gap_angle/2), -2*thread_d*sin(clip_gap_angle/2)],
                 [2*thread_d*cos(clip_gap_angle/2), 2*thread_d*sin(clip_gap_angle/2)]]);
    }
}

// Threaded rod from z = 0 to h, its major diameter d_bottom at z = 0 and
// d_top at z = h, as the screws of fdm_optimized_screws. render() keeps the
// preview working with this many threads.
module threaded_rod(d_bottom, d_top, h, pitch) {
    render(convexity = 4) intersection() {
        union() {
            cylinder(h = h, r1 = d_bottom/2 - thread_depth + eps, r2 = d_top/2 - thread_depth + eps);
            thread_ridge(d_bottom/2 - thread_depth, (d_top - d_bottom) / 2 / h, -pitch, h + pitch, pitch);
        }
        cylinder(h = h, r1 = d_bottom/2 + 1, r2 = d_top/2 + 1);
    }
}

// Sweeps a trapezoid around a right-handed helix, its root at
// r_root + slope x z. Equal radial depth and axial flank run give 45 degree
// flanks (90 degree included angle).
module thread_ridge(r_root, slope, z0, z1, pitch) {
    half_tip = 0.05 * pitch;
    steps = ceil((z1 - z0) / pitch * $fn);
    profile = [[-eps, -half_tip - thread_depth - eps],
               [thread_depth, -half_tip],
               [thread_depth, half_tip],
               [-eps, half_tip + thread_depth + eps]];
    points = [for (i = [0:steps])
        let(z = z0 + (z1 - z0) * i / steps, a = 360 * z / pitch)
        for (p = profile) let(r = r_root + slope * (z + p[1]) + p[0])
            [r * cos(a), r * sin(a), z + p[1]]];
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

// The clip screwed into the neck all the way, turned so its thread lies in
// the neck's, upside down as the bulb hangs. Where the clip overlaps the
// neck's thread near the tip is the clamp that closes its C.
module assembly(){
    rotate([180, 0, 0]){
        diffusorwithfemale();
        color([0.85, 0.6, 0.3])
        translate([0, 0, h2 - clip_length])
        rotate(360 * (h2 - clip_length) / thread_pitch)
        clippart();
    }
}

module section(){
    difference(){
        assembly();
        translate([-100, -200, -100]) cube(200);
    }
}

module print_layout(){
    diffusorwithfemale();
    translate([d3*3,0,0])
    clippart();
}


// compensaate basea
module ringconnector(){
    difference(){
        cylinder(h = 1, d = radiusdiffusor+2);
        cylinder(h = 2, d = d4+0.2);
    }
}
// ringconnector();

if (part == "print_layout") print_layout();
else if (part == "assembly") assembly();
else if (part == "section") section();
else if (part == "bulb") diffusorwithfemale();
else if (part == "clip") clippart();
