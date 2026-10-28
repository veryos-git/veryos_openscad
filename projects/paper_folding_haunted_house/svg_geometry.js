// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL

// Only vector geometry crosses the upload boundary. No raw SVG is put in the page.
const o_attributes = {
    svg: ["viewBox", "width", "height", "x", "y", "preserveAspectRatio"],
    g: [], defs: [],
    path: ["d"], rect: ["x", "y", "width", "height", "rx", "ry"],
    circle: ["cx", "cy", "r"], ellipse: ["cx", "cy", "rx", "ry"],
    line: ["x1", "y1", "x2", "y2"], polygon: ["points"], polyline: ["points"],
    use: ["xlink:href", "x", "y", "width", "height"],
};
const a_s_common = ["id", "transform", "fill-rule", "stroke-width"];

// Browser DOMParser handles XML; serialize only an explicit geometry tree on the server.
export function f_o_svg_tree(s_source) {
    if (s_source.length > 500000) throw new Error("Choose an SVG smaller than 500 KB.");
    if (/<!ENTITY/i.test(s_source)) throw new Error("SVG entities are not supported.");
    const o_doc = new DOMParser().parseFromString(s_source, "image/svg+xml");
    if (o_doc.querySelector("parsererror") || o_doc.documentElement.localName !== "svg") {
        throw new Error("This file is not a valid SVG.");
    }
    function f_node(o_element, b_defs = false) {
        const s_tag = o_element.localName;
        // Stylesheets only colour shapes (e.g. Illustrator's default export); every shape becomes a cut.
        if (["title", "desc", "metadata", "namedview", "style"].includes(s_tag)
            || (o_element.namespaceURI && o_element.namespaceURI !== "http://www.w3.org/2000/svg")) return null;
        if (s_tag === "script" || s_tag === "foreignObject") throw new Error("Active SVG content is not supported.");
        if (!Object.hasOwn(o_attributes, s_tag)) {
            if (b_defs && /Gradient$|^stop$/.test(s_tag)) return null;
            throw new Error(`SVG ${s_tag} is not supported. Convert text and strokes to paths; remove images, masks and filters.`);
        }
        const o_style = Object.fromEntries((o_element.getAttribute("style") || "").split(";")
            .filter((s) => s.includes(":"))
            .map((s) => s.split(/:(.*)/s).slice(0, 2).map((v) => v.trim())));
        if ((o_style.display || o_element.getAttribute("display")) === "none"
            || (o_style.visibility || o_element.getAttribute("visibility")) === "hidden") return null;
        for (const s_name of ["clip-path", "mask", "filter"]) {
            const s_value = o_style[s_name] || o_element.getAttribute(s_name);
            if (s_value && s_value !== "none") throw new Error("Flatten SVG clipping, masks and filters into paths first.");
        }
        const o_attribute = {};
        for (const s_name of [...a_s_common, ...o_attributes[s_tag]]) {
            const s_value = o_element.getAttribute(s_name);
            if (s_value !== null) o_attribute[s_name] = s_value;
        }
        for (const s_name of ["fill-rule", "stroke-width"]) {
            if (o_style[s_name]) o_attribute[s_name] = o_style[s_name];
        }
        if (s_tag === "use") o_attribute["xlink:href"] = o_element.getAttribute("href") || o_attribute["xlink:href"] || "";
        return { s_tag, o_attribute, a_o_child: [...o_element.children].map((o) => f_node(o, b_defs || s_tag === "defs")).filter(Boolean) };
    }
    const o_tree = f_node(o_doc.documentElement);
    f_s_svg(o_tree); // Apply the same limits and reference validation as the server.
    return o_tree;
}

