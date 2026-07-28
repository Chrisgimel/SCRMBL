// Groups a hike's beta pins into sections by proximity — popular hikes
// tend to collect several notes near the same crux/junction/landmark, and
// a flat pin-by-pin list (or tapping markers one at a time on the map)
// doesn't surface that. Pure client-side distance clustering: union-find
// on pairwise haversine distance, same technique trailMatcher.js already
// uses server-side to group OSM ways into connected components.

const EARTH_RADIUS_M = 6371000;

function haversineMeters(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/* thresholdMeters: how close two pins need to be to count as the same
   section. 80m covers "same rest stop / same tricky junction" without
   also merging pins from opposite ends of a short out-and-back. */
export function clusterPois(pois, thresholdMeters = 80) {
  const n = pois.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (haversineMeters(pois[i], pois[j]) <= thresholdMeters) union(i, j);
    }
  }

  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(pois[i]);
  }

  const clusters = Array.from(groups.values()).map((members) => ({
    lat: members.reduce((sum, p) => sum + p.lat, 0) / members.length,
    lng: members.reduce((sum, p) => sum + p.lng, 0) / members.length,
    pois: members,
  }));

  // Busiest section first — that's the interesting one on a popular hike.
  clusters.sort((a, b) => b.pois.length - a.pois.length);
  return clusters;
}
