export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Missing environment variables' }, { status: 500 })
    }
    
    // Doğrudan REST API çağrısı
    const response = await fetch(`${supabaseUrl}/rest/v1/visionzcoins?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })
    
    const responseText = await response.text()
    console.log('Direct REST API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    })
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = responseText
    }
    
    return Response.json({
      success: response.ok,
      status: response.status,
      data: data,
      url: `${supabaseUrl}/rest/v1/visionzcoins`
    })
    
  } catch (error) {
    console.error('Direct test error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 