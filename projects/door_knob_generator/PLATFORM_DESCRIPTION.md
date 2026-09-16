# Customizable door knob with FDM reinforcement slots

A rounded door knob with an adjustable body and a blind screw hole. The hole has
a rounded triangular profile formed from three circles joined by tangent lines.
Twelve narrow slots branch out from the hole to encourage the slicer to create
extra perimeter paths around the screw connection.

The default knob is approximately **33.5 mm wide and 32 mm high**, with a
**16 mm mounting neck** and a **25 mm deep screw hole**.

## Main OpenSCAD parameters

All dimensions are in millimetres unless stated otherwise. Body size and screw
hole size are adjusted independently.

| Parameter | Default | What it changes |
| --- | --- | --- |
| `head_diameter` | `33.495454169735` | Maximum width of the rounded head. Changes the head width while keeping the shaft diameter fixed. |
| `head_height` | `23` | Height of the head, including the curved shoulder above the straight shaft. Increase for a taller head or decrease for a flatter head. Does not stretch the shaft. |
| `shaft_height` | `9` | Length of the straight mounting shaft. Use a small value for a short shaft, or `0` for no straight shaft. Does not change the head shape. |
| `shaft_diameter` | `16` | Diameter of the straight shaft and mounting face. The shoulder blends into the head. Must be smaller than `head_diameter` and wide enough to contain the hole and slots. |
| `screw_diameter` | `2.8` | Base size used to construct the rounded triangular screw hole. Increase this for a larger screw connection; see the fit note below. |
| `diameter_allowance` | `0.2` | Added to `screw_diameter` to size the hole. Increasing it enlarges the hole; decreasing it makes the fit tighter. This is a diameter adjustment, not an allowance per side. |
| `hole_depth` | `25` | Depth of the screw hole and its slots, measured from the flat mounting face. Must be less than `shaft_height + head_height` so the hole stays closed at the top. The defaults leave 7 mm above the hole. |
| `slots_enabled` | `true` | Enables the twelve connected reinforcement slots. Set to `false` to generate the rounded triangular hole without slots. |
| `slot_width` | `0.1` | Width of each narrow slot. This affects whether the slicer preserves the gap and how it routes nearby walls. |
| `slot_length` | `1.5` | How far each branch extends outward from the hole boundary, before its rounded end. Larger values extend the perimeter pattern farther into the body. Keep the slots inside the neck with material around them. |

Overall height is `shaft_height + head_height`. For example, `shaft_height = 3`
and `head_height = 30` produce a 33 mm tall knob with a short 3 mm straight shaft.
The screw hole depth remains independently adjustable. If you shorten the total
height below the current hole depth, reduce `hole_depth` before rendering.

**Screw fit:** `screw_diameter + diameter_allowance` is the diameter of the circle
surrounding the rounded triangular hole. With the defaults, this is 3 mm. The
triangle is narrower across its flats, so this does **not** create a 3 mm round
clearance hole. Check the fit with your intended screw and printed material.
The model does not generate screw threads.

## Preview and surface quality

| Parameter | Default | What it changes |
| --- | --- | --- |
| `part` | `"knob"` | Selects the output. Use `"knob"` for printing, `"body"` for the solid outer shape, `"cutter"` for the material removed, `"section"` to inspect the inside, or `"hole_profile"` for the 2D hole and slot outline. |
| `radial_segments` | `144` | Number of segments around the body. Higher values give a smoother circumference and larger meshes; lower values render faster. Minimum: 24. |
| `profile_segments` | `48` | Number of segments along each curved arc of the body profile. Higher values smooth the silhouette and increase rendering time. Minimum: 8. |

## Customize and export

1. Open `door_knob.scad` in OpenSCAD and adjust the parameters in Customizer or at the top of the file.
2. Use `part = "section"` to inspect the hole depth and remaining material.
3. Set `part = "knob"`, press **F6** to render, and export as STL.
4. Inspect the sliced toolpaths around the screw hole before printing.

The reinforcement slots are designed to influence wall paths even with a low
wall count. Their effect depends on the slicer and settings: very narrow gaps
may be closed or ignored. Confirm that the extra paths appear in your preview;
the slots alone do not guarantee a particular printed strength.
