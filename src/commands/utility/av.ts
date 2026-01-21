import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { errorEmbed } from '../../utils/embeds.js';

export const avCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('av')
        .setDescription('Joins two profile pictures together side-by-side')
        .addUserOption(option =>
            option
                .setName('member-1')
                .setDescription('Select the first member')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('member-2')
                .setDescription('Select the second member')
                .setRequired(true)
        ) as any,

    module: 'utility',
    cooldown: 5,
    guildOnly: true,

    async execute(ctx: CommandContext, _client: MimiClient): Promise<void> {
        if (!ctx.isSlash || !ctx.interaction) return;

        await ctx.interaction.reply('Processing avatars, please wait...');

        try {
            const user1 = ctx.interaction.options.getUser('member-1', true);
            const user2 = ctx.interaction.options.getUser('member-2', true);

            const canvas = createCanvas(1000, 500);
            const ctxCanvas = canvas.getContext('2d');

            const avatarUrl1 = user1.displayAvatarURL({ extension: 'jpg', size: 512 });
            const avatarUrl2 = user2.displayAvatarURL({ extension: 'jpg', size: 512 });

            const [img1, img2] = await Promise.all([
                loadImage(avatarUrl1),
                loadImage(avatarUrl2)
            ]);

            ctxCanvas.drawImage(img1, 0, 0, 500, 500);
            ctxCanvas.drawImage(img2, 500, 0, 500, 500);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'avatars.jpg' });

            await ctx.interaction.editReply({
                content: `Avatars of **${user1.username}** and **${user2.username}**`,
                files: [attachment]
            });
        } catch (error) {
            const embed = errorEmbed('Error', 'Failed to process avatars. Make sure the images are accessible.');
            await ctx.interaction.editReply({ content: null, embeds: [embed] });
        }
    },
};
