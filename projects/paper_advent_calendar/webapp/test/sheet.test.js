// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The sheet of paper: the calendar's place on it from the bottom left corner, the same
// for the print and for the cutting file; crop marks and ruler line outside the
// calendar; what is said when the place or a picture does not fit; the print's SVG,
// and a page of the print as an SVG of its own, for a file.

import { o_setting__default, f_a_s_path, f_a_n__box__file, f_a_o_window } from '../calendar.module.js';
import { f_o_picture, f_o_picture__fitted, f_s_picture } from '../picture.module.js';
import {
    n_mm__crop, n_mm__crop_gap, f_a_n__calendar, f_a_n__distance, f_a_n__bleed, f_a_a_a_n__crop, f_o_ruler,
    f_a_s_problem__sheet, f_s_picture__sheet, f_s_line__sheet, f_s_svg__page
} from '../sheet.module.js';

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertAlmostEquals = function(n_a, n_b, n_tolerance, s_message = ''){
    if(!(Math.abs(n_a - n_b) <= n_tolerance)){ throw new Error(`${s_message} ${n_a} is not ${n_b} within ${n_tolerance}`); }
};

// A calendar standing upright on A4, off the middle.
let o_setting__upright = { ...o_setting__default, n_mm__sheet_x: 210, n_mm__sheet_y: 297, n_mm__calendar_x: 150, n_mm__calendar_y: 200, n_mm__left: 12.5, n_mm__bottom: 30, n_mm__bleed: 3 };

Deno.test('the calendar\'s place: from the sheet\'s bottom left corner, drawn from its top left', function(){
    assert(String(f_a_n__calendar(o_setting__default)) === '10,10' && String(f_a_n__distance(o_setting__default)) === '10,10,10,10', 'A4 lying, 277 x 190 in its middle');
    assert(String(f_a_n__calendar(o_setting__upright)) === '12.5,67', String(f_a_n__calendar(o_setting__upright)));
    assert(String(f_a_n__distance(o_setting__upright)) === '12.5,30,47.5,67', String(f_a_n__distance(o_setting__upright)));
    // a box of the calendar: left, top, right, bottom in its mm
    assert(String(f_a_n__distance(o_setting__upright, [20, 10, 140, 180])) === '32.5,50,57.5,77', String(f_a_n__distance(o_setting__upright, [20, 10, 140, 180])));
    assert(String(f_a_n__bleed(o_setting__upright)) === '-3,-3,153,203', 'bleed');
});

Deno.test('print and cutting file meet: the file\'s box lies on the sheet where the print draws the calendar', function(){
    for(let o_setting of [o_setting__default, o_setting__upright, { ...o_setting__upright, b_sheet_dot: false }, { ...o_setting__upright, b_sheet_dot: false, b_outline: false }]){
        for(let s_sheet of ['front', 'back']){
            // the print: the file's own paths, moved by the calendar's corner
            let [n_x, n_y] = f_a_n__calendar(o_setting);
            let s_line = f_s_line__sheet(o_setting, s_sheet);
            assert(s_line.includes(`<g class="cut" transform="translate(${n_x} ${n_y})">${f_a_s_path(o_setting, s_sheet).join('')}</g>`), `${s_sheet}: the print's lines are not the file's`);
            // the cutter's software: the file's box, as far from the sheet's left and bottom
            let a_n__box = f_a_n__box__file(o_setting, s_sheet);
            let a_n = f_a_n__distance(o_setting, a_n__box);
            assertAlmostEquals(a_n[0], n_x + a_n__box[0], 1e-9, 'left');
            assertAlmostEquals(a_n[1], o_setting.n_mm__sheet_y - (n_y + a_n__box[3]), 1e-9, 'bottom');
            // with the sheet's dots the file is the sheet, corner on corner; without them and with the edge it is the calendar
            if(o_setting.b_sheet_dot){
                assert(String(a_n) === '0,0,0,0' && a_n__box[2] - a_n__box[0] === o_setting.n_mm__sheet_x && a_n__box[3] - a_n__box[1] === o_setting.n_mm__sheet_y, `with the sheet's dots: ${a_n}`);
            } else if(o_setting.b_outline){
                assert(a_n[0] === o_setting.n_mm__left && a_n[1] === o_setting.n_mm__bottom, 'with the edge: the settings\' own numbers');
            }
        }
    }
});

