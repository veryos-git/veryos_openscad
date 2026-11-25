// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The saved projects through the server, in a folder made for the test: save, read,
// save again, delete, and what is refused.
import { assertEquals, assert } from './check.js';

let n_port = 18778;
let s_url = `http://127.0.0.1:${n_port}`;

let f_o_call = async function(s_method, s_path, v_body, o_header = {}){
    let o_response = await fetch(`${s_url}${s_path}`, {
        method: s_method, headers: o_header, body: v_body === undefined || typeof v_body === 'string' ? v_body : JSON.stringify(v_body)
    });
    return { n_status: o_response.status, v: o_response.status === 204 ? null : await o_response.json() };
};

Deno.test({ name: 'server keeps the projects', sanitizeResources: false, sanitizeOps: false, fn: async function(){
    let s_dir = await Deno.makeTempDir();
    let o_process = new Deno.Command(Deno.execPath(), {
        args: ['run', '--allow-all', new URL('../serve.js', import.meta.url).pathname, String(n_port), s_dir],
        stdout: 'piped', stderr: 'inherit'
    }).spawn();
    let f_a_s_file = function(s_name){ return [...Deno.readDirSync(`${s_dir}/${s_name}`)].map(function(o_entry){ return o_entry.name; }); };
    try{
        // the server prints its line once OpenSCAD is found and it listens
        let o_reader = o_process.stdout.pipeThrough(new TextDecoderStream()).getReader();
        let s_out = '';
        while(!s_out.includes('http://')){ s_out += (await o_reader.read()).value ?? ''; }
        o_reader.releaseLock();

        let o_project = {
            o_setting: { sheet_x: 100, light: 'puck', logo: false },
            n_mm__frame: 6, n_transmission: 0.45, s_colour: '#ffe7c4', n_brightness: 4, n_room: 0.04,
            a_o_sheet: [
                { s_name: 'hill', s_mode: 'solid', n_mm__thickness: 0.4, s_svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 10L5 0L10 10Z"/></svg>', n_mm__x: 0, n_mm__y: 1.5, n_mm__width: 100 },
                { s_name: 'paper', s_mode: 'cut', n_mm__thickness: 0.2, s_svg: '', n_mm__x: 0, n_mm__y: 0, n_mm__width: 0 }
            ]
        };
        assertEquals(await f_o_call('GET', '/api/project'), { n_status: 200, v: [] });

        // saved under its name, as text git can track; what else was sent is not kept
        let o_more = { ...o_project, v_more: 1, a_o_sheet: o_project.a_o_sheet.map(function(o_sheet){ return { ...o_sheet, o_art: {} }; }) };
        assertEquals(await f_o_call('POST', '/api/project/Hill%20at%20night', o_more), { n_status: 201, v: { s_name: 'Hill at night' } });
        assertEquals(Deno.readTextFileSync(`${s_dir}/Hill at night/project.json`), JSON.stringify(o_project, null, 2) + '\n');
        assertEquals((await f_o_call('POST', '/api/project/Hill%20at%20night', o_project)).n_status, 409, 'a name is taken once');
        assertEquals((await f_o_call('POST', '/api/project/Alps', o_project)).n_status, 201);
        assertEquals(await f_o_call('GET', '/api/project/Alps'), { n_status: 200, v: o_project });
        assertEquals(await f_o_call('GET', '/api/project'), { n_status: 200, v: ['Alps', 'Hill at night'] });
        assertEquals((await f_o_call('GET', '/api/project/Nothing')).n_status, 404);

        // saved again: changed, the same bytes for the same project, nothing left beside it
        let o_changed = { ...o_project, n_mm__frame: 8, a_o_sheet: [o_project.a_o_sheet[1]] };
        assertEquals(await f_o_call('PUT', '/api/project/Alps', o_changed), { n_status: 200, v: { s_name: 'Alps' } });
        assertEquals((await f_o_call('GET', '/api/project/Alps')).v, o_changed);
        let s_first = Deno.readTextFileSync(`${s_dir}/Alps/project.json`);
        await f_o_call('PUT', '/api/project/Alps', o_changed);
        assertEquals(Deno.readTextFileSync(`${s_dir}/Alps/project.json`), s_first);
        assertEquals(f_a_s_file('Alps'), ['project.json']);
        let o_gone = await f_o_call('PUT', '/api/project/Nothing', o_project);
        assertEquals([o_gone.n_status, o_gone.v.s_message], [404, 'The project “Nothing” does not exist any more.']);

        // a folder without its file is no project
        Deno.mkdirSync(`${s_dir}/Empty`);
        assertEquals((await f_o_call('GET', '/api/project')).v, ['Alps', 'Hill at night']);

        for(let [s_method, s_path, v_body, n_status, s_message, o_header] of [
            ['POST', '/api/project/a.b', o_project, 400, 'not a valid name'],
            ['POST', '/api/project/..%2F..%2Fserve', o_project, 400, 'not a valid name'],
            ['GET', '/api/project/..%2FAlps', undefined, 400, 'not a valid name'],
            ['POST', `/api/project/${'x'.repeat(65)}`, o_project, 400, 'not a valid name'],
            ['POST', '/api/project/New', '{', 400, 'expected JSON'],
            ['POST', '/api/project/New', { ...o_project, a_o_sheet: [] }, 400, 'needs o_setting and a_o_sheet'],
            ['POST', '/api/project/New', { ...o_project, o_setting: null }, 400, 'needs o_setting and a_o_sheet'],
            ['POST', '/api/project/New', { ...o_project, a_o_sheet: [{ ...o_project.a_o_sheet[0], s_svg: 1 }] }, 400, 's_svg must be a string'],
            ['POST', '/api/project/New', { ...o_project, a_o_sheet: [{ ...o_project.a_o_sheet[0], n_mm__thickness: '0.4' }] }, 400, 'n_mm__thickness must be a number'],
            ['POST', '/api/project/New', { ...o_project, s_colour: undefined }, 400, 's_colour must be a string'],
            // the script's settings as for a render
            ['POST', '/api/project/New', { ...o_project, o_setting: { sheet_x: 9 } }, 400, 'from 70 to 300'],
            ['POST', '/api/project/New', { ...o_project, o_setting: { 'x=1;y': 2 } }, 400, 'no setting'],
            ['PUT', '/api/project/Alps', { ...o_project, o_setting: { light: 'sun' } }, 400, 'one of'],
            ['POST', '/api/project/New', { ...o_project, a_o_sheet: Array(41).fill(o_project.a_o_sheet[1]) }, 400, 'up to 40'],
            ['POST', '/api/project', o_project, 405, 'use GET'],
            ['PATCH', '/api/project/Alps', o_project, 405, 'use GET, POST, PUT or DELETE'],
            // another site's page in the same browser
            ['DELETE', '/api/project/Alps', undefined, 403, 'Only the app itself', { origin: 'http://example.com' }],
            ['GET', '/api/project', undefined, 403, 'Only the app itself', { origin: 'http://example.com' }]
        ]){
            let o = await f_o_call(s_method, s_path, v_body, o_header);
            assertEquals(o.n_status, n_status, `${s_method} ${s_path} ${JSON.stringify(o.v)}`);
            assert(o.v.s_message.includes(s_message), `${o.v.s_message} has no ${s_message}`);
        }
        // nothing of what was refused is on disk
        assertEquals([...Deno.readDirSync(s_dir)].map(function(o_entry){ return o_entry.name; }).sort(), ['Alps', 'Empty', 'Hill at night']);
        assertEquals((await f_o_call('GET', '/api/project/Alps')).v, o_changed);

        // deleted with its folder
        assertEquals(await f_o_call('DELETE', '/api/project/Alps'), { n_status: 204, v: null });
        assertEquals((await f_o_call('DELETE', '/api/project/Alps')).n_status, 404);
        assertEquals((await f_o_call('GET', '/api/project')).v, ['Hill at night']);
        assertEquals([...Deno.readDirSync(s_dir)].map(function(o_entry){ return o_entry.name; }).sort(), ['Empty', 'Hill at night']);
    } finally{
        o_process.kill();
        await o_process.status;
        await Deno.remove(s_dir, { recursive: true });
    }
} });
