import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const CoinInterface = {
  id: 'string',
  name: 'string',
  symbol: 'string', 
  description: 'string',
  contract_address: 'string',
  image_url: 'string',
  creator_address: 'string',
  creator_name: 'string',
  tx_hash: 'string',
  chain_id: 'number',
  currency: 'string',
  payout_recipient: 'string',
  initial_purchase_amount: 'string',
  created_on_platform: 'boolean',
  metadata_uri: 'string',
  created_at: 'string',
  updated_at: 'string'
}
