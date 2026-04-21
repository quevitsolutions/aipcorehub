/**
 * AIPCore Telegram Bot
 * Handles user notifications, marketing broadcasts, and referral deep links.
 * Uses polling (no webhook needed — simpler Docker setup).
 */
import TelegramBot from 'node-telegram-bot-api';
import { query } from './db.js';
import { ethers } from 'ethers';

// Hardcoded for backend Docker context isolation
const REWARDPOOL_ADDRESS = "0x319429aD1A00cbCD6aed1fFA1106eEC056316465";
const BSC_RPC = (process.env.VITE_RPC_URL || "https://bsc-dataseed.binance.org").trim();
const REWARDPOOL_ABI = [
  "function getPoolViewHelper(uint256 nodeId) view returns (uint8, string, uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, uint8, uint256[3])"
];

const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const BOT_USERNAME = 'aipcore_bot';
const APP_URL = (process.env.APP_URL || 'https://aipcore.online').trim();
const ADMIN_WALLET = (process.env.VITE_ADMIN_WALLET || '').toLowerCase().trim();

let bot = null;

// ── Initialise Bot ─────────────────────────────────────────────────────────────
export function initTelegramBot() {
  if (!BOT_TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set — bot disabled.');
    return null;
  }

  bot = new TelegramBot(BOT_TOKEN, { polling: true });
  console.log('🤖 Telegram bot started (@' + BOT_USERNAME + ')');

  // Set the menu button to show commands (hamburger menu) — app opens externally
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: { type: 'commands' }
    })
  }).catch(err => console.warn('Failed to set chat menu button:', err.message));

  // Set default bot commands for the slash menu
  bot.setMyCommands([
    { command: 'start', description: 'Open your dashboard' },
    { command: 'status', description: 'Check your node and balance' },
    { command: 'team', description: 'View your team network' },
    { command: 'refer', description: 'Get your referral links' }
  ]).catch(err => console.warn('Failed to set bot commands:', err.message));

  const getDashboardKeyboard = () => ({
    keyboard: [
      [{ text: '🚀 Launch App', url: APP_URL }],
      [{ text: '📊 My Status' }, { text: '👥 My Team' }],
      [{ text: '🔗 Share Referral' }, { text: 'ℹ️ About AIPCore' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  });


  // ── /start [walletAddress] ────────────────────────────────────────────────
  bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const firstName = msg.from.first_name || 'Operator';
    const walletArg = match[1] ? match[1].trim() : null;

    // If passed as conn_0x... it means the user clicked 'Connect Telegram' in the app
    if (walletArg && walletArg.startsWith('conn_0x')) {
      const actualWallet = walletArg.replace('conn_', '');
      try {
        await query(
          `UPDATE users SET telegram_id = $1 WHERE LOWER(wallet_address) = LOWER($2)`,
          [telegramId, actualWallet]
        );
        await bot.sendMessage(chatId,
          `✅ *Wallet Connected!*\n\nHey ${firstName}! Your wallet \`${actualWallet.slice(0,6)}...${actualWallet.slice(-4)}\` is now linked to this Telegram account.\n\n🔔 You will receive:\n• Node activation alerts\n• Reward notifications\n• New team member alerts\n• Exclusive promotions\n\nUse the buttons below to explore AIPCore 👇`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🌐 Open App', url: APP_URL }],
                [{ text: '📊 My Status', callback_data: `status:${actualWallet}` }, { text: '👥 My Team', callback_data: `team:${actualWallet}` }],
                [{ text: '🔗 Share Referral', callback_data: `share:${actualWallet}` }]
              ]
            }
          }
        );
        // Activate persistent keyboard instantly behind the scenes
        bot.sendMessage(chatId, '🎛 Dashboard Menu enabled!', { reply_markup: getDashboardKeyboard() });
      } catch (err) {
        console.error('Telegram /start wallet link error:', err.message);
        await bot.sendMessage(chatId, '❌ Could not link wallet. Please try again from the app.');
      }
    } 
    else if (walletArg && walletArg.startsWith('0x')) {
      await bot.sendMessage(chatId,
        `👋 *Welcome to AIPCore Hub!*\n\nYou've been invited by \`${walletArg.slice(0,6)}...${walletArg.slice(-4)}\` to join the ultimate BNB earnings network.\n\n⚡ Build a global team for free and activate your node to earn 24/7 passive matrix income.\n\nClick the button below to connect your wallet and lock your position in their team 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Launch App & Join Team', url: `${APP_URL}/?ref=${walletArg}` }]
            ]
          }
        }
      );
      bot.sendMessage(chatId, '🎛 Menu enabled!', { reply_markup: getDashboardKeyboard() });
    } 
    else {
      // Generic welcome — user opened bot without deep link
      await bot.sendMessage(chatId,
        `👋 *Welcome to AIPCore Hub!*\n\n⚡ The decentralized BNB earnings network where free users build global teams and activate their income stream.\n\nTo connect your wallet and get notifications, visit the app and click *"🔔 Connect Telegram"* on your profile page.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Launch App', url: APP_URL }],
              [{ text: '📜 What is AIPCore?', callback_data: 'info' }]
            ]
          }
        }
      );
      bot.sendMessage(chatId, '🎛 Menu enabled!', { reply_markup: getDashboardKeyboard() });
    }
  });

  // ── /status ───────────────────────────────────────────────────────────────
  const handleStatus = async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    try {
      const result = await query(
        `SELECT wallet_address, node_tier, node_id, local_reward, 
                (SELECT COUNT(*) FROM users WHERE referrer_id = u.id) as directs
         FROM users u WHERE telegram_id = $1 ORDER BY node_tier DESC LIMIT 1`,
        [telegramId]
      );
      if (result.rows.length === 0) {
        return bot.sendMessage(chatId, '❌ No wallet linked. Open the app and click "Connect Telegram" first.');
      }
      const u = result.rows[0];
      const wallet = `${u.wallet_address.slice(0,6)}...${u.wallet_address.slice(-4)}`;
      const tier = u.node_tier > 0 ? `✅ Tier ${u.node_tier} Node` : '⏳ Free User (Not Activated)';
      let nodeInfo = 'Pending';
      if (u.node_id) nodeInfo = `#${u.node_id}`;
      else if (u.node_tier > 0) nodeInfo = 'Activated';
      const aip = parseFloat(u.local_reward || 0).toFixed(0);

      // Web3 Pool Qualification Fetching
      let poolText = '🔒 Pool: Not Qualified';
      let showRegisterBtn = false;
      try {
        if (u.node_id) {
          const provider = new ethers.JsonRpcProvider(BSC_RPC);
          const poolContract = new ethers.Contract(REWARDPOOL_ADDRESS, REWARDPOOL_ABI, provider);
          const poolData = await poolContract.getPoolViewHelper(u.node_id);
          const currentPoolId = Number(poolData[0]);
          const poolName = String(poolData[1]);
          const isQualForNext = Boolean(poolData[9]);
          
          if (currentPoolId > 0) {
            poolText = `🏆 Pool: Active in ${poolName}`;
          } else if (isQualForNext) {
            poolText = `🏆 Pool: QUALIFIED (Ready to Register!)`;
            showRegisterBtn = true;
          }
        }
      } catch (err) {
        console.warn('Web3 Pool fetch failed in bot:', err.message);
      }
      
      const keyboard = showRegisterBtn ? {
        inline_keyboard: [
          [{ text: '🏆 Register Global Pool', web_app: { url: APP_URL } }]
        ]
      } : getDashboardKeyboard();

      await bot.sendMessage(chatId,
        `📊 *Your AIPCore Status*\n\n👛 Wallet: \`${wallet}\`\n⬡ Node: ${nodeInfo}\n🏆 Status: ${tier}\n💎 \$AIP Balance: ${Number(aip).toLocaleString()}\n👥 Direct Refs: ${u.directs}\n${poolText}\n\n${u.node_tier === 0 ? '⚠️ Activate your node to start earning real BNB!' : '🎉 You are earning BNB from your network!'}`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
      if (showRegisterBtn) {
         bot.sendMessage(chatId, '🎛 Menu enabled!', { reply_markup: getDashboardKeyboard() });
      }
    } catch (err) {
      console.error('Telegram /status error:', err.message);
      bot.sendMessage(chatId, '❌ Failed to fetch status. Try again later.');
    }
  };
  bot.onText(/\/status/, handleStatus);

  // ── /team ─────────────────────────────────────────────────────────────────
  const handleTeam = async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    try {
      const userRes = await query(
        `SELECT id, wallet_address, node_tier FROM users WHERE telegram_id = $1 ORDER BY node_tier DESC LIMIT 1`,
        [telegramId]
      );
      if (userRes.rows.length === 0) {
        return bot.sendMessage(chatId, '❌ No wallet linked. Connect your Telegram from the app first.');
      }
      const userId = userRes.rows[0].id;
      const countRes = await query(`
        WITH RECURSIVE tree AS (
          SELECT id, 0 as level FROM users WHERE id = $1
          UNION ALL
          SELECT u.id, t.level + 1 FROM users u INNER JOIN tree t ON u.referrer_id = t.id WHERE t.level < 18
        )
        SELECT 
          COUNT(*) FILTER (WHERE level > 0) as total_team,
          COUNT(*) FILTER (WHERE level = 1) as directs,
          COUNT(*) FILTER (WHERE node_tier > 0 AND level > 0) as activated
        FROM tree t JOIN users u ON u.id = t.id
      `, [userId]);
      
      const c = countRes.rows[0];
      const total = parseInt(c.total_team || 0);
      const directs = parseInt(c.directs || 0);
      const activated = parseInt(c.activated || 0);
      const free = total - activated;
      const convRate = total > 0 ? ((activated / total) * 100).toFixed(1) : '0.0';
      
      await bot.sendMessage(chatId,
        `👥 *Your Team Network*\n\n📏 Total Team (18 levels): ${total}\n👤 Direct Referrals: ${directs}\n✅ Activated Nodes: ${activated}\n⏳ Free Users: ${free}\n📈 Conversion Rate: ${convRate}%\n\n${free > 0 ? `💡 Share your link to convert ${free} free users!` : '🏆 Amazing! Your whole team is activated!'}`,
        {
          parse_mode: 'Markdown',
          reply_markup: getDashboardKeyboard()
        }
      );
    } catch (err) {
      console.error('Telegram /team error:', err.message);
      bot.sendMessage(chatId, '❌ Failed to fetch team data.');
    }
  };
  bot.onText(/\/team/, handleTeam);

  // ── /refer ────────────────────────────────────────────────────────────────
  const handleRefer = async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    try {
      const result = await query('SELECT wallet_address FROM users WHERE telegram_id = $1 LIMIT 1', [telegramId]);
      if (result.rows.length === 0) return bot.sendMessage(chatId, '❌ No wallet linked.');
      const wallet = result.rows[0].wallet_address;
      const refLink = `${APP_URL}?ref=${wallet}`;
      const botLink = `https://t.me/${BOT_USERNAME}?start=${wallet}`;
      await bot.sendMessage(chatId,
        `🔗 <b>Your Referral Links</b>\n\n🌐 <b>App Link:</b>\n${refLink}\n\n🤖 <b>Bot Link (share this!):</b>\n${botLink}\n\n📤 Share these links to grow your free user base. When they activate, you earn BNB!`,
        { parse_mode: 'HTML', reply_markup: getDashboardKeyboard() }
      );
    } catch (err) {
      bot.sendMessage(chatId, '❌ Error fetching referral links.');
    }
  };
  bot.onText(/\/refer/, handleRefer);

  const handleInfo = async (msg) => {
    bot.sendMessage(msg.chat.id,
      `ℹ️ *About AIPCore Hub*\n\nAIPCore is a decentralized BNB-earning network running on BNB Smart Chain.\n\n🔹 *Free Users* can join and build a team for free (30-day trial)\n🔹 *Node Holders* earn real BNB from their 18-level deep network\n🔹 The more users in your team, the more you earn\n\n🚀 Activate your node and start earning today!`,
      { parse_mode: 'Markdown', reply_markup: getDashboardKeyboard() }
    );
  };

  // Plain text message handler for persistent keyboard clicks
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return; // Ignore commands or non-text
    
    switch (msg.text) {
      case '📊 My Status': return handleStatus(msg);
      case '👥 My Team': return handleTeam(msg);
      case '🔗 Share Referral': return handleRefer(msg);
      case 'ℹ️ About AIPCore': return handleInfo(msg);
    }
  });

  // ── Callback Queries (inline button handlers fallback) ────────────────────
  bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = msg.chat.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    // Construct a synthetic message object ensuring `msg.from.id` is the querying user, NOT the bot
    const fakeMsg = {
      chat: { id: chatId },
      from: { id: callbackQuery.from.id }
    };

    if (data === 'info') {
      await handleInfo(fakeMsg);
    } else if (data.startsWith('share:')) {
      await handleRefer(fakeMsg);
    } else if (data.startsWith('status:')) {
      await handleStatus(fakeMsg);
    } else if (data.startsWith('team:')) {
      await handleTeam(fakeMsg);
    }
  });

  // ── Polling error handler ─────────────────────────────────────────────────
  bot.on('polling_error', (err) => {
    console.error('Telegram polling error:', err.message);
  });

  return bot;
}

