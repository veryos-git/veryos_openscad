# Customization publishing packs

The current collection covers three projects:

- `biclightercase2` — four exterior patterns on the same lighter fit.
- `babywipesboxV2` — everyday, cubic, elongated and tall body proportions.
- `simple_cylindrical_screwing_containerV2` — pocket, everyday, wide and tall jars with different textures.

Open [index.md](index.md) for links to all deliverables or [overview.jpg](overview.jpg) for a visual overview. Each project keeps its pack in `publish/customization/`, alongside existing publication material.

Each pack contains landscape and portrait four-variant covers (2400 × 1800 and 1800 × 2400), four transparent 1200 × 1000 renders, title/description/tags in `listing.md`, parameter presets, an export helper and source provenance. All four examples use the same physical scale within each cover. Geometry comes directly from the original OpenSCAD source; source models are unchanged.

## Reproduce the images

Requirements: Node.js, OpenSCAD with Manifold, Blender 5.1, `/usr/bin/python3` with Pillow/Cairo/PyGObject-Rsvg, and Python with Trimesh for the mesh audit. The exports here use OpenSCAD 2026.10.25 from the [official downloads](https://openscad.org/downloads.html), cached locally in `.gitignored/tools/OpenSCAD-2026.10.25.AppImage` (not committed).

From the repository root:

```sh
PUBLISH_OPENSCAD="$PWD/.gitignored/tools/OpenSCAD-2026.10.25.AppImage" \
PUBLISH_BACKEND=Manifold node publishing/build.mjs --stage=mesh

python3 publishing/validate_meshes.py .gitignored/publishing/config.json
node publishing/build.mjs --stage=render
node publishing/build.mjs --stage=compose
```

Add `--only=babywipesboxV2`, `--only=biclightercase2` or `--only=simple_cylindrical_screwing_containerV2` to rebuild one project. `PUBLISH_JOBS` controls concurrent mesh exports (default 4); `PUBLISH_RENDER_JOBS` controls Blender processes (default 2). Successful exports/renders are cached by hash, with logs in `.gitignored/publishing/`.

`catalog.mjs` contains the copy and exact parameter overrides. `studio.py` imports indexed OFF meshes and assigns presentation materials. `compose.py` typesets both covers and generates the listings/index. OFF preserves vertex indices that STL import can lose when welding coincident points in an assembly.

## Use the presets

Load `presets.json` through OpenSCAD's `-p` and `-P` options, or use the included helper. For example, from the wipes-box project folder:

```sh
node publish/customization/export-variant.mjs Cube cube-print-layout.stl --part=print_layout
```

Use `--view=print` for the screw-top container; the lighter case already renders as a single printable part. The covers show assembled boxes/jars, so do not treat those assembly views as printable combined parts.

The cubic wipes-box example uses a 12 mm center hinge and 68 mm opening width so the hinge, latch and magnet-post constraints remain satisfied. Box labels describe body parameter settings; exterior texture and lid hardware add to those dimensions. Jar labels likewise exclude pattern relief and the alignment-stop allowance.

## Verification and typography

`mesh-audit.json` records the twelve meshes' bounds, topology and positive volume. `preset-audit.json` checks that the supplied Customizer presets reproduce the command-line geometry. These are digital checks; the new examples have not been physically printed or fit-tested.

Consolas was requested but is unavailable on this machine. The covers use DejaVu Sans Mono. To recompose with local Consolas font files:

```sh
PUBLISH_FONT=/path/to/consola.ttf \
PUBLISH_FONT_BOLD=/path/to/consolab.ttf \
node publishing/build.mjs --stage=compose
```

Font files are not redistributed. The VeryOS mark comes from `veryos_logo.svg`, and the OpenSCAD icon comes from the repository's existing publishing assets. Existing model licenses remain unchanged.
