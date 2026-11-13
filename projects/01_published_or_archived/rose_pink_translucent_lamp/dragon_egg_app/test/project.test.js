// Runs the real server against a folder of its own, and goes through what it can do.

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertEquals = function(v_a, v_b, s_message = ''){
    let s_a = JSON.stringify(v_a), s_b = JSON.stringify(v_b);
    if(s_a !== s_b){ throw new Error(`${s_message} ${s_a} is not ${s_b}`); }
};

let n_port = 18766;
let s_url = `http://127.0.0.1:${n_port}`;

let f_o_server = async function(s_dir){
    let o_process = new Deno.Command('deno', {
        args: ['run', '--allow-net=127.0.0.1', '--allow-read', `--allow-write=${s_dir}`, 'serve.js', String(n_port), s_dir],
        cwd: decodeURI(new URL('../', import.meta.url).pathname),
        stdout: 'null', stderr: 'null', env: { NO_PROXY: '127.0.0.1' }
    }).spawn();
    for(let n_it = 0; n_it < 100; n_it++){
        try{
            await (await fetch(`${s_url}/api/project`)).body?.cancel();
            return o_process;
        } catch(o_error){
            await new Promise(function(f){ setTimeout(f, 100); });
        }
    }
    throw new Error('the server did not start');
};

let f_o_call = async function(s_method, s_path, v_body, o_header = {}){
    let o_response = await fetch(`${s_url}${s_path}`, {
        method: s_method,
        headers: v_body === undefined ? o_header : { 'content-type': 'application/json', ...o_header },
        body: v_body === undefined ? undefined : (typeof v_body === 'string' ? v_body : JSON.stringify(v_body))
    });
    let s_text = await o_response.text();
    return { n_status: o_response.status, v: s_text ? JSON.parse(s_text) : null };
};

