# Foldable paper haunted house

A parametric OpenSCAD template and small local web app for making a paper
haunted-house lantern. The template is one connected piece: a square floor,
four walls with simple windows, and four tapered glue tabs. Fold the walls up
and glue the corners to make an **open-top lantern**. The roof shapes are
upright silhouettes, based on [the inspiration](inspiration/image.png), with
the small decorations left out.

The default house has a 50 × 50 mm floor, 55 mm walls and 18 mm roof silhouettes.
Its flat template measures **196 × 196 mm**, fitting on A4 paper at 100% scale.
Allow for your cutter's usable area and registration margins. All dimensions
are in millimetres.

## Web app

Requirements: **Deno 2** and **OpenSCAD** on your `PATH`. No packages, CDN assets
or API keys are needed. From this project directory, run:

```sh
deno run --no-config --allow-read=.,/tmp --allow-write=/tmp \
  --allow-run=openscad --allow-net=127.0.0.1:8040 server.js
```

Open **http://127.0.0.1:8040** in a browser with WebGL support.

- Adjust the house, windows, paper thickness and glue tabs. Changes update
  automatically. **Reset settings** restores the OpenSCAD defaults.
- Drag the folded lantern to rotate; scroll to zoom. With the preview focused,
  arrow keys rotate and `+`/`-` zoom. **Reset view** restores the camera.
- Switch to **Cutting template** to inspect the flat outline and orange fold
  guides. The sheet dimensions appear below the preview.
- **Download SVG** saves the cutting template for the current settings. It is
  disabled while rendering or when settings are invalid.

Both the folded mesh and downloadable SVG are rendered from
[paper_folding_haunted_house.scad](paper_folding_haunted_house.scad) by the local
OpenSCAD executable. Controls read their defaults and ranges from that file.
The browser does not maintain a separate copy of the house geometry. Restart
the server and reload the page after editing the SCAD parameter definitions.
The app binds to your computer's loopback interface; stop it with Ctrl+C.

## SVG decorations on each wall

1. Open **Decorate a wall** and choose **Front**, **Left**, **Back**, or **Right**.
   These correspond to the top, left, bottom, and right arms of the flat net.
2. Click **Load SVG**. You can upload multiple files and use different designs
   on every wall. The first upload replaces that wall's standard window;
   enable **Keep standard window** to combine it with your decorations.
3. Drag a decoration to position it. Drag its orange corner to resize it with
   the aspect ratio locked, or enter **Width**, **Center from left**, and
   **Center above floor** in millimetres. Drag the round handle above it to
   rotate it; hold Shift to snap to 15° steps. **Rotation** sets the exact
   angle in degrees, clockwise as seen from outside. Select overlapping decorations using
   the dropdown. With the editor focused, arrow keys move the selection by
   0.5 mm; Shift + arrow moves it by 2 mm.
4. Switch to **Folded lantern** or **Cutting template** to inspect the result,
   then **Download SVG**. The downloaded paths include your decorations, with
   no editor handles or fold guides.

The editor shows each wall **from outside**. Asymmetric artwork therefore
reads correctly on the folded lantern; it appears mirrored in the flat net,
whose upper face becomes the inside of the house. Positions are measured from
the outside view's left edge and the floor fold.

