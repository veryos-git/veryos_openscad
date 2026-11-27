// gear_olympus : 32 teeth, module 1, PA 20 deg, 10 mm thick, 17.5 mm bore
// Onshape: "Spur Gear" FS (numTeeth=32) -> Extrude-remove D17.5 -> Chamfer 1 mm
// (fits onto the microscope (Olympus) focus knob - check bore against the real knob)
include <involute_gear.scad>
spur_gear(teeth = 32, mod = 1, thickness = 10, bore = 17.5, bore_chamfer = 1);
