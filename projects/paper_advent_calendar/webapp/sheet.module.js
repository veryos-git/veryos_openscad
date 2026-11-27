// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The sheet of paper a sheet of the calendar is printed on and then cut from: where the
// calendar lies on it, what a print shows, and what is wrong with the place.
//
// Print and cut meet only if both put the calendar at the same place of the sheet. The
// place is given the way a cutter's software takes it, from the sheet's bottom left
// corner; a sheet is drawn the way a page is, in mm from its top left corner, y down.

import { n_mm__line, f_s_n, f_a_n__sheet, f_a_s_path } from './calendar.module.js';
import { f_b_covered, f_s_picture } from './picture.module.js';

let a_s_edge = ['left', 'bottom', 'right', 'top'];
// Crop marks: this long, and this far outside the picture's bleed.
let n_mm__crop = 5;
let n_mm__crop_gap = 1;
// The ruler line under the calendar: this far in from the calendar's corners and below the bleed.
let n_mm__ruler_in = 10;
let n_mm__ruler_below = 2;

// The calendar's top left corner on the sheet.
let f_a_n__calendar = function(o_setting){
    let [n_left, n_top] = f_a_n__sheet(o_setting);
    return [-n_left, -n_top];
};
// How far a box of the calendar lies from the sheet's edges: left, bottom, right, top.
// The box is left, top, right, bottom in the calendar's mm; by default the calendar.
let f_a_n__distance = function(o_setting, a_n__box = [0, 0, o_setting.n_mm__calendar_x, o_setting.n_mm__calendar_y]){
    let [n_x, n_y] = f_a_n__calendar(o_setting);
    return [n_x + a_n__box[0], o_setting.n_mm__sheet_y - n_y - a_n__box[3], o_setting.n_mm__sheet_x - n_x - a_n__box[2], n_y + a_n__box[1]];
};
// The calendar with the picture's bleed around it, in the calendar's mm: left, top, right, bottom.
let f_a_n__bleed = function(o_setting){
    return [-o_setting.n_mm__bleed, -o_setting.n_mm__bleed, o_setting.n_mm__calendar_x + o_setting.n_mm__bleed, o_setting.n_mm__calendar_y + o_setting.n_mm__bleed];
};

// Crop marks in the sheet's mm, each a line [[x, y], [x, y]]: at every corner of the
// calendar two that lie on its edges' lines, outside the bleed, so that they are cut
// off with the rest of the sheet.
let f_a_a_a_n__crop = function(o_setting){
    let [n_x, n_y] = f_a_n__calendar(o_setting);
    let n_from = o_setting.n_mm__bleed + n_mm__crop_gap;
    return [[0, 0], [1, 0], [1, 1], [0, 1]].flatMap(function([n_right, n_down]){
        let n_x__corner = n_x + n_right * o_setting.n_mm__calendar_x;
        let n_y__corner = n_y + n_down * o_setting.n_mm__calendar_y;
        let n_x__out = n_right ? 1 : -1;
        let n_y__out = n_down ? 1 : -1;
        return [
            [[n_x__corner + n_x__out * n_from, n_y__corner], [n_x__corner + n_x__out * (n_from + n_mm__crop), n_y__corner]],
            [[n_x__corner, n_y__corner + n_y__out * n_from], [n_x__corner, n_y__corner + n_y__out * (n_from + n_mm__crop)]]
        ];
    });
};
// The ruler line: n_mm long from a_n to the right, under the calendar; a ruler laid on
// the print shows whether the printer kept the size. The longest round length that
// leaves the corners' crop marks alone.
let f_o_ruler = function(o_setting){
    let [n_x, n_y] = f_a_n__calendar(o_setting);
    return {
        n_mm: [200, 100, 50, 20].find(function(n_mm){ return n_mm <= o_setting.n_mm__calendar_x - 2 * n_mm__ruler_in; }),
        a_n: [n_x + n_mm__ruler_in, n_y + o_setting.n_mm__calendar_y + o_setting.n_mm__bleed + n_mm__ruler_below]
    };
};

// What is wrong with the calendar's place on the sheet and with the pictures, in words.
let f_a_s_problem__sheet = function(o_setting){
    let a_s_problem = [];
    let a_n = f_a_n__distance(o_setting);
    let a_s_edge__over = a_s_edge.filter(function(s_edge, n_idx){ return a_n[n_idx] < 0; });
    let a_s_edge__margin = a_s_edge.filter(function(s_edge, n_idx){ return a_n[n_idx] >= 0 && a_n[n_idx] < o_setting.n_mm__printer_margin; });
    if(a_s_edge__over.length){ a_s_problem.push(`The calendar reaches over the sheet's edge: ${a_s_edge__over.join(', ')}`); }
    if(a_s_edge__margin.length){ a_s_problem.push(`The calendar lies in the printer's margin, where a print stays blank: ${a_s_edge__margin.join(', ')}`); }
    if(o_setting.o_picture__back && o_setting.b_mark){ a_s_problem.push('The marks on the back are cut into its picture: leave them out, under Cuts'); }
    for(let s_sheet of ['front', 'back']){
        let o_picture = o_setting[`o_picture__${s_sheet}`];
        if(!o_picture){ continue; }
        if(!f_b_covered(o_picture, [0, 0, o_setting.n_mm__calendar_x, o_setting.n_mm__calendar_y])){
            a_s_problem.push(`The ${s_sheet} picture leaves a part of the calendar blank`);
        } else if(!f_b_covered(o_picture, f_a_n__bleed(o_setting))){
            a_s_problem.push(`The ${s_sheet} picture does not reach ${o_setting.n_mm__bleed} mm over the calendar's edge all around: a cut beside the edge shows white`);
        }
    }
    return a_s_problem;
};

