/**
 * Emotes and GIF Configuration Module
 * Provides centralized emoji and GIF mappings for all bot features
 * Last Updated: 2026-01-13
 */

const emotes = {
  // ==================== ECONOMY EMOTES ====================
  economy: {
    coin: '💰',
    wallet: '👛',
    bank: '🏦',
    money: '💵',
    gem: '💎',
    gift: '🎁',
    store: '🛍️',
    transaction: '💳',
    profit: '📈',
    loss: '📉',
    balance: '⚖️',
    upgrade: '⬆️',
  },

  // ==================== LEVELING EMOTES ====================
  leveling: {
    levelUp: '⬆️',
    exp: '✨',
    badge: '🏅',
    trophy: '🏆',
    star: '⭐',
    rank: '🎖️',
    progress: '📊',
    achievement: '🎯',
    milestone: '🎉',
    leaderboard: '📋',
    skill: '🔧',
    power: '⚡',
  },

  // ==================== MODERATION EMOTES ====================
  moderation: {
    warn: '⚠️',
    mute: '🔇',
    unmute: '🔊',
    kick: '👢',
    ban: '🚫',
    unban: '✅',
    lock: '🔒',
    unlock: '🔓',
    timeout: '⏱️',
    report: '📢',
    flag: '🚩',
    shield: '🛡️',
    gavel: '⚖️',
    note: '📝',
  },

  // ==================== SECURITY EMOTES ====================
  security: {
    verified: '✅',
    denied: '❌',
    lock: '🔒',
    unlock: '🔓',
    key: '🔑',
    alert: '🚨',
    danger: '⛔',
    safe: '✔️',
    attention: '⚠️',
    shield: '🛡️',
    eye: '👁️',
    suspicious: '🕵️',
  },

  // ==================== MUSIC EMOTES ====================
  music: {
    play: '▶️',
    pause: '⏸️',
    stop: '⏹️',
    next: '⏭️',
    previous: '⏮️',
    shuffle: '🔀',
    repeat: '🔁',
    volume: '🔊',
    mute: '🔇',
    queue: '📋',
    speaker: '🎙️',
    note: '🎵',
    album: '💿',
    headphones: '🎧',
    music: '🎶',
    radioWave: '📻',
  },

  // ==================== AI EMOTES ====================
  ai: {
    brain: '🧠',
    robot: '🤖',
    sparkles: '✨',
    thinking: '🤔',
    bulb: '💡',
    gear: '⚙️',
    circuit: '🔌',
    data: '💾',
    chat: '💬',
    message: '📧',
    ai: '🤖',
    automate: '🔄',
    magic: '✨',
  },

  // ==================== GENERAL UTILITY EMOTES ====================
  general: {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
    loading: '⏳',
    arrow: '➡️',
    check: '✔️',
    cross: '✖️',
    back: '⬅️',
    forward: '➡️',
    up: '⬆️',
    down: '⬇️',
    refresh: '🔄',
    settings: '⚙️',
    help: '❓',
    question: '❔',
    exclamation: '❗',
    clock: '🕐',
    calendar: '📅',
    location: '📍',
    user: '👤',
    users: '👥',
    heart: '❤️',
    star: '⭐',
    fire: '🔥',
    ice: '🧊',
    empty: '⬜',
    full: '🟩',
  },

  // ==================== STATUS INDICATORS ====================
  status: {
    online: '🟢',
    idle: '🟡',
    dnd: '🔴',
    offline: '⚫',
    bot: '🤖',
    verified: '✅',
    early: '⏰',
  },

  // ==================== GAME EMOTES ====================
  games: {
    dice: '🎲',
    cards: '🃏',
    gamepad: '🎮',
    target: '🎯',
    puzzles: '🧩',
    trophy: '🏆',
    win: '🥇',
    lose: '🥉',
  },
};

