// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// deno task start
//
// Serves this folder; the page makes the SVGs itself, so any static web server does as
// well. Takes an optional port: deno task start 8779

import { join } from 'node:path';

let n_port = Number(Deno.args[0] ?? 8778);
let s_path__root = decodeURI(new URL('.', import.meta.url).pathname);
let o_s_type__by_extension = {
    html: 'text/html; charset=utf-8',
    js: 'text/javascript; charset=utf-8'
};

Deno.serve({ hostname: '127.0.0.1', port: n_port }, async function(o_request){
    let s_path = new URL(o_request.url).pathname;
    if(s_path === '/'){ s_path = '/index.html'; }
    let s_type = o_s_type__by_extension[s_path.split('.').pop()];
    try{
        if(!s_type){ throw new Deno.errors.NotFound(); }
        return new Response(await Deno.readFile(join(s_path__root, s_path)), { headers: { 'content-type': s_type, 'cache-control': 'no-store' } });
    } catch(o_error){
        if(o_error instanceof Deno.errors.NotFound){ return new Response('Not found', { status: 404 }); }
        throw o_error;
    }
});