export function f_s_svg(o_tree) {
    if (JSON.stringify(o_tree)?.length > 500000) throw new Error("SVG geometry exceeds 500 KB.");
    let n_node = 0;
    const f_escape = (s) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    function f_node(o, n_depth = 0) {
        if (!o || !Object.hasOwn(o_attributes, o.s_tag) || !o.o_attribute || !Array.isArray(o.a_o_child)
            || ++n_node > 2000 || n_depth > 30) throw new Error("Unsupported or overly complex SVG geometry.");
        const a_s_attribute = [];
        for (const [s_name, s_value] of Object.entries(o.o_attribute)) {
            if (![...a_s_common, ...o_attributes[o.s_tag]].includes(s_name) || typeof s_value !== "string") {
                throw new Error(`Unsupported SVG attribute: ${s_name}`);
            }
            if (s_name === "xlink:href" && !/^#[A-Za-z_][\w.:-]*$/.test(s_value)) {
                throw new Error("SVG references must point to shapes within the same file.");
            }
            a_s_attribute.push(`${s_name}="${f_escape(s_value)}"`);
        }
        const s_namespace = n_depth === 0 ? ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' : "";
        return `<${o.s_tag}${s_namespace} ${a_s_attribute.join(" ")}>${o.a_o_child.map((o) => f_node(o, n_depth + 1)).join("")}</${o.s_tag}>`;
    }
    if (o_tree?.s_tag !== "svg") throw new Error("Expected SVG geometry.");
    f_node(o_tree); // Validate the original input before resolving any references.
    // OpenSCAD 2021 ignores <use>. Expand local copies, including their transforms.
    const o_ids = new Map();
    function f_collect(o) {
        if (o.o_attribute.id && !o_ids.has(o.o_attribute.id)) o_ids.set(o.o_attribute.id, o);
        o.a_o_child.forEach(f_collect);
    }
    f_collect(o_tree);
    let n_expanded = 0;
    function f_expand(o, a_s_reference = [], n_depth = 0) {
        if (++n_expanded > 2000 || n_depth > 30) throw new Error("SVG references expand into too many shapes.");
        if (o.s_tag === "defs") return null;
        if (o.s_tag === "use") {
            const s_id = o.o_attribute["xlink:href"]?.slice(1);
            const o_target = o_ids.get(s_id);
            if (!o_target || a_s_reference.includes(s_id)) throw new Error("SVG contains a missing or recursive shape reference.");
            const a_n_position = ["x", "y"].map((s) => {
                const s_value = o.o_attribute[s] || "0";
                if (!/^[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?(?:px)?$/i.test(s_value.trim())) {
                    throw new Error("Convert SVG reference positions to plain numeric coordinates first.");
                }
                return parseFloat(s_value);
            });
            const o_attribute = {};
            for (const s of ["fill-rule", "stroke-width"]) if (o.o_attribute[s]) o_attribute[s] = o.o_attribute[s];
            o_attribute.transform = `${o.o_attribute.transform || ""} translate(${a_n_position.join(",")})`;
            const o_copy = o_target.s_tag === "svg" ? { ...o_target, o_attribute: { ...o_target.o_attribute } } : o_target;
            if (o_copy.s_tag === "svg") {
                for (const s of ["width", "height"]) if (o.o_attribute[s]) o_copy.o_attribute[s] = o.o_attribute[s];
            }
            const o_child = f_expand(o_copy, [...a_s_reference, s_id], n_depth + 1);
            return { s_tag: "g", o_attribute, a_o_child: o_child ? [o_child] : [] };
        }
        return { ...o, a_o_child: o.a_o_child.map((o) => f_expand(o, a_s_reference, n_depth + 1)).filter(Boolean) };
    }
    const o_expanded = f_expand(o_tree);
    n_node = 0;
    return f_node(o_expanded);
}

export function f_o_geometry(s_svg) {
    const a_a_n_point = [], a_a_n_path = [];
    // OpenSCAD's own SVG writer emits absolute M/L polygons. Curves are already resolved.
    for (const a_s_path of s_svg.matchAll(/<path\b[^>]*\bd="([^"]*)"/g)) {
        for (const s_contour of a_s_path[1].split("M").slice(1)) {
            const a_n_value = (s_contour.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || []).map(Number);
            const a_n_path = [];
            for (let i = 0; i < a_n_value.length; i += 2) {
                a_n_path.push(a_a_n_point.length);
                a_a_n_point.push([a_n_value[i], -a_n_value[i + 1]]);
            }
            if (a_n_path.length >= 3) a_a_n_path.push(a_n_path);
        }
    }
    if (a_a_n_point.length < 3 || a_a_n_point.length > 12000) throw new Error("SVG is empty or too detailed. Simplify its paths and try again.");
    const a_n_x = a_a_n_point.map((a) => a[0]), a_n_y = a_a_n_point.map((a) => a[1]);
    const n_min_x = Math.min(...a_n_x), n_max_x = Math.max(...a_n_x), n_min_y = Math.min(...a_n_y), n_max_y = Math.max(...a_n_y);
    const n_width = n_max_x - n_min_x, n_height = n_max_y - n_min_y;
    if (!(n_width > 0 && n_height > 0) || !Number.isFinite(n_width) || !Number.isFinite(n_height)) {
        throw new Error("SVG needs finite, nonzero width and height.");
    }
    if (n_height / n_width > 200) throw new Error("This SVG is too tall and narrow. Rotate the artwork before importing it.");
    return {
        a_a_n_point: a_a_n_point.map(([x, y]) => [(x - (n_min_x + n_max_x) / 2) / n_width, (y - (n_min_y + n_max_y) / 2) / n_width]),
        a_a_n_path, n_ratio: n_height / n_width,
    };
}

export function f_a_decoration(a_o_input) {
    if (!Array.isArray(a_o_input) || a_o_input.length > 16) throw new Error("Use up to 16 SVG decorations per house.");
    let n_points = 0, n_indices = 0;
    return a_o_input.map((o) => {
        if (!o || !Number.isInteger(o.n_wall) || o.n_wall < 0 || o.n_wall > 3
            || ![o.n_x, o.n_y, o.n_width].every(Number.isFinite)
            || o.n_x < 0 || o.n_x > 200 || o.n_y < 0 || o.n_y > 200 || o.n_width < 1 || o.n_width > 200
            || !Array.isArray(o.a_a_n_point) || o.a_a_n_point.length < 3 || o.a_a_n_point.length > 12000
            || !o.a_a_n_point.every((a) => Array.isArray(a) && a.length === 2 && a.every((n) => Number.isFinite(n) && Math.abs(n) <= 100))
            || !Array.isArray(o.a_a_n_path) || !o.a_a_n_path.length || o.a_a_n_path.length > 12000
            || !o.a_a_n_path.every((a) => Array.isArray(a) && a.length >= 3 && a.length <= 12000
                && a.every((n) => Number.isInteger(n) && n >= 0 && n < o.a_a_n_point.length))) {
            throw new Error("Invalid decoration geometry or placement.");
        }
        n_points += o.a_a_n_point.length;
        n_indices += o.a_a_n_path.reduce((n, a) => n + a.length, 0);
        if (n_points > 30000 || n_indices > 60000) throw new Error("Too many decoration points. Simplify the SVGs or remove some copies.");
        return [o.n_wall, o.n_x, o.n_y, o.n_width, o.a_a_n_point, o.a_a_n_path];
    });
}
