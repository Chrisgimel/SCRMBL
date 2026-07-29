const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { initializeDatabase, runQuery, getQuery, allQuery, slugifyHandle, uniqueHandle } = require('./database');
const { matchTrail } = require('./trailMatcher');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'scrmbl-dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Initialize database
initializeDatabase();

// Simple auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized - Please sign in' });
  }
  next();
}

// ============================================
// AUTH ROUTES
// ============================================

// Simple sign in (creates user if doesn't exist)
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if user exists
    let user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);

    // Create user if doesn't exist
    if (!user) {
      const handle = await uniqueHandle(slugifyHandle(name, email));
      const result = await runQuery(
        'INSERT INTO users (email, name, handle) VALUES (?, ?, ?)',
        [email, name, handle]
      );
      user = await getQuery('SELECT * FROM users WHERE id = ?', [result.id]);
    }

    // An account created before handles existed still has none if it hasn't
    // been through a boot-time backfill — give it one now rather than leaving
    // the user unreachable at /api/users/:handle/gear.
    if (!user.handle) {
      const handle = await uniqueHandle(slugifyHandle(user.name, user.email), user.id);
      await runQuery('UPDATE users SET handle = ? WHERE id = ?', [handle, user.id]);
      user.handle = handle;
    }

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.userHandle = user.handle;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Check if user is signed in
app.get('/api/auth/me', (req, res) => {
  if (req.session.userId) {
    res.json({
      signedIn: true,
      user: {
        id: req.session.userId,
        email: req.session.userEmail,
        name: req.session.userName,
        handle: req.session.userHandle
      }
    });
  } else {
    res.json({ signedIn: false });
  }
});

// Sign out
app.post('/api/auth/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to sign out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ============================================
// BUCKLIST ROUTES
// ============================================

// Get user's bucklist
app.get('/api/bucklist', requireAuth, async (req, res) => {
  try {
    const bucklist = await allQuery(
      'SELECT * FROM bucklist WHERE user_id = ? ORDER BY added_date DESC',
      [req.session.userId]
    );
    res.json(bucklist);
  } catch (error) {
    console.error('Error fetching bucklist:', error);
    res.status(500).json({ error: 'Failed to fetch bucklist' });
  }
});

// Add trail to bucklist
app.post('/api/bucklist', requireAuth, async (req, res) => {
  try {
    const { trail_id } = req.body;

    if (!trail_id) {
      return res.status(400).json({ error: 'trail_id is required' });
    }

    const result = await runQuery(
      'INSERT INTO bucklist (user_id, trail_id) VALUES (?, ?)',
      [req.session.userId, trail_id]
    );

    const newItem = await getQuery(
      'SELECT * FROM bucklist WHERE id = ?',
      [result.id]
    );

    res.json({
      success: true,
      item: newItem
    });
  } catch (error) {
    // Handle duplicate entry (trail already in bucklist)
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Trail already in bucklist' });
    }
    console.error('Error adding to bucklist:', error);
    res.status(500).json({ error: 'Failed to add to bucklist' });
  }
});

// Remove trail from bucklist
app.delete('/api/bucklist/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await runQuery(
      'DELETE FROM bucklist WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Bucklist item not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from bucklist:', error);
    res.status(500).json({ error: 'Failed to remove from bucklist' });
  }
});

