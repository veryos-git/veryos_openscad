// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// A loaded SVG as a picture the browser draws, and its ink on a sheet per pixel. The
// browser draws the file, so whatever it shows counts: fills, strokes, text, any colour.
// Dark is ink, white and nothing are not.

let o_n_px__by_unit = { '': 1, px: 1, mm: 96 / 25.4, cm: 96 / 2.54, in: 96, pt: 96 / 72, pc: 16 };

// A length of an SVG's width or height in pixels; NaN for none, a percentage or nonsense.
let f_n_px = function(s){
    let a_s = /^\s*([0-9.eE+-]+)\s*([a-z]*)\s*$/.exec(s ?? '');
    return a_s && a_s[2] in o_n_px__by_unit ? Number(a_s[1]) * o_n_px__by_unit[a_s[2]] : NaN;
};

// An SVG file's text as { el_image, n_ratio: its height over its width }. The file gets
// a size and a viewBox if it has none, so that it can be drawn at any size, sharp.
let f_o_art = async function(s_svg){
    let o_document = new DOMParser().parseFromString(s_svg, 'image/svg+xml');
    let el_svg = o_document.documentElement;
    if(el_svg.localName !== 'svg' || o_document.querySelector('parsererror')){ throw new Error('this is not an SVG file'); }
    let a_n_box = (el_svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
    let b_box = a_n_box.length === 4 && a_n_box.every(Number.isFinite) && a_n_box[2] > 0 && a_n_box[3] > 0;
    let n_w = f_n_px(el_svg.getAttribute('width')), n_h = f_n_px(el_svg.getAttribute('height'));
    if(!(n_w > 0)){ n_w = b_box ? (n_h > 0 ? n_h * a_n_box[2] / a_n_box[3] : a_n_box[2]) : 300; }
    if(!(n_h > 0)){ n_h = b_box ? n_w * a_n_box[3] / a_n_box[2] : 150; }
    if(!b_box){ el_svg.setAttribute('viewBox', `0 0 ${n_w} ${n_h}`); }
    el_svg.setAttribute('width', String(n_w));
    el_svg.setAttribute('height', String(n_h));
    let s_url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(el_svg)], { type: 'image/svg+xml' }));
    let el_image = new Image();
    el_image.src = s_url;
    try{
        await el_image.decode();
    } catch(o_error){
        throw new Error('the browser cannot draw this SVG file');
    } finally{
        URL.revokeObjectURL(s_url);
    }
    return { el_image, n_ratio: n_h / n_w };
};

// The ink of a sheet's picture, per pixel from 0 to 1, at n_px__per_mm pixels per mm.
// o_sheet: { o_art, n_mm__x, n_mm__y, n_mm__width }: where the picture's top left lies
// on the sheet and how wide it is. el_canvas is working room and is resized.
let f_a_n__ink = function(el_canvas, o_sheet, n_w, n_h, n_px__per_mm){
    if(!o_sheet.o_art){ return new Float32Array(n_w * n_h); }
    el_canvas.width = n_w;
    el_canvas.height = n_h;
    let o_context = el_canvas.getContext('2d', { willReadFrequently: true });
    o_context.fillStyle = '#fff';
    o_context.fillRect(0, 0, n_w, n_h);
    o_context.drawImage(o_sheet.o_art.el_image, o_sheet.n_mm__x * n_px__per_mm, o_sheet.n_mm__y * n_px__per_mm,
        o_sheet.n_mm__width * n_px__per_mm, o_sheet.n_mm__width * o_sheet.o_art.n_ratio * n_px__per_mm);
    let a_n_rgba = o_context.getImageData(0, 0, n_w, n_h).data;
    let a_n = new Float32Array(n_w * n_h);
    for(let n_it = 0; n_it < n_w * n_h; n_it++){
        a_n[n_it] = 1 - (0.299 * a_n_rgba[4 * n_it] + 0.587 * a_n_rgba[4 * n_it + 1] + 0.114 * a_n_rgba[4 * n_it + 2]) / 255;
    }
    return a_n;
};

export { f_o_art, f_a_n__ink, f_n_px };
