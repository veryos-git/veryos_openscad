// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The page: a form that starts a run, a view of the selected run and a gallery of all runs.

const form = document.getElementById("form");
const start_button = document.getElementById("start");
const stop_button = document.getElementById("stop");
const error_box = document.getElementById("error");
const view = document.getElementById("view");
const gallery = document.getElementById("gallery");

let selected = null; // id of the run shown in the view
let runs = [];
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

function render_view(info) {
    if (!info) {
        view.innerHTML = '<div class="empty">no run selected</div>';
        return;
    }
    const p = info.params;
    const src = info.gif ? `runs/${info.id}/animation.gif` : frame_url(info.id, Math.max(info.frames, 0));
    const state = info.running ? `frame ${info.frames} of ${p.frames}`
        : info.error ? info.error
        : info.gif ? "finished" : `stopped after ${info.frames} frames`;
    const html = [
        `<h2>${escape_html(p.prompt)}</h2>`,
        `<img src="${src}?t=${info.running ? info.frames : 0}" alt="">`,
        info.running ? `<progress max="${p.frames}" value="${info.frames}"></progress>` : "",
        `<div id="status">${state} · strength ${p.strength} · steps ${p.steps} · noise ${p.noise} · spread ${p.spread} · seed ${p.seed} · ${p.fps} fps${p.dry_run ? " · dry run" : ""}</div>`,
        info.gif ? `<div id="status"><a href="runs/${info.id}/animation.gif" download style="color:var(--gold)">download gif</a> · frames in runs/${info.id}/frames/</div>` : "",
        info.log && info.log.length ? `<div id="log">${escape_html(info.log.slice(-8).join("\n"))}</div>` : "",
    ];
    view.innerHTML = html.join("");
}

function render_gallery() {
    gallery.innerHTML = "";
    for (const info of runs) {
        const card = document.createElement("div");
        card.className = "card" + (info.id === selected ? " selected" : "");
        const src = info.gif ? `runs/${info.id}/animation.gif` : frame_url(info.id, Math.max(info.frames, 0));
        card.innerHTML = `<img src="${src}" alt="" loading="lazy">
            <div class="prompt">${escape_html(info.params.prompt)}</div>
            <div class="meta">${info.id.slice(0, 8)} ${info.id.slice(9, 15)} · ${info.running ? "running" : info.gif ? info.params.frames + " frames" : info.error || "stopped"}</div>`;
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
    render_gallery();
    if (running) {
        if (selected !== running.id) selected = running.id;
        render_view(await api(`api/runs/${running.id}`));
        render_gallery();
    } else if (selected) {
        render_view(await api(`api/runs/${selected}`));
    }
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
