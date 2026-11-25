# Paper advent calendar

A webapp that makes the two cutting files of a paper advent calendar: a front sheet with the windows' doors and a back sheet that shows where the pictures go. Goal: `readme_hgc.md`, sketch: `idea_veryos.jpeg`. **Nothing is cut yet: bridge, fold and mark sizes are untried on a machine.**

![the app with the default calendar, window 3 chosen](preview.png)

| Start | |
|---|---|
| `deno task start` in `paper_advent_calendar/`, then http://127.0.0.1:8778 | the app; reachable from this computer only |
| `deno task start 8779` | on another port |
| `deno task test` | the geometry's checks, see Checks |

Needs [Deno](https://deno.com) and a browser. The page makes the SVGs itself; `webapp/` works from any static web server. The settings stay in the browser (local storage), so a reload keeps them.

## Calendar

| Sheet | Cut into it | For |
|---|---|---|
| Front | each window's free edge, cut through but for bridges; each hinge as a row of cut dashes | the doors: a bridge is a tiny uncut place that holds a door shut until it is torn open, the dashes are the fold it turns on |
| Back | short marks along each window's opening; the logo in dots | glued behind the front; the marks show where to draw each picture |

- Both sheets are drawn as seen from the front, at the same size: one lies on the other as cut, nothing is mirrored but the logo.
- Numbers and pictures are not in the files: drawn by hand after cutting.
- Material: 250 g A4 card, per the brief; not a setting.

## Settings

| Setting | Default | Range | Does |
|---|---|---|---|
| Width, height | 290 × 210 mm | 50 to 1000 | the calendar; both sheets. The brief's default; A4 itself is 297 × 210 |
| Calendar's edge in the files | on | | a red rectangle of the calendar's size in both SVGs, see SVG |
| Number | 24 | 1 to 100 | windows |
| Columns | 6 | 1 to 20 | windows in a row; rows = number / columns, rounded up; a last row that is not full stands in the middle |
| Margin | 15 mm | 0 to about half the calendar's shorter side | from the calendar's edge to the field the windows are spread over; each window in the middle of its cell |
| Window width, height | 32 × 32 mm | 5 to 300 | every window's size |
| Corner radius | 2 mm | 0 to 50 | a rectangle's corners and an arch's foot; a corner a hinge ends in stays sharp |
| Shapes | all three | one at least | which shapes occur, each about as often as the others |
| Doors | left, right, double | one at least | which hinge sides occur, likewise |
| Shuffle shapes and doors | | | deals them out anew |
| Bridge | 0.5 mm | 0 to 5 | width of a bridge; 0: none |
| A bridge every | 25 mm | 2 to 500 | per stretch of a free edge between two corners: length / this, rounded, one at least, spread evenly; none on a stretch under 4 bridges long |
| Fold dash | 3 mm | 0.2 to 50 | cut dashes of a hinge; fitted to the hinge's length, so they come out a little longer or shorter |
| Fold gap | 2 mm | 0.2 to 50 | uncut between the dashes and at both ends of a hinge |
| Mark on the back | 3 mm | 0.5 to 20 | length of the back sheet's marks |
| VeryOS logo on the back | on | | see Logo |
| Start over | | | all settings as at the first start |

Default calendar: cells 43.3 × 45 mm, 11.3 and 13 mm of card between windows; 99 bridges, 123 fold dashes, 192 marks; without the edge the lines add up to 2.6 m on the front and 0.8 m on the back.

## Windows

| Shape | Is |
|---|---|
| Rectangle | corners rounded by the corner radius |
| Arch | a half circle on a rectangle; lower than half its width: two quarter circles of its height with a straight top between |
| Round | a circle where width = height, else a rectangle with half circles for its short sides |

| Door | Cut | Fold |
|---|---|---|
| Left, right, top, bottom | the free edge in one run from the hinge's one end to the other | one hinge on that side |
| Double | top and bottom edge, and down the middle: two leaves | hinges left and right |

| Rule | |
|---|---|
| Hinge | straight, along its side. On a round side it lies further in, where the window is half the side wide: a 32 circle's hinge is 16 long, 2.1 inside, and the opening is flat there |
| Bridges | never on a corner or where cuts meet: a double door's top and bottom cuts end at the middle cut |
| Marks on the back | at a sharp corner an L, 3 along both edges (a third of an edge at most); a rounded corner between straight edges whole; along a curve dashes of 3, about 6 apart; none touches the next, so nothing falls out |
| 32 × 32 by default | rectangle, hinge left: 4 bridges, 6 fold dashes, 4 marks. Circle, hinge left: 3, 3, 12. Arch, double: 5, 6, 8 |

## One window

| Do | Result |
|---|---|
| Click a window on the front sheet | chosen: shown close up in the lines' real width, with fields for its middle, size, shape and door |
| Drag it | moved, in steps of 0.5 mm; the back sheet follows |
| Change a field | that window alone gets the value |
| `Back to the grid` | it drops what it has of its own |
| Change a setting above | windows keep what they have of their own; the rest follows the grid |

Under the buttons: what is wrong with the places, e.g. `Windows 8 and 9 overlap`, `Window 1 reaches over the calendar's edge`, `Window 24 lies on the logo` (by the windows' boxes); the files can still be downloaded.

## SVG

`Front SVG` → `advent_calendar_front_veryos.svg`, `Back SVG` → `advent_calendar_back_veryos.svg`.

| id | Colour | Is | Do |
|---|---|---|---|
| `front_cut` | black | the doors' free edges, a line per piece between two bridges | cut |
| `front_fold` | blue | the hinges' dashes, a line each | cut |
| `back_mark` | black | the marks | cut |
| `back_logo` | grey | the logo's dots | cut, or delete |
| `front_outline`, `back_outline` | red | the calendar's edge, last in the file | cut where the calendar is smaller than the sheet; else delete after placing |

- Size in mm at 1 : 1 (`width="290mm"`, viewBox in mm); lines 0.2 wide, no fills; every path carries its own `fill="none"`.
- Bridges, dashes and dots are real gaps between lines, not a `stroke-dasharray`: a cutter cuts the lines as drawn.
- All of a colour is one path: 3 paths per file.
- The red edge is the files' common frame: with it both have the same bounding box, the calendar's. After import into the cutter's software it must measure the calendar's size; if not, scale both files alike.
- `<desc>` holds the settings as JSON, the windows' own values too.

## Logo

| | |
|---|---|
| Where | back sheet, bottom right as seen from the front, 4 mm from both edges, 12 × 8.5 mm |
| How | the outlines as 40 dots of 1 mm, 0.6 apart: nothing falls out. Mirrored, so it reads from behind |
| Front sheet | none: its only free face is the show face |

## Print

`Print front and back`: two pages, front then back, each sheet in its real size in the middle of an A4 page that lies as the calendar does. In the print dialog: A4, scale 100 %, margins none. A calendar larger than A4 shows its middle only.

## Cutting and gluing

1. Cut the front and the back file from a sheet each, both lying the same way.
2. Draw the pictures on the back sheet between the marks, on the face that was up.
3. Glue the front on the back, edge on edge. No glue behind the doors.
4. Number the doors.

## Checks

| Check | How | Result |
|---|---|---|
| Doors | `deno task test`: every shape with every door in 6 sizes (5 × 8 to 60 × 40) and 4 cut settings: opening closed, in its box, reaching every side without a hinge; hinges straight and at least half their side; cuts = free edge less bridges, bridges evenly spread, off corners; fold dashes on the hinges with their gaps; marks on the opening, over every corner, none touching another; front and back on the same opening; 7 openings of a known area | pass |
| Calendar | same: grid, last row, mix (only ticked, evenly, same for the same seed), a window's own values, the three problems, the logo (outlines closed, dots on the mirrored logo, in its place) | pass |
| SVG | same: size, viewBox, ids, line counts, settings read back from `<desc>`; every line read back by a path reader written after the SVG specification lies on a window's opening | pass, 127 tests in all |
| Tests notice faults | 12 faults put into a copy of the module one at a time (an arc's flag, a hinge's corner, a bridge's place, the logo not mirrored, ...) | each fails a test |
| Drawn by a browser | headless Chrome: every opening's box and the total length of cuts, folds, marks and logo dots as Chrome measures the paths, against the module's numbers | boxes within 0.0001 mm, lengths within 0.03 mm of 2269 |
| Page | headless Chrome: click, drag, own fields, an empty and a too small value, grid settings with a moved window, reload, back to the grid, shuffle, ticks, no shape ticked, margin too large, overlap, bridge 0, both downloads against the module's output, start over, 400 px wide | pass, no errors; 41 checks with the row above and the one below |
| Print | Chrome's PDF: 2 pages A4 landscape for 290 × 210 and 150 × 100, portrait for 210 × 297; measured at 150 dpi: 290 wide from 3.4 mm, 150 × 100 in the page's middle | as expected |
| Not checked | a cut on a machine; the files in a cutter's software; a paper printer; Firefox; a touch screen | |

## Open

| | |
|---|---|
| Machine | the brief does not name it. The files are plain SVG in mm; what its software does with size, layers and the order of cuts is unknown |
| Size | the brief says "A4 290x210mm"; taken as 290 × 210. On an A4 sheet the edge then cuts 7 mm off its length; 297 in `Width` makes it the sheet |
| Bridge 0.5, a bridge every 25 | guessed from the photo in `reference/` (4 bridges on a door of about 35); a drag knife may cut them shorter or longer than drawn. Try one window first: number 1, calendar 60 × 60 |
| Fold dash 3 / gap 2 | read off the same photo; untried in 250 g card |
| Marks cut through the back | as the sketch shows; they stay visible in the picture |
| Sheet on sheet | the files fit each other exactly; how well two cut sheets do depends on where each lay on the mat. Cutting the edge too (calendar smaller than the sheet) gives both the same outline |
| Glue | where not to glue is not in the files |
| Layout | kept in the browser only; the SVGs hold it in `<desc>`, but the app cannot open them |
| `idea_veryos.jpeg`, `reference/` | the sketch and a photo of a bought calendar, not in git |

## Decisions

| Chosen | Instead of |
|---|---|
| Windows in a grid, single ones moved or changed by hand | free placement only, or a random scatter |
| Shapes and doors dealt out evenly by a seed | set per window only |
| Hinge on a round side moved in to half the side's length | a hinge of a point's length on the circle |
| Bridges by distance along the edge | a fixed number per door, which would not grow with the door |
| Fold dashes fitted to each hinge | fixed dashes with a leftover at the ends |
| Marks: corners and curve dashes only | the whole outline dashed, more cuts through the picture |
| Logo in dots on the back | a filled logo, which a cutter would cut out with its islands |
| Calendar's edge in both files | files that hold the windows only, placed by eye |
| One path per colour | a path per window or per line |
