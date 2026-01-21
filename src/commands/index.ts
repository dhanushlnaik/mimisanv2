import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { config, validateConfig } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Import all commands
import { pingCommand } from './utility/ping.js';
import { afkCommand } from './utility/afk.js';
import { avatarCommand } from './utility/avatar.js';
import { prefixCommand } from './utility/prefix.js';
import { helpCommand } from './utility/help.js';
import { avCommand } from './utility/av.js';
import { bhindiCommand } from './utility/bhindi.js';

import { actionCommands } from './actions/actions.js';
import { emotionCommands } from './actions/emotions.js';
import { generateCommand } from './fun/generators.js';

import { catCommand } from './fun/cat.js';
import { dogCommand } from './fun/dog.js';
import { memeCommand } from './fun/meme.js';
import { shipCommand } from './fun/ship.js';

import { rpsCommand } from './games/rps.js';
import { truthCommand } from './games/truth.js';
import { dareCommand } from './games/dare.js';
import { wyrCommand } from './games/wyr.js';

import { rankCommand } from './leveling/rank.js';
import { leaderboardCommand } from './leveling/leaderboard.js';

import { balanceCommand } from './economy/balance.js';
import { dailyCommand } from './economy/daily.js';
import { payCommand } from './economy/pay.js';

import type { Command, MimiClient } from '../client.js';

// All commands registry
export const commands: Command[] = [
    // Utility
    pingCommand,
    afkCommand,
    avatarCommand,
    prefixCommand,
    helpCommand,
    avCommand,
    bhindiCommand,

    // Actions & Emotions (Factory)
    ...actionCommands,
    ...emotionCommands,

    // Fun
    generateCommand,
    catCommand,
    dogCommand,
    memeCommand,
    shipCommand,

    // Games
    rpsCommand,
    truthCommand,
    dareCommand,
    wyrCommand,

    // Leveling
    rankCommand,
    leaderboardCommand,

    // Economy
    balanceCommand,
    dailyCommand,
    payCommand,
];

// Register commands with client
export function registerCommands(client: MimiClient): void {
    for (const command of commands) {
        client.registerCommand(command);
    }
    logger.info(`Registered ${commands.length} commands`);
}

// Deploy slash commands to Discord
export async function deployCommands(): Promise<void> {
    validateConfig();

    const rest = new REST({ version: '10' }).setToken(config.discordToken);
    const commandData: RESTPostAPIChatInputApplicationCommandsJSONBody[] = commands.map(
        (cmd) => cmd.data.toJSON() as RESTPostAPIChatInputApplicationCommandsJSONBody
    );

    try {
        logger.info(`Deploying ${commandData.length} slash commands...`);

        await rest.put(
            Routes.applicationCommands(config.discordClientId),
            { body: commandData }
        );

        logger.info('Successfully deployed slash commands!');
    } catch (error) {
        logger.error('Failed to deploy slash commands:', error);
        throw error;
    }
}

// Run if called directly
const isMainModule = process.argv.includes('--deploy');
if (isMainModule) {
    deployCommands()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
