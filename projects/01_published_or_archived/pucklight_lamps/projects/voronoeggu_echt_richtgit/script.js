
const n_tau = PI * 2;

const n_height = 100;
const n_radius = 25;
const n_height_cone = 12;

const n_its_layer = 200;
const n_its_corner = 480;

// Sphere cutout settings
const n_its_sphere = 25;
const n_sphere_radius = 12;
const n_cut_depth = 5;

// Sphere centers sit outside the cylinder.
// Only part of each sphere intersects its surface.
const a_o_sphere = [];

for (let i = 0; i < n_its_sphere; i++) {
    const n_angle = Math.random() * n_tau;
    const n_z = 10 + Math.random() * (n_height - 20);

    const n_center_radius =
        n_radius + n_sphere_radius - n_cut_depth;

    a_o_sphere.push({
        n_x: sin(n_angle) * n_center_radius,
        n_y: cos(n_angle) * n_center_radius,
        n_z: n_z
    });
}

// Find the inward intersection of a radial ray
// with each cutting sphere.
function f_n_sphere_cut_radius(n_angle, n_z) {
    const n_sin = sin(n_angle);
    const n_cos = cos(n_angle);

    let n_result_radius = n_radius;

    for (const o_sphere of a_o_sphere) {
        // Projection of sphere center onto radial direction
        const n_b =
            o_sphere.n_x * n_sin +
            o_sphere.n_y * n_cos;

        const n_center_dist_sq =
            o_sphere.n_x * o_sphere.n_x +
            o_sphere.n_y * o_sphere.n_y;

        const n_dz = n_z - o_sphere.n_z;

        // Discriminant of ray-sphere intersection
        const n_h_sq =
            n_sphere_radius * n_sphere_radius -
            n_dz * n_dz -
            (n_center_dist_sq - n_b * n_b);

        if (n_h_sq < 0) {
            continue;
        }

        // Entry and exit points of sphere along radial ray
        const n_r_near = n_b - Math.sqrt(n_h_sq);
        const n_r_far = n_b + Math.sqrt(n_h_sq);

        // Only subtract when the ORIGINAL cylinder
        // surface lies inside the sphere.
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
