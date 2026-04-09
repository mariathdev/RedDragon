# CLAUDE.md - Red Dragon Bot

## About the Project

Discord bot called **Red Dragon**, written in Node.js with discord.js v14.
Follows the Ralph Loop methodology for iterative development cycles
and the GSD (Get Shit Done) framework for spec-based organization.

---

## Color Palette (Dragon Palette)

All embeds and visual elements follow these colors, without exception.

| Token              | Hex       | Usage                                      |
|--------------------|-----------|---------------------------------------------|
| `DRAGON_BLOOD`     | `#8B2500` | Default embed borders, error states         |
| `FYRE_ORANGE`      | `#E66E1D` | Titles, highlights, warnings               |
| `EMBERS_GOLD`      | `#F9A602` | Numeric values, song names, data            |
| `DRACO_GREEN`      | `#27E13E` | Success, "Now Playing", bot online          |
| `OBSIDIAN_SCALE`   | `#1A0A05` | Dark backgrounds, shadows                  |

### Embed Rules

- Default color: `DRAGON_BLOOD`
- Success: `DRACO_GREEN`
- Warning: `FYRE_ORANGE`
- Footer always with bot name
- Thumbnail with `RedDragon.png` in main embeds
- Never use hex directly in commands, always via `config/constants.js`

---

## Directory Structure

```
red-dragon-bot/
  src/
    index.js                 -- Entry point, raw packet forwarder, boot sequence
    config/
      constants.js           -- Palette, metadata, intervals
      environment.js         -- Environment variable validation
    commands/
      ping.js                -- Bot latency
      help.js                -- Command list
      status.js              -- Uptime and metrics
      dice/
        roll.js              -- RPG dice roller
      music/
        play.js              -- Play / enqueue tracks (YouTube, Spotify)
        pause.js             -- Pause playback
        resume.js            -- Resume playback
        skip.js              -- Skip current track
        stop.js              -- Stop and clear queue
        queue.js             -- Display queue with pagination
        disconnect.js        -- Leave voice channel
    events/
      ready.js               -- Initialization, Lavalink node connection
      interactionCreate.js   -- Slash command routing
      messageCreate.js       -- Legacy prefix command bridge
      voiceStateUpdate.js    -- Bot disconnect detection
      error.js               -- Global client errors
    handlers/
      commandHandler.js      -- Dynamic command loading
      eventHandler.js        -- Dynamic event registration
    music/
      playerManager.js       -- Lavalink lifecycle, player CRUD, queue ops
      spotifyResolver.js     -- Spotify URL resolution via Web API
    utils/
      embedBuilder.js        -- Themed embed factory
      logger.js              -- Timestamped severity logger
      errorHandler.js        -- User-facing error formatting
      diceParser.js          -- Dice expression parser
      gifProvider.js         -- GIF API integration
      messageContext.js       -- Prefix-to-slash adapter
    loops/
      healthCheck.js         -- Periodic health monitoring
  assets/
    RedDragon.png            -- Avatar and thumbnail
  scripts/
    ralph-loop.sh            -- Iterative validation script
    deploy-commands.js       -- Slash command registration
  lavalink/
    application.yml          -- Lavalink server configuration
    start-lavalink.ps1       -- Lavalink startup script
  package.json
  CLAUDE.md                  -- This file
```

---

## Music Architecture (v2 -- Voice Packet Fix)

The v1 bug: bot connects, plays ~1 second, then goes silent.

**Root cause**: The `raw` event listener that forwards `VOICE_STATE_UPDATE`
and `VOICE_SERVER_UPDATE` packets to `LavalinkManager.sendRawData()` was
registered INSIDE `initLavalink()`, which ran in the `ready` event. This
created a race condition: voice handshake packets could arrive before the
listener existed, so Lavalink never received the voice server confirmation
and Discord dropped the audio stream.

**Fix (v2 boot sequence)**:

