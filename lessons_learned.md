# Lessons learned

Findings from real prints. Newest first. Check here before choosing a clearance.

## Clearances

Diameter clearance = added to the hole diameter, not per side.

| Date | Fit | Part | Hole | Result | Printer / material |
|---|---|---|---|---|---|
| 2026-11-06 | Puck's free play in the holder, axial gap, not a diameter | pucklight_sphere screwin, fixed | 0.4 at the screw's stop, 1.0 flush, at 0.2 mm layers | untested | ? |
| 2026-11-06 | Puck's free play in the holder, axial gap, not a diameter | pucklight_sphere V1 screwin | 0.1 at the screw's stop, 0.7 flush; as sliced at 0.28 mm layers 0.04, 0.64 | too tight: the puck cannot move when screwed in all the way | Snapmaker U1, 0.28 mm, per v1_snapmaker.3mf |
| 2026-11-01 | 6 × 2 mm disc magnet, blind bore | babywipesbox V2–V4 | 6.3 (+0.3) | untested; magnets are glued, gap holds glue | ? |
| 2026-11-01 | 6 × 2 mm disc magnet, blind bore | babywipesboxV2, large box, corner posts | 6.2 (+0.2) | too tight | ? |

## Rules

- Flat faces that set a fit belong on multiples of the layer height, 0.2 mm by default. The slicer rounds the others: a 0.1 mm axial gap sliced as 0.04 mm at 0.28 mm layers, measured in the G-code (pucklight_sphere V1, 2026-11-06).
- A clearance that fits on a small test print may not fit on a large part. Test in the real part, or print the real section (e.g. one corner post) as the test piece. *Hypothesis (babywipesbox, 2026-11-01), not yet confirmed side by side.*
- Glued magnets: check the polarity of each pair before the glue sets.
