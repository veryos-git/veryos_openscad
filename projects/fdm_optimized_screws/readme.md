the goal is to create a usable fdm printable screw with no supports. 

so far i found out: 
    - a 45 degrees angled thread works best for fmd printing
    - a pitch of 2mm is best
    - when the screw diameter gets smaller, some parameters may need to change.
    - the smallest screw i could make is 5mm diameter
    - if the screw cylinder is printed upwards, the screw easily breaks when screwed in , because the extruded plastic lines are short and extrusion sausages between layers have not much contact and no strong bonds
    - it would be better to print the screws with the screw cylinder horizontally layed on the printbed 
        - to prevent support, it is required to cut off a part of the screw

    ![preview](preview.png)

`fdm_optimized_screws.scad` generates a hex head screw and a matching nut that
print without support. The thread is the 45 degree thread of the softbox screws
(`cuboid_video_light_softbox`).

## printing

Set `part = "print_layout"` to get the screw and the nut in their print
orientation.
- screw: lying on a flat of its head. `screw_cut` (default 0.1) is the share of
  the thread diameter cut off its underside, through the shank and the head, so
  both stand on the bed.
- nut: flat on the bed. Both ends of the hole have a 45 degree lead-in.

## sizes

The defaults are an 8 mm thread with a 2 mm pitch, a 20 mm shank and a 13 mm
head and nut (across flats). Change `thread_diameter`, `thread_pitch`,
`screw_length`, `screw_head_width`, `screw_head_height`, `nut_width` and
`nut_height` for other sizes.

## thread fit

`thread_clearance` (default 0.15 mm) is the radial gap between the screw and
the nut. Raise it if the nut is tight, lower it if it is loose.
`part = "assembly"` shows the nut on the screw.
