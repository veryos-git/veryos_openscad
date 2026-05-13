#!/usr/bin/env python3
"""Pack STL files into a Bambu Studio .3mf project: one STL per plate.

Each STL becomes one object on its own labelled build plate. The plate
name is the STL file's stem (e.g. magnet_wall_mount_40x10x3.stl ->
'magnet_wall_mount_40x10x3'). With --template, printer/filament/process
settings are inherited from a reference .3mf saved by Bambu Studio.

Output structure mirrors example_manually_created.3mf so Bambu Studio
opens it as a project, not as 'geometry only'.
"""
import argparse
import json
import sys
import uuid
import zipfile
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

import trimesh

# Bambu A1 mini multi-plate world layout, reverse-engineered from a manually
# saved 30-plate .3mf: plates form a 6-column grid; columns extend in +X,
# rows extend in -Y (towards the printer's front), 215mm stride on both
# axes. Each plate's bed centre = (90 + col*215, 90 - row*215).
BED_W, BED_H = 180.0, 180.0
BED_CX, BED_CY = BED_W / 2, BED_H / 2
PLATE_STRIDE = 215.0
PLATES_PER_ROW = 6


def plate_centre(plate_idx):
    """World-space (x, y) of plate plate_idx's bed centre. 1-indexed."""
    col = (plate_idx - 1) % PLATES_PER_ROW
    row = (plate_idx - 1) // PLATES_PER_ROW
    return (BED_CX + col * PLATE_STRIDE,
            BED_CY - row * PLATE_STRIDE)


def common_prefix(names):
    """Longest common prefix shared by all names, trimmed to the last
    underscore so we don't cut a word in half."""
    if not names:
        return ""
    pref = names[0]
    for n in names[1:]:
        i = 0
        while i < len(pref) and i < len(n) and pref[i] == n[i]:
            i += 1
        pref = pref[:i]
    cut = pref.rfind("_")
    return pref[:cut + 1] if cut >= 0 else pref


def parse_args():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", "-i", default="./publish/stl",
                   help="Folder containing .stl files")
    p.add_argument("--output", "-o", default="./publish/output.3mf",
                   help="Output .3mf path")
    p.add_argument("--template", "-t", default=None,
                   help="Reference .3mf to inherit print/filament/printer settings from")
    return p.parse_args()


def load_centered(stl_path):
    """Load STL and translate so its bbox centre is at the origin.
    Returns (mesh, bbox_height_z, original_bbox_centre_z)."""
    m = trimesh.load_mesh(str(stl_path), process=True)
    if not isinstance(m, trimesh.Trimesh):
        m = trimesh.util.concatenate(m.dump())
    bmin = m.vertices.min(axis=0)
    bmax = m.vertices.max(axis=0)
    centre = (bmin + bmax) / 2.0
    m.vertices = m.vertices - centre
    return m, float(bmax[2] - bmin[2]), float(centre[2])


# ---------- per-object .model file ----------------------------------------

def build_object_model(inner_id, component_uuid, mesh):
    verts = "\n".join(
        f'     <vertex x="{v[0]:.7f}" y="{v[1]:.7f}" z="{v[2]:.7f}"/>'
        for v in mesh.vertices
    )
    tris = "\n".join(
        f'     <triangle v1="{f[0]}" v2="{f[1]}" v3="{f[2]}"/>'
        for f in mesh.faces
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<model unit="millimeter" xml:lang="en-US"'
        ' xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"'
        ' xmlns:BambuStudio="http://schemas.bambulab.com/package/2021"'
        ' xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06"'
        ' requiredextensions="p">\n'
        ' <metadata name="BambuStudio:3mfVersion">1</metadata>\n'
        ' <resources>\n'
        f'  <object id="{inner_id}" p:UUID="{component_uuid}" type="model">\n'
        '   <mesh>\n'
        f'    <vertices>\n{verts}\n    </vertices>\n'
        f'    <triangles>\n{tris}\n    </triangles>\n'
        '   </mesh>\n'
        '  </object>\n'
        ' </resources>\n'
        '</model>\n'
    )


# ---------- top-level 3D/3dmodel.model ------------------------------------

