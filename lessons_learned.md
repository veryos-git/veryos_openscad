# Lessons learned

Findings from real prints. Newest first. Check here before choosing a clearance.

## Clearances

Diameter clearance = added to the hole diameter, not per side.

| Date | Fit | Part | Hole | Result | Printer / material |
|---|---|---|---|---|---|
| 2026-11-10 | Slide holder's rounded groove mouths on the X slider's ring, per side | OMM XY table v2.5 | 0.4 | untested | ? |
| 2026-11-10 | Slide holder's grooves on the X slider ring's 4.0 wall | OMM XY table v2.4 | 4.8 (+0.8) | barely goes on. Not the width: the grooves' square mouths overlap the ring's rounded inner corners by 0.85 at four places | ? |
| 2026-11-09 | ESP32-S3 WROOM-1 board in the pocket of its printed case | OMM enclosure V3 | 64.55 × 28.55, header slots 3.3 | untested; the case's own numbers | ? |
| 2026-11-08 | M3 thread forming, lid screws and driver standoffs | OMM enclosure V1 | 2.7, 0.6 chamfer | untested | ? |
| 2026-11-08 | ESP32-S3-DevKitC-1 in its cradle, per side | OMM enclosure V1 | 0.4 | the board did not fit: it is a 28 mm wide clone, not the 25.4 of Espressif's DXF | ? |
| 2026-11-08 | Lid lip inside the walls, per side | OMM enclosure V1 | 0.3 | untested | ? |
| 2026-11-06 | Puck's free play in the holder, axial gap, not a diameter | pucklight_sphere screwin, fixed | 0.4 at the screw's stop, 1.0 flush, at 0.2 mm layers | untested | ? |
| 2026-11-06 | Puck's free play in the holder, axial gap, not a diameter | pucklight_sphere V1 screwin | 0.1 at the screw's stop, 0.7 flush; as sliced at 0.28 mm layers 0.04, 0.64 | too tight: the puck cannot move when screwed in all the way | Snapmaker U1, 0.28 mm, per v1_snapmaker.3mf |
| 2026-11-01 | 6 × 2 mm disc magnet, blind bore | babywipesbox V2–V4 | 6.3 (+0.3) | untested; magnets are glued, gap holds glue | ? |
| 2026-11-01 | 6 × 2 mm disc magnet, blind bore | babywipesboxV2, large box, corner posts | 6.2 (+0.2) | too tight | ? |

## Rules

- Seat mating parts on each other in the model and check for overlap before printing; the clearance of the main faces does not show it. OMM XY table v2.4 had 0.4 per side in the grooves, yet their square mouths sat 0.85 inside the ring's rounded corners (2026-11-10).
- A dev board bought as a clone does not follow the maker's drawing: the OMM enclosure V2 cradle from Espressif's ESP32-S3-DevKitC-1 DXF (25.4 wide) did not take the 28 wide board. Measure the board, or take the pocket of a printed case that fits it (OMM enclosure V3, 2026-11-09).

- A click base needs no alignment pins: the disc in the screw's opening and the bar in its slot are enough (pucklight_sphere V2, 2026-11-06). Without pins the sockel can turn on the base, so hold it when turning a sphere.
- A screw turned by hand needs height: 8.4 mm high with a 2.6 mm bar gives too little grip and feedback, 10.4 mm with a 4.6 mm bar is better (pucklight_sphere V2 against V1, 2026-11-06).
- A sphere on a neck 77% of its diameter looks cut off (pucklight_sphere V2, starts at latitude -37.8, 2026-11-06).
- Flat faces that set a fit belong on multiples of the layer height, 0.2 mm by default. The slicer rounds the others: a 0.1 mm axial gap sliced as 0.04 mm at 0.28 mm layers, measured in the G-code (pucklight_sphere V1, 2026-11-06).
- A clearance that fits on a small test print may not fit on a large part. Test in the real part, or print the real section (e.g. one corner post) as the test piece. *Hypothesis (babywipesbox, 2026-11-01), not yet confirmed side by side.*
- Glued magnets: check the polarity of each pair before the glue sets.
