import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, errorEmbed } from '../../utils/embeds.js';
import { getRandomDogImage } from '../../api/external.js';

export const dogCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Get a random dog image'),

    aliases: ['doggo', 'woof'],
    module: 'fun',
    cooldown: 5,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.deferReply();
        }

        const imageUrl = await getRandomDogImage();

        if (!imageUrl) {
            const embed = errorEmbed('Error', 'Could not fetch a dog image. Try again later!');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.editReply({ embeds: [embed] });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('🐕 Woof!')
            .setImage(imageUrl)
            .setFooter({ text: 'Powered by Dog CEO API' });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.editReply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
