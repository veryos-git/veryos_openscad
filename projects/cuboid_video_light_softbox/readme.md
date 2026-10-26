this project is a openSCAD script that can generate a frame and screw for a video light softbox frame with a cuboid shape.



there are the following parts: 
- frame
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
