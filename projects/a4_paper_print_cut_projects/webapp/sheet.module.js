// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The sheet of paper a pattern is printed on and then cut from: where the pattern lies
// on it, the cutting file, what a print shows, and what is wrong with the place. The
// pattern itself is one of the kinds of kind.module.js; a kind draws its lines in mm
// from the top left corner of its own box, called the pattern's mm here.
//
// Print and cut meet only if both put the pattern at the same place of the sheet. The
// place is given the way a cutter's software takes it, from the sheet's bottom left
// corner; a sheet is drawn the way a page is, in mm from its top left corner, y down.

import { f_o_line, f_a_n__start, f_a_n__end, f_s_n, f_s_d, f_a_n__box } from './path.module.js';
import { f_s_picture } from './picture.module.js';
import { f_o_kind } from './kind.module.js';

// What every project has, whatever its kind; the kind's own settings come to these.
let o_setting__default = {
    // which of the kinds of kind.module.js the pattern is
    s_kind: 'calendar',
    // the sheet of paper a sheet of the pattern is printed on and cut from, A4 lying
    n_mm__sheet_x: 297,
    n_mm__sheet_y: 210,
    // the border of it a printer leaves blank
    n_mm__printer_margin: 5,
    // where the pattern lies on the sheet, measured from the sheet's bottom left corner
    n_mm__left: 10,
    n_mm__bottom: 10,
    // a dot, a tiny cut, in each corner of the sheet of paper: with them a cutting file
    // is the sheet's size, and is laid on the sheet corner on corner in a cutter's software
    b_sheet_dot: true,
    // how wide the cutting files' lines are drawn
    n_mm__line: 0.2,
    // a sheet's pictures, see picture.module.js, the last one on top
    a_o_picture__front: [],
    a_o_picture__back: [],
    // what a print shows where a sheet has a picture: 'picture', 'both' with the cut
    // lines on it, 'cut' the lines alone; a sheet without one shows its cut lines
    s_print: 'picture',
    // how far the picture is printed beyond the pattern's box
    n_mm__bleed: 2,
    // guides outside the pattern: crop marks and a line of a known length
    b_print_guide: true,
    // moves the print on its page, to the right and up
    n_mm__print_x: 0,
    n_mm__print_y: 0
};
// The settings of a new project of a kind.
let f_o_setting__default = function(s_kind){
    let o_kind = f_o_kind(s_kind);
    return { ...structuredClone(o_setting__default), ...structuredClone(o_kind.o_setting__default), s_kind: o_kind.s_kind };
};

let a_s_edge = ['left', 'bottom', 'right', 'top'];
// How far a dot in a corner of the sheet runs along x and along y, into the sheet.
let n_mm__sheet_dot = 0.2;
// The print's guides are lines this wide.
let n_mm__guide = 0.2;
// Crop marks: this long, and this far outside the picture's bleed.
let n_mm__crop = 5;
let n_mm__crop_gap = 1;
// The ruler line under the pattern: this far in from the box's corners and below the bleed.
let n_mm__ruler_in = 10;
let n_mm__ruler_below = 2;

// The pattern's box: its width and height.
let f_a_n__size__pattern = function(o_setting){
    return f_o_kind(o_setting.s_kind).f_a_n__size(o_setting);
};
// The sheet of paper the pattern lies on, in the pattern's mm: left, top, right, bottom.
// The pattern's place is set from the sheet's bottom left corner.
let f_a_n__sheet = function(o_setting){
    let n_top = o_setting.n_mm__bottom + f_a_n__size__pattern(o_setting)[1] - o_setting.n_mm__sheet_y;
    return [-o_setting.n_mm__left, n_top, o_setting.n_mm__sheet_x - o_setting.n_mm__left, n_top + o_setting.n_mm__sheet_y];
};
// The top left corner of the pattern's box on the sheet.
let f_a_n__pattern = function(o_setting){
    let [n_left, n_top] = f_a_n__sheet(o_setting);
    return [-n_left, -n_top];
};
// How far a box of the pattern lies from the sheet's edges: left, bottom, right, top.
// The box is left, top, right, bottom in the pattern's mm; by default the pattern's own.
let f_a_n__distance = function(o_setting, a_n__box = [0, 0, ...f_a_n__size__pattern(o_setting)]){
    let [n_x, n_y] = f_a_n__pattern(o_setting);
    return [n_x + a_n__box[0], o_setting.n_mm__sheet_y - n_y - a_n__box[3], o_setting.n_mm__sheet_x - n_x - a_n__box[2], n_y + a_n__box[1]];
};
// The pattern's box with the picture's bleed around it, in the pattern's mm: left, top, right, bottom.
let f_a_n__bleed = function(o_setting){
    let [n_x, n_y] = f_a_n__size__pattern(o_setting);
    return [-o_setting.n_mm__bleed, -o_setting.n_mm__bleed, n_x + o_setting.n_mm__bleed, n_y + o_setting.n_mm__bleed];
};

