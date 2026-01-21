import axios from 'axios';
import { logger } from '../utils/logger.js';

// Reddit API client for fetching content
class RedditClient {
    private baseUrl = 'https://www.reddit.com';

    async getRandomPost(subreddit: string): Promise<{
        title: string;
        url: string;
        permalink: string;
        author: string;
        isImage: boolean;
        isNsfw: boolean;
    } | null> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/r/${subreddit}/random.json`,
                {
                    headers: {
                        'User-Agent': 'MimiSan Discord Bot/1.0',
                    },
                    timeout: 10000,
                }
            );

            // Reddit's random returns an array with the post data
            const data = Array.isArray(response.data)
                ? response.data[0].data.children[0].data
                : response.data.data.children[0].data;

            const url = data.url as string;
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) ||
                url.includes('i.redd.it') ||
                url.includes('i.imgur.com');

            return {
                title: data.title,
                url: data.url,
                permalink: `https://reddit.com${data.permalink}`,
                author: data.author,
                isImage,
                isNsfw: data.over_18,
            };
        } catch (error) {
            logger.error(`Failed to fetch from r/${subreddit}:`, error);
            return null;
        }
    }

    async getMeme(): Promise<{ title: string; url: string; author: string } | null> {
        const memeSubreddits = ['memes', 'dankmemes', 'me_irl', 'wholesomememes'];
        const subreddit = memeSubreddits[Math.floor(Math.random() * memeSubreddits.length)];

        const post = await this.getRandomPost(subreddit);
        if (!post || !post.isImage || post.isNsfw) {
            return null;
        }

        return {
            title: post.title,
            url: post.url,
            author: post.author,
        };
    }

    async getAww(): Promise<{ title: string; url: string } | null> {
        const post = await this.getRandomPost('aww');
        if (!post || !post.isImage) return null;
        return { title: post.title, url: post.url };
    }
}

export const redditApi = new RedditClient();

// Giphy-like random GIF fetcher (using public APIs)
export async function getRandomCatImage(): Promise<string | null> {
    try {
        const response = await axios.get('https://api.thecatapi.com/v1/images/search');
        return response.data[0]?.url ?? null;
    } catch (error) {
        logger.error('Failed to fetch cat image:', error);
        return null;
    }
}

export async function getRandomDogImage(): Promise<string | null> {
    try {
        const response = await axios.get('https://dog.ceo/api/breeds/image/random');
        return response.data?.message ?? null;
    } catch (error) {
        logger.error('Failed to fetch dog image:', error);
        return null;
    }
}

export async function getRandomFoxImage(): Promise<string | null> {
    try {
        const response = await axios.get('https://randomfox.ca/floof/');
        return response.data?.image ?? null;
    } catch (error) {
        logger.error('Failed to fetch fox image:', error);
        return null;
    }
}

// Joke APIs
export async function getRandomJoke(): Promise<{ setup: string; punchline: string } | null> {
    try {
        const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
        return {
            setup: response.data.setup,
            punchline: response.data.punchline,
        };
    } catch (error) {
        logger.error('Failed to fetch joke:', error);
        return null;
    }
}

export async function getRandomQuote(): Promise<{ quote: string; author: string } | null> {
    try {
        const response = await axios.get('https://api.quotable.io/random');
        return {
            quote: response.data.content,
            author: response.data.author,
        };
    } catch (error) {
        logger.error('Failed to fetch quote:', error);
        return null;
    }
}

// Urban Dictionary
export async function urbanDefine(term: string): Promise<{
    word: string;
    definition: string;
    example: string;
    thumbsUp: number;
    thumbsDown: number;
} | null> {
    try {
        const response = await axios.get(
            `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`
        );

        const definitions = response.data.list;
        if (!definitions || definitions.length === 0) return null;

        const def = definitions[0];
        return {
            word: def.word,
            definition: def.definition.replace(/\[|\]/g, ''),
            example: def.example?.replace(/\[|\]/g, '') ?? '',
            thumbsUp: def.thumbs_up,
            thumbsDown: def.thumbs_down,
        };
    } catch (error) {
        logger.error(`Failed to define "${term}":`, error);
        return null;
    }
}
