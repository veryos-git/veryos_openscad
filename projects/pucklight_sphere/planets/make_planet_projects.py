# Copyright (C) Jonas Immanuel Frey - Licensed under GPL
# Downloads the elevation maps of the bodies in planetary_heightmaps.md and makes a
# project of each for the webapp: ../mathematical/projects/<name>/. A project that
# already exists stays as it is; delete it to make it again.
#
# Run: python3 make_planet_projects.py [names]
# Needs numpy, Pillow and curl. The downloads, 5 GB, stay in .gitignored/raw/.

import gzip
import json
import re
import struct
import subprocess
import sys
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

here = Path(__file__).resolve().parent
raw_dir = here / ".gitignored" / "raw"
projects_dir = here.parent / "mathematical" / "projects"
app_js = here.parent / "mathematical" / "app.js"

# The app's map has 1024 x 512 pixels, so this is enough, and git stays small.
width, height = 2048, 1024
# A few extreme points, like Olympus Mons, must not flatten all the rest.
percentiles = (0.1, 99.9)

usgs = "https://planetarymaps.usgs.gov/mosaic/"
nasa_earth = "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/"
nasa_moon = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/"
titan_zip = "https://asc-astropedia.s3.us-west-2.amazonaws.com/Titan/Cassini/GTDR/gtdr-data.zip"


def stops(*pairs):
    """The colours, as "#rrggbb" and height pairs."""
    return [{"t": t, "color": [int(c[i:i + 2], 16) for i in (1, 3, 5)]} for c, t in pairs]


# gamma brings out what would stay dark: a body with a few high places gets less than 1.
# flatten takes out the shape of a flattened body, measured from a sphere: a broad belt
# around the equator that drowns the craters.
bodies = {
    "Mercury": dict(url=usgs + "Mercury_Messenger_USGS_DEM_Global_665m_v2.tif", gamma=1,
                    stops=stops(("#3d3a36", 0), ("#7a7065", 0.35), ("#b3a595", 0.7), ("#f2ebe0", 1))),
    "Venus": dict(url=usgs + "Venus_Magellan_Topography_Global_4641m_v02.tif", gamma=0.5,
                  stops=stops(("#5a3a12", 0), ("#a8742a", 0.35), ("#e3b45a", 0.7), ("#fff4cf", 1))),
    "Earth": dict(url=nasa_earth + "gebco_08_rev_elev_5400x2700.tif", gamma=0.45,
                  stops=stops(("#1c4e8a", 0), ("#1c4e8a", 0.03), ("#3f8f46", 0.06), ("#c9a95c", 0.5), ("#ffffff", 0.9))),
    "Moon": dict(url=nasa_moon + "ldem_16_uint.tif", gamma=1,
                 stops=stops(("#2b2b2d", 0), ("#66666a", 0.35), ("#a5a5a8", 0.7), ("#f4f4f2", 1))),
    "Mars": dict(url=usgs + "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif", gamma=1,
                 stops=stops(("#5a2a14", 0), ("#a34f25", 0.35), ("#d98a4a", 0.7), ("#f7e3c8", 1))),
    "Pluto": dict(url=usgs + "Pluto_NewHorizons_Global_DEM_300m_Jul2017_16bit.tif", gamma=1,
                  stops=stops(("#3a2a22", 0), ("#8a6a50", 0.35), ("#cdb49a", 0.7), ("#fbf2e4", 1))),
    "Charon": dict(url=usgs + "Charon_NewHorizons_Global_DEM_300m_Jul2017_16bit.tif", gamma=1,
                   stops=stops(("#2d2a2c", 0), ("#6b5f5c", 0.35), ("#aa9d96", 0.7), ("#efe9e2", 1))),
    "Ceres": dict(url=usgs + "Ceres_Dawn_FC_HAMO_DTM_DLR_Global_60ppd_Oct2016.tif", gamma=1, flatten=True,
                  stops=stops(("#2c2e30", 0), ("#62666a", 0.35), ("#a0a4a8", 0.7), ("#eef0f2", 1))),
    "Vesta": dict(url=usgs + "Vesta_Dawn_HAMO_DTM_DLR_Global_48ppd.tif", gamma=1, flatten=True,
                  stops=stops(("#33302c", 0), ("#6e675e", 0.35), ("#a89f92", 0.7), ("#f1ece2", 1))),
    "Titan": dict(url=titan_zip, gamma=1,
                  stops=stops(("#3f2508", 0), ("#8a5a14", 0.35), ("#d09a3c", 0.7), ("#f8e3a8", 1))),
}


def download(name, url):
    """Into its own folder; a file only gets its name when it is complete."""
    folder = raw_dir / name
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / url.rsplit("/", 1)[1]
    if not path.exists():
        part = path.with_name(path.name + ".part")
        print(f"{name}: downloading {url}", flush=True)
        subprocess.run(["curl", "-sSL", "--fail", "--retry", "5", "-C", "-", "-o", part, url], check=True)
        part.rename(path)
    return path


