/**
 * @fileoverview Social Media Parser API Route
 * @description Sosyal medya URL'lerini parse eder ve post verilerini döndürür
 */

import { NextResponse } from 'next/server';

/**
 * @fileoverview Social Media Parser API Endpoint
 */

// Working oEmbed endpoints (verified and tested)
const WORKING_OEMBED_ENDPOINTS = {
  twitter: 'https://publish.twitter.com/oembed',
  youtube: 'https://www.youtube.com/oembed',
  tiktok: 'https://www.tiktok.com/oembed',
  instagram: 'https://api.instagram.com/oembed/',
  // reddit uses JSON API, not oEmbed
  // farcaster uses custom API
};

// Enhanced headers for better scraping (using your working headers)
const SCRAPING_HEADERS = {
  'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
};

/**
 * Social media URL'lerinden veri çekmek için mock implementation
 * Gerçek uygulamada Twitter API, Facebook Graph API vs. kullanılır
 */
export async function POST(request) {
  try {
    const { url, platform } = await request.json();
    
    console.log('🔍 Enhanced parsing social media URL:', { url, platform });
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format'
      }, { status: 400 });
    }
    
    const detectedPlatform = platform || detectPlatform(url);
    
    if (!detectedPlatform) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported platform. Currently supported: YouTube, Reddit, Twitter/X, TikTok, Instagram, Farcaster'
      }, { status: 400 });
    }

    // Check if platform is currently working
    if (!isPlatformWorking(detectedPlatform)) {
      return NextResponse.json({
        success: false,
        error: getPlatformMessage(detectedPlatform)
      }, { status: 503 });
    }
    
    console.log(`🔍 Processing ${detectedPlatform} URL:`, url);
    
    let socialData;
    
    // Use appropriate data fetching method
    switch (detectedPlatform) {
      case 'youtube':
        socialData = await fetchYouTubeData(url);
        break;
      case 'reddit':
        socialData = await fetchRedditData(url);
        break;
      case 'twitter':
        socialData = await fetchTwitterData(url);
        break;
      case 'tiktok':
        socialData = await fetchTikTokData(url);
        break;
      case 'instagram':
        socialData = await fetchInstagramData(url);
        break;
      case 'farcaster':
        socialData = await fetchFarcasterData(url);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: `${detectedPlatform} integration is currently unavailable`
        }, { status: 503 });
    }
    
    console.log('✅ Successfully parsed social media data');
    
    return NextResponse.json({
      success: true,
      ...socialData
    });
    
  } catch (error) {
    console.error('❌ Social parser error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to parse social media URL',
      details: 'Some social media sites use bot protection or require authentication.',
      suggestion: 'Try YouTube, Reddit, Twitter/X, TikTok, Instagram, or Farcaster links for best results.'
    }, { status: 500 });
  }
}

function detectPlatform(url) {
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

function isPlatformWorking(platform) {
  const workingPlatforms = ['youtube', 'reddit', 'twitter', 'tiktok', 'instagram', 'farcaster'];
  return workingPlatforms.includes(platform);
}

function getPlatformMessage(platform) {
  const messages = {
    facebook: 'Facebook requires App authentication. Integration temporarily unavailable.'
  };
  
  return messages[platform] || `${platform} integration is currently unavailable.`;
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text) {
  if (!text) return text;
  
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x5C;': '\\',
    '&#96;': '`',
    '&#x308;': 'ğ',
    '&#x15f;': 'ş',
    '&#x11f;': 'ğ',
    '&#x131;': 'ı',
    '&#xE7;': 'ç',
    '&#xFC;': 'ü',
    '&#xF6;': 'ö',
    '&#x2026;': '...',  // horizontal ellipsis
    '&#8230;': '...',   // another ellipsis format
    '&hellip;': '...',  // named ellipsis entity
    '&#x130;': 'İ',     // Turkish capital I with dot
    '&#x11E;': 'Ğ',     // Turkish capital G with breve
    '&#x15E;': 'Ş',     // Turkish capital S with cedilla
    '&#xDC;': 'Ü',      // Turkish capital U with diaeresis
    '&#xD6;': 'Ö',      // Turkish capital O with diaeresis
    '&#xC7;': 'Ç'       // Turkish capital C with cedilla
  };
  
  // First handle numeric entities
  text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    const code = parseInt(hex, 16);
    return String.fromCharCode(code);
  });
  
  text = text.replace(/&#(\d+);/g, (match, dec) => {
    const code = parseInt(dec, 10);
    return String.fromCharCode(code);
  });
  
  // Then handle named entities
  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

