import { readFileSync } from 'fs'
import { join } from 'path'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 60

const policyMap: Record<string, string> = {
  'privacy-policy': 'privacy',
  'return-refund-policy': 'returns',
  'shipping-policy': 'shipping',
  'terms-and-conditions': 'terms',
}

function getPolicyData(slug: string) {
  const key = policyMap[slug]
  if (!key) return null
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'policies', `${key}.json`), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
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
  const data = getPolicyData(slug)
  if (!data) return { title: 'Policy Not Found' }
  return {
    title: `${data.title} | Label Wink`,
    description: data.description || data.title,
  }
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = getPolicyData(slug)
  if (!data) notFound()

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-[#1b3a34] transition-colors">Home</Link>
        <span>›</span>
        <Link href="/policy/privacy-policy" className="hover:text-[#1b3a34] transition-colors">Policies</Link>
        <span>›</span>
        <span className="text-gray-700">{data.title}</span>
      </nav>

      <h1 className="text-3xl font-bold text-[#1b3a34] mb-2">{data.title}</h1>
      {data.last_updated && (
        <p className="text-gray-400 text-sm mb-8">Last Updated: {formatDate(data.last_updated)}</p>
      )}

      <article className="prose prose-headings:text-[#1b3a34] max-w-none">
        <div dangerouslySetInnerHTML={{ __html: data.content }} />
      </article>
    </div>
  )
}

export function generateStaticParams() {
  return Object.keys(policyMap).map(slug => ({ slug }))
}
