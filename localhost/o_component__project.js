// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { o_state, o_wsmsg__syncdata, f_send_wsmsg_with_response } from './index.js';

import {
    f_o_html_from_o_js,
} from "./lib/handyhelpers.js"

import {
    a_o_model,
    o_model__o_project,
    f_s_name_table__from_o_model,
    s_name_prop_id,
    f_o_wsmsg,
    o_wsmsg__upload_file,
    o_wsmsg__run_openscad,
    o_wsmsg__render_thumbnail_3mf,
} from './constructors.js';

let s_name_table__project = f_s_name_table__from_o_model(o_model__o_project);

let o_component__project = {
    name: 'component-project',
    template: (await f_o_html_from_o_js({
        class: "o_project_manager",
        a_o: [
            // header bar
            {
                class: "o_project_manager__header",
                a_o: [
                    {
                        s_tag: "h2",
                        innerText: "OpenSCAD Project Manager",
                    },
                    {
                        s_tag: "div",
                        class: "interactable o_btn__create",
                        'v-on:click': "f_create_project",
                        innerText: "+ New Project",
                    },
                ]
            },
            // project list (card grid)
            {
                class: "o_project_list",
                'v-if': "!o_project__selected",
                a_o: [
                    {
                        s_tag: "div",
                        'v-if': "a_o_project.length === 0",
                        class: "o_empty_state",
                        innerText: "No projects yet. Click '+ New Project' to get started.",
                    },
                    {
                        s_tag: "div",
                        class: "o_project_card interactable",
                        'v-for': "o_project in a_o_project",
                        'v-on:click': "f_select_project(o_project)",
                        a_o: [
                            {
                                s_tag: "div",
                                class: "o_project_card__thumbnail",
                                a_o: [
                                    {
                                        s_tag: "img",
                                        'v-if': "o_project.s_path__thumbnail",
                                        ':src': "'/api/file?path=' + encodeURIComponent(o_project.s_path__thumbnail)",
                                        ':alt': "o_project.s_title",
                                    },
                                    {
                                        s_tag: "div",
                                        'v-else': "",
                                        class: "o_placeholder_thumbnail",
                                        innerText: "No thumbnail",
                                    },
                                ]
                            },
                            {
                                class: "o_project_card__info",
                                a_o: [
                                    {
                                        s_tag: "div",
                                        class: "o_project_card__title",
                                        innerText: "{{ o_project.s_title || 'Untitled' }}",
                                    },
                                    {
                                        s_tag: "div",
                                        class: "o_project_card__status",
                                        ':class': "o_project.s_status || 'draft'",
                                        innerText: "{{ o_project.s_status || 'draft' }}",
                                    },
                                    {
                                        s_tag: "div",
                                        class: "o_project_card__file_indicator",
                                        a_o: [
                                            {
                                                s_tag: "span",
                                                ':class': "{ active: o_project.s_path__scad }",
                                                innerText: ".scad",
                                            },
                                            {
                                                s_tag: "span",
                                                ':class': "{ active: o_project.s_path__3mf }",
                                                innerText: ".3mf",
                                            },
                                            {
                                                s_tag: "span",
                                                ':class': "{ active: o_project.s_path__thumbnail }",
                                                innerText: "photo",
                                            },
                                        ]
                                    },
                                ]
                            },
                        ]
                    },
                ]
            },
            // project detail/edit view
            {
                class: "o_project_detail",
                'v-if': "o_project__selected",
                a_o: [
                    // back button
                    {
                        s_tag: "div",
                        class: "interactable o_btn__back",
                        'v-on:click': "o_project__selected = null",
                        innerText: "< Back to projects",
                    },
                    // title
                    {
                        class: "o_field",
                        a_o: [
                            { s_tag: "label", innerText: "Title" },
                            {
                                s_tag: "input",
                                type: "text",
                                ':value': "o_project__selected.s_title",
                                'v-on:change': "f_update_field('s_title', $event.target.value)",
                                placeholder: "Project title for marketplace",
                            },
                        ]
                    },
                    // status
                    {
                        class: "o_field",
                        a_o: [
                            { s_tag: "label", innerText: "Status" },
                            {
                                s_tag: "select",
                                ':value': "o_project__selected.s_status",
                                'v-on:change': "f_update_field('s_status', $event.target.value)",
                                a_o: [
                                    { s_tag: "option", value: "draft", innerText: "Draft" },
                                    { s_tag: "option", value: "ready", innerText: "Ready" },
                                    { s_tag: "option", value: "published", innerText: "Published" },
                                ]
                            },
                        ]
                    },
                    // description
                    {
                        class: "o_field",
                        a_o: [
                            { s_tag: "label", innerText: "Description" },
                            {
                                s_tag: "textarea",
                                ':value': "o_project__selected.s_description",
                                'v-on:change': "f_update_field('s_description', $event.target.value)",
                                placeholder: "Marketplace description...",
                                rows: "5",
                            },
                        ]
                    },
                    // hashtags
                    {
                        class: "o_field",
                        a_o: [
                            { s_tag: "label", innerText: "Hashtags (comma-separated)" },
                            {
                                s_tag: "input",
                                type: "text",
                                ':value': "o_project__selected.s_hashtag",
                                'v-on:change': "f_update_field('s_hashtag', $event.target.value)",
                                placeholder: "#openscad, #3dprinting, #parametric",
                            },
                        ]
                    },
                    // file section
                    {
                        class: "o_file_section",
                        a_o: [
                            { s_tag: "h3", innerText: "Files" },
                            // .scad file
                            {
                                class: "o_file_row",
                                a_o: [
                                    {
                                        class: "o_file_row__label",
                                        a_o: [
                                            { s_tag: "span", class: "o_file_type", innerText: ".scad" },
                                            { s_tag: "span", class: "o_file_desc", innerText: "OpenSCAD parametric script" },
                                        ]
                                    },
                                    {
                                        s_tag: "div",
                                        class: "o_file_row__path",
                                        'v-if': "o_project__selected.s_path__scad",
                                        innerText: "{{ o_project__selected.s_path__scad }}",
                                    },
                                    {
                                        s_tag: "input",
                                        type: "file",
                                        accept: ".scad",
                                        'v-on:change': "f_upload_file($event, 'scad')",
                                        ':id': "'file_scad_' + o_project__selected.n_id",
                                        style: "display:none",
                                    },
                                    {
                                        s_tag: "label",
                                        class: "interactable o_btn__upload",
                                        ':for': "'file_scad_' + o_project__selected.n_id",
                                        innerText: "{{ o_project__selected.s_path__scad ? 'Replace' : 'Upload' }}",
                                    },
                                    {
                                        s_tag: "div",
                                        class: "interactable o_btn__action",
                                        'v-if': "o_project__selected.s_path__scad",
                                        'v-on:click': "f_run_openscad",
                                        innerText: "Generate .stl",
                                    },
                                ]
                            },
                            // .3mf file
                            {
                                class: "o_file_row",
                                a_o: [
                                    {
                                        class: "o_file_row__label",
                                        a_o: [
                                            { s_tag: "span", class: "o_file_type", innerText: ".3mf" },
                                            { s_tag: "span", class: "o_file_desc", innerText: "Pre-sliced model file" },
                                        ]
                                    },
                                    {
                                        s_tag: "div",
                                        class: "o_file_row__path",
                                        'v-if': "o_project__selected.s_path__3mf",
                                        innerText: "{{ o_project__selected.s_path__3mf }}",
                                    },
                                    {
                                        s_tag: "input",
                                        type: "file",
                                        accept: ".3mf",
                                        'v-on:change': "f_upload_file($event, '3mf')",
                                        ':id': "'file_3mf_' + o_project__selected.n_id",
                                        style: "display:none",
                                    },
                                    {
                                        s_tag: "label",
                                        class: "interactable o_btn__upload",
                                        ':for': "'file_3mf_' + o_project__selected.n_id",
                                        innerText: "{{ o_project__selected.s_path__3mf ? 'Replace' : 'Upload' }}",
                                    },
                                    {
                                        s_tag: "div",
                                        class: "interactable o_btn__action",
                                        'v-if': "o_project__selected.s_path__3mf",
                                        'v-on:click': "f_render_thumbnail_3mf",
                                        innerText: "Render preview",
                                    },
                                ]
                            },
                            // .stl file (generated, read-only)
                            {
                                class: "o_file_row",
                                'v-if': "o_project__selected.s_path__stl",
                                a_o: [
                                    {
                                        class: "o_file_row__label",
                                        a_o: [
                                            { s_tag: "span", class: "o_file_type", innerText: ".stl" },
                                            { s_tag: "span", class: "o_file_desc", innerText: "Generated mesh (from .scad)" },
                                        ]
                                    },
                                    {
                                        s_tag: "div",
                                        class: "o_file_row__path",
                                        innerText: "{{ o_project__selected.s_path__stl }}",
                                    },
                                ]
                            },
                            // thumbnail photo
                            {
                                class: "o_file_row",
                                a_o: [
                                    {
                                        class: "o_file_row__label",
                                        a_o: [
                                            { s_tag: "span", class: "o_file_type", innerText: "Photo" },
                                            { s_tag: "span", class: "o_file_desc", innerText: "Real-life photo / thumbnail" },
                                        ]
                                    },
                                    {
                                        s_tag: "input",
                                        type: "file",
                                        accept: "image/*",
                                        'v-on:change': "f_upload_file($event, 'thumbnail')",
                                        ':id': "'file_thumb_' + o_project__selected.n_id",
                                        style: "display:none",
                                    },
                                    {
                                        s_tag: "label",
                                        class: "interactable o_btn__upload",
                                        ':for': "'file_thumb_' + o_project__selected.n_id",
                                        innerText: "{{ o_project__selected.s_path__thumbnail ? 'Replace' : 'Upload' }}",
                                    },
                                ]
                            },
                            // thumbnail preview
                            {
                                class: "o_thumbnail_preview",
                                'v-if': "o_project__selected.s_path__thumbnail",
                                a_o: [
                                    {
                                        s_tag: "img",
                                        ':src': "'/api/file?path=' + encodeURIComponent(o_project__selected.s_path__thumbnail)",
                                        ':alt': "o_project__selected.s_title + ' thumbnail'",
                                    },
                                ]
                            },
                        ]
                    },
                    // scad code viewer
                    {
                        class: "o_scad_viewer",
                        'v-if': "o_project__selected.s_path__scad",
                        a_o: [
                            {
                                class: "o_scad_viewer__header",
                                a_o: [
                                    { s_tag: "h3", innerText: ".scad source" },
                                    {
                                        class: "o_scad_viewer__action",
                                        a_o: [
                                            {
                                                s_tag: "div",
                                                class: "interactable o_btn__action",
                                                'v-on:click': "f_load_scad_code",
                                                'v-if': "!s_scad_code",
                                                innerText: "Load code",
                                            },
                                            {
                                                s_tag: "div",
                                                class: "interactable o_btn__action",
                                                'v-on:click': "f_load_scad_code",
                                                'v-if': "s_scad_code",
                                                innerText: "Reload",
                                            },
                                            {
                                                s_tag: "div",
                                                class: "interactable o_btn__upload",
                                                'v-on:click': "f_copy_scad_code",
                                                'v-if': "s_scad_code",
                                                innerText: "{{ b_copied ? 'Copied!' : 'Copy' }}",
                                            },
                                        ]
                                    },
                                ]
                            },
                            {
                                s_tag: "pre",
                                class: "o_scad_code",
                                'v-if': "s_scad_code",
                                a_o: [
                                    {
                                        s_tag: "code",
                                        innerText: "{{ s_scad_code }}",
                                    },
                                ]
                            },
                        ]
                    },
                    // marketplace preview
                    {
                        class: "o_marketplace_preview",
                        a_o: [
                            { s_tag: "h3", innerText: "Marketplace Preview" },
                            {
                                class: "o_preview_card",
                                a_o: [
                                    {
                                        s_tag: "div",
                                        class: "o_preview_title",
                                        innerText: "{{ o_project__selected.s_title || 'Untitled Project' }}",
                                    },
                                    {
                                        s_tag: "div",
                                        class: "o_preview_description",
                                        innerText: "{{ o_project__selected.s_description || 'No description yet.' }}",
                                    },
                                    {
                                        s_tag: "div",
                                        class: "o_preview_hashtag",
                                        'v-if': "o_project__selected.s_hashtag",
                                        innerText: "{{ o_project__selected.s_hashtag }}",
                                    },
                                ]
                            },
                        ]
                    },
                    // danger zone
                    {
                        class: "o_danger_zone",
                        a_o: [
                            {
                                s_tag: "div",
                                class: "interactable o_btn__delete",
                                'v-on:click': "f_delete_project",
                                innerText: "Delete Project",
                            },
                        ]
                    },
                ]
            },
        ]
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            o_project__selected: null,
            s_scad_code: '',
            b_copied: false,
        };
    },
    computed: {
        a_o_project: function() {
            return o_state[s_name_table__project] || [];
        },
    },
    methods: {
        f_create_project: async function() {
            let o_self = this;
            let o_result = await o_wsmsg__syncdata.f_v_sync({
                s_name_table: s_name_table__project,
                s_operation: 'create',
                o_data: {
                    s_title: 'New Project',
                    s_description: '',
                    s_hashtag: '',
                    s_status: 'draft',
                    s_path__scad: '',
                    s_path__3mf: '',
                    s_path__stl: '',
                    s_path__thumbnail: '',
                }
            });
            o_self.o_project__selected = o_result;
        },
        f_select_project: function(o_project) {
            this.o_project__selected = o_project;
            this.s_scad_code = '';
            this.b_copied = false;
        },
        f_load_scad_code: async function() {
            let o_self = this;
            let s_path = o_self.o_project__selected.s_path__scad;
            if (!s_path) return;
            let o_resp = await fetch('/api/file?path=' + encodeURIComponent(s_path));
            if (!o_resp.ok) {
                o_self.s_scad_code = '// Failed to load file';
                return;
            }
            o_self.s_scad_code = await o_resp.text();
            o_self.b_copied = false;
        },
        f_copy_scad_code: async function() {
            let o_self = this;
            await navigator.clipboard.writeText(o_self.s_scad_code);
            o_self.b_copied = true;
            setTimeout(function() { o_self.b_copied = false; }, 2000);
        },
        f_update_field: async function(s_field, v_val) {
            let o_self = this;
            await o_wsmsg__syncdata.f_v_sync({
                s_name_table: s_name_table__project,
                s_operation: 'update',
                o_data: { n_id: o_self.o_project__selected.n_id, [s_field]: v_val }
            });
            o_self.o_project__selected[s_field] = v_val;
        },
        f_delete_project: async function() {
            let o_self = this;
            if (!confirm('Delete this project and all its files?')) return;
            await o_wsmsg__syncdata.f_v_sync({
                s_name_table: s_name_table__project,
                s_operation: 'delete',
                o_data: { n_id: o_self.o_project__selected.n_id }
            });
            o_self.o_project__selected = null;
        },
        f_upload_file: async function(o_evt, s_type) {
            let o_self = this;
            let o_file = o_evt.target.files[0];
            if (!o_file) return;

            let o_reader = new FileReader();
            o_reader.onload = async function() {
                let s_base64 = o_reader.result.split(',')[1];
                let o_resp = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__upload_file.s_name, {
                        n_o_project_n_id: o_self.o_project__selected.n_id,
                        s_type: s_type,
                        s_name_file: o_file.name,
                        s_base64: s_base64,
                    })
                );
                if (o_resp.v_result && o_resp.v_result.s_path) {
                    let s_field = 's_path__' + s_type;
                    await o_self.f_update_field(s_field, o_resp.v_result.s_path);
                }
            };
            o_reader.readAsDataURL(o_file);
        },
        f_run_openscad: async function() {
            let o_self = this;
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__run_openscad.s_name, {
                    n_o_project_n_id: o_self.o_project__selected.n_id,
                    s_path__scad: o_self.o_project__selected.s_path__scad,
                })
            );
            if (o_resp.v_result && o_resp.v_result.s_path__stl) {
                await o_self.f_update_field('s_path__stl', o_resp.v_result.s_path__stl);
            }
        },
        f_render_thumbnail_3mf: async function() {
            let o_self = this;
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__render_thumbnail_3mf.s_name, {
                    n_o_project_n_id: o_self.o_project__selected.n_id,
                    s_path__3mf: o_self.o_project__selected.s_path__3mf,
                })
            );
            if (o_resp.v_result && o_resp.v_result.s_path__thumbnail) {
                await o_self.f_update_field('s_path__thumbnail', o_resp.v_result.s_path__thumbnail);
            }
        },
    },
};

export { o_component__project };
