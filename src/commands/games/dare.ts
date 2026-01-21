import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors } from '../../utils/embeds.js';

const dares = [
    "Send a screenshot of your most recent DM",
    "Change your nickname to something embarrassing for 10 minutes",
    "Send a voice message singing your favorite song",
    "Let someone else send a message from your account",
    "Share your most used emoji",
    "Post a selfie in the chat",
    "Talk in third person for the next 5 minutes",
    "Send a message to your crush right now",
    "Share your screen time from today",
    "Let the group choose your profile picture for an hour",
    "Do your best impression of another member",
    "Send the 5th photo in your camera roll",
    "Type with your eyes closed for the next message",
    "Compliment everyone in the chat",
    "Share an embarrassing story about yourself",
    "Send a message to a random person saying 'I know what you did'",
    "Use only emojis for the next 3 messages",
    "Share your most played song",
    "Let someone go through your following list",
    "Send a message in all caps for the next 5 minutes",
];

export const dareCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('dare')
        .setDescription('Get a random dare challenge'),

    module: 'games',
    cooldown: 3,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        const dare = dares[Math.floor(Math.random() * dares.length)];

        const embed = new EmbedBuilder()
            .setColor(Colors.WARNING)
            .setTitle('⚡ Dare')
            .setDescription(dare)
            .setFooter({ text: 'No backing out!' });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
