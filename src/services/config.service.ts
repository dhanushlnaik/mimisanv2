import { query } from '../database/index.js';
import { logger } from '../utils/logger.js';

export interface ServerConfig {
    guild_id: string;
    xp_rate_chat: number;
    xp_rate_vc: number;
    xp_mode: 'balanced' | 'chat' | 'vc';
    salary_base: number;
    salary_mode: 'linear' | 'tiered';
    salary_data: Record<string, number>;
    dungeons_enabled: boolean;
    casino_enabled: boolean;
    market_enabled: boolean;
    dungeon_difficulty: number;
    treasure_frequency: 'low' | 'medium' | 'high';
    xp_channel_mode: 'whitelist' | 'blacklist';
    xp_channels: string[];
    created_at: Date;
    updated_at: Date;
}

const defaultConfig: Omit<ServerConfig, 'guild_id' | 'created_at' | 'updated_at'> = {
    xp_rate_chat: 1.0,
    xp_rate_vc: 1.0,
    xp_mode: 'balanced',
    salary_base: 50,
    salary_mode: 'linear',
    salary_data: {},
    dungeons_enabled: true,
    casino_enabled: true,
    market_enabled: true,
    dungeon_difficulty: 1.0,
    treasure_frequency: 'medium',
    xp_channel_mode: 'blacklist',
    xp_channels: []
};

// Get server config
export async function getServerConfig(guildId: string): Promise<ServerConfig> {
    const result = await query<ServerConfig>(
        'SELECT * FROM server_configs WHERE guild_id = $1',
        [guildId]
    );

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    // Create default
    return createServerConfig(guildId);
}

// Create default config
export async function createServerConfig(guildId: string): Promise<ServerConfig> {
    // Ensure guild_settings exists first (FK constraint)
    // We assume guild_settings is created via GuildService independently or we handle it here?
    // FK references guild_settings(guild_id). So guild_settings MUST exist.
    // Usually created on guildJoin or first command.

    // We try to insert. If it fails due to FK, we might need to create guild_settings.
    // For now assume guild_settings exists or let it error.

    const result = await query<ServerConfig>(
        `INSERT INTO server_configs (
            guild_id, xp_rate_chat, xp_rate_vc, xp_mode,
            salary_base, salary_mode, salary_data,
            dungeons_enabled, casino_enabled, market_enabled,
            dungeon_difficulty, treasure_frequency,
            xp_channel_mode, xp_channels
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (guild_id) DO NOTHING
        RETURNING *`,
        [
            guildId,
            defaultConfig.xp_rate_chat,
            defaultConfig.xp_rate_vc,
            defaultConfig.xp_mode,
            defaultConfig.salary_base,
            defaultConfig.salary_mode,
            defaultConfig.salary_data,
            defaultConfig.dungeons_enabled,
            defaultConfig.casino_enabled,
            defaultConfig.market_enabled,
            defaultConfig.dungeon_difficulty,
            defaultConfig.treasure_frequency,
            defaultConfig.xp_channel_mode,
            defaultConfig.xp_channels
        ]
    );

    if (result.rows.length === 0) {
        // Already exists (race condition)
        return getServerConfig(guildId);
    }

    logger.debug(`Created server config for guild ${guildId}`);
    return result.rows[0];
}

// Update generic config
export async function updateServerConfig(
    guildId: string,
    data: Partial<Omit<ServerConfig, 'guild_id' | 'created_at' | 'updated_at'>>
): Promise<ServerConfig> {
    const features = Object.keys(data);
    if (features.length === 0) return getServerConfig(guildId);

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const key of features) {
        sets.push(`${key} = $${i}`);
        values.push((data as any)[key]);
        i++;
    }

    values.push(guildId);

    const result = await query<ServerConfig>(
        `UPDATE server_configs SET ${sets.join(', ')}, updated_at = NOW()
         WHERE guild_id = $${i}
         RETURNING *`,
        values
    );

    if (result.rows.length === 0) {
        // Create and then update?
        await createServerConfig(guildId);
        return updateServerConfig(guildId, data);
    }

    return result.rows[0];
}
