import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, progressBar, errorEmbed } from '../../utils/embeds.js';
import { getUserLevel, getUserRank, xpForLevel } from '../../services/leveling.service.js';

export const rankCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your rank or another user\'s rank')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to check')
                .setRequired(false)
        ),

    aliases: ['level', 'xp'],
    module: 'leveling',
    cooldown: 5,
    guildOnly: true,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        if (!ctx.guildId) {
            const embed = errorEmbed('Error', 'This command can only be used in a server.');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        let targetUser = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getUser('user')
            : ctx.message?.mentions.users.first();

        if (!targetUser) {
            targetUser = ctx.isSlash && ctx.interaction
                ? ctx.interaction.user
                : ctx.message?.author;
        }

        if (!targetUser) return;

        const levelData = await getUserLevel(targetUser.id, ctx.guildId);
        const rank = await getUserRank(targetUser.id, ctx.guildId);
        const xpNeeded = xpForLevel(levelData.level);
        const progress = (levelData.xp / xpNeeded) * 100;

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle(`📊 ${targetUser.displayName}'s Rank`)
            .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'Rank', value: `#${rank}`, inline: true },
                { name: 'Level', value: `${levelData.level}`, inline: true },
                { name: 'XP', value: `${levelData.xp}/${xpNeeded}`, inline: true },
                { name: 'Progress', value: `${progressBar(levelData.xp, xpNeeded, 15)} ${progress.toFixed(1)}%`, inline: false }
            );

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
