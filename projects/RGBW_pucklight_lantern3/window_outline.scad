// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
//
// The 2D outline of a window of RGBW_pucklight_lantern3.scad, for drawing
// windows in another CAD program. Export it as SVG or DXF (F6, then
// File > Export). Units: mm. Origin: middle of the window's bottom edge, the
// narrow edge that stands in the rail. The outline already has the
// slot_clearance at its edges; make the window window_thickness (3 mm) thick.

include <RGBW_pucklight_lantern3.scad>
part = "none";

projection() window();
