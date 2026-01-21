import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, errorEmbed } from '../../utils/embeds.js';
import { getLeaderboard } from '../../services/leveling.service.js';

export const leaderboardCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the server XP leaderboard')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Leaderboard type')
                .setRequired(false)
                .addChoices(
                    { name: 'XP', value: 'xp' },
                    { name: 'Currency', value: 'currency' }
                )
        ),

    aliases: ['lb', 'top'],
    module: 'leveling',
    cooldown: 10,
    guildOnly: true,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        if (!ctx.guildId) {
            const embed = errorEmbed('Error', 'This command can only be used in a server.');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        const leaderboard = await getLeaderboard(ctx.guildId, 10);

        if (leaderboard.length === 0) {
            const embed = errorEmbed('No Data', 'No one has earned XP yet!');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed] });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        const lines: string[] = [];

        for (let i = 0; i < leaderboard.length; i++) {
            const entry = leaderboard[i];
            const medal = i < 3 ? medals[i] : `\`${i + 1}.\``;

            try {
                const user = await client.users.fetch(entry.user_id);
                lines.push(`${medal} **${user.displayName}** - Level ${entry.level} (${entry.xp} XP)`);
            } catch {
                lines.push(`${medal} Unknown User - Level ${entry.level} (${entry.xp} XP)`);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('🏆 XP Leaderboard')
            .setDescription(lines.join('\n'))
            .setFooter({ text: `Top ${leaderboard.length} members` })
            .setTimestamp();

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
