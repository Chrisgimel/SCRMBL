const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
// Photos arrive as base64 data URIs in the JSON body, which blows past the
// default 100kb limit — /api/photos writes them to disk so they don't end up
// inline in a log row.
app.use(express.json({ limit: '12mb' }));

// Uploaded photos are served straight off disk
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));
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

// Your own editable profile. Kept separate from /api/auth/me, which answers
// only "is there a session" from session data and never reads the table.
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const user = await getQuery(
      'SELECT name, handle, city, bio FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      name: user.name,
      handle: user.handle,
      city: user.city || '',
      bio: user.bio || '',
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update the fields Settings can edit. The handle is deliberately not one of
// them: it has to stay unique, other users' links point at it, and nothing in
// the UI offers to change it.
app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const { name, city, bio } = req.body;

    // A blank display name would leave the account showing as nothing at all
    // on every review card, so it's the one required field.
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    await runQuery(
      'UPDATE users SET name = ?, city = ?, bio = ? WHERE id = ?',
      [name.trim(), (city || '').trim(), (bio || '').trim(), req.session.userId]
    );

    // The session caches the name for /api/auth/me, so it has to move too or
    // a reload would show the old one until the next sign-in.
    req.session.userName = name.trim();

    const user = await getQuery(
      'SELECT name, handle, city, bio FROM users WHERE id = ?',
      [req.session.userId]
    );

    res.json({
      name: user.name,
      handle: user.handle,
      city: user.city || '',
      bio: user.bio || '',
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
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

// Public profile for a handle, so a real account — not just one of the five
// seed personas the frontend hardcodes — can be opened from a feed, a shelf
// or a trail page. Only what a profile page renders: email is never exposed
// here, and city/bio come back as empty strings until the user sets them.
app.get('/api/users/:handle', async (req, res) => {
  try {
    const user = await getQuery(
      'SELECT handle, name, city, bio FROM users WHERE LOWER(handle) = LOWER(?)',
      [req.params.handle]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      handle: user.handle,
      name: user.name,
      city: user.city || '',
      bio: user.bio || '',
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
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
// PHOTO UPLOAD
// ============================================

const PHOTO_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Accepts the base64 data URI the photo picker produces, writes it to disk,
// and hands back a URL. Keeps multi-megabyte blobs out of the logs table and
// off every subsequent sync.
app.post('/api/photos', requireAuth, async (req, res) => {
  try {
    const { dataUrl } = req.body;

    if (typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'dataUrl is required' });
    }

    // Already an uploaded URL (or a remote seed image)? Nothing to do.
    if (!dataUrl.startsWith('data:')) {
      return res.json({ url: dataUrl });
    }

    const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl);
    if (!match) {
      return res.status(400).json({ error: 'Malformed data URI' });
    }

    const ext = PHOTO_TYPES[match[1].toLowerCase()];
    if (!ext) {
      return res.status(415).json({ error: `Unsupported image type: ${match[1]}` });
    }

    const buffer = Buffer.from(match[2], 'base64');
    const filename = `${crypto.randomUUID()}.${ext}`;
    await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), buffer);

    res.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// ============================================
// CUSTOM HIKE ROUTES
// ============================================

function toCustomHike(row) {
  let location = null;
  try {
    location = row.location ? JSON.parse(row.location) : null;
  } catch (e) {
    console.error('Malformed location on custom hike', row.hike_id);
  }

  return {
    id: row.hike_id,
    name: row.name,
    area: row.area,
    mi: row.mi,
    gain: row.gain,
    summit: row.summit,
    klass: row.klass,
    hue: row.hue,
    custom: true,
    ...(location ? { location } : {}),
  };
}

app.get('/api/custom-hikes', requireAuth, async (req, res) => {
  try {
    const rows = await allQuery(
      'SELECT * FROM custom_hikes WHERE user_id = ? ORDER BY created_at ASC',
      [req.session.userId]
    );
    res.json(rows.map(toCustomHike));
  } catch (error) {
    console.error('Error fetching custom hikes:', error);
    res.status(500).json({ error: 'Failed to fetch custom hikes' });
  }
});

app.post('/api/custom-hikes', requireAuth, async (req, res) => {
  try {
    const { id, name, area, mi, gain, summit, klass, hue, location } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }

    // Idempotent on (user_id, hike_id) so a retry can't duplicate a route.
    await runQuery(
      `INSERT INTO custom_hikes (user_id, hike_id, name, area, mi, gain, summit, klass, hue, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, hike_id) DO UPDATE SET
         name = excluded.name, area = excluded.area, mi = excluded.mi,
         gain = excluded.gain, summit = excluded.summit, klass = excluded.klass,
         hue = excluded.hue, location = excluded.location`,
      [
        req.session.userId, id, name, area || null,
        mi ?? null, gain ?? null, summit ?? null, klass ?? null, hue ?? null,
        location ? JSON.stringify(location) : null,
      ]
    );

    const row = await getQuery(
      'SELECT * FROM custom_hikes WHERE user_id = ? AND hike_id = ?',
      [req.session.userId, id]
    );
    res.json(toCustomHike(row));
  } catch (error) {
    console.error('Error saving custom hike:', error);
    res.status(500).json({ error: 'Failed to save custom hike' });
  }
});

app.delete('/api/custom-hikes/:hike_id', requireAuth, async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM custom_hikes WHERE hike_id = ? AND user_id = ?',
      [req.params.hike_id, req.session.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Custom hike not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom hike:', error);
    res.status(500).json({ error: 'Failed to delete custom hike' });
  }
});

// ============================================
// LOG ROUTES
// ============================================

function jsonOr(raw, fallback, label, id) {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    console.error(`Malformed ${label} on log`, id);
    return fallback;
  }
}

function toLog(row) {
  return {
    id: row.log_id,
    hikeId: row.hike_id,
    date: row.date,
    rating: row.rating,
    effort: row.effort,
    review: row.review,
    liked: !!row.liked,
    time: row.time,
    photos: jsonOr(row.photos, [], 'photos', row.log_id),
    gear: jsonOr(row.gear, [], 'gear', row.log_id),
    track: row.track ? jsonOr(row.track, null, 'track', row.log_id) : null,
  };
}

// Get signed-in user's logs
app.get('/api/logs', requireAuth, async (req, res) => {
  try {
    const rows = await allQuery(
      'SELECT * FROM logs WHERE user_id = ? ORDER BY date DESC',
      [req.session.userId]
    );
    res.json(rows.map(toLog));
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Create or update a log. Upsert on (user_id, log_id) so the client keeps
// owning the id — likes.review_id points at it, so it must not change.
app.post('/api/logs', requireAuth, async (req, res) => {
  try {
    const { id, hikeId, date, rating, effort, review, liked, time, photos, gear, track } = req.body;

    if (!id || !hikeId || !date) {
      return res.status(400).json({ error: 'id, hikeId and date are required' });
    }

    await runQuery(
      `INSERT INTO logs (user_id, log_id, hike_id, date, rating, effort, review, liked, time, photos, gear, track)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, log_id) DO UPDATE SET
         hike_id = excluded.hike_id, date = excluded.date, rating = excluded.rating,
         effort = excluded.effort, review = excluded.review, liked = excluded.liked,
         time = excluded.time, photos = excluded.photos, gear = excluded.gear,
         track = excluded.track`,
      [
        req.session.userId, id, hikeId, date,
        rating ?? null, effort || null, review || null, liked ? 1 : 0, time ?? null,
        JSON.stringify(photos || []), JSON.stringify(gear || []),
        track ? JSON.stringify(track) : null,
      ]
    );

    const row = await getQuery(
      'SELECT * FROM logs WHERE user_id = ? AND log_id = ?',
      [req.session.userId, id]
    );
    res.json(toLog(row));
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// Delete a log
app.delete('/api/logs/:log_id', requireAuth, async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM logs WHERE log_id = ? AND user_id = ?',
      [req.params.log_id, req.session.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// The community diary: every user's logs with the author's handle attached,
// plus the custom hikes they reference so a viewer can resolve every hikeId.
// Public and unauthenticated — this is what the feed, Discover's trending
// math and trail pages read, and it replaced the COMMUNITY_LOGS constant.
app.get('/api/community/logs', async (req, res) => {
  try {
    // Your own entries are excluded: the client already holds them in
    // state.logs and merges the two lists (see entriesFor), so including
    // them here would show every one of your hikes twice.
    const viewerId = req.session.userId || null;

    const [logRows, hikeRows] = await Promise.all([
      allQuery(`
        SELECT logs.*, users.handle AS handle
        FROM logs
        JOIN users ON users.id = logs.user_id
        WHERE users.handle IS NOT NULL AND logs.user_id IS NOT ?
        ORDER BY logs.date DESC
        LIMIT 500
      `, [viewerId]),
      allQuery('SELECT * FROM custom_hikes WHERE user_id IS NOT ?', [viewerId]),
    ]);

    res.json({
      logs: logRows.map((row) => ({ ...toLog(row), handle: row.handle })),
      customHikes: hikeRows.map(toCustomHike),
    });
  } catch (error) {
    console.error('Error fetching community logs:', error);
    res.status(500).json({ error: 'Failed to fetch community logs' });
  }
});

// Get a user's logs by handle (read-only public endpoint), alongside the
// custom hikes those logs reference so a viewer can resolve every hikeId.
app.get('/api/users/:handle/logs', async (req, res) => {
  try {
    const user = await getQuery(
      'SELECT id FROM users WHERE LOWER(handle) = LOWER(?)',
      [req.params.handle]
    );

    if (!user) {
      return res.json({ logs: [], customHikes: [] });
    }

    const [logRows, hikeRows] = await Promise.all([
      allQuery('SELECT * FROM logs WHERE user_id = ? ORDER BY date DESC', [user.id]),
      allQuery('SELECT * FROM custom_hikes WHERE user_id = ?', [user.id]),
    ]);

    res.json({
      logs: logRows.map(toLog),
      customHikes: hikeRows.map(toCustomHike),
    });
  } catch (error) {
    console.error('Error fetching user logs:', error);
    res.status(500).json({ error: 'Failed to fetch user logs' });
  }
});

// ============================================
// TOP HIKES ROUTES
// ============================================

// Your ranked shelf, in rank order.
app.get('/api/top', requireAuth, async (req, res) => {
  try {
    const rows = await allQuery(
      'SELECT hike_id FROM top_hikes WHERE user_id = ? ORDER BY position ASC',
      [req.session.userId]
    );
    res.json(rows.map((row) => row.hike_id));
  } catch (error) {
    console.error('Error fetching top hikes:', error);
    res.status(500).json({ error: 'Failed to fetch top hikes' });
  }
});

// Replace your ranked shelf wholesale. Every write is a reorder or a
// removal that shifts most positions anyway, so diffing rows would be more
// code for the same result. Wrapped in a transaction because a crash between
// the delete and the inserts would otherwise silently truncate the shelf.
app.put('/api/top', requireAuth, async (req, res) => {
  const { top } = req.body;

  if (!Array.isArray(top)) {
    return res.status(400).json({ error: 'top must be an array of hike ids' });
  }

  // Duplicates would violate UNIQUE(user_id, hike_id) partway through and
  // roll back a legitimate-looking request, so collapse them up front. The
  // first occurrence wins, since that is the better rank.
  const ordered = [...new Set(top.filter((id) => typeof id === 'string' && id))];

  try {
    await runQuery('BEGIN TRANSACTION');
    try {
      await runQuery('DELETE FROM top_hikes WHERE user_id = ?', [req.session.userId]);

      for (let i = 0; i < ordered.length; i += 1) {
        await runQuery(
          'INSERT INTO top_hikes (user_id, hike_id, position) VALUES (?, ?, ?)',
          [req.session.userId, ordered[i], i]
        );
      }

      await runQuery('COMMIT');
    } catch (inner) {
      await runQuery('ROLLBACK');
      throw inner;
    }

    res.json(ordered);
  } catch (error) {
    console.error('Error saving top hikes:', error);
    res.status(500).json({ error: 'Failed to save top hikes' });
  }
});

// Everyone's ranked shelves, keyed by handle — this is what powers "ranked
// by" on a hike page and the Top Hikes grid on a community profile. Public
// and unauthenticated; it replaced the COMMUNITY_TOP constant.
app.get('/api/community/top', async (req, res) => {
  try {
    // Your own shelf is excluded, same as /api/community/logs. A hike page
    // renders your rank from state.top in its own card above the others
    // (HikeScreen's myTop), so including you here would list you twice.
    const viewerId = req.session.userId || null;

    const rows = await allQuery(`
      SELECT top_hikes.hike_id, top_hikes.position, users.handle AS handle
      FROM top_hikes
      JOIN users ON users.id = top_hikes.user_id
      WHERE users.handle IS NOT NULL AND top_hikes.user_id IS NOT ?
      ORDER BY users.handle ASC, top_hikes.position ASC
    `, [viewerId]);

    const top = {};
    for (const row of rows) {
      (top[row.handle] = top[row.handle] || []).push(row.hike_id);
    }

    res.json({ top });
  } catch (error) {
    console.error('Error fetching community top hikes:', error);
    res.status(500).json({ error: 'Failed to fetch community top hikes' });
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
