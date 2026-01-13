const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// Handle slash commands
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: 'There was an error while executing this command!',
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content: 'There was an error while executing this command!',
						ephemeral: true,
					});
				}
			}
		}

		// Handle dropdown select menus for help categories
		if (interaction.isStringSelectMenu()) {
			if (interaction.customId === 'help_category_select') {
				const selectedCategory = interaction.values[0];

				// Define help category content
				const helpCategories = {
					general: {
						title: '📚 General Help',
						description: 'General commands and information about the bot.',
						fields: [
							{
								name: '/help',
								value: 'Display this help menu',
								inline: false,
							},
							{
								name: '/ping',
								value: 'Check the bot\'s latency',
								inline: false,
							},
							{
								name: '/info',
								value: 'Get information about the bot',
								inline: false,
							},
						],
					},
					moderation: {
						title: '🛡️ Moderation Commands',
						description: 'Commands for server moderation and management.',
						fields: [
							{
								name: '/kick',
								value: 'Kick a user from the server',
								inline: false,
							},
							{
								name: '/ban',
								value: 'Ban a user from the server',
								inline: false,
							},
							{
								name: '/mute',
								value: 'Mute a user',
								inline: false,
							},
							{
								name: '/warn',
								value: 'Warn a user',
								inline: false,
							},
						],
					},
					fun: {
						title: '🎉 Fun Commands',
						description: 'Fun and entertainment commands.',
						fields: [
							{
								name: '/joke',
								value: 'Tell a random joke',
								inline: false,
							},
							{
								name: '/dice',
								value: 'Roll a dice',
								inline: false,
							},
							{
								name: '/8ball',
								value: 'Ask the magic 8-ball a question',
								inline: false,
							},
						],
					},
					music: {
						title: '🎵 Music Commands',
						description: 'Commands for music playback.',
						fields: [
							{
								name: '/play',
								value: 'Play a song',
								inline: false,
							},
							{
								name: '/stop',
								value: 'Stop the music',
								inline: false,
							},
							{
								name: '/pause',
								value: 'Pause the current song',
								inline: false,
							},
							{
								name: '/skip',
								value: 'Skip to the next song',
								inline: false,
							},
						],
					},
				};

				// Get the selected category
				const category = helpCategories[selectedCategory];

				if (!category) {
					await interaction.reply({
						content: 'Category not found!',
						ephemeral: true,
					});
					return;
				}

				// Create embed for the selected category
				const embed = new EmbedBuilder()
					.setColor(0x0099ff)
					.setTitle(category.title)
					.setDescription(category.description)
					.addFields(category.fields)
					.setFooter({
						text: 'Use the dropdown menu to select another category',
					})
					.setTimestamp();

				await interaction.reply({
					embeds: [embed],
					ephemeral: true,
				});
			}
		}

		// Handle other interactions as needed
		if (interaction.isButton()) {
			// Add button handling logic here if needed
		}

		if (interaction.isModalSubmit()) {
			// Add modal handling logic here if needed
		}
	},
};
