// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

// Local app; requires Deno and OpenSCAD. See readme.md for the launch command.
const o_source_url = new URL("./paper_folding_haunted_house.scad", import.meta.url);
const s_source = await Deno.readTextFile(o_source_url);
const s_directory = decodeURIComponent(new URL(".", import.meta.url).pathname);

// Read defaults, ranges and choices directly from the OpenSCAD Customizer fields.
export const a_o_parameter = [...s_source.matchAll(
    /^([a-z_]+)\s*=\s*(.+?);\s*\/\/\s*\[([^\]]+)\]/gm,
)].filter((a_s_match) => a_s_match[1] !== "output").map((a_s_match) => {
    const [, s_name, s_default, s_options] = a_s_match;
    const v_default = JSON.parse(s_default);
    return {
        s_name,
        v_default,
        ...(typeof v_default === "number"
            ? { a_n_range: s_options.split(":").map(Number) }
            : { a_s_option: s_options.split(",").map((s) => s.trim()) }),
    };
});

export function f_o_parameters(o_input) {
    if (!o_input || typeof o_input !== "object" || Array.isArray(o_input)) {
        throw new Error("Expected a settings object.");
    }
    for (const s_name of Object.keys(o_input)) {
        if (!a_o_parameter.some((o) => o.s_name === s_name)) {
            throw new Error(`Unknown parameter: ${s_name}`);
        }
    }
    return Object.fromEntries(a_o_parameter.map((o) => {
        const v_value = Object.hasOwn(o_input, o.s_name) ? o_input[o.s_name] : o.v_default;
        if (o.a_n_range) {
            const [n_min, , n_max] = o.a_n_range;
            if (typeof v_value !== "number" || !Number.isFinite(v_value)
                || v_value < n_min || v_value > n_max) {
                throw new Error(`${o.s_name} must be between ${n_min} and ${n_max} mm.`);
            }
        } else if (!o.a_s_option.includes(v_value)) {
            throw new Error(`Invalid choice for ${o.s_name}.`);
        }
        return [o.s_name, v_value];
    }));
}

async function f_render(s_path, s_output, o_parameters) {
    const a_s_argument = ["--hardwarnings", "-o", s_path, "-D", `output=${JSON.stringify(s_output)}`];
    if (s_path.endsWith(".stl")) a_s_argument.push("--export-format", "binstl");
    for (const [s_name, v_value] of Object.entries(o_parameters)) {
        a_s_argument.push("-D", `${s_name}=${JSON.stringify(v_value)}`);
    }
    a_s_argument.push(decodeURIComponent(o_source_url.pathname));
    const o_process = new Deno.Command("openscad", {
        args: a_s_argument,
        env: { QT_QPA_PLATFORM: "offscreen" },
        stdout: "piped",
        stderr: "piped",
    }).spawn();
    const n_timeout = setTimeout(() => {
        try { o_process.kill("SIGKILL"); } catch { /* Already finished. */ }
    }, 30000);
    try {
        const o_result = await o_process.output();
        const s_log = new TextDecoder().decode(o_result.stderr);
        // OpenSCAD 2021 can report an assertion failure with exit status zero.
        if (!o_result.success || /ERROR:|WARNING:/.test(s_log)) {
            console.error(s_log);
            const s_assertion = s_log.match(/failed: "([^"]+)"/);
            throw new Error(s_assertion?.[1] || "OpenSCAD could not render these settings. Check the server log.");
        }
    } finally {
        clearTimeout(n_timeout);
    }
}

export async function f_o_render(o_input) {
    const o_parameters = f_o_parameters(o_input);
    const s_temp = await Deno.makeTempDir({ dir: "/tmp", prefix: "haunted-house-" });
    try {
        // Wait for both processes before removing their shared temporary folder.
        const a_o_result = await Promise.allSettled([
            f_render(`${s_temp}/cut.svg`, "cut", o_parameters),
            f_render(`${s_temp}/folded.stl`, "assembled", o_parameters),
        ]);
        for (const o_result of a_o_result) {
            if (o_result.status === "rejected") throw o_result.reason;
        }
        const s_svg = await Deno.readTextFile(`${s_temp}/cut.svg`);
        const a_n_stl = await Deno.readFile(`${s_temp}/folded.stl`);
        const o_view = new DataView(a_n_stl.buffer, a_n_stl.byteOffset, a_n_stl.byteLength);
        const n_triangle = o_view.getUint32(80, true);
        if (a_n_stl.byteLength !== 84 + n_triangle * 50) throw new Error("Invalid preview mesh.");
        const a_n_position = [];
        for (let n_face = 0; n_face < n_triangle; n_face++) {
            for (let n_coordinate = 0; n_coordinate < 9; n_coordinate++) {
                a_n_position.push(o_view.getFloat32(84 + n_face * 50 + 12 + n_coordinate * 4, true));
            }
        }
        return { s_svg, a_n_position, o_parameters };
    } finally {
        await Deno.remove(s_temp, { recursive: true });
    }
}

let b_rendering = false;
export async function f_o_response(o_request) {
    const o_url = new URL(o_request.url);
    if (o_request.method === "GET") {
        if (o_url.pathname === "/api/parameters") return Response.json(a_o_parameter);
        const o_files = { "/": ["index.html", "text/html"], "/app.js": ["app.js", "text/javascript"] };
        const a_s_file = o_files[o_url.pathname];
        if (a_s_file) {
            return new Response(await Deno.readTextFile(`${s_directory}${a_s_file[0]}`), {
                headers: { "content-type": `${a_s_file[1]}; charset=utf-8` },
            });
        }
    }
    if (o_request.method === "POST" && o_url.pathname === "/api/render") {
        const s_origin = o_request.headers.get("origin");
        if (s_origin && s_origin !== o_url.origin) return new Response("Forbidden", { status: 403 });
        if (b_rendering) return Response.json({ error: "Another render is running. Try again shortly." }, { status: 503 });
        b_rendering = true;
        try {
            return Response.json(await f_o_render(await o_request.json()));
        } catch (o_error) {
            console.error(o_error);
            return Response.json({ error: o_error.message }, { status: 400 });
        } finally {
            b_rendering = false;
        }
    }
    return new Response("Not found", { status: 404 });
}

if (import.meta.main) {
    Deno.serve({ hostname: "127.0.0.1", port: 8040 }, f_o_response);
    console.log("Haunted house designer: http://127.0.0.1:8040");
    console.log(JSON.stringify({ url: "http://127.0.0.1:8040" }));
}
