import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
  
  return NextResponse.json({ 
    env_keys: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING'
    },
    count: data?.length || 0,
    data,
    error 
  })
}
