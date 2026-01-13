const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong! 🏓'),
	async execute(interaction) {
		await interaction.reply({
			content: `Pong! 🏓 ${interaction.client.ws.ping}ms`,
			ephemeral: false
		});
	},
	// Prefix command support
	name: 'ping',
	description: 'Replies with Pong! 🏓',
	aliases: [],
	async prefixExecute(message, args) {
		await message.reply({
			content: `Pong! 🏓 ${message.client.ws.ping}ms`,
			allowedMentions: { repliedUser: false }
		});
	}
};
