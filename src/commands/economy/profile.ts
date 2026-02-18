import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../../client.js';
import { getGlobalProfile, getBalance } from '../../services/economy.service.js';
import { getUserLevel, getUserRank } from '../../services/leveling.service.js';
import { getRelics } from '../../services/inventory.service.js';
import { logger } from '../../utils/logger.js';

export const profileCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your global and server profile')
        .addUserOption(opt => opt.setName('user').setDescription('User to view (default: yourself)')),
    module: 'economy',
    execute: async (ctx: CommandContext, client: MimiClient) => {
        if (!ctx.isSlash || !ctx.interaction) return;

        const targetUser = ctx.interaction.options.getUser('user') || ctx.interaction.user;
        const targetId = targetUser.id;
        const guildId = ctx.guildId!;

        await ctx.interaction.deferReply();

        try {
            // Fetch all data in parallel
            const [globalProfile, serverBalance, serverLevel, relics, rank] = await Promise.all([
                getGlobalProfile(targetId),
                getBalance(targetId, guildId),
                getUserLevel(targetId, guildId),
                getRelics(targetId),
                getUserRank(targetId, guildId)
            ]);

            const equippedRelics = relics.filter(r => r.is_equipped);

            // Format Relic Bonuses
            let salaryMult = 1.0;
            let xpMult = 1.0;
            let dungeonBonus = 0;

            for (const r of equippedRelics) {
                if (r.stats.salary_mult) salaryMult *= r.stats.salary_mult;
                if (r.stats.xp_mult) xpMult *= r.stats.xp_mult;
                if (r.stats.dungeon_bonus) dungeonBonus += r.stats.dungeon_bonus;
            }

            const embed = new EmbedBuilder()
                .setTitle(`📊 Profile: ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setColor(0x0099FF)
                .addFields(
                    {
                        name: '🌍 Global Stats',
                        value: `**Level:** ${globalProfile.global_level}\n**XP:** ${globalProfile.global_xp}\n**Reputation:** ${globalProfile.reputation} ⭐\n**Global Wealth:** ${globalProfile.balance} 💎`,
                        inline: false
                    },
                    {
                        name: '🏰 Server Stats',
                        value: `**Level:** ${serverLevel.level} (Top #${rank})\n**XP:** ${serverLevel.xp}\n**Balance:** ${serverBalance.balance} 💰`,
                        inline: false
                    },
                    {
                        name: '⚔️ Equipment',
                        value: equippedRelics.length > 0
                            ? equippedRelics.map(r => `• ${r.name} (${r.rarity})`).join('\n')
                            : 'No relics equipped.',
                        inline: true
                    },
                    {
                        name: '✨ Active Bonuses',
                        value: `**Salary:** ${Math.round((salaryMult - 1) * 100)}% Boost\n**XP Gain:** ${Math.round((xpMult - 1) * 100)}% Boost\n**Dungeon Luck:** +${dungeonBonus}%`,
                        inline: true
                    }
                )
                .setFooter({ text: `Total Relics Owned: ${relics.length}` });

            await ctx.interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.error('Error in profile command:', error);
            await ctx.interaction.editReply('❌ Failed to load profile.');
        }
    }
};
