import { query } from '../database/index.js';
import { config } from '../config/index.js';
import type { GuildSettings } from '../client.js';
import { logger } from '../utils/logger.js';

// In-memory cache for guild settings
const settingsCache = new Map<string, GuildSettings>();

// Default settings
const defaultSettings: Omit<GuildSettings, 'guild_id' | 'created_at' | 'updated_at'> = {
    prefix: config.defaultPrefix,
    welcome_channel_id: null,
    afk_channel_id: null,
    todo_channel_id: null,
    enabled_modules: ['fun', 'games', 'actions', 'utility'],
    afk_enabled: true,
    leveling_enabled: true,
    welcome_enabled: false,
};

// Get guild settings (with cache)
export async function getGuildSettings(guildId: string): Promise<GuildSettings> {
    // Check cache first
    if (settingsCache.has(guildId)) {
        return settingsCache.get(guildId)!;
    }

    // Query database
    const result = await query<GuildSettings>(
        'SELECT * FROM guild_settings WHERE guild_id = $1',
        [guildId]
    );

    if (result.rows.length > 0) {
        const settings = result.rows[0];
        settingsCache.set(guildId, settings);
        return settings;
    }

    // Create default settings
    return createGuildSettings(guildId);
}

// Create default settings for a guild
export async function createGuildSettings(guildId: string): Promise<GuildSettings> {
    const result = await query<GuildSettings>(
        `INSERT INTO guild_settings (guild_id, prefix, enabled_modules, afk_enabled, leveling_enabled)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (guild_id) DO UPDATE SET guild_id = $1
     RETURNING *`,
        [
            guildId,
            defaultSettings.prefix,
            JSON.stringify(defaultSettings.enabled_modules),
            defaultSettings.afk_enabled,
            defaultSettings.leveling_enabled,
        ]
    );

    const settings = result.rows[0];
    settingsCache.set(guildId, settings);
    logger.debug(`Created default settings for guild ${guildId}`);
    return settings;
}

// Update guild prefix
export async function updatePrefix(guildId: string, prefix: string): Promise<GuildSettings> {
    const result = await query<GuildSettings>(
        `UPDATE guild_settings SET prefix = $2, updated_at = NOW() WHERE guild_id = $1 RETURNING *`,
        [guildId, prefix]
    );

    if (result.rows.length === 0) {
        // Settings don't exist, create and then update
        await createGuildSettings(guildId);
        return updatePrefix(guildId, prefix);
    }

    const settings = result.rows[0];
    settingsCache.set(guildId, settings);
    return settings;
}

// Update enabled modules
export async function updateEnabledModules(
    guildId: string,
    modules: string[]
): Promise<GuildSettings> {
    const result = await query<GuildSettings>(
        `UPDATE guild_settings SET enabled_modules = $2, updated_at = NOW() WHERE guild_id = $1 RETURNING *`,
        [guildId, JSON.stringify(modules)]
    );

    const settings = result.rows[0];
    settingsCache.set(guildId, settings);
    return settings;
}

// Update welcome channel
export async function updateWelcomeChannel(
    guildId: string,
    channelId: string | null
): Promise<GuildSettings> {
    const result = await query<GuildSettings>(
        `UPDATE guild_settings SET welcome_channel_id = $2, welcome_enabled = $3, updated_at = NOW() 
     WHERE guild_id = $1 RETURNING *`,
        [guildId, channelId, channelId !== null]
    );

    const settings = result.rows[0];
    settingsCache.set(guildId, settings);
    return settings;
}

// Toggle leveling
export async function toggleLeveling(guildId: string, enabled: boolean): Promise<GuildSettings> {
    const result = await query<GuildSettings>(
        `UPDATE guild_settings SET leveling_enabled = $2, updated_at = NOW() WHERE guild_id = $1 RETURNING *`,
        [guildId, enabled]
    );

    const settings = result.rows[0];
    settingsCache.set(guildId, settings);
    return settings;
}

// Toggle AFK system
export async function toggleAfk(guildId: string, enabled: boolean): Promise<GuildSettings> {
    const result = await query<GuildSettings>(
        `UPDATE guild_settings SET afk_enabled = $2, updated_at = NOW() WHERE guild_id = $1 RETURNING *`,
        [guildId, enabled]
    );

    const settings = result.rows[0];
    settingsCache.set(guildId, settings);
    return settings;
}

// Check if module is enabled
export async function isModuleEnabled(guildId: string, module: string): Promise<boolean> {
    const settings = await getGuildSettings(guildId);
    return settings.enabled_modules.includes(module);
}

// Clear cache for a guild (useful when settings change externally)
export function clearCache(guildId: string): void {
    settingsCache.delete(guildId);
}

// Clear entire cache
export function clearAllCache(): void {
    settingsCache.clear();
}
