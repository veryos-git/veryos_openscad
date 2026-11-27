// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Every kind of pattern: it has what the sheet and the page ask of a kind, its lines
// lie in its box, print and cutting file put it at the same place of the sheet; and
// what the sheet does for a kind that leaves it to the sheet.

import { a_o_kind, f_o_kind } from '../kind.module.js';
import { f_a_n__box } from '../path.module.js';
import { f_o_picture, f_o_picture__fitted } from '../picture.module.js';
import {
    o_setting__default as o_setting__default__sheet, f_o_setting__default, f_a_n__size__pattern, f_a_n__pattern, f_a_n__distance, f_a_n__box__file, f_s_svg,
    f_a_s_problem, f_a_a_n__anchor, f_a_a_n__spot, f_s_line__sheet, f_s_svg__page
} from '../sheet.module.js';

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertAlmostEquals = function(n_a, n_b, n_tolerance, s_message = ''){
    if(!(Math.abs(n_a - n_b) <= n_tolerance)){ throw new Error(`${s_message} ${n_a} is not ${n_b} within ${n_tolerance}`); }
};

Deno.test('the kinds: a calendar and a flextangle, each under its own name; a name that is none is a calendar', function(){
    assert(String(a_o_kind.map(function(o_kind){ return o_kind.s_kind; })) === 'calendar,flextangle', 'the kinds');
    for(let o_kind of a_o_kind){ assert(f_o_kind(o_kind.s_kind) === o_kind, o_kind.s_kind); }
    // settings kept before there were kinds name none
    assert(f_o_kind(undefined).s_kind === 'calendar' && f_o_kind('lantern').s_kind === 'calendar', 'no kind');
    assert(f_o_setting__default(undefined).s_kind === 'calendar' && f_o_setting__default('flextangle').s_kind === 'flextangle', 'the settings\' kind');
});

