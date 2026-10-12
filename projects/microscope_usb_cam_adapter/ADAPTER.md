# Full microscope USB camera adapter

The camera thread uses the tested middle fitting: C-mount 1 inch–32 TPI,
with 0.20 mm diameter reduction. The thread profile, tapered start, and
3.2 mm engagement length match that fitting.

Print `microscope_usb_cam_adapter.stl`. Edit dimensions in
`microscope_usb_cam_adapter.scad` if needed.

| Feature | Dimension |
| --- | --- |
| Microscope stem outside diameter | 23.20 mm |
| Stem insertion length | 20 mm |
| Through-hole | 19 mm |
| Stop collar diameter / height | 28 mm / 4 mm |
| Camera thread nominal diameter / pitch | 25.4 mm / 0.79375 mm |
| Camera thread diameter reduction | 0.20 mm |
| Camera thread length | 3.2 mm |
| Overall height | 27.18 mm |

The stem assumes the reported 23.5 mm is the microscope tube **inside**
diameter. Its 0.30 mm diameter clearance and 20 mm insertion length are
starting dimensions; these have not been physically tested. The stem tip
is chamfered, and the collar prevents it dropping into the tube. The collar
underside has a 45-degree slope for printing without supports.

Print upright with the microscope stem on the bed and camera thread on top.
Use the same material and thread settings as the successful fitting;
0.08–0.12 mm layers are suitable starting settings. Use at least four walls.
Keep any brim outside the stem, and remove it completely before insertion.
Black filament is preferable to reduce stray light.

Check the tube has 20 mm of clear depth, then test the stem fit before
attaching the camera. It should slide in gently. If tight, adjust
`stem_diameter_clearance`; if loose, reduce it. Attach the camera by hand
without forcing the thread. The adapter is a slip fit; support the camera
and use the microscope's retaining screw if one is available.

This is a hollow mechanical adapter with no relay lens. Check camera focus
with the microscope focus control and available tube adjustment. Thread fit
does not establish the required optical spacing; if focus is unreachable,
the spacing or optical arrangement will need adjustment.

Regenerate after changes:

```sh
openscad --hardwarnings --export-format binstl -o microscope_usb_cam_adapter.stl microscope_usb_cam_adapter.scad
```
