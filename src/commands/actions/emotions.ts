import { SlashCommandBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { emotionEmbed, errorEmbed, Colors } from '../../utils/embeds.js';
import { weebyApi, getRandomFallbackGif } from '../../api/weeby.js';

const EMOTION_TYPES = [
    'blush', 'angry', 'baka', 'clap', 'confused', 'cringe', 'cry', 'dab',
    'dance', 'facepalm', 'grin', 'grumpy', 'happy', 'hate', 'hide',
    'laugh', 'no', 'nom', 'panic', 'pout', 'shrug', 'yes'
];

export const emotionCommands: Command[] = EMOTION_TYPES.map(type => ({
    data: new SlashCommandBuilder()
        .setName(type)
        .setDescription(`Express the ${type} emotion!`) as any,

    module: 'actions',
    cooldown: 5,
    guildOnly: true,

    async execute(ctx: CommandContext, _client: MimiClient): Promise<void> {
        const author = ctx.isSlash && ctx.interaction
            ? ctx.interaction.user
            : ctx.message!.author;

        // Get GIF
        let gifUrl = await weebyApi.actionGif(type as any);
        if (!gifUrl) {
            gifUrl = getRandomFallbackGif(type);
        }

        if (!gifUrl) {
            const embed = errorEmbed('Error', `Could not fetch a ${type} GIF. Try again later!`);
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        const embed = emotionEmbed(author, type, gifUrl, Colors.LOVE);

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
}));
