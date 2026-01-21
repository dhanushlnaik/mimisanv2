# MimiSan Discord Bot 🤖

A feature-rich, multi-guild Discord bot focused on entertainment, social simulation, media generation, and server utilities.

## Features

- 🎮 **Games** - Rock Paper Scissors, Truth or Dare, Would You Rather
- 💕 **Actions** - Hug, Kiss, Slap, Pat with GIFs
- 🎉 **Fun** - Cat/Dog images, Memes, Ship calculator
- 📊 **Leveling** - XP system with ranks and leaderboards
- 💰 **Economy** - Currency system with daily rewards
- ⚙️ **Utility** - AFK system, custom prefixes, and more

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Weeby API Token (optional, for premium GIFs)

## Setup

1. **Clone and install dependencies**
   ```bash
   cd mimisan
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your tokens
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb mimisan
   
   # Run migrations
   npm run db:migrate
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy-commands
   ```

5. **Start the bot**
   ```bash
   # Development (with hot reload)
   npm run dev
   
   # Production
   npm run build && npm start
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ | Discord application client ID |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `WEEBY_API_TOKEN` | ❌ | Weeby API token for premium GIFs |
| `TOPGG_TOKEN` | ❌ | Top.gg token for vote tracking |
| `DEFAULT_PREFIX` | ❌ | Default prefix (default: `!`) |

## Commands

### Utility
- `/ping` - Check bot latency
- `/afk [reason]` - Set AFK status
- `/avatar [user]` - Get user avatar
- `/prefix [new]` - View/change server prefix
- `/help [command]` - View commands

### Actions
- `/hug @user` - Give someone a hug
- `/kiss @user` - Give someone a kiss
- `/slap @user` - Slap someone
- `/pat @user` - Pat someone

### Fun
- `/cat` - Random cat image
- `/dog` - Random dog image
- `/meme` - Random Reddit meme
- `/ship @user1 [@user2]` - Love compatibility

### Games
- `/rps [choice]` - Rock Paper Scissors
- `/truth` - Get a truth question
- `/dare` - Get a dare challenge
- `/wyr` - Would You Rather

### Leveling
- `/rank [@user]` - Check rank
- `/leaderboard` - Server leaderboard

### Economy
- `/balance [@user]` - Check balance
- `/daily` - Claim daily coins
- `/pay @user <amount>` - Send coins

## Project Structure

```
src/
├── index.ts           # Entry point
├── client.ts          # Discord client
├── config/            # Configuration
├── commands/          # Command modules
├── events/            # Event handlers
├── services/          # Business logic
├── database/          # DB connection & migrations
├── api/               # External API clients
└── utils/             # Utilities
```

## License

MIT
