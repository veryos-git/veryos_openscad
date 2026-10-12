The mathematics behind this lampshade combines **polyhedral geometry, graph theory, and the bending of thin sheets**. The connection pattern determines which overall shapes are possible; the cut outline and material determine how the pieces bend, overlap, and hold those shapes.

Research date: 12 October 2026. Based on [the brief](readme.md), [the assembled lamp](image.png), and [the flat outline](<Organische Kontur mit fliessenden Rundungen.png>).

The supplied images strongly resemble the **IQlight / interlocking quadrilaterals** family. Holger Strøm developed IQlight in 1973, using repeated flexible modules to make different lampshades. This identification is a visual inference, not proof that this particular outline is his original template. [Design & Crafts Council Ireland: Holger Strøm exhibition](https://www.dcci.ie/events/illuminations-holger-strom/?campaign=irish-design-week)

The outline has four hooked corners. For geometry, imagine four connection points at the deepest parts of the hook notches and join them into a quadrilateral. The broad rounded lobes extend around that underlying structure. Neither the photograph nor the unscaled outline establishes the exact assembly instructions, dimensions, or material. I therefore take **16 pieces as specified in the brief**, rather than claiming to have counted them in the photograph.

**The hooks and unequal connection distances explain why the pieces bend.** Strøm's original patent defines an effective side length as the distance between adjacent notch roots. Its principal example uses a parallelogram with two longer and two shorter sides. During assembly, longer sides overlap shorter sides; the resulting mismatch bows the material and creates tension. The hooks retain the connections. The patent also documents 12-piece and 30-piece arrangements corresponding broadly to a rhombic dodecahedron and rhombic triacontahedron. [Strøm, US3895229A, description and Figures 1–5](https://patents.google.com/patent/US3895229A/en)

This matters when redrawing the template: making it into a perfectly regular rhombus, or changing the hooks while keeping a similar silhouette, can change the mechanism. The connection distances, hook directions, and overlap are functional dimensions.

A simple model makes the bowing intuitive. Approximate a longer material path of length `L` as a circular arc whose endpoints are held a distance `S` apart by a shorter neighboring path:

$$
L = R\phi,\qquad S = 2R\sin(\phi/2),\qquad
\frac{L}{S}=\frac{\phi}{2\sin(\phi/2)}.
$$

Here `R` is the bending radius and `φ` is the arc angle in radians. When `L > S`, a straight configuration cannot accommodate both lengths without stretching or buckling. This is an illustrative calculation, not a prediction of the entire lamp: actual panels bend in two dimensions and the joints can move.

**The number of pieces is governed by connectivity.** First approximate each piece as one quadrilateral face of a closed surface with the topology of a sphere. Collapse each cluster of interlocked hooks to one vertex and treat adjacent panel boundaries as shared edges. Small physical openings and overlaps are ignored in this abstract model.

Let `F` be the number of pieces, `E` the number of shared edges, and `V` the number of connection clusters. Euler's formula gives:

$$
V-E+F=2.
$$

This is a connectivity statement; it does not require the assembled object to be a geometrically perfect sphere. [MIT lecture notes: Euler's formula](https://math.mit.edu/~djk/18.310/Lecture-Notes/planarity_coloring_2007.html)

Each quadrilateral has four sides, and every shared edge belongs to two faces. Consequently:

$$
4F=2E,\qquad E=2F,\qquad V=F+2.
$$

For the proposed **16-piece** assembly, this predicts **32 abstract shared edges and 18 connection clusters**.

We can also check how many hooks meet at each cluster. Let `n_k` denote the number of clusters where `k` pieces meet. Counting all the corners gives:

$$
\sum_k n_k=F+2,\qquad \sum_k k n_k=4F.
$$

Subtracting these equations yields:

$$
\sum_k(4-k)n_k=8.
$$

If there are only three-, four-, and five-piece clusters, this becomes:

$$
n_3-n_5=8.
$$

For 16 pieces with only three- and four-piece clusters, the result is **eight three-piece clusters and ten four-piece clusters**. This is a useful assembly check. It is not a unique assembly plan or a guarantee of mechanical stability. A lampshade with a deliberately open rim needs a boundary-aware model; these closed-surface counts cannot simply be applied to it.

**Polyhedra and their duals provide a systematic way to invent other versions.** A dual has one vertex for each face of the original polyhedron, and an edge between faces that share an edge. For any original edge `u–v`, call its two incident faces `f_left` and `f_right`. A module can represent the four connection points in this cyclic order:

```text
                f_left
                 /  \
                u    v
                 \  /
                f_right

Module diagonals: u–v and f_left–f_right
```

One diagonal represents an original edge; the other represents its dual edge. Each edge therefore supplies one module. Joining equally labelled corners gives the connection pattern. This describes topology, while the bending determines the eventual lengths and angles. [Draghicescu, A General Method for Building Topological Models of Polyhedra, 2017, pp. 175–177](https://archive.bridgesmathart.org/2017/bridges2017-175.pdf)

Draghicescu's earlier paper explicitly connects this interpretation to IQlight. Its Figure 4 includes **16-element models based on an elongated square pyramid and on a square antiprism with its dual**. Those examples use the paper's own construction element; they do not establish that every example can be assembled with the supplied outline unchanged. [Draghicescu, Dual Models: One Shape to Make Them All, 2016, Figure 4 and pp. 638–640](https://archive.bridgesmathart.org/2016/bridges2016-635.pdf)

The following counts follow from that construction: pieces equal the original polyhedron's edge count; clusters correspond to its vertices and faces. A vertex of degree `k` and a face with `k` sides each produce a `k`-piece cluster.

| Pieces | Starting polyhedron | Three-piece clusters | Four-piece clusters | Five-piece clusters |
| ---: | --- | ---: | ---: | ---: |
| 12 | Cube | 8 | 6 | 0 |
| 16 | Square antiprism | 8 | 10 | 0 |
| 16 | Elongated square pyramid | 8 | 10 | 0 |
| 24 | Cuboctahedron | 8 | 18 | 0 |
| 30 | Icosahedron | 20 | 0 | 12 |

These are candidate connection patterns, not a compatibility list for this exact template. Notice that the two 16-piece examples have identical cluster counts but different connectivity. Counting pieces and hooks alone cannot identify the photographed lamp.

A concrete 16-piece design input can be built from a square antiprism. Label its upper square `A0…A3` and lower square `B0…B3`, with all indices taken modulo four. Define these edges for each `i`:

```text
Ai — A(i+1)       upper ring: 4 edges
Bi — B(i+1)       lower ring: 4 edges
Ai — Bi          between rings: 4 edges
Ai — B(i-1)      between rings: 4 edges
```

Its faces are the two squares plus the eight triangles `{Ai, A(i+1), Bi}` and `{Ai, B(i-1), Bi}`. That gives 8 vertices, 16 edges, and 10 faces. Assign one cut piece to each edge and label its four corners by the edge endpoints and incident faces. The 8 vertices produce eight four-piece clusters; the faces produce eight three-piece clusters and two more four-piece clusters. This is a reproducible abstract assembly specification. Hook orientation, overlap order, and closure still require a trial assembly.

**A spherical appearance does not mean each panel becomes part of a smooth sphere.** A flat sheet bent without in-plane stretching is locally developable: its Gaussian curvature is zero. A sphere of radius `r` has positive Gaussian curvature `1/r²`, so an unstretched flat sheet cannot smoothly become a spherical patch. In a modular lamp, seams, openings, overlap, and localized deformation let the collection approximate a rounded shell. [MIT geometric modeling text: developable surfaces](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node190.html)

Material thickness also matters. For a homogeneous isotropic elastic sheet, the classical bending rigidity is:

$$
D=\frac{Yt^3}{12(1-\nu^2)},
$$

where `Y` is Young's modulus, `t` thickness, and `ν` Poisson's ratio. Doubling thickness increases this rigidity eightfold. Real paper also has grain direction, permanent creasing, and moisture effects, so this formula is a starting approximation rather than a complete paper model. [Princeton, Mechanics of Soft Materials, lecture 5, slide 8](https://www.princeton.edu/~akosmrlj/MAE545_S2018/lecture5_slides.pdf)

**Different versions can come from changing either the connection pattern or the module itself.** I would explore these changes separately so each experiment has a clear interpretation:

| Change | What it lets us explore | What needs checking |
| --- | --- | --- |
| Scale the complete outline uniformly | Larger or smaller versions of the same assembly | The same sheet thickness changes relative flexibility; small hooks may stop working |
| Change the connection graph | Different symmetries, proportions, and piece counts | Global closure and which cluster sizes the hooks accommodate |
| Change the quadrilateral's proportions or shear | Different preferred bending and overlap | The original connections may become too tight or too loose |
| Change the lobes while retaining notch positions | A different visible pattern and light gaps | Lobe collisions and changes in panel stiffness |
| Mirror every module and the assembly convention | Opposite handedness of the swirling pattern | Consistent hook engagement throughout the assembly |
| Change translucency, colors, or add perforations | Different light distribution and surface pattern | Material stiffness and strength near the connections |
| Leave a designed opening | A dome or shade with an open bottom | Boundary support and revised topology |

These are proposed experiments, not established outcomes for the supplied template. In particular, stretching a flat template vertically does not guarantee a proportionally taller assembled lamp. Its equilibrium shape depends on all the connections.

For a parametric drawing, four notch-root anchors are a better starting point than the outside bounding box. A convenient parallelogram family is:

$$
q_0=(0,0),\quad q_1=(L,0),\quad
q_2=(L+S\cos\theta,S\sin\theta),\quad
q_3=(S\cos\theta,S\sin\theta).
$$

Here `L` and `S` control adjacent anchor distances and `θ` controls shear. A model inspired by the unequal-side mechanism starts with `L > S`; the actual values should come from a successful template. If the supplied outline is not exactly a parallelogram, retain four independent anchor coordinates instead of forcing it into this family.

Around those anchors, define the hook openings, neck widths, notch depths, tip radii, and lobe bulges independently. Cubic Bézier segments give a compact representation of the flowing outline:

$$
B(t)=(1-t)^3P_0+3(1-t)^2tP_1+3(1-t)t^2P_2+t^3P_3,
\qquad 0\leq t\leq1.
$$

`P0` and `P3` are endpoints; `P1` and `P2` control the endpoint tangents and bulge. Consecutive segments can share endpoints and aligned tangent directions to produce smooth joins. [UCLA: Bézier curve properties](https://www.math.ucla.edu/~baker/149.1.02w/handouts/bb_bezier/node6.html)

**For this project, I would begin with a measured template and a physical prototype, then build the generator.** A useful sequence is:

1. Trace the supplied outline as one closed vector contour. Set a real dimension, identify the four notch roots, and preserve the hook mouths. Check that the trace has not closed a narrow notch or introduced a self-intersection.
2. Cut a small batch and test local three- and four-piece clusters. Record the material, thickness, grain orientation, and whether the hooks engage without permanent damage.
3. Assemble the specified 16-piece version and record every connection. Label the pieces and corners, take photographs from several sides, and count the clusters. The supplied image alone is insufficient to reconstruct every hidden connection.
4. Parameterize the successful outline. First vary overall scale and lobe shape, then alter anchor proportions or try another connection graph. Keep a record of which combinations actually close and retain their shape.
5. Export the cut pattern with assembly labels and a scale reference. Keep the unmodified successful outline as the baseline for comparison.

OpenSCAD can generate a sampled 2D polygon and export SVG or DXF; a small native JavaScript program could also generate SVG curves and the connection labels directly. The latter fits this repository's preference for JavaScript. [OpenSCAD command-line documentation: output formats](https://files.openscad.org/documentation/manual/Using_OpenSCAD_in_a_command_line_environment.html)

For a later predictive 3D preview, use a deformable sheet model with stretching, bending, joint constraints, and contact between pieces. Placing rigid copies around a sphere would only illustrate an assumed arrangement. Discrete-shell simulation is an established approach to flexible sheets, including paper, but accurate hook contact and material calibration would still be project-specific work. [Grinspun et al., Discrete Shells, 2003](https://www.cs.columbia.edu/cg/pdfs/10_ds.pdf)

The first concrete deliverable should therefore be a **dimensioned vector template plus a labelled 16-piece connection map**. Together they would provide a reliable basis for generating variants. The research establishes useful mathematical models; the supplied outline's fit, exact assembled dimensions, and stability remain to be measured in a prototype.
