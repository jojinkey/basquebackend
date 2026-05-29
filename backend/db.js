import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// MUST be set before Pool is created — forces IPv4 on Windows/Supabase
pg.defaults.family = 4;

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('pg pool error:', err.message);
});

export const query = (text, params) => pool.query(text, params);
export default pool;