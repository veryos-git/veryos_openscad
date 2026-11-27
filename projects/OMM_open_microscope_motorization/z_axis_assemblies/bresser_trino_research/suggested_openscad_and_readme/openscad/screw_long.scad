// screw_long : hex-head screw (approximation, threads NOT modelled)
// Onshape: hex head 6 mm high (z = -6 .. 0), ~10.2 mm across flats (circumradius 5.89),
// shank D6 extruded 50 mm, overall part studio height z = -6 .. 66.
// Threads were made with the "Thread Creator" FS (pitch parameter 2 mm). For real threads use
// e.g. BOSL2:  include <BOSL2/std.scad> include <BOSL2/threading.scad>
//              threaded_rod(d=6, l=50, pitch=2, anchor=BOTTOM);
// NOTE: the part studio also contains helper bodies "subtractr", "Part 3" and "holesubtractor"
// that are used as boolean cutting tools for the bracket (see README). They are in the STEP/STL.
af = 10.2; head_h = 6; d = 6; len = 50;
translate([0, 0, -head_h]) cylinder(d = af / cos(30), h = head_h, $fn = 6);
cylinder(d = d, h = len, $fn = 48);
