const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      avatar_color VARCHAR(7) DEFAULT '#6366f1',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(10) DEFAULT '⚡',
      color VARCHAR(7) DEFAULT '#6366f1',
      streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      total_completions INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id SERIAL PRIMARY KEY,
      habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      completed_date DATE NOT NULL,
      xp_earned INTEGER DEFAULT 10,
      UNIQUE(habit_id, completed_date)
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(requester_id, addressee_id)
    );

    CREATE TABLE IF NOT EXISTS user_inventory (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      item_id VARCHAR(60) NOT NULL,
      acquired_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS user_equipped (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      weapon VARCHAR(60),
      armor VARCHAR(60),
      banner VARCHAR(60),
      badge VARCHAR(60),
      companion VARCHAR(60),
      title VARCHAR(60)
    );

    ALTER TABLE user_equipped ADD COLUMN IF NOT EXISTS companion VARCHAR(60);
    ALTER TABLE user_equipped ADD COLUMN IF NOT EXISTS title VARCHAR(60);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_shield BOOLEAN DEFAULT false;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 0;
    ALTER TABLE habits ADD COLUMN IF NOT EXISTS gold_reward INTEGER DEFAULT 10;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_skin    VARCHAR(7)  DEFAULT '#e8b88a';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_hair    VARCHAR(7)  DEFAULT '#8B4513';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_eyes    VARCHAR(7)  DEFAULT '#2a4a8a';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_hair_style INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_gender  INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_beard   INTEGER DEFAULT 0;

    CREATE TABLE IF NOT EXISTS gifts (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      item_id VARCHAR(60) NOT NULL,
      message VARCHAR(200),
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      username VARCHAR(50),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      votes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS suggestion_votes (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      suggestion_id INTEGER REFERENCES suggestions(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, suggestion_id)
    );

    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      proposer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      offer_item_id VARCHAR(60) NOT NULL,
      request_item_id VARCHAR(60) NOT NULL,
      message VARCHAR(200),
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_xp       TEXT DEFAULT 'friends';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_streaks  TEXT DEFAULT 'friends';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_habits   TEXT DEFAULT 'friends';

    ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_enabled    BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_time       VARCHAR(5) DEFAULT '20:00';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS theme            TEXT DEFAULT 'default';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS update_seen      BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS debrief_seen     BOOLEAN DEFAULT false;

    -- Lifetime gold earned (separate from the spendable gold balance)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_gold    BIGINT DEFAULT 0;

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      code VARCHAR(60) NOT NULL,
      earned_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, code)
    );

    -- Admin & moderation
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin           BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_type    VARCHAR(10);   -- null | 'warn' | 'temp' | 'perm'
    ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason  TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until    TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at       TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by       INTEGER;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS warning_seen       BOOLEAN DEFAULT false;

    -- Suggestion admin status: open | planned | done | rejected
    ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';

    -- Dungeon: per-user 4-slot attack loadout
    CREATE TABLE IF NOT EXISTS user_attacks (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      slot1 VARCHAR(40),
      slot2 VARCHAR(40),
      slot3 VARCHAR(40),
      slot4 VARCHAR(40)
    );

    -- Dungeon: how many bosses the player has cleared (ascension level).
    -- Surfaced on /auth/me and used to gate harder difficulties.
    ALTER TABLE users ADD COLUMN IF NOT EXISTS dungeon_ascension INTEGER DEFAULT 0;

    -- PvP duels — async, friends-only, XP-only rewards.
    CREATE TABLE IF NOT EXISTS duels (
      id SERIAL PRIMARY KEY,
      challenger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      opponent_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
      winner_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      challenger_xp INTEGER DEFAULT 0,
      opponent_xp   INTEGER DEFAULT 0,
      log           JSONB,
      created_at    TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_duels_opponent   ON duels(opponent_id, created_at DESC);
  `);
  // Grant infinite gold + admin flag to theDevs account (if it exists)
  await pool.query(`
    UPDATE users SET gold = 2147483647, is_admin = true WHERE LOWER(username) = 'thedevs'
  `);
  console.log('✅ Database initialized');
};

module.exports = { pool, initDB };
