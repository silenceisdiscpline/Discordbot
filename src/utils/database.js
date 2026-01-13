const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Initialize database path
const dbPath = path.join(__dirname, '../../data/discord.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database connection
let db = null;

/**
 * Initialize the SQLite database and create tables
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }

      console.log('Connected to SQLite database');

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err.message);
          reject(err);
          return;
        }

        createTables()
          .then(() => {
            console.log('Database initialized successfully');
            resolve();
          })
          .catch(reject);
      });
    });
  });
}

/**
 * Create all necessary tables
 */
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table - Core user information
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          tag TEXT,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Leveling table - User level and experience
      db.run(`
        CREATE TABLE IF NOT EXISTS leveling (
          user_id TEXT PRIMARY KEY,
          level INTEGER DEFAULT 1,
          experience INTEGER DEFAULT 0,
          total_experience INTEGER DEFAULT 0,
          messages_sent INTEGER DEFAULT 0,
          last_xp_gained DATETIME,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Economy table - Currency and balance
      db.run(`
        CREATE TABLE IF NOT EXISTS economy (
          user_id TEXT PRIMARY KEY,
          balance INTEGER DEFAULT 0,
          bank INTEGER DEFAULT 0,
          daily_claimed DATETIME,
          weekly_claimed DATETIME,
          total_earned INTEGER DEFAULT 0,
          total_spent INTEGER DEFAULT 0,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Inventory table - User items/currency storage
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          item_name TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, item_name)
        )
      `);

      // Ranking table - Guild-specific user ranks
      db.run(`
        CREATE TABLE IF NOT EXISTS rankings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          rank_title TEXT,
          points INTEGER DEFAULT 0,
          rank_number INTEGER,
          achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(guild_id, user_id)
        )
      `);

      // Statistics table - User activity statistics
      db.run(`
        CREATE TABLE IF NOT EXISTS statistics (
          user_id TEXT PRIMARY KEY,
          total_commands_used INTEGER DEFAULT 0,
          total_voice_time INTEGER DEFAULT 0,
          reactions_given INTEGER DEFAULT 0,
          messages_deleted INTEGER DEFAULT 0,
          messages_edited INTEGER DEFAULT 0,
          invites_used INTEGER DEFAULT 0,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tables:', err.message);
          reject(err);
        } else {
          console.log('All tables created successfully');
          resolve();
        }
      });
    });
  });
}

/**
 * Get or create a user
 * @param {string} userId - Discord user ID
 * @param {string} username - Discord username
 * @param {string} tag - Discord tag (e.g., User#1234)
 * @param {string} avatar - Avatar URL
 */
function getOrCreateUser(userId, username, tag, avatar) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        reject(err);
        return;
      }

      if (user) {
        // Update existing user
        db.run(
          'UPDATE users SET username = ?, tag = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [username, tag, avatar, userId],
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(user);
            }
          }
        );
      } else {
        // Create new user
        db.run(
          'INSERT INTO users (id, username, tag, avatar) VALUES (?, ?, ?, ?)',
          [userId, username, tag, avatar],
          function(err) {
            if (err) {
              reject(err);
              return;
            }

            // Initialize leveling, economy, and statistics records
            db.run('INSERT INTO leveling (user_id) VALUES (?)', [userId]);
            db.run('INSERT INTO economy (user_id) VALUES (?)', [userId]);
            db.run('INSERT INTO statistics (user_id) VALUES (?)', [userId]);

            resolve({ id: userId, username, tag, avatar });
          }
        );
      }
    });
  });
}

/**
 * Add experience to a user
 * @param {string} userId - Discord user ID
 * @param {number} xp - Experience points to add
 */
