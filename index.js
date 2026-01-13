const { Client, Collection, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database imports (supports sqlite, mongodb, or mysql)
const Database = require('better-sqlite3');

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Collection for commands
client.commands = new Collection();
client.slashCommands = new Collection();

// Bot prefix
const PREFIX = 'T';

// ======================
// DATABASE INITIALIZATION
// ======================

// Initialize SQLite Database for leveling, economy, and ranking
const dbPath = path.join(__dirname, 'data', 'bot.db');
const dbDir = path.join(__dirname, 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create Leveling Table
db.exec(`
  CREATE TABLE IF NOT EXISTS leveling (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT UNIQUE NOT NULL,
    guildId TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create Economy Table
db.exec(`
  CREATE TABLE IF NOT EXISTS economy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT UNIQUE NOT NULL,
    guildId TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    dailyStreak INTEGER DEFAULT 0,
    lastDaily DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create Ranking Table
db.exec(`
  CREATE TABLE IF NOT EXISTS ranking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT UNIQUE NOT NULL,
    guildId TEXT NOT NULL,
    rank INTEGER DEFAULT 0,
    badges TEXT DEFAULT '[]',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create Leaderboard Cache Table
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    type TEXT NOT NULL,
    cachedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guildId, type)
  )
`);

// Attach db to client for global access
client.db = db;

// Database helper functions
client.dbFunctions = {
  // Leveling functions
  getOrCreateUser: (userId, guildId) => {
    const user = db.prepare('SELECT * FROM leveling WHERE userId = ? AND guildId = ?').get(userId, guildId);
    if (!user) {
      db.prepare('INSERT INTO leveling (userId, guildId) VALUES (?, ?)').run(userId, guildId);
      return { userId, guildId, xp: 0, level: 1 };
    }
    return user;
  },

  addXp: (userId, guildId, amount) => {
    const user = client.dbFunctions.getOrCreateUser(userId, guildId);
    const newXp = user.xp + amount;
    const xpPerLevel = 100;
    const newLevel = Math.floor(newXp / xpPerLevel) + 1;
    
    db.prepare('UPDATE leveling SET xp = ?, level = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND guildId = ?')
      .run(newXp, newLevel, userId, guildId);
    
    return { oldLevel: user.level, newLevel, xp: newXp };
  },

  getUserLevel: (userId, guildId) => {
    const user = db.prepare('SELECT level, xp FROM leveling WHERE userId = ? AND guildId = ?').get(userId, guildId);
    return user || { level: 1, xp: 0 };
  },

  getLeaderboard: (guildId, limit = 10) => {
    return db.prepare('SELECT userId, level, xp FROM leveling WHERE guildId = ? ORDER BY level DESC, xp DESC LIMIT ?')
      .all(guildId, limit);
  },

  // Economy functions
  getOrCreateEconomy: (userId, guildId) => {
    const user = db.prepare('SELECT * FROM economy WHERE userId = ? AND guildId = ?').get(userId, guildId);
    if (!user) {
      db.prepare('INSERT INTO economy (userId, guildId) VALUES (?, ?)').run(userId, guildId);
      return { userId, guildId, balance: 0, bank: 0, dailyStreak: 0 };
    }
    return user;
  },

  addBalance: (userId, guildId, amount) => {
    const user = client.dbFunctions.getOrCreateEconomy(userId, guildId);
    const newBalance = Math.max(0, user.balance + amount);
    db.prepare('UPDATE economy SET balance = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND guildId = ?')
      .run(newBalance, userId, guildId);
    return newBalance;
  },

  setBalance: (userId, guildId, amount) => {
    client.dbFunctions.getOrCreateEconomy(userId, guildId);
    db.prepare('UPDATE economy SET balance = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND guildId = ?')
      .run(amount, userId, guildId);
    return amount;
  },

  getBalance: (userId, guildId) => {
    const user = db.prepare('SELECT balance, bank FROM economy WHERE userId = ? AND guildId = ?').get(userId, guildId);
    return user || { balance: 0, bank: 0 };
  },

  addBank: (userId, guildId, amount) => {
    const user = client.dbFunctions.getOrCreateEconomy(userId, guildId);
    const newBank = Math.max(0, user.bank + amount);
    db.prepare('UPDATE economy SET bank = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND guildId = ?')
      .run(newBank, userId, guildId);
    return newBank;
  },

  getEconomyLeaderboard: (guildId, limit = 10) => {
    return db.prepare('SELECT userId, balance, bank FROM economy WHERE guildId = ? ORDER BY (balance + bank) DESC LIMIT ?')
      .all(guildId, limit);
  },

  // Ranking functions
  getOrCreateRank: (userId, guildId) => {
    const user = db.prepare('SELECT * FROM ranking WHERE userId = ? AND guildId = ?').get(userId, guildId);
    if (!user) {
      db.prepare('INSERT INTO ranking (userId, guildId) VALUES (?, ?)').run(userId, guildId);
      return { userId, guildId, rank: 0, badges: [] };
    }
    return { ...user, badges: JSON.parse(user.badges || '[]') };
  },

  updateRank: (userId, guildId, newRank) => {
    db.prepare('UPDATE ranking SET rank = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND guildId = ?')
      .run(newRank, userId, guildId);
    return newRank;
  },

  addBadge: (userId, guildId, badge) => {
    const user = client.dbFunctions.getOrCreateRank(userId, guildId);
    if (!user.badges.includes(badge)) {
      user.badges.push(badge);
      db.prepare('UPDATE ranking SET badges = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND guildId = ?')
        .run(JSON.stringify(user.badges), userId, guildId);
    }
    return user.badges;
  },

  getRankLeaderboard: (guildId, limit = 10) => {
    return db.prepare('SELECT userId, rank FROM ranking WHERE guildId = ? ORDER BY rank DESC LIMIT ?')
      .all(guildId, limit);
  },
};

// ======================
// COMMAND LOADER
// ======================

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (command.data) {
      client.slashCommands.set(command.data.name, command);
    }
    if (command.name) {
      client.commands.set(command.name, command);
    }
  }
}

// ======================
// EVENT HANDLERS
// ======================

// Ready Event
client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
  
  // Set bot status
  client.user.setPresence({
    activities: [{ name: 'T help | Made with ❤️', type: 'PLAYING' }],
    status: 'online',
  });
});

