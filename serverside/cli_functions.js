// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPLv2. See LICENSE file for details.

// functions that spawn CLI subprocesses (openscad, python, etc.)

import { s_ds, s_root_dir, s_uuid, s_bin__python, s_path__venv } from './runtimedata.js';

let f_init_python = async function(){
    let a_s_package = ['python-dotenv'];

    // check if venv exists
    let b_venv_exists = true;
    try {
        await Deno.stat(s_path__venv);
    } catch {
        b_venv_exists = false;
    }

    if (!b_venv_exists) {
        console.log('[f_init_python] creating venv...');
        let o_proc__venv = new Deno.Command(s_bin__python, {
            args: ['-m', 'venv', s_path__venv],
            stdout: 'inherit',
            stderr: 'inherit',
        });
        let o_result__venv = await o_proc__venv.output();
        if (!o_result__venv.success) {
            console.error('[f_init_python] failed to create venv');
            return;
        }
        console.log('[f_init_python] venv created');
    }

    let s_path__pip = `${s_path__venv}${s_ds}bin${s_ds}pip`;
    if (Deno.build.os === 'windows') {
        s_path__pip = `${s_path__venv}${s_ds}Scripts${s_ds}pip.exe`;
    }

    // get list of already installed packages
    let o_proc__freeze = new Deno.Command(s_path__pip, {
        args: ['freeze'],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_result__freeze = await o_proc__freeze.output();
    let s_installed = new TextDecoder().decode(o_result__freeze.stdout).toLowerCase();

    // filter to only packages not yet installed
    let a_s_package__missing = a_s_package.filter(function(s_pkg) {
        return !s_installed.includes(s_pkg.toLowerCase());
    });

    if (a_s_package__missing.length === 0) {
        console.log('[f_init_python] all packages already installed');
        return;
    }

    console.log(`[f_init_python] installing: ${a_s_package__missing.join(', ')}...`);
    let o_proc__install = new Deno.Command(s_path__pip, {
        args: ['install', ...a_s_package__missing],
        stdout: 'inherit',
        stderr: 'inherit',
    });
    let o_result__install = await o_proc__install.output();
    if (!o_result__install.success) {
        console.error('[f_init_python] pip install failed');
        return;
    }
    console.log('[f_init_python] packages installed');
}

// check if openscad is installed and return its path
let f_s_path__openscad = async function(){
    let a_s_candidate = ['openscad', 'openscad-nightly'];
    for (let s_bin of a_s_candidate) {
        let o_proc = new Deno.Command('which', {
            args: [s_bin],
            stdout: 'piped',
            stderr: 'piped',
        });
        let o_result = await o_proc.output();
        if (o_result.success) {
            return new TextDecoder().decode(o_result.stdout).trim();
        }
    }
    return null;
}

// run openscad to generate .stl from .scad
let f_o_run_openscad = async function(s_path__scad, s_path__stl){
    let s_bin = await f_s_path__openscad();
    if (!s_bin) {
        throw new Error('OpenSCAD not found. Install it: sudo apt install openscad');
    }

    console.log(`[openscad] rendering ${s_path__scad} -> ${s_path__stl}`);
    let o_proc = new Deno.Command(s_bin, {
        args: ['-o', s_path__stl, s_path__scad],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_result = await o_proc.output();
    let s_stderr = new TextDecoder().decode(o_result.stderr);

    if (!o_result.success) {
        console.error('[openscad] render failed:', s_stderr);
        throw new Error(`OpenSCAD render failed: ${s_stderr}`);
    }

    console.log('[openscad] render complete');
    return { s_path__stl };
}

// run openscad to render a .scad file to a .png image
let f_o_render_scad_to_png = async function(s_path__scad, s_path__png){
    let s_bin = await f_s_path__openscad();
    if (!s_bin) {
        throw new Error('OpenSCAD not found. Install it: sudo apt install openscad');
    }

    console.log(`[openscad] rendering preview ${s_path__scad} -> ${s_path__png}`);
    let o_proc = new Deno.Command(s_bin, {
        args: [
            '-o', s_path__png,
            '--imgsize=800,600',
            '--colorscheme=Tomorrow Night',
            s_path__scad,
        ],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_result = await o_proc.output();
    let s_stderr = new TextDecoder().decode(o_result.stderr);

    if (!o_result.success) {
        console.error('[openscad] png render failed:', s_stderr);
        throw new Error(`OpenSCAD PNG render failed: ${s_stderr}`);
    }

    console.log('[openscad] png render complete');
    return { s_path__png };
}

// extract thumbnail from .3mf file (3MF files are ZIP archives containing a thumbnail)
// falls back to rendering via openscad if no embedded thumbnail found
let f_o_render_thumbnail_3mf = async function(s_path__3mf, s_path__thumbnail){
    // 3MF files are ZIP archives. Try to extract embedded thumbnail first.
    let b_extracted = false;
    try {
        let o_proc = new Deno.Command('unzip', {
            args: ['-o', '-j', s_path__3mf, 'Metadata/thumbnail.png', '-d', s_path__thumbnail.replace(/[^/\\]+$/, '')],
            stdout: 'piped',
            stderr: 'piped',
        });
        let o_result = await o_proc.output();
        if (o_result.success) {
            // rename extracted file to target path
            let s_dir = s_path__thumbnail.replace(/[^/\\]+$/, '');
            let s_extracted = s_dir + 'thumbnail.png';
            try {
                await Deno.rename(s_extracted, s_path__thumbnail);
                b_extracted = true;
                console.log('[3mf] extracted embedded thumbnail');
            } catch {
                // rename failed, try copy + delete
                await Deno.copyFile(s_extracted, s_path__thumbnail);
                await Deno.remove(s_extracted);
                b_extracted = true;
            }
        }
    } catch (o_err) {
        console.log('[3mf] no embedded thumbnail, will try openscad import:', o_err.message);
    }

    if (!b_extracted) {
        // fallback: use openscad to import the 3mf and render a preview
        let s_bin = await f_s_path__openscad();
        if (!s_bin) {
            throw new Error('OpenSCAD not found and no embedded thumbnail in .3mf');
        }
        // create a temporary .scad that imports the 3mf
        let s_path__temp_scad = s_path__3mf + '.preview.scad';
        let s_scad_content = `import("${s_path__3mf}");\n`;
        await Deno.writeTextFile(s_path__temp_scad, s_scad_content);

        try {
            await f_o_render_scad_to_png(s_path__temp_scad, s_path__thumbnail);
        } finally {
            try { await Deno.remove(s_path__temp_scad); } catch { /* ignore */ }
        }
    }

    return { s_path__thumbnail };
}


let f_install_linux_binary = async function(s_name_binary){
    let o_proc__which = new Deno.Command('which', {
        args: [s_name_binary],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_result__which = await o_proc__which.output();
    if (o_result__which.success) {
        let s_path__found = new TextDecoder().decode(o_result__which.stdout).trim();
        console.log(`[f_install_linux_binary] ${s_name_binary} already installed at ${s_path__found}`);
        return;
    }

    console.log(`[f_install_linux_binary] ${s_name_binary} not found, attempting to install...`);

    let o_proc__apt = new Deno.Command('sudo', {
        args: ['apt-get', 'install', '-y', s_name_binary],
        stdout: 'inherit',
        stderr: 'inherit',
    });
    let o_result__apt = await o_proc__apt.output();
    if (o_result__apt.success) {
        console.log(`[f_install_linux_binary] ${s_name_binary} installed via apt-get`);
        return;
    }

    console.error(`[f_install_linux_binary] failed to install ${s_name_binary}`);
}



export {
    f_init_python,
    f_install_linux_binary,
    f_s_path__openscad,
    f_o_run_openscad,
    f_o_render_scad_to_png,
    f_o_render_thumbnail_3mf,
};
