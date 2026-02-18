import { query } from '../database/index.js';

export interface RelicStats {
    salary_mult?: number;
    xp_mult?: number;
    dungeon_bonus?: number;
}

export interface Relic {
    id: number;
    owner_id: string;
    name: string;
    rarity: string;
    stats: RelicStats;
    is_equipped: boolean;
    source: string;
    obtained_at: Date;
}

export async function getUserRelicStats(userId: string): Promise<RelicStats> {
    const defaultStats: RelicStats = { salary_mult: 1.0, xp_mult: 1.0, dungeon_bonus: 0 };

    // Get equipped relics
    const result = await query<{ stats: RelicStats }>(
        `SELECT stats FROM relics 
         WHERE owner_id = $1 AND is_equipped = true`,
        [userId]
    );

    for (const row of result.rows) {
        const stats = row.stats as any;

        // Multiplicative bonuses for multipliers
        if (stats.salary_mult) defaultStats.salary_mult = (defaultStats.salary_mult || 1.0) * stats.salary_mult;
        if (stats.xp_mult) defaultStats.xp_mult = (defaultStats.xp_mult || 1.0) * stats.xp_mult;

        // Additive bonus for flat values
        if (stats.dungeon_bonus) defaultStats.dungeon_bonus = (defaultStats.dungeon_bonus || 0) + stats.dungeon_bonus;
    }

    return defaultStats;
}

// Generate random relic (stub)
export function rollRelic(rank: string): any | null {
    // 10% chance to drop relic
    if (Math.random() > 0.1) return null;

    return {
        name: `Ancient Ring of ${rank}`,
        rarity: 'common',
        stats: { salary_mult: 1.05 }
    };
}

export async function getRelics(userId: string): Promise<Relic[]> {
    const result = await query<Relic>(
        `SELECT * FROM relics WHERE owner_id = $1 ORDER BY is_equipped DESC, obtained_at DESC`,
        [userId]
    );
    return result.rows;
}

export async function equipRelic(userId: string, relicId: number): Promise<{ success: boolean; error?: string }> {
    // Check if owned
    const result = await query<Relic>(
        `SELECT * FROM relics WHERE id = $1 AND owner_id = $2`,
        [relicId, userId]
    );
    if (result.rows.length === 0) return { success: false, error: 'Relic not found' };

    if (result.rows[0].is_equipped) return { success: false, error: 'Already equipped' };

    // Max equipped limit (3)
    const equipped = await query(
        `SELECT COUNT(*) as count FROM relics WHERE owner_id = $1 AND is_equipped = true`,
        [userId]
    );

    // safe parsing
    const count = parseInt(equipped.rows[0].count as any);

    if (count >= 3) {
        return { success: false, error: 'Max 3 relics equipped' };
    }

    await query(
        `UPDATE relics SET is_equipped = true WHERE id = $1`,
        [relicId]
    );
    return { success: true };
}

export async function unequipRelic(userId: string, relicId: number): Promise<{ success: boolean; error?: string }> {
    const result = await query(
        `UPDATE relics SET is_equipped = false WHERE id = $1 AND owner_id = $2 RETURNING id`,
        [relicId, userId]
    );
    if (result.rows.length === 0) return { success: false, error: 'Relic not found or not owned' };
    return { success: true };
}
