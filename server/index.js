import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import axios from 'axios';
import { query } from './db.js';

dotenv.config();

// AIPCore & RewardPool Contract Constants
const AIPCORE_ADDRESS = '0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f';
const REWARDPOOL_ADDRESS = '0x319429aD1A00cbCD6aed1fFA1106eEC056316465';
const BSC_RPC = process.env.VITE_RPC_URL || 'https://bsc-dataseed.binance.org/';
const DEPLOY_BLOCK = 43232822; // Block around contract deployment for optimization

const AIPCORE_ABI = [
  "event RewardDistributed(address indexed wallet, uint256 indexed nodeId, uint256 fromId, uint256 layer, uint256 amount, uint256 time, bool isMissed, uint256 rewardType, uint256 tier)",
  "event NodeCreated(address indexed node, uint256 indexed userId, uint256 indexed referrerId, uint256 uplineId)",
  "event TierUnlocked(address indexed node, uint256 indexed userId, uint256 packageId)",
  "function getTeamSize(uint256 _userId, uint256 _depth) view returns (uint256)",
  "function getNodeStats(uint256 _userId) view returns (uint256 tier, uint256 directCount, uint256 matrixCount, uint256 totalRewards, uint256 totalContribution, uint256 daysActive)",
  "function nodes(uint256 _nodeId) view returns (uint64 nodeId, address wallet, uint64 sponsor, uint64 matrixParent, uint40 joinedAt, uint8 tier, uint256 totalContribution, uint256 totalEarned, uint32 directNodes)"
];

const REWARDPOOL_ABI = [
  "event RewardClaimed(uint nodeId, address wallet, uint amount)"
];

const MULTICALL_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)"
];
const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

const provider = new ethers.JsonRpcProvider(BSC_RPC);
const aipcoreContract = new ethers.Contract(AIPCORE_ADDRESS, AIPCORE_ABI, provider);
const rewardPoolContract = new ethers.Contract(REWARDPOOL_ADDRESS, REWARDPOOL_ABI, provider);
const multicallContract = new ethers.Contract(MULTICALL_ADDRESS, MULTICALL_ABI, provider);

// State for BNB Price Cache
let bnbPrice = 600; // Default fallback
let lastPriceFetch = 0;

const getBnbPrice = async () => {
  const now = Date.now();
  if (now - lastPriceFetch < 300000 && bnbPrice > 0) return bnbPrice; // 5 min cache
  try {
    const res = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSD');
    bnbPrice = parseFloat(res.data.price);
    lastPriceFetch = now;
  } catch (err) {
    console.error('Failed to fetch BNB price:', err.message);
    try {
      const res2 = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
      bnbPrice = res2.data.binancecoin.usd;
      lastPriceFetch = now;
    } catch (e2) {
      console.warn('All price sources failed, using fallback.');
    }
  }
  return bnbPrice;
};

/**
 * Migration: Ensure schema is up to date
 */
const ensureSchema = async () => {
  try {
    console.log('Checking database schema...');
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMP`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_synced_block INTEGER DEFAULT ${DEPLOY_BLOCK}`);
    await query(`ALTER TABLE income_history ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 0`);
    await query(`ALTER TABLE income_history ADD COLUMN IF NOT EXISTS layer INTEGER DEFAULT 0`);
    await query(`ALTER TABLE income_history ADD COLUMN IF NOT EXISTS is_missed BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS claimed_milestones TEXT DEFAULT '[]'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS node_id INTEGER UNIQUE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS sponsor_node_id INTEGER`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS matrix_parent_node_id INTEGER`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS matrix_parent_id INTEGER`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS node_active BOOLEAN DEFAULT TRUE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS matrix_counts JSONB DEFAULT '[]'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_rpc_sync TIMESTAMP`);
    
    // Seed Genesis Node (ID 36999)
    const genesisId = 36999;
    const adminWallet = process.env.VITE_ADMIN_WALLET ? process.env.VITE_ADMIN_WALLET.toLowerCase() : null;
    if (adminWallet) {
      await query(`
        INSERT INTO users (wallet_address, node_id, node_tier, node_active, created_at)
        VALUES ($1, $2, 1, TRUE, '2024-01-01 00:00:00')
        ON CONFLICT (node_id) DO UPDATE SET wallet_address = $1, node_active = TRUE
      `, [adminWallet, genesisId]);
    }
    
    // Performance Indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_income_history_wallet_address ON income_history(wallet_address)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_node_active ON users(node_active) WHERE node_active = TRUE`);
    
    // Hardening: Enforce case-insensitive wallet uniqueness
    // We do this AFTER a reconciliation step in case duplicates already exist
    await reconcileDuplicateUsers();
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_lower ON users (LOWER(wallet_address))`);
    
    // NEW: Audit log for admin adjustments
    await query(`
      CREATE TABLE IF NOT EXISTS admin_adjustments (
        id SERIAL PRIMARY KEY,
        admin_wallet VARCHAR(42) NOT NULL,
        target_wallet VARCHAR(42) NOT NULL,
        amount NUMERIC(36, 18) NOT NULL,
        reason VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Viral Referral Tasks
    const referralTasks = [
      { name: 'Refer 1 Peer', reward: 240, type: 'referral_count', icon: '🤝' },
      { name: 'Squad Builder (3 Peers)', reward: 750, type: 'referral_count', icon: '👪' },
      { name: 'Team Leader (10 Peers)', reward: 3000, type: 'referral_count', icon: '📣' },
      { name: 'Community Pilot (50 Peers)', reward: 15000, type: 'referral_count', icon: '🚀' },
      { name: 'Network Master (100 Peers)', reward: 50000, type: 'referral_count', icon: '🌐' },
      { name: 'Global Ambassador (500 Peers)', reward: 300000, type: 'referral_count', icon: '🏛️' },
      { name: 'Legendary Operator (1000 Peers)', reward: 1000000, type: 'referral_count', icon: '👑' }
    ];

    for (const t of referralTasks) {
      await query(`
        INSERT INTO tasks (name, reward, type, icon)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE name = $1)
      `, [t.name, t.reward, t.type, t.icon]);
    }
    console.log('✅ Schema check complete');
  } catch (err) {
    console.error('Schema update error:', err.message);
  }
};

