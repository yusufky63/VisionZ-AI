/**
 * Test endpoint for Supabase connection
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT_SET',
      keyPreview: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT_SET'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not set',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      }, { status: 500 });
    }
    
    // Önce mevcut tabloları listeleyelim
    console.log('🔍 Checking available tables...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.log('❌ Could not list tables:', tablesError)
    } else {
      console.log('📋 Available tables:', tables?.map(t => t.table_name))
    }
    
    // Basit bağlantı testi
    const { data, error } = await supabase
      .from('visionzcoins')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase test error:', error);
      return NextResponse.json({
        success: false,
        error: 'Supabase connection failed',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Supabase connection successful!');
    return NextResponse.json({
      success: true,
      message: 'Supabase connection working!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 