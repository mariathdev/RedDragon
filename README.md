![Red Dragon Banner](assets/banner.webp)

# Red Dragon Bot

Discord bot written in Node.js with discord.js v14 and Lavalink v4.
Supports music playback (YouTube, Spotify), RPG dice rolling, and server utilities.

---

## Requirements

- Node.js 18+
- A running [Lavalink v4](https://github.com/lavalink-devs/Lavalink) server
- A Discord application with bot token

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/mariathdev/RedDragon.git
cd RedDragon
npm install
```

### 2. Configure environment

Create a `.env` file at the project root:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_client_id
DISCORD_GUILD_ID=your_development_guild_id

LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false
LAVALINK_NODE_ID=Main Node
LAVALINK_DEFAULT_SEARCH=ytmsearch

# Optional — Spotify support
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Optional — GIF integration
GIF_API_KEY=your_klipy_api_key
```

### 3. Start Lavalink

```bash
# Windows
lavalink/start-lavalink.ps1

# Or manually
java -jar lavalink/Lavalink.jar
```

### 4. Deploy slash commands

```bash
npm run deploy
```

### 5. Start the bot

```bash
npm start
```

---

## Commands

### Music
| Command | Description |
|---------|-------------|
| `/play` | Play or enqueue a track (YouTube / Spotify) |
| `/pause` | Pause playback |
| `/resume` | Resume playback |
| `/skip` | Skip current track |
| `/stop` | Stop and clear queue |
| `/queue` | Show queue with pagination |
| `/disconnect` | Leave the voice channel |

### Dice
| Command | Description |
|---------|-------------|
| `/roll` | Roll dice using RPG notation (e.g. `2d6+3`) |

### Utilities
| Command | Description |
|---------|-------------|
| `/ping` | Show bot latency |
| `/status` | Show uptime and metrics |
| `/help` | List all commands |

---

## Validation

```bash
# Syntax check all JS files
npm run check

# Run the Ralph Loop validation
npm run validate
```

---

## License

MIT
