// WebGL2's calls on real GLES through Mesa's software renderer, without a window, so
// viewer.module.js runs unchanged here and its shaders meet a real GLSL compiler.
let f_cstr = s => new TextEncoder().encode(s + '\0');
let f_ptr = o => o === null ? null : Deno.UnsafePointer.of(o);

export let f_o_gl = function(n_scl_x, n_scl_y){
    let s_path__vendor = '/usr/share/glvnd/egl_vendor.d/50_mesa.json';
    try{
        Deno.statSync(s_path__vendor);
        Deno.env.set('__EGL_VENDOR_LIBRARY_FILENAMES', s_path__vendor);
    } catch(o_error){ /* Another layout: let the system choose. */ }
    Deno.env.set('LIBGL_ALWAYS_SOFTWARE', '1');
    Deno.env.set('GALLIUM_DRIVER', 'llvmpipe');
    let o_egl = Deno.dlopen('libEGL.so.1', {
        eglGetPlatformDisplay: { parameters: ['u32', 'pointer', 'pointer'], result: 'pointer' },
        eglInitialize: { parameters: ['pointer', 'buffer', 'buffer'], result: 'u32' },
        eglBindAPI: { parameters: ['u32'], result: 'u32' },
        eglChooseConfig: { parameters: ['pointer', 'buffer', 'buffer', 'i32', 'buffer'], result: 'u32' },
        eglCreatePbufferSurface: { parameters: ['pointer', 'pointer', 'buffer'], result: 'pointer' },
        eglCreateContext: { parameters: ['pointer', 'pointer', 'pointer', 'buffer'], result: 'pointer' },
        eglMakeCurrent: { parameters: ['pointer', 'pointer', 'pointer', 'pointer'], result: 'u32' },
        eglGetError: { parameters: [], result: 'i32' }
    }).symbols;
    let o_display = o_egl.eglGetPlatformDisplay(0x31DD, null, null); // EGL_PLATFORM_SURFACELESS_MESA
    if(!o_display){ throw new Error('no display ' + o_egl.eglGetError()); }
    let a_n_major = new Int32Array(1), a_n_minor = new Int32Array(1);
    if(!o_egl.eglInitialize(o_display, a_n_major, a_n_minor)){ throw new Error('eglInitialize ' + o_egl.eglGetError().toString(16)); }
    o_egl.eglBindAPI(0x30A0); // GLES
    let a_n_attr = new Int32Array([0x3033, 1, 0x3040, 0x40, 0x3024, 8, 0x3023, 8, 0x3022, 8, 0x3021, 8, 0x3025, 24, 0x3038]);
    let a_n_config = new BigUint64Array(1), a_n_cnt = new Int32Array(1);
    if(!o_egl.eglChooseConfig(o_display, a_n_attr, new Uint8Array(a_n_config.buffer), 1, a_n_cnt) || a_n_cnt[0] < 1){ throw new Error('no config'); }
    let o_config = Deno.UnsafePointer.create(a_n_config[0]);
    let o_surface = o_egl.eglCreatePbufferSurface(o_display, o_config, new Int32Array([0x3057, n_scl_x, 0x3056, n_scl_y, 0x3038]));
    let o_context = o_egl.eglCreateContext(o_display, o_config, null, new Int32Array([0x3098, 3, 0x3038]));
    if(!o_surface || !o_context){ throw new Error('no surface or context ' + o_egl.eglGetError().toString(16)); }
    if(!o_egl.eglMakeCurrent(o_display, o_surface, o_surface, o_context)){ throw new Error('makeCurrent'); }

    let g = Deno.dlopen('libGLESv2.so.2', {
        glCreateShader: { parameters: ['u32'], result: 'u32' },
        glShaderSource: { parameters: ['u32', 'i32', 'buffer', 'pointer'], result: 'void' },
        glCompileShader: { parameters: ['u32'], result: 'void' },
        glGetShaderiv: { parameters: ['u32', 'u32', 'buffer'], result: 'void' },
        glGetShaderInfoLog: { parameters: ['u32', 'i32', 'pointer', 'buffer'], result: 'void' },
        glCreateProgram: { parameters: [], result: 'u32' },
        glAttachShader: { parameters: ['u32', 'u32'], result: 'void' },
        glLinkProgram: { parameters: ['u32'], result: 'void' },
        glGetProgramiv: { parameters: ['u32', 'u32', 'buffer'], result: 'void' },
        glGetProgramInfoLog: { parameters: ['u32', 'i32', 'pointer', 'buffer'], result: 'void' },
        glUseProgram: { parameters: ['u32'], result: 'void' },
        glGetUniformLocation: { parameters: ['u32', 'buffer'], result: 'i32' },
        glEnable: { parameters: ['u32'], result: 'void' },
        glClearColor: { parameters: ['f32', 'f32', 'f32', 'f32'], result: 'void' },
        glGenVertexArrays: { parameters: ['i32', 'buffer'], result: 'void' },
        glGenBuffers: { parameters: ['i32', 'buffer'], result: 'void' },
        glViewport: { parameters: ['i32', 'i32', 'i32', 'i32'], result: 'void' },
        glClear: { parameters: ['u32'], result: 'void' },
        glUniformMatrix4fv: { parameters: ['i32', 'i32', 'u8', 'buffer'], result: 'void' },
        glUniform3fv: { parameters: ['i32', 'i32', 'buffer'], result: 'void' },
        glUniform1f: { parameters: ['i32', 'f32'], result: 'void' },
        glUniform1i: { parameters: ['i32', 'i32'], result: 'void' },
        glBindVertexArray: { parameters: ['u32'], result: 'void' },
        glDrawElements: { parameters: ['u32', 'i32', 'u32', 'pointer'], result: 'void' },
        glDrawArrays: { parameters: ['u32', 'i32', 'i32'], result: 'void' },
        glVertexAttrib1f: { parameters: ['u32', 'f32'], result: 'void' },
        glBindBuffer: { parameters: ['u32', 'u32'], result: 'void' },
        glBufferData: { parameters: ['u32', 'isize', 'buffer', 'u32'], result: 'void' },
        glEnableVertexAttribArray: { parameters: ['u32'], result: 'void' },
        glVertexAttribPointer: { parameters: ['u32', 'i32', 'u32', 'u8', 'i32', 'pointer'], result: 'void' },
        glGetError: { parameters: [], result: 'u32' },
        glGetString: { parameters: ['u32'], result: 'pointer' },
        glReadPixels: { parameters: ['i32', 'i32', 'i32', 'i32', 'u32', 'u32', 'buffer'], result: 'void' },
        glFinish: { parameters: [], result: 'void' }
    }).symbols;
    let f_u = function(s_f){ let a = new Uint32Array(1); g[s_f](1, new Uint8Array(a.buffer)); return a[0]; };
    let f_log = function(s_f, n_id){ let a = new Uint8Array(8192); g[s_f](n_id, 8192, null, a); return new TextDecoder().decode(a).split('\0')[0]; };
    let f_iv = function(s_f, n_id, n_name){ let a = new Int32Array(1); g[s_f](n_id, n_name, a); return a[0]; };
    let n_null_location = -1;
    let o_gl = {
        VERTEX_SHADER: 0x8B31, FRAGMENT_SHADER: 0x8B30, COMPILE_STATUS: 0x8B81, LINK_STATUS: 0x8B82, DEPTH_TEST: 0x0B71,
        ARRAY_BUFFER: 0x8892, ELEMENT_ARRAY_BUFFER: 0x8893, DYNAMIC_DRAW: 0x88E8, STATIC_DRAW: 0x88E4, FLOAT: 0x1406,
        COLOR_BUFFER_BIT: 0x4000, DEPTH_BUFFER_BIT: 0x100, TRIANGLES: 4, UNSIGNED_INT: 0x1405,
        createShader: n => g.glCreateShader(n),
        shaderSource: function(n, s){
            let a_n_str = f_cstr(s);
            let a_n_ptr = new BigUint64Array([Deno.UnsafePointer.value(Deno.UnsafePointer.of(a_n_str))]);
            g.glShaderSource(n, 1, new Uint8Array(a_n_ptr.buffer), null);
        },
        compileShader: n => g.glCompileShader(n),
        getShaderParameter: (n, p) => f_iv('glGetShaderiv', n, p) !== 0,
        getShaderInfoLog: n => f_log('glGetShaderInfoLog', n),
        createProgram: () => g.glCreateProgram(),
        attachShader: (a, b) => g.glAttachShader(a, b),
        linkProgram: n => g.glLinkProgram(n),
        getProgramParameter: (n, p) => f_iv('glGetProgramiv', n, p) !== 0,
        getProgramInfoLog: n => f_log('glGetProgramInfoLog', n),
        useProgram: n => g.glUseProgram(n),
        getUniformLocation: function(n, s){ let l = g.glGetUniformLocation(n, f_cstr(s)); return l === n_null_location ? null : l; },
        enable: n => g.glEnable(n),
        clearColor: (r, gg, b, a) => g.glClearColor(r, gg, b, a),
        createVertexArray: () => f_u('glGenVertexArrays'),
        createBuffer: () => f_u('glGenBuffers'),
        viewport: (x, y, w, h) => g.glViewport(x, y, w, h),
        clear: n => g.glClear(n),
        uniformMatrix4fv: (l, t, a) => g.glUniformMatrix4fv(l, 1, t ? 1 : 0, new Uint8Array(a.buffer, a.byteOffset, a.byteLength)),
        uniform3fv: function(l, a){ let f = Float32Array.from(a); g.glUniform3fv(l, 1, new Uint8Array(f.buffer)); },
        uniform1f: (l, n) => g.glUniform1f(l, n),
        uniform1i: (l, n) => g.glUniform1i(l, n),
        bindVertexArray: n => g.glBindVertexArray(n ?? 0),
        drawElements: (m, c, t, o) => g.glDrawElements(m, c, t, null),
        drawArrays: (m, f, c) => g.glDrawArrays(m, f, c),
        vertexAttrib1f: (i, n) => g.glVertexAttrib1f(i, n),
        bindBuffer: (t, n) => g.glBindBuffer(t, n),
        bufferData: (t, a, u) => g.glBufferData(t, a.byteLength, new Uint8Array(a.buffer, a.byteOffset, a.byteLength), u),
        enableVertexAttribArray: i => g.glEnableVertexAttribArray(i),
        vertexAttribPointer: (i, s, t, n, st, o) => g.glVertexAttribPointer(i, s, t, n ? 1 : 0, st, null)
    };
    return {
        o_gl,
        s_renderer: new Deno.UnsafePointerView(g.glGetString(0x1F01)).getCString(),
        s_version: new Deno.UnsafePointerView(g.glGetString(0x1F02)).getCString(),
        n_error: () => g.glGetError(),
        f_pixels: function(){
            g.glFinish();
            let a = new Uint8Array(n_scl_x * n_scl_y * 4);
            g.glReadPixels(0, 0, n_scl_x, n_scl_y, 0x1908, 0x1401, a);
            return a;
        }
    };
};
