import { addXp, addGlobalXp } from './leveling.service.js';
import { getServerConfig } from './config.service.js';
import { logger } from '../utils/logger.js';

// User ID -> { Guild ID, Last Check Time }
const activeVoiceUsers = new Map<string, { guildId: string, lastCheck: number }>();

export function onVoiceJoin(userId: string, guildId: string) {
    if (activeVoiceUsers.has(userId)) return;
    activeVoiceUsers.set(userId, { guildId, lastCheck: Date.now() });
    logger.debug(`User ${userId} started earning VC XP in ${guildId}`);
}

export function onVoiceLeave(userId: string) {
    if (activeVoiceUsers.has(userId)) {
        activeVoiceUsers.delete(userId);
        logger.debug(`User ${userId} stopped earning VC XP`);
    }
}

// Check every minute
export async function processVoiceXp() {
    const now = Date.now();
    logger.debug(`Processing VC XP for ${activeVoiceUsers.size} users`);

    for (const [userId, data] of activeVoiceUsers) {
        try {
            // Check config
            const config = await getServerConfig(data.guildId);

            // Base XP per minute
            const baseXp = 10;
            const xpAmount = Math.floor(baseXp * config.xp_rate_vc);

            // Add server XP
            await addXp(userId, data.guildId, xpAmount);

            // Add global XP
            await addGlobalXp(userId, baseXp);

            // Update last check
            data.lastCheck = now;

        } catch (error) {
            logger.error(`Error processing VC XP for ${userId}:`, error);
        }
    }
}
