function() {
            const n_tau = Math.PI * 2;
            // all units in millimeter mm
            let n_height = 200.;
            let n_layer_height = 0.6;
            let n_its_layer = parseInt(n_height / n_layer_height);
            let a_o_geometry = []
            let n_corners = 300.;
            let a_o_p_outside = [];
            let n_radius_base = 33
            // const phi = (1 + Math.sqrt(5)) / 2;
        
            noise.seed(Math.random());
            let n_its_wave = 24.;
            // Assuming you have your point generation functions as shown
            function f_o_vec(x, y, z) {
                return { n_x: x, n_y: y, n_z: z };
            }
        
            function f_a_o_p(o_trn, n_corners, n_amp, n_rad_offset, n_it_layer_nor) {
        
        
                let a_o = new Array(n_corners).fill(0).map((v, n_idx) => {
        
                    let n_rad_offset = n_it_layer_nor * (n_tau / n_corners / 2);
                    let n_amp = n_radius_base;
                    n_amp += Math.sin(n_it_layer_nor * n_tau * 0.95) * n_radius_base * 0.5
                    let n_it = parseFloat(n_idx);
                    let n_it_nor_corner = n_it / n_corners;
        
                    let nrad = Math.sin(n_it_nor_corner * n_tau * 3.) * .5 + .5;
                    let o1 = f_o_vec( //this would be the point that is on the corner of the polygon
                        Math.sin(nrad * n_tau + n_rad_offset),
                        Math.cos(nrad * n_tau + n_rad_offset),
                        0
                    );
        
                    let x = (n_it_nor_corner * n_its_wave) % 1.;
                    let n_noise_layer = noise.simplex2(
                        (o1.n_x + n_it_layer_nor * 20.) * .2,
                        (o1.n_y + n_it_layer_nor * 20.) * .2
                    ) * .5;
                    let w = n_noise_layer;
                    let l = x + w;
                    let k = x - w;
        
                    let a = Math.pow(l, 2);
                    let b = Math.pow(l - 1, 2);
                    let c = Math.min(a, b);
        
                    c = Math.min(c, 1);
        
        
                    // https://www.desmos.com/calculator/mlhhw6p2du
                    let na = n_amp + c * 5;
        
                    let o_trn1 = f_o_vec( //this would be the point that is on the corner of the polygon
                        Math.sin(n_it_nor_corner * n_tau + n_rad_offset) * na,
                        Math.cos(n_it_nor_corner * n_tau + n_rad_offset) * na,
                        0
                    );
                    
                    o_trn1 = f_o_vec(
                        o_trn.n_x + o_trn1.n_x,
                        o_trn.n_y + o_trn1.n_y,
                        o_trn.n_z + o_trn1.n_z,
                    )
                    let nh = Math.abs(n_it_nor_corner - .5);
                    let nl = Math.max(0, n_it_layer_nor - .9);
                    o_trn1.n_z += nl * nh*500;
        
                    return o_trn1
        
        
                }).flat();
        
                return a_o
            }
        
        
        
        
            for (let n_it_layer = 0.; n_it_layer < n_its_layer; n_it_layer += 1) {
                let n_it_layer_nor = n_it_layer / n_its_layer;
                let n_z = n_it_layer * n_layer_height;
                let n_radius = n_radius_base;
                n_radius += Math.sin(n_it_layer_nor * n_tau * 0.8) * 20;
        
        
                let a_o_p = f_a_o_p(f_o_vec(0, 0, n_z), n_corners, 0, 0, n_it_layer_nor);
                a_o_p_outside.push(...a_o_p);
        
        
                if (n_it_layer == 0 || n_it_layer == n_its_layer - 1) {
                    // only bottom and top face
                    a_o_geometry.push(
                        f_o_geometry_from_a_o_p_polygon_face([f_o_vec(0, 0, n_z), ...a_o_p])
                    )
        
                }
            }
        
            a_o_geometry.push(
                // the outside / 'skirt' of the extruded polygon
                f_o_geometry_from_a_o_p_polygon_vertex(a_o_p_outside, n_corners)
            )
            let a_o_mesh = a_o_geometry.map(o => { return f_o_shaded_mesh(o) })
        
            return a_o_mesh
        }