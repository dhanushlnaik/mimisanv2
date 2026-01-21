import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, errorEmbed } from '../../utils/embeds.js';
import { getRandomCatImage } from '../../api/external.js';

export const catCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Get a random cat image'),

    aliases: ['kitty', 'meow'],
    module: 'fun',
    cooldown: 5,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        // Defer reply for API call
        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.deferReply();
        }

        const imageUrl = await getRandomCatImage();

        if (!imageUrl) {
            const embed = errorEmbed('Error', 'Could not fetch a cat image. Try again later!');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.editReply({ embeds: [embed] });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('🐱 Meow!')
            .setImage(imageUrl)
            .setFooter({ text: 'Powered by TheCatAPI' });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.editReply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
