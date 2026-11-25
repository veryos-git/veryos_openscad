// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Shows the parts with WebGL2: triangles in their colours, lit from a few sides, their
// edges, or seen through. Left drag orbits, right drag pans, the wheel zooms and a double
// click goes back to the start. A tool, as the gizmo of a cut, draws its lines and faces
// over the parts and takes the pointer where it is on one of its handles. Made from the
// Lichterkette app's viewer.

let n_deg = Math.PI / 180;
// Half the view's angle.
let n_rad__half_view = 12 * n_deg;

// What a look's faces are drawn as, and whether its edges are drawn on them.
let o_look__by_name = {
    day: { n_face: 0 },
    edges: { n_face: 0, b_edge: true },
    xray: { n_face: 1 }
};

let s_vertex = `#version 300 es
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_col;
uniform mat4 o_view_projection;
uniform float n_lift;
out vec3 o_pos;
out vec3 o_col;
void main(){
    o_pos = a_pos;
    o_col = a_col;
    gl_Position = o_view_projection * vec4(a_pos, 1.0);
    // Edges come a little towards the eye, so they show on their faces.
    gl_Position.z -= n_lift * gl_Position.w;
}`;

let s_fragment = `#version 300 es
precision highp float;
in vec3 o_pos;
in vec3 o_col;
uniform vec3 o_eye;
uniform int n_look;
out vec4 o_out;

const int n_look_day = 0;
const int n_look_xray = 1;
const int n_look_mark = 2;

float f_n_wrapped(vec3 o_n, vec3 o_l, float n_wrap){
    return max((dot(o_n, normalize(o_l)) + n_wrap) / (1.0 + n_wrap), 0.0);
}

void main(){
    if(n_look == n_look_mark){
        o_out = vec4(0.06, 0.08, 0.09, 1.0);
        return;
    }
    vec3 o_v = normalize(o_eye - o_pos);
    // The face's own normal, as a slicer sees it, towards the eye.
    vec3 o_face = normalize(cross(dFdx(o_pos), dFdy(o_pos)));
    if(dot(o_face, o_v) < 0.0){ o_face = -o_face; }
    if(n_look == n_look_xray){
        // Seen through: a face shows the more, the more it is seen from its side.
        float n_side = 1.0 - abs(dot(o_face, o_v));
        o_out = vec4(o_col, 0.05 + 0.5 * n_side * n_side);
        return;
    }
    vec3 o_albedo = pow(o_col, vec3(2.2));
    vec3 o_key = normalize(vec3(-0.55, -0.72, 0.62));
    vec3 o_light = vec3(1.0, 0.97, 0.94) * 0.95 * f_n_wrapped(o_face, o_key, 0.35);
    o_light += vec3(0.82, 0.88, 1.0) * 0.32 * f_n_wrapped(o_face, vec3(0.85, -0.35, 0.15), 0.35);
    o_light += vec3(1.0, 0.92, 0.9) * 0.22 * f_n_wrapped(o_face, vec3(0.0, 0.9, 0.45), 0.35);
    o_light += vec3(0.30) * (0.55 + 0.45 * o_face.z);
    float n_specular = pow(max(dot(o_face, normalize(o_key + o_v)), 0.0), 42.0) * 0.12;
    vec3 o_linear = o_albedo * o_light + vec3(n_specular);
    // A face seen from behind, inside an open surface, is darker.
    if(!gl_FrontFacing){ o_linear *= 0.45; }
    o_out = vec4(pow(clamp(o_linear, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
}`;

// A tool's lines, points and faces, in one colour each: lines and points over
// everything, faces see-through where nothing is in front of them.
let s_vertex__overlay = `#version 300 es
layout(location = 0) in vec3 a_pos;
uniform mat4 o_view_projection;
uniform float n_point;
uniform vec2 o_shift;
void main(){
    gl_Position = o_view_projection * vec4(a_pos, 1.0);
    // A line is drawn several times, a pixel apart, to be thicker than one.
    gl_Position.xy += o_shift * gl_Position.w;
    gl_PointSize = n_point;
}`;
let s_fragment__overlay = `#version 300 es
precision highp float;
uniform vec3 o_col;
uniform float n_alpha;
uniform bool b_point;
out vec4 o_out;
void main(){
    // A point is round.
    if(b_point && length(gl_PointCoord - vec2(0.5)) > 0.5){ discard; }
    o_out = vec4(o_col, n_alpha);
}`;