// Remove trail from bucklist by trail_id (alternative endpoint)
app.delete('/api/bucklist/trail/:trail_id', requireAuth, async (req, res) => {
  try {
    const { trail_id } = req.params;

    const result = await runQuery(
      'DELETE FROM bucklist WHERE trail_id = ? AND user_id = ?',
      [trail_id, req.session.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trail not found in bucklist' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from bucklist:', error);
    res.status(500).json({ error: 'Failed to remove from bucklist' });
  }
});

// Check if trail is in bucklist
app.get('/api/bucklist/check/:trail_id', requireAuth, async (req, res) => {
  try {
    const { trail_id } = req.params;

    const item = await getQuery(
      'SELECT * FROM bucklist WHERE user_id = ? AND trail_id = ?',
      [req.session.userId, trail_id]
    );

    res.json({
      inBucklist: !!item,
      item: item || null
    });
  } catch (error) {
    console.error('Error checking bucklist:', error);
    res.status(500).json({ error: 'Failed to check bucklist' });
  }
});

// Get likes for a review
app.get('/api/likes/:review_id', requireAuth, async (req, res) => {
  try {
    const { review_id } = req.params;
    const likes = await allQuery(
      'SELECT * FROM likes WHERE review_id = ? ORDER BY created_at DESC',
      [review_id]
    );
    res.json(likes);
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// Like a review
app.post('/api/likes', requireAuth, async (req, res) => {
  try {
    const { review_id } = req.body;
    if (!review_id) {
      return res.status(400).json({ error: 'review_id is required' });
    }

    const result = await runQuery(
      'INSERT INTO likes (user_id, review_id) VALUES (?, ?)',
      [req.session.userId, review_id]
    );

    const newLike = await getQuery(
      'SELECT * FROM likes WHERE id = ?',
      [result.id]
    );

    res.json(newLike);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Already liked this review' });
    }
    console.error('Error liking review:', error);
    res.status(500).json({ error: 'Failed to like review' });
  }
});

// Unlike a review
app.delete('/api/likes/:review_id', requireAuth, async (req, res) => {
  try {
    const { review_id } = req.params;

    const result = await runQuery(
      'DELETE FROM likes WHERE review_id = ? AND user_id = ?',
      [review_id, req.session.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error unliking review:', error);
    res.status(500).json({ error: 'Failed to unlike review' });
  }
});

// Get like count for a review
app.get('/api/likes/:review_id/count', async (req, res) => {
  try {
    const { review_id } = req.params;
    const result = await getQuery(
      'SELECT COUNT(*) as count FROM likes WHERE review_id = ?',
      [review_id]
    );
    res.json({ count: result.count || 0 });
  } catch (error) {
    console.error('Error fetching like count:', error);
    res.status(500).json({ error: 'Failed to fetch like count' });
  }
});

// ============================================
// GEAR ROUTES
// ============================================

// SQLite has no boolean type, and kits store their gear ids as JSON text.
// Normalize both at the edge so the client always sees the same shapes it
// used when gear lived in local state.
function toGear(row) {
  return { ...row, featured: !!row.featured };
}

function toKit(row) {
  let gearIds = [];
  try {
    gearIds = JSON.parse(row.gear_ids) || [];
  } catch (e) {
    console.error('Malformed gear_ids on kit', row.id);
  }
  const { gear_ids, ...rest } = row;
  return { ...rest, gearIds };
}

// Get signed-in user's gear
app.get('/api/gear', requireAuth, async (req, res) => {
  try {
    const gear = await allQuery(
      'SELECT * FROM gear WHERE user_id = ? ORDER BY id ASC',
      [req.session.userId]
    );
    res.json(gear.map(toGear));
  } catch (error) {
    console.error('Error fetching gear:', error);
    res.status(500).json({ error: 'Failed to fetch gear' });
  }
});

// Add a gear item
app.post('/api/gear', requireAuth, async (req, res) => {
  try {
    const { slot, name, brand, price, source, url, featured } = req.body;

    if (!slot || !name) {
      return res.status(400).json({ error: 'slot and name are required' });
    }

    const result = await runQuery(
      'INSERT INTO gear (user_id, slot, name, brand, price, source, url, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.session.userId, slot, name, brand || null, price || null, source || null, url || null, featured ? 1 : 0]
    );

    const newItem = await getQuery('SELECT * FROM gear WHERE id = ?', [result.id]);
    res.json(toGear(newItem));
  } catch (error) {
    console.error('Error adding gear:', error);
    res.status(500).json({ error: 'Failed to add gear' });
  }
});

// Update a gear item
app.put('/api/gear/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { slot, name, brand, price, source, url, featured } = req.body;

    const existing = await getQuery(
      'SELECT * FROM gear WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Gear item not found' });
    }

    await runQuery(
      'UPDATE gear SET slot = ?, name = ?, brand = ?, price = ?, source = ?, url = ?, featured = ? WHERE id = ? AND user_id = ?',
      [
        slot !== undefined ? slot : existing.slot,
        name !== undefined ? name : existing.name,
        brand !== undefined ? brand : existing.brand,
        price !== undefined ? price : existing.price,
        source !== undefined ? source : existing.source,
        url !== undefined ? url : existing.url,
        featured !== undefined ? (featured ? 1 : 0) : existing.featured,
        id,
        req.session.userId
      ]
    );

    const updated = await getQuery('SELECT * FROM gear WHERE id = ?', [id]);
    res.json(toGear(updated));
  } catch (error) {
    console.error('Error updating gear:', error);
    res.status(500).json({ error: 'Failed to update gear' });
  }
});

// Delete a gear item
app.delete('/api/gear/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await runQuery(
      'DELETE FROM gear WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gear item not found' });
    }

    // Scrub the deleted item from this user's kits, and drop any kit left
    // empty — otherwise a reload would resurrect kits holding dangling ids.
    const kits = await allQuery('SELECT * FROM kits WHERE user_id = ?', [req.session.userId]);
    for (const kit of kits) {
      const gearIds = toKit(kit).gearIds;
      if (!gearIds.some((g) => String(g) === String(id))) continue;

      const remaining = gearIds.filter((g) => String(g) !== String(id));
      if (remaining.length === 0) {
        await runQuery('DELETE FROM kits WHERE id = ? AND user_id = ?', [kit.id, req.session.userId]);
      } else {
        await runQuery(
          'UPDATE kits SET gear_ids = ? WHERE id = ? AND user_id = ?',
          [JSON.stringify(remaining), kit.id, req.session.userId]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting gear:', error);
    res.status(500).json({ error: 'Failed to delete gear' });
  }
});

