# Dragon egg lamp

**Deprecated.** The newest project is [`projects/pucklight_lamp_v2`](../../../pucklight_lamp_v2): its webapp does what this one does, as the kind Egg.

Pick a dragon scale pattern, set the relief and the egg's size, see how it glows, and
download the print files. It runs on your own machine.

```sh
deno task start        # then open http://127.0.0.1:8765/
deno task start 8766   # on another port
```

Run it from `rose_pink_translucent_lamp/` or from here. It needs only
[Deno](https://deno.com), and a browser with WebGL2 for the 3D view. Without WebGL2 the
settings, numbers and print files still work.

## Saved lamps

Each lamp you save is one file in `project/`, for example `project/3.json`.

| To | Do this |
| --- | --- |
| Create | Type a name and press *Save*, or Enter |
| Edit | Click a lamp in the list, change anything, including its name, and press *Save* or Ctrl+S |
| Copy | *Save copy* saves the current settings as a new lamp and opens it |
| Delete | Press × on its row, then *Delete* |
| Start over | *New* |

The line under the name says whether everything is saved. Before anything replaces work
that isn't saved, the app asks. Unsaved work also survives a page reload, in that browser.
After you delete the open lamp, its settings stay on screen, so *Save* brings it back.

A saved lamp holds its name, the design settings and the mesh detail. The view settings,
like *Lit* or *Cut open*, aren't part of it. The print files are named after the lamp.

## The parts

| Part | Comes from | Print |
| --- | --- | --- |
| Egg | This app | Standing on its neck, in translucent rose pink |
| Sockel, screwin, click base | `../pucklight_eggV1.scad` | Standing as they are used |

*Download whole lamp* puts all four into one 3MF, side by side. They fit a 256 mm bed up
to an egg about 160 mm wide. The base parts are the same for every egg, so they are stored
in `part/`. After changing the `.scad` file, run `deno task part`.

The puck light and its fit are those of `../pucklight_sphereV3.scad`. The egg's thread is
that file's thread, so eggs also fit that file's sockel.

## How the egg is built

- **Outline:** Hügelschäffer's egg formula. *Width* is its exact width without the relief.
  *Height, as printed* is its height from the bed to the tip.
- **Bottom:** from the neck, a 45 degree cone runs up to where the egg itself overhangs 45
  degrees, as on the sphere.
- **Top:** the outline bends less and less until it reaches the *Steepest overhang at the
  top* at the tip. That is the steepest the inside gets, and there is no modelled support.
- **Scales:** tiles keep their shape all over the egg and just get smaller towards the
  ends, like the scales of a real egg. It is Mercator's map, applied to an egg. The relief
  shrinks with them, so their slopes are the same everywhere. It also fades out above the
  sockel's rim. The pattern's height map is the 16-bit PNG in `../Tileable`.
- **Walls:** the inside is smooth. Relief only adds to the *Thinnest wall*, so the scales
  are thick and the grooves between them thin, and the thin parts glow brighter.
- **No booleans:** the mesh is one closed surface of rings around the axis.

## The logo

Only the TraceTrove logo V3 is used, as in `branding/LOGO_V3/tracetrove_logo.scad`.

| Where | Size | Seen |
| --- | --- | --- |
| Front of the sockel | 20 mm | Always |
| Bottom of the click base | 50 mm | When the lamp is turned over |
| Bottom of the screwin's flange | 9.5 mm | With the screwin out |
| Front of the egg (*Engrave logo V3*) | Set in the app | Off by default |

To change the three on the base, edit the *Logo* group in the `.scad` file and run
`deno task part`.

## Reading the views

- **Lit** is an estimate, not a measurement. It fades each colour with the wall's
  thickness. A test print shows how your filament really behaves. *Brightness* and the
  *Colour of the puck light* only affect this view.
- **Overhang** colours faces past the limit, orange to red, as a slicer would see them.
- **Past 45 degrees** is normally 5 to 8 % of the outside, at 2 mm of relief and 4 tiles
  around, on every pattern: the scales' lips are short. What droops is what goes well past
  it, so the app warns when more than 2.5 % of the outside passes 60 degrees. *Flip* often
  removes those faces, at the price of a different look.

## Slicing

These are starting points, not tested on a printer yet.

- Use enough walls to fill the thick scales: at 0.4 mm lines, 0.8 mm of wall and 2 mm of
  relief, that is 7 walls. Sparse infill inside a scale would show as a shadow when the
  lamp is lit.
- No supports. They would mark the outside and could not be reached inside.
- Cool the top well, as the inside overhangs most there.

*Solid egg for a slicer's vase mode* exports the egg without its inside. The slicer then
prints one wall that follows the scales, so they don't glow differently. Set its bottom
layers to 0, or the print has a floor, which hits the sockel's ribs.

## Tests

`deno task test` runs them. They check the following:

- every mesh is closed and the right way out, at the smallest and largest sizes
- the thread against the real `part/sockel.stl`, by following rays to its wall
- the thread formula against `pucklight_sphereV3.scad`, and the logo against the branding
  folder, by asking OpenSCAD
- the server's saving, its refusals and that other websites can't use it
- the viewer's real shaders, on Mesa's software renderer, by looking at what it draws

The tests that need Mesa skip themselves if it can't start. A test run writes nothing to
`project/`.

## Files

| File | What it is |
| --- | --- |
| `egg.module.js` | The egg's shape and mesh |
| `heightmap.module.js` | Reads the 16-bit PNGs |
| `logo.module.js` | The logo as a distance field |
| `viewer.module.js` | The 3D view and its shaders |
| `export.module.js` | STL and 3MF |
| `worker.module.js` | Builds meshes away from the page |
| `project.module.js` | The saved lamps' panel |
| `client.module.js` | The page |
| `serve.js` | The server: files and the lamps' API |
| `make_asset.py` | Writes `thumbnail/` and `part/` |
