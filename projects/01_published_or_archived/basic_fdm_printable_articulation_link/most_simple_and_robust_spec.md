# Articulated chain "most_simple_and_robust": recreation spec

Source: Onshape document **articulated_chain_long**, part studio **most_simple_and_robust**
(doc `9a478c861005983374a565e2`, workspace `fb7e07c3c2928786e7b6d290`, element `099cb15bf3ce36c27b95ccc9`).
Extracted on 2026-11-07 from the Onshape REST API (feature list, solved sketches, B-rep body details, mass properties).

Reference implementation: `articulated_chain.scad` (checked against Onshape: volume within 0.2%, identical bounding box, no intersection between links).

---

## 1. What it is

This is a **print-in-place articulated chain** for FDM printing. Each link has three parts:

1. **Ring.** A short thick-walled tube (eyelet) whose axis is horizontal (Y), standing upright.
2. **Foot.** A flat-bottomed slab under the ring that sits on the print bed and fills the space between the ring and the bed.
3. **Loop.** A full torus (a closed "chain-link" loop) with tube Ø3. Its plane is tilted 55° from vertical. It is anchored in the link's own foot and threads through the **next** link's ring hole.

Links repeat along +X with pitch 8.591 mm. Every link is identical, and the whole chain prints flat in one piece with no supports. The loop tube touches the bed at its lowest point, and its tilt keeps overhangs printable.

The other part studios in the document (`minimal`, `sturdy`, `sturdy_ang3`, `gothic`, `3d`, `snake*`, `limb`, `negative_cutter`, `sturdy_neutralang_surface`, …) are earlier experiments and are not covered here.

---

## 2. Coordinate frame and conventions

- Units are mm and degrees. Onshape's frame is used as is.
- **X** is the chain direction, **Y** runs across the chain (it is the ring axis and the extrude direction), and **Z** points up.
- All sketches lie on the **Front plane (XZ)**. Sketch coords (x, y) map to world (X, Z). Every extrude is symmetric about Y = 0.
- The ring of link *i* is centred at `(i·pitch, 0, 0)`. The Onshape pattern put the second link at −pitch.
- The print bed is the plane `Z = bed_z = −5.231`.

---

## 3. Parameters

### Onshape variables (`#name`)
| Variable | Value | Meaning |
|---|---|---|
| `ang` | 55° | Angle of the loop chord from vertical. The loop plane is tilted `tilt = 90 − ang = 35°` from horizontal. |
| `w` | 3 | Thickness (Y) of the ring and foot |
| `din` | 3 | Diameter of the loop tube, so `r_pin = 1.5` |
| `dout` | 2 | Radial wall thickness of the ring |
| `dchain` | 0.4 | Gap between the outer circles of neighbouring rings |

### Solved values that no named variable drives (treat as independent parameters)
| Name | Value | Notes |
|---|---|---|
| `R_in` | 2.095 | Ring hole radius. Radial clearance to the tube is 0.595. |
| `R_loop` | 3.253 | Major radius of the loop torus, equal to half the chord A–B (6.505). |
| `foot_gap` | 0.304 | Gap between this foot's front face and the next foot's back face, measured along **u** (0.372 horizontally at bed level) |

### Fillets
| Feature | Radius | Edges |
|---|---|---|
| Fillet 1 | 1.0 | Ring hole edges and remaining outer ring edges. With w = 3 and dout = 2 the ring cross-section becomes a **2 × 3 stadium**. |
| Fillet 2 | 1.0 | The 4 slanted vertical-ish foot edges (front and back faces × ±Y) |
| Fillet 3 | 0.4 | Foot bottom perimeter |

### Derived relations (verified against the Onshape geometry)
```
r_pin   = din/2                         = 1.5
R_out   = R_in + dout                   = 4.095
pitch   = 2·R_out + dchain              = 8.591
tilt    = 90 − ang                      = 35°
u       = (cos tilt, 0, sin tilt)       = (0.8192, 0, 0.5736)   # chord direction, foot face normal
v       = (−sin tilt, 0, cos tilt)      = (−0.5736, 0, 0.8192)  # loop torus axis
B       = (pitch, 0, 0)                 # centre of NEXT ring; loop passes through it along ±Y
M       = B − R_loop·u                  = (5.926, 0, −1.866)    # loop torus centre
A       = B − 2·R_loop·u                = (3.262, 0, −3.731)    # loop point inside own foot
bed_z   = A.z − r_pin                   = −5.231                # tube tangent to bed at A
d_back  = −R_out                        # back face plane:  u·p = −4.095 (tangent to own ring)
d_front = pitch·cos(tilt) − R_out − foot_gap = 2.637            # front face plane: u·p = 2.637
```

---

## 4. Geometry of one link

