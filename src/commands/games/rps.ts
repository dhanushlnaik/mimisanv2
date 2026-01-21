import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors } from '../../utils/embeds.js';

const choices = ['rock', 'paper', 'scissors'] as const;
type Choice = typeof choices[number];

const emojis: Record<Choice, string> = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️',
};

function getWinner(player: Choice, bot: Choice): 'player' | 'bot' | 'tie' {
    if (player === bot) return 'tie';
    if (
        (player === 'rock' && bot === 'scissors') ||
        (player === 'paper' && bot === 'rock') ||
        (player === 'scissors' && bot === 'paper')
    ) {
        return 'player';
    }
    return 'bot';
}

export const rpsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock Paper Scissors!')
        .addStringOption(option =>
            option
                .setName('choice')
                .setDescription('Your choice')
                .setRequired(false)
                .addChoices(
                    { name: '🪨 Rock', value: 'rock' },
                    { name: '📄 Paper', value: 'paper' },
                    { name: '✂️ Scissors', value: 'scissors' }
                )
        ),

    aliases: ['rockpaperscissors'],
    module: 'games',
    cooldown: 3,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        const playerChoice = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getString('choice') as Choice | null
            : ctx.args[0]?.toLowerCase() as Choice | null;

        // If no choice provided, show buttons
        if (!playerChoice || !choices.includes(playerChoice)) {
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rps:rock')
                        .setLabel('Rock')
                        .setEmoji('🪨')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('rps:paper')
                        .setLabel('Paper')
                        .setEmoji('📄')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('rps:scissors')
                        .setLabel('Scissors')
                        .setEmoji('✂️')
                        .setStyle(ButtonStyle.Primary),
                );

            const embed = new EmbedBuilder()
                .setColor(Colors.PRIMARY)
                .setTitle('🎮 Rock Paper Scissors')
                .setDescription('Choose your move!');

            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], components: [row] });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed], components: [row] });
            }
            return;
        }

        // Play the game
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        const result = getWinner(playerChoice, botChoice);

        let color = Colors.NEUTRAL;
        let title = '';

        if (result === 'player') {
            color = Colors.SUCCESS;
            title = '🎉 You Win!';
        } else if (result === 'bot') {
            color = Colors.ERROR;
            title = '😔 You Lose!';
        } else {
            color = Colors.WARNING;
            title = '🤝 It\'s a Tie!';
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .addFields(
                { name: 'Your Choice', value: `${emojis[playerChoice]} ${playerChoice}`, inline: true },
                { name: 'My Choice', value: `${emojis[botChoice]} ${botChoice}`, inline: true }
            );

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
