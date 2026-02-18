-- Migration: 004_add_xp_channels.sql

ALTER TABLE server_configs 
ADD COLUMN IF NOT EXISTS xp_channel_mode VARCHAR(20) DEFAULT 'blacklist', -- whitelist, blacklist
ADD COLUMN IF NOT EXISTS xp_channels TEXT[] DEFAULT '{}';
