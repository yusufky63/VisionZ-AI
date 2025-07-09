/**
 * @fileoverview Social Media Parser Service
 * @module services/socialMediaParser
 */

/**
 * Social media platformlarını tespit et
 * @param {string} url - URL
 * @returns {string} Platform ismi
 */
export function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  } else if (urlLower.includes('reddit.com')) {
    return 'reddit';
  } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  } else if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  } else if (urlLower.includes('instagram.com')) {
    return 'instagram';
  } else if (urlLower.includes('farcaster.xyz') || urlLower.includes('warpcast.com')) {
    return 'farcaster';
  }
  
  return null;
}

/**
 * URL'den post ID'si çıkar
 * @param {string} url - URL
 * @param {string} platform - Platform
 * @returns {string} Post ID
 */
export function extractPostId(url, platform) {
  try {
    switch (platform) {
      case 'youtube':
        // YouTube video ID extraction
        const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        return youtubeMatch ? youtubeMatch[1] : null;
        
      case 'reddit':
        // Reddit post ID from URL
        const redditMatch = url.match(/\/comments\/([a-zA-Z0-9]+)/);
        return redditMatch ? redditMatch[1] : null;
        
      case 'twitter':
        // Twitter status ID
        const twitterMatch = url.match(/status\/(\d+)/);
        return twitterMatch ? twitterMatch[1] : null;
        
      case 'tiktok':
        // TikTok video ID from URL
        const tiktokMatch = url.match(/video\/(\d+)/);
        return tiktokMatch ? tiktokMatch[1] : null;

      case 'instagram':
        // Instagram post ID from URL
        const instagramMatch = url.match(/\/p\/([a-zA-Z0-9_-]+)|\/reel\/([a-zA-Z0-9_-]+)/);
        return instagramMatch ? (instagramMatch[1] || instagramMatch[2]) : null;

      case 'farcaster':
        // Farcaster cast ID from URL
        const farcasterMatch = url.match(/\/([a-zA-Z0-9_-]+)$/);
        return farcasterMatch ? farcasterMatch[1] : null;
        
      default:
        return null;
    }
  } catch (error) {
    console.error('Error extracting post ID:', error);
    return null;
  }
}

/**
 * Social media post verilerini çek
 * @param {string} url - Social media URL
 * @returns {Promise<Object>} Post verileri
 */
export async function fetchSocialMediaData(url, platformOverride = null) {
  if (!url) {
    throw new Error('URL is required');
  }

  const platform = platformOverride || detectPlatform(url);
  
  if (!platform) {
    throw new Error('Unsupported platform. Currently supported: YouTube, Reddit, Twitter/X, TikTok, Instagram, Farcaster');
  }

  const platformConfig = SUPPORTED_PLATFORMS.find(p => p.value === platform);
  if (!platformConfig?.working) {
    throw new Error(`${platformConfig?.name || platform} integration is currently unavailable. ${platformConfig?.note || ''}`);
  }

  console.log(`🔍 Fetching data from ${platform}:`, url);

  try {
    const response = await fetch('/api/social-parser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, platform })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch ${platform} data (${response.status})`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched social media data:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching social media data:', error);
    throw error;
  }
}

// Helper function to decode HTML entities (enhanced version)
function decodeHtmlEntities(text) {
  if (!text) return text;
  
  console.log('🔍 Decoding entities in:', text);
  
  // First handle numeric hex entities (&#x308; style)
  text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    const code = parseInt(hex, 16);
    const char = String.fromCharCode(code);
    console.log(`🔍 Converted ${match} to ${char}`);
    return char;
  });
  
  // Handle numeric decimal entities (&#8230; style)
  text = text.replace(/&#(\d+);/g, (match, dec) => {
    const code = parseInt(dec, 10);
    const char = String.fromCharCode(code);
    console.log(`🔍 Converted ${match} to ${char}`);
    return char;
  });
  
  // Common entity mappings
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x5C;': '\\',
    '&#96;': '`',
    '&hellip;': '...',  // named ellipsis entity
    '&nbsp;': ' '       // non-breaking space
  };
  
  // Then handle named entities
  text = text.replace(/&[#\w]+;/g, (entity) => {
    if (entities[entity]) {
      console.log(`🔍 Converted ${entity} to ${entities[entity]}`);
      return entities[entity];
    }
    console.log(`🔍 Unknown entity: ${entity}`);
    return entity;
  });
  
  console.log('🔍 Final decoded text:', text);
  return text;
}