// The lines of one sheet's cutting file, s_sheet 'front' or 'back', kind by kind in the
// file's order: s_name, s_colour and the paths a_a_o_seg; b_closed where a path ends
// where it starts. In the pattern's mm. First the sheet's dots, then the kind's lines.
let f_a_o_line = function(o_setting, s_sheet){
    let a_o_line = [];
    // the sheet's dots: from each of its corners a slanted cut into the sheet, so that
    // the box around the file's lines is the sheet and nothing beyond it
    if(o_setting.b_sheet_dot){
        let [n_left, n_top, n_right, n_bottom] = f_a_n__sheet(o_setting);
        a_o_line.push({ s_name: 'sheet', s_colour: '#008000', a_a_o_seg: [[n_left, n_top, 1, 1], [n_right, n_top, -1, 1], [n_right, n_bottom, -1, -1], [n_left, n_bottom, 1, -1]].map(function([n_x__corner, n_y__corner, n_x__in, n_y__in]){
            return [f_o_line([n_x__corner, n_y__corner], [n_x__corner + n_x__in * n_mm__sheet_dot, n_y__corner + n_y__in * n_mm__sheet_dot])];
        }) });
    }
    return a_o_line.concat(f_o_kind(o_setting.s_kind).f_a_o_line(o_setting, s_sheet));
};
// The same as SVG paths, moved by a_n__move. Every path says itself that it is a line
// and no area: not every cutter's software reads that from a group around it.
let f_a_s_path = function(o_setting, s_sheet, a_n__move = [0, 0]){
    return f_a_o_line(o_setting, s_sheet).map(function(o_line){
        let s_d = o_line.a_a_o_seg.map(function(a_o_seg){ return f_s_d(a_o_seg, a_n__move); }).join(' ') + (o_line.b_closed ? ' Z' : '');
        return `<path id="${s_sheet}_${o_line.s_name}" fill="none" stroke="${o_line.s_colour}" stroke-width="${f_s_n(o_setting.n_mm__line)}" d="${s_d}"/>`;
    });
};
// The box around all that a sheet's cutting file holds, in the pattern's mm: left, top,
// right, bottom; null for a file without a line. With the sheet's dots it is the sheet
// of paper. A cutter's software places a file by this box.
let f_a_n__box__file = function(o_setting, s_sheet){
    return f_a_n__box(f_a_o_line(o_setting, s_sheet).flatMap(function(o_line){
        return o_line.b_closed ? o_line.a_a_o_seg.map(function(a_o_seg){ return [...a_o_seg, f_o_line(f_a_n__end(a_o_seg), f_a_n__start(a_o_seg))]; }) : o_line.a_a_o_seg;
    }));
};
// One sheet's cutting file: an SVG in mm. With the sheet's dots it is the sheet of
// paper, the pattern at its place on it; without them the pattern's box alone.
let f_s_svg = function(o_setting, s_sheet){
    let o_kind = f_o_kind(o_setting.s_kind);
    let [n_left, n_top] = f_a_n__sheet(o_setting);
    let [n_x, n_y] = o_setting.b_sheet_dot ? [o_setting.n_mm__sheet_x, o_setting.n_mm__sheet_y] : f_a_n__size__pattern(o_setting);
    let s_setting = JSON.stringify(o_setting).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<svg xmlns="http://www.w3.org/2000/svg" width="${f_s_n(n_x)}mm" height="${f_s_n(n_y)}mm" viewBox="0 0 ${f_s_n(n_x)} ${f_s_n(n_y)}">`,
        `<title>VeryOS ${o_kind.s_name.toLowerCase()}${o_kind.a_o_sheet.length > 1 ? `, ${s_sheet}` : ''}</title>`,
        `<desc>${o_kind.f_s_desc(s_sheet)} Green: a dot in each corner of the sheet of paper; with them this file is the sheet's size. Settings: ${s_setting}</desc>`,
        ...f_a_s_path(o_setting, s_sheet, o_setting.b_sheet_dot ? [-n_left, -n_top] : [0, 0]),
        '</svg>', ''
    ].join('\n');
};

// Crop marks in the sheet's mm, each a line [[x, y], [x, y]]: at every corner of the
// pattern's box two that lie on its edges' lines, outside the bleed, so that they are
// cut off with the rest of the sheet.
let f_a_a_a_n__crop = function(o_setting){
    let [n_x, n_y] = f_a_n__pattern(o_setting);
    let [n_x__size, n_y__size] = f_a_n__size__pattern(o_setting);
    let n_from = o_setting.n_mm__bleed + n_mm__crop_gap;
    return [[0, 0], [1, 0], [1, 1], [0, 1]].flatMap(function([n_right, n_down]){
        let n_x__corner = n_x + n_right * n_x__size;
        let n_y__corner = n_y + n_down * n_y__size;
        let n_x__out = n_right ? 1 : -1;
        let n_y__out = n_down ? 1 : -1;
        return [
            [[n_x__corner + n_x__out * n_from, n_y__corner], [n_x__corner + n_x__out * (n_from + n_mm__crop), n_y__corner]],
            [[n_x__corner, n_y__corner + n_y__out * n_from], [n_x__corner, n_y__corner + n_y__out * (n_from + n_mm__crop)]]
        ];
    });
};
// The ruler line: n_mm long from a_n to the right, under the pattern; a ruler laid on
// the print shows whether the printer kept the size. The longest round length that
// leaves the corners' crop marks alone.
let f_o_ruler = function(o_setting){
    let [n_x, n_y] = f_a_n__pattern(o_setting);
    let [n_x__size, n_y__size] = f_a_n__size__pattern(o_setting);
    return {
        n_mm: [200, 100, 50, 20].find(function(n_mm){ return n_mm <= n_x__size - 2 * n_mm__ruler_in; }),
        a_n: [n_x + n_mm__ruler_in, n_y + n_y__size + o_setting.n_mm__bleed + n_mm__ruler_below]
    };
};

