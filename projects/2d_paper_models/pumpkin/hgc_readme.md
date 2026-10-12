the goal is to have a program with tweakable parameters so that many different cut patterns for paper pumpkins are generated 

best would be openscad since . the generated stls can be converted to dxf or better svg for better preview. 

the shape of a pumpkin is a cut off circle mirrored in the middle , these shapes will be cut out of paper and glued together. 
there is a brown branch on the top.

## Implementation

Open `pumpkin.scad` in OpenSCAD (2021.01 or newer). It is self-contained; no
libraries are needed. Use the **Customizer** to change the parameters and press
**F5** to preview. The adjacent `pumpkin.json` supplies Classic, Tall, Squat, and
Small round presets. Lengths are in millimetres.

The body is a clipped ellipse mirrored across the vertical centre fold, matching
the supplied pattern reference. Each full pattern is one piece of paper. Change
these parameters to make different pumpkins:

| Parameter | Effect |
| --- | --- |
| `body_width`, `body_height` | Finished body diameter and height, excluding the stem. |
| `inset` | Deeper top and bottom dimples as it approaches 0.9; zero makes an ellipse. |
| `base_flattening` | Trims the bottom to stand on; zero leaves it rounded. The finished height stays the same. |
| `piece_count` | Number of full pieces to glue together, and ribs in the assembled preview. |
| `columns`, `gap` | Arrangement and clearance between pieces in sheet view. |
| `stem_height`, `stem_width`, `stem_lean` | Size and bend of the separate brown stem. Stem height is measured from the top of the centre fold. |
| `stem_tab`, `branch_length` | Length glued inside the pumpkin and length of the side twig. Set the branch to zero for a plain stalk. |
| `paper_thickness` | Thickness for STL export and the assembled preview. |

Choose `view`:

- `pattern`: a single body outline.
- `sheet`: `piece_count` body outlines, spaced without overlap. The console
  reports the overall size. This is a cutting layout, not automatic A4 pagination.
- `stem`: the separate stem outline, including its glue tab. Cut one in brown paper.
- `assembly`: orange ribs and a brown stem arranged as a finished pumpkin.
  This is a visual approximation: glue thickness and paper bending are omitted.

Use `template = "full"` for flat paper. Use `template = "half"` as a tracing
template on folded paper, with the straight vertical edge placed on the fold.
Do not cut along that fold. Neither option adds a slit or cutting line in the
middle of the piece. `template` does not change the assembled preview.

## Export

For SVG/DXF, leave `extrude_patterns = false`, select `pattern`, `sheet`, or
`stem`, render with **F6**, then use **File → Export → Export as SVG/DXF**.
These are native 2D outlines; converting through STL is unnecessary.

From this directory, with OpenSCAD available as `openscad`:

```sh
# Single body, directly usable as a millimetre-scale cutting template.
openscad -o pumpkin.svg pumpkin.scad

# Preset and custom dimensions.
openscad -p pumpkin.json -P Tall -o tall.svg pumpkin.scad
openscad -D 'body_width=140' -D 'body_height=70' -D 'inset=0.75' -o wide.svg pumpkin.scad

# A sheet of four small pieces: 138 x 128 mm, fitting inside A4.
openscad -p pumpkin.json -P 'Small round' -D 'view="sheet"' -D 'piece_count=4' -D 'columns=2' -o sheet.svg pumpkin.scad

# Separate brown stem, half template, and DXF.
openscad -D 'view="stem"' -o stem.svg pumpkin.scad
openscad -D 'template="half"' -o half.svg pumpkin.scad
openscad -o pumpkin.dxf pumpkin.scad

# Optional thin solid for an STL-based workflow.
openscad -D 'extrude_patterns=true' -o pumpkin.stl pumpkin.scad
```

Apply the same preset or stem overrides when exporting the stem for a particular
body. The default 12-piece sheet is **346 × 384 mm**, larger than A4. Reduce the
piece count/columns or use a smaller preset when printing on smaller paper.
SVGs retain millimetre units; print at **100% / actual size** to preserve them.
OpenSCAD's SVG display uses filled shapes, so use outline/stroke display in your
vector editor for a printable tracing pattern. In cutting software, treat the
outline as a cut path. STL contains no paper colours.

## Assembly

1. Cut `piece_count` identical full body pieces from orange paper. A half
   template on folded paper also produces one full piece when unfolded.
2. Fold every full piece vertically through its centre.
3. Glue the back of one half to the back of the next piece, keeping folds and
   bottoms aligned, until all pieces form a stack.
4. Cut the stem in brown card. Glue its straight lower tab inside the central
   fold at the top before closing the pumpkin.
5. Fan the stack around the centre and glue the two remaining end halves
   together. Space the ribs evenly and let the glue dry.

The `examples/` directory contains ready-to-view SVG exports. Compare the
[four patterns at the same scale](examples/patterns.png) or view the
[assembled pumpkin](examples/assembly.png), rendered in Blender from OpenSCAD's
exported body and stem geometry. The PNGs are previews; use the SVGs for cutting.

Validated with OpenSCAD 2021.01: preset dimensions and symmetry, single closed
body/stem outlines, full/half area agreement, sheet counts and clearances,
parameter boundaries, DXF export, and closed flat/assembled STL meshes.
