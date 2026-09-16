# Programmable decorative knob

Open `door_knob_decorative.scad`. This standalone variant preserves the independent
head and shaft dimensions, triangular blind screw hole, and branching slots.
Its default head has twelve twisting flutes. Render with F6 and export `part="knob"`.

## Customize without coding

Open OpenSCAD's **Customizer** panel and expand **1 - Start here - pattern and twist**. Choose
**Spiral grooves**, **Wavy grooves**, **Organic bumps**, or **Smooth** from the
Decoration menu. You do not need to edit any formulas.

- **Decoration depth:** move toward 0 for subtle detail or toward 3 for bold grooves.
- **Wave count:** choose fewer wide grooves or more narrow grooves (3–24).
- **Twist turns:** 0 makes straight grooves, 0.25 gives a quarter turn, and 1 gives a full turn.
- **Reverse twist:** check this to spiral the other way.
- **Vertical waves:** adds ripples up the head in Wavy grooves mode (1–8).
- **Noise seed:** changes the pattern in Organic bumps mode; try any number from 1 to 100.

Start with Spiral grooves, depth **1.5**, wave count **8**, and twist turns **0.25**.
For a flower-like shape, try wave count **6** and twist turns **0**. For ripples,
choose Wavy grooves and set vertical waves to **4**. Press F5 to preview changes;
use F6 before exporting. Head and shaft sizes come next, followed by pattern variations and screw fit.
Advanced settings and inspection views are grouped at the bottom.

Mesh resolution automatically increases for more grooves, twists, and ripples.
Detailed patterns can take longer to render. Organic bumps uses its own fixed
frequencies, so Wave count and Vertical waves do not affect that style.

Like `complex.js`, the script evaluates a function around a series of horizontal
rings and joins neighbouring samples into a surface. OpenSCAD functions and list
comprehensions replace the JavaScript callback and mutable arrays. A triangulated
polyhedron closes the bottom, sides, and crown before subtracting the screw cutter.

| Parameter | Default | Effect |
| --- | --- | --- |
| `decoration` | `"twisted_flutes"` | Choose `twisted_flutes`, `waves`, `organic`, `plain`, or your `custom` function. |
| `decoration_depth` | `1.5` mm | Radial displacement amplitude, faded near the shaft and crown. Larger values produce deeper relief. |
| `wave_count` | `12` | Integer number of flutes around the head for the fluted and wave presets. |
| `twist_turns` | `0.208333333333` | Pattern turns across the head height (the default preserves the original 75-degree twist). Zero gives straight grooves. |
| `reverse_twist` | `false` | Reverses the spiral direction. |
| `vertical_waves` | `3` | Number of vertical amplitude cycles for the `waves` preset. |
| `noise_seed` | `7` | Changes the repeatable organic texture. The same value generates the same shape. |
| `shoulder_fade` | `0.25` | Fraction of head height used to introduce the decoration smoothly above the shaft. Must be greater than 0 and at most 1. |
| `radial_segments` | `144` | Samples around each ring. Automatically increased to at least eight samples per wave for flutes and waves. |
| `profile_segments` | `64` | Number of rings along the head. Automatically increased for stronger twists and more ripples; raise this minimum for finer detail. |

`head_diameter` is the **undecorated** head diameter. Texture may add up to twice
`decoration_depth` to its width for the built-in presets. `head_height` includes
the curved shoulder. `shaft_height` and `shaft_diameter` remain independently
adjustable. Total height remains `shaft_height + head_height`; adjust `hole_depth`
when shortening it. See `PLATFORM_DESCRIPTION.md` for the shared fit and slot controls.

## Write your own surface function

Select `decoration="custom"` and edit this function in the file:

```scad
function custom_displacement(angle,t) =
    decoration_depth * sin(5*angle + 360*t) * cos(720*t);
```

- `angle` runs around the head from 0 to 360 **degrees**. OpenSCAD trigonometry uses degrees, unlike JavaScript's radians.
- `t` is normalized head height: 0 at the shaft joint and 1 at the crown.
- Return a radial displacement in millimetres. Positive values push outward; negative values carve inward.

The enclosing `decorative_radius(angle,t,base_radius)` function applies a smooth
fade at the joint and crown. For deeper customization, edit that function directly;
it must return a positive radius. Preserve the end fades to keep the joint smooth
and the crown closed neatly. Angular expressions should repeat at 360 degrees;
integer angular frequencies avoid a visible seam.

The surface has one radius per angle and height. It supports lobes, ribs, twists,
and organic relief, but cannot describe arbitrary overhangs that fold back through
the same ring, handles, or surfaces with holes. Custom functions are source edits,
not JavaScript callbacks pasted into Customizer. The organic preset uses a sum of
periodic trigonometric functions, not the example's simplex-noise implementation.
The example's varying top-edge height is replaced by a closed rounded crown.

Large inward displacements may expose the screw cavity. Inspect `part="section"`
and your sliced model after changing formulas. Mesh validity does not guarantee
wall thickness, printability, or strength. Higher angular and vertical frequencies
need more samples; increase both resolution parameters until details are resolved.

```sh
openscad -o decorative.stl door_knob_decorative.scad
openscad -o organic.stl -D 'decoration="organic"' door_knob_decorative.scad
openscad -o custom.stl -D 'decoration="custom"' door_knob_decorative.scad
```

The visible `twist_turns` and `reverse_twist` controls replace the previous
`twist_degrees` input. `twist_degrees` is now calculated internally.
