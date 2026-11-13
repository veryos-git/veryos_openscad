let el = function(s_tag, o_prop = {}, a_el__child = []){
    let el_new = document.createElement(s_tag);
    Object.assign(el_new, o_prop);
    for(let el_child of a_el__child){ el_new.append(el_child); }
    return el_new;
};

export { el };
