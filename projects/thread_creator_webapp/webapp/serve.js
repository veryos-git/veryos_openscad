// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// deno task start
//
// Serves this folder to this computer only; the app keeps nothing on the server.
// Takes an optional port: deno task start 8781

import { join, normalize, resolve, sep as SEPARATOR } from 'node:path';

let n_port = Number(Deno.args[0] ?? 8780);
let s_path__root = resolve(decodeURI(new URL('.', import.meta.url).pathname));
let o_s_type__by_extension = {
    html: 'text/html; charset=utf-8',
    js: 'text/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8',
    json: 'application/json'
};

let f_o_response__file = async function(s_path__url){
    let s_path = normalize(join(s_path__root, s_path__url));
    if(s_path !== s_path__root && !s_path.startsWith(s_path__root + SEPARATOR)){
        return new Response('not found', { status: 404 });
    }
    if(s_path__url.endsWith('/')){ s_path = join(s_path, 'index.html'); }
    try{
        let o_file = await Deno.open(s_path, { read: true });
        let o_stat = await o_file.stat();
        if(!o_stat.isFile){
            o_file.close();
            return new Response('not found', { status: 404 });
        }
        let s_extension = s_path.split('.').pop().toLowerCase();
        return new Response(o_file.readable, {
            headers: {
                'content-type': o_s_type__by_extension[s_extension] ?? 'application/octet-stream',
                'content-length': String(o_stat.size),
                'cache-control': 'no-cache'
            }
        });
    } catch(o_error){
        return new Response('not found', { status: 404 });
    }
};

try{
    Deno.serve({
        port: n_port,
        hostname: '127.0.0.1',
        onListen: function(){ console.log(`Thread creator: http://127.0.0.1:${n_port}/`); }
    }, async function(o_request){
        if(o_request.method !== 'GET' && o_request.method !== 'HEAD'){ return new Response('method not allowed', { status: 405 }); }
        let s_path__url;
        try{
            s_path__url = decodeURIComponent(new URL(o_request.url).pathname);
        } catch(o_error){
            return new Response('not found', { status: 404 });
        }
        return f_o_response__file(s_path__url);
    });
} catch(o_error){
    if(!(o_error instanceof Deno.errors.AddrInUse)){ throw o_error; }
    console.error(`Port ${n_port} is taken. The app may be running already; or use another port: deno task start ${n_port + 1}`);
    Deno.exit(1);
}
