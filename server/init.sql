-- AIPCore Game Database Schema (Modernized Web3 Version)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    telegram_id BIGINT, -- Kept for historical/cross-platform support
    taps INTEGER DEFAULT 0,
    local_reward NUMERIC(36, 18) DEFAULT 0,
    energy INTEGER DEFAULT 500,
    max_energy INTEGER DEFAULT 500,
    mining_rate NUMERIC(36, 18) DEFAULT 1000,
    last_claim_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    streak INTEGER DEFAULT 0,
    last_streak_date DATE,
    referrer_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimized indices for wallet-first lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer_id);