SVG geometry becomes **cutouts**, regardless of its colour. OpenSCAD resolves
paths, curves, transforms, basic shapes, local shape references and compound
holes before the artwork reaches the editor. Convert text and stroked artwork
to paths first; images, clipping, masks, filters and active content are not
supported. Stylesheets, such as Illustrator's default `<style>` block, are
ignored, so every shape is cut even if CSS would hide it. See the [OpenSCAD SVG import documentation](https://files.openscad.org/documentation/manual/SVG_Import.html)
for its underlying geometry rules.

Cuts are clipped to leave a 2 mm wall perimeter and clear the folded corner
glue areas. The orange selection outline shows the whole uploaded decoration,
including any part that falls outside the cuttable area. Use connected stencil
designs: isolated paper islands inside closed cutouts will fall out unless you
attach them to a backing sheet.

Use up to 16 decorations per house, with SVG uploads below 500 KB. Very detailed
artwork may need path simplification. **Remove** deletes the selected decoration;
removing the last one from a wall restores its standard window. **Reset
settings** clears all uploads and restores the house defaults. Decorations
live in the current page session, so download your template before reloading.

## OpenSCAD parameters

Open the `.scad` file in OpenSCAD and use the Customizer, or edit its top-level
parameters. No OpenSCAD libraries are required.

| Parameter | Purpose |
| --- | --- |
| `output` | `flat`: thin extrusion for STL; `cut`: 2D SVG/DXF; `assembled`: folded preview; `wall`: selected wall from outside |
| `house_size`, `wall_height` | Square floor size and wall height up to the eaves |
| `roof_height` | Height above the eaves; zero removes the roof silhouettes |
| `roof_style` | `mixed`, `gable`, `crooked`, `stepped`, or `flat` |
| `window_style` | `cross` for four panes with connected paper bars, or `plain` for one rectangular opening |
| `window_width`, `window_height`, `window_bar` | Window opening envelope and crossbar width |
| `glue_tab_width`, `tab_inset` | Glue area and clearance at the ends of each tab |
| `paper_thickness` | Extrusion thickness; does not change the cutting outline |
| `show_fold_guides` | Orange fold guides in the flat F5 preview only |

`mixed` uses a crooked gable at the top of the flat net, a regular gable on the
left, a stepped roof at the bottom, and a regular gable on the right. Each wall
has one centred window. Parameter checks keep the windows clear of the glue
tabs and leave at least 2 mm of paper around the openings; crossbars are at
least 1 mm wide. Some individually allowed settings are incompatible together;
the app explains the constraint when OpenSCAD rejects a combination.

## Export without the web app

Run these commands from this project directory:

```sh
# Thin, flat solid for an STL-to-vector workflow.
openscad -o haunted_house.stl paper_folding_haunted_house.scad

# Direct vector export avoids needing an STL conversion tool.
openscad -D 'output="cut"' -o haunted_house.svg paper_folding_haunted_house.scad
openscad -D 'output="cut"' -o haunted_house.dxf paper_folding_haunted_house.scad

# Example: all gables, with plain windows.
openscad -D 'output="cut"' -D 'roof_style="gable"' -D 'window_style="plain"' \
  -o haunted_house_plain.svg paper_folding_haunted_house.scad
```

For GUI export, use **F6 / Render** first. Select `flat` before exporting STL,
or `cut` before exporting SVG/DXF. Use `assembled` to inspect the folded shape;
it uses ideal folds and does not model paper bend radius.

**Exported cutting files contain cuts only.** Fold guides disappear on F6 and
are never included in STL, SVG or DXF exports. There are no perforations or
slots along the folds. Score manually using the web app's cutting preview or
the flat OpenSCAD F5 preview as a guide. Alternatively, draw separate scoring
lines in your cutter software and assign them to a scoring operation.

Import vectors in millimetres at 100% scale; verify the default overall size is
196 × 196 mm before cutting. If converting STL, take the XY outline and preserve
the window holes. Do not import triangulation edges as cutting paths.

## Fold and glue

1. Cut the outer outline and the window openings from cardstock. Keep the
   window crossbars attached to the walls.
2. Score the four edges of the central square. Score the straight root of each
   glue tab, from its lower inset to its upper inset. There are eight fold
   lines in total; the roof silhouettes remain in the plane of their walls.
3. Optionally glue translucent paper behind the windows, keeping it clear of
   the floor folds and corner glue areas.
4. Fold all four walls upward by 90° around the central floor. Fold each glue
   tab inward by 90° and glue it behind the neighbouring wall. Work around the
   four corners, leaving the last corner accessible until the others are set.
5. Put a small battery-powered LED light inside through the open top. Use LEDs
   only; paper lanterns are not suitable for candles or other hot light sources.

Start with a scrap-paper test to check scale, scoring and glue clearance for
your material. Increasing the house or roof dimensions also increases the
required sheet size; OpenSCAD prints the flat footprint when rendering.

## Verify changes

From this directory:

```sh
deno test --no-config --allow-read=.,/tmp --allow-write=/tmp \
  --allow-run=openscad server_test.js
```

The tests render all roof/window combinations, check connected watertight
folded meshes, verify vector dimensions and window counts, and exercise invalid
settings. Decoration tests cover curves, compound holes, all four walls,
outside orientation, scaling, placement, protected edges and rejected SVG
content. No physical cardstock assembly has been tested yet.


---
extension 1

the generic window decorations are great but even better would be this option:
allow the user to load and scale and place svg decorations on each side of the house directly in the app.
