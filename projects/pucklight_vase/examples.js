// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// The scripts the editor offers. template explains what a script is, and egg is a
// preset that closes on top; the others are vases of stlsculpter
// (https://github.com/jonasfrey/stlsculpter), with their formulas and names, put on
// the thread. A new example: add an entry here.

const examples = {
    template: `// The lamp's shape above the thread, as a solid for a slicer's
// vase mode. Units: mm.
//
// The app makes the thread and calls f_o_p() for each corner of
// each layer above it: n_it_layer from 1 to n_its_layer,
// n_it_corner from 0 to n_its_corner - 1.
// Layer 0 is the thread's top ring, which stays: a circle of the
// radius o_thread.n_radius, 33.5, at the height o_thread.n_z, 6.6.
// The app joins it to layer 1 with straight walls. Stay above it:
// below is the sockel.

const n_tau = Math.PI * 2;
const n_height = 100;
const n_its_layer = 120;
const n_its_corner = 180;
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
    let n_amp = o_thread.n_radius;
    // The belly.
    n_amp += Math.sin(n_it_layer_nor * n_tau * 0.45) * 18;
    // Twelve waves, which grow from the thread upwards.
    n_amp += Math.sin(n_it_corner_nor * n_tau * 12) * 2 * n_it_layer_nor;
    // Twists the waves by a sixth of a turn.
    let n_rad_offset = n_it_layer_nor * n_tau / 6;

    return {
        n_x: Math.sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: Math.cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: o_thread.n_z + n_it_layer_nor * n_height,
    };
}

return {
    n_its_layer, n_its_corner, f_o_p,
    n_height_dome, n_overhang_dome,
};
`,
    egg: `// An egg that closes on top: a preset to put a pattern on.
//
// Below its widest ring it is half an ellipse, n_height_bottom high,
// which starts on the thread's ring. Above, half an ellipse
// n_height_top high. A single wall cannot lie flat, so the egg is
// round up to where its wall leans n_overhang, and from there a
// straight cone closes it. Lower is safer and more pointed.

const n_tau = Math.PI * 2;
const n_its_layer = 160;
const n_its_corner = 180;
const n_radius = 48;
const n_height_bottom = 52;
const n_height_top = 80;
// From vertical, in degrees.
const n_overhang = 60;
// The top layer. Not 0: its faces would have no area.
const n_radius_tip = 0.4;

// The widest ring, the ring where the cone starts, and the top.
const n_z_widest = o_thread.n_z + n_height_bottom
    * Math.sqrt(1 - Math.pow(o_thread.n_radius / n_radius, 2));
const n_tan = Math.tan(n_overhang / 360 * n_tau);
const n_rad_cone = Math.atan(n_height_top * n_tan / n_radius);
const n_radius_cone = n_radius * Math.cos(n_rad_cone);
const n_z_cone = n_z_widest + n_height_top * Math.sin(n_rad_cone);
const n_z_top = n_z_cone + (n_radius_cone - n_radius_tip) / n_tan;

// The egg's radius at the height n_z.
let f_n_radius = function(n_z) {
    if (n_z > n_z_cone) {
        return n_radius_cone - (n_z - n_z_cone) * n_tan;
    }
    let n_height = (n_z < n_z_widest) ? n_height_bottom : n_height_top;
    let n_nor = (n_z - n_z_widest) / n_height;
    return n_radius * Math.sqrt(1 - n_nor * n_nor);
}

function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_z = o_thread.n_z + n_it_layer_nor * (n_z_top - o_thread.n_z);
    let n_amp = f_n_radius(n_z);
    // A pattern goes here, for example ribs that fade out at both ends:
    // n_amp += Math.sin(n_it_corner_nor * n_tau * 12)
    //     * Math.sin(n_it_layer_nor * n_tau / 2);
    let n_rad_offset = 0;

    return {
        n_x: Math.sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: Math.cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: n_z,
    };
}

return {n_its_layer, n_its_corner, f_o_p};
`,
    exponential_twist: `// stlsculpter's vase_exponential_twist: 48 fine grooves, which
// twist to and fro three times. Its radius starts on the thread's.

const n_tau = Math.PI * 2;
const n_height = 100;
const n_its_layer = 100;
const n_its_corner = 400;
const n_pc = 48.;

// https://www.desmos.com/calculator/el8eo6mxcb
let f_n_exppeak = function(n_x, n_offset = 0) {
    let a = Math.pow(n_x + n_offset, 2);
    let b = Math.pow(n_x - 1 + n_offset, 2);
    let c = Math.min(a, b) * 2;
    return c;
}

function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_amp = o_thread.n_radius;
    n_amp += Math.sin(n_it_layer_nor * 0.95 * n_tau) * 10.;
    let n_rad_offset = 0;
    let ntw = f_n_exppeak((n_it_layer_nor * 3.) % 1 + .5);
    n_rad_offset += ntw * 0.5;
    let n2 = (n_it_corner_nor * n_pc) % 1;
    let n3 = f_n_exppeak(n2) * 10. + .9;
    let n4 = Math.min(1, n3);
    // The grooves, 2 mm deep, are full 10 mm above the thread.
    n_amp += (n4 - 1) * 20. * Math.min(1, n_it_layer_nor * 10.);

    return {
        n_x: Math.sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: Math.cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: o_thread.n_z + n_it_layer_nor * n_height,
    };
}

return {n_its_layer, n_its_corner, f_o_p};
`,
    wild_bend: `// stlsculpter's vase_wild_bend: ten zigzag rings, on layers that
// bend up and down in three waves. The layers are flat on the
// thread and at the top.

const n_tau = Math.PI * 2;
const n_height = 120;
const n_its_layer = 120;
const n_its_corner = 300;
const n_radius_base = o_thread.n_radius;

// 0 at 0 and at 1, 1 at 0.5
let f_n_linio = function(n_x) {
    n_x = Math.abs(n_x - .5) * -2. + 1.;
    return n_x
}

function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_amp = n_radius_base;
    n_amp += Math.sin(n_it_layer_nor * n_tau * 0.9) * n_radius_base * 0.4;
    let nreps = n_it_layer_nor * 10.;
    let nrepsflr = (nreps % 1);
    let n2 = f_n_linio(nrepsflr);
    n_amp += n2 * 2.;
    let n_rad_offset = 0;
    let n_z = n_it_layer_nor * n_height;
    let n3 = f_n_linio(n_it_layer_nor);
    n_z += Math.sin(n_it_corner_nor * n_tau * 3.) * n3 * 9.;

    return {
        n_x: Math.sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: Math.cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: o_thread.n_z + n_z,
    };
}

return {n_its_layer, n_its_corner, f_o_p};
`,
    four_pillars: `// stlsculpter's vase_four_pillars: four round pillars with flat
// walls between them. It does not start on the thread's ring, but
// n_height_cone above it, so the straight walls from the ring
// make a cone.

const n_tau = Math.PI * 2;
const n_height = 120;
const n_height_cone = 6;
const n_its_layer = 120;
const n_its_corner = 500;
const n_radius_base = 26;
const n_its_2 = 4.;

function f_o_vec(x, y, z) {
    return { n_x: x, n_y: y, n_z: z };
}

let f_n_dist = function(o) {
    return Math.sqrt(Math.pow(o.n_x, 2) + Math.pow(o.n_y, 2) + Math.pow(o.n_z, 2))
}

function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_it_2 = (n_it_corner_nor * n_its_2);
    let n_it_2_frc = n_it_2 % 1;
    let n_it_2_int = parseInt(n_it_2);
    let nc = (1. / n_its_2) * n_it_2_int;

    let n_amp = n_radius_base;
    n_amp += Math.sin(n_it_layer_nor * 0.95 * n_tau) * n_radius_base * .4;
    let n_rad_offset = 0;

    // The point on the round vase.
    let o_trn1 = f_o_vec(
        Math.sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        Math.cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        0
    );
    // The pillar's centre, and the point on the pillar around it.
    let o_trnc = f_o_vec(
        Math.sin(nc * n_tau + n_rad_offset) * n_amp,
        Math.cos(nc * n_tau + n_rad_offset) * n_amp,
        0
    );
    let n_amp2 = n_radius_base * .4;
    n_amp2 += Math.sin(n_it_layer_nor * n_tau * 3.) * 5.;
    let n2 = (n_it_2_frc - .5) * .5;
    let n_it2nor_start = nc + n2;
    n_amp2 += Math.sin(n_it_2_frc * n_tau * 9.) * .5 + .5
    let o_trn2 = f_o_vec(
        Math.sin(n_it2nor_start * n_tau) * n_amp2,
        Math.cos(n_it2nor_start * n_tau) * n_amp2,
        0
    );
    let o_trn3 = f_o_vec(
        o_trnc.n_x + o_trn2.n_x,
        o_trnc.n_y + o_trn2.n_y,
        0,
    )
    // Whichever is farther out.
    let o = o_trn1;
    if (f_n_dist(o_trn3) > f_n_dist(o_trn1)) {
        o = o_trn3;
    }
    o.n_z = o_thread.n_z + n_height_cone + n_it_layer_nor * n_height;
    return o;
}

return {n_its_layer, n_its_corner, f_o_p};
`,
    starshape_pow: `// stlsculpter's template_starshape_pow_function: a hexagon that
// turns by one side on its way up, its sides breathing in and out
// twelve times. It starts n_height_cone above the thread's ring,
// its corners over the ring, so the straight walls from the ring
// lean in to its sides.

const n_tau = Math.PI * 2;
const n_height = 120;
const n_height_cone = 5;
const n_its_layer = 240;
const n_its_corner = 600;
const n_radius_base = o_thread.n_radius;
const n_pc = 6;

// The point n_corner_nor of the way around a polygon of n_sides.
let f_o_p_on_polygon = function(n_corner_nor, n_sides = 5, radius = 1, n_rad_offset = 0) {
    n_sides = Math.max(3, n_sides);

    // The side the point lies on, and how far along it, from 0 to 1.
    const side_index = Math.floor(n_corner_nor * n_sides) % n_sides;
    const t = (n_corner_nor * n_sides) % 1;

    const angle1 = (side_index / n_sides) * 2 * Math.PI;
    const angle2 = ((side_index + 1) / n_sides) * 2 * Math.PI;
    const x1 = Math.sin(angle1 + n_rad_offset) * radius;
    const y1 = Math.cos(angle1 + n_rad_offset) * radius;
    const x2 = Math.sin(angle2 + n_rad_offset) * radius;
    const y2 = Math.cos(angle2 + n_rad_offset) * radius;

    const n_x = x1 + t * (x2 - x1);
    const n_y = y1 + t * (y2 - y1);
    return { n_x, n_y };
}

function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let n_amp = n_radius_base;
    let n_nor_side = (n_it_corner_nor * n_pc) % 1;
    let nx2 = n_nor_side;
    nx2 = Math.pow(nx2 - 0.5, 2) * -4. + 1.;
    let nint = Math.sin(n_it_layer_nor * 12. * n_tau) * .2;
    n_amp -= nx2 * 5. * nint;
    n_amp += Math.sin(n_it_layer_nor * 0.96 * n_tau) * n_radius_base * 0.5;
    let n_rad_offset = n_it_layer_nor * n_tau / n_pc;
    let o_trn = f_o_p_on_polygon(n_it_corner_nor, n_pc, n_amp, n_rad_offset)

    return {
        n_x: o_trn.n_x,
        n_y: o_trn.n_y,
        n_z: o_thread.n_z + n_height_cone + n_it_layer_nor * n_height,
    };
}

return {n_its_layer, n_its_corner, f_o_p};
`,
    low_poly: `// stlsculpter's vase_long_low_poly_multi_layer: five layers of six
// corners. Each corner is two points, far apart on every other
// layer and close together on the others. The straight walls from
// the thread's ring to layer 1, 30 mm above it, are its first
// facets.

const n_tau = Math.PI * 2;
const n_height = 150;
const n_its_layer = 5;
const n_corners = 6.;
const n_its_corner = n_corners * 2;
const n_radius_base = o_thread.n_radius;

function f_o_p(n_it_layer_nor, n_it_corner_nor, n_it_layer, n_it_corner) {
    let n_it = parseInt(n_it_corner / 2);
    let n_it_nor_corner = n_it / n_corners;
    let nm1 = n_it_layer % 2;
    let n_amp = n_radius_base;
    let nx = n_it_layer_nor;
    let nexpo = -4 * (Math.pow(nx - 0.5, 2)) + 1.;
    n_amp += nexpo * 10.;
    let nm2 = n_it % 2;
    let n_rad_offset = 0;

    let nof1 = n_tau / n_corners / 2.;
    let nof2 = n_tau / n_corners / 100.;
    let nof = (nm2 == nm1) ? nof1 : nof2;
    // A corner's first point lies nof before it, its second after.
    if (n_it_corner % 2 == 0) {
        nof = -nof;
    }

    return {
        n_x: Math.sin(n_it_nor_corner * n_tau + n_rad_offset + nof) * n_amp,
        n_y: Math.cos(n_it_nor_corner * n_tau + n_rad_offset + nof) * n_amp,
        n_z: o_thread.n_z + n_it_layer_nor * n_height,
    };
}

return {n_its_layer, n_its_corner, f_o_p};
`,
};
