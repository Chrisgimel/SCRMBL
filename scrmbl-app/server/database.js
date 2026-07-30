const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database
const dbPath = path.join(__dirname, 'db', 'scrmbl.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Initialize tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table (for basic auth)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        handle TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table ready');
      }
    });

    // Migration: `handle` is newer than the users table. SQLite can't add a
    // UNIQUE column via ALTER, so the column goes on plain and uniqueness
    // comes from an index created after existing rows are backfilled.
    db.run('ALTER TABLE users ADD COLUMN handle TEXT', (err) => {
      if (err && !/duplicate column/i.test(err.message)) {
        console.error('Error adding users.handle column:', err);
        return;
      }
      backfillHandles();
    });

    // Bucklist table
    db.run(`
      CREATE TABLE IF NOT EXISTS bucklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        trail_id TEXT NOT NULL,
        added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, trail_id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating bucklist table:', err);
      } else {
        console.log('Bucklist table ready');
      }
    });

    // Likes table
    db.run(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        review_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, review_id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating likes table:', err);
      } else {
        console.log('Likes table ready');
      }
    });

    // Gear table
    db.run(`
      CREATE TABLE IF NOT EXISTS gear (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        slot TEXT NOT NULL,
        name TEXT NOT NULL,
        brand TEXT,
        price REAL,
        source TEXT,
        url TEXT,
        featured INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating gear table:', err);
      } else {
        console.log('Gear table ready');
      }
    });

    // Migration: `source` was missing from the first version of the gear
    // table. CREATE TABLE IF NOT EXISTS won't add it to an existing db, so
    // add it here and ignore the duplicate-column error on later boots.
    db.run('ALTER TABLE gear ADD COLUMN source TEXT', (err) => {
      if (err && !/duplicate column/i.test(err.message)) {
        console.error('Error adding gear.source column:', err);
      }
    });

    // Kits table — gear_ids is JSON-encoded array of gear.id values
    db.run(`
      CREATE TABLE IF NOT EXISTS kits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        gear_ids TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating kits table:', err);
      } else {
        console.log('Kits table ready');
      }
    });

    // Custom hikes table — routes a user created themselves, which seeded
    // hikes (SEED_HIKES) don't cover. hike_id is the client-generated string
    // id (uid("c")), kept as-is rather than swapped for an autoincrement:
    // logs reference hikes by that string, and seeded hikes use string ids
    // like "bierstadt" too, so both kinds stay interchangeable.
    db.run(`
      CREATE TABLE IF NOT EXISTS custom_hikes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hike_id TEXT NOT NULL,
        name TEXT NOT NULL,
        area TEXT,
        mi REAL,
        gain REAL,
        summit REAL,
        klass INTEGER,
        hue INTEGER,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, hike_id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating custom_hikes table:', err);
      } else {
        console.log('Custom hikes table ready');
      }
    });

    // Logs table — the hike diary, the core of the app. log_id is the
    // client-generated uid("l") string, preserved because likes.review_id
    // already points at it; renumbering would orphan every existing like.
    // photos/gear/track are JSON text. photos holds uploaded URLs (see
    // /api/photos), not the base64 data URIs the picker produces.
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        log_id TEXT NOT NULL,
        hike_id TEXT NOT NULL,
        date TEXT NOT NULL,
        rating INTEGER,
        effort TEXT,
        review TEXT,
        liked INTEGER DEFAULT 0,
        time INTEGER,
        photos TEXT NOT NULL DEFAULT '[]',
        gear TEXT NOT NULL DEFAULT '[]',
        track TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, log_id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating logs table:', err);
      } else {
        console.log('Logs table ready');
      }
    });

    // Trail geometry table — cached real-world route data per trail, fetched
    // from OpenStreetMap on first view and reused for every user after that.
    // points is JSON-encoded [[lat,lon],...]; '[]' means a confirmed no-match
    // (negative cache, so a bad trail isn't re-queried on every view).
    db.run(`
      CREATE TABLE IF NOT EXISTS trail_geometry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trail_id TEXT NOT NULL UNIQUE,
        points TEXT NOT NULL,
        confidence TEXT NOT NULL,
        source TEXT,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating trail_geometry table:', err);
      } else {
        console.log('Trail geometry table ready');
      }
    });

    // POIs table — community tips/warnings/landmarks pinned to a location on
    // a trail. Cross-account by design (unlike GPS tracks/photos, which are
    // local proof-of-your-own-hike data): same shape as `likes`, a user_id
    // FK plus a shared public read endpoint.
    db.run(`
      CREATE TABLE IF NOT EXISTS pois (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trail_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating pois table:', err);
      } else {
        console.log('POIs table ready');
      }
    });

    // Top hikes table — a user's ranked shelf. position is the 0-based rank,
    // and the whole list is rewritten on every save: it is short (TOP_CAP) and
    // reordering shifts most rows anyway, so per-row updates would buy nothing
    // and could leave gaps mid-failure. Cross-account read, like pois: a hike
    // page shows who else ranks it and where.
    db.run(`
      CREATE TABLE IF NOT EXISTS top_hikes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hike_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, hike_id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating top_hikes table:', err);
      } else {
        console.log('Top hikes table ready');
      }
    });
  });
}

// Turn a display name (or email) into a handle: "Rachel P." -> "rachelp".
// Community handles like "talus.tom" keep dots and underscores, so those are
// preserved when a name already contains them.
function slugifyHandle(name, email) {
  // Trailing separators are stripped so "Rachel P." lands on "rachelp",
  // not "rachelp."
  const clean = (raw) => (raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^[._]+|[._]+$/g, '');

  return clean(name) || clean((email || '').split('@')[0]) || 'hiker';
}

// Find a free handle, suffixing a number on collision: rachelp, rachelp2, ...
async function uniqueHandle(base, excludeUserId = null) {
  let candidate = base;
  let n = 1;

  for (;;) {
    const clash = await getQuery(
      'SELECT id FROM users WHERE LOWER(handle) = LOWER(?) AND id IS NOT ?',
      [candidate, excludeUserId]
    );
    if (!clash) return candidate;
    n += 1;
    candidate = `${base}${n}`;
  }
}

// Give every pre-existing user a handle, then enforce uniqueness. Runs on
// every boot but only touches rows where handle IS NULL, so it is a no-op
// once the backfill has happened.
async function backfillHandles() {
  try {
    const pending = await allQuery('SELECT id, name, email FROM users WHERE handle IS NULL');

    for (const user of pending) {
      const handle = await uniqueHandle(slugifyHandle(user.name, user.email), user.id);
      await runQuery('UPDATE users SET handle = ? WHERE id = ?', [handle, user.id]);
      console.log(`Assigned handle @${handle} to user ${user.id}`);
    }

    await runQuery('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle ON users(handle)');
    console.log('User handles ready');
  } catch (err) {
    console.error('Error backfilling user handles:', err);
  }
}

// Helper function to run queries with promises
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Helper function to get data with promises
function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Helper function to get all rows with promises
function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  initializeDatabase,
  runQuery,
  getQuery,
  allQuery,
  slugifyHandle,
  uniqueHandle
};