async function fetchInstagramData(url) {
  try {
    console.log('📷 Fetching Instagram data via scraping (oEmbed often fails)...');
    
    // Go directly to scraping since oEmbed is unreliable for Instagram
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log('Instagram response status:', response.status);
    
    // Extract meta tags with better regex
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) ||
                      html.match(/<title>([^<]*)<\/title>/);
    
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
    
    // Better author extraction from URL and content
    let author = 'Instagram User';
    let username = 'unknown';
    
    // Extract username from URL first
    const urlAuthorMatch = url.match(/instagram\.com\/([^\/\?]+)/);
    if (urlAuthorMatch && urlAuthorMatch[1] !== 'p' && urlAuthorMatch[1] !== 'reel') {
      author = urlAuthorMatch[1];
      username = urlAuthorMatch[1];
    } else {
      // If URL doesn't have username, try to extract from title
      const title = titleMatch?.[1] || '';
      const titleAuthorMatch = title.match(/^([^:•@]+)(?:\s*[:•@])/);
      if (titleAuthorMatch) {
        author = titleAuthorMatch[1].trim();
        username = author.toLowerCase().replace(/\s+/g, '');
      }
    }

    // Process and clean the text content
    let cleanText = '';
    if (titleMatch?.[1]) {
      cleanText = titleMatch[1];
    } else if (descMatch?.[1]) {
      cleanText = descMatch[1];
    }
    
    // Decode HTML entities thoroughly
    cleanText = decodeHtmlEntities(cleanText);
    
    // Clean up Instagram-specific text patterns
    cleanText = cleanText
      .replace(/\s*on Instagram:?\s*/i, ' on Instagram: ')
      .replace(/\s*•\s*Instagram\s*/i, '')
      .trim();

    // Get clean image URL (decode entities)
    let cleanImageUrl = null;
    if (imageMatch?.[1]) {
      cleanImageUrl = decodeHtmlEntities(imageMatch[1]);
    }

    console.log('✅ Instagram scraping success');
    console.log('🔍 Extracted data:', {
      author,
      username,
      cleanText: cleanText.slice(0, 100),
      hasImage: !!cleanImageUrl
    });

    return {
      platform: 'instagram',
      text: cleanText || 'Instagram Post',
      author: {
        name: author,
        username: username,
        url: `https://instagram.com/${username}`
      },
      url: url,
      images: cleanImageUrl ? [cleanImageUrl] : [],
      thumbnail: cleanImageUrl,
      created_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Instagram fetch error:', error);
    throw new Error('Failed to fetch Instagram data: ' + error.message);
  }
}

async function fetchFarcasterData(url) {
  try {
    console.log('🟣 Fetching Farcaster data...');
    
    // Convert warpcast URLs to farcaster.xyz if needed
    let farcasterUrl = url;
    if (url.includes('warpcast.com')) {
      farcasterUrl = url.replace('warpcast.com', 'farcaster.xyz');
    }
    
    // Try direct scraping first (Farcaster is more open)
    const response = await fetch(farcasterUrl, {
      headers: {
        ...SCRAPING_HEADERS,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log('Farcaster response status:', response.status);
    
    // Extract Farcaster-specific meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) ||
                      html.match(/<meta name="title" content="([^"]*)"/) ||
                      html.match(/<title>([^<]*)<\/title>/);
    
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/) ||
                     html.match(/<meta name="description" content="([^"]*)"/);
    
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/) ||
                      html.match(/<meta name="image" content="([^"]*)"/);
    
    // Extract author info from URL path
    const authorMatch = url.match(/farcaster\.xyz\/([^\/]+)/) ||
                       url.match(/warpcast\.com\/([^\/]+)/);
    
    const author = authorMatch?.[1] || 'Farcaster User';
    const title = titleMatch?.[1] || 'Farcaster Cast';
    const description = descMatch?.[1] || '';

    // Clean and simplify content
    const cleanTitle = title.replace(/^Farcaster\s*-?\s*/, '').trim();
    const cleanDescription = description.replace(/Farcaster is.*?$/, '').trim();

    console.log('✅ Farcaster scraping success');

    return {
      platform: 'farcaster',
      text: cleanTitle + (cleanDescription && cleanDescription !== cleanTitle ? '\n\n' + cleanDescription : ''),
      author: {
        name: author,
        username: author,
        url: `https://farcaster.xyz/${author}`
      },
      url: farcasterUrl,
      images: imageMatch?.[1] ? [imageMatch[1]] : [],
      created_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Farcaster fetch error:', error);
    throw new Error('Failed to fetch Farcaster data: ' + error.message);
  }
}

