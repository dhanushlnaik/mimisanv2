import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { getRelics, equipRelic, unequipRelic } from '../../services/inventory.service.js';
import { logger } from '../../utils/logger.js';

const data = new SlashCommandBuilder()
    .setName('relic')
    .setDescription('Manage your relics (Global Inventory)')
    .addSubcommand(sub =>
        sub.setName('list')
            .setDescription('View your relics')
    )
    .addSubcommand(sub =>
        sub.setName('equip')
            .setDescription('Equip a relic by ID')
            .addIntegerOption(option =>
                option.setName('id')
                    .setDescription('Relic ID (found in /relic list)')
                    .setRequired(true)
            )
    )
    .addSubcommand(sub =>
        sub.setName('unequip')
            .setDescription('Unequip a relic by ID')
            .addIntegerOption(option =>
                option.setName('id')
                    .setDescription('Relic ID (found in /relic list)')
                    .setRequired(true)
            )
    );

export const relicCommand: Command = {
    data: data as any,
    module: 'economy',
    execute: async (ctx: CommandContext, client: MimiClient) => {
        if (!ctx.isSlash || !ctx.interaction) {
            if (ctx.message) await ctx.message.reply('This command only works as a slash command.');
            return;
        }

        const subcommand = ctx.interaction.options.getSubcommand();
        // Defer reply for all actions
        await ctx.interaction.deferReply();

        try {
            if (subcommand === 'list') {
                const relics = await getRelics(ctx.userId);

                const embed = new EmbedBuilder()
                    .setTitle('🎒 Your Relic Inventory')
                    .setColor(0x0099FF)
                    .setFooter({ text: 'Relics are global across all servers!' });

                if (relics.length === 0) {
                    embed.setDescription('You have no relics yet. Explore dungeons to find some!');
                } else {
                    const equipped = relics.filter(r => r.is_equipped);
                    const inventory = relics.filter(r => !r.is_equipped);

                    if (equipped.length > 0) {
                        embed.addFields({
                            name: `⚔️ Equipped (${equipped.length}/3)`,
                            value: equipped.map(r => `**[ID: ${r.id}]** ${r.name} (${r.rarity})`).join('\n')
                        });
                    } else {
                        embed.addFields({ name: '⚔️ Equipped', value: 'None' });
                    }

                    if (inventory.length > 0) {
                        // Limit to 10 for embed size
                        const display = inventory.slice(0, 10);
                        const remaining = inventory.length - 10;

                        embed.addFields({
                            name: `📦 Stored (${inventory.length})`,
                            value: display.map(r => `**[ID: ${r.id}]** ${r.name} (${r.rarity})`).join('\n') +
                                (remaining > 0 ? `\n...and ${remaining} more` : '')
                        });
                    } else {
                        embed.addFields({ name: '📦 Stored', value: 'None' });
                    }
                }

                await ctx.interaction.editReply({ embeds: [embed] });

            } else if (subcommand === 'equip') {
                const id = ctx.interaction.options.getInteger('id', true);
                const result = await equipRelic(ctx.userId, id);

                if (!result.success) {
                    await ctx.interaction.editReply(`❌ Failed to equip relic ${id}: ${result.error}`);
                } else {
                    await ctx.interaction.editReply(`✅ Successfully equipped relic **ID: ${id}**!`);
                }

            } else if (subcommand === 'unequip') {
                const id = ctx.interaction.options.getInteger('id', true);
                const result = await unequipRelic(ctx.userId, id);

                if (!result.success) {
                    await ctx.interaction.editReply(`❌ Failed to unequip relic ${id}: ${result.error}`);
                } else {
                    await ctx.interaction.editReply(`✅ Successfully unequipped relic **ID: ${id}**.`);
                }
            }
        } catch (error) {
            logger.error('Error in relic command:', error);
            await ctx.interaction.editReply('❌ Puter Error! Something went wrong.');
        }
    }
};
