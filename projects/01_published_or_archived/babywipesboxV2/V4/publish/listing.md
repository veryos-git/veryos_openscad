# baby wipes box V4: listing for MakerWorld and Printables

Copy the parts below into the upload forms. Images are 2400 × 1800 (4:3),
the portrait cover 1800 × 2400 (3:4), the photos 2000 × 1500 (4:3).

## title

Baby Wipes Box with Magnetic Cover and Flip Lid: Customizable, 7 Patterns

## summary

A wipes box with a magnetic cover and a hinged flip lid. Rectangular or
rounded corners, seven exterior patterns, any size. Fully parametric in
OpenSCAD.

## description

Put the refill pack in the box, pull the first wipe through the opening and
close the lid. The cover lifts off to change the pack. Size the box to your
refill pack.

**How it works**

- The cover locates on a 45° bevel round the box rim and holds with four
  magnet pairs in the corner posts.
- The flip lid has a tapered insert that seats in a 45° recess round the
  opening. A fifth magnet pair keeps it closed; the grip lip lifts it.
- The hinge pin is a piece of 1.75 mm filament through three printed
  knuckles.
- The VeryOS logo is engraved in the floor of the box. You see it through
  the opening when the box is empty.

**Customize**

| parameter | default | options |
| --- | --- | --- |
| `box_width`, `box_depth`, `box_height` | 200 × 120 × 65 mm | 100–350 × 70–250 × 25–200 mm |
| `corner_style` | rectangular | rectangular, rounded |
| `exterior_pattern` | diamond | none, ribs, flutes, spiral, diamond, waves, chevron |
| `pattern_depth` | 3 mm | 0–4 mm, added outside the wall |
| `opening_width`, `opening_depth` | 0: 53 % of the width, 40 % of the depth | any size that leaves room for the magnets and hinge |
| `engrave_logo` | true | true, false |
| `magnet_diameter`, `magnet_thickness` | 6 × 2 mm | 3–12 × 1–5 mm |

Seats, clearances, hinge and grip lip have their own parameters. A value
that does not fit stops the render with a message that says what to change.

**Presets**

Four presets in the Customizer, all four in the images at the same scale:

| preset | box settings | outside | corners, pattern | opening |
| --- | --- | --- | --- | --- |
| Everyday | 200 × 120 × 65 mm | 206 × 126 × 65 mm | rectangular, diamond | 106 × 48 mm |
| Cube | 120 × 120 × 120 mm | 126 × 126 × 120 mm | rounded, flutes | 68 × 48 mm |
| Long | 260 × 100 × 65 mm | 266 × 106 × 65 mm | rectangular, ribs | 137.8 × 40 mm |
| Tall | 160 × 120 × 145 mm | 166 × 126 × 145 mm | rounded, spiral | 84.8 × 48 mm |

Everyday is the script's defaults. Cube has a 68 mm opening and a 12 mm
middle hinge knuckle so the lid fits between the corner magnets.

**Files**

- `babywhipes_box_v4_veryos_bambu.3mf`: the Everyday preset for the Bambu
  Lab A1, with the print settings of the photographed box. Plate 1: box and
  cover. Plate 2: lid.
- `babywhipes_box_v4_veryos_snap.3mf`: the same for the Snapmaker U1.
- `babywipesboxV4_box.stl`, `babywipesboxV4_boxcover.stl`,
  `babywipesboxV4_boxcover_lid.stl`: the Everyday preset in print
  orientation.
- `babywipesboxV4.scad` and `babywipesboxV4.json`: the OpenSCAD source and
  its four presets.

**Printing**

PLA, 0.4 mm nozzle, 0.28 mm layers, 2 walls, 15% grid infill, auto brim,
textured PEI plate, no supports, as in the 3mf files.

- Box: opening up. The brim keeps the sharp corners of a large rectangular
  box down.
- Cover: top up, on its locating rim. The outer ledge sits 1.35 mm above the
  bed; it printed without supports.
- Lid: on its tapered insert. Flange, latch pad and hinge sit 2.25 mm above
  the bed; they printed without supports.

**Assembly**

1. Check the polarity of each magnet pair, then glue the ten 6 × 2 mm magnets
   in: four in the box's corner posts, four under the cover, one in the
   cover's front, one in the lid's latch pad.
2. Put the lid's middle knuckle between the cover's two knuckles and push
   about 47 mm of 1.75 mm filament through all three.
