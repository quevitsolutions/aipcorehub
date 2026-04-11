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
    
    // Calculate pending mining rewards
    let pending_mined = 0;
    if (user.node_tier >= 1) {
      const now = new Date();
      const lastClaim = new Date(user.last_claim_time);
      const diffHours = (now - lastClaim) / (1000 * 60 * 60);
      const cappedHours = Math.min(diffHours, 24); // 24h cap
      
      const baseRate = user.node_tier >= 2 ? 200 : 100;
      const multiplier = user.is_premium ? 2.0 : 1.0;
      pending_mined = cappedHours * baseRate * multiplier;
    }

    res.json({
      ...user,
      direct_refs: parseInt(user.direct_refs || 0),
      team_size: parseInt(user.team_size || 0),
      pending_mined: parseFloat(pending_mined.toFixed(4))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST Claim Mining Rewards
app.post('/api/mining/claim', async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'Wallet required' });

  try {
    const userResult = await query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = userResult.rows[0];
    if (user.node_tier < 1) return res.status(400).json({ error: 'No active node' });

    const now = new Date();
    const lastClaim = new Date(user.last_claim_time);
    const diffHours = (now - lastClaim) / (1000 * 60 * 60);
    const cappedHours = Math.min(diffHours, 24);
    
    const baseRate = user.node_tier >= 2 ? 200 : 100;
    const multiplier = user.is_premium ? 2.0 : 1.0;
    const reward = cappedHours * baseRate * multiplier;

    const update = await query(
      `UPDATE users 
       SET local_reward = local_reward + $2, 
           last_claim_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE wallet_address = $1
       RETURNING *`,
      [walletAddress, reward]
    );

    res.json({ success: true, reward, user: update.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Claim failed' });
  }
});

// POST Upgrade Mining Tier (Simulated for Tier 2)
app.post('/api/mining/upgrade', async (req, res) => {
  const { walletAddress, tier, isPremium } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'Wallet required' });

  try {
    const update = await query(
      `UPDATE users 
       SET node_tier = COALESCE($2, node_tier),
           is_premium = COALESCE($3, is_premium),
           updated_at = CURRENT_TIMESTAMP
       WHERE wallet_address = $1
       RETURNING *`,
      [walletAddress, tier, isPremium]
    );
    res.json(update.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

// ========================
// TASKS SYSTEM ENDPOINTS
// ========================

// GET Active Tasks for User
app.get('/api/tasks/:walletAddress', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, 
             CASE WHEN ut.id IS NOT NULL THEN true ELSE false END as is_completed
      FROM tasks t
      LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.wallet_address = $1
      WHERE t.is_active = true
      ORDER BY t.created_at ASC
    `, [req.params.walletAddress]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST Claim Task
app.post('/api/tasks/claim', async (req, res) => {
  const { walletAddress, taskId } = req.body;
  if (!walletAddress || !taskId) return res.status(400).json({ error: 'Missing parameters' });

  try {
    // 1. Verify Task Exists
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1 AND is_active = true', [taskId]);
    if (taskResult.rows.length === 0) return res.status(404).json({ error: 'Task not found or inactive' });
    const task = taskResult.rows[0];

    // 2. Prevent Duplicate Claim
    const claimCheck = await query('SELECT id FROM user_tasks WHERE wallet_address = $1 AND task_id = $2', [walletAddress, taskId]);
    if (claimCheck.rows.length > 0) return res.status(400).json({ error: 'Task already claimed' });

    // 3. User & Business Logic Checks
    const userResult = await query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User mapping not found' });
    const user = userResult.rows[0];

    if (task.type === 'node' && user.node_tier < 1) {
      return res.status(400).json({ error: 'You do not have an active node.' });
    }
    if (task.type === 'referral') {
      const refs = await query('SELECT COUNT(*) FROM users WHERE referrer_id = $1', [user.id]);
      const directCount = parseInt(refs.rows[0].count);
      if (task.name.includes('1') && directCount < 1) return res.status(400).json({ error: 'Requires 1 referral' });
      if (task.name.includes('3') && directCount < 3) return res.status(400).json({ error: 'Requires 3 referrals' });
    }

    // 4. Atomic Transaction: Record Claim & Pay Reward
    await query('BEGIN');
    await query('INSERT INTO user_tasks (wallet_address, task_id) VALUES ($1, $2)', [walletAddress, taskId]);
    const updateResult = await query(
      'UPDATE users SET local_reward = local_reward + $2 WHERE wallet_address = $1 RETURNING local_reward',
      [walletAddress, task.reward]
    );
    await query('COMMIT');

    res.json({ success: true, reward: task.reward, new_balance: updateResult.rows[0].local_reward });
  } catch (err) {
    await query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Task claim failed' });
  }
});

// Admin Middleware (Security)
const checkAdmin = (req, res, next) => {
  const adminWallet = process.env.VITE_ADMIN_WALLET;
  const userWallet = req.headers['x-admin-wallet'];
  
  if (!adminWallet || !userWallet || adminWallet.toLowerCase() !== userWallet.toLowerCase()) {
    return res.status(403).json({ error: 'Admin access denied' });
  }
  next();
};

// POST Create Task (Admin)
app.post('/api/admin/tasks', checkAdmin, async (req, res) => {
  const { name, reward, icon, url, type } = req.body;
  if (!name || !reward) return res.status(400).json({ error: 'Name and reward required' });

  try {
    const task = await query(
      'INSERT INTO tasks (name, reward, icon, url, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, reward, icon || '💎', url || null, type || 'social']
    );
    res.json(task.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// DELETE Task (Admin)
app.delete('/api/admin/tasks/:id', checkAdmin, async (req, res) => {
  try {
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST DB Migration Patch (Admin Trigger - One Time)
app.post('/api/admin/init-tasks-db', checkAdmin, async (req, res) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          reward NUMERIC(36, 18) DEFAULT 0,
          icon VARCHAR(50) DEFAULT '💎',
          url VARCHAR(500),
          type VARCHAR(50) DEFAULT 'social',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS user_tasks (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(wallet_address, task_id)
      )
    `);
    // Pre-seed default tasks if completely empty to keep things smooth
    const count = await query('SELECT COUNT(*) FROM tasks');
    if (parseInt(count.rows[0].count) === 0) {
      await query(`
        INSERT INTO tasks (name, reward, icon, url, type) VALUES
        ('Join AIPCore Telegram', 200000, '✈️', 'https://t.me/AIPCoreOfficial', 'social'),
        ('Join AIPCore Chat', 150000, '💬', 'https://t.me/AIPCoreChat', 'social'),
        ('Follow on X/Twitter', 100000, '𝕏', 'https://x.com/AIPCore', 'social'),
        ('Activate Node', 1000000, '⬡', null, 'node')
      `);
    }
    
    res.json({ success: true, message: 'Tasks database tables verified and initialized.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB init failed' });
  }
});

