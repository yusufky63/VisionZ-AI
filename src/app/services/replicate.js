const REPLICATE_API_KEY = process.env.NEXT_PUBLIC_REPLICATE_API_KEY;
const REPLICATE_API_URL = '/api/replicate/predictions';

export async function generateImage(prompt) {
  try {
    console.log('Replicate API isteği gönderiliyor...');
    console.log('API Anahtarı:', REPLICATE_API_KEY ? 'Mevcut' : 'Eksik');
    
    if (!REPLICATE_API_KEY) {
      throw new Error('Replicate API anahtarı eksik');
    }
    
    const response = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
      throw new Error(`API isteği başarısız oldu: ${response.status} ${errorText}`);
    }

    const prediction = await response.json();
    console.log('API yanıtı başarılı:', prediction);
    return prediction;
  } catch (error) {
    console.error('Replicate API hatası:', error);
    throw error;
  }
}

export async function checkPredictionStatus(predictionId) {
  try {
    console.log('Durum kontrolü isteği gönderiliyor...');
    
    if (!REPLICATE_API_KEY) {
      throw new Error('Replicate API anahtarı eksik');
    }
    
    const response = await fetch(`${REPLICATE_API_URL}/${predictionId}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Durum kontrolü yanıtı:', response.status, errorText);
      throw new Error(`API isteği başarısız oldu: ${response.status} ${errorText}`);
    }

    const prediction = await response.json();
    
    // Durum bilgisini logla
    console.log(`Durum: ${prediction.status}`);
    
    // Durum kontrolü
    if (prediction.status === 'succeeded' && prediction.output && prediction.output.length > 0) {
      console.log('Görsel başarıyla oluşturuldu');
    } else if (prediction.status === 'failed') {
      console.error('Görsel oluşturma başarısız oldu:', prediction.error);
    } else if (prediction.status === 'canceled') {
      console.error('Görsel oluşturma iptal edildi');
    } else if (prediction.status === 'starting') {
      console.log('Görsel oluşturma başlatılıyor...');
    } else if (prediction.status === 'processing') {
      console.log('Görsel oluşturuluyor...');
    } else {
      console.log('Bilinmeyen durum:', prediction.status);
    }
    
    return prediction;
  } catch (error) {
    console.error('Replicate API durum kontrolü hatası:', error);
    throw error;
  }
} 