function addExperience(userId, xp) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE leveling SET 
        experience = experience + ?,
        total_experience = total_experience + ?,
        messages_sent = messages_sent + 1,
        last_xp_gained = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [xp, xp, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Get user leveling data
 * @param {string} userId - Discord user ID
 */
function getLevelingData(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM leveling WHERE user_id = ?', [userId], (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Set user level
 * @param {string} userId - Discord user ID
 * @param {number} level - New level
 */
function setLevel(userId, level) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE leveling SET level = ? WHERE user_id = ?',
      [level, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Add currency to user balance
 * @param {string} userId - Discord user ID
 * @param {number} amount - Amount to add
 */
function addBalance(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE economy SET 
        balance = balance + ?,
        total_earned = total_earned + ?
       WHERE user_id = ?`,
      [amount, amount > 0 ? amount : 0, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Remove currency from user balance
 * @param {string} userId - Discord user ID
 * @param {number} amount - Amount to remove
 */
function removeBalance(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE economy SET 
        balance = balance - ?,
        total_spent = total_spent + ?
       WHERE user_id = ?`,
      [amount, amount, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Get user economy data
 * @param {string} userId - Discord user ID
 */
function getEconomyData(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM economy WHERE user_id = ?', [userId], (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Deposit balance to bank
 * @param {string} userId - Discord user ID
 * @param {number} amount - Amount to deposit
 */
function depositBank(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE economy SET 
        balance = balance - ?,
        bank = bank + ?
       WHERE user_id = ? AND balance >= ?`,
      [amount, amount, userId, amount],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Insufficient balance'));
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Withdraw from bank to balance
 * @param {string} userId - Discord user ID
 * @param {number} amount - Amount to withdraw
 */
function withdrawBank(userId, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE economy SET 
        balance = balance + ?,
        bank = bank - ?
       WHERE user_id = ? AND bank >= ?`,
      [amount, amount, userId, amount],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Insufficient bank balance'));
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Claim daily reward
 * @param {string} userId - Discord user ID
 * @param {number} reward - Reward amount
 */
function claimDaily(userId, reward) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT daily_claimed FROM economy WHERE user_id = ?',
      [userId],
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const lastClaimed = data?.daily_claimed;
        const now = new Date();
        const lastClaimedDate = lastClaimed ? new Date(lastClaimed) : null;

        // Check if 24 hours have passed
        if (lastClaimedDate && now - lastClaimedDate < 86400000) {
          reject(new Error('Daily reward already claimed. Try again later.'));
          return;
        }

        db.run(
          `UPDATE economy SET 
            balance = balance + ?,
            daily_claimed = CURRENT_TIMESTAMP,
            total_earned = total_earned + ?
           WHERE user_id = ?`,
          [reward, reward, userId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      }
    );
  });
}

/**
 * Add item to user inventory
 * @param {string} userId - Discord user ID
 * @param {string} itemName - Name of the item
 * @param {number} quantity - Quantity to add
 */
function addInventoryItem(userId, itemName, quantity = 1) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO inventory (user_id, item_name, quantity) 
       VALUES (?, ?, ?) 
       ON CONFLICT(user_id, item_name) DO UPDATE SET quantity = quantity + ?`,
      [userId, itemName, quantity, quantity],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Get user inventory
 * @param {string} userId - Discord user ID
 */
function getInventory(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM inventory WHERE user_id = ? AND quantity > 0',
      [userId],
      (err, items) => {
        if (err) {
          reject(err);
        } else {
          resolve(items || []);
        }
      }
    );
  });
}

/**
 * Update or create user ranking
 * @param {string} guildId - Guild ID
 * @param {string} userId - Discord user ID
 * @param {string} rankTitle - Rank title
 * @param {number} points - Rank points
 */
function updateRanking(guildId, userId, rankTitle, points) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO rankings (guild_id, user_id, rank_title, points, rank_number) 
       VALUES (?, ?, ?, ?, 0)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET 
        rank_title = ?,
        points = ?,
        achieved_at = CURRENT_TIMESTAMP`,
      [guildId, userId, rankTitle, points, rankTitle, points],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Get guild rankings
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of top rankings to return
 */
function getGuildRankings(guildId, limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.*, u.username FROM rankings r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.guild_id = ? 
       ORDER BY r.points DESC 
       LIMIT ?`,
      [guildId, limit],
      (err, rankings) => {
        if (err) {
          reject(err);
        } else {
          resolve(rankings || []);
        }
      }
    );
  });
}

/**
 * Get user rank in guild
 * @param {string} guildId - Guild ID
 * @param {string} userId - Discord user ID
 */
function getUserRank(guildId, userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM rankings WHERE guild_id = ? AND user_id = ?',
      [guildId, userId],
      (err, rank) => {
        if (err) {
          reject(err);
        } else {
          resolve(rank);
        }
      }
    );
  });
}

/**
 * Get top users by experience
 * @param {number} limit - Number of users to return
 */
function getTopUsers(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT u.*, l.level, l.total_experience, l.messages_sent 
       FROM users u 
       JOIN leveling l ON u.id = l.user_id 
       ORDER BY l.total_experience DESC 
       LIMIT ?`,
      [limit],
      (err, users) => {
        if (err) {
          reject(err);
        } else {
          resolve(users || []);
        }
      }
    );
  });
}

/**
 * Increment command usage count
 * @param {string} userId - Discord user ID
 */
function incrementCommandUsage(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE statistics SET total_commands_used = total_commands_used + 1 WHERE user_id = ?',
      [userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Add voice time
 * @param {string} userId - Discord user ID
 * @param {number} minutes - Minutes to add
 */
function addVoiceTime(userId, minutes) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE statistics SET total_voice_time = total_voice_time + ? WHERE user_id = ?',
      [minutes, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Get user statistics
 * @param {string} userId - Discord user ID
 */
function getStatistics(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM statistics WHERE user_id = ?', [userId], (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

/**
 * Close database connection
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  getOrCreateUser,
  addExperience,
  getLevelingData,
  setLevel,
  addBalance,
  removeBalance,
  getEconomyData,
  depositBank,
  withdrawBank,
  claimDaily,
  addInventoryItem,
  getInventory,
  updateRanking,
  getGuildRankings,
  getUserRank,
  getTopUsers,
  incrementCommandUsage,
  addVoiceTime,
  getStatistics,
};
