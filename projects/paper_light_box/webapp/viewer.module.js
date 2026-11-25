// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A small WebGL2 view of the box, as the ball joint app's without its cut: meshes in
// their colour on a 5 mm grid. Drag turns, the wheel zooms, a right or shift drag moves.

// GLSL reserves names with two underscores in a row: the shaders' names have one.
let s_glsl__vertex = `#version 300 es
in vec3 v_pos;
in vec3 v_nor;
uniform mat4 m_view;
uniform mat4 m_proj;
out vec3 v_nor_view;
void main(){
    v_nor_view = mat3(m_view) * v_nor;
    gl_Position = m_proj * m_view * vec4(v_pos, 1.0);
}`;

let s_glsl__fragment = `#version 300 es
precision highp float;
in vec3 v_nor_view;
uniform vec3 v_colour;
uniform float n_line;
out vec4 v_out;
void main(){
    if(n_line > 0.5){ v_out = vec4(v_colour, 1.0); return; }
    vec3 v_n = normalize(v_nor_view);
    float n_light = 0.35 + 0.65 * max(dot(v_n, normalize(vec3(0.3, 0.5, 1.0))), 0.0);
    v_out = vec4(v_colour * n_light, 1.0);
}`;

let f_m_perspective = function(n_fov, n_aspect, n_near, n_far){
    let n_f = 1 / Math.tan(n_fov / 2);
    return [n_f / n_aspect, 0, 0, 0, 0, n_f, 0, 0, 0, 0, (n_far + n_near) / (n_near - n_far), -1, 0, 0, 2 * n_far * n_near / (n_near - n_far), 0];
};