// Message Create Event (Prefix Commands)
client.on('messageCreate', async (message) => {
  // Ignore bot messages and DMs
  if (message.author.bot || !message.guild) return;

  // Check if message starts with prefix
  if (!message.content.startsWith(PREFIX)) return;

  // Extract command and arguments
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Handle help command
  if (commandName === 'help') {
    return sendHelpMenu(message);
  }

  // Get command from collection
  const command = client.commands.get(commandName);

  if (!command) {
    return message.reply({
      content: `❌ Unknown command. Use \`${PREFIX}help\` for available commands.`,
      ephemeral: true,
    });
  }

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    message.reply({
      content: '❌ An error occurred while executing this command.',
      ephemeral: true,
    });
  }
});

// Interaction Create Event (Slash Commands & Components)
client.on('interactionCreate', async (interaction) => {
  // Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const slashCommand = client.slashCommands.get(interaction.commandName);

    if (!slashCommand) {
      return interaction.reply({
        content: '❌ This command is no longer available.',
        ephemeral: true,
      });
    }

    try {
      await slashCommand.execute(interaction, client);
    } catch (error) {
      console.error(`Error executing slash command ${interaction.commandName}:`, error);
      await interaction.reply({
        content: '❌ An error occurred while executing this command.',
        ephemeral: true,
      });
    }
  }

  // Handle Select Menu
  if (interaction.isStringSelectMenu()) {
    const selected = interaction.values[0];
    await handleHelpMenuSelection(interaction, selected);
  }
});

// GuildMemberAdd Event (Initialize user data)
client.on('guildMemberAdd', async (member) => {
  try {
    client.dbFunctions.getOrCreateUser(member.id, member.guild.id);
    client.dbFunctions.getOrCreateEconomy(member.id, member.guild.id);
    client.dbFunctions.getOrCreateRank(member.id, member.guild.id);
  } catch (error) {
    console.error('Error initializing new member data:', error);
  }
});

// ======================
// HELP MENU FUNCTIONS
// ======================

