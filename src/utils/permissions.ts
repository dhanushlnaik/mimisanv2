import { PermissionFlagsBits, type GuildMember } from 'discord.js';
import type { Command, CommandContext } from '../client.js';
import { errorEmbed } from './embeds.js';

// Check if user has admin permissions
export function isAdmin(member: GuildMember): boolean {
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

// Check if user has manage guild permissions
export function canManageGuild(member: GuildMember): boolean {
    return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

// Check if user has manage channels permissions  
export function canManageChannels(member: GuildMember): boolean {
    return member.permissions.has(PermissionFlagsBits.ManageChannels);
}

// Check if user has manage messages permissions
export function canManageMessages(member: GuildMember): boolean {
    return member.permissions.has(PermissionFlagsBits.ManageMessages);
}

// Check if user can move members in voice
export function canMoveMembers(member: GuildMember): boolean {
    return member.permissions.has(PermissionFlagsBits.MoveMembers);
}

// Check if user can mute members
export function canMuteMembers(member: GuildMember): boolean {
    return member.permissions.has(PermissionFlagsBits.MuteMembers);
}

// Validate command permissions
export async function checkPermissions(
    command: Command,
    ctx: CommandContext,
    member: GuildMember | null
): Promise<boolean> {
    // Admin-only check
    if (command.adminOnly) {
        if (!member || !isAdmin(member)) {
            const embed = errorEmbed(
                'Permission Denied',
                'This command requires **Administrator** permissions.'
            );

            if (ctx.isSlash && ctx.interaction) {
                await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (ctx.message) {
                await ctx.message.reply({ embeds: [embed] });
            }
            return false;
        }
    }

    // Guild-only check
    if (command.guildOnly && !ctx.guildId) {
        const embed = errorEmbed(
            'Server Only',
            'This command can only be used in a server.'
        );

        if (ctx.isSlash && ctx.interaction) {
            await ctx.interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (ctx.message) {
            await ctx.message.reply({ embeds: [embed] });
        }
        return false;
    }

    return true;
}

// Get member from context
export function getMemberFromContext(ctx: CommandContext): GuildMember | null {
    if (ctx.isSlash && ctx.interaction) {
        return ctx.interaction.member as GuildMember | null;
    } else if (ctx.message) {
        return ctx.message.member;
    }
    return null;
}