// Camera on a sphere around the target, z up.
let f_m_look = function(a_n_eye, a_n_target){
    let f_norm = function(a){ let n = Math.hypot(...a) || 1; return a.map(function(v){ return v / n; }); };
    let f_cross = function(a, b){ return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    let a_n_z = f_norm(a_n_eye.map(function(v, i){ return v - a_n_target[i]; }));
    let a_n_x = f_norm(f_cross([0, 0, 1], a_n_z));
    let a_n_y = f_cross(a_n_z, a_n_x);
    let f_dot = function(a, b){ return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
    return [a_n_x[0], a_n_y[0], a_n_z[0], 0, a_n_x[1], a_n_y[1], a_n_z[1], 0, a_n_x[2], a_n_y[2], a_n_z[2], 0,
        -f_dot(a_n_x, a_n_eye), -f_dot(a_n_y, a_n_eye), -f_dot(a_n_z, a_n_eye), 1];
};

let f_o_shader = function(o_gl){
    let f_compile = function(n_type, s_src){
        let o_shader = o_gl.createShader(n_type);
        o_gl.shaderSource(o_shader, s_src);
        o_gl.compileShader(o_shader);
        if(!o_gl.getShaderParameter(o_shader, o_gl.COMPILE_STATUS)){ throw new Error(o_gl.getShaderInfoLog(o_shader)); }
        return o_shader;
    };
    let o_program = o_gl.createProgram();
    o_gl.attachShader(o_program, f_compile(o_gl.VERTEX_SHADER, s_glsl__vertex));
    o_gl.attachShader(o_program, f_compile(o_gl.FRAGMENT_SHADER, s_glsl__fragment));
    o_gl.linkProgram(o_program);
    if(!o_gl.getProgramParameter(o_program, o_gl.LINK_STATUS)){ throw new Error(o_gl.getProgramInfoLog(o_program)); }
    return o_program;
};

// Positions and flat normals, three corners per triangle, for drawArrays.
let f_a_n__flat = function(a_n_pos, a_n_idx, n_x, n_y){
    let a_n_out = new Float32Array(a_n_idx.length * 6);
    for(let n_it = 0; n_it < a_n_idx.length; n_it += 3){
        let a_a_n = [0, 1, 2].map(function(n_corner){
            let n_off = a_n_idx[n_it + n_corner] * 3;
            return [a_n_pos[n_off] + n_x, a_n_pos[n_off + 1] + n_y, a_n_pos[n_off + 2]];
        });
        let a_n_u = a_a_n[1].map(function(v, i){ return v - a_a_n[0][i]; });
        let a_n_v = a_a_n[2].map(function(v, i){ return v - a_a_n[0][i]; });
        let a_n_nor = [a_n_u[1] * a_n_v[2] - a_n_u[2] * a_n_v[1], a_n_u[2] * a_n_v[0] - a_n_u[0] * a_n_v[2], a_n_u[0] * a_n_v[1] - a_n_u[1] * a_n_v[0]];
        let n_len = Math.hypot(...a_n_nor) || 1;
        for(let n_corner = 0; n_corner < 3; n_corner++){
            a_n_out.set([...a_a_n[n_corner], ...a_n_nor.map(function(v){ return v / n_len; })], (n_it + n_corner) * 6);
        }
    }
    return a_n_out;
};

let f_o_viewer = function(el_canvas){
    let o_gl = el_canvas.getContext('webgl2', { antialias: true });
    if(!o_gl){ throw new Error('this browser has no WebGL2'); }
    let o_program = f_o_shader(o_gl);
    let o_loc = {
        v_pos: o_gl.getAttribLocation(o_program, 'v_pos'),
        v_nor: o_gl.getAttribLocation(o_program, 'v_nor'),
        m_view: o_gl.getUniformLocation(o_program, 'm_view'),
        m_proj: o_gl.getUniformLocation(o_program, 'm_proj'),
        v_colour: o_gl.getUniformLocation(o_program, 'v_colour'),
        n_line: o_gl.getUniformLocation(o_program, 'n_line')
    };
    let a_o_draw = [];
    let o_grid = null;
    // n_size: the meshes' size while the camera still has to be aimed at them, else 0
    let o_state = { n_yaw: -1.1, n_pitch: 0.45, n_dist: 80, n_size: 0, a_n_target: [0, 0, 3] };

    let f_o_buffer = function(a_n){
        let o_buffer = o_gl.createBuffer();
        o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_buffer);
        o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n, o_gl.STATIC_DRAW);
        return o_buffer;
    };

    let f_draw = function(){
        let n_w = el_canvas.clientWidth, n_h = el_canvas.clientHeight;
        let n_dpr = window.devicePixelRatio || 1;
        if(el_canvas.width !== Math.round(n_w * n_dpr) || el_canvas.height !== Math.round(n_h * n_dpr)){
            el_canvas.width = Math.round(n_w * n_dpr);
            el_canvas.height = Math.round(n_h * n_dpr);
        }
        // a narrow view steps back until the meshes fit its width; not before the view shows
        if(o_state.n_size && n_w > 0 && n_h > 0){
            o_state.n_dist = (1.6 * o_state.n_size + 10) / Math.min(1, n_w / n_h);
            o_state.n_size = 0;
        }
        o_gl.viewport(0, 0, el_canvas.width, el_canvas.height);
        o_gl.clearColor(0.96, 0.96, 0.95, 1);
        o_gl.clear(o_gl.COLOR_BUFFER_BIT | o_gl.DEPTH_BUFFER_BIT);
        o_gl.enable(o_gl.DEPTH_TEST);
        o_gl.useProgram(o_program);
        let a_n_eye = [
            o_state.a_n_target[0] + o_state.n_dist * Math.cos(o_state.n_pitch) * Math.cos(o_state.n_yaw),
            o_state.a_n_target[1] + o_state.n_dist * Math.cos(o_state.n_pitch) * Math.sin(o_state.n_yaw),
            o_state.a_n_target[2] + o_state.n_dist * Math.sin(o_state.n_pitch)
        ];
        o_gl.uniformMatrix4fv(o_loc.m_view, false, f_m_look(a_n_eye, o_state.a_n_target));
        o_gl.uniformMatrix4fv(o_loc.m_proj, false, f_m_perspective(0.6, n_w / Math.max(n_h, 1), o_state.n_dist / 100, o_state.n_dist * 10));
        for(let o_draw of [o_grid, ...a_o_draw].filter(Boolean)){
            o_gl.uniform3fv(o_loc.v_colour, o_draw.a_n_colour);
            o_gl.uniform1f(o_loc.n_line, o_draw.b_line ? 1 : 0);
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_draw.o_buffer);
            o_gl.enableVertexAttribArray(o_loc.v_pos);
            o_gl.vertexAttribPointer(o_loc.v_pos, 3, o_gl.FLOAT, false, 24, 0);
            o_gl.enableVertexAttribArray(o_loc.v_nor);
            o_gl.vertexAttribPointer(o_loc.v_nor, 3, o_gl.FLOAT, false, 24, 12);
            o_gl.drawArrays(o_draw.b_line ? o_gl.LINES : o_gl.TRIANGLES, 0, o_draw.n_cnt);
        }
    };

    // The grid under the meshes, 5 mm, a bit larger than what lies on it.
    let f_set_grid = function(n_x0, n_x1, n_y0, n_y1){
        let a_n = [];
        let n_step = 5;
        let n_xa = Math.floor(n_x0 / n_step - 1) * n_step, n_xb = Math.ceil(n_x1 / n_step + 1) * n_step;
        let n_ya = Math.floor(n_y0 / n_step - 1) * n_step, n_yb = Math.ceil(n_y1 / n_step + 1) * n_step;
        for(let n_x = n_xa; n_x <= n_xb; n_x += n_step){ a_n.push(n_x, n_ya, 0, 0, 0, 1, n_x, n_yb, 0, 0, 0, 1); }
        for(let n_y = n_ya; n_y <= n_yb; n_y += n_step){ a_n.push(n_xa, n_y, 0, 0, 0, 1, n_xb, n_y, 0, 0, 0, 1); }
        if(o_grid){ o_gl.deleteBuffer(o_grid.o_buffer); }
        o_grid = { o_buffer: f_o_buffer(new Float32Array(a_n)), n_cnt: a_n.length / 6, a_n_colour: [0.8, 0.8, 0.78], b_line: true };
    };

    // a_o_mesh: { a_n_pos, a_n_idx, a_n_colour (0 to 1), n_x, n_y }. b_frame: aim the camera at them.
    let f_set_mesh = function(a_o_mesh, b_frame){
        for(let o_draw of a_o_draw){ o_gl.deleteBuffer(o_draw.o_buffer); }
        a_o_draw = a_o_mesh.map(function(o_mesh){
            let a_n = f_a_n__flat(o_mesh.a_n_pos, o_mesh.a_n_idx, o_mesh.n_x, o_mesh.n_y);
            return { o_buffer: f_o_buffer(a_n), n_cnt: a_n.length / 6, a_n_colour: o_mesh.a_n_colour };
        });
        let a_n_lo = [Infinity, Infinity, Infinity], a_n_hi = [-Infinity, -Infinity, -Infinity];
        for(let o_mesh of a_o_mesh){
            for(let n_off = 0; n_off < o_mesh.a_n_pos.length; n_off += 3){
                let a_n = [o_mesh.a_n_pos[n_off] + o_mesh.n_x, o_mesh.a_n_pos[n_off + 1] + o_mesh.n_y, o_mesh.a_n_pos[n_off + 2]];
                for(let i = 0; i < 3; i++){ a_n_lo[i] = Math.min(a_n_lo[i], a_n[i]); a_n_hi[i] = Math.max(a_n_hi[i], a_n[i]); }
            }
        }
        if(a_o_mesh.length){
            f_set_grid(a_n_lo[0], a_n_hi[0], a_n_lo[1], a_n_hi[1]);
            if(b_frame){
                o_state.a_n_target = a_n_lo.map(function(v, i){ return (v + a_n_hi[i]) / 2; });
                o_state.n_size = Math.hypot(a_n_hi[0] - a_n_lo[0], a_n_hi[1] - a_n_lo[1], a_n_hi[2] - a_n_lo[2]);
            }
        }
        f_draw();
    };

    let o_drag = null;
    el_canvas.addEventListener('contextmenu', function(o_event){ o_event.preventDefault(); });
    el_canvas.addEventListener('pointerdown', function(o_event){
        o_drag = { n_x: o_event.clientX, n_y: o_event.clientY, b_pan: o_event.button === 2 || o_event.shiftKey };
        el_canvas.setPointerCapture(o_event.pointerId);
    });
    el_canvas.addEventListener('pointermove', function(o_event){
        if(!o_drag){ return; }
        let n_dx = o_event.clientX - o_drag.n_x, n_dy = o_event.clientY - o_drag.n_y;
        o_drag.n_x = o_event.clientX;
        o_drag.n_y = o_event.clientY;
        if(o_drag.b_pan){
            let n_scale = o_state.n_dist / el_canvas.clientHeight * 0.62;
            let n_s = Math.sin(o_state.n_yaw), n_c = Math.cos(o_state.n_yaw);
            o_state.a_n_target[0] += (n_dx * n_s + n_dy * n_c * Math.sin(o_state.n_pitch)) * n_scale;
            o_state.a_n_target[1] += (-n_dx * n_c + n_dy * n_s * Math.sin(o_state.n_pitch)) * n_scale;
            o_state.a_n_target[2] += n_dy * Math.cos(o_state.n_pitch) * n_scale;
        } else{
            o_state.n_yaw -= n_dx * 0.01;
            o_state.n_pitch = Math.max(-1.5, Math.min(1.5, o_state.n_pitch + n_dy * 0.01));
        }
        f_draw();
    });
    el_canvas.addEventListener('pointerup', function(){ o_drag = null; });
    el_canvas.addEventListener('wheel', function(o_event){
        o_event.preventDefault();
        o_state.n_dist *= Math.exp(o_event.deltaY * 0.001);
        f_draw();
    }, { passive: false });
    new ResizeObserver(f_draw).observe(el_canvas);

    return { f_set_mesh, f_draw };
};

export { f_o_viewer };
