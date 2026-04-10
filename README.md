![Red Dragon Banner](assets/banner.webp)

# Red Dragon Bot

Discord bot written in Node.js with discord.js v14 and Lavalink v4.
Supports music playback, RPG dice rolling, and basic server utilities.

---

## Requirements

- Node.js 18+
- Lavalink v4 installed in `C:\Lavalink`
- A Discord application with a bot token

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
LAVALINK_PASSWORD=red-dragon
LAVALINK_SECURE=false
LAVALINK_NODE_ID=Main Node
LAVALINK_DEFAULT_SEARCH=ytmsearch

# Optional - Spotify support
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Optional - GIF integration
GIF_API_KEY=your_klipy_api_key
```

### 3. Start the stack

```bash
start.bat
```

`start.bat` installs missing Node dependencies, syncs `lavalink/application.yml` to `C:\Lavalink`, starts Lavalink, deploys slash commands, and then starts the bot.

If you prefer to start Lavalink manually, use:

```bash
java -jar C:\Lavalink\Lavalink.jar
```

### 4. Deploy slash commands only

```bash
npm run deploy
```

### 5. Start the bot only

```bash
npm start
```

---

## Commands

### Music
| Command | Description |
|---------|-------------|
| `/play` | Play or enqueue a track from YouTube or Spotify |
| `/pause` | Pause playback |
| `/resume` | Resume playback |
| `/skip` | Skip the current track |
| `/stop` | Stop playback and clear the queue |
| `/queue` | Show the queue with pagination |
| `/disconnect` | Leave the voice channel |

### Dice
| Command | Description |
|---------|-------------|
| `/roll` | Roll dice using RPG notation such as `2d6+3` |
| `/initiative` | Start an initiative session or roll initiative |
| `/end` | End the initiative session and show turn order |

### Utilities
| Command | Description |
|---------|-------------|
| `/ping` | Show bot latency |
| `/status` | Show uptime and basic metrics |
| `/help` | List all commands |

Prefix commands using `!` are also supported for the same command names, such as `!roll`, `!initiative`, `!end`, and `!play`.

---

## Validation

```bash
npm run check
```

---

## License

MIT
