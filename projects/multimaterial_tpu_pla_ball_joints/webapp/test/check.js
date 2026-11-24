// Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
// The checks the tests share, as in the Lichterkette app's tests: no download needed.

let assert = function(b, s_message = 'assertion failed'){
    if(!b){ throw new Error(s_message); }
};
let assertEquals = function(v_a, v_b, s_message = ''){
    let s_a = JSON.stringify(v_a), s_b = JSON.stringify(v_b);
    if(s_a !== s_b){ throw new Error(`${s_message} ${s_a} is not ${s_b}`); }
};
// f throws an error whose message holds s_part.
let assertThrows = function(f, s_part){
    try{
        f();
    } catch(o_error){
        assert(o_error.message.includes(s_part), `threw “${o_error.message}”, not “${s_part}”`);
        return;
    }
    throw new Error(`did not throw “${s_part}”`);
};

export { assert, assertEquals, assertThrows };
