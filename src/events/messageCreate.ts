import { type Message, type TextChannel } from 'discord.js';
import type { MimiClient, CommandContext } from '../client.js';
import { logger } from '../utils/logger.js';
import { getGuildSettings, isModuleEnabled } from '../services/guild.service.js';
import { getServerConfig } from '../services/config.service.js';
import { getAfk, clearAfk, getAfkUsers } from '../services/afk.service.js';
import { addXp, addGlobalXp } from '../services/leveling.service.js';
import { checkCooldown } from '../utils/cooldown.js';
import { checkPermissions, getMemberFromContext } from '../utils/permissions.js';
import { afkEmbed, levelUpEmbed } from '../utils/embeds.js';

export async function messageCreate(client: MimiClient, message: Message): Promise<void> {
    // Ignore bots
    if (message.author.bot) return;

    // Handle DMs differently
    if (!message.guild) {
        return handleDM(message);
    }

    const guildId = message.guild.id;

    try {
        // Get guild settings
        const settings = await getGuildSettings(guildId);

        // Handle AFK system
        await handleAfkSystem(client, message, settings.afk_enabled);

        // Handle leveling
        if (settings.leveling_enabled) {
            await handleLeveling(message);
        }

        // Check for command
        const prefix = settings.prefix;
        const mentionPrefix = `<@${client.user?.id}>`;
        const mentionPrefixNick = `<@!${client.user?.id}>`;

        let usedPrefix: string | null = null;

        if (message.content.startsWith(prefix)) {
            usedPrefix = prefix;
        } else if (message.content.startsWith(mentionPrefix)) {
            usedPrefix = mentionPrefix;
        } else if (message.content.startsWith(mentionPrefixNick)) {
            usedPrefix = mentionPrefixNick;
        }

        if (!usedPrefix) return;

        // Parse command and args
        const content = message.content.slice(usedPrefix.length).trim();
        const args = content.split(/\s+/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        // Find command
        const command = client.getCommand(commandName);
        if (!command) return;

        // Check if module is enabled
        const moduleEnabled = await isModuleEnabled(guildId, command.module);
        if (!moduleEnabled) return;

        // Build context
        const ctx: CommandContext = {
            isSlash: false,
            message,
            args,
            guildId,
            userId: message.author.id,
            prefix,
        };

        // Check permissions
        const member = getMemberFromContext(ctx);
        if (!(await checkPermissions(command, ctx, member))) return;

        // Check cooldown
        if (!(await checkCooldown(client, command, ctx))) return;

        // Execute command
        logger.debug(`Message command: ${commandName} by ${message.author.tag}`);
        await command.execute(ctx, client);

    } catch (error) {
        logger.error('Error in messageCreate:', error);
    }
}

async function handleDM(message: Message): Promise<void> {
    // Basic DM handling - could add help or info commands here
    if (message.content.toLowerCase() === 'help') {
        await message.reply('👋 Thanks for messaging me! Use `/help` in a server to see my commands.');
    }
}

async function handleAfkSystem(client: MimiClient, message: Message, afkEnabled: boolean): Promise<void> {
    if (!afkEnabled || !message.guild) return;

    // Check if author was AFK and clear it
    const authorAfk = await getAfk(message.author.id);
    if (authorAfk) {
        await clearAfk(message.author.id);
        await message.reply({
            content: `Welcome back! I've removed your AFK status.`,
            allowedMentions: { repliedUser: false },
        });
    }

    // Check mentions for AFK users
    const mentionedUsers = message.mentions.users;
    if (mentionedUsers.size === 0) return;

    const mentionedIds = [...mentionedUsers.keys()];
    const afkUsers = await getAfkUsers(mentionedIds);

    for (const afkUser of afkUsers) {
        const user = await client.users.fetch(afkUser.user_id);
        const embed = afkEmbed(user, afkUser.reason, afkUser.since);
        if ('send' in message.channel) {
            await (message.channel as TextChannel).send({ embeds: [embed] });
        }
    }
}

async function handleLeveling(message: Message): Promise<void> {
    if (!message.guild) return;

    const config = await getServerConfig(message.guild.id);

    // Check channel rules
    if (config.xp_channels.length > 0) {
        const inList = config.xp_channels.includes(message.channel.id);
        if (config.xp_channel_mode === 'whitelist' && !inList) return;
        if (config.xp_channel_mode === 'blacklist' && inList) return;
    }

    // Calculate XP
    const baseXp = Math.floor(Math.random() * 10) + 15; // 15-25
    const xpAmount = Math.floor(baseXp * config.xp_rate_chat);

    // Add Server XP
    const result = await addXp(message.author.id, message.guild.id, xpAmount);

    if (result?.leveledUp) {
        const embed = levelUpEmbed(message.author, result.newLevel);
        if ('send' in message.channel) {
            await (message.channel as TextChannel).send({ embeds: [embed] });
        }
    }

    // Add Global XP (Fixed rate)
    try {
        const globalResult = await addGlobalXp(message.author.id, baseXp);
        if (globalResult.leveledUp) {
            // Optional: Send global level up message?
            // For now, only log it to avoid spam or add a small reaction
            logger.debug(`User ${message.author.id} leveled up globally to ${globalResult.newLevel}`);
        }
    } catch (error) {
        logger.error('Failed to add global XP:', error);
    }
}
