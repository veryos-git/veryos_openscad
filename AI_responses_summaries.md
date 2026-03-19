2026-03-19 11:31:37 - Transformed CRUD template into OpenSCAD Project Manager: replaced student/course models with o_project model, created project card grid UI with detail editor, added file upload (scad/3mf/thumbnail) via WebSocket, added OpenSCAD CLI integration for stl generation, added 3MF thumbnail extraction, updated routing/CSS/HTML, removed utterance demo code
2026-03-19 11:39:01 - Created parametric OpenSCAD pcb_baseplate.scad script with configurable PCB dimensions, hole positions, clearance depth, wall thickness, and standoffs
2026-03-19 11:43:20 - Refactored pcb_baseplate.scad parameters to use n_width_board/n_height_board and n_width_hole/n_height_hole (center-to-center) naming
2026-03-19 11:46:36 - Renamed params to n_scl_x/y/z pattern, added OpenSCAD Customizer sections and labeled combo box for hole diameter
2026-03-19 11:48:43 - Fixed hole spacing to compensate for caliper measurement (outside-to-outside, adds hole diameter for center-to-center)
2026-03-19 11:54:31 - Added counterbore from bottom side for flush screw heads with configurable head diameter and depth
