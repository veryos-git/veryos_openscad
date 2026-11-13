
const n_tau = PI * 2;

// Vase dimensions
const n_height = 100;
const n_radius = 35;
const n_height_cone = 12;

// Mesh resolution
const n_its_layer = 180;
const n_its_corner = 360;

// Voronoi parameters
const n_its_seed = 444;
const n_depression_radius = 12;
const n_depression_depth = 4;

// Generate random seed points on the cylinder
const a_o_seed = [];

for (let i = 0; i < n_its_seed; i++) {
    const n_angle = Math.random() * n_tau;
    const n_z = Math.random() * n_height;

    a_o_seed.push({
        n_x: sin(n_angle) * n_radius,
        n_y: cos(n_angle) * n_radius,
        n_z: n_z
    });
}

// Find distance to nearest seed point
function f_n_nearest_distance(n_x, n_y, n_z) {
    let n_min_dist = Infinity;

    for (const o_seed of a_o_seed) {
        const n_dx = n_x - o_seed.n_x;
        const n_dy = n_y - o_seed.n_y;
        const n_dz = n_z - o_seed.n_z;

        const n_dist = Math.sqrt(
            n_dx * n_dx +
            n_dy * n_dy +
            n_dz * n_dz
        );

        n_min_dist = Math.min(n_min_dist, n_dist);
    }

    return n_min_dist;
}

// Generate each vertex
function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    const n_angle = n_it_corner_nor * n_tau;
    const n_z = n_it_layer_nor * n_height;

    // Original cylinder position
    const n_x = sin(n_angle) * n_radius;
    const n_y = cos(n_angle) * n_radius;

    // Distance to nearest random point
    const n_dist = f_n_nearest_distance(n_x, n_y, n_z);

    // Smooth spherical-like depression
    const n_t = Math.min(1, n_dist / n_depression_radius);
    const n_smooth = n_t * n_t * (3 - 2 * n_t);

    const n_displacement =
        n_depression_depth * (1 - n_smooth);

    // Move the vertex inward
    const n_new_radius = n_radius - n_displacement;

    return {
        n_x: sin(n_angle) * n_new_radius,
        n_y: cos(n_angle) * n_new_radius,
        n_z: o_thread.n_z + n_height_cone + n_z
    };
}

return {
    n_its_layer,
    n_its_corner,
    f_o_p
};
