# TESSERACT Bot 🤖

A comprehensive Discord bot featuring advanced moderation, utility commands, music playback, and engaging member features. TESSERACT is designed to enhance your Discord server with powerful automation and entertaining functionality.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Setup & Configuration](#setup--configuration)
- [Commands](#commands)
  - [Moderation Commands](#moderation-commands)
  - [Utility Commands](#utility-commands)
  - [Music Commands](#music-commands)
  - [Fun Commands](#fun-commands)
  - [Admin Commands](#admin-commands)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Features

### 🛡️ Advanced Moderation
- **User Management**: Kick, ban, timeout, and mute members
- **Message Management**: Purge/bulk delete messages, filter spam
- **Automod**: Automatic detection and handling of rule violations
- **Logging**: Comprehensive audit logs for all moderation actions

### 🎵 Music Playback
- **Queue Management**: Add, remove, and reorder songs in the queue
- **Playback Control**: Play, pause, resume, skip, and stop functionality
- **Multiple Platforms**: Support for YouTube, Spotify, and SoundCloud
- **Now Playing**: Display currently playing track with artist information
- **Playlist Support**: Create and manage custom playlists

### 🛠️ Utility Commands
- **Server Info**: Detailed server statistics and information
- **User Info**: Profile information, join date, and role details
- **Ping**: Check bot latency and response time
- **Help System**: Comprehensive command documentation
- **Role Management**: Assign and manage roles easily

### 🎮 Fun & Engagement
- **Games**: Interactive games including trivia, word games, and more
- **Reactions**: Fun reaction-based commands
- **Welcome Messages**: Customizable member welcome system
- **Member Profiles**: Track member statistics and achievements

### ⚙️ Admin Features
- **Custom Prefix**: Set server-specific command prefix
- **Auto-Moderation**: Configure automatic moderation rules
- **Role Reactions**: Assign roles through reactions
- **Welcome Channel Setup**: Configure welcome and farewell messages
- **Logging Configuration**: Customize what gets logged

---

## Installation

### Prerequisites

- **Python 3.8+** - Download from [python.org](https://www.python.org/downloads/)
- **Discord Bot Token** - Create an application at [Discord Developer Portal](https://discord.com/developers/applications)
- **Git** - For cloning the repository

### Step 1: Clone the Repository

```bash
git clone https://github.com/silenceisdiscpline/Discordbot.git
cd Discordbot
```

### Step 2: Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Create Configuration Files

Create a `.env` file in the root directory:

```env
DISCORD_TOKEN=your_bot_token_here
PREFIX=!
DATABASE_URL=sqlite:///bot.db
DEBUG=False
```

### Step 5: Run the Bot

```bash
python main.py
```

You should see output indicating the bot has connected successfully:
```
Bot is ready! Logged in as TESSERACT#1234
```

---

## Setup & Configuration

### Discord Developer Portal Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "TESSERACT"
3. Go to the "Bot" tab and click "Add Bot"
4. Under the TOKEN section, click "Copy" to copy your bot token
5. Paste the token into your `.env` file

### Bot Permissions

Ensure your bot has these permissions in your server:

- **General**: View Channels, Read Message History, Manage Messages
- **Text**: Send Messages, Embed Links, Attach Files, Read Message History
- **Voice**: Connect, Speak, Use Voice Activity
- **Moderation**: Manage Roles, Manage Messages, Ban Members, Kick Members, Timeout Members

**Recommended Permission Integer**: `8` (Administrator) for full functionality

### Invite Your Bot

Use this link format with your Client ID:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot
```

### Server Configuration

After inviting the bot, configure it using:

```
!setup          - Run initial server setup
!prefix <new>   - Change command prefix
!settings       - View current server settings
!logs <channel> - Set logging channel
```

---

## Commands

### Moderation Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `kick` | `!kick @user [reason]` | Kick a user from the server |
| `ban` | `!ban @user [reason]` | Permanently ban a user |
| `unban` | `!unban username#0000 [reason]` | Unban a previously banned user |
| `mute` | `!mute @user [duration] [reason]` | Mute a user for a specified duration |
| `unmute` | `!unmute @user` | Unmute a muted user |
| `warn` | `!warn @user [reason]` | Warn a user (3 warns = auto-kick) |
| `purge` | `!purge <number>` | Delete the last N messages |
| `lockdown` | `!lockdown [duration]` | Lock the channel (prevent messages) |
| `unlock` | `!unlock` | Unlock the channel |

### Utility Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `help` | `!help [command]` | Show available commands |
| `ping` | `!ping` | Check bot latency |
| `serverinfo` | `!serverinfo` | Get server statistics |
| `userinfo` | `!userinfo [@user]` | Get user profile information |
| `avatar` | `!avatar [@user]` | Display user's avatar |
| `role` | `!role <action> @user <role>` | Manage user roles |
| `prefix` | `!prefix <new>` | Change server command prefix |
| `stats` | `!stats` | View bot statistics |

### Music Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `play` | `!play <song/URL>` | Play a song or add to queue |
| `pause` | `!pause` | Pause current playback |
| `resume` | `!resume` | Resume paused playback |
| `skip` | `!skip [count]` | Skip to next song |
| `stop` | `!stop` | Stop music and clear queue |
| `queue` | `!queue [page]` | Display song queue |
| `nowplaying` | `!nowplaying` | Show currently playing track |
| `volume` | `!volume <0-100>` | Adjust playback volume |
| `shuffle` | `!shuffle` | Shuffle the queue |
| `remove` | `!remove <position>` | Remove song from queue |

### Fun Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `8ball` | `!8ball <question>` | Ask the magic 8-ball |
| `dice` | `!dice [sides]` | Roll a dice |
| `coin` | `!coin` | Flip a coin |
| `joke` | `!joke` | Get a random joke |
| `meme` | `!meme` | Get a random meme |
| `trivia` | `!trivia` | Start a trivia game |
| `rps` | `!rps <rock/paper/scissors>` | Play rock-paper-scissors |

### Admin Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `settings` | `!settings` | View all server settings |
| `logs` | `!logs <channel>` | Set logging channel |
| `welcome` | `!welcome <channel> [message]` | Configure welcome messages |
| `autorole` | `!autorole <role>` | Set auto-role for new members |
| `modrole` | `!modrole <role>` | Set moderator role |
| `reload` | `!reload` | Reload all cogs (Owner only) |
| `shutdown` | `!shutdown` | Shut down the bot (Owner only) |

---

## Contributing

We welcome contributions to TESSERACT! Here's how to get involved:

### Guidelines

1. **Fork the Repository**
   ```bash
   # Visit https://github.com/silenceisdiscpline/Discordbot and click "Fork"
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow PEP 8 style guidelines
   - Add comments for complex logic
   - Test thoroughly before submitting

4. **Commit Your Changes**
   ```bash
   git commit -m "Add: Brief description of changes"
   ```
   
   Use conventional commit prefixes:
   - `Add:` - New feature
   - `Fix:` - Bug fix
   - `Refactor:` - Code improvement
   - `Docs:` - Documentation update
   - `Test:` - Test additions
   - `Chore:` - Maintenance tasks

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Ensure all tests pass

### Code Standards

- **Python Version**: 3.8+
- **Formatter**: Black
- **Linter**: Flake8
- **Docstrings**: Follow Google-style docstrings

Example:
```python
def example_function(param1, param2):
    """Brief description of function.
    
    Longer description explaining the functionality in more detail.
    
    Args:
        param1 (str): Description of param1
        param2 (int): Description of param2
        
    Returns:
        bool: Description of return value
    """
    pass
```

### Testing

Before submitting a PR:

```bash
# Run tests
python -m pytest

# Check code style
flake8 .

# Format code
black .
```

### Issues & Bug Reports

Report bugs by creating an issue on GitHub with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Python/discord.py versions
- Operating system

---

## File Structure

```
Discordbot/
├── main.py                 # Bot entry point
├── cogs/                   # Command modules
│   ├── moderation.py
│   ├── music.py
│   ├── utility.py
│   ├── fun.py
│   └── admin.py
├── utils/                  # Utility functions
│   ├── config.py
│   ├── database.py
│   └── helpers.py
├── requirements.txt        # Python dependencies
├── .env.example           # Example environment configuration
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

---

## Requirements

Core dependencies (see `requirements.txt`):

- `discord.py` - Discord API wrapper
- `python-dotenv` - Environment variable management
- `sqlalchemy` - Database ORM
- `aiohttp` - Async HTTP requests
- `lavalink` - Music streaming
- `wavelink` - Lavalink wrapper

---

## Troubleshooting

### Bot Won't Start
- Verify your bot token is correct
- Check Python version (3.8+)
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check for permission errors

### Music Not Working
- Verify Lavalink server is running
- Check Java is installed (required for Lavalink)
- Verify bot is connected to a voice channel
- Check Lavalink configuration

### Commands Not Responding
- Verify bot has message permissions in the channel
- Check command prefix is correct
- Ensure bot role has necessary permissions
- Check bot isn't rate-limited

### Database Errors
- Delete `bot.db` to reset database
- Check database path in `.env` is correct
- Verify SQLite permissions

---

## Performance & Optimization

- **Caching**: Frequently accessed data is cached in memory
- **Rate Limiting**: Built-in rate limiting to prevent API throttling
- **Sharding**: Support for bot sharding for large servers
- **Async Operations**: All operations use async/await for efficiency

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

- **Discord Server**: [Join our support server]
- **Issues**: Report bugs on [GitHub Issues](https://github.com/silenceisdiscpline/Discordbot/issues)
- **Email**: Contact the developer
- **Documentation**: Full docs available at [docs link]

---

## Credits

Developed with ❤️ by **silenceisdiscpline**

Special thanks to:
- discord.py developers
- All contributors and testers
- The Discord developer community

---

## Changelog

### v1.0.0 (Current)
- Initial release
- Core moderation features
- Music playback system
- Utility and fun commands
- Admin configuration system

---

**Last Updated**: January 13, 2026

For the latest updates and information, visit the [GitHub repository](https://github.com/silenceisdiscpline/Discordbot).
