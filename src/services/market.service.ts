import { query } from '../database/index.js';
import { removeCurrency, addCurrency } from './economy.service.js';
import { getServerConfig } from './config.service.js';


export interface MarketListing {
    id: number;
    seller_id: string;
    buyer_id: string | null;
    relic_id: number;
    price: number;
    guild_id: string;
    status: 'active' | 'sold' | 'cancelled';
    listed_at: Date;
    sold_at: Date | null;
    relic_name?: string; // joined
    relic_rarity?: string; // joined
}

export async function createListing(
    userId: string,
    guildId: string,
    relicId: number,
    price: number
): Promise<{ success: boolean; listingId?: number; error?: string }> {
    if (price <= 0) return { success: false, error: 'Price must be positive.' };

    const config = await getServerConfig(guildId);
    if (!config.market_enabled) return { success: false, error: 'Marketplace is disabled.' };

    // Check ownership and not equipped
    const relic = await query(
        `SELECT * FROM relics WHERE id = $1 AND owner_id = $2`,
        [relicId, userId]
    );

    if (relic.rows.length === 0) return { success: false, error: 'Relic not found or not owned.' };
    if (relic.rows[0].is_equipped) return { success: false, error: 'Cannot sell equipped relic.' };

    // Check if already listed
    const existing = await query(
        `SELECT id FROM market_listings WHERE relic_id = $1 AND status = 'active'`,
        [relicId]
    );
    if (existing.rows.length > 0) return { success: false, error: 'Relic already listed.' };

    // Create listing
    const result = await query(
        `INSERT INTO market_listings (seller_id, relic_id, price, guild_id, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id`,
        [userId, relicId, price, guildId]
    );

    return { success: true, listingId: result.rows[0].id };
}

export async function buyListing(
    buyerId: string,
    guildId: string,
    listingId: number
): Promise<{ success: boolean; error?: string; item?: any }> {
    // Get listing
    const listingRes = await query(
        `SELECT * FROM market_listings WHERE id = $1 AND guild_id = $2 AND status = 'active'`,
        [listingId, guildId]
    );

    if (listingRes.rows.length === 0) return { success: false, error: 'Listing not found or active.' };
    const listing = listingRes.rows[0];

    if (listing.seller_id === buyerId) return { success: false, error: 'Cannot buy your own listing.' };

    // Check Buyer Balance
    const removed = await removeCurrency(buyerId, guildId, listing.price);
    if (!removed) return { success: false, error: 'Insufficient funds.' };

    // Give Seller Money
    await addCurrency(listing.seller_id, guildId, listing.price);

    // Update Listing
    await query(
        `UPDATE market_listings 
         SET status = 'sold', buyer_id = $1, sold_at = NOW()
         WHERE id = $2`,
        [buyerId, listingId]
    );

    // Transfer Relic Ownership
    await query(
        `UPDATE relics SET owner_id = $1 WHERE id = $2`,
        [buyerId, listing.relic_id]
    );

    // Get Relic info for return
    const relicRes = await query(`SELECT * FROM relics WHERE id = $1`, [listing.relic_id]);

    return { success: true, item: relicRes.rows[0] };
}

export async function cancelListing(
    userId: string,
    listingId: number
): Promise<{ success: boolean; error?: string }> {
    const result = await query(
        `UPDATE market_listings 
         SET status = 'cancelled'
         WHERE id = $1 AND seller_id = $2 AND status = 'active'`,
        [listingId, userId]
    );

    if ((result.rowCount || 0) === 0) return { success: false, error: 'Listing not found or not active.' };
    return { success: true };
}

export async function getListings(guildId: string, page: number = 1, limit: number = 10): Promise<{ listings: MarketListing[]; total: number }> {
    const offset = (page - 1) * limit;

    const countRes = await query(
        `SELECT COUNT(*) as total FROM market_listings WHERE guild_id = $1 AND status = 'active'`,
        [guildId]
    );
    const total = parseInt(countRes.rows[0].total as any);

    const result = await query<MarketListing>(
        `SELECT ml.*, r.name as relic_name, r.rarity as relic_rarity 
         FROM market_listings ml
         JOIN relics r ON ml.relic_id = r.id
         WHERE ml.guild_id = $1 AND ml.status = 'active'
         ORDER BY ml.listed_at DESC
         LIMIT $2 OFFSET $3`,
        [guildId, limit, offset]
    );

    return { listings: result.rows, total };
}
