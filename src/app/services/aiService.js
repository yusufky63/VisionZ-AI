import { processTtlgenHerImage } from './imageUtils';

const MAX_RETRIES = 3;

const API_ENDPOINTS = {
  TOGETHER_TEXT: "https://api.together.xyz/v1/completions",
  TOGETHER_IMAGE: "https://api.together.xyz/v1/images/generations",
  STABILITY_AI: "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
  REPLICATE: "https://api.replicate.com/v1/predictions",
};

const MODELS = {
  TEXT: {
    PRIMARY: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    FALLBACK: "meta-llama/Llama-3.1-8B-Instruct-Turbo-Free",
    ANALYSIS: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
    ],
  },
  IMAGE: {
    TOGETHER: "black-forest-labs/FLUX.1-schnell-Free",
    REPLICATE: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  },
};

// Different coin categories and their characteristics
const COIN_CATEGORIES = [
  {
    name: "DeFi (Decentralized Finance)", 
    features: "Decentralized lending, liquidity pools, yield farming, staking, tokenized assets",
    themes: "Finance, economics, banking, investment",
  },
  {
    name: "GameFi (Gaming)",
    features: "Play-to-earn, NFT game assets, character progression, virtual economy, tournaments",
    themes: "Gaming, entertainment, competition, rewards",
  },
  {
    name: "SocialFi (Social Media)",
    features: "Content rewards, social interactions, community management, influencer economy",
    themes: "Social media, communication, community, engagement",
  },
  {
    name: "GreenTech (Environmental)",
    features: "Carbon credits, sustainable projects, environmental protection incentives, renewable energy",
    themes: "Environment, sustainability, green energy, nature",
  },
  {
    name: "AI & ML (Artificial Intelligence)",
    features: "AI model tokenization, data marketplace, machine learning incentives, autonomous systems",
    themes: "Artificial intelligence, technology, innovation, automation",
  },
  {
    name: "NFT & Digital Art",
    features: "Art tokenization, artist royalties, collection management, digital galleries",
    themes: "Art, creativity, collection, culture",
  },
  {
    name: "Metaverse & VR",
    features: "Virtual real estate, digital assets, avatar customization, virtual events",
    themes: "Virtual reality, digital world, interaction, experience",
  },
  {
    name: "IoT (Internet of Things)",
    features: "Device networks, sensor data, smart contracts, automation systems",
    themes: "Connectivity, automation, smart devices, data",
  },
  {
    name: "Privacy & Security",
    features: "Private transactions, data encryption, secure communication, identity verification",
    themes: "Privacy, security, protection, encryption",
  },
  {
    name: "DAO & Governance",
    features: "Community management, voting systems, protocol governance, incentive mechanisms",
    themes: "Governance, democracy, decision-making, community",
  },
];

/**
 * Select the best category based on user description
 * @param {string} userDescription - The user's token description
 * @returns {object} The best matching category from COIN_CATEGORIES
 */
