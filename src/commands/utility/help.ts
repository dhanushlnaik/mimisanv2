import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { Colors } from '../../utils/embeds.js';

export const helpCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Get help for a specific command')
                .setRequired(false)
        ),

    aliases: ['commands', 'h'],
    module: 'utility',
    cooldown: 5,

    async execute(ctx: CommandContext, client: MimiClient): Promise<void> {
        const specificCommand = ctx.isSlash && ctx.interaction
            ? ctx.interaction.options.getString('command')
            : ctx.args[0];

        if (specificCommand) {
            // Show help for specific command
            const command = client.getCommand(specificCommand.toLowerCase());

            if (!command) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.ERROR)
                    .setTitle('❌ Command Not Found')
                    .setDescription(`No command found with name \`${specificCommand}\``);

                if (ctx.isSlash && ctx.interaction) {
                    await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
                } else if (ctx.message) {
                    await ctx.message.reply({ embeds: [embed] });
                }
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(Colors.PRIMARY)
                .setTitle(`📖 Help: /${command.data.name}`)
                .setDescription(command.data.description)
                .addFields(
                    { name: 'Module', value: command.module, inline: true },
                    { name: 'Cooldown', value: `${command.cooldown || 0}s`, inline: true }
                );

            if (command.aliases && command.aliases.length > 0) {
                embed.addFields({ name: 'Aliases', value: command.aliases.map(a => `\`${a}\``).join(', '), inline: true });
            }

            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed] });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return;
        }

        // Show all commands grouped by module
        const modules = new Map<string, Command[]>();

        for (const [, command] of client.commands) {
            const mod = command.module;
            if (!modules.has(mod)) {
                modules.set(mod, []);
            }
            modules.get(mod)!.push(command);
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('🤖 MimiSan Commands')
            .setDescription(`Use \`${ctx.prefix}help <command>\` for more info on a specific command.`)
            .setThumbnail(client.user?.displayAvatarURL() || null);

        const moduleEmojis: Record<string, string> = {
            utility: '🔧',
            fun: '🎉',
            games: '🎮',
            actions: '💕',
            leveling: '📈',
            economy: '💰',
            family: '👪',
            moderation: '🛡️',
        };

        for (const [mod, commands] of modules) {
            const emoji = moduleEmojis[mod] || '📁';
            const commandList = commands.map(c => `\`${c.data.name}\``).join(' ');
            embed.addFields({ name: `${emoji} ${mod.charAt(0).toUpperCase() + mod.slice(1)}`, value: commandList });
        }

        embed.setFooter({ text: `${client.commands.size} commands available` });

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed] });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
    },
};
