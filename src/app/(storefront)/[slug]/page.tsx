import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LeafPattern } from '@/components/ui/LeafPattern'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('pages')
    .select('title, meta_title, meta_desc')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Page Not Found' }

  const rawTitle = data.meta_title || data.title
  const cleanTitle = rawTitle
    .replace(/\s*[|—–-]\s*Label\s*Wink[a-zA-Z0-9.]*/gi, '')
    .replace(/\s*[|—–-]\s*LabelWink[a-zA-Z0-9.]*/gi, '')
    .trim();

  return {
    title: cleanTitle,
    description: data.meta_desc || '',
  }
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !page || !page.is_published) {
    notFound()
  }

  return (
    <div className="relative min-h-screen bg-[#FDF8F0] pt-8 md:pt-16">
      <LeafPattern opacity={0.06} id="dynamic-page" />
      
      {/* Content Area */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-24 relative z-10">
        <div className="relative bg-white shadow-2xl border border-labelwink-cream-border overflow-hidden">
          <LeafPattern opacity={0.04} id="dynamic-page-card" />
          <div 
            className="relative z-10 prose prose-sm md:prose-base prose-headings:text-labelwink-green prose-p:text-labelwink-green/80 prose-strong:text-labelwink-green max-w-none p-6 md:p-16 rounded-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  // Cannot use createClient() here as it reads cookies — use direct fetch instead
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pages?select=slug&is_published=eq.true`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
    },
  });
  
  if (!res.ok) return [];
  const data: { slug: string }[] = await res.json();
  return data.map(({ slug }) => ({ slug }));
}

export const revalidate = 60 // Revalidate every minute
