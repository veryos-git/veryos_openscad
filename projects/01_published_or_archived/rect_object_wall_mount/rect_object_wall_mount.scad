include <BOSL2/std.scad>

// Wall-mount bracket for a rectangular or round magnet.
// The block acts as a cover over the magnet: bottom face seats against
// the wall and the magnet pocket opens onto that wall face, so the wall
// closes the pocket and traps the magnet inside. The exposed top face
// carries two counterbored screw holes; the screws pass through the
// block into the wall and their heads recess into the top face.

/* [Magnet] */
preset = "25x15x5"; // [custom_rect:Custom rectangular, custom_round:Custom round, 10x5x1:Rect 10 × 5 × 1 mm, 10x5x2:Rect 10 × 5 × 2 mm, 20x10x2:Rect 20 × 10 × 2 mm, 20x10x3:Rect 20 × 10 × 3 mm, 25x15x5:Rect 25 × 15 × 5 mm, 30x10x2:Rect 30 × 10 × 2 mm, 30x10x3:Rect 30 × 10 × 3 mm, 40x10x3:Rect 40 × 10 × 3 mm, 50x10x3:Rect 50 × 10 × 3 mm, D2x2:Round Ø 2 × 2 mm, D3x1:Round Ø 3 × 1 mm, D4x2:Round Ø 4 × 2 mm, D5x1:Round Ø 5 × 1 mm, D5x2:Round Ø 5 × 2 mm, D5x3:Round Ø 5 × 3 mm, D6x2:Round Ø 6 × 2 mm, D6x3:Round Ø 6 × 3 mm, D6x4:Round Ø 6 × 4 mm, D8x2:Round Ø 8 × 2 mm, D8x3:Round Ø 8 × 3 mm, D10x2:Round Ø 10 × 2 mm, D10x3:Round Ø 10 × 3 mm, D12x2:Round Ø 12 × 2 mm, D12x3:Round Ø 12 × 3 mm, D15x2:Round Ø 15 × 2 mm, D15x3:Round Ø 15 × 3 mm, D20x2:Round Ø 20 × 2 mm, D20x3:Round Ø 20 × 3 mm, D25x2:Round Ø 25 × 2 mm, D25x3:Round Ø 25 × 3 mm]

/* [Custom rectangular magnet] */
custom_length = 25; // [1:0.1:200]
custom_width  = 15; // [1:0.1:200]
custom_height =  5; // [0.5:0.1:50]

/* [Custom round magnet] */
custom_diameter  = 10; // [1:0.1:50]
custom_thickness =  3; // [0.5:0.1:20]

/* [Bracket] */
tolerance          = 0.2;
thick_top          = 0.6;   // cover thickness over the magnet (away from wall)
thick_side         = 1.2;   // material around the magnet pocket
width_screw_holder = 10;    // lateral space allocated for each screw column
chamfer            = 0.5;   // 45° chamfer on outer edges and counterbore openings

/* [Screw] */
screw_diameter      = 4;    // shaft clearance hole (M4)
screw_head_diameter = 6;    // counterbore diameter (head + clearance)
counterbore_depth   = 2.5;  // head recess from the top (exposed) face
floor_min           = 1;    // minimum solid material between counterbore and wall face

/* [Quality] */
$fn = 64;

// [id, shape, dim1, dim2, dim3] — rect: L, W, H ; round: D, H
preset_table = [
    ["10x5x1",  "rect",  10,  5, 1],
    ["10x5x2",  "rect",  10,  5, 2],
    ["20x10x2", "rect",  20, 10, 2],
    ["20x10x3", "rect",  20, 10, 3],
    ["25x15x5", "rect",  25, 15, 5],
    ["30x10x2", "rect",  30, 10, 2],
    ["30x10x3", "rect",  30, 10, 3],
    ["40x10x3", "rect",  40, 10, 3],
    ["50x10x3", "rect",  50, 10, 3],
    ["D2x2",    "round",  2, 2],
    ["D3x1",    "round",  3, 1],
    ["D4x2",    "round",  4, 2],
    ["D5x1",    "round",  5, 1],
    ["D5x2",    "round",  5, 2],
    ["D5x3",    "round",  5, 3],
    ["D6x2",    "round",  6, 2],
    ["D6x3",    "round",  6, 3],
    ["D6x4",    "round",  6, 4],
    ["D8x2",    "round",  8, 2],
    ["D8x3",    "round",  8, 3],
    ["D10x2",   "round", 10, 2],
    ["D10x3",   "round", 10, 3],
    ["D12x2",   "round", 12, 2],
    ["D12x3",   "round", 12, 3],
    ["D15x2",   "round", 15, 2],
    ["D15x3",   "round", 15, 3],
    ["D20x2",   "round", 20, 2],
    ["D20x3",   "round", 20, 3],
    ["D25x2",   "round", 25, 2],
    ["D25x3",   "round", 25, 3],
];

function lookup(id, i = 0) =
    i >= len(preset_table) ? undef :
    preset_table[i][0] == id ? preset_table[i] :
    lookup(id, i + 1);

entry = preset == "custom_rect"
    ? ["custom_rect", "rect", custom_length, custom_width, custom_height]
    : preset == "custom_round"
        ? ["custom_round", "round", custom_diameter, custom_thickness]
        : lookup(preset);

is_round = entry[1] == "round";

mag_L = entry[2];
mag_W = is_round ? entry[2] : entry[3];
mag_H = is_round ? entry[3] : entry[4];

pL = mag_L + 2 * tolerance;
pW = mag_W + 2 * tolerance;
pH = mag_H + tolerance;

bL = pL + 2 * thick_side + 2 * width_screw_holder;
bW = pW + 2 * thick_side;
// Block tall enough for the magnet pocket and for the counterbore + floor
bH = max(pH + thick_top, counterbore_depth + floor_min);

screw_x = pL/2 + thick_side + width_screw_holder/2;

eps = 0.01;

module bracket() {
    difference() {
        cuboid([bL, bW, bH], chamfer = chamfer, anchor = BOTTOM);
        if (is_round)
            translate([0, 0, -eps])
                cylinder(d = pL, h = pH + eps);
        else
            translate([-pL/2, -pW/2, -eps])
                cube([pL, pW, pH + eps]);
        for (sx = [-1, 1])
            translate([sx * screw_x, 0, 0]) {
                translate([0, 0, -eps])
                    cylinder(d = screw_diameter, h = bH + 2 * eps);
                translate([0, 0, bH - counterbore_depth])
                    cylinder(d = screw_head_diameter, h = counterbore_depth + eps);
                translate([0, 0, bH - chamfer])
                    cylinder(h = chamfer + eps,
                             d1 = screw_head_diameter,
                             d2 = screw_head_diameter + 2 * chamfer);
            }
    }
}

bracket();
