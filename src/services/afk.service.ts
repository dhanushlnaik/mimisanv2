import { query } from '../database/index.js';
import type { UserAfk } from '../client.js';
import { logger } from '../utils/logger.js';

// Set user AFK status (global)
export async function setAfk(userId: string, reason: string = 'AFK'): Promise<UserAfk> {
    const result = await query<UserAfk>(
        `INSERT INTO user_afk (user_id, reason, since)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET reason = $2, since = NOW()
     RETURNING *`,
        [userId, reason]
    );

    logger.debug(`User ${userId} set AFK: ${reason}`);
    return result.rows[0];
}

// Get user AFK status
export async function getAfk(userId: string): Promise<UserAfk | null> {
    const result = await query<UserAfk>(
        'SELECT * FROM user_afk WHERE user_id = $1',
        [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
}

// Clear user AFK status
export async function clearAfk(userId: string): Promise<boolean> {
    const result = await query(
        'DELETE FROM user_afk WHERE user_id = $1',
        [userId]
    );

    if (result.rowCount && result.rowCount > 0) {
        logger.debug(`User ${userId} AFK cleared`);
        return true;
    }
    return false;
}

// Check if user is AFK
export async function isAfk(userId: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
        'SELECT EXISTS(SELECT 1 FROM user_afk WHERE user_id = $1) as exists',
        [userId]
    );

    return result.rows[0].exists;
}

// Get multiple users' AFK status (for mention checking)
export async function getAfkUsers(userIds: string[]): Promise<UserAfk[]> {
    if (userIds.length === 0) return [];

    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query<UserAfk>(
        `SELECT * FROM user_afk WHERE user_id IN (${placeholders})`,
        userIds
    );

    return result.rows;
}