// A sheet's picture as SVG in the sheet's mm, cut off beyond the bleed; s_href its
// file's address. Empty without a picture.
let f_s_picture__sheet = function(o_setting, s_sheet, s_href){
    let o_picture = o_setting[`o_picture__${s_sheet}`];
    if(!o_picture || !s_href){ return ''; }
    let [n_x, n_y] = f_a_n__calendar(o_setting);
    let [n_left, n_top, n_right, n_bottom] = f_a_n__bleed(o_setting);
    return `<clipPath id="${s_sheet}_clip"><rect x="${f_s_n(n_x + n_left)}" y="${f_s_n(n_y + n_top)}" width="${f_s_n(n_right - n_left)}" height="${f_s_n(n_bottom - n_top)}"/></clipPath>`
        + `<g clip-path="url(#${s_sheet}_clip)"><g transform="translate(${f_s_n(n_x)} ${f_s_n(n_y)})">${f_s_picture(o_picture, s_href)}</g></g>`;
};
// A sheet's lines as SVG in the sheet's mm: the guides, crop marks and ruler line with
// its length and the sheet's name written beside it, and the cutting file's lines at
// the calendar's place; without b_cut the guides alone.
let f_s_line__sheet = function(o_setting, s_sheet, b_cut = true){
    let f_s_xy = function(a_n){ return `${f_s_n(a_n[0])} ${f_s_n(a_n[1])}`; };
    let s_guide = '';
    if(o_setting.b_print_guide){
        let o_ruler = f_o_ruler(o_setting);
        let [n_x, n_y] = o_ruler.a_n;
        let a_a_a_n = [
            ...f_a_a_a_n__crop(o_setting),
            [[n_x, n_y], [n_x + o_ruler.n_mm, n_y]],
            [[n_x, n_y - 1], [n_x, n_y + 1]],
            [[n_x + o_ruler.n_mm, n_y - 1], [n_x + o_ruler.n_mm, n_y + 1]]
        ];
        s_guide = `<g class="guide"><path fill="none" stroke="#000000" stroke-width="${n_mm__line}" d="${a_a_a_n.map(function(a_a_n){ return `M ${f_s_xy(a_a_n[0])} L ${f_s_xy(a_a_n[1])}`; }).join(' ')}"/>`
            + `<text x="${f_s_n(n_x + o_ruler.n_mm + 2)}" y="${f_s_n(n_y + 1)}" font-family="sans-serif" font-size="3" fill="#000000">${o_ruler.n_mm} mm, ${s_sheet}</text></g>`;
    }
    return s_guide + (b_cut ? `<g class="cut" transform="translate(${f_s_xy(f_a_n__calendar(o_setting))})">${f_a_s_path(o_setting, s_sheet).join('')}</g>` : '');
};
// A sheet's page of the print as an SVG of its own, n_px__per_mm pixels a mm: the sheet
// of paper, white, with what a print shows of it by the settings, shifted as the print
// is. s_href: the picture's file as an address that holds it, '' without one.
let f_s_svg__page = function(o_setting, s_sheet, s_href, n_px__per_mm){
    let s_picture = f_s_picture__sheet(o_setting, s_sheet, s_href);
    // a sheet without a picture shows its cut lines whatever is chosen
    let b_cut = o_setting.s_print !== 'picture' || !s_picture;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(o_setting.n_mm__sheet_x * n_px__per_mm)}" height="${Math.round(o_setting.n_mm__sheet_y * n_px__per_mm)}"`
        + ` viewBox="0 0 ${o_setting.n_mm__sheet_x} ${o_setting.n_mm__sheet_y}" preserveAspectRatio="none">`
        + `<rect width="${o_setting.n_mm__sheet_x}" height="${o_setting.n_mm__sheet_y}" fill="#ffffff"/>`
        + `<g transform="translate(${f_s_n(o_setting.n_mm__print_x)} ${f_s_n(-o_setting.n_mm__print_y)})">`
        + `${o_setting.s_print === 'cut' ? '' : s_picture}${f_s_line__sheet(o_setting, s_sheet, b_cut)}</g></svg>`;
};

export {
    n_mm__crop, n_mm__crop_gap, f_a_n__calendar, f_a_n__distance, f_a_n__bleed, f_a_a_a_n__crop, f_o_ruler,
    f_a_s_problem__sheet, f_s_picture__sheet, f_s_line__sheet, f_s_svg__page
};
