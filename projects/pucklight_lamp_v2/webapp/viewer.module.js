// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Shows the lamp with WebGL2: the lampshade, and the base parts under it. One shader
// does all the looks. Left drag orbits, right drag pans, the wheel zooms and a double
// click goes back to the start.

let n_deg = Math.PI / 180;
// Half the view's angle.
let n_rad__half_view = 12 * n_deg;

// What a look's faces are drawn as, and what is drawn on them.
let o_look__by_name = {
    day: { n_face: 0 },
    lit: { n_face: 1 },
    overhang: { n_face: 2 },
    edges: { n_face: 0, b_edge: true },
    vertices: { n_face: 0, b_vertex: true },
    xray: { n_face: 3 }
};

let s_vertex = `#version 300 es
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_nor;
layout(location = 2) in float a_wall;
layout(location = 3) in vec3 a_col;
uniform mat4 o_view_projection;
uniform float n_z_model;
uniform int n_cnt_fixed;
uniform float n_lift;
uniform float n_point;
out vec3 o_pos;
out vec3 o_nor;
out float n_wall;
out vec3 o_col;
flat out float n_fixed;
void main(){
    o_pos = a_pos + vec3(0.0, 0.0, n_z_model);
    o_nor = a_nor;
    n_wall = a_wall;
    o_col = a_col;
    n_fixed = gl_VertexID < n_cnt_fixed ? 1.0 : 0.0;
    gl_Position = o_view_projection * vec4(o_pos, 1.0);
    // Edges and vertices come a little towards the eye, so they show on their faces.
    gl_Position.z -= n_lift * gl_Position.w;
    gl_PointSize = n_point;
}`;

