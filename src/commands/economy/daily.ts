import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, errorEmbed, formatDuration } from '../../utils/embeds.js';
import { claimDaily } from '../../services/economy.service.js';

export const dailyCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coins!'),

    module: 'economy',
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

        const result = await claimDaily(ctx.userId, ctx.guildId);

        if (!result.success && result.nextClaim) {
            const timeLeft = result.nextClaim.getTime() - Date.now();
            const embed = new EmbedBuilder()
                .setColor(Colors.ERROR)
                .setTitle('⏰ Daily Already Claimed')
                .setDescription(`You've already claimed your daily coins today!`)
                .addFields(
                    { name: 'Next Claim', value: `In ${formatDuration(timeLeft)}`, inline: true }
                );

            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.SUCCESS)
            .setTitle('💰 Daily Claimed!')
            .setDescription(`You received **${result.amount?.toLocaleString()}** coins!`)
            .setFooter({ text: 'Come back tomorrow for more!' });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
