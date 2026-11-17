with the code 

`

const n_tau = PI * 2;
const n_height = 100;
const n_its_layer = 120;
// A regular polygon: with 3 corners a triangle.
const n_its_corner = 444;
// How far its corners are from the axis, on the bottom and on the
// top layer. Between them it shrinks linearly.
const n_radius_bottom = 45;
const n_radius_top = 45;
// How far it turns one way on its way up, linearly: 1 is a turn.
const n_twist = 0;
// Layer 1 is this far above the thread's ring, so the straight
// walls from the round ring to the triangle stand steep enough.
const n_height_cone = 12;

function f_o_p(n_it_layer_nor, n_it_corner_nor) {
    let x = n_it_corner_nor*10; 
    let l = 3; 
    let a = l*x;
    let b = (a%2)-1;
    let o = 0;//(sin(n_it_layer_nor*20)*.5+0.5)*0.2; 
    let c = sqrt((1-b*b))-o;
    let h = x*0.0001;
    let j = max(h,c);
    
    let n_amp = mix(n_radius_bottom, n_radius_top, n_it_layer_nor);
    n_amp += j*10;
    let n_rad_offset = n_it_layer_nor * n_twist * n_tau;

    return {
        n_x: sin(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_y: cos(n_it_corner_nor * n_tau + n_rad_offset) * n_amp,
        n_z: o_thread.n_z + n_height_cone + n_it_layer_nor * n_height,
    };
}

return {
    n_its_layer, n_its_corner, f_o_p
};

`

the base looks weird

fixed in 162d396: vase.module.js joins the collar to layer 1 by angle around the axis, not by shorter edges. this may already be fixed uncommitted on another pc: there keep one of the two fixes, not both, and run `deno task test`.
