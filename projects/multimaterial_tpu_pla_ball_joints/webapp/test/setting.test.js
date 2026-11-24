// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The settings as read from the script itself.
import { assertEquals, assertThrows } from './check.js';
import { f_a_o_group__from_scad, f_a_s_define } from '../setting.module.js';

let s_scad = await Deno.readTextFile(new URL('../../tpu_pla_ball_joint_veryos_V1.scad', import.meta.url));
let a_o_group = f_a_o_group__from_scad(s_scad);
let o_setting__by_name = Object.fromEntries(a_o_group.flatMap(function(o_group){
    return o_group.a_o_setting.map(function(o_setting){ return [o_setting.s_name, o_setting]; });
}));

Deno.test('groups and settings of the script, nothing from Hidden', function(){
    assertEquals(a_o_group.map(function(o_group){ return o_group.s_title; }),
        ['Start here', 'Fit', 'Shape', 'Lip', 'Ring', 'TPU ball', 'Logo']);
    assertEquals(o_setting__by_name.version, undefined);
    assertEquals(o_setting__by_name.lead, undefined);
});

Deno.test('a choice, a range, a switch', function(){
    assertEquals(o_setting__by_name.type.s_kind, 'choice');
    assertEquals(o_setting__by_name.type.a_o_option.map(function(o){ return o.v; }), ['lip', 'ring', 'tpu_ball']);
    assertEquals(o_setting__by_name.type.v_default, 'lip');
    assertEquals(o_setting__by_name.material.a_o_option.map(function(o){ return o.s_label; }), ['both', 'pla', 'tpu']);
    let o_ball = o_setting__by_name.ball;
    assertEquals([o_ball.s_kind, o_ball.v_default, o_ball.n_min, o_ball.n_step, o_ball.n_max], ['number', 6, 3, 0.5, 16]);
    assertEquals(o_ball.s_help, "Diameter of the ball.");
    assertEquals([o_setting__by_name.logo.s_kind, o_setting__by_name.logo.v_default], ['bool', true]);
    assertEquals(o_setting__by_name.slits.n_step, 1);
});

Deno.test('-D arguments, and what is refused', function(){
    assertEquals(f_a_s_define(a_o_group, { type: 'ring', ball: 8, logo: false }),
        ['-D', 'type="ring"', '-D', 'ball=8', '-D', 'logo=false']);
    assertThrows(function(){ f_a_s_define(a_o_group, { lead: 1 }); }, 'no setting lead');
    assertThrows(function(){ f_a_s_define(a_o_group, { ball: 40 }); }, 'from 3 to 16');
    assertThrows(function(){ f_a_s_define(a_o_group, { type: 'cube(1);' }); }, 'one of');
    assertThrows(function(){ f_a_s_define(a_o_group, { ball: '6' }); }, 'a number');
    assertThrows(function(){ f_a_s_define(a_o_group, { logo: 1 }); }, 'true or false');
});
