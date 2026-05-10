import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: sections, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Sections fetch error:', error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(sections || []);
}