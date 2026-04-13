
const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:postgres@localhost:5432/aipcore"
});

async function checkLinkage() {
  await client.connect();
  try {
    const sponsorWallet = '0x8112011370FDBA02c428dA5938fe72cbf3e0d54A'.toLowerCase();
    const referralWallet = '0xdD64e0Cd06764499d63cFC557F897858580062Fa'.toLowerCase();

    console.log('--- SPONSOR CHECK ---');
    const sponsors = await client.query('SELECT id, wallet_address, node_id FROM users WHERE LOWER(wallet_address) = $1', [sponsorWallet]);
    console.log(sponsors.rows);

    console.log('\n--- REFERRAL CHECK ---');
    const referrals = await client.query('SELECT id, wallet_address, referrer_id, node_id, local_reward FROM users WHERE LOWER(wallet_address) = $1', [referralWallet]);
    console.log(referrals.rows);

    if (referrals.rows.length > 0 && sponsors.rows.length > 0) {
        const ref = referrals.rows[0];
        const sponsorIds = sponsors.rows.map(s => s.id);
        
        if (!sponsorIds.includes(ref.referrer_id)) {
            console.log('\n❌ LINKAGE BROKEN: Referral belongs to ID', ref.referrer_id, 'but sponsor is ID(s)', sponsorIds);
            
            // Fix it?
            // await client.query('UPDATE users SET referrer_id = $1 WHERE wallet_address = $2', [sponsors.rows[0].id, referralWallet]);
            // console.log('✅ FIXED');
        } else {
            console.log('\n✅ LINKAGE OK in DB');
        }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkLinkage();