async function fetchTikTokData(url) {
  try {
    console.log('🎵 Fetching TikTok data via oEmbed first...');
    
    // First try oEmbed
    try {
      const oembedUrl = `${WORKING_OEMBED_ENDPOINTS.tiktok}?url=${encodeURIComponent(url)}&format=json`;
      
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'LinkPreviewBot/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ TikTok oEmbed success:', data);

        return {
          platform: 'tiktok',
          text: data.title || 'TikTok Video',
          author: {
            name: data.author_name || 'TikTok Creator',
            username: data.author_name || 'unknown',
            url: data.author_url || url
          },
          url: url,
          images: data.thumbnail_url ? [data.thumbnail_url] : [],
          // Only include thumbnail info, not full video object
          thumbnail: data.thumbnail_url,
          created_at: new Date().toISOString()
        };
      }
    } catch (oembedError) {
      console.log('TikTok oEmbed failed, trying scraping:', oembedError.message);
    }
    
    // Fallback to scraping with your working headers
    console.log('🎵 Trying TikTok scraping fallback...');
    
    const response = await fetch(url, {
      headers: SCRAPING_HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log('TikTok response status:', response.status);
    
    // Extract meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) ||
                      html.match(/<title>([^<]*)<\/title>/);
    
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
    
    // Extract author from URL or title
    const authorMatch = url.match(/@([^\/]+)/) || titleMatch?.[1]?.match(/@(\w+)/);
    const author = authorMatch?.[1] || 'TikTok Creator';

    console.log('✅ TikTok scraping success');

    return {
      platform: 'tiktok',
      text: titleMatch?.[1] || 'TikTok Video',
      author: {
        name: author,
        username: author,
        url: `https://tiktok.com/@${author}`
      },
      url: url,
      images: imageMatch?.[1] ? [imageMatch[1]] : [],
      // Only thumbnail, no video object
      thumbnail: imageMatch?.[1],
      created_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('TikTok fetch error:', error);
    throw new Error('Failed to fetch TikTok data: ' + error.message);
  }
}

async function fetchTwitterData(url) {
  try {
    console.log('🐦 Fetching Twitter data via oEmbed first...');
    
    // First try oEmbed (your working approach)
    try {
      const oembedUrl = `${WORKING_OEMBED_ENDPOINTS.twitter}?url=${encodeURIComponent(url)}&format=json`;
      
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'LinkPreviewBot/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Twitter oEmbed success:', data);

        // Extract actual tweet content from HTML
        let tweetText = data.title || 'Twitter Post';
        let images = [];
        
        console.log('🐦 Twitter oEmbed data:', {
          title: data.title,
          author_name: data.author_name,
          thumbnail_url: data.thumbnail_url,
          html: data.html?.slice(0, 200) + '...'
        });
        
        if (data.html) {
          // Extract full blockquote content (contains the tweet text)
          const blockquoteMatch = data.html.match(/<blockquote[^>]*>(.*?)<\/blockquote>/s);
          if (blockquoteMatch && blockquoteMatch[1]) {
            // Extract just the text part, before any links
            const textPart = blockquoteMatch[1];
            // Get text from the first paragraph or direct text
            const textMatch = textPart.match(/<p[^>]*>(.*?)<\/p>/s) || 
                            textPart.match(/^([^<]*)/);
            
            if (textMatch && textMatch[1]) {
              tweetText = textMatch[1]
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&mdash;.*$/, '') // Remove "— Twitter User" suffix
                .trim();
            }
          }
          
          // Try to extract from data-text or other attributes
          if (!tweetText || tweetText === data.title) {
            const dataTextMatch = data.html.match(/data-text="([^"]+)"/);
            if (dataTextMatch) {
              tweetText = dataTextMatch[1];
            }
          }
          
          // Extract images from HTML - look for img tags
          const imgMatches = data.html.match(/<img[^>]+src="([^"]+)"/g);
          if (imgMatches) {
            images = imgMatches.map(match => {
              const srcMatch = match.match(/src="([^"]+)"/);
              return srcMatch ? srcMatch[1] : null;
            }).filter(Boolean);
          }
        }

        // Also check thumbnail_url
        if (data.thumbnail_url && !images.includes(data.thumbnail_url)) {
          images.push(data.thumbnail_url);
        }
        
        console.log('🐦 Extracted text:', tweetText);
        console.log('🐦 Extracted images:', images);

        return {
          platform: 'twitter',
          text: tweetText,
          author: {
            name: data.author_name || 'Twitter User',
            username: data.author_name || 'unknown',
            url: data.author_url || url
          },
          url: url,
          images: images,
          thumbnail: images[0] || null,
          created_at: new Date().toISOString()
        };
      }
    } catch (oembedError) {
      console.log('Twitter oEmbed failed, trying scraping:', oembedError.message);
    }
    
    // Fallback to scraping with your working headers
    console.log('🐦 Trying Twitter scraping fallback...');
    
    const response = await fetch(url, {
      headers: SCRAPING_HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log('Twitter response status:', response.status);
    console.log('🐦 Twitter HTML length:', html.length);
    console.log('🐦 Twitter HTML sample:', html.slice(0, 500));
    
    // Extract content more carefully
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) ||
                      html.match(/<meta name="twitter:title" content="([^"]*)"/) ||
                      html.match(/<title>([^<]*)<\/title>/);
    
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/) ||
                     html.match(/<meta name="twitter:description" content="([^"]*)"/) ||
                     html.match(/<meta name="description" content="([^"]*)"/);
    
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/) ||
                      html.match(/<meta name="twitter:image" content="([^"]*)"/);
    
    // Extract multiple images with more aggressive approach
    let images = [];
    
    // Method 1: Twitter card images (numbered)
    const twitterImageMatches = html.match(/<meta name="twitter:image\d*" content="([^"]*)"/g);
    if (twitterImageMatches) {
      const twitterImages = twitterImageMatches.map(match => {
        const urlMatch = match.match(/content="([^"]*)"/);
        return urlMatch ? urlMatch[1] : null;
      }).filter(Boolean);
      images.push(...twitterImages);
    }
    
    // Method 2: OG image
    if (imageMatch?.[1] && !images.includes(imageMatch[1])) {
      images.push(imageMatch[1]);
    }
    
    // Method 3: Look for pic.twitter.com in content and try to extract actual image URLs
    const picTwitterMatches = html.match(/pic\.twitter\.com\/[a-zA-Z0-9]+/g);
    if (picTwitterMatches) {
      console.log('🐦 Found pic.twitter.com links:', picTwitterMatches);
      
      // Try to convert pic.twitter.com links to pbs.twimg.com format
      picTwitterMatches.forEach(picLink => {
        const tweetId = picLink.replace('pic.twitter.com/', '');
        // Common Twitter image URL patterns
        const possibleImageUrls = [
          `https://pbs.twimg.com/media/${tweetId}?format=jpg&name=large`,
          `https://pbs.twimg.com/media/${tweetId}?format=png&name=large`,
          `https://pbs.twimg.com/media/${tweetId}.jpg`,
          `https://pbs.twimg.com/media/${tweetId}.png`
        ];
        
        possibleImageUrls.forEach(url => {
          if (!images.includes(url)) {
            images.push(url);
          }
        });
      });
      
      // Try to find corresponding full image URLs in meta tags or JSON-LD
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          console.log('🐦 Found JSON-LD data:', jsonData);
          if (jsonData.image) {
            const imageUrl = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
            if (imageUrl && !images.includes(imageUrl)) {
              images.push(imageUrl);
            }
          }
        } catch (e) {
          console.log('🐦 Failed to parse JSON-LD:', e.message);
        }
      }
    }
    
    // Method 4: Look for any image URLs in meta description or other places
    const pbs_twimg_regex = /https:\/\/pbs\.twimg\.com\/[^\s"'<>]+/g;
    const pbsMatches = html.match(pbs_twimg_regex);
    if (pbsMatches) {
      pbsMatches.forEach(url => {
        if (!images.includes(url)) {
          images.push(url);
        }
      });
    }
    
    console.log('🐦 All extracted images:', images);
    
    const authorMatch = html.match(/<meta name="twitter:creator" content="([^"]*)"/);

    // Clean the content
    let cleanText = '';
    if (descMatch?.[1] && descMatch[1] !== titleMatch?.[1]) {
      cleanText = descMatch[1];
    } else if (titleMatch?.[1]) {
      cleanText = titleMatch[1];
    }
    
    // Remove "on Twitter" or similar suffixes
    cleanText = cleanText.replace(/\s*on Twitter.*?$/, '').trim();
    
    const author = authorMatch?.[1]?.replace('@', '') || 'Twitter User';

    console.log('✅ Twitter scraping success');

    return {
      platform: 'twitter',
      text: cleanText || 'Twitter Post',
      author: {
        name: author,
        username: author,
        url: url
      },
      url: url,
      images: images,
      thumbnail: images[0] || null,
      created_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Twitter fetch error:', error);
    throw new Error('Failed to fetch Twitter data: ' + error.message);
  }
}