Deno.test('crop marks: two at every corner, on the edges\' lines, outside the bleed', function(){
    for(let o_setting of [o_setting__default, o_setting__upright]){
        let [n_x, n_y] = f_a_n__calendar(o_setting);
        let a_n__edge = [n_x, n_y, n_x + o_setting.n_mm__calendar_x, n_y + o_setting.n_mm__calendar_y];
        let a_a_a_n = f_a_a_a_n__crop(o_setting);
        assert(a_a_a_n.length === 8, 'marks');
        let o_n__by_corner = {};
        for(let [a_n_p, a_n_q] of a_a_a_n){
            assertAlmostEquals(Math.hypot(a_n_q[0] - a_n_p[0], a_n_q[1] - a_n_p[1]), n_mm__crop, 1e-9, 'length');
            // level on the top or bottom edge's line, or upright on the left or right edge's
            let n_axis = a_n_p[1] === a_n_q[1] ? 0 : 1;
            assert(a_n_p[1 - n_axis] === a_n_q[1 - n_axis] && [a_n__edge[1 - n_axis], a_n__edge[3 - n_axis]].includes(a_n_p[1 - n_axis]), `a mark off the edges' lines: ${a_n_p} ${a_n_q}`);
            // beyond the calendar's end by bleed and gap, running outwards
            let n_out = Math.min(...[a_n_p, a_n_q].map(function(a_n){ return Math.max(a_n__edge[n_axis] - a_n[n_axis], a_n[n_axis] - a_n__edge[n_axis + 2]); }));
            assertAlmostEquals(n_out, o_setting.n_mm__bleed + n_mm__crop_gap, 1e-9, 'distance from the corner');
            let s_corner = `${a_n_p[0] < (a_n__edge[0] + a_n__edge[2]) / 2},${a_n_p[1] < (a_n__edge[1] + a_n__edge[3]) / 2}`;
            o_n__by_corner[s_corner] = (o_n__by_corner[s_corner] ?? 0) + 1;
        }
        assert(Object.values(o_n__by_corner).join() === '2,2,2,2', 'two at every corner');
    }
});

Deno.test('the ruler line: under the calendar, the longest round length between the corners\' marks', function(){
    for(let [n_mm__calendar_x, n_mm] of [[277, 200], [220, 200], [219.5, 100], [120, 100], [119.5, 50], [70, 50], [69.5, 20], [50, 20]]){
        let o_setting = { ...o_setting__default, n_mm__calendar_x };
        let o_ruler = f_o_ruler(o_setting);
        assert(o_ruler.n_mm === n_mm, `calendar ${n_mm__calendar_x} wide: ${o_ruler.n_mm}`);
        assert(o_ruler.a_n[0] === 20 && o_ruler.a_n[1] === 204, `at ${o_ruler.a_n}`);
        assert(o_ruler.a_n[0] + o_ruler.n_mm <= 10 + n_mm__calendar_x - 10, 'ends before the corner');
    }
    assert(String(f_o_ruler(o_setting__upright).a_n) === '22.5,272', String(f_o_ruler(o_setting__upright).a_n));
});

