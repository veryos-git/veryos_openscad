// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under MIT. See LICENSE file for details

// ============================================
// PCB Baseplate Generator
// Protects bottom-side SMD components
// ============================================

/* [Board Dimensions] */

// Board width in mm
n_scl_x__board       = 80;
// Board height in mm
n_scl_y__board       = 50;
// Board thickness in mm
n_scl_z__board       = 1.6;

/* [Mounting Holes] */

// Hole-to-hole distance in X direction (center-to-center) in mm
n_scl_x__hole        = 73;
// Hole-to-hole distance in Y direction (center-to-center) in mm
n_scl_y__hole        = 43;
// Hole diameter in mm
n_dia__hole          = 3.2; // [2.2:M2, 3.2:M3, 4.3:M4, 5.3:M5]
// Standoff outer diameter in mm
n_dia__standoff      = 6.0;

/* [Baseplate] */

// Cavity depth - space for SMD components in mm
n_scl_z__clearance   = 3.0;
// Floor thickness in mm
n_scl_z__floor       = 1.5;
// Wall thickness around PCB edge in mm
n_off__wall          = 1.5;
// Gap between PCB edge and inner wall (print tolerance) in mm
n_gap__pcb           = 0.2;
// Extra standoff height above rim in mm (0 = flush)
n_scl_z__standoff    = 0;

// Derived values
n_scl_x__outer = n_scl_x__board + 2 * (n_gap__pcb + n_off__wall);
n_scl_y__outer = n_scl_y__board + 2 * (n_gap__pcb + n_off__wall);
n_scl_z__rim   = n_scl_z__floor + n_scl_z__clearance;
n_scl_z__total = n_scl_z__rim + n_scl_z__standoff;

n_r__hole     = n_dia__hole / 2;
n_r__standoff = n_dia__standoff / 2;

// Hole positions relative to PCB origin (centered on board)
n_cx = n_scl_x__board / 2;
n_cy = n_scl_y__board / 2;
n_off_x__hole = n_scl_x__hole / 2;
n_off_y__hole = n_scl_y__hole / 2;

a_a_n_pos__hole = [
    [n_cx - n_off_x__hole, n_cy - n_off_y__hole],
    [n_cx + n_off_x__hole, n_cy - n_off_y__hole],
    [n_cx + n_off_x__hole, n_cy + n_off_y__hole],
    [n_cx - n_off_x__hole, n_cy + n_off_y__hole]
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
echo(str("Board: ", n_scl_x__board, " x ", n_scl_y__board, " x ", n_scl_z__board, " | Holes: ", n_scl_x__hole, " x ", n_scl_y__hole));
echo(str("Baseplate outer: ", n_scl_x__outer, " x ", n_scl_y__outer, " x ", n_scl_z__rim, " mm"));
echo(str("Cavity depth: ", n_scl_z__clearance, " mm"));
echo(str("Total height with standoffs: ", n_scl_z__total, " mm"));
