
import { pool } from '../src/database/index.js';
import { addCurrency, getBalance, getGlobalProfile, addGlobalBalance } from '../src/services/economy.service.js';
import { addXp, getUserLevel } from '../src/services/leveling.service.js';
import { enterDungeon } from '../src/services/dungeon.service.js';
import { playCasinoGame } from '../src/services/casino.service.js';
import { createListing, buyListing, getListings } from '../src/services/market.service.js';
import { equipRelic, getRelics, getUserRelicStats } from '../src/services/inventory.service.js';
import { createServerConfig } from '../src/services/config.service.js';
import { logger } from '../src/utils/logger.js';

// Mock logger to avoid clutter
logger.info = console.log;
logger.debug = () => { };
logger.error = console.error;

async function runSimulation() {
    console.log('🚀 Starting Economy Simulation...');

    const GUILD_ID = '836096483803136001';
    const ADMIN_ID = '624174437821972480';
    const USER_A = '624174437821972480';
    const USER_B = '826073652440858634';

    try {
        // 0. Setup
        console.log('\n--- 0. Setup ---');
        // Ensure guild_settings exists
        await pool.query(
            `INSERT INTO guild_settings (guild_id, prefix) VALUES ($1, '!') ON CONFLICT (guild_id) DO NOTHING`,
            [GUILD_ID]
        );

        // Ensure guild config
        await createServerConfig(GUILD_ID);

        // Ensure global profiles
        await getGlobalProfile(USER_A);
        await getGlobalProfile(USER_B);
        await getGlobalProfile(ADMIN_ID);
        // Clear previous runs (Optional, but good for clean state if needed. Skipping to preserve history or just append)
        // For this test, we'll just append.

        // 1. Economy & Leveling
        console.log('\n--- 1. Economy & Leveling ---');
        await addCurrency(USER_A, GUILD_ID, 1000);
        console.log(`Give 1000 coins to User A`);

        await addXp(USER_A, GUILD_ID, 150);
        const levelA = await getUserLevel(USER_A, GUILD_ID);
        console.log(`User A Level: ${levelA.level}, XP: ${levelA.xp}`);

        const balanceA = await getBalance(USER_A, GUILD_ID);
        console.log(`User A Balance: ${balanceA.balance}`);

        // 2. Casino
        console.log('\n--- 2. Casino ---');
        const flip = await playCasinoGame(USER_A, GUILD_ID, 'coinflip', 100, 'heads');
        console.log(`Coinflip Result: ${flip.won ? 'WIN' : 'LOSS'} (${flip.payout} coins)`);

        const slots = await playCasinoGame(USER_A, GUILD_ID, 'slots', 50);
        console.log(`Slots Result: ${slots.won ? 'WIN' : 'LOSS'} (${slots.payout} coins)`);

        // 3. Dungeon
        console.log('\n--- 3. Dungeon ---');
        // Give enough money for E-rank (100 fee)
        await addCurrency(USER_A, GUILD_ID, 500);

        const dungeon = await enterDungeon(USER_A, GUILD_ID, 'E');
        if (dungeon.success) {
            console.log(`Dungeon E-Rank: ${dungeon.result.outcome.toUpperCase()}`);
            if (dungeon.result.outcome === 'win') {
                console.log(`Rewards: ${dungeon.result.rewards.coins} coins, ${dungeon.result.rewards.xp} XP`);
                if (dungeon.result.rewards.relic) {
                    console.log(`🎉 RELIC DROP: ${dungeon.result.rewards.relic.name}`);
                }
            }
        } else {
            console.error('Dungeon Error:', dungeon.error);
        }

        // 4. Inventory & Equipment
        console.log('\n--- 4. Inventory ---');
        // Force inject a relic for User A to test market
        await pool.query(
            `INSERT INTO relics (owner_id, name, rarity, stats, source)
             VALUES ($1, 'Test Sword', 'common', '{"dungeon_bonus": 10}', 'admin')`,
            [USER_A]
        );
        console.log('Granted "Test Sword" to User A');

        const relicsA = await getRelics(USER_A);
        console.log(`User A Relics: ${relicsA.length}`);

        if (relicsA.length > 0) {
            const relicId = relicsA[0].id;
            const equipRes = await equipRelic(USER_A, relicId);
            console.log(`Equip Relic ${relicId}: ${equipRes.success ? 'Success' : equipRes.error}`);

            const stats = await getUserRelicStats(USER_A);
            console.log('Active Stats:', stats);
        }

        // 5. Marketplace
        console.log('\n--- 5. Marketplace ---');
        // We need an unequipped relic to sell
        // Let's create another one
        const relicRes = await pool.query(
            `INSERT INTO relics (owner_id, name, rarity, stats, source)
             VALUES ($1, 'Market Item', 'rare', '{"salary_mult": 1.2}', 'admin')
             RETURNING id`,
            [USER_A]
        );
        const sellRelicId = relicRes.rows[0].id;
        console.log(`Granted "Market Item" (ID: ${sellRelicId}) to User A`);

        // List it
        const listRes = await createListing(USER_A, GUILD_ID, sellRelicId, 500);
        if (listRes.success) {
            console.log(`Listed Item ID ${sellRelicId} for 500 coins. Listing ID: ${listRes.listingId}`);

            // User B buys it
            await addCurrency(USER_B, GUILD_ID, 1000); // Give B money
            console.log('User B buying item...');

            const buyRes = await buyListing(USER_B, GUILD_ID, listRes.listingId!);
            if (buyRes.success) {
                console.log(`✅ User B successfully bought item: ${buyRes.item.name}`);
            } else {
                console.error(`❌ Buy Failed: ${buyRes.error}`);
            }

        } else {
            console.error(`❌ List Failed: ${listRes.error}`);
        }

        // 6. Global Profile
        console.log('\n--- 6. Global Profile ---');
        await addGlobalBalance(USER_A, 50);
        const globalA = await getGlobalProfile(USER_A);
        console.log(`Global User A: Level ${globalA.global_level}, Balance ${globalA.balance}`);

    } catch (e) {
        console.error('Simulation Failed:', e);
    } finally {
        await pool.end();
        console.log('\nSimulation Complete.');
    }
}

runSimulation();
