# Paper advent calendar

A webapp for a paper advent calendar of two sheets of card: it makes the cutting files, a front sheet with the windows' doors and a back sheet behind it, and prints a picture on each sheet at the very place the cuts will fall. Goals: `readme_hgc.md` with the sketch `idea_veryos.jpeg`, and `software_improvements_decoration_drawing/readme_hgc.md` for print and cut. **Nothing is printed on paper or cut yet: bridge, fold and mark sizes and the fit of print and cut are untried.**

![the app with a test picture on each sheet; the pointer moves the front's picture](preview.png)

| Start | |
|---|---|
| `deno task start` in `paper_advent_calendar/`, then http://127.0.0.1:8778 | the app; reachable from this computer only |
| `deno task start 8779` | on another port |
| `deno task test` | the checks of the geometry, see Checks |

Needs [Deno](https://deno.com) and a browser. The page does all the work itself; `webapp/` runs from any static web server. Settings and pictures stay in the browser (local storage, IndexedDB): a reload keeps them, another browser does not have them.

## Calendar

| Sheet | Printed on it | Cut into it | For |
|---|---|---|---|
| Front | its picture: the calendar's face | each window's free edge, cut through but for bridges; each hinge as a row of cut dashes; the calendar's edge | the doors: a bridge is a tiny uncut place that holds a door shut until it is torn open, the dashes are the fold it turns on |
| Back | its picture: what shows through the opened doors | the calendar's edge; the logo in dots; marks along each window's opening, if the pictures are drawn by hand | glued behind the front |

- Both sheets are drawn as seen from the front, at the same size and place: one lies on the other as cut, nothing is mirrored but the logo.
- Numbers are not made: they belong to the picture, or are drawn by hand.
- Material: 250 g card, per the brief; not a setting.

## Print, then cut

Print and cut meet if both put the calendar at the same place of the sheet of paper, measured from its bottom left corner.

1. Set the sheet of paper, the calendar's size and its distance from the sheet's left and bottom edge. The calendar lies inside the printer's margin, the dashed frame.
2. Load a picture for the front, and one for the back. Move the picture under the windows, or the windows onto the picture.
3. Trial: print `cut lines only` on plain paper. Lay a ruler on the ruler line under the calendar: 200 mm must be 200 mm.
4. In the cutter's software place `Front SVG` at the distances the app names under the calendar's settings, lay the trial sheet on the mat with its bottom left corner at the software's, and cut.
5. Where the knife runs beside the printed lines, measure how far and enter it as `Shift right` and `Shift up`; print and cut again until it fits.
6. Print `the pictures` on card: page 1 the front, page 2 the back. Cut each with its file, at the same distances.
7. Glue the front on the back, edge on edge; no glue behind the doors.

| Print dialog | |
|---|---|
| Paper size | the sheet's, as set in the app |
| Scale | 100 %, not "fit to page"; nor in the printer's own settings |
| Margins | none |

## Settings

| Sheet of paper | Default | Range | Does |
|---|---|---|---|
| Width, height | 297 × 210 mm | 50 to 1500 | the paper a sheet of the calendar is printed on and cut from; A4 lying by default |
| Printer's margin | 5 mm | 0 to 50 | the border a printer leaves blank, drawn dashed; said when the calendar lies in it |

| Calendar | Default | Range | Does |
|---|---|---|---|
| Width, height | 277 × 190 mm | 50 to 1000 | both sheets of the calendar; 10 mm less than A4 all around |
| From the sheet's left, from its bottom | 10, 10 mm | 0 to 1500 | where the calendar lies on the sheet; below them the distances from the right and the top, and each cutting file's size and place for the cutter's software |
| Calendar's edge in the files | on | | a red rectangle of the calendar's size in both SVGs: the cut that takes the calendar out of the sheet. Without it a file is as large as its cuts, and the app names that box's place |

| Windows | Default | Range | Does |
|---|---|---|---|
| Number | 24 | 1 to 100 | windows |
| Columns | 6 | 1 to 20 | windows in a row; rows = number / columns, rounded up; a last row that is not full stands in the middle |
| Margin | 15 mm | 0 to about half the calendar's shorter side | from the calendar's edge to the field the windows are spread over; each window in the middle of its cell |
| Width, height | 32 × 32 mm | 5 to 300 | every window's size |
| Corner radius | 2 mm | 0 to 50 | a rectangle's corners and an arch's foot; a corner a hinge ends in stays sharp |
| Shapes | all three | one at least | which shapes occur, each about as often as the others |
| Doors | left, right, double | one at least | which hinge sides occur, likewise |
| Shuffle shapes and doors | | | deals them out anew |

| Cuts | Default | Range | Does |
|---|---|---|---|
| Bridge | 0.5 mm | 0 to 5 | width of a bridge; 0: none |
| A bridge every | 25 mm | 2 to 500 | per stretch of a free edge between two corners: length / this, rounded, one at least, spread evenly; none on a stretch under 4 bridges long |
| Fold dash | 3 mm | 0.2 to 50 | cut dashes of a hinge; fitted to the hinge's length, so they come out a little longer or shorter |
| Fold gap | 2 mm | 0.2 to 50 | uncut between the dashes and at both ends of a hinge |
| Marks on the back | on | | short cuts that show where the windows open, for pictures drawn by hand; off for a printed back, they would cut into the picture (said when both are there) |
| Mark's length | 3 mm | 0.5 to 20 | length of the marks |
| VeryOS logo on the back | on | | see Logo |

| Print | Default | Range | Does |
|---|---|---|---|
| Print | the pictures | pictures with cut lines, cut lines only | what a sheet with a picture shows; a sheet without one always shows its cut lines |
| Bleed | 2 mm | 0 to 20 | the picture is printed this far over the calendar's edge: a cut a little beside the edge shows no white |
| Crop marks and ruler line | on | | outside the calendar, see Print |
| Shift right, shift up | 0, 0 mm | -20 to 20 | moves the whole print on its page, to make up for where printer and cutter put it |

`Start over`: all settings as at the first start, the pictures removed.

Default calendar: cells 41.2 × 40 mm, 9.2 and 8 mm of card between windows; 99 bridges, 123 fold dashes, 192 marks; without the edge the lines add up to 2.6 m on the front and 0.8 m on the back.

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

## Pointer on the sheets

Above the sheets: what the pointer moves, windows or the picture, and the zoom (whole sheet, 2 ×, 4 ×). The settings and the sheets scroll each on their own.

| Windows | Result |
|---|---|
| Click a window on the front sheet | chosen: shown close up in the lines' real width, with fields for its middle, size, shape and door |
| Drag it | moved, in steps of 0.5 mm; the back sheet follows |
| Change a field | that window alone gets the value |
| `Back to the grid` | it drops what it has of its own |
| Change a setting of the grid | windows keep what they have of their own; the rest follows the grid |

| Picture | Result |
|---|---|
| `Load a picture`, for the sheet chosen beside it | any picture file the browser shows; it fills the calendar and its bleed, and the pointer moves the picture from then on |
| Drag on a sheet | its picture moves |
| Drag a corner | sized, the corner across stays; never stretched |
| Drag a side | cut off there, the rest stays in its place; pulled out, what was cut off comes back |
| Ctrl and the wheel | sized under the pointer; for a picture whose corners lie far outside the sheet |
| `Fill the calendar`, `Fit into it` | as small as covers calendar and bleed, as large as fits into the calendar; in the middle |
| `Turn`, `Mirror` | a quarter turn; left for right, top for bottom |
| Fields | middle, width, turn in degrees, cut off left, top, right, bottom in % of the file |
| Under the fields | the file's pixels, the size shown, pixels per inch; below 150 it says coarse |
| `Remove it` | the sheet's picture and its file are gone |

- The back sheet shows where every window opens, dashed; these lines are not cut and not printed.
- A picture file that says it lies turned (a phone's photo) is shown as it is meant.

Under the buttons: what is wrong, e.g. `The calendar lies in the printer's margin, where a print stays blank: right`, `The front picture leaves a part of the calendar blank`, `The back picture does not reach 2 mm over the calendar's edge all around`, `Windows 8 and 9 overlap`, `Window 24 lies on the logo`; printing and the files still work.

## Print

`Print front and back`: two pages, each the sheet of paper itself, its top left corner the page's; front, then back.

| On a page | Where | When |
|---|---|---|
| The sheet's picture | at the calendar's place, cut off bleed beyond its edge | `the pictures`, `pictures with cut lines` |
| The cutting file's lines | at the calendar's place, 0.2 wide in the files' colours | `cut lines only`, `pictures with cut lines`, and always on a sheet without a picture |
| Crop marks | 8 lines of 5 mm on the lines of the calendar's edges, starting 1 mm outside the bleed | `Crop marks and ruler line` |
| Ruler line | 200, 100, 50 or 20 mm, the longest the calendar has room for, 2 mm under the bleed, with its length and `front` or `back` beside it | the same |

- All of these lie outside the calendar or under the cuts, but for the picture: nothing of them stays on the calendar.
- Crop marks reach into the printer's margin where the calendar lies close to it; what the printer leaves out there is no loss.

## SVG

`Front SVG` → `advent_calendar_front_veryos.svg`, `Back SVG` → `advent_calendar_back_veryos.svg`. They hold cut lines only, no picture and no guides.

| id | Colour | Is | Do |
|---|---|---|---|
| `front_cut` | black | the doors' free edges, a line per piece between two bridges | cut |
| `front_fold` | blue | the hinges' dashes, a line each | cut |
| `back_mark` | black | the marks | cut; not there without `Marks on the back` |
| `back_logo` | grey | the logo's dots | cut, or delete |
| `front_outline`, `back_outline` | red | the calendar's edge, last in the file | cut |

- Size in mm at 1 : 1 (`width="277mm"`, viewBox in mm); lines 0.2 wide, no fills; every path carries its own `fill="none"`.
- Bridges, dashes and dots are real gaps between lines, not a `stroke-dasharray`: a cutter cuts the lines as drawn.
- All of a colour is one path: up to 3 paths per file.
- With the edge both files have the same box, the calendar: in the cutter's software they must measure the calendar's size, 277 × 190 by default. If not, type that size there for both.
- `<desc>` holds the settings as JSON: the calendar's place on the sheet, the windows' own values, the pictures' places.

## Cutter's software

The cutter's software is Bambu Suite, per the second brief. The app was not tried with it. From Bambu Lab's forum, users' reports and not checked:

| Report | Means here |
|---|---|
| An SVG square of 80 mm came in as 106.7 mm; the cause was not found ([forum](https://forum.bambulab.com/t/dimmension-error-bambu-suite/170615)) | check the file's size after import, before placing it |
| Objects were moved on the way to the "Prepare" stage unless attached ([forum](https://forum.bambulab.com/t/cutter-module-bambu-suite-frustration/191089)) | check the place again before cutting |
| "Print Then Cut": Suite makes a PDF with four marks to print, and the machine finds them on the mat; the cut area is 260 mm then instead of 300; a user printed outside Suite and lined up by hand, for the colours ([forum](https://forum.bambulab.com/t/any-way-to-use-registration-marks-without-using-print-then-cut/198886)) | another way to the same end; this app goes by distances instead |
| The paper's thickness is not used for the knife, the pressure is; a material's test cut sets it ([forum](https://forum.bambulab.com/t/cutter-module-bambu-suite-frustration/191089)) | 250 g card needs its own test |

Not found: where Suite's zero lies and which point of a file its X and Y mean. The app therefore names all four distances.

## Logo

| | |
|---|---|
| Where | back sheet, bottom right as seen from the front, 4 mm from both edges, 12 × 8.5 mm |
| How | the outlines as 40 dots of 1 mm, 0.6 apart: nothing falls out. Mirrored, so it reads from behind |
| Front sheet | none: its only free face is the show face |

## Checks

| Check | How | Result |
|---|---|---|
| Doors, grid, logo, cutting files | `deno task test`, `calendar.test.js`: every shape with every door in 6 sizes and 4 cut settings; grid, mix, a window's own values; the logo; both SVGs read back by a path reader written after the SVG specification; the box around a file's lines | 129 pass |
| Pictures | same, `picture.test.js`: fitted into and over boxes, sized by every corner and around a point, cut off at every side by number and by the pointer, lying straight, turned and mirrored: a pixel of the file that stays in the picture stays where it is, and the SVG puts it there too | 9 pass |
| Sheet | same, `sheet.test.js`: the calendar's place from the bottom left corner; the print's lines are the cutting file's own, at the place the file's box has for the cutter; crop marks, ruler line, what is said | 7 pass |
| Tests notice faults | 26 faults put into copies of the three modules one at a time (a sign, a swapped side, a missing clamp, the place measured from the top, ...); 12 more in the first version's module | each fails a test |
| Print, measured | headless Chrome's PDF at 300 dots per inch, one-coloured test picture. A4 lying, calendar 277 × 190 at 10 / 10: picture with 2 of bleed expected 8 to 289 and 8 to 202 mm from the page's top left | 8.04 to 288.97, 7.96 to 202.01; the same on page 2 |
| | the calendar's edge with `pictures with cut lines`, 0.2 wide, expected 9.9 to 287.1 and 9.9 to 200.1 | 9.91 to 287.1, 9.91 to 200.07 |
| | shift 1.5 right, 2.5 up: expected 9.5 to 290.5, 5.5 to 199.5 | 9.48 to 290.49, 5.42 to 199.56 |
| | A4 standing, calendar 150 × 200 at 12.5 / 30: edge expected 12.4 to 162.6, 66.9 to 267.1 | 12.36 to 162.56, 66.89 to 267.12 |
| | what is on a page: no cut lines on a picture, no picture with `cut lines only`, crop marks from 2 to 295 mm, nothing but the picture without guides and bleed; always 2 pages of the sheet's size | as expected |
| Page | headless Chrome: Chrome's own boxes of the drawn lines and pictures against the modules'; windows chosen and dragged; a picture loaded, dragged, sized by a corner, cut off at a side, sized by Ctrl and wheel, turned, mirrored, fitted, set by fields; a file that is no picture; both pictures and their files after a reload; zoom; both downloads; remove; start over; 400 px wide | 68 checks pass with the print's, no errors |
| A turned photo | a JPEG of 400 × 200 that says it lies turned | shown 200 × 400 with its corner where it belongs, by a screenshot |
| Not checked | a print on paper; a cut; the files in Bambu Suite; Firefox; a touch screen; a picture of 20 megapixels and more | |

- Chrome's PDF of an A4 page is 297.01 × 209.89 mm, 0.11 short in height; places are reckoned from the top left corner, so a sheet's bottom edge may be off by that much.

## Open

| | |
|---|---|
| Printer | how exactly it places a page on the sheet, and whether it keeps the size along the paper's way, is not known: the trial of step 3 to 5 shows it. A printer that stretches the page is not made up for, only shifted |
| Cutter | where the sheet's corner lies for it, how it reads the SVG's size, and how well a sheet is laid on the mat by hand: see Cutter's software |
| Bridge 0.5, a bridge every 25 | guessed from the photo in `reference/` (4 bridges on a door of about 35); a drag knife may cut them shorter or longer than drawn. Try one window first: number 1, calendar 60 × 60 |
| Fold dash 3 / gap 2 | read off the same photo; untried in 250 g card |
| Sheet on sheet | both sheets get the calendar's edge cut, so they are the same size; how well the back's pictures sit behind the doors depends on print and cut of both sheets |
| Glue | where not to glue is not in the files |
| Layout and pictures | kept in the browser only; the SVGs hold the settings in `<desc>`, but the app cannot open them |
| Calendar's size | the first brief said "A4 290x210mm"; the second asks for less than the printer prints: 277 × 190 now |
| `idea_veryos.jpeg`, `reference/`, `software_improvements_decoration_drawing/image.png` | the two sketches and a photo of a bought calendar, not in git |

## Decisions

| Chosen | Instead of |
|---|---|
| Print and cut meet by distances from the sheet's bottom left corner, as the brief asks | printed marks a camera finds, Bambu Suite's own Print Then Cut |
| The print's page is the sheet of paper, the picture at its place on it | a picture file of the calendar's size, placed by the print dialog |
| A trial print of the cut lines and a shift in mm | trust in printer and cutter |
| Bleed, crop marks and a ruler line outside the calendar | a picture that ends at the edge, and no way to see a scaled print |
| A picture per sheet, front and back | the front alone |
| A picture is moved, sized, turned, mirrored and cut off, never stretched | free transforms |
| The files' own box named for the cutter's software | the calendar's place alone, wrong for a file without the edge |
| Windows in a grid, single ones moved or changed by hand | free placement only, or a random scatter |
| Shapes and doors dealt out evenly by a seed | set per window only |
| Hinge on a round side moved in to half the side's length | a hinge of a point's length on the circle |
| Bridges by distance along the edge | a fixed number per door, which would not grow with the door |
| Fold dashes fitted to each hinge | fixed dashes with a leftover at the ends |
| Marks: corners and curve dashes only | the whole outline dashed, more cuts through the picture |
| Logo in dots on the back | a filled logo, which a cutter would cut out with its islands |
| One path per colour | a path per window or per line |
