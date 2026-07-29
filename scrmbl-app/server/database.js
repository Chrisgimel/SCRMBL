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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table ready');
      }
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
  });
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
  allQuery
};
