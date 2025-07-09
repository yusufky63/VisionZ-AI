import { NextRequest, NextResponse } from 'next/server';

const TOGETHER_API_KEY = process.env.NEXT_PUBLIC_TOGETHER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, max_tokens, temperature, top_p, frequency_penalty, presence_penalty, stop, width, height, n, negative_prompt, response_format, output_format } = body;
    
    // Check if it's an image generation request
    if (width && height && model.includes('FLUX')) {
      // Send image generation request to Together API
      const response = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'black-forest-labs/FLUX.1-schnell-Free',
          prompt: prompt,
          negative_prompt: negative_prompt || '',
          width: width || 768,
          height: height || 768,
          n: n || 1,
          response_format: response_format || 'url',
          output_format: output_format || 'png',
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error }, { status: response.status });
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // Text completion request
      // Send request to Together API
      const response = await fetch('https://api.together.xyz/v1/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
          prompt: prompt,
          max_tokens: max_tokens || 512,
          temperature: temperature || 0.7,
          top_p: top_p || 0.95,
          frequency_penalty: frequency_penalty || 0.5,
          presence_penalty: presence_penalty || 0.5,
          stop: stop || null,
          stream: false,
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error }, { status: response.status });
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Together API error:', error);
    return NextResponse.json({ error: 'An error occurred during processing' }, { status: 500 });
  }
}

// Special endpoint for images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }
    
    console.log('Image download request:', imageUrl);
    
    // Download image data - with longer timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    try {
      const imageResponse = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!imageResponse.ok) {
        console.error(`Image download error: ${imageResponse.status} - ${imageUrl}`);
        return NextResponse.json(
          { error: `Image download error: ${imageResponse.status}`, url: imageUrl }, 
          { status: imageResponse.status }
        );
      }
      
      // Get as Blob
      const imageBlob = await imageResponse.blob();
      
      if (imageBlob.size === 0) {
        console.error(`Downloaded image data is empty: ${imageUrl}`);
        return NextResponse.json(
          { error: `Downloaded image data is empty`, url: imageUrl }, 
          { status: 422 }
        );
      }
      
      console.log(`Image successfully downloaded: ${imageUrl}, size: ${imageBlob.size} bytes`);
      
      // Return image data (without CORS)
      return new NextResponse(imageBlob, {
        headers: {
          'Content-Type': imageBlob.type || 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError; // Pass to outer catch block
    }
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Return original URL and error message
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An error occurred while processing the image',
      originalUrl: new URL(request.url).searchParams.get('url')
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}