// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// Headless Chrome for the page's checks, see page_check.js: the app's server on a port
// of its own with a folder of its own for the projects, a browser with an empty profile, and one page spoken to over Chrome's
// DevTools protocol. The pointer's presses and moves are Chrome's own, at places of the
// window in pixels.

let f_wait = function(n_ms){ return new Promise(function(f_resolve){ setTimeout(f_resolve, n_ms); }); };

// A page of the app. f_v gives what a JavaScript expression is worth in the page;
// a_s_error collects what goes wrong in it.
let f_o_page = async function({ n_port = 8779, n_px__x = 1500, n_px__y = 950 } = {}){
    let s_path__work = await Deno.makeTempDir({ prefix: 'paper_print_cut_' });
    let o_server = new Deno.Command(Deno.execPath(), {
        args: ['run', '--allow-net=127.0.0.1', '--allow-read', `--allow-write=${s_path__work}/project`, new URL('../serve.js', import.meta.url).pathname, String(n_port), `${s_path__work}/project`],
        stdout: 'null', stderr: 'null'
    }).spawn();
    let o_chrome = new Deno.Command('google-chrome', {
        args: ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${s_path__work}/profile`, 'about:blank'],
        stdout: 'null', stderr: 'null'
    }).spawn();
    // Chrome writes the port it listens on into its profile
    let s_port = '';
    for(let n_try = 0; n_try < 100 && !s_port; n_try++){
        await f_wait(100);
        s_port = await Deno.readTextFile(`${s_path__work}/profile/DevToolsActivePort`).then(function(s){ return s.split('\n')[0]; }, function(){ return ''; });
    }
    let o_version = await (await fetch(`http://127.0.0.1:${s_port}/json/version`)).json();
    let o_socket = new WebSocket(o_version.webSocketDebuggerUrl);
    await new Promise(function(f_resolve, f_reject){
        o_socket.onopen = f_resolve;
        o_socket.onerror = f_reject;
    });
    let n_id = 0;
    let o_a_f__by_id = {};
    let a_f__event = [];
    o_socket.onmessage = function(o_event){
        let o_message = JSON.parse(o_event.data);
        if(!o_message.id){
            for(let f of a_f__event){ f(o_message); }
            return;
        }
        let [f_resolve, f_reject] = o_a_f__by_id[o_message.id];
        delete o_a_f__by_id[o_message.id];
        if(o_message.error){ f_reject(new Error(o_message.error.message)); } else { f_resolve(o_message.result); }
    };
    let s_session;
    let f_send = function(s_method, o_param = {}){
        return new Promise(function(f_resolve, f_reject){
            o_a_f__by_id[++n_id] = [f_resolve, f_reject];
            o_socket.send(JSON.stringify({ id: n_id, method: s_method, params: o_param, sessionId: s_session }));
        });
    };
    await f_send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: s_path__work });
    let { targetId: s_target } = await f_send('Target.createTarget', { url: 'about:blank' });
    s_session = (await f_send('Target.attachToTarget', { targetId: s_target, flatten: true })).sessionId;

    let o_page = { a_s_error: [], s_path__work, s_url: `http://127.0.0.1:${n_port}`, f_send, f_wait };
    // a confirm() is answered with yes
    a_f__event.push(function(o_message){
        let o_param = o_message.params;
        if(o_message.method === 'Runtime.exceptionThrown'){ o_page.a_s_error.push(o_param.exceptionDetails.exception?.description ?? o_param.exceptionDetails.text); }
        if(o_message.method === 'Runtime.consoleAPICalled' && o_param.type === 'error'){ o_page.a_s_error.push(o_param.args.map(function(o){ return o.value ?? o.description; }).join(' ')); }
        if(o_message.method === 'Log.entryAdded' && o_param.entry.level === 'error'){ o_page.a_s_error.push(o_param.entry.text); }
        if(o_message.method === 'Page.javascriptDialogOpening'){ f_send('Page.handleJavaScriptDialog', { accept: true }); }
    });
    for(let s_domain of ['Page', 'Runtime', 'Log', 'DOM']){ await f_send(`${s_domain}.enable`); }

    o_page.f_v = async function(s_expression){
        let o_result = await f_send('Runtime.evaluate', { expression: s_expression, awaitPromise: true, returnByValue: true });
        if(o_result.exceptionDetails){ throw new Error(`${o_result.exceptionDetails.exception?.description ?? o_result.exceptionDetails.text}\nin: ${s_expression}`); }
        return o_result.result.value;
    };
    // The window's size in pixels.
    o_page.f_size = async function(n_x, n_y){
        await f_send('Emulation.setDeviceMetricsOverride', { width: n_x, height: n_y, deviceScaleFactor: 1, mobile: false });
        await o_page.f_settle();
    };
    // Two frames on: the page has drawn what the last event changed.
    o_page.f_settle = function(){
        return o_page.f_v('new Promise(function(f){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ setTimeout(f, 20); }); }); })');
    };
    // Opens the app, or loads it anew; done when the page has drawn its sheets.
    o_page.f_open = async function(){
        await f_send('Page.navigate', { url: `http://127.0.0.1:${n_port}/` });
        for(let n_try = 0; n_try < 100; n_try++){
            await f_wait(50);
            if(await o_page.f_v('document.readyState === "complete" && Boolean(document.querySelector(".sheet .line path"))').catch(function(){ return false; })){ break; }
        }
        await o_page.f_settle();
    };
    // The pointer: n_modifier 1 Alt, 2 Ctrl.
    let f_mouse = function(s_type, a_n, o_more = {}){
        return f_send('Input.dispatchMouseEvent', { type: s_type, x: a_n[0], y: a_n[1], button: 'left', buttons: s_type === 'mouseReleased' ? 0 : 1, clickCount: 1, ...o_more });
    };
    o_page.f_move = function(a_n){ return f_mouse('mouseMoved', a_n, { button: 'none', buttons: 0 }); };
    o_page.f_drag = async function(a_n__from, a_n__to, n_modifier = 0){
        await f_mouse('mousePressed', a_n__from, { modifiers: n_modifier });
        for(let n_step = 1; n_step <= 4; n_step++){
            await f_mouse('mouseMoved', [a_n__from[0] + (a_n__to[0] - a_n__from[0]) * n_step / 4, a_n__from[1] + (a_n__to[1] - a_n__from[1]) * n_step / 4], { modifiers: n_modifier });
        }
        await f_mouse('mouseReleased', a_n__to, { modifiers: n_modifier });
        await o_page.f_settle();
    };
    o_page.f_click = function(a_n, n_modifier = 0){ return o_page.f_drag(a_n, a_n, n_modifier); };
    o_page.f_wheel = async function(a_n, n_delta, n_modifier = 0){
        await f_send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: a_n[0], y: a_n[1], deltaX: 0, deltaY: n_delta, modifiers: n_modifier });
        await o_page.f_settle();
    };
    // An element's box in the window: left, top, right, bottom. Brought into view first.
    o_page.f_a_n__box = function(s_selector){
        return o_page.f_v(`(function(){
            let el = document.querySelector(${JSON.stringify(s_selector)});
            el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            let o_rect = el.getBoundingClientRect();
            return [o_rect.left, o_rect.top, o_rect.right, o_rect.bottom];
        })()`);
    };
    // A click with the pointer on an element's middle.
    o_page.f_click_on = async function(s_selector){
        let [n_left, n_top, n_right, n_bottom] = await o_page.f_a_n__box(s_selector);
        await o_page.f_click([(n_left + n_right) / 2, (n_top + n_bottom) / 2]);
    };
    // A field of the settings filled in as typing does.
    o_page.f_fill = async function(s_name, v){
        await o_page.f_v(`(function(){
            let el = document.getElementById('el_panel').elements[${JSON.stringify(s_name)}] ?? document.getElementById(${JSON.stringify(s_name)});
            el.value = ${JSON.stringify(String(v))};
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        })()`);
        await o_page.f_settle();
    };
    // Text typed where the keyboard is, and a key pressed: n_modifier 2 Ctrl.
    o_page.f_type = async function(s_text){
        await f_send('Input.insertText', { text: s_text });
        await o_page.f_settle();
    };
    o_page.f_key = async function(s_key, n_modifier = 0){
        for(let s_type of ['keyDown', 'keyUp']){
            await f_send('Input.dispatchKeyEvent', { type: s_type, key: s_key, code: `Key${s_key.toUpperCase()}`, windowsVirtualKeyCode: s_key.toUpperCase().charCodeAt(0), modifiers: n_modifier });
        }
        await o_page.f_settle();
    };
    // Files chosen in a file field.
    o_page.f_choose = async function(s_selector, a_s_path){
        let { root: o_root } = await f_send('DOM.getDocument');
        let { nodeId: n_node } = await f_send('DOM.querySelector', { nodeId: o_root.nodeId, selector: s_selector });
        await f_send('DOM.setFileInputFiles', { nodeId: n_node, files: a_s_path });
        await f_wait(300);
        await o_page.f_settle();
    };
    o_page.f_screenshot = async function(s_path){
        let { data: s_base64 } = await f_send('Page.captureScreenshot', { format: 'png' });
        await Deno.writeFile(s_path, Uint8Array.from(atob(s_base64), function(s){ return s.charCodeAt(0); }));
    };
    // A PDF's pages at 300 dots per inch: a page each with n_px__x, n_px__y and
    // a_n__rgb, three numbers per dot. Needs pdftoppm.
    o_page.f_a_o_print__pdf = async function(s_path){
        for await(let o_entry of Deno.readDir(s_path__work)){
            if(o_entry.name.endsWith('.ppm')){ await Deno.remove(`${s_path__work}/${o_entry.name}`); }
        }
        await new Deno.Command('pdftoppm', { args: ['-r', '300', s_path, `${s_path__work}/print`] }).output();
        let a_s_name = [];
        for await(let o_entry of Deno.readDir(s_path__work)){
            if(o_entry.name.endsWith('.ppm')){ a_s_name.push(o_entry.name); }
        }
        let a_o_print = [];
        for(let s_name of a_s_name.sort()){
            let a_n = await Deno.readFile(`${s_path__work}/${s_name}`);
            // P6, width, height, 255: four words, each ended by one white space
            let a_s = [];
            let n_at = 0;
            while(a_s.length < 4){
                let n_end = n_at;
                while(![9, 10, 13, 32].includes(a_n[n_end])){ n_end++; }
                a_s.push(new TextDecoder().decode(a_n.subarray(n_at, n_end)));
                n_at = n_end + 1;
            }
            a_o_print.push({ n_px__x: Number(a_s[1]), n_px__y: Number(a_s[2]), a_n__rgb: a_n.subarray(n_at) });
        }
        return a_o_print;
    };
    // The print as Chrome makes it.
    o_page.f_a_o_print = async function(){
        let { data: s_base64 } = await f_send('Page.printToPDF', { preferCSSPageSize: true, printBackground: true });
        await Deno.writeFile(`${s_path__work}/print.pdf`, Uint8Array.from(atob(s_base64), function(s){ return s.charCodeAt(0); }));
        return o_page.f_a_o_print__pdf(`${s_path__work}/print.pdf`);
    };
    // The file a click on an element makes the page hand over, by its name: its bytes,
    // null if none comes.
    o_page.f_a_n__download = async function(s_selector, s_name){
        // Chrome gives a second file of a name another name
        await Deno.remove(`${s_path__work}/${s_name}`).catch(function(){});
        await o_page.f_click_on(s_selector);
        for(let n_try = 0; n_try < 600; n_try++){
            await f_wait(50);
            let a_n = await Deno.readFile(`${s_path__work}/${s_name}`).catch(function(){ return null; });
            if(a_n){
                await o_page.f_settle();
                return a_n;
            }
        }
        return null;
    };
    o_page.f_close = async function(){
        o_socket.close();
        for(let o_process of [o_chrome, o_server]){
            try{ o_process.kill(); } catch(o_error){ /* gone already */ }
            await o_process.status;
        }
        await Deno.remove(s_path__work, { recursive: true }).catch(function(){});
    };
    await o_page.f_size(n_px__x, n_px__y);
    return o_page;
};

