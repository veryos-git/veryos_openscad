

/**
 * Stringlights generator
 *
 * Author: veryos  
 * Version: 1.0
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
 */
 
//wont work in makerworld
//include <BOSL/constants.scad>
// https://github.com/revarbat/BOSL/wiki/shapes.scad
// use <BOSL/shapes.scad>
// use <BOSL/constants.scad>

//using BOSL2 for makerworld compatibility
// https://github.com/BelfrySCAD/BOSL2/wiki/shapes3d.scad#module-rect_tube
include <BOSL2/std.scad>;


ntau = 360*1;

ribs = 12; 
// 'resolution' of ribs
corner_modulo = 8;
// 360/12ribs = 30deg, in this case this is one 'rib' offset
rotation_offset_ribs = 30; 
// in mm
height = 40;
heightdiffusor = height; 





// Full-featured arced_slot compatible with BOSL1 API
module arced_slot_bosl2_full(
    h = 1.0,
    r = undef, d = undef,
    sr = undef, sd = undef,
    sr1 = undef, sd1 = undef,
    sr2 = undef, sd2 = undef,
    sa = 0, ea = 90,
    cp = [0, 0, 0],
    orient = UP,
    anchor = CENTER,
    center = undef,
    fn2 = undef,
    spin = 0
) {
    // Resolve arc radius (r vs d)
    arc_r = is_def(r) ? r : 
            is_def(d) ? d/2 : 
            0.5;
    
    // Resolve slot radii (sr/sd vs sr1/sd1 and sr2/sd2)
    slot_r1 = is_def(sr1) ? sr1 :
              is_def(sd1) ? sd1/2 :
              is_def(sr) ? sr :
              is_def(sd) ? sd/2 :
              0.5;
    
    slot_r2 = is_def(sr2) ? sr2 :
              is_def(sd2) ? sd2/2 :
              is_def(sr) ? sr :
              is_def(sd) ? sd/2 :
              slot_r1;
    
    // Resolve $fn for endcaps
    fn_minor = is_def(fn2) ? fn2 : $fn;
    
    // Resolve vertical anchor
    // center parameter overrides anchor
    final_anchor = is_def(center) ? 
                   (center ? CENTER : BOTTOM) :
                   anchor;
    
    // Calculate size for attachable
    size = [2*(arc_r + slot_r1), 2*(arc_r + slot_r1), h];
    
    // Use attachable for proper BOSL2 behavior
    attachable(anchor=final_anchor, spin=spin, orient=orient, size=size) {
        translate(cp)
        linear_extrude(h, center=true, scale=slot_r2/slot_r1)
        let(path = arc(r=arc_r, angle=[sa, ea]))
        stroke(path, width=slot_r1*2, closed=false, $fn=fn_minor);
        
        children();
    }
}




d = 5*1; 
d2 = 0.8*1; 
a = 50*1; 
h = 18*1; 
fn = 32*1;
$fn = fn*1;

