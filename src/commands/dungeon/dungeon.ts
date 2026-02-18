import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { enterDungeon } from '../../services/dungeon.service.js';
import { logger } from '../../utils/logger.js';

const data = new SlashCommandBuilder()
    .setName('dungeon')
    .setDescription('Explore dungeons and earn rewards')
    .addSubcommand(sub =>
        sub.setName('enter')
            .setDescription('Enter a dungeon')
            .addStringOption(option =>
                option.setName('rank')
                    .setDescription('Dungeon Rank (E, C, B, A, S)')
                    .setRequired(true)
                    .addChoices(
                        { name: 'E-Rank', value: 'E' },
                        { name: 'C-Rank', value: 'C' },
                        { name: 'B-Rank', value: 'B' },
                        { name: 'A-Rank', value: 'A' },
                        { name: 'S-Rank', value: 'S' }
                    )
            )
    );

export const dungeonCommand: Command = {
    data: data as any,
    module: 'economy',
    execute: async (ctx: CommandContext, client: MimiClient) => {
        if (!ctx.isSlash || !ctx.interaction) {
            if (ctx.message) await ctx.message.reply('This command only works as a slash command.');
            return;
        }

        const subcommand = ctx.interaction.options.getSubcommand();
        if (subcommand === 'enter') {
            const rank = ctx.interaction.options.getString('rank', true);
            await ctx.interaction.deferReply();

            try {
                const result = await enterDungeon(ctx.userId, ctx.guildId!, rank);

                if (!result.success) {
                    await ctx.interaction.editReply(`❌ Failed to enter dungeon: ${result.error}`);
                    return;
                }

                const outcome = result.result;
                if (outcome.outcome === 'win') {
                    const rewards = outcome.rewards;
                    const embed = new EmbedBuilder()
                        .setTitle(`🏰 Dungeon Cleared! (${rank}-Rank)`)
                        .setColor(0x00FF00)
                        .setDescription(`You successfully cleared the dungeon!`)
                        .addFields(
                            { name: '💰 Coins', value: `+${rewards.coins}`, inline: true },
                            { name: '✨ XP', value: `+${rewards.xp}`, inline: true }
                        );

                    if (rewards.relic) {
                        embed.addFields({ name: '🎁 Relic Drop', value: `${rewards.relic.name} (${rewards.relic.rarity})` });
                    }

                    await ctx.interaction.editReply({ embeds: [embed] });
                } else {
                    await ctx.interaction.editReply(`💀 **Dungeon Failed!**\nYou were defeated and lost the entry fee.`);
                }
            } catch (error) {
                logger.error('Error in dungeon command', error);
                await ctx.interaction.editReply('❌ Use `/setup economy` first to initialize configuration.');
            }
        }
    }
};
