import { NextRequest, NextResponse } from 'next/server';
import { generateTextWithAI, generateImageWithAI } from '../../services/aiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, category, description, name, symbol } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter required (text or image)' },
        { status: 400 }
      );
    }

    if (action === 'text') {
      // Generate text with AI
      const result = await generateTextWithAI(category || null);
      return NextResponse.json(result);
    } 
    else if (action === 'image') {
      // Generate image with AI
      if (!description) {
        return NextResponse.json(
          { error: 'Description parameter required' },
          { status: 400 }
        );
      }
      
      const result = await generateImageWithAI(
        name || 'Token', 
        symbol || 'TKN', 
        description,
        null
      );
      
      return NextResponse.json({ imageUrl: result });
    } 
    else {
      return NextResponse.json(
        { error: 'Invalid action value (must be text or image)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('AI service error:', error);
    return NextResponse.json(
      { error: 'An error occurred during processing' },
      { status: 500 }
    );
  }
}