# C-mount thread test

The camera is assumed to have a C/CS-mount female thread: 1 inch–32 TPI
(25.4 mm nominal diameter, 0.79375 mm pitch). This is a candidate to verify,
not a confirmed identification. The model is a hollow test fitting, not the
finished microscope adapter.

Print `c_mount_test_clearance_020.stl` first. Its male thread is reduced by
0.20 mm on diameter for printing clearance. The fitting has a 32 mm grip,
a 19 mm through-hole, and a short 3.2 mm threaded section with a tapered start.

- Put the flat grip on the bed, thread pointing upward; no supports.
- Use 0.08–0.12 mm layers and fine outer walls for the small thread.
- Clean away strings and any rough starting edge before testing.
- Start square to the camera and screw clockwise by hand. Do not force it.
  A correct fit should turn smoothly through several turns toward the grip.
  Stop when it seats or meets resistance; do not tighten against the camera.
- If it is too tight, try `c_mount_test_clearance_035.stl` (0.35 mm diameter
  reduction). If the first fitting is too loose, try
  `c_mount_test_clearance_005.stl` (0.05 mm reduction).

The short nose limits insertion, but check that the camera has at least
3.2 mm of unobstructed depth before inserting. Avoid touching the sensor.
A failed fit can mean printing error or a different thread; it does not
by itself identify the camera mount.

Parameters are editable in `c_mount_test.scad`. For example:

```sh
openscad -o c_mount_test_clearance_020.stl -D 'diameter_clearance=0.20' c_mount_test.scad
```

Once a fitting works, use that clearance for the full adapter. The microscope
tube inside diameter and required insertion length still need to be confirmed.
Camera spacing/focus also needs a physical trial.
