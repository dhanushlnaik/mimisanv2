import { type Interaction } from 'discord.js';
import type { MimiClient, CommandContext } from '../client.js';
import { logger } from '../utils/logger.js';
import { getGuildSettings, isModuleEnabled } from '../services/guild.service.js';
import { checkCooldown } from '../utils/cooldown.js';
import { checkPermissions, getMemberFromContext } from '../utils/permissions.js';
import { errorEmbed } from '../utils/embeds.js';

export async function interactionCreate(client: MimiClient, interaction: Interaction): Promise<void> {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(client, interaction);
        return;
    }

    // Handle buttons
    if (interaction.isButton()) {
        await handleButton(interaction);
        return;
    }

    // Handle select menus
    if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
        return;
    }

    // Handle autocomplete
    if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction);
        return;
    }
}

async function handleSlashCommand(
    client: MimiClient,
    interaction: Interaction
): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName;
    const command = client.commands.get(commandName);

    if (!command) {
        await interaction.reply({
            embeds: [errorEmbed('Unknown Command', 'This command no longer exists.')],
            ephemeral: true,
        });
        return;
    }

    try {
        // Check if module is enabled (for guild commands)
        if (interaction.guildId) {
            const moduleEnabled = await isModuleEnabled(interaction.guildId, command.module);
            if (!moduleEnabled) {
                await interaction.reply({
                    embeds: [errorEmbed('Module Disabled', `The \`${command.module}\` module is disabled in this server.`)],
                    ephemeral: true,
                });
                return;
            }
        }

        // Get guild settings for prefix (used in context)
        const settings = interaction.guildId
            ? await getGuildSettings(interaction.guildId)
            : { prefix: '!' };

        // Build context
        const ctx: CommandContext = {
            isSlash: true,
            interaction,
            args: [],
            guildId: interaction.guildId,
            userId: interaction.user.id,
            prefix: settings.prefix,
        };

        // Check permissions
        const member = getMemberFromContext(ctx);
        if (!(await checkPermissions(command, ctx, member))) return;

        // Check cooldown
        if (!(await checkCooldown(client, command, ctx))) return;

        // Execute command
        logger.debug(`Slash command: ${commandName} by ${interaction.user.tag}`);
        await command.execute(ctx, client);

    } catch (error) {
        logger.error(`Error executing command ${commandName}:`, error);

        const errorResponse = {
            embeds: [errorEmbed('Command Error', 'An error occurred while executing this command.')],
            ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorResponse);
        } else {
            await interaction.reply(errorResponse);
        }
    }
}

async function handleButton(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;

    const [action, ..._params] = interaction.customId.split(':');
    logger.debug(`Button: ${action} by ${interaction.user.tag}`);

    // Handle different button actions
    switch (action) {
        case 'todo_complete':
            // TODO: Implement todo completion
            break;
        case 'confirm':
        case 'cancel':
            // Generic confirm/cancel handling
            break;
        default:
            logger.warn(`Unknown button action: ${action}`);
    }
}

async function handleSelectMenu(interaction: Interaction): Promise<void> {
    if (!interaction.isStringSelectMenu()) return;

    const [action] = interaction.customId.split(':');
    logger.debug(`Select menu: ${action} by ${interaction.user.tag}`);

    // Handle select menu actions
}

async function handleAutocomplete(interaction: Interaction): Promise<void> {
    if (!interaction.isAutocomplete()) return;

    // Commands can implement their own autocomplete logic
    // For now, just return empty
    await interaction.respond([]);
}
