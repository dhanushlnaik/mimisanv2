-- MimiSan Initial Database Schema
-- Migration: 001_initial_schema.sql

-- Guild Settings
CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id VARCHAR(20) PRIMARY KEY,
    prefix VARCHAR(10) DEFAULT '!',
    welcome_channel_id VARCHAR(20),
    afk_channel_id VARCHAR(20),
    todo_channel_id VARCHAR(20),
    enabled_modules JSONB DEFAULT '["fun","games","actions","utility"]',
    afk_enabled BOOLEAN DEFAULT true,
    leveling_enabled BOOLEAN DEFAULT true,
    welcome_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User AFK (Global across all servers)
CREATE TABLE IF NOT EXISTS user_afk (
    user_id VARCHAR(20) PRIMARY KEY,
    reason TEXT DEFAULT 'AFK',
    since TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships (Per Guild)
CREATE TABLE IF NOT EXISTS relationships (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    user_one_id VARCHAR(20) NOT NULL,
    user_two_id VARCHAR(20) NOT NULL,
    relationship_state VARCHAR(20) DEFAULT 'stranger',
    trust INTEGER DEFAULT 50 CHECK (trust >= 0 AND trust <= 100),
    affection INTEGER DEFAULT 50 CHECK (affection >= 0 AND affection <= 100),
    stability INTEGER DEFAULT 50 CHECK (stability >= 0 AND stability <= 100),
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_relationship UNIQUE(guild_id, user_one_id, user_two_id),
    CONSTRAINT valid_relationship_state CHECK (
        relationship_state IN (
            'stranger', 'acquaintance', 'friend', 'best_friend',
            'dating', 'engaged', 'married', 'separated', 'divorced'
        )
    )
);

-- Family Relations (Orthogonal to romantic relationships)
CREATE TABLE IF NOT EXISTS family_relations (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    parent_id VARCHAR(20) NOT NULL,
    child_id VARCHAR(20) NOT NULL,
    relation_type VARCHAR(20) DEFAULT 'adopted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_family_relation UNIQUE(guild_id, parent_id, child_id),
    CONSTRAINT valid_relation_type CHECK (relation_type IN ('adopted', 'biological'))
);

-- Todos
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- User Levels (Per Guild)
CREATE TABLE IF NOT EXISTS user_levels (
    user_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_xp_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, guild_id)
);

-- Guild Rewards
CREATE TABLE IF NOT EXISTS guild_rewards (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('role', 'currency', 'feature')),
    reward_value TEXT NOT NULL,
    CONSTRAINT unique_guild_level_reward UNIQUE(guild_id, level, reward_type)
);

-- User Currency (Per Guild)
CREATE TABLE IF NOT EXISTS user_currency (
    user_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    daily_claimed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, guild_id)
);

-- Relationship Events Log
CREATE TABLE IF NOT EXISTS relationship_events (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES relationships(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,
    event_data JSONB DEFAULT '{}',
    trust_change INTEGER DEFAULT 0,
    affection_change INTEGER DEFAULT 0,
    stability_change INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Command Cooldowns (Transient)
CREATE TABLE IF NOT EXISTS cooldowns (
    user_id VARCHAR(20) NOT NULL,
    command_name VARCHAR(50) NOT NULL,
    guild_id VARCHAR(20),
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, command_name)
);

-- Vote Tracking (Top.gg)
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    bonus_claimed BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_relationships_guild ON relationships(guild_id);
CREATE INDEX IF NOT EXISTS idx_relationships_users ON relationships(user_one_id, user_two_id);
CREATE INDEX IF NOT EXISTS idx_family_guild ON family_relations(guild_id);
CREATE INDEX IF NOT EXISTS idx_todos_guild_user ON todos(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_todos_incomplete ON todos(guild_id, completed) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_user_levels_guild ON user_levels(guild_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_ranking ON user_levels(guild_id, xp DESC);
CREATE INDEX IF NOT EXISTS idx_cooldowns_expires ON cooldowns(expires_at);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_guild_settings_updated_at ON guild_settings;
CREATE TRIGGER update_guild_settings_updated_at
    BEFORE UPDATE ON guild_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_relationships_updated_at ON relationships;
CREATE TRIGGER update_relationships_updated_at
    BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
