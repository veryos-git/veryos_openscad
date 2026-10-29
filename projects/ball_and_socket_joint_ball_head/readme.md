# ball and socket joint / ball head

An OpenSCAD generator for a lockable ball head, after
`inspiration/image.png`. A ball sits in a threaded cup and a knurled ring
screws over it; turning the ring down presses its lip onto the ball and
locks the joint.

![preview](preview.png)

## parts

- `ball`: a 30 mm ball (`ball_d`) on a 12 mm neck (`neck_d`) on a round
  plate with 3 countersunk M4 holes.
- `socket`: a round plate with 3 countersunk M4 holes and a cup that holds
  the ball's lower half. The cup has the external thread.
- `screw`: the knurled ring. The female thread is below. Above it a lip
  covers the ball from its equator up to 30 degrees (`lip_angle`). A slot in
  the lip (`tilt_slot`) lets the neck tilt to 90 degrees in one direction.
  Elsewhere it tilts about 36 degrees.

`part` shows the assembly, the assembly cut in half, all parts, or one part.

![section](section.png)

## thread

Single-start, right-hand, with 45 degree flanks and a 2 mm pitch
(`thread_pitch`), as in `../fdm_optimized_screws`, so it prints without
support. `thread_clearance` (0.3 mm) is the radial gap. The cup's thread
diameter follows from the ball, `ball_clearance` and `cup_wall`. When the
ring touches the ball it still has `screw_travel` (2 mm) of room above the
plate to turn down and lock.

## printing

Print every part standing, plate or ring bottom on the bed, without support.
The lip's inside is no flatter than 45 degrees while `lip_angle` is at most
45. The ball's underside overhangs a little where it meets the neck. Set
`ball_cone` to fill it with a 45 degree cone; this lowers the tilt to about
15 degrees outside the slot.

The VeryOS logo is engraved in the top of both plates, between the holes,
and in the top of the ring, opposite the slot.

The generator needs no other file and also runs in a browser OpenSCAD
playground.
