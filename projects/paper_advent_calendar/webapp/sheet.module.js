// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The sheet of paper a sheet of the calendar is printed on and then cut from: where the
// calendar lies on it, what a print shows, and what is wrong with the place.
//
// Print and cut meet only if both put the calendar at the same place of the sheet. The
// place is given the way a cutter's software takes it, from the sheet's bottom left
// corner; a sheet is drawn the way a page is, in mm from its top left corner, y down.

import { n_mm__line, f_s_n, f_a_n__sheet, f_a_s_path, f_a_o_window } from './calendar.module.js';
import { f_f_b__in, f_b_covered, f_s_picture } from './picture.module.js';

let a_s_edge = ['left', 'bottom', 'right', 'top'];
// Crop marks: this long, and this far outside the picture's bleed.
let n_mm__crop = 5;
let n_mm__crop_gap = 1;
// The ruler line under the calendar: this far in from the calendar's corners and below the bleed.
let n_mm__ruler_in = 10;
let n_mm__ruler_below = 2;
// Whether several pictures cover a box between them is looked up at points this far apart at most.
let n_mm__grid = 2;

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

// Whether pictures cover a box of the calendar, left, top, right, bottom: one of them
// alone, or between them every point of a grid over the box.
let f_b_covered__together = function(a_o_picture, a_n__box){
    if(a_o_picture.some(function(o_picture){ return f_b_covered(o_picture, a_n__box); })){ return true; }
    if(a_o_picture.length < 2){ return false; }
    let a_f_b__in = a_o_picture.map(f_f_b__in);
    let n_x = Math.ceil((a_n__box[2] - a_n__box[0]) / n_mm__grid);
    let n_y = Math.ceil((a_n__box[3] - a_n__box[1]) / n_mm__grid);
    for(let n_idx__y = 0; n_idx__y <= n_y; n_idx__y++){
        for(let n_idx__x = 0; n_idx__x <= n_x; n_idx__x++){
            let a_n = [a_n__box[0] + (a_n__box[2] - a_n__box[0]) * n_idx__x / n_x, a_n__box[1] + (a_n__box[3] - a_n__box[1]) * n_idx__y / n_y];
            if(!a_f_b__in.some(function(f_b__in){ return f_b__in(a_n); })){ return false; }
        }
    }
    return true;
};

// What is wrong with the calendar's place on the sheet and with the pictures, in words.
// The front's pictures are the calendar's face: they have to cover it and its bleed.
// Of the back only what the windows show is seen: its pictures have to cover those.
let f_a_s_problem__sheet = function(o_setting){
    let a_s_problem = [];
    let a_n = f_a_n__distance(o_setting);
    let a_s_edge__over = a_s_edge.filter(function(s_edge, n_idx){ return a_n[n_idx] < 0; });
    let a_s_edge__margin = a_s_edge.filter(function(s_edge, n_idx){ return a_n[n_idx] >= 0 && a_n[n_idx] < o_setting.n_mm__printer_margin; });
    if(a_s_edge__over.length){ a_s_problem.push(`The calendar reaches over the sheet's edge: ${a_s_edge__over.join(', ')}`); }
    if(a_s_edge__margin.length){ a_s_problem.push(`The calendar lies in the printer's margin, where a print stays blank: ${a_s_edge__margin.join(', ')}`); }
    if(o_setting.a_o_picture__back.length && o_setting.b_mark){ a_s_problem.push('The marks on the back are cut into its picture: leave them out, under Cuts'); }
    let a_o_picture = o_setting.a_o_picture__front;
    if(a_o_picture.length){
        let s_picture = a_o_picture.length === 1 ? 'picture' : 'pictures';
        if(!f_b_covered__together(a_o_picture, [0, 0, o_setting.n_mm__calendar_x, o_setting.n_mm__calendar_y])){
            a_s_problem.push(`The front ${s_picture} ${a_o_picture.length === 1 ? 'leaves' : 'leave'} a part of the calendar blank`);
        } else if(!f_b_covered__together(a_o_picture, f_a_n__bleed(o_setting))){
            a_s_problem.push(`The front ${s_picture} ${a_o_picture.length === 1 ? 'does' : 'do'} not reach ${o_setting.n_mm__bleed} mm over the calendar's edge all around: a cut beside the edge shows white`);
        }
    }
    a_o_picture = o_setting.a_o_picture__back;
    if(a_o_picture.length){
        // the windows whose box the back's pictures do not cover, by their numbers
        let a_n = f_a_o_window(o_setting).map(function(o_window, n_idx){
            let a_n__box = [o_window.n_mm__x - o_window.n_mm__size_x / 2, o_window.n_mm__y - o_window.n_mm__size_y / 2, o_window.n_mm__x + o_window.n_mm__size_x / 2, o_window.n_mm__y + o_window.n_mm__size_y / 2];
            return f_b_covered__together(a_o_picture, a_n__box) ? 0 : n_idx + 1;
        }).filter(Boolean);
        if(a_n.length){
            a_s_problem.push(`The back ${a_o_picture.length === 1 ? 'picture leaves' : 'pictures leave'} ${a_n.length === 1 ? 'window' : 'windows'} ${a_n.slice(0, 6).join(', ')}${a_n.length > 6 ? ` and ${a_n.length - 6} more` : ''} blank in part`);
        }
    }
    return a_s_problem;
};

// A sheet's pictures as SVG in the sheet's mm, one over the other in their order, cut
// off beyond the bleed. o_s_href: the files' addresses by the files' names; a picture
// whose file has none is left out. Every file stands once, whatever number of pictures
// show it. n_idx__only: that picture of the sheet alone. Empty without a picture.
let f_s_picture__sheet = function(o_setting, s_sheet, o_s_href, n_idx__only = null){
    let a_o_picture = o_setting[`a_o_picture__${s_sheet}`].filter(function(o_picture, n_idx){
        return o_s_href[o_picture.s_file] && (n_idx__only === null || n_idx === n_idx__only);
    });
    if(!a_o_picture.length){ return ''; }
    let [n_x, n_y] = f_a_n__calendar(o_setting);
    let [n_left, n_top, n_right, n_bottom] = f_a_n__bleed(o_setting);
    let a_o_picture__file = a_o_picture.filter(function(o_picture, n_idx){
        return a_o_picture.findIndex(function(o_other){ return o_other.s_file === o_picture.s_file; }) === n_idx;
    });
    return `<clipPath id="${s_sheet}_clip"><rect x="${f_s_n(n_x + n_left)}" y="${f_s_n(n_y + n_top)}" width="${f_s_n(n_right - n_left)}" height="${f_s_n(n_bottom - n_top)}"/></clipPath>`
        + `<defs>${a_o_picture__file.map(function(o_picture){ return `<image id="${s_sheet}_file_${o_picture.s_file}" href="${o_s_href[o_picture.s_file]}" width="${o_picture.n_px__x}" height="${o_picture.n_px__y}"/>`; }).join('')}</defs>`
        + `<g clip-path="url(#${s_sheet}_clip)"><g transform="translate(${f_s_n(n_x)} ${f_s_n(n_y)})">`
        + `${a_o_picture.map(function(o_picture){ return f_s_picture(o_picture, `#${s_sheet}_file_${o_picture.s_file}`, true); }).join('')}</g></g>`;
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
// is. o_s_href: the pictures' files as addresses that hold them, by the files' names.
let f_s_svg__page = function(o_setting, s_sheet, o_s_href, n_px__per_mm){
    let s_picture = f_s_picture__sheet(o_setting, s_sheet, o_s_href);
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