// The box around a printed page's dots for which f_b(red, green, blue) holds, in mm from
// the page's top left corner: left, top, right, bottom; null if there are none.
let f_a_n__box = function(o_print, f_b){
    let n_mm__per_px = 25.4 / 300;
    let [n_left, n_top, n_right, n_bottom] = [Infinity, Infinity, -1, -1];
    for(let n_y = 0; n_y < o_print.n_px__y; n_y++){
        for(let n_x = 0; n_x < o_print.n_px__x; n_x++){
            let n_at = 3 * (n_y * o_print.n_px__x + n_x);
            if(!f_b(o_print.a_n__rgb[n_at], o_print.a_n__rgb[n_at + 1], o_print.a_n__rgb[n_at + 2])){ continue; }
            if(n_x < n_left){ n_left = n_x; }
            if(n_x > n_right){ n_right = n_x; }
            if(n_y < n_top){ n_top = n_y; }
            if(n_y > n_bottom){ n_bottom = n_y; }
        }
    }
    return n_right < 0 ? null : [n_left * n_mm__per_px, n_top * n_mm__per_px, (n_right + 1) * n_mm__per_px, (n_bottom + 1) * n_mm__per_px];
};

// A PNG read after the PNG specification, not by a browser: n_px__x, n_px__y and
// a_n__rgb as a printed page has them, and a_n__per_m, what the file says of its size on
// paper: pixels a metre along x and y, and 1 for the metre; undefined if it says none.
// For 8 bits a colour, with or without alpha, not interlaced: what a canvas gives.
let f_o_print__png = async function(a_n){
    let o_view = new DataView(a_n.buffer, a_n.byteOffset, a_n.byteLength);
    let o_print = {};
    let n_channel = 0;
    let a_a_n__data = [];
    for(let n_at = 8; n_at < a_n.length;){
        let n_length = o_view.getUint32(n_at);
        let s_name = String.fromCharCode(...a_n.subarray(n_at + 4, n_at + 8));
        if(s_name === 'IHDR'){
            o_print.n_px__x = o_view.getUint32(n_at + 8);
            o_print.n_px__y = o_view.getUint32(n_at + 12);
            n_channel = { 2: 3, 6: 4 }[a_n[n_at + 17]];
            if(a_n[n_at + 16] !== 8 || !n_channel || a_n[n_at + 20] !== 0){ throw new Error('a PNG of a kind this reader does not read'); }
        }
        if(s_name === 'pHYs'){ o_print.a_n__per_m = [o_view.getUint32(n_at + 8), o_view.getUint32(n_at + 12), a_n[n_at + 16]]; }
        if(s_name === 'IDAT'){ a_a_n__data.push(a_n.subarray(n_at + 8, n_at + 8 + n_length)); }
        n_at += 12 + n_length;
    }
    let a_n__row = new Uint8Array(await new Response(new Blob(a_a_n__data).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    // every row: a byte that says how it is told, then its bytes as differences to the
    // byte a pixel to the left, the one above, or both
    let n_scl__row = 1 + o_print.n_px__x * n_channel;
    o_print.a_n__rgb = new Uint8Array(o_print.n_px__x * o_print.n_px__y * 3);
    for(let n_y = 0; n_y < o_print.n_px__y; n_y++){
        let n_from = n_y * n_scl__row + 1;
        let n_filter = a_n__row[n_from - 1];
        for(let n = 0; n < n_scl__row - 1; n++){
            let n_left = n >= n_channel ? a_n__row[n_from + n - n_channel] : 0;
            let n_up = n_y ? a_n__row[n_from + n - n_scl__row] : 0;
            let n_up_left = n_y && n >= n_channel ? a_n__row[n_from + n - n_scl__row - n_channel] : 0;
            let n_guess = 0;
            if(n_filter === 1){ n_guess = n_left; }
            if(n_filter === 2){ n_guess = n_up; }
            if(n_filter === 3){ n_guess = (n_left + n_up) >> 1; }
            if(n_filter === 4){
                // of the three the one nearest to left + up - up left
                let n_p = n_left + n_up - n_up_left;
                let [n_a, n_b, n_c] = [Math.abs(n_p - n_left), Math.abs(n_p - n_up), Math.abs(n_p - n_up_left)];
                n_guess = n_a <= n_b && n_a <= n_c ? n_left : n_b <= n_c ? n_up : n_up_left;
            }
            a_n__row[n_from + n] = (a_n__row[n_from + n] + n_guess) & 0xFF;
        }
        for(let n_x = 0; n_x < o_print.n_px__x; n_x++){
            for(let n = 0; n < 3; n++){ o_print.a_n__rgb[3 * (n_y * o_print.n_px__x + n_x) + n] = a_n__row[n_from + n_x * n_channel + n]; }
        }
    }
    return o_print;
};

export { f_o_page, f_a_n__box, f_o_print__png, f_wait };
