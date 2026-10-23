# Parametric BIC Maxi J26 Lighter Case With Seven Exterior Patterns

A slim elliptical sleeve for a full-size BIC Maxi (J26) lighter, with editable OpenSCAD dimensions and seven raised exterior patterns. The lighter drops in from the top; a finger hole in the floor lets you push it back out.

The script is built around the inner cavity: the lighter's width and depth plus a fit clearance per side. The wall, floor and pattern are added outside that cavity, so changing the pattern never changes the fit.

Choose a smooth case, fine ribs, broad flutes, spiral ribs, a diamond knurl, wavy ribs or chevrons, then tune the relief depth, repeat count, vertical pitch and spiral twist. Repeats are spaced by distance around the ellipse, so the texture does not bunch up at the narrow ends, and the relief fades into smooth bands at both ends.

## Features

- Cavity set by the lighter size plus an adjustable fit clearance.
- Seven exterior patterns: smooth, ribs, flutes, spiral, diamond, waves and chevron.
- Adjustable relief depth, repeat count, end margins, vertical pitch and spiral twist.
- Finger push-out hole in the floor.
- Lead-in chamfer at the mouth and 45° chamfers on the outer edges.
- All-patterns layout for printing a comparison set.
- Standalone OpenSCAD source with no external libraries.

## Included model defaults

| Setting | Value |
| --- | --- |
| Lighter size (BIC Maxi J26) | 25 × 14.5 mm |
| Fit clearance per side | 0.25 mm |
| Cavity | 25.5 × 15 mm, 68.9 mm deep |
| Wall and floor thickness | 1 mm and 2 mm |
| Case height | 70.9 mm |
| Outside, smooth | 27.5 × 17 mm |
| Outside, with pattern relief | 28.7 × 18.2 mm |
| Default pattern | ribs |
| Pattern depth | 0.6 mm |
| Pattern count | 24, about 2.95 mm apart |
| Smooth end bands | 1 mm |
| Vertical pitch (diamond, waves, chevron) | 10 mm |
| Spiral twist | 90° |
| Mouth lead-in and edge chamfer | 0.4 mm each |
| Push-out hole | 12 mm |

One STL per pattern is included, all at these default settings.

## Print and customize

Print each case upright on its flat bottom, open end up; no supports are needed. Open the SCAD file to pick a pattern and adjust the fit in the Customizer, render with F6 and export the STL. Set `part = "all_patterns"` to lay out all seven cases side by side.

The fit clearance decides whether the lighter slides in and holds: 0.25 mm is snug, 0.4 mm standard and 0.6 mm loose. Fit depends on the printer and material, so print one case to check it before printing a set. Annotated views are digital renders; colors are illustrative.

## Tags

lighter case, BIC, BIC Maxi, J26, lighter sleeve, lighter holder, lighter cover, parametric, OpenSCAD, customizable, textured, knurled, ribbed, spiral, pattern, everyday carry, EDC, 3D printable, maker

## License

GNU GPL version 2. See the included LICENSE file.

BIC and Maxi are trademarks of Société BIC. This is an independent design, named for compatibility only, and is not affiliated with or endorsed by BIC.