// The glow is light passing through the wall: each colour fades exponentially with
// the wall's thickness, the way the filament absorbs it. So thin parts shine pale and
// thick ones glow in the filament's colour, or stay dark.
let s_fragment = `#version 300 es
precision highp float;
in vec3 o_pos;
in vec3 o_nor;
in float n_wall;
in vec3 o_col;
flat in float n_fixed;
uniform vec3 o_eye;
uniform vec3 o_eye_dir;
uniform bool b_ortho;
uniform vec3 o_light_pos;
uniform vec3 o_light_col;
uniform vec3 o_absorb;
uniform float n_light;
uniform float n_rad_limit;
uniform float n_z_model;
uniform float n_z_section;
uniform int n_look;
uniform bool b_part;
uniform bool b_cut;
uniform bool b_flat;
uniform bool b_single_wall;
out vec4 o_out;

const int n_look_day = 0;
const int n_look_lit = 1;
const int n_look_overhang = 2;
const int n_look_xray = 3;
const int n_look_mark = 4;

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

vec3 f_o_srgb(vec3 o_linear){
    return pow(clamp(o_linear, 0.0, 1.0), vec3(1.0 / 2.2));
}

void main(){
    // Cut open, and the section: nothing above its height.
    if(b_cut && o_pos.y < 0.0){ discard; }
    if(o_pos.z > n_z_section){ discard; }
    // An edge or a vertex.
    if(n_look == n_look_mark){
        o_out = vec4(0.06, 0.08, 0.09, 1.0);
        return;
    }
    vec3 o_v = b_ortho ? o_eye_dir : normalize(o_eye - o_pos);
    // The face's own normal, as a slicer sees it and as it is exported, towards the eye.
    vec3 o_face = normalize(cross(dFdx(o_pos), dFdy(o_pos)));
    if(dot(o_face, o_v) < 0.0){ o_face = -o_face; }
    if(n_look == n_look_xray){
        // Seen through: a face shows the more, the more it is seen from its side.
        float n_side = 1.0 - abs(dot(o_face, o_v));
        o_out = vec4(b_part ? vec3(0.35) : o_col, 0.05 + 0.5 * n_side * n_side);
        return;
    }
    // A single wall's inside is its back. In a closed shell a back face shows only
    // through a cut, where it stands for the cut wall.
    if(!gl_FrontFacing && (b_part || !b_single_wall)){
        o_out = vec4(b_part ? vec3(0.30, 0.27, 0.26) : (n_look == n_look_lit ? mix(o_col, vec3(1.0), 0.3) : o_col * 0.72), 1.0);
        return;
    }
    vec3 o_n = b_flat ? o_face : normalize(o_nor) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 o_albedo = pow(o_col, vec3(2.2));
    vec3 o_linear;
    if(b_part){
        vec3 o_shaded = f_o_shaded(vec3(0.085, 0.078, 0.078), o_n, o_v, 0.2, 0.22);
        o_linear = n_look == n_look_lit ? o_shaded * 0.3 : o_shaded;
    } else if(n_look == n_look_lit){
        float n_distance = length(o_pos - o_light_pos);
        float n_falloff = 1.0 / (1.0 + n_distance * n_distance / (58.0 * 58.0));
        vec3 o_through = exp(-max(n_wall, 0.0) * o_absorb);
        vec3 o_glow = o_light_col * o_through * (0.20 + 2.9 * n_falloff) * n_light;
        vec3 o_room = f_o_shaded(o_albedo * 0.55, o_n, o_v, 0.4, 0.05) * 0.10;
        o_linear = 1.0 - exp(-(o_glow + o_room) * 1.25);
    } else if(n_look == n_look_overhang){
        o_linear = f_o_shaded(vec3(n_fixed > 0.5 ? 0.16 : 0.42), o_n, o_v, 0.25, 0.08);
        // How far the wall leans from vertical, and which way: out, so that it faces
        // down, is an overhang. A single wall has as little under it leaning in.
        vec3 o_outward = gl_FrontFacing ? o_face : -o_face;
        float n_rad = asin(clamp(abs(o_outward.z), 0.0, 1.0));
        bool b_down = o_outward.z < 0.0;
        // Half a degree to spare for a wall made to lean just as far as the limit. Not
        // the thread, and not the face on the bed.
        if(n_fixed < 0.5 && n_rad >= n_rad_limit + 0.009 && (b_down || b_single_wall) && o_pos.z > n_z_model + 0.05){
            float n_past = clamp((n_rad - n_rad_limit) / (1.5708 - n_rad_limit), 0.0, 1.0);
            vec3 o_heat = b_down ? mix(vec3(1.0, 0.62, 0.0), vec3(0.95, 0.05, 0.05), n_past)
                : mix(vec3(0.32, 0.62, 0.95), vec3(0.05, 0.12, 0.8), n_past);
            o_linear = o_heat * (0.45 + 0.55 * f_n_wrapped(o_n, vec3(-0.5, -0.7, 0.5), 0.6));
        }
    } else {
        o_linear = f_o_shaded(o_albedo, o_n, o_v, 0.35, b_flat ? 0.12 : 0.3);
    }
    // The inside of a single wall, which a cut shows, is darker.
    if(!gl_FrontFacing){ o_linear *= 0.6; }
    o_out = vec4(f_o_srgb(o_linear), 1.0);
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

// Without perspective: n_half is half the height shown, in mm.
let f_a_n_mat4__ortho = function(n_half, n_aspect, n_near, n_far){
    return new Float32Array([
        1 / (n_half * n_aspect), 0, 0, 0,
        0, 1 / n_half, 0, 0,
        0, 0, 2 / (n_near - n_far), 0,
        0, 0, (n_far + n_near) / (n_near - n_far), 1
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

// A binary STL as flat triangles for drawing.
let f_a_n_pos__from_stl = function(o_buffer){
    let o_view = new DataView(o_buffer);
    let n_cnt = o_view.getUint32(80, true);
    let a_n_pos = new Float32Array(n_cnt * 9);
    let n_off = 84;
    for(let n_it = 0; n_it < n_cnt; n_it++){
        n_off += 12;
        for(let n_it_corner = 0; n_it_corner < 9; n_it_corner++){
            a_n_pos[n_it * 9 + n_it_corner] = o_view.getFloat32(n_off, true);
            n_off += 4;
        }
        n_off += 2;
    }
    return a_n_pos;
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
    for(let s_name of ['o_view_projection', 'n_z_model', 'n_cnt_fixed', 'n_lift', 'n_point', 'o_eye', 'o_eye_dir', 'b_ortho', 'o_light_pos', 'o_light_col',
        'o_absorb', 'n_light', 'n_rad_limit', 'n_z_section', 'n_look', 'b_part', 'b_cut', 'b_flat', 'b_single_wall']){
        o_uniform[s_name] = o_gl.getUniformLocation(o_program, s_name);
    }
    o_gl.clearColor(0, 0, 0, 0);

    // The lampshade. Its faces and its edges share the points.
    let o_shade = {
        o_vao: o_gl.createVertexArray(), o_vao__edge: o_gl.createVertexArray(),
        o_buffer__pos: o_gl.createBuffer(), o_buffer__nor: o_gl.createBuffer(), o_buffer__wall: o_gl.createBuffer(),
        o_buffer__col: o_gl.createBuffer(), o_buffer__idx: o_gl.createBuffer(), o_buffer__edge: o_gl.createBuffer(),
        a_n_idx: null, n_cnt: 0, n_cnt__vertex: 0, n_cnt__edge: -1, n_cnt__fixed: 0, b_flat: true,
        n_z: 0, n_mm__scl_z: 1, n_mm__radius: 1
    };
    let a_o_part = [];
    let a_o_mini = [];
    let f_on_camera = function(){};
    let o_view = {
        s_look: 'day', b_cut: false, b_base: true, n_nor__section: 1, n_deg__limit: 45, n_light: 1,
        a_n_light__col: [1, 0.86, 0.72], a_n_light__pos: [0, 0, 40], a_n_absorb: [0.4, 0.4, 0.4], b_single_wall: false
    };
    let o_camera = { n_rad__azimuth: 0, n_rad__polar: 0, n_distance: 1, a_n_target: [0, 0, 0] };
    let o_start = { n_rad__azimuth: -Math.PI / 2, n_rad__polar: 1.38, n_distance: 620, a_n_target: [0, 0, 85] };
    Object.assign(o_camera, o_start, { a_n_target: [...o_start.a_n_target] });
    let b_dirty = true;

    let f_set_dirty = function(){ b_dirty = true; };

    // The mesh's edges, each once: made when a look first shows them.
    let f_make_edge = function(){
        let a_n_idx = o_shade.a_n_idx;
        // A closed mesh has three edges for every two triangles.
        let a_n_edge = new Uint32Array(a_n_idx.length);
        let n_cnt = 0;
        for(let n_off = 0; n_off < a_n_idx.length; n_off += 3){
            for(let n_k = 0; n_k < 3; n_k++){
                let n_a = a_n_idx[n_off + n_k], n_b = a_n_idx[n_off + (n_k + 1) % 3];
                // The triangle on the edge's other side has it the other way round.
                if(n_a < n_b){
                    a_n_edge[n_cnt++] = n_a;
                    a_n_edge[n_cnt++] = n_b;
                }
            }
        }
        o_gl.bindVertexArray(o_shade.o_vao__edge);
        o_gl.bufferData(o_gl.ELEMENT_ARRAY_BUFFER, a_n_edge.subarray(0, n_cnt), o_gl.STATIC_DRAW);
        o_gl.bindVertexArray(null);
        o_shade.n_cnt__edge = n_cnt;
    };

    // Everything, as one eye sees it.
    let f_draw_scene = function(a_n_view_projection, a_n_eye, a_n_eye_dir, b_ortho){
        let o_look = o_look__by_name[o_view.s_look];
        let b_xray = o_look.n_face === 3;
        o_gl.uniformMatrix4fv(o_uniform.o_view_projection, false, a_n_view_projection);
        o_gl.uniform3fv(o_uniform.o_eye, a_n_eye);
        o_gl.uniform3fv(o_uniform.o_eye_dir, a_n_eye_dir);
        o_gl.uniform1i(o_uniform.b_ortho, b_ortho ? 1 : 0);
        o_gl.uniform3fv(o_uniform.o_light_pos, o_view.a_n_light__pos);
        o_gl.uniform3fv(o_uniform.o_light_col, o_view.a_n_light__col);
        o_gl.uniform3fv(o_uniform.o_absorb, o_view.a_n_absorb);
        o_gl.uniform1f(o_uniform.n_light, o_view.n_light);
        o_gl.uniform1f(o_uniform.n_rad_limit, o_view.n_deg__limit * n_deg);
        o_gl.uniform1i(o_uniform.b_cut, o_view.b_cut ? 1 : 0);
        o_gl.uniform1i(o_uniform.b_single_wall, o_view.b_single_wall ? 1 : 0);
        // At 1 the section leaves everything, also the top itself.
        o_gl.uniform1f(o_uniform.n_z_section, o_view.n_nor__section < 1 ? o_shade.n_z + o_view.n_nor__section * o_shade.n_mm__scl_z : 1e9);
        o_gl.uniform1f(o_uniform.n_lift, 0);
        o_gl.uniform1f(o_uniform.n_point, 1);
        // Seen through, the faces add up, whatever lies in front.
        if(b_xray){
            o_gl.disable(o_gl.DEPTH_TEST);
            o_gl.enable(o_gl.BLEND);
            o_gl.blendFuncSeparate(o_gl.SRC_ALPHA, o_gl.ONE, o_gl.ONE, o_gl.ONE);
        } else {
            o_gl.enable(o_gl.DEPTH_TEST);
            o_gl.disable(o_gl.BLEND);
        }
        o_gl.uniform1i(o_uniform.n_look, o_look.n_face);
        if(o_shade.n_cnt > 0){
            o_gl.uniform1i(o_uniform.b_part, 0);
            o_gl.uniform1i(o_uniform.b_flat, o_shade.b_flat ? 1 : 0);
            o_gl.uniform1i(o_uniform.n_cnt_fixed, o_shade.n_cnt__fixed);
            o_gl.uniform1f(o_uniform.n_z_model, o_shade.n_z);
            o_gl.bindVertexArray(o_shade.o_vao);
            o_gl.drawElements(o_gl.TRIANGLES, o_shade.n_cnt, o_gl.UNSIGNED_INT, 0);
            if(o_look.b_edge || o_look.b_vertex){
                o_gl.uniform1i(o_uniform.n_look, 4);
                o_gl.uniform1f(o_uniform.n_lift, 0.0006);
                o_gl.uniform1f(o_uniform.n_point, 3 * Math.min(window.devicePixelRatio || 1, 2));
                if(o_look.b_edge){
                    if(o_shade.n_cnt__edge < 0){ f_make_edge(); }
                    o_gl.bindVertexArray(o_shade.o_vao__edge);
                    o_gl.drawElements(o_gl.LINES, o_shade.n_cnt__edge, o_gl.UNSIGNED_INT, 0);
                } else {
                    o_gl.drawArrays(o_gl.POINTS, 0, o_shade.n_cnt__vertex);
                }
                o_gl.uniform1i(o_uniform.n_look, o_look.n_face);
                o_gl.uniform1f(o_uniform.n_lift, 0);
            }
        }
        if(o_view.b_base){
            o_gl.uniform1i(o_uniform.b_part, 1);
            o_gl.uniform1i(o_uniform.b_flat, 1);
            o_gl.uniform1i(o_uniform.n_cnt_fixed, 0);
            for(let o_part of a_o_part){
                o_gl.uniform1f(o_uniform.n_z_model, o_part.n_z);
                o_gl.bindVertexArray(o_part.o_vao);
                o_gl.drawArrays(o_gl.TRIANGLES, 0, o_part.n_cnt);
            }
        }
        o_gl.bindVertexArray(null);
    };

    let f_draw = function(){
        let n_ratio = Math.min(window.devicePixelRatio || 1, 2);
        let n_scl_x = Math.max(1, Math.round(el_canvas.clientWidth * n_ratio));
        let n_scl_y = Math.max(1, Math.round(el_canvas.clientHeight * n_ratio));
        if(el_canvas.width !== n_scl_x || el_canvas.height !== n_scl_y){
            el_canvas.width = n_scl_x;
            el_canvas.height = n_scl_y;
        }
        o_gl.disable(o_gl.SCISSOR_TEST);
        o_gl.viewport(0, 0, n_scl_x, n_scl_y);
        o_gl.clearColor(0, 0, 0, 0);
        o_gl.clear(o_gl.COLOR_BUFFER_BIT | o_gl.DEPTH_BUFFER_BIT);
        let { a_n_eye, a_n_right } = f_o_eye(o_camera.a_n_target, o_camera.n_rad__azimuth, o_camera.n_rad__polar, o_camera.n_distance);
        f_draw_scene(f_a_n_mat4__multiplied(
            f_a_n_mat4__perspective(2 * n_rad__half_view, n_scl_x / n_scl_y, o_camera.n_distance * 0.1, o_camera.n_distance * 4),
            f_a_n_mat4__look_at(a_n_eye, o_camera.a_n_target, a_n_right)
        ), a_n_eye, [0, 0, 1], false);

        // The small views: the lampshade from three sides, without perspective.
        let o_rect = el_canvas.getBoundingClientRect();
        let a_n_target = [0, 0, o_shade.n_z + 0.5 * o_shade.n_mm__scl_z];
        let n_half = 0.56 * Math.max(o_shade.n_mm__scl_z, 2 * o_shade.n_mm__radius);
        o_gl.enable(o_gl.SCISSOR_TEST);
        for(let o_mini of a_o_mini){
            let o_cell = o_mini.el.getBoundingClientRect();
            if(o_cell.width === 0){ continue; }
            let n_x = Math.round((o_cell.left - o_rect.left) * n_ratio), n_y = Math.round((o_rect.bottom - o_cell.bottom) * n_ratio);
            let n_w = Math.round(o_cell.width * n_ratio), n_h = Math.round(o_cell.height * n_ratio);
            o_gl.viewport(n_x, n_y, n_w, n_h);
            o_gl.scissor(n_x, n_y, n_w, n_h);
            o_gl.clearColor(0.098, 0.133, 0.133, 1);
            o_gl.clear(o_gl.COLOR_BUFFER_BIT | o_gl.DEPTH_BUFFER_BIT);
            let o_eye = f_o_eye(a_n_target, o_mini.n_rad__azimuth, o_mini.n_rad__polar, 1000);
            let a_n_eye_dir = o_eye.a_n_eye.map(function(n_val, n_k){ return (n_val - a_n_target[n_k]) / 1000; });
            f_draw_scene(f_a_n_mat4__multiplied(
                f_a_n_mat4__ortho(n_half, n_w / n_h, 100, 1900),
                f_a_n_mat4__look_at(o_eye.a_n_eye, a_n_target, o_eye.a_n_right)
            ), o_eye.a_n_eye, a_n_eye_dir, true);
        }
        o_gl.disable(o_gl.SCISSOR_TEST);
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

    let f_moved_camera = function(){
        f_on_camera(o_camera.n_rad__azimuth, o_camera.n_rad__polar);
        f_set_dirty();
    };

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
            o_camera.n_rad__polar = Math.max(0, Math.min(Math.PI, o_camera.n_rad__polar - n_dy * 0.0075));
        } else {
            let n_mm_per_px = 2 * o_camera.n_distance * Math.tan(n_rad__half_view) / Math.max(el_canvas.clientHeight, 1);
            let n_cos = Math.cos(o_camera.n_rad__azimuth), n_sin = Math.sin(o_camera.n_rad__azimuth);
            o_camera.a_n_target[0] += n_sin * n_dx * n_mm_per_px;
            o_camera.a_n_target[1] -= n_cos * n_dx * n_mm_per_px;
            o_camera.a_n_target[2] += n_dy * n_mm_per_px;
        }
        f_moved_camera();
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
        f_moved_camera();
    });

    return {
        // A lampshade as worker.module.js builds it. Without a_n_nor each triangle is
        // shaded by its own normal, as it will be exported.
        f_set_mesh: function({ a_n_pos, a_n_idx, a_n_nor, a_n_wall, a_n_col, n_cnt__fixed }){
            // [location, buffer, data, numbers per point, their type, normalized]
            let a_a_v_attribute = [
                [0, o_shade.o_buffer__pos, a_n_pos, 3, o_gl.FLOAT, false],
                [1, o_shade.o_buffer__nor, a_n_nor, 3, o_gl.FLOAT, false],
                [2, o_shade.o_buffer__wall, a_n_wall, 1, o_gl.FLOAT, false],
                [3, o_shade.o_buffer__col, a_n_col, 3, o_gl.UNSIGNED_BYTE, true]
            ];
            for(let [, o_buffer, v_data] of a_a_v_attribute){
                if(!v_data){ continue; }
                o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_buffer);
                o_gl.bufferData(o_gl.ARRAY_BUFFER, v_data, o_gl.DYNAMIC_DRAW);
            }
            for(let o_vao of [o_shade.o_vao, o_shade.o_vao__edge]){
                o_gl.bindVertexArray(o_vao);
                for(let [n_location, o_buffer, v_data, n_cnt__per_vertex, n_type, b_normalized] of a_a_v_attribute){
                    if(!v_data){
                        o_gl.disableVertexAttribArray(n_location);
                        continue;
                    }
                    o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_buffer);
                    o_gl.enableVertexAttribArray(n_location);
                    o_gl.vertexAttribPointer(n_location, n_cnt__per_vertex, n_type, b_normalized, 0, 0);
                }
            }
            o_gl.bindVertexArray(o_shade.o_vao);
            o_gl.bindBuffer(o_gl.ELEMENT_ARRAY_BUFFER, o_shade.o_buffer__idx);
            o_gl.bufferData(o_gl.ELEMENT_ARRAY_BUFFER, a_n_idx, o_gl.DYNAMIC_DRAW);
            o_gl.bindVertexArray(o_shade.o_vao__edge);
            o_gl.bindBuffer(o_gl.ELEMENT_ARRAY_BUFFER, o_shade.o_buffer__edge);
            o_gl.bindVertexArray(null);
            let n_r2 = 0, n_z = 0;
            for(let n_off = 0; n_off < a_n_pos.length; n_off += 3){
                n_r2 = Math.max(n_r2, a_n_pos[n_off] * a_n_pos[n_off] + a_n_pos[n_off + 1] * a_n_pos[n_off + 1]);
                n_z = Math.max(n_z, a_n_pos[n_off + 2]);
            }
            Object.assign(o_shade, {
                a_n_idx, n_cnt: a_n_idx.length, n_cnt__vertex: a_n_pos.length / 3, n_cnt__edge: -1, n_cnt__fixed,
                b_flat: !a_n_nor, n_mm__scl_z: n_z, n_mm__radius: Math.sqrt(n_r2)
            });
            f_set_dirty();
        },
        // Other colours for the same points.
        f_set_color: function(a_n_col){
            o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_shade.o_buffer__col);
            o_gl.bufferSubData(o_gl.ARRAY_BUFFER, 0, a_n_col);
            f_set_dirty();
        },
        // Where the lampshade's bed is: the floor of the lamp's cup.
        f_set_shade_z: function(n_z){
            o_shade.n_z = n_z;
            f_set_dirty();
        },
        // The base parts, each a binary STL at its height: they replace those before.
        f_set_part: function(a_o_stl){
            for(let o_part of a_o_part){
                o_gl.deleteBuffer(o_part.o_buffer);
                o_gl.deleteVertexArray(o_part.o_vao);
            }
            a_o_part = a_o_stl.map(function({ o_buffer: o_buffer__stl, n_z }){
                let a_n_pos = f_a_n_pos__from_stl(o_buffer__stl);
                let o_vao = o_gl.createVertexArray();
                let o_buffer = o_gl.createBuffer();
                o_gl.bindVertexArray(o_vao);
                o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_buffer);
                o_gl.bufferData(o_gl.ARRAY_BUFFER, a_n_pos, o_gl.STATIC_DRAW);
                o_gl.enableVertexAttribArray(0);
                o_gl.vertexAttribPointer(0, 3, o_gl.FLOAT, false, 0, 0);
                o_gl.bindVertexArray(null);
                return { o_vao, o_buffer, n_cnt: a_n_pos.length / 3, n_z };
            });
            f_set_dirty();
        },
        f_set_view: function(o_change){
            Object.assign(o_view, o_change);
            f_set_dirty();
        },
        // Fits the camera to the lamp's height, once it is known.
        f_frame: function(n_mm__top, n_mm__bottom){
            o_start.a_n_target = [0, 0, 0.5 * (n_mm__top + n_mm__bottom)];
            o_start.n_distance = 1.25 * (n_mm__top - n_mm__bottom) / (2 * Math.tan(n_rad__half_view));
            Object.assign(o_camera, o_start, { a_n_target: [...o_start.a_n_target] });
            f_moved_camera();
        },
        // Looks from a side: azimuth -90 degrees is the front, polar 0 the top.
        f_look_from: function(n_rad__azimuth, n_rad__polar){
            Object.assign(o_camera, { n_rad__azimuth, n_rad__polar });
            f_moved_camera();
        },
        // The small views: { el, n_rad__azimuth, n_rad__polar } each, drawn where el is.
        f_set_mini: function(a_o){
            a_o_mini = a_o;
            f_set_dirty();
        },
        // Tells f(n_rad__azimuth, n_rad__polar) whenever the eye has turned.
        f_set_on_camera: function(f){
            f_on_camera = f;
            f_moved_camera();
        },
        f_set_dirty
    };
};

// Stands in when WebGL2 is missing: the settings, numbers and print files still work.
let f_o_viewer__without_3d = function(){
    let f_nothing = function(){};
    return {
        f_set_mesh: f_nothing, f_set_color: f_nothing, f_set_shade_z: f_nothing, f_set_part: f_nothing, f_set_view: f_nothing,
        f_frame: f_nothing, f_look_from: f_nothing, f_set_mini: f_nothing, f_set_on_camera: f_nothing, f_set_dirty: f_nothing
    };
};

export { f_o_viewer, f_o_viewer__without_3d, s_vertex, s_fragment, o_look__by_name };
