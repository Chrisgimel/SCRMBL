// Automated trail-geometry matcher: queries OpenStreetMap (via Overpass),
// finds named ways near a hike's coordinates, stitches connected segments
// into the longest continuous path through them, and scores confidence by
// how well the resulting length fits the hike's known mileage.
//
// This mirrors the process done by hand for the initial 9 seed hikes (see
// seedTrailGeometry.json): same anti-bot headers workaround, same mirror
// fallback (Overpass's primary server errors under load often enough that
// a single endpoint isn't reliable), same length-based sanity check. What
// it can't fully replicate is human judgment at ambiguous junctions -- it
// trades some accuracy for coverage on trails nobody has hand-verified.

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Overpass's /api/interpreter 406s non-browser clients; discovered by hand
// that a realistic browser header set (and an overpass-turbo referer) is
// enough to pass.
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://overpass-turbo.eu',
  'Referer': 'https://overpass-turbo.eu/',
};

const BBOX_PAD_DEG = 0.06;      // ~4-5mi box around the given point
const SNAP_TOLERANCE_MI = 0.08; // endpoints closer than this count as connected
const MIN_CHAIN_MI = 0.15;      // reject stub-sized "matches"
const FETCH_TIMEOUT_MS = 25000;

function haversineMi(a, b) {
  const R = 3958.8;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180, lat2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function pathLenMi(pts) {
  let sum = 0;
  for (let i = 1; i < pts.length; i++) sum += haversineMi(pts[i - 1], pts[i]);
  return sum;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Words common enough in trail naming ("Mount X", "X Peak", "X Lake") that
// matching on the word alone risks pulling in a completely unrelated trail
// elsewhere in the search box -- learned the hard way: "Mount Sanitas Loop"
// prefix-dropped to bare "Mount" matched a same-area but wrong trail
// ("Green Mountain West Ridge Trail") whose length coincidentally fit.
const GENERIC_WORDS = new Set([
  'mount', 'mt', 'trail', 'trailhead', 'peak', 'lake', 'lakes', 'loop',
  'ridge', 'falls', 'creek', 'pond', 'basin', 'pass', 'route', 'path',
]);

// Hike names in this app are often stylized/compound ("Grays & Torreys",
// "Longs Peak -- Keyhole", "Mount Sanitas Loop") while OSM way names are
// plain trail names ("Grays Peak Trail", "East Longs Peak Trail", "Mount
// Sanitas Trail"). A literal substring match on the full hike name misses
// most of these, so: split on separators, and try progressively shorter
// word-prefixes (the specific place name is almost always the front part,
// generic suffixes like "Loop"/"Basin" are what get dropped) -- but never
// emit a single generic word on its own as a search term.
function nameSearchTerms(name) {
  const terms = new Set();
  terms.add(name);
  name.split(/\s*[&/—–-]\s*|\s+and\s+/i).forEach((p) => {
    if (p.trim()) terms.add(p.trim());
  });
  const words = name.split(/\s+/);
  for (let n = words.length - 1; n >= 1; n--) {
    terms.add(words.slice(0, n).join(' '));
  }
  return [...terms]
    .filter((t) => t.length >= 3)
    .filter((t) => t.includes(' ') || !GENERIC_WORDS.has(t.toLowerCase()))
    .slice(0, 8)
    .map(escapeRegex)
    .join('|');
}

async function queryOverpass(ql) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { ...BROWSER_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(ql)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = await res.json();
      if (json && Array.isArray(json.elements)) return json;
    } catch (err) {
      // try the next endpoint
    }
  }
  return null; // every endpoint failed -- "couldn't check", not "no data"
}

async function findCandidateWays({ name, lat, long }) {
  const south = lat - BBOX_PAD_DEG, north = lat + BBOX_PAD_DEG;
  const west = long - BBOX_PAD_DEG, east = long + BBOX_PAD_DEG;
  const pattern = nameSearchTerms(name);
  const ql = `[out:json][timeout:25];way["highway"~"path|footway|track"]["name"~"${pattern}",i](${south},${west},${north},${east});out geom;`;
  const data = await queryOverpass(ql);
  if (!data) return null;
  return data.elements
    .filter((e) => e.type === 'way' && e.geometry && e.geometry.length >= 2)
    .map((e) => ({ id: e.id, name: e.tags && e.tags.name, points: e.geometry.map((g) => [g.lat, g.lon]) }));
}

// Group candidate ways into connected components (endpoints within
// SNAP_TOLERANCE_MI of each other), snapping shared/near-shared endpoints
// into common graph nodes via union-find.
function connectedComponents(ways) {
  const nodePoints = [];
  function snapNode(pt) {
    for (let i = 0; i < nodePoints.length; i++) {
      if (haversineMi(nodePoints[i], pt) <= SNAP_TOLERANCE_MI) return i;
    }
    nodePoints.push(pt);
    return nodePoints.length - 1;
  }
  const nodeOf = ways.map((w) => [snapNode(w.points[0]), snapNode(w.points[w.points.length - 1])]);

  const parent = nodePoints.map((_, i) => i);
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  function union(a, b) { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }
  nodeOf.forEach(([a, b]) => union(a, b));

  const groups = new Map();
  nodeOf.forEach(([a], i) => {
    const root = find(a);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  });
  return { groups: [...groups.values()], nodeOf };
}

