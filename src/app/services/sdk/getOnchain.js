import { createPublicClient, http, formatEther } from "viem";
import { base } from "viem/chains";
import { getOnchainCoinDetails } from "@zoralabs/coins-sdk";
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

// RPC URL from environment variable or default Base RPC
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org";

// Create viem publicClient
export const getPublicClient = () => {
  return createPublicClient({
    chain: base,
    transport: http(RPC_URL),
  });
};

/**
 * Fetch token details directly from blockchain using Zora SDK
 * @param {string} tokenAddress - Token contract address
 * @param {string} userAddress - Optional user address to get balance for
 * @returns {Promise<object>} Token details from blockchain
 */
export const getOnchainTokenDetails = async (tokenAddress, userAddress = null) => {
  if (!tokenAddress) return null;
  
  try {
    const publicClient = getPublicClient();
    
    // Build parameters for getOnchainCoinDetails
    const params = {
      coin: tokenAddress,
      publicClient,
      // Only include user parameter if userAddress is provided and valid
      ...(userAddress && userAddress !== "0x0000000000000000000000000000000000000000" ? { user: userAddress } : {})
    };
    
    console.log("Fetching onchain details with params:", { ...params, publicClient: "[PublicClient]" });
    
    const details = await getOnchainCoinDetails(params);
    console.log("Raw onchain details:", details);
    
    // Format the response according to the new SDK structure
    const formattedDetails = {
      // Basic coin information
      address: details.address || tokenAddress,
      name: details.name || "Unknown",
      symbol: details.symbol || "???",
      decimals: details.decimals || 18,
      totalSupply: details.totalSupply ? {
        raw: details.totalSupply.toString(),
        formatted: formatEther(details.totalSupply)
      } : {
        raw: "0",
        formatted: "0"
      },
      
      // Pool information
      pool: details.pool || "0x0000000000000000000000000000000000000000",
      liquidity: details.liquidity ? {
        raw: details.liquidity.toString(),
        formatted: formatEther(details.liquidity)
      } : {
        raw: "0",
        formatted: "0"
      },
      marketCap: details.marketCap ? {
        raw: details.marketCap.toString(),
        formatted: formatEther(details.marketCap)
      } : {
        raw: "0",
        formatted: "0"
      },
      
      // Governance
      owners: details.owners || [],
      payoutRecipient: details.payoutRecipient || "0x0000000000000000000000000000000000000000",
      
      // User-specific information (only if user parameter was provided and balance exists)
      ...(details.balance ? {
        balance: {
          raw: details.balance.toString(),
          formatted: formatEther(details.balance)
        }
      } : {}),
      
      // Additional metadata
      timestamp: Date.now(),
      source: "onchain"
    };
    
    console.log("Formatted onchain details:", formattedDetails);
    return formattedDetails;
    
  } catch (error) {
    console.error("Error fetching onchain data:", error);
    
    // Return error state instead of throwing
    return {
      address: tokenAddress,
      name: "Error Loading",
      symbol: "ERROR",
      decimals: 18,
      totalSupply: {
        raw: "0",
        formatted: "0"
      },
      pool: "0x0000000000000000000000000000000000000000",
      liquidity: {
        raw: "0",
        formatted: "0"
      },
      marketCap: {
        raw: "0",
        formatted: "0"
      },
      owners: [],
      payoutRecipient: "0x0000000000000000000000000000000000000000",
      error: error.message,
      timestamp: Date.now(),
      source: "onchain"
    };
  }
};



/**
 * Fetch multiple coin details in parallel (for better performance)
 * @param {Array} coinAddresses - Array of coin contract addresses
 * @param {string} userAddress - Optional user address to get balances for
 * @returns {Promise<Array>} Array of coin details
 */
export const getMultipleOnchainTokenDetails = async (coinAddresses, userAddress = null) => {
  if (!coinAddresses || !Array.isArray(coinAddresses)) {
    return [];
  }
  
  try {
    // Execute all queries in parallel for better performance
    const detailsPromises = coinAddresses.map(address => 
      getOnchainTokenDetails(address, userAddress)
    );
    
    const allDetails = await Promise.all(detailsPromises);
    return allDetails.filter(Boolean); // Remove any null results
    
  } catch (error) {
    console.error("Error fetching multiple onchain details:", error);
    return [];
  }
}; 