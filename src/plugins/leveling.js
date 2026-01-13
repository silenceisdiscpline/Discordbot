const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * Leveling System Plugin
 * Handles user XP, levels, announcements, and role assignments
 */
class LevelingPlugin {
  constructor(client) {
    this.client = client;
    this.dataPath = path.join(__dirname, '../../data/leveling');
    this.configPath = path.join(this.dataPath, 'config.json');
    this.usersPath = path.join(this.dataPath, 'users.json');
    
    this.initializeData();
    this.loadConfig();
    this.loadUserData();
  }

  /**
   * Initialize data directories and files
   */
  initializeData() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.configPath)) {
      this.saveConfig(this.getDefaultConfig());
    }
    
    if (!fs.existsSync(this.usersPath)) {
      this.saveUserData({});
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      xpPerMessage: 10,
      xpPerReaction: 5,
      minMessageLength: 3,
      cooldownSeconds: 5,
      levelUpAnnouncement: true,
      announcementChannel: null,
      roleRewards: {},
      levelMultiplier: 1.5,
      maxXpPerMessage: 100
    };
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
    try {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(data);
    } catch (error) {
      console.error('Error loading leveling config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * Save configuration to file
   */
  saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      this.config = config;
    } catch (error) {
      console.error('Error saving leveling config:', error);
    }
  }

  /**
   * Load user data from file
   */
  loadUserData() {
    try {
      const data = fs.readFileSync(this.usersPath, 'utf-8');
      this.userData = JSON.parse(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      this.userData = {};
    }
  }

  /**
   * Save user data to file
   */
  saveUserData(data = null) {
    try {
      const saveData = data || this.userData;
      fs.writeFileSync(this.usersPath, JSON.stringify(saveData, null, 2));
      if (!data) this.userData = saveData;
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  /**
   * Get or create user profile
   */
  getUserProfile(userId) {
    if (!this.userData[userId]) {
      this.userData[userId] = {
        userId,
        xp: 0,
        level: 1,
        lastXpGain: 0,
        joinedAt: Date.now(),
        messageCount: 0,
        levelUpHistory: []
      };
      this.saveUserData();
    }
    return this.userData[userId];
  }

  /**
   * Calculate required XP for a given level
   */
  calculateXpForLevel(level) {
    return Math.floor(500 * Math.pow(level, this.config.levelMultiplier));
  }

  /**
   * Calculate current level from XP
   */
  calculateLevelFromXp(xp) {
    let level = 1;
    let totalXp = 0;
    
    while (totalXp + this.calculateXpForLevel(level) <= xp) {
      totalXp += this.calculateXpForLevel(level);
      level++;
    }
    
    return { level, totalXp, remainingXp: xp - totalXp };
  }

  /**
   * Award XP to a user
   */
  async awardXp(userId, xpAmount, guild) {
    const profile = this.getUserProfile(userId);
    const now = Date.now();
    
    // Apply cooldown
    if (now - profile.lastXpGain < this.config.cooldownSeconds * 1000) {
      return { success: false, reason: 'cooldown' };
    }

    // Cap XP per message
    const actualXp = Math.min(xpAmount, this.config.maxXpPerMessage);
    const previousLevel = profile.level;
    
    profile.xp += actualXp;
    profile.lastXpGain = now;
    profile.messageCount += 1;
    
    // Check for level up
    const levelInfo = this.calculateLevelFromXp(profile.xp);
    let leveledUp = false;
    
    if (levelInfo.level > previousLevel) {
      leveledUp = true;
      profile.level = levelInfo.level;
      profile.levelUpHistory.push({
        level: levelInfo.level,
        timestamp: now,
        xp: profile.xp
      });
      
      // Assign role reward if applicable
      if (this.config.roleRewards[levelInfo.level]) {
        await this.assignRoleReward(userId, guild, levelInfo.level);
      }
    }
    
    this.saveUserData();
    
    return {
      success: true,
      xpAwarded: actualXp,
      leveledUp,
      previousLevel,
      newLevel: levelInfo.level,
      profile
    };
  }

  /**
   * Assign role reward for level up
   */
  async assignRoleReward(userId, guild, level) {
    try {
      if (!guild || !this.config.roleRewards[level]) return;
      
      const roleId = this.config.roleRewards[level];
      const member = await guild.members.fetch(userId);
      const role = guild.roles.cache.get(roleId);
      
      if (member && role) {
        await member.roles.add(role);
        return true;
      }
    } catch (error) {
      console.error('Error assigning role reward:', error);
    }
    return false;
  }

  /**
   * Handle message XP gain
   */
  async handleMessage(message) {
    if (message.author.bot || !message.guild) return;
    if (message.content.length < this.config.minMessageLength) return;
    
    const result = await this.awardXp(
      message.author.id,
      this.config.xpPerMessage,
      message.guild
    );
    
    if (result.success && result.leveledUp) {
      await this.sendLevelUpAnnouncement(message, result);
    }
    
    return result;
  }

  /**
   * Send level up announcement
   */
  async sendLevelUpAnnouncement(message, result) {
    try {
      const announcementChannel = this.config.announcementChannel
        ? message.guild.channels.cache.get(this.config.announcementChannel)
        : message.channel;
      
      if (!announcementChannel) return;
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setAuthor({
          name: `${message.author.username} leveled up!`,
          iconURL: message.author.displayAvatarURL()
        })
        .addFields(
          { name: 'New Level', value: `${result.newLevel}`, inline: true },
          { name: 'Total XP', value: `${result.profile.xp}`, inline: true },
          { name: 'Messages', value: `${result.profile.messageCount}`, inline: true }
        )
        .setTimestamp();
      
      await announcementChannel.send({
        content: `🎉 Congratulations ${message.author}!`,
        embeds: [embed]
      });
    } catch (error) {
      console.error('Error sending level up announcement:', error);
    }
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit = 10) {
    const leaderboard = Object.values(this.userData)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        level: user.level,
        xp: user.xp,
        messages: user.messageCount
      }));
    
    return leaderboard;
  }

  /**
   * Get user stats
   */
  getUserStats(userId) {
    const profile = this.getUserProfile(userId);
    const levelInfo = this.calculateLevelFromXp(profile.xp);
    const nextLevelXp = this.calculateXpForLevel(levelInfo.level);
    const xpToNextLevel = nextLevelXp - levelInfo.remainingXp;
    
    return {
      ...profile,
      xpProgress: levelInfo.remainingXp,
      xpToNextLevel,
      progressPercentage: Math.floor((levelInfo.remainingXp / nextLevelXp) * 100)
    };
  }

  /**
   * Create stats embed
   */
  createStatsEmbed(user, stats) {
    const progressBar = this.createProgressBar(stats.progressPercentage);
    
    return new EmbedBuilder()
      .setColor('#5865F2')
      .setAuthor({
        name: `${user.username}'s Stats`,
        iconURL: user.displayAvatarURL()
      })
      .addFields(
        { name: 'Level', value: `${stats.level}`, inline: true },
        { name: 'Total XP', value: `${stats.xp}`, inline: true },
        { name: 'Messages', value: `${stats.messageCount}`, inline: true },
        { name: 'Progress', value: `${progressBar}\n${stats.xpProgress}/${stats.xpToNextLevel} XP`, inline: false }
      )
      .setTimestamp();
  }

  /**
   * Create progress bar
   */
  createProgressBar(percentage, length = 20) {
    const filled = Math.floor((percentage / 100) * length);
    const empty = length - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
  }

  /**
   * Create leaderboard embed
   */
  createLeaderboardEmbed(guild, leaderboard) {
    const description = leaderboard
      .map(entry => `**#${entry.rank}** <@${entry.userId}> - Level ${entry.level} (${entry.xp} XP)`)
      .join('\n');
    
    return new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${guild.name} - Leaderboard`)
      .setDescription(description || 'No users yet')
      .setTimestamp();
  }

  /**
   * Configure leveling settings
   */
  updateConfig(settings) {
    this.config = { ...this.config, ...settings };
    this.saveConfig(this.config);
    return this.config;
  }

  /**
   * Add role reward for level
   */
  addRoleReward(level, roleId) {
    this.config.roleRewards[level] = roleId;
    this.saveConfig(this.config);
    return true;
  }

  /**
   * Remove role reward for level
   */
  removeRoleReward(level) {
    delete this.config.roleRewards[level];
    this.saveConfig(this.config);
    return true;
  }

  /**
   * Get config
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Reset user stats (admin only)
   */
  resetUserStats(userId) {
    delete this.userData[userId];
    this.saveUserData();
    return true;
  }

  /**
   * Export user data for backup
   */
  exportData() {
    return {
      config: this.config,
      users: this.userData,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import user data from backup
   */
  importData(data) {
    try {
      if (data.config) this.saveConfig(data.config);
      if (data.users) this.saveUserData(data.users);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

module.exports = LevelingPlugin;
