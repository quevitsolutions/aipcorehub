-- AIPCore Game Database Schema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    wallet_address VARCHAR(42) UNIQUE,
    taps INTEGER DEFAULT 0,
    local_reward NUMERIC(36, 18) DEFAULT 0,
    energy INTEGER DEFAULT 500,
    max_energy INTEGER DEFAULT 500,
    mining_rate NUMERIC(36, 18) DEFAULT 1000,
    last_claim_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    streak INTEGER DEFAULT 0,
    last_streak_date DATE,
    referrer_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by telegram or wallet
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