let f_a_n_mat4__multiplied = function(a_n_a, a_n_b){
    let a_n = new Float32Array(16);
    for(let n_col = 0; n_col < 4; n_col++){
        for(let n_row = 0; n_row < 4; n_row++){
            a_n[n_col * 4 + n_row] = a_n_a[n_row] * a_n_b[n_col * 4] + a_n_a[n_row + 4] * a_n_b[n_col * 4 + 1]
                + a_n_a[n_row + 8] * a_n_b[n_col * 4 + 2] + a_n_a[n_row + 12] * a_n_b[n_col * 4 + 3];
        }
    }
    return a_n;
};

let f_a_n_mat4__perspective = function(n_rad__fov, n_aspect, n_near, n_far){
    let n_f = 1 / Math.tan(n_rad__fov / 2);
    return new Float32Array([
        n_f / n_aspect, 0, 0, 0,
        0, n_f, 0, 0,
        0, 0, (n_far + n_near) / (n_near - n_far), -1,
        0, 0, 2 * n_far * n_near / (n_near - n_far), 0
    ]);
};

let f_a_n_mat4__look_at = function(a_n_eye, a_n_target, a_n_right){
    let f_a_n__normalized = function(a_n){ let n = Math.hypot(...a_n); return a_n.map(n_v => n_v / n); };
    let a_n_z = f_a_n__normalized([a_n_eye[0] - a_n_target[0], a_n_eye[1] - a_n_target[1], a_n_eye[2] - a_n_target[2]]);
    let a_n_x = a_n_right;
    let a_n_y = [
        a_n_z[1] * a_n_x[2] - a_n_z[2] * a_n_x[1],
        a_n_z[2] * a_n_x[0] - a_n_z[0] * a_n_x[2],
        a_n_z[0] * a_n_x[1] - a_n_z[1] * a_n_x[0]
    ];
    let f_n_dot = (a_n_a, a_n_b) => a_n_a[0] * a_n_b[0] + a_n_a[1] * a_n_b[1] + a_n_a[2] * a_n_b[2];
    return new Float32Array([
        a_n_x[0], a_n_y[0], a_n_z[0], 0,
        a_n_x[1], a_n_y[1], a_n_z[1], 0,
        a_n_x[2], a_n_y[2], a_n_z[2], 0,
        -f_n_dot(a_n_x, a_n_eye), -f_n_dot(a_n_y, a_n_eye), -f_n_dot(a_n_z, a_n_eye), 1
    ]);
};

// Where the eye is, and which way is right for it: from straight above too, where the
// azimuth alone tells.
let f_o_eye = function(a_n_target, n_rad__azimuth, n_rad__polar, n_distance){
    let n_sin = Math.sin(n_rad__polar);
    return {
        a_n_eye: [
            a_n_target[0] + n_distance * n_sin * Math.cos(n_rad__azimuth),
            a_n_target[1] + n_distance * n_sin * Math.sin(n_rad__azimuth),
            a_n_target[2] + n_distance * Math.cos(n_rad__polar)
        ],
        a_n_right: [-Math.sin(n_rad__azimuth), Math.cos(n_rad__azimuth), 0]
    };
};

let f_o_shader = function(o_gl, n_type, s_source){
    let o_shader = o_gl.createShader(n_type);
    o_gl.shaderSource(o_shader, s_source);
    o_gl.compileShader(o_shader);
    if(!o_gl.getShaderParameter(o_shader, o_gl.COMPILE_STATUS)){ throw new Error(o_gl.getShaderInfoLog(o_shader)); }
    return o_shader;
};

