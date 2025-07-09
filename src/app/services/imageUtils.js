/**
 * Helper functions for downloading images from Together API and uploading to IPFS
 */

import { storeToIPFS } from "./pinata";

/**
 * Downloads image from Together API and uploads to IPFS
 * @param {string} originalUrl Original image URL from Together API
 * @returns {Promise<string>} IPFS URI (ipfs://...)
 */
export async function downloadImageAndUploadToIPFS(originalUrl) {
  try {
    console.log("Downloading image:", originalUrl);

    // 1. Redirect Together API URL through our API endpoint
    const proxyUrl = `/api/together?url=${encodeURIComponent(originalUrl)}`;

    // 2. Download image through proxy (avoiding CORS issues)
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Image download error:", errorData);
      throw new Error(`Image download error: ${response.status}`);
    }

    // 3. Get as blob
    const imageBlob = await response.blob();
    console.log("Image downloaded, size:", imageBlob.size);

    if (imageBlob.size === 0) {
      throw new Error("Downloaded image data is empty");
    }

    // 4. Upload to IPFS
    const ipfsResult = await storeToIPFS(imageBlob);
    console.log("IPFS upload successful:", ipfsResult);

    // 5. Check and return IPFS URI
    if (!ipfsResult || !ipfsResult.url) {
      throw new Error("Invalid IPFS upload result: URL not found");
    }

    // Check ipfs:// format
    const ipfsUri = ipfsResult.url;
    if (!ipfsUri.startsWith("ipfs://")) {
      console.warn("IPFS URI doesn't start with ipfs://, fixing:", ipfsUri);
      const hash = ipfsResult.hash || ipfsUri.split("/").pop();
      return `ipfs://${hash}`;
    }

    return ipfsUri; // ipfs://...
  } catch (error) {
    console.error("Image download and IPFS upload error:", error);

    // On error, try to return original URL in IPFS format
    if (originalUrl) {
      // If URL contains IPFS hash, use that
      if (originalUrl.includes("/ipfs/")) {
        const hash = originalUrl.split("/ipfs/").pop();
        console.log("Extracted IPFS hash from error case:", hash);
        return `ipfs://${hash}`;
      }

      // Return direct image URL as fallback
      console.log("Using original URL in error case");
      return originalUrl;
    }

    throw error;
  }
}

/**
 * Download images from Together API and upload to IPFS
 * @param {string} originalUrl Original image URL from Together API
 * @returns {Promise<string>} IPFS URI (ipfs://...)
 */
export async function processTtlgenHerImage(originalUrl) {
  try {
    // 1. Image URL validation
    if (!originalUrl || typeof originalUrl !== "string") {
      throw new Error("Invalid image URL");
    }

    // 2. Handle blob URLs directly (client-side only)
    if (originalUrl.startsWith("blob:")) {
      try {
        console.log("Blob URL detected, processing directly:", originalUrl);

        // Fetch blob data directly
        const response = await fetch(originalUrl);
        if (!response.ok) {
          throw new Error(`Blob fetch failed: ${response.status}`);
        }

        const imageBlob = await response.blob();
        console.log("Blob data retrieved, size:", imageBlob.size);

        if (imageBlob.size === 0) {
          throw new Error("Blob data is empty");
        }

        // Upload directly to IPFS
        const ipfsResult = await storeToIPFS(imageBlob);
        console.log("Blob IPFS upload successful:", ipfsResult);

        if (!ipfsResult || !ipfsResult.url) {
          throw new Error("IPFS upload failed: no URL returned");
        }

        // Ensure proper ipfs:// format
        const ipfsUri = ipfsResult.url;
        if (!ipfsUri.startsWith("ipfs://")) {
          const hash = ipfsResult.hash || ipfsUri.split("/").pop();
          return `ipfs://${hash}`;
        }

        return ipfsUri;
      } catch (blobError) {
        console.error("Blob processing error:", blobError);
        throw new Error(`Blob processing failed: ${blobError.message}`);
      }
    }

    // 3. Detect Together API, Amazon S3 or similar temporary URLs
    if (originalUrl.includes("together.xyz")) {
      try {
        // Download image through proxy and upload to IPFS
        const ipfsResult = await downloadImageAndUploadToIPFS(originalUrl);

        if (ipfsResult && ipfsResult.startsWith("ipfs://")) {
          console.log("Image successfully uploaded to IPFS:", ipfsResult);
          return ipfsResult;
        } else {
          console.error("IPFS conversion failed, result:", ipfsResult);
          throw new Error("IPFS conversion returned invalid URI");
        }
      } catch (downloadError) {
        console.error("Image download or IPFS upload error:", downloadError);
        throw downloadError;
      }
    }

    // 4. For other image types use existing process (don't change if already ipfs://)
    if (originalUrl.startsWith("ipfs://")) {
      return originalUrl;
    }

    // 5. Upload standard URLs to IPFS as well
    console.log(
      "Standard image URL detected, will upload to IPFS:",
      originalUrl
    );
    return await downloadImageAndUploadToIPFS(originalUrl);
  } catch (error) {
    console.error("Together image processing error:", error);
    throw error; // Propagate error up
  }
}