Deno.test('what is wrong is said: over the sheet\'s edge, in the printer\'s margin, a picture too small, marks in a picture', function(){
    let f_a_s = function(o_more){ return f_a_s_problem__sheet({ ...o_setting__default, ...o_more }); };
    assert(f_a_s({}).length === 0, f_a_s({}).join());
    assert(f_a_s({ n_mm__left: 5, n_mm__bottom: 5 }).length === 0, 'at the margin');
    assert(f_a_s({ n_mm__left: 4.9 }).join() === 'The calendar lies in the printer\'s margin, where a print stays blank: left', f_a_s({ n_mm__left: 4.9 }).join());
    assert(f_a_s({ n_mm__left: 15.5, n_mm__bottom: 16 }).join() === 'The calendar lies in the printer\'s margin, where a print stays blank: right, top', f_a_s({ n_mm__left: 15.5, n_mm__bottom: 16 }).join());
    assert(f_a_s({ n_mm__left: 21, n_mm__bottom: 3 }).join('|') === 'The calendar reaches over the sheet\'s edge: right|The calendar lies in the printer\'s margin, where a print stays blank: bottom', f_a_s({ n_mm__left: 21, n_mm__bottom: 3 }).join('|'));
    assert(f_a_s({ n_mm__calendar_x: 300, n_mm__calendar_y: 211 }).join() === 'The calendar reaches over the sheet\'s edge: right, top', f_a_s({ n_mm__calendar_x: 300, n_mm__calendar_y: 211 }).join());
    assert(f_a_s({ n_mm__printer_margin: 0, n_mm__left: 0, n_mm__bottom: 0, n_mm__calendar_x: 297, n_mm__calendar_y: 210 }).length === 0, 'a printer without a margin, the calendar the sheet');

    let o_picture = f_o_picture(3000, 2000);
    let o_cover = f_o_picture__fitted(o_picture, f_a_n__bleed(o_setting__default), true);
    assert(f_a_s({ a_o_picture__front: [o_cover], a_o_picture__back: [o_cover], b_mark: false }).length === 0, 'pictures that cover calendar and bleed');
    // marks are for pictures drawn by hand: under a printed one they are cuts in it
    assert(f_a_s({ a_o_picture__front: [o_cover], a_o_picture__back: [o_cover] }).join() === 'The marks on the back are cut into its picture: leave them out, under Cuts', f_a_s({ a_o_picture__back: [o_cover] }).join());
    assert(f_a_s({ a_o_picture__front: [o_cover] }).length === 0, 'marks without a picture on the back');
    // 3000 x 2000 over the calendar alone: 285 x 190, 4 over at left and right, nothing at top and bottom
    let o_edge = f_o_picture__fitted(o_picture, [0, 0, 277, 190], true);
    assert(f_a_s({ a_o_picture__front: [o_edge] }).join() === 'The front picture does not reach 2 mm over the calendar\'s edge all around: a cut beside the edge shows white', f_a_s({ a_o_picture__front: [o_edge] }).join());
    assert(f_a_s({ a_o_picture__front: [o_edge], n_mm__bleed: 0 }).length === 0, 'without bleed');
    let o_inside = f_o_picture__fitted(o_picture, [0, 0, 277, 190], false);
    assert(f_a_s({ a_o_picture__front: [o_inside] }).join() === 'The front picture leaves a part of the calendar blank', 'fitted into the calendar');
    assert(f_a_s({ a_o_picture__front: [{ ...o_cover, n_deg: 3 }] }).join() === 'The front picture leaves a part of the calendar blank', 'turned a little');
});

