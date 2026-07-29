// One-time seed: gear lockers for the community personas, so other users'
// gear on UserScreen comes from the real /api/users/:handle/gear endpoint
// instead of a hardcoded frontend constant. Mirrors seedPois.js — same
// @scrmbl.demo authors, same clear-and-reseed idempotency.
// Run manually: node seedGear.js
const { initializeDatabase, runQuery, getQuery, allQuery, db } = require('./database');

// The same personas as SEED_USERS (src/constants/index.js). `handle` is the
// important part: it has to match the frontend's handle exactly, since that
// is what UserScreen puts in the URL when opening a profile.
const AUTHORS = [
  { email: 'rachel.p@scrmbl.demo', name: 'Rachel P.', handle: 'ridgelinerachel' },
  { email: 'tom.v@scrmbl.demo', name: 'Tom V.', handle: 'talus.tom' },
  { email: 'maya.l@scrmbl.demo', name: 'Maya L.', handle: 'cairn_queen' },
  { email: 'sam.o@scrmbl.demo', name: 'Sam O.', handle: 'scree.sam' },
  { email: 'bri.k@scrmbl.demo', name: 'Bri K.', handle: 'basin.bri' },
];

// Lifted from the frontend's COMMUNITY_GEAR constant, which UserScreen used
// to read directly. Kept identical so profiles look the same as before — the
// difference is that this is now real rows a real query returns.
const GEAR_BY_HANDLE = {
  ridgelinerachel: [
    { slot: 'shell', name: 'Alpha FL Jacket', brand: "Arc'teryx", price: 699, featured: true },
    { slot: 'pack', name: 'Kestrel 48', brand: 'Osprey', price: 220, featured: true },
    { slot: 'boots', name: 'Teton 3 GTX', brand: 'Merrell', price: 180, featured: true },
    { slot: 'base', name: 'Merino 150 Baselayer', brand: 'Smartwool', price: 80, featured: false },
  ],
  'talus.tom': [
    { slot: 'shell', name: 'Outdoor Research Triolet', brand: 'Outdoor Research', price: 449, featured: true },
    { slot: 'pack', name: 'Deuter Aircontact 65+10', brand: 'Deuter', price: 280, featured: true },
    { slot: 'boots', name: 'Scarpa Mont Blanc Pro GTX', brand: 'Scarpa', price: 320, featured: true },
    { slot: 'poles', name: 'UL Flight Trek', brand: 'Black Diamond', price: 130, featured: false },
  ],
  cairn_queen: [
    { slot: 'shell', name: 'Storm10 Jacket', brand: 'The North Face', price: 399, featured: true },
    { slot: 'pack', name: 'Hiking Pack 60', brand: 'Gregory', price: 240, featured: true },
    { slot: 'boots', name: 'Speedgoat 5', brand: 'Hoka', price: 160, featured: true },
    { slot: 'traction', name: 'Microspikes', brand: 'Kahtoola', price: 80, featured: false },
  ],
  'scree.sam': [
    { slot: 'shell', name: 'Hyperlite Mountain Gear', brand: 'Hyperlite', price: 285, featured: true },
    { slot: 'pack', name: 'Osprey Stratos 34', brand: 'Osprey', price: 180, featured: true },
    { slot: 'boots', name: 'Salomon Speed Assault', brand: 'Salomon', price: 170, featured: true },
  ],
  'basin.bri': [
    { slot: 'shell', name: 'Torrentshell 3D Jacket', brand: 'Patagonia', price: 339, featured: true },
    { slot: 'pack', name: 'Peak Design Travel Backpack', brand: 'Peak Design', price: 250, featured: true },
    { slot: 'boots', name: 'Lowa Renegade GTX', brand: 'Lowa', price: 260, featured: true },
    { slot: 'sleep', name: 'Nemo Disco 15', brand: 'Nemo', price: 399, featured: false },
  ],
};

// Kits for the personas who'd plausibly keep one — built from gear that was
// just inserted for that same user, so gear_ids always resolve.
const KITS_BY_HANDLE = {
  ridgelinerachel: [{ name: 'Alpine day kit', items: ['Alpha FL Jacket', 'Kestrel 48', 'Teton 3 GTX'] }],
  'talus.tom': [{ name: 'Big mountain kit', items: ['Outdoor Research Triolet', 'Scarpa Mont Blanc Pro GTX', 'UL Flight Trek'] }],
  cairn_queen: [{ name: 'Winter 14er kit', items: ['Storm10 Jacket', 'Speedgoat 5', 'Microspikes'] }],
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
    await runQuery('DELETE FROM kits WHERE user_id = ?', [uid]);
    await runQuery('DELETE FROM gear WHERE user_id = ?', [uid]);
  }

  let gearCount = 0;
  for (const [handle, items] of Object.entries(GEAR_BY_HANDLE)) {
    const userId = userIdByHandle[handle];
    for (const g of items) {
      await runQuery(
        'INSERT INTO gear (user_id, slot, name, brand, price, source, url, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, g.slot, g.name, g.brand, g.price, null, null, g.featured ? 1 : 0]
      );
      gearCount++;
    }
    console.log(`seeded ${items.length} gear items for @${handle}`);
  }

  let kitCount = 0;
  for (const [handle, kits] of Object.entries(KITS_BY_HANDLE)) {
    const userId = userIdByHandle[handle];
    const owned = await allQuery('SELECT id, name FROM gear WHERE user_id = ?', [userId]);

    for (const kit of kits) {
      const gearIds = kit.items
        .map((itemName) => owned.find((g) => g.name === itemName)?.id)
        .filter((id) => id != null);

      if (gearIds.length !== kit.items.length) {
        console.log(`skip kit "${kit.name}" for @${handle} — gear name mismatch`);
        continue;
      }

      await runQuery(
        'INSERT INTO kits (user_id, name, gear_ids) VALUES (?, ?, ?)',
        [userId, kit.name, JSON.stringify(gearIds)]
      );
      kitCount++;
      console.log(`seeded kit "${kit.name}" for @${handle}`);
    }
  }

  console.log(`Done — ${gearCount} gear items and ${kitCount} kits seeded.`);
  db.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