async function fetchYouTubeData(url) {
  try {
    console.log('🎥 Fetching YouTube data via oEmbed...');
    
    // First try oEmbed
    const oembedUrl = `${WORKING_OEMBED_ENDPOINTS.youtube}?url=${encodeURIComponent(url)}&format=json`;
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'SocialMediaParser/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`YouTube oEmbed failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ YouTube oEmbed success:', data);

    return {
      platform: 'youtube',
      text: data.title || 'YouTube Video',
      author: {
        name: data.author_name || 'YouTube Channel',
        username: data.author_name || 'unknown',
        url: data.author_url || url
      },
      url: url,
      images: data.thumbnail_url ? [data.thumbnail_url] : [],
      // Only thumbnail, no video embed
      thumbnail: data.thumbnail_url,
      created_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('YouTube oEmbed error, trying fallback:', error);
    
    // Fallback to scraping
    try {
      const response = await fetch(url, {
        headers: SCRAPING_HEADERS,
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) ||
                        html.match(/<title>([^<]*)<\/title>/);
      
      const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
      const authorMatch = html.match(/<meta name="author" content="([^"]*)"/);

      return {
        platform: 'youtube',
        text: titleMatch?.[1] || 'YouTube Video',
        author: {
          name: authorMatch?.[1] || 'YouTube Channel',
          username: authorMatch?.[1] || 'unknown',
          url: url
        },
        url: url,
        images: imageMatch?.[1] ? [imageMatch[1]] : [],
        thumbnail: imageMatch?.[1],
        created_at: new Date().toISOString()
      };
    } catch (fallbackError) {
      console.error('YouTube fallback failed:', fallbackError);
      throw new Error('Failed to fetch YouTube data: ' + fallbackError.message);
    }
  }
}

