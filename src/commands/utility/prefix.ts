import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../utils/embeds.js';
import { updatePrefix, getGuildSettings } from '../../services/guild.service.js';

export const prefixCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('View or change the server prefix')
        .addStringOption(option =>
            option
                .setName('new_prefix')
                .setDescription('The new prefix to set')
                .setRequired(false)
                .setMaxLength(10)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    aliases: ['setprefix'],
    module: 'utility',
    guildOnly: true,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        if (!ctx.guildId) {
            const embed = errorEmbed('Error', 'This command can only be used in a server.');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        let newPrefix: string | null = null;

        if (ctx.isSlash && ctx.interaction) {
            newPrefix = ctx.interaction.options.getString('new_prefix');
        } else if (ctx.args.length > 0) {
            newPrefix = ctx.args[0];
        }

        // If no new prefix, show current
        if (!newPrefix) {
            const settings = await getGuildSettings(ctx.guildId);
            const embed = infoEmbed('Server Prefix', `The current prefix is: \`${settings.prefix}\``);

            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed] });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        // Validate prefix
        if (newPrefix.length > 10) {
            const embed = errorEmbed('Invalid Prefix', 'Prefix must be 10 characters or less.');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        // Update prefix
        await updatePrefix(ctx.guildId, newPrefix);
        const embed = successEmbed('Prefix Updated', `Server prefix has been changed to: \`${newPrefix}\``);

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
