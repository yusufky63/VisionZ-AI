import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Supabase Debug Test...')
    
    // Environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Environment:', {
      url: supabaseUrl,
      keyExists: !!supabaseKey,
      keyLength: supabaseKey?.length || 0
    })
    
    // Test 1: Raw SQL query
    console.log('Test 1: Raw SQL query...')
    const { data: rawData, error: rawError } = await supabase
      .rpc('version')
    
    console.log('Raw SQL result:', { rawData, rawError })
    
    // Test 2: List all tables
    console.log('Test 2: List tables...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_type', 'BASE TABLE')
    
    console.log('Tables result:', { tables, tablesError })
    
    // Test 3: Direct SQL query
    console.log('Test 3: Direct SQL query...')
    const { data: directQuery, error: directError } = await supabase
      .rpc('exec_sql', { query: 'SELECT * FROM visionzcoins LIMIT 1' })
    
    console.log('Direct SQL result:', { directQuery, directError })
    
    // Test 4: Alternative table access
    console.log('Test 4: Alternative table access...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('visionzcoins')
      .select('*')
      .limit(1)
    
    console.log('Table check result:', { tableCheck, tableError })
    
    return Response.json({
      success: true,
      environment: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        keyLength: supabaseKey?.length || 0
      },
             tests: {
         rawQuery: { data: rawData, error: rawError },
         tables: { data: tables, error: tablesError },
         directSQL: { data: directQuery, error: directError },
         visionzcoins: { data: tableCheck, error: tableError }
       }
    })
    
  } catch (error) {
    console.error('❌ Debug test error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 