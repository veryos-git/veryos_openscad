// The lamp's shape above the thread, as a solid for a slicer's
// vase mode. Units: mm.
//
// The app makes the thread and calls f_o_p() for each corner of
// each layer above it: n_it_layer from 1 to n_its_layer,
// n_it_corner from 0 to n_its_corner - 1.
// Layer 0 is the thread's top ring, which stays: a circle of the
// radius o_thread.n_radius, 33.5, at the height o_thread.n_z, 6.6.
// The app joins it to layer 1 with straight walls. Stay above it:
// below is the sockel.
//
// A script has Math's functions and constants without their
// "Math.": sin(), cos(), sqrt(), pow(), abs(), min(), max(),
// floor(), PI and the others. And these:
//   fract(n)             n - floor(n): fract(3.25) is 0.25
//   mix(a, b, n)         from a at n = 0 to b at n = 1
//   clamp(n, a, b)       n, but not below a and not above b
//   smoothstep(a, b, n)  0 up to a, 1 from b on, smooth between
//   vec2(x, y)           a vector, {n_x, n_y}
//   vec3(x, y, z)        {n_x, n_y, n_z}, as f_o_p() returns one
//   length(o)            a vector's length
//   distance(o_a, o_b)   from one point to another. If one is a
//                        vec2, in x and y only: seen from above.

const n_tau = PI * 2;
const n_height = 100;
const n_its_layer = 120;
// A regular polygon: with 3 corners a triangle.
const n_its_corner = 6;
// How far its corners are from the axis, on the bottom and on the
// top layer. Between them it shrinks linearly.
const n_radius_bottom = 45;
const n_radius_top = 22;
// How far it turns one way on its way up, linearly: 1 is a turn.

// Layer 1 is this far above the thread's ring, so the straight
// walls from the round ring to the triangle stand steep enough.
const n_height_cone = 12;
// The app closes the last layer with a dome this high. 0 leaves
// the top flat. The dome is round up to where its wall leans
// n_overhang_dome from vertical, in degrees. From there a straight
// cone goes on to the tip: a single wall cannot lie flat.
const n_height_dome = 35;
const n_overhang_dome = 60;

// n_it_layer_nor: n_it_layer / n_its_layer, 1 on the top layer
// n_it_corner_nor: n_it_corner / n_its_corner, around the ring
// n_it_layer and n_it_corner themselves come as a 3rd and 4th.
function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_twist = sin(n_it_layer_nor*n_tau*3)*0.2;
    let n_amp = (1-n_it_layer_nor)*n_radius_bottom;
    let n_rad_offset = n_it_layer_nor * n_twist * n_tau;

    // Noise: noise.simplex2(x, y) and noise.simplex3(x, y, z)
    // return a number from -1 to 1, which changes smoothly from
    // place to place, about one bump per 1. noise.perlin2() and
    // noise.perlin3() do the same on a grid of squares, and return
    // 0 where x, y and z are whole numbers.
    // Examples, to try without their //:
    //
    // Each corner wanders in and out by up to 4 mm.
    // n_amp += noise.simplex2(n_it_corner_nor * n_its_corner,
    //     n_it_layer_nor * 3) * 4;
    //
    // The twist wobbles by up to a thirtieth of a turn.
    // n_rad_offset += noise.simplex2(0.5, n_it_layer_nor * 2)
    //     * n_tau / 30;
    //
    // Bumps all around, 3 mm deep, with n_its_corner = 180. Their
    // x and y go around a circle, so the noise has no seam where
    // the ring closes.
    // n_amp += noise.simplex3(
    //     sin(n_it_corner_nor * n_tau) * 2,
    //     cos(n_it_corner_nor * n_tau) * 2,
    //     n_it_layer_nor * 4) * 3;
    //
    // Another pattern, from 1 to 65535. Above f_o_p():
    // noise.seed(7);

    return {
        n_x: sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: o_thread.n_z + n_height_cone + n_it_layer_nor * n_height,
    };
}

return {
    n_its_layer, n_its_corner, f_o_p,

};
