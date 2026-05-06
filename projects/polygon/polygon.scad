sides        = 3;
start_radius = 50;
min_radius   = 12;
margin       = 1.2;
line_width   = 1.5;
height       = 0.4;

hook_w       = 7;
hook_h       = 10;
hook_hole    = 3;

inner_hook_w    = 5;
inner_hook_h    = 7;
inner_hook_hole = 2;

eyelet_od = 4;
eyelet_id = 1.8;

// Rod
rod_width      = 1.5;
rod_length     = 55;
rod_tip_len    = 3;
rod_pin_w      = 2;
rod_pin_h      = 1.5;
rod_pin_offset = 3;
rod_height     = min(hook_hole, inner_hook_hole) - 0.4;

// Named colors (RGB, 0–1)
red     = [1.0, 0.0, 0.0];
green   = [0.0, 0.8, 0.0];
blue    = [0.0, 0.4, 1.0];
yellow  = [1.0, 0.9, 0.0];
orange  = [1.0, 0.5, 0.0];
purple  = [0.6, 0.2, 0.8];
cyan    = [0.0, 0.8, 0.8];
magenta = [1.0, 0.0, 0.7];
pink    = [1.0, 0.5, 0.7];

$fn = 128;

rot        = 90;
bot_factor = min([for (k = [0 : sides - 1]) sin(rot + k * 360 / sides)]);

top_y    = start_radius;
bot_y    = start_radius * bot_factor;
in_top_y = min_radius;
in_bot_y = min_radius * bot_factor;

// Place the inner hook hole so its top edge sits at the innermost polygon's
// inner boundary at the hole corners — only touches that one edge
inner_hook_hole_y = (in_top_y - line_width)
                  - (inner_hook_hole / 2) / tan((sides - 2) * 90 / sides)
                  - inner_hook_hole / 2;

module rings() {
    for (r = [start_radius : -(margin + line_width) : min_radius])
        rotate([0, 0, rot])
            difference() {
                circle(r = r, $fn = sides);
                circle(r = r - line_width, $fn = sides);
            }
}

module spines() {
    translate([-line_width/2, in_top_y-line_width])
        square([line_width, top_y - in_top_y+line_width]);
    translate([-line_width/2, bot_y-line_width])
        square([line_width, in_bot_y - bot_y+line_width*2]);
}

module outer_hook_body() {
    translate([-hook_w/2, top_y])
        square([hook_w, hook_h]);
}

module inner_hook_body() {
    translate([-inner_hook_w/2, in_top_y - inner_hook_h])
    translate([0,-inner_hook_h/2+line_width])
        square([inner_hook_w, inner_hook_h]);
}

module bottom_eyelet() {
    translate([0, bot_y - eyelet_od/2])
        circle(d = eyelet_od);
}

module spinner() {
    difference() {
        union() {
            color(blue)    linear_extrude(height) rings();
            color(red)     linear_extrude(height) spines();
            color(green)   linear_extrude(height) outer_hook_body();
            color(yellow)  linear_extrude(height) inner_hook_body();
            color(orange)  linear_extrude(height) bottom_eyelet();
        }
        translate([0, 0, -0.1])
        linear_extrude(height + 0.2) {
            translate([0, top_y + hook_h/2])
                square(hook_hole, center = true);
            translate([0, inner_hook_hole_y])
                translate([0,-inner_hook_h/2+line_width])
                square(inner_hook_hole, center = true);
            translate([0, bot_y - eyelet_od/2])
                circle(d = eyelet_id);
        }
    }
}

module rod() {
    difference() {
        union() {
            color(purple)
                linear_extrude(rod_height)
                    translate([-rod_width/2, 0])
                        square([rod_width, rod_length]);

            color(green)
                linear_extrude(rod_height)
                    translate([-rod_width/2 - rod_tip_len, 0])
                        square([rod_tip_len + rod_width, rod_width]);
            color(green)
                linear_extrude(rod_height)
                    translate([
                        -rod_width/2 - rod_tip_len, ---rod_width*2])
                        square([rod_width, rod_width*2]);

            color(magenta)
                linear_extrude(rod_height)
                    translate([rod_width/2+rod_pin_w*2-(rod_width/2), rod_length - rod_pin_offset - rod_pin_h])
                        square([rod_width, rod_pin_w*2]);
            color(magenta)
                linear_extrude(rod_height)
                    translate([rod_width/2, rod_length - rod_pin_offset - rod_pin_h])
                        square([rod_pin_w*2, rod_pin_h]);

            color(pink)
                linear_extrude(rod_height)
                    translate([0, rod_length + eyelet_od/2])
                        circle(d = eyelet_od);
        }
        translate([0, 0, -0.1])
        linear_extrude(rod_height + 0.2)
            translate([0, rod_length + eyelet_od/2])
                circle(d = eyelet_id);
    }
}

spinner();

translate([start_radius + 15, -rod_length / 2])
    rod();