// What is wrong, in words: with the pattern's place on the sheet, then what its kind
// finds wrong with the pattern and its pictures.
let f_a_s_problem = function(o_setting){
    let o_kind = f_o_kind(o_setting.s_kind);
    let a_s_problem = [];
    let a_n = f_a_n__distance(o_setting);
    let a_s_edge__over = a_s_edge.filter(function(s_edge, n_idx){ return a_n[n_idx] < 0; });
    let a_s_edge__margin = a_s_edge.filter(function(s_edge, n_idx){ return a_n[n_idx] >= 0 && a_n[n_idx] < o_setting.n_mm__printer_margin; });
    if(a_s_edge__over.length){ a_s_problem.push(`The ${o_kind.s_noun} reaches over the sheet's edge: ${a_s_edge__over.join(', ')}`); }
    if(a_s_edge__margin.length){ a_s_problem.push(`The ${o_kind.s_noun} lies in the printer's margin, where a print stays blank: ${a_s_edge__margin.join(', ')}`); }
    return a_s_problem.concat(o_kind.f_a_s_problem(o_setting));
};

// The places of the cut pattern a clicked point snaps to in a match, in the pattern's
// mm: the corners and the middle of its box, and those its kind names.
let f_a_a_n__anchor = function(o_setting){
    let [n_x, n_y] = f_a_n__size__pattern(o_setting);
    return [[0, 0], [n_x, 0], [n_x, n_y], [0, n_y], [n_x / 2, n_y / 2]].concat(f_o_kind(o_setting.s_kind).f_a_a_n__anchor(o_setting));
};
// Where n_picture pictures loaded together come to lie, a box each, left, top, right,
// bottom in the pattern's mm: the places its kind names, the first for the first
// picture, around again if there are more pictures than places; a kind that names none:
// the cells of a grid over the pattern's box, row by row, about as wide as high.
let f_a_a_n__spot = function(o_setting, n_picture){
    let a_a_n = f_o_kind(o_setting.s_kind).f_a_a_n__spot?.(o_setting) ?? [];
    if(a_a_n.length){
        return Array.from({ length: n_picture }, function(_, n_idx){ return a_a_n[n_idx % a_a_n.length]; });
    }
    let [n_x, n_y] = f_a_n__size__pattern(o_setting);
    let n_column = Math.min(n_picture, Math.max(1, Math.round(Math.sqrt(n_picture * n_x / n_y))));
    let n_row = Math.ceil(n_picture / n_column);
    return Array.from({ length: n_picture }, function(_, n_idx){
        let n_idx__column = n_idx % n_column;
        let n_idx__row = Math.floor(n_idx / n_column);
        return [n_idx__column * n_x / n_column, n_idx__row * n_y / n_row, (n_idx__column + 1) * n_x / n_column, (n_idx__row + 1) * n_y / n_row];
    });
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
    let [n_x, n_y] = f_a_n__pattern(o_setting);
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
// its length and, where the pattern has two sheets, the sheet's name written beside
// it, and the cutting file's lines at the pattern's place; without b_cut the guides alone.
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
        s_guide = `<g class="guide"><path fill="none" stroke="#000000" stroke-width="${n_mm__guide}" d="${a_a_a_n.map(function(a_a_n){ return `M ${f_s_xy(a_a_n[0])} L ${f_s_xy(a_a_n[1])}`; }).join(' ')}"/>`
            + `<text x="${f_s_n(n_x + o_ruler.n_mm + 2)}" y="${f_s_n(n_y + 1)}" font-family="sans-serif" font-size="3" fill="#000000">${o_ruler.n_mm} mm${f_o_kind(o_setting.s_kind).a_o_sheet.length > 1 ? `, ${s_sheet}` : ''}</text></g>`;
    }
    return s_guide + (b_cut ? `<g class="cut" transform="translate(${f_s_xy(f_a_n__pattern(o_setting))})">${f_a_s_path(o_setting, s_sheet).join('')}</g>` : '');
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
    o_setting__default, f_o_setting__default, n_mm__crop, n_mm__crop_gap,
    f_a_n__size__pattern, f_a_n__sheet, f_a_n__pattern, f_a_n__distance, f_a_n__bleed,
    f_a_o_line, f_a_s_path, f_a_n__box__file, f_s_svg, f_a_a_a_n__crop, f_o_ruler,
    f_a_s_problem, f_a_a_n__anchor, f_a_a_n__spot, f_s_picture__sheet, f_s_line__sheet, f_s_svg__page
};
