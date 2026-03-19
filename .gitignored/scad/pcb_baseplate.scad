// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under MIT. See LICENSE file for details

// ============================================
// PCB Baseplate Generator
// Protects bottom-side SMD components
// ============================================

// --- MEASURE YOUR PCB AND ENTER VALUES HERE ---

// PCB dimensions (mm)
n_scl_x__pcb        = 80;    // PCB width
n_scl_y__pcb        = 50;    // PCB length
n_scl_z__pcb        = 1.6;   // PCB thickness

// Mounting holes (mm)
n_dia__hole          = 3.2;   // Hole diameter (e.g. 3.2 for M3)
n_off_x__hole        = 3.5;   // Hole center distance from PCB edge X
n_off_y__hole        = 3.5;   // Hole center distance from PCB edge Y

// Baseplate parameters (mm)
n_scl_z__clearance   = 3.0;   // Height of cavity (space for SMD components)
n_scl_z__floor       = 1.5;   // Thickness of the solid floor
n_off__wall          = 1.5;   // Wall thickness around PCB edge
n_gap__pcb           = 0.2;   // Gap between PCB edge and inner wall (tolerance)

// Standoff parameters (mm)
n_dia__standoff      = 6.0;   // Standoff outer diameter
n_scl_z__standoff    = 0;     // Extra standoff height above rim (0 = flush with rim)

// --- END OF PARAMETERS ---

// Derived values
n_scl_x__outer = n_scl_x__pcb + 2 * (n_gap__pcb + n_off__wall);
n_scl_y__outer = n_scl_y__pcb + 2 * (n_gap__pcb + n_off__wall);
n_scl_z__rim   = n_scl_z__floor + n_scl_z__clearance;
n_scl_z__total = n_scl_z__rim + n_scl_z__standoff;

n_r__hole     = n_dia__hole / 2;
n_r__standoff = n_dia__standoff / 2;

// Hole positions relative to PCB origin (bottom-left corner of PCB)
a_a_n_pos__hole = [
    [n_off_x__hole,                  n_off_y__hole],
    [n_scl_x__pcb - n_off_x__hole,  n_off_y__hole],
    [n_scl_x__pcb - n_off_x__hole,  n_scl_y__pcb - n_off_y__hole],
    [n_off_x__hole,                  n_scl_y__pcb - n_off_y__hole]
];

// PCB origin offset (PCB sits centered inside the outer shell)
n_off_x__pcb = n_gap__pcb + n_off__wall;
n_off_y__pcb = n_gap__pcb + n_off__wall;

$fn = 40;

module m_baseplate() {
    difference() {
        union() {
            // Outer shell: floor + rim walls
            difference() {
                // Solid outer block
                cube([n_scl_x__outer, n_scl_y__outer, n_scl_z__rim]);

                // Hollow out the cavity (leave floor and walls)
                translate([n_off__wall, n_off__wall, n_scl_z__floor])
                    cube([
                        n_scl_x__outer - 2 * n_off__wall,
                        n_scl_y__outer - 2 * n_off__wall,
                        n_scl_z__clearance + 1  // +1 to cut through top
                    ]);
            }

            // Standoffs at each hole position
            for (n_pos = a_a_n_pos__hole) {
                translate([
                    n_off_x__pcb + n_pos[0],
                    n_off_y__pcb + n_pos[1],
                    0
                ])
                    cylinder(h = n_scl_z__total, r = n_r__standoff);
            }
        }

        // Drill through-holes at each mounting position
        for (n_pos = a_a_n_pos__hole) {
            translate([
                n_off_x__pcb + n_pos[0],
                n_off_y__pcb + n_pos[1],
                -1
            ])
                cylinder(h = n_scl_z__total + 2, r = n_r__hole);
        }
    }
}

m_baseplate();

// --- Info echo ---
echo(str("Baseplate outer: ", n_scl_x__outer, " x ", n_scl_y__outer, " x ", n_scl_z__rim, " mm"));
echo(str("Cavity depth: ", n_scl_z__clearance, " mm"));
echo(str("Total height with standoffs: ", n_scl_z__total, " mm"));