/**
 * High-Precision Recon: Merges duplicate profiles caused by case sensitivity
 */
async function reconcileDuplicateUsers() {
  try {
    const duplicates = await query(`
      SELECT LOWER(wallet_address) as wallet, COUNT(*), MIN(id) as keep_id, array_agg(id) as all_ids
      FROM users 
      GROUP BY LOWER(wallet_address) 
      HAVING COUNT(*) > 1
    `);

    for (const row of duplicates.rows) {
      const keepId = row.keep_id;
      const dropIds = row.all_ids.filter(id => id !== keepId);
      
      console.log(`🧹 Recon: Merging duplicate wallet ${row.wallet} (${dropIds.length} profiles -> ID ${keepId})`);
      
      // 1. If any of the drop nodes have a node_id, try to move it to the keep node if the keep node doesn't have one
      const nodeInfo = await query(`SELECT node_id FROM users WHERE id = ANY($1) AND node_id IS NOT NULL`, [dropIds]);
      if (nodeInfo.rows.length > 0) {
        await query(`UPDATE users SET node_id = $1 WHERE id = $2 AND node_id IS NULL`, [nodeInfo.rows[0].node_id, keepId]);
      }

      // 2. Move referral links
      await query(`UPDATE users SET referrer_id = $1 WHERE referrer_id = ANY($2)`, [keepId, dropIds]);
      
      // 3. Move matrix links
      await query(`UPDATE users SET matrix_parent_id = $1 WHERE matrix_parent_id = ANY($2)`, [keepId, dropIds]);

      // 4. Delete duplicates
      await query(`DELETE FROM users WHERE id = ANY($1)`, [dropIds]);
    }
    
    if (duplicates.rows.length > 0) {
      console.log(`✨ Recon: Successfully merged ${duplicates.rows.length} duplicate wallets`);
    }
  } catch (err) {
    console.warn("Reconstruction failed:", err.message);
  }
}

ensureSchema();

/**
 * Startup RPC Sync: Called once on boot to populate matrix_counts for all existing nodes.
 * This ensures the team page shows correct data immediately without waiting for new events.
 */
async function startupNodeSync() {
  try {
    // Wait for schema to finish
    await new Promise(r => setTimeout(r, 3000));
    console.log('🚀 Starting RPC node sync for all existing nodes...');

    const nodes = await query('SELECT node_id FROM users WHERE node_id IS NOT NULL ORDER BY node_id ASC');
    console.log(`📊 Found ${nodes.rows.length} nodes to sync`);

    // Stagger requests to avoid RPC rate limits (1 per 500ms)
    for (const row of nodes.rows) {
      await syncNodeStateFromRPC(Number(row.node_id));
      await new Promise(r => setTimeout(r, 500)); 
    }

    console.log('✅ Startup node sync complete!');
  } catch (err) {
    console.error('Startup node sync error:', err.message);
  }
}

// Run startup sync after server is ready (non-blocking)
setTimeout(startupNodeSync, 5000);

/**
 * Background worker to sync on-chain events for a user
 */
