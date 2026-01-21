import { query } from '../database/index.js';
import type { UserLevel } from '../client.js';
import { logger } from '../utils/logger.js';

// XP settings
const XP_PER_MESSAGE_MIN = 15;
const XP_PER_MESSAGE_MAX = 25;
const XP_COOLDOWN_MS = 60000; // 1 minute between XP gains

// In-memory cooldown cache
const xpCooldowns = new Map<string, number>();

// Calculate XP needed for a level
export function xpForLevel(level: number): number {
    return 5 * (level ** 2) + 50 * level + 100;
}

// Calculate total XP for all levels up to target
export function totalXpForLevel(level: number): number {
    let total = 0;
    for (let i = 0; i < level; i++) {
        total += xpForLevel(i);
    }
    return total;
}

// Get random XP amount
function getRandomXp(): number {
    return Math.floor(Math.random() * (XP_PER_MESSAGE_MAX - XP_PER_MESSAGE_MIN + 1)) + XP_PER_MESSAGE_MIN;
}

// Get user level data
export async function getUserLevel(userId: string, guildId: string): Promise<UserLevel> {
    const result = await query<UserLevel>(
        'SELECT * FROM user_levels WHERE user_id = $1 AND guild_id = $2',
        [userId, guildId]
    );

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    // Create new entry
    const newResult = await query<UserLevel>(
        `INSERT INTO user_levels (user_id, guild_id, xp, level, last_xp_at)
     VALUES ($1, $2, 0, 1, NOW())
     RETURNING *`,
        [userId, guildId]
    );

    return newResult.rows[0];
}

// Add XP to user (with cooldown)
export async function addXp(
    userId: string,
    guildId: string,
    amount?: number
): Promise<{ leveledUp: boolean; newLevel: number; xp: number } | null> {
    const cooldownKey = `${userId}:${guildId}`;
    const now = Date.now();
    const lastXp = xpCooldowns.get(cooldownKey);

    // Check cooldown
    if (lastXp && now - lastXp < XP_COOLDOWN_MS) {
        return null;
    }

    xpCooldowns.set(cooldownKey, now);
    const xpToAdd = amount ?? getRandomXp();

    // Get current level data
    const userData = await getUserLevel(userId, guildId);
    const newXp = userData.xp + xpToAdd;
    const requiredXp = xpForLevel(userData.level);

    let newLevel = userData.level;
    let leveledUp = false;

    // Check for level up
    if (newXp >= requiredXp) {
        newLevel = userData.level + 1;
        leveledUp = true;
    }

    // Update database
    await query(
        `UPDATE user_levels 
     SET xp = $3, level = $4, last_xp_at = NOW() 
     WHERE user_id = $1 AND guild_id = $2`,
        [userId, guildId, leveledUp ? newXp - requiredXp : newXp, newLevel]
    );

    if (leveledUp) {
        logger.debug(`User ${userId} leveled up to ${newLevel} in guild ${guildId}`);
    }

    return { leveledUp, newLevel, xp: newXp };
}

// Get leaderboard
export async function getLeaderboard(
    guildId: string,
    limit: number = 10
): Promise<UserLevel[]> {
    const result = await query<UserLevel>(
        `SELECT * FROM user_levels 
     WHERE guild_id = $1 
     ORDER BY level DESC, xp DESC 
     LIMIT $2`,
        [guildId, limit]
    );

    return result.rows;
}

// Get user rank in guild
export async function getUserRank(userId: string, guildId: string): Promise<number> {
    const result = await query<{ rank: string }>(
        `SELECT COUNT(*) + 1 as rank
     FROM user_levels
     WHERE guild_id = $1 
     AND (level > (SELECT level FROM user_levels WHERE user_id = $2 AND guild_id = $1)
          OR (level = (SELECT level FROM user_levels WHERE user_id = $2 AND guild_id = $1)
              AND xp > (SELECT xp FROM user_levels WHERE user_id = $2 AND guild_id = $1)))`,
        [guildId, userId]
    );

    return parseInt(result.rows[0].rank, 10);
}

// Set user XP (admin)
export async function setXp(
    userId: string,
    guildId: string,
    xp: number
): Promise<UserLevel> {
    // Calculate appropriate level for XP
    let level = 1;
    let totalNeeded = 0;
    while (totalNeeded + xpForLevel(level) <= xp) {
        totalNeeded += xpForLevel(level);
        level++;
    }
    const remainingXp = xp - totalNeeded;

    const result = await query<UserLevel>(
        `INSERT INTO user_levels (user_id, guild_id, xp, level, last_xp_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, guild_id) DO UPDATE SET xp = $3, level = $4
     RETURNING *`,
        [userId, guildId, remainingXp, level]
    );

    return result.rows[0];
}
