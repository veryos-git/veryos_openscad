// gear_medium : 42 teeth, module 1, PA 20 deg, 10 mm thick, 36 mm bore (thin ring gear)
// Onshape: "Spur Gear" FS (numTeeth=42, module=1mm, gearDepth=10mm) -> Extrude-remove D36 -> Chamfer 1 mm
// Onshape orientation: gear axis = -Y, occupies y = -10 .. 0.  Here: axis = +Z, z = 0 .. 10.
include <involute_gear.scad>
spur_gear(teeth = 42, mod = 1, thickness = 10, bore = 36, bore_chamfer = 1);
