import { SlashCommandBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { actionEmbed, errorEmbed, Colors } from '../../utils/embeds.js';
import { weebyApi, getRandomFallbackGif } from '../../api/weeby.js';

const ACTION_TYPES = [
    'boop', 'bite', 'bonk', 'brofist', 'cuddle', 'handhold', 'highfive',
    'hug', 'kick', 'kiss', 'pat', 'lick', 'punch', 'slap', 'poke',
    'stare', 'tease', 'tickle', 'wave', 'whisper', 'wink'
];

export const actionCommands: Command[] = ACTION_TYPES.map(type => ({
    data: new SlashCommandBuilder()
        .setName(type)
        .setDescription(`${type.charAt(0).toUpperCase() + type.slice(1)} someone!`)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(`The user to ${type}`)
                .setRequired(true)
        ) as any,

    module: 'actions',
    cooldown: 5,
    guildOnly: true,

    async execute(ctx: CommandContext, _client: MimiClient): Promise<void> {
        let targetUser = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getUser('user', true)
            : ctx.message?.mentions.users.first();

        if (!targetUser) {
            const embed = errorEmbed('Missing User', `Please mention someone to ${type}!`);
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        const author = ctx.isSlash && ctx.interaction
            ? ctx.interaction.user
            : ctx.message!.author;

        // Self-action check
        if (targetUser.id === author.id) {
            const embed = errorEmbed('Aww', `You can't ${type} yourself! Try interacting with someone else.`);
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed] });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

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

        const displayAction = type.endsWith('e') ? type + 's' : type + 's';
        const embed = actionEmbed(author, targetUser, displayAction, gifUrl, Colors.LOVE);

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ content: `<@${targetUser.id}>`, embeds: [embed] });
        }
    },
}));
