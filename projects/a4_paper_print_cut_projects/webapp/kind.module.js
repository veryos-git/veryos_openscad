// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The kinds of pattern a project can be. A kind is a module of its own that knows its
// pattern and nothing of the sheet of paper, the pictures and the page. Its o_kind:
//   s_kind                 its name in a project's settings
//   s_name, s_noun         its name on the page and in a sentence
//   s_about                what it is, in a line
//   a_o_sheet              the sheets of paper it is made of, each { s_sheet, s_name }:
//                          'front' alone, or 'front' and 'back'
//   o_setting__default     its own settings; a project's settings are what every project
//                          has, see sheet.module.js, and these
//   f_a_n__size            its box in mm, width and height; its lines and the pictures'
//                          places are in mm from the box's top left corner
//   f_a_o_line             the lines of a sheet's cutting file, kind by kind in the
//                          file's order: s_name, s_colour, the paths a_a_o_seg of
//                          path.module.js, b_closed where a path ends where it starts
//   f_s_desc               what a sheet's cutting file says about its lines
//   f_a_s_problem          what is wrong with it and its pictures, in words
//   f_a_a_n__anchor        the places a picture's point snaps to in a match, beside the
//                          box's corners and middle
//   f_a_a_n__spot          where pictures loaded together come to lie, a box each, left,
//                          top, right, bottom; null: spread over the box
//   f_s_file               how its files' names start
//   f_s_summary            a saved project of it in a few words
// A new kind: its module, its part of the page as calendar.page.module.js is one, and a
// line here and in page.module.js.

import { o_kind as o_kind__calendar } from './calendar.module.js';
import { o_kind as o_kind__flextangle } from './flextangle.module.js';

let a_o_kind = [o_kind__calendar, o_kind__flextangle];
// A kind by its name. Settings kept before there were kinds name none: a calendar.
let f_o_kind = function(s_kind){
    return a_o_kind.find(function(o_kind){ return o_kind.s_kind === s_kind; }) ?? o_kind__calendar;
};

export { a_o_kind, f_o_kind };
