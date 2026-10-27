// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPL. See LICENSE file for details
// Current scope: the latest lighter case, wipes box, screw-top container and phone mount.
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
  },
  {
    "id": "phone_camera_thread_holder",
    "folder": "phone_camera_thread_holder",
    "source": "V3/phone_camera_thread_holderV3.scad",
    "title": "Phone mount",
    "subtitle": "Holds your phone on any tripod or ball head.",
    "description": "A hook clamp that holds your phone on a tripod or ball head. Two 1/4\"-20 camera threads are printed straight into the slider: the one in its end holds the phone upright in landscape, the one in its back holds it flat or at any angle on a ball head tilted 90°. Push the hooks onto the phone by hand, then a short screw pulls the slider into the body and locks the grip in about five turns.",
    "customize": "Phone width and thickness with case, the clamping range, the hook width, how far the lips reach over the screen and the cavity corner radius. The lock screw is cut to phone_width, so a different phone needs only a new screw. The tripod threads, the guide and the lock screw each have their own fit clearance.",
    "notes": "Labels show phone_width × phone_thickness and the hook width (holder_width). The renders show the assembly; export part=\"print_layout\" for the three printable parts. Body and slider print lying on their side, with a keel that carries the guide bar on the bed, and the screw lies on a flat cut, all without supports. Print part=\"thread_test\" first to tune the 1/4\"-20 fit with tripod_thread_clearance. These variants are digital examples and have not been print-tested.",
    "tags": "phone mount, phone holder, tripod mount, phone tripod adapter, 1/4-20, camera thread, ball head, smartphone, photography, vlogging",
    "variants": [
      {
        "name": "Everyday",
        "label": "75 × 12 mm phone · 30 mm hooks",
        "params": {
          "phone_width": 75,
          "phone_thickness": 12,
          "holder_width": 30,
          "part": "assembly"
        }
      },
      {
        "name": "Compact phone",
        "label": "66 × 12 mm phone · 30 mm hooks",
        "params": {
          "phone_width": 66,
          "phone_thickness": 12,
          "holder_width": 30,
          "grip_min": 55,
          "grip_max": 80,
          "part": "assembly"
        }
      },
      {
        "name": "Thick case",
        "label": "80 × 16 mm phone · 30 mm hooks",
        "params": {
          "phone_width": 80,
          "phone_thickness": 16,
          "holder_width": 30,
          "grip_min": 65,
          "grip_max": 95,
          "part": "assembly"
        }
      },
      {
        "name": "Wide hooks",
        "label": "75 × 12 mm phone · 44 mm hooks",
        "params": {
          "phone_width": 75,
          "phone_thickness": 12,
          "holder_width": 44,
          "part": "assembly"
        }
      }
    ],
    "rotation": [
      90,
      0,
      0
    ],
    "camera": [
      1,
      -1.8,
      1.1
    ]
  }
];
