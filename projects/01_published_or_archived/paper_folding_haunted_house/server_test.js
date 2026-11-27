// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

import { a_o_parameter, f_o_parameters, f_o_render, f_o_response, f_o_import_svg } from "./server.js";
import { f_s_svg, f_a_decoration } from "./svg_geometry.js";

function f_assert(b_condition, s_message) {
    if (!b_condition) throw new Error(s_message);
}

function f_check_mesh(a_n_position) {
    const o_edges = new Map();
    const o_neighbours = new Map();
    for (let n = 0; n < a_n_position.length; n += 9) {
        const a_s_point = [0, 3, 6].map((i) => a_n_position.slice(n + i, n + i + 3).map((v) => v.toFixed(5)).join(","));
        for (let i = 0; i < 3; i++) {
            const s_a = a_s_point[i], s_b = a_s_point[(i + 1) % 3];
            const s_edge = [s_a, s_b].sort().join("|");
            o_edges.set(s_edge, (o_edges.get(s_edge) || 0) + 1);
            if (!o_neighbours.has(s_a)) o_neighbours.set(s_a, new Set());
            o_neighbours.get(s_a).add(s_b);
        }
    }
    f_assert(o_edges.size > 0, "Mesh must have edges.");
    f_assert([...o_edges.values()].every((n) => n === 2), "Mesh must be watertight with exactly two faces per edge.");
    const o_visited = new Set();
    const a_s_queue = [o_neighbours.keys().next().value];
    while (a_s_queue.length) {
        const s_point = a_s_queue.pop();
        if (o_visited.has(s_point)) continue;
        o_visited.add(s_point);
        a_s_queue.push(...o_neighbours.get(s_point));
    }
    f_assert(o_visited.size === o_neighbours.size, "All paper geometry must stay connected.");
}

Deno.test("web controls read defaults from the SCAD source and reject unknown values", () => {
    f_assert(a_o_parameter.length === 11, "Expected all eleven editable model parameters.");
    f_assert(f_o_parameters({}).house_size === 50, "Default floor must be 50 mm.");
    for (const o_bad of [null, [], { house_size: "50" }, { house_size: 1 }, { roof_style: "missing" }, { output: "cut" }]) {
        let b_rejected = false;
        try { f_o_parameters(o_bad); } catch { b_rejected = true; }
        f_assert(b_rejected, `Should reject ${JSON.stringify(o_bad)}`);
    }
});

function f_tree(s_d, s_view_box = "10 20 100 140") {
    return { s_tag: "svg", o_attribute: { viewBox: s_view_box }, a_o_child: [
        { s_tag: "path", o_attribute: { d: s_d }, a_o_child: [] },
    ] };
}

Deno.test("SVG upload preserves asymmetric shapes and compound path holes", async () => {
    const o_f = await f_o_import_svg(f_tree("M20 30H100V50H40V75H85V95H40V150H20Z"));
    f_assert(Math.abs(o_f.n_ratio - 1.5) < .001, "Imported proportions must exclude blank viewBox margins.");
    f_assert(o_f.a_a_n_path.length === 1, "F silhouette must be one contour.");
    f_assert(o_f.a_a_n_point.some(([x, y]) => Math.abs(x + .5) < .001 && Math.abs(y + .75) < .001), "Preserve the upright left stem.");
    const o_ring = await f_o_import_svg(f_tree("M0 0H40V40H0Z M10 10V30H30V10Z", "0 0 40 40"));
    f_assert(o_ring.a_a_n_path.length === 2, "Keep compound holes instead of filling them.");
    const o_curve = await f_o_import_svg(f_tree("M0 20C0 0 40 0 40 20C40 40 0 40 0 20Z", "0 0 40 40"));
    f_assert(o_curve.a_a_n_point.length > 10, "Resolve curved paths into cuttable polygons.");
    const o_evenodd = f_tree("M0 0H40V40H0Z M10 10H30V30H10Z", "0 0 40 40");
    o_evenodd.a_o_child[0].o_attribute["fill-rule"] = "evenodd";
    f_assert((await f_o_import_svg(o_evenodd)).a_a_n_path.length === 2, "Respect even-odd compound paths with matching winding.");
    const o_references = { s_tag: "svg", o_attribute: { viewBox: "0 0 60 40" }, a_o_child: [
        { s_tag: "defs", o_attribute: {}, a_o_child: [{ s_tag: "rect", o_attribute: { id: "tile", x: "0", y: "0", width: "10", height: "20" }, a_o_child: [] }] },
        { s_tag: "use", o_attribute: { "xlink:href": "#tile", x: "5", y: "5" }, a_o_child: [] },
        { s_tag: "use", o_attribute: { "xlink:href": "#tile", x: "30", y: "5" }, a_o_child: [] },
    ] };
    f_assert((await f_o_import_svg(o_references)).a_a_n_path.length === 2, "Resolve local SVG references without importing unused definitions.");
});

