import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => res.send('API is healthy'));

// Fetch or create user data
app.get('/api/user/:tgId', async (req, res) => {
  const { tgId } = req.params;
  try {
    const result = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [tgId]
    );
    
    if (result.rows.length === 0) {
      // Create new user record
      const newUser = await query(
        'INSERT INTO users (telegram_id) VALUES ($1) RETURNING *',
        [tgId]
      );
      return res.json(newUser.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Sync game state
app.post('/api/sync', async (req, res) => {
  const { tgId, walletAddress, taps, localReward, energy, nodeTier } = req.body;
  
  try {
    const result = await query(
      `UPDATE users 
       SET wallet_address = $2, 
           taps = $3, 
           local_reward = $4, 
           energy = $5, 
           updated_at = CURRENT_TIMESTAMP
       WHERE telegram_id = $1
       RETURNING *`,
      [tgId, walletAddress, taps, localReward, energy]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AIPCore Backend running on port ${PORT}`);
});
