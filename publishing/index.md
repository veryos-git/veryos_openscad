# Customization publishing pack

4 model packs, with four actual CAD variants each. Both cover orientations keep the variants at the same scale.

Open the overview image to review the collection; follow a project link for copy, individual renders and presets.

[Full collection contact sheet](overview.png)

| Project | Landscape | Portrait | Listing |
| --- | --- | --- | --- |
| Patterned wipes box | [4:3](../projects/babywipesboxV2/publish/customization/thumbnail_4x3.png) | [3:4](../projects/babywipesboxV2/publish/customization/thumbnail_3x4.png) | [Copy + presets](../projects/babywipesboxV2/publish/customization/listing.md) |
| Textured lighter case | [4:3](../projects/biclightercase2/publish/customization/thumbnail_4x3.png) | [3:4](../projects/biclightercase2/publish/customization/thumbnail_3x4.png) | [Copy + presets](../projects/biclightercase2/publish/customization/listing.md) |
| Textured screw-top jars | [4:3](../projects/simple_cylindrical_screwing_containerV2/publish/customization/thumbnail_4x3.png) | [3:4](../projects/simple_cylindrical_screwing_containerV2/publish/customization/thumbnail_3x4.png) | [Copy + presets](../projects/simple_cylindrical_screwing_containerV2/publish/customization/listing.md) |
| Phone mount | [4:3](../projects/phone_camera_thread_holder/publish/customization/thumbnail_4x3.png) | [3:4](../projects/phone_camera_thread_holder/publish/customization/thumbnail_3x4.png) | [Copy + presets](../projects/phone_camera_thread_holder/publish/customization/listing.md) |

Only the latest lighter case, wipes box, screw-top container and phone mount are included, as requested.


## Typography and source fidelity

The requested typeface is Consolas. This machine resolves it to **DejaVu Sans Mono**, which is used consistently here. Set `PUBLISH_FONT` and `PUBLISH_FONT_BOLD` to local Consolas font files and rerun the composition stage to replace it. The VeryOS mark is rendered from the root `veryos_logo.svg`; the OpenSCAD logo comes from the existing publishing assets.

Every pictured variant was exported from the named source. The source hash, parameter overrides and camera scale accompany each pack. New dimensional combinations are digital examples, not claims of print testing or fit. Older publishing material is preserved.

Rebuild instructions are in [README.md](README.md).
