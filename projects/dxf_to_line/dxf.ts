// DXF parsing, loop assembly, and helpers for morph-mode pre-processing.
//
// Dependency: npm:dxf-parser@1.1.2 — pinned. Best-known JS DXF library that
// exposes LWPOLYLINE bulge, POLYLINE, ARC, CIRCLE, LINE and SPLINE control
// points through one uniform object model and runs under Deno's npm
// compatibility layer without Node APIs.
//
// Pipeline:
//   1. parse with dxf-parser
//   2. convert each supported entity to a polyline (list of [x,y]),
//      discretising arcs / circles / bulges to the requested chord tolerance
//   3. stitch entities into one or more closed loops:
//        - already-closed entities (CIRCLE, closed LWPOLYLINE, closed
//          POLYLINE) become loops on their own
//        - open entities are greedily chained by endpoint proximity
//   4. dedupe each loop, verify closure, force CCW via shoelace
//
// Public API:
//   parseDxf(text, {lineWidth}) -> { loops, minEdgeLen, bboxDiagonal }
//   resample(pts, n)            -> n points spaced equally along arc length
//   alignRotation(a, b)         -> b rotated to minimise sum-of-squared
//                                  point-to-point distance against a
//   polygonArea(pts)            -> unsigned area via shoelace

import DxfParser from "npm:dxf-parser@1.1.2";

export type Point = [number, number];

export interface ParseOptions {
    lineWidth: number;
}

export interface ParseResult {
    loops: Point[][];
    minEdgeLen: number;
    bboxDiagonal: number;
}

interface Entity {
    handle: string;
    type: string;
    pts: Point[];
    closed: boolean;
}

function dist(a: Point, b: Point): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function signedArea(pts: Point[]): number {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
    }
    return a / 2;
}

export function polygonArea(pts: Point[]): number {
    return Math.abs(signedArea(pts));
}

