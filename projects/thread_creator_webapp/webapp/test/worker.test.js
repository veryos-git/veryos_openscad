// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The worker as the page uses it: an object in two colours read, cut, shown three ways
// and written as a 3MF, which reads back as parts and a screw in their filaments.

import { assert, assertEquals, assertAlmostEquals } from './check.js';
import { f_o_object__from_file } from '../mesh_file.module.js';
import { f_a_n_tri__ball, f_a_n_col__of_tri, f_s_obj__of_tri } from './shape.js';

// Messages to the worker, one answer each.
let f_o_worker = function(){
    let o_worker = new Worker(new URL('../worker.module.js', import.meta.url), { type: 'module' });
    let a_f_resolve = [];
    o_worker.onmessage = function(o_event){ a_f_resolve.shift()(o_event.data); };
    return {
        f_o_ask: function(o_request){
            return new Promise(function(f_resolve){
                a_f_resolve.push(f_resolve);
                o_worker.postMessage(o_request);
            });
        },
        f_end: function(){ o_worker.terminate(); }
    };
};

Deno.test('the worker: a red and white ball, cut, on the bed, as a 3MF', async function(){
    let o = f_o_worker();
    try{
        // Asked to cut before it has an object, it says so.
        assertEquals((await o.f_o_ask({ s_type: 'build', n_id: 1, o_setting: {}, s_view: 'together' })).s_message, 'Load a 3D object first.');
        let a_n_tri = f_a_n_tri__ball(25, [100, 50, 10], 40);
        let a_n_col = f_a_n_col__of_tri(a_n_tri, function(n_x, n_y, n_z){ return n_z > 15 ? [210, 30, 30] : [245, 245, 240]; });
        let a_n_u8 = new TextEncoder().encode(f_s_obj__of_tri(a_n_tri, a_n_col));
        let o_loaded = await o.f_o_ask({ s_type: 'object', n_id: 2, a_n_u8, s_name__file: 'ball.obj' });
        assertEquals([o_loaded.s_type, o_loaded.b_color, o_loaded.n_cnt__shell], ['object_loaded', true, 1]);
        // Standing on z = 0 around the z axis.
        o_loaded.a_n_min.concat(o_loaded.a_n_max).forEach(function(n, n_k){ assertAlmostEquals(n, [-25, -25, 0, 25, 25, 50][n_k], 0.05); });
        let o_setting = { n_mm__clearance: 0.25, n_mm__depth: 12, n_mm__wall: 1.2, n_deg__line_up: 0, n_mm__bed: 256, n_cnt__filament: 4,
            a_o_cut: [{ a_n_trn: [0, 0, 25], a_n_rot: [0, 0, 0, 1], b_thread: true, n_mm__d: 0 }] };
        let o_built = await o.f_o_ask({ s_type: 'build', n_id: 3, o_setting, s_view: 'together' });
        assertEquals(o_built.s_type, 'built', o_built.s_message);
        let o_report = o_built.o_report;
        assertEquals([o_report.a_o_part.length, o_report.a_o_screw.length, o_report.a_o_screw[0].n_mm__d], [2, 1, 8]);
        assertEquals(o_report.a_a_n_col__filament, [[245, 245, 240], [210, 30, 30]], 'white covers more');
        assertEquals(o_report.a_o_part.map(function(o_part){ return o_part.n_fil; }), [1, 1], 'the cut at 25 is in the white');
        assertEquals(o_report.a_o_part.map(function(o_part){ return o_part.a_n_fil__used; }), [[1, 2], [1]]);
        assertEquals(o_built.a_n_pos.length, o_built.a_n_col.length);
        // Apart and on the bed: the same triangles elsewhere.
        let o_apart = await o.f_o_ask({ s_type: 'build', n_id: 4, o_setting, s_view: 'apart' });
        let o_bed = await o.f_o_ask({ s_type: 'build', n_id: 5, o_setting, s_view: 'bed' });
        assertEquals([o_apart.a_n_pos.length, o_bed.a_n_pos.length], [o_built.a_n_pos.length, o_built.a_n_pos.length]);
        let n_z__min = Infinity, n_xy__min = Infinity, n_xy__max = -Infinity;
        for(let n_off = 0; n_off < o_bed.a_n_pos.length; n_off += 3){
            n_z__min = Math.min(n_z__min, o_bed.a_n_pos[n_off + 2]);
            n_xy__min = Math.min(n_xy__min, o_bed.a_n_pos[n_off], o_bed.a_n_pos[n_off + 1]);
            n_xy__max = Math.max(n_xy__max, o_bed.a_n_pos[n_off], o_bed.a_n_pos[n_off + 1]);
        }
        assert(Math.abs(n_z__min) < 1e-4 && n_xy__min >= 8 - 1e-3 && n_xy__max <= 248 + 1e-3, `${n_z__min} ${n_xy__min} ${n_xy__max}`);

        let o_exported = await o.f_o_ask({ s_type: 'export', n_id: 6, o_setting, s_name__file: 'Red Ball.obj' });
        assertEquals(o_exported.s_name, 'red_ball_threaded.3mf');
        let a_n_u8__3mf = new Uint8Array(await o_exported.o_blob.arrayBuffer());
        let o_read = await f_o_object__from_file({ a_n_u8: a_n_u8__3mf, s_name: o_exported.s_name });
        assertEquals(o_read.a_s_item, ['part 1', 'part 2', 'screw 1 M8 x 21.0']);
        // The upper part in both filaments, as painted: the paint is read back.
        let o_set = new Set();
        for(let n_off = 0; n_off < o_read.a_n_col.length; n_off += 3){ o_set.add(o_read.a_n_col.subarray(n_off, n_off + 3).join()); }
        assertEquals(o_set.size, 2);
    } finally {
        o.f_end();
    }
});
