-- Migration: 003_add_global_balance.sql

ALTER TABLE users_global ADD COLUMN IF NOT EXISTS balance BIGINT DEFAULT 0;
