// gear_byj48 : 12 teeth, module 1, PA 20 deg, 10 mm thick, double-D bore for 28BYJ-48 stepper shaft
// Bore: D5.2 with two flats 3.2 mm apart (shaft is 5 mm / 3 mm flats -> 0.2 mm clearance)
// Onshape also has a 0.2 mm chamfer (Chamfer 1) - omitted here.
include <involute_gear.scad>
spur_gear(teeth = 12, mod = 1, thickness = 10, bore = 5.2, d_flat = 3.2);