def build_main_model(items):
    today = date.today().isoformat()
    head = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<model unit="millimeter" xml:lang="en-US"'
        ' xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"'
        ' xmlns:BambuStudio="http://schemas.bambulab.com/package/2021"'
        ' xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06"'
        ' requiredextensions="p">\n'
        ' <metadata name="Application">BambuStudio-02.05.00.66</metadata>\n'
        ' <metadata name="BambuStudio:3mfVersion">1</metadata>\n'
        ' <metadata name="Copyright"></metadata>\n'
        f' <metadata name="CreationDate">{today}</metadata>\n'
        ' <metadata name="Description"></metadata>\n'
        ' <metadata name="Designer"></metadata>\n'
        ' <metadata name="DesignerCover"></metadata>\n'
        ' <metadata name="DesignerUserId"></metadata>\n'
        ' <metadata name="License"></metadata>\n'
        f' <metadata name="ModificationDate">{today}</metadata>\n'
        ' <metadata name="Origin"></metadata>\n'
        ' <metadata name="Title"></metadata>\n'
        ' <resources>\n'
    )
    res = "".join(
        f'  <object id="{it["object_id"]}" p:UUID="{it["object_uuid"]}" type="model">\n'
        f'   <components>\n'
        f'    <component p:path="{it["object_path"]}" objectid="{it["inner_id"]}"'
        f' p:UUID="{it["component_uuid"]}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>\n'
        f'   </components>\n'
        f'  </object>\n'
        for it in items
    )
    build_uuid = str(uuid.uuid4())
    build = [f' <build p:UUID="{build_uuid}">\n']
    for plate_idx, it in enumerate(items, start=1):
        cx, cy = plate_centre(plate_idx)
        build.append(
            f'  <item objectid="{it["object_id"]}" p:UUID="{it["item_uuid"]}"'
            f' transform="1 0 0 0 -1 0 0 0 -1 {cx:.7f} {cy:.7f} {it["bH"]/2:.7f}"'
            f' printable="1"/>\n'
        )
    build.append(' </build>\n')
    return head + res + ' </resources>\n' + "".join(build) + '</model>\n'


# ---------- Metadata/model_settings.config --------------------------------

def build_model_settings(items):
    parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<config>']
    for it in items:
        parts += [
            f'  <object id="{it["object_id"]}">',
            f'    <metadata key="name" value="{escape(it["name"])}"/>',
            '    <metadata key="extruder" value="1"/>',
            f'    <metadata face_count="{it["face_count"]}"/>',
            '    <part id="1" subtype="normal_part">',
            f'      <metadata key="name" value="{escape(it["name"])}"/>',
            '      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>',
            f'      <metadata key="source_file" value="{escape(it["source_file"])}"/>',
            '      <metadata key="source_object_id" value="0"/>',
            '      <metadata key="source_volume_id" value="0"/>',
            '      <metadata key="source_offset_x" value="0"/>',
            '      <metadata key="source_offset_y" value="0"/>',
            f'      <metadata key="source_offset_z" value="{it["z_offset"]:.16f}"/>',
            f'      <mesh_stat face_count="{it["face_count"]}" edges_fixed="0"'
            ' degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>',
            '    </part>',
            '  </object>',
        ]
    for plate_idx, it in enumerate(items, start=1):
        parts += [
            '  <plate>',
            f'    <metadata key="plater_id" value="{plate_idx}"/>',
            f'    <metadata key="plater_name" value="{escape(it["plate_name"])}"/>',
            '    <metadata key="locked" value="false"/>',
            '    <metadata key="filament_map_mode" value="Auto For Flush"/>',
            '    <model_instance>',
            f'      <metadata key="object_id" value="{it["object_id"]}"/>',
            '      <metadata key="instance_id" value="0"/>',
            f'      <metadata key="identify_id" value="{1000 + plate_idx}"/>',
            '    </model_instance>',
            '  </plate>',
        ]
    parts.append('  <assemble>')
    for it in items:
        parts.append(
            f'   <assemble_item object_id="{it["object_id"]}" instance_id="0"'
            f' transform="1 0 0 0 1 0 0 0 1 {BED_CX} {BED_CY} {it["bH"]/2:.7f}"'
            ' offset="0 0 0" />'
        )
    parts += ['  </assemble>', '</config>']
    return "\n".join(parts)


# ---------- small static / list-driven files ------------------------------

CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n'
    ' <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n'
    ' <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n'
    ' <Default Extension="png" ContentType="image/png"/>\n'
    ' <Default Extension="gcode" ContentType="text/x.gcode"/>\n'
    '</Types>\n'
)

ROOT_RELS = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n'
    ' <Relationship Target="/3D/3dmodel.model" Id="rel-1"'
    ' Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>\n'
    '</Relationships>\n'
)

SLICE_INFO = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<config>\n'
    '  <header>\n'
    '    <header_item key="X-BBL-Client-Type" value="slicer"/>\n'
    '    <header_item key="X-BBL-Client-Version" value="02.05.00.66"/>\n'
    '  </header>\n'
    '</config>\n'
)


