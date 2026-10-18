# Parametric Screw Top Container With Adjustable Lid Alignment

A cylindrical storage container with a screw-on lid and editable OpenSCAD dimensions. Resize it for small parts, hobby supplies or workshop storage, then tune the thread clearance for your printer.

The neck height and thread height are independent. A smooth neck guides the lid into position while a short threaded band provides the closure. Making the neck taller does not add more threaded travel.

An adjustable seating shoulder lets you fine-tune where the lid stops. This is useful when you add markings that should line up across the base and lid. Increase the shoulder extrusion to stop the lid earlier; it also adds that amount to the closed height.

## Features

- Adjustable overall size, wall thickness and lid height.
- Separate neck and thread heights.
- Adjustable radial and axial thread clearance.
- Separate base and lid entry tapers and outer chamfers.
- Optional top and bottom edge chamfers.
- Adjustable lid stopping angle.
- Standalone OpenSCAD source with no external libraries.

## Included model defaults

| Setting | Value |
| --- | --- |
| Nominal closed height | 80 mm |
| Outside diameter | 40 mm |
| Wall, floor and lid roof thickness | 1.2 mm |
| Neck height | 10 mm |
| Lid height | 20 mm |
| Threaded band height | 5 mm |
| Thread pitch | 2.0 mm |
| Radial clearance per side | 0.15 mm |
| Total additional axial groove width | 0.05 mm |
| Base and lid entry tapers | 1 mm axial length |
| Base and lid outer chamfers | 0.5 mm |
| Seating shoulder extrusion | 0.2 mm |

These settings give an actual closed height of **80.2 mm** and an estimated **36° earlier stop** relative to the unraised shoulder. The minimum rim clearance setting is 0.2 mm; the current short neck leaves 9 mm of actual space beneath the lid roof.

## Print and customize

Print the base upright and the lid open-side up. The included STL files are oriented on the print bed. Open the SCAD file to change the dimensions and fit, render with F6, and export the base or lid separately.

Thread fit depends on the printer and material. Use a small fit test when changing clearances. Listing images are digital renders; colors are illustrative.

## Tags

container, screw top, screw lid, threaded container, parametric, OpenSCAD, customizable, storage, organizer, small parts, workshop, cylindrical, adjustable lid, lid alignment, threaded lid, 3D printable, maker

## License

GNU GPL version 2. See the included LICENSE file.
