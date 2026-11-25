// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A sheet's outline traced from grids filled by hand.
import { assert, assertEquals } from './check.js';
import {
    f_a_a_n__outline, f_a_n__simplified, f_a_a_n__sheet, f_n_area, f_n_area2, f_s_svg__sheet, o_regex__svg_sheet,
    f_n_cnt__piece, f_a_n__material
} from '../layer.module.js';

// n_w x n_h pixels, each the share of it that f_b_inside(x, y) covers, from 4 x 4 samples.
let f_a_n__grid = function(n_w, n_h, f_b_inside){
    let a_n = new Float32Array(n_w * n_h);
    for(let n_j = 0; n_j < n_h; n_j++){
        for(let n_i = 0; n_i < n_w; n_i++){
            let n_cnt = 0;
            for(let n_s = 0; n_s < 16; n_s++){
                if(f_b_inside(n_i + (n_s % 4 + 0.5) / 4, n_j + (Math.floor(n_s / 4) + 0.5) / 4)){ n_cnt++; }
            }
            a_n[n_j * n_w + n_i] = n_cnt / 16;
        }
    }
    return a_n;
};

Deno.test('a full grid is its own rectangle, to the edge', function(){
    let a_a_n = f_a_a_n__sheet(new Float32Array(40 * 30).fill(1), 40, 30, 4, 3);
    assertEquals(a_a_n.length, 1);
    // four corners, each cut by half a pixel
    assertEquals(a_a_n[0].length, 16);
    assertEquals([Math.min(...a_a_n[0]), Math.max(...a_a_n[0])], [0, 4]);
    assert(a_a_n[0].includes(3) && !a_a_n[0].some(function(n, n_idx){ return n_idx % 2 === 1 && n > 3; }), 'to 3 in y');
    assert(Math.abs(f_n_area(a_a_n) - (12 - 4 * 0.05 * 0.05 / 2)) < 1e-9);
});

Deno.test('a square of pixels ends on the pixels\' edges', function(){
    let a_n = f_a_n__grid(20, 20, function(n_x, n_y){ return n_x > 5 && n_x < 12 && n_y > 3 && n_y < 9; });
    let a_a_n = f_a_a_n__outline(a_n, 20, 20);
    assertEquals(a_a_n.length, 1);
    let a_n_simple = f_a_n__simplified(a_a_n[0], 0.01);
    let a_n_x = a_n_simple.filter(function(n, n_idx){ return n_idx % 2 === 0; });
    let a_n_y = a_n_simple.filter(function(n, n_idx){ return n_idx % 2 === 1; });
    assertEquals([Math.min(...a_n_x), Math.max(...a_n_x), Math.min(...a_n_y), Math.max(...a_n_y)], [5, 12, 3, 9]);
    // a pixel's corner is cut at 45 degrees between two edges' middles: half a pixel each
    assert(Math.abs(f_n_area([a_a_n[0]]) - (42 - 4 * 0.125)) < 1e-9);
});

Deno.test('a disc keeps its area, a ring has a hole that runs the other way', function(){
    let f_b_ring = function(n_x, n_y){
        let n_r = Math.hypot(n_x - 50, n_y - 50);
        return n_r < 40 && n_r > 20;
    };
    let a_a_n = f_a_a_n__outline(f_a_n__grid(100, 100, f_b_ring), 100, 100);
    assertEquals(a_a_n.length, 2);
    assert(f_n_area2(a_a_n[0]) * f_n_area2(a_a_n[1]) < 0, 'outline and hole run opposite ways');
    let n_area = Math.PI * (1600 - 400);
    assert(Math.abs(f_n_area(a_a_n) - n_area) / n_area < 0.003, `ring area ${f_n_area(a_a_n)}`);
    let a_a_n_mm = f_a_a_n__sheet(f_a_n__grid(100, 100, f_b_ring), 100, 100, 10, 10);
    assert(Math.abs(f_n_area(a_a_n_mm) - n_area / 100) / (n_area / 100) < 0.005, 'simplified, in mm');
    assert(a_a_n_mm[0].length < a_a_n[0].length / 2, 'fewer points');
});