let f_o_viewer = function(el_canvas){
    let o_gl = el_canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    if(!o_gl){ throw new Error('this browser has no WebGL2'); }
    let f_o_program = function(s_vertex__of, s_fragment__of, a_s_uniform){
        let o_program = o_gl.createProgram();
        o_gl.attachShader(o_program, f_o_shader(o_gl, o_gl.VERTEX_SHADER, s_vertex__of));
        o_gl.attachShader(o_program, f_o_shader(o_gl, o_gl.FRAGMENT_SHADER, s_fragment__of));
        o_gl.linkProgram(o_program);
        if(!o_gl.getProgramParameter(o_program, o_gl.LINK_STATUS)){ throw new Error(o_gl.getProgramInfoLog(o_program)); }
        let o_uniform = {};
        for(let s_name of a_s_uniform){ o_uniform[s_name] = o_gl.getUniformLocation(o_program, s_name); }
        return { o_program, o_uniform };
    };
    let { o_program, o_uniform } = f_o_program(s_vertex, s_fragment, ['o_view_projection', 'n_lift', 'o_eye', 'n_look']);
    let o_overlay = f_o_program(s_vertex__overlay, s_fragment__overlay, ['o_view_projection', 'n_point', 'o_shift', 'o_col', 'n_alpha', 'b_point']);
    o_overlay.o_vao = o_gl.createVertexArray();
    o_overlay.o_buffer = o_gl.createBuffer();
    o_gl.bindVertexArray(o_overlay.o_vao);
    o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_overlay.o_buffer);
    o_gl.enableVertexAttribArray(0);
    o_gl.vertexAttribPointer(0, 3, o_gl.FLOAT, false, 0, 0);
    o_gl.bindVertexArray(null);

    // The parts: triangles of their own points, so each has its own colour.
    let o_mesh = {
        o_vao: o_gl.createVertexArray(), o_vao__edge: o_gl.createVertexArray(),
        o_buffer__pos: o_gl.createBuffer(), o_buffer__col: o_gl.createBuffer(), o_buffer__edge: o_gl.createBuffer(),
        n_cnt: 0, n_cnt__edge: -1
    };
    for(let o_vao of [o_mesh.o_vao, o_mesh.o_vao__edge]){
        o_gl.bindVertexArray(o_vao);
        o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_mesh.o_buffer__pos);
        o_gl.enableVertexAttribArray(0);
        o_gl.vertexAttribPointer(0, 3, o_gl.FLOAT, false, 0, 0);
        o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_mesh.o_buffer__col);
        o_gl.enableVertexAttribArray(1);
        o_gl.vertexAttribPointer(1, 3, o_gl.UNSIGNED_BYTE, true, 0, 0);
    }
    o_gl.bindVertexArray(o_mesh.o_vao__edge);
    o_gl.bindBuffer(o_gl.ELEMENT_ARRAY_BUFFER, o_mesh.o_buffer__edge);
    o_gl.bindVertexArray(null);

    let o_tool = null;
    let n_id__tool = null;
    let o_view = { s_look: 'day' };
    let o_camera = { n_rad__azimuth: 0, n_rad__polar: 0, n_distance: 1, a_n_target: [0, 0, 0] };
    let o_start = { n_rad__azimuth: -Math.PI / 2 - 0.5, n_rad__polar: 1.15, n_distance: 500, a_n_target: [0, 0, 40] };
    Object.assign(o_camera, o_start, { a_n_target: [...o_start.a_n_target] });
    let b_dirty = true;
    let f_set_dirty = function(){ b_dirty = true; };

    // Each triangle's three edges: made when a look first shows them.
    let f_make_edge = function(){
        let a_n_edge = new Uint32Array(o_mesh.n_cnt * 2);
        for(let n_tri = 0; n_tri < o_mesh.n_cnt / 3; n_tri++){
            a_n_edge.set([n_tri * 3, n_tri * 3 + 1, n_tri * 3 + 1, n_tri * 3 + 2, n_tri * 3 + 2, n_tri * 3], n_tri * 6);
        }
        o_gl.bindVertexArray(o_mesh.o_vao__edge);
        o_gl.bufferData(o_gl.ELEMENT_ARRAY_BUFFER, a_n_edge, o_gl.STATIC_DRAW);
        o_gl.bindVertexArray(null);
        o_mesh.n_cnt__edge = a_n_edge.length;
    };

    // The eye as a tool needs it.
    let f_o_camera__tool = function(){
        let { a_n_eye, a_n_right } = f_o_eye(o_camera.a_n_target, o_camera.n_rad__azimuth, o_camera.n_rad__polar, o_camera.n_distance);
        let a_n_back = [a_n_eye[0] - o_camera.a_n_target[0], a_n_eye[1] - o_camera.a_n_target[1], a_n_eye[2] - o_camera.a_n_target[2]].map(function(n_val){ return n_val / o_camera.n_distance; });
        return {
            a_n_eye,
            a_n_right,
            a_n_up: [a_n_back[1] * a_n_right[2] - a_n_back[2] * a_n_right[1], a_n_back[2] * a_n_right[0] - a_n_back[0] * a_n_right[2], a_n_back[0] * a_n_right[1] - a_n_back[1] * a_n_right[0]],
            a_n_forward: [-a_n_back[0], -a_n_back[1], -a_n_back[2]],
            n_tan: Math.tan(n_rad__half_view),
            n_scl_x: el_canvas.clientWidth,
            n_scl_y: el_canvas.clientHeight
        };
    };

    // The tool's faces, lines and points, over the parts.
    let f_draw_overlay = function(a_n_view_projection, n_ratio){
        let a_o_shape = o_tool.f_a_o_shape(f_o_camera__tool());
        if(a_o_shape.length === 0){ return; }
        o_gl.useProgram(o_overlay.o_program);
        o_gl.uniformMatrix4fv(o_overlay.o_uniform.o_view_projection, false, a_n_view_projection);
        o_gl.bindVertexArray(o_overlay.o_vao);
        o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_overlay.o_buffer);
        // Faces first, behind what is in front of them; then lines and points over all.
        for(let s_type of ['fill', 'line', 'point']){
            if(s_type === 'fill'){
                o_gl.enable(o_gl.DEPTH_TEST);
                o_gl.depthMask(false);
                o_gl.enable(o_gl.BLEND);
                o_gl.blendFunc(o_gl.SRC_ALPHA, o_gl.ONE_MINUS_SRC_ALPHA);
            } else {
                o_gl.disable(o_gl.DEPTH_TEST);
                o_gl.disable(o_gl.BLEND);
            }
            for(let o_shape of a_o_shape){
                if(o_shape.s_type !== s_type){ continue; }
                o_gl.bufferData(o_gl.ARRAY_BUFFER, o_shape.a_n_pos, o_gl.DYNAMIC_DRAW);
                o_gl.uniform3fv(o_overlay.o_uniform.o_col, o_shape.a_n_col);
                o_gl.uniform1f(o_overlay.o_uniform.n_alpha, s_type === 'fill' ? (o_shape.n_alpha ?? 0.2) : 1);
                o_gl.uniform1i(o_overlay.o_uniform.b_point, s_type === 'point' ? 1 : 0);
                o_gl.uniform1f(o_overlay.o_uniform.n_point, (o_shape.n_px ?? 1) * n_ratio);
                let n_mode = s_type === 'fill' ? o_gl.TRIANGLES : (s_type === 'point' ? o_gl.POINTS : o_gl.LINES);
                // Half a pixel to each side: a line two pixels wide.
                for(let [n_x, n_y] of (s_type === 'line' ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[0, 0]])){
                    o_gl.uniform2f(o_overlay.o_uniform.o_shift, n_x / el_canvas.width, n_y / el_canvas.height);
                    o_gl.drawArrays(n_mode, 0, o_shape.a_n_pos.length / 3);
                }
            }
        }
        o_gl.depthMask(true);
        o_gl.bindVertexArray(null);
        o_gl.useProgram(o_program);
    };

    let f_draw = function(){
        let n_ratio = Math.min(window.devicePixelRatio || 1, 2);
        let n_scl_x = Math.max(1, Math.round(el_canvas.clientWidth * n_ratio));
        let n_scl_y = Math.max(1, Math.round(el_canvas.clientHeight * n_ratio));
        if(el_canvas.width !== n_scl_x || el_canvas.height !== n_scl_y){
            el_canvas.width = n_scl_x;
            el_canvas.height = n_scl_y;
        }
        o_gl.viewport(0, 0, n_scl_x, n_scl_y);
        o_gl.clearColor(0, 0, 0, 0);
        o_gl.clear(o_gl.COLOR_BUFFER_BIT | o_gl.DEPTH_BUFFER_BIT);
        let { a_n_eye, a_n_right } = f_o_eye(o_camera.a_n_target, o_camera.n_rad__azimuth, o_camera.n_rad__polar, o_camera.n_distance);
        let a_n_view_projection = f_a_n_mat4__multiplied(
            f_a_n_mat4__perspective(2 * n_rad__half_view, n_scl_x / n_scl_y, o_camera.n_distance * 0.05, o_camera.n_distance * 6),
            f_a_n_mat4__look_at(a_n_eye, o_camera.a_n_target, a_n_right)
        );
        o_gl.useProgram(o_program);
        let o_look = o_look__by_name[o_view.s_look];
        o_gl.uniformMatrix4fv(o_uniform.o_view_projection, false, a_n_view_projection);
        o_gl.uniform3fv(o_uniform.o_eye, a_n_eye);
        o_gl.uniform1f(o_uniform.n_lift, 0);
        o_gl.uniform1i(o_uniform.n_look, o_look.n_face);
        // Seen through, the faces add up, whatever lies in front.
        if(o_look.n_face === 1){
            o_gl.disable(o_gl.DEPTH_TEST);
            o_gl.enable(o_gl.BLEND);
            o_gl.blendFuncSeparate(o_gl.SRC_ALPHA, o_gl.ONE, o_gl.ONE, o_gl.ONE);
        } else {
            o_gl.enable(o_gl.DEPTH_TEST);
            o_gl.disable(o_gl.BLEND);
        }
        if(o_mesh.n_cnt > 0){
            o_gl.bindVertexArray(o_mesh.o_vao);
            o_gl.drawArrays(o_gl.TRIANGLES, 0, o_mesh.n_cnt);
            if(o_look.b_edge){
                if(o_mesh.n_cnt__edge < 0){ f_make_edge(); }
                o_gl.uniform1i(o_uniform.n_look, 2);
                o_gl.uniform1f(o_uniform.n_lift, 0.0006);
                o_gl.bindVertexArray(o_mesh.o_vao__edge);
                o_gl.drawElements(o_gl.LINES, o_mesh.n_cnt__edge, o_gl.UNSIGNED_INT, 0);
            }
            o_gl.bindVertexArray(null);
        }
        if(o_tool){ f_draw_overlay(a_n_view_projection, n_ratio); }
    };

    let f_loop = function(){
        if(b_dirty){
            b_dirty = false;
            f_draw();
        }
        requestAnimationFrame(f_loop);
    };
    requestAnimationFrame(f_loop);
    new ResizeObserver(f_set_dirty).observe(el_canvas);

    // Pointer: orbit and pan. Two fingers pinch.
    let o_pointer__by_id = new Map();
    let n_distance__pinch = 0;
    el_canvas.addEventListener('contextmenu', function(o_evt){ o_evt.preventDefault(); });
    // Where the pointer is on the canvas, in pixels from its upper left.
    let f_a_n_px = function(o_evt){
        let o_rect = el_canvas.getBoundingClientRect();
        return [o_evt.clientX - o_rect.left, o_evt.clientY - o_rect.top];
    };
    el_canvas.addEventListener('pointerdown', function(o_evt){
        el_canvas.setPointerCapture(o_evt.pointerId);
        // A tool's handle under the pointer takes it; else the pointer turns the view.
        if(o_tool && o_evt.button === 0 && !o_evt.shiftKey && o_pointer__by_id.size === 0 && n_id__tool === null
            && o_tool.f_b_down(...f_a_n_px(o_evt), f_o_camera__tool())){
            n_id__tool = o_evt.pointerId;
            f_set_dirty();
            return;
        }
        o_pointer__by_id.set(o_evt.pointerId, { n_x: o_evt.clientX, n_y: o_evt.clientY, n_button: o_evt.button });
        if(o_pointer__by_id.size === 2){
            let [o_a, o_b] = [...o_pointer__by_id.values()];
            n_distance__pinch = Math.hypot(o_a.n_x - o_b.n_x, o_a.n_y - o_b.n_y);
        }
    });
    el_canvas.addEventListener('pointermove', function(o_evt){
        if(o_evt.pointerId === n_id__tool){
            o_tool.f_move(...f_a_n_px(o_evt));
            f_set_dirty();
            return;
        }
        let o_pointer = o_pointer__by_id.get(o_evt.pointerId);
        if(!o_pointer){
            // Over the view without a button: a tool's handle under the pointer lights up.
            if(o_tool && o_tool.f_b_hover(...f_a_n_px(o_evt), f_o_camera__tool())){ f_set_dirty(); }
            return;
        }
        let n_dx = o_evt.clientX - o_pointer.n_x, n_dy = o_evt.clientY - o_pointer.n_y;
        o_pointer.n_x = o_evt.clientX;
        o_pointer.n_y = o_evt.clientY;
        if(o_pointer__by_id.size === 2){
            let [o_a, o_b] = [...o_pointer__by_id.values()];
            let n_distance = Math.hypot(o_a.n_x - o_b.n_x, o_a.n_y - o_b.n_y);
            o_camera.n_distance = Math.max(20, Math.min(5000, o_camera.n_distance * n_distance__pinch / Math.max(n_distance, 1)));
            n_distance__pinch = n_distance;
        } else if(o_pointer.n_button === 0 && !o_evt.shiftKey){
            o_camera.n_rad__azimuth -= n_dx * 0.0075;
            o_camera.n_rad__polar = Math.max(0.001, Math.min(Math.PI - 0.001, o_camera.n_rad__polar - n_dy * 0.0075));
        } else {
            let o_eye = f_o_camera__tool();
            let n_mm_per_px = 2 * o_camera.n_distance * Math.tan(n_rad__half_view) / Math.max(el_canvas.clientHeight, 1);
            for(let n_k = 0; n_k < 3; n_k++){ o_camera.a_n_target[n_k] += (-o_eye.a_n_right[n_k] * n_dx + o_eye.a_n_up[n_k] * n_dy) * n_mm_per_px; }
        }
        f_set_dirty();
    });
    let f_end_pointer = function(o_evt){
        if(o_evt.pointerId === n_id__tool){
            n_id__tool = null;
            o_tool.f_up();
            f_set_dirty();
        }
        o_pointer__by_id.delete(o_evt.pointerId);
    };
    el_canvas.addEventListener('pointerup', f_end_pointer);
    el_canvas.addEventListener('pointercancel', f_end_pointer);
    el_canvas.addEventListener('wheel', function(o_evt){
        o_evt.preventDefault();
        o_camera.n_distance = Math.max(20, Math.min(5000, o_camera.n_distance * Math.exp(o_evt.deltaY * 0.001)));
        f_set_dirty();
    }, { passive: false });
    el_canvas.addEventListener('dblclick', function(){
        Object.assign(o_camera, o_start, { a_n_target: [...o_start.a_n_target] });
        f_set_dirty();
    });

    return {
        // Triangles, nine numbers each, and their corners' colours, r, g, b from 0 to 255.
        f_set_mesh: function({ a_n_pos, a_n_col }){
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_mesh.o_buffer__pos);
            o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n_pos, o_gl.DYNAMIC_DRAW);
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_mesh.o_buffer__col);
            o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n_col, o_gl.DYNAMIC_DRAW);
            o_mesh.n_cnt = a_n_pos.length / 3;
            o_mesh.n_cnt__edge = -1;
            f_set_dirty();
        },
        f_set_view: function(o_change){
            Object.assign(o_view, o_change);
            f_set_dirty();
        },
        // Fits the view to a box, from its lowest to its highest corner.
        f_frame: function(a_n_min, a_n_max){
            let n_size = Math.max(Math.hypot(a_n_max[0] - a_n_min[0], a_n_max[1] - a_n_min[1], a_n_max[2] - a_n_min[2]), 1);
            o_start.a_n_target = [0, 1, 2].map(function(n_k){ return (a_n_min[n_k] + a_n_max[n_k]) / 2; });
            o_start.n_distance = 1.1 * n_size / (2 * Math.tan(n_rad__half_view));
            Object.assign(o_camera, o_start, { a_n_target: [...o_start.a_n_target] });
            f_set_dirty();
        },
        // Looks from a side: azimuth -90 degrees is the front, polar 0 the top.
        f_look_from: function(n_rad__azimuth, n_rad__polar){
            Object.assign(o_camera, { n_rad__azimuth, n_rad__polar: Math.max(0.001, Math.min(Math.PI - 0.001, n_rad__polar)) });
            f_set_dirty();
        },
        // A tool, or null for none: { f_a_o_shape(o_camera), f_b_down(n_x, n_y, o_camera),
        // f_move(n_x, n_y), f_up(), f_b_hover(n_x, n_y, o_camera) }, see gizmo.module.js.
        f_set_tool: function(o_tool__new){
            o_tool = o_tool__new;
            n_id__tool = null;
            f_set_dirty();
        },
        f_set_dirty
    };
};

// Stands in when WebGL2 is missing: the settings, numbers and the print file still work.
let f_o_viewer__without_3d = function(){
    let f_nothing = function(){};
    return { f_set_mesh: f_nothing, f_set_view: f_nothing, f_frame: f_nothing, f_look_from: f_nothing, f_set_tool: f_nothing, f_set_dirty: f_nothing };
};

export { f_o_viewer, f_o_viewer__without_3d, s_vertex, s_fragment, s_vertex__overlay, s_fragment__overlay, o_look__by_name };
