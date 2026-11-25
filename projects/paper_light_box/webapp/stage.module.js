// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The lit box as a small stage of flat pictures in space, drawn by the browser's own 3D
// transforms: a picture per sheet at its depth, the light behind them, and the box as
// dark faces around them. Dragging turns it, and the sheets shift against each other as
// they do in the real box.

import { el } from './dom.module.js';

let a_s_face = ['lip_left', 'lip_right', 'bar', 'left', 'right', 'top', 'in_left', 'in_right', 'in_top', 'table'];

let f_o_stage = function(el_parent){
    let el_world = el('div', { className: 'world' });
    let el_stage = el('div', { className: 'stage', title: 'Drag to turn the box' }, [el_world]);
    el_parent.append(el_stage);
    let o_view = { n_deg__yaw: -22, n_deg__pitch: 6 };
    let o_scene = null;
    let el_canvas__back = el('canvas', { className: 'plane' });
    let a_el_canvas = [];
    let o_el__face = Object.fromEntries(a_s_face.map(function(s_face){ return [s_face, el('div', { className: `plane face ${s_face}` })]; }));
    el_world.append(el_canvas__back, ...Object.values(o_el__face));

    let f_turn = function(){
        el_world.style.transform = `rotateX(${-o_view.n_deg__pitch}deg) rotateY(${o_view.n_deg__yaw}deg)`;
    };

    // A plane n_w x n_h pixels with its middle at n_x, n_y, n_z: x to the right, y down, z
    // towards the eye.
    let f_place = function(el_plane, n_w, n_h, n_x, n_y, n_z, s_turn = ''){
        Object.assign(el_plane.style, {
            width: `${n_w}px`,
            height: `${n_h}px`,
            left: `${-n_w / 2}px`,
            top: `${-n_h / 2}px`,
            transform: `translate3d(${n_x}px, ${n_y}px, ${n_z}px) ${s_turn}`
        });
    };

    let f_lay_out = function(){
        if(!o_scene){ return; }
        let { n_mm__width: n_w, n_mm__height: n_h, n_mm__depth: n_d } = o_scene;
        // pixels per mm: the box fills most of the stage, with room to turn
        let n_px = Math.min(el_stage.clientWidth * 0.66 / n_w, el_stage.clientHeight * 0.8 / n_h);
        let n_y__sheet = (n_h / 2 - o_scene.n_mm__stop - o_scene.n_mm__sheet_y / 2) * n_px;
        // the sheets without their edges in the grooves: those the box hides
        let s_clip = `inset(${o_scene.n_mm__hidden_top * n_px}px ${o_scene.n_mm__hidden_side * n_px}px 0px ${o_scene.n_mm__hidden_side * n_px}px)`;
        [...o_scene.a_n_mm__depth, o_scene.n_mm__depth__light].forEach(function(n_mm__depth, n_idx){
            let el_canvas = a_el_canvas[n_idx] ?? el_canvas__back;
            f_place(el_canvas, o_scene.n_mm__sheet_x * n_px, o_scene.n_mm__sheet_y * n_px, 0, n_y__sheet, (n_d / 2 - n_mm__depth) * n_px);
            el_canvas.style.clipPath = s_clip;
        });
        let n_lip = (n_w - o_scene.n_mm__window_x) / 2;
        f_place(o_el__face.lip_left, n_lip * n_px, n_h * n_px, -(n_w - n_lip) / 2 * n_px, 0, n_d / 2 * n_px);
        f_place(o_el__face.lip_right, n_lip * n_px, n_h * n_px, (n_w - n_lip) / 2 * n_px, 0, n_d / 2 * n_px);
        f_place(o_el__face.bar, o_scene.n_mm__window_x * n_px + 1, o_scene.n_mm__bar * n_px, 0, -(n_h - o_scene.n_mm__bar) / 2 * n_px, n_d / 2 * n_px);
        f_place(o_el__face.left, n_d * n_px, n_h * n_px, -n_w / 2 * n_px, 0, 0, 'rotateY(90deg)');
        f_place(o_el__face.right, n_d * n_px, n_h * n_px, n_w / 2 * n_px, 0, 0, 'rotateY(90deg)');
        f_place(o_el__face.top, n_w * n_px, n_d * n_px, 0, -n_h / 2 * n_px, 0, 'rotateX(90deg)');
        f_place(o_el__face.table, 5 * n_w * n_px, 5 * n_w * n_px, 0, n_h / 2 * n_px + 1, 0, 'rotateX(90deg)');
        // the walls and the bar's underside around the sheets, from the window back to the light
        let n_in = o_scene.n_mm__depth__light, n_z__in = (n_d / 2 - n_in / 2) * n_px;
        let n_y__bar = -(n_h / 2 - o_scene.n_mm__bar) * n_px;
        f_place(o_el__face.in_left, n_in * n_px, (n_h - o_scene.n_mm__bar) * n_px, -o_scene.n_mm__window_x / 2 * n_px, o_scene.n_mm__bar / 2 * n_px, n_z__in, 'rotateY(90deg)');
        f_place(o_el__face.in_right, n_in * n_px, (n_h - o_scene.n_mm__bar) * n_px, o_scene.n_mm__window_x / 2 * n_px, o_scene.n_mm__bar / 2 * n_px, n_z__in, 'rotateY(90deg)');
        f_place(o_el__face.in_top, o_scene.n_mm__window_x * n_px, n_in * n_px, 0, n_y__bar, n_z__in, 'rotateX(90deg)');
        // the box's plastic in the room's light: nearly black in a dark room
        let n_grey = Math.round(10 + 190 * Math.pow(o_scene.n_room, 0.6));
        // inside it glows towards the light
        let s_glow = `rgb(${o_scene.a_n_colour.map(function(n){ return Math.round(n_grey + (150 - n_grey) * n); }).join(', ')})`;
        o_el__face.in_left.style.background = o_el__face.in_right.style.background = `linear-gradient(to right, rgb(${n_grey}, ${n_grey}, ${n_grey}), ${s_glow})`;
        o_el__face.in_top.style.background = `linear-gradient(to top, rgb(${n_grey}, ${n_grey}, ${n_grey}), ${s_glow})`;
        for(let [s_face, n_shade] of [['lip_left', 1], ['lip_right', 1], ['bar', 1], ['left', 0.75], ['right', 0.75], ['top', 1.2]]){
            let n = Math.round(n_grey * n_shade);
            o_el__face[s_face].style.background = `rgb(${n}, ${n}, ${Math.round(n * 0.97)})`;
        }
        // on the table a little of the light that leaves the open bottom
        o_el__face.table.style.background = `radial-gradient(closest-side, rgba(${o_scene.a_n_colour.map(function(n){ return Math.round(255 * n); }).join(', ')}, 0.16), rgba(0, 0, 0, 0) 55%), `
            + `rgb(${Math.round(n_grey * 0.5)}, ${Math.round(n_grey * 0.48)}, ${Math.round(n_grey * 0.46)})`;
    };

    let f_put = function(el_canvas, a_n_rgba){
        if(el_canvas.width !== o_scene.n_w || el_canvas.height !== o_scene.n_h){
            el_canvas.width = o_scene.n_w;
            el_canvas.height = o_scene.n_h;
        }
        el_canvas.getContext('2d').putImageData(new ImageData(a_n_rgba, o_scene.n_w, o_scene.n_h), 0, 0);
    };

    // o_scene_new: the pictures of light.module.js's f_o_lit (n_w, n_h, a_a_n_rgba,
    // a_n_rgba__back), where they are (a_n_mm__depth, n_mm__depth__light behind the front
    // face, n_mm__stop above the table, n_mm__sheet_x, n_mm__sheet_y), and the box
    // (n_mm__width, n_mm__height, n_mm__depth, n_mm__window_x, n_mm__bar, n_room, a_n_colour).
    let f_set = function(o_scene_new){
        o_scene = o_scene_new;
        while(a_el_canvas.length < o_scene.a_a_n_rgba.length){
            let el_canvas = el('canvas', { className: 'plane' });
            a_el_canvas.push(el_canvas);
            el_world.append(el_canvas);
        }
        while(a_el_canvas.length > o_scene.a_a_n_rgba.length){ a_el_canvas.pop().remove(); }
        o_scene.a_a_n_rgba.forEach(function(a_n_rgba, n_idx){ f_put(a_el_canvas[n_idx], a_n_rgba); });
        f_put(el_canvas__back, o_scene.a_n_rgba__back);
        f_lay_out();
    };

    let o_drag = null;
    el_stage.addEventListener('pointerdown', function(o_event){
        o_drag = { n_x: o_event.clientX, n_y: o_event.clientY };
        el_stage.setPointerCapture(o_event.pointerId);
    });
    el_stage.addEventListener('pointermove', function(o_event){
        if(!o_drag){ return; }
        o_view.n_deg__yaw = Math.max(-75, Math.min(75, o_view.n_deg__yaw + (o_event.clientX - o_drag.n_x) * 0.3));
        o_view.n_deg__pitch = Math.max(-30, Math.min(40, o_view.n_deg__pitch + (o_event.clientY - o_drag.n_y) * 0.3));
        o_drag = { n_x: o_event.clientX, n_y: o_event.clientY };
        f_turn();
    });
    el_stage.addEventListener('pointerup', function(){ o_drag = null; });
    el_stage.addEventListener('dblclick', function(){
        o_view = { n_deg__yaw: 0, n_deg__pitch: 0 };
        f_turn();
    });
    new ResizeObserver(f_lay_out).observe(el_stage);
    f_turn();

    return { f_set };
};

export { f_o_stage };
