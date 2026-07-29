// OpenTopoMap — terrain style with contour lines and hillshading, chosen
// over flat street-map styles (CartoDB, standard OSM) after comparison:
// those have nothing to draw out on a remote trail with no nearby
// roads/towns and render as blank gray/black. No API key needed at
// prototype traffic volume. Requires crediting OSM, SRTM, and the
// OpenTopoMap style (CC-BY-SA) — see the licensing note in
// map_phase1_feature memory before this app has real production traffic:
// OpenTopoMap's tile servers are volunteer-run and their usage policy asks
// heavy/commercial-scale users to self-host or use a paid tile provider
// instead of hitting tile.opentopomap.org directly.
export const TILE_URL = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
