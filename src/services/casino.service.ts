import { query } from '../database/index.js';
import { removeCurrency, addCurrency } from './economy.service.js';
import { rollRelic } from './inventory.service.js';
import { getServerConfig } from './config.service.js';

export type CasinoGameType = 'coinflip' | 'slots' | 'blackjack' | 'roulette';

export interface CasinoResult {
    success: boolean;
    won: boolean;
    payout: number;
    error?: string;
    relic?: any;
    meta?: any;
}

export async function playCasinoGame(
    userId: string,
    guildId: string,
    game: CasinoGameType,
    bet: number,
    choice?: string
): Promise<CasinoResult> {
    const config = await getServerConfig(guildId);
    if (!config.casino_enabled) return { success: false, won: false, payout: 0, error: 'Casino is disabled.' };

    if (bet <= 0) return { success: false, won: false, payout: 0, error: 'Bet must be positive.' };

    const removed = await removeCurrency(userId, guildId, bet);
    if (!removed) return { success: false, won: false, payout: 0, error: 'Insufficient funds.' };

    let won = false;
    let payout = 0;
    let meta: any = {};

    if (game === 'coinflip') {
        const roll = Math.random() < 0.5 ? 'heads' : 'tails';
        meta = { roll, choice };
        if (choice && choice.toLowerCase() === roll) {
            won = true;
            payout = Math.floor(bet * 2);
        }
    } else if (game === 'slots') {
        // Simple slot logic
        const icons = ['A', 'B', 'C', 'D', '7']; // Using letters/numbers to avoid potential emoji issues in tools
        // A=Cherry, B=Lemon, C=Grape, D=Diamond, 7=7
        const r1 = icons[Math.floor(Math.random() * icons.length)];
        const r2 = icons[Math.floor(Math.random() * icons.length)];
        const r3 = icons[Math.floor(Math.random() * icons.length)];
        meta = { slots: [r1, r2, r3] };

        if (r1 === r2 && r2 === r3) {
            won = true;
            // Jackpot
            if (r1 === '7') payout = bet * 10;
            else if (r1 === 'D') payout = bet * 5;
            else payout = bet * 3;
        } else if (r1 === r2 || r2 === r3 || r1 === r3) {
            won = true;
            payout = Math.floor(bet * 1.5);
        }
    }

    // Relic Drop Chance
    let relic = null;
    if (won && Math.random() < 0.05) {
        relic = rollRelic('S');
        if (relic) {
            await query(
                `INSERT INTO relics (owner_id, name, rarity, stats, source)
                  VALUES ($1, $2, $3, $4, 'casino')`,
                [userId, relic.name, relic.rarity, relic.stats]
            );
        }
    }

    if (won && payout > 0) {
        await addCurrency(userId, guildId, payout);
    }

    await query(
        `INSERT INTO casino_games (user_id, guild_id, game_type, bet_amount, outcome, payout, played_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, guildId, game, bet, won ? 'win' : 'loss', payout]
    );

    return { success: true, won, payout, meta, relic };
}
