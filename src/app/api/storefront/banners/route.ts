import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: banners, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Banners fetch error:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }

  return NextResponse.json(banners || []);
}