def read_tiff(path):
    """An uncompressed TIFF with one strip per row, as the USGS and NASA files are, without
    loading a large one. Returns the rows and the no-data value."""
    with open(path, "rb") as f:
        order = {b"II": "<", b"MM": ">"}[f.read(2)]
        assert struct.unpack(order + "H", f.read(2))[0] == 42, "BigTIFF is not handled"
        f.seek(struct.unpack(order + "I", f.read(4))[0])
        formats = {1: "B", 2: "s", 3: "H", 4: "I", 12: "d"}
        tags = {}
        for _ in range(struct.unpack(order + "H", f.read(2))[0]):
            entry = f.read(12)
            tag, kind, count = struct.unpack(order + "HHI", entry[:8])
            if kind not in formats:
                continue
            size = struct.calcsize(formats[kind]) * count
            data = entry[8:8 + size]
            if size > 4:
                position = f.tell()
                f.seek(struct.unpack(order + "I", entry[8:])[0])
                data = f.read(size)
                f.seek(position)
            tags[tag] = data.rstrip(b"\0") if kind == 2 else struct.unpack(f"{order}{count}{formats[kind]}", data)

    columns, rows, bits = tags[256][0], tags[257][0], tags[258][0]
    assert tags[259][0] == 1, "only uncompressed files are handled"
    sample_format = tags.get(339, (1,))[0]
    kind = {(1, 8): "u1", (1, 16): "u2", (2, 16): "i2", (3, 32): "f4"}[sample_format, bits]
    nodata = float(tags[42113]) if 42113 in tags else None
    offsets = tags[273]
    if all(b - a == columns * bits // 8 for a, b in zip(offsets, offsets[1:])):
        return np.memmap(path, dtype=order + kind, mode="r", offset=offsets[0], shape=(rows, columns)), nodata
    # NASA's Earth has its rows out of order in the file.
    return np.stack([np.fromfile(path, order + kind, columns, offset=o) for o in offsets]), nodata


def read_titan(path):
    """The interpolated model (GTI) in two halves, 8 pixels per degree. Longitudes count to
    the west, so N090 then N270 runs from 180 W over 0 to 180 E, east to the right."""
    with zipfile.ZipFile(path) as archive:
        halves = []
        for half in ("N090", "N270"):
            image = gzip.decompress(archive.read(f"gtdr-data/GTIED00{half}_T077_V01.IMG.gz"))
            # One label record of 5760 bytes comes first.
            halves.append(np.frombuffer(image, dtype="<f4", offset=5760).reshape(1440, 1440))
    return np.hstack(halves), None


def average_down(rows, nodata):
    """The mean of the valid pixels in each new pixel; nan where there are none."""
    out = np.full((height, width), np.nan, dtype=np.float32)
    row_edges = np.linspace(0, rows.shape[0], height + 1).astype(int)
    column_edges = np.linspace(0, rows.shape[1], width + 1).astype(int)[:-1]
    for y in range(height):
        block = np.asarray(rows[row_edges[y]:row_edges[y + 1]], dtype=np.float64)
        valid = np.isfinite(block) & (block > -1e30)
        if nodata is not None:
            valid &= block != nodata
        total = np.add.reduceat(np.where(valid, block, 0).sum(axis=0), column_edges)
        count = np.add.reduceat(valid.sum(axis=0), column_edges)
        out[y] = np.where(count > 0, total / np.maximum(count, 1), np.nan)
    return out


def make_texture(name, path, flatten):
    rows, nodata = read_titan(path) if path.suffix == ".zip" else read_tiff(path)
    elevation = average_down(rows, nodata)
    if flatten:
        elevation -= np.nanmedian(elevation, axis=1, keepdims=True)
    known = ~np.isnan(elevation)
    low, high = np.percentile(elevation[known], percentiles)
    heights = np.clip((elevation - low) / (high - low), 0, 1)
    # Where nothing was measured the surface stays level at the middle height, so the
    # edge of the data is no cliff.
    middle = np.median(heights[known])
    heights[~known] = middle
    print(f"{name}: {rows.shape[1]} x {rows.shape[0]}, {low:.0f} to {high:.0f}, "
          f"{100 * known.mean():.1f}% known, median height {middle:.3f}", flush=True)
    return Image.fromarray((heights * 255 + 0.5).astype(np.uint8))


def main(names):
    code = re.search(r"texture: `(.*?)`", app_js.read_text(), re.S).group(1)
    for name in names:
        folder = projects_dir / name
        if folder.exists():
            print(f"{name}: the project exists, skipped")
            continue
        body = bodies[name]
        texture = make_texture(name, download(name, body["url"]), body.get("flatten", False))
        folder.mkdir(parents=True)
        texture.save(folder / "texture.png", optimize=True)
        # As the app writes it.
        project = {"template": "texture", "code": code, "scale": 12, "seed": 3, "gamma": body["gamma"], "depth": 0.8,
                   "relief_from": -36, "columns": 720, "stops": body["stops"], "texture": True}
        (folder / "project.json").write_text(json.dumps(project, indent=2) + "\n")


if __name__ == "__main__":
    main(sys.argv[1:] or list(bodies))
