// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Where things are in the box, by the script's own rules, for the preview and the
// editor: the page does not ask OpenSCAD for every pixel it draws. The server's test
// holds these numbers against what the script echoes.
//   o_v: the script's settings by name; a_n_mm__thickness: the sheets, front to back.

let f_o_box = function(o_v, a_n_mm__thickness){
    let a_n_mm__slot = a_n_mm__thickness.map(function(n){ return Math.max(n + o_v.slot_clearance, o_v.slot_min); });
    // middle of each sheet behind the box's front face
    let a_n_mm__centre = [];
    a_n_mm__thickness.forEach(function(n, n_idx){
        a_n_mm__centre.push(n_idx === 0 ? o_v.front_lip + a_n_mm__slot[0] / 2
            : a_n_mm__centre[n_idx - 1] + a_n_mm__thickness[n_idx - 1] / 2 + o_v.sheet_distance + n / 2);
    });
    let n_cnt = a_n_mm__thickness.length;
    let b_board = o_v.light === 'board';
    let b_landscape = o_v.sheet_x > o_v.sheet_y;
    let a_n_mm__board = b_landscape ? [o_v.board_y, o_v.board_x] : [o_v.board_x, o_v.board_y];
    let n_mm__light = a_n_mm__centre[n_cnt - 1] + a_n_mm__thickness[n_cnt - 1] / 2 + o_v.light_distance;
    let n_mm__pocket_r = o_v.puck_d / 2 + o_v.puck_clearance;
    let n_mm__dome_r = o_v.puck_dome_d / 2, n_mm__dome_h = o_v.puck_height - o_v.puck_edge_height;
    let n_mm__dome_R = (n_mm__dome_r * n_mm__dome_r + n_mm__dome_h * n_mm__dome_h) / (2 * n_mm__dome_h);
    let n_mm__lens = Math.sqrt(n_mm__dome_R * n_mm__dome_R - o_v.contact_d * o_v.contact_d / 4) - (n_mm__dome_R - n_mm__dome_h);
    let n_mm__pocket = o_v.sheet_x + o_v.side_clearance;
    let n_mm__width__sheets = n_mm__pocket + 2 * o_v.wall;
    return {
        a_n_mm__slot,
        a_n_mm__centre,
        b_board,
        b_landscape,
        a_n_mm__board,
        // the light's wall behind the front face, and the box's outside
        n_mm__light,
        n_mm__depth: b_board
            ? n_mm__light + o_v.rib + o_v.board_slot + o_v.board_back + o_v.wall
            : n_mm__light + o_v.wall + n_mm__lens + o_v.puck_edge_height + o_v.puck_play + o_v.wall,
        n_mm__width: b_board ? Math.max(n_mm__width__sheets, a_n_mm__board[0] + o_v.side_clearance + 2 * o_v.wall) : n_mm__width__sheets,
        n_mm__width__sheets,
        n_mm__height: o_v.stop_height + Math.max(o_v.sheet_y, b_board ? a_n_mm__board[1] : 0),
        // the window: what the side walls' grooves and the bar at the top leave to see
        n_mm__window_x: n_mm__pocket - 2 * o_v.groove_depth,
        n_mm__hidden_side: o_v.groove_depth - o_v.side_clearance / 2,
        n_mm__hidden_top: o_v.groove_depth,
        // the puck's middle above the sheets' lower edge
        n_mm__puck_z: Math.max(o_v.stop_height + o_v.sheet_y / 2, (n_mm__pocket_r + o_v.wall) * Math.SQRT2) - o_v.stop_height
    };
};

// The light for light.module.js's f_a_n__source, on a sheet whose top left is 0, 0.
// The board is Bambu's: 99 LEDs, 9 x 11, in a field 12 smaller than the board.
let f_o_light = function(o_v, o_box){
    if(o_box.b_board){
        return {
            s_kind: 'board',
            n_mm__x: o_v.sheet_x / 2,
            n_mm__y: o_v.sheet_y - o_box.a_n_mm__board[1] / 2,
            n_mm__w: o_box.a_n_mm__board[0] - 12,
            n_mm__h: o_box.a_n_mm__board[1] - 12,
            n_cnt__x: o_box.b_landscape ? 11 : 9,
            n_cnt__y: o_box.b_landscape ? 9 : 11
        };
    }
    return { s_kind: 'puck', n_mm__x: o_v.sheet_x / 2, n_mm__y: o_v.sheet_y - o_box.n_mm__puck_z, n_mm__r: o_v.contact_d / 2 };
};

export { f_o_box, f_o_light };
