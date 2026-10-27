This is a simple demonstrative object of the VeryOS brand. 
VeryOS stands for Very Open Source and highlights the phylosophy of sharing knowledge with everybody to improve well being and technical advancement for everybody!

the project is a simple 2d extrusion of the veryos logo. at the bottom of the logo there is the logo also 'engraved'

![preview](preview.png)

`veryos_logo_cube.scad` builds the logo from circles and rectangles with the
measures of `veryos_logo.svg`, so it needs no external file and the curves stay
smooth at any size.

## parameters

- `logo_width`: width of the logo (default 50 mm).
- `depth`: extrusion, front face to back face (default 50 mm).
- `engraving_margin`, `engraving_depth`: the logo in the bottom face is as large
  as fits inside the margin, 1 mm deep.

## printing

The model comes lying on its back: every layer is the logo outline, so it
prints without support. The top face is the front; the bed side shows the logo
mirrored. The engraving sits on a wall and reads correctly from outside.
