// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The flextangle's part of the page: its fields in the panel and its words. What a
// kind's part of the page is: see calendar.page.module.js.

import { n_mm__logo_min, f_o_net } from './flextangle.module.js';

let o_page = null;

let o_s_html = {
    size: `
        <p class="note" id="el_net_size"></p>`,
    pattern: `
        <p class="lead">A ring of six tetrahedra from one sheet, that turns through its own middle. Each column of the net is one of them: four triangles, a glue tab on top; the two tabs on the right close the ring.</p>
        <div class="group">
            <h2>Triangles</h2>
            <label class="row"><span title="The triangles' base: the hinges between the six tetrahedra">Base</span><span class="field"><input type="number" name="n_mm__base" min="10" max="300" step="0.5" required><i>mm</i></span></label>
            <label class="row"><span title="The triangles' height in bases. 1 is the smallest that turns all the way round: the middle closes to a point. Higher: longer tetrahedra, a bigger hole">Height, × base</span><span class="field"><input type="number" name="n_ratio__height" min="1" max="3" step="0.05" required><i></i></span></label>
            <label class="row"><span title="How far the two end tabs reach into the triangles they are glued to; half the base at most">End tab</span><span class="field"><input type="number" name="n_mm__tab" min="1" step="0.5" required><i>mm</i></span></label>
            <p class="note" id="el_net"></p>
        </div>
        <div class="group">
            <h2>Folding</h2>
            <p class="note">Cut the outline. Crease the blue folds face to face and the red folds back to back. Roll a tube: the glue tabs along the top go behind the bottom row. Glue the two end tabs into the open end on the left: the ring closes.</p>
        </div>`,
    cut: `
        <p class="lead">What the knife cuts: the outline, and every fold as a row of cut dashes, along which the card folds.</p>
        <div class="group">
            <h2>Folds</h2>
            <label class="row"><span title="Length of each cut dash of a fold">Dash</span><span class="field"><input type="number" name="n_mm__dash" min="0.2" max="50" step="0.1" required><i>mm</i></span></label>
            <label class="row"><span title="Uncut between the dashes of a fold, and at both its ends: no dash touches the outline or another fold">Gap</span><span class="field"><input type="number" name="n_mm__gap" min="0.2" max="50" step="0.1" required><i>mm</i></span></label>
            <label class="row"><span title="In dots on the first glue tab, hidden once the flextangle is glued. Left out where the tab is too small for it">VeryOS logo on a glue tab</span><input type="checkbox" class="switch" name="b_logo"></label>
            <p class="note" id="el_fold"></p>
        </div>`,
    legend: `
        <li><svg viewBox="0 0 30 10"><path d="M 2 5 H 30" stroke="#0000ff" stroke-width="1.5" stroke-dasharray="6 4"/></svg>valley fold: cut dashes, folded face to face</li>
        <li><svg viewBox="0 0 30 10"><path d="M 2 5 H 30" stroke="#ff0000" stroke-width="1.5" stroke-dasharray="6 4"/></svg>mountain fold: cut dashes, folded back to back</li>
        <li><svg viewBox="0 0 30 10"><path d="M 2 5 H 30" stroke="#808080" stroke-width="1.5" stroke-dasharray="2 2"/></svg>the logo in dots on a glue tab: cut</li>
        <li><svg viewBox="0 0 30 10"><path d="M 0 5 H 30" stroke="#000000" stroke-width="1.5"/></svg>the outline: cut</li>`
};

let o_part = {
    s_step: 'Shape',
    s_lead__picture: 'Pictures printed where the cuts and folds will fall: one over the whole net, or several. A scan or photo of a flextangle drawn by hand is laid on the net by four points.',
    o_s_html,
    f_start: function(o_page__new){ o_page = o_page__new; },
    f_limit: function(o_form){
        o_page.el_panel.elements.n_mm__tab.max = o_form.n_mm__base / 2;
    },
    f_s_bad: function(){ return ''; },
    f_input: function(){},
    f_update: function(){
        let o_setting = o_page.f_o_setting();
        let o_net = f_o_net(o_setting);
        let f_s = function(n){ return String(+n.toFixed(2)); };
        let s_size = `${f_s(o_net.n_mm__x)} × ${f_s(o_net.n_mm__y)} mm`;
        document.getElementById('el_net_size').textContent = `Size ${s_size}, by its triangles: step 2, Shape.`;
        document.getElementById('el_net').textContent = `The net is ${s_size}: 6 × the height and the end tab wide, 2.5 × the base high.`;
        document.getElementById('el_fold').textContent = o_setting.b_logo && o_net.o_logo.n_w < n_mm__logo_min
            ? `The glue tab leaves the logo ${f_s(o_net.o_logo.n_w)} mm in width, less than ${n_mm__logo_min}: left out.` : '';
    },
    f_s_screen: function(){ return ''; },
    f_o_drag: function(){ return null; }
};

export { o_part };