3. Flatten the pin's ends or glue one end to an outer knuckle. Keep glue away
   from the middle knuckle.
4. Put the refill pack in, put the cover on and pull the first wipe through.

The lid is not airtight: keep the wipes in their own pack inside the box.

**Make your own size**

Open `babywipesboxV4.scad` in OpenSCAD and pick a preset in the Customizer,
or change any value. Use the same settings for all three parts.
`part = "print_layout"` puts all three on the bed; `box`, `boxcover` and
`boxcover_lid` export one each. The console reports the outside size, the
opening and the filament pin length. The script needs no libraries.

```sh
openscad -p babywipesboxV4.json -P Tall -D 'part="box"' -o box.stl babywipesboxV4.scad
```

**Status**

The photos show the Everyday preset printed. The other presets, patterns
and the rounded corners export as closed meshes but are not printed yet.

Very open source: the source is GPL-2.0, like everything from VeryOS.

## tags

baby wipes box, wipes dispenser, wipes holder, wet wipes, tissue box,
nursery, changing table, storage box, magnetic lid, flip lid, hinged lid,
filament hinge, magnets, diamond pattern, knurled, parametric,
customizable, OpenSCAD, FDM, VeryOS

## files to upload

- MakerWorld: `babywhipes_box_v4_veryos_bambu.3mf` as the print profile.
  The three STL files, the `.scad` and the `.json` as model files.
- Printables: the three STL files, both 3mf files, the `.scad` and the
  `.json`.

The STL files are in this folder; the 3mf files, the `.scad` and the `.json`
are in the project folder, one level up.

License: GPL-2.0 (see `LICENSE` in the repository root). Choose a GPL
license where the site offers one.

## images, in upload order

Photos are in `../printed/WhatsApp Unknown 2026-11-03 at 00.04.03/`.

| file | caption / alt text |
| --- | --- |
| `thumbnail_4x3.png` | Baby wipes box: photo of the printed box with the diamond pattern, and CAD renders of four sizes at the same scale. |
| `WhatsApp Image 2026-11-03 at 00.03.56 (1).jpeg` | The printed Everyday box, closed: diamond pattern, flip lid with grip lip. |
| `WhatsApp Image 2026-11-03 at 00.03.56 (4).jpeg` | Lid open, a wipe pulled through the opening. The latch magnet is on the lid's tab. |
| `WhatsApp Image 2026-11-03 at 00.03.57 (3).jpeg` | The closed lid from above, with the filament hinge pin at the back. |
| `WhatsApp Image 2026-11-03 at 00.03.57 (4).jpeg` | The hinge: a piece of 1.75 mm filament through the lid's knuckle and the cover's two knuckles. |
| `WhatsApp Image 2026-11-03 at 00.03.57 (6).jpeg` | Lid lifted: the cover's latch magnet, left, and the lid's magnet glued into its latch pad. |
| `images/01_four_sizes.png` | Four presets at the same scale: Everyday 200 × 120 × 65, Cube 120 × 120 × 120, Long 260 × 100 × 65 and Tall 160 × 120 × 145 mm. |
| `images/02_patterns.png` | The seven exterior patterns on the same box: none, ribs, flutes, spiral, diamond, waves and chevron. |
| `images/03_corners.png` | Rectangular and rounded corners with the lid open, and the VeryOS logo engraved in the floor of the box. |
| `images/04_print.png` | The print layout: box, cover and lid on the bed, no supports, with the hardware: ten magnets and a filament pin. |
| `thumbnail_3x4.png` | Portrait cover, where a vertical image is needed. |

`contact-sheet.png` shows all eleven in this order. Photos of the box with
the refill pack's brand visible (`00.03.57.jpeg`, `00.03.57 (1).jpeg`) are
left out.

## rebuild

The images and STL files come from the source with OpenSCAD (nightly,
Manifold backend), Blender and Pillow:

```sh
python3 projects/01_published_or_archived/babywipesboxV2/V4/publish/source/build.py
```

`--stage=mesh`, `--stage=render` or `--stage=compose` runs one stage;
`--draft` renders quickly at half size. Meshes go to
`.gitignored/babywipesboxV4_publish/`. The transparent renders are in
`renders/`. Font: DejaVu Sans Mono, as Consolas is not installed; set
`PUBLISH_FONT` and `PUBLISH_FONT_BOLD` to use Consolas.