// ── Public API: Send notification to a single user ──────────────────────────
export async function sendNotification(telegramId, message, options = {}) {
  if (!bot || !telegramId) return;
  try {
    await bot.sendMessage(telegramId, message, { parse_mode: 'Markdown', ...options });
  } catch (err) {
    // Silently fail if user blocked the bot
    if (!err.message.includes('blocked') && !err.message.includes('not found')) {
      console.error('Telegram send error:', err.message);
    }
  }
}

// ── Public API: Broadcast to a filtered set of users ───────────────────────
export async function broadcastToUsers({ filter = 'all', message, imageUrl = null, buttonUrl = null, buttonLabel = null }) {
  if (!bot || !message) throw new Error('Bot not initialised or no message');

  let sqlFilter = 'telegram_id IS NOT NULL';
  if (filter === 'free') sqlFilter += ' AND node_tier = 0';
  if (filter === 'activated') sqlFilter += ' AND node_tier > 0';

  const users = await query(`SELECT telegram_id FROM users WHERE ${sqlFilter}`);
  let sent = 0;
  let failed = 0;

  const replyMarkup = buttonUrl ? {
    reply_markup: {
      inline_keyboard: [[{ text: buttonLabel || '🌐 Open App', url: buttonUrl }]]
    }
  } : {};

  for (const u of users.rows) {
    try {
      if (imageUrl) {
        await bot.sendPhoto(u.telegram_id, imageUrl, { caption: message, parse_mode: 'Markdown', ...replyMarkup });
      } else {
        await bot.sendMessage(u.telegram_id, message, { parse_mode: 'Markdown', ...replyMarkup });
      }
      sent++;
      // Rate-limit: 30 messages per second (Telegram API limit)
      await new Promise(r => setTimeout(r, 35));
    } catch {
      failed++;
    }
  }

  // Log the broadcast
  try {
    await query(
      `INSERT INTO telegram_broadcasts (message, target_filter, sent_count) VALUES ($1, $2, $3)`,
      [message, filter, sent]
    );
  } catch {}

  return { sent, failed, total: users.rows.length };
}

// ── Web3 Task Authentication ──────────────────────────────────────────────
export async function verifyTelegramMembership(telegramId, channelUrl) {
  if (!bot) return false;
  if (!telegramId) return false;

  try {
    // Extract handle from https://t.me/AIPCore or similar
    let channelHandle = channelUrl.split('/').pop().split('?')[0];
    if (!channelHandle.startsWith('@')) channelHandle = '@' + channelHandle;

    const member = await bot.getChatMember(channelHandle, telegramId);
    return ['creator', 'administrator', 'member', 'restricted'].includes(member.status);
  } catch (err) {
    if (err.response && err.response.statusCode === 400) {
      if (err.response.body && err.response.body.description.includes('user not found')) {
        return false; // User definitely not in the chat
      }
    }
    console.warn(`Telegram API Verification warning checking ${telegramId} against ${channelUrl}:`, err.message);
    return false; // Fail safe
  }
}

