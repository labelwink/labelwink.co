import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export const revalidate = 60

// Map URL slugs → cms_content page keys
const policyMap: Record<string, string> = {
  'privacy-policy': 'privacy-policy',
  'return-refund-policy': 'return-refund-policy',
  'shipping-policy': 'shipping-policy',
  'terms-and-conditions': 'terms-and-conditions',
}

async function getPolicyData(slug: string) {
  const page = policyMap[slug]
  if (!page) return null
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cms_content')
    .select('content')
    .eq('page', page)
    .single()
  return (data?.content as { title?: string; body?: string; last_updated?: string } | null) ?? null
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getPolicyData(slug)
  if (!data) return { title: 'Policy Not Found' }
  return {
    title: `${data.title || slug} | Label Wink`,
    description: data.title || slug,
  }
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getPolicyData(slug)
  if (!data) notFound()

  const { title, body, last_updated } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-[#1b3a34] transition-colors">Home</Link>
        <span>›</span>
        <Link href="/policy/privacy-policy" className="hover:text-[#1b3a34] transition-colors">Policies</Link>
        <span>›</span>
        <span className="text-gray-700">{title || slug}</span>
      </nav>

      <h1 className="text-2xl md:text-4xl font-serif text-[#1a3a34] mb-4">{title || slug}</h1>

      {last_updated && (
        <p className="text-gray-400 text-sm mb-8">Last Updated: {formatDate(last_updated)}</p>
      )}

      <div
        className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: body || '<p>Content coming soon.</p>' }}
      />
    </div>
  )
}

export function generateStaticParams() {
  return Object.keys(policyMap).map(slug => ({ slug }))
}
