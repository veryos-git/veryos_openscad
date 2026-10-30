# RGBW puck light lantern 3

An OpenSCAD generator for a lantern around a 62 mm RGBW puck light, after
the Onshape model in `inspiration/lantern_onshape_export` and the pictures
in `inspiration`. The puck lies in the bottom of the frame, the roof screws
onto the frame's top, and the windows slide into slits in the frame's
pillars.

![preview](preview.png)

## V2: decorative windows

`RGBW_pucklight_lantern3V2_decorative_window.scad`. The lantern of V1 with
the windows decorated as in `../published_christmas_star`: random lines
across the window, mirrored about its middle, each cut from the outside
down to a different number of layers. Printed in a translucent filament, the
light shines through each line in a different shade. Everything else is as
below.

![preview V2](preview_v2.png)

![decorative window](window_v2.png)

- the window is still `window_thickness` (3 mm) thick in its 3.6 mm slits,
  `slot_clearance` (0.3 mm) thinner on each side, so it slides in. The lines
  only take material away, so they do not change that.
- `lines_per_half` (12) lines go through random points of the window's
  right half, at random angles and widths between `line_width_min` (0.42
  mm) and `line_width_max` (3 mm), and are mirrored onto the left half.
- line i is cut down to i + 1 layers of `layer_step` (0.2 mm): from 0.2 mm
  to 2.4 mm. Where lines cross, the deeper one wins. Set `layer_step` to
  the layer height you print with.
- the lines stay `decoration_border` (2 mm) inside the part of the window
  you see between the pillars and above the rail, so the edges in the slits
  keep their full thickness, and 2 mm away from the logo.
- `decoration_seed` picks the pattern. `part = "window"` makes one window
  with it; change the seed between exports for four different windows. The
  assembly and the print layout show four windows with the same pattern.
- `part = "random_windows"` makes 25 windows, lying flat in a 5 x 5 grid,
  each with its own pattern: the bottom left one with `decoration_seed`,
  the others with seeds 1000 apart. Export them as one file and split it
  into objects in the slicer to pick the ones you print. The grid is 467 x
  488 mm.

![random window patterns](random_windows.png)

Print the window flat, its outside (the lines and the logo) up. Each line's
floor is flat, so it needs no support. Not printed yet: the thinnest line
is one layer (0.2 mm) thick, which may be weak if it is wide.

## parts

- `frame`: the holder's top part at the bottom, then four corner pillars
  that lean out from 76 mm to 100 mm (`top_width`) over 90 mm
  (`frame_height`), with a rail between them on the holder. At the top, a
  band carries the neck the roof screws onto. Each pillar has a slit on
  both sides for the windows.
- `roof`: a 12 mm band that continues the frame's sides, then curved sides
  up to a ball, as a 2 mm shell. It has the female thread inside the band.
- `screwin`: the holder's bottom screw. It holds the puck in the frame.
- `clickbase`: the holder's click base.
- `window` (4x): a flat 3 mm plate, 61.7 mm wide at the bottom, 85.3 mm at
  the top and 89.5 mm long. Print it in a translucent filament, or cut it
  from 3 mm acrylic.

`part` shows the assembly on the click base, the assembly cut in half, all
parts, or one part. The lantern is 200 mm high on the click base.

![section](section.png)

## the holder

The puck's mount is the holder project's. Its parameters, `toppart()`,
`bottom_screw()`, `clickbase()`, `puck()`, `threaded_rod()` and the logo
are copied unchanged from
`../RGBW_pucklight_holder/RGBW_pucklight_holderV3.scad`, so the generator
needs no other file and runs in a browser OpenSCAD playground too. The
holder's parameters are in the Customizer under Puck light, Holder top
part, Screwin and Click base, and the frame follows the top part's size.
If the holder project changes, copy the change over by hand.

In V3 the cavity's 45 degree shoulder runs up to the window's edge, instead
of ending on a flat ceiling that overhung 2.1 mm over the puck. So the top
part, where the frame starts, is 30.2 mm high instead of 29.1, and the
lantern is 1.1 mm higher.

It clicks as in the holder (see its readme): the lantern stands on the
click base and floats on the puck's dome; pressing the lantern down clicks
the light.

## windows and slits

The slits are 3.6 mm wide (`window_thickness` plus 0.3 mm `slot_clearance`
on each side), behind a 1.2 mm lip (`slot_lip`), and reach 3 mm
(`window_overlap`) into each pillar. The pillars are 10 mm wide
(`pillar_width`) to hold two slits. They run from 1 mm above the holder up
through the frame's top. A window slides in from above and stands on the
slits' floor in the rail; its top ends 0.3 mm under the frame's top, and
the roof covers the slits.

Between the pillars, at the top, there is no lip: the window lies in front
of the band. For thinner windows, such as film or paper, set
`window_thickness` to their thickness and the slits follow.

## the frame's top

The band is the frame's top behind the slits. Its underside is a 45
degree funnel that narrows to the neck's 82.4 mm bore, so it prints
without support. Behind each window the funnel shows as an arch, 4 mm deep
in the middle and about 19 mm at the pillars. In the corners it becomes 45
degree gussets.

