// Starter for rebuilding the Onshape parts. Units: mm.
// Requires BOSL2 for gears/threads: https://github.com/BelfrySCAD/BOSL2
include <BOSL2/std.scad>
include <BOSL2/gears.scad>
include <BOSL2/threading.scad>

// --- z_focus_gear variables (Onshape) ---
stol = 0.2; gear_width = 10; spatzig = 1; tolerance = 0.15; gear_friction_pins = 64;
// --- Part Studio 1 ---
comp_angle = 2; thick = 6; dia_screw_ps1 = 5; screwtol = 0.5;
// --- screw ---
dia_screw = 7; pitch = 2; extr = 10;

module z_focus_gear_base() spur_gear(mod=1, teeth=42, pressure_angle=20, thickness=gear_width);
module pinion_base() spur_gear(mod=1, teeth=10, pressure_angle=20, thickness=7);

// Example: bring in a traced sketch and extrude it
// linear_extrude(height=50) import("dxf/Part Studio 1/holder.dxf", layer="GEOMETRY");

// Reference overlay (transparent) to compare with your rebuild
// %import("stl/z_focus_gear/Part 1_JHD.stl");

z_focus_gear_base();
