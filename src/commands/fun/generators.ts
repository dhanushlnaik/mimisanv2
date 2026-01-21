import {
    SlashCommandBuilder,
    AttachmentBuilder,
} from 'discord.js';
import { Command, CommandContext, MimiClient } from '../../client.js';
import { weebyApi } from '../../api/weeby.js';
import { errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

export const generateCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('generate')
        .setDescription('Generate fun images using the Weeby API')
        // Subcommand: One Image
        .addSubcommand(sub =>
            sub.setName('image')
                .setDescription('Draw one image on a generator')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('The type of generator')
                        .setRequired(true)
                        .addChoices(
                            { name: '3000 Years', value: '3000years' },
                            { name: 'Airpods', value: 'airpods' },
                            { name: 'Am I a Joke?', value: 'amiajoke' },
                            { name: 'Bad', value: 'bad' },
                            { name: 'Beautiful', value: 'beautiful' },
                            { name: 'Bernie Mittens', value: 'berniemittens' },
                            { name: 'Bob Ross', value: 'bobross' },
                            { name: 'respect', value: 'respect' },
                            { name: 'wanted', value: 'wanted' },
                            { name: 'hot', value: 'hot' },
                            { name: 'stonks', value: 'stonks' }
                            // Adding more would exceed 25 choices limit
                        )
                )
                .addUserOption(opt => opt.setName('user').setDescription('The user whose avatar to use'))
                .addAttachmentOption(opt => opt.setName('attachment').setDescription('An image to use'))
        )
        // Subcommand: Two Images
        .addSubcommand(sub =>
            sub.setName('two-image')
                .setDescription('Draw two images on a generator')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('The type of generator')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bat Slap', value: 'batslap' },
                            { name: 'Bed', value: 'bed' },
                            { name: 'Crush', value: 'crush' },
                            { name: 'Cuddle', value: 'cuddle' },
                            { name: 'Hug', value: 'hug' },
                            { name: 'Ship', value: 'ship' },
                            { name: 'Who Would Win', value: 'whowouldwin' }
                        )
                )
                .addUserOption(opt => opt.setName('user1').setDescription('The first user').setRequired(true))
                .addUserOption(opt => opt.setName('user2').setDescription('The second user'))
        )
        // Subcommand: Text
        .addSubcommand(sub =>
            sub.setName('text')
                .setDescription('Print text on a generator')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('The type of generator')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Be Like Bill', value: 'belikebill' },
                            { name: 'Clyde', value: 'clyde' },
                            { name: 'Danger', value: 'danger' },
                            { name: 'Hollywood Star', value: 'hollywoodstar' }
                        )
                )
                .addStringOption(opt => opt.setName('text').setDescription('The text to print').setRequired(true))
        )
        // Subcommand: Two Text
        .addSubcommand(sub =>
            sub.setName('two-text')
                .setDescription('Print two texts on a generator')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('The type of generator')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Drake Posting', value: 'drakeposting' },
                            { name: 'Spiderman', value: 'spiderman' },
                            { name: 'Two Buttons', value: 'twobuttons' },
                            { name: 'Tuxedo Pooh', value: 'tuxedopooh' },
                            { name: 'iCarly', value: 'icarly' },
                            { name: 'Did You Mean', value: 'didyoumean' }
                        )
                )
                .addStringOption(opt => opt.setName('text1').setDescription('The first text').setRequired(true))
                .addStringOption(opt => opt.setName('text2').setDescription('The second text').setRequired(true))
        )
        // Subcommand: Image and Text
        .addSubcommand(sub =>
            sub.setName('image-text')
                .setDescription('Draw one image and one text on a generator')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('The type of generator')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Achievement', value: 'achievement' },
                            { name: 'Bart Chalkboard', value: 'bartchalkboard' },
                            { name: 'Change My Mind', value: 'changemymind' },
                            { name: 'Lisa Presentation', value: 'lisapresentation' },
                            { name: 'Jim Whiteboard', value: 'jimwhiteboard' }
                        )
                )
                .addStringOption(opt => opt.setName('text').setDescription('The text to print').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('The user whose avatar to use'))
                .addAttachmentOption(opt => opt.setName('attachment').setDescription('An image to use'))
        )
        // Subcommand: Quote
        .addSubcommand(sub =>
            sub.setName('quote')
                .setDescription('Generate a quote image')
                .addStringOption(opt => opt.setName('text').setDescription('The quote text').setRequired(true))
                .addStringOption(opt => opt.setName('author').setDescription('The author name').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('The user whose avatar to use'))
        )
        // Subcommand: Eject (Among Us)
        .addSubcommand(sub =>
            sub.setName('eject')
                .setDescription('Among Us ejection generator')
                .addStringOption(opt => opt.setName('text').setDescription('The name of the character').setRequired(true))
                .addStringOption(opt =>
                    opt.setName('outcome')
                        .setDescription('The outcome')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Ejected', value: 'ejected' },
                            { name: 'Imposter', value: 'imposter' },
                            { name: 'Not Imposter', value: 'notimposter' }
                        )
                )
                .addUserOption(opt => opt.setName('user').setDescription('The user whose avatar to use'))
        )
        // Subcommand: RIP
        .addSubcommand(sub =>
            sub.setName('rip')
                .setDescription('Generate a gravestone image')
                .addStringOption(opt => opt.setName('message').setDescription('The tombstone message').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('The user who died'))
        )
        // Subcommand: Tweet
        .addSubcommand(sub =>
            sub.setName('tweet')
                .setDescription('Generate a fake tweet')
                .addStringOption(opt => opt.setName('text').setDescription('The tweet content').setRequired(true))
                .addStringOption(opt => opt.setName('username').setDescription('The username to show'))
                .addUserOption(opt => opt.setName('user').setDescription('The user whose avatar to use'))
        )
        // Subcommand: Spotify
        .addSubcommand(sub =>
            sub.setName('spotify')
                .setDescription('Generate a Spotify Now Playing image')
                .addStringOption(opt => opt.setName('title').setDescription('Song title').setRequired(true))
                .addStringOption(opt => opt.setName('artist').setDescription('Artist name').setRequired(true))
                .addStringOption(opt => opt.setName('album').setDescription('Album name').setRequired(true))
                .addUserOption(opt => opt.setName('user').setDescription('The user whose avatar to use'))
        ),
    module: 'fun',

    async execute(ctx: CommandContext, _client: MimiClient): Promise<void> {
        const interaction = ctx.interaction;
        if (!interaction || !interaction.isChatInputCommand()) return;

        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const params: Record<string, string> = {};

        try {
            let generatorType = subcommand;

            if (subcommand === 'image' || subcommand === 'image-text') {
                generatorType = interaction.options.getString('type', true);
                const user = interaction.options.getUser('user') || interaction.user;
                const attachment = interaction.options.getAttachment('attachment');
                const text = interaction.options.getString('text');

                params.image = attachment ? attachment.url : user.displayAvatarURL({ extension: 'png', size: 512 });
                if (text) params.text = text;
            } else if (subcommand === 'two-image') {
                generatorType = interaction.options.getString('type', true);
                const user1 = interaction.options.getUser('user1', true);
                const user2 = interaction.options.getUser('user2') || interaction.user;

                params.firstimage = user1.displayAvatarURL({ extension: 'png', size: 512 });
                params.secondimage = user2.displayAvatarURL({ extension: 'png', size: 512 });
            } else if (subcommand === 'text') {
                generatorType = interaction.options.getString('type', true);
                params.text = interaction.options.getString('text', true);
            } else if (subcommand === 'two-text') {
                generatorType = interaction.options.getString('type', true);
                params.textone = interaction.options.getString('text1', true);
                params.texttwo = interaction.options.getString('text2', true);
            } else if (subcommand === 'quote') {
                const user = interaction.options.getUser('user') || interaction.user;
                params.image = user.displayAvatarURL({ extension: 'png', size: 512 });
                params.text = interaction.options.getString('text', true);
                params.author = interaction.options.getString('author', true);
            } else if (subcommand === 'eject') {
                const user = interaction.options.getUser('user') || interaction.user;
                params.image = user.displayAvatarURL({ extension: 'png', size: 512 });
                params.text = interaction.options.getString('text', true);
                params.outcome = interaction.options.getString('outcome', true);
            } else if (subcommand === 'rip') {
                const user = interaction.options.getUser('user') || interaction.user;
                params.avatar = user.displayAvatarURL({ extension: 'png', size: 512 });
                params.username = user.username;
                params.message = interaction.options.getString('message', true);
            } else if (subcommand === 'tweet') {
                const user = interaction.options.getUser('user') || interaction.user;
                params.avatar = user.displayAvatarURL({ extension: 'png', size: 512 });
                params.username = interaction.options.getString('username') || user.username;
                params.tweet = interaction.options.getString('text', true);
            } else if (subcommand === 'spotify') {
                generatorType = 'spotifynp';
                const user = interaction.options.getUser('user') || interaction.user;
                params.image = user.displayAvatarURL({ extension: 'png', size: 512 });
                params.title = interaction.options.getString('title', true);
                params.artist = interaction.options.getString('artist', true);
                params.album = interaction.options.getString('album', true);
            }

            const imageBuffer = await weebyApi.generateImage(generatorType, params);

            if (!imageBuffer) {
                await interaction.editReply({
                    embeds: [errorEmbed('Failed to generate image. Please try again later.')]
                });
                return;
            }

            const attachment = new AttachmentBuilder(imageBuffer, { name: `${generatorType}.png` });
            await interaction.editReply({ files: [attachment] });
        } catch (error) {
            logger.error(`Error in generate command:`, error);
            await interaction.editReply({
                embeds: [errorEmbed('An error occurred while generating the image.')]
            });
        }
    },
};
