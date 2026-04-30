/**
 * AIPCore Tier Backfill Script
 * Reads every wallet from the DB, queries BSC for their node ID + tier,
 * and updates the DB rows. Run once to repair all stale node_tier=0 rows.
 *
 * Usage (inside the VPS container or via `node backfill-tiers.js`):
 *   node server/backfill-tiers.js
 */
import { ethers } from 'ethers';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const BSC_RPC = (process.env.VITE_RPC_URL || 'https://bsc-dataseed1.defibit.io').trim();
const AIPCORE_ADDRESS = '0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f';
const AIPCORE_ABI = [
  'function addressToNodeId(address _wallet) view returns (uint256)',
  'function nodes(uint256 _nodeId) view returns (uint64 nodeId, address wallet, uint64 sponsor, uint64 matrixParent, uint40 joinedAt, uint8 tier, uint256 totalContribution, uint256 totalEarned, uint32 directNodes)',
  'function getNodeStats(uint256 _userId) view returns (uint256 tier, uint256 directCount, uint256 matrixCount, uint256 totalRewards, uint256 totalContribution, uint256 daysActive)'
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const contract = new ethers.Contract(AIPCORE_ADDRESS, AIPCORE_ABI, provider);

  const client = await pool.connect();

  try {
    // Get all wallets from DB
    const { rows: users } = await client.query(
      `SELECT id, wallet_address, node_id, node_tier FROM users ORDER BY id ASC`
    );

    console.log(`\n🔍 Found ${users.length} wallets to check against BSC\n`);
    console.log(`RPC: ${BSC_RPC}\n`);

    let updated = 0, skipped = 0, failed = 0, notFound = 0;

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const wallet = u.wallet_address;
      process.stdout.write(`[${i + 1}/${users.length}] ${wallet.slice(0,10)}... `);

      try {
        // Step 1: get nodeId from contract
        const rawNodeId = await contract.addressToNodeId(wallet);
        const nodeId = Number(rawNodeId);

        if (nodeId === 0) {
          process.stdout.write(`→ No node on chain\n`);
          notFound++;
          await sleep(300);
          continue;
        }

        // Step 2: get node stats (tier etc)
        const stats = await contract.getNodeStats(nodeId);
        const tier = Number(stats[0]);

        if (tier === 0) {
          process.stdout.write(`→ NodeId ${nodeId} but tier=0 on chain\n`);
          notFound++;
          await sleep(300);
          continue;
        }

        // Step 3: check if DB already matches
        if (Number(u.node_id) === nodeId && Number(u.node_tier) === tier) {
          process.stdout.write(`→ Already correct (Node #${nodeId}, Tier ${tier})\n`);
          skipped++;
          await sleep(200);
          continue;
        }

        // Step 4: update DB
        await client.query(
          `UPDATE users
           SET node_id       = $2,
               node_tier     = $3,
               node_active   = TRUE,
               last_rpc_sync = CURRENT_TIMESTAMP,
               updated_at    = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [u.id, nodeId, tier]
        );

        process.stdout.write(`→ ✅ UPDATED Node #${nodeId}, Tier ${tier} (was tier=${u.node_tier})\n`);
        updated++;
        await sleep(300);

      } catch (err) {
        process.stdout.write(`→ ⚠️  RPC error: ${err.message.slice(0,60)}\n`);
        failed++;
        await sleep(800); // longer backoff on error
      }
    }

    console.log(`\n${'─'.repeat(55)}`);
    console.log(`✅ Updated : ${updated}`);
    console.log(`⏭  Skipped : ${skipped} (already correct)`);
    console.log(`❌ No node : ${notFound}`);
    console.log(`⚠️  Errors  : ${failed}`);
    console.log(`${'─'.repeat(55)}\n`);

    if (updated > 0) {
      // Show what we changed
      const { rows: fixed } = await client.query(
        `SELECT wallet_address, node_id, node_tier
         FROM users WHERE node_id IS NOT NULL ORDER BY node_tier DESC LIMIT 20`
      );
      console.log('📊 Updated nodes in DB:');
      fixed.forEach(r => {
        console.log(`  ${r.wallet_address.slice(0,14)}... → Node #${r.node_id}, Tier ${r.node_tier}`);
      });
    }

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
