# Greyscale Heightmaps of the Planets (and Major Moons / Dwarf Planets)

A list of free, downloadable greyscale elevation maps (heightmaps / DEMs / displacement maps) for every solid-surface body you are likely to want. Almost all files are **public domain** (NASA / USGS) and in **equirectangular (simple cylindrical) projection**, 2:1 aspect ratio. That means you can wrap them directly onto a UV sphere in Blender, Unity, Unreal, three.js and similar tools.

> **Gas and ice giants (Jupiter, Saturn, Uranus, Neptune) have no solid surface, so no heightmap of them exists.** Any "bump map" you find for them is artistic, not measured data.

---

## Quick reference

| Body | Best "ready-to-use" image | Science-grade DEM (USGS) | Resolution | Size |
|---|---|---|---|---|
| **Mercury** | – (convert DEM) | [Mercury MESSENGER Global DEM 665m](https://astrogeology.usgs.gov/search/map/mercury_messenger_global_dem_665m) → [`Mercury_Messenger_USGS_DEM_Global_665m_v2.tif`](https://planetarymaps.usgs.gov/mosaic/Mercury_Messenger_USGS_DEM_Global_665m_v2.tif) | 64 px/deg (23040 × 11520) | 506 MB |
| **Venus** | – (convert DEM) | [Venus Magellan Global Topography 4641m](https://astrogeology.usgs.gov/search/map/venus_magellan_global_topography_4641m) → [`Venus_Magellan_Topography_Global_4641m_v02.tif`](https://planetarymaps.usgs.gov/mosaic/Venus_Magellan_Topography_Global_4641m_v02.tif) | ~8192 × 4096 | 65 MB |
| **Earth** | [NASA Visible Earth – Topography](https://visibleearth.nasa.gov/images/73934/topography) (greyscale PNG, 21600 × 10800) + [Bathymetry](https://visibleearth.nasa.gov/images/73963/bathymetry) | [GEBCO grid](https://www.gebco.net/data_and_products/gridded_bathymetry_data/) (15 arc-sec, land + sea floor) | 2 km/px (PNG) | 18 MB (PNG) |
| **Moon** | [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720): displacement maps | [Moon LRO LOLA DEM 118m](https://astrogeology.usgs.gov/search/map/moon_lro_lola_dem_118m) → [`Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif`](https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif) | 4 / 16 / 64 px/deg (Kit); 256 px/deg (USGS) | up to 8 GB |
| **Mars** | [Planet Pixel Emporium – Mars](https://planetpixelemporium.com/mars5672.html) (8-bit greyscale topo map) | [Mars MGS MOLA DEM 463m](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m) → [`Mars_MGS_MOLA_DEM_mosaic_global_463m.tif`](https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif) | 128 px/deg (~46080 px wide) | 2 GB |
| **Pluto** | – | [Pluto New Horizons Global DEM 300m](https://astrogeology.usgs.gov/search/map/pluto_new_horizons_lorri_mvic_global_dem_300m) → [`Pluto_NewHorizons_Global_DEM_300m_Jul2017_16bit.tif`](https://planetarymaps.usgs.gov/mosaic//Pluto_NewHorizons_Global_DEM_300m_Jul2017_16bit.tif) | 300 m/px, **one hemisphere only** | 591 MB |
| **Charon** | – | [Charon New Horizons Global DEM 300m](https://astrogeology.usgs.gov/search/map/charon_new_horizons_lorri_mvic_global_dem_300m) → [`Charon_NewHorizons_Global_DEM_300m_Jul2017_16bit.tif`](https://planetarymaps.usgs.gov/mosaic/Charon_NewHorizons_Global_DEM_300m_Jul2017_16bit.tif) | 300 m/px, partial | 154 MB |
| **Ceres** | – | [Ceres Dawn FC2 HAMO Global DTM 137m](https://astrogeology.usgs.gov/search/map/ceres_dawn_fc2_hamo_global_dtm_137m) → [`Ceres_Dawn_FC_HAMO_DTM_DLR_Global_60ppd_Oct2016.tif`](https://planetarymaps.usgs.gov/mosaic/Ceres_Dawn_FC_HAMO_DTM_DLR_Global_60ppd_Oct2016.tif) | 60 px/deg | 446 MB |
| **Vesta** | – | [Vesta Dawn FC HAMO Global DTM 93m](https://astrogeology.usgs.gov/search/map/vesta_dawn_fc_hamo_global_dtm_93m) | ~70–93 m/px, ~95% coverage | – |
| **Titan** | – | [Titan Cassini GTDR Data](https://astrogeology.usgs.gov/search/map/titan_cassini_gtdr_data) (zip, radar altimetry tracks + interpolations) | coarse | ~270 MB |

---

## Notes per body

### ☿ Mercury
- **Source:** MESSENGER MDIS stereo imagery. USGS built this first global DEM from a huge photogrammetric control network, interpolated at 64 px/deg (665 m/px) relative to a 2439.4 km datum radius.
- Delivered as a single-band GeoTIFF of signed elevation values. You need to rescale it to 8- or 16-bit greyscale for most 3D tools (see *Converting* below).
- Artistic alternative: [Planet Pixel Emporium – Mercury](https://planetpixelemporium.com/mercury.html). Its old map was based on the ~48% coverage available before MESSENGER, so the USGS DEM is far better.

### ♀ Venus
- **Source:** Magellan radar altimetry (GTDR). Venus is cloud-covered, so this is the only global topography, and it is coarse (~4.6 km/px).
- The file is small (65 MB) and easy to work with.

### 🜨 Earth
- **NASA Visible Earth "Topography"** (Blue Marble collection): the classic greyscale land heightmap. Data is scaled **0–6400 m**, oceans are black, and it is offered as a 21600 × 10800 PNG plus 10800 × 10800 GeoTIFF tiles. Imagery by Jesse Allen (NASA Earth Observatory) from GEBCO data.
- **Ocean floor:** the companion [Bathymetry](https://visibleearth.nasa.gov/images/73963/bathymetry) image. For one combined land + sea-floor heightmap there is [`World_elevation_map.png` on Wikimedia Commons](https://commons.wikimedia.org/wiki/File:World_elevation_map.png). It merges both NASA images over a #8f8f8f grey, which works out to sea level at about 56% brightness.
- **Small/quick versions:** [NASA Earth Observations (NEO) – Topography](https://neo.gsfc.nasa.gov/view.php?datasetId=SRTM_RAMP2_TOPO) has a "Grayscale" option at 360×180, 720×360, 1440×720 and 3600×1800.
- **Science-grade:** [GEBCO grid](https://www.gebco.net/data_and_products/gridded_bathymetry_data/), a 15 arc-second global grid of land and ocean elevation in metres (multi-GB NetCDF/GeoTIFF).

### 🌕 Moon
- **Best for 3D artists:** the [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720). Its displacement map comes straight from LRO LOLA gridded data at **4, 16 and 64 px/deg** (1440×720, 5760×2880 and 23040×11520). It is offered as **floating-point TIFF in km relative to a 1737.4 km radius**, or as **16-bit TIFF in half-metres relative to 1,747,400 m**. A matching colour map is on the same page.
- **Science-grade:** the USGS LOLA DEM at 118 m/px (8 GB). To get real metres: `gdal_translate -ot Float32 -unscale Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif out.tif`
- **Higher-res (±60° latitude):** [LOLA + Kaguya TC DEM merge 59 m](https://astrogeology.usgs.gov/search/map/moon_lro_lola_selene_kaguya_tc_dem_merge_60n60s_59m) (22 GB).

### ♂ Mars
- **Easiest:** [Planet Pixel Emporium – Mars](https://planetpixelemporium.com/mars5672.html) has an 8-bit greyscale topography map normalised from the original 16-bit MOLA data, plus an RGB normal map. The author notes it also works as a deformation map for true geometry.
- **Science-grade:** the MOLA DEM, built from more than 600 million laser altimeter shots taken in 1999–2001, at 463 m/px. Data near the poles (above ~87° N/S) is sparse and interpolated.
- There is also a pre-rendered greyscale [MOLA Shaded Relief](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_global_shaded_relief_463m) (990 MB). Note that this is a *hillshade*, not a heightmap.

### ♇ Pluto & Charon
- New Horizons was a single flyby, so the DEMs **only cover the hemisphere seen at closest approach**. The rest of the map is blank.

### Dwarf planets / asteroids: Ceres & Vesta
- Dawn Framing Camera stereo DTMs. Ceres is global at 60 px/deg. Vesta covers ~95% of the surface, with shadowed polar areas interpolated.

### Other moons (Io, Europa, Ganymede, Callisto, Titan, Saturnian moons)
- **No complete global heightmaps from measured data exist** for the Galilean moons. Voyager/Galileo stereo and photoclinometry cover only scattered regions (roughly 10–70% depending on the moon). Global image mosaics are available from USGS Astrogeology.
- **Titan:** a global topography map was interpolated from sparse Cassini radar data. The raw data is the [GTDR zip](https://astrogeology.usgs.gov/search/map/titan_cassini_gtdr_data). It is very coarse.

---

## Converting a USGS DEM GeoTIFF to an 8- or 16-bit greyscale PNG

USGS DEMs store signed elevation values (often Int16 or Float32). Most image viewers show them as all-black or all-white. Use [GDAL](https://gdal.org) (also bundled with QGIS):

```bash
# 16-bit greyscale PNG, stretched from min to max elevation (best for displacement)
gdal_translate -of PNG -ot UInt16 -scale Mercury_Messenger_USGS_DEM_Global_665m_v2.tif mercury_height16.png

# 8-bit greyscale PNG, downsampled to 8192 x 4096
gdal_translate -of PNG -ot Byte -scale -outsize 8192 4096 Mars_MGS_MOLA_DEM_mosaic_global_463m.tif mars_height8.png
```

Tips:
- Run `gdalinfo -stats file.tif` first to see the min/max elevation, which you need for setting displacement strength.
- Use **16-bit** for displacement maps. 8-bit causes visible "terracing".
- Check the centre longitude: some maps are centred on 0° and others on 180° (Mars MOLA is 0–360°, centred on 180°), so you may need to shift the texture by half its width to line it up with a colour map.

---

## Sources
- [NASA SVS – CGI Moon Kit](https://svs.gsfc.nasa.gov/4720)
- [NASA – CGI Moon Kit announcement](https://www.nasa.gov/missions/nasa-goddard-creates-cgi-moon-kit-as-a-form-of-visual-storytelling/)
- [USGS – Mercury MESSENGER Global DEM 665m](https://astrogeology.usgs.gov/search/map/mercury_messenger_global_dem_665m)
- [USGS – Venus Magellan Global Topography 4641m](https://astrogeology.usgs.gov/search/map/venus_magellan_global_topography_4641m)
- [USGS – Mars MGS MOLA DEM 463m](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m)
- [USGS – Moon LRO LOLA DEM 118m](https://astrogeology.usgs.gov/search/map/moon_lro_lola_dem_118m)
- [USGS – Pluto New Horizons Global DEM 300m](https://astrogeology.usgs.gov/search/map/pluto_new_horizons_lorri_mvic_global_dem_300m)
- [USGS – Charon New Horizons Global DEM 300m](https://astrogeology.usgs.gov/search/map/charon_new_horizons_lorri_mvic_global_dem_300m)
- [USGS – Ceres Dawn HAMO Global DTM 137m](https://astrogeology.usgs.gov/search/map/ceres_dawn_fc2_hamo_global_dtm_137m)
- [USGS – Vesta Dawn HAMO Global DTM 93m](https://astrogeology.usgs.gov/search/map/vesta_dawn_fc_hamo_global_dtm_93m)
- [USGS – Titan Cassini GTDR Data](https://astrogeology.usgs.gov/search/map/titan_cassini_gtdr_data)
- [NASA Visible Earth – Topography](https://visibleearth.nasa.gov/images/73934/topography)
- [Wikimedia Commons – World elevation map](https://commons.wikimedia.org/wiki/File:World_elevation_map.png)
- [NASA NEO – Topography](https://neo.gsfc.nasa.gov/view.php?datasetId=SRTM_RAMP2_TOPO)
- [Planet Pixel Emporium – Mars](https://planetpixelemporium.com/mars5672.html)
