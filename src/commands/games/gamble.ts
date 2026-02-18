import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { playCasinoGame } from '../../services/casino.service.js';
import { logger } from '../../utils/logger.js';

export const gambleCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('Play casino games')
        .addSubcommand(sub =>
            sub.setName('coinflip')
                .setDescription('Flip a coin')
                .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true))
                .addStringOption(opt => opt.setName('side').setDescription('Heads or Tails').setRequired(true).addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' }))
        )
        .addSubcommand(sub =>
            sub.setName('slots')
                .setDescription('Spin the slots')
                .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true))
        ) as any,
    module: 'games',
    execute: async (ctx: CommandContext, client: MimiClient) => {
        if (!ctx.isSlash || !ctx.interaction) return;

        const subcommand = ctx.interaction.options.getSubcommand();
        const bet = ctx.interaction.options.getInteger('bet', true);

        await ctx.interaction.deferReply();

        try {
            if (subcommand === 'coinflip') {
                const side = ctx.interaction.options.getString('side', true);
                const result = await playCasinoGame(ctx.userId, ctx.guildId!, 'coinflip', bet, side);

                if (!result.success) {
                    await ctx.interaction.editReply(`❌ Error: ${result.error}`);
                    return;
                }

                const roll = result.meta.roll;
                const embed = new EmbedBuilder()
                    .setTitle('🪙 Coinflip')
                    .setDescription(`You chose **${side}**... The coin landed on **${roll}**!`)
                    .setColor(result.won ? 0x00FF00 : 0xFF0000);

                if (result.won) {
                    embed.addFields({ name: 'Winnings', value: `+${result.payout} coins` });
                } else {
                    embed.addFields({ name: 'Result', value: `You lost ${bet} coins.` });
                }

                if (result.relic) {
                    embed.addFields({ name: '🎁 JACKPOT RELIC!', value: `${result.relic.name} (${result.relic.rarity})` });
                }

                await ctx.interaction.editReply({ embeds: [embed] });

            } else if (subcommand === 'slots') {
                const result = await playCasinoGame(ctx.userId, ctx.guildId!, 'slots', bet);

                if (!result.success) {
                    await ctx.interaction.editReply(`❌ Error: ${result.error}`);
                    return;
                }

                // Map symbols back to emojis for display
                const iconMap: any = { 'A': '🍒', 'B': '🍋', 'C': '🍇', 'D': '💎', '7': '7️⃣' };
                const slots = result.meta.slots.map((s: string) => iconMap[s] || s).join(' | ');

                const embed = new EmbedBuilder()
                    .setTitle('🎰 Slots')
                    .setDescription(`**[ ${slots} ]**`)
                    .setColor(result.won ? 0x00FF00 : 0xFF0000);

                if (result.won) {
                    embed.addFields({ name: 'WINNER!', value: `You won ${result.payout} coins!` });
                } else {
                    embed.addFields({ name: 'Result', value: `You lost ${bet} coins.` });
                }

                if (result.relic) {
                    embed.addFields({ name: '🎁 JACKPOT RELIC!', value: `${result.relic.name} (${result.relic.rarity})` });
                }

                await ctx.interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            logger.error('Error in gamble command:', error);
            await ctx.interaction.editReply('❌ Puter Error!');
        }
    }
};
