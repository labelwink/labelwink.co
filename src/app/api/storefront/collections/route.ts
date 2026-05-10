import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: collections, error } = await supabase
    .from('collections')
    .select('*')
    .eq('visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Collections fetch error:', error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(collections || []);
}