// Runs the real viewer on Mesa's software renderer and looks at the pictures it draws.
// Skips itself where Mesa cannot start.

import { f_o_gl } from './gl_shim.js';
import { f_o_mesh__egg, f_a_n_normal, f_o_param__default } from '../egg.module.js';
import { f_o_image__from_png, f_o_image__working, f_o_tile } from '../heightmap.module.js';

let n_scl_x = 360, n_scl_y = 460;
let f_s_path = function(s_relative){ return decodeURI(new URL(`../${s_relative}`, import.meta.url).pathname); };
let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};

let o_shim = null;
try{
    o_shim = f_o_gl(n_scl_x, n_scl_y);
} catch(o_error){
    console.log(`no software GL here, skipping the viewer's tests: ${o_error.message}`);
}

Deno.test({ name: 'the viewer draws the lamp, in every view', ignore: !o_shim, sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let f_raf = null;
    globalThis.window = { devicePixelRatio: 1 };
    globalThis.requestAnimationFrame = function(f){ f_raf = f; };
    globalThis.ResizeObserver = class { observe(){} };
    let { f_o_viewer, s_vertex, s_fragment } = await import('../viewer.module.js');
    // GLSL reserves names with two underscores in a row, unlike this project's JS.
    assert(!/__/.test(s_vertex + s_fragment), 'a shader name has two underscores in a row');

    let o_viewer = f_o_viewer({
        clientWidth: n_scl_x, clientHeight: n_scl_y, width: 0, height: 0,
        getContext: function(){ return o_shim.o_gl; },
        addEventListener: function(){}
    });
    let o_lamp = JSON.parse(await Deno.readTextFile(f_s_path('part/lamp.json')));
    let n_z__egg = o_lamp.n_mm__sockel_z + o_lamp.n_mm__seat_z;
    o_viewer.f_set_egg_z(n_z__egg);
    o_viewer.f_set_view({ a_n_light__pos: [0, 0, o_lamp.n_mm__sockel_z + o_lamp.n_mm__puck_top_z] });
    for(let [s_part, n_z] of [['sockel', o_lamp.n_mm__sockel_z], ['screwin', o_lamp.n_mm__sockel_z], ['clickbase', o_lamp.n_mm__clickbase_z]]){
        o_viewer.f_add_part((await Deno.readFile(f_s_path(`part/${s_part}.stl`))).buffer, n_z);
    }
    let a_n_u8 = await Deno.readFile(f_s_path('../Tileable/MG-Tile Scale (37).png'));
    let o_tile = f_o_tile(f_o_image__working(await f_o_image__from_png(a_n_u8)));
    let f_set_egg = function(o_change){
        let o_mesh = f_o_mesh__egg({ ...f_o_param__default(), ...o_change }, o_tile, o_lamp, 1.2, 120);
        o_viewer.f_set_egg(o_mesh.a_n_pos, f_a_n_normal(o_mesh.a_n_pos, o_mesh.a_n_idx), o_mesh.a_n_wall, o_mesh.a_n_idx);
        o_viewer.f_frame(n_z__egg + o_mesh.o_stat.n_mm__scl_z, o_lamp.n_mm__clickbase_z);
    };
    // Rows come back from the bottom up; this turns them to run from the top down.
    let f_a_n_picture = function(o_view){
        o_viewer.f_set_view({ b_cut: false, b_base: true, n_mode: 0, ...o_view });
        f_raf();
        let n_error = o_shim.n_error();
        assert(n_error === 0, `GL error 0x${n_error.toString(16)}`);
        let a_n = o_shim.f_pixels();
        let a_n__flipped = new Uint8Array(a_n.length);
        for(let n_y = 0; n_y < n_scl_y; n_y++){
            a_n__flipped.set(a_n.subarray((n_scl_y - 1 - n_y) * n_scl_x * 4, (n_scl_y - n_y) * n_scl_x * 4), n_y * n_scl_x * 4);
        }
        return a_n__flipped;
    };
    let f_n_cnt = function(a_n, f_b){
        let n_cnt = 0;
        for(let n_off = 0; n_off < a_n.length; n_off += 4){
            if(f_b(a_n[n_off], a_n[n_off + 1], a_n[n_off + 2], a_n[n_off + 3])){ n_cnt++; }
        }
        return n_cnt;
    };
    let f_o_row = function(a_n, n_y){
        let n_x__min = Infinity, n_x__max = -1;
        for(let n_x = 0; n_x < n_scl_x; n_x++){
            if(a_n[(n_y * n_scl_x + n_x) * 4 + 3] > 0){
                n_x__min = Math.min(n_x__min, n_x);
                n_x__max = Math.max(n_x__max, n_x);
            }
        }
        return { n_x__min, n_x__max, n_scl_x: n_x__max - n_x__min + 1 };
    };

    f_set_egg({});
    let a_n_day = f_a_n_picture({ n_mode: 0 });
    let n_cnt__drawn = f_n_cnt(a_n_day, (r, g, b, a) => a > 0);
    assert(n_cnt__drawn > n_scl_x * n_scl_y * 0.12, `only ${n_cnt__drawn} pixels drawn`);
    assert(a_n_day[3] === 0, 'the corner must show the page behind the canvas');
    let n_cnt__pink = f_n_cnt(a_n_day, (r, g, b, a) => a > 0 && r > 150 && r > g * 1.25 && r > b * 1.1);
    assert(n_cnt__pink > n_cnt__drawn * 0.5, `the egg is not rose pink: ${n_cnt__pink} of ${n_cnt__drawn}`);

    // Upright: narrow at the top, wide in the middle, and centred.
    let n_y__first = 0;
    while(f_o_row(a_n_day, n_y__first).n_scl_x <= 0){ n_y__first++; }
    let n_y__mid = n_y__first + Math.round(0.45 * (n_scl_y - 2 * n_y__first));
    let o_row__top = f_o_row(a_n_day, n_y__first + 3);
    let o_row__mid = f_o_row(a_n_day, n_y__mid);
    assert(o_row__top.n_scl_x < 0.25 * o_row__mid.n_scl_x, 'the egg stands on its head');
    assert(Math.abs(o_row__mid.n_x__min + o_row__mid.n_x__max - n_scl_x) < 8, 'the lamp is off centre');

    // Lit: the thin grooves let more light through than the thick scales do.
    let a_n_lit = f_a_n_picture({ n_mode: 1 });
    let n_cnt__bright = f_n_cnt(a_n_lit, (r, g, b, a) => a > 0 && g > 150);
    let n_cnt__deep = f_n_cnt(a_n_lit, (r, g, b, a) => a > 0 && r > 150 && g < 150);
    assert(n_cnt__bright > 500 && n_cnt__deep > 500, `no grooves and scales when lit: ${n_cnt__bright} and ${n_cnt__deep}`);

    // Overhang: orange to red faces, and none of them on a smooth egg's outside.
    let f_b_hot = (r, g, b, a) => a > 0 && r > 150 && g < r * 0.8 && b < 60;
    assert(f_n_cnt(f_a_n_picture({ n_mode: 2, n_deg__limit: 30 }), f_b_hot) > 300, 'no overhang shown at a low limit');
    f_set_egg({ n_mm__relief: 0 });
    let n_cnt__hot_smooth = f_n_cnt(f_a_n_picture({ n_mode: 2, n_deg__limit: 50 }), f_b_hot);
    assert(n_cnt__hot_smooth === 0, `${n_cnt__hot_smooth} hot pixels on a smooth egg`);
    f_set_egg({});

    // Cut open: the front is gone, so fewer pixels and the wall's cut in its own colour.
    let a_n_cut = f_a_n_picture({ n_mode: 0, b_cut: true });
    assert(f_n_cnt(a_n_cut, (r, g, b, a) => a > 0) < n_cnt__drawn, 'nothing was cut');
    let n_cnt__wall = f_n_cnt(a_n_cut, (r, g, b, a) => a > 0 && r > 150 && r < 225 && g < 100 && b < 130);
    assert(n_cnt__wall > 100, `no cut wall to see: ${n_cnt__wall}`);

    // Without the base less is drawn.
    assert(f_n_cnt(f_a_n_picture({ b_base: false }), (r, g, b, a) => a > 0) < n_cnt__drawn, 'the base did not go away');

    // The logo reads from the front. Comparing the egg with and without it leaves the
    // logo alone. Down its middle run the ring's top with the rib, the window, then the
    // ring's bottom: a long run of engraving above a short one. Upside down it would
    // be the other way around.
    let o_change__logo = { n_mm__relief: 0, n_mm__logo_scl_y: 70, n_nor__logo_z: 0.5, n_mm__logo_depth: 0.4 };
    f_set_egg({ ...o_change__logo, b_logo: false });
    let a_n_without = f_a_n_picture({ n_mode: 1 });
    f_set_egg({ ...o_change__logo, b_logo: true });
    let a_n_with = f_a_n_picture({ n_mode: 1 });
    let n_x__mid = n_scl_x >> 1;
    let a_n_run = [];
    let n_run = 0;
    for(let n_y = 0; n_y < n_scl_y; n_y++){
        let n_off = (n_y * n_scl_x + n_x__mid) * 4 + 1;
        if(a_n_with[n_off] - a_n_without[n_off] > 12){
            n_run++;
        } else if(n_run > 0){
            a_n_run.push(n_run);
            n_run = 0;
        }
    }
    a_n_run = a_n_run.filter(n => n > 1);
    assert(a_n_run.length === 2, `the logo's middle should be cut twice by its window: runs ${a_n_run}`);
    assert(a_n_run[0] > 2 * a_n_run[1], `the logo stands on its head: runs ${a_n_run}`);
} });
