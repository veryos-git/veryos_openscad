// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

import { a_o_parameter, f_o_parameters, f_o_render, f_o_response } from "./server.js";

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