Deno.test('two pixels that touch at a corner only: two pieces, or one where the middle is material', function(){
    let a_n = new Float32Array(16);
    a_n[1 * 4 + 1] = 1;
    a_n[2 * 4 + 2] = 1;
    assertEquals(f_a_a_n__outline(a_n, 4, 4).length, 2);
    a_n[1 * 4 + 2] = 0.45;
    a_n[2 * 4 + 1] = 0.45;
    assertEquals(f_a_a_n__outline(a_n, 4, 4).length, 1);
    // every outline is closed and none is lost
    for(let n_seed = 1; n_seed < 40; n_seed++){
        let n = n_seed;
        let a_n_noise = Float32Array.from({ length: 30 * 30 }, function(){ n = (n * 16807) % 2147483647; return n / 2147483647; });
        let a_a_n = f_a_a_n__outline(a_n_noise, 30, 30);
        let n_cnt__inside = a_n_noise.filter(function(n_value){ return n_value >= 0.5; }).length;
        assert(a_a_n.length > 0 && f_n_area(a_a_n) > 0.2 * n_cnt__inside && f_n_area(a_a_n) < 1.8 * n_cnt__inside);
    }
});

Deno.test('specks are left out', function(){
    let a_n = new Float32Array(100 * 100);
    a_n[50 * 100 + 50] = 1;
    assertEquals(f_a_a_n__sheet(a_n, 100, 100, 10, 10).length, 0);
    assertEquals(f_a_a_n__sheet(a_n, 100, 100, 100, 100).length, 1);
});

Deno.test('the SVG is in mm and in the form the server takes', function(){
    let s_svg = f_s_svg__sheet(f_a_a_n__sheet(new Float32Array(1200 * 1560).fill(1), 1200, 1560, 120, 156), 120, 156);
    assert(s_svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="120mm" height="156mm" viewBox="0 0 120 156"><path fill-rule="evenodd" d="M'));
    assert(s_svg.endsWith('Z"/></svg>'));
    assertEquals(s_svg.match(/d="(.*)"/)[1].split('L').length, 8);
    assert(s_svg.includes('L120 0.05L120 155.95L'), s_svg);
    assert(o_regex__svg_sheet.test(s_svg));
    assert(!o_regex__svg_sheet.test(s_svg.replace('<path', '<image href="x"/><path')));
    assert(!o_regex__svg_sheet.test(s_svg.replace('Z"', 'Z" onload="x"')));
});

Deno.test('material: a frame, and the picture or all but the picture inside it', function(){
    let a_n_ink = f_a_n__grid(40, 40, function(n_x, n_y){ return Math.hypot(n_x - 20, n_y - 20) < 8; });
    let a_n_solid = f_a_n__material(a_n_ink, 40, 40, 'solid', 5);
    let a_n_cut = f_a_n__material(a_n_ink, 40, 40, 'cut', 5);
    assertEquals([a_n_solid[0], a_n_solid[4 * 40 + 20], a_n_solid[5 * 40 + 20], a_n_solid[20 * 40 + 20]], [1, 1, 0, 1]);
    assertEquals([a_n_cut[0], a_n_cut[5 * 40 + 20], a_n_cut[20 * 40 + 20]], [1, 1, 0]);
    // the disc does not reach the frame: a loose piece; cut out of the sheet it is a hole
    assertEquals([f_n_cnt__piece(a_n_solid, 40, 40), f_n_cnt__piece(a_n_cut, 40, 40)], [2, 1]);
    assertEquals(f_n_cnt__piece(f_a_n__material(new Float32Array(1600), 40, 40, 'cut', 0), 40, 40), 1);
    // half a pixel of frame is half a pixel of material
    assertEquals(f_a_n__material(new Float32Array(1600), 40, 40, 'solid', 2.5)[2 * 40 + 20], 0.5);
});
