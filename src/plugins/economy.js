/**
 * Economy System Plugin
 * Manages coins, transactions, shop items, and daily rewards for users
 */

const fs = require('fs');
const path = require('path');

class Economy {
  constructor(bot) {
    this.bot = bot;
    this.dataDir = path.join(__dirname, '../../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.transactionsFile = path.join(this.dataDir, 'transactions.json');
    this.shopFile = path.join(this.dataDir, 'shop.json');
    
    this.ensureDataDirectory();
    this.loadData();
    this.initializeDefaultShop();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Load all data from files
   */
  loadData() {
    this.users = this.loadFile(this.usersFile, {});
    this.transactions = this.loadFile(this.transactionsFile, []);
    this.shop = this.loadFile(this.shopFile, {});
  }

  /**
   * Load data from file with fallback
   */
  loadFile(filePath, defaultData) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error.message);
    }
    return defaultData;
  }

  /**
   * Save data to file
   */
  saveFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error saving file ${filePath}:`, error.message);
    }
  }

  /**
   * Initialize default shop items
   */
  initializeDefaultShop() {
    if (Object.keys(this.shop).length === 0) {
      this.shop = {
        'badge_vip': {
          id: 'badge_vip',
          name: 'VIP Badge',
          description: 'Shows a VIP badge on your profile',
          price: 5000,
          type: 'badge',
          category: 'cosmetic'
        },
        'role_moderator': {
          id: 'role_moderator',
          name: 'Moderator Role',
          description: 'Get moderator powers for 24 hours',
          price: 10000,
          type: 'role',
          category: 'power'
        },
        'color_neon': {
          id: 'color_neon',
          name: 'Neon Color Role',
          description: 'A vibrant neon colored role',
          price: 3000,
          type: 'color',
          category: 'cosmetic'
        },
        'loot_box_common': {
          id: 'loot_box_common',
          name: 'Common Loot Box',
          description: 'Contains 500-1500 bonus coins',
          price: 1000,
          type: 'loot',
          category: 'consumable'
        },
        'loot_box_rare': {
          id: 'loot_box_rare',
          name: 'Rare Loot Box',
          description: 'Contains 2000-5000 bonus coins',
          price: 5000,
          type: 'loot',
          category: 'consumable'
        },
        'multiplier_2x': {
          id: 'multiplier_2x',
          name: '2x Coin Multiplier',
          description: 'Double your coin earnings for 7 days',
          price: 15000,
          type: 'multiplier',
          category: 'power'
        }
      };
      this.saveFile(this.shopFile, this.shop);
    }
  }

  /**
   * Get or create user data
   */
  getUser(userId) {
    if (!this.users[userId]) {
      this.users[userId] = {
        id: userId,
        coins: 0,
        inventory: [],
        lastDaily: null,
        multiplier: 1,
        multiplierExpiry: null,
        joinedAt: new Date().toISOString()
      };
      this.saveFile(this.usersFile, this.users);
    }
    return this.users[userId];
  }

  /**
   * Add coins to user
   */
  addCoins(userId, amount, reason = 'manual') {
    const user = this.getUser(userId);
    const actualAmount = Math.floor(amount * user.multiplier);
    user.coins += actualAmount;
    
    this.logTransaction({
      userId,
      type: 'credit',
      amount: actualAmount,
      reason,
      timestamp: new Date().toISOString()
    });
    
    this.saveFile(this.usersFile, this.users);
    return user.coins;
  }

  /**
   * Remove coins from user
   */
  removeCoins(userId, amount, reason = 'manual') {
    const user = this.getUser(userId);
    if (user.coins < amount) {
      return false; // Insufficient funds
    }
    
    user.coins -= amount;
    
    this.logTransaction({
      userId,
      type: 'debit',
      amount,
      reason,
      timestamp: new Date().toISOString()
    });
    
    this.saveFile(this.usersFile, this.users);
    return true;
  }

  /**
   * Transfer coins between users
   */
  transferCoins(fromUserId, toUserId, amount) {
    const fromUser = this.getUser(fromUserId);
    
    if (fromUser.coins < amount) {
      return { success: false, message: 'Insufficient funds' };
    }
    
    fromUser.coins -= amount;
    const toUser = this.getUser(toUserId);
    toUser.coins += amount;
    
    this.logTransaction({
      userId: fromUserId,
      type: 'transfer_out',
      amount,
      reason: `Transfer to ${toUserId}`,
      timestamp: new Date().toISOString()
    });
    
    this.logTransaction({
      userId: toUserId,
      type: 'transfer_in',
      amount,
      reason: `Transfer from ${fromUserId}`,
      timestamp: new Date().toISOString()
    });
    
    this.saveFile(this.usersFile, this.users);
    return { success: true, message: 'Transfer completed' };
  }

  /**
   * Log transaction
   */
  logTransaction(transaction) {
    this.transactions.push(transaction);
    // Keep only last 1000 transactions
    if (this.transactions.length > 1000) {
      this.transactions = this.transactions.slice(-1000);
    }
    this.saveFile(this.transactionsFile, this.transactions);
  }

  /**
   * Get daily reward
   */
  getDailyReward(userId) {
    const user = this.getUser(userId);
    const now = new Date();
    const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
    
    // Check if 24 hours have passed
    if (lastDaily && (now - lastDaily) < 24 * 60 * 60 * 1000) {
      const timeUntilNext = lastDaily.getTime() + (24 * 60 * 60 * 1000) - now.getTime();
      return {
        success: false,
        message: `Come back in ${Math.ceil(timeUntilNext / (60 * 60 * 1000))} hours for your daily reward`,
        timeUntilNext
      };
    }
    
    const baseReward = 500;
    const bonusReward = Math.floor(Math.random() * 500);
    const totalReward = baseReward + bonusReward;
    
    user.coins += totalReward;
    user.lastDaily = now.toISOString();
    
    this.logTransaction({
      userId,
      type: 'credit',
      amount: totalReward,
      reason: 'daily_reward',
      timestamp: now.toISOString()
    });
    
    this.saveFile(this.usersFile, this.users);
    
    return {
      success: true,
      reward: totalReward,
      baseReward,
      bonusReward,
      totalCoins: user.coins
    };
  }

  /**
   * Purchase shop item
   */
  purchaseItem(userId, itemId) {
    const item = this.shop[itemId];
    if (!item) {
      return { success: false, message: 'Item not found' };
    }
    
    const user = this.getUser(userId);
    
    if (user.coins < item.price) {
      return { success: false, message: 'Insufficient funds' };
    }
    
    user.coins -= item.price;
    user.inventory.push({
      itemId,
      purchasedAt: new Date().toISOString()
    });
    
    this.logTransaction({
      userId,
      type: 'purchase',
      amount: item.price,
      reason: `Purchased: ${item.name}`,
      timestamp: new Date().toISOString()
    });
    
    this.saveFile(this.usersFile, this.users);
    
    return {
      success: true,
      message: `Successfully purchased ${item.name}`,
      item,
      remainingCoins: user.coins
    };
  }

  /**
   * Get shop item details
   */
  getShopItem(itemId) {
    return this.shop[itemId] || null;
  }

  /**
   * Get all shop items
   */
  getAllShopItems() {
    return Object.values(this.shop);
  }

  /**
   * Get shop items by category
   */
  getShopItemsByCategory(category) {
    return Object.values(this.shop).filter(item => item.category === category);
  }

  /**
   * Get user inventory
   */
  getUserInventory(userId) {
    const user = this.getUser(userId);
    return user.inventory.map(inv => ({
      ...inv,
      details: this.getShopItem(inv.itemId)
    }));
  }

  /**
   * Get user balance
   */
  getUserBalance(userId) {
    const user = this.getUser(userId);
    return {
      userId,
      coins: user.coins,
      multiplier: user.multiplier,
      multiplierExpiry: user.multiplierExpiry
    };
  }

  /**
   * Get user statistics
   */
  getUserStats(userId) {
    const user = this.getUser(userId);
    const userTransactions = this.transactions.filter(t => t.userId === userId);
    
    const credits = userTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const debits = userTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      userId,
      coins: user.coins,
      totalCredits: credits,
      totalDebits: debits,
      netEarnings: credits - debits,
      inventory: user.inventory.length,
      joinedAt: user.joinedAt,
      lastDaily: user.lastDaily
    };
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit = 10) {
    const sorted = Object.values(this.users)
      .sort((a, b) => b.coins - a.coins)
      .slice(0, limit);
    
    return sorted.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      coins: user.coins
    }));
  }

  /**
   * Apply coin multiplier to user
   */
  setMultiplier(userId, multiplier, durationHours) {
    const user = this.getUser(userId);
    user.multiplier = multiplier;
    user.multiplierExpiry = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
    this.saveFile(this.usersFile, this.users);
    
    return {
      success: true,
      multiplier,
      expiresAt: user.multiplierExpiry
    };
  }

  /**
   * Check and reset expired multipliers
   */
  checkExpiredMultipliers() {
    const now = new Date();
    let updated = false;
    
    Object.values(this.users).forEach(user => {
      if (user.multiplierExpiry && new Date(user.multiplierExpiry) < now) {
        user.multiplier = 1;
        user.multiplierExpiry = null;
        updated = true;
      }
    });
    
    if (updated) {
      this.saveFile(this.usersFile, this.users);
    }
  }

  /**
   * Add item to shop
   */
  addShopItem(itemId, itemData) {
    if (this.shop[itemId]) {
      return { success: false, message: 'Item already exists' };
    }
    
    this.shop[itemId] = {
      id: itemId,
      ...itemData
    };
    
    this.saveFile(this.shopFile, this.shop);
    return { success: true, item: this.shop[itemId] };
  }

  /**
   * Remove item from shop
   */
  removeShopItem(itemId) {
    if (!this.shop[itemId]) {
      return { success: false, message: 'Item not found' };
    }
    
    delete this.shop[itemId];
    this.saveFile(this.shopFile, this.shop);
    return { success: true, message: 'Item removed from shop' };
  }

  /**
   * Get transaction history for user
   */
  getTransactionHistory(userId, limit = 50) {
    return this.transactions
      .filter(t => t.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Reset user data (admin only)
   */
  resetUserData(userId) {
    if (this.users[userId]) {
      this.users[userId] = {
        id: userId,
        coins: 0,
        inventory: [],
        lastDaily: null,
        multiplier: 1,
        multiplierExpiry: null,
        joinedAt: new Date().toISOString()
      };
      this.saveFile(this.usersFile, this.users);
      return { success: true, message: 'User data reset' };
    }
    return { success: false, message: 'User not found' };
  }
}

module.exports = Economy;
