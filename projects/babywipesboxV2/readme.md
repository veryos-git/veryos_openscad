# Baby wipes box V2 — 45° grip lip and lid seat

[babywipesboxV2.scad](babywipesboxV2.scad) is a standalone version of the
[original baby wipes box](../babywipesbox/babywipesbox.scad), with a larger grip
lip on the front of the small hinged lid and a matching tapered seat around
the dispensing opening, following the
[updated 18 October sketch](WhatsApp%20Image%202026-10-18%20at%2013.07.20.jpeg).
The [earlier grip sketch](archive/WhatsApp%20Image%202026-10-18%20at%2012.00.38.jpeg)
is retained in `archive/`.

The underside of the lid now has a solid tapered insert that fits into a
**2 mm deep, 45° recess** in the cover. Both mating faces run around the entire
capsule-shaped opening. The default horizontal clearance is **0.15 mm per
side** at the same height (about 0.11 mm normal to a 45° face). The flat lid
flange still has its separate 0.25 mm gap above the cover.

This creates a longer, narrower path through the closure and guides the lid
into position. Sealing performance depends on printed fit and surface finish;
this rigid seat has no gasket and has not been tested for airtightness.

The lip projects **9 mm** beyond the lid's capsule outline, is **5 mm** high
from the flat flange underside, and has a **45° underside** for finger purchase.
Its width is 16 mm with rounded corners. The original circular magnet pad
remains beneath the lip: the bevel blends into this reinforcement rather than
cutting through the blind magnet pocket.

![Closed box with the new grip lip](preview.png)

![Close-up of the angled lip and retained magnet pad](lip_detail.png)

![Section through the closed lid and its tapered seat](seat_section.png)

The section shows the lid in gold and the cover in green, with the hinge on
the left and the grip/latch magnet pockets on the right.

## Dimensions and compatibility

The container, outer cover dimensions, magnet positions, and filament hinge
match the original SCAD model. **Print both the revised cover and lid** to use
the tapered seat; an existing container with matching parameters can be reused.
The default box measures 200 × 120 × 85 mm. The opening remains 106 × 48 mm
at the top, narrowing to a 102 × 44 mm throat below the bevel. This keeps the
latch magnet pocket enclosed by its original surrounding wall.

The main lid plate remains 3.6 mm thick, and the finger lip is 5 mm high above
the flange underside. The insert extends 2.25 mm below that underside to
account for the 2 mm seat depth and 0.25 mm flange gap. No fourth printed part
is needed.

The V2 Customizer controls are:

| Parameter | Default | Meaning |
| --- | --- | --- |
| `seat_depth` | 2 | Cover recess depth; its radial taper has the same size, in mm |
| `seat_clearance` | 0.15 | Horizontal gap per side between mating faces at the same Z, in mm |
| `lip_projection` | 9 | Distance beyond the front edge of the lid, in mm |
| `lip_height` | 5 | Lip height from the flat flange underside, excluding the insert, in mm |
| `lip_width` | 16 | Grip width along X, in mm |

Both angles stay at 45° when dimensions change. Reduce `seat_clearance` after
a fit test for a closer seat, or increase it if the printed lid binds. Zero
means nominal surface contact with no printing allowance. `seat_depth` must
leave at least 1.2 mm of straight opening below the bevel. All existing box,
magnet, and hinge parameters remain available.

## Export and assembly

Open `babywipesboxV2.scad` in OpenSCAD. The default `part = "print_layout"`
puts all three separate parts at Z=0, with the lid resting on the insert's
flat bottom. Render with **F6**, export as STL, then
split into objects and arrange the parts in your slicer.

Use `box`, `boxcover`, or `boxcover_lid` to export a single part.
Use `assembly` with `lid_angle = 0` to inspect the closed lip, or `exploded`
to inspect assembly. The assembled view is for inspection: the touching box
and cover fuse if exported together.

From this directory:

```sh
mkdir -p build
openscad -o build/babywipesboxV2.stl babywipesboxV2.scad
openscad -o build/box.stl -D 'part="box"' babywipesboxV2.scad
openscad -o build/boxcover.stl -D 'part="boxcover"' babywipesboxV2.scad
openscad -o build/boxcover_lid.stl -D 'part="boxcover_lid"' babywipesboxV2.scad
```

Use the same dimension overrides for all three exports. Generated STL files
are in the ignored `build/` directory.

Assembly uses ten 6 × 2 mm magnets and an approximately 47 mm length of
1.75 mm filament. The default hinge bore is **2.1 mm** (1.75 + 0.35 mm),
matching the current original SCAD file. See the original
[printing and assembly instructions](../babywipesbox/readme.md#print-and-assemble).
The lip and insert slope at 45° in the supplied print orientation. The lid's
flange, latch pad, and hinge now sit 2.25 mm above the bed: inspect these
overhangs and add local supports where needed. Keep support away from the
sloped mating surface and filament bore; clean the seat and magnet-pocket
bridges before checking the fit.

## Validation

Rendered with OpenSCAD 2026.09.16. Each default part is a connected, closed
mesh with consistent face orientation and its lowest point at Z=0. The
combined layout contains exactly three separate closed components. The
exported meshes confirm the 45° mating profiles and 0.15 mm horizontal gap.
Solid intersection checks between lid and cover are empty at 0.25° steps
from 0° to 10°, then 1° steps through 180°, using the default clearance.
A 2.5 mm seat depth with 0.25 mm clearance also renders successfully.
Physical fit and sealing performance still need a trial print.

Licensed under the repository's [GPL license](../../LICENSE).
