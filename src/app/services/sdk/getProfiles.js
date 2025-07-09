/**
 * @fileoverview Zora SDK functions for fetching profile data
 * @module sdk/getProfiles
 */

import { getProfile, getProfileBalances, setApiKey } from "@zoralabs/coins-sdk";
import { getCoinDetails } from "./getCoins";

// Import getCoinDetails to use in verifyAddressType function
setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY);
/**
 * Fetches Zora profile with simple retry mechanism
 * @param {string} identifier - Wallet address or profile handle
 * @param {boolean} isHandle - Whether the identifier is a handle (true) or wallet address (false)
 * @returns {Promise<object>} Profile details
 */
export const getZoraProfile = async (identifier, isHandle = false) => {
  const maxRetries = 10;
  const baseRetryDelay = 3000;
  let currentAttempt = 0;

  while (currentAttempt < maxRetries) {
    try {
      // Doğrudan API isteği yap
      const response = await getProfile(
        {
          identifier: identifier,
          chainId: 8453,
          isHandle: isHandle,
        },
        {
          headers: {
            "api-key": process.env.NEXT_PUBLIC_ZORA_API_KEY,
          },
        }
      );

      // GraphQL hata kontrolü
      if (
        response.errors &&
        Array.isArray(response.errors) &&
        response.errors.length > 0
      ) {
        const errorMessage = response.errors[0].message || "";

        // Rate limit hatalarını kontrol et
        if (
          errorMessage.toLowerCase().includes("rate limit") ||
          errorMessage.toLowerCase().includes("too many requests") ||
          errorMessage.toLowerCase().includes("try again")
        ) {
          console.warn("Profile fetch rate limit detected:", errorMessage);

          // Özel bekleme süresi kontrolü
          const waitMatch = errorMessage.match(/try again in (\d+) seconds/i);
          const waitSec =
            waitMatch && waitMatch[1] ? parseInt(waitMatch[1], 10) : 0;
          const waitTime = waitSec > 0 ? waitSec * 1000 + 1000 : baseRetryDelay;

          console.log(
            `Profile rate limit, retrying in ${waitTime / 1000}s (${
              currentAttempt + 1
            }/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          currentAttempt++;
          continue;
        }

        // Rate limit değilse hatayı fırlat
        throw new Error(`GraphQL error: ${errorMessage}`);
      }

      // Başarılı yanıtı dön
      return response.data?.profile;
    } catch (error) {
      currentAttempt++;

      // Sadece 429 ve 500 hatalarında yeniden dene
      const is429 =
        error.status === 429 ||
        (error.message && error.message.toLowerCase().includes("rate limit"));

      const is500 =
        error.status === 500 ||
        (error.message && error.message.includes("500")) ||
        (error.message && error.message.includes("Internal Server Error"));

      if (is429 || is500) {
        // Bekleme süresini belirle
        const waitTime = is500 ? baseRetryDelay * 2 : baseRetryDelay;
        const errorType = is429 ? "Rate limit" : "Server error";

        console.warn(
          `Profile ${errorType} detected. Retrying in ${
            waitTime / 1000
          }s (${currentAttempt}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // Yeniden denenebilir hata değilse, hatayı fırlat
      console.error("Non-retryable profile fetch error:", error);
      throw error;
    }
  }

  // Maksimum deneme sayısına ulaştık
  throw new Error(
    `Failed to fetch profile after ${maxRetries} attempts. Try again later.`
  );
};

/**
 * Fetches profile balances with simple retry mechanism
 * @param {string} walletAddress - Wallet address
 * @param {number} count - Balances per page
 * @param {string} after - Cursor for pagination
 * @returns {Promise<object>} Profile balances
 */
export const getProfileBalance = async (
  walletAddress,
  count = 100,
  after = undefined
) => {
  const maxRetries = 20; // Increased max retries
  const baseRetryDelay = 3000;
  let currentAttempt = 0;

  while (currentAttempt < maxRetries) {
    try {
      console.log(`[getProfileBalance] Attempt ${currentAttempt + 1}/${maxRetries} for ${walletAddress}`);
      
      // Doğrudan API isteği yap, fazladan kontrol yok
      const response = await getProfileBalances(
        {
          identifier: walletAddress,
          count: count,
          after: after,
          chainId: 8453,
        },
        {
          headers: {
            "api-key": process.env.NEXT_PUBLIC_ZORA_API_KEY,
          },
        }
      );

      // Yanıtta GraphQL hataları varsa kontrol et
      if (
        response.errors &&
        Array.isArray(response.errors) &&
        response.errors.length > 0
      ) {
        const errorMessage = response.errors[0].message || "";
        console.log(`[getProfileBalance] GraphQL error detected: "${errorMessage}"`);

        // Handle specific "Rate limit exceeded for direct queries" error
        if (errorMessage.includes("Rate limit exceeded for direct queries")) {
          // Special handling for this exact error message
          const waitTime = 10000; // 10 seconds
          console.warn(
            `[getProfileBalance] Direct queries rate limit hit: "${errorMessage}". Waiting for ${waitTime/1000}s before retrying. (Attempt ${currentAttempt + 1}/${maxRetries})`
          );
          
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          currentAttempt++;
          continue;
        }

        // 429 Rate limit hatalarını incele - diğer olası rate limit mesajları
        if (
          errorMessage.toLowerCase().includes("rate limit") ||
          errorMessage.toLowerCase().includes("too many requests") ||
          errorMessage.toLowerCase().includes("try again") ||
          errorMessage.toLowerCase().includes("direct queries")
        ) {
          console.warn("[getProfileBalance] Rate limit error detected:", errorMessage);

          // Bekleme süresi varsa al, özellikle direct queries hatası için
          const waitMatch = errorMessage.match(/try again in (\d+) seconds/i);
          const waitSec =
            waitMatch && waitMatch[1] ? parseInt(waitMatch[1], 10) : 0;
          let waitTime;

          // "try again in 0 seconds" veya direct queries hatası için özel bekleme süresi
          if (
            waitSec === 0 ||
            errorMessage.toLowerCase().includes("direct queries")
          ) {
            waitTime = 10000; // 10 saniye
            console.log(
              "[getProfileBalance] Direct queries or try again in 0 seconds error, waiting for 10s"
            );
          } else {
            waitTime = waitSec > 0 ? waitSec * 1000 + 500 : baseRetryDelay;
          }

          console.log(
            `[getProfileBalance] Rate limit, retrying in ${waitTime / 1000}s (Attempt ${
              currentAttempt + 1
            }/${maxRetries})`
          );

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          currentAttempt++;
          continue;
        }

        // Any other GraphQL error - retry anyway
        console.warn(`[getProfileBalance] Other GraphQL error: ${errorMessage}, retrying anyway...`);
        const waitTime = baseRetryDelay;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        currentAttempt++;
        continue;
      }

      // Pagination bilgisinde tutarsızlığı düzelt (cursor varsa ama hasNextPage false ise)
      if (response.data?.profile?.coinBalances?.pageInfo) {
        const pageInfo = response.data.profile.coinBalances.pageInfo;
        if (pageInfo.hasNextPage === false && pageInfo.endCursor) {
          console.log(
            "[getProfileBalance] Fixing inconsistent pagination: setting hasNextPage to true since endCursor exists"
          );
          response.data.profile.coinBalances.pageInfo.hasNextPage = true;
        }
      }

      // Successful response
      console.log(`[getProfileBalance] Successfully retrieved profile balances for ${walletAddress}`);
      return response;
    } catch (error) {
      // Log detailed error information to help with debugging
      console.warn(`[getProfileBalance] Error (${currentAttempt+1}/${maxRetries}):`, {
        status: error.status,
        message: error.message,
        stack: error.stack?.substring(0, 200) // Only log first part of stack trace
      });
      
      currentAttempt++;

      // Check for the specific error message even if it comes with a 500 status
      if (error.message && error.message.includes("Rate limit exceeded for direct queries")) {
        const waitTime = 10000; // 10 seconds
        console.warn(
          `[getProfileBalance] Direct queries rate limit error caught with 500 status. Waiting for ${waitTime/1000}s before retrying.`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // Rate limit errors
      if (error.isRateLimit || error.status === 429 || 
          (error.message && error.message.toLowerCase().includes("rate limit"))) {
        console.warn("[getProfileBalance] Rate limit error detected");
        const waitTime = 8000;
        console.log(`[getProfileBalance] Waiting for ${waitTime/1000}s before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // Server errors (500)
      if (error.status === 500 || 
          (error.message && (error.message.includes("500") || 
                           error.message.includes("Internal Server Error")))) {
        console.warn("[getProfileBalance] Server error (500) detected");
        const waitTime = baseRetryDelay * 2;
        console.log(`[getProfileBalance] Waiting for ${waitTime/1000}s before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // For any other error, retry anyway with a delay
      console.warn("[getProfileBalance] Unexpected error, retrying anyway:");
      const waitTime = baseRetryDelay;
      console.log(`[getProfileBalance] Waiting for ${waitTime/1000}s before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }
  }

  // Maksimum deneme sayısına ulaştık
  throw new Error(
    `[getProfileBalance] Failed after ${maxRetries} retry attempts for ${walletAddress}. API may be experiencing issues.`
  );
};

/**
 * Verifies address type (profile or token)
 * @param {string} address - Ethereum address or profile handle
 * @returns {Promise<object>} Address type and related data
 */
export async function verifyAddressType(address) {
  const maxRetries = 3;
  let currentAttempt = 0;
  const baseRetryDelay = 3000;

  while (currentAttempt < maxRetries) {
    try {
      const isEthereumAddress =
        address && address.startsWith("0x") && address.length === 42;
      const isHandle = !isEthereumAddress;

      if (isEthereumAddress && !address.startsWith("0x")) {
        throw new Error("Valid Ethereum address required");
      }

      const result = {
        isProfile: false,
        isToken: false,
        data: null,
      };

      if (isEthereumAddress) {
        try {
          const tokenData = await getCoinDetails(address);

          if (tokenData && tokenData.address) {
            result.isToken = true;
            result.data = tokenData;
            return result;
          }
        } catch (tokenError) {
          console.log(
            "Token control failed, profile control will be performed:",
            tokenError.message
          );
        }
      }

      try {
        const profileData = await getZoraProfile(address, isHandle);

        if (profileData) {
          if (isEthereumAddress) {
            const isSelfReferencingToken =
              profileData.coinBalances?.edges?.length === 1 &&
              profileData.coinBalances.edges[0]?.node?.coin?.address?.toLowerCase() ===
                address.toLowerCase();

            if (isSelfReferencingToken) {
              const coinData = profileData.coinBalances.edges[0].node.coin;
              result.isToken = true;
              result.data = coinData;
            } else {
              result.isProfile = true;
              result.data = profileData;
            }
          } else {
            // When using a handle, it's definitively a profile
            result.isProfile = true;
            result.data = profileData;
          }
        }
      } catch (profileError) {
        console.log("Profile check error:", profileError.message);
        
        // Check if it's a rate limit (429) or server error (500)
        const is429 = 
          profileError.status === 429 ||
          (profileError.message && profileError.message.toLowerCase().includes("rate limit")) ||
          (profileError.message && profileError.message.toLowerCase().includes("too many requests")) ||
          (profileError.message && profileError.message.toLowerCase().includes("try again"));
          
        const is500 = 
          profileError.status === 500 ||
          (profileError.message && profileError.message.includes("500")) ||
          (profileError.message && profileError.message.includes("Internal Server Error"));
        
        if (is429 || is500) {
          currentAttempt++;
          const waitTime = is500 ? baseRetryDelay * 2 : baseRetryDelay;
          const errorType = is429 ? "Rate limit" : "Server error";
          
          console.warn(
            `Profile ${errorType} detected in verifyAddressType. Retrying in ${
              waitTime / 1000
            }s (${currentAttempt}/${maxRetries})`
          );
          
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue; // Try again
        }
      }

      if (!result.isProfile && !result.isToken) {
        console.log("Could not determine type for:", address);
      }

      return result;
    } catch (error) {
      // Check if it's a rate limit or server error
      const is429 = 
        error.status === 429 ||
        (error.message && error.message.toLowerCase().includes("rate limit")) ||
        (error.message && error.message.toLowerCase().includes("too many requests")) ||
        (error.message && error.message.toLowerCase().includes("try again"));
        
      const is500 = 
        error.status === 500 ||
        (error.message && error.message.includes("500")) ||
        (error.message && error.message.includes("Internal Server Error"));
      
      if (is429 || is500) {
        currentAttempt++;
        const waitTime = is500 ? baseRetryDelay * 2 : baseRetryDelay;
        const errorType = is429 ? "Rate limit" : "Server error";
        
        console.warn(
          `${errorType} detected in verifyAddressType. Retrying in ${
            waitTime / 1000
          }s (${currentAttempt}/${maxRetries})`
        );
        
        if (currentAttempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue; // Try again
        }
      }
      
      console.error("Type verification error:", error);
      throw error;
    }
  }

  throw new Error(
    `Failed to verify address type after ${maxRetries} attempts. Try again later.`
  );
}
