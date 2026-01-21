import { SlashCommandBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';
import { transferCurrency } from '../../services/economy.service.js';

export const payCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Send coins to another user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to pay')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of coins to send')
                .setRequired(true)
                .setMinValue(1)
        ),

    aliases: ['give', 'transfer'],
    module: 'economy',
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

        const targetUser = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getUser('user', true)
            : ctx.message?.mentions.users.first();

        const amount = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getInteger('amount', true)
            : parseInt(ctx.args[1] || '0', 10);

        if (!targetUser) {
            const embed = errorEmbed('Error', 'Please mention a user to pay!');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        if (targetUser.id === ctx.userId) {
            const embed = errorEmbed('Error', 'You can\'t pay yourself!');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        if (!amount || amount < 1) {
            const embed = errorEmbed('Error', 'Please enter a valid amount!');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        const result = await transferCurrency(ctx.userId, targetUser.id, ctx.guildId, amount);

        if (!result.success) {
            const embed = errorEmbed('Transfer Failed', result.error || 'An error occurred');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        const embed = successEmbed(
            '💸 Payment Sent!',
            `You sent **${amount.toLocaleString()}** coins to **${targetUser.displayName}**!`
        );

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
