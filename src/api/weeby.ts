import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class WeebyClient {
    private client: AxiosInstance;
    private hasToken: boolean;
    private token: string;

    constructor() {
        this.token = config.weebyApiToken || '';
        this.hasToken = !!this.token;

        this.client = axios.create({
            baseURL: 'https://weebyapi.xyz',
            timeout: 10000,
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 429) {
                    logger.warn('Weeby API rate limit hit');
                }
                throw error;
            }
        );
    }

    public isConfigured(): boolean {
        return this.hasToken;
    }

    // GIF endpoints
    async getGif(type: string): Promise<string | null> {
        if (!this.hasToken) return null;

        try {
            const response = await this.client.get(`/gif/${type}`);
            return response.data.url;
        } catch (error) {
            logger.error(`Failed to get GIF (${type}):`, error);
            return null;
        }
    }

    // Action GIFs
    async actionGif(
        action: 'hug' | 'kiss' | 'slap' | 'pat' | 'punch' | 'bite' | 'cuddle' | 'poke' | 'tickle' | 'wave' |
            'boop' | 'bonk' | 'brofist' | 'handhold' | 'highfive' | 'kick' | 'lick' | 'stare' | 'tease' | 'whisper' | 'wink' |
            'blush' | 'angry' | 'baka' | 'clap' | 'confused' | 'cringe' | 'cry' | 'dab' | 'dance' | 'facepalm' |
            'grin' | 'grumpy' | 'happy' | 'hate' | 'hide' | 'laugh' | 'no' | 'nom' | 'panic' | 'pout' | 'shrug' | 'yes'
    ): Promise<string | null> {
        return this.getGif(action);
    }

    // Random animal images
    async randomAnimal(animal: 'cat' | 'dog' | 'bird' | 'fox' | 'panda'): Promise<string | null> {
        if (!this.hasToken) return null;

        try {
            const response = await this.client.get(`/json/${animal}`);
            return response.data.url;
        } catch (error) {
            logger.error(`Failed to get animal image (${animal}):`, error);
            return null;
        }
    }

    // Word generators
    async randomWord(type: 'advice' | 'joke' | 'quote' | 'fact'): Promise<string | null> {
        if (!this.hasToken) return null;

        try {
            const response = await this.client.get(`/json/${type}`);
            return response.data[type] || response.data.response;
        } catch (error) {
            logger.error(`Failed to get random word (${type}):`, error);
            return null;
        }
    }

    // Image generators
    async generateImage(
        generator: string,
        options: Record<string, string>
    ): Promise<Buffer | null> {
        if (!this.hasToken) return null;

        try {
            const params = new URLSearchParams({
                ...options,
                token: this.token
            });
            const response = await this.client.get(`/generators/${generator}?${params}`, {
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        } catch (error) {
            logger.error(`Failed to generate image (${generator}):`, error);
            return null;
        }
    }

    // Effects
    async applyEffect(
        effect: string,
        imageUrl: string
    ): Promise<Buffer | null> {
        if (!this.hasToken) return null;

        try {
            const response = await this.client.get(`/effects/${effect}`, {
                params: { image: imageUrl },
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        } catch (error) {
            logger.error(`Failed to apply effect (${effect}):`, error);
            return null;
        }
    }

    // Overlays
    async applyOverlay(
        overlay: string,
        imageUrl: string
    ): Promise<Buffer | null> {
        if (!this.hasToken) return null;

        try {
            const response = await this.client.get(`/overlays/${overlay}`, {
                params: { image: imageUrl },
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        } catch (error) {
            logger.error(`Failed to apply overlay (${overlay}):`, error);
            return null;
        }
    }

    // Greeting card
    async createGreetingCard(options: {
        type: 'welcome' | 'goodbye' | 'booster';
        username: string;
        avatar: string;
        discriminator?: string;
        guildName?: string;
        memberCount?: number;
    }): Promise<Buffer | null> {
        if (!this.hasToken) return null;

        try {
            const response = await this.client.get(`/custom/${options.type}`, {
                params: {
                    username: options.username,
                    avatar: options.avatar,
                    discriminator: options.discriminator || '0',
                    guildName: options.guildName || 'Server',
                    memberCount: options.memberCount || 1,
                },
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        } catch (error) {
            logger.error(`Failed to create greeting card:`, error);
            return null;
        }
    }
}

export const weebyApi = new WeebyClient();

// Fallback GIF sources when Weeby is unavailable
export const fallbackGifs: Record<string, string[]> = {
    hug: [
        'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
        'https://media.giphy.com/media/wnsgren9NtITS/giphy.gif',
    ],
    kiss: [
        'https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif',
        'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif',
    ],
    slap: [
        'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
        'https://media.giphy.com/media/jLeyZWgtwgr2U/giphy.gif',
    ],
    pat: [
        'https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif',
        'https://media.giphy.com/media/4HP0ddZnNVvKU/giphy.gif',
    ],
};

export function getRandomFallbackGif(action: string): string | null {
    const gifs = fallbackGifs[action];
    if (!gifs || gifs.length === 0) return null;
    return gifs[Math.floor(Math.random() * gifs.length)];
}
