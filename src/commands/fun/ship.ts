import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, errorEmbed, progressBar } from '../../utils/embeds.js';

export const shipCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Calculate the love compatibility between two users')
        .addUserOption(option =>
            option
                .setName('user1')
                .setDescription('First user')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('user2')
                .setDescription('Second user')
                .setRequired(false)
        ),

    aliases: ['love', 'compatibility'],
    module: 'fun',
    cooldown: 5,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        let user1 = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getUser('user1', true)
            : ctx.message?.mentions.users.first();

        let user2 = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getUser('user2')
            : ctx.message?.mentions.users.at(1);

        if (!user1) {
            const embed = errorEmbed('Error', 'Please mention at least one user!');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        // If only one user, ship with author
        if (!user2) {
            user2 = ctx.isSlash && ctx.interaction
                ? ctx.interaction.user
                : ctx.message?.author;
        }

        if (!user2) return;

        // Calculate compatibility (seeded by user IDs for consistency)
        const seed = parseInt(user1.id.slice(-4), 10) + parseInt(user2.id.slice(-4), 10);
        const compatibility = (seed * 7) % 101;

        // Get ship name
        const name1 = user1.displayName.slice(0, Math.ceil(user1.displayName.length / 2));
        const name2 = user2.displayName.slice(Math.floor(user2.displayName.length / 2));
        const shipName = name1 + name2;

        // Get rating emoji and message
        let emoji: string;
        let message: string;

        if (compatibility >= 90) {
            emoji = '💕';
            message = 'Soulmates! Made for each other!';
        } else if (compatibility >= 70) {
            emoji = '💗';
            message = 'A beautiful match!';
        } else if (compatibility >= 50) {
            emoji = '💓';
            message = 'There\'s potential here!';
        } else if (compatibility >= 30) {
            emoji = '💔';
            message = 'It might take some work...';
        } else {
            emoji = '❌';
            message = 'Maybe just friends?';
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.LOVE)
            .setTitle(`${emoji} Love Calculator`)
            .setDescription(`**${user1.displayName}** x **${user2.displayName}**`)
            .addFields(
                { name: 'Ship Name', value: `💝 ${shipName}`, inline: true },
                { name: 'Compatibility', value: `${compatibility}%`, inline: true },
                { name: 'Love Meter', value: progressBar(compatibility, 100, 15), inline: false },
                { name: 'Verdict', value: message, inline: false }
            )
            .setFooter({ text: 'Love is just a number!' });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
