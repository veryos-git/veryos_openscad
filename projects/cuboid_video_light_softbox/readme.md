this project is a openSCAD script that can generate a frame and screw for a video light softbox frame with a cuboid shape.



there are the following parts: 
- frame top (top plate and light clamps, upper cover screw band)
- frame front (front rim, fabric lips, lower cover screw band)
- screw 
- wallcover big
- wallcover small

the flat cuboid video light should slide into the frame and can be locked with downwardspressure from one or two screws that are screwed into the frame 
reflective material such as aluminium foil can be glued onto the inside faces of the wallcovers then they can be glued onto the frame


the thread used for the screw is a custom 45 degrees angled thread (optimized for fdm manufacturing)


## V4

`cuboid_video_light_softboxV4.scad` is V3 with the screws set to the tested
values of `fdm_optimized_screws`:
- the 16 thumb screws for the wall covers are 5 mm with a 2 mm pitch and a
  10 mm head, instead of 6 mm with a 1.5 mm pitch and a 13 mm head. They print
  lying with 0.15 of their diameter cut off (`thumb_screw_cut`).
- all threads have 0.25 mm clearance instead of 0.15.
- the light clamp screws stay 12 mm, with the 0.1 cut that printed well
  (`screw_cut`); their wide tip spreads the pressure on the light.
- the VeryOS logo is engraved 1 mm deep in the outside of the two big wall
  covers (`logo_width`, `logo_depth`), in the middle of the window, where the
  lip makes the cover 4 mm thick. It is cut into the side that prints on the
  bed, mirrored, so it reads correctly from outside.
- a small logo, 12 mm wide (`frame_logo_width`), is engraved in the top of the
  +x light clamp, on the back of the frame, beside the screw. It is upright
  when the light hangs from its 1/4" thread and prints on a top surface.

## V5

`cuboid_video_light_softboxV5.scad` adds an open cutout to one long wall
cover so the tripod ballhead can be screwed onto the video light without
cutting the printed panel. Install `wallcover_tripod` on the **-y long side**,
with the cutout at the light-side edge, aligned with the existing frame notch.

The cutout defaults to **48.7 mm wide, 12 mm deep along the panel**, with
3 mm inside corner radii. Its width follows `side_notch_width`; adjust
`tripod_cutout_width`, `tripod_cutout_depth`, and `tripod_cutout_radius` for
your ballhead. The depth is estimated from `problem2/image.png`, not measured
from the hardware.

The print layout includes one `wallcover_tripod`, one plain `wallcover_big`,
and two `wallcover_small`. The assembly preview shows the cutout on the
correct side. The frame, screws, and other covers retain their V4 geometry;
an existing V4 build only needs the replacement `wallcover_tripod` printed
flat with its lip facing up.

## V6

`cuboid_video_light_softboxV6.scad` prints the frame as two parts and drops
the four corner pillars:

- `frame_top` has the top plate, both light clamp towers and the upper band
  with the top row of cover screws.
- `frame_front` has the front rim, the eight clothespin lips and the lower
  band with the bottom row of cover screws.

The side wall and the corner pillars between the two bands are gone. The four
wall covers already screw onto those bands, so they now bridge the two frame
parts and take over the pillars' job. Assemble the covers loosely first, slide
the light in, then tighten the thumb screws.

The print layout fits the front frame on its front face, the top frame on its
split face beside it (turned 90 degrees), all four covers, 16 thumb screws and
the two light clamp screws into about 298 x 288 mm. The covers and screws are
unchanged from V5; a V5 build only needs the two new frame parts printed.

The tripod cutout on the `-y` long cover is now as wide as the cover allows.
With the default sizes it grows from V5's 48.7 mm to 94.8 mm. The width is
computed from the top-row cover screw positions and stops `hole_margin`
(0.8 mm) short of the screw heads, so the heads stay fully supported.
`tripod_cutout_width = 0` selects this automatic maximum; set a smaller
positive value to narrow the cutout.

The top frame prints standing on its split face: the band is on the bed, the
top plate above it and the clamp towers on top. The front frame prints on its
front face, as the one-piece V5 frame did.
