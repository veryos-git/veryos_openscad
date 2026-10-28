// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

import assert from "node:assert/strict";
import test from "node:test";
import { a_o_parameter, f_o_parameters, f_o_render, f_o_response } from "./server.js";

test("controls are read from the OpenSCAD Customizer with valid defaults", () => {
    assert.equal(a_o_parameter.length, 15);
    const o_default = f_o_parameters({});
    assert.equal(o_default.lantern_width, 45);
    assert.equal(o_default.wall_height, 65);
    assert.equal(o_default.window_style, "generic");
    assert.equal(o_default.fold_dash_length, 2.6);
    assert.equal(o_default.output, undefined);
    assert.deepEqual(
        a_o_parameter.find((o) => o.s_name === "fold_dash_length").a_n_range,
        [1, 0.1, 5],
    );
});

test("settings validation rejects unknown, out-of-range and malformed values", () => {
    for (const v_bad of [
        null,
        [],
        "45",
        { lantern_width: "45" },
        { lantern_width: 10 },
        { window_style: "missing" },
        { banana: 1 },
        { output: "cut" },
    ]) {
        assert.throws(() => f_o_parameters(v_bad), undefined, JSON.stringify(v_bad));
    }
});

test("default render produces a connected A4 SVG, perforated folds and a 3D mesh", async () => {
    const o = await f_o_render({});
    assert.equal(o.n_width, 186);
    assert.equal(o.n_height, 166);
    assert.ok(o.n_width <= 210 && o.n_height <= 297, "The default template must fit A4.");
    assert.match(o.s_svg, /<svg[^>]*width="186mm"[^>]*height="166mm"/);
    assert.match(o.s_svg, /fill-rule="evenodd"/);
    assert.match(o.s_fold_svg, /<svg[^>]*width="186mm"[^>]*height="166mm"/);
    assert.ok((o.s_svg.match(/\bM /g) || []).length > 150, "The net needs its cut contours.");
    assert.ok((o.s_fold_svg.match(/\bM /g) || []).length > 60, "Fold lines must be dashed slits.");
    assert.ok(!o.s_svg.includes("<line"), "Fold guides must be cuts, not overlay lines.");
    assert.equal(o.a_n_position.length, o.n_triangle * 9);
    assert.ok(o.n_triangle > 2000, "The folded mesh should contain real geometry.");
    assert.ok(Buffer.from(o.s_stl, "base64").length === 84 + o.n_triangle * 50);
    const n_max_z = Math.max(...o.a_n_position.filter((_, i) => i % 3 === 2));
    const n_min_x = Math.min(...o.a_n_position.filter((_, i) => i % 3 === 0));
    const n_max_x = Math.max(...o.a_n_position.filter((_, i) => i % 3 === 0));
    assert.ok(n_max_z > 100, "The hanger tab must rise above the roof.");
    assert.ok(n_min_x < -20 && n_max_x > 20, "The folded body must use the full footprint.");
});

test("resized lantern and alternative cutouts rerender the real model", async () => {
    const o = await f_o_render({
        lantern_width: 50,
        wall_height: 70,
        roof_height: 34,
        window_style: "web",
        roof_decoration: "spider",
        window_width: 30,
        window_height: 36,
    });
    assert.equal(o.n_width, 206);
    assert.match(o.s_svg, /width="206mm"/);
    assert.ok((o.s_svg.match(/\bM /g) || []).length > 100);
    assert.ok(o.n_triangle > 2000);
    assert.equal(o.o_parameters.window_style, "web");
});

test("incompatible dimensions fail with the useful SCAD assertion", async () => {
    await assert.rejects(() => f_o_render({ window_width: 44 }), /window must leave/i);
    await assert.rejects(() => f_o_render({ hanger_width: 6, hanger_hole: 8 }), /hanging hole/i);
    await assert.rejects(() => f_o_render({ window_style: "generic", window_width: 30, window_height: 10 }),
        /arched window/i);
});

test("API serves the parameters and refuses foreign or unknown requests", async () => {
    const o_parameters = await f_o_response(new Request("http://127.0.0.1:8055/api/parameters"));
    assert.equal(o_parameters.status, 200);
    assert.equal((await o_parameters.json()).length, 15);

    const o_foreign = await f_o_response(new Request("http://127.0.0.1:8055/api/render", {
        method: "POST",
        headers: { origin: "https://example.com" },
        body: "{}",
    }));
    assert.equal(o_foreign.status, 403);

    const o_unknown = await f_o_response(new Request("http://127.0.0.1:8055/api/render", {
        method: "POST",
        body: JSON.stringify({ banana: 1 }),
    }));
    assert.equal(o_unknown.status, 400);
    assert.match((await o_unknown.json()).error, /Unknown parameter/);

    const o_invalid_json = await f_o_response(new Request("http://127.0.0.1:8055/api/render", {
        method: "POST",
        body: "{",
    }));
    assert.equal(o_invalid_json.status, 400);

    const o_index = await f_o_response(new Request("http://127.0.0.1:8055/"));
    assert.equal(o_index.status, 200);
    assert.match(o_index.headers.get("content-type"), /text\/html/);
});