The neck has the roof's thread outside: 88 mm (`neck_d`), 6 mm high, 2 mm
pitch and 45 degree flanks (the holder's `threaded_rod()`), with a
chamfered top. Its bore lets the light into the roof.

## the roof

- band: 12 mm (`roof_band_height`), leaning like the frame's sides; the
  eaves are 103.2 mm wide.
- curved sides: an arc of radius 100 mm (`roof_curve_r`) from the eave to
  the axis 60 mm (`roof_rise`) higher, 26 degrees steep at the eaves and
  steeper towards the top. It ends 5 mm wide under a 12 mm ball, which
  stands on a 45 degree cone.
- thread: female, with 0.3 mm radial clearance (`roof_thread_clearance`)
  and a 45 degree lead-in, up to 7 mm, in a ring that meets the band's
  walls in the middle of each face.
- shell: around it the roof is a shell, 2 mm (`roof_wall`) thick square to
  its surface, on a 2 mm floor; in the band's corners it is hollow down to
  the floor. The lower 18 mm of the curve, above the eaves, is flatter than
  45 degrees. There the inside stays a 45 degree plane, so it prints
  without support, and the shell gets thicker towards the eaves: 4.6 mm at
  the eaves in the middle of a face, more along the hips. The hollow ends
  in a 2.7 mm wide flat ceiling under the tip of the ball's cone.
- slits: vertical, 2 mm wide (`slit_width`) and 1.6 mm apart
  (`slit_spacing`), along each face, kept 2.5 mm (`slit_margin`) from the
  hips, the eaves, the middle of the face and the ball, with a row of 2 mm
  squares along the eaves. They are cut from the thread's top up and go
  through the shell, except the squares at the eaves, which end blind in
  the band.

The roof is 76.9 mm high and takes 53 cm³ of material (88 cm³ when it was
hollow only in a 45 degree cone above the thread). A 2 mm shell all the way
to the eaves would be 40 cm³, but it would need support under the eaves.

### lining the roof up

Both threads are in phase: the roof is square to the frame when it is 0.4
mm (`roof_seat_gap`) above the frame's top. From there it can turn 72 degrees
further before it stops on the frame. So screw it on until it stops, then
turn it back until its sides line up with the frame's. The thread is fine
enough that it stays there. Without the gap, 0.1 mm of print tolerance
would turn the stop 18 degrees.

## logo

The VeryOS logo is engraved in every part:
- frame: the holder's, 20 mm wide, in the front of the holder part.
- screwin and clickbase: the holder's.
- roof: 12 mm wide (`roof_logo_width`), 1 mm deep, in the front of the
  band, following its lean.
- window: 20 mm wide (`window_logo_width`), half through the window (1.5
  mm), on its outside, 3 mm above the rail. It shows brighter when the light is on.

## printing

Print the frame standing (126 mm high with the neck), the roof standing on
its band, the screwin and the click base as in the holder, and the windows
flat with the logo up. Nothing needs support: the frame's funnel and the
ball's cone are 45 degrees, the roof's inside is no flatter than 45
degrees, its ceiling under the ball bridges 2.7 mm, the threads have 45
degree flanks, the pillars lean out 7.6 degrees, and the holder's ribs
bridge its window as in the holder. For the windows, a translucent or white filament
diffuses the light; at 3 mm it lets less light through than a thinner
window.

## assembly

1. Put the puck into the frame from below, dome first, and screw in the
   screwin until it is flush and its bar is parallel to two sides.
2. Slide the windows into the slits from above, logo outside, until they
   stand on the rail.
3. Screw the roof on until it stops, then turn it back until it lines up.
4. Stand the lantern on the click base, the bar in its slot. Press the
   lantern down to click the light.

## differences from the Onshape model

- in Onshape the frame's top has the female thread and the roof a male
  ring. Here it is the other way round, so the roof prints standing on its
  band without support.
- the frame's top band sits behind the windows, with a 45 degree funnel
  under it, instead of a plate with a lip in front of the windows all
  around.
- the roof is a 2 mm shell instead of 1.8 mm, and thicker near the eaves:
  a shell of constant thickness would overhang more than 60 degrees there.
- the slits are 3.6 mm wide instead of 3 mm: a 3 mm window and 0.3 mm
  clearance on each side. They follow `window_thickness`.
- the pillars are 10 mm wide, to hold two such slits.
- the roof lines up through `roof_seat_gap` instead of the fine-tuning ring.
- the ball stands on a 45 degree cone instead of a rounded neck.
- the holder (top part, screw and click base) is the V3 holder project's,
  with its pins and slot, instead of the plain click base.
- the star cutouts in the roof (`cutout_star`) are not included.

## untested

Nothing here has been printed yet. The lantern's weight rests on the
puck's dome while it stands on the click base; if that is enough to click
the light, stand it on something else. In the roof's upper part the bars
between the slits are 1.6 mm wide and only as deep as the 2 mm shell; if
they are too weak, raise `roof_wall`.

## files

- `RGBW_pucklight_lantern3.scad`: the generator.
- `RGBW_pucklight_lantern3V2_decorative_window.scad`: the generator with
  decorative windows.
- `preview.png`: the assembly. `section.png`: the assembly cut in half.
- `preview_v2.png`: the V2 assembly. `window_v2.png`: a V2 window.
- `random_windows.png`: the 25 random window patterns.
- `readme_hgc.md`: the original description.
- `inspiration/`: pictures and the Onshape export.

Licensed under GPL.