const syncUserHistory = async (wallet) => {
  if (!wallet) return;
  try {
    const currentPrice = await getBnbPrice();
    const user = await query('SELECT last_synced_block FROM users WHERE wallet_address = $1', [wallet]);
    const startBlock = (user.rows.length > 0 && user.rows[0].last_synced_block) 
      ? Math.max(DEPLOY_BLOCK, user.rows[0].last_synced_block + 1)
      : DEPLOY_BLOCK;
    
    const latestBlock = await provider.getBlockNumber();
    if (startBlock > latestBlock) return;

    console.log(`Syncing income history for ${wallet} from block ${startBlock} to ${latestBlock}...`);

    // 1. Fetch AIPCore RewardDistributed Events
    const filterAIP = aipcoreContract.filters.RewardDistributed(wallet);
    const logsAIP = await aipcoreContract.queryFilter(filterAIP, startBlock, latestBlock);

    for (const log of logsAIP) {
      const { fromId, amount, time, rewardType, tier, layer, isMissed } = log.args;
      const bnbAmount = ethers.formatEther(amount);
      const usdAmount = parseFloat(bnbAmount) * currentPrice;
      const txHash = log.transactionHash;
      const timestamp = new Date(Number(time) * 1000);

      // Mapping Logic as per Contract:
      // rewardType 1 && tier 0 -> Referral
      // rewardType 1 && tier > 0 -> Direct Upgrade
      // rewardType 2 -> Layer Income
      // rewardType 3 -> Matrix Income
      let eventName = 'Team Reward';
      const rType = Number(rewardType);
      const tierVal = Number(tier);

      if (rType === 1) {
        eventName = tierVal === 0 ? 'Referral' : 'Direct Upgrade';
      } else if (rType === 2) {
        eventName = 'Layer Income';
      } else if (rType === 3) {
        eventName = 'Matrix Income';
      }

      await query(
        `INSERT INTO income_history (wallet_address, source_contract, event_type, from_node_id, amount_bnb, amount_usd, tier, layer, is_missed, tx_hash, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (tx_hash) DO NOTHING`,
        [wallet, AIPCORE_ADDRESS, eventName, Number(fromId), bnbAmount, usdAmount, tierVal, Number(layer), !!isMissed, txHash, timestamp]
      );
    }

    // 2. Fetch RewardPool RewardClaimed Events
    const filterPool = rewardPoolContract.filters.RewardClaimed(null, wallet);
    const logsPool = await rewardPoolContract.queryFilter(filterPool, startBlock, latestBlock);

    for (const log of logsPool) {
      const { nodeId, amount } = log.args;
      const bnbAmount = ethers.formatEther(amount);
      const usdAmount = parseFloat(bnbAmount) * currentPrice;
      const txHash = log.transactionHash;
      
      const block = await provider.getBlock(log.blockNumber);
      const timestamp = new Date(block.timestamp * 1000);

      await query(
        `INSERT INTO income_history (wallet_address, source_contract, event_type, from_node_id, amount_bnb, amount_usd, tier, layer, is_missed, tx_hash, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (tx_hash) DO NOTHING`,
        [wallet, REWARDPOOL_ADDRESS, 'Global Pool', Number(nodeId), bnbAmount, usdAmount, 0, 0, false, txHash, timestamp]
      );
    }

    // 3. Fetch NodeCreated Events to build tree
    const filterNodes = aipcoreContract.filters.NodeCreated();
    const logsNodes = await aipcoreContract.queryFilter(filterNodes, startBlock, latestBlock);
    for (const log of logsNodes) {
      const { node, userId, referrerId } = log.args;
      const joinedAt = new Date((await provider.getBlock(log.blockNumber)).timestamp * 1000);
      
      // Upsert the node. We map referrerId AND matrixParentId from contract
      try {
        const nodeIdNum = Number(userId);
        const referrerIdNum = Number(referrerId);
        
        await query(
          `INSERT INTO users (wallet_address, node_id, sponsor_node_id, matrix_parent_node_id, node_active, created_at)
           VALUES ($1, $2, $3, $4, TRUE, $5)
           ON CONFLICT (node_id) DO UPDATE 
           SET wallet_address = EXCLUDED.wallet_address,
               sponsor_node_id = EXCLUDED.sponsor_node_id,
               matrix_parent_node_id = EXCLUDED.matrix_parent_node_id,
               node_active = TRUE`,
          [node.toLowerCase(), nodeIdNum, referrerIdNum, Number(log.args[3] || 0), joinedAt]
        );

        // TRIGGER RPC SYNC: Full accuracy refresh for both user and sponsor
        await syncNodeStateFromRPC(nodeIdNum);
        if (referrerIdNum > 0) syncNodeStateFromRPC(referrerIdNum);

      } catch (e) { console.error("Node Sync Err:", e.message); }
    }

    // 4. Fast SQL-Native Repair (Rebuilds tree instantly from DB data)
    await repairTreeLinks();

    // 5. Fetch TierUnlocked Events
    const filterTiers = aipcoreContract.filters.TierUnlocked();
    const logsTiers = await aipcoreContract.queryFilter(filterTiers, startBlock, latestBlock);
    for (const log of logsTiers) {
      const { userId, tierId } = log.args;
      const tid = Number(userId);
      await query('UPDATE users SET node_tier = $1 WHERE node_id = $2', [Number(tierId), tid]);
      // TRIGGER RPC SYNC: Refresh node data on tier upgrade
      await syncNodeStateFromRPC(tid);
    }

    // Update last synced block
    await query('UPDATE users SET last_synced_block = $1 WHERE wallet_address = $2', [latestBlock, wallet]);

  } catch (err) {
    console.error(`Sync error for ${wallet}:`, err.message);
  }
};