Deno.test('several pictures: the front\'s have to cover the calendar between them, the back\'s every window', function(){
    let f_a_s = function(o_more){ return f_a_s_problem__sheet({ ...o_setting__default, b_mark: false, ...o_more }); };
    let o_cover = f_o_picture__fitted(f_o_picture(3000, 2000), f_a_n__bleed(o_setting__default), true);
    // the covering picture in two halves, and in six pieces: still all covered
    let f_a_o_half = function(n_ratio){ return [{ ...o_cover, a_n_ratio__crop: [0, 0, 1 - n_ratio, 0], n_mm__x: o_cover.n_mm__x - 291 * (1 - n_ratio) / 2, n_mm__size_x: 291 * n_ratio }, { ...o_cover, a_n_ratio__crop: [0.5, 0, 0, 0], n_mm__x: o_cover.n_mm__x + 291 / 4, n_mm__size_x: 291 / 2 }]; };
    assert(f_a_s({ a_o_picture__front: f_a_o_half(0.5) }).length === 0, f_a_s({ a_o_picture__front: f_a_o_half(0.5) }).join());
    // a gap of 3 mm between the halves, up the middle of the calendar
    assert(f_a_s({ a_o_picture__front: f_a_o_half(0.5 - 3 / 291) }).join() === 'The front pictures leave a part of the calendar blank', f_a_s({ a_o_picture__front: f_a_o_half(0.5 - 3 / 291) }).join());
    // one half moved 1.5 mm down: the calendar covered, the bleed above it not
    let a_o_moved = f_a_o_half(0.5).map(function(o_picture, n_idx){ return n_idx ? { ...o_picture, n_mm__y: o_picture.n_mm__y + 1.5 } : o_picture; });
    assert(f_a_s({ a_o_picture__front: a_o_moved }).join() === 'The front pictures do not reach 2 mm over the calendar\'s edge all around: a cut beside the edge shows white', f_a_s({ a_o_picture__front: a_o_moved }).join());
    // a small picture on a covering one changes nothing; alone it leaves the calendar blank
    let o_small = { ...f_o_picture(400, 400), n_mm__x: 50, n_mm__y: 50, n_mm__size_x: 40 };
    assert(f_a_s({ a_o_picture__front: [o_cover, o_small] }).length === 0 && f_a_s({ a_o_picture__front: [o_small, o_cover] }).length === 0, 'small on large');
    assert(f_a_s({ a_o_picture__front: [o_small] }).join() === 'The front picture leaves a part of the calendar blank', 'small alone');

    // the back: only what the windows show. 24 windows of 32 x 32, one picture of 36 x 36 behind each
    let a_o_window = f_a_o_window(o_setting__default);
    let a_o_behind = a_o_window.map(function(o_window){ return { ...f_o_picture(400, 400), n_mm__x: o_window.n_mm__x, n_mm__y: o_window.n_mm__y, n_mm__size_x: 36 }; });
    assert(f_a_s({ a_o_picture__back: a_o_behind }).length === 0, f_a_s({ a_o_picture__back: a_o_behind }).join());
    assert(f_a_s({ a_o_picture__back: a_o_behind.slice(1) }).join() === 'The back pictures leave window 1 blank in part', f_a_s({ a_o_picture__back: a_o_behind.slice(1) }).join());
    // one of them moved 3 mm to the right: 1 mm of its window shows no picture
    let a_o_off = a_o_behind.map(function(o_picture, n_idx){ return n_idx === 4 ? { ...o_picture, n_mm__x: o_picture.n_mm__x + 3 } : o_picture; });
    assert(f_a_s({ a_o_picture__back: a_o_off }).join() === 'The back pictures leave window 5 blank in part', f_a_s({ a_o_picture__back: a_o_off }).join());
    // turned by 45 degrees a picture of 36 no longer covers a window of 32; one of 46 does
    assert(f_a_s({ a_o_picture__back: a_o_behind.map(function(o_picture){ return { ...o_picture, n_deg: 45 }; }) }).join() === 'The back pictures leave windows 1, 2, 3, 4, 5, 6 and 18 more blank in part', 'turned');
    assert(f_a_s({ a_o_picture__back: a_o_behind.map(function(o_picture){ return { ...o_picture, n_deg: 45, n_mm__size_x: 46 }; }) }).length === 0, 'turned and larger');
    assert(f_a_s({ a_o_picture__back: [a_o_behind[0]] }).join() === 'The back picture leaves windows 2, 3, 4, 5, 6, 7 and 17 more blank in part', f_a_s({ a_o_picture__back: [a_o_behind[0]] }).join());
    // two pictures that cover a window between them
    let a_o_pair = [{ ...a_o_behind[0], n_mm__x: a_o_behind[0].n_mm__x - 10, n_mm__size_x: 20, a_n_ratio__crop: [0, 0, 0, 0], n_ratio__stretch: 1.8 }, { ...a_o_behind[0], n_mm__x: a_o_behind[0].n_mm__x + 10, n_mm__size_x: 20, n_ratio__stretch: 1.8 }];
    assert(f_a_s({ a_o_picture__back: [...a_o_pair, ...a_o_behind.slice(1)] }).length === 0, f_a_s({ a_o_picture__back: [...a_o_pair, ...a_o_behind.slice(1)] }).join());
    // one picture over the whole calendar covers them all; the front is not asked for what the back is
    let o_edge = f_o_picture__fitted(f_o_picture(3000, 2000), [0, 0, 277, 190], true);
    assert(f_a_s({ a_o_picture__back: [o_edge] }).length === 0 && f_a_s({ a_o_picture__back: [f_o_picture__fitted(f_o_picture(3000, 2000), [0, 0, 277, 190], false)] }).length === 0, 'one over all windows');
});

