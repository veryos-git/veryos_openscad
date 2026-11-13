

const n_tau = PI * 2;
const n_height = 100;
const n_its_layer = 120;
// A regular polygon: with 3 corners a triangle.
const n_its_corner = 120;
// How far its corners are from the axis, on the bottom and on the
// top layer. Between them it shrinks linearly.
const n_radius_bottom = 45;
const n_radius_top = 22;
// How far it turns one way on its way up, linearly: 1 is a turn.
const n_twist = 1 / 6;
// Layer 1 is this far above the thread's ring, so the straight
// walls from the round ring to the triangle stand steep enough.
const n_height_cone = 12;

function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_amp = mix(n_radius_bottom, n_radius_top, n_it_layer_nor);
    let n_rad_offset = n_it_layer_nor * n_twist * n_tau;

    let n_z  = n_it_layer_nor * n_height;   // Höhe in mm (0 bis 100)
    let n_R  = 50;                          // Radius der Kugel
    let n_zc = 0.42*n_height;              // Höhe der Kugelmitte
    let n_s = 1.18;   // Streckung: 1 = Kugel, grösser = länger gezogen

    n_amp = Math.sqrt(Math.max(0, n_R * n_R - ((n_z - n_zc) / n_s) ** 2));
    
    return {
        n_x: sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: o_thread.n_z + n_height_cone + n_it_layer_nor * n_height,
    };
}

return {
    n_its_layer, n_its_corner, f_o_p
};
