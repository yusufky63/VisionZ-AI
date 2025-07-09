/**
 * @fileoverview Zora SDK functions for market data and explore features
 * @module sdk/getMarket
 */

import {
  getCoinsTopGainers,
  getCoinsTopVolume24h,
  getCoinsMostValuable,
  getCoinsNew,
  getCoinsLastTraded,
  getCoinsLastTradedUnique,
} from "@zoralabs/coins-sdk";

import { setApiKey } from "@zoralabs/coins-sdk";

// Initialize API key for production environments
// Uses environment variable or allows manual override
const initializeApiKey = () => {
  const apiKey = process.env.NEXT_PUBLIC_ZORA_API_KEY;
  if (apiKey) {
    setApiKey(apiKey);
    console.log("Zora API key initialized from environment variables");
  }
};

// Call initialization on module load
initializeApiKey();

/**
 * Fetches top gaining tokens
 * @param {Object} params - Query parameters
 * @param {number} params.count - Number of tokens to fetch
 * @param {string} params.after - Pagination cursor
 * @param {number} params.chainId - Chain ID (default: 8453 for Base)
 * @returns {Promise<Object>} Top gainers data
 */
export const fetchTopGainers = async ({ count = 50, after = null, chainId = 8453 }) => {
  try {
    const response = await getCoinsTopGainers({ count, after, chainId });
    return response;
  } catch (error) {
    console.error("Error fetching top gainers:", error);
    throw error;
  }
};

/**
 * Fetches tokens with highest 24h volume
 * @param {Object} params - Query parameters
 * @param {number} params.count - Number of tokens to fetch
 * @param {string} params.after - Pagination cursor
 * @param {number} params.chainId - Chain ID (default: 8453 for Base)
 * @returns {Promise<Object>} Top volume tokens data
 */
export const fetchTopVolume = async ({ count = 50, after = null, chainId = 8453 }) => {
  try {
    const response = await getCoinsTopVolume24h({ count, after, chainId });
    return response;
  } catch (error) {
    console.error("Error fetching top volume tokens:", error);
    throw error;
  }
};

/**
 * Fetches most valuable tokens
 * @param {Object} params - Query parameters
 * @param {number} params.count - Number of tokens to fetch
 * @param {string} params.after - Pagination cursor
 * @param {number} params.chainId - Chain ID (default: 8453 for Base)
 * @returns {Promise<Object>} Most valuable tokens data
 */
export const fetchMostValuable = async ({ count = 50, after = null, chainId = 8453 }) => {
  try {
    const response = await getCoinsMostValuable({ count, after, chainId });
    return response;
  } catch (error) {
    console.error("Error fetching most valuable tokens:", error);
    throw error;
  }
};

/**
 * Fetches newly created tokens
 * @param {Object} params - Query parameters
 * @param {number} params.count - Number of tokens to fetch
 * @param {string} params.after - Pagination cursor
 * @param {number} params.chainId - Chain ID (default: 8453 for Base)
 * @returns {Promise<Object>} New tokens data
 */
export const fetchNewCoins = async ({ count = 50, after = null, chainId = 8453 }) => {
  try {
    const response = await getCoinsNew({ count, after, chainId });
    return response;
  } catch (error) {
    console.error("Error fetching new tokens:", error);
    throw error;
  }
};

/**
 * Fetches recently traded tokens
 * @param {Object} params - Query parameters
 * @param {number} params.count - Number of tokens to fetch
 * @param {string} params.after - Pagination cursor
 * @param {number} params.chainId - Chain ID (default: 8453 for Base)
 * @returns {Promise<Object>} Recently traded tokens data
 */
export const fetchLastTraded = async ({ count = 50, after = null, chainId = 8453 }) => {
  try {
    const response = await getCoinsLastTraded({ count, after, chainId });
    return response;
  } catch (error) {
    console.error("Error fetching recently traded tokens:", error);
    throw error;
  }
};

/**
 * Fetches unique recently traded tokens
 * @param {Object} params - Query parameters
 * @param {number} params.count - Number of tokens to fetch
 * @param {string} params.after - Pagination cursor
 * @param {number} params.chainId - Chain ID (default: 8453 for Base)
 * @returns {Promise<Object>} Unique recently traded tokens data
 */
export const fetchLastTradedUnique = async ({ count = 50, after = null, chainId = 8453 }) => {
  try {
    const response = await getCoinsLastTradedUnique({ count, after, chainId });
    return response;
  } catch (error) {
    console.error("Error fetching unique recently traded tokens:", error);
    throw error;
  }
};

/**
 * Generic fetch with retry mechanism for market data
 * @param {Function} fn - SDK function to call
 * @param {Object} args - Function arguments
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<Object>} Response data
 */
export async function fetchWithRetry(fn, args, maxRetries = 5, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fn(args);
      return response;
    } catch (error) {
      lastError = error;
      
      // Retry on rate limit (429) or network errors
      const is429 = error?.response?.status === 429 || 
                    error?.status === 429 || 
                    error?.message?.includes('429');
      const isNetwork = error?.message?.includes('Network') || 
                       error?.message?.includes('network');
      
      if (is429 || isNetwork) {
        console.log(`Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
        if (attempt < maxRetries - 1) {
          await new Promise((res) => setTimeout(res, delay));
          // Increase delay for next attempt (exponential backoff)
          delay = delay * 1.5;
        }
      } else {
        // Don't retry for other errors
        throw error;
      }
    }
  }
  
  throw lastError;
} 