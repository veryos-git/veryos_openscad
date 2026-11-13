
const n_tau = PI * 2;

// Vase dimensions
const n_height = 100;
const n_radius = 35;
const n_height_cone = 12;

// Mesh resolution
const n_its_layer = 300;
const n_its_corner = 600;

// Sphere cutout parameters
const n_spheres_per_ring = 200;
const n_sphere_radius = 7;
const n_cut_depth = 3;

// Sphere layers
const n_its_sphlayers = 10;

// 0 = aligned columns
// 0.5 = staggered rows
const n_ring_stagger = 0.5;

// Radial wave parameters
const n_wave_count = 6;
const n_wave_amplitude = 1;
const n_wave_offset = 1;

// Build sphere centers
const a_o_sphere = [];

for (let i = 1; i <= n_its_sphlayers; i++) {
    const n_sphrlayer_nor = i / n_its_sphlayers;
    const n_z = n_sphrlayer_nor * n_height;

    const n_offset = (i % 2) * n_ring_stagger;

    for (let j = 0; j < n_spheres_per_ring; j++) {
        const n_ang_nor =
            (j + n_offset) / n_spheres_per_ring;

        const n_angle = n_ang_nor * n_tau;

        // Base distance of sphere center from vase axis
        let n_center_radius =
            n_radius + n_sphere_radius - n_cut_depth;

        // Move sphere centers in/out sinusoidally
        n_center_radius +=
            sin(
                n_ang_nor * n_tau * n_wave_count +
                n_sphrlayer_nor * n_tau * n_wave_count
            ) * n_wave_amplitude + n_wave_offset;

        a_o_sphere.push({
            n_x: sin(n_angle) * n_center_radius,
            n_y: cos(n_angle) * n_center_radius,
            n_z: n_z
        });
    }
}

// Find radial intersection with cutting spheres
function f_n_sphere_cut_radius(n_angle, n_z) {
    const n_sin = sin(n_angle);
    const n_cos = cos(n_angle);

    let n_result_radius = n_radius;

    for (const o_sphere of a_o_sphere) {
        const n_b =
            o_sphere.n_x * n_sin +
            o_sphere.n_y * n_cos;

        const n_center_dist_sq =
            o_sphere.n_x * o_sphere.n_x +
            o_sphere.n_y * o_sphere.n_y;

        const n_dz = n_z - o_sphere.n_z;

        const n_h_sq =
            n_sphere_radius * n_sphere_radius -
            n_dz * n_dz -
            (n_center_dist_sq - n_b * n_b);

        if (n_h_sq < 0) {
            continue;
        }

        const n_r_near = n_b - Math.sqrt(n_h_sq);
        const n_r_far = n_b + Math.sqrt(n_h_sq);

        // Original cylinder surface must lie inside sphere
        if (
            n_r_near < n_radius &&
            n_r_far > n_radius &&
            n_r_near > 0
        ) {
            n_result_radius = Math.min(
                n_result_radius,
                n_r_near
            );
        }
    }

    return n_result_radius;
}

// Vertex callback
function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    const n_angle = n_it_corner_nor * n_tau;
    const n_z = n_it_layer_nor * n_height;

    const n_new_radius =
        f_n_sphere_cut_radius(n_angle, n_z);

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
