import { Events } from 'discord.js';
import { MimiClient } from './client.js';
import { config, validateConfig } from './config/index.js';
import { connectDatabase } from './database/index.js';
import { logger } from './utils/logger.js';
import { registerCommands } from './commands/index.js';
import { ready } from './events/ready.js';
import { messageCreate } from './events/messageCreate.js';
import { interactionCreate } from './events/interactionCreate.js';

async function main(): Promise<void> {
    try {
        // Validate configuration
        validateConfig();
        logger.info('Configuration validated');

        // Connect to database
        await connectDatabase();
        logger.info('Database connected');

        // Create client
        const client = new MimiClient();

        // Register commands
        registerCommands(client);

        // Register events
        client.once(Events.ClientReady, () => ready(client));
        client.on(Events.MessageCreate, (message) => messageCreate(client, message));
        client.on(Events.InteractionCreate, (interaction) => interactionCreate(client, interaction));

        // Handle guild join - create settings
        client.on(Events.GuildCreate, async (guild) => {
            logger.info(`Joined new guild: ${guild.name} (${guild.id})`);
            // Guild settings will be created on first command use
        });

        // Handle errors
        client.on(Events.Error, (error) => {
            logger.error('Discord client error:', error);
        });

        client.on(Events.Warn, (warning) => {
            logger.warn('Discord client warning:', warning);
        });

        // Login
        await client.login(config.discordToken);
        logger.info('Bot logged in successfully');

    } catch (error) {
        logger.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Handle process errors
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down...');
    process.exit(0);
});

// Start the bot
main();
