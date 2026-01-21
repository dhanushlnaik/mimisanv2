import type { MimiClient } from '../client.js';
import { logger } from '../utils/logger.js';

export async function ready(client: MimiClient): Promise<void> {
    logger.info(`🤖 ${client.user?.tag} is online!`);
    logger.info(`📊 Serving ${client.guilds.cache.size} guilds`);
    logger.info(`📝 Loaded ${client.commands.size} commands`);

    // Set presence
    client.user?.setPresence({
        status: 'online',
        activities: [
            {
                name: '/help | mimisan.bot',
                type: 3, // Watching
            },
        ],
    });
}
