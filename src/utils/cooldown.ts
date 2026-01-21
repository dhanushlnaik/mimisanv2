import { Collection } from 'discord.js';
import type { Command, CommandContext, MimiClient } from '../client.js';
import { errorEmbed } from './embeds.js';

// Check and apply cooldown
export async function checkCooldown(
    client: MimiClient,
    command: Command,
    ctx: CommandContext
): Promise<boolean> {
    if (!command.cooldown) return true;

    const cooldownKey = `${command.data.name}`;

    if (!client.cooldowns.has(cooldownKey)) {
        client.cooldowns.set(cooldownKey, new Collection());
    }

    const now = Date.now();
    const timestamps = client.cooldowns.get(cooldownKey)!;
    const cooldownAmount = command.cooldown * 1000;

    if (timestamps.has(ctx.userId)) {
        const expirationTime = timestamps.get(ctx.userId)! + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            const embed = errorEmbed(
                'Cooldown Active',
                `Please wait **${timeLeft.toFixed(1)}s** before using \`${command.data.name}\` again.`
            );

            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return false;
        }
    }

    timestamps.set(ctx.userId, now);
    setTimeout(() => timestamps.delete(ctx.userId), cooldownAmount);
    return true;
}

// Format cooldown time
export function formatCooldown(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