1. `index.js` registers `client.on('raw', ...)` BEFORE `client.login()`
2. `index.js` calls `createLavalinkManager(client)` BEFORE `client.login()`
   -- this instantiates `LavalinkManager` and attaches it to `client.lavalink`
   -- does NOT connect to the Lavalink TCP node (no `client.user.id` yet)
3. `client.login()` fires, Discord gateway connects
4. `ready` event calls `initLavalink()` which only does `lavalink.init()`
   to authenticate with the Lavalink node using `client.user.id`
5. When `/play` triggers `player.connect()`, the voice handshake packets
   flow through the already-registered `raw` listener to `sendRawData()`

This ensures zero packet loss during the voice handshake.

---

## Code Standards

### Conventions

- ES Modules (`"type": "module"`)
- Node.js 18+
- Files: `camelCase.js`
- Constants: `UPPER_SNAKE_CASE`
- Functions: `camelCase`
- No emojis in code or comments
- Short and objective comments

### Architectural Patterns

**Command Pattern** -- Each command exports `{ data, execute }`.
`data` is a `SlashCommandBuilder`, `execute` receives the interaction.

**Event Pattern** -- Each event exports `{ name, once?, execute }`.
The handler registers automatically on the client.

**Handler Pattern** -- Load modules from `commands/` and `events/` on boot.
Just place the file in the folder, no manual registration.

**Embed Factory** -- All embeds pass through `utils/embedBuilder.js`.
No command instantiates `EmbedBuilder` directly.

**Health Loop** -- `loops/healthCheck.js` checks bot state every 60s.

**Player Manager** -- Single module (`music/playerManager.js`) owns
the full Lavalink lifecycle: creation, init, connect, enqueue, resolve,
destroy. No scattered voice logic in events or commands.

### Error Handling

- All `async` in try/catch
- Logs via `utils/logger.js`, never direct `console.log`
- Errors to user via themed embed, without exposing stack trace
- Lavalink `trackError` and `trackStuck` events logged with full payload

---

## Environment Variables

```
DISCORD_TOKEN=            -- Bot token (required)
DISCORD_CLIENT_ID=        -- Application client ID (required)
DISCORD_GUILD_ID=         -- Development server ID (required)
LAVALINK_HOST=            -- Lavalink server hostname (required for music)
LAVALINK_PORT=            -- Lavalink server port (required for music)
LAVALINK_PASSWORD=        -- Lavalink server password (required for music)
LAVALINK_SECURE=          -- Use TLS for Lavalink (optional, default: false)
LAVALINK_NODE_ID=         -- Node identifier (optional, default: "Main Node")
LAVALINK_DEFAULT_SEARCH=  -- Search platform (optional, default: "ytmsearch")
SPOTIFY_CLIENT_ID=        -- Spotify app client ID (optional)
SPOTIFY_CLIENT_SECRET=    -- Spotify app client secret (optional)
GIF_API_KEY=              -- Klipy GIF API key (optional)
```

---

## Dependencies

| Package              | Version  | Function                        |
|---------------------|----------|--------------------------------|
| `discord.js`        | ^14.16.3 | Discord API wrapper            |
| `dotenv`            | ^16.4.7  | .env loading                   |
| `lavalink-client`   | ^2.10.0  | Lavalink v4 client             |
| `libsodium-wrappers`| ^0.7.15  | Voice encryption (optional)    |

---

## Validation (Ralph Loop)

The script `scripts/ralph-loop.sh` runs in loop:
1. Checks syntax of all `.js` with `node --check`
2. Verifies commands export `{ data, execute }`
3. Verifies events export `{ name, execute }`
4. Confirms absence of hardcoded hex in commands
5. Repeats until all pass or iteration limit reached

---

## What Not to Do

- Hardcode colors outside `constants.js`
- Use `console.log` instead of logger
- Create embeds without the factory
- Mix event logic inside command
- Use `require()` (project uses ESM)
- Add dependency without documenting here
- Register `raw` event listener after `client.login()`
- Create LavalinkManager inside an async event handler
