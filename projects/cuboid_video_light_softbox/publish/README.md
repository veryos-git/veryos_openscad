# V5 softbox publishing pack

Open [contact-sheet.png](contact-sheet.png) to review all eight publication images. Use [listing.md](listing.md) for the title, description, tags, social caption, assembly notes and image alt text.

## Upload order

1. [Landscape thumbnail](thumbnail_4x3.png) — 2400 × 1800.
2. [Four shapes](images/01_four_shapes.png) — the customization overview.
3. [Depth](images/02_depth.png).
4. [Wall angle](images/03_wall_angle.png).
5. [Light fit](images/04_light_fit.png).
6. [Tripod clearance](images/05_tripod_clearance.png).
7. [Printable parts](images/06_printable_parts.png).

Use the [portrait thumbnail](thumbnail_3x4.png), 1800 × 2400, wherever a vertical cover is needed. All six supporting images are 2400 × 1800. All newly generated images are compressed PNGs with an sRGB profile; the original photographs under `realimages/` are preserved.

`renders/` contains eleven separate transparent CAD renders at 1800 × 1500, including the print layout and three cover details. `presets.json` is an OpenSCAD Customizer preset file; `variants.json` retains the numeric parameter values. The images use V5, not the older versions or the reference photographs. The source model is unchanged.

Comparison images use a shared camera scale and crop within each page. The thumbnail hero is enlarged for legibility. Colors are presentation choices. Assembly renders reproduce the source preview with two covers installed and two removed; the light, lining, fabric and clothespins are omitted. These are geometric previews, not measured optical simulations.

## Rebuild

Requires OpenSCAD with the Manifold backend, Blender, and system Python with Pillow, Cairo and PyGObject/Rsvg. The local build used the existing OpenSCAD nightly AppImage and Blender; exact versions and source hash are in `provenance.json`. No network services or AI image generation are used.

From the repository root:

```sh
python3 projects/cuboid_video_light_softbox/publish/source/build.py
```

The default OpenSCAD path is `.gitignored/tools/OpenSCAD-nightly.AppImage`. Override it with `PUBLISH_OPENSCAD=/path/to/openscad`. `PUBLISH_JOBS` controls concurrent mesh exports (default 3). Logs and meshes go to `.gitignored/cuboid_softbox_publish/`.

Individual stages:

```sh
python3 projects/cuboid_video_light_softbox/publish/source/build.py --stage=mesh
python3 projects/cuboid_video_light_softbox/publish/source/build.py --stage=render
python3 projects/cuboid_video_light_softbox/publish/source/build.py --stage=compose
```

For a quick render check, add `--scene=standard --draft` to the render command; rerun without `--draft` before publishing. Full builds retain the default `$fn=64` from V5. OFF meshes preserve indexed topology, and `mesh-audit.json` records edge closure, winding, bounds and positive volume for every exported material group. `preset-audit.json` compares direct OpenSCAD preset exports to the pictured geometry.

The requested Consolas typeface is unavailable on this machine. This pack uses DejaVu Sans Mono, matching the fallback in the existing repository publishing packs. To recompose with locally installed Consolas files:

```sh
PUBLISH_FONT=/path/to/consola.ttf \
PUBLISH_FONT_BOLD=/path/to/consolab.ttf \
python3 projects/cuboid_video_light_softbox/publish/source/build.py --stage=compose
```

The VeryOS logo comes from the root `veryos_logo.svg`; the OpenSCAD logo is reused from the repository's existing publishing assets. Font files are not included. All scripts and the source design retain the repository GPL license.

`veryos_softbox_v5_publishing_pack.zip` contains the finished publication images, listing copy, original V5 SCAD source, presets, transparent renders, build scripts, brand assets, audit records and license. The original repository paths are preserved inside the archive; open `START_HERE.md` after extracting. `assets-manifest.json` records the included file hashes.
