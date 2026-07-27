// One-time seed: loads the trail geometry hand-verified during the initial
// mapping session (real OSM data, matched and sanity-checked by hand) into
// the trail_geometry cache table, so the automated matcher (once it exists)
// doesn't redo — and potentially regress — that judgment-heavy work.
// Run manually: node seedTrailGeometry.js
const fs = require('fs');
const path = require('path');
const { initializeDatabase, runQuery, db } = require('./database');

const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'seedTrailGeometry.json'), 'utf8'));

async function seed() {
  initializeDatabase();
  // let CREATE TABLE IF NOT EXISTS finish before inserting
  await new Promise((resolve) => setTimeout(resolve, 300));

  for (const row of rows) {
    await runQuery(
      'INSERT OR REPLACE INTO trail_geometry (trail_id, points, confidence, source) VALUES (?, ?, ?, ?)',
      [row.trail_id, JSON.stringify(row.points), row.confidence, row.source]
    );
    console.log(`seeded ${row.trail_id} (${row.confidence}, ${row.points.length} points)`);
  }

  db.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
