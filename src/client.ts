import {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    type ChatInputCommandInteraction,
    type Message,
    type SharedSlashCommand,
} from 'discord.js';

// Command execution context
export interface CommandContext {
    isSlash: boolean;
    interaction?: ChatInputCommandInteraction;
    message?: Message;
    args: string[];
    guildId: string | null;
    userId: string;
    prefix: string;
}

// Base command interface
export interface Command {
    data: SharedSlashCommand;
    aliases?: string[];  // For message commands
    cooldown?: number;   // Seconds
    module: 'fun' | 'games' | 'actions' | 'family' | 'economy' | 'leveling' | 'moderation' | 'utility';
    guildOnly?: boolean;
    adminOnly?: boolean;
    execute: (ctx: CommandContext, client: MimiClient) => Promise<void>;
}

// Extended Discord client
export class MimiClient extends Client {
    public commands: Collection<string, Command> = new Collection();
    public aliases: Collection<string, string> = new Collection();
    public cooldowns: Collection<string, Collection<string, number>> = new Collection();

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.User,
            ],
        });
    }

    public registerCommand(command: Command): void {
        this.commands.set(command.data.name, command);

        // Register aliases
        if (command.aliases) {
            for (const alias of command.aliases) {
                this.aliases.set(alias, command.data.name);
            }
        }
    }

    public getCommand(name: string): Command | undefined {
        return this.commands.get(name) || this.commands.get(this.aliases.get(name) || '');
    }
}

// Guild settings interface
export interface GuildSettings {
    guild_id: string;
    prefix: string;
    welcome_channel_id: string | null;
    afk_channel_id: string | null;
    todo_channel_id: string | null;
    enabled_modules: string[];
    afk_enabled: boolean;
    leveling_enabled: boolean;
    welcome_enabled: boolean;
    created_at: Date;
    updated_at: Date;
}

// User AFK status
export interface UserAfk {
    user_id: string;
    reason: string;
    since: Date;
}

// Relationship data
export type RelationshipState =
    | 'stranger'
    | 'acquaintance'
    | 'friend'
    | 'best_friend'
    | 'dating'
    | 'engaged'
    | 'married'
    | 'separated'
    | 'divorced';

export interface Relationship {
    id: number;
    guild_id: string;
    user_one_id: string;
    user_two_id: string;
    relationship_state: RelationshipState;
    trust: number;
    affection: number;
    stability: number;
    reputation: number;
    created_at: Date;
    updated_at: Date;
}

// User levels
export interface UserLevel {
    user_id: string;
    guild_id: string;
    xp: number;
    level: number;
    last_xp_at: Date;
}

// User currency
export interface UserCurrency {
    user_id: string;
    guild_id: string;
    balance: number;
    daily_claimed_at: Date | null;
}

// API Response types
export interface WeebyGifResponse {
    url: string;
}

// Global user data
export interface UserGlobal {
    user_id: string;
    global_xp: string; // BigInt
    global_level: number;
    reputation: number;
    balance: string; // BigInt
    total_earnings: string; // BigInt
    last_daily_at: Date | null;
    last_weekly_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface WeebyGeneratorResponse {
    url: string;
}
