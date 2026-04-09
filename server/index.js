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

// Fetch or create user data via wallet address
app.get('/api/user/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  try {
    // 1. Fetch user & calculate direct referral count in one query
    const result = await query(
      `SELECT u.*, 
       (SELECT COUNT(*) FROM users WHERE referrer_id = CAST(u.id AS BIGINT)) as direct_refs
       FROM users u 
       WHERE u.wallet_address = $1`,
      [walletAddress]
    );
    
    if (result.rows.length === 0) {
      // Create new user record indexed by wallet
      const newUser = await query(
        'INSERT INTO users (wallet_address) VALUES ($1) RETURNING *',
        [walletAddress]
      );
      return res.json({ ...newUser.rows[0], direct_refs: 0, team_size: 0 });
    }
    
    const user = result.rows[0];
    res.json({
      ...user,
      direct_refs: parseInt(user.direct_refs || 0),
      team_size: parseInt(user.direct_refs || 0) // Placeholder logic for now
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Sync game state via wallet address
app.post('/api/sync', async (req, res) => {
  const { walletAddress, taps, localReward, energy } = req.body;
  
  if (!walletAddress) return res.status(400).json({ error: 'Wallet address required' });

  try {
    const result = await query(
      `UPDATE users 
       SET taps = $2, 
           local_reward = $3, 
           energy = $4, 
           updated_at = CURRENT_TIMESTAMP
       WHERE wallet_address = $1
       RETURNING *`,
      [walletAddress, taps, localReward, energy]
    );
    
    if (result.rows.length === 0) {
      // If user doesn't exist yet, create them during sync
      const newUser = await query(
        'INSERT INTO users (wallet_address, taps, local_reward, energy) VALUES ($1, $2, $3, $4) RETURNING *',
        [walletAddress, taps, localReward, energy]
      );
      return res.json(newUser.rows[0]);
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
