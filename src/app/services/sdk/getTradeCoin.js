/**
 * @fileoverview Service functions for Zora SDK trade operations
 * @module tradeCoin
 */

import { tradeCoinCall, getTradeFromLogs } from "@zoralabs/coins-sdk";
import { setApiKey } from "@zoralabs/coins-sdk";
import { ethers } from "ethers";

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
 * Prepares contract call parameters for trade operation
 * @param {string} direction - Trade direction ('buy' or 'sell')
 * @param {string} coinAddress - Coin address
 * @param {string} recipientAddress - Recipient address
 * @param {bigint} orderSize - Order size
 * @param {bigint} minAmountOut - Minimum output amount
 * @param {string} [referrerAddress] - Referrer address
 * @param {number} [slippage] - Slippage percentage
 * @returns {object} Contract call parameters
 */
export function getTradeContractCallParams(
  direction,
  coinAddress,
  recipientAddress,
  orderSize,
  minAmountOut = 0n,
  referrerAddress = null,
  slippage = 0.05
) {
  try {
    if (!recipientAddress) {
      throw new Error("Recipient address is required");
    }

    const params = tradeCoinCall({
      target: coinAddress,
      direction: direction === "buy" ? "buy" : "sell",
      slippage,
      args: {
        recipient: recipientAddress,
        orderSize,
        minAmountOut,
        tradeReferrer: referrerAddress || recipientAddress,
      },
    });

    if (direction === "buy") {
      return {
        ...params,
        value: orderSize,
      };
    }

    return params;
  } catch (error) {
    console.error("Contract parameter preparation error:", error);
    throw error;
  }
}

/**
 * Extracts trade event from transaction logs
 * @param {object} receipt - Transaction receipt
 * @param {string} direction - Trade direction
 * @returns {object|null} Trade event details
 */
export const extractTradeFromLogs = (receipt, direction) => {
  try {
    return getTradeFromLogs(receipt, direction);
  } catch (error) {
    console.error("Trade event extraction error:", error);
    return null;
  }
};

/**
 * Checks ETH balance
 * @param {string} userAddress - User address
 * @param {object} publicClient - Viem public client
 * @returns {Promise<bigint>} ETH balance (wei)
 */
export const checkETHBalance = async (userAddress, publicClient) => {
  try {
    if (!userAddress || !userAddress.startsWith("0x")) {
      throw new Error("Valid user address is required");
    }
    
    if (!publicClient) {
      throw new Error("Valid publicClient is required");
    }
    
    // Implement retry mechanism with exponential backoff
    let retries = 0;
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second initial delay
    
    while (retries <= maxRetries) {
      try {
        const balance = await publicClient.getBalance({
          address: userAddress,
        });
        
        return balance;
      } catch (error) {
        // Check if it's a rate limit error
        const isRateLimit = 
          error.message?.includes("rate limit") || 
          error.message?.includes("over rate limit") || 
          error.details?.includes("rate limit") ||
          error.code === 429 ||
          error.status === 429;
        
        // If we've reached max retries or it's not a rate limit error, throw
        if (retries >= maxRetries || !isRateLimit) {
          throw error;
        }
        
        // Calculate exponential backoff delay with jitter
        const delay = baseDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.log(`Rate limit hit. Retrying in ${Math.round(delay/1000)}s... (Attempt ${retries + 1}/${maxRetries})`);
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increment retry counter
        retries++;
      }
    }
  } catch (error) {
    console.error("ETH balance check error:", error);
    throw error;
  }
};

/**
 * Checks token balance
 * @param {string} userAddress - User address
 * @param {string} tokenAddress - Token address
 * @param {object} publicClient - Viem public client
 * @returns {Promise<bigint>} Token balance
 */
export const checkTokenBalance = async (
  userAddress,
  tokenAddress,
  publicClient
) => {
  try {
    if (
      !userAddress ||
      !userAddress.startsWith("0x") ||
      !tokenAddress ||
      !tokenAddress.startsWith("0x")
    ) {
      throw new Error("Valid addresses are required");
    }
    
    if (!publicClient) {
      throw new Error("Valid publicClient is required");
    }
    
    const erc20ABI = [
      {
        constant: true,
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function",
      },
    ];
    
    // Implement retry mechanism with exponential backoff
    let retries = 0;
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second initial delay
    
    while (retries <= maxRetries) {
      try {
        const balance = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20ABI,
          functionName: "balanceOf",
          args: [userAddress],
        });
        
        return balance;
      } catch (error) {
        // Check if it's a rate limit error
        const isRateLimit = 
          error.message?.includes("rate limit") || 
          error.message?.includes("over rate limit") || 
          error.details?.includes("rate limit") ||
          error.code === 429 ||
          error.status === 429;
        
        // If we've reached max retries or it's not a rate limit error, throw
        if (retries >= maxRetries || !isRateLimit) {
          throw error;
        }
        
        // Calculate exponential backoff delay with jitter
        const delay = baseDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.log(`Rate limit hit. Retrying in ${Math.round(delay/1000)}s... (Attempt ${retries + 1}/${maxRetries})`);
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increment retry counter
        retries++;
      }
    }
  } catch (error) {
    console.error("Token balance check error:", error);
    throw error;
  }
};

/**
 * Validates balance sufficiency for trade
 * @param {string} userAddress - User address
 * @param {string} coinAddress - Coin address
 * @param {string} tradeType - Trade type ('buy' or 'sell')
 * @param {bigint} amount - Trade amount
 * @param {object} publicClient - Viem public client
 * @returns {Promise<object>} Validation result
 */
export const validateTradeBalance = async (
  userAddress,
  coinAddress,
  tradeType,
  amount,
  publicClient
) => {
  try {
    if (!userAddress || !userAddress.startsWith("0x")) {
      return {
        isValid: false,
        currentBalance: 0n,
        message: "Valid user address is required",
      };
    }
    
    if (!amount || amount <= 0n) {
      return {
        isValid: false,
        currentBalance: 0n,
        message: "Valid trade amount is required",
      };
    }

    if (tradeType === "buy") {
      const ethBalance = await checkETHBalance(userAddress, publicClient);
      const gasReserve = 2n * 10n ** 15n;
      const availableBalance =
        ethBalance > gasReserve ? ethBalance - gasReserve : 0n;
      
      if (availableBalance < amount) {
        return {
          isValid: false,
          currentBalance: ethBalance,
          message: `Insufficient ETH balance. Your balance: ${ethers.utils.formatEther(
            ethBalance
          )} ETH, required: ~${ethers.utils.formatEther(
            amount + gasReserve
          )} ETH (trade + gas)`,
        };
      }
    }
    
    return {
      isValid: true,
      currentBalance: 0n,
      message: "Sufficient balance for trade",
    };
  } catch (error) {
    console.error("Balance validation error:", error);
    throw error;
  }
};
