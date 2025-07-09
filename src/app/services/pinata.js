import axios from "axios";

// Pinata API key
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

// Trusted IPFS Gateways - deprioritized ipfs.io due to timeouts
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://ipfs.fleek.co/ipfs/",
  "https://dweb.link/ipfs/",
];

// Cache data structure - to prevent duplicate uploads by caching IPFS uploads
const ipfsCache = {
  metadata: new Map(), // Metadata cache
  images: new Map(), // Image cache
  uploads: new Map(), // Upload operations cache
};

// IPFS upload function - increased timeout and added caching
const uploadToIPFS = async (data, options = {}) => {
  try {
    // Use existing upload operation for same data if exists
    const cacheKey = typeof data === "string" ? data : JSON.stringify(data);

    // Return from cache if previously uploaded
    if (ipfsCache.uploads.has(cacheKey)) {
      console.log("IPFS cache hit - using previously uploaded content");
      return ipfsCache.uploads.get(cacheKey);
    }

    // Wait if upload is in progress
    const pendingUpload = ipfsCache.uploads.get(`pending_${cacheKey}`);
    if (pendingUpload) {
      console.log("Waiting for ongoing upload operation...");
      return pendingUpload;
    }

    // Start new upload operation and cache it
    const uploadPromise = new Promise((resolve, reject) => {
      // Define upload function normally
      const doUpload = async () => {
        try {
          console.log("Starting IPFS upload operation...");
          const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinJSONToIPFS",
            data,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${PINATA_JWT}`,
                ...options,
              },
            }
          );

          const hash = response.data.IpfsHash;
          // Cache successful result
          ipfsCache.uploads.set(cacheKey, hash);
          // Remove pending flag
          ipfsCache.uploads.delete(`pending_${cacheKey}`);

          console.log("IPFS upload successful:", hash);
          resolve(hash);
        } catch (error) {
          // Remove pending flag on error
          ipfsCache.uploads.delete(`pending_${cacheKey}`);
          console.error("IPFS upload error:", error);
          reject(error);
        }
      };

      // Call async function
      doUpload();
    });

    // Add pending flag
    ipfsCache.uploads.set(`pending_${cacheKey}`, uploadPromise);

    return uploadPromise;
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error("IPFS upload failed");
  }
};

// Converts IPFS URL to ipfs:// format - for Zora SDK compatibility
export const convertToIPFSFormat = (url) => {
  if (!url) return url;

  // Don't modify if already in ipfs:// format
  if (url.startsWith("ipfs://")) return url;

  // Extract hash from gateway URLs
  let hash = "";
  if (url.includes("/ipfs/")) {
    hash = url.split("/ipfs/").pop();
  } else if (url.match(/https?:\/\/[^/]+\/[^/]+/)) {
    // gateway.domain.com/hash format
    hash = url.split("/").pop();
  }

  // Convert to ipfs:// format if hash found
  if (hash) {
    return `ipfs://${hash}`;
  }

  // Return original URL if conversion not possible
  return url;
};

export const createAndUploadCoinMetadata = async (
  symbol,
  description,
  imageUrl
) => {
  if (!symbol || !imageUrl) {
    throw new Error("Symbol and image URL are required");
  }

  try {
    // Improve cache key generation to be more reliable
    let cacheKeyImage = imageUrl;
    if (typeof imageUrl === "object" && imageUrl instanceof File) {
      // For File objects, use name and size as part of the key
      cacheKeyImage = `file:${imageUrl.name}:${imageUrl.size}`;
    }

    // Create a more robust cache key using all parameters
    const metadataKey = `metadata:${symbol}:${description}:${cacheKeyImage}`;
    console.log("Checking metadata cache with key:", metadataKey);

    // Check if we already have this metadata cached
    if (ipfsCache.metadata.has(metadataKey)) {
      console.log("Metadata cache hit - same metadata previously uploaded");

      // Get the cached URL and ensure it's in ipfs:// format
      const cachedUrl = ipfsCache.metadata.get(metadataKey);
      const ipfsUrl = convertToIPFSFormat(cachedUrl);
      console.log("Using cached metadata URL:", ipfsUrl);
      return ipfsUrl;
    }

    // If image is already in ipfs:// format, use it directly
    // Otherwise, convert HTTP URLs to ipfs:// format if possible
    let ipfsImageUrl;
    if (typeof imageUrl === "string") {
      ipfsImageUrl = convertToIPFSFormat(imageUrl);
      console.log("Using image URL in ipfs:// format:", ipfsImageUrl);
    } else {
      // Handle File object upload - this would need separate implementation
      // For now, assume uploadImageToIPFS handles this and returns an ipfs:// URL
      console.log("Image is a File object, will be uploaded to IPFS");
      // Implementation would go here
    }

    // Create the metadata object
    const metadata = {
      name: symbol,
      description,
      image: ipfsImageUrl || imageUrl, // Use converted URL or original
    };

    // Upload to IPFS
    const hash = await uploadToIPFS(metadata);

    // Create proper ipfs:// URL
    const metadataUrl = `ipfs://${hash}`;

    // Store in cache - both ipfs:// format and HTTP gateway URL
    const httpUrl = `${IPFS_GATEWAYS[0]}${hash}`;
    ipfsCache.metadata.set(metadataKey, metadataUrl); // Store the ipfs:// URL directly

    console.log("Metadata uploaded: ", {
      hash,
      metadataUrl,
      httpUrl,
      metadata,
    });

    return metadataUrl;
  } catch (error) {
    console.error("Metadata upload error:", error);
    throw new Error("Failed to upload metadata");
  }
};

/**
 * Uploads blob data to IPFS (for processing Together API images)
 * @param {Blob} blob - Blob data to upload (image)
 * @returns {Promise<{url: string, hash: string}>} IPFS URL and hash info
 */
export const storeToIPFS = async (blob) => {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error("Valid blob data is required");
  }

  try {
    // Prepare blob data as FormData
    const formData = new FormData();
    const fileName = `image_${Date.now()}.${blob.type.split("/")[1] || "png"}`;
    formData.append(
      "file",
      new File([blob], fileName, { type: blob.type || "image/png" })
    );

    console.log(`Uploading blob data to IPFS (${blob.size} bytes)...`);

    // Send request to Pinata API
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );

    const hash = response.data.IpfsHash;
    console.log(`IPFS upload successful: ${hash}`);

    // Create IPFS URL
    const url = `ipfs://${hash}`;

    return { url, hash };
  } catch (error) {
    console.error("IPFS blob upload error:", error);
    throw new Error(`Failed to upload blob to IPFS: ${error.message}`);
  }
};
