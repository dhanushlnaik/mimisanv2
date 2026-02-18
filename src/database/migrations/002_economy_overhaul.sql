-- Migration: 002_economy_overhaul.sql

-- 1. Users Global (Platform Wide)
CREATE TABLE IF NOT EXISTS users_global (
    user_id VARCHAR(20) PRIMARY KEY,
    global_xp BIGINT DEFAULT 0,
    global_level INTEGER DEFAULT 1,
    reputation INTEGER DEFAULT 0,
    total_earnings BIGINT DEFAULT 0,
    last_daily_at TIMESTAMPTZ,
    last_weekly_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Server Configs (Detailed Economy Settings)
CREATE TABLE IF NOT EXISTS server_configs (
    guild_id VARCHAR(20) PRIMARY KEY REFERENCES guild_settings(guild_id) ON DELETE CASCADE,
    
    -- XP Settings
    xp_rate_chat FLOAT DEFAULT 1.0,
    xp_rate_vc FLOAT DEFAULT 1.0,
    xp_mode VARCHAR(20) DEFAULT 'balanced', -- balanced, chat, vc
    
    -- Salary Settings
    salary_base INTEGER DEFAULT 50,
    salary_mode VARCHAR(20) DEFAULT 'linear', -- linear, tiered
    salary_data JSONB DEFAULT '{}', -- Custom brackets for tiered mode
    
    -- Modules
    dungeons_enabled BOOLEAN DEFAULT TRUE,
    casino_enabled BOOLEAN DEFAULT TRUE,
    market_enabled BOOLEAN DEFAULT TRUE,
    
    -- Game Difficulty
    dungeon_difficulty FLOAT DEFAULT 1.0,
    treasure_frequency VARCHAR(20) DEFAULT 'medium',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Relics (Items)
CREATE TABLE IF NOT EXISTS relics (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR(20) NOT NULL, -- Global User ID
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    stats JSONB NOT NULL DEFAULT '{}', -- { salary_mult: 1.1, xp_mult: 1.05, etc }
    is_equipped BOOLEAN DEFAULT FALSE,
    source VARCHAR(50), -- dungeon, market, casino, admin
    obtained_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for looking up a user's relics
    CONSTRAINT fk_user FOREIGN KEY (owner_id) REFERENCES users_global(user_id) ON DELETE CASCADE
);

-- 4. Marketplace Listings
CREATE TABLE IF NOT EXISTS market_listings (
    id SERIAL PRIMARY KEY,
    seller_id VARCHAR(20) NOT NULL,
    buyer_id VARCHAR(20), -- Null until bought
    relic_id INTEGER NOT NULL REFERENCES relics(id) ON DELETE CASCADE,
    price INTEGER NOT NULL CHECK (price > 0),
    guild_id VARCHAR(20), -- Market is server-scoped
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
    listed_at TIMESTAMPTZ DEFAULT NOW(),
    sold_at TIMESTAMPTZ
);

-- 5. Dungeon Runs
CREATE TABLE IF NOT EXISTS dungeon_runs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    rank VARCHAR(10) NOT NULL, -- E, C, B, A, S
    status VARCHAR(20) NOT NULL DEFAULT 'progress', -- progress, completed, failed
    rewards JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Casino History
CREATE TABLE IF NOT EXISTS casino_games (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    game_type VARCHAR(20) NOT NULL,
    bet_amount INTEGER NOT NULL,
    outcome VARCHAR(20) NOT NULL, -- win, loss
    payout INTEGER DEFAULT 0,
    played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_global_updated_at ON users_global;
CREATE TRIGGER update_users_global_updated_at
    BEFORE UPDATE ON users_global
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_server_configs_updated_at ON server_configs;
CREATE TRIGGER update_server_configs_updated_at
    BEFORE UPDATE ON server_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