async function sendHelpMenu(message) {
  const helpEmbed = new EmbedBuilder()
    .setColor('#2F3136')
    .setTitle('🤖 TESSERACT Bot Help Menu')
    .setDescription('Select a category from the dropdown below to learn more!')
    .addFields(
      { name: '📚 Categories', value: '• Leveling\n• Economy\n• Ranking\n• Utility\n• Fun', inline: false }
    )
    .setFooter({ text: `Prefix: ${PREFIX} | Use ${PREFIX}help <command> for more info` })
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_menu')
    .setPlaceholder('Choose a category...')
    .addOptions(
      {
        label: 'Leveling',
        description: 'Commands for leveling system',
        value: 'leveling',
        emoji: '📈',
      },
      {
        label: 'Economy',
        description: 'Commands for economy system',
        value: 'economy',
        emoji: '💰',
      },
      {
        label: 'Ranking',
        description: 'Commands for ranking system',
        value: 'ranking',
        emoji: '🏆',
      },
      {
        label: 'Utility',
        description: 'Utility commands',
        value: 'utility',
        emoji: '🔧',
      },
      {
        label: 'Fun',
        description: 'Fun commands',
        value: 'fun',
        emoji: '🎮',
      }
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await message.reply({
    embeds: [helpEmbed],
    components: [row],
  });
}

async function handleHelpMenuSelection(interaction, selected) {
  let embed;

  switch (selected) {
    case 'leveling':
      embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('📈 Leveling Commands')
        .addFields(
          { name: `${PREFIX}level`, value: 'View your current level and XP', inline: true },
          { name: `${PREFIX}rank`, value: 'View your rank', inline: true },
          { name: `${PREFIX}leaderboard`, value: 'View the leveling leaderboard', inline: true }
        )
        .setDescription('Gain XP by chatting in the server!')
        .setFooter({ text: '100 XP per level' });
      break;

    case 'economy':
      embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💰 Economy Commands')
        .addFields(
          { name: `${PREFIX}balance`, value: 'Check your balance', inline: true },
          { name: `${PREFIX}daily`, value: 'Claim your daily reward', inline: true },
          { name: `${PREFIX}work`, value: 'Work to earn coins', inline: true },
          { name: `${PREFIX}transfer`, value: 'Transfer coins to another user', inline: true },
          { name: `${PREFIX}shop`, value: 'View the shop', inline: true }
        )
        .setDescription('Earn and spend currency in the economy system!')
        .setFooter({ text: 'Currency: 🪙' });
      break;

    case 'ranking':
      embed = new EmbedBuilder()
        .setColor('#FF1493')
        .setTitle('🏆 Ranking Commands')
        .addFields(
          { name: `${PREFIX}stats`, value: 'View your stats', inline: true },
          { name: `${PREFIX}badges`, value: 'View your badges', inline: true },
          { name: `${PREFIX}rankings`, value: 'View the rankings', inline: true }
        )
        .setDescription('Earn badges and climb the rankings!')
        .setFooter({ text: 'Special achievements unlock badges' });
      break;

    case 'utility':
      embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🔧 Utility Commands')
        .addFields(
          { name: `${PREFIX}ping`, value: 'Check bot latency', inline: true },
          { name: `${PREFIX}info`, value: 'Bot information', inline: true },
          { name: `${PREFIX}serverinfo`, value: 'Server information', inline: true }
        )
        .setDescription('Useful commands for server management and info!')
        .setFooter({ text: 'More commands coming soon!' });
      break;

    case 'fun':
      embed = new EmbedBuilder()
        .setColor('#FF6347')
        .setTitle('🎮 Fun Commands')
        .addFields(
          { name: `${PREFIX}dice`, value: 'Roll a dice', inline: true },
          { name: `${PREFIX}flip`, value: 'Flip a coin', inline: true },
          { name: `${PREFIX}8ball`, value: 'Ask a magic 8 ball', inline: true }
        )
        .setDescription('Have fun with these entertaining commands!')
        .setFooter({ text: 'Try them out!' });
      break;

    default:
      embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('Unknown category selected.');
  }

  await interaction.update({
    embeds: [embed],
  });
}

// ======================
// ERROR HANDLING
// ======================

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// ======================
// LOGIN
// ======================

client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  db.close();
  client.destroy();
  process.exit(0);
});
