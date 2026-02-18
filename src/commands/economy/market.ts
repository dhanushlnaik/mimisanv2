import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { createListing, buyListing, cancelListing, getListings } from '../../services/market.service.js';
import { logger } from '../../utils/logger.js';

export const marketCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Global Relic Marketplace')
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('View active listings')
                .addIntegerOption(opt => opt.setName('page').setDescription('Page number'))
        )
        .addSubcommand(sub =>
            sub.setName('sell')
                .setDescription('Sell a relic')
                .addIntegerOption(opt => opt.setName('relic_id').setDescription('Relic ID (from /relic list)').setRequired(true))
                .addIntegerOption(opt => opt.setName('price').setDescription('Price in coins').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('buy')
                .setDescription('Buy a relic listing')
                .addIntegerOption(opt => opt.setName('listing_id').setDescription('Listing ID (from /market list)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('cancel')
                .setDescription('Cancel your listing')
                .addIntegerOption(opt => opt.setName('listing_id').setDescription('Listing ID').setRequired(true))
        ) as any,
    module: 'economy',
    execute: async (ctx: CommandContext, client: MimiClient) => {
        if (!ctx.isSlash || !ctx.interaction) return;

        const subcommand = ctx.interaction.options.getSubcommand();
        await ctx.interaction.deferReply();

        try {
            if (subcommand === 'list') {
                const page = ctx.interaction.options.getInteger('page') || 1;
                const { listings, total } = await getListings(ctx.guildId!, page);

                const embed = new EmbedBuilder()
                    .setTitle(`🏪 Marketplace (Page ${page})`)
                    .setColor(0xFFA500)
                    .setFooter({ text: `Total Listings: ${total}` });

                if (listings.length === 0) {
                    embed.setDescription('No active listings found.');
                } else {
                    const fields = listings.map(l => ({
                        name: `${l.relic_name} (${l.relic_rarity})`,
                        value: `**Price:** ${l.price} 💰\n**Listing ID:** \`${l.id}\`\n**Seller:** <@${l.seller_id}>`,
                        inline: true
                    }));
                    embed.addFields(fields);
                }

                await ctx.interaction.editReply({ embeds: [embed] });

            } else if (subcommand === 'sell') {
                const relicId = ctx.interaction.options.getInteger('relic_id', true);
                const price = ctx.interaction.options.getInteger('price', true);

                const result = await createListing(ctx.userId, ctx.guildId!, relicId, price);

                if (!result.success) {
                    await ctx.interaction.editReply(`❌ Failed to list item: ${result.error}`);
                } else {
                    await ctx.interaction.editReply(`✅ Successfully listed Relic #${relicId} for ${price} coins! (Listing ID: ${result.listingId})`);
                }

            } else if (subcommand === 'buy') {
                const listingId = ctx.interaction.options.getInteger('listing_id', true);
                const result = await buyListing(ctx.userId, ctx.guildId!, listingId);

                if (!result.success) {
                    await ctx.interaction.editReply(`❌ Failed to buy item: ${result.error}`);
                } else {
                    await ctx.interaction.editReply(`🎉 You bought **${result.item?.name}** for ${result.item?.price} coins!`);
                }

            } else if (subcommand === 'cancel') {
                const listingId = ctx.interaction.options.getInteger('listing_id', true);
                const result = await cancelListing(ctx.userId, listingId);

                if (!result.success) {
                    await ctx.interaction.editReply(`❌ Failed to cancel listing: ${result.error}`);
                } else {
                    await ctx.interaction.editReply(`✅ Listing #${listingId} cancelled.`);
                }
            }
        } catch (error) {
            logger.error('Error in market command:', error);
            await ctx.interaction.editReply('❌ Puter Error!');
        }
    }
};
