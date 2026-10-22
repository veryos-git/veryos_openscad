# Baby wipes box V2 — ribbed outline, 45° grip lip and lid seat

[babywipesboxV2.scad](babywipesboxV2.scad) is a standalone version of the
[original baby wipes box](../babywipesbox/babywipesbox.scad), with a curved rib
pattern around the container and cover, a larger grip lip on the hinged lid,
and a matching tapered seat around the dispensing opening. It follows the
[final 18 October sketch](WhatsApp%20Image%202026-10-18%20at%2013.31.19.jpeg).
The [earlier grip sketch](archive/WhatsApp%20Image%202026-10-18%20at%2012.00.38.jpeg)
and [seat sketch](archive/WhatsApp%20Image%202026-10-18%20at%2013.07.20.jpeg)
are retained in `archive/`.

The default outline has **52 smooth waves**, spaced about **12 mm** apart,
projecting **1.5 mm outward**. They wrap around the rounded corners and run
vertically from the first layer to the top rim. The cover uses the same
outline, so its ribs align with the container. The original inner cavity and
minimum wall thickness are retained.

The box's measured bed-contact area increases from 23,944.74 to 24,417.21 mm²
(about **472 mm², or 2%**). This adds contact area; the actual effect on adhesion
and warping needs a print test. The ribs are part of the finished shape.

![Closed box with matching ribs on the container and cover](preview.png)

![Top view of the curved outline](outline_preview.png)

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

![Close-up of the angled lip and retained magnet pad](lip_detail.png)

![Section through the closed lid and its tapered seat](seat_section.png)

The section shows the lid in gold and the cover in green, with the hinge on
the left and the grip/latch magnet pockets on the right.

## Dimensions and compatibility

**Print the ribbed container and cover** for the matching finish. The hinged
lid is unchanged from the preceding V2 revision with the 45° seat and can be
reused. Magnet positions, the filament hinge, and the tapered seat are retained.
An earlier smooth container still fits the cover's magnet positions, although
their outer outlines differ.

The default box measures **203 × 123 × 85 mm including the ribs**. The
`box_width` and `box_depth` settings remain 200 × 120 mm before rib projection;
the overall width and depth each increase by `2 * rib_depth`. Interior space
between flat walls remains 195.2 × 115.2 × 82.6 mm, with corner posts intruding
into that space. The opening remains 106 × 48 mm
at the top, narrowing to a 102 × 44 mm throat below the bevel. This keeps the
latch magnet pocket enclosed by its original surrounding wall.

The main lid plate remains 3.6 mm thick, and the finger lip is 5 mm high above
the flange underside. The insert extends 2.25 mm below that underside to
account for the 2 mm seat depth and 0.25 mm flange gap. No fourth printed part
is needed.

The V2 Customizer controls are:

| Parameter | Default | Meaning |
| --- | --- | --- |
| `rib_depth` | 1.5 | Maximum outward projection, in mm; zero restores the smooth outline |
| `rib_pitch` | 12 | Target rib spacing, in mm; adjusted to whole waves in each quarter |
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

The rib count adjusts with box size and `rib_pitch`; the default actual pitch
is 12.04 mm. Opposite sides are mirrored and corners share the continuous
pattern. Set identical rib parameters for the box and cover. The print layout
accounts for the larger outline and keeps a 15 mm gap between parts.

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
The ribbed box and cover have matching outer rim vertices and verified
203 × 123 mm bounds; the hinged lid mesh matches the preceding revision.
The smooth-outline setting and a larger 220 × 130 mm base with 2 mm ribs at
8 mm target spacing were also checked. Physical fit, bed adhesion, and sealing
performance still need a trial print.

Licensed under the repository's [GPL license](../../LICENSE).
