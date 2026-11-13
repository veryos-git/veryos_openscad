// Shows the lamp with WebGL2. One shader does all the views. Left drag orbits, right
// drag pans, the wheel zooms and a double click goes back to the start.

let n_tau = Math.PI * 2;

let s_vertex = `#version 300 es
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_nor;
layout(location = 2) in float a_wall;
uniform mat4 o_view_projection;
uniform float n_z_model;
out vec3 o_pos;
out vec3 o_nor;
out float n_wall;
void main(){
    o_pos = a_pos + vec3(0.0, 0.0, n_z_model);
    o_nor = a_nor;
    n_wall = a_wall;
    gl_Position = o_view_projection * vec4(o_pos, 1.0);
}`;

// The glow is light passing through the wall: each colour fades exponentially with
// the wall's thickness, the way a filament this colour absorbs it. So the thin grooves
// between the scales shine pale and the thick scales glow deep rose.
let s_fragment = `#version 300 es
precision highp float;
in vec3 o_pos;
in vec3 o_nor;
in float n_wall;
uniform vec3 o_eye;
uniform vec3 o_light_pos;
uniform vec3 o_light_col;
uniform float n_light;
uniform float n_rad_limit;
uniform float n_z_model;
uniform int n_mode;
uniform bool b_part;
uniform bool b_cut;
out vec4 o_out;

const int n_mode_day = 0;
const int n_mode_lit = 1;
const int n_mode_overhang = 2;

float f_n_wrapped(vec3 o_n, vec3 o_l, float n_wrap){
    return max((dot(o_n, normalize(o_l)) + n_wrap) / (1.0 + n_wrap), 0.0);
}

vec3 f_o_shaded(vec3 o_albedo, vec3 o_n, vec3 o_v, float n_wrap, float n_shine){
    vec3 o_key = normalize(vec3(-0.55, -0.72, 0.62));
    vec3 o_diffuse = vec3(1.0, 0.97, 0.94) * 0.95 * f_n_wrapped(o_n, o_key, n_wrap);
    o_diffuse += vec3(0.82, 0.88, 1.0) * 0.32 * f_n_wrapped(o_n, vec3(0.85, -0.35, 0.15), n_wrap);
    o_diffuse += vec3(1.0, 0.92, 0.9) * 0.22 * f_n_wrapped(o_n, vec3(0.0, 0.9, 0.45), n_wrap);
    o_diffuse += vec3(0.30) * (0.55 + 0.45 * o_n.z);
    float n_specular = pow(max(dot(o_n, normalize(o_key + o_v)), 0.0), 42.0) * n_shine;
    float n_fresnel = pow(1.0 - max(dot(o_n, o_v), 0.0), 4.0) * 0.16 * n_shine / 0.3;
    return o_albedo * o_diffuse + vec3(n_specular + n_fresnel);
}

vec3 f_o_srgb(vec3 o_col){
    return pow(clamp(o_col, 0.0, 1.0), vec3(1.0 / 2.2));
}

void main(){
    if(b_cut && o_pos.y < 0.0){ discard; }
    vec3 o_v = normalize(o_eye - o_pos);
    // Looking into a closed solid through the cut, the first thing seen is a back face.
    if(b_cut && !gl_FrontFacing){
        o_out = vec4(b_part ? vec3(0.30, 0.27, 0.26) : (n_mode == n_mode_lit ? vec3(0.95, 0.42, 0.5) : vec3(0.62, 0.20, 0.30)), 1.0);
        return;
    }
    vec3 o_n = normalize(o_nor);
    if(dot(o_n, o_v) < 0.0 && !gl_FrontFacing){ o_n = -o_n; }
    vec3 o_col;
    if(b_part){
        vec3 o_shaded = f_o_shaded(vec3(0.085, 0.078, 0.078), o_n, o_v, 0.2, 0.22);
        o_col = n_mode == n_mode_lit ? o_shaded * 0.3 : o_shaded;
    } else if(n_mode == n_mode_lit){
        vec3 o_to_light = o_pos - o_light_pos;
        float n_distance = length(o_to_light);
        float n_falloff = 1.0 / (1.0 + n_distance * n_distance / (58.0 * 58.0));
        vec3 o_through = exp(-max(n_wall, 0.0) * vec3(0.10, 0.70, 0.46));
        vec3 o_glow = o_light_col * o_through * (0.20 + 2.9 * n_falloff) * n_light;
        vec3 o_room = f_o_shaded(vec3(0.42, 0.12, 0.18), o_n, o_v, 0.4, 0.05) * 0.10;
        o_col = 1.0 - exp(-(o_glow + o_room) * 1.25);
    } else {
        float n_thin = exp(-max(n_wall, 0.0) * 0.85);
        vec3 o_albedo = mix(vec3(0.79, 0.17, 0.27), vec3(0.97, 0.52, 0.60), n_thin);
        o_col = f_o_shaded(o_albedo, o_n, o_v, 0.35, 0.3);
        if(n_mode == n_mode_overhang){
            o_col = f_o_shaded(vec3(0.42), o_n, o_v, 0.25, 0.08);
            // The face's own normal, as a slicer sees it, not the smooth one.
            vec3 o_face = normalize(cross(dFdx(o_pos), dFdy(o_pos)));
            if(dot(o_face, o_v) < 0.0){ o_face = -o_face; }
            float n_rad = o_face.z < 0.0 ? asin(clamp(-o_face.z, 0.0, 1.0)) : 0.0;
            if(n_rad >= n_rad_limit + 0.009 && o_pos.z > n_z_model + 0.05){
                float n_past = clamp((n_rad - n_rad_limit) / (1.5708 - n_rad_limit), 0.0, 1.0);
                vec3 o_heat = mix(vec3(1.0, 0.62, 0.0), vec3(0.95, 0.05, 0.05), n_past);
                o_col = o_heat * (0.45 + 0.55 * f_n_wrapped(o_n, vec3(-0.5, -0.7, 0.5), 0.6));
            }
        }
    }
    o_out = vec4(f_o_srgb(o_col), 1.0);
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

let f_a_n_mat4__look_at = function(a_n_eye, a_n_target){
    let f_a_n__normalized = function(a_n){ let n = Math.hypot(...a_n); return a_n.map(n_v => n_v / n); };
    let a_n_z = f_a_n__normalized([a_n_eye[0] - a_n_target[0], a_n_eye[1] - a_n_target[1], a_n_eye[2] - a_n_target[2]]);
    let a_n_x = f_a_n__normalized([-a_n_z[1], a_n_z[0], 0]);
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

let f_o_shader = function(o_gl, n_type, s_source){
    let o_shader = o_gl.createShader(n_type);
    o_gl.shaderSource(o_shader, s_source);
    o_gl.compileShader(o_shader);
    if(!o_gl.getShaderParameter(o_shader, o_gl.COMPILE_STATUS)){ throw new Error(o_gl.getShaderInfoLog(o_shader)); }
    return o_shader;
};

// A binary STL as flat triangles for drawing, each with its own normal.
let f_o_arrays__from_stl = function(o_buffer){
    let o_view = new DataView(o_buffer);
    let n_cnt = o_view.getUint32(80, true);
    let a_n_pos = new Float32Array(n_cnt * 9);
    let a_n_nor = new Float32Array(n_cnt * 9);
    let n_off = 84;
    for(let n_it = 0; n_it < n_cnt; n_it++){
        n_off += 12;
        let n_idx = n_it * 9;
        for(let n_it_corner = 0; n_it_corner < 9; n_it_corner++){
            a_n_pos[n_idx + n_it_corner] = o_view.getFloat32(n_off, true);
            n_off += 4;
        }
        n_off += 2;
        let n_ux = a_n_pos[n_idx + 3] - a_n_pos[n_idx], n_uy = a_n_pos[n_idx + 4] - a_n_pos[n_idx + 1], n_uz = a_n_pos[n_idx + 5] - a_n_pos[n_idx + 2];
        let n_vx = a_n_pos[n_idx + 6] - a_n_pos[n_idx], n_vy = a_n_pos[n_idx + 7] - a_n_pos[n_idx + 1], n_vz = a_n_pos[n_idx + 8] - a_n_pos[n_idx + 2];
        let n_nx = n_uy * n_vz - n_uz * n_vy, n_ny = n_uz * n_vx - n_ux * n_vz, n_nz = n_ux * n_vy - n_uy * n_vx;
        let n_len = Math.hypot(n_nx, n_ny, n_nz) || 1;
        for(let n_it_corner = 0; n_it_corner < 3; n_it_corner++){
            a_n_nor[n_idx + n_it_corner * 3] = n_nx / n_len;
            a_n_nor[n_idx + n_it_corner * 3 + 1] = n_ny / n_len;
            a_n_nor[n_idx + n_it_corner * 3 + 2] = n_nz / n_len;
        }
    }
    return { a_n_pos, a_n_nor };
};

let f_o_viewer = function(el_canvas){
    let o_gl = el_canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    if(!o_gl){ throw new Error('this browser has no WebGL2'); }
    let o_program = o_gl.createProgram();
    o_gl.attachShader(o_program, f_o_shader(o_gl, o_gl.VERTEX_SHADER, s_vertex));
    o_gl.attachShader(o_program, f_o_shader(o_gl, o_gl.FRAGMENT_SHADER, s_fragment));
    o_gl.linkProgram(o_program);
    if(!o_gl.getProgramParameter(o_program, o_gl.LINK_STATUS)){ throw new Error(o_gl.getProgramInfoLog(o_program)); }
    o_gl.useProgram(o_program);
    let o_uniform = {};
    for(let s_name of ['o_view_projection', 'n_z_model', 'o_eye', 'o_light_pos', 'o_light_col', 'n_light', 'n_rad_limit', 'n_mode', 'b_part', 'b_cut']){
        o_uniform[s_name] = o_gl.getUniformLocation(o_program, s_name);
    }
    o_gl.enable(o_gl.DEPTH_TEST);
    o_gl.clearColor(0, 0, 0, 0);

    let o_egg = { o_vao: o_gl.createVertexArray(), o_buffer__pos: o_gl.createBuffer(), o_buffer__nor: o_gl.createBuffer(), o_buffer__wall: o_gl.createBuffer(), o_buffer__idx: o_gl.createBuffer(), n_cnt: 0, n_z: 0 };
    let a_o_part = [];
    let o_view = { n_mode: 0, b_cut: false, b_base: true, n_deg__limit: 45, n_light: 1, a_n_light__col: [1, 0.86, 0.72], a_n_light__pos: [0, 0, 40] };
    let o_camera = { n_rad__azimuth: 0, n_rad__polar: 0, n_distance: 1, a_n_target: [0, 0, 0] };
    let o_start = { n_rad__azimuth: -Math.PI / 2, n_rad__polar: 1.38, n_distance: 620, a_n_target: [0, 0, 85] };
    Object.assign(o_camera, o_start, { a_n_target: [...o_start.a_n_target] });
    let b_dirty = true;

    let f_set_dirty = function(){ b_dirty = true; };

    let f_draw = function(){
        let n_ratio = Math.min(window.devicePixelRatio || 1, 2);
        let n_scl_x = Math.max(1, Math.round(el_canvas.clientWidth * n_ratio));
        let n_scl_y = Math.max(1, Math.round(el_canvas.clientHeight * n_ratio));
        if(el_canvas.width !== n_scl_x || el_canvas.height !== n_scl_y){
            el_canvas.width = n_scl_x;
            el_canvas.height = n_scl_y;
        }
        o_gl.viewport(0, 0, n_scl_x, n_scl_y);
        o_gl.clear(o_gl.COLOR_BUFFER_BIT | o_gl.DEPTH_BUFFER_BIT);
        let n_sin = Math.sin(o_camera.n_rad__polar);
        let a_n_eye = [
            o_camera.a_n_target[0] + o_camera.n_distance * n_sin * Math.cos(o_camera.n_rad__azimuth),
            o_camera.a_n_target[1] + o_camera.n_distance * n_sin * Math.sin(o_camera.n_rad__azimuth),
            o_camera.a_n_target[2] + o_camera.n_distance * Math.cos(o_camera.n_rad__polar)
        ];
        let a_n_view_projection = f_a_n_mat4__multiplied(
            f_a_n_mat4__perspective(24 * Math.PI / 180, n_scl_x / n_scl_y, o_camera.n_distance * 0.1, o_camera.n_distance * 4),
            f_a_n_mat4__look_at(a_n_eye, o_camera.a_n_target)
        );
        o_gl.uniformMatrix4fv(o_uniform.o_view_projection, false, a_n_view_projection);
        o_gl.uniform3fv(o_uniform.o_eye, a_n_eye);
        o_gl.uniform3fv(o_uniform.o_light_pos, o_view.a_n_light__pos);
        o_gl.uniform3fv(o_uniform.o_light_col, o_view.a_n_light__col);
        o_gl.uniform1f(o_uniform.n_light, o_view.n_light);
        o_gl.uniform1f(o_uniform.n_rad_limit, o_view.n_deg__limit * Math.PI / 180);
        o_gl.uniform1i(o_uniform.n_mode, o_view.n_mode);
        o_gl.uniform1i(o_uniform.b_cut, o_view.b_cut ? 1 : 0);
        if(o_egg.n_cnt > 0){
            o_gl.uniform1i(o_uniform.b_part, 0);
            o_gl.uniform1f(o_uniform.n_z_model, o_egg.n_z);
            o_gl.bindVertexArray(o_egg.o_vao);
            o_gl.drawElements(o_gl.TRIANGLES, o_egg.n_cnt, o_gl.UNSIGNED_INT, 0);
        }
        if(o_view.b_base){
            o_gl.uniform1i(o_uniform.b_part, 1);
            for(let o_part of a_o_part){
                o_gl.uniform1f(o_uniform.n_z_model, o_part.n_z);
                o_gl.bindVertexArray(o_part.o_vao);
                o_gl.vertexAttrib1f(2, 1);
                o_gl.drawArrays(o_gl.TRIANGLES, 0, o_part.n_cnt);
            }
        }
        o_gl.bindVertexArray(null);
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
    el_canvas.addEventListener('pointerdown', function(o_evt){
        el_canvas.setPointerCapture(o_evt.pointerId);
        o_pointer__by_id.set(o_evt.pointerId, { n_x: o_evt.clientX, n_y: o_evt.clientY, n_button: o_evt.button });
        if(o_pointer__by_id.size === 2){
            let [o_a, o_b] = [...o_pointer__by_id.values()];
            n_distance__pinch = Math.hypot(o_a.n_x - o_b.n_x, o_a.n_y - o_b.n_y);
        }
    });
    el_canvas.addEventListener('pointermove', function(o_evt){
        let o_pointer = o_pointer__by_id.get(o_evt.pointerId);
        if(!o_pointer){ return; }
        let n_dx = o_evt.clientX - o_pointer.n_x, n_dy = o_evt.clientY - o_pointer.n_y;
        o_pointer.n_x = o_evt.clientX;
        o_pointer.n_y = o_evt.clientY;
        if(o_pointer__by_id.size === 2){
            let [o_a, o_b] = [...o_pointer__by_id.values()];
            let n_distance = Math.hypot(o_a.n_x - o_b.n_x, o_a.n_y - o_b.n_y);
            o_camera.n_distance = Math.max(80, Math.min(2500, o_camera.n_distance * n_distance__pinch / Math.max(n_distance, 1)));
            n_distance__pinch = n_distance;
        } else if(o_pointer.n_button === 0 && !o_evt.shiftKey){
            o_camera.n_rad__azimuth -= n_dx * 0.0075;
            o_camera.n_rad__polar = Math.max(0.05, Math.min(Math.PI - 0.05, o_camera.n_rad__polar - n_dy * 0.0075));
        } else {
            let n_mm_per_px = 2 * o_camera.n_distance * Math.tan(12 * Math.PI / 180) / Math.max(el_canvas.clientHeight, 1);
            let n_cos = Math.cos(o_camera.n_rad__azimuth), n_sin = Math.sin(o_camera.n_rad__azimuth);
            o_camera.a_n_target[0] += n_sin * n_dx * n_mm_per_px;
            o_camera.a_n_target[1] -= n_cos * n_dx * n_mm_per_px;
            o_camera.a_n_target[2] += n_dy * n_mm_per_px;
        }
        f_set_dirty();
    });
    let f_end_pointer = function(o_evt){ o_pointer__by_id.delete(o_evt.pointerId); };
    el_canvas.addEventListener('pointerup', f_end_pointer);
    el_canvas.addEventListener('pointercancel', f_end_pointer);
    el_canvas.addEventListener('wheel', function(o_evt){
        o_evt.preventDefault();
        o_camera.n_distance = Math.max(80, Math.min(2500, o_camera.n_distance * Math.exp(o_evt.deltaY * 0.001)));
        f_set_dirty();
    }, { passive: false });
    el_canvas.addEventListener('dblclick', function(){
        Object.assign(o_camera, o_start, { a_n_target: [...o_start.a_n_target] });
        f_set_dirty();
    });

    return {
        f_set_egg: function(a_n_pos, a_n_nor, a_n_wall, a_n_idx){
            o_gl.bindVertexArray(o_egg.o_vao);
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_egg.o_buffer__pos);
            o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n_pos, o_gl.DYNAMIC_DRAW);
            o_gl.enableVertexAttribArray(0);
            o_gl.vertexAttribPointer(0, 3, o_gl.FLOAT, false, 0, 0);
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_egg.o_buffer__nor);
            o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n_nor, o_gl.DYNAMIC_DRAW);
            o_gl.enableVertexAttribArray(1);
            o_gl.vertexAttribPointer(1, 3, o_gl.FLOAT, false, 0, 0);
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_egg.o_buffer__wall);
            o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n_wall, o_gl.DYNAMIC_DRAW);
            o_gl.enableVertexAttribArray(2);
            o_gl.vertexAttribPointer(2, 1, o_gl.FLOAT, false, 0, 0);
            o_gl.bindBuffer(o_gl.ELEMENT_ARRAY_BUFFER, o_egg.o_buffer__idx);
            o_gl.bufferData(o_gl.ELEMENT_ARRAY_BUFFER, a_n_idx, o_gl.DYNAMIC_DRAW);
            o_gl.bindVertexArray(null);
            o_egg.n_cnt = a_n_idx.length;
            f_set_dirty();
        },
        f_set_egg_z: function(n_z){
            o_egg.n_z = n_z;
            f_set_dirty();
        },
        f_add_part: function(o_buffer, n_z){
            let { a_n_pos, a_n_nor } = f_o_arrays__from_stl(o_buffer);
            let o_vao = o_gl.createVertexArray();
            o_gl.bindVertexArray(o_vao);
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_gl.createBuffer());
            o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n_pos, o_gl.STATIC_DRAW);
            o_gl.enableVertexAttribArray(0);
            o_gl.vertexAttribPointer(0, 3, o_gl.FLOAT, false, 0, 0);
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_gl.createBuffer());
            o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n_nor, o_gl.STATIC_DRAW);
            o_gl.enableVertexAttribArray(1);
            o_gl.vertexAttribPointer(1, 3, o_gl.FLOAT, false, 0, 0);
            o_gl.bindVertexArray(null);
            a_o_part.push({ o_vao, n_cnt: a_n_pos.length / 3, n_z });
            f_set_dirty();
        },
        f_set_view: function(o_change){
            Object.assign(o_view, o_change);
            f_set_dirty();
        },
        // Fits the camera to the lamp's height, once it is known.
        f_frame: function(n_mm__top, n_mm__bottom){
            o_start.a_n_target = [0, 0, 0.5 * (n_mm__top + n_mm__bottom)];
            o_start.n_distance = 1.25 * (n_mm__top - n_mm__bottom) / (2 * Math.tan(12 * Math.PI / 180));
            Object.assign(o_camera, o_start, { a_n_target: [...o_start.a_n_target] });
            f_set_dirty();
        }
    };
};

// Stands in when WebGL2 is missing: sliders, numbers and print files still work.
let f_o_viewer__without_3d = function(){
    let f_nothing = function(){};
    return { f_set_egg: f_nothing, f_set_egg_z: f_nothing, f_add_part: f_nothing, f_set_view: f_nothing, f_frame: f_nothing };
};

export { f_o_viewer, f_o_viewer__without_3d, s_vertex, s_fragment };
