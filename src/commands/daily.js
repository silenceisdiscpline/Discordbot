const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Cooldown tracking
const cooldowns = new Map();
const COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DAILY_REWARD = 500; // Coins rewarded daily

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward of coins'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    // Check cooldown
    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId);
      const timeRemaining = expirationTime - now;

      if (timeRemaining > 0) {
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        const embed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle('❌ Daily Reward - Cooldown Active')
          .setDescription(`You've already claimed your daily reward!\n\n⏱️ Come back in **${hours}h ${minutes}m**`)
          .setFooter({ text: `User: ${interaction.user.username}` })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // Grant reward
    try {
      // Here you would typically update a database with the user's coins
      // For now, we'll create a simple in-memory storage example
      const userDataPath = path.join(__dirname, '../../data/users.json');
      let users = {};

      // Load existing user data if file exists
      if (fs.existsSync(userDataPath)) {
        const data = fs.readFileSync(userDataPath, 'utf8');
        users = JSON.parse(data);
      }

      // Initialize user if they don't exist
      if (!users[userId]) {
        users[userId] = {
          coins: 0,
          lastDaily: null,
          totalDailyRewards: 0,
        };
      }

      // Update user data
      users[userId].coins += DAILY_REWARD;
      users[userId].lastDaily = new Date().toISOString();
      users[userId].totalDailyRewards = (users[userId].totalDailyRewards || 0) + 1;

      // Create directory if it doesn't exist
      const dataDir = path.dirname(userDataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Save user data
      fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2));

      // Success embed
      const successEmbed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('✅ Daily Reward Claimed!')
        .addFields(
          { name: '💰 Coins Earned', value: `+${DAILY_REWARD}`, inline: true },
          { name: '💵 Total Coins', value: `${users[userId].coins}`, inline: true },
          { name: '📊 Total Daily Claims', value: `${users[userId].totalDailyRewards}`, inline: true }
        )
        .setFooter({ text: `Come back tomorrow for more rewards!` })
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed] });

      // Set cooldown
      cooldowns.set(userId, now + COOLDOWN_DURATION);

      // Optional: Log the reward claim
      console.log(`✅ ${interaction.user.username} (${userId}) claimed daily reward of ${DAILY_REWARD} coins`);

    } catch (error) {
      console.error('Error processing daily reward:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('⚠️ Error Processing Reward')
        .setDescription('An error occurred while claiming your daily reward. Please try again later.')
        .setFooter({ text: 'If this persists, contact an administrator' })
        .setTimestamp();

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
