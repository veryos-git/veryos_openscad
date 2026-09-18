# Parametric cream container and lid

Open `cream_container.scad` in OpenSCAD. The default grid generates
**5, 10, 15, 20, 25, 50, and 100 ml**, with a matching lid beside each container.
Press F6 to render, then export STL.

- `view="grid"`: all seven sizes, increasing across columns then along +Y.
  Set `grid_columns` (default 2), `grid_gap`, and `grid_include_lids`
  (turn off for containers only). Spacing accommodates the largest size.
  All pieces sit on z=0; lids face open-side up.
- For a single size, choose another view and set `volume_ml` in the Customizer.

- `view="print"`: one container and lid on the bed, lid open-side up.
- `view="container"` or `view="lid"`: export one piece.
- `view="lid_section"`: cutaway of the lid, open-side down as in `lid.png`,
  exposing the internal 45° flank thread.
- `view="assembled"`, `"exploded"`, or `"section"`: inspect the fit/interior.
- `quality`: circumferential resolution; 128 default, 64 for faster checks.

Example:

```sh
openscad -o container_50ml.stl -D 'volume_ml=50' -D 'view="container"' cream_container.scad
openscad -o lid_50ml.stl -D 'volume_ml=50' -D 'view="lid"' cream_container.scad
```

## Version 2

Open `cream_container_v2.scad` for the taller lid. The original script is preserved.
The lid is **10 mm tall in total**, with an internal thread only
**3 mm high**, measured from the opening. Above the thread is a smooth cavity;
the roof remains 1.6 mm thick. `lid_height` and `lid_thread_height` control
these dimensions. All existing capacity and display options remain available.
The container geometry is unchanged. The taller lid provides 5.4 mm of headspace
above the container rim, so its roof no longer contacts the rim when seated.

## Version 3

Open `cream_container_v3.scad` for the ribbed lid shown in `ribbed.png` and
`ribb_cutoff.png`. It retains version 2's **10 mm total lid height** and
**3 mm internal thread**. The exterior has **36 evenly spaced cylindrical
cuts** (10 degrees apart), each made with a **10 mm diameter** cutter that
penetrates the lid's outer radius by **0.4 mm**. The cutters run through the
lid height and meet the existing top chamfer.

Adjust `rib_count`, `rib_cutoff_diameter`, and `rib_cutoff_overlap` in the
Customizer. Cutter centers are placed at
`outer_r + rib_cutoff_diameter/2 - rib_cutoff_overlap` for each capacity.
The nominal lid wall remaining at the deepest cut is 2.6 mm.
Set `container_ribs=true` to apply the same cuts to the container exterior,
from the base to the shoulder. It defaults to `false` (off); the container
neck thread is unaffected. Previous versions are unchanged; all capacity
and display options are available.

## Version 4

Open `cream_container_v4.scad` for v3's ribbed lid plus an optional engraved
capacity label. Two independent switches place the label on the container base
and/or on the top of the lid:

- `bottom_text_enabled` (default `true`): engraves the base of the bowl.
- `top_text_enabled` (default `true`): engraves the lid roof, readable from
  above with the lid fitted.
- `bottom_text` / `top_text`: custom label. Leave a field empty and that part
  uses the automatic `"<volume_ml>ml"` label instead, so every grid cell is
  marked with its own capacity (5ml, 10ml, ... 100ml).
- `text_depth` (default `0.2`): engraving depth in mm, cut into the 1.6 mm base
  and lid roof. An assert rejects a depth that would break through.
- `text_font` (default `Liberation Sans:style=Bold`).

The label is sized per part so that it fills the free round face: width, height
and the bounding-box corner radius are each capped at a fraction of the free
diameter (`outer_r - text_margin`). It therefore grows with the container and
shrinks for longer custom text. The fractions are hidden defaults
(`text_width_fill = 0.80`, `text_height_fill = 0.38`, `text_fit_fill = 0.90`).

`textmetrics()` is still an experimental function, enabled only in OpenSCAD
development snapshots with `--enable=textmetrics`, and absent from release
builds (2021.01 and older). Version 4 therefore measures the string against a
table of advance widths baked in for the default bold font, so no special build
or feature flag is needed. The fit is calibrated to that font; other fonts still
fit approximately.

The base label is mirrored across Y so that it reads correctly once the
container is tipped towards the viewer to expose its base. The lid label needs
no mirroring and reads correctly from above.

## Version 5

Open `cream_container_v5.scad` for v4's ribbed lid and engraved labels plus a
thread that fades in and out instead of starting at full depth.
`thread_v5_section.png` compares the v3 and v5 interfaces at the same scale.

Version 3's helix was cut off at full depth at both ends. On the lid, which
prints open-side up, the first groove roof was therefore a flat horizontal
face: a hard 90° overhang at the start of the thread. The container had the
same face left behind as a coincident-face artifact where the thread solid met
the shoulder. A depth fade removes both.

- The thread region is lengthened from **3 mm to 5 mm**. `neck_height` and
  `lid_thread_height` must now be equal so the two tapers line up; an assert
  enforces it.
- `thread_lead_in` / `thread_lead_out` (default `1.0` mm) are the decay
  constants of the depth fade at the opening and at the inner end. Keep both
  `>= thread_depth` (0.9 mm).
