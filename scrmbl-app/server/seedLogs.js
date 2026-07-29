// One-time seed: the community's hike diary, so the feed, Discover's
// trending math, trail pages and profiles all read real rows from
// /api/community/logs instead of a hardcoded frontend constant.
// Mirrors seedGear.js — same @scrmbl.demo authors, same clear-and-reseed.
// Run manually: node seedLogs.js
const { initializeDatabase, runQuery, getQuery, db } = require('./database');

// Same personas as SEED_USERS / seedGear.js. Handle is what the frontend
// puts in a profile URL, so it has to match exactly.
const AUTHORS = [
  { email: 'rachel.p@scrmbl.demo', name: 'Rachel P.', handle: 'ridgelinerachel' },
  { email: 'tom.v@scrmbl.demo', name: 'Tom V.', handle: 'talus.tom' },
  { email: 'maya.l@scrmbl.demo', name: 'Maya L.', handle: 'cairn_queen' },
  { email: 'sam.o@scrmbl.demo', name: 'Sam O.', handle: 'scree.sam' },
  { email: 'bri.k@scrmbl.demo', name: 'Bri K.', handle: 'basin.bri' },
];

// Lifted verbatim from the frontend's COMMUNITY_LOGS, which is deleted in
// the same change — this script is now the only copy. Photos stay as remote
// URLs; only user uploads become /uploads paths. The dead `handleAlt` flag
// on cl4 was dropped, since nothing read it.
const LOGS = [
  { id: 'cl1', handle: 'ridgelinerachel', hikeId: 'icelakes', date: '2026-07-04', rating: 10, effort: 'worked', review: 'The upper basin is a different planet in early July. Wildflowers to the knee and that water color nobody believes in photos.', photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1511316695145-4992006ffddb?w=400&h=400&fit=crop'] },
  { id: 'cl2', handle: 'ridgelinerachel', hikeId: 'bluelakes', date: '2026-06-28', rating: 9, effort: 'worked', review: 'Do it midweek. The middle lake is the one worth the extra climb.', photos: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop'] },
  { id: 'cl3', handle: 'ridgelinerachel', hikeId: 'skypond', date: '2026-06-11', rating: 8, effort: 'worked', review: 'Falls were still icy. Took the left line, wished for microspikes the whole way.', time: 300 },
  { id: 'cl4', handle: 'talus.tom', hikeId: 'grays', date: '2026-07-06', rating: 8, effort: 'worked', review: "Two summits, one parking headache. Get there before 5am or don't bother.", photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'] },
  { id: 'cl5', handle: 'talus.tom', hikeId: 'bierstadt', date: '2026-06-19', rating: 7, effort: 'cruised', review: 'The friendliest 14er there is. Willows at the start are the worst part, which tells you everything.' },
  { id: 'cl6', handle: 'talus.tom', hikeId: 'sanitas', date: '2026-05-30', rating: 7, effort: 'worked', review: 'Short, steep, and honest. My default after-work punishment.' },
  { id: 'cl7', handle: 'cairn_queen', hikeId: 'quandary', date: '2026-06-30', rating: 9, effort: 'worked', review: 'Goats at 13,200 completely stole the show. East ridge is a highway but it earns its traffic.', photos: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1465056836643-15a5c3f00d8e?w=400&h=400&fit=crop'] },
  { id: 'cl8', handle: 'cairn_queen', hikeId: 'keyhole', date: '2026-07-09', rating: 10, effort: 'type2', review: 'The Ledges will rearrange your relationship with exposure. Turned around twice in past years — this one counted.', photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1511316695145-4992006ffddb?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop'] },
  { id: 'cl9', handle: 'cairn_queen', hikeId: 'grays', date: '2026-06-14', rating: 7, effort: 'cruised', review: 'Good early-season legs check. Torreys is the better summit and nobody says so.' },
  { id: 'cl10', handle: 'scree.sam', hikeId: 'keyhole', date: '2026-06-27', rating: 9, effort: 'brutal', review: 'Left at 2am, back by noon, destroyed by 1pm. The Trough is a gravel treadmill.' },
  { id: 'cl11', handle: 'scree.sam', hikeId: 'sanitas', date: '2026-07-11', rating: 6, effort: 'cruised', review: "Fine. It's a stairmaster with a view. I do it twice a week and complain every time." },
  { id: 'cl12', handle: 'scree.sam', hikeId: 'skypond', date: '2026-05-24', rating: 9, effort: 'worked', review: 'Timberline Falls in snow is a genuinely different hike. Bring traction into June.', photos: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop'], time: 290 },
  { id: 'cl13', handle: 'basin.bri', hikeId: 'chicago', date: '2026-06-22', rating: 10, effort: 'brutal', review: 'Three days, one train, zero regrets. The goats will eat your trekking pole grips if you let them.' },
  { id: 'cl14', handle: 'basin.bri', hikeId: 'icelakes', date: '2026-07-08', rating: 9, effort: 'worked', review: "Second time here and it still doesn't look real. Island Lake if you have the legs left.", photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1511316695145-4992006ffddb?w=400&h=400&fit=crop'] },
  { id: 'cl15', handle: 'basin.bri', hikeId: 'hanging', date: '2026-06-05', rating: 5, effort: 'cruised', review: "Gorgeous, and you'll share every inch of it. The permit system helps more than people admit." },
  { id: 'cl16', handle: 'talus.tom', hikeId: 'hanging', date: '2026-05-18', rating: 6, effort: 'cruised', review: 'Worth doing once. Bring the permit screenshot, service dies in the canyon.' },
  { id: 'cl17', handle: 'cairn_queen', hikeId: 'bierstadt', date: '2026-07-02', rating: 8, effort: 'cruised', review: 'Sunrise from the top with the whole Sawtooth lit up. First 14er I ever did, still on the shelf.', photos: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop'] },
];

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
      await runQuery('UPDATE users SET handle = ? WHERE id = ?', [a.handle, user.id]);
      console.log(`rehandled ${a.name}: @${user.handle || 'none'} -> @${a.handle}`);
    }
    userIdByHandle[a.handle] = user.id;
  }

  // Idempotent: clear this script's own prior rows before reseeding.
  for (const uid of Object.values(userIdByHandle)) {
    await runQuery('DELETE FROM logs WHERE user_id = ?', [uid]);
  }

  let seeded = 0;
  for (const l of LOGS) {
    const userId = userIdByHandle[l.handle];
    if (!userId) {
      console.log(`skip ${l.id} — no user for @${l.handle}`);
      continue;
    }

    await runQuery(
      `INSERT INTO logs (user_id, log_id, hike_id, date, rating, effort, review, liked, time, photos, gear, track)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, '[]', NULL)`,
      [
        userId, l.id, l.hikeId, l.date, l.rating ?? null, l.effort || null,
        l.review || null, l.time ?? null, JSON.stringify(l.photos || []),
      ]
    );
    seeded++;
  }

  console.log(`Done — ${seeded} community logs seeded across ${AUTHORS.length} hikers.`);
  db.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
