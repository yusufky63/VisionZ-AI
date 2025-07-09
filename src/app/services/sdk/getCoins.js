/**
 * @fileoverview Zora SDK functions for fetching coin data
 * @module sdk/getCoins
 */

import {
  getCoin,
  getCoinComments,
  setApiKey,
} from "@zoralabs/coins-sdk";

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
 * API request retry mechanism
 * @param {Function|string} urlOrFn - API URL or function to call
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} retryDelay - Delay between retries (ms)
 * @returns {Promise<object>} API response
 */
const retryFetch = async (
  urlOrFn,
  options = {},
  maxRetries = 5,
  retryDelay = 1000
) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let response;

      if (typeof urlOrFn === "function") {
        response = await urlOrFn();
      } else {
        response = await fetch(urlOrFn, options);

        if (!response.ok) {
          throw new Error(
            `HTTP error! Status: ${response.status} - ${response.statusText}`
          );
        }
      }

      if (response.data === undefined && typeof response.json === "function") {
        const jsonData = await response.json();

        if (jsonData.errors && jsonData.errors.length > 0) {
          throw new Error(`API Error: ${jsonData.errors[0].message}`);
        }

        return jsonData;
      }

      return response;
    } catch (error) {
      console.warn(`Request failed (${attempt}/${maxRetries}):`, error.message);
      lastError = error;

      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error(`${maxRetries} attempts failed:`, lastError);

  const retryError = new Error(
    `Request failed. Please check your internet connection and try again.`
  );
  retryError.originalError = lastError;
  retryError.isRetryError = true;
  throw retryError;
};

/**
 * Fetches coin details
 * @param {string} address - Coin address
 * @returns {Promise<object>} Coin details
 */
export async function fetchCoinDetails(address) {
  const fetchCoinData = async () => {
    const response = await getCoin({
      address,
      chain: 8453,
      
    });
    return response.data?.zora20Token;
  };

  try {
    return await retryFetch(fetchCoinData);
  } catch (error) {
    console.error("Failed to fetch coin details:", error);
    throw error;
  }
}

/**
 * Fetches coin comments
 * @param {string} coinAddress - Coin address
 * @param {number} count - Comments per page
 * @param {string} after - Cursor for pagination
 * @returns {Promise<object>} Comments and pagination info
 */
export const fetchCoinComments = async (
  coinAddress,
  count = 20,
  after = null
) => {
  try {
    if (!coinAddress) {
      throw new Error("Valid coin address required to load comments");
    }

    const response = await getCoinComments({
      address: coinAddress,
      chain: 8453,
      count: count,
      after: after,
    });

    if (!response?.data?.zora20Token?.zoraComments) {
      throw new Error("Failed to fetch comment data");
    }

    return {
      comments: response.data.zora20Token.zoraComments.edges || [],
      pageInfo: response.data.zora20Token.zoraComments.pageInfo || {},
      totalCount: response.data.zora20Token.zoraComments.count || 0,
    };
  } catch (error) {
    console.error("Error fetching comment data:", error);

    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("NetworkRequest")
    ) {
      error.message =
        "Cannot reach comment server. Please check your internet connection.";
    }

    throw error;
  }
};

/**
 * Extracts trade event from transaction logs
 * Note: This is a placeholder. The actual implementation would require importing 
 * the getTradeFromLogs function from the appropriate SDK module.
 * @param {object} receipt - Transaction receipt
 * @param {string} direction - Trade direction
 * @returns {object|null} Trade event details
 */
export const extractTradeFromLogs = (receipt, direction) => {
  try {
    // Log parameters to avoid unused variable warnings
    console.log(`Extracting ${direction} trade from receipt:`, 
      receipt ? `Receipt ID: ${receipt.transactionHash || 'unknown'}` : 'No receipt provided');
      
    // Placeholder for trade extraction logic
    // This functionality may require additional imports or implementation
    console.warn("Trade extraction not fully implemented");
    return null;
  } catch (error) {
    console.error("Error extracting trade event:", error);
    return null;
  }
};

/**
 * Fetches coin details
 * @param {string} address - Coin address
 * @param {number} chain - Chain ID
 * @returns {Promise<object>} Coin details
 */
export const getCoinDetails = async (address, chain = 8453) => {
  const fetchCoinData = async () => {
    try {
      const response = await getCoin({
        address,
        chain,
      });

      if (!response?.data?.zora20Token) {
        throw new Error("Failed to fetch coin details");
      }

      console.log(
        `Zora coin details (${address}):`,
        response.data.zora20Token
      );
      return response.data.zora20Token;
    } catch (error) {
      console.error("Error fetching coin details:", error);
      throw error;
    }
  };

  try {
    return await retryFetch(fetchCoinData);
  } catch (error) {
    console.error("Error fetching coin details:", error);
    throw error;
  }
};

/**
 * Searches for a token by address and validates it
 * @param {string} address - Token address to search
 * @returns {Promise<object>} Token details if found and valid
 */
export const searchTokenByAddress = async (address) => {
  try {
    // Basic address validation
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error("Invalid token address format");
    }

    const tokenData = await getCoinDetails(address);
    
    if (!tokenData) {
      throw new Error("Token not found");
    }

    // Validate that this is an active token
    if (!tokenData.name || !tokenData.symbol) {
      throw new Error("Invalid token data");
    }

    return {
      success: true,
      data: tokenData
    };

  } catch (error) {
    console.error("Error searching token:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch token"
    };
  }
}; 