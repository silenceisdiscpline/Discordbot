const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your TESSERACT coins, rank, XP, and level')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check balance for (defaults to yourself)')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        try {
            // Get the target user (mentioned user or command executor)
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(targetUser.id);

            // Placeholder data structure - replace with your actual database queries
            // This assumes you have a database system in place
            const userBalance = {
                coins: 1500, // TESSERACT coins
                rank: 42,
                xp: 3850,
                level: 5,
                nextLevelXP: 5000 // XP needed for next level
            };

            // Calculate XP progress percentage
            const xpProgress = Math.round((userBalance.xp / userBalance.nextLevelXP) * 100);
            const progressBar = this.createProgressBar(xpProgress, 20);

            // Create the embed
            const balanceEmbed = new EmbedBuilder()
                .setColor('#9C27B0') // Purple color for TESSERACT theme
                .setTitle(`💰 ${targetUser.username}'s Balance`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    {
                        name: '💎 TESSERACT Coins',
                        value: `\`${userBalance.coins.toLocaleString()}\``,
                        inline: true
                    },
                    {
                        name: '🏆 Rank',
                        value: `\`#${userBalance.rank}\``,
                        inline: true
                    },
                    {
                        name: '⭐ Level',
                        value: `\`${userBalance.level}\``,
                        inline: true
                    },
                    {
                        name: '📊 Experience Progress',
                        value: `${progressBar} \`${userBalance.xp}/${userBalance.nextLevelXP}\` XP`,
                        inline: false
                    },
                    {
                        name: '📈 Progress',
                        value: `\`${xpProgress}%\``,
                        inline: true
                    }
                )
                .setFooter({
                    text: `Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            await interaction.reply({ embeds: [balanceEmbed] });

        } catch (error) {
            console.error('Error in balance command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching the balance information.',
                ephemeral: true
            });
        }
    },

    // Helper function to create a visual progress bar
    createProgressBar(percentage, length = 20) {
        const filled = Math.round((percentage / 100) * length);
        const empty = length - filled;
        
        const filledBar = '█'.repeat(filled);
        const emptyBar = '░'.repeat(empty);
        
        return `${filledBar}${emptyBar}`;
    }
};
