# Customizable Video Light Softbox — Parametric OpenSCAD Frame

## Short description

A 3D-printable softbox frame that adapts to your rectangular video light. Customize the light dimensions, frame depth, wall angle and tripod clearance in OpenSCAD, then export the parts you need.

## Description

Build a softbox around your light and your setup. This open-source design uses two clamp tunnels and one or two printed screws to hold a rectangular video light. Four removable wall covers attach with printed thumb screws. Eight tabs around the front rim give clothespins a place to hold your diffusion fabric.

The OpenSCAD source lets you change the dimensions before printing. Make the frame shallower or deeper, adjust the side-wall flare, or change the light's length, width and height. The frame and cover geometry regenerate from those settings. V5 adds an adjustable, rounded cutout to one long cover for access to the light's tripod connection and ballhead.

The source defaults are based on a **116 × 67 × 16 mm light**, identified in the model as the **Ulanzi VL120 RGB**. The smaller and larger light examples illustrate customization; they are not verified compatibility claims for other products. Measure your light and check its controls, ports and mounting position.

Add reflective material to the inside of the covers and attach diffusion fabric to the front with clothespins. The renders show the printed parts, with two covers removed in the assembly views to reveal the frame. Lighting hardware, lining, fabric and clothespins are separate items.

## What you can customize

| Feature | OpenSCAD parameters | V5 default |
| --- | --- | --- |
| Light body dimensions | `light_length`, `light_width`, `light_height` | 116 × 67 × 16 mm |
| Light fit | `light_side_clearance`, `light_headroom` | 0 mm per side; 1 mm headroom |
| Frame depth | `softbox_depth` | 60 mm |
| Wall flare, measured from vertical | `wall_angle` | 24° |
| Frame and front rim | `frame_thickness`, `rail_width` | 5.5 mm; 12 mm |
| Clamp tunnel length and roof | `clamp_length`, `clamp_roof` | 24 mm; 8 mm |
| Wall covers | `wallcover_thickness`, `wallcover_lip_clearance` | 2 mm; 1.2 mm |
| Tripod cutout | `tripod_cutout_width`, `tripod_cutout_depth`, `tripod_cutout_radius` | 48.7 × 12 mm; radius 3 mm |
| Frame notch below the tripod connection | `side_notch_width` | 48.7 mm |
| Fabric attachment tabs | `lip_length`, `lip_width`, `lip_thickness` | 12 × 20 × 3 mm |
| Light clamp threads | `thread_diameter`, `thread_pitch`, `thread_clearance` | 12 mm; 2 mm pitch; 0.25 mm radial clearance |
| Cover screw threads | `thumb_thread_diameter`, `thumb_thread_pitch` | 5 mm; 2 mm pitch |
| VeryOS engraving | `logo_width`, `frame_logo_width`, `logo_depth` | 30 mm; 12 mm; 1 mm |

Other source parameters control plate overlap, hole margins, chamfers, screw heads and the flat cuts used for screw printing. These are related dimensions: check the rendered result after changing them.

## Pictured presets

All values below are changes from V5 defaults. Unlisted values remain at their source defaults. `presets.json` contains all ten presets with the exact settings.

| Preset | Changes |
| --- | --- |
| Shallow | `softbox_depth = 45` |
| Standard | V5 defaults: 60 mm depth, 24° wall angle |
| Deep | `softbox_depth = 90` |
| Wide flare | `wall_angle = 35`, `wallcover_lip_clearance = 1.5` |
| Narrow flare | `wall_angle = 18` |
| Small light | `light_length = 90`, `light_width = 55`, `light_height = 14`, `clamp_length = 18`, `side_notch_width = 38`, `logo_width = 24`, `frame_logo_width = 9` |
| Large light | `light_length = 150`, `light_width = 90`, `light_height = 22` |
| Small cutout | `side_notch_width = 36`, `tripod_cutout_depth = 8`, `tripod_cutout_radius = 2` |
| Default cutout | V5 defaults: width 48.7 mm, depth 12 mm, radius 3 mm |
| Large cutout | `side_notch_width = 60`, `tripod_cutout_depth = 20`, `tripod_cutout_radius = 6` |

