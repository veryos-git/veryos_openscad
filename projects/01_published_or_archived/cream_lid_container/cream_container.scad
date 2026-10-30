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

/* [Dimensions] */
neck_height = 3;
neck_wall_at_crest = 3;
lid_wall = 3;
bottom_thickness = 1.6;
lid_top_thickness = 1.6;
edge_chamfer = 1;

/* [45 degree flank / 90 degree included thread] */
thread_pitch = 2;
// Small crest/root flats; flank radial depth equals flank axial run.
thread_depth = 0.9;
// Diametral clearance: 0.5 gives 0.25 mm radial clearance.
thread_tolerance = 0.5;
// Additional vertical play in the female profile.
axial_clearance = 0.10;

/* [Display spacing] */
exploded_gap = 5;
print_gap = 8;

/* [Hidden] */
$fn = quality;
eps = 0.01;
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
lid_height = neck_height + lid_top_thickness;
flat = (thread_pitch-2*thread_depth)/2;

assert(volume_ml > 0 && volume_ml <= 1000, "Capacity must be positive and <= 1000 ml");
assert(quality >= 32 && quality == floor(quality), "Use integer quality >= 32");
assert(thread_pitch > 0 && thread_depth > 0 && 2*thread_depth < thread_pitch,
       "Thread depth must be less than half the pitch");
assert(neck_wall_at_crest > thread_depth && neck_height > 0);
assert(thread_tolerance >= 0 && axial_clearance >= 0 && axial_clearance < 2*flat);
assert(bottom_thickness > 0 && lid_top_thickness > 0 && lid_wall > 0);
assert(edge_chamfer >= 0 && edge_chamfer < min(lid_top_thickness,lid_wall));

echo(capacity_ml=capacity(bowl_radius)/1000, bowl_radius_mm=bowl_radius,
     outside_diameter_mm=2*outer_r, container_height_mm=rim_z,
     lid_height_mm=lid_height);

// Right-handed, single-start thread. In an axial section, each sloping
// flank has |dr/dz|=1: 45 degrees, giving a 90 degree included angle.
// Slight crest/root flats avoid fragile knife edges.
function thread_r(a,z,play=0) =
    let(t=(z-thread_pitch*a/360)/thread_pitch,
        phase=(t-floor(t))*thread_pitch,
        distance=abs(phase-thread_pitch/2))
    root_r + max(0,min(thread_depth,
        thread_pitch/2-flat/2-distance+play/2));

// Closed radial solid with a sampled helical boundary. Shared vertices and
// triangulated faces avoid non-planar quad faces and coincident helix seams.
// z is measured from the container shoulder in both mating parts.
module thread_solid(height, clearance=0, play=0, start_z=0) {
    nz = ceil((height-start_z)/thread_pitch*quality);
    points = concat(
        [for(j=[0:nz], i=[0:quality-1])
            let(a=360*i/quality, z=start_z+(height-start_z)*j/nz,
                r=thread_r(a,z,play)+clearance)
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

module container() {
    difference() {
        union() {
            // Cylindrical exterior with the reference's lower edge chamfer.
            rotate_extrude() polygon([
                [0,0],[outer_r-edge_chamfer,0],
                [outer_r,edge_chamfer],[outer_r,shoulder_z],[0,shoulder_z]]);
            // Overlap the shoulder so the neck remains one connected solid.
            translate([0,0,shoulder_z-eps]) cylinder(r=root_r,h=2*eps);
            translate([0,0,shoulder_z]) thread_solid(neck_height);
        }
        translate([0,0,shoulder_z]) sphere(r=bowl_radius);
        translate([0,0,shoulder_z]) cylinder(r=bowl_radius,h=neck_height+eps);
    }
}

// Lid is defined open-side down at z=0, matching shoulder-relative phase.
module lid() {
    difference() {
        rotate_extrude(convexity=12) polygon([
            [0,0],[outer_r,0],[outer_r,lid_height-edge_chamfer],
            [outer_r-edge_chamfer,lid_height],[0,lid_height]]);
        // Continue the entire helical cutter below the opening; a cylindrical
        // extension alone leaves coincident faces around the thread valleys.
        thread_solid(neck_height,thread_tolerance/2,axial_clearance,-eps);
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
