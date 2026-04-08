import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connection pool configuration for Docker
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'aipcore_pass',
  database: process.env.DB_NAME || 'aipcore_game',
  port: process.env.DB_PORT || 5432,
});

export const query = (text, params) => pool.query(text, params);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
