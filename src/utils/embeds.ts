import { EmbedBuilder, type ColorResolvable, type User } from 'discord.js';

// Default colors
export const Colors = {
    PRIMARY: 0x5865F2 as ColorResolvable,    // Discord Blurple
    SUCCESS: 0x57F287 as ColorResolvable,    // Green
    WARNING: 0xFEE75C as ColorResolvable,    // Yellow
    ERROR: 0xED4245 as ColorResolvable,      // Red
    INFO: 0x5865F2 as ColorResolvable,       // Blue
    LOVE: 0xFF69B4 as ColorResolvable,       // Pink
    NEUTRAL: 0x99AAB5 as ColorResolvable,    // Gray
} as const;

// Standard embed builders
export function successEmbed(title: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle(`✅ ${title}`);

    if (description) embed.setDescription(description);
    return embed;
}

export function errorEmbed(title: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setTitle(`❌ ${title}`);

    if (description) embed.setDescription(description);
    return embed;
}

export function infoEmbed(title: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.INFO)
        .setTitle(title);

    if (description) embed.setDescription(description);
    return embed;
}

export function actionEmbed(
    user: User,
    target: User,
    action: string,
    gifUrl: string,
    color: ColorResolvable = Colors.LOVE
): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(color)
        .setDescription(`**${user.displayName}** ${action} **${target.displayName}**!`)
        .setImage(gifUrl)
        .setFooter({ text: `Requested by ${user.tag}` })
        .setTimestamp();
}

export function emotionEmbed(
    user: User,
    emotion: string,
    gifUrl: string,
    color: ColorResolvable = Colors.LOVE
): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(color)
        .setDescription(`**${user.displayName}** is **${emotion}**!`)
        .setImage(gifUrl)
        .setFooter({ text: `Requested by ${user.tag}` })
        .setTimestamp();
}

export function afkEmbed(user: User, reason: string, since: Date): EmbedBuilder {
    const duration = formatDuration(Date.now() - since.getTime());

    return new EmbedBuilder()
        .setColor(Colors.WARNING)
        .setTitle('💤 AFK Notice')
        .setDescription(`**${user.displayName}** is AFK: ${reason}`)
        .addFields({ name: 'Since', value: duration, inline: true })
        .setThumbnail(user.displayAvatarURL());
}

export function levelUpEmbed(user: User, newLevel: number): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle('🎉 Level Up!')
        .setDescription(`Congratulations **${user.displayName}**! You've reached level **${newLevel}**!`)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();
}

// Helper functions
export function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

export function progressBar(current: number, max: number, length: number = 10): string {
    const filled = Math.round((current / max) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}
