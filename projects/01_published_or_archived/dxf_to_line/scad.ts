// Emits OpenSCAD programs.
//
// Two output modes:
//   emitSinglePath - one closed loop becomes n_rings concentric walls,
//                    each shrunk inward by k * (margin + line_width) via
//                    OpenSCAD offset().
//   emitMorph      - two closed loops become n_rings walls morphed point-
//                    by-point from inner (smaller area) to outer (larger).

import type { Point } from "./dxf.ts";

function num(n: number): string {
    return n.toString();
}

function ptsLiteral(pts: Point[]): string {
    return pts
        .map(([x, y]) => `    [${x.toFixed(4)}, ${y.toFixed(4)}]`)
        .join(",\n");
}

export interface SinglePathOptions {
    vertices: Point[];
    lineWidth: number;
    height: number;
    margin: number;
    nRings: number;
    fn: number;
    sourceName: string;
}

export function emitSinglePath(o: SinglePathOptions): string {
    const ts = new Date().toISOString();
    return `// DXF -> concentric polygon walls
// Source:     ${o.sourceName}
// Generated:  ${ts}
// Loops:      1
// Vertices:   ${o.vertices.length}

line_width = ${num(o.lineWidth)};
height     = ${num(o.height)};
margin     = ${num(o.margin)};
n_rings    = ${o.nRings};
$fn        = ${o.fn};

points = [
${ptsLiteral(o.vertices)}
];

linear_extrude(height = height)
    for (k = [0 : n_rings - 1])
        let (off = -k * (margin + line_width))
            difference() {
                offset(r = off) polygon(points);
                offset(r = off - line_width) polygon(points);
            }
`;
}

export interface MorphOptions {
    inner: Point[];
    outer: Point[];
    lineWidth: number;
    height: number;
    nRings: number;
    fn: number;
    sourceName: string;
}

export function emitMorph(o: MorphOptions): string {
    const ts = new Date().toISOString();
    return `// DXF -> morphing polygon walls
// Source:     ${o.sourceName}
// Generated:  ${ts}
// Loops:      2 (inner = smaller area, outer = larger area)
// Samples:    ${o.inner.length} per ring

line_width = ${num(o.lineWidth)};
height     = ${num(o.height)};
n_rings    = ${o.nRings};
$fn        = ${o.fn};

inner_pts = [
${ptsLiteral(o.inner)}
];

outer_pts = [
${ptsLiteral(o.outer)}
];

linear_extrude(height = height)
    for (k = [0 : n_rings - 1])
        let (t = n_rings > 1 ? k / (n_rings - 1) : 0)
            let (pts = [for (i = [0 : len(inner_pts) - 1])
                [
                    inner_pts[i][0] * (1 - t) + outer_pts[i][0] * t,
                    inner_pts[i][1] * (1 - t) + outer_pts[i][1] * t
                ]])
                difference() {
                    polygon(pts);
                    offset(r = -line_width) polygon(pts);
                }
`;
}
