// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The page: a form that starts a run, a view of the selected run and a gallery of all runs.

const form = document.getElementById("form");
const start_button = document.getElementById("start");
const stop_button = document.getElementById("stop");
const error_box = document.getElementById("error");
const view = document.getElementById("view");
const gallery = document.getElementById("gallery");
const el = (id) => document.getElementById(id);

const gif_reload_ms = 15000; // while a run goes, the gif is fetched again this often

let selected = null; // id of the run shown in the view
let runs = [];
let gallery_key = ""; // what the gallery was last built from, so the gifs in it do not restart on every poll
let timer = null;

async function api(path, options) {
    const response = await fetch(path, options);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || response.statusText);
    return body;
}

function frame_url(id, n) {
    return `runs/${id}/frames/frame_${String(n).padStart(4, "0")}.png`;
}

function set_src(img, src) {
    if (img.getAttribute("src") !== src) img.src = src;
}

function render_view(info) {
    view.querySelector(".empty").hidden = Boolean(info);
    view.querySelector(".run").hidden = !info;
    if (!info) return;
    const p = info.params;
    const state = info.running ? `frame ${info.frames} of ${p.frames}`
        : info.error ? info.error
        : info.frames >= p.frames ? "finished" : `stopped after ${info.frames} frames`;
    el("view-prompt").textContent = p.prompt;
    el("status").textContent = `${state} · strength ${p.strength} · steps ${p.steps} · noise ${p.noise} · spread ${p.spread} · seed ${p.seed} · ${p.fps} fps${p.dry_run ? " · dry run" : ""}`;

    // latest frame, only while the run goes; afterwards the gif says it all
    const frame = el("view-frame").parentElement;
    frame.hidden = !info.running;
    if (info.running) set_src(el("view-frame"), `${frame_url(info.id, info.frames)}?t=${info.frames}`);

    const gif = el("view-gif").parentElement;
    gif.hidden = !info.gif;
    if (info.gif) {
        const key = info.running ? Math.floor(Date.now() / gif_reload_ms) : "done";
        set_src(el("view-gif"), `runs/${info.id}/animation.gif?t=${key}`);
        el("view-gif-caption").textContent = info.running ? `animation so far, reloads every ${gif_reload_ms / 1000} s` : "animation";
    }
    el("view-progress").hidden = !info.running;
    el("view-progress").max = p.frames;
    el("view-progress").value = info.frames;
    el("download").hidden = !info.gif;
    el("view-download").href = `runs/${info.id}/animation.gif`;
    el("view-folder").textContent = `frames in runs/${info.id}/frames/`;
    el("log").textContent = info.log && info.log.length ? info.log.slice(-8).join("\n") : "";
}

function render_gallery() {
    const key = JSON.stringify(runs.map((r) => [r.id, r.running, r.gif, r.error, r.running ? r.frames : 0])) + selected;
    if (key === gallery_key) return;
    gallery_key = key;
    gallery.innerHTML = "";
    for (const info of runs) {
        const card = document.createElement("div");
        card.className = "card" + (info.id === selected ? " selected" : "");
        const src = info.gif && !info.running ? `runs/${info.id}/animation.gif` : frame_url(info.id, Math.max(info.frames, 0));
        card.innerHTML = `<img src="${src}" alt="" loading="lazy">
            <div class="prompt">${escape_html(info.params.prompt)}</div>
            <div class="meta">${info.id.slice(0, 8)} ${info.id.slice(9, 15)} · ${info.running ? "running" : info.error ? info.error : info.frames + " frames"}</div>`;
        card.onclick = () => select(info.id);
        gallery.appendChild(card);
    }
}

function escape_html(text) {
    return String(text).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
}

async function select(id) {
    selected = id;
    render_gallery();
    render_view(await api(`api/runs/${id}`));
}

async function refresh() {
    runs = await api("api/runs");
    const running = runs.find((r) => r.running);
    start_button.disabled = Boolean(running);
    stop_button.disabled = !running;
    if (running) selected = running.id;
    render_gallery();
    if (selected) render_view(await api(`api/runs/${selected}`));
    clearTimeout(timer);
    timer = setTimeout(refresh, running ? 1000 : 10000);
}

form.onsubmit = async (event) => {
    event.preventDefault();
    error_box.textContent = "";
    const data = new FormData(form);
    const body = Object.fromEntries(data.entries());
    body.dry_run = data.get("dry_run") === "on";
    try {
        const {id} = await api("api/runs", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
        selected = id;
        await refresh();
    } catch (error) {
        error_box.textContent = error.message;
    }
};

stop_button.onclick = async () => {
    const running = runs.find((r) => r.running);
    if (running) await api(`api/runs/${running.id}/stop`, {method: "POST"}).catch((e) => error_box.textContent = e.message);
};

(async () => {
    const params = await api("api/params");
    for (const [name, rule] of Object.entries(params)) {
        const input = form.elements[name];
        if (input.type === "checkbox") input.checked = rule.default;
        else {
            input.value = rule.default;
            if ("min" in rule) input.min = rule.min, input.max = rule.max;
        }
    }
    await refresh();
})();