const selectBestCategory = (userDescription) => {
  if (!userDescription || typeof userDescription !== 'string') {
    // Return a default category if no description provided
    return COIN_CATEGORIES[0]; // DeFi as default
  }

  const description = userDescription.toLowerCase();
  
  // Define keyword mappings for each category
  const categoryKeywords = {
    "DeFi (Decentralized Finance)": [
      "defi", "finance", "financial", "lending", "borrowing", "yield", "liquidity", "pool", 
      "staking", "farming", "investment", "trading", "exchange", "swap", "dex", "banking",
      "loan", "credit", "interest", "dividend", "profit", "funding", "capital"
    ],
    "GameFi (Gaming)": [
      "game", "gaming", "play", "player", "nft", "character", "avatar", "tournament", 
      "competition", "reward", "earn", "achievement", "level", "progression", "virtual",
      "entertainment", "fun", "play-to-earn", "p2e", "gaming economy"
    ],
    "SocialFi (Social Media)": [
      "social", "community", "content", "creator", "influencer", "follower", "engagement",
      "interaction", "communication", "share", "post", "like", "comment", "media",
      "network", "platform", "user", "audience", "viral"
    ],
    "GreenTech (Environmental)": [
      "green", "environment", "environmental", "eco", "carbon", "climate", "sustainability",
      "sustainable", "renewable", "energy", "solar", "wind", "clean", "nature", "earth",
      "pollution", "emission", "forest", "farming", "agriculture", "organic"
    ],
    "AI & ML (Artificial Intelligence)": [
      "ai", "artificial intelligence", "machine learning", "ml", "neural", "algorithm",
      "data", "automation", "smart", "intelligent", "prediction", "analysis", "model",
      "technology", "innovation", "robot", "autonomous"
    ],
    "NFT & Digital Art": [
      "nft", "art", "artist", "digital", "creative", "design", "artwork", "collection",
      "gallery", "culture", "aesthetic", "visual", "image", "picture", "drawing",
      "painting", "sculpture", "collectible", "rare", "unique"
    ],
    "Metaverse & VR": [
      "metaverse", "virtual reality", "vr", "ar", "augmented reality", "virtual", "digital world",
      "immersive", "3d", "avatar", "virtual space", "virtual event", "virtual real estate",
      "digital experience", "simulation"
    ],
    "IoT (Internet of Things)": [
      "iot", "internet of things", "device", "sensor", "smart device", "connectivity",
      "network", "automation", "smart home", "smart city", "monitoring", "tracking",
      "data collection", "smart contract", "connected"
    ],
    "Privacy & Security": [
      "privacy", "private", "security", "secure", "encryption", "protect", "protection",
      "anonymous", "identity", "verification", "safety", "confidential", "secret",
      "authentication", "authorization", "cybersecurity"
    ],
    "DAO & Governance": [
      "dao", "governance", "voting", "vote", "decision", "community", "democracy",
      "protocol", "management", "organization", "decentralized", "consensus",
      "proposal", "ballot", "election", "council"
    ]
  };

  // Calculate score for each category
  let bestCategory = COIN_CATEGORIES[0];
  let bestScore = 0;

  COIN_CATEGORIES.forEach(category => {
    const keywords = categoryKeywords[category.name] || [];
    let score = 0;

    // Check for keyword matches
    keywords.forEach(keyword => {
      if (description.includes(keyword)) {
        score += keyword.length > 5 ? 2 : 1; // Give higher weight to longer, more specific keywords
      }
    });

    // Also check in themes and features
    const themeWords = category.themes.toLowerCase().split(/[,\s]+/);
    const featureWords = category.features.toLowerCase().split(/[,\s]+/);
    
    [...themeWords, ...featureWords].forEach(word => {
      if (word.length > 3 && description.includes(word)) {
        score += 0.5;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  });

  return bestCategory;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get API key from environment variables
 */
const getApiKey = () => {
  const apiKey = process.env.NEXT_PUBLIC_TOGETHER_API_KEY;
  if (!apiKey) {
    console.error("Together API key is missing from environment variables");
    throw new Error(
      "API key is required. Please set NEXT_PUBLIC_TOGETHER_API_KEY in your environment variables."
    );
  }
  return apiKey;
};

/**
 * Clean text to avoid NSFW detection
 */
const sanitizeText = (text) => {
  if (!text) return "";
  return text.replace(/beauty|sexy|hot|attractive|babe|gorgeous/gi, "lovely");
};

/**
 * Wait utility
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =============================================================================
// IMAGE GENERATION PROVIDERS
// =============================================================================

/**
 * Stability AI Image Generation
 */
const generateImageWithStabilityAI = async (name, symbol, description, categoryContext) => {
  const STABILITY_API_KEY = process.env.NEXT_PUBLIC_STABILITY_API_KEY;
  if (!STABILITY_API_KEY) {
    throw new Error("Stability AI API key not configured");
  }

  const safeName = sanitizeText(name);
  const safeDescription = sanitizeText(description);
  const category = categoryContext ? categoryContext.name : "token";
  
  // Create style prompt based on category context (same as Together.ai)
  const stylePrompt = categoryContext ? 
    `Style inspiration from ${categoryContext.themes}. Features focusing on ${categoryContext.features}.` : 
    "Style: Contemporary digital art, abstract, creative, high-end crypto aesthetic.";
  
  const prompt = `Create a unique and artistic NFT-style digital artwork for ${safeName} (${symbol}). Category: ${category}. ${
    safeDescription ? `Theme: ${safeDescription}. ` : ""
  }${stylePrompt}

The artwork should be:
- Professional and visually striking
- Simple yet memorable with distinctive elements
- Suitable as a token logo that works at different sizes
- Rich with vibrant colors for both light and dark backgrounds
- Reflecting the token's purpose and core features

Features: Rich textures, dynamic compositions, ethereal elements, innovative artistic expression.
Include: Generative art elements, abstract patterns, digital manipulation effects.
Colors: Vibrant and harmonious color palette with deep contrasts.

NO TEXT in the image.`;

  const requestBody = {
    text_prompts: [
      { text: prompt, weight: 1 },
      {
        text: "logo, corporate design, text, letters, numbers, watermark, signature, blurry, low quality, oversaturated colors, basic shapes, simplistic designs",
        weight: -0.9,
      },
    ],
    cfg_scale: 15,
    height: 1024,
    width: 1024,
    samples: 1,
    steps: 40,
    sampler: "K_EULER",
  };

  const response = await fetch(API_ENDPOINTS.STABILITY_AI, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Stability AI error: ${error.message || response.status}`);
  }

  const data = await response.json();
  const base64Image = data.artifacts[0].base64;
  const imageBlob = await fetch(`data:image/png;base64,${base64Image}`).then(
    (r) => r.blob()
  );
  return URL.createObjectURL(imageBlob);
};

/**
 * Replicate Image Generation
 */
const generateImageWithReplicate = async (name, symbol, description, categoryContext) => {
  const REPLICATE_API_KEY = process.env.NEXT_PUBLIC_REPLICATE_API_KEY;
  if (!REPLICATE_API_KEY) {
    throw new Error("Replicate API key not configured");
  }

  const safeName = sanitizeText(name);
  const safeDescription = sanitizeText(description);
  const category = categoryContext ? categoryContext.name : "token";
  
  // Create style prompt based on category context (same as Together.ai)
  const stylePrompt = categoryContext ? 
    `Style inspiration from ${categoryContext.themes}. Features focusing on ${categoryContext.features}.` : 
    "Style: Contemporary digital art, abstract, creative, high-end crypto aesthetic.";
  
  const prompt = `Create a unique and artistic NFT-style digital artwork for ${safeName} (${symbol}). Category: ${category}. ${
    safeDescription ? `Theme: ${safeDescription}. ` : ""
  }${stylePrompt}

The artwork should be:
- Professional and visually striking
- Simple yet memorable with distinctive elements
- Suitable as a token logo that works at different sizes
- Rich with vibrant colors for both light and dark backgrounds
- Reflecting the token's purpose and core features

Features: Rich textures, dynamic compositions, ethereal elements, innovative artistic expression.
Include: Generative art elements, abstract patterns, digital manipulation effects.
Colors: Vibrant and harmonious color palette with deep contrasts.

NO TEXT in the image.`;
  
  const negative_prompt = "logo, corporate design, text, letters, numbers, watermark, signature, blurry, low quality, oversaturated colors, basic shapes, simplistic designs, nsfw, adult content, inappropriate, suggestive, sexy, erotic, nudity, revealing, provocative, seductive, typography, noise, artifacts, distorted, ugly, deformed, extra elements, backgrounds, people, faces, bodies, human figures";

  const response = await fetch(API_ENDPOINTS.REPLICATE, {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: MODELS.IMAGE.REPLICATE,
      input: {
        prompt,
        negative_prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 50,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        apply_watermark: false,
        high_noise_fraction: 0.8,
        refiner: "expert_ensemble_refiner",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Replicate API error: ${error.detail || response.status}`);
  }

  const prediction = await response.json();
  
  // Poll for completion
  let result = prediction;
  while (result.status === "starting" || result.status === "processing") {
    await wait(1000);
    
    const pollResponse = await fetch(
      `${API_ENDPOINTS.REPLICATE}/${result.id}`,
      {
        headers: { Authorization: `Token ${REPLICATE_API_KEY}` },
      }
    );
    
    result = await pollResponse.json();
  }

  if (result.status === "failed") {
    throw new Error(`Replicate generation failed: ${result.error}`);
  }

  return result.output[0];
};

/**
 * Together.ai Image Generation
 */
const generateImageWithTogetherAI = async (name, symbol, description, categoryContext) => {
  const TOGETHER_API_KEY = getApiKey();
  const category = categoryContext ? categoryContext.name : "token";
  
  // Create style prompt based on category context
  const stylePrompt = categoryContext ? 
    `Style inspiration from ${categoryContext.themes}. Features focusing on ${categoryContext.features}.` : 
    "Style: Contemporary digital art, abstract, creative, high-end crypto aesthetic.";
  
  const prompt = `Create a unique and artistic NFT-style digital artwork for ${name} (${symbol}). Category: ${category}. ${
    description ? `Theme: ${description}. ` : ""
  }${stylePrompt}

The artwork should be:
- Professional and visually striking
- Simple yet memorable with distinctive elements
- Suitable as a token logo that works at different sizes
- Rich with vibrant colors for both light and dark backgrounds
- Reflecting the token's purpose and core features

Features: Rich textures, dynamic compositions, ethereal elements, innovative artistic expression.
Include: Generative art elements, abstract patterns, digital manipulation effects.
Colors: Vibrant and harmonious color palette with deep contrasts.

NO TEXT in the image.`;

  const response = await fetch(API_ENDPOINTS.TOGETHER_IMAGE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELS.IMAGE.TOGETHER,
      prompt,
      width: 768,
      height: 768,
      n: 1,
      response_format: "url",
      negative_prompt: "logo, corporate design, text, letters, numbers, watermark, signature, blurry, low quality, oversaturated colors, basic shapes, simplistic designs",
      output_format: "png",
    }),
  });

  if (!response.ok) {
    const statusCode = response.status;
    let errorText = "";
    
    try {
      const errorJson = await response.json();
      errorText = JSON.stringify(errorJson);
      console.error(`Together.ai API Error (${statusCode}):`, errorJson);
    } catch (e) {
      errorText = await response.text();
      console.error(`Together.ai API Error (${statusCode}):`, errorText);
    }
    
    if (statusCode === 401 || statusCode === 403) {
      throw new Error("API key is invalid or expired. Please check your API key.");
    } else if (statusCode === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else if (statusCode >= 500) {
      throw new Error("Together API server error. Please try again later.");
    }
    
    throw new Error(errorText || `HTTP Error: ${statusCode}`);
  }
  
  const data = await response.json();
  if (!data.data || !data.data[0] || !data.data[0].url) {
    throw new Error("Invalid API response format");
  }
  
  return data.data[0].url;
};

// Export categories for external use
export const getCoinCategories = () => COIN_CATEGORIES;

/**
 * Auto-select the best category based on user description
 */
export const generateTextWithAI = async (selectedCategory = null, userDescription = "") => {
  console.log("Starting text generation with inputs:", {
    selectedCategory,
    userDescription,
  });
  
  if (generateTextWithAI.isRunning) {
    console.warn("Text generation is already running - preventing recursive call");
    throw new Error("Text generation service is busy. Please try again later.");
  }
  
  generateTextWithAI.isRunning = true;
  
  try {
    let retries = 0;
    const maxRetries = 3;
    let lastError = null;
    const models = [MODELS.TEXT.PRIMARY, MODELS.TEXT.FALLBACK];
    const TOGETHER_API_KEY = getApiKey();

    while (retries < maxRetries) {
      try {
        const category = selectedCategory
          ? COIN_CATEGORIES.find((cat) => cat.name === selectedCategory)
          : selectBestCategory(userDescription);

        if (!category) {
          throw new Error("Category not found");
        }

        const modelIndex = Math.min(retries, models.length - 1);
        const model = models[modelIndex];
        console.log(`AI Text Generation - Attempt ${retries + 1}/${maxRetries}, Model: ${model}`);

        const prompt = `You are an experienced cryptocurrency and blockchain technology designer. I want you to design a new and innovative cryptocurrency based on the following user description:

User's Token Idea: "${userDescription}"

Category: "${category.name}"
Features: ${category.features}
Themes: ${category.themes}

Design Criteria:
1. Name:
- Suitable for user's description and category
- Unique and memorable
- Different from existing coins
- Reflects project vision

2. Symbol:
- 3-4 letters length
- Capital letters only
- Memorable and easy to pronounce
- Consistent with name

3. Description:
- 50-100 words
- Incorporate and enhance the user's idea
- Clear value proposition
- Use cases
- Innovative features
- Real-world applications
- Target audience and impact

Important: Provide your response ONLY in the following JSON format, with no additional text, markdown, or code blocks:

{
  "name": "coin name",
  "symbol": "SYMBOL",
  "description": "description",
  "category": "${category.name}",
  "features": "${category.features}",
  "themes": "${category.themes}"
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        try {
          const response = await fetch(API_ENDPOINTS.TOGETHER_TEXT, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${TOGETHER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              prompt,
              max_tokens: 300,
              temperature: 0.7,
              top_p: 0.9,
              frequency_penalty: 0.0,
              presence_penalty: 0.0,
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const statusCode = response.status;
            
            console.error(`API Error (${statusCode}):`, errorData);
            
            if (statusCode === 401 || statusCode === 403) {
              throw new Error("API key is invalid or expired. Please check your API key.");
            } else if (statusCode === 429) {
              throw new Error("Rate limit exceeded. Please try again later.");
            } else if (statusCode >= 500) {
              throw new Error("Together API server error. Please try again later.");
            }
            
            throw new Error(errorData.error?.message || `API Error: ${response.status} - ${response.statusText}`);
          }

          const data = await response.json();
          console.log("API Response received");

          if (!data.choices || !data.choices.length || !data.choices[0].text || data.choices[0].text.trim() === "") {
            console.warn("Empty API response, retrying...");
            retries++;
            await wait(2000);
            continue;
          }

          let generatedText = data.choices[0].text.trim();
          console.log("Generated text length:", generatedText.length);

          try {
            const jsonMatch = generatedText.match(/\{.*\}/s);
            if (jsonMatch) {
              generatedText = jsonMatch[0];
            }
            
            // Clean JSON format
            generatedText = generatedText
              .replace(/```json\n/g, "") // Remove JSON block start
              .replace(/```/g, "") // Remove remaining backticks
              .replace(/^\s*{\s*/, "{") // Remove leading whitespace
              .replace(/\s*}\s*$/, "}") // Remove trailing whitespace
              .trim();

            // Protected JSON parse - will try manual parsing if error
            let result;
            try {
              result = JSON.parse(generatedText);
            } catch (jsonError) {
              // JSON parse error - try to extract fields manually
              console.warn("JSON parse error, attempting manual parsing...", jsonError);
              
              // Extract fields with regex
              const nameMatch = generatedText.match(/"name"\s*:\s*"([^"]+)"/);
              const symbolMatch = generatedText.match(/"symbol"\s*:\s*"([^"]+)"/);
              const descMatch = generatedText.match(/"description"\s*:\s*"([^"]+)"/);
              
              if (nameMatch && symbolMatch && descMatch) {
                result = {
                  name: nameMatch[1],
                  symbol: symbolMatch[1],
                  description: descMatch[1],
                  category: category.name,
                  features: category.features,
                  themes: category.themes
                };
              } else {
                throw new Error("Manual parsing failed");
              }
            }

            // Validate results
            if (!result.name || !result.symbol || !result.description) {
              // Fill missing fields with defaults
              if (!result.name) result.name = "CryptoCoin";
              if (!result.symbol) result.symbol = "COIN";
              if (!result.description) result.description = `A revolutionary cryptocurrency for the ${category.name} space.`;
            }

            // Check symbol format
            if (!/^[A-Z]{3,4}$/.test(result.symbol)) {
              result.symbol = result.symbol
                .toUpperCase()
                .replace(/[^A-Z]/g, "")
                .slice(0, 4);
              if (result.symbol.length < 3) {
                // If shorter than 3 chars, derive from coin name
                const nameInitials = result.name
                  .split(' ')
                  .map(word => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 4);
                
                result.symbol = nameInitials.length >= 3 ? nameInitials : "COIN";
              }
            }
            
            return {
              name: result.name,
              symbol: result.symbol.toUpperCase(),
              description: result.description,
              category: category.name,
              features: category.features,
              themes: category.themes
            };
          } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            retries++;
            
            if (retries >= maxRetries) {
              // If last attempt fails, return default values
              console.log("All attempts failed. Generating manual coin information.");
              
              // Create result with default values
              return {
                name: "CryptoVerse",
                symbol: "CVT",
                description: `A revolutionary cryptocurrency for the ${category.name} ecosystem. Offering innovative solutions with secure and scalable infrastructure.`,
                category: category.name,
                features: category.features,
                themes: category.themes
              };
            }
            
            await wait(2000 * retries);
            continue;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === "AbortError") {
            console.error("Request timed out");
            throw new Error("API request timed out after 20 seconds");
          }
          
          throw fetchError;
        }
      } catch (error) {
        console.error("AI text generation error:", error);
        lastError = error;
        retries++;
        await wait(2000);
      }
    }

    console.error("All AI text generation attempts failed:", lastError);
    throw new Error(`Text generation failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
  } finally {
    generateTextWithAI.isRunning = false;
  }
};

/**
 * Enhanced AI image generation with multiple fallback APIs
 */
export const generateImageWithAI = async (name, symbol, description, categoryContext = null) => {
  console.log("Starting AI image generation...");
  console.log("Inputs:", { name, symbol, description });
  
  const apiProviders = [
    {
      name: "Together.ai",
      generator: () => generateImageWithTogetherAI(name, symbol, description, categoryContext),
    },
    {
      name: "Stability AI",
      generator: () => generateImageWithStabilityAI(name, symbol, description, categoryContext),
    },
  
    {
      name: "Replicate",
      generator: () => generateImageWithReplicate(name, symbol, description, categoryContext),
    },
  ];

  let lastError = null;
  
  for (const provider of apiProviders) {
    try {
      console.log(`Attempting image generation with ${provider.name}...`);
      const imageUrl = await provider.generator();
      
      if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("blob:"))) {
        console.log(`✅ Image generated successfully with ${provider.name}`);
        
        // Process image and upload to IPFS using imported function
        try {
          const processedUrl = await processTtlgenHerImage(imageUrl);
          console.log("Processed image URL:", processedUrl);
          return processedUrl;
        } catch (processError) {
          console.warn("Image processing failed, returning original URL:", processError);
          return imageUrl;
        }
      } else {
        throw new Error("Generated URL is invalid");
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ ${provider.name} failed:`, error.message);
      
      if (error.message.includes("not configured")) {
        console.log(`⏭️ Skipping ${provider.name} - API key not configured`);
        continue;
      }
      
      if (provider.name === "Together.ai" && error.message.includes("Rate limit")) {
        console.log(`⏭️ Together.ai rate limited, trying next provider...`);
        continue;
      }
      
      await wait(1000);
    }
  }
  
  throw new Error(`Failed to generate image with all providers. Last error: ${lastError?.message || "Unknown error"}`);
};

/**
 * Generic retry mechanism
 */
export const retryOperation = async (operation, context, handleError, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`${context} attempt ${i + 1}/${retries} failed:`, error);

      if (i === retries - 1) {
        handleError(error, context);
        throw error;
      }

      if (error.message?.includes("user rejected")) {
        handleError(error, context);
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

/**
 * Calculate comprehensive token score based on multiple metrics
 * @param {Object} tokenData - Token data from the API
 * @param {Object} onchainData - Onchain data (optional)
 * @param {number} commentsCount - Number of comments
 * @returns {Object} Scores object with overall and individual metric scores
 */
export const calculateTokenScore = (tokenData, onchainData, commentsCount) => {
  // 1. LİKİDİTE SKORU (0-100) - %25 ağırlık
  const marketCapNum = parseFloat(tokenData.marketCap || "0");
  const liquidityScore = Math.min(100, Math.max(0, 
    marketCapNum > 100000 ? 90 : 
    marketCapNum > 50000 ? 80 :
    marketCapNum > 10000 ? 60 :
    marketCapNum > 1000 ? 40 : 20
  ));

  // 2. HACİM SKORU (0-100) - %20 ağırlık
  const volume24h = parseFloat(tokenData.volume24h || "0");
  const volumeScore = Math.min(100, Math.max(0,
    volume24h > 10000 ? 95 :
    volume24h > 1000 ? 80 :
    volume24h > 100 ? 60 :
    volume24h > 10 ? 40 : 10
  ));

  // 3. TOPLULUK SKORU (0-100) - %20 ağırlık
  const holders = tokenData.uniqueHolders || 0;
  const transfers = tokenData.transfers?.count || 0;
  const communityScore = Math.min(100, Math.max(0,
    (holders > 1000 ? 40 : holders > 500 ? 30 : holders > 100 ? 20 : holders > 10 ? 10 : 5) +
    (commentsCount > 50 ? 25 : commentsCount > 20 ? 20 : commentsCount > 5 ? 15 : commentsCount > 0 ? 10 : 0) +
    (transfers > 10000 ? 35 : transfers > 1000 ? 25 : transfers > 100 ? 15 : transfers > 10 ? 10 : 5)
  ));

  // 4. RİSK SKORU (0-100, ters çevrilmiş) - %20 ağırlık
  const age = tokenData.createdAt ? (Date.now() - new Date(tokenData.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
  const riskFactors = [
    age < 1 ? 30 : age < 7 ? 20 : age < 30 ? 10 : 0,        // Yaş riski
    holders < 10 ? 25 : holders < 50 ? 15 : holders < 100 ? 10 : 0,  // Holder konsantrasyon riski
    marketCapNum < 1000 ? 20 : marketCapNum < 10000 ? 10 : 0,        // Market cap riski
    volume24h < 1 ? 25 : volume24h < 10 ? 15 : 0                     // Likidite riski
  ];
  const totalRisk = riskFactors.reduce((sum, risk) => sum + risk, 0);
  const riskScore = Math.max(0, 100 - totalRisk);

  // 5. BÜYÜME SKORU (0-100) - %15 ağırlık
  const marketCapDelta = parseFloat(tokenData.marketCapDelta24h || "0");
  const growthScore = Math.min(100, Math.max(0,
    marketCapDelta > 50 ? 95 :
    marketCapDelta > 20 ? 80 :
    marketCapDelta > 10 ? 70 :
    marketCapDelta > 0 ? 60 :
    marketCapDelta > -10 ? 40 :
    marketCapDelta > -20 ? 25 : 10
  ));

  // GENEL SKOR (ağırlıklı ortalama)
  const overallScore = Math.round(
    (liquidityScore * 0.25) +
    (volumeScore * 0.2) +
    (communityScore * 0.2) +
    (riskScore * 0.2) +
    (growthScore * 0.15)
  );

  return {
    overall: overallScore,
    liquidity: Math.round(liquidityScore),
    volume: Math.round(volumeScore),
    community: Math.round(communityScore),
    risk: Math.round(riskScore),
    growth: Math.round(growthScore)
  };
};

/**
 * Get human-readable label for score
 * @param {number} score - Score from 0-100
 * @returns {string} Label describing the score
 */
export const getScoreLabel = (score) => {
  if (score >= 90) return "EXCELLENT";
  if (score >= 80) return "VERY GOOD";
  if (score >= 70) return "GOOD";
  if (score >= 60) return "FAIR";
  if (score >= 40) return "POOR";
  return "VERY POOR";
};

/**
 * Get CSS color class for score
 * @param {number} score - Score from 0-100
 * @returns {string} Tailwind CSS color class
 */
export const getScoreColor = (score) => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
};

/**
 * AI token analysis function
 */
export const analyzeTokenWithAI = async (tokenData, userQuestion, onchainData = null) => {
  let retries = 0;
  const maxRetries = 3;
  let lastError = null;
  const models = MODELS.TEXT.ANALYSIS;

  while (retries < maxRetries) {
    try {
      const modelIndex = Math.min(retries, models.length - 1);
      const model = models[modelIndex];
      console.log(`AI Token Analysis - Attempt ${retries + 1}/${maxRetries}, Model: ${model}`);

      // Helper functions for data formatting
      const formatDate = (dateString) => {
        if (!dateString) return "Unknown";
        try {
          return new Date(dateString).toLocaleDateString();
        } catch (e) {
          return dateString;
        }
      };
      
      const formatNumber = (num) => {
        if (num === undefined || num === null) return "Unknown";
        if (typeof num === "string") num = parseFloat(num);
        return num.toLocaleString();
      };
      
      const calculatePrice = () => {
        if (tokenData.marketCap && tokenData.totalSupply) {
          try {
            const price = parseFloat(tokenData.marketCap) / parseFloat(tokenData.totalSupply);
            return price.toFixed(8);
          } catch (e) {
            return "Unknown";
          }
        }
        return "Unknown";
      };
      
      const calculateEngagement = () => {
        if (tokenData.transfers?.count && tokenData.uniqueHolders) {
          try {
            const txPerHolder = parseFloat(tokenData.transfers.count) / parseFloat(tokenData.uniqueHolders);
            return txPerHolder.toFixed(2);
          } catch (e) {
            return "Unknown";
          }
        }
        return "Unknown";
      };
      
      const calculate24hChange = () => {
        if (tokenData.marketCapDelta24h && tokenData.marketCap) {
          try {
            const currentMC = parseFloat(tokenData.marketCap);
            const delta = parseFloat(tokenData.marketCapDelta24h);
            const previousMC = currentMC - delta;
            if (previousMC <= 0) return "0%";
            const changePercent = (delta / previousMC) * 100;
            return changePercent.toFixed(2) + "%";
          } catch (e) {
            return "Unknown";
          }
        }
        return "Unknown";
      };

      // Prepare token summary
      const tokenSummary = {
        name: tokenData.name || "Unknown",
        symbol: tokenData.symbol || "???",
        description: tokenData.description
          ? tokenData.description.length > 200
            ? tokenData.description.substring(0, 200) + "..."
            : tokenData.description
          : "No description",
        price: calculatePrice(),
        marketCap: formatNumber(tokenData.marketCap) || "Unknown",
        marketCap24hChange: calculate24hChange(),
        holders: formatNumber(tokenData.uniqueHolders) || "Unknown",
        totalSupply: formatNumber(tokenData.totalSupply) || "Unknown",
        volume24h: formatNumber(tokenData.volume24h) || "Unknown",
        totalVolume: formatNumber(tokenData.totalVolume) || "Unknown",
        transfers: formatNumber(tokenData.transfers?.count) || "Unknown",
        txPerHolder: calculateEngagement(),
        comments: formatNumber(tokenData.zoraComments?.count) || "Unknown",
        created: formatDate(tokenData.createdAt),
        age: tokenData.createdAt
          ? Math.floor((new Date() - new Date(tokenData.createdAt)) / (1000 * 60 * 60 * 24)) + " days"
          : "Unknown",
      };

      // Onchain data formatting
      let onchainSummary = "";
      if (onchainData && Object.keys(onchainData).length > 0) {
        const formatValue = (value) => {
          if (!value) return "Unknown";
          if (value.formatted) return value.formatted;
          if (typeof value === "bigint") return value.toString();
          return String(value);
        };
        
        onchainSummary = `
Onchain Data:
- Liquidity: ${formatValue(onchainData.liquidity)} (USD: ${formatValue(
          onchainData.liquidity?.usdcDecimal || onchainData.liquidityUSD || 0
        )})
- Total Supply: ${formatValue(onchainData.totalSupply)}
- Unique Holders: ${onchainData.owners?.length || 0}
- Pool Address: ${onchainData.pool || "Unknown"}
`;
      }

      // Check if investment question
      const isInvestmentQuestion =
        userQuestion.toLowerCase().includes("invest") ||
        userQuestion.toLowerCase().includes("good investment") ||
        userQuestion.toLowerCase().includes("worth") ||
        userQuestion.toLowerCase().includes("potential") ||
        userQuestion.toLowerCase().includes("buy");
      
      // Create analysis prompt
      let prompt = `Analyze this cryptocurrency token based on these metrics: 
Token: ${tokenSummary.name} (${tokenSummary.symbol})
Description: ${tokenData.description || "No description"}
Price: $${tokenSummary.price}
Market Cap: $${tokenSummary.marketCap}
24h Change: ${tokenSummary.marketCap24hChange}
Holders: ${tokenSummary.holders}
Total Supply: ${tokenSummary.totalSupply}
Volume 24h: $${tokenSummary.volume24h}
Total Volume: $${tokenSummary.totalVolume}
Creation Date: ${tokenSummary.created} (${tokenSummary.age} old)
Total Transfers: ${tokenSummary.transfers}
TX Per Holder: ${tokenSummary.txPerHolder}
Comments Count: ${tokenSummary.comments}
${onchainSummary}

User question: "${userQuestion || "What is this token about?"}"

Your response MUST be structured in exactly this format:

OVERVIEW: In 2-3 sentences, provide key facts about what this token is and its purpose.

METRICS ANALYSIS: 
- Analyze the token's market cap, volume trends, and holder activity
- Comment on market interest based on transfers and comments
- Identify any red flags or positive indicators from the metrics

STRENGTHS AND WEAKNESSES:
- List the main strengths of this token (2-3 points)
- List the main weaknesses or risks (2-3 points)`;

      if (isInvestmentQuestion) {
        prompt += `\n\nINVESTMENT ANSWER: Start with ONE of these exact options: "Yes", "No", "Maybe", "It depends", "Unlikely", or "Insufficient data". Then provide 2-3 sentences explaining your evaluation based on the metrics above.

IMPORTANT: Your analysis should focus on the token's fundamental metrics, holder activity, community engagement, and price action. Avoid speculation about future price movements, but evaluate the current state of the token based on available data only.`;
      } else {
        prompt += `\n\nANSWER: Provide a direct and detailed answer to the user's specific question, referencing the relevant metrics above.

IMPORTANT: Your entire response must be under 250 words. Focus on the data while being educational and informative. Only use the data that is provided - do not make up or assume data that isn't present.`;
      }

      console.log("Sending prompt with length:", prompt.length);

      const response = await fetch("/api/together", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          max_tokens: 400,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (!data.choices || !data.choices.length || !data.choices[0].text || data.choices[0].text.trim() === "") {
        console.warn("Empty API response, retrying...");
        retries++;
        await wait(2000);
        continue;
      }

      const generatedText = data.choices[0].text.trim();
      console.log("Generated Analysis:", generatedText);

      return {
        analysis: generatedText,
        model: data.model,
        usage: data.usage,
        created: data.created,
        id: data.id,
      };
    } catch (error) {
      console.error(`Token analysis error (attempt ${retries + 1}/${maxRetries}):`, error);
      lastError = error;
      retries++;
      
      if (retries < maxRetries) {
        await wait(2000 * retries);
        continue;
      }
      
      throw new Error(`AI token analysis error: ${error.message}`);
    }
  }
  
  throw lastError || new Error("Unknown error in AI token analysis");
};
