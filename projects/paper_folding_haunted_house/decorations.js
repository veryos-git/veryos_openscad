// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

import { f_o_svg_tree } from "./svg_geometry.js";

export function f_o_decorations(f_changed, f_parameters) {
    const f_el = (s) => document.getElementById(s);
    const s_ns = "http://www.w3.org/2000/svg";
    const o_stage = f_el("wall-stage"), o_list = f_el("decoration-list"), o_form = f_el("decoration-settings");
    const o_error = f_el("decoration-error"), o_upload = f_el("upload-svg");
    let a_o_decoration = [], a_b_window = [true, true, true, true];
    let n_wall = 0, n_selected = null, n_next_id = 0, n_upload_revision = 0;
    let s_wall_svg = "", o_drag = null, b_loading = false;
    const f_selected = () => a_o_decoration.find((o) => o.n_id === n_selected && o.n_wall === n_wall);
    const f_round = (n) => Math.round(n * 10) / 10;
    function f_svg(s_tag, o_attribute = {}) {
        const o = document.createElementNS(s_ns, s_tag);
        for (const [s, v] of Object.entries(o_attribute)) o.setAttribute(s, v);
        return o;
    }
    function f_draw() {
        const o = f_parameters();
        if (!o.house_size) return;
        const n_height = o.wall_height + (o.roof_style === "flat" ? 0 : o.roof_height);
        o_stage.setAttribute("viewBox", `-8 ${-n_height - 8} ${o.house_size + 16} ${n_height + 16}`);
        const o_content = f_svg("g");
        if (s_wall_svg) {
            const o_wall = f_svg("g", { id: "wall-shape" });
            const o_doc = new DOMParser().parseFromString(s_wall_svg, "image/svg+xml");
            for (const o_path of o_doc.querySelectorAll("path")) o_wall.append(f_svg("path", { d: o_path.getAttribute("d") }));
            o_content.append(o_wall);
        }
        o_content.append(f_svg("line", { x1: 0, x2: o.house_size, y1: 0, y2: 0, stroke: "#ce8a3f", "stroke-width": .4, "stroke-dasharray": "2 1" }));
        for (const o_item of a_o_decoration.filter((o) => o.n_wall === n_wall)) {
            const b_selected = o_item.n_id === n_selected;
            const n_width = o_item.n_width, n_height = n_width * o_item.n_ratio;
            const o_group = f_svg("g", { "data-decoration": o_item.n_id });
            o_group.append(f_svg("rect", {
                x: o_item.n_x - n_width / 2, y: -o_item.n_y - n_height / 2, width: n_width, height: n_height,
                fill: "transparent", stroke: b_selected ? "#d58b35" : "transparent", "stroke-width": .45, "stroke-dasharray": "1.5 1",
            }));
            if (b_selected) {
                const s_d = o_item.a_a_n_path.map((a) => a.map((i, n) => {
                    const [x, y] = o_item.a_a_n_point[i];
                    return `${n === 0 ? "M" : "L"}${o_item.n_x + x * n_width},${-o_item.n_y - y * n_width}`;
                }).join(" ") + " Z").join(" ");
                o_group.append(f_svg("path", { d: s_d, fill: "none", stroke: "#d58b35", "stroke-width": .25, "pointer-events": "none" }));
                o_group.append(f_svg("rect", {
                    x: o_item.n_x + n_width / 2 - 1.5, y: -o_item.n_y + n_height / 2 - 1.5,
                    width: 3, height: 3, rx: .4, fill: "#d58b35", stroke: "#fffcf7", "stroke-width": .3, "data-resize": "true",
                }));
            }
            o_content.append(o_group);
        }
        o_stage.replaceChildren(o_content);
    }
    function f_controls() {
        const o_selected = f_selected();
        const a_o_wall = a_o_decoration.filter((o) => o.n_wall === n_wall);
        o_list.replaceChildren(...(a_o_wall.length ? a_o_wall.map((o) => new Option(o.s_name, o.n_id, false, o.n_id === n_selected)) : [new Option("No decorations yet", "")]));
        f_el("wall-window").checked = a_b_window[n_wall];
        o_form.hidden = !o_selected;
        for (const [s_field, s_key] of [["width", "n_width"], ["x", "n_x"], ["y", "n_y"]]) {
            const o_input = f_el(`decoration-${s_field}`);
            o_input.disabled = !o_selected;
            if (o_selected) o_input.value = f_round(o_selected[s_key]);
        }
        const o = f_parameters();
        f_el("decoration-x").max = o.house_size;
        f_el("decoration-y").max = o.wall_height + (o.roof_style === "flat" ? 0 : o.roof_height);
        f_draw();
    }
    for (const o_button of document.querySelectorAll("[data-wall]")) {
        o_button.onclick = () => {
            n_wall = Number(o_button.dataset.wall);
            n_selected = a_o_decoration.find((o) => o.n_wall === n_wall)?.n_id ?? null;
            s_wall_svg = "";
            for (const o of document.querySelectorAll("[data-wall]")) o.setAttribute("aria-pressed", String(Number(o.dataset.wall) === n_wall));
            o_stage.setAttribute("aria-label", `${o_button.textContent} wall decoration editor. Use arrow keys to move a selected decoration.`);
            f_controls();
            f_changed();
        };
    }
    o_list.onchange = () => { n_selected = o_list.value === "" ? null : Number(o_list.value); f_controls(); };
    f_el("wall-window").onchange = (o) => { a_b_window[n_wall] = o.target.checked; f_changed(); };
    function f_remove() {
        a_o_decoration = a_o_decoration.filter((o) => o.n_id !== n_selected);
        n_selected = a_o_decoration.find((o) => o.n_wall === n_wall)?.n_id ?? null;
        if (n_selected === null) a_b_window[n_wall] = true;
        f_controls(); f_changed();
    }
    f_el("remove-decoration").onclick = f_remove;
    o_form.onsubmit = (o) => o.preventDefault();
    o_form.oninput = () => {
        const o = f_selected();
        if (o && o_form.checkValidity()) {
            o.n_width = Number(f_el("decoration-width").value);
            o.n_x = Number(f_el("decoration-x").value);
            o.n_y = Number(f_el("decoration-y").value);
            f_draw();
        }
        f_changed();
    };
    o_upload.onclick = () => f_el("svg-file").click();
    f_el("svg-file").onchange = async (o_event) => {
        const a_o_file = [...o_event.target.files];
        o_event.target.value = "";
        const n_target_wall = n_wall, n_revision = ++n_upload_revision;
        b_loading = true; o_upload.disabled = true; o_upload.textContent = "Loading SVG…"; o_error.hidden = true;
        try {
            for (const o_file of a_o_file) {
                if (a_o_decoration.length >= 16) throw new Error("Use up to 16 decorations per house.");
                if (o_file.size > 500000) throw new Error("Choose an SVG smaller than 500 KB.");
                const o_tree = f_o_svg_tree(await o_file.text());
                const o_response = await fetch("/api/import-svg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(o_tree) });
                const o_geometry = await o_response.json();
                if (n_revision !== n_upload_revision) return;
                if (!o_response.ok) throw new Error(o_geometry.error || "Could not import this SVG.");
                const o = f_parameters();
                const n_width = Math.max(1, f_round(Math.min(o.house_size - 2 * (o.glue_tab_width + 3), (o.wall_height - 8) / o_geometry.n_ratio, 28)));
                const o_item = { ...o_geometry, s_name: o_file.name, n_id: ++n_next_id, n_wall: n_target_wall,
                    n_x: f_round(o.house_size / 2), n_y: f_round(o.wall_height / 2), n_width };
                if (!a_o_decoration.some((o) => o.n_wall === n_target_wall)) a_b_window[n_target_wall] = false;
                a_o_decoration.push(o_item);
                if (n_wall === n_target_wall) n_selected = o_item.n_id;
                f_controls(); f_changed();
            }
        } catch (o_problem) {
            if (n_revision === n_upload_revision) { o_error.textContent = o_problem.message; o_error.hidden = false; }
        } finally {
            if (n_revision === n_upload_revision) { b_loading = false; o_upload.disabled = false; o_upload.textContent = "+ Load SVG"; }
        }
    };
    function f_point(o_event) {
        const o_point = o_stage.createSVGPoint();
        o_point.x = o_event.clientX; o_point.y = o_event.clientY;
        return o_point.matrixTransform(o_stage.getScreenCTM().inverse());
    }
    o_stage.onpointerdown = (o_event) => {
        const o_target = o_event.target.closest("[data-decoration]");
        if (!o_target) return;
        n_selected = Number(o_target.dataset.decoration);
        const o = f_selected(), o_point = f_point(o_event);
        o_drag = { n_x: o.n_x, n_y: o.n_y, n_start_x: o_point.x, n_start_y: o_point.y, b_resize: o_event.target.hasAttribute("data-resize") };
        o_stage.setPointerCapture(o_event.pointerId); o_stage.focus();
        o_event.preventDefault(); f_controls();
    };
    o_stage.onpointermove = (o_event) => {
        if (!o_drag) return;
        const o = f_selected(), o_point = f_point(o_event), o_parameters = f_parameters();
        if (o_drag.b_resize) o.n_width = f_round(Math.max(1, Math.min(200, 2 * Math.max(o_point.x - o.n_x, (o_point.y + o.n_y) / o.n_ratio))));
        else {
            o.n_x = f_round(Math.max(0, Math.min(o_parameters.house_size, o_drag.n_x + o_point.x - o_drag.n_start_x)));
            const n_height = o_parameters.wall_height + (o_parameters.roof_style === "flat" ? 0 : o_parameters.roof_height);
            o.n_y = f_round(Math.max(0, Math.min(n_height, o_drag.n_y - o_point.y + o_drag.n_start_y)));
        }
        f_controls(); f_changed();
    };
    for (const s of ["pointerup", "pointercancel", "lostpointercapture"]) o_stage.addEventListener(s, () => { o_drag = null; });
    o_stage.onkeydown = (o_event) => {
        const o = f_selected();
        if (!o || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Delete", "Backspace"].includes(o_event.key)) return;
        o_event.preventDefault();
        if (["Delete", "Backspace"].includes(o_event.key)) { f_remove(); return; }
        const n_step = o_event.shiftKey ? 2 : .5, o_parameters = f_parameters();
        o.n_x = f_round(Math.max(0, Math.min(o_parameters.house_size, o.n_x + (o_event.key === "ArrowRight" ? n_step : o_event.key === "ArrowLeft" ? -n_step : 0))));
        const n_height = o_parameters.wall_height + (o_parameters.roof_style === "flat" ? 0 : o_parameters.roof_height);
        o.n_y = f_round(Math.max(0, Math.min(n_height, o.n_y + (o_event.key === "ArrowUp" ? n_step : o_event.key === "ArrowDown" ? -n_step : 0))));
        f_controls(); f_changed();
    };
    return {
        f_payload: () => ({ decorations: a_o_decoration, wall_windows: a_b_window, editor_wall: n_wall }),
        f_valid: () => o_form.hidden || o_form.checkValidity(),
        f_rendered: (o) => { if (o.editor_wall === n_wall) { s_wall_svg = o.s_wall_svg; f_draw(); } },
        f_parameters_changed: () => { o_upload.disabled = b_loading; f_controls(); },
        f_reset: () => {
            n_upload_revision++; b_loading = false; a_o_decoration = []; a_b_window = [true, true, true, true]; n_selected = null;
            o_error.hidden = true; o_upload.disabled = false; o_upload.textContent = "+ Load SVG"; f_controls();
        },
    };
}
