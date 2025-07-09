import { NextRequest, NextResponse } from 'next/server';

const REPLICATE_API_KEY = process.env.NEXT_PUBLIC_REPLICATE_API_KEY;
const REPLICATE_API_BASE_URL = 'https://api.replicate.com/v1/predictions';

export async function POST(request: NextRequest) {
  try {
    if (!REPLICATE_API_KEY) {
      return NextResponse.json(
        { error: 'Replicate API anahtarı eksik' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt parametresi gerekli' },
        { status: 400 }
      );
    }

    const response = await fetch(REPLICATE_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        input: {
          prompt: prompt,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API yanıtı:', response.status, errorText);
      return NextResponse.json(
        { error: `API isteği başarısız oldu: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const prediction = await response.json();
    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Replicate API hatası:', error);
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!REPLICATE_API_KEY) {
      return NextResponse.json(
        { error: 'Replicate API anahtarı eksik' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID parametresi gerekli' },
        { status: 400 }
      );
    }

    const response = await fetch(`${REPLICATE_API_BASE_URL}/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API isteği başarısız oldu: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const prediction = await response.json();
    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Replicate API durum kontrolü hatası:', error);
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 