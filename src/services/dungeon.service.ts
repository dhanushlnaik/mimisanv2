import { query } from '../database/index.js';
import { removeCurrency, addCurrency } from './economy.service.js';
import { addXp } from './leveling.service.js';
import { getUserRelicStats, rollRelic } from './inventory.service.js';

// Dungeon configurations
const DUNGEON_CONFIG: Record<string, { fee: number, difficulty: number, minLevel: number }> = {
    'E': { fee: 100, difficulty: 10, minLevel: 1 },
    'C': { fee: 500, difficulty: 25, minLevel: 10 },
    'B': { fee: 1500, difficulty: 50, minLevel: 25 },
    'A': { fee: 5000, difficulty: 100, minLevel: 50 },
    'S': { fee: 10000, difficulty: 250, minLevel: 80 }
};

export async function enterDungeon(
    userId: string,
    guildId: string,
    rank: string
): Promise<{ success: boolean; result?: any; error?: string }> {
    const config = DUNGEON_CONFIG[rank];
    if (!config) return { success: false, error: 'Invalid rank' };

    // Check entry fee
    const removed = await removeCurrency(userId, guildId, config.fee);
    if (!removed) return { success: false, error: 'Insufficient funds' };

    // Get stats
    const relicStats = await getUserRelicStats(userId);
    // const serverConfig = await getServerConfig(guildId); // Unused for now

    // User power logic?
    // Usually based on stats. Here we rely on relic bonus + pure RNG + maybe user level?
    // PRD: "Dungeon difficulty modifiers" (Server scaling).

    // Calculate Win Chance
    // Base 50%?
    let winChance = 0.5;

    // Bonus from relics
    winChance += ((relicStats.dungeon_bonus || 0) / 100);

    // Penalty from server difficulty (1.0 = normal, 1.5 = harder)
    // If harder, win chance should decrease.
    // winChance /= serverConfig.dungeon_difficulty;

    // Roll
    const roll = Math.random();
    const isWin = roll < winChance;

    // Log run
    await query(
        `INSERT INTO dungeon_runs (user_id, guild_id, rank, status, started_at, completed_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [userId, guildId, rank, isWin ? 'completed' : 'failed']
    );

    if (isWin) {
        // Drop rewards
        const xpReward = Math.floor(config.fee * 0.5); // 50% of fee as XP? + Multiplier
        const coinReward = Math.floor(config.fee * 1.5); // 150% of fee back? Profit 50%.

        // Relic drop
        const relic = rollRelic(rank);
        if (relic) {
            // Save relic to DB
            await query(
                `INSERT INTO relics (owner_id, name, rarity, stats, source)
                 VALUES ($1, $2, $3, $4, 'dungeon')`,
                [userId, relic.name, relic.rarity, relic.stats]
            );
        }

        // Add rewards
        await addCurrency(userId, guildId, coinReward);
        await addXp(userId, guildId, xpReward);

        return {
            success: true,
            result: {
                outcome: 'win',
                rewards: { coins: coinReward, xp: xpReward, relic }
            }
        };
    } else {
        return {
            success: true,
            result: {
                outcome: 'loss',
                loss: config.fee
            }
        };
    }
}
