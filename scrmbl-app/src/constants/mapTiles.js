// CartoDB's free dark basemap — matches the app's dark UI instead of OSM's
// default light raster tiles. Same OSM-sourced data, just a dark style;
// no API key needed at this traffic volume. Requires crediting both the
// source data (OSM) and the style (CARTO).
export const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const DARK_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
