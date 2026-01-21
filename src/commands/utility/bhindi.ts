import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';

const TARGET_GUILD_ID = '725612078764785694';
const TARGET_ROLE_ID = '838485948701736982';

export const bhindiCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('bhindi')
        .setDescription('Bhindi Someone (Role toggle)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('Select a member')
                .setRequired(true)
        ) as any,

    module: 'utility',
    cooldown: 3,
    guildOnly: true,

    async execute(ctx: CommandContext, _client: MimiClient): Promise<void> {
        if (!ctx.isSlash || !ctx.interaction || !ctx.interaction.guild) return;

        // Restriction check as per original code
        if (ctx.interaction.guildId !== TARGET_GUILD_ID) {
            const embed = errorEmbed('Restricted', 'This command is not available in this server.');
            await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const targetUser = ctx.interaction.options.getUser('member', true);
        const role = ctx.interaction.guild.roles.cache.get(TARGET_ROLE_ID);

        if (!role) {
            const embed = errorEmbed('Error', 'Target role not found in this server.');
            await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const member = await ctx.interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            const embed = errorEmbed('Error', 'Could not find that member in this server.');
            await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            if (member.roles.cache.has(TARGET_ROLE_ID)) {
                await member.roles.remove(role);
                const embed = successEmbed('UnBhindeed', `${targetUser} was **UnBhindeed**.`);
                await ctx.interaction.reply({ embeds: [embed] });
            } else {
                await member.roles.add(role);
                const embed = successEmbed('Bhindeed', `${targetUser} was **Bhindeed**.`);
                await ctx.interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            const embed = errorEmbed('Permission Error', 'I don\'t have permission to manage this role.');
            await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