// Generate token data from social media content
export async function generateTokenFromSocialData(socialData) {
  if (!socialData) {
    throw new Error('Social media data is required');
  }

  console.log('🎯 Generating token data from social media content:', socialData);

  try {
    // Extract meaningful content for token generation
    let title = socialData.text || socialData.title || 'Social Media Token';
    const platform = socialData.platform || 'social';
    
    // Decode HTML entities first
    title = decodeHtmlEntities(title);
    
    // Generate token name (clean and concise)
    const cleanTitle = title
      .replace(/[^\w\sğüşöçıİĞÜŞÖÇ-]/g, '') // Include Turkish characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .slice(0, 50); // Limit length
    
    const tokenName = cleanTitle || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Token`;
    
    // Generate symbol from title or platform (include Turkish chars)
    const symbolBase = (cleanTitle || platform)
      .replace(/[ğğ]/gi, 'G')
      .replace(/[üü]/gi, 'U')
      .replace(/[şş]/gi, 'S')
      .replace(/[öö]/gi, 'O')
      .replace(/[çç]/gi, 'C')
      .replace(/[ıı]/gi, 'I')
      .replace(/[İi]/gi, 'I')
      .replace(/\s+/g, '')
      .toUpperCase()
      .slice(0, 6);
    
    const tokenSymbol = symbolBase || 'SMT';
    
    // Generate clean description - just the content
    let description = '';
    
    // Clean and decode the text content for description
    if (socialData.text && socialData.text.length > 10) {
      console.log('🔍 Original text:', socialData.text);
      let cleanText = decodeHtmlEntities(socialData.text);
      console.log('🔍 After first decode:', cleanText);
      
      // Remove platform-specific prefixes but preserve main content
      if (platform === 'instagram') {
        cleanText = cleanText
          .replace(/^[^:]*on Instagram:\s*"/i, '"')
          .replace(/^["']/, '') // Remove leading quotes
          .replace(/["']$/, '') // Remove trailing quotes
          .trim();
      } else if (platform === 'twitter') {
        // For Twitter, keep the full tweet content
        cleanText = cleanText
          .replace(/\s*on Twitter.*?$/, '') // Remove "on Twitter" suffix
          .replace(/&mdash;.*$/, '') // Remove mdash and author suffix
          .trim();
      } else {
        // For other platforms, clean general patterns
        cleanText = cleanText
          .replace(/^[^:]*:\s*/, '')
          .replace(/^["']/, '')
          .replace(/["']$/, '')
          .trim();
      }
      
      console.log('🔍 After cleanup:', cleanText);
      
      // Use the clean content as description
      description = cleanText.slice(0, 200); // Allow longer descriptions
      if (cleanText.length > 200) {
        description += '...';
      }
    }
    
    // If no content, use a simple fallback
    if (!description) {
      description = `${platform.charAt(0).toUpperCase() + platform.slice(1)} content`;
    }
    
    // Final decode of the entire description to catch any remaining entities
    description = decodeHtmlEntities(description);
    console.log('🔍 Final description:', description);

    // Determine the best image source (prioritize thumbnail over regular images)
    let tokenImage = null;
    let previewImage = null;
    let images = socialData.images ? [...socialData.images] : [];

    // ✨ NEW: Extract images from pic.twitter.com links in text for Twitter
    if (platform === 'twitter' && socialData.text) {
      const picTwitterMatches = socialData.text.match(/pic\.twitter\.com\/[a-zA-Z0-9]+/g);
      if (picTwitterMatches) {
        console.log('🐦 Found pic.twitter.com links in text:', picTwitterMatches);
        picTwitterMatches.forEach(picLink => {
          const mediaId = picLink.replace('pic.twitter.com/', '');
          
          // Multiple Twitter image extraction methods
          const imageUrls = [
            // Method 1: Twitter nitter proxy
            `https://nitter.net/pic/media%2F${mediaId}`,
            
            // Method 2: Twitter syndication
            `https://syndication.twitter.com/i/oembed?url=https://twitter.com/anyuser/status/123456789&media=${mediaId}`,
            
            // Method 3: Twimg variations
            `https://pbs.twimg.com/media/${mediaId}?format=jpg`,
            `https://pbs.twimg.com/media/${mediaId}?format=png`,
            `https://pbs.twimg.com/media/${mediaId}.jpg`,
            `https://pbs.twimg.com/media/${mediaId}.png`,
            
            // Method 4: Twitter external link
            `https://t.co/${mediaId}`,
            
            // Method 5: Generic placeholder
            generateTwitterPlaceholder(mediaId)
          ];
          
          // Add all variations to try
          imageUrls.forEach((url, index) => {
            if (!images.includes(url)) {
              images.push(url);
              console.log(`🐦 Added Twitter image method ${index + 1}:`, url);
            }
          });
        });
      }
    }

    if (socialData.thumbnail) {
      // Use thumbnail (from video platforms like YouTube, TikTok)
      tokenImage = processImageUrl(socialData.thumbnail, platform);
      previewImage = processImageUrl(socialData.thumbnail, platform);
      console.log('🖼️ Using thumbnail as token image:', tokenImage);
    } else if (images && images.length > 0) {
      // Use first available image (including converted Twitter images)
      tokenImage = processImageUrl(images[0], platform);
      previewImage = processImageUrl(images[0], platform);
      console.log('🖼️ Using first image as token image:', tokenImage);
    } else if (platform === 'twitter') {
      // Twitter fallback: use an enhanced Twitter-themed placeholder
      const twitterPlaceholder = generateTwitterPlaceholder('default');
      tokenImage = twitterPlaceholder;
      previewImage = twitterPlaceholder;
      console.log('🖼️ Using enhanced Twitter placeholder image');
    }

    const tokenData = {
      name: tokenName,
      symbol: tokenSymbol,
      description: description,
      image: tokenImage, // For file upload (can be URL or File)
      previewImage: previewImage, // For UI preview (URL only)
      socialMediaData: {
        ...socialData,
        images: images // Update with converted images
      },
      originalUrl: socialData.url
    };

    console.log('✅ Generated token data:', tokenData);
    return tokenData;
    
  } catch (error) {
    console.error('❌ Error generating token data:', error);
    throw new Error('Failed to generate token data from social media content');
  }
}

