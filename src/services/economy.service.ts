import { query } from '../database/index.js';
import type { UserCurrency, UserGlobal } from '../client.js';
import { logger } from '../utils/logger.js';

// Daily reward amount
const DAILY_AMOUNT = 100;
const DAILY_COOLDOWN_HOURS = 24;

// Get user balance
export async function getBalance(userId: string, guildId: string): Promise<UserCurrency> {
    const result = await query<UserCurrency>(
        'SELECT * FROM user_currency WHERE user_id = $1 AND guild_id = $2',
        [userId, guildId]
    );

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    // Create new entry
    const newResult = await query<UserCurrency>(
        `INSERT INTO user_currency (user_id, guild_id, balance)
     VALUES ($1, $2, 0)
     RETURNING *`,
        [userId, guildId]
    );

    return newResult.rows[0];
}

// Add currency to user
export async function addCurrency(
    userId: string,
    guildId: string,
    amount: number
): Promise<UserCurrency> {
    const result = await query<UserCurrency>(
        `INSERT INTO user_currency (user_id, guild_id, balance)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, guild_id) DO UPDATE SET balance = user_currency.balance + $3
     RETURNING *`,
        [userId, guildId, amount]
    );

    logger.debug(`Added ${amount} currency to user ${userId} in guild ${guildId}`);
    return result.rows[0];
}

// Remove currency from user (with check)
export async function removeCurrency(
    userId: string,
    guildId: string,
    amount: number
): Promise<UserCurrency | null> {
    const current = await getBalance(userId, guildId);

    if (current.balance < amount) {
        return null; // Insufficient funds
    }

    const result = await query<UserCurrency>(
        `UPDATE user_currency SET balance = balance - $3 
     WHERE user_id = $1 AND guild_id = $2
     RETURNING *`,
        [userId, guildId, amount]
    );

    logger.debug(`Removed ${amount} currency from user ${userId} in guild ${guildId}`);
    return result.rows[0];
}

// Transfer currency between users
export async function transferCurrency(
    fromUserId: string,
    toUserId: string,
    guildId: string,
    amount: number
): Promise<{ success: boolean; error?: string }> {
    if (amount <= 0) {
        return { success: false, error: 'Amount must be positive' };
    }

    const fromBalance = await getBalance(fromUserId, guildId);
    if (fromBalance.balance < amount) {
        return { success: false, error: 'Insufficient funds' };
    }

    // Perform transfer
    await removeCurrency(fromUserId, guildId, amount);
    await addCurrency(toUserId, guildId, amount);

    logger.debug(`Transferred ${amount} from ${fromUserId} to ${toUserId} in guild ${guildId}`);
    return { success: true };
}

// Claim daily reward
export async function claimDaily(
    userId: string,
    guildId: string
): Promise<{ success: boolean; amount?: number; nextClaim?: Date }> {
    const userData = await getBalance(userId, guildId);
    const now = new Date();

    if (userData.daily_claimed_at) {
        const nextClaim = new Date(userData.daily_claimed_at);
        nextClaim.setHours(nextClaim.getHours() + DAILY_COOLDOWN_HOURS);

        if (now < nextClaim) {
            return { success: false, nextClaim };
        }
    }

    // Grant daily
    await query(
        `UPDATE user_currency SET balance = balance + $3, daily_claimed_at = NOW()
     WHERE user_id = $1 AND guild_id = $2`,
        [userId, guildId, DAILY_AMOUNT]
    );

    return { success: true, amount: DAILY_AMOUNT };
}

// Get leaderboard
export async function getCurrencyLeaderboard(
    guildId: string,
    limit: number = 10
): Promise<UserCurrency[]> {
    const result = await query<UserCurrency>(
        `SELECT * FROM user_currency 
     WHERE guild_id = $1 
     ORDER BY balance DESC 
     LIMIT $2`,
        [guildId, limit]
    );

    return result.rows;
}

// Set balance (admin)
export async function setBalance(
    userId: string,
    guildId: string,
    amount: number
): Promise<UserCurrency> {
    const result = await query<UserCurrency>(
        `INSERT INTO user_currency (user_id, guild_id, balance)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, guild_id) DO UPDATE SET balance = $3
     RETURNING *`,
        [userId, guildId, Math.max(0, amount)]
    );

    return result.rows[0];
}
// Get global profile
export async function getGlobalProfile(userId: string): Promise<UserGlobal> {
    const result = await query<UserGlobal>(
        'SELECT * FROM users_global WHERE user_id = $1',
        [userId]
    );

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    // Create new entry
    const newResult = await query<UserGlobal>(
        `INSERT INTO users_global (user_id, global_xp, global_level, reputation, balance, total_earnings)
     VALUES ($1, 0, 1, 0, 0, 0)
     RETURNING *`,
        [userId]
    );

    return newResult.rows[0];
}

// Add global balance
export async function addGlobalBalance(
    userId: string,
    amount: number
): Promise<UserGlobal> {
    // Ensure profile exists
    await getGlobalProfile(userId);

    const result = await query<UserGlobal>(
        `UPDATE users_global 
     SET balance = balance + $2, total_earnings = total_earnings + GREATEST(0, $2)
     WHERE user_id = $1
     RETURNING *`,
        [userId, amount]
    );

    return result.rows[0];
}

// Transfer global balance
export async function transferGlobalBalance(
    fromUserId: string,
    toUserId: string,
    amount: number
): Promise<{ success: boolean; error?: string }> {
    if (amount <= 0) {
        return { success: false, error: 'Amount must be positive' };
    }

    const fromProfile = await getGlobalProfile(fromUserId);
    if (BigInt(fromProfile.balance) < BigInt(amount)) {
        return { success: false, error: 'Insufficient funds' };
    }

    // Perform transfer
    await addGlobalBalance(fromUserId, -amount);
    await addGlobalBalance(toUserId, amount);

    logger.debug(`Transferred global ${amount} from ${fromUserId} to ${toUserId}`);
    return { success: true };
}
