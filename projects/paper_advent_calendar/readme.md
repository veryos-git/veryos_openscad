# Paper advent calendar

A webapp for a paper advent calendar of two sheets of card: it makes the cutting files, a front sheet with the windows' doors and a back sheet behind it, and prints a picture on each sheet at the very place the cuts will fall. Goals: `readme_hgc.md` with the sketch `idea_veryos.jpeg`, and `software_improvements_decoration_drawing/readme_hgc.md` for print and cut. **Nothing is printed on paper or cut yet: bridge, fold and mark sizes and the fit of print and cut are untried.**

![the app at step 3, Picture: a test picture on the front sheet, the pointer moves it](preview.png)

| Start | |
|---|---|
| `deno task start` in `paper_advent_calendar/`, then http://127.0.0.1:8778 | the app; reachable from this computer only |
| `deno task start 8779` | on another port |
| `deno task test` | the checks of the geometry, see Checks |
| `deno task check` | the checks of the page in headless Chrome, on port 8779; needs `google-chrome` and `pdftoppm`. `deno task check .` also saves `preview.png` and `match.png` anew |

Needs [Deno](https://deno.com) and a browser. The page does all the work itself; `webapp/` runs from any static web server. Settings and pictures stay in the browser (local storage, IndexedDB): a reload keeps them, another browser does not have them.

## Page

| Part | Shows |
|---|---|
| Bar on top | the five steps; any step opens at any time, `Next` at a step's end leads on; a step with a field that is wrong is marked orange. `Start over` |
| Left | the settings of the open step alone; under them, always in view, what is wrong |
| Right | one sheet, as large as fits. Above it: `Front` / `Back`; zoom `Fit`, `2 ×`, `4 ×`, what was in the middle stays there; `Line colours`, the legend |

| Step | Settings | The pointer on the sheet |
|---|---|---|
| 1 Paper | the sheet of paper, the calendar's size and place on it | moves nothing |
| 2 Windows | grid, shapes and doors, one window's own values | chooses and moves windows |
| 3 Picture | the picture of the sheet shown: load, place, size, turn, stretch, skew, crop, match | moves, sizes and turns the picture; a side crops, stretches or skews it |
| 4 Cuts | bridges, folds, marks, logo, calendar's edge, paper's corners | moves nothing |
| 5 Print and cut | what is printed, bleed, guides, shift; `Print front and back`; the print's pages as PDF and PNG files; `Front SVG`, `Back SVG` | moves nothing |

- The step and the sheet shown are kept over a reload, like the settings.
- A name with a dotted line under it says more when the pointer rests on it.
- A window narrower than 760 pixels: the sheet on top, the settings under it.

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

1. Step 1, Paper: the sheet of paper, the calendar's size and its distance from the sheet's left and bottom edge. The calendar lies inside the printer's margin, the dashed frame.
2. Step 3, Picture: load a picture for the front, and one for the back. Move the picture under the windows there, the windows onto the picture in step 2, or lay the picture by four points, see Match by four points.
3. Step 5, Print and cut. Trial: print `Cut lines only` on plain paper. Lay a ruler on the ruler line under the calendar: 200 mm must be 200 mm.
4. In the cutter's software lay `Front SVG` on the sheet corner on corner: with a dot in each corner of the paper the file is as large as the sheet, 297 × 210 by default, and the calendar lies in it where the print has it. Lay the trial sheet on the mat where the software has the sheet, and cut. Without the dots, place the file at the distances the app names under the two SVG buttons.
5. Where the knife runs beside the printed lines, measure how far and enter it as `Shift right` and `Shift up`; print and cut again until it fits.
6. Print `The pictures` on card: page 1 the front, page 2 the back. Cut each with its file, at the same distances.
7. Glue the front on the back, edge on edge; no glue behind the doors.

| Print dialog | |
|---|---|
| Paper size | the sheet's, as set in the app |
| Scale | 100 %, not "fit to page"; nor in the printer's own settings |
| Margins | none |

## Settings

| 1 Paper | Default | Range | Does |
|---|---|---|---|
| Format | A4 landscape | A4, A3 and Letter, landscape and portrait | sets the sheet's size and nothing else; `Own size` where the size is none of them |
| Size, of the sheet of paper | 297 × 210 mm | 50 to 1500 | the paper a sheet of the calendar is printed on and cut from, width × height |
| Printer's margin | 5 mm | 0 to 50 | the border a printer leaves blank, drawn dashed; said when the calendar lies in it |
| Size, of the calendar | 277 × 190 mm | 50 to 1000 | both sheets of the calendar; 10 mm less than A4 all around |
| From the sheet's left, from its bottom | 10, 10 mm | 0 to 1500 | where the calendar lies on the sheet; below them what that leaves to the sheet's right edge and to its top |

| 2 Windows | Default | Range | Does |
|---|---|---|---|
| Number | 24 | 1 to 100 | windows |
| Columns | 6 | 1 to 20 | windows in a row; rows = number / columns, rounded up; a last row that is not full stands in the middle |
| Margin | 15 mm | 0 to about half the calendar's shorter side | from the calendar's edge to the field the windows are spread over; each window in the middle of its cell |
| Size | 32 × 32 mm | 5 to 300 | every window's width × height; below the grid's fields the number of rows and the distance from one window to the next |
| Corner radius | 2 mm | 0 to 50 | a rectangle's corners and an arch's foot; a corner a hinge ends in stays sharp |
| Shapes | all three | one at least | which shapes occur, each about as often as the others |
| Doors | left, right, double | one at least | which hinge sides occur, likewise |
| Shuffle | | | deals them out anew |

| 4 Cuts | Default | Range | Does |
|---|---|---|---|
| Bridge | 0.5 mm | 0 to 5 | width of a bridge; 0: none |
| A bridge every | 25 mm | 2 to 500 | per stretch of a free edge between two corners: length / this, rounded, one at least, spread evenly; none on a stretch under 4 bridges long |
| Fold dash | 3 mm | 0.2 to 50 | cut dashes of a hinge; fitted to the hinge's length, so they come out a little longer or shorter |
| Fold gap | 2 mm | 0.2 to 50 | uncut between the dashes and at both ends of a hinge; below it the number of bridges in all |
| Marks on the back | on | | short cuts that show where the windows open, for pictures drawn by hand; off for a printed back, they would cut into the picture (said when both are there) |
| Mark's length | 3 mm | 0.5 to 20 | length of the marks; grey without them |
| VeryOS logo on the back | on | | see Logo |
| Calendar's edge in the files | on | | a red rectangle of the calendar's size in both SVGs: the cut that takes the calendar out of the sheet |
| Paper's corners in the files | on | | a dot in each corner of the sheet of paper, a slanted cut of 0.2 mm into the sheet. With them a file is the sheet: as large, the calendar at its place in it, and laid on the sheet corner on corner in the cutter's software. Without them a file is the calendar with its edge, or as large as its cuts without, and placed by the distances the app names in step 5 |

| 5 Print and cut | Default | Range | Does |
|---|---|---|---|
| What is printed | The pictures | Pictures with cut lines, Cut lines only | what a sheet with a picture shows; a sheet without one always shows its cut lines |
| Bleed | 2 mm | 0 to 20 | the picture is printed this far over the calendar's edge: a cut a little beside the edge shows no white |
| Crop marks and ruler line | on | | outside the calendar, see Print |
| Shift right, shift up | 0, 0 mm | -20 to 20 | moves the whole print on its page, to make up for where printer and cutter put it |
| `Print front and back` | | | see Print; below it what to set in the print dialog, with the sheet's size |
| `Front PDF`, `Back PDF`, `Front PNG`, `Back PNG` | | | see Print files; below them the files' size in mm and pixels |
| `Front SVG`, `Back SVG` | | | see SVG; below them each file's size and place for the cutter's software |

Step 3, Picture: see Windows and pictures on the sheet. `Start over`, in the bar on top: all settings as at the first start, the pictures removed, step 1.

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

## Windows and pictures on the sheet

What the pointer moves follows the step that is open: windows in step 2, the picture of the sheet shown in step 3, nothing in the others.

| Step 2, Windows | Result |
|---|---|
| Click a window, on the front or the back sheet | chosen: its fields come into view, with it close up in the lines' real width and its middle, size, shape and door |
| Drag it | moved, in steps of 0.5 mm; the other sheet has it there too |
| Change a field | that window alone gets the value |
| `Back to the grid` | it drops what it has of its own |
| Change a setting of the grid | windows keep what they have of their own; the rest follows the grid |

| Step 3, Picture | Result |
|---|---|
| `Front sheet`, `Back sheet` | the sheet whose picture is worked on; the same choice as `Front` / `Back` above the sheet. A dot marks a sheet that has a picture |
| `Load a picture`, `Load another` | any picture file the browser shows; it fills the calendar and its bleed. A file that is no picture is said, the picture stays |
| Under the two buttons | the file's pixels, the size shown, pixels per inch; below 150 it says coarse. Stretched: `at least`, the number of the way it is stretched more |
| Drag on the sheet | its picture moves |
| Drag a corner | sized, the corner across stays, and its shape as it is |
| `Drag a side to` | what a drag of a side's handle does: `Crop`, `Stretch` or `Skew`. A handle says what it does when the pointer rests on it |
| Drag a side, `Crop` | cropped there, the rest stays in its place; pulled out, what was cut off comes back |
| Drag a side, `Stretch` | the side follows the pointer, the side across stays: stretched or pressed, nothing cut off |
| Drag a side, `Skew` | the side slides along itself, the side across stays. Top or bottom: the upright sides lean, which is `Skew`. Left or right: top and bottom lean, which in the fields is a turn, a skew against it and another size |
| Drag the ring at its top | turned around its middle, by as much as the pointer goes around the middle: the further from it, the finer. For a picture that lies a little askew |
| A handle that sits out of view | drawn where the view ends: a corner's as near to the corner as that is, a side's on the part of its side that is in view. Taken there it does the same, by what the pointer moves. So with a picture larger than the sheet, and with a zoomed sheet |
| Ctrl and the wheel | sized under the pointer |
| `Fill`, `Fit` | as small as covers calendar and bleed, as large as fits into the calendar; in the middle, in the shape it has |
| `Stretch` | stretched over calendar and bleed: all of it shows, out of its shape. A turned or skewed picture is stretched along its own two directions until it covers them |
| The four buttons beside them | a quarter turn against and with the clock; mirrored left for right, top for bottom |
| `Middle`, `Width`, `Turned` | the picture's middle from the calendar's left and top edge, its width, its turn in degrees: any number, 0.5 for a slight turn |
| `Height`, `Skew` | its height in % of what its width and its file's shape give, 5 to 2000, the width stays; the lean of its upright sides in degrees, to the right at the top, -80 to 80. 100 % and 0 °: the shape its file has |
| `Crop, %` | how much of the file is cut off at its top, left, right and bottom, the four fields laid out as the sides lie |
| `Match 4 points to the cut pattern` | see Match by four points |
| `Remove it` | the sheet's picture and its file are gone |

- The back sheet shows where every window opens, dashed; these lines are not cut and not printed.
- A picture file that says it lies turned (a phone's photo) is shown as it is meant.

Under the settings: what is wrong, e.g. `The calendar lies in the printer's margin, where a print stays blank: right`, `The front picture leaves a part of the calendar blank`, `The back picture does not reach 2 mm over the calendar's edge all around`, `Windows 8 and 9 overlap`, `Window 24 lies on the logo`; printing and the files still work.

## Match by four points

Four points of the picture are laid on four places of the cut pattern, and the rest of the picture follows as a flat sheet seen at a slant does: straight lines stay straight. A photo of a drawing taken at a slant is put right that way.

![the mode with three of four places clicked: gold the picture's points, white their places](match.png)

| Step | |
|---|---|
| `Match 4 points to the cut pattern` | the picture is fitted into the calendar, all of it in view; a bar over the sheet says what to click; the sheet shown stays until the match is done or left |
| 4 clicks on the picture | its points, numbered in gold; the cut lines step back. A click beside the picture is no point |
| 4 clicks on the cut pattern | the place of point 1, then of 2, 3 and 4, numbered in white, a dashed line from each point to its place; the picture steps back |
| With the fourth place | the picture is laid anew, the mode is left |
| `One point back`, `Cancel` in that bar, or Esc | the last click undone; the picture as it was before the mode |
| `Undo the match` | afterwards: the picture and its place as before; until another picture is loaded or the page is left |

| Rule | |
|---|---|
| Snap | a place within 8 pixels of the screen of one of the pattern's places goes there: the calendar's corners and middle, every window's middle, the corners of its box, and where its opening's edge goes from one line or curve to the next. Alt: just where it is clicked |
| Ring | where the next click would land |
| Order | the places in the order of the points. Else the picture would fold over on the calendar: said, nothing laid |
| Three on a line | of the points or of the places: said, nothing laid |
| Result | a new picture file over the calendar and its bleed, in place of the old one: as fine as the old picture comes to lie in the calendar's middle, between 100 and 300 pixels per inch; clear where the old picture ends, which is said. It is a picture like any other: moved, sized, printed, matched again |
| What is cut off, turned, mirrored before | stays so: the points are taken from the picture as it is shown |

- Zoom in before clicking: a point is as exact as the click.
- Every match lays the pixels anew once; a second match of the result softens it a little more than one match of the first file would.

## Print

`Print front and back`: two pages, each the sheet of paper itself, its top left corner the page's; front, then back.

| On a page | Where | When |
|---|---|---|
| The sheet's picture | at the calendar's place, cut off bleed beyond its edge | `The pictures`, `Pictures with cut lines` |
| The cutting file's lines | at the calendar's place, 0.2 wide in the files' colours | `Cut lines only`, `Pictures with cut lines`, and always on a sheet without a picture |
| Crop marks | 8 lines of 5 mm on the lines of the calendar's edges, starting 1 mm outside the bleed | `Crop marks and ruler line` |
| Ruler line | 200, 100, 50 or 20 mm, the longest the calendar has room for, 2 mm under the bleed, with its length and `front` or `back` beside it | the same |

- All of these lie outside the calendar or under the cuts, but for the picture: nothing of them stays on the calendar.
- Crop marks reach into the printer's margin where the calendar lies close to it; what the printer leaves out there is no loss.

## Print files

`Front PDF`, `Back PDF`, `Front PNG`, `Back PNG` → `advent_calendar_front_veryos.pdf` and so on: one sheet's page of the print as a file, to print from another program or to send on.

| | |
|---|---|
| Shows | what the print shows of that sheet: as chosen under `What is printed`, with bleed, guides and shift; a sheet without a picture its cut lines |
| Size | the sheet of paper, as one picture at 300 pixels per inch: A4 is 3508 × 2480. A sheet longer than 693 mm: 8192 pixels along its longer side, fewer per inch; the note under the buttons says the numbers |
| PDF | one page of the sheet's size, the picture on all of it, packed without loss; print it at 100 %, without margins |
| PNG | the same pixels; the file says its pixels per metre (`pHYs`), which a program may read or not: where it does not, set 300 per inch or the sheet's size there |
| The picture | laid anew in pixels as it lies on the sheet: turned, stretched, skewed, cropped; its own file is not in the PDF |

## SVG

`Front SVG` → `advent_calendar_front_veryos.svg`, `Back SVG` → `advent_calendar_back_veryos.svg`. They hold cut lines only, no picture and no guides.

| id | Colour | Is | Do |
|---|---|---|---|
| `front_cut` | black | the doors' free edges, a line per piece between two bridges | cut |
| `front_fold` | blue | the hinges' dashes, a line each | cut |
| `back_mark` | black | the marks | cut; not there without `Marks on the back` |
| `back_logo` | grey | the logo's dots | cut, or delete |
| `front_outline`, `back_outline` | red | the calendar's edge, last in the file | cut |
| `front_sheet`, `back_sheet` | green | the dots in the paper's corners, first in the file: from each corner 0.2 mm along x and y into the sheet | cut: a nick in the corner of what is cut off anyway |

- Size in mm at 1 : 1, with the paper's corners the sheet's (`width="297mm"`, viewBox in mm, the calendar's lines moved to its place), without them the calendar's; lines 0.2 wide, no fills; every path carries its own `fill="none"`, and no group moves anything.
- Bridges, dashes and dots are real gaps between lines, not a `stroke-dasharray`: a cutter cuts the lines as drawn.
- All of a colour is one path: up to 4 paths per file.
- With the paper's corners both files have the same box, the sheet: in the cutter's software they must measure the sheet's size, 297 × 210 by default. If not, type that size there for both. The dots end exactly in the corners, nothing reaches over the sheet.
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
| Doors, grid, logo, cutting files | `deno task test`, 171 in all; `calendar.test.js`: every shape with every door in 6 sizes and 4 cut settings; grid, mix, a window's own values; the logo; both SVGs read back by a path reader written after the SVG specification; the box around a file's lines, which with the paper's corners is the sheet to the last digit | 138 pass |
| Pictures | same, `picture.test.js`: fitted into and over boxes, stretched over them, sized by every corner and around a point, cut off at every side by number and by the pointer, stretched and skewed by every side, lying straight, turned, mirrored, stretched and skewed: a pixel of the file that stays in the picture stays where it is, and the SVG puts it there too; a side stretched or slid leaves the side across and what the file shows there in place, a slid side's ends go as far as the pointer, and no further than leaves the sides 10° apart; the handles of a picture in view only in part lie in the view, eight apart; turned by the pointer, every pixel goes around the middle by as much as the pointer | 15 pass |
| Match | same, `match.test.js`: the mapping takes each of four points to its place within 0.000000001 mm, and a known slant is found again from four of its points; fours that cannot be matched; the pattern's places and the snap; pixels laid anew show the colour of the place they come from, to a step of 255, straight and at a slant, and a clear pixel gives no colour | 7 pass |
| Sheet | same, `sheet.test.js`: the calendar's place from the bottom left corner; the print's lines are the cutting file's own, at the place the file's box has for the cutter; crop marks, ruler line, what is said; a page of the print as an SVG of its own shows what the print shows for each of the three choices, with and without a picture | 8 pass |
| Print files | same, `file.test.js`: the PNG's check sum against known ones and against one counted bit by bit; the chunk with the size sits behind the first, every chunk's sum is right, the rest is unchanged; the PDF's table names where each part starts, A4 is 841.89 × 595.276 points, the pixels unpack to what went in | 3 pass |
| Tests notice faults | 42 faults put into copies of the four modules one at a time (a sign, a swapped side, a missing clamp, the place measured from the top, a mapping put together the wrong way round, ...); 12 more in the first version's module. Done before the paper's corners came into the files, not since | each failed a test |
| Page | `deno task check`, `test/page_check.js`: headless Chrome, 1500 × 950, clicked and dragged with Chrome's own pointer, 161 checks in all with the print's, the files' and the match's below. Every step shows its settings alone and `Next` leads on; every setting has a field; the sheet fits its place, 20 pixels and more around it, at 1500 × 950, 1100 × 700, 800 × 600, A4 portrait and under the bar of a match; zoom 2 and 4 keep the view's middle; 400 wide: the sheet over the settings, nothing wider than the window; step and sheet kept over a reload; the legend; a field that is wrong in another step is said with its step and marks it, no print and no files meanwhile; shapes and doors by their chips | pass, no errors in the page |
| | windows: none to take hold of in step 1; chosen, dragged in steps of 0.5 mm, its fields brought into view in a low window, chosen on the back sheet too, own size, shape and door, `Back to the grid`; Chrome's box of the close-up's lines is the window's, of the back's opening the module's | pass |
| | pictures: loaded, dragged, sized by a corner, cropped at a side, sized by Ctrl and wheel, turned, mirrored, fitted, set by fields; the ring at its top dragged 6 pixels turns it as far as the pointer went around its middle, between 0.5 and 3°; Chrome's box of the drawn picture; the nine handles of a picture of 900 × 600 mm, and of a sheet at zoom 4 moved in its place, each whole in the view, apart from the others and the thing under the pointer there, and a corner taken at such a place sizes by what the pointer moves; `Stretch` makes it 281 × 194 mm; a side dragged with `Stretch` moves that side alone, with `Skew` slides it, top and right, and Chrome's box of the picture is the one reckoned from its place; a skew of 85° is said and not taken; `Height` 100 and `Skew` 0 bring the file's shape back; a place kept without stretch and skew is read as neither; a file that is no picture; a drag in step 2 leaves the picture alone; the back's picture by the panel's choice of sheet; both pictures and their files after a reload; marks and logo switched off; remove; start over; both downloads are the files the module makes of the page's settings | pass |
| Print, measured | the same run: Chrome's PDF at 300 dots per inch, one-coloured test picture on the front. A4 landscape, calendar 277 × 190 at 10 / 10: picture with 2 of bleed expected 8 to 289 and 8 to 202 mm from the page's top left | 8.04 to 288.97, 7.96 to 202.01 |
| | the calendar's edge, 0.2 wide, on page 2 without a picture and with `Pictures with cut lines` on page 1, expected 9.9 to 287.1 and 9.9 to 200.1 | 9.91 to 287.1, 9.91 to 200.07 |
| | shift 1.5 right, 2.5 up: expected 9.5 to 290.5, 5.5 to 199.5 | 9.48 to 290.49, 5.42 to 199.56 |
| | A4 portrait, calendar 150 × 200 at 12.5 / 30: edge expected 12.4 to 162.6, 66.9 to 267.1 | 12.36 to 162.56, 66.89 to 267.12 |
| | a picture 100 wide, `Height` 150 %, `Skew` 20°, around 148.5 / 105 of the sheet: expected 80.3 to 216.7 and 55 to 155; in the row 60 from the top 114.9 to 214.9, in the row at 150 82.1 to 182.1: it leans to the right at the top | 80.35 to 216.66, 55.03 to 154.94; 114.89 to 214.8; 82.13 to 182.03 |
| | what is on a page: no cut lines on a picture, no picture with `Cut lines only`, crop marks from 2 to 295 mm, nothing but the picture without guides and bleed; always 2 pages of the sheet's size | as expected |
| Print files, measured | the same run, the files the buttons hand over: the PDF read by `pdftoppm` at 300 dots per inch, the PNG by a reader written after the PNG specification. Both 3508 × 2480, the PDF one page of A4, the PNG says 11811 pixels per metre. The picture expected 8 to 289 and 8 to 202 | PDF 8.04 to 288.97, 8.04 to 202.01; PNG 8.04 to 288.97, 8.04 to 201.93; each within 0.1 of the print's |
| | the back without a picture: its cut lines, the edge expected 9.9 to 287.1 and 9.9 to 200.1 | PDF 9.91 to 287.1, 9.91 to 200.15; PNG 9.91 to 287.1, 9.91 to 200.07 |
| | `Pictures with cut lines` and a shift of 1.5 / 2.5: picture and edge moved as in the print; `Cut lines only`: no picture | as expected |
| | a JPEG of 1200 × 600 that says it lies turned (Exif orientation 6): taken as 600 × 1200, its first corner top right in the print, in the PDF and in the PNG | as expected, within 0.5 mm |
| | a sheet of 1500 × 1000 mm: the PNG is 8192 × 5461 and says 5461 pixels per metre | as expected |
| Match, measured | the same run: a drawing of the calendar, 277 × 190 mm with two coloured squares, as a "photo" of 3000 × 2200 pixels taken at a slant; its four corners clicked, then the calendar's corners, each 1.5 mm beside it. The magenta square, drawn from 100 to 120 and 50 to 70 mm | in the new picture 99.94 to 120 and 49.96 to 70.02; in the print's PDF, 10 mm further on the sheet, 109.98 to 129.96 and 59.94 to 80.01 |
| | the bar over the sheet, the sheet's choice locked; a click beside the picture, one point back, the ring on the corner and with Alt beside it, places in the wrong order, three points on a line, cancel by button and Esc, undo | as described above |
| Before the page was laid out in steps, not since | a match laid with Alt; a matched picture after a reload; a picture that ends on the calendar; the box Chrome draws around all of a file's lines | passed then, 72 and 24 checks by scripts that are not kept |
| Not checked | a print on paper; a cut; the files in Bambu Suite; Firefox; a touch screen; a picture of 20 megapixels and more; the print files made in another browser than Chrome, printed, or opened in Bambu Suite | |

- Chrome's PDF of an A4 page is 297.01 × 209.89 mm, 0.11 short in height; places are reckoned from the top left corner, so a sheet's bottom edge may be off by that much.

## Open

| | |
|---|---|
| Printer | how exactly it places a page on the sheet, and whether it keeps the size along the paper's way, is not known: the trial of step 3 to 5 shows it. A printer that stretches the page is not made up for, only shifted |
| Cutter | where the sheet's corner lies for it, how it reads the SVG's size, and how well a sheet is laid on the mat by hand: see Cutter's software |
| Paper's corners | whether the cutter takes a cut that starts in the very corner of the sheet, at the edge of what it reaches, is untried; if not, switch them off and place the files by distances |
| Bridge 0.5, a bridge every 25 | guessed from the photo in `reference/` (4 bridges on a door of about 35); a drag knife may cut them shorter or longer than drawn. Try one window first: number 1, calendar 60 × 60 |
| Fold dash 3 / gap 2 | read off the same photo; untried in 250 g card |
| Sheet on sheet | both sheets get the calendar's edge cut, so they are the same size; how well the back's pictures sit behind the doors depends on print and cut of both sheets |
| Glue | where not to glue is not in the files |
| Layout and pictures | kept in the browser only; the SVGs hold the settings in `<desc>`, but the app cannot open them |
| Print files | the browser draws the page from an SVG with the picture inside it; Chrome does, other browsers are untried. Whether the program a PNG goes to reads its size is not known for any |
| Picture by handles | nothing is taken back but by hand: `Height` 100 and `Skew` 0 for the file's shape, `Turned` 0, `Crop` 0. Cropping a skewed picture cuts along its leaning sides |
| Match | the points are clicked once and not dragged afterwards: one point back, or match the result again. The old file is gone with the page, the four points with the match |
| Calendar's size | the first brief said "A4 290x210mm"; the second asks for less than the printer prints: 277 × 190 now |
| `idea_veryos.jpeg`, `reference/`, `software_improvements_decoration_drawing/image.png` | the two sketches and a photo of a bought calendar, not in git |

## Decisions

| Chosen | Instead of |
|---|---|
| One step's settings at a time, five steps in the order of the work | all settings in one long list, print and files at its end |
| What the pointer moves follows the step: windows in step 2, the picture in step 3 | a switch above the sheets |
| One sheet at a time, as large as fits, `Front` / `Back` above it | both sheets one under the other |
| What is wrong under the settings, always in view | at the end of the list; nor under the sheet, where words coming and going would move the sheet under a drag |
| A match's next click named in a bar over the sheet | in the panel, away from where the clicks go |
| Print and cut meet by the sheet's corners: the print's page and the cutting file are both the sheet | printed marks a camera finds, Bambu Suite's own Print Then Cut |
| A dot in each corner of the paper makes a file the sheet's size | a file of the calendar's size placed by typed distances: still there with the dots off |
| The dots run from the corners into the sheet | a round dot on each corner: half of it would lie beside the paper and make the file larger than the sheet |
| The print's page is the sheet of paper, the picture at its place on it | a picture file of the calendar's size, placed by the print dialog |
| A trial print of the cut lines and a shift in mm | trust in printer and cutter |
| A print file is the print's page: the sheet of paper with the picture at its place | the picture alone, as large as the calendar: it would have to be placed by hand again where it is printed |
| A print file is one picture of the page at 300 pixels per inch, PDF and PNG the same pixels, without loss | a PDF with the picture's own file and drawn lines, which the browser's print dialog already gives as "Save as PDF" |
| A file per sheet | front and back as two pages of one PDF: the two are printed on two sheets of card |
| Bleed, crop marks and a ruler line outside the calendar | a picture that ends at the edge, and no way to see a scaled print |
| A picture per sheet, front and back | the front alone |
| A side's handle crops, stretches or skews, as chosen in the panel | one meaning only, or a key held for the others |
| Stretch and skew are two numbers of the picture's place, drawn by the browser | pixels laid anew, as a match does: the numbers can be taken back, and the file stays as sharp as it is |
| One skew, of the upright sides; a left or right side slid becomes a turn, a skew and a size | a second skew for top and bottom: the two together can press a picture flat to a line |
| The ring turns freely, to hundredths of a degree | a snap to 0 or to quarter turns, in the way of a slight turn; straight again is 0 in `Turned` |
| A picture's handle that sits out of view is drawn where the view ends | handles cut off 20 pixels around the sheet: a picture larger than the sheet had none to size it by |
| A match makes a new picture file, laid pixel by pixel | a slant kept as numbers and drawn by the browser: an SVG has no such transform, and a print should not depend on a trick |
| The places of a match snap to the cut pattern | places by eye alone, never quite on a corner |
| The files' own box named for the cutter's software | the calendar's place alone, wrong for a file without the edge |
| Windows in a grid, single ones moved or changed by hand | free placement only, or a random scatter |
| Shapes and doors dealt out evenly by a seed | set per window only |
| Hinge on a round side moved in to half the side's length | a hinge of a point's length on the circle |
| Bridges by distance along the edge | a fixed number per door, which would not grow with the door |
| Fold dashes fitted to each hinge | fixed dashes with a leftover at the ends |
| Marks: corners and curve dashes only | the whole outline dashed, more cuts through the picture |
| Logo in dots on the back | a filled logo, which a cutter would cut out with its islands |
| One path per colour | a path per window or per line |
