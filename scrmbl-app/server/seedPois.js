// One-time seed: demo beta on a few popular hikes so the "group nearby
// beta into sections" feature (src/utils/poiClusters.js) has something
// real to show — several notes clustered near the same known crux, not
// synthetic scattered points. Coordinates are sampled from each hike's
// already-seeded trail_geometry (real OSM-derived points), not fabricated.
// Run manually: node seedPois.js (after seedTrailGeometry.js).
const { initializeDatabase, runQuery, getQuery, db } = require('./database');

// Reuses the community personas from the frontend's SEED_USERS
// (src/constants/index.js) for narrative continuity — these aren't real
// signed-in accounts, just backend `users` rows so seeded beta has a
// believable author. Marked by a shared @scrmbl.demo email domain so this
// script can find-and-clear its own prior run before reseeding.
const AUTHORS = [
  { email: 'rachel.p@scrmbl.demo', name: 'Rachel P.' },
  { email: 'tom.v@scrmbl.demo', name: 'Tom V.' },
  { email: 'maya.l@scrmbl.demo', name: 'Maya L.' },
  { email: 'sam.o@scrmbl.demo', name: 'Sam O.' },
];

// ratio: how far along the trail's stored geometry (0 = start, 1 = end) to
// place the pin; jitter (degrees) keeps a "cluster" from being one exact
// point. Content loosely echoes the real trail character already in this
// hike's community reviews (constants/index.js) — the Ledges' exposure,
// Quandary's goats, Sky Pond's late-season ice, Bierstadt's willows.
const SEEDS = [
  { trail_id: 'keyhole', ratio: 0.72, author: 'maya.l@scrmbl.demo', type: 'warning', title: 'The Ledges are no joke', note: 'Stay right along the bolted line — easy to stray onto exposed rock if you drift left.' },
  { trail_id: 'keyhole', ratio: 0.72, author: 'sam.o@scrmbl.demo', type: 'beta', title: 'Bottleneck up here on weekends', note: 'Traffic jam on the Ledges by 7am in season. Start earlier or budget extra time.' },
  { trail_id: 'keyhole', ratio: 0.72, author: 'rachel.p@scrmbl.demo', type: 'beta', title: 'Cairns are sparse through here', note: 'Easy to lose the route across the Ledges in fog. A GPS track helps a lot.' },
  { trail_id: 'keyhole', ratio: 0.32, author: 'tom.v@scrmbl.demo', type: 'landmark', title: 'Last reliable water', note: 'Good spot to filter before the summit push — nothing dependable above here.' },

  { trail_id: 'quandary', ratio: 0.82, author: 'maya.l@scrmbl.demo', type: 'warning', title: 'Goats hang out right here', note: "They're aggressive about salt — don't let them near your pack or trekking poles." },
  { trail_id: 'quandary', ratio: 0.82, author: 'sam.o@scrmbl.demo', type: 'warning', title: 'Wind funnel above treeline', note: "Ridge gets brutal past this point. Layer up before you're exposed, not after." },
  { trail_id: 'quandary', ratio: 0.08, author: 'tom.v@scrmbl.demo', type: 'beta', title: 'Parking fills by 6am', note: 'Lot overflow starts before sunrise on weekends. Carpool if you can.' },

  { trail_id: 'skypond', ratio: 0.78, author: 'rachel.p@scrmbl.demo', type: 'warning', title: 'Ice here well into summer', note: 'Falls stay icy through June some years. Microspikes saved me more than once.' },
  { trail_id: 'skypond', ratio: 0.78, author: 'sam.o@scrmbl.demo', type: 'beta', title: 'Scramble up the falls is the crux', note: 'Short and exposed next to the falls — easy to overthink it, just take it slow.' },

  { trail_id: 'bierstadt', ratio: 0.12, author: 'tom.v@scrmbl.demo', type: 'landmark', title: 'Boardwalk through the willows', note: 'Newer boardwalk helps a ton — still muddy right at either end.' },
];

const JITTER_DEG = 0.00015; // ~15m, keeps clustered pins visually distinct but within the 80m section threshold

function indexForRatio(len, ratio) {
  return Math.min(len - 1, Math.max(0, Math.round(ratio * (len - 1))));
}

async function seed() {
  initializeDatabase();
  await new Promise((resolve) => setTimeout(resolve, 300)); // let CREATE TABLE IF NOT EXISTS finish

  const userIdByEmail = {};
  for (const a of AUTHORS) {
    let user = await getQuery('SELECT * FROM users WHERE email = ?', [a.email]);
    if (!user) {
      const result = await runQuery('INSERT INTO users (email, name) VALUES (?, ?)', [a.email, a.name]);
      user = await getQuery('SELECT * FROM users WHERE id = ?', [result.id]);
    }
    userIdByEmail[a.email] = user.id;
  }

  // Idempotent: clear this script's own prior seed rows before reseeding,
  // rather than accumulating duplicates on every run.
  const demoUserIds = Object.values(userIdByEmail);
  for (const uid of demoUserIds) {
    await runQuery('DELETE FROM pois WHERE user_id = ?', [uid]);
  }

  const geomCache = {};
  let seeded = 0;
  for (const s of SEEDS) {
    if (!(s.trail_id in geomCache)) {
      const row = await getQuery('SELECT points FROM trail_geometry WHERE trail_id = ?', [s.trail_id]);
      geomCache[s.trail_id] = row ? JSON.parse(row.points) : [];
      if (!row) console.log(`skip ${s.trail_id} — no trail_geometry row, run seedTrailGeometry.js first`);
    }
    const points = geomCache[s.trail_id];
    if (points.length < 2) continue;

    const idx = indexForRatio(points.length, s.ratio);
    const [baseLat, baseLng] = points[idx];
    const lat = baseLat + (Math.random() - 0.5) * JITTER_DEG;
    const lng = baseLng + (Math.random() - 0.5) * JITTER_DEG;

    await runQuery(
      'INSERT INTO pois (trail_id, user_id, lat, lng, type, title, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [s.trail_id, userIdByEmail[s.author], lat, lng, s.type, s.title, s.note]
    );
    seeded++;
    console.log(`seeded "${s.title}" on ${s.trail_id} (${s.type}, by ${s.author})`);
  }

  console.log(`Done — ${seeded} beta entries seeded.`);
  db.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
