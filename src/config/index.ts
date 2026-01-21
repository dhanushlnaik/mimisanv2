import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Discord
    discordToken: process.env.DISCORD_TOKEN || '',
    discordClientId: process.env.DISCORD_CLIENT_ID || '',

    // Database
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/mimisan',

    // APIs
    weebyApiToken: process.env.WEEBY_API_TOKEN || '',
    topggToken: process.env.TOPGG_TOKEN || '',

    // Bot Settings
    defaultPrefix: process.env.DEFAULT_PREFIX || '!',
    nodeEnv: process.env.NODE_ENV || 'development',

    // Validation
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
};

// Validate required config
export function validateConfig(): void {
    const required: (keyof typeof config)[] = ['discordToken', 'discordClientId'];
    const missing = required.filter((key) => !config[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
