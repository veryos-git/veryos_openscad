

const n_tau = PI * 2;
const n_height = 100;
const n_its_layer = 120;
// A regular polygon: with 3 corners a triangle.
const n_its_corner = 3;
// How far its corners are from the axis, on the bottom and on the
// top layer. Between them it shrinks linearly.
const n_radius_bottom = 45;
const n_radius_top = 22;
// How far it turns one way on its way up, linearly: 1 is a turn.
const n_twist = 1 / 6;
// Layer 1 is this far above the thread's ring, so the straight
// walls from the round ring to the triangle stand steep enough.
const n_height_cone = 12;
// The app closes the last layer with a dome this high. 0 leaves
// the top flat. The dome is round up to where its wall leans
// n_overhang_dome from vertical, in degrees. From there a straight
// cone goes on to the tip: a single wall cannot lie flat.


// n_it_layer_nor: n_it_layer / n_its_layer, 1 on the top layer
// n_it_corner_nor: n_it_corner / n_its_corner, around the ring
// n_it_layer and n_it_corner themselves come as a 3rd and 4th.
function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_amp = mix(n_radius_bottom, n_radius_top, n_it_layer_nor);
    let n_rad_offset = n_it_layer_nor * n_twist * n_tau;


    return {
        n_x: sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: o_thread.n_z + n_height_cone + n_it_layer_nor * n_height,
    };
}

return {
    n_its_layer, n_its_corner, f_o_p,
    
};