// Within one connected component, find the longest simple path (graph
// diameter via double-BFS) -- the same "farthest point to farthest point"
// shape picked by hand when stitching a trailhead to its destination.
function diameterPath(wayIndices, ways, nodeOf) {
  const wayLen = new Map(); // wayIndex -> real length in miles
  const adj = new Map();
  wayIndices.forEach((i) => {
    const [a, b] = nodeOf[i];
    wayLen.set(i, pathLenMi(ways[i].points));
    if (a === b) return; // self-loop stub, ignore
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push({ to: b, wayIndex: i });
    adj.get(b).push({ to: a, wayIndex: i });
  });

  // "Farthest" has to mean real trail distance, not hop count — a junction
  // with one short shortcut and one long main corridor must prefer the
  // long one. Plain BFS (visit each node once, first path wins) still
  // finds the correct longest path on a tree-shaped graph (the common
  // case here); it can pick the shorter of two parallel edges in a small
  // loop, which is an acceptable approximation.
  function farthestByDistance(start) {
    const dist = new Map([[start, 0]]);
    const parent = new Map();
    const queue = [start];
    let farthest = start;
    while (queue.length) {
      const cur = queue.shift();
      if (dist.get(cur) > dist.get(farthest)) farthest = cur;
      for (const { to, wayIndex } of adj.get(cur) || []) {
        if (!dist.has(to)) {
          dist.set(to, dist.get(cur) + wayLen.get(wayIndex));
          parent.set(to, { from: cur, wayIndex });
          queue.push(to);
        }
      }
    }
    return { farthest, parent };
  }
  const bfsFarthest = farthestByDistance;

  if (!adj.has(nodeOf[wayIndices[0]][0])) return null;
  const { farthest: endA } = bfsFarthest(nodeOf[wayIndices[0]][0]);
  const { farthest: endB, parent } = bfsFarthest(endA);
  if (endA === endB) return null;

  const chain = [];
  let cur = endB;
  while (cur !== endA) {
    const { from, wayIndex } = parent.get(cur);
    chain.push({ wayIndex, from });
    cur = from;
  }
  chain.reverse();

  let path = [];
  const wayIds = [];
  chain.forEach(({ wayIndex, from }) => {
    const way = ways[wayIndex];
    const [a] = nodeOf[wayIndex];
    let pts = way.points;
    if (a !== from) pts = [...pts].reverse();
    if (path.length && haversineMi(path[path.length - 1], pts[0]) < 1e-6) pts = pts.slice(1);
    path = path.concat(pts);
    wayIds.push(way.id);
  });
  return { path, length: pathLenMi(path), segmentCount: chain.length, wayIds };
}

function bestChains(ways) {
  if (ways.length === 0) return [];
  const { groups, nodeOf } = connectedComponents(ways);
  return groups.map((idxs) => diameterPath(idxs, ways, nodeOf)).filter(Boolean);
}

function scoreChain(chain, mi) {
  if (chain.length < MIN_CHAIN_MI) return { confidence: 'none', bestFit: Infinity };
  if (!mi) {
    // No stated mileage to check the length against (e.g. a custom hike
    // created without a distance value) — can't confirm a length fit, so
    // cap at 'medium' and prefer the longest candidate chain instead.
    return { confidence: 'medium', bestFit: -chain.length };
  }
  const targets = [mi, mi / 2].filter((t) => t > 0);
  const bestFit = Math.min(...targets.map((t) => Math.abs(chain.length - t) / t));
  if (chain.segmentCount === 1 && bestFit <= 0.2) return { confidence: 'high', bestFit };
  if (bestFit <= 0.35) return { confidence: 'medium', bestFit };
  return { confidence: 'none', bestFit };
}

async function matchTrail({ name, lat, long, mi }) {
  const latNum = Number(lat), longNum = Number(long), miNum = Number(mi);
  if (!name || !Number.isFinite(latNum) || !Number.isFinite(longNum)) {
    return { points: [], confidence: 'none', source: null, cacheable: false };
  }

  const ways = await findCandidateWays({ name, lat: latNum, long: longNum });
  if (ways === null) {
    // Overpass itself was unreachable -- not a verdict on this trail, don't cache it
    return { points: [], confidence: 'none', source: null, cacheable: false };
  }
  if (ways.length === 0) {
    return { points: [], confidence: 'none', source: `No OSM ways matching "${name}" found nearby`, cacheable: true };
  }

  const chains = bestChains(ways);
  if (chains.length === 0) {
    return { points: [], confidence: 'none', source: `OSM candidates for "${name}" didn't form a usable route`, cacheable: true };
  }

  let best = null, bestScore = null;
  chains.forEach((chain) => {
    const score = scoreChain(chain, miNum);
    if (!bestScore || score.bestFit < bestScore.bestFit) { best = chain; bestScore = score; }
  });

  if (bestScore.confidence === 'none') {
    const reason = miNum
      ? `too far from the stated ${miNum}mi`
      : `shorter than the ${MIN_CHAIN_MI}mi minimum`;
    return {
      points: [], confidence: 'none',
      source: `Best OSM match for "${name}" was ${best.length.toFixed(2)}mi, ${reason}`,
      cacheable: true,
    };
  }

  const rounded = best.path.map(([a, b]) => [Math.round(a * 100000) / 100000, Math.round(b * 100000) / 100000]);
  return {
    points: rounded,
    confidence: bestScore.confidence,
    source: `Auto-matched: OSM way(s) ${best.wayIds.join(',')} near "${name}" (${best.segmentCount} segment${best.segmentCount > 1 ? 's' : ''}, ${best.length.toFixed(2)}mi)`,
    cacheable: true,
  };
}

module.exports = { matchTrail, nameSearchTerms };
