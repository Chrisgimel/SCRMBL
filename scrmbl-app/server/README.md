# SCRMBL Server

Backend API server for the SCRMBL hiking app.

## Tech Stack
- **Express.js** - REST API server
- **SQLite3** - Local file-based database
- **express-session** - Session-based authentication

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server runs on **http://localhost:3001**

## Database

SQLite database file is created at: `server/db/scrmbl.db`

### Tables

**users**
- `id` - Primary key
- `email` - Unique email
- `name` - User's name
- `created_at` - Timestamp

**bucklist**
- `id` - Primary key
- `user_id` - Foreign key to users
- `trail_id` - Trail identifier (matches App.js hike IDs)
- `added_date` - Timestamp
- Unique constraint on (user_id, trail_id)

## API Endpoints

### Authentication

**POST /api/auth/signin**
- Body: `{ email, name }`
- Creates user if doesn't exist, sets session cookie
- Returns: `{ success: true, user: {...} }`

**GET /api/auth/me**
- Returns current user info if signed in
- Returns: `{ signedIn: true/false, user?: {...} }`

**POST /api/auth/signout**
- Destroys session
- Returns: `{ success: true }`

### Bucklist

All bucklist endpoints require authentication (session cookie).

**GET /api/bucklist**
- Returns user's bucklist
- Returns: `[{ id, user_id, trail_id, added_date }, ...]`

**POST /api/bucklist**
- Body: `{ trail_id }`
- Adds trail to user's bucklist
- Returns: `{ success: true, item: {...} }`
- Error 409 if trail already in bucklist

**DELETE /api/bucklist/:id**
- Removes item from bucklist by ID
- Returns: `{ success: true }`

**DELETE /api/bucklist/trail/:trail_id**
- Removes trail from bucklist by trail_id
- Returns: `{ success: true }`

**GET /api/bucklist/check/:trail_id**
- Check if trail is in user's bucklist
- Returns: `{ inBucklist: true/false, item: {...} or null }`

## Migration to Production

This SQLite setup is designed for easy migration to PostgreSQL/MongoDB when ready to deploy:

1. All queries use parameterized statements (SQL injection safe)
2. Database logic is abstracted in `database.js`
3. To migrate:
   - Replace `database.js` with PostgreSQL/MongoDB connection
   - Keep same query interface (`runQuery`, `getQuery`, `allQuery`)
   - Update connection string to use AWS RDS or similar
   - Sessions can move to redis or database store

## Notes

- Sessions use in-memory store (fine for development)
- For production: use connect-redis or similar for session persistence
- Database file is git-ignored
- Cookie is HTTP-only for security