def build_3d_rels(items):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    ]
    for i, it in enumerate(items, start=1):
        lines.append(
            f' <Relationship Target="{it["object_path"]}" Id="rel-{i}"'
            ' Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>'
        )
    lines.append('</Relationships>\n')
    return "\n".join(lines)


def build_cut_information(items):
    parts = ['<?xml version="1.0" encoding="utf-8"?>', '<objects>']
    for it in items:
        parts += [
            f' <object id="{it["object_id"]}">',
            '  <cut_id id="0" check_sum="1" connectors_cnt="0"/>',
            ' </object>',
        ]
    parts.append('</objects>')
    return "\n".join(parts)


def build_filament_sequence(n_plates):
    return json.dumps({f"plate_{i}": {"sequence": []} for i in range(1, n_plates + 1)})


# ---------- template inheritance ------------------------------------------

# Files copied verbatim from --template, if present. project_settings.config
# (JSON) carries every printer/filament/process knob Bambu Studio writes from
# the GUI; the process_settings_*/filament_settings_*/printer_settings_*
# variants exist in older / library-saved profiles, so we copy those too.
INHERITED_EXACT = {"Metadata/project_settings.config"}
INHERITED_PREFIXES = (
    "Metadata/process_settings_",
    "Metadata/filament_settings_",
    "Metadata/printer_settings_",
)


def load_template(path):
    if not path:
        return {}
    if not Path(path).is_file():
        sys.exit(f"--template not found: {path}")
    inherited = {}
    with zipfile.ZipFile(path, "r") as zf:
        for name in zf.namelist():
            if name in INHERITED_EXACT or name.startswith(INHERITED_PREFIXES):
                inherited[name] = zf.read(name)
    return inherited


# ---------- main -----------------------------------------------------------

def main():
    args = parse_args()

    in_dir = Path(args.input)
    if not in_dir.is_dir():
        sys.exit(f"Input folder not found: {in_dir}")
    stls = sorted(in_dir.glob("*.stl"))
    if not stls:
        sys.exit(f"No .stl files in {in_dir}")
    print(f"Found {len(stls)} STL files in {in_dir}")

    items = []
    object_models = {}
    prefix = common_prefix([stl.stem for stl in stls])

    for idx, stl in enumerate(stls, start=1):
        mesh, bH, z_offset = load_centered(stl)
        # Bambu's convention: outer object id even, inner id odd, both unique
        # across the whole 3MF. Without unique inner ids, Bambu deduplicates
        # meshes and renders the first one for every plate.
        object_id = 2 * idx
        inner_id = 2 * idx - 1
        component_uuid = str(uuid.uuid4())
        object_path = f"/3D/Objects/object_{object_id}.model"
        archive_path = f"3D/Objects/object_{object_id}.model"
        object_models[archive_path] = build_object_model(inner_id, component_uuid, mesh)
        plate_name = stl.stem[len(prefix):] if prefix and stl.stem.startswith(prefix) else stl.stem
        items.append({
            "object_id": object_id,
            "inner_id": inner_id,
            "object_uuid": str(uuid.uuid4()),
            "component_uuid": component_uuid,
            "item_uuid": str(uuid.uuid4()),
            "object_path": object_path,
            "name": stl.stem,
            "plate_name": plate_name,
            "source_file": stl.name,
            "face_count": int(len(mesh.faces)),
            "bH": bH,
            "z_offset": z_offset,
        })
        print(f"  [{idx:>2}] {stl.stem}: {len(mesh.faces)} tris -> plate '{plate_name}'")

    inherited = load_template(args.template)

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        zf.writestr("[Content_Types].xml", CONTENT_TYPES)
        zf.writestr("_rels/.rels", ROOT_RELS)
        zf.writestr("3D/3dmodel.model", build_main_model(items))
        zf.writestr("3D/_rels/3dmodel.model.rels", build_3d_rels(items))
        for path, content in object_models.items():
            zf.writestr(path, content)
        zf.writestr("Metadata/model_settings.config", build_model_settings(items))
        zf.writestr("Metadata/slice_info.config", SLICE_INFO)
        zf.writestr("Metadata/cut_information.xml", build_cut_information(items))
        zf.writestr("Metadata/filament_sequence.json",
                    build_filament_sequence(len(items)))
        if "Metadata/project_settings.config" not in inherited:
            zf.writestr("Metadata/project_settings.config", "{}")
        for name, data in inherited.items():
            zf.writestr(name, data)

    size_kb = out.stat().st_size / 1024
    print(f"\nWrote {out} ({size_kb:.1f} KB, {len(items)} plates)")
    if inherited:
        print(f"  Inherited {len(inherited)} settings file(s) from {args.template}")


if __name__ == "__main__":
    main()
