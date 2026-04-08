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

// Robust connection test with retries
const connectWithRetry = async (retries = 5) => {
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ Database connected successfully');
      return;
    } catch (err) {
      console.log(`❌ Database connection failed. Retries left: ${retries-1}`);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  console.error('Final database connection failure');
  process.exit(-1);
};

connectWithRetry();

export const query = (text, params) => pool.query(text, params);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
