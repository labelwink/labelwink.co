import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: occasions, error } = await supabase
    .from('occasions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Occasions fetch error:', error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(occasions || []);
}