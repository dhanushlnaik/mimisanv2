import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { updateServerConfig, getServerConfig } from '../../services/config.service.js';
import { logger } from '../../utils/logger.js';

export const setupCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure server settings (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('economy')
                .setDescription('Configure economy settings')
                .addBooleanOption(opt => opt.setName('dungeons').setDescription('Enable/Disable Dungeons'))
                .addBooleanOption(opt => opt.setName('casino').setDescription('Enable/Disable Casino'))
                .addBooleanOption(opt => opt.setName('market').setDescription('Enable/Disable Marketplace'))
                .addStringOption(opt => opt.setName('salary_mode').setDescription('Salary Mode').addChoices({ name: 'Linear', value: 'linear' }, { name: 'Tiered', value: 'tiered' }))
                .addIntegerOption(opt => opt.setName('salary_base').setDescription('Base salary amount'))
        )
        .addSubcommand(sub =>
            sub.setName('xp')
                .setDescription('Configure XP settings')
                .addNumberOption(opt => opt.setName('rate_chat').setDescription('Chat XP Multiplier (e.g. 1.5)'))
                .addNumberOption(opt => opt.setName('rate_vc').setDescription('VC XP Multiplier (e.g. 1.0)'))
                .addStringOption(opt => opt.setName('mode').setDescription('XP Channel Mode').addChoices({ name: 'All Channels', value: 'all' }, { name: 'Whitelist Only', value: 'whitelist' }, { name: 'Blacklist', value: 'blacklist' }))
        ) as any,
    module: 'utility',
    execute: async (ctx: CommandContext, client: MimiClient) => {
        if (!ctx.isSlash || !ctx.interaction) return;

        const subcommand = ctx.interaction.options.getSubcommand();
        await ctx.interaction.deferReply({ ephemeral: true });

        try {
            if (subcommand === 'economy') {
                const dungeons = ctx.interaction.options.getBoolean('dungeons');
                const casino = ctx.interaction.options.getBoolean('casino');
                const market = ctx.interaction.options.getBoolean('market');
                const salaryMode = ctx.interaction.options.getString('salary_mode');
                const salaryBase = ctx.interaction.options.getInteger('salary_base');

                const updates: any = {};
                if (dungeons !== null) updates.dungeons_enabled = dungeons;
                if (casino !== null) updates.casino_enabled = casino;
                if (market !== null) updates.market_enabled = market;
                if (salaryMode !== null) updates.salary_mode = salaryMode;
                if (salaryBase !== null) updates.salary_base = salaryBase;

                if (Object.keys(updates).length === 0) {
                    const current = await getServerConfig(ctx.guildId!);
                    await ctx.interaction.editReply({
                        content: `**Current Economy Settings:**\n` +
                            `- Dungeons: ${current.dungeons_enabled ? '✅' : '❌'}\n` +
                            `- Casino: ${current.casino_enabled ? '✅' : '❌'}\n` +
                            `- Market: ${current.market_enabled ? '✅' : '❌'}\n` +
                            `- Salary Mode: ${current.salary_mode}\n` +
                            `- Base Salary: ${current.salary_base}`
                    });
                } else {
                    await updateServerConfig(ctx.guildId!, updates);
                    await ctx.interaction.editReply('✅ Economy settings updated!');
                }

            } else if (subcommand === 'xp') {
                const rateChat = ctx.interaction.options.getNumber('rate_chat');
                const rateVc = ctx.interaction.options.getNumber('rate_vc');
                const mode = ctx.interaction.options.getString('mode');

                const updates: any = {};
                if (rateChat !== null) updates.xp_rate_chat = rateChat;
                if (rateVc !== null) updates.xp_rate_vc = rateVc;
                if (mode !== null) updates.xp_channel_mode = mode; // Fixed: was xp_mode in DB schema but migration 004 added xp_channel_mode? 
                // Let's check migration 004 again. Migration 004 added `xp_channel_mode`.
                // Migration 002 added `xp_mode` (balanced/chat/vc).
                // Wait, I might have confused the two.
                // Let's check the schema for `server_configs` again from previous `view_file`.

                // In 002_economy_overhaul.sql: xp_mode VARCHAR(20) DEFAULT 'balanced' -- balanced, chat, vc
                // In 004_add_xp_channels.sql: 
                //    ALTER TABLE server_configs ADD COLUMN IF NOT EXISTS xp_channel_mode VARCHAR(20) DEFAULT 'all';
                //    ALTER TABLE server_configs ADD COLUMN IF NOT EXISTS xp_channels TEXT[] DEFAULT '{}';

                // So there are TWO modes. `xp_mode` (gameplay style?) and `xp_channel_mode` (channel restriction).
                // The prompt for setup command `mode` description says "XP Channel Mode". So it maps to `xp_channel_mode`.

                updates.xp_channel_mode = mode;

                // If updates is empty (except potentially undefined mode if null), show config
                // Wait, if mode is null, updates.xp_channel_mode is null?
                if (mode === null) delete updates.xp_channel_mode;

                if (Object.keys(updates).length === 0) {
                    const current = await getServerConfig(ctx.guildId!);
                    await ctx.interaction.editReply({
                        content: `**Current XP Settings:**\n` +
                            `- Chat Rate: ${current.xp_rate_chat}x\n` +
                            `- VC Rate: ${current.xp_rate_vc}x\n` +
                            `- Channel Mode: ${current.xp_channel_mode || 'all'}`
                    });
                } else {
                    await updateServerConfig(ctx.guildId!, updates);
                    await ctx.interaction.editReply('✅ XP settings updated!');
                }
            }
        } catch (error) {
            logger.error('Error in setup command:', error);
            await ctx.interaction.editReply('❌ Failed to update settings.');
        }
    }
};