d3 = 10*1; 
stol = 0.2*1;
d4 = d + d2 + stol;
thickness = 2*1;
h2 = 7*1;
ovlap = 0.6*1; // overlap
circular_patterns = 6*1;


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
    cuboid([length,length, 0.2]);
    color([1,0,0,0.4])
    cuboid([length,2, 0.2]);
    rotate([90,0,0])
    color([0,1,0,0.2])
    cuboid([length,length, 0.2]);
    color([0,1,0,0.4])
    cuboid([length,2, 0.2]);
    rotate([0,90,0])
    color([0,0,1,0.2])
    cuboid([length,length, 0.2]);
    color([0,0,1,0.4])
    cuboid([length,2, 0.2]);
}
// cp	centerpoint of slot arc. (default: [0, 0, 0])
// h	height of slot arc shape. (default: 1.0)
// r	radius of slot arc. (default: 0.5)
// d	diameter of slot arc. (default: 1.0)
// sr	radius of slot channel. (default: 0.5)
// sd	diameter of slot channel. (default: 0.5)
// sr1	bottom radius of slot channel cone. (use instead of sr)
// sr2	top radius of slot channel cone. (use instead of sr)
// sd1	bottom diameter of slot channel cone. (use instead of sd)
// sd2	top diameter of slot channel cone. (use instead of sd)
// sa	starting angle. (Default: 0.0)
// ea	ending angle. (Default: 90.0)
// orient	Orientation of the arced slot. Use the ORIENT_ constants from constants.scad. Default: ORIENT_Z.
// align	Alignment of the arced slot. Use the V_ constants from constants.scad. Default: V_CENTER.
// center	If true, centers vertically. If false, drops flush with XY plane. Overrides align.
// $fn2	The $fn value to use on the small round endcaps. The major arcs are still based on $fn. Default: $fn


    module arced_squeeze_slot(
        dinner = 5, 
        thickness = 2, 
        height = 10, 
        overlap = 0.5, 
        circular_patterns = 6, 
        sa = 0, 
        ea = 360, 
        chamferwidth = 0.0,
        fn = 32,
    ){
        // a slot that has a number of cirulated patterened cylinders that hull inwards
        // from bottom to top the space in the 'tube' gets smaller
        // a different tube can be pushed in the 'tube' and a friction fit is created

        // od	Outer diameter of tube.
        // // id	Inner diameter of tube.
        // tube(od = d3, id = d4, h = h2, align = V_CENTER);
        let(
            douter = dinner + thickness,
            d_outer = max(dinner, douter),
            d_inner = min(dinner, douter), 
            d_slot_channel = (d_outer - d_inner), 
            d_slot_arc = d_inner+thickness,
            s_a = min(sa, ea),
            s_e = max(sa, ea),
            degrees_delta = s_e - s_a,
            angle_step = degrees_delta / circular_patterns, 
            d1 = d_slot_channel,
            d2 = overlap+(d_slot_channel/2),
            t1 = d_slot_arc/2, // tangent to inner radius of slot 
            t2 = d_slot_arc/2-(d2/2),  // tangent to d_outer
            hfix = 0.1,  // hull only working on cylinder, 
            minwidthbuildplatecontact = 1, 
            d1_chamf = (dinner)+chamferwidth, 
            d2_chamf = dinner, 
            hchamf = chamferwidth, // both sides ssame length = 45 degrees angle

            // we need 45 degree chamfer
        ){
            difference(){
                union(){
                    echo(d_slot_channel);
                    color(rtclr(23))
                    arced_slot_bosl2_full(h=height, d=d_slot_arc, sd = d_slot_channel, sa = s_a, ea = s_e);
                    $fn = fn;
                    translate([0,0,-height/2])
                    for (i=[0:circular_patterns-1]) {
                        color(rtclr(i*10))
                        hull() {
                            rotate([0,0,i*angle_step-90])
                            translate([0,t1,hfix/2])
                            cylinder(h = hfix, d = d1, center = true);
                            rotate([0,0,i*angle_step-90])
                            translate([0,0,-hfix/2])
                            translate([0,t2,height])
                            cylinder(h = hfix , d = d2, center = true);
                        }
                    }
                    
                }

                color(23)
                translate([0,0,-height/2])
                cylinder(d1 = d1_chamf, d2 = d2_chamf, h = hchamf);
            }
        }
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
                    itnor_layer = it_layer / its_layer,
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
        translate([0,0,h2/2])
        arced_squeeze_slot(
            dinner = d4,
            thickness = thickness,
            height = h2,
            overlap = ovlap,
            circular_patterns = circular_patterns,
            sa = 0,
            ea = 360,
            chamferwidth = 1,
            fn = fn
        );

    }
        
}

module clippart(){
    htmp = 9;
    union(){

        translate([d3*3,0,htmp/2])
        arced_slot_bosl2_full(h=htmp, d=d, sd = d2, sa = 0, ea = 360-a);
        //brim compensation
        hbc = 2;
        translate([d3*3,0,hbc/2])
        arced_slot_bosl2_full(h=hbc, d = 6, sd1 = 1, sd2=.5, sa = 0, ea = 360-a);
        // ahp(50);
    }

}


// compensaate basea
module ringconnector(){
    difference(){
        cylinder(h = 1, d = radiusdiffusor+2);
        cylinder(h = 2, d = d4+0.2);
    }
}
// ringconnector();

diffusorwithfemale();
clippart();