// Discretise an arc (CCW from startA to endA, both radians) into n+1 points
// with chord-height <= chordTol.
function discretizeArc(
    cx: number, cy: number, r: number,
    startA: number, endA: number,
    chordTol: number,
): Point[] {
    let sweep = endA - startA;
    while (sweep <= 0) sweep += 2 * Math.PI;
    const ratio = Math.max(-1, Math.min(1, 1 - chordTol / r));
    const dtheta = 2 * Math.acos(ratio);
    const eff = Number.isFinite(dtheta) && dtheta > 1e-6 ? dtheta : Math.PI / 16;
    const n = Math.max(1, Math.ceil(sweep / eff));
    const out: Point[] = [];
    for (let i = 0; i <= n; i++) {
        const t = startA + sweep * (i / n);
        out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    return out;
}

// Full-circle discretisation — closed loop (no duplicate final vertex),
// minimum 8 segments.
function discretizeCircle(
    cx: number, cy: number, r: number, chordTol: number,
): Point[] {
    const ratio = Math.max(-1, Math.min(1, 1 - chordTol / r));
    const dtheta = 2 * Math.acos(ratio);
    const eff = Number.isFinite(dtheta) && dtheta > 1e-6 ? dtheta : Math.PI / 4;
    const n = Math.max(8, Math.ceil(2 * Math.PI / eff));
    const out: Point[] = [];
    for (let i = 0; i < n; i++) {
        const t = (2 * Math.PI * i) / n;
        out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    return out;
}

// LWPOLYLINE / POLYLINE bulge: segment v0 -> v1 is an arc with bulge =
// tan(sweep / 4), positive CCW. Returns INTERMEDIATE points only (excludes
// v0 and v1); callers append v1 themselves.
function bulgeSegment(
    v0: Point, v1: Point, bulge: number, chordTol: number,
): Point[] {
    if (Math.abs(bulge) < 1e-9) return [];
    const chordLen = dist(v0, v1);
    if (chordLen < 1e-12) return [];
    const sweep = 4 * Math.atan(bulge);
    const r = chordLen / (2 * Math.sin(Math.abs(sweep) / 2));
    const mx = (v0[0] + v1[0]) / 2;
    const my = (v0[1] + v1[1]) / 2;
    const dx = (v1[0] - v0[0]) / chordLen;
    const dy = (v1[1] - v0[1]) / chordLen;
    const side = bulge > 0 ? 1 : -1;
    const px = -dy * side;
    const py = dx * side;
    const h = r * Math.cos(Math.abs(sweep) / 2);
    const cx = mx + px * h;
    const cy = my + py * h;
    const startA = Math.atan2(v0[1] - cy, v0[0] - cx);
    const ratio = Math.max(-1, Math.min(1, 1 - chordTol / r));
    const dtheta = 2 * Math.acos(ratio);
    const eff = Number.isFinite(dtheta) && dtheta > 1e-6 ? dtheta : Math.PI / 16;
    const n = Math.max(1, Math.ceil(Math.abs(sweep) / eff));
    const out: Point[] = [];
    for (let i = 1; i < n; i++) {
        const t = startA + sweep * (i / n);
        out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    return out;
}

function convertEntity(e: any, lineWidth: number): Entity | null {
    const handle: string = e.handle ?? "(no handle)";
    const chordTol = Math.max(0.1 * lineWidth, 1e-3);

    switch (e.type) {
        case "LINE": {
            const a = e.vertices?.[0] ?? e.startPoint;
            const b = e.vertices?.[1] ?? e.endPoint;
            if (!a || !b) return null;
            return {
                handle, type: e.type, closed: false,
                pts: [[a.x, a.y], [b.x, b.y]],
            };
        }
        case "LWPOLYLINE":
        case "POLYLINE": {
            const verts = e.vertices;
            if (!Array.isArray(verts) || verts.length < 2) return null;
            const isClosed = !!e.shape || !!e.closed;
            const pts: Point[] = [];
            const n = verts.length;
            const limit = isClosed ? n : n - 1;
            for (let i = 0; i < n; i++) {
                const v = verts[i];
                pts.push([v.x, v.y]);
                if (i < limit) {
                    const nxt = verts[(i + 1) % n];
                    const bulge = Number(v.bulge) || 0;
                    if (Math.abs(bulge) > 1e-9) {
                        pts.push(...bulgeSegment(
                            [v.x, v.y], [nxt.x, nxt.y], bulge, chordTol,
                        ));
                    }
                }
            }
            return { handle, type: e.type, closed: isClosed, pts };
        }
        case "ARC": {
            if (!e.center) return null;
            return {
                handle, type: e.type, closed: false,
                pts: discretizeArc(
                    e.center.x, e.center.y, e.radius,
                    e.startAngle, e.endAngle, chordTol,
                ),
            };
        }
        case "CIRCLE": {
            if (!e.center) return null;
            return {
                handle, type: e.type, closed: true,
                pts: discretizeCircle(e.center.x, e.center.y, e.radius, chordTol),
            };
        }
        case "SPLINE": {
            const cp = e.controlPoints;
            if (!Array.isArray(cp) || cp.length < 2) {
                throw new Error(
                    `SPLINE handle ${handle} has no control points; cannot discretise.`,
                );
            }
            const pts: Point[] = cp.map((p: any) => [p.x, p.y] as Point);
            const isClosed = !!e.closed;
            return { handle, type: e.type, closed: isClosed, pts };
        }
        default:
            return null;
    }
}

function stitchAll(entities: Entity[]): { loops: Point[][]; tol: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of entities) {
        for (const [x, y] of e.pts) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    const diag = Math.hypot(maxX - minX, maxY - minY);
    const tol = Math.max(1e-4 * diag, 1e-9);

    const loops: Point[][] = [];
    for (const e of entities) if (e.closed) loops.push(e.pts.slice());

    const open = entities.filter((e) => !e.closed).slice();

    while (open.length > 0) {
        const seed = open.shift()!;
        const chain = seed.pts.slice();
        const chainHandles = [`${seed.type}:${seed.handle}`];

        let progress = true;
        while (progress && open.length > 0) {
            progress = false;
            const head = chain[0];
            const tail = chain[chain.length - 1];
            for (let i = 0; i < open.length; i++) {
                const e = open[i];
                const eh = e.pts[0];
                const et = e.pts[e.pts.length - 1];
                let consumed = false;
                if (dist(tail, eh) <= tol) {
                    chain.push(...e.pts.slice(1));
                    consumed = true;
                } else if (dist(tail, et) <= tol) {
                    chain.push(...e.pts.slice(0, -1).reverse());
                    consumed = true;
                } else if (dist(head, eh) <= tol) {
                    chain.unshift(...e.pts.slice(1).reverse());
                    consumed = true;
                } else if (dist(head, et) <= tol) {
                    chain.unshift(...e.pts.slice(0, -1));
                    consumed = true;
                }
                if (consumed) {
                    open.splice(i, 1);
                    chainHandles.push(`${e.type}:${e.handle}`);
                    progress = true;
                    break;
                }
            }
            if (dist(chain[0], chain[chain.length - 1]) <= tol) break;
        }

        if (dist(chain[0], chain[chain.length - 1]) > tol) {
            throw new Error(
                `Could not close a chain (entities: ${chainHandles.join(", ")}); ` +
                `gap = ${dist(chain[0], chain[chain.length - 1]).toExponential(3)}`,
            );
        }
        loops.push(chain);
    }

    return { loops, tol };
}

export function parseDxf(text: string, opts: ParseOptions): ParseResult {
    const parser = new (DxfParser as any)();
    let parsed: any;
    try {
        parsed = parser.parseSync(text);
    } catch (e) {
        throw new Error(`DXF parse failed: ${(e as Error).message}`);
    }
    if (!parsed || !Array.isArray(parsed.entities)) {
        throw new Error("DXF has no entities section.");
    }

    const entities: Entity[] = [];
    for (const raw of parsed.entities) {
        const ent = convertEntity(raw, opts.lineWidth);
        if (ent) entities.push(ent);
    }
    if (entities.length === 0) {
        throw new Error("No supported entities found in DXF.");
    }

    const { loops: rawLoops, tol } = stitchAll(entities);
    if (rawLoops.length === 0) {
        throw new Error("No closed loops found in DXF.");
    }

    const loops: Point[][] = [];
    for (const loop of rawLoops) {
        const deduped: Point[] = [];
        for (const p of loop) {
            const prev = deduped[deduped.length - 1];
            if (!prev || dist(prev, p) > tol) deduped.push(p);
        }
        if (
            deduped.length > 1 &&
            dist(deduped[0], deduped[deduped.length - 1]) <= tol
        ) {
            deduped.pop();
        }
        if (deduped.length < 3) {
            throw new Error(
                `A loop has only ${deduped.length} vertices after discretisation.`,
            );
        }
        if (signedArea(deduped) < 0) deduped.reverse();
        loops.push(deduped);
    }

    let minEdge = Infinity;
    for (const loop of loops) {
        for (let i = 0; i < loop.length; i++) {
            const j = (i + 1) % loop.length;
            const d = dist(loop[i], loop[j]);
            if (d < minEdge) minEdge = d;
        }
    }
    let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (const loop of loops) {
        for (const [x, y] of loop) {
            if (x < mnx) mnx = x; if (x > mxx) mxx = x;
            if (y < mny) mny = y; if (y > mxy) mxy = y;
        }
    }

    return {
        loops,
        minEdgeLen: minEdge,
        bboxDiagonal: Math.hypot(mxx - mnx, mxy - mny),
    };
}

// Resample a closed polygon to n points spaced equally along arc length.
// The output is a polygon-on-the-polygon: points lie on the original edges.
export function resample(pts: Point[], n: number): Point[] {
    const N = pts.length;
    const segLen: number[] = new Array(N);
    let total = 0;
    for (let i = 0; i < N; i++) {
        segLen[i] = dist(pts[i], pts[(i + 1) % N]);
        total += segLen[i];
    }
    if (total <= 0) throw new Error("resample: zero-length polygon");
    const step = total / n;
    const out: Point[] = [];
    let i = 0;
    let traveled = 0;
    for (let k = 0; k < n; k++) {
        const target = k * step;
        while (i < N - 1 && traveled + segLen[i] < target) {
            traveled += segLen[i];
            i++;
        }
        const remaining = target - traveled;
        const t = segLen[i] > 0 ? Math.min(1, remaining / segLen[i]) : 0;
        const a = pts[i];
        const b = pts[(i + 1) % N];
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    return out;
}

// Rotate b cyclically so its vertex order best matches a (minimises the
// sum of squared point-to-point distances). a and b must be the same length.
export function alignRotation(a: Point[], b: Point[]): Point[] {
    const N = a.length;
    if (b.length !== N) throw new Error("alignRotation: length mismatch");
    let bestS = 0;
    let bestD = Infinity;
    for (let s = 0; s < N; s++) {
        let d = 0;
        for (let i = 0; i < N; i++) {
            const j = (i + s) % N;
            const dx = a[i][0] - b[j][0];
            const dy = a[i][1] - b[j][1];
            d += dx * dx + dy * dy;
        }
        if (d < bestD) {
            bestD = d;
            bestS = s;
        }
    }
    return [...b.slice(bestS), ...b.slice(0, bestS)];
}
