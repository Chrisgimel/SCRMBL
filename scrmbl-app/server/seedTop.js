// One-time seed: Top Hikes shelves for the community personas, so "ranked by"
// on a trail page and the Top Hikes grid on a profile come from the real
// /api/community/top endpoint instead of a hardcoded frontend constant.
// Mirrors seedGear.js — same @scrmbl.demo authors, same clear-and-reseed
// idempotency.
// Run manually: node seedTop.js
const { initializeDatabase, runQuery, getQuery, db } = require('./database');

// The same personas as SEED_USERS (src/constants/index.js). `handle` is the
// important part: it has to match the frontend's handle exactly, since that is
// what /api/community/top keys its response by.
const AUTHORS = [
  { email: 'rachel.p@scrmbl.demo', name: 'Rachel P.', handle: 'ridgelinerachel' },
  { email: 'tom.v@scrmbl.demo', name: 'Tom V.', handle: 'talus.tom' },
  { email: 'maya.l@scrmbl.demo', name: 'Maya L.', handle: 'cairn_queen' },
  { email: 'sam.o@scrmbl.demo', name: 'Sam O.', handle: 'scree.sam' },
  { email: 'bri.k@scrmbl.demo', name: 'Bri K.', handle: 'basin.bri' },
];

// Lifted verbatim from the frontend's COMMUNITY_TOP constant, which helpers.js
// and UserScreen used to read directly. Kept identical so shelves look the same
// as before — the difference is that these are now real rows a real query
// returns. Order is the ranking: index 0 is that person's #1.
const TOP_BY_HANDLE = {
  ridgelinerachel: ['icelakes', 'bluelakes', 'skypond'],
  'talus.tom': ['grays', 'bierstadt', 'sanitas'],
  cairn_queen: ['keyhole', 'quandary', 'bierstadt', 'grays'],
  'scree.sam': ['keyhole', 'skypond'],
  'basin.bri': ['chicago', 'icelakes', 'bluelakes'],
};

async function seed() {
  initializeDatabase();
  await new Promise((resolve) => setTimeout(resolve, 300)); // let CREATE TABLE IF NOT EXISTS finish

  const userIdByHandle = {};
  for (const a of AUTHORS) {
    let user = await getQuery('SELECT * FROM users WHERE email = ?', [a.email]);
    if (!user) {
      const result = await runQuery(
        'INSERT INTO users (email, name, handle) VALUES (?, ?, ?)',
        [a.email, a.name, a.handle]
      );
      user = await getQuery('SELECT * FROM users WHERE id = ?', [result.id]);
      console.log(`created user ${a.name} (@${a.handle})`);
    } else if (user.handle !== a.handle) {
      // Users seeded before handles existed got an auto-derived handle
      // ("rachelp"); realign them to the frontend's community handle.
      await runQuery('UPDATE users SET handle = ? WHERE id = ?', [a.handle, user.id]);
      console.log(`rehandled ${a.name}: @${user.handle || 'none'} -> @${a.handle}`);
    }
    userIdByHandle[a.handle] = user.id;
  }

  // Idempotent: clear this script's own prior rows before reseeding, rather
  // than accumulating duplicates on every run.
  for (const uid of Object.values(userIdByHandle)) {
    await runQuery('DELETE FROM top_hikes WHERE user_id = ?', [uid]);
  }

  let count = 0;
  for (const [handle, hikeIds] of Object.entries(TOP_BY_HANDLE)) {
    const userId = userIdByHandle[handle];

    for (let i = 0; i < hikeIds.length; i += 1) {
      await runQuery(
        'INSERT INTO top_hikes (user_id, hike_id, position) VALUES (?, ?, ?)',
        [userId, hikeIds[i], i]
      );
      count++;
    }
    console.log(`seeded ${hikeIds.length}-hike shelf for @${handle}`);
  }

  console.log(`Done — ${count} shelf entries seeded across ${AUTHORS.length} personas.`);
  db.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
