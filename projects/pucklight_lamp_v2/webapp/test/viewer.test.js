// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Runs the real viewer on Mesa's software renderer and looks at the pictures it draws.
// Skips itself where Mesa cannot start.

import { assert, assertEquals, f_s_path } from './check.js';
import { f_o_gl } from './gl_shim.js';
import { f_o_mesh__egg, f_a_n_normal, f_o_param__default } from '../egg.module.js';
import { f_o_image__from_png, f_o_image__working, f_o_tile } from '../heightmap.module.js';
import { vase_mesh, run_script } from '../vase.module.js';
import { examples as o_s_example } from '../vase_example.module.js';
import { sphere_mesh, displace } from '../sphere.module.js';
import { f_a_n_col__sphere, f_a_n_col__vase, f_a_n_col__egg } from '../color.module.js';

let n_scl_x = 360, n_scl_y = 460;

let o_shim = null;
try{
    o_shim = f_o_gl(n_scl_x, n_scl_y);
} catch(o_error){
    console.log(`no software GL here, skipping the viewer's tests: ${o_error.message}`);
}

Deno.test({ name: 'the viewer draws the lamp, of every kind and in every look', ignore: !o_shim, sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let f_raf = null;
    globalThis.window = { devicePixelRatio: 1 };
    globalThis.requestAnimationFrame = function(f){ f_raf = f; };
    globalThis.ResizeObserver = class { observe(){} };
    let { f_o_viewer, s_vertex, s_fragment, o_look__by_name } = await import('../viewer.module.js');
    // GLSL reserves names with two underscores in a row, unlike this project's JS.
    assert(!/__/.test(s_vertex + s_fragment), 'a shader name has two underscores in a row');
    assertEquals(Object.keys(o_look__by_name), ['day', 'lit', 'overhang', 'edges', 'vertices', 'xray']);

    let o_viewer = f_o_viewer({
        clientWidth: n_scl_x, clientHeight: n_scl_y, width: 0, height: 0,
        getContext: function(){ return o_shim.o_gl; },
        addEventListener: function(){},
        getBoundingClientRect: function(){ return { left: 0, top: 0, right: n_scl_x, bottom: n_scl_y, width: n_scl_x, height: n_scl_y }; }
    });
    let o_lamp = JSON.parse(await Deno.readTextFile(f_s_path('part/lamp.json')));
    o_viewer.f_set_shade_z(o_lamp.n_mm__cup_floor_z);
    o_viewer.f_set_view({ a_n_light__pos: [0, 0, o_lamp.n_mm__puck_top_z] });
    let a_o_stl = [];
    for(let s_part of ['toppart', 'screwin']){
        a_o_stl.push({ o_buffer: (await Deno.readFile(f_s_path(`part/veryos/${s_part}.stl`))).buffer, n_z: 0 });
    }
    // Twice: the second set takes the first's place.
    o_viewer.f_set_part(a_o_stl);
    o_viewer.f_set_part(a_o_stl);
    let o_tile = f_o_tile(f_o_image__working(await f_o_image__from_png(await Deno.readFile(f_s_path('test/tile_16bit.png')))));

    let f_set_egg = function(o_change, s_brand = 'veryos'){
        let o_mesh = f_o_mesh__egg({ ...f_o_param__default(), ...o_change }, o_tile, o_lamp, 1.2, 120, s_brand);
        o_viewer.f_set_mesh({ ...o_mesh, a_n_nor: f_a_n_normal(o_mesh.a_n_pos, o_mesh.a_n_idx), a_n_col: f_a_n_col__egg(o_mesh.a_n_wall) });
        o_viewer.f_set_view({ b_single_wall: Boolean(o_change.b_vase), a_n_absorb: [0.10, 0.70, 0.46] });
        o_viewer.f_frame(o_lamp.n_mm__cup_floor_z + o_mesh.o_stat.n_mm__scl_z, 0);
    };
    // Rows come back from the bottom up; this turns them to run from the top down.
    let f_a_n_picture = function(o_view){
        o_viewer.f_set_view({ s_look: 'day', b_cut: false, b_base: true, n_nor__section: 1, n_deg__limit: 45, ...o_view });
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
    let f_b_drawn = (r, g, b, a) => a > 0;
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

    /* ---- An egg: a shell with smooth normals, its wall and its colours ---- */

    f_set_egg({});
    let a_n_day = f_a_n_picture({});
    let n_cnt__drawn = f_n_cnt(a_n_day, f_b_drawn);
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

    // Lit: thin parts let more light through than thick ones do.
    let a_n_lit = f_a_n_picture({ s_look: 'lit' });
    let n_cnt__bright = f_n_cnt(a_n_lit, (r, g, b, a) => a > 0 && g > 150);
    let n_cnt__deep = f_n_cnt(a_n_lit, (r, g, b, a) => a > 0 && r > 150 && g < 150);
    assert(n_cnt__bright > 500 && n_cnt__deep > 500, `no thin and thick parts when lit: ${n_cnt__bright} and ${n_cnt__deep}`);

    // Overhang: orange to red faces, and none of them on a smooth egg's outside. No
    // blue ones: a shell's wall that leans in lies on what is below it.
    let f_b_hot = (r, g, b, a) => a > 0 && r > 150 && g < r * 0.8 && b < 60;
    let f_b_blue = (r, g, b, a) => a > 0 && b > 120 && b > r * 1.5;
    let a_n_overhang = f_a_n_picture({ s_look: 'overhang', n_deg__limit: 30 });
    assert(f_n_cnt(a_n_overhang, f_b_hot) > 300, 'no overhang shown at a low limit');
    assertEquals(f_n_cnt(a_n_overhang, f_b_blue), 0, 'a shell shown as leaning in');
    f_set_egg({ n_mm__relief: 0 });
    let n_cnt__hot_smooth = f_n_cnt(f_a_n_picture({ s_look: 'overhang', n_deg__limit: 50 }), f_b_hot);
    assert(n_cnt__hot_smooth === 0, `${n_cnt__hot_smooth} hot pixels on a smooth egg`);
    f_set_egg({});

    // Cut open: the front is gone, so fewer pixels, and inside it is not as outside.
    let a_n_cut = f_a_n_picture({ b_cut: true });
    assert(f_n_cnt(a_n_cut, f_b_drawn) < n_cnt__drawn, 'nothing was cut');
    let n_cnt__changed = 0;
    for(let n_off = 0; n_off < a_n_cut.length; n_off += 4){
        if(a_n_cut[n_off + 3] > 0 && Math.abs(a_n_cut[n_off + 1] - a_n_day[n_off + 1]) > 25){ n_cnt__changed++; }
    }
    assert(n_cnt__changed > 2000, `the cut shows no inside: ${n_cnt__changed}`);

    // Without the base less is drawn, and with a section too.
    assert(f_n_cnt(f_a_n_picture({ b_base: false }), f_b_drawn) < n_cnt__drawn - 2000, 'the base did not go away');
    let n_cnt__half = f_n_cnt(f_a_n_picture({ n_nor__section: 0.5 }), f_b_drawn);
    assert(n_cnt__half < 0.8 * n_cnt__drawn && n_cnt__half > 0.3 * n_cnt__drawn, `the section at half: ${n_cnt__half} of ${n_cnt__drawn}`);
    assert(f_n_cnt(f_a_n_picture({ n_nor__section: 0 }), f_b_drawn) < n_cnt__half, 'the section at 0 leaves the lampshade');

    // The small views: drawn where their elements are, on a ground of their own.
    let f_o_cell = function(n_x, n_y){ return { getBoundingClientRect: function(){ return { left: n_x, top: n_y, right: n_x + 80, bottom: n_y + 80, width: 80, height: 80 }; } }; };
    o_viewer.f_set_mini([{ el: f_o_cell(270, 370), n_rad__azimuth: -Math.PI / 2, n_rad__polar: Math.PI / 2 }, { el: f_o_cell(180, 370), n_rad__azimuth: -Math.PI / 2, n_rad__polar: 0 }]);
    let a_n_mini = f_a_n_picture({});
    for(let [n_x, n_y] of [[271, 371], [349, 449], [181, 371]]){
        assertEquals([...a_n_mini.subarray((n_y * n_scl_x + n_x) * 4, (n_y * n_scl_x + n_x) * 4 + 4)], [25, 34, 34, 255], `the small view's corner at ${n_x}, ${n_y}`);
    }
    assertEquals(a_n_mini[(369 * n_scl_x + 271) * 4 + 3], a_n_day[(369 * n_scl_x + 271) * 4 + 3], 'a small view drew outside its place');
    let f_n_cnt__pink_in = function(n_x__from, n_y__from){
        let n_cnt = 0;
        for(let n_y = n_y__from; n_y < n_y__from + 80; n_y++){
            for(let n_x = n_x__from; n_x < n_x__from + 80; n_x++){
                let n_off = (n_y * n_scl_x + n_x) * 4;
                if(a_n_mini[n_off] > 150 && a_n_mini[n_off] > a_n_mini[n_off + 1] * 1.25){ n_cnt++; }
            }
        }
        return n_cnt;
    };
    assert(f_n_cnt__pink_in(270, 370) > 1200 && f_n_cnt__pink_in(180, 370) > 1200, `no egg in the small views: ${f_n_cnt__pink_in(270, 370)}, ${f_n_cnt__pink_in(180, 370)}`);
    o_viewer.f_set_mini([]);

    // From the top, where the eye looks straight down: still a picture.
    o_viewer.f_look_from(-Math.PI / 2, 0);
    assert(f_n_cnt(f_a_n_picture({}), f_b_drawn) > 3000, 'nothing drawn from the top');
    f_set_egg({});

    // Each brand's logo reads from the front. Comparing the lit egg with and without it
    // leaves the logo alone.
    let o_change__logo = { n_mm__relief: 0, n_mm__logo_scl_y: 60, n_nor__logo_z: 0.5, n_mm__logo_depth: 0.4 };
    f_set_egg({ ...o_change__logo, b_logo: false });
    let a_n_without = f_a_n_picture({ s_look: 'lit' });
    let f_a_a_b_logo = function(s_brand){
        f_set_egg({ ...o_change__logo, b_logo: true }, s_brand);
        let a_n_with = f_a_n_picture({ s_look: 'lit' });
        return Array.from({ length: n_scl_y }, function(v, n_y){
            return Array.from({ length: n_scl_x }, function(v, n_x){
                let n_off = (n_y * n_scl_x + n_x) * 4 + 1;
                return a_n_with[n_off] - a_n_without[n_off] > 12;
            });
        });
    };
    // TraceTrove: down its middle run the ring's top with the rib, the window, then the
    // ring's bottom: a long run of engraving above a short one. Upside down it would be
    // the other way around.
    let a_n_run = [];
    let n_run = 0;
    for(let a_b_row of f_a_a_b_logo('tracetrove')){
        if(a_b_row[n_scl_x >> 1]){
            n_run++;
        } else if(n_run > 0){
            a_n_run.push(n_run);
            n_run = 0;
        }
    }
    a_n_run = a_n_run.filter(n => n > 1);
    assert(a_n_run.length === 2, `the TraceTrove logo's middle should be cut twice by its window: runs ${a_n_run}`);
    assert(a_n_run[0] > 2 * a_n_run[1], `the TraceTrove logo stands on its head: runs ${a_n_run}`);
    // VeryOS: the V is widest near its top, where its arms end, and half as wide at its
    // flat bottom; and it is as wide to the left as to the right.
    let a_o_row__logo = f_a_a_b_logo('veryos').map(function(a_b_row){
        return { n_x__min: a_b_row.indexOf(true), n_x__max: a_b_row.lastIndexOf(true) };
    }).filter(function(o_row){ return o_row.n_x__min >= 0; });
    assert(a_o_row__logo.length > 30, `no VeryOS logo to see: ${a_o_row__logo.length} rows`);
    let a_n_scl_x__logo = a_o_row__logo.map(function(o_row){ return o_row.n_x__max - o_row.n_x__min; });
    let n_idx__widest = a_n_scl_x__logo.indexOf(Math.max(...a_n_scl_x__logo));
    assert(n_idx__widest < a_o_row__logo.length / 3, `the VeryOS logo stands on its head: widest in row ${n_idx__widest} of ${a_o_row__logo.length}`);
    assert(a_n_scl_x__logo[a_n_scl_x__logo.length - 3] < 0.6 * a_n_scl_x__logo[n_idx__widest], `the VeryOS logo's bottom is ${a_n_scl_x__logo[a_n_scl_x__logo.length - 3]} wide, its widest row ${a_n_scl_x__logo[n_idx__widest]}`);
    assert(Math.abs(Math.min(...a_o_row__logo.map(o => o.n_x__min)) + Math.max(...a_o_row__logo.map(o => o.n_x__max)) - n_scl_x) < 6, 'the VeryOS logo is off centre');

    /* ---- A vase: a single wall, one normal per triangle, the thread in gold ---- */

    let o_vase = vase_mesh(run_script(o_s_example.template));
    let a_n_pos__vase = o_vase.positions.slice();
    o_viewer.f_set_mesh({ a_n_pos: a_n_pos__vase, a_n_idx: o_vase.indices, a_n_nor: null, a_n_wall: new Float32Array(a_n_pos__vase.length / 3).fill(0.6),
        a_n_col: f_a_n_col__vase(a_n_pos__vase.length / 3, o_vase.fixed), n_cnt__fixed: o_vase.fixed });
    o_viewer.f_set_view({ b_single_wall: true, a_n_absorb: [0.36, 0.4, 0.46] });
    o_viewer.f_frame(o_lamp.n_mm__cup_floor_z + 153.6, 0);
    let a_n_vase = f_a_n_picture({ b_base: false });
    let n_cnt__vase = f_n_cnt(a_n_vase, f_b_drawn);
    let n_cnt__white = f_n_cnt(a_n_vase, (r, g, b, a) => a > 0 && Math.abs(r - b) < 40 && r > 120);
    let n_cnt__gold = f_n_cnt(a_n_vase, (r, g, b, a) => a > 0 && r > 150 && b < r * 0.6 && g > b);
    assert(n_cnt__white > 0.6 * n_cnt__vase && n_cnt__gold > 100, `the vase is not white on a gold thread: ${n_cnt__white} white, ${n_cnt__gold} gold of ${n_cnt__vase}`);
    // Its cone leans out 41 degrees and its dome in 41: past a limit of 30, both show.
    let a_n_vase__overhang = f_a_n_picture({ b_base: false, s_look: 'overhang', n_deg__limit: 30 });
    assert(f_n_cnt(a_n_vase__overhang, f_b_hot) > 200 && f_n_cnt(a_n_vase__overhang, f_b_blue) > 200,
        `the vase's overhang and its dome do not show: ${f_n_cnt(a_n_vase__overhang, f_b_hot)} hot, ${f_n_cnt(a_n_vase__overhang, f_b_blue)} blue`);
    assertEquals(f_n_cnt(f_a_n_picture({ b_base: false, s_look: 'overhang', n_deg__limit: 45 }), (r, g, b, a) => f_b_hot(r, g, b, a) || f_b_blue(r, g, b, a)), 0, 'walls of 41 degrees past a limit of 45');
    // Edges and vertices are dark marks on the faces.
    let f_b_mark = (r, g, b, a) => a > 0 && r < 40 && g < 45 && b < 50;
    let n_cnt__mark = f_n_cnt(a_n_vase, f_b_mark);
    let n_cnt__edge = f_n_cnt(f_a_n_picture({ b_base: false, s_look: 'edges' }), f_b_mark);
    let n_cnt__point = f_n_cnt(f_a_n_picture({ b_base: false, s_look: 'vertices' }), f_b_mark);
    assert(n_cnt__edge > n_cnt__mark + 1500 && n_cnt__point > n_cnt__mark + 1500, `no edges or vertices: ${n_cnt__edge} and ${n_cnt__point} dark pixels, ${n_cnt__mark} without`);
    // Seen through: what is drawn, the ground shows through.
    let a_n_xray = f_a_n_picture({ b_base: false, s_look: 'xray' });
    let n_cnt__through = f_n_cnt(a_n_xray, (r, g, b, a) => a > 0 && a < 250);
    assert(n_cnt__through > 0.5 * n_cnt__vase, `x-ray is not seen through: ${n_cnt__through} of ${n_cnt__vase}`);
    // Through a section, from above: the inside of a single wall is lit as the outside,
    // only darker. Were it a shell, the same place would show its cut, in one flat colour.
    let f_b_cut = (r, g, b, a) => a > 0 && Math.abs(r - 178) <= 2 && Math.abs(g - 174) <= 2 && Math.abs(b - 166) <= 2;
    o_viewer.f_look_from(-Math.PI / 2, 0.7);
    let a_n_section = f_a_n_picture({ b_base: false, n_nor__section: 0.6 });
    o_viewer.f_set_view({ b_single_wall: false });
    let a_n_section__shell = f_a_n_picture({ b_base: false, n_nor__section: 0.6 });
    assertEquals(f_n_cnt(a_n_section, f_b_drawn), f_n_cnt(a_n_section__shell, f_b_drawn));
    assert(f_n_cnt(a_n_section__shell, f_b_cut) > 1500 && f_n_cnt(a_n_section, f_b_cut) < 100,
        `a section's inside: ${f_n_cnt(a_n_section, f_b_cut)} flat pixels as a single wall, ${f_n_cnt(a_n_section__shell, f_b_cut)} as a shell`);

    /* ---- A sphere: a shell, one normal per triangle, its heights as colours ---- */

    let o_sphere = sphere_mesh(180);
    displace(o_sphere, function(n_deg__lat, n_deg__lon){ return n_deg__lon > 180 ? 1 : 0; }, 3, -43);
    let a_n_col = f_a_n_col__sphere(o_sphere.heights, [{ n_t: 0, a_n_col: [20, 60, 200] }, { n_t: 1, a_n_col: [220, 200, 30] }]);
    o_viewer.f_set_mesh({ a_n_pos: o_sphere.positions, a_n_idx: o_sphere.indices, a_n_nor: null, a_n_wall: Float32Array.from(o_sphere.heights, function(n){ return 0.8 + 3 * n; }),
        a_n_col, n_cnt__fixed: o_sphere.rows[0].ring * 180 });
    o_viewer.f_set_view({ b_single_wall: false });
    o_viewer.f_frame(o_lamp.n_mm__cup_floor_z + 92, 0);
    // Longitude 270 is the front: yellow and thick there, blue and thin at the back.
    let f_b_yellow = (r, g, b, a) => a > 0 && r > 140 && g > 120 && b < 100;
    let f_b_blue__sphere = (r, g, b, a) => a > 0 && b > 110 && b > r * 2;
    let a_n_front = f_a_n_picture({ b_base: false });
    assert(f_n_cnt(a_n_front, f_b_yellow) > 5000 && f_n_cnt(a_n_front, f_b_blue__sphere) < 0.3 * f_n_cnt(a_n_front, f_b_yellow), `the sphere's front is not yellow: ${f_n_cnt(a_n_front, f_b_yellow)} yellow, ${f_n_cnt(a_n_front, f_b_blue__sphere)} blue`);
    o_viewer.f_look_from(Math.PI / 2, 1.38);
    let a_n_back = f_a_n_picture({ b_base: false });
    assert(f_n_cnt(a_n_back, f_b_blue__sphere) > 5000 && f_n_cnt(a_n_back, f_b_yellow) < 0.3 * f_n_cnt(a_n_back, f_b_blue__sphere), `the sphere's back is not blue: ${f_n_cnt(a_n_back, f_b_blue__sphere)} blue, ${f_n_cnt(a_n_back, f_b_yellow)} yellow`);
    // Lit, the thin back glows brighter than the thick front.
    let f_n_light = function(a_n){
        let n_sum = 0, n_cnt = 0;
        for(let n_off = 0; n_off < a_n.length; n_off += 4){
            if(a_n[n_off + 3] > 0){ n_sum += a_n[n_off + 1]; n_cnt++; }
        }
        return n_sum / n_cnt;
    };
    let n_light__back = f_n_light(f_a_n_picture({ b_base: false, s_look: 'lit' }));
    o_viewer.f_look_from(-Math.PI / 2, 1.38);
    let n_light__front = f_n_light(f_a_n_picture({ b_base: false, s_look: 'lit' }));
    assert(n_light__back > 1.3 * n_light__front, `lit, the thin side is not the brighter: ${n_light__back} against ${n_light__front}`);
    // Other colours for the same points.
    o_viewer.f_set_color(new Uint8Array(a_n_col.length).fill(255));
    let a_n_white = f_a_n_picture({ b_base: false });
    assertEquals(f_n_cnt(a_n_white, f_b_yellow) + f_n_cnt(a_n_white, f_b_blue__sphere), 0, 'the new colours did not arrive');
} });