### 4.1 Ring
- Annulus with R_in = 2.095 and R_out = 4.095, centred at the origin, axis Y, thickness w = 3 (Y ∈ [−1.5, 1.5]).
- Every circular edge is rounded with r = 1. The resulting cross-section in the (radial, Y) plane is a stadium: the hull of four r = 1 circles at radial positions {3.095} and Y = ±0.5. In practice this is a rotate_extrude of a 2-wide × 3-tall rounded slot.
- B-rep check: cylinders r4.095 and r2.095 for |Y| ≤ 0.5, plus fillet torus faces R3.095 / r1.

### 4.2 Foot
- 2D outline in XZ (Sketch 2 region). It is bounded by:
  - the bed line Z = −5.231, from (−1.337, −5.231) to (6.883, −5.231);
  - the **front face**, plane `u·p = 2.637`, from (6.883, −5.231) up to F = (3.957, −1.054) on the outer ring circle;
  - the **lower arc of the outer ring circle** from F to the back tangent point T = (−3.354, −2.349);
  - the **back face**, plane `u·p = −4.095` (tangent to the ring at T), from T down to (−1.337, −5.231).
- Extruded symmetrically, w = 3.
- The foot merges with the ring. The ring's outer edge has no fillet where the foot covers it, and the flat side faces at Y = ±1.5 carry on inward to r = 3.095, where the hole fillet starts.
- Rounding: r = 1 on the 4 slanted edges (front and back faces are 1 mm flat in Y) and r = 0.4 on the bottom perimeter. The bottom contact face is about Y ∈ [−1.1, 1.1] × X ∈ [−1.13, 6.11].

### 4.3 Loop (Revolve 1)
- A full 360° torus with tube radius r_pin = 1.5, major radius R_loop = 3.253, centre M, axis **v**.
- The torus plane contains **u** and **Y**:
  - At θ = 180° it passes through **A**, inside its own foot and tangent to the bed.
  - At θ = 0° it passes through **B**, the centre of the next ring, where its direction is exactly ±Y, the ring axis. That makes it thread the next ring's hole.
  - At θ = ±90° it swings out to Y = ±4.753, the overall link width.
- The torus is unioned with the ring and foot. In Onshape this was done with Boolean 3 (subtract, keep tools) followed by Boolean 7 (union), which is equivalent to a plain union.
- OpenSCAD: `translate(M) rotate([0,-tilt,0]) rotate_extrude() translate([R_loop,0]) circle(r_pin);`

### 4.4 Link-to-link fit
- Link i's loop runs through link i+1's ring hole.
- The minimum gap between neighbouring links is **≈0.23 mm**. It occurs where the curved tube passes the 3 mm-thick hole: the nominal 0.595 radial clearance, minus about 0.37 from the tube's curvature across ±1.5 Y.
- The feet are 0.304 apart along **u**, and the rings are 0.4 apart (dchain).

---

## 5. Onshape feature tree (in order)

| # | Feature | Type | Key settings |
|---|---|---|---|
| 1–4 | `ang`, `w`, `din`, `dout` | Variables | 55°, 3, 3, 2 |
| 5 | Sketch 1 | Sketch (Front) | Circles R4.095, R2.095, R1.5 at the origin. Construction line at `#ang` from vertical; dims `#din`, `#dout`. |
| 6 | Extrude 1 | New, symmetric, depth `#w` | Ring annulus |
| 7 | Revolve 1 | New, 30° + 330° = full | Loop torus. Tube circle R1.5, axis ⟂ chord through its midpoint. Initially built so that it passes through this link's own ring origin. |
| 8 | `dchain` | Variable | 0.4 |
| 9 | Sketch 2 | Sketch (Front) | Foot outline and the neighbouring ring circle at +8.591 (dim `#dchain` between ring circles) |
| 10 | Extrude 2 | Add, symmetric, `#w` | Foot merged into the ring |
| 11 | Transform 1 | By mate connectors | Moves the loop to its final place (threading the next ring at +pitch) |
| 12 | Boolean 1 | Union | **Suppressed** |
| 13–15 | Fillet 1/2/3 | Edge fillets | r1 ring edges, r1 slanted foot edges, r0.4 foot bottom |
| 16 | Sketch 3 | Sketch (Front) | Clearance outline (see §6) |
| 17 | Extrude 3 | New, symmetric, 5 | Clearance body |
| 18 | Boolean 3 | Subtract, keep tools | Ring and foot subtracted from the loop (cosmetic before the union) |
| 19 | Revolve 2 | New, full | Clearance torus, tube r2.5 (= r_pin + 1), same axis as the loop |
| 20 | Boolean 2 | Union | Clearance torus + clearance body |
| 21 | Boolean 4 | Subtract | **Suppressed** |
| 22 | Point Pattern 1 | Part pattern | Copies loop, link and clearance body to −pitch |
| 23 | Boolean 5 | Union | Merges the two clearance bodies |
| 24–25 | Sketch 5 / Extrude 5 | Add, symmetric, 33 | Thin 0.4 wall X ∈ [−0.4, 0], Z ∈ [−11.4, 16.2] added to the clearance body |
| 26 | Boolean 6 | Subtract, keep tools | Links subtracted from the clearance body |
| 27–28 | Sketch 4 / Extrude 4 | Intersect, symmetric, 555 | Crops the clearance body to X ∈ [−6.654, 3.249], Z ∈ [−7.244, 8.953] |
| 29–30 | Sketch 6 / Extrude 6 | Remove, symmetric, 222 | Removes the clearance body below Z = −5.254 |
| 31–32 | Sketch 7 / Extrude 7 | Remove, symmetric, 222 | Removes a freehand closed-spline region from the clearance body |
| 33 | Boolean 7 | Union | Link 1 + its loop → **Part 1** |
| 34 | Boolean 8 | Union | Link 2 + its loop → **Part 2** |