Deno.test('the print\'s picture: at the calendar\'s place, cut off bleed beyond its edge', function(){
    let o_picture = { ...f_o_picture(3000, 2000), s_file: 'a', n_mm__x: 70, n_mm__y: 110, n_mm__size_x: 400, n_deg: 30 };
    let o_setting = { ...o_setting__upright, a_o_picture__back: [o_picture] };
    assert(f_s_picture__sheet(o_setting, 'front', { a: 'blob:a' }) === '', 'a sheet without a picture');
    assert(f_s_picture__sheet(o_setting, 'back', {}) === '', 'a picture whose file is not there');
    assert(
        f_s_picture__sheet(o_setting, 'back', { a: 'blob:a' }) === '<clipPath id="back_clip"><rect x="9.5" y="64" width="156" height="206"/></clipPath>'
            + '<defs><image id="back_file_a" href="blob:a" width="3000" height="2000"/></defs>'
            + `<g clip-path="url(#back_clip)"><g transform="translate(12.5 67)">${f_s_picture(o_picture, '#back_file_a', true)}</g></g>`,
        f_s_picture__sheet(o_setting, 'back', { a: 'blob:a' })
    );
    // several pictures: in their order, the last on top; a file that two of them show stands once
    let o_piece = { ...o_picture, a_n_ratio__crop: [0.5, 0, 0, 0], n_mm__size_x: 100 };
    let o_other = { ...f_o_picture(400, 300), s_file: 'b', n_mm__x: 20, n_mm__y: 30, n_mm__size_x: 40 };
    let o_gone = { ...o_other, s_file: 'c' };
    o_setting = { ...o_setting__upright, a_o_picture__back: [o_picture, o_other, o_gone, o_piece] };
    let s_svg = f_s_picture__sheet(o_setting, 'back', { a: 'blob:a', b: 'blob:b' });
    assert(s_svg.includes('<defs><image id="back_file_a" href="blob:a" width="3000" height="2000"/><image id="back_file_b" href="blob:b" width="400" height="300"/></defs>'), s_svg);
    assert(s_svg.endsWith(`<g transform="translate(12.5 67)">${f_s_picture(o_picture, '#back_file_a', true)}${f_s_picture(o_other, '#back_file_b', true)}${f_s_picture(o_piece, '#back_file_a', true)}</g></g>`), 'in their order, without the one whose file is not there');
    assert((s_svg.match(/blob:/g) || []).length === 2, 'a file more than once');
    // one of them alone
    assert(f_s_picture__sheet(o_setting, 'back', { a: 'blob:a', b: 'blob:b' }, 1).endsWith(`<defs><image id="back_file_b" href="blob:b" width="400" height="300"/></defs><g clip-path="url(#back_clip)"><g transform="translate(12.5 67)">${f_s_picture(o_other, '#back_file_b', true)}</g></g>`), 'the second alone');
});

