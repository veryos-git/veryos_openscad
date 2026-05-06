width  = 40;
depth  = 100;
height = 30;
wall   = 2;

clearance          = 0.2;
ridge_interference = 0.1;
groove_clearance   = 0.05;

ridge_protrusion  = clearance + ridge_interference;
groove_protrusion = ridge_interference + groove_clearance;

module ridge(p) {
    rotate([-90, 0, 0])
        linear_extrude(depth)
            polygon([
                [0, -p],
                [0,  p],
                [p, 0]
            ]);
}

module inner_box() {
    difference() {
        cube([width, depth, height]);
        translate([wall, wall, wall])
            cube([width - 2 * wall, depth - 2 * wall, height]);
    }
    for (z = [height / 4, 3 * height / 4]) {
        translate([width, 0, z]) ridge(ridge_protrusion);
        translate([0, 0, z]) mirror([1, 0, 0]) ridge(ridge_protrusion);
    }
}

module sleeve() {
    sw = width  + 2 * (clearance + wall);
    sh = height + 2 * (clearance + wall);
    difference() {
        cube([sw, depth, sh]);
        translate([wall, 0, wall])
            cube([width + 2 * clearance, depth, height + 2 * clearance]);
        for (z = [wall + clearance + height / 4, wall + clearance + 3 * height / 4]) {
            translate([wall + width + 2 * clearance, 0, z])
                ridge(groove_protrusion);
            translate([wall, 0, z])
                mirror([1, 0, 0]) ridge(groove_protrusion);
        }
    }
}

inner_box();
translate([width + 10, 0, 0]) sleeve();
