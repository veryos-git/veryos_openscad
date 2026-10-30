/**
 * Star Generator
 *
 * Sourcecode: https://github.com/veryos-git/openscad_star_translucent_randomline_cutout
 * Author: veryos  
 * Version: 1.0
 *
 * Description:
 * This OpenSCAD script generates a 3d object that is ornamental mandala like.
 *
 * License:
 *    Licensed under the GNU General Public License v3.0 or later.
 *    See the LICENSE.txt file in the repository root for details.
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


/* [Geometry] */
// Change this to get a different random pattern
variation_seed = 41.1; // [0:0.1:100]
// Number of points in the star (symmetry)
num_sectors = 5; // [3:12]
// num_sectors overwritten if random_sectors = true
random_sectors = false; // [true,false]
// Overall star diameter in mm
diameter_mm = 80; // [10:400]
// How many stars to generate in a grid
grid_count = 9; // [1,4,9,16,25]

/* [Layers & Depth] */
// Layer height in mm (match your slicer settings)
layer_step_mm = 0.2; // [0.08:0.04:0.4]

/* [Pattern Lines] */
// Number of random pattern lines per sector
lines_per_sector = 6; // [1:20]
// Minimum line width in mm (should match your nozzle size)
line_width_min_mm = 0.42; // [0.3:0.01:5.0]
// Maximum line width in mm
line_width_max_mm = 3.0; // [0.3:0.1:20.0]

/* [Shape] */
// Controls the depth of the star valleys (0=shallow, 2=deep)
inner_radius_factor = 0.5; // [0:0.05:2.0]
// Controls how pointed each star tip is (0=round, 1=sharp)
angle_bias = 0.35; // [0:0.01:1.0]
// how much each sector is translated away from center (mm)
center_translation_sector = -15; // [-100:1:0]
// /* [Export & Preview] */
// // Center the model at origin for easier bed placement
// center_on_origin = true;
// // Show flat polygon outline for debugging
// show_preview_2d = false;
// // Show coordinate axes helper
// show_axes = true;



// Helper functions
function centroid(pa, pb, pc) = [(pa[0]+pb[0]+pc[0])/3, (pa[1]+pb[1]+pc[1])/3];

// Internal derived variables
mandala_radius = diameter_mm/2;
sector_basis_scl_z = layer_step_mm*10;
randomline_z_offset_max = sector_basis_scl_z;


function triangle_max_sideleng(a,b,c) = 
    let(
        a1 = norm(b - a),
        b2 = norm(c - b),
        c3 = norm(a - c)
    )
    max([a1,b2,c3]);



function random_point_in_triangle(pa, pb, pc, seed) =
    let(
        r1 = rands(0, 1, 1, seed)[0],
        r2 = rands(0, 1, 1, seed+23)[0],
        u  = r1 + r2 > 1 ? 1 - r1 : r1,
        v  = r1 + r2 > 1 ? 1 - r2 : r2
    )
    pa + u*(pb - pa) + v*(pc - pa);




module mandala(seed_offset=0) {

    s = variation_seed + seed_offset;
    corners_ = random_sectors ? floor(rands(3,9,1, s)[0]) : num_sectors;

    max_rand_angle = 360/corners_;
    seed = s;

    p1_angle = 360/corners_;

    pa = [0, 0];
    pb = [0, mandala_radius];
    p1 = [mandala_radius * sin(p1_angle), mandala_radius * cos(p1_angle)];
    p1_angle_2 = atan2(p1[0], p1[1]);
    // the middle point between pb and p1 
    p2 = pb + angle_bias * (p1-pb);
    lengthp2 = norm(p2);
    newradiusfactor = inner_radius_factor* lengthp2;
    p3angle = atan2(p2[0], p2[1]);
    p3 = [newradiusfactor * sin(p3angle), newradiusfactor * cos(p3angle)];

    rv = pb-p3; 

    rvap3 = p3 - pa;

    points = [pa, pb, p3];
    faces = [[0,1,2]];


    sector_max_scl_z = layer_step_mm*lines_per_sector;
    // how much a point is not linear distributed towards the mandala radius
    

    hole_at_corners = true; // [true,false]


    module randomlines(pa, pb, p3, seed_offset=0){
        union(){
            for(i = [0:lines_per_sector-1]) 
                let(
                    max_sidelength = triangle_max_sideleng(pa, pb, p3),
                    trn_rand = random_point_in_triangle(pa, pb, p3 , seed+i), 
                    rotation = rands(0,360,1, seed+i+50)[0], 
                    random_z_offset = layer_step_mm*(i+1),
                    //rands(layer_step_mm, randomline_z_offset_max,1, seed+i+100)[0], 
                    width = max_sidelength, 
                    height = rands(line_width_min_mm , line_width_max_mm, 1, seed+i+150)[0] // width of the 'line'
                    // get a random point in the area of the 
                ){
                    translate([trn_rand[0], trn_rand[1], random_z_offset])
                    rotate([0,0,rotation])
                    translate([-(width/2), 0, 0])
                    color([0.2, 0.5, 0.8, 0.4])
                    cube([
                        width, 
                        height, 
                        sector_max_scl_z*3
                    ]);
                }
        } 
        
    }

    module sector_half_intersector() {
        linear_extrude(height = sector_basis_scl_z*20)
            polygon(points = points, paths = faces);
    }

    module sector_half_positive(seed_offset=0) {
        
            // randompolygons(seed_offset);
            difference() {

                intersection(){
                    linear_extrude(height = sector_basis_scl_z)
                    polygon(points = points, paths = faces);
                    sector_half_intersector();
                }
                randomlines(pa, pb, p3, seed_offset);

            }
        
    }
    module sector_with_hole(seed_offset=0) {
        let(
            downscalefactor = 0.2
        ){
            difference(){
                sector_half_positive(seed_offset);
                translate([0, mandala_radius-mandala_radius*downscalefactor*2, 0])
                scale([downscalefactor,downscalefactor, 222])
                sector_half_intersector();
            }
        }
    }
    module sector_if(seed_offset=0){
   
            if (hole_at_corners) {
                sector_with_hole(seed_offset);
            } else {
                sector_half_positive(seed_offset);
            }
    
    }
    module sector(seed_offset=0) {
        union() {
            sector_if(seed_offset);
            mirror([1, 0, 0])
                sector_if(seed_offset);
        }
    }

    // randomlines(pa, pb, p3, seed);
    // sector_if();
    // sector();
    for(i = [0:corners_-1]) {
        rotate([0, 0, i * 360/corners_])
            translate([0, center_translation_sector, 0])
            sector(seed_offset);
    }
}




module mandalas() {
    spacing = diameter_mm*1.01;
    rows = sqrt(grid_count);
    cols = sqrt(grid_count);
    
    translate([-spacing*(cols-1)/2, -spacing*(rows-1)/2, 0])
    for(x = [0:cols-1]){
        for(y = [0:rows-1]){
            translate([x*spacing, y*spacing, 0])
                let(
                    seed_offset_unique = (x*rows + y)*10
                )
                mandala(seed_offset_unique);
        }
    }
}

// sector_half_positive();
// randompolygons(0);
// mandala();
mandalas();
