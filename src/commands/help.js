const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays an interactive menu with all bot categories and their commands'),

  async execute(interaction) {
    // Create the embed with the help menu
    const helpEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🤖 Bot Help Menu')
      .setDescription('Select a category below to learn more about the available commands')
      .addFields(
        { name: '🛡️ Moderation', value: 'Commands for server management and moderation', inline: false },
        { name: '🔒 Security', value: 'Commands for server protection and security features', inline: false },
        { name: '💰 Economy', value: 'Commands for the economy system and currency', inline: false },
        { name: '🎵 Music', value: 'Commands for playing and managing music', inline: false },
        { name: '🤖 AI', value: 'Commands for AI features and interactions', inline: false }
      )
      .setFooter({ text: 'Use the dropdown menu to select a category' })
      .setTimestamp();

    // Create the dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('Choose a category...')
      .addOptions([
        {
          label: 'Moderation',
          value: 'moderation',
          emoji: '🛡️',
          description: 'Server moderation and management tools',
        },
        {
          label: 'Security',
          value: 'security',
          emoji: '🔒',
          description: 'Server protection and security features',
        },
        {
          label: 'Economy',
          value: 'economy',
          emoji: '💰',
          description: 'Economy system and currency commands',
        },
        {
          label: 'Music',
          value: 'music',
          emoji: '🎵',
          description: 'Music player and playlist commands',
        },
        {
          label: 'AI',
          value: 'ai',
          emoji: '🤖',
          description: 'AI features and interactions',
        },
      ]);

    // Create the action row with the select menu
    const actionRow = new ActionRowBuilder()
      .addComponents(selectMenu);

    // Send the initial response
    await interaction.reply({
      embeds: [helpEmbed],
      components: [actionRow],
    });

    // Create a collector for the select menu interaction
    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.customId === 'help_category_select' && i.user.id === interaction.user.id,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async (selectInteraction) => {
      const selectedCategory = selectInteraction.values[0];

      // Create embeds for each category
      const categoryEmbeds = {
        moderation: new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🛡️ Moderation Commands')
          .setDescription('Commands for managing your server')
          .addFields(
            { name: '/kick', value: 'Kick a user from the server', inline: true },
            { name: '/ban', value: 'Ban a user from the server', inline: true },
            { name: '/mute', value: 'Mute a user temporarily', inline: true },
            { name: '/warn', value: 'Issue a warning to a user', inline: true },
            { name: '/lock', value: 'Lock a channel', inline: true },
            { name: '/unlock', value: 'Unlock a channel', inline: true }
          )
          .setFooter({ text: 'Use /help [command] for more details' }),
        security: new EmbedBuilder()
          .setColor('#ffff00')
          .setTitle('🔒 Security Commands')
          .setDescription('Commands to protect your server')
          .addFields(
            { name: '/antiraid', value: 'Enable anti-raid protection', inline: true },
            { name: '/antispam', value: 'Enable anti-spam filters', inline: true },
            { name: '/logs', value: 'View server activity logs', inline: true },
            { name: '/verify', value: 'Set up verification system', inline: true },
            { name: '/autorole', value: 'Assign roles automatically', inline: true },
            { name: '/security-report', value: 'View security reports', inline: true }
          )
          .setFooter({ text: 'Use /help [command] for more details' }),
        economy: new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('💰 Economy Commands')
          .setDescription('Commands for the economy system')
          .addFields(
            { name: '/balance', value: 'Check your balance', inline: true },
            { name: '/earn', value: 'Earn currency', inline: true },
            { name: '/shop', value: 'View the shop', inline: true },
            { name: '/buy', value: 'Buy items', inline: true },
            { name: '/leaderboard', value: 'View economy leaderboard', inline: true },
            { name: '/transfer', value: 'Transfer currency to others', inline: true }
          )
          .setFooter({ text: 'Use /help [command] for more details' }),
        music: new EmbedBuilder()
          .setColor('#9900ff')
          .setTitle('🎵 Music Commands')
          .setDescription('Commands for playing music')
          .addFields(
            { name: '/play', value: 'Play a song', inline: true },
            { name: '/pause', value: 'Pause the music', inline: true },
            { name: '/resume', value: 'Resume the music', inline: true },
            { name: '/stop', value: 'Stop the music', inline: true },
            { name: '/queue', value: 'View the music queue', inline: true },
            { name: '/skip', value: 'Skip to next song', inline: true }
          )
          .setFooter({ text: 'Use /help [command] for more details' }),
        ai: new EmbedBuilder()
          .setColor('#00ffff')
          .setTitle('🤖 AI Commands')
          .setDescription('Commands for AI features')
          .addFields(
            { name: '/chat', value: 'Chat with the AI', inline: true },
            { name: '/imagine', value: 'Generate images with AI', inline: true },
            { name: '/summarize', value: 'Summarize text', inline: true },
            { name: '/translate', value: 'Translate text', inline: true },
            { name: '/define', value: 'Get word definitions', inline: true },
            { name: '/ai-stats', value: 'View AI usage stats', inline: true }
          )
          .setFooter({ text: 'Use /help [command] for more details' }),
      };

      // Update the response with the selected category
      await selectInteraction.update({
        embeds: [categoryEmbeds[selectedCategory]],
        components: [actionRow],
      });
    });

    // Handle collector end
    collector.on('end', async () => {
      // Optionally disable the select menu after timeout
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          selectMenu.setDisabled(true)
        );
      
      try {
        await interaction.editReply({
          components: [disabledRow],
        });
      } catch (error) {
        console.error('Error disabling components:', error);
      }
    });
  },
};