- The fade is exponential rather than a straight chamfer, because a straight
  ramp adds its slope to the 45° flank and becomes a *steeper* overhang (a
  1.5 mm linear ramp measured 57°). The exponential's slope never exceeds
  `(1-s)/thread_depth`, so no surface exceeds the flank's own 45°.
- The male (neck) and female (lid bore) profiles use the same fade and stay
  matched: the neck ridge fades out to the `root_r` cylinder while the lid
  groove fades back to the nominal bore `crest_r + thread_tolerance/2`. That
  is exactly the cavity radius, so the bore stays flush and the old flat step
  is gone.
- The container's thread now starts `thread_root_embed` (0.5 mm) below the
  shoulder, inside the body, so the union overlaps instead of leaving the
  coincident faces that produced the shoulder overhang.

The thread still engages over the middle of the 5 mm region: about 0.58 mm
radial engagement on a 20 ml part, against 0.65 mm at full depth.
`thread_lead_in` / `thread_lead_out` trade engagement against how gentle the
fade is.

Because the capacity formula includes `neck_height`, the taller neck makes the
bowl slightly smaller for the same brimful capacity: the 20 ml bowl radius is
**18.99 mm** instead of 19.82 mm, and the outside diameter shrinks by about
1.66 mm. The 20 ml part still holds 20 ml.

Measured on the print-oriented STLs (OpenSCAD 2021.01, quality 64). The 45°
flanks themselves tessellate to about 45°, so the 50° column is the meaningful
one:

| part | v3 area > 50° | v3 max | v5 area > 50° | v5 max |
| --- | --- | --- | --- | --- |
| lid | 57.9 mm² | 90.0° | 0 mm² | 44.7° |
| container | 62.8 mm² | 90.0° | 0 mm² | 44.7° |

Both parts are watertight single shells, the seated 20 ml lid/container
intersection is empty, and the default `grid` renders all 14 bodies as
watertight single parts. Previous versions are unchanged.

## Geometry and capacity

Reconstructed from the supplied STEP and screenshots: cylindrical exterior,
hemispherical bowl, 3 mm threaded neck, 3 mm nominal neck and lid walls,
1.6 mm floor and lid roof, and 1 mm exterior edge chamfers.
The radius changes with capacity; wall thicknesses and thread pitch stay fixed.
Each capacity therefore has its own matching lid diameter.

Capacity is **brimful**, including the straight neck, with no headspace allowance:

`volume_ml * 1000 = 2*pi*r^3/3 + pi*r^2*neck_height`

The radius is solved numerically. The reference radius of 20 mm corresponds to
approximately 20.5265 ml with a 3 mm neck; the 20 ml setting uses 19.8168 mm.
Exported meshes approximate curved surfaces, so their capacity differs slightly
from the analytic value; increase `quality` for finer approximation.

## Thread

Single-start right-handed helix, 2 mm pitch, with **45° flanks / 90° included
angle in an axial section**, as shown in the supplied close-up. This is a
symmetric profile. The male and female surfaces use the same helical phase.

The reconstruction uses 0.9 mm radial thread depth and small flat tips/roots;
these replace the reference's rounded thread details and end treatments.
Version 5 adds an exponential depth fade at both ends (see below), so the helix
no longer starts or stops at full depth.
It is a parametric reconstruction, not an exact reproduction of every STEP face.
The mating lid is generated from the same thread surface, enlarged by
`thread_tolerance/2` radially (default 0.25 mm) and given 0.10 mm axial play.
The lid roof meets the rim when seated. No gasket or sealing compression is modeled.

The actual print fit has not been physically tested. Adjust `thread_tolerance`
and `axial_clearance` for your printer/material if necessary.

## Validation

All seven capacity options were rendered to STL at quality 64 and checked with
Trimesh: each has two watertight, connected parts. The seated 20 ml pair had an
empty solid intersection at that resolution. The default quality 128 lid also
rendered successfully. An axial mesh section was inspected against the references.

The lid correction fixes reversed thread-polyhedron face winding (which affects
F5/OpenCSG preview) and extends the complete helical cutter through the opening.
The corrected quality 64 lid was checked for outward thread normals, a watertight
shell, approximately 0.9 mm internal thread depth, and no solid overlap with the
seated container. `lid_section` exposes the profile shown in the new `lid.png` reference.

### Version 4 labels

Rendered at quality 64 with OpenSCAD 2021.01 and compared against the same parts
with the switches off. The engraved pocket floor sits exactly at z = 0.2 mm, and
the solid loses exactly glyph area x 0.2 mm (26.27 mm3 for the "10ml" label),
with no new open edges: the base and the lid are watertight with and without the
label. (The 2026.09 snapshot tessellates 105 non-manifold edges around the
container's thread/shoulder junction; they are identical with the label disabled,
so the label adds none.) The default `grid` view renders all 14 bodies (7
containers and 7 lids). The 10 ml label spans 29 mm of its 39.4 mm free diameter
and its furthest corner is 15.4 mm from the axis, well inside the 19.7 mm free
radius and the 1 mm edge chamfer. The 5 ml base still fits the 18-character label
`CUSTOM CREAM LABEL`, shrunk to about 25 mm wide; a single `8` on the 100 ml base
is limited to about 24 mm tall rather than filling the face. Both orientations
were also checked visually: the base label reads correctly with the container
tipped towards the viewer, and the lid label reads correctly from above.
