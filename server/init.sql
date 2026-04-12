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
    node_tier INTEGER DEFAULT 0, -- 0: No Node, 1: Base (100/hr), 2: Pro (200/hr)
    is_premium BOOLEAN DEFAULT FALSE, -- 100% bonus (2x) flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimized indices for wallet-first lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer_id);

-- Snapshots table for audits and distributions
CREATE TABLE IF NOT EXISTS snapshots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_users INTEGER DEFAULT 0,
    total_coins NUMERIC(36, 18) DEFAULT 0,
    data JSONB DEFAULT '[]', -- Array of {wallet, balance}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_created ON snapshots(created_at);

-- User-specific conversion history for fast lookups
CREATE TABLE IF NOT EXISTS user_conversions (
    id SERIAL PRIMARY KEY,
    snapshot_id INTEGER REFERENCES snapshots(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    mined_amount NUMERIC(36, 18) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_conv_wallet ON user_conversions(wallet_address);

-- Tasks Management System
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    reward NUMERIC(36, 18) DEFAULT 0,
    icon VARCHAR(50) DEFAULT '💎',
    url VARCHAR(500),
    type VARCHAR(50) DEFAULT 'social',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_tasks (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address, task_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_wallet ON user_tasks(wallet_address);

-- Team Income History Tracking (Precision indexed from on-chain)
CREATE TABLE IF NOT EXISTS income_history (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    source_contract VARCHAR(42) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- Referral, Direct, Layer, Matrix, PoolClaim
    from_node_id INTEGER,
    amount_bnb NUMERIC(36, 18) NOT NULL,
    amount_usd NUMERIC(36, 18) NOT NULL,
    tier INTEGER DEFAULT 0, -- Context: Tier 0-17
    layer INTEGER DEFAULT 0, -- Context: Layer depth
    is_missed BOOLEAN DEFAULT FALSE,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_income_wallet ON income_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_income_timestamp ON income_history(timestamp DESC);