// ============================================
// KIT ROUTES
// ============================================

// Get signed-in user's kits
app.get('/api/kits', requireAuth, async (req, res) => {
  try {
    const kits = await allQuery(
      'SELECT * FROM kits WHERE user_id = ? ORDER BY id ASC',
      [req.session.userId]
    );
    res.json(kits.map(toKit));
  } catch (error) {
    console.error('Error fetching kits:', error);
    res.status(500).json({ error: 'Failed to fetch kits' });
  }
});

// Create a kit
app.post('/api/kits', requireAuth, async (req, res) => {
  try {
    const { name, gearIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await runQuery(
      'INSERT INTO kits (user_id, name, gear_ids) VALUES (?, ?, ?)',
      [req.session.userId, name, JSON.stringify(gearIds || [])]
    );

    const newKit = await getQuery('SELECT * FROM kits WHERE id = ?', [result.id]);
    res.json(toKit(newKit));
  } catch (error) {
    console.error('Error creating kit:', error);
    res.status(500).json({ error: 'Failed to create kit' });
  }
});

// Update a kit
app.put('/api/kits/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gearIds } = req.body;

    const existing = await getQuery(
      'SELECT * FROM kits WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    await runQuery(
      'UPDATE kits SET name = ?, gear_ids = ? WHERE id = ? AND user_id = ?',
      [
        name !== undefined ? name : existing.name,
        gearIds !== undefined ? JSON.stringify(gearIds) : existing.gear_ids,
        id,
        req.session.userId
      ]
    );

    const updated = await getQuery('SELECT * FROM kits WHERE id = ?', [id]);
    res.json(toKit(updated));
  } catch (error) {
    console.error('Error updating kit:', error);
    res.status(500).json({ error: 'Failed to update kit' });
  }
});

// Delete a kit
app.delete('/api/kits/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await runQuery(
      'DELETE FROM kits WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting kit:', error);
    res.status(500).json({ error: 'Failed to delete kit' });
  }
});

// Get a user's gear by handle (read-only public endpoint)
app.get('/api/users/:handle/gear', async (req, res) => {
  try {
    const { handle } = req.params;

    const user = await getQuery(
      'SELECT id FROM users WHERE LOWER(handle) = LOWER(?)',
      [handle]
    );

    if (!user) {
      return res.json([]);
    }

    const gear = await allQuery(
      'SELECT * FROM gear WHERE user_id = ? ORDER BY id ASC',
      [user.id]
    );

    res.json(gear.map(toGear));
  } catch (error) {
    console.error('Error fetching user gear:', error);
    res.status(500).json({ error: 'Failed to fetch user gear' });
  }
});

// ============================================
// GEOCODE ROUTE
// ============================================

// Resolve a free-text place name to coordinates via Nominatim (OSM), so
// custom hikes (which collect no lat/long today) can become eligible for
// the same trail-geometry pipeline as seeded hikes. No auth, no caching —
// this is a low-volume, user-initiated lookup (once per custom hike
// created), unlike the trail matcher which runs per trail view.
app.get('/api/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Missing query' });
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SCRMBL/0.1 (hiking log app, local dev)',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'Geocoding service unavailable' });
    }
    const results = await response.json();
    if (!results.length) {
      return res.json({ found: false });
    }
    res.json({
      found: true,
      lat: Number(results[0].lat),
      long: Number(results[0].lon),
      display_name: results[0].display_name,
    });
  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: 'Failed to geocode' });
  }
});

