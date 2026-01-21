import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors } from '../../utils/embeds.js';

const questions = [
    { option1: "Be able to fly", option2: "Be invisible" },
    { option1: "Never use social media again", option2: "Never watch another movie" },
    { option1: "Live without music", option2: "Live without TV" },
    { option1: "Always be 10 minutes late", option2: "Always be 20 minutes early" },
    { option1: "Lose all your money", option2: "Lose all your photos" },
    { option1: "Know how you die", option2: "Know when you die" },
    { option1: "Have unlimited money", option2: "Unlimited power" },
    { option1: "Be famous", option2: "Be rich" },
    { option1: "Live without internet", option2: "Live without AC/heating" },
    { option1: "Never eat your favorite food", option2: "Only eat your favorite food" },
    { option1: "Be able to read minds", option2: "Be able to see the future" },
    { option1: "Have no friends", option2: "Have fake friends" },
    { option1: "Be the funniest person", option2: "Be the smartest person" },
    { option1: "Live 100 years in the past", option2: "Live 100 years in the future" },
    { option1: "Always speak your mind", option2: "Never speak again" },
];

export const wyrCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('wyr')
        .setDescription('Would You Rather - Get a random dilemma!'),

    aliases: ['wouldyourather'],
    module: 'games',
    cooldown: 5,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        const question = questions[Math.floor(Math.random() * questions.length)];

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('wyr:1')
                    .setLabel('Option 1')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('wyr:2')
                    .setLabel('Option 2')
                    .setStyle(ButtonStyle.Secondary),
            );

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('🤔 Would You Rather...')
            .addFields(
                { name: '🔵 Option 1', value: question.option1, inline: false },
                { name: '🔴 Option 2', value: question.option2, inline: false }
            )
            .setFooter({ text: 'Choose wisely!' });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed], components: [row] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed], components: [row] });
        }
    },
};