for(let o_kind of a_o_kind){
    let o_setting = f_o_setting__default(o_kind.s_kind);
    let a_s_sheet = o_kind.a_o_sheet.map(function(o_sheet){ return o_sheet.s_sheet; });

    Deno.test(`${o_kind.s_kind}: its settings are the sheet's and its own, none under a name of the sheet's, and fresh for every project`, function(){
        for(let s_name of Object.keys(o_kind.o_setting__default)){ assert(!(s_name in o_setting__default__sheet), `${s_name} is the sheet's`); }
        assert(String(Object.keys(o_setting).sort()) === String([...Object.keys(o_setting__default__sheet), ...Object.keys(o_kind.o_setting__default)].sort()), 'the settings');
        o_setting.a_o_picture__front.push(1);
        assert(f_o_setting__default(o_kind.s_kind).a_o_picture__front.length === 0 && o_setting__default__sheet.a_o_picture__front.length === 0, 'a list shared between projects');
        o_setting.a_o_picture__front.pop();
    });

    Deno.test(`${o_kind.s_kind}: names for the page and the files, sheets with the front first, a box, nothing wrong at the first start`, function(){
        for(let s_name of ['s_name', 's_noun', 's_about']){ assert(typeof o_kind[s_name] === 'string' && o_kind[s_name].length > 0, s_name); }
        assert(a_s_sheet[0] === 'front' && (a_s_sheet.length === 1 || String(a_s_sheet) === 'front,back'), String(a_s_sheet));
        assert(/^[a-z0-9_]+$/.test(o_kind.f_s_file(o_setting)), o_kind.f_s_file(o_setting));
        assert(o_kind.f_s_summary(o_setting).length > 0 && !/undefined|NaN/.test(o_kind.f_s_summary(o_setting)), o_kind.f_s_summary(o_setting));
        let [n_x, n_y] = f_a_n__size__pattern(o_setting);
        assert(n_x > 0 && n_y > 0 && n_x + 2 * o_setting.n_mm__left <= o_setting.n_mm__sheet_x && n_y + 2 * o_setting.n_mm__bottom <= o_setting.n_mm__sheet_y, `${n_x} x ${n_y} on the sheet`);
        assert(f_a_s_problem(o_setting).length === 0, f_a_s_problem(o_setting).join());
    });

    for(let s_sheet of a_s_sheet){
        Deno.test(`${o_kind.s_kind}, ${s_sheet}: its lines have a name each and a colour, and lie in its box`, function(){
            let a_o_line = o_kind.f_a_o_line(o_setting, s_sheet);
            assert(a_o_line.length > 0, 'no lines');
            assert(new Set(a_o_line.map(function(o_line){ return o_line.s_name; })).size === a_o_line.length, 'a name twice');
            let [n_x, n_y] = f_a_n__size__pattern(o_setting);
            for(let o_line of a_o_line){
                assert(/^[a-z_]+$/.test(o_line.s_name) && /^#[0-9a-f]{6}$/.test(o_line.s_colour), `${o_line.s_name} ${o_line.s_colour}`);
                let a_n = f_a_n__box(o_line.a_a_o_seg);
                assert(a_n.every(Number.isFinite) && a_n[0] >= -1e-9 && a_n[1] >= -1e-9 && a_n[2] <= n_x + 1e-9 && a_n[3] <= n_y + 1e-9, `${o_line.s_name} at ${a_n}`);
            }
            assert(o_kind.f_s_desc(s_sheet).length > 0, 'nothing said about the lines');
        });

        Deno.test(`${o_kind.s_kind}, ${s_sheet}: print and cutting file meet: the file is the sheet of paper, and the print draws the lines where the file has them`, function(){
            let o_setting__placed = { ...o_setting, n_mm__sheet_x: 420, n_mm__sheet_y: 297, n_mm__left: 31.25, n_mm__bottom: 7.5 };
            let [n_x, n_y] = f_a_n__size__pattern(o_setting__placed);
            // the pattern's box on the sheet, from the sheet's top left as a page is drawn
            let [n_x__pattern, n_y__pattern] = f_a_n__pattern(o_setting__placed);
            assertAlmostEquals(n_x__pattern, 31.25, 1e-9, 'from the left');
            assertAlmostEquals(297 - n_y__pattern - n_y, 7.5, 1e-9, 'from the bottom');
            assert(String(f_a_n__distance(o_setting__placed, f_a_n__box__file(o_setting__placed, s_sheet)).map(function(n){ return +n.toFixed(9); })) === '0,0,0,0', 'the file is not the sheet');
            // the file's lines are the pattern's own moved to its place; the print moves the same lines by a group
            let s_svg = f_s_svg(o_setting__placed, s_sheet);
            let s_line = f_s_line__sheet({ ...o_setting__placed, b_print_guide: false }, s_sheet);
            assert(s_line.startsWith(`<g class="cut" transform="translate(${n_x__pattern} ${+n_y__pattern.toFixed(4)})">`), s_line.slice(0, 80));
            let f_a_s_d = function(s){ return [...s.matchAll(/<path id="([a-z_]+)"[^>]* d="([^"]*)"/g)].map(function(o_found){ return [o_found[1], o_found[2]]; }); };
            let a_a_s__file = f_a_s_d(s_svg);
            let a_a_s__print = f_a_s_d(s_line);
            assert(a_a_s__file.length === a_a_s__print.length && a_a_s__file.length > 1, `${a_a_s__file.length} and ${a_a_s__print.length} paths`);
            a_a_s__file.forEach(function([s_id, s_d], n_idx){
                assert(a_a_s__print[n_idx][0] === s_id, s_id);
                let a_n__file = s_d.match(/-?\d+(\.\d+)?/g).map(Number);
                let a_n__print = a_a_s__print[n_idx][1].match(/-?\d+(\.\d+)?/g).map(Number);
                assert(a_n__file.length === a_n__print.length, `${s_id}: ${a_n__file.length} and ${a_n__print.length} numbers`);
                // the first place of each path: the file's is the print's moved to the pattern's place
                assertAlmostEquals(a_n__file[0], a_n__print[0] + n_x__pattern, 2e-4, `${s_id} x`);
                assertAlmostEquals(a_n__file[1], a_n__print[1] + n_y__pattern, 2e-4, `${s_id} y`);
            });
        });
    }

    Deno.test(`${o_kind.s_kind}: a match snaps to its box's corners and middle and to its own places, all in the box`, function(){
        let [n_x, n_y] = f_a_n__size__pattern(o_setting);
        let a_a_n = f_a_a_n__anchor(o_setting);
        assert(String(a_a_n.slice(0, 5)) === String([[0, 0], [n_x, 0], [n_x, n_y], [0, n_y], [n_x / 2, n_y / 2]]), 'the box');
        assert(a_a_n.length > 5 + 10 && a_a_n.every(function(a_n){ return a_n[0] >= -1e-9 && a_n[0] <= n_x + 1e-9 && a_n[1] >= -1e-9 && a_n[1] <= n_y + 1e-9; }), `${a_a_n.length} places`);
    });

    Deno.test(`${o_kind.s_kind}: a page of the print names its sheet beside the ruler line if the pattern has two`, function(){
        let s_svg = f_s_svg__page(o_setting, 'front', {}, 4);
        assert(s_svg.includes(a_s_sheet.length > 1 ? ' mm, front</text>' : ' mm</text>'), s_svg.match(/<text[^>]*>[^<]*<\/text>/)?.[0]);
        assert(s_svg.includes('<g class="cut"') && !/NaN|undefined/.test(s_svg), 'the cut lines of a sheet without a picture');
    });
}

Deno.test('pictures loaded together: a calendar\'s on its windows, 2 mm around each and around again; a flextangle\'s spread over the net, row by row', function(){
    let o_setting = f_o_setting__default('calendar');
    let a_a_n = f_a_a_n__spot(o_setting, 26);
    // the first window: its middle 15 + 41.1667 / 2 from the left and 15 + 40 / 2 from the top, 32 wide and high
    a_a_n[0].forEach(function(n, n_idx){ assertAlmostEquals(n, [15 + 247 / 12 - 18, 17, 15 + 247 / 12 + 18, 53][n_idx], 1e-9, 'window 1'); });
    assert(a_a_n.length === 26 && String(a_a_n[24]) === String(a_a_n[0]) && String(a_a_n[25]) === String(a_a_n[1]) && String(a_a_n[1]) !== String(a_a_n[0]), 'around again');

    o_setting = f_o_setting__default('flextangle');
    let [n_x, n_y] = f_a_n__size__pattern(o_setting);
    for(let n_picture of [1, 2, 3, 5, 12, 40]){
        let a_a_n__cell = f_a_a_n__spot(o_setting, n_picture);
        assert(a_a_n__cell.length === n_picture, `${n_picture} pictures, ${a_a_n__cell.length} places`);
        let n_column = a_a_n__cell.filter(function(a_n){ return a_n[1] === 0; }).length;
        let n_row = Math.ceil(n_picture / n_column);
        a_a_n__cell.forEach(function(a_n, n_idx){
            assertAlmostEquals(a_n[2] - a_n[0], n_x / n_column, 1e-9, 'a cell\'s width');
            assertAlmostEquals(a_n[3] - a_n[1], n_y / n_row, 1e-9, 'a cell\'s height');
            assertAlmostEquals(a_n[0], (n_idx % n_column) * n_x / n_column, 1e-9, 'row by row');
            assertAlmostEquals(a_n[1], Math.floor(n_idx / n_column) * n_y / n_row, 1e-9, 'row by row');
            assert(a_n[2] <= n_x + 1e-9 && a_n[3] <= n_y + 1e-9, 'a cell beside the net');
        });
        // about as wide as high: no cell more than three times as long as it is wide
        let n_ratio = (n_x / n_column) / (n_y / n_row);
        assert(n_ratio < 3 && n_ratio > 1 / 3, `${n_picture} pictures in cells ${n_ratio} times as wide as high`);
    }
    // a picture fitted into its cell lies in the cell
    let o_picture = f_o_picture__fitted(f_o_picture(300, 100), f_a_a_n__spot(o_setting, 5)[4], false);
    let a_n = f_a_a_n__spot(o_setting, 5)[4];
    assertAlmostEquals(o_picture.n_mm__x, (a_n[0] + a_n[2]) / 2, 1e-9, 'its middle');
    assert(o_picture.n_mm__size_x <= a_n[2] - a_n[0] + 1e-9, 'wider than its cell');
});

Deno.test('what is wrong with the place is said with the kind\'s own name', function(){
    assert(String(f_a_s_problem({ ...f_o_setting__default('flextangle'), n_mm__left: 60 })) === 'The flextangle reaches over the sheet\'s edge: right', String(f_a_s_problem({ ...f_o_setting__default('flextangle'), n_mm__left: 60 })));
    assert(String(f_a_s_problem({ ...f_o_setting__default('flextangle'), n_mm__bottom: 2 })) === 'The flextangle lies in the printer\'s margin, where a print stays blank: bottom', 'in the margin');
    assert(f_a_s_problem({ ...f_o_setting__default('calendar'), n_mm__left: 60 })[0] === 'The calendar reaches over the sheet\'s edge: right', 'the calendar');
});
