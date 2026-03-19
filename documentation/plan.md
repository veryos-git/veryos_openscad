# OpenSCAD Project Manager

Desktop application for managing OpenSCAD projects destined for a 3D printing marketplace.

## core entities

### o_project
Each project represents a single marketplace listing containing:
- `.scad` script — OpenSCAD parametric script where parameters generate `.stl` models
- `.3mf` file — pre-sliced version (example output from the script, sliced in a slicer)
- `.stl` file — generated mesh from the `.scad` script via OpenSCAD CLI
- thumbnail — real-life photo of the printed model
- marketplace text — title, description, hashtags
- status — draft / ready / published

## architecture

- **backend**: Deno + WebSocket + SQLite/JSON database
- **frontend**: Vue 3 SPA with project card grid and detail editor
- **cli integration**: OpenSCAD CLI for `.scad` → `.stl` rendering and preview generation
- **file storage**: project files stored in `.gitignored/project/{n_id}/{type}/`

## file flow

1. user uploads `.scad` file → stored in project directory
2. user clicks "Generate .stl" → OpenSCAD CLI renders `.scad` → `.stl`
3. user uploads `.3mf` file → stored in project directory
4. user clicks "Render preview" → extracts embedded thumbnail from `.3mf` (ZIP) or renders via OpenSCAD
5. user uploads real-life photo → stored as project thumbnail
6. user fills in title, description, hashtags → persisted to database
7. user sets status to "ready" or "published" when listing is complete
