// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// One sheet flat on a dark mat, as it will be cut: material light, holes dark. Its
// picture is moved by dragging and resized by a corner or the wheel.

let n_px__handle = 9;

let f_o_editor = function(el_canvas, f_on_change){
    let o_context = el_canvas.getContext('2d');
    // { o_sheet: { o_art, n_mm__x, n_mm__y, n_mm__width }, el_canvas__material, n_mm__sheet_x,
    //   n_mm__sheet_y, n_mm__hidden_side, n_mm__hidden_top }
    let o_model = null;

    // The sheet on the canvas: pixels per mm and where its top left is, with room around
    // for a picture larger than the sheet.
    let f_o_view = function(){
        let n_w = el_canvas.clientWidth, n_h = el_canvas.clientHeight;
        let n_px = Math.min(n_w / (o_model.n_mm__sheet_x * 1.35), n_h / (o_model.n_mm__sheet_y * 1.25));
        return { n_px, n_x: (n_w - o_model.n_mm__sheet_x * n_px) / 2, n_y: (n_h - o_model.n_mm__sheet_y * n_px) / 2 };
    };

    // The picture's box on the canvas, and its four corners.
    let f_o_box = function(o_view){
        let o_sheet = o_model.o_sheet;
        let n_x = o_view.n_x + o_sheet.n_mm__x * o_view.n_px, n_y = o_view.n_y + o_sheet.n_mm__y * o_view.n_px;
        let n_w = o_sheet.n_mm__width * o_view.n_px, n_h = n_w * o_sheet.o_art.n_ratio;
        return { n_x, n_y, n_w, n_h, a_a_n_corner: [[n_x, n_y], [n_x + n_w, n_y], [n_x + n_w, n_y + n_h], [n_x, n_y + n_h]] };
    };

    let f_draw = function(){
        let n_w = el_canvas.clientWidth, n_h = el_canvas.clientHeight;
        let n_ratio = window.devicePixelRatio || 1;
        if(el_canvas.width !== Math.round(n_w * n_ratio) || el_canvas.height !== Math.round(n_h * n_ratio)){
            el_canvas.width = Math.round(n_w * n_ratio);
            el_canvas.height = Math.round(n_h * n_ratio);
        }
        o_context.setTransform(n_ratio, 0, 0, n_ratio, 0, 0);
        o_context.clearRect(0, 0, n_w, n_h);
        if(!o_model){ return; }
        let o_view = f_o_view();
        let n_sx = o_model.n_mm__sheet_x * o_view.n_px, n_sy = o_model.n_mm__sheet_y * o_view.n_px;
        o_context.fillStyle = '#34322e';
        o_context.fillRect(o_view.n_x, o_view.n_y, n_sx, n_sy);
        o_context.drawImage(o_model.el_canvas__material, o_view.n_x, o_view.n_y, n_sx, n_sy);
        // what the box hides: the edges in the grooves and under the bar at the top
        let n_side = o_model.n_mm__hidden_side * o_view.n_px, n_top = o_model.n_mm__hidden_top * o_view.n_px;
        o_context.fillStyle = 'rgba(255, 140, 0, 0.22)';
        o_context.fillRect(o_view.n_x, o_view.n_y, n_sx, n_top);
        o_context.fillRect(o_view.n_x, o_view.n_y + n_top, n_side, n_sy - n_top);
        o_context.fillRect(o_view.n_x + n_sx - n_side, o_view.n_y + n_top, n_side, n_sy - n_top);
        if(!o_model.o_sheet.o_art){ return; }
        let o_box = f_o_box(o_view);
        o_context.strokeStyle = '#1e88e5';
        o_context.lineWidth = 1.5;
        o_context.setLineDash([6, 4]);
        o_context.strokeRect(o_box.n_x, o_box.n_y, o_box.n_w, o_box.n_h);
        o_context.setLineDash([]);
        o_context.fillStyle = '#fff';
        for(let [n_x, n_y] of o_box.a_a_n_corner){
            o_context.fillRect(n_x - n_px__handle / 2, n_y - n_px__handle / 2, n_px__handle, n_px__handle);
            o_context.strokeRect(n_x - n_px__handle / 2, n_y - n_px__handle / 2, n_px__handle, n_px__handle);
        }
    };

    let f_set = function(o_model_new){
        o_model = o_model_new;
        f_draw();
    };

    // The picture n_factor times as large, the canvas point n_x, n_y staying where it is.
    let f_scale = function(n_factor, n_x, n_y){
        let o_sheet = o_model.o_sheet, o_view = f_o_view();
        let n_mm__x = (n_x - o_view.n_x) / o_view.n_px, n_mm__y = (n_y - o_view.n_y) / o_view.n_px;
        n_factor = Math.max(1 / o_sheet.n_mm__width, Math.min(3000 / o_sheet.n_mm__width, n_factor));
        o_sheet.n_mm__x = n_mm__x + (o_sheet.n_mm__x - n_mm__x) * n_factor;
        o_sheet.n_mm__y = n_mm__y + (o_sheet.n_mm__y - n_mm__y) * n_factor;
        o_sheet.n_mm__width *= n_factor;
    };

    let o_drag = null;
    let f_a_n__point = function(o_event){
        let o_rect = el_canvas.getBoundingClientRect();
        return [o_event.clientX - o_rect.left, o_event.clientY - o_rect.top];
    };
    el_canvas.addEventListener('pointerdown', function(o_event){
        if(!o_model?.o_sheet.o_art){ return; }
        let [n_x, n_y] = f_a_n__point(o_event);
        let o_view = f_o_view(), o_box = f_o_box(o_view);
        let n_corner = o_box.a_a_n_corner.findIndex(function([n_cx, n_cy]){ return Math.abs(n_x - n_cx) <= n_px__handle && Math.abs(n_y - n_cy) <= n_px__handle; });
        if(n_corner >= 0){
            // the corner across stays where it is
            o_drag = { a_n_anchor: o_box.a_a_n_corner[(n_corner + 2) % 4] };
        } else if(n_x >= o_box.n_x && n_x <= o_box.n_x + o_box.n_w && n_y >= o_box.n_y && n_y <= o_box.n_y + o_box.n_h){
            o_drag = { n_x, n_y };
        } else{
            return;
        }
        el_canvas.setPointerCapture(o_event.pointerId);
    });
    el_canvas.addEventListener('pointermove', function(o_event){
        if(!o_drag){ return; }
        let [n_x, n_y] = f_a_n__point(o_event);
        let o_sheet = o_model.o_sheet, o_view = f_o_view();
        if(o_drag.a_n_anchor){
            let [n_ax, n_ay] = o_drag.a_n_anchor;
            let n_w = Math.max(Math.abs(n_x - n_ax), Math.abs(n_y - n_ay) / o_sheet.o_art.n_ratio, o_view.n_px);
            o_sheet.n_mm__width = n_w / o_view.n_px;
            o_sheet.n_mm__x = ((n_x < n_ax ? n_ax - n_w : n_ax) - o_view.n_x) / o_view.n_px;
            o_sheet.n_mm__y = ((n_y < n_ay ? n_ay - n_w * o_sheet.o_art.n_ratio : n_ay) - o_view.n_y) / o_view.n_px;
        } else{
            o_sheet.n_mm__x += (n_x - o_drag.n_x) / o_view.n_px;
            o_sheet.n_mm__y += (n_y - o_drag.n_y) / o_view.n_px;
            o_drag = { n_x, n_y };
        }
        f_on_change();
    });
    el_canvas.addEventListener('pointerup', function(){ o_drag = null; });
    el_canvas.addEventListener('wheel', function(o_event){
        if(!o_model?.o_sheet.o_art){ return; }
        o_event.preventDefault();
        f_scale(Math.exp(-o_event.deltaY * 0.001), ...f_a_n__point(o_event));
        f_on_change();
    }, { passive: false });
    new ResizeObserver(f_draw).observe(el_canvas);

    return { f_set, f_draw };
};

export { f_o_editor };
