// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The sheets the app opens with: a small forest drawn here, so that the preview shows
// something before a picture is loaded. Each is an SVG 120 x 156, black on nothing,
// as a loaded file would be.

// The same numbers on every start: the forest does not change between two visits.
let f_f_n__random = function(n_seed){
    return function(){
        n_seed = (n_seed * 16807) % 2147483647;
        return n_seed / 2147483647;
    };
};

let f_s = function(n){ return String(Math.round(n * 100) / 100); };

// A bare tree: a trunk that forks n_depth times, each branch a tapered bar with a round
// end. No twig thinner than 0.5, which a 0.4 nozzle still prints.
let f_s_svg__tree = function(f_n_random, n_x, n_y, n_angle, n_len, n_width, n_depth){
    let a_s = [];
    let f_branch = function(n_x, n_y, n_angle, n_len, n_width, n_depth){
        let n_x2 = n_x + Math.cos(n_angle) * n_len, n_y2 = n_y + Math.sin(n_angle) * n_len;
        let n_width2 = Math.max(n_width * 0.7, 0.5);
        let n_nx = -Math.sin(n_angle) / 2, n_ny = Math.cos(n_angle) / 2;
        a_s.push(`<polygon points="${f_s(n_x - n_nx * n_width)},${f_s(n_y - n_ny * n_width)} ${f_s(n_x + n_nx * n_width)},${f_s(n_y + n_ny * n_width)} `
            + `${f_s(n_x2 + n_nx * n_width2)},${f_s(n_y2 + n_ny * n_width2)} ${f_s(n_x2 - n_nx * n_width2)},${f_s(n_y2 - n_ny * n_width2)}"/>`
            + `<circle cx="${f_s(n_x2)}" cy="${f_s(n_y2)}" r="${f_s(n_width2 / 2)}"/>`);
        if(n_depth <= 0){ return; }
        let a_n_turn = [-0.25 - 0.35 * f_n_random(), 0.25 + 0.35 * f_n_random()];
        if(f_n_random() < 0.35){ a_n_turn.push(0.3 * (f_n_random() - 0.5)); }
        for(let n_turn of a_n_turn){
            // every branch leans a little back to upright
            let n_angle2 = (n_angle + n_turn) * 0.88 - Math.PI / 2 * 0.12;
            f_branch(n_x2, n_y2, n_angle2, n_len * (0.64 + 0.18 * f_n_random()), n_width2, n_depth - 1);
        }
    };
    f_branch(n_x, n_y, n_angle, n_len, n_width, n_depth);
    return a_s.join('');
};

let f_s_svg = function(s_content){
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 156" width="120" height="156">${s_content}</svg>`;
};

// From the front to the back: s_mode solid keeps the picture, cut cuts it out of the sheet.
let f_a_o_sheet__demo = function(){
    let f_n_random = f_f_n__random(7);
    let n_up = -Math.PI / 2;
    let a_s_star = [];
    while(a_s_star.length < 18){
        let n_x = 10 + 100 * f_n_random(), n_y = 10 + 62 * f_n_random();
        if(Math.hypot(n_x - 80, n_y - 36) > 17){ a_s_star.push(`<circle cx="${f_s(n_x)}" cy="${f_s(n_y)}" r="${f_s(0.5 + 0.5 * f_n_random())}"/>`); }
    }
    return [
        { s_name: 'trees', s_mode: 'solid', s_svg: f_s_svg('<path d="M0 156L0 144Q30 137 60 142T120 140L120 156Z"/>'
            + f_s_svg__tree(f_n_random, 13, 147, n_up + 0.1, 36, 7, 7)
            + f_s_svg__tree(f_n_random, 107, 145, n_up - 0.12, 32, 6, 7)) },
        { s_name: 'grove', s_mode: 'solid', s_svg: f_s_svg('<path d="M0 156L0 131Q40 119 75 127T120 125L120 156Z"/>'
            + f_s_svg__tree(f_n_random, 31, 128, n_up + 0.05, 22, 3.2, 6)
            + f_s_svg__tree(f_n_random, 60, 126, n_up - 0.04, 25, 3.4, 6)
            + f_s_svg__tree(f_n_random, 90, 128, n_up + 0.08, 20, 3, 6)) },
        { s_name: 'far trees', s_mode: 'solid', s_svg: f_s_svg('<path d="M0 156L0 113Q35 105 70 111T120 105L120 156Z"/>'
            + [18, 43, 68, 97].map(function(n_x, n_idx){
                return f_s_svg__tree(f_n_random, n_x, 111 - (n_idx % 2) * 2, n_up + 0.1 * (f_n_random() - 0.5), 13 + 3 * f_n_random(), 1.9, 5);
            }).join('')) },
        { s_name: 'mountains', s_mode: 'solid', s_svg: f_s_svg('<polygon points="0,156 0,93 14,79 26,88 44,62 58,83 70,73 86,91 100,70 120,87 120,156"/>') },
        { s_name: 'moon and stars', s_mode: 'cut', s_svg: f_s_svg('<circle cx="80" cy="36" r="12"/>' + a_s_star.join('')) },
        { s_name: 'paper', s_mode: 'cut', s_svg: '' }
    ];
};

export { f_a_o_sheet__demo };
