import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, errorEmbed } from '../../utils/embeds.js';
import { getBalance } from '../../services/economy.service.js';

export const balanceCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your balance or another user\'s balance')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to check')
                .setRequired(false)
        ),

    aliases: ['bal', 'money', 'coins'],
    module: 'economy',
    cooldown: 3,
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

        const currency = await getBalance(targetUser.id, ctx.guildId);

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle(`💰 ${targetUser.displayName}'s Balance`)
            .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
            .addFields(
                { name: '💵 Coins', value: `${currency.balance.toLocaleString()}`, inline: true }
            )
            .setFooter({ text: 'Use /daily to claim your daily coins!' });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
