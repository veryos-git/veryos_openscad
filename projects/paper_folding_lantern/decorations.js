// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
import { f_o_svg_tree } from "./svg_geometry.js";

// One custom cut-out pattern per surface. Surfaces 0-3 are the walls, 4-7 the
// roof faces. The editor shows each face from outside; the generic wall window
// remains untouched underneath the pattern.
export function f_o_decorations(f_changed, f_parameters) {
    const f_el = (s) => document.getElementById(s);
    const s_ns = "http://www.w3.org/2000/svg";
    const o_stage = f_el("surface-stage");
    const o_form = f_el("surface-settings");
    const o_error = f_el("surface-error");
    const o_upload = f_el("upload-surface-svg");
    const o_remove = f_el("remove-surface-decoration");
    let a_o_decoration = [];
    let n_surface = 0, o_drag = null, b_loading = false, n_upload_revision = 0;
    const s_pad = 8, n_mullion = 2.2;

    const f_selected = () => a_o_decoration.find((o) => o.n_surface === n_surface);
    const f_round = (n) => Math.round(n * 10) / 10;
    const f_clamp = (n, n_min, n_max) => Math.max(n_min, Math.min(n_max, n));

    function f_svg(s_tag, o_attribute = {}) {
        const o = document.createElementNS(s_ns, s_tag);
        for (const [s, v] of Object.entries(o_attribute)) o.setAttribute(s, v);
        return o;
    }

    function f_surface_geometry(n_index = n_surface) {
        const o = f_parameters();
        if (!o.lantern_width) return null;
        const n_width = o.lantern_width;
        const n_slant = Math.hypot(n_width / 2, o.roof_height);
        const n_roof_top = n_slant * (1 - o.hanger_width / n_width);
        const b_roof = n_index >= 4;
        return {
            o, n_width, n_roof_top, b_roof,
            n_height: b_roof ? n_roof_top : o.wall_height,
        };
    }

    function f_default_placement(o_geometry, n_index) {
        const g = f_surface_geometry(n_index);
        const n_ratio = Math.max(0.02, o_geometry.n_ratio || 1);
        if (g.b_roof) {
            const n_width = Math.max(2, Math.min(g.n_width * 0.3, 14, g.n_roof_top * 0.6 / n_ratio));
            return {
                n_x: f_round(g.n_width / 2),
                n_y: f_round(g.n_roof_top / 2),
                n_width: f_round(n_width),
                n_rotation: 0,
            };
        }
        // Keep the first pattern clear of the generic window: place it in the
        // paper band below the window, with a 2 mm cut border.
        const n_window_center = g.o.wall_height * 0.47;
        const n_bottom_of_window = n_window_center - g.o.window_height / 2;
        const n_room = Math.max(3, n_bottom_of_window - 4);
        const n_width = Math.max(2, Math.min(g.n_width * 0.35, 12, n_room / n_ratio));
        return {
            n_x: f_round(g.n_width / 2),
            n_y: f_round(2 + n_width * n_ratio / 2),
            n_width: f_round(n_width),
            n_rotation: 0,
        };
    }

    function f_draw_window(o_parent, g) {
        const n_window_width = g.o.window_width;
        const n_window_height = g.o.window_height;
        const n_cx = g.n_width / 2;
        const n_cy = g.o.wall_height * 0.47;
        const n_r = n_window_width / 2;
        const n_shoulder = -n_cy - n_window_height / 2 + n_r;
        const n_bottom = -n_cy + n_window_height / 2;
        o_parent.append(f_svg("rect", {
            x: n_cx - n_r, y: n_shoulder,
            width: n_window_width, height: n_bottom - n_shoulder, class: "surface-window",
        }));
        o_parent.append(f_svg("circle", {
            cx: n_cx, cy: n_shoulder, r: n_r, class: "surface-window",
        }));
        o_parent.append(f_svg("rect", {
            x: n_cx - n_mullion / 2, y: -n_cy - n_window_height / 2,
            width: n_mullion, height: n_window_height, class: "surface-bar",
        }));
        o_parent.append(f_svg("rect", {
            x: n_cx - n_r, y: -n_cy - n_mullion / 2,
            width: n_window_width, height: n_mullion, class: "surface-bar",
        }));
    }

    function f_draw_decoration(o_parent, o_item) {
        const n_width = o_item.n_width;
        const n_height = n_width * o_item.n_ratio;
        const n_cx = o_item.n_x;
        const n_cy = -o_item.n_y;
        const o_group = f_svg("g", {
            "data-decoration": "true",
            transform: `rotate(${o_item.n_rotation} ${n_cx} ${n_cy})`,
        });
        let s_d = "";
        for (const a_path of o_item.a_a_n_path) {
            s_d += a_path.map((n_index, n) => {
                const [n_x, n_y] = o_item.a_a_n_point[n_index];
                return `${n === 0 ? "M" : "L"}${n_cx + n_x * n_width},${n_cy - n_y * n_width}`;
            }).join(" ") + " Z ";
        }
        o_group.append(f_svg("path", {
            d: s_d, class: "surface-pattern", "fill-rule": "evenodd", "pointer-events": "visiblePainted",
        }));
        o_group.append(f_svg("rect", {
            x: n_cx - n_width / 2, y: n_cy - n_height / 2, width: n_width, height: n_height,
            class: "surface-bounds",
        }));
        o_group.append(f_svg("rect", {
            x: n_cx + n_width / 2 - 1.6, y: n_cy + n_height / 2 - 1.6,
            width: 3.2, height: 3.2, rx: .4, class: "surface-handle", "data-resize": "true",
        }));
        const n_top = n_cy - n_height / 2;
        o_group.append(f_svg("line", {
            x1: n_cx, x2: n_cx, y1: n_top, y2: n_top - 4.5, class: "surface-handle-line",
        }));
        o_group.append(f_svg("circle", {
            cx: n_cx, cy: n_top - 6, r: 1.7, class: "surface-handle", "data-rotate": "true",
        }));
        o_parent.append(o_group);
    }

    function f_draw() {
        const g = f_surface_geometry();
        if (!g) { o_stage.replaceChildren(); return; }
        o_stage.setAttribute("viewBox", `${-s_pad} ${-g.n_height - s_pad} ${g.n_width + 2 * s_pad} ${g.n_height + 2 * s_pad}`);
        const o_content = f_svg("g");
        if (g.b_roof) {
            o_content.append(f_svg("polygon", {
                points: `0,0 ${g.n_width},0 ${g.n_width / 2 + g.o.hanger_width / 2},${-g.n_height} ${g.n_width / 2 - g.o.hanger_width / 2},${-g.n_height}`,
                class: "surface-face",
            }));
        } else {
            o_content.append(f_svg("rect", {
                x: 0, y: -g.n_height, width: g.n_width, height: g.n_height, class: "surface-face",
            }));
            f_draw_window(o_content, g);
        }
        o_content.append(f_svg("line", {
            x1: 0, x2: g.n_width, y1: 0, y2: 0, class: "surface-fold",
        }));
        const o_item = f_selected();
        if (o_item) f_draw_decoration(o_content, o_item);
        o_stage.replaceChildren(o_content);
    }

    function f_labels() {
        const g = f_surface_geometry();
        if (!g) return;
        f_el("surface-y-label").textContent = g.b_roof ? "Center above eave (mm)" : "Center above floor (mm)";
        for (const o_button of document.querySelectorAll("[data-surface]")) {
            const n = Number(o_button.dataset.surface);
            o_button.setAttribute("aria-pressed", String(n === n_surface));
            const b_has = a_o_decoration.some((o) => o.n_surface === n);
            o_button.textContent = `${o_button.dataset.label}${b_has ? " ·" : ""}`;
        }
        o_stage.setAttribute("aria-label", `${document.querySelector(`[data-surface="${n_surface}"]`).dataset.label} pattern editor. Drag the pattern, or use the fields and arrow keys.`);
    }

    function f_controls() {
        const o_item = f_selected();
        const g = f_surface_geometry();
        if (!g) return;
        o_form.hidden = !o_item;
        o_remove.hidden = !o_item;
        o_upload.textContent = b_loading ? "Loading SVG…" : o_item ? "Replace SVG" : "+ Load SVG";
        o_upload.disabled = b_loading;
        for (const [s_field, s_key] of [["width", "n_width"], ["x", "n_x"], ["y", "n_y"], ["rotation", "n_rotation"]]) {
            const o_input = f_el(`surface-${s_field}`);
            o_input.disabled = !o_item;
            if (o_item) o_input.value = f_round(o_item[s_key]);
        }
        f_el("surface-x").max = g.n_width;
        f_el("surface-y").max = f_round(g.n_height);
        f_el("surface-width").max = 200;
        f_labels();
        f_draw();
    }

    for (const o_button of document.querySelectorAll("[data-surface]")) {
        o_button.onclick = () => {
            n_surface = Number(o_button.dataset.surface);
            f_controls();
        };
    }

    function f_point(o_event) {
        const o_point = o_stage.createSVGPoint();
        o_point.x = o_event.clientX;
        o_point.y = o_event.clientY;
        return o_point.matrixTransform(o_stage.getScreenCTM().inverse());
    }

    o_stage.onpointerdown = (o_event) => {
        const o_target = o_event.target.closest("[data-decoration]");
        const o_item = f_selected();
        if (!o_target || !o_item) return;
        const o_point = f_point(o_event);
        o_drag = {
            n_x: o_item.n_x, n_y: o_item.n_y,
            n_start_x: o_point.x, n_start_y: o_point.y,
            b_resize: o_event.target.hasAttribute("data-resize"),
            b_rotate: o_event.target.hasAttribute("data-rotate"),
        };
        o_stage.setPointerCapture(o_event.pointerId);
        o_stage.focus();
        o_event.preventDefault();
    };

    o_stage.onpointermove = (o_event) => {
        if (!o_drag) return;
        const o_item = f_selected();
        const g = f_surface_geometry();
        const o_point = f_point(o_event);
        const n_dx = o_point.x - o_item.n_x;
        const n_dy = o_point.y + o_item.n_y;
        if (o_drag.b_rotate) {
            const n_angle = Math.atan2(n_dx, -n_dy) * 180 / Math.PI;
            o_item.n_rotation = o_event.shiftKey ? Math.round(n_angle / 15) * 15 : Math.round(n_angle);
        } else if (o_drag.b_resize) {
            const n_angle = o_item.n_rotation * Math.PI / 180;
            const n_local_x = n_dx * Math.cos(n_angle) + n_dy * Math.sin(n_angle);
            const n_local_y = -n_dx * Math.sin(n_angle) + n_dy * Math.cos(n_angle);
            o_item.n_width = f_round(Math.max(1, Math.min(200, 2 * Math.max(n_local_x, n_local_y / o_item.n_ratio))));
        } else {
            o_item.n_x = f_round(f_clamp(o_drag.n_x + o_point.x - o_drag.n_start_x, 0, g.n_width));
            o_item.n_y = f_round(f_clamp(o_drag.n_y - o_point.y + o_drag.n_start_y, 0, g.n_height));
        }
        f_controls();
        f_changed();
    };

    for (const s_event of ["pointerup", "pointercancel", "lostpointercapture"]) {
        o_stage.addEventListener(s_event, () => { o_drag = null; });
    }

    o_stage.onkeydown = (o_event) => {
        const o_item = f_selected();
        if (!o_item) return;
        if (["Delete", "Backspace"].includes(o_event.key)) {
            o_event.preventDefault();
            f_remove();
            return;
        }
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(o_event.key)) return;
        o_event.preventDefault();
        const g = f_surface_geometry();
        const n_step = o_event.shiftKey ? 2 : .5;
        o_item.n_x = f_round(f_clamp(o_item.n_x + (o_event.key === "ArrowRight" ? n_step : o_event.key === "ArrowLeft" ? -n_step : 0), 0, g.n_width));
        o_item.n_y = f_round(f_clamp(o_item.n_y + (o_event.key === "ArrowUp" ? n_step : o_event.key === "ArrowDown" ? -n_step : 0), 0, g.n_height));
        f_controls();
        f_changed();
    };

    o_form.onsubmit = (o_event) => o_event.preventDefault();
    o_form.oninput = () => {
        const o_item = f_selected();
        if (o_item && o_form.checkValidity()) {
            o_item.n_width = Number(f_el("surface-width").value);
            o_item.n_x = Number(f_el("surface-x").value);
            o_item.n_y = Number(f_el("surface-y").value);
            o_item.n_rotation = Number(f_el("surface-rotation").value);
            f_draw();
        }
        f_changed();
    };

    function f_remove() {
        a_o_decoration = a_o_decoration.filter((o) => o.n_surface !== n_surface);
        o_error.hidden = true;
        f_controls();
        f_changed();
    }
    o_remove.onclick = f_remove;

    o_upload.onclick = () => f_el("surface-svg-file").click();
    f_el("surface-svg-file").onchange = async (o_event) => {
        const o_file = o_event.target.files[0];
        o_event.target.value = "";
        if (!o_file) return;
        const n_target_surface = n_surface;
        const n_revision = ++n_upload_revision;
        b_loading = true;
        f_controls();
        o_error.hidden = true;
        try {
            if (o_file.size > 500000) throw new Error("Choose an SVG smaller than 500 KB.");
            const o_tree = f_o_svg_tree(await o_file.text());
            const o_response = await fetch("/api/import-svg", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(o_tree),
            });
            const o_geometry = await o_response.json();
            if (n_revision !== n_upload_revision) return;
            if (!o_response.ok) throw new Error(o_geometry.error || "Could not import this SVG.");
            const o_existing = a_o_decoration.find((o) => o.n_surface === n_target_surface);
            const o_placement = o_existing
                ? { n_x: o_existing.n_x, n_y: o_existing.n_y, n_width: o_existing.n_width, n_rotation: o_existing.n_rotation }
                : f_default_placement(o_geometry, n_target_surface);
            a_o_decoration = a_o_decoration.filter((o) => o.n_surface !== n_target_surface);
            a_o_decoration.push({ ...o_geometry, s_name: o_file.name, n_surface: n_target_surface, ...o_placement });
            if (n_surface === n_target_surface) n_surface = n_target_surface;
            f_controls();
            f_changed();
        } catch (o_problem) {
            if (n_revision === n_upload_revision) {
                o_error.textContent = o_problem.message;
                o_error.hidden = false;
            }
        } finally {
            if (n_revision === n_upload_revision) {
                b_loading = false;
                f_controls();
            }
        }
    };

    return {
        f_payload: () => ({ decorations: a_o_decoration }),
        f_valid: () => o_form.hidden || o_form.checkValidity(),
        f_parameters_changed: () => {
            for (const o_item of a_o_decoration) {
                const g = f_surface_geometry(o_item.n_surface);
                if (!g) continue;
                o_item.n_x = f_round(f_clamp(o_item.n_x, 0, g.n_width));
                o_item.n_y = f_round(f_clamp(o_item.n_y, 0, g.n_height));
            }
            f_controls();
        },
        f_reset: () => {
            n_upload_revision++;
            b_loading = false;
            a_o_decoration = [];
            o_error.hidden = true;
            o_upload.disabled = false;
            o_upload.textContent = "+ Load SVG";
            f_controls();
        },
    };
}