At a fixed wall angle, increasing depth also increases the front size. Increasing the wall angle similarly widens the front at a fixed depth. For cover fit, keep `wallcover_lip_clearance >= wallcover_thickness * tan(wall_angle)`; the wide preset uses 1.5 mm clearance for this reason. Cutout depth is measured along the sloping panel, and the cutout must leave room for the cover screws. The default cutout depth is an estimate from the project reference photo, not a hardware measurement.

In V5, `tripod_cutout_width` follows `side_notch_width`. The cutout presets set `side_notch_width` so the panel and frame openings match and the Customizer presets reproduce the pictured width. To change the cover width independently, edit `tripod_cutout_width` in the SCAD source or set it with `-D` on the command line.

## Print and assembly

Print one frame, one plain long cover (`wallcover_big`), one long cover with the tripod cutout (`wallcover_tripod`), two short covers (`wallcover_small`), 16 cover thumb screws, and one or two light clamp screws. The provided print layout includes two light clamp screws.

Use the source print orientations. The frame sits on its front rim; covers lie flat with the inner lip facing up. The screw part selectors produce screws lying on their flat underside, following the model's FDM-oriented thread design. The default combined layout measures approximately **296 × 290 mm**; export parts separately and arrange them in your slicer if needed.

Fit the notched long cover on the **−y side**, with its cutout at the light-side edge, aligned with the notch in the frame. A V4 build can use the V5 replacement `wallcover_tripod` while retaining its other parts, provided the same dimensions are used.

The publishing presets have been checked digitally; they have not been physically printed or fit-tested. Thread and fit settings may need adjustment for your printer. The pack does not make measured claims about optical output or diffusion performance.

## Customize and export

Open [`cuboid_video_light_softboxV5.scad`](../cuboid_video_light_softboxV5.scad) in OpenSCAD, change the parameters, select a printable `part`, render with F6, and export. The source has no external library dependencies. Assembly previews are for inspection; export the individual part selectors or `print_layout` for printing.

From the project directory, these commands reproduce pictured settings:

```sh
openscad -p publish/presets.json -P "Wide flare" \
  -D 'part="frame"' -o wide-frame.stl cuboid_video_light_softboxV5.scad

openscad -p publish/presets.json -P "Large cutout" \
  -D 'part="wallcover_tripod"' -o large-cutout-cover.stl cuboid_video_light_softboxV5.scad
```

For the Customizer GUI, copy `presets.json` beside the SCAD source with the matching base name `cuboid_video_light_softboxV5.json`, then reopen the model. Keep an existing preset file if you already have one; use the command-line examples instead of overwriting it.

## Tags

OpenSCAD, parametric, customizable, softbox, video light, LED light, lighting accessory, photography, videography, diffusion frame, Ulanzi VL120, tripod clearance, 3D printing, FDM, printable screws, removable panels, open source, VeryOS

## Short social caption

Your light. Your dimensions. A printable video-light softbox with adjustable depth, wall angle, light fit and tripod clearance. Change the OpenSCAD parameters, render the model and export your parts. Four shapes from the same source — plus reusable presets.

## Image captions and alt text

| File | Caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | Customizable video-light softbox with a large V5 assembly render and shallow, deep and wide-flare examples. |
| `thumbnail_3x4.png` | Portrait cover showing the V5 softbox frame, adjustable light fit and three proportion variants. |
| `images/01_four_shapes.png` | Four softbox assemblies at a shared scale: 45, 60 and 90 mm depth at 24°, plus 60 mm depth at 35°. |
| `images/02_depth.png` | Three softbox frames comparing 45, 60 and 90 mm depth at the same 24° wall angle. |
| `images/03_wall_angle.png` | Three frames comparing 18°, 24° and 35° wall angles at 60 mm depth. |
| `images/04_light_fit.png` | Frame variants for 90 × 55 × 14, 116 × 67 × 16 and 150 × 90 × 22 mm light bodies. |
| `images/05_tripod_clearance.png` | Three long covers with rounded open cutouts of 36 × 8, 48.7 × 12 and 60 × 20 mm. |
| `images/06_printable_parts.png` | V5 print layout with a frame, four covers, 16 cover screws and two light clamp screws. |

Copyright Jonas Immanuel Frey. The model remains under the repository's GPL license; see [`LICENSE`](../../../LICENSE).
