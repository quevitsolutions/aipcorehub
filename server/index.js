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
    // 1. Fetch user & calculate stats
    const userResult = await query(
      `SELECT u.*, 
       (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_refs,
       -- Recursive CTE for team size (18 levels deep)
       (
         WITH RECURSIVE team AS (
           SELECT id, referrer_id, 1 as depth
           FROM users
           WHERE referrer_id = u.id
           UNION ALL
           SELECT child.id, child.referrer_id, parent.depth + 1
           FROM users child
           INNER JOIN team parent ON child.referrer_id = parent.id
           WHERE parent.depth < 18
         )
         SELECT COUNT(*) FROM team
       ) as team_size
       FROM users u 
       WHERE u.wallet_address = $1`,
      [walletAddress]
    );
    
    if (userResult.rows.length === 0) {
      // Create new user record
      const newUser = await query(
        'INSERT INTO users (wallet_address) VALUES ($1) RETURNING *',
        [walletAddress]
      );
      return res.json({ ...newUser.rows[0], direct_refs: 0, team_size: 0 });
    }
    
    const user = userResult.rows[0];
    res.json({
      ...user,
      direct_refs: parseInt(user.direct_refs || 0),
      team_size: parseInt(user.team_size || 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET Global Leaderboard (Top Earners)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await query(
      `SELECT wallet_address, local_reward, taps, id
       FROM users 
       ORDER BY local_reward DESC, taps DESC 
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET Referral List (My Team)
app.get('/api/referrals/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  try {
    const parent = await query('SELECT id FROM users WHERE wallet_address = $1', [walletAddress]);
    if (parent.rows.length === 0) return res.json([]);

    const result = await query(
      `SELECT wallet_address, local_reward, created_at
       FROM users 
       WHERE referrer_id = $1
       ORDER BY created_at DESC`,
      [parent.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch referrals' });
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
