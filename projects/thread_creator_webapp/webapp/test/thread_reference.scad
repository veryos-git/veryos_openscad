// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The screw's rod and the inside of a hole, made of the modules of
// fdm_optimized_screws.scad: what thread.test.js holds the webapp's own thread against.
use <../../../01_published_or_archived/fdm_optimized_screws/fdm_optimized_screws.scad>

part = "rod"; // [rod, hole]
d = 8;
length = 20;
clearance = 0.25;
deep = 12;
// The radius of the flat at the hole's end.
flat_r = 2;
chamfer = 1;
$fn = 64;

if (part == "rod") intersection() {
    threaded_rod(d, length, 2);
    cylinder(h = length, r1 = d / 2 - chamfer, r2 = d / 2 - chamfer + length);
    cylinder(h = length, r1 = d / 2 - chamfer + length, r2 = d / 2 - chamfer);
}
else intersection() {
    thread_hole(d, clearance, deep + 5);
    cylinder(h = deep, r1 = flat_r + deep, r2 = flat_r);
}