// Helper function to process image URLs based on platform
function processImageUrl(imageUrl, platform) {
  if (!imageUrl) return null;
  
  // Instagram images often have CORS issues, so we'll use a proxy or alternative approach
  if (platform === 'instagram' && imageUrl.includes('cdninstagram.com')) {
    // For Instagram, we'll decode any HTML entities in the URL
    return imageUrl
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }
  
  // Twitter images have CORS issues, use proxy for most cases
  if (platform === 'twitter' && 
      (imageUrl.includes('pbs.twimg.com') || 
       imageUrl.includes('cards.twitter.com') || 
       imageUrl.includes('nitter.net') ||
       imageUrl.includes('syndication.twitter.com') ||
       imageUrl.includes('t.co'))) {
    // Use our proxy service to bypass CORS (except for data URLs)
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // For data URLs (like our SVG placeholder), return as-is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  return imageUrl;
}

// Helper function to generate Twitter-themed placeholder
function generateTwitterPlaceholder(mediaId) {
  // Create a data URL with Twitter branding
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <defs>
        <linearGradient id="twitterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1DA1F2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0d8bd9;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#twitterGrad)"/>
      <circle cx="100" cy="100" r="30" fill="white" opacity="0.9"/>
      <path d="M85 95 Q100 85 115 95 Q110 105 100 105 Q90 105 85 95" fill="#1DA1F2"/>
      <text x="200" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">Twitter Image</text>
      <text x="200" y="110" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" opacity="0.8">${mediaId}</text>
      <text x="200" y="140" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" opacity="0.6">Media not available</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Working Social Media Platform Configurations (Tested and Verified)
export const SUPPORTED_PLATFORMS = [
  {
    name: 'YouTube',
    value: 'youtube',
    placeholder: 'https://youtube.com/watch?v=... or https://youtu.be/...',
    working: true
  },
  {
    name: 'Reddit',
    value: 'reddit',
    placeholder: 'https://reddit.com/r/subreddit/comments/...',
    working: true
  },
  {
    name: 'Twitter',
    value: 'twitter', 
    placeholder: 'https://twitter.com/username/status/... or https://x.com/...',
    working: true
  },
  {
    name: 'TikTok',
    value: 'tiktok',
    placeholder: 'https://tiktok.com/@username/video/...',
    working: true
  },
  {
    name: 'Instagram',
    value: 'instagram',
    placeholder: 'https://instagram.com/p/... or https://instagram.com/reel/...',
    working: true
  },
  {
    name: 'Farcaster',
    value: 'farcaster',
    placeholder: 'https://farcaster.xyz/username/cast or https://warpcast.com/...',
    working: true
  }
]; 