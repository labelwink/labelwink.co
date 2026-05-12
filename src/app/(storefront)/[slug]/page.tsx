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

  return {
    title: data.meta_title || data.title,
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
    <div className="relative min-h-screen bg-[#FDF8F0]">
      <LeafPattern opacity={0.02} id="dynamic-page" />
      
      {/* Header Area */}
      <div className="bg-[#1C3829] text-white pt-24 pb-16 md:pt-32 md:pb-20 relative overflow-hidden text-center px-4">
        <LeafPattern opacity={0.05} id="dynamic-page-header" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-xl md:text-3xl font-bold font-serif text-[#c9a84c] mb-6 tracking-tight">
            {page.title}
          </h1>
          <div className="w-16 h-0.5 bg-[#c9a84c] mx-auto opacity-60"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 -mt-6 md:-mt-10 pb-24 relative z-10">
        <div 
          className="prose prose-sm md:prose-base prose-headings:text-labelwink-green prose-p:text-labelwink-green/80 prose-strong:text-labelwink-green max-w-none bg-white p-6 md:p-16 rounded-none shadow-2xl border border-labelwink-cream-border"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
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
