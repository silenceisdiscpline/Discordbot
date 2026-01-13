const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Ignore DMs
    if (!message.guild) return;

    const prefix = process.env.PREFIX || '!';
    const guildId = message.guildId;
    const userId = message.author.id;

    // ==================== PREFIX COMMAND HANDLER ====================
    if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Get command from client commands collection
      const command = client.commands.get(commandName);

      if (!command) {
        return; // Command doesn't exist
      }

      try {
        // Check command permissions if needed
        if (command.permissions) {
          const userPerms = message.member.permissions;
          for (const perm of command.permissions) {
            if (!userPerms.has(perm)) {
              return message.reply({
                content: `❌ You don't have permission to use this command. Required: ${command.permissions.join(', ')}`,
                allowedMentions: { repliedUser: false }
              });
            }
          }
        }

        // Check if command requires arguments
        if (command.args && args.length === 0) {
          return message.reply({
            content: `❌ This command requires arguments.\nUsage: \`${prefix}${commandName} ${command.usage}\``,
            allowedMentions: { repliedUser: false }
          });
        }

        // Execute the command
        await command.execute(message, args, client);
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        return message.reply({
          content: '❌ An error occurred while executing this command.',
          allowedMentions: { repliedUser: false }
        });
      }

      return;
    }

    // ==================== MESSAGE XP GAIN (LEVELING SYSTEM) ====================
    // Check if leveling system is enabled (optional check)
    if (client.leveling !== false) {
      // Cooldown to prevent spam (5 seconds between XP gains)
      const xpCooldownKey = `xp_${userId}_${guildId}`;
      const now = Date.now();
      const cooldownMs = 5000; // 5 seconds

      if (client.xpCooldowns.has(xpCooldownKey)) {
        const expirationTime = client.xpCooldowns.get(xpCooldownKey) + cooldownMs;
        if (now < expirationTime) {
          return;
        }
      }

      // Award XP
      try {
        // Random XP between 10 and 50
        const xpGain = Math.floor(Math.random() * 40) + 10;

        // Retrieve user data (assuming using database or collection)
        let userData = client.userDatabase?.get(`${userId}_${guildId}`);

        if (!userData) {
          userData = {
            id: userId,
            guildId: guildId,
            xp: 0,
            level: 1,
            messageCount: 0
          };
        }

        const previousLevel = userData.level;
        userData.xp += xpGain;
        userData.messageCount = (userData.messageCount || 0) + 1;

        // Calculate level (every 1000 XP = 1 level)
        const xpPerLevel = 1000;
        userData.level = Math.floor(userData.xp / xpPerLevel) + 1;

        // Update database/collection
        if (client.userDatabase) {
          client.userDatabase.set(`${userId}_${guildId}`, userData);
        }

        // Notify on level up
        if (userData.level > previousLevel) {
          const levelUpEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎉 Level Up!')
            .setDescription(`${message.author} has reached level **${userData.level}**!`)
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: `Total XP: ${userData.xp}` })
            .setTimestamp();

          message.reply({
            embeds: [levelUpEmbed],
            allowedMentions: { repliedUser: false }
          });
        }

        // Set cooldown
        client.xpCooldowns.set(xpCooldownKey, now);
      } catch (error) {
        console.error('Error awarding XP:', error);
      }
    }

    // ==================== AUTO-RESPONSE TRIGGERS ====================
    const messageContent = message.content.toLowerCase();
    const autoResponses = {
      // Greeting responses
      'hello': 'Hello! 👋',
      'hi': 'Hey there! 👋',
      'hey': 'What\'s up? 👋',
      
      // Help trigger
      'help': 'Need help? Use `' + prefix + 'help` for a list of available commands!',
      
      // Fun responses
      'ping': '🏓 Pong!',
      'goodbot': 'Thank you! 🤖',
      'badbot': 'Aww, sorry... 😢',
      
      // Custom responses
      'thanks': 'You\'re welcome! 😊',
      'thank you': 'You\'re welcome! 😊',
    };

    // Check if message triggers auto-response
    for (const [trigger, response] of Object.entries(autoResponses)) {
      if (messageContent.includes(trigger)) {
        try {
          await message.reply({
            content: response,
            allowedMentions: { repliedUser: false }
          });
        } catch (error) {
          console.error('Error sending auto-response:', error);
        }
        break; // Only trigger one response per message
      }
    }

    // ==================== ADVANCED AUTO-RESPONSE TRIGGERS ====================
    // Regex-based triggers for more complex patterns
    const regexTriggers = [
      {
        pattern: /who\s+(is|are)\s+you/i,
        response: 'I\'m a Discord bot! Use ' + prefix + 'help to see what I can do.'
      },
      {
        pattern: /what's?\s+your\s+name/i,
        response: 'I\'m a bot created to help manage this server!'
      },
      {
        pattern: /good\s+morning|good\s+night|good\s+evening/i,
        response: 'Good morning/evening! Hope you\'re having a great day! ☀️'
      }
    ];

    for (const trigger of regexTriggers) {
      if (trigger.pattern.test(messageContent)) {
        try {
          await message.reply({
            content: trigger.response,
            allowedMentions: { repliedUser: false }
          });
        } catch (error) {
          console.error('Error sending regex auto-response:', error);
        }
        break;
      }
    }
  }
};
