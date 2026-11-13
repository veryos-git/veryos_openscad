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
const fract = x => x - Math.floor(x);
const sin = Math.sin
const cos = Math.cos

const n_tau = Math.PI * 2;
const n_height = 120;
const n_its_layer = 300;
const n_its_corner = 500;

function wave(x, a, r) {
  const m = ((x % a) + a) % a;
  const u = m - a / 2;
  const lift = Math.sqrt(Math.max(0, r * r - (a / 2) ** 2));
  return -Math.sqrt(Math.max(0, r * r - u * u)) + lift;
}

// n_it_layer_nor: n_it_layer / n_its_layer, 1 on the top layer
// n_it_corner_nor: n_it_corner / n_its_corner, around the ring
// n_it_layer and n_it_corner themselves come as a 3rd and 4th.
function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_amp = o_thread.n_radius;
    let n_rad_offset = n_it_layer_nor;
    let n_interpolate = 0;

    let n_z = n_it_layer_nor * n_height;   // height in mm
    let r = 9;
    let b = 1+sin(n_it_corner_nor*n_tau*3)*0.1;                              // dent radius in mm
    let a = b * r;                          // spacing in mm (bigger = flat gaps)
    n_amp += wave(n_z, a, r);

    return {
        n_x: sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: o_thread.n_z + n_it_layer_nor * n_height,
    };
}

return {n_its_layer, n_its_corner, f_o_p};