// Global Sync Worker: Polls latest 1000 blocks periodically for missed global events
let lastSyncBlock = DEPLOY_BLOCK;
const syncGlobalHistory = async () => {
  try {
    const currentBlock = await provider.getBlockNumber();
    if (currentBlock <= lastSyncBlock) return;
    
    // limit max blocks to 3000 to avoid rpc timeout
    const fromBlock = Math.max(lastSyncBlock, currentBlock - 3000);
    const filterAIP = aipcoreContract.filters.RewardDistributed();
    const logsAIP = await aipcoreContract.queryFilter(filterAIP, fromBlock, currentBlock);
    
    if (logsAIP.length > 0) {
      const currentPrice = await getBnbPrice();
      for (const log of logsAIP) {
        const { wallet, fromId, amount, time, rewardType, tier, layer, isMissed } = log.args;
        const bnbAmount = ethers.formatEther(amount);
        const usdAmount = parseFloat(bnbAmount) * currentPrice;
        const txHash = log.transactionHash;
        const timestamp = new Date(Number(time) * 1000);
        
        let eventName = 'Team Reward';
        const rType = Number(rewardType);
        const tierVal = Number(tier);
        if (rType === 1) eventName = tierVal === 0 ? 'Referral' : 'Direct Upgrade';
        else if (rType === 2) eventName = 'Layer Income';
        else if (rType === 3) eventName = 'Matrix Income';
        
        await query(
          `INSERT INTO income_history (wallet_address, source_contract, event_type, from_node_id, amount_bnb, amount_usd, tier, layer, is_missed, tx_hash, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (tx_hash) DO NOTHING`,
          [wallet, AIPCORE_ADDRESS, eventName, Number(fromId), bnbAmount, usdAmount, tierVal, Number(layer), !!isMissed, txHash, timestamp]
        );
      }
    }
    lastSyncBlock = currentBlock;
  } catch(err) {
    console.error('Global sync error:', err.message);
  }
};

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
        (SELECT COUNT(*) FROM users WHERE referrer_id = u.id AND node_tier > 0) as activated_refs,
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
       WHERE LOWER(u.wallet_address) = LOWER($1)`,
      [walletAddress]
    );
    
    if (userResult.rows.length === 0) {
      // Resolve referrer ID if provided
      let refId = null;
      let sponsorWallet = null;
      if (req.query.ref && /^0x[a-fA-F0-9]{40}$/i.test(req.query.ref)) {
        const refObj = await query('SELECT id, wallet_address FROM users WHERE wallet_address ILIKE $1', [req.query.ref]);
        if (refObj.rows.length > 0) {
          refId = refObj.rows[0].id;
          sponsorWallet = refObj.rows[0].wallet_address;
        }
      }

      // Create new user record (sponsor locked at creation)
      const newUser = await query(
        'INSERT INTO users (wallet_address, referrer_id) VALUES ($1, $2) RETURNING *',
        [walletAddress, refId]
      );
      return res.json({ ...newUser.rows[0], direct_refs: 0, team_size: 0, is_new: true, sponsor_wallet: sponsorWallet });
    }
    
    const user = userResult.rows[0];

    // If existing user has NO sponsor yet and a ref is provided — set it now (one-time, never overwrite)
    if (!user.referrer_id && req.query.ref && /^0x[a-fA-F0-9]{40}$/i.test(req.query.ref)) {
      // Don't allow self-referral
      if (req.query.ref.toLowerCase() !== walletAddress.toLowerCase()) {
        const refObj = await query('SELECT id, wallet_address FROM users WHERE LOWER(wallet_address) = LOWER($1)', [req.query.ref]);
        if (refObj.rows.length > 0) {
          // Perform the update and ensure we don't overwrite if it was set in a parallel request
          const updateRes = await query(`
            UPDATE users 
            SET referrer_id = $1 
            WHERE LOWER(wallet_address) = LOWER($2) 
            AND referrer_id IS NULL 
            RETURNING referrer_id
          `, [refObj.rows[0].id, walletAddress]);
          
          if (updateRes.rows.length > 0) {
            user.referrer_id = refObj.rows[0].id;
            user.sponsor_wallet = refObj.rows[0].wallet_address;
          }
        }
      }
    }

    // Fetch sponsor wallet for display
    let sponsorWallet = user.sponsor_wallet || null;
    if (!sponsorWallet && user.referrer_id) {
      const sponsorRow = await query('SELECT wallet_address FROM users WHERE id = $1', [user.referrer_id]);
      if (sponsorRow.rows.length > 0) sponsorWallet = sponsorRow.rows[0].wallet_address;
    }

    // Calculate pending mining rewards
    let pending_mined = 0;
    const now = new Date();
    const lastClaim = new Date(user.last_claim_time);
    const creationTime = new Date(user.created_at);
    const diffHours = (now - lastClaim) / (1000 * 60 * 60);
    const cappedHours = Math.min(diffHours, 24); // 24h cap

    const isFreePeriod = (now - creationTime) < (30 * 24 * 60 * 60 * 1000);
    const isFreeMember = user.node_tier === 0 && isFreePeriod;

    if (user.node_tier >= 1) {
      const baseRate = user.node_tier >= 2 ? 200 : 100;
      const multiplier = user.is_premium ? 2.0 : 1.0;
      pending_mined = cappedHours * baseRate * multiplier;
    } else if (isFreeMember) {
      pending_mined = cappedHours * 10; // Free member rate
    }

    res.json({
      ...user,
      direct_refs: parseInt(user.direct_refs || 0),
      team_size: parseInt(user.team_size || 0),
      pending_mined: parseFloat(pending_mined.toFixed(4)),
      sponsor_wallet: sponsorWallet,
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
    const userResult = await query('SELECT * FROM users WHERE LOWER(wallet_address) = LOWER($1) ORDER BY id ASC', [walletAddress]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = userResult.rows[0];
    const now = new Date();
    const creationTime = new Date(user.created_at);
    const isFreePeriod = (now - creationTime) < (30 * 24 * 60 * 60 * 1000);
    
    if (user.node_tier < 1 && !isFreePeriod) {
      return res.status(403).json({ error: 'Free trial expired. Activate Node to continue mining.' });
    }

    const lastClaim = new Date(user.last_claim_time);
    const diffHours = (now - lastClaim) / (1000 * 60 * 60);
    const cappedHours = Math.min(diffHours, 24);
    
    let reward = 0;
    if (user.node_tier >= 1) {
      const baseRate = user.node_tier >= 2 ? 200 : 100;
      const multiplier = user.is_premium ? 2.0 : 1.0;
      reward = cappedHours * baseRate * multiplier;
    } else {
      reward = cappedHours * 10;
    }

    const update = await query(
      `UPDATE users 
       SET local_reward = local_reward + $2, 
           last_claim_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE LOWER(wallet_address) = LOWER($1)
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
       WHERE LOWER(wallet_address) = LOWER($1)
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
    const userResult = await query('SELECT * FROM users WHERE LOWER(wallet_address) = LOWER($1) ORDER BY id ASC', [walletAddress]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User mapping not found' });
    const user = userResult.rows[0];

    if (task.type === 'node' && user.node_tier < 1) {
      return res.status(400).json({ error: 'You do not have an active node.' });
    }

    if (task.type === 'referral_count' || task.type === 'referral') {
      const refs = await query('SELECT COUNT(*) FROM users WHERE referrer_id = $1 AND node_tier > 0', [user.id]);
      const directCount = parseInt(refs.rows[0].count);
      
      // Extract target number from name (e.g., "Refer 3 Peers" -> 3)
      const targetMatch = task.name.match(/\d+/);
      const targetCount = targetMatch ? parseInt(targetMatch[0]) : 1;
      
      if (directCount < targetCount) {
        return res.status(400).json({ error: `Requires ${targetCount} referrals (You have ${directCount})` });
      }
    }

    // 4. Atomic Transaction: Record Claim & Pay Reward
    await query('BEGIN');
    await query('INSERT INTO user_tasks (wallet_address, task_id) VALUES ($1, $2)', [walletAddress, taskId]);
    const updateResult = await query(
      'UPDATE users SET local_reward = local_reward + $2 WHERE LOWER(wallet_address) = LOWER($1) RETURNING local_reward',
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

// POST Claim Milestone
app.post('/api/milestones/claim', async (req, res) => {
  const { walletAddress, milestoneThreshold } = req.body;
  if (!walletAddress || !milestoneThreshold) return res.status(400).json({ error: 'Threshold required' });

  const MILESTONES = {
    1: 500,
    3: 2000,
    5: 5000,
    10: 20000,
    20: 50000,
    50: 500000
  };

  const reward = MILESTONES[milestoneThreshold];
  if (!reward) return res.status(400).json({ error: 'Invalid milestone' });

  try {
    const user = await query('SELECT id, claimed_milestones FROM users WHERE wallet_address = $1', [walletAddress]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const claimed = JSON.parse(user.rows[0].claimed_milestones || '[]');
    if (claimed.includes(Number(milestoneThreshold))) return res.status(400).json({ error: 'Milestone already claimed' });

    const activatedRefs = await query('SELECT COUNT(*) FROM users WHERE referrer_id = $1 AND node_tier > 0', [user.rows[0].id]);
    const count = parseInt(activatedRefs.rows[0].count);

    if (count < milestoneThreshold) return res.status(400).json({ error: `You need ${milestoneThreshold} activated nodes to claim this` });

    claimed.push(Number(milestoneThreshold));
    await query('UPDATE users SET local_reward = local_reward + $1, claimed_milestones = $2 WHERE id = $3', 
      [reward, JSON.stringify(claimed), user.rows[0].id]);

    res.json({ success: true, reward, claimed_milestones: claimed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to claim milestone' });
  }
});

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

// GET User Income History
app.get('/api/user/income-history/:walletAddress', async (req, res) => {
  try {
    const history = await query(`
      SELECT event_type, amount_bnb, amount_usd, tier, from_node_id, is_missed, timestamp, tx_hash
      FROM income_history
      WHERE wallet_address = $1
      ORDER BY timestamp DESC
    `, [req.params.walletAddress]);
    res.json(history.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch income history' });
  }
});

// GET Global Income History (Live Feed)
app.get('/api/history/global', async (req, res) => {
  try {
    const history = await query(`
      SELECT wallet_address, event_type, amount_bnb, amount_usd, tier, from_node_id, is_missed, timestamp, tx_hash
      FROM income_history
      ORDER BY timestamp DESC
      LIMIT 100
    `);
    
    // Anonymize wallet address for public privacy viewing
    const publicHistory = history.rows.map(row => ({
      ...row,
      wallet_address: row.wallet_address ? row.wallet_address.substring(0, 6) + '...' + row.wallet_address.substring(38) : 'Unknown'
    }));

    res.json(publicHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch global history' });
  }
});

// GET User Details (Admin)
app.get('/api/admin/user/:walletAddress', checkAdmin, async (req, res) => {
  const { walletAddress } = req.params;
  try {
    const userResult = await query(
      `SELECT u.*, 
       (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_refs
       FROM users u 
       WHERE u.wallet_address = $1`,
      [walletAddress]
    );
    
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// POST Adjust User Reward (Admin)
app.post('/api/admin/user/adjust-reward', checkAdmin, async (req, res) => {
  const { walletAddress, amount, reason } = req.body;
  const adminWallet = req.headers['x-admin-wallet'];
  if (!walletAddress || amount === undefined) return res.status(400).json({ error: 'Wallet and amount required' });

  try {
    await query('BEGIN');
    
    const update = await query(
      `UPDATE users 
       SET local_reward = local_reward + $2, 
           updated_at = CURRENT_TIMESTAMP
       WHERE wallet_address = $1
       RETURNING *`,
      [walletAddress, amount]
    );
    
    if (update.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    // Record adjustment in audit log
    await query(
      'INSERT INTO admin_adjustments (admin_wallet, target_wallet, amount, reason) VALUES ($1, $2, $3, $4)',
      [adminWallet, walletAddress, amount, reason || 'Manual adjustment']
    );

    await query('COMMIT');
    res.json({ success: true, user: update.rows[0] });
  } catch (err) {
    await query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Adjustment failed' });
  }
});

// GET Admin Adjustment History
app.get('/api/admin/adjustments', checkAdmin, async (req, res) => {
  try {
    const logs = await query('SELECT * FROM admin_adjustments ORDER BY timestamp DESC LIMIT 50');
    res.json(logs.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch adjustments' });
  }
});

// GET Members at a specific network level with their team sizes
app.get('/api/network/level/:walletAddress/:level', async (req, res) => {
  const { walletAddress, level } = req.params;
  const targetDepth = parseInt(level); 
  
  try {
    const rootRes = await query('SELECT id FROM users WHERE LOWER(wallet_address) = LOWER($1) ORDER BY id ASC', [walletAddress]);
    if (rootRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const rootId = rootRes.rows[0].id;

    // Recursive CTE to find members at depth, and another sub-CTE for their team sizes
    const members = await query(`
      WITH RECURSIVE mt AS (
        SELECT id, matrix_parent_id, 0 as depth FROM users WHERE id = $1
        UNION ALL
        SELECT u.id, u.matrix_parent_id, mt.depth + 1 FROM users u INNER JOIN mt ON u.matrix_parent_id = mt.id WHERE mt.depth < 18
      )
      SELECT 
        u.wallet_address, 
        u.node_id, 
        u.node_tier, 
        u.node_active,
        u.created_at as joined_at,
        (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_count,
        (
          WITH RECURSIVE sub_tree AS (
            SELECT id, 0 as d FROM users WHERE matrix_parent_id = u.id
            UNION ALL
            SELECT s.id, st.d + 1 FROM users s INNER JOIN sub_tree st ON s.matrix_parent_id = st.id WHERE st.d < 18
          )
          SELECT COUNT(*) FROM sub_tree WHERE d > 0
        ) as team_size,
        CASE WHEN u.referrer_id = $1 THEN true ELSE false END as is_direct
      FROM users u
      JOIN mt ON u.id = mt.id
      WHERE mt.depth = $2
      ORDER BY u.created_at DESC
      LIMIT 100
    `, [rootId, targetDepth]);

    res.json(members.rows);
  } catch (err) {
    console.error('Network level fetch failed:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET Network Counts for all 18 levels (Offline View Helper)
app.get('/api/network/counts/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  try {
    const rootRes = await query(`
      SELECT id, matrix_counts, sponsor_node_id 
      FROM users 
      WHERE LOWER(wallet_address) = LOWER($1)
      ORDER BY id ASC
    `, [walletAddress]);
    
    if (rootRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rootRes.rows[0];
    const rootId = user.id;

    // 1. Matrix counts MUST be calculated from the DB's matrix_parent_id links
    // to ensure they are strictly binary (2, 4, 8...). 
    // We do NOT use matrix_counts from RPC sync because getTeamSize is referral tree.
    const matrixRes = await query(`
      WITH RECURSIVE matrix_tree AS (
        SELECT id, 0 as level FROM users WHERE id = $1
        UNION ALL
        SELECT u.id, mt.level + 1 FROM users u INNER JOIN matrix_tree mt ON u.matrix_parent_id = mt.id WHERE mt.level < 18
      )
      SELECT level, COUNT(*) as count FROM matrix_tree WHERE level > 0 GROUP BY level
    `, [rootId]);
    matrixCounts = new Array(18).fill(0);
    matrixRes.rows.forEach(r => {
      const level = parseInt(r.level);
      const count = parseInt(r.count);
      const maxSlots = Math.pow(2, level);
      matrixCounts[level - 1] = Math.min(count, maxSlots); // Enforce binary limit
    });

    // 2. Always calculate Referral counts (Directs) via CTE as it's dynamic
    const referralRes = await query(`
      WITH RECURSIVE referral_tree AS (
        SELECT id, 0 as level FROM users WHERE id = $1
        UNION ALL
        SELECT u.id, rt.level + 1 FROM users u INNER JOIN referral_tree rt ON u.referrer_id = rt.id WHERE rt.level < 18
      )
      SELECT level, COUNT(*) as count FROM referral_tree WHERE level > 0 GROUP BY level
    `, [rootId]);

    const referralCounts = new Array(18).fill(0);
    referralRes.rows.forEach(r => referralCounts[r.level - 1] = parseInt(r.count));

    res.json({ referralCounts, matrixCounts });
  } catch (err) {
    console.error('Count query failed:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * Sync network members from RPC to DB cache
 */
app.post('/api/network/sync', async (req, res) => {
  const { members, parentNodeId } = req.body;
  if (!members || !Array.isArray(members)) return res.status(400).json({ error: 'Members array required' });

  try {
    // 1. Find parent ID in DB to establish matrix link
    const parentRes = await query('SELECT id FROM users WHERE node_id = $1', [parentNodeId]);
    const parentId = parentRes.rows.length > 0 ? parentRes.rows[0].id : null;

    // 2. Bulk upsert members. We use node_id as the unique key.
    // wallet_address is stored in lowercase for global uniqueness.
    for (const m of members) {
      await query(`
        INSERT INTO users (wallet_address, node_id, node_tier, created_at, matrix_parent_id, matrix_parent_node_id, node_active)
        VALUES (LOWER($1), $2, $3, TO_TIMESTAMP($4), $5, $6, TRUE)
        ON CONFLICT (node_id) DO UPDATE SET 
          wallet_address = EXCLUDED.wallet_address,
          node_tier = EXCLUDED.node_tier,
          matrix_parent_id = COALESCE(EXCLUDED.matrix_parent_id, users.matrix_parent_id),
          matrix_parent_node_id = COALESCE(EXCLUDED.matrix_parent_node_id, users.matrix_parent_node_id),
          node_active = TRUE
      `, [m.wallet, m.nodeId, m.tier, m.joinedAt, parentId, parentNodeId]);
    }

    res.json({ success: true, count: members.length });
  } catch (err) {
    console.error('Bulk sync failed:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

/**
 * High-Precision RPC-Mirror Sync: Fetches 100% accurate contract state for a node.
 */
async function syncNodeStateFromRPC(nodeId) {
  if (!nodeId || nodeId === 0) return;
  try {
    // 1. Fetch Node Struct (Tier, Sponsor, etc.)
    const nodeInfo = await aipcoreContract.nodes(nodeId);
    
    // 2. Update DB with live contract state (links and metadata only)
    await query(`
      UPDATE users 
      SET node_tier = $1,
          sponsor_node_id = $2,
          matrix_parent_node_id = $3,
          last_rpc_sync = CURRENT_TIMESTAMP
      WHERE node_id = $4
    `, [Number(nodeInfo.tier), Number(nodeInfo.sponsor), Number(nodeInfo.matrixParent), nodeId]);

    // 3. Critically repair links to enable CTE matrix calculation
    await repairTreeLinks();

    console.log(`✨ RPC Mirror: Synced Node ${nodeId} metadata and repaired links`);

    // Chain Reaction: If this is a new link, trigger an upline scan periodically
    // (Note: To avoid recursion, we only climb 3 levels per event)
    let parent = Number(nodeInfo.sponsor);
    if (parent > 0) {
       // We set a small timeout to avoid hammering the RPC node too hard in one event block
       setTimeout(() => syncNodeStateFromRPC(parent), 2000);
    }

  } catch (err) {
    console.error(`Failed to RPC sync Node ${nodeId}:`, err.message);
  }
}

/**
 * High-Speed Tree Repair Helper: Rebuilds the referral links entirely in SQL.
 */
async function repairTreeLinks() {
  try {
    // Single query to link orphans by their stored sponsor_node_id mapping
    // Note: We remove "AND u.referrer_id IS NULL" because the Blockchain 
    // is the source of truth for activated nodes. If a user joined via 
    // link A but activated under node B, the DB must link them to B.
    await query(`
      UPDATE users u
      SET referrer_id = p.id
      FROM users p
      WHERE u.sponsor_node_id = p.node_id
      AND u.sponsor_node_id IS NOT NULL
    `);

    // 2. Repair Matrix Links (Binary Tree)
    await query(`
      UPDATE users u
      SET matrix_parent_id = p.id
      FROM users p
      WHERE u.matrix_parent_node_id = p.node_id
      AND u.matrix_parent_id IS NULL AND u.matrix_parent_node_id IS NOT NULL
    `);
  } catch (err) {
    console.error("SQL Tree repair failed:", err.message);
  }
}

// GET User Precision Income History (AIPCore + RewardPool indexed)
app.get('/api/user/income-history/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  try {
    // 1. Fetch from DB
    const result = await query(
      `SELECT * FROM income_history 
       WHERE wallet_address = $1 
       ORDER BY timestamp DESC LIMIT 100`,
      [walletAddress]
    );

    // 2. Trigger background sync (Async, don't wait)
    syncUserHistory(walletAddress);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch income history' });
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
    const parent = await query('SELECT id FROM users WHERE LOWER(wallet_address) = LOWER($1)', [walletAddress]);
    if (parent.rows.length === 0) return res.json([]);

    const result = await query(
      `SELECT wallet_address, 
              local_reward, 
              COALESCE(created_at, NOW()) as joined_at, 
              COALESCE(node_tier, 0) as node_tier, 
              COALESCE(node_id, 0) as node_id,
              (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as direct_count,
              (SELECT COUNT(*) FROM users WHERE matrix_parent_id = u.id) as team_size
       FROM users u
       WHERE referrer_id = $1
       ORDER BY u.created_at DESC
       LIMIT 100`,
      [parent.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Referral fetching error:', err);
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

// POST Claim Daily Login Reward
app.post('/api/daily/claim', async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'Wallet missing' });

  try {
    await query('BEGIN');
    const user = await query('SELECT daily_streak, last_daily_claim, local_reward FROM users WHERE wallet_address = $1 FOR UPDATE', [walletAddress]);
    
    if (user.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const { daily_streak, last_daily_claim } = user.rows[0];
    const now = new Date();
    
    let currentStreak = daily_streak || 0;
    
    if (last_daily_claim) {
      const dbDate = new Date(last_daily_claim);
      const diffMs = now - dbDate;
      const diffHrs = diffMs / (1000 * 60 * 60);

      // Rule: Can only claim once per rolling 24 hours
      if (diffHrs < 24) {
        await query('ROLLBACK');
        return res.status(400).json({ error: 'Reward already claimed for today. Come back tomorrow!' });
      }

      // Rule: If more than 48 hours passed, streak is broken
      if (diffHrs >= 48) {
        currentStreak = 0;
      }
    }

    // Determine reward: day 1 is 100, day 2 is 200, ... max 10 days
    const rewardBase = ((currentStreak % 10) + 1) * 100;

    // Advance streak
    const nextStreak = (currentStreak + 1) % 10;

    // Update user
    const update = await query(
      `UPDATE users 
       SET daily_streak = $1, 
           last_daily_claim = CURRENT_TIMESTAMP, 
           local_reward = local_reward + $2 
       WHERE wallet_address = $3 
       RETURNING *`,
      [nextStreak, rewardBase, walletAddress]
    );

    await query('COMMIT');
    
    res.json({
      success: true,
      reward: rewardBase,
      daily_streak: nextStreak,
      last_daily_claim: update.rows[0].last_daily_claim,
      local_reward: update.rows[0].local_reward
    });
  } catch (err) {
    await query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to claim daily reward' });
  }
});

setInterval(syncGlobalHistory, 2 * 60 * 1000); // Poll every 2 minutes

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AIPCore Backend running on port ${PORT}`);
  syncGlobalHistory(); // Initial fetch
});
