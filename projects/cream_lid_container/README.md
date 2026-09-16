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