Deno.test("custom-only walls do not inherit unused standard-window size constraints", async () => {
    const o_result = await f_o_render({ house_size: 30, wall_windows: [false, false, false, false] });
    f_check_mesh(o_result.a_n_position);
    f_assert((o_result.s_svg.match(/\bM /g) || []).length === 1, "All standard windows are disabled.");
});

Deno.test("each wall gets its own decoration with outside orientation and matching exports", async () => {
    const o_geometry = await f_o_import_svg(f_tree("M20 30H100V50H40V75H85V95H40V150H20Z"));
    for (let n_wall = 0; n_wall < 4; n_wall++) {
        const a_b_window = [true, true, true, true]; a_b_window[n_wall] = false;
        const o_result = await f_o_render({
            wall_windows: a_b_window, editor_wall: n_wall,
            decorations: [{ ...o_geometry, n_wall, n_x: 17, n_y: 25, n_width: 12 }],
        });
        f_check_mesh(o_result.a_n_position);
        f_assert((o_result.s_svg.match(/\bM /g) || []).length === 14, "Replace only this wall's four panes with one decoration.");
        f_assert((o_result.s_wall_svg.match(/\bM /g) || []).length === 2, "Selected wall must have one outside contour and the F cutout.");
        const s_hole = o_result.s_wall_svg.split(/\bM /)[2];
        const a_a_point = [...s_hole.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((a) => [Number(a[1]), Number(a[2])]);
        f_assert(a_a_point.some(([x, y]) => Math.abs(x - 11) < .01 && Math.abs(y + 16) < .01), "F stem stays on the left from outside.");
        f_assert(a_a_point.some(([x, y]) => Math.abs(x - 23) < .01 && Math.abs(y + 34) < .01), "Width, height, and position remain in millimetres.");
        f_assert(!a_a_point.some(([x, y]) => Math.abs(x - 23) < .01 && Math.abs(y + 16) < .01), "Do not mirror the F in the wall editor.");
    }
});

Deno.test("decorations rotate clockwise as seen from outside", async () => {
    const o_geometry = await f_o_import_svg(f_tree("M20 30H100V50H40V75H85V95H40V150H20Z"));
    const o_result = await f_o_render({
        wall_windows: [false, true, true, true],
        decorations: [{ ...o_geometry, n_wall: 0, n_x: 25, n_y: 25, n_width: 12, n_rotation: 90 }],
    });
    f_check_mesh(o_result.a_n_position);
    const s_hole = o_result.s_wall_svg.split(/\bM /)[2];
    const a_a_point = [...s_hole.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((a) => [Number(a[1]), Number(a[2])]);
    const f_has = (n_x, n_y) => a_a_point.some(([x, y]) => Math.abs(x - n_x) < .01 && Math.abs(y + n_y) < .01);
    // The stem foot's corners (19,16) and (22,16) both swing to the upper left.
    f_assert(f_has(16, 31) && f_has(16, 28), "Stem foot turns clockwise to the upper left.");
    f_assert(!f_has(34, 22), "Counterclockwise rotation would put the stem foot on the right.");
    f_assert(!f_has(19, 16), "Unrotated F must not remain.");
});

Deno.test("large decorations preserve floor folds, glue borders and connected walls", async () => {
    const o_geometry = await f_o_import_svg(f_tree("M0 0H10V10H0Z", "0 0 10 10"));
    const o_result = await f_o_render({
        wall_windows: [false, false, false, false],
        decorations: [0, 1, 2, 3].map((n_wall) => ({ ...o_geometry, n_wall, n_x: 25, n_y: 27.5, n_width: 200 })),
    });
    f_check_mesh(o_result.a_n_position);
    f_assert(o_result.s_svg.includes('width="196mm" height="196mm"'), "Imported shapes must never extend the cutting outline.");
    f_assert((o_result.s_svg.match(/\bM /g) || []).length === 5, "All four protected wall frames stay connected.");
});

Deno.test("SVG upload refuses active content, external references, and invalid polygon indices", () => {
    for (const o_tree of [
        { s_tag: "svg", o_attribute: {}, a_o_child: [{ s_tag: "script", o_attribute: {}, a_o_child: [] }] },
        { s_tag: "svg", o_attribute: { onload: "alert(1)" }, a_o_child: [] },
        { s_tag: "svg", o_attribute: {}, a_o_child: [{ s_tag: "use", o_attribute: { "xlink:href": "file:///tmp/private.svg" }, a_o_child: [] }] },
        { s_tag: "svg", o_attribute: {}, a_o_child: [{ s_tag: "use", o_attribute: { id: "loop", "xlink:href": "#loop" }, a_o_child: [] }] },
    ]) {
        let b_rejected = false;
        try { f_s_svg(o_tree); } catch { b_rejected = true; }
        f_assert(b_rejected, "Reject non-geometry SVG content.");
    }
    let b_rejected = false;
    try { f_a_decoration([{ n_wall: 0, n_x: 20, n_y: 20, n_width: 10, a_a_n_point: [[0, 0], [1, 0], [0, 1]], a_a_n_path: [[0, 1, 30]] }]); }
    catch { b_rejected = true; }
    f_assert(b_rejected, "Polygon indices must reference existing points.");
    for (const v_rotation of ["90", 400, NaN]) {
        b_rejected = false;
        try { f_a_decoration([{ n_wall: 0, n_x: 20, n_y: 20, n_width: 10, n_rotation: v_rotation, a_a_n_point: [[0, 0], [1, 0], [0, 1]], a_a_n_path: [[0, 1, 2]] }]); }
        catch { b_rejected = true; }
        f_assert(b_rejected, `Reject rotation ${v_rotation}.`);
    }
});

Deno.test("every roof renders connected folded geometry and the correct window cutouts", async () => {
    for (const s_roof of ["mixed", "gable", "crooked", "stepped", "flat"]) {
        for (const s_window of ["cross", "plain"]) {
            const o_result = await f_o_render({ roof_style: s_roof, window_style: s_window });
            f_check_mesh(o_result.a_n_position);
            f_assert((o_result.s_svg.match(/\bM /g) || []).length === (s_window === "cross" ? 17 : 5),
                `${s_roof}/${s_window}: expected one outline plus the window panes.`);
            const n_size = s_roof === "flat" ? 160 : 196;
            f_assert(o_result.s_svg.includes(`width="${n_size}mm" height="${n_size}mm"`), "SVG must retain millimetre dimensions.");
            f_assert(!o_result.s_svg.includes("<line"), "Score guides must not be downloaded as cuts.");
        }
    }
});

Deno.test("resized house and zero-height roofs update the real exports", async () => {
    const o_large = await f_o_render({ house_size: 70, wall_height: 65, roof_height: 20, paper_thickness: 0.5 });
    f_check_mesh(o_large.a_n_position);
    f_assert(o_large.s_svg.includes('width="240mm" height="240mm"'), "Resized template must be 240 mm.");
    const o_zero = await f_o_render({ roof_height: 0 });
    f_assert(o_zero.s_svg.includes('width="160mm" height="160mm"'), "Zero roof height must remove silhouettes.");
});

Deno.test("API reports incompatible dimensions and refuses cross-origin render requests", async () => {
    const o_bad = await f_o_response(new Request("http://127.0.0.1:8040/api/render", {
        method: "POST", body: JSON.stringify({ window_width: 60 }),
    }));
    f_assert(o_bad.status === 400, "Incompatible windows must fail.");
    f_assert((await o_bad.json()).error.includes("Windows must leave"), "Return the useful SCAD assertion.");
    const o_foreign = await f_o_response(new Request("http://127.0.0.1:8040/api/render", {
        method: "POST", headers: { origin: "https://example.com" }, body: "{}",
    }));
    f_assert(o_foreign.status === 403, "Only same-origin browser requests may render.");
});