// ==================== GIF CONFIGURATIONS ====================
const gifs = {
  // Economy GIFs
  economy: {
    celebrate: 'https://media.giphy.com/media/l0HlTy9x8FZo0XO1i/giphy.gif',
    coins: 'https://media.giphy.com/media/26BRv0ThJJZismYgw/giphy.gif',
    money: 'https://media.giphy.com/media/1jkV5ifEE5EENHESRa/giphy.gif',
    rich: 'https://media.giphy.com/media/lnOG2jwyWego0/giphy.gif',
  },

  // Leveling GIFs
  leveling: {
    levelUp: 'https://media.giphy.com/media/26BROrSH2XcsuGUJi/giphy.gif',
    achievement: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    celebration: 'https://media.giphy.com/media/l0HlDtKPoYJhFtgQ4/giphy.gif',
    success: 'https://media.giphy.com/media/l0IypeKl9NJhFXjiM/giphy.gif',
  },

  // Moderation GIFs
  moderation: {
    banned: 'https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif',
    warning: 'https://media.giphy.com/media/l0HlPy9x8FZo0XO1i/giphy.gif',
    muted: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    kick: 'https://media.giphy.com/media/3o85xIO33l7RlmLR4I/giphy.gif',
  },

  // Security GIFs
  security: {
    verified: 'https://media.giphy.com/media/l0HlQaQ6CCJOSVMLH/giphy.gif',
    alert: 'https://media.giphy.com/media/3o6Zt5NireKVfIW926/giphy.gif',
    shield: 'https://media.giphy.com/media/3ohzdKdb7OX1UnNzjG/giphy.gif',
    locked: 'https://media.giphy.com/media/l0HlDtKPoYJhFtgQ4/giphy.gif',
  },

  // Music GIFs
  music: {
    playing: 'https://media.giphy.com/media/l0HlQaQ6CCJOSVMLH/giphy.gif',
    dancing: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    vibing: 'https://media.giphy.com/media/3o6ZtpWz286Ve0CjAI/giphy.gif',
    headphones: 'https://media.giphy.com/media/l0HlDZHc33hBLVViZ4/giphy.gif',
    queue: 'https://media.giphy.com/media/3o6ZtJx2XpqRmFL3OE/giphy.gif',
  },

  // AI GIFs
  ai: {
    thinking: 'https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif',
    processing: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    robot: 'https://media.giphy.com/media/l0HlQaQ6CCJOSVMLH/giphy.gif',
    loading: 'https://media.giphy.com/media/3o6ZtJx2XpqRmFE3GO/giphy.gif',
    sparkles: 'https://media.giphy.com/media/l0HlNaQ7qC8ZNrp6U/giphy.gif',
  },

  // General/Utility GIFs
  general: {
    loading: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    error: 'https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif',
    success: 'https://media.giphy.com/media/l0HlQaQ6CCJOSVMLH/giphy.gif',
    wave: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get an emoji by category and name
 * @param {string} category - The category of emote (e.g., 'economy', 'moderation')
 * @param {string} name - The name of the emote
 * @returns {string} The emoji or a default warning emoji if not found
 */
function getEmote(category, name) {
  if (emotes[category] && emotes[category][name]) {
    return emotes[category][name];
  }
  console.warn(`Emote not found: ${category}.${name}`);
  return '⚠️';
}

/**
 * Get a GIF by category and name
 * @param {string} category - The category of GIF (e.g., 'economy', 'music')
 * @param {string} name - The name of the GIF
 * @returns {string} The GIF URL or undefined if not found
 */
function getGif(category, name) {
  if (gifs[category] && gifs[category][name]) {
    return gifs[category][name];
  }
  console.warn(`GIF not found: ${category}.${name}`);
  return undefined;
}

/**
 * Get all emotes for a specific category
 * @param {string} category - The category of emotes
 * @returns {object} Object containing all emotes in the category
 */
function getEmotesByCategory(category) {
  return emotes[category] || {};
}

/**
 * Get all GIFs for a specific category
 * @param {string} category - The category of GIFs
 * @returns {object} Object containing all GIFs in the category
 */
function getGifsByCategory(category) {
  return gifs[category] || {};
}

/**
 * Check if an emote exists
 * @param {string} category - The category of emote
 * @param {string} name - The name of the emote
 * @returns {boolean} Whether the emote exists
 */
function hasEmote(category, name) {
  return emotes[category] && emotes[category][name] !== undefined;
}

/**
 * Check if a GIF exists
 * @param {string} category - The category of GIF
 * @param {string} name - The name of the GIF
 * @returns {boolean} Whether the GIF exists
 */
function hasGif(category, name) {
  return gifs[category] && gifs[category][name] !== undefined;
}

// ==================== EXPORTS ====================
module.exports = {
  emotes,
  gifs,
  getEmote,
  getGif,
  getEmotesByCategory,
  getGifsByCategory,
  hasEmote,
  hasGif,
};
