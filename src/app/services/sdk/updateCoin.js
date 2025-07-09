import { updateCoinURI, updatePayoutRecipient } from "@zoralabs/coins-sdk";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

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
 * Update coin metadata URI (only callable by coin owners)
 * @param {string} coinAddress - Coin contract address
 * @param {string} newURI - New metadata URI (should start with "ipfs://")
 * @param {object} walletClient - Viem wallet client for signing
 * @returns {Promise<object>} Transaction result
 */
export const updateCoinMetadataURI = async (coinAddress, newURI, walletClient) => {
  if (!coinAddress || !newURI || !walletClient) {
    throw new Error("Missing required parameters for URI update");
  }
  
  // Validate URI format
  if (!newURI.startsWith("ipfs://") && !newURI.startsWith("https://")) {
    throw new Error("URI must start with 'ipfs://' (recommended) or 'https://'");
  }
  
  try {
    const publicClient = getPublicClient();
    
    const updateParams = {
      coin: coinAddress,
      newURI: newURI
    };
    
    console.log("Updating coin URI:", updateParams);
    
    const result = await updateCoinURI(updateParams, walletClient, publicClient);
    
    console.log("URI update result:", result);
    return result;
    
  } catch (error) {
    console.error("Error updating coin URI:", error);
    throw error;
  }
};

/**
 * Update coin payout recipient (only callable by coin owners)
 * @param {string} coinAddress - Coin contract address  
 * @param {string} newPayoutRecipient - New payout recipient address
 * @param {object} walletClient - Viem wallet client for signing
 * @returns {Promise<object>} Transaction result
 */
export const updateCoinPayoutRecipient = async (coinAddress, newPayoutRecipient, walletClient) => {
  if (!coinAddress || !newPayoutRecipient || !walletClient) {
    throw new Error("Missing required parameters for payout recipient update");
  }
  
  try {
    const publicClient = getPublicClient();
    
    const updateParams = {
      coin: coinAddress,
      newPayoutRecipient: newPayoutRecipient
    };
    
    console.log("Updating payout recipient:", updateParams);
    
    const result = await updatePayoutRecipient(updateParams, walletClient, publicClient);
    
    console.log("Payout recipient update result:", result);
    return result;
    
  } catch (error) {
    console.error("Error updating payout recipient:", error);
    throw error;
  }
};

/**
 * Check if current user is an owner of the coin
 * @param {string} userAddress - Current user's wallet address
 * @param {Array} owners - Array of owner addresses from onchain data
 * @returns {boolean} True if user is an owner
 */
export const isUserCoinOwner = (userAddress, owners) => {
  if (!userAddress || !owners || !Array.isArray(owners)) return false;
  return owners.some(owner => 
    owner.toLowerCase() === userAddress.toLowerCase()
  );
};

/**
 * Validate Ethereum address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid Ethereum address
 */
export const isValidEthereumAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  return address.startsWith('0x') && address.length === 42;
};

/**
 * Validate metadata URI format
 * @param {string} uri - URI to validate
 * @returns {object} Validation result with isValid and message
 */
export const validateMetadataURI = (uri) => {
  if (!uri || typeof uri !== 'string') {
    return { isValid: false, message: "URI is required" };
  }
  
  if (!uri.startsWith("ipfs://") && !uri.startsWith("https://")) {
    return { 
      isValid: false, 
      message: "URI must start with 'ipfs://' (recommended) or 'https://'" 
    };
  }
  
  return { isValid: true, message: "" };
}; 