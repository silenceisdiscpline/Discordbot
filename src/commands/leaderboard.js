const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top 10 users by level, XP, coins, and rank')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('Choose leaderboard category')
        .setRequired(false)
        .addChoices(
          { name: 'Level', value: 'level' },
          { name: 'XP', value: 'xp' },
          { name: 'Coins', value: 'coins' },
          { name: 'Rank', value: 'rank' }
        )
    ),

  async execute(interaction) {
    try {
      const category = interaction.options.getString('category') || 'level';
      const guildId = interaction.guildId;

      // Medal emotes for top 3
      const medals = ['🥇', '🥈', '🥉'];

      // Placeholder for fetching user data from database
      // This assumes you have a database connection and user model
      // Adjust according to your actual database structure
      let users = await fetchUserData(guildId, category);

      // Sort users based on category
      users = sortUsersByCategory(users, category);

      // Get top 10 users
      const topUsers = users.slice(0, 10);

      // Build leaderboard embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📊 ${capitalize(category)} Leaderboard`)
        .setDescription(`Top 10 users by ${category}`)
        .setTimestamp()
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

      let leaderboardText = '';

      topUsers.forEach((user, index) => {
        const medal = index < 3 ? medals[index] : `${index + 1}.`;
        const value = formatValue(user[category], category);
        leaderboardText += `${medal} **${user.username}** - ${value}\n`;
      });

      embed.addFields(
        { name: 'Rankings', value: leaderboardText || 'No data available', inline: false }
      );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Leaderboard command error:', error);
      await interaction.reply({
        content: 'An error occurred while fetching the leaderboard.',
        ephemeral: true
      });
    }
  }
};

/**
 * Fetch user data from database
 * @param {string} guildId - Guild ID
 * @param {string} category - Category to fetch
 * @returns {Promise<Array>} Array of user objects
 */
async function fetchUserData(guildId, category) {
  try {
    // TODO: Replace with your actual database query
    // Example structure:
    // return await UserModel.find({ guildId }).select('username level xp coins rank').lean();
    
    // Placeholder return - update this with your actual database call
    return [];
  } catch (error) {
    console.error('Error fetching user data:', error);
    return [];
  }
}

/**
 * Sort users by category
 * @param {Array} users - Array of user objects
 * @param {string} category - Category to sort by
 * @returns {Array} Sorted array of users
 */
function sortUsersByCategory(users, category) {
  const sortMap = {
    level: (a, b) => (b.level || 0) - (a.level || 0),
    xp: (a, b) => (b.xp || 0) - (a.xp || 0),
    coins: (a, b) => (b.coins || 0) - (a.coins || 0),
    rank: (a, b) => (b.rank || 0) - (a.rank || 0)
  };

  return users.sort(sortMap[category] || sortMap.level);
}

/**
 * Format value based on category
 * @param {number} value - Value to format
 * @param {string} category - Category type
 * @returns {string} Formatted value
 */
function formatValue(value, category) {
  const value_num = Number(value) || 0;
  
  switch (category) {
    case 'level':
      return `Level ${value_num}`;
    case 'xp':
      return `${value_num.toLocaleString()} XP`;
    case 'coins':
      return `💰 ${value_num.toLocaleString()} Coins`;
    case 'rank':
      return `Rank ${value_num}`;
    default:
      return value_num.toLocaleString();
  }
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
