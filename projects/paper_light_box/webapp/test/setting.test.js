// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The settings as read from the script itself.
import { assertEquals, assertThrows } from './check.js';
import { f_a_o_group__from_scad, f_a_s_define } from '../setting.module.js';

let s_scad = await Deno.readTextFile(new URL('../../paper_light_box_veryos_V1.scad', import.meta.url));
let a_o_group = f_a_o_group__from_scad(s_scad);
let o_setting__by_name = Object.fromEntries(a_o_group.flatMap(function(o_group){
    return o_group.a_o_setting.map(function(o_setting){ return [o_setting.s_name, o_setting]; });
}));

Deno.test('groups and settings of the script, nothing from Hidden', function(){
    assertEquals(a_o_group.map(function(o_group){ return o_group.s_title; }),
        ['Start here', 'Fit', 'Box', 'Backlight board', 'Puck light', 'Logo']);
    assertEquals(o_setting__by_name.eps, undefined);
    assertEquals(o_setting__by_name.logo_r, undefined);
});

Deno.test('a choice, a range, a switch, a list', function(){
    assertEquals(o_setting__by_name.light.a_o_option.map(function(o){ return o.v; }), ['board', 'puck']);
    let o_x = o_setting__by_name.sheet_x;
    assertEquals([o_x.s_kind, o_x.v_default, o_x.n_min, o_x.n_step, o_x.n_max], ['number', 120, 70, 0.5, 300]);
    assertEquals(o_x.s_help, 'Width of the sheets.');
    assertEquals([o_setting__by_name.vents.s_kind, o_setting__by_name.vents.v_default], ['bool', true]);
    assertEquals([o_setting__by_name.sheet_thicknesses.s_kind, o_setting__by_name.sheet_thicknesses.v_default], ['list', []]);
});

Deno.test('-D arguments, and what is refused', function(){
    assertEquals(f_a_s_define(a_o_group, { light: 'puck', sheet_x: 100, logo: false, sheet_thicknesses: [0.4, 0.2] }),
        ['-D', 'light="puck"', '-D', 'sheet_x=100', '-D', 'logo=false', '-D', 'sheet_thicknesses=[0.4,0.2]']);
    assertThrows(function(){ f_a_s_define(a_o_group, { eps: 1 }); }, 'no setting eps');
    assertThrows(function(){ f_a_s_define(a_o_group, { sheet_x: 20 }); }, 'from 70 to 300');
    assertThrows(function(){ f_a_s_define(a_o_group, { light: 'cube(1);' }); }, 'one of');
    assertThrows(function(){ f_a_s_define(a_o_group, { sheet_thicknesses: ['0.4'] }); }, 'a list');
    assertThrows(function(){ f_a_s_define(a_o_group, { sheet_thicknesses: '[1];cube(1)' }); }, 'a list');
});
