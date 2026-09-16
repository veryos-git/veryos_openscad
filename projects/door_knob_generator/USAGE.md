# Door knob generator

For a platform-ready project description and parameter table, see
[PLATFORM_DESCRIPTION.md](PLATFORM_DESCRIPTION.md).

For a programmable decorative head inspired by `complex.js`, open
`door_knob_decorative.scad` and see [DECORATIVE.md](DECORATIVE.md) for presets,
parameters, and editable mathematical surface functions.

Open `door_knob.scad` in OpenSCAD. Adjust the parameters at the top (or in
Customizer), press F6, then export as STL. The model uses millimetres and places
the flat mounting face at Z=0.

```sh
openscad -o door_knob.stl door_knob.scad
openscad -o cutter.stl -D 'part="cutter"' door_knob.scad
openscad -o larger_knob.stl -D 'head_diameter=40' door_knob.scad
```

`part` selects the finished `knob`, solid `body`, positive `cutter`, a longitudinal
`section`, or the 2D `hole_profile`. Only the `knob` mode exports the finished part.
The main modules are `knob_body()`, `screw_hole_remover()`, and `door_knob()`.

The default body follows the circular arcs in the supplied STEP: 32 mm high,
33.495 mm maximum diameter, 16 mm neck diameter, 9 mm straight neck, R20 head
arcs, and R3 rim rounding. `head_diameter` and `head_height` control the head;
`shaft_diameter` and `shaft_height` independently control the straight shaft.
The head includes the curved shoulder, which blends into the shaft. Total height
is `shaft_height + head_height`. The screw connection remains independently sized.

For a taller head with a short shaft, try `head_height=30` and `shaft_height=3`.
Set `shaft_height=0` to remove the straight portion entirely. When reducing total
height, also reduce `hole_depth` if necessary to keep the hole blind.

These controls replace the earlier `body_width_scale` and `body_height` inputs.
Update any saved presets or command-line overrides using those old names.

The blind hole is 25 mm deep. Its rounded triangular section is the convex hull
of three mutually tangent circles. `screw_diameter + diameter_allowance` specifies
the **circumscribed** diameter (default 3 mm), not a round clearance bore or the
diameter of each small circle. This reproduces the reference construction; screw
fit should be checked on a print with the intended screw.

Twelve narrow branches connect to the hole: three on each flat and one at each
corner. Defaults are 0.1 mm slot width and 1.5 mm branch length. The pattern is
regularized to exact threefold symmetry; the reference STEP has small branch
position/angle differences. It is therefore a reconstruction, not an exact copy
of every slot boundary. Set `slots_enabled=false` to compare with the plain hole.

The slots are intended to induce extra perimeter paths around the core, as shown
in your slicer screenshot. Inspect the sliced toolpaths: a slicer may close or
discard 0.1 mm gaps depending on its settings. Geometry validation alone does not
establish printed strength or guarantee a particular wall path.