Final parts:
| Part | Visible | Volume | Surface | Bounding box (X, Y, Z) |
|---|---|---|---|---|
| Part 1 | yes | 270.96 mm³ | 360.9 mm² | [−4.095, 10.091] × [−4.753, 4.753] × [−5.231, 4.095] |
| Part 2 | yes | 270.96 mm³ | 360.9 mm² | Same, shifted −8.591 in X |
| Part 3 | **hidden** | 422.15 mm³ | 1495 mm² | Clearance/negative body around the Part 2 ↔ Part 1 joint |

---

## 6. Part 3: clearance / negative body (hidden, optional)

This is a hidden helper body. It is the link envelope, enlarged by about 0.4–0.45 mm, plus a loop clearance torus, with the links themselves subtracted. Judging by its construction it is a slicer modifier (support blocker/enforcer or negative volume) or a design check for the joint. **Confirm its purpose before reimplementing it.** It is not part of the printed chain.

- Sketch 3 (XZ):
  - circles R4.524 (= R_out + 0.429) and R1.76 at the ring centre;
  - an enlarged foot polygon (−3.706, −2.595) → (−1.570, −5.646) → (7.709, −5.646) → (4.423, −0.953), i.e. back face tangent to R4.524, bottom at bed_z − 0.415, front face offset by about 0.44;
  - circle R2.5 at B;
  - a capsule A–B made of R1.5 arcs, used for Revolve 2.
- Extrude 3 depth 5, symmetric (Y ±2.5, 1 mm more than the link on each side). Clearance torus: R_loop 3.253, tube 2.5.
- Then: pattern, union, add the 0.4 wall at X ∈ [−0.4, 0], subtract the links, crop to the box in §5 #28, cut below Z = −5.254, and cut the Sketch 7 freehand splines (two periodic interpolated splines; control points in mm below).
  - Spline 1: (−4.83, 8.00) (−3.90, 2.29) (−7.46, −3.34) (−10.49, −3.03) (−11.87, 5.72) (−4.51, 8.18)
  - Spline 2: (0.98, −6.78) (0.49, −3.90) (2.60, −0.63) (6.81, 1.76) (14.01, 1.67) (13.46, −5.09) (3.89, −8.64)

---

## 7. OpenSCAD notes (how `articulated_chain.scad` builds it)

- **Ring:** `rotate([90,0,0]) rotate_extrude() hull()` of four r1 circles at (R_in+1 and R_out−1, ±(w/2−1)).
- **Foot:**
  1. Make a convex core: a slab in the tilted frame (`rotate([0,-tilt,0])`, local X = u) between `d_back` and `d_front`, with the Y-width corners rounded to `r_foot_side − r_foot_bottom`. Clip it to Z ≥ bed_z + 0.4.
  2. `minkowski` the core with `sphere(0.4)`. This gives r1 on the slanted edges and r0.4 on the bottom.
  3. Intersect with a 2D mask that keeps only the region below the polyline T → O → F.
  4. Subtract `cylinder(r = R_in + 1)` so the ring's hole fillet stays clean.
- **Loop:** see §4.3.
- **Chain:** `for (i) translate([-i*pitch,0,0]) link();`
- Validation (n_links = 1, $fn = 64): volume 270.44 mm³ (Onshape 270.96; the gap is faceting), area 360.7 mm², bounding box identical, watertight, zero intersection with the neighbour, minimum gap ≈0.228 mm.
- Small differences from Onshape: the corner where a slanted face meets the bottom is a minkowski sphere blend rather than Onshape's rolling-ball fillet. This is negligible.

## 8. Suggested parametrisation ideas for the port
- Expose `clearance_hole = R_in − r_pin` (0.595) instead of `R_in`, and `foot_gap`, as printer-tuning knobs.
- Check the real minimum gap (≈0.23 here) whenever `w`, `R_loop` or the clearance changes. It shrinks as `w` grows or `R_loop` gets smaller.
- `R_loop` could be derived from a target anchor height. The anchor A must stay inside the foot, and the tube must stay tangent to the bed: `bed_z = −2·R_loop·sin(tilt) − r_pin`.
- For a curved chain, transform each link about the next ring's axis (Y through B). The ring/loop joint rotates about Y.
