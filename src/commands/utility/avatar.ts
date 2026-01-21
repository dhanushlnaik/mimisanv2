import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors, errorEmbed } from '../../utils/embeds.js';

export const avatarCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get a user\'s avatar')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to get the avatar of')
                .setRequired(false)
        ),

    aliases: ['av', 'pfp'],
    module: 'utility',
    cooldown: 5,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        let targetUser = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getUser('user')
            : null;

        // For message commands, check mentions or args
        if (!targetUser && ctx.message) {
            targetUser = ctx.message.mentions.users.first() || null;

            // Try to fetch by ID if provided as arg
            if (!targetUser && ctx.args[0]) {
                try {
                    targetUser = await client.users.fetch(ctx.args[0]);
                } catch {
                    // Invalid user ID, ignore
                }
            }
        }

        // Default to command author
        if (!targetUser) {
            targetUser = ctx.isSlash && ctx.interaction
                ? ctx.interaction.user
                : ctx.message?.author || null;
        }

        if (!targetUser) {
            const embed = errorEmbed('Error', 'Could not find user.');
            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle(`${targetUser.displayName}'s Avatar`)
            .setImage(targetUser.displayAvatarURL({ size: 1024 }))
            .addFields(
                { name: 'PNG', value: `[Link](${targetUser.displayAvatarURL({ extension: 'png', size: 1024 })})`, inline: true },
                { name: 'JPG', value: `[Link](${targetUser.displayAvatarURL({ extension: 'jpg', size: 1024 })})`, inline: true },
                { name: 'WEBP', value: `[Link](${targetUser.displayAvatarURL({ extension: 'webp', size: 1024 })})`, inline: true }
            )
            .setFooter({ text: `Requested by ${ctx.isSlash && ctx.interaction ? ctx.interaction.user.tag : ctx.message?.author.tag}` });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
