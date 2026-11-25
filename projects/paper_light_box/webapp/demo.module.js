// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The sheets the app opens with: mountains in front of a low sun, drawn here, so that
// the preview shows something before a picture is loaded. Each is an SVG 120 x 156,
// black on nothing, as a loaded file would be. Kept simple: one outline per sheet.

let f_s = function(n){ return String(Math.round(n * 100) / 100); };

let f_s_svg = function(s_content){
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 156" width="120" height="156">${s_content}</svg>`;
};

// A fir: three tiers from its tip down to n_y__crown, each wider than the one above, on
// a trunk that goes on down to n_y__ground, into the hill it stands on.
let f_s_svg__fir = function(n_x, n_y__tip, n_y__crown, n_y__ground){
    let n_height = n_y__crown - n_y__tip;
    let n_trunk = Math.max(0.035 * n_height, 0.8);
    let a_a_n = [[0, n_y__tip]];
    for(let n_tier = 1; n_tier <= 3; n_tier++){
        let n_y = n_y__tip + n_height * n_tier / 3;
        let n_wide = 0.26 * n_height * (0.15 + 0.85 * n_tier / 3);
        a_a_n.push([n_wide, n_y], [n_tier < 3 ? n_wide * 0.5 : n_trunk, n_y]);
    }
    a_a_n.push([n_trunk, n_y__ground]);
    // the right half, and the same mirrored back up to the tip
    let a_a_n__left = a_a_n.slice(1).reverse().map(function([n_dx, n_y]){ return [-n_dx, n_y]; });
    return `<polygon points="${[...a_a_n, ...a_a_n__left].map(function([n_dx, n_y]){ return `${f_s(n_x + n_dx)},${f_s(n_y)}`; }).join(' ')}"/>`;
};

// From the front to the back: s_mode solid keeps the picture, cut cuts it out of the sheet.
let f_a_o_sheet__demo = function(){
    return [
        { s_name: 'firs', s_mode: 'solid', s_svg: f_s_svg('<path d="M0 156V137C22 133 40 143 62 141S100 130 120 134V156Z"/>'
            + f_s_svg__fir(19, 94, 131, 142) + f_s_svg__fir(35, 110, 134, 143) + f_s_svg__fir(99, 102, 129, 139)) },
        { s_name: 'hills', s_mode: 'solid', s_svg: f_s_svg('<path d="M0 156V118C18 112 34 124 56 123S96 110 120 116V156Z"/>') },
        { s_name: 'mesa', s_mode: 'solid', s_svg: f_s_svg('<polygon points="0,156 0,105 12,100 22,103 28,101 30,84 46,83 47,93 51,94 53,102 62,105 74,98 86,103 99,95 110,100 120,96 120,156"/>') },
        { s_name: 'mountains', s_mode: 'solid', s_svg: f_s_svg('<polygon points="0,156 0,80 9,70 17,76 33,44 43,58 51,51 66,77 77,69 93,38 105,56 112,50 120,59 120,156"/>') },
        { s_name: 'sun', s_mode: 'cut', s_svg: f_s_svg('<circle cx="65" cy="59" r="14"/>') },
        { s_name: 'paper', s_mode: 'cut', s_svg: '' }
    ];
};

export { f_a_o_sheet__demo };
