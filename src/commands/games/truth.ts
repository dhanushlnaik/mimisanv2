import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors } from '../../utils/embeds.js';

const truths = [
    "What's the most embarrassing thing you've ever done?",
    "What's your biggest fear?",
    "What's a secret you've never told anyone?",
    "What's the weirdest dream you've ever had?",
    "Who was your first crush?",
    "What's the most childish thing you still do?",
    "What's the last lie you told?",
    "What's your guilty pleasure?",
    "What's the strangest thing you've ever eaten?",
    "If you could be invisible for a day, what would you do?",
    "What's the most trouble you've ever been in?",
    "What's something you're afraid to tell your parents?",
    "What's the most embarrassing thing in your search history?",
    "Have you ever cheated on a test?",
    "What's your biggest insecurity?",
    "What's the meanest thing you've ever said to someone?",
    "What's a habit you have that you're ashamed of?",
    "Who in this server do you find most attractive?",
    "What's the worst gift you've ever received?",
    "What's something you've done that you regret?",
];

export const truthCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('truth')
        .setDescription('Get a random truth question'),

    module: 'games',
    cooldown: 3,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        const truth = truths[Math.floor(Math.random() * truths.length)];

        const embed = new EmbedBuilder()
            .setColor(Colors.INFO)
            .setTitle('🔮 Truth')
            .setDescription(truth)
            .setFooter({ text: 'Answer honestly!' });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