// ============================================
// TRAIL ROUTES
// ============================================

// Get a trail's route geometry (cached; read-only for now, no auth —
// public reference data, same as the like-count endpoint above)
app.get('/api/trails/:trail_id/geometry', async (req, res) => {
  try {
    const { trail_id } = req.params;
    const { name, lat, long, mi } = req.query;

    const cached = await getQuery(
      'SELECT points, confidence, source FROM trail_geometry WHERE trail_id = ?',
      [trail_id]
    );

    if (cached) {
      return res.json({
        points: JSON.parse(cached.points),
        confidence: cached.confidence,
        source: cached.source,
      });
    }

    // Cache miss: try to auto-match it against OpenStreetMap. Only persist
    // the result if the matcher reached a real verdict — an unreachable
    // Overpass isn't proof this trail has no data, so that case isn't
    // cached and just gets retried on the next view.
    const result = await matchTrail({ name, lat, long, mi });
    if (result.cacheable) {
      await runQuery(
        'INSERT OR IGNORE INTO trail_geometry (trail_id, points, confidence, source) VALUES (?, ?, ?, ?)',
        [trail_id, JSON.stringify(result.points), result.confidence, result.source]
      );
    }
    res.json({ points: result.points, confidence: result.confidence, source: result.source });
  } catch (error) {
    console.error('Error fetching trail geometry:', error);
    res.status(500).json({ error: 'Failed to fetch trail geometry' });
  }
});

// ============================================
// POI ROUTES (community tips/warnings/landmarks)
// ============================================

const POI_TYPES = ['warning', 'beta', 'landmark'];

// List POIs for a trail — public (no auth) so tips are visible to anyone
// viewing the map, same precedent as the public like-count endpoint. When a
// session cookie is present, each row is annotated with is_mine so the
// frontend can offer delete only to the author, without the client ever
// having to track its own numeric user id.
app.get('/api/trails/:trail_id/pois', async (req, res) => {
  try {
    const { trail_id } = req.params;
    const rows = await allQuery(
      `SELECT pois.id, pois.trail_id, pois.lat, pois.lng, pois.type, pois.title, pois.note,
              pois.user_id, pois.created_at, users.name AS author
       FROM pois JOIN users ON users.id = pois.user_id
       WHERE pois.trail_id = ?
       ORDER BY pois.created_at DESC`,
      [trail_id]
    );
    const myId = req.session.userId || null;
    const pois = rows.map(({ user_id, ...rest }) => ({ ...rest, is_mine: user_id === myId }));
    res.json(pois);
  } catch (error) {
    console.error('Error fetching POIs:', error);
    res.status(500).json({ error: 'Failed to fetch POIs' });
  }
});

// Add a POI
app.post('/api/pois', requireAuth, async (req, res) => {
  try {
    const { trail_id, lat, lng, type, title, note } = req.body;
    if (!trail_id || lat == null || lng == null || !POI_TYPES.includes(type) || !title || !title.trim()) {
      return res.status(400).json({ error: 'trail_id, lat, lng, a valid type, and a title are required' });
    }

    const result = await runQuery(
      'INSERT INTO pois (trail_id, user_id, lat, lng, type, title, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [trail_id, req.session.userId, lat, lng, type, title.trim(), note && note.trim() ? note.trim() : null]
    );

    const row = await getQuery(
      `SELECT pois.id, pois.trail_id, pois.lat, pois.lng, pois.type, pois.title, pois.note,
              pois.created_at, users.name AS author
       FROM pois JOIN users ON users.id = pois.user_id WHERE pois.id = ?`,
      [result.id]
    );
    res.json({ ...row, is_mine: true });
  } catch (error) {
    console.error('Error adding POI:', error);
    res.status(500).json({ error: 'Failed to add POI' });
  }
});

// Delete a POI (author only)
app.delete('/api/pois/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery(
      'DELETE FROM pois WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tip not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting POI:', error);
    res.status(500).json({ error: 'Failed to delete POI' });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n🏔️  SCRMBL Server running on http://localhost:${PORT}`);
  console.log(`Ready to accept requests from http://localhost:3000\n`);
});
