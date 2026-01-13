const axios = require('axios');

const TENOR_API_KEY = process.env.TENOR_API_KEY;
const TENOR_API_BASE = 'https://api.tenor.com/v1';

/**
 * Validates that the Tenor API key is configured
 * @throws {Error} If TENOR_API_KEY is not set
 */
function validateApiKey() {
  if (!TENOR_API_KEY) {
    throw new Error('TENOR_API_KEY environment variable is not set');
  }
}

/**
 * Fetches a random GIF from Tenor for a given search query
 * @param {string} query - Search query for the GIF
 * @param {number} limit - Maximum number of results to fetch (default: 1)
 * @returns {Promise<string>} URL of a random GIF or null if not found
 */
async function fetchGif(query, limit = 1) {
  try {
    validateApiKey();

    const response = await axios.get(`${TENOR_API_BASE}/search`, {
      params: {
        q: query,
        key: TENOR_API_KEY,
        limit: Math.min(limit, 50), // Tenor API limit is 50
        contentfilter: 'moderate',
        media_filter: 'gif',
      },
    });

    if (!response.data.results || response.data.results.length === 0) {
      console.warn(`[Tenor] No GIFs found for query: ${query}`);
      return null;
    }

    // Return a random GIF from the results
    const randomIndex = Math.floor(Math.random() * response.data.results.length);
    return response.data.results[randomIndex].media[0].gif.url;
  } catch (error) {
    console.error('[Tenor] Error fetching GIF:', error.message);
    return null;
  }
}

/**
 * Fetches a reaction GIF based on the reaction type
 * @param {string} reactionType - Type of reaction (happy, angry, sad, confused, etc.)
 * @returns {Promise<string|null>} URL of reaction GIF or null if not found
 */
async function getReactionGif(reactionType) {
  const reactionQueries = {
    happy: 'happy dance',
    sad: 'sad crying',
    angry: 'angry',
    confused: 'confused',
    surprised: 'surprised shocked',
    love: 'love heart',
    cool: 'cool sunglasses',
    nervous: 'nervous anxious',
    excited: 'excited jumping',
    disappointed: 'disappointed',
    thinking: 'thinking',
    laugh: 'laughing funny',
  };

  const query = reactionQueries[reactionType.toLowerCase()] || reactionType;
  return fetchGif(query, 10);
}

/**
 * Fetches a celebration GIF for achievements or wins
 * @param {string} celebrationType - Type of celebration (victory, success, achievement, milestone, etc.)
 * @returns {Promise<string|null>} URL of celebration GIF or null if not found
 */
async function getCelebrationGif(celebrationType) {
  const celebrationQueries = {
    victory: 'victory celebration',
    success: 'success celebration',
    achievement: 'achievement unlocked',
    milestone: 'milestone celebration',
    levelup: 'level up',
    win: 'we won victory',
    perfect: 'perfect score',
    champion: 'champion winner',
    applause: 'applause clapping',
    congratulations: 'congratulations',
    fireworks: 'fireworks celebration',
    party: 'party celebration',
  };

  const query = celebrationQueries[celebrationType.toLowerCase()] || celebrationType;
  return fetchGif(query, 10);
}

/**
 * Fetches a GIF for command feedback (success, error, loading, etc.)
 * @param {string} feedbackType - Type of feedback (success, error, loading, warning, info, etc.)
 * @returns {Promise<string|null>} URL of feedback GIF or null if not found
 */
async function getCommandFeedbackGif(feedbackType) {
  const feedbackQueries = {
    success: 'success confirmed',
    error: 'error fail',
    loading: 'loading waiting',
    warning: 'warning caution',
    info: 'information',
    processing: 'processing loading',
    complete: 'complete done',
    pending: 'pending waiting',
    ready: 'ready set go',
    denied: 'denied refused',
    approved: 'approved accepted',
    rejected: 'rejected no',
  };

  const query = feedbackQueries[feedbackType.toLowerCase()] || feedbackType;
  return fetchGif(query, 10);
}

/**
 * Fetches multiple random GIFs for a given query
 * @param {string} query - Search query for GIFs
 * @param {number} count - Number of GIFs to fetch (max 50)
 * @returns {Promise<Array<string>>} Array of GIF URLs
 */
async function fetchMultipleGifs(query, count = 5) {
  try {
    validateApiKey();

    const response = await axios.get(`${TENOR_API_BASE}/search`, {
      params: {
        q: query,
        key: TENOR_API_KEY,
        limit: Math.min(count, 50),
        contentfilter: 'moderate',
        media_filter: 'gif',
      },
    });

    if (!response.data.results || response.data.results.length === 0) {
      console.warn(`[Tenor] No GIFs found for query: ${query}`);
      return [];
    }

    return response.data.results.map((result) => result.media[0].gif.url);
  } catch (error) {
    console.error('[Tenor] Error fetching multiple GIFs:', error.message);
    return [];
  }
}

/**
 * Gets trending GIFs from Tenor
 * @param {number} limit - Number of trending GIFs to fetch (max 50)
 * @returns {Promise<Array<string>>} Array of trending GIF URLs
 */
async function getTrendingGifs(limit = 10) {
  try {
    validateApiKey();

    const response = await axios.get(`${TENOR_API_BASE}/trending`, {
      params: {
        key: TENOR_API_KEY,
        limit: Math.min(limit, 50),
        contentfilter: 'moderate',
        media_filter: 'gif',
      },
    });

    if (!response.data.results || response.data.results.length === 0) {
      console.warn('[Tenor] No trending GIFs available');
      return [];
    }

    return response.data.results.map((result) => result.media[0].gif.url);
  } catch (error) {
    console.error('[Tenor] Error fetching trending GIFs:', error.message);
    return [];
  }
}

/**
 * Registers a GIF view with Tenor analytics
 * @param {string} gifId - The ID of the GIF
 * @returns {Promise<void>}
 */
async function registerGifView(gifId) {
  try {
    validateApiKey();

    await axios.get(`${TENOR_API_BASE}/registershare`, {
      params: {
        id: gifId,
        key: TENOR_API_KEY,
      },
    });
  } catch (error) {
    console.warn('[Tenor] Error registering GIF view:', error.message);
  }
}

/**
 * Fetches autocomplete suggestions for a search query
 * @param {string} query - Partial search query
 * @returns {Promise<Array<string>>} Array of autocomplete suggestions
 */
async function getAutocompleteSuggestions(query) {
  try {
    validateApiKey();

    const response = await axios.get(`${TENOR_API_BASE}/autocomplete`, {
      params: {
        q: query,
        key: TENOR_API_KEY,
        limit: 10,
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error('[Tenor] Error fetching autocomplete suggestions:', error.message);
    return [];
  }
}

module.exports = {
  fetchGif,
  getReactionGif,
  getCelebrationGif,
  getCommandFeedbackGif,
  fetchMultipleGifs,
  getTrendingGifs,
  registerGifView,
  getAutocompleteSuggestions,
};