Deno.test({ name: 'lamps can be created, read, changed and deleted', sanitizeResources: false, sanitizeOps: false, fn: async function(t){
    let s_dir = await Deno.makeTempDir();
    let o_server = await f_o_server(s_dir);
    let f_a_s_file = function(){ return [...Deno.readDirSync(s_dir)].map(o => o.name).sort(); };
    let o_param = { n_id__pattern: 37, n_mm__relief: 2 };
    try{
        await t.step('starts empty', async function(){
            assertEquals(await f_o_call('GET', '/api/project'), { n_status: 200, v: [] });
        });
        let o_first;
        await t.step('create', async function(){
            let o = await f_o_call('POST', '/api/project', { s_name: '  Rose egg ', o_param, n_mm__cell_export: 0.3 });
            assertEquals(o.n_status, 201);
            o_first = o.v;
            assertEquals(o_first.n_id, 1);
            assertEquals(o_first.s_name, 'Rose egg', 'the name is trimmed');
            assertEquals(o_first.o_param, o_param);
            assertEquals(o_first.n_mm__cell_export, 0.3);
            assertEquals(f_a_s_file(), ['1.json']);
            assertEquals(JSON.parse(Deno.readTextFileSync(`${s_dir}/1.json`)).s_name, 'Rose egg', 'it is on disk');
        });
        await t.step('a second one gets its own id, and the list has both, latest first', async function(){
            await new Promise(function(f){ setTimeout(f, 5); });
            let o = await f_o_call('POST', '/api/project', { s_name: 'Second', o_param });
            assertEquals(o.v.n_id, 2);
            let a_o = (await f_o_call('GET', '/api/project')).v;
            assertEquals(a_o.map(o_project => o_project.n_id), [2, 1]);
        });
        await t.step('read', async function(){
            assertEquals((await f_o_call('GET', '/api/project/1')).v, o_first);
        });
        await t.step('change settings, then the name, keeping the rest', async function(){
            await new Promise(function(f){ setTimeout(f, 5); });
            let o_param__new = { n_id__pattern: 2, n_mm__relief: 3.5 };
            let o = await f_o_call('PUT', '/api/project/1', { o_param: o_param__new });
            assertEquals(o.n_status, 200);
            assertEquals(o.v.o_param, o_param__new);
            assertEquals(o.v.s_name, 'Rose egg');
            assert(o.v.n_ms__updated > o_first.n_ms__updated, 'updated time moves');
            assertEquals(o.v.n_ms__created, o_first.n_ms__created, 'created time stays');
            let o_named = await f_o_call('PUT', '/api/project/1', { s_name: 'Ruby egg' });
            assertEquals(o_named.v.s_name, 'Ruby egg');
            assertEquals(o_named.v.o_param, o_param__new);
            assertEquals(f_a_s_file(), ['1.json', '2.json'], 'no temporary file stays behind');
        });
        await t.step('the request cannot move a lamp to another id', async function(){
            let o = await f_o_call('PUT', '/api/project/1', { n_id: 2, n_ms__created: 0, s_extra: 'x' });
            assertEquals(o.v.n_id, 1);
            assert(o.v.n_ms__created > 0);
            assert(!('s_extra' in o.v), 'unknown fields are not stored');
            assertEquals((await f_o_call('GET', '/api/project/2')).v.s_name, 'Second');
        });
        await t.step('delete', async function(){
            let o = await f_o_call('DELETE', '/api/project/1');
            assertEquals(o.n_status, 204);
            assertEquals(f_a_s_file(), ['2.json']);
            assertEquals((await f_o_call('GET', '/api/project')).v.map(o_project => o_project.n_id), [2]);
        });
        await t.step('what is gone answers 404, with a message', async function(){
            for(let [s_method, v_body] of [['GET'], ['PUT', { s_name: 'x' }], ['DELETE']]){
                let o = await f_o_call(s_method, '/api/project/1', v_body);
                assertEquals(o.n_status, 404, s_method);
                assert(/does not exist/.test(o.v.s_message), s_method);
            }
            assertEquals(f_a_s_file(), ['2.json'], 'changing a lamp that is gone must not bring it back');
        });
        await t.step('bad input is refused and stores nothing', async function(){
            for(let v_body of [
                { o_param },
                { s_name: 'no settings' },
                { s_name: '   ', o_param },
                { s_name: 7, o_param },
                { s_name: 'x'.repeat(81), o_param },
                { s_name: 'x', o_param: 'nope' },
                { s_name: 'x', o_param: [1] },
                { s_name: 'x', o_param, n_mm__cell_export: -1 },
                [1, 2],
                'not json'
            ]){
                let o = await f_o_call('POST', '/api/project', v_body);
                assertEquals(o.n_status, 400, JSON.stringify(v_body));
                assert(o.v.s_message.length > 0);
            }
            assertEquals((await f_o_call('POST', '/api/project', { s_name: 'x', o_param: { v: 'y'.repeat(300000) } })).n_status, 400, 'too large');
            assertEquals(f_a_s_file(), ['2.json']);
        });
        await t.step('an id cannot leave the folder', async function(){
            Deno.writeTextFileSync(`${s_dir}/secret.json`, '{}');
            for(let s_path of ['/api/project/..%2Fsecret', '/api/project/secret', '/api/project/1.5', '/api/project/-1', '/api/project/2/x']){
                assertEquals((await f_o_call('GET', s_path)).n_status, 404, s_path);
                assertEquals((await f_o_call('DELETE', s_path)).n_status, 404, s_path);
            }
            Deno.removeSync(`${s_dir}/secret.json`);
        });
        await t.step('another site cannot use it from your browser', async function(){
            let o_evil = { origin: 'https://evil.example' };
            assertEquals((await f_o_call('DELETE', '/api/project/2', undefined, o_evil)).n_status, 403);
            assertEquals((await f_o_call('POST', '/api/project', { s_name: 'x', o_param }, o_evil)).n_status, 403);
            assertEquals((await f_o_call('GET', '/api/project', undefined, o_evil)).n_status, 403);
            let o_plain = await fetch(`${s_url}/api/project`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ s_name: 'x', o_param }) });
            assertEquals(o_plain.status, 400, 'a form post cannot pass for JSON');
            await o_plain.body?.cancel();
            assertEquals(f_a_s_file(), ['2.json']);
            assertEquals((await f_o_call('GET', '/api/project', undefined, { origin: s_url })).n_status, 200, 'the app itself still can');
        });
        await t.step('a damaged file does not take the list down', async function(){
            Deno.writeTextFileSync(`${s_dir}/99.json`, '{ broken');
            let o = await f_o_call('GET', '/api/project');
            assertEquals(o.n_status, 200);
            assertEquals(o.v.map(o_project => o_project.n_id), [2]);
            Deno.removeSync(`${s_dir}/99.json`);
        });
        await t.step('static files still work, and stay inside the project', async function(){
            let f_n = async function(s_path){
                let o_response = await fetch(`${s_url}${s_path}`);
                await o_response.body?.cancel();
                return o_response.status;
            };
            assertEquals(await f_n('/dragon_egg_app/index.html'), 200);
            assertEquals(await f_n('/Tileable/MG-Tile%20Scale%20(1).png'), 200);
            assertEquals(await f_n('/..%2F..%2Freadme.md'), 404);
        });
    } finally {
        o_server.kill();
        await o_server.status;
        await Deno.remove(s_dir, { recursive: true });
    }
} });
