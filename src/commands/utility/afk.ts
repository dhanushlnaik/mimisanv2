import { SlashCommandBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { successEmbed } from '../../utils/embeds.js';
import { setAfk } from '../../services/afk.service.js';

export const afkCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your AFK status')
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Why are you going AFK?')
                .setRequired(false)
        ),

    aliases: ['away', 'brb'],
    module: 'utility',
    cooldown: 10,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        let reason = 'AFK';

        if (ctx.isSlash && ctx.interaction) {
            reason = ctx.interaction.options.getString('reason') || 'AFK';
        } else if (ctx.args.length > 0) {
            reason = ctx.args.join(' ');
        }

        // Limit reason length
        if (reason.length > 100) {
            reason = reason.substring(0, 100) + '...';
        }

        await setAfk(ctx.userId, reason);

        const embed = successEmbed('AFK Set', `I've set your AFK status: **${reason}**\n\nI'll let others know when they mention you.`);

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
