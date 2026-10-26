// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Current scope: the latest lighter case, wipes box and screw-top container.
export default [
  {
    "id": "babywipesboxV2",
    "folder": "babywipesboxV2",
    "source": "babywipesboxV2.scad",
    "title": "Patterned wipes box",
    "subtitle": "Fit the box to your refill.",
    "description": "Seven exterior pattern options, a locating cover seat and a hinged dispensing lid. Adjust the body width, depth and height independently in OpenSCAD, from a long refill box to a compact cube or a taller stack holder.",
    "customize": "Body dimensions, opening dimensions, wall thickness, magnet pockets and hinge clearances. The opening follows the box proportions when opening_width and opening_depth are zero.",
    "notes": "Labels show the box_width × box_depth × box_height settings, before exterior relief and the cover/hinge. Measure the refill first: interior space is reduced by walls and magnet posts. The cube and tall examples suit folded wipes or tissues. Export with part=\"print_layout\"; use the project assembly notes for magnets and the filament hinge pin. These new sizes are digital examples, without fit or sealing tests.",
    "tags": "wipes box, tissue holder, magnetic lid, hinged lid, storage, bathroom",
    "variants": [
      {
        "name": "Everyday",
        "label": "200 × 120 × 65 mm",
        "params": {
          "box_width": 200,
          "box_depth": 120,
          "box_height": 65,
          "part": "assembly",
          "lid_angle": 0
        }
      },
      {
        "name": "Cube",
        "label": "120 × 120 × 120 mm",
        "params": {
          "box_width": 120,
          "box_depth": 120,
          "box_height": 120,
          "hinge_middle_length": 12,
          "opening_width": 68,
          "part": "assembly",
          "lid_angle": 0
        }
      },
      {
        "name": "Long",
        "label": "260 × 100 × 65 mm",
        "params": {
          "box_width": 260,
          "box_depth": 100,
          "box_height": 65,
          "part": "assembly",
          "lid_angle": 0
        }
      },
      {
        "name": "Tall",
        "label": "160 × 120 × 145 mm",
        "params": {
          "box_width": 160,
          "box_depth": 120,
          "box_height": 145,
          "part": "assembly",
          "lid_angle": 0
        }
      }
    ],
    "family": "wipes"
  },
  {
    "id": "biclightercase2",
    "folder": "biclightercase2",
    "source": "bic_lighter_case.scad",
    "title": "Textured lighter case",
    "subtitle": "One fit. Four different surfaces.",
    "description": "A slim sleeve designed around the BIC Maxi J26 dimensions, with seven selectable exterior patterns. These four examples use the same cavity and change only the surface geometry.",
    "customize": "Choose the pattern, then adjust repeat count, relief, pitch and twist. Lighter width, depth and fit clearance remain independently editable.",
    "notes": "Shown: ribs, broad flutes, spiral and diamond; smooth, waves and chevron are also available. The current source uses 0.22 mm fit clearance per side. Print upright and check the fit on your own printer. BIC/Maxi identify intended compatibility; this is an independent design.",
    "tags": "BIC Maxi, J26, lighter case, texture, ribs, spiral, diamond",
    "variants": [
      {
        "name": "Fine ribs",
        "label": "24 repeats",
        "params": {
          "exterior_pattern": "ribs",
          "pattern_count": 24
        }
      },
      {
        "name": "Broad flutes",
        "label": "12 repeats",
        "params": {
          "exterior_pattern": "flutes",
          "pattern_count": 12
        }
      },
      {
        "name": "Spiral",
        "label": "180° twist",
        "params": {
          "exterior_pattern": "spiral",
          "pattern_count": 24,
          "pattern_twist": 180
        }
      },
      {
        "name": "Diamond",
        "label": "10 mm pitch",
        "params": {
          "exterior_pattern": "diamond",
          "pattern_count": 24
        }
      }
    ],
    "camera": [
      1,
      -1.8,
      1.1
    ]
  },
  {
    "id": "simple_cylindrical_screwing_containerV2",
    "folder": "simple_cylindrical_screwing_containerV2",
    "source": "simple_cylindrical_screwing_containerV2.scad",
    "title": "Textured screw-top jars",
    "subtitle": "Short, tall, wide. Your dimensions.",
    "description": "A cylindrical container and matching screw lid generated from editable OpenSCAD dimensions. Change the body proportions while preserving the wall and thread settings. Seven exterior patterns add another way to customize the result.",
    "customize": "Outer diameter, overall height, lid height, neck and thread dimensions, fit clearance, surface pattern and relief.",
    "notes": "Labels show nominal outer diameter × full_height, before any pattern relief or alignment-stop allowance. Renders show assemblies; use view=\"print\" for separate printable parts. Check thread fit with a small print. No verified airtight or liquid-tight seal is claimed.",
    "tags": "container, screw lid, storage, jar, parametric box",
    "variants": [
      {
        "name": "Pocket",
        "label": "Ø32 × 50 mm",
        "params": {
          "outer_diameter": 32,
          "full_height": 50,
          "lid_height": 15,
          "view": "assembled",
          "exterior_pattern": "ribs",
          "pattern_count": 36
        }
      },
      {
        "name": "Everyday",
        "label": "Ø40 × 80 mm",
        "params": {
          "view": "assembled",
          "exterior_pattern": "flutes",
          "pattern_count": 36
        }
      },
      {
        "name": "Wide",
        "label": "Ø70 × 50 mm",
        "params": {
          "outer_diameter": 70,
          "full_height": 50,
          "lid_height": 15,
          "view": "assembled",
          "exterior_pattern": "diamond",
          "pattern_count": 36
        }
      },
      {
        "name": "Tall",
        "label": "Ø45 × 120 mm",
        "params": {
          "outer_diameter": 45,
          "full_height": 120,
          "view": "assembled",
          "exterior_pattern": "spiral",
          "pattern_count": 36
        }
      }
    ]
  }
];