Deno.test('the print\'s lines: guides when asked for, with the ruler\'s length and the sheet\'s name', function(){
    for(let s_sheet of ['front', 'back']){
        let s_line = f_s_line__sheet(o_setting__default, s_sheet);
        assert(!/NaN|undefined|Infinity/.test(s_line), 'a number is missing');
        let [, s_d, s_text] = s_line.match(/^<g class="guide"><path fill="none" stroke="#000000" stroke-width="0.2" d="([^"]*)"\/><text x="222" y="205" font-family="sans-serif" font-size="3" fill="#000000">([^<]*)<\/text><\/g><g class="cut" /);
        assert(s_text === `200 mm, ${s_sheet}`, s_text);
        // eight crop marks, the ruler line and its two end marks
        assert((s_d.match(/M/g) || []).length === 11 && s_d.includes('M 20 204 L 220 204') && s_d.includes('M 20 203 L 20 205') && s_d.includes('M 220 203 L 220 205'), s_d);
        for(let [a_n_p, a_n_q] of f_a_a_a_n__crop(o_setting__default)){ assert(s_d.includes(`M ${a_n_p.join(' ')} L ${a_n_q.join(' ')}`), `crop mark ${a_n_p}`); }
        assert(f_s_line__sheet({ ...o_setting__default, b_print_guide: false }, s_sheet).startsWith('<g class="cut" transform="translate(10 10)"><path id="'), 'without guides');
    }
});

Deno.test('a page of the print as a file: the sheet in pixels, white, with what the print shows by the settings', function(){
    let o_picture = { ...f_o_picture__fitted(f_o_picture(3000, 2000), f_a_n__bleed(o_setting__default), true), s_file: 'a' };
    let o_setting = { ...o_setting__default, a_o_picture__front: [o_picture] };
    let s_picture = f_s_picture__sheet(o_setting, 'front', { a: 'data:a' });
    let s_head = '<svg xmlns="http://www.w3.org/2000/svg" width="3508" height="2480" viewBox="0 0 297 210" preserveAspectRatio="none"><rect width="297" height="210" fill="#ffffff"/><g transform="translate(0 0)">';
    let f_s = function(o_more, s_sheet = 'front', o_s_href = { a: 'data:a' }){ return f_s_svg__page({ ...o_setting, ...o_more }, s_sheet, o_s_href, 300 / 25.4); };
    // the pictures: the picture and the guides, no cut line on it
    assert(f_s({}) === `${s_head}${s_picture}${f_s_line__sheet(o_setting, 'front', false)}</g></svg>`, f_s({}).slice(0, 300));
    assert(f_s({}).includes('<image id="front_file_a" href="data:a"') && f_s({}).includes('<use href="#front_file_a"/>') && f_s({}).includes('class="guide"') && !f_s({}).includes('class="cut"'), 'the pictures');
    // with cut lines, and the lines alone
    assert(f_s({ s_print: 'both' }) === `${s_head}${s_picture}${f_s_line__sheet(o_setting, 'front')}</g></svg>`, 'pictures with cut lines');
    assert(f_s({ s_print: 'cut' }) === `${s_head}${f_s_line__sheet(o_setting, 'front')}</g></svg>` && !f_s({ s_print: 'cut' }).includes('<image'), 'cut lines only');
    // a sheet without a picture, or without its file, shows its cut lines whatever is chosen
    for(let s_print of ['picture', 'both', 'cut']){
        assert(f_s({ s_print }, 'back') === `${s_head}${f_s_line__sheet(o_setting, 'back')}</g></svg>`, `the back, ${s_print}`);
        assert(f_s({ s_print }, 'front', {}) === `${s_head}${f_s_line__sheet(o_setting, 'front')}</g></svg>`, `no file, ${s_print}`);
    }
    assert(!f_s({ b_print_guide: false }).includes('class="guide"') && f_s({ b_print_guide: false }).endsWith('</svg></g></g></g></g></svg>'), 'without guides the picture alone');
    // the shift: to the right and up, as the print's
    assert(f_s({ n_mm__print_x: 1.5, n_mm__print_y: 2.5 }).includes('fill="#ffffff"/><g transform="translate(1.5 -2.5)"><clipPath'), 'shifted');
    // another sheet, coarser
    assert(f_s_svg__page(o_setting__upright, 'front', {}, 4).startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="840" height="1188" viewBox="0 0 210 297" preserveAspectRatio="none"><rect width="210" height="297" fill="#ffffff"/>'), 'A4 standing at 4 pixels a mm');
    assert(!/NaN|undefined|Infinity/.test(f_s({ s_print: 'both' })), 'a number is missing');
});