// GET Admin Overview Stats
app.get('/api/admin/overview', checkAdmin, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT SUM(local_reward) FROM users) as total_reward,
        (SELECT COUNT(*) FROM users WHERE node_tier >= 1) as active_miners,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h
      FROM users LIMIT 1
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// POST Create Balance Snapshot
app.post('/api/admin/snapshot', checkAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Snapshot name required' });

  try {
    // 1. Fetch all users with rewards
    const users = await query('SELECT wallet_address, local_reward FROM users WHERE local_reward > 0');
    const total_coins = users.rows.reduce((sum, u) => sum + parseFloat(u.local_reward), 0);
    
    // 2. Save master snapshot
    const snapshot = await query(
      `INSERT INTO snapshots (name, total_users, total_coins, data) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, users.rows.length, total_coins, JSON.stringify(users.rows)]
    );
    const snapshot_id = snapshot.rows[0].id;

    // 3. Populate user_conversions lookup table for fast user history
    if (users.rows.length > 0) {
      // Construction of batch insert for performance
      const batchSize = 500;
      for (let i = 0; i < users.rows.length; i += batchSize) {
        const chunk = users.rows.slice(i, i + batchSize);
        const vals = [];
        const params = [];
        chunk.forEach((u, idx) => {
          params.push(snapshot_id, u.wallet_address, u.local_reward);
          const p = idx * 3;
          vals.push(`($${p+1}, $${p+2}, $${p+3})`);
        });
        await query(
          `INSERT INTO user_conversions (snapshot_id, wallet_address, mined_amount) VALUES ${vals.join(',')}`,
          params
        );
      }
    }
    
    res.json(snapshot.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Snapshot failed' });
  }
});

// GET Snapshot History
app.get('/api/admin/snapshots', checkAdmin, async (req, res) => {
  try {
    const list = await query('SELECT id, name, total_users, total_coins, created_at FROM snapshots ORDER BY created_at DESC');
    res.json(list.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

// GET Single Snapshot Data (for export)
app.get('/api/admin/snapshot/:id', checkAdmin, async (req, res) => {
  try {
    const data = await query('SELECT * FROM snapshots WHERE id = $1', [req.params.id]);
    if (data.rows.length === 0) return res.status(404).json({ error: 'Snapshot not found' });
    res.json(data.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch snapshot data' });
  }
});

// GET User Conversion History
app.get('/api/user/conversions/:walletAddress', async (req, res) => {
  try {
    const history = await query(`
      SELECT uc.mined_amount, s.name, s.created_at 
      FROM user_conversions uc
      JOIN snapshots s ON uc.snapshot_id = s.id
      WHERE uc.wallet_address = $1
      ORDER BY s.created_at DESC
    `, [req.params.walletAddress]);
    res.json(history.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversion history' });
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

// Sync game state via wallet address (taps, energy & node tier sync)
app.post('/api/sync', async (req, res) => {
  const { walletAddress, taps, energy, nodeTier } = req.body;
  
  if (!walletAddress) return res.status(400).json({ error: 'Wallet address required' });

  try {
    const result = await query(
      `UPDATE users 
       SET taps = COALESCE($2, taps), 
           energy = COALESCE($3, energy), 
           node_tier = GREATEST(COALESCE($4, node_tier), node_tier),
           updated_at = CURRENT_TIMESTAMP
       WHERE wallet_address = $1
       RETURNING *`,
      [walletAddress, taps, energy, nodeTier]
    );
    
    if (result.rows.length === 0) {
      // If user doesn't exist yet, create them during sync
      const newUser = await query(
        'INSERT INTO users (wallet_address, taps, energy, node_tier) VALUES ($1, $2, $3, COALESCE($4, 0)) RETURNING *',
        [walletAddress, taps, energy, nodeTier]
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
