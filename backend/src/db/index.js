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
  `);
  console.log('✅ Database initialized');
};

module.exports = { pool, initDB };
