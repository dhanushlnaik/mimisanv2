import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, errorEmbed } from '../../utils/embeds.js';
import { redditApi } from '../../api/external.js';

export const memeCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random meme from Reddit'),

    aliases: ['reddit'],
    module: 'fun',
    cooldown: 5,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.deferReply();
        }

        const meme = await redditApi.getMeme();

        if (!meme) {
            const embed = errorEmbed('Error', 'Could not fetch a meme. Try again later!');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.editReply({ embeds: [embed] });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle(meme.title.substring(0, 256))
            .setImage(meme.url)
            .setFooter({ text: `Posted by u/${meme.author}` });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.editReply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
