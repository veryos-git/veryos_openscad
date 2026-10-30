/*
dxf_to_line — DXF → OpenSCAD constant-width wall generator.

Run:
    cd projects/dxf_to_line
    deno run --allow-net --allow-read server.ts

Then open http://localhost:8080/ .

If your Deno version asks for more during npm resolution:
    deno run -A server.ts

Supported DXF entities: LINE, LWPOLYLINE (with bulge), POLYLINE (with bulge),
ARC, CIRCLE, SPLINE.

Two modes (chosen automatically by loop count in the DXF):
  - 1 closed loop  -> n_rings concentric walls, each shrunk inward by
                      (margin + line_width) via OpenSCAD's offset().
  - 2 closed loops -> n_rings walls morphed point-by-point from the smaller
                      loop (innermost ring, t = 0) to the larger loop
                      (outermost ring, t = 1). Loops are resampled to a
                      common vertex count along arc length and rotationally
                      aligned by minimum sum-of-squared distance.

DXFs containing 0 or 3+ closed loops are rejected.

Units:
    Coordinates pass through unchanged. line_width, height and margin are
    in the same units as the DXF; this tool assumes the DXF is authored in
    millimetres.

Known limitations:
    - SPLINE is approximated by its control polygon (true NURBS sampling is
      not implemented); tight splines may deviate from the design intent.
    - No 3D preview, no persistence, no unit conversion.
    - Morph alignment uses rotation only (no scaling, no centring); place
      both loops with the same intended centre in your CAD tool.
*/

import { alignRotation, parseDxf, polygonArea, resample } from "./dxf.ts";
import { emitMorph, emitSinglePath } from "./scad.ts";

const HOST = "0.0.0.0";
const PORT = 8080;
const MORPH_SAMPLES = 128;

const INDEX_HTML = await Deno.readTextFile(new URL("./index.html", import.meta.url));

function jsonError(status: number, message: string): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
    });
}

async function handleConvert(req: Request): Promise<Response> {
    let form: FormData;
    try {
        form = await req.formData();
    } catch (e) {
        return jsonError(400, `Could not read multipart body: ${(e as Error).message}`);
    }

    const file = form.get("dxf");
    if (!(file instanceof File) || file.size === 0) {
        return jsonError(400, "Missing DXF file in field 'dxf'.");
    }

    const lineWidth = Number(form.get("line_width"));
    const height = Number(form.get("height"));
    const margin = Number(form.get("margin"));
    const nRings = Number(form.get("n_rings"));
    const fn = Number(form.get("fn"));
    if (!Number.isFinite(lineWidth) || lineWidth <= 0) {
        return jsonError(400, "line_width must be a positive number.");
    }
    if (!Number.isFinite(height) || height <= 0) {
        return jsonError(400, "height must be a positive number.");
    }
    if (!Number.isFinite(margin) || margin < 0) {
        return jsonError(400, "margin must be >= 0.");
    }
    if (!Number.isFinite(nRings) || nRings < 1 || !Number.isInteger(nRings)) {
        return jsonError(400, "n_rings must be a positive integer.");
    }
    if (!Number.isFinite(fn) || fn < 3 || !Number.isInteger(fn)) {
        return jsonError(400, "$fn must be an integer >= 3.");
    }

    const text = await file.text();
    let parsed;
    try {
        parsed = parseDxf(text, { lineWidth });
    } catch (e) {
        return jsonError(400, e instanceof Error ? e.message : String(e));
    }

    const sourceName = file.name || "(unnamed).dxf";
    const headers: Record<string, string> = {
        "content-type": "text/plain; charset=utf-8",
    };
    if (lineWidth >= 0.5 * parsed.minEdgeLen) {
        headers["x-warning"] =
            `line_width (${lineWidth}) >= 0.5 * min_edge (${parsed.minEdgeLen.toFixed(4)}); ` +
            `offset() may produce self-intersections`;
    }

    let scad: string;
    if (parsed.loops.length === 1) {
        scad = emitSinglePath({
            vertices: parsed.loops[0],
            lineWidth, height, margin, nRings, fn,
            sourceName,
        });
    } else if (parsed.loops.length === 2) {
        const a = resample(parsed.loops[0], MORPH_SAMPLES);
        const b = resample(parsed.loops[1], MORPH_SAMPLES);
        let inner = a, outer = b;
        if (polygonArea(inner) > polygonArea(outer)) {
            [inner, outer] = [outer, inner];
        }
        const outerAligned = alignRotation(inner, outer);
        scad = emitMorph({
            inner, outer: outerAligned,
            lineWidth, height, nRings, fn,
            sourceName,
        });
    } else {
        return jsonError(
            400,
            `Found ${parsed.loops.length} closed loops; expected 1 (concentric mode) or 2 (morph mode).`,
        );
    }

    return new Response(scad, { status: 200, headers });
}

Deno.serve({ hostname: HOST, port: PORT }, async (req) => {
    const url = new URL(req.url);
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        return new Response(INDEX_HTML, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }
    if (req.method === "POST" && url.pathname === "/convert") {
        return await handleConvert(req);
    }
    return new Response("Not found", { status: 404 });
});

console.log(`dxf_to_line listening on http://${HOST}:${PORT}/`);
