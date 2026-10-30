this is a bic ligher case created in onshape CAD. it features a shell that has the basic shape of the bic lighter. since it is difficult to push the lighter in and get it out again, we created ribs inside the lighter case that touch the lighter . having more ribs should make the friction stronger , having less will make it slide in easier but will have the disatvantage of the lighter could be falling out. 

## OpenSCAD version

`bic_lighter_case.scad` rebuilds that case in OpenSCAD. It is a reconstruction
of the Onshape part in `bicj5j25/` (`ligher_case - Part 1.stl` and the matching
`.x_t`). It is modelled for the **BIC J5 / J25 mini**, the 6 cm size; see
`dimensions.png` for the sizes of the other BIC lighters that do *not* fit.

Open it in OpenSCAD and render with F6. To export from the command line:

```
openscad -o bic_lighter_case.stl bic_lighter_case.scad
```

### Dimensions

Everything is derived from the lighter profile, the wall thickness, the fit
clearance and the rib height. The numbers below are the measured values of the
Onshape export.

| feature | size | where it comes from |
| --- | --- | --- |
| lighter body | 22.2 x 12.7 x 50.8 mm | `dimensions.png`, sketch in `image copy.png` |
| case outside | 25.5 x 16.0 mm | lighter + 2 x (clearance + rib + wall) |
| wall | 1.2 mm | `#thickshell` |
| rib tips | 22.3 x 12.8 mm | lighter + 2 x 0.05 clearance |
| rib | 0.4 mm high, 0.8 mm wide | `#r_circle`, labelled as a diameter |
| ribs per case | 24 | `#num_pattern` |
| cavity depth | 50.8 mm | `#height` |
| floor | 1.2 mm thick | `#bottom_thick` |
| floor hole | 18.2 x 8.7 mm | lighter - 2 x 2 mm, leaves the ledge |
| chamfer | 0.4 mm x 45 deg | `#top_chamfer` 0.2 applied twice |

The case is open at the top. Its floor is a ring, and the hole in the middle
lets you push the lighter back out with a finger; the ledge around the hole is
what the lighter stands on. The mouth and the outer bottom edge are chamfered,
which gives a lead-in so the lighter slides in and lets the case print without
supports.

### Tuning the fit

The whole point of the project is the friction the ribs create:

* `rib_count` - 24 as designed. Lower it to slide the lighter in and out more
  easily, raise it to hold the lighter more firmly. 0 gives a plain shell.
* `rib_diameter` - 0.8 as designed. Its radius is also how far the rib reaches
  into the cavity, so this is the main grip depth.
* `fit_clearance` - 0.05 as designed. The gap between the rib tips and the
  lighter. Prints vary, so this is the first knob to turn if the case comes out
  too tight or too loose.
* `wall_thickness`, `edge_chamfer`, `floor_lip` - geometry, not fit.

### Differences from the Onshape export

* The OpenSCAD model puts the floor at z = 0 so the case sits flat on the build
  plate. The exported STL has the floor below z = 0 (it spans -1.2 to 50.8).
* The exported mesh has a thin non-manifold sliver inside the wall at the
  mouth, left behind by the rib body and the shell being separate solids. The
  OpenSCAD model is a single solid and has no such sliver.
* The exported mesh puts the ribs at equal distances along the curve, within
  about 0.5 degrees of what `rib_angles()` produces. Its rib flanks are also a
  little narrower than the 0.8 mm circle the pattern sketch specifies; the
  OpenSCAD model follows the sketch.
