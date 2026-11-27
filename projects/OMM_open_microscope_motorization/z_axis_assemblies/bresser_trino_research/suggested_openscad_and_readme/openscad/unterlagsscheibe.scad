// unterlagsscheibe (washer): OD 7, ID 3.5, 1 mm thick
difference() {
    cylinder(d = 7, h = 1, $fn = 64);
    translate([0, 0, -1]) cylinder(d = 3.5, h = 3, $fn = 48);
}
