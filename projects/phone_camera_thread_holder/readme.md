the goal is to create  a openSCAD script that can generate a phone holder that has a internal camera thread so that it can be threaded onto a camera tripod or ballhead.

![preview](preview.png)

`phone_camera_thread_holder.scad` generates a screw clamp phone holder with a
printed 1/4"-20 UNC thread in the underside of its base, the standard thread of
camera tripods and ball heads.

there are the following parts:
- body: the fixed bottom jaw with the tripod thread, and a tube that rises
  behind the phone
- slider: the top jaw on a bar that slides in the tube
- lock screw: a knob in the back of the tube

## use

1. Push the slider's bar into the tube from above.
2. Stand the phone in landscape in the bottom jaw, with the back of the phone
   against the tube.
3. Push the slider down onto the phone and tighten the lock screw. It presses
   the bar against the front wall of the tube.
4. Screw the holder onto the tripod. For portrait, tilt the ball head 90 degrees.

The jaws are 30 mm wide. Centre the phone so they don't press its side buttons.

## printing

Set `part = "print_layout"` to get all three parts in their print orientation.
None of them needs support.
- body: standing on its base, so the tripod thread prints upright
- slider: on the top face of its jaw, bar upwards
- lock screw: on its knob

Use fine layers (0.12-0.16 mm) for the tripod thread.

## sizes

The defaults clamp phones from 60 to 90 mm wide and up to 12 mm thick, case
included (`grip_min`, `grip_max`, `phone_thickness`). A narrower range gives a
shorter body and more bar in the tube.

## thread fit

The tripod hole is 9 mm deep (`tripod_thread_depth`). That has to be more than
the length of the tripod screw, or the holder won't sit flat on the plate.

Print `part = "thread_test"` first. It is a small cylinder with the same
thread. If the tripod screw is tight, raise `tripod_thread_clearance`
(default 0.3 mm on the diameter). If it is loose, lower it.

The lock screw uses the 45 degree FDM thread of the softbox screws
(`cuboid_video_light_softbox`), with the same 0.15 mm radial clearance.