async function fetchRedditData(url) {
  try {
    console.log('🔴 Fetching Reddit data via JSON API...');
    
    // Reddit JSON API (append .json to URL)
    let jsonUrl = url.endsWith('/') ? url + '.json' : url + '.json';
    
    // Clean URL - remove query parameters that might interfere
    jsonUrl = jsonUrl.split('?')[0] + '.json';
    
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialParser/1.0)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API failed: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Reddit returned HTML instead of JSON, trying alternate approach...');
      
      // Try with different URL format
      const baseUrl = url.replace(/\/$/, '');
      const altJsonUrl = baseUrl + '/.json';
      
      const altResponse = await fetch(altJsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocialParser/1.0)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (!altResponse.ok) {
        throw new Error(`Reddit alternate API failed: ${altResponse.status}`);
      }
      
      const altData = await altResponse.json();
      const post = altData[0]?.data?.children?.[0]?.data;
      
      if (!post) {
        throw new Error('No Reddit post data found in alternate response');
      }
      
      return buildRedditResponse(post, url);
    }
    
    const data = await response.json();
    const post = data[0]?.data?.children?.[0]?.data;
    
    if (!post) {
      throw new Error('No Reddit post data found');
    }

    return buildRedditResponse(post, url);
    
  } catch (error) {
    console.error('Reddit API error:', error);
    throw new Error('Failed to fetch Reddit data: ' + error.message);
  }
}

function buildRedditResponse(post, url) {
  console.log('✅ Reddit API success');
  
  // Get thumbnail from video or regular thumbnail
  let thumbnail = null;
  if (post.is_video || post.media?.reddit_video) {
    thumbnail = post.thumbnail !== 'self' && post.thumbnail !== 'default' ? post.thumbnail : null;
  } else if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default') {
    thumbnail = post.thumbnail;
  }

  return {
    platform: 'reddit',
    text: post.title + (post.selftext ? '\n\n' + post.selftext.slice(0, 300) + (post.selftext.length > 300 ? '...' : '') : ''),
    author: {
      name: post.author || 'Reddit User',
      username: post.author || 'unknown',
      url: `https://reddit.com/u/${post.author}`
    },
    url: url,
    images: post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? [post.url] : [],
    thumbnail: thumbnail,
    stats: {
      upvotes: post.ups || 0,
      comments: post.num_comments || 0,
      score: post.score || 0
    },
    subreddit: post.subreddit,
    created_at: new Date(post.created_utc * 1000).toISOString()
  };
}

 