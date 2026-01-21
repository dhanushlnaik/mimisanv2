import { SlashCommandBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { infoEmbed } from '../../utils/embeds.js';

export const pingCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency'),

    aliases: ['pong', 'latency'],
    module: 'utility',
    cooldown: 3,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        const start = Date.now();

        const embed = infoEmbed('🏓 Pong!', 'Calculating latency...');

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
            const end = Date.now();

            const newEmbed = infoEmbed('🏓 Pong!')
                .addFields(
                    { name: 'Roundtrip', value: `${end - start}ms`, inline: true },
                    { name: 'WebSocket', value: `${client.ws.ping}ms`, inline: true }
                );

            await ctx.interaction.editReply({ embeds: [newEmbed] });
        } else if (ctx.message) {
            const sent = await ctx.message.reply({ embeds: [embed] });
            const end = Date.now();

            const newEmbed = infoEmbed('🏓 Pong!')
                .addFields(
                    { name: 'Roundtrip', value: `${end - start}ms`, inline: true },
                    { name: 'WebSocket', value: `${client.ws.ping}ms`, inline: true }
                );

            await sent.edit({ embeds: [newEmbed] });
        }
    },
